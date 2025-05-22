import { Shape, TopoInstance } from "topo-wasm";

export interface Primitive<T = any> {
    getType() : string;
    build(args?: any[]): Shape | undefined;
    setDefault(): Primitive<T>;
    setParams(params: T): Primitive<T>;
    valid(): boolean;
    fromObject(o: any): Primitive<T>;
    toObject(): Object | undefined;
    toJson(): string;
    equals(toCompare: Primitive<T>): boolean
}

export abstract class BasePrimitive<T = any> implements Primitive<T> {
    protected tp: TopoInstance;
    protected params: T;

    constructor(tp: TopoInstance, readonly defaultParams?: T) {
        this.tp = tp;
        this.params = defaultParams || {} as T;
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

    equals(toCompare: Primitive<T>): boolean {
        // @ts-ignore
        return toCompare !== undefined && (this === toCompare || this.toJson() === toCompare.toJson());
    }

    abstract getType() : string;
    abstract build(args?: any[]): Shape | undefined;
    abstract setDefault(): Primitive<T>;
    abstract setParams(params: T): Primitive<T>;
    abstract valid(): boolean;
    abstract fromObject(o: any): Primitive<T>;
    abstract toObject(): Object | undefined;
}
