// probe: does the CQ shim honour the workplane origin for circle+extrude?
import { describe, expect, it } from "vitest";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { loadKernel, installGlobals } from "../src/engine/kernel.js";

const here = dirname(fileURLToPath(import.meta.url));
const WASM = join(here, "..", "..", "topo-wasm", "src", "topo.full.wasm");
const gated = process.env.CADGEN_EDITOR_KERNEL !== "0" && existsSync(WASM);

describe.skipIf(!gated)("workplane origin probe", () => {
  it("circle extruded on XY@z=10 spans z 10..16", async () => {
    const tp = await loadKernel();
    installGlobals(tp);
    const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
    const wp = new CQWorkplane(tp, "XY", new tp.Vector(0, 0, 10));
    const w2 = wp.center(30, 40);
    w2.circleCentered(12);
    const prism = w2.extrudeSimple(6);
    const shape = prism.vals()[0];
    // mesh-based bbox (the interpreter's own fingerprint path)
    let zmin = Infinity, zmax = -Infinity;
    const data = shape.mesh(0.1, 0.1, 30, false);
    for (const face of data.vertices) {
      for (let i = 0; i + 2 < face.length; i += 3) {
        zmin = Math.min(zmin, face[i + 2]);
        zmax = Math.max(zmax, face[i + 2]);
      }
    }
    console.log("zmin=", zmin, "zmax=", zmax);
    expect(zmin).toBeCloseTo(10, 1);
    expect(zmax).toBeCloseTo(16, 1);
  }, 60_000);

  it("plate + boss pad (stepped minimal)", async () => {
    const tp = await loadKernel();
    installGlobals(tp);
    const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
    const cq = {
      workplane: (plane?: string, origin?: number[]): any =>
        new CQWorkplane(tp, plane ?? "XY", origin ? new tp.Vector(...origin) : undefined),
      vec: (x: number, y: number, z: number) => new tp.Vector(x, y, z),
    } as any;
    const { TreeInterpreter, registerBuiltinOps } = await import("../src/engine/interpreter.js");
    const interp = new TreeInterpreter(tp, cq);
    registerBuiltinOps(interp, cq);
    const tree = {
      name: "min", units: { length: "mm", toMillimeter: 1 }, datums: {},
      sketches: {
        s_plate: { id: "s_plate", plane: { kind: "XY", origin: [0, 0, 0] }, entities: [
          { tag: "p1", type: "line", start: [0, 0], end: [120, 0] },
          { tag: "p2", type: "line", start: [120, 0], end: [120, 80] },
          { tag: "p3", type: "line", start: [120, 80], end: [0, 80] },
          { tag: "p4", type: "line", start: [0, 80], end: [0, 0] },
        ], constraints: [] },
        s_boss: { id: "s_boss", plane: { kind: "XY", origin: [0, 0, 10] }, entities: [
          { tag: "b1", type: "circle", center: [30, 40], radius: 12 },
        ], constraints: [] },
      },
      features: [
        { id: "f_plate", name: "Plate", op: { op: "pad", sketchId: "s_plate", distance: "10" } },
        { id: "f_boss", name: "Boss", op: { op: "pad", sketchId: "s_boss", distance: "6" } },
      ],
      parameters: [],
    };
    const result = await interp.interpret(tree as any, {});
    console.log("min: volume=", result.volume, "(want 98714.3) bbox=", result.bbox, "skipped=", JSON.stringify(result.skipped));
    expect(result.skipped).toEqual([]);
  }, 60_000);
});
