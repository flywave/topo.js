package filter

import "strings"

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
