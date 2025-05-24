import {
    Shape,
    TopoInstance,
    WaterTunnelParams,
    WaterTunnelSectionStyle
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";
import { WaterTunnelObject } from "../types/hydropower";

export enum HPPrimitiveType {
    WaterTunnel = "HP::water_tunnel"
}

export type HPPrimitive = WaterTunnelPrimitive

export class WaterTunnelPrimitive extends BasePrimitive<WaterTunnelParams, WaterTunnelObject> {

    constructor(tp: TopoInstance, params?: WaterTunnelObject) {
        super(tp, params);
    }

    getType(): string {
        return HPPrimitiveType.WaterTunnel;
    }

    setDefault(): Primitive<WaterTunnelParams, WaterTunnelObject> {
        this.params = {
            style: this.tp.WaterTunnelSectionStyle.RECTANGULAR as any,
            width: 60.0,
            height: 80.0,
            topThickness: 5.0,
            bottomThickness: 6.0,
            outerWallThickness: 7.0,
            innerWallThickness: 3.0,
            arcHeight: 0.0,
            arcRadius: 0.0,
            arcAngle: 0.0,
            bottomPlatformHeight: 0.0,
            cushionExtension: 5.0,
            cushionThickness: 8.0,
            points: [
                { position: new this.tp.gp_Pnt_3(0, 0, 0), type: 0 },
                { position: new this.tp.gp_Pnt_3(300, 0, 30), type: 0 }
            ]
        };
        return this;
    }

    public setParams(params: WaterTunnelParams): Primitive<WaterTunnelParams, WaterTunnelObject> {
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
            return new this.tp.Shape(this.tp.createWaterTunnel(this.params), false);
        }
        throw new Error("Invalid parameters for WaterTunnel");
    }

    fromObject(o?: WaterTunnelObject): Primitive<WaterTunnelParams, WaterTunnelObject> {
        if (o === undefined) {
            return this;
        }
        if (o['version']) {
            this.version = o['version'];
        }

        let style: WaterTunnelSectionStyle = this.tp.WaterTunnelSectionStyle.RECTANGULAR as any;
        switch (o['style']) {
            case 'RECTANGULAR':
                style = this.tp.WaterTunnelSectionStyle.RECTANGULAR as any;
                break;
            case 'CITYOPENING':
                style = this.tp.WaterTunnelSectionStyle.CITYOPENING as any;
                break;
            case 'CIRCULAR':
                style = this.tp.WaterTunnelSectionStyle.CIRCULAR as any;
                break;
            case 'HORSESHOE':
                style = this.tp.WaterTunnelSectionStyle.HORSESHOE as any;
                break;
        }

        this.params = {
            style: style,
            width: o['width'],
            height: o['height'],
            topThickness: o['topThickness'],
            bottomThickness: o['bottomThickness'],
            outerWallThickness: o['outerWallThickness'],
            innerWallThickness: o['innerWallThickness'],
            arcHeight: o['arcHeight'] || 0,
            arcRadius: o['arcRadius'] || 0,
            arcAngle: o['arcAngle'] || 0,
            bottomPlatformHeight: o['bottomPlatformHeight'] || 0,
            cushionExtension: o['cushionExtension'] || 0,
            cushionThickness: o['cushionThickness'] || 0,
            points: o['points']?.map((p) => ({
                position: new this.tp.gp_Pnt_3(p.position[0], p.position[1], p.position[2]),
                type: p.type
            })) || []
        };
        return this;
    }

    toObject(): WaterTunnelObject | undefined {

        let style: string = 'RECTANGULAR';
        switch (this.params.style) {
            case this.tp.WaterTunnelSectionStyle.RECTANGULAR:
                style = 'RECTANGULAR';
                break;
            case this.tp.WaterTunnelSectionStyle.CITYOPENING:
                style = 'CITYOPENING';
                break;
            case this.tp.WaterTunnelSectionStyle.CIRCULAR:
                style = 'CIRCULAR';
                break;
            case this.tp.WaterTunnelSectionStyle.HORSESHOE:
                style = 'HORSESHOE';
                break;
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
            ['arcRadius', this.params.arcRadius],
            ['arcAngle', this.params.arcAngle],
            ['bottomPlatformHeight', this.params.bottomPlatformHeight],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['points', this.params.points.map(p => ({
                position: [
                    p.position.X(),
                    p.position.Y(),
                    p.position.Z()
                ],
                type: p.type
            }))]
        ])) as WaterTunnelObject;
    }
}


export function createHPPrimitive(tp: TopoInstance, args?: HPPrimitiveType | any): HPPrimitive | undefined {
    if (args === undefined) {
        return undefined;
    }
    let type: HPPrimitiveType | undefined = undefined;
    let obj: any = undefined;
    if (args && args['type'] !== undefined) {
        type = args['type'];
        obj = args;
    } else if (typeof args === 'string') {
        type = args as HPPrimitiveType;
    }
    let primitive: HPPrimitive | undefined = undefined;
    switch (type) {
        case HPPrimitiveType.WaterTunnel:
            primitive = new WaterTunnelPrimitive(tp);
            break;
        default:
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