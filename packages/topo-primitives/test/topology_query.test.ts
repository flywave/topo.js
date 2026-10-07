// T1.2/T1.3/T1.5 Embind 绑定 parity 测试 — 与 go-topo/topology_query_test.go 同口径:
// box 10×20×30 (boxCentered: x -5..5, y -10..10, z -15..15)。
// 新增 ShapeOps 邻接查询 / chamferAngle / exportStepUnit / Workplane.text。
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { CQ } from "../lib/index";
import { captureEdgeRef, resolveEdgeRef, stableEdges } from "../lib/topo/edge_ref";
import { checkShape, getTopo } from "./helpers/topo";

const here = dirname(fileURLToPath(import.meta.url));

let tp: any;
let box: any;

// extract_entities 不去重 (TopExp_Explorer 语义: 共享边按面出现次数重复),
// 用 bbox 键去重 (12 条边 bbox 互异)
function dedupeByBBox(edges: any[]): any[] {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const e of edges) {
        const bb = e.bbox();
        const key = [bb.xMin(), bb.yMin(), bb.zMin(), bb.xMax(), bb.yMax(), bb.zMax()]
            .map((d: number) => d.toFixed(6))
            .join(",");
        if (!seen.has(key)) {
            seen.add(key);
            out.push(e);
        }
    }
    return out;
}

function pnt3(x: number, y: number, z: number): any {
    return new tp.gp_Pnt_3(x, y, z);
}

function edge(p1: any, p2: any): any {
    return tp.Edge.makeEdgeFromTwoPoint(p1, p2);
}

function edgeAlongXAt(y0: number, z0: number): any {
    for (const e of dedupeByBBox(box.edges())) {
        const bb = e.bbox();
        if (Math.abs(bb.yMin() - y0) < 1e-6 && Math.abs(bb.yMax() - y0) < 1e-6 &&
            Math.abs(bb.zMin() - z0) < 1e-6 && Math.abs(bb.zMax() - z0) < 1e-6) {
            return e;
        }
    }
    throw new Error(`no edge along x at y=${y0} z=${z0}`);
}

beforeAll(async () => {
    tp = await getTopo();
    // edge_ref.ts 经全局 ShapeOps 访问 (vitest 每文件独立注册表, 无条件覆盖)
    (globalThis as any).ShapeOps = tp.ShapeOps;
    const wp = new CQ.CQWorkplane(tp);
    box = wp.boxCentered(10, 20, 30).val();
});

describe("ShapeOps adjacency queries (T1.2, parity with topology_query_test.go)", () => {
    it("getEdgeFaces: box 的每条边恰有 2 个相邻面", () => {
        const edges = dedupeByBBox(box.edges());
        expect(edges.length).toBe(12);
        for (const e of edges) {
            const faces = tp.ShapeOps.getEdgeFaces(box, e);
            expect(faces.length).toBe(2);
        }
    });

    it("getCommonEdge: 每个面与其余 4 个面共享边、1 个面相对", () => {
        const faces = box.faces();
        expect(faces.length).toBe(6);
        for (let i = 0; i < faces.length; i++) {
            let shared = 0;
            for (let j = 0; j < faces.length; j++) {
                if (i === j) continue;
                if (tp.ShapeOps.getCommonEdge(faces[i], faces[j])) shared++;
            }
            expect(shared).toBe(4);
        }
    });

    it("faceIsPlanar: box 全平面; 圆柱 2 平面盖 + 1 曲面侧壁", () => {
        for (const f of box.faces()) {
            expect(tp.ShapeOps.faceIsPlanar(f)).toBe(true);
        }
        const cyl = tp.Solid.makeSolidFromCylinderAngle(5, 20);
        const planar = cyl.faces().filter((f: any) => tp.ShapeOps.faceIsPlanar(f));
        expect(planar.length).toBe(2);
    });

    it("getOppositeEdge: 底边沿 +z 找到对面边; -z 方向找不到", () => {
        const bottom = edgeAlongXAt(10, -15);
        const opposite = tp.ShapeOps.getOppositeEdge(box, bottom, 1e-6, [0, 0, 1]);
        expect(opposite).toBeDefined();
        const bb = opposite.bbox();
        expect(Math.abs(bb.zMin() - 15)).toBeLessThan(1e-6);
        expect(Math.abs(bb.yMin() - 10)).toBeLessThan(1e-6);
        expect(tp.ShapeOps.getOppositeEdge(box, bottom, 1e-6, [0, 0, -1])).toBeUndefined();
    });

    it("getNext/PrevAdjacentEdge: 与 seed 不同且存在", () => {
        const seed = edgeAlongXAt(10, 15);
        const next = tp.ShapeOps.getNextAdjacentEdge(box, seed);
        const prev = tp.ShapeOps.getPrevAdjacentEdge(box, seed);
        expect(next).toBeDefined();
        expect(prev).toBeDefined();
        expect(next.equals(seed)).toBe(false);
        expect(prev.equals(seed)).toBe(false);
    });

    it("closestEdge: 命中的边贴着 (5,10,15) 角点", () => {
        const e = tp.ShapeOps.closestEdge(box, [5.5, 10.5, 15.5]);
        expect(e).toBeDefined();
        const bb = e.bbox();
        let touches = 0;
        if (Math.abs(bb.xMax() - 5) < 1e-6) touches++;
        if (Math.abs(bb.yMax() - 10) < 1e-6) touches++;
        if (Math.abs(bb.zMax() - 15) < 1e-6) touches++;
        expect(touches).toBeGreaterThanOrEqual(2);
    });

    it("tangentEdgeChain: 共线三段 wire 链=3; 矩形 wire 链=1", () => {
        const a = (x: number) => pnt3(x, 0, 0);
        const e1 = edge(a(0), a(5));
        const e2 = edge(a(5), a(10));
        const e3 = edge(a(10), a(15));
        const wire = tp.Wire.makeWireFromEdges([e1, e2, e3]);
        const chain = tp.ShapeOps.tangentEdgeChain(wire, e2);
        expect(chain.length).toBe(3);

        const b = [
            pnt3(0, 0, 0), pnt3(10, 0, 0), pnt3(10, 10, 0), pnt3(0, 10, 0),
        ];
        const r1 = edge(b[0], b[1]);
        const rect = tp.Wire.makeWireFromEdges([r1, edge(b[1], b[2]), edge(b[2], b[3]), edge(b[3], b[0])]);
        expect(tp.ShapeOps.tangentEdgeChain(rect, r1).length).toBe(1);
    });
});

describe("ShapeOps.chamferAngle (T1.3)", () => {
    it("45° 倒角移除材料且结果有效", () => {
        const seed = edgeAlongXAt(10, 15);
        // chamfer 返回基类 Shape, 体积经 solids() 取
        const baseVol = box.solids()[0].volume();
        const ch = tp.ShapeOps.chamferAngle(box, [seed], 2, 45);
        expect(ch).toBeDefined();
        expect(ch.isValid()).toBe(true);
        expect(ch.solids()[0].volume()).toBeLessThan(baseVol);
    });

    it("同一基准面 30° 与 60° 体积不同 (角度参与几何)", () => {
        const seed = edgeAlongXAt(10, 15);
        const v30 = tp.ShapeOps.chamferAngle(box, [seed], 2, 30).solids()[0].volume();
        const v60 = tp.ShapeOps.chamferAngle(box, [seed], 2, 60).solids()[0].volume();
        expect(Math.abs(v30 - v60)).toBeGreaterThan(1e-6);
    });
});

describe("Shape.exportStepUnit (T1.5)", () => {
    it("MM/INCH 写出且 INCH 声明进文件; 非法单位被拒", () => {
        const mmPath = "/tmp/topo_t12_unit_mm.step";
        const inchPath = "/tmp/topo_t12_unit_inch.step";
        expect(box.exportStepUnit(mmPath, true, 0, "MM")).toBe(true);
        expect(box.exportStepUnit(inchPath, true, 0, "INCH")).toBe(true);
        const mm = new TextDecoder().decode(tp.FS.readFile(mmPath));
        expect(mm).toContain("DATA;");
        const inch = new TextDecoder().decode(tp.FS.readFile(inchPath));
        expect(inch).toContain("INCH");
        expect(box.exportStepUnit("/tmp/topo_t12_bad.step", true, 0, "PARSEC")).toBe(false);
    });
});

describe("StableEdgeRef (T1.6)", () => {
    it("同参数重建后 byFaces 仍解析到同一条边", () => {
        const bottom = edgeAlongXAt(10, -15);
        const edges0 = stableEdges(box);
        const idx = edges0.findIndex((e) => e === bottom);
        const ref = captureEdgeRef(box, bottom, idx);
        expect(ref.byFaces).toBeDefined();
        expect(ref.byFaces!.length).toBe(2);

        // 重建 (同参数, 新实例)
        const wp2 = new CQ.CQWorkplane(tp);
        const box2 = wp2.boxCentered(10, 20, 30).val();
        const r = resolveEdgeRef(box2, ref);
        expect(r.ok).toBe(true);
        expect(r.resolvedBy).toBe("byFaces");
        const bb = r.edge!.bbox();
        expect(Math.abs(bb.yMin() - 10)).toBeLessThan(1e-6);
        expect(Math.abs(bb.zMin() + 15)).toBeLessThan(1e-6);
    });

    it("参数变化 (高度 30→40) 后: byFaces 允许失配, 但必须明说退化, 不许静默错配", () => {
        // v1 边界: 面以 bbox 命名, 参数变化会移动邻接面 (底面 z、侧面 z 范围),
        // byFaces 自然失配 — 契约是不静默: 要么命中, 要么 resolvedBy=byIndex 且
        // 带 reason (选择器语义命名 ">Z" 是 v2 方向, 见 roadmap)
        const bottom = edgeAlongXAt(10, -15);
        const ref = captureEdgeRef(box, bottom, 0);
        const wp2 = new CQ.CQWorkplane(tp);
        const taller = wp2.boxCentered(10, 20, 40).val();
        const r = resolveEdgeRef(taller, ref);
        if (r.resolvedBy === "byIndex") {
            expect(r.reason).toBeTruthy();
        } else {
            expect(r.resolvedBy).toBe("byFaces");
        }
    });

    it("换成完全不同的形状: 不静默错配, 给出原因", () => {
        const bottom = edgeAlongXAt(10, -15);
        const ref = captureEdgeRef(box, bottom, 3);
        const cyl = tp.Solid.makeSolidFromCylinderAngle(5, 20);
        const r = resolveEdgeRef(cyl, ref);
        // 圆柱没有 y=10 的平面 → byFaces 必不命中; 即便索引兜底也要明说退化
        if (r.ok) {
            expect(r.resolvedBy).toBe("byIndex");
            expect(r.reason).toBeTruthy();
        } else {
            expect(r.reason).toBeTruthy();
        }
    });
});

// Fixture-gated: the font comes from the ref/ modeling-app checkout, which
// this workspace may not have. Skip (not fail) without it.
const fontReady = existsSync(
    join(here, "../../..", "ref/modeling-app-main/public/fonts/source-code-pro/TTF/SourceCodePro-Regular.ttf"),
);
describe.skipIf(!fontReady)("Workplane.text (T1.1)", () => {
    it("宿主提供字体路径时建成可渲染 compound", () => {
        // WASM 无系统字体: 经 MEMFS 注入 ttf (Read 方法在 WasmMemory 的 /tmp 上 fopen)
        const fontBytes = readFileSync(
            join(here, "../../..", "ref/modeling-app-main/public/fonts/source-code-pro/TTF/SourceCodePro-Regular.ttf"),
        );
        tp.FS.writeFile("/tmp/SourceCodePro-Regular.ttf", new Uint8Array(fontBytes));
        const wp = new CQ.CQWorkplane(tp);
        const textWp = wp.text("HELLO", 10, 1, {
            font: "SourceCodePro",
            fontPath: "/tmp/SourceCodePro-Regular.ttf",
        });
        const shape = textWp.val();
        const r = checkShape(shape);
        expect(r.ok, `text shape 无效: ${r.reason ?? ""}`).toBe(true);
    });
});
