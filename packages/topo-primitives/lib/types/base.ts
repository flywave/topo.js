import { Dir, Point, Version } from "./types";

export interface TriangleProfile {
    type: 'TRIANGLE';
    p1: Point;
    p2: Point;
    p3: Point;
}

export interface RectangleProfile {
    type: 'RECTANGLE';
    p1: Point;
    p2: Point;
}

export interface CircProfile {
    type: 'CIRC';
    center: Point;
    norm: Point;
    radius: number;
}

export interface ElipsProfile {
    type: 'ELIPS';
    s1: Point;
    s2: Point;
    center: Point;
}

export interface PolygonProfile {
    type: 'POLYGON';
    edges: Point[];
    inners?: Point[][];
}

export type ShapeProfile = TriangleProfile | RectangleProfile | CircProfile | ElipsProfile | PolygonProfile;

export interface RevolObject extends Version {
    type: 'Revol';
    profile: ShapeProfile;
    axis: {
        location: Point;
        direction: Dir;
    };
    angle: number;
}

export interface PrismObject extends Version {
    type: 'Prism';
    profile: ShapeProfile;
    dir: Dir;
}

export type SegmentType = 'LINE' | 'THREE_POINT_ARC' | 'CIRCLE_CENTER_ARC' | 'SPLINE';

export type TransitionMode = 'TRANSFORMED' | 'ROUND' | 'RIGHT';

export interface PipeObject extends Version {
    type: 'Pipe';
    wire: Point[];
    profile: [ShapeProfile, ShapeProfile];
    innerProfile: [ShapeProfile, ShapeProfile] | null;
    segmentType: SegmentType;
    transitionMode: TransitionMode;
    upDir?: Dir | null;
}

export interface MultiSegmentPipePrimitiveObject extends Version {
    type: 'MultiSegmentPipe';
    wires: Point[][];
    profiles: ShapeProfile[];
    innerProfiles: ShapeProfile[] | null;
    segmentTypes: SegmentType[];
    transitionMode: TransitionMode;
    upDir?: Dir | null;
}

export interface PipeJointEndpoint {
    offset: Point;
    normal: Dir;
    profile: ShapeProfile;
    innerProfile: ShapeProfile | null;
}

export interface PipeJointObject extends Version {
    type: 'PipeJoint';
    ins: PipeJointEndpoint[];
    outs: PipeJointEndpoint[];
    mode: 'SPHERE' | 'BOX' | 'CYLINDER';
    flanged: boolean;
    upDir?: Dir | null;
}

export interface CatenaryObject extends Version {
    type: 'Catenary';
    p1: Point;
    p2: Point;
    profile: ShapeProfile;
    slack: number;
    maxSag: number;
    tessellation: number;
    upDir: Dir | null;
}

export interface BoxShapeObject extends Version {
    type: 'BoxShape';
    point1: Point;
    point2: Point;
}

export interface ConeShapeObject extends Version {
    type: 'ConeShape';
    radius1: number;
    radius2: number;
    height: number;
    angle?: number;
}

export interface CylinderShapeObject extends Version {
    type: 'CylinderShape';
    radius: number;
    height: number;
    angle?: number;
}

export interface RevolutionShapeObject extends Version {
    type: 'RevolutionShape';
    meridian: Point[];
    angle?: number;
    max?: number;
    min?: number;
}

export interface SphereShapeObject extends Version {
    type: 'SphereShape';
    center?: Point;
    radius: number;
    angle1?: number;
    angle2?: number;
    angle?: number;
}

export interface TorusShapeObject extends Version {
    type: 'TorusShape';
    radius1: number;
    radius2: number;
    angle1?: number;
    angle2?: number;
    angle?: number;
}

export interface WedgeShapeObject extends Version {
    type: 'WedgeShape';
    edge: Point;
    limit?: [number, number, number, number];
    ltx?: number;
}

export interface PipeShapeObject extends Version {
    type: 'PipeShape';
    wire: Point[];
    profile: ShapeProfile;
    upDir?: Dir;
}