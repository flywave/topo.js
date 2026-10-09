// Phase4 patch surface: spline fit-point edits travel the setSketchEntity
// patch (the whole points array crosses), hole op fields ride setOpField.
import { describe, expect, it } from "vitest";
import { applyPatch } from "../src/core/patch.js";
import type { FeatureTreeLike } from "../src/engine/kernel.js";

function treeWithSplinePath(): FeatureTreeLike {
  return {
    name: "s_bend",
    units: { length: "mm", toMillimeter: 1 },
    datums: {},
    sketches: {
      s_path: {
        id: "s_path",
        plane: { kind: "XZ", origin: [0, 0, 0] },
        entities: [
          { tag: "sp1", type: "spline", points: [[0, 0], [40, 40], [80, 0]] },
        ] as any,
        constraints: [],
      },
    },
    features: [],
    parameters: [],
  };
}

describe("phase4 patches", () => {
  it("edits one spline fit point, array replaced wholesale", () => {
    const tree = treeWithSplinePath();
    const next = applyPatch(tree, {
      kind: "setSketchEntity",
      sketchId: "s_path",
      tag: "sp1",
      field: "points",
      value: [[0, 0], [40, 60], [80, 0]],
    });
    const e: any = next.sketches.s_path.entities[0];
    expect(e.points).toEqual([[0, 0], [40, 60], [80, 0]]);
    // the original tree stays intact (undo comparison)
    const before: any = tree.sketches.s_path.entities[0];
    expect(before.points).toEqual([[0, 0], [40, 40], [80, 0]]);
  });

  it("hole op fields ride setOpField (string + number)", () => {
    const tree: FeatureTreeLike = {
      name: "plate",
      units: { length: "mm", toMillimeter: 1 },
      datums: {},
      sketches: {},
      features: [
        { id: "f_holes", name: "holes", op: { op: "hole", sketchId: "s_h", holeType: "through" } as any },
      ],
      parameters: [],
    };
    const next = applyPatch(tree, {
      kind: "setOpField", featureId: "f_holes", field: "holeType", value: "counterbored",
    });
    const next2 = applyPatch(next, {
      kind: "setOpField", featureId: "f_holes", field: "counterboreDiameter", value: "13",
    });
    const op: any = next2.features[0].op;
    expect(op.holeType).toBe("counterbored");
    expect(op.counterboreDiameter).toBe("13");
    expect(op.op).toBe("hole");
  });
});

// 点选加约束 (M3): addSketchConstraint — the picked endpoints' declared
// relation joins the tree's constraint list.
import { applyPatch as applyPatchAdd } from "../src/core/patch.js";

describe("addSketchConstraint (点选加约束)", () => {
  it("appends the constraint and leaves the rest byte-equal", () => {
    const tree = {
      name: "t", units: { length: "mm", toMillimeter: 1 }, datums: {},
      sketches: {
        s: {
          id: "s", plane: { kind: "XY", origin: [0, 0, 0] },
          entities: [
            { tag: "e1", type: "line", start: [0, 0], end: [100, 0] },
            { tag: "e2", type: "line", start: [100, 0], end: [100, 60] },
          ],
          constraints: [{ kind: "LENGTH", tags: ["e1"], value: 100 }],
        },
      },
      features: [], parameters: [],
    } as any;
    const out = applyPatchAdd(tree, {
      kind: "addSketchConstraint", sketchId: "s",
      constraint: { kind: "COINCIDENT", tags: ["e1", "e2"] },
    } as any);
    expect(out.sketches.s.constraints).toHaveLength(2);
    expect(out.sketches.s.constraints[1]).toEqual({ kind: "COINCIDENT", tags: ["e1", "e2"] });
    // untouched entities stay byte-equal (the patch discipline)
    expect(out.sketches.s.entities).toEqual(tree.sketches.s.entities);
    expect(out.sketches.s.constraints[0]).toEqual(tree.sketches.s.constraints[0]);
  });
});
