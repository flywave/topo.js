package gen

import (
	"testing"
)

func TestGetGlobalIncludes(t *testing.T) {
	workDir, err := GetResourcePath("../")
	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	includeFiles, includePaths := GetGlobalIncludes(workDir)
	if len(includeFiles) == 0 {
		t.Log("警告: 未找到包含文件")
	}
	if len(includePaths) == 0 {
		t.Log("警告: 未找到包含路径")
	}
}

func TestUniqueStrings(t *testing.T) {
	tests := []struct {
		input []string
		want  []string
	}{
		{[]string{"a", "b", "a", "c"}, []string{"a", "b", "c"}},
		{[]string{}, []string{}},
		{[]string{"a", "a", "a"}, []string{"a"}},
	}

	for _, tt := range tests {
		got := uniqueStrings(tt.input)
		if len(got) != len(tt.want) {
			t.Errorf("uniqueStrings(%v) = %v, want %v", tt.input, got, tt.want)
		}
		for i, v := range got {
			if v != tt.want[i] {
				t.Errorf("uniqueStrings(%v) = %v, want %v", tt.input, got, tt.want)
			}
		}
	}
}

func TestShouldProcessSymbol(t *testing.T) {
	bindings := []Binding{{Symbol: "foo"}, {Symbol: "bar"}}

	if !shouldProcessSymbol("foo", bindings) {
		t.Error("shouldProcessSymbol('foo', bindings) should be true")
	}
	if !shouldProcessSymbol("bar", bindings) {
		t.Error("shouldProcessSymbol('bar', bindings) should be true")
	}
	if shouldProcessSymbol("baz", bindings) {
		t.Error("shouldProcessSymbol('baz', bindings) should be false")
	}
	if !shouldProcessSymbol("anything", []Binding{}) {
		t.Error("shouldProcessSymbol with empty bindings should be true")
	}
}
