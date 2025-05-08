package gen

import (
	"testing"
)

func TestBuildSource(t *testing.T) {
	workDir, _ := GetResourcePath("../")

	// 准备构建参数，参考 generate_test.go 的模式
	args := map[string]string{
		"threading": "single-threaded", // 默认使用单线程模式
	}

	// 调用 BuildSource 函数
	BuildSource(workDir, args)
}

func TestBuildBindings(t *testing.T) {

	workDir, _ := GetResourcePath("../")

	// 准备构建参数，参考 generate_test.go 的模式
	args := map[string]string{
		"threading": "single-threaded", // 默认使用单线程模式
	}

	// 调用 BuildSource 函数
	CompileCustomCodeBindings(workDir, args)
}
