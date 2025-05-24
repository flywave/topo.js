import { Shape, TopoInstance } from "topo-wasm";

export interface Primitive<T = any, O = any> {
    getType(): string;
    getVersion(): number;
    build(args?: any[]): Shape | undefined;
    setDefault(): Primitive<T, O>;
    setParams(params: T): Primitive<T, O>;
    valid(): boolean;
    fromObject(o?: O): Primitive<T, O>;
    toObject(): O | undefined;
    toJson(): string;
    equals(toCompare: Primitive<T, O>): boolean
}

export abstract class BasePrimitive<T = any, O = any> implements Primitive<T, O> {
    protected tp: TopoInstance;
    protected params: T;
    protected version: number = 0;

    constructor(tp: TopoInstance, readonly defaultParams?: O) {
        this.tp = tp;
        this.params = {} as T;
        if (defaultParams) {
            this.fromObject(defaultParams);
        }
    }

    protected static buildObject(content: Map<string, any>): object {
        const res: { [key: string]: any } = {};
        content.forEach((v, k) => {
            if (v !== undefined && v !== '') {
                res[k] = v;
            }
        });
        return res;
    }

    toJson(): string {
        return JSON.stringify(this.toObject());
    }

    getVersion(): number {
        return this.version;
    }

    equals(toCompare: Primitive<T, O>): boolean {
        // @ts-ignore
        return toCompare !== undefined && (this === toCompare || this.toJson() === toCompare.toJson());
    }

    abstract getType(): string;
    abstract build(args?: any[]): Shape | undefined;
    abstract setDefault(): Primitive<T, O>;
    abstract setParams(params: T): Primitive<T, O>;
    abstract valid(): boolean;
    abstract fromObject(o?: O): Primitive<T, O>;
    abstract toObject(): O | undefined;
}


export function radToAngle(rad: number): number {
    return rad * 180 / Math.PI;
}

export function angleToRad(angle: number): number {
    return angle * Math.PI / 180;
}