package gen

import (
	"fmt"
	"path/filepath"
	"strings"
	"testing"
)

func TestParseFunction(t *testing.T) {
	// 准备测试数据
	testCode := `#include <string>
class MyClass {
public:
    std::string name;
};`
	includeArgs, _ := GenerateIncludeArgs("", []string{})
	includeStmts := "#include <vector>"

	// 调用被测试方法
	tu := parse(testCode, includeArgs, includeStmts)

	// 检查诊断信息
	diags := tu.Diagnostics()
	if len(diags) > 0 {
		var messages []string
		for _, d := range diags {
			messages = append(messages, d.Spelling())
		}
		t.Errorf("Unexpected diagnostics:\n%s", strings.Join(messages, "\n"))
	}

	// 验证包含路径是否正确应用
	cursor := tu.TranslationUnitCursor()
	if cursor.IsNull() {
		t.Error("Should get valid translation unit cursor")
	}
}

func TestGenerate(t *testing.T) {
	workDir, _ := GetResourcePath("../")

	ocIncludeFiles, additionalIncludePaths := GetGlobalIncludes(workDir)
	includePathArgs, _ := GenerateIncludeArgs(workDir, additionalIncludePaths)
	var includes []string
	for _, file := range ocIncludeFiles {
		includes = append(includes, fmt.Sprintf("#include \"%s\"", filepath.Base(file)))
	}
	ocIncludeStatements := strings.Join(includes, "\n")

	embindPreamble := ocIncludeStatements + "\n" + referenceTypeTemplateDefs + "\n" + ""

	process(workDir, includePathArgs, ocIncludeStatements, ".cpp", embindGenerationFuncClasses, embindGenerationFuncTemplates, embindGenerationFuncEnums, embindPreamble, "", false)
	//process(workDir, includePathArgs, ocIncludeStatements, ".d.ts.json", typescriptGenerationFuncClasses, typescriptGenerationFuncTemplates, typescriptGenerationFuncEnums, "", "", false)
}
