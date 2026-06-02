import { Version } from "./types";

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
