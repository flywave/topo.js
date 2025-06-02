import {
    Shape,
    TopoInstance,
    BoredPileParams,
    PileCapParams,
    RockAnchorParams,
    RockPileCapParams,
    EmbeddedRockAnchorParams,
    InclinedRockAnchorParams,
    ExcavatedBaseParams,
    StepBaseParams,
    StepPlateBaseParams,
    SlopedBaseBaseParams,
    CompositeCaissonBaseParams,
    RaftBaseParams,
    DirectBuriedBaseParams,
    SteelSleeveBaseParams,
    PrecastColumnBaseParams,
    PrecastPinnedBaseParams,
    PrecastMetalSupportBaseParams,
    PrecastConcreteSupportBaseParams,
    TransmissionLineParams,
    InsulatorParams,
    PoleTowerParams,
    SingleHookAnchorParams,
    TripleHookAnchorParams,
    RibbedAnchorParams,
    NutAnchorParams,
    TripleArmAnchorParams,
    PositioningPlateAnchorParams,
    StubAngleParams,
    StubTubeParams,
    ArrangementType,
    InsulatorMaterial,
    ApplicationType,
    StringType,
    PoleTowerMember,
    PoleTowerNode,
    WasherShapeType
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../../primitive";
import {
    BoredPileBaseObject,
    CompositeCaissonBaseObject,
    DirectBuriedBaseObject,
    EmbeddedRockAnchorBaseObject,
    ExcavatedBaseObject,
    InclinedRockAnchorBaseObject,
    InsulatorObject,
    NutAnchorObject,
    PileCapBaseObject,
    PoleTowerObject,
    PositioningPlateAnchorObject,
    PrecastColumnBaseObject,
    PrecastConcreteSupportBaseObject,
    PrecastMetalSupportBaseObject,
    PrecastPinnedBaseObject,
    RaftBaseObject,
    RibbedAnchorObject,
    RockAnchorBaseObject,
    RockPileCapBaseObject,
    SingleHookAnchorObject,
    SlopedBaseBaseObject,
    SteelSleeveBaseObject,
    StepBaseObject,
    StepPlateBaseObject,
    StubAngleObject,
    StubTubeObject,
    TransmissionLineObject,
    TripleArmAnchorObject,
    TripleHookAnchorObject,
} from "../../types/gim-gt";

export enum GTPrimitiveType {
    BoredPileBase = "GIM/GT/BoredPileBase",
    PileCapBase = "GIM/GT/PileCapBase",
    RockAnchorBase = "GIM/GT/RockAnchorBase",
    RockPileCapBase = "GIM/GT/RockPileCapBase",
    EmbeddedRockAnchorBase = "GIM/GT/EmbeddedRockAnchorBase",
    InclinedRockAnchorBase = "GIM/GT/InclinedRockAnchorBase",
    ExcavatedBase = "GIM/GT/ExcavatedBase",
    StepBase = "GIM/GT/StepBase",
    StepPlateBase = "GIM/GT/StepPlateBase",
    SlopedBaseBase = "GIM/GT/SlopedBaseBase",
    CompositeCaissonBase = "GIM/GT/CompositeCaissonBase",
    RaftBase = "GIM/GT/RaftBase",
    DirectBuriedBase = "GIM/GT/DirectBuriedBase",
    SteelSleeveBase = "GIM/GT/SteelSleeveBase",
    PrecastColumnBase = "GIM/GT/PrecastColumnBase",
    PrecastPinnedBase = "GIM/GT/PrecastPinnedBase",
    PrecastMetalSupportBase = "GIM/GT/PrecastMetalSupportBase",
    PrecastConcreteSupportBase = "GIM/GT/PrecastConcreteSupportBase",
    TransmissionLine = "GIM/GT/TransmissionLine",
    Insulator = "GIM/GT/Insulator",
    PoleTower = "GIM/GT/PoleTower",
    SingleHookAnchor = "GIM/GT/SingleHookAnchor",
    TripleHookAnchor = "GIM/GT/TripleHookAnchor",
    RibbedAnchor = "GIM/GT/RibbedAnchor",
    NutAnchor = "GIM/GT/NutAnchor",
    TripleArmAnchor = "GIM/GT/TripleArmAnchor",
    PositioningPlateAnchor = "GIM/GT/PositioningPlateAnchor",
    StubAngle = "GIM/GT/StubAngle",
    StubTube = "GIM/GT/StubTube"
}

export type GTPrimitive =
    BoredPileBasePrimitive
    | PileCapBasePrimitive
    | RockAnchorBasePrimitive
    | RockPileCapBasePrimitive
    | EmbeddedRockAnchorBasePrimitive
    | InclinedRockAnchorBasePrimitive
    | ExcavatedBasePrimitive
    | StepBasePrimitive
    | StepPlateBasePrimitive
    | SlopedBaseBasePrimitive
    | CompositeCaissonBasePrimitive
    | RaftBasePrimitive
    | DirectBuriedBasePrimitive
    | SteelSleeveBasePrimitive
    | PrecastColumnBasePrimitive
    | PrecastPinnedBasePrimitive
    | PrecastMetalSupportBasePrimitive
    | PrecastConcreteSupportBasePrimitive
    | TransmissionLinePrimitive
    | InsulatorPrimitive
    | PoleTowerPrimitive
    | SingleHookAnchorPrimitive
    | TripleHookAnchorPrimitive
    | RibbedAnchorPrimitive
    | NutAnchorPrimitive
    | TripleArmAnchorPrimitive
    | PositioningPlateAnchorPrimitive
    | StubAnglePrimitive
    | StubTubePrimitive;

export class BoredPileBasePrimitive extends BasePrimitive<BoredPileParams, BoredPileBaseObject> {

    constructor(tp: TopoInstance, params?: BoredPileBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.BoredPileBase;
    }

    setDefault(): Primitive<BoredPileParams, BoredPileBaseObject> {
        this.params = {
            H1: 40.0,  // 上部圆柱高度
            H2: 12.0,   // 过渡段高度
            H3: 20.0,  // 底部圆柱高度
            H4: 1.2,   // 桩头高度
            d: 2.0,    // 上部直径
            D: 8.0     // 底部直径
        };
        return this;
    }

    public setParams(params: BoredPileParams): Primitive<BoredPileParams, BoredPileBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 ||
            this.params.H3 <= 0 || this.params.H4 <= 0) return false;
        if (this.params.d <= 0 || this.params.D <= 0) return false;
        if (this.params.D < this.params.d) return false;
        return (this.params.H1 + this.params.H2) > this.params.H3;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createBoredPileBase(this.params), false);
        }
        throw new Error("Invalid parameters for BoredPile");
    }

    fromObject(o?: BoredPileBaseObject): Primitive<BoredPileParams, BoredPileBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            H4: o['H4'],
            d: o['d'],
            D: o['D']
        };
        return this;
    }

    toObject(): BoredPileBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['H4', this.params.H4],
            ['d', this.params.d],
            ['D', this.params.D]
        ])) as BoredPileBaseObject;
    }
}

export class PileCapBasePrimitive extends BasePrimitive<PileCapParams, PileCapBaseObject> {

    constructor(tp: TopoInstance, params?: PileCapBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PileCapBase;
    }

    setDefault(): Primitive<PileCapParams, PileCapBaseObject> {
        this.params = {
            H1: 20.0,
            H2: 6.0,
            H3: 10.0,
            H4: 8.0,
            H5: 4.0,
            H6: 0.6,
            d: 1.0,
            D: 4.0,
            b: 3.0,
            B1: 40.0,
            L1: 60.0,
            e1: 2.0,
            e2: 1.0,
            cs: 0,
            ZCOUNT: 3,
            ZPOSTARRAY: [
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Pnt_3(20, 0, 0),
                new this.tp.gp_Pnt_3(0, 20, 0)
            ]
        };
        return this;
    }

    public setParams(params: PileCapParams): Primitive<PileCapParams, PileCapBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 || this.params.H3 <= 0 ||
            this.params.H4 <= 0 || this.params.H5 <= 0 || this.params.H6 <= 0) return false;
        if (this.params.d <= 0 || this.params.D <= 0 || this.params.b <= 0 ||
            this.params.B1 <= 0 || this.params.L1 <= 0) return false;
        if (this.params.D < this.params.d) return false;
        return this.params.ZCOUNT > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPileCapBase(this.params), false);
        }
        throw new Error("Invalid parameters for PileCap");
    }

    fromObject(o?: PileCapBaseObject): Primitive<PileCapParams, PileCapBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            H4: o['H4'],
            H5: o['H5'],
            H6: o['H6'],
            d: o['d'],
            D: o['D'],
            b: o['b'],
            B1: o['B1'],
            L1: o['L1'],
            e1: o['e1'],
            e2: o['e2'],
            cs: o['cs'],
            ZCOUNT: o['ZCOUNT'],
            ZPOSTARRAY: o['ZPOSTARRAY'].map((p) =>
                new this.tp.gp_Pnt_3(p[0], p[1], p[2]))
        };
        return this;
    }

    toObject(): PileCapBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['H4', this.params.H4],
            ['H5', this.params.H5],
            ['H6', this.params.H6],
            ['d', this.params.d],
            ['D', this.params.D],
            ['b', this.params.b],
            ['B1', this.params.B1],
            ['L1', this.params.L1],
            ['e1', this.params.e1],
            ['e2', this.params.e2],
            ['cs', this.params.cs],
            ['ZCOUNT', this.params.ZCOUNT],
            ['ZPOSTARRAY', this.params.ZPOSTARRAY.map(p =>
                ([p.X(), p.Y(), p.Z()]))]
        ])) as PileCapBaseObject;
    }
}

export class RockAnchorBasePrimitive extends BasePrimitive<RockAnchorParams, RockAnchorBaseObject> {

    constructor(tp: TopoInstance, params?: RockAnchorBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.RockAnchorBase;
    }

    setDefault(): Primitive<RockAnchorParams, RockAnchorBaseObject> {
        this.params = {
            H1: 8.0,
            H2: 20.0,
            d: 2.0,
            B1: 40.0,
            L1: 60.0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                new this.tp.gp_Pnt_3(-16, -24, 0),
                new this.tp.gp_Pnt_3(16, -24, 0),
                new this.tp.gp_Pnt_3(16, 24, 0),
                new this.tp.gp_Pnt_3(-16, 24, 0)
            ]
        };
        return this;
    }

    public setParams(params: RockAnchorParams): Primitive<RockAnchorParams, RockAnchorBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0) return false;
        if (this.params.d <= 0 || this.params.B1 <= 0 || this.params.L1 <= 0) return false;
        return this.params.ZCOUNT > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRockAnchorBase(this.params), false);
        }
        throw new Error("Invalid parameters for RockAnchor");
    }

    fromObject(o?: RockAnchorBaseObject): Primitive<RockAnchorParams, RockAnchorBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            d: o['d'],
            B1: o['B1'],
            L1: o['L1'],
            ZCOUNT: o['ZCOUNT'],
            ZPOSTARRAY: o['ZPOSTARRAY'].map((p) =>
                new this.tp.gp_Pnt_3(p[0], p[1], p[2]))
        };
        return this;
    }

    toObject(): RockAnchorBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['d', this.params.d],
            ['B1', this.params.B1],
            ['L1', this.params.L1],
            ['ZCOUNT', this.params.ZCOUNT],
            ['ZPOSTARRAY', this.params.ZPOSTARRAY.map(p =>
                ([p.X(), p.Y(), p.Z()]))]
        ])) as RockAnchorBaseObject;
    }
}

export class RockPileCapBasePrimitive extends BasePrimitive<RockPileCapParams, RockPileCapBaseObject> {

    constructor(tp: TopoInstance, params?: RockPileCapBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.RockPileCapBase;
    }

    setDefault(): Primitive<RockPileCapParams, RockPileCapBaseObject> {
        this.params = {
            H1: 16.0,
            H2: 8.0,
            H3: 40.0,
            d: 2,
            b: 6,
            B1: 80.0,
            L1: 120.0,
            e1: 4.0,
            e2: 2,
            cs: 0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                new this.tp.gp_Pnt_3(-20, -20, 0),
                new this.tp.gp_Pnt_3(20, -20, 0),
                new this.tp.gp_Pnt_3(20, 20, 0),
                new this.tp.gp_Pnt_3(-20, 20, 0)
            ]
        };
        return this;
    }

    public setParams(params: RockPileCapParams): Primitive<RockPileCapParams, RockPileCapBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.d <= 0 || this.params.b <= 0 ||
            this.params.B1 <= 0 || this.params.L1 <= 0) return false;
        return this.params.ZCOUNT > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRockPileCapBase(this.params), false);
        }
        throw new Error("Invalid parameters for RockPileCap");
    }

    fromObject(o?: RockPileCapBaseObject): Primitive<RockPileCapParams, RockPileCapBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            d: o['d'],
            b: o['b'],
            B1: o['B1'],
            L1: o['L1'],
            e1: o['e1'],
            e2: o['e2'],
            cs: o['cs'],
            ZCOUNT: o['ZCOUNT'],
            ZPOSTARRAY: o['ZPOSTARRAY'].map((p: any) =>
                new this.tp.gp_Pnt_3(p[0], p[1], p[2]))
        };
        return this;
    }

    toObject(): RockPileCapBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['d', this.params.d],
            ['b', this.params.b],
            ['B1', this.params.B1],
            ['L1', this.params.L1],
            ['e1', this.params.e1],
            ['e2', this.params.e2],
            ['cs', this.params.cs],
            ['ZCOUNT', this.params.ZCOUNT],
            ['ZPOSTARRAY', this.params.ZPOSTARRAY.map(p =>
                ([p.X(), p.Y(), p.Z()]))]
        ])) as RockPileCapBaseObject;
    }
}


export class EmbeddedRockAnchorBasePrimitive extends BasePrimitive<EmbeddedRockAnchorParams, EmbeddedRockAnchorBaseObject> {

    constructor(tp: TopoInstance, params?: EmbeddedRockAnchorBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.EmbeddedRockAnchorBase;
    }

    setDefault(): Primitive<EmbeddedRockAnchorParams, EmbeddedRockAnchorBaseObject> {
        this.params = {
            H1: 50.0,
            H2: 15.0,
            H3: 25.0,
            d: 2.5,
            D: 10.0
        };
        return this;
    }

    public setParams(params: EmbeddedRockAnchorParams): Primitive<EmbeddedRockAnchorParams, EmbeddedRockAnchorBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.d <= 0 || this.params.D <= 0) return false;
        return this.params.D >= this.params.d;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createEmbeddedRockAnchorBase(this.params), false);
        }
        throw new Error("Invalid parameters for EmbeddedRockAnchor");
    }

    fromObject(o?: EmbeddedRockAnchorBaseObject): Primitive<EmbeddedRockAnchorParams, EmbeddedRockAnchorBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            d: o['d'],
            D: o['D']
        };
        return this;
    }

    toObject(): EmbeddedRockAnchorBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['d', this.params.d],
            ['D', this.params.D]
        ])) as EmbeddedRockAnchorBaseObject;
    }
}


export class InclinedRockAnchorBasePrimitive extends BasePrimitive<InclinedRockAnchorParams, InclinedRockAnchorBaseObject> {

    constructor(tp: TopoInstance, params?: InclinedRockAnchorBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.InclinedRockAnchorBase;
    }

    setDefault(): Primitive<InclinedRockAnchorParams, InclinedRockAnchorBaseObject> {
        this.params = {
            H1: 20.0,
            H2: 50.0,
            d: 5.0,
            D: 15,
            B: 100.0,
            L: 150.0,
            e1: 10.0,
            e2: 5,
            alpha1: 15,
            alpha2: 10
        };
        return this;
    }

    public setParams(params: InclinedRockAnchorParams): Primitive<InclinedRockAnchorParams, InclinedRockAnchorBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0) return false;
        if (this.params.d <= 0 || this.params.D <= 0 ||
            this.params.B <= 0 || this.params.L <= 0) return false;
        return this.params.D >= this.params.d;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createInclinedRockAnchorBase(this.params), false);
        }
        throw new Error("Invalid parameters for InclinedRockAnchor");
    }

    fromObject(o?: InclinedRockAnchorBaseObject): Primitive<InclinedRockAnchorParams, InclinedRockAnchorBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            d: o['d'],
            D: o['D'],
            B: o['B'],
            L: o['L'],
            e1: o['e1'],
            e2: o['e2'],
            alpha1: o['alpha1'],
            alpha2: o['alpha2']
        };
        return this;
    }

    toObject(): InclinedRockAnchorBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['d', this.params.d],
            ['D', this.params.D],
            ['B', this.params.B],
            ['L', this.params.L],
            ['e1', this.params.e1],
            ['e2', this.params.e2],
            ['alpha1', this.params.alpha1],
            ['alpha2', this.params.alpha2]
        ])) as InclinedRockAnchorBaseObject;
    }
}


export class ExcavatedBasePrimitive extends BasePrimitive<ExcavatedBaseParams, ExcavatedBaseObject> {

    constructor(tp: TopoInstance, params?: ExcavatedBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.ExcavatedBase;
    }

    setDefault(): Primitive<ExcavatedBaseParams, ExcavatedBaseObject> {
        this.params = {
            H1: 50.0,
            H2: 15.0,
            H3: 25.0,
            d: 2.5,
            D: 10.0,
            alpha1: 0.0,
            alpha2: 0.0
        };
        return this;
    }

    public setParams(params: ExcavatedBaseParams): Primitive<ExcavatedBaseParams, ExcavatedBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.d <= 0 || this.params.D <= 0) return false;
        return this.params.D >= this.params.d;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createExcavatedBase(this.params), false);
        }
        throw new Error("Invalid parameters for ExcavatedBase");
    }

    fromObject(o?: ExcavatedBaseObject): Primitive<ExcavatedBaseParams, ExcavatedBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            d: o['d'],
            D: o['D'],
            alpha1: o['alpha1'],
            alpha2: o['alpha2']
        };
        return this;
    }

    toObject(): ExcavatedBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['d', this.params.d],
            ['D', this.params.D],
            ['alpha1', this.params.alpha1],
            ['alpha2', this.params.alpha2]
        ])) as ExcavatedBaseObject;
    }
}

export class StepBasePrimitive extends BasePrimitive<StepBaseParams, StepBaseObject> {

    constructor(tp: TopoInstance, params?: StepBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.StepBase;
    }

    setDefault(): Primitive<StepBaseParams, StepBaseObject> {
        this.params = {
            H: 150.0,
            H1: 50.0,
            H2: 50.0,
            H3: 50.0,
            b: 30.0,
            B1: 100.0,
            B2: 150.0,
            B3: 200.0,
            L1: 100.0,
            L2: 150.0,
            L3: 200.0,
            N: 3
        };
        return this;
    }

    public setParams(params: StepBaseParams): Primitive<StepBaseParams, StepBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H <= 0 || this.params.H1 <= 0 ||
            this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.b <= 0 || this.params.B1 <= 0 ||
            this.params.B2 <= 0 || this.params.B3 <= 0 ||
            this.params.L1 <= 0 || this.params.L2 <= 0 ||
            this.params.L3 <= 0) return false;
        return this.params.N > 0 && this.params.N <= 3;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createStepBase(this.params), false);
        }
        throw new Error("Invalid parameters for StepBase");
    }

    fromObject(o?: StepBaseObject): Primitive<StepBaseParams, StepBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H: o['H'],
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            b: o['b'],
            B1: o['B1'],
            B2: o['B2'],
            B3: o['B3'],
            L1: o['L1'],
            L2: o['L2'],
            L3: o['L3'],
            N: o['N']
        };
        return this;
    }

    toObject(): StepBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H', this.params.H],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['b', this.params.b],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['B3', this.params.B3],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['L3', this.params.L3],
            ['N', this.params.N]
        ])) as StepBaseObject;
    }
}


// 添加台阶板基础Primitive类
export class StepPlateBasePrimitive extends BasePrimitive<StepPlateBaseParams, StepPlateBaseObject> {

    constructor(tp: TopoInstance, params?: StepPlateBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.StepPlateBase;
    }

    setDefault(): Primitive<StepPlateBaseParams, StepPlateBaseObject> {
        this.params = {
            H: 150.0,
            H1: 50.0,
            H2: 50.0,
            H3: 50.0,
            b: 30.0,
            L1: 100.0,
            L2: 150.0,
            B1: 200.0,
            B2: 300.0,
            alpha1: 15,
            alpha2: 10,
            N: 3
        };
        return this;
    }

    public setParams(params: StepPlateBaseParams): Primitive<StepPlateBaseParams, StepPlateBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H <= 0 || this.params.H1 <= 0 ||
            this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.b <= 0 || this.params.L1 <= 0 ||
            this.params.L2 <= 0 || this.params.B1 <= 0 ||
            this.params.B2 <= 0) return false;
        return this.params.N >= 1 && this.params.N <= 3;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createStepPlateBase(this.params), false);
        }
        throw new Error("Invalid parameters for StepPlateBase");
    }

    fromObject(o?: StepPlateBaseObject): Primitive<StepPlateBaseParams, StepPlateBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H: o['H'],
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            b: o['b'],
            L1: o['L1'],
            L2: o['L2'],
            B1: o['B1'],
            B2: o['B2'],
            alpha1: o['alpha1'],
            alpha2: o['alpha2'],
            N: o['N']
        };
        return this;
    }

    toObject(): StepPlateBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H', this.params.H],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['b', this.params.b],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['alpha1', this.params.alpha1],
            ['alpha2', this.params.alpha2],
            ['N', this.params.N]
        ])) as StepPlateBaseObject;
    }
}

export class SlopedBaseBasePrimitive extends BasePrimitive<SlopedBaseBaseParams, SlopedBaseBaseObject> {

    constructor(tp: TopoInstance, params?: SlopedBaseBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.SlopedBaseBase;
    }

    setDefault(): Primitive<SlopedBaseBaseParams, SlopedBaseBaseObject> {
        this.params = {
            H1: 100.0,
            H2: 30.0,
            H3: 50.0,
            b: 15,
            L1: 200.0,
            L2: 150.0,
            B1: 100.0,
            B2: 80.0,
            alpha1: 15,
            alpha2: 10
        };
        return this;
    }

    public setParams(params: SlopedBaseBaseParams): Primitive<SlopedBaseBaseParams, SlopedBaseBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.b <= 0 || this.params.L1 <= 0 ||
            this.params.L2 <= 0 || this.params.B1 <= 0 ||
            this.params.B2 <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSlopedBaseBase(this.params), false);
        }
        throw new Error("Invalid parameters for SlopedBaseBase");
    }

    fromObject(o?: SlopedBaseBaseObject): Primitive<SlopedBaseBaseParams, SlopedBaseBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            b: o['b'],
            L1: o['L1'],
            L2: o['L2'],
            B1: o['B1'],
            B2: o['B2'],
            alpha1: o['alpha1'],
            alpha2: o['alpha2']
        };
        return this;
    }

    toObject(): SlopedBaseBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['b', this.params.b],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['alpha1', this.params.alpha1],
            ['alpha2', this.params.alpha2]
        ])) as SlopedBaseBaseObject;
    }
}


export class CompositeCaissonBasePrimitive extends BasePrimitive<CompositeCaissonBaseParams, CompositeCaissonBaseObject> {

    constructor(tp: TopoInstance, params?: CompositeCaissonBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.CompositeCaissonBase;
    }

    setDefault(): Primitive<CompositeCaissonBaseParams, CompositeCaissonBaseObject> {
        this.params = {
            H1: 100.0,
            H2: 30.0,
            H3: 50.0,
            H4: 200.0,
            b: 15,
            D: 200.0,
            t: 15,
            B1: 200.0,
            B2: 250.0,
            L1: 300.0,
            L2: 350.0
        };
        return this;
    }

    public setParams(params: CompositeCaissonBaseParams): Primitive<CompositeCaissonBaseParams, CompositeCaissonBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 ||
            this.params.H3 <= 0 || this.params.H4 <= 0) return false;
        if (this.params.b <= 0 || this.params.D <= 0 ||
            this.params.t <= 0 || this.params.B1 <= 0 ||
            this.params.B2 <= 0 || this.params.L1 <= 0 ||
            this.params.L2 <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCompositeCaissonBase(this.params), false);
        }
        throw new Error("Invalid parameters for CompositeCaissonBase");
    }

    fromObject(o?: CompositeCaissonBaseObject): Primitive<CompositeCaissonBaseParams, CompositeCaissonBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            H4: o['H4'],
            b: o['b'],
            D: o['D'],
            t: o['t'],
            B1: o['B1'],
            B2: o['B2'],
            L1: o['L1'],
            L2: o['L2']
        };
        return this;
    }

    toObject(): CompositeCaissonBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['H4', this.params.H4],
            ['b', this.params.b],
            ['D', this.params.D],
            ['t', this.params.t],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['L1', this.params.L1],
            ['L2', this.params.L2]
        ])) as CompositeCaissonBaseObject;
    }
}

export class RaftBasePrimitive extends BasePrimitive<RaftBaseParams, RaftBaseObject> {

    constructor(tp: TopoInstance, params?: RaftBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.RaftBase;
    }

    setDefault(): Primitive<RaftBaseParams, RaftBaseObject> {
        this.params = {
            H1: 100.0,
            H2: 100.0,
            H3: 50.0,
            b1: 30.0,
            b2: 30.0,
            B1: 500.0,
            B2: 400.0,
            L1: 800.0,
            L2: 600.0
        };
        return this;
    }

    public setParams(params: RaftBaseParams): Primitive<RaftBaseParams, RaftBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0) return false;
        if (this.params.b1 <= 0 || this.params.b2 <= 0 ||
            this.params.B1 <= 0 || this.params.B2 <= 0 ||
            this.params.L1 <= 0 || this.params.L2 <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRaftBase(this.params), false);
        }
        throw new Error("Invalid parameters for RaftBase");
    }

    fromObject(o?: RaftBaseObject): Primitive<RaftBaseParams, RaftBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            b1: o['b1'],
            b2: o['b2'],
            B1: o['B1'],
            B2: o['B2'],
            L1: o['L1'],
            L2: o['L2']
        };
        return this;
    }

    toObject(): RaftBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['b1', this.params.b1],
            ['b2', this.params.b2],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['L1', this.params.L1],
            ['L2', this.params.L2]
        ])) as RaftBaseObject;
    }
}


export class DirectBuriedBasePrimitive extends BasePrimitive<DirectBuriedBaseParams, DirectBuriedBaseObject> {

    constructor(tp: TopoInstance, params?: DirectBuriedBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.DirectBuriedBase;
    }

    setDefault(): Primitive<DirectBuriedBaseParams, DirectBuriedBaseObject> {
        this.params = {
            H1: 100.0,
            H2: 20.0,
            d: 60.0,
            D: 120.0,
            B: 0,
            t: 4.0
        };
        return this;
    }

    public setParams(params: DirectBuriedBaseParams): Primitive<DirectBuriedBaseParams, DirectBuriedBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.t <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createDirectBuriedBase(this.params), false);
        }
        throw new Error("Invalid parameters for DirectBuriedBase");
    }

    fromObject(o?: DirectBuriedBaseObject): Primitive<DirectBuriedBaseParams, DirectBuriedBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            d: o['d'],
            D: o['D'],
            B: o['B'],
            t: o['t']
        };
        return this;
    }

    toObject(): DirectBuriedBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['d', this.params.d],
            ['D', this.params.D],
            ['B', this.params.B],
            ['t', this.params.t]
        ])) as DirectBuriedBaseObject;
    }
}

export class SteelSleeveBasePrimitive extends BasePrimitive<SteelSleeveBaseParams, SteelSleeveBaseObject> {

    constructor(tp: TopoInstance, params?: SteelSleeveBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.SteelSleeveBase;
    }

    setDefault(): Primitive<SteelSleeveBaseParams, SteelSleeveBaseObject> {
        this.params = {
            H1: 100.0,
            H2: 20.0,
            H3: 30.0,
            H4: 10.0,
            d: 60.0,
            D1: 120.0,
            D2: 80.0,
            t: 4.0,
            B1: 0,
            B2: 0
        };
        return this;
    }

    public setParams(params: SteelSleeveBaseParams): Primitive<SteelSleeveBaseParams, SteelSleeveBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 < 0 ||
            this.params.H3 < 0 || this.params.H4 < 0) return false;
        if (this.params.d <= 0 || this.params.t <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSteelSleeveBase(this.params), false);
        }
        throw new Error("Invalid parameters for SteelSleeveBase");
    }

    fromObject(o?: SteelSleeveBaseObject): Primitive<SteelSleeveBaseParams, SteelSleeveBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            H4: o['H4'],
            d: o['d'],
            D1: o['D1'],
            D2: o['D2'],
            t: o['t'],
            B1: o['B1'],
            B2: o['B2']
        };
        return this;
    }

    toObject(): SteelSleeveBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['H4', this.params.H4],
            ['d', this.params.d],
            ['D1', this.params.D1],
            ['D2', this.params.D2],
            ['t', this.params.t],
            ['B1', this.params.B1],
            ['B2', this.params.B2]
        ])) as SteelSleeveBaseObject;
    }
}

export class PrecastColumnBasePrimitive extends BasePrimitive<PrecastColumnBaseParams, PrecastColumnBaseObject> {

    constructor(tp: TopoInstance, params?: PrecastColumnBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PrecastColumnBase;
    }

    setDefault(): Primitive<PrecastColumnBaseParams, PrecastColumnBaseObject> {
        this.params = {
            H1: 50.0,
            H2: 20.0,
            H3: 30.0,
            d: 10.0,
            B1: 20.0,
            B2: 40.0,
            L1: 30.0,
            L2: 60.0
        };
        return this;
    }

    public setParams(params: PrecastColumnBaseParams): Primitive<PrecastColumnBaseParams, PrecastColumnBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.d <= 0 || this.params.B1 <= 0 ||
            this.params.B2 <= 0 || this.params.L1 <= 0 ||
            this.params.L2 <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPrecastColumnBase(this.params), false);
        }
        throw new Error("Invalid parameters for PrecastColumnBase");
    }

    fromObject(o?: PrecastColumnBaseObject): Primitive<PrecastColumnBaseParams, PrecastColumnBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            d: o['d'],
            B1: o['B1'],
            B2: o['B2'],
            L1: o['L1'],
            L2: o['L2']
        };
        return this;
    }

    toObject(): PrecastColumnBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['d', this.params.d],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['L1', this.params.L1],
            ['L2', this.params.L2]
        ])) as PrecastColumnBaseObject;
    }
}


// 添加预制柱铰接基础Primitive类
export class PrecastPinnedBasePrimitive extends BasePrimitive<PrecastPinnedBaseParams, PrecastPinnedBaseObject> {

    constructor(tp: TopoInstance, params?: PrecastPinnedBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PrecastPinnedBase;
    }

    setDefault(): Primitive<PrecastPinnedBaseParams, PrecastPinnedBaseObject> {
        this.params = {
            H1: 50.0,
            H2: 20.0,
            H3: 20.0,
            d: 10.0,
            B1: 20.0,
            B2: 40.0,
            L1: 30.0,
            L2: 60.0,
            B: 4.0,
            H: 4.0,
            L: 20.0
        };
        return this;
    }

    public setParams(params: PrecastPinnedBaseParams): Primitive<PrecastPinnedBaseParams, PrecastPinnedBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 || this.params.H3 <= 0) return false;
        if (this.params.d <= 0 || this.params.B1 <= 0 ||
            this.params.B2 <= 0 || this.params.L1 <= 0 ||
            this.params.L2 <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPrecastPinnedBase(this.params), false);
        }
        throw new Error("Invalid parameters for PrecastPinnedBase");
    }

    fromObject(o?: PrecastPinnedBaseObject): Primitive<PrecastPinnedBaseParams, PrecastPinnedBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            d: o['d'],
            B1: o['B1'],
            B2: o['B2'],
            L1: o['L1'],
            L2: o['L2'],
            B: o['B'],
            H: o['H'],
            L: o['L']
        };
        return this;
    }

    toObject(): PrecastPinnedBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['d', this.params.d],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['B', this.params.B],
            ['H', this.params.H],
            ['L', this.params.L]
        ])) as PrecastPinnedBaseObject;
    }
}

export class PrecastMetalSupportBasePrimitive extends BasePrimitive<PrecastMetalSupportBaseParams, PrecastMetalSupportBaseObject> {

    constructor(tp: TopoInstance, params?: PrecastMetalSupportBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PrecastMetalSupportBase;
    }

    setDefault(): Primitive<PrecastMetalSupportBaseParams, PrecastMetalSupportBaseObject> {
        this.params = {
            H1: 4.0,
            H2: 40.0,
            H3: 2.0,
            H4: 2.0,
            b1: 3.0,
            b2: 3.0,
            B1: 80.0,
            B2: 60.0,
            L1: 100.0,
            L2: 80.0,
            S1: 4.0,
            S2: 2.0,
            n1: 3,
            n2: 9,
            HX: [10.0, 10.0, 10.0]
        };
        return this;
    }

    public setParams(params: PrecastMetalSupportBaseParams): Primitive<PrecastMetalSupportBaseParams, PrecastMetalSupportBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 ||
            this.params.H3 <= 0 || this.params.H4 <= 0) return false;
        if (this.params.b1 <= 0 || this.params.b2 <= 0 ||
            this.params.B1 <= 0 || this.params.B2 <= 0 ||
            this.params.L1 <= 0 || this.params.L2 <= 0 ||
            this.params.S1 <= 0 || this.params.S2 <= 0) return false;
        if (this.params.n1 <= 0 || this.params.n2 <= 0) return false;
        if (!this.params.HX || this.params.HX.length === 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPrecastMetalSupportBase(this.params), false);
        }
        throw new Error("Invalid parameters for PrecastMetalSupportBase");
    }

    fromObject(o?: PrecastMetalSupportBaseObject): Primitive<PrecastMetalSupportBaseParams, PrecastMetalSupportBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            H4: o['H4'],
            b1: o['b1'],
            b2: o['b2'],
            B1: o['B1'],
            B2: o['B2'],
            L1: o['L1'],
            L2: o['L2'],
            S1: o['S1'],
            S2: o['S2'],
            n1: o['n1'],
            n2: o['n2'],
            HX: o['HX'] || []
        };
        return this;
    }

    toObject(): PrecastMetalSupportBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['H4', this.params.H4],
            ['b1', this.params.b1],
            ['b2', this.params.b2],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['S1', this.params.S1],
            ['S2', this.params.S2],
            ['n1', this.params.n1],
            ['n2', this.params.n2],
            ['HX', this.params.HX]
        ])) as PrecastMetalSupportBaseObject;
    }
}


// 添加预制混凝土支撑基础Primitive类
export class PrecastConcreteSupportBasePrimitive extends BasePrimitive<PrecastConcreteSupportBaseParams, PrecastConcreteSupportBaseObject> {

    constructor(tp: TopoInstance, params?: PrecastConcreteSupportBaseObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PrecastConcreteSupportBase;
    }

    setDefault(): Primitive<PrecastConcreteSupportBaseParams, PrecastConcreteSupportBaseObject> {
        this.params = {
            H1: 4.0,
            H2: 40.0,
            H3: 2.0,
            H4: 2.0,
            H5: 2.0,
            b1: 3.0,
            b2: 4.0,
            b3: 2.0,
            B1: 80.0,
            B2: 60.0,
            L1: 100.0,
            L2: 80.0,
            S1: 4.0,
            n1: 9
        };
        return this;
    }

    public setParams(params: PrecastConcreteSupportBaseParams): Primitive<PrecastConcreteSupportBaseParams, PrecastConcreteSupportBaseObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.H1 <= 0 || this.params.H2 <= 0 ||
            this.params.H3 <= 0 || this.params.H4 <= 0 ||
            this.params.H5 <= 0) return false;
        if (this.params.b1 <= 0 || this.params.b2 <= 0 ||
            this.params.b3 <= 0 || this.params.B1 <= 0 ||
            this.params.B2 <= 0 || this.params.L1 <= 0 ||
            this.params.L2 <= 0 || this.params.S1 <= 0) return false;
        if (this.params.n1 <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPrecastConcreteSupportBase(this.params), false);
        }
        throw new Error("Invalid parameters for PrecastConcreteSupportBase");
    }

    fromObject(o?: PrecastConcreteSupportBaseObject): Primitive<PrecastConcreteSupportBaseParams, PrecastConcreteSupportBaseObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            H1: o['H1'],
            H2: o['H2'],
            H3: o['H3'],
            H4: o['H4'],
            H5: o['H5'],
            b1: o['b1'],
            b2: o['b2'],
            b3: o['b3'],
            B1: o['B1'],
            B2: o['B2'],
            L1: o['L1'],
            L2: o['L2'],
            S1: o['S1'],
            n1: o['n1']
        };
        return this;
    }

    toObject(): PrecastConcreteSupportBaseObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['H1', this.params.H1],
            ['H2', this.params.H2],
            ['H3', this.params.H3],
            ['H4', this.params.H4],
            ['H5', this.params.H5],
            ['b1', this.params.b1],
            ['b2', this.params.b2],
            ['b3', this.params.b3],
            ['B1', this.params.B1],
            ['B2', this.params.B2],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['S1', this.params.S1],
            ['n1', this.params.n1]
        ])) as PrecastConcreteSupportBaseObject;
    }
}


// 添加输电线路Primitive类
export class TransmissionLinePrimitive extends BasePrimitive<TransmissionLineParams, TransmissionLineObject> {

    constructor(tp: TopoInstance, params?: TransmissionLineObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.TransmissionLine;
    }

    setDefault(): Primitive<TransmissionLineParams, TransmissionLineObject> {
        this.params = {
            type: "LGJ-400/35",
            sectionalArea: 425.24,
            outsideDiameter: 26.82,
            wireWeight: 1349,
            coefficientOfElasticity: 65000,
            expansionCoefficient: 0.0000205,
            ratedStrength: 103900,
        };
        return this;
    }

    public setParams(params: TransmissionLineParams): Primitive<TransmissionLineParams, TransmissionLineObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.sectionalArea <= 0) return false;
        if (this.params.outsideDiameter <= 0) return false;
        if (this.params.wireWeight <= 0) return false;
        return true;
    }

    public build(args?: any[]): Shape | undefined {
        if (this.valid()) {
            var start = new this.tp.gp_Pnt_3(0, 0, 0);
            var end = new this.tp.gp_Pnt_3(0, 100, 0);
            if (args && args.length === 2) {
                start = new this.tp.gp_Pnt_3(args[0][0], args[0][1], args[0].z);
                end = new this.tp.gp_Pnt_3(args[1][0], args[1][1], args[1].z);
            }
            return new this.tp.Shape(
                this.tp.createTransmissionLine(this.params, start, end),
                false
            );
        }
        throw new Error("Invalid parameters for TransmissionLine");
    }

    fromObject(o?: TransmissionLineObject): Primitive<TransmissionLineParams, TransmissionLineObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            type: o['type'],
            sectionalArea: o['sectionalArea'],
            outsideDiameter: o['outsideDiameter'],
            wireWeight: o['wireWeight'],
            coefficientOfElasticity: o['coefficientOfElasticity'],
            expansionCoefficient: o['expansionCoefficient'],
            ratedStrength: o['ratedStrength'],
        };
        return this;
    }

    toObject(): TransmissionLineObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['type', this.params.type],
            ['sectionalArea', this.params.sectionalArea],
            ['outsideDiameter', this.params.outsideDiameter],
            ['wireWeight', this.params.wireWeight],
            ['coefficientOfElasticity', this.params.coefficientOfElasticity],
            ['expansionCoefficient', this.params.expansionCoefficient],
            ['ratedStrength', this.params.ratedStrength],
        ])) as TransmissionLineObject;
    }
}


// 添加绝缘子Primitive类
export class InsulatorPrimitive extends BasePrimitive<InsulatorParams, InsulatorObject> {

    constructor(tp: TopoInstance, params?: InsulatorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.Insulator;
    }

    setDefault(): Primitive<InsulatorParams, InsulatorObject> {
        this.params = {
            type: "XWP-70",
            subNum: 1,
            subType: 0,
            splitDistance: 0,
            vAngleLeft: 0,
            vAngleRight: 0,
            uLinkLength: 0,
            weight: 5.2,
            fittingLengths: {
                leftUpper: 3.5,
                rightUpper: 3.5,
                leftLower: 5,
                rightLower: 5
            },
            multiLink: {
                count: 1,
                spacing: 0,
                arrangement: this.tp.ArrangementType.VERTICAL as any
            },
            insulator: {
                radius: 2.375,
                height: 50.73,
                leftCount: 20,
                rightCount: 20,
                material: this.tp.InsulatorMaterial.CERAMIC as any
            },
            gradingRing: {
                count: 1,
                position: 0.5,
                height: 0.15,
                radius: 0.75
            },
            application: this.tp.ApplicationType.CONDUCTOR as any,
            stringType: this.tp.StringType.SUSPENSION as any
        };
        return this;
    }

    public setParams(params: InsulatorParams): Primitive<InsulatorParams, InsulatorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.subNum <= 0 || this.params.subNum > 8 ||
            ![1, 2, 3, 4, 6, 8].includes(this.params.subNum)) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createInsulator(this.params), false);
        }
        throw new Error("Invalid parameters for Insulator");
    }

    fromObject(o?: InsulatorObject): Primitive<InsulatorParams, InsulatorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let arrangement: ArrangementType = this.tp.ArrangementType.VERTICAL as any;
        if (o['multiLink']?.arrangement === 'HORIZONTAL') {
            arrangement = this.tp.ArrangementType.HORIZONTAL as any;
        } else if (o['multiLink']?.arrangement === 'VERTICAL') {
            arrangement = this.tp.ArrangementType.VERTICAL as any;
        }

        let material: InsulatorMaterial = this.tp.InsulatorMaterial.CERAMIC as any;
        if (o['insulator']?.material === 'CERAMIC') {
            material = this.tp.InsulatorMaterial.CERAMIC as any;
        } else if (o['insulator']?.material === 'GLASS') {
            material = this.tp.InsulatorMaterial.GLASS as any;
        } else if (o['insulator']?.material === 'COMPOSITE') {
            material = this.tp.InsulatorMaterial.COMPOSITE as any;
        }

        let application: ApplicationType = this.tp.ApplicationType.CONDUCTOR as any;
        if (o['application'] === 'CONDUCTOR') {
            application = this.tp.ApplicationType.CONDUCTOR as any;
        } else if (o['application'] === 'GROUND_WIRE') {
            application = this.tp.ApplicationType.GROUND_WIRE as any;
        }

        let stringType: StringType = this.tp.StringType.SUSPENSION as any;
        if (o['stringType'] === 'SUSPENSION') {
            stringType = this.tp.StringType.SUSPENSION as any;
        } else if (o['stringType'] === 'TENSION') {
            stringType = this.tp.StringType.TENSION as any;
        }

        this.params = {
            type: o['type'],
            subNum: o['subNum'],
            subType: o['subType'],
            splitDistance: o['splitDistance'],
            vAngleLeft: o['vAngleLeft'],
            vAngleRight: o['vAngleRight'],
            uLinkLength: o['uLinkLength'],
            weight: o['weight'],
            fittingLengths: {
                leftUpper: o['fittingLengths']?.leftUpper,
                rightUpper: o['fittingLengths']?.rightUpper,
                leftLower: o['fittingLengths']?.leftLower,
                rightLower: o['fittingLengths']?.rightLower
            },
            multiLink: {
                count: o['multiLink']?.count,
                spacing: o['multiLink']?.spacing,
                arrangement: arrangement
            },
            insulator: {
                radius: o['insulator']?.radius,
                height: o['insulator']?.height,
                leftCount: o['insulator']?.leftCount,
                rightCount: o['insulator']?.rightCount,
                material: material
            },
            gradingRing: {
                count: o['gradingRing']?.count,
                position: o['gradingRing']?.position,
                height: o['gradingRing']?.height,
                radius: o['gradingRing']?.radius
            },
            application: application,
            stringType: stringType
        };
        return this;
    }

    toObject(): InsulatorObject | undefined {

        let arrangement: string = 'VERTICAL';
        if (this.params.multiLink.arrangement === this.tp.ArrangementType.HORIZONTAL) {
            arrangement = 'HORIZONTAL';
        } else if (this.params.multiLink.arrangement === this.tp.ArrangementType.VERTICAL) {
            arrangement = 'VERTICAL';
        }

        let material: string = 'CERAMIC';
        if (this.params.insulator.material === this.tp.InsulatorMaterial.GLASS) {
            material = 'GLASS';
        } else if (this.params.insulator.material === this.tp.InsulatorMaterial.COMPOSITE) {
            material = 'COMPOSITE';
        } else if (this.params.insulator.material === this.tp.InsulatorMaterial.CERAMIC) {
            material = 'CERAMIC';
        }

        let application: string = 'CONDUCTOR';
        if (this.params.application === this.tp.ApplicationType.GROUND_WIRE) {
            application = 'GROUND_WIRE';
        } else if (this.params.application === this.tp.ApplicationType.CONDUCTOR) {
            application = 'CONDUCTOR';
        }

        let stringType: string = 'SUSPENSION';
        if (this.params.stringType === this.tp.StringType.TENSION) {
            stringType = 'TENSION';
        } else if (this.params.stringType === this.tp.StringType.SUSPENSION) {
            stringType = 'SUSPENSION';
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['type', this.params.type],
            ['subNum', this.params.subNum],
            ['subType', this.params.subType],
            ['splitDistance', this.params.splitDistance],
            ['vAngleLeft', this.params.vAngleLeft],
            ['vAngleRight', this.params.vAngleRight],
            ['uLinkLength', this.params.uLinkLength],
            ['weight', this.params.weight],
            ['fittingLengths', {
                leftUpper: this.params.fittingLengths.leftUpper,
                rightUpper: this.params.fittingLengths.rightUpper,
                leftLower: this.params.fittingLengths.leftLower,
                rightLower: this.params.fittingLengths.rightLower
            }],
            ['multiLink', {
                count: this.params.multiLink.count,
                spacing: this.params.multiLink.spacing,
                arrangement: arrangement
            }],
            ['insulator', {
                radius: this.params.insulator.radius,
                height: this.params.insulator.height,
                leftCount: this.params.insulator.leftCount,
                rightCount: this.params.insulator.rightCount,
                material: material
            }],
            ['gradingRing', {
                count: this.params.gradingRing.count,
                position: this.params.gradingRing.position,
                height: this.params.gradingRing.height,
                radius: this.params.gradingRing.radius
            }],
            ['application', application],
            ['stringType', stringType]
        ])) as InsulatorObject;
    }
}

// 组织节点和杆件的函数
function organizeNodes(tp: TopoInstance, nodes: number[][][]): { nodeList: PoleTowerNode[], memberList: PoleTowerMember[] } {
    const nodeList: PoleTowerNode[] = [];
    const memberList: PoleTowerMember[] = [];
    const nodeMap = new Map<string, PoleTowerNode>();
    let nodeIdCounter = 1;
    let memberIdCounter = 1;

    nodes.forEach((segment, segmentIndex) => {
        if (segment.length !== 2) return;

        // 处理起点
        const startKey = segment[0].join(',');
        let startNode = nodeMap.get(startKey);
        if (!startNode) {
            startNode = {
                id: `node_${nodeIdCounter++}`,
                position: new tp.gp_Pnt_3(segment[0][0], segment[0][1], segment[0][2])
            };
            nodeMap.set(startKey, startNode);
            nodeList.push(startNode);
        }

        // 处理终点
        const endKey = segment[1].join(',');
        let endNode = nodeMap.get(endKey);
        if (!endNode) {
            endNode = {
                id: `node_${nodeIdCounter++}`,
                position: new tp.gp_Pnt_3(segment[1][0], segment[1][1], segment[1][2])
            };
            nodeMap.set(endKey, endNode);
            nodeList.push(endNode);
        }

        // 创建杆件
        memberList.push({
            id: `member_${memberIdCounter++}`,
            startNodeId: startNode.id,
            endNodeId: endNode.id,
            type: tp.MemberType.ANGLE as any,
            specification: 'L0.2x0.01',
            material: 'Q345',
            xDirection: new tp.gp_Dir_4(1, 0, 0),
            yDirection: new tp.gp_Dir_4(0, 1, 0),
            end1Diameter: 0.0,
            end2Diameter: 0.0,
            thickness: 0.0,
            sides: 0
        });
    });

    return { nodeList, memberList };
}

const nodes = [
    [
        [
            -2.0265226742107814,
            -9.382245879547408,
            -0.015621793753579638
        ],
        [
            -0.6267873559426036,
            -2.82250799450396,
            38.558215350489895
        ]
    ],
    [
        [
            -0.6267873559426036,
            -2.82250799450396,
            38.558215350489895
        ],
        [
            -0.47044549314588835,
            -2.186319757328146,
            49.20256873592615
        ]
    ],
    [
        [
            -0.47044549314588835,
            -2.186319757328146,
            49.20256873592615
        ],
        [
            -0.33634366111258274,
            -1.553915879033302,
            58.413209580997425
        ]
    ],
    [
        [
            -0.33634366111258274,
            -1.553915879033302,
            58.413209580997425
        ],
        [
            4.360279466762972,
            -8.446010253137615,
            63.267466193294204
        ]
    ],
    [
        [
            4.360279466762972,
            -8.446010253137615,
            63.267466193294204
        ],
        [
            4.964124149792788,
            -8.095003451991559,
            63.43793484312452
        ]
    ],
    [
        [
            4.964124149792788,
            -8.095003451991559,
            63.43793484312452
        ],
        [
            4.6297462382405055,
            -7.531456638705673,
            62.93328131038123
        ]
    ],
    [
        [
            4.6297462382405055,
            -7.531456638705673,
            62.93328131038123
        ],
        [
            1.9068842752500768,
            -0.6304330536115104,
            58.56008365504745
        ]
    ],
    [
        [
            1.9068842752500768,
            -0.6304330536115104,
            58.56008365504745
        ],
        [
            0.8341216758958083,
            1.4387987184271598,
            58.42892811152461
        ]
    ],
    [
        [
            0.8341216758958083,
            1.4387987184271598,
            58.42892811152461
        ],
        [
            -0.2485711383284137,
            3.4561698372687966,
            59.58348318873629
        ]
    ],
    [
        [
            -0.2485711383284137,
            3.4561698372687966,
            59.58348318873629
        ],
        [
            -3.5299701716037006,
            8.65660610719942,
            62.99574353330713
        ]
    ],
    [
        [
            -3.5299701716037006,
            8.65660610719942,
            62.99574353330713
        ],
        [
            -4.50875905216704,
            8.078909138307793,
            63.138189173675435
        ]
    ],
    [
        [
            -4.50875905216704,
            8.078909138307793,
            63.138189173675435
        ],
        [
            -1.2638895047908179,
            0.22802640493759974,
            58.555938089970475
        ]
    ],
    [
        [
            -1.2638895047908179,
            0.22802640493759974,
            58.555938089970475
        ],
        [
            -1.7888512566921104,
            0.29547000758132924,
            49.17524187248124
        ]
    ],
    [
        [
            -1.7888512566921104,
            0.29547000758132924,
            49.17524187248124
        ],
        [
            -2.179595492350419,
            0.42320774919833903,
            38.195928279048
        ]
    ],
    [
        [
            -2.179595492350419,
            0.42320774919833903,
            38.195928279048
        ],
        [
            -7.442983819026345,
            1.0596820675211518,
            0.7843780059003285
        ]
    ],
    [
        [
            -2.1719056171733753,
            0.42069386108741824,
            38.41200197472486
        ],
        [
            -0.6313348913297498,
            -2.84381962376223,
            38.43289459367103
        ]
    ],
    [
        [
            -2.091975346560319,
            0.3945639496947479,
            40.65791996041241
        ],
        [
            -0.5953142207795881,
            -2.694437124555392,
            40.70102705063152
        ]
    ],
    [
        [
            -2.0896852183444445,
            0.39381528655499276,
            40.722269050064085
        ],
        [
            -0.5568543126728489,
            -2.5379355919352737,
            43.3195250379034
        ]
    ],
    [
        [
            -0.5568543126728489,
            -2.5379355919352737,
            43.3195250379034
        ],
        [
            -1.9035991135435573,
            0.3329820954177658,
            45.95100312606985
        ]
    ],
    [
        [
            -1.9035991135435573,
            0.3329820954177658,
            45.95100312606985
        ],
        [
            -0.47035223770392887,
            -2.18587997882346,
            49.208973886174384
        ]
    ],
    [
        [
            -0.47035223770392887,
            -2.18587997882346,
            49.208973886174384
        ],
        [
            -1.7888744686509537,
            0.2954775957756788,
            49.174589652046485
        ]
    ],
    [
        [
            -1.7888744686509537,
            0.2954775957756788,
            49.174589652046485
        ],
        [
            -0.5162136740001143,
            -2.372560203588235,
            46.08649552235322
        ]
    ],
    [
        [
            -0.5162136740001143,
            -2.372560203588235,
            46.08649552235322
        ],
        [
            -1.9980025919833009,
            0.36384342627365585,
            43.29841020334986
        ]
    ],
    [
        [
            -1.9980025919833009,
            0.36384342627365585,
            43.29841020334986
        ],
        [
            -0.6019287409637715,
            -2.6807852299463613,
            40.70083653808768
        ]
    ],
    [
        [
            -1.6221533463667939,
            0.2740537661412583,
            52.154015947332475
        ],
        [
            -0.42690692810937925,
            -1.9809984953662492,
            52.1929684894617
        ]
    ],
    [
        [
            -0.42690692810937925,
            -1.9809984953662492,
            52.1929684894617
        ],
        [
            -1.784741331522532,
            0.2949419916658295,
            49.248683336269394
        ]
    ],
    [
        [
            -1.609599641276198,
            0.25036889194090756,
            52.154425066924006
        ],
        [
            -0.469262479759318,
            -2.180740845821881,
            49.28382274456568
        ]
    ],
    [
        [
            -1.5954133835779223,
            0.22360390690002785,
            52.15488739066931
        ],
        [
            -0.3958617581588176,
            -1.8345941876743028,
            54.32527276937493
        ]
    ],
    [
        [
            -0.3958617581588176,
            -1.8345941876743028,
            54.32527276937493
        ],
        [
            -1.385413324942892,
            0.24363897901256892,
            56.3843931423497
        ]
    ],
    [
        [
            -1.385413324942892,
            0.24363897901256892,
            56.3843931423497
        ],
        [
            -0.3175878874574891,
            -1.5814391779164971,
            58.4325948575685
        ]
    ],
    [
        [
            -0.3175878874574891,
            -1.5814391779164971,
            58.4325948575685
        ],
        [
            -1.2647185080690746,
            0.228132909778165,
            58.54112438613688
        ]
    ],
    [
        [
            -1.259500491684781,
            0.21816345403820137,
            58.54052646559042
        ],
        [
            -0.36360331614774544,
            -1.6824682731641663,
            56.54090934257067
        ]
    ],
    [
        [
            -0.36360331614774544,
            -1.6824682731641663,
            56.54090934257067
        ],
        [
            -1.499463915154137,
            0.25829144209131977,
            54.34638954242608
        ]
    ],
    [
        [
            -1.499463915154137,
            0.25829144209131977,
            54.34638954242608
        ],
        [
            -0.42626842294110306,
            -1.9779874019411503,
            52.236823533748144
        ]
    ],
    [
        [
            -0.5958795445138929,
            -2.696737546870487,
            40.6625376435241
        ],
        [
            -2.1719056171733753,
            0.42069386108741824,
            38.41200197472486
        ]
    ],
    [
        [
            -2.092976068540551,
            0.39489109454827603,
            40.629801207944304
        ],
        [
            -0.6313348913297498,
            -2.84381962376223,
            38.43289459367103
        ]
    ],
    [
        [
            -1.4743707980638243,
            -1.0574023956672527,
            38.42146166971508
        ],
        [
            -2.351925213469145,
            0.4440466907637758,
            36.97102872289794
        ]
    ],
    [
        [
            -2.351925213469145,
            0.4440466907637758,
            36.97102872289794
        ],
        [
            -0.7681212988562647,
            -3.4848572313013726,
            34.663341494159255
        ]
    ],
    [
        [
            -0.7681212988562647,
            -3.4848572313013726,
            34.663341494159255
        ],
        [
            -0.7868010528127038,
            -3.572398274320098,
            34.14856575219847
        ]
    ],
    [
        [
            -0.7868010528127038,
            -3.572398274320098,
            34.14856575219847
        ],
        [
            -3.11294570764736,
            0.5360729617130203,
            31.561783820228044
        ]
    ],
    [
        [
            -3.11294570764736,
            0.5360729617130203,
            31.561783820228044
        ],
        [
            -0.9892219003740004,
            -4.521025979244552,
            28.570261978246542
        ]
    ],
    [
        [
            -0.9892219003740004,
            -4.521025979244552,
            28.570261978246542
        ],
        [
            -4.13566842751119,
            0.6597455288043564,
            24.292390023886217
        ]
    ],
    [
        [
            -4.13566842751119,
            0.6597455288043564,
            24.292390023886217
        ],
        [
            -1.2854365452095273,
            -5.909210161262895,
            20.407193346269374
        ]
    ],
    [
        [
            -1.2854365452095273,
            -5.909210161262895,
            20.407193346269374
        ],
        [
            -5.504418821476232,
            0.8252614322268137,
            14.563471882755348
        ]
    ],
    [
        [
            -5.504418821476232,
            0.8252614322268137,
            14.563471882755348
        ],
        [
            -1.6943267818849008,
            -7.825438709144645,
            9.13901628912295
        ]
    ],
    [
        [
            -1.6943267818849008,
            -7.825438709144645,
            9.13901628912295
        ],
        [
            -4.521736402391138,
            -3.3905472938041807,
            6.280214615515183
        ]
    ],
    [
        [
            -4.521736402391138,
            -3.3905472938041807,
            6.280214615515183
        ],
        [
            -6.295327953933891,
            0.9209019815636308,
            8.941782025583397
        ]
    ],
    [
        [
            -6.295327953933891,
            0.9209019815636308,
            8.941782025583397
        ],
        [
            -1.4951684076124803,
            -6.892100301669984,
            14.627412984436436
        ]
    ],
    [
        [
            -1.4951684076124803,
            -6.892100301669984,
            14.627412984436436
        ],
        [
            -4.7472044548908325,
            0.733695416595006,
            19.945663274464827
        ]
    ],
    [
        [
            -4.7472044548908325,
            0.733695416595006,
            19.945663274464827
        ],
        [
            -1.1374110897983587,
            -5.215501732863138,
            24.48647157531161
        ]
    ],
    [
        [
            -1.1374110897983587,
            -5.215501732863138,
            24.48647157531161
        ],
        [
            -3.5471610790948995,
            0.5885803800136378,
            28.475431609437933
        ]
    ],
    [
        [
            -3.5471610790948995,
            0.5885803800136378,
            28.475431609437933
        ],
        [
            -0.8792309336367583,
            -4.005562875540395,
            31.601387636710058
        ]
    ],
    [
        [
            -0.8792309336367583,
            -4.005562875540395,
            31.601387636710058
        ],
        [
            -2.709328050222981,
            0.48726556666100607,
            34.430651048840566
        ]
    ],
    [
        [
            -2.709328050222981,
            0.48726556666100607,
            34.430651048840566
        ],
        [
            -0.6786295973857999,
            -3.0654621521951855,
            37.12954940734816
        ]
    ],
    [
        [
            -0.6786295973857999,
            -3.0654621521951855,
            37.12954940734816
        ],
        [
            -1.3272005215510756,
            -1.3692604260616892,
            38.42345753556908
        ]
    ],
    [
        [
            -6.661666642226774,
            0.9652014237546539,
            6.337889361117256
        ],
        [
            -1.794101076005064,
            -8.293022264800921,
            6.389441192786306
        ]
    ],
    [
        [
            -4.503776464509832,
            -3.4187180879304275,
            6.298373958293317
        ],
        [
            -7.4389514523859095,
            1.059194454286215,
            0.8130395976213549
        ]
    ],
    [
        [
            -4.519580175765459,
            -3.3939294110900518,
            6.282394782209623
        ],
        [
            -2.0265226742107814,
            -9.382245879547408,
            -0.015621793753579638
        ]
    ],
    [
        [
            -2.024427977723924,
            -9.372429266561243,
            0.04210374913736544
        ],
        [
            3.3331521537271485,
            -5.7125041478754035,
            6.542564997349087
        ]
    ],
    [
        [
            3.3331521537271485,
            -5.7125041478754035,
            6.542564997349087
        ],
        [
            -1.7961744572109186,
            -8.30273898557568,
            6.332303055362208
        ]
    ],
    [
        [
            2.735431672351001,
            -1.2228870632779973,
            38.46798532334256
        ],
        [
            8.54438024692842,
            -3.553320898489263,
            -0.07993568082441982
        ]
    ],
    [
        [
            3.3326922356036333,
            -5.712736399793906,
            6.542546144332865
        ],
        [
            8.54438024692842,
            -3.553320898489263,
            -0.07993568082441982
        ]
    ],
    [
        [
            2.735431672351001,
            -1.2228870632779973,
            38.46798532334256
        ],
        [
            1.2109572628240552,
            2.2348386940144818,
            38.50973639332398
        ]
    ],
    [
        [
            1.2109572628240552,
            2.2348386940144818,
            38.50973639332398
        ],
        [
            -3.061483070052674,
            7.664664858303284,
            38.29345187550644
        ]
    ],
    [
        [
            -3.061483070052674,
            7.664664858303284,
            38.29345187550644
        ],
        [
            -4.27150171443789,
            6.966805146309159,
            38.46358216947882
        ]
    ],
    [
        [
            -4.27150171443789,
            6.966805146309159,
            38.46358216947882
        ],
        [
            -2.168950213836389,
            0.41972771363498557,
            38.49504427470194
        ]
    ],
    [
        [
            -4.267665846690354,
            6.969017424255425,
            38.463042841171315
        ],
        [
            -2.089339435397722,
            0.38912361836480763,
            40.65799588037741
        ]
    ],
    [
        [
            -0.5958795445138929,
            -2.696737546870487,
            40.6625376435241
        ],
        [
            3.6551080400377938,
            -8.277833097179268,
            38.601943591143154
        ]
    ],
    [
        [
            3.6551080400377938,
            -8.277833097179268,
            38.601943591143154
        ],
        [
            -0.6313348913297498,
            -2.84381962376223,
            38.43289459367103
        ]
    ],
    [
        [
            3.6059169025446787,
            -8.213250354200872,
            38.6257881598068
        ],
        [
            4.958665535821215,
            -7.553428521768804,
            38.82278146840369
        ]
    ],
    [
        [
            4.958665535821215,
            -7.553428521768804,
            38.82278146840369
        ],
        [
            2.735431672351001,
            -1.2228870632779973,
            38.46798532334256
        ]
    ],
    [
        [
            2.735431672351001,
            -1.2228870632779973,
            38.46798532334256
        ],
        [
            1.7930131477314493,
            -0.4107891593135157,
            58.54616181471646
        ]
    ],
    [
        [
            0.8341216758958083,
            1.4387987184271598,
            58.42892811152461
        ],
        [
            1.1118262087931825,
            1.9619470380044728,
            40.6125072452199
        ]
    ],
    [
        [
            1.1118262087931825,
            1.9619470380044728,
            40.6125072452199
        ],
        [
            2.951763109558768,
            7.02699383602876,
            -0.1836274885877387
        ]
    ],
    [
        [
            2.6338461035872673,
            -1.1353490689464754,
            40.63226045729988
        ],
        [
            1.113143727877937,
            1.9655739535898904,
            40.58329445750221
        ]
    ],
    [
        [
            1.113143727877937,
            1.9655739535898904,
            40.58329445750221
        ],
        [
            -3.061483070052674,
            7.664664858303284,
            38.29345187550644
        ]
    ],
    [
        [
            2.6338752298236723,
            -1.1353741675145923,
            40.63163992438399
        ],
        [
            4.958665535821215,
            -7.553428521768804,
            38.82278146840369
        ]
    ],
    [
        [
            1.1140540062710966,
            1.968079801838635,
            40.563111243633756
        ],
        [
            2.7290858247793026,
            -1.2131579138448758,
            38.467794262630896
        ]
    ],
    [
        [
            2.6338752298236723,
            -1.1353741675145923,
            40.63163992438399
        ],
        [
            1.205963851229949,
            2.2210926446823445,
            38.525233522531174
        ]
    ],
    [
        [
            1.2072013417884766,
            2.2244992547614437,
            38.49779517313099
        ],
        [
            -2.170839751088537,
            0.4184352603308103,
            38.412016429584725
        ]
    ],
    [
        [
            -0.5953142207795881,
            -2.694437124555392,
            40.70102705063152
        ],
        [
            2.6373829791388648,
            -1.1450580197346936,
            40.628910636502034
        ]
    ],
    [
        [
            -0.5952236628838654,
            -2.6940686252487347,
            40.70719257934321
        ],
        [
            3.2209078459350553,
            -2.755996564383313,
            40.1748852188736
        ]
    ],
    [
        [
            3.2209078459350553,
            -2.755996564383313,
            40.1748852188736
        ],
        [
            1.6536788001014584,
            -5.650168912541433,
            39.57210243212906
        ]
    ],
    [
        [
            1.6536788001014584,
            -5.650168912541433,
            39.57210243212906
        ],
        [
            4.3336348700398295,
            -5.827904815087937,
            39.30910146127743
        ]
    ],
    [
        [
            3.7882257481059884,
            -4.322192501660406,
            39.73347001599552
        ],
        [
            0.5365153904328555,
            -4.183451917806485,
            40.11362842619839
        ]
    ],
    [
        [
            0.5365153904328555,
            -4.183451917806485,
            40.11362842619839
        ],
        [
            2.6011693419817536,
            -1.1624146260763584,
            40.62971850605889
        ]
    ],
    [
        [
            4.954571084275756,
            -7.54176978640848,
            38.822128052832646
        ],
        [
            2.397441520817045,
            -6.683462911937893,
            38.55234366233675
        ]
    ],
    [
        [
            2.397441520817045,
            -6.683462911937893,
            38.55234366233675
        ],
        [
            4.020584171302676,
            -4.882291190200448,
            38.67307717622214
        ]
    ],
    [
        [
            4.020584171302676,
            -4.882291190200448,
            38.67307717622214
        ],
        [
            1.488996443613987,
            -5.531808062352421,
            38.51651635003642
        ]
    ],
    [
        [
            1.488996443613987,
            -5.531808062352421,
            38.51651635003642
        ],
        [
            3.097558832987968,
            -2.254025101126887,
            38.525775609253095
        ]
    ],
    [
        [
            3.097558832987968,
            -2.254025101126887,
            38.525775609253095
        ],
        [
            -0.6338365675951256,
            -2.8555435121002084,
            38.36395352203499
        ]
    ],
    [
        [
            -2.0896852183444445,
            0.39381528655499276,
            40.722269050064085
        ],
        [
            0.0568513266454711,
            3.4075966080618834,
            40.00390294864215
        ]
    ],
    [
        [
            0.0568513266454711,
            3.4075966080618834,
            40.00390294864215
        ],
        [
            -3.15485296465038,
            3.6076338631457383,
            39.58434954931149
        ]
    ],
    [
        [
            -3.15485296465038,
            3.6076338631457383,
            39.58434954931149
        ],
        [
            -1.8852990532987155,
            6.058969317931973,
            38.9386056524048
        ]
    ],
    [
        [
            -1.8852990532987155,
            6.058969317931973,
            38.9386056524048
        ],
        [
            -4.243368316600662,
            6.895623847008783,
            38.48752582831185
        ]
    ],
    [
        [
            -3.204343218813002,
            3.643809585062056,
            38.47955088789998
        ],
        [
            0.24517613524361848,
            3.462245802584136,
            38.46084548105339
        ]
    ],
    [
        [
            0.24517613524361848,
            3.462245802584136,
            38.46084548105339
        ],
        [
            -0.2953482565848675,
            1.421163636615633,
            38.45964086620554
        ]
    ],
    [
        [
            -0.2953482565848675,
            1.421163636615633,
            38.45964086620554
        ],
        [
            -2.6903359057732756,
            2.0432563151568246,
            38.48724237710426
        ]
    ],
    [
        [
            -2.6903359057732756,
            2.0432563151568246,
            38.48724237710426
        ],
        [
            -0.8094804684484782,
            4.802604374007757,
            38.40745540952042
        ]
    ],
    [
        [
            -0.8094804684484782,
            4.802604374007757,
            38.40745540952042
        ],
        [
            -3.777561658990431,
            5.4287387592605,
            38.47097337677812
        ]
    ],
    [
        [
            -3.777561658990431,
            5.4287387592605,
            38.47097337677812
        ],
        [
            -3.061483070052674,
            7.664664858303284,
            38.29345187550644
        ]
    ],
    [
        [
            -3.061483070052674,
            7.664664858303284,
            38.29345187550644
        ],
        [
            -3.061483070052674,
            7.664664858303284,
            38.29345187550644
        ]
    ],
    [
        [
            -3.187200544484724,
            3.642907288691645,
            38.479457929819496
        ],
        [
            -1.9547040085425744,
            6.25806407794127,
            38.34948055162562
        ]
    ],
    [
        [
            -0.6784626565659135,
            -3.064679798555553,
            37.13414995426226
        ],
        [
            2.9278642472319962,
            -1.300087158569273,
            37.19101142696396
        ]
    ],
    [
        [
            2.9278642472319962,
            -1.300087158569273,
            37.19101142696396
        ],
        [
            -0.7845934387044695,
            -3.562052482717684,
            34.209403073352675
        ]
    ],
    [
        [
            -0.7845934387044695,
            -3.562052482717684,
            34.209403073352675
        ],
        [
            3.381715919926424,
            -1.4821633605937101,
            34.17927217638769
        ]
    ],
    [
        [
            3.381715919926424,
            -1.4821633605937101,
            34.17927217638769
        ],
        [
            -0.8792309336367583,
            -4.005562875540395,
            31.601387636710058
        ]
    ],
    [
        [
            -0.8792309336367583,
            -4.005562875540395,
            31.601387636710058
        ],
        [
            3.864602908514418,
            -1.6758879498788894,
            30.97485587780061
        ]
    ],
    [
        [
            3.864602908514418,
            -1.6758879498788894,
            30.97485587780061
        ],
        [
            -0.9892219003740004,
            -4.521025979244552,
            28.570261978246542
        ]
    ],
    [
        [
            -0.9892219003740004,
            -4.521025979244552,
            28.570261978246542
        ],
        [
            4.261155163254644,
            -1.8349767729269,
            28.343352982999626
        ]
    ],
    [
        [
            4.261155163254644,
            -1.8349767729269,
            28.343352982999626
        ],
        [
            -1.1413516035859628,
            -5.233968608165723,
            24.37787908991534
        ]
    ],
    [
        [
            -1.1413516035859628,
            -5.233968608165723,
            24.37787908991534
        ],
        [
            4.892059882447226,
            -2.0880831114535434,
            24.15669769343012
        ]
    ],
    [
        [
            4.892059882447226,
            -2.0880831114535434,
            24.15669769343012
        ],
        [
            -1.296998563991827,
            -5.8907545049092755,
            20.391178769080994
        ]
    ],
    [
        [
            -1.296998563991827,
            -5.8907545049092755,
            20.391178769080994
        ],
        [
            5.514668938521464,
            -2.3378613960702053,
            20.025092050532066
        ]
    ],
    [
        [
            5.514668938521464,
            -2.3378613960702053,
            20.025092050532066
        ],
        [
            -1.4941406092878637,
            -6.887283614171869,
            14.655737000179597
        ]
    ],
    [
        [
            -1.4941406092878637,
            -6.887283614171869,
            14.655737000179597
        ],
        [
            6.35291187211558,
            -2.6741476739559737,
            14.462549712336578
        ]
    ],
    [
        [
            6.35291187211558,
            -2.6741476739559737,
            14.462549712336578
        ],
        [
            -1.694326781884901,
            -7.825438709144645,
            9.13901628912295
        ]
    ],
    [
        [
            -1.694326781884901,
            -7.825438709144645,
            9.13901628912295
        ],
        [
            7.156427943396341,
            -2.996502230139135,
            9.130453267746756
        ]
    ],
    [
        [
            7.156427943396341,
            -2.996502230139135,
            9.130453267746756
        ],
        [
            3.333152153727149,
            -5.7125041478754035,
            6.542564997349087
        ]
    ],
    [
        [
            7.523951582761596,
            -3.1439453540402758,
            6.691582956617101
        ],
        [
            2.6657135258680853,
            6.2395458929249425,
            6.158827707532836
        ]
    ],
    [
        [
            8.532840179109838,
            -3.5486912543876175,
            -0.0033563107469802844
        ],
        [
            5.264990913770966,
            1.2191462475816843,
            6.443864928026054
        ]
    ],
    [
        [
            5.264990913770966,
            1.2191462475816843,
            6.443864928026054
        ],
        [
            2.9461072989465364,
            7.011424310019583,
            -0.05822361649327945
        ]
    ],
    [
        [
            2.6657135258680853,
            6.239545892924942,
            6.158827707532836
        ],
        [
            -6.661666642226774,
            0.9652014237546539,
            6.337889361117256
        ]
    ],
    [
        [
            2.9461072989465364,
            7.011424310019583,
            -0.05822361649327945
        ],
        [
            -2.0522765418386975,
            3.571668700106253,
            6.249400954027945
        ]
    ],
    [
        [
            -2.0522765418386975,
            3.571668700106253,
            6.249400954027945
        ],
        [
            -7.4389514523859095,
            1.0591944542862155,
            0.8130395976213549
        ]
    ],
    [
        [
            -5.497509428714041,
            0.809573862392914,
            14.553634930306952
        ],
        [
            2.5406232516401412,
            5.895192729140578,
            8.932400909509898
        ]
    ],
    [
        [
            2.5406232516401412,
            5.895192729140578,
            8.932400909509898
        ],
        [
            5.248857788287108,
            1.250306730042845,
            6.442095766617122
        ]
    ],
    [
        [
            -4.742241255362548,
            0.7255157094762009,
            19.951906550834806
        ],
        [
            2.2978328288286543,
            5.226830214567064,
            14.315689215198084
        ]
    ],
    [
        [
            -4.115908067619831,
            0.6573560107199841,
            24.432844357028298
        ],
        [
            2.0457760478940745,
            4.532958924382175,
            19.904436520227023
        ]
    ],
    [
        [
            2.0457760478940745,
            4.532958924382175,
            19.904436520227023
        ],
        [
            6.335911891457021,
            -2.667327622165874,
            14.575360818010065
        ]
    ],
    [
        [
            2.2947828359654188,
            5.2184340806673095,
            14.383315403755926
        ],
        [
            7.1564279433963405,
            -2.996502230139135,
            9.130453267746756
        ]
    ],
    [
        [
            6.35291187211558,
            -2.6741476739559733,
            14.462549712336578
        ],
        [
            2.5406793946699193,
            5.895096438376453,
            8.932349284263303
        ]
    ],
    [
        [
            2.2955058016686816,
            5.220424287569985,
            14.36728539412573
        ],
        [
            5.438022307702625,
            -2.387612767228357,
            19.966374094012863
        ]
    ],
    [
        [
            5.438022307702625,
            -2.387612767228357,
            19.966374094012863
        ],
        [
            1.8384689356008348,
            3.962276187984189,
            24.500968543076585
        ]
    ],
    [
        [
            1.8384689356008348,
            3.962276187984189,
            24.500968543076585
        ],
        [
            4.248990957178231,
            -1.84119987951164,
            28.343878691485955
        ]
    ],
    [
        [
            4.248990957178231,
            -1.84119987951164,
            28.343878691485955
        ],
        [
            1.4892301700911597,
            3.0008787127475633,
            32.24449046824317
        ]
    ],
    [
        [
            1.4892301700911597,
            3.0008787127475633,
            32.24449046824317
        ],
        [
            3.3893434080285068,
            -1.4852233560683745,
            34.12865650901785
        ]
    ],
    [
        [
            3.3893434080285068,
            -1.4852233560683745,
            34.12865650901785
        ],
        [
            1.06896004868039,
            2.4153023467612122,
            38.50254804273283
        ]
    ],
    [
        [
            1.06896004868039,
            2.4153023467612122,
            38.50254804273283
        ],
        [
            2.727205544322527,
            -1.2042290296704237,
            38.4682106138721
        ]
    ],
    [
        [
            2.630001071307996,
            -1.132035739917918,
            40.71417866529501
        ],
        [
            1.0725300593168832,
            1.8879197459401331,
            43.13359226385623
        ]
    ],
    [
        [
            1.0725300593168832,
            1.8879197459401331,
            43.13359226385623
        ],
        [
            2.3676645600728605,
            -0.9059759529528728,
            46.30324407000645
        ]
    ],
    [
        [
            2.3676645600728605,
            -0.9059759529528728,
            46.30324407000645
        ],
        [
            0.978975338276866,
            1.7116784920075008,
            49.13569192959934
        ]
    ],
    [
        [
            0.978975338276866,
            1.7116784920075008,
            49.13569192959934
        ],
        [
            2.22739545794049,
            -0.7851037068574731,
            49.29166982281859
        ]
    ],
    [
        [
            2.22739545794049,
            -0.7851037068574731,
            49.29166982281859
        ],
        [
            5.778580708526443,
            -9.00594012100905,
            49.39964955913595
        ]
    ],
    [
        [
            5.778580708526443,
            -9.00594012100905,
            49.39964955913595
        ],
        [
            2.0951399919856453,
            -0.6711369459291118,
            52.109365483525444
        ]
    ],
    [
        [
            2.0951399919856453,
            -0.6711369459291118,
            52.109365483525444
        ],
        [
            0.9320339006656565,
            1.6232487715825816,
            52.14726829756507
        ]
    ],
    [
        [
            0.9320339006656565,
            1.6232487715825816,
            52.14726829756507
        ],
        [
            -3.8037142086057134,
            9.354553322090993,
            49.11960076503621
        ]
    ],
    [
        [
            -3.8037142086057134,
            9.354553322090993,
            49.11960076503621
        ],
        [
            0.97877468841737,
            1.7113005016458613,
            49.14856482838226
        ]
    ],
    [
        [
            2.2183046976253804,
            -0.7669226088669749,
            49.29053402116066
        ],
        [
            1.0204684961462185,
            1.7898445758910855,
            46.47365557045356
        ]
    ],
    [
        [
            1.0204684961462185,
            1.7898445758910855,
            46.47365557045356
        ],
        [
            2.4989802080168224,
            -1.019132856883724,
            43.50557118198427
        ]
    ],
    [
        [
            2.4989802080168224,
            -1.019132856883724,
            43.50557118198427
        ],
        [
            1.144728806091545,
            1.901167599154162,
            40.58431148421179
        ]
    ],
    [
        [
            2.0989338995290114,
            -0.6744062199122887,
            52.02853648530683
        ],
        [
            0.9782326432157357,
            1.7102793802640408,
            49.18334029761973
        ]
    ],
    [
        [
            0.948235268321054,
            1.5912893597713045,
            52.146740334183214
        ],
        [
            2.2183046976253804,
            -0.7669226088669749,
            49.29053402116066
        ]
    ],
    [
        [
            0.835096036207966,
            1.440634248278437,
            58.366417020273396
        ],
        [
            1.8951693452723948,
            -0.49881887406628334,
            56.369729465041694
        ]
    ],
    [
        [
            1.8951693452723948,
            -0.49881887406628334,
            56.369729465041694
        ],
        [
            0.8979238694546878,
            1.5589912482264812,
            54.33563254742768
        ]
    ],
    [
        [
            0.8979238694546878,
            1.5589912482264812,
            54.33563254742768
        ],
        [
            2.0753814836905904,
            -0.6321605880802234,
            52.110009365516255
        ]
    ],
    [
        [
            0.9658589185504218,
            1.5565243012109167,
            52.14616602205268
        ],
        [
            1.9897131376104091,
            -0.5802888511357068,
            54.35547900292055
        ]
    ],
    [
        [
            1.9897131376104091,
            -0.5802888511357068,
            54.35547900292055
        ],
        [
            0.8704919610802305,
            1.5073141775673589,
            56.09555493567999
        ]
    ],
    [
        [
            0.8704919610802305,
            1.5073141775673589,
            56.09555493567999
        ],
        [
            1.7939800494962,
            -0.41162235483756426,
            58.525562024097624
        ]
    ],
    [
        [
            -3.5424564152751983,
            0.5772488081724454,
            28.46764378247076
        ],
        [
            1.8442376469833395,
            3.952099737489668,
            24.493701317421284
        ]
    ],
    [
        [
            -3.090610349203798,
            0.5333720623764061,
            31.720540942716063
        ],
        [
            1.6634610155259817,
            3.4805078703667798,
            28.38134437764264
        ]
    ],
    [
        [
            1.6634610155259817,
            3.4805078703667798,
            28.38134437764264
        ],
        [
            4.875829403101468,
            -2.0815717681797214,
            24.264402423063665
        ]
    ],
    [
        [
            4.875829403101468,
            -2.081571768179722,
            24.264402423063665
        ],
        [
            2.0626549141565818,
            4.504630526843606,
            19.883470108122506
        ]
    ],
    [
        [
            3.8498756229004103,
            -1.6699796578265362,
            31.072585481560424
        ],
        [
            1.6616192603510576,
            3.4754378181559606,
            28.42218082819246
        ]
    ],
    [
        [
            3.8297410456395857,
            -1.6619020686546069,
            31.20619762904944
        ],
        [
            1.4048126203089613,
            2.768490938991046,
            34.1162447296961
        ]
    ],
    [
        [
            1.4048126203089613,
            2.768490938991046,
            34.1162447296961
        ],
        [
            2.942427111241262,
            -1.305929487966593,
            37.09437291756479
        ]
    ],
    [
        [
            -2.692464737876784,
            0.4458666875238988,
            34.40458098283368
        ],
        [
            1.5054104131385277,
            2.9724900173056286,
            32.22162151276099
        ]
    ],
    [
        [
            0.8197502460766481,
            1.4655768655366028,
            58.44425342545162
        ],
        [
            0.8219031025143639,
            1.384287791604308,
            60.49325359269882
        ]
    ],
    [
        [
            0.8219031025143639,
            1.384287791604308,
            60.49325359269882
        ],
        [
            -3.511632205484858,
            8.509534334801922,
            63.622339210198426
        ]
    ],
    [
        [
            -3.511632205484858,
            8.509534334801922,
            63.622339210198426
        ],
        [
            -3.5299701716037006,
            8.65660610719942,
            62.99574353330713
        ]
    ],
    [
        [
            1.7930131477314493,
            -0.4107891593135157,
            58.54616181471646
        ],
        [
            1.6316573003029222,
            -0.30004388336357835,
            60.606157103147886
        ]
    ],
    [
        [
            1.632120953390905,
            -0.3003621078964478,
            60.61207653884931
        ],
        [
            0.8219031025143639,
            1.384287791604308,
            60.49325359269882
        ]
    ],
    [
        [
            1.6316573003029222,
            -0.30004388336357835,
            60.606157103147886
        ],
        [
            0.819781841494329,
            1.4643838634400483,
            58.47432464384688
        ]
    ],
    [
        [
            0.8279958884793706,
            1.3716193330501998,
            60.49414713358766
        ],
        [
            1.792975209680951,
            -0.4107631208405481,
            58.5466461616213
        ]
    ],
    [
        [
            -1.259500491684781,
            0.21816345403820137,
            58.54052646559042
        ],
        [
            -0.3122329025204147,
            -1.3045911630016835,
            60.47894957685571
        ]
    ],
    [
        [
            -0.3122329025204147,
            -1.3045911630016835,
            60.47894957685571
        ],
        [
            3.9155085331650277,
            -8.16254422003267,
            63.8864755028298
        ]
    ],
    [
        [
            3.9155085331650277,
            -8.16254422003267,
            63.8864755028298
        ],
        [
            4.35019974882181,
            -8.431218696433284,
            63.25704816822944
        ]
    ],
    [
        [
            -0.31246971265018547,
            -1.5889498814229663,
            58.43788481446408
        ],
        [
            -0.2550883726885808,
            -1.3972871116576082,
            60.52500761278146
        ]
    ],
    [
        [
            -0.2550883726885808,
            -1.3972871116576082,
            60.52500761278146
        ],
        [
            -1.1586221961857692,
            0.3531215730395476,
            60.52654546819159
        ]
    ],
    [
        [
            -1.1586221961857692,
            0.3531215730395476,
            60.52654546819159
        ],
        [
            -0.3099786940405118,
            -1.5926053451206224,
            58.44045943951449
        ]
    ],
    [
        [
            -1.1586221961857692,
            0.3531215730395476,
            60.52654546819159
        ],
        [
            -1.2655326373550946,
            0.22823750370689996,
            58.52657647005299
        ]
    ],
    [
        [
            -1.1586221961857692,
            0.3531215730395476,
            60.52654546819159
        ],
        [
            -4.428217800970454,
            8.003580007453998,
            63.65285111403193
        ]
    ],
    [
        [
            -4.42717128251611,
            8.001131280790649,
            63.65185045922695
        ],
        [
            -4.505464259008917,
            8.070937466615767,
            63.13353642283323
        ]
    ],
    [
        [
            -3.5118741963180393,
            8.511475118229553,
            63.61407055003535
        ],
        [
            -4.425436508229243,
            7.9970721186865195,
            63.65019171138689
        ]
    ],
    [
        [
            -1.1586221961857692,
            0.3531215730395476,
            60.52654546819159
        ],
        [
            0.7792719705700906,
            1.4543823688788562,
            60.52403595682963
        ]
    ],
    [
        [
            -1.1375971904625035,
            0.3123900014517065,
            60.52650968268146
        ],
        [
            1.556383814126959,
            -0.34572109117601557,
            60.60904351708991
        ]
    ],
    [
        [
            0.7052616831525631,
            1.5760708996286543,
            60.577476048912814
        ],
        [
            -0.24242707182004286,
            -1.4178254081258976,
            60.53521252044254
        ]
    ],
    [
        [
            1.632120953390905,
            -0.3003621078964478,
            60.61207653884931
        ],
        [
            4.8060430110648165,
            -7.957107156046931,
            63.921261198320416
        ]
    ],
    [
        [
            4.8060430110648165,
            -7.957107156046931,
            63.921261198320416
        ],
        [
            4.924320530086191,
            -8.065162037529277,
            63.376130069530866
        ]
    ],
    [
        [
            1.632120953390905,
            -0.3003621078964478,
            60.61207653884931
        ],
        [
            2.376248197974022,
            -1.8200238388722054,
            59.3139306124967
        ]
    ],
    [
        [
            2.376248197974022,
            -1.8200238388722054,
            59.3139306124967
        ],
        [
            2.1503008740578755,
            -1.7903893154106054,
            61.313662832034105
        ]
    ],
    [
        [
            2.1503008740578755,
            -1.7903893154106054,
            61.313662832034105
        ],
        [
            3.0031315716822515,
            -3.4088436196269507,
            60.320770084100936
        ]
    ],
    [
        [
            3.0031315716822515,
            -3.4088436196269507,
            60.320770084100936
        ],
        [
            2.8104815273911017,
            -3.3233498224654032,
            61.961875611843254
        ]
    ],
    [
        [
            2.8104815273911017,
            -3.3233498224654032,
            61.961875611843254
        ],
        [
            3.6066645573956313,
            -4.938482442821667,
            61.290106419880374
        ]
    ],
    [
        [
            3.6066645573956313,
            -4.938482442821667,
            61.290106419880374
        ],
        [
            3.5632950468110227,
            -5.0714067953878885,
            62.7010419924957
        ]
    ],
    [
        [
            3.5632950468110227,
            -5.0714067953878885,
            62.7010419924957
        ],
        [
            4.160222271088484,
            -6.341460224960014,
            62.17917730504372
        ]
    ],
    [
        [
            4.160222271088484,
            -6.341460224960014,
            62.17917730504372
        ],
        [
            4.123928730283094,
            -6.373216067362341,
            63.251512407802835
        ]
    ],
    [
        [
            4.123928730283094,
            -6.373216067362341,
            63.251512407802835
        ],
        [
            4.53060868265979,
            -7.280195054927214,
            62.7740561526193
        ]
    ],
    [
        [
            4.53060868265979,
            -7.280195054927214,
            62.7740561526193
        ],
        [
            4.452488765572223,
            -7.136142935563884,
            63.57411624772702
        ]
    ],
    [
        [
            0.8219031025143639,
            1.384287791604308,
            60.49325359269882
        ],
        [
            0.11202974976281155,
            2.7842656669385155,
            59.198947907146675
        ]
    ],
    [
        [
            0.11202974976281155,
            2.7842656669385155,
            59.198947907146675
        ],
        [
            0.012968065077778701,
            2.714347701010611,
            61.0773556736169
        ]
    ],
    [
        [
            0.012968065077778701,
            2.714347701010611,
            61.0773556736169
        ],
        [
            -0.775714757677984,
            4.2915991068360935,
            60.13164915391142
        ]
    ],
    [
        [
            -0.775714757677984,
            4.2915991068360935,
            60.13164915391142
        ],
        [
            -0.8220341710521546,
            4.087267585974925,
            61.680279914901206
        ]
    ],
    [
        [
            -0.8220341710521546,
            4.087267585974925,
            61.680279914901206
        ],
        [
            -1.600612189696614,
            5.59891543165395,
            60.98944327375852
        ]
    ],
    [
        [
            -1.600612189696614,
            5.59891543165395,
            60.98944327375852
        ],
        [
            -1.7454780843450068,
            5.605604251856304,
            62.34706462121673
        ]
    ],
    [
        [
            -1.7454780843450068,
            5.605604251856304,
            62.34706462121673
        ],
        [
            -2.7203260729604866,
            7.373463614127859,
            62.15381104566984
        ]
    ],
    [
        [
            -2.7203260729604866,
            7.373463614127859,
            62.15381104566984
        ],
        [
            -2.682275915372063,
            7.145897576541903,
            63.023491697779534
        ]
    ],
    [
        [
            -2.682275915372063,
            7.145897576541903,
            63.023491697779534
        ],
        [
            -3.5054204429930302,
            8.61769913557261,
            62.97021476811926
        ]
    ],
    [
        [
            -1.823333670720349,
            1.9084660625425636,
            61.16212597626765
        ],
        [
            -1.9110864642019627,
            1.793903664268151,
            59.46987898199501
        ]
    ],
    [
        [
            -1.9110864642019627,
            1.793903664268151,
            59.46987898199501
        ],
        [
            -1.1586221961857692,
            0.3531215730395476,
            60.52654546819159
        ]
    ],
    [
        [
            -1.8791883347968188,
            2.039159223880281,
            61.21553281086006
        ],
        [
            -2.522311123597274,
            3.272746821009809,
            60.33302149574138
        ]
    ],
    [
        [
            -2.522311123597274,
            3.272746821009809,
            60.33302149574138
        ],
        [
            -2.510616866694004,
            3.516625651383897,
            61.819289000563174
        ]
    ],
    [
        [
            -2.510616866694004,
            3.516625651383897,
            61.819289000563174
        ],
        [
            -3.0977854771628315,
            4.665092984681756,
            61.14567912088456
        ]
    ],
    [
        [
            -3.0977854771628315,
            4.665092984681756,
            61.14567912088456
        ],
        [
            -3.103108755789056,
            4.902985042011931,
            62.38581494501998
        ]
    ],
    [
        [
            -3.103108755789056,
            4.902985042011931,
            62.38581494501998
        ],
        [
            -3.87881784253359,
            6.554781744727809,
            62.24861603417979
        ]
    ],
    [
        [
            -3.87881784253359,
            6.554781744727809,
            62.24861603417979
        ],
        [
            -3.762603350593132,
            6.446122663645063,
            63.01640720301054
        ]
    ],
    [
        [
            -3.762603350593132,
            6.446122663645063,
            63.01640720301054
        ],
        [
            -4.462622071918179,
            7.967281839793277,
            63.07303671541555
        ]
    ],
    [
        [
            -2.0895323134331036,
            0.3937653005890477,
            40.726565443506104
        ],
        [
            1.0704084008180281,
            1.8839229005634568,
            43.26970945415122
        ]
    ],
    [
        [
            -1.9872860278609326,
            0.3603400868153554,
            43.59952921524108
        ],
        [
            1.026307833285928,
            1.8008448983568814,
            46.099026870749356
        ]
    ],
    [
        [
            1.026307833285928,
            1.8008448983568814,
            46.099026870749356
        ],
        [
            -1.7936614103704631,
            0.29704248930116406,
            49.04008393322651
        ]
    ],
    [
        [
            -1.8914509272209934,
            0.32901074601840086,
            46.29234852557951
        ],
        [
            0.9842028966109897,
            1.7215263267887924,
            48.80031253045095
        ]
    ],
    [
        [
            2.6011693419817536,
            -1.1624146260763584,
            40.62971850605889
        ],
        [
            -0.556229459409449,
            -2.535392931325858,
            43.36206744356937
        ]
    ],
    [
        [
            -0.556229459409449,
            -2.535392931325858,
            43.36206744356937
        ],
        [
            2.3542461209243637,
            -0.8944130581006429,
            46.58912320164921
        ]
    ],
    [
        [
            2.3542461209243637,
            -0.8944130581006429,
            46.58912320164921
        ],
        [
            -0.4700725832499648,
            -2.1845611708803636,
            49.22818165311636
        ]
    ],
    [
        [
            -0.4692624797593179,
            -2.180740845821881,
            49.28382274456568
        ],
        [
            4.384900961010555,
            -9.737269162796126,
            49.30922032540953
        ]
    ],
    [
        [
            4.384900961010555,
            -9.737269162796126,
            49.30922032540953
        ],
        [
            -0.4262684229411031,
            -1.9779874019411503,
            52.236823533748144
        ]
    ],
    [
        [
            4.384900961010555,
            -9.737269162796126,
            49.30922032540953
        ],
        [
            5.778580708526443,
            -9.00594012100905,
            49.39964955913595
        ]
    ],
    [
        [
            3.3132743243513625,
            -8.00898808335376,
            49.96130661239196
        ],
        [
            5.003990182052164,
            -7.253214863221357,
            49.96947555770387
        ]
    ],
    [
        [
            5.003990182052164,
            -7.253214863221357,
            49.96947555770387
        ],
        [
            2.4121625786566487,
            -6.55570731627374,
            50.50963435295482
        ]
    ],
    [
        [
            2.4121625786566487,
            -6.55570731627374,
            50.50963435295482
        ],
        [
            3.5230247647565895,
            -3.902121086462855,
            51.05894485652963
        ]
    ],
    [
        [
            3.5230247647565895,
            -3.902121086462855,
            51.05894485652963
        ],
        [
            0.5491073361402168,
            -3.551038511441602,
            51.64330603857386
        ]
    ],
    [
        [
            0.5491073361402168,
            -3.551038511441602,
            51.64330603857386
        ],
        [
            2.08789471047189,
            -0.6648935649075765,
            52.26372582042734
        ]
    ],
    [
        [
            -0.4256065817105338,
            -1.9748662591895476,
            52.28228139050374
        ],
        [
            2.0844310777232606,
            -0.6619088942736877,
            52.33751833172837
        ]
    ],
    [
        [
            -0.402798567299477,
            -1.962935780621804,
            52.282783313232564
        ],
        [
            2.835481600386963,
            -2.346364555983344,
            51.56473463423159
        ]
    ],
    [
        [
            2.835481600386963,
            -2.346364555983344,
            51.56473463423159
        ],
        [
            0.5491073361402168,
            -3.551038511441602,
            51.64330603857386
        ]
    ],
    [
        [
            2.6334900508040735,
            -2.4527924329981903,
            51.57167608732795
        ],
        [
            1.5598576303548564,
            -5.181140404931132,
            51.02826308996299
        ]
    ],
    [
        [
            1.5598576303548564,
            -5.181140404931132,
            51.02826308996299
        ],
        [
            4.291923368171585,
            -5.641966794384636,
            50.49330610997445
        ]
    ],
    [
        [
            4.286219314419144,
            -5.6290597954710435,
            50.49750228590777
        ],
        [
            3.3322189712924555,
            -8.03954133179398,
            49.949778768589454
        ]
    ],
    [
        [
            3.040600547721399,
            -2.6676374364457063,
            49.31639668581511
        ],
        [
            1.4680898912433555,
            -5.196638070971152,
            49.293959210728374
        ]
    ],
    [
        [
            1.4680898912433555,
            -5.196638070971152,
            49.293959210728374
        ],
        [
            4.527299841478937,
            -6.109280389034216,
            49.36160226828835
        ]
    ],
    [
        [
            4.527299841478937,
            -6.109280389034216,
            49.36160226828835
        ],
        [
            3.435323880935374,
            -8.259052332585771,
            49.30425202119955
        ]
    ],
    [
        [
            3.435323880935374,
            -8.259052332585771,
            49.30425202119955
        ],
        [
            5.755386212010805,
            -8.952245889897844,
            49.398944291615095
        ]
    ],
    [
        [
            2.460653517233177,
            -6.741772518483937,
            49.299152425839765
        ],
        [
            3.621354378832077,
            -4.012056807883716,
            49.33405547890067
        ]
    ],
    [
        [
            3.621354378832077,
            -4.012056807883716,
            49.33405547890067
        ],
        [
            0.40658430251686895,
            -3.544180930268462,
            49.288405282778726
        ]
    ],
    [
        [
            0.40658430251686895,
            -3.544180930268462,
            49.288405282778726
        ],
        [
            2.2304152758246847,
            -0.7877059347530875,
            49.22733276357504
        ]
    ],
    [
        [
            2.232840491150928,
            -0.7897957836171043,
            49.1756636801712
        ],
        [
            -0.29321874970404105,
            -2.1037743817513954,
            49.06292848837829
        ]
    ],
    [
        [
            -1.7605658721106074,
            0.3146913165981722,
            49.005567292041654
        ],
        [
            0.9801989723104703,
            1.7139836113434324,
            49.057188425527684
        ]
    ],
    [
        [
            -1.6109212711736256,
            0.3910920838758108,
            49.00838578409002
        ],
        [
            -0.08586008982313098,
            3.4127728828145507,
            49.14211710841441
        ]
    ],
    [
        [
            -0.08586008982313098,
            3.4127728828145507,
            49.14211710841441
        ],
        [
            -2.8397060879776257,
            3.7075602869713156,
            49.020680426259986
        ]
    ],
    [
        [
            -2.8397060879776257,
            3.7075602869713156,
            49.020680426259986
        ],
        [
            -1.9396041952050098,
            6.375379836416266,
            49.13089032611512
        ]
    ],
    [
        [
            -1.9396041952050098,
            6.375379836416266,
            49.13089032611512
        ],
        [
            -4.0931152653540686,
            6.8302814847824065,
            48.901101046529575
        ]
    ],
    [
        [
            -4.0931152653540686,
            6.8302814847824065,
            48.901101046529575
        ],
        [
            -3.8037142086057134,
            9.354553322090993,
            49.11960076503621
        ]
    ],
    [
        [
            -2.100079678689563,
            2.1405666866303976,
            48.961297874576445
        ],
        [
            -0.9622563412909768,
            4.81340721048204,
            49.13680941254928
        ]
    ],
    [
        [
            -0.9622563412909768,
            4.81340721048204,
            49.13680941254928
        ],
        [
            -3.5542799163059087,
            5.327640799877077,
            49.08032411301837
        ]
    ],
    [
        [
            -3.5542799163059087,
            5.327640799877077,
            49.08032411301837
        ],
        [
            -2.851732113978315,
            7.833119611224815,
            49.12536622948094
        ]
    ],
    [
        [
            -2.851732113978315,
            7.833119611224815,
            49.12536622948094
        ],
        [
            -4.997166417813119,
            8.688803564099302,
            48.91712732605103
        ]
    ],
    [
        [
            -1.784741331522532,
            0.29494199166582935,
            49.248683336269394
        ],
        [
            -4.997166417813119,
            8.688803564099302,
            48.91712732605103
        ]
    ],
    [
        [
            -4.997166417813119,
            8.688803564099302,
            48.91712732605103
        ],
        [
            -3.8037142086057134,
            9.354553322090993,
            49.11960076503621
        ]
    ],
    [
        [
            -1.6204990928672516,
            0.27093271257584506,
            52.15406985870853
        ],
        [
            -4.997166417813119,
            8.688803564099302,
            48.91712732605103
        ]
    ],
    [
        [
            0.8042010270583559,
            1.831941221987582,
            52.065541940486874
        ],
        [
            -1.618605969489815,
            0.27359802269775596,
            52.21740506993305
        ]
    ],
    [
        [
            0.7807475943978459,
            1.8702299203029031,
            52.050547647092436
        ],
        [
            -2.3134426596397883,
            1.9984080280716485,
            51.48979994753113
        ]
    ],
    [
        [
            -2.3134426596397883,
            1.9984080280716485,
            51.48979994753113
        ],
        [
            -0.8933202569539832,
            4.603214888755453,
            50.9802793887648
        ]
    ],
    [
        [
            -0.8933202569539832,
            4.603214888755453,
            50.9802793887648
        ],
        [
            -3.5938619851095357,
            5.190432435679496,
            50.26236372850233
        ]
    ],
    [
        [
            -3.5938619851095357,
            5.190432435679496,
            50.26236372850233
        ],
        [
            -2.6990636777665733,
            7.551165667439703,
            49.825828053701485
        ]
    ],
    [
        [
            -2.6990636777665733,
            7.551165667439703,
            49.825828053701485
        ],
        [
            -4.296637087491819,
            6.942417301294019,
            49.58866910570427
        ]
    ],
    [
        [
            -1.9135517984950026,
            6.268785053740828,
            50.32802300968537
        ],
        [
            -2.965474747912607,
            3.623892975783434,
            50.86474861848983
        ]
    ],
    [
        [
            -2.965474747912607,
            3.623892975783434,
            50.86474861848983
        ],
        [
            0.027958268230367733,
            3.0991896134036923,
            51.56927293630081
        ]
    ],
    [
        [
            0.027958268230367733,
            3.0991896134036923,
            51.56927293630081
        ],
        [
            -1.6186059694898147,
            0.2735980226977559,
            52.21740506993305
        ]
    ],
    [
        [
            -0.2710873614933849,
            -1.366292401529428,
            60.52503484378361
        ],
        [
            0.6112753791360422,
            -2.944506454063305,
            59.392633704845736
        ]
    ],
    [
        [
            0.6112753791360422,
            -2.944506454063305,
            59.392633704845736
        ],
        [
            0.6266867381037932,
            -2.8276423991474102,
            61.23571132931954
        ]
    ],
    [
        [
            0.6266867381037932,
            -2.8276423991474102,
            61.23571132931954
        ],
        [
            1.46375954798562,
            -4.1954906578563,
            60.27372993097368
        ]
    ],
    [
        [
            1.46375954798562,
            -4.1954906578563,
            60.27372993097368
        ],
        [
            1.4967237781369254,
            -4.238956990920224,
            61.936954254311715
        ]
    ],
    [
        [
            1.4967237781369254,
            -4.238956990920224,
            61.936954254311715
        ],
        [
            2.3925374922999056,
            -5.55843272719286,
            61.23368059228689
        ]
    ],
    [
        [
            2.3925374922999056,
            -5.55843272719286,
            61.23368059228689
        ],
        [
            2.330451031667011,
            -5.591372329950931,
            62.60893178056607
        ]
    ],
    [
        [
            2.330451031667011,
            -5.591372329950931,
            62.60893178056607
        ],
        [
            3.26501697039925,
            -6.83875919555268,
            62.1354432333044
        ]
    ],
    [
        [
            3.26501697039925,
            -6.83875919555268,
            62.1354432333044
        ],
        [
            3.2552932527199414,
            -7.091588138705319,
            63.354347244972864
        ]
    ],
    [
        [
            3.2552932527199414,
            -7.091588138705319,
            63.354347244972864
        ],
        [
            4.332300622669709,
            -8.420155582724675,
            63.28296587454557
        ]
    ],
    [
        [
            -3.2408382690485356,
            5.225255452102347,
            62.51750846524366
        ],
        [
            -2.717855496760321,
            7.209514695528584,
            63.0211888569158
        ]
    ],
    [
        [
            -2.717855496760321,
            7.209514695528584,
            63.0211888569158
        ],
        [
            -4.40339366926198,
            7.9454945403925095,
            63.62911489937599
        ]
    ],
    [
        [
            -3.2064964074807283,
            5.144899647824763,
            62.48467163504025
        ],
        [
            -0.9692383511263454,
            4.32930232220559,
            61.786570610596186
        ]
    ],
    [
        [
            -0.9692383511263454,
            4.32930232220559,
            61.786570610596186
        ],
        [
            -1.8791883347968188,
            2.039159223880281,
            61.21553281086006
        ]
    ],
    [
        [
            -1.8791883347968188,
            2.039159223880281,
            61.21553281086006
        ],
        [
            0.6581654863095244,
            1.4272866821333958,
            60.575375727002616
        ]
    ],
    [
        [
            -1.2165443587411118,
            0.48865243086568766,
            60.5819291931853
        ],
        [
            -0.06571097837637119,
            2.843712651922389,
            61.13416690181125
        ]
    ],
    [
        [
            -0.06571097837637119,
            2.843712651922389,
            61.13416690181125
        ],
        [
            -2.4681406393523675,
            3.4172364146072196,
            61.77867429299572
        ]
    ],
    [
        [
            -2.4681406393523675,
            3.4172364146072196,
            61.77867429299572
        ],
        [
            -1.8639851222231885,
            5.800454830419134,
            62.43263417158191
        ]
    ],
    [
        [
            -1.8639851222231885,
            5.800454830419134,
            62.43263417158191
        ],
        [
            -3.8115378024434,
            6.5524585203788925,
            63.020365860205935
        ]
    ],
    [
        [
            -3.8115378024434,
            6.5524585203788925,
            63.020365860205935
        ],
        [
            -3.4922857938107636,
            8.47772475137712,
            63.608369881644
        ]
    ],
    [
        [
            0.8364021215429003,
            1.4430946919055778,
            58.2826237678849
        ],
        [
            -1.3824648495992744,
            0.237446659727806,
            56.37825777168985
        ]
    ],
    [
        [
            -1.3824648495992744,
            0.237446659727806,
            56.37825777168985
        ],
        [
            0.9359962552046677,
            1.4881416677914507,
            54.26366835670748
        ]
    ],
    [
        [
            0.9359962552046677,
            1.4881416677914507,
            54.26366835670748
        ],
        [
            -1.6168318856416026,
            0.2733701001763872,
            52.24910669692618
        ]
    ],
    [
        [
            0.7807475943978459,
            1.8702299203029031,
            52.050547647092436
        ],
        [
            -1.5068773858212214,
            0.2592438756125638,
            54.21391605079871
        ]
    ],
    [
        [
            -1.5068773858212214,
            0.2592438756125638,
            54.21391605079871
        ],
        [
            0.8613317552782978,
            1.490057900825076,
            56.68323739115331
        ]
    ],
    [
        [
            -0.3038273147623701,
            -1.6016322321757563,
            58.446817278481475
        ],
        [
            1.8862080861000539,
            -0.5905511379484722,
            58.55755579210034
        ]
    ],
    [
        [
            1.8862080861000539,
            -0.5905511379484722,
            58.55755579210034
        ],
        [
            -0.3667843092362318,
            -1.677033149130424,
            56.53476355996063
        ]
    ],
    [
        [
            -0.3667843092362318,
            -1.677033149130424,
            56.53476355996063
        ],
        [
            1.9897235375431936,
            -0.5802978129328223,
            54.355257432906285
        ]
    ],
    [
        [
            1.9897235375431936,
            -0.5802978129328223,
            54.355257432906285
        ],
        [
            -0.39361106566157156,
            -1.9581299571333288,
            52.282985497246045
        ]
    ],
    [
        [
            2.0822726132558977,
            -0.6600489091142969,
            52.38350430228595
        ],
        [
            -0.3967300959715432,
            -1.838689136953604,
            54.265631915823995
        ]
    ],
    [
        [
            -0.3967300959715432,
            -1.838689136953604,
            54.265631915823995
        ],
        [
            1.8903228370353522,
            -0.4946425563496536,
            56.472984064997185
        ]
    ],
    [
        [
            1.8903228370353522,
            -0.4946425563496536,
            56.472984064997185
        ],
        [
            -0.2837632350380666,
            -1.5923691802295077,
            58.447831812933714
        ]
    ],
    [
        [
            1.8569579514598389,
            -0.5341310987241609,
            58.553979681869464
        ],
        [
            0.6125498715971541,
            -2.946376717459346,
            59.39395097329334
        ]
    ],
    [
        [
            0.6125498715971541,
            -2.946376717459346,
            59.39395097329334
        ],
        [
            2.9863513882061143,
            -3.3769991278091194,
            60.34030610986649
        ]
    ],
    [
        [
            2.9863513882061143,
            -3.3769991278091194,
            60.34030610986649
        ],
        [
            2.4192537768049585,
            -5.597637736647714,
            61.26129355955797
        ]
    ],
    [
        [
            2.4192537768049585,
            -5.597637736647714,
            61.26129355955797
        ],
        [
            4.157229653829,
            -6.335092976727358,
            62.18179360600516
        ]
    ],
    [
        [
            4.157229653829,
            -6.335092976727358,
            62.18179360600516
        ],
        [
            4.336949075471284,
            -8.4117738977416,
            63.243352760491184
        ]
    ],
    [
        [
            -0.28376323503806655,
            -1.592369180229508,
            58.447831812933714
        ],
        [
            2.439089885596016,
            -1.9792944792135225,
            59.41486085600559
        ]
    ],
    [
        [
            2.439089885596016,
            -1.9792944792135225,
            59.41486085600559
        ],
        [
            1.464726017953359,
            -4.1967650363362825,
            60.322493586328015
        ]
    ],
    [
        [
            1.464726017953359,
            -4.1967650363362825,
            60.322493586328015
        ],
        [
            3.6066036529891328,
            -4.938669110337465,
            61.292087816315316
        ]
    ],
    [
        [
            3.6066036529891328,
            -4.938669110337465,
            61.292087816315316
        ],
        [
            3.264926059204502,
            -6.841123001459727,
            62.14683928815072
        ]
    ],
    [
        [
            3.264926059204502,
            -6.841123001459727,
            62.14683928815072
        ],
        [
            4.868630572314036,
            -8.150512585553235,
            63.4109764849941
        ]
    ],
    [
        [
            0.16261761000200636,
            -2.2861202897159885,
            58.928917565998894
        ],
        [
            2.1517613179085533,
            -1.2510676174651598,
            58.95338148775249
        ]
    ],
    [
        [
            -1.6525750886441362,
            1.1684416957314525,
            59.104821461652556
        ],
        [
            0.46614260034059907,
            2.1244505945736156,
            58.82133129773615
        ]
    ],
    [
        [
            -1.2654092191225752,
            0.2282216477512939,
            58.52878186681336
        ],
        [
            0.10928640724458327,
            2.7893773106962416,
            59.201873335293364
        ]
    ],
    [
        [
            0.10928640724458327,
            2.7893773106962416,
            59.201873335293364
        ],
        [
            -2.519333673473663,
            3.267035710149613,
            60.337107237173726
        ]
    ],
    [
        [
            -2.519333673473663,
            3.267035710149613,
            60.337107237173726
        ],
        [
            -1.600612189696614,
            5.59891543165395,
            60.98944327375852
        ]
    ],
    [
        [
            -1.600612189696614,
            5.59891543165395,
            60.98944327375852
        ],
        [
            -3.8690768120566053,
            6.534039172160476,
            62.250338920755105
        ]
    ],
    [
        [
            -3.8690768120566053,
            6.534039172160476,
            62.250338920755105
        ],
        [
            -3.5299701716037006,
            8.65660610719942,
            62.99574353330713
        ]
    ],
    [
        [
            0.8280926581588693,
            1.4385796451237272,
            58.275492083236394
        ],
        [
            -1.9107353938657345,
            1.7943619910983928,
            59.47664911087284
        ]
    ],
    [
        [
            -1.9107353938657345,
            1.7943619910983928,
            59.47664911087284
        ],
        [
            -0.7762534944082228,
            4.289222546180106,
            60.14966113229688
        ]
    ],
    [
        [
            -0.7762534944082228,
            4.289222546180106,
            60.14966113229688
        ],
        [
            -3.0946329188206407,
            4.65746544665803,
            61.14122722731256
        ]
    ],
    [
        [
            3.040600547721399,
            -2.6676374364457063,
            49.31639668581511
        ],
        [
            2.8234483782787514,
            -2.344939761531448,
            51.567402852789435
        ]
    ],
    [
        [
            3.6007906319571066,
            -4.009063971417099,
            49.33376347074595
        ],
        [
            3.525330455522787,
            -3.9073383493965457,
            51.057248679648644
        ]
    ],
    [
        [
            3.5276719030242387,
            -3.9126365218312875,
            51.05552619839563
        ],
        [
            3.0206313510465836,
            -2.637962331870846,
            49.52339800189638
        ]
    ],
    [
        [
            3.5279974863184522,
            -3.9133732440655233,
            51.05528668368508
        ],
        [
            4.391735931165451,
            -6.068838129965117,
            49.35860477627651
        ]
    ],
    [
        [
            4.391735931165451,
            -6.068838129965117,
            49.35860477627651
        ],
        [
            4.291923368171585,
            -5.641966794384636,
            50.49330610997445
        ]
    ],
    [
        [
            5.003990182052164,
            -7.253214863221357,
            49.96947555770387
        ],
        [
            4.382783597978218,
            -6.066167414896529,
            49.35840682870215
        ]
    ],
    [
        [
            -0.10563224357284984,
            3.444372238958981,
            49.141997362832974
        ],
        [
            0.027958268230367733,
            3.0991896134036923,
            51.56927293630081
        ]
    ],
    [
        [
            0.027958268230367733,
            3.0991896134036923,
            51.56927293630081
        ],
        [
            -0.9568077004137785,
            4.804699330411861,
            49.13684241101157
        ]
    ],
    [
        [
            -0.9568077004137785,
            4.804699330411861,
            49.13684241101157
        ],
        [
            -0.9069101678030813,
            4.606169938117779,
            50.97666662851066
        ]
    ],
    [
        [
            -0.9069101678030813,
            4.606169938117779,
            50.97666662851066
        ],
        [
            -1.938701794206824,
            6.3739376419599765,
            49.130895791302855
        ]
    ],
    [
        [
            -1.938701794206824,
            6.3739376419599765,
            49.130895791302855
        ],
        [
            -1.8618577828062528,
            6.184392436247924,
            50.361072126596895
        ]
    ],
    [
        [
            -1.8618577828062528,
            6.184392436247924,
            50.361072126596895
        ],
        [
            -2.817793054787455,
            7.778879065042833,
            49.125571773724005
        ]
    ],
    [
        [
            -4.296637087491819,
            6.942417301294019,
            49.58866910570427
        ],
        [
            -4.316904719882983,
            6.91132319581855,
            48.98733747832279
        ]
    ],
    [
        [
            -4.316904719882983,
            6.91132319581855,
            48.98733747832279
        ],
        [
            -3.578985723401661,
            5.1533466236170495,
            50.27662441799739
        ]
    ],
    [
        [
            -3.578985723401661,
            5.1533466236170495,
            50.27662441799739
        ],
        [
            -3.017178345555328,
            3.7069466023821627,
            49.118043816009376
        ]
    ],
    [
        [
            -3.017178345555328,
            3.7069466023821627,
            49.118043816009376
        ],
        [
            -2.3134426596397883,
            1.9984080280716485,
            51.48979994753113
        ]
    ],
    [
        [
            -2.3134426596397883,
            1.9984080280716485,
            51.48979994753113
        ],
        [
            -1.828400656280883,
            0.4090210187321637,
            49.244177235383965
        ]
    ],
    [
        [
            3.4054175265220303,
            -8.212496789753441,
            49.304095547470716
        ],
        [
            3.3132743243513625,
            -8.00898808335376,
            49.96130661239196
        ]
    ],
    [
        [
            3.3132743243513625,
            -8.00898808335376,
            49.96130661239196
        ],
        [
            2.460653517233177,
            -6.741772518483937,
            49.299152425839765
        ]
    ],
    [
        [
            2.460653517233177,
            -6.741772518483937,
            49.299152425839765
        ],
        [
            2.4658962614160855,
            -6.5701680192930665,
            50.498435798967
        ]
    ],
    [
        [
            2.4658962614160855,
            -6.5701680192930665,
            50.498435798967
        ],
        [
            1.6261165658262262,
            -5.243781559961177,
            49.2974533832823
        ]
    ],
    [
        [
            1.6261165658262262,
            -5.243781559961177,
            49.2974533832823
        ],
        [
            1.6379938525077589,
            -5.19431989495652,
            51.01296348832748
        ]
    ],
    [
        [
            1.6379938525077589,
            -5.19431989495652,
            51.01296348832748
        ],
        [
            0.39367707413059316,
            -3.524088109335536,
            49.28833775057046
        ]
    ],
    [
        [
            0.39367707413059316,
            -3.524088109335536,
            49.28833775057046
        ],
        [
            0.5491073361402168,
            -3.551038511441602,
            51.64330603857386
        ]
    ],
    [
        [
            0.5491073361402168,
            -3.551038511441602,
            51.64330603857386
        ],
        [
            -0.4667940445888829,
            -2.16910008035706,
            49.453364573036545
        ]
    ],
    [
        [
            -3.7751874241700816,
            5.4814278210274034,
            38.95928022995312
        ],
        [
            -3.204343218813002,
            3.643809585062056,
            38.47955088789998
        ]
    ],
    [
        [
            -3.204343218813002,
            3.643809585062056,
            38.47955088789998
        ],
        [
            -3.1416314446427274,
            3.567696690666987,
            39.59767198591845
        ]
    ],
    [
        [
            -3.1416314446427274,
            3.567696690666987,
            39.59767198591845
        ],
        [
            -2.611713783338218,
            2.1586005338664167,
            38.483907181528025
        ]
    ],
    [
        [
            -2.611713783338218,
            2.1586005338664167,
            38.483907181528025
        ],
        [
            -2.0895323134331036,
            0.3937653005890477,
            40.726565443506104
        ]
    ],
    [
        [
            -0.6303280127324766,
            -2.8391009747476836,
            38.460642104595664
        ],
        [
            0.4787264977830321,
            -4.107581234768672,
            40.14164061068951
        ]
    ],
    [
        [
            0.4787264977830321,
            -4.107581234768672,
            40.14164061068951
        ],
        [
            1.4238023731335319,
            -5.4491601738700535,
            38.51394522231296
        ]
    ],
    [
        [
            1.4238023731335319,
            -5.4491601738700535,
            38.51394522231296
        ],
        [
            2.391254638792601,
            -6.618527711398883,
            39.214575067920784
        ]
    ],
    [
        [
            4.018584161477747,
            -4.8845105645350335,
            38.67292841036111
        ],
        [
            4.108851601895614,
            -5.207345090129241,
            39.4839994356438
        ]
    ],
    [
        [
            4.108851601895614,
            -5.207345090129241,
            39.4839994356438
        ],
        [
            3.080842793689424,
            -2.2880875342372797,
            38.52567938784324
        ]
    ],
    [
        [
            3.080842793689424,
            -2.2880875342372797,
            38.52567938784324
        ],
        [
            3.107647979725407,
            -2.4433197712920007,
            40.26300975474593
        ]
    ],
    [
        [
            0.27456528882209497,
            3.4248952528716567,
            38.462333253477475
        ],
        [
            1.144728806091545,
            1.901167599154162,
            40.58431148421179
        ]
    ],
    [
        [
            0.27635849884726016,
            3.42175519511235,
            38.46670617024658
        ],
        [
            -0.0026884629389329062,
            3.4113049743984147,
            39.996125108950224
        ]
    ],
    [
        [
            -0.0026884629389329062,
            3.4113049743984147,
            39.996125108950224
        ],
        [
            -0.7937633400751498,
            4.782629542712331,
            38.408251060545794
        ]
    ],
    [
        [
            -0.7937633400751498,
            4.782629542712331,
            38.408251060545794
        ],
        [
            -1.674961615830989,
            5.771822170458272,
            39.05397874902274
        ]
    ],
    [
        [
            5.248857788287108,
            1.250306730042845,
            6.442095766617122
        ],
        [
            -2.0522765418386975,
            3.571668700106253,
            6.249400954027945
        ]
    ],
    [
        [
            -2.0522765418386975,
            3.571668700106253,
            6.249400954027945
        ],
        [
            -4.481638029818607,
            -3.453443001239455,
            6.3207581907325485
        ]
    ],
    [
        [
            -4.484094959560476,
            -3.449589220541645,
            6.318273982287105
        ],
        [
            3.304613889556744,
            -5.731999499754101,
            6.507938939356615
        ]
    ],
    [
        [
            3.304613889556744,
            -5.731999499754101,
            6.507938939356615
        ],
        [
            5.264990913770966,
            1.2191462475816843,
            6.443864928026054
        ]
    ],
    [
        [
            3.2993424631112,
            -5.735600570682765,
            6.501543010132728
        ],
        [
            7.523334060406356,
            -3.142752634468418,
            6.691515239005833
        ]
    ],
    [
        [
            4.80416648339442,
            -7.952749799019594,
            63.91941868868086
        ],
        [
            3.905779464538461,
            -8.146762390196425,
            63.87863395100244
        ]
    ],
    [
        [
            3.905779464538461,
            -8.146762390196425,
            63.87863395100244
        ],
        [
            4.452488765572223,
            -7.136142935563884,
            63.57411624772702
        ]
    ],
    [
        [
            4.452488765572223,
            -7.136142935563884,
            63.57411624772702
        ],
        [
            3.2558022010279837,
            -7.0783548397670435,
            63.290548690257026
        ]
    ],
    [
        [
            3.2558022010279837,
            -7.0783548397670435,
            63.290548690257026
        ],
        [
            4.123928730283094,
            -6.373216067362341,
            63.251512407802835
        ]
    ],
    [
        [
            4.123928730283094,
            -6.373216067362341,
            63.251512407802835
        ],
        [
            2.334140905301988,
            -5.589414689419893,
            62.52719893496053
        ]
    ],
    [
        [
            2.334140905301988,
            -5.589414689419893,
            62.52719893496053
        ],
        [
            3.5632950468110227,
            -5.0714067953878885,
            62.7010419924957
        ]
    ],
    [
        [
            3.5632950468110227,
            -5.0714067953878885,
            62.7010419924957
        ],
        [
            1.5036331285228222,
            -4.250164866643441,
            61.9425231356943
        ]
    ],
    [
        [
            1.5036331285228222,
            -4.250164866643441,
            61.9425231356943
        ],
        [
            2.818330812771007,
            -3.3268331604246644,
            61.89501081732329
        ]
    ],
    [
        [
            2.818330812771007,
            -3.3268331604246644,
            61.89501081732329
        ],
        [
            0.6266867381037932,
            -2.8276423991474102,
            61.23571132931954
        ]
    ],
    [
        [
            0.6266867381037932,
            -2.8276423991474102,
            61.23571132931954
        ],
        [
            2.1503008740578755,
            -1.7903893154106054,
            61.313662832034105
        ]
    ],
    [
        [
            -0.24008411847216676,
            -1.4216259868318049,
            60.53710092218084
        ],
        [
            1.632120953390905,
            -0.3003621078964478,
            60.61207653884931
        ]
    ]
]

export class PoleTowerPrimitive extends BasePrimitive<PoleTowerParams, PoleTowerObject> {

    constructor(tp: TopoInstance, params?: PoleTowerObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PoleTower;
    }

    setDefault(): Primitive<PoleTowerParams, PoleTowerObject> {

        const { nodeList, memberList } = organizeNodes(this.tp, nodes);

        this.params = {
            heights: [{
                value: 18.0,
                bodyId: "body1",
                legId: "leg1"
            }],
            bodies: [{
                id: "body1",
                height: 30.0,
                nodes: nodeList,
                legs: [{
                    id: "leg1",
                    commonHeight: 10.0,
                    specificHeight: 8.0,
                    nodes: []
                }]
            }],
            members: memberList,
            attachments: []
        };
        return this;
    }

    public setParams(params: PoleTowerParams): Primitive<PoleTowerParams, PoleTowerObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        // 基础验证
        if (!this.params.heights || this.params.heights.length === 0) return false;
        if (!this.params.bodies || this.params.bodies.length === 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPoleTower(this.params), false);
        }
        throw new Error("Invalid parameters for PoleTower");
    }

    fromObject(o?: PoleTowerObject): Primitive<PoleTowerParams, PoleTowerObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let getMemberType=(type:string):any => {
            if(type=='ANGLE'){
                return this.tp.MemberType.ANGLE;
            }else if(type=='TUBE'){
                return this.tp.MemberType.TUBE;
            }else {
                return this.tp.MemberType.TAPERED_TUBE;
            }
        }

        let getAttachmentType=(type:string):any => {
            if(type=='GROUND_WIRE'){
                return this.tp.AttachmentType.GROUND_WIRE;
            }else if(type=='CONDUCTOR'){
                return this.tp.AttachmentType.CONDUCTOR;
            }else {
                return this.tp.AttachmentType.JUMPER;
            }
        }
        
        this.params = {
            heights: o['heights']?.map((h: any) => ({
                value: h.value,
                bodyId: h.bodyId,
                legId: h.legId
            })) || [],
            bodies: o['bodies']?.map((b: any) => ({
                id: b.id,
                height: b.height,
                nodes: b.nodes?.map((n: any) => ({
                    id: n.id,
                    position: new this.tp.gp_Pnt_3(n.position[0], n.position[1], n.position.z)
                })) || [],
                legs: b.legs?.map((l: any) => ({
                    id: l.id,
                    commonHeight: l.commonHeight,
                    specificHeight: l.specificHeight,
                    nodes: l.nodes?.map((n: any) => ({
                        id: n.id,
                        position: new this.tp.gp_Pnt_3(n.position[0], n.position[1], n.position.z)
                    })) || []
                })) || []
            })) || [],
            members: o['members']?.map((m: any) => ({
                id: m.id,
                startNodeId: m.startNodeId,
                endNodeId: m.endNodeId,
                type: getMemberType(m.type),
                specification: m.specification,
                material: m.material,
                xDirection: new this.tp.gp_Dir_4(m.xDirection[0], m.xDirection[1], m.xDirection.z),
                yDirection: new this.tp.gp_Dir_4(m.yDirection[0], m.yDirection[1], m.yDirection.z),
                end1Diameter: m.end1Diameter,
                end2Diameter: m.end2Diameter,
                thickness: m.thickness,
                sides: m.sides
            })) || [],
            attachments: o['attachments']?.map((a: any) => ({
                name: a.name,
                type:getAttachmentType(a.type),
                position: new this.tp.gp_Pnt_3(a.position[0], a.position[1], a.position.z)
            })) || []
        };
        return this;
    }

    toObject(): PoleTowerObject | undefined {

     let getMemberType=(type:any) => {
            if(type==this.tp.MemberType.ANGLE){
                return 'ANGLE';
            }else if(type==this.tp.MemberType.TUBE){
                return 'TUBE';
            }else if(type==this.tp.MemberType.TAPERED_TUBE){
                return 'TAPERED_TUBE';
            }
        }

    let getAttachmentType=(type:any) => {
            if(type==this.tp.AttachmentType.GROUND_WIRE){
                return 'GROUND_WIRE';
            }else if(type==this.tp.AttachmentType.CONDUCTOR){
                return 'CONDUCTOR';
            }else if(type==this.tp.AttachmentType.JUMPER){
                return 'JUMPER';
            }
    }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['heights', this.params.heights.map(h => ({
                value: h.value,
                bodyId: h.bodyId,
                legId: h.legId
            }))],
            ['bodies', this.params.bodies.map(b => ({
                id: b.id,
                height: b.height,
                nodes: b.nodes.map(n => ({
                    id: n.id,
                    position: [
                        n.position.X(),
                        n.position.Y(),
                        n.position.Z()
                    ]
                })),
                legs: b.legs.map(l => ({
                    id: l.id,
                    commonHeight: l.commonHeight,
                    specificHeight: l.specificHeight,
                    nodes: l.nodes.map(n => ({
                        id: n.id,
                        position: [
                            n.position.X(),
                            n.position.Y(),
                            n.position.Z()
                        ]
                    }))
                }))
            }))],
            ['members', this.params.members.map(m => ({
                id: m.id,
                startNodeId: m.startNodeId,
                endNodeId: m.endNodeId,
                type: getMemberType(m.type),
                specification: m.specification,
                material: m.material,
                xDirection: [
                    m.xDirection.X(),
                    m.xDirection.Y(),
                    m.xDirection.Z()
                ],
                yDirection: [
                    m.yDirection.X(),
                    m.yDirection.Y(),
                    m.yDirection.Z()
                ],
                end1Diameter: m.end1Diameter,
                end2Diameter: m.end2Diameter,
                thickness: m.thickness,
                sides: m.sides
            }))],
            ['attachments', this.params.attachments.map(a => ({
                name: a.name,
                type: getAttachmentType(a.type),
                position: [
                    a.position.X(),
                    a.position.Y(),
                    a.position.Z()
                ]
            }))]
        ])) as PoleTowerObject;
    }
}


export class TripleHookAnchorPrimitive extends BasePrimitive<TripleHookAnchorParams, TripleHookAnchorObject> {

    constructor(tp: TopoInstance, params?: TripleHookAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.TripleHookAnchor;
    }

    setDefault(): Primitive<TripleHookAnchorParams, TripleHookAnchorObject> {
        this.params = {
            boltDiameter: 24.0,
            exposedLength: 20.0,
            nutCount: 2,
            nutHeight: 10.0,
            nutOD: 60.0,
            washerCount: 2,
            washerShape: this.tp.WasherShapeType.ROUND as any,
            washerSize: 65.0,
            washerThickness: 1.5,
            anchorLength: 150.0,
            hookStraightLengthA: 60.0,
            hookStraightLengthB: 25.0,
            hookDiameter: 60.0,
            anchorBarDiameter: 10.0
        };
        return this;
    }

    public setParams(params: TripleHookAnchorParams): Primitive<TripleHookAnchorParams, TripleHookAnchorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.boltDiameter <= 0) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.nutCount < 0) return false;
        if (this.params.nutHeight <= 0) return false;
        if (this.params.nutOD <= this.params.boltDiameter) return false;
        if (this.params.washerCount < 0) return false;
        if (this.params.washerSize <= 0) return false;
        if (this.params.washerThickness <= 0) return false;
        if (this.params.anchorLength <= 0) return false;
        if (this.params.hookStraightLengthA <= 0) return false;
        if (this.params.hookStraightLengthB <= 0) return false;
        if (this.params.hookDiameter <= 0) return false;
        if (this.params.anchorBarDiameter <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTripleHookAnchor(this.params), false);
        }
        throw new Error("Invalid parameters for TripleHookAnchor");
    }

    fromObject(o?: TripleHookAnchorObject): Primitive<TripleHookAnchorParams, TripleHookAnchorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let washerShape: WasherShapeType = this.tp.WasherShapeType.ROUND as any;
        if (o['washerShape'] === 'SQUARE') {
            washerShape = this.tp.WasherShapeType.SQUARE as any;
        }
        this.params = {
            boltDiameter: o['boltDiameter'],
            exposedLength: o['exposedLength'],
            nutCount: o['nutCount'],
            nutHeight: o['nutHeight'],
            nutOD: o['nutOD'],
            washerCount: o['washerCount'],
            washerShape: washerShape,
            washerSize: o['washerSize'],
            washerThickness: o['washerThickness'],
            anchorLength: o['anchorLength'],
            hookStraightLengthA: o['hookStraightLengthA'],
            hookStraightLengthB: o['hookStraightLengthB'],
            hookDiameter: o['hookDiameter'],
            anchorBarDiameter: o['anchorBarDiameter']
        };
        return this;
    }

    toObject(): TripleHookAnchorObject | undefined {
        let washerShape: string = 'ROUND';
        if (this.params.washerShape === this.tp.WasherShapeType.SQUARE as any) {
            washerShape = 'SQUARE';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['hookStraightLengthA', this.params.hookStraightLengthA],
            ['hookStraightLengthB', this.params.hookStraightLengthB],
            ['hookDiameter', this.params.hookDiameter],
            ['anchorBarDiameter', this.params.anchorBarDiameter]
        ])) as TripleHookAnchorObject;
    }
}

export class SingleHookAnchorPrimitive extends BasePrimitive<SingleHookAnchorParams, SingleHookAnchorObject> {

    constructor(tp: TopoInstance, params?: SingleHookAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.SingleHookAnchor;
    }

    setDefault(): Primitive<SingleHookAnchorParams, SingleHookAnchorObject> {
        this.params = {
            boltDiameter: 24.0,
            exposedLength: 20.0,
            nutCount: 2,
            nutHeight: 7.5,
            nutOD: 60.0,
            washerCount: 2,
            washerShape: this.tp.WasherShapeType.ROUND as any,
            washerSize: 65.0,
            washerThickness: 1.5,
            anchorLength: 150.0,
            hookStraightLength: 60.0,
            hookDiameter: 60.0
        };
        return this;
    }

    public setParams(params: SingleHookAnchorParams): Primitive<SingleHookAnchorParams, SingleHookAnchorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.boltDiameter <= 0) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.nutCount < 0) return false;
        if (this.params.nutHeight <= 0) return false;
        if (this.params.nutOD <= this.params.boltDiameter) return false;
        if (this.params.washerCount < 0) return false;
        if (this.params.washerSize <= 0) return false;
        if (this.params.washerThickness <= 0) return false;
        if (this.params.anchorLength <= 0) return false;
        if (this.params.hookStraightLength <= 0) return false;
        if (this.params.hookDiameter <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSingleHookAnchor(this.params), false);
        }
        throw new Error("Invalid parameters for SingleHookAnchor");
    }

    fromObject(o: any): Primitive<SingleHookAnchorParams, SingleHookAnchorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            boltDiameter: o['boltDiameter'],
            exposedLength: o['exposedLength'],
            nutCount: o['nutCount'],
            nutHeight: o['nutHeight'],
            nutOD: o['nutOD'],
            washerCount: o['washerCount'],
            washerShape: o['washerShape'],
            washerSize: o['washerSize'],
            washerThickness: o['washerThickness'],
            anchorLength: o['anchorLength'],
            hookStraightLength: o['hookStraightLength'],
            hookDiameter: o['hookDiameter']
        };
        return this;
    }

    toObject(): SingleHookAnchorObject | undefined {
        let washerShape: string = 'ROUND';
        if (this.params.washerShape === this.tp.WasherShapeType.SQUARE as any) {
            washerShape = 'SQUARE';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['hookStraightLength', this.params.hookStraightLength],
            ['hookDiameter', this.params.hookDiameter]
        ])) as SingleHookAnchorObject;
    }
}

export class RibbedAnchorPrimitive extends BasePrimitive<RibbedAnchorParams, RibbedAnchorObject> {

    constructor(tp: TopoInstance, params?: RibbedAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.RibbedAnchor;
    }

    setDefault(): Primitive<RibbedAnchorParams, RibbedAnchorObject> {
        this.params = {
            boltDiameter: 20.0,
            exposedLength: 40.0,
            nutCount: 0,
            nutHeight: 10.0,
            nutOD: 60.0,
            washerCount: 0,
            washerShape: this.tp.WasherShapeType.ROUND as any,
            washerSize: 65.0,
            washerThickness: 1.5,
            anchorLength: 150.0,
            basePlateSize: 60.0,
            ribTopWidth: 10.0,
            ribBottomWidth: 20.0,
            basePlateThickness: 3.0,
            ribHeight: 20.0,
            ribThickness: 2.5
        };
        return this;
    }

    public setParams(params: RibbedAnchorParams): Primitive<RibbedAnchorParams, RibbedAnchorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.boltDiameter <= 0) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.nutCount < 0) return false;
        if (this.params.washerCount < 0) return false;
        if (this.params.anchorLength <= 0) return false;
        if (this.params.basePlateSize <= 0) return false;
        if (this.params.ribTopWidth <= 0 || this.params.ribBottomWidth <= 0) return false;
        if (this.params.basePlateThickness <= 0 || this.params.ribThickness <= 0) return false;
        if (this.params.ribHeight <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRibbedAnchor(this.params), false);
        }
        throw new Error("Invalid parameters for RibbedAnchor");
    }

    fromObject(o?: RibbedAnchorObject): Primitive<RibbedAnchorParams, RibbedAnchorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let washerShape: WasherShapeType = this.tp.WasherShapeType.ROUND as any;
        if (o['washerShape'] === 'SQUARE') {
            washerShape = this.tp.WasherShapeType.SQUARE as any;
        }
        this.params = {
            boltDiameter: o['boltDiameter'],
            exposedLength: o['exposedLength'],
            nutCount: o['nutCount'],
            nutHeight: o['nutHeight'],
            nutOD: o['nutOD'],
            washerCount: o['washerCount'],
            washerShape: washerShape,
            washerSize: o['washerSize'],
            washerThickness: o['washerThickness'],
            anchorLength: o['anchorLength'],
            basePlateSize: o['basePlateSize'],
            ribTopWidth: o['ribTopWidth'],
            ribBottomWidth: o['ribBottomWidth'],
            basePlateThickness: o['basePlateThickness'],
            ribHeight: o['ribHeight'],
            ribThickness: o['ribThickness']
        };
        return this;
    }

    toObject(): RibbedAnchorObject | undefined {
        let washerShape: string = 'ROUND';
        if (this.params.washerShape === this.tp.WasherShapeType.SQUARE as any) {
            washerShape = 'SQUARE';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['basePlateSize', this.params.basePlateSize],
            ['ribTopWidth', this.params.ribTopWidth],
            ['ribBottomWidth', this.params.ribBottomWidth],
            ['basePlateThickness', this.params.basePlateThickness],
            ['ribHeight', this.params.ribHeight],
            ['ribThickness', this.params.ribThickness]
        ])) as RibbedAnchorObject;
    }
}

export class NutAnchorPrimitive extends BasePrimitive<NutAnchorParams, NutAnchorObject> {

    constructor(tp: TopoInstance, params?: NutAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.NutAnchor;
    }

    setDefault(): Primitive<NutAnchorParams, NutAnchorObject> {
        this.params = {
            boltDiameter: 20.0,
            exposedLength: 40.0,
            nutCount: 2,
            nutHeight: 10.0,
            nutOD: 60.0,
            washerCount: 2,
            washerShape: this.tp.WasherShapeType.ROUND as any,
            washerSize: 65.0,
            washerThickness: 1.5,
            anchorLength: 150.0,
            basePlateSize: 60.0,
            basePlateThickness: 3.0,
            boltToPlateDistance: 140.0
        };
        return this;
    }

    public setParams(params: NutAnchorParams): Primitive<NutAnchorParams, NutAnchorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.boltDiameter <= 0) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.nutCount < 0) return false;
        if (this.params.nutHeight <= 0) return false;
        if (this.params.nutOD <= this.params.boltDiameter) return false;
        if (this.params.washerCount < 0) return false;
        if (this.params.washerSize <= 0) return false;
        if (this.params.washerThickness <= 0) return false;
        if (this.params.anchorLength <= 0) return false;
        if (this.params.basePlateSize <= 0) return false;
        if (this.params.basePlateThickness <= 0) return false;
        if (this.params.boltToPlateDistance < 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createNutAnchor(this.params), false);
        }
        throw new Error("Invalid parameters for NutAnchor");
    }

    fromObject(o: any): Primitive<NutAnchorParams, NutAnchorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let washerShape: WasherShapeType = this.tp.WasherShapeType.ROUND as any;
        if (o['washerShape'] === 'SQUARE') {
            washerShape = this.tp.WasherShapeType.SQUARE as any;
        }
        this.params = {
            boltDiameter: o['boltDiameter'],
            exposedLength: o['exposedLength'],
            nutCount: o['nutCount'],
            nutHeight: o['nutHeight'],
            nutOD: o['nutOD'],
            washerCount: o['washerCount'],
            washerShape: washerShape,
            washerSize: o['washerSize'],
            washerThickness: o['washerThickness'],
            anchorLength: o['anchorLength'],
            basePlateSize: o['basePlateSize'],
            basePlateThickness: o['basePlateThickness'],
            boltToPlateDistance: o['boltToPlateDistance']
        };
        return this;
    }

    toObject(): NutAnchorObject | undefined {
        let washerShape: string = 'ROUND';
        if (this.params.washerShape === this.tp.WasherShapeType.SQUARE as any) {
            washerShape = 'SQUARE';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['basePlateSize', this.params.basePlateSize],
            ['basePlateThickness', this.params.basePlateThickness],
            ['boltToPlateDistance', this.params.boltToPlateDistance]
        ])) as NutAnchorObject;
    }
}


export class TripleArmAnchorPrimitive extends BasePrimitive<TripleArmAnchorParams, TripleArmAnchorObject> {

    constructor(tp: TopoInstance, params?: TripleArmAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.TripleArmAnchor;
    }

    setDefault(): Primitive<TripleArmAnchorParams, TripleArmAnchorObject> {
        this.params = {
            boltDiameter: 20.0,
            exposedLength: 40.0,
            nutCount: 2,
            nutHeight: 10.0,
            nutOD: 60.0,
            washerCount: 2,
            washerShape: this.tp.WasherShapeType.ROUND as any,
            washerSize: 65.0,
            washerThickness: 1.5,
            anchorLength: 150.0,
            armDiameter: 12.0,
            armStraightLength: 60.0,
            armBendLength: 40.0,
            armBendAngle: Math.PI / 4
        };
        return this;
    }

    public setParams(params: TripleArmAnchorParams): Primitive<TripleArmAnchorParams, TripleArmAnchorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.boltDiameter <= 0) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.nutCount < 0) return false;
        if (this.params.nutHeight <= 0) return false;
        if (this.params.nutOD <= this.params.boltDiameter) return false;
        if (this.params.washerCount < 0) return false;
        if (this.params.washerSize <= 0) return false;
        if (this.params.washerThickness <= 0) return false;
        if (this.params.anchorLength <= 0) return false;
        if (this.params.armDiameter <= 0) return false;
        if (this.params.armStraightLength <= 0) return false;
        if (this.params.armBendLength <= 0) return false;
        if (this.params.armBendAngle <= 0 || this.params.armBendAngle >= Math.PI) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTripleArmAnchor(this.params), false);
        }
        throw new Error("Invalid parameters for TripleArmAnchor");
    }

    fromObject(o?: TripleArmAnchorObject): Primitive<TripleArmAnchorParams, TripleArmAnchorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let washerShape: WasherShapeType = this.tp.WasherShapeType.ROUND as any;
        if (o['washerShape'] === 'SQUARE') {
            washerShape = this.tp.WasherShapeType.SQUARE as any;
        }
        this.params = {
            boltDiameter: o['boltDiameter'],
            exposedLength: o['exposedLength'],
            nutCount: o['nutCount'],
            nutHeight: o['nutHeight'],
            nutOD: o['nutOD'],
            washerCount: o['washerCount'],
            washerShape: washerShape,
            washerSize: o['washerSize'],
            washerThickness: o['washerThickness'],
            anchorLength: o['anchorLength'],
            armDiameter: o['armDiameter'],
            armStraightLength: o['armStraightLength'],
            armBendLength: o['armBendLength'],
            armBendAngle: o['armBendAngle']
        };
        return this;
    }

    toObject(): TripleArmAnchorObject | undefined {
        let washerShape: string = 'ROUND';
        if (this.params.washerShape === this.tp.WasherShapeType.SQUARE as any) {
            washerShape = 'SQUARE';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['armDiameter', this.params.armDiameter],
            ['armStraightLength', this.params.armStraightLength],
            ['armBendLength', this.params.armBendLength],
            ['armBendAngle', this.params.armBendAngle]
        ])) as TripleArmAnchorObject;
    }
}

export class PositioningPlateAnchorPrimitive extends BasePrimitive<PositioningPlateAnchorParams, PositioningPlateAnchorObject> {

    constructor(tp: TopoInstance, params?: PositioningPlateAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PositioningPlateAnchor;
    }

    setDefault(): Primitive<PositioningPlateAnchorParams, PositioningPlateAnchorObject> {
        this.params = {
            boltDiameter: 20.0,
            exposedLength: 40.0,
            nutCount: 2,
            nutHeight: 10.0,
            nutOD: 60.0,
            washerCount: 2,
            washerShape: this.tp.WasherShapeType.ROUND as any,
            washerSize: 65.0,
            washerThickness: 1.5,
            anchorLength: 150.0,
            plateLength: 60.0,
            plateThickness: 3.0,
            toBaseDistance: 20.0,
            toBottomDistance: 20.0,
            groutHoleDiameter: 30.0
        };
        return this;
    }

    public setParams(params: PositioningPlateAnchorParams): Primitive<PositioningPlateAnchorParams, PositioningPlateAnchorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.boltDiameter <= 0) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.nutCount < 0) return false;
        if (this.params.nutHeight <= 0) return false;
        if (this.params.nutOD <= this.params.boltDiameter) return false;
        if (this.params.washerCount < 0) return false;
        if (this.params.washerSize <= 0) return false;
        if (this.params.washerThickness <= 0) return false;
        if (this.params.anchorLength <= 0) return false;
        if (this.params.plateLength <= 0) return false;
        if (this.params.plateThickness <= 0) return false;
        if (this.params.toBaseDistance < 0) return false;
        if (this.params.toBottomDistance < 0) return false;
        if (this.params.groutHoleDiameter <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPositioningPlateAnchor(this.params), false);
        }
        throw new Error("Invalid parameters for PositioningPlateAnchor");
    }

    fromObject(o?: PositioningPlateAnchorObject): Primitive<PositioningPlateAnchorParams, PositioningPlateAnchorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let washerShape: WasherShapeType = this.tp.WasherShapeType.ROUND as any;
        if (o['washerShape'] === 'SQUARE') {
            washerShape = this.tp.WasherShapeType.SQUARE as any;
        }
        this.params = {
            boltDiameter: o['boltDiameter'],
            exposedLength: o['exposedLength'],
            nutCount: o['nutCount'],
            nutHeight: o['nutHeight'],
            nutOD: o['nutOD'],
            washerCount: o['washerCount'],
            washerShape: washerShape,
            washerSize: o['washerSize'],
            washerThickness: o['washerThickness'],
            anchorLength: o['anchorLength'],
            plateLength: o['plateLength'],
            plateThickness: o['plateThickness'],
            toBaseDistance: o['toBaseDistance'],
            toBottomDistance: o['toBottomDistance'],
            groutHoleDiameter: o['groutHoleDiameter']
        };
        return this;
    }

    toObject(): PositioningPlateAnchorObject | undefined {
        let washerShape: string = 'ROUND';
        if (this.params.washerShape === this.tp.WasherShapeType.SQUARE as any) {
            washerShape = 'SQUARE';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['plateLength', this.params.plateLength],
            ['plateThickness', this.params.plateThickness],
            ['toBaseDistance', this.params.toBaseDistance],
            ['toBottomDistance', this.params.toBottomDistance],
            ['groutHoleDiameter', this.params.groutHoleDiameter]
        ])) as PositioningPlateAnchorObject;
    }
}

export class StubAnglePrimitive extends BasePrimitive<StubAngleParams, StubAngleObject> {

    constructor(tp: TopoInstance, params?: StubAngleObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.StubAngle;
    }

    setDefault(): Primitive<StubAngleParams, StubAngleObject> {
        this.params = {
            legWidth: 50,
            thickness: 5,
            slope: 0.1,
            exposedLength: 30.0,
            anchorLength: 70.0
        };
        return this;
    }

    public setParams(params: StubAngleParams): Primitive<StubAngleParams, StubAngleObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.legWidth <= 0) return false;
        if (this.params.thickness <= 0) return false;
        if (this.params.thickness >= this.params.legWidth) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.anchorLength <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createStubAngle(this.params), false);
        }
        throw new Error("Invalid parameters for StubAngle");
    }

    fromObject(o?: StubAngleObject): Primitive<StubAngleParams, StubAngleObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            legWidth: o['legWidth'],
            thickness: o['thickness'],
            slope: o['slope'],
            exposedLength: o['exposedLength'],
            anchorLength: o['anchorLength']
        };
        return this;
    }

    toObject(): StubAngleObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['legWidth', this.params.legWidth],
            ['thickness', this.params.thickness],
            ['slope', this.params.slope],
            ['exposedLength', this.params.exposedLength],
            ['anchorLength', this.params.anchorLength]
        ])) as StubAngleObject;
    }
}

export class StubTubePrimitive extends BasePrimitive<StubTubeParams, StubTubeObject> {

    constructor(tp: TopoInstance, params?: StubTubeObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.StubTube;
    }

    setDefault(): Primitive<StubTubeParams, StubTubeObject> {
        this.params = {
            diameter: 18.0,
            thickness: 3.0,
            slope: 0.1,
            exposedLength: 40.0,
            anchorLength: 60.0
        };
        return this;
    }

    public setParams(params: StubTubeParams): Primitive<StubTubeParams, StubTubeObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.diameter <= 0) return false;
        if (this.params.thickness <= 0) return false;
        if (this.params.thickness >= this.params.diameter / 2) return false;
        if (this.params.exposedLength < 0) return false;
        if (this.params.anchorLength <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createStubTube(this.params), false);
        }
        throw new Error("Invalid parameters for StubTube");
    }

    fromObject(o?: StubTubeObject): Primitive<StubTubeParams, StubTubeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            diameter: o['diameter'],
            thickness: o['thickness'],
            slope: o['slope'],
            exposedLength: o['exposedLength'],
            anchorLength: o['anchorLength']
        };
        return this;
    }

    toObject(): StubTubeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['diameter', this.params.diameter],
            ['thickness', this.params.thickness],
            ['slope', this.params.slope],
            ['exposedLength', this.params.exposedLength],
            ['anchorLength', this.params.anchorLength]
        ])) as StubTubeObject;
    }
}

export function createGTPrimitive(tp: TopoInstance, args?: GTPrimitiveType | any): GTPrimitive | undefined {
    if (args === undefined) {
        return undefined;
    }
    let type: GTPrimitiveType | undefined = undefined;
    let obj: any = undefined;
    if (args && args['type'] !== undefined) {
        type = args['type'];
        obj = args;
    } else if (typeof args === 'string') {
        type = args as GTPrimitiveType;
    }
    let primitive: GTPrimitive | undefined = undefined;

    switch (type) {
        case GTPrimitiveType.BoredPileBase:
            primitive = new BoredPileBasePrimitive(tp);
            break;
        case GTPrimitiveType.PileCapBase:
            primitive = new PileCapBasePrimitive(tp);
            break;
        case GTPrimitiveType.RockAnchorBase:
            primitive = new RockAnchorBasePrimitive(tp);
            break;
        case GTPrimitiveType.RockPileCapBase:
            primitive = new RockPileCapBasePrimitive(tp);
            break;
        case GTPrimitiveType.EmbeddedRockAnchorBase:
            primitive = new EmbeddedRockAnchorBasePrimitive(tp);
            break;
        case GTPrimitiveType.InclinedRockAnchorBase:
            primitive = new InclinedRockAnchorBasePrimitive(tp);
            break;
        case GTPrimitiveType.ExcavatedBase:
            primitive = new ExcavatedBasePrimitive(tp);
            break;
        case GTPrimitiveType.StepBase:
            primitive = new StepBasePrimitive(tp);
            break;
        case GTPrimitiveType.StepPlateBase:
            primitive = new StepPlateBasePrimitive(tp);
            break;
        case GTPrimitiveType.SlopedBaseBase:
            primitive = new SlopedBaseBasePrimitive(tp);
            break;
        case GTPrimitiveType.CompositeCaissonBase:
            primitive = new CompositeCaissonBasePrimitive(tp);
            break;
        case GTPrimitiveType.RaftBase:
            primitive = new RaftBasePrimitive(tp);
            break;
        case GTPrimitiveType.DirectBuriedBase:
            primitive = new DirectBuriedBasePrimitive(tp);
            break;
        case GTPrimitiveType.SteelSleeveBase:
            primitive = new SteelSleeveBasePrimitive(tp);
            break;
        case GTPrimitiveType.PrecastColumnBase:
            primitive = new PrecastColumnBasePrimitive(tp);
            break;
        case GTPrimitiveType.PrecastPinnedBase:
            primitive = new PrecastPinnedBasePrimitive(tp);
            break;
        case GTPrimitiveType.PrecastMetalSupportBase:
            primitive = new PrecastMetalSupportBasePrimitive(tp);
            break;
        case GTPrimitiveType.PrecastConcreteSupportBase:
            primitive = new PrecastConcreteSupportBasePrimitive(tp);
            break;
        case GTPrimitiveType.TransmissionLine:
            primitive = new TransmissionLinePrimitive(tp);
            break;
        case GTPrimitiveType.Insulator:
            primitive = new InsulatorPrimitive(tp);
            break;
        case GTPrimitiveType.PoleTower:
            primitive = new PoleTowerPrimitive(tp);
            break;
        case GTPrimitiveType.SingleHookAnchor:
            primitive = new SingleHookAnchorPrimitive(tp);
            break;
        case GTPrimitiveType.TripleHookAnchor:
            primitive = new TripleHookAnchorPrimitive(tp);
            break;
        case GTPrimitiveType.RibbedAnchor:
            primitive = new RibbedAnchorPrimitive(tp);
            break;
        case GTPrimitiveType.NutAnchor:
            primitive = new NutAnchorPrimitive(tp);
            break;
        case GTPrimitiveType.TripleArmAnchor:
            primitive = new TripleArmAnchorPrimitive(tp);
            break;
        case GTPrimitiveType.PositioningPlateAnchor:
            primitive = new PositioningPlateAnchorPrimitive(tp);
            break;
        case GTPrimitiveType.StubAngle:
            primitive = new StubAnglePrimitive(tp);
            break;
        case GTPrimitiveType.StubTube:
            primitive = new StubTubePrimitive(tp);
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