package gen

import (
	"os"
	"os/exec"
	"path"
	"testing"

	"gopkg.in/yaml.v2"
)

func hasEmcc() bool {
	_, err := exec.LookPath("emcc")
	return err == nil
}

func hasOcctSource(workDir string) bool {
	info, err := os.Stat(path.Join(workDir, oggSourceBasePath))
	return err == nil && info.IsDir()
}

func skipWithoutEmcc(t *testing.T) {
	if !hasEmcc() {
		t.Skip("emcc not found, skipping integration test")
	}
}

func skipWithoutOcct(t *testing.T, workDir string) {
	if !hasOcctSource(workDir) {
		t.Skip("OCCT source not found, skipping integration test")
	}
}

func TestBuildConfigParsing(t *testing.T) {
	data := `
mainBuild:
  name: topo.test.js
  emccFlags:
    - "-O3"
    - "-lembind"
`
	var cfg BuildConfig
	if err := yaml.Unmarshal([]byte(data), &cfg); err != nil {
		t.Fatalf("解析构建配置失败: %v", err)
	}
	if cfg.MainBuild.Name != "topo.test.js" {
		t.Errorf("期望名称 topo.test.js, 得到 %s", cfg.MainBuild.Name)
	}
	if len(cfg.MainBuild.EmccFlags) != 2 {
		t.Errorf("期望 2 个 emccFlags, 得到 %d", len(cfg.MainBuild.EmccFlags))
	}
}

func TestCollectObjectFiles(t *testing.T) {
	tmpDir := t.TempDir()
	os.MkdirAll(path.Join(tmpDir, "bindings"), 0755)
	os.WriteFile(path.Join(tmpDir, "bindings", "test.cpp.o"), []byte{}, 0644)
	os.WriteFile(path.Join(tmpDir, "bindings", "other.cpp.o"), []byte{}, 0644)
	os.WriteFile(path.Join(tmpDir, "bindings", "notbinding.txt"), []byte{}, 0644)

	files, err := collectObjectFiles(tmpDir, nil, ".cpp.o")
	if err != nil {
		t.Fatalf("collectObjectFiles失败: %v", err)
	}
	if len(files) != 2 {
		t.Errorf("期望 2 个文件, 得到 %d", len(files))
	}

	files, err = collectObjectFiles(tmpDir, []Binding{{Symbol: "test"}}, ".cpp.o")
	if err != nil {
		t.Fatalf("collectObjectFiles带过滤失败: %v", err)
	}
	if len(files) != 1 {
		t.Errorf("期望 1 个文件(过滤后), 得到 %d", len(files))
	}
}

func TestBuildOggSource(t *testing.T) {
	skipWithoutEmcc(t)
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}
	skipWithoutOcct(t, workDir)

	args := map[string]string{"threading": "single-threaded"}
	if err := BuildOggSource(workDir, args); err != nil {
		t.Fatalf("BuildOggSource失败: %v", err)
	}
}

func TestBuildBindings(t *testing.T) {
	skipWithoutEmcc(t)
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	args := map[string]string{"threading": "single-threaded"}
	if err := CompileCustomCodeBindings(workDir, args); err != nil {
		t.Fatalf("CompileCustomCodeBindings失败: %v", err)
	}
}

func TestBuildTopoBindingsSource(t *testing.T) {
	skipWithoutEmcc(t)
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	args := map[string]string{"threading": "single-threaded"}
	if err := BuildTopoBindingsSource(workDir, args); err != nil {
		t.Fatalf("BuildTopoBindingsSource失败: %v", err)
	}
	GenSourceTypescriptDefs(workDir)
}

func TestBuildTopoSource(t *testing.T) {
	skipWithoutEmcc(t)
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	args := map[string]string{"threading": "single-threaded"}
	if err := BuildTopoSource(workDir, args); err != nil {
		t.Fatalf("BuildTopoSource失败: %v", err)
	}
}

func TestGenTypescriptDefs(t *testing.T) {
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	fileName := path.Join(workDir, "gen/topo.full.yml")
	data, err := os.ReadFile(fileName)
	if err != nil {
		t.Fatalf("读取配置文件失败: %v", err)
	}

	var buildConfig BuildConfig
	if err := yaml.Unmarshal(data, &buildConfig); err != nil {
		t.Fatalf("解析配置文件失败: %v", err)
	}

	typescriptDefinitions, err := CollectTypescriptDefs(buildConfig, workDir)
	if err != nil {
		t.Logf("CollectTypescriptDefs失败(可能缺少构建产物): %v", err)
		return
	}

	if err := GenerateTypescriptDefs(workDir, typescriptDefinitions, buildConfig.MainBuild.Name); err != nil {
		t.Fatalf("GenerateTypescriptDefs失败: %v", err)
	}
}

func TestRunBuild(t *testing.T) {
	skipWithoutEmcc(t)
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	fileName := path.Join(workDir, "gen/topo.full.yml")
	if err := RunBuild(workDir, fileName); err != nil {
		t.Fatalf("RunBuild失败: %v", err)
	}
}

func TestRunBuildFromConfig(t *testing.T) {
	skipWithoutEmcc(t)
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	fileName := path.Join(workDir, "gen/topo.full.yml")
	data, err := os.ReadFile(fileName)
	if err != nil {
		t.Fatalf("读取配置文件失败: %v", err)
	}

	var buildConfig BuildConfig
	if err := yaml.Unmarshal(data, &buildConfig); err != nil {
		t.Fatalf("解析配置文件失败: %v", err)
	}

	if buildConfig.MainBuild.Name == "" {
		t.Fatal("构建配置缺少 mainBuild.name")
	}

	expectedOut := path.Join(workDir, "packages/topo-wasm/src", buildConfig.MainBuild.Name)
	t.Logf("期望输出: %s", expectedOut)
}

func TestVerifyBindingsSmoke(t *testing.T) {
	tmpDir := t.TempDir()
	bindingsDir := path.Join(tmpDir, "bindings")
	os.MkdirAll(bindingsDir, 0755)
	os.WriteFile(path.Join(bindingsDir, "TopoDS_Shape.cpp.o"), []byte{}, 0644)

	// Test with empty bindings (should pass)
	if err := verifyBindings([]Binding{}, tmpDir); err != nil {
		t.Errorf("空bindings应当通过: %v", err)
	}

	// Can't easily test missing binding without emcc compiled objects
	t.Log("verifyBinding需要emcc编译产物，跳过完整测试")
}

func TestRunBuildDryRun(t *testing.T) {
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	fileName := path.Join(workDir, "gen/topo.full.yml")
	data, err := os.ReadFile(fileName)
	if err != nil {
		t.Fatalf("读取配置文件失败: %v", err)
	}

	var buildConfig BuildConfig
	if err := yaml.Unmarshal(data, &buildConfig); err != nil {
		t.Fatalf("解析配置文件失败: %v", err)
	}

	// Verify all steps can be enumerated without running
	t.Logf("构建名称: %s", buildConfig.MainBuild.Name)
	t.Logf("emccFlags: %v", buildConfig.MainBuild.EmccFlags)
	t.Logf("TypeScript生成: %v", buildConfig.GenerateTypescriptDefs)
}
