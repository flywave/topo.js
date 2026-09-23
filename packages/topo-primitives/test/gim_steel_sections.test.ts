// 规范型钢 (Q/GDW 11809—2018 附录 B): 型号解析 + 构建冒烟
// 解析层与 topotypes gim/gs/steel.go 同一口径 (含 GB/T 706-2008 常用牌号表)
import { beforeAll, describe, expect, it } from "vitest";
import { getTopo } from "./helpers/topo";
import {
    parseSteelSection,
    parseSteelSectionForNode,
    SteelSectionKind,
    SpecSteelPrimitive,
} from "../lib/gim/gs/steel";
import { SpecSteelPrimitive as SpecSteelPrimitiveClass } from "../lib/gim/gs/spec_steel";

let tp: any;

describe("spec steel section parsing", () => {
    it("explicit dimension models", () => {
        const cases: Array<[string, SteelSectionKind, number, number]> = [
            ["L50X4", SteelSectionKind.Angle, 50, 4],
            ["L75x50x5", SteelSectionKind.Angle, 75, 50],
            ["I200X100X7X11.4", SteelSectionKind.IBeam, 200, 100],
            ["H400X200X8X13", SteelSectionKind.IBeam, 400, 200],
            ["C200X75X9X11", SteelSectionKind.Channel, 200, 75],
            ["[200X75X9X11", SteelSectionKind.Channel, 200, 75],
            ["-60X6", SteelSectionKind.Flat, 60, 6],
            ["F60X6", SteelSectionKind.Flat, 60, 6],
            ["T50X5", SteelSectionKind.Tee, 50, 5],
            ["D20", SteelSectionKind.Round, 20, 0],
            ["φ200X8", SteelSectionKind.RoundTube, 200, 8],
            ["D200X8", SteelSectionKind.RoundTube, 200, 8],
            ["R200X100X8", SteelSectionKind.RectTube, 200, 100],
            ["S200X8", SteelSectionKind.SquareTube, 200, 8],
            ["2C200X75X9X11", SteelSectionKind.DoubleChannel, 200, 75],
            ["2L50X4", SteelSectionKind.DoubleAngle, 50, 4],
            ["2L75X50X5", SteelSectionKind.DoubleAngle, 75, 50],
            ["P8X200X8", SteelSectionKind.PolygonTube, 8, 200],
        ];
        for (const [model, kind, a, b] of cases) {
            const sec = parseSteelSection(model);
            expect(sec, model).toBeDefined();
            expect(sec!.kind, model).toBe(kind);
            const main = sec!.leg1 || sec!.diameter || sec!.sides;
            expect([sec!.leg1, sec!.diameter, sec!.sides], model).toContain(a);
            if (b > 0 && sec!.kind !== SteelSectionKind.Round) {
                expect(sec!.leg2 || sec!.thickness, model).toBeGreaterThan(0);
            }
        }
    });

    it("GB designations (GB/T 706-2008)", () => {
        const cases: Array<[string, string, number, number, number, number, SteelSectionKind]> = [
            ["I-Beam", "I20a", 200, 100, 7.0, 11.4, SteelSectionKind.IBeam],
            ["I-Beam", "I20b", 200, 102, 9.0, 11.4, SteelSectionKind.IBeam],
            ["I-Beam", "I10", 100, 68, 4.5, 7.6, SteelSectionKind.IBeam],
            ["I-Beam", "I32c", 320, 134, 13.5, 15.0, SteelSectionKind.IBeam],
            ["ILightbeams", "I20", 200, 100, 5.2, 8.4, SteelSectionKind.IBeam],
            ["BeamChannel", "C10", 100, 48, 5.3, 8.5, SteelSectionKind.Channel],
            ["BeamChannel", "[14b", 140, 60, 8.0, 9.5, SteelSectionKind.Channel],
            ["BeamChannel", "10#", 100, 48, 5.3, 8.5, SteelSectionKind.Channel],
            ["BeamChannel", "C25c", 250, 82, 11.0, 12.0, SteelSectionKind.Channel],
            ["LightBeamChannel", "C10", 100, 46, 4.5, 7.6, SteelSectionKind.Channel],
        ];
        for (const [node, model, h, b, tw, tf, kind] of cases) {
            const sec = parseSteelSectionForNode(node, model);
            expect(sec, `${node} ${model}`).toBeDefined();
            expect(sec!.kind, model).toBe(kind);
            expect(sec!.leg1, model).toBe(h);
            expect(sec!.leg2, model).toBe(b);
            expect(sec!.thickness, model).toBe(tw);
            expect(sec!.flangeThickness, model).toBe(tf);
        }
        // 未收录牌号仍应失败
        expect(parseSteelSectionForNode("I-Beam", "I63c")).toBeUndefined();
        expect(parseSteelSection("")).toBeUndefined();
    });
});

describe("spec steel primitives build", () => {
    beforeAll(async () => {
        tp = await getTopo();
    });

    const models: Array<[string, string]> = [
        ["EquilateralAngleSteel", "L50X4"],
        ["ScaleneAngleSteel", "L75X50X5"],
        ["I-Beam", "I200X100X7X11.4"],
        ["H-beam", "H400X200X8X13"],
        ["BeamChannel", "C200X75X9X11"],
        ["LightBeamChannel", "C200X75X5X9"],
        ["FlatSteel", "-60X6"],
        ["L-Steel", "L60X40X5"],
        ["T-Steel", "T100X100X6X8"],
        ["RoundSteel", "D20"],
        ["RoundSteelTube", "D200X8"],
        ["RectangularSteelTube", "R200X100X8"],
        ["SquareSteelTube", "S200X8"],
        ["DoubleChannelSteel", "2C200X75X9X11"],
        ["EquilateralDoubleAngleSteel", "2L50X4"],
        ["UnequalAngleSteel", "2L75X50X5"],
        ["PolygonRoundSteelTube", "P8X200X8"],
    ];

    for (const [node, model] of models) {
        it(`${node} ${model}`, () => {
            const prim = new SpecSteelPrimitiveClass(tp, node);
            prim.setParams({ model, length: 6000 });
            const ok = prim.valid();
            if (!ok) throw new Error(`${node}: valid()=false`);
            let shape;
            try {
                shape = prim.build();
            } catch (e: any) {
                throw new Error(`${node}: build threw ${typeof e}: ${String(e).slice(0, 60)}`);
            }
            if (shape === undefined) throw new Error(`${node}: build returned undefined`);
            if (shape.isNull()) throw new Error(`${node}: isNull`);
            // bbox 断言暂缓: 空心管件的 GeometryObject.bbox 存在 C++ 异常以裸数字穿越
            // embind 的绑定层缺陷 (已登记), 此处以 isValid 语义替代
            if (!shape.isValid()) throw new Error(`${node}: invalid`);
        });
    }

    it("未收录牌号校验失败", () => {
        const prim = new SpecSteelPrimitiveClass(tp, "GIM/GS/I-Beam");
        prim.setParams({ model: "I999z", length: 6000 });
        expect(prim.valid()).toBe(false);
        expect(() => prim.build()).toThrow();
    });
});
