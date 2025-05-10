declare module 'topo' {

    class BBox {
        constructor();
        constructor(box: Bnd_Box);
        constructor(xMin: number, yMin: number, zMin: number,
            xMax: number, yMax: number, zMax: number);

        // 边界值访问
        xMin(): number;
        xMax(): number;
        xLength(): number;
        yMin(): number;
        yMax(): number;
        yLength(): number;
        zMin(): number;
        zMax(): number;
        zLength(): number;

        // 几何属性
        min(): Vector;
        max(): Vector;
        center(): Vector;
        diagonalLength(): number;

        // 操作方法
        add(point: Vector, tolerance?: number): BBox;
        add(other: BBox, tolerance?: number): BBox;
        isInside(point: Vector): boolean;
        enlarge(tolerance: number): void;

        // 静态方法
        static findOutsideBox2d(boxes: BBox[]): BBox;
        static fromShape(shape: Shape): BBox;

        // 底层访问
        getValue(): Bnd_Box;
    }


    class Location {
        constructor();
        constructor(trsf: gp_Trsf);
        constructor(loc: TopLoc_Location);

        // 静态构造方法
        static fromPnt(pnt: Point): Location;
        static fromVec(vec: Vector): Location;
        static fromVecRotation(vec: Vector, rx: number, ry: number, rz: number): Location;
        static fromPln(pln: Plane): Location;
        static fromPlnPos(pln: Plane, pos: Point): Location;
        static fromVecAxisAngle(vec: Vector, axis: Vector, angle: number): Location;
        static fromTopoVector(vec: Vector): Location;

        // 操作方法
        hashCode(): number;
        inverted(): Location;
        dividedBy(other: Location): Location;
        multipliedBy(other: Location): Location;
        pow(exp: number): Location;
        toVector(): Vector;
        toTuple(): [number, number, number, number, number, number];

        // 转换方法
        toTopLocLocation(): TopLoc_Location;
        toTrsf(): gp_Trsf;

        // 比较操作
        equals(other: Location): boolean;
        notEquals(other: Location): boolean;
    }


    class Matrix {
        constructor();
        constructor(gtrsf: gp_GTrsf);
        constructor(trsf: gp_Trsf);
        constructor(data: number[][]);

        // 变换方法
        rotateX(angle: number): Matrix;
        rotateY(angle: number): Matrix;
        rotateZ(angle: number): Matrix;
        inverse(): Matrix;
        multiply(other: Matrix): Matrix;

        // 数据访问
        get(row: number, col: number): number;
        transposedList(): number[][];
        toString(): string;

        // 转换方法
        getValue(): gp_GTrsf;
        getMutableValue(): gp_GTrsf;
        toGTrsf(): gp_GTrsf;
    }

    // 全局操作符
    function multiplyMatrixVector(mat: Matrix, vec: Vector): Vector;

    class Plane {
        constructor();
        constructor(pln: gp_Pln);
        constructor(origin: Vector, xDir: Vector, yDir: Vector);

        // 静态工厂方法
        static named(name: string): Plane;
        static xy(): Plane;
        static yz(): Plane;
        static zx(): Plane;
        static xz(): Plane;
        static yx(): Plane;
        static zy(): Plane;
        static front(): Plane;
        static back(): Plane;
        static left(): Plane;
        static right(): Plane;
        static top(): Plane;
        static bottom(): Plane;

        // 属性访问
        origin(): Vector;
        xDir(): Vector;
        yDir(): Vector;
        zDir(): Vector;

        // 坐标转换方法
        toWorldCoords(localVec: Vector): Vector;
        toLocalCoords(worldVec: Vector): Vector;
        location(): Location;

        // 设置方法
        setOrigin(origin: Vector): void;
        setOrigin2d(x: number, y: number): void;

        // 变换方法
        rotated(angle: number, axis: Vector): Plane;
        mirrorInPlane(): Plane;

        // 转换方法
        toPln(): gp_Pln;
    }

    class Vector {
        constructor();
        constructor(x: number, y: number, z: number);
        constructor(arr: [number, number, number]);

        // 属性
        x: number;
        y: number;
        z: number;

        // 向量运算
        length(): number;
        magnitude(): number;
        angle(other: Vector): number;
        cross(other: Vector): Vector;
        dot(other: Vector): number;
        add(other: Vector): Vector;
        sub(other: Vector): Vector;
        multiply(scalar: number): Vector;
        normalized(): Vector;

        // 几何运算
        getAngle(other: Vector): number;
        getSignedAngle(other: Vector, normal: Vector): number;
        projectToLine(lineVec: Vector): Vector;
        projectToPlane(planeNormal: Vector): Vector;
        transform(mat: Matrix): Vector;
        isEqual(other: Vector, tol?: number): boolean;

        // 转换方法
        toTuple(): [number, number, number];
        toPnt(): Point;
        toDir(): Direction;
        toVec(): Vector;
        toString(): string;
        toArray(): [number, number, number];

        // 运算符重载
        neg(): Vector;
        plus(other: Vector): Vector;
        minus(other: Vector): Vector;
        times(scalar: number): Vector;
        div(scalar: number): Vector;
        equals(other: Vector): boolean;
        notEquals(other: Vector): boolean;
    }

    // 全局运算符
    function multiplyScalarVector(scalar: number, vec: Vector): Vector;


    class MeshReceiver {
        constructor(callback: any); // val 类型对应 Emscripten 的 JS 回调

        // 网格操作
        begin(): void;
        end(): void;

        // 节点添加方法
        appendNode(index: number, point: Point): void;
        appendNodeWithNormal(index: number, point: Point, normal: Point): void;
        appendNodeWithNormalAndUV(index: number, point: Point, normal: Point, uv: [number, number]): void;

        // 面片添加方法
        appendFace(vertexIndices: number[]): void;
        appendTriangle(v1: number, v2: number, v3: number): void;
    }

    class GeometryObject {
        // 基础属性检查
        isNull(): boolean;
        isValid(): boolean;
        type(): string;

        // 几何属性
        boundingBox(): BBox;

        // 比较方法
        equals(other: GeometryObject): boolean;

        // 序列化方法
        toBrep(): string;

        // 标签管理
        getTag(): number;
        setTag(tag: number): void;
    }


    enum TextureMappingRule {
        CUBE = 'CUBE',
        NORMAL = 'NORMAL',
        NORMAL_AUTO_SCALE = 'NORMAL_AUTO_SCALE'
    }


    class Shape extends GeometryObject {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);

        // 静态方法
        static makeShape(): Shape;
        static importFromBrep(brep: string): Shape;
        static combinedCenter(shapes: Shape[]): Vector;
        static combinedCenterOfBoundingBox(shapes: Shape[]): Vector;

        // 基础方法
        isNull(): boolean;
        isValid(): boolean;
        isSolid(): boolean;
        type(): string;
        bbox(): BBox;
        hashCode(): number;
        equals(other: Shape): boolean;
        isSame(other: Shape): boolean;
        forConstruction(): boolean;

        // 属性设置
        setSurfaceColour(color: Color): void;
        setCurveColour(color: Color): void;
        setLabel(label: string): void;
        setUOrigin(origin: number): void;
        setVOrigin(origin: number): void;
        setURepeat(repeat: number): void;
        setVRepeat(repeat: number): void;
        setScaleV(scale: number): void;
        setScaleU(scale: number): void;
        setAutoScaleSizeOnU(enable: boolean): void;
        setAutoScaleSizeOnV(enable: boolean): void;
        setTextureMapType(type: TextureMappingRule): void;
        setRotationAngle(angle: number): void;

        // 属性获取
        surfaceColour(): Color;
        curveColour(): Color;
        label(): string;
        getUOrigin(): number;
        getVOrigin(): number;
        getURepeat(): number;
        getVRepeat(): number;
        getScaleV(): number;
        getScaleU(): number;
        getAutoScaleSizeOnU(): boolean;
        getAutoScaleSizeOnV(): boolean;
        getTextureMapType(): TextureMappingRule;
        getRotationAngle(): number;

        // 变换操作
        transform(trsf: gp_Trsf): number;
        transform(matrix: Matrix): number;
        translate(vec: Vector): number;
        rotate(angle: number, p1: Point, p2: Point): number;
        rotate(angle: number, axis: Axis): number;
        rotate(quat: Quaternion): number;
        scale(factor: number): number;
        mirror(p1: Point, p2: Point): number;
        mirror(p: Point, dir: Vector): number;
        mirror(axis: Axis): number;
        mirror(ax2: Ax2): number;

        // 几何计算
        centreOfMass(): Vector;
        centerOfBoundBox(): Vector;
        computeMass(): number;
        computeArea(): number;
        distance(other: Shape): number;
        distances(other: Shape): number[];

        // 非破坏性变换方法
        transformed(trsf: gp_Trsf): Shape;
        transformed(matrix: Matrix): Shape;
        translated(vec: Vector): Shape;
        rotated(angle: number, p1: Point, p2: Point): Shape;
        rotated(angle: number, axis: Axis): Shape;
        rotated(quat: Quaternion): Shape;
        scaled(factor: number): Shape;
        mirrored(p1: Point, p2: Point): Shape;
        mirrored(p: Point, dir: Vector): Shape;
        mirrored(axis: Axis): Shape;
        mirrored(ax2: Ax2): Shape;

        // 位置和方向操作
        location(): Location;
        setLocation(loc: Location): void;
        located(loc: Location): Shape;
        move(loc: Location): number;
        move(x: number, y: number, z: number, rx: number, ry: number, rz: number): number;
        move(vec: Vector): number;
        moved(loc: Location): Shape;
        moved(x: number, y: number, z: number, rx: number, ry: number, rz: number): Shape;
        moved(vec: Vector): Shape;

        // 方向操作
        getOrientation(): Quaternion;
        setOrientation(quat: Quaternion): void;
        oriented(quat: Quaternion): Shape;

        // 子元素访问
        children(): Shape[];
        getShapes(): Shape[];
        vertices(): Vertex[];
        edges(): Edge[];
        wires(): Wire[];
        faces(): Face[];
        shells(): Shell[];
        solids(): Solid[];
        compounds(): Compound[];
        compSolids(): CompSolid[];

        // 数量统计
        numVertices(): number;
        numEdges(): number;
        numWires(): number;
        numFaces(): number;
        numShells(): number;
        numSolids(): number;
        numCompounds(): number;
        numCompSolids(): number;

        // 导出导入
        exportStep(filename: string): boolean;
        exportBrep(filename: string): boolean;
        static importFromBrep(filename: string): Shape;

        // 实用方法
        clean(): void;
        fixShape(): void;
        toSplines(): Shape;
        toNurbs(): Shape;
        toString(): string;

        // 操作符重载
        equals(other: Shape): boolean;
        notEquals(other: Shape): boolean;
        lessThan(other: Shape): boolean;

        // 网格生成
        writeTriangulation(filename: string): boolean;
        mesh(): Mesh;

        // 选择器相关
        filter(selector: Selector): Shape[];
        vertices(selector: Selector): Shape;
        edges(selector: Selector): Shape;
        wires(selector: Selector): Shape;
        faces(selector: Selector): Shape;
        shells(selector: Selector): Shape;
        solids(selector: Selector): Shape;

        // 类型转换
        cast<T extends Shape>(): T | null;
        autoCast(): Shape;

        // 其他方法
        copy(): Shape;
        shapeType(): string;
        geomType(): string;
    }


    class Vertex extends Shape {
        constructor();
        constructor(x: number, y: number, z: number);
        constructor(pnt: Point);

        // 静态工厂方法
        static makeVertex(pnt: Point): Vertex;
        static makeVertex(vec: Vector): Vertex;

        // 方法
        value(): TopoDS_Vertex;
        toPnt(): Point;
        point(): Point;
        type(): string;
        copy(): Vertex;
    }

    class VertexIterator {
        constructor(shape: Shape);
        reset(): void;
        next(): Vertex | null;
    }

    enum ParamMode {
        LENGTH = 'LENGTH',
        PARAM = 'PARAM'
    }

    enum FrameMode {
        FRENET = 'FRENET',
        CORRECTED_FRENET = 'CORRECTED_FRENET'
    }


    class Shape1D extends Shape {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);

        // 几何属性方法
        getCurve(): Curve;
        bounds(): [number, number];
        length(): number;
        isClosed(): boolean;

        // 端点访问
        startPoint(): Point;
        endPoint(): Point;

        // 参数化方法
        paramAt(param: number): number;
        paramAt(point: Point): number;
        params(): number[];
        paramsLength(): number[];

        // 几何特征
        tangentAt(param: number): Vector;
        tangents(): Vector[];
        normal(): Vector;
        center(): Point;
        radius(): number;

        // 位置和采样
        positionAt(param: number): Point;
        positions(): Point[];
        sampleUniform(numPoints: number): Point[];

        // 定位和投影
        locationAt(param: number): Location;
        locations(): Location[];
        projected(point: Point): Point;

        // 曲率分析
        curvatureAt(param: number): number;
        curvatures(): number[];
    }


    class Edge extends Shape1D {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);

        // 静态创建方法 - 基本类型
        static makeEdge(v1: Vertex, v2: Vertex): Edge;
        static makeEdge(p1: Point, p2: Point): Edge;

        // 静态创建方法 - 直线
        static makeEdge(line: Line): Edge;
        static makeEdge(line: Line, u1: number, u2: number): Edge;
        static makeEdge(line: Line, p1: Point, p2: Point): Edge;
        static makeEdge(line: Line, v1: Vertex, v2: Vertex): Edge;

        // 静态创建方法 - 圆
        static makeEdge(circle: Circle): Edge;
        static makeEdge(circle: Circle, u1: number, u2: number): Edge;
        static makeEdge(circle: Circle, p1: Point, p2: Point): Edge;
        static makeEdge(circle: Circle, v1: Vertex, v2: Vertex): Edge;

        // 静态创建方法 - 椭圆
        static makeEdge(ellipse: Ellipse): Edge;
        static makeEdge(ellipse: Ellipse, u1: number, u2: number): Edge;
        static makeEdge(ellipse: Ellipse, p1: Point, p2: Point): Edge;
        static makeEdge(ellipse: Ellipse, v1: Vertex, v2: Vertex): Edge;

        // 值访问
        value(): TopoDS_Edge;

        // 基本属性
        isSeam(): boolean;
        isDegenerated(): boolean;
        isClosed(): boolean;
        isInfinite(): boolean;
        length(): number;
        tolerance(): number;
        isCurve3d(): boolean;
        convertToCurve3d(): void;
        reverse(): Edge;

        // 2D曲线创建方法
        static makeEdge2d(v1: Vertex, v2: Vertex): Edge;
        static makeEdge2d(p1: Point2d, p2: Point2d): Edge;
        static makeEdge2d(line: Line2d): Edge;
        static makeEdge2d(line: Line2d, u1: number, u2: number): Edge;
        static makeEdge2d(line: Line2d, p1: Point2d, p2: Point2d): Edge;
        static makeEdge2d(line: Line2d, v1: Vertex, v2: Vertex): Edge;
        static makeEdge2d(circle: Circle2d): Edge;
        static makeEdge2d(circle: Circle2d, u1: number, u2: number): Edge;
        static makeEdge2d(circle: Circle2d, p1: Point2d, p2: Point2d): Edge;
        static makeEdge2d(circle: Circle2d, v1: Vertex, v2: Vertex): Edge;
        static makeEdge2d(ellipse: Ellipse2d): Edge;
        static makeEdge2d(ellipse: Ellipse2d, u1: number, u2: number): Edge;
        static makeEdge2d(ellipse: Ellipse2d, p1: Point2d, p2: Point2d): Edge;
        static makeEdge2d(ellipse: Ellipse2d, v1: Vertex, v2: Vertex): Edge;
        // 双曲线和抛物线2D创建方法
        static makeEdge2d(hyperbola: Hyperbola2d): Edge;
        static makeEdge2d(hyperbola: Hyperbola2d, u1: number, u2: number): Edge;
        static makeEdge2d(hyperbola: Hyperbola2d, p1: Point2d, p2: Point2d): Edge;
        static makeEdge2d(hyperbola: Hyperbola2d, v1: Vertex, v2: Vertex): Edge;
        static makeEdge2d(parabola: Parabola2d): Edge;
        static makeEdge2d(parabola: Parabola2d, u1: number, u2: number): Edge;
        static makeEdge2d(parabola: Parabola2d, p1: Point2d, p2: Point2d): Edge;
        static makeEdge2d(parabola: Parabola2d, v1: Vertex, v2: Vertex): Edge;

        // 多边形创建方法
        static makePolygon(): Edge;
        static makePolygon(p1: Point, p2: Point): Edge;
        static makePolygon(p1: Point, p2: Point, p3: Point, close?: boolean): Edge;
        static makePolygon(p1: Point, p2: Point, p3: Point, p4: Point, close?: boolean): Edge;
        static makePolygon(v1: Vertex, v2: Vertex): Edge;
        static makePolygon(v1: Vertex, v2: Vertex, v3: Vertex, close?: boolean): Edge;
        static makePolygon(v1: Vertex, v2: Vertex, v3: Vertex, v4: Vertex, close?: boolean): Edge;
        static makePolygon(vertices: Vertex[], close?: boolean): Edge;
        static makePolygon(points: Point[], close?: boolean): Edge;

        // 样条曲线创建方法
        static makeSpline(points: Point[], tolerance?: number, periodic?: boolean): Edge;
        static makeSpline(points: Point[], tangents?: [Vector, Vector], parameters?: number[], tolerance?: number, periodic?: boolean): Edge;
        static makeSpline(points: Point[], tangents?: Vector[], periodic?: boolean, parameters?: number[], tolerance?: number): Edge;
        static makeSplineApprox(points: Point[], tolerance?: number): Edge;

        // 几何操作
        close(): Edge;
        arcCenter(): Point;
        trim(u1: number, u2: number): Edge;

        // 类型方法
        getGeom(): Geometry;
        type(): string;
        copy(): Edge;
    }

    class EdgeIterator {
        constructor(shape: Shape);
        reset(): void;
        next(): Edge | null;
    }

    enum WireCurveType {
        LINE = 'LINE',
        THREE_POINT_ARC = 'THREE_POINT_ARC',
        CIRCLE_CENTER_ARC = 'CIRCLE_CENTER_ARC',
        SPLINE = 'SPLINE'
    }

    class Wire extends Shape1D {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);

        // 多边形创建方法
        static makePolygon(): Wire;
        static makePolygon(p1: Point, p2: Point): Wire;
        static makePolygon(p1: Point, p2: Point, p3: Point, close?: boolean): Wire;
        static makePolygon(p1: Point, p2: Point, p3: Point, p4: Point, close?: boolean): Wire;
        static makePolygon(v1: Vertex, v2: Vertex): Wire;
        static makePolygon(v1: Vertex, v2: Vertex, v3: Vertex, close?: boolean): Wire;
        static makePolygon(v1: Vertex, v2: Vertex, v3: Vertex, v4: Vertex, close?: boolean): Wire;
        static makePolygon(points: Point[], close?: boolean, ordered?: boolean): Wire;

        // 基础创建方法
        static makeWire(edge: Edge): Wire;
        static makeWire(e1: Edge, e2: Edge): Wire;
        static makeWire(e1: Edge, e2: Edge, e3: Edge): Wire;
        static makeWire(e1: Edge, e2: Edge, e3: Edge, e4: Edge): Wire;
        static makeWire(wire: Wire): Wire;
        static makeWire(wire: Wire, edge: Edge): Wire;
        static makeWire(edges: Edge[]): Wire;
        static makeWire(wires: Wire[]): Wire;

        // 几何形状创建方法
        static makeRect(width: number, height: number): Wire;
        static makeCircle(radius: number): Wire;
        static makeEllipse(majorRadius: number, minorRadius: number): Wire;
        static makeHelix(pitch: number, height: number): Wire;
        static combine(wires: Wire[]): Wire;
        static makeWire(points: Point[][], curveTypes: WireCurveType[]): Wire;

        // 几何操作方法
        stitch(tolerance?: number): Wire;
        numEdges(): number;
        vertices(): Vertex[];
        length(): number;
        convertToCurves3d(): void;
        project(plane: Plane): Wire;

        // 值访问方法
        value(): TopoDS_Wire;

        // 类型方法
        type(): string;
        copy(): Wire;
        close(): Wire;

        // 偏移和倒角操作
        offset(distance: number): Wire;
        fillet(radius: number): Wire;
        chamfer(distance: number): Wire;
        offset2d(distance: number): Wire;
        fillet2d(radius: number): Wire;
        chamfer2d(distance: number): Wire;

        // 几何操作方法
        getGeom(): Geometry;
    }

    class WireIterator {
        constructor(shape: Shape);
        reset(): void;
        next(): Wire | null;
    }


    class Face extends Shape {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);

        // 基础创建方法
        static makeFace(face: Face): Face;
        static makeFace(plane: Plane): Face;
        static makeFace(cylinder: Cylinder): Face;
        static makeFace(cone: Cone): Face;
        static makeFace(sphere: Sphere): Face;
        static makeFace(torus: Torus): Face;
        static makeFace(surface: Surface, tolerance?: number): Face;

        // 带参数范围的创建方法
        static makeFace(plane: Plane, uMin: number, uMax: number, vMin: number, vMax: number): Face;
        static makeFace(cylinder: Cylinder, uMin: number, uMax: number, vMin: number, vMax: number): Face;
        static makeFace(cone: Cone, uMin: number, uMax: number, vMin: number, vMax: number): Face;
        static makeFace(sphere: Sphere, uMin: number, uMax: number, vMin: number, vMax: number): Face;
        static makeFace(torus: Torus, uMin: number, uMax: number, vMin: number, vMax: number): Face;
        static makeFace(surface: Surface, uMin: number, uMax: number, vMin: number, vMax: number, tolerance?: number): Face;

        // 基于wire的创建方法
        static makeFace(wire: Wire, onlyPlane?: boolean): Face;
        static makeFace(plane: Plane, wire: Wire, onlyPlane?: boolean): Face;
        static makeFace(cylinder: Cylinder, wire: Wire, onlyPlane?: boolean): Face;
        static makeFace(cone: Cone, wire: Wire, onlyPlane?: boolean): Face;
        static makeFace(sphere: Sphere, wire: Wire, onlyPlane?: boolean): Face;
        static makeFace(torus: Torus, wire: Wire, onlyPlane?: boolean): Face;
        static makeFace(surface: Surface, wire: Wire, onlyPlane?: boolean): Face;
        static makeFace(face: Face, wire: Wire): Face;
        static makeFace(face: Face, wire: Wire, otherWires: Wire[]): Face;

        // 基于边和点的创建方法
        static makeFace(e1: Edge, e2: Edge): Face;
        static makeFace(w1: Wire, w2: Wire): Face;
        static makeFace(wires: Wire[]): Face;
        static makeFace(points: Point[]): Face;
        static makeFace(edges: Edge[], points: Point[]): Face;
        static makeFace(wire: Wire, otherWires: Wire[]): Face;
        static makeFromWires(wires: Wire[]): Face;

        // 特殊创建方法
        static makeFace(
            edgesOrWires: Array<Edge | Wire>,
            constraints: Array<Edge | Wire | Point>,
            continuity?: GeomAbs_Shape,
            degree?: number,
            segments?: number,
            precision?: number,
            approximation?: boolean,
            tol3d?: number,
            tol2d?: number,
            tolAngular?: number,
            tolCurvature?: number,
            maxDegree?: number,
            maxSegments?: number
        ): Face;

        static makePlane(): Face;
        static makeSplineApprox(points: Point[]): Face;

        // 几何属性方法
        area(): number;
        tolerance(): number;
        inertia(): [number, number, number];
        centreOfMass(): Point;
        center(): Point;
        toPlane(): Plane;

        // 参数化方法
        uvBounds(): [number, number, number, number];
        paramAt(u: number, v: number): Point;
        params(): [number[], number[]];
        positionAt(u: number, v: number): Point;
        positions(): Point[];

        // 法线计算和偏移操作
        normalAt(point?: Point): Vector;
        normalAt(u: number, v: number): [Vector, Point];
        normals(): Vector[];
        offset(distance: number): Face;

        // 几何变换方法
        extrude(direction: Vector): Solid;
        revolve(axis: Axis, angle?: number): Solid;
        sweep(path: Wire): Solid;
        loft(profiles: Wire[]): Solid;

        // 布尔运算和2D操作
        boolean(other: Face, op: BooleanOperationType): Face;
        fillet2d(radius: number): Face;
        chamfer2d(distance: number): Face;
        thicken(thickness: number): Solid;
        project(target: Shape): Wire;

        // 其他操作方法
        toArcs(): Face;
        trim(uMin: number, uMax: number, vMin: number, vMax: number): Face;
        isoline(u: number, v: number): Wire;
        isolines(): Wire[];

        // 边界访问
        outerWire(): Wire;
        innerWires(): Wire[];

        // 值访问和类型方法
        value(): TopoDS_Face;
        getGeom(): Surface;
        type(): string;
        copy(): Face;
    }

    class FaceIterator {
        constructor(shape: Shape);
        reset(): void;
        next(): Face | null;
    }

    class Shape3D extends Shape {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);
        constructor(baseShape: Shape, shape: TopoDS_Shape);

        // 几何判断方法
        isInside(point: Point): boolean;
    }


    class Solid extends Shape3D {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);
        constructor(baseShape: Shape, shape: TopoDS_Shape);

        // 基础创建方法
        static makeSolid(compSolid: CompSolid): Solid;
        static makeSolid(shell: Shell): Solid;
        static makeSolid(shell1: Shell, shell2: Shell): Solid;
        static makeSolid(shell1: Shell, shell2: Shell, shell3: Shell): Solid;
        static makeSolid(shells: Shell[]): Solid;
        static makeSolid(solid: Solid): Solid;
        static makeSolid(solid: Solid, shell: Shell): Solid;
        static makeSolid(faces: Face[], tolerance: number): Solid;

        // 基本几何体创建方法 - 盒子
        static makeSolidFromBox(width: number, height: number, depth: number): Solid;
        static makeSolidFromBox(center: Point, width: number, height: number, depth: number): Solid;
        static makeSolidFromBox(p1: Point, p2: Point): Solid;
        static makeSolidFromBox(axis: Axis, width: number, height: number, depth: number): Solid;

        // 基本几何体创建方法 - 圆柱
        static makeSolidFromCylinder(radius: number, height: number, angle?: number): Solid;
        static makeSolidFromCylinder(axis: Axis, radius: number, height: number): Solid;
        static makeSolidFromCylinder(axis: Axis, radius: number, height: number, angle: number): Solid;
        static makeSolidFromCylinder(radius: number, height: number, center: Point, direction: Vector, angle?: number): Solid;

        // 基本几何体创建方法 - 圆锥
        static makeSolidFromCone(radius1: number, radius2: number, height: number, center: Point, direction: Vector, angle?: number): Solid;
        static makeSolidFromCone(radius1: number, radius2: number, height: number, angle?: number): Solid;
        static makeSolidFromCone(axis: Axis, radius1: number, radius2: number, height: number): Solid;
        static makeSolidFromCone(axis: Axis, radius1: number, radius2: number, height: number, angle: number): Solid;


        // 旋转体创建方法
        static makeSolidFromRevolution(curve: Curve): Solid;
        static makeSolidFromRevolution(curve: Curve, angle: number): Solid;
        static makeSolidFromRevolution(curve: Curve, angle1: number, angle2: number): Solid;
        static makeSolidFromRevolution(curve: Curve, angle1: number, angle2: number, angle3: number): Solid;
        static makeSolidFromRevolution(axis: Axis, curve: Curve): Solid;
        static makeSolidFromRevolution(axis: Axis, curve: Curve, angle: number): Solid;
        static makeSolidFromRevolution(axis: Axis, curve: Curve, angle1: number, angle2: number): Solid;
        static makeSolidFromRevolution(axis: Axis, curve: Curve, angle1: number, angle2: number, angle3: number): Solid;

        // 球体创建方法
        static makeSolidFromSphere(radius: number): Solid;
        static makeSolidFromSphere(radius: number, angle: number): Solid;
        static makeSolidFromSphere(radius: number, angle1: number, angle2: number): Solid;
        static makeSolidFromSphere(radius: number, angle1: number, angle2: number, angle3: number): Solid;
        static makeSolidFromSphere(center: Point, radius: number): Solid;
        static makeSolidFromSphere(center: Point, radius: number, angle: number): Solid;
        static makeSolidFromSphere(center: Point, radius: number, angle1: number, angle2: number): Solid;
        static makeSolidFromSphere(center: Point, radius: number, angle1: number, angle2: number, angle3: number): Solid;
        static makeSolidFromSphere(axis: Axis, radius: number): Solid;
        static makeSolidFromSphere(axis: Axis, radius: number, angle: number): Solid;
        static makeSolidFromSphere(axis: Axis, radius: number, angle1: number, angle2: number): Solid;
        static makeSolidFromSphere(axis: Axis, radius: number, angle1: number, angle2: number, angle3: number): Solid;

        // 圆环体创建方法
        static makeSolidFromTorus(majorRadius: number, minorRadius: number): Solid;
        static makeSolidFromTorus(majorRadius: number, minorRadius: number, angle: number): Solid;
        static makeSolidFromTorus(majorRadius: number, minorRadius: number, angle1: number, angle2: number): Solid;
        static makeSolidFromTorus(majorRadius: number, minorRadius: number, angle1: number, angle2: number, angle3: number): Solid;
        static makeSolidFromTorus(axis: Axis, majorRadius: number, minorRadius: number): Solid;
        static makeSolidFromTorus(axis: Axis, majorRadius: number, minorRadius: number, angle: number): Solid;
        static makeSolidFromTorus(axis: Axis, majorRadius: number, minorRadius: number, angle1: number, angle2: number): Solid;

        // 楔形体创建方法
        static makeSolidFromWedge(width: number, height: number, depth: number, taper: number): Solid;
        static makeSolidFromWedge(axis: Axis, width: number, height: number, depth: number, taper: number): Solid;
        static makeSolidFromWedge(width: number, height: number, depth: number, xTaper: number, yTaper: number, zTaper: number, offset: number): Solid;
        static makeSolidFromWedge(axis: Axis, width: number, height: number, depth: number, xTaper: number, yTaper: number, zTaper: number, offset: number): Solid;

        // 几何操作方法
        extrude(direction: Vector, distance: number): Solid;
        revolve(axis: Axis, angle: number): Solid;
        sweep(path: Wire): Solid;
        loft(profiles: Wire[]): Solid;

        // 布尔运算方法
        boolean(other: Solid, op: BooleanOperationType): Solid;
        union(other: Solid): Solid;
        subtract(other: Solid): Solid;
        intersect(other: Solid): Solid;

        // 几何属性方法
        volume(): number;
        centerOfMass(): Point;
        boundingBox(): BBox;

        // 值访问方法
        value(): TopoDS_Solid;

        // 类型方法
        type(): string;
        copy(): Solid;
    }

    class SolidIterator {
        constructor(shape: Shape);
        reset(): void;
        next(): Solid | null;
    }


    class Compound extends Shape3D {
        constructor();
        constructor(shape: TopoDS_Shape, forConstruction?: boolean);
        constructor(baseShape: Shape, shape: TopoDS_Shape);

        // 基础创建方法
        static makeCompound(shapes: Shape[]): Compound;
        static makeCompound(shapes: Shape[]): Compound;

        // 布尔运算方法
        cut(other: Shape): Compound;
        fuse(other: Shape): Compound;
        intersect(other: Shape): Compound;

        // 几何操作方法
        remove(shape: Shape): Compound;
        ancestors(shape: Shape): Shape[];
        siblings(shape: Shape): Shape[];

        // 值访问和类型方法
        value(): TopoDS_Compound;
        type(): string;
        copy(): Compound;
    }

}
