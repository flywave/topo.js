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
