package filter

import "github.com/go-clang/clang-v15/clang"

func FilterEnum(enum clang.Cursor, additionalInfo interface{}) bool {
	return enum.Spelling() != ""
}
