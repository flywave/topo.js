// 布局闭环正式用例 (移植自 go-topo/.cache/layout_ts_verify.mjs 的 44 断言)
// 锚段: 计算口径 / JSON 往返 / 再生成命名唯一 / 编辑再生成 bbox / Go 口径 / Go JSON 互通
// 站场: 道岔识别 / 菱形交叉 / 编辑再生成 / Go JSON 互通
// 注意: Assembly.getElements() 绑定有 bug (assembly_element 无法转 emval), 遍历用 children()/name()/obj()
import { beforeAll, describe, expect, it } from "vitest";
import {
    anchorSectionLayoutFromJSON,
    computeAnchorSectionLayout,
    createAnchorSectionFromLayout,
} from "../lib/railway/anchor_section";
import {
    computeYardLayout,
    createYardFromLayout,
    yardLayoutFromJSON,
} from "../lib/railway/yard";
import { getTopo } from "./helpers/topo";

function collectNames(as: any, out: string[] = []): string[] {
    out.push(as.name());
    for (const c of as.children()) collectNames(c, out);
    return out;
}

function findChild(as: any, name: string): any {
    for (const c of as.children()) {
        if (c.name() === name) return c;
    }
    return null;
}

function buildAnchorLayout() {
    const cl: [number, number, number][] = [];
    for (let x = 0; x <= 150000; x += 5000) cl.push([x, 0, 0]);
    return computeAnchorSectionLayout({
        centerline: cl,
        contactHeight: 5300,
        spanLength: 45000,
        mastHeight: 8000,
        mastType: 1,
        hasCompensator: true,
    });
}

// 与 Go buildYardGeoJSON 同构: 一条股道 + 一组道岔
function buildYardGeoJSON() {
    const line = (x0: number, y0: number, x1: number, _y1: number, step: number) => {
        const pts: [number, number, number][] = [];
        const n = Math.trunc((x1 - x0) / step + 0.5); // 与 Go int() 截断一致
        for (let i = 0; i <= n; i++) pts.push([x0 + i * step, y0, 0]);
        return pts;
    };
    const siding: [number, number, number][] = [];
    const R = 350.0;
    for (let i = 0; i <= 32; i++) {
        const th = i * 0.0072;
        siding.push([100 + R * Math.sin(th), R - R * Math.cos(th), 0]);
    }
    const feature = (coords: [number, number, number][]) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: { gauge: 1435, railType: 60 },
    });
    return {
        type: "FeatureCollection",
        features: [feature(line(0, 0, 100, 0, 5)), feature(line(100, 0, 400, 0, 5)), feature(siding)],
    };
}

describe("anchor section layout", () => {
    let tp: any;
    beforeAll(async () => {
        tp = await getTopo();
    });

    it("150m/45m: 4 柱 3 跨", () => {
        const layout = buildAnchorLayout();
        expect(layout.masts.length).toBe(4);
        expect(layout.spans.length).toBe(3);
    });

    it("柱位 x=i*50000(等分), y=2900(CX)", () => {
        const layout = buildAnchorLayout();
        for (let i = 0; i < 4; i++) {
            expect(Math.abs(layout.masts[i].position[0] - i * 50000)).toBeLessThan(1e-6);
            expect(Math.abs(layout.masts[i].position[1] - 2900)).toBeLessThan(1e-6);
        }
    });

    it("拉出值之字 ±300, 接触线悬挂点 y=stagger", () => {
        const layout = buildAnchorLayout();
        for (let i = 0; i < 4; i++) {
            const want = i % 2 === 0 ? 300 : -300;
            expect(layout.masts[i].stagger).toBe(want);
            expect(Math.abs(layout.masts[i].contactPoint[1] - want)).toBeLessThan(1e-6);
        }
    });

    it("接触线 z=5300, 承力索 z=6700", () => {
        const layout = buildAnchorLayout();
        for (const m of layout.masts) {
            expect(m.contactPoint[2]).toBe(5300);
            expect(m.messengerPoint[2]).toBe(6700);
        }
    });

    it("端柱为锚柱", () => {
        const layout = buildAnchorLayout();
        expect(layout.masts[0].isTensionMast).toBe(true);
        expect(layout.masts[3].isTensionMast).toBe(true);
        expect(layout.masts[1].isTensionMast).toBe(false);
    });

    it("跨距=hypot(50000,600), 弛度 22.5/675", () => {
        const layout = buildAnchorLayout();
        const spanLenWant = Math.hypot(50000, 600);
        for (let i = 0; i < 3; i++) {
            const sp = layout.spans[i];
            expect(sp.fromMast).toBe(i);
            expect(sp.toMast).toBe(i + 1);
            expect(Math.abs(sp.length - spanLenWant)).toBeLessThan(1);
            expect(sp.contactSag).toBe(22.5);
            expect(sp.messengerSag).toBe(675);
        }
    });

    it("每跨 6 根吊弦, t=k/7, 长度=抛物线弧垂差", () => {
        const layout = buildAnchorLayout();
        for (const sp of layout.spans) {
            expect(sp.droppers.length).toBe(6);
            const mid = sp.droppers[2];
            expect(Math.abs(mid.t - 3 / 7)).toBeLessThan(1e-9);
            const wantLen = 1400 - 4 * (675 - 22.5) * mid.t * (1 - mid.t);
            expect(Math.abs(mid.length - wantLen)).toBeLessThan(1e-6);
        }
    });

    it("layout JSON 往返一致", () => {
        const layout = buildAnchorLayout();
        const json = JSON.stringify(layout);
        expect(JSON.stringify(anchorSectionLayoutFromJSON(json))).toBe(json);
    });

    it("再生成: 根名 anchor_section, 29 子件命名唯一", () => {
        const as = createAnchorSectionFromLayout(buildAnchorLayout(), tp);
        expect(as).not.toBeNull();
        expect(as.name()).toBe("anchor_section");
        const names = collectNames(as);
        expect(new Set(names).size).toBe(names.length);
        // root + 4 mast + 3 cw + 3 mw + 18 dropper = 29
        expect(names.length).toBe(29);
        for (const n of ["mast_0", "mast_3", "cw_0", "mw_2", "dropper_0_0", "dropper_2_5"]) {
            expect(findChild(as, n), `子件 ${n}`).not.toBeNull();
        }
    });

    it("编辑拉出值再生成: cw_0 bbox yLength 缩 ~400", () => {
        const layout = buildAnchorLayout();
        const as = createAnchorSectionFromLayout(layout, tp);
        const cw0a = findChild(as, "cw_0").obj().bbox().yLength();
        layout.masts[1].stagger = 500;
        const as2 = createAnchorSectionFromLayout(layout, tp);
        const cw0b = findChild(as2, "cw_0").obj().bbox().yLength();
        expect(Math.abs(cw0a - cw0b - 400)).toBeLessThan(20);
    });

    it("编辑柱高再生成: mast_2 bbox zLength 增 ~1000", () => {
        const layout = buildAnchorLayout();
        const as = createAnchorSectionFromLayout(layout, tp);
        const m2a = findChild(as, "mast_2").obj().bbox().zLength();
        layout.masts[2].mastHeight = 9000;
        const as2 = createAnchorSectionFromLayout(layout, tp);
        const m2b = findChild(as2, "mast_2").obj().bbox().zLength();
        expect(Math.abs(m2b - m2a - 1000)).toBeLessThan(50);
    });

    it("250m/50m → 6 柱 5 跨, 弛度 25/750, 每跨 6 吊弦 (Go 测试口径)", () => {
        const cl: [number, number, number][] = [];
        for (let x = 0; x <= 250000; x += 5000) cl.push([x, 0, 0]);
        const l2 = computeAnchorSectionLayout({
            centerline: cl,
            contactHeight: 5300,
            spanLength: 50000,
            mastHeight: 8000,
            mastType: 1,
            hasCompensator: true,
        });
        expect(l2.masts.length).toBe(6);
        expect(l2.spans.length).toBe(5);
        for (const s of l2.spans) {
            expect(s.droppers.length).toBe(6);
            expect(s.contactSag).toBe(25);
            expect(s.messengerSag).toBe(750);
        }
    });

    it("Go 锚段 JSON 互通: 2 柱 1 跨 16 子件", () => {
        // 手造 2 柱 1 跨锚段 (droppers 空 → 自动布置), 字段名与 Go AnchorSectionLayout 一致
        const goLayout = {
            spec: {
                centerline: [[0, 0, 0], [90000, 0, 0]], contactHeight: 5300, structureHeight: 1400,
                spanLength: 45000, mastHeight: 8000, mastType: 1, sideOffset: 2900, mastSide: 1,
                hasCompensator: false, contactWireDia: 12.9, messengerDia: 13.5, dropperSpacing: 8000,
            },
            masts: [
                {
                    mileage: 0, position: [0, 2900, 0], direction: [0, -1, 0], mastHeight: 8000,
                    contactWireZ: 5300, messengerWireZ: 6700, stagger: 300, isTensionMast: false,
                    contactPoint: [0, 300, 5300], messengerPoint: [0, 300, 6700],
                },
                {
                    mileage: 90, position: [90000, 2900, 0], direction: [0, -1, 0], mastHeight: 8000,
                    contactWireZ: 5300, messengerWireZ: 6700, stagger: -300, isTensionMast: false,
                    contactPoint: [90000, -300, 5300], messengerPoint: [90000, -300, 6700],
                },
            ],
            spans: [{ fromMast: 0, toMast: 1, length: Math.hypot(90000, 600), contactSag: 22.5, messengerSag: 675, droppers: [] }],
        };
        const layout = anchorSectionLayoutFromJSON(JSON.stringify(goLayout));
        const as = createAnchorSectionFromLayout(layout, tp);
        const names = collectNames(as);
        // root + 2 mast + 1 cw + 1 mw + 11 droppers (trunc(90002/8000)=11)
        expect(names.length).toBe(16);
        expect(findChild(as, "cw_0")).not.toBeNull();
        expect(findChild(as, "dropper_0_10")).not.toBeNull();
    });
});

describe("yard layout", () => {
    let tp: any;
    beforeAll(async () => {
        tp = await getTopo();
    });

    it("识别: 3 股道 / 1 组左开 12 号道岔 / 0 菱形交叉", () => {
        const layout = computeYardLayout(buildYardGeoJSON() as any);
        expect(layout.tracks.length).toBe(3);
        expect((layout.turnouts ?? []).length).toBe(1);
        expect((layout.crossings ?? []).length).toBe(0);
        const tn = layout.turnouts![0];
        expect(tn.isLeftHand).toBe(true);
        expect(tn.turnoutNo).toBe(12);
    });

    it("主入边裁剪 0 < trimE < 100000, 道岔关联边互不相同", () => {
        const layout = computeYardLayout(buildYardGeoJSON() as any);
        const tn = layout.turnouts![0];
        expect(layout.tracks[0].trimS).toBe(0);
        expect(layout.tracks[0].trimE).toBeGreaterThan(0);
        expect(layout.tracks[0].trimE).toBeLessThan(100000);
        expect(new Set([tn.edgeIn, tn.edgeOut, tn.edgeDiv]).size).toBe(3);
    });

    it("layout JSON 往返一致", () => {
        const layout = computeYardLayout(buildYardGeoJSON() as any);
        const json = JSON.stringify(layout);
        expect(JSON.stringify(yardLayoutFromJSON(json))).toBe(json);
    });

    it("再生成: 7 个唯一子件名 (3×钢轨+轨枕 + 1 道岔)", () => {
        const layout = computeYardLayout(buildYardGeoJSON() as any);
        const as = createYardFromLayout(layout, tp);
        const names = collectNames(as);
        expect(new Set(names).size).toBe(7);
        for (const n of ["rails_0", "sleepers_0", "rails_2", "sleepers_2", "turnout_0"]) {
            expect(names).toContain(n);
        }
    });

    it("编辑道岔号数 12→9 再生成: turnout_0 bbox 变化", () => {
        const layout = computeYardLayout(buildYardGeoJSON() as any);
        const as = createYardFromLayout(layout, tp);
        const bb12 = findChild(as, "turnout_0").obj().bbox();
        const dims12 = [bb12.xLength(), bb12.yLength()];
        // 清 0 switchRailLength/leadCurveRadius 按号数查表
        layout.turnouts![0].turnoutNo = 9;
        layout.turnouts![0].switchRailLength = 0;
        layout.turnouts![0].leadCurveRadius = 0;
        const as3 = createYardFromLayout(layout, tp);
        const bb9 = findChild(as3, "turnout_0").obj().bbox();
        const dims9 = [bb9.xLength(), bb9.yLength()];
        expect(
            Math.abs(dims12[0] - dims9[0]) > 100 || Math.abs(dims12[1] - dims9[1]) > 100,
            `12号 ${dims12.map((d) => d.toFixed(0))} → 9号 ${dims9.map((d) => d.toFixed(0))}`,
        ).toBe(true);
    });

    it("菱形交叉: 2 股道 0 道岔 1 交叉, x≈200000, 股道不裁剪", () => {
        const a: [number, number, number][] = [];
        const b: [number, number, number][] = [];
        for (let x = 0; x <= 400; x += 10) a.push([x, 0, 0]);
        for (let y = -20; y <= 20; y += 4) b.push([200, y, 0]);
        const feature = (coords: [number, number, number][]) => ({
            type: "Feature",
            geometry: { type: "LineString", coordinates: coords },
            properties: { gauge: 1435 },
        });
        const layout = computeYardLayout({
            type: "FeatureCollection",
            features: [feature(a), feature(b)],
        } as any);
        expect(layout.tracks.length).toBe(2);
        expect((layout.turnouts ?? []).length).toBe(0);
        expect((layout.crossings ?? []).length).toBe(1);
        const cr = layout.crossings![0];
        expect(cr.position[0]).toBeGreaterThan(199000);
        expect(cr.position[0]).toBeLessThan(201000);
        expect(layout.tracks.every((t) => t.trimS === 0)).toBe(true);
    });

    it("Go 站场 JSON 互通: 1 股道 → rails_0 + sleepers_0", () => {
        const goYard = {
            tracks: [{
                centerline: [[0, 0, 0], [100000, 0, 0]], trimS: 0, trimE: 0,
                props: {
                    gauge: 1435, railType: 60, superElevation: 0, coordScale: 1000,
                    sleeperLength: 2600, sleeperWidth: 260, sleeperHeight: 200, sleeperSpacing: 600,
                    ballastTopWidth: 3600, ballastThickness: 300, ballastSlope: 1.5, noSleepers: false,
                },
            }],
            turnouts: [], crossings: [],
        };
        const as = createYardFromLayout(yardLayoutFromJSON(JSON.stringify(goYard)), tp);
        const names = collectNames(as);
        expect(names.length).toBe(2);
        expect(names).toContain("rails_0");
        expect(names).toContain("sleepers_0");
    });
});
