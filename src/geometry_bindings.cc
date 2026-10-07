#include "binding.hh"
#include "geometry_creator.hh"
#include "binding_guard.hh"

using namespace flywave;
using namespace flywave::topo;

EMSCRIPTEN_BINDINGS(Geometry) {

  emscripten::class_<geometry_creator>("GeometryCreator")
      // 圆弧创建方法
      .class_function(
          "makeArcOfCircle",
          emscripten::optional_override([](const gp_Circ & a1, const Standard_Real a2, const Standard_Real a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfCircle") }))
      .class_function("makeArcOfCircleWithPoint",
                      emscripten::optional_override([](const gp_Circ & a1, const gp_Pnt & a2, const Standard_Real a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfCircleWithPoint") }))
      .class_function(
          "makeArcOfCircleWithTwoPoints",
          emscripten::optional_override([](const gp_Circ & a1, const gp_Pnt & a2, const gp_Pnt & a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfCircleWithTwoPoints") }))
      .class_function("makeArcOfCircleWithThreePoints",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3); } TOPO_BINDING_CATCH("makeArcOfCircleWithThreePoints") }))
      .class_function("makeArcOfCircleWithVector",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Vec & a2, const gp_Pnt & a3) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle_vector(a1, a2, a3); } TOPO_BINDING_CATCH("makeArcOfCircleWithVector") }))

      // 椭圆弧创建方法
      .class_function(
          "makeArcOfEllipse",
          emscripten::optional_override([](const gp_Elips & a1, const Standard_Real a2, const Standard_Real a3, bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfEllipse") }))
      .class_function("makeArcOfEllipseWithPoint",
                      emscripten::optional_override([](const gp_Elips & a1, const gp_Pnt & a2, const Standard_Real a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfEllipseWithPoint") }))
      .class_function(
          "makeArcOfEllipseWithTwoPoints",
          emscripten::optional_override([](const gp_Elips & a1, const gp_Pnt & a2, const gp_Pnt & a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfEllipseWithTwoPoints") }))

      // 双曲线弧创建方法
      .class_function(
          "makeArcOfHyperbola",
          emscripten::optional_override([](const gp_Hypr & a1, const Standard_Real a2, const Standard_Real a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfHyperbola") }))
      .class_function(
          "makeArcOfHyperbolaWithPoint",
          emscripten::optional_override([](const gp_Hypr & a1, const gp_Pnt & a2, const Standard_Real a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfHyperbolaWithPoint") }))
      .class_function(
          "makeArcOfHyperbolaWithTwoPoints",
          emscripten::optional_override([](const gp_Hypr & a1, const gp_Pnt & a2, const gp_Pnt & a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfHyperbolaWithTwoPoints") }))

      // 抛物线弧创建方法
      .class_function(
          "makeArcOfParabola",
          emscripten::optional_override([](const gp_Parab & a1, const Standard_Real a2, const Standard_Real a3, bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_parabola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfParabola") }))
      .class_function("makeArcOfParabolaWithPoint",
                      emscripten::optional_override([](const gp_Parab & a1, const gp_Pnt & a2, const Standard_Real a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_parabola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfParabolaWithPoint") }))
      .class_function(
          "makeArcOfParabolaWithTwoPoints",
          emscripten::optional_override([](const gp_Parab & a1, const gp_Pnt & a2, const gp_Pnt & a3, const bool a4) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_arc_of_parabola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeArcOfParabolaWithTwoPoints") }))

      // 圆创建方法
      .class_function(
          "makeCircle",
          emscripten::optional_override([](const gp_Circ & a1) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1); } TOPO_BINDING_CATCH("makeCircle") }))
      .class_function("makeCircleWithAxis",
                      emscripten::optional_override([](const gp_Ax2 & a1, const Standard_Real a2) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1, a2); } TOPO_BINDING_CATCH("makeCircleWithAxis") }))
      .class_function("makeCircleWithDistance",
                      emscripten::optional_override([](const gp_Circ & a1, const Standard_Real a2) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1, a2); } TOPO_BINDING_CATCH("makeCircleWithDistance") }))
      .class_function(
          "makeCircleWithPoint",
          emscripten::optional_override([](const gp_Circ & a1, const gp_Pnt & a2) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1, a2); } TOPO_BINDING_CATCH("makeCircleWithPoint") }))
      .class_function("makeCircleWithThreePoints",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1, a2, a3); } TOPO_BINDING_CATCH("makeCircleWithThreePoints") }))
      .class_function("makeCircleWithCenterNormal",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Dir & a2, const Standard_Real a3) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1, a2, a3); } TOPO_BINDING_CATCH("makeCircleWithCenterNormal") }))
      .class_function("makeCircleWithCenterAxisPoint",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const Standard_Real a3) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1, a2, a3); } TOPO_BINDING_CATCH("makeCircleWithCenterAxisPoint") }))
      .class_function("makeCircleWithAxis1",
                      emscripten::optional_override([](const gp_Ax1 & a1, const Standard_Real a2) -> Handle(Geom_Circle) { try { return geometry_creator::make_circle(a1, a2); } TOPO_BINDING_CATCH("makeCircleWithAxis1") }))

      // 椭圆创建方法
      .class_function(
          "makeEllipse",
          emscripten::optional_override([](const gp_Elips & a1) -> Handle(Geom_Ellipse) { try { return geometry_creator::make_ellipse(a1); } TOPO_BINDING_CATCH("makeEllipse") }))
      .class_function(
          "makeEllipseWithAxis",
          emscripten::optional_override([](const gp_Ax2 & a1, const Standard_Real a2, const Standard_Real a3) -> Handle(Geom_Ellipse) { try { return geometry_creator::make_ellipse(a1, a2, a3); } TOPO_BINDING_CATCH("makeEllipseWithAxis") }))
      .class_function("makeEllipseWithThreePoints",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3) -> Handle(Geom_Ellipse) { try { return geometry_creator::make_ellipse(a1, a2, a3); } TOPO_BINDING_CATCH("makeEllipseWithThreePoints") }))

      // 双曲线创建方法
      .class_function(
          "makeHyperbola",
          emscripten::optional_override([](const gp_Hypr & a1) -> Handle(Geom_Hyperbola) { try { return geometry_creator::make_hyperbola(a1); } TOPO_BINDING_CATCH("makeHyperbola") }))
      .class_function(
          "makeHyperbolaWithAxis",
          emscripten::optional_override([](const gp_Ax2 & a1, const Standard_Real a2, const Standard_Real a3) -> Handle(Geom_Hyperbola) { try { return geometry_creator::make_hyperbola(a1, a2, a3); } TOPO_BINDING_CATCH("makeHyperbolaWithAxis") }))
      .class_function("makeHyperbolaWithThreePoints",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3) -> Handle(Geom_Hyperbola) { try { return geometry_creator::make_hyperbola(a1, a2, a3); } TOPO_BINDING_CATCH("makeHyperbolaWithThreePoints") }))

      // 圆锥曲面创建方法
      .class_function(
          "makeConicalSurface",
          emscripten::optional_override([](const gp_Ax2 & a1, const Standard_Real a2, const Standard_Real a3) -> Handle(Geom_ConicalSurface) { try { return geometry_creator::make_conical_surface(a1, a2, a3); } TOPO_BINDING_CATCH("makeConicalSurface") }))
      .class_function(
          "makeConicalSurfaceWithCone",
          emscripten::optional_override([](const gp_Cone & a1) -> Handle(Geom_ConicalSurface) { try { return geometry_creator::make_conical_surface(a1); } TOPO_BINDING_CATCH("makeConicalSurfaceWithCone") }))
      .class_function(
          "makeConicalSurfaceWithFourPoints",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3, const gp_Pnt & a4) -> Handle(Geom_ConicalSurface) { try { return geometry_creator::make_conical_surface(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeConicalSurfaceWithFourPoints") }))
      .class_function(
          "makeConicalSurfaceWithTwoPointsTwoRadii",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const Standard_Real a3, const Standard_Real a4) -> Handle(Geom_ConicalSurface) { try { return geometry_creator::make_conical_surface(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeConicalSurfaceWithTwoPointsTwoRadii") }))

      // 圆柱曲面创建方法
      .class_function(
          "makeCylindricalSurface",
          emscripten::optional_override([](const gp_Ax2 & a1, const Standard_Real a2) -> Handle(Geom_CylindricalSurface) { try { return geometry_creator::make_cylindrical_surface(a1, a2); } TOPO_BINDING_CATCH("makeCylindricalSurface") }))
      .class_function("makeCylindricalSurfaceWithCylinder",
                      emscripten::optional_override([](const gp_Cylinder & a1) -> Handle(
                          Geom_CylindricalSurface) { try { return geometry_creator::make_cylindrical_surface(a1); } TOPO_BINDING_CATCH("makeCylindricalSurfaceWithCylinder") }))
      .class_function(
          "makeCylindricalSurfaceWithPoint",
          emscripten::optional_override([](const gp_Cylinder & a1, const gp_Pnt & a2) -> Handle(Geom_CylindricalSurface) { try { return geometry_creator::make_cylindrical_surface(a1, a2); } TOPO_BINDING_CATCH("makeCylindricalSurfaceWithPoint") }))
      .class_function(
          "makeCylindricalSurfaceWithDistance",
          emscripten::optional_override([](const gp_Cylinder & a1, const Standard_Real a2) -> Handle(Geom_CylindricalSurface) { try { return geometry_creator::make_cylindrical_surface(a1, a2); } TOPO_BINDING_CATCH("makeCylindricalSurfaceWithDistance") }))
      .class_function(
          "makeCylindricalSurfaceWithThreePoints",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3) -> Handle(Geom_CylindricalSurface) { try { return geometry_creator::make_cylindrical_surface(a1, a2, a3); } TOPO_BINDING_CATCH("makeCylindricalSurfaceWithThreePoints") }))
      .class_function(
          "makeCylindricalSurfaceWithAxis1",
          emscripten::optional_override([](const gp_Ax1 & a1, const Standard_Real a2) -> Handle(Geom_CylindricalSurface) { try { return geometry_creator::make_cylindrical_surface(a1, a2); } TOPO_BINDING_CATCH("makeCylindricalSurfaceWithAxis1") }))
      .class_function(
          "makeCylindricalSurfaceWithCirc",
          emscripten::optional_override([](const gp_Circ & a1) -> Handle(Geom_CylindricalSurface) { try { return geometry_creator::make_cylindrical_surface(a1); } TOPO_BINDING_CATCH("makeCylindricalSurfaceWithCirc") }))

      // 直线创建方法
      .class_function(
          "makeLine",
          emscripten::optional_override([](const gp_Ax1 & a1) -> Handle(Geom_Line) { try { return geometry_creator::make_line(a1); } TOPO_BINDING_CATCH("makeLine") }))
      .class_function(
          "makeLineWithLin",
          emscripten::optional_override([](const gp_Lin & a1) -> Handle(Geom_Line) { try { return geometry_creator::make_line(a1); } TOPO_BINDING_CATCH("makeLineWithLin") }))
      .class_function(
          "makeLineWithPointDir",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Dir & a2) -> Handle(Geom_Line) { try { return geometry_creator::make_line(a1, a2); } TOPO_BINDING_CATCH("makeLineWithPointDir") }))
      .class_function(
          "makeLineWithLinPoint",
          emscripten::optional_override([](const gp_Lin & a1, const gp_Pnt & a2) -> Handle(Geom_Line) { try { return geometry_creator::make_line(a1, a2); } TOPO_BINDING_CATCH("makeLineWithLinPoint") }))
      .class_function(
          "makeLineWithTwoPoints",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2) -> Handle(Geom_Line) { try { return geometry_creator::make_line(a1, a2); } TOPO_BINDING_CATCH("makeLineWithTwoPoints") }))

      // 镜像变换创建方法
      .class_function("makeMirrorWithPoint",
                      emscripten::optional_override([](const gp_Pnt & a1) -> Handle(Geom_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("makeMirrorWithPoint") }))
      .class_function("makeMirrorWithAxis1",
                      emscripten::optional_override([](const gp_Ax1 & a1) -> Handle(Geom_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("makeMirrorWithAxis1") }))
      .class_function("makeMirrorWithLin",
                      emscripten::optional_override([](const gp_Lin & a1) -> Handle(Geom_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("makeMirrorWithLin") }))
      .class_function(
          "makeMirrorWithPointDir",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Dir & a2) -> Handle(Geom_Transformation) { try { return geometry_creator::make_mirror(a1, a2); } TOPO_BINDING_CATCH("makeMirrorWithPointDir") }))
      .class_function("makeMirrorWithPln",
                      emscripten::optional_override([](const gp_Pln & a1) -> Handle(Geom_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("makeMirrorWithPln") }))
      .class_function("makeMirrorWithAxis2",
                      emscripten::optional_override([](const gp_Ax2 & a1) -> Handle(Geom_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("makeMirrorWithAxis2") }))

      // 旋转变换创建方法
      .class_function("makeRotationWithLin",
                      emscripten::optional_override([](const gp_Lin & a1, const Standard_Real a2) -> Handle(Geom_Transformation) { try { return geometry_creator::make_rotation(a1, a2); } TOPO_BINDING_CATCH("makeRotationWithLin") }))
      .class_function("makeRotationWithAxis1",
                      emscripten::optional_override([](const gp_Ax1 & a1, const Standard_Real a2) -> Handle(Geom_Transformation) { try { return geometry_creator::make_rotation(a1, a2); } TOPO_BINDING_CATCH("makeRotationWithAxis1") }))
      .class_function("makeRotationWithPointDir",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Dir & a2, const Standard_Real a3) -> Handle(Geom_Transformation) { try { return geometry_creator::make_rotation(a1, a2, a3); } TOPO_BINDING_CATCH("makeRotationWithPointDir") }))

      // 平移变换创建方法
      .class_function("makeTranslationWithVec",
                      emscripten::optional_override([](const gp_Vec & a1) -> Handle(Geom_Transformation) { try { return geometry_creator::make_translation(a1); } TOPO_BINDING_CATCH("makeTranslationWithVec") }))
      .class_function("makeTranslationWithTwoPoints",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2) -> Handle(Geom_Transformation) { try { return geometry_creator::make_translation(a1, a2); } TOPO_BINDING_CATCH("makeTranslationWithTwoPoints") }))

      // 缩放变换创建方法
      .class_function("makeScale",
                      emscripten::optional_override([](const gp_Pnt & a1, const Standard_Real a2) -> Handle(Geom_Transformation) { try { return geometry_creator::make_scale(a1, a2); } TOPO_BINDING_CATCH("makeScale") }))

      // 平面创建方法
      .class_function(
          "makePlane",
          emscripten::optional_override([](const gp_Pln & a1) -> Handle(Geom_Plane) { try { return geometry_creator::make_plane(a1); } TOPO_BINDING_CATCH("makePlane") }))
      .class_function(
          "makePlaneWithPointDir",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Dir & a2) -> Handle(Geom_Plane) { try { return geometry_creator::make_plane(a1, a2); } TOPO_BINDING_CATCH("makePlaneWithPointDir") }))
      .class_function(
          "makePlaneWithCoefficients",
          emscripten::optional_override([](const Standard_Real a1, const Standard_Real a2, const Standard_Real a3, const Standard_Real a4) -> Handle(Geom_Plane) { try { return geometry_creator::make_plane(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makePlaneWithCoefficients") }))
      .class_function(
          "makePlaneWithPlnPoint",
          emscripten::optional_override([](const gp_Pln & a1, const gp_Pnt & a2) -> Handle(Geom_Plane) { try { return geometry_creator::make_plane(a1, a2); } TOPO_BINDING_CATCH("makePlaneWithPlnPoint") }))
      .class_function("makePlaneWithPlnDistance",
                      emscripten::optional_override([](const gp_Pln & a1, const Standard_Real a2) -> Handle(Geom_Plane) { try { return geometry_creator::make_plane(a1, a2); } TOPO_BINDING_CATCH("makePlaneWithPlnDistance") }))
      .class_function("makePlaneWithThreePoints",
                      emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3) -> Handle(Geom_Plane) { try { return geometry_creator::make_plane(a1, a2, a3); } TOPO_BINDING_CATCH("makePlaneWithThreePoints") }))
      .class_function(
          "makePlaneWithAxis1",
          emscripten::optional_override([](const gp_Ax1 & a1) -> Handle(Geom_Plane) { try { return geometry_creator::make_plane(a1); } TOPO_BINDING_CATCH("makePlaneWithAxis1") }))

      // 线段创建方法
      .class_function(
          "makeSegmentWithTwoPoints",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_segment(a1, a2); } TOPO_BINDING_CATCH("makeSegmentWithTwoPoints") }))
      .class_function(
          "makeSegmentWithLinParams",
          emscripten::optional_override([](const gp_Lin & a1, const Standard_Real a2, const Standard_Real a3) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_segment(a1, a2, a3); } TOPO_BINDING_CATCH("makeSegmentWithLinParams") }))
      .class_function("makeSegmentWithLinPointParam",
                      emscripten::optional_override([](const gp_Lin & a1, const gp_Pnt & a2, const Standard_Real a3) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_segment(a1, a2, a3); } TOPO_BINDING_CATCH("makeSegmentWithLinPointParam") }))
      .class_function("makeSegmentWithLinTwoPoints",
                      emscripten::optional_override([](const gp_Lin & a1, const gp_Pnt & a2, const gp_Pnt & a3) -> Handle(Geom_TrimmedCurve) { try { return geometry_creator::make_segment(a1, a2, a3); } TOPO_BINDING_CATCH("makeSegmentWithLinTwoPoints") }))

      // 修剪圆锥曲面创建方法
      .class_function(
          "makeTrimmedConeWithFourPoints",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const gp_Pnt & a3, const gp_Pnt & a4) -> Handle(Geom_RectangularTrimmedSurface) { try { return geometry_creator::make_trimmed_cone(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeTrimmedConeWithFourPoints") }))
      .class_function(
          "makeTrimmedConeWithTwoPointsTwoRadii",
          emscripten::optional_override([](const gp_Pnt & a1, const gp_Pnt & a2, const Standard_Real a3, const Standard_Real a4) -> Handle(Geom_RectangularTrimmedSurface) { try { return geometry_creator::make_trimmed_cone(a1, a2, a3, a4); } TOPO_BINDING_CATCH("makeTrimmedConeWithTwoPointsTwoRadii") }))

      // 修剪圆柱曲面创建方法
      .class_function("makeTrimmedCylinderWithThreePoints",
                      select_overload<Handle(Geom_RectangularTrimmedSurface)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_trimmed_cylinder))
      .class_function("makeTrimmedCylinderWithCirc",
                      select_overload<Handle(Geom_RectangularTrimmedSurface)(
                          const gp_Circ &, Standard_Real)>(
                          &geometry_creator::make_trimmed_cylinder))
      .class_function("makeTrimmedCylinderWithAxis1",
                      select_overload<Handle(Geom_RectangularTrimmedSurface)(
                          const gp_Ax1 &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_trimmed_cylinder))

      // 曲线近似转换方法
      .class_function(
          "convertApproxCurve",
          emscripten::optional_override([](const Handle(Geom_Curve) & a1, const Standard_Real a2, const GeomAbs_Shape a3, const Standard_Integer a4, const Standard_Integer a5) -> Handle(Geom_BSplineCurve) { try { return geometry_creator::convert_approx_curve(a1, a2, a3, a4, a5); } TOPO_BINDING_CATCH("convertApproxCurve") }))

      // 曲面近似转换方法
      .class_function("convertApproxSurface",
                      emscripten::optional_override([](const Handle(Geom_Surface) & a1, const Standard_Real a2, const GeomAbs_Shape a3, const GeomAbs_Shape a4, const Standard_Integer a5, const Standard_Integer a6, const Standard_Integer a7, const Standard_Integer a8) -> Handle(Geom_BSplineSurface) { try { return geometry_creator::convert_approx_surface(a1, a2, a3, a4, a5, a6, a7, a8); } TOPO_BINDING_CATCH("convertApproxSurface") }))

      // 2D圆弧创建方法
      .class_function(
          "make2dArcOfCircle",
          emscripten::optional_override([](const gp_Circ2d & a1, Standard_Real a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfCircle") }))
      .class_function(
          "make2dArcOfCircleWithPoint",
          emscripten::optional_override([](const gp_Circ2d & a1, const gp_Pnt2d & a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfCircleWithPoint") }))
      .class_function(
          "make2dArcOfCircleWithTwoPoints",
          emscripten::optional_override([](const gp_Circ2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfCircleWithTwoPoints") }))
      .class_function(
          "make2dArcOfCircleWithThreePoints",
          emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle(a1, a2, a3); } TOPO_BINDING_CATCH("make2dArcOfCircleWithThreePoints") }))
      .class_function(
          "make2dArcOfCircleWithVector",
          emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Vec2d & a2, const gp_Pnt2d & a3) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_circle_vector(a1, a2, a3); } TOPO_BINDING_CATCH("make2dArcOfCircleWithVector") }))

      // 2D几何创建方法
      .class_function(
          "make2dArcOfEllipse",
          emscripten::optional_override([](const gp_Elips2d & a1, const Standard_Real a2, const Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfEllipse") }))
      .class_function(
          "make2dArcOfHyperbola",
          emscripten::optional_override([](const gp_Hypr2d & a1, const Standard_Real a2, const Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfHyperbola") }))
      .class_function(
          "make2dArcOfParabola",
          emscripten::optional_override([](const gp_Parab2d & a1, const Standard_Real a2, const Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_parabola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfParabola") }))

      // 2D椭圆弧创建方法
      .class_function(
          "make2dArcOfEllipse",
          emscripten::optional_override([](const gp_Elips2d & a1, Standard_Real a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfEllipse") }))
      .class_function(
          "make2dArcOfEllipseWithPoint",
          emscripten::optional_override([](const gp_Elips2d & a1, const gp_Pnt2d & a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfEllipseWithPoint") }))
      .class_function(
          "make2dArcOfEllipseWithTwoPoints",
          emscripten::optional_override([](const gp_Elips2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfEllipseWithTwoPoints") }))

      // 2D双曲线弧创建方法
      .class_function(
          "make2dArcOfHyperbola",
          emscripten::optional_override([](const gp_Hypr2d & a1, Standard_Real a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfHyperbola") }))
      .class_function(
          "make2dArcOfHyperbolaWithPoint",
          emscripten::optional_override([](const gp_Hypr2d & a1, const gp_Pnt2d & a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfHyperbolaWithPoint") }))
      .class_function(
          "make2dArcOfHyperbolaWithTwoPoints",
          emscripten::optional_override([](const gp_Hypr2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfHyperbolaWithTwoPoints") }))

      // 2D抛物线弧创建方法
      .class_function(
          "make2dArcOfParabola",
          emscripten::optional_override([](const gp_Parab2d & a1, Standard_Real a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_parabola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfParabola") }))
      .class_function(
          "make2dArcOfParabolaWithPoint",
          emscripten::optional_override([](const gp_Parab2d & a1, const gp_Pnt2d & a2, Standard_Real a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_parabola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfParabolaWithPoint") }))
      .class_function(
          "make2dArcOfParabolaWithTwoPoints",
          emscripten::optional_override([](const gp_Parab2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3, bool a4) -> Handle(Geom2d_TrimmedCurve) { try { return geometry_creator::make_arc_of_parabola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dArcOfParabolaWithTwoPoints") }))

      // 2D圆创建方法
      .class_function(
          "make2dCircle",
          emscripten::optional_override([](const gp_Circ2d & a1) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1); } TOPO_BINDING_CATCH("make2dCircle") }))
      .class_function("make2dCircleWithAxis",
                      emscripten::optional_override([](const gp_Ax2d & a1, Standard_Real a2, bool a3) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1, a2, a3); } TOPO_BINDING_CATCH("make2dCircleWithAxis") }))
      .class_function(
          "make2dCircleWithAxis2d",
          emscripten::optional_override([](const gp_Ax22d & a1, Standard_Real a2) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1, a2); } TOPO_BINDING_CATCH("make2dCircleWithAxis2d") }))
      .class_function("make2dCircleWithDistance",
                      emscripten::optional_override([](const gp_Circ2d & a1, Standard_Real a2) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1, a2); } TOPO_BINDING_CATCH("make2dCircleWithDistance") }))
      .class_function("make2dCircleWithPoint",
                      emscripten::optional_override([](const gp_Circ2d & a1, const gp_Pnt2d & a2) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1, a2); } TOPO_BINDING_CATCH("make2dCircleWithPoint") }))
      .class_function(
          "make2dCircleWithThreePoints",
          emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1, a2, a3); } TOPO_BINDING_CATCH("make2dCircleWithThreePoints") }))
      .class_function("make2dCircleWithCenterRadius",
                      emscripten::optional_override([](const gp_Pnt2d & a1, Standard_Real a2, bool a3) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1, a2, a3); } TOPO_BINDING_CATCH("make2dCircleWithCenterRadius") }))
      .class_function("make2dCircleWithCenterPoint",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2, bool a3) -> Handle(Geom2d_Circle) { try { return geometry_creator::make_circle(a1, a2, a3); } TOPO_BINDING_CATCH("make2dCircleWithCenterPoint") }))

      // 2D椭圆创建方法
      .class_function("make2dEllipse",
                      emscripten::optional_override([](const gp_Elips2d & a1) -> Handle(Geom2d_Ellipse) { try { return geometry_creator::make_ellipse(a1); } TOPO_BINDING_CATCH("make2dEllipse") }))
      .class_function("make2dEllipseWithMajorAxis",
                      emscripten::optional_override([](const gp_Ax2d & a1, Standard_Real a2, Standard_Real a3, bool a4) -> Handle(Geom2d_Ellipse) { try { return geometry_creator::make_ellipse(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dEllipseWithMajorAxis") }))
      .class_function("make2dEllipseWithAxis2d",
                      emscripten::optional_override([](const gp_Ax22d & a1, Standard_Real a2, Standard_Real a3) -> Handle(Geom2d_Ellipse) { try { return geometry_creator::make_ellipse(a1, a2, a3); } TOPO_BINDING_CATCH("make2dEllipseWithAxis2d") }))
      .class_function(
          "make2dEllipseWithThreePoints",
          emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3) -> Handle(Geom2d_Ellipse) { try { return geometry_creator::make_ellipse(a1, a2, a3); } TOPO_BINDING_CATCH("make2dEllipseWithThreePoints") }))

      // 2D双曲线创建方法
      .class_function(
          "make2dHyperbola",
          emscripten::optional_override([](const gp_Hypr2d & a1) -> Handle(Geom2d_Hyperbola) { try { return geometry_creator::make_hyperbola(a1); } TOPO_BINDING_CATCH("make2dHyperbola") }))
      .class_function("make2dHyperbolaWithMajorAxis",
                      emscripten::optional_override([](const gp_Ax2d & a1, Standard_Real a2, Standard_Real a3, bool a4) -> Handle(Geom2d_Hyperbola) { try { return geometry_creator::make_hyperbola(a1, a2, a3, a4); } TOPO_BINDING_CATCH("make2dHyperbolaWithMajorAxis") }))
      .class_function("make2dHyperbolaWithAxis2d",
                      emscripten::optional_override([](const gp_Ax22d & a1, Standard_Real a2, Standard_Real a3) -> Handle(Geom2d_Hyperbola) { try { return geometry_creator::make_hyperbola(a1, a2, a3); } TOPO_BINDING_CATCH("make2dHyperbolaWithAxis2d") }))
      .class_function(
          "make2dHyperbolaWithThreePoints",
          emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2, const gp_Pnt2d & a3) -> Handle(Geom2d_Hyperbola) { try { return geometry_creator::make_hyperbola(a1, a2, a3); } TOPO_BINDING_CATCH("make2dHyperbolaWithThreePoints") }))

      // 2D直线创建方法
      .class_function(
          "make2dLine",
          emscripten::optional_override([](const gp_Ax2d & a1) -> Handle(Geom2d_Line) { try { return geometry_creator::make_line(a1); } TOPO_BINDING_CATCH("make2dLine") }))
      .class_function(
          "make2dLineWithLin2d",
          emscripten::optional_override([](const gp_Lin2d & a1) -> Handle(Geom2d_Line) { try { return geometry_creator::make_line(a1); } TOPO_BINDING_CATCH("make2dLineWithLin2d") }))
      .class_function("make2dLineWithPointDir",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Dir2d & a2) -> Handle(Geom2d_Line) { try { return geometry_creator::make_line(a1, a2); } TOPO_BINDING_CATCH("make2dLineWithPointDir") }))
      .class_function("make2dLineWithLinPoint",
                      emscripten::optional_override([](const gp_Lin2d & a1, const gp_Pnt2d & a2) -> Handle(Geom2d_Line) { try { return geometry_creator::make_line(a1, a2); } TOPO_BINDING_CATCH("make2dLineWithLinPoint") }))
      .class_function(
          "make2dLineWithLinDistance",
          emscripten::optional_override([](const gp_Lin2d & a1, Standard_Real a2) -> Handle(Geom2d_Line) { try { return geometry_creator::make_line(a1, a2); } TOPO_BINDING_CATCH("make2dLineWithLinDistance") }))
      .class_function("make2dLineWithTwoPoints",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2) -> Handle(Geom2d_Line) { try { return geometry_creator::make_line(a1, a2); } TOPO_BINDING_CATCH("make2dLineWithTwoPoints") }))

      // 2D抛物线创建方法
      .class_function(
          "make2dParabola",
          emscripten::optional_override([](const gp_Parab2d & a1) -> Handle(Geom2d_Parabola) { try { return geometry_creator::make_parabola(a1); } TOPO_BINDING_CATCH("make2dParabola") }))
      .class_function("make2dParabolaWithAxis",
                      emscripten::optional_override([](const gp_Ax22d & a1, Standard_Real a2) -> Handle(Geom2d_Parabola) { try { return geometry_creator::make_parabola(a1, a2); } TOPO_BINDING_CATCH("make2dParabolaWithAxis") }))
      .class_function("make2dParabolaWithMirrorAxis",
                      emscripten::optional_override([](const gp_Ax2d & a1, Standard_Real a2, bool a3) -> Handle(Geom2d_Parabola) { try { return geometry_creator::make_parabola(a1, a2, a3); } TOPO_BINDING_CATCH("make2dParabolaWithMirrorAxis") }))
      .class_function("make2dParabolaWithDirectrix",
                      emscripten::optional_override([](const gp_Ax2d & a1, const gp_Pnt2d & a2, bool a3) -> Handle(Geom2d_Parabola) { try { return geometry_creator::make_parabola(a1, a2, a3); } TOPO_BINDING_CATCH("make2dParabolaWithDirectrix") }))
      .class_function("make2dParabolaWithTwoPoints",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2) -> Handle(Geom2d_Parabola) { try { return geometry_creator::make_parabola(a1, a2); } TOPO_BINDING_CATCH("make2dParabolaWithTwoPoints") }))
      // 2D线段创建方法
      .class_function("make2dSegment",
                      select_overload<Handle(Geom2d_TrimmedCurve)(
                          const gp_Pnt2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_segment))
      .class_function(
          "make2dSegmentWithDirection",
          select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Pnt2d &, const gp_Dir2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_segment))
      .class_function("make2dSegmentWithLineParams",
                      select_overload<Handle(Geom2d_TrimmedCurve)(
                          const gp_Lin2d &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_segment))
      .class_function("make2dSegmentWithLinePointParam",
                      select_overload<Handle(Geom2d_TrimmedCurve)(
                          const gp_Lin2d &, const gp_Pnt2d &, Standard_Real)>(
                          &geometry_creator::make_segment))
      .class_function(
          "make2dSegmentWithLineTwoPoints",
          select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Lin2d &, const gp_Pnt2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_segment))

      // 2D变换创建方法
      .class_function("make2dMirror",
                      emscripten::optional_override([](const gp_Pnt2d & a1) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("make2dMirror") }))
      .class_function("make2dMirrorWithAxis",
                      emscripten::optional_override([](const gp_Ax2d & a1) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("make2dMirrorWithAxis") }))
      .class_function("make2dMirrorWithLine",
                      emscripten::optional_override([](const gp_Lin2d & a1) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_mirror(a1); } TOPO_BINDING_CATCH("make2dMirrorWithLine") }))
      .class_function("make2dMirrorWithPointDir",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Dir2d & a2) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_mirror(a1, a2); } TOPO_BINDING_CATCH("make2dMirrorWithPointDir") }))

      // 2D旋转创建方法
      .class_function("make2dRotation",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const Standard_Real a2) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_rotation(a1, a2); } TOPO_BINDING_CATCH("make2dRotation") }))

      // 2D缩放创建方法
      .class_function("make2dScale",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const Standard_Real a2) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_scale(a1, a2); } TOPO_BINDING_CATCH("make2dScale") }))

      // 2D平移创建方法
      .class_function(
          "make2dTranslation",
          emscripten::optional_override([](const gp_Vec2d & a1) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_translation(a1); } TOPO_BINDING_CATCH("make2dTranslation") }))
      .class_function("make2dTranslationWithPoints",
                      emscripten::optional_override([](const gp_Pnt2d & a1, const gp_Pnt2d & a2) -> Handle(Geom2d_Transformation) { try { return geometry_creator::make_translation(a1, a2); } TOPO_BINDING_CATCH("make2dTranslationWithPoints") }));
}