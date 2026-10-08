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
