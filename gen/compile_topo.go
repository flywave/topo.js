package gen

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path"
	"runtime"
	"sync"
)

const (
	topoSourceBasePath = "/src/"
)

func writeTypescriptDefs(workDir string, targetDir string, sourceDir string, module string) error {
	dts, err := os.ReadFile(path.Join(workDir, sourceDir, module+".d.ts"))
	if err != nil {
		return err
	}

	export, err := os.ReadFile(path.Join(workDir, sourceDir, module+".export.json"))
	if err != nil {
		return err
	}

	type tsExport struct {
		Kind    string   `json:"kind"`
		Exports []string `json:"exports"`
	}

	src := []tsExport{}

	err = json.Unmarshal(export, &src)
	if err != nil {
		return err
	}

	out := &TypescriptDef{
		Dts: string(dts),
	}
	if len(src) == 1 {
		out.Exports = src[0].Exports
		out.Kind = src[0].Kind
	} else {
		defs := []struct {
			Kind    string   `json:"kind"`
			Exports []string `json:"exports"`
		}{}
		for _, v := range src {
			defs = append(defs, v)
		}

		out.Defs = defs
	}

	export, err = json.Marshal(out)
	if err != nil {
		return err
	}

	err = os.WriteFile(path.Join(workDir, targetDir, module+".d.ts.json"), export, 0644)
	if err != nil {
		return err
	}
	return nil
}

func GenSourceTypescriptDefs(workDir string) {
	writeTypescriptDefs(workDir, "build/src", topoSourceBasePath, "geometry")
	writeTypescriptDefs(workDir, "build/src", topoSourceBasePath, "primitives")
	writeTypescriptDefs(workDir, "build/src", topoSourceBasePath, "topo")
}

func BuildTopoSource(workDir string, args map[string]string) {
	if err := collectIncludePaths(workDir, oggSourceBasePath); err != nil {
		panic(err)
	}

	filesToBuild, err := collectFilesToBuild(workDir, topoSourceBasePath, false)
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
					BuildObjectFile(workDir, "build/src", topoSourceBasePath, args, file, errChan)
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
