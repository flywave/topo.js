import { Point, Point2, Version } from "./types";

export interface CableWireObject extends Version {
    type: "GIM/EC/CableWire";
    points: Array<{ x: number, y: number, z: number }>; // 电缆路径点坐标
    outsideDiameter: number; // 电缆外径
}

export interface CableJointObject extends Version {
    type: "GIM/EC/CableJoint";
    length: number; // 接头长度
    outerDiameter: number; // 外径
    terminalLength: number; // 端子长度
    innerDiameter: number; // 内径
}

export interface OpticalFiberBoxObject extends Version {
    type: "GIM/EC/OpticalFiberBox";
    length: number; // 长度
    height: number; // 高度
    width: number; // 宽度
}

export interface CableTerminalObject extends Version {
    type: "GIM/EC/CableTerminal";
    sort: number; // 类型(1-3)
    height: number; // 总高度
    topDiameter: number; // 顶部直径
    bottomDiameter: number; // 底部直径
    tailDiameter: number; // 尾部直径
    tailHeight: number; // 尾部高度
    skirtCount: number; // 裙边数量
    upperSkirtTopDiameter: number; // 上裙边顶部直径
    upperSkirtBottomDiameter: number; // 上裙边底部直径
    lowerSkirtTopDiameter: number; // 下裙边顶部直径
    lowerSkirtBottomDiameter: number; // 下裙边底部直径
    skirtSectionHeight: number; // 裙边段高度
    upperTerminalLength: number; // 上端子长度
    upperTerminalDiameter: number; // 上端子直径
    lowerTerminalLength: number; // 下端子长度
    lowerTerminalDiameter: number; // 下端子直径
    hole1Diameter: number; // 孔1直径
    hole2Diameter: number; // 孔2直径
    hole1Distance: number; // 孔1距离
    holeSpacing: number; // 孔间距
    flangeHoleDiameter: number; // 法兰孔直径
    flangeHoleSpacing: number; // 法兰孔间距
    flangeWidth: number; // 法兰宽度
    flangeCenterHoleRadius: number; // 法兰中心孔半径
    flangeChamferRadius: number; // 法兰倒角半径
    flangeOpeningWidth: number; // 法兰开口宽度
    flangeBoltHeight: number; // 法兰螺栓高度
}

export interface CableAccessoryObject extends Version {
    type: "GIM/EC/CableAccessory";
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
    portCount: number; // 端口数量(3或6)
    portDiameter: number; // 端口直径
    portSpacing: number; // 端口间距
    backPanelDistance: number; // 背板距离
    sidePanelDistance: number; // 侧板距离
}

export interface CableBracketObject extends Version {
    type: "GIM/EC/CableBracket";
    length: number; // 长度
    rootHeight: number; // 根部高度
    rootWidth: number; // 根部宽度
    width: number; // 宽度
    topThickness: number; // 顶部厚度
    rootThickness: number; // 根部厚度
    columnMountPoints: Array<Point>; // 立柱安装点
    clampMountPoints: Array<Point>; // 夹具安装点
}

export interface CableClampObject extends Version {
    type: "GIM/EC/CableClamp";
    clampType: 'SINGLE' | 'LINEAR' | 'CONTACT_TRIPLE' | 'SEPARATE_TRIPLE'; // 夹具类型
    diameter: number; // 直径
    thickness: number; // 厚度
    width: number; // 宽度
}

export interface CablePoleObject extends Version {
    type: "GIM/EC/CablePole";
    specification: string; // 规格型号
    length: number; // 长度
    radius: number; // 半径
    arcAngle: number; // 弧角
    width: number; // 宽度
    fixedLegLength: number; // 固定腿长度
    fixedLegWidth: number; // 固定腿宽度
    thickness: number; // 厚度
    mountPoints: Array<Point>; // 安装点
}

export interface GroundFlatIronObject extends Version {
    type: "GIM/EC/GroundFlatIron";
    length: number; // 长度
    height: number; // 高度
    thickness: number; // 厚度
}

export interface EmbeddedPartObject extends Version {
    type: "GIM/EC/EmbeddedPart";
    length: number; // 长度
    radius: number; // 半径
    height: number; // 高度
    materialRadius: number; // 材料半径
    lowerLength: number; // 下部长度
}

export interface UShapedRingObject extends Version {
    type: "GIM/EC/UShapedRing";
    thickness: number; // 厚度
    height: number; // 高度
    radius: number; // 半径
    length: number; // 长度
}

export interface LiftingEyeObject extends Version {
    type: "GIM/EC/LiftingEye";
    height: number; // 高度
    ringRadius: number; // 环半径
    pipeDiameter: number; // 管径
}

export interface CornerWellObject extends Version {
    type: "GIM/EC/CornerWell";
    leftLength: number; // 左侧长度
    rightLength: number; // 右侧长度
    width: number; // 宽度
    height: number; // 高度
    topThickness: number; // 顶部厚度
    bottomThickness: number; // 底部厚度
    wallThickness: number; // 壁厚
    angle: number; // 角度
    cornerRadius: number; // 转角半径
    cushionExtension: number; // 垫层延伸
    cushionThickness: number; // 垫层厚度
}

export interface TunnelWellObject extends Version {
    type: "GIM/EC/TunnelWell";
    wellType: 'STRAIGHT' | 'STRAIGHT_TUNNEL'; // 隧道类型
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
    topThickness: number; // 顶部厚度
    bottomThickness: number; // 底部厚度
    outerWallThickness: number; // 外壁厚度
    cushionExtension: number; // 垫层延伸
    cushionThickness: number; // 垫层厚度
    leftSectionType: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 左侧截面类型
    leftLength: number; // 左侧长度
    leftWidth: number; // 左侧宽度
    leftHeight: number; // 左侧高度
    leftArcHeight: number; // 左侧弧高
    rightSectionType: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 右侧截面类型
    rightLength: number; // 右侧长度
    rightWidth: number; // 右侧宽度
    rightHeight: number; // 右侧高度
    rightArcHeight: number; // 右侧弧高
    radius: number; // 半径
    innerWallThickness: number; // 内壁厚度
}

export interface ThreeWayWellObject extends Version {
    type: "GIM/EC/ThreeWayWell";
    wellType: 'UNDERGROUND_TUNNEL' | 'OPEN_CUT_TUNNEL' | 'WORKING_WELL'; // 类型(1-地下隧道,2-其他)
    cornerType: 'ROUNDED' | 'ANGLED'; // 转角类型(1-圆形,2-方形)
    shaftType: 'CIRCULAR' | 'RECTANGULAR'; // 井筒类型(1-圆形,2-方形)
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
    shaftRadius: number; // 井筒半径
    cornerRadius: number; // 转角半径
    cornerLength: number; // 转角长度
    cornerWidth: number; // 转角宽度
    branchLength: number; // 分支长度
    branchLeftLength: number; // 分支左侧长度
    branchWidth: number; // 分支宽度
    topThickness: number; // 顶部厚度
    bottomThickness: number; // 底部厚度
    leftSectionStyle: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 左侧截面类型(1-矩形,2-马蹄形,3-圆形)
    leftSectionLength: number; // 左侧截面长度
    leftSectionWidth: number; // 左侧截面宽度
    leftSectionHeight: number; // 左侧截面高度
    leftSectionArcHeight: number; // 左侧截面弧高
    rightSectionStyle: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 右侧截面类型
    rightSectionLength: number; // 右侧截面长度
    rightSectionWidth: number; // 右侧截面宽度
    rightSectionHeight: number; // 右侧截面高度
    rightSectionArcHeight: number; // 右侧截面弧高
    branchSectionStyle: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 分支截面类型
    branchSectionLength: number; // 分支截面长度
    branchSectionWidth: number; // 分支截面宽度
    branchSectionHeight: number; // 分支截面高度
    branchSectionArcHeight: number; // 分支截面弧高
    outerWallThickness: number; // 外壁厚度
    innerWallThickness: number; // 内壁厚度
    isDoubleShaft: boolean; // 是否双井筒
    doubleShaftSpacing: number; // 双井筒间距
    outerWallExtension: number; // 外壁延伸
    innerWallExtension: number; // 内壁延伸
    cushionExtension: number; // 垫层延伸
    cushionThickness: number; // 垫层厚度
    innerBottomThickness: number; // 内部底部厚度
    outerBottomThickness: number; // 外部底部厚度
    angle: number; // 角度
}

export interface FourWayWellObject extends Version {
    type: "GIM/EC/FourWayWell";
    wellType: 'UNDERGROUND_TUNNEL' | 'OPEN_CUT_TUNNEL' | 'WORKING_WELL'; // 类型(1-地下隧道,2-其他)
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
    cornerStyle: 'ROUNDED' | 'ANGLED'; // 转角类型(1-圆形,2-方形)
    cornerRadius: number; // 转角半径
    branchLength: number; // 分支长度
    branchWidth: number; // 分支宽度
    topThickness: number; // 顶部厚度
    bottomThickness: number; // 底部厚度
    outerWallThickness: number; // 外壁厚度
    innerWallThickness: number; // 内壁厚度
    cushionExtension: number; // 垫层延伸
    cushionThickness: number; // 垫层厚度
    leftSection: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 左侧截面类型(1-矩形,2-马蹄形,3-圆形)
    rightSection: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 右侧截面类型
    branchSection1: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 分支1截面类型
    branchSection2: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 分支2截面类型
    shaftRadius: number; // 井筒半径
    cornerLength: number; // 转角长度
    cornerWidth: number; // 转角宽度
}

export interface PipeRowObject extends Version {
    type: "GIM/EC/PipeRow";
    pipeType: number; // 管道类型
    hasEnclosure: boolean; // 是否有围护结构
    enclosureWidth: number; // 围护结构宽度
    enclosureHeight: number; // 围护结构高度
    baseExtension: number; // 基础延伸
    baseThickness: number; // 基础厚度
    cushionExtension: number; // 垫层延伸
    cushionThickness: number; // 垫层厚度
    pipePositions: Array<Point2>; // 管道位置坐标
    pipeInnerDiameters: number[]; // 管道内径数组
    pipeWallThicknesses: number[]; // 管道壁厚数组
    pullPipeInnerDiameter: number; // 牵引管内径
    pullPipeThickness: number; // 牵引管壁厚
    points: Array<{
        position: Point;
        type: number;
    }>; // 路径点
}

export interface CableTrenchObject extends Version {
    type: "GIM/EC/CableTrench";
    width: number; // 宽度
    height: number; // 高度
    coverWidth: number; // 盖板宽度
    coverThickness: number; // 盖板厚度
    baseExtension: number; // 基础延伸
    baseThickness: number; // 基础厚度
    cushionExtension: number; // 垫层延伸
    cushionThickness: number; // 垫层厚度
    wallThickness: number; // 壁厚
    wallThickness2: number; // 壁厚2
    points: Array<{
        position: Point;
        type: number;
    }>; // 路径点
}

export interface CableTunnelObject extends Version {
    type: "GIM/EC/CableTunnel";
    style: 'RECTANGULAR' | 'HORSESHOE' | 'CIRCULAR'; // 类型
    width: number; // 宽度
    height: number; // 高度
    topThickness: number; // 顶部厚度
    bottomThickness: number; // 底部厚度
    outerWallThickness: number; // 外壁厚度
    innerWallThickness: number; // 内壁厚度
    arcHeight: number; // 弧高
    bottomPlatformHeight: number; // 底部平台高度
    cushionExtension: number; // 垫层延伸
    cushionThickness: number; // 垫层厚度
    points: Array<{
        position: Point;
        type: number;
    }>; // 路径点
}

export interface CableTrayObject extends Version {
    type: "GIM/EC/CableTray";
    style: 'ARCH' | 'BEAM'; // 桥架类型
    columnDiameter: number; // 立柱直径
    columnHeight: number; // 立柱高度
    span: number; // 跨距
    width: number; // 宽度
    height: number; // 高度
    topPlateHeight: number; // 顶板高度
    arcHeight: number; // 弧高
    wallThickness: number; // 壁厚
    pipeCount: number; // 管道数量
    pipePositions: Array<Point2>; // 管道位置
    pipeInnerDiameters: number[]; // 管道内径数组
    pipeWallThicknesses: number[]; // 管道壁厚数组
    hasProtectionPlate: boolean; // 是否有保护板
    points: Array<{
        position: Point;
        type: number;
    }>; // 路径点
}

export interface CableLBeamObject extends Version {
    type: "GIM/EC/CableLBeam";
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
}

export interface ManholeObject extends Version {
    type: "GIM/EC/Manhole";
    style: 'CIRCULAR' | 'RECTANGULAR'; // 类型
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
    wallThickness: number; // 壁厚
}

export interface ManholeCoverObject extends Version {
    type: "GIM/EC/ManholeCover";
    style: 'CIRCULAR' | 'RECTANGULAR'; // 类型
    length: number; // 长度
    width: number; // 宽度
    thickness: number; // 厚度
}

export interface LadderObject extends Version {
    type: "GIM/EC/Ladder";
    length: number; // 高度
    width: number; // 宽度
    thickness: number; // 厚度
}


export interface SumpObject extends Version {
    type: "GIM/EC/Sump";
    length: number;  // 长度
    width: number;  // 宽度
    depth: number;  // 深度
    bottomThickness: number;  // 底部厚度
}

export interface FootpathObject extends Version {
    type: "GIM/EC/Footpath";
    height: number;  // 高度
    width: number;  // 宽度
    points: Array<{
        position: Point;
        type: number;
    }>;  // 路径点
}

export interface ShaftChamberObject extends Version {
    type: "GIM/EC/ShaftChamber";
    supportWallThickness: number;  // 支撑壁厚
    supportDiameter: number;  // 支撑直径
    supportHeight: number;  // 支撑高度
    topThickness: number;  // 顶部厚度
    innerDiameter: number;  // 内径
    workingHeight: number;  // 工作高度
    outerWallThickness: number;  // 外壁厚度
    innerWallThickness: number;  // 内壁厚度
}

export interface TunnelCompartmentPartitionObject extends Version {
    type: "GIM/EC/TunnelCompartmentPartition";
    width: number;  // 宽度
    thickness: number;  // 厚度
}

export interface VentilationPavilionObject extends Version {
    type: "GIM/EC/VentilationPavilion";
    topLength: number;  // 顶部长度
    middleLength: number;  // 中部长度
    bottomLength: number;  // 底部长度
    topWidth: number;  // 顶部宽度
    middleWidth: number;  // 中部宽度
    bottomWidth: number;  // 底部宽度
    topHeight: number;  // 顶部高度
    height: number;  // 总高度
    baseHeight: number;  // 基础高度
}

export interface TunnelPartitionBoardObject extends Version {
    type: "GIM/EC/TunnelPartitionBoard";
    style: number;  // 类型
    length: number;  // 长度
    width: number;  // 宽度
    thickness: number;  // 厚度
    holeCount: number;  // 孔数量
    holePositions: Array<Point2>;  // 孔位置
    holeStyles: number[];  // 孔类型
    holeDiameters: number[];  // 孔直径
    holeWidths: number[];  // 孔宽度
}

export interface StraightVentilationDuctObject extends Version {
    type: "GIM/EC/StraightVentilationDuct";
    diameter: number;  // 直径
    wallThickness: number;  // 壁厚
    height: number;  // 高度
}

export interface ObliqueVentilationDuctObject extends Version {
    type: "GIM/EC/ObliqueVentilationDuct";
    hoodRoomLength: number;  // 罩室长度
    hoodRoomWidth: number;  // 罩室宽度
    hoodRoomHeight: number;  // 罩室高度
    hoodWallThickness: number;  // 罩室壁厚
    ductCenterHeight: number;  // 风管中心高度
    ductLeftDistance: number;  // 风管左侧距离
    ductDiameter: number;  // 风管直径
    ductWallThickness: number;  // 风管壁厚
    ductLength: number;  // 风管长度
    ductHeightDifference: number;  // 风管高度差
    baseLength: number;  // 基础长度
    baseWidth: number;  // 基础宽度
    baseHeight: number;  // 基础高度
    baseRoomLength: number;  // 基础室长度
    baseRoomWallThickness: number;  // 基础室壁厚
    baseRoomWidth: number;  // 基础室宽度
    baseRoomHeight: number;  // 基础室高度
}

export interface DrainageWellObject extends Version {
    type: "GIM/EC/DrainageWell";
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
    neckDiameter: number; // 颈部直径
    neckHeight: number; // 颈部高度
    cushionExtension: number; // 垫层延伸
    bottomThickness: number; // 底部厚度
    wallThickness: number; // 壁厚
}

export interface PipeSupportObject extends Version {
    type: "GIM/EC/PipeSupport";
    style: number; // 类型(1-2)
    count: number; // 数量
    positions: Array<Point2>; // 位置坐标
    radii: number[]; // 半径数组
    length: number; // 长度
    width: number; // 宽度
    height: number; // 高度
}

export interface CoverPlateObject extends Version {
    type: "GIM/EC/CoverPlate";
    style: string; // 类型
    length: number; // 长度
    width: number; // 宽度
    smallRadius: number; // 小半径
    largeRadius: number; // 大半径
    thickness: number; // 厚度
}

export interface CableRayObject extends Version {
    type: "GIM/EC/CableRay";
    outerLength: number; // 外部长度
    outerHeight: number; // 外部高度
    innerLength: number; // 内部长度
    innerHeight: number; // 内部高度
    coverThickness: number; // 盖板厚度
}