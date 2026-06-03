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
    ContactWireParams,
    MessengerWireParams,
    MastBracketParams,
    SteelMastParams,
    ConcreteMastParams,
    OcsFoundationParams,
    GuyWireParams,
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";
import { RodInsulatorObject, CrossArmObject, LevelCantileverObject, SlantCantileverObject, CantileverBraceObject, CurvedArmObject, RegArmBracketObject, RegistrationArmObject, ContactWireObject, MessengerWireObject, MastBracketObject, SteelMastObject, ConcreteMastObject, OcsFoundationObject, GuyWireObject } from "../types/railway";

export enum RLPrimitiveType {
    ContactWire = "RAILWAY/ContactWire",
    MessengerWire = "RAILWAY/MessengerWire",
    GuyWire = "RAILWAY/GuyWire",
    OcsFoundation = "RAILWAY/OcsFoundation",
    SteelMast = "RAILWAY/SteelMast",
    ConcreteMast = "RAILWAY/ConcreteMast",
    MastBracket = "RAILWAY/MastBracket",
    RodInsulator = "RAILWAY/RodInsulator",
    CrossArm = "RAILWAY/CrossArm",
    LevelCantilever = "RAILWAY/LevelCantilever",
    SlantCantilever = "RAILWAY/SlantCantilever",
    CantileverBrace = "RAILWAY/CantileverBrace",
    RegArmBracket = "RAILWAY/RegArmBracket",
    RegistrationArm = "RAILWAY/RegistrationArm",
    CurvedArm = "RAILWAY/CurvedArm",
}

export type RLPrimitive = ContactWirePrimitive | MessengerWirePrimitive | GuyWirePrimitive | OcsFoundationPrimitive | SteelMastPrimitive | ConcreteMastPrimitive | MastBracketPrimitive | RodInsulatorPrimitive | CrossArmPrimitive | LevelCantileverPrimitive | SlantCantileverPrimitive | CantileverBracePrimitive | CurvedArmPrimitive | RegArmBracketPrimitive | RegistrationArmPrimitive;

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

export class GuyWirePrimitive extends BasePrimitive<GuyWireParams, GuyWireObject> {

    constructor(tp: TopoInstance, params?: GuyWireObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.GuyWire;
    }

    setDefault(): Primitive<GuyWireParams, GuyWireObject> {
        this.params = {
            length: 3000,
            diameter: 8,
            angle: 45,
            ratedTension: 50,
            hasInsulator: true,
            insulatorCount: 2,
            anchorRodDiameter: 10,
            anchorRodLength: 500,
            anchorPlateLength: 150,
            anchorPlateWidth: 100,
        } as any;
        return this;
    }

    public setParams(params: GuyWireParams): Primitive<GuyWireParams, GuyWireObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.diameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createGuyWire(this.params), false);
        }
        throw new Error("Invalid parameters for GuyWire");
    }

    fromObject(o?: GuyWireObject): Primitive<GuyWireParams, GuyWireObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            diameter: o['diameter'],
            angle: o['angle'] || 45,
            ratedTension: o['ratedTension'] || 0,
            hasInsulator: o['hasInsulator'] || false,
            insulatorCount: o['insulatorCount'] || 2,
            anchorRodDiameter: o['anchorRodDiameter'] || 0,
            anchorRodLength: o['anchorRodLength'] || 0,
            anchorPlateLength: o['anchorPlateLength'] || 0,
            anchorPlateWidth: o['anchorPlateWidth'] || 0,
        } as any;
        return this;
    }

    toObject(): GuyWireObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['diameter', this.params.diameter],
            ['angle', this.params.angle],
            ['ratedTension', this.params.ratedTension],
            ['hasInsulator', this.params.hasInsulator],
            ['insulatorCount', this.params.insulatorCount],
            ['anchorRodDiameter', this.params.anchorRodDiameter],
            ['anchorRodLength', this.params.anchorRodLength],
            ['anchorPlateLength', this.params.anchorPlateLength],
            ['anchorPlateWidth', this.params.anchorPlateWidth],
        ])) as GuyWireObject;
    }
};

export class ContactWirePrimitive extends BasePrimitive<ContactWireParams, ContactWireObject> {

    constructor(tp: TopoInstance, params?: ContactWireObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.ContactWire;
    }

    setDefault(): Primitive<ContactWireParams, ContactWireObject> {
        this.params = {
            sectionalArea: 120,
            diameter: 14.5,
            ratedTension: 15,
            grooveDepth: 1.5,
            grooveWidth: 2.5,
            bottomRadius: 6.5,
            topRadius: 3.0,
            sag: 50,
        } as any;
        return this;
    }

    public setParams(params: ContactWireParams): Primitive<ContactWireParams, ContactWireObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.diameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createContactWire(this.params, new this.tp.gp_Pnt_3(0, 0, 0), new this.tp.gp_Pnt_3(1000, 0, 0)), false);
        }
        throw new Error("Invalid parameters for ContactWire");
    }

    fromObject(o?: ContactWireObject): Primitive<ContactWireParams, ContactWireObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            sectionalArea: o['sectionalArea'],
            diameter: o['diameter'],
            ratedTension: o['ratedTension'],
            grooveDepth: o['grooveDepth'],
            grooveWidth: o['grooveWidth'],
            bottomRadius: o['bottomRadius'],
            topRadius: o['topRadius'],
            sag: o['sag'] || 0,
        } as any;
        return this;
    }

    toObject(): ContactWireObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['sectionalArea', this.params.sectionalArea],
            ['diameter', this.params.diameter],
            ['ratedTension', this.params.ratedTension],
            ['grooveDepth', this.params.grooveDepth],
            ['grooveWidth', this.params.grooveWidth],
            ['bottomRadius', this.params.bottomRadius],
            ['topRadius', this.params.topRadius],
            ['sag', this.params.sag],
        ])) as ContactWireObject;
    }
};

export class MessengerWirePrimitive extends BasePrimitive<MessengerWireParams, MessengerWireObject> {

    constructor(tp: TopoInstance, params?: MessengerWireObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.MessengerWire;
    }

    setDefault(): Primitive<MessengerWireParams, MessengerWireObject> {
        this.params = {
            diameter: 20,
            ratedTension: 20,
            structuralHeight: 1800,
            sag: 500,
        } as any;
        return this;
    }

    public setParams(params: MessengerWireParams): Primitive<MessengerWireParams, MessengerWireObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.diameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createMessengerWire(this.params, new this.tp.gp_Pnt_3(0, 0, 0), new this.tp.gp_Pnt_3(1000, 0, 0)), false);
        }
        throw new Error("Invalid parameters for MessengerWire");
    }

    fromObject(o?: MessengerWireObject): Primitive<MessengerWireParams, MessengerWireObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            diameter: o['diameter'],
            ratedTension: o['ratedTension'],
            structuralHeight: o['structuralHeight'],
            sag: o['sag'],
        } as any;
        return this;
    }

    toObject(): MessengerWireObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['diameter', this.params.diameter],
            ['ratedTension', this.params.ratedTension],
            ['structuralHeight', this.params.structuralHeight],
            ['sag', this.params.sag],
        ])) as MessengerWireObject;
    }
};

export class MastBracketPrimitive extends BasePrimitive<MastBracketParams, MastBracketObject> {

    constructor(tp: TopoInstance, params?: MastBracketObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.MastBracket;
    }

    setDefault(): Primitive<MastBracketParams, MastBracketObject> {
        this.params = {
            boltSpacing: 200,
            boltDiameter: 18,
            height: 300,
            width: 200,
            thickness: 12,
            insulatorBoltSpacing: 150,
            insulatorBoltDiameter: 16,
            mountAngle: 0,
        } as any;
        return this;
    }

    public setParams(params: MastBracketParams): Primitive<MastBracketParams, MastBracketObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 && this.params.width > 0 && this.params.thickness > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createMastBracket(this.params), false);
        }
        throw new Error("Invalid parameters for MastBracket");
    }

    fromObject(o?: MastBracketObject): Primitive<MastBracketParams, MastBracketObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            boltSpacing: o['boltSpacing'],
            boltDiameter: o['boltDiameter'],
            height: o['height'],
            width: o['width'],
            thickness: o['thickness'],
            insulatorBoltSpacing: o['insulatorBoltSpacing'],
            insulatorBoltDiameter: o['insulatorBoltDiameter'],
            mountAngle: o['mountAngle'] || 0,
        } as any;
        return this;
    }

    toObject(): MastBracketObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltSpacing', this.params.boltSpacing],
            ['boltDiameter', this.params.boltDiameter],
            ['height', this.params.height],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['insulatorBoltSpacing', this.params.insulatorBoltSpacing],
            ['insulatorBoltDiameter', this.params.insulatorBoltDiameter],
            ['mountAngle', this.params.mountAngle],
        ])) as MastBracketObject;
    }
};

export class SteelMastPrimitive extends BasePrimitive<SteelMastParams, SteelMastObject> {

    constructor(tp: TopoInstance, params?: SteelMastObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.SteelMast;
    }

    setDefault(): Primitive<SteelMastParams, SteelMastObject> {
        this.params = {
            type: this.tp.SteelMastType.H_BEAM as any,
            height: 8000,
            topWidth: 200,
            bottomWidth: 350,
            wallThickness: 10,
            flangeThickness: 16,
            flangeWidth: 450,
            anchorSpacing: 200,
            anchorDiameter: 24,
            segmentCount: 1,
        } as any;
        return this;
    }

    public setParams(params: SteelMastParams): Primitive<SteelMastParams, SteelMastObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 && this.params.topWidth > 0 && this.params.bottomWidth > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSteelMast(this.params), false);
        }
        throw new Error("Invalid parameters for SteelMast");
    }

    fromObject(o?: SteelMastObject): Primitive<SteelMastParams, SteelMastObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            type: o['steelType'] !== undefined ? (o['steelType'] as any) : (this.tp.SteelMastType.H_BEAM as any),
            height: o['height'],
            topWidth: o['topWidth'],
            bottomWidth: o['bottomWidth'],
            wallThickness: o['wallThickness'],
            flangeThickness: o['flangeThickness'],
            flangeWidth: o['flangeWidth'],
            anchorSpacing: o['anchorSpacing'],
            anchorDiameter: o['anchorDiameter'],
            segmentCount: o['segmentCount'] || 1,
        } as any;
        return this;
    }

    toObject(): SteelMastObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['steelType', this.params.type],
            ['height', this.params.height],
            ['topWidth', this.params.topWidth],
            ['bottomWidth', this.params.bottomWidth],
            ['wallThickness', this.params.wallThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['flangeWidth', this.params.flangeWidth],
            ['anchorSpacing', this.params.anchorSpacing],
            ['anchorDiameter', this.params.anchorDiameter],
            ['segmentCount', this.params.segmentCount],
        ])) as SteelMastObject;
    }
};

export class ConcreteMastPrimitive extends BasePrimitive<ConcreteMastParams, ConcreteMastObject> {

    constructor(tp: TopoInstance, params?: ConcreteMastObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.ConcreteMast;
    }

    setDefault(): Primitive<ConcreteMastParams, ConcreteMastObject> {
        this.params = {
            sectionType: this.tp.ConcreteMastSectionType.CIRCULAR as any,
            height: 9000,
            topWidth: 250,
            bottomWidth: 350,
            wallThickness: 60,
            holeDiameter: 0,
            holeSpacingV: 0,
            holeSpacingH: 0,
            firstHoleOffset: 0,
            holeRowCount: 0,
            holesPerRow: 0,
        } as any;
        return this;
    }

    public setParams(params: ConcreteMastParams): Primitive<ConcreteMastParams, ConcreteMastObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 && this.params.topWidth > 0 && this.params.bottomWidth > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createConcreteMast(this.params), false);
        }
        throw new Error("Invalid parameters for ConcreteMast");
    }

    fromObject(o?: ConcreteMastObject): Primitive<ConcreteMastParams, ConcreteMastObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            sectionType: o['sectionType'] !== undefined ? (o['sectionType'] as any) : (this.tp.ConcreteMastSectionType.CIRCULAR as any),
            height: o['height'],
            topWidth: o['topWidth'],
            bottomWidth: o['bottomWidth'],
            wallThickness: o['wallThickness'],
            holeDiameter: o['holeDiameter'] || 0,
            holeSpacingV: o['holeSpacingV'] || 0,
            holeSpacingH: o['holeSpacingH'] || 0,
            firstHoleOffset: o['firstHoleOffset'] || 0,
            holeRowCount: o['holeRowCount'] || 0,
            holesPerRow: o['holesPerRow'] || 0,
        } as any;
        return this;
    }

    toObject(): ConcreteMastObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['sectionType', this.params.sectionType],
            ['height', this.params.height],
            ['topWidth', this.params.topWidth],
            ['bottomWidth', this.params.bottomWidth],
            ['wallThickness', this.params.wallThickness],
            ['holeDiameter', this.params.holeDiameter],
            ['holeSpacingV', this.params.holeSpacingV],
            ['holeSpacingH', this.params.holeSpacingH],
            ['firstHoleOffset', this.params.firstHoleOffset],
            ['holeRowCount', this.params.holeRowCount],
            ['holesPerRow', this.params.holesPerRow],
        ])) as ConcreteMastObject;
    }
};

export class OcsFoundationPrimitive extends BasePrimitive<OcsFoundationParams, OcsFoundationObject> {

    constructor(tp: TopoInstance, params?: OcsFoundationObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.OcsFoundation;
    }

    setDefault(): Primitive<OcsFoundationParams, OcsFoundationObject> {
        this.params = {
            type: this.tp.FoundationType.FLANGE as any,
            height: 200,
            width: 300,
            length: 300,
            flangeThickness: 10,
            anchorCount: 4,
            anchorDiameter: 12,
            anchorLength: 100,
            anchorSpacing: 200,
        } as any;
        return this;
    }

    public setParams(params: OcsFoundationParams): Primitive<OcsFoundationParams, OcsFoundationObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createOcsFoundation(this.params), false);
        }
        throw new Error("Invalid parameters for OcsFoundation");
    }

    fromObject(o?: OcsFoundationObject): Primitive<OcsFoundationParams, OcsFoundationObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            type: o['foundationType'] !== undefined ? (o['foundationType'] as any) : (this.tp.FoundationType.FLANGE as any),
            height: o['height'],
            width: o['width'],
            length: o['length'],
            flangeThickness: o['flangeThickness'] || 0,
            anchorCount: o['anchorCount'] || 0,
            anchorDiameter: o['anchorDiameter'] || 0,
            anchorLength: o['anchorLength'] || 0,
            anchorSpacing: o['anchorSpacing'] || 0,
        } as any;
        return this;
    }

    toObject(): OcsFoundationObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['foundationType', this.params.type],
            ['height', this.params.height],
            ['width', this.params.width],
            ['length', this.params.length],
            ['flangeThickness', this.params.flangeThickness],
            ['anchorCount', this.params.anchorCount],
            ['anchorDiameter', this.params.anchorDiameter],
            ['anchorLength', this.params.anchorLength],
            ['anchorSpacing', this.params.anchorSpacing],
        ])) as OcsFoundationObject;
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
        case RLPrimitiveType.ContactWire:
            primitive = new ContactWirePrimitive(tp);
            break;
        case RLPrimitiveType.MessengerWire:
            primitive = new MessengerWirePrimitive(tp);
            break;
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
        case RLPrimitiveType.GuyWire:
            primitive = new GuyWirePrimitive(tp);
            break;
        case RLPrimitiveType.CantileverBrace:
            primitive = new CantileverBracePrimitive(tp);
            break;
        case RLPrimitiveType.OcsFoundation:
            primitive = new OcsFoundationPrimitive(tp);
            break;
        case RLPrimitiveType.SteelMast:
            primitive = new SteelMastPrimitive(tp);
            break;
        case RLPrimitiveType.ConcreteMast:
            primitive = new ConcreteMastPrimitive(tp);
            break;
        case RLPrimitiveType.MastBracket:
            primitive = new MastBracketPrimitive(tp);
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
