package gen

import (
	"context"
	"fmt"
	"os"
	"runtime"
	"sync"
)

func setEmCache() {
	if runtime.GOOS == "darwin" {
		if err := os.Setenv("EM_CACHE", "/opt/homebrew/opt/emscripten/libexec/cache"); err != nil {
			fmt.Fprintf(os.Stderr, "设置EM_CACHE失败: %v\n", err)
		}
	} else {
		if err := os.Setenv("EM_CACHE", "/usr/share/emscripten/cache"); err != nil {
			fmt.Fprintf(os.Stderr, "设置EM_CACHE失败: %v\n", err)
		}
	}
}

func runWorkers(workDir string, buildDir string, basePath string, args map[string]string, files []string, buildFn func(string, string, string, map[string]string, string, chan<- error)) {
	setEmCache()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var wg sync.WaitGroup
	errChan := make(chan error, len(files))
	fileChan := make(chan string, len(files))

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
					buildFn(workDir, buildDir, basePath, args, file, errChan)
				}
			}
		}()
	}

	go func() {
		for _, file := range files {
			select {
			case fileChan <- file:
			case <-ctx.Done():
				return
			}
		}
		close(fileChan)
	}()

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case err := <-errChan:
		fmt.Fprintf(os.Stderr, "构建过程中出错: %v\n", err)
		cancel()
	}

	wg.Wait()
	close(errChan)

	for err := range errChan {
		fmt.Fprintf(os.Stderr, "%v\n", err)
	}
}
