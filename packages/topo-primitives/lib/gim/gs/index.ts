import {
    Shape,
    SphereParams,
    RotationalEllipsoidParams,
    CuboidParams,
    DiamondFrustumParams,
    OffsetRectangularTableParams,
    CylinderParams,
    SharpBentCylinderParams,
    TruncatedConeParams,
    EccentricTruncatedConeParams,
    RingParams,
    RectangularRingParams,
    EllipticRingParams,
    CircularGasketParams,
    TableGasketParams,
    SquareGasketParams,
    StretchedBodyParams,
    PorcelainBushingParams,
    ConePorcelainBushingParams,
    InsulatorStringParams,
    VTypeInsulatorParams,
    TerminalBlockParams,
    RectangularHolePlateParams,
    CircularFixedPlateParams,
    WireParams,
    CableParams,
    CurveCableParams,
    AngleSteelParams,
    IShapedSteelParams,
    ChannelSteelParams,
    TSteelParams,
    TopoInstance,
    CurveType,
} from "topo-wasm";
import {
    AngleSteelObject,
    CableObject,
    ChannelSteelObject,
    CircularFixedPlateObject,
    CircularGasketObject,
    ConePorcelainBushingObject,
    CuboidObject,
    CurveCableObject,
    CylinderObject,
    DiamondFrustumObject,
    EccentricTruncatedConeObject,
    EllipticRingObject,
    InsulatorStringObject,
    IShapedSteelObject,
    OffsetRectangularTableObject,
    PorcelainBushingObject,
    RectangularHolePlateObject,
    RectangularRingObject,
    RingObject,
    RotationalEllipsoidObject,
    SharpBentCylinderObject,
    SphereObject,
    SquareGasketObject,
    StretchedBodyObject,
    TableGasketObject,
    TerminalBlockObject,
    TruncatedConeObject,
    TSteelObject,
    VTypeInsulatorObject,
    WireObject,
} from "../../types/gim-gs";
import { angleToRad, BasePrimitive, Primitive, radToAngle } from "../../primitive";

export enum GSPrimitiveType {
    Sphere = "GIM/GS/Sphere",
    RotationalEllipsoid = "GIM/GS/RotationalEllipsoid",
    Cuboid = "GIM/GS/Cuboid",
    DiamondFrustum = "GIM/GS/DiamondFrustum",
    OffsetRectangularTable = "GIM/GS/OffsetRectangularTable",
    Cylinder = "GIM/GS/Cylinder",
    SharpBentCylinder = "GIM/GS/SharpBentCylinder",
    TruncatedCone = "GIM/GS/TruncatedCone",
    EccentricTruncatedCone = "GIM/GS/EccentricTruncatedCone",
    Ring = "GIM/GS/Ring",
    RectangularRing = "GIM/GS/RectangularRing",
    EllipticRing = "GIM/GS/EllipticRing",
    CircularGasket = "GIM/GS/CircularGasket",
    TableGasket = "GIM/GS/TableGasket",
    SquareGasket = "GIM/GS/SquareGasket",
    StretchedBody = "GIM/GS/StretchedBody",
    PorcelainBushing = "GIM/GS/PorcelainBushing",
    ConePorcelainBushing = "GIM/GS/ConePorcelainBushing",
    InsulatorString = "GIM/GS/InsulatorString",
    VTypeInsulator = "GIM/GS/VTypeInsulator",
    TerminalBlock = "GIM/GS/TerminalBlock",
    RectangularHolePlate = "GIM/GS/RectangularHolePlate",
    CircularFixedPlate = "GIM/GS/CircularFixedPlate",
    Wire = "GIM/GS/Wire",
    Cable = "GIM/GS/Cable",
    CurveCable = "GIM/GS/CurveCable",
    AngleSteel = "GIM/GS/AngleSteel",
    IShapedSteel = "GIM/GS/IShapedSteel",
    ChannelSteel = "GIM/GS/ChannelSteel",
    TSteel = "GIM/GS/TSteel",
}

export class SpherePrimitive extends BasePrimitive<SphereParams, SphereObject> {

    constructor(tp: TopoInstance, params?: SphereObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Sphere;
    }

    setDefault(): Primitive<SphereParams, SphereObject> {
        this.params.radius = 10;
        return this;
    }

    public setParams(params: SphereParams): Primitive<SphereParams, SphereObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.radius > 0;
    }


    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSphere(this.params), false);
        }
    }

    fromObject(o?: SphereObject): Primitive<SphereParams, SphereObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            radius: o['radius'],
        }
        return this;
    }

    toObject(): SphereObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['radius', this.params.radius],
        ])) as SphereObject;
    }
};

export class RotationalEllipsoidPrimitive extends BasePrimitive<RotationalEllipsoidParams, RotationalEllipsoidObject> {

    constructor(tp: TopoInstance, params?: RotationalEllipsoidObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.RotationalEllipsoid;
    }

    setDefault(): Primitive<RotationalEllipsoidParams, RotationalEllipsoidObject> {
        this.params.polarRadius = 10.0;
        this.params.equatorialRadius = 5.0;
        this.params.height = 10.0;
        return this;
    }

    public setParams(params: RotationalEllipsoidParams): Primitive<RotationalEllipsoidParams, RotationalEllipsoidObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.polarRadius > 0.0 &&
            this.params.equatorialRadius > 0.0 &&
            this.params.height > 0.0 &&
            this.params.height <= 2 * this.params.polarRadius;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRotationalEllipsoid(this.params), false);
        }
        throw new Error("Invalid parameters for RotationalEllipsoid");
    }

    fromObject(o?: RotationalEllipsoidObject): Primitive<RotationalEllipsoidParams, RotationalEllipsoidObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            polarRadius: o['polarRadius'],
            equatorialRadius: o['equatorialRadius'],
            height: o['height'],
        }
        return this;
    }

    toObject(): RotationalEllipsoidObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['polarRadius', this.params.polarRadius],
            ['equatorialRadius', this.params.equatorialRadius],
            ['height', this.params.height],
        ])) as RotationalEllipsoidObject;
    }
};

export class CuboidPrimitive extends BasePrimitive<CuboidParams, CuboidObject> {

    constructor(tp: TopoInstance, params?: CuboidObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Cuboid;
    }

    setDefault(): Primitive<CuboidParams, CuboidObject> {
        this.params.length = 10.0;
        this.params.width = 5.0;
        this.params.height = 3.0;
        return this;
    }

    public setParams(params: CuboidParams): Primitive<CuboidParams, CuboidObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0.0 &&
            this.params.width > 0.0 &&
            this.params.height > 0.0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCuboid(this.params), false);
        }
        throw new Error("Length, width and height must be positive");
    }

    fromObject(o?: CuboidObject): Primitive<CuboidParams, CuboidObject> {
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
        }
        return this;
    }

    toObject(): CuboidObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['height', this.params.height]
        ])) as CuboidObject;
    }
};

export class DiamondFrustumPrimitive extends BasePrimitive<DiamondFrustumParams, DiamondFrustumObject> {

    constructor(tp: TopoInstance, params?: DiamondFrustumObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.DiamondFrustum;
    }

    setDefault(): Primitive<DiamondFrustumParams, DiamondFrustumObject> {
        this.params.topDiag1 = 10.0;
        this.params.topDiag2 = 7.5;
        this.params.bottomDiag1 = 20.0;
        this.params.bottomDiag2 = 15.0;
        this.params.height = 12.0;
        return this;
    }

    public setParams(params: DiamondFrustumParams): Primitive<DiamondFrustumParams, DiamondFrustumObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.topDiag1 >= 0 &&
            this.params.topDiag2 >= 0 &&
            this.params.bottomDiag1 > 0 &&
            this.params.bottomDiag2 > 0 &&
            this.params.height > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createDiamondFrustum(this.params), false);
        }
        throw new Error("Invalid parameters for DiamondFrustum");
    }

    fromObject(o?: DiamondFrustumObject): Primitive<DiamondFrustumParams, DiamondFrustumObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            topDiag1: o['topDiag1'],
            topDiag2: o['topDiag2'],
            bottomDiag1: o['bottomDiag1'],
            bottomDiag2: o['bottomDiag2'],
            height: o['height']
        }
        return this;
    }

    toObject(): DiamondFrustumObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['topDiag1', this.params.topDiag1],
            ['topDiag2', this.params.topDiag2],
            ['bottomDiag1', this.params.bottomDiag1],
            ['bottomDiag2', this.params.bottomDiag2],
            ['height', this.params.height]
        ])) as DiamondFrustumObject;
    }
};

export class OffsetRectangularTablePrimitive extends BasePrimitive<OffsetRectangularTableParams, OffsetRectangularTableObject> {

    constructor(tp: TopoInstance, params?: OffsetRectangularTableObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.OffsetRectangularTable;
    }

    setDefault(): Primitive<OffsetRectangularTableParams, OffsetRectangularTableObject> {
        this.params.topLength = 15.0;
        this.params.topWidth = 10.0;
        this.params.bottomLength = 20.0;
        this.params.bottomWidth = 12.0;
        this.params.height = 8.0;
        this.params.xOffset = 2.0;
        this.params.yOffset = 1.5;
        return this;
    }

    public setParams(params: OffsetRectangularTableParams): Primitive<OffsetRectangularTableParams, OffsetRectangularTableObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.topLength >= 0 &&
            this.params.topWidth >= 0 &&
            this.params.bottomLength >= this.params.topLength &&
            this.params.bottomWidth >= this.params.topWidth &&
            this.params.height > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createOffsetRectangularTable(this.params), false);
        }
        throw new Error("Invalid parameters for OffsetRectangularTable");
    }

    fromObject(o?: OffsetRectangularTableObject): Primitive<OffsetRectangularTableParams, OffsetRectangularTableObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            topLength: o['topLength'],
            topWidth: o['topWidth'],
            bottomLength: o['bottomLength'],
            bottomWidth: o['bottomWidth'],
            height: o['height'],
            xOffset: o['xOffset'],
            yOffset: o['yOffset']
        }
        return this;
    }

    toObject(): OffsetRectangularTableObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['topLength', this.params.topLength],
            ['topWidth', this.params.topWidth],
            ['bottomLength', this.params.bottomLength],
            ['bottomWidth', this.params.bottomWidth],
            ['height', this.params.height],
            ['xOffset', this.params.xOffset],
            ['yOffset', this.params.yOffset]
        ])) as OffsetRectangularTableObject;
    }
};

export class CylinderPrimitive extends BasePrimitive<CylinderParams, CylinderObject> {

    constructor(tp: TopoInstance, params?: CylinderObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Cylinder;
    }

    setDefault(): Primitive<CylinderParams, CylinderObject> {
        this.params.radius = 15.0;
        this.params.height = 25.0;
        return this;
    }

    public setParams(params: CylinderParams): Primitive<CylinderParams, CylinderObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.radius > 0.0 &&
            this.params.height > 0.0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCylinder(this.params), false);
        }
        throw new Error("Radius and height must be positive");
    }

    fromObject(o?: CylinderObject): Primitive<CylinderParams, CylinderObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            radius: o['radius'],
            height: o['height']
        }
        return this;
    }

    toObject(): CylinderObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['radius', this.params.radius],
            ['height', this.params.height]
        ])) as CylinderObject;
    }
};

export class SharpBentCylinderPrimitive extends BasePrimitive<SharpBentCylinderParams, SharpBentCylinderObject> {

    constructor(tp: TopoInstance, params?: SharpBentCylinderObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.SharpBentCylinder;
    }

    setDefault(): Primitive<SharpBentCylinderParams, SharpBentCylinderObject> {
        this.params.radius = 5.0;
        this.params.length = 70.0;
        this.params.bendAngle = Math.PI / 4;
        return this;
    }

    public setParams(params: SharpBentCylinderParams): Primitive<SharpBentCylinderParams, SharpBentCylinderObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.radius > 0 &&
            this.params.length > 0 &&
            this.params.bendAngle > 0 &&
            this.params.bendAngle < Math.PI * 2;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSharpBentCylinder(this.params), false);
        }
        throw new Error("Invalid parameters for SharpBentCylinder");
    }

    fromObject(o?: SharpBentCylinderObject): Primitive<SharpBentCylinderParams, SharpBentCylinderObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            radius: o['radius'],
            length: o['length'],
            bendAngle: angleToRad(o['bendAngle'])
        }
        return this;
    }

    toObject(): SharpBentCylinderObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['radius', this.params.radius],
            ['length', this.params.length],
            ['bendAngle', radToAngle(this.params.bendAngle)]
        ])) as SharpBentCylinderObject;
    }
};

export class TruncatedConePrimitive extends BasePrimitive<TruncatedConeParams, TruncatedConeObject> {

    constructor(tp: TopoInstance, params?: TruncatedConeObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TruncatedCone;
    }

    setDefault(): Primitive<TruncatedConeParams, TruncatedConeObject> {
        this.params.topRadius = 5.0;
        this.params.bottomRadius = 10.0;
        this.params.height = 15.0;
        return this;
    }

    public setParams(params: TruncatedConeParams): Primitive<TruncatedConeParams, TruncatedConeObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.topRadius >= 0 &&
            this.params.bottomRadius > this.params.topRadius &&
            this.params.height > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTruncatedCone(this.params), false);
        }
        throw new Error("Invalid parameters for TruncatedCone");
    }

    fromObject(o?: TruncatedConeObject): Primitive<TruncatedConeParams, TruncatedConeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            topRadius: o['topRadius'],
            bottomRadius: o['bottomRadius'],
            height: o['height']
        }
        return this;
    }

    toObject(): TruncatedConeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['topRadius', this.params.topRadius],
            ['bottomRadius', this.params.bottomRadius],
            ['height', this.params.height]
        ])) as TruncatedConeObject;
    }
};

export class EccentricTruncatedConePrimitive extends BasePrimitive<EccentricTruncatedConeParams, EccentricTruncatedConeObject> {

    constructor(tp: TopoInstance, params?: EccentricTruncatedConeObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.EccentricTruncatedCone;
    }

    setDefault(): Primitive<EccentricTruncatedConeParams, EccentricTruncatedConeObject> {
        this.params.topRadius = 5.0;
        this.params.bottomRadius = 10.0;
        this.params.height = 15.0;
        this.params.topXOffset = 2.0;
        this.params.topYOffset = 3.0;
        return this;
    }

    public setParams(params: EccentricTruncatedConeParams): Primitive<EccentricTruncatedConeParams, EccentricTruncatedConeObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.topRadius >= 0 &&
            this.params.bottomRadius >= this.params.topRadius &&
            this.params.height > 0 &&
            this.params.topXOffset >= 0 &&
            this.params.topYOffset >= 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createEccentricTruncatedCone(this.params), false);
        }
        throw new Error("Invalid parameters for EccentricTruncatedCone");
    }

    fromObject(o?: EccentricTruncatedConeObject): Primitive<EccentricTruncatedConeParams, EccentricTruncatedConeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            topRadius: o['topRadius'],
            bottomRadius: o['bottomRadius'],
            height: o['height'],
            topXOffset: o['topXOffset'],
            topYOffset: o['topYOffset']
        }
        return this;
    }

    toObject(): EccentricTruncatedConeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['topRadius', this.params.topRadius],
            ['bottomRadius', this.params.bottomRadius],
            ['height', this.params.height],
            ['topXOffset', this.params.topXOffset],
            ['topYOffset', this.params.topYOffset]
        ])) as EccentricTruncatedConeObject;
    }
};

export class RingPrimitive extends BasePrimitive<RingParams, RingObject> {

    constructor(tp: TopoInstance, params?: RingObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Ring;
    }

    setDefault(): Primitive<RingParams, RingObject> {
        this.params.ringRadius = 20.0;
        this.params.tubeRadius = 5.0;
        this.params.angle = Math.PI * 1.5;
        return this;
    }

    public setParams(params: RingParams): Primitive<RingParams, RingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.ringRadius > 0 &&
            this.params.tubeRadius > 0 &&
            this.params.tubeRadius < this.params.ringRadius &&
            this.params.angle > 0 &&
            this.params.angle <= 2 * Math.PI;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRing(this.params), false);
        }
        throw new Error("Invalid parameters for Ring");
    }

    fromObject(o?: RingObject): Primitive<RingParams, RingObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            ringRadius: o['ringRadius'],
            tubeRadius: o['tubeRadius'],
            angle: angleToRad(o['angle'])
        }
        return this;
    }

    toObject(): RingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['ringRadius', this.params.ringRadius],
            ['tubeRadius', this.params.tubeRadius],
            ['angle', radToAngle(this.params.angle)]
        ])) as RingObject;
    }
};

export class RectangularRingPrimitive extends BasePrimitive<RectangularRingParams, RectangularRingObject> {

    constructor(tp: TopoInstance, params?: RectangularRingObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.RectangularRing;
    }

    setDefault(): Primitive<RectangularRingParams, RectangularRingObject> {
        this.params.tubeRadius = 5.0;
        this.params.filletRadius = 0.0;
        this.params.length = 100.0;
        this.params.width = 80.0;
        return this;
    }

    public setParams(params: RectangularRingParams): Primitive<RectangularRingParams, RectangularRingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.tubeRadius > 0 &&
            this.params.tubeRadius < (this.params.width / 2) &&
            this.params.filletRadius >= 0 &&
            this.params.filletRadius < (this.params.width / 2) &&
            this.params.length > this.params.width &&
            this.params.width > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRectangularRing(this.params), false);
        }
        throw new Error("Invalid parameters for RectangularRing");
    }

    fromObject(o?: RectangularRingObject): Primitive<RectangularRingParams, RectangularRingObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            tubeRadius: o['tubeRadius'],
            filletRadius: o['filletRadius'],
            length: o['length'],
            width: o['width']
        }
        return this;
    }

    toObject(): RectangularRingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['tubeRadius', this.params.tubeRadius],
            ['filletRadius', this.params.filletRadius],
            ['length', this.params.length],
            ['width', this.params.width]
        ])) as RectangularRingObject;
    }
};

export class EllipticRingPrimitive extends BasePrimitive<EllipticRingParams, EllipticRingObject> {

    constructor(tp: TopoInstance, params?: EllipticRingObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.EllipticRing;
    }

    setDefault(): Primitive<EllipticRingParams, EllipticRingObject> {
        this.params.tubeRadius = 3.0;
        this.params.majorRadius = 20.0;
        this.params.minorRadius = 10.0;
        return this;
    }

    public setParams(params: EllipticRingParams): Primitive<EllipticRingParams, EllipticRingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.tubeRadius > 0 &&
            this.params.tubeRadius < this.params.minorRadius &&
            this.params.majorRadius > this.params.minorRadius &&
            this.params.minorRadius > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createEllipticRing(this.params), false);
        }
        throw new Error("Invalid parameters for EllipticRing");
    }

    fromObject(o?: EllipticRingObject): Primitive<EllipticRingParams, EllipticRingObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            tubeRadius: o['tubeRadius'],
            majorRadius: o['majorRadius'],
            minorRadius: o['minorRadius']
        }
        return this;
    }

    toObject(): EllipticRingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['tubeRadius', this.params.tubeRadius],
            ['majorRadius', this.params.majorRadius],
            ['minorRadius', this.params.minorRadius]
        ])) as EllipticRingObject;
    }
};

export class CircularGasketPrimitive extends BasePrimitive<CircularGasketParams, CircularGasketObject> {

    constructor(tp: TopoInstance, params?: CircularGasketObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.CircularGasket;
    }

    setDefault(): Primitive<CircularGasketParams, CircularGasketObject> {
        this.params.outerRadius = 20.0;
        this.params.innerRadius = 15.0;
        this.params.height = 5.0;
        this.params.angle = Math.PI * 1.5;
        return this;
    }

    public setParams(params: CircularGasketParams): Primitive<CircularGasketParams, CircularGasketObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.outerRadius > this.params.innerRadius &&
            this.params.innerRadius > 0 &&
            this.params.height > 0 &&
            this.params.angle > 0 &&
            this.params.angle <= 2 * Math.PI;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCircularGasket(this.params), false);
        }
        throw new Error("Invalid parameters for CircularGasket");
    }

    fromObject(o?: CircularGasketObject): Primitive<CircularGasketParams, CircularGasketObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            outerRadius: o['outerRadius'],
            innerRadius: o['innerRadius'],
            height: o['height'],
            angle: angleToRad(o['angle'])
        }
        return this;
    }

    toObject(): CircularGasketObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['outerRadius', this.params.outerRadius],
            ['innerRadius', this.params.innerRadius],
            ['height', this.params.height],
            ['angle', radToAngle(this.params.angle)]
        ])) as CircularGasketObject;
    }
};

export class TableGasketPrimitive extends BasePrimitive<TableGasketParams, TableGasketObject> {

    constructor(tp: TopoInstance, params?: TableGasketObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TableGasket;
    }

    setDefault(): Primitive<TableGasketParams, TableGasketObject> {
        this.params.topRadius = 15.0;
        this.params.outerRadius = 20.0;
        this.params.innerRadius = 10.0;
        this.params.height = 6.0;
        this.params.angle = Math.PI * 1.5;
        return this;
    }

    public setParams(params: TableGasketParams): Primitive<TableGasketParams, TableGasketObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.innerRadius > 0 &&
            this.params.topRadius > this.params.innerRadius &&
            this.params.outerRadius > this.params.topRadius &&
            this.params.height > 0 &&
            this.params.angle > 0 &&
            this.params.angle <= 2 * Math.PI;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTableGasket(this.params), false);
        }
        throw new Error("Invalid parameters for TableGasket");
    }

    fromObject(o?: TableGasketObject): Primitive<TableGasketParams, TableGasketObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            topRadius: o['topRadius'],
            outerRadius: o['outerRadius'],
            innerRadius: o['innerRadius'],
            height: o['height'],
            angle: angleToRad(o['angle'])
        }
        return this;
    }

    toObject(): TableGasketObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['topRadius', this.params.topRadius],
            ['outerRadius', this.params.outerRadius],
            ['innerRadius', this.params.innerRadius],
            ['height', this.params.height],
            ['angle', radToAngle(this.params.angle)]
        ])) as TableGasketObject;
    }
};

export class SquareGasketPrimitive extends BasePrimitive<SquareGasketParams, SquareGasketObject> {

    constructor(tp: TopoInstance, params?: SquareGasketObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.SquareGasket;
    }

    setDefault(): Primitive<SquareGasketParams, SquareGasketObject> {
        this.params.outerLength = 30.0;
        this.params.outerWidth = 20.0;
        this.params.innerLength = 25.0;
        this.params.innerWidth = 15.0;
        this.params.height = 5.0;
        this.params.cornerType = 1;
        this.params.cornerParam = 0;
        return this;
    }

    public setParams(params: SquareGasketParams): Primitive<SquareGasketParams, SquareGasketObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.outerLength > this.params.innerLength &&
            this.params.outerWidth > this.params.innerWidth &&
            this.params.innerLength > 0 &&
            this.params.innerWidth > 0 &&
            this.params.height > 0 &&
            this.params.cornerType >= 1 &&
            this.params.cornerType <= 3;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSquareGasket(this.params), false);
        }
        throw new Error("Invalid parameters for SquareGasket");
    }

    fromObject(o?: SquareGasketObject): Primitive<SquareGasketParams, SquareGasketObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            outerLength: o['outerLength'],
            outerWidth: o['outerWidth'],
            innerLength: o['innerLength'],
            innerWidth: o['innerWidth'],
            height: o['height'],
            cornerType: o['cornerType'],
            cornerParam: o['cornerParam']
        }
        return this;
    }

    toObject(): SquareGasketObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['outerLength', this.params.outerLength],
            ['outerWidth', this.params.outerWidth],
            ['innerLength', this.params.innerLength],
            ['innerWidth', this.params.innerWidth],
            ['height', this.params.height],
            ['cornerType', this.params.cornerType],
            ['cornerParam', this.params.cornerParam]
        ])) as SquareGasketObject;
    }
};

export class StretchedBodyPrimitive extends BasePrimitive<StretchedBodyParams, StretchedBodyObject> {

    constructor(tp: TopoInstance, params?: StretchedBodyObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.StretchedBody;
    }

    setDefault(): Primitive<StretchedBodyParams, StretchedBodyObject> {
        this.params.points = [
            new this.tp.gp_Pnt_3(0, 0, 0),
            new this.tp.gp_Pnt_3(10, 0, 0),
            new this.tp.gp_Pnt_3(5, 8, 0)
        ];
        this.params.normal = new this.tp.gp_Dir_4(0, 0, 1);
        this.params.length = 15.0;
        return this;
    }

    public setParams(params: StretchedBodyParams): Primitive<StretchedBodyParams, StretchedBodyObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 &&
            this.params.points.length >= 3 &&
            new this.tp.gp_Vec_2(this.params.normal).Magnitude() > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createStretchedBody(this.params), false);
        }
        throw new Error("Invalid parameters for StretchedBody");
    }

    fromObject(o?: StretchedBodyObject): Primitive<StretchedBodyParams, StretchedBodyObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            points: o['points'].map((p: any) => new this.tp.gp_Pnt_3(p[0], p[1], p[2])),
            normal: new this.tp.gp_Dir_4(o['normal'][0], o['normal'][1], o['normal'][2]),
            length: o['length']
        }
        return this;
    }

    toObject(): StretchedBodyObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['points', this.params.points.map(p => ([p.X(), p.Y(), p.Z()]))],
            ['normal', [this.params.normal.X(), this.params.normal.Y(), this.params.normal.Z()]],
            ['length', this.params.length]
        ])) as StretchedBodyObject;
    }
};

export class PorcelainBushingPrimitive extends BasePrimitive<PorcelainBushingParams, PorcelainBushingObject> {

    constructor(tp: TopoInstance, params?: PorcelainBushingObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.PorcelainBushing;
    }

    setDefault(): Primitive<PorcelainBushingParams, PorcelainBushingObject> {
        this.params.height = 100.0;
        this.params.radius = 10.0;
        this.params.bigSkirtRadius = 15.0;
        this.params.smallSkirtRadius = 12.0;
        this.params.count = 20;
        return this;
    }

    public setParams(params: PorcelainBushingParams): Primitive<PorcelainBushingParams, PorcelainBushingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 &&
            this.params.radius > 0 &&
            this.params.bigSkirtRadius >= this.params.smallSkirtRadius &&
            this.params.smallSkirtRadius > this.params.radius &&
            this.params.count > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPorcelainBushing(this.params), false);
        }
        throw new Error("Invalid parameters for PorcelainBushing");
    }

    fromObject(o?: PorcelainBushingObject): Primitive<PorcelainBushingParams, PorcelainBushingObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            height: o['height'],
            radius: o['radius'],
            bigSkirtRadius: o['bigSkirtRadius'],
            smallSkirtRadius: o['smallSkirtRadius'],
            count: o['count']
        }
        return this;
    }

    toObject(): PorcelainBushingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['radius', this.params.radius],
            ['bigSkirtRadius', this.params.bigSkirtRadius],
            ['smallSkirtRadius', this.params.smallSkirtRadius],
            ['count', this.params.count]
        ])) as PorcelainBushingObject;
    }
};

export class ConePorcelainBushingPrimitive extends BasePrimitive<ConePorcelainBushingParams, ConePorcelainBushingObject> {

    constructor(tp: TopoInstance, params?: ConePorcelainBushingObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.ConePorcelainBushing;
    }

    setDefault(): Primitive<ConePorcelainBushingParams, ConePorcelainBushingObject> {
        this.params.height = 100.0;
        this.params.bottomRadius = 15.0;
        this.params.topRadius = 10.0;
        this.params.bottomSkirtRadius1 = 20.0;
        this.params.bottomSkirtRadius2 = 18.0;
        this.params.topSkirtRadius1 = 15.0;
        this.params.topSkirtRadius2 = 12.0;
        this.params.count = 20;
        return this;
    }

    public setParams(params: ConePorcelainBushingParams): Primitive<ConePorcelainBushingParams, ConePorcelainBushingObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 &&
            this.params.bottomRadius > 0 &&
            this.params.topRadius > 0 &&
            this.params.bottomSkirtRadius1 > this.params.bottomRadius &&
            this.params.bottomSkirtRadius2 > this.params.bottomRadius &&
            this.params.topSkirtRadius1 > this.params.topRadius &&
            this.params.topSkirtRadius2 > this.params.topRadius &&
            this.params.count > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createConePorcelainBushing(this.params), false);
        }
        throw new Error("Invalid parameters for ConePorcelainBushing");
    }

    fromObject(o?: ConePorcelainBushingObject): Primitive<ConePorcelainBushingParams, ConePorcelainBushingObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            height: o['height'],
            bottomRadius: o['bottomRadius'],
            topRadius: o['topRadius'],
            bottomSkirtRadius1: o['bottomSkirtRadius1'],
            bottomSkirtRadius2: o['bottomSkirtRadius2'],
            topSkirtRadius1: o['topSkirtRadius1'],
            topSkirtRadius2: o['topSkirtRadius2'],
            count: o['count']
        }
        return this;
    }

    toObject(): ConePorcelainBushingObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['bottomRadius', this.params.bottomRadius],
            ['topRadius', this.params.topRadius],
            ['bottomSkirtRadius1', this.params.bottomSkirtRadius1],
            ['bottomSkirtRadius2', this.params.bottomSkirtRadius2],
            ['topSkirtRadius1', this.params.topSkirtRadius1],
            ['topSkirtRadius2', this.params.topSkirtRadius2],
            ['count', this.params.count]
        ])) as ConePorcelainBushingObject;
    }
};

export class InsulatorStringPrimitive extends BasePrimitive<InsulatorStringParams, InsulatorStringObject> {

    constructor(tp: TopoInstance, params?: InsulatorStringObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.InsulatorString;
    }

    setDefault(): Primitive<InsulatorStringParams, InsulatorStringObject> {
        this.params.count = 2;
        this.params.spacing = 30.0;
        this.params.insulatorCount = 22;
        this.params.height = 5.0;
        this.params.bigSkirtRadius = 8.0;
        this.params.smallSkirtRadius = 6.0;
        this.params.radius = 2;
        this.params.frontLength = 15.0;
        this.params.backLength = 10.0;
        this.params.splitCount = 2;
        return this;
    }

    public setParams(params: InsulatorStringParams): Primitive<InsulatorStringParams, InsulatorStringObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.count > 0 &&
            this.params.spacing >= 0 &&
            this.params.insulatorCount > 0 &&
            this.params.height > 0 &&
            this.params.bigSkirtRadius >= this.params.smallSkirtRadius &&
            this.params.smallSkirtRadius > this.params.radius &&
            this.params.radius > 0 &&
            this.params.frontLength > 0 &&
            this.params.backLength > 0 &&
            this.params.splitCount > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createInsulatorString(this.params), false);
        }
        throw new Error("Invalid parameters for InsulatorString");
    }

    fromObject(o?: InsulatorStringObject): Primitive<InsulatorStringParams, InsulatorStringObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            count: o['count'],
            spacing: o['spacing'],
            insulatorCount: o['insulatorCount'],
            height: o['height'],
            bigSkirtRadius: o['bigSkirtRadius'],
            smallSkirtRadius: o['smallSkirtRadius'],
            radius: o['radius'],
            frontLength: o['frontLength'],
            backLength: o['backLength'],
            splitCount: o['splitCount']
        }
        return this;
    }

    toObject(): InsulatorStringObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['count', this.params.count],
            ['spacing', this.params.spacing],
            ['insulatorCount', this.params.insulatorCount],
            ['height', this.params.height],
            ['bigSkirtRadius', this.params.bigSkirtRadius],
            ['smallSkirtRadius', this.params.smallSkirtRadius],
            ['radius', this.params.radius],
            ['frontLength', this.params.frontLength],
            ['backLength', this.params.backLength],
            ['splitCount', this.params.splitCount]
        ])) as InsulatorStringObject;
    }
};

export class VTypeInsulatorPrimitive extends BasePrimitive<VTypeInsulatorParams, VTypeInsulatorObject> {

    constructor(tp: TopoInstance, params?: VTypeInsulatorObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.VTypeInsulator;
    }

    setDefault(): Primitive<VTypeInsulatorParams, VTypeInsulatorObject> {
        this.params.frontSpacing = 30.0;
        this.params.backSpacing = 20.0;
        this.params.insulatorCount = 22;
        this.params.height = 5.0;
        this.params.radius = 2.0;
        this.params.bigSkirtRadius = 6.0;
        this.params.smallSkirtRadius = 5.0;
        this.params.frontLength = 10.0;
        this.params.backLength = 8.0;
        this.params.splitCount = 2;
        return this;
    }

    public setParams(params: VTypeInsulatorParams): Primitive<VTypeInsulatorParams, VTypeInsulatorObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.frontSpacing > 0 &&
            this.params.backSpacing > 0 &&
            this.params.insulatorCount > 0 &&
            this.params.height > 0 &&
            this.params.radius > 0 &&
            this.params.bigSkirtRadius >= this.params.smallSkirtRadius &&
            this.params.smallSkirtRadius > 0 &&
            this.params.frontLength > 0 &&
            this.params.backLength > 0 &&
            this.params.splitCount > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createVTypeInsulator(this.params), false);
        }
        throw new Error("Invalid parameters for VTypeInsulator");
    }

    fromObject(o?: VTypeInsulatorObject): Primitive<VTypeInsulatorParams, VTypeInsulatorObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            frontSpacing: o['frontSpacing'],
            backSpacing: o['backSpacing'],
            insulatorCount: o['insulatorCount'],
            height: o['height'],
            radius: o['radius'],
            bigSkirtRadius: o['bigSkirtRadius'],
            smallSkirtRadius: o['smallSkirtRadius'],
            frontLength: o['frontLength'],
            backLength: o['backLength'],
            splitCount: o['splitCount']
        }
        return this;
    }

    toObject(): VTypeInsulatorObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['frontSpacing', this.params.frontSpacing],
            ['backSpacing', this.params.backSpacing],
            ['insulatorCount', this.params.insulatorCount],
            ['height', this.params.height],
            ['radius', this.params.radius],
            ['bigSkirtRadius', this.params.bigSkirtRadius],
            ['smallSkirtRadius', this.params.smallSkirtRadius],
            ['frontLength', this.params.frontLength],
            ['backLength', this.params.backLength],
            ['splitCount', this.params.splitCount]
        ])) as VTypeInsulatorObject;
    }
};

export class TerminalBlockPrimitive extends BasePrimitive<TerminalBlockParams, TerminalBlockObject> {

    constructor(tp: TopoInstance, params?: TerminalBlockObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TerminalBlock;
    }

    setDefault(): Primitive<TerminalBlockParams, TerminalBlockObject> {
        this.params.length = 100.0;
        this.params.width = 50.0;
        this.params.thickness = 10.0;
        this.params.chamferLength = 5.0;
        this.params.columnSpacing = 15.0;
        this.params.rowSpacing = 20.0;
        this.params.holeRadius = 3.0;
        this.params.columnCount = 3;
        this.params.rowCount = 4;
        this.params.bottomOffset = 20.0;
        return this;
    }

    public setParams(params: TerminalBlockParams): Primitive<TerminalBlockParams, TerminalBlockObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > this.params.width &&
            this.params.width > 0 &&
            this.params.thickness > 0 &&
            this.params.chamferLength > 0 &&
            this.params.columnSpacing > 0 &&
            this.params.rowSpacing > 0 &&
            this.params.holeRadius > 0 &&
            this.params.columnCount > 0 &&
            this.params.rowCount > 0 &&
            this.params.bottomOffset > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTerminalBlock(this.params), false);
        }
        throw new Error("Invalid parameters for TerminalBlock");
    }

    fromObject(o?: TerminalBlockObject): Primitive<TerminalBlockParams, TerminalBlockObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            thickness: o['thickness'],
            chamferLength: o['chamferLength'],
            columnSpacing: o['columnSpacing'],
            rowSpacing: o['rowSpacing'],
            holeRadius: o['holeRadius'],
            columnCount: o['columnCount'],
            rowCount: o['rowCount'],
            bottomOffset: o['bottomOffset']
        }
        return this;
    }

    toObject(): TerminalBlockObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['chamferLength', this.params.chamferLength],
            ['columnSpacing', this.params.columnSpacing],
            ['rowSpacing', this.params.rowSpacing],
            ['holeRadius', this.params.holeRadius],
            ['columnCount', this.params.columnCount],
            ['rowCount', this.params.rowCount],
            ['bottomOffset', this.params.bottomOffset]
        ])) as TerminalBlockObject;
    }
};

export class RectangularHolePlatePrimitive extends BasePrimitive<RectangularHolePlateParams, RectangularHolePlateObject> {

    constructor(tp: TopoInstance, params?: RectangularHolePlateObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.RectangularHolePlate;
    }

    setDefault(): Primitive<RectangularHolePlateParams, RectangularHolePlateObject> {
        this.params.length = 100.0;
        this.params.width = 80.0;
        this.params.thickness = 10.0;
        this.params.columnSpacing = 20.0;
        this.params.rowSpacing = 15.0;
        this.params.columnCount = 4;
        this.params.rowCount = 5;
        this.params.hasMiddleHole = true;
        this.params.holeDiameter = 8.0;
        return this;
    }

    public setParams(params: RectangularHolePlateParams): Primitive<RectangularHolePlateParams, RectangularHolePlateObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 &&
            this.params.width > 0 &&
            this.params.thickness > 0 &&
            this.params.columnSpacing > 0 &&
            this.params.rowSpacing > 0 &&
            this.params.columnCount > 0 &&
            this.params.rowCount > 0 &&
            this.params.holeDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRectangularFixedPlate(this.params), false);
        }
        throw new Error("Invalid parameters for RectangularHolePlate");
    }

    fromObject(o?: RectangularHolePlateObject): Primitive<RectangularHolePlateParams, RectangularHolePlateObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            thickness: o['thickness'],
            columnSpacing: o['columnSpacing'],
            rowSpacing: o['rowSpacing'],
            columnCount: o['columnCount'],
            rowCount: o['rowCount'],
            hasMiddleHole: o['hasMiddleHole'],
            holeDiameter: o['holeDiameter']
        }
        return this;
    }

    toObject(): RectangularHolePlateObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['columnSpacing', this.params.columnSpacing],
            ['rowSpacing', this.params.rowSpacing],
            ['columnCount', this.params.columnCount],
            ['rowCount', this.params.rowCount],
            ['hasMiddleHole', this.params.hasMiddleHole],
            ['holeDiameter', this.params.holeDiameter]
        ])) as RectangularHolePlateObject;
    }
};

export class CircularFixedPlatePrimitive extends BasePrimitive<CircularFixedPlateParams, CircularFixedPlateObject> {

    constructor(tp: TopoInstance, params?: CircularFixedPlateObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.CircularFixedPlate;
    }

    setDefault(): Primitive<CircularFixedPlateParams, CircularFixedPlateObject> {
        this.params.length = 200.0;
        this.params.width = 200.0;
        this.params.thickness = 12.0;
        this.params.ringRadius = 60.0;
        this.params.holeCount = 8;
        this.params.hasMiddleHole = true;
        this.params.holeDiameter = 15.0;
        return this;
    }

    public setParams(params: CircularFixedPlateParams): Primitive<CircularFixedPlateParams, CircularFixedPlateObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.length > 0 &&
            this.params.width > 0 &&
            this.params.thickness > 0 &&
            this.params.ringRadius > 0 &&
            this.params.holeCount > 0 &&
            this.params.holeDiameter > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCircularFixedPlate(this.params), false);
        }
        throw new Error("Invalid parameters for CircularFixedPlate");
    }

    fromObject(o?: CircularFixedPlateObject): Primitive<CircularFixedPlateParams, CircularFixedPlateObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            thickness: o['thickness'],
            ringRadius: o['ringRadius'],
            holeCount: o['holeCount'],
            hasMiddleHole: o['hasMiddleHole'],
            holeDiameter: o['holeDiameter']
        }
        return this;
    }

    toObject(): CircularFixedPlateObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['ringRadius', this.params.ringRadius],
            ['holeCount', this.params.holeCount],
            ['hasMiddleHole', this.params.hasMiddleHole],
            ['holeDiameter', this.params.holeDiameter]
        ])) as CircularFixedPlateObject;
    }
};

export class WirePrimitive extends BasePrimitive<WireParams, WireObject> {

    constructor(tp: TopoInstance, params?: WireObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Wire;
    }

    setDefault(): Primitive<WireParams, WireObject> {
        this.params.startPoint = new this.tp.gp_Pnt_3(0, 0, 0);
        this.params.endPoint = new this.tp.gp_Pnt_3(100, 0, 0);
        this.params.startDir = new this.tp.gp_Dir_4(1, 0, 0);
        this.params.endDir = new this.tp.gp_Dir_4(1, 0, 0);
        this.params.sag = 10.0;
        this.params.diameter = 5.0;
        this.params.fitPoints = [];
        return this;
    }

    public setParams(params: WireParams): Primitive<WireParams, WireObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.sag > 0 &&
            this.params.diameter > 0 &&
            (this.params.fitPoints.length === 0 || this.params.fitPoints.length >= 2);
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createWire(this.params), false);
        }
        throw new Error("Invalid parameters for Wire");
    }

    fromObject(o?: WireObject): Primitive<WireParams, WireObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            startPoint: new this.tp.gp_Pnt_3(o['startPoint'][0], o['startPoint'][1], o['startPoint'][2]),
            endPoint: new this.tp.gp_Pnt_3(o['endPoint'][0], o['endPoint'][1], o['endPoint'][2]),
            startDir: new this.tp.gp_Dir_4(o['startDir'][0], o['startDir'][1], o['startDir'][2]),
            endDir: new this.tp.gp_Dir_4(o['endDir'][0], o['endDir'][1], o['endDir'][2]),
            sag: o['sag'],
            diameter: o['diameter'],
            fitPoints: o['fitPoints'].map((p: any) => new this.tp.gp_Pnt_3(p[0], p[1], p[2]))
        }
        return this;
    }

    toObject(): WireObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['startPoint', [this.params.startPoint.X(), this.params.startPoint.Y(), this.params.startPoint.Z()]],
            ['endPoint', [this.params.endPoint.X(), this.params.endPoint.Y(), this.params.endPoint.Z()]],
            ['startDir', [this.params.startDir.X(), this.params.startDir.Y(), this.params.startDir.Z()]],
            ['endDir', [this.params.endDir.X(), this.params.endDir.Y(), this.params.endDir.Z()]],
            ['sag', this.params.sag],
            ['diameter', this.params.diameter],
            ['fitPoints', this.params.fitPoints.map(p => ([p.X(), p.Y(), p.Z()]))]
        ])) as WireObject;
    }
};

export class CablePrimitive extends BasePrimitive<CableParams, CableObject> {

    constructor(tp: TopoInstance, params?: CableObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Cable;
    }

    setDefault(): Primitive<CableParams, CableObject> {
        this.params.startPoint = new this.tp.gp_Pnt_3(0, 0, 0);
        this.params.endPoint = new this.tp.gp_Pnt_3(100, 0, 0);
        this.params.inflectionPoints = [];
        this.params.radii = [];
        this.params.diameter = 10.0;
        return this;
    }

    public setParams(params: CableParams): Primitive<CableParams, CableObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.diameter <= 0) return false;
        if (this.params.inflectionPoints.length !== this.params.radii.length) return false;
        return this.params.radii.every(r => r > 0);
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCable(this.params), false);
        }
        throw new Error("Invalid parameters for Cable");
    }

    fromObject(o?: CableObject): Primitive<CableParams, CableObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            startPoint: new this.tp.gp_Pnt_3(o['startPoint'][0], o['startPoint'][1], o['startPoint'][2]),
            endPoint: new this.tp.gp_Pnt_3(o['endPoint'][0], o['endPoint'][1], o['endPoint'][2]),
            inflectionPoints: o['inflectionPoints'].map((p: any) =>
                new this.tp.gp_Pnt_3(p[0], p[1], p[2])),
            radii: o['radii'],
            diameter: o['diameter']
        }
        return this;
    }

    toObject(): CableObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['startPoint', [this.params.startPoint.X(), this.params.startPoint.Y(), this.params.startPoint.Z()]],
            ['endPoint', [this.params.endPoint.X(), this.params.endPoint.Y(), this.params.endPoint.Z()]],
            ['inflectionPoints', this.params.inflectionPoints.map(p =>
                ([p.X(), p.Y(), p.Z()]))],
            ['radii', this.params.radii],
            ['diameter', this.params.diameter]
        ])) as CableObject;
    }
};

export class CurveCablePrimitive extends BasePrimitive<CurveCableParams, CurveCableObject> {

    constructor(tp: TopoInstance, params?: CurveCableObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.CurveCable;
    }

    setDefault(): Primitive<CurveCableParams, CurveCableObject> {
        this.params.controlPoints = [
            [new this.tp.gp_Pnt_3(0, 0, 0), new this.tp.gp_Pnt_3(100, 0, 0)]
        ];
        this.params.curveTypes = [this.tp.CurveType.LINE as any]; // LINE
        this.params.diameter = 10.0;
        return this;
    }

    public setParams(params: CurveCableParams): Primitive<CurveCableParams, CurveCableObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.diameter <= 0) return false;
        if (this.params.controlPoints.length === 0) return false;
        return this.params.controlPoints.length === this.params.curveTypes.length;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCurveCable(this.params), false);
        }
        throw new Error("Invalid parameters for CurveCable");
    }

    fromObject(o?: CurveCableObject): Primitive<CurveCableParams, CurveCableObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        const curveTypes: CurveType[] = [];
        for (const type of o['curveTypes']) {
            if (type === 'LINE') curveTypes.push(this.tp.CurveType.LINE as any);
            else if (type === 'ARC') curveTypes.push(this.tp.CurveType.ARC as any);
            else if (type === 'SPLINE') curveTypes.push(this.tp.CurveType.SPLINE as any);
            else throw new Error(`Invalid curve type: ${type}`);
        }

        this.params = {
            controlPoints: o['controlPoints'].map((pointGroup: any) =>
                pointGroup.map((p: any) =>
                    new this.tp.gp_Pnt_3(p[0], p[1], p[2]))),
            curveTypes: curveTypes,
            diameter: o['diameter']
        }
        return this;
    }

    toObject(): CurveCableObject | undefined {
        const curveTypes: string[] = [];
        for (const type of this.params.curveTypes) {
            if (type === this.tp.CurveType.LINE as any) curveTypes.push('LINE');
            else if (type === this.tp.CurveType.ARC as any) curveTypes.push('ARC');
            else if (type === this.tp.CurveType.SPLINE as any) curveTypes.push('SPLINE');
            else throw new Error(`Invalid curve type: ${type}`);
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['controlPoints', this.params.controlPoints.map(pointGroup =>
                pointGroup.map(p => ([p.X(), p.Y(), p.Z()])))],
            ['curveTypes', curveTypes],
            ['diameter', this.params.diameter]
        ])) as CurveCableObject;
    }
};

export class AngleSteelPrimitive extends BasePrimitive<AngleSteelParams, AngleSteelObject> {

    constructor(tp: TopoInstance, params?: AngleSteelObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.AngleSteel;
    }

    setDefault(): Primitive<AngleSteelParams, AngleSteelObject> {
        this.params.L1 = 60.0;
        this.params.L2 = 40.0;
        this.params.X = 5.0;
        this.params.length = 200.0;
        return this;
    }

    public setParams(params: AngleSteelParams): Primitive<AngleSteelParams, AngleSteelObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.L1 <= 0 || this.params.L2 <= 0 ||
            this.params.X <= 0 || this.params.length <= 0) return false;
        if (this.params.L2 >= this.params.L1) return false;
        return this.params.X < this.params.L1 && this.params.X < this.params.L2;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createAngleSteel(this.params), false);
        }
        throw new Error("Invalid parameters for AngleSteel");
    }

    fromObject(o?: AngleSteelObject): Primitive<AngleSteelParams, AngleSteelObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            L1: o['L1'],
            L2: o['L2'],
            X: o['X'],
            length: o['length']
        }
        return this;
    }

    toObject(): AngleSteelObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['X', this.params.X],
            ['length', this.params.length]
        ])) as AngleSteelObject;
    }
};

export class IShapedSteelPrimitive extends BasePrimitive<IShapedSteelParams, IShapedSteelObject> {

    constructor(tp: TopoInstance, params?: IShapedSteelObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.IShapedSteel;
    }

    setDefault(): Primitive<IShapedSteelParams, IShapedSteelObject> {
        this.params.height = 200.0;
        this.params.flangeWidth = 150.0;
        this.params.webThickness = 12.0;
        this.params.flangeThickness = 8.0;
        this.params.length = 1000.0;
        return this;
    }

    public setParams(params: IShapedSteelParams): Primitive<IShapedSteelParams, IShapedSteelObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        return this.params.height > 0 &&
            this.params.flangeWidth > 0 &&
            this.params.webThickness > 0 &&
            this.params.flangeThickness > 0 &&
            this.params.length > 0;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createIShapedSteel(this.params), false);
        }
        throw new Error("Invalid parameters for IShapedSteel");
    }

    fromObject(o?: IShapedSteelObject): Primitive<IShapedSteelParams, IShapedSteelObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            height: o['height'],
            flangeWidth: o['flangeWidth'],
            webThickness: o['webThickness'],
            flangeThickness: o['flangeThickness'],
            length: o['length']
        }
        return this;
    }

    toObject(): IShapedSteelObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['flangeWidth', this.params.flangeWidth],
            ['webThickness', this.params.webThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['length', this.params.length]
        ])) as IShapedSteelObject;
    }
};

export class ChannelSteelPrimitive extends BasePrimitive<ChannelSteelParams, ChannelSteelObject> {

    constructor(tp: TopoInstance, params?: ChannelSteelObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.ChannelSteel;
    }

    setDefault(): Primitive<ChannelSteelParams, ChannelSteelObject> {
        this.params.height = 100.0;
        this.params.flangeWidth = 50.0;
        this.params.webThickness = 6.0;
        this.params.flangeThickness = 8.0;
        this.params.length = 500.0;
        return this;
    }

    public setParams(params: ChannelSteelParams): Primitive<ChannelSteelParams, ChannelSteelObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.height <= 0 || this.params.flangeWidth <= 0 ||
            this.params.webThickness <= 0 || this.params.flangeThickness <= 0 ||
            this.params.length <= 0) return false;
        if (this.params.webThickness >= this.params.flangeWidth) return false;
        return (2 * this.params.flangeThickness) < this.params.height;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createChannelSteel(this.params), false);
        }
        throw new Error("Invalid parameters for ChannelSteel");
    }

    fromObject(o?: ChannelSteelObject): Primitive<ChannelSteelParams, ChannelSteelObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            height: o['height'],
            flangeWidth: o['flangeWidth'],
            webThickness: o['webThickness'],
            flangeThickness: o['flangeThickness'],
            length: o['length']
        }
        return this;
    }

    toObject(): ChannelSteelObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['flangeWidth', this.params.flangeWidth],
            ['webThickness', this.params.webThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['length', this.params.length]
        ])) as ChannelSteelObject;
    }
};

export class TSteelPrimitive extends BasePrimitive<TSteelParams, TSteelObject> {

    constructor(tp: TopoInstance, params?: TSteelObject) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TSteel;
    }

    setDefault(): Primitive<TSteelParams, TSteelObject> {
        this.params.height = 120.0;
        this.params.width = 60.0;
        this.params.webThickness = 8.0;
        this.params.flangeThickness = 10.0;
        this.params.length = 600.0;
        return this;
    }

    public setParams(params: TSteelParams): Primitive<TSteelParams, TSteelObject> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.height <= 0 || this.params.width <= 0 ||
            this.params.webThickness <= 0 || this.params.flangeThickness <= 0 ||
            this.params.length <= 0) return false;
        if (this.params.webThickness >= this.params.width) return false;
        return this.params.flangeThickness < this.params.height;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTSteel(this.params), false);
        }
        throw new Error("Invalid parameters for TSteel");
    }

    fromObject(o?: TSteelObject): Primitive<TSteelParams, TSteelObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }
        this.params = {
            height: o['height'],
            width: o['width'],
            webThickness: o['webThickness'],
            flangeThickness: o['flangeThickness'],
            length: o['length']
        }
        return this;
    }

    toObject(): TSteelObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['height', this.params.height],
            ['width', this.params.width],
            ['webThickness', this.params.webThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['length', this.params.length]
        ])) as TSteelObject;
    }
};

export type GSPrimitive =
    | SpherePrimitive
    | RotationalEllipsoidPrimitive
    | CuboidPrimitive
    | DiamondFrustumPrimitive
    | OffsetRectangularTablePrimitive
    | CylinderPrimitive
    | SharpBentCylinderPrimitive
    | TruncatedConePrimitive
    | EccentricTruncatedConePrimitive
    | RingPrimitive
    | RectangularRingPrimitive
    | EllipticRingPrimitive
    | CircularGasketPrimitive
    | TableGasketPrimitive
    | SquareGasketPrimitive
    | StretchedBodyPrimitive
    | PorcelainBushingPrimitive
    | ConePorcelainBushingPrimitive
    | InsulatorStringPrimitive
    | VTypeInsulatorPrimitive
    | TerminalBlockPrimitive
    | RectangularHolePlatePrimitive
    | CircularFixedPlatePrimitive
    | WirePrimitive
    | CablePrimitive
    | CurveCablePrimitive
    | AngleSteelPrimitive
    | IShapedSteelPrimitive
    | ChannelSteelPrimitive
    | TSteelPrimitive;

export function createGSPrimitive(tp: TopoInstance, args?: GSPrimitiveType | any): GSPrimitive | undefined {
    if (args === undefined) {
        return undefined;
    }
    let type: GSPrimitiveType | undefined = undefined;
    let obj: any = undefined;
    if (args && args['type'] !== undefined) {
        type = args['type'];
        obj = args;
    } else if (typeof args === 'string') {
        type = args as GSPrimitiveType;
    }
    let primitive: GSPrimitive | undefined = undefined;

    switch (type) {
        case GSPrimitiveType.Sphere:
            primitive = new SpherePrimitive(tp);
            break;
        case GSPrimitiveType.RotationalEllipsoid:
            primitive = new RotationalEllipsoidPrimitive(tp);
            break;
        case GSPrimitiveType.Cuboid:
            primitive = new CuboidPrimitive(tp);
            break;
        case GSPrimitiveType.DiamondFrustum:
            primitive = new DiamondFrustumPrimitive(tp);
            break;
        case GSPrimitiveType.OffsetRectangularTable:
            primitive = new OffsetRectangularTablePrimitive(tp);
            break;
        case GSPrimitiveType.Cylinder:
            primitive = new CylinderPrimitive(tp);
            break;
        case GSPrimitiveType.SharpBentCylinder:
            primitive = new SharpBentCylinderPrimitive(tp);
            break;
        case GSPrimitiveType.TruncatedCone:
            primitive = new TruncatedConePrimitive(tp);
            break;
        case GSPrimitiveType.EccentricTruncatedCone:
            primitive = new EccentricTruncatedConePrimitive(tp);
            break;
        case GSPrimitiveType.Ring:
            primitive = new RingPrimitive(tp);
            break;
        case GSPrimitiveType.RectangularRing:
            primitive = new RectangularRingPrimitive(tp);
            break;
        case GSPrimitiveType.EllipticRing:
            primitive = new EllipticRingPrimitive(tp);
            break;
        case GSPrimitiveType.CircularGasket:
            primitive = new CircularGasketPrimitive(tp);
            break;
        case GSPrimitiveType.TableGasket:
            primitive = new TableGasketPrimitive(tp);
            break;
        case GSPrimitiveType.SquareGasket:
            primitive = new SquareGasketPrimitive(tp);
            break;
        case GSPrimitiveType.StretchedBody:
            primitive = new StretchedBodyPrimitive(tp);
            break;
        case GSPrimitiveType.PorcelainBushing:
            primitive = new PorcelainBushingPrimitive(tp);
            break;
        case GSPrimitiveType.ConePorcelainBushing:
            primitive = new ConePorcelainBushingPrimitive(tp);
            break;
        case GSPrimitiveType.InsulatorString:
            primitive = new InsulatorStringPrimitive(tp);
            break;
        case GSPrimitiveType.VTypeInsulator:
            primitive = new VTypeInsulatorPrimitive(tp);
            break;
        case GSPrimitiveType.TerminalBlock:
            primitive = new TerminalBlockPrimitive(tp);
            break;
        case GSPrimitiveType.RectangularHolePlate:
            primitive = new RectangularHolePlatePrimitive(tp);
            break;
        case GSPrimitiveType.CircularFixedPlate:
            primitive = new CircularFixedPlatePrimitive(tp);
            break;
        case GSPrimitiveType.Wire:
            primitive = new WirePrimitive(tp);
            break;
        case GSPrimitiveType.Cable:
            primitive = new CablePrimitive(tp);
            break;
        case GSPrimitiveType.CurveCable:
            primitive = new CurveCablePrimitive(tp);
            break;
        case GSPrimitiveType.AngleSteel:
            primitive = new AngleSteelPrimitive(tp);
            break;
        case GSPrimitiveType.IShapedSteel:
            primitive = new IShapedSteelPrimitive(tp);
            break;
        case GSPrimitiveType.ChannelSteel:
            primitive = new ChannelSteelPrimitive(tp);
            break;
        case GSPrimitiveType.TSteel:
            primitive = new TSteelPrimitive(tp);
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