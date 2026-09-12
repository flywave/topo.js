/**
 * CadQuery official examples — 1:1 port from go-topo workplane_examples_test.go
 * Each test builds a shape via CQWorkplane shim, then compares bbox against
 * golden values extracted from the Go side.
 *
 * Reference: /Users/xuning/Work/go-topo/workplane_examples_test.go
 * Golden:    test/cq/goldens.json (exported from Go STEP metadata)
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CQWorkplane, pnt, vec, gpVec } from "../lib/cq/index";

const here = dirname(fileURLToPath(import.meta.url));

// --- WASM singleton --------------------------------------------------------
let tp: any;
beforeAll(async () => {
    const wasmDir = join(here, "..", "..", "topo-wasm", "src");
    const { default: initTopo } = await import(
        /* @vite-ignore */ join(wasmDir, "topo.full.js")
    );
    const wasmBinary = readFileSync(join(wasmDir, "topo.full.wasm"));
    tp = await initTopo({ wasmBinary });
    // C++ add() binding does instanceof(emval_global("Workplane")) which needs
    // Workplane exposed as a global JS variable.
    (globalThis as any).Workplane = tp.Workplane;
});

// --- Golden data -----------------------------------------------------------
const goldens: Record<string, { bbox: number[] }> = JSON.parse(
    readFileSync(join(here, "cq", "goldens.json"), "utf-8")
);

// --- Helpers ---------------------------------------------------------------
const TOL = 1e-6;

function expectBBox接近(actual: any, goldenKey: string) {
    const sh = actual.value();
    expect(sh).toBeDefined();
    expect(sh.isNull()).toBe(false);
    const bb = sh.bbox();
    const g = goldens[goldenKey].bbox;
    expect(bb.xMin()).toBeCloseTo(g[0], 6);
    expect(bb.yMin()).toBeCloseTo(g[1], 6);
    expect(bb.zMin()).toBeCloseTo(g[2], 6);
    expect(bb.xMax()).toBeCloseTo(g[3], 6);
    expect(bb.yMax()).toBeCloseTo(g[4], 6);
    expect(bb.zMax()).toBeCloseTo(g[5], 6);
}

/**
 * go-topo C API safe_call 语义: C++ 操作抛异常时返回调用前的 workplane。
 * Embind 会 re-throw, 这里在测试层显式复现 Go 的吞异常行为, 使 golden 对账成立。
 */
function safe<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
}

/**
 * 复现 go-topo safe_call 的粘性错误 (workplane.hh: 异常后 ctx 置错误标志,
 * 后续所有 safe_call 包装的 op 全部短路为 no-op 返回自身, 链冻结在抛出点的前置状态;
 * topo.js 的 Embind 绑定不经 safe_call, 异常直接抛出, 需显式复现该语义)。
 * 注意粒度: 每个 then 对应 Go 的一次 C API 调用, edges() 成功而 fillet() 抛出时
 * Go 保留的是 edges 选中态, 因此两者必须分成独立的 then。
 */
class Chain {
    private broken = false;
    private constructor(private v: any) {}
    static of(v: any): Chain { return new Chain(v); }
    then(fn: (v: any) => any): Chain {
        if (!this.broken) {
            try { this.v = fn(this.v); } catch { this.broken = true; }
        }
        return this;
    }
    value(): any { return this.v; }
}

// ============================================================================
// Tests
// ============================================================================
describe("CQ official examples (33 Go → TS, golden bbox)", () => {

    // --- 01 rectangularPlate ------------------------------------------------
    it("example_01_rectangularPlate", () => {
        const wp = new CQWorkplane(tp);
        const r = wp.boxCentered(2.0, 2.0, 0.5);
        expectBBox接近(r, "example_01_rectangular_plate");
    });

    // --- 02 plateWithHole --------------------------------------------------
    it("example_02_plateWithHole", () => {
        const length = 80.0, height = 60.0, thickness = 10.0, centerHoleDia = 22.0;
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(length, height, thickness);
        r = r.faces(">Z", "").workplane(0, false, 0).holeThrough(centerHoleDia);
        expectBBox接近(r, "example_02_plate_with_hole");
    });

    // --- 03 extrudePrism ---------------------------------------------------
    it("example_03_extrudePrism", () => {
        const wp = new CQWorkplane(tp);
        const r = wp.circleCentered(2.0).rectCentered(0.5, 0.75).extrudeSimple(0.5);
        expectBBox接近(r, "example_03_extrude_prism");
    });

    // --- 04 lineAndArc -----------------------------------------------------
    it("example_04_lineAndArc", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.lineTo(2.0, 0, false);
        r = r.lineTo(2.0, 1.0, false);
        r = r.threePointArc(pnt(tp, 1.0, 1.5, 0), pnt(tp, 0.0, 1.0, 0), false);
        r = r.close().extrudeSimple(0.25);
        expectBBox接近(r, "example_04_line_and_arc");
    });

    // --- 05 moveWorkPoint --------------------------------------------------
    it("example_05_moveWorkPoint", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.circleCentered(3.0);
        r = r.center(1.5, 0.0).rectCentered(0.5, 0.5);
        r = r.center(-1.5, 1.5).circleCentered(0.25);
        r = r.extrudeSimple(0.25);
        expectBBox接近(r, "example_05_move_work_point");
    });

    // --- 06 pointList ------------------------------------------------------
    it("example_06_pointList", () => {
        const wp = new CQWorkplane(tp);
        const pts = [
            vec(tp, 1.5, 0, 0),
            vec(tp, 0, 1.5, 0),
            vec(tp, -1.5, 0, 0),
            vec(tp, 0, -1.5, 0),
        ];
        let r = wp.circleCentered(2.0).pushPointsWithVector(pts).circleCentered(0.25);
        r = r.extrudeSimple(0.125);
        expectBBox接近(r, "example_06_point_list");
    });

    // --- 07 polygon --------------------------------------------------------
    it("example_07_polygon", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(3.0, 4.0, 0.25);
        const pts = [
            vec(tp, 0, 0.75, 0),
            vec(tp, 0, -0.75, 0),
        ];
        r = r.faces(">Z", "").workplane(0, false, 0).pushPointsWithVector(pts).polygonSimple(6, 1.0);
        // go-topo safe_call: C++ cutThruAll throws "DPrism failed: TopoDS::Face", Go 吞掉返回原 workplane, golden 为退化结果
        r = safe(() => r.cutThruAll(0, true), r);
        expectBBox接近(r, "example_07_polygon");
    });

    // --- 08 polyline -------------------------------------------------------
    it("example_08_polyline", () => {
        const L = 100.0, H = 20.0, W = 20.0, thick = 1.0;
        const pts = [
            pnt(tp, 0, H / 2.0, 0),
            pnt(tp, W / 2.0, H / 2.0, 0),
            pnt(tp, W / 2.0, H / 2.0 - thick, 0),
            pnt(tp, thick / 2.0, H / 2.0 - thick, 0),
            pnt(tp, thick / 2.0, thick - H / 2.0, 0),
            pnt(tp, W / 2.0, thick - H / 2.0, 0),
            pnt(tp, W / 2.0, H / -2.0, 0),
            pnt(tp, 0, H / -2.0, 0),
        ];
        const wp = new CQWorkplane(tp);
        const r = wp.polyline(pts, false, false).mirrorY().extrudeSimple(L);
        expectBBox接近(r, "example_08_polyline");
    });

    // --- 09 splineEdge -----------------------------------------------------
    it("example_09_splineEdge", () => {
        const sPnts = [
            pnt(tp, 2.75, 1.5, 0),
            pnt(tp, 2.5, 1.75, 0),
            pnt(tp, 2.0, 1.5, 0),
            pnt(tp, 1.5, 1.0, 0),
            pnt(tp, 1.0, 1.25, 0),
            pnt(tp, 0.5, 1.0, 0),
            pnt(tp, 0, 1.0, 0),
        ];
        const wp = new CQWorkplane(tp);
        let r = wp.lineTo(3.0, 0, false).lineTo(3.0, 1.0, false);
        r = r.spline(sPnts, false, undefined, false, 0.01, false, true, false).close();
        r = r.extrudeSimple(0.5);
        expectBBox接近(r, "example_09_spline_edge");
    });

    // --- 10 mirrorGeometry2D -----------------------------------------------
    it("example_10_mirrorGeometry2D", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.hline(1.0, false);
        r = r.vline(0.5, false).hline(-0.25, false).vline(-0.25, false).hlineTo(0.0, false);
        r = r.mirrorY().extrudeSimple(0.25);
        expectBBox接近(r, "example_10_mirror_geometry_2d");
    });

    // --- 11 mirror3D -------------------------------------------------------
    it("example_11_mirror3D", () => {
        const wp = new CQWorkplane(tp);
        let r0 = wp.moveTo(10, 0);
        r0 = r0.lineTo(5, 0, false);
        r0 = r0.threePointArc(pnt(tp, 3.9393, 0.4393, 0), pnt(tp, 3.5, 1.5, 0), false);
        r0 = r0.threePointArc(pnt(tp, 3.0607, 2.5607, 0), pnt(tp, 2, 3, 0), false);
        r0 = r0.lineTo(1.5, 3, false);
        r0 = r0.threePointArc(pnt(tp, 0.4393, 3.4393, 0), pnt(tp, 0, 4.5, 0), false);
        r0 = r0.lineTo(0, 13.5, false);
        r0 = r0.threePointArc(pnt(tp, 0.4393, 14.5607, 0), pnt(tp, 1.5, 15, 0), false);
        r0 = r0.lineTo(28, 15, false);
        r0 = r0.lineTo(28, 13.5, false);
        r0 = r0.lineTo(24, 13.5, false);
        r0 = r0.lineTo(24, 11.5, false);
        r0 = r0.lineTo(27, 11.5, false);
        r0 = r0.lineTo(27, 10, false);
        r0 = r0.lineTo(22, 10, false);
        r0 = r0.lineTo(22, 13.2, false);
        r0 = r0.lineTo(14.5, 13.2, false);
        r0 = r0.lineTo(14.5, 10, false);
        r0 = r0.lineTo(12.5, 10, false);
        r0 = r0.lineTo(12.5, 13.2, false);
        r0 = r0.lineTo(5.5, 13.2, false);
        r0 = r0.lineTo(5.5, 2, false);
        r0 = r0.threePointArc(pnt(tp, 5.793, 1.293, 0), pnt(tp, 6.5, 1, 0), false);
        r0 = r0.lineTo(10, 1, false).close();
        let result = r0.extrudeSimple(100);

        // Compute bbox center to recenter the shape
        const sh = result.value();
        const bb = sh.bbox();
        const cx = (bb.xMin() + bb.xMax()) / 2;
        const cy = (bb.yMin() + bb.yMax()) / 2;
        const cz = (bb.zMin() + bb.zMax()) / 2;

        result = result.translate(gpVec(tp, -cx, -cy, -cz));
        result = result.rotate(pnt(tp, 0, 0, 0), pnt(tp, 1, 0, 0), 90);

        const mirXYNeg = result.mirror("XY", pnt(tp, 0, 0, -30));
        const mirXYPos = result.mirror("XY", pnt(tp, 0, 0, 30));
        const mirZYNeg = result.mirror("ZY", pnt(tp, -30, 0, 0));
        const mirZYPos = result.mirror("ZY", pnt(tp, 30, 0, 0));

        result = result.add(mirXYNeg).add(mirXYPos).add(mirZYNeg).add(mirZYPos);
        expectBBox接近(result, "example_11_mirror_3d");
    });

    // --- 12 mirrorByFace ---------------------------------------------------
    it("example_12_mirrorByFace", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.line(0, 1, false).line(1, 0, false).line(0, -0.5, false).close().extrudeSimple(1);
        r = r.mirrorWithName("XY", pnt(tp, 1, 0, 0), true);
        expectBBox接近(r, "example_12_mirror_by_face");
    });

    // --- 13 workplaneOnFace ------------------------------------------------
    it("example_13_workplaneOnFace", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(2, 3, 0.5);
        r = r.faces(">Z", "").workplane(0, false, 0).holeThrough(0.5);
        expectBBox接近(r, "example_13_workplane_on_face");
    });

    // --- 14 workplaneOnVertex ----------------------------------------------
    it("example_14_workplaneOnVertex", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(3, 2, 0.5);
        r = r.faces(">Z", "").vertices("<XY", "");
        r = r.workplane(0, false, 1).circleCentered(1.0).cutThruAll(0, true);
        expectBBox接近(r, "example_14_workplane_on_vertex");
    });

    // --- 15 offsetWorkplane ------------------------------------------------
    it("example_15_offsetWorkplane", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(3, 2, 0.5);
        r = r.faces("<X", "").workplane(0.75, false, 0).circleCentered(1.0).extrudeSimple(0.5);
        expectBBox接近(r, "example_15_offset_workplane");
    });

    // --- 16 copyWorkplane --------------------------------------------------
    it("example_16_copyWorkplane", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.circleCentered(1).extrudeSimple(10);
        const wp2 = new CQWorkplane(tp, "right", vec(tp, -5, 0, 0));
        const r2 = wp2.circleCentered(1).extrudeSimple(10);
        r = r.add(r2);
        expectBBox接近(r, "example_16_copy_workplane");
    });

    // --- 17 transformedWorkplane -------------------------------------------
    it("example_17_transformedWorkplane", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(4.0, 4.0, 0.25);
        r = r.faces(">Z", "").workplane(0, false, 0);
        r = r.transform(gpVec(tp, 60, 0, 0), gpVec(tp, 0, -1.5, 1.0));
        r = r.rectAll(1.5, 1.5, true, true).vertices("", "").holeThrough(0.25);
        expectBBox接近(r, "example_17_transformed_workplane");
    });

    // --- 18 constructionGeometry -------------------------------------------
    it("example_18_constructionGeometry", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(2, 2, 0.5);
        r = r.faces(">Z", "").workplane(0, false, 0);
        r = r.rectAll(1.5, 1.5, true, true).vertices("", "").holeThrough(0.125);
        expectBBox接近(r, "example_18_construction_geometry");
    });

    // --- 19 shell (3 sub-cases in one test) --------------------------------
    it("example_19_shell (negative / positive / face_removal)", () => {
        // 19a: shell negative
        {
            const wp = new CQWorkplane(tp);
            let r1 = wp.boxCentered(2, 2, 2);
            // go-topo safe_call: C++ shell throws "Unknown join type: " for kind="", Go 吞掉返回原 workplane
            r1 = safe(() => r1.shell(-0.1, ""), r1);
            expectBBox接近(r1, "example_19_shell_negative");
        }
        // 19b: shell positive
        {
            const wp2 = new CQWorkplane(tp);
            let r2 = wp2.boxCentered(2, 2, 2);
            r2 = safe(() => r2.shell(0.1, ""), r2);
            expectBBox接近(r2, "example_19_shell_positive");
        }
        // 19c: shell face removal — Faces("+Z","") selects the top face, then shell("") fails
        {
            const wp3 = new CQWorkplane(tp);
            let r3 = wp3.boxCentered(2, 2, 2).faces("+Z", "");
            // go-topo safe_call: shell("") throws, Go 吞掉返回选中顶面的 workplane, golden 为退化结果 (2D face at z=1)
            r3 = safe(() => r3.shell(0.1, ""), r3);
            expectBBox接近(r3, "example_19_shell_face_removal");
        }
    });

    // --- 20 loft -----------------------------------------------------------
    it("example_20_loft", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(4.0, 4.0, 0.25);
        r = r.faces(">Z", "").circleCentered(1.5);
        r = r.workplane(3.0, false, 0).rectCentered(0.75, 0.5).loftSimple();
        expectBBox接近(r, "example_20_loft");
    });

    // --- 21 extrudeToFace --------------------------------------------------
    it("example_21_extrudeToFace", () => {
        const wp = new CQWorkplane(tp, "XY", vec(tp, 20, 0, 0));
        let r = wp.circleCentered(2).revolveSimple(180);
        r = r.center(-20, 0).workplane(0, false, 0).rectCentered(20, 4).extrudeSimple(10);
        expectBBox接近(r, "example_21_extrude_to_face");
    });

    // --- 22 cboreAndCskHole ------------------------------------------------
    it("example_22_cboreAndCskHole", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(4, 2, 0.5);
        r = r.faces(">Z", "").workplane(0, false, 0);
        r = r.rectAll(3.5, 1.5, true, true).vertices("", "");
        r = r.cboreHole(0.125, 0.25, 0.125, undefined, true);
        expectBBox接近(r, "example_22_cbore_hole");
    });

    // --- 23 offset2D -------------------------------------------------------
    it("example_23_offset2D", () => {
        const wp = new CQWorkplane(tp);
        const penta = wp.polygonSimple(5, 10);

        const original = penta.extrudeSimple(0.1).translate(gpVec(tp, 0, 0, 2));
        const arc = wp.polygonSimple(5, 10).offset2D(1, 0, false).extrudeSimple(0.1).translate(gpVec(tp, 0, 0, 1));
        const intersection = wp.polygonSimple(5, 10).offset2D(1, 1, false).extrudeSimple(0.1);

        const result = original.add(intersection).add(arc);
        expectBBox接近(result, "example_23_offset_2d");
    });

    // --- 24 fillet ---------------------------------------------------------
    it("example_24_fillet", () => {
        const wp = new CQWorkplane(tp);
        const r = wp.boxCentered(3, 3, 0.5).edges("|Z", "").fillet(0.125);
        expectBBox接近(r, "example_24_fillet");
    });

    // --- 25 tag ------------------------------------------------------------
    it("example_25_tag", () => {
        // NOTE: go-topo 侧已知偏差, golden 复现其现状 (val() 语义=栈首, golden 只含两个挤出圆柱)
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(10, 10, 10).faces(">Z", "").workplane(0, false, 0);
        r = r.center(-3, 0).circleCentered(1).extrudeSimple(3);
        r = r.center(6, 0).circleCentered(1).extrudeSimple(2);
        expectBBox接近(r, "example_25_tag");
    });

    // --- 26 bearingHolder --------------------------------------------------
    it("example_26_bearingHolder", () => {
        const length = 30.0, height = 40.0, bearingDiam = 22.0, thickness = 10.0, padding = 8.0;
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(length, height, thickness);
        r = r.faces(">Z", "").workplane(0, false, 0).holeThrough(bearingDiam);
        r = r.faces(">Z", "").workplane(0, false, 0);
        r = r.rectAll(length - padding, height - padding, true, true).vertices("", "");
        r = r.cboreHole(2.4, 4.4, 2.1, undefined, true);
        expectBBox接近(r, "example_26_bearing_holder");
    });

    // --- 27 split ----------------------------------------------------------
    it("example_27_split", () => {
        const wp = new CQWorkplane(tp);
        let r = wp.boxCentered(1, 1, 1);
        r = r.faces(">Z", "").workplane(0, false, 0).circleCentered(0.25).cutThruAll(0, true);
        r = r.faces(">Y", "").workplane(-0.5, false, 0).split(true, false);
        expectBBox接近(r, "example_27_split");
    });

    // --- 28 occBottle ------------------------------------------------------
    it("example_28_occBottle", () => {
        const L = 20.0, wVal = 6.0, thickVal = 3.0;
        const wp = new CQWorkplane(tp);
        let p = wp.center(-L / 2.0, 0).vline(wVal / 2.0, false);
        p = p.threePointArc(
            pnt(tp, L / 2.0, wVal / 2.0 + thickVal, 0),
            pnt(tp, L, wVal / 2.0, 0),
            false,
        );
        p = p.vline(-wVal / 2.0, false).mirrorX().extrudeSimple(30.0);
        p = p.faces(">Z", "").workplane(0, false, 1).circleCentered(3.0).extrudeSimple(2.0);
        // go-topo safe_call: C++ shell throws "Unknown join type: " for kind="", Go 吞掉返回选中顶面的 workplane
        let r = p.faces(">Z", "");
        r = safe(() => r.shell(0.3, ""), r);
        expectBBox接近(r, "example_28_occ_bottle");
    });

    // --- 29 enclosure ------------------------------------------------------
    it("example_29_enclosure", () => {
        const pOuterWidth = 100.0;
        const pOuterLength = 150.0;
        const pOuterHeight = 50.0;
        const pThickness = 3.0;
        const pSideRadius = 10.0;
        const pTopAndBottomRadius = 2.0;
        const pScrewpostInset = 12.0;
        const pScrewpostOD = 10.0;
        const pScrewpostID = 4.0;
        const pLipHeight = 1.0;

        // go-topo safe_call 粘性: Go 侧 oshell 首个 fillet 抛出 "ChFi3d_Builder:only 2 faces"
        // 后整个链冻结 (cut/画柱/挤出全部 no-op), 最终 = edges("|Z") 选中态,
        // golden 为退化竖直边线 (-50,-75,0 → -50,-75,51)。Chain 逐步复现该语义。
        const wp = new CQWorkplane(tp);
        const box = Chain.of(wp.rectCentered(pOuterWidth, pOuterLength).extrudeSimple(pOuterHeight + pLipHeight));
        if (pSideRadius > pTopAndBottomRadius) {
            box.then((o) => o.edges("|Z", ""))
               .then((o) => o.fillet(pSideRadius))
               .then((o) => o.edges("#Z", ""))
               .then((o) => o.fillet(pTopAndBottomRadius));
        } else {
            box.then((o) => o.edges("#Z", ""))
               .then((o) => o.fillet(pTopAndBottomRadius))
               .then((o) => o.edges("|Z", ""))
               .then((o) => o.fillet(pSideRadius));
        }

        const innerW = pOuterWidth - 2 * pThickness;
        const innerL = pOuterLength - 2 * pThickness;
        const innerH = pOuterHeight - 2 * pThickness;
        const wp2 = new CQWorkplane(tp);
        const ishell = Chain.of(wp2.rectCentered(innerW, innerL).extrudeSimple(innerH + pLipHeight))
            .then((i) => i.edges("|Z", ""))
            .then((i) => i.fillet(pSideRadius - pThickness))
            .value();

        const postW = pOuterWidth - 2 * pScrewpostInset;
        const postL = pOuterLength - 2 * pScrewpostInset;
        const result = box
            .then((o) => o.cut(ishell, true, 0.001))
            .then((o) => o.faces(">Z", "").workplane(-pThickness, false, 0))
            .then((o) => o.rectAll(postW, postL, true, true).vertices("", ""))
            .then((o) => o.circleCentered(pScrewpostOD / 2).circleCentered(pScrewpostID / 2))
            .then((o) => o.extrudeSimple(-(pOuterHeight + pLipHeight - pThickness)))
            .value();

        expectBBox接近(result, "example_29_enclosure");
    });

    // --- 30 legoBrick ------------------------------------------------------
    it("example_30_legoBrick", () => {
        const lbumps = 6;
        const wbumps = 2;
        const pitch = 8.0;
        const clearance = 0.1;
        const bumpDiam = 4.8;
        const bumpHeight = 1.8;
        const height = 3.2;

        const thick = (pitch - 2 * clearance - bumpDiam) / 2.0;
        const totalLength = lbumps * pitch - 2.0 * clearance;
        const totalWidth = wbumps * pitch - 2.0 * clearance;

        // go-topo safe_call 粘性: shell("") 抛出 "Unknown join type" 后整个链冻结,
        // 最终 = faces("<Z") 选中态, golden 为退化底面 (z=-1.6 平面)
        const wp = new CQWorkplane(tp);
        const s = Chain.of(wp.boxCentered(totalLength, totalWidth, height))
            .then((x) => x.faces("<Z", ""))
            .then((x) => x.shell(-thick, ""))
            .then((x) => x.faces(">Z", "").workplane(0, false, 0)
                .rarray(pitch, pitch, lbumps, wbumps, true, true)
                .circleCentered(bumpDiam / 2.0)
                .extrudeSimple(bumpHeight))
            .value();

        // NOTE: Go 侧 tmp 死代码 (算完没 union 回 s), 跳过不译; 最终结果是 s
        expectBBox接近(s, "example_30_lego_brick");
    });

    // --- 31 braille --------------------------------------------------------
    it("example_31_braille", () => {
        const dotHeight = 0.5;
        const dotDiameter = 1.3;
        const baseThickness = 1.5;
        const plateWidth = 50.0;
        const plateHeight = 30.0;

        const wp = new CQWorkplane(tp);
        let base = wp.boxCentered(plateWidth, plateHeight, baseThickness);

        const dotPositions = [
            vec(tp, -10, 5, 0), vec(tp, -10, 0, 0), vec(tp, -10, -5, 0),
            vec(tp, 10, 5, 0), vec(tp, 10, 0, 0), vec(tp, 10, -5, 0),
        ];
        base = base.faces(">Z", "").workplane(0, false, 0);
        base = base.pushPointsWithVector(dotPositions).circleCentered(dotDiameter / 2).extrudeSimple(dotHeight);
        expectBBox接近(base, "example_31_braille");
    });

    // --- 32 panelConnectors ------------------------------------------------
    it("example_32_panelConnectors", () => {
        const width = 400.0, height = 500.0, thickness = 2.0;
        const wp = new CQWorkplane(tp);
        let result = wp.boxCentered(width, height, thickness);

        const hSep = 60.0;
        for (let i = 0; i < 4; i++) {
            const yOff = 210.0 - i * hSep;
            result = result.workplane(1, false, 1).center(157, yOff).circleCentered(1.6).cutThruAll(0, true);
        }
        for (let i = 0; i < 4; i++) {
            const yOff = -30.0 - i * hSep;
            result = result.workplane(1, false, 1).center(157, yOff).circleCentered(1.6).cutThruAll(0, true);
        }
        for (let i = 0; i < 4; i++) {
            const yOff = 210.0 - i * hSep;
            result = result.workplane(1, false, 1).center(25, yOff).circleCentered(1.6).cutThruAll(0, true);
        }
        for (let i = 0; i < 4; i++) {
            const yOff = -30.0 - i * hSep;
            result = result.workplane(1, false, 1).center(25, yOff).circleCentered(1.6).cutThruAll(0, true);
        }
        expectBBox接近(result, "example_32_panel_connectors");
    });

    // --- 33 cycloidalGear --------------------------------------------------
    it("example_33_cycloidalGear", () => {
        const hypocycloid = (t: number, r1: number, r2: number): [number, number] => [
            (r1 - r2) * Math.cos(t) + r2 * Math.cos(r1 / r2 * t - t),
            (r1 - r2) * Math.sin(t) + r2 * Math.sin(-(r1 / r2 * t - t)),
        ];
        const epicycloid = (t: number, r1: number, r2: number): [number, number] => [
            (r1 + r2) * Math.cos(t) - r2 * Math.cos(r1 / r2 * t + t),
            (r1 + r2) * Math.sin(t) - r2 * Math.sin(r1 / r2 * t + t),
        ];

        const r1 = 6.0, r2 = 1.0;
        const n = 200;
        const pts: any[] = [];
        for (let i = 0; i <= n; i++) {
            const tVal = i / n * 2 * Math.PI;
            const fl = Math.floor(tVal / (2 * Math.PI) * (r1 / r2));
            let x: number, y: number;
            if (Math.floor(fl) % 2 === 0) {
                [x, y] = epicycloid(tVal, r1, r2);
            } else {
                [x, y] = hypocycloid(tVal, r1, r2);
            }
            pts.push(pnt(tp, x, y, 0));
        }

        const wp = new CQWorkplane(tp);
        let r = wp.polyline(pts, false, false).close();
        r = r.twistExtrude(15, 90, true, true);
        // go-topo safe_call: C++ cutThruAll throws "Cannot find a solid on the stack", Go 吞掉返回原 workplane, golden 为退化结果 (2D 圆)
        r = r.faces(">Z", "").workplane(0, false, 0).circleCentered(2);
        r = safe(() => r.cutThruAll(0, true), r);
        expectBBox接近(r, "example_33_cycloidal_gear");
    });
});
