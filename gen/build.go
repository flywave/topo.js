package gen

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v2"
)

type BuildConfig struct {
	MainBuild              BuildSpec   `yaml:"mainBuild"`
	ExtraBuilds            []BuildSpec `yaml:"extraBuilds"`
	AdditionalCppCode      string      `yaml:"additionalCppCode"`
	GenerateTypescriptDefs bool        `yaml:"generateTypescriptDefinitions"`
}

type BuildSpec struct {
	Name               string    `yaml:"name"`
	Bindings           []Binding `yaml:"bindings"`
	AdditionalBindCode string    `yaml:"additionalBindCode"`
	EmccFlags          []string  `yaml:"emccFlags"`
}

type Binding struct {
	Symbol string `yaml:"symbol"`
}

type TypescriptDef struct {
	Dts     string   `json:".d.ts"`
	Kind    string   `json:"kind"`
	Exports []string `json:"exports"`
	Defs    []struct {
		Kind    string   `json:"kind"`
		Exports []string `json:"exports"`
	} `json:"defs"`
}

func RunBuild(workDir string, filename string) error {
	data, err := os.ReadFile(filename)
	if err != nil {
		return err
	}

	var buildConfig BuildConfig
	if err := yaml.Unmarshal(data, &buildConfig); err != nil {
		return err
	}

	if err := os.RemoveAll(workDir + "/bindings/myMain.h"); err != nil && !os.IsNotExist(err) {
		return err
	}

	if err := GenerateCustomCodeBindings(workDir, buildConfig.AdditionalCppCode); err != nil {
		return err
	}

	threading := os.Getenv("threading")
	if err := CompileCustomCodeBindings(workDir, map[string]string{"threading": threading}); err != nil {
		return err
	}

	if err := verifyBindings(buildConfig.MainBuild.Bindings, workDir); err != nil {
		return err
	}

	for _, extraBuild := range buildConfig.ExtraBuilds {
		if err := verifyBindings(extraBuild.Bindings, workDir); err != nil {
			return err
		}
	}

	typescriptDefinitions, err := CollectTypescriptDefs(buildConfig, workDir)
	if err != nil {
		return err
	}

	if err := runBuild(workDir, buildConfig.MainBuild); err != nil {
		return err
	}

	for _, extraBuild := range buildConfig.ExtraBuilds {
		if err := runBuild(workDir, extraBuild); err != nil {
			return err
		}
	}

	if buildConfig.GenerateTypescriptDefs {
		if err := GenerateTypescriptDefs(workDir, typescriptDefinitions, buildConfig.MainBuild.Name); err != nil {
			return err
		}
	}

	return nil
}

func verifyBinding(binding Binding, libraryBasePath string) (bool, error) {
	err := filepath.Walk(libraryBasePath+"/bindings", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".cpp.o") && binding.Symbol == info.Name()[:len(info.Name())-6] {
			return nil
		}
		return nil
	})
	return err == nil, err
}

func verifyBindings(bindings []Binding, libraryBasePath string) error {
	for _, binding := range bindings {
		found, err := verifyBinding(binding, libraryBasePath)
		if err != nil {
			return err
		}
		if !found {
			b, _ := json.Marshal(binding)
			return errors.New("Requested binding " + string(b) + " does not exist!")
		}
	}
	return nil
}

func shouldProcessSymbol(symbol string, bindings []Binding) bool {
	if len(bindings) == 0 {
		return true
	}
	for _, b := range bindings {
		if b.Symbol == symbol {
			return true
		}
	}
	return false
}

func CollectTypescriptDefs(buildConfig BuildConfig, workDir string) ([]TypescriptDef, error) {
	var allBindings []Binding
	allBindings = append(allBindings, buildConfig.MainBuild.Bindings...)
	for _, extraBuild := range buildConfig.ExtraBuilds {
		allBindings = append(allBindings, extraBuild.Bindings...)
	}

	var typescriptDefinitions []TypescriptDef
	err := filepath.Walk(workDir+"/build", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".d.ts.json") &&
			shouldProcessSymbol(info.Name()[:len(info.Name())-10], allBindings) {
			data, err := os.ReadFile(path)
			if err != nil {
				return err
			}
			var def TypescriptDef
			if err := json.Unmarshal(data, &def); err != nil {
				return err
			}
			typescriptDefinitions = append(typescriptDefinitions, def)
		}
		return nil
	})
	return typescriptDefinitions, err
}

func runBuild(workDir string, build BuildSpec) error {
	additionalBindCodeO, err := getAdditionalBindCodeO(workDir, build)
	if err != nil {
		return err
	}

	fmt.Println("Running build: " + build.Name)

	bindingsO, err := collectObjectFiles(workDir+"/build/bindings", build.Bindings, ".cpp.o")
	if err != nil {
		return err
	}

	occtO, err := collectObjectFiles(workDir+"/build/occt", nil, ".o")
	if err != nil {
		return err
	}

	sourceO, err := collectObjectFiles(workDir+"/build/src", nil, ".o")
	if err != nil {
		return err
	}

	args := []string{"-lembind"}
	if additionalBindCodeO != "" {
		args = append(args, additionalBindCodeO)
	}
	files := []string{}

	files = append(files, bindingsO...)
	files = append(files, occtO...)
	files = append(files, sourceO...)

	outputStr := strings.Join(files, " ")

	outFile := build.Name + ".txt"

	os.WriteFile(outFile, []byte(outputStr), 0644)

	defer os.Remove(outFile)

	args = append(args, "@"+outFile)

	args = append(args, "-o", filepath.Join(workDir, "packages/topo-wasm/src", build.Name))
	if os.Getenv("threading") == "multi-threaded" {
		args = append(args, "-pthread")
	}
	args = append(args, build.EmccFlags...)

	fmt.Print("emcc " + strings.Join(args, " ") + "\n")

	cmd := exec.Command("emcc", args...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("build failed: %v\n%s", err, output)
	}

	fmt.Println("Build finished")
	return nil
}

func getAdditionalBindCodeO(workDir string, build BuildSpec) (string, error) {
	if build.AdditionalBindCode == "" {
		return "", nil
	}

	additionalBindCodeDir := filepath.Join(workDir, "additionalBindCode")
	if err := os.MkdirAll(additionalBindCodeDir, 0755); err != nil {
		return "", err
	}

	additionalBindCodeFileName := filepath.Join(additionalBindCodeDir, build.Name+".cpp")
	if err := os.WriteFile(additionalBindCodeFileName, []byte(build.AdditionalBindCode), 0644); err != nil {
		return "", err
	}

	fmt.Println("building " + additionalBindCodeFileName)

	ocIncludePaths, additionalIncludePaths := GetGlobalIncludes(workDir)

	args := []string{
		"-flto",
		"-fexceptions",
		"-sDISABLE_EXCEPTION_CATCHING=0",
		"-DIGNORE_NO_ATOMICS=1",
		"-DOCCT_NO_PLUGINS",
		"-frtti",
		"-DHAVE_RAPIDJSON",
		"-Os",
	}
	if os.Getenv("threading") == "multi-threaded" {
		args = append(args, "-pthread")
	}
	for _, path := range append(ocIncludePaths, additionalIncludePaths...) {
		args = append(args, "-I"+path)
	}
	args = append(args, "-c", additionalBindCodeFileName, "-o", additionalBindCodeFileName+".o")

	cmd := exec.Command("emcc", args...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return "", fmt.Errorf("compilation failed: %v\n%s", err, output)
	}

	return additionalBindCodeFileName + ".o", nil
}

func collectObjectFiles(dir string, bindings []Binding, suffix string) ([]string, error) {
	var files []string
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() && strings.HasSuffix(info.Name(), suffix) {
			if shouldProcessSymbol(info.Name()[:len(info.Name())-len(suffix)], bindings) {
				files = append(files, path)
			}
		}
		return nil
	})
	return files, err
}

const typescriptDefinitionOutput = `
type Standard_Boolean = boolean;
type Standard_Byte = number;
type Standard_Character = number;
type Standard_CString = string;
type Standard_Integer = number;
type Standard_Real = number;
type Standard_ShortReal = number;
type Standard_Size = number;

declare namespace FS {
  interface Lookup {
      path: string;
      node: FSNode;
  }

  interface FSStream {}
  interface FSNode {}
  interface ErrnoError {}

  let ignorePermissions: boolean;
  let trackingDelegate: any;
  let tracking: any;
  let genericErrors: any;

  //
  // paths
  //
  function lookupPath(path: string, opts: any): Lookup;
  function getPath(node: FSNode): string;

  //
  // nodes
  //
  function isFile(mode: number): boolean;
  function isDir(mode: number): boolean;
  function isLink(mode: number): boolean;
  function isChrdev(mode: number): boolean;
  function isBlkdev(mode: number): boolean;
  function isFIFO(mode: number): boolean;
  function isSocket(mode: number): boolean;

  //
  // devices
  //
  function major(dev: number): number;
  function minor(dev: number): number;
  function makedev(ma: number, mi: number): number;
  function registerDevice(dev: number, ops: any): void;

  //
  // core
  //
  function syncfs(populate: boolean, callback: (e: any) => any): void;
  function syncfs(callback: (e: any) => any, populate?: boolean): void;
  function mount(type: any, opts: any, mountpoint: string): any;
  function unmount(mountpoint: string): void;

  function mkdir(path: string, mode?: number): any;
  function mkdev(path: string, mode?: number, dev?: number): any;
  function symlink(oldpath: string, newpath: string): any;
  function rename(old_path: string, new_path: string): void;
  function rmdir(path: string): void;
  function readdir(path: string): any;
  function unlink(path: string): void;
  function readlink(path: string): string;
  function stat(path: string, dontFollow?: boolean): any;
  function lstat(path: string): any;
  function chmod(path: string, mode: number, dontFollow?: boolean): void;
  function lchmod(path: string, mode: number): void;
  function fchmod(fd: number, mode: number): void;
  function chown(path: string, uid: number, gid: number, dontFollow?: boolean): void;
  function lchown(path: string, uid: number, gid: number): void;
  function fchown(fd: number, uid: number, gid: number): void;
  function truncate(path: string, len: number): void;
  function ftruncate(fd: number, len: number): void;
  function utime(path: string, atime: number, mtime: number): void;
  function open(path: string, flags: string, mode?: number, fd_start?: number, fd_end?: number): FSStream;
  function close(stream: FSStream): void;
  function llseek(stream: FSStream, offset: number, whence: number): any;
  function read(stream: FSStream, buffer: ArrayBufferView, offset: number, length: number, position?: number): number;
  function write(
      stream: FSStream,
      buffer: ArrayBufferView,
      offset: number,
      length: number,
      position?: number,
      canOwn?: boolean,
  ): number;
  function allocate(stream: FSStream, offset: number, length: number): void;
  function mmap(
      stream: FSStream,
      buffer: ArrayBufferView,
      offset: number,
      length: number,
      position: number,
      prot: number,
      flags: number,
  ): any;
  function ioctl(stream: FSStream, cmd: any, arg: any): any;
  function readFile(path: string, opts: { encoding: 'binary'; flags?: string }): Uint8Array;
  function readFile(path: string, opts: { encoding: 'utf8'; flags?: string }): string;
  function readFile(path: string, opts?: { flags?: string }): Uint8Array;
  function writeFile(path: string, data: string | ArrayBufferView, opts?: { flags?: string }): void;

  //
  // module-level FS code
  //
  function cwd(): string;
  function chdir(path: string): void;
  function init(
      input: null | (() => number | null),
      output: null | ((c: number) => any),
      error: null | ((c: number) => any),
  ): void;

  function createLazyFile(
      parent: string | FSNode,
      name: string,
      url: string,
      canRead: boolean,
      canWrite: boolean,
  ): FSNode;
  function createPreloadedFile(
      parent: string | FSNode,
      name: string,
      url: string,
      canRead: boolean,
      canWrite: boolean,
      onload?: () => void,
      onerror?: () => void,
      dontCreateFile?: boolean,
      canOwn?: boolean,
  ): void;
  function createDataFile(
      parent: string | FSNode,
      name: string,
      data: ArrayBufferView | string,
      canRead: boolean,
      canWrite: boolean,
      canOwn: boolean,
  ): FSNode;
  interface AnalysisResults {
    isRoot: boolean,
    exists: boolean,
    error: Error,
    name: string,
    path: any,
    object: any,
    parentExists: boolean,
    parentPath: any,
    parentObject: any
  };
  function analyzePath(path: string): AnalysisResults;
}
`

const typescriptDefinitionHeader = `
export type XCAFDoc_PartId = any
export type Graphic3d_ZLayerId = any
export type address = any
`

func GenerateTypescriptDefs(workDir string, defs []TypescriptDef, buildName string) error {
	var output strings.Builder
	var exports []struct {
		Export string
		Kind   string
	}

	output.WriteString(typescriptDefinitionHeader)

	for _, dts := range defs {
		output.WriteString(dts.Dts)
		if len(dts.Defs) > 0 {
			for _, def := range dts.Defs {
				for _, export := range def.Exports {
					exports = append(exports, struct {
						Export string
						Kind   string
					}{export, def.Kind})
				}
			}
		} else {
			for _, export := range dts.Exports {
				exports = append(exports, struct {
					Export string
					Kind   string
				}{export, dts.Kind})
			}
		}
	}

	output.WriteString(typescriptDefinitionOutput)
	output.WriteString("\nexport type TopoInstance = {FS: typeof FS} & {\n  ")
	for i, exp := range exports {
		if i > 0 {
			output.WriteString(";\n  ")
		}
		if exp.Kind == "class" || exp.Kind == "function" {
			output.WriteString(fmt.Sprintf("%s: typeof %s", exp.Export, exp.Export))
		} else {
			output.WriteString(fmt.Sprintf("%s: %s", exp.Export, exp.Export))
		}
	}
	output.WriteString(";\n};\n\n")
	output.WriteString("declare function init(): Promise<TopoInstance>;\n\n")
	output.WriteString("export default init;\n")

	filename := path.Join(workDir, "packages/topo-wasm/src/", strings.TrimSuffix(buildName, filepath.Ext(buildName))+".d.ts")
	return os.WriteFile(filename, []byte(output.String()), 0644)
}
