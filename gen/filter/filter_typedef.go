package filter

import (
	"strings"

	"github.com/go-clang/clang-v15/clang"
)

func FilterTypedef(typedef clang.Cursor, additionalInfo interface{}) bool {
	typedefName := typedef.Spelling()
	underlyingType := typedef.TypedefDeclUnderlyingType().Spelling()
	location := typedef.Location()
	file, _, _, _ := location.FileLocation()
	fileName := file.Name()

	// Blacklisted typedefs
	blacklist := []string{
		"SelectMgr_Vec3",
		"SelectMgr_Mat4",
		"Handle_Cocoa_Window",
		"Handle_Font_BRepFont",
		"Handle_PCDM_Reader",
		"Handle_PCDM_ReadWriter_1",
		"TColQuantity_Array1OfLength",
		"TopoDS_ListOfShape",
		"Handle_Graphic3d_Structure",
		"PCDM_BaseDriverPointer",
		"Handle_Xw_Window",
		"MoniTool_ValueInterpret",
		"Interface_ValueInterpret",
		"TopOpeBRepTool_IndexedDataMapOfSolidClassifier",
		"NCollection_Utf8Iter",
		"NCollection_Utf16Iter",
		"NCollection_Utf32Iter",
		"NCollection_UtfWideIter",
		"Extrema_UBTreeFillerOfSphere",
		"Graphic3d_Mat4",
		"Graphic3d_Mat4d",
		"TObj_TIntSparseArray_VecOfData",
		"TObj_TIntSparseArray_MapOfData",
		"XCAFDimTolObjects_DatumModifiersSequence",
		"BRepBuilderAPI_BndBoxTree",
		"Extrema_UBTreeOfSphere",
		"ShapeAnalysis_BoxBndTree",
		"BRepClass3d_BndBoxTree",
		"BRepBuilderAPI_CellFilter",
		"IntSurf_Allocator",
		"TDF_HAllocator",
		"Interface_VectorOfFileParameter",
		"Handle_StepKinematics_UnconstrainedPair",
		"Handle_StepKinematics_UnconstrainedPairValue",
		"OpenGl_ListOfStructure",
		"Graphic3d_Vec2",
		"Graphic3d_Vec3",
	}

	for _, name := range blacklist {
		if typedefName == name {
			return false
		}
	}

	// Skip iterator typedefs
	if strings.Contains(underlyingType, "::Iterator") {
		return false
	}

	// Whitelist certain patterns
	if fileName == "myMain.h" ||
		strings.HasPrefix(underlyingType, "opencascade::handle") ||
		strings.HasPrefix(underlyingType, "handle") ||
		strings.HasPrefix(underlyingType, "NCollection") {
		return true
	}

	return false
}
