package gen

import "testing"

func TestGetResourcePath(t *testing.T) {
	dir, err := GetResourcePath("")

	if err != nil {
		t.Fatalf("获取资源路径失败: %v", err)
	}

	if dir == "" {
		t.Fatalf("获取资源路径失败: 路径为空")
	}

}
