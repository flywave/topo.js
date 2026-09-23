// 规范型钢 Primitive (Q/GDW 11809—2018 附录 B 型钢构件):
// 18 种型钢节点共用 Model (型号) + Length (长度) 驱动参数。
// 型号经 parseSteelSectionForNode 解析后映射到内核图元:
//   角钢/工字/槽钢/T 型 → 对应 create_* 内核; 等边角钢用截面挤出 (内核要求 L2<L1);
//   空心管类 → 外轮廓与内轮廓布尔差; 双型钢 → 背靠背复合体。
import {
  AngleSteelParams,
  ChannelSteelParams,
  CuboidParams,
  CylinderShapeParams,
  IShapedSteelParams,
  StretchedBodyParams,
  TSteelParams,
  TopoInstance,
} from "topo-wasm";
import type { Shape } from "topo-wasm";
import { BasePrimitive, Primitive } from "../../primitive";
import {
  parseSteelSectionForNode,
  SteelSectionKind,
  type SteelSection,
} from "./steel";

export interface SpecSteelParams {
  model: string;
  length: number;
}

export interface SpecSteelObject {
  type: string;
  version?: number;
  model: string;
  length: number;
}

// 由各节点类传入规范节点名与截面解析器
export class SpecSteelPrimitive extends BasePrimitive<SpecSteelParams, SpecSteelObject> {
  private readonly nodeName: string;

  constructor(tp: TopoInstance, nodeName: string, params?: SpecSteelObject) {
    super(tp, params);
    this.nodeName = nodeName;
  }

  getType(): string {
    return this.nodeName;
  }

  setDefault(): Primitive<SpecSteelParams, SpecSteelObject> {
    this.params.model = "L50X4";
    this.params.length = 6000;
    return this;
  }

  setParams(params: SpecSteelParams): Primitive<SpecSteelParams, SpecSteelObject> {
    this.params = params;
    return this;
  }

  section(): SteelSection | undefined {
    return parseSteelSectionForNode(this.nodeName, this.params.model);
  }

  public valid(): boolean {
    if (!this.params.model || this.params.length <= 0) return false;
    return this.section() !== undefined;
  }

  public build(): Shape | undefined {
    const sec = this.section();
    if (!sec || this.params.length <= 0) {
      throw new Error(`Invalid parameters for ${this.nodeName}: model=${this.params.model}`);
    }
    const tp = this.tp;
    const L = this.params.length;
    switch (sec.kind) {
      case SteelSectionKind.Angle:
      case SteelSectionKind.DoubleAngle: {
        const leg2 = sec.leg2 > 0 ? sec.leg2 : sec.leg1;
        const one = (): Shape | undefined => {
          if (sec.leg1 === leg2) {
            // 等边角钢: 内核要求 L2<L1, 等边截面由多边形挤出
            const w = sec.leg1;
            const t = sec.thickness;
            const pts = [
              [0, 0, 0], [w, 0, 0], [w, t, 0], [t, t, 0], [t, w, 0], [0, w, 0],
            ].map((p) => new tp.gp_Pnt_3(p[0], p[1], p[2]));
            return new tp.Shape(
              tp.createStretchedBody({
                points: pts,
                normal: new tp.gp_Dir_4(0, 0, 1),
                length: L,
              } as StretchedBodyParams),
              false,
            );
          }
          return new tp.Shape(
            tp.createAngleSteel({ L1: sec.leg1, L2: leg2, X: sec.thickness, length: L } as AngleSteelParams),
            false,
          );
        };
        const a = one();
        if (!a) return undefined;
        if (sec.kind === SteelSectionKind.Angle) return a;
        const b = one();
        if (!b) return undefined;
        b.translate(new tp.gp_Vec_4(0, leg2 + sec.thickness, 0));
        return tp.ShapeOps.fuse([a, b], 1e-6) ?? undefined;
      }
      case SteelSectionKind.IBeam:
      case SteelSectionKind.Channel:
      case SteelSectionKind.DoubleChannel:
      case SteelSectionKind.Tee: {
        const mk = (): Shape | undefined => {
          if (sec.kind === SteelSectionKind.Channel || sec.kind === SteelSectionKind.DoubleChannel) {
            return new tp.Shape(
              tp.createChannelSteel({
                height: sec.leg1,
                flangeWidth: sec.leg2,
                webThickness: sec.thickness,
                flangeThickness: sec.flangeThickness,
                length: L,
              } as ChannelSteelParams),
              false,
            );
          }
          if (sec.kind === SteelSectionKind.Tee) {
            return new tp.Shape(
              tp.createTSteel({
                height: sec.leg1,
                width: sec.leg2,
                webThickness: sec.thickness,
                flangeThickness: sec.flangeThickness,
                length: L,
              } as TSteelParams),
              false,
            );
          }
          return new tp.Shape(
            tp.createIShapedSteel({
              height: sec.leg1,
              flangeWidth: sec.leg2,
              webThickness: sec.thickness,
              flangeThickness: sec.flangeThickness,
              length: L,
            } as IShapedSteelParams),
            false,
          );
        };
        const a = mk();
        if (!a) return undefined;
        if (sec.kind !== SteelSectionKind.DoubleChannel) return a;
        const b = mk();
        if (!b) return undefined;
        b.translate(new tp.gp_Vec_4(0, sec.leg2 + sec.thickness, 0));
        return tp.ShapeOps.fuse([a, b], 1e-6) ?? undefined;
      }
      case SteelSectionKind.Flat:
        return new tp.Shape(
          tp.createCuboid({ length: L, width: sec.leg1, height: sec.thickness } as CuboidParams),
          false,
        );
      case SteelSectionKind.Round:
        return new tp.Shape(
          tp.createCylinderShape({ radius: sec.diameter / 2, height: L, angle: Math.PI * 2 } as any),
          false,
        );
      case SteelSectionKind.RoundTube:
      case SteelSectionKind.RectTube:
      case SteelSectionKind.SquareTube:
      case SteelSectionKind.PolygonTube: {
        let outer: Shape | undefined;
        let inner: Shape | undefined;
        if (sec.kind === SteelSectionKind.RoundTube) {
          outer = new tp.Shape(tp.createCylinderShape({ radius: sec.diameter / 2, height: L, angle: Math.PI * 2 } as any), false);
          inner = new tp.Shape(
            tp.createCylinderShape({ radius: sec.diameter / 2 - sec.thickness, height: L, angle: Math.PI * 2 } as any),
            false,
          );
        } else if (sec.kind === SteelSectionKind.PolygonTube) {
          outer = this.polygonPrism(sec.sides, sec.leg1, L);
          inner = this.polygonPrism(sec.sides, sec.leg1 - 2 * sec.thickness, L);
        } else {
          const w = sec.leg1;
          const h = sec.leg2 > 0 ? sec.leg2 : sec.leg1;
          outer = new tp.Shape(tp.createCuboid({ length: w, width: h, height: L } as CuboidParams), false);
          inner = new tp.Shape(
            tp.createCuboid({ length: w - 2 * sec.thickness, width: h - 2 * sec.thickness, height: L } as CuboidParams),
            false,
          );
        }
        if (!outer || !inner) return undefined;
        return tp.ShapeOps.cut(outer, inner, 1e-6) ?? undefined;
      }
    }
    return undefined;
  }

  // 正多边形棱柱 (以对边距 acrossFlats, 沿 Z 拉伸)
  private polygonPrism(sides: number, acrossFlats: number, length: number): Shape | undefined {
    if (sides < 3 || acrossFlats <= 0) return undefined;
    const r = acrossFlats / 2 / Math.cos(Math.PI / sides);
    const pts: number[][] = [];
    for (let i = 0; i < sides; i++) {
      const ang = Math.PI / sides + (2 * Math.PI * i) / sides;
      pts.push([r * Math.cos(ang), r * Math.sin(ang), 0]);
    }
    const tp = this.tp;
    return new tp.Shape(
      tp.createStretchedBody({
        points: pts.map((p) => new tp.gp_Pnt_3(p[0], p[1], p[2])),
        normal: new tp.gp_Dir_4(0, 0, 1),
        length,
      } as StretchedBodyParams),
      false,
    );
  }

  fromObject(o?: SpecSteelObject): Primitive<SpecSteelParams, SpecSteelObject> {
    if (o === undefined) return this;
    if (o["version"]) this.version = o["version"];
    this.params = { model: o["model"], length: o["length"] };
    return this;
  }

  toObject(): SpecSteelObject | undefined {
    return BasePrimitive.buildObject(
      new Map<string, any>([
        ["type", this.getType()],
        ["version", this.getVersion()],
        ["model", this.params.model],
        ["length", this.params.length],
      ]),
    ) as SpecSteelObject;
  }
}
