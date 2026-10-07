// LocalEditService — the closed loop's core half, tested with fake ports:
// preview gates commit (a partial build never reaches the server), the
// change list names what moved, and a server rejection is reported verbatim.
import { describe, expect, it } from "vitest";
import { LocalEditService } from "../src/core/edits.js";
import { applyPatch } from "../src/core/patch.js";
import type { FeatureTreeLike } from "../src/engine/kernel.js";

function plate(thickness: string): FeatureTreeLike {
  return {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: {},
    sketches: { s_base: { id: "s_base", plane: { kind: "XY" }, entities: [], constraints: [] } },
    features: [{ id: "f_pad", op: { op: "pad", sketchId: "s_base", distance: "h" } }],
    parameters: [{ name: "h", expr: thickness, unit: "mm" }],
  };
}

const params = { h: 10 };
const goodBuild = { mesh: { vertices: [[]], triangles: [[]] }, skipped: [], volume: 1234 };

describe("applyPatch", () => {
  it("setParameter / setOpField / removeFeature are immutable and precise", () => {
    const before = plate("10");
    const after = applyPatch(before, { kind: "setParameter", name: "h", expr: "12" });
    expect(after.parameters[0].expr).toBe("12");
    expect(before.parameters[0].expr).toBe("10");
    expect(after.features).toEqual(before.features);

    const cut = applyPatch(before, { kind: "setOpField", featureId: "f_pad", field: "distance", value: "15" });
    expect((cut.features[0].op as any).distance).toBe("15");
    expect((before.features[0].op as any).distance).toBe("h");

    const removed = applyPatch(before, { kind: "removeFeature", featureId: "f_pad" });
    expect(removed.features).toEqual([]);
  });
});

describe("LocalEditService.preview", () => {
  it("fails on skipped ops with the reasons", async () => {
    const svc = new LocalEditService({
      interpret: async () => ({ mesh: null, skipped: [{ id: "f_ring", reason: "pattern_polar: boom" }] }),
      replay: async () => { throw new Error("must not be called"); },
    });
    const r = await svc.preview(plate("10"), params);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("pattern_polar: boom");
  });

  it("passes on a full build and reports volume", async () => {
    const svc = new LocalEditService({
      interpret: async () => goodBuild,
      replay: async () => ({ status: 200, data: {} }),
    });
    const r = await svc.preview(plate("10"), params);
    expect(r).toMatchObject({ ok: true, volume: 1234 });
  });
});

describe("LocalEditService.commit", () => {
  it("no-op edits never reach the server", async () => {
    const svc = new LocalEditService({
      interpret: async () => goodBuild,
      replay: async () => { throw new Error("must not be called"); },
    });
    const t = plate("10");
    const r = await svc.commit(t, t, params);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("no-op");
  });

  it("a failed local preview blocks the replay", async () => {
    const svc = new LocalEditService({
      interpret: async () => ({ mesh: null, skipped: [{ id: "f_pad", reason: "kernel said no" }] }),
      replay: async () => { throw new Error("must not be called"); },
    });
    const r = await svc.commit(plate("10"), plate("12"), params);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("local preview failed");
  });

  it("server rejection is surfaced verbatim", async () => {
    const svc = new LocalEditService({
      interpret: async () => goodBuild,
      replay: async () => ({ status: 422, data: { error: "QC_DIMENSION_COVERAGE" } }),
    });
    const r = await svc.commit(plate("10"), plate("12"), params);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("422");
    expect(r.error).toContain("QC_DIMENSION_COVERAGE");
  });

  it("success names the change and carries the version", async () => {
    const replayed: FeatureTreeLike[] = [];
    const svc = new LocalEditService({
      interpret: async () => goodBuild,
      replay: async (tree) => {
        replayed.push(tree);
        return { status: 200, data: { version: { index: 3, verdict: "pass", sha: "abc123" } } };
      },
    });
    const before = plate("10");
    const after = applyPatch(before, { kind: "setParameter", name: "h", expr: "12" });
    const r = await svc.commit(before, after, params);
    expect(r.ok).toBe(true);
    expect(r.changed).toEqual([{ featureId: "f_pad", kind: "modified" }]);
    expect(r.version).toMatchObject({ index: 3, verdict: "pass", sha: "abc123" });
    expect(replayed).toEqual([after]);
  });
});

describe("applyPatch.setSketchEntity", () => {
  it("moves a circle center immutably, keeping numbers numeric", () => {
    const before: FeatureTreeLike = {
      name: "plate",
      units: { length: "mm", toMillimeter: 1 },
      datums: {},
      sketches: {
        s_bore: {
          id: "s_bore", plane: { kind: "XY" },
          entities: [{ tag: "c1", type: "circle", center: [0, 0], radius: 10 }],
          constraints: [],
        },
      },
      features: [{ id: "f_bore", op: { op: "pocket", sketchId: "s_bore", through: true } }],
      parameters: [],
    };
    const after = applyPatch(before, {
      kind: "setSketchEntity", sketchId: "s_bore", tag: "c1", field: "center", value: [25, 0],
    });
    expect((after.sketches.s_bore.entities[0] as any).center).toEqual([25, 0]);
    expect((before.sketches.s_bore.entities[0] as any).center).toEqual([0, 0]);
    // unknown sketch fails loudly
    expect(() => applyPatch(before, {
      kind: "setSketchEntity", sketchId: "nope", tag: "c1", field: "center", value: [1, 2],
    })).toThrow(/missing/);
  });
});
