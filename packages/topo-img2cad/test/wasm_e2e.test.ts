/**
 * End-to-end verification against the real WASM kernel.
 *
 * Everything else in this package tests code as text. This file tests that the
 * text actually builds solids: it runs the emitted feature-tree code inside the
 * sandbox, measures the result, and compares it against the volume and bounding
 * box the geometry should have.
 *
 * It also exercises the re-projection gate against a real BREP solid, which is
 * the only place that path is proven to work end to end.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { getTopo, installGlobals } from "./helpers/topo.js";
import type { FeatureTree } from "../lib/cad/model.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { evaluateSketchSolves } from "../lib/validators/sketch_solve.js";
import { validateGeometry } from "../lib/validators/geometric.js";
import { reprojectShape } from "../lib/validators/reprojection.js";
import { lintFeatureTree } from "../lib/validators/design_intent.js";

let tp: any;

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
}, 120_000);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A 100 x 60 rectangle, dimensioned and constrained, on the XY plane. */
const RECT_SKETCH = {
  id: "s_base",
  plane: { kind: "XY" as const, origin: [0, 0, 0] as [number, number, number] },
  entities: [
    { tag: "e1", type: "line" as const, start: [0, 0] as [number, number], end: [100, 0] as [number, number] },
    { tag: "e2", type: "line" as const, start: [100, 0] as [number, number], end: [100, 60] as [number, number] },
    { tag: "e3", type: "line" as const, start: [100, 60] as [number, number], end: [0, 60] as [number, number] },
    { tag: "e4", type: "line" as const, start: [0, 60] as [number, number], end: [0, 0] as [number, number] },
  ],
  constraints: [
    // Only dimensions and directions are stated. Endpoint joins are derived
    // from the profile's adjacency by the emitter, because the binding's
    // COINCIDENT means "these segments overlap", not "these endpoints meet" —
    // stating it here would fight the derived joins and leave a residual.
    { kind: "LENGTH" as const, tags: ["e1"] as [string], value: 100, note: "overall width" },
    { kind: "ORIENTATION" as const, tags: ["e1"] as [string], value: [1, 0] as [number, number] },
    { kind: "LENGTH" as const, tags: ["e2"] as [string], value: 60, note: "overall depth" },
    { kind: "ORIENTATION" as const, tags: ["e2"] as [string], value: [0, 1] as [number, number] },
    { kind: "LENGTH" as const, tags: ["e3"] as [string], value: 100 },
    { kind: "ORIENTATION" as const, tags: ["e3"] as [string], value: [-1, 0] as [number, number] },
    { kind: "LENGTH" as const, tags: ["e4"] as [string], value: 60 },
    { kind: "ORIENTATION" as const, tags: ["e4"] as [string], value: [0, -1] as [number, number] },
  ],
};

/** An r=15 bore, placed off-origin so its position is also exercised. */
const BORE_SKETCH = {
  id: "s_bore",
  plane: { kind: "XY" as const, origin: [0, 0, 0] as [number, number, number] },
  entities: [
    { tag: "c1", type: "circle" as const, center: [50, 30] as [number, number], radius: 15 },
  ],
  constraints: [
    { kind: "RADIUS" as const, tags: ["c1"] as [string], value: 15, note: "bore radius" },
  ],
};

/** A plain plate: pad only. */
function plateTree(): FeatureTree {
  return {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    // Deep-cloned: a test that edits a sketch must not corrupt the shared fixture.
    sketches: { s_base: structuredClone(RECT_SKETCH) },
    features: [
      {
        id: "f_pad",
        name: "Base plate",
        op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
        drivenBy: ["plateThickness"],
      },
    ],
    parameters: [{ name: "plateThickness", expr: "10", unit: "mm", min: 2 }],
    designIntent: { primaryAxis: "z", minWallThickness: 2, manufacturable: true },
  };
}

/** The plate with a through bore. */
function boredPlateTree(): FeatureTree {
  const tree = plateTree();
  tree.sketches = { ...tree.sketches, s_bore: structuredClone(BORE_SKETCH) };
  tree.features = [
    ...tree.features,
    {
      id: "f_bore",
      name: "Central bore",
      op: { op: "pocket", sketchId: "s_bore", through: true },
      drivenBy: ["plateThickness"],
    },
  ];
  // Relate the bore to the plate thickness so it is not an orphan parameter.
  tree.parameters = [
    { name: "plateThickness", expr: "10", unit: "mm", min: 2 },
    { name: "boreDiameter", expr: "plateThickness * 3", unit: "mm" },
  ];
  return tree;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function build(tree: FeatureTree): {
  shape: any;
  geo: ReturnType<typeof validateGeometry>;
  solves: ReturnType<typeof evaluateSketchSolves>;
  warnings: string[];
  error?: string;
} {
  const built = runBuildFromTree(tree);
  const sandbox = executeInSandbox(
    built.code.source,
    tp,
    undefined,
    tp.gp_Pnt_3,
    tp.Vector,
    tp.gp_Vec_4,
  );
  const geo = validateGeometry(tp, sandbox.shape);
  // Constraints and solve() are emitted into the code, so the reports come back
  // from the run rather than from the build step.
  const solves = evaluateSketchSolves(
    sandbox.solveReports as Parameters<typeof evaluateSketchSolves>[0],
  );
  return {
    shape: sandbox.shape,
    geo,
    solves,
    warnings: built.warnings,
    error: sandbox.error,
  };
}

// ---------------------------------------------------------------------------
// The emitted code must actually build
// ---------------------------------------------------------------------------

describe("emitted feature code builds real solids", () => {
  it("builds a 100x60x10 plate with the expected volume and bbox", () => {
    const tree = plateTree();
    expect(lintFeatureTree(tree).passed).toBe(true);

    const { shape, geo, solves, error } = build(tree);
    expect(error).toBeUndefined();

    // The sketch solver must have converged on the constraints.
    expect(solves.passed).toBe(true);
    expect(solves.reports.s_base.status).toBeGreaterThanOrEqual(1);

    expect(geo.report.shapeValid).toBe(true);
    expect(geo.report.bbox).toBeDefined();

    const [x0, y0, z0, x1, y1, z1] = geo.report.bbox!;
    expect(x1 - x0).toBeCloseTo(100, 3);
    expect(y1 - y0).toBeCloseTo(60, 3);
    expect(z1 - z0).toBeCloseTo(10, 3);

    // Volume is the strongest single check that the right solid came out.
    expect(geo.report.volume).toBeCloseTo(100 * 60 * 10, 0);

    expect(Object.keys(tree.sketches)).toContain("s_base");
    expect(shape).toBeTruthy();
  });

  it("cuts a through bore of the expected volume", () => {
    const tree = boredPlateTree();
    expect(lintFeatureTree(tree).passed).toBe(true);

    const { geo, error } = build(tree);
    expect(error).toBeUndefined();
    expect(geo.report.shapeValid).toBe(true);

    // The two vertical through-cut edges appear as extra faces.
    expect(geo.report.faceCount ?? 0).toBeGreaterThan(6);

    // The outer bbox is untouched by an interior bore.
    const [x0, y0, z0, x1, y1, z1] = geo.report.bbox!;
    expect(x1 - x0).toBeCloseTo(100, 3);
    expect(y1 - y0).toBeCloseTo(60, 3);
    expect(z1 - z0).toBeCloseTo(10, 3);

    // The bore removes exactly pi * r^2 * t of material, which is the
    // strongest possible check that the cut landed where it should.
    const solidPlate = 100 * 60 * 10;
    const boreVolume = Math.PI * 15 * 15 * 10;
    expect(geo.report.volume!).toBeCloseTo(solidPlate - boreVolume, 0);
  });

  it("tracks a driving dimension into the geometry", () => {
    const thin = plateTree();
    thin.parameters = [{ name: "plateThickness", expr: "4", unit: "mm" }];

    const { geo: thickGeo } = build(plateTree());
    const { geo: thinGeo } = build(thin);

    // 10mm plate vs 4mm plate — the parameter really drives the extrusion.
    expect(thickGeo.report.volume).toBeCloseTo(60000, 0);
    expect(thinGeo.report.volume).toBeCloseTo(24000, 0);
  });

  it("refuses to build a tree whose sketch does not close", () => {
    const open = plateTree();
    // Drop the last edge so the loop no longer closes.
    open.sketches.s_base.entities = open.sketches.s_base.entities.slice(0, 3);

    const { geo, error } = build(open);
    // Either the extrude throws or it yields nothing usable; both are failures,
    // and neither is silently accepted.
    const failed = error !== undefined || !geo.report.shapeValid || (geo.report.volume ?? 0) <= 0;
    expect(failed).toBe(true);
  });
});

/** A 6-sided L-bracket: 100x20 leg plus 20x40 leg, 10 thick. Area 2800. */
function lBracketTree(): FeatureTree {
  const loop = [
    { tag: "e1", type: "line" as const, start: [0, 0] as [number, number], end: [100, 0] as [number, number] },
    { tag: "e2", type: "line" as const, start: [100, 0] as [number, number], end: [100, 20] as [number, number] },
    { tag: "e3", type: "line" as const, start: [100, 20] as [number, number], end: [20, 20] as [number, number] },
    { tag: "e4", type: "line" as const, start: [20, 20] as [number, number], end: [20, 60] as [number, number] },
    { tag: "e5", type: "line" as const, start: [20, 60] as [number, number], end: [0, 60] as [number, number] },
    { tag: "e6", type: "line" as const, start: [0, 60] as [number, number], end: [0, 0] as [number, number] },
  ];
  return {
    name: "l_bracket",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_profile: {
        id: "s_profile",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: loop,
        constraints: [
          { kind: "LENGTH", tags: ["e1"], value: 100 },
          { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
          { kind: "LENGTH", tags: ["e2"], value: 20 },
          { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
          { kind: "LENGTH", tags: ["e6"], value: 60 },
          { kind: "ORIENTATION", tags: ["e6"], value: [0, -1] },
        ],
      },
    },
    features: [
      { id: "f_pad", name: "L profile", op: { op: "pad", sketchId: "s_profile", distance: "thickness" } },
    ],
    parameters: [{ name: "thickness", expr: "10", unit: "mm" }],
    designIntent: { primaryAxis: "z", minWallThickness: 2 },
  };
}

/** A stadium: 100 between centres, radius 20 ends. Area 4000 + pi*400. */
function stadiumTree(): FeatureTree {
  return {
    name: "stadium",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_stadium: {
        id: "s_stadium",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [
          { tag: "a1", type: "arc", center: [0, 20], radius: 20, start: [0, 0], end: [0, 40], clockwise: true },
          { tag: "l1", type: "line", start: [0, 40], end: [100, 40] },
          { tag: "a2", type: "arc", center: [100, 20], radius: 20, start: [100, 40], end: [100, 0], clockwise: true },
          { tag: "l2", type: "line", start: [100, 0], end: [0, 0] },
        ],
        constraints: [
          { kind: "RADIUS", tags: ["a1"], value: 20 },
          { kind: "RADIUS", tags: ["a2"], value: 20 },
          { kind: "LENGTH", tags: ["l1"], value: 100 },
        ],
      },
    },
    features: [
      { id: "f_pad", name: "Stadium", op: { op: "pad", sketchId: "s_stadium", distance: "thickness" } },
    ],
    parameters: [{ name: "thickness", expr: "10", unit: "mm" }],
  };
}

// ---------------------------------------------------------------------------
// Arbitrary profiles — the capability that used to be blocked
// ---------------------------------------------------------------------------

describe("arbitrary profiles build", () => {
  it("builds an L-bracket, which the old emitter refused", () => {
    const tree = lBracketTree();
    expect(lintFeatureTree(tree).passed).toBe(true);

    const { geo, error, solves } = build(tree);
    expect(error).toBeUndefined();
    expect(solves.passed).toBe(true);
    expect(geo.report.shapeValid).toBe(true);

    // 100x20 leg + 20x40 leg = 2800 area, 10 thick.
    expect(geo.report.volume).toBeCloseTo(2800 * 10, 0);
    const [x0, y0, z0, x1, y1, z1] = geo.report.bbox!;
    expect(x1 - x0).toBeCloseTo(100, 3);
    expect(y1 - y0).toBeCloseTo(60, 3);
    expect(z1 - z0).toBeCloseTo(10, 3);
  });

  it("builds a line/arc profile with exact arcs, not a tessellation", () => {
    const { geo, error } = build(stadiumTree());
    expect(error).toBeUndefined();

    // A tessellated approximation would land slightly under the true area.
    const exactArea = 100 * 40 + Math.PI * 20 * 20;
    expect(geo.report.volume).toBeCloseTo(exactArea * 10, 0);
  });

  it("cuts an arbitrary profile into an existing body", () => {
    const tree = lBracketTree();
    // A second feature: a rectangular pocket through the L's long leg.
    tree.sketches.s_pocket = {
      id: "s_pocket",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [
        { tag: "p1", type: "line", start: [60, 0], end: [80, 0] },
        { tag: "p2", type: "line", start: [80, 0], end: [80, 10] },
        { tag: "p3", type: "line", start: [80, 10], end: [60, 10] },
        { tag: "p4", type: "line", start: [60, 10], end: [60, 0] },
      ],
      constraints: [
        { kind: "LENGTH", tags: ["p1"], value: 20 },
        { kind: "ORIENTATION", tags: ["p1"], value: [1, 0] },
      ],
    };
    tree.features.push({
      id: "f_pocket",
      name: "Slot",
      op: { op: "pocket", sketchId: "s_pocket", through: true },
    });

    const { geo, error } = build(tree);
    expect(error).toBeUndefined();

    // The slot removes 20 x 10 x 10 of material from the L.
    expect(geo.report.volume).toBeCloseTo(2800 * 10 - 20 * 10 * 10, 0);
  });
});

describe("the solver drives the geometry", () => {
  it("builds the constrained size, not the authored coordinates", () => {
    // The sketch is authored badly on purpose: 80 x 50, while the dimensions say
    // 100 x 60. If the solver is actually wired into the build, the solid comes
    // out 100 x 60. If it is decorative, it comes out 80 x 50.
    const tree = plateTree();
    tree.sketches.s_base = {
      id: "s_base",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [
        { tag: "e1", type: "line", start: [0, 0], end: [80, 0] },
        { tag: "e2", type: "line", start: [80, 0], end: [80, 50] },
        { tag: "e3", type: "line", start: [80, 50], end: [0, 50] },
        { tag: "e4", type: "line", start: [0, 50], end: [0, 0] },
      ],
      constraints: [
        { kind: "LENGTH", tags: ["e1"], value: 100 },
        { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
        { kind: "LENGTH", tags: ["e2"], value: 60 },
        { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
        { kind: "LENGTH", tags: ["e3"], value: 100 },
        { kind: "ORIENTATION", tags: ["e3"], value: [-1, 0] },
        { kind: "LENGTH", tags: ["e4"], value: 60 },
        { kind: "ORIENTATION", tags: ["e4"], value: [0, -1] },
      ],
    };

    const { geo, error, solves } = build(tree);
    expect(error).toBeUndefined();
    expect(solves.passed).toBe(true);

    const [x0, y0, z0, x1, y1, z1] = geo.report.bbox!;
    expect(x1 - x0).toBeCloseTo(100, 2);
    expect(y1 - y0).toBeCloseTo(60, 2);
    expect(z1 - z0).toBeCloseTo(10, 2);
    expect(geo.report.volume).toBeCloseTo(100 * 60 * 10, 0);
  });
});

// ---------------------------------------------------------------------------
// Re-projection against a real solid
// ---------------------------------------------------------------------------

describe("re-projection of a real BREP solid", () => {
  it("matches a reference outline of the correct size and rejects a wrong one", () => {
    const { shape, error } = build(plateTree());
    expect(error).toBeUndefined();

    const W = 128;
    const H = 128;

    // Correct outline: the plate's 100x60 face, seen along the Z axis. The XY
    // basis puts screen x on X and screen y on Y, so the reference rectangle is
    // the plate's own footprint.
    const correct = reprojectShape(shape, {
      view: "XY",
      width: W,
      height: H,
      reference: {
        kind: "loops",
        width: W,
        height: H,
        loops: [[[0, 0], [100, 0], [100, 60], [0, 60]] as Array<[number, number]>],
      },
    });

    expect(correct.compared).toBe(true);
    expect(correct.views[0].referencePixels).toBeGreaterThan(0);
    expect(correct.views[0].modelPixels).toBeGreaterThan(0);
    // A 100x60 pad extruded along +Z projects to exactly its own outline.
    expect(correct.views[0].iou).toBeGreaterThan(0.95);

    // A reference twice the size must not pass.
    const wrong = reprojectShape(shape, {
      view: "XY",
      width: W,
      height: H,
      reference: {
        kind: "loops",
        width: W,
        height: H,
        loops: [[[0, 0], [200, 0], [200, 120], [0, 120]] as Array<[number, number]>],
      },
    });

    expect(wrong.views[0].iou).toBeLessThan(0.5);
    expect(wrong.passed).toBe(false);
    expect(wrong.issues.some((i) => i.code === "RPR_LOW_IOU")).toBe(true);
  });

  it("localizes a size error as a silhouette deviation in pixels", () => {
    const { shape } = build(plateTree());

    const W = 256;
    const H = 256;
    // Reference 10% wider than the model.
    const report = reprojectShape(shape, {
      view: "XY",
      width: W,
      height: H,
      reference: {
        kind: "loops",
        width: W,
        height: H,
        loops: [[[0, 0], [110, 0], [110, 60], [0, 60]] as Array<[number, number]>],
      },
    });

    expect(report.views[0].iou).toBeLessThan(0.98);

    // The deviation is directional, and here the directions differ in a way
    // that says exactly what is wrong: every model pixel is inside the wider
    // reference (0), while the reference has a strip the model does not reach.
    expect(report.views[0].deviation.modelToReference).toBeCloseTo(0, 5);
    expect(report.views[0].deviation.referenceToModel).toBeGreaterThan(0);
    expect(isFinite(report.views[0].deviation.max)).toBe(true);

    // Which is the same story IoU tells: the model is under-covering.
    expect(report.views[0].recall).toBeLessThan(report.views[0].precision);
  });

  it("projects without a reference instead of inventing a verdict", () => {
    const { shape } = build(plateTree());

    const front = reprojectShape(shape, { view: "front", width: 64, height: 64 });
    const top = reprojectShape(shape, { view: "top", width: 64, height: 64 });

    // Projection alone is not a check: with no reference there is nothing to
    // compare against, and that is reported rather than scored.
    expect(front.compared).toBe(false);
    expect(top.compared).toBe(false);
    expect(front.views).toEqual([]);
    expect(front.passed).toBe(true);
  });
});
