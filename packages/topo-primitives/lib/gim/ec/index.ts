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
    CableRayParams
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../../primitive";

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

export class CableWirePrimitive extends BasePrimitive<CableWireParams> {

    constructor(tp: TopoInstance, params?: CableWireParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableWire;
    }

    setDefault(): Primitive<CableWireParams> {
        this.params = {
            points: [
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Pnt_3(100, 0, 0)
            ],
            outsideDiameter: 10.0
        };
        return this;
    }

    public setParams(params: CableWireParams): Primitive<CableWireParams> {
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

    fromObject(o: any): Primitive<CableWireParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            points: o['points'].map((p: any) =>
                new this.tp.gp_Pnt_3(p.x, p.y, p.z)),
            outsideDiameter: o['outsideDiameter']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['points', this.params.points.map(p =>
                ({ x: p.X(), y: p.Y(), z: p.Z() }))],
            ['outsideDiameter', this.params.outsideDiameter]
        ]));
    }
}


export class CableJointPrimitive extends BasePrimitive<CableJointParams> {

    constructor(tp: TopoInstance, params?: CableJointParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableJoint;
    }

    setDefault(): Primitive<CableJointParams> {
        this.params = {
            length: 100.0,
            outerDiameter: 30.0,
            terminalLength: 20.0,
            innerDiameter: 20.0
        };
        return this;
    }

    public setParams(params: CableJointParams): Primitive<CableJointParams> {
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

    fromObject(o: any): Primitive<CableJointParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            outerDiameter: o['outerDiameter'],
            terminalLength: o['terminalLength'],
            innerDiameter: o['innerDiameter']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['outerDiameter', this.params.outerDiameter],
            ['terminalLength', this.params.terminalLength],
            ['innerDiameter', this.params.innerDiameter]
        ]));
    }
}


// 添加光缆接头盒Primitive类
export class OpticalFiberBoxPrimitive extends BasePrimitive<OpticalFiberBoxParams> {

    constructor(tp: TopoInstance, params?: OpticalFiberBoxParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.OpticalFiberBox;
    }

    setDefault(): Primitive<OpticalFiberBoxParams> {
        this.params = {
            length: 300.0,
            height: 150.0,
            width: 200.0
        };
        return this;
    }

    public setParams(params: OpticalFiberBoxParams): Primitive<OpticalFiberBoxParams> {
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

    fromObject(o: any): Primitive<OpticalFiberBoxParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            height: o['height'],
            width: o['width']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['height', this.params.height],
            ['width', this.params.width]
        ]));
    }
}


export class CableTerminalPrimitive extends BasePrimitive<CableTerminalParams> {

    constructor(tp: TopoInstance, params?: CableTerminalParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTerminal;
    }

    setDefault(): Primitive<CableTerminalParams> {
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

    public setParams(params: CableTerminalParams): Primitive<CableTerminalParams> {
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

    fromObject(o: any): Primitive<CableTerminalParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
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
        ]));
    }
}

export class CableAccessoryPrimitive extends BasePrimitive<CableAccessoryParams> {

    constructor(tp: TopoInstance, params?: CableAccessoryParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableAccessory;
    }

    setDefault(): Primitive<CableAccessoryParams> {
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

    public setParams(params: CableAccessoryParams): Primitive<CableAccessoryParams> {
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

    fromObject(o: any): Primitive<CableAccessoryParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['portCount', this.params.portCount],
            ['portDiameter', this.params.portDiameter],
            ['portSpacing', this.params.portSpacing],
            ['backPanelDistance', this.params.backPanelDistance],
            ['sidePanelDistance', this.params.sidePanelDistance]
        ]));
    }
}

export class CableBracketPrimitive extends BasePrimitive<CableBracketParams> {

    constructor(tp: TopoInstance, params?: CableBracketParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableBracket;
    }

    setDefault(): Primitive<CableBracketParams> {
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

    public setParams(params: CableBracketParams): Primitive<CableBracketParams> {
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

    fromObject(o: any): Primitive<CableBracketParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            rootHeight: o['rootHeight'],
            rootWidth: o['rootWidth'],
            width: o['width'],
            topThickness: o['topThickness'],
            rootThickness: o['rootThickness'],
            columnMountPoints: o['columnMountPoints'] || [],
            clampMountPoints: o['clampMountPoints'] || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['rootHeight', this.params.rootHeight],
            ['rootWidth', this.params.rootWidth],
            ['width', this.params.width],
            ['topThickness', this.params.topThickness],
            ['rootThickness', this.params.rootThickness],
            ['columnMountPoints', this.params.columnMountPoints],
            ['clampMountPoints', this.params.clampMountPoints]
        ]));
    }
}

export class CableClampPrimitive extends BasePrimitive<CableClampParams> {

    constructor(tp: TopoInstance, params?: CableClampParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableClamp;
    }

    setDefault(): Primitive<CableClampParams> {
        this.params = {
            type: this.tp.CableClampType.SINGLE as any, // SINGLE
            diameter: 50.0,
            thickness: 10.0,
            width: 30.0
        };
        return this;
    }

    public setParams(params: CableClampParams): Primitive<CableClampParams> {
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

    fromObject(o: any): Primitive<CableClampParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            type: o['type'],
            diameter: o['diameter'],
            thickness: o['thickness'],
            width: o['width']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['diameter', this.params.diameter],
            ['thickness', this.params.thickness],
            ['width', this.params.width]
        ]));
    }
}


export class CablePolePrimitive extends BasePrimitive<CablePoleParams> {

    constructor(tp: TopoInstance, params?: CablePoleParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CablePole;
    }

    setDefault(): Primitive<CablePoleParams> {
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

    public setParams(params: CablePoleParams): Primitive<CablePoleParams> {
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

    fromObject(o: any): Primitive<CablePoleParams> {
        if (o === undefined) {
            return this;
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
            mountPoints: o['mountPoints'] || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['specification', this.params.specification],
            ['length', this.params.length],
            ['radius', this.params.radius],
            ['arcAngle', this.params.arcAngle],
            ['width', this.params.width],
            ['fixedLegLength', this.params.fixedLegLength],
            ['fixedLegWidth', this.params.fixedLegWidth],
            ['thickness', this.params.thickness],
            ['mountPoints', this.params.mountPoints]
        ]));
    }
}

export class GroundFlatIronPrimitive extends BasePrimitive<GroundFlatIronParams> {

    constructor(tp: TopoInstance, params?: GroundFlatIronParams) {
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

    public setParams(params: GroundFlatIronParams): Primitive<GroundFlatIronParams> {
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

    fromObject(o: any): Primitive<GroundFlatIronParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            height: o['height'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['height', this.params.height],
            ['thickness', this.params.thickness]
        ]));
    }
}

export class EmbeddedPartPrimitive extends BasePrimitive<EmbeddedPartParams> {

    constructor(tp: TopoInstance, params?: EmbeddedPartParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.EmbeddedPart;
    }

    setDefault(): Primitive<EmbeddedPartParams> {
        this.params = {
            length: 100.0,
            radius: 20.0,
            height: 50.0,
            materialRadius: 5.0,
            lowerLength: 30.0
        };
        return this;
    }

    public setParams(params: EmbeddedPartParams): Primitive<EmbeddedPartParams> {
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

    fromObject(o: any): Primitive<EmbeddedPartParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['radius', this.params.radius],
            ['height', this.params.height],
            ['materialRadius', this.params.materialRadius],
            ['lowerLength', this.params.lowerLength]
        ]));
    }
}


// 添加U型拉环Primitive类
export class UShapedRingPrimitive extends BasePrimitive<UShapedRingParams> {

    constructor(tp: TopoInstance, params?: UShapedRingParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.UShapedRing;
    }

    setDefault(): Primitive<UShapedRingParams> {
        this.params = {
            thickness: 5.0,
            height: 30.0,
            radius: 25.0,
            length: 100.0
        };
        return this;
    }

    public setParams(params: UShapedRingParams): Primitive<UShapedRingParams> {
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

    fromObject(o: any): Primitive<UShapedRingParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            thickness: o['thickness'],
            height: o['height'],
            radius: o['radius'],
            length: o['length']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['thickness', this.params.thickness],
            ['height', this.params.height],
            ['radius', this.params.radius],
            ['length', this.params.length]
        ]));
    }
}

export class LiftingEyePrimitive extends BasePrimitive<LiftingEyeParams> {

    constructor(tp: TopoInstance, params?: LiftingEyeParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.LiftingEye;
    }

    setDefault(): Primitive<LiftingEyeParams> {
        this.params = {
            height: 100.0,
            ringRadius: 25.0,
            pipeDiameter: 10.0
        };
        return this;
    }

    public setParams(params: LiftingEyeParams): Primitive<LiftingEyeParams> {
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

    fromObject(o: any): Primitive<LiftingEyeParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            height: o['height'],
            ringRadius: o['ringRadius'],
            pipeDiameter: o['pipeDiameter']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['height', this.params.height],
            ['ringRadius', this.params.ringRadius],
            ['pipeDiameter', this.params.pipeDiameter]
        ]));
    }
}

export class CornerWellPrimitive extends BasePrimitive<CornerWellParams> {

    constructor(tp: TopoInstance, params?: CornerWellParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CornerWell;
    }

    setDefault(): Primitive<CornerWellParams> {
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

    public setParams(params: CornerWellParams): Primitive<CornerWellParams> {
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

    fromObject(o: any): Primitive<CornerWellParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
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
        ]));
    }
}

export class TunnelWellPrimitive extends BasePrimitive<TunnelWellParams> {

    constructor(tp: TopoInstance, params?: TunnelWellParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.TunnelWell;
    }

    setDefault(): Primitive<TunnelWellParams> {
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

    public setParams(params: TunnelWellParams): Primitive<TunnelWellParams> {
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

    fromObject(o: any): Primitive<TunnelWellParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            type: o['type'],
            length: o['length'],
            width: o['width'],
            height: o['height'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            outerWallThickness: o['outerWallThickness'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            leftSectionType: o['leftSectionType'],
            leftLength: o['leftLength'],
            leftWidth: o['leftWidth'],
            leftHeight: o['leftHeight'],
            leftArcHeight: o['leftArcHeight'],
            rightSectionType: o['rightSectionType'],
            rightLength: o['rightLength'],
            rightWidth: o['rightWidth'],
            rightHeight: o['rightHeight'],
            rightArcHeight: o['rightArcHeight'],
            radius: o['radius'],
            innerWallThickness: o['innerWallThickness']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['type', this.params.type],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['radius', this.params.radius],
            ['topThickness', this.params.topThickness],
            ['bottomThickness', this.params.bottomThickness],
            ['outerWallThickness', this.params.outerWallThickness],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['leftSectionType', this.params.leftSectionType],
            ['leftLength', this.params.leftLength],
            ['leftWidth', this.params.leftWidth],
            ['leftHeight', this.params.leftHeight],
            ['leftArcHeight', this.params.leftArcHeight],
            ['rightSectionType', this.params.rightSectionType],
            ['rightLength', this.params.rightLength],
            ['rightWidth', this.params.rightWidth],
            ['rightHeight', this.params.rightHeight],
            ['rightArcHeight', this.params.rightArcHeight],
            ['innerWallThickness', this.params.innerWallThickness]
        ]));
    }
}


// 添加三通井Primitive类
export class ThreeWayWellPrimitive extends BasePrimitive<ThreeWayWellParams> {

    constructor(tp: TopoInstance, params?: ThreeWayWellParams) {
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

    public setParams(params: ThreeWayWellParams): Primitive<ThreeWayWellParams> {
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

    fromObject(o: any): Primitive<ThreeWayWellParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            type: o['type'],
            cornerType: o['cornerType'],
            shaftType: o['shaftType'],
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
            leftSectionStyle: o['leftSectionStyle'],
            leftSectionLength: o['leftSectionLength'],
            leftSectionWidth: o['leftSectionWidth'],
            leftSectionHeight: o['leftSectionHeight'],
            leftSectionArcHeight: o['leftSectionArcHeight'],
            rightSectionStyle: o['rightSectionStyle'],
            rightSectionLength: o['rightSectionLength'],
            rightSectionWidth: o['rightSectionWidth'],
            rightSectionHeight: o['rightSectionHeight'],
            rightSectionArcHeight: o['rightSectionArcHeight'],
            branchSectionStyle: o['branchSectionStyle'],
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['type', this.params.type],
            ['cornerType', this.params.cornerType],
            ['shaftType', this.params.shaftType],
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
            ['leftSectionStyle', this.params.leftSectionStyle],
            ['leftSectionLength', this.params.leftSectionLength],
            ['leftSectionWidth', this.params.leftSectionWidth],
            ['leftSectionHeight', this.params.leftSectionHeight],
            ['leftSectionArcHeight', this.params.leftSectionArcHeight],
            ['rightSectionStyle', this.params.rightSectionStyle],
            ['rightSectionLength', this.params.rightSectionLength],
            ['rightSectionWidth', this.params.rightSectionWidth],
            ['rightSectionHeight', this.params.rightSectionHeight],
            ['rightSectionArcHeight', this.params.rightSectionArcHeight],
            ['branchSectionStyle', this.params.branchSectionStyle],
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
        ]));
    }
}

export class FourWayWellPrimitive extends BasePrimitive<FourWayWellParams> {

    constructor(tp: TopoInstance, params?: FourWayWellParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.FourWayWell;
    }

    setDefault(): Primitive<FourWayWellParams> {
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

    public setParams(params: FourWayWellParams): Primitive<FourWayWellParams> {
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

    fromObject(o: any): Primitive<FourWayWellParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            type: o['type'],
            length: o['length'],
            width: o['width'],
            height: o['height'],
            cornerStyle: o['cornerStyle'],
            cornerRadius: o['cornerRadius'],
            branchLength: o['branchLength'],
            branchWidth: o['branchWidth'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            outerWallThickness: o['outerWallThickness'],
            innerWallThickness: o['innerWallThickness'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            leftSection: o['leftSection'],
            rightSection: o['rightSection'],
            branchSection1: o['branchSection1'],
            branchSection2: o['branchSection2'],
            shaftRadius: o['shaftRadius'],
            cornerLength: o['cornerLength'],
            cornerWidth: o['cornerWidth'],
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['type', this.params.type],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['cornerStyle', this.params.cornerStyle],
            ['cornerRadius', this.params.cornerRadius],
            ['branchLength', this.params.branchLength],
            ['branchWidth', this.params.branchWidth],
            ['topThickness', this.params.topThickness],
            ['bottomThickness', this.params.bottomThickness],
            ['outerWallThickness', this.params.outerWallThickness],
            ['innerWallThickness', this.params.innerWallThickness],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['leftSection', this.params.leftSection],
            ['rightSection', this.params.rightSection],
            ['branchSection1', this.params.branchSection1],
            ['branchSection2', this.params.branchSection2],
            ['shaftRadius', this.params.shaftRadius],
            ['cornerLength', this.params.cornerLength],
            ['cornerWidth', this.params.cornerWidth],
        ]));
    }
}

export class PipeRowPrimitive extends BasePrimitive<PipeRowParams> {

    constructor(tp: TopoInstance, params?: PipeRowParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.PipeRow;
    }

    setDefault(): Primitive<PipeRowParams> {
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

    public setParams(params: PipeRowParams): Primitive<PipeRowParams> {
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

    fromObject(o: any): Primitive<PipeRowParams> {
        if (o === undefined) {
            return this;
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
            pipePositions: o['pipePositions']?.map((p: any) => ({ x: p.x, y: p.y })) || [],
            pipeInnerDiameters: o['pipeInnerDiameters'] || [],
            pipeWallThicknesses: o['pipeWallThicknesses'] || [],
            pullPipeInnerDiameter: o['pullPipeInnerDiameter'],
            pullPipeThickness: o['pullPipeThickness'],
            points: o['points']?.map((p: any) => ({
                position: { x: p.position.x, y: p.position.y, z: p.position.z },
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['pipeType', this.params.pipeType],
            ['hasEnclosure', this.params.hasEnclosure],
            ['enclosureWidth', this.params.enclosureWidth],
            ['enclosureHeight', this.params.enclosureHeight],
            ['baseExtension', this.params.baseExtension],
            ['baseThickness', this.params.baseThickness],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['pipePositions', this.params.pipePositions],
            ['pipeInnerDiameters', this.params.pipeInnerDiameters],
            ['pipeWallThicknesses', this.params.pipeWallThicknesses],
            ['pullPipeInnerDiameter', this.params.pullPipeInnerDiameter],
            ['pullPipeThickness', this.params.pullPipeThickness],
            ['points', this.params.points]
        ]));
    }
}

export class CableTrenchPrimitive extends BasePrimitive<CableTrenchParams> {

    constructor(tp: TopoInstance, params?: CableTrenchParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTrench;
    }

    setDefault(): Primitive<CableTrenchParams> {
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

    public setParams(params: CableTrenchParams): Primitive<CableTrenchParams> {
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

    fromObject(o: any): Primitive<CableTrenchParams> {
        if (o === undefined) {
            return this;
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
                position: { x: p.position.x, y: p.position.y, z: p.position.z },
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
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
            ['points', this.params.points]
        ]));
    }
}

export class CableTunnelPrimitive extends BasePrimitive<CableTunnelParams> {

    constructor(tp: TopoInstance, params?: CableTunnelParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTunnel;
    }

    setDefault(): Primitive<CableTunnelParams> {
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

    public setParams(params: CableTunnelParams): Primitive<CableTunnelParams> {
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

    fromObject(o: any): Primitive<CableTunnelParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            style: o['style'],
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
                position: { x: p.position.x, y: p.position.y, z: p.position.z },
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['style', this.params.style],
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
            ['points', this.params.points]
        ]));
    }
}


// 添加桥架Primitive类
export class CableTrayPrimitive extends BasePrimitive<CableTrayParams> {

    constructor(tp: TopoInstance, params?: CableTrayParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableTray;
    }

    setDefault(): Primitive<CableTrayParams> {
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

    public setParams(params: CableTrayParams): Primitive<CableTrayParams> {
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

    fromObject(o: any): Primitive<CableTrayParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            style: o['style'],
            columnDiameter: o['columnDiameter'],
            columnHeight: o['columnHeight'],
            span: o['span'],
            width: o['width'],
            height: o['height'],
            topPlateHeight: o['topPlateHeight'],
            arcHeight: o['arcHeight'],
            wallThickness: o['wallThickness'],
            pipeCount: o['pipeCount'],
            pipePositions: o['pipePositions']?.map((p: any) => ({ x: p.x, y: p.y })) || [],
            pipeInnerDiameters: o['pipeInnerDiameters'] || [],
            pipeWallThicknesses: o['pipeWallThicknesses'] || [],
            hasProtectionPlate: o['hasProtectionPlate'],
            points: o['points']?.map((p: any) => ({
                position: { x: p.position.x, y: p.position.y, z: p.position.z },
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['style', this.params.style],
            ['columnDiameter', this.params.columnDiameter],
            ['columnHeight', this.params.columnHeight],
            ['span', this.params.span],
            ['width', this.params.width],
            ['height', this.params.height],
            ['topPlateHeight', this.params.topPlateHeight],
            ['arcHeight', this.params.arcHeight],
            ['wallThickness', this.params.wallThickness],
            ['pipeCount', this.params.pipeCount],
            ['pipePositions', this.params.pipePositions],
            ['pipeInnerDiameters', this.params.pipeInnerDiameters],
            ['pipeWallThicknesses', this.params.pipeWallThicknesses],
            ['hasProtectionPlate', this.params.hasProtectionPlate],
            ['points', this.params.points]
        ]));
    }
}

export class CableLBeamPrimitive extends BasePrimitive<CableLBeamParams> {

    constructor(tp: TopoInstance, params?: CableLBeamParams) {
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

    public setParams(params: CableLBeamParams): Primitive<CableLBeamParams> {
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

    fromObject(o: any): Primitive<CableLBeamParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            height: o['height']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height]
        ]));
    }
}

export class ManholePrimitive extends BasePrimitive<ManholeParams> {

    constructor(tp: TopoInstance, params?: ManholeParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.Manhole;
    }

    setDefault(): Primitive<ManholeParams> {
        this.params = {
            style: this.tp.ManholeStyle.CIRCULAR as any, // CIRCULAR
            length: 100.0,
            width: 0.0,
            height: 150.0,
            wallThickness: 10.0
        };
        return this;
    }

    public setParams(params: ManholeParams): Primitive<ManholeParams> {
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

    fromObject(o: any): Primitive<ManholeParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            style: o['style'],
            length: o['length'],
            width: o['width'],
            height: o['height'],
            wallThickness: o['wallThickness']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['style', this.params.style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['wallThickness', this.params.wallThickness]
        ]));
    }
}

export class ManholeCoverPrimitive extends BasePrimitive<ManholeCoverParams> {

    constructor(tp: TopoInstance, params?: ManholeCoverParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.ManholeCover;
    }

    setDefault(): Primitive<ManholeCoverParams> {
        this.params = {
            style: this.tp.ManholeStyle.CIRCULAR as any, // CIRCULAR
            length: 100.0,
            width: 0.0,
            thickness: 10.0
        };
        return this;
    }

    public setParams(params: ManholeCoverParams): Primitive<ManholeCoverParams> {
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

    fromObject(o: any): Primitive<ManholeCoverParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            style: o['style'],
            length: o['length'],
            width: o['width'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['style', this.params.style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness]
        ]));
    }
}

export class LadderPrimitive extends BasePrimitive<LadderParams> {

    constructor(tp: TopoInstance, params?: LadderParams) {
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

    public setParams(params: LadderParams): Primitive<LadderParams> {
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

    fromObject(o: any): Primitive<LadderParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness]
        ]));
    }
}

export class SumpPrimitive extends BasePrimitive<SumpParams> {

    constructor(tp: TopoInstance, params?: SumpParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.Sump;
    }

    setDefault(): Primitive<SumpParams> {
        this.params = {
            length: 500.0,
            width: 300.0,
            depth: 400.0,
            bottomThickness: 50.0
        };
        return this;
    }

    public setParams(params: SumpParams): Primitive<SumpParams> {
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

    fromObject(o: any): Primitive<SumpParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            depth: o['depth'],
            bottomThickness: o['bottomThickness']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['depth', this.params.depth],
            ['bottomThickness', this.params.bottomThickness]
        ]));
    }
}

export class FootpathPrimitive extends BasePrimitive<FootpathParams> {

    constructor(tp: TopoInstance, params?: FootpathParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.Footpath;
    }

    setDefault(): Primitive<FootpathParams> {
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

    public setParams(params: FootpathParams): Primitive<FootpathParams> {
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

    fromObject(o: any): Primitive<FootpathParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            height: o['height'],
            width: o['width'],
            points: o['points'] || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['height', this.params.height],
            ['width', this.params.width],
            ['points', this.params.points]
        ]));
    }
}

export class ShaftChamberPrimitive extends BasePrimitive<ShaftChamberParams> {

    constructor(tp: TopoInstance, params?: ShaftChamberParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.ShaftChamber;
    }

    setDefault(): Primitive<ShaftChamberParams> {
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

    public setParams(params: ShaftChamberParams): Primitive<ShaftChamberParams> {
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

    fromObject(o: any): Primitive<ShaftChamberParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['supportWallThickness', this.params.supportWallThickness],
            ['supportDiameter', this.params.supportDiameter],
            ['supportHeight', this.params.supportHeight],
            ['topThickness', this.params.topThickness],
            ['innerDiameter', this.params.innerDiameter],
            ['workingHeight', this.params.workingHeight],
            ['outerWallThickness', this.params.outerWallThickness],
            ['innerWallThickness', this.params.innerWallThickness]
        ]));
    }
}

export class TunnelCompartmentPartitionPrimitive extends BasePrimitive<TunnelCompartmentPartitionParams> {

    constructor(tp: TopoInstance, params?: TunnelCompartmentPartitionParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.TunnelCompartmentPartition;
    }

    setDefault(): Primitive<TunnelCompartmentPartitionParams> {
        this.params = {
            width: 300.0,
            thickness: 15.0
        };
        return this;
    }

    public setParams(params: TunnelCompartmentPartitionParams): Primitive<TunnelCompartmentPartitionParams> {
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

    fromObject(o: any): Primitive<TunnelCompartmentPartitionParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            width: o['width'],
            thickness: o['thickness']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['width', this.params.width],
            ['thickness', this.params.thickness]
        ]));
    }
}

export class VentilationPavilionPrimitive extends BasePrimitive<VentilationPavilionParams> {

    constructor(tp: TopoInstance, params?: VentilationPavilionParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.VentilationPavilion;
    }

    setDefault(): Primitive<VentilationPavilionParams> {
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

    public setParams(params: VentilationPavilionParams): Primitive<VentilationPavilionParams> {
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

    fromObject(o: any): Primitive<VentilationPavilionParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['topLength', this.params.topLength],
            ['middleLength', this.params.middleLength],
            ['bottomLength', this.params.bottomLength],
            ['topWidth', this.params.topWidth],
            ['middleWidth', this.params.middleWidth],
            ['bottomWidth', this.params.bottomWidth],
            ['topHeight', this.params.topHeight],
            ['height', this.params.height],
            ['baseHeight', this.params.baseHeight]
        ]));
    }
}

export class TunnelPartitionBoardPrimitive extends BasePrimitive<TunnelPartitionBoardParams> {

    constructor(tp: TopoInstance, params?: TunnelPartitionBoardParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.TunnelPartitionBoard;
    }

    setDefault(): Primitive<TunnelPartitionBoardParams> {
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

    public setParams(params: TunnelPartitionBoardParams): Primitive<TunnelPartitionBoardParams> {
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

    fromObject(o: any): Primitive<TunnelPartitionBoardParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            style: o['style'],
            length: o['length'],
            width: o['width'],
            thickness: o['thickness'],
            holeCount: o['holeCount'],
            holePositions: o['holePositions'] || [],
            holeStyles: o['holeStyles'] || [],
            holeDiameters: o['holeDiameters'] || [],
            holeWidths: o['holeWidths'] || []
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['style', this.params.style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['holeCount', this.params.holeCount],
            ['holePositions', this.params.holePositions],
            ['holeStyles', this.params.holeStyles],
            ['holeDiameters', this.params.holeDiameters],
            ['holeWidths', this.params.holeWidths]
        ]));
    }
}

export class StraightVentilationDuctPrimitive extends BasePrimitive<StraightVentilationDuctParams> {

    constructor(tp: TopoInstance, params?: StraightVentilationDuctParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.StraightVentilationDuct;
    }

    setDefault(): Primitive<StraightVentilationDuctParams> {
        this.params = {
            diameter: 200.0,
            wallThickness: 10.0,
            height: 500.0
        };
        return this;
    }

    public setParams(params: StraightVentilationDuctParams): Primitive<StraightVentilationDuctParams> {
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

    fromObject(o: any): Primitive<StraightVentilationDuctParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            diameter: o['diameter'],
            wallThickness: o['wallThickness'],
            height: o['height']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['diameter', this.params.diameter],
            ['wallThickness', this.params.wallThickness],
            ['height', this.params.height]
        ]));
    }
}

export class ObliqueVentilationDuctPrimitive extends BasePrimitive<ObliqueVentilationDuctParams> {

    constructor(tp: TopoInstance, params?: ObliqueVentilationDuctParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.ObliqueVentilationDuct;
    }

    setDefault(): Primitive<ObliqueVentilationDuctParams> {
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

    public setParams(params: ObliqueVentilationDuctParams): Primitive<ObliqueVentilationDuctParams> {
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

    fromObject(o: any): Primitive<ObliqueVentilationDuctParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
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
        ]));
    }
}

export class DrainageWellPrimitive extends BasePrimitive<DrainageWellParams> {

    constructor(tp: TopoInstance, params?: DrainageWellParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.DrainageWell;
    }

    setDefault(): Primitive<DrainageWellParams> {
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

    public setParams(params: DrainageWellParams): Primitive<DrainageWellParams> {
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

    fromObject(o: any): Primitive<DrainageWellParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height],
            ['neckDiameter', this.params.neckDiameter],
            ['neckHeight', this.params.neckHeight],
            ['cushionExtension', this.params.cushionExtension],
            ['bottomThickness', this.params.bottomThickness],
            ['wallThickness', this.params.wallThickness]
        ]));
    }
}

// 添加管枕Primitive类
export class PipeSupportPrimitive extends BasePrimitive<PipeSupportParams> {

    constructor(tp: TopoInstance, params?: PipeSupportParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.PipeSupport;
    }

    setDefault(): Primitive<PipeSupportParams> {
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

    public setParams(params: PipeSupportParams): Primitive<PipeSupportParams> {
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

    fromObject(o: any): Primitive<PipeSupportParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            style: o['style'],
            count: o['count'],
            positions: o['positions'].map((p: any) => ({ x: p.x, y: p.y })),
            radii: o['radii'],
            length: o['length'],
            width: o['width'],
            height: o['height']
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['style', this.params.style],
            ['count', this.params.count],
            ['positions', this.params.positions],
            ['radii', this.params.radii],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height]
        ]));
    }
}

export class CoverPlatePrimitive extends BasePrimitive<CoverPlateParams> {

    constructor(tp: TopoInstance, params?: CoverPlateParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CoverPlate;
    }

    setDefault(): Primitive<CoverPlateParams> {
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

    public setParams(params: CoverPlateParams): Primitive<CoverPlateParams> {
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

    fromObject(o: any): Primitive<CoverPlateParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['style', this.params.style],
            ['length', this.params.length],
            ['width', this.params.width],
            ['smallRadius', this.params.smallRadius],
            ['largeRadius', this.params.largeRadius],
            ['thickness', this.params.thickness]
        ]));
    }
}

export class CableRayPrimitive extends BasePrimitive<CableRayParams> {

    constructor(tp: TopoInstance, params?: CableRayParams) {
        super(tp, params);
    }

    getType(): string {
        return ECPrimitiveType.CableRay;
    }

    setDefault(): Primitive<CableRayParams> {
        this.params = {
            outerLength: 300.0,
            outerHeight: 100.0,
            innerLength: 280.0,
            innerHeight: 80.0,
            coverThickness: 5.0
        };
        return this;
    }

    public setParams(params: CableRayParams): Primitive<CableRayParams> {
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

    fromObject(o: any): Primitive<CableRayParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['outerLength', this.params.outerLength],
            ['outerHeight', this.params.outerHeight],
            ['innerLength', this.params.innerLength],
            ['innerHeight', this.params.innerHeight],
            ['coverThickness', this.params.coverThickness]
        ]));
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