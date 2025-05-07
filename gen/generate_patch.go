package gen

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// copyDir 复制目录内容（不包含自身目录）
func copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() && path != src {
			rel, _ := strings.CutPrefix(path, src+"/")
			return os.MkdirAll(filepath.Join(dst, rel), info.Mode())
		} else if !info.IsDir() {
			rel, _ := strings.CutPrefix(path, src+"/")
			return copyFile(path, filepath.Join(dst, rel))
		}
		return nil
	})
}

// copyFile 拷贝单个文件
func copyFile(src, dst string) error {
	s, err := os.Open(src)
	if err != nil {
		return err
	}
	defer s.Close()

	d, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer d.Close()

	_, err = io.Copy(d, s)
	return err
}

// generatePatch 生成补丁文件
func GeneratePatch(srcDir string, destDir string) error {
	err := os.MkdirAll(destDir, 0755)
	if err != nil {
		return err
	}

	// 将子目录内容移动出来
	if err := copyDir(srcDir, destDir); err != nil {
		return fmt.Errorf("copyDir failed: %v", err)
	}

	// 移动隐藏文件（如 .git、.travis.yml 等）
	err = filepath.Walk(srcDir, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if strings.HasPrefix(info.Name(), ".") {
			rel, _ := strings.CutPrefix(path, srcDir+"/")
			return copyFile(path, filepath.Join(destDir, rel))
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("copy hidden files failed: %v", err)
	}

	// 创建补丁输出目录
	if err := os.MkdirAll("/opencascade.js/src/patches", 0755); err != nil {
		return err
	}

	// 使用 diff 命令生成补丁
	cmd := exec.Command(
		"diff",
		"-ruN",
		"/occt-original/",
		"/occt/",
		">",
		"/opencascade.js/src/patches/newPatch.patch",
	)

	// 注意：Go 中不能直接使用 shell 重定向 >，需要设置 Cmd.Stdout
	outFile, err := os.Create("/opencascade.js/src/patches/newPatch.patch")
	if err != nil {
		return err
	}
	defer outFile.Close()

	cmd.Stdout = outFile
	cmd.Stderr = os.Stderr

	fmt.Println("Generating patch...")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("diff command failed: %v", err)
	}

	fmt.Println("Patch generated successfully.")
	return nil
}
