// T2.2 质量合同 (fail-closed) 的突变测试: 每条 QC_* 检查一个"使其阻塞的突变体",
// 外加管线级验证 —— 被阻塞的运行 code.source 为空串 (一行代码不生成) 且报告机器可读。
import { describe, expect, it } from "vitest";
import { MockProvider } from "../lib/llm.js";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync } from "node:fs";
import { CadPipeline } from "../lib/cad_pipeline.js";
import {
    checkQualityContract,
    DEFAULT_CALLOUT_PX,
    DEFAULT_MIN_COVERAGE,
} from "../lib/validators/quality_contract.js";
import type { FeatureTree, Profile2D } from "../lib/cad/model.js";

const PROFILE: Profile2D = {
    viewId: "v_front",
    entities: [
        { tag: "e1", type: "line", start: [0, 0], end: [120, 0] },
        { tag: "e2", type: "line", start: [120, 0], end: [120, 60] },
        { tag: "e3", type: "line", start: [120, 60], end: [0, 60] },
        { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
    ],
    loops: [{ tags: ["e1", "e2", "e3", "e4"], closed: true }],
    relations: [],
    dimensions: [{ name: "plateWidth", kind: "length", value: 120, tags: ["e1"] }],
};

/** 应答了图纸的树: e1-e4 全在 + LENGTH e1=120。 */
function goodTree(): FeatureTree {
    return {
        name: "plate",
        units: { length: "mm", toMillimeter: 1 },
        datums: { planes: {}, axes: {} },
        sketches: {
            s_base: {
                id: "s_base",
                plane: { kind: "XY", origin: [0, 0, 0] },
                entities: PROFILE.entities.map((e) => ({ ...e })),
                constraints: [{ kind: "LENGTH", tags: ["e1"], value: 120 }],
            },
        },
        features: [
            {
                id: "f_pad",
                name: "Base",
                op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
            },
        ],
        parameters: [{ name: "plateThickness", expr: "10", unit: "mm" }],
        provenance: { viewSet: undefined as any, profiles: [PROFILE] },
    };
}

describe("quality contract (T2.2)", () => {
    it("应答完整的树: 通过", () => {
        const qc = checkQualityContract({ tree: goodTree() });
        expect(qc.ok).toBe(true);
        expect(qc.gaps).toEqual([]);
        expect(JSON.parse(qc.report)).toMatchObject({ blocked: false });
    });

    it("QC_DIMENSION_COVERAGE: 图纸声明的宽度无人应答 → 阻塞并点名", () => {
        const tree = goodTree();
        // 树保留了实体但丢掉了 LENGTH 约束, 也没有 plateWidth 参数
        (tree.sketches.s_base as any).constraints = [];
        const qc = checkQualityContract({ tree });
        expect(qc.ok).toBe(false);
        const gap = qc.gaps.find((g) => g.code === "QC_DIMENSION_COVERAGE");
        expect(gap).toBeDefined();
        expect(gap!.message).toContain("plateWidth");
        expect(gap!.message).toContain("120");
    });

    it("参数名应答与表达式值应答都算数", () => {
        // 树丢掉了约束, 但有名为 plateWidth 的参数 → 应答
        const byName = goodTree();
        (byName.sketches.s_base as any).constraints = [];
        (byName.parameters as any).push({ name: "plateWidth", expr: "120", unit: "mm" });
        expect(checkQualityContract({ tree: byName }).ok).toBe(true);

        // 值应答: 约束 tags 不同但值等于声明值 (表达式解析后) → 应答
        const byValue = goodTree();
        (byValue.sketches.s_base as any).constraints = [
            { kind: "LENGTH", tags: ["e3"], value: "plateThickness * 12" },
        ];
        const qc = checkQualityContract({ tree: byValue, params: { plateThickness: 10 } });
        expect(qc.gaps.find((g) => g.code === "QC_DIMENSION_COVERAGE")).toBeUndefined();
    });

    it("QC_VIEW_NO_ENTRY: 视图的实体标签一个都没进树 → 阻塞", () => {
        const tree = goodTree();
        // 树的草图标签全部改名: 该视图从未进入模型
        const sketch = tree.sketches.s_base as any;
        sketch.entities = sketch.entities.map((e: any, i: number) => ({ ...e, tag: `x${i + 1}` }));
        sketch.constraints = [{ kind: "LENGTH", tags: ["x1"], value: 120 }];
        const qc = checkQualityContract({ tree });
        expect(qc.ok).toBe(false);
        expect(qc.gaps.some((g) => g.code === "QC_VIEW_NO_ENTRY" && g.message.includes("v_front"))).toBe(true);
    });

    it("QC_INK_CALLOUT: ink 点名的实体不在树里 → 阻塞并点名", () => {
        const tree = goodTree();
        const check = {
            compared: true,
            viewId: "v_front",
            entities: [
                { tag: "e9", meanPx: 42, description: "line 111px" },
                { tag: "e1", meanPx: 0.5, description: "" },
            ],
        } as any;
        const qc = checkQualityContract({
            tree,
            profileChecks: [check as any],
            calloutPx: DEFAULT_CALLOUT_PX,
        });
        expect(qc.ok).toBe(false);
        const gap = qc.gaps.find((g) => g.code === "QC_INK_CALLOUT");
        expect(gap).toBeDefined();
        expect(gap!.message).toContain("e9");
        // e1 在树里且低于点名阈值, 不阻塞
        expect(JSON.stringify(qc.gaps)).not.toContain('"e1"');
    });

    it("默认阈值: 覆盖率 50%, 点名线 8px", () => {
        expect(DEFAULT_MIN_COVERAGE).toBe(0.5);
        expect(DEFAULT_CALLOUT_PX).toBe(8);
    });
});

// ---------------------------------------------------------------------------
// 管线级: 被阻塞的运行一行代码都不生成
// ---------------------------------------------------------------------------

const IMAGE_PATH = join(tmpdir(), "topo-qc-fixture.png");
const PNG_1X1 = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
);
const VIEW = JSON.stringify({
    drawingKind: "engineering_drawing",
    views: [{ id: "v_front", kind: "front", confidence: 0.9 }],
    units: { length: "mm" },
    scale: { mmPerPixel: 0.5 },
    undetermined: [],
});
const PROFILE_JSON = JSON.stringify(PROFILE);
/** 突变体: 保留实体但丢掉全部约束 —— 声明尺寸无人应答。 */
const TREE_SHALLOW = JSON.stringify({
    name: "plate",
    units: { length: "mm" },
    datums: { planes: {}, axes: {} },
    sketches: {
        s_base: {
            plane: { kind: "XY", origin: [0, 0, 0] },
            entities: PROFILE.entities,
            constraints: [],
        },
    },
    features: [
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_base", distance: "plateThickness" } },
    ],
    parameters: [{ name: "plateThickness", expr: "10", unit: "mm" }],
    designIntent: { primaryAxis: "z" },
});

describe("quality contract in the pipeline (T2.2 fail-closed)", () => {
    it("被阻塞的运行: code.source 为空, errors 带 QC_BLOCKED, 不进 review", async () => {
        writeFileSync(IMAGE_PATH, PNG_1X1);
        const llm = new MockProvider();
        llm.setResponse("analyzeImage", VIEW);
        llm.queueResponse("complete", PROFILE_JSON);
        llm.queueResponse("complete", TREE_SHALLOW);

        const pipeline = new CadPipeline({ llm, maxRefinements: 2 });
        const result = await pipeline.run(IMAGE_PATH, "Plate");

        expect(result.qualityBlocked?.ok).toBe(false);
        expect(result.code.source).toBe("");
        expect(result.errors.join(" ")).toMatch(/QC_BLOCKED/);
        expect(result.review).toBeUndefined();
        expect(result.refinements).toBe(0);
        // 机器可读报告: JSON, 带 blocked 与缺口清单
        const parsed = JSON.parse(result.qualityBlocked!.report);
        expect(parsed.blocked).toBe(true);
        expect(parsed.gaps.length).toBeGreaterThan(0);
    });

    it("qualityContract: false 关掉硬门, 照常发射", async () => {
        writeFileSync(IMAGE_PATH, PNG_1X1);
        const llm = new MockProvider();
        llm.setResponse("analyzeImage", VIEW);
        llm.queueResponse("complete", PROFILE_JSON);
        llm.queueResponse("complete", TREE_SHALLOW);

        const pipeline = new CadPipeline({ llm, maxRefinements: 0, qualityContract: false });
        const result = await pipeline.run(IMAGE_PATH, "Plate");

        expect(result.qualityBlocked).toBeUndefined();
        expect(result.code.source.length).toBeGreaterThan(0);
        expect(result.errors.join(" ")).not.toMatch(/QC_BLOCKED/);
    });
});
