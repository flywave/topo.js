package gen

import (
	"fmt"
	"io/fs"
	"path"
	"path/filepath"

	"github.com/flywave/jstopo/gen/filter"
)

const (
	topoSourceBasePath = "/../go-topo/src/"
)

func collectTopoFilesToBuild(workDir string, basePath string) ([]string, error) {
	var files []string

	err := filepath.WalkDir(path.Join(workDir, basePath), func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		if !filter.FilterSourceFile(path) {
			return nil
		}

		baseName := filepath.Base(path)
		if !filter.FilterTopoFile(baseName) {
			return nil
		}

		files = append(files, path)
		return nil
	})

	return files, err
}

func BuildTopoSource(workDir string, args map[string]string) error {
	if err := collectIncludePaths(workDir, oggSourceBasePath); err != nil {
		return fmt.Errorf("收集topo包含路径失败: %w", err)
	}

	filesToBuild, err := collectTopoFilesToBuild(workDir, topoSourceBasePath)
	if err != nil {
		return fmt.Errorf("收集topo源文件失败: %w", err)
	}

	runWorkers(workDir, "build/src", topoSourceBasePath, args, filesToBuild, BuildObjectFile)
	return nil
}
