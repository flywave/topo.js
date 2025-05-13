#include "binding.hh"
#include "geometry_creator.hh"

using namespace flywave;
using namespace flywave::topo;

EMSCRIPTEN_BINDINGS(Geometry) {

  emscripten::class_<geometry_creator>("GeometryCreator")
      // 圆弧创建方法
      .class_function(
          "makeArcOfCircle",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Circ &, const Standard_Real, const Standard_Real,
              const bool)>(&geometry_creator::make_arc_of_circle))
      .class_function("makeArcOfCircleWithPoint",
                      emscripten::select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Circ &, const gp_Pnt &, const Standard_Real,
                          const bool)>(&geometry_creator::make_arc_of_circle))
      .class_function(
          "makeArcOfCircleWithTwoPoints",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Circ &, const gp_Pnt &, const gp_Pnt &, const bool)>(
              &geometry_creator::make_arc_of_circle))
      .class_function("makeArcOfCircleWithThreePoints",
                      emscripten::select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_arc_of_circle))
      .class_function("makeArcOfCircleWithVector",
                      emscripten::select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Pnt &, const gp_Vec &, const gp_Pnt &)>(
                          &geometry_creator::make_arc_of_circle_vector))

      // 椭圆弧创建方法
      .class_function(
          "makeArcOfEllipse",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Elips &, const Standard_Real, const Standard_Real,
              bool)>(&geometry_creator::make_arc_of_ellipse))
      .class_function("makeArcOfEllipseWithPoint",
                      emscripten::select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Elips &, const gp_Pnt &, const Standard_Real,
                          const bool)>(&geometry_creator::make_arc_of_ellipse))
      .class_function(
          "makeArcOfEllipseWithTwoPoints",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Elips &, const gp_Pnt &, const gp_Pnt &, const bool)>(
              &geometry_creator::make_arc_of_ellipse))

      // 双曲线弧创建方法
      .class_function(
          "makeArcOfHyperbola",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Hypr &, const Standard_Real, const Standard_Real,
              const bool)>(&geometry_creator::make_arc_of_hyperbola))
      .class_function(
          "makeArcOfHyperbolaWithPoint",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Hypr &, const gp_Pnt &, const Standard_Real,
              const bool)>(&geometry_creator::make_arc_of_hyperbola))
      .class_function(
          "makeArcOfHyperbolaWithTwoPoints",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Hypr &, const gp_Pnt &, const gp_Pnt &, const bool)>(
              &geometry_creator::make_arc_of_hyperbola))

      // 抛物线弧创建方法
      .class_function(
          "makeArcOfParabola",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Parab &, const Standard_Real, const Standard_Real,
              bool)>(&geometry_creator::make_arc_of_parabola))
      .class_function("makeArcOfParabolaWithPoint",
                      emscripten::select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Parab &, const gp_Pnt &, const Standard_Real,
                          const bool)>(&geometry_creator::make_arc_of_parabola))
      .class_function(
          "makeArcOfParabolaWithTwoPoints",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Parab &, const gp_Pnt &, const gp_Pnt &, const bool)>(
              &geometry_creator::make_arc_of_parabola))

      // 圆创建方法
      .class_function(
          "makeCircle",
          emscripten::select_overload<Handle(Geom_Circle)(const gp_Circ &)>(
              &geometry_creator::make_circle))
      .class_function("makeCircleWithAxis",
                      emscripten::select_overload<Handle(Geom_Circle)(
                          const gp_Ax2 &, const Standard_Real)>(
                          &geometry_creator::make_circle))
      .class_function("makeCircleWithDistance",
                      emscripten::select_overload<Handle(Geom_Circle)(
                          const gp_Circ &, const Standard_Real)>(
                          &geometry_creator::make_circle))
      .class_function(
          "makeCircleWithPoint",
          emscripten::select_overload<Handle(Geom_Circle)(
              const gp_Circ &, const gp_Pnt &)>(&geometry_creator::make_circle))
      .class_function("makeCircleWithThreePoints",
                      emscripten::select_overload<Handle(Geom_Circle)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_circle))
      .class_function("makeCircleWithCenterNormal",
                      emscripten::select_overload<Handle(Geom_Circle)(
                          const gp_Pnt &, const gp_Dir &, const Standard_Real)>(
                          &geometry_creator::make_circle))
      .class_function("makeCircleWithCenterAxisPoint",
                      emscripten::select_overload<Handle(Geom_Circle)(
                          const gp_Pnt &, const gp_Pnt &, const Standard_Real)>(
                          &geometry_creator::make_circle))
      .class_function("makeCircleWithAxis1",
                      emscripten::select_overload<Handle(Geom_Circle)(
                          const gp_Ax1 &, const Standard_Real)>(
                          &geometry_creator::make_circle))

      // 椭圆创建方法
      .class_function(
          "makeEllipse",
          emscripten::select_overload<Handle(Geom_Ellipse)(const gp_Elips &)>(
              &geometry_creator::make_ellipse))
      .class_function(
          "makeEllipseWithAxis",
          emscripten::select_overload<Handle(Geom_Ellipse)(
              const gp_Ax2 &, const Standard_Real, const Standard_Real)>(
              &geometry_creator::make_ellipse))
      .class_function("makeEllipseWithThreePoints",
                      emscripten::select_overload<Handle(Geom_Ellipse)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_ellipse))

      // 双曲线创建方法
      .class_function(
          "makeHyperbola",
          emscripten::select_overload<Handle(Geom_Hyperbola)(const gp_Hypr &)>(
              &geometry_creator::make_hyperbola))
      .class_function(
          "makeHyperbolaWithAxis",
          emscripten::select_overload<Handle(Geom_Hyperbola)(
              const gp_Ax2 &, const Standard_Real, const Standard_Real)>(
              &geometry_creator::make_hyperbola))
      .class_function("makeHyperbolaWithThreePoints",
                      emscripten::select_overload<Handle(Geom_Hyperbola)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_hyperbola))

      // 圆锥曲面创建方法
      .class_function(
          "makeConicalSurface",
          emscripten::select_overload<Handle(Geom_ConicalSurface)(
              const gp_Ax2 &, const Standard_Real, const Standard_Real)>(
              &geometry_creator::make_conical_surface))
      .class_function(
          "makeConicalSurfaceWithCone",
          emscripten::select_overload<Handle(Geom_ConicalSurface)(
              const gp_Cone &)>(&geometry_creator::make_conical_surface))
      .class_function(
          "makeConicalSurfaceWithFourPoints",
          emscripten::select_overload<Handle(Geom_ConicalSurface)(
              const gp_Pnt &, const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
              &geometry_creator::make_conical_surface))
      .class_function(
          "makeConicalSurfaceWithTwoPointsTwoRadii",
          emscripten::select_overload<Handle(Geom_ConicalSurface)(
              const gp_Pnt &, const gp_Pnt &, const Standard_Real,
              const Standard_Real)>(&geometry_creator::make_conical_surface))

      // 圆柱曲面创建方法
      .class_function(
          "makeCylindricalSurface",
          emscripten::select_overload<Handle(Geom_CylindricalSurface)(
              const gp_Ax2 &, const Standard_Real)>(
              &geometry_creator::make_cylindrical_surface))
      .class_function("makeCylindricalSurfaceWithCylinder",
                      emscripten::select_overload<Handle(
                          Geom_CylindricalSurface)(const gp_Cylinder &)>(
                          &geometry_creator::make_cylindrical_surface))
      .class_function(
          "makeCylindricalSurfaceWithPoint",
          emscripten::select_overload<Handle(Geom_CylindricalSurface)(
              const gp_Cylinder &, const gp_Pnt &)>(
              &geometry_creator::make_cylindrical_surface))
      .class_function(
          "makeCylindricalSurfaceWithDistance",
          emscripten::select_overload<Handle(Geom_CylindricalSurface)(
              const gp_Cylinder &, const Standard_Real)>(
              &geometry_creator::make_cylindrical_surface))
      .class_function(
          "makeCylindricalSurfaceWithThreePoints",
          emscripten::select_overload<Handle(Geom_CylindricalSurface)(
              const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
              &geometry_creator::make_cylindrical_surface))
      .class_function(
          "makeCylindricalSurfaceWithAxis1",
          emscripten::select_overload<Handle(Geom_CylindricalSurface)(
              const gp_Ax1 &, const Standard_Real)>(
              &geometry_creator::make_cylindrical_surface))
      .class_function(
          "makeCylindricalSurfaceWithCirc",
          emscripten::select_overload<Handle(Geom_CylindricalSurface)(
              const gp_Circ &)>(&geometry_creator::make_cylindrical_surface))

      // 直线创建方法
      .class_function(
          "makeLine",
          emscripten::select_overload<Handle(Geom_Line)(const gp_Ax1 &)>(
              &geometry_creator::make_line))
      .class_function(
          "makeLineWithLin",
          emscripten::select_overload<Handle(Geom_Line)(const gp_Lin &)>(
              &geometry_creator::make_line))
      .class_function(
          "makeLineWithPointDir",
          emscripten::select_overload<Handle(Geom_Line)(
              const gp_Pnt &, const gp_Dir &)>(&geometry_creator::make_line))
      .class_function(
          "makeLineWithLinPoint",
          emscripten::select_overload<Handle(Geom_Line)(
              const gp_Lin &, const gp_Pnt &)>(&geometry_creator::make_line))
      .class_function(
          "makeLineWithTwoPoints",
          emscripten::select_overload<Handle(Geom_Line)(
              const gp_Pnt &, const gp_Pnt &)>(&geometry_creator::make_line))

      // 镜像变换创建方法
      .class_function("makeMirrorWithPoint",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Pnt &)>(&geometry_creator::make_mirror))
      .class_function("makeMirrorWithAxis1",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Ax1 &)>(&geometry_creator::make_mirror))
      .class_function("makeMirrorWithLin",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Lin &)>(&geometry_creator::make_mirror))
      .class_function(
          "makeMirrorWithPointDir",
          emscripten::select_overload<Handle(Geom_Transformation)(
              const gp_Pnt &, const gp_Dir &)>(&geometry_creator::make_mirror))
      .class_function("makeMirrorWithPln",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Pln &)>(&geometry_creator::make_mirror))
      .class_function("makeMirrorWithAxis2",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Ax2 &)>(&geometry_creator::make_mirror))

      // 旋转变换创建方法
      .class_function("makeRotationWithLin",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Lin &, const Standard_Real)>(
                          &geometry_creator::make_rotation))
      .class_function("makeRotationWithAxis1",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Ax1 &, const Standard_Real)>(
                          &geometry_creator::make_rotation))
      .class_function("makeRotationWithPointDir",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Pnt &, const gp_Dir &, const Standard_Real)>(
                          &geometry_creator::make_rotation))

      // 平移变换创建方法
      .class_function("makeTranslationWithVec",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Vec &)>(&geometry_creator::make_translation))
      .class_function("makeTranslationWithTwoPoints",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_translation))

      // 缩放变换创建方法
      .class_function("makeScale",
                      emscripten::select_overload<Handle(Geom_Transformation)(
                          const gp_Pnt &, const Standard_Real)>(
                          &geometry_creator::make_scale))

      // 平面创建方法
      .class_function(
          "makePlane",
          emscripten::select_overload<Handle(Geom_Plane)(const gp_Pln &)>(
              &geometry_creator::make_plane))
      .class_function(
          "makePlaneWithPointDir",
          emscripten::select_overload<Handle(Geom_Plane)(
              const gp_Pnt &, const gp_Dir &)>(&geometry_creator::make_plane))
      .class_function(
          "makePlaneWithCoefficients",
          emscripten::select_overload<Handle(Geom_Plane)(
              const Standard_Real, const Standard_Real, const Standard_Real,
              const Standard_Real)>(&geometry_creator::make_plane))
      .class_function(
          "makePlaneWithPlnPoint",
          emscripten::select_overload<Handle(Geom_Plane)(
              const gp_Pln &, const gp_Pnt &)>(&geometry_creator::make_plane))
      .class_function("makePlaneWithPlnDistance",
                      emscripten::select_overload<Handle(Geom_Plane)(
                          const gp_Pln &, const Standard_Real)>(
                          &geometry_creator::make_plane))
      .class_function("makePlaneWithThreePoints",
                      emscripten::select_overload<Handle(Geom_Plane)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_plane))
      .class_function(
          "makePlaneWithAxis1",
          emscripten::select_overload<Handle(Geom_Plane)(const gp_Ax1 &)>(
              &geometry_creator::make_plane))

      // 线段创建方法
      .class_function(
          "makeSegmentWithTwoPoints",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Pnt &, const gp_Pnt &)>(&geometry_creator::make_segment))
      .class_function(
          "makeSegmentWithLinParams",
          emscripten::select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Lin &, const Standard_Real, const Standard_Real)>(
              &geometry_creator::make_segment))
      .class_function("makeSegmentWithLinPointParam",
                      emscripten::select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Lin &, const gp_Pnt &, const Standard_Real)>(
                          &geometry_creator::make_segment))
      .class_function("makeSegmentWithLinTwoPoints",
                      emscripten::select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Lin &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_segment))

      // 修剪圆锥曲面创建方法
      .class_function(
          "makeTrimmedConeWithFourPoints",
          emscripten::select_overload<Handle(Geom_RectangularTrimmedSurface)(
              const gp_Pnt &, const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
              &geometry_creator::make_trimmed_cone))
      .class_function(
          "makeTrimmedConeWithTwoPointsTwoRadii",
          emscripten::select_overload<Handle(Geom_RectangularTrimmedSurface)(
              const gp_Pnt &, const gp_Pnt &, const Standard_Real,
              const Standard_Real)>(&geometry_creator::make_trimmed_cone))

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
          emscripten::select_overload<Handle(Geom_BSplineCurve)(
              const Handle(Geom_Curve) &, const Standard_Real,
              const GeomAbs_Shape, const Standard_Integer,
              const Standard_Integer)>(&geometry_creator::convert_approx_curve))

      // 曲面近似转换方法
      .class_function("convertApproxSurface",
                      emscripten::select_overload<Handle(Geom_BSplineSurface)(
                          const Handle(Geom_Surface) &, const Standard_Real,
                          const GeomAbs_Shape, const GeomAbs_Shape,
                          const Standard_Integer, const Standard_Integer,
                          const Standard_Integer, const Standard_Integer)>(
                          &geometry_creator::convert_approx_surface))

      // 2D圆弧创建方法
      .class_function(
          "make2dArcOfCircle",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Circ2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_circle))
      .class_function(
          "make2dArcOfCircleWithPoint",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Circ2d &, const gp_Pnt2d &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_circle))
      .class_function(
          "make2dArcOfCircleWithTwoPoints",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Circ2d &, const gp_Pnt2d &, const gp_Pnt2d &, bool)>(
              &geometry_creator::make_arc_of_circle))
      .class_function(
          "make2dArcOfCircleWithThreePoints",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Pnt2d &, const gp_Pnt2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_arc_of_circle))
      .class_function(
          "make2dArcOfCircleWithVector",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Pnt2d &, const gp_Vec2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_arc_of_circle_vector))

      // 2D几何创建方法
      .class_function(
          "make2dArcOfEllipse",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Elips2d &, const Standard_Real, const Standard_Real,
              bool)>(&geometry_creator::make_arc_of_ellipse))
      .class_function(
          "make2dArcOfHyperbola",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Hypr2d &, const Standard_Real, const Standard_Real,
              bool)>(&geometry_creator::make_arc_of_hyperbola))
      .class_function(
          "make2dArcOfParabola",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Parab2d &, const Standard_Real, const Standard_Real,
              bool)>(&geometry_creator::make_arc_of_parabola))

      // 2D椭圆弧创建方法
      .class_function(
          "make2dArcOfEllipse",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Elips2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_ellipse))
      .class_function(
          "make2dArcOfEllipseWithPoint",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Elips2d &, const gp_Pnt2d &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_ellipse))
      .class_function(
          "make2dArcOfEllipseWithTwoPoints",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Elips2d &, const gp_Pnt2d &, const gp_Pnt2d &, bool)>(
              &geometry_creator::make_arc_of_ellipse))

      // 2D双曲线弧创建方法
      .class_function(
          "make2dArcOfHyperbola",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Hypr2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_hyperbola))
      .class_function(
          "make2dArcOfHyperbolaWithPoint",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Hypr2d &, const gp_Pnt2d &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_hyperbola))
      .class_function(
          "make2dArcOfHyperbolaWithTwoPoints",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Hypr2d &, const gp_Pnt2d &, const gp_Pnt2d &, bool)>(
              &geometry_creator::make_arc_of_hyperbola))

      // 2D抛物线弧创建方法
      .class_function(
          "make2dArcOfParabola",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Parab2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_parabola))
      .class_function(
          "make2dArcOfParabolaWithPoint",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Parab2d &, const gp_Pnt2d &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_parabola))
      .class_function(
          "make2dArcOfParabolaWithTwoPoints",
          emscripten::select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Parab2d &, const gp_Pnt2d &, const gp_Pnt2d &, bool)>(
              &geometry_creator::make_arc_of_parabola))

      // 2D圆创建方法
      .class_function(
          "make2dCircle",
          emscripten::select_overload<Handle(Geom2d_Circle)(const gp_Circ2d &)>(
              &geometry_creator::make_circle))
      .class_function("make2dCircleWithAxis",
                      emscripten::select_overload<Handle(Geom2d_Circle)(
                          const gp_Ax2d &, Standard_Real, bool)>(
                          &geometry_creator::make_circle))
      .class_function(
          "make2dCircleWithAxis2d",
          emscripten::select_overload<Handle(Geom2d_Circle)(
              const gp_Ax22d &, Standard_Real)>(&geometry_creator::make_circle))
      .class_function("make2dCircleWithDistance",
                      emscripten::select_overload<Handle(Geom2d_Circle)(
                          const gp_Circ2d &, Standard_Real)>(
                          &geometry_creator::make_circle))
      .class_function("make2dCircleWithPoint",
                      emscripten::select_overload<Handle(Geom2d_Circle)(
                          const gp_Circ2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_circle))
      .class_function(
          "make2dCircleWithThreePoints",
          emscripten::select_overload<Handle(Geom2d_Circle)(
              const gp_Pnt2d &, const gp_Pnt2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_circle))
      .class_function("make2dCircleWithCenterRadius",
                      emscripten::select_overload<Handle(Geom2d_Circle)(
                          const gp_Pnt2d &, Standard_Real, bool)>(
                          &geometry_creator::make_circle))
      .class_function("make2dCircleWithCenterPoint",
                      emscripten::select_overload<Handle(Geom2d_Circle)(
                          const gp_Pnt2d &, const gp_Pnt2d &, bool)>(
                          &geometry_creator::make_circle))

      // 2D椭圆创建方法
      .class_function("make2dEllipse",
                      emscripten::select_overload<Handle(Geom2d_Ellipse)(
                          const gp_Elips2d &)>(&geometry_creator::make_ellipse))
      .class_function("make2dEllipseWithMajorAxis",
                      emscripten::select_overload<Handle(Geom2d_Ellipse)(
                          const gp_Ax2d &, Standard_Real, Standard_Real, bool)>(
                          &geometry_creator::make_ellipse))
      .class_function("make2dEllipseWithAxis2d",
                      emscripten::select_overload<Handle(Geom2d_Ellipse)(
                          const gp_Ax22d &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_ellipse))
      .class_function(
          "make2dEllipseWithThreePoints",
          emscripten::select_overload<Handle(Geom2d_Ellipse)(
              const gp_Pnt2d &, const gp_Pnt2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_ellipse))

      // 2D双曲线创建方法
      .class_function(
          "make2dHyperbola",
          emscripten::select_overload<Handle(Geom2d_Hyperbola)(
              const gp_Hypr2d &)>(&geometry_creator::make_hyperbola))
      .class_function("make2dHyperbolaWithMajorAxis",
                      emscripten::select_overload<Handle(Geom2d_Hyperbola)(
                          const gp_Ax2d &, Standard_Real, Standard_Real, bool)>(
                          &geometry_creator::make_hyperbola))
      .class_function("make2dHyperbolaWithAxis2d",
                      emscripten::select_overload<Handle(Geom2d_Hyperbola)(
                          const gp_Ax22d &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_hyperbola))
      .class_function(
          "make2dHyperbolaWithThreePoints",
          emscripten::select_overload<Handle(Geom2d_Hyperbola)(
              const gp_Pnt2d &, const gp_Pnt2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_hyperbola))

      // 2D直线创建方法
      .class_function(
          "make2dLine",
          emscripten::select_overload<Handle(Geom2d_Line)(const gp_Ax2d &)>(
              &geometry_creator::make_line))
      .class_function(
          "make2dLineWithLin2d",
          emscripten::select_overload<Handle(Geom2d_Line)(const gp_Lin2d &)>(
              &geometry_creator::make_line))
      .class_function("make2dLineWithPointDir",
                      emscripten::select_overload<Handle(Geom2d_Line)(
                          const gp_Pnt2d &, const gp_Dir2d &)>(
                          &geometry_creator::make_line))
      .class_function("make2dLineWithLinPoint",
                      emscripten::select_overload<Handle(Geom2d_Line)(
                          const gp_Lin2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_line))
      .class_function(
          "make2dLineWithLinDistance",
          emscripten::select_overload<Handle(Geom2d_Line)(
              const gp_Lin2d &, Standard_Real)>(&geometry_creator::make_line))
      .class_function("make2dLineWithTwoPoints",
                      emscripten::select_overload<Handle(Geom2d_Line)(
                          const gp_Pnt2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_line))

      // 2D抛物线创建方法
      .class_function(
          "make2dParabola",
          emscripten::select_overload<Handle(Geom2d_Parabola)(
              const gp_Parab2d &)>(&geometry_creator::make_parabola))
      .class_function("make2dParabolaWithAxis",
                      emscripten::select_overload<Handle(Geom2d_Parabola)(
                          const gp_Ax22d &, Standard_Real)>(
                          &geometry_creator::make_parabola))
      .class_function("make2dParabolaWithMirrorAxis",
                      emscripten::select_overload<Handle(Geom2d_Parabola)(
                          const gp_Ax2d &, Standard_Real, bool)>(
                          &geometry_creator::make_parabola))
      .class_function("make2dParabolaWithDirectrix",
                      emscripten::select_overload<Handle(Geom2d_Parabola)(
                          const gp_Ax2d &, const gp_Pnt2d &, bool)>(
                          &geometry_creator::make_parabola))
      .class_function("make2dParabolaWithTwoPoints",
                      emscripten::select_overload<Handle(Geom2d_Parabola)(
                          const gp_Pnt2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_parabola))
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
                      emscripten::select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &)>(&geometry_creator::make_mirror))
      .class_function("make2dMirrorWithAxis",
                      emscripten::select_overload<Handle(Geom2d_Transformation)(
                          const gp_Ax2d &)>(&geometry_creator::make_mirror))
      .class_function("make2dMirrorWithLine",
                      emscripten::select_overload<Handle(Geom2d_Transformation)(
                          const gp_Lin2d &)>(&geometry_creator::make_mirror))
      .class_function("make2dMirrorWithPointDir",
                      emscripten::select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &, const gp_Dir2d &)>(
                          &geometry_creator::make_mirror))

      // 2D旋转创建方法
      .class_function("make2dRotation",
                      emscripten::select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &, const Standard_Real)>(
                          &geometry_creator::make_rotation))

      // 2D缩放创建方法
      .class_function("make2dScale",
                      emscripten::select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &, const Standard_Real)>(
                          &geometry_creator::make_scale))

      // 2D平移创建方法
      .class_function(
          "make2dTranslation",
          emscripten::select_overload<Handle(Geom2d_Transformation)(
              const gp_Vec2d &)>(&geometry_creator::make_translation))
      .class_function("make2dTranslationWithPoints",
                      emscripten::select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_translation));
}