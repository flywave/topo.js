package gen

import (
	"bufio"
	"context"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/flywave/jstopo/gen/filter"
)

const (
	sourceBasePath = "/external/ogg/src/"
)

var (
	includePaths = []string{}
	allModules   = make(map[string][]string)
)

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

func collectIncludePaths(workDir string) error {
	includePaths = []string{
		path.Join(workDir, "external/rapidjson/include"),
		path.Join(workDir, "external/freetype2/include/freetype"),
		path.Join(workDir, "external/freetype2/include"),
	}

	return filepath.WalkDir(path.Join(workDir, sourceBasePath), func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			includePaths = append(includePaths, path)
		}
		return nil
	})
}

func collectPackages(workDir string) error {
	return filepath.WalkDir(path.Join(workDir, sourceBasePath), func(path string, d fs.DirEntry, err error) error {
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

func collectFilesToBuild(workDir string) ([]string, error) {
	var files []string

	err := filepath.WalkDir(path.Join(workDir, sourceBasePath), func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !filter.FilterSourceFile(path) {
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

		if !filter.FilterPackages(dirBase) || !filter.FilterPackages(getModuleNameByPackageName(dirBase)) {
			return nil
		}

		files = append(files, path)
		return nil
	})

	return files, err
}

func BuildObjectFile(workDir string, args map[string]string, srcFile string, errChan chan<- error) {
	libraryBasePath := path.Join(workDir, "build/occt")

	relFile := strings.TrimPrefix(srcFile, path.Join(workDir, sourceBasePath))
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

func BuildSource(workDir string, args map[string]string) {
	if err := collectIncludePaths(workDir); err != nil {
		panic(err)
	}

	if err := collectPackages(workDir); err != nil {
		panic(err)
	}

	filesToBuild, err := collectFilesToBuild(workDir)
	if err != nil {
		panic(err)
	}

	// 设置Emscripten缓存目录
	if err := os.Setenv("EM_CACHE", "/opt/homebrew/opt/emscripten/libexec/cache"); err != nil {
		fmt.Fprintf(os.Stderr, "设置EM_CACHE失败: %v\n", err)
		return
	}

	// 使用带缓冲的通道和context控制并发
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup
	errChan := make(chan error, len(filesToBuild))
	fileChan := make(chan string, len(filesToBuild))

	// 启动worker协程
	workerCount := runtime.NumCPU()
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for file := range fileChan {
				select {
				case <-ctx.Done():
					return
				default:
					BuildObjectFile(workDir, args, file, errChan)
				}
			}
		}()
	}

	// 分发任务
	go func() {
		for _, file := range filesToBuild {
			select {
			case fileChan <- file:
			case <-ctx.Done():
				return
			}
		}
		close(fileChan)
	}()

	// 等待完成并处理错误
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		// 所有任务完成
	case err := <-errChan:
		// 遇到错误，取消所有任务
		fmt.Fprintf(os.Stderr, "构建过程中出错: %v\n", err)
		cancel()
	}

	// 确保所有worker完成
	wg.Wait()
	close(errChan)

	// 输出所有错误
	for err := range errChan {
		fmt.Fprintf(os.Stderr, "%v\n", err)
	}
}
