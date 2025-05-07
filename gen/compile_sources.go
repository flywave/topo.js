package gen

import (
	"bufio"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

const (
	sourceBasePath = "/occt/src/"
)

var (
	includePaths = []string{
		"/rapidjson/include",
		"/freetype/include/freetype",
		"/freetype/include",
	}
	allModules = make(map[string][]string)
)

func filterPackages(name string) bool {
	// 示例：屏蔽某些包
	blocked := map[string]bool{
		"AdvApp2Var":   true,
		"BRepGProp":    true,
		"BRepMesh":     true,
		"BSplSLib":     true,
		"CPnts":        true,
		"DDF":          true,
		"Draw":         true,
		"Graphic3d":    true,
		"IFSelect":     true,
		"Interface":    true,
		"MoniTool":     true,
		"NCollection":  true,
		"OpenGl":       true,
		"OSD":          true,
		"ShapeProcess": true,
		"Standard":     true,
		"StdObjMgt":    true,
		"TDF":          true,
	}

	return !blocked[name]
}

func filterSourceFile(file string) bool {
	// 示例：只允许 .cxx 文件
	return strings.HasSuffix(file, ".cxx")
}

func getModuleNameByPackageName(pkgName string) string {
	for moduleName, packages := range allModules {
		for _, p := range packages {
			if p == pkgName {
				return moduleName
			}
		}
	}
	return ""
}

func collectIncludePaths() error {
	return filepath.WalkDir(sourceBasePath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			includePaths = append(includePaths, path)
		}
		return nil
	})
}

func collectPackages() error {
	return filepath.WalkDir(sourceBasePath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			pkgFile := filepath.Join(path, "PACKAGES")
			if _, err := os.Stat(pkgFile); err == nil {
				moduleName := filepath.Base(path)
				file, err := os.Open(pkgFile)
				if err != nil {
					return err
				}
				defer file.Close()

				var packages []string
				scanner := bufio.NewScanner(file)
				for scanner.Scan() {
					line := strings.TrimSpace(scanner.Text())
					if line != "" {
						packages = append(packages, line)
					}
				}
				allModules[moduleName] = packages
			}
		}
		return nil
	})
}

func collectFilesToBuild() ([]string, error) {
	var files []string

	err := filepath.WalkDir(sourceBasePath, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !filterSourceFile(path) {
			return nil
		}

		dirBase := filepath.Base(filepath.Dir(path))
		if strings.Contains(path, "/src/") {
			dirParts := strings.SplitAfterN(path, "/src/", 2)
			if len(dirParts) > 1 {
				dirRel := dirParts[1]
				if parts := strings.SplitN(dirRel, "/", 2); len(parts) > 0 {
					dirBase = parts[0]
				}
			}
		}

		if !filterPackages(dirBase) || !filterPackages(getModuleNameByPackageName(dirBase)) {
			return nil
		}

		files = append(files, path)
		return nil
	})

	return files, err
}

func BuildObjectFile(args map[string]string, srcFile string, wg *sync.WaitGroup, errChan chan<- error) {
	defer wg.Done()

	relFile := strings.TrimPrefix(srcFile, sourceBasePath)
	objFile := filepath.Join(libraryBasePath, relFile+".o")

	if _, err := os.Stat(objFile); err == nil {
		fmt.Printf("%s.o already exists, skipping\n", relFile)
		return
	}

	os.MkdirAll(filepath.Dir(objFile), 0755)

	cmdArgs := []string{
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
		cmdArgs = append(cmdArgs, "-pthread")
	}

	for _, inc := range includePaths {
		cmdArgs = append(cmdArgs, "-I"+inc)
	}

	cmdArgs = append(cmdArgs, "-c", srcFile, "-o", objFile)

	cmd := exec.Command(cmdArgs[0], cmdArgs[1:]...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	fmt.Printf("Building %s\n", relFile)
	if err := cmd.Run(); err != nil {
		errChan <- fmt.Errorf("failed to build %s: %v", srcFile, err)
	}
}

func BuildSource(args map[string]string) {
	if err := collectIncludePaths(); err != nil {
		panic(err)
	}

	if err := collectPackages(); err != nil {
		panic(err)
	}

	filesToBuild, err := collectFilesToBuild()
	if err != nil {
		panic(err)
	}

	var wg sync.WaitGroup
	errChan := make(chan error, len(filesToBuild))

	filesToBuildChan := make(chan string, len(filesToBuild))

	concurrency := runtime.NumCPU()
	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for file := range filesToBuildChan {
				BuildObjectFile(args, file, &wg, errChan)
			}
		}()
	}

	for _, f := range filesToBuild {
		filesToBuildChan <- f
	}
	close(filesToBuildChan)

	wg.Wait()
	close(errChan)

	for err := range errChan {
		if err != nil {
			fmt.Fprintf(os.Stderr, "%v\n", err)
		}
	}
}
