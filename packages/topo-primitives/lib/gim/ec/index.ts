import {
    Shape,
    TopoInstance,
    CableWireParams,
    CableJointParams,
    OpticalFiberBoxParams,
    CableTerminalParams,
    CableAccessoryParams,
    CableBracketParams,
    CableClampParams,
    CablePoleParams,
    GroundFlatIronParams,
    EmbeddedPartParams,
    UShapedRingParams,
    LiftingEyeParams,
    CornerWellParams,
    TunnelWellParams,
    ThreeWayWellParams,
    FourWayWellParams,
    PipeRowParams,
    CableTrenchParams,
    CableTunnelParams,
    CableTrayParams,
    CableLBeamParams,
    ManholeParams,
    ManholeCoverParams,
    LadderParams,
    SumpParams,
    FootpathParams,
    ShaftChamberParams,
    TunnelCompartmentPartitionParams,
    VentilationPavilionParams,
    TunnelPartitionBoardParams,
    StraightVentilationDuctParams,
    ObliqueVentilationDuctParams,
    DrainageWellParams,
    PipeSupportParams,
    CoverPlateParams,
    CableRayParams,
    CableClampType,
    TunnelWellType,
    ConnectionSectionStyle,
    ThreeWayWellType,
    CornerStyle,
    ShaftStyle,
    FourWayWellType,
    CableTrayStyle,
    ManholeStyle,
    ManholeCoverStyle
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../../primitive";
import {
    CableAccessoryObject,
    CableBracketObject,
    CableClampObject,
    CableJointObject,
    CableLBeamObject,
    CablePoleObject,
    CableRayObject,
    CableTerminalObject,
    CableTrayObject,
    CableTrenchObject,
    CableTunnelObject,
    CableWireObject,
    CornerWellObject,
    CoverPlateObject,
    DrainageWellObject,
    EmbeddedPartObject,
    FootpathObject,
    FourWayWellObject,
    GroundFlatIronObject,
    LadderObject,
    LiftingEyeObject,
    ManholeCoverObject,
    ManholeObject,
    ObliqueVentilationDuctObject,
    OpticalFiberBoxObject,
    PipeRowObject,
    PipeSupportObject,
    ShaftChamberObject,
    StraightVentilationDuctObject,
    SumpObject,
    ThreeWayWellObject,
    TunnelCompartmentPartitionObject,
    TunnelPartitionBoardObject,
    TunnelWellObject,
    UShapedRingObject,
    VentilationPavilionObject,
} from "../../types/gim-ec";

export enum ECPrimitiveType {
    CableWire = "GIM/EC/CableWire",
    CableJoint = "GIM/EC/CableJoint",
    OpticalFiberBox = "GIM/EC/OpticalFiberBox",
    CableTerminal = "GIM/EC/CableTerminal",
    CableAccessory = "GIM/EC/CableAccessory",
    CableBracket = "GIM/EC/CableBracket",
    CableClamp = "GIM/EC/CableClamp",
    CablePole = "GIM/EC/CablePole",
    GroundFlatIron = "GIM/EC/GroundFlatIron",
    EmbeddedPart = "GIM/EC/EmbeddedPart",
    UShapedRing = "GIM/EC/UShapedRing",
    LiftingEye = "GIM/EC/LiftingEye",
    CornerWell = "GIM/EC/CornerWell",
    TunnelWell = "GIM/EC/TunnelWell",
    ThreeWayWell = "GIM/EC/ThreeWayWell",
    FourWayWell = "GIM/EC/FourWayWell",
    PipeRow = "GIM/EC/PipeRow",
    CableTrench = "GIM/EC/CableTrench",
    CableTunnel = "GIM/EC/CableTunnel",
    CableTray = "GIM/EC/CableTray",
    CableLBeam = "GIM/EC/CableLBeam",
    Manhole = "GIM/EC/Manhole",
    ManholeCover = "GIM/EC/ManholeCover",
    Ladder = "GIM/EC/Ladder",
    Sump = "GIM/EC/Sump",
    Footpath = "GIM/EC/Footpath",
    ShaftChamber = "GIM/EC/ShaftChamber",
    TunnelCompartmentPartition = "GIM/EC/TunnelCompartmentPartition",
    VentilationPavilion = "GIM/EC/VentilationPavilion",
    TunnelPartitionBoard = "GIM/EC/TunnelPartitionBoard",
    StraightVentilationDuct = "GIM/EC/StraightVentilationDuct",
    ObliqueVentilationDuct = "GIM/EC/ObliqueVentilationDuct",
    DrainageWell = "GIM/EC/DrainageWell",
    PipeSupport = "GIM/EC/PipeSupport",
    CoverPlate = "GIM/EC/CoverPlate",
    CableRay = "GIM/EC/CableRay"
}

export type ECPrimitive = CableWirePrimitive
    | CableJointPrimitive
    | OpticalFiberBoxPrimitive
    | CableTerminalPrimitive
    | CableAccessoryPrimitive
    | CableBracketPrimitive
    | CableClampPrimitive
    | CablePolePrimitive
    | GroundFlatIronPrimitive
    | EmbeddedPartPrimitive
    | UShapedRingPrimitive
    | LiftingEyePrimitive
    | CornerWellPrimitive
    | TunnelWellPrimitive
    | ThreeWayWellPrimitive
    | FourWayWellPrimitive
    | PipeRowPrimitive
    | CableTrenchPrimitive
    | CableTunnelPrimitive
    | CableTrayPrimitive
    | CableLBeamPrimitive
    | ManholePrimitive
    | ManholeCoverPrimitive
    | LadderPrimitive
    | SumpPrimitive
    | FootpathPrimitive
    | ShaftChamberPrimitive
    | TunnelCompartmentPartitionPrimitive
    | VentilationPavilionPrimitive
    | TunnelPartitionBoardPrimitive
    | StraightVentilationDuctPrimitive
    | ObliqueVentilationDuctPrimitive
    | DrainageWellPrimitive
    | PipeSupportPrimitive
    | CoverPlatePrimitive
    | CableRayPrimitive;

export class CableWirePrimitive extends BasePrimitive<CableWireParams, CableWireObject> {

    constructor(tp: TopoInstance, params?: CableWireObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableWire;
    }

    setDefault(): Primitive<CableWireParams, CableWireObject> {
        this.params = {
            points: [
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Pnt_3(100, 0, 0)
            ],
            outsideDiameter: 10.0
        };
        return this;
    }

    public setParams(params: CableWireParams): Primitive<CableWireParams, CableWireObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.points.length < 2) return false;
        if (this.params.outsideDiameter <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableWire(this.params), false);
        }
        throw new Error("Invalid parameters for CableWire");
    }

    fromObject(o?: CableWireObject): Primitive<CableWireParams, CableWireObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            points: o['points'].map((p: any) =>
                new this.tp.gp_Pnt_3(p[0], p[1], p[2])),
            outsideDiameter: o['outsideDiameter']
        };
        return this;
    }

    toObject(): CableWireObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['points', this.params.points.map(p =>
                ([p.X(), p.Y(), p.Z()]))],
            ['outsideDiameter', this.params.outsideDiameter]
        ])) as CableWireObject;
    }
}


export class CableJointPrimitive extends BasePrimitive<CableJointParams, CableJointObject> {

    constructor(tp: TopoInstance, params?: CableJointObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableJoint;
    }

    setDefault(): Primitive<CableJointParams, CableJointObject> {
        this.params = {
            length: 100.0,
            outerDiameter: 30.0,
            terminalLength: 20.0,
            innerDiameter: 20.0
        };
        return this;
    }

    public setParams(params: CableJointParams): Primitive<CableJointParams, CableJointObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.outerDiameter <= 0 ||
            this.params.terminalLength <= 0 || this.params.innerDiameter <= 0) return false;
        if (this.params.innerDiameter >= this.params.outerDiameter) return false;
        return this.params.terminalLength * 2 < this.params.length;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableJoint(this.params), false);
        }
        throw new Error("Invalid parameters for CableJoint");
    }

    fromObject(o?: CableJointObject): Primitive<CableJointParams, CableJointObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            outerDiameter: o['outerDiameter'],
            terminalLength: o['terminalLength'],
            innerDiameter: o['innerDiameter']
        };
        return this;
    }

    toObject(): CableJointObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['outerDiameter', this.params.outerDiameter],
            ['terminalLength', this.params.terminalLength],
            ['innerDiameter', this.params.innerDiameter]
        ])) as CableJointObject;
    }
}


// 添加光缆接头盒Primitive类
export class OpticalFiberBoxPrimitive extends BasePrimitive<OpticalFiberBoxParams, OpticalFiberBoxObject> {

    constructor(tp: TopoInstance, params?: OpticalFiberBoxObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.OpticalFiberBox;
    }

    setDefault(): Primitive<OpticalFiberBoxParams, OpticalFiberBoxObject> {
        this.params = {
            length: 300.0,
            height: 150.0,
            width: 200.0
        };
        return this;
    }

    public setParams(params: OpticalFiberBoxParams): Primitive<OpticalFiberBoxParams, OpticalFiberBoxObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 &&
            this.params.height > 0 &&
            this.params.width > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createOpticalFiberBox(this.params), false);
        }
        throw new Error("Invalid parameters for OpticalFiberBox");
    }

    fromObject(o?: OpticalFiberBoxObject): Primitive<OpticalFiberBoxParams, OpticalFiberBoxObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            height: o['height'],
            width: o['width']
        };
        return this;
    }

    toObject(): OpticalFiberBoxObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['height', this.params.height],
            ['width', this.params.width]
        ])) as OpticalFiberBoxObject;
    }
}


export class CableTerminalPrimitive extends BasePrimitive<CableTerminalParams, CableTerminalObject> {

    constructor(tp: TopoInstance, params?: CableTerminalObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTerminal;
    }

    setDefault(): Primitive<CableTerminalParams, CableTerminalObject> {
        this.params = {
            sort: 1,
            height: 1000,
            topDiameter: 200,
            bottomDiameter: 300,
            tailDiameter: 350,
            tailHeight: 50,
            skirtCount: 18,
            upperSkirtTopDiameter: 330,
            upperSkirtBottomDiameter: 340,
            lowerSkirtTopDiameter: 380,
            lowerSkirtBottomDiameter: 400,
            skirtSectionHeight: 40,
            upperTerminalLength: 100,
            upperTerminalDiameter: 80,
            lowerTerminalLength: 120,
            lowerTerminalDiameter: 100,
            hole1Diameter: 20,
            hole2Diameter: 20,
            hole1Distance: 30,
            holeSpacing: 40,
            flangeHoleDiameter: 25,
            flangeHoleSpacing: 400,
            flangeWidth: 450,
            flangeCenterHoleRadius: 75,
            flangeChamferRadius: 10,
            flangeOpeningWidth: 120,
            flangeBoltHeight: 40
        };
        return this;
    }

    public setParams(params: CableTerminalParams): Primitive<CableTerminalParams, CableTerminalObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.sort < 1 || this.params.sort > 3) return false;
        if (this.params.height <= 0) return false;
        if (this.params.topDiameter <= 0 || this.params.bottomDiameter <= 0) return false;
        if (this.params.sort === 1 && this.params.skirtCount <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableTerminal(this.params), false);
        }
        throw new Error("Invalid parameters for CableTerminal");
    }

    fromObject(o?: CableTerminalObject): Primitive<CableTerminalParams, CableTerminalObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            sort: o['sort'],
            height: o['height'],
            topDiameter: o['topDiameter'],
            bottomDiameter: o['bottomDiameter'],
            tailDiameter: o['tailDiameter'],
            tailHeight: o['tailHeight'],
            skirtCount: o['skirtCount'],
            upperSkirtTopDiameter: o['upperSkirtTopDiameter'],
            upperSkirtBottomDiameter: o['upperSkirtBottomDiameter'],
            lowerSkirtTopDiameter: o['lowerSkirtTopDiameter'],
            lowerSkirtBottomDiameter: o['lowerSkirtBottomDiameter'],
            skirtSectionHeight: o['skirtSectionHeight'],
            upperTerminalLength: o['upperTerminalLength'],
            upperTerminalDiameter: o['upperTerminalDiameter'],
            lowerTerminalLength: o['lowerTerminalLength'],
            lowerTerminalDiameter: o['lowerTerminalDiameter'],
            hole1Diameter: o['hole1Diameter'],
            hole2Diameter: o['hole2Diameter'],
            hole1Distance: o['hole1Distance'],
            holeSpacing: o['holeSpacing'],
            flangeHoleDiameter: o['flangeHoleDiameter'],
            flangeHoleSpacing: o['flangeHoleSpacing'],
            flangeWidth: o['flangeWidth'],
            flangeCenterHoleRadius: o['flangeCenterHoleRadius'],
            flangeChamferRadius: o['flangeChamferRadius'],
            flangeOpeningWidth: o['flangeOpeningWidth'],
            flangeBoltHeight: o['flangeBoltHeight']
        };
        return this;
    }

    toObject(): CableTerminalObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['sort', this.params.sort],
            ['height', this.params.height],
            ['topDiameter', this.params.topDiameter],
            ['bottomDiameter', this.params.bottomDiameter],
            ['tailDiameter', this.params.tailDiameter],
            ['tailHeight', this.params.tailHeight],
            ['skirtCount', this.params.skirtCount],
            ['upperSkirtTopDiameter', this.params.upperSkirtTopDiameter],
            ['upperSkirtBottomDiameter', this.params.upperSkirtBottomDiameter],
            ['lowerSkirtTopDiameter', this.params.lowerSkirtTopDiameter],
            ['lowerSkirtBottomDiameter', this.params.lowerSkirtBottomDiameter],
            ['skirtSectionHeight', this.params.skirtSectionHeight],
            ['upperTerminalLength', this.params.upperTerminalLength],
            ['upperTerminalDiameter', this.params.upperTerminalDiameter],
            ['lowerTerminalLength', this.params.lowerTerminalLength],
            ['lowerTerminalDiameter', this.params.lowerTerminalDiameter],
            ['hole1Diameter', this.params.hole1Diameter],
            ['hole2Diameter', this.params.hole2Diameter],
            ['hole1Distance', this.params.hole1Distance],
            ['holeSpacing', this.params.holeSpacing],
            ['flangeHoleDiameter', this.params.flangeHoleDiameter],
            ['flangeHoleSpacing', this.params.flangeHoleSpacing],
            ['flangeWidth', this.params.flangeWidth],
            ['flangeCenterHoleRadius', this.params.flangeCenterHoleRadius],
            ['flangeChamferRadius', this.params.flangeChamferRadius],
            ['flangeOpeningWidth', this.params.flangeOpeningWidth],
            ['flangeBoltHeight', this.params.flangeBoltHeight]
        ])) as CableTerminalObject;
    }
}

export class CableAccessoryPrimitive extends BasePrimitive<CableAccessoryParams, CableAccessoryObject> {

    constructor(tp: TopoInstance, params?: CableAccessoryObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableAccessory;
    }

    setDefault(): Primitive<CableAccessoryParams, CableAccessoryObject> {
        this.params = {
            type: this.tp.CableBoxType.DIRECT_GROUND as any, // DIRECT_GROUND
            length: 500.0,
            width: 400.0,
            height: 300.0,
            portCount: 3,
            portDiameter: 100.0,
            portSpacing: 180,
            backPanelDistance: 50.0,
            sidePanelDistance: 60.0
        };
        return this;
    }

    public setParams(params: CableAccessoryParams): Primitive<CableAccessoryParams, CableAccessoryObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.width <= 0 || this.params.height <= 0) return false;
        if (this.params.portCount !== 3 && this.params.portCount !== 6) return false;
        return this.params.portDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableAccessory(this.params), false);
        }
        throw new Error("Invalid parameters for CableAccessory");
    }

    fromObject(o: any): Primitive<CableAccessoryParams, CableAccessoryObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            type: o['type'],
            length: o['length'],
            width: o['width'],
            height: o['height'],
            portCount: o['portCount'],
            portDiameter: o['portDiameter'],
            portSpacing: o['portSpacing'],
            backPanelDistance: o['backPanelDistance'],
            sidePanelDistance: o['sidePanelDistance']
        };
        return this;
    }

    toObject(): CableAccessoryObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['portCount', this.params.portCount],
            ['portDiameter', this.params.portDiameter],
            ['portSpacing', this.params.portSpacing],
            ['backPanelDistance', this.params.backPanelDistance],
            ['sidePanelDistance', this.params.sidePanelDistance]
        ])) as CableAccessoryObject;
    }
}

export class CableBracketPrimitive extends BasePrimitive<CableBracketParams, CableBracketObject> {

    constructor(tp: TopoInstance, params?: CableBracketObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableBracket;
    }

    setDefault(): Primitive<CableBracketParams, CableBracketObject> {
        this.params = {
            length: 100.0,
            rootHeight: 50.0,
            rootWidth: 20.0,
            width: 15.0,
            topThickness: 5.0,
            rootThickness: 8.0,
            columnMountPoints: [
                new this.tp.gp_Pnt_3(10, -8.0, -10),
                new this.tp.gp_Pnt_3(10, -8.0, -35)
            ],
            clampMountPoints: [
                new this.tp.gp_Pnt_3(90, -5.0, -7.5),
                new this.tp.gp_Pnt_3(50, -5.0, -7.5)
            ]
        };
        return this;
    }

    public setParams(params: CableBracketParams): Primitive<CableBracketParams, CableBracketObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0) return false;
        if (this.params.rootHeight <= 0) return false;
        if (this.params.rootWidth <= 0) return false;
        if (this.params.width <= 0) return false;
        if (this.params.topThickness <= 0) return false;
        return this.params.rootThickness > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableBracket(this.params), false);
        }
        throw new Error("Invalid parameters for CableBracket");
    }

    fromObject(o?: CableBracketObject): Primitive<CableBracketParams, CableBracketObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            rootHeight: o['rootHeight'],
            rootWidth: o['rootWidth'],
            width: o['width'],
            topThickness: o['topThickness'],
            rootThickness: o['rootThickness'],
            columnMountPoints: o['columnMountPoints'].map((t) => new this.tp.gp_Pnt_3(t[0], t[1], t[2])) || [],
            clampMountPoints: o['clampMountPoints'].map((t) => new this.tp.gp_Pnt_3(t[0], t[1], t[2])) || []
        };
        return this;
    }

    toObject(): CableBracketObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['rootHeight', this.params.rootHeight],
            ['rootWidth', this.params.rootWidth],
            ['width', this.params.width],
            ['topThickness', this.params.topThickness],
            ['rootThickness', this.params.rootThickness],
            ['columnMountPoints', this.params.columnMountPoints.map((p) => ([p.X(), p.Y(), p.Z()]))],
            ['clampMountPoints', this.params.clampMountPoints.map((p) => ([p.X(), p.Y(), p.Z()]))]
        ])) as CableBracketObject;
    }
}

export class CableClampPrimitive extends BasePrimitive<CableClampParams, CableClampObject> {

    constructor(tp: TopoInstance, params?: CableClampObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableClamp;
    }

    setDefault(): Primitive<CableClampParams, CableClampObject> {
        this.params = {
            clampType: this.tp.CableClampType.SINGLE as any, // SINGLE
            diameter: 50.0,
            thickness: 10.0,
            width: 30.0
        };
        return this;
    }

    public setParams(params: CableClampParams): Primitive<CableClampParams, CableClampObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.diameter > 0 &&
            this.params.thickness > 0 &&
            this.params.width > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableClamp(this.params), false);
        }
        throw new Error("Invalid parameters for CableClamp");
    }

    fromObject(o?: CableClampObject): Primitive<CableClampParams, CableClampObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let clampType: CableClampType = this.tp.CableClampType.SINGLE as any;
        if (o['clampType'] === 'SINGLE') {
            clampType = this.tp.CableClampType.SINGLE as any;
        } else if (o['clampType'] === 'LINEAR') {
            clampType = this.tp.CableClampType.LINEAR as any;
        } else if (o['clampType'] === 'CONTACT_TRIPLE') {
            clampType = this.tp.CableClampType.CONTACT_TRIPLE as any;
        } else if (o['clampType'] === 'SEPARATE_TRIPLE') {
            clampType = this.tp.CableClampType.SEPARATE_TRIPLE as any;
        }

        this.params = {
            clampType: clampType,
            diameter: o['diameter'],
            thickness: o['thickness'],
            width: o['width']
        };
        return this;
    }

    toObject(): CableClampObject | undefined {
        let clampType: string = 'SINGLE';
        if (this.params.clampType === this.tp.CableClampType.LINEAR as any) {
            clampType = 'LINEAR';
        } else if (this.params.clampType === this.tp.CableClampType.CONTACT_TRIPLE as any) {
            clampType = 'CONTACT_TRIPLE';
        } else if (this.params.clampType === this.tp.CableClampType.SEPARATE_TRIPLE as any) {
            clampType = 'SEPARATE_TRIPLE';
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['clampType', clampType],
            ['diameter', this.params.diameter],
            ['thickness', this.params.thickness],
            ['width', this.params.width]
        ])) as CableClampObject;
    }
}


export class CablePolePrimitive extends BasePrimitive<CablePoleParams, CablePoleObject> {

    constructor(tp: TopoInstance, params?: CablePoleObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CablePole;
    }

    setDefault(): Primitive<CablePoleParams, CablePoleObject> {
        this.params = {
            specification: "GJ-DLLZ-1",
            length: 200.0,
            radius: 0,
            arcAngle: Math.PI / 4,
            width: 20.0,
            fixedLegLength: 20.0,
            fixedLegWidth: 10.0,
            thickness: 5.0,
            mountPoints: [
                new this.tp.gp_Pnt_3(-20, 0, 50),
                new this.tp.gp_Pnt_3(20, 0, 50),
                new this.tp.gp_Pnt_3(-20, 0, 100),
                new this.tp.gp_Pnt_3(20, 0, 100),
                new this.tp.gp_Pnt_3(-20, 0, 150),
                new this.tp.gp_Pnt_3(20, 0, 150)
            ]
        };
        return this;
    }

    public setParams(params: CablePoleParams): Primitive<CablePoleParams, CablePoleObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0) return false;
        if (this.params.width <= 0) return false;
        if (this.params.thickness <= 0) return false;
        if (this.params.thickness >= this.params.width / 2) return false;
        if (this.params.fixedLegLength < 0) return false;
        return this.params.fixedLegWidth >= 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCablePole(this.params), false);
        }
        throw new Error("Invalid parameters for CablePole");
    }

    fromObject(o?: CablePoleObject): Primitive<CablePoleParams, CablePoleObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            specification: o['specification'],
            length: o['length'],
            radius: o['radius'],
            arcAngle: o['arcAngle'],
            width: o['width'],
            fixedLegLength: o['fixedLegLength'],
            fixedLegWidth: o['fixedLegWidth'],
            thickness: o['thickness'],
            mountPoints: o['mountPoints'].map((t) => new this.tp.gp_Pnt_3(t[0], t[1], t[2])) || []
        };
        return this;
    }

    toObject(): CablePoleObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['specification', this.params.specification],
            ['length', this.params.length],
            ['radius', this.params.radius],
            ['arcAngle', this.params.arcAngle],
            ['width', this.params.width],
            ['fixedLegLength', this.params.fixedLegLength],
            ['fixedLegWidth', this.params.fixedLegWidth],
            ['thickness', this.params.thickness],
            ['mountPoints', this.params.mountPoints.map((t) => ([t.X(), t.Y(), t.Z()]))]
        ])) as CablePoleObject;
    }
}

export class GroundFlatIronPrimitive extends BasePrimitive<GroundFlatIronParams, GroundFlatIronObject> {

    constructor(tp: TopoInstance, params?: GroundFlatIronObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.GroundFlatIron;
    }

    setDefault(): Primitive<GroundFlatIronParams> {
        this.params = {
            length: 100.0,
            height: 20.0,
            thickness: 10.0
        };
        return this;
    }

    public setParams(params: GroundFlatIronParams): Primitive<GroundFlatIronParams, GroundFlatIronObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0) return false;
        if (this.params.height <= 0) return false;
        if (this.params.thickness <= 0) return false;
        return this.params.thickness < this.params.height;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createGroundFlatIron(this.params), false);
        }
        throw new Error("Invalid parameters for GroundFlatIron");
    }

    fromObject(o?: GroundFlatIronObject): Primitive<GroundFlatIronParams, GroundFlatIronObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            height: o['height'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): GroundFlatIronObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['height', this.params.height],
            ['thickness', this.params.thickness]
        ])) as GroundFlatIronObject;
    }
}

export class EmbeddedPartPrimitive extends BasePrimitive<EmbeddedPartParams, EmbeddedPartObject> {

    constructor(tp: TopoInstance, params?: EmbeddedPartObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.EmbeddedPart;
    }

    setDefault(): Primitive<EmbeddedPartParams, EmbeddedPartObject> {
        this.params = {
            length: 100.0,
            radius: 20.0,
            height: 50.0,
            materialRadius: 5.0,
            lowerLength: 30.0
        };
        return this;
    }

    public setParams(params: EmbeddedPartParams): Primitive<EmbeddedPartParams, EmbeddedPartObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0) return false;
        if (this.params.radius <= 0) return false;
        if (this.params.height <= 0) return false;
        if (this.params.materialRadius <= 0) return false;
        if (this.params.lowerLength <= 0) return false;
        return this.params.materialRadius < this.params.radius;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createEmbeddedPart(this.params), false);
        }
        throw new Error("Invalid parameters for EmbeddedPart");
    }

    fromObject(o?: EmbeddedPartObject): Primitive<EmbeddedPartParams, EmbeddedPartObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            radius: o['radius'],
            height: o['height'],
            materialRadius: o['materialRadius'],
            lowerLength: o['lowerLength']
        };
        return this;
    }

    toObject(): EmbeddedPartObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['radius', this.params.radius],
            ['height', this.params.height],
            ['materialRadius', this.params.materialRadius],
            ['lowerLength', this.params.lowerLength]
        ])) as EmbeddedPartObject;
    }
}


// 添加U型拉环Primitive类
export class UShapedRingPrimitive extends BasePrimitive<UShapedRingParams, UShapedRingObject> {

    constructor(tp: TopoInstance, params?: UShapedRingObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.UShapedRing;
    }

    setDefault(): Primitive<UShapedRingParams, UShapedRingObject> {
        this.params = {
            thickness: 5.0,
            height: 30.0,
            radius: 25.0,
            length: 100.0
        };
        return this;
    }

    public setParams(params: UShapedRingParams): Primitive<UShapedRingParams, UShapedRingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.thickness <= 0) return false;
        if (this.params.height <= 0) return false;
        if (this.params.radius <= 0) return false;
        return this.params.length > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createUShapedRing(this.params), false);
        }
        throw new Error("Invalid parameters for UShapedRing");
    }

    fromObject(o?: UShapedRingObject): Primitive<UShapedRingParams, UShapedRingObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            thickness: o['thickness'],
            height: o['height'],
            radius: o['radius'],
            length: o['length']
        };
        return this;
    }

    toObject(): UShapedRingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['thickness', this.params.thickness],
            ['height', this.params.height],
            ['radius', this.params.radius],
            ['length', this.params.length]
        ])) as UShapedRingObject;
    }
}

export class LiftingEyePrimitive extends BasePrimitive<LiftingEyeParams, LiftingEyeObject> {

    constructor(tp: TopoInstance, params?: LiftingEyeObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.LiftingEye;
    }

    setDefault(): Primitive<LiftingEyeParams, LiftingEyeObject> {
        this.params = {
            height: 100.0,
            ringRadius: 25.0,
            pipeDiameter: 10.0
        };
        return this;
    }

    public setParams(params: LiftingEyeParams): Primitive<LiftingEyeParams, LiftingEyeObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.height <= 0) return false;
        if (this.params.ringRadius <= 0) return false;
        if (this.params.pipeDiameter <= 0) return false;
        return this.params.pipeDiameter < 2 * this.params.ringRadius;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createLiftingEye(this.params), false);
        }
        throw new Error("Invalid parameters for LiftingEye");
    }

    fromObject(o?: LiftingEyeObject): Primitive<LiftingEyeParams, LiftingEyeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            height: o['height'],
            ringRadius: o['ringRadius'],
            pipeDiameter: o['pipeDiameter']
        };
        return this;
    }

    toObject(): LiftingEyeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['ringRadius', this.params.ringRadius],
            ['pipeDiameter', this.params.pipeDiameter]
        ])) as LiftingEyeObject;
    }
}

export class CornerWellPrimitive extends BasePrimitive<CornerWellParams, CornerWellObject> {

    constructor(tp: TopoInstance, params?: CornerWellObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CornerWell;
    }

    setDefault(): Primitive<CornerWellParams, CornerWellObject> {
        this.params = {
            leftLength: 800.0,
            rightLength: 600.0,
            width: 150.0,
            height: 180.0,
            topThickness: 20.0,
            bottomThickness: 25.0,
            wallThickness: 30.0,
            angle: 90.0,
            cornerRadius: 100.0,
            cushionExtension: 10.0,
            cushionThickness: 15.0
        };
        return this;
    }

    public setParams(params: CornerWellParams): Primitive<CornerWellParams, CornerWellObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.leftLength <= 0) return false;
        if (this.params.rightLength <= 0) return false;
        if (this.params.width <= 0) return false;
        if (this.params.height <= 0) return false;
        if (this.params.topThickness <= 0) return false;
        if (this.params.bottomThickness <= 0) return false;
        if (this.params.wallThickness <= 0) return false;
        if (this.params.angle <= 0 || this.params.angle >= 180) return false;
        if (this.params.cornerRadius <= 0) return false;
        if (this.params.cushionThickness <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCornerWell(this.params), false);
        }
        throw new Error("Invalid parameters for CornerWell");
    }

    fromObject(o?: CornerWellObject): Primitive<CornerWellParams, CornerWellObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            leftLength: o['leftLength'],
            rightLength: o['rightLength'],
            width: o['width'],
            height: o['height'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            wallThickness: o['wallThickness'],
            angle: o['angle'],
            cornerRadius: o['cornerRadius'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness']
        };
        return this;
    }

    toObject(): CornerWellObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['leftLength', this.params.leftLength],
            ['rightLength', this.params.rightLength],
            ['width', this.params.width],
            ['height', this.params.height],
            ['topThickness', this.params.topThickness],
            ['bottomThickness', this.params.bottomThickness],
            ['wallThickness', this.params.wallThickness],
            ['angle', this.params.angle],
            ['cornerRadius', this.params.cornerRadius],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness]
        ])) as CornerWellObject;
    }
}

export class TunnelWellPrimitive extends BasePrimitive<TunnelWellParams, TunnelWellObject> {

    constructor(tp: TopoInstance, params?: TunnelWellObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.TunnelWell;
    }

    setDefault(): Primitive<TunnelWellParams, TunnelWellObject> {
        this.params = {
            type: this.tp.TunnelWellType.STRAIGHT as any, // STRAIGHT
            length: 800.0,
            width: 150.0,
            height: 180.0,
            topThickness: 20.0,
            bottomThickness: 25.0,
            outerWallThickness: 30.0,
            cushionExtension: 10.0,
            cushionThickness: 15.0,
            leftSectionType: this.tp.ConnectionSectionStyle.RECTANGULAR as any, // RECTANGULAR
            leftLength: 0,
            leftWidth: 0,
            leftHeight: 0,
            leftArcHeight: 0,
            rightSectionType: this.tp.ConnectionSectionStyle.RECTANGULAR as any, // RECTANGULAR
            rightLength: 0,
            rightWidth: 0,
            rightHeight: 0,
            rightArcHeight: 0,
            radius: 0,
            innerWallThickness: 0,
        };
        return this;
    }

    public setParams(params: TunnelWellParams): Primitive<TunnelWellParams, TunnelWellObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0) return false;
        if (this.params.width <= 0) return false;
        if (this.params.height <= 0) return false;
        if (this.params.topThickness <= 0) return false;
        if (this.params.bottomThickness <= 0) return false;
        if (this.params.outerWallThickness <= 0) return false;
        if (this.params.cushionThickness <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTunnelWell(this.params), false);
        }
        throw new Error("Invalid parameters for TunnelWell");
    }

    fromObject(o?: TunnelWellObject): Primitive<TunnelWellParams, TunnelWellObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let wellType: TunnelWellType = this.tp.TunnelWellType.STRAIGHT as any;
        if (o['wellType'] === 'STRAIGHT') {
            wellType = this.tp.TunnelWellType.STRAIGHT as any;
        } else if (o['wellType'] === 'STRAIGHT_TUNNEL') {
            wellType = this.tp.TunnelWellType.STRAIGHT_TUNNEL as any;
        }

        let leftSectionType: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        if (o['leftSectionType'] === 'RECTANGULAR') {
            leftSectionType = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['leftSectionType'] === 'HORSESHOE') {
            leftSectionType = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['leftSectionType'] === 'CIRCULAR') {
            leftSectionType = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        let rightSectionType: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        if (o['rightSectionType'] === 'RECTANGULAR') {
            rightSectionType = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['rightSectionType'] === 'HORSESHOE') {
            rightSectionType = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['rightSectionType'] === 'CIRCULAR') {
            rightSectionType = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        this.params = {
            type: wellType,
            length: o['length'],
            width: o['width'],
            height: o['height'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            outerWallThickness: o['outerWallThickness'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            leftSectionType: leftSectionType,
            leftLength: o['leftLength'],
            leftWidth: o['leftWidth'],
            leftHeight: o['leftHeight'],
            leftArcHeight: o['leftArcHeight'],
            rightSectionType: rightSectionType,
            rightLength: o['rightLength'],
            rightWidth: o['rightWidth'],
            rightHeight: o['rightHeight'],
            rightArcHeight: o['rightArcHeight'],
            radius: o['radius'],
            innerWallThickness: o['innerWallThickness']
        };
        return this;
    }

    toObject(): TunnelWellObject | undefined {
        let wellType = 'STRAIGHT';
        if (this.params.type === this.tp.TunnelWellType.STRAIGHT_TUNNEL as any) {
            wellType = 'STRAIGHT_TUNNEL';
        } else if (this.params.type === this.tp.TunnelWellType.STRAIGHT as any) {
            wellType = 'STRAIGHT';
        }

        let leftSectionType = 'RECTANGULAR';
        if (this.params.leftSectionType === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            leftSectionType = 'HORSESHOE';
        } else if (this.params.leftSectionType === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            leftSectionType = 'CIRCULAR';
        }

        let rightSectionType = 'RECTANGULAR';
        if (this.params.rightSectionType === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            rightSectionType = 'HORSESHOE';
        } else if (this.params.rightSectionType === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            rightSectionType = 'CIRCULAR';
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['wellType', wellType],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['radius', this.params.radius],
            ['topThickness', this.params.topThickness],
            ['bottomThickness', this.params.bottomThickness],
            ['outerWallThickness', this.params.outerWallThickness],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['leftSectionType', leftSectionType],
            ['leftLength', this.params.leftLength],
            ['leftWidth', this.params.leftWidth],
            ['leftHeight', this.params.leftHeight],
            ['leftArcHeight', this.params.leftArcHeight],
            ['rightSectionType', rightSectionType],
            ['rightLength', this.params.rightLength],
            ['rightWidth', this.params.rightWidth],
            ['rightHeight', this.params.rightHeight],
            ['rightArcHeight', this.params.rightArcHeight],
            ['innerWallThickness', this.params.innerWallThickness]
        ])) as TunnelWellObject;
    }
}


// 添加三通井Primitive类
export class ThreeWayWellPrimitive extends BasePrimitive<ThreeWayWellParams, ThreeWayWellObject> {

    constructor(tp: TopoInstance, params?: ThreeWayWellObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.ThreeWayWell;
    }

    setDefault(): Primitive<ThreeWayWellParams> {
        this.params = {
            type: this.tp.ThreeWayWellType.UNDERGROUND_TUNNEL as any, // UNDERGROUND_TUNNEL
            cornerType: this.tp.CornerStyle.ROUNDED as any, // ROUNDED
            shaftType: this.tp.ShaftStyle.CIRCULAR as any, // CIRCULAR
            length: 200.0,
            width: 80.0,
            height: 60.0,
            shaftRadius: 80.0,
            cornerRadius: 30.0,
            cornerLength: 40.0,
            cornerWidth: 35.0,
            branchLength: 120.0,
            branchLeftLength: 80.0,
            branchWidth: 100.0,
            topThickness: 20.0,
            bottomThickness: 25.0,
            leftSectionStyle: this.tp.ConnectionSectionStyle.RECTANGULAR as any, // RECTANGULAR
            leftSectionLength: 60.0,
            leftSectionWidth: 80.0,
            leftSectionHeight: 90.0,
            leftSectionArcHeight: 15.0,
            rightSectionStyle: this.tp.ConnectionSectionStyle.RECTANGULAR as any, // RECTANGULAR
            rightSectionLength: 60.0,
            rightSectionWidth: 80.0,
            rightSectionHeight: 90.0,
            rightSectionArcHeight: 15.0,
            branchSectionStyle: this.tp.ConnectionSectionStyle.HORSESHOE as any, // HORSESHOE
            branchSectionLength: 80.0,
            branchSectionWidth: 80.0,
            branchSectionHeight: 50.0,
            branchSectionArcHeight: 15.0,
            outerWallThickness: 5.0,
            innerWallThickness: 3.0,
            isDoubleShaft: false,
            doubleShaftSpacing: 0.0,
            outerWallExtension: 10.0,
            innerWallExtension: 5.0,
            cushionExtension: 15.0,
            cushionThickness: 10.0,
            innerBottomThickness: 18.0,
            outerBottomThickness: 20.0,
            angle: 0,
        };
        return this;
    }

    public setParams(params: ThreeWayWellParams): Primitive<ThreeWayWellParams, ThreeWayWellObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.width <= 0 || this.params.height <= 0) return false;
        if (this.params.topThickness <= 0 || this.params.bottomThickness <= 0) return false;
        if (this.params.outerWallThickness <= 0 || this.params.innerWallThickness <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createThreeWayWell(this.params), false);
        }
        throw new Error("Invalid parameters for ThreeWayWell");
    }

    fromObject(o?: ThreeWayWellObject): Primitive<ThreeWayWellParams, ThreeWayWellObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let wellType: ThreeWayWellType = this.tp.ThreeWayWellType.UNDERGROUND_TUNNEL as any;
        if (o['wellType'] === 'UNDERGROUND_TUNNEL') {
            wellType = this.tp.ThreeWayWellType.UNDERGROUND_TUNNEL as any;
        } else if (o['wellType'] === 'OPEN_CUT_TUNNEL') {
            wellType = this.tp.ThreeWayWellType.OPEN_CUT_TUNNEL as any;
        } else if (o['wellType'] === 'WORKING_WELL') {
            wellType = this.tp.ThreeWayWellType.WORKING_WELL as any;
        }

        let cornerType: CornerStyle = this.tp.CornerStyle.ROUNDED as any;
        if (o['cornerType'] === 'ROUNDED') {
            cornerType = this.tp.CornerStyle.ROUNDED as any;
        } else if (o['cornerType'] === 'ANGLED') {
            cornerType = this.tp.CornerStyle.ANGLED as any;
        }

        let shaftType: ShaftStyle = this.tp.ShaftStyle.CIRCULAR as any;
        if (o['shaftType'] === 'CIRCULAR') {
            shaftType = this.tp.ShaftStyle.CIRCULAR as any;
        } else if (o['shaftType'] === 'RECTANGULAR') {
            shaftType = this.tp.ShaftStyle.RECTANGULAR as any;
        }

        let leftSectionStyle: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        if (o['leftSectionStyle'] === 'RECTANGULAR') {
            leftSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['leftSectionStyle'] === 'HORSESHOE') {
            leftSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['leftSectionStyle'] === 'CIRCULAR') {
            leftSectionStyle = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        let rightSectionStyle: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        if (o['rightSectionStyle'] === 'RECTANGULAR') {
            rightSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['rightSectionStyle'] === 'HORSESHOE') {
            rightSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['rightSectionStyle'] === 'CIRCULAR') {
            rightSectionStyle = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        let branchSectionStyle: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        if (o['branchSectionStyle'] === 'RECTANGULAR') {
            branchSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['branchSectionStyle'] === 'HORSESHOE') {
            branchSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['branchSectionStyle'] === 'CIRCULAR') {
            branchSectionStyle = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        this.params = {
            type: wellType,
            cornerType: cornerType,
            shaftType: shaftType,
            length: o['length'],
            width: o['width'],
            height: o['height'],
            shaftRadius: o['shaftRadius'],
            cornerRadius: o['cornerRadius'],
            cornerLength: o['cornerLength'],
            cornerWidth: o['cornerWidth'],
            branchLength: o['branchLength'],
            branchLeftLength: o['branchLeftLength'],
            branchWidth: o['branchWidth'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            leftSectionStyle: leftSectionStyle,
            leftSectionLength: o['leftSectionLength'],
            leftSectionWidth: o['leftSectionWidth'],
            leftSectionHeight: o['leftSectionHeight'],
            leftSectionArcHeight: o['leftSectionArcHeight'],
            rightSectionStyle: rightSectionStyle,
            rightSectionLength: o['rightSectionLength'],
            rightSectionWidth: o['rightSectionWidth'],
            rightSectionHeight: o['rightSectionHeight'],
            rightSectionArcHeight: o['rightSectionArcHeight'],
            branchSectionStyle: branchSectionStyle,
            branchSectionLength: o['branchSectionLength'],
            branchSectionWidth: o['branchSectionWidth'],
            branchSectionHeight: o['branchSectionHeight'],
            branchSectionArcHeight: o['branchSectionArcHeight'],
            outerWallThickness: o['outerWallThickness'],
            innerWallThickness: o['innerWallThickness'],
            isDoubleShaft: o['isDoubleShaft'],
            doubleShaftSpacing: o['doubleShaftSpacing'],
            outerWallExtension: o['outerWallExtension'],
            innerWallExtension: o['innerWallExtension'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            innerBottomThickness: o['innerBottomThickness'],
            outerBottomThickness: o['outerBottomThickness'],
            angle: o['angle'],
        };
        return this;
    }

    toObject(): ThreeWayWellObject | undefined {
        let wellType = 'UNDERGROUND_TUNNEL';
        if (this.params.type === this.tp.ThreeWayWellType.OPEN_CUT_TUNNEL as any) {
            wellType = 'OPEN_CUT_TUNNEL';
        } else if (this.params.type === this.tp.ThreeWayWellType.WORKING_WELL as any) {
            wellType = 'WORKING_WELL';
        } else if (this.params.type === this.tp.ThreeWayWellType.UNDERGROUND_TUNNEL as any) {
            wellType = 'UNDERGROUND_TUNNEL';
        }

        let cornerType = 'ROUNDED';
        if (this.params.cornerType === this.tp.CornerStyle.ANGLED as any) {
            cornerType = 'ANGLED';
        } else if (this.params.cornerType === this.tp.CornerStyle.ROUNDED as any) {
            cornerType = 'ROUNDED';
        }

        let shaftType = 'CIRCULAR';
        if (this.params.shaftType === this.tp.ShaftStyle.RECTANGULAR as any) {
            shaftType = 'RECTANGULAR';
        } else if (this.params.shaftType === this.tp.ShaftStyle.CIRCULAR as any) {
            shaftType = 'CIRCULAR';
        }

        let leftSectionStyle = 'RECTANGULAR';
        if (this.params.leftSectionStyle === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            leftSectionStyle = 'HORSESHOE';
        } else if (this.params.leftSectionStyle === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            leftSectionStyle = 'CIRCULAR';
        } else if (this.params.leftSectionStyle === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            leftSectionStyle = 'RECTANGULAR';
        }

        let rightSectionStyle = 'RECTANGULAR';
        if (this.params.rightSectionStyle === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            rightSectionStyle = 'HORSESHOE';
        } else if (this.params.rightSectionStyle === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            rightSectionStyle = 'CIRCULAR';
        } else if (this.params.rightSectionStyle === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            rightSectionStyle = 'RECTANGULAR';
        }

        let branchSectionStyle = 'HORSESHOE';
        if (this.params.branchSectionStyle === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            branchSectionStyle = 'RECTANGULAR';
        } else if (this.params.branchSectionStyle === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            branchSectionStyle = 'CIRCULAR';
        } else if (this.params.branchSectionStyle === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            branchSectionStyle = 'HORSESHOE';
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['wellType', wellType],
            ['cornerType', cornerType],
            ['shaftType', shaftType],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['shaftRadius', this.params.shaftRadius],
            ['cornerRadius', this.params.cornerRadius],
            ['cornerLength', this.params.cornerLength],
            ['cornerWidth', this.params.cornerWidth],
            ['branchLength', this.params.branchLength],
            ['branchLeftLength', this.params.branchLeftLength],
            ['branchWidth', this.params.branchWidth],
            ['topThickness', this.params.topThickness],
            ['bottomThickness', this.params.bottomThickness],
            ['leftSectionStyle', leftSectionStyle],
            ['leftSectionLength', this.params.leftSectionLength],
            ['leftSectionWidth', this.params.leftSectionWidth],
            ['leftSectionHeight', this.params.leftSectionHeight],
            ['leftSectionArcHeight', this.params.leftSectionArcHeight],
            ['rightSectionStyle', rightSectionStyle],
            ['rightSectionLength', this.params.rightSectionLength],
            ['rightSectionWidth', this.params.rightSectionWidth],
            ['rightSectionHeight', this.params.rightSectionHeight],
            ['rightSectionArcHeight', this.params.rightSectionArcHeight],
            ['branchSectionStyle', branchSectionStyle],
            ['branchSectionLength', this.params.branchSectionLength],
            ['branchSectionWidth', this.params.branchSectionWidth],
            ['branchSectionHeight', this.params.branchSectionHeight],
            ['branchSectionArcHeight', this.params.branchSectionArcHeight],
            ['outerWallThickness', this.params.outerWallThickness],
            ['innerWallThickness', this.params.innerWallThickness],
            ['isDoubleShaft', this.params.isDoubleShaft],
            ['doubleShaftSpacing', this.params.doubleShaftSpacing],
            ['outerWallExtension', this.params.outerWallExtension],
            ['innerWallExtension', this.params.innerWallExtension],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['innerBottomThickness', this.params.innerBottomThickness],
            ['outerBottomThickness', this.params.outerBottomThickness],
            ['angle', this.params.angle],
        ])) as ThreeWayWellObject;
    }
}

export class FourWayWellPrimitive extends BasePrimitive<FourWayWellParams, FourWayWellObject> {

    constructor(tp: TopoInstance, params?: FourWayWellObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.FourWayWell;
    }

    setDefault(): Primitive<FourWayWellParams, FourWayWellObject> {
        this.params = {
            type: this.tp.FourWayWellType.WORKING_WELL as any, // WORKING_WELL
            length: 200.0,
            width: 80.0,
            height: 60.0,
            cornerStyle: this.tp.CornerStyle.ROUNDED as any, // ROUNDED
            cornerRadius: 30.0,
            branchLength: 100.0,
            branchWidth: 80.0,
            topThickness: 10.0,
            bottomThickness: 10.0,
            outerWallThickness: 5.0,
            innerWallThickness: 3.0,
            cushionExtension: 10.0,
            cushionThickness: 15.0,
            leftSection: this.tp.ConnectionSectionStyle.RECTANGULAR as any,
            rightSection: this.tp.ConnectionSectionStyle.RECTANGULAR as any,
            branchSection1: this.tp.ConnectionSectionStyle.HORSESHOE as any,
            branchSection2: this.tp.ConnectionSectionStyle.HORSESHOE as any,
            shaftRadius: 0.0,
            cornerLength: 0.0,
            cornerWidth: 0.0,
        };
        return this;
    }

    public setParams(params: FourWayWellParams): Primitive<FourWayWellParams, FourWayWellObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.width <= 0 || this.params.height <= 0) return false;
        if (this.params.topThickness <= 0 || this.params.bottomThickness <= 0) return false;
        if (this.params.outerWallThickness <= 0 || this.params.innerWallThickness <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createFourWayWell(this.params), false);
        }
        throw new Error("Invalid parameters for FourWayWell");
    }

    fromObject(o?: FourWayWellObject): Primitive<FourWayWellParams, FourWayWellObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let wellType: FourWayWellType = this.tp.FourWayWellType.UNDERGROUND_TUNNEL as any;
        if (o['wellType'] === 'UNDERGROUND_TUNNEL') {
            wellType = this.tp.FourWayWellType.UNDERGROUND_TUNNEL as any;
        } else if (o['wellType'] === 'OPEN_CUT_TUNNEL') {
            wellType = this.tp.FourWayWellType.OPEN_CUT_TUNNEL as any;
        } else if (o['wellType'] === 'WORKING_WELL') {
            wellType = this.tp.FourWayWellType.WORKING_WELL as any;
        }


        let cornerStyle: CornerStyle = this.tp.CornerStyle.ROUNDED as any;
        if (o['cornerStyle'] === 'ROUNDED') {
            cornerStyle = this.tp.CornerStyle.ROUNDED as any;
        } else if (o['cornerStyle'] === 'ANGLED') {
            cornerStyle = this.tp.CornerStyle.ANGLED as any;
        }

        let leftSectionStyle: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        if (o['leftSection'] === 'RECTANGULAR') {
            leftSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['leftSection'] === 'HORSESHOE') {
            leftSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['leftSection'] === 'CIRCULAR') {
            leftSectionStyle = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        let rightSectionStyle: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        if (o['rightSection'] === 'RECTANGULAR') {
            rightSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['rightSection'] === 'HORSESHOE') {
            rightSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['rightSection'] === 'CIRCULAR') {
            rightSectionStyle = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        let branchSection1Style: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        if (o['branchSection1'] === 'RECTANGULAR') {
            branchSection1Style = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['branchSection1'] === 'HORSESHOE') {
            branchSection1Style = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['branchSection1'] === 'CIRCULAR') {
            branchSection1Style = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        let branchSection2Style: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        if (o['branchSection2'] === 'RECTANGULAR') {
            branchSection2Style = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['branchSection2'] === 'HORSESHOE') {
            branchSection2Style = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['branchSection2'] === 'CIRCULAR') {
            branchSection2Style = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }

        this.params = {
            type: wellType,
            length: o['length'],
            width: o['width'],
            height: o['height'],
            cornerStyle: cornerStyle,
            cornerRadius: o['cornerRadius'],
            branchLength: o['branchLength'],
            branchWidth: o['branchWidth'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            outerWallThickness: o['outerWallThickness'],
            innerWallThickness: o['innerWallThickness'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            leftSection: leftSectionStyle,
            rightSection: rightSectionStyle,
            branchSection1: branchSection1Style,
            branchSection2: branchSection2Style,
            shaftRadius: o['shaftRadius'],
            cornerLength: o['cornerLength'],
            cornerWidth: o['cornerWidth'],
        };
        return this;
    }

    toObject(): FourWayWellObject | undefined {
        let wellType = 'WORKING_WELL';
        if (this.params.type === this.tp.FourWayWellType.UNDERGROUND_TUNNEL as any) {
            wellType = 'UNDERGROUND_TUNNEL';
        } else if (this.params.type === this.tp.FourWayWellType.OPEN_CUT_TUNNEL as any) {
            wellType = 'OPEN_CUT_TUNNEL';
        } else if (this.params.type === this.tp.FourWayWellType.WORKING_WELL as any) {
            wellType = 'WORKING_WELL';
        }

        let cornerStyle = 'ROUNDED';
        if (this.params.cornerStyle === this.tp.CornerStyle.ANGLED as any) {
            cornerStyle = 'ANGLED';
        } else if (this.params.cornerStyle === this.tp.CornerStyle.ROUNDED as any) {
            cornerStyle = 'ROUNDED';
        }

        let leftSectionType = 'RECTANGULAR';
        if (this.params.leftSection === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            leftSectionType = 'HORSESHOE';
        } else if (this.params.leftSection === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            leftSectionType = 'CIRCULAR';
        } else if (this.params.leftSection === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            leftSectionType = 'RECTANGULAR';
        }

        let rightSectionType = 'RECTANGULAR';
        if (this.params.rightSection === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            rightSectionType = 'HORSESHOE';
        } else if (this.params.rightSection === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            rightSectionType = 'CIRCULAR';
        } else if (this.params.rightSection === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            rightSectionType = 'RECTANGULAR';
        }

        let branchSection1Type = 'HORSESHOE';
        if (this.params.branchSection1 === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            branchSection1Type = 'RECTANGULAR';
        } else if (this.params.branchSection1 === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            branchSection1Type = 'CIRCULAR';
        } else if (this.params.branchSection1 === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            branchSection1Type = 'HORSESHOE';
        }

        let branchSection2Type = 'HORSESHOE';
        if (this.params.branchSection2 === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            branchSection2Type = 'RECTANGULAR';
        } else if (this.params.branchSection2 === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            branchSection2Type = 'CIRCULAR';
        } else if (this.params.branchSection2 === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            branchSection2Type = 'HORSESHOE';
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['wellType', wellType],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['cornerStyle', cornerStyle],
            ['cornerRadius', this.params.cornerRadius],
            ['branchLength', this.params.branchLength],
            ['branchWidth', this.params.branchWidth],
            ['topThickness', this.params.topThickness],
            ['bottomThickness', this.params.bottomThickness],
            ['outerWallThickness', this.params.outerWallThickness],
            ['innerWallThickness', this.params.innerWallThickness],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['leftSection', leftSectionType],
            ['rightSection', rightSectionType],
            ['branchSection1', branchSection1Type],
            ['branchSection2', branchSection2Type],
            ['shaftRadius', this.params.shaftRadius],
            ['cornerLength', this.params.cornerLength],
            ['cornerWidth', this.params.cornerWidth],
        ])) as FourWayWellObject;
    }
}

export class PipeRowPrimitive extends BasePrimitive<PipeRowParams, PipeRowObject> {

    constructor(tp: TopoInstance, params?: PipeRowObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.PipeRow;
    }

    setDefault(): Primitive<PipeRowParams, PipeRowObject> {
        this.params = {
            pipeType: 1,
            hasEnclosure: false,
            baseExtension: 20,
            baseThickness: 5,
            pipePositions: [
                new this.tp.gp_Pnt2d_3(-50, 40),
                new this.tp.gp_Pnt2d_3(0, 40),
                new this.tp.gp_Pnt2d_3(50, 40)],
            pipeInnerDiameters: [20, 30, 20],
            pipeWallThicknesses: [4, 4, 4],
            points: [
                { position: new this.tp.gp_Pnt_3(0, 0, 0), type: 0 },
                { position: new this.tp.gp_Pnt_3(300, 0, 30), type: 0 },
                { position: new this.tp.gp_Pnt_3(500, 300, 50), type: 1 },
                { position: new this.tp.gp_Pnt_3(300, 600, 20), type: 0 },
                { position: new this.tp.gp_Pnt_3(300, 800, 0), type: 0 },
            ],
            enclosureWidth: 0.0,
            enclosureHeight: 0.0,
            cushionExtension: 0.0,
            cushionThickness: 0.0,
            pullPipeInnerDiameter: 0.0,
            pullPipeThickness: 0.0
        };
        return this;
    }

    public setParams(params: PipeRowParams): Primitive<PipeRowParams, PipeRowObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.pipePositions.length !== this.params.pipeInnerDiameters.length ||
            this.params.pipePositions.length !== this.params.pipeWallThicknesses.length) {
            return false;
        }
        if (this.params.baseExtension <= 0 || this.params.baseThickness <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPipeRow(this.params), false);
        }
        throw new Error("Invalid parameters for PipeRow");
    }

    fromObject(o?: PipeRowObject): Primitive<PipeRowParams, PipeRowObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            pipeType: o['pipeType'],
            hasEnclosure: o['hasEnclosure'],
            enclosureWidth: o['enclosureWidth'],
            enclosureHeight: o['enclosureHeight'],
            baseExtension: o['baseExtension'],
            baseThickness: o['baseThickness'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            pipePositions: o['pipePositions']?.map((p: any) => new this.tp.gp_Pnt2d_3(p[0], p[1])) || [],
            pipeInnerDiameters: o['pipeInnerDiameters'] || [],
            pipeWallThicknesses: o['pipeWallThicknesses'] || [],
            pullPipeInnerDiameter: o['pullPipeInnerDiameter'],
            pullPipeThickness: o['pullPipeThickness'],
            points: o['points']?.map((p: any) => ({
                position: new this.tp.gp_Pnt_3(p.position[0], p.position[1], p.position[2]),
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): PipeRowObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['pipeType', this.params.pipeType],
            ['hasEnclosure', this.params.hasEnclosure],
            ['enclosureWidth', this.params.enclosureWidth],
            ['enclosureHeight', this.params.enclosureHeight],
            ['baseExtension', this.params.baseExtension],
            ['baseThickness', this.params.baseThickness],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['pipePositions', this.params.pipePositions.map((p) => ([p.X(), p.Y()]))],
            ['pipeInnerDiameters', this.params.pipeInnerDiameters],
            ['pipeWallThicknesses', this.params.pipeWallThicknesses],
            ['pullPipeInnerDiameter', this.params.pullPipeInnerDiameter],
            ['pullPipeThickness', this.params.pullPipeThickness],
            ['points', this.params.points.map((p) => ({
                position: [p.position.X(), p.position.Y(), p.position.Z()],
                type: p.type
            }))]
        ])) as PipeRowObject;
    }
}

export class CableTrenchPrimitive extends BasePrimitive<CableTrenchParams, CableTrenchObject> {

    constructor(tp: TopoInstance, params?: CableTrenchObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTrench;
    }

    setDefault(): Primitive<CableTrenchParams, CableTrenchObject> {
        this.params = {
            width: 60.0,
            height: 80.0,
            coverWidth: 64.0,
            coverThickness: 5.0,
            baseExtension: 10.0,
            baseThickness: 15.0,
            cushionExtension: 12.0,
            cushionThickness: 10.0,
            wallThickness: 15.0,
            wallThickness2: 10.0,
            points: [
                { position: new this.tp.gp_Pnt_3(0, 0, 0), type: 0 },
                { position: new this.tp.gp_Pnt_3(300, 0, 30), type: 0 },
                { position: new this.tp.gp_Pnt_3(500, 300, 50), type: 1 },
                { position: new this.tp.gp_Pnt_3(300, 600, 20), type: 0 },
                { position: new this.tp.gp_Pnt_3(300, 800, 0), type: 0 },
            ]
        };
        return this;
    }

    public setParams(params: CableTrenchParams): Primitive<CableTrenchParams, CableTrenchObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.width <= 0 || this.params.height <= 0) return false;
        if (this.params.coverThickness < 0 || this.params.baseThickness < 0 ||
            this.params.cushionThickness < 0 || this.params.wallThickness < 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableTrench(this.params), false);
        }
        throw new Error("Invalid parameters for CableTrench");
    }

    fromObject(o?: CableTrenchObject): Primitive<CableTrenchParams, CableTrenchObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            width: o['width'],
            height: o['height'],
            coverWidth: o['coverWidth'],
            coverThickness: o['coverThickness'],
            baseExtension: o['baseExtension'],
            baseThickness: o['baseThickness'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            wallThickness: o['wallThickness'],
            wallThickness2: o['wallThickness2'],
            points: o['points']?.map((p: any) => ({
                position: new this.tp.gp_Pnt_3(p.position[0], p.position[1], p.position[2]),
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): CableTrenchObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['width', this.params.width],
            ['height', this.params.height],
            ['coverWidth', this.params.coverWidth],
            ['coverThickness', this.params.coverThickness],
            ['baseExtension', this.params.baseExtension],
            ['baseThickness', this.params.baseThickness],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['wallThickness', this.params.wallThickness],
            ['wallThickness2', this.params.wallThickness2],
            ['points', this.params.points.map((p) => ({
                position: [p.position.X(), p.position.Y(), p.position.Z()],
                type: p.type
            }))]
        ])) as CableTrenchObject;
    }
}

export class CableTunnelPrimitive extends BasePrimitive<CableTunnelParams, CableTunnelObject> {

    constructor(tp: TopoInstance, params?: CableTunnelObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTunnel;
    }

    setDefault(): Primitive<CableTunnelParams, CableTunnelObject> {
        this.params = {
            style: this.tp.ConnectionSectionStyle.RECTANGULAR as any, // RECTANGULAR
            width: 60.0,
            height: 80.0,
            topThickness: 5.0,
            bottomThickness: 6.0,
            outerWallThickness: 7.0,
            cushionExtension: 5.0,
            cushionThickness: 8.0,
            points: [
                { position: new this.tp.gp_Pnt_3(0, 0, 0), type: 0 },
                { position: new this.tp.gp_Pnt_3(300, 0, 30), type: 0 },
                { position: new this.tp.gp_Pnt_3(500, 300, 50), type: 1 },
                { position: new this.tp.gp_Pnt_3(300, 600, 20), type: 0 },
                { position: new this.tp.gp_Pnt_3(300, 800, 0), type: 0 },
            ],
            innerWallThickness: 0.0,
            arcHeight: 0.0,
            bottomPlatformHeight: 0.0
        };
        return this;
    }

    public setParams(params: CableTunnelParams): Primitive<CableTunnelParams, CableTunnelObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.width <= 0 || this.params.height <= 0) return false;
        if (this.params.points.length < 2) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableTunnel(this.params), false);
        }
        throw new Error("Invalid parameters for CableTunnel");
    }

    fromObject(o?: CableTunnelObject): Primitive<CableTunnelParams, CableTunnelObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let style: ConnectionSectionStyle = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        if (o['style'] === 'RECTANGULAR') {
            style = this.tp.ConnectionSectionStyle.RECTANGULAR as any;
        } else if (o['style'] === 'HORSESHOE') {
            style = this.tp.ConnectionSectionStyle.HORSESHOE as any;
        } else if (o['style'] === 'CIRCULAR') {
            style = this.tp.ConnectionSectionStyle.CIRCULAR as any;
        }
        this.params = {
            style: style,
            width: o['width'],
            height: o['height'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            outerWallThickness: o['outerWallThickness'],
            innerWallThickness: o['innerWallThickness'],
            arcHeight: o['arcHeight'],
            bottomPlatformHeight: o['bottomPlatformHeight'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            points: o['points']?.map((p: any) => ({
                position: new this.tp.gp_Pnt_3(p.position[0], p.position[1], p.position[2]),
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): CableTunnelObject | undefined {
        let style = 'RECTANGULAR';
        if (this.params.style === this.tp.ConnectionSectionStyle.HORSESHOE as any) {
            style = 'HORSESHOE';
        } else if (this.params.style === this.tp.ConnectionSectionStyle.CIRCULAR as any) {
            style = 'CIRCULAR';
        } else if (this.params.style === this.tp.ConnectionSectionStyle.RECTANGULAR as any) {
            style = 'RECTANGULAR';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['style', style],
            ['width', this.params.width],
            ['height', this.params.height],
            ['topThickness', this.params.topThickness],
            ['bottomThickness', this.params.bottomThickness],
            ['outerWallThickness', this.params.outerWallThickness],
            ['innerWallThickness', this.params.innerWallThickness],
            ['arcHeight', this.params.arcHeight],
            ['bottomPlatformHeight', this.params.bottomPlatformHeight],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['points', this.params.points.map((p) => ({
                position: [p.position.X(), p.position.Y(), p.position.Z()],
                type: p.type
            }))]
        ])) as CableTunnelObject;
    }
}


// 添加桥架Primitive类
export class CableTrayPrimitive extends BasePrimitive<CableTrayParams, CableTrayObject> {

    constructor(tp: TopoInstance, params?: CableTrayObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTray;
    }

    setDefault(): Primitive<CableTrayParams, CableTrayObject> {
        this.params = {
            style: this.tp.CableTrayStyle.ARCH as any, // ARCH
            columnDiameter: 40.0,
            columnHeight: 100.0,
            span: 400.0,
            width: 60.0,
            height: 30.0,
            topPlateHeight: 5.0,
            arcHeight: 55.0,
            wallThickness: 3.0,
            pipeCount: 3,
            pipePositions: [
                new this.tp.gp_Pnt2d_3(-20, 15),
                new this.tp.gp_Pnt2d_3(0, 15),
                new this.tp.gp_Pnt2d_3(20, 15)
            ],
            pipeInnerDiameters: [10.0, 10.0, 10.0],
            pipeWallThicknesses: [2.0, 2.0, 2.0],
            hasProtectionPlate: true,
            points: [
                { position: new this.tp.gp_Pnt_3(0, 0, 0), type: 0 },
                { position: new this.tp.gp_Pnt_3(900, 500, 0), type: 0 },
            ]
        };
        return this;
    }

    public setParams(params: CableTrayParams): Primitive<CableTrayParams, CableTrayObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.width <= 0 || this.params.height <= 0 || this.params.span <= 0) {
            return false;
        }
        if (this.params.points.length < 2) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableTray(this.params), false);
        }
        throw new Error("Invalid parameters for CableTray");
    }

    fromObject(o?: CableTrayObject): Primitive<CableTrayParams, CableTrayObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let style: CableTrayStyle = this.tp.CableTrayStyle.ARCH as any;
        if (o['style'] === 'ARCH') {
            style = this.tp.CableTrayStyle.ARCH as any;
        } else if (o['style'] === 'BEAM') {
            style = this.tp.CableTrayStyle.BEAM as any;
        }

        this.params = {
            style: style,
            columnDiameter: o['columnDiameter'],
            columnHeight: o['columnHeight'],
            span: o['span'],
            width: o['width'],
            height: o['height'],
            topPlateHeight: o['topPlateHeight'],
            arcHeight: o['arcHeight'],
            wallThickness: o['wallThickness'],
            pipeCount: o['pipeCount'],
            pipePositions: o['pipePositions']?.map((p) => (new this.tp.gp_Pnt2d_3(p[0], p[1]))) || [],
            pipeInnerDiameters: o['pipeInnerDiameters'] || [],
            pipeWallThicknesses: o['pipeWallThicknesses'] || [],
            hasProtectionPlate: o['hasProtectionPlate'],
            points: o['points']?.map((p: any) => ({
                position: new this.tp.gp_Pnt_3(p.position[0], p.position[1], p.position[2]),
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): CableTrayObject | undefined {
        let style = 'ARCH';
        if (this.params.style === this.tp.CableTrayStyle.BEAM as any) {
            style = 'BEAM';
        } else if (this.params.style === this.tp.CableTrayStyle.ARCH as any) {
            style = 'ARCH';
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['style', style],
            ['columnDiameter', this.params.columnDiameter],
            ['columnHeight', this.params.columnHeight],
            ['span', this.params.span],
            ['width', this.params.width],
            ['height', this.params.height],
            ['topPlateHeight', this.params.topPlateHeight],
            ['arcHeight', this.params.arcHeight],
            ['wallThickness', this.params.wallThickness],
            ['pipeCount', this.params.pipeCount],
            ['pipePositions', this.params.pipePositions.map((p) => ([p.X(), p.Y()]))],
            ['pipeInnerDiameters', this.params.pipeInnerDiameters],
            ['pipeWallThicknesses', this.params.pipeWallThicknesses],
            ['hasProtectionPlate', this.params.hasProtectionPlate],
            ['points', this.params.points.map((p) => ({
                position: [p.position.X(), p.position.Y(), p.position.Z()],
                type: p.type
            }))]
        ])) as CableTrayObject;
    }
}

export class CableLBeamPrimitive extends BasePrimitive<CableLBeamParams, CableLBeamObject> {

    constructor(tp: TopoInstance, params?: CableLBeamObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableLBeam;
    }

    setDefault(): Primitive<CableLBeamParams> {
        this.params = {
            length: 300.0,
            width: 150.0,
            height: 200.0
        };
        return this;
    }

    public setParams(params: CableLBeamParams): Primitive<CableLBeamParams, CableLBeamObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.width <= 0 || this.params.height <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableLBeam(this.params), false);
        }
        throw new Error("Invalid parameters for CableLBeam");
    }

    fromObject(o?: CableLBeamObject): Primitive<CableLBeamParams, CableLBeamObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            height: o['height']
        };
        return this;
    }

    toObject(): CableLBeamObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height]
        ])) as CableLBeamObject;
    }
}

export class ManholePrimitive extends BasePrimitive<ManholeParams, ManholeObject> {

    constructor(tp: TopoInstance, params?: ManholeObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.Manhole;
    }

    setDefault(): Primitive<ManholeParams, ManholeObject> {
        this.params = {
            style: this.tp.ManholeStyle.CIRCULAR as any, // CIRCULAR
            length: 100.0,
            width: 0.0,
            height: 150.0,
            wallThickness: 10.0
        };
        return this;
    }

    public setParams(params: ManholeParams): Primitive<ManholeParams, ManholeObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.height <= 0 || this.params.wallThickness <= 0) {
            return false;
        }
        if (this.params.style === this.tp.ManholeStyle.RECTANGULAR && this.params.width <= 0) { // RECTANGULAR
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createManhole(this.params), false);
        }
        throw new Error("Invalid parameters for Manhole");
    }

    fromObject(o?: ManholeObject): Primitive<ManholeParams, ManholeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        let style: ManholeStyle = this.tp.ManholeStyle.CIRCULAR as any;
        if (o['style'] === 'RECTANGULAR') {
            style = this.tp.ManholeStyle.RECTANGULAR as any;
        } else if (o['style'] === 'CIRCULAR') {
            style = this.tp.ManholeStyle.CIRCULAR as any;
        }

        this.params = {
            style: style,
            length: o['length'],
            width: o['width'],
            height: o['height'],
            wallThickness: o['wallThickness']
        };
        return this;
    }

    toObject(): ManholeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['style', this.params.style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['wallThickness', this.params.wallThickness]
        ])) as ManholeObject;
    }
}

export class ManholeCoverPrimitive extends BasePrimitive<ManholeCoverParams, ManholeCoverObject> {

    constructor(tp: TopoInstance, params?: ManholeCoverObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.ManholeCover;
    }

    setDefault(): Primitive<ManholeCoverParams, ManholeCoverObject> {
        this.params = {
            style: this.tp.ManholeStyle.CIRCULAR as any, // CIRCULAR
            length: 100.0,
            width: 0.0,
            thickness: 10.0
        };
        return this;
    }

    public setParams(params: ManholeCoverParams): Primitive<ManholeCoverParams, ManholeCoverObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.thickness <= 0) {
            return false;
        }
        if (this.params.style === this.tp.ManholeStyle.RECTANGULAR && this.params.width <= 0) { // RECTANGULAR
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createManholeCover(this.params), false);
        }
        throw new Error("Invalid parameters for ManholeCover");
    }

    fromObject(o?: ManholeCoverObject): Primitive<ManholeCoverParams, ManholeCoverObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let style: ManholeCoverStyle = this.tp.ManholeCoverStyle.CIRCULAR as any;
        if (o['style'] === 'RECTANGULAR') {
            style = this.tp.ManholeCoverStyle.RECTANGULAR as any;
        } else if (o['style'] === 'CIRCULAR') {
            style = this.tp.ManholeCoverStyle.CIRCULAR as any;
        }

        this.params = {
            style: style,
            length: o['length'],
            width: o['width'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): ManholeCoverObject | undefined {
        let style = 'CIRCULAR';
        if (this.params.style === this.tp.ManholeCoverStyle.RECTANGULAR as any) {
            style = 'RECTANGULAR';
        } else if (this.params.style === this.tp.ManholeCoverStyle.CIRCULAR as any) {
            style = 'CIRCULAR';
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['style', style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness]
        ])) as ManholeCoverObject;
    }
}

export class LadderPrimitive extends BasePrimitive<LadderParams, LadderObject> {

    constructor(tp: TopoInstance, params?: LadderObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.Ladder;
    }

    setDefault(): Primitive<LadderParams> {
        this.params = {
            length: 3000.0,
            width: 400.0,
            thickness: 20.0
        };
        return this;
    }

    public setParams(params: LadderParams): Primitive<LadderParams, LadderObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.width <= 0 || this.params.thickness <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createLadder(this.params), false);
        }
        throw new Error("Invalid parameters for Ladder");
    }

    fromObject(o?: LadderObject): Primitive<LadderParams, LadderObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): LadderObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness]
        ])) as LadderObject;
    }
}

export class SumpPrimitive extends BasePrimitive<SumpParams, SumpObject> {

    constructor(tp: TopoInstance, params?: SumpObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.Sump;
    }

    setDefault(): Primitive<SumpParams, SumpObject> {
        this.params = {
            length: 500.0,
            width: 300.0,
            depth: 400.0,
            bottomThickness: 50.0
        };
        return this;
    }

    public setParams(params: SumpParams): Primitive<SumpParams, SumpObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.width <= 0 || this.params.depth <= 0) {
            return false;
        }
        if (this.params.bottomThickness < 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSump(this.params), false);
        }
        throw new Error("Invalid parameters for Sump");
    }

    fromObject(o?: SumpObject): Primitive<SumpParams, SumpObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            depth: o['depth'],
            bottomThickness: o['bottomThickness']
        };
        return this;
    }

    toObject(): SumpObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['depth', this.params.depth],
            ['bottomThickness', this.params.bottomThickness]
        ])) as SumpObject;
    }
}

export class FootpathPrimitive extends BasePrimitive<FootpathParams, FootpathObject> {

    constructor(tp: TopoInstance, params?: FootpathObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.Footpath;
    }

    setDefault(): Primitive<FootpathParams, FootpathObject> {
        this.params = {
            height: 15.0,
            width: 80.0,
            points: [
                { position: new this.tp.gp_Pnt_3(0, 0, 0), type: 0 },
                { position: new this.tp.gp_Pnt_3(900, 500, 0), type: 0 },
            ]
        };
        return this;
    }

    public setParams(params: FootpathParams): Primitive<FootpathParams, FootpathObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.height <= 0 || this.params.width <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createFootpath(this.params), false);
        }
        throw new Error("Invalid parameters for Footpath");
    }

    fromObject(o?: FootpathObject): Primitive<FootpathParams, FootpathObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            height: o['height'],
            width: o['width'],
            points: o['points'].map((p) => ({
                position: new this.tp.gp_Pnt_3(p.position[0], p.position[1], p.position[2]),
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): FootpathObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['width', this.params.width],
            ['points', this.params.points.map((t) => ({
                position: [t.position.X(), t.position.Y(), t.position.Z()],
                type: t.type
            }))]
        ])) as FootpathObject;
    }
}

export class ShaftChamberPrimitive extends BasePrimitive<ShaftChamberParams, ShaftChamberObject> {

    constructor(tp: TopoInstance, params?: ShaftChamberObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.ShaftChamber;
    }

    setDefault(): Primitive<ShaftChamberParams, ShaftChamberObject> {
        this.params = {
            supportWallThickness: 20.0,
            supportDiameter: 110.0,
            supportHeight: 50.0,
            topThickness: 8.0,
            innerDiameter: 80.0,
            workingHeight: 120.0,
            outerWallThickness: 12.0,
            innerWallThickness: 6.0
        };
        return this;
    }

    public setParams(params: ShaftChamberParams): Primitive<ShaftChamberParams, ShaftChamberObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.supportDiameter <= 0 || this.params.workingHeight <= 0) {
            return false;
        }
        if (this.params.supportWallThickness < 0 ||
            this.params.outerWallThickness < 0 ||
            this.params.innerWallThickness < 0 ||
            this.params.topThickness < 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createShaftChamber(this.params), false);
        }
        throw new Error("Invalid parameters for ShaftChamber");
    }

    fromObject(o?: ShaftChamberObject): Primitive<ShaftChamberParams, ShaftChamberObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            supportWallThickness: o['supportWallThickness'],
            supportDiameter: o['supportDiameter'],
            supportHeight: o['supportHeight'],
            topThickness: o['topThickness'],
            innerDiameter: o['innerDiameter'],
            workingHeight: o['workingHeight'],
            outerWallThickness: o['outerWallThickness'],
            innerWallThickness: o['innerWallThickness']
        };
        return this;
    }

    toObject(): ShaftChamberObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['supportWallThickness', this.params.supportWallThickness],
            ['supportDiameter', this.params.supportDiameter],
            ['supportHeight', this.params.supportHeight],
            ['topThickness', this.params.topThickness],
            ['innerDiameter', this.params.innerDiameter],
            ['workingHeight', this.params.workingHeight],
            ['outerWallThickness', this.params.outerWallThickness],
            ['innerWallThickness', this.params.innerWallThickness]
        ])) as ShaftChamberObject;
    }
}

export class TunnelCompartmentPartitionPrimitive extends BasePrimitive<TunnelCompartmentPartitionParams, TunnelCompartmentPartitionObject> {

    constructor(tp: TopoInstance, params?: TunnelCompartmentPartitionObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.TunnelCompartmentPartition;
    }

    setDefault(): Primitive<TunnelCompartmentPartitionParams, TunnelCompartmentPartitionObject> {
        this.params = {
            width: 300.0,
            thickness: 15.0
        };
        return this;
    }

    public setParams(params: TunnelCompartmentPartitionParams): Primitive<TunnelCompartmentPartitionParams, TunnelCompartmentPartitionObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.width <= 0 || this.params.thickness <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTunnelCompartmentPartition(this.params), false);
        }
        throw new Error("Invalid parameters for TunnelCompartmentPartition");
    }

    fromObject(o?: TunnelCompartmentPartitionObject): Primitive<TunnelCompartmentPartitionParams, TunnelCompartmentPartitionObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            width: o['width'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): TunnelCompartmentPartitionObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['width', this.params.width],
            ['thickness', this.params.thickness]
        ])) as TunnelCompartmentPartitionObject;
    }
}

export class VentilationPavilionPrimitive extends BasePrimitive<VentilationPavilionParams, VentilationPavilionObject> {

    constructor(tp: TopoInstance, params?: VentilationPavilionObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.VentilationPavilion;
    }

    setDefault(): Primitive<VentilationPavilionParams, VentilationPavilionObject> {
        this.params = {
            topLength: 400.0,
            middleLength: 300.0,
            bottomLength: 400.0,
            topWidth: 350.0,
            middleWidth: 250.0,
            bottomWidth: 350.0,
            topHeight: 50.0,
            height: 150.0,
            baseHeight: 30.0
        };
        return this;
    }

    public setParams(params: VentilationPavilionParams): Primitive<VentilationPavilionParams, VentilationPavilionObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.height <= 0 || this.params.baseHeight <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createVentilationPavilion(this.params), false);
        }
        throw new Error("Invalid parameters for VentilationPavilion");
    }

    fromObject(o?: VentilationPavilionObject): Primitive<VentilationPavilionParams, VentilationPavilionObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            topLength: o['topLength'],
            middleLength: o['middleLength'],
            bottomLength: o['bottomLength'],
            topWidth: o['topWidth'],
            middleWidth: o['middleWidth'],
            bottomWidth: o['bottomWidth'],
            topHeight: o['topHeight'],
            height: o['height'],
            baseHeight: o['baseHeight']
        };
        return this;
    }

    toObject(): VentilationPavilionObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['topLength', this.params.topLength],
            ['middleLength', this.params.middleLength],
            ['bottomLength', this.params.bottomLength],
            ['topWidth', this.params.topWidth],
            ['middleWidth', this.params.middleWidth],
            ['bottomWidth', this.params.bottomWidth],
            ['topHeight', this.params.topHeight],
            ['height', this.params.height],
            ['baseHeight', this.params.baseHeight]
        ])) as VentilationPavilionObject;
    }
}

export class TunnelPartitionBoardPrimitive extends BasePrimitive<TunnelPartitionBoardParams, TunnelPartitionBoardObject> {

    constructor(tp: TopoInstance, params?: TunnelPartitionBoardObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.TunnelPartitionBoard;
    }

    setDefault(): Primitive<TunnelPartitionBoardParams, TunnelPartitionBoardObject> {
        this.params = {
            style: 1,
            length: 200.0,
            width: 0.0,
            thickness: 10.0,
            holeCount: 4,
            holePositions: [
                new this.tp.gp_Pnt2d_3(50, 50),
                new this.tp.gp_Pnt2d_3(-50, 50),
                new this.tp.gp_Pnt2d_3(-50, -50),
                new this.tp.gp_Pnt2d_3(50, -50)
            ],
            holeStyles: [1, 1, 1, 1],
            holeDiameters: [20.0, 20.0, 20.0, 20.0],
            holeWidths: [0.0, 0.0, 0.0, 0.0]
        };
        return this;
    }

    public setParams(params: TunnelPartitionBoardParams): Primitive<TunnelPartitionBoardParams, TunnelPartitionBoardObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.thickness <= 0) {
            return false;
        }
        if (this.params.style !== 1 && this.params.style !== 2) {
            return false;
        }
        if (this.params.holeCount !== this.params.holePositions.length ||
            this.params.holeCount !== this.params.holeStyles.length ||
            this.params.holeCount !== this.params.holeDiameters.length ||
            this.params.holeCount !== this.params.holeWidths.length) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTunnelPartitionBoard(this.params), false);
        }
        throw new Error("Invalid parameters for TunnelPartitionBoard");
    }

    fromObject(o?: TunnelPartitionBoardObject): Primitive<TunnelPartitionBoardParams, TunnelPartitionBoardObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            style: o['style'],
            length: o['length'],
            width: o['width'],
            thickness: o['thickness'],
            holeCount: o['holeCount'],
            holePositions: o['holePositions'].map((t) => (new this.tp.gp_Pnt2d_3(t[0], t[1]))) || [],
            holeStyles: o['holeStyles'] || [],
            holeDiameters: o['holeDiameters'] || [],
            holeWidths: o['holeWidths'] || []
        };
        return this;
    }

    toObject(): TunnelPartitionBoardObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['style', this.params.style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['holeCount', this.params.holeCount],
            ['holePositions', this.params.holePositions.map((t) => ([t.X(), t.Y()]))],
            ['holeStyles', this.params.holeStyles],
            ['holeDiameters', this.params.holeDiameters],
            ['holeWidths', this.params.holeWidths]
        ])) as TunnelPartitionBoardObject;
    }
}

export class StraightVentilationDuctPrimitive extends BasePrimitive<StraightVentilationDuctParams, StraightVentilationDuctObject> {

    constructor(tp: TopoInstance, params?: StraightVentilationDuctObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.StraightVentilationDuct;
    }

    setDefault(): Primitive<StraightVentilationDuctParams, StraightVentilationDuctObject> {
        this.params = {
            diameter: 200.0,
            wallThickness: 10.0,
            height: 500.0
        };
        return this;
    }

    public setParams(params: StraightVentilationDuctParams): Primitive<StraightVentilationDuctParams, StraightVentilationDuctObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.diameter <= 0 || this.params.height <= 0) {
            return false;
        }
        if (this.params.wallThickness < 0 || this.params.wallThickness >= this.params.diameter / 2) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createStraightVentilationDuct(this.params), false);
        }
        throw new Error("Invalid parameters for StraightVentilationDuct");
    }

    fromObject(o?: StraightVentilationDuctObject): Primitive<StraightVentilationDuctParams, StraightVentilationDuctObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            diameter: o['diameter'],
            wallThickness: o['wallThickness'],
            height: o['height']
        };
        return this;
    }

    toObject(): StraightVentilationDuctObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['diameter', this.params.diameter],
            ['wallThickness', this.params.wallThickness],
            ['height', this.params.height]
        ])) as StraightVentilationDuctObject;
    }
}

export class ObliqueVentilationDuctPrimitive extends BasePrimitive<ObliqueVentilationDuctParams, ObliqueVentilationDuctObject> {

    constructor(tp: TopoInstance, params?: ObliqueVentilationDuctObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.ObliqueVentilationDuct;
    }

    setDefault(): Primitive<ObliqueVentilationDuctParams, ObliqueVentilationDuctObject> {
        this.params = {
            hoodRoomLength: 200.0,
            hoodRoomWidth: 150.0,
            hoodRoomHeight: 200.0,
            hoodWallThickness: 10.0,
            ductCenterHeight: 80.0,
            ductLeftDistance: 80.0,
            ductDiameter: 120.0,
            ductWallThickness: 8.0,
            ductLength: 300.0,
            ductHeightDifference: 50.0,
            baseLength: 220.0,
            baseWidth: 180.0,
            baseHeight: 10.0,
            baseRoomLength: 200.0,
            baseRoomWallThickness: 12.0,
            baseRoomWidth: 150.0,
            baseRoomHeight: 220.0
        };
        return this;
    }

    public setParams(params: ObliqueVentilationDuctParams): Primitive<ObliqueVentilationDuctParams, ObliqueVentilationDuctObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.hoodRoomLength <= 0 ||
            this.params.hoodRoomWidth <= 0 ||
            this.params.hoodRoomHeight <= 0) {
            return false;
        }
        if (this.params.ductDiameter <= 0 ||
            this.params.ductLength <= 0) {
            return false;
        }
        if (this.params.baseRoomLength <= 0 ||
            this.params.baseRoomWidth <= 0 ||
            this.params.baseRoomHeight <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createObliqueVentilationDuct(this.params), false);
        }
        throw new Error("Invalid parameters for ObliqueVentilationDuct");
    }

    fromObject(o?: ObliqueVentilationDuctObject): Primitive<ObliqueVentilationDuctParams, ObliqueVentilationDuctObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            hoodRoomLength: o['hoodRoomLength'],
            hoodRoomWidth: o['hoodRoomWidth'],
            hoodRoomHeight: o['hoodRoomHeight'],
            hoodWallThickness: o['hoodWallThickness'],
            ductCenterHeight: o['ductCenterHeight'],
            ductLeftDistance: o['ductLeftDistance'],
            ductDiameter: o['ductDiameter'],
            ductWallThickness: o['ductWallThickness'],
            ductLength: o['ductLength'],
            ductHeightDifference: o['ductHeightDifference'],
            baseLength: o['baseLength'],
            baseWidth: o['baseWidth'],
            baseHeight: o['baseHeight'],
            baseRoomLength: o['baseRoomLength'],
            baseRoomWallThickness: o['baseRoomWallThickness'],
            baseRoomWidth: o['baseRoomWidth'],
            baseRoomHeight: o['baseRoomHeight']
        };
        return this;
    }

    toObject(): ObliqueVentilationDuctObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['hoodRoomLength', this.params.hoodRoomLength],
            ['hoodRoomWidth', this.params.hoodRoomWidth],
            ['hoodRoomHeight', this.params.hoodRoomHeight],
            ['hoodWallThickness', this.params.hoodWallThickness],
            ['ductCenterHeight', this.params.ductCenterHeight],
            ['ductLeftDistance', this.params.ductLeftDistance],
            ['ductDiameter', this.params.ductDiameter],
            ['ductWallThickness', this.params.ductWallThickness],
            ['ductLength', this.params.ductLength],
            ['ductHeightDifference', this.params.ductHeightDifference],
            ['baseLength', this.params.baseLength],
            ['baseWidth', this.params.baseWidth],
            ['baseHeight', this.params.baseHeight],
            ['baseRoomLength', this.params.baseRoomLength],
            ['baseRoomWallThickness', this.params.baseRoomWallThickness],
            ['baseRoomWidth', this.params.baseRoomWidth],
            ['baseRoomHeight', this.params.baseRoomHeight]
        ])) as ObliqueVentilationDuctObject;
    }
}

export class DrainageWellPrimitive extends BasePrimitive<DrainageWellParams, DrainageWellObject> {

    constructor(tp: TopoInstance, params?: DrainageWellObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.DrainageWell;
    }

    setDefault(): Primitive<DrainageWellParams, DrainageWellObject> {
        this.params = {
            length: 500.0,
            width: 300.0,
            height: 300.0,
            neckDiameter: 150.0,
            neckHeight: 400.0,
            cushionExtension: 50.0,
            bottomThickness: 60.0,
            wallThickness: 20.0
        };
        return this;
    }

    public setParams(params: DrainageWellParams): Primitive<DrainageWellParams, DrainageWellObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 ||
            this.params.width <= 0 ||
            this.params.height <= 0) {
            return false;
        }
        if (this.params.wallThickness < 0 ||
            this.params.bottomThickness < 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createDrainageWell(this.params), false);
        }
        throw new Error("Invalid parameters for DrainageWell");
    }

    fromObject(o?: DrainageWellObject): Primitive<DrainageWellParams, DrainageWellObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            height: o['height'],
            neckDiameter: o['neckDiameter'],
            neckHeight: o['neckHeight'],
            cushionExtension: o['cushionExtension'],
            bottomThickness: o['bottomThickness'],
            wallThickness: o['wallThickness']
        };
        return this;
    }

    toObject(): DrainageWellObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['neckDiameter', this.params.neckDiameter],
            ['neckHeight', this.params.neckHeight],
            ['cushionExtension', this.params.cushionExtension],
            ['bottomThickness', this.params.bottomThickness],
            ['wallThickness', this.params.wallThickness]
        ])) as DrainageWellObject;
    }
}

// 添加管枕Primitive类
export class PipeSupportPrimitive extends BasePrimitive<PipeSupportParams, PipeSupportObject> {

    constructor(tp: TopoInstance, params?: PipeSupportObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.PipeSupport;
    }

    setDefault(): Primitive<PipeSupportParams, PipeSupportObject> {
        this.params = {
            style: 2,
            count: 8,
            positions: [
                new this.tp.gp_Pnt2d_3(-10, 12),
                new this.tp.gp_Pnt2d_3(-30, 12),
                new this.tp.gp_Pnt2d_3(10, 12),
                new this.tp.gp_Pnt2d_3(30, 12),
                new this.tp.gp_Pnt2d_3(-10, -12),
                new this.tp.gp_Pnt2d_3(-30, -12),
                new this.tp.gp_Pnt2d_3(10, -12),
                new this.tp.gp_Pnt2d_3(30, -12)
            ],
            radii: [8, 8, 8, 8, 8, 8, 8, 8],
            length: 100,
            width: 18,
            height: 26
        };
        return this;
    }

    public setParams(params: PipeSupportParams): Primitive<PipeSupportParams, PipeSupportObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.length <= 0 || this.params.height <= 0) {
            return false;
        }
        if (this.params.style !== 1 && this.params.style !== 2) {
            return false;
        }
        if (this.params.count !== this.params.positions.length ||
            this.params.count !== this.params.radii.length) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPipeSupport(this.params), false);
        }
        throw new Error("Invalid parameters for PipeSupport");
    }

    fromObject(o?: PipeSupportObject): Primitive<PipeSupportParams, PipeSupportObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            style: o['style'],
            count: o['count'],
            positions: o['positions'].map((p: any) => (new this.tp.gp_Pnt2d_3(p[0], p[1]))),
            radii: o['radii'],
            length: o['length'],
            width: o['width'],
            height: o['height']
        };
        return this;
    }

    toObject(): PipeSupportObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['style', this.params.style],
            ['count', this.params.count],
            ['positions', this.params.positions.map((p: any) => ([p.X(), p.Y()]))],
            ['radii', this.params.radii],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height]
        ])) as PipeSupportObject;
    }
}

export class CoverPlatePrimitive extends BasePrimitive<CoverPlateParams, CoverPlateObject> {

    constructor(tp: TopoInstance, params?: CoverPlateObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CoverPlate;
    }

    setDefault(): Primitive<CoverPlateParams, CoverPlateObject> {
        this.params = {
            style: "0",
            length: 200.0,
            width: 100.0,
            smallRadius: 0,
            largeRadius: 0,
            thickness: 10.0
        };
        return this;
    }

    public setParams(params: CoverPlateParams): Primitive<CoverPlateParams, CoverPlateObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.thickness <= 0) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCoverPlate(this.params), false);
        }
        throw new Error("Invalid parameters for CoverPlate");
    }

    fromObject(o?: CoverPlateObject): Primitive<CoverPlateParams, CoverPlateObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            style: o['style'],
            length: o['length'],
            width: o['width'],
            smallRadius: o['smallRadius'],
            largeRadius: o['largeRadius'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): CoverPlateObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['style', this.params.style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['smallRadius', this.params.smallRadius],
            ['largeRadius', this.params.largeRadius],
            ['thickness', this.params.thickness]
        ])) as CoverPlateObject;
    }
}

export class CableRayPrimitive extends BasePrimitive<CableRayParams, CableRayObject> {

    constructor(tp: TopoInstance, params?: CableRayObject) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableRay;
    }

    setDefault(): Primitive<CableRayParams, CableRayObject> {
        this.params = {
            outerLength: 300.0,
            outerHeight: 100.0,
            innerLength: 280.0,
            innerHeight: 80.0,
            coverThickness: 5.0
        };
        return this;
    }

    public setParams(params: CableRayParams): Primitive<CableRayParams, CableRayObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.outerLength <= 0 ||
            this.params.outerHeight <= 0 ||
            this.params.innerLength <= 0 ||
            this.params.innerHeight <= 0 ||
            this.params.coverThickness <= 0) {
            return false;
        }
        if (this.params.innerLength >= this.params.outerLength ||
            this.params.innerHeight >= this.params.outerHeight) {
            return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCableRay(this.params), false);
        }
        throw new Error("Invalid parameters for CableRay");
    }

    fromObject(o?: CableRayObject): Primitive<CableRayParams, CableRayObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            outerLength: o['outerLength'],
            outerHeight: o['outerHeight'],
            innerLength: o['innerLength'],
            innerHeight: o['innerHeight'],
            coverThickness: o['coverThickness']
        };
        return this;
    }

    toObject(): CableRayObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['outerLength', this.params.outerLength],
            ['outerHeight', this.params.outerHeight],
            ['innerLength', this.params.innerLength],
            ['innerHeight', this.params.innerHeight],
            ['coverThickness', this.params.coverThickness]
        ])) as CableRayObject;
    }
}

export function createECPrimitive(tp: TopoInstance, args?: ECPrimitiveType | any): ECPrimitive | undefined {
    if (args === undefined) {
        return undefined;
    }
    let type: ECPrimitiveType | undefined = undefined;
    let obj: any = undefined;
    if (args && args['type'] !== undefined) {
        type = args['type'];
        obj = args;
    } else if (typeof args === 'string') {
        type = args as ECPrimitiveType;
    }
    let primitive: ECPrimitive | undefined = undefined;

    switch (type) {
        case ECPrimitiveType.CableWire:
            primitive = new CableWirePrimitive(tp);
            break;
        case ECPrimitiveType.CableJoint:
            primitive = new CableJointPrimitive(tp);
            break;
        case ECPrimitiveType.OpticalFiberBox:
            primitive = new OpticalFiberBoxPrimitive(tp);
            break;
        case ECPrimitiveType.CableTerminal:
            primitive = new CableTerminalPrimitive(tp);
            break;
        case ECPrimitiveType.CableAccessory:
            primitive = new CableAccessoryPrimitive(tp);
            break;
        case ECPrimitiveType.CableBracket:
            primitive = new CableBracketPrimitive(tp);
            break;
        case ECPrimitiveType.CableClamp:
            primitive = new CableClampPrimitive(tp);
            break;
        case ECPrimitiveType.CablePole:
            primitive = new CablePolePrimitive(tp);
            break;
        case ECPrimitiveType.GroundFlatIron:
            primitive = new GroundFlatIronPrimitive(tp);
            break;
        case ECPrimitiveType.EmbeddedPart:
            primitive = new EmbeddedPartPrimitive(tp);
            break;
        case ECPrimitiveType.UShapedRing:
            primitive = new UShapedRingPrimitive(tp);
            break;
        case ECPrimitiveType.LiftingEye:
            primitive = new LiftingEyePrimitive(tp);
            break;
        case ECPrimitiveType.CornerWell:
            primitive = new CornerWellPrimitive(tp);
            break;
        case ECPrimitiveType.TunnelWell:
            primitive = new TunnelWellPrimitive(tp);
            break;
        case ECPrimitiveType.ThreeWayWell:
            primitive = new ThreeWayWellPrimitive(tp);
            break;
        case ECPrimitiveType.FourWayWell:
            primitive = new FourWayWellPrimitive(tp);
            break;
        case ECPrimitiveType.PipeRow:
            primitive = new PipeRowPrimitive(tp);
            break;
        case ECPrimitiveType.CableTrench:
            primitive = new CableTrenchPrimitive(tp);
            break;
        case ECPrimitiveType.CableTunnel:
            primitive = new CableTunnelPrimitive(tp);
            break;
        case ECPrimitiveType.CableTray:
            primitive = new CableTrayPrimitive(tp);
            break;
        case ECPrimitiveType.CableLBeam:
            primitive = new CableLBeamPrimitive(tp);
            break;
        case ECPrimitiveType.Manhole:
            primitive = new ManholePrimitive(tp);
            break;
        case ECPrimitiveType.ManholeCover:
            primitive = new ManholeCoverPrimitive(tp);
            break;
        case ECPrimitiveType.Ladder:
            primitive = new LadderPrimitive(tp);
            break;
        case ECPrimitiveType.Sump:
            primitive = new SumpPrimitive(tp);
            break;
        case ECPrimitiveType.Footpath:
            primitive = new FootpathPrimitive(tp);
            break;
        case ECPrimitiveType.ShaftChamber:
            primitive = new ShaftChamberPrimitive(tp);
            break;
        case ECPrimitiveType.TunnelCompartmentPartition:
            primitive = new TunnelCompartmentPartitionPrimitive(tp);
            break;
        case ECPrimitiveType.VentilationPavilion:
            primitive = new VentilationPavilionPrimitive(tp);
            break;
        case ECPrimitiveType.TunnelPartitionBoard:
            primitive = new TunnelPartitionBoardPrimitive(tp);
            break;
        case ECPrimitiveType.StraightVentilationDuct:
            primitive = new StraightVentilationDuctPrimitive(tp);
            break;
        case ECPrimitiveType.ObliqueVentilationDuct:
            primitive = new ObliqueVentilationDuctPrimitive(tp);
            break;
        case ECPrimitiveType.DrainageWell:
            primitive = new DrainageWellPrimitive(tp);
            break;
        case ECPrimitiveType.PipeSupport:
            primitive = new PipeSupportPrimitive(tp);
            break;
        case ECPrimitiveType.CoverPlate:
            primitive = new CoverPlatePrimitive(tp);
            break;
        case ECPrimitiveType.CableRay:
            primitive = new CableRayPrimitive(tp);
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