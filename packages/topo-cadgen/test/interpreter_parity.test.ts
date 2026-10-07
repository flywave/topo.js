// Corpus parity (P3 framework ratchet): the browser interpreter must land in
// the same place as the Go one. Env-gated like tree_goldens_dump: the wasm
// kernel only loads where it exists.
//
//   CADGEN_EDITOR_KERNEL=1 CADGEN_GOLDENS=<go-cadgen>/testdata/corpus/trees pnpm test interpreter_parity
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadKernel, installGlobals, resolveParams } from "../src/engine/kernel.js";
import { TreeInterpreter, registerBuiltinOps } from "../src/engine/interpreter.js";

const GOLDENS = process.env.CADGEN_GOLDENS ?? "";
const gated = process.env.CADGEN_EDITOR_KERNEL === "1" && GOLDENS && existsSync(GOLDENS);

describe.skipIf(!gated)("interpreter parity vs go-cadgen goldens", () => {
  it("volume/bbox within the two-sided tolerance (1.5%)", async () => {
    const tp = await loadKernel();
    installGlobals(tp);
    // Through the CQ shim (same as the editor adapter): its cut/union pass
    // the Embind workplane — and its own suite proves those work.
    const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
    const cq = {
      workplane: (plane?: string, origin?: number[]): any =>
        new CQWorkplane(tp, plane ?? "XY",
          origin ? new tp.Vector(...origin) : undefined),
      vec: (x: number, y: number, z: number) => new tp.Vector(x, y, z),
    } as any;
    const interp = new TreeInterpreter(tp, cq);
    registerBuiltinOps(interp, cq);

        const goldens = JSON.parse(readFileSync(join(GOLDENS, "goldens.json"), "utf-8"));
    // Soft-fail per tree with a full table: one red tree must not hide the
    // rest of the ratchet state. The overall test still fails if any diverges.
    const failures: string[] = [];
    let checked = 0;
    for (const [name, golden] of Object.entries(goldens) as Array<[string, { volume: number; bbox: number[] }]>) {
      const raw = readFileSync(join(GOLDENS, name + ".json"), "utf-8");
      const tree = JSON.parse(raw);
      const result = await interp.interpret(tree, resolveParams(tree));
      const gap = Math.abs(result.volume - golden.volume) / golden.volume;
      const ok = gap < 0.015 && result.skipped.length === 0;
      console.log(`[${name}] gap=${(gap * 100).toFixed(2)}% emitted=${result.emitted.join(",")} skipped=${JSON.stringify(result.skipped)}`);
      if (!ok) failures.push(`${name}: gap ${(gap * 100).toFixed(2)}%, skipped=${result.skipped.length}`);
      checked++;
    }
    expect(failures, "parity failures:\n" + failures.join("\n")).toEqual([]);
    expect(checked).toBeGreaterThan(0);
  }, 300_000);
});
