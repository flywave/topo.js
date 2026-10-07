// Pure framework tests (no kernel): store, commands, digest/changed-features.
import { describe, expect, it } from "vitest";
import { Store } from "../src/core/store.js";
import { Commands } from "../src/core/commands.js";
import { TreeDigest, ChangedFeatures } from "../src/core/digest.js";
import type { FeatureTreeLike } from "../src/engine/kernel.js";

describe("Store", () => {
  it("set/subscribe with change detection", () => {
    const store = new Store({ a: 1, b: "x" });
    const seen: number[] = [];
    store.select("a", (v) => seen.push(v));
    store.set({ a: 1 }); // no change: no notify
    store.set({ a: 2 });
    expect(seen).toEqual([1, 2]);
  });
});

describe("Commands", () => {
  it("register/execute + duplicate id throws", async () => {
    const cmds = new Commands();
    const ran: string[] = [];
    cmds.register({ id: "edit.apply", run: () => void ran.push("apply") });
    expect(() => cmds.register({ id: "edit.apply", run: () => {} })).toThrow(/already registered/);
    await cmds.execute("edit.apply");
    expect(ran).toEqual(["apply"]);
    expect(() => cmds.execute("nope")).toThrow(/not registered/);
  });
});

// ---------------------------------------------------------------------------
// digest / changed features — mirror of go-cadgen session/digest.go semantics
// ---------------------------------------------------------------------------

function plate(boreX: number, extraFeature?: Record<string, unknown>): FeatureTreeLike {
  const tree: FeatureTreeLike = {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: {},
    sketches: {
      s_base: { id: "s_base", plane: { kind: "XY" }, entities: [], constraints: [] },
      s_bore: { id: "s_bore", plane: { kind: "XY" }, entities: [], constraints: [] },
    },
    features: [
      { id: "f_pad", op: { op: "pad", sketchId: "s_base", distance: "10" } },
      { id: "f_bore", op: { op: "pocket", sketchId: "s_bore", through: true } },
    ],
    parameters: [],
  };
  if (boreX !== 0) tree.sketches.s_bore.entities.push({ tag: "c1", moved: boreX });
  if (extraFeature) tree.features.push(extraFeature as any);
  return tree;
}

describe("TreeDigest", () => {
  it("stable for identical trees, sensitive to a moved bore, ignores provenance", () => {
    const a = plate(0), b = plate(0);
    (a as any).provenance = { note: "x" };
    expect(TreeDigest(a)).toBe(TreeDigest(b));
    expect(TreeDigest(plate(25))).not.toBe(TreeDigest(plate(0)));
  });
});

describe("ChangedFeatures", () => {
  it("names modified/added/removed; sketch-only edits attribute to the consumer", () => {
    const before = plate(0);
    const moved = plate(25);
    expect(ChangedFeatures(before, moved)).toEqual([
      { featureId: "f_bore", kind: "modified" },
    ]);

    const withExtra = plate(0);
    withExtra.features.push({ id: "f_fillet", op: { op: "fillet" } });
    expect(ChangedFeatures(before, withExtra)).toEqual([
      { featureId: "f_fillet", kind: "added" },
    ]);
    expect(ChangedFeatures(withExtra, before)).toEqual([
      { featureId: "f_fillet", kind: "removed" },
    ]);
    expect(ChangedFeatures(before, plate(0))).toEqual([]);
  });
});
