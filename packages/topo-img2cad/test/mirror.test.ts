/**
 * `mirror` with a named source.
 *
 * The emitter used to ignore `ofFeature` entirely and mirror the whole body. A
 * live run asked to mirror a mounting hole about YZ and then about XZ, got the
 * BODY mirrored twice, and produced a plate 20mm thick with twice the volume —
 * while the feature tree said 10. Nothing caught it: the silhouette is taken
 * along the sketch normal, which is blind to thickness, and a single view leaves
 * no second view to disagree with.
 *
 * So the first test here is the regression that matters — the part is the
 * thickness the tree says — and the rest pin down what the emitter will and will
 * not express.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { getTopo, installGlobals } from "./helpers/topo.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { validateGeometry } from "../lib/validators/geometric.js";
import type { FeatureTree } from "../lib/cad/model.js";

let tp: any;

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
}, 120_000);

/** A 120x80x10 plate with one Ø12 hole at (40, 20), as the live run's tree had it. */
function plateWithFeatureToMirror(mirrors: Array<Record<string, unknown>>): FeatureTree {
  return {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_rect: {
        id: "s_rect",
        plane: { kind: "XZ", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [-60, -40], end: [60, -40] },
          { tag: "e2", type: "line", start: [60, -40], end: [60, 40] },
          { tag: "e3", type: "line", start: [60, 40], end: [-60, 40] },
          { tag: "e4", type: "line", start: [-60, 40], end: [-60, -40] },
        ],
        constraints: [
          { kind: "LENGTH", tags: ["e1"], value: 120 },
          { kind: "LENGTH", tags: ["e2"], value: 80 },
        ],
      },
      s_hole: {
        id: "s_hole",
        plane: { kind: "XZ", origin: [0, 0, 0] },
        entities: [{ tag: "c", type: "circle", center: [40, 20], radius: 6 }],
        constraints: [{ kind: "RADIUS", tags: ["c"], value: 6 }],
      },
    },
    features: [
      { id: "f_plate", name: "Plate", op: { op: "pad", sketchId: "s_rect", distance: "t" } },
      { id: "f_hole", name: "Hole", op: { op: "pocket", sketchId: "s_hole", through: true } },
      ...(mirrors as unknown as FeatureTree["features"]),
    ],
    parameters: [{ name: "t", expr: "10", unit: "mm" }],
  };
}

function build(tree: FeatureTree) {
  const built = runBuildFromTree(tree);
  const sandbox = executeInSandbox(built.code.source, tp, undefined, undefined, undefined, undefined);
  return { built, sandbox, geo: sandbox.error ? null : validateGeometry(tp, sandbox.shape) };
}

describe("mirroring a named feature", () => {
  it("reflects the feature, not the part — the thickness stays what the tree says", () => {
    const tree = plateWithFeatureToMirror([
      { id: "f_mx", name: "Mirror in X", op: { op: "mirror", plane: { kind: "YZ", origin: [0, 0, 0] }, ofFeature: "f_hole" } },
    ]);

    const { sandbox, geo } = build(tree);
    expect(sandbox.error).toBeUndefined();
    expect(geo!.report.shapeValid).toBe(true);

    const bbox = geo!.report.bbox!;
    expect(bbox[3] - bbox[0]).toBeCloseTo(120, 2);
    expect(bbox[5] - bbox[2]).toBeCloseTo(80, 2);
    // The regression: mirroring the body doubled this to 20.
    expect(bbox[4] - bbox[1]).toBeCloseTo(10, 2);

    // Two holes, not one and not a duplicated plate.
    const expected = 120 * 80 * 10 - 2 * Math.PI * 6 * 6 * 10;
    expect(geo!.report.volume!).toBeCloseTo(expected, 0);
  }, 120_000);

  it("emits the reflection on the tool, and cuts with it", () => {
    const tree = plateWithFeatureToMirror([
      { id: "f_mx", name: "Mirror in X", op: { op: "mirror", plane: { kind: "YZ", origin: [0, 0, 0] }, ofFeature: "f_hole" } },
    ]);
    const { built } = build(tree);

    expect(built.code.source).toContain('tool_f_hole.mirror("YZ", undefined, true)');
    expect(built.code.source).toContain("body = body.cut(tool_f_mx_1_0, true, 0);");
    // The body itself is never mirrored.
    expect(built.code.source).not.toMatch(/body = body\.mirror/);
  }, 120_000);

  it("still mirrors the body when no source is named", () => {
    const tree = plateWithFeatureToMirror([
      { id: "f_mb", name: "Mirror the body", op: { op: "mirror", plane: { kind: "XZ", origin: [0, 0, 0] } } },
    ]);
    const { built, sandbox } = build(tree);
    expect(built.code.source).toContain('body = body.mirror("XZ"');
    expect(sandbox.error).toBeUndefined();
  }, 120_000);

  it("refuses a mirror of a mirror rather than emitting something that throws", () => {
    // A Workplane that is already a reflection cannot be mirrored again — the
    // kernel rejects it — and composing two reflections another way measured
    // wrong (a 120x10x80 plate came back 124.8 x 18.7).
    const tree = plateWithFeatureToMirror([
      { id: "f_mx", name: "Mirror in X", op: { op: "mirror", plane: { kind: "YZ", origin: [0, 0, 0] }, ofFeature: "f_hole" } },
      { id: "f_my", name: "Mirror in Y", op: { op: "mirror", plane: { kind: "XZ", origin: [0, 0, 0] }, ofFeature: "f_mx" } },
    ]);

    const { built, sandbox } = build(tree);
    expect(sandbox.error).toBeUndefined();
    expect(built.warnings.join(" ")).toMatch(/mirroring a mirror is not supported/);
    expect(built.code.source).toContain("// skipped:");

    // And what it did emit is a sound part, not a broken one.
    expect(validateGeometry(tp, sandbox.shape).report.shapeValid).toBe(true);
  }, 120_000);
});
