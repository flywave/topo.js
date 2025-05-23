import { Point, Version } from "./types";

export interface WaterTunnelObject extends Version {
    type: 'WaterTunnel';
    style: 'RECTANGULAR' | 'CITYOPENING' | 'CIRCULAR' | 'HORSESHOE';
    width: number;
    height: number;
    topThickness: number;
    bottomThickness: number;
    outerWallThickness: number;
    innerWallThickness: number;
    arcHeight?: number;
    arcRadius?: number;
    arcAngle?: number;
    bottomPlatformHeight?: number;
    cushionExtension?: number;
    cushionThickness?: number;
    points: Array<{
        position: Point;
        type: number;
    }>;
}