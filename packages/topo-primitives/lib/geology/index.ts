import { BoreholeParams, Shape, TopoInstance } from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";
import { BoreholeObject } from "../types";

export enum GeologyPrimitiveType {
    Borehole = "Borehole",
}

export type GeologyPrimitive = BoreholePrimitive


export class BoreholePrimitive extends BasePrimitive<BoreholeParams, BoreholeObject> {

    constructor(tp: TopoInstance, params?: BoreholeObject) {
        super(tp, params);
    }

    getType(): string {
        return GeologyPrimitiveType.Borehole;
    }

    setDefault(): Primitive<BoreholeParams, BoreholeObject> {
        this.params = {
            diameter: 10,
            samples: [
                {
                    name: "Sample 1",
                    depthFrom: 0,
                    depthTo: 30,
                },
                {
                    name: "Sample 2",
                    depthFrom: 30,
                    depthTo: 40,
                },
                {
                    name: "Sample 3",
                    depthFrom: 40,
                    depthTo: 50,
                }
            ],
            upDir: new this.tp.gp_Dir_4(0, 0, 1),
        };
        return this;
    }

    public setParams(params: BoreholeParams): Primitive<BoreholeParams, BoreholeObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return true;
    }

    public build(): Record<string, Shape> | undefined {
        if (this.valid()) {
            let res = this.tp.createBorehole(this.params);
            let obj: Record<string, Shape> = {}
            for (let key in res) {
                obj[key] = new this.tp.Shape(res[key], false);
            }
            return obj;
        }
        throw new Error("Invalid parameters for StepShape");
    }

    fromObject(o?: BoreholeObject): Primitive<BoreholeParams, BoreholeObject> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            diameter: o.diameter,
            samples: o.samples.map(sample => {
                return {
                    name: sample.name,
                    depthFrom: sample.depthFrom,
                    depthTo: sample.depthTo,
                };
            }),
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir[0], o.upDir[1], o.upDir[2]) : undefined
        };
        return this;
    }

    toObject(): BoreholeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['samples', this.params.samples.map(sample => {
                return {
                    name: sample.name,
                    depthFrom: sample.depthFrom,
                    depthTo: sample.depthTo,
                };
            })],
            ['diameter', this.params.diameter],
            ['upDir', this.params.upDir ? [
                this.params.upDir.X(),
                this.params.upDir.Y(),
                this.params.upDir.Z()
            ] : undefined]
        ])) as BoreholeObject;
    }

}


export function createGeologyPrimitive(tp: TopoInstance, args?: GeologyPrimitiveType | any): BoreholePrimitive | undefined {
    if (args === undefined) {
        return undefined;
    }
    let type: GeologyPrimitiveType | undefined = undefined;
    let obj: any = undefined;
    if (args && args['type'] !== undefined) {
        type = args['type'];
        obj = args;
    } else if (typeof args === 'string') {
        type = args as GeologyPrimitiveType;
    }

    if (type === GeologyPrimitiveType.Borehole) {
        return new BoreholePrimitive(tp);
    }
    return undefined;
}