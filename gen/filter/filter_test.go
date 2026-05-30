package filter

import (
	"os"
	"path/filepath"
	"testing"
)

func TestFilterSourceFile(t *testing.T) {
	tests := []struct {
		name string
		want bool
	}{
		{"test.cc", true},
		{"test.cpp", true},
		{"test.cxx", true},
		{"test.c", true},
		{"test.gxx", true},
		{"test.mm", false},
		{"test.h", false},
		{"test.txt", false},
		{"test.go", false},
	}
	for _, tt := range tests {
		got := FilterSourceFile(tt.name)
		if got != tt.want {
			t.Errorf("FilterSourceFile(%q) = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestFilterTopoFile(t *testing.T) {
	tests := []struct {
		name string
		want bool
	}{
		{"shape.cc", true},
		{"edge.cc", true},
		{"primitives_railway.cc", true},
		{"shape_c_api.cc", false},
		{"shape_test.cc", false},
		{"dxf.cc", false},
		{"dxf_shape.cc", false},
		{"ifc.cc", false},
	}
	for _, tt := range tests {
		got := FilterTopoFile(tt.name)
		if got != tt.want {
			t.Errorf("FilterTopoFile(%q) = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestFilterPackages(t *testing.T) {
	tests := []struct {
		pkg  string
		want bool
	}{
		{"TKernel", true},
		{"TKMath", true},
		{"TKG2d", true},
		{"TKBRep", true},
		{"", false},
		{"Draw", false},
		{"OpenGl", false},
		{"IVtk", false},
		{"Cocoa", false},
		{"DBRep", false},
	}
	for _, tt := range tests {
		got := FilterPackages(tt.pkg)
		if got != tt.want {
			t.Errorf("FilterPackages(%q) = %v, want %v", tt.pkg, got, tt.want)
		}
	}
}

func TestFilterIncludeFile(t *testing.T) {
	tests := []struct {
		name string
		want bool
	}{
		{"TopoDS_Shape.hxx", true},
		{"gp_Pnt.hxx", true},
		{"OpenGl_Type.hxx", false},
		{"IVtk_IShape.hxx", false},
		{"AIS_DataMapOfSelStat.hxx", false},
		{"Standard_Atomic.hxx", false},
		{"test.h", true},
		{"test.cc", false},
		{"test.txt", false},
	}
	for _, tt := range tests {
		got := FilterIncludeFile(tt.name)
		if got != tt.want {
			t.Errorf("FilterIncludeFile(%q) = %v, want %v", tt.name, got, tt.want)
		}
	}
}

func TestCleanTopoSource(t *testing.T) {
	tmpDir := t.TempDir()

	excludedFiles := []string{"shape_c_api.cc.o", "shape_test.cc.o", "dxf.cc.o"}
	keepFiles := []string{"shape.cc.o", "edge.cc.o"}

	for _, f := range excludedFiles {
		dir := filepath.Dir(f)
		if dir != "." {
			os.MkdirAll(filepath.Join(tmpDir, dir), 0755)
		}
		os.WriteFile(filepath.Join(tmpDir, f), []byte{}, 0644)
	}
	for _, f := range keepFiles {
		os.MkdirAll(filepath.Join(tmpDir, filepath.Dir(f)), 0755)
		os.WriteFile(filepath.Join(tmpDir, f), []byte{}, 0644)
	}

	tmpWorkDir := filepath.Dir(tmpDir)
	os.Setenv("TOPOGEN_BUILDSRC", filepath.Base(tmpDir))
	defer os.Unsetenv("TOPOGEN_BUILDSRC")

	err := CleanTopoSource(tmpWorkDir)
	if err != nil {
		t.Fatalf("CleanTopoSource failed: %v", err)
	}
}
