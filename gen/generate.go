package gen

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/flywave/jstopo/gen/filter"
	"github.com/flywave/jstopo/gen/wasm"
	"github.com/go-clang/clang-v15/clang"
)

var (
	ocIncludeStatements string
	includePathArgs     []string
)

type SkipException struct {
	message string
}

func (e SkipException) Error() string {
	return e.message
}

type Batch struct {
	start, stop int
}

func init() {
	ocIncludeFiles, additionalIncludePaths := GetGlobalIncludes("")
	includePathArgs = additionalIncludePaths
	var includes []string
	for _, file := range ocIncludeFiles {
		includes = append(includes, fmt.Sprintf("#include \"%s\"", filepath.Base(file)))
	}
	ocIncludeStatements = strings.Join(includes, "\n")
}

func mkdirp(name string) error {
	return os.MkdirAll(name, 0755)
}

func filterClasses(workDir string, child clang.Cursor, customBuild bool) bool {
	file, _, _, _ := child.Location().FileLocation()
	if customBuild {
		return file.Name() == "myMain.h" && shouldProcessClass(child)
	}
	sfile, _, _, _ := child.Extent().Start().FileLocation()
	return strings.HasPrefix(sfile.Name(), path.Join(workDir, sourceBasePath)) &&
		filter.FilterPackages(filepath.Base(filepath.Dir(file.Name()))) &&
		shouldProcessClass(child)
}

func filterTemplates(workDir string, child clang.Cursor, customBuild bool) bool {
	file, _, _, _ := child.Location().FileLocation()

	if customBuild {
		return file.Name() == "myMain.h" &&
			child.Kind() == clang.Cursor_TypedefDecl &&
			(child.TypedefDeclUnderlyingType().Kind() == clang.Type_Elaborated ||
				child.TypedefDeclUnderlyingType().Kind() == clang.Type_Unexposed)
	}
	sfile, _, _, _ := child.Extent().Start().FileLocation()
	return strings.HasPrefix(sfile.Name(), path.Join(workDir, sourceBasePath)) &&
		filter.FilterPackages(filepath.Base(filepath.Dir(file.Name()))) &&
		child.Kind() == clang.Cursor_TypedefDecl &&
		(child.TypedefDeclUnderlyingType().Kind() == clang.Type_Elaborated ||
			child.TypedefDeclUnderlyingType().Kind() == clang.Type_Unexposed)
}

func filterEnums(workDir string, child clang.Cursor, customBuild bool) bool {
	file, _, _, _ := child.Location().FileLocation()
	if customBuild {
		return file.Name() == "myMain.h"
	}
	sfile, _, _, _ := child.Extent().Start().FileLocation()
	return strings.HasPrefix(sfile.Name(), path.Join(workDir, sourceBasePath)) &&
		filter.FilterPackages(filepath.Base(filepath.Dir(file.Name()))) &&
		child.Kind() == clang.Cursor_EnumDecl
}

func processChildBatch(workDir string, customCode string, generator func(clang.TranslationUnit) []clang.Cursor, buildType, extension string,
	filterFunc func(string, clang.Cursor, bool) bool, processFunc func(string, clang.TranslationUnit, string, clang.Cursor, []clang.Cursor, []clang.Cursor) (string, error),
	typedefGen, templateTypedefGen func(clang.TranslationUnit) []clang.Cursor, preamble string, customBuild bool, batch Batch, wg *sync.WaitGroup) {
	defer wg.Done()

	tu := parse(customCode)
	children := generator(tu)
	if batch.stop > len(children) {
		batch.stop = len(children)
	}
	bulidPath := filepath.Join(workDir, "/build")

	for _, child := range children[batch.start:batch.stop] {
		if !filterFunc(workDir, child, customBuild) || child.Spelling() == "" {
			continue
		}
		sfile, _, _, _ := child.Extent().Start().FileLocation()
		relOcFileName := strings.Replace(sfile.Name(), path.Join(workDir, sourceBasePath), "", 1)
		dirPath := filepath.Join(bulidPath, buildType, filepath.Dir(relOcFileName))
		if err := mkdirp(dirPath); err != nil {
			fmt.Printf("Error creating directory %s: %v\n", dirPath, err)
			continue
		}

		filename := filepath.Join(bulidPath, buildType, relOcFileName)
		if err := mkdirp(filename); err != nil {
			fmt.Printf("Error creating directory %s: %v\n", filename, err)
			continue
		}

		childName := child.Spelling()
		if childName == "" {
			childName = child.Type().Spelling()
		}
		filename = filepath.Join(filename, childName+extension)

		if _, err := os.Stat(filename); os.IsNotExist(err) {
			fmt.Printf("Processing %s\n", child.Spelling())
			output, err := processFunc(workDir, tu, preamble, child, typedefGen(tu), templateTypedefGen(tu))
			if err != nil {
				if _, ok := err.(SkipException); ok {
					fmt.Println(err.Error())
				}
				continue
			}

			if err := os.WriteFile(filename, []byte(output), 0644); err != nil {
				fmt.Printf("Error writing file %s: %v\n", filename, err)
			}
		} else {
			fmt.Printf("file %s already exists, skipping\n", child.Spelling())
		}
	}
}

func split(a []clang.Cursor, n int) []Batch {
	var batches []Batch
	k := len(a) / n
	for i := 0; i < n; i++ {
		start := i * k
		end := start + k
		if i == n-1 {
			end = len(a)
		}
		batches = append(batches, Batch{start, end})
	}
	return batches
}

func processChildren(workDir string, generator func(clang.TranslationUnit) []clang.Cursor, buildType, extension string,
	filterFunc func(string, clang.Cursor, bool) bool, processFunc func(string, clang.TranslationUnit, string, clang.Cursor, []clang.Cursor, []clang.Cursor) (string, error),
	typedefGen, templateTypedefGen func(clang.TranslationUnit) []clang.Cursor, preamble, customCode string, customBuild bool) {

	tu := parse(customCode)
	children := generator(tu)

	var wg sync.WaitGroup

	if !customBuild {
		numThreads := runtime.NumCPU()
		batches := split(children, numThreads)

		for _, batch := range batches {
			wg.Add(1)
			go processChildBatch(workDir, customCode, generator, buildType, extension, filterFunc, processFunc,
				typedefGen, templateTypedefGen, preamble, customBuild, batch, &wg)
		}
	} else {
		wg.Add(1)
		processChildBatch(workDir, customCode, generator, buildType, extension, filterFunc, processFunc,
			typedefGen, templateTypedefGen, preamble, customBuild, Batch{0, len(children)}, &wg)
	}

	wg.Wait()
}

func processTemplate(child clang.Cursor) (clang.Cursor, map[string]clang.Type, error) {
	var templateRefs []clang.Cursor
	child.Visit(func(c, parent clang.Cursor) clang.ChildVisitResult {
		if c.Kind() == clang.Cursor_TemplateRef {
			templateRefs = append(templateRefs, c)
		}
		return clang.ChildVisit_Continue
	})

	if len(templateRefs) != 1 {
		return clang.Cursor{}, nil, SkipException{
			fmt.Sprintf("The number of template refs for the template typedef \"%s\" is not 1!", child.Spelling()),
		}
	}

	templateClass := templateRefs[0].Definition()
	if templateClass.IsNull() {
		return clang.Cursor{}, nil, SkipException{
			fmt.Sprintf("Template class is None (%s)", child.Spelling()),
		}
	}

	var templateArgNames []clang.Cursor
	templateClass.Visit(func(c, parent clang.Cursor) clang.ChildVisitResult {
		if c.Kind() == clang.Cursor_TemplateTypeParameter {
			templateArgNames = append(templateArgNames, c)
		}
		return clang.ChildVisit_Continue
	})

	templateArgs := make(map[string]clang.Type)
	for i, templateArgName := range templateArgNames {
		templateArgType := child.Type().TemplateArgumentAsType(uint32(i))
		if templateArgType.Spelling() == "" {
			return clang.Cursor{}, nil, SkipException{
				fmt.Sprintf("Template argument type is empty for at least one argument. Is this class using default values for template arguments? This is currently not supported (%s)", child.Spelling()),
			}
		}
		templateArgs[templateArgName.Spelling()] = templateArgType
	}

	return templateClass, templateArgs, nil
}

func embindGenerationFuncClasses(workDir string, tu clang.TranslationUnit, preamble string, child clang.Cursor, typedefs, templateTypedefs []clang.Cursor) (string, error) {
	embindings := NewEmbindBindings(workDir, typedefs, templateTypedefs, tu)
	output := embindings.processClass(child, clang.NewNullCursor(), nil)
	return preamble + output, nil
}

func embindGenerationFuncTemplates(workDir string, tu clang.TranslationUnit, preamble string, child clang.Cursor, typedefs, templateTypedefs []clang.Cursor) (string, error) {
	templateClass, templateArgs, err := processTemplate(child)
	if err != nil {
		return "", err
	}

	embindings := NewEmbindBindings(workDir, typedefs, templateTypedefs, tu)
	output := embindings.processClass(templateClass, child, templateArgs)
	return preamble + output, nil
}

func embindGenerationFuncEnums(workDir string, tu clang.TranslationUnit, preamble string, child clang.Cursor, typedefs, templateTypedefs []clang.Cursor) (string, error) {
	embindings := NewEmbindBindings(workDir, typedefs, templateTypedefs, tu)
	output := embindings.processEnum(child)
	return preamble + output, nil
}

func templateTypedefGenerator(tu clang.TranslationUnit) []clang.Cursor {
	var result []clang.Cursor
	tu.TranslationUnitCursor().Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.Kind() == clang.Cursor_TypedefDecl {
			def := child.Definition()
			if !def.IsNull() && child.Equal(def) &&
				filter.FilterTypedef(child, nil) &&
				child.Type().NumTemplateArguments() != -1 &&
				!wasm.IgnoreDuplicateTypedef(child) {
				result = append(result, child)
			}
		}
		return clang.ChildVisit_Continue
	})
	return result
}

func typedefGenerator(tu clang.TranslationUnit) []clang.Cursor {
	var result []clang.Cursor

	tu.TranslationUnitCursor().Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.IsNull() {
			return clang.ChildVisit_Continue
		}
		if child.Kind() == clang.Cursor_TypedefDecl {
			result = append(result, child)
		}
		return clang.ChildVisit_Continue
	})

	return result
}

func allChildrenGenerator(tu clang.TranslationUnit) []clang.Cursor {
	var childer []clang.Cursor
	tu.TranslationUnitCursor().Visit(func(cursor, parent clang.Cursor) clang.ChildVisitResult {
		if cursor.IsNull() {
			return clang.ChildVisit_Continue
		}
		childer = append(childer, cursor)
		return clang.ChildVisit_Continue
	})
	return childer
}

func enumGenerator(tu clang.TranslationUnit) []clang.Cursor {
	var result []clang.Cursor
	tu.TranslationUnitCursor().Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		if child.Kind() == clang.Cursor_EnumDecl && filter.FilterEnum(child, nil) {
			result = append(result, child)
		}
		return clang.ChildVisit_Continue
	})
	return result
}

func process(workDir string, extension string, classFunc, templateFunc, enumFunc func(string, clang.TranslationUnit, string, clang.Cursor, []clang.Cursor, []clang.Cursor) (string, error),
	preamble, customCode string, customBuild bool) {
	processChildren(workDir, allChildrenGenerator, "bindings", extension, filterClasses, classFunc, typedefGenerator, templateTypedefGenerator, preamble, customCode, customBuild)
	processChildren(workDir, templateTypedefGenerator, "bindings", extension, filterTemplates, templateFunc, typedefGenerator, templateTypedefGenerator, preamble, customCode, customBuild)
	processChildren(workDir, enumGenerator, "bindings", extension, filterEnums, enumFunc, typedefGenerator, templateTypedefGenerator, preamble, customCode, customBuild)
}

func typescriptGenerationFuncClasses(workDir string, tu clang.TranslationUnit, preamble string, child clang.Cursor, typedefs, templateTypedefs []clang.Cursor) (string, error) {
	typescript := NewTypescriptBindings(workDir, typedefs, templateTypedefs, tu)
	output := typescript.processClass(child, clang.NewNullCursor(), nil)

	data := map[string]interface{}{
		".d.ts":   preamble + output,
		"kind":    "class",
		"exports": typescript.exports,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

func typescriptGenerationFuncTemplates(workDir string, tu clang.TranslationUnit, preamble string, child clang.Cursor, typedefs, templateTypedefs []clang.Cursor) (string, error) {
	templateClass, templateArgs, err := processTemplate(child)
	if err != nil {
		return "", err
	}

	typescript := NewTypescriptBindings(workDir, typedefs, templateTypedefs, tu)
	output := typescript.processClass(templateClass, child, templateArgs)

	data := map[string]interface{}{
		".d.ts":   preamble + output,
		"kind":    "class",
		"exports": typescript.exports,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

func typescriptGenerationFuncEnums(workDir string, tu clang.TranslationUnit, preamble string, child clang.Cursor, typedefs, templateTypedefs []clang.Cursor) (string, error) {
	typescript := NewTypescriptBindings(workDir, typedefs, templateTypedefs, tu)
	output := typescript.processEnum(child)

	data := map[string]interface{}{
		".d.ts":   preamble + output,
		"kind":    "enum",
		"exports": typescript.exports,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	return string(jsonData), nil
}

func parse(additionalCppCode string) clang.TranslationUnit {
	index := clang.NewIndex(0, 0)
	defer index.Dispose()

	args := []string{
		"-x", "c++",
		"-stdlib=libc++",
		"-D__EMSCRIPTEN__",
	}
	args = append(args, includePathArgs...)

	tu := index.ParseTranslationUnit("myMain.h", args, []clang.UnsavedFile{
		clang.NewUnsavedFile("myMain.h", ocIncludeStatements+"\n"+additionalCppCode),
	}, 0)

	if len(tu.Diagnostics()) > 0 {
		fmt.Println("Diagnostic Messages:")
		for _, d := range tu.Diagnostics() {
			fmt.Println("  " + d.Spelling())
		}
	}

	return tu
}

const referenceTypeTemplateDefs = `
#include <emscripten/bind.h>
using namespace emscripten;
#include <functional>

template<typename T>
T getReferenceValue(const emscripten::val& v) {
  if(!(v.typeOf().as<std::string>() == "object")) {
    return v.as<T>(allow_raw_pointers());
  } else if(v.typeOf().as<std::string>() == "object" && v.hasOwnProperty("current")) {
    return v["current"].as<T>(allow_raw_pointers());
  }
  throw("unsupported type");
}

template<typename T>
void updateReferenceValue(emscripten::val& v, T& val) {
  if(v.typeOf().as<std::string>() == "object" && v.hasOwnProperty("current")) {
    v.set("current", val);
  }
}
`

func GenerateCustomCodeBindings(workDir string, customCode string) error {
	embindPreamble := ocIncludeStatements + "\n" + referenceTypeTemplateDefs + "\n" + customCode
	process(workDir, ".cpp", embindGenerationFuncClasses, embindGenerationFuncTemplates, embindGenerationFuncEnums, embindPreamble, customCode, true)
	process(workDir, ".d.ts.json", typescriptGenerationFuncClasses, typescriptGenerationFuncTemplates, typescriptGenerationFuncEnums, "", customCode, true)
	return nil
}
