// 球体参数结构体
export declare interface SphereParams {
    radius: number;
}

// 几何体创建函数
export declare function createSphere(params: SphereParams): TopoDS_Shape;
export declare function createSphereWithCenter(params: SphereParams, center: gp_Pnt): TopoDS_Shape;

// 旋转椭球体参数结构体
export declare interface RotationalEllipsoidParams {
    polarRadius: number;
    equatorialRadius: number;
    height: number;
}

export declare function createRotationalEllipsoid(params: RotationalEllipsoidParams): TopoDS_Shape;
export declare function createRotationalEllipsoidWithCenter(
    params: RotationalEllipsoidParams,
    center: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 长方体参数结构体
export declare interface CuboidParams {
    length: number;
    width: number;
    height: number;
}

export declare function createCuboid(params: CuboidParams): TopoDS_Shape;
export declare function createCuboidWithCenter(
    params: CuboidParams,
    center: gp_Pnt,
    xDir: gp_Dir,
    yDir: gp_Dir
): TopoDS_Shape;

// 菱形台参数结构体
export declare interface DiamondFrustumParams {
    topDiag1: number;
    topDiag2: number;
    bottomDiag1: number;
    bottomDiag2: number;
    height: number;
}

export declare function createDiamondFrustum(params: DiamondFrustumParams): TopoDS_Shape;
export declare function createDiamondFrustumWithPosition(
    params: DiamondFrustumParams,
    position: gp_Pnt,
    xDir: gp_Dir,
    yDir: gp_Dir
): TopoDS_Shape;

// 偏移矩形台参数结构体
export declare interface OffsetRectangularTableParams {
    topLength: number;
    topWidth: number;
    bottomLength: number;
    bottomWidth: number;
    height: number;
    xOffset: number;
    yOffset: number;
}

// 几何体创建函数
export declare function createOffsetRectangularTable(params: OffsetRectangularTableParams): TopoDS_Shape;
export declare function createOffsetRectangularTableWithPosition(
    params: OffsetRectangularTableParams,
    position: gp_Pnt,
    xDir: gp_Dir,
    yDir: gp_Dir
): TopoDS_Shape;

// 圆柱参数结构体
export declare interface CylinderParams {
    radius: number;
    height: number;
}

export declare function createCylinder(params: CylinderParams): TopoDS_Shape;
export declare function createCylinderWithBase(
    params: CylinderParams,
    baseCenter: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 弯折圆柱参数结构体
export declare interface SharpBentCylinderParams {
    radius: number;
    length: number;
    bendAngle: number;
}

export declare function createSharpBentCylinder(params: SharpBentCylinderParams): TopoDS_Shape;
export declare function createSharpBentCylinderWithBendPoint(
    params: SharpBentCylinderParams,
    bendPoint: gp_Pnt,
    startDir: gp_Dir,
    endDir: gp_Dir
): TopoDS_Shape;

// 截锥参数结构体
export declare interface TruncatedConeParams {
    topRadius: number;
    bottomRadius: number;
    height: number;
}

export declare function createTruncatedCone(params: TruncatedConeParams): TopoDS_Shape;
export declare function createTruncatedConeWithBase(
    params: TruncatedConeParams,
    baseCenter: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 偏心截锥参数结构体
export declare interface EccentricTruncatedConeParams {
    topRadius: number;
    bottomRadius: number;
    height: number;
    topXOffset: number;
    topYOffset: number;
}

export declare function createEccentricTruncatedCone(params: EccentricTruncatedConeParams): TopoDS_Shape;
export declare function createEccentricTruncatedConeWithBase(
    params: EccentricTruncatedConeParams,
    baseCenter: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 环形参数结构体
export declare interface RingParams {
    ringRadius: number;
    tubeRadius: number;
    angle: number;
}

// 几何体创建函数
export declare function createRing(params: RingParams): TopoDS_Shape;
export declare function createRingWithCenter(
    params: RingParams,
    center: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 矩形环参数结构体
export declare interface RectangularRingParams {
    tubeRadius: number;
    filletRadius: number;
    length: number;
    width: number;
}

export declare function createRectangularRing(params: RectangularRingParams): TopoDS_Shape;
export declare function createRectangularRingWithCenter(
    params: RectangularRingParams,
    center: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 椭圆环参数结构体
export declare interface EllipticRingParams {
    tubeRadius: number;
    majorRadius: number;
    minorRadius: number;
}

export declare function createEllipticRing(params: EllipticRingParams): TopoDS_Shape;
export declare function createEllipticRingWithCenter(
    params: EllipticRingParams,
    center: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 圆形垫片参数结构体
export declare interface CircularGasketParams {
    outerRadius: number;
    innerRadius: number;
    height: number;
    angle: number;
}

export declare function createCircularGasket(params: CircularGasketParams): TopoDS_Shape;
export declare function createCircularGasketWithCenter(
    params: CircularGasketParams,
    center: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 台形垫片参数结构体
export declare interface TableGasketParams {
    topRadius: number;
    outerRadius: number;
    innerRadius: number;
    height: number;
    angle: number;
}

// 几何体创建函数
export declare function createTableGasket(params: TableGasketParams): TopoDS_Shape;
export declare function createTableGasketWithCenter(
    params: TableGasketParams,
    center: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 方形垫片参数结构体
export declare interface SquareGasketParams {
    outerLength: number;
    outerWidth: number;
    innerLength: number;
    innerWidth: number;
    height: number;
    cornerType: number;
    cornerParam: number;
}


export declare function createSquareGasket(params: SquareGasketParams): TopoDS_Shape;
export declare function createSquareGasketWithCenter(
    params: SquareGasketParams,
    center: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 拉伸体参数结构体
export declare interface StretchedBodyParams {
    points: gp_Pnt[];
    normal: gp_Dir;
    length: number;
}

export declare function createStretchedBody(params: StretchedBodyParams): TopoDS_Shape;
export declare function createStretchedBodyWithBase(
    params: StretchedBodyParams,
    baseCenter: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 瓷套绝缘子参数结构体
export declare interface PorcelainBushingParams {
    height: number;
    radius: number;
    bigSkirtRadius: number;
    smallSkirtRadius: number;
    count: number;
}

export declare function createPorcelainBushing(params: PorcelainBushingParams): TopoDS_Shape;
export declare function createPorcelainBushingWithBase(
    params: PorcelainBushingParams,
    baseCenter: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 锥形瓷套绝缘子参数结构体
export declare interface ConePorcelainBushingParams {
    height: number;
    bottomRadius: number;
    topRadius: number;
    bottomSkirtRadius1: number;
    bottomSkirtRadius2: number;
    topSkirtRadius1: number;
    topSkirtRadius2: number;
    count: number;
}

export declare function createConePorcelainBushing(params: ConePorcelainBushingParams): TopoDS_Shape;
export declare function createConePorcelainBushingWithBase(
    params: ConePorcelainBushingParams,
    baseCenter: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 绝缘子串参数结构体
export declare interface InsulatorStringParams {
    count: number;
    spacing: number;
    insulatorCount: number;
    height: number;
    bigSkirtRadius: number;
    smallSkirtRadius: number;
    radius: number;
    frontLength: number;
    backLength: number;
    splitCount: number;
}

// 几何体创建函数
export declare function createInsulatorString(params: InsulatorStringParams): TopoDS_Shape;
export declare function createInsulatorStringWithPosition(
    params: InsulatorStringParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// V型绝缘子参数结构体
export declare interface VTypeInsulatorParams {
    frontSpacing: number;
    backSpacing: number;
    insulatorCount: number;
    height: number;
    radius: number;
    bigSkirtRadius: number;
    smallSkirtRadius: number;
    frontLength: number;
    backLength: number;
    splitCount: number;
}

export declare function createVTypeInsulator(params: VTypeInsulatorParams): TopoDS_Shape;
export declare function createVTypeInsulatorWithPosition(
    params: VTypeInsulatorParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 端子排参数结构体
export declare interface TerminalBlockParams {
    length: number;
    width: number;
    thickness: number;
    chamferLength: number;
    columnSpacing: number;
    rowSpacing: number;
    holeRadius: number;
    columnCount: number;
    rowCount: number;
    bottomOffset: number;
}

export declare function createTerminalBlock(params: TerminalBlockParams): TopoDS_Shape;
export declare function createTerminalBlockWithPosition(
    params: TerminalBlockParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 矩形开孔板参数结构体
export declare interface RectangularHolePlateParams {
    length: number;
    width: number;
    thickness: number;
    columnSpacing: number;
    rowSpacing: number;
    columnCount: number;
    rowCount: number;
    hasMiddleHole: boolean;
    holeDiameter: number;
}

export declare function createRectangularFixedPlate(params: RectangularHolePlateParams): TopoDS_Shape;
export declare function createRectangularFixedPlateWithPosition(
    params: RectangularHolePlateParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 圆形开孔板参数结构体
export declare interface CircularFixedPlateParams {
    length: number;
    width: number;
    thickness: number;
    ringRadius: number;
    holeCount: number;
    hasMiddleHole: boolean;
    holeDiameter: number;
}

export declare function createCircularFixedPlate(params: CircularFixedPlateParams): TopoDS_Shape;
export declare function createCircularFixedPlateWithPosition(
    params: CircularFixedPlateParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 导线参数结构体
export declare interface WireParams {
    startPoint: gp_Pnt;
    endPoint: gp_Pnt;
    startDir: gp_Dir;
    endDir: gp_Dir;
    sag: number;
    diameter: number;
    fitPoints: gp_Pnt[];
}

// 几何体创建函数
export declare function createWire(params: WireParams): TopoDS_Shape;
export declare function createWireWithPosition(
    params: WireParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 电缆参数结构体
export declare interface CableParams {
    startPoint: gp_Pnt;
    endPoint: gp_Pnt;
    inflectionPoints: gp_Pnt[];
    radii: number[];
    diameter: number;
}

export declare function createCable(params: CableParams): TopoDS_Shape;
export declare function createCableWithPosition(
    params: CableParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 曲线类型枚举
export declare type CurveType = {
    LINE: {},
    ARC: {},
    SPLINE: {}
}

// 曲线电缆参数结构体
export declare interface CurveCableParams {
    controlPoints: gp_Pnt[][];
    curveTypes: CurveType[];
    diameter: number;
}

export declare function createCurveCable(params: CurveCableParams): TopoDS_Shape;
export declare function createCurveCableWithPosition(
    params: CurveCableParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 角钢参数结构体
export declare interface AngleSteelParams {
    L1: number;
    L2: number;
    X: number;
    length: number;
}

export declare function createAngleSteel(params: AngleSteelParams): TopoDS_Shape;
export declare function createAngleSteelWithPosition(
    params: AngleSteelParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 工字钢参数结构体
export declare interface IShapedSteelParams {
    height: number;
    flangeWidth: number;
    webThickness: number;
    flangeThickness: number;
    length: number;
}

// 几何体创建函数
export declare function createIShapedSteel(params: IShapedSteelParams): TopoDS_Shape;
export declare function createIShapedSteelWithPosition(
    params: IShapedSteelParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;


// 槽钢参数结构体
export declare interface ChannelSteelParams {
    height: number;
    flangeWidth: number;
    webThickness: number;
    flangeThickness: number;
    length: number;
}


export declare function createChannelSteel(params: ChannelSteelParams): TopoDS_Shape;
export declare function createChannelSteelWithPosition(
    params: ChannelSteelParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// T型钢参数结构体
export declare interface TSteelParams {
    height: number;
    width: number;
    webThickness: number;
    flangeThickness: number;
    length: number;
}

export declare function createTSteel(params: TSteelParams): TopoDS_Shape;
export declare function createTSteelWithPosition(
    params: TSteelParams,
    position: gp_Pnt,
    normal: gp_Dir,
    xDir: gp_Dir
): TopoDS_Shape;

// 钻孔桩参数结构体
export declare interface BoredPileParams {
    H1: number;
    H2: number;
    H3: number;
    H4: number;
    d: number;
    D: number;
}

export declare function createBoredPileBase(params: BoredPileParams): TopoDS_Shape;
export declare function createBoredPileBaseWithPosition(
    params: BoredPileParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 桩承台参数结构体
export declare interface PileCapParams {
    H1: number;
    H2: number;
    H3: number;
    H4: number;
    H5: number;
    H6: number;
    d: number;
    D: number;
    b: number;
    B1: number;
    L1: number;
    e1: number;
    e2: number;
    cs: number;
    ZCOUNT: number;
    ZPOSTARRAY: gp_Pnt[];
}

// 几何体创建函数
export declare function createPileCapBase(params: PileCapParams): TopoDS_Shape;
export declare function createPileCapBaseWithPosition(
    params: PileCapParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 岩石锚杆参数结构体
export declare interface RockAnchorParams {
    H1: number;
    H2: number;
    d: number;
    B1: number;
    L1: number;
    ZCOUNT: number;
    ZPOSTARRAY: gp_Pnt[];
}

export declare function createRockAnchorBase(params: RockAnchorParams): TopoDS_Shape;
export declare function createRockAnchorBaseWithPosition(
    params: RockAnchorParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 岩石桩承台参数结构体
export declare interface RockPileCapParams {
    H1: number;
    H2: number;
    H3: number;
    d: number;
    b: number;
    B1: number;
    L1: number;
    e1: number;
    e2: number;
    cs: number;
    ZCOUNT: number;
    ZPOSTARRAY: gp_Pnt[];
}

export declare function createRockPileCapBase(params: RockPileCapParams): TopoDS_Shape;
export declare function createRockPileCapBaseWithPosition(
    params: RockPileCapParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 嵌入式岩石锚杆参数结构体
export declare interface EmbeddedRockAnchorParams {
    H1: number;
    H2: number;
    H3: number;
    d: number;
    D: number;
}

export declare function createEmbeddedRockAnchorBase(params: EmbeddedRockAnchorParams): TopoDS_Shape;
export declare function createEmbeddedRockAnchorBaseWithPosition(
    params: EmbeddedRockAnchorParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 倾斜岩石锚杆基础参数结构体
export declare interface InclinedRockAnchorParams {
    H1: number;
    H2: number;
    d: number;
    D: number;
    B: number;
    L: number;
    e1: number;
    e2: number;
    alpha1: number;
    alpha2: number;
}

// 几何体创建函数
export declare function createInclinedRockAnchorBase(params: InclinedRockAnchorParams): TopoDS_Shape;
export declare function createInclinedRockAnchorBaseWithPosition(
    params: InclinedRockAnchorParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 开挖式基础参数结构体
export declare interface ExcavatedBaseParams {
    H1: number;
    H2: number;
    H3: number;
    d: number;
    D: number;
    alpha1: number;
    alpha2: number;
}

export declare function createExcavatedBase(params: ExcavatedBaseParams): TopoDS_Shape;
export declare function createExcavatedBaseWithPosition(
    params: ExcavatedBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 阶梯式基础参数结构体
export declare interface StepBaseParams {
    H: number;
    H1: number;
    H2: number;
    H3: number;
    b: number;
    B1: number;
    B2: number;
    B3: number;
    L1: number;
    L2: number;
    L3: number;
    N: number;
}

export declare function createStepBase(params: StepBaseParams): TopoDS_Shape;
export declare function createStepBaseWithPosition(
    params: StepBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 阶梯板式基础参数结构体
export declare interface StepPlateBaseParams {
    H: number;
    H1: number;
    H2: number;
    H3: number;
    b: number;
    L1: number;
    L2: number;
    B1: number;
    B2: number;
    alpha1: number;
    alpha2: number;
    N: number;
}

export declare function createStepPlateBase(params: StepPlateBaseParams): TopoDS_Shape;
export declare function createStepPlateBaseWithPosition(
    params: StepPlateBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;


// 斜坡式基础参数结构体
export declare interface SlopedBaseBaseParams {
    H1: number;
    H2: number;
    H3: number;
    b: number;
    L1: number;
    L2: number;
    B1: number;
    B2: number;
    alpha1: number;
    alpha2: number;
}

// 几何体创建函数
export declare function createSlopedBaseBase(params: SlopedBaseBaseParams): TopoDS_Shape;
export declare function createSlopedBaseBaseWithPosition(
    params: SlopedBaseBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 复合沉井基础参数结构体
export declare interface CompositeCaissonBaseParams {
    H1: number;
    H2: number;
    H3: number;
    H4: number;
    b: number;
    D: number;
    t: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
}

export declare function createCompositeCaissonBase(params: CompositeCaissonBaseParams): TopoDS_Shape;
export declare function createCompositeCaissonBaseWithPosition(
    params: CompositeCaissonBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 筏板基础参数结构体
export declare interface RaftBaseParams {
    H1: number;
    H2: number;
    H3: number;
    b1: number;
    b2: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
}

export declare function createRaftBase(params: RaftBaseParams): TopoDS_Shape;
export declare function createRaftBaseWithPosition(
    params: RaftBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 直埋基础参数结构体
export declare interface DirectBuriedBaseParams {
    H1: number;
    H2: number;
    d: number;
    D: number;
    B: number;
    t: number;
}

export declare function createDirectBuriedBase(params: DirectBuriedBaseParams): TopoDS_Shape;
export declare function createDirectBuriedBaseWithPosition(
    params: DirectBuriedBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 钢套筒基础参数结构体
export declare interface SteelSleeveBaseParams {
    H1: number;
    H2: number;
    H3: number;
    H4: number;
    d: number;
    D1: number;
    D2: number;
    t: number;
    B1: number;
    B2: number;
}

export declare function createSteelSleeveBase(params: SteelSleeureBaseParams): TopoDS_Shape;
export declare function createSteelSleeveBaseWithPosition(
    params: SteelSleeureBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;


// 预制柱基础参数结构体
export declare interface PrecastColumnBaseParams {
    H1: number;
    H2: number;
    H3: number;
    d: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
}

// 几何体创建函数
export declare function createPrecastColumnBase(params: PrecastColumnBaseParams): TopoDS_Shape;
export declare function createPrecastColumnBaseWithPosition(
    params: PrecastColumnBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 预制插接基础参数结构体
export declare interface PrecastPinnedBaseParams {
    H1: number;
    H2: number;
    H3: number;
    d: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
    B: number;
    H: number;
    L: number;
}

export declare function createPrecastPinnedBase(params: PrecastPinnedBaseParams): TopoDS_Shape;
export declare function createPrecastPinnedBaseWithPosition(
    params: PrecastPinnedBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 预制金属支撑基础参数结构体
export declare interface PrecastMetalSupportBaseParams {
    H1: number;
    H2: number;
    H3: number;
    H4: number;
    b1: number;
    b2: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
    S1: number;
    S2: number;
    n1: number;
    n2: number;
    HX: number[];
}

export declare function createPrecastMetalSupportBase(params: PrecastMetalSupportBaseParams): TopoDS_Shape;
export declare function createPrecastMetalSupportBaseWithPosition(
    params: PrecastMetalSupportBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 预制混凝土支撑基础参数结构体
export declare interface PrecastConcreteSupportBaseParams {
    H1: number;
    H2: number;
    H3: number;
    H4: number;
    H5: number;
    b1: number;
    b2: number;
    b3: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
    S1: number;
    n1: number;
}

export declare function createPrecastConcreteSupportBase(params: PrecastConcreteSupportBaseParams): TopoDS_Shape;
export declare function createPrecastConcreteSupportBaseWithPosition(
    params: PrecastConcreteSupportBaseParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 输电线路参数结构体
export declare interface TransmissionLineParams {
    type: string;
    sectionalArea: number;
    outsideDiameter: number;
    wireWeight: number;
    coefficientOfElasticity: number;
    expansionCoefficient: number;
    ratedStrength: number;
}

// 几何体创建函数
export declare function createTransmissionLine(
    params: TransmissionLineParams,
    startPoint: gp_Pnt,
    endPoint: gp_Pnt
): TopoDS_Shape;

// 绝缘子材质枚举
export declare type InsulatorMaterial = {
    CERAMIC: {},
    GLASS: {},
    COMPOSITE: {}
}

// 排列方式枚举
export declare type ArrangementType = {
    HORIZONTAL: {},
    VERTICAL: {}
}

// 串用途枚举
export declare type ApplicationType = {
    CONDUCTOR: {},
    GROUND_WIRE: {}
}

// 串类型枚举
export declare type StringType = {
    SUSPENSION: {},
    TENSION: {}
}

// 复合绝缘子参数结构体
export declare interface CompositeInsulatorParams {
    majorRadius: number;
    minorRadius: number;
    gap: number;
}

export declare interface FittingLengths {
    leftUpper: number;
    rightUpper: number;
    leftLower: number;
    rightLower: number;
}

export declare interface MultiLink {
    count: number;
    spacing: number;
    arrangement: ArrangementType;
}

export declare interface Insulator {
    radius: number | CompositeInsulatorParams;
    height: number;
    leftCount: number;
    rightCount: number;
    material: InsulatorMaterial;
}

export declare interface GradingRing {
    count: number;
    position: number;
    height: number;
    radius: number;
}

export declare interface InsulatorParams {
    type: string;
    subNum: number;
    subType: number;
    splitDistance: number;
    vAngleLeft: number;
    vAngleRight: number;
    uLinkLength: number;
    weight: number;
    fittingLengths: FittingLengths;
    multiLink: MultiLink;
    insulator: Insulator;
    gradingRing: GradingRing;
    application: ApplicationType;
    stringType: StringType;
}

export declare function createInsulator(params: InsulatorParams): TopoDS_Shape;
export declare function createInsulatorWithPosition(
    params: InsulatorParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;


// 杆件类型枚举
export declare type MemberType = {
    ANGLE: {},
    TUBE: {},
    TAPERED_TUBE: {}
}

// 挂点类型枚举
export declare type AttachmentType = {
    GROUND_WIRE: {},
    CONDUCTOR: {},
    JUMPER: {}
}

// 杆塔节点结构体
export declare interface PoleTowerNode {
    id: string;
    position: gp_Pnt;
}

// 杆塔杆件结构体
export declare interface PoleTowerMember {
    id: string;
    startNodeId: string;
    endNodeId: string;
    type: MemberType;
    specification: string;
    material: string;
    xDirection: gp_Dir;
    yDirection: gp_Dir;
    end1Diameter: number;
    end2Diameter: number;
    thickness: number;
    sides: number;
}

// 杆塔挂点结构体
export declare interface PoleTowerAttachment {
    name: string;
    type: AttachmentType;
    position: gp_Pnt;
}

// 杆塔接腿结构体
export declare interface PoleTowerLeg {
    id: string;
    commonHeight: number;
    specificHeight: number;
    nodes: PoleTowerNode[];
}

// 杆塔本体结构体
export declare interface PoleTowerBody {
    id: string;
    height: number;
    nodes: PoleTowerNode[];
    legs: PoleTowerLeg[];
}

// 杆塔呼高结构体
export declare interface PoleTowerHeight {
    value: number;
    bodyId: string;
    legId: string;
}

// 杆塔参数结构体
export declare interface PoleTowerParams {
    heights: PoleTowerHeight[];
    bodies: PoleTowerBody[];
    members: PoleTowerMember[];
    attachments: PoleTowerAttachment[];
}

// 杆塔创建函数
export declare function createPoleTower(params: PoleTowerParams): TopoDS_Shape;
export declare function createPoleTowerWithPosition(
    params: PoleTowerParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;


// 单钩锚固参数结构体
export declare interface SingleHookAnchorParams {
    boltDiameter: number;
    exposedLength: number;
    nutCount: number;
    nutHeight: number;
    nutOD: number;
    washerCount: number;
    washerShape: number;
    washerSize: number;
    washerThickness: number;
    anchorLength: number;
    hookStraightLength: number;
    hookDiameter: number;
}

// 几何体创建函数
export declare function createSingleHookAnchor(params: SingleHookAnchorParams): TopoDS_Shape;
export declare function createSingleHookAnchorWithPosition(
    params: SingleHookAnchorParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 三钩锚固参数结构体
export declare interface TripleHookAnchorParams {
    boltDiameter: number;
    exposedLength: number;
    nutCount: number;
    nutHeight: number;
    nutOD: number;
    washerCount: number;
    washerShape: number;
    washerSize: number;
    washerThickness: number;
    anchorLength: number;
    hookStraightLengthA: number;
    hookStraightLengthB: number;
    hookDiameter: number;
    anchorBarDiameter: number;
}

export declare function createTripleHookAnchor(params: TripleHookAnchorParams): TopoDS_Shape;
export declare function createTripleHookAnchorWithPosition(
    params: TripleHookAnchorParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 肋板锚固参数结构体
export declare interface RibbedAnchorParams {
    boltDiameter: number;
    exposedLength: number;
    nutCount: number;
    nutHeight: number;
    nutOD: number;
    washerCount: number;
    washerShape: number;
    washerSize: number;
    washerThickness: number;
    anchorLength: number;
    basePlateSize: number;
    ribTopWidth: number;
    ribBottomWidth: number;
    basePlateThickness: number;
    ribHeight: number;
    ribThickness: number;
}

// 几何体创建函数
export declare function createRibbedAnchor(params: RibbedAnchorParams): TopoDS_Shape;
export declare function createRibbedAnchorWithPosition(
    params: RibbedAnchorParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 螺帽锚固参数结构体
export declare interface NutAnchorParams {
    boltDiameter: number;
    exposedLength: number;
    nutCount: number;
    nutHeight: number;
    nutOD: number;
    washerCount: number;
    washerShape: number;
    washerSize: number;
    washerThickness: number;
    anchorLength: number;
    basePlateSize: number;
    basePlateThickness: number;
    boltToPlateDistance: number;
}

export declare function createNutAnchor(params: NutAnchorParams): TopoDS_Shape;
export declare function createNutAnchorWithPosition(
    params: NutAnchorParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 三支锚固参数结构体
export declare interface TripleArmAnchorParams {
    boltDiameter: number;
    exposedLength: number;
    nutCount: number;
    nutHeight: number;
    nutOD: number;
    washerCount: number;
    washerShape: number;
    washerSize: number;
    washerThickness: number;
    anchorLength: number;
    armDiameter: number;
    armStraightLength: number;
    armBendLength: number;
    armBendAngle: number;
}

// 几何体创建函数
export declare function createTripleArmAnchor(params: TripleArmAnchorParams): TopoDS_Shape;
export declare function createTripleArmAnchorWithPosition(
    params: TripleArmAnchorParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 定位板锚固参数结构体
export declare interface PositioningPlateAnchorParams {
    boltDiameter: number;
    exposedLength: number;
    nutCount: number;
    nutHeight: number;
    nutOD: number;
    washerCount: number;
    washerShape: number;
    washerSize: number;
    washerThickness: number;
    anchorLength: number;
    plateLength: number;
    plateThickness: number;
    toBaseDistance: number;
    toBottomDistance: number;
    groutHoleDiameter: number;
}

export declare function createPositioningPlateAnchor(params: PositioningPlateAnchorParams): TopoDS_Shape;
export declare function createPositioningPlateAnchorWithPosition(
    params: PositioningPlateAnchorParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 插入角钢参数结构体
export declare interface StubAngleParams {
    legWidth: number;
    thickness: number;
    slope: number;
    exposedLength: number;
    anchorLength: number;
}

export declare function createStubAngle(params: StubAngleParams): TopoDS_Shape;
export declare function createStubAngleWithPosition(
    params: StubAngleParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 插入钢管参数结构体
export declare interface StubTubeParams {
    diameter: number;
    thickness: number;
    slope: number;
    exposedLength: number;
    anchorLength: number;
}

export declare function createStubTube(params: StubTubeParams): TopoDS_Shape;
export declare function createStubTubeWithPosition(
    params: StubTubeParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;


// 电缆参数结构体
export declare interface CableWireParams {
    points: gp_Pnt[];
    outsideDiameter: number;
}

// 几何体创建函数
export declare function createCableWire(params: CableWireParams): TopoDS_Shape;
export declare function createCableWireWithPosition(
    params: CableWireParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆接头参数结构体
export declare interface CableJointParams {
    length: number;
    outerDiameter: number;
    terminalLength: number;
    innerDiameter: number;
}

export declare function createCableJoint(params: CableJointParams): TopoDS_Shape;
export declare function createCableJointWithPosition(
    params: CableJointParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 光缆接头盒参数结构体
export declare interface OpticalFiberBoxParams {
    length: number;
    height: number;
    width: number;
}

export declare function createOpticalFiberBox(params: OpticalFiberBoxParams): TopoDS_Shape;
export declare function createOpticalFiberBoxWithPosition(
    params: OpticalFiberBoxParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆终端参数结构体
export declare interface CableTerminalParams {
    sort: number;
    height: number;
    topDiameter: number;
    bottomDiameter: number;
    tailDiameter: number;
    tailHeight: number;
    skirtCount: number;
    upperSkirtTopDiameter: number;
    upperSkirtBottomDiameter: number;
    lowerSkirtTopDiameter: number;
    lowerSkirtBottomDiameter: number;
    skirtSectionHeight: number;
    upperTerminalLength: number;
    upperTerminalDiameter: number;
    lowerTerminalLength: number;
    lowerTerminalDiameter: number;
    hole1Diameter: number;
    hole2Diameter: number;
    hole1Distance: number;
    holeSpacing: number;
    flangeHoleDiameter: number;
    flangeHoleSpacing: number;
    flangeWidth: number;
    flangeCenterHoleRadius: number;
    flangeChamferRadius: number;
    flangeOpeningWidth: number;
    flangeBoltHeight: number;
}

// 几何体创建函数
export declare function createCableTerminal(params: CableTerminalParams): TopoDS_Shape;
export declare function createCableTerminalWithPosition(
    params: CableTerminalParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 接地箱类型枚举
export declare type CableBoxType = {
    DIRECT_GROUND: {},
    PROTECTIVE_GROUND: {},
    CROSS_INTERCONNECT: {}
}

// 接地箱参数结构体
export declare interface CableAccessoryParams {
    type: CableBoxType;
    length: number;
    width: number;
    height: number;
    portCount: number;
    portDiameter: number;
    portSpacing: number;
    backPanelDistance: number;
    sidePanelDistance: number;
}

export declare function createCableAccessory(params: CableAccessoryParams): TopoDS_Shape;
export declare function createCableAccessoryWithPosition(
    params: CableAccessoryParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆支架参数结构体
export declare interface CableBracketParams {
    length: number;
    rootHeight: number;
    rootWidth: number;
    width: number;
    topThickness: number;
    rootThickness: number;
    columnMountPoints: gp_Pnt[];
    clampMountPoints: gp_Pnt[];
}

// 几何体创建函数
export declare function createCableBracket(params: CableBracketParams): TopoDS_Shape;
export declare function createCableBracketWithPosition(
    params: CableBracketParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆夹具类型枚举
export declare type CableClampType = {
    SINGLE: {},
    LINEAR: {},
    CONTACT_TRIPLE: {},
    SEPARATE_TRIPLE: {}
}

// 电缆夹具参数结构体
export declare interface CableClampParams {
    clampType: CableClampType;
    diameter: number;
    thickness: number;
    width: number;
}

export declare function createCableClamp(params: CableClampParams): TopoDS_Shape;
export declare function createCableClampWithPosition(
    params: CableClampParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆立柱参数结构体
export declare interface CablePoleParams {
    specification: string;
    length: number;
    radius: number;
    arcAngle: number;
    width: number;
    fixedLegLength: number;
    fixedLegWidth: number;
    thickness: number;
    mountPoints: gp_Pnt[];
}

// 几何体创建函数
export declare function createCablePole(params: CablePoleParams): TopoDS_Shape;
export declare function createCablePoleWithPosition(
    params: CablePoleParams,
    position: gp_Pnt,
    direction: gp_Dir
): TopoDS_Shape;

// 接地扁铁参数结构体
export declare interface GroundFlatIronParams {
    length: number;
    height: number;
    thickness: number;
}

export declare function createGroundFlatIron(params: GroundFlatIronParams): TopoDS_Shape;
export declare function createGroundFlatIronWithPosition(
    params: GroundFlatIronParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 预埋件参数结构体
export declare interface EmbeddedPartParams {
    length: number;
    radius: number;
    height: number;
    materialRadius: number;
    lowerLength: number;
}

export declare function createEmbeddedPart(params: EmbeddedPartParams): TopoDS_Shape;
export declare function createEmbeddedPartWithPosition(
    params: EmbeddedPartParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// U型环参数结构体
export declare interface UShapedRingParams {
    thickness: number;
    height: number;
    radius: number;
    length: number;
}

// 几何体创建函数
export declare function createUShapedRing(params: UShapedRingParams): TopoDS_Shape;
export declare function createUShapedRingWithPosition(
    params: UShapedRingParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 吊环参数结构体
export declare interface LiftingEyeParams {
    height: number;
    ringRadius: number;
    pipeDiameter: number;
}

export declare function createLiftingEye(params: LiftingEyeParams): TopoDS_Shape;
export declare function createLiftingEyeWithPosition(
    params: LiftingEyeParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 连接段截面样式枚举
export declare type ConnectionSectionStyle = {
    RECTANGULAR: {},
    HORSESHOE: {},
    CIRCULAR: {}
}

// 井类型枚举
export declare type TunnelWellType = {
    STRAIGHT: {},
    STRAIGHT_TUNNEL: {}
}

// 转角井参数结构体
export declare interface CornerWellParams {
    leftLength: number;
    rightLength: number;
    width: number;
    height: number;
    topThickness: number;
    bottomThickness: number;
    wallThickness: number;
    angle: number;
    cornerRadius: number;
    cushionExtension: number;
    cushionThickness: number;
}

export declare function createCornerWell(params: CornerWellParams): TopoDS_Shape;
export declare function createCornerWellWithPosition(
    params: CornerWellParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 隧道井参数结构体
export declare interface TunnelWellParams {
    type: TunnelWellType;
    length: number;
    width: number;
    height: number;
    radius: number;
    topThickness: number;
    bottomThickness: number;
    leftSectionType: ConnectionSectionStyle;
    leftLength: number;
    leftWidth: number;
    leftHeight: number;
    leftArcHeight: number;
    rightSectionType: ConnectionSectionStyle;
    rightLength: number;
    rightWidth: number;
    rightHeight: number;
    rightArcHeight: number;
    outerWallThickness: number;
    innerWallThickness: number;
    cushionExtension: number;
    cushionThickness: number;
}

// 几何体创建函数
export declare function createTunnelWell(params: TunnelWellParams): TopoDS_Shape;
export declare function createTunnelWellWithPosition(
    params: TunnelWellParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 三通井类型枚举
export declare type ThreeWayWellType = {
    WORKING_WELL: {},
    OPEN_CUT_TUNNEL: {},
    UNDERGROUND_TUNNEL: {}
}

// 转角样式枚举
export declare type CornerStyle = {
    ROUNDED: {},
    ANGLED: {}
}

// 竖井样式枚举
export declare type ShaftStyle = {
    CIRCULAR: {},
    RECTANGULAR: {}
}

// 三通井参数结构体
export declare interface ThreeWayWellParams {
    type: ThreeWayWellType;
    cornerType: CornerStyle;
    shaftType: ShaftStyle;
    length: number;
    width: number;
    height: number;
    shaftRadius: number;
    cornerRadius: number;
    cornerLength: number;
    cornerWidth: number;
    angle: number;
    branchLength: number;
    branchLeftLength: number;
    branchWidth: number;
    topThickness: number;
    bottomThickness: number;
    leftSectionStyle: ConnectionSectionStyle;
    leftSectionLength: number;
    leftSectionWidth: number;
    leftSectionHeight: number;
    leftSectionArcHeight: number;
    rightSectionStyle: ConnectionSectionStyle;
    rightSectionLength: number;
    rightSectionWidth: number;
    rightSectionHeight: number;
    rightSectionArcHeight: number;
    branchSectionStyle: ConnectionSectionStyle;
    branchSectionLength: number;
    branchSectionWidth: number;
    branchSectionHeight: number;
    branchSectionArcHeight: number;
    outerWallThickness: number;
    innerWallThickness: number;
    isDoubleShaft: boolean;
    doubleShaftSpacing: number;
    outerWallExtension: number;
    innerWallExtension: number;
    cushionExtension: number;
    cushionThickness: number;
    innerBottomThickness: number;
    outerBottomThickness: number;
}

export declare function createThreeWayWell(params: ThreeWayWellParams): TopoDS_Shape;
export declare function createThreeWayWellWithPosition(
    params: ThreeWayWellParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;


// 四通井类型枚举
export declare type FourWayWellType = {
    WORKING_WELL: {},
    OPEN_CUT_TUNNEL: {},
    UNDERGROUND_TUNNEL: {}
}

// 四通井参数结构体
export declare interface FourWayWellParams {
    type: FourWayWellType;
    length: number;
    width: number;
    height: number;
    shaftRadius: number;
    cornerStyle: CornerStyle;
    cornerRadius: number;
    cornerLength: number;
    cornerWidth: number;
    branchLength: number;
    branchWidth: number;
    topThickness: number;
    bottomThickness: number;
    leftSection: ConnectionSectionStyle;
    rightSection: ConnectionSectionStyle;
    branchSection1: ConnectionSectionStyle;
    branchSection2: ConnectionSectionStyle;
    outerWallThickness: number;
    innerWallThickness: number;
    cushionExtension: number;
    cushionThickness: number;
}

// 几何体创建函数
export declare function createFourWayWell(params: FourWayWellParams): TopoDS_Shape;
export declare function createFourWayWellWithPosition(
    params: FourWayWellParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 通道点结构体
export declare interface ChannelPoint {
    position: gp_Pnt;
    type: number;
}

export declare interface PipeRowParams {
    pipeType: number;
    hasEnclosure: boolean;
    enclosureWidth: number;
    enclosureHeight: number;
    baseExtension: number;
    baseThickness: number;
    cushionExtension: number;
    cushionThickness: number;
    pipePositions: gp_Pnt2d[];
    pipeInnerDiameters: number[];
    pipeWallThicknesses: number[];
    pullPipeInnerDiameter: number;
    pullPipeThickness: number;
    points: ChannelPoint[];
}

export declare function createPipeRow(params: PipeRowParams): TopoDS_Shape;
export declare function createPipeRowWithPosition(
    params: PipeRowParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆沟参数结构体
export declare interface CableTrenchParams {
    width: number;
    height: number;
    coverWidth: number;
    coverThickness: number;
    baseExtension: number;
    baseThickness: number;
    cushionExtension: number;
    cushionThickness: number;
    wallThickness: number;
    wallThickness2: number;
    points: ChannelPoint[];
}

// 几何体创建函数
export declare function createCableTrench(params: CableTrenchParams): TopoDS_Shape;
export declare function createCableTrenchWithPosition(
    params: CableTrenchParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;


// 电缆隧道参数结构体
export declare interface CableTunnelParams {
    style: ConnectionSectionStyle;
    width: number;
    height: number;
    topThickness: number;
    bottomThickness: number;
    outerWallThickness: number;
    innerWallThickness: number;
    arcHeight: number;
    bottomPlatformHeight: number;
    cushionExtension: number;
    cushionThickness: number;
    points: ChannelPoint[];
}

export declare function createCableTunnel(params: CableTunnelParams): TopoDS_Shape;
export declare function createCableTunnelWithPosition(
    params: CableTunnelParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆桥架样式枚举
export declare type CableTrayStyle = {
    ARCH: {},
    BEAM: {}
}

// 电缆桥架参数结构体
export declare interface CableTrayParams {
    style: CableTrayStyle;
    columnDiameter: number;
    columnHeight: number;
    span: number;
    width: number;
    height: number;
    topPlateHeight: number;
    arcHeight: number;
    wallThickness: number;
    pipeCount: number;
    pipePositions: gp_Pnt2d[];
    pipeInnerDiameters: number[];
    pipeWallThicknesses: number[];
    hasProtectionPlate: boolean;
    points: ChannelPoint[];
}

// 几何体创建函数
export declare function createCableTray(params: CableTrayParams): TopoDS_Shape;
export declare function createCableTrayWithPosition(
    params: CableTrayParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 电缆L型梁参数结构体
export declare interface CableLBeamParams {
    length: number;
    width: number;
    height: number;
}

export declare function createCableLBeam(params: CableLBeamParams): TopoDS_Shape;
export declare function createCableLBeamWithPosition(
    params: CableLBeamParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 人孔样式枚举
export declare type ManholeStyle = {
    CIRCULAR: {},
    RECTANGULAR: {}
}

// 人孔参数结构体
export declare interface ManholeParams {
    style: ManholeStyle;
    length: number;
    width: number;
    height: number;
    wallThickness: number;
}

export declare function createManhole(params: ManholeParams): TopoDS_Shape;
export declare function createManholeWithPosition(
    params: ManholeParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 井盖样式枚举
export declare type ManholeCoverStyle = {
    CIRCULAR: {},
    RECTANGULAR: {}
}

// 井盖参数结构体
export declare interface ManholeCoverParams {
    style: ManholeCoverStyle;
    length: number;
    width: number;
    thickness: number;
}

// 几何体创建函数
export declare function createManholeCover(params: ManholeCoverParams): TopoDS_Shape;
export declare function createManholeCoverWithPosition(
    params: ManholeCoverParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 爬梯参数结构体
export declare interface LadderParams {
    length: number;
    width: number;
    thickness: number;
}

export declare function createLadder(params: LadderParams): TopoDS_Shape;
export declare function createLadderWithPosition(
    params: LadderParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 集水坑参数结构体
export declare interface SumpParams {
    length: number;
    width: number;
    depth: number;
    bottomThickness: number;
}

export declare function createSump(params: SumpParams): TopoDS_Shape;
export declare function createSumpWithPosition(
    params: SumpParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;


// 步道参数结构体
export declare interface FootpathParams {
    height: number;
    width: number;
    points: ChannelPoint[];
}

// 几何体创建函数
export declare function createFootpath(params: FootpathParams): TopoDS_Shape;
export declare function createFootpathWithPosition(
    params: FootpathParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 竖井参数结构体
export declare interface ShaftChamberParams {
    supportWallThickness: number;
    supportDiameter: number;
    supportHeight: number;
    topThickness: number;
    innerDiameter: number;
    workingHeight: number;
    outerWallThickness: number;
    innerWallThickness: number;
}

export declare function createShaftChamber(params: ShaftChamberParams): TopoDS_Shape;
export declare function createShaftChamberWithPosition(
    params: ShaftChamberParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 隧道隔板参数结构体
export declare interface TunnelCompartmentPartitionParams {
    width: number;
    thickness: number;
}

export declare function createTunnelCompartmentPartition(
    params: TunnelCompartmentPartitionParams
): TopoDS_Shape;
export declare function createTunnelCompartmentPartitionWithPosition(
    params: TunnelCompartmentPartitionParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;


// 隧道分区板参数结构体
export declare interface TunnelPartitionBoardParams {
    style: number;
    length: number;
    width: number;
    thickness: number;
    holeCount: number;
    holePositions: gp_Pnt2d[];
    holeStyles: number[];
    holeDiameters: number[];
    holeWidths: number[];
}

// 几何体创建函数
export declare function createTunnelPartitionBoard(params: TunnelPartitionBoardParams): TopoDS_Shape;
export declare function createTunnelPartitionBoardWithPosition(
    params: TunnelPartitionBoardParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 风亭参数结构体
export declare interface VentilationPavilionParams {
    topLength: number;
    middleLength: number;
    bottomLength: number;
    topWidth: number;
    middleWidth: number;
    bottomWidth: number;
    topHeight: number;
    height: number;
    baseHeight: number;
}

export declare function createVentilationPavilion(params: VentilationPavilionParams): TopoDS_Shape;
export declare function createVentilationPavilionWithPosition(
    params: VentilationPavilionParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 直通风管参数结构体
export declare interface StraightVentilationDuctParams {
    diameter: number;
    wallThickness: number;
    height: number;
}

export declare function createStraightVentilationDuct(params: StraightVentilationDuctParams): TopoDS_Shape;
export declare function createStraightVentilationDuctWithPosition(
    params: StraightVentilationDuctParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;


// 斜通风管参数结构体
export declare interface ObliqueVentilationDuctParams {
    hoodRoomLength: number;
    hoodRoomWidth: number;
    hoodRoomHeight: number;
    hoodWallThickness: number;
    ductCenterHeight: number;
    ductLeftDistance: number;
    ductDiameter: number;
    ductWallThickness: number;
    ductLength: number;
    ductHeightDifference: number;
    baseLength: number;
    baseWidth: number;
    baseHeight: number;
    baseRoomLength: number;
    baseRoomWallThickness: number;
    baseRoomWidth: number;
    baseRoomHeight: number;
}

// 几何体创建函数
export declare function createObliqueVentilationDuct(params: ObliqueVentilationDuctParams): TopoDS_Shape;
export declare function createObliqueVentilationDuctWithPosition(
    params: ObliqueVentilationDuctParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 排水井参数结构体
export declare interface DrainageWellParams {
    length: number;
    width: number;
    height: number;
    neckDiameter: number;
    neckHeight: number;
    cushionExtension: number;
    bottomThickness: number;
    wallThickness: number;
}

export declare function createDrainageWell(params: DrainageWellParams): TopoDS_Shape;
export declare function createDrainageWellWithPosition(
    params: DrainageWellParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 管枕参数结构体
export declare interface PipeSupportParams {
    style: number;
    count: number;
    positions: gp_Pnt2d[];
    radii: number[];
    length: number;
    width: number;
    height: number;
}

export declare function createPipeSupport(params: PipeSupportParams): TopoDS_Shape;
export declare function createPipeSupportWithPosition(
    params: PipeSupportParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 盖板参数结构体
export declare interface CoverPlateParams {
    style: string;
    length: number;
    width: number;
    smallRadius: number;
    largeRadius: number;
    thickness: number;
}

// 几何体创建函数
export declare function createCoverPlate(params: CoverPlateParams): TopoDS_Shape;
export declare function createCoverPlateWithPosition(
    params: CoverPlateParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 槽盒参数结构体
export declare interface CableRayParams {
    outerLength: number;
    outerHeight: number;
    innerLength: number;
    innerHeight: number;
    coverThickness: number;
}

export declare function createCableRay(params: CableRayParams): TopoDS_Shape;
export declare function createCableRayWithPosition(
    params: CableRayParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 水隧道截面样式枚举
export declare type WaterTunnelSectionStyle = {
    RECTANGULAR: {},
    CITYOPENING: {},
    CIRCULAR: {},
    HORSESHOE: {}
}

// 水隧道参数结构体
export declare interface WaterTunnelParams {
    style: WaterTunnelSectionStyle;
    width: number;
    height: number;
    topThickness: number;
    bottomThickness: number;
    outerWallThickness: number;
    innerWallThickness: number;
    arcHeight: number;
    arcRadius: number;
    arcAngle: number;
    bottomPlatformHeight: number;
    cushionExtension: number;
    cushionThickness: number;
    points: ChannelPoint[];
}

export declare function createWaterTunnel(params: WaterTunnelParams): TopoDS_Shape;
export declare function createWaterTunnelWithPosition(
    params: WaterTunnelParams,
    position: gp_Pnt,
    direction1: gp_Dir,
    direction2: gp_Dir
): TopoDS_Shape;

// 剖面类型枚举
export declare type ProfileType = {
    NONE: {},
    TRIANGLE: {},
    RECTANGLE: {},
    CIRC: {},
    ELIPS: {},
    POLYGON: {}
}

// 三角形剖面
export declare interface TriangleProfile {
    type: ProfileType.TRIANGLE;
    p1: gp_Pnt;
    p2: gp_Pnt;
    p3: gp_Pnt;
}

// 矩形剖面
export declare interface RectangleProfile {
    type: ProfileType.RECTANGLE;
    p1: gp_Pnt;
    p2: gp_Pnt;
}

// 圆形剖面
export declare interface CircProfile {
    type: ProfileType.CIRC;
    center: gp_Pnt;
    norm: gp_Dir;
    radius: number;
}

// 椭圆剖面
export declare interface ElipsProfile {
    type: ProfileType.ELIPS;
    s1: gp_Pnt;
    s2: gp_Pnt;
    center: gp_Pnt;
}

// 多边形剖面
export declare interface PolygonProfile {
    type: ProfileType.POLYGON;
    edges: gp_Pnt[];
    inners: gp_Pnt[][];
}

// 剖面类型
export declare type ShapeProfile = TriangleProfile | RectangleProfile | CircProfile | ElipsProfile | PolygonProfile;

// 旋转参数
export declare interface RevolParams {
    profile: ShapeProfile;
    axis: gp_Ax1;
    angle: number;
}

// 旋转创建函数
export declare function createRevol(params: RevolParams): TopoDS_Shape;
export declare function createRevolWithPosition(params: RevolParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 拉伸参数
export declare interface PrismParams {
    profile: ShapeProfile;
    direction: gp_Dir;
}

// 拉伸创建函数
export declare function createPrism(params: PrismParams): TopoDS_Shape;
export declare function createPrismWithPosition(params: PrismParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 线段类型枚举
export declare type SegmentType = {
    LINE: {},
    THREE_POINT_ARC: {},
    CIRCLE_CENTER_ARC: {},
    SPLINE: {}
}

// 管道参数
export declare interface PipeParams {
    wire: gp_Pnt[];
    profile: [ShapeProfile, ShapeProfile] | [ShapeProfile];
    innerProfile?: [ShapeProfile, ShapeProfile] | [ShapeProfile] | null;
    segmentType: SegmentType;
    transitionMode: TransitionMode;
    upDir?: gp_Dir;
}

// 管道创建函数
export declare function createPipe(params: PipeParams): TopoDS_Shape;
export declare function createPipeWithSplitDistances(
    params: PipeParams,
    splitDistances?: [number, number]
): TopoDS_Shape;
export declare function createPipeWithPosition(params: PipeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 多段管道参数
export declare interface MultiSegmentPipeParams {
    wires: Point[][];
    profiles: Array<ShapeProfile>;
    innerProfiles?: Array<ShapeProfile> | null;
    segmentTypes?: SegmentType[] | null;
    transitionMode: TransitionMode;
    upDir?: gp_Dir;
}

// 连接形状模式枚举
export declare type JointShapeMode = {
    SPHERE: {},
    BOX: {},
    CYLINDER: {}
}

// 管道端点
export declare interface PipeEndpoint {
    offset: gp_Pnt;
    normal: gp_Dir;
    profile: ShapeProfile;
    innerProfile?: ShapeProfile;
}

// 管道连接参数
export declare interface PipeJointParams {
    ins: PipeEndpoint[];
    outs: PipeEndpoint[];
    mode: JointShapeMode;
    flanged: boolean;
    upDir?: gp_Dir;
}

// 多段管道创建函数
export declare function createMultiSegmentPipe(params: MultiSegmentPipeParams): TopoDS_Shape;
export declare function createMultiSegmentPipeWithSplitDistances(
    params: MultiSegmentPipeParams,
    splitDistances?: [number, number]
): TopoDS_Shape;
export declare function createMultiSegmentPipeWithPosition(
    params: MultiSegmentPipeParams,
    position: gp_Pnt,
    direction?: gp_Dir,
    xDir?: gp_Dir
): TopoDS_Shape;

// 管道连接创建函数
export declare function createPipeJoint(params: PipeJointParams): TopoDS_Shape;
export declare function createPipeJointWithPosition(
    params: PipeJointParams,
    position: gp_Pnt,
    direction?: gp_Dir,
    xDir?: gp_Dir
): TopoDS_Shape;


// 悬链线参数
export declare interface CatenaryParams {
    p1: gp_Pnt;
    p2: gp_Pnt;
    profile: ShapeProfile;
    slack: number;
    maxSag: number;
    tessellation: number;
    upDir?: gp_Dir;
}

// 悬链线
export declare function createCatenary(params: CatenaryParams): TopoDS_Shape;
export declare function createCatenaryWithPosition(params: CatenaryParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;


// 长方体参数
export declare interface BoxShapeParams {
    point1: gp_Pnt;
    point2: gp_Pnt;
}

// 长方体
export declare function createBoxShape(params: BoxShapeParams): TopoDS_Shape;
export declare function createBoxShapeWithPosition(params: BoxShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 圆锥参数
export declare interface ConeShapeParams {
    radius1: number;
    radius2: number;
    height: number;
    angle?: number;
}

// 圆锥
export declare function createConeShape(params: ConeShapeParams): TopoDS_Shape;
export declare function createConeShapeWithPosition(params: ConeShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 圆柱参数
export declare interface CylinderShapeParams {
    radius: number;
    height: number;
    angle?: number;
}

// 圆柱
export declare function createCylinderShape(params: CylinderShapeParams): TopoDS_Shape;
export declare function createCylinderShapeWithPosition(params: CylinderShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 旋转体参数
export declare interface RevolutionShapeParams {
    meridian: gp_Pnt[];
    angle?: number;
    max?: number;
    min?: number;
}

// 旋转体
export declare function createRevolutionShape(params: RevolutionShapeParams): TopoDS_Shape;
export declare function createRevolutionShapeWithPosition(params: RevolutionShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 球体参数
export declare interface SphereShapeParams {
    center?: gp_Pnt;
    radius: number;
    angle1?: number;
    angle2?: number;
    angle?: number;
}

// 球体
export declare function createSphereShape(params: SphereShapeParams): TopoDS_Shape;
export declare function createSphereShapeWithPosition(params: SphereShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 圆环体参数
export declare interface TorusShapeParams {
    radius1: number;
    radius2: number;
    angle1?: number;
    angle2?: number;
    angle?: number;
}

// 圆环体
export declare function createTorusShape(params: TorusShapeParams): TopoDS_Shape;
export declare function createTorusShapeWithPosition(params: TorusShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 楔形体参数
export declare interface WedgeShapeParams {
    edge: gp_Pnt;
    limit?: [number, number, number, number];
    ltx?: number;
}

// 楔形体
export declare function createWedgeShape(params: WedgeShapeParams): TopoDS_Shape;
export declare function createWedgeShapeWithPosition(params: WedgeShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;

// 管道形状参数
export declare interface PipeShapeParams {
    wire: [gp_Pnt, gp_Pnt];
    profile: ShapeProfile;
    upDir?: gp_Dir;
}

// 管道形状
export declare function createPipeShape(params: PipeShapeParams): TopoDS_Shape;
export declare function createPipeShapeWithPosition(params: PipeShapeParams, position: gp_Pnt, direction?: gp_Dir, xDir?: gp_Dir): TopoDS_Shape;