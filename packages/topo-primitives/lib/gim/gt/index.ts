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
    StringType
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
            H1: 10.0,  // 上部圆柱高度
            H2: 3.0,   // 过渡段高度
            H3: 5.0,   // 底部圆柱高度
            H4: 0.3,    // 桩头高度
            d: 0.5,     // 上部直径
            D: 2.0     // 底部直径
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
            H1: 10.0,
            H2: 3.0,
            H3: 5.0,
            H4: 4.0,
            H5: 2.0,
            H6: 0.3,
            d: 0.5,
            D: 2.0,
            b: 1.5,
            B1: 20.0,
            L1: 30.0,
            e1: 1.0,
            e2: 0.5,
            cs: 0,
            ZCOUNT: 3,
            ZPOSTARRAY: [
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Pnt_3(10, 0, 0),
                new this.tp.gp_Pnt_3(0, 10, 0)
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
            ZPOSTARRAY: o['ZPOSTARRAY'].map((p: any) =>
                new this.tp.gp_Pnt_3(p.x, p.y, p.z))
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
                ({ x: p.X(), y: p.Y(), z: p.Z() }))]
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
            H1: 2.0,
            H2: 5.0,
            d: 0.5,
            B1: 10.0,
            L1: 15.0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                new this.tp.gp_Pnt_3(-4, -6, 0),
                new this.tp.gp_Pnt_3(4, -6, 0),
                new this.tp.gp_Pnt_3(4, 6, 0),
                new this.tp.gp_Pnt_3(-4, 6, 0)
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

    fromObject(o: any): Primitive<RockAnchorParams, RockAnchorBaseObject> {
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
            ZPOSTARRAY: o['ZPOSTARRAY'].map((p: any) =>
                new this.tp.gp_Pnt_3(p.x, p.y, p.z))
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
                ({ x: p.X(), y: p.Y(), z: p.Z() }))]
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
            H1: 4.0,
            H2: 2.0,
            H3: 5.0,
            d: 0.5,
            b: 1.5,
            B1: 20.0,
            L1: 30.0,
            e1: 1.0,
            e2: 0.5,
            cs: 0,
            ZCOUNT: 4,
            ZPOSTARRAY: [
                new this.tp.gp_Pnt_3(-5, -5, 0),
                new this.tp.gp_Pnt_3(5, -5, 0),
                new this.tp.gp_Pnt_3(5, 5, 0),
                new this.tp.gp_Pnt_3(-5, 5, 0)
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
                new this.tp.gp_Pnt_3(p.x, p.y, p.z))
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
                ({ x: p.X(), y: p.Y(), z: p.Z() }))]
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
            H1: 10.0,
            H2: 3.0,
            H3: 5.0,
            d: 0.5,
            D: 2.0
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
            H1: 2.0,
            H2: 5.0,
            d: 0.5,
            D: 1.5,
            B: 10.0,
            L: 15.0,
            e1: 1.0,
            e2: 0.5,
            alpha1: 1.5,
            alpha2: 1.0
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
            H1: 10.0,
            H2: 3.0,
            H3: 5.0,
            d: 0.5,
            D: 2.0,
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
            H: 15.0,
            H1: 5.0,
            H2: 5.0,
            H3: 5.0,
            b: 3.0,
            B1: 10.0,
            B2: 15.0,
            B3: 20.0,
            L1: 10.0,
            L2: 15.0,
            L3: 20.0,
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
            H: 15.0,
            H1: 5.0,
            H2: 5.0,
            H3: 5.0,
            b: 3.0,
            L1: 10.0,
            L2: 15.0,
            B1: 20.0,
            B2: 30.0,
            alpha1: 1.5,
            alpha2: 1.0,
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
            H1: 10.0,
            H2: 3.0,
            H3: 5.0,
            b: 1.5,
            L1: 20.0,
            L2: 15.0,
            B1: 10.0,
            B2: 8.0,
            alpha1: 1.5,
            alpha2: 1.0
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
            H1: 10.0,
            H2: 3.0,
            H3: 5.0,
            H4: 20.0,
            b: 1.5,
            D: 20.0,
            t: 1.5,
            B1: 20.0,
            B2: 25.0,
            L1: 30.0,
            L2: 35.0
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
            H1: 10.0,
            H2: 10.0,
            H3: 5.0,
            b1: 3.0,
            b2: 3.0,
            B1: 50.0,
            B2: 40.0,
            L1: 80.0,
            L2: 60.0
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
            H1: 50.0,
            H2: 10.0,
            d: 30.0,
            D: 60.0,
            B: 0,
            t: 2.0
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
            H1: 50.0,
            H2: 10.0,
            H3: 15.0,
            H4: 5.0,
            d: 30.0,
            D1: 60.0,
            D2: 40.0,
            t: 2.0,
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
        if (this.valid() && args && args.length === 2) {
            const start = new this.tp.gp_Pnt_3(args[0].x, args[0].y, args[0].z);
            const end = new this.tp.gp_Pnt_3(args[1].x, args[1].y, args[1].z);
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
                leftUpper: 0.7,
                rightUpper: 0.7,
                leftLower: 1,
                rightLower: 1
            },
            multiLink: {
                count: 1,
                spacing: 0,
                arrangement: this.tp.ArrangementType.VERTICAL as any
            },
            insulator: {
                radius: 0.475,
                height: 10.146,
                leftCount: 20,
                rightCount: 20,
                material: this.tp.InsulatorMaterial.CERAMIC as any
            },
            gradingRing: {
                count: 1,
                position: 0.5,
                height: 0.03,
                radius: 0.15
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

export class PoleTowerPrimitive extends BasePrimitive<PoleTowerParams, PoleTowerObject> {

    constructor(tp: TopoInstance, params?: PoleTowerObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.PoleTower;
    }

    setDefault(): Primitive<PoleTowerParams, PoleTowerObject> {
        this.params = {
            heights: [{
                value: 18.0,
                bodyId: "body1",
                legId: "leg1"
            }],
            bodies: [{
                id: "body1",
                height: 30.0,
                nodes: [
                    { id: "node1", position: new this.tp.gp_Pnt_3(0, 0, 0) },
                    { id: "node2", position: new this.tp.gp_Pnt_3(10, 0, 30) },
                    { id: "node3", position: new this.tp.gp_Pnt_3(20, 0, 0) },
                    { id: "node4", position: new this.tp.gp_Pnt_3(30, 0, 30) },
                    { id: "node5", position: new this.tp.gp_Pnt_3(40, 0, 0) },
                    { id: "node6", position: new this.tp.gp_Pnt_3(50, 0, 30) }
                ],
                legs: [{
                    id: "leg1",
                    commonHeight: 10.0,
                    specificHeight: 8.0,
                    nodes: []
                }]
            }],
            members: [{
                id: "member1",
                startNodeId: "node1",
                endNodeId: "node2",
                type: this.tp.MemberType.ANGLE as any,
                specification: "L5x1",
                material: "Q345",
                xDirection: new this.tp.gp_Dir_4(1, 0, 0),
                yDirection: new this.tp.gp_Dir_4(0, 1, 0),
                end1Diameter: 0.0,
                end2Diameter: 0.0,
                thickness: 0.0,
                sides: 0
            }],
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
                    position: new this.tp.gp_Pnt_3(n.position.x, n.position.y, n.position.z)
                })) || [],
                legs: b.legs?.map((l: any) => ({
                    id: l.id,
                    commonHeight: l.commonHeight,
                    specificHeight: l.specificHeight,
                    nodes: l.nodes?.map((n: any) => ({
                        id: n.id,
                        position: new this.tp.gp_Pnt_3(n.position.x, n.position.y, n.position.z)
                    })) || []
                })) || []
            })) || [],
            members: o['members']?.map((m: any) => ({
                id: m.id,
                startNodeId: m.startNodeId,
                endNodeId: m.endNodeId,
                type: m.type,
                specification: m.specification,
                material: m.material,
                xDirection: new this.tp.gp_Dir_4(m.xDirection.x, m.xDirection.y, m.xDirection.z),
                yDirection: new this.tp.gp_Dir_4(m.yDirection.x, m.yDirection.y, m.yDirection.z),
                end1Diameter: m.end1Diameter,
                end2Diameter: m.end2Diameter,
                thickness: m.thickness,
                sides: m.sides
            })) || [],
            attachments: o['attachments']?.map((a: any) => ({
                name: a.name,
                type: a.type,
                position: new this.tp.gp_Pnt_3(a.position.x, a.position.y, a.position.z)
            })) || []
        };
        return this;
    }

    toObject(): PoleTowerObject | undefined {
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
                    position: {
                        x: n.position.X(),
                        y: n.position.Y(),
                        z: n.position.Z()
                    }
                })),
                legs: b.legs.map(l => ({
                    id: l.id,
                    commonHeight: l.commonHeight,
                    specificHeight: l.specificHeight,
                    nodes: l.nodes.map(n => ({
                        id: n.id,
                        position: {
                            x: n.position.X(),
                            y: n.position.Y(),
                            z: n.position.Z()
                        }
                    }))
                }))
            }))],
            ['members', this.params.members.map(m => ({
                id: m.id,
                startNodeId: m.startNodeId,
                endNodeId: m.endNodeId,
                type: m.type,
                specification: m.specification,
                material: m.material,
                xDirection: {
                    x: m.xDirection.X(),
                    y: m.xDirection.Y(),
                    z: m.xDirection.Z()
                },
                yDirection: {
                    x: m.yDirection.X(),
                    y: m.yDirection.Y(),
                    z: m.yDirection.Z()
                },
                end1Diameter: m.end1Diameter,
                end2Diameter: m.end2Diameter,
                thickness: m.thickness,
                sides: m.sides
            }))],
            ['attachments', this.params.attachments.map(a => ({
                name: a.name,
                type: a.type,
                position: {
                    x: a.position.X(),
                    y: a.position.Y(),
                    z: a.position.Z()
                }
            }))]
        ])) as PoleTowerObject;
    }
}


export class TripleHookAnchorPrimitive extends BasePrimitive<TripleHookAnchorParams, SingleHookAnchorObject> {

    constructor(tp: TopoInstance, params?: SingleHookAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.TripleHookAnchor;
    }

    setDefault(): Primitive<TripleHookAnchorParams, SingleHookAnchorObject> {
        this.params = {
            boltDiameter: 0.24,
            exposedLength: 0.2,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: 2,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            hookStraightLengthA: 0.6,
            hookStraightLengthB: 0.25,
            hookDiameter: 0.6,
            anchorBarDiameter: 0.1
        };
        return this;
    }

    public setParams(params: TripleHookAnchorParams): Primitive<TripleHookAnchorParams, SingleHookAnchorObject> {
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
        if (this.params.washerShape !== 1 && this.params.washerShape !== 2) return false;
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

    fromObject(o?: SingleHookAnchorObject): Primitive<TripleHookAnchorParams, SingleHookAnchorObject> {
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
            hookStraightLengthA: o['hookStraightLengthA'],
            hookStraightLengthB: o['hookStraightLengthB'],
            hookDiameter: o['hookDiameter'],
            anchorBarDiameter: o['anchorBarDiameter']
        };
        return this;
    }

    toObject(): SingleHookAnchorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', this.params.washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['hookStraightLengthA', this.params.hookStraightLengthA],
            ['hookStraightLengthB', this.params.hookStraightLengthB],
            ['hookDiameter', this.params.hookDiameter],
            ['anchorBarDiameter', this.params.anchorBarDiameter]
        ])) as SingleHookAnchorObject;
    }
}

export class SingleHookAnchorPrimitive extends BasePrimitive<SingleHookAnchorParams, TripleHookAnchorObject> {

    constructor(tp: TopoInstance, params?: TripleHookAnchorObject) {
        super(tp, params);
    }

    getType(): string {
        return GTPrimitiveType.SingleHookAnchor;
    }

    setDefault(): Primitive<SingleHookAnchorParams, TripleHookAnchorObject> {
        this.params = {
            boltDiameter: 0.24,
            exposedLength: 0.2,
            nutCount: 2,
            nutHeight: 0.075,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: 2,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            hookStraightLength: 0.6,
            hookDiameter: 0.6
        };
        return this;
    }

    public setParams(params: SingleHookAnchorParams): Primitive<SingleHookAnchorParams, TripleHookAnchorObject> {
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
        if (this.params.washerShape !== 1 && this.params.washerShape !== 2) return false;
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

    fromObject(o: any): Primitive<SingleHookAnchorParams, TripleHookAnchorObject> {
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

    toObject(): TripleHookAnchorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', this.params.washerShape],
            ['washerSize', this.params.washerSize],
            ['washerThickness', this.params.washerThickness],
            ['anchorLength', this.params.anchorLength],
            ['hookStraightLength', this.params.hookStraightLength],
            ['hookDiameter', this.params.hookDiameter]
        ])) as TripleHookAnchorObject;
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
            boltDiameter: 0.2,
            exposedLength: 0.4,
            nutCount: 0,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 0,
            washerShape: 2,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            basePlateSize: 0.6,
            ribTopWidth: 0.1,
            ribBottomWidth: 0.2,
            basePlateThickness: 0.03,
            ribHeight: 0.2,
            ribThickness: 0.025
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
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', this.params.washerShape],
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
            boltDiameter: 0.2,
            exposedLength: 0.4,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: 2,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            basePlateSize: 0.6,
            basePlateThickness: 0.03,
            boltToPlateDistance: 1.4
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
        if (this.params.washerShape !== 1 && this.params.washerShape !== 2) return false;
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
            basePlateSize: o['basePlateSize'],
            basePlateThickness: o['basePlateThickness'],
            boltToPlateDistance: o['boltToPlateDistance']
        };
        return this;
    }

    toObject(): NutAnchorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', this.params.washerShape],
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
            boltDiameter: 0.2,
            exposedLength: 0.4,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: 2,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            armDiameter: 0.12,
            armStraightLength: 0.6,
            armBendLength: 0.4,
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
        if (this.params.washerShape !== 1 && this.params.washerShape !== 2) return false;
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
            armDiameter: o['armDiameter'],
            armStraightLength: o['armStraightLength'],
            armBendLength: o['armBendLength'],
            armBendAngle: o['armBendAngle']
        };
        return this;
    }

    toObject(): TripleArmAnchorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', this.params.washerShape],
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
            boltDiameter: 0.2,
            exposedLength: 0.4,
            nutCount: 2,
            nutHeight: 0.1,
            nutOD: 0.6,
            washerCount: 2,
            washerShape: 2,
            washerSize: 0.65,
            washerThickness: 0.015,
            anchorLength: 1.5,
            plateLength: 0.6,
            plateThickness: 0.03,
            toBaseDistance: 0.2,
            toBottomDistance: 0.2,
            groutHoleDiameter: 0.3
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
        if (this.params.washerShape !== 1 && this.params.washerShape !== 2) return false;
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
            plateLength: o['plateLength'],
            plateThickness: o['plateThickness'],
            toBaseDistance: o['toBaseDistance'],
            toBottomDistance: o['toBottomDistance'],
            groutHoleDiameter: o['groutHoleDiameter']
        };
        return this;
    }

    toObject(): PositioningPlateAnchorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['boltDiameter', this.params.boltDiameter],
            ['exposedLength', this.params.exposedLength],
            ['nutCount', this.params.nutCount],
            ['nutHeight', this.params.nutHeight],
            ['nutOD', this.params.nutOD],
            ['washerCount', this.params.washerCount],
            ['washerShape', this.params.washerShape],
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
            legWidth: 0.1,
            thickness: 0.01,
            slope: 0.1,
            exposedLength: 2.0,
            anchorLength: 5.0
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
            diameter: 0.6,
            thickness: 0.1,
            slope: 0.1,
            exposedLength: 2.0,
            anchorLength: 10.0
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