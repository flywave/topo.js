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
    topDiag1: number;
    topDiag2: number;
    bottomDiag1: number;
    bottomDiag2: number;
    height: number;
}

export interface OffsetRectangularTableObject extends Version {
    type: 'GIM::GS::OffsetRectangularTable';
    topLength: number;
    topWidth: number;
    bottomLength: number;
    bottomWidth: number;
    height: number;
    xOffset: number;
    yOffset: number;
}

export interface CylinderObject extends Version {
    type: 'GIM::GS::Cylinder';
    radius: number;
    height: number;
}

export interface SharpBentCylinderObject extends Version {
    type: 'GIM::GS::SharpBentCylinder';
    radius: number;
    length: number;
    bendAngle: number;
}

export interface TruncatedConeObject extends Version {
    type: 'GIM::GS::TruncatedCone';
    topRadius: number;
    bottomRadius: number;
    height: number;
}

export interface EccentricTruncatedConeObject extends Version {
    type: 'GIM::GS::EccentricTruncatedCone';
    topRadius: number;
    bottomRadius: number;
    height: number;
    topXOffset: number;
    topYOffset: number;
}

export interface RingObject extends Version {
    type: 'GIM::GS::Ring';
    ringRadius: number;
    tubeRadius: number;
    angle: number;
}

export interface RectangularRingObject extends Version {
    type: 'GIM::GS::RectangularRing';
    tubeRadius: number;
    filletRadius: number;
    length: number;
    width: number;
}

export interface EllipticRingObject extends Version {
    type: 'GIM::GS::EllipticRing';
    tubeRadius: number;
    majorRadius: number;
    minorRadius: number;
}

export interface CircularGasketObject extends Version {
    type: 'GIM::GS::CircularGasket';
    outerRadius: number;
    innerRadius: number;
    height: number;
    angle: number;
}

export interface TableGasketObject extends Version {
    type: 'GIM::GS::TableGasket';
    topRadius: number;
    outerRadius: number;
    innerRadius: number;
    height: number;
    angle: number;
}

export interface SquareGasketObject extends Version {
    type: 'GIM::GS::SquareGasket';
    outerLength: number;
    outerWidth: number;
    innerLength: number;
    innerWidth: number;
    height: number;
    cornerType: number;
    cornerParam: number;
}

export interface StretchedBodyObject extends Version {
    type: 'GIM::GS::StretchedBody';
    points: Array<Point>;
    normal: Point;
    length: number;
}

export interface PorcelainBushingObject extends Version {
    type: 'GIM::GS::PorcelainBushing';
    height: number;
    radius: number;
    bigSkirtRadius: number;
    smallSkirtRadius: number;
    count: number;
}

export interface ConePorcelainBushingObject extends Version {
    type: 'GIM::GS::ConePorcelainBushing';
    height: number;
    bottomRadius: number;
    topRadius: number;
    bottomSkirtRadius1: number;
    bottomSkirtRadius2: number;
    topSkirtRadius1: number;
    topSkirtRadius2: number;
    count: number;
}

export interface InsulatorStringObject extends Version {
    type: 'GIM::GS::InsulatorString';
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

export interface VTypeInsulatorObject extends Version {
    type: 'GIM::GS::VTypeInsulator';
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

export interface TerminalBlockObject extends Version {
    type: 'GIM::GS::TerminalBlock';
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

export interface RectangularHolePlateObject extends Version {
    type: 'GIM::GS::RectangularHolePlate';
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

export interface CircularFixedPlateObject extends Version {
    type: 'GIM::GS::CircularFixedPlate';
    length: number;
    width: number;
    thickness: number;
    ringRadius: number;
    holeCount: number;
    hasMiddleHole: boolean;
    holeDiameter: number;
}

export interface WireObject extends Version {
    type: 'GIM::GS::Wire';
    startPoint: Point;
    endPoint: Point;
    startDir: Point;
    endDir: Point;
    sag: number;
    diameter: number;
    fitPoints: Array<Point>;
}

export interface CableObject extends Version {
    type: 'GIM::GS::Cable';
    startPoint: Point;
    endPoint: Point;
    inflectionPoints: Array<Point>;
    radii: number[];
    diameter: number;
}

export type CurveType = 'LINE' | 'ARC' | 'SPLINE';

export interface CurveCableObject extends Version {
    type: 'GIM::GS::CurveCable';
    controlPoints: Array<Array<Point>>;
    curveTypes: CurveType[];
    diameter: number;
}

export interface AngleSteelObject extends Version {
    type: 'GIM::GS::AngleSteel';
    L1: number;
    L2: number;
    X: number;
    length: number;
}

export interface IShapedSteelObject extends Version {
    type: 'GIM::GS::IShapedSteel';
    height: number;
    flangeWidth: number;
    webThickness: number;
    flangeThickness: number;
    length: number;
}

export interface ChannelSteelObject extends Version {
    type: 'GIM::GS::ChannelSteel';
    height: number;
    flangeWidth: number;
    webThickness: number;
    flangeThickness: number;
    length: number;
}

export interface TSteelObject extends Version {
    type: 'GIM::GS::TSteel';
    height: number;
    width: number;
    webThickness: number;
    flangeThickness: number;
    length: number;
}