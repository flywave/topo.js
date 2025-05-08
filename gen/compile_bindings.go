package gen

import (
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

type ExportItem struct {
	Name string
	Kind string
}

func CompileCustomCodeBindings(workDir string, args map[string]string) error {
	libraryBasePath := path.Join(workDir, "src/bindings")

	dir := filepath.Join(libraryBasePath, "myMain.h")
	var filesToBuild []string

	err := filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && strings.HasSuffix(d.Name(), ".cpp") {
			filesToBuild = append(filesToBuild, path)
		}
		return nil
	})
	if err != nil {
		return err
	}

	sortStrings(filesToBuild)

	// Build concurrently using goroutines
	var wg sync.WaitGroup
	concurrency := runtime.NumCPU() / 1
	jobs := make(chan string, len(filesToBuild))
	errs := make(chan error, len(filesToBuild))

	// Start workers
	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for file := range jobs {
				if err := buildOneFile(workDir, args, file); err != nil {
					errs <- err
				}
			}
		}()
	}

	// Send jobs
	for _, file := range filesToBuild {
		jobs <- file
	}
	close(jobs)

	// Wait for all workers to finish
	go func() {
		wg.Wait()
		close(errs)
	}()

	// Collect errors
	var firstErr error
	for err := range errs {
		if firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

func buildOneFile(workDir string, args map[string]string, item string) error {
	objFile := item + ".o"
	if _, err := os.Stat(objFile); err == nil {
		fmt.Printf("file %s already exists, skipping\n", objFile)
		return nil
	}

	fmt.Printf("building %s\n", item)

	// Prepare command line arguments
	command := []string{
		"emcc",
		"-flto",
		"-fexceptions",
		"-sDISABLE_EXCEPTION_CATCHING=0",
		"-DIGNORE_NO_ATOMICS=1",
		"-DOCCT_NO_PLUGINS",
		"-frtti",
		"-DHAVE_RAPIDJSON",
		"-Os",
	}

	if args["threading"] == "multi-threaded" {
		command = append(command, "-pthread")
	}

	ocIncludePaths, additionalIncludePaths := GetGlobalIncludes(workDir)

	// Add include paths
	for _, inc := range append(ocIncludePaths, additionalIncludePaths...) {
		command = append(command, "-I"+inc)
	}

	// Compile command
	command = append(command, "-c", item, "-o", objFile)

	// Run the command
	cmd := exec.Command(command[0], command[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

// Helper to sort strings
func sortStrings(s []string) {
	for i := 0; i < len(s)-1; i++ {
		for j := i + 1; j < len(s); j++ {
			if s[i] > s[j] {
				s[i], s[j] = s[j], s[i]
			}
		}
	}
}
