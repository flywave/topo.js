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
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../../primitive";

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

export class SpherePrimitive extends BasePrimitive<SphereParams> {

    constructor(tp: TopoInstance, params?: SphereParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Sphere;
    }

    setDefault(): Primitive<SphereParams> {
        this.params.radius = 10;
        return this;
    }

    public setParams(params: SphereParams): Primitive<SphereParams> {
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

    fromObject(o: any): Primitive<SphereParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            radius: o['radius'],
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['radius', this.params.radius],
        ]));
    }
};

export class RotationalEllipsoidPrimitive extends BasePrimitive<RotationalEllipsoidParams> {

    constructor(tp: TopoInstance, params?: RotationalEllipsoidParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.RotationalEllipsoid;
    }

    setDefault(): Primitive<RotationalEllipsoidParams> {
        this.params.polarRadius = 10.0;
        this.params.equatorialRadius = 5.0;
        this.params.height = 10.0;
        return this;
    }

    public setParams(params: RotationalEllipsoidParams): Primitive<RotationalEllipsoidParams> {
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

    fromObject(o: any): Primitive<RotationalEllipsoidParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            polarRadius: o['polarRadius'],
            equatorialRadius: o['equatorialRadius'],
            height: o['height'],
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['polarRadius', this.params.polarRadius],
            ['equatorialRadius', this.params.equatorialRadius],
            ['height', this.params.height],
        ]));
    }
};

export class CuboidPrimitive extends BasePrimitive<CuboidParams> {

    constructor(tp: TopoInstance, params?: CuboidParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Cuboid;
    }

    setDefault(): Primitive<CuboidParams> {
        this.params.length = 10.0;
        this.params.width = 5.0;
        this.params.height = 3.0;
        return this;
    }

    public setParams(params: CuboidParams): Primitive<CuboidParams> {
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

    fromObject(o: any): Primitive<CuboidParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            length: o['length'],
            width: o['width'],
            height: o['height']
        }
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
};

export class DiamondFrustumPrimitive extends BasePrimitive<DiamondFrustumParams> {

    constructor(tp: TopoInstance, params?: DiamondFrustumParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.DiamondFrustum;
    }

    setDefault(): Primitive<DiamondFrustumParams> {
        this.params.topDiag1 = 10.0;
        this.params.topDiag2 = 7.5;
        this.params.bottomDiag1 = 20.0;
        this.params.bottomDiag2 = 15.0;
        this.params.height = 12.0;
        return this;
    }

    public setParams(params: DiamondFrustumParams): Primitive<DiamondFrustumParams> {
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

    fromObject(o: any): Primitive<DiamondFrustumParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['topDiag1', this.params.topDiag1],
            ['topDiag2', this.params.topDiag2],
            ['bottomDiag1', this.params.bottomDiag1],
            ['bottomDiag2', this.params.bottomDiag2],
            ['height', this.params.height]
        ]));
    }
};

export class OffsetRectangularTablePrimitive extends BasePrimitive<OffsetRectangularTableParams> {

    constructor(tp: TopoInstance, params?: OffsetRectangularTableParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.OffsetRectangularTable;
    }

    setDefault(): Primitive<OffsetRectangularTableParams> {
        this.params.topLength = 15.0;
        this.params.topWidth = 10.0;
        this.params.bottomLength = 20.0;
        this.params.bottomWidth = 12.0;
        this.params.height = 8.0;
        this.params.xOffset = 2.0;
        this.params.yOffset = 1.5;
        return this;
    }

    public setParams(params: OffsetRectangularTableParams): Primitive<OffsetRectangularTableParams> {
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

    fromObject(o: any): Primitive<OffsetRectangularTableParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['topLength', this.params.topLength],
            ['topWidth', this.params.topWidth],
            ['bottomLength', this.params.bottomLength],
            ['bottomWidth', this.params.bottomWidth],
            ['height', this.params.height],
            ['xOffset', this.params.xOffset],
            ['yOffset', this.params.yOffset]
        ]));
    }
};

export class CylinderPrimitive extends BasePrimitive<CylinderParams> {

    constructor(tp: TopoInstance, params?: CylinderParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Cylinder;
    }

    setDefault(): Primitive<CylinderParams> {
        this.params.radius = 15.0;
        this.params.height = 25.0;
        return this;
    }

    public setParams(params: CylinderParams): Primitive<CylinderParams> {
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

    fromObject(o: any): Primitive<CylinderParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            radius: o['radius'],
            height: o['height']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['radius', this.params.radius],
            ['height', this.params.height]
        ]));
    }
};

export class SharpBentCylinderPrimitive extends BasePrimitive<SharpBentCylinderParams> {

    constructor(tp: TopoInstance, params?: SharpBentCylinderParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.SharpBentCylinder;
    }

    setDefault(): Primitive<SharpBentCylinderParams> {
        this.params.radius = 5.0;
        this.params.length = 70.0;
        this.params.bendAngle = Math.PI / 4;
        return this;
    }

    public setParams(params: SharpBentCylinderParams): Primitive<SharpBentCylinderParams> {
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

    fromObject(o: any): Primitive<SharpBentCylinderParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            radius: o['radius'],
            length: o['length'],
            bendAngle: o['bendAngle']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['radius', this.params.radius],
            ['length', this.params.length],
            ['bendAngle', this.params.bendAngle]
        ]));
    }
};

export class TruncatedConePrimitive extends BasePrimitive<TruncatedConeParams> {

    constructor(tp: TopoInstance, params?: TruncatedConeParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TruncatedCone;
    }

    setDefault(): Primitive<TruncatedConeParams> {
        this.params.topRadius = 5.0;
        this.params.bottomRadius = 10.0;
        this.params.height = 15.0;
        return this;
    }

    public setParams(params: TruncatedConeParams): Primitive<TruncatedConeParams> {
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

    fromObject(o: any): Primitive<TruncatedConeParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            topRadius: o['topRadius'],
            bottomRadius: o['bottomRadius'],
            height: o['height']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['topRadius', this.params.topRadius],
            ['bottomRadius', this.params.bottomRadius],
            ['height', this.params.height]
        ]));
    }
};

export class EccentricTruncatedConePrimitive extends BasePrimitive<EccentricTruncatedConeParams> {

    constructor(tp: TopoInstance, params?: EccentricTruncatedConeParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.EccentricTruncatedCone;
    }

    setDefault(): Primitive<EccentricTruncatedConeParams> {
        this.params.topRadius = 5.0;
        this.params.bottomRadius = 10.0;
        this.params.height = 15.0;
        this.params.topXOffset = 2.0;
        this.params.topYOffset = 3.0;
        return this;
    }

    public setParams(params: EccentricTruncatedConeParams): Primitive<EccentricTruncatedConeParams> {
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

    fromObject(o: any): Primitive<EccentricTruncatedConeParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['topRadius', this.params.topRadius],
            ['bottomRadius', this.params.bottomRadius],
            ['height', this.params.height],
            ['topXOffset', this.params.topXOffset],
            ['topYOffset', this.params.topYOffset]
        ]));
    }
};

export class RingPrimitive extends BasePrimitive<RingParams> {

    constructor(tp: TopoInstance, params?: RingParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Ring;
    }

    setDefault(): Primitive<RingParams> {
        this.params.ringRadius = 20.0;
        this.params.tubeRadius = 5.0;
        this.params.angle = Math.PI * 1.5;
        return this;
    }

    public setParams(params: RingParams): Primitive<RingParams> {
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

    fromObject(o: any): Primitive<RingParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            ringRadius: o['ringRadius'],
            tubeRadius: o['tubeRadius'],
            angle: o['angle']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['ringRadius', this.params.ringRadius],
            ['tubeRadius', this.params.tubeRadius],
            ['angle', this.params.angle]
        ]));
    }
};

export class RectangularRingPrimitive extends BasePrimitive<RectangularRingParams> {

    constructor(tp: TopoInstance, params?: RectangularRingParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.RectangularRing;
    }

    setDefault(): Primitive<RectangularRingParams> {
        this.params.tubeRadius = 5.0;
        this.params.filletRadius = 0.0;
        this.params.length = 100.0;
        this.params.width = 80.0;
        return this;
    }

    public setParams(params: RectangularRingParams): Primitive<RectangularRingParams> {
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

    fromObject(o: any): Primitive<RectangularRingParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            tubeRadius: o['tubeRadius'],
            filletRadius: o['filletRadius'],
            length: o['length'],
            width: o['width']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['tubeRadius', this.params.tubeRadius],
            ['filletRadius', this.params.filletRadius],
            ['length', this.params.length],
            ['width', this.params.width]
        ]));
    }
};

export class EllipticRingPrimitive extends BasePrimitive<EllipticRingParams> {

    constructor(tp: TopoInstance, params?: EllipticRingParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.EllipticRing;
    }

    setDefault(): Primitive<EllipticRingParams> {
        this.params.tubeRadius = 3.0;
        this.params.majorRadius = 20.0;
        this.params.minorRadius = 10.0;
        return this;
    }

    public setParams(params: EllipticRingParams): Primitive<EllipticRingParams> {
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

    fromObject(o: any): Primitive<EllipticRingParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            tubeRadius: o['tubeRadius'],
            majorRadius: o['majorRadius'],
            minorRadius: o['minorRadius']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['tubeRadius', this.params.tubeRadius],
            ['majorRadius', this.params.majorRadius],
            ['minorRadius', this.params.minorRadius]
        ]));
    }
};

export class CircularGasketPrimitive extends BasePrimitive<CircularGasketParams> {

    constructor(tp: TopoInstance, params?: CircularGasketParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.CircularGasket;
    }

    setDefault(): Primitive<CircularGasketParams> {
        this.params.outerRadius = 20.0;
        this.params.innerRadius = 15.0;
        this.params.height = 5.0;
        this.params.angle = Math.PI * 1.5;
        return this;
    }

    public setParams(params: CircularGasketParams): Primitive<CircularGasketParams> {
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

    fromObject(o: any): Primitive<CircularGasketParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            outerRadius: o['outerRadius'],
            innerRadius: o['innerRadius'],
            height: o['height'],
            angle: o['angle']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['outerRadius', this.params.outerRadius],
            ['innerRadius', this.params.innerRadius],
            ['height', this.params.height],
            ['angle', this.params.angle]
        ]));
    }
};

export class TableGasketPrimitive extends BasePrimitive<TableGasketParams> {

    constructor(tp: TopoInstance, params?: TableGasketParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TableGasket;
    }

    setDefault(): Primitive<TableGasketParams> {
        this.params.topRadius = 15.0;
        this.params.outerRadius = 20.0;
        this.params.innerRadius = 10.0;
        this.params.height = 6.0;
        this.params.angle = Math.PI * 1.5;
        return this;
    }

    public setParams(params: TableGasketParams): Primitive<TableGasketParams> {
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

    fromObject(o: any): Primitive<TableGasketParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            topRadius: o['topRadius'],
            outerRadius: o['outerRadius'],
            innerRadius: o['innerRadius'],
            height: o['height'],
            angle: o['angle']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['topRadius', this.params.topRadius],
            ['outerRadius', this.params.outerRadius],
            ['innerRadius', this.params.innerRadius],
            ['height', this.params.height],
            ['angle', this.params.angle]
        ]));
    }
};

export class SquareGasketPrimitive extends BasePrimitive<SquareGasketParams> {

    constructor(tp: TopoInstance, params?: SquareGasketParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.SquareGasket;
    }

    setDefault(): Primitive<SquareGasketParams> {
        this.params.outerLength = 30.0;
        this.params.outerWidth = 20.0;
        this.params.innerLength = 25.0;
        this.params.innerWidth = 15.0;
        this.params.height = 5.0;
        this.params.cornerType = 1;
        this.params.cornerParam = 0;
        return this;
    }

    public setParams(params: SquareGasketParams): Primitive<SquareGasketParams> {
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

    fromObject(o: any): Primitive<SquareGasketParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['outerLength', this.params.outerLength],
            ['outerWidth', this.params.outerWidth],
            ['innerLength', this.params.innerLength],
            ['innerWidth', this.params.innerWidth],
            ['height', this.params.height],
            ['cornerType', this.params.cornerType],
            ['cornerParam', this.params.cornerParam]
        ]));
    }
};

export class StretchedBodyPrimitive extends BasePrimitive<StretchedBodyParams> {

    constructor(tp: TopoInstance, params?: StretchedBodyParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.StretchedBody;
    }

    setDefault(): Primitive<StretchedBodyParams> {
        this.params.points = [
            new this.tp.gp_Pnt_3(0, 0, 0),
            new this.tp.gp_Pnt_3(10, 0, 0),
            new this.tp.gp_Pnt_3(5, 8, 0)
        ];
        this.params.normal = new this.tp.gp_Dir_4(0, 0, 1);
        this.params.length = 15.0;
        return this;
    }

    public setParams(params: StretchedBodyParams): Primitive<StretchedBodyParams> {
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

    fromObject(o: any): Primitive<StretchedBodyParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            points: o['points'].map((p: any) => new this.tp.gp_Pnt_3(p.x, p.y, p.z)),
            normal: new this.tp.gp_Dir_4(o['normal'].x, o['normal'].y, o['normal'].z),
            length: o['length']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['points', this.params.points.map(p => ({ x: p.X(), y: p.Y(), z: p.Z() }))],
            ['normal', { x: this.params.normal.X(), y: this.params.normal.Y(), z: this.params.normal.Z() }],
            ['length', this.params.length]
        ]));
    }
};

export class PorcelainBushingPrimitive extends BasePrimitive<PorcelainBushingParams> {

    constructor(tp: TopoInstance, params?: PorcelainBushingParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.PorcelainBushing;
    }

    setDefault(): Primitive<PorcelainBushingParams> {
        this.params.height = 100.0;
        this.params.radius = 10.0;
        this.params.bigSkirtRadius = 15.0;
        this.params.smallSkirtRadius = 12.0;
        this.params.count = 20;
        return this;
    }

    public setParams(params: PorcelainBushingParams): Primitive<PorcelainBushingParams> {
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

    fromObject(o: any): Primitive<PorcelainBushingParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['height', this.params.height],
            ['radius', this.params.radius],
            ['bigSkirtRadius', this.params.bigSkirtRadius],
            ['smallSkirtRadius', this.params.smallSkirtRadius],
            ['count', this.params.count]
        ]));
    }
};

export class ConePorcelainBushingPrimitive extends BasePrimitive<ConePorcelainBushingParams> {

    constructor(tp: TopoInstance, params?: ConePorcelainBushingParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.ConePorcelainBushing;
    }

    setDefault(): Primitive<ConePorcelainBushingParams> {
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

    public setParams(params: ConePorcelainBushingParams): Primitive<ConePorcelainBushingParams> {
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

    fromObject(o: any): Primitive<ConePorcelainBushingParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['height', this.params.height],
            ['bottomRadius', this.params.bottomRadius],
            ['topRadius', this.params.topRadius],
            ['bottomSkirtRadius1', this.params.bottomSkirtRadius1],
            ['bottomSkirtRadius2', this.params.bottomSkirtRadius2],
            ['topSkirtRadius1', this.params.topSkirtRadius1],
            ['topSkirtRadius2', this.params.topSkirtRadius2],
            ['count', this.params.count]
        ]));
    }
};

export class InsulatorStringPrimitive extends BasePrimitive<InsulatorStringParams> {

    constructor(tp: TopoInstance, params?: InsulatorStringParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.InsulatorString;
    }

    setDefault(): Primitive<InsulatorStringParams> {
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

    public setParams(params: InsulatorStringParams): Primitive<InsulatorStringParams> {
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

    fromObject(o: any): Primitive<InsulatorStringParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
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
        ]));
    }
};

export class VTypeInsulatorPrimitive extends BasePrimitive<VTypeInsulatorParams> {

    constructor(tp: TopoInstance, params?: VTypeInsulatorParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.VTypeInsulator;
    }

    setDefault(): Primitive<VTypeInsulatorParams> {
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

    public setParams(params: VTypeInsulatorParams): Primitive<VTypeInsulatorParams> {
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

    fromObject(o: any): Primitive<VTypeInsulatorParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
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
        ]));
    }
};

export class TerminalBlockPrimitive extends BasePrimitive<TerminalBlockParams> {

    constructor(tp: TopoInstance, params?: TerminalBlockParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TerminalBlock;
    }

    setDefault(): Primitive<TerminalBlockParams> {
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

    public setParams(params: TerminalBlockParams): Primitive<TerminalBlockParams> {
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

    fromObject(o: any): Primitive<TerminalBlockParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
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
        ]));
    }
};

export class RectangularHolePlatePrimitive extends BasePrimitive<RectangularHolePlateParams> {

    constructor(tp: TopoInstance, params?: RectangularHolePlateParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.RectangularHolePlate;
    }

    setDefault(): Primitive<RectangularHolePlateParams> {
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

    public setParams(params: RectangularHolePlateParams): Primitive<RectangularHolePlateParams> {
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

    fromObject(o: any): Primitive<RectangularHolePlateParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['columnSpacing', this.params.columnSpacing],
            ['rowSpacing', this.params.rowSpacing],
            ['columnCount', this.params.columnCount],
            ['rowCount', this.params.rowCount],
            ['hasMiddleHole', this.params.hasMiddleHole],
            ['holeDiameter', this.params.holeDiameter]
        ]));
    }
};

export class CircularFixedPlatePrimitive extends BasePrimitive<CircularFixedPlateParams> {

    constructor(tp: TopoInstance, params?: CircularFixedPlateParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.CircularFixedPlate;
    }

    setDefault(): Primitive<CircularFixedPlateParams> {
        this.params.length = 200.0;
        this.params.width = 200.0;
        this.params.thickness = 12.0;
        this.params.ringRadius = 60.0;
        this.params.holeCount = 8;
        this.params.hasMiddleHole = true;
        this.params.holeDiameter = 15.0;
        return this;
    }

    public setParams(params: CircularFixedPlateParams): Primitive<CircularFixedPlateParams> {
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

    fromObject(o: any): Primitive<CircularFixedPlateParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['length', this.params.length],
            ['width', this.params.width],
            ['thickness', this.params.thickness],
            ['ringRadius', this.params.ringRadius],
            ['holeCount', this.params.holeCount],
            ['hasMiddleHole', this.params.hasMiddleHole],
            ['holeDiameter', this.params.holeDiameter]
        ]));
    }
};

export class WirePrimitive extends BasePrimitive<WireParams> {

    constructor(tp: TopoInstance, params?: WireParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Wire;
    }

    setDefault(): Primitive<WireParams> {
        this.params.startPoint = new this.tp.gp_Pnt_3(0, 0, 0);
        this.params.endPoint = new this.tp.gp_Pnt_3(100, 0, 0);
        this.params.startDir = new this.tp.gp_Dir_4(1, 0, 0);
        this.params.endDir = new this.tp.gp_Dir_4(1, 0, 0);
        this.params.sag = 10.0;
        this.params.diameter = 5.0;
        this.params.fitPoints = [];
        return this;
    }

    public setParams(params: WireParams): Primitive<WireParams> {
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

    fromObject(o: any): Primitive<WireParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            startPoint: new this.tp.gp_Pnt_3(o['startPoint'].x, o['startPoint'].y, o['startPoint'].z),
            endPoint: new this.tp.gp_Pnt_3(o['endPoint'].x, o['endPoint'].y, o['endPoint'].z),
            startDir: new this.tp.gp_Dir_4(o['startDir'].x, o['startDir'].y, o['startDir'].z),
            endDir: new this.tp.gp_Dir_4(o['endDir'].x, o['endDir'].y, o['endDir'].z),
            sag: o['sag'],
            diameter: o['diameter'],
            fitPoints: o['fitPoints'].map((p: any) => new this.tp.gp_Pnt_3(p.x, p.y, p.z))
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['startPoint', { x: this.params.startPoint.X(), y: this.params.startPoint.Y(), z: this.params.startPoint.Z() }],
            ['endPoint', { x: this.params.endPoint.X(), y: this.params.endPoint.Y(), z: this.params.endPoint.Z() }],
            ['startDir', { x: this.params.startDir.X(), y: this.params.startDir.Y(), z: this.params.startDir.Z() }],
            ['endDir', { x: this.params.endDir.X(), y: this.params.endDir.Y(), z: this.params.endDir.Z() }],
            ['sag', this.params.sag],
            ['diameter', this.params.diameter],
            ['fitPoints', this.params.fitPoints.map(p => ({ x: p.X(), y: p.Y(), z: p.Z() }))]
        ]));
    }
};

export class CablePrimitive extends BasePrimitive<CableParams> {

    constructor(tp: TopoInstance, params?: CableParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.Cable;
    }

    setDefault(): Primitive<CableParams> {
        this.params.startPoint = new this.tp.gp_Pnt_3(0, 0, 0);
        this.params.endPoint = new this.tp.gp_Pnt_3(100, 0, 0);
        this.params.inflectionPoints = [];
        this.params.radii = [];
        this.params.diameter = 10.0;
        return this;
    }

    public setParams(params: CableParams): Primitive<CableParams> {
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

    fromObject(o: any): Primitive<CableParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            startPoint: new this.tp.gp_Pnt_3(o['startPoint'].x, o['startPoint'].y, o['startPoint'].z),
            endPoint: new this.tp.gp_Pnt_3(o['endPoint'].x, o['endPoint'].y, o['endPoint'].z),
            inflectionPoints: o['inflectionPoints'].map((p: any) =>
                new this.tp.gp_Pnt_3(p.x, p.y, p.z)),
            radii: o['radii'],
            diameter: o['diameter']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['startPoint', { x: this.params.startPoint.X(), y: this.params.startPoint.Y(), z: this.params.startPoint.Z() }],
            ['endPoint', { x: this.params.endPoint.X(), y: this.params.endPoint.Y(), z: this.params.endPoint.Z() }],
            ['inflectionPoints', this.params.inflectionPoints.map(p =>
                ({ x: p.X(), y: p.Y(), z: p.Z() }))],
            ['radii', this.params.radii],
            ['diameter', this.params.diameter]
        ]));
    }
};

export class CurveCablePrimitive extends BasePrimitive<CurveCableParams> {

    constructor(tp: TopoInstance, params?: CurveCableParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.CurveCable;
    }

    setDefault(): Primitive<CurveCableParams> {
        this.params.controlPoints = [
            [new this.tp.gp_Pnt_3(0, 0, 0), new this.tp.gp_Pnt_3(100, 0, 0)]
        ];
        this.params.curveTypes = [this.tp.CurveType.LINE as any]; // LINE
        this.params.diameter = 10.0;
        return this;
    }

    public setParams(params: CurveCableParams): Primitive<CurveCableParams> {
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

    fromObject(o: any): Primitive<CurveCableParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            controlPoints: o['controlPoints'].map((pointGroup: any) =>
                pointGroup.map((p: any) =>
                    new this.tp.gp_Pnt_3(p.x, p.y, p.z))),
            curveTypes: o['curveTypes'],
            diameter: o['diameter']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['controlPoints', this.params.controlPoints.map(pointGroup =>
                pointGroup.map(p => ({ x: p.X(), y: p.Y(), z: p.Z() })))],
            ['curveTypes', this.params.curveTypes],
            ['diameter', this.params.diameter]
        ]));
    }
};

export class AngleSteelPrimitive extends BasePrimitive<AngleSteelParams> {

    constructor(tp: TopoInstance, params?: AngleSteelParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.AngleSteel;
    }

    setDefault(): Primitive<AngleSteelParams> {
        this.params.L1 = 60.0;
        this.params.L2 = 40.0;
        this.params.X = 5.0;
        this.params.length = 200.0;
        return this;
    }

    public setParams(params: AngleSteelParams): Primitive<AngleSteelParams> {
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

    fromObject(o: any): Primitive<AngleSteelParams> {
        if (o === undefined) {
            return this;
        }
        this.params = {
            L1: o['L1'],
            L2: o['L2'],
            X: o['X'],
            length: o['length']
        }
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['L1', this.params.L1],
            ['L2', this.params.L2],
            ['X', this.params.X],
            ['length', this.params.length]
        ]));
    }
};

export class IShapedSteelPrimitive extends BasePrimitive<IShapedSteelParams> {

    constructor(tp: TopoInstance, params?: IShapedSteelParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.IShapedSteel;
    }

    setDefault(): Primitive<IShapedSteelParams> {
        this.params.height = 200.0;
        this.params.flangeWidth = 150.0;
        this.params.webThickness = 12.0;
        this.params.flangeThickness = 8.0;
        this.params.length = 1000.0;
        return this;
    }

    public setParams(params: IShapedSteelParams): Primitive<IShapedSteelParams> {
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

    fromObject(o: any): Primitive<IShapedSteelParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['height', this.params.height],
            ['flangeWidth', this.params.flangeWidth],
            ['webThickness', this.params.webThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['length', this.params.length]
        ]));
    }
};

export class ChannelSteelPrimitive extends BasePrimitive<ChannelSteelParams> {

    constructor(tp: TopoInstance, params?: ChannelSteelParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.ChannelSteel;
    }

    setDefault(): Primitive<ChannelSteelParams> {
        this.params.height = 100.0;
        this.params.flangeWidth = 50.0;
        this.params.webThickness = 6.0;
        this.params.flangeThickness = 8.0;
        this.params.length = 500.0;
        return this;
    }

    public setParams(params: ChannelSteelParams): Primitive<ChannelSteelParams> {
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

    fromObject(o: any): Primitive<ChannelSteelParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['height', this.params.height],
            ['flangeWidth', this.params.flangeWidth],
            ['webThickness', this.params.webThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['length', this.params.length]
        ]));
    }
};

export class TSteelPrimitive extends BasePrimitive<TSteelParams> {

    constructor(tp: TopoInstance, params?: TSteelParams) {
        super(tp, params);
    }

    getType(): string {
        return GSPrimitiveType.TSteel;
    }

    setDefault(): Primitive<TSteelParams> {
        this.params.height = 120.0;
        this.params.width = 60.0;
        this.params.webThickness = 8.0;
        this.params.flangeThickness = 10.0;
        this.params.length = 600.0;
        return this;
    }

    public setParams(params: TSteelParams): Primitive<TSteelParams> {
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

    fromObject(o: any): Primitive<TSteelParams> {
        if (o === undefined) {
            return this;
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

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['height', this.params.height],
            ['width', this.params.width],
            ['webThickness', this.params.webThickness],
            ['flangeThickness', this.params.flangeThickness],
            ['length', this.params.length]
        ]));
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