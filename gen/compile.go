package gen

import (
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"github.com/flywave/jstopo/gen/filter"
)

func collectIncludePaths(workDir string, basePath string) error {
	includePaths = []string{
		path.Join(workDir, "/../go-topo/external/rapidjson/include"),
		path.Join(workDir, "/../go-topo/external/freetype2/include/freetype"),
		path.Join(workDir, "/../go-topo/external/freetype2/include"),
		path.Join(workDir, "/../go-topo/external/libboost/boost_1_67_0"),
		path.Join(workDir, "/../go-topo/src"),
	}

	return filepath.WalkDir(path.Join(workDir, basePath), func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			includePaths = append(includePaths, path)
		}
		return nil
	})
}

func collectFilesToBuild(workDir string, basePath string, isOgg bool) ([]string, error) {
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

		if isOgg {
			if !filter.FilterPackages(dirBase) || !filter.FilterPackages(getModuleNameByPackageName(dirBase)) {
				return nil
			}
		}

		files = append(files, path)
		return nil
	})

	return files, err
}

func BuildObjectFile(workDir string, buildDir string, basePath string, args map[string]string, srcFile string, errChan chan<- error) {
	libraryBasePath := path.Join(workDir, buildDir)

	relFile := strings.TrimPrefix(srcFile, path.Join(workDir, basePath))
	objFile := filepath.Join(libraryBasePath, relFile+".o")

	// 检查目标文件是否存在
	if objInfo, err := os.Stat(objFile); err == nil {
		// 获取源文件修改时间
		srcInfo, err := os.Stat(srcFile)
		if err != nil {
			errChan <- fmt.Errorf("failed to get source file info: %v", err)
			return
		}

		// 如果源文件没有目标文件新，则跳过编译
		if srcInfo.ModTime().Before(objInfo.ModTime()) {
			fmt.Printf("%s.o is up to date, skipping\n", relFile)
			return
		}
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
