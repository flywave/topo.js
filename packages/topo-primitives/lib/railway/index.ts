import {
    Shape,
    TopoInstance,
    RodInsulatorParams,
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";
import { RodInsulatorObject } from "../types/railway";

export enum RLPrimitiveType {
    RodInsulator = "RAILWAY/RodInsulator",
}

export type RLPrimitive = RodInsulatorPrimitive;

export class RodInsulatorPrimitive extends BasePrimitive<RodInsulatorParams, RodInsulatorObject> {

    constructor(tp: TopoInstance, params?: RodInsulatorObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.RodInsulator;
    }

    setDefault(): Primitive<RodInsulatorParams, RodInsulatorObject> {
        this.params = {
            type: this.tp.RodInsulatorType.SOLID as any,
            height: 600,
            outerDiameter: 80,
            innerDiameter: 0,
            shedDiameter: 120,
            shedSpacing: 40,
            shedCount: 12,
            endFitting: this.tp.EndFittingType.FLANGE as any,
            flangeDiameter: 140,
            flangeBoltSpacing: 100,
            flangeBoltDiameter: 14,
        } as any;
        return this;
    }

    public setParams(params: RodInsulatorParams): Primitive<RodInsulatorParams, RodInsulatorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 && this.params.outerDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRodInsulator(this.params), false);
        }
        throw new Error("Invalid parameters for RodInsulator");
    }

    fromObject(o?: RodInsulatorObject): Primitive<RodInsulatorParams, RodInsulatorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            type: o['rodType'] !== undefined ? (o['rodType'] as any) : (this.tp.RodInsulatorType.SOLID as any),
            height: o['height'],
            outerDiameter: o['outerDiameter'],
            innerDiameter: o['innerDiameter'],
            shedDiameter: o['shedDiameter'],
            shedSpacing: o['shedSpacing'],
            shedCount: o['shedCount'],
            endFitting: o['endFitting'] !== undefined ? (o['endFitting'] as any) : (this.tp.EndFittingType.FLANGE as any),
            flangeDiameter: o['flangeDiameter'],
            flangeBoltSpacing: o['flangeBoltSpacing'],
            flangeBoltDiameter: o['flangeBoltDiameter']
        } as any;
        return this;
    }

    toObject(): RodInsulatorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['rodType', this.params.type],
            ['height', this.params.height],
            ['outerDiameter', this.params.outerDiameter],
            ['innerDiameter', this.params.innerDiameter],
            ['shedDiameter', this.params.shedDiameter],
            ['shedSpacing', this.params.shedSpacing],
            ['shedCount', this.params.shedCount],
            ['endFitting', this.params.endFitting],
            ['flangeDiameter', this.params.flangeDiameter],
            ['flangeBoltSpacing', this.params.flangeBoltSpacing],
            ['flangeBoltDiameter', this.params.flangeBoltDiameter]
        ])) as RodInsulatorObject;
    }
};

export function createRLPrimitive(tp: TopoInstance, args?: RLPrimitiveType | any): RLPrimitive | undefined {
    if (args === undefined) {
        return undefined;
    }
    let type: RLPrimitiveType | undefined = undefined;
    let obj: any = undefined;
    if (args && args['type'] !== undefined) {
        type = args['type'];
        obj = args;
    } else if (typeof args === 'string') {
        type = args as RLPrimitiveType;
    }
    let primitive: RLPrimitive | undefined = undefined;
    switch (type) {
        case RLPrimitiveType.RodInsulator:
            primitive = new RodInsulatorPrimitive(tp);
            break;
    }
    if (primitive === undefined) {
        return undefined;
    }
    if (obj) {
        primitive.fromObject(obj);
        if (primitive.valid()) {
            return primitive;
        }
        return undefined;
    }
    primitive.setDefault();
    return primitive;
}
