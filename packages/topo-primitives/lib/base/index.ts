import {
    Shape,
    TopoInstance,
    RevolParams,
    ShapeProfile,
    RectangleProfile,
    TriangleProfile,
    CircProfile,
    ElipsProfile,
    PolygonProfile,
    PrismParams,
    PipeParams,
    MultiSegmentPipeParams,
    PipeJointParams,
    CatenaryParams,
    BoxShapeParams,
    ConeShapeParams,
    CylinderShapeParams,
    RevolutionShapeParams,
    SphereShapeParams,
    TorusShapeParams,
    WedgeShapeParams,
    PipeShapeParams
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";

export enum BasePrimitiveType {
    Revol = "Revol",
    Prism = "Prism",
    Pipe = "Pipe",
    MultiSegmentPipe = "MultiSegmentPipe",
    PipeJoint = "PipeJoint",
    Catenary = "Catenary",
    BoxShape = "BoxShape",
    ConeShape = "ConeShape",
    CylinderShape = "CylinderShape",
    RevolutionShape = "RevolutionShape",
    SphereShape = "SphereShape",
    TorusShape = "TorusShape",
    WedgeShape = "WedgeShape",
    PipeShape = "PipeShape"
}

export type ShapePrimitive = RevolPrimitive
    | PrismPrimitive
    | PipePrimitive
    | MultiSegmentPipePrimitive
    | PipeJointPrimitive
    | CatenaryPrimitive
    | BoxShapePrimitive
    | ConeShapePrimitive
    | CylinderShapePrimitive
    | RevolutionShapePrimitive
    | SphereShapePrimitive
    | TorusShapePrimitive
    | WedgeShapePrimitive
    | PipeShapePrimitive;


export function deserializeProfile(tp: TopoInstance, o: any): ShapeProfile {
    switch (o.profile.type) {
        case tp.ProfileType.TRIANGLE:
            return {
                type: tp.ProfileType.TRIANGLE,
                p1: new tp.gp_Pnt_3(o.profile.p1.x, o.profile.p1.y, o.profile.p1.z),
                p2: new tp.gp_Pnt_3(o.profile.p2.x, o.profile.p2.y, o.profile.p2.z),
                p3: new tp.gp_Pnt_3(o.profile.p3.x, o.profile.p3.y, o.profile.p3.z)
            };
        case tp.ProfileType.RECTANGLE:
            return {
                type: tp.ProfileType.RECTANGLE,
                p1: new tp.gp_Pnt_3(o.profile.p1.x, o.profile.p1.y, o.profile.p1.z),
                p2: new tp.gp_Pnt_3(o.profile.p2.x, o.profile.p2.y, o.profile.p2.z)
            };
        case tp.ProfileType.CIRC:
            return {
                type: tp.ProfileType.CIRC,
                center: new tp.gp_Pnt_3(o.profile.center.x, o.profile.center.y, o.profile.center.z),
                norm: new tp.gp_Dir_4(o.profile.norm.x, o.profile.norm.y, o.profile.norm.z),
                radius: o.profile.radius
            };
        case tp.ProfileType.ELIPS:
            return {
                type: tp.ProfileType.ELIPS,
                s1: new tp.gp_Pnt_3(o.profile.s1.x, o.profile.s1.y, o.profile.s1.z),
                s2: new tp.gp_Pnt_3(o.profile.s2.x, o.profile.s2.y, o.profile.s2.z),
                center: new tp.gp_Pnt_3(o.profile.center.x, o.profile.center.y, o.profile.center.z)
            };
        case tp.ProfileType.POLYGON:
            return {
                type: tp.ProfileType.POLYGON,
                edges: o.profile.edges.map((p: any) =>
                    new tp.gp_Pnt_3(p.x, p.y, p.z)),
                inners: o.profile.inners?.map((inner: any[]) =>
                    inner.map(p => new tp.gp_Pnt_3(p.x, p.y, p.z)))
            };
        default:
            throw new Error("Unsupported profile type");
    }
}

export function serializeProfile(tp: TopoInstance, profile: ShapeProfile): any {
    switch (profile.type) {
        case tp.ProfileType.TRIANGLE:
            const tprofile = profile as TriangleProfile;
            return {
                type: tprofile.type,
                p1: {
                    x: tprofile.p1.X(),
                    y: tprofile.p1.Y(),
                    z: tprofile.p1.Z()
                },
                p2: {
                    x: tprofile.p2.X(),
                    y: tprofile.p2.Y(),
                    z: tprofile.p2.Z()
                },
                p3: {
                    x: tprofile.p3.X(),
                    y: tprofile.p3.Y(),
                    z: tprofile.p3.Z()
                }
            };
        case tp.ProfileType.RECTANGLE:
            const rprofile = profile as RectangleProfile;
            return {
                type: rprofile.type,
                p1: {
                    x: rprofile.p1.X(),
                    y: rprofile.p1.Y(),
                    z: rprofile.p1.Z()
                },
                p2: {
                    x: rprofile.p2.X(),
                    y: rprofile.p2.Y(),
                    z: rprofile.p2.Z()
                }
            };
        case tp.ProfileType.CIRC:
            const cprofile = profile as CircProfile;
            return {
                type: cprofile.type,
                center: {
                    x: cprofile.center.X(),
                    y: cprofile.center.Y(),
                    z: cprofile.center.Z()
                },
                norm: {
                    x: cprofile.norm.X(),
                    y: cprofile.norm.Y(),
                    z: cprofile.norm.Z()
                },
                radius: cprofile.radius
            };
        case tp.ProfileType.ELIPS:
            const eprofile = profile as ElipsProfile;
            return {
                type: eprofile.type,
                s1: {
                    x: eprofile.s1.X(),
                    y: eprofile.s1.Y(),
                    z: eprofile.s1.Z()
                },
                s2: {
                    x: eprofile.s2.X(),
                    y: eprofile.s2.Y(),
                    z: eprofile.s2.Z()
                },
                center: {
                    x: eprofile.center.X(),
                    y: eprofile.center.Y(),
                    z: eprofile.center.Z()
                }
            };
        case tp.ProfileType.POLYGON:
            const pprofile = profile as PolygonProfile;
            return {
                type: pprofile.type,
                edges: pprofile.edges.map(p => ({
                    x: p.X(),
                    y: p.Y(),
                    z: p.Z()
                })),
                inners: pprofile.inners?.map(inner =>
                    inner.map(p => ({
                        x: p.X(),
                        y: p.Y(),
                        z: p.Z()
                    })))
            };
        default:
            throw new Error("Unsupported profile type");
    }
}

export class RevolPrimitive extends BasePrimitive<RevolParams> {

    constructor(tp: TopoInstance, params?: RevolParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Revol;
    }

    setDefault(): Primitive<RevolParams> {
        this.params = {
            profile: {
                type: this.tp.ProfileType.RECTANGLE,
                p1: new this.tp.gp_Pnt_3(0, 0, 5),
                p2: new this.tp.gp_Pnt_3(10, 0, 5)
            },
            axis: new this.tp.gp_Ax1_2(
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Dir_4(0, 0, 1)
            ),
            angle: Math.PI / 4
        };
        return this;
    }

    public setParams(params: RevolParams): Primitive<RevolParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.profile) return false;
        if (!this.params.axis) return false;
        if (this.params.angle <= 0) return false;

        // 根据不同的剖面类型进行验证
        switch (this.params.profile.type) {
            case this.tp.ProfileType.TRIANGLE:
                return true;
            case this.tp.ProfileType.RECTANGLE:
                return true;
            case this.tp.ProfileType.CIRC:
                return true;
            case this.tp.ProfileType.ELIPS:
                return true;
            case this.tp.ProfileType.POLYGON:
                return true;
            default:
                return false;
        }
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRevol(this.params), false);
        }
        throw new Error("Invalid parameters for Revol");
    }

    fromObject(o: any): Primitive<RevolParams> {
        if (o === undefined) {
            return this;
        }

        const profile = deserializeProfile(this.tp, o);

        this.params = {
            profile,
            axis: new this.tp.gp_Ax1_2(
                new this.tp.gp_Pnt_3(o.axis.location.x, o.axis.location.y, o.axis.location.z),
                new this.tp.gp_Dir_4(o.axis.direction.x, o.axis.direction.y, o.axis.direction.z)
            ),
            angle: o.angle
        };
        return this;
    }

    toObject(): Object | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        if (profileObj === undefined) {
            return undefined;
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['profile', profileObj],
            ['axis', {
                location: {
                    x: this.params.axis.Location().X(),
                    y: this.params.axis.Location().Y(),
                    z: this.params.axis.Location().Z()
                },
                direction: {
                    x: this.params.axis.Direction().X(),
                    y: this.params.axis.Direction().Y(),
                    z: this.params.axis.Direction().Z()
                }
            }],
            ['angle', this.params.angle]
        ]));
    }
}


export class PrismPrimitive extends BasePrimitive<PrismParams> {

    constructor(tp: TopoInstance, params?: PrismParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Prism;
    }

    setDefault(): Primitive<PrismParams> {
        this.params = {
            profile: {
                type: this.tp.ProfileType.RECTANGLE,
                p1: new this.tp.gp_Pnt_3(0, 0, 0),
                p2: new this.tp.gp_Pnt_3(10, 5, 0)
            },
            dir: new this.tp.gp_Dir_4(0, 0, 20)
        };
        return this;
    }

    public setParams(params: PrismParams): Primitive<PrismParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.profile) return false;
        if (!this.params.dir) return false;

        // 根据不同的剖面类型进行验证
        switch (this.params.profile.type) {
            case this.tp.ProfileType.TRIANGLE:
            case this.tp.ProfileType.RECTANGLE:
            case this.tp.ProfileType.CIRC:
            case this.tp.ProfileType.ELIPS:
            case this.tp.ProfileType.POLYGON:
                return true;
            default:
                return false;
        }
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPrism(this.params), false);
        }
        throw new Error("Invalid parameters for Prism");
    }

    fromObject(o: any): Primitive<PrismParams> {
        if (o === undefined) {
            return this;
        }

        const profile = deserializeProfile(this.tp, o);

        this.params = {
            profile,
            dir: new this.tp.gp_Dir_4(o.dir.x, o.dir.y, o.dir.z)
        };
        return this;
    }

    toObject(): Object | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        if (profileObj === undefined) {
            return undefined;
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['profile', profileObj],
            ['dir', {
                x: this.params.dir.X(),
                y: this.params.dir.Y(),
                z: this.params.dir.Z()
            }]
        ]));
    }
}

export class PipePrimitive extends BasePrimitive<PipeParams> {

    constructor(tp: TopoInstance, params?: PipeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Pipe;
    }

    setDefault(): Primitive<PipeParams> {
        this.params = {
            wire: [new this.tp.gp_Pnt_3(0, 0, 0), new this.tp.gp_Pnt_3(100, 0, 0)],
            profile: {
                type: this.tp.ProfileType.CIRC,
                center: new this.tp.gp_Pnt_3(0, 0, 0),
                norm: new this.tp.gp_Dir_4(0, 0, 1),
                radius: 5.0
            },
            segmentType: this.tp.SegmentType.LINE as any,
            transitionMode: this.tp.TransitionMode.TRANSFORMED as any
        };
        return this;
    }

    public setParams(params: PipeParams): Primitive<PipeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.wire || this.params.wire.length < 2) return false;
        if (!this.params.profile) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPipe(this.params), false);
        }
        throw new Error("Invalid parameters for Pipe");
    }

    fromObject(o: any): Primitive<PipeParams> {
        if (o === undefined) {
            return this;
        }

        const profile = deserializeProfile(this.tp, o);
        const innerProfile = o.innerProfile ? deserializeProfile(this.tp, { profile: o.innerProfile }) : null;

        this.params = {
            wire: o.wire.map((p: any) => new this.tp.gp_Pnt_3(p.x, p.y, p.z)),
            profile,
            innerProfile,
            segmentType: o.segmentType,
            transitionMode: o.transitionMode,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir.x, o.upDir.y, o.upDir.z) : undefined
        };
        return this;
    }

    toObject(): Object | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        const innerProfileObj = this.params.innerProfile ?
            serializeProfile(this.tp, this.params.innerProfile) : null;

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['wire', this.params.wire.map(p => ({ x: p.X(), y: p.Y(), z: p.Z() }))],
            ['profile', profileObj],
            ['innerProfile', innerProfileObj],
            ['segmentType', this.params.segmentType],
            ['transitionMode', this.params.transitionMode],
            ['upDir', this.params.upDir ? {
                x: this.params.upDir.X(),
                y: this.params.upDir.Y(),
                z: this.params.upDir.Z()
            } : null]
        ]));
    }
}

export class MultiSegmentPipePrimitive extends BasePrimitive<MultiSegmentPipeParams> {

    constructor(tp: TopoInstance, params?: MultiSegmentPipeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.MultiSegmentPipe;
    }

    setDefault(): Primitive<MultiSegmentPipeParams> {
        // 默认直线段
        const linePoints = [
            new this.tp.gp_Pnt_3(50, -50, 0),
            new this.tp.gp_Pnt_3(100, 0, 0)
        ];

        // 默认圆形剖面
        const profile = {
            type: this.tp.ProfileType.CIRC,
            center: new this.tp.gp_Pnt_3(0, 0, 0),
            norm: new this.tp.gp_Dir_4(0, 0, 1),
            radius: 10.0
        };

        this.params = {
            wires: [linePoints],
            profiles: [profile],
            segmentTypes: [this.tp.SegmentType.LINE as any],
            transitionMode: this.tp.TransitionMode.ROUND as any
        };
        return this;
    }

    public setParams(params: MultiSegmentPipeParams): Primitive<MultiSegmentPipeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.wires || this.params.wires.length === 0) return false;
        if (!this.params.profiles || this.params.profiles.length === 0) return false;
        if (this.params.wires.length !== this.params.profiles.length) return false;
        if (this.params.segmentTypes && this.params.segmentTypes.length !== this.params.wires.length) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createMultiSegmentPipe(this.params), false);
        }
        throw new Error("Invalid parameters for MultiSegmentPipe");
    }

    fromObject(o: any): Primitive<MultiSegmentPipeParams> {
        if (o === undefined) {
            return this;
        }

        const profiles = o.profiles.map((p: any) => deserializeProfile(this.tp, { profile: p }));
        const innerProfiles = o.innerProfiles ?
            o.innerProfiles.map((p: any) => deserializeProfile(this.tp, { profile: p })) : null;

        this.params = {
            wires: o.wires.map((wire: any[]) =>
                wire.map((p: any) => new this.tp.gp_Pnt_3(p.x, p.y, p.z))),
            profiles,
            innerProfiles,
            segmentTypes: o.segmentTypes,
            transitionMode: o.transitionMode,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir.x, o.upDir.y, o.upDir.z) : undefined
        };
        return this;
    }

    toObject(): Object | undefined {
        const profileObjs = this.params.profiles.map(p => serializeProfile(this.tp, p));
        const innerProfileObjs = this.params.innerProfiles ?
            this.params.innerProfiles.map(p => serializeProfile(this.tp, p)) : null;

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['wires', this.params.wires.map(wire =>
                wire.map(p => ({ x: p.X(), y: p.Y(), z: p.Z() })))],
            ['profiles', profileObjs],
            ['innerProfiles', innerProfileObjs],
            ['segmentTypes', this.params.segmentTypes],
            ['transitionMode', this.params.transitionMode],
            ['upDir', this.params.upDir ? {
                x: this.params.upDir.X(),
                y: this.params.upDir.Y(),
                z: this.params.upDir.Z()
            } : null]
        ]));
    }
}



export class PipeJointPrimitive extends BasePrimitive<PipeJointParams> {

    constructor(tp: TopoInstance, params?: PipeJointParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.PipeJoint;
    }

    setDefault(): Primitive<PipeJointParams> {
        // 默认圆形剖面
        const profile = {
            type: this.tp.ProfileType.CIRC,
            center: new this.tp.gp_Pnt_3(0, 0, 0),
            norm: new this.tp.gp_Dir_4(0, 0, 1),
            radius: 10.0
        };

        this.params = {
            ins: [{
                offset: new this.tp.gp_Pnt_3(-50, 0, 0),
                normal: new this.tp.gp_Dir_4(1, 0, 0),
                profile: profile
            }],
            outs: [{
                offset: new this.tp.gp_Pnt_3(50, 0, 0),
                normal: new this.tp.gp_Dir_4(-1, 0, 0),
                profile: profile
            }],
            mode: this.tp.JointShapeMode.SPHERE as any,
            flanged: true
        };
        return this;
    }

    public setParams(params: PipeJointParams): Primitive<PipeJointParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.ins || this.params.ins.length === 0) return false;
        if (!this.params.outs || this.params.outs.length === 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPipeJoint(this.params), false);
        }
        throw new Error("Invalid parameters for PipeJoint");
    }

    fromObject(o: any): Primitive<PipeJointParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            ins: o.ins.map((ep: any) => ({
                offset: new this.tp.gp_Pnt_3(ep.offset.x, ep.offset.y, ep.offset.z),
                normal: new this.tp.gp_Dir_4(ep.normal.x, ep.normal.y, ep.normal.z),
                profile: deserializeProfile(this.tp, { profile: ep.profile }),
                innerProfile: ep.innerProfile ? deserializeProfile(this.tp, { profile: ep.innerProfile }) : undefined
            })),
            outs: o.outs.map((ep: any) => ({
                offset: new this.tp.gp_Pnt_3(ep.offset.x, ep.offset.y, ep.offset.z),
                normal: new this.tp.gp_Dir_4(ep.normal.x, ep.normal.y, ep.normal.z),
                profile: deserializeProfile(this.tp, { profile: ep.profile }),
                innerProfile: ep.innerProfile ? deserializeProfile(this.tp, { profile: ep.innerProfile }) : undefined
            })),
            mode: o.mode,
            flanged: o.flanged,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir.x, o.upDir.y, o.upDir.z) : undefined
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['ins', this.params.ins.map(ep => ({
                offset: { x: ep.offset.X(), y: ep.offset.Y(), z: ep.offset.Z() },
                normal: { x: ep.normal.X(), y: ep.normal.Y(), z: ep.normal.Z() },
                profile: serializeProfile(this.tp, ep.profile),
                innerProfile: ep.innerProfile ? serializeProfile(this.tp, ep.innerProfile) : null
            }))],
            ['outs', this.params.outs.map(ep => ({
                offset: { x: ep.offset.X(), y: ep.offset.Y(), z: ep.offset.Z() },
                normal: { x: ep.normal.X(), y: ep.normal.Y(), z: ep.normal.Z() },
                profile: serializeProfile(this.tp, ep.profile),
                innerProfile: ep.innerProfile ? serializeProfile(this.tp, ep.innerProfile) : null
            }))],
            ['mode', this.params.mode],
            ['flanged', this.params.flanged],
            ['upDir', this.params.upDir ? {
                x: this.params.upDir.X(),
                y: this.params.upDir.Y(),
                z: this.params.upDir.Z()
            } : null]
        ]));
    }
}

export class CatenaryPrimitive extends BasePrimitive<CatenaryParams> {

    constructor(tp: TopoInstance, params?: CatenaryParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Catenary;
    }

    setDefault(): Primitive<CatenaryParams> {
        this.params = {
            p1: new this.tp.gp_Pnt_3(0, 0, 0),
            p2: new this.tp.gp_Pnt_3(100, 0, 0),
            profile: {
                type: this.tp.ProfileType.CIRC,
                center: new this.tp.gp_Pnt_3(0, 0, 0),
                norm: new this.tp.gp_Dir_4(0, 0, 1),
                radius: 2.0
            },
            slack: 1.5,
            maxSag: 5.0,
            tessellation: 0.0
        };
        return this;
    }

    public setParams(params: CatenaryParams): Primitive<CatenaryParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.p1 || !this.params.p2) return false;
        if (!this.params.profile) return false;
        if (this.params.slack <= 0) return false;
        if (this.params.maxSag <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCatenary(this.params), false);
        }
        throw new Error("Invalid parameters for Catenary");
    }

    fromObject(o: any): Primitive<CatenaryParams> {
        if (o === undefined) {
            return this;
        }

        const profile = deserializeProfile(this.tp, o);

        this.params = {
            p1: new this.tp.gp_Pnt_3(o.p1.x, o.p1.y, o.p1.z),
            p2: new this.tp.gp_Pnt_3(o.p2.x, o.p2.y, o.p2.z),
            profile,
            slack: o.slack,
            maxSag: o.maxSag,
            tessellation: o.tessellation,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir.x, o.upDir.y, o.upDir.z) : undefined
        };
        return this;
    }

    toObject(): Object | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        if (profileObj === undefined) {
            return undefined;
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['p1', {
                x: this.params.p1.X(),
                y: this.params.p1.Y(),
                z: this.params.p1.Z()
            }],
            ['p2', {
                x: this.params.p2.X(),
                y: this.params.p2.Y(),
                z: this.params.p2.Z()
            }],
            ['profile', profileObj],
            ['slack', this.params.slack],
            ['maxSag', this.params.maxSag],
            ['tessellation', this.params.tessellation],
            ['upDir', this.params.upDir ? {
                x: this.params.upDir.X(),
                y: this.params.upDir.Y(),
                z: this.params.upDir.Z()
            } : null]
        ]));
    }
}


export class BoxShapePrimitive extends BasePrimitive<BoxShapeParams> {

    constructor(tp: TopoInstance, params?: BoxShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.BoxShape;
    }

    setDefault(): Primitive<BoxShapeParams> {
        this.params = {
            point1: new this.tp.gp_Pnt_3(0, 0, 0),
            point2: new this.tp.gp_Pnt_3(100, 50, 30)
        };
        return this;
    }

    public setParams(params: BoxShapeParams): Primitive<BoxShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.point1 || !this.params.point2) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createBoxShape(this.params), false);
        }
        throw new Error("Invalid parameters for BoxShape");
    }

    fromObject(o: any): Primitive<BoxShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            point1: new this.tp.gp_Pnt_3(o.point1.x, o.point1.y, o.point1.z),
            point2: new this.tp.gp_Pnt_3(o.point2.x, o.point2.y, o.point2.z)
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['point1', {
                x: this.params.point1.X(),
                y: this.params.point1.Y(),
                z: this.params.point1.Z()
            }],
            ['point2', {
                x: this.params.point2.X(),
                y: this.params.point2.Y(),
                z: this.params.point2.Z()
            }]
        ]));
    }
}

export class ConeShapePrimitive extends BasePrimitive<ConeShapeParams> {

    constructor(tp: TopoInstance, params?: ConeShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.ConeShape;
    }

    setDefault(): Primitive<ConeShapeParams> {
        this.params = {
            radius1: 20.0,
            radius2: 10.0,
            height: 30.0
        };
        return this;
    }

    public setParams(params: ConeShapeParams): Primitive<ConeShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.radius1 <= 0) return false;
        if (this.params.radius2 <= 0) return false;
        if (this.params.height <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createConeShape(this.params), false);
        }
        throw new Error("Invalid parameters for ConeShape");
    }

    fromObject(o: any): Primitive<ConeShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            radius1: o.radius1,
            radius2: o.radius2,
            height: o.height,
            angle: o.angle
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['radius1', this.params.radius1],
            ['radius2', this.params.radius2],
            ['height', this.params.height],
            ['angle', this.params.angle]
        ]));
    }
}

export class CylinderShapePrimitive extends BasePrimitive<CylinderShapeParams> {

    constructor(tp: TopoInstance, params?: CylinderShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.CylinderShape;
    }

    setDefault(): Primitive<CylinderShapeParams> {
        this.params = {
            radius: 15.0,
            height: 25.0
        };
        return this;
    }

    public setParams(params: CylinderShapeParams): Primitive<CylinderShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.radius <= 0) return false;
        if (this.params.height <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createCylinderShape(this.params), false);
        }
        throw new Error("Invalid parameters for CylinderShape");
    }

    fromObject(o: any): Primitive<CylinderShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            radius: o.radius,
            height: o.height,
            angle: o.angle
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['radius', this.params.radius],
            ['height', this.params.height],
            ['angle', this.params.angle]
        ]));
    }
}

export class RevolutionShapePrimitive extends BasePrimitive<RevolutionShapeParams> {

    constructor(tp: TopoInstance, params?: RevolutionShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.RevolutionShape;
    }

    setDefault(): Primitive<RevolutionShapeParams> {
        this.params = {
            meridian: [
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Pnt_3(10, 0, 0),
                new this.tp.gp_Pnt_3(15, 5, 0),
                new this.tp.gp_Pnt_3(10, 10, 0),
                new this.tp.gp_Pnt_3(0, 10, 0)
            ]
        };
        return this;
    }

    public setParams(params: RevolutionShapeParams): Primitive<RevolutionShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.meridian || this.params.meridian.length < 2) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createRevolutionShape(this.params), false);
        }
        throw new Error("Invalid parameters for RevolutionShape");
    }

    fromObject(o: any): Primitive<RevolutionShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            meridian: o.meridian.map((p: any) =>
                new this.tp.gp_Pnt_3(p.x, p.y, p.z)),
            angle: o.angle,
            max: o.max,
            min: o.min
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['meridian', this.params.meridian.map(p => ({
                x: p.X(),
                y: p.Y(),
                z: p.Z()
            }))],
            ['angle', this.params.angle],
            ['max', this.params.max],
            ['min', this.params.min]
        ]));
    }
}


export class SphereShapePrimitive extends BasePrimitive<SphereShapeParams> {

    constructor(tp: TopoInstance, params?: SphereShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.SphereShape;
    }

    setDefault(): Primitive<SphereShapeParams> {
        this.params = {
            radius: 20.0
        };
        return this;
    }

    public setParams(params: SphereShapeParams): Primitive<SphereShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.radius <= 0) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createSphereShape(this.params), false);
        }
        throw new Error("Invalid parameters for SphereShape");
    }

    fromObject(o: any): Primitive<SphereShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            center: o.center ? new this.tp.gp_Pnt_3(o.center.x, o.center.y, o.center.z) : undefined,
            radius: o.radius,
            angle1: o.angle1,
            angle2: o.angle2,
            angle: o.angle
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['center', this.params.center ? {
                x: this.params.center.X(),
                y: this.params.center.Y(),
                z: this.params.center.Z()
            } : undefined],
            ['radius', this.params.radius],
            ['angle1', this.params.angle1],
            ['angle2', this.params.angle2],
            ['angle', this.params.angle]
        ]));
    }
}


export class TorusShapePrimitive extends BasePrimitive<TorusShapeParams> {

    constructor(tp: TopoInstance, params?: TorusShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.TorusShape;
    }

    setDefault(): Primitive<TorusShapeParams> {
        this.params = {
            radius1: 30.0,
            radius2: 10.0
        };
        return this;
    }

    public setParams(params: TorusShapeParams): Primitive<TorusShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (this.params.radius1 <= 0) return false;
        if (this.params.radius2 <= 0) return false;
        if (this.params.radius1 <= this.params.radius2) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createTorusShape(this.params), false);
        }
        throw new Error("Invalid parameters for TorusShape");
    }

    fromObject(o: any): Primitive<TorusShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            radius1: o.radius1,
            radius2: o.radius2,
            angle1: o.angle1,
            angle2: o.angle2,
            angle: o.angle
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['radius1', this.params.radius1],
            ['radius2', this.params.radius2],
            ['angle1', this.params.angle1],
            ['angle2', this.params.angle2],
            ['angle', this.params.angle]
        ]));
    }
}


export class WedgeShapePrimitive extends BasePrimitive<WedgeShapeParams> {

    constructor(tp: TopoInstance, params?: WedgeShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.WedgeShape;
    }

    setDefault(): Primitive<WedgeShapeParams> {
        this.params = {
            edge: new this.tp.gp_Pnt_3(30, 20, 10)
        };
        return this;
    }

    public setParams(params: WedgeShapeParams): Primitive<WedgeShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.edge) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createWedgeShape(this.params), false);
        }
        throw new Error("Invalid parameters for WedgeShape");
    }

    fromObject(o: any): Primitive<WedgeShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            edge: new this.tp.gp_Pnt_3(o.edge.x, o.edge.y, o.edge.z),
            limit: o.limit,
            ltx: o.ltx
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['edge', {
                x: this.params.edge.X(),
                y: this.params.edge.Y(),
                z: this.params.edge.Z()
            }],
            ['limit', this.params.limit],
            ['ltx', this.params.ltx]
        ]));
    }
}


export class PipeShapePrimitive extends BasePrimitive<PipeShapeParams> {

    constructor(tp: TopoInstance, params?: PipeShapeParams) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.PipeShape;
    }

    setDefault(): Primitive<PipeShapeParams> {
        this.params = {
            wire: [
                new this.tp.gp_Pnt_3(0, 0, 0),
                new this.tp.gp_Pnt_3(100, 0, 0)
            ],
            profile: {
                type: this.tp.ProfileType.CIRC,
                center: new this.tp.gp_Pnt_3(0, 0, 0),
                norm: new this.tp.gp_Dir_4(0, 0, 1),
                radius: 10.0
            }
        };
        return this;
    }

    public setParams(params: PipeShapeParams): Primitive<PipeShapeParams> {
        this.params = params;
        return this;
    }

    public valid(): boolean {
        if (!this.params.wire || this.params.wire.length !== 2) return false;
        if (!this.params.profile) return false;
        return true;
    }

    public build(): Shape | undefined {
        if (this.valid()) {
            return new this.tp.Shape(this.tp.createPipeShape(this.params), false);
        }
        throw new Error("Invalid parameters for PipeShape");
    }

    fromObject(o: any): Primitive<PipeShapeParams> {
        if (o === undefined) {
            return this;
        }

        this.params = {
            wire: [
                new this.tp.gp_Pnt_3(o.wire[0].x, o.wire[0].y, o.wire[0].z),
                new this.tp.gp_Pnt_3(o.wire[1].x, o.wire[1].y, o.wire[1].z)
            ],
            profile: deserializeProfile(this.tp, { profile: o.profile }),
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir.x, o.upDir.y, o.upDir.z) : undefined
        };
        return this;
    }

    toObject(): Object | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['wire', this.params.wire.map(p => ({
                x: p.X(),
                y: p.Y(),
                z: p.Z()
            }))],
            ['profile', serializeProfile(this.tp, this.params.profile)],
            ['upDir', this.params.upDir ? {
                x: this.params.upDir.X(),
                y: this.params.upDir.Y(),
                z: this.params.upDir.Z()
            } : undefined]
        ]));
    }
}

export function createBasePrimitive(tp: TopoInstance, args?: BasePrimitiveType | any): ShapePrimitive | undefined {
    if (args === undefined) {
        return undefined;
    }
    let type: BasePrimitiveType | undefined = undefined;
    let obj: any = undefined;
    if (args && args['type'] !== undefined) {
        type = args['type'];
        obj = args;
    } else if (typeof args === 'string') {
        type = args as BasePrimitiveType;
    }

    let primitive: ShapePrimitive | undefined = undefined;
    switch (type) {
        case BasePrimitiveType.Revol:
            primitive = new RevolPrimitive(tp);
            break;
        case BasePrimitiveType.Prism:
            primitive = new PrismPrimitive(tp);
            break;
        case BasePrimitiveType.Pipe:
            primitive = new PipePrimitive(tp);
            break;
        case BasePrimitiveType.MultiSegmentPipe:
            primitive = new MultiSegmentPipePrimitive(tp);
            break;
        case BasePrimitiveType.PipeJoint:
            primitive = new PipeJointPrimitive(tp);
            break;
        case BasePrimitiveType.Catenary:
            primitive = new CatenaryPrimitive(tp);
            break;
        case BasePrimitiveType.BoxShape:
            primitive = new BoxShapePrimitive(tp);
            break;
        case BasePrimitiveType.ConeShape:
            primitive = new ConeShapePrimitive(tp);
            break;
        case BasePrimitiveType.CylinderShape:
            primitive = new CylinderShapePrimitive(tp);
            break;
        case BasePrimitiveType.RevolutionShape:
            primitive = new RevolutionShapePrimitive(tp);
            break;
        case BasePrimitiveType.SphereShape:
            primitive = new SphereShapePrimitive(tp);
            break;
        case BasePrimitiveType.TorusShape:
            primitive = new TorusShapePrimitive(tp);
            break;
        case BasePrimitiveType.WedgeShape:
            primitive = new WedgeShapePrimitive(tp);
            break;
        case BasePrimitiveType.PipeShape:
            primitive = new PipeShapePrimitive(tp);
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