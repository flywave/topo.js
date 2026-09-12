
export declare type AssemblyObject = Shape | Workplane | null

export declare type AssemblyExportMode = {
    DEFAULT: {},
    FUSE: {},
    PER_PART: {}
}

export declare enum AssemblyConstraintKind {
    Point = 0,
    Axis = 1,
    PointInPlane = 2,
    PointOnLine = 3,
    Plane = 4,
    Fixed = 5,
    FixedPoint = 6,
    FixedAxis = 7,
    FixedRotation = 8,
}

export declare type ConstraintParam = number | [number, number] | [number, number, number] | undefined

export declare interface AssemblyElement {
    shape: Shape;
    name: string;
    location: Location;
    color: QuantityColor | null;
}

export declare class Assembly {
    static create(
        obj?: Shape | Workplane,
        loc?: Location,
        name?: string,
        color?: QuantityColor,
        metadata?: Record<string, any>
    ): Assembly;

    copy(): Assembly;

    add(
        obj: AssemblyObject | Assembly,
        loc?: Location,
        name?: string,
        color?: QuantityColor,
        metadata?: Record<string, any>
    ): Assembly;

    remove(name: string): Assembly;

    constrain(q1: string, q2OrKind: string | AssemblyConstraintKind, kindOrParam?: AssemblyConstraintKind | ConstraintParam, param?: ConstraintParam): Assembly;
    constrain1(q1: string, kind: AssemblyConstraintKind, param?: ConstraintParam): Assembly;
    constrain2(id1: string, s1: Shape, id2: string, s2: Shape, kind: AssemblyConstraintKind, param?: ConstraintParam): Assembly;
    constrain3(id1: string, s1: Shape, kind: AssemblyConstraintKind, param?: ConstraintParam): Assembly;
    solve(verbosity?: number): Assembly;

    shapes(): Shape[];
    traverse(callback: (name: string, assembly: Assembly) => void): void;
    toCompound(): Compound;
    flatten(): Record<string, Assembly>;
    getElements(): AssemblyElement[];
    name(): string;
    location(): Location;
    hasColor(): boolean;
    color(): QuantityColor;
    hasObj(): boolean;
    obj(): AssemblyObject;
    children(): Assembly[];
    hasError(): boolean;
    getError(): string | null;
}