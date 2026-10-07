// Parametric pilot (方案 A 落地): the gim_cover_plate builder implemented
// ONCE in JS, registered into the C++ parametric registry through the Embind
// surface, built through tp.buildParametric — and pinned to the SAME volume
// reference the Go builder asserts in go-cadgen session/gim_volume_test.go
// (596607.08 mm³ @ 300×200×10, 3×φ12). Update the two references together.
import { describe, expect, it } from "vitest";
import { loadKernel, installGlobals } from "../src/engine/kernel.js";

const REF_VOLUME = 596607.079934;

describe.skipIf(typeof process !== "undefined" && false)("C++ parametric registry (pilot)", () => {
  it("registers a JS builder, builds via the registry, matches the Go reference", async () => {
    const tp = await loadKernel();
    installGlobals(tp);
    const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");

    tp.registerParametricBuilder("gim_cover_plate", (params: string) => {
      const p = JSON.parse(params);
      if (p.length <= 0 || p.width <= 0 || p.thickness <= 0) {
        throw new Error("gim_cover_plate: plate dimensions must be positive");
      }
      // Plate: sketch-loop path (workplane polyline is corrupt off-origin —
      // iteration 7's lesson applies to recipes too).
      const wp = new CQWorkplane(tp, "XY").sketchLoop([
        [-p.length / 2, -p.width / 2],
        [p.length / 2, -p.width / 2],
        [p.length / 2, p.width / 2],
        [-p.length / 2, p.width / 2],
      ]);
      let plate = wp.extrudeSimple(p.thickness);
      if (p.holeCount > 0) {
        const pitch = p.length / (p.holeCount + 1);
        for (let i = 0; i < p.holeCount; i++) {
          const x = -p.length / 2 + pitch * (i + 1);
          const cyl = new CQWorkplane(tp, "XY").center(x, 0).circleCentered(p.holeDiameter / 2);
          const tool = cyl.extrudeSimple(p.thickness * 4).vals()[0];
          plate = plate.cut(tool.castCompound(), true, 0);
        }
      }
      return { shape: plate.vals()[0] };
    });

    expect(tp.hasParametricBuilder("gim_cover_plate")).toBe(true);

    const r = tp.buildParametric(
      "gim_cover_plate",
      JSON.stringify({ length: 300, width: 200, thickness: 10, holeCount: 3, holeDiameter: 12 }),
    );
    const shp = r.shape;
    expect(shp).toBeTruthy();

    // Mesh fingerprint, same measure the parity ratchet uses.
    const data = shp.mesh(0.1, 0.1, 30, false);
    let mv = 0;
    for (let f = 0; f < data.vertices.length; f++) {
      const face = data.vertices[f];
      const tris = data.triangles[f] || [];
      for (let t = 0; t + 2 < tris.length; t += 3) {
        const p = [0, 1, 2].map((k) => {
          const i = tris[t + k] * 3;
          return [face[i], face[i + 1], face[i + 2]];
        });
        mv += (p[0][0] * (p[1][1] * p[2][2] - p[1][2] * p[2][1]) -
               p[0][1] * (p[1][0] * p[2][2] - p[1][2] * p[2][0]) +
               p[0][2] * (p[1][0] * p[2][1] - p[1][1] * p[2][0])) / 6;
      }
    }
    mv = Math.abs(mv);
    console.log(`pilot volume = ${mv.toFixed(3)} (ref ${REF_VOLUME})`);
    expect(Math.abs(mv - REF_VOLUME)).toBeLessThan(REF_VOLUME * 0.005);

    // Node metadata round-trip on a real Assembly instance.
    const asm = tp.Assembly.create(undefined, undefined, "", undefined, undefined);
    tp.setAssemblyParametric(asm, { type: "gim_cover_plate", params: "{}" });
    const back = tp.getAssemblyParametric(asm);
    expect(back?.type).toBe("gim_cover_plate");

    // The Go-worded error surfaces through JS.
    expect(() => tp.buildParametric("no_such_type", "{}")).toThrow(/no parametric builder registered/);

    // Unregister via null.
    tp.registerParametricBuilder("gim_cover_plate", null);
    expect(tp.hasParametricBuilder("gim_cover_plate")).toBe(false);
  }, 120_000);
});
