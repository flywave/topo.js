package gen

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
)

const (
	topoBindingsBasePath = "/src/"
)

func writeTypescriptDefs(workDir string, targetDir string, sourceDir string, module string) error {
	dts, err := os.ReadFile(path.Join(workDir, sourceDir, module+".d.ts"))
	if err != nil {
		return err
	}

	export, err := os.ReadFile(path.Join(workDir, sourceDir, module+".export.json"))
	if err != nil {
		return err
	}

	type tsExport struct {
		Kind    string   `json:"kind"`
		Exports []string `json:"exports"`
	}

	src := []tsExport{}

	err = json.Unmarshal(export, &src)
	if err != nil {
		return err
	}

	out := &TypescriptDef{
		Dts: string(dts),
	}
	if len(src) == 1 {
		out.Exports = src[0].Exports
		out.Kind = src[0].Kind
	} else {
		defs := []struct {
			Kind    string   `json:"kind"`
			Exports []string `json:"exports"`
		}{}
		for _, v := range src {
			defs = append(defs, v)
		}

		out.Defs = defs
	}

	export, err = json.Marshal(out)
	if err != nil {
		return err
	}

	err = os.WriteFile(path.Join(workDir, targetDir, module+".d.ts.json"), export, 0644)
	if err != nil {
		return err
	}
	return nil
}

func GenSourceTypescriptDefs(workDir string) {
	writeTypescriptDefs(workDir, "build/src", topoBindingsBasePath, "geometry")
	writeTypescriptDefs(workDir, "build/src", topoBindingsBasePath, "primitives")
	writeTypescriptDefs(workDir, "build/src", topoBindingsBasePath, "topo")
	writeTypescriptDefs(workDir, "build/src", topoBindingsBasePath, "assembly")
	writeTypescriptDefs(workDir, "build/src", topoBindingsBasePath, "sketch")
	writeTypescriptDefs(workDir, "build/src", topoBindingsBasePath, "workplane")
}

func BuildTopoBindingsSource(workDir string, args map[string]string) error {
	if err := collectIncludePaths(workDir, oggSourceBasePath); err != nil {
		return fmt.Errorf("收集topo绑定包含路径失败: %w", err)
	}

	filesToBuild, err := collectFilesToBuild(workDir, topoBindingsBasePath, false)
	if err != nil {
		return fmt.Errorf("收集topo绑定源文件失败: %w", err)
	}

	runWorkers(workDir, "build/src", topoBindingsBasePath, args, filesToBuild, BuildObjectFile)
	return nil
}
