// T2.3 修复环 v2 的突变测试 (docs/testing-gates.md 规范): correction_loop 的每条
// 停机/升级优先级各一个突变体 —— 纯 TS, 无内核。语义出处: img2threejs
// forge/stage4_review/correction_loop.py + _fit_divine_eye 的单调接受分。
import { describe, expect, it } from "vitest";
import { CorrectionLoop } from "../lib/cad/correction_loop.js";

const round = (over: Partial<Parameters<CorrectionLoop["addRound"]>[0]>) => ({
    codes: [] as string[],
    errorCount: 0,
    score: null as number | null,
    accepted: true,
    ...over,
});

describe("correction_loop (T2.3)", () => {
    it("空历史: 正常继续", () => {
        const loop = new CorrectionLoop({ maxRounds: 3 });
        expect(loop.nextIntent()).toMatchObject({ continueRefining: true, escalate: false });
    });

    it("硬天花板: 轮数达到 maxRounds 必停, 优先级高于一切", () => {
        const loop = new CorrectionLoop({ maxRounds: 2 });
        loop.addRound(round({ codes: ["RPR_LOW_IOU"], accepted: false, errorCount: 1 }));
        loop.addRound(round({ codes: ["RPR_LOW_IOU"], accepted: false, errorCount: 1 }));
        const intent = loop.nextIntent();
        expect(intent.continueRefining).toBe(false);
        expect(intent.reason).toMatch(/ceiling/);
        // 即使下一轮"本应升级", 天花板也不可被绕过
        expect(intent.escalate).toBe(false);
    });

    it("一次回退不是 fatal: 循环继续且不升级", () => {
        const loop = new CorrectionLoop({ maxRounds: 3 });
        loop.addRound(round({ codes: ["RPR_LOW_IOU"], accepted: false, errorCount: 1, score: 0.5 }));
        const intent = loop.nextIntent();
        expect(intent.continueRefining).toBe(true);
        expect(intent.escalate).toBe(false);
    });

    it("振荡: 连续两次回退 → 升级 (改拓扑, 不改数值)", () => {
        const loop = new CorrectionLoop({ maxRounds: 5 });
        loop.addRound(round({ codes: ["RPR_LOW_IOU"], accepted: false, errorCount: 1, score: 0.5 }));
        loop.addRound(round({ codes: ["EDG_OUTLINE_MISMATCH"], accepted: false, errorCount: 1, score: 0.4 }));
        const intent = loop.nextIntent();
        expect(intent.continueRefining).toBe(true);
        expect(intent.escalate).toBe(true);
        expect(intent.reason).toMatch(/oscillation|reverted/);
    });

    it("同一缺陷连续两轮存活 → 升级", () => {
        const loop = new CorrectionLoop({ maxRounds: 5 });
        loop.addRound(round({ codes: ["DIM_MISMATCH"], errorCount: 1, score: 0.8, accepted: true }));
        loop.addRound(round({ codes: ["DIM_MISMATCH"], errorCount: 1, score: 0.801, accepted: true }));
        const intent = loop.nextIntent();
        expect(intent.escalate).toBe(true);
        expect(intent.reason).toContain("DIM_MISMATCH");
    });

    it("缺陷消失: 不升级 (修好了就是修好了)", () => {
        const loop = new CorrectionLoop({ maxRounds: 5 });
        loop.addRound(round({ codes: ["DIM_MISMATCH"], errorCount: 1, score: 0.8, accepted: true }));
        loop.addRound(round({ codes: [], errorCount: 0, score: 0.95, accepted: true }));
        expect(loop.nextIntent().escalate).toBe(false);
    });

    it("plateau: 连续两轮分数不动且缺陷仍在 → halt-and-ask", () => {
        const loop = new CorrectionLoop({ maxRounds: 6, plateauDelta: 0.001 });
        loop.addRound(round({ codes: ["EDG_OUTLINE_MISMATCH"], errorCount: 0, score: 0.80, accepted: true }));
        loop.addRound(round({ codes: ["EDG_OUTLINE_MISMATCH"], errorCount: 0, score: 0.8005, accepted: true }));
        const intent = loop.nextIntent();
        expect(intent.continueRefining).toBe(false);
        expect(intent.reason).toMatch(/plateau/);
    });

    it("分数在动: 不算 plateau", () => {
        const loop = new CorrectionLoop({ maxRounds: 6 });
        loop.addRound(round({ codes: ["EDG_OUTLINE_MISMATCH"], score: 0.70, accepted: true }));
        loop.addRound(round({ codes: ["EDG_OUTLINE_MISMATCH"], score: 0.78, accepted: true }));
        const intent = loop.nextIntent();
        expect(intent.continueRefining).toBe(true);
        // 但同缺陷两轮存活会升级
        expect(intent.escalate).toBe(true);
    });

    it("单调接受分: 低于历史最佳的被标 reverted (只有更好才算数)", () => {
        const loop = new CorrectionLoop({ maxRounds: 6 });
        const r1 = loop.addRound(round({ codes: ["RPR_LOW_IOU"], errorCount: 1, score: 0.9, accepted: true }));
        // round2 相对 round1 是接受的, 但低于历史最佳 0.9
        const r2 = loop.addRound(
            round({ codes: ["RPR_LOW_IOU"], errorCount: 2, score: 0.85, accepted: true }),
        );
        expect(r1.reverted).toBe(false);
        expect(r2.reverted).toBe(true);
        // 一次标 reverted 不升级; 两次连续 → 振荡升级
        loop.addRound(round({ codes: ["RPR_LOW_IOU"], errorCount: 2, score: 0.84, accepted: true }));
        expect(loop.nextIntent().escalate).toBe(true);
    });

    it("天花板与振荡同时满足时: 报的是天花板 (优先级)", () => {
        const loop = new CorrectionLoop({ maxRounds: 2 });
        loop.addRound(round({ codes: ["A"], accepted: false, errorCount: 1 }));
        loop.addRound(round({ codes: ["A"], accepted: false, errorCount: 1 }));
        const intent = loop.nextIntent();
        expect(intent.continueRefining).toBe(false);
        expect(intent.reason).toMatch(/ceiling/);
    });
});
