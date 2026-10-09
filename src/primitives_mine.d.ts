// 矿山专业参数化图元 (minebim P 线, Q/SHJ 0035.3-2012)
// 与 go-topo primitives_mine.hh / src/primitives_bindings.cc MINE 区段一一对应。
// 单位 m; 断面枚举 MineSection。

export declare enum MineSection {
    RECT = 0,
    TRAP = 1,
    ARCH = 2,
    ARC_ARCH = 3,
    HORSESHOE = 4,
    CIRCLE = 5,
    ELLIPSE = 6,
}

// --- 立井井筒 (图例 2/3/4/5/9) ---
export declare interface MineShaftParams {
    shape: number; // 0=圆形 1=矩形
    innerRadius: number;
    outerRadius: number;
    innerLength: number;
    innerWidth: number;
    outerLength: number;
    outerWidth: number;
    depth: number;
}

// --- 煤仓/溜煤眼 (16) ---
export declare interface MineOrepassStation {
    depth: number;
    radius: number;
}

export declare interface MineOrepassParams {
    center: gp_Pnt;
    stations: MineOrepassStation[];
}

// --- 断层破碎带透镜体 (345-355) ---
export declare interface MineFaultLensParams {
    center: gp_Pnt;
    strike: gp_Dir;
    dipAzimuth: gp_Dir;
    dipAngle: number;
    zoneWidth: number;
    zoneLength: number;
    topElev: number;
    bottomElev: number;
}

// --- 支护衬砌壳 ---
export declare interface MineLiningParams {
    section: gp_Pnt[];
    thickness: number;
    length: number;
    dir: gp_Dir;
}

// --- 喷浆壳 (断面枚举式) ---
export declare interface MineShotcreteParams {
    origin: gp_Pnt;
    axis: gp_Dir;
    section: MineSection;
    width: number;
    height: number;
    thickness: number;
    length: number;
}

// --- 巷道 ---
export declare interface MineRoadwayParams {
    section: MineSection;
    width: number;
    height: number;
    path: gp_Pnt[];
}

// --- 硐室 ---
export declare interface MineChamberParams {
    center: gp_Pnt;
    length: number;
    width: number;
    height: number;
}

// --- 长壁工作面 ---
export declare interface MineWorkingfaceParams {
    origin: gp_Pnt;
    dir: gp_Dir;
    faceLength: number;
    advance: number;
    seamThickness: number;
}

// --- 掘进迎头 ---
export declare interface MineHeadingParams {
    center: gp_Pnt;
    dir: gp_Dir;
    section: MineSection;
    width: number;
    height: number;
}

// --- 面状体 (采空区/水仓/积水区) ---
export declare interface MineAreaBodyParams {
    boundary: gp_Pnt[];
    baseZ: number;
    height: number;
}

// --- 锚杆/锚索排 ---
export declare interface MineBoltRowParams {
    origin: gp_Pnt;
    axis: gp_Dir;
    section: MineSection;
    width: number;
    height: number;
    rowCount: number;
    perRow: number;
    spacing: number;
    boltLength: number;
    diameter: number;
    cable: boolean;
}

// --- U型钢支架排 ---
export declare interface MineUsteelRowParams {
    origin: gp_Pnt;
    axis: gp_Dir;
    section: MineSection;
    width: number;
    height: number;
    thickness: number;
    spacing: number;
    count: number;
}

// --- 液压支架排 ---
export declare interface MineShieldRowParams {
    origin: gp_Pnt;
    dir: gp_Dir;
    count: number;
    centerDist: number;
    beamWidth: number;
    beamThick: number;
    height: number;
    maxLegPairs: number;
}

// --- 风墙/密闭 ---
export declare interface MineVentWallParams {
    section: MineSection;
    width: number;
    height: number;
    thickness: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 矩形墙体 (防爆/防火/防水墙) ---
export declare interface MineBoxWallParams {
    width: number;
    height: number;
    thickness: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 风门 ---
export declare interface MineVentDoorParams {
    width: number;
    height: number;
    doorWidth: number;
    doorHeight: number;
    doorThick: number;
    frameWidth: number;
    openAngleDeg: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 调节风窗 ---
export declare interface MineVentWindowParams {
    width: number;
    height: number;
    thickness: number;
    winWidth: number;
    winHeight: number;
    winSill: number;
    bars: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 风桥 ---
export declare interface MineVentBridgeParams {
    span: number;
    width: number;
    thickness: number;
    apex: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 风筒 ---
export declare interface MineVentDuctParams {
    path: gp_Pnt[];
    diameter: number;
}

// --- 测风站 ---
export declare interface MineVentStationParams {
    section: MineSection;
    width: number;
    height: number;
    postWidth: number;
    depth: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 陷落柱 ---
export declare interface MineCollapsePillarParams {
    bottomCenter: gp_Pnt;
    bottomLong: number;
    bottomShort: number;
    topLong: number;
    topShort: number;
    height: number;
}

// --- 水闸墙 ---
export declare interface MineWaterGateWallParams {
    width: number;
    height: number;
    thickness: number;
    doorWidth: number;
    doorHeight: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 水闸门 ---
export declare interface MineWaterGateParams {
    width: number;
    height: number;
    doorWidth: number;
    doorHeight: number;
    doorThick: number;
    frameWidth: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 钻孔 ---
export declare interface MineBoreholeLayer {
    from: number;
    to: number;
}

export declare interface MineBoreholeParams {
    collar: gp_Pnt;
    axis: gp_Dir;
    diameter: number;
    layers: MineBoreholeLayer[];
}

// --- 轨道 ---
export declare interface MineRailTrackParams {
    path: gp_Pnt[];
    gauge: number;
    doubleTrack: boolean;
    centerDistance: number;
    sleeperSpacing: number;
    sleeperMax: number;
}

// --- 道岔 ---
export declare interface MineTurnoutParams {
    origin: gp_Pnt;
    axis: gp_Dir;
    gauge: number;
    frogNo: number;
    length: number;
}

// --- 带式输送机 ---
export declare interface MineBeltParams {
    path: gp_Pnt[];
    beltWidth: number;
    frameHeight: number;
}

// --- 刮板输送机 ---
export declare interface MineScraperParams {
    path: gp_Pnt[];
    panWidth: number;
    panHeight: number;
}

// --- 单轨吊 ---
export declare interface MineMonorailParams {
    path: gp_Pnt[];
    railHeight: number;
    flangeWidth: number;
}

// --- 管路 ---
export declare interface MinePipeRunParams {
    path: gp_Pnt[];
    diameter: number;
    bracketSpacing: number;
}

// --- 三通管件 ---
export declare interface MinePipeFittingParams {
    center: gp_Pnt;
    mainAxis: gp_Dir;
    branchAngleDeg: number;
    mainLength: number;
    branchLength: number;
    diameter: number;
}

// --- 电缆/通讯线 ---
export declare interface MineCableRunParams {
    path: gp_Pnt[];
    diameter: number;
    lines: number;
}

// --- 栅栏/栅栏门 ---
export declare interface MineFenceParams {
    width: number;
    height: number;
    postWidth: number;
    barWidth: number;
    thickness: number;
    bars: number;
    center: gp_Pnt;
    axis: gp_Dir;
}

// --- 水沟 ---
export declare interface MineTrenchParams {
    path: gp_Pnt[];
    section: MineSection;
    width: number;
    height: number;
    sideOffset: number;
}

// --- 交岔点 ---
export declare interface MineJunctionParams {
    center: gp_Pnt;
    mainAxis: gp_Dir;
    branchAngleDeg: number;
    section: MineSection;
    width: number;
    height: number;
    mainLength: number;
    branchLength: number;
    reinforceLength: number;
}

// --- 钢带/W钢带 ---
export declare interface MineSteelBandParams {
    length: number;
    width: number;
    thickness: number;
    holeCount: number;
    holeDia: number;
    holeEdge: number;
}

// 创建函数 (命名与 Embind 注册一致)
export declare function createMineShaft(params: MineShaftParams): TopoDS_Shape;
export declare function createMineShaftAt(params: MineShaftParams, collarCenter: gp_Pnt): TopoDS_Shape;
export declare function createMineOrepass(params: MineOrepassParams): TopoDS_Shape;
export declare function createMineFaultLens(params: MineFaultLensParams): TopoDS_Shape;
export declare function createMineLining(params: MineLiningParams): TopoDS_Shape;
export declare function createMineShotcrete(params: MineShotcreteParams): TopoDS_Shape;
export declare function createMineRoadway(params: MineRoadwayParams): TopoDS_Shape;
export declare function createMineChamber(params: MineChamberParams): TopoDS_Shape;
export declare function createMineWorkingface(params: MineWorkingfaceParams): TopoDS_Shape;
export declare function createMineHeading(params: MineHeadingParams): TopoDS_Shape;
export declare function createMineAreaBody(params: MineAreaBodyParams): TopoDS_Shape;
export declare function createMineBoltRow(params: MineBoltRowParams): TopoDS_Shape;
export declare function createMineUsteelRow(params: MineUsteelRowParams): TopoDS_Shape;
export declare function createMineShieldRow(params: MineShieldRowParams): TopoDS_Shape;
export declare function createMineVentWall(params: MineVentWallParams): TopoDS_Shape;
export declare function createMineBoxWall(params: MineBoxWallParams): TopoDS_Shape;
export declare function createMineVentDoor(params: MineVentDoorParams): TopoDS_Shape;
export declare function createMineVentWindow(params: MineVentWindowParams): TopoDS_Shape;
export declare function createMineVentBridge(params: MineVentBridgeParams): TopoDS_Shape;
export declare function createMineVentDuct(params: MineVentDuctParams): TopoDS_Shape;
export declare function createMineVentStation(params: MineVentStationParams): TopoDS_Shape;
export declare function createMineCollapsePillar(params: MineCollapsePillarParams): TopoDS_Shape;
export declare function createMineWaterGateWall(params: MineWaterGateWallParams): TopoDS_Shape;
export declare function createMineWaterGate(params: MineWaterGateParams): TopoDS_Shape;
export declare function createMineBorehole(params: MineBoreholeParams): TopoDS_Shape;
export declare function createMineRailTrack(params: MineRailTrackParams): TopoDS_Shape;
export declare function createMineTurnout(params: MineTurnoutParams): TopoDS_Shape;
export declare function createMineBelt(params: MineBeltParams): TopoDS_Shape;
export declare function createMineScraper(params: MineScraperParams): TopoDS_Shape;
export declare function createMineMonorail(params: MineMonorailParams): TopoDS_Shape;
export declare function createMinePipeRun(params: MinePipeRunParams): TopoDS_Shape;
export declare function createMinePipeFitting(params: MinePipeFittingParams): TopoDS_Shape;
export declare function createMineCableRun(params: MineCableRunParams): TopoDS_Shape;
export declare function createMineFence(params: MineFenceParams): TopoDS_Shape;
export declare function createMineTrench(params: MineTrenchParams): TopoDS_Shape;
export declare function createMineJunction(params: MineJunctionParams): TopoDS_Shape;
export declare function createMineSteelBand(params: MineSteelBandParams): TopoDS_Shape;
