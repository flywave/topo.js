package gen

import (
	"fmt"
	"io/fs"
	"path"
	"path/filepath"
	"strings"
)

const (
	nloptSourceBasePath = "/../go-topo/external/nlopt/src/"
)

// collectNloptFilesToBuild walks the NLopt source tree and collects C/C++ files
// for compilation. Excludes: octave/, swig/, test files, and the standalone
// nlopt-getopt.c (reimplements system getopt, not needed for library use).
func collectNloptFilesToBuild(workDir string, basePath string) ([]string, error) {
	var files []string

	err := filepath.WalkDir(path.Join(workDir, basePath), func(filePath string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}

		baseName := filepath.Base(filePath)

		// Skip test files (*test*, *tst*, *tstc*)
		if strings.Contains(baseName, "test") || strings.Contains(baseName, "tst") {
			return nil
		}

		// Allow C and C++ source files
		ext := filepath.Ext(baseName)
		if ext != ".c" && ext != ".cc" && ext != ".cpp" {
			return nil
		}

		// Exclude octave/ and swig/ directories
		relPath := strings.TrimPrefix(filePath, path.Join(workDir, basePath))
		if strings.Contains(relPath, "/octave/") || strings.Contains(relPath, "\\octave\\") {
			return nil
		}
		if strings.Contains(relPath, "/swig/") || strings.Contains(relPath, "\\swig\\") {
			return nil
		}

		// Exclude nlopt-getopt.c (reimplements system getopt, not needed for library use)
		if baseName == "nlopt-getopt.c" {
			return nil
		}

		// Exclude DIRparallel.c (requires MPI-like Fortran functions not available in WASM)
		if baseName == "DIRparallel.c" {
			return nil
		}

		// Exclude stogo test/standalone programs (not part of nlopt library)
		if baseName == "prog.cc" || baseName == "tst.cc" {
			return nil
		}

		files = append(files, filePath)
		return nil
	})

	return files, err
}

// BuildNloptSource compiles all NLopt C/C++ source files to object files.
// Objects land under build/src/nlopt/** which is already covered by the
// linker's glob at gen/build.go:189 (build/src/**/*.o).
func BuildNloptSource(workDir string, args map[string]string) error {
	if err := collectIncludePaths(workDir, nloptSourceBasePath); err != nil {
		return fmt.Errorf("收集nlopt包含路径失败: %w", err)
	}

	// WASM config header (nlopt_config.h) + C++ wrapper (nlopt.hpp)
	includePaths = append(includePaths,
		path.Join(workDir, "external/nlopt-wasm"),
	)

	filesToBuild, err := collectNloptFilesToBuild(workDir, nloptSourceBasePath)
	if err != nil {
		return fmt.Errorf("收集nlopt源文件失败: %w", err)
	}

	fmt.Printf("NLopt: compiling %d source files\n", len(filesToBuild))

	return runWorkers(workDir, "build/src/nlopt", nloptSourceBasePath, args, filesToBuild, BuildObjectFile)
}
