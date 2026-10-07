import { it } from "vitest";
import { loadKernel } from "../src/engine/kernel.js";

it("probe workplane ctor + polyline", async () => {
  const tp = await loadKernel();
  const tries: Array<[string, () => any]> = [
    ["Pnt origin", () => new tp.Workplane("XY", new (tp.gp_Pnt_3 ?? tp.gp_Pnt)(0, 0, 0), undefined)],
    ["Vector origin", () => new tp.Workplane("XY", new tp.Vector(0, 0, 0), undefined)],
    ["no origin", () => new tp.Workplane("XY", undefined, undefined)],
  ];
  for (const [name, fn] of tries) {
    try {
      const wp = fn();
      const pts = [new tp.gp_Pnt_3(0, 0, 0), new tp.gp_Pnt_3(10, 0, 0), new tp.gp_Pnt_3(10, 10, 0), new tp.gp_Pnt_3(0, 10, 0)];
      wp.Polyline?.(pts, false, false);
      wp.polyline?.(pts, false, false);
      wp.Close?.();
      const ex = wp.Extrude?.(10, true, true, false, 0) ?? wp.extrudeSimple?.(10);
      const shapes = ex?.Shapes?.() ?? [];
      const mesh = shapes[0]?.mesh?.(0.1, 0.1, 30, false);
      console.log(`[${name}] wp=${!!wp} shape=${shapes.length} tris=${mesh ? mesh.triangles[0].length : "n/a"}`);
    } catch (e) {
      console.log(`[${name}] FAILED: ${String(e).slice(0, 100)}`);
    }
  }
}, 120_000);
