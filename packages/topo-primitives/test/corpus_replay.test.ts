// 语料库一键重放 (roadmap T0.2): packages/topo-text2cad/fixtures/corpus 的全部条目
// 重放并对账 (shape 有效 / bbox 有限)。语料同时是 text2cad 的 few-shot 素材与回归基线。
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { CQ } from "../lib/index";
import * as RAILWAY from "../lib/railway/index";
import { checkShape, getTopo } from "./helpers/topo";

const here = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(here, "../../topo-text2cad/fixtures/corpus");

interface EditorEntry {
    id: string;
    label: string;
    code: string;
}

interface RailwayEntry {
    id: string;
    className: string;
}

interface CqEntry {
    id: string;
    goldenKey: string;
    code: string;
}

function loadJson<T>(name: string): T[] {
    // Collection-time call: return nothing when the corpus is absent so
    // it.each registers no cases instead of throwing.
    const path = join(CORPUS_DIR, name);
    if (!existsSync(path)) return [];
    return JSON.parse(readFileSync(path, "utf8")) as T[];
}

// Fixture-gated: the corpus lives in packages/topo-text2cad, which this
// workspace may not have checked out. Skip (not fail) without it.
const corpusReady = existsSync(CORPUS_DIR);
describe.skipIf(!corpusReady)("corpus replay", () => {
    let tp: any;
    beforeAll(async () => {
        tp = await getTopo();
        // C++ add()/Location 构造器做 instanceof 全局类检查; vitest 每文件独立
        // 注册表, 必须无条件覆盖 (AGENTS 已知坑)
        for (const n of [
            "Workplane", "Assembly", "Shape", "Solid", "Face", "Compound",
            "Sketch", "gp_Trsf", "TopLoc_Location", "gp_Pnt", "gp_Vec", "gp_Pln",
        ]) {
            if ((tp as any)[n] !== undefined) {
                (globalThis as any)[n] = (tp as any)[n];
            }
        }
    });

    it.each(
        loadJson<RailwayEntry>("railway_primitives.json").map(
            (e) => [e.id, e] as [string, RailwayEntry],
        ),
    )(
        "%s: setDefault -> build -> bbox 有限",
        (_id, entry) => {
            const Cls = (RAILWAY as any)[entry.className];
            expect(Cls, `${entry.id}: 类 ${entry.className} 不存在`).toBeTruthy();
            const prim = new Cls(tp).setDefault();
            expect(prim.valid(), `${entry.id} 默认参数 valid() == false`).toBe(true);
            const shape = prim.build();
            const r = checkShape(shape);
            expect(r.ok, `${entry.id}: ${r.reason ?? ""}`).toBe(true);
        },
    );

    it("railway 语料条目数 = 52", () => {
        expect(loadJson<RailwayEntry>("railway_primitives.json").length).toBe(52);
    });

    it("editor_snippets: 10 条脚本沙箱重放 -> render 收到的 shape 有效", () => {
        const entries = loadJson<EditorEntry>("editor_snippets.json");
        expect(entries.length).toBe(10);
        const failures: string[] = [];
        for (const entry of entries) {
            let rendered: any = null;
            // 与编辑器一致的注入面 (topo-editor: tp/CQWorkplane/pnt/vec/gpVec/render)
            const sandbox: Record<string, unknown> = {
                tp,
                CQWorkplane: CQ.CQWorkplane,
                // 直接传 CQ.pnt/vec/gpVec (首参 tp 由 snippet 自带) — 包装成少一个
                // 形参的箭头会把 tp 当坐标 (editor_03 曾因此抛裸指针数字)
                pnt: CQ.pnt,
                vec: CQ.vec,
                gpVec: CQ.gpVec,
                render: (s: any) => {
                    // snippet 可能传 CQWorkplane (有 .val()) 或裸 shape
                    rendered = s && typeof s.val === "function" ? s.val() : s;
                },
            };
            const run = new Function(
                ...Object.keys(sandbox),
                `"use strict";\n${entry.code}`,
            );
            try {
                run(...Object.values(sandbox));
            } catch (e: any) {
                failures.push(`${entry.id} 执行抛出: ${String(e?.message ?? e).slice(0, 80)}`);
                continue;
            }
            if (!rendered) {
                failures.push(`${entry.id} 未调用 render()`);
                continue;
            }
            const r = checkShape(rendered);
            if (!r.ok) {
                failures.push(`${entry.id}: ${r.reason ?? ""}`);
            }
        }
        expect(failures, failures.join(" || ")).toEqual([]);
    });

    it("cq_examples: 33 条块体重放, golden bbox 逐坐标对账", () => {
        const entries = loadJson<CqEntry>("cq_examples.json");
        expect(entries.length).toBe(33);
        const goldens: Record<string, { bbox: number[] }> = JSON.parse(
            readFileSync(join(here, "cq", "goldens.json"), "utf-8"),
        );
        // 与 cq_examples.test.ts 相同的测试环境: 块体引用这些局部符号
        const TOL = 1e-6;
        const expectBBox接近 = (actual: any, goldenKey: string) => {
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
        };
        const safe = <T,>(fn: () => T, fallback: T): T => {
            try {
                return fn();
            } catch {
                return fallback;
            }
        };
        class Chain {
            private broken = false;
            constructor(public v: any) {}
            static of(v: any): Chain {
                return new Chain(v);
            }
            then(fn: (v: any) => any): Chain {
                if (!this.broken) {
                    try {
                        this.v = fn(this.v);
                    } catch {
                        this.broken = true;
                    }
                }
                return this;
            }
            value(): any {
                return this.v;
            }
        }

        for (const entry of entries) {
            const run = new Function(
                "tp", "CQWorkplane", "pnt", "vec", "gpVec",
                "expect", "goldens", "expectBBox接近", "safe", "Chain",
                `"use strict";\n${entry.code}`,
            );
            expect(
                () => run(tp, CQ.CQWorkplane, CQ.pnt, CQ.vec, CQ.gpVec,
                    expect, goldens, expectBBox接近, safe, Chain),
                `${entry.id} 执行失败`,
            ).not.toThrow();
        }
    });
});
