import { Dir, Point, Version } from "./types";

export interface BoredPileBaseObject extends Version {
    type: "GIM/GT/BoredPileBase";
    H1: number; // 上部圆柱高度
    H2: number; // 过渡段高度
    H3: number; // 底部圆柱高度
    H4: number; // 桩头高度
    d: number; // 上部直径
    D: number; // 底部直径
}

export interface PileCapBaseObject extends Version {
    type: "GIM/GT/PileCapBase";
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
    ZPOSTARRAY: Point[];
}

export interface RockAnchorBaseObject extends Version {
    type: "GIM/GT/RockAnchorBase";
    H1: number;
    H2: number;
    d: number;
    B1: number;
    L1: number;
    ZCOUNT: number;
    ZPOSTARRAY: Point[];
}

export interface RockPileCapBaseObject extends Version {
    type: "GIM/GT/RockPileCapBase";
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
    ZPOSTARRAY: Point[];
}

export interface EmbeddedRockAnchorBaseObject extends Version {
    type: "GIM/GT/EmbeddedRockAnchorBase";
    H1: number;
    H2: number;
    H3: number;
    d: number;
    D: number;
}

export interface InclinedRockAnchorBaseObject extends Version {
    type: "GIM/GT/InclinedRockAnchorBase";
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

export interface ExcavatedBaseObject extends Version {
    type: "GIM/GT/ExcavatedBase";
    H1: number;
    H2: number;
    H3: number;
    d: number;
    D: number;
    alpha1: number;
    alpha2: number;
}

export interface StepBaseObject extends Version {
    type: "GIM/GT/StepBase";
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

export interface StepPlateBaseObject extends Version {
    type: "GIM/GT/StepPlateBase";
    H: number;
    H1: number;
    H2: number;
    H3: number;
    b: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
    alpha1: number;
    alpha2: number;
    N: number;
}

export interface SlopedBaseBaseObject extends Version {
    type: "GIM/GT/SlopedBaseBase";
    H1: number;
    H2: number;
    H3: number;
    b: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
    alpha1: number;
    alpha2: number;
}

export interface CompositeCaissonBaseObject extends Version {
    type: "GIM/GT/CompositeCaissonBase";
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

export interface RaftBaseObject extends Version {
    type: "GIM/GT/RaftBase";
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

export interface DirectBuriedBaseObject extends Version {
    type: "GIM/GT/DirectBuriedBase";
    H1: number;
    H2: number;
    d: number;
    D: number;
    B: number;
    t: number;
}

export interface SteelSleeveBaseObject extends Version {
    type: "GIM/GT/SteelSleeveBase";
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

export interface PrecastColumnBaseObject extends Version {
    type: "GIM/GT/PrecastColumnBase";
    H1: number;
    H2: number;
    H3: number;
    d: number;
    B1: number;
    B2: number;
    L1: number;
    L2: number;
}

export interface PrecastPinnedBaseObject extends Version {
    type: "GIM/GT/PrecastPinnedBase";
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

export interface PrecastMetalSupportBaseObject extends Version {
    type: "GIM/GT/PrecastMetalSupportBase";
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

export interface PrecastConcreteSupportBaseObject extends Version {
    type: "GIM/GT/PrecastConcreteSupportBase";
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

export interface TransmissionLineObject extends Version {
    type: "GIM/GT/TransmissionLine";
    sectionalArea: number;
    outsideDiameter: number;
    wireWeight: number;
    coefficientOfElasticity: number;
    expansionCoefficient: number;
    ratedStrength: number;
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
    washerShape: number; // 垫圈形状 (1-圆形, 2-方形)
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
    washerShape: number; // 垫圈形状 (1-圆形, 2-方形)
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
    washerShape: number; // 垫圈形状 (1-圆形, 2-方形)
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
    washerShape: number; // 垫圈形状 (1-圆形, 2-方形)
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
    washerShape: number; // 垫圈形状 (1-圆形, 2-方形)
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
    washerShape: number; // 垫圈形状 (1-圆形, 2-方形)
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