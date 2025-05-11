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
    }
}