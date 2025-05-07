package filter

import (
	"fmt"
	"strings"

	"github.com/go-clang/clang-v15/clang"
)

func FilterMethodOrProperty(theClass clang.Cursor, methodOrProperty clang.Cursor) bool {
	className := theClass.Spelling()
	methodName := methodOrProperty.Spelling()
	methodType := methodOrProperty.Type().Spelling()
	methodKind := methodOrProperty.Kind()

	// Method/Property specific filters
	switch {
	// Undefined symbols
	case className == "AppDef_MultiLine" && methodName == "SetParameter":
		return false

	case className == "BSplCLib" && methodName == "DN":
		return false

	case className == "BlendFunc" && (methodName == "Knots" || methodName == "Mults"):
		return false

	case (className == "AppDef_TheResol" ||
		className == "AppDef_ResConstraintOfTheGradient" ||
		className == "AppDef_ResConstraintOfMyGradientOfCompute" ||
		className == "AppDef_ResConstraintOfMyGradientbisOfBSplineCompute") &&
		methodName == "Error":
		return false

	case className == "BinTools_Curve2dSet" && methodName == "Dump":
		return false

	// Deleted constructors
	case (className == "BinObjMgt_Persistent" && methodName == "Read") ||
		(className == "BinTools" && methodName == "GetReal") ||
		(className == "BinTools" && methodName == "GetShortReal") ||
		(className == "BinTools" && methodName == "GetInteger") ||
		(className == "BinTools" && methodName == "GetBool") ||
		(className == "BinTools" && methodName == "GetExtChar") ||
		(className == "BinTools_SurfaceSet" && methodName == "ReadSurface") ||
		(className == "BinTools_Curve2dSet" && methodName == "ReadCurve2d") ||
		(className == "BinTools_CurveSet" && methodName == "ReadCurve") ||
		(className == "BinTools_IStream" && methodName == "Stream"):
		return false

	// Function binding issues
	case (className == "MeshVS_DataSource" && (methodName == "GetGeom" || methodName == "GetGeomType")) ||
		(className == "MeshVS_DeformedDataSource" && (methodName == "GetGeom" || methodName == "GetGeomType")) ||
		(className == "Interface_STAT" && (methodName == "Description" || methodName == "Phase")):
		return false

	// Private constructors
	case (className == "VrmlData_Node" && methodName == "Scene") ||
		(className == "Font_FTFont" && methodName == "GlyphImage") ||
		(className == "LDOMString" && methodName == "getOwnerDocument") ||
		(className == "LDOM_MemManager" && methodName == "Self") ||
		(className == "Aspect_VKeySet" && methodName == "Mutex") ||
		(className == "Image_VideoRecorder" && methodName == "ChangeFrame") ||
		(className == "StdPrs_BRepFont" && methodName == "Mutex") ||
		(className == "AdvApp2Var_Network" && methodName == "ChangePatch") ||
		(className == "AdvApp2Var_Framework" && methodName == "IsoU") ||
		(className == "LDOM_Node" && methodName == "getOwnerDocument") ||
		(className == "AdvApp2Var_Network" && methodName == "Patch") ||
		(className == "AdvApp2Var_Framework" && methodName == "IsoV"):
		return false

	// Reference binding issues
	case className == "Resource_Unicode" ||
		(className == "NCollection_DataMap" && methodName == "Find") ||
		(className == "OSD_Thread" && methodName == "Wait") ||
		(className == "TCollection_ExtendedString" && methodName == "ToUTF8CString") ||
		(className == "Message" && methodName == "ToOSDMetric") ||
		(className == "OSD" && methodName == "RealToCString") ||
		(className == "XmlObjMgt" && methodName == "GetInteger") ||
		(className == "NCollection_IndexedDataMap" && methodName == "FindFromKey") ||
		(className == "XmlObjMgt" && methodName == "GetReal") ||
		(className == "BOPAlgo_Tools" && methodName == "PerformCommonBlocks") ||
		(className == "Transfer_Finder" && methodName == "GetStringAttribute") ||
		(className == "MoniTool_TypedValue" && methodName == "Internals") ||
		(className == "MoniTool_AttrList" && methodName == "GetStringAttribute") ||
		(className == "MoniTool_CaseData" && methodName == "Text") ||
		(className == "StepData_StepReaderData" && methodName == "ReadEnumParam") ||
		className == "XSControl_Vars" ||
		(className == "MeshVS_DataSource" && methodName == "GetGroup"):
		return false

	// Static assert failures
	case className == "Graphic3d_GraduatedTrihedron" && methodName == "CubicAxesCallback":
		return false

	// Bit-field issues
	case theClass.Type().Spelling() == "MeshVS_TwoColors":
		return false

	case className == "Graphic3d_CStructure" &&
		contains([]string{"IsInfinite", "stick", "highlight", "visible", "HLRValidation",
			"IsForHighlight", "IsMutable", "Is2dText"}, methodName):
		return false

	// Using declarations
	case methodOrProperty.AccessSpecifier() == clang.AccessSpecifier_Public &&
		methodKind == clang.Cursor_UsingDeclaration:
		fmt.Printf("Using declarations are not supported! (%s, %s)\n", className, methodName)
		return false

	// Stream-related issues
	case strings.HasPrefix(methodOrProperty.ResultType().Spelling(), "Standard_OStream") ||
		methodType == "std::ifstream":
		return false

	// Copy constructor issues
	case (className == "AIS_ViewController" && (methodName == "Keys" || methodName == "ChangeKeys")) ||
		(className == "Aspect_WindowInputListener" && (methodName == "Keys" || methodName == "ChangeKeys")):
		return false
	case className == "BRepClass3d_SolidExplorer" && methodName == "GetTree":
		return false

	// Template specialization issues
	case className == "NCollection_Lerp" && methodName == "Interpolate" && methodOrProperty.CXXMethod_IsStatic():
		return false

	// Memory growth issues
	case (className == "NCollection_Sequence" || className == "NCollection_List") &&
		strings.Contains(methodOrProperty.DisplayName(), "::Iterator"):
		return false

	// Undefined method implementations
	case className == "Geom2dHatch_Hatcher" && methodName == "IsDone":
		return false
	case className == "Geom2dAPI_Interpolate" && methodName == "ClearTangents":
		return false
	case className == "Geom2dGcc_Lin2dTanObl" && methodName == "IsParallel2":
		return false
	case className == "Geom2dInt_Geom2dCurveTool" && methodName == "IsComposite":
		return false
	case className == "Geom2dInt_TheCurveLocatorOfTheProjPCurOfGInter" && methodName == "Locate":
		return false
	case className == "GeomInt_IntSS" && (methodName == "SetTolFixTangents" || methodName == "TolFixTangents"):
		return false
	case className == "GeomAPI_Interpolate" && methodName == "ClearTangents":
		return false
	case className == "GeomFill_FunctionGuide" && methodName == "Deriv2T":
		return false
	case className == "GeomFill_SweepSectionGenerator" && methodName == "Init":
		return false
	case className == "GeomInt_ResConstraintOfMyGradientOfTheComputeLineBezierOfWLApprox" && methodName == "Error":
		return false
	case className == "GeomInt_ResConstraintOfMyGradientbisOfTheComputeLineOfWLApprox" && methodName == "Error":
		return false
	case className == "GeomInt_WLApprox" && methodName == "Perform":
		return false

	// Extrema-related issues
	case (className == "GeomAPI_ExtremaCurveSurface" || className == "GeomAPI_ExtremaCurveCurve") &&
		methodName == "Extrema":
		return false
	case className == "GeomAPI_ProjectPointOnSurf" && methodName == "Extrema":
		return false

	// Other specific cases
	case className == "Select3D_SensitiveTriangulation" && methodName == "LastDetectedTriangle":
		return false
	case className == "IntTools_Context" &&
		contains([]string{"FClass2d", "ProjPS", "SolidClassifier"}, methodName):
		return false
	case className == "Message_AttributeStream" && methodName == "Stream":
		return false
	case className == "OpenGl_Context" &&
		contains([]string{"ChangeClipping", "Clipping"}, methodName):
		return false
	case className == "OpenGl_GlFunctions" && methodKind == clang.Cursor_FieldDecl:
		return false
	case className == "OpenGl_GraphicDriver" &&
		contains([]string{"Options", "ChangeOptions"}, methodName):
		return false
	case className == "OpenGl_ShaderProgram" && methodName == "compileShaderVerbose":
		return false
	case className == "OpenGl_View" &&
		contains([]string{"SetTextureEnv", "SetBackgroundTextureStyle",
			"SetBackgroundGradient", "SetBackgroundGradientType"}, methodName):
		return false
	case (className == "NCollection_Vec2" || className == "NCollection_Vec3" || className == "NCollection_Vec4") &&
		methodName == "cwiseAbs":
		return false
	case className == "XCAFDoc_GeomTolerance" &&
		methodKind == clang.Cursor_Constructor &&
		methodType == "void (const opencascade::handle<XCAFDoc_GeomTolerance> &)":
		return false
	}

	return true
}

// Helper function to check if a string is in a slice
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
