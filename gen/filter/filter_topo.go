package filter

import (
	"os"
	"path/filepath"
	"strings"
)

func FilterTopoFile(fileName string) bool {

	if strings.HasSuffix(fileName, "_c_api.cc") {
		return false
	}

	if strings.HasSuffix(fileName, "_test.cc") {
		return false
	}

	excludedFiles := []string{
		"dxf_shape.cc",
		"dxf.cc",
		"ifc.cc",
	}

	for _, fname := range excludedFiles {
		if fileName == fname {
			return false
		}
	}
	return true
}

func CleanTopoSource(workDir string) error {
	buildSrc := filepath.Join(workDir, "../build/src")
	return filepath.WalkDir(buildSrc, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() {
			return nil
		}
		name := d.Name()
		ext := filepath.Ext(name)
		if ext == ".o" {
			baseName := strings.TrimSuffix(name, ext)
			baseName = strings.TrimSuffix(baseName, ".gxx")
			baseName = strings.TrimSuffix(baseName, ".cc")
			baseName = strings.TrimSuffix(baseName, ".cpp")
			baseName = strings.TrimSuffix(baseName, ".cxx")
			if !FilterTopoFile(baseName + ".cc") {
				os.Remove(path)
			}
		}
		return nil
	})
}
