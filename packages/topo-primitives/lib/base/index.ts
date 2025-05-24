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
    PipeShapeParams,
    TransitionMode,
    SegmentType,
    JointShapeMode
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";
import {
    BoxShapeObject,
    CatenaryObject,
    ConeShapeObject,
    CylinderShapeObject,
    MultiSegmentPipePrimitiveObject,
    PipeJointObject,
    PipeObject,
    PipeShapeObject,
    PrismObject,
    RevolObject,
    RevolutionShapeObject,
    SphereShapeObject,
    TorusShapeObject,
    WedgeShapeObject,
} from "../types";

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
                p1: new tp.gp_Pnt_3(o.profile.p1[0], o.profile.p1[1], o.profile.p1[2]),
                p2: new tp.gp_Pnt_3(o.profile.p2[0], o.profile.p2[1], o.profile.p2[2]),
                p3: new tp.gp_Pnt_3(o.profile.p3[0], o.profile.p3[1], o.profile.p3[2])
            };
        case tp.ProfileType.RECTANGLE:
            return {
                type: tp.ProfileType.RECTANGLE,
                p1: new tp.gp_Pnt_3(o.profile.p1[0], o.profile.p1[1], o.profile.p1[2]),
                p2: new tp.gp_Pnt_3(o.profile.p2[0], o.profile.p2[1], o.profile.p2[2])
            };
        case tp.ProfileType.CIRC:
            return {
                type: tp.ProfileType.CIRC,
                center: new tp.gp_Pnt_3(o.profile.center[0], o.profile.center[1], o.profile.center[2]),
                norm: new tp.gp_Dir_4(o.profile.norm[0], o.profile.norm[1], o.profile.norm[2]),
                radius: o.profile.radius
            };
        case tp.ProfileType.ELIPS:
            return {
                type: tp.ProfileType.ELIPS,
                s1: new tp.gp_Pnt_3(o.profile.s1[0], o.profile.s1[1], o.profile.s1[2]),
                s2: new tp.gp_Pnt_3(o.profile.s2[0], o.profile.s2[1], o.profile.s2[2]),
                center: new tp.gp_Pnt_3(o.profile.center[0], o.profile.center[1], o.profile.center[2])
            };
        case tp.ProfileType.POLYGON:
            return {
                type: tp.ProfileType.POLYGON,
                edges: o.profile.edges.map((p: any) =>
                    new tp.gp_Pnt_3(p[0], p[1], p[2])),
                inners: o.profile.inners?.map((inner: any[]) =>
                    inner.map(p => new tp.gp_Pnt_3(p[0], p[1], p[2])))
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
                p1: [
                    tprofile.p1.X(),
                    tprofile.p1.Y(),
                    tprofile.p1.Z()
                ],
                p2: [
                    tprofile.p2.X(),
                    tprofile.p2.Y(),
                    tprofile.p2.Z()
                ],
                p3: [
                    tprofile.p3.X(),
                    tprofile.p3.Y(),
                    tprofile.p3.Z()
                ]
            };
        case tp.ProfileType.RECTANGLE:
            const rprofile = profile as RectangleProfile;
            return {
                type: rprofile.type,
                p1: [rprofile.p1.X(),
                rprofile.p1.Y(),
                rprofile.p1.Z()
                ],
                p2: [rprofile.p2.X(),
                rprofile.p2.Y(),
                rprofile.p2.Z()
                ]
            };
        case tp.ProfileType.CIRC:
            const cprofile = profile as CircProfile;
            return {
                type: cprofile.type,
                center: [cprofile.center.X(),
                cprofile.center.Y(),
                cprofile.center.Z()
                ],
                norm: [cprofile.norm.X(),
                cprofile.norm.Y(),
                cprofile.norm.Z()
                ],
                radius: cprofile.radius
            };
        case tp.ProfileType.ELIPS:
            const eprofile = profile as ElipsProfile;
            return {
                type: eprofile.type,
                s1: [eprofile.s1.X(),
                eprofile.s1.Y(),
                eprofile.s1.Z()
                ],
                s2: [eprofile.s2.X(),
                eprofile.s2.Y(),
                eprofile.s2.Z()
                ],
                center: [eprofile.center.X(),
                eprofile.center.Y(),
                eprofile.center.Z()

                ]
            };
        case tp.ProfileType.POLYGON:
            const pprofile = profile as PolygonProfile;
            return {
                type: pprofile.type,
                edges: pprofile.edges.map(p => ([p.X(),
                p.Y(),
                p.Z()
                ])),
                inners: pprofile.inners?.map(inner =>
                    inner.map(p => ([
                        p.X(),
                        p.Y(),
                        p.Z()
                    ])))
            };
        default:
            throw new Error("Unsupported profile type");
    }
}

export class RevolPrimitive extends BasePrimitive<RevolParams, RevolObject> {

    constructor(tp: TopoInstance, params?: RevolObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Revol;
    }

    setDefault(): Primitive<RevolParams, RevolObject> {
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

    public setParams(params: RevolParams): Primitive<RevolParams, RevolObject> {
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

    fromObject(o?: RevolObject): Primitive<RevolParams, RevolObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        const profile = deserializeProfile(this.tp, o);

        this.params = {
            profile,
            axis: new this.tp.gp_Ax1_2(
                new this.tp.gp_Pnt_3(o.axis.location[0], o.axis.location[1], o.axis.location[2]),
                new this.tp.gp_Dir_4(o.axis.direction[0], o.axis.direction[1], o.axis.direction[2])
            ),
            angle: o.angle
        };
        return this;
    }

    toObject(): RevolObject | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        if (profileObj === undefined) {
            return undefined;
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['profile', profileObj],
            ['axis', {
                location: [
                    this.params.axis.Location().X(),
                    this.params.axis.Location().Y(),
                    this.params.axis.Location().Z()
                ],
                direction: [
                    this.params.axis.Direction().X(),
                    this.params.axis.Direction().Y(),
                    this.params.axis.Direction().Z()
                ]
            }],
            ['angle', this.params.angle]
        ])) as RevolObject;
    }
}

export class PrismPrimitive extends BasePrimitive<PrismParams, PrismObject> {

    constructor(tp: TopoInstance, params?: PrismObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Prism;
    }

    setDefault(): Primitive<PrismParams, PrismObject> {
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

    public setParams(params: PrismParams): Primitive<PrismParams, PrismObject> {
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

    fromObject(o?: PrismObject): Primitive<PrismParams, PrismObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        const profile = deserializeProfile(this.tp, o);

        this.params = {
            profile,
            dir: new this.tp.gp_Dir_4(o.dir[0], o.dir[1], o.dir[2])
        };
        return this;
    }

    toObject(): PrismObject | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        if (profileObj === undefined) {
            return undefined;
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['profile', profileObj],
            ['dir', [
                this.params.dir.X(),
                this.params.dir.Y(),
                this.params.dir.Z()
            ]]
        ])) as PrismObject;
    }
}

export class PipePrimitive extends BasePrimitive<PipeParams, PipeObject> {

    constructor(tp: TopoInstance, params?: PipeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Pipe;
    }

    setDefault(): Primitive<PipeParams, PipeObject> {
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

    public setParams(params: PipeParams): Primitive<PipeParams, PipeObject> {
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

    fromObject(o?: PipeObject): Primitive<PipeParams, PipeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        const profile = deserializeProfile(this.tp, o);
        const innerProfile = o.innerProfile ? deserializeProfile(this.tp, { profile: o.innerProfile }) : null;

        let transitionMode: TransitionMode = this.tp.TransitionMode.TRANSFORMED as TransitionMode;
        switch (o.transitionMode) {
            case 'TRANSFORMED':
                transitionMode = this.tp.TransitionMode.TRANSFORMED as TransitionMode;
                break;
            case 'ROUND':
                transitionMode = this.tp.TransitionMode.ROUND as TransitionMode;
                break;
            case 'RIGHT':
                transitionMode = this.tp.TransitionMode.RIGHT as TransitionMode;
        }

        let segmentType: SegmentType = this.tp.SegmentType.LINE as SegmentType;
        switch (o.segmentType) {
            case 'LINE':
                segmentType = this.tp.SegmentType.LINE as SegmentType;
                break;
            case 'THREE_POINT_ARC':
                segmentType = this.tp.SegmentType.THREE_POINT_ARC as SegmentType;
                break;
            case 'CIRCLE_CENTER_ARC':
                segmentType = this.tp.SegmentType.CIRCLE_CENTER_ARC as SegmentType;
                break;
            case 'SPLINE':
                segmentType = this.tp.SegmentType.SPLINE as SegmentType;
                break;
        }

        this.params = {
            wire: o.wire.map((p: any) => new this.tp.gp_Pnt_3(p[0], p[1], p[2])),
            profile,
            innerProfile,
            segmentType: segmentType,
            transitionMode: transitionMode,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir[0], o.upDir[1], o.upDir[2]) : undefined
        };
        return this;
    }

    toObject(): PipeObject | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        const innerProfileObj = this.params.innerProfile ?
            serializeProfile(this.tp, this.params.innerProfile) : null;

        let transitionMode = 'TRANSFORMED';
        switch (this.params.transitionMode) {
            case this.tp.TransitionMode.TRANSFORMED:
                transitionMode = 'TRANSFORMED';
                break;
            case this.tp.TransitionMode.ROUND:
                transitionMode = 'ROUND';
                break;
            case this.tp.TransitionMode.RIGHT:
                transitionMode = 'RIGHT';
                break;
        }

        let segmentType = 'LINE';
        switch (this.params.segmentType) {
            case this.tp.SegmentType.LINE:
                segmentType = 'LINE';
                break;
            case this.tp.SegmentType.THREE_POINT_ARC:
                segmentType = 'THREE_POINT_ARC';
                break;
            case this.tp.SegmentType.CIRCLE_CENTER_ARC:
                segmentType = 'CIRCLE_CENTER_ARC';
                break;
            case this.tp.SegmentType.SPLINE:
                segmentType = 'SPLINE';
                break;
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['wire', this.params.wire.map(p => ([p.X(), p.Y(), p.Z()]))],
            ['profile', profileObj],
            ['innerProfile', innerProfileObj],
            ['segmentType', segmentType],
            ['transitionMode', transitionMode],
            ['upDir', this.params.upDir ? [
                this.params.upDir.X(),
                this.params.upDir.Y(),
                this.params.upDir.Z()
            ] : null]
        ])) as PipeObject;
    }
}

export class MultiSegmentPipePrimitive extends BasePrimitive<MultiSegmentPipeParams, MultiSegmentPipePrimitiveObject> {

    constructor(tp: TopoInstance, params?: MultiSegmentPipePrimitiveObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.MultiSegmentPipe;
    }

    setDefault(): Primitive<MultiSegmentPipeParams, MultiSegmentPipePrimitiveObject> {
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

    public setParams(params: MultiSegmentPipeParams): Primitive<MultiSegmentPipeParams, MultiSegmentPipePrimitiveObject> {
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

    fromObject(o?: MultiSegmentPipePrimitiveObject): Primitive<MultiSegmentPipeParams, MultiSegmentPipePrimitiveObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        const profiles = o.profiles.map((p: any) => deserializeProfile(this.tp, { profile: p }));
        const innerProfiles = o.innerProfiles ?
            o.innerProfiles.map((p: any) => deserializeProfile(this.tp, { profile: p })) : null;

        let transitionMode: TransitionMode = this.tp.TransitionMode.TRANSFORMED as TransitionMode;
        switch (o.transitionMode) {
            case 'TRANSFORMED':
                transitionMode = this.tp.TransitionMode.TRANSFORMED as TransitionMode;
                break;
            case 'ROUND':
                transitionMode = this.tp.TransitionMode.ROUND as TransitionMode;
                break;
            case 'RIGHT':
                transitionMode = this.tp.TransitionMode.RIGHT as TransitionMode;
        }

        const segmentTypes: SegmentType[] = [];
        for (let i = 0; i < o.segmentTypes.length; i++) {
            switch (o.segmentTypes[i]) {
                case 'LINE':
                    segmentTypes.push(this.tp.SegmentType.LINE as SegmentType);
                    break;
                case 'THREE_POINT_ARC':
                    segmentTypes.push(this.tp.SegmentType.THREE_POINT_ARC as SegmentType);
                    break;
                case 'CIRCLE_CENTER_ARC':
                    segmentTypes.push(this.tp.SegmentType.CIRCLE_CENTER_ARC as SegmentType);
                    break;
                case 'SPLINE':
                    segmentTypes.push(this.tp.SegmentType.SPLINE as SegmentType);
                    break;
                default:
                    segmentTypes.push(this.tp.SegmentType.LINE as SegmentType);
            }
        }

        this.params = {
            wires: o.wires.map((wire: any[]) =>
                wire.map((p: any) => new this.tp.gp_Pnt_3(p[0], p[1], p[2]))),
            profiles,
            innerProfiles,
            segmentTypes: segmentTypes,
            transitionMode: transitionMode,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir[0], o.upDir[1], o.upDir[2]) : undefined
        };
        return this;
    }

    toObject(): MultiSegmentPipePrimitiveObject | undefined {
        const profileObjs = this.params.profiles.map(p => serializeProfile(this.tp, p));
        const innerProfileObjs = this.params.innerProfiles ?
            this.params.innerProfiles.map(p => serializeProfile(this.tp, p)) : null;

        let transitionMode = 'TRANSFORMED';
        switch (this.params.transitionMode) {
            case this.tp.TransitionMode.TRANSFORMED:
                transitionMode = 'TRANSFORMED';
                break;
            case this.tp.TransitionMode.ROUND:
                transitionMode = 'ROUND';
                break;
            case this.tp.TransitionMode.RIGHT:
                transitionMode = 'RIGHT';
                break;
        }

        const segmentTypes: string[] = [];
        if (this.params.segmentTypes?.length) {
            for (let i = 0; i < this.params.segmentTypes?.length; i++) {
                switch (this.params.segmentTypes[i]) {
                    case this.tp.SegmentType.LINE:
                        segmentTypes.push('LINE');
                        break;
                    case this.tp.SegmentType.THREE_POINT_ARC:
                        segmentTypes.push('THREE_POINT_ARC');
                        break;
                    case this.tp.SegmentType.CIRCLE_CENTER_ARC:
                        segmentTypes.push('CIRCLE_CENTER_ARC');
                        break;
                    case this.tp.SegmentType.SPLINE:
                        segmentTypes.push('SPLINE');
                        break;
                    default:
                        segmentTypes.push('LINE');

                }
            }
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['wires', this.params.wires.map(wire =>
                wire.map(p => ([p.X(), p.Y(), p.Z()])))],
            ['profiles', profileObjs],
            ['innerProfiles', innerProfileObjs],
            ['segmentTypes', segmentTypes],
            ['transitionMode', transitionMode],
            ['upDir', this.params.upDir ? [
                this.params.upDir.X(),
                this.params.upDir.Y(),
                this.params.upDir.Z()
            ] : null]
        ])) as MultiSegmentPipePrimitiveObject;
    }
}


export class PipeJointPrimitive extends BasePrimitive<PipeJointParams, PipeJointObject> {

    constructor(tp: TopoInstance, params?: PipeJointObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.PipeJoint;
    }

    setDefault(): Primitive<PipeJointParams, PipeJointObject> {
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

    public setParams(params: PipeJointParams): Primitive<PipeJointParams, PipeJointObject> {
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

    fromObject(o?: PipeJointObject): Primitive<PipeJointParams, PipeJointObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let mode: JointShapeMode = this.tp.JointShapeMode.SPHERE as JointShapeMode;
        switch (o.mode) {
            case 'SPHERE':
                mode = this.tp.JointShapeMode.SPHERE as JointShapeMode;
                break;
            case 'BOX':
                mode = this.tp.JointShapeMode.BOX as JointShapeMode;
                break;
            case 'CYLINDER':
                mode = this.tp.JointShapeMode.CYLINDER as JointShapeMode;
                break;
        }

        this.params = {
            ins: o.ins.map((ep: any) => ({
                offset: new this.tp.gp_Pnt_3(ep.offset[0], ep.offset[1], ep.offset[2]),
                normal: new this.tp.gp_Dir_4(ep.normal[0], ep.normal[1], ep.normal[2]),
                profile: deserializeProfile(this.tp, { profile: ep.profile }),
                innerProfile: ep.innerProfile ? deserializeProfile(this.tp, { profile: ep.innerProfile }) : undefined
            })),
            outs: o.outs.map((ep: any) => ({
                offset: new this.tp.gp_Pnt_3(ep.offset[0], ep.offset[1], ep.offset[2]),
                normal: new this.tp.gp_Dir_4(ep.normal[0], ep.normal[1], ep.normal[2]),
                profile: deserializeProfile(this.tp, { profile: ep.profile }),
                innerProfile: ep.innerProfile ? deserializeProfile(this.tp, { profile: ep.innerProfile }) : undefined
            })),
            mode: mode,
            flanged: o.flanged,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir[0], o.upDir[1], o.upDir[2]) : undefined
        };
        return this;
    }

    toObject(): PipeJointObject | undefined {

        let mode = 'SPHERE';
        switch (this.params.mode) {
            case this.tp.JointShapeMode.SPHERE:
                mode = 'SPHERE';
                break;
            case this.tp.JointShapeMode.BOX:
                mode = 'BOX';
                break;
            case this.tp.JointShapeMode.CYLINDER:
                mode = 'CYLINDER';
                break;
        }

        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['ins', this.params.ins.map(ep => ({
                offset: [ep.offset.X(), ep.offset.Y(), ep.offset.Z()],
                normal: [ep.normal.X(), ep.normal.Y(), ep.normal.Z()],
                profile: serializeProfile(this.tp, ep.profile),
                innerProfile: ep.innerProfile ? serializeProfile(this.tp, ep.innerProfile) : null
            }))],
            ['outs', this.params.outs.map(ep => ({
                offset: [ep.offset.X(), ep.offset.Y(), ep.offset.Z()],
                normal: [ep.normal.X(), ep.normal.Y(), ep.normal.Z()],
                profile: serializeProfile(this.tp, ep.profile),
                innerProfile: ep.innerProfile ? serializeProfile(this.tp, ep.innerProfile) : null
            }))],
            ['mode', mode],
            ['flanged', this.params.flanged],
            ['upDir', this.params.upDir ? [
                this.params.upDir.X(),
                this.params.upDir.Y(),
                this.params.upDir.Z()
            ] : null]
        ])) as PipeJointObject;
    }
}

export class CatenaryPrimitive extends BasePrimitive<CatenaryParams, CatenaryObject> {

    constructor(tp: TopoInstance, params?: CatenaryObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.Catenary;
    }

    setDefault(): Primitive<CatenaryParams, CatenaryObject> {
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

    public setParams(params: CatenaryParams): Primitive<CatenaryParams, CatenaryObject> {
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

    fromObject(o?: CatenaryObject): Primitive<CatenaryParams, CatenaryObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        const profile = deserializeProfile(this.tp, o);

        this.params = {
            p1: new this.tp.gp_Pnt_3(o.p1[0], o.p1[1], o.p1[2]),
            p2: new this.tp.gp_Pnt_3(o.p2[0], o.p2[1], o.p2[2]),
            profile,
            slack: o.slack,
            maxSag: o.maxSag,
            tessellation: o.tessellation,
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir[0], o.upDir[1], o.upDir[2]) : undefined
        };
        return this;
    }

    toObject(): CatenaryObject | undefined {
        const profileObj = serializeProfile(this.tp, this.params.profile);
        if (profileObj === undefined) {
            return undefined;
        }
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['p1', [
                this.params.p1.X(),
                this.params.p1.Y(),
                this.params.p1.Z()
            ]],
            ['p2', [
                this.params.p2.X(),
                this.params.p2.Y(),
                this.params.p2.Z()
            ]],
            ['profile', profileObj],
            ['slack', this.params.slack],
            ['maxSag', this.params.maxSag],
            ['tessellation', this.params.tessellation],
            ['upDir', this.params.upDir ? [
                this.params.upDir.X(),
                this.params.upDir.Y(),
                this.params.upDir.Z()
            ] : null]
        ])) as CatenaryObject;
    }
}


export class BoxShapePrimitive extends BasePrimitive<BoxShapeParams, BoxShapeObject> {

    constructor(tp: TopoInstance, params?: BoxShapeObject) {
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

    public setParams(params: BoxShapeParams): Primitive<BoxShapeParams, BoxShapeObject> {
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

    fromObject(o?: BoxShapeObject): Primitive<BoxShapeParams, BoxShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        this.params = {
            point1: new this.tp.gp_Pnt_3(o.point1[0], o.point1[1], o.point1[2]),
            point2: new this.tp.gp_Pnt_3(o.point2[0], o.point2[1], o.point2[2])
        };
        return this;
    }

    toObject(): BoxShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['point1', [
                this.params.point1.X(),
                this.params.point1.Y(),
                this.params.point1.Z()
            ]],
            ['point2', [
                this.params.point2.X(),
                this.params.point2.Y(),
                this.params.point2.Z()
            ]]
        ])) as BoxShapeObject;
    }
}

export class ConeShapePrimitive extends BasePrimitive<ConeShapeParams, ConeShapeObject> {

    constructor(tp: TopoInstance, params?: ConeShapeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.ConeShape;
    }

    setDefault(): Primitive<ConeShapeParams, ConeShapeObject> {
        this.params = {
            radius1: 20.0,
            radius2: 10.0,
            height: 30.0
        };
        return this;
    }

    public setParams(params: ConeShapeParams): Primitive<ConeShapeParams, ConeShapeObject> {
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

    fromObject(o?: ConeShapeObject): Primitive<ConeShapeParams, ConeShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        this.params = {
            radius1: o.radius1,
            radius2: o.radius2,
            height: o.height,
            angle: o.angle
        };
        return this;
    }

    toObject(): ConeShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['radius1', this.params.radius1],
            ['radius2', this.params.radius2],
            ['height', this.params.height],
            ['angle', this.params.angle]
        ])) as ConeShapeObject;
    }
}

export class CylinderShapePrimitive extends BasePrimitive<CylinderShapeParams, CylinderShapeObject> {

    constructor(tp: TopoInstance, params?: CylinderShapeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.CylinderShape;
    }

    setDefault(): Primitive<CylinderShapeParams, CylinderShapeObject> {
        this.params = {
            radius: 15.0,
            height: 25.0
        };
        return this;
    }

    public setParams(params: CylinderShapeParams): Primitive<CylinderShapeParams, CylinderShapeObject> {
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

    fromObject(o?: CylinderShapeObject): Primitive<CylinderShapeParams, CylinderShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        this.params = {
            radius: o.radius,
            height: o.height,
            angle: o.angle
        };
        return this;
    }

    toObject(): CylinderShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['radius', this.params.radius],
            ['height', this.params.height],
            ['angle', this.params.angle]
        ])) as CylinderShapeObject;
    }
}

export class RevolutionShapePrimitive extends BasePrimitive<RevolutionShapeParams, RevolutionShapeObject> {

    constructor(tp: TopoInstance, params?: RevolutionShapeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.RevolutionShape;
    }

    setDefault(): Primitive<RevolutionShapeParams, RevolutionShapeObject> {
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

    public setParams(params: RevolutionShapeParams): Primitive<RevolutionShapeParams, RevolutionShapeObject> {
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

    fromObject(o?: RevolutionShapeObject): Primitive<RevolutionShapeParams, RevolutionShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        this.params = {
            meridian: o.meridian.map((p: any) =>
                new this.tp.gp_Pnt_3(p[0], p[1], p[2])),
            angle: o.angle,
            max: o.max,
            min: o.min
        };
        return this;
    }

    toObject(): RevolutionShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['meridian', this.params.meridian.map(p => ([
                p.X(),
                p.Y(),
                p.Z()
            ]))],
            ['angle', this.params.angle],
            ['max', this.params.max],
            ['min', this.params.min]
        ])) as RevolutionShapeObject;
    }
}


export class SphereShapePrimitive extends BasePrimitive<SphereShapeParams, SphereShapeObject> {

    constructor(tp: TopoInstance, params?: SphereShapeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.SphereShape;
    }

    setDefault(): Primitive<SphereShapeParams, SphereShapeObject> {
        this.params = {
            radius: 20.0
        };
        return this;
    }

    public setParams(params: SphereShapeParams): Primitive<SphereShapeParams, SphereShapeObject> {
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

    fromObject(o?: SphereShapeObject): Primitive<SphereShapeParams, SphereShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        this.params = {
            center: o.center ? new this.tp.gp_Pnt_3(o.center[0], o.center[1], o.center[2]) : undefined,
            radius: o.radius,
            angle1: o.angle1,
            angle2: o.angle2,
            angle: o.angle
        };
        return this;
    }

    toObject(): SphereShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['center', this.params.center ? [
                this.params.center.X(),
                this.params.center.Y(),
                this.params.center.Z()
            ] : undefined],
            ['radius', this.params.radius],
            ['angle1', this.params.angle1],
            ['angle2', this.params.angle2],
            ['angle', this.params.angle]
        ])) as SphereShapeObject;
    }
}


export class TorusShapePrimitive extends BasePrimitive<TorusShapeParams, TorusShapeObject> {

    constructor(tp: TopoInstance, params?: TorusShapeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.TorusShape;
    }

    setDefault(): Primitive<TorusShapeParams, TorusShapeObject> {
        this.params = {
            radius1: 30.0,
            radius2: 10.0
        };
        return this;
    }

    public setParams(params: TorusShapeParams): Primitive<TorusShapeParams, TorusShapeObject> {
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

    fromObject(o?: TorusShapeObject): Primitive<TorusShapeParams, TorusShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
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

    toObject(): TorusShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['radius1', this.params.radius1],
            ['radius2', this.params.radius2],
            ['angle1', this.params.angle1],
            ['angle2', this.params.angle2],
            ['angle', this.params.angle]
        ])) as TorusShapeObject;
    }
}


export class WedgeShapePrimitive extends BasePrimitive<WedgeShapeParams, WedgeShapeObject> {

    constructor(tp: TopoInstance, params?: WedgeShapeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.WedgeShape;
    }

    setDefault(): Primitive<WedgeShapeParams, WedgeShapeObject> {
        this.params = {
            edge: new this.tp.gp_Pnt_3(30, 20, 10)
        };
        return this;
    }

    public setParams(params: WedgeShapeParams): Primitive<WedgeShapeParams, WedgeShapeObject> {
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

    fromObject(o?: WedgeShapeObject): Primitive<WedgeShapeParams, WedgeShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        this.params = {
            edge: new this.tp.gp_Pnt_3(o.edge[0], o.edge[1], o.edge[2]),
            limit: o.limit,
            ltx: o.ltx
        };
        return this;
    }

    toObject(): WedgeShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['edge', [
                this.params.edge.X(),
                this.params.edge.Y(),
                this.params.edge.Z()
            ]],
            ['limit', this.params.limit],
            ['ltx', this.params.ltx]
        ])) as WedgeShapeObject;
    }
}


export class PipeShapePrimitive extends BasePrimitive<PipeShapeParams, PipeShapeObject> {

    constructor(tp: TopoInstance, params?: PipeShapeObject) {
        super(tp, params);
    }

    getType(): string {
        return BasePrimitiveType.PipeShape;
    }

    setDefault(): Primitive<PipeShapeParams, PipeShapeObject> {
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

    public setParams(params: PipeShapeParams): Primitive<PipeShapeParams, PipeShapeObject> {
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

    fromObject(o?: PipeShapeObject): Primitive<PipeShapeParams, PipeShapeObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        this.params = {
            wire: [
                new this.tp.gp_Pnt_3(o.wire[0][0], o.wire[0][1], o.wire[0][2]),
                new this.tp.gp_Pnt_3(o.wire[1][0], o.wire[1][1], o.wire[1][2])
            ],
            profile: deserializeProfile(this.tp, { profile: o.profile }),
            upDir: o.upDir ? new this.tp.gp_Dir_4(o.upDir[0], o.upDir[1], o.upDir[2]) : undefined
        };
        return this;
    }

    toObject(): PipeShapeObject | undefined {
        return BasePrimitive.buildObject(new Map<string, any>([
            ['type', this.getType()],
            ['version', this.getVersion()],
            ['wire', this.params.wire.map(p => ([
                p.X(),
                p.Y(),
                p.Z()
            ]))],
            ['profile', serializeProfile(this.tp, this.params.profile)],
            ['upDir', this.params.upDir ? [
                this.params.upDir.X(),
                this.params.upDir.Y(),
                this.params.upDir.Z()
            ] : undefined]
        ])) as PipeShapeObject;
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