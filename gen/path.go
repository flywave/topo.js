package gen

import (
	"fmt"
	"path/filepath"
	"runtime"
)

func GetResourcePath(relativePath string) (string, error) {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "", fmt.Errorf("无法获取当前文件路径")
	}
	return filepath.Join(filepath.Dir(filename), relativePath), nil
}
