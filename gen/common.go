package gen

import (
	"fmt"
	"os"
	"path"
	"path/filepath"
	"runtime"

	"github.com/flywave/jstopo/gen/filter"
)

func GetGlobalIncludes(workDir string) ([]string, []string) {
	var includeFiles []string
	var additionalIncludePaths []string

	// Walk OCCT directory to collect include files and paths
	err := filepath.Walk(path.Join(workDir, oggSourceBasePath), func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			if filter.FilterIncludeFile(info.Name()) {
				includeFiles = append(includeFiles, path)
			}
		} else {
			additionalIncludePaths = append(additionalIncludePaths, path)
		}
		return nil
	})

	if err != nil {
		fmt.Printf("Error walking OCCT directory: %v\n", err)
	}

	return includeFiles, additionalIncludePaths
}

// uniqueStrings 去重字符串切片
func uniqueStrings(input []string) []string {
	seen := make(map[string]bool)
	var result []string
	for _, s := range input {
		if !seen[s] {
			seen[s] = true
			result = append(result, s)
		}
	}
	return result
}

var (
	additionalIncludePaths = []string{
		"/external/rapidjson/include",
		"/external/freetype2/include/freetype",
		"/external/freetype2/include",
		"/external/libboost/boost_1_67_0",
	}
)

func GenerateIncludeArgs(workDir string, ocIncludePaths []string) ([]string, error) {
	var args []string

	// Step 2: Add fixed paths
	fixedPaths := []string{}

	for _, p := range fixedPaths {
		args = append(args, "-I"+p)
	}

	if runtime.GOOS == "darwin" {
		args = append(args, "-isystem/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include/c++/v1")
		args = append(args, "-isystem/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/17/include")
		args = append(args, "-isystem/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/usr/include")
		args = append(args, "-isystem/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include")
		args = append(args, "-isystem/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk/System/Library/Frameworks")
	} else if runtime.GOOS == "linux" {
		args = append(args, "-I/usr/share/emscripten/system/include")
		args = append(args, "-I/usr/share/emscripten/system/lib/libcxx/include")
		args = append(args, "-I/usr/share/emscripten/system/lib/libcxx/include/__support/newlib/")
		args = append(args, "-I/usr/lib/llvm-15/include/clang")
	}

	// Step 1: Add unique ocIncludePaths
	uniqueOCPaths := uniqueStrings(ocIncludePaths)
	for _, p := range uniqueOCPaths {
		args = append(args, "-I"+p)
	}

	// Step 3: Add additionalIncludePaths
	for _, p := range additionalIncludePaths {
		args = append(args, "-I"+path.Join(workDir, p))
	}

	args = append(args, "-Wno-deprecated-declarations")

	return args, nil
}
