import {
    Shape,
    TopoInstance,
    WaterTunnelParams
} from "topo-wasm";
import { BasePrimitive, Primitive } from "../primitive";

export enum HPPrimitiveType {
    WaterTunnel = "HP::water_tunnel"
}

export type HPPrimitive = WaterTunnelPrimitive

export class WaterTunnelPrimitive extends BasePrimitive<WaterTunnelParams> {

    constructor(tp: TopoInstance, params?: WaterTunnelParams) {
        super(tp, params);
    }

    getType(): string {
        return HPPrimitiveType.WaterTunnel;
    }

    setDefault(): Primitive<WaterTunnelParams> {
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

    public setParams(params: WaterTunnelParams): Primitive<WaterTunnelParams> {
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

    fromObject(o: any): Primitive<WaterTunnelParams> {
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
            arcRadius: o['arcRadius'],
            arcAngle: o['arcAngle'],
            bottomPlatformHeight: o['bottomPlatformHeight'],
            cushionExtension: o['cushionExtension'],
            cushionThickness: o['cushionThickness'],
            points: o['points']?.map((p: any) => ({
                position: new this.tp.gp_Pnt_3(p.position.x, p.position.y, p.position.z),
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
            ['arcRadius', this.params.arcRadius],
            ['arcAngle', this.params.arcAngle],
            ['bottomPlatformHeight', this.params.bottomPlatformHeight],
            ['cushionExtension', this.params.cushionExtension],
            ['cushionThickness', this.params.cushionThickness],
            ['points', this.params.points.map(p => ({
                position: {
                    x: p.position.X(),
                    y: p.position.Y(),
                    z: p.position.Z()
                },
                type: p.type
            }))]
        ]));
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