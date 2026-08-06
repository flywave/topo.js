import { Version } from "./types";

export interface CurvedArmObject extends Version {
    type: 'RAILWAY/CurvedArm';
    verticalLength: number;
    horizontalLength: number;
    bendRadius: number;
    bendAngle: number;
    outerDiameter: number;
    wallThickness: number;
    flangeThickness: number;
    boltSpacing: number;
    boltDiameter: number;
}

export interface MastBracketObject extends Version {
    type: 'RAILWAY/MastBracket';
    boltSpacing: number;
    boltDiameter: number;
    height: number;
    width: number;
    thickness: number;
    insulatorBoltSpacing: number;
    insulatorBoltDiameter: number;
    mountAngle: number;
}

export interface OcsFoundationObject extends Version {
    type: 'RAILWAY/OcsFoundation';
    foundationType?: number;
    height: number;
    width: number;
    length: number;
    flangeThickness: number;
    anchorCount: number;
    anchorDiameter: number;
    anchorLength: number;
    anchorSpacing: number;
}

export interface SteelMastObject extends Version {
    type: 'RAILWAY/SteelMast';
    steelType?: number;
    height: number;
    topWidth: number;
    bottomWidth: number;
    wallThickness: number;
    flangeThickness: number;
    flangeWidth: number;
    anchorSpacing: number;
    anchorDiameter: number;
    segmentCount: number;
}

export interface ConcreteMastObject extends Version {
    type: 'RAILWAY/ConcreteMast';
    sectionType?: number;
    height: number;
    topWidth: number;
    bottomWidth: number;
    wallThickness: number;
    holeDiameter: number;
    holeSpacingV: number;
    holeSpacingH: number;
    firstHoleOffset: number;
    holeRowCount: number;
    holesPerRow: number;
}

export interface RegistrationArmObject extends Version {
    type: 'RAILWAY/RegistrationArm';
    regType?: number;
    length: number;
    tubeWidth: number;
    tubeHeight: number;
    wallThickness: number;
    angle: number;
    isReverse: boolean;
}

export interface RegArmBracketObject extends Version {
    type: 'RAILWAY/RegArmBracket';
    tubeDiameter: number;
    bandWidth: number;
    bandThickness: number;
    bracketHeight: number;
    bracketThickness: number;
    bracketWidth: number;
    mountHoleDiameter: number;
}

export interface CantileverBraceObject extends Version {
    type: 'RAILWAY/CantileverBrace';
    length: number;
    outerDiameter: number;
    wallThickness: number;
    slantAngle: number;
}

export interface SlantCantileverObject extends Version {
    type: 'RAILWAY/SlantCantilever';
    length: number;
    outerDiameter: number;
    wallThickness: number;
    slantAngle: number;
}

export interface LevelCantileverObject extends Version {
    type: 'RAILWAY/LevelCantilever';
    length: number;
    outerDiameter: number;
    wallThickness: number;
    riseAngle: number;
}

export interface CrossArmObject extends Version {
    type: 'RAILWAY/CrossArm';
    beamLength: number;
    beamHeight: number;
    beamWidth: number;
    beamThickness: number;
    beamSpacing: number;
    braceDiameter: number;
    boltSpacing: number;
    boltDiameter: number;
    boltCount: number;
}

export interface GuyWireObject extends Version {
    type: 'RAILWAY/GuyWire';
    length: number;
    diameter: number;
    angle: number;
    ratedTension: number;
    hasInsulator: boolean;
    insulatorCount: number;
    anchorRodDiameter: number;
    anchorRodLength: number;
    anchorPlateLength: number;
    anchorPlateWidth: number;
}

export interface DropperObject extends Version {
    type: 'RAILWAY/Dropper';
    length: number;
    wireDiameter: number;
    clampLength: number;
    clampWidth: number;
    clampThickness: number;
    conductive: boolean;
}

export interface ContactWireObject extends Version {
    type: 'RAILWAY/ContactWire';
    sectionalArea: number;
    diameter: number;
    ratedTension: number;
    grooveDepth: number;
    grooveWidth: number;
    bottomRadius: number;
    topRadius: number;
    sag: number;
}

export interface MessengerWireObject extends Version {
    type: 'RAILWAY/MessengerWire';
    diameter: number;
    ratedTension: number;
    structuralHeight: number;
    sag: number;
}

export interface RodInsulatorObject extends Version {
    type: 'RAILWAY/RodInsulator';
    rodType?: number;
    height: number;
    outerDiameter: number;
    innerDiameter: number;
    shedDiameter: number;
    shedSpacing: number;
    shedCount: number;
    endFitting?: number;
    flangeDiameter: number;
    flangeBoltSpacing: number;
    flangeBoltDiameter: number;
}

// ==========================================================================
// 以下 Object 接口与 topotypes railway 包 (primitives.go) JSON 键名逐一对应
// 几何点字段以 [number, number, number] 保留在数据契约中 (单位 mm)
// ==========================================================================

// 坠砣串内嵌参数 (topotypes WeightStackParams, 内嵌于补偿装置)
export interface WeightStackData {
    blockCount: number;
    blockDiameter: number;
    blockHeight: number;
    blockGap: number;
    rodDiameter: number;
    rodLength: number;
    holeDiameter: number;
}

export interface CantileverBaseObject extends Version {
    type: 'RAILWAY/CantileverBase';
    length: number;
    width: number;
    height: number;
    boltSpacing: number;
    boltDiameter: number;
    boltCount: number;
}

export interface MWSaddleObject extends Version {
    type: 'RAILWAY/MWSaddle';
    length: number;
    width: number;
    height: number;
    grooveRadius: number;
    boltDiameter: number;
}

export interface BalanceWeightObject extends Version {
    type: 'RAILWAY/BalanceWeight';
    width: number;
    thickness: number;
    height: number;
    centerHoleDiameter: number;
}

export interface WeightRodObject extends Version {
    type: 'RAILWAY/WeightRod';
    rodDiameter: number;
    rodLength: number;
    topHoleDiameter: number;
}

export interface AnchorFittingObject extends Version {
    type: 'RAILWAY/AnchorFitting';
    fittingType?: number; // 1=杵环杆, 2=双耳连接器, 3=楔形线夹
    length: number;
    diameter: number;
}

export interface CrossingObject extends Version {
    type: 'RAILWAY/Crossing';
    limitPipeLength: number;
    pipeDiameter: number;
    wireDiameter: number;
    heightDiff: number;
}

export interface HeadSpanObject extends Version {
    type: 'RAILWAY/HeadSpan';
    span: number;
    hangPointCount: number;
    hangPointSpacing: number;
    crossCatenaryDiameter: number;
    crossCatenarySag: number;
    upperRopeDiameter: number;
    lowerRopeDiameter: number;
    insulatorLength: number;
}

export interface TransverseSpanObject extends Version {
    type: 'RAILWAY/TransverseSpan';
    span: number;
    beamType?: number; // 1=箱型, 2=H型, 3=桁架式, 4=组合式
    beamHeight: number;
    beamWidth: number;
    beamThickness: number;
    mastHeight: number;
    mastWidth: number;
}

export interface HangerPostObject extends Version {
    type: 'RAILWAY/HangerPost';
    sectionType?: number; // 1=圆管, 2=方管, 3=H型钢
    length: number;
    sectionSize: number;
    wallThickness: number;
    topFlangeSize: number;
    topFlangeThick: number;
    bottomFlangeSize: number;
    bottomFlangeThick: number;
    boltDiameter: number;
    boltSpacing: number;
}

export interface PortalFrameObject extends Version {
    type: 'RAILWAY/PortalFrame';
    frameHeight: number;
    frameWidth: number;
    postDiameter: number;
    postWallThick: number;
    beamDiameter: number;
    beamWallThick: number;
    beamLength: number;
    basePlateLength: number;
    basePlateWidth: number;
    basePlateThick: number;
    hangPointCount: number;
    hangPointSpacing: number;
    boltSpacing: number;
    boltDiameter: number;
}

export interface SuspensionHardSpanObject extends Version {
    type: 'RAILWAY/SuspensionHardSpan';
    span: number;
    mastHeight: number;
    mastWidth: number;
    cableDiameter: number;
    cableSag: number;
    dropperCableDiameter: number;
    dropperCount: number;
    dropperSpacing: number;
    insulatorLength: number;
    insulatorDiameter: number;
}

export interface PositioningCableObject extends Version {
    type: 'RAILWAY/PositioningCable';
    diameter: number;
    topPoint: [number, number, number];
    bottomPoint: [number, number, number];
    adjustable: boolean;
}

export interface AuxBracketObject extends Version {
    type: 'RAILWAY/AuxBracket';
    bracketType?: number; // 1=横担式, 2=壁挂式, 3=双支柱式
    mountHeight: number;
    overhangLength: number;
    bracketLength: number;
    bracketWidth: number;
    boltSpacing: number;
    boltDiameter: number;
}

export interface RailObject extends Version {
    type: 'RAILWAY/Rail';
    railHeight: number;
    headWidth: number;
    baseWidth: number;
    webThickness: number;
    headHeight: number;
    baseHeight: number;
    headRadius: number;
    standardLength: number;
}

export interface SleeperObject extends Version {
    type: 'RAILWAY/Sleeper';
    shapeType?: number; // 1=矩形, 2=梯形收腰
    length: number;
    width: number;
    height: number;
    gauge: number;
    railBaseWidth: number;
    grooveDepth: number;
    spacing: number;
}

export interface BallastObject extends Version {
    type: 'RAILWAY/Ballast';
    centerline: [number, number, number][];
    topWidth: number;
    thickness: number;
    sideSlope: number;
}

export interface TrackSlabObject extends Version {
    type: 'RAILWAY/TrackSlab';
    length: number;
    width: number;
    thickness: number;
    railSeatCount: number;
    railSeatSpacing: number;
    cementAsphaltThickness: number;
}

export interface FastenerObject extends Version {
    type: 'RAILWAY/Fastener';
    spacing: number;
    gauge: number;
    padThickness: number;
    padLength: number;
    padWidth: number;
}

export interface GuardRailObject extends Version {
    type: 'RAILWAY/GuardRail';
    height: number;
    headWidth: number;
    baseWidth: number;
    grooveWidth: number;
    totalLength: number;
    gaugeDistance: number;
}

export interface MastAssemblyObject extends Version {
    type: 'RAILWAY/MastAssembly';
    mastType: number;       // 1-格构式钢柱, 2-混凝土柱
    mastHeight: number;
    cantileverType: number; // 0-无, 1-单臂, 2-双臂
    hasCrossArm: boolean;
    armDiameter: number;
    stagger: number;
    compType: number;       // 0-无, 1-棘轮, 2-滑轮
    ratedTension: number;
    hasGuyWire: boolean;
    contactHeight: number;
    structureHeight: number;
    sideOffset: number;
}

export interface WeightStackObject extends Version {
    type: 'RAILWAY/WeightStack';
    blockCount: number;
    blockDiameter: number;
    blockHeight: number;
    blockGap: number;
    rodDiameter: number;
    rodLength: number;
    holeDiameter: number;
}

export interface RatchetCompensatorObject extends Version {
    type: 'RAILWAY/RatchetCompensator';
    wheelDiameter: number;
    wheelWidth: number;
    ropeDiameter: number;
    strokeLength: number;
    stack: WeightStackData;
}

export interface AuxiliaryWireObject extends Version {
    type: 'RAILWAY/AuxiliaryWire';
    diameter: number;
    sag: number;
    ratedTension: number;
}

export interface DisconnectorObject extends Version {
    type: 'RAILWAY/Disconnector';
    baseLength: number;
    baseWidth: number;
    insulatorHeight: number;
    bladeLength: number;
    openAngle: number;
}

export interface ArresterObject extends Version {
    type: 'RAILWAY/Arrester';
    height: number;
    outerDiameter: number;
    shedDiameter: number;
    shedSpacing: number;
    shedCount: number;
}

export interface PulleyCompensatorObject extends Version {
    type: 'RAILWAY/PulleyCompensator';
    pulleyDiameter: number;
    grooveWidth: number;
    pulleyCount: number;
    ropeDiameter: number;
    strokeLength: number;
    stack: WeightStackData;
    hasLimitFrame: boolean;
}

export interface SleeveConnectorObject extends Version {
    type: 'RAILWAY/SleeveConnector';
    tubeDiameter: number;
    sleeveLength: number;
    wallThickness: number;
    angle: number;
    boltDiameter: number;
}

export interface SleeveEarObject extends Version {
    type: 'RAILWAY/SleeveEar';
    tubeDiameter: number;
    sleeveLength: number;
    wallThickness: number;
    earHeight: number;
    earThickness: number;
    holeDiameter: number;
}

export interface SwitchRailObject extends Version {
    type: 'RAILWAY/SwitchRail';
    length: number;
    railHeight: number;
    railHeadWidth: number;
    railBaseWidth: number;
    tipWidth: number;
    curveRadius: number;
    isLeftHand: boolean;
}

export interface FrogObject extends Version {
    type: 'RAILWAY/Frog';
    turnoutNo: number;
    gauge: number;
    railHeight: number;
    railHeadWidth: number;
    railBaseWidth: number;
}

export interface TurnoutObject extends Version {
    type: 'RAILWAY/Turnout';
    turnoutNo: number;
    isLeftHand: boolean;
    gauge: number;
    railHeight: number;
    railHeadWidth: number;
    railBaseWidth: number;
    switchRailLength: number;
    leadCurveRadius: number;
    frogLength: number;
    sleeperCount: number;
    sleeperSpacing: number;
}

export interface StraightTrackObject extends Version {
    type: 'RAILWAY/StraightTrack';
    startPoint: [number, number, number];
    endPoint: [number, number, number];
    gauge: number;
    railHeight: number;
    railHeadWidth: number;
    railBaseWidth: number;
    sleeperLength: number;
    sleeperWidth: number;
    sleeperHeight: number;
    sleeperSpacing: number;
    ballastTopWidth: number;
    ballastThickness: number;
    ballastSlope: number;
}

export interface CurveTrackObject extends Version {
    type: 'RAILWAY/CurveTrack';
    curveCenter: [number, number, number];
    startAngle: number;
    sweepAngle: number;
    curveRadius: number;
    gauge: number;
    superElevation: number;
    railHeight: number;
    railHeadWidth: number;
    railBaseWidth: number;
    sleeperLength: number;
    sleeperWidth: number;
    sleeperHeight: number;
    sleeperSpacing: number;
    ballastTopWidth: number;
    ballastThickness: number;
    ballastSlope: number;
}

export interface RailPairObject extends Version {
    type: 'RAILWAY/RailPair';
    centerline: [number, number, number][];
    gauge: number;
    superElevation: number;
    railHeight: number;
    railHeadWidth: number;
    railBaseWidth: number;
}

export interface SleeperLayoutObject extends Version {
    type: 'RAILWAY/SleeperLayout';
    centerline: [number, number, number][];
    length: number;
    width: number;
    height: number;
    spacing: number;
    gauge: number;
}

export interface RetarderPointObject extends Version {
    type: 'RAILWAY/RetarderPoint';
    side: number;       // 1-LEFT, 2-RIGHT, 3-BOTH
    deviceType: number; // 1-液压, 2-摩擦, 3-可控
    mountType: number;  // 1-轨内侧, 2-轨外侧, 3-双轨双侧
    height: number;
    bodyDiameter: number;
    capDiameter: number;
    capHeight: number;
    transitionHeight: number;
    armLength: number;
    armWidth: number;
    armThickness: number;
    boltDiameter: number;
    portDiameter: number;
}
