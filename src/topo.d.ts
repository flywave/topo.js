
export declare class BBox {
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
    addVector(point: Vector, tolerance?: number): BBox;
    addBBOx(other: BBox, tolerance?: number): BBox;
    isInside(other: BBox, tolerance?: number): boolean;
    enlarge(tolerance?: number): void;

    // 静态方法
    static findOutsideBox2d(bb1: BBox, bb2: BBox, tolerance?: number): BBox;
    static fromShape(shape: Shape, tolerance?: number, optimal?: boolean): BBox;

    // 底层访问
    getValue(): Bnd_Box;

    delete(): void;
}


export declare class Location {
    constructor();
    constructor(pnt: gp_Trsf | TopLoc_Location | gp_Pnt | gp_Vec | gp_Pln | Vector);
    constructor(vec: gp_Vec, rx: number, ry: number, rz: number);
    constructor(pln: gp_Pln, pos: gp_Pnt);
    constructor(vec: gp_Vec, axis: gp_Vec, angle: number);

    copy(): Location;

    // 操作方法
    hashCode(): number;
    inverted(): Location;
    dividedBy(other: Location): Location;
    multipliedBy(other: Location): Location;
    pow(exp: number): Location;
    toVector(): number[][];
    toTuple(): [[number, number, number], [number, number, number]];

    // 转换方法
    toTopLocLocation(): TopLoc_Location;
    toTrsf(): gp_Trsf;

    // 比较操作
    equals(other: Location): boolean;
    notEquals(other: Location): boolean;

    delete(): void;
}

export declare class Matrix {
    constructor();
    constructor(gtrsf: gp_GTrsf | gp_Trsf | number[][]);

    // 变换方法
    rotateX(angle: number): Matrix;
    rotateY(angle: number): Matrix;
    rotateZ(angle: number): Matrix;
    inverse(): Matrix;
    multiplyMatrix(other: Matrix): Matrix;
    multiplyVector(vec: Vector): Matrix;

    // 数据访问
    get(row: number, col: number): number;
    transposedList(): number[];
    toString(): string;

    // 转换方法
    getValue(): gp_GTrsf;

    delete(): void;
}


export type PlaneName =
    | "XY"
    | "YZ"
    | "ZX"
    | "XZ"
    | "YX"
    | "ZY"
    | "front"
    | "back"
    | "left"
    | "right"
    | "top"
    | "bottom";

export declare class Plane {
    constructor(pln: gp_Pln);
    constructor(origin: Vector, xDir: Vector, normal?: Vector);

    // 静态工厂方法
    static named(name: PlaneName, origin?: Vector): Plane;
    static xy(origin?: Vector, xDir?: Vector): Plane;
    static yz(origin?: Vector, xDir?: Vector): Plane;
    static zx(origin?: Vector, xDir?: Vector): Plane;
    static xz(origin?: Vector, xDir?: Vector): Plane;
    static yx(origin?: Vector, xDir?: Vector): Plane;
    static zy(origin?: Vector, xDir?: Vector): Plane;
    static front(origin?: Vector, xDir?: Vector): Plane;
    static back(origin?: Vector, xDir?: Vector): Plane;
    static left(origin?: Vector, xDir?: Vector): Plane;
    static right(origin?: Vector, xDir?: Vector): Plane;
    static top(origin?: Vector, xDir?: Vector): Plane;
    static bottom(origin?: Vector, xDir?: Vector): Plane;

    // 属性访问
    origin(): Vector;
    xDir(): Vector;
    yDir(): Vector;
    zDir(): Vector;

    // 坐标转换方法
    toWorldCoordsForVector(localVec: Vector): Vector;
    toLocalCoordsForVector(worldVec: Vector): Vector;
    toWorldCoordsForShape(localShp: Shape): Shape;
    toLocalCoordsForShape(worldShp: Shape): Shape;
    location(): Location;

    // 设置方法
    setOrigin(origin: Vector): void;
    setOrigin2d(x: number, y: number): void;

    // 变换方法
    rotated(rotate?: Vector): Plane;
    mirrorInPlane(shapes: Shape[], axis?: string): Plane;

    // 转换方法
    toPln(): gp_Pln;

    delete(): void;
}

export declare class Vector {
    constructor();
    constructor(x: number, y: number, z?: number);
    constructor(arr: gp_Vec | gp_Pnt | gp_Dir | gp_XYZ | [number, number, number]);

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
    projectToPlane(planeNormal: Plane): Vector;
    transform(mat: Matrix): Vector;
    isEqual(other: Vector, tol?: number): boolean;

    // 转换方法
    toTuple(): [number, number, number];
    toPnt(): gp_Pnt;
    toDir(): gp_Dir;
    toVec(): gp_Vec;
    toXYZ(): gp_XYZ;
    toString(): string;

    // 运算符重载
    neg(): Vector;
    plus(other: Vector): Vector;
    minus(other: Vector): Vector;
    times(scalar: number): Vector;
    div(scalar: number): Vector;
    equals(other: Vector): boolean;
    notEquals(other: Vector): boolean;

    delete(): void;
}

interface MeshData {
    vertices: Array<Float32Array>;
    normals?: Array<Float32Array>;
    uvs?: Array<Float32Array>;
    triangles: Array<Uint32Array>;
    faceGroups: Array<{
        faceId: number;
        start: number;
        count: number;
    }>;
}

interface EdgeData {
    lines: Array<Float32Array>;
    edgeGroups: Array<{
        edgeId: number;
        start: number;
        count: number;
    }>;
}

export declare enum GeometryObjectType {
    Solid = 'Solid',
    Shell = 'Shell',
    Face = 'Face',
    Edge = 'Edge',
    Vertex = 'Vertex',
    Wire = 'Wire',
    Compound = 'Compound',
    CompSolid = 'CompSolid',
    Shape = 'Shape'
}

export declare class GeometryObject {
    // 基础属性检查
    isNull(): boolean;
    isValid(): boolean;
    type(): GeometryObjectType;

    // 几何属性
    boundingBox(tolerance?: number): Bnd_Box;

    // 比较方法
    equals(other: GeometryObject): boolean;

    // 序列化方法
    toBrep(): string;

    delete(): void;
}

export declare enum TextureMappingRule {
    CUBE = 'CUBE',
    NORMAL = 'NORMAL',
    NORMAL_AUTO_SCALE = 'NORMAL_AUTO_SCALE'
}

export declare enum Orientation {
    FORWARD = 'FORWARD',
    REVERSED = 'REVERSED',
    INTERNAL = 'INTERNAL',
    EXTERNAL = 'EXTERNAL',
    UNKNOW = 'UNKNOW'
}

export declare enum ShapeGeomType {
    NULL = 'NULL',
    VERTEX = 'VERTEX',
    WIRE = 'WIRE',
    SHELL = 'SHELL',
    SOLID = 'SOLID',
    COMPSOLID = 'COMPSOLID',
    COMPOUND = 'COMPOUND',
    LINE = 'LINE',
    CIRCLE = 'CIRCLE',
    HYPERBOLA = 'HYPERBOLA',
    PARABOLA = 'PARABOLA',
    ELLIPSE = 'ELLIPSE',
    BEZIER_CURVE = 'BEZIER_CURVE',
    BSPLINE_CURVE = 'BSPLINE_CURVE',
    OFFSET_CURVE = 'OFFSET_CURVE',
    OTHER_CURVE = 'OTHER_CURVE',
    PLANE = 'PLANE',
    CYLINDER = 'CYLINDER',
    CONE = 'CONE',
    SPHERE = 'SPHERE',
    TORUS = 'TORUS',
    BEZIER_SURFACE = 'BEZIER_SURFACE',
    BSPLINE_SURFACE = 'BSPLINE_SURFACE',
    OFFSET_SURFACE = 'OFFSET_SURFACE',
    OTHER_SURFACE = 'OTHER_SURFACE',
    REVOLVED_SURFACE = 'REVOLVED_SURFACE',
    EXTRUDED_SURFACE = 'EXTRUDED_SURFACE'
}

export declare class Shape extends GeometryObject {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 静态方法
    static makeShape(shp: TopoDS_Shape): Shape;
    static importFromBrep(brep: string): Shape;
    static combinedCenter(shapes: Shape[]): gp_Pnt;
    static combinedCenterOfBoundingBox(shapes: Shape[]): gp_Pnt;

    // 基础方法
    isNull(): boolean;
    isValid(): boolean;
    isSolid(): boolean;
    type(): GeometryObjectType;
    bbox(): BBox;
    hashCode(): number;
    equals(other: Shape): boolean;
    isSame(other: Shape): boolean;
    forConstruction(): boolean;

    // 属性设置
    setSurfaceColour(color: Quantity_Color): void;
    setCurveColour(color: Quantity_Color): void;
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
    surfaceColour(): Quantity_Color;
    curveColour(): Quantity_Color;
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
    transform(trsf: gp_Trsf | Matrix): number;
    translate(delta: gp_Vec): number;
    rotateFromPoint(angle: number, p1: gp_Pnt, p2: gp_Pnt): number;
    rotateFromAxis1(angle: number, axis: gp_Ax1): number;
    rotateFromQuaternion(quat: gp_Quaternion): number;
    scale(factor: number): number;
    mirrorFromTwoPoint(p1: gp_Pnt, p2: gp_Pnt): number;
    mirrorFromPointNorm(p: gp_Pnt, dir: gp_Vec): number;
    mirrorFromAxis1(axis: gp_Ax1): number;
    mirrorFromAxis2(ax2: gp_Ax2): number;

    // 几何计算
    centreOfMass(): gp_Pnt;
    centerOfBoundBox(): gp_Pnt;
    computeMass(): number;
    computeArea(): number;
    distance(other: Shape): number;
    distances(other: Shape[]): number[];

    // 非破坏性变换方法
    transformed(trsf: gp_Trsf | Matrix): Shape;
    translated(delta: gp_Vec): Shape;
    rotatedFromPoint(angle: number, p1: gp_Pnt, p2: gp_Pnt): Shape;
    rotatedFromAxis1(angle: number, axis: gp_Ax1): Shape;
    rotatedFromQuaternion(quat: gp_Quaternion): Shape;
    scaled(pnt: gp_Pnt, scale: number): Shape;
    mirroredFromTwoPoint(pnt: gp_Pnt, nor: gp_Pnt): Shape;
    mirroredFromPointNorm(pnt: gp_Pnt, nor: gp_Vec): Shape;
    mirroredFromAxis1(axis: gp_Ax1): Shape;
    mirroredFromAxis2(ax2: gp_Ax2): Shape;

    // 位置和方向操作
    location(): number[] | null;
    setLocation(loc: Location): void;
    located(loc: Location): Shape;
    moveFromLocation(loc: Location): number;
    move(x: number, y: number, z: number, rx: number, ry: number, rz: number): number;
    moveFromVector(vec: gp_Vec): number;
    movedFromLocation(loc: Location): Shape;
    moved(x: number, y: number, z: number, rx: number, ry: number, rz: number): Shape;
    movedFromVector(vec: gp_Vec): Shape;
    movedFromLocations(locs: Location[]): Shape;
    movedFromVectors(vecs: gp_Vec[]): Shape;

    // 方向操作
    getOrientation(): Orientation;
    setOrientation(quat: Orientation): void;
    oriented(quat: Orientation): Shape;

    // 子元素访问
    children(): Shape[];
    getShapes(kind: TopAbs_ShapeEnum): Shape[];
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
    ancestors(shape: Shape, kind: TopAbs_ShapeEnum): Compound | null;
    siblings(shape: Shape, kind: TopAbs_ShapeEnum, level?: number): Compound | null;
    fixShape(): void;
    findPlane(tolerance?: number): Plane;
    toSplines(degree?: number, tolerance?: number, nurbs?: boolean): Shape | null;
    toNurbs(): Shape | null;
    toString(tolerance?: number, angularTolerance?: number): string;

    // 操作符重载
    equals(other: Shape): boolean;
    notEquals(other: Shape): boolean;
    lessThan(other: Shape): boolean;

    // 网格生成
    writeTriangulation(precision: number, deflection: number, angle: number, uvCoords: boolean): MeshData | null;
    mesh(precision?: number, deflection?: number, angle?: number, uvCoords?: boolean):  MeshData | null;
    meshEdges(precision?: number, angle?: number): EdgeData | null;

    // 选择器相关
    static filter(selector: Selector, shapes: Shape[]): Shape[];
    selectVertices(selector: Selector): Shape;
    selectEdges(selector: Selector): Shape;
    selectWires(selector: Selector): Shape;
    selectFaces(selector: Selector): Shape;
    selectShells(selector: Selector): Shape;
    selectSolids(selector: Selector): Shape;
    selectCompounds(selector: Selector): Shape;
    selectCompSolids(selector: Selector): Shape;

    // 类型转换
    castVertex(): Vertex | null;
    castEdge(): Edge | null;
    castWire(): Wire | null;
    castFace(): Face | null;
    castShell(): Shell | null;
    castSolid(): Solid | null;
    castCompound(): Compound | null;
    castCompSolid(): CompSolid | null;
    autoCast(): Vertex | Edge | Wire | Face | Shell | Solid | Compound | CompSolid | null;

    // 其他方法
    value(): TopoDS_Shape;
    copy(deep?: boolean): Shape;
    shapeType(): TopAbs_ShapeEnum;
    geomType(): ShapeGeomType;
}

export declare class Vertex extends Shape {
    constructor();
    constructor(x: number, y: number, z: number);
    constructor(pnt: gp_Pnt);

    // 静态工厂方法
    static makeVertex(pnt: gp_Pnt | gp_Vec): Vertex;
    static makeVertex(vec: gp_Vec): Vertex;

    // 方法
    value(): TopoDS_Vertex;
    point(): gp_Pnt;
    type(): GeometryObjectType;
    copy(deep?: boolean): Shape;
}

export declare class VertexIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): Vertex | null;
    delete(): void;
}

export declare enum ParamMode {
    LENGTH = 'LENGTH',
    PARAM = 'PARAM'
}

export declare enum FrameMode {
    FRENET = 'FRENET',
    CORRECTED_FRENET = 'CORRECTED_FRENET'
}

export declare class Shape1D extends Shape {
    constructor();

    // 几何属性方法
    getCurve(): Handle_Geom_Curve;

    bounds(): [number, number];
    length(): number;
    isClosed(): boolean;

    // 端点访问
    startgPoint(): gp_Pnt;
    endPoint(): gp_Pnt;

    // 参数化方法
    paramAt(param: number): number;
    ParamAtPoint(point: gp_Pnt): number;
    params(points: gp_Pnt[], tolerance?: number): number[];
    paramsLength(parameters: number[]): number[];

    // 几何特征
    tangentAt(param: number): gp_Dir;
    tangents(parameters: number[]): gp_Dir[];
    normal(): gp_Dir;
    center(): gp_Pnt;
    radius(): number;

    // 位置和采样
    positionAt(param: number, mode?: ParamMode): gp_Pnt;
    positions(ds: number[], mode?: ParamMode): gp_Pnt[];
    sampleUniform(n: number): [gp_Pnt[], number[]];

    // 定位和投影
    locationAt(param: number, mode?: ParamMode, frame?: FrameMode, planar?: boolean): Location;
    locations(ds: number[], mode?: ParamMode, frame?: FrameMode, planar?: boolean): Location[];
    projected(f: Face, direction: gp_Vec, closest?: boolean): Shape | Shape[];

    // 曲率分析
    curvatureAt(param: number, mode: ParamMode, resolution?: number): number;
    curvatures(ds: number[], mode: ParamMode, resolution?: number): number[];
}

export declare class Edge extends Shape1D {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 静态创建方法 - 基本类型
    static makeEdgeFromTwoVertex(v1: Vertex, v2: Vertex): Edge;
    static makeEdgeFromTwoPoint(p1: gp_Pnt, p2: gp_Pnt): Edge;

    // 静态创建方法 - 直线
    static makeEdgeFromLine(line: gp_Lin): Edge;
    static makeEdgeFromLineParm(line: gp_Lin, u1: number, u2: number): Edge;
    static makeEdgeFromLinePoint(line: gp_Lin, p1: gp_Pnt, p2: gp_Pnt): Edge;
    static makeEdgeFromLineVertex(line: gp_Lin, v1: Vertex, v2: Vertex): Edge;

    // 静态创建方法 - 圆
    static makeEdgeFromCirc(circle: gp_Circ): Edge;
    static makeEdgeFromCircParm(circle: gp_Circ, u1: number, u2: number): Edge;
    static makeEdgeFromCircPoint(circle: gp_Circ, p1: gp_Pnt, p2: gp_Pnt): Edge;
    static makeEdgeFromCircVertex(circle: gp_Circ, v1: Vertex, v2: Vertex): Edge;

    // 静态创建方法 - 椭圆
    static makeEdgeFromElips(ellipse: gp_Elips): Edge;
    static makeEdgeFromElipsParm(ellipse: gp_Elips, u1: number, u2: number): Edge;
    static makeEdgeFromElipsPoint(ellipse: gp_Elips, p1: gp_Pnt, p2: gp_Pnt): Edge;
    static makeEdgeFromElipsVertex(ellipse: gp_Elips, v1: Vertex, v2: Vertex): Edge;

    // 双曲线创建方法
    static makeEdgeFromHyper(hyperbola: gp_Hypr): Edge;
    static makeEdgeFromHyperParm(hyperbola: gp_Hypr, u1: number, u2: number): Edge;
    static makeEdgeFromHyperPoint(hyperbola: gp_Hypr, p1: gp_Pnt, p2: gp_Pnt): Edge;
    static makeEdgeFromHyperVertex(hyperbola: gp_Hypr, v1: Vertex, v2: Vertex): Edge;

    // 抛物线创建方法
    static makeEdgeFromPara(parabola: gp_Parab): Edge;
    static makeEdgeFromParaParm(parabola: gp_Parab, u1: number, u2: number): Edge;
    static makeEdgeFromParaPoint(parabola: gp_Parab, p1: gp_Pnt, p2: gp_Pnt): Edge;
    static makeEdgeFromParaVertex(parabola: gp_Parab, v1: Vertex, v2: Vertex): Edge;

    // 通用曲线创建方法
    static makeEdgeFromCurve(curve: Handle_Geom_Curve): Edge;
    static makeEdgeFromCurveParm(curve: Handle_Geom_Curve, u1: number, u2: number): Edge;
    static makeEdgeFromCurvePoint(curve: Handle_Geom_Curve, p1: gp_Pnt, p2: gp_Pnt): Edge;
    static makeEdgeFromCurveVertex(curve: Handle_Geom_Curve, v1: Vertex, v2: Vertex): Edge;
    static makeEdgeFromCurvePointParm(
        curve: Handle_Geom_Curve,
        p1: gp_Pnt,
        p2: gp_Pnt,
        u1: number,
        u2: number
    ): Edge;
    static makeEdgeFromCurveVertexParm(
        curve: Handle_Geom_Curve,
        v1: Vertex,
        v2: Vertex,
        u1: number,
        u2: number
    ): Edge;

    // 2D曲线创建方法
    static makeEdgeFromSurface(
        curve2d: Handle_Geom2d_Curve,
        surface: Handle_Geom_Surface
    ): Edge;
    static makeEdgeFromSurfaceParm(
        curve2d: Handle_Geom2d_Curve,
        surface: Handle_Geom_Surface,
        u1: number,
        u2: number
    ): Edge;
    static makeEdgeFromSurfacePoint(
        curve2d: Handle_Geom2d_Curve,
        surface: Handle_Geom_Surface,
        p1: gp_Pnt,
        p2: gp_Pnt
    ): Edge;
    static makeEdgeFromSurfaceVertex(
        curve2d: Handle_Geom2d_Curve,
        surface: Handle_Geom_Surface,
        v1: Vertex,
        v2: Vertex
    ): Edge;
    static makeEdgeFromSurfacePointParm(
        curve2d: Handle_Geom2d_Curve,
        surface: Handle_Geom_Surface,
        p1: gp_Pnt,
        p2: gp_Pnt,
        u1: number,
        u2: number
    ): Edge;
    static makeEdgeFromSurfaceVertexParm(
        curve2d: Handle_Geom2d_Curve,
        surface: Handle_Geom_Surface,
        v1: Vertex,
        v2: Vertex,
        u1: number,
        u2: number
    ): Edge;

    // 值访问
    value(): TopoDS_Edge;

    // 基本属性
    isSeam(face: Face): boolean;
    isDegenerated(): boolean;
    isClosed(): boolean;
    isInfinite(): boolean;
    length(): number;
    tolerance(): number;
    isCurve3d(): boolean;
    convertToCurve3d(): void;
    reverse(): Edge;

    // 2D曲线创建方法
    static makeEdge2dFromTwoVertex(v1: Vertex, v2: Vertex): Edge;
    static makeEdge2dFromTwoPoint(p1: gp_Pnt2d, p2: gp_Pnt2d): Edge;
    static makeEdge2dFromLine(line: gp_Lin2d): Edge;
    static makeEdge2dFromLineParm(line: gp_Lin2d, u1: number, u2: number): Edge;
    static makeEdge2dFromLinePoint(line: gp_Lin2d, p1: gp_Pnt2d, p2: gp_Pnt2d): Edge;
    static makeEdge2dFromLineVertex(line: gp_Lin2d, v1: Vertex, v2: Vertex): Edge;
    static makeEdge2dFromCirc(circle: gp_Circ2d): Edge;
    static makeEdge2dFromCircParm(circle: gp_Circ2d, u1: number, u2: number): Edge;
    static makeEdge2dFromCircPoint(circle: gp_Circ2d, p1: gp_Pnt2d, p2: gp_Pnt2d): Edge;
    static makeEdge2dFromCircVertex(circle: gp_Circ2d, v1: Vertex, v2: Vertex): Edge;
    static makeEdge2dFromElips(ellipse: gp_Elips2d): Edge;
    static makeEdge2dFromElipsParm(ellipse: gp_Elips2d, u1: number, u2: number): Edge;
    static makeEdge2dFromElipsPoint(ellipse: gp_Elips2d, p1: gp_Pnt2d, p2: gp_Pnt2d): Edge;
    static makeEdge2dFromElipsVertex(ellipse: gp_Elips2d, v1: Vertex, v2: Vertex): Edge;

    // 双曲线和抛物线2D创建方法
    static makeEdge2dFromHyper(hyperbola: gp_Hypr2d): Edge;
    static makeEdge2dFromHyperParm(hyperbola: gp_Hypr2d, u1: number, u2: number): Edge;
    static makeEdge2dFromHyperPoint(hyperbola: gp_Hypr2d, p1: gp_Pnt2d, p2: gp_Pnt2d): Edge;
    static makeEdge2dFromHyperVertex(hyperbola: gp_Hypr2d, v1: Vertex, v2: Vertex): Edge;
    static makeEdge2dFromPara(parabola: gp_Parab2d): Edge;
    static makeEdge2dFromParaParm(parabola: gp_Parab2d, u1: number, u2: number): Edge;
    static makeEdge2dFromParaPoint(parabola: gp_Parab2d, p1: gp_Pnt2d, p2: gp_Pnt2d): Edge;
    static makeEdge2dFromParaVertex(parabola: gp_Parab2d, v1: Vertex, v2: Vertex): Edge;

    // 2D曲线创建方法
    static makeEdge2dFromCurve(curve2d: Handle_Geom2d_Curve): Edge;
    static makeEdge2dFromCurveParm(curve2d: Handle_Geom2d_Curve, u1: number, u2: number): Edge;
    static makeEdge2dFromCurvePoint(curve2d: Handle_Geom2d_Curve, p1: gp_Pnt2d, p2: gp_Pnt2d): Edge;
    static makeEdge2dFromCurveVertex(curve2d: Handle_Geom2d_Curve, v1: Vertex, v2: Vertex): Edge;
    static makeEdge2dFromCurvePointParm(
        curve2d: Handle_Geom2d_Curve,
        p1: gp_Pnt2d,
        p2: gp_Pnt2d,
        u1: number,
        u2: number
    ): Edge;
    static makeEdge2dFromCurveVertexParm(
        curve2d: Handle_Geom2d_Curve,
        v1: Vertex,
        v2: Vertex,
        u1: number,
        u2: number
    ): Edge;

    // 多边形创建方法
    static makePolygon(): Edge;
    static makePolygonFromTwoPoint(p1: gp_Pnt, p2: gp_Pnt): Edge;
    static makePolygonFromThreePoint(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt, close?: boolean): Edge;
    static makePolygonFromFourPoint(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt, p4: gp_Pnt, close?: boolean): Edge;
    static makePolygonFromTwoVertex(v1: Vertex, v2: Vertex): Edge;
    static makePolygonFromThreeVertex(v1: Vertex, v2: Vertex, v3: Vertex, close?: boolean): Edge;
    static makePolygonFromFourVertex(v1: Vertex, v2: Vertex, v3: Vertex, v4: Vertex, close?: boolean): Edge;
    static makePolygonFromVertices(vertices: Vertex[], close?: boolean): Edge;
    static makePolygonFromPoints(points: gp_Pnt[], close?: boolean): Edge;

    // 矩形创建方法
    static makeRect(width: number, height: number): Edge;

    // 样条曲线创建方法
    static makeSpline(points: gp_Pnt[], tolerance?: number, periodic?: boolean): Edge;
    static makeSplineFromTangentsAndParametersAndPeriodic(points: gp_Pnt[], tangents?: [gp_Vec, gp_Vec], parameters?: number[], tolerance?: number, periodic?: boolean, scale?: boolean): Edge;
    static makeSplineFromTangentsAndParameters(points: gp_Pnt[], tangents?: gp_Vec[], periodic?: boolean, parameters?: number[], scale?: boolean, tolerance?: number): Edge;
    static makeSplineApprox(points: gp_Pnt[], tolerance?: number, smoothing?: [number, number, number], minDegree?: number, maxDegree?: number): Edge;

    // 圆形创建方法
    static makeCircle(
        radius: number,
        center?: gp_Pnt,
        normal?: gp_Dir,
        angle1?: number,
        angle2?: number,
        orientation?: boolean
    ): Edge;

    // 椭圆创建方法
    static makeEllipse(
        majorRadius: number,
        minorRadius: number,
        center?: gp_Pnt,
        normal?: gp_Dir,
        xnormal?: gp_Dir,
        angle1?: number,
        angle2?: number,
        sense?: number
    ): Edge;

    // 三点圆弧创建方法
    static makeThreePointArc(v1: gp_Pnt, v2: gp_Pnt, v3: gp_Pnt): Edge;

    // 切线圆弧创建方法
    static makeTangentArc(v1: gp_Pnt, tangent: gp_Vec, v3: gp_Pnt): Edge;

    // 贝塞尔曲线创建方法
    static makeBezier(points: gp_Pnt[]): Edge;

    // 几何操作
    close(): Wire | Edge | null;
    arcCenter(): gp_Pnt;
    trim(u1: number, u2: number): Edge;

    // 类型方法
    getGeom(): Handle_Adaptor3d_Curve;
    type(): GeometryObjectType;
    copy(deep?: boolean): Edge;
}

export declare class EdgeIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): Edge | null;
    delete(): void;
}

export declare enum WireCurveType {
    LINE = 'LINE',
    THREE_POINT_ARC = 'THREE_POINT_ARC',
    CIRCLE_CENTER_ARC = 'CIRCLE_CENTER_ARC',
    SPLINE = 'SPLINE'
}

export declare class Wire extends Shape1D {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 多边形创建方法
    static makePolygon(): Wire;
    static makePolygonFromTwoPoint(p1: gp_Pnt, p2: gp_Pnt): Wire;
    static makePolygonFromThreePoint(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt, close?: boolean): Wire;
    static makePolygonFromFourPoint(p1: gp_Pnt, p2: gp_Pnt, p3: gp_Pnt, p4: gp_Pnt, close?: boolean): Wire;
    static makePolygonFromTwoVertex(v1: Vertex, v2: Vertex): Wire;
    static makePolygonFromThreeVertex(v1: Vertex, v2: Vertex, v3: Vertex, close?: boolean): Wire;
    static makePolygonFromFourVertex(v1: Vertex, v2: Vertex, v3: Vertex, v4: Vertex, close?: boolean): Wire;
    static makePolygonFromPoints(points: gp_Pnt[], close?: boolean, ordered?: boolean): Wire;

    // 基础创建方法
    static makeWireFromEdge(edge: Edge): Wire;
    static makeWireFromTwoEdge(e1: Edge, e2: Edge): Wire;
    static makeWireFromThreeEdge(e1: Edge, e2: Edge, e3: Edge): Wire;
    static makeWireFromFourEdge(e1: Edge, e2: Edge, e3: Edge, e4: Edge): Wire;
    static makeWireFromWire(wire: Wire): Wire;
    static makeWireFromTwoWire(wire: Wire, edge: Edge): Wire;
    static makeWireFromEdges(edges: Edge[]): Wire;
    static makeWireFromWires(wires: Wire[]): Wire;

    // 几何形状创建方法
    static makeRect(width: number, height: number): Wire;
    static makeCircle(radius: number): Wire;
    static makeEllipse(majorRadius: number, minorRadius: number): Wire;
    static makeHelix(pitch: number, height: number): Wire;
    static combine(wires: Wire[]): Wire;
    static makeWire(points: gp_Pnt[][], curveTypes: WireCurveType[]): Wire;

    // 几何操作方法
    stitch(other: Wire): Wire;
    numEdges(): number;
    length(): number;
    convertToCurves3d(): void;
    project(face: Face): number;

    // 值访问方法
    value(): TopoDS_Wire;

    // 类型方法
    type(): GeometryObjectType;
    copy(deep?: boolean): Shape;
    close(): Wire;

    // 偏移和倒角操作
    offset(distance: number, kind?: GeomAbs_JoinType): Wire;
    fillet(vertices: Vertex[], radius: number[]): Wire;
    chamfer(vertices: Vertex[], distances: number[]): Wire;
    offset2d(distance: number, kind?: GeomAbs_JoinType): Wire;
    fillet2d(radius: number, vertices: Vertex[]): Wire;
    chamfer2d(distance: number, vertices: Vertex[]): Wire;

    // 几何操作方法
    getGeom(): Handle_Adaptor3d_Curve;
}

export declare class WireIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): Wire | null;
    delete(): void;
}

export declare enum BooleanOperationType {
    FUSE = 'FUSE',
    CUT = 'CUT',
    COMMON = 'COMMON'
}

export declare class Face extends Shape {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 基础创建方法
    static makeFace(face: Face): Face;
    static makeFaceFromPlane(plane: gp_Pln): Face;
    static makeFaceFromCylinder(cylinder: gp_Cylinder): Face;
    static makeFaceFromCone(cone: gp_Cone): Face;
    static makeFaceFromSphere(sphere: gp_Sphere): Face;
    static makeFaceFromTorus(torus: gp_Torus): Face;
    static makeFaceFromSurface(surface: Handle_Geom_Surface, tolDegen: number): Face;

    // 带参数范围的创建方法
    static makeFaceFromPlaneParm(plane: gp_Pln, uMin: number, uMax: number, vMin: number, vMax: number): Face;
    static makeFaceFromCylinderParm(cylinder: gp_Cylinder, uMin: number, uMax: number, vMin: number, vMax: number): Face;
    static makeFaceFromConeParm(cone: gp_Cone, uMin: number, uMax: number, vMin: number, vMax: number): Face;
    static makeFaceFromSphereParm(sphere: gp_Sphere, uMin: number, uMax: number, vMin: number, vMax: number): Face;
    static makeFaceFromTorusParm(torus: gp_Torus, uMin: number, uMax: number, vMin: number, vMax: number): Face;
    static makeFaceFromSurfaceParm(surface: Handle_Geom_Surface, uMin: number, uMax: number, vMin: number, vMax: number, tolerance?: number): Face;

    // 基于wire的创建方法
    static makeFaceFromWire(wire: Wire, onlyPlane?: boolean): Face;
    static makeFaceFromPlaneWire(plane: gp_Pln, wire: Wire, onlyPlane?: boolean): Face;
    static makeFaceFromCylinderWire(cylinder: gp_Cylinder, wire: Wire, onlyPlane?: boolean): Face;
    static makeFaceFromConeWire(cone: gp_Cone, wire: Wire, onlyPlane?: boolean): Face;
    static makeFaceFromSphereWire(sphere: gp_Sphere, wire: Wire, onlyPlane?: boolean): Face;
    static makeFaceFromTorusWire(torus: gp_Torus, wire: Wire, onlyPlane?: boolean): Face;
    static makeFaceFromSurfaceWire(surface: Handle_Geom_Surface, wire: Wire, onlyPlane?: boolean): Face;
    static makeFaceFromFaceWire(face: Face, wire: Wire): Face;
    static makeFaceFromFaceWireWithOuterInners(face: Face, wire: Wire, otherWires: Wire[]): Face;

    // 基于边和点的创建方法
    static makeFaceFromEdges(e1: Edge, e2: Edge): Face;
    static makeFaceFaceFromTwoWire(w1: Wire, w2: Wire): Face;
    static makeFaceFaceFromWires(wires: Wire[]): Face;
    static makeFaceFromPoints(points: gp_Pnt[]): Face;
    static makeFaceFromEdgesAndPoints(edges: Edge[], points: gp_Pnt[]): Face;
    static makeFaceFromOuterAndInners(outerWire: Wire, innerWires: Wire[]): Face;
    static makeFromWires(outer: Wire, wires?: Wire[]): Face[];

    // 特殊创建方法
    static makeComplexFace(
        edgesOrWires: (Wire | Edge)[],
        constraints: (Wire | Edge | gp_Pnt)[],
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

    // 平面创建方法
    static makePlane(
        basePnt?: gp_Pnt,
        dir?: gp_Dir,
        length?: OptionalDouble,
        width?: OptionalDouble
    ): Face;

    // 样条近似曲面创建方法
    static makeSplineApprox(
        points: gp_Pnt[],
        tolerance?: number,
        smoothing?: [number, number, number],
        minDegree?: number,
        maxDegree?: number
    ): Face;

    // 几何属性方法
    area(): number;
    tolerance(): number;
    inertia(): Bnd_Box;
    centreOfMass(): gp_Pnt;
    center(): gp_Pnt;
    toPlane(): gp_Pln;

    // 参数化方法
    uvBounds(): [number, number, number, number];
    paramAt(pt: gp_Pnt): [number, number];
    params(pts: gp_Pnt[], tolerance?: number): [number[], number[]];
    positionAt(u: number, v: number): gp_Pnt;
    positions(uvs: [number, number][]): gp_Pnt[];

    // 法线计算和偏移操作
    normalAt(point?: gp_Pnt): gp_Vec;
    normalAtUV(u: number, v: number): [gp_Vec, gp_Pnt];
    normals(us: number[], vs: number[]): [gp_Vec[], gp_Pnt[]];
    offset(distance: number, tolerance?: number): Face;

    // 几何变换方法
    extrude(shp: Shape, p1: gp_Pnt, p2: gp_Pnt): number;
    revolve(shp: Shape, p1: gp_Pnt, p2: gp_Pnt, angle?: number): number;
    sweep(spine: Wire, profiles: Shape[], cornerMode?: number): number;
    loft(profiles: Shape[], ruled?: boolean, tolerance?: number): number;

    // 布尔运算和2D操作
    boolean(other: Face, op: BooleanOperationType): Face;
    fillet2d(radius: number, vertices: Vertex[]): Face;
    chamfer2d(distance: number, vertices: Vertex[]): Face;
    thicken(thickness: number): Solid;
    project(face: Face, direction: gp_Vec): Face;

    // 其他操作方法
    toArcs(tolerance?: number): Face;
    trim(uMin: number, uMax: number, vMin: number, vMax: number, tolerance?: number): Face;
    isoline(param: number, direction?: string): Edge;
    isolines(params: number[], direction?: string): Edge[];

    // 边界访问
    outerWire(): Wire;
    innerWires(): Wire[];

    // 值访问和类型方法
    value(): TopoDS_Face;
    getGeom(): Handle_Geom_Surface;
    type(): GeometryObjectType;
    copy(deep?: boolean): Shape;
}

export declare class FaceIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): Face | null;
    delete(): void;
}

export declare class Shell extends Shape {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 基础创建方法
    static makeShellFromSurface(surface: Handle_Geom_Surface, segment?: boolean): Shell;
    static makeShellFromSurfaceFromSurfaceParm(
        surface: Handle_Geom_Surface,
        uMin: number, uMax: number,
        vMin: number, vMax: number,
        segment?: boolean
    ): Shell;

    // 盒子创建方法
    static makeShellFromBox(dx: number, dy: number, dz: number): Shell;
    static makeShellFromBoxPoint(center: gp_Pnt, dx: number, dy: number, dz: number): Shell;
    static makeShellFromBoxTwoPoint(p1: gp_Pnt, p2: gp_Pnt): Shell;
    static makeShellFromBoxAxis2(axes: gp_Ax2, dx: number, dy: number, dz: number): Shell;

    // 圆柱创建方法
    static makeShellFromCylinder(radius: number, height: number): Shell;
    static makeShellFromCylinderAngle(radius: number, height: number, angle: number): Shell;
    static makeShellFromCylinderAxis2(axes: gp_Ax2, radius: number, height: number): Shell;
    static makeShellFromCylinderAxis2Angle(axes: gp_Ax2, radius: number, height: number, angle: number): Shell;

    // 圆锥创建方法
    static makeShellFromCone(radius1: number, radius2: number, height: number): Shell;
    static makeShellFromConeAngle(radius1: number, radius2: number, height: number, angle: number): Shell;
    static makeShellFromConeAxis2(axes: gp_Ax2, radius1: number, radius2: number, height: number): Shell;
    static makeShellFromConeAxis2Angle(axes: gp_Ax2, radius1: number, radius2: number, height: number, angle: number): Shell;

    // 旋转体创建方法
    static makeShellFromRevolution(meridian: Handle_Geom_Curve): Shell;
    static makeShellFromRevolutionAngle(meridian: Handle_Geom_Curve, angle: number): Shell;
    static makeShellFromRevolutionLimit(meridian: Handle_Geom_Curve, vMin: number, vMax: number): Shell;
    static makeShellFromRevolutionLimitAngle(meridian: Handle_Geom_Curve, vMin: number, vMax: number, angle: number): Shell;
    static makeShellFromRevolutionAxis2(axes: gp_Ax2, meridian: Handle_Geom_Curve): Shell;
    static makeShellFromRevolutionAxis2Angle(axes: gp_Ax2, meridian: Handle_Geom_Curve, angle: number): Shell;
    static makeShellFromRevolutionAxis2Limit(axes: gp_Ax2, meridian: Handle_Geom_Curve, vMin: number, vMax: number): Shell;
    static makeShellFromRevolutionAxis2LimitAngle(axes: gp_Ax2, meridian: Handle_Geom_Curve, vMin: number, vMax: number, angle: number): Shell;

    // 球体创建方法
    static makeShellFromSphere(radius: number): Shell;
    static makeShellFromSphereAngle(radius: number, angle: number): Shell;
    static makeShellFromSphereTwoAngle(radius: number, angle1: number, angle2: number): Shell;
    static makeShellFromSphereThreeAngle(radius: number, angle1: number, angle2: number, angle3: number): Shell;
    static makeShellFromSphereCenterRaduis(center: gp_Pnt, radius: number): Shell;
    static makeShellFromSphereCenterAngle(center: gp_Pnt, radius: number, angle: number): Shell;
    static makeShellFromSphereCenterTwoAngle(center: gp_Pnt, radius: number, angle1: number, angle2: number): Shell;
    static makeShellFromSphereCenterThreeAngle(center: gp_Pnt, radius: number, angle1: number, angle2: number, angle3: number): Shell;
    static makeShellFromSphereAxis2(axis: gp_Ax2, radius: number): Shell;
    static makeShellFromSphereAxis2Angle(axis: gp_Ax2, radius: number, angle: number): Shell;
    static makeShellFromSphereAxis2TwoAngle(axis: gp_Ax2, radius: number, angle1: number, angle2: number): Shell;
    static makeShellFromSphereAxis2ThreeAngle(axis: gp_Ax2, radius: number, angle1: number, angle2: number, angle3: number): Shell;

    // 圆环体创建方法
    static makeShellFromTorus(radius1: number, radius2: number): Shell;
    static makeShellFromTorusAngle(radius1: number, radius2: number, angle: number): Shell;
    static makeShellFromTorusTwoAngle(radius1: number, radius2: number, angle1: number, angle2: number): Shell;
    static makeShellFromTorusThreeAngle(radius1: number, radius2: number, angle1: number, angle2: number, angle3: number): Shell;
    static makeShellFromTorusAxis2(axes: gp_Ax2, radius1: number, radius2: number): Shell;
    static makeShellFromTorusAxis2Angle(axes: gp_Ax2, radius1: number, radius2: number, angle: number): Shell;
    static makeShellFromTorusAxis2TwoAngle(axes: gp_Ax2, radius1: number, radius2: number, angle1: number, angle2: number): Shell;
    static makeShellFromTorusAxis2ThreeAngle(axes: gp_Ax2, radius1: number, radius2: number, angle1: number, angle2: number, angle3: number): Shell;

    // 楔形体创建方法
    static makeShellFromWedge(dx: number, dy: number, dz: number, ltx: number): Shell;
    static makeShellFromWedgeAxis2(axes: gp_Ax2, dx: number, dy: number, dz: number, ltx: number): Shell;
    static makeShellFromWedgeLimit(dx: number, dy: number, dz: number, xMin: number, zMin: number, xMax: number, zMax: number): Shell;
    static makeShellFromWedgeAxis2Limit(axes: gp_Ax2, dx: number, dy: number, dz: number, xMin: number, zMin: number, xMax: number, zMax: number): Shell;

    // 几何操作方法
    sweep(spine: Wire, profiles: Shape[], cornerMode: number): number;

    // 值访问和类型方法
    value(): TopoDS_Shell;
    type(): GeometryObjectType;
    copy(deep?: boolean): Shape;
}

export declare class ShellIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): Shell | null;
    delete(): void;
}

export declare class Shape3D extends Shape {
    constructor();

    // 几何判断方法
    isInside(point: gp_Pnt, tolerance?: number): boolean;
}

export declare type SweepMode = gp_Vec | TopoDS_Wire | TopoDS_Edge;

export declare class Solid extends Shape3D {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 基础创建方法
    static makeSolidFromCompSolid(compSolid: CompSolid): Solid;
    static makeSolidFromShell(shell: Shell): Solid;
    static makeSolidFromTwoShell(shell1: Shell, shell2: Shell): Solid;
    static makeSolidFromThreeShell(shell1: Shell, shell2: Shell, shell3: Shell): Solid;
    static makeSolidFromShells(shells: Shell[]): Solid;
    static makeSolidFromSolid(solid: Solid): Solid;
    static makeSolidFromSolidShell(solid: Solid, shell: Shell): Solid;
    static makeSolidFromFaces(faces: Face[], tolerance: number): Solid;

    // 基本几何体创建方法 - 盒子
    static makeSolidFromBox(width: number, height: number, depth: number): Solid;
    static makeSolidFromBoxPoint(center: gp_Pnt, width: number, height: number, depth: number): Solid;
    static makeSolidFromBoxTwoPoint(p1: gp_Pnt, p2: gp_Pnt): Solid;
    static makeSolidFromBoxAxis2(axis: gp_Ax2, width: number, height: number, depth: number): Solid;

    // 基本几何体创建方法 - 圆柱
    static makeSolidFromCylinderAngle(radius: number, height: number, angle?: number): Solid;
    static makeSolidFromCylinderAxis2(axis: gp_Ax2, radius: number, height: number): Solid;
    static makeSolidFromCylinderAxis2Angle(axis: gp_Ax2, radius: number, height: number, angle: number): Solid;
    static makeSolidFromCylinder(radius: number, height: number, center: gp_Pnt, direction: Vector, angle?: number): Solid;

    // 基本几何体创建方法 - 圆锥
    static makeSolidFromCone(radius1: number, radius2: number, height: number, center: gp_Pnt, direction: Vector, angle?: number): Solid;
    static makeSolidFromConeAngle(radius1: number, radius2: number, height: number, angle?: number): Solid;
    static makeSolidFromConeAxis2(axis: gp_Ax2, radius1: number, radius2: number, height: number): Solid;
    static makeSolidFromConeAxis2Angle(axis: gp_Ax2, radius1: number, radius2: number, height: number, angle: number): Solid;


    // 旋转体创建方法
    static makeSolidFromRevolution(curve: Handle_Geom_Curve): Solid;
    static makeSolidFromRevolutionAngle(curve: Handle_Geom_Curve, angle: number): Solid;
    static makeSolidFromRevolutionLimit(curve: Handle_Geom_Curve, angle1: number, angle2: number): Solid;
    static makeSolidFromRevolutionLimitAngle(curve: Handle_Geom_Curve, angle1: number, angle2: number, angle3: number): Solid;
    static makeSolidFromRevolutionAxis2(axis: gp_Ax2, curve: Handle_Geom_Curve): Solid;
    static makeSolidFromRevolutionAxis2Angle(axis: gp_Ax2, curve: Handle_Geom_Curve, angle: number): Solid;
    static makeSolidFromRevolutionAxis2Limit(axis: gp_Ax2, curve: Handle_Geom_Curve, angle1: number, angle2: number): Solid;
    static makeSolidFromRevolutionAxis2LimitAngle(axis: gp_Ax2, curve: Handle_Geom_Curve, angle1: number, angle2: number, angle3: number): Solid;

    // 球体创建方法
    static makeSolidFromSphere(radius: number): Solid;
    static makeSolidFromSphere(radius: number, angle: number): Solid;
    static makeSolidFromSphere(radius: number, angle1: number, angle2: number): Solid;
    static makeSolidFromSphere(radius: number, angle1: number, angle2: number, angle3: number): Solid;
    static makeSolidFromSphere(center: gp_Pnt, radius: number): Solid;
    static makeSolidFromSphere(center: gp_Pnt, radius: number, angle: number): Solid;
    static makeSolidFromSphere(center: gp_Pnt, radius: number, angle1: number, angle2: number): Solid;
    static makeSolidFromSphere(center: gp_Pnt, radius: number, angle1: number, angle2: number, angle3: number): Solid;
    static makeSolidFromSphere(axis: gp_Ax2, radius: number): Solid;
    static makeSolidFromSphere(axis: gp_Ax2, radius: number, angle: number): Solid;
    static makeSolidFromSphere(axis: gp_Ax2, radius: number, angle1: number, angle2: number): Solid;
    static makeSolidFromSphere(axis: gp_Ax2, radius: number, angle1: number, angle2: number, angle3: number): Solid;

    // 圆环体创建方法
    static makeSolidFromTorus(majorRadius: number, minorRadius: number): Solid;
    static makeSolidFromTorus(majorRadius: number, minorRadius: number, angle: number): Solid;
    static makeSolidFromTorus(majorRadius: number, minorRadius: number, angle1: number, angle2: number): Solid;
    static makeSolidFromTorus(majorRadius: number, minorRadius: number, angle1: number, angle2: number, angle3: number): Solid;
    static makeSolidFromTorus(axis: gp_Ax2, majorRadius: number, minorRadius: number): Solid;
    static makeSolidFromTorus(axis: gp_Ax2, majorRadius: number, minorRadius: number, angle: number): Solid;
    static makeSolidFromTorus(axis: gp_Ax2, majorRadius: number, minorRadius: number, angle1: number, angle2: number): Solid;

    // 楔形体创建方法
    static makeSolidFromWedge(width: number, height: number, depth: number, taper: number): Solid;
    static makeSolidFromWedge(axis: gp_Ax2, width: number, height: number, depth: number, taper: number): Solid;
    static makeSolidFromWedge(width: number, height: number, depth: number, xTaper: number, yTaper: number, zTaper: number, offset: number): Solid;
    static makeSolidFromWedge(axis: gp_Ax2, width: number, height: number, depth: number, xTaper: number, yTaper: number, zTaper: number, offset: number): Solid;

    // 放样创建方法
    static makeSolidFromLoft(wires: Wire[], ruled?: boolean): Solid;

    // 外壳访问方法
    outerShell(): Shell;
    innerShells(): Shell[];

    // 几何操作方法
    extrudeWithRotationFromWire(wire: Wire, innerWires: Wire[], center: gp_Pnt, normal: Vector, angleDegrees: number): Solid;
    extrudeWithRotationFromFace(face: Face, center: gp_Pnt, normal: Vector, angleDegrees: number): Solid;
    extrudeFromWire(wire: Wire, innerWires: Wire[], direction: Vector, taper?: number): Solid;
    extrudeFromFacePoint(face: Face, p1: gp_Pnt, p2: gp_Pnt): Solid;
    extrudeFromFaceVector(face: Face, direction: Vector, taper?: number): Solid;
    revolveFromFacePoint(face: Face, p1: gp_Pnt, p2: gp_Pnt, angle: number): Solid;
    revolveFromWire(wire: Wire, innerWires: Wire[], angleDegrees: number, axisStart: gp_Pnt, axisEnd: gp_Pnt): Solid;
    revolveFromFaceAnglePoint(face: Face, angleDegrees: number, axisStart: gp_Pnt, axisEnd: gp_Pnt): Solid;
    loft(profiles: Shape[], ruled?: boolean, tolerance?: number): Solid;
    pipe(face: Face, wire: Wire): Solid;

    sweepCompound(spine: Wire, profiles: { profile: Shape, index: number }[], cornerMode: number): Solid;
    sweep(spine: Wire, profiles: Shape[], cornerMode: number): Solid;
    sweepWire(outerWire: Wire, innerWires: Wire[], path: TopoDS_Shape, makeSolid?: boolean, isFrenet?: boolean,
        mode?: gp_Vec | TopoDS_Wire | TopoDS_Edge, transitionMode?: string): Solid;
    sweepFace(face: Face, path: TopoDS_Shape, makeSolid?: boolean, isFrenet?: boolean,
        mode?: gp_Vec | TopoDS_Wire | TopoDS_Edge, transitionMode?: string): Solid;
    sweepMulti(profiles: Array<Wire | Face>, path: TopoDS_Shape, makeSolid?: boolean,
        isFrenet?: boolean, mode?: gp_Vec | TopoDS_Wire | TopoDS_Edge): Solid;

    // 布尔运算和特征操作
    split(splitters: Shape[]): Solid;
    fillet(edges: Edge[], radius: number[]): Solid;
    chamfer(edges: Edge[], distances: number[]): Solid;
    shelling(faces: Face[], offset: number, tolerance?: number): Solid;
    offset(face: Face, offset: number, tolerance?: number): Solid;
    draft(faces: Face[], direction: Vector, angle: number, plane: gp_Pln): Solid;
    evolved(spine: Face, profile: Wire): Solid;
    evolved(spine: Wire, profile: Wire): Solid;

    // 特征操作
    featPrism(face: Face, direction: Vector, height: number, fuse?: boolean): Solid;
    featPrismForRange(face: Face, direction: Vector, from: Face, end: Face, fuse?: boolean): Solid;
    featPrismForUntil(face: Face, direction: Vector, until: Face, fuse?: boolean): Solid;
    featDraftPrism(face: Face, angle: number, height: number, fuse?: boolean): Solid;
    featDraftPrismForRange(face: Face, angle: number, from: Face, end: Face, fuse?: boolean): Solid;
    featDraftPrismForUntil(face: Face, angle: number, until: Face, fuse?: boolean): Solid;
    featRevolForRange(face: Face, axis: gp_Ax1, from: Face, end: Face, fuse?: boolean): Solid;
    featRevolForUntil(face: Face, axis: gp_Ax1, until: Face, fuse?: boolean): Solid;
    featPipeForRange(face: Face, spine: Wire, from: Face, end: Face, fuse?: boolean): Solid;
    featPipeForUntil(face: Face, spine: Wire, until: Face, fuse?: boolean): Solid;

    // 线性形式和旋转形式
    linearForm(wire: Wire, plane: Handle_Geom_Plane, direction: Vector, direction1: Vector, fuse?: boolean): Solid;
    revolutionForm(wire: Wire, plane: Handle_Geom_Plane, axis: gp_Ax1, h1: number, h2: number, fuse?: boolean): Solid;

    // 布尔运算方法
    boolean(tool: Solid, op: BooleanOperationType): Solid;

    // 几何属性方法
    volume(): number;
    centerOfMass(): gp_Pnt;
    boundingBox(): BBox;

    // 截面和转换方法
    section(point: gp_Pnt, normal: gp_Pnt): Face | null;
    convertToNurbs(): Solid;

    // 值访问方法
    value(): TopoDS_Solid;
    type(): GeometryObjectType;
    copy(deep?: boolean): Shape;
}

export declare class SolidIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): Solid | null;
    delete(): void;
}

export declare class Compound extends Shape3D {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 基础创建方法
    static makeCompound(shapes: Shape[]): Compound;

    // 布尔运算方法
    cut(toCut: Shape[], tol?: number): Compound;
    fuse(toFuse: Shape[], glue?: boolean, tol?: number): Compound;
    intersect(toIntersect: Shape[], tol?: number): Compound;

    // 几何操作方法
    remove(shape: Shape): Compound;

    // 值访问和类型方法
    value(): TopoDS_Compound;
    type(): GeometryObjectType;
    copy(deep?: boolean): Shape;
}

export declare class CompoundIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): Compound | null;
    delete(): void;
}

export declare class CompSolid extends Solid {
    constructor();
    constructor(shape: TopoDS_Shape, forConstruction?: boolean);

    // 基础创建方法
    static makeCompSolid(solids: Solid[]): CompSolid;

    // 值访问方法
    value(): TopoDS_CompSolid;

    // 类型方法
    type(): GeometryObjectType;
    copy(deep?: boolean): Shape;
}

export declare class CompSolidIterator {
    constructor(shape: Shape);
    reset(): void;
    next(): CompSolid | null;
    delete(): void;
}

export declare class Mesh {
    constructor(args?: TopoDS_Shape | Shape | Handle_TDocStd_Document);

    // 形状映射方法
    mapShapes(): void;
    mapShape(shape: TopoDS_Shape | Shape | Shape[]): void;

    // 三角化方法
    triangulation(deflection?: number, tolerance?: number): MeshData | null;

    delete(): void;
}

export declare class Selector {
    constructor();
    filter(): Shape[];
    delete(): void;
}

export declare class CustomSelector extends Selector {
    constructor(callback: (shapes: Shape[]) => Shape[]);
}

export declare class NearestToPointSelector extends Selector {
    constructor(vector: Vector);
}

export declare class BoxSelector extends Selector {
    constructor(min: Vector, max: Vector, includeEdges?: boolean);
}

export declare class TypeSelector extends Selector {
    constructor(type: GeometryObjectType);
}

export declare class DirectionSelector extends Selector {
    constructor(direction: Vector, tolerance?: number);
}

export declare class ParallelDirSelector extends DirectionSelector {
    constructor(direction: Vector, tolerance?: number);
}

export declare class DirSelector extends DirectionSelector {
    constructor(direction: Vector, tolerance?: number);
}

export declare class PerpendicularDirSelector extends DirectionSelector {
    constructor(direction: Vector, tolerance?: number);
}

export declare class NthSelector extends Selector {
    constructor(n: number, reverse?: boolean, tolerance?: number);
}

export declare class RadiusNthSelector extends NthSelector {
    constructor(n: number, reverse?: boolean, tolerance?: number);
}

export declare class CenterNthSelector extends NthSelector {
    constructor(center: Vector, n: number, reverse?: boolean, tolerance?: number);
}

export declare class DirectionMinmaxSelector extends CenterNthSelector {
    constructor(direction: Vector, reverse?: boolean, tolerance?: number);
}

export declare class DirectionNthSelector extends Selector {
    constructor(direction: Vector, n: number, reverse?: boolean, tolerance?: number);
}

export declare class LengthNthSelector extends NthSelector {
    constructor(n: number, reverse?: boolean, tolerance?: number);
}

export declare class AreaNthSelector extends NthSelector {
    constructor(n: number, reverse?: boolean, tolerance?: number);
}

export declare class BinarySelector extends Selector {
    constructor(selector1: Selector, selector2: Selector);
}

export declare class AndSelector extends BinarySelector {
    constructor(selector1: Selector, selector2: Selector);
}

export declare class OrSelector extends BinarySelector {
    constructor(selector1: Selector, selector2: Selector);
}

export declare class SubtractSelector extends BinarySelector {
    constructor(selector1: Selector, selector2: Selector);
}

export declare class NotSelector extends Selector {
    constructor(selector: Selector);
}

export declare class StringSyntaxSelector extends Selector {
    constructor(syntax: string);
}

export declare enum IntersectionDirection {
    None = 0,
    AlongAxis = 1,
    Opposite = 2
}

export declare enum TransitionMode {
    TRANSFORMED = 0,
    ROUND = 1,
    RIGHT = 2
}

export declare interface ShapeCheckResult {
    shapes: Shape[];
    status: BOPAlgo_CheckStatus;
}

export declare interface ShapeCheckStatus {
    isValid: boolean;
    results: ShapeCheckResult[];
}

export declare interface WireSamplePoint {
    position: gp_Pnt;
    tangent: gp_Vec;
    edge: Edge;
}

export declare interface ProfileProjection {
    axes: gp_Ax2;
    trsf: gp_Trsf;
    tangent: gp_Vec;
    position: gp_Pnt;
}

export declare interface ImprintResult {
    result?: Shape;
    history: Record<string, Shape>;
}

export declare class ShapeOps {
    // 布尔运算
    static fuse(shapes: Shape[], tol?: number, glue?: boolean): Shape | undefined;
    static cut(shape: Shape, tool: Shape, tol?: number, glue?: boolean): Shape | undefined;
    static cutMulti(shape: Shape, toCuts: Shape[], tol?: number, glue?: boolean): Shape | undefined;
    static intersect(shape: Shape, toIntersect: Shape, tol?: number, glue?: boolean): Shape | undefined;
    static intersectMulti(shape: Shape, toIntersects: Shape[], tol?: number, glue?: boolean): Shape | undefined;

    // 分割操作
    static splitMulti(shape: Shape, tools: Shape[], tolerance?: number): Shape | undefined;
    static split(shape: Shape, tool: Shape, tolerance?: number): Shape | undefined;

    // 相交操作
    static facesIntersectedByLine(shape: Shape,
        point: gp_Pnt,
        axis: gp_Dir,
        tolerance?: number,
        direction?: IntersectionDirection): Face[];

    // 填充和壳操作
    static fill(shape: Shape, constraints?: Shape[]): Shape | undefined;

    static shelling(
        shape: Shape,
        faceList: Face[],
        thickness: number,
        tolerance?: number,
        joinType?: GeomAbs_JoinType
    ): Shape | undefined;

    static fillet(
        shape: Shape,
        edges: Edge[],
        radius: number
    ): Shape | undefined;

    static chamfer(
        baseShape: Shape,
        edges: Edge[],
        distance: number,
        distance2?: number
    ): Shape | undefined;

    static extrude(shape: Shape, direction: gp_Vec): Shape | undefined;

    static extrudeLinearWithWire(
        outerWire: Wire,
        innerWires: Wire[],
        vecNormal: gp_Vec,
        taper?: number
    ): Shape | undefined;

    static extrudeLinearWithFace(
        face: Face,
        vecNormal: gp_Vec,
        taper?: number
    ): Shape | undefined;

    static extrudeLinearWithRotationWithWire(
        outerWire: Wire,
        innerWires: Wire[],
        center: gp_Pnt,
        normal: gp_Vec,
        angleDegrees: number
    ): Shape | undefined;

    static extrudeLinearWithRotationWithFace(
        face: Face,
        center: gp_Pnt,
        normal: gp_Vec,
        angleDegrees: number
    ): Shape | undefined;

    // 旋转操作
    static revolve(
        shape: Shape,
        axisPoint: gp_Pnt,
        axisDirection: gp_Vec,
        angleDegrees?: number
    ): Shape | undefined;

    static revolveWithFace(
        outerWire: Wire,
        innerWires: Wire[],
        angleDegrees: number,
        axisStart: gp_Pnt,
        axisEnd: gp_Pnt
    ): Shape | undefined;

    static revolveWithFace(
        face: Face,
        angleDegrees: number,
        axisStart: gp_Pnt,
        axisEnd: gp_Pnt
    ): Shape | undefined;

    static offset(
        shape: Shape,
        offset: number,
        cap?: boolean,
        both?: boolean,
        tol?: number
    ): Shape | undefined;

    // 扫描操作
    static sweepWithWire(
        outerWire: Wire,
        innerWires: Wire[],
        path: Shape,
        makeSolid?: boolean,
        isFrenet?: boolean,
        mode?: Shape,
        transitionMode?: TransitionMode
    ): Shape | undefined;

    static sweepWithFace(
        face: Face,
        path: Shape,
        makeSolid?: boolean,
        isFrenet?: boolean,
        mode?: Shape,
        transitionMode?: TransitionMode
    ): Shape | undefined;

    static sweep_multi(
        profiles: Shape[],
        path: Shape,
        makeSolid?: boolean,
        isFrenet?: boolean,
        mode?: Shape
    ): Shape | undefined;

    static loft(
        profiles: Shape[],
        cap?: boolean,
        ruled?: boolean,
        continuity?: string,
        parametrization?: string,
        degree?: number,
        compat?: boolean,
        smoothing?: boolean,
        weights?: [number, number, number]
    ): Shape | undefined;

    static loftWithFaces(
        faceProfiles: Face[],
        continuity?: string
    ): Shape | undefined;

    // 棱柱操作
    static dprism(
        shp: Shape,
        basis: Face,
        profiles: Wire[],
        depth?: number,
        taper?: number,
        upToFace?: Face,
        thruAll?: boolean,
        additive?: boolean
    ): Shape | undefined;

    static dprismWithFaces(
        shp: Shape,
        basis: Face,
        faces: Face[],
        depth?: number,
        taper?: number,
        upToFace?: Face,
        thruAll?: boolean,
        additive?: boolean
    ): Shape | undefined;

    static imprint(
        shapes: Shape[],
        tol?: number,
        glue?: boolean
    ): ImprintResult;

    static clean(shape: Shape): Shape | undefined;

    static check(
        shp: Shape,
        tol?: number
    ): ShapeCheckStatus;
    static closest(shape1: Shape, shape2: Shape): [gp_Pnt, gp_Pnt];
    static combinedCenter(shapes: Shape[]): gp_Pnt;
    static combinedCenterOfBoundBox(shapes: Shape[]): gp_Pnt;
    static readShapeFromStep(filename: string): Shape

    // 线框操作
    static sampleWireAtDistances(wire: Wire, distances: number[]): WireSamplePoint[];
    static clipWireBetweenDistances(wire: Wire, start: number, end: number): Wire;
    static calcProfileProjection(wire: Wire, upDir: gp_Dir, offset?: number): ProfileProjection;
    static profileProjectPoint(profile: ProfileProjection, point: gp_Pnt): gp_Pnt;
    static wireLength(wire: Wire): number;
}