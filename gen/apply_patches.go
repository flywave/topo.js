package gen

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// ApplyPatches 遍历指定目录中的所有 .patch 文件并尝试打补丁
func ApplyPatches(workDir string, patchDir string) error {
	// 切换到根目录
	if err := os.Chdir(workDir); err != nil {
		return fmt.Errorf("failed to change directory to %s: %v", workDir, err)
	}

	// 遍历 patch 目录
	err := filepath.WalkDir(patchDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !d.IsDir() && strings.HasSuffix(d.Name(), ".patch") {
			fmt.Printf("applying patch %s\n", path)

			// 执行命令：patch -p0 < filename
			cmd := exec.Command("sh", "-c", fmt.Sprintf("patch -p0 < %q", path))
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr

			if err := cmd.Run(); err != nil {
				return fmt.Errorf("could not apply patch %q: %v", path, err)
			}

			fmt.Println("...done applying patch")
		}
		return nil
	})

	return err
}
