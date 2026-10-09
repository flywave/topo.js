// 矿山参数化图元全覆盖测试 (minebim P 线, Q/SHJ 0035.3-2012)
// 对齐 go-topo/primitives_mine_test.go 名义参数矩阵: 35 个 createMine* 逐个
// 构建 (shape 非空 / bbox 有限) + 关键拒绝用例 (量纲/枚举/几何越界 → 抛错或 null)。
// 单位 m (minebim 场景口径)。
import { beforeAll, describe, expect, it } from "vitest";
import { getTopo, checkShape } from "./helpers/topo";

let tp: any;

/** Wrap raw TopoDS_Shape → Shape for checkShape compatibility */
function wrap(raw: any): any {
    return new tp.Shape(raw, false);
}

/** gp_Pnt(x,y,z) — Embind registered as gp_Pnt_3 */
function pnt(x: number, y: number, z: number): any {
    return new tp.gp_Pnt_3(x, y, z);
}

/** gp_Dir(x,y,z) — Embind registered as gp_Dir_4 */
function dir(x: number, y: number, z: number): any {
    return new tp.gp_Dir_4(x, y, z);
}

// 惰性构造 (gp 对象须在 beforeAll 加载 WASM 后创建)
const AXIS_X = () => dir(1, 0, 0);
const PATH_BEND = () => [pnt(0, 0, 0), pnt(200, 0, -5), pnt(200, 120, -5)];
const PATH_STRAIGHT = () => [pnt(0, 0, 0), pnt(120, 0, 0)];
const BOUND = () => [pnt(0, 0, 0), pnt(40, 0, 0), pnt(40, 12, 0), pnt(0, 12, 0)];

/** 拒绝语义: C++ ConstructionError → JS 抛错, 或宿主返回 null/undefined */
function expectReject(fn: () => any, label: string) {
    let threw = false;
    try {
        const r = fn();
        if (r === null || r === undefined) threw = true;
    } catch {
        threw = true;
    }
    expect(threw, `${label} 应被拒绝`).toBe(true);
}

describe("mine primitives (煤矿参数化图元全覆盖)", () => {
    beforeAll(async () => {
        tp = await getTopo();
    });

    // --- A 井巷工程 ---
    it("createMineShaft (圆形立井)", () => {
        const shp = tp.createMineShaft({
            shape: 0, innerRadius: 3, outerRadius: 3.5,
            innerLength: 0, outerLength: 0, innerWidth: 0, outerWidth: 0, depth: 60,
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `MineShaft: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineShaftAt (井口放置)", () => {
        const shp = tp.createMineShaftAt(
            { shape: 1, innerRadius: 0, outerRadius: 0, innerLength: 4, innerWidth: 3, outerLength: 5, outerWidth: 4, depth: 50 },
            pnt(1000, 2000, 1200));
        const r = checkShape(wrap(shp));
        expect(r.ok, `MineShaftAt: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineOrepass (煤仓变径放样)", () => {
        const shp = tp.createMineOrepass({
            center: pnt(0, 0, 0),
            stations: [
                { depth: 0, radius: 2.5 }, { depth: 20, radius: 2.5 },
                { depth: 35, radius: 1.6 }, { depth: 60, radius: 1.6 },
            ],
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `MineOrepass: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineRoadway (半圆拱巷道变坡)", () => {
        const shp = tp.createMineRoadway({
            section: tp.MineSection.ARCH, width: 4.6, height: 3.6, path: PATH_BEND(),
        });
        const r = checkShape(wrap(shp));
        expect(r.ok, `MineRoadway: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineRoadway (圆弧拱/椭圆/马蹄断面)", () => {
        for (const sec of [tp.MineSection.ARC_ARCH, tp.MineSection.ELLIPSE, tp.MineSection.HORSESHOE]) {
            const shp = tp.createMineRoadway({ section: sec, width: 4.6, height: 3.8, path: PATH_STRAIGHT() });
            const r = checkShape(wrap(shp));
            expect(r.ok, `MineRoadway sec=${sec}: ${r.reason ?? ""}`).toBe(true);
            shp.delete?.(); // Embind 显式释放 (多断面循环防堆积)
        }
    });

    it("createMineChamber (硐室)", () => {
        const r = checkShape(wrap(tp.createMineChamber({
            center: pnt(50, 50, 0), length: 8, width: 5, height: 4,
        })));
        expect(r.ok, `MineChamber: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineWorkingface (长壁工作面)", () => {
        const r = checkShape(wrap(tp.createMineWorkingface({
            origin: pnt(0, 0, 0), dir: AXIS_X(), faceLength: 200, advance: 60, seamThickness: 3.2,
        })));
        expect(r.ok, `MineWorkingface: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineHeading (掘进迎头)", () => {
        const r = checkShape(wrap(tp.createMineHeading({
            center: pnt(200, 0, -5), dir: AXIS_X(), section: tp.MineSection.ARCH, width: 4.6, height: 3.6,
        })));
        expect(r.ok, `MineHeading: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineAreaBody (面状体)", () => {
        const r = checkShape(wrap(tp.createMineAreaBody({
            boundary: BOUND(), baseZ: -350, height: 3,
        })));
        expect(r.ok, `MineAreaBody: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineTrench (水沟 左右偏移)", () => {
        for (const sideOffset of [1.6, -1.5]) {
            const shp = tp.createMineTrench({
                path: PATH_STRAIGHT(), section: tp.MineSection.TRAP,
                width: 0.5, height: 0.4, sideOffset,
            });
            const r = checkShape(wrap(shp));
            expect(r.ok, `MineTrench off=${sideOffset}: ${r.reason ?? ""}`).toBe(true);
        }
    });

    it("createMineJunction (交岔点+挑棚)", () => {
        const r = checkShape(wrap(tp.createMineJunction({
            center: pnt(100, 100, 0), mainAxis: AXIS_X(), branchAngleDeg: 45,
            section: tp.MineSection.ARCH, width: 4.2, height: 3.4,
            mainLength: 60, branchLength: 40, reinforceLength: 0.6,
        })));
        expect(r.ok, `MineJunction: ${r.reason ?? ""}`).toBe(true);
    });

    // --- B 支护系统 ---
    it("createMineBoltRow (锚杆排)", () => {
        const r = checkShape(wrap(tp.createMineBoltRow({
            origin: pnt(0, 0, 0), axis: AXIS_X(), section: tp.MineSection.ARCH,
            width: 4.6, height: 3.6, rowCount: 2, perRow: 4,
            spacing: 1.2, boltLength: 2.2, diameter: 0.022, cable: false,
        })));
        expect(r.ok, `MineBoltRow: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineBoltRow (锚索+托盘)", () => {
        const r = checkShape(wrap(tp.createMineBoltRow({
            origin: pnt(0, 0, 0), axis: AXIS_X(), section: tp.MineSection.ARCH,
            width: 4.6, height: 3.6, rowCount: 2, perRow: 3,
            spacing: 2.4, boltLength: 6.5, diameter: 0.022, cable: true,
        })));
        expect(r.ok, `MineBoltRow cable: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineShotcrete (喷浆壳)", () => {
        const r = checkShape(wrap(tp.createMineShotcrete({
            origin: pnt(0, 0, 0), axis: AXIS_X(), section: tp.MineSection.ARCH,
            width: 4.6, height: 3.6, thickness: 0.12, length: 30,
        })));
        expect(r.ok, `MineShotcrete: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineUsteelRow (U型钢排)", () => {
        const r = checkShape(wrap(tp.createMineUsteelRow({
            origin: pnt(0, 0, 0), axis: AXIS_X(), section: tp.MineSection.ARCH,
            width: 4.6, height: 3.6, thickness: 0.12, spacing: 0.8, count: 3,
        })));
        expect(r.ok, `MineUsteelRow: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineShieldRow (液压支架排)", () => {
        const r = checkShape(wrap(tp.createMineShieldRow({
            origin: pnt(0, 0, 0), dir: dir(0, 1, 0), count: 10,
            centerDist: 1.75, beamWidth: 1.8, beamThick: 0.3, height: 3.2, maxLegPairs: 24,
        })));
        expect(r.ok, `MineShieldRow: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineSteelBand (钢带打孔)", () => {
        const r = checkShape(wrap(tp.createMineSteelBand({
            length: 3, width: 0.28, thickness: 0.003, holeCount: 5, holeDia: 0.043, holeEdge: 0.15,
        })));
        expect(r.ok, `MineSteelBand: ${r.reason ?? ""}`).toBe(true);
    });

    // --- C 通风设施 ---
    it("createMineVentWall (风墙密闭)", () => {
        const r = checkShape(wrap(tp.createMineVentWall({
            section: tp.MineSection.ARCH, width: 4.6, height: 3.6, thickness: 0.5,
            center: pnt(100, 0, -5), axis: AXIS_X(),
        })));
        expect(r.ok, `MineVentWall: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineBoxWall (防爆/防火墙)", () => {
        const r = checkShape(wrap(tp.createMineBoxWall({
            width: 4.6, height: 3.6, thickness: 0.8, center: pnt(150, 0, -5), axis: AXIS_X(),
        })));
        expect(r.ok, `MineBoxWall: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineVentDoor (风门 关闭/开启)", () => {
        for (const openAngleDeg of [0, 80]) {
            const shp = tp.createMineVentDoor({
                width: 4.6, height: 3.6, doorWidth: 2, doorHeight: 2.2,
                doorThick: 0.08, frameWidth: 0.3, openAngleDeg,
                center: pnt(50, 0, -5), axis: AXIS_X(),
            });
            const r = checkShape(wrap(shp));
            expect(r.ok, `MineVentDoor ang=${openAngleDeg}: ${r.reason ?? ""}`).toBe(true);
        }
    });

    it("createMineVentWindow (调节风窗)", () => {
        const r = checkShape(wrap(tp.createMineVentWindow({
            width: 4.6, height: 3.2, thickness: 0.5, winWidth: 1.2, winHeight: 0.8,
            winSill: 1.2, bars: 4, center: pnt(60, 0, -5), axis: AXIS_X(),
        })));
        expect(r.ok, `MineVentWindow: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineVentBridge (风桥)", () => {
        const r = checkShape(wrap(tp.createMineVentBridge({
            span: 4, width: 3.4, thickness: 0.4, apex: 3.2, center: pnt(0, 0, -5), axis: AXIS_X(),
        })));
        expect(r.ok, `MineVentBridge: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineVentDuct (风筒)", () => {
        const r = checkShape(wrap(tp.createMineVentDuct({
            path: [pnt(0, 0, 2.6), pnt(120, 0, 2.6)], diameter: 0.8,
        })));
        expect(r.ok, `MineVentDuct: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineVentStation (测风站)", () => {
        const r = checkShape(wrap(tp.createMineVentStation({
            section: tp.MineSection.RECT, width: 4.2, height: 3.2,
            postWidth: 0.2, depth: 0.15, center: pnt(50, 0, -5), axis: AXIS_X(),
        })));
        expect(r.ok, `MineVentStation: ${r.reason ?? ""}`).toBe(true);
    });

    // --- D 防治水与地质 ---
    it("createMineFaultLens (断层透镜体)", () => {
        const r = checkShape(wrap(tp.createMineFaultLens({
            center: pnt(0, 0, 0), strike: AXIS_X(), dipAzimuth: dir(0, 1, 0),
            dipAngle: 30, zoneWidth: 8, zoneLength: 120, topElev: 50, bottomElev: -150,
        })));
        expect(r.ok, `MineFaultLens: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineCollapsePillar (陷落柱)", () => {
        const r = checkShape(wrap(tp.createMineCollapsePillar({
            bottomCenter: pnt(300, 300, -460), bottomLong: 24, bottomShort: 15.6,
            topLong: 40, topShort: 26, height: 150,
        })));
        expect(r.ok, `MineCollapsePillar: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineWaterGateWall (水闸墙)", () => {
        const r = checkShape(wrap(tp.createMineWaterGateWall({
            width: 4.2, height: 3.4, thickness: 1.2, doorWidth: 0.8, doorHeight: 1.8,
            center: pnt(0, 700, -350), axis: AXIS_X(),
        })));
        expect(r.ok, `MineWaterGateWall: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineWaterGate (水闸门)", () => {
        const r = checkShape(wrap(tp.createMineWaterGate({
            width: 4.2, height: 3.4, doorWidth: 1.6, doorHeight: 2,
            doorThick: 0.15, frameWidth: 0.35, center: pnt(0, 750, -350), axis: AXIS_X(),
        })));
        expect(r.ok, `MineWaterGate: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineBorehole (分层定向钻孔)", () => {
        const r = checkShape(wrap(tp.createMineBorehole({
            collar: pnt(100, 900, 1240), axis: dir(0.25, 0.25, -0.94), diameter: 0.13,
            layers: [{ from: 0, to: 200 }, { from: 200, to: 350 }, { from: 350, to: 500 }],
        })));
        expect(r.ok, `MineBorehole: ${r.reason ?? ""}`).toBe(true);
    });

    // --- E 运输系统 ---
    it("createMineRailTrack (轨道+轨枕)", () => {
        const r = checkShape(wrap(tp.createMineRailTrack({
            path: PATH_BEND(), gauge: 0.9, doubleTrack: false,
            centerDistance: 0, sleeperSpacing: 0.7, sleeperMax: 300,
        })));
        expect(r.ok, `MineRailTrack: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineRailTrack (双轨)", () => {
        const r = checkShape(wrap(tp.createMineRailTrack({
            path: PATH_STRAIGHT(), gauge: 0.6, doubleTrack: true,
            centerDistance: 2.3, sleeperSpacing: 0, sleeperMax: 0,
        })));
        expect(r.ok, `MineRailTrack double: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineTurnout (道岔骨架)", () => {
        const r = checkShape(wrap(tp.createMineTurnout({
            origin: pnt(50, 0, 0), axis: AXIS_X(), gauge: 0.9, frogNo: 9, length: 30,
        })));
        expect(r.ok, `MineTurnout: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineBelt (带式输送机)", () => {
        const r = checkShape(wrap(tp.createMineBelt({
            path: [pnt(0, 0, -350), pnt(400, 0, -350)], beltWidth: 1.2, frameHeight: 0.9,
        })));
        expect(r.ok, `MineBelt: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineScraper (刮板输送机)", () => {
        const r = checkShape(wrap(tp.createMineScraper({
            path: [pnt(0, 0, -350), pnt(180, 0, -350)], panWidth: 0.76, panHeight: 0.19,
        })));
        expect(r.ok, `MineScraper: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineMonorail (单轨吊)", () => {
        const r = checkShape(wrap(tp.createMineMonorail({
            path: PATH_STRAIGHT(), railHeight: 0.155, flangeWidth: 0.068,
        })));
        expect(r.ok, `MineMonorail: ${r.reason ?? ""}`).toBe(true);
    });

    // --- F 管线系统 ---
    it("createMinePipeRun (管路+托架环)", () => {
        const r = checkShape(wrap(tp.createMinePipeRun({
            path: [pnt(0, 0, 0.3), pnt(120, 0, 0.3)], diameter: 0.15, bracketSpacing: 3,
        })));
        expect(r.ok, `MinePipeRun: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMinePipeFitting (三通)", () => {
        const r = checkShape(wrap(tp.createMinePipeFitting({
            center: pnt(200, 0, 2.4), mainAxis: AXIS_X(), branchAngleDeg: 90,
            mainLength: 4, branchLength: 2.4, diameter: 0.15,
        })));
        expect(r.ok, `MinePipeFitting: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineCableRun (多缆)", () => {
        const r = checkShape(wrap(tp.createMineCableRun({
            path: [pnt(0, 0, 2.2), pnt(120, 0, 2.2)], diameter: 0.05, lines: 3,
        })));
        expect(r.ok, `MineCableRun: ${r.reason ?? ""}`).toBe(true);
    });

    it("createMineFence (栅栏)", () => {
        const r = checkShape(wrap(tp.createMineFence({
            width: 4.2, height: 2, postWidth: 0.15, barWidth: 0.08,
            thickness: 0.05, bars: 12, center: pnt(0, 0, -350), axis: AXIS_X(),
        })));
        expect(r.ok, `MineFence: ${r.reason ?? ""}`).toBe(true);
    });

    // --- 拒绝用例 (量纲/枚举/几何越界 → JS 抛错或 null) ---
    it("rejects: 非法参数必须被拒", () => {
        expectReject(() => tp.createMineShaft({ shape: 7, depth: 100 }), "井筒非法断面");
        expectReject(() => tp.createMineShaft({ shape: 0, innerRadius: 3.5, outerRadius: 3, depth: 100 }), "外径≤内径");
        expectReject(() => tp.createMineOrepass({ center: pnt(0, 0, 0), stations: [{ depth: 10, radius: 2 }, { depth: 5, radius: 2 }] }), "煤仓深度回退");
        expectReject(() => tp.createMineVentDoor({
            width: 2, height: 3, doorWidth: 3, doorHeight: 2.2, doorThick: 0.1, frameWidth: 0.3,
            center: pnt(0, 0, 0), axis: AXIS_X(),
        }), "门洞大于断面");
        expectReject(() => tp.createMineFaultLens({
            center: pnt(0, 0, 0), strike: AXIS_X(), dipAzimuth: dir(0, 1, 0),
            dipAngle: 95, zoneWidth: 5, zoneLength: 100, topElev: 0, bottomElev: -100,
        }), "倾角越界");
        expectReject(() => tp.createMineTurnout({
            origin: pnt(0, 0, 0), axis: AXIS_X(), gauge: 0.9, frogNo: 99, length: 30,
        }), "辙叉号越界");
        expectReject(() => tp.createMineJunction({
            center: pnt(0, 0, 0), mainAxis: AXIS_X(), branchAngleDeg: 200,
            section: tp.MineSection.RECT, width: 4, height: 3, mainLength: 40, branchLength: 30,
        }), "交岔角越界");
        expectReject(() => tp.createMinePipeFitting({
            center: pnt(0, 0, 0), mainAxis: AXIS_X(), branchAngleDeg: 90,
            mainLength: 4, branchLength: 2, diameter: 5,
        }), "管径越界");
        expectReject(() => tp.createMineFence({
            width: 2, height: 2, postWidth: 1.5, barWidth: 0.08,
            thickness: 0.05, bars: 12, center: pnt(0, 0, 0), axis: AXIS_X(),
        }), "立柱宽于跨");
    });
});
