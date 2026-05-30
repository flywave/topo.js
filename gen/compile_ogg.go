package gen

import (
	"bufio"
	"fmt"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"strings"
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

func BuildOggSource(workDir string, args map[string]string) error {
	if err := collectIncludePaths(workDir, oggSourceBasePath); err != nil {
		return fmt.Errorf("收集OCCT包含路径失败: %w", err)
	}

	if err := collectPackages(workDir, oggSourceBasePath); err != nil {
		return fmt.Errorf("收集OCCT包失败: %w", err)
	}

	filesToBuild, err := collectFilesToBuild(workDir, oggSourceBasePath, true)
	if err != nil {
		return fmt.Errorf("收集OCCT源文件失败: %w", err)
	}

	runWorkers(workDir, "build/occt", oggSourceBasePath, args, filesToBuild, BuildObjectFile)
	return nil
}
