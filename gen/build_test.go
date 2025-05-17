package gen

import (
	"os"
	"path"
	"testing"

	"gopkg.in/yaml.v2"
)

func TestBuildOggSource(t *testing.T) {
	workDir, _ := GetResourcePath("../")

	// 准备构建参数，参考 generate_test.go 的模式
	args := map[string]string{
		"threading": "multi-threaded", // 默认使用单线程模式
	}

	// 调用 BuildSource 函数
	BuildOggSource(workDir, args)
}

func TestBuildBindings(t *testing.T) {

	workDir, _ := GetResourcePath("../")

	// 准备构建参数，参考 generate_test.go 的模式
	args := map[string]string{
		"threading": "multi-threaded", // 默认使用单线程模式
	}

	// 调用 BuildSource 函数
	CompileCustomCodeBindings(workDir, args)
}

func TestBuildTopoBindingsSource(t *testing.T) {
	workDir, _ := GetResourcePath("../")

	// 准备构建参数，参考 generate_test.go 的模式
	args := map[string]string{
		"threading": "multi-threaded", // 默认使用单线程模式
	}

	// 调用 BuildSource 函数
	BuildTopoBindingsSource(workDir, args)

	GenSourceTypescriptDefs(workDir)
}

func TestBuildTopoSource(t *testing.T) {
	workDir, _ := GetResourcePath("../")

	// 准备构建参数，参考 generate_test.go 的模式
	args := map[string]string{
		"threading": "multi-threaded", // 默认使用单线程模式
	}

	// 调用 BuildSource 函数
	BuildTopoSource(workDir, args)
}

func TestRunBuild(t *testing.T) {
	workDir, _ := GetResourcePath("../")

	fileName := path.Join(workDir, "gen/topo.full.yml")

	RunBuild(workDir, fileName)
}

func TestGenTypescriptDefs(t *testing.T) {
	workDir, _ := GetResourcePath("../")
	fileName := path.Join(workDir, "gen/topo.full.yml")
	data, _ := os.ReadFile(fileName)

	var buildConfig BuildConfig
	if err := yaml.Unmarshal(data, &buildConfig); err != nil {
		t.Fail()
	}

	typescriptDefinitions, err := collectTypescriptDefs(buildConfig, workDir)
	if err != nil {
		t.Fail()
	}

	generateTypescriptDefs(workDir, typescriptDefinitions, buildConfig.MainBuild.Name)
}
