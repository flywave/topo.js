#include "binding.hh"
#include "geometry_creator.hh"

EMSCRIPTEN_BINDINGS(Geometry) {

  class_<geometry_creator>("GeometryCreator")
      // 圆弧创建方法
      .class_function("makeArcOfCircle",
                      select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Circ &, Standard_Real, Standard_Real, bool)>(
                          &geometry_creator::make_arc_of_circle),
                      allow_raw_pointers())
      .class_function(
          "makeArcOfCircleWithPoint",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Circ &, const gp_Pnt &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_circle),
          allow_raw_pointers())
      .class_function(
          "makeArcOfCircleWithTwoPoints",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Circ &, const gp_Pnt &, const gp_Pnt &, bool)>(
              &geometry_creator::make_arc_of_circle),
          allow_raw_pointers())
      .class_function("makeArcOfCircleWithThreePoints",
                      select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_arc_of_circle),
                      allow_raw_pointers())
      .class_function("makeArcOfCircleWithVector",
                      &geometry_creator::make_arc_of_circle_vector,
                      allow_raw_pointers())

      // 椭圆弧创建方法
      .class_function(
          "makeArcOfEllipse",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Elips &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_ellipse),
          allow_raw_pointers())
      .class_function(
          "makeArcOfEllipseWithPoint",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Elips &, const gp_Pnt &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_ellipse),
          allow_raw_pointers())
      .class_function(
          "makeArcOfEllipseWithTwoPoints",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Elips &, const gp_Pnt &, const gp_Pnt &, bool)>(
              &geometry_creator::make_arc_of_ellipse),
          allow_raw_pointers())

      // 双曲线弧创建方法
      .class_function("makeArcOfHyperbola",
                      select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Hypr &, Standard_Real, Standard_Real, bool)>(
                          &geometry_creator::make_arc_of_hyperbola),
                      allow_raw_pointers())
      .class_function(
          "makeArcOfHyperbolaWithPoint",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Hypr &, const gp_Pnt &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_hyperbola),
          allow_raw_pointers())
      .class_function(
          "makeArcOfHyperbolaWithTwoPoints",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Hypr &, const gp_Pnt &, const gp_Pnt &, bool)>(
              &geometry_creator::make_arc_of_hyperbola),
          allow_raw_pointers())

      // 抛物线弧创建方法
      .class_function(
          "makeArcOfParabola",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Parab &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_parabola),
          allow_raw_pointers())
      .class_function(
          "makeArcOfParabolaWithPoint",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Parab &, const gp_Pnt &, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_parabola),
          allow_raw_pointers())
      .class_function(
          "makeArcOfParabolaWithTwoPoints",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Parab &, const gp_Pnt &, const gp_Pnt &, bool)>(
              &geometry_creator::make_arc_of_parabola),
          allow_raw_pointers())

      // 圆创建方法
      .class_function("makeCircle",
                      select_overload<Handle(Geom_Circle)(const gp_Circ &)>(
                          &geometry_creator::make_circle),
                      allow_raw_pointers())
      .class_function(
          "makeCircleWithAxis",
          select_overload<Handle(Geom_Circle)(const gp_Ax2 &, Standard_Real)>(
              &geometry_creator::make_circle),
          allow_raw_pointers())
      .class_function(
          "makeCircleWithDistance",
          select_overload<Handle(Geom_Circle)(const gp_Circ &, Standard_Real)>(
              &geometry_creator::make_circle),
          allow_raw_pointers())
      .class_function(
          "makeCircleWithPoint",
          select_overload<Handle(Geom_Circle)(const gp_Circ &, const gp_Pnt &)>(
              &geometry_creator::make_circle),
          allow_raw_pointers())
      .class_function("makeCircleWithThreePoints",
                      select_overload<Handle(Geom_Circle)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_circle),
                      allow_raw_pointers())
      .class_function("makeCircleWithCenterNormal",
                      select_overload<Handle(Geom_Circle)(
                          const gp_Pnt &, const gp_Dir &, Standard_Real)>(
                          &geometry_creator::make_circle),
                      allow_raw_pointers())
      .class_function("makeCircleWithCenterAxisPoint",
                      select_overload<Handle(Geom_Circle)(
                          const gp_Pnt &, const gp_Pnt &, Standard_Real)>(
                          &geometry_creator::make_circle),
                      allow_raw_pointers())
      .class_function(
          "makeCircleWithAxis1",
          select_overload<Handle(Geom_Circle)(const gp_Ax1 &, Standard_Real)>(
              &geometry_creator::make_circle),
          allow_raw_pointers())

      // 椭圆创建方法
      .class_function("makeEllipse",
                      select_overload<Handle(Geom_Ellipse)(const gp_Elips &)>(
                          &geometry_creator::make_ellipse),
                      allow_raw_pointers())
      .class_function("makeEllipseWithAxis",
                      select_overload<Handle(Geom_Ellipse)(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_ellipse),
                      allow_raw_pointers())
      .class_function("makeEllipseWithThreePoints",
                      select_overload<Handle(Geom_Ellipse)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_ellipse),
                      allow_raw_pointers())

      // 双曲线创建方法
      .class_function("makeHyperbola",
                      select_overload<Handle(Geom_Hyperbola)(const gp_Hypr &)>(
                          &geometry_creator::make_hyperbola),
                      allow_raw_pointers())
      .class_function("makeHyperbolaWithAxis",
                      select_overload<Handle(Geom_Hyperbola)(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_hyperbola),
                      allow_raw_pointers())
      .class_function("makeHyperbolaWithThreePoints",
                      select_overload<Handle(Geom_Hyperbola)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_hyperbola),
                      allow_raw_pointers())

      // 圆锥曲面创建方法
      .class_function("makeConicalSurface",
                      select_overload<Handle(Geom_ConicalSurface)(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_conical_surface),
                      allow_raw_pointers())
      .class_function(
          "makeConicalSurfaceWithCone",
          select_overload<Handle(Geom_ConicalSurface)(const gp_Cone &)>(
              &geometry_creator::make_conical_surface),
          allow_raw_pointers())
      .class_function(
          "makeConicalSurfaceWithFourPoints",
          select_overload<Handle(Geom_ConicalSurface)(
              const gp_Pnt &, const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
              &geometry_creator::make_conical_surface),
          allow_raw_pointers())
      .class_function(
          "makeConicalSurfaceWithTwoPointsTwoRadii",
          select_overload<Handle(Geom_ConicalSurface)(
              const gp_Pnt &, const gp_Pnt &, Standard_Real, Standard_Real)>(
              &geometry_creator::make_conical_surface),
          allow_raw_pointers())

      // 圆柱曲面创建方法
      .class_function("makeCylindricalSurface",
                      select_overload<Handle(Geom_CylindricalSurface)(
                          const gp_Ax2 &, Standard_Real)>(
                          &geometry_creator::make_cylindrical_surface),
                      allow_raw_pointers())
      .class_function(
          "makeCylindricalSurfaceWithCylinder",
          select_overload<Handle(Geom_CylindricalSurface)(const gp_Cylinder &)>(
              &geometry_creator::make_cylindrical_surface),
          allow_raw_pointers())
      .class_function("makeCylindricalSurfaceWithPoint",
                      select_overload<Handle(Geom_CylindricalSurface)(
                          const gp_Cylinder &, const gp_Pnt &)>(
                          &geometry_creator::make_cylindrical_surface),
                      allow_raw_pointers())
      .class_function("makeCylindricalSurfaceWithDistance",
                      select_overload<Handle(Geom_CylindricalSurface)(
                          const gp_Cylinder &, Standard_Real)>(
                          &geometry_creator::make_cylindrical_surface),
                      allow_raw_pointers())
      .class_function("makeCylindricalSurfaceWithThreePoints",
                      select_overload<Handle(Geom_CylindricalSurface)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_cylindrical_surface),
                      allow_raw_pointers())
      .class_function("makeCylindricalSurfaceWithAxis1",
                      select_overload<Handle(Geom_CylindricalSurface)(
                          const gp_Ax1 &, Standard_Real)>(
                          &geometry_creator::make_cylindrical_surface),
                      allow_raw_pointers())
      .class_function(
          "makeCylindricalSurfaceWithCirc",
          select_overload<Handle(Geom_CylindricalSurface)(const gp_Circ &)>(
              &geometry_creator::make_cylindrical_surface),
          allow_raw_pointers())

      // 直线创建方法
      .class_function("makeLine",
                      select_overload<Handle(Geom_Line)(const gp_Ax1 &)>(
                          &geometry_creator::make_line),
                      allow_raw_pointers())
      .class_function("makeLineWithLin",
                      select_overload<Handle(Geom_Line)(const gp_Lin &)>(
                          &geometry_creator::make_line),
                      allow_raw_pointers())
      .class_function(
          "makeLineWithPointDir",
          select_overload<Handle(Geom_Line)(const gp_Pnt &, const gp_Dir &)>(
              &geometry_creator::make_line),
          allow_raw_pointers())
      .class_function(
          "makeLineWithLinPoint",
          select_overload<Handle(Geom_Line)(const gp_Lin &, const gp_Pnt &)>(
              &geometry_creator::make_line),
          allow_raw_pointers())
      .class_function(
          "makeLineWithTwoPoints",
          select_overload<Handle(Geom_Line)(const gp_Pnt &, const gp_Pnt &)>(
              &geometry_creator::make_line),
          allow_raw_pointers())

      // 镜像变换创建方法
      .class_function(
          "makeMirrorWithPoint",
          select_overload<Handle(Geom_Transformation)(const gp_Pnt &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function(
          "makeMirrorWithAxis1",
          select_overload<Handle(Geom_Transformation)(const gp_Ax1 &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function(
          "makeMirrorWithLin",
          select_overload<Handle(Geom_Transformation)(const gp_Lin &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function(
          "makeMirrorWithPointDir",
          select_overload<Handle(Geom_Transformation)(
              const gp_Pnt &, const gp_Dir &)>(&geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function(
          "makeMirrorWithPln",
          select_overload<Handle(Geom_Transformation)(const gp_Pln &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function(
          "makeMirrorWithAxis2",
          select_overload<Handle(Geom_Transformation)(const gp_Ax2 &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())

      // 旋转变换创建方法
      .class_function(
          "makeRotationWithLin",
          select_overload<Handle(Geom_Transformation)(
              const gp_Lin &, Standard_Real)>(&geometry_creator::make_rotation),
          allow_raw_pointers())
      .class_function(
          "makeRotationWithAxis1",
          select_overload<Handle(Geom_Transformation)(
              const gp_Ax1 &, Standard_Real)>(&geometry_creator::make_rotation),
          allow_raw_pointers())
      .class_function("makeRotationWithPointDir",
                      select_overload<Handle(Geom_Transformation)(
                          const gp_Pnt &, const gp_Dir &, Standard_Real)>(
                          &geometry_creator::make_rotation),
                      allow_raw_pointers())

      // 平移变换创建方法
      .class_function(
          "makeTranslationWithVec",
          select_overload<Handle(Geom_Transformation)(const gp_Vec &)>(
              &geometry_creator::make_translation),
          allow_raw_pointers())
      .class_function("makeTranslationWithTwoPoints",
                      select_overload<Handle(Geom_Transformation)(
                          const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_translation),
                      allow_raw_pointers())

      // 缩放变换创建方法
      .class_function(
          "makeScale",
          select_overload<Handle(Geom_Transformation)(
              const gp_Pnt &, Standard_Real)>(&geometry_creator::make_scale),
          allow_raw_pointers())

      // 平面创建方法
      .class_function("makePlane",
                      select_overload<Handle(Geom_Plane)(const gp_Pln &)>(
                          &geometry_creator::make_plane),
                      allow_raw_pointers())
      .class_function(
          "makePlaneWithPointDir",
          select_overload<Handle(Geom_Plane)(const gp_Pnt &, const gp_Dir &)>(
              &geometry_creator::make_plane),
          allow_raw_pointers())
      .class_function(
          "makePlaneWithCoefficients",
          select_overload<Handle(Geom_Plane)(Standard_Real, Standard_Real,
                                             Standard_Real, Standard_Real)>(
              &geometry_creator::make_plane),
          allow_raw_pointers())
      .class_function(
          "makePlaneWithPlnPoint",
          select_overload<Handle(Geom_Plane)(const gp_Pln &, const gp_Pnt &)>(
              &geometry_creator::make_plane),
          allow_raw_pointers())
      .class_function(
          "makePlaneWithPlnDistance",
          select_overload<Handle(Geom_Plane)(const gp_Pln &, Standard_Real)>(
              &geometry_creator::make_plane),
          allow_raw_pointers())
      .class_function("makePlaneWithThreePoints",
                      select_overload<Handle(Geom_Plane)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_plane),
                      allow_raw_pointers())
      .class_function("makePlaneWithAxis1",
                      select_overload<Handle(Geom_Plane)(const gp_Ax1 &)>(
                          &geometry_creator::make_plane),
                      allow_raw_pointers())

      // 线段创建方法
      .class_function(
          "makeSegmentWithTwoPoints",
          select_overload<Handle(Geom_TrimmedCurve)(
              const gp_Pnt &, const gp_Pnt &)>(&geometry_creator::make_segment),
          allow_raw_pointers())
      .class_function("makeSegmentWithLinParams",
                      select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Lin &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_segment),
                      allow_raw_pointers())
      .class_function("makeSegmentWithLinPointParam",
                      select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Lin &, const gp_Pnt &, Standard_Real)>(
                          &geometry_creator::make_segment),
                      allow_raw_pointers())
      .class_function("makeSegmentWithLinTwoPoints",
                      select_overload<Handle(Geom_TrimmedCurve)(
                          const gp_Lin &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_segment),
                      allow_raw_pointers())

      // 修剪圆锥曲面创建方法
      .class_function(
          "makeTrimmedConeWithFourPoints",
          select_overload<Handle(Geom_RectangularTrimmedSurface)(
              const gp_Pnt &, const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
              &geometry_creator::make_trimmed_cone),
          allow_raw_pointers())
      .class_function(
          "makeTrimmedConeWithTwoPointsTwoRadii",
          select_overload<Handle(Geom_RectangularTrimmedSurface)(
              const gp_Pnt &, const gp_Pnt &, Standard_Real, Standard_Real)>(
              &geometry_creator::make_trimmed_cone),
          allow_raw_pointers())

      // 抛物线创建方法
      .class_function("makeParabola",
                      select_overload<Handle(Geom_Parabola)(const gp_Parab &)>(
                          &geometry_creator::make_parabola),
                      allow_raw_pointers())
      .class_function("makeParabolaWithAxis",
                      select_overload<Handle(Geom_Parabola)(const gp_Ax22d &,
                                                            Standard_Real)>(
                          &geometry_creator::make_parabola),
                      allow_raw_pointers())
      .class_function("makeParabolaWithMirrorAxis",
                      select_overload<Handle(Geom_Parabola)(
                          const gp_Ax2d &, Standard_Real, bool)>(
                          &geometry_creator::make_parabola),
                      allow_raw_pointers())
      .class_function("makeParabolaWithDirectrix",
                      select_overload<Handle(Geom_Parabola)(
                          const gp_Ax2d &, const gp_Pnt2d &, bool)>(
                          &geometry_creator::make_parabola),
                      allow_raw_pointers())
      .class_function("makeParabolaWithTwoPoints",
                      select_overload<Handle(Geom_Parabola)(const gp_Pnt2d &,
                                                            const gp_Pnt2d &)>(
                          &geometry_creator::make_parabola),
                      allow_raw_pointers())

      // 球面创建方法
      .class_function("makeSphericalSurface",
                      select_overload<Handle(Geom_SphericalSurface)(
                          const gp_Ax2 &, Standard_Real)>(
                          &geometry_creator::make_spherical_surface),
                      allow_raw_pointers())
      .class_function(
          "makeSphericalSurfaceWithSphere",
          select_overload<Handle(Geom_SphericalSurface)(const gp_Sphere &)>(
              &geometry_creator::make_spherical_surface),
          allow_raw_pointers())
      .class_function("makeSphericalSurfaceWithThreePoints",
                      select_overload<Handle(Geom_SphericalSurface)(
                          const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
                          &geometry_creator::make_spherical_surface),
                      allow_raw_pointers())
      .class_function(
          "makeSphericalSurfaceWithFourPoints",
          select_overload<Handle(Geom_SphericalSurface)(
              const gp_Pnt &, const gp_Pnt &, const gp_Pnt &, const gp_Pnt &)>(
              &geometry_creator::make_spherical_surface),
          allow_raw_pointers())

      // 圆环面创建方法
      .class_function("makeToroidalSurface",
                      select_overload<Handle(Geom_ToroidalSurface)(
                          const gp_Ax2 &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_toroidal_surface),
                      allow_raw_pointers())
      .class_function(
          "makeToroidalSurfaceWithTorus",
          select_overload<Handle(Geom_ToroidalSurface)(const gp_Torus &)>(
              &geometry_creator::make_toroidal_surface),
          allow_raw_pointers())

      // 曲线近似转换方法
      .class_function("convertApproxCurve",
                      select_overload<Handle(Geom_BSplineCurve)(
                          const Handle(Geom_Curve) &, Standard_Real,
                          GeomAbs_Shape, Standard_Integer, Standard_Integer)>(
                          &geometry_creator::convert_approx_curve),
                      allow_raw_pointers())

      // 曲面近似转换方法
      .class_function(
          "convertApproxSurface",
          select_overload<Handle(Geom_BSplineSurface)(
              const Handle(Geom_Surface) &, Standard_Real, GeomAbs_Shape,
              GeomAbs_Shape, Standard_Integer, Standard_Integer,
              Standard_Integer, Standard_Integer)>(
              &geometry_creator::convert_approx_surface),
          allow_raw_pointers())

      // 2D几何创建方法
      .class_function(
          "make2dArcOfCircle",
          select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Circ2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_circle),
          allow_raw_pointers())
      .class_function(
          "make2dArcOfEllipse",
          select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Elips2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_ellipse),
          allow_raw_pointers())
      .class_function(
          "make2dArcOfHyperbola",
          select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Hypr2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_hyperbola),
          allow_raw_pointers())
      .class_function(
          "make2dArcOfParabola",
          select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Parab2d &, Standard_Real, Standard_Real, bool)>(
              &geometry_creator::make_arc_of_parabola),
          allow_raw_pointers())

      // 2D线段创建方法
      .class_function("make2dSegment",
                      select_overload<Handle(Geom2d_TrimmedCurve)(
                          const gp_Pnt2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_segment),
                      allow_raw_pointers())
      .class_function(
          "make2dSegmentWithDirection",
          select_overload<Handle(Geom2d_TrimmedCurve)(
              const gp_Pnt2d &, const gp_Dir2d &, const gp_Pnt2d &)>(
              &geometry_creator::make_segment),
          allow_raw_pointers())
      .class_function("make2dSegmentWithLineParams",
                      select_overload<Handle(Geom2d_TrimmedCurve)(
                          const gp_Lin2d &, Standard_Real, Standard_Real)>(
                          &geometry_creator::make_segment),
                      allow_raw_pointers())

      // 2D变换创建方法
      .class_function(
          "make2dMirror",
          select_overload<Handle(Geom2d_Transformation)(const gp_Pnt2d &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function(
          "make2dMirrorWithAxis",
          select_overload<Handle(Geom2d_Transformation)(const gp_Ax2d &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function(
          "make2dMirrorWithLine",
          select_overload<Handle(Geom2d_Transformation)(const gp_Lin2d &)>(
              &geometry_creator::make_mirror),
          allow_raw_pointers())
      .class_function("make2dMirrorWithPointDir",
                      select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &, const gp_Dir2d &)>(
                          &geometry_creator::make_mirror),
                      allow_raw_pointers())

      // 2D旋转创建方法
      .class_function("make2dRotation",
                      select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &, Standard_Real)>(
                          &geometry_creator::make_rotation),
                      allow_raw_pointers())

      // 2D缩放创建方法
      .class_function(
          "make2dScale",
          select_overload<Handle(Geom2d_Transformation)(
              const gp_Pnt2d &, Standard_Real)>(&geometry_creator::make_scale),
          allow_raw_pointers())

      // 2D平移创建方法
      .class_function(
          "make2dTranslation",
          select_overload<Handle(Geom2d_Transformation)(const gp_Vec2d &)>(
              &geometry_creator::make_translation),
          allow_raw_pointers())
      .class_function("make2dTranslationWithPoints",
                      select_overload<Handle(Geom2d_Transformation)(
                          const gp_Pnt2d &, const gp_Pnt2d &)>(
                          &geometry_creator::make_translation),
                      allow_raw_pointers());
}