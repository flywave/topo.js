package filter

import "strings"

func FilterIncludeFile(filename string) bool {
	// Only process .hxx files
	if !strings.HasSuffix(filename, ".hxx") && !strings.HasSuffix(filename, ".h") {
		return false
	}

	if strings.HasPrefix(filename, "OpenGl_") {
		return false
	}

	// Files that cause 'file not found' errors
	fileNotFoundBlacklist := []string{
		"AIS_DataMapOfSelStat.hxx",
		"AIS_DataMapIteratorOfDataMapOfSelStat.hxx",
		"InterfaceGraphic.hxx",
		"Aspect_XWD.hxx",
		"IVtkDraw_Interactor.hxx",
		"IVtkVTK_View.hxx",
		"OSD_WNT.hxx",
		"WNT_Dword.hxx",
		"IVtkDraw_HighlightAndSelectionPipeline.hxx",
	}

	for _, blacklisted := range fileNotFoundBlacklist {
		if filename == blacklisted {
			return false
		}
	}

	// Files with atomic operation/platform issues
	atomicOpBlacklist := []string{
		"BVH_IndexedBoxSet.hxx",
		"BOPDS_Iterator.hxx",
		"BOPDS_IteratorSI.hxx",
		"BOPTools_BoxTree",
		"BOPTools_BoxTree.hxx",
		"BVH_LinearBuilder.hxx",
		"BVH_RadixSorter.hxx",
		"OSD_Parallel.hxx",
		"OSD_ThreadPool.hxx",
		"Standard_Atomic.hxx",
		"BOPTools_Parallel.hxx",
		"BVH_DistanceField.hxx",
	}

	for _, blacklisted := range atomicOpBlacklist {
		if filename == blacklisted {
			return false
		}
	}

	// VTK-related files
	vtkBlacklist := []string{
		"IVtk_Types.hxx",
		"IVtk_IShape.hxx",
		"IVtk_IShapeData.hxx",
		"IVtk_IShapeMesher.hxx",
		"IVtk_IShapePickerAlgo.hxx",
		"IVtkOCC_SelectableObject.hxx",
		"IVtkOCC_Shape.hxx",
		"IVtkOCC_ShapeMesher.hxx",
		"IVtkOCC_ShapePickerAlgo.hxx",
		"IVtkTools.hxx",
		"IVtkTools_DisplayModeFilter.hxx",
		"IVtkTools_ShapeDataSource.hxx",
		"IVtkTools_ShapeObject.hxx",
		"IVtkTools_ShapePicker.hxx",
		"IVtkTools_SubPolyDataFilter.hxx",
		"IVtkVTK_ShapeData.hxx",
	}

	for _, blacklisted := range vtkBlacklist {
		if filename == blacklisted {
			return false
		}
	}

	// Other problematic files
	if filename == "math_Householder.hxx" {
		return false
	}

	return true
}
