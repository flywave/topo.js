package gen

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/flywave/jstopo/gen/filter"
)

func CopyTopoSource(workDir string) error {
	srcDir := filepath.Join(workDir, topoSourceBasePath)
	if _, err := os.Stat(srcDir); os.IsNotExist(err) {
		return fmt.Errorf("topo源目录不存在: %s", srcDir)
	}

	files, err := collectTopoFilesToBuild(workDir, topoSourceBasePath)
	if err != nil {
		return fmt.Errorf("收集topo源文件失败: %w", err)
	}

	filter.CleanTopoSource(workDir)

	for _, srcFile := range files {
		relFile := strings.TrimPrefix(srcFile, filepath.Join(workDir, topoSourceBasePath))
		dstFile := filepath.Join(workDir, "build/src", relFile)

		if err := os.MkdirAll(filepath.Dir(dstFile), 0755); err != nil {
			return fmt.Errorf("创建目录失败 %s: %w", filepath.Dir(dstFile), err)
		}

		input, err := os.ReadFile(srcFile)
		if err != nil {
			return fmt.Errorf("读取源文件失败 %s: %w", srcFile, err)
		}

		if err := os.WriteFile(dstFile, input, 0644); err != nil {
			return fmt.Errorf("写入目标文件失败 %s: %w", dstFile, err)
		}
	}

	fmt.Printf("已复制 %d 个topo源文件\n", len(files))
	return nil
}
