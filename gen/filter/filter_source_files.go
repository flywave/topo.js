package filter

import "strings"

func FilterSourceFile(filename string) bool {
	// Skip Objective-C++ files
	if strings.HasSuffix(filename, ".mm") {
		return false
	}

	// Allow C++ and C source files
	if strings.HasSuffix(filename, ".cxx") ||
		strings.HasSuffix(filename, ".cpp") ||
		strings.HasSuffix(filename, ".c") {
		return true
	}

	return false
}
