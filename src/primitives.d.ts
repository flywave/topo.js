declare module 'primitives' {
    // 球体参数结构体
    interface SphereParams {
        radius: number;
    }

    // 几何体创建函数
    function createSphere(params: SphereParams): TopoDS_Shape;
    function createSphereWithCenter(params: SphereParams, center: gp_Pnt): TopoDS_Shape;

    // 旋转椭球体参数结构体
    interface RotationalEllipsoidParams {
        polarRadius: number;
        equatorialRadius: number;
        height: number;
    }

    function createRotationalEllipsoid(params: RotationalEllipsoidParams): TopoDS_Shape;
    function createRotationalEllipsoidWithCenter(
        params: RotationalEllipsoidParams,
        center: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 长方体参数结构体
    interface CuboidParams {
        length: number;
        width: number;
        height: number;
    }

    function createCuboid(params: CuboidParams): TopoDS_Shape;
    function createCuboidWithCenter(
        params: CuboidParams,
        center: gp_Pnt,
        xDir: gp_Dir,
        yDir: gp_Dir
    ): TopoDS_Shape;

    // 菱形台参数结构体
    interface DiamondFrustumParams {
        topDiag1: number;
        topDiag2: number;
        bottomDiag1: number;
        bottomDiag2: number;
        height: number;
    }

    function createDiamondFrustum(params: DiamondFrustumParams): TopoDS_Shape;
    function createDiamondFrustumWithPosition(
        params: DiamondFrustumParams,
        position: gp_Pnt,
        xDir: gp_Dir,
        yDir: gp_Dir
    ): TopoDS_Shape;

    // 偏移矩形台参数结构体
    interface OffsetRectangularTableParams {
        topLength: number;
        topWidth: number;
        bottomLength: number;
        bottomWidth: number;
        height: number;
        xOffset: number;
        yOffset: number;
    }

    // 几何体创建函数
    function createOffsetRectangularTable(params: OffsetRectangularTableParams): TopoDS_Shape;
    function createOffsetRectangularTableWithPosition(
        params: OffsetRectangularTableParams,
        position: gp_Pnt,
        xDir: gp_Dir,
        yDir: gp_Dir
    ): TopoDS_Shape;

    // 圆柱参数结构体
    interface CylinderParams {
        radius: number;
        height: number;
    }

    function createCylinder(params: CylinderParams): TopoDS_Shape;
    function createCylinderWithBase(
        params: CylinderParams,
        baseCenter: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 弯折圆柱参数结构体
    interface SharpBentCylinderParams {
        radius: number;
        length: number;
        bendAngle: number;
    }

    function createSharpBentCylinder(params: SharpBentCylinderParams): TopoDS_Shape;
    function createSharpBentCylinderWithBendPoint(
        params: SharpBentCylinderParams,
        bendPoint: gp_Pnt,
        startDir: gp_Dir,
        endDir: gp_Dir
    ): TopoDS_Shape;

    // 截锥参数结构体
    interface TruncatedConeParams {
        topRadius: number;
        bottomRadius: number;
        height: number;
    }

    function createTruncatedCone(params: TruncatedConeParams): TopoDS_Shape;
    function createTruncatedConeWithBase(
        params: TruncatedConeParams,
        baseCenter: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 偏心截锥参数结构体
    interface EccentricTruncatedConeParams {
        topRadius: number;
        bottomRadius: number;
        height: number;
        topXOffset: number;
        topYOffset: number;
    }

    function createEccentricTruncatedCone(params: EccentricTruncatedConeParams): TopoDS_Shape;
    function createEccentricTruncatedConeWithBase(
        params: EccentricTruncatedConeParams,
        baseCenter: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 环形参数结构体
    interface RingParams {
        ringRadius: number;
        tubeRadius: number;
        angle: number;
    }

    // 几何体创建函数
    function createRing(params: RingParams): TopoDS_Shape;
    function createRingWithCenter(
        params: RingParams,
        center: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 矩形环参数结构体
    interface RectangularRingParams {
        tubeRadius: number;
        filletRadius: number;
        length: number;
        width: number;
    }

    function createRectangularRing(params: RectangularRingParams): TopoDS_Shape;
    function createRectangularRingWithCenter(
        params: RectangularRingParams,
        center: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 椭圆环参数结构体
    interface EllipticRingParams {
        tubeRadius: number;
        majorRadius: number;
        minorRadius: number;
    }

    function createEllipticRing(params: EllipticRingParams): TopoDS_Shape;
    function createEllipticRingWithCenter(
        params: EllipticRingParams,
        center: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 圆形垫片参数结构体
    interface CircularGasketParams {
        outerRadius: number;
        innerRadius: number;
        height: number;
        angle: number;
    }

    function createCircularGasket(params: CircularGasketParams): TopoDS_Shape;
    function createCircularGasketWithCenter(
        params: CircularGasketParams,
        center: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 台形垫片参数结构体
    interface TableGasketParams {
        topRadius: number;
        outerRadius: number;
        innerRadius: number;
        height: number;
        angle: number;
    }

    // 几何体创建函数
    function createTableGasket(params: TableGasketParams): TopoDS_Shape;
    function createTableGasketWithCenter(
        params: TableGasketParams,
        center: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 方形垫片参数结构体
    interface SquareGasketParams {
        outerLength: number;
        outerWidth: number;
        innerLength: number;
        innerWidth: number;
        height: number;
        cornerType: number;
        cornerParam: number;
    }


    function createSquareGasket(params: SquareGasketParams): TopoDS_Shape;
    function createSquareGasketWithCenter(
        params: SquareGasketParams,
        center: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 拉伸体参数结构体
    interface StretchedBodyParams {
        points: gp_Pnt[];
        normal: gp_Dir;
        length: number;
    }

    function createStretchedBody(params: StretchedBodyParams): TopoDS_Shape;
    function createStretchedBodyWithBase(
        params: StretchedBodyParams,
        baseCenter: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 瓷套绝缘子参数结构体
    interface PorcelainBushingParams {
        height: number;
        radius: number;
        bigSkirtRadius: number;
        smallSkirtRadius: number;
        count: number;
    }

    function createPorcelainBushing(params: PorcelainBushingParams): TopoDS_Shape;
    function createPorcelainBushingWithBase(
        params: PorcelainBushingParams,
        baseCenter: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 锥形瓷套绝缘子参数结构体
    interface ConePorcelainBushingParams {
        height: number;
        bottomRadius: number;
        topRadius: number;
        bottomSkirtRadius1: number;
        bottomSkirtRadius2: number;
        topSkirtRadius1: number;
        topSkirtRadius2: number;
        count: number;
    }

    function createConePorcelainBushing(params: ConePorcelainBushingParams): TopoDS_Shape;
    function createConePorcelainBushingWithBase(
        params: ConePorcelainBushingParams,
        baseCenter: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 绝缘子串参数结构体
    interface InsulatorStringParams {
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
    function createInsulatorString(params: InsulatorStringParams): TopoDS_Shape;
    function createInsulatorStringWithPosition(
        params: InsulatorStringParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // V型绝缘子参数结构体
    interface VTypeInsulatorParams {
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

    function createVTypeInsulator(params: VTypeInsulatorParams): TopoDS_Shape;
    function createVTypeInsulatorWithPosition(
        params: VTypeInsulatorParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 端子排参数结构体
    interface TerminalBlockParams {
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

    function createTerminalBlock(params: TerminalBlockParams): TopoDS_Shape;
    function createTerminalBlockWithPosition(
        params: TerminalBlockParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 矩形开孔板参数结构体
    interface RectangularHolePlateParams {
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

    function createRectangularFixedPlate(params: RectangularHolePlateParams): TopoDS_Shape;
    function createRectangularFixedPlateWithPosition(
        params: RectangularHolePlateParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 圆形开孔板参数结构体
    interface CircularFixedPlateParams {
        length: number;
        width: number;
        thickness: number;
        ringRadius: number;
        holeCount: number;
        hasMiddleHole: boolean;
        holeDiameter: number;
    }

    function createCircularFixedPlate(params: CircularFixedPlateParams): TopoDS_Shape;
    function createCircularFixedPlateWithPosition(
        params: CircularFixedPlateParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 导线参数结构体
    interface WireParams {
        startPoint: gp_Pnt;
        endPoint: gp_Pnt;
        startDir: gp_Dir;
        endDir: gp_Dir;
        sag: number;
        diameter: number;
        fitPoints: gp_Pnt[];
    }

    // 几何体创建函数
    function createWire(params: WireParams): TopoDS_Shape;
    function createWireWithPosition(
        params: WireParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 电缆参数结构体
    interface CableParams {
        startPoint: gp_Pnt;
        endPoint: gp_Pnt;
        inflectionPoints: gp_Pnt[];
        radii: number[];
        diameter: number;
    }

    function createCable(params: CableParams): TopoDS_Shape;
    function createCableWithPosition(
        params: CableParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 曲线类型枚举
    enum CurveType {
        LINE = "LINE",
        ARC = "ARC",
        SPLINE = "SPLINE"
    }

    // 曲线电缆参数结构体
    interface CurveCableParams {
        controlPoints: gp_Pnt[];
        curveTypes: CurveType[];
        diameter: number;
    }

    function createCurveCable(params: CurveCableParams): TopoDS_Shape;
    function createCurveCableWithPosition(
        params: CurveCableParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 角钢参数结构体
    interface AngleSteelParams {
        L1: number;
        L2: number;
        X: number;
        length: number;
    }

    function createAngleSteel(params: AngleSteelParams): TopoDS_Shape;
    function createAngleSteelWithPosition(
        params: AngleSteelParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 工字钢参数结构体
    interface IShapedSteelParams {
        height: number;
        flangeWidth: number;
        webThickness: number;
        flangeThickness: number;
        length: number;
    }

    // 几何体创建函数
    function createIShapedSteel(params: IShapedSteelParams): TopoDS_Shape;
    function createIShapedSteelWithPosition(
        params: IShapedSteelParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;


    // 槽钢参数结构体
    interface ChannelSteelParams {
        height: number;
        flangeWidth: number;
        webThickness: number;
        flangeThickness: number;
        length: number;
    }


    function createChannelSteel(params: ChannelSteelParams): TopoDS_Shape;
    function createChannelSteelWithPosition(
        params: ChannelSteelParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // T型钢参数结构体
    interface TSteelParams {
        height: number;
        width: number;
        webThickness: number;
        flangeThickness: number;
        length: number;
    }

    function createTSteel(params: TSteelParams): TopoDS_Shape;
    function createTSteelWithPosition(
        params: TSteelParams,
        position: gp_Pnt,
        normal: gp_Dir,
        xDir: gp_Dir
    ): TopoDS_Shape;

    // 钻孔桩参数结构体
    interface BoredPileParams {
        H1: number;
        H2: number;
        H3: number;
        H4: number;
        d: number;
        D: number;
    }

    function createBoredPileBase(params: BoredPileParams): TopoDS_Shape;
    function createBoredPileBaseWithPosition(
        params: BoredPileParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 桩承台参数结构体
    interface PileCapParams {
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
        ZPOSTARRAY: number[];
    }

    // 几何体创建函数
    function createPileCapBase(params: PileCapParams): TopoDS_Shape;
    function createPileCapBaseWithPosition(
        params: PileCapParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 岩石锚杆参数结构体
    interface RockAnchorParams {
        H1: number;
        H2: number;
        d: number;
        B1: number;
        L1: number;
        ZCOUNT: number;
        ZPOSTARRAY: number[];
    }

    function createRockAnchorBase(params: RockAnchorParams): TopoDS_Shape;
    function createRockAnchorBaseWithPosition(
        params: RockAnchorParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 岩石桩承台参数结构体
    interface RockPileCapParams {
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
        ZPOSTARRAY: number[];
    }

    function createRockPileCapBase(params: RockPileCapParams): TopoDS_Shape;
    function createRockPileCapBaseWithPosition(
        params: RockPileCapParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 嵌入式岩石锚杆参数结构体
    interface EmbeddedRockAnchorParams {
        H1: number;
        H2: number;
        H3: number;
        d: number;
        D: number;
    }

    function createEmbeddedRockAnchorBase(params: EmbeddedRockAnchorParams): TopoDS_Shape;
    function createEmbeddedRockAnchorBaseWithPosition(
        params: EmbeddedRockAnchorParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 倾斜岩石锚杆基础参数结构体
    interface InclinedRockAnchorParams {
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
    function createInclinedRockAnchorBase(params: InclinedRockAnchorParams): TopoDS_Shape;
    function createInclinedRockAnchorBaseWithPosition(
        params: InclinedRockAnchorParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 开挖式基础参数结构体
    interface ExcavatedBaseParams {
        H1: number;
        H2: number;
        H3: number;
        d: number;
        D: number;
        alpha1: number;
        alpha2: number;
    }

    function createExcavatedBase(params: ExcavatedBaseParams): TopoDS_Shape;
    function createExcavatedBaseWithPosition(
        params: ExcavatedBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 阶梯式基础参数结构体
    interface StepBaseParams {
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

    function createStepBase(params: StepBaseParams): TopoDS_Shape;
    function createStepBaseWithPosition(
        params: StepBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 阶梯板式基础参数结构体
    interface StepPlateBaseParams {
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

    function createStepPlateBase(params: StepPlateBaseParams): TopoDS_Shape;
    function createStepPlateBaseWithPosition(
        params: StepPlateBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;


    // 斜坡式基础参数结构体
    interface SlopedBaseBaseParams {
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
    function createSlopedBaseBase(params: SlopedBaseBaseParams): TopoDS_Shape;
    function createSlopedBaseBaseWithPosition(
        params: SlopedBaseBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 复合沉井基础参数结构体
    interface CompositeCaissonBaseParams {
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

    function createCompositeCaissonBase(params: CompositeCaissonBaseParams): TopoDS_Shape;
    function createCompositeCaissonBaseWithPosition(
        params: CompositeCaissonBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 筏板基础参数结构体
    interface RaftBaseParams {
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

    function createRaftBase(params: RaftBaseParams): TopoDS_Shape;
    function createRaftBaseWithPosition(
        params: RaftBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 直埋基础参数结构体
    interface DirectBuriedBaseParams {
        H1: number;
        H2: number;
        d: number;
        D: number;
        B: number;
        t: number;
    }

    function createDirectBuriedBase(params: DirectBuriedBaseParams): TopoDS_Shape;
    function createDirectBuriedBaseWithPosition(
        params: DirectBuriedBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 钢套筒基础参数结构体
    interface SteelSleeveBaseParams {
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

    function createSteelSleeveBase(params: SteelSleeureBaseParams): TopoDS_Shape;
    function createSteelSleeveBaseWithPosition(
        params: SteelSleeureBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;


    // 预制柱基础参数结构体
    interface PrecastColumnBaseParams {
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
    function createPrecastColumnBase(params: PrecastColumnBaseParams): TopoDS_Shape;
    function createPrecastColumnBaseWithPosition(
        params: PrecastColumnBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 预制插接基础参数结构体
    interface PrecastPinnedBaseParams {
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

    function createPrecastPinnedBase(params: PrecastPinnedBaseParams): TopoDS_Shape;
    function createPrecastPinnedBaseWithPosition(
        params: PrecastPinnedBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 预制金属支撑基础参数结构体
    interface PrecastMetalSupportBaseParams {
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
        HX: number;
    }

    function createPrecastMetalSupportBase(params: PrecastMetalSupportBaseParams): TopoDS_Shape;
    function createPrecastMetalSupportBaseWithPosition(
        params: PrecastMetalSupportBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 预制混凝土支撑基础参数结构体
    interface PrecastConcreteSupportBaseParams {
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

    function createPrecastConcreteSupportBase(params: PrecastConcreteSupportBaseParams): TopoDS_Shape;
    function createPrecastConcreteSupportBaseWithPosition(
        params: PrecastConcreteSupportBaseParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 输电线路参数结构体
    interface TransmissionLineParams {
        type: string;
        sectionalArea: number;
        outsideDiameter: number;
        wireWeight: number;
        coefficientOfElasticity: number;
        expansionCoefficient: number;
        ratedStrength: number;
    }

    // 几何体创建函数
    function createTransmissionLine(
        params: TransmissionLineParams,
        startPoint: gp_Pnt,
        endPoint: gp_Pnt
    ): TopoDS_Shape;

    // 绝缘子材质枚举
    enum InsulatorMaterial {
        CERAMIC = "CERAMIC",
        GLASS = "GLASS",
        COMPOSITE = "COMPOSITE"
    }

    // 排列方式枚举
    enum ArrangementType {
        HORIZONTAL = "HORIZONTAL",
        VERTICAL = "VERTICAL"
    }

    // 串用途枚举
    enum ApplicationType {
        CONDUCTOR = "CONDUCTOR",
        GROUND_WIRE = "GROUND_WIRE"
    }

    // 串类型枚举
    enum StringType {
        SUSPENSION = "SUSPENSION",
        TENSION = "TENSION"
    }

    // 复合绝缘子参数结构体
    interface CompositeInsulatorParams {
        majorRadius: number;
        minorRadius: number;
        gap: number;
    }

    interface InsulatorParams {
        type: string;
        subNum: number;
        subType: number;
        splitDistance: number;
        vAngleLeft: number;
        vAngleRight: number;
        uLinkLength: number;
        weight: number;
        fittingLengths: {
            leftUpper: number;
            rightUpper: number;
            leftLower: number;
            rightLower: number;
        };
        multiLink: {
            count: number;
            spacing: number;
            arrangement: ArrangementType;
        };
        insulator: {
            radius: number | CompositeInsulatorParams;
            height: number;
            leftCount: number;
            rightCount: number;
            material: InsulatorMaterial;
        };
        gradingRing: {
            count: number;
            position: number;
            height: number;
            radius: number;
        };
        application: ApplicationType;
        stringType: StringType;
    }

    function createInsulatorString(params: InsulatorParams): TopoDS_Shape;
    function createInsulatorStringWithPosition(
        params: InsulatorParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;


    // 杆件类型枚举
    enum MemberType {
        ANGLE = "ANGLE",
        TUBE = "TUBE",
        TAPERED_TUBE = "TAPERED_TUBE"
    }

    // 挂点类型枚举
    enum AttachmentType {
        GROUND_WIRE = "GROUND_WIRE",
        CONDUCTOR = "CONDUCTOR",
        JUMPER = "JUMPER"
    }

    // 杆塔节点结构体
    interface PoleTowerNode {
        id: string;
        position: gp_Pnt;
    }

    // 杆塔杆件结构体
    interface PoleTowerMember {
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
    interface PoleTowerAttachment {
        name: string;
        type: AttachmentType;
        position: gp_Pnt;
    }

    // 杆塔接腿结构体
    interface PoleTowerLeg {
        id: string;
        commonHeight: number;
        specificHeight: number;
        nodes: PoleTowerNode[];
    }

    // 杆塔本体结构体
    interface PoleTowerBody {
        id: string;
        height: number;
        nodes: PoleTowerNode[];
        legs: PoleTowerLeg[];
    }

    // 杆塔呼高结构体
    interface PoleTowerHeight {
        value: number;
        bodyId: string;
        legId: string;
    }

    // 杆塔参数结构体
    interface PoleTowerParams {
        heights: PoleTowerHeight[];
        bodies: PoleTowerBody[];
        members: PoleTowerMember[];
        attachments: PoleTowerAttachment[];
    }

    // 杆塔创建函数
    function createPoleTower(params: PoleTowerParams): TopoDS_Shape;
    function createPoleTowerWithPosition(
        params: PoleTowerParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;


    // 单钩锚固参数结构体
    interface SingleHookAnchorParams {
        boltDiameter: number;
        exposedLength: number;
        nutCount: number;
        nutHeight: number;
        nutOD: number;
        washerCount: number;
        washerShape: string;
        washerSize: number;
        washerThickness: number;
        anchorLength: number;
        hookStraightLength: number;
        hookDiameter: number;
    }

    // 几何体创建函数
    function createSingleHookAnchor(params: SingleHookAnchorParams): TopoDS_Shape;
    function createSingleHookAnchorWithPosition(
        params: SingleHookAnchorParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 三钩锚固参数结构体
    interface TripleHookAnchorParams {
        boltDiameter: number;
        exposedLength: number;
        nutCount: number;
        nutHeight: number;
        nutOD: number;
        washerCount: number;
        washerShape: string;
        washerSize: number;
        washerThickness: number;
        anchorLength: number;
        hookStraightLengthA: number;
        hookStraightLengthB: number;
        hookDiameter: number;
        anchorBarDiameter: number;
    }

    function createTripleHookAnchor(params: TripleHookAnchorParams): TopoDS_Shape;
    function createTripleHookAnchorWithPosition(
        params: TripleHookAnchorParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 肋板锚固参数结构体
    interface RibbedAnchorParams {
        boltDiameter: number;
        exposedLength: number;
        nutCount: number;
        nutHeight: number;
        nutOD: number;
        washerCount: number;
        washerShape: string;
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
    function createRibbedAnchor(params: RibbedAnchorParams): TopoDS_Shape;
    function createRibbedAnchorWithPosition(
        params: RibbedAnchorParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 螺帽锚固参数结构体
    interface NutAnchorParams {
        boltDiameter: number;
        exposedLength: number;
        nutCount: number;
        nutHeight: number;
        nutOD: number;
        washerCount: number;
        washerShape: string;
        washerSize: number;
        washerThickness: number;
        anchorLength: number;
        basePlateSize: number;
        basePlateThickness: number;
        boltToPlateDistance: number;
    }

    function createNutAnchor(params: NutAnchorParams): TopoDS_Shape;
    function createNutAnchorWithPosition(
        params: NutAnchorParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 三支锚固参数结构体
    interface TripleArmAnchorParams {
        boltDiameter: number;
        exposedLength: number;
        nutCount: number;
        nutHeight: number;
        nutOD: number;
        washerCount: number;
        washerShape: string;
        washerSize: number;
        washerThickness: number;
        anchorLength: number;
        armDiameter: number;
        armStraightLength: number;
        armBendLength: number;
        armBendAngle: number;
    }

    // 几何体创建函数
    function createTripleArmAnchor(params: TripleArmAnchorParams): TopoDS_Shape;
    function createTripleArmAnchorWithPosition(
        params: TripleArmAnchorParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 定位板锚固参数结构体
    interface PositioningPlateAnchorParams {
        boltDiameter: number;
        exposedLength: number;
        nutCount: number;
        nutHeight: number;
        nutOD: number;
        washerCount: number;
        washerShape: string;
        washerSize: number;
        washerThickness: number;
        anchorLength: number;
        plateLength: number;
        plateThickness: number;
        toBaseDistance: number;
        toBottomDistance: number;
        groutHoleDiameter: number;
    }

    function createPositioningPlateAnchor(params: PositioningPlateAnchorParams): TopoDS_Shape;
    function createPositioningPlateAnchorWithPosition(
        params: PositioningPlateAnchorParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 插入角钢参数结构体
    interface StubAngleParams {
        legWidth: number;
        thickness: number;
        slope: number;
        exposedLength: number;
        anchorLength: number;
    }

    function createStubAngle(params: StubAngleParams): TopoDS_Shape;
    function createStubAngleWithPosition(
        params: StubAngleParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 插入钢管参数结构体
    interface StubTubeParams {
        diameter: number;
        thickness: number;
        slope: number;
        exposedLength: number;
        anchorLength: number;
    }

    function createStubTube(params: StubTubeParams): TopoDS_Shape;
    function createStubTubeWithPosition(
        params: StubTubeParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;


    // 电缆参数结构体
    interface CableWireParams {
        points: gp_Pnt[];
        outsideDiameter: number;
    }

    // 几何体创建函数
    function createCableWire(params: CableWireParams): TopoDS_Shape;
    function createCableWireWithPosition(
        params: CableWireParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆接头参数结构体
    interface CableJointParams {
        length: number;
        outerDiameter: number;
        terminalLength: number;
        innerDiameter: number;
    }

    function createCableJoint(params: CableJointParams): TopoDS_Shape;
    function createCableJointWithPosition(
        params: CableJointParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 光缆接头盒参数结构体
    interface OpticalFiberBoxParams {
        length: number;
        height: number;
        width: number;
    }

    function createOpticalFiberBox(params: OpticalFiberBoxParams): TopoDS_Shape;
    function createOpticalFiberBoxWithPosition(
        params: OpticalFiberBoxParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆终端参数结构体
    interface CableTerminalParams {
        sort: string;
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
    function createCableTerminal(params: CableTerminalParams): TopoDS_Shape;
    function createCableTerminalWithPosition(
        params: CableTerminalParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 接地箱类型枚举
    enum CableBoxType {
        DIRECT_GROUND = "DIRECT_GROUND",
        PROTECTIVE_GROUND = "PROTECTIVE_GROUND",
        CROSS_INTERCONNECT = "CROSS_INTERCONNECT"
    }

    // 接地箱参数结构体
    interface CableAccessoryParams {
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

    function createCableAccessory(params: CableAccessoryParams): TopoDS_Shape;
    function createCableAccessoryWithPosition(
        params: CableAccessoryParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆支架参数结构体
    interface CableBracketParams {
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
    function createCableBracket(params: CableBracketParams): TopoDS_Shape;
    function createCableBracketWithPosition(
        params: CableBracketParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆夹具类型枚举
    enum CableClampType {
        SINGLE = "SINGLE",
        LINEAR = "LINEAR",
        CONTACT_TRIPLE = "CONTACT_TRIPLE",
        SEPARATE_TRIPLE = "SEPARATE_TRIPLE"
    }

    // 电缆夹具参数结构体
    interface CableClampParams {
        type: CableClampType;
        diameter: number;
        thickness: number;
        width: number;
    }

    function createCableClamp(params: CableClampParams): TopoDS_Shape;
    function createCableClampWithPosition(
        params: CableClampParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆立柱参数结构体
    interface CablePoleParams {
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
    function createCablePole(params: CablePoleParams): TopoDS_Shape;
    function createCablePoleWithPosition(
        params: CablePoleParams,
        position: gp_Pnt,
        direction: gp_Dir
    ): TopoDS_Shape;

    // 接地扁铁参数结构体
    interface GroundFlatIronParams {
        length: number;
        height: number;
        thickness: number;
    }

    function createGroundFlatIron(params: GroundFlatIronParams): TopoDS_Shape;
    function createGroundFlatIronWithPosition(
        params: GroundFlatIronParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 预埋件参数结构体
    interface EmbeddedPartParams {
        length: number;
        radius: number;
        height: number;
        materialRadius: number;
        lowerLength: number;
    }

    function createEmbeddedPart(params: EmbeddedPartParams): TopoDS_Shape;
    function createEmbeddedPartWithPosition(
        params: EmbeddedPartParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // U型环参数结构体
    interface UShapedRingParams {
        thickness: number;
        height: number;
        radius: number;
        length: number;
    }

    // 几何体创建函数
    function createUShapedRing(params: UShapedRingParams): TopoDS_Shape;
    function createUShapedRingWithPosition(
        params: UShapedRingParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 吊环参数结构体
    interface LiftingEyeParams {
        height: number;
        ringRadius: number;
        pipeDiameter: number;
    }

    function createLiftingEye(params: LiftingEyeParams): TopoDS_Shape;
    function createLiftingEyeWithPosition(
        params: LiftingEyeParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 连接段截面样式枚举
    enum ConnectionSectionStyle {
        RECTANGULAR = "RECTANGULAR",
        HORSESHOE = "HORSESHOE",
        CIRCULAR = "CIRCULAR"
    }

    // 井类型枚举
    enum TunnelWellType {
        STRAIGHT = "STRAIGHT",
        STRAIGHT_TUNNEL = "STRAIGHT_TUNNEL"
    }

    // 转角井参数结构体
    interface CornerWellParams {
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

    function createCornerWell(params: CornerWellParams): TopoDS_Shape;
    function createCornerWellWithPosition(
        params: CornerWellParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 隧道井类型枚举
    enum TunnelWellType {
        STRAIGHT = "STRAIGHT",
        STRAIGHT_TUNNEL = "STRAIGHT_TUNNEL"
    }

    // 隧道井参数结构体
    interface TunnelWellParams {
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
    function createTunnelWell(params: TunnelWellParams): TopoDS_Shape;
    function createTunnelWellWithPosition(
        params: TunnelWellParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 三通井类型枚举
    enum ThreeWayWellType {
        WORKING_WELL = "WORKING_WELL",
        OPEN_CUT_TUNNEL = "OPEN_CUT_TUNNEL",
        UNDERGROUND_TUNNEL = "UNDERGROUND_TUNNEL"
    }

    // 转角样式枚举
    enum CornerStyle {
        ROUNDED = "ROUNDED",
        ANGLED = "ANGLED"
    }

    // 竖井样式枚举
    enum ShaftStyle {
        CIRCULAR = "CIRCULAR",
        RECTANGULAR = "RECTANGULAR"
    }

    // 三通井参数结构体
    interface ThreeWayWellParams {
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

    function createThreeWayWell(params: ThreeWayWellParams): TopoDS_Shape;
    function createThreeWayWellWithPosition(
        params: ThreeWayWellParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;


    // 四通井类型枚举
    enum FourWayWellType {
        WORKING_WELL = "WORKING_WELL",
        OPEN_CUT_TUNNEL = "OPEN_CUT_TUNNEL",
        UNDERGROUND_TUNNEL = "UNDERGROUND_TUNNEL"
    }

    // 四通井参数结构体
    interface FourWayWellParams {
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
    function createFourWayWell(params: FourWayWellParams): TopoDS_Shape;
    function createFourWayWellWithPosition(
        params: FourWayWellParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 通道点结构体
    interface ChannelPoint {
        position: gp_Pnt;
        type: string;
    }

    interface PipeRowParams {
        pipeType: string;
        hasEnclosure: boolean;
        enclosureWidth: number;
        enclosureHeight: number;
        baseExtension: number;
        baseThickness: number;
        cushionExtension: number;
        cushionThickness: number;
        pipePositions: number[];
        pipeInnerDiameters: number[];
        pipeWallThicknesses: number[];
        pullPipeInnerDiameter: number;
        pullPipeThickness: number;
        points: gp_Pnt[];
    }

    function createPipeRow(params: PipeRowParams): TopoDS_Shape;
    function createPipeRowWithPosition(
        params: PipeRowParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆沟参数结构体
    interface CableTrenchParams {
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
        points: gp_Pnt[];
    }

    // 几何体创建函数
    function createCableTrench(params: CableTrenchParams): TopoDS_Shape;
    function createCableTrenchWithPosition(
        params: CableTrenchParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆隧道样式枚举
    enum CableTunnelStyle {
        ARCH = "ARCH",
        BEAM = "BEAM"
    }

    // 电缆隧道参数结构体
    interface CableTunnelParams {
        style: CableTunnelStyle;
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
        points: gp_Pnt[];
    }

    function createCableTunnel(params: CableTunnelParams): TopoDS_Shape;
    function createCableTunnelWithPosition(
        params: CableTunnelParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆桥架样式枚举
    enum CableTrayStyle {
        ARCH = "ARCH",
        BEAM = "BEAM"
    }

    // 电缆桥架参数结构体
    interface CableTrayParams {
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
        pipePositions: number[];
        pipeInnerDiameters: number[];
        pipeWallThicknesses: number[];
        hasProtectionPlate: boolean;
        points: gp_Pnt[];
    }

    // 几何体创建函数
    function createCableTray(params: CableTrayParams): TopoDS_Shape;
    function createCableTrayWithPosition(
        params: CableTrayParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 电缆L型梁参数结构体
    interface CableLBeamParams {
        length: number;
        width: number;
        height: number;
    }

    function createCableLBeam(params: CableLBeamParams): TopoDS_Shape;
    function createCableLBeamWithPosition(
        params: CableLBeamParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 人孔样式枚举
    enum ManholeStyle {
        CIRCULAR = "CIRCULAR",
        RECTANGULAR = "RECTANGULAR"
    }

    // 人孔参数结构体
    interface ManholeParams {
        style: ManholeStyle;
        length: number;
        width: number;
        height: number;
        wallThickness: number;
    }

    function createManhole(params: ManholeParams): TopoDS_Shape;
    function createManholeWithPosition(
        params: ManholeParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 井盖样式枚举
    enum ManholeCoverStyle {
        CIRCULAR = "CIRCULAR",
        RECTANGULAR = "RECTANGULAR"
    }

    // 井盖参数结构体
    interface ManholeCoverParams {
        style: ManholeCoverStyle;
        length: number;
        width: number;
        thickness: number;
    }

    // 几何体创建函数
    function createManholeCover(params: ManholeCoverParams): TopoDS_Shape;
    function createManholeCoverWithPosition(
        params: ManholeCoverParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 爬梯参数结构体
    interface LadderParams {
        length: number;
        width: number;
        thickness: number;
    }

    function createLadder(params: LadderParams): TopoDS_Shape;
    function createLadderWithPosition(
        params: LadderParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 集水坑参数结构体
    interface SumpParams {
        length: number;
        width: number;
        depth: number;
        bottomThickness: number;
    }

    function createSump(params: SumpParams): TopoDS_Shape;
    function createSumpWithPosition(
        params: SumpParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;


    // 步道参数结构体
    interface FootpathParams {
        height: number;
        width: number;
        points: gp_Pnt[];
    }

    // 几何体创建函数
    function createFootpath(params: FootpathParams): TopoDS_Shape;
    function createFootpathWithPosition(
        params: FootpathParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 竖井参数结构体
    interface ShaftChamberParams {
        supportWallThickness: number;
        supportDiameter: number;
        supportHeight: number;
        topThickness: number;
        innerDiameter: number;
        workingHeight: number;
        outerWallThickness: number;
        innerWallThickness: number;
    }

    function createShaftChamber(params: ShaftChamberParams): TopoDS_Shape;
    function createShaftChamberWithPosition(
        params: ShaftChamberParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 隧道隔板参数结构体
    interface TunnelCompartmentPartitionParams {
        width: number;
        thickness: number;
    }

    function createTunnelCompartmentPartition(
        params: TunnelCompartmentPartitionParams
    ): TopoDS_Shape;
    function createTunnelCompartmentPartitionWithPosition(
        params: TunnelCompartmentPartitionParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;


    // 隧道分区板参数结构体
    interface TunnelPartitionBoardParams {
        style: string;
        length: number;
        width: number;
        thickness: number;
        holeCount: number;
        holePositions: number[];
        holeStyles: string[];
        holeDiameters: number[];
        holeWidths: number[];
    }

    // 几何体创建函数
    function createTunnelPartitionBoard(params: TunnelPartitionBoardParams): TopoDS_Shape;
    function createTunnelPartitionBoardWithPosition(
        params: TunnelPartitionBoardParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 风亭参数结构体
    interface VentilationPavilionParams {
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

    function createVentilationPavilion(params: VentilationPavilionParams): TopoDS_Shape;
    function createVentilationPavilionWithPosition(
        params: VentilationPavilionParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 直通风管参数结构体
    interface StraightVentilationDuctParams {
        diameter: number;
        wallThickness: number;
        height: number;
    }

    function createStraightVentilationDuct(params: StraightVentilationDuctParams): TopoDS_Shape;
    function createStraightVentilationDuctWithPosition(
        params: StraightVentilationDuctParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;


    // 斜通风管参数结构体
    interface ObliqueVentilationDuctParams {
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
    function createObliqueVentilationDuct(params: ObliqueVentilationDuctParams): TopoDS_Shape;
    function createObliqueVentilationDuctWithPosition(
        params: ObliqueVentilationDuctParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 排水井参数结构体
    interface DrainageWellParams {
        length: number;
        width: number;
        height: number;
        neckDiameter: number;
        neckHeight: number;
        cushionExtension: number;
        bottomThickness: number;
        wallThickness: number;
    }

    function createDrainageWell(params: DrainageWellParams): TopoDS_Shape;
    function createDrainageWellWithPosition(
        params: DrainageWellParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 管枕参数结构体
    interface PipeSupportParams {
        style: string;
        count: number;
        positions: number[];
        radii: number[];
        length: number;
        width: number;
        height: number;
    }

    function createPipeSupport(params: PipeSupportParams): TopoDS_Shape;
    function createPipeSupportWithPosition(
        params: PipeSupportParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 盖板参数结构体
    interface CoverPlateParams {
        style: string;
        length: number;
        width: number;
        smallRadius: number;
        largeRadius: number;
        thickness: number;
    }

    // 几何体创建函数
    function createCoverPlate(params: CoverPlateParams): TopoDS_Shape;
    function createCoverPlateWithPosition(
        params: CoverPlateParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 槽盒参数结构体
    interface CableRayParams {
        outerLength: number;
        outerHeight: number;
        innerLength: number;
        innerHeight: number;
        coverThickness: number;
    }

    function createCableRay(params: CableRayParams): TopoDS_Shape;
    function createCableRayWithPosition(
        params: CableRayParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;

    // 水隧道截面样式枚举
    enum WaterTunnelSectionStyle {
        RECTANGULAR = "RECTANGULAR",
        CITYOPENING = "CITYOPENING",
        CIRCULAR = "CIRCULAR",
        HORSESHOE = "HORSESHOE"
    }

    // 水隧道参数结构体
    interface WaterTunnelParams {
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
        points: gp_Pnt[];
    }

    function createWaterTunnel(params: WaterTunnelParams): TopoDS_Shape;
    function createWaterTunnelWithPosition(
        params: WaterTunnelParams,
        position: gp_Pnt,
        direction1: gp_Dir,
        direction2: gp_Dir
    ): TopoDS_Shape;
}