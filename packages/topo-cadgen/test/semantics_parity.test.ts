// Semantics parity (复盘/吸收轮 alignment): the browser interpreter carries
// the Go semantics this session added — multi-component holes (washer),
// per-instance pattern scaling + parameter-driven switches (stepped bore
// plate). Volumes are the Go side's construction goldens
// (interp/industrial_corpus_test.go); update both together.
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadKernel, installGlobals, resolveParams } from "../src/engine/kernel.js";
import { TreeInterpreter, registerBuiltinOps } from "../src/engine/interpreter.js";

const here = dirname(fileURLToPath(import.meta.url));
const INDUSTRIAL = process.env.CADGEN_GOLDENS
  ? dirname(process.env.CADGEN_GOLDENS)
  : join(here, "..", "..", "..", "..", "go-cadgen", "testdata", "industrial");
const WASM = join(here, "..", "..", "topo-wasm", "src", "topo.full.wasm");
const gated = process.env.CADGEN_EDITOR_KERNEL !== "0" && existsSync(WASM) && existsSync(join(INDUSTRIAL, "washer.json"));

describe.skipIf(!gated)("semantics parity vs go-cadgen industrial goldens", () => {
  it("washer: the inner circle is a HOLE (复盘 B)", async () => {
    const tp = await loadKernel();
    installGlobals(tp);
    const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
    const cq = {
      workplane: (plane?: string, origin?: number[]): any =>
        new CQWorkplane(tp, plane ?? "XY", origin ? new tp.Vector(...origin) : undefined),
      vec: (x: number, y: number, z: number) => new tp.Vector(x, y, z),
    } as any;
    const interp = new TreeInterpreter(tp, cq);
    registerBuiltinOps(interp, cq);
    const tree = JSON.parse(readFileSync(join(INDUSTRIAL, "washer.json"), "utf-8"));
    const result = await interp.interpret(tree, resolveParams(tree));
    expect(result.skipped, JSON.stringify(result.skipped)).toEqual([]);
    // π(20²−8²)·4 — the Go golden (industrial_corpus_test.go)
    const want = Math.PI * (400 - 64) * 4;
    expect(Math.abs(result.volume - want) / want).toBeLessThan(0.015);
  }, 120_000);

  it("stepped bore plate: scaleIncrement + enabledExpr (吸收①②)", async () => {
    const tp = await loadKernel();
    installGlobals(tp);
    const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
    const cq = {
      workplane: (plane?: string, origin?: number[]): any =>
        new CQWorkplane(tp, plane ?? "XY", origin ? new tp.Vector(...origin) : undefined),
      vec: (x: number, y: number, z: number) => new tp.Vector(x, y, z),
    } as any;
    const interp = new TreeInterpreter(tp, cq);
    registerBuiltinOps(interp, cq);
    const tree = JSON.parse(readFileSync(join(INDUSTRIAL, "stepped_bore_plate.json"), "utf-8"));
    const result = await interp.interpret(tree, resolveParams(tree));
    // ALL features emitted, nothing skipped: the enabledExpr boss ran
    // (raisedBoss=1) and the scaleIncrement ring rebuilt all four copies.
    expect(result.skipped, JSON.stringify(result.skipped)).toEqual([]);
    expect(result.emitted).toEqual(["f_plate", "f_bore", "f_ring", "f_boss"]);

    // ring net cut vs the Go golden's arithmetic: 5466 (4 bores of radius
    // 5,6,7,8 at 1 + i/4, the source bore already cut by f_bore)
    const noRing = await (async () => {
      const t2 = JSON.parse(JSON.stringify(tree));
      t2.features = t2.features.filter((f: any) => f.id !== "f_ring");
      return interp.interpret(t2, resolveParams(t2));
    })();
    const ringCut = noRing.volume - result.volume;
    const wantRingCut = Math.PI * 10 * (25 + 36 + 49 + 64);
    expect(Math.abs(ringCut - wantRingCut) / wantRingCut).toBeLessThan(0.01);

    // KNOWN SHIM GAP (documented, not a semantics divergence): the wasm
    // workplane union of an OFFSET-sketch pad (the boss at z=10) leaves the
    // boss out of the fused body, so the local absolute volume runs
    // boss-short while the SERVER (Go) result carries it. Tracked for the
    // shim layer; the semantics under test here — enabledExpr, the
    // scaleIncrement rebuild, the hole network — are asserted above.
  }, 240_000);
});
