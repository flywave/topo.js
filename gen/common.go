package gen

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
)

const llvmConfigPath = "/opt/homebrew/opt/llvm@15/bin/llvm-config"

func GetGlobalIncludes(workDir string) ([]string, []string) {
	var includeFiles []string
	var additionalIncludePaths []string

	// Walk OCCT directory to collect include files and paths
	err := filepath.Walk(path.Join(workDir, sourceBasePath), func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			if filterIncludeFile(info.Name()) {
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

// Placeholder for filterIncludeFile function
func filterIncludeFile(filename string) bool {
	// Implement your filter logic here
	return strings.HasSuffix(filename, ".h") || strings.HasSuffix(filename, ".hxx")
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

// getFirstSubdir 返回指定路径下的第一个子目录名
func getFirstSubdir(path string) (string, error) {
	files, err := os.ReadDir(path)
	if err != nil {
		return "", err
	}
	for _, f := range files {
		if f.IsDir() {
			return f.Name(), nil
		}
	}
	return "", fmt.Errorf("no subdirectories found in %s", path)
}

// getLLVMIncludePaths 从 llvm-config --cflags 中提取 -I 路径
func getLLVMIncludePaths() ([]string, error) {
	cmd := exec.Command(llvmConfigPath, "--cflags")

	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to execute llvm-config: %v, output: %s", err, output)
	}

	var includePaths []string
	scanner := bufio.NewScanner(strings.NewReader(string(output)))

	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)

		for _, field := range fields {
			if strings.HasPrefix(field, "-I") {
				path := strings.TrimPrefix(field, "-I")
				includePaths = append(includePaths, path)
			}
		}
	}

	return includePaths, nil
}

func GenerateIncludeArgs(ocIncludePaths, additionalIncludePaths []string) ([]string, error) {
	var args []string

	// Step 1: Add unique ocIncludePaths
	uniqueOCPaths := uniqueStrings(ocIncludePaths)
	for _, p := range uniqueOCPaths {
		args = append(args, "-I"+p)
	}

	// Step 2: Add fixed paths
	fixedPaths := []string{
		"/opt/homebrew/opt/llvm@15/include/c++/v1/",
		"/opt/homebrew/opt/llvm@15/include/c++/v1/__support/newlib/",
		"/opt/homebrew/opt/llvm@15/include/clang/",
	}

	for _, p := range fixedPaths {
		args = append(args, "-I"+p)
	}

	// Step 3: Add ocIncludePaths + additionalIncludePaths
	for _, p := range append(ocIncludePaths, additionalIncludePaths...) {
		args = append(args, "-I"+p)
	}

	return args, nil
}
