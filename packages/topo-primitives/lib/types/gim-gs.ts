import { Point, Version } from "./types";

export interface SphereObject extends Version {
    type: 'GIM::GS::Sphere';
    radius: number;
}

export interface RotationalEllipsoidObject extends Version {
    type: 'GIM::GS::RotationalEllipsoid';
    polarRadius: number;
    equatorialRadius: number;
    height: number;
}

export interface CuboidObject extends Version {
    type: 'GIM::GS::Cuboid';
    length: number;
    width: number;
    height: number;
}

export interface DiamondFrustumObject extends Version {
    type: 'GIM::GS::DiamondFrustum';
    topDiag1: number;    // 顶面对角线1长度 (TL1=1680)
    topDiag2: number;    // 顶面对角线2长度 (TL2=970)
    bottomDiag1: number; // 底面对角线1长度 (LL1=1080)
    bottomDiag2: number; // 底面对角线2长度 (LL2=620)
    height: number;      // 高度 (H)
}

export interface OffsetRectangularTableObject extends Version {
    type: 'GIM::GS::OffsetRectangularTable';
    topLength: number;    // 上部矩形长度 (L1)
    topWidth: number;     // 上部矩形宽度 (W1)
    bottomLength: number; // 下部矩形长度 (L2)
    bottomWidth: number;  // 下部矩形宽度 (W2)
    height: number;       // 高度 (H)
    xOffset: number;      // X方向偏移 (X)
    yOffset: number;      // Y方向偏移 (Y)
}

export interface CylinderObject extends Version {
    type: 'GIM::GS::Cylinder';
    radius: number; // 半径 (R)
    height: number; // 高度 (H)
}

export interface SharpBentCylinderObject extends Version {
    type: 'GIM::GS::SharpBentCylinder';
    radius: number;    // 圆柱半径 (R > 0)
    length: number;    // 直线段长度 (L > 0)
    bendAngle: number; // 弯折弧度 (0 < Rad < PI)
}

export interface TruncatedConeObject extends Version {
    type: 'GIM::GS::TruncatedCone';
    topRadius: number;    // 顶部半径 (R1 > 0)
    bottomRadius: number; // 底部半径 (R2 > 0)
    height: number;       // 高度 (H > 0)
}

export interface EccentricTruncatedConeObject extends Version {
    type: 'GIM::GS::EccentricTruncatedCone';
    topRadius: number;    // 顶部半径 (TR ≥ 0)
    bottomRadius: number; // 底部半径 (BR ≥ TR)
    height: number;       // 高度 (H > 0)
    topXOffset: number;   // X方向顶部偏移 (TOPXOFF ≥ 0)
    topYOffset: number;   // Y方向顶部偏移 (TOPYOFF ≥ 0)
}

export interface RingObject extends Version {
    type: 'GIM::GS::Ring';
    ringRadius: number; // 环半径 (R > 0)
    tubeRadius: number; // 管半径 (0 < DR < R)
    angle: number;      // 旋转角度(弧度) (0 < Rad ≤ 2PI)
}

export interface RectangularRingObject extends Version {
    type: 'GIM::GS::RectangularRing';
    tubeRadius: number;   // 管半径 (0 < DR < W)
    filletRadius: number; // 倒角半径 (R < W/2)
    length: number;       // 环长度 (L > W)
    width: number;        // 环宽度 (W > 0)
}

export interface EllipticRingObject extends Version {
    type: 'GIM::GS::EllipticRing';
    tubeRadius: number;  // 管半径 (0 < DR < W)
    majorRadius: number; // 长半轴 (L > W)
    minorRadius: number; // 短半轴 (W > 0)
}

export interface CircularGasketObject extends Version {
    type: 'GIM::GS::CircularGasket';
    outerRadius: number; // 外围半径 (OR > IR)
    innerRadius: number; // 内围半径 (0 < IR < OR)
    height: number;      // 高度 (H > 0)
    angle: number;       // 弧度 (0 < Rad ≤ 2PI)
}

export interface TableGasketObject extends Version {
    type: 'GIM::GS::TableGasket';
    topRadius: number;   // 顶部外围半径 (IR < TR < OR)
    outerRadius: number; // 底部外围半径 (OR > TR)
    innerRadius: number; // 内围半径 (0 < IR < TR)
    height: number;      // 高度 (H > 0)
    angle: number;       // 弧度 (0 < Rad ≤ 2PI)
}

export interface SquareGasketObject extends Version {
    type: 'GIM::GS::SquareGasket';
    outerLength: number; // 外围长度 (L > W)
    outerWidth: number;  // 外围宽度 (W > 0)
    innerLength: number; // 内围长度 (0 < IL < L)
    innerWidth: number;  // 内围宽度 (0 < IW < W)
    height: number;      // 高度 (H > 0)
    cornerType: number;  // 角点类型 (1: 圆形, 2: 矩形, 3: 椭圆)
    cornerParam: number; // 角点参数 (根据cornerType设置)
}

export interface StretchedBodyObject extends Version {
    type: 'GIM::GS::StretchedBody';
    points: Array<Point>; // 底面顶点坐标数组
    normal: Point;        // 拉伸方向向量
    length: number;       // 拉伸长度 (L > 0)
}

export interface PorcelainBushingObject extends Version {
    type: 'GIM::GS::PorcelainBushing';
    height: number;           // 总高度 (H > 0)
    radius: number;           // 瓷套外半径 (R > 0)
    bigSkirtRadius: number;   // 大伞裙半径 (R1 ≥ R2)
    smallSkirtRadius: number; // 小伞裙半径 (R2 > R)
    count: number;           // 伞裙片数 (N > 0)
}

export interface ConePorcelainBushingObject extends Version {
    type: 'GIM::GS::ConePorcelainBushing';
    height: number;             // 总高度 (H > 0)
    bottomRadius: number;       // 底部绝缘子半径 (BR > 0)
    topRadius: number;          // 顶部绝缘子半径 (TR > 0)
    bottomSkirtRadius1: number; // 底部伞裙半径1 (BR1 > BR)
    bottomSkirtRadius2: number; // 底部伞裙半径2 (BR2 > BR)
    topSkirtRadius1: number;    // 顶部伞裙半径1 (TR1 > TR)
    topSkirtRadius2: number;    // 顶部伞裙半径2 (TR2 > TR)
    count: number;              // 伞裙片数 (N > 0)
}

export interface InsulatorStringObject extends Version {
    type: 'GIM::GS::InsulatorString';
    count: number;               // 联数 (N > 0)
    spacing: number;            // 双串间距 (D > 2*R1)
    insulatorCount: number;     // 单串绝缘子片数量 (N1 > 0)
    height: number;            // 绝缘子单片连接高度 (H1 > 0)
    bigSkirtRadius: number;    // 大伞裙半径 (R1 ≥ R2)
    smallSkirtRadius: number;  // 小伞裙半径 (R2 > R)
    radius: number;            // 绝缘子串半径 (R > 0)
    frontLength: number;       // 前端长度（构架端） (FL > 0)
    backLength: number;        // 后端长度（导线端） (AL > 0)
    splitCount: number;        // 连接导线分裂数 (LN > 0)
}

export interface VTypeInsulatorObject extends Version {
    type: 'GIM::GS::VTypeInsulator';
    frontSpacing: number;      // 前端间距 (X > 0)
    backSpacing: number;       // 后端间距 (AD > 0)
    insulatorCount: number;    // 单串绝缘子片数量 (N1 > 0)
    height: number;            // 绝缘子单片连接高度 (H1 > 0)
    radius: number;           // 伞顶面半径 (R > 0)
    bigSkirtRadius: number;    // 大伞半径 (R1 > R2)
    smallSkirtRadius: number;  // 小伞半径 (R2 > 0)
    frontLength: number;       // 前段长度（构架端） (FL > 0)
    backLength: number;        // 后段长度（导线端） (AL > 0)
    splitCount: number;       // 连接导线分裂数 (LN > 0)
}

export interface TerminalBlockObject extends Version {
    type: 'GIM::GS::TerminalBlock';
    length: number;        // 长度 (L > W)
    width: number;         // 宽度 (W > 0)
    thickness: number;     // 厚度 (T > 0)
    chamferLength: number; // 倒角边长 (CL > 0)
    columnSpacing: number; // 孔列间距 (CS > 0)
    rowSpacing: number;    // 孔行间距 (RS > 0)
    holeRadius: number;    // 孔半径 (R > 0)
    columnCount: number;   // 开孔列数 (CN > 0)
    rowCount: number;      // 开孔行数 (RN > 0)
    bottomOffset: number;  // 孔行距底边距离 (BL > 0)
}

export interface RectangularHolePlateObject extends Version {
    type: 'GIM::GS::RectangularHolePlate';
    length: number;        // 长度 (L > 0)
    width: number;         // 宽度 (W > 0)
    thickness: number;     // 厚度 (T > 0)
    columnSpacing: number; // 孔列间距 (CS > 0)
    rowSpacing: number;    // 孔行间距 (RS > 0)
    columnCount: number;   // 开孔列数 (CN > 0)
    rowCount: number;      // 开孔行数 (RN > 0)
    hasMiddleHole: boolean; // 是否有中间孔 (MH = 1/0)
    holeDiameter: number;  // 孔直径 (D > 0)
}

export interface CircularFixedPlateObject extends Version {
    type: 'GIM::GS::CircularFixedPlate';
    length: number;       // 长度 (L > 0)
    width: number;        // 宽度 (W > 0)
    thickness: number;    // 厚度 (T > 0)
    ringRadius: number;   // 开孔环半径 (CS > 0)
    holeCount: number;    // 开孔数 (N > 0)
    hasMiddleHole: boolean; // 是否有中间孔 (MH = 1/0)
    holeDiameter: number; // 孔直径 (D > 0)
}

export interface WireObject extends Version {
    type: 'GIM::GS::Wire';
    startPoint: Point;     // 起点坐标
    endPoint: Point;       // 终点坐标
    startDir: Point;       // 起始出线方向
    endDir: Point;         // 终止出线方向
    sag: number;           // 导线弧垂 (Sag > 0)
    diameter: number;      // 导线直径 (D > 0)
    fitPoints: Array<Point>; // 拟合点集 (至少2个点)
}

export interface CableObject extends Version {
    type: 'GIM::GS::Cable';
    startPoint: Point;      // 起点坐标
    endPoint: Point;        // 终点坐标
    inflectionPoints: Array<Point>; // 虚交点坐标数组
    radii: number[];       // 虚交点转弯半径数组
    diameter: number;      // 电缆直径 (D > 0)
}

export type CurveType = 'LINE' | 'ARC' | 'BEZIER';

export interface CurveCableObject extends Version {
    type: 'GIM::GS::CurveCable';
    controlPoints: Array<Array<Point>>; // 控制点集合
    curveTypes: CurveType[];            // 曲线类型数组
    diameter: number;                   // 电缆直径
}

export interface AngleSteelObject extends Version {
    type: 'GIM::GS::AngleSteel';
    L1: number;     // 长边长度 (L1 > 0)
    L2: number;     // 短边长度 (0 < L2 < L1)
    X: number;      // 厚度 (0 < X < min(L1,L2))
    length: number; // 长度 (length > 0)
}

export interface IShapedSteelObject extends Version {
    type: 'GIM::GS::IShapedSteel';
    height: number;          // 总高度 (H > 0)
    flangeWidth: number;     // 翼缘宽度 (B > 0)
    webThickness: number;    // 腹板厚度 (t1 > 0)
    flangeThickness: number; // 翼缘厚度 (t2 > 0)
    length: number;          // 长度 (L > 0)
}

export interface ChannelSteelObject extends Version {
    type: 'GIM::GS::ChannelSteel';
    height: number;          // 总高度 (H > 0)
    flangeWidth: number;     // 翼缘宽度 (B > 0)
    webThickness: number;    // 腹板厚度 (t1 > 0)
    flangeThickness: number; // 翼缘厚度 (t2 > 0)
    length: number;          // 长度 (L > 0)
}

export interface TSteelObject extends Version {
    type: 'GIM::GS::TSteel';
    height: number;          // 高度 (H > 0)
    width: number;           // 宽度 (W > 0)
    webThickness: number;    // 腹板厚度 (T1 > 0)
    flangeThickness: number; // 翼缘厚度 (T2 > 0)
    length: number;          // 长度 (L > 0)
}