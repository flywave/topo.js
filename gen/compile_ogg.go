package gen

import (
	"bufio"
	"context"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
)

const (
	oggSourceBasePath = "/external/ogg/src/"
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

func collectPackages(workDir string, basePath string) error {
	return filepath.WalkDir(path.Join(workDir, basePath), func(path string, d fs.DirEntry, err error) error {
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

func BuildOggSource(workDir string, args map[string]string) {
	if err := collectIncludePaths(workDir, oggSourceBasePath); err != nil {
		panic(err)
	}

	if err := collectPackages(workDir, oggSourceBasePath); err != nil {
		panic(err)
	}

	filesToBuild, err := collectFilesToBuild(workDir, oggSourceBasePath, true)
	if err != nil {
		panic(err)
	}

	if runtime.GOOS == "darwin" {
		// 设置Emscripten缓存目录
		if err := os.Setenv("EM_CACHE", "/opt/homebrew/opt/emscripten/libexec/cache"); err != nil {
			fmt.Fprintf(os.Stderr, "设置EM_CACHE失败: %v\n", err)
			return
		}
	} else {
		// 设置Emscripten缓存目录
		if err := os.Setenv("EM_CACHE", "/usr/share/emscripten/cache"); err != nil {
			fmt.Fprintf(os.Stderr, "设置EM_CACHE失败: %v\n", err)
			return
		}
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
					BuildObjectFile(workDir, "build/occt", oggSourceBasePath, args, file, errChan)
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
