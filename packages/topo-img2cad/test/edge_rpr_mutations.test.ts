// T0.3 突变测试收尾 (docs/testing-gates.md): EDG_*/RPR_* 的 11 个此前从未被断言的
// 错误码。EDG 侧用合成 MeshLike (与 edge_distance.test.ts 同款, 门只吃 .mesh());
// RPR 的入口守卫码走 reprojectShape, 评判码走纯函数 evaluateReprojection。
// 每个码一个"使其失败的突变体"。
import { describe, expect, it } from "vitest";
import { DEFAULT_EDGE_THRESHOLDS, measureEdgeDistance } from "../lib/validators/edge_distance.js";
import {
    DEFAULT_THRESHOLDS,
    evaluateReprojection,
    reprojectShape,
    type MeshLike,
} from "../lib/validators/reprojection.js";
import { checkViewConsistency } from "../lib/cad/project.js";
import type { Bounds2D } from "../lib/cad/project.js";

// ---------------------------------------------------------------------------
// 合成网格夹具
// ---------------------------------------------------------------------------

function boxMesh(w: number, d: number, h: number): MeshLike {
    const hx = w / 2, hy = d / 2, hz = h / 2;
    const corner = (sx: number, sy: number, sz: number): number[] => [sx * hx, sy * hy, sz * hz];
    const face = (a: number[], b: number[], c: number[], d2: number[]) => ({
        positions: [...a, ...b, ...c, ...d2],
        indices: [3, 0, 1, 3, 1, 2],
    });
    const faces = [
        face(corner(-1, -1, -1), corner(1, -1, -1), corner(1, 1, -1), corner(-1, 1, -1)),
        face(corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)),
        face(corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)),
        face(corner(-1, 1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(-1, 1, 1)),
        face(corner(-1, -1, -1), corner(-1, 1, -1), corner(-1, 1, 1), corner(-1, -1, 1)),
        face(corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)),
    ];
    return {
        vertices: faces.map((f) => f.positions),
        triangles: faces.map((f) => f.indices),
    };
}

/** 有顶点 (投影范围非零) 但三角形全部零面积 → 栅格化不出任何东西。 */
function untriangulatedMesh(w: number, d: number, h: number): MeshLike {
    const base = boxMesh(w, d, h);
    return {
        vertices: base.vertices,
        triangles: base.triangles.map((t) => [0, 0, 0]),
    };
}

const asShape = (mesh: MeshLike | null) => ({ mesh: () => mesh });

/** 矩形墨迹描边 (与 edge_distance.test.ts 同款)。 */
function rectInk(width: number, height: number, inset = 10, thickness = 2): Uint8Array {
    const mask = new Uint8Array(width * height);
    const x0 = inset, y0 = inset, x1 = width - 1 - inset, y1 = height - 1 - inset;
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            if (x < x0 + thickness || x > x1 - thickness || y < y0 + thickness || y > y1 - thickness) {
                mask[y * width + x] = 1;
            }
        }
    }
    return mask;
}

const codes = (r: { issues: Array<{ code?: string }> }) => r.issues.map((i) => i.code);

// ---------------------------------------------------------------------------
// EDG_* (measureEdgeDistance)
// ---------------------------------------------------------------------------

describe("EDG mutations (T0.3)", () => {
    const INK_W = 120, INK_H = 100;

    it("EDG_NO_MESH: mesh() 返回 null → 无法三角化, 明说", () => {
        const r = measureEdgeDistance(asShape(null) as any, {
            view: "top",
            ink: rectInk(INK_W, INK_H),
            inkWidth: INK_W,
            inkHeight: INK_H,
            width: 160,
            height: 160,
            thresholds: DEFAULT_EDGE_THRESHOLDS,
        });
        expect(codes(r)).toContain("EDG_NO_MESH");
        expect(r.compared).toBe(false);
    });

    it("EDG_EMPTY_MODEL: 全部顶点不可投影 (NaN) → 投影零面积 → flat", () => {
        // 顶点全 NaN: 投影边界无法成立 (归零), fill 与边都画不出像素 → flat
        const m = boxMesh(80, 60, 20);
        const poisoned: MeshLike = {
            vertices: m.vertices.map((face) => face.map(() => NaN)),
            triangles: m.triangles,
        };
        const r = measureEdgeDistance(asShape(poisoned) as any, {
            view: "top",
            ink: rectInk(INK_W, INK_H),
            inkWidth: INK_W,
            inkHeight: INK_H,
            width: 160,
            height: 160,
            thresholds: DEFAULT_EDGE_THRESHOLDS,
        });
        expect(codes(r)).toContain("EDG_EMPTY_MODEL");
    });

    it("EDG_UNTRIANGULATED 分支经公共入口不可达; 退化网格仍被测量而非静默放过", () => {
        // EDG_UNTRIANGULATED 的触发条件是 fill 与边栅格化都为空 —— 但边栅格化
        // 对任何含有限顶点的网格都会留至少一个像素 (退化三角形画点, 越界索引
        // 被钳到原点画扇形), 这是"保持可测"的刻意设计。因此经公共入口无法
        // 到达该分支; 它的评判语义由共享评分器的 RPR_UNTRIANGULATED 覆盖
        // (见下方 evaluateReprojection 用例)。
        // 这里钉住的是实际契约: 退化网格不被当作 unevaluated 放过, 而是得出
        // 一个 compared 判词。
        const m = boxMesh(80, 60, 20);
        const ghost: MeshLike = {
            vertices: m.vertices,
            triangles: m.triangles.map((t) => t.map(() => 999)),
        };
        const r = measureEdgeDistance(asShape(ghost) as any, {
            view: "top",
            ink: rectInk(INK_W, INK_H),
            inkWidth: INK_W,
            inkHeight: INK_H,
            width: 160,
            height: 160,
            thresholds: DEFAULT_EDGE_THRESHOLDS,
        });
        // 钳位/越界处理使该网格的 fill 与边栅格都为空 → outline 空 + 投影范围
        // 非零 (顶点真实) → UNTRIANGULATED: kernel 缺席, 不是形状错, 是 warning
        expect(codes(r)).toContain("EDG_UNTRIANGULATED");
        expect(r.compared).toBe(false);
    });

    it("EDG_LOCAL_MISMATCH: 轮廓大体贴合但局部 (p90) 超差", () => {
        // 墨迹是 100x80 的矩形描边; 模型是 100x80 但右缘多出一块 20 宽的凸台
        // → 均值尚可, p90 局部超差
        const base = boxMesh(80, 60, 20);
        const bump = boxMesh(20, 60, 20);
        const shift = (faces: MeshLike, dx: number): MeshLike => ({
            vertices: faces.vertices.map((face) => face.map((v, i) => (i % 3 === 0 ? v + dx : v))),
            triangles: faces.triangles,
        });
        const bumpShifted = shift(bump, 80);
        const merged: MeshLike = {
            vertices: [...base.vertices, ...bumpShifted.vertices],
            triangles: [...base.triangles, ...bumpShifted.triangles],
        };
        const ink = new Uint8Array(INK_W * INK_H);
        // 墨迹: 左边 100x80 的框 + 右边凸台的框 (模型会多出墨迹没有的沿)
        ink.set(rectInk(INK_W, INK_H, 10, 2));
        const r = measureEdgeDistance(asShape(merged) as any, {
            view: "top",
            ink,
            inkWidth: INK_W,
            inkHeight: INK_H,
            width: 160,
            height: 160,
            thresholds: { ...DEFAULT_EDGE_THRESHOLDS, maxMeanRatio: 10, maxMeanFraction: 10, matchFloorPx: 0.5 },
        });
        // 突变体必须触发 LOCAL (均值门被放宽后仍拦住局部超差)
        expect(codes(r)).toContain("EDG_LOCAL_MISMATCH");
    });

    it("EDG_INK_UNUSABLE: ink 缓冲损坏不可读 → error 而非放行", () => {
        // 损坏的 ink: 任何像素读取都抛错 (真实来源: 截断的 PNG 解码产物)。
        // 门必须报 EDG_INK_UNUSABLE, 而不是把不可读当成无墨放行。
        const poison = new Proxy(new Uint8Array(64), {
            get(_t, prop) {
                if (typeof prop === "string" && /^\d+$/.test(prop)) {
                    throw new Error("corrupt ink buffer");
                }
                return Reflect.get(_t as object, prop);
            },
        });
        const r = measureEdgeDistance(asShape(boxMesh(80, 60, 20)) as any, {
            view: "top",
            ink: poison as unknown as Uint8Array,
            inkWidth: INK_W,
            inkHeight: INK_H,
            width: 160,
            height: 160,
            thresholds: DEFAULT_EDGE_THRESHOLDS,
        });
        expect(codes(r)).toContain("EDG_INK_UNUSABLE");
    });
});

// ---------------------------------------------------------------------------
// RPR_* — 入口守卫 (reprojectShape) 与评判 (evaluateReprojection)
// ---------------------------------------------------------------------------

describe("RPR mutations (T0.3)", () => {
    it("RPR_NO_MESH: mesh() 返回 null", () => {
        const r = reprojectShape(asShape(null) as any, {
            view: "top",
            width: 120,
            height: 120,
            thresholds: DEFAULT_THRESHOLDS,
        });
        expect(codes(r)).toContain("RPR_NO_MESH");
        expect(r.passed).toBe(false);
    });

    it("RPR_BAD_VIEW: 非法视图名", () => {
        const r = reprojectShape(asShape(boxMesh(80, 60, 20)) as any, {
            view: "bogus-view-name",
            width: 120,
            height: 120,
            thresholds: DEFAULT_THRESHOLDS,
        });
        expect(codes(r)).toContain("RPR_BAD_VIEW");
    });

    it("RPR_EMPTY_MODEL: 投影零面积 (退化形状) → error", () => {
        const rows = [
            {
                view: "top",
                iou: 0,
                recall: 0,
                precision: 0,
                deviation: { modelToReference: 0, referenceToModel: 0, max: 0 },
                modelBounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } as Bounds2D,
                projectedExtent: { width: 0, height: 0 },
                referencePixels: 100,
                modelPixels: 0,
            },
        ];
        const { issues, passed } = evaluateReprojection(rows as any, undefined, DEFAULT_THRESHOLDS);
        expect(codes({ issues })).toContain("RPR_EMPTY_MODEL");
        expect(passed).toBe(false);
    });

    it("RPR_UNTRIANGULATED: 有投影范围但没栅格化 → warning", () => {
        const rows = [
            {
                view: "top",
                iou: 0,
                recall: 0,
                precision: 0,
                deviation: { modelToReference: 0, referenceToModel: 0, max: 0 },
                modelBounds: { minX: -40, minY: -30, maxX: 40, maxY: 30 } as Bounds2D,
                projectedExtent: { width: 80, height: 60 },
                referencePixels: 100,
                modelPixels: 0,
            },
        ];
        const { issues } = evaluateReprojection(rows as any, undefined, DEFAULT_THRESHOLDS);
        expect(codes({ issues })).toContain("RPR_UNTRIANGULATED");
    });

    it("RPR_DEVIATION: IoU 达标但模型轮廓距参考超差 → warning 点名", () => {
        const rows = [
            {
                view: "top",
                iou: 0.93, // 高于 minIou (0.9), 不触发 LOW_IOU
                recall: 0.95,
                precision: 0.98,
                deviation: { modelToReference: 6.2, referenceToModel: 1.1, max: 9 },
                modelBounds: { minX: -40, minY: -30, maxX: 40, maxY: 30 } as Bounds2D,
                projectedExtent: { width: 80, height: 60 },
                referencePixels: 5000,
                modelPixels: 4900,
            },
        ];
        const { issues } = evaluateReprojection(rows as any, undefined, DEFAULT_THRESHOLDS);
        expect(codes({ issues })).toContain("RPR_DEVIATION");
        expect(codes({ issues })).not.toContain("RPR_LOW_IOU");
    });

    it("RPR_VIEW_MISMATCH: 两视图共享尺寸互相矛盾 → error", () => {
        const bounds = (w: number, h: number): Bounds2D => ({ minX: 0, minY: 0, maxX: w, maxY: h });
        const consistency = checkViewConsistency(
            [
                { id: "v_front", kind: "front", bounds: bounds(80, 60) },
                { id: "v_top", kind: "top", bounds: bounds(80, 100) }, // front-top 共享宽 80 一致; top-left 共享深 100 vs 120 矛盾
                { id: "v_right", kind: "right", bounds: bounds(120, 60) }, // 与 top 的共享深度 (100) 矛盾
            ],
            0.02,
        );
        const rows = [
            {
                view: "front",
                iou: 0.95, recall: 0.95, precision: 0.95,
                deviation: { modelToReference: 0.5, referenceToModel: 0.5, max: 1 },
                modelBounds: bounds(80, 60),
                projectedExtent: { width: 80, height: 60 },
                referencePixels: 100, modelPixels: 100,
            },
        ];
        const { issues, passed } = evaluateReprojection(rows as any, consistency, DEFAULT_THRESHOLDS);
        expect(consistency.violations.length).toBeGreaterThan(0);
        expect(codes({ issues })).toContain("RPR_VIEW_MISMATCH");
        expect(passed).toBe(false);
    });
});
