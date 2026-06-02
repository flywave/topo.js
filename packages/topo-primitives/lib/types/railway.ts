import { Version } from "./types";

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
