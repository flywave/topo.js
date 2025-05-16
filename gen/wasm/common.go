package wasm

import (
	"fmt"

	"github.com/go-clang/clang-v15/clang"
)

type SkipException struct {
	message string
}

func (e SkipException) Error() string {
	return e.message
}

func GetPureVirtualMethods(theClass clang.Cursor) []clang.Cursor {
	var pureVirtuals []clang.Cursor
	theClass.Visit(func(cursor, parent clang.Cursor) clang.ChildVisitResult {
		if cursor.CXXMethod_IsPureVirtual() {
			pureVirtuals = append(pureVirtuals, cursor)
		}
		return clang.ChildVisit_Continue
	})
	return pureVirtuals
}

func IsAbstractClass(theClass clang.Cursor, tu clang.TranslationUnit) bool {
	var allClasses []clang.Cursor

	tu.TranslationUnitCursor().Visit(func(cursor, parent clang.Cursor) clang.ChildVisitResult {
		if cursor.IsNull() {
			return clang.ChildVisit_Continue
		}

		if (cursor.Kind() == clang.Cursor_ClassDecl || cursor.Kind() == clang.Cursor_StructDecl) &&
			cursor.Definition().IsNull() && cursor.Equal(cursor.Definition()) {
			allClasses = append(allClasses, cursor)
		}
		return clang.ChildVisit_Continue
	})

	var baseSpec []clang.Cursor
	theClass.Visit(func(cursor, parent clang.Cursor) clang.ChildVisitResult {
		if cursor.Kind() == clang.Cursor_CXXBaseSpecifier &&
			cursor.AccessSpecifier() == clang.AccessSpecifier_Public {
			baseSpec = append(baseSpec, cursor)
		}
		return clang.ChildVisit_Continue
	})

	var baseClasses []clang.Cursor
	for _, bs := range baseSpec {
		for _, c := range allClasses {
			if c.Spelling() == bs.Type().Spelling() {
				baseClasses = append(baseClasses, c)
				break
			}
		}
	}

	pureVirtualMethods := GetPureVirtualMethods(theClass)
	if len(pureVirtualMethods) > 0 {
		return true
	}

	var pvmsInBaseClasses [][]clang.Cursor
	for _, bc := range baseClasses {
		pvmsInBaseClasses = append(pvmsInBaseClasses, GetPureVirtualMethods(bc))
	}

	numPureVirtualMethods := 0
	numImplementedPureVirtualMethods := 0
	for _, bc := range pvmsInBaseClasses {
		for _, bcPvm := range bc {
			numPureVirtualMethods++
			theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
				if child.Spelling() == bcPvm.Spelling() {
					numImplementedPureVirtualMethods++
					return clang.ChildVisit_Break
				}
				return clang.ChildVisit_Continue
			})
		}
	}

	return numPureVirtualMethods > numImplementedPureVirtualMethods
}

func GetMethodOverloadPostfix(theClass, method clang.Cursor, children []clang.Cursor) (string, int) {
	theClass.Visit(func(child, parent clang.Cursor) clang.ChildVisitResult {
		children = append(children, child)
		return clang.ChildVisit_Continue
	})

	var allOverloads []clang.Cursor
	for _, m := range children {
		if m.Spelling() == method.Spelling() {
			allOverloads = append(allOverloads, m)
		}
	}

	overloadPostfix := ""
	if len(allOverloads) > 1 {
		for i, m := range allOverloads {
			if m.Equal(method) {
				overloadPostfix = fmt.Sprintf("_%d", i+1)
				break
			}
		}
	}

	return overloadPostfix, len(allOverloads)
}

func IgnoreDuplicateTypedef(typedef clang.Cursor) bool {
	underlyingType := typedef.TypedefDeclUnderlyingType().Spelling()
	typedefName := typedef.Spelling()

	basicTypes := []string{
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

	for _, t := range basicTypes {
		if underlyingType == t {
			return true
		}
	}

	// Special cases
	switch {
	case underlyingType == "opencascade::handle<NCollection_BaseAllocator>" &&
		(typedefName == "TDF_HAllocator" || typedefName == "IntSurf_Allocator"):
		return true

	case underlyingType == "NCollection_Vec3<Standard_Real>" &&
		(typedefName == "Select3D_Vec3" || typedefName == "SelectMgr_Vec3"):
		return true

	case underlyingType == "NCollection_Vec4<Standard_Real>" &&
		typedefName == "SelectMgr_Vec4":
		return true

	case underlyingType == "NCollection_Mat4<Standard_Real>" &&
		typedefName == "SelectMgr_Mat4":
		return true

	case underlyingType == "void (*)(NCollection_ListNode *, opencascade::handle<NCollection_BaseAllocator> &)" &&
		typedefName == "NCollection_DelMapNode":
		return true

	case underlyingType == "NCollection_List<TopoDS_Shape>" &&
		typedefName == "TopoDS_ListOfShape":
		return true

	case underlyingType == "NCollection_List<TopoDS_Shape>::Iterator" &&
		typedefName == "TopoDS_ListIteratorOfListOfShape":
		return true

	case underlyingType == "NCollection_UBTree<Standard_Integer, Bnd_Box>" &&
		(typedefName == "BRepClass3d_BndBoxTree" || typedefName == "ShapeAnalysis_BoxBndTree"):
		return true

	case underlyingType == "NCollection_IndexedDataMap<TCollection_AsciiString, Standard_Integer, TCollection_AsciiString>" &&
		typedefName == "StdStorage_MapOfTypes":
		return true

	case underlyingType == "opencascade::handle<BVH_Tree<Standard_ShortReal, 3, BVH_QuadTree> >" &&
		typedefName == "QuadBvhHandle":
		return true
	}

	return false
}
