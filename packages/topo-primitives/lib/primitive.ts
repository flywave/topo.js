import { Shape, TopoInstance } from "topo-wasm";

export interface Primitive<T = any, O = any> {
    getType(): string;
    getVersion(): number;
    build(args?: any[]): Shape | Record<string, Shape> | undefined;
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

    // NaN 守卫: 深度检查 params 中是否含 NaN, 有则拒绝 build (与 Go hasNaN 语义一致)
    protected assertNoNaN(): void {
        if (_hasNaN(this.params)) {
            throw new Error(`${this.getType()}: 参数含 NaN, 已拒绝`);
        }
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
    abstract build(args?: any[]): Shape | Record<string, Shape> | undefined;
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

// ---- NaN 守卫 (与 Go primitives_guard.go hasNaN 语义一致) ----
function _anyNaN(v: any): boolean {
    if (v !== v) return true; // NaN !== NaN
    if (v === null || v === undefined || typeof v !== 'object') return false;
    if (ArrayBuffer.isView(v)) {
        for (let i = 0; i < (v as any).length; i++) {
            if (_anyNaN((v as any)[i])) return true;
        }
        return false;
    }
    if (Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) {
            if (_anyNaN(v[i])) return true;
        }
        return false;
    }
    for (const key of Object.keys(v)) {
        if (_anyNaN(v[key])) return true;
    }
    return false;
}

function _hasNaN(v: any): boolean { return _anyNaN(v); }