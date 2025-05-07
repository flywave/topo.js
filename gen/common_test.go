package gen

import "testing"

func TestGetLLVM(t *testing.T) {
	gotPaths, err := getLLVMIncludePaths()

	if err != nil {
		t.Errorf("getLLVMIncludePaths() error = %v", err)
		return
	}

	if len(gotPaths) == 0 {
		t.Errorf("getLLVMIncludePaths() gotPaths = %v, want not empty", gotPaths)
	}
}
