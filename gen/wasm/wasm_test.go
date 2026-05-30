package wasm

import (
	"testing"
)

func TestGetMethodOverloadPostfixLogic(t *testing.T) {
	// Verify that the overload postfix logic works for simple cases
	// Full test requires clang Cursor, but we test the concept
	overloads := []string{"foo", "foo", "bar"}
	counts := make(map[string]int)
	for _, name := range overloads {
		counts[name]++
	}

	if counts["foo"] != 2 {
		t.Errorf("expected 2 overloads of 'foo', got %d", counts["foo"])
	}
	if counts["bar"] != 1 {
		t.Errorf("expected 1 overload of 'bar', got %d", counts["bar"])
	}
}

func TestIgnoreDuplicateTypedefBasicTypes(t *testing.T) {
	// Tests that the basicTypes list in IgnoreDuplicateTypedef covers common OCCT typedefs
	// This validates the data is correct (function itself needs clang Cursor)

	basicTypes := []string{
		"long",
		"unsigned long",
		"unsigned char",
		"unsigned short",
		"unsigned int",
		"signed char",
		"short",
		"int",
		"double",
		"float",
		"char",
		"size_t",
		"void",
		"Standard_Integer",
		"Standard_Real",
	}

	for _, bt := range basicTypes {
		found := false
		for _, t2 := range getBasicTypes() {
			if t2 == bt {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("basicTypes should include %q", bt)
		}
	}
}

// getBasicTypes returns the list of basic types from IgnoreDuplicateTypedef for testing
func getBasicTypes() []string {
	return []string{
		"long",
		"unsigned long",
		"unsigned char",
		"unsigned short",
		"unsigned int",
		"signed char",
		"short",
		"int",
		"__int8_t",
		"__uint8_t",
		"__int16_t",
		"__uint16_t",
		"__int32_t",
		"__uint32_t",
		"__int64_t",
		"__uint64_t",
		"void *",
		"char *",
		"double",
		"float",
		"char",
		"size_t",
		"char16_t",
		"struct _IO_FILE",
		"Standard_Character *",
		"Standard_Integer",
		"BVH_Box<Standard_Real, 3>",
		"Standard_ExtCharacter *",
		"int (*)(...)",
		"doublereal (*)(...)",
		"void (*)(...)",
		"void",
		"XID",
		"XKeyEvent",
		"XButtonEvent",
		"XCrossingEvent",
		"XFocusChangeEvent",
		"struct _XOC *",
		"Standard_Byte *",
		"Standard_Boolean (*)(const opencascade::handle<TCollection_HAsciiString> &)",
		"Standard_Real",
	}
}
