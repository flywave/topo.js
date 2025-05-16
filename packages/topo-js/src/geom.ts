import { getTopo } from "./topolib";

import type {
    gp_Ax1,
    gp_Ax2,
    gp_Ax3,
    gp_Vec,
    gp_XYZ,
    gp_Dir,
    gp_Pnt,
    Vector,
    PlaneName,
    Plane,
} from "topo-wasm";

const round3 = (v: number) => Math.round(v * 1000) / 1000;

export type SimplePoint = [number, number, number];
export type Point =
    | SimplePoint
    | Vector
    | [number, number]
    | { XYZ: () => gp_XYZ; delete: () => void };

export function isPoint(p: unknown): p is Point {
    const oc = getTopo();
    if (Array.isArray(p)) return p.length === 3 || p.length === 2;
    else if (p instanceof oc.Vector) return true;
    else if (p && typeof (p as any)?.XYZ === "function") return true;
    return false;
}

export const makeAx3 = (center: Point, dir: Point, xDir?: Point): gp_Ax3 => {
    const oc = getTopo();
    const origin = asPnt(center);
    const direction = asDir(dir);

    let axis: gp_Ax3;
    if (xDir) {
        const xDirection = asDir(xDir);
        axis = new oc.gp_Ax3_3(origin, direction, xDirection);
        xDirection.delete();
    } else {
        axis = new oc.gp_Ax3_4(origin, direction);
    }
    origin.delete();
    direction.delete();
    return axis;
};

export const makeAx2 = (center: Point, dir: Point, xDir?: Point): gp_Ax2 => {
    const oc = getTopo();
    const origin = asPnt(center);
    const direction = asDir(dir);

    let axis: gp_Ax2;
    if (xDir) {
        const xDirection = asDir(xDir);
        axis = new oc.gp_Ax2_2(origin, direction, xDirection);
        xDirection.delete();
    } else {
        axis = new oc.gp_Ax2_3(origin, direction);
    }
    origin.delete();
    direction.delete();
    return axis;
};

export const makeAx1 = (center: Point, dir: Point): gp_Ax1 => {
    const oc = getTopo();
    const origin = asPnt(center);
    const direction = asDir(dir);
    const axis = new oc.gp_Ax1_2(origin, direction);
    origin.delete();
    direction.delete();
    return axis;
};

export const makeVec = (vector: Point = [0, 0, 0]): gp_Vec => {
    const oc = getTopo();

    if (Array.isArray(vector)) {
        if (vector.length === 3) return new oc.gp_Vec_4(...vector);
        else if (vector.length === 2) return new oc.gp_Vec_4(...vector, 0);
    } else if (vector instanceof oc.Vector) {
        return new oc.gp_Vec_3(vector.toXYZ());
    } else if (vector.XYZ) return new oc.gp_Vec_3(vector.XYZ());
    return new oc.gp_Vec_4(0, 0, 0);
};

export function makeVector(vector: Point): Vector {
    const oc = getTopo();

    if (Array.isArray(vector)) {
        if (vector.length === 2) return new oc.Vector(...vector, 0);
        if (vector.length === 3) return new oc.Vector(...vector);
    } else if (vector instanceof oc.Vector) {
        return vector;
    } else if (vector.XYZ) {
        return new oc.Vector(vector.XYZ());
    }
    return new oc.Vector();
}

type Direction = Point | "X" | "Y" | "Z";

const DIRECTIONS: Record<string, Point> = {
    X: [1, 0, 0],
    Y: [0, 1, 0],
    Z: [0, 0, 1],
};

export function makeDirection(p: Direction): Point {
    if (p === "X" || p === "Y" || p === "Z") {
        return DIRECTIONS[p];
    }
    return p;
}

export function asPnt(coords: Point): gp_Pnt {
    const v = makeVector(coords);
    const pnt = v.toPnt();
    v.delete();
    return pnt;
}

export function asDir(coords: Point): gp_Dir {
    const v = makeVector(coords);
    const dir = v.toDir();
    v.delete();
    return dir;
}


const PLANES_CONFIG: Record<
    PlaneName,
    {
        xDir: [number, number, number];
        normal: [number, number, number];
    }
> = {
    XY: {
        xDir: [1, 0, 0],
        normal: [0, 0, 1],
    },
    YZ: {
        xDir: [0, 1, 0],
        normal: [1, 0, 0],
    },
    ZX: {
        xDir: [0, 0, 1],
        normal: [0, 1, 0],
    },
    XZ: {
        xDir: [1, 0, 0],
        normal: [0, -1, 0],
    },
    YX: {
        xDir: [0, 1, 0],
        normal: [0, 0, -1],
    },
    ZY: {
        xDir: [0, 0, 1],
        normal: [-1, 0, 0],
    },
    front: {
        xDir: [1, 0, 0],
        normal: [0, 0, 1],
    },
    back: {
        xDir: [-1, 0, 0],
        normal: [0, 0, -1],
    },
    left: {
        xDir: [0, 0, 1],
        normal: [-1, 0, 0],
    },
    right: {
        xDir: [0, 0, -1],
        normal: [1, 0, 0],
    },
    top: {
        xDir: [1, 0, 0],
        normal: [0, 1, 0],
    },
    bottom: {
        xDir: [1, 0, 0],
        normal: [0, -1, 0],
    },
};

export const createNamedPlane = (
    plane: PlaneName,
    sourceOrigin: Point | number = [0, 0, 0]
): Plane => {
    const oc = getTopo();

    const config = PLANES_CONFIG[plane];
    if (!config) throw new Error(`Could not find plane ${plane}`);

    let origin: Vector;
    if (typeof sourceOrigin === "number") {
        origin = makeVector(config.normal.map((v: number) => v * sourceOrigin) as Point);
    } else {
        origin = makeVector(sourceOrigin);
    }
    return oc.Plane.named(plane, origin);
};
