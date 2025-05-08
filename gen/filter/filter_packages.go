package filter

func FilterPackages(packageName string) bool {
	if packageName == "" {
		return false
	}

	// List of excluded packages
	excludedPackages := []string{
		// Full Module Draw
		"DBRep",
		"Draw",
		"DrawTrSurf",
		"D3DHostTest",
		"IVtkDraw",
		"BOPTest",
		"BRepTest",
		"DrawFairCurve",
		"GeometryTest",
		"GeomliteTest",
		"HLRTest",
		"MeshTest",
		"SWDRAW",
		"ViewerTest",
		"OpenGlTest",
		"DDF",
		"DDataStd",
		"DDocStd",
		"DNaming",
		"DPrsStd",
		"DrawDim",
		"TObjDRAW",
		"XSDRAW",
		"XSDRAWIGES",
		"XSDRAWSTEP",
		"XSDRAWSTLVRML",
		"QABugs",
		"QADNaming",
		"QADraw",
		"QANCollection",
		"XDEDRAW",
		"OpenGl",

		// Partial Module Visualization
		"D3DHost",
		"IVtk",
		"IVtkOCC",
		"IVtkTools",
		"IVtkVTK",
		"MeshVS",
		"Cocoa",
		"XBRepMesh",
	}

	for _, pkg := range excludedPackages {
		if packageName == pkg {
			return false
		}
	}

	return true
}
