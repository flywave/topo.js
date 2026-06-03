import {
    Shape,
    TopoInstance,
    RodInsulatorParams,
    CrossArmParams,
    LevelCantileverParams,
    SlantCantileverParams,
    CantileverBraceParams,
    RegArmBracketParams,
    RegistrationArmParams,
    CurvedArmParams,
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";
import { RodInsulatorObject, CrossArmObject, LevelCantileverObject, SlantCantileverObject, CantileverBraceObject, CurvedArmObject, RegArmBracketObject, RegistrationArmObject } from "../types/railway";

export enum RLPrimitiveType {
    RodInsulator = "RAILWAY/RodInsulator",
    CrossArm = "RAILWAY/CrossArm",
    LevelCantilever = "RAILWAY/LevelCantilever",
    SlantCantilever = "RAILWAY/SlantCantilever",
    CantileverBrace = "RAILWAY/CantileverBrace",
    RegArmBracket = "RAILWAY/RegArmBracket",
    RegistrationArm = "RAILWAY/RegistrationArm",
    CurvedArm = "RAILWAY/CurvedArm",
}

export type RLPrimitive = RodInsulatorPrimitive | CrossArmPrimitive | LevelCantileverPrimitive | SlantCantileverPrimitive | CantileverBracePrimitive | CurvedArmPrimitive | RegArmBracketPrimitive | RegistrationArmPrimitive;

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

export class CrossArmPrimitive extends BasePrimitive<CrossArmParams, CrossArmObject> {

    constructor(tp: TopoInstance, params?: CrossArmObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.CrossArm;
    }

    setDefault(): Primitive<CrossArmParams, CrossArmObject> {
        this.params = {
            beamLength: 2000,
            beamHeight: 120,
            beamWidth: 80,
            beamThickness: 6,
            beamSpacing: 400,
            braceDiameter: 20,
            boltSpacing: 100,
            boltDiameter: 16,
            boltCount: 4,
        } as any;
        return this;
    }

    public setParams(params: CrossArmParams): Primitive<CrossArmParams, CrossArmObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.beamLength > 0 && this.params.beamHeight > 0 && this.params.beamWidth > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCrossArm(this.params), false);
        }
        throw new Error("Invalid parameters for CrossArm");
    }

    fromObject(o?: CrossArmObject): Primitive<CrossArmParams, CrossArmObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            beamLength: o['beamLength'],
            beamHeight: o['beamHeight'],
            beamWidth: o['beamWidth'],
            beamThickness: o['beamThickness'],
            beamSpacing: o['beamSpacing'],
            braceDiameter: o['braceDiameter'],
            boltSpacing: o['boltSpacing'],
            boltDiameter: o['boltDiameter'],
            boltCount: o['boltCount'],
        } as any;
        return this;
    }

    toObject(): CrossArmObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['beamLength', this.params.beamLength],
            ['beamHeight', this.params.beamHeight],
            ['beamWidth', this.params.beamWidth],
            ['beamThickness', this.params.beamThickness],
            ['beamSpacing', this.params.beamSpacing],
            ['braceDiameter', this.params.braceDiameter],
            ['boltSpacing', this.params.boltSpacing],
            ['boltDiameter', this.params.boltDiameter],
            ['boltCount', this.params.boltCount],
        ])) as CrossArmObject;
    }
};

export class LevelCantileverPrimitive extends BasePrimitive<LevelCantileverParams, LevelCantileverObject> {

    constructor(tp: TopoInstance, params?: LevelCantileverObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.LevelCantilever;
    }

    setDefault(): Primitive<LevelCantileverParams, LevelCantileverObject> {
        this.params = {
            length: 3000,
            outerDiameter: 60,
            wallThickness: 4,
            riseAngle: 0,
        } as any;
        return this;
    }

    public setParams(params: LevelCantileverParams): Primitive<LevelCantileverParams, LevelCantileverObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.outerDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createLevelCantilever(this.params), false);
        }
        throw new Error("Invalid parameters for LevelCantilever");
    }

    fromObject(o?: LevelCantileverObject): Primitive<LevelCantileverParams, LevelCantileverObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            outerDiameter: o['outerDiameter'],
            wallThickness: o['wallThickness'],
            riseAngle: o['riseAngle'],
        } as any;
        return this;
    }

    toObject(): LevelCantileverObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['outerDiameter', this.params.outerDiameter],
            ['wallThickness', this.params.wallThickness],
            ['riseAngle', this.params.riseAngle],
        ])) as LevelCantileverObject;
    }
};

export class SlantCantileverPrimitive extends BasePrimitive<SlantCantileverParams, SlantCantileverObject> {

    constructor(tp: TopoInstance, params?: SlantCantileverObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.SlantCantilever;
    }

    setDefault(): Primitive<SlantCantileverParams, SlantCantileverObject> {
        this.params = {
            length: 3000,
            outerDiameter: 60,
            wallThickness: 4,
            slantAngle: 15,
        } as any;
        return this;
    }

    public setParams(params: SlantCantileverParams): Primitive<SlantCantileverParams, SlantCantileverObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.outerDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSlantCantilever(this.params), false);
        }
        throw new Error("Invalid parameters for SlantCantilever");
    }

    fromObject(o?: SlantCantileverObject): Primitive<SlantCantileverParams, SlantCantileverObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            outerDiameter: o['outerDiameter'],
            wallThickness: o['wallThickness'],
            slantAngle: o['slantAngle'],
        } as any;
        return this;
    }

    toObject(): SlantCantileverObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['outerDiameter', this.params.outerDiameter],
            ['wallThickness', this.params.wallThickness],
            ['slantAngle', this.params.slantAngle],
        ])) as SlantCantileverObject;
    }
};

export class CantileverBracePrimitive extends BasePrimitive<CantileverBraceParams, CantileverBraceObject> {

    constructor(tp: TopoInstance, params?: CantileverBraceObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.CantileverBrace;
    }

    setDefault(): Primitive<CantileverBraceParams, CantileverBraceObject> {
        this.params = {
            length: 2500,
            outerDiameter: 30,
            wallThickness: 2.5,
            slantAngle: 30,
        } as any;
        return this;
    }

    public setParams(params: CantileverBraceParams): Primitive<CantileverBraceParams, CantileverBraceObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.outerDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCantileverBrace(this.params), false);
        }
        throw new Error("Invalid parameters for CantileverBrace");
    }

    fromObject(o?: CantileverBraceObject): Primitive<CantileverBraceParams, CantileverBraceObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            outerDiameter: o['outerDiameter'],
            wallThickness: o['wallThickness'],
            slantAngle: o['slantAngle'],
        } as any;
        return this;
    }

    toObject(): CantileverBraceObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['outerDiameter', this.params.outerDiameter],
            ['wallThickness', this.params.wallThickness],
            ['slantAngle', this.params.slantAngle],
        ])) as CantileverBraceObject;
    }
};

export class RegArmBracketPrimitive extends BasePrimitive<RegArmBracketParams, RegArmBracketObject> {

    constructor(tp: TopoInstance, params?: RegArmBracketObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.RegArmBracket;
    }

    setDefault(): Primitive<RegArmBracketParams, RegArmBracketObject> {
        this.params = {
            tubeDiameter: 60,
            bandWidth: 50,
            bandThickness: 5,
            bracketHeight: 120,
            bracketThickness: 8,
            bracketWidth: 30,
            mountHoleDiameter: 16,
        } as any;
        return this;
    }

    public setParams(params: RegArmBracketParams): Primitive<RegArmBracketParams, RegArmBracketObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.tubeDiameter > 0 && this.params.bracketHeight > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRegArmBracket(this.params), false);
        }
        throw new Error("Invalid parameters for RegArmBracket");
    }

    fromObject(o?: RegArmBracketObject): Primitive<RegArmBracketParams, RegArmBracketObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            tubeDiameter: o['tubeDiameter'],
            bandWidth: o['bandWidth'],
            bandThickness: o['bandThickness'],
            bracketHeight: o['bracketHeight'],
            bracketThickness: o['bracketThickness'],
            bracketWidth: o['bracketWidth'],
            mountHoleDiameter: o['mountHoleDiameter'],
        } as any;
        return this;
    }

    toObject(): RegArmBracketObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['tubeDiameter', this.params.tubeDiameter],
            ['bandWidth', this.params.bandWidth],
            ['bandThickness', this.params.bandThickness],
            ['bracketHeight', this.params.bracketHeight],
            ['bracketThickness', this.params.bracketThickness],
            ['bracketWidth', this.params.bracketWidth],
            ['mountHoleDiameter', this.params.mountHoleDiameter],
        ])) as RegArmBracketObject;
    }
};

export class RegistrationArmPrimitive extends BasePrimitive<RegistrationArmParams, RegistrationArmObject> {

    constructor(tp: TopoInstance, params?: RegistrationArmObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.RegistrationArm;
    }

    setDefault(): Primitive<RegistrationArmParams, RegistrationArmObject> {
        this.params = {
            type: this.tp.RegistrationArmType.STRAIGHT as any,
            length: 1200,
            tubeWidth: 30,
            tubeHeight: 20,
            wallThickness: 2,
            angle: 0,
            isReverse: false,
        } as any;
        return this;
    }

    public setParams(params: RegistrationArmParams): Primitive<RegistrationArmParams, RegistrationArmObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.tubeWidth > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRegistrationArm(this.params), false);
        }
        throw new Error("Invalid parameters for RegistrationArm");
    }

    fromObject(o?: RegistrationArmObject): Primitive<RegistrationArmParams, RegistrationArmObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            type: o['regType'] !== undefined ? (o['regType'] as any) : (this.tp.RegistrationArmType.STRAIGHT as any),
            length: o['length'],
            tubeWidth: o['tubeWidth'],
            tubeHeight: o['tubeHeight'],
            wallThickness: o['wallThickness'],
            angle: o['angle'] || 0,
            isReverse: o['isReverse'] || false,
        } as any;
        return this;
    }

    toObject(): RegistrationArmObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['tubeWidth', this.params.tubeWidth],
            ['tubeHeight', this.params.tubeHeight],
            ['wallThickness', this.params.wallThickness],
            ['angle', this.params.angle],
            ['isReverse', this.params.isReverse],
        ])) as RegistrationArmObject;
    }
};

export class CurvedArmPrimitive extends BasePrimitive<CurvedArmParams, CurvedArmObject> {

    constructor(tp: TopoInstance, params?: CurvedArmObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.CurvedArm;
    }

    setDefault(): Primitive<CurvedArmParams, CurvedArmObject> {
        this.params = {
            verticalLength: 500,
            horizontalLength: 800,
            bendRadius: 200,
            bendAngle: 90,
            outerDiameter: 48,
            wallThickness: 3.5,
            flangeThickness: 10,
            boltSpacing: 80,
            boltDiameter: 12,
        } as any;
        return this;
    }

    public setParams(params: CurvedArmParams): Primitive<CurvedArmParams, CurvedArmObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.verticalLength > 0 && this.params.horizontalLength > 0 && this.params.outerDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCurvedArm(this.params), false);
        }
        throw new Error("Invalid parameters for CurvedArm");
    }

    fromObject(o?: CurvedArmObject): Primitive<CurvedArmParams, CurvedArmObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            verticalLength: o['verticalLength'],
            horizontalLength: o['horizontalLength'],
            bendRadius: o['bendRadius'],
            bendAngle: o['bendAngle'] || 90,
            outerDiameter: o['outerDiameter'],
            wallThickness: o['wallThickness'],
            flangeThickness: o['flangeThickness'],
            boltSpacing: o['boltSpacing'] || 80,
            boltDiameter: o['boltDiameter'] || 12,
        } as any;
        return this;
    }

    toObject(): CurvedArmObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['verticalLength', this.params.verticalLength],
            ['horizontalLength', this.params.horizontalLength],
            ['bendRadius', this.params.bendRadius],
            ['bendAngle', this.params.bendAngle],
            ['outerDiameter', this.params.outerDiameter],
            ['wallThickness', this.params.wallThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['boltSpacing', this.params.boltSpacing],
            ['boltDiameter', this.params.boltDiameter],
        ])) as CurvedArmObject;
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
        case RLPrimitiveType.CrossArm:
            primitive = new CrossArmPrimitive(tp);
            break;
        case RLPrimitiveType.LevelCantilever:
            primitive = new LevelCantileverPrimitive(tp);
            break;
        case RLPrimitiveType.SlantCantilever:
            primitive = new SlantCantileverPrimitive(tp);
            break;
        case RLPrimitiveType.CantileverBrace:
            primitive = new CantileverBracePrimitive(tp);
            break;
        case RLPrimitiveType.RegArmBracket:
            primitive = new RegArmBracketPrimitive(tp);
            break;
        case RLPrimitiveType.RegistrationArm:
            primitive = new RegistrationArmPrimitive(tp);
            break;
        case RLPrimitiveType.CurvedArm:
            primitive = new CurvedArmPrimitive(tp);
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
