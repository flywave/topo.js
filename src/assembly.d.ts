
declare type AssemblyObject = Shape | Workplane | null

export declare type AssemblyExportMode = {
    DEFAULT: {},
    FUSE: {},
    PER_PART: {}
}

declare interface AssemblyElement {
    shape: Shape;
    name: string;
    location: Location;
    color: QuantityColor | null;
}

declare class Assembly {
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
}