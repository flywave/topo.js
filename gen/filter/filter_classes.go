package filter

import (
	"strings"

	"github.com/go-clang/clang-v15/clang"
)

func FilterClass(theClass clang.Cursor, additionalInfo interface{}) bool {
	className := theClass.Spelling()

	// Out of scope classes
	if strings.HasPrefix(className, "D3DHost") || strings.HasPrefix(className, "IVtk") {
		return false
	}

	// Classes with undefined symbols or implementation issues
	blacklist := []string{
		"GCPnts_DistFunction2d",
		"GeomFill_SweepSectionGenerator",
		"Geom2dGcc_FunctionTanCuCuCu",
		"DsgPrs_RadiusPresentation",
		"GCPnts_DistFunction",
		"WNT_HIDSpaceMouse",
		"Standard_Dump",
		"CDF_DirectoryIterator",
		"Geom2dEvaluator",
		"PrsDim_Dimension",
		"FSD_BinaryFile",
		"Font_BRepFont",
		"Message_LazyProgressScope",
		"FSD_File",
		"gp_VectorWithNullMagnitude",
		"BRepTest_Objects",
		"BOPAlgo_PaveFiller",
		"BRepGProp_Gauss",
		"BRepFeat",
		"GeomTools_UndefinedTypeHandler",
		"BRepFeat_MakeLinearForm",
		"BRepApprox_Approx",
		"BRepGProp_VinertGK",
		"BRepOffset_MakeOffset",
		"BRepOffsetAPI_FindContigousEdges",
		"BRepApprox_ResConstraintOfMyGradientbisOfTheComputeLineOfApprox",
		"BRepApprox_ResConstraintOfMyGradientOfTheComputeLineBezierOfApprox",
		"Standard_ErrorHandler",
		"Geom_HSequenceOfBSplineSurface",
		"TopOpeBRepBuild_Builder",
		"TopOpeBRepBuild_Builder1",
		"Poly_CoherentTriPtr",
		"STEPSelections_Counter",
		"DrawDim_PlanarDimension",
		"Interface_Graph",
		"HLRBRep_CLProps",
		"HLRBRep_Intersector",
		"HLRBRep_BSurfaceTool",
		"IGESData_IGESReaderData",
		"IGESToBRep_TopoSurface",
		"StepData_FreeFormEntity",
		"StepData_UndefinedEntity",
		"HLRBRep_Surface",
		"HLRBRep_ThePolyhedronOfInterCSurf",
		"HLRBRep_TheCurveLocatorOfTheProjPCurOfCInter",
		"IntCurveSurface_ThePolyhedronOfHInter",
		"IntPolyh_MaillageAffinage",
		"IGESSelect_SelectBasicGeom",
		"ShapeFix_WireSegment",
		"StepFEA_SymmetricTensor43d",
		"IFSelect_EditForm",
		"IFSelect_IntParam",
		"IFSelect_ContextModif",
		"IntTools_PntOnFace",
		"IntImpParGen_ImpTool",
		"Interface_FileReaderData",
		"Interface_GeneralModule",
		"Interface_HGraph",
		"RWHeaderSection_GeneralModule",
		"Prs3d_ToolQuadric",
		"OSD_FileNode",
		"OSD_File",
		"NCollection_ListNode",
		"NCollection_SeqNode",
		"RWStepAP214_GeneralModule",
		"RWStepShape_RWBrepWithVoids",
		"RWStepShape_RWEdgeCurve",
		"RWStepShape_RWEdgeLoop",
		"RWStepShape_RWFaceBound",
		"ShapePersistent_BRep",
		"ShapePersistent_Geom",
		"ShapePersistent_Geom2d_Curve",
		"ShapePersistent_Geom2d",
		"ShapePersistent_Geom_Curve",
		"ShapePersistent_Geom_Surface",
		"ShapePersistent_Poly",
		"ShapePersistent_TopoDS",
		"StdPersistent_TopLoc",
		"StepData_DefaultGeneral",
		"TDF_LabelNode",
		"StepData_GeneralModule",
		"TopClass_SolidExplorer",
		"UTL",
		"VrmlData_IndexedFaceSet",
		"VrmlData_IndexedLineSet",
		"VrmlData_Scene",
		"XBRepMesh",
		"TransferBRep",
		"Graphic3d_CubeMap",
		"Storage_BaseDriver",
		"GeomFill_NSections",
		"math_IntegerVector",
		"math_Matrix",
		"math_Vector",
		"AIS_Dimension",
		"IntPatch_Polyhedron",
		"IntPatch_RLine",
		"Xw_Window",
		"StepKinematics_UnconstrainedPair",
		"StepKinematics_UnconstrainedPairValue",
		"VectorOfPoint",
		"Resource_DataMapOfAsciiStringAsciiString",
	}

	for _, name := range blacklist {
		if className == name {
			return false
		}
	}

	// Prefix-based blacklist
	prefixBlacklist := []string{
		"AdvApp2Var",
		"BRepTest",
		"BRepMeshData_",
		"Media",
		"BOPTest",
		"BOPTest_Objects",
		"BOPTest_DrawableShape",
		"Draw_Drawable3D",
		"DBRep_DrawableShape",
	}

	for _, prefix := range prefixBlacklist {
		if strings.HasPrefix(className, prefix) {
			return false
		}
	}

	// Additional class groups
	additionalBlacklist := []string{
		"LocOpe_Revol",
		"QANCollection",
		"MAT2d_CutCurve",
		"Law_Interpolate",
		"LocOpe_RevolutionForm",
		"MeshTest_CheckTopology",
		"ProjLib_ProjectOnSurface",
		"QABugs_PresentableObject",
		"QABugs",
		"QADraw",
		"MeshTest",
		"OSD_Path",
		"QADNaming",
	}

	for _, name := range additionalBlacklist {
		if className == name {
			return false
		}
	}

	// Cocoa classes
	if strings.HasPrefix(className, "Cocoa") {
		return false
	}

	// Math classes
	if className == "math_NewtonMinimum" || className == "math_NewtonFunctionSetRoot" {
		return false
	}

	return true
}

func FilterAbstractClass(theClass clang.Cursor) bool {
	className := theClass.Spelling()

	abstractlist := []string{
		"Expr_BinaryExpression",
		"Expr_NamedExpression",
		"Expr_SingleRelation",
		"Expr_UnaryExpression",
		"Geom_BoundedSurface",
		"Geom_SweptSurface",
		"IFSelect_SelectBase",
		"IFSelect_SelectControl",
		"IFSelect_SelectDeduct",
		"PCDM_RetrievalDriver",
		"SelectMgr_CompositionFilter",
		"ShapeCustom_Modification",
		"TDataStd_GenericEmpty",
		"TDataStd_GenericExtString",
		"VrmlData_ArrayVec3d",
		"VrmlData_Faceted",
		"VrmlData_Texture",
		"VrmlData_TextureTransform",
		"Aspect_CircularGrid",
		"Aspect_RectangularGrid",
		"BRepMesh_ConstrainedBaseMeshAlgo",
		"SelectMgr_BaseFrustum",
	}

	for _, name := range abstractlist {
		if className == name {
			return false
		}
	}
	return true
}
