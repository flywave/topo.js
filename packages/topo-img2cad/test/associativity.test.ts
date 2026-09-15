/**
 * Two ways a parameter that DOES drive the model was reported as decorative.
 *
 * The associativity gate exists to catch a "parametric" model whose parameters
 * drive nothing. Getting it wrong in the other direction is worse than not having
 * it: a false accusation invites a user to delete a parameter that was doing real
 * work. Both cases below come from a live run whose four inert parameters were
 * all false.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { getTopo, installGlobals } from "./helpers/topo.js";
import { reconcileSketch } from "../lib/cad/reconcile.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { validateGeometry } from "../lib/validators/geometric.js";
import { resolveSketchValues } from "../lib/cad/resolve_sketch.js";
import type { FeatureTree, SketchSpec } from "../lib/cad/model.js";

let tp: any;

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
}, 120_000);

// ---------------------------------------------------------------------------

/** A 120x80 rectangle whose long edges are dimensioned together, as a model writes it. */
const TWO_TAG_SKETCH: SketchSpec = {
  id: "s",
  plane: { kind: "XY", origin: [0, 0, 0] },
  entities: [
    { tag: "e1", type: "line", start: [0, 0], end: [120, 0] },
    { tag: "e2", type: "line", start: [120, 0], end: [120, 80] },
    { tag: "e3", type: "line", start: [120, 80], end: [0, 80] },
    { tag: "e4", type: "line", start: [0, 80], end: [0, 0] },
  ],
  constraints: [
    { kind: "LENGTH", tags: ["e1", "e3"], value: 120 },
    { kind: "LENGTH", tags: ["e2", "e4"], value: 80 },
  ],
};

describe("a dimension that names several entities", () => {
  it("dimensions each of them", () => {
    const r = reconcileSketch(TWO_TAG_SKETCH);
    const byTag = new Map(r.entities.map((e) => [e.tag, e]));
    const lengthOf = (tag: string) => {
      const e = byTag.get(tag)!;
      return Math.hypot(e.end![0] - e.start![0], e.end![1] - e.start![1]);
    };

    // Authored 120 and 80 already, so the point is that both are APPLIED rather
    // than silently skipped.
    expect(lengthOf("e1")).toBeCloseTo(120, 6);
    expect(lengthOf("e2")).toBeCloseTo(80, 6);
    expect(lengthOf("e3")).toBeCloseTo(120, 6);
    expect(lengthOf("e4")).toBeCloseTo(80, 6);

    expect(r.report.applied.filter((a) => a.startsWith("LENGTH")).length).toBe(4);
    expect(r.report.unhonoured).toEqual([]);
  });

  it("does not read a relational constraint per-entity", () => {
    // DISTANCE says something about the PAIR; applying it to each would be wrong.
    const r = reconcileSketch({
      ...TWO_TAG_SKETCH,
      constraints: [{ kind: "DISTANCE", tags: ["e1", "e3"], value: [0, 0, 50] }],
    });
    expect(r.report.applied.filter((a) => a.startsWith("DISTANCE")).length).toBe(0);
    expect(r.report.unhonoured).toEqual([]);
  });

  it("still reports a genuine conflict on one entity", () => {
    const r = reconcileSketch({
      ...TWO_TAG_SKETCH,
      constraints: [
        { kind: "LENGTH", tags: ["e1"], value: 120 },
        { kind: "LENGTH", tags: ["e1"], value: 100 },
      ],
    });
    expect(r.report.unhonoured.some((u) => /conflicts/.test(u.reason))).toBe(true);
  });
});

// ---------------------------------------------------------------------------

/** A 120x80 plate whose four corner holes are placed by offset parameters. */
function holedPlate(offsetX: number, offsetY: number, radius = 6): FeatureTree {
  return {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_base: {
        id: "s_base",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [-60, -40], end: [60, -40] },
          { tag: "e2", type: "line", start: [60, -40], end: [60, 40] },
          { tag: "e3", type: "line", start: [60, 40], end: [-60, 40] },
          { tag: "e4", type: "line", start: [-60, 40], end: [-60, -40] },
        ],
        constraints: [
          { kind: "LENGTH", tags: ["e1", "e3"], value: "overallWidth" },
          { kind: "LENGTH", tags: ["e2", "e4"], value: "overallHeight" },
        ],
      },
      s_holes: {
        id: "s_holes",
        plane: { kind: "XY", origin: [0, 0, 0] },
        // Symmetric, so moving them outward leaves the centre of mass untouched.
        entities: [
          { tag: "c1", type: "circle", center: ["-overallWidth/2 + offsetX", "-overallHeight/2 + offsetY"], radius: "holeDiameter/2" },
          { tag: "c2", type: "circle", center: ["overallWidth/2 - offsetX", "-overallHeight/2 + offsetY"], radius: "holeDiameter/2" },
          { tag: "c3", type: "circle", center: ["overallWidth/2 - offsetX", "overallHeight/2 - offsetY"], radius: "holeDiameter/2" },
          { tag: "c4", type: "circle", center: ["-overallWidth/2 + offsetX", "overallHeight/2 - offsetY"], radius: "holeDiameter/2" },
        ],
        constraints: [],
      },
    },
    features: [
      { id: "f1", name: "Pad", op: { op: "pad", sketchId: "s_base", distance: "thickness" } },
      { id: "f2", name: "Holes", op: { op: "pocket", sketchId: "s_holes", through: true } },
    ],
    parameters: [
      { name: "overallWidth", expr: "120", unit: "mm" },
      { name: "overallHeight", expr: "80", unit: "mm" },
      { name: "thickness", expr: "10", unit: "mm" },
      { name: "holeDiameter", expr: "12", unit: "mm" },
      { name: "offsetX", expr: String(offsetX), unit: "mm" },
      { name: "offsetY", expr: String(offsetY), unit: "mm" },
    ],
  };
}

describe("a parameter that only positions a feature", () => {
  /** Exactly the probe the pipeline builds: volume, bbox, faces, centroid, vertex moment. */
  function probe(tree: FeatureTree, override: Record<string, number>) {
    const built = runBuildFromTree(tree, override);
    const sandbox = executeInSandbox(built.code.source, tp, undefined, undefined, undefined, undefined);
    expect(sandbox.error).toBeUndefined();
    const geo = validateGeometry(tp, sandbox.shape);
    const [x0, y0, z0, x1, y1, z1] = geo.report.bbox!;

    const shape = sandbox.shape as { mesh?: (...a: unknown[]) => { vertices: number[][] } };
    const mesh = shape.mesh!(0.1, 0.1, 30, false);
    let moment = 0;
    for (const positions of mesh.vertices) {
      for (let i = 0; i + 2 < positions.length; i += 3) {
        moment += positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2;
      }
    }

    const com = geo.report.centerOfMass ?? [0, 0, 0];
    return {
      volume: geo.report.volume,
      dx: x1 - x0,
      dy: y1 - y0,
      dz: z1 - z0,
      faces: geo.report.faceCount,
      // `|| 0` folds -0 into 0: the centroid is at the origin either way, and the
      // sign of a zero is not a geometric difference.
      com: com.map((v) => Number(v.toFixed(3)) || 0),
      moment: Number(moment.toFixed(3)),
    };
  }

  it("is invisible to volume, bounding box, face count and centre of mass", () => {
    const tree = holedPlate(25.07, 16.26);
    const before = probe(tree, {});
    const after = probe(tree, { offsetX: 27.577 });

    // The aggregate measures really do not move — which is why the parameter was
    // reported as inert. Four symmetric holes shifting outward remove the same
    // material and keep their centroid at the plate's centre.
    expect(after.volume).toBeCloseTo(before.volume!, 6);
    expect(after.dx).toBeCloseTo(before.dx, 6);
    expect(after.dy).toBeCloseTo(before.dy, 6);
    expect(after.faces).toBe(before.faces!);
    expect(after.com).toEqual(before.com);
  });

  it("is caught by the vertex moment", () => {
    const tree = holedPlate(25.07, 16.26);
    const before = probe(tree, {});
    const after = probe(tree, { offsetX: 27.577 });

    // Moving || the hole centre from the origin by 2.5mm must move this.
    expect(Math.abs(after.moment - before.moment)).toBeGreaterThan(1);
  }, 120_000);

  it("resolves the parameters the hole positions are written in terms of", () => {
    const tree = holedPlate(25.07, 16.26);
    const { tree: resolved, issues } = resolveSketchValues(tree, {
      overallWidth: 120,
      overallHeight: 80,
      thickness: 10,
      holeDiameter: 12,
      offsetX: 25.07,
      offsetY: 16.26,
    });
    expect(issues).toEqual([]);

    const first = resolved.sketches.s_holes.entities[0];
    expect(first.center![0]).toBeCloseTo(-60 + 25.07, 6);
    expect(first.center![1]).toBeCloseTo(-40 + 16.26, 6);
    expect(first.radius).toBe(6);
  }, 120_000);
});
