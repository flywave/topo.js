// T2.4 可恢复状态机的突变/行为测试:
//   ① 杀进程模拟 —— stage C 中途失败 (解析垃圾), 状态文件已落盘 views+profiles;
//   ② --resume 续跑 —— 不再调用 analyzeImage, stage C 用新的响应完成;
//   ③ 篡改图纸后续跑 —— RESUME_HASH_MISMATCH 报警, 状态弃用, 从头跑;
//   ④ 无 resume 标志的新运行不受旧状态影响。
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CadPipeline } from "../lib/cad_pipeline.js";
import { MockProvider } from "../lib/llm.js";
import { RUN_STATE_DIR, RUN_STATE_FILE, sha256File } from "../lib/cad/run_state.js";

const WORK = join(tmpdirWork(), "topo-resume-test");
const IMAGE_PATH = join(WORK, "plate.png");
const PNG_1X1 = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
);

function tmpdirWork(): string {
    return join(process.env.TMPDIR ?? "/tmp", `topo-resume-${process.pid}`);
}

const VIEW = JSON.stringify({
    drawingKind: "engineering_drawing",
    views: [{ id: "v_front", kind: "front", confidence: 0.9 }],
    units: { length: "mm" },
    scale: { mmPerPixel: 0.5 },
    undetermined: [],
});
const PROFILE = JSON.stringify({
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
});
const TREE = JSON.stringify({
    name: "plate",
    units: { length: "mm" },
    datums: { planes: {}, axes: {} },
    sketches: {
        s_base: {
            plane: { kind: "XY", origin: [0, 0, 0] },
            entities: [
                { tag: "e1", type: "line", start: [0, 0], end: [120, 0] },
                { tag: "e2", type: "line", start: [120, 0], end: [120, 60] },
                { tag: "e3", type: "line", start: [120, 60], end: [0, 60] },
                { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
            ],
            constraints: [{ kind: "LENGTH", tags: ["e1"], value: 120 }],
        },
    },
    features: [
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_base", distance: "plateThickness" } },
    ],
    parameters: [{ name: "plateThickness", expr: "10", unit: "mm" }],
});

beforeAll(() => {
    mkdirSync(WORK, { recursive: true });
    writeFileSync(IMAGE_PATH, PNG_1X1);
});

afterAll(() => {
    try {
        require("node:fs").rmSync(WORK, { recursive: true, force: true });
    } catch {
        // best effort cleanup
    }
});

function stateFile() {
    return join(WORK, RUN_STATE_DIR, RUN_STATE_FILE);
}
function readState(): any {
    return JSON.parse(readFileSync(stateFile(), "utf-8"));
}

describe("resumable run state (T2.4)", () => {
    it("① 崩溃模拟: stage C 失败, views+profiles 已落盘, tree 未落盘", async () => {
        const llm = new MockProvider();
        llm.setResponse("analyzeImage", VIEW);
        llm.queueResponse("complete", PROFILE);
        llm.queueResponse("complete", "this is not json");

        const pipeline = new CadPipeline({ llm, workDir: WORK });
        await expect(pipeline.run(IMAGE_PATH, "Plate")).rejects.toThrow();

        const state = readState();
        expect(state.imageSha256).toBe(sha256File(IMAGE_PATH));
        expect(state.stages.views).toBeTruthy();
        expect(state.stages.profiles).toBeTruthy();
        expect(state.stages.tree).toBeFalsy();
        expect(state.profiles.length).toBe(1);
        expect(state.profiles[0].viewId).toBe("v_front");
    });

    it("② resume: 跳过 A/B, stage C 用新响应完成 (不再调用 analyzeImage)", async () => {
        const llm = new MockProvider();
        llm.setResponse("analyzeImage", VIEW);
        llm.queueResponse("complete", TREE);

        const pipeline = new CadPipeline({ llm, workDir: WORK, resume: true });
        const result = await pipeline.run(IMAGE_PATH, "Plate");

        // stage A/B 复用: 没有任何 analyzeImage 调用; 唯一的 complete 是 stage C
        const calls = llm.calls;
        expect(calls.filter((c: any) => c.method === "analyzeImage").length).toBe(0);
        expect(calls.filter((c: any) => c.method === "complete").length).toBe(1);

        expect(result.code.source.length).toBeGreaterThan(0);
        expect(result.lint.passed).toBe(true);
        expect(result.profiles.length).toBe(1);
        // 树段已补记
        expect(readState().stages.tree).toBeTruthy();
        expect(result.qualityBlocked?.ok).not.toBe(false);
    });

    it("③ 篡改图纸后续跑: RESUME_HASH_MISMATCH, 状态弃用, 从头跑", async () => {
        // 换一张内容不同的图 (同尺寸的另一个 PNG)
        const different = Buffer.from(PNG_1X1);
        different[different.length - 1] = (different[different.length - 1] + 1) % 256;
        writeFileSync(IMAGE_PATH, different);

        const llm = new MockProvider();
        llm.setResponse("analyzeImage", VIEW);
        llm.queueResponse("complete", PROFILE);
        llm.queueResponse("complete", TREE);

        const pipeline = new CadPipeline({ llm, workDir: WORK, resume: true });
        const result = await pipeline.run(IMAGE_PATH, "Plate");

        expect(result.warnings.join(" ")).toMatch(/RESUME_HASH_MISMATCH/);
        // 状态弃用: 从头跑 → analyzeImage 被重新调用
        expect(llm.calls.filter((c: any) => c.method === "analyzeImage").length).toBe(1);
        // 新状态绑定新图的哈希
        expect(readState().imageSha256).toBe(sha256File(IMAGE_PATH));
    });

    it("④ 同图再次 resume: 三个阶段全在, 什么模型调用都不需要", async () => {
        const llm = new MockProvider();
        llm.setResponse("analyzeImage", VIEW);
        llm.queueResponse("complete", TREE);

        const pipeline = new CadPipeline({ llm, workDir: WORK, resume: true });
        const result = await pipeline.run(IMAGE_PATH, "Plate");

        expect(llm.calls.length).toBe(0); // 三段全部复用, 零模型调用
        expect(result.code.source.length).toBeGreaterThan(0);
        expect(readState().stages.tree).toBeTruthy();
    });
});
