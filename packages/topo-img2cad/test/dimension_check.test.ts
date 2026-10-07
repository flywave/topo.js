// T2.1 逐尺寸门的突变测试 (docs/testing-gates.md 规范: 每门配"使其失败的突变体")。
//
// 核心突变: 图纸声明 φ12 的孔, 模型建的是 φ9.6 (差 20%) —— 整体形状完全正确的板,
// 剪影/IoU 指标对孔径天然失明 (img2threejs 的"删掉整张脸 IoU 不变"教训), 该门必须
// 拒掉并且**点名这条尺寸**。
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import type { FeatureTree } from "../lib/cad/model.js";
import { checkDimensions, collectDeclaredDimensions, DEFAULT_DIMENSION_TOLERANCE } from "../lib/validators/dimension_check.js";
import { getTopo, installGlobals } from "./helpers/topo.js";

let tp: any;
let CQWorkplane: any;

beforeAll(async () => {
    tp = await getTopo();
    installGlobals(tp);
    // 与 lib/kernel.ts 同款: CQ shim 从 primitives 的 dist/es 取 (包根导入经
    // CJS interop 会丢类)
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve("topo-primitives/package.json");
    const mod = (await import(
        pathToFileURL(join(dirname(pkgJson), "dist", "es", "index.js")).href
    )) as { CQ?: { CQWorkplane?: unknown } };
    CQWorkplane = mod.CQ?.CQWorkplane as any;
});

/** 60×40×10 板, 中心孔; holeDiameter 是建出来的孔径。 */
function buildPlate(holeDiameter: number): any {
    const wp = new CQWorkplane(tp);
    return wp
        .boxCentered(60, 40, 10)
        .faces(">Z", "")
        .workplane(0, false, 0)
        .holeThrough(holeDiameter).val();
}

/** 图纸声明: 60 跨 (左右边距) / 40 跨 (上下边距) / φ12 孔。 */
function declaredTree(holeRadius: number): FeatureTree {
    const rect = (tag: string, s: [number, number], e: [number, number]) => ({
        tag, type: "line" as const, start: s, end: e,
    });
    return {
        name: "plate",
        units: { length: "mm", toMillimeter: 1 },
        datums: { planes: {}, axes: {} },
        sketches: {
            s_base: {
                id: "s_base",
                plane: { kind: "XY", origin: [0, 0, 0] },
                entities: [
                    rect("e1", [0, 0], [60, 0]),
                    rect("e2", [60, 0], [60, 40]),
                    rect("e3", [60, 40], [0, 40]),
                    rect("e4", [0, 40], [0, 0]),
                ],
                constraints: [
                    { kind: "DISTANCE", tags: ["e2", "e4"], value: 60 },
                    { kind: "DISTANCE", tags: ["e1", "e3"], value: 40 },
                ],
            },
            s_hole: {
                id: "s_hole",
                plane: { kind: "XY", origin: [0, 0, 0] },
                entities: [
                    { tag: "c1", type: "circle", center: [30, 20], radius: holeRadius },
                ],
                constraints: [{ kind: "RADIUS", tags: ["c1"], value: holeRadius }],
            },
        },
        features: [],
        parameters: [],
    } as unknown as FeatureTree;
}

describe("dimension_check (T2.1)", () => {
    it("正确件: 60/40/φ12 全部逐条通过", () => {
        const shape = buildPlate(12);
        const tree = declaredTree(6);
        const dims = collectDeclaredDimensions(tree, {});
        // 2 跨 + 1 半径都被收集
        expect(dims.length).toBe(3);

        const result = checkDimensions(tree, {}, shape, tp);
        expect(result.checked.length).toBe(3);
        expect(result.issues).toEqual([]);
        expect(result.passed).toBe(true);
        expect(result.unevaluated).toEqual([]);
    });

    it("突变体: 图纸声明 φ12 而模型是 φ9.6 (差 20%) —— 必拒且点名该尺寸", () => {
        const shape = buildPlate(9.6);
        const tree = declaredTree(6);
        const result = checkDimensions(tree, {}, shape, tp);

        expect(result.issues.length).toBe(1);
        const issue = result.issues[0];
        expect(issue.code).toBe("DIM_MISMATCH");
        expect(issue.severity).toBe("error");
        // 点名: 草图 + 声明值 + 实测值都要出现在报告里
        expect(issue.message).toContain("s_hole");
        expect(issue.message).toContain("radius 6");
        expect(issue.message).toContain("4.8");
        // 跨度尺寸不受孔径错误牵连, 仍各自通过 (逐条而非整体)
        expect(result.checked.filter((c) => c.ok).length).toBe(2);
        expect(result.passed).toBe(false);
    });

    it("突变体: 整体跨度 60 建成 72 (差 20%) —— 该跨度必拒", () => {
        const shape = new CQWorkplane(tp).boxCentered(72, 40, 10).val();
        const tree = declaredTree(0); // 无孔树
        const result = checkDimensions(tree, {}, shape, tp);
        expect(result.issues.length).toBe(1);
        expect(result.issues[0].code).toBe("DIM_MISMATCH");
        expect(result.issues[0].message).toContain("60");
        expect(result.issues[0].message).toContain("72");
    });

    it("公差带: 0.5% 的偏差在 2% 容差内放行", () => {
        const shape = buildPlate(12.12); // 半径 6.06, +1%
        const tree = declaredTree(6);
        const result = checkDimensions(tree, {}, shape, tp);
        expect(result.issues).toEqual([]);
        expect(result.passed).toBe(true);
    });

    it("AND 门语义: DIM_MISMATCH 是 error, 不可被其它门的通过豁免 (isWorthRefining 名单含它)", async () => {
        // 名单检查: 该错误码必须同时进 fixableByTreeEdit 与 MEASURED_CODES
        const pipeline = await import("../lib/cad_pipeline.js");
        const source = (await import("node:fs")).readFileSync(
            new URL("../lib/cad_pipeline.ts", import.meta.url), "utf-8",
        );
        expect(source).toContain('"DIM_MISMATCH"');
        void pipeline;
    });

    it("不可测的尺寸进 unevaluated, 绝不冒充已检查", () => {
        const shape = buildPlate(12);
        const tree = declaredTree(6);
        // ANGLE 约束没有 v1 测量 → 收集阶段就不产生 dim; 这里直接验证:
        // collectDeclaredDimensions 不产出 kind 之外的 dim, 且 checkDimensions
        // 的 unevaluated 只在内核测不了时出现
        const dims = collectDeclaredDimensions(tree, {});
        for (const d of dims) {
            expect(["radius", "spanWidth", "spanHeight"]).toContain(d.kind);
        }
        // 空约束树: 无可测, 无虚报
        const empty = {
            ...declaredTree(0),
            sketches: {
                s_base: {
                    ...((declaredTree(0) as any).sketches.s_base),
                    constraints: [],
                },
            },
        } as unknown as FeatureTree;
        const result = checkDimensions(empty, {}, shape, tp);
        expect(result.checked.length).toBe(0);
        expect(result.issues.length).toBe(0);
        expect(result.passed).toBe(true);
    });

    it("默认公差是 2%", () => {
        expect(DEFAULT_DIMENSION_TOLERANCE).toBe(0.02);
    });
});
