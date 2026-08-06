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
    DropperParams,
    CantileverBaseParams,
    MwSaddleParams,
    BalanceWeightParams,
    WeightRodParams,
    AnchorFittingParams,
    CrossingParams,
    HeadSpanParams,
    TransverseSpanParams,
    HangerPostParams,
    PortalFrameParams,
    SuspensionHardSpanParams,
    PositioningCableParams,
    AuxBracketParams,
    RailParams,
    SleeperParams,
    BallastParams,
    TrackSlabParams,
    FastenerParams,
    GuardRailParams,
    MastAssemblyParams,
    WeightStackParams,
    RatchetCompensatorParams,
    AuxiliaryWireParams,
    DisconnectorParams,
    ArresterParams,
    PulleyCompensatorParams,
    SleeveConnectorParams,
    SleeveEarParams,
    SwitchRailParams,
    FrogParams,
    TurnoutParams,
    StraightTrackParams,
    CurveTrackParams,
    RailPairParams,
    SleeperLayoutParams,
    RetarderPointParams,
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";
import { RodInsulatorObject, CrossArmObject, LevelCantileverObject, SlantCantileverObject, CantileverBraceObject, CurvedArmObject, RegArmBracketObject, RegistrationArmObject, ContactWireObject, MessengerWireObject, MastBracketObject, SteelMastObject, ConcreteMastObject, OcsFoundationObject, GuyWireObject, DropperObject, CantileverBaseObject, MWSaddleObject, BalanceWeightObject, WeightRodObject, AnchorFittingObject, CrossingObject, HeadSpanObject, TransverseSpanObject, HangerPostObject, PortalFrameObject, SuspensionHardSpanObject, PositioningCableObject, AuxBracketObject, RailObject, SleeperObject, BallastObject, TrackSlabObject, FastenerObject, GuardRailObject, MastAssemblyObject, WeightStackObject, RatchetCompensatorObject, AuxiliaryWireObject, DisconnectorObject, ArresterObject, PulleyCompensatorObject, SleeveConnectorObject, SleeveEarObject, SwitchRailObject, FrogObject, TurnoutObject, StraightTrackObject, CurveTrackObject, RailPairObject, SleeperLayoutObject, RetarderPointObject } from "../types/railway";

export enum RLPrimitiveType {
    ContactWire = "RAILWAY/ContactWire",
    MessengerWire = "RAILWAY/MessengerWire",
    Dropper = "RAILWAY/Dropper",
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
    CantileverBase = "RAILWAY/CantileverBase",
    MWSaddle = "RAILWAY/MWSaddle",
    BalanceWeight = "RAILWAY/BalanceWeight",
    WeightRod = "RAILWAY/WeightRod",
    AnchorFitting = "RAILWAY/AnchorFitting",
    Crossing = "RAILWAY/Crossing",
    HeadSpan = "RAILWAY/HeadSpan",
    TransverseSpan = "RAILWAY/TransverseSpan",
    HangerPost = "RAILWAY/HangerPost",
    PortalFrame = "RAILWAY/PortalFrame",
    SuspensionHardSpan = "RAILWAY/SuspensionHardSpan",
    PositioningCable = "RAILWAY/PositioningCable",
    AuxBracket = "RAILWAY/AuxBracket",
    Rail = "RAILWAY/Rail",
    Sleeper = "RAILWAY/Sleeper",
    Ballast = "RAILWAY/Ballast",
    TrackSlab = "RAILWAY/TrackSlab",
    Fastener = "RAILWAY/Fastener",
    GuardRail = "RAILWAY/GuardRail",
    MastAssembly = "RAILWAY/MastAssembly",
    WeightStack = "RAILWAY/WeightStack",
    RatchetCompensator = "RAILWAY/RatchetCompensator",
    AuxiliaryWire = "RAILWAY/AuxiliaryWire",
    Disconnector = "RAILWAY/Disconnector",
    Arrester = "RAILWAY/Arrester",
    PulleyCompensator = "RAILWAY/PulleyCompensator",
    SleeveConnector = "RAILWAY/SleeveConnector",
    SleeveEar = "RAILWAY/SleeveEar",
    SwitchRail = "RAILWAY/SwitchRail",
    Frog = "RAILWAY/Frog",
    Turnout = "RAILWAY/Turnout",
    StraightTrack = "RAILWAY/StraightTrack",
    CurveTrack = "RAILWAY/CurveTrack",
    RailPair = "RAILWAY/RailPair",
    SleeperLayout = "RAILWAY/SleeperLayout",
    RetarderPoint = "RAILWAY/RetarderPoint",
}

export type RLPrimitive = ContactWirePrimitive | MessengerWirePrimitive | DropperPrimitive | GuyWirePrimitive | OcsFoundationPrimitive | SteelMastPrimitive | ConcreteMastPrimitive | MastBracketPrimitive | RodInsulatorPrimitive | CrossArmPrimitive | LevelCantileverPrimitive | SlantCantileverPrimitive | CantileverBracePrimitive | CurvedArmPrimitive | RegArmBracketPrimitive | RegistrationArmPrimitive | CantileverBasePrimitive | MWSaddlePrimitive | BalanceWeightPrimitive | WeightRodPrimitive | AnchorFittingPrimitive | CrossingPrimitive | HeadSpanPrimitive | TransverseSpanPrimitive | HangerPostPrimitive | PortalFramePrimitive | SuspensionHardSpanPrimitive | PositioningCablePrimitive | AuxBracketPrimitive | RailPrimitive | SleeperPrimitive | BallastPrimitive | TrackSlabPrimitive | FastenerPrimitive | GuardRailPrimitive | MastAssemblyPrimitive | WeightStackPrimitive | RatchetCompensatorPrimitive | AuxiliaryWirePrimitive | DisconnectorPrimitive | ArresterPrimitive | PulleyCompensatorPrimitive | SleeveConnectorPrimitive | SleeveEarPrimitive | SwitchRailPrimitive | FrogPrimitive | TurnoutPrimitive | StraightTrackPrimitive | CurveTrackPrimitive | RailPairPrimitive | SleeperLayoutPrimitive | RetarderPointPrimitive;

// 几何点转换: Object 契约用 [x,y,z] 数组, WASM 参数用 gp_Pnt 实例
function toPnt(tp: TopoInstance, p: [number, number, number]): any {
    return new (tp as any).gp_Pnt_3(p[0], p[1], p[2]);
}

function fromPnt(p: any): [number, number, number] {
    return [p.X(), p.Y(), p.Z()];
}

function toPntList(tp: TopoInstance, pts: [number, number, number][]): any[] {
    return (pts || []).map((p) => toPnt(tp, p));
}

function fromPntList(pts: any[]): [number, number, number][] {
    return (pts || []).map((p) => fromPnt(p));
}

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

export class DropperPrimitive extends BasePrimitive<DropperParams, DropperObject> {

    constructor(tp: TopoInstance, params?: DropperObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Dropper;
    }

    setDefault(): Primitive<DropperParams, DropperObject> {
        this.params = {
            length: 1500,
            wireDiameter: 2.5,
            clampLength: 30,
            clampWidth: 20,
            clampThickness: 6,
            conductive: true,
        } as any;
        return this;
    }

    public setParams(params: DropperParams): Primitive<DropperParams, DropperObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.wireDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createDropper(this.params), false);
        }
        throw new Error("Invalid parameters for Dropper");
    }

    fromObject(o?: DropperObject): Primitive<DropperParams, DropperObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            wireDiameter: o['wireDiameter'],
            clampLength: o['clampLength'] || 0,
            clampWidth: o['clampWidth'] || 0,
            clampThickness: o['clampThickness'] || 0,
            conductive: o['conductive'] || false,
        } as any;
        return this;
    }

    toObject(): DropperObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['wireDiameter', this.params.wireDiameter],
            ['clampLength', this.params.clampLength],
            ['clampWidth', this.params.clampWidth],
            ['clampThickness', this.params.clampThickness],
            ['conductive', this.params.conductive],
        ])) as DropperObject;
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
        case RLPrimitiveType.Dropper:
            primitive = new DropperPrimitive(tp);
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
        case RLPrimitiveType.CantileverBase:
            primitive = new CantileverBasePrimitive(tp);
            break;
        case RLPrimitiveType.MWSaddle:
            primitive = new MWSaddlePrimitive(tp);
            break;
        case RLPrimitiveType.BalanceWeight:
            primitive = new BalanceWeightPrimitive(tp);
            break;
        case RLPrimitiveType.WeightRod:
            primitive = new WeightRodPrimitive(tp);
            break;
        case RLPrimitiveType.AnchorFitting:
            primitive = new AnchorFittingPrimitive(tp);
            break;
        case RLPrimitiveType.Crossing:
            primitive = new CrossingPrimitive(tp);
            break;
        case RLPrimitiveType.HeadSpan:
            primitive = new HeadSpanPrimitive(tp);
            break;
        case RLPrimitiveType.TransverseSpan:
            primitive = new TransverseSpanPrimitive(tp);
            break;
        case RLPrimitiveType.HangerPost:
            primitive = new HangerPostPrimitive(tp);
            break;
        case RLPrimitiveType.PortalFrame:
            primitive = new PortalFramePrimitive(tp);
            break;
        case RLPrimitiveType.SuspensionHardSpan:
            primitive = new SuspensionHardSpanPrimitive(tp);
            break;
        case RLPrimitiveType.PositioningCable:
            primitive = new PositioningCablePrimitive(tp);
            break;
        case RLPrimitiveType.AuxBracket:
            primitive = new AuxBracketPrimitive(tp);
            break;
        case RLPrimitiveType.Rail:
            primitive = new RailPrimitive(tp);
            break;
        case RLPrimitiveType.Sleeper:
            primitive = new SleeperPrimitive(tp);
            break;
        case RLPrimitiveType.Ballast:
            primitive = new BallastPrimitive(tp);
            break;
        case RLPrimitiveType.TrackSlab:
            primitive = new TrackSlabPrimitive(tp);
            break;
        case RLPrimitiveType.Fastener:
            primitive = new FastenerPrimitive(tp);
            break;
        case RLPrimitiveType.GuardRail:
            primitive = new GuardRailPrimitive(tp);
            break;
        case RLPrimitiveType.MastAssembly:
            primitive = new MastAssemblyPrimitive(tp);
            break;
        case RLPrimitiveType.WeightStack:
            primitive = new WeightStackPrimitive(tp);
            break;
        case RLPrimitiveType.RatchetCompensator:
            primitive = new RatchetCompensatorPrimitive(tp);
            break;
        case RLPrimitiveType.AuxiliaryWire:
            primitive = new AuxiliaryWirePrimitive(tp);
            break;
        case RLPrimitiveType.Disconnector:
            primitive = new DisconnectorPrimitive(tp);
            break;
        case RLPrimitiveType.Arrester:
            primitive = new ArresterPrimitive(tp);
            break;
        case RLPrimitiveType.PulleyCompensator:
            primitive = new PulleyCompensatorPrimitive(tp);
            break;
        case RLPrimitiveType.SleeveConnector:
            primitive = new SleeveConnectorPrimitive(tp);
            break;
        case RLPrimitiveType.SleeveEar:
            primitive = new SleeveEarPrimitive(tp);
            break;
        case RLPrimitiveType.SwitchRail:
            primitive = new SwitchRailPrimitive(tp);
            break;
        case RLPrimitiveType.Frog:
            primitive = new FrogPrimitive(tp);
            break;
        case RLPrimitiveType.Turnout:
            primitive = new TurnoutPrimitive(tp);
            break;
        case RLPrimitiveType.StraightTrack:
            primitive = new StraightTrackPrimitive(tp);
            break;
        case RLPrimitiveType.CurveTrack:
            primitive = new CurveTrackPrimitive(tp);
            break;
        case RLPrimitiveType.RailPair:
            primitive = new RailPairPrimitive(tp);
            break;
        case RLPrimitiveType.SleeperLayout:
            primitive = new SleeperLayoutPrimitive(tp);
            break;
        case RLPrimitiveType.RetarderPoint:
            primitive = new RetarderPointPrimitive(tp);
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

export class CantileverBasePrimitive extends BasePrimitive<CantileverBaseParams, CantileverBaseObject> {

    constructor(tp: TopoInstance, params?: CantileverBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.CantileverBase;
    }

    setDefault(): Primitive<CantileverBaseParams, CantileverBaseObject> {
        this.params = {
            length: 200,
            width: 100,
            height: 150,
            boltSpacing: 80,
            boltDiameter: 14,
            boltCount: 4,
        } as any;
        return this;
    }

    public setParams(params: CantileverBaseParams): Primitive<CantileverBaseParams, CantileverBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.width > 0 && this.params.height > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCantileverBase(this.params), false);
        }
        throw new Error("Invalid parameters for CantileverBase");
    }

    fromObject(o?: CantileverBaseObject): Primitive<CantileverBaseParams, CantileverBaseObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            width: o['width'],
            height: o['height'],
            boltSpacing: o['boltSpacing'],
            boltDiameter: o['boltDiameter'],
            boltCount: o['boltCount'],
        } as any;
        return this;
    }

    toObject(): CantileverBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['boltSpacing', this.params.boltSpacing],
            ['boltDiameter', this.params.boltDiameter],
            ['boltCount', this.params.boltCount],
        ])) as CantileverBaseObject;
    }
};

export class MWSaddlePrimitive extends BasePrimitive<MwSaddleParams, MWSaddleObject> {

    constructor(tp: TopoInstance, params?: MWSaddleObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.MWSaddle;
    }

    setDefault(): Primitive<MwSaddleParams, MWSaddleObject> {
        this.params = {
            length: 150,
            width: 100,
            height: 80,
            grooveRadius: 12,
            boltDiameter: 14,
        } as any;
        return this;
    }

    public setParams(params: MwSaddleParams): Primitive<MwSaddleParams, MWSaddleObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.grooveRadius > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createMwSaddle(this.params), false);
        }
        throw new Error("Invalid parameters for MWSaddle");
    }

    fromObject(o?: MWSaddleObject): Primitive<MwSaddleParams, MWSaddleObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            width: o['width'],
            height: o['height'],
            grooveRadius: o['grooveRadius'],
            boltDiameter: o['boltDiameter'],
        } as any;
        return this;
    }

    toObject(): MWSaddleObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['grooveRadius', this.params.grooveRadius],
            ['boltDiameter', this.params.boltDiameter],
        ])) as MWSaddleObject;
    }
};

export class BalanceWeightPrimitive extends BasePrimitive<BalanceWeightParams, BalanceWeightObject> {

    constructor(tp: TopoInstance, params?: BalanceWeightObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.BalanceWeight;
    }

    setDefault(): Primitive<BalanceWeightParams, BalanceWeightObject> {
        this.params = {
            width: 200,
            thickness: 75,
            height: 150,
            centerHoleDiameter: 30,
        } as any;
        return this;
    }

    public setParams(params: BalanceWeightParams): Primitive<BalanceWeightParams, BalanceWeightObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.width > 0 && this.params.height > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createBalanceWeight(this.params), false);
        }
        throw new Error("Invalid parameters for BalanceWeight");
    }

    fromObject(o?: BalanceWeightObject): Primitive<BalanceWeightParams, BalanceWeightObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            width: o['width'],
            thickness: o['thickness'],
            height: o['height'],
            centerHoleDiameter: o['centerHoleDiameter'],
        } as any;
        return this;
    }

    toObject(): BalanceWeightObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['height', this.params.height],
            ['centerHoleDiameter', this.params.centerHoleDiameter],
        ])) as BalanceWeightObject;
    }
};

export class WeightRodPrimitive extends BasePrimitive<WeightRodParams, WeightRodObject> {

    constructor(tp: TopoInstance, params?: WeightRodObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.WeightRod;
    }

    setDefault(): Primitive<WeightRodParams, WeightRodObject> {
        this.params = {
            rodDiameter: 20,
            rodLength: 1200,
            topHoleDiameter: 22,
        } as any;
        return this;
    }

    public setParams(params: WeightRodParams): Primitive<WeightRodParams, WeightRodObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.rodDiameter > 0 && this.params.rodLength > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createWeightRod(this.params), false);
        }
        throw new Error("Invalid parameters for WeightRod");
    }

    fromObject(o?: WeightRodObject): Primitive<WeightRodParams, WeightRodObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            rodDiameter: o['rodDiameter'],
            rodLength: o['rodLength'],
            topHoleDiameter: o['topHoleDiameter'],
        } as any;
        return this;
    }

    toObject(): WeightRodObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['rodDiameter', this.params.rodDiameter],
            ['rodLength', this.params.rodLength],
            ['topHoleDiameter', this.params.topHoleDiameter],
        ])) as WeightRodObject;
    }
};

export class AnchorFittingPrimitive extends BasePrimitive<AnchorFittingParams, AnchorFittingObject> {

    constructor(tp: TopoInstance, params?: AnchorFittingObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.AnchorFitting;
    }

    private toFittingType(v?: number): any {
        if (v === 2) return this.tp.AnchorFittingType.DOUBLE_EAR as any;
        if (v === 3) return this.tp.AnchorFittingType.WEDGE_CLAMP as any;
        return this.tp.AnchorFittingType.ROD_AND_RING as any;
    }

    private fromFittingType(): number {
        if (this.params.type === this.tp.AnchorFittingType.DOUBLE_EAR) return 2;
        if (this.params.type === this.tp.AnchorFittingType.WEDGE_CLAMP) return 3;
        return 1;
    }

    setDefault(): Primitive<AnchorFittingParams, AnchorFittingObject> {
        this.params = {
            type: this.tp.AnchorFittingType.ROD_AND_RING as any,
            length: 300,
            diameter: 20,
        } as any;
        return this;
    }

    public setParams(params: AnchorFittingParams): Primitive<AnchorFittingParams, AnchorFittingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.diameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createAnchorFitting(this.params), false);
        }
        throw new Error("Invalid parameters for AnchorFitting");
    }

    fromObject(o?: AnchorFittingObject): Primitive<AnchorFittingParams, AnchorFittingObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            type: this.toFittingType(o['fittingType']),
            length: o['length'],
            diameter: o['diameter'],
        } as any;
        return this;
    }

    toObject(): AnchorFittingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['fittingType', this.fromFittingType()],
            ['length', this.params.length],
            ['diameter', this.params.diameter],
        ])) as AnchorFittingObject;
    }
};

export class CrossingPrimitive extends BasePrimitive<CrossingParams, CrossingObject> {

    constructor(tp: TopoInstance, params?: CrossingObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Crossing;
    }

    setDefault(): Primitive<CrossingParams, CrossingObject> {
        this.params = {
            limitPipeLength: 1200,
            pipeDiameter: 40,
            wireDiameter: 14.5,
            heightDiff: 20,
        } as any;
        return this;
    }

    public setParams(params: CrossingParams): Primitive<CrossingParams, CrossingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.limitPipeLength > 0 && this.params.pipeDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCrossing(this.params), false);
        }
        throw new Error("Invalid parameters for Crossing");
    }

    fromObject(o?: CrossingObject): Primitive<CrossingParams, CrossingObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            limitPipeLength: o['limitPipeLength'],
            pipeDiameter: o['pipeDiameter'],
            wireDiameter: o['wireDiameter'],
            heightDiff: o['heightDiff'],
        } as any;
        return this;
    }

    toObject(): CrossingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['limitPipeLength', this.params.limitPipeLength],
            ['pipeDiameter', this.params.pipeDiameter],
            ['wireDiameter', this.params.wireDiameter],
            ['heightDiff', this.params.heightDiff],
        ])) as CrossingObject;
    }
};

export class HeadSpanPrimitive extends BasePrimitive<HeadSpanParams, HeadSpanObject> {

    constructor(tp: TopoInstance, params?: HeadSpanObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.HeadSpan;
    }

    setDefault(): Primitive<HeadSpanParams, HeadSpanObject> {
        this.params = {
            span: 20000,
            hangPointCount: 2,
            hangPointSpacing: 5000,
            crossCatenaryDiameter: 16,
            crossCatenarySag: 500,
            upperRopeDiameter: 14,
            lowerRopeDiameter: 14,
            insulatorLength: 700,
        } as any;
        return this;
    }

    public setParams(params: HeadSpanParams): Primitive<HeadSpanParams, HeadSpanObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.span > 0 && this.params.hangPointCount > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createHeadSpan(this.params), false);
        }
        throw new Error("Invalid parameters for HeadSpan");
    }

    fromObject(o?: HeadSpanObject): Primitive<HeadSpanParams, HeadSpanObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            span: o['span'],
            hangPointCount: o['hangPointCount'],
            hangPointSpacing: o['hangPointSpacing'],
            crossCatenaryDiameter: o['crossCatenaryDiameter'],
            crossCatenarySag: o['crossCatenarySag'],
            upperRopeDiameter: o['upperRopeDiameter'],
            lowerRopeDiameter: o['lowerRopeDiameter'],
            insulatorLength: o['insulatorLength'],
        } as any;
        return this;
    }

    toObject(): HeadSpanObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['span', this.params.span],
            ['hangPointCount', this.params.hangPointCount],
            ['hangPointSpacing', this.params.hangPointSpacing],
            ['crossCatenaryDiameter', this.params.crossCatenaryDiameter],
            ['crossCatenarySag', this.params.crossCatenarySag],
            ['upperRopeDiameter', this.params.upperRopeDiameter],
            ['lowerRopeDiameter', this.params.lowerRopeDiameter],
            ['insulatorLength', this.params.insulatorLength],
        ])) as HeadSpanObject;
    }
};

export class TransverseSpanPrimitive extends BasePrimitive<TransverseSpanParams, TransverseSpanObject> {

    constructor(tp: TopoInstance, params?: TransverseSpanObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.TransverseSpan;
    }

    private toBeamType(v?: number): any {
        if (v === 2) return this.tp.BeamSectionType.H_BEAM_T as any;
        if (v === 3) return this.tp.BeamSectionType.TRUSS as any;
        if (v === 4) return this.tp.BeamSectionType.COMBO as any;
        return this.tp.BeamSectionType.BOX as any;
    }

    private fromBeamType(): number {
        if (this.params.beamType === this.tp.BeamSectionType.H_BEAM_T) return 2;
        if (this.params.beamType === this.tp.BeamSectionType.TRUSS) return 3;
        if (this.params.beamType === this.tp.BeamSectionType.COMBO) return 4;
        return 1;
    }

    setDefault(): Primitive<TransverseSpanParams, TransverseSpanObject> {
        this.params = {
            span: 20000,
            beamType: this.tp.BeamSectionType.BOX as any,
            beamHeight: 800,
            beamWidth: 600,
            beamThickness: 10,
            mastHeight: 7000,
            mastWidth: 400,
        } as any;
        return this;
    }

    public setParams(params: TransverseSpanParams): Primitive<TransverseSpanParams, TransverseSpanObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.span > 0 && this.params.beamHeight > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTransverseSpan(this.params), false);
        }
        throw new Error("Invalid parameters for TransverseSpan");
    }

    fromObject(o?: TransverseSpanObject): Primitive<TransverseSpanParams, TransverseSpanObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            span: o['span'],
            beamType: this.toBeamType(o['beamType']),
            beamHeight: o['beamHeight'],
            beamWidth: o['beamWidth'],
            beamThickness: o['beamThickness'],
            mastHeight: o['mastHeight'],
            mastWidth: o['mastWidth'],
        } as any;
        return this;
    }

    toObject(): TransverseSpanObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['span', this.params.span],
            ['beamType', this.fromBeamType()],
            ['beamHeight', this.params.beamHeight],
            ['beamWidth', this.params.beamWidth],
            ['beamThickness', this.params.beamThickness],
            ['mastHeight', this.params.mastHeight],
            ['mastWidth', this.params.mastWidth],
        ])) as TransverseSpanObject;
    }
};

export class HangerPostPrimitive extends BasePrimitive<HangerPostParams, HangerPostObject> {

    constructor(tp: TopoInstance, params?: HangerPostObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.HangerPost;
    }

    private toSectionType(v?: number): any {
        if (v === 2) return this.tp.HangerPostSectionType.SQUARE as any;
        if (v === 3) return this.tp.HangerPostSectionType.H_BEAM_H as any;
        return this.tp.HangerPostSectionType.ROUND as any;
    }

    private fromSectionType(): number {
        if (this.params.sectionType === this.tp.HangerPostSectionType.SQUARE) return 2;
        if (this.params.sectionType === this.tp.HangerPostSectionType.H_BEAM_H) return 3;
        return 1;
    }

    setDefault(): Primitive<HangerPostParams, HangerPostObject> {
        this.params = {
            sectionType: this.tp.HangerPostSectionType.ROUND as any,
            length: 1500,
            sectionSize: 100,
            wallThickness: 5,
            topFlangeSize: 200,
            topFlangeThick: 12,
            bottomFlangeSize: 200,
            bottomFlangeThick: 12,
            boltDiameter: 14,
            boltSpacing: 100,
        } as any;
        return this;
    }

    public setParams(params: HangerPostParams): Primitive<HangerPostParams, HangerPostObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.sectionSize > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createHangerPost(this.params), false);
        }
        throw new Error("Invalid parameters for HangerPost");
    }

    fromObject(o?: HangerPostObject): Primitive<HangerPostParams, HangerPostObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            sectionType: this.toSectionType(o['sectionType']),
            length: o['length'],
            sectionSize: o['sectionSize'],
            wallThickness: o['wallThickness'],
            topFlangeSize: o['topFlangeSize'],
            topFlangeThick: o['topFlangeThick'],
            bottomFlangeSize: o['bottomFlangeSize'],
            bottomFlangeThick: o['bottomFlangeThick'],
            boltDiameter: o['boltDiameter'],
            boltSpacing: o['boltSpacing'],
        } as any;
        return this;
    }

    toObject(): HangerPostObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['sectionType', this.fromSectionType()],
            ['length', this.params.length],
            ['sectionSize', this.params.sectionSize],
            ['wallThickness', this.params.wallThickness],
            ['topFlangeSize', this.params.topFlangeSize],
            ['topFlangeThick', this.params.topFlangeThick],
            ['bottomFlangeSize', this.params.bottomFlangeSize],
            ['bottomFlangeThick', this.params.bottomFlangeThick],
            ['boltDiameter', this.params.boltDiameter],
            ['boltSpacing', this.params.boltSpacing],
        ])) as HangerPostObject;
    }
};

export class PortalFramePrimitive extends BasePrimitive<PortalFrameParams, PortalFrameObject> {

    constructor(tp: TopoInstance, params?: PortalFrameObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.PortalFrame;
    }

    setDefault(): Primitive<PortalFrameParams, PortalFrameObject> {
        this.params = {
            frameHeight: 2000,
            frameWidth: 5000,
            postDiameter: 100,
            postWallThick: 5,
            beamDiameter: 80,
            beamWallThick: 4,
            beamLength: 5000,
            basePlateLength: 300,
            basePlateWidth: 300,
            basePlateThick: 12,
            hangPointCount: 2,
            hangPointSpacing: 2000,
            boltSpacing: 200,
            boltDiameter: 14,
        } as any;
        return this;
    }

    public setParams(params: PortalFrameParams): Primitive<PortalFrameParams, PortalFrameObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.frameHeight > 0 && this.params.frameWidth > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPortalFrame(this.params), false);
        }
        throw new Error("Invalid parameters for PortalFrame");
    }

    fromObject(o?: PortalFrameObject): Primitive<PortalFrameParams, PortalFrameObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            frameHeight: o['frameHeight'],
            frameWidth: o['frameWidth'],
            postDiameter: o['postDiameter'],
            postWallThick: o['postWallThick'],
            beamDiameter: o['beamDiameter'],
            beamWallThick: o['beamWallThick'],
            beamLength: o['beamLength'],
            basePlateLength: o['basePlateLength'],
            basePlateWidth: o['basePlateWidth'],
            basePlateThick: o['basePlateThick'],
            hangPointCount: o['hangPointCount'],
            hangPointSpacing: o['hangPointSpacing'],
            boltSpacing: o['boltSpacing'],
            boltDiameter: o['boltDiameter'],
        } as any;
        return this;
    }

    toObject(): PortalFrameObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['frameHeight', this.params.frameHeight],
            ['frameWidth', this.params.frameWidth],
            ['postDiameter', this.params.postDiameter],
            ['postWallThick', this.params.postWallThick],
            ['beamDiameter', this.params.beamDiameter],
            ['beamWallThick', this.params.beamWallThick],
            ['beamLength', this.params.beamLength],
            ['basePlateLength', this.params.basePlateLength],
            ['basePlateWidth', this.params.basePlateWidth],
            ['basePlateThick', this.params.basePlateThick],
            ['hangPointCount', this.params.hangPointCount],
            ['hangPointSpacing', this.params.hangPointSpacing],
            ['boltSpacing', this.params.boltSpacing],
            ['boltDiameter', this.params.boltDiameter],
        ])) as PortalFrameObject;
    }
};

export class SuspensionHardSpanPrimitive extends BasePrimitive<SuspensionHardSpanParams, SuspensionHardSpanObject> {

    constructor(tp: TopoInstance, params?: SuspensionHardSpanObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.SuspensionHardSpan;
    }

    setDefault(): Primitive<SuspensionHardSpanParams, SuspensionHardSpanObject> {
        this.params = {
            span: 20000,
            mastHeight: 7000,
            mastWidth: 400,
            cableDiameter: 16,
            cableSag: 600,
            dropperCableDiameter: 10,
            dropperCount: 3,
            dropperSpacing: 4000,
            insulatorLength: 700,
            insulatorDiameter: 120,
        } as any;
        return this;
    }

    public setParams(params: SuspensionHardSpanParams): Primitive<SuspensionHardSpanParams, SuspensionHardSpanObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.span > 0 && this.params.mastHeight > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSuspensionHardSpan(this.params), false);
        }
        throw new Error("Invalid parameters for SuspensionHardSpan");
    }

    fromObject(o?: SuspensionHardSpanObject): Primitive<SuspensionHardSpanParams, SuspensionHardSpanObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            span: o['span'],
            mastHeight: o['mastHeight'],
            mastWidth: o['mastWidth'],
            cableDiameter: o['cableDiameter'],
            cableSag: o['cableSag'],
            dropperCableDiameter: o['dropperCableDiameter'],
            dropperCount: o['dropperCount'],
            dropperSpacing: o['dropperSpacing'],
            insulatorLength: o['insulatorLength'],
            insulatorDiameter: o['insulatorDiameter'],
        } as any;
        return this;
    }

    toObject(): SuspensionHardSpanObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['span', this.params.span],
            ['mastHeight', this.params.mastHeight],
            ['mastWidth', this.params.mastWidth],
            ['cableDiameter', this.params.cableDiameter],
            ['cableSag', this.params.cableSag],
            ['dropperCableDiameter', this.params.dropperCableDiameter],
            ['dropperCount', this.params.dropperCount],
            ['dropperSpacing', this.params.dropperSpacing],
            ['insulatorLength', this.params.insulatorLength],
            ['insulatorDiameter', this.params.insulatorDiameter],
        ])) as SuspensionHardSpanObject;
    }
};

export class PositioningCablePrimitive extends BasePrimitive<PositioningCableParams, PositioningCableObject> {

    constructor(tp: TopoInstance, params?: PositioningCableObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.PositioningCable;
    }

    setDefault(): Primitive<PositioningCableParams, PositioningCableObject> {
        this.params = {
            diameter: 9,
            topPoint: toPnt(this.tp, [0, 0, 1000]),
            bottomPoint: toPnt(this.tp, [0, 0, 0]),
            adjustable: false,
        } as any;
        return this;
    }

    public setParams(params: PositioningCableParams): Primitive<PositioningCableParams, PositioningCableObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.diameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPositioningCable(this.params), false);
        }
        throw new Error("Invalid parameters for PositioningCable");
    }

    fromObject(o?: PositioningCableObject): Primitive<PositioningCableParams, PositioningCableObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            diameter: o['diameter'],
            topPoint: toPnt(this.tp, o['topPoint']),
            bottomPoint: toPnt(this.tp, o['bottomPoint']),
            adjustable: o['adjustable'] || false,
        } as any;
        return this;
    }

    toObject(): PositioningCableObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['diameter', this.params.diameter],
            ['topPoint', fromPnt(this.params.topPoint)],
            ['bottomPoint', fromPnt(this.params.bottomPoint)],
            ['adjustable', this.params.adjustable],
        ])) as PositioningCableObject;
    }
};

export class AuxBracketPrimitive extends BasePrimitive<AuxBracketParams, AuxBracketObject> {

    constructor(tp: TopoInstance, params?: AuxBracketObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.AuxBracket;
    }

    private toBracketType(v?: number): any {
        if (v === 2) return this.tp.AuxBracketType.WALL_MOUNT as any;
        if (v === 3) return this.tp.AuxBracketType.DOUBLE_MAST as any;
        return this.tp.AuxBracketType.CROSS_ARM as any;
    }

    private fromBracketType(): number {
        if (this.params.type === this.tp.AuxBracketType.WALL_MOUNT) return 2;
        if (this.params.type === this.tp.AuxBracketType.DOUBLE_MAST) return 3;
        return 1;
    }

    setDefault(): Primitive<AuxBracketParams, AuxBracketObject> {
        this.params = {
            type: this.tp.AuxBracketType.CROSS_ARM as any,
            mountHeight: 5000,
            overhangLength: 800,
            bracketLength: 1000,
            bracketWidth: 100,
            boltSpacing: 80,
            boltDiameter: 14,
        } as any;
        return this;
    }

    public setParams(params: AuxBracketParams): Primitive<AuxBracketParams, AuxBracketObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.mountHeight > 0 && this.params.bracketLength > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createAuxBracket(this.params), false);
        }
        throw new Error("Invalid parameters for AuxBracket");
    }

    fromObject(o?: AuxBracketObject): Primitive<AuxBracketParams, AuxBracketObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            type: this.toBracketType(o['bracketType']),
            mountHeight: o['mountHeight'],
            overhangLength: o['overhangLength'],
            bracketLength: o['bracketLength'],
            bracketWidth: o['bracketWidth'],
            boltSpacing: o['boltSpacing'],
            boltDiameter: o['boltDiameter'],
        } as any;
        return this;
    }

    toObject(): AuxBracketObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['bracketType', this.fromBracketType()],
            ['mountHeight', this.params.mountHeight],
            ['overhangLength', this.params.overhangLength],
            ['bracketLength', this.params.bracketLength],
            ['bracketWidth', this.params.bracketWidth],
            ['boltSpacing', this.params.boltSpacing],
            ['boltDiameter', this.params.boltDiameter],
        ])) as AuxBracketObject;
    }
};

export class RailPrimitive extends BasePrimitive<RailParams, RailObject> {

    constructor(tp: TopoInstance, params?: RailObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Rail;
    }

    setDefault(): Primitive<RailParams, RailObject> {
        this.params = {
            railHeight: 176,
            headWidth: 73,
            baseWidth: 150,
            webThickness: 16.5,
            headHeight: 48,
            baseHeight: 28,
            headRadius: 13,
            standardLength: 25000,
        } as any;
        return this;
    }

    public setParams(params: RailParams): Primitive<RailParams, RailObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.railHeight > 0 && this.params.baseWidth > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRail(this.params), false);
        }
        throw new Error("Invalid parameters for Rail");
    }

    fromObject(o?: RailObject): Primitive<RailParams, RailObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            railHeight: o['railHeight'],
            headWidth: o['headWidth'],
            baseWidth: o['baseWidth'],
            webThickness: o['webThickness'],
            headHeight: o['headHeight'],
            baseHeight: o['baseHeight'],
            headRadius: o['headRadius'],
            standardLength: o['standardLength'],
        } as any;
        return this;
    }

    toObject(): RailObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['railHeight', this.params.railHeight],
            ['headWidth', this.params.headWidth],
            ['baseWidth', this.params.baseWidth],
            ['webThickness', this.params.webThickness],
            ['headHeight', this.params.headHeight],
            ['baseHeight', this.params.baseHeight],
            ['headRadius', this.params.headRadius],
            ['standardLength', this.params.standardLength],
        ])) as RailObject;
    }
};

export class SleeperPrimitive extends BasePrimitive<SleeperParams, SleeperObject> {

    constructor(tp: TopoInstance, params?: SleeperObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Sleeper;
    }

    private toShapeType(v?: number): any {
        if (v === 1) return this.tp.SleeperShapeType.RECTANGULAR as any;
        return this.tp.SleeperShapeType.TRAPEZOIDAL as any;
    }

    private fromShapeType(): number {
        return this.params.shapeType === this.tp.SleeperShapeType.RECTANGULAR ? 1 : 2;
    }

    setDefault(): Primitive<SleeperParams, SleeperObject> {
        this.params = {
            shapeType: this.tp.SleeperShapeType.TRAPEZOIDAL as any,
            length: 2500,
            width: 260,
            height: 200,
            gauge: 1435,
            railBaseWidth: 150,
            grooveDepth: 8,
            spacing: 600,
        } as any;
        return this;
    }

    public setParams(params: SleeperParams): Primitive<SleeperParams, SleeperObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.width > 0 && this.params.height > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSleeper(this.params), false);
        }
        throw new Error("Invalid parameters for Sleeper");
    }

    fromObject(o?: SleeperObject): Primitive<SleeperParams, SleeperObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            shapeType: this.toShapeType(o['shapeType']),
            length: o['length'],
            width: o['width'],
            height: o['height'],
            gauge: o['gauge'],
            railBaseWidth: o['railBaseWidth'],
            grooveDepth: o['grooveDepth'],
            spacing: o['spacing'],
        } as any;
        return this;
    }

    toObject(): SleeperObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['shapeType', this.fromShapeType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['gauge', this.params.gauge],
            ['railBaseWidth', this.params.railBaseWidth],
            ['grooveDepth', this.params.grooveDepth],
            ['spacing', this.params.spacing],
        ])) as SleeperObject;
    }
};

export class BallastPrimitive extends BasePrimitive<BallastParams, BallastObject> {

    constructor(tp: TopoInstance, params?: BallastObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Ballast;
    }

    setDefault(): Primitive<BallastParams, BallastObject> {
        this.params = {
            topWidth: 3600,
            thickness: 300,
            sideSlope: 1.5,
            centerlineSegments: [{
                type: this.tp.CenterlineCurveType.LINE as any,
                points: toPntList(this.tp, [[0, 0, 0], [10000, 0, 0]]),
            }],
            tiltAngle: 0,
        } as any;
        return this;
    }

    public setParams(params: BallastParams): Primitive<BallastParams, BallastObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.topWidth > 0 && this.params.thickness > 0
            && this.params.centerlineSegments !== undefined && this.params.centerlineSegments.length > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createBallast(this.params), false);
        }
        throw new Error("Invalid parameters for Ballast");
    }

    fromObject(o?: BallastObject): Primitive<BallastParams, BallastObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            topWidth: o['topWidth'],
            thickness: o['thickness'],
            sideSlope: o['sideSlope'],
            centerlineSegments: [{
                type: this.tp.CenterlineCurveType.LINE as any,
                points: toPntList(this.tp, o['centerline']),
            }],
            tiltAngle: 0,
        } as any;
        return this;
    }

    toObject(): BallastObject | undefined {
        const segs = this.params.centerlineSegments;
        const centerline = segs && segs.length > 0 ? fromPntList(segs[0].points as any[]) : [];
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['centerline', centerline],
            ['topWidth', this.params.topWidth],
            ['thickness', this.params.thickness],
            ['sideSlope', this.params.sideSlope],
        ])) as BallastObject;
    }
};

export class TrackSlabPrimitive extends BasePrimitive<TrackSlabParams, TrackSlabObject> {

    constructor(tp: TopoInstance, params?: TrackSlabObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.TrackSlab;
    }

    setDefault(): Primitive<TrackSlabParams, TrackSlabObject> {
        this.params = {
            length: 1200,
            width: 2500,
            thickness: 200,
            railSeatCount: 2,
            railSeatSpacing: 600,
            cementAsphaltThickness: 50,
        } as any;
        return this;
    }

    public setParams(params: TrackSlabParams): Primitive<TrackSlabParams, TrackSlabObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.width > 0 && this.params.thickness > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTrackSlab(this.params), false);
        }
        throw new Error("Invalid parameters for TrackSlab");
    }

    fromObject(o?: TrackSlabObject): Primitive<TrackSlabParams, TrackSlabObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            width: o['width'],
            thickness: o['thickness'],
            railSeatCount: o['railSeatCount'],
            railSeatSpacing: o['railSeatSpacing'],
            cementAsphaltThickness: o['cementAsphaltThickness'],
        } as any;
        return this;
    }

    toObject(): TrackSlabObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['railSeatCount', this.params.railSeatCount],
            ['railSeatSpacing', this.params.railSeatSpacing],
            ['cementAsphaltThickness', this.params.cementAsphaltThickness],
        ])) as TrackSlabObject;
    }
};

export class FastenerPrimitive extends BasePrimitive<FastenerParams, FastenerObject> {

    constructor(tp: TopoInstance, params?: FastenerObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Fastener;
    }

    setDefault(): Primitive<FastenerParams, FastenerObject> {
        this.params = {
            spacing: 600,
            gauge: 1435,
            padThickness: 10,
            padLength: 300,
            padWidth: 200,
        } as any;
        return this;
    }

    public setParams(params: FastenerParams): Primitive<FastenerParams, FastenerObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.spacing > 0 && this.params.gauge > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createFastener(this.params), false);
        }
        throw new Error("Invalid parameters for Fastener");
    }

    fromObject(o?: FastenerObject): Primitive<FastenerParams, FastenerObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            spacing: o['spacing'],
            gauge: o['gauge'],
            padThickness: o['padThickness'],
            padLength: o['padLength'],
            padWidth: o['padWidth'],
        } as any;
        return this;
    }

    toObject(): FastenerObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['spacing', this.params.spacing],
            ['gauge', this.params.gauge],
            ['padThickness', this.params.padThickness],
            ['padLength', this.params.padLength],
            ['padWidth', this.params.padWidth],
        ])) as FastenerObject;
    }
};

export class GuardRailPrimitive extends BasePrimitive<GuardRailParams, GuardRailObject> {

    constructor(tp: TopoInstance, params?: GuardRailObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.GuardRail;
    }

    setDefault(): Primitive<GuardRailParams, GuardRailObject> {
        this.params = {
            height: 176,
            headWidth: 73,
            baseWidth: 150,
            grooveWidth: 45,
            totalLength: 3000,
            gaugeDistance: 42,
        } as any;
        return this;
    }

    public setParams(params: GuardRailParams): Primitive<GuardRailParams, GuardRailObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 && this.params.totalLength > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createGuardRail(this.params), false);
        }
        throw new Error("Invalid parameters for GuardRail");
    }

    fromObject(o?: GuardRailObject): Primitive<GuardRailParams, GuardRailObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            height: o['height'],
            headWidth: o['headWidth'],
            baseWidth: o['baseWidth'],
            grooveWidth: o['grooveWidth'],
            totalLength: o['totalLength'],
            gaugeDistance: o['gaugeDistance'],
        } as any;
        return this;
    }

    toObject(): GuardRailObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['headWidth', this.params.headWidth],
            ['baseWidth', this.params.baseWidth],
            ['grooveWidth', this.params.grooveWidth],
            ['totalLength', this.params.totalLength],
            ['gaugeDistance', this.params.gaugeDistance],
        ])) as GuardRailObject;
    }
};

export class MastAssemblyPrimitive extends BasePrimitive<MastAssemblyParams, MastAssemblyObject> {

    constructor(tp: TopoInstance, params?: MastAssemblyObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.MastAssembly;
    }

    setDefault(): Primitive<MastAssemblyParams, MastAssemblyObject> {
        this.params = {
            mastType: 1,
            mastHeight: 8000,
            cantileverType: 1,
            hasCrossArm: false,
            armDiameter: 60,
            stagger: 300,
            compType: 0,
            ratedTension: 15,
            hasGuyWire: false,
            contactHeight: 5300,
            structureHeight: 1400,
            sideOffset: 2900,
        } as any;
        return this;
    }

    public setParams(params: MastAssemblyParams): Primitive<MastAssemblyParams, MastAssemblyObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.mastHeight > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createMastAssembly(this.params), false);
        }
        throw new Error("Invalid parameters for MastAssembly");
    }

    fromObject(o?: MastAssemblyObject): Primitive<MastAssemblyParams, MastAssemblyObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            mastType: o['mastType'],
            mastHeight: o['mastHeight'],
            cantileverType: o['cantileverType'],
            hasCrossArm: o['hasCrossArm'] || false,
            armDiameter: o['armDiameter'],
            stagger: o['stagger'],
            compType: o['compType'],
            ratedTension: o['ratedTension'],
            hasGuyWire: o['hasGuyWire'] || false,
            contactHeight: o['contactHeight'] || 5300,
            structureHeight: o['structureHeight'] || 1400,
            sideOffset: o['sideOffset'] || 2900,
        } as any;
        return this;
    }

    toObject(): MastAssemblyObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['mastType', this.params.mastType],
            ['mastHeight', this.params.mastHeight],
            ['cantileverType', this.params.cantileverType],
            ['hasCrossArm', this.params.hasCrossArm],
            ['armDiameter', this.params.armDiameter],
            ['stagger', this.params.stagger],
            ['compType', this.params.compType],
            ['ratedTension', this.params.ratedTension],
            ['hasGuyWire', this.params.hasGuyWire],
            ['contactHeight', this.params.contactHeight],
            ['structureHeight', this.params.structureHeight],
            ['sideOffset', this.params.sideOffset],
        ])) as MastAssemblyObject;
    }
};

export class WeightStackPrimitive extends BasePrimitive<WeightStackParams, WeightStackObject> {

    constructor(tp: TopoInstance, params?: WeightStackObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.WeightStack;
    }

    setDefault(): Primitive<WeightStackParams, WeightStackObject> {
        this.params = {
            blockCount: 8,
            blockDiameter: 380,
            blockHeight: 75,
            blockGap: 2,
            rodDiameter: 20,
            rodLength: 1200,
            holeDiameter: 30,
        } as any;
        return this;
    }

    public setParams(params: WeightStackParams): Primitive<WeightStackParams, WeightStackObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.blockCount > 0 && this.params.blockDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createWeightStack(this.params), false);
        }
        throw new Error("Invalid parameters for WeightStack");
    }

    fromObject(o?: WeightStackObject): Primitive<WeightStackParams, WeightStackObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            blockCount: o['blockCount'],
            blockDiameter: o['blockDiameter'],
            blockHeight: o['blockHeight'],
            blockGap: o['blockGap'],
            rodDiameter: o['rodDiameter'],
            rodLength: o['rodLength'],
            holeDiameter: o['holeDiameter'],
        } as any;
        return this;
    }

    toObject(): WeightStackObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['blockCount', this.params.blockCount],
            ['blockDiameter', this.params.blockDiameter],
            ['blockHeight', this.params.blockHeight],
            ['blockGap', this.params.blockGap],
            ['rodDiameter', this.params.rodDiameter],
            ['rodLength', this.params.rodLength],
            ['holeDiameter', this.params.holeDiameter],
        ])) as WeightStackObject;
    }
};

export class RatchetCompensatorPrimitive extends BasePrimitive<RatchetCompensatorParams, RatchetCompensatorObject> {

    constructor(tp: TopoInstance, params?: RatchetCompensatorObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.RatchetCompensator;
    }

    setDefault(): Primitive<RatchetCompensatorParams, RatchetCompensatorObject> {
        this.params = {
            wheelDiameter: 400,
            wheelWidth: 60,
            ropeDiameter: 9,
            strokeLength: 1200,
            stack: {
                blockCount: 8,
                blockDiameter: 380,
                blockHeight: 75,
                blockGap: 2,
                rodDiameter: 20,
                rodLength: 1200,
                holeDiameter: 30,
            },
        } as any;
        return this;
    }

    public setParams(params: RatchetCompensatorParams): Primitive<RatchetCompensatorParams, RatchetCompensatorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.wheelDiameter > 0 && this.params.strokeLength > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRatchetCompensator(this.params), false);
        }
        throw new Error("Invalid parameters for RatchetCompensator");
    }

    fromObject(o?: RatchetCompensatorObject): Primitive<RatchetCompensatorParams, RatchetCompensatorObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            wheelDiameter: o['wheelDiameter'],
            wheelWidth: o['wheelWidth'],
            ropeDiameter: o['ropeDiameter'],
            strokeLength: o['strokeLength'],
            stack: { ...o['stack'] },
        } as any;
        return this;
    }

    toObject(): RatchetCompensatorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['wheelDiameter', this.params.wheelDiameter],
            ['wheelWidth', this.params.wheelWidth],
            ['ropeDiameter', this.params.ropeDiameter],
            ['strokeLength', this.params.strokeLength],
            ['stack', { ...this.params.stack }],
        ])) as RatchetCompensatorObject;
    }
};

export class AuxiliaryWirePrimitive extends BasePrimitive<AuxiliaryWireParams, AuxiliaryWireObject> {

    constructor(tp: TopoInstance, params?: AuxiliaryWireObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.AuxiliaryWire;
    }

    setDefault(): Primitive<AuxiliaryWireParams, AuxiliaryWireObject> {
        this.params = {
            diameter: 12,
            sag: 50,
            ratedTension: 10,
        } as any;
        return this;
    }

    public setParams(params: AuxiliaryWireParams): Primitive<AuxiliaryWireParams, AuxiliaryWireObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.diameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createAuxiliaryWire(
                this.params,
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Pnt_3(1000, 0, 0)), false);
        }
        throw new Error("Invalid parameters for AuxiliaryWire");
    }

    fromObject(o?: AuxiliaryWireObject): Primitive<AuxiliaryWireParams, AuxiliaryWireObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            diameter: o['diameter'],
            sag: o['sag'],
            ratedTension: o['ratedTension'],
        } as any;
        return this;
    }

    toObject(): AuxiliaryWireObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['diameter', this.params.diameter],
            ['sag', this.params.sag],
            ['ratedTension', this.params.ratedTension],
        ])) as AuxiliaryWireObject;
    }
};

export class DisconnectorPrimitive extends BasePrimitive<DisconnectorParams, DisconnectorObject> {

    constructor(tp: TopoInstance, params?: DisconnectorObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Disconnector;
    }

    setDefault(): Primitive<DisconnectorParams, DisconnectorObject> {
        this.params = {
            baseLength: 900,
            baseWidth: 220,
            insulatorHeight: 600,
            bladeLength: 800,
            openAngle: 75,
        } as any;
        return this;
    }

    public setParams(params: DisconnectorParams): Primitive<DisconnectorParams, DisconnectorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.baseLength > 0 && this.params.bladeLength > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createDisconnector(this.params), false);
        }
        throw new Error("Invalid parameters for Disconnector");
    }

    fromObject(o?: DisconnectorObject): Primitive<DisconnectorParams, DisconnectorObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            baseLength: o['baseLength'],
            baseWidth: o['baseWidth'],
            insulatorHeight: o['insulatorHeight'],
            bladeLength: o['bladeLength'],
            openAngle: o['openAngle'],
        } as any;
        return this;
    }

    toObject(): DisconnectorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['baseLength', this.params.baseLength],
            ['baseWidth', this.params.baseWidth],
            ['insulatorHeight', this.params.insulatorHeight],
            ['bladeLength', this.params.bladeLength],
            ['openAngle', this.params.openAngle],
        ])) as DisconnectorObject;
    }
};

export class ArresterPrimitive extends BasePrimitive<ArresterParams, ArresterObject> {

    constructor(tp: TopoInstance, params?: ArresterObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Arrester;
    }

    setDefault(): Primitive<ArresterParams, ArresterObject> {
        this.params = {
            height: 800,
            outerDiameter: 120,
            shedDiameter: 160,
            shedSpacing: 60,
            shedCount: 8,
        } as any;
        return this;
    }

    public setParams(params: ArresterParams): Primitive<ArresterParams, ArresterObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 && this.params.outerDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createArrester(this.params), false);
        }
        throw new Error("Invalid parameters for Arrester");
    }

    fromObject(o?: ArresterObject): Primitive<ArresterParams, ArresterObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            height: o['height'],
            outerDiameter: o['outerDiameter'],
            shedDiameter: o['shedDiameter'],
            shedSpacing: o['shedSpacing'],
            shedCount: o['shedCount'],
        } as any;
        return this;
    }

    toObject(): ArresterObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['outerDiameter', this.params.outerDiameter],
            ['shedDiameter', this.params.shedDiameter],
            ['shedSpacing', this.params.shedSpacing],
            ['shedCount', this.params.shedCount],
        ])) as ArresterObject;
    }
};

export class PulleyCompensatorPrimitive extends BasePrimitive<PulleyCompensatorParams, PulleyCompensatorObject> {

    constructor(tp: TopoInstance, params?: PulleyCompensatorObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.PulleyCompensator;
    }

    setDefault(): Primitive<PulleyCompensatorParams, PulleyCompensatorObject> {
        this.params = {
            pulleyDiameter: 250,
            grooveWidth: 14,
            pulleyCount: 2,
            ropeDiameter: 9,
            strokeLength: 1000,
            stack: {
                blockCount: 8,
                blockDiameter: 380,
                blockHeight: 75,
                blockGap: 2,
                rodDiameter: 20,
                rodLength: 1200,
                holeDiameter: 30,
            },
            hasLimitFrame: false,
        } as any;
        return this;
    }

    public setParams(params: PulleyCompensatorParams): Primitive<PulleyCompensatorParams, PulleyCompensatorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.pulleyDiameter > 0 && this.params.pulleyCount > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPulleyCompensator(this.params), false);
        }
        throw new Error("Invalid parameters for PulleyCompensator");
    }

    fromObject(o?: PulleyCompensatorObject): Primitive<PulleyCompensatorParams, PulleyCompensatorObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            pulleyDiameter: o['pulleyDiameter'],
            grooveWidth: o['grooveWidth'],
            pulleyCount: o['pulleyCount'],
            ropeDiameter: o['ropeDiameter'],
            strokeLength: o['strokeLength'],
            stack: { ...o['stack'] },
            hasLimitFrame: o['hasLimitFrame'] || false,
        } as any;
        return this;
    }

    toObject(): PulleyCompensatorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['pulleyDiameter', this.params.pulleyDiameter],
            ['grooveWidth', this.params.grooveWidth],
            ['pulleyCount', this.params.pulleyCount],
            ['ropeDiameter', this.params.ropeDiameter],
            ['strokeLength', this.params.strokeLength],
            ['stack', { ...this.params.stack }],
            ['hasLimitFrame', this.params.hasLimitFrame],
        ])) as PulleyCompensatorObject;
    }
};

export class SleeveConnectorPrimitive extends BasePrimitive<SleeveConnectorParams, SleeveConnectorObject> {

    constructor(tp: TopoInstance, params?: SleeveConnectorObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.SleeveConnector;
    }

    setDefault(): Primitive<SleeveConnectorParams, SleeveConnectorObject> {
        this.params = {
            tubeDiameter: 60,
            sleeveLength: 120,
            wallThickness: 5,
            angle: 45,
            boltDiameter: 12,
        } as any;
        return this;
    }

    public setParams(params: SleeveConnectorParams): Primitive<SleeveConnectorParams, SleeveConnectorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.tubeDiameter > 0 && this.params.sleeveLength > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSleeveConnector(this.params), false);
        }
        throw new Error("Invalid parameters for SleeveConnector");
    }

    fromObject(o?: SleeveConnectorObject): Primitive<SleeveConnectorParams, SleeveConnectorObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            tubeDiameter: o['tubeDiameter'],
            sleeveLength: o['sleeveLength'],
            wallThickness: o['wallThickness'],
            angle: o['angle'],
            boltDiameter: o['boltDiameter'],
        } as any;
        return this;
    }

    toObject(): SleeveConnectorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['tubeDiameter', this.params.tubeDiameter],
            ['sleeveLength', this.params.sleeveLength],
            ['wallThickness', this.params.wallThickness],
            ['angle', this.params.angle],
            ['boltDiameter', this.params.boltDiameter],
        ])) as SleeveConnectorObject;
    }
};

export class SleeveEarPrimitive extends BasePrimitive<SleeveEarParams, SleeveEarObject> {

    constructor(tp: TopoInstance, params?: SleeveEarObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.SleeveEar;
    }

    setDefault(): Primitive<SleeveEarParams, SleeveEarObject> {
        this.params = {
            tubeDiameter: 60,
            sleeveLength: 100,
            wallThickness: 5,
            earHeight: 60,
            earThickness: 8,
            holeDiameter: 16,
        } as any;
        return this;
    }

    public setParams(params: SleeveEarParams): Primitive<SleeveEarParams, SleeveEarObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.tubeDiameter > 0 && this.params.sleeveLength > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSleeveEar(this.params), false);
        }
        throw new Error("Invalid parameters for SleeveEar");
    }

    fromObject(o?: SleeveEarObject): Primitive<SleeveEarParams, SleeveEarObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            tubeDiameter: o['tubeDiameter'],
            sleeveLength: o['sleeveLength'],
            wallThickness: o['wallThickness'],
            earHeight: o['earHeight'],
            earThickness: o['earThickness'],
            holeDiameter: o['holeDiameter'],
        } as any;
        return this;
    }

    toObject(): SleeveEarObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['tubeDiameter', this.params.tubeDiameter],
            ['sleeveLength', this.params.sleeveLength],
            ['wallThickness', this.params.wallThickness],
            ['earHeight', this.params.earHeight],
            ['earThickness', this.params.earThickness],
            ['holeDiameter', this.params.holeDiameter],
        ])) as SleeveEarObject;
    }
};

export class SwitchRailPrimitive extends BasePrimitive<SwitchRailParams, SwitchRailObject> {

    constructor(tp: TopoInstance, params?: SwitchRailObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.SwitchRail;
    }

    setDefault(): Primitive<SwitchRailParams, SwitchRailObject> {
        this.params = {
            length: 3000,
            railHeight: 176,
            railHeadWidth: 73,
            railBaseWidth: 150,
            webThickness: 16.5,
            tipWidth: 2,
            curveRadius: 0,
            isLeftHand: true,
        } as any;
        return this;
    }

    public setParams(params: SwitchRailParams): Primitive<SwitchRailParams, SwitchRailObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.railHeight > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSwitchRail(this.params), false);
        }
        throw new Error("Invalid parameters for SwitchRail");
    }

    fromObject(o?: SwitchRailObject): Primitive<SwitchRailParams, SwitchRailObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            length: o['length'],
            railHeight: o['railHeight'],
            railHeadWidth: o['railHeadWidth'],
            railBaseWidth: o['railBaseWidth'],
            webThickness: 16.5,
            tipWidth: o['tipWidth'],
            curveRadius: o['curveRadius'],
            isLeftHand: o['isLeftHand'] || false,
        } as any;
        return this;
    }

    toObject(): SwitchRailObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['railHeight', this.params.railHeight],
            ['railHeadWidth', this.params.railHeadWidth],
            ['railBaseWidth', this.params.railBaseWidth],
            ['tipWidth', this.params.tipWidth],
            ['curveRadius', this.params.curveRadius],
            ['isLeftHand', this.params.isLeftHand],
        ])) as SwitchRailObject;
    }
};

export class FrogPrimitive extends BasePrimitive<FrogParams, FrogObject> {

    constructor(tp: TopoInstance, params?: FrogObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Frog;
    }

    setDefault(): Primitive<FrogParams, FrogObject> {
        this.params = {
            turnoutNo: 9,
            gauge: 1435,
            railHeight: 176,
            railHeadWidth: 73,
            railBaseWidth: 150,
        } as any;
        return this;
    }

    public setParams(params: FrogParams): Primitive<FrogParams, FrogObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.turnoutNo > 0 && this.params.gauge > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createFrog(this.params), false);
        }
        throw new Error("Invalid parameters for Frog");
    }

    fromObject(o?: FrogObject): Primitive<FrogParams, FrogObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            turnoutNo: o['turnoutNo'],
            gauge: o['gauge'],
            railHeight: o['railHeight'],
            railHeadWidth: o['railHeadWidth'],
            railBaseWidth: o['railBaseWidth'],
        } as any;
        return this;
    }

    toObject(): FrogObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['turnoutNo', this.params.turnoutNo],
            ['gauge', this.params.gauge],
            ['railHeight', this.params.railHeight],
            ['railHeadWidth', this.params.railHeadWidth],
            ['railBaseWidth', this.params.railBaseWidth],
        ])) as FrogObject;
    }
};

export class TurnoutPrimitive extends BasePrimitive<TurnoutParams, TurnoutObject> {

    constructor(tp: TopoInstance, params?: TurnoutObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.Turnout;
    }

    setDefault(): Primitive<TurnoutParams, TurnoutObject> {
        this.params = {
            turnoutNo: 9,
            isLeftHand: true,
            gauge: 1435,
            railHeight: 176,
            railHeadWidth: 73,
            railBaseWidth: 150,
            webThickness: 16.5,
            switchRailLength: 3000,
            leadCurveRadius: 180000,
            frogLength: 0,
            sleeperCount: 0,
            sleeperSpacing: 1500,
        } as any;
        return this;
    }

    public setParams(params: TurnoutParams): Primitive<TurnoutParams, TurnoutObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.turnoutNo > 0 && this.params.gauge > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTurnout(this.params), false);
        }
        throw new Error("Invalid parameters for Turnout");
    }

    fromObject(o?: TurnoutObject): Primitive<TurnoutParams, TurnoutObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            turnoutNo: o['turnoutNo'],
            isLeftHand: o['isLeftHand'] || false,
            gauge: o['gauge'],
            railHeight: o['railHeight'],
            railHeadWidth: o['railHeadWidth'],
            railBaseWidth: o['railBaseWidth'],
            webThickness: 16.5,
            switchRailLength: o['switchRailLength'],
            leadCurveRadius: o['leadCurveRadius'],
            frogLength: o['frogLength'] || 0,
            sleeperCount: o['sleeperCount'] || 0,
            sleeperSpacing: o['sleeperSpacing'],
        } as any;
        return this;
    }

    toObject(): TurnoutObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['turnoutNo', this.params.turnoutNo],
            ['isLeftHand', this.params.isLeftHand],
            ['gauge', this.params.gauge],
            ['railHeight', this.params.railHeight],
            ['railHeadWidth', this.params.railHeadWidth],
            ['railBaseWidth', this.params.railBaseWidth],
            ['switchRailLength', this.params.switchRailLength],
            ['leadCurveRadius', this.params.leadCurveRadius],
            ['frogLength', this.params.frogLength],
            ['sleeperCount', this.params.sleeperCount],
            ['sleeperSpacing', this.params.sleeperSpacing],
        ])) as TurnoutObject;
    }
};

export class StraightTrackPrimitive extends BasePrimitive<StraightTrackParams, StraightTrackObject> {

    constructor(tp: TopoInstance, params?: StraightTrackObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.StraightTrack;
    }

    setDefault(): Primitive<StraightTrackParams, StraightTrackObject> {
        this.params = {
            startPoint: toPnt(this.tp, [0, 0, 0]),
            endPoint: toPnt(this.tp, [6000, 0, 0]),
            gauge: 1435,
            railHeight: 176,
            railHeadWidth: 73,
            railBaseWidth: 150,
            webThickness: 16.5,
            sleeperLength: 2500,
            sleeperWidth: 260,
            sleeperHeight: 200,
            sleeperSpacing: 1200,
            ballastTopWidth: 3600,
            ballastThickness: 300,
            ballastSlope: 1.5,
        } as any;
        return this;
    }

    public setParams(params: StraightTrackParams): Primitive<StraightTrackParams, StraightTrackObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.gauge > 0 && this.params.railHeight > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createStraightTrack(this.params), false);
        }
        throw new Error("Invalid parameters for StraightTrack");
    }

    fromObject(o?: StraightTrackObject): Primitive<StraightTrackParams, StraightTrackObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            startPoint: toPnt(this.tp, o['startPoint']),
            endPoint: toPnt(this.tp, o['endPoint']),
            gauge: o['gauge'],
            railHeight: o['railHeight'],
            railHeadWidth: o['railHeadWidth'],
            railBaseWidth: o['railBaseWidth'],
            webThickness: 16.5,
            sleeperLength: o['sleeperLength'],
            sleeperWidth: o['sleeperWidth'],
            sleeperHeight: o['sleeperHeight'],
            sleeperSpacing: o['sleeperSpacing'],
            ballastTopWidth: o['ballastTopWidth'],
            ballastThickness: o['ballastThickness'],
            ballastSlope: o['ballastSlope'],
        } as any;
        return this;
    }

    toObject(): StraightTrackObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['startPoint', fromPnt(this.params.startPoint)],
            ['endPoint', fromPnt(this.params.endPoint)],
            ['gauge', this.params.gauge],
            ['railHeight', this.params.railHeight],
            ['railHeadWidth', this.params.railHeadWidth],
            ['railBaseWidth', this.params.railBaseWidth],
            ['sleeperLength', this.params.sleeperLength],
            ['sleeperWidth', this.params.sleeperWidth],
            ['sleeperHeight', this.params.sleeperHeight],
            ['sleeperSpacing', this.params.sleeperSpacing],
            ['ballastTopWidth', this.params.ballastTopWidth],
            ['ballastThickness', this.params.ballastThickness],
            ['ballastSlope', this.params.ballastSlope],
        ])) as StraightTrackObject;
    }
};

export class CurveTrackPrimitive extends BasePrimitive<CurveTrackParams, CurveTrackObject> {

    constructor(tp: TopoInstance, params?: CurveTrackObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.CurveTrack;
    }

    setDefault(): Primitive<CurveTrackParams, CurveTrackObject> {
        this.params = {
            curveCenter: toPnt(this.tp, [0, 0, 0]),
            startAngle: 0,
            sweepAngle: 0.1,
            curveRadius: 100000,
            gauge: 1435,
            superElevation: 0,
            railHeight: 176,
            railHeadWidth: 73,
            railBaseWidth: 150,
            webThickness: 16.5,
            sleeperLength: 2500,
            sleeperWidth: 260,
            sleeperHeight: 200,
            sleeperSpacing: 1500,
            ballastTopWidth: 3600,
            ballastThickness: 300,
            ballastSlope: 1.5,
        } as any;
        return this;
    }

    public setParams(params: CurveTrackParams): Primitive<CurveTrackParams, CurveTrackObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.curveRadius > 0 && this.params.gauge > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCurveTrack(this.params), false);
        }
        throw new Error("Invalid parameters for CurveTrack");
    }

    fromObject(o?: CurveTrackObject): Primitive<CurveTrackParams, CurveTrackObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            curveCenter: toPnt(this.tp, o['curveCenter']),
            startAngle: o['startAngle'],
            sweepAngle: o['sweepAngle'],
            curveRadius: o['curveRadius'],
            gauge: o['gauge'],
            superElevation: o['superElevation'] || 0,
            railHeight: o['railHeight'],
            railHeadWidth: o['railHeadWidth'],
            railBaseWidth: o['railBaseWidth'],
            webThickness: 16.5,
            sleeperLength: o['sleeperLength'],
            sleeperWidth: o['sleeperWidth'],
            sleeperHeight: o['sleeperHeight'],
            sleeperSpacing: o['sleeperSpacing'],
            ballastTopWidth: o['ballastTopWidth'],
            ballastThickness: o['ballastThickness'],
            ballastSlope: o['ballastSlope'],
        } as any;
        return this;
    }

    toObject(): CurveTrackObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['curveCenter', fromPnt(this.params.curveCenter)],
            ['startAngle', this.params.startAngle],
            ['sweepAngle', this.params.sweepAngle],
            ['curveRadius', this.params.curveRadius],
            ['gauge', this.params.gauge],
            ['superElevation', this.params.superElevation],
            ['railHeight', this.params.railHeight],
            ['railHeadWidth', this.params.railHeadWidth],
            ['railBaseWidth', this.params.railBaseWidth],
            ['sleeperLength', this.params.sleeperLength],
            ['sleeperWidth', this.params.sleeperWidth],
            ['sleeperHeight', this.params.sleeperHeight],
            ['sleeperSpacing', this.params.sleeperSpacing],
            ['ballastTopWidth', this.params.ballastTopWidth],
            ['ballastThickness', this.params.ballastThickness],
            ['ballastSlope', this.params.ballastSlope],
        ])) as CurveTrackObject;
    }
};

export class RailPairPrimitive extends BasePrimitive<RailPairParams, RailPairObject> {

    constructor(tp: TopoInstance, params?: RailPairObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.RailPair;
    }

    setDefault(): Primitive<RailPairParams, RailPairObject> {
        this.params = {
            centerline: toPntList(this.tp, [[0, 0, 0], [6000, 0, 0]]),
            gauge: 1435,
            superElevation: 0,
            railHeight: 176,
            railHeadWidth: 73,
            railBaseWidth: 150,
        } as any;
        return this;
    }

    public setParams(params: RailPairParams): Primitive<RailPairParams, RailPairObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.gauge > 0 && this.params.centerline !== undefined && this.params.centerline.length >= 2;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRailPair(this.params), false);
        }
        throw new Error("Invalid parameters for RailPair");
    }

    fromObject(o?: RailPairObject): Primitive<RailPairParams, RailPairObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            centerline: toPntList(this.tp, o['centerline']),
            gauge: o['gauge'],
            superElevation: o['superElevation'] || 0,
            railHeight: o['railHeight'],
            railHeadWidth: o['railHeadWidth'],
            railBaseWidth: o['railBaseWidth'],
        } as any;
        return this;
    }

    toObject(): RailPairObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['centerline', fromPntList(this.params.centerline as any[])],
            ['gauge', this.params.gauge],
            ['superElevation', this.params.superElevation],
            ['railHeight', this.params.railHeight],
            ['railHeadWidth', this.params.railHeadWidth],
            ['railBaseWidth', this.params.railBaseWidth],
        ])) as RailPairObject;
    }
};

export class SleeperLayoutPrimitive extends BasePrimitive<SleeperLayoutParams, SleeperLayoutObject> {

    constructor(tp: TopoInstance, params?: SleeperLayoutObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.SleeperLayout;
    }

    setDefault(): Primitive<SleeperLayoutParams, SleeperLayoutObject> {
        this.params = {
            centerline: toPntList(this.tp, [[0, 0, 0], [6000, 0, 0]]),
            length: 2500,
            width: 260,
            height: 200,
            spacing: 800,
            gauge: 1435,
        } as any;
        return this;
    }

    public setParams(params: SleeperLayoutParams): Primitive<SleeperLayoutParams, SleeperLayoutObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 && this.params.spacing > 0
            && this.params.centerline !== undefined && this.params.centerline.length >= 2;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSleeperLayout(this.params), false);
        }
        throw new Error("Invalid parameters for SleeperLayout");
    }

    fromObject(o?: SleeperLayoutObject): Primitive<SleeperLayoutParams, SleeperLayoutObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            centerline: toPntList(this.tp, o['centerline']),
            length: o['length'],
            width: o['width'],
            height: o['height'],
            spacing: o['spacing'],
            gauge: o['gauge'],
        } as any;
        return this;
    }

    toObject(): SleeperLayoutObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['centerline', fromPntList(this.params.centerline as any[])],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['spacing', this.params.spacing],
            ['gauge', this.params.gauge],
        ])) as SleeperLayoutObject;
    }
};

export class RetarderPointPrimitive extends BasePrimitive<RetarderPointParams, RetarderPointObject> {

    constructor(tp: TopoInstance, params?: RetarderPointObject) {
        super(tp, params);
    }

    getType(): string {
        return RLPrimitiveType.RetarderPoint;
    }

    setDefault(): Primitive<RetarderPointParams, RetarderPointObject> {
        this.params = {
            position: toPnt(this.tp, [0, 0, 0]),
            rotation: 0,
            side: 1,
            type: 1,
            mountType: 1,
            height: 200,
            bodyDiameter: 70,
            capDiameter: 82,
            capHeight: 28,
            transitionHeight: 18,
            armLength: 80,
            armWidth: 28,
            armThickness: 14,
            boltDiameter: 18,
            portDiameter: 18,
        } as any;
        return this;
    }

    public setParams(params: RetarderPointParams): Primitive<RetarderPointParams, RetarderPointObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 && this.params.bodyDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRetarderPoint(this.params), false);
        }
        throw new Error("Invalid parameters for RetarderPoint");
    }

    fromObject(o?: RetarderPointObject): Primitive<RetarderPointParams, RetarderPointObject> {
        if (o === undefined) return this;
        if (o['version']) this.version = o['version'];
        this.params = {
            position: toPnt(this.tp, [0, 0, 0]),
            rotation: 0,
            side: o['side'],
            type: o['deviceType'],
            mountType: o['mountType'],
            height: o['height'],
            bodyDiameter: o['bodyDiameter'],
            capDiameter: o['capDiameter'],
            capHeight: o['capHeight'],
            transitionHeight: o['transitionHeight'],
            armLength: o['armLength'],
            armWidth: o['armWidth'],
            armThickness: o['armThickness'],
            boltDiameter: o['boltDiameter'],
            portDiameter: o['portDiameter'],
        } as any;
        return this;
    }

    toObject(): RetarderPointObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['side', this.params.side],
            ['deviceType', this.params.type],
            ['mountType', this.params.mountType],
            ['height', this.params.height],
            ['bodyDiameter', this.params.bodyDiameter],
            ['capDiameter', this.params.capDiameter],
            ['capHeight', this.params.capHeight],
            ['transitionHeight', this.params.transitionHeight],
            ['armLength', this.params.armLength],
            ['armWidth', this.params.armWidth],
            ['armThickness', this.params.armThickness],
            ['boltDiameter', this.params.boltDiameter],
            ['portDiameter', this.params.portDiameter],
        ])) as RetarderPointObject;
    }
};

// 布局闭环: 锚段 (锚段布局计算/JSON/确定性再生成) 与站场 (GeoJSON 识别/JSON/再生成)
export * from "./anchor_section";
export * from "./yard";
