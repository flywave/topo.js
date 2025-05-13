declare module 'geometry' {

    class GeometryCreator {
        // 圆弧创建方法
        static makeArcOfCircle(
            circ: gp_Circ,
            alpha1: number,
            alpha2: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfCircleWithPoint(
            circ: gp_Circ,
            p: gp_Pnt,
            alpha: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfCircleWithTwoPoints(
            circ: gp_Circ,
            p1: gp_Pnt,
            p2: gp_Pnt,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfCircleWithThreePoints(
            p1: gp_Pnt,
            p2: gp_Pnt,
            p3: gp_Pnt
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfCircleWithVector(
            circ: gp_Circ,
            v: gp_Vec
        ): Handle_Geom_TrimmedCurve;

        // 椭圆弧创建方法
        static makeArcOfEllipse(
            elips: gp_Elips,
            alpha1: number,
            alpha2: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfEllipseWithPoint(
            elips: gp_Elips,
            p: gp_Pnt,
            alpha: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfEllipseWithTwoPoints(
            elips: gp_Elips,
            p1: gp_Pnt,
            p2: gp_Pnt,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        // 双曲线弧创建方法
        static makeArcOfHyperbola(
            hypr: gp_Hypr,
            alpha1: number,
            alpha2: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfHyperbolaWithPoint(
            hypr: gp_Hypr,
            p: gp_Pnt,
            alpha: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfHyperbolaWithTwoPoints(
            hypr: gp_Hypr,
            p1: gp_Pnt,
            p2: gp_Pnt,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        // 抛物线弧创建方法
        static makeArcOfParabola(
            parab: gp_Parab,
            alpha1: number,
            alpha2: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfParabolaWithPoint(
            parab: gp_Parab,
            p: gp_Pnt,
            alpha: number,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        static makeArcOfParabolaWithTwoPoints(
            parab: gp_Parab,
            p1: gp_Pnt,
            p2: gp_Pnt,
            sense: boolean
        ): Handle_Geom_TrimmedCurve;

        // 圆创建方法
        static makeCircle(circ: gp_Circ): Handle_Geom_Circle;
        static makeCircleWithAxis(axis: gp_Ax2, radius: number): Handle_Geom_Circle;
        static makeCircleWithDistance(circ: gp_Circ, dist: number): Handle_Geom_Circle;
        static makeCircleWithPoint(circ: gp_Circ, p: gp_Pnt): Handle_Geom_Circle;
        static makeCircleWithThreePoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt): Handle_Geom_Circle;
        static makeCircleWithCenterNormal(center: gp_Pnt, normal: gp_Dir, radius: number): Handle_Geom_Circle;
        static makeCircleWithCenterAxisPoint(center: gp_Pnt, axisPoint: gp_Pnt, radius: number): Handle_Geom_Circle;
        static makeCircleWithAxis1(axis: gp_Ax1, radius: number): Handle_Geom_Circle;

        // 椭圆创建方法
        static makeEllipse(elips: gp_Elips): Handle_Geom_Ellipse;
        static makeEllipseWithAxis(axis: gp_Ax2, majorRadius: number, minorRadius: number): Handle_Geom_Ellipse;
        static makeEllipseWithThreePoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt): Handle_Geom_Ellipse;

        // 双曲线创建方法
        static makeHyperbola(hypr: gp_Hypr): Handle_Geom_Hyperbola;
        static makeHyperbolaWithAxis(axis: gp_Ax2, majorRadius: number, minorRadius: number): Handle_Geom_Hyperbola;
        static makeHyperbolaWithThreePoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt): Handle_Geom_Hyperbola;

        // 圆锥曲面创建方法
        static makeConicalSurface(axis: gp_Ax2, radius1: number, radius2: number): Handle_Geom_ConicalSurface;
        static makeConicalSurfaceWithCone(cone: gp_Cone): Handle_Geom_ConicalSurface;
        static makeConicalSurfaceWithFourPoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt, p4: gp_Pnt): Handle_Geom_ConicalSurface;
        static makeConicalSurfaceWithTwoPointsTwoRadii(p1: gp_Pnt, p2: gp_Pnt, radius1: number, radius2: number): Handle_Geom_ConicalSurface;

        // 圆柱曲面创建方法
        static makeCylindricalSurface(axis: gp_Ax2, radius: number): Handle_Geom_CylindricalSurface;
        static makeCylindricalSurfaceWithCylinder(cylinder: gp_Cylinder): Handle_Geom_CylindricalSurface;
        static makeCylindricalSurfaceWithPoint(cylinder: gp_Cylinder, p: gp_Pnt): Handle_Geom_CylindricalSurface;
        static makeCylindricalSurfaceWithDistance(cylinder: gp_Cylinder, dist: number): Handle_Geom_CylindricalSurface;
        static makeCylindricalSurfaceWithThreePoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt): Handle_Geom_CylindricalSurface;
        static makeCylindricalSurfaceWithAxis1(axis: gp_Ax1, radius: number): Handle_Geom_CylindricalSurface;
        static makeCylindricalSurfaceWithCirc(circ: gp_Circ): Handle_Geom_CylindricalSurface;

        // 直线创建方法
        static makeLine(axis: gp_Ax1): Handle_Geom_Line;
        static makeLineWithLin(lin: gp_Lin): Handle_Geom_Line;
        static makeLineWithPointDir(p: gp_Pnt, dir: gp_Dir): Handle_Geom_Line;
        static makeLineWithLinPoint(lin: gp_Lin, p: gp_Pnt): Handle_Geom_Line;
        static makeLineWithTwoPoints(p1: gp_Pnt, p2: gp_Pnt): Handle_Geom_Line;

        // 镜像变换创建方法
        static makeMirrorWithPoint(point: gp_Pnt): Handle_Geom_Transformation;
        static makeMirrorWithAxis1(axis: gp_Ax1): Handle_Geom_Transformation;
        static makeMirrorWithLin(line: gp_Lin): Handle_Geom_Transformation;
        static makeMirrorWithPointDir(point: gp_Pnt, dir: gp_Dir): Handle_Geom_Transformation;
        static makeMirrorWithPln(plane: gp_Pln): Handle_Geom_Transformation;
        static makeMirrorWithAxis2(plane: gp_Ax2): Handle_Geom_Transformation;

        // 旋转变换创建方法
        static makeRotationWithLin(line: gp_Lin, angle: number): Handle_Geom_Transformation;
        static makeRotationWithAxis1(axis: gp_Ax1, angle: number): Handle_Geom_Transformation;
        static makeRotationWithPointDir(point: gp_Pnt, dir: gp_Dir, angle: number): Handle_Geom_Transformation;

        // 平移变换创建方法
        static makeTranslationWithVec(vect: gp_Vec): Handle_Geom_Transformation;
        static makeTranslationWithTwoPoints(point1: gp_Pnt, point2: gp_Pnt): Handle_Geom_Transformation;

        // 缩放变换创建方法
        static makeScale(point: gp_Pnt, scale: number): Handle_Geom_Transformation;

        // 平面创建方法
        static makePlane(pln: gp_Pln): Handle_Geom_Plane;
        static makePlaneWithPointDir(p: gp_Pnt, v: gp_Dir): Handle_Geom_Plane;
        static makePlaneWithCoefficients(a: number, b: number, c: number, d: number): Handle_Geom_Plane;
        static makePlaneWithPlnPoint(pln: gp_Pln, point: gp_Pnt): Handle_Geom_Plane;
        static makePlaneWithPlnDistance(pln: gp_Pln, dist: number): Handle_Geom_Plane;
        static makePlaneWithThreePoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt): Handle_Geom_Plane;
        static makePlaneWithAxis1(axis: gp_Ax1): Handle_Geom_Plane;

        // 线段创建方法
        static makeSegmentWithTwoPoints(p1: gp_Pnt, p2: gp_Pnt): Handle_Geom_TrimmedCurve;
        static makeSegmentWithLinParams(line: gp_Lin, u1: number, u2: number): Handle_Geom_TrimmedCurve;
        static makeSegmentWithLinPointParam(line: gp_Lin, point: gp_Pnt, ulast: number): Handle_Geom_TrimmedCurve;
        static makeSegmentWithLinTwoPoints(line: gp_Lin, p1: gp_Pnt, p2: gp_Pnt): Handle_Geom_TrimmedCurve;

        // 修剪圆锥曲面创建方法
        static makeTrimmedConeWithFourPoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt, p4: gp_Pnt): Handle_Geom_RectangularTrimmedSurface;
        static makeTrimmedConeWithTwoPointsTwoRadii(p1: gp_Pnt, p2: gp_Pnt, r1: number, r2: number): Handle_Geom_RectangularTrimmedSurface;

        // 抛物线创建方法
        static makeParabola(prb: gp_Parab): Handle_Geom_Parabola;
        static makeParabolaWithAxis(axis: gp_Ax22d, focal: number): Handle_Geom_Parabola;
        static makeParabolaWithMirrorAxis(mirrorAxis: gp_Ax2d, focal: number, sense: boolean): Handle_Geom_Parabola;
        static makeParabolaWithDirectrix(d: gp_Ax2d, f: gp_Pnt2d, sense?: boolean): Handle_Geom_Parabola;
        static makeParabolaWithTwoPoints(s1: gp_Pnt2d, o: gp_Pnt2d): Handle_Geom_Parabola;

        // 球面创建方法
        static makeSphericalSurface(ax2: gp_Ax2, radius: number): Handle_Geom_SphericalSurface;
        static makeSphericalSurfaceWithSphere(sphere: gp_Sphere): Handle_Geom_SphericalSurface;
        static makeSphericalSurfaceWithThreePoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt): Handle_Geom_SphericalSurface;
        static makeSphericalSurfaceWithFourPoints(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt, p4: gp_Pnt): Handle_Geom_SphericalSurface;

        // 圆环面创建方法
        static makeToroidalSurface(ax2: gp_Ax2, majorRadius: number, minorRadius: number): Handle_Geom_ToroidalSurface;
        static makeToroidalSurfaceWithTorus(torus: gp_Torus): Handle_Geom_ToroidalSurface;

        // 曲线近似转换方法
        static convertApproxCurve(
            curve: Handle_Geom_Curve,
            tol3d: number,
            order: GeomAbs_Shape,
            maxSegments: number,
            maxDegree: number
        ): Handle_Geom_BSplineCurve;

        // 曲面近似转换方法
        static convertApproxSurface(
            surf: Handle_Geom_Surface,
            tol3d: number,
            uContinuity: GeomAbs_Shape,
            vContinuity: GeomAbs_Shape,
            maxDegU: number,
            maxDegV: number,
            maxSegments: number,
            precisCode: number
        ): Handle_Geom_BSplineSurface;

        // 2D圆弧创建方法
        static make2dArcOfCircle(
            circ: gp_Circ2d,
            alpha1: number,
            alpha2: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfCircleWithPoint(
            circ: gp_Circ2d,
            p: gp_Pnt2d,
            alpha: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfCircleWithTwoPoints(
            circ: gp_Circ2d,
            p1: gp_Pnt2d,
            p2: gp_Pnt2d,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfCircleWithThreePoints(
            p1: gp_Pnt2d,
            p2: gp_Pnt2d,
            p3: gp_Pnt2d
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfCircleWithVector(
            p1: gp_Pnt2d,
            v: gp_Vec2d,
            p2: gp_Pnt2d
        ): Handle_Geom2d_TrimmedCurve;

        // 2D椭圆弧创建方法
        static make2dArcOfEllipse(
            elips: gp_Elips2d,
            alpha1: number,
            alpha2: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfEllipseWithPoint(
            elips: gp_Elips2d,
            p: gp_Pnt2d,
            alpha: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfEllipseWithTwoPoints(
            elips: gp_Elips2d,
            p1: gp_Pnt2d,
            p2: gp_Pnt2d,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        // 2D双曲线弧创建方法
        static make2dArcOfHyperbola(
            hypr: gp_Hypr2d,
            alpha1: number,
            alpha2: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfHyperbolaWithPoint(
            hypr: gp_Hypr2d,
            p: gp_Pnt2d,
            alpha: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfHyperbolaWithTwoPoints(
            hypr: gp_Hypr2d,
            p1: gp_Pnt2d,
            p2: gp_Pnt2d,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        // 2D抛物线弧创建方法
        static make2dArcOfParabola(
            parab: gp_Parab2d,
            alpha1: number,
            alpha2: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfParabolaWithPoint(
            parab: gp_Parab2d,
            p: gp_Pnt2d,
            alpha: number,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        static make2dArcOfParabolaWithTwoPoints(
            parab: gp_Parab2d,
            p1: gp_Pnt2d,
            p2: gp_Pnt2d,
            sense?: boolean
        ): Handle_Geom2d_TrimmedCurve;

        // 2D圆创建方法
        static make2dCircle(circ: gp_Circ2d): Handle_Geom2d_Circle;
        static make2dCircleWithAxis(axis: gp_Ax2d, radius: number, sense?: boolean): Handle_Geom2d_Circle;
        static make2dCircleWithAxis2d(axis: gp_Ax22d, radius: number): Handle_Geom2d_Circle;
        static make2dCircleWithDistance(circ: gp_Circ2d, dist: number): Handle_Geom2d_Circle;
        static make2dCircleWithPoint(circ: gp_Circ2d, p: gp_Pnt2d): Handle_Geom2d_Circle;
        static make2dCircleWithThreePoints(p1: gp_Pnt2d, p2: gp_Pnt2d, p3: gp_Pnt2d): Handle_Geom2d_Circle;
        static make2dCircleWithCenterRadius(center: gp_Pnt2d, radius: number, sense?: boolean): Handle_Geom2d_Circle;
        static make2dCircleWithCenterPoint(center: gp_Pnt2d, point: gp_Pnt2d, sense?: boolean): Handle_Geom2d_Circle;

        // 2D椭圆创建方法
        static make2dEllipse(elips: gp_Elips2d): Handle_Geom2d_Ellipse;
        static make2dEllipseWithMajorAxis(
            majorAxis: gp_Ax2d,
            majorRadius: number,
            minorRadius: number,
            sense?: boolean
        ): Handle_Geom2d_Ellipse;
        static make2dEllipseWithAxis2d(
            axis: gp_Ax22d,
            majorRadius: number,
            minorRadius: number
        ): Handle_Geom2d_Ellipse;
        static make2dEllipseWithThreePoints(
            s1: gp_Pnt2d,
            s2: gp_Pnt2d,
            center: gp_Pnt2d
        ): Handle_Geom2d_Ellipse;

        // 2D双曲线创建方法
        static make2dHyperbola(hypr: gp_Hypr2d): Handle_Geom2d_Hyperbola;
        static make2dHyperbolaWithMajorAxis(
            majorAxis: gp_Ax2d,
            majorRadius: number,
            minorRadius: number,
            sense: boolean
        ): Handle_Geom2d_Hyperbola;
        static make2dHyperbolaWithAxis2d(
            axis: gp_Ax22d,
            majorRadius: number,
            minorRadius: number
        ): Handle_Geom2d_Hyperbola;
        static make2dHyperbolaWithThreePoints(
            s1: gp_Pnt2d,
            s2: gp_Pnt2d,
            center: gp_Pnt2d
        ): Handle_Geom2d_Hyperbola;

        // 2D直线创建方法
        static make2dLine(axis: gp_Ax2d): Handle_Geom2d_Line;
        static make2dLineWithLin(lin: gp_Lin2d): Handle_Geom2d_Line;
        static make2dLineWithPointDir(p: gp_Pnt2d, dir: gp_Dir2d): Handle_Geom2d_Line;
        static make2dLineWithLinPoint(lin: gp_Lin2d, p: gp_Pnt2d): Handle_Geom2d_Line;
        static make2dLineWithDistance(lin: gp_Lin2d, dist: number): Handle_Geom2d_Line;
        static make2dLineWithTwoPoints(p1: gp_Pnt2d, p2: gp_Pnt2d): Handle_Geom2d_Line;

        // 2D抛物线创建方法
        static make2dParabola(prb: gp_Parab2d): Handle_Geom2d_Parabola;
        static make2dParabolaWithAxis2d(axis: gp_Ax22d, focal: number): Handle_Geom2d_Parabola;
        static make2dParabolaWithMirrorAxis(
            mirrorAxis: gp_Ax2d,
            focal: number,
            sense: boolean
        ): Handle_Geom2d_Parabola;
        static make2dParabolaWithDirectrix(
            d: gp_Ax2d,
            f: gp_Pnt2d,
            sense?: boolean
        ): Handle_Geom2d_Parabola;
        static make2dParabolaWithTwoPoints(s1: gp_Pnt2d, o: gp_Pnt2d): Handle_Geom2d_Parabola;

        // 2D线段创建方法
        static make2dSegment(p1: gp_Pnt2d, p2: gp_Pnt2d): Handle_Geom2d_TrimmedCurve;
        static make2dSegmentWithDirection(
            p1: gp_Pnt2d,
            dir: gp_Dir2d,
            p2: gp_Pnt2d
        ): Handle_Geom2d_TrimmedCurve;
        static make2dSegmentWithLineParams(
            line: gp_Lin2d,
            u1: number,
            u2: number
        ): Handle_Geom2d_TrimmedCurve;
        static make2dSegmentWithLinePointParam(
            line: gp_Lin2d,
            point: gp_Pnt2d,
            ulast: number
        ): Handle_Geom2d_TrimmedCurve;
        static make2dSegmentWithLineTwoPoints(
            line: gp_Lin2d,
            p1: gp_Pnt2d,
            p2: gp_Pnt2d
        ): Handle_Geom2d_TrimmedCurve;

        // 2D变换创建方法
        static make2dMirror(point: gp_Pnt2d): Handle_Geom2d_Transformation;
        static make2dMirrorWithAxis(axis: gp_Ax2d): Handle_Geom2d_Transformation;
        static make2dMirrorWithLine(line: gp_Lin2d): Handle_Geom2d_Transformation;
        static make2dMirrorWithPointDir(
            point: gp_Pnt2d,
            dir: gp_Dir2d
        ): Handle_Geom2d_Transformation;
        static make2dRotation(point: gp_Pnt2d, angle: number): Handle_Geom2d_Transformation;
        static make2dScale(point: gp_Pnt2d, scale: number): Handle_Geom2d_Transformation;
        static make2dTranslation(vec: gp_Vec2d): Handle_Geom2d_Transformation;
        static make2dTranslationWithPoints(
            point1: gp_Pnt2d,
            point2: gp_Pnt2d
        ): Handle_Geom2d_Transformation;
    }
}