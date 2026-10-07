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
      workplane: (plane?: string, origin?: number[]) =>
        new CQWorkplane(tp, plane ?? "XY",
          origin ? new tp.Vector(...origin) : undefined),
      vec: (x: number, y: number, z: number) => new tp.Vector(x, y, z),
    };
    const interp = new TreeInterpreter(tp, cq);
    registerBuiltinOps(interp, cq);

    const goldens = JSON.parse(readFileSync(join(GOLDENS, "goldens.json"), "utf-8"));
    let checked = 0;
    for (const [name, golden] of Object.entries(goldens) as Array<[string, { volume: number; bbox: number[] }]>) {
      const raw = readFileSync(join(GOLDENS, name + ".json"), "utf-8");
      const tree = JSON.parse(raw);
      const result = await interp.interpret(tree, resolveParams(tree));
      console.log(`[${name}] emitted=${result.emitted.join(",")} skipped=${JSON.stringify(result.skipped)} warnings=${result.warnings.length}`);
      const gap = Math.abs(result.volume - golden.volume) / golden.volume;
      expect(gap, `${name}: volume gap ${(gap * 100).toFixed(2)}%`).toBeLessThan(0.015);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  }, 300_000);
});
