import { Dir, Point, Version } from "./types";

export interface BoredPileBaseObject extends Version {
    type: "GIM/GT/BoredPileBase";
    H1: number; // 上部圆柱高度
    H2: number; // 过渡段高度
    H3: number; // 底部圆柱高度
    H4: number; // 桩头高度
    d: number;  // 上部直径
    D: number;  // 底部直径
}

export interface PileCapBaseObject extends Version {
    type: "GIM/GT/PileCapBase";
    H1: number; // 桩上部圆柱高度
    H2: number; // 桩过渡段高度
    H3: number; // 桩底部圆柱高度
    H4: number; // 承台柱高度
    H5: number; // 承台底板高度
    H6: number; // 桩头高度
    d: number;  // 桩上部直径
    D: number;  // 桩底部直径
    b: number;  // 承台柱直径/边长
    B1: number; // 承台底板宽度
    L1: number; // 承台底板长度
    e1: number; // X方向偏心
    e2: number; // Y方向偏心
    cs: number; // 承台柱样式 (0=圆形, 1=方形)
    ZCOUNT: number; // 桩数量
    ZPOSTARRAY: Point[]; // 桩位置数组
}

export interface RockAnchorBaseObject extends Version {
    type: "GIM/GT/RockAnchorBase";
    H1: number; // 基础底板高度
    H2: number; // 锚桩长度
    d: number;  // 锚桩直径
    B1: number; // 底板宽度
    L1: number; // 底板长度
    ZCOUNT: number; // 锚桩数量
    ZPOSTARRAY: Point[]; // 锚桩位置数组
}

export interface RockPileCapBaseObject extends Version {
    type: "GIM/GT/RockPileCapBase";
    H1: number; // 承台柱高度
    H2: number; // 承台底板高度
    H3: number; // 锚桩长度
    d: number;  // 锚桩直径
    b: number;  // 承台柱直径/边长
    B1: number; // 承台底板宽度
    L1: number; // 承台底板长度
    e1: number; // X方向偏心
    e2: number; // Y方向偏心
    cs: number; // 承台柱样式 (0=圆形, 1=方形)
    ZCOUNT: number; // 锚桩数量
    ZPOSTARRAY: Point[]; // 锚桩位置数组
}

export interface EmbeddedRockAnchorBaseObject extends Version {
    type: "GIM/GT/EmbeddedRockAnchorBase";
    H1: number; // 上部圆柱高度
    H2: number; // 过渡段高度
    H3: number; // 底部圆柱高度
    d: number;  // 上部直径
    D: number;  // 底部直径
}

export interface InclinedRockAnchorBaseObject extends Version {
    type: "GIM/GT/InclinedRockAnchorBase";
    H1: number; // 基础底板高度
    H2: number; // 锚桩长度
    d: number;  // 锚桩直径
    D: number;  // 底部扩大头直径
    B: number;  // 底板宽度
    L: number;  // 底板长度
    e1: number; // X方向偏心
    e2: number; // Y方向偏心
    alpha1: number; // X轴坡度(度)
    alpha2: number; // Y轴坡度(度)
}

export interface ExcavatedBaseObject extends Version {
    type: "GIM/GT/ExcavatedBase";
    H1: number; // 上部圆柱高度
    H2: number; // 过渡段高度
    H3: number; // 底部圆柱高度
    d: number;  // 上部直径
    D: number;  // 底部直径
    alpha1: number; // X轴坡度(度)
    alpha2: number; // Y轴坡度(度)
}

export interface StepBaseObject extends Version {
    type: "GIM/GT/StepBase";
    H: number;  // 基础总高度
    H1: number; // 第一级台阶高度
    H2: number; // 第二级台阶高度
    H3: number; // 第三级台阶高度
    b: number;  // 基础顶部宽度
    B1: number; // 第一级台阶宽度
    B2: number; // 第二级台阶宽度
    B3: number; // 第三级台阶宽度
    L1: number; // 第一级台阶长度
    L2: number; // 第二级台阶长度
    L3: number; // 第三级台阶长度
    N: number;  // 台阶数量(1-3)
}

export interface StepPlateBaseObject extends Version {
    type: "GIM/GT/StepPlateBase";
    H: number;  // 基础总高度
    H1: number; // 第一级台阶高度
    H2: number; // 第二级台阶高度
    H3: number; // 第三级台阶高度
    b: number;  // 柱顶宽度/直径
    B1: number; // 基础底板宽度
    B2: number; // 第一级台阶宽度
    L1: number; // 第一级台阶长度
    L2: number; // 第二级台阶长度
    alpha1: number; // X轴坡度(度)
    alpha2: number; // Y轴坡度(度)
    N: number;  // 台阶数量(1-3)
}

export interface SlopedBaseBaseObject extends Version {
    type: "GIM/GT/SlopedBaseBase";
    H1: number; // 底板前部高度
    H2: number; // 底板后部高度差
    H3: number; // 柱体高度
    b: number;  // 柱体直径
    L1: number; // 底板前部长度
    L2: number; // 底板后部长度
    B1: number; // 底板前部宽度
    B2: number; // 底板后部宽度
    alpha1: number; // X轴坡度(度)
    alpha2: number; // Y轴坡度(度)
}

export interface CompositeCaissonBaseObject extends Version {
    type: "GIM/GT/CompositeCaissonBase";
    H1: number; // 上部沉井高度
    H2: number; // 过渡段高度
    H3: number; // 下部基础高度
    H4: number; // 沉井底部圆管部分高度
    b: number;  // 上部沉井圆筒直径/边长
    D: number;  // 沉井底部圆管外径
    t: number;  // 沉井壁厚
    B1: number; // 过渡段底部宽度
    B2: number; // 下部基础宽度
    L1: number; // 过渡段底部长度
    L2: number; // 下部基础长度
}

export interface RaftBaseObject extends Version {
    type: "GIM/GT/RaftBase";
    H1: number; // 底板高度
    H2: number; // 边梁高度
    H3: number; // 主梁高度 (0表示无主梁)
    b1: number; // 纵向主梁宽度
    b2: number; // 横向主梁宽度
    B1: number; // 底板宽度
    B2: number; // 边梁宽度
    L1: number; // 底板长度
    L2: number; // 边梁长度
}

export interface DirectBuriedBaseObject extends Version {
    type: "GIM/GT/DirectBuriedBase";
    H1: number; // 基础主体高度
    H2: number; // 固定盘高度 (可选)
    d: number;  // 基础主体直径
    D: number;  // 圆形固定盘直径 (可选)
    B: number;  // 方形固定盘边长 (可选)
    t: number;  // 壁厚
}

export interface SteelSleeveBaseObject extends Version {
    type: "GIM/GT/SteelSleeveBase";
    H1: number; // 钢套筒高度
    H2: number; // 底部扩大段高度
    H3: number; // 顶部扩大段高度
    H4: number; // 内部填充高度
    d: number;  // 钢套筒外径
    D1: number; // 底部扩大段外径 (可选)
    D2: number; // 底部扩大段内径 (可选)
    t: number;  // 钢套筒壁厚
    B1: number; // 顶部扩大段外径 (可选)
    B2: number; // 顶部扩大段内径 (可选)
}

export interface PrecastColumnBaseObject extends Version {
    type: "GIM/GT/PrecastColumnBase";
    H1: number; // 柱体高度
    H2: number; // 过渡段上部高度
    H3: number; // 过渡段下部高度
    d: number;  // 柱体直径
    B1: number; // 过渡段上部宽度
    B2: number; // 过渡段下部宽度
    L1: number; // 过渡段上部长度
    L2: number; // 过渡段下部长度
}

export interface PrecastPinnedBaseObject extends Version {
    type: "GIM/GT/PrecastPinnedBase";
    H1: number; // 柱体高度
    H2: number; // 过渡段上部高度
    H3: number; // 过渡段下部高度
    d: number;  // 柱体直径
    B1: number; // 过渡段上部宽度
    B2: number; // 过渡段下部宽度
    L1: number; // 过渡段上部长度
    L2: number; // 过渡段下部长度
    B: number;  // 卡盘宽度
    H: number;  // 卡盘高度
    L: number;  // 卡盘长度
}

export interface PrecastMetalSupportBaseObject extends Version {
    type: "GIM/GT/PrecastMetalSupportBase";
    H1: number; // 底板高度
    H2: number; // 立柱高度
    H3: number; // 连接梁高度
    H4: number; // 斜撑高度差
    b1: number; // 立柱直径
    b2: number; // 连接梁直径
    B1: number; // 底板宽度
    B2: number; // 支架正面根开
    L1: number; // 底板长度
    L2: number; // 支架侧面根开
    S1: number; // 支架规格
    S2: number; // 斜材规格
    n1: number; // 斜材组数
    n2: number; // 板条数量
    HX: number[]; // 斜材层高数组
}

export interface PrecastConcreteSupportBaseObject extends Version {
    type: "GIM/GT/PrecastConcreteSupportBase";
    H1: number; // 底板高度
    H2: number; // 立柱高度
    H3: number; // 连接梁高度
    H4: number; // 支撑顶部高度
    H5: number; // 支撑底部高度
    b1: number; // 立柱直径
    b2: number; // 连接梁直径
    b3: number; // 支撑直径
    B1: number; // 底板宽度
    B2: number; // 支架正面根开
    L1: number; // 底板长度
    L2: number; // 支架侧面根开
    S1: number; // 顶部平台尺寸
    n1: number; // 支撑数量
}

export interface TransmissionLineObject extends Version {
    type: "GIM/GT/TransmissionLine";
    sectionalArea: number; // 截面积(mm²)
    outsideDiameter: number; // 外径(mm)
    wireWeight: number; // 单位长度质量(kg/km)
    coefficientOfElasticity: number; // 弹性系数(N/mm²)
    expansionCoefficient: number; // 线膨胀系数(1/℃)
    ratedStrength: number; // 额定拉断力(N)
}

export interface InsulatorObject extends Version {
    type: "GIM/GT/Insulator";
    subNum: number; // 子串数量
    subType: number; // 子串类型
    splitDistance: number; // 分裂间距
    vAngleLeft: number; // 左侧V型角度
    vAngleRight: number; // 右侧V型角度
    uLinkLength: number; // U型环长度
    weight: number; // 重量
    fittingLengths: {
        leftUpper: number; // 左上金具长度
        rightUpper: number; // 右上金具长度
        leftLower: number; // 左下金具长度
        rightLower: number; // 右下金具长度
    };
    multiLink: {
        count: number; // 多联数量
        spacing: number; // 多联间距
        arrangement: "HORIZONTAL" | "VERTICAL"; // 排列方式
    };
    insulator: {
        radius: number; // 绝缘子半径
        height: number; // 绝缘子高度
        leftCount: number; // 左侧片数
        rightCount: number; // 右侧片数
        material: "CERAMIC" | "GLASS" | "COMPOSITE"; // 材料类型
    };
    gradingRing: {
        count: number; // 均压环数量
        position: number; // 均压环位置
        height: number; // 均压环高度
        radius: number; // 均压环半径
    };
    application: "CONDUCTOR" | "GROUND_WIRE"; // 应用类型
    stringType: "SUSPENSION" | "TENSION"; // 串型类型
}

export interface PoleTowerObject extends Version {
    type: "GIM/GT/PoleTower";
    heights: Array<{
        value: number; // 高度值
        bodyId: string; // 所属塔身ID
        legId: string; // 所属腿柱ID
    }>;
    bodies: Array<{
        id: string; // 塔身ID
        height: number; // 塔身高度
        nodes: Array<{
            // 节点列表
            id: string; // 节点ID
            position: Point; // 节点位置
        }>;
        legs: Array<{
            // 腿柱列表
            id: string; // 腿柱ID
            commonHeight: number; // 通用高度
            specificHeight: number; // 特定高度
            nodes: Array<{
                // 腿柱节点
                id: string;
                position: Point;
            }>;
        }>;
    }>;
    members: Array<{
        // 构件列表
        id: string; // 构件ID
        startNodeId: string; // 起始节点ID
        endNodeId: string; // 结束节点ID
        type: string; // 构件类型
        specification: string; // 规格
        material: string; // 材料
        xDirection: Dir; // X方向
        yDirection: Dir; // Y方向
        end1Diameter: number; // 端部1直径
        end2Diameter: number; // 端部2直径
        thickness: number; // 厚度
        sides: number; // 边数
    }>;
    attachments: Array<{
        // 附件列表
        name: string; // 附件名称
        type: string; // 附件类型
        position: Point;
    }>;
}

export interface SingleHookAnchorObject extends Version {
    type: "GIM/GT/SingleHookAnchor";
    boltDiameter: number; // 螺栓直径
    exposedLength: number; // 外露长度
    nutCount: number; // 螺母数量
    nutHeight: number; // 螺母高度
    nutOD: number; // 螺母外径
    washerCount: number; // 垫圈数量
    washerShape: 'SQUARE' | 'CIRCULAR'; // 垫圈形状 (1-圆形, 2-方形)
    washerSize: number; // 垫圈尺寸
    washerThickness: number; // 垫圈厚度
    anchorLength: number; // 锚固长度
    hookStraightLengthA: number; // 钩直段长度A
    hookStraightLengthB: number; // 钩直段长度B
    hookDiameter: number; // 钩直径
    anchorBarDiameter: number; // 锚筋直径
}

export interface TripleHookAnchorObject extends Version {
    type: "GIM/GT/TripleHookAnchor";
    boltDiameter: number; // 螺栓直径
    exposedLength: number; // 外露长度
    nutCount: number; // 螺母数量
    nutHeight: number; // 螺母高度
    nutOD: number; // 螺母外径
    washerCount: number; // 垫圈数量
    washerShape: 'SQUARE' | 'ROUND'; // 垫圈形状 (1-圆形, 2-方形)
    washerSize: number; // 垫圈尺寸
    washerThickness: number; // 垫圈厚度
    anchorLength: number; // 锚固长度
    hookStraightLength: number; // 钩直段长度
    hookDiameter: number; // 钩直径
}

export interface RibbedAnchorObject extends Version {
    type: "GIM/GT/RibbedAnchor";
    boltDiameter: number; // 螺栓直径
    exposedLength: number; // 外露长度
    nutCount: number; // 螺母数量
    nutHeight: number; // 螺母高度
    nutOD: number; // 螺母外径
    washerCount: number; // 垫圈数量
    washerShape: 'SQUARE' | 'ROUND'; // 垫圈形状 (1-圆形, 2-方形)
    washerSize: number; // 垫圈尺寸
    washerThickness: number; // 垫圈厚度
    anchorLength: number; // 锚固长度
    basePlateSize: number; // 底板尺寸
    ribTopWidth: number; // 肋顶部宽度
    ribBottomWidth: number; // 肋底部宽度
    basePlateThickness: number; // 底板厚度
    ribHeight: number; // 肋高度
    ribThickness: number; // 肋厚度
}

export interface NutAnchorObject extends Version {
    type: "GIM/GT/NutAnchor";
    boltDiameter: number; // 螺栓直径
    exposedLength: number; // 外露长度
    nutCount: number; // 螺母数量
    nutHeight: number; // 螺母高度
    nutOD: number; // 螺母外径
    washerCount: number; // 垫圈数量
    washerShape: 'SQUARE' | 'ROUND'; // 垫圈形状 (1-圆形, 2-方形)
    washerSize: number; // 垫圈尺寸
    washerThickness: number; // 垫圈厚度
    anchorLength: number; // 锚固长度
    basePlateSize: number; // 底板尺寸
    basePlateThickness: number; // 底板厚度
    boltToPlateDistance: number; // 螺栓到底板距离
}

export interface TripleArmAnchorObject extends Version {
    type: "GIM/GT/TripleArmAnchor";
    boltDiameter: number; // 螺栓直径
    exposedLength: number; // 外露长度
    nutCount: number; // 螺母数量
    nutHeight: number; // 螺母高度
    nutOD: number; // 螺母外径
    washerCount: number; // 垫圈数量
    washerShape: 'SQUARE' | 'ROUND'; // 垫圈形状 (1-圆形, 2-方形)
    washerSize: number; // 垫圈尺寸
    washerThickness: number; // 垫圈厚度
    anchorLength: number; // 锚固长度
    armDiameter: number; // 臂直径
    armStraightLength: number; // 臂直段长度
    armBendLength: number; // 臂弯曲段长度
    armBendAngle: number; // 臂弯曲角度(弧度)
}

export interface PositioningPlateAnchorObject extends Version {
    type: "GIM/GT/PositioningPlateAnchor";
    boltDiameter: number; // 螺栓直径
    exposedLength: number; // 外露长度
    nutCount: number; // 螺母数量
    nutHeight: number; // 螺母高度
    nutOD: number; // 螺母外径
    washerCount: number; // 垫圈数量
    washerShape: 'SQUARE' | 'ROUND'; // 垫圈形状 (1-圆形, 2-方形)
    washerSize: number; // 垫圈尺寸
    washerThickness: number; // 垫圈厚度
    anchorLength: number; // 锚固长度
    plateLength: number; // 定位板长度
    plateThickness: number; // 定位板厚度
    toBaseDistance: number; // 到基础距离
    toBottomDistance: number; // 到底部距离
    groutHoleDiameter: number; // 灌浆孔直径
}

export interface StubAngleObject extends Version {
    type: "GIM/GT/StubAngle";
    legWidth: number; // 肢宽
    thickness: number; // 厚度
    slope: number; // 坡度
    exposedLength: number; // 外露长度
    anchorLength: number; // 锚固长度
}

export interface StubTubeObject extends Version {
    type: 'GIM/GT/StubTube';
    diameter: number;        // 管径
    thickness: number;       // 壁厚
    slope: number;          // 坡度
    exposedLength: number;  // 外露长度
    anchorLength: number;   // 锚固长度
}