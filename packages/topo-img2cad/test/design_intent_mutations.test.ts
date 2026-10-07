// T0.3 突变测试收尾 (docs/testing-gates.md): design_intent 里 11 个此前从未被
// 断言的纯 TS 错误码 —— 每个码一个"使其失败的突变体", 不需要内核
// (lint 只吃 FeatureTree; checkAssociativity 的 rebuild 是注入闭包)。
//
// 覆盖: DIN_LATE_BASE_FEATURE / DIN_MISSING_PATH_SKETCH / DIN_MISSING_PATTERN_SOURCE /
//       DIN_DEGENERATE_PATTERN / DIN_LOFT_SECTIONS / DIN_BELOW_MIN / DIN_ABOVE_MAX /
//       DIN_BASE_BUILD_FAILED / DIN_PARAM_NOT_RESOLVED / DIN_PERTURB_BUILD_FAILED /
//       DIN_INERT_PARAMETER
import { describe, expect, it } from "vitest";
import type { FeatureTree } from "../lib/cad/model.js";
import {
    checkAssociativity,
    lintFeatureTree,
} from "../lib/validators/design_intent.js";

// 与 feature_tree.test.ts 的 plateTree 同款最小夹具 (自包含)
function baseSketch() {
    return {
        plane: { kind: "XY" as const },
        entities: [
            { tag: "e1", type: "line", start: [0, 0], end: [100, 0] },
            { tag: "e2", type: "line", start: [100, 0], end: [100, 60] },
            { tag: "e3", type: "line", start: [100, 60], end: [0, 60] },
            { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
        ],
    };
}

function plateTree(over: Partial<FeatureTree> = {}): FeatureTree {
    return {
        name: "plate",
        units: { length: "mm", toMillimeter: 1 },
        datums: { planes: {}, axes: {} },
        sketches: { s_base: baseSketch() as any },
        features: [
            {
                id: "f_pad",
                name: "Base plate",
                op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
                drivenBy: ["plateThickness"],
            },
        ],
        parameters: [{ name: "plateThickness", expr: "10", unit: "mm" }],
        ...over,
    } as FeatureTree;
}

describe("design_intent lint mutations (T0.3, pure TS)", () => {
    const codes = (t: FeatureTree) => lintFeatureTree(t).issues.map((i) => i.code);

    it("DIN_LATE_BASE_FEATURE: 改性特征排在基特征之前", () => {
        const base = plateTree();
        const t = plateTree({
            features: [base.features[0], { ...base.features[0], id: "f_pad2" }],
        });
        // 第一个是 pad (基), 不触发; 换成 fillet 在前:
        const late = plateTree({
            features: [
                { id: "f_round", name: "Round", op: { op: "fillet", selector: "|Z", radius: "2" } },
                {
                    id: "f_pad",
                    name: "Base plate",
                    op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
                },
            ],
        });
        expect(codes(t)).not.toContain("DIN_LATE_BASE_FEATURE");
        expect(codes(late)).toContain("DIN_LATE_BASE_FEATURE");
    });

    it("DIN_MISSING_PATH_SKETCH: sweep 的路径草图不存在", () => {
        const t = plateTree({
            sketches: { s_base: baseSketch() as any, s_prof: baseSketch() as any },
            features: [
                {
                    id: "f_pad",
                    name: "Base",
                    op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
                },
                {
                    id: "f_sweep",
                    name: "Arm",
                    op: { op: "sweep", sketchId: "s_prof", pathSketchId: "s_ghost" },
                },
            ],
        });
        expect(codes(t)).toContain("DIN_MISSING_PATH_SKETCH");
    });

    it("DIN_MISSING_PATTERN_SOURCE: 阵列引用不存在的特征", () => {
        const t = plateTree({
            features: [
                {
                    id: "f_pad",
                    name: "Base",
                    op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
                },
                {
                    id: "f_pat",
                    name: "Pattern",
                    op: { op: "pattern_linear", ofFeature: "f_ghost", count: 3, dx: "20", dy: "0" },
                },
            ],
        });
        expect(codes(t)).toContain("DIN_MISSING_PATTERN_SOURCE");
    });

    it("DIN_DEGENERATE_PATTERN: count=1 的阵列不产生任何东西", () => {
        const t = plateTree({
            features: [
                {
                    id: "f_pad",
                    name: "Base",
                    op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
                },
                {
                    id: "f_pat",
                    name: "Pattern",
                    op: { op: "pattern_linear", ofFeature: "f_pad", count: 1, dx: "20", dy: "0" },
                },
            ],
        });
        expect(codes(t)).toContain("DIN_DEGENERATE_PATTERN");
    });

    it("DIN_LOFT_SECTIONS: loft 只有 1 个截面", () => {
        const t = plateTree({
            features: [
                {
                    id: "f_pad",
                    name: "Base",
                    op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
                },
                { id: "f_loft", name: "Loft", op: { op: "loft", sketchIds: ["s_base"] } },
            ],
        });
        expect(codes(t)).toContain("DIN_LOFT_SECTIONS");
    });

    it("DIN_BELOW_MIN: 参数解析值低于声明下限", () => {
        const t = plateTree({
            parameters: [{ name: "plateThickness", expr: "1", unit: "mm", min: 2 }],
        });
        const lint = lintFeatureTree(t);
        // "1" 是正值, 不应误报 NON_POSITIVE
        expect(codes(t)).not.toContain("DIN_NON_POSITIVE_DIMENSION");
        expect(lint.issues.some((i) => i.code === "DIN_BELOW_MIN" && i.message.includes("below"))).toBe(true);
    });

    it("DIN_ABOVE_MAX: 参数解析值高于声明上限", () => {
        const t = plateTree({
            parameters: [{ name: "plateThickness", expr: "50", unit: "mm", max: 10 }],
        });
        const lint = lintFeatureTree(t);
        expect(lint.issues.some((i) => i.code === "DIN_ABOVE_MAX" && i.message.includes("above"))).toBe(true);
    });

    it("边界: min/max 恰好相等不报警", () => {
        const atMin = plateTree({
            parameters: [{ name: "plateThickness", expr: "2", unit: "mm", min: 2 }],
        });
        const atMax = plateTree({
            parameters: [{ name: "plateThickness", expr: "10", unit: "mm", max: 10 }],
        });
        expect(codes(atMin)).not.toContain("DIN_BELOW_MIN");
        expect(codes(atMax)).not.toContain("DIN_ABOVE_MAX");
    });
});

describe("design_intent associativity mutations (T0.3, injected rebuild — no kernel)", () => {
    const tree = plateTree();
    const base = { plateThickness: 10 };

    it("DIN_BASE_BUILD_FAILED: 基参数建不出模型", () => {
        const report = checkAssociativity(tree, base, () => null);
        expect(report.issues.map((i) => i.code)).toContain("DIN_BASE_BUILD_FAILED");
        expect(report.passed).toBe(false);
    });

    it("DIN_PARAM_NOT_RESOLVED: 参数没有可解析值, 无法扰动", () => {
        const calls: number[] = [];
        const report = checkAssociativity(tree, { other: 1 }, (params) => {
            calls.push(1);
            return params.other === 1 ? { volume: 1000 } : null;
        }, { parameters: ["plateThickness"] });
        expect(report.issues.map((i) => i.code)).toContain("DIN_PARAM_NOT_RESOLVED");
        // 基参数能建 (other=1), 但缺的参数直接跳过扰动
        expect(report.checks).toEqual([]);
    });

    it("DIN_PERTURB_BUILD_FAILED: 扰动后建不出 (参数出有效域)", () => {
        const report = checkAssociativity(tree, base, (params) =>
            params.plateThickness === 10 ? { volume: 1000 } : null,
        );
        expect(report.issues.map((i) => i.code)).toContain("DIN_PERTURB_BUILD_FAILED");
        expect(report.checks).toEqual([]);
    });

    it("DIN_INERT_PARAMETER: 扰动后几何指纹毫无变化 (装饰性参数)", () => {
        const report = checkAssociativity(tree, base, () => ({ volume: 1000, faces: 6 }));
        expect(report.issues.map((i) => i.code)).toContain("DIN_INERT_PARAMETER");
        expect(report.checks[0]?.droveGeometry).toBe(false);
    });

    it("对照组: 参数真的驱动几何时无 INERT 报警", () => {
        const report = checkAssociativity(tree, base, (params) => ({
            volume: params.plateThickness * 100 * 60,
        }));
        expect(report.issues.map((i) => i.code)).not.toContain("DIN_INERT_PARAMETER");
        expect(report.checks[0]?.droveGeometry).toBe(true);
    });
});
