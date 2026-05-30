package gen

import (
	"strings"
	"testing"
)

func TestPick(t *testing.T) {
	if got := pick(true, "a", "b"); got != "a" {
		t.Errorf("pick(true, 'a', 'b') = %q, want 'a'", got)
	}
	if got := pick(false, "a", "b"); got != "b" {
		t.Errorf("pick(false, 'a', 'b') = %q, want 'b'", got)
	}
}

func TestIndent(t *testing.T) {
	tests := []struct {
		level int
		want  string
	}{
		{0, ""},
		{1, "  "},
		{2, "    "},
		{3, "      "},
	}
	for _, tt := range tests {
		got := indent(tt.level)
		if got != tt.want {
			t.Errorf("indent(%d) = %q, want %q", tt.level, got, tt.want)
		}
	}
}

func TestAnyTrue(t *testing.T) {
	tests := []struct {
		input []bool
		want  bool
	}{
		{[]bool{}, false},
		{[]bool{false, false}, false},
		{[]bool{true, false}, true},
		{[]bool{false, true}, true},
		{[]bool{true, true}, true},
	}
	for _, tt := range tests {
		got := anyTrue(tt.input)
		if got != tt.want {
			t.Errorf("anyTrue(%v) = %v, want %v", tt.input, got, tt.want)
		}
	}
}

func TestConvertBuiltinTypes(t *testing.T) {
	b := &TypescriptBindings{}
	tests := []struct {
		input string
		want  string
	}{
		{"int", "number"},
		{"float", "number"},
		{"double", "number"},
		{"unsigned long", "number"},
		{"char", "string"},
		{"unsigned char", "string"},
		{"std::string", "string"},
		{"bool", "boolean"},
		{"gp_Pnt", "gp_Pnt"},
		{"TopoDS_Shape", "TopoDS_Shape"},
		{"", ""},
	}
	for _, tt := range tests {
		got := b.convertBuiltinTypes(tt.input)
		if got != tt.want {
			t.Errorf("convertBuiltinTypes(%q) = %q, want %q", tt.input, got, tt.want)
		}
	}
}

func TestBuiltInTypesMap(t *testing.T) {
	cases := []string{"int", "double", "bool", "float", "char"}
	for _, c := range cases {
		if !builtInTypes[c] {
			t.Errorf("builtInTypes should contain %q", c)
		}
	}

	notCases := []string{"std::string", "gp_Pnt", "TopoDS_Shape"}
	for _, c := range notCases {
		if builtInTypes[c] {
			t.Errorf("builtInTypes should NOT contain %q", c)
		}
	}
}

func TestOcctEnumTypes(t *testing.T) {
	cases := []string{
		"TopAbs_ShapeEnum",
		"TopAbs_Orientation",
		"GeomAbs_Shape",
		"Quantity_NameOfColor",
	}
	for _, c := range cases {
		if !occtEnumTypes[c] {
			t.Errorf("occtEnumTypes should contain %q", c)
		}
	}
}

func TestCStringTypes(t *testing.T) {
	cases := []string{"const char *", "char *", "const char *const", "char *const"}
	for _, c := range cases {
		found := false
		for _, s := range cStringTypes {
			if s == c {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("cStringTypes should contain %q", c)
		}
	}
}

func TestTypescriptDefinitionHeader(t *testing.T) {
	if typescriptDefinitionHeader == "" {
		t.Error("typescriptDefinitionHeader should not be empty")
	}
	if !containsStr(typescriptDefinitionHeader, "export type") {
		t.Error("typescriptDefinitionHeader should contain export type declarations")
	}
}

func TestTypescriptDefinitionOutput(t *testing.T) {
	if typescriptDefinitionOutput == "" {
		t.Error("typescriptDefinitionOutput should not be empty")
	}
	if !containsStr(typescriptDefinitionOutput, "FSNode") {
		t.Error("typescriptDefinitionOutput should contain FSNode type")
	}
	if !containsStr(typescriptDefinitionOutput, "declare namespace FS") {
		t.Error("typescriptDefinitionOutput should contain FS namespace")
	}
}

func TestBuildSpecConfig(t *testing.T) {
	cfg := BuildSpec{
		Name: "test",
		EmccFlags: []string{"-O3", "-lembind"},
	}
	if cfg.Name != "test" {
		t.Errorf("BuildSpec.Name = %q, want 'test'", cfg.Name)
	}
	if len(cfg.EmccFlags) != 2 {
		t.Errorf("BuildSpec.EmccFlags should have 2 items, got %d", len(cfg.EmccFlags))
	}
}

func containsStr(s, substr string) bool {
	return strings.Contains(s, substr)
}
