/**
 * Multi-component profile tests — sketches with N >= 2 disjoint closed
 * components.  These test the classifyProfile / emitProfileGeometry path for
 * sketches that the emitter previously rejected ("no closed profile can be
 * built").
 *
 * Kernel behaviour (measured against the real WASM):
 *   - sk.circle() places at sketch-local (0,0) with no center parameter.
 *   - assemble() crashes when called after sk.circle().
 *   - Multiple circles in one sketch all overlap at (0,0).
 *   - Mixed circle+loop with assemble DOES work.
 *
 * Therefore multi-component sketches are emitted as separate sketches per
 * component, each extruded individually, and the results are unioned into a
 * compound.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { getTopo, installGlobals } from "./helpers/topo.js";
import type { FeatureTree, SketchSpec } from "../lib/cad/model.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { reconcileSketch } from "../lib/cad/reconcile.js";
import { findClosedComponents } from "../lib/cad/chain.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { validateGeometry } from "../lib/validators/geometric.js";
import {
  classifyProfile,
  type ClassifiedProfile,
  type MultiComponentProfile,
} from "../lib/cad/sketch_codegen.js";

let tp: any;

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
}, 120_000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function build(tree: FeatureTree) {
  const built = runBuildFromTree(tree);
  const sandbox = executeInSandbox(
    built.code.source,
    tp,
    undefined,
    tp.gp_Pnt_3,
    tp.Vector,
    tp.gp_Vec_4,
  );
  const geo = sandbox.shape ? validateGeometry(tp, sandbox.shape) : null;
  return {
    shape: sandbox.shape,
    geo: geo?.report ?? null,
    error: sandbox.error,
    warnings: built.warnings,
    code: built.code.source,
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** 120x80 base pad sketch. */
function basePadSketch(): SketchSpec {
  return {
    id: "s_base",
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [
      { tag: "e1", type: "line", start: [0, 0], end: [120, 0] },
      { tag: "e2", type: "line", start: [120, 0], end: [120, 80] },
      { tag: "e3", type: "line", start: [120, 80], end: [0, 80] },
      { tag: "e4", type: "line", start: [0, 80], end: [0, 0] },
    ],
    constraints: [
      { kind: "LENGTH", tags: ["e1"], value: 120 },
      { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
      { kind: "LENGTH", tags: ["e2"], value: 80 },
      { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
    ],
  };
}

/** Four corner holes sketch — the model's actual output. */
function cornerHolesSketch(): SketchSpec {
  return {
    id: "s_cornerHoles",
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [
      { tag: "c2", type: "circle", center: [20, 20], radius: 6 },
      { tag: "c3", type: "circle", center: [100, 20], radius: 6 },
      { tag: "c4", type: "circle", center: [100, 60], radius: 6 },
      { tag: "c5", type: "circle", center: [20, 60], radius: 6 },
    ],
    constraints: [],
  };
}

/** Feature tree: 120x80x10 plate with four corner holes (through pocket). */
function fourHoleTree(): FeatureTree {
  return {
    name: "four_holes",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_base: basePadSketch(),
      s_cornerHoles: cornerHolesSketch(),
    },
    features: [
      { id: "f_pad", name: "Base plate", op: { op: "pad", sketchId: "s_base", distance: "10" } },
      {
        id: "f_holes",
        name: "Corner holes",
        op: { op: "pocket", sketchId: "s_cornerHoles", through: true },
      },
    ],
    parameters: [],
  };
}

/** Two disjoint rectangular loops in one sketch. */
function twoLoopsSketch(): SketchSpec {
  return {
    id: "s_twoLoops",
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [
      // Rectangle 1: 20x20 at origin
      { tag: "a1", type: "line", start: [0, 0], end: [20, 0] },
      { tag: "a2", type: "line", start: [20, 0], end: [20, 20] },
      { tag: "a3", type: "line", start: [20, 20], end: [0, 20] },
      { tag: "a4", type: "line", start: [0, 20], end: [0, 0] },
      // Rectangle 2: 20x20 at (60, 40)
      { tag: "b1", type: "line", start: [60, 40], end: [80, 40] },
      { tag: "b2", type: "line", start: [80, 40], end: [80, 60] },
      { tag: "b3", type: "line", start: [80, 60], end: [60, 60] },
      { tag: "b4", type: "line", start: [60, 60], end: [60, 40] },
    ],
    constraints: [
      { kind: "LENGTH", tags: ["a1"], value: 20 },
      { kind: "ORIENTATION", tags: ["a1"], value: [1, 0] },
      { kind: "LENGTH", tags: ["b1"], value: 20 },
      { kind: "ORIENTATION", tags: ["b1"], value: [1, 0] },
    ],
  };
}

/** Mixed sketch: one rectangle loop + one circle. */
function mixedSketch(): SketchSpec {
  return {
    id: "s_mixed",
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [
      // Rectangle: 40x30 at origin
      { tag: "r1", type: "line", start: [0, 0], end: [40, 0] },
      { tag: "r2", type: "line", start: [40, 0], end: [40, 30] },
      { tag: "r3", type: "line", start: [40, 30], end: [0, 30] },
      { tag: "r4", type: "line", start: [0, 30], end: [0, 0] },
      // Circle at (80, 15) with radius 10
      { tag: "c1", type: "circle", center: [80, 15], radius: 10 },
    ],
    constraints: [
      { kind: "LENGTH", tags: ["r1"], value: 40 },
      { kind: "ORIENTATION", tags: ["r1"], value: [1, 0] },
      { kind: "LENGTH", tags: ["r2"], value: 30 },
      { kind: "ORIENTATION", tags: ["r2"], value: [0, 1] },
    ],
  };
}

// ---------------------------------------------------------------------------
// Classification tests
// ---------------------------------------------------------------------------

describe("classifyProfile multi-component", () => {
  it("classifies four disjoint circles as multi", () => {
    const result = classifyProfile(cornerHolesSketch().entities);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("multi");
    const multi = result as MultiComponentProfile;
    expect(multi.components.length).toBe(4);
    for (const comp of multi.components) {
      expect(comp.kind).toBe("circle");
    }
  });

  it("classifies two disjoint loops as multi", () => {
    const result = classifyProfile(twoLoopsSketch().entities);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("multi");
    const multi = result as MultiComponentProfile;
    expect(multi.components.length).toBe(2);
    for (const comp of multi.components) {
      expect(comp.kind).toBe("loop");
    }
  });

  it("classifies mixed circle + loop as multi", () => {
    const result = classifyProfile(mixedSketch().entities);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("multi");
    const multi = result as MultiComponentProfile;
    expect(multi.components.length).toBe(2);
    const kinds = multi.components.map((c) => c.kind).sort();
    expect(kinds).toEqual(["circle", "loop"]);
  });

  it("still classifies a single circle as circle", () => {
    const result = classifyProfile([
      { tag: "c1", type: "circle", center: [50, 30], radius: 10 },
    ]);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("circle");
  });

  it("still classifies a single loop as loop", () => {
    const result = classifyProfile(basePadSketch().entities);
    expect(result).not.toBeNull();
    expect(result!.kind).toBe("loop");
  });

  it("returns null for an open chain", () => {
    const open = basePadSketch().entities.slice(0, 3);
    expect(classifyProfile(open)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// End-to-end: four corner holes
// ---------------------------------------------------------------------------

describe("four corner holes pocket", () => {
  it("builds a 120x80x10 plate with four r=6 through-holes", () => {
    const tree = fourHoleTree();
    const result = build(tree);
    expect(result.error).toBeUndefined();
    expect(result.geo).toBeTruthy();
    expect(result.geo!.shapeValid).toBe(true);

    const expected = 120 * 80 * 10 - 4 * Math.PI * 6 * 6 * 10;
    const actual = result.geo!.volume!;
    console.log("four holes volume:", actual, "expected:", expected, "ratio:", actual / expected);
    // Within 1% — tolerance covers tessellation of the bores.
    expect(actual).toBeCloseTo(expected, -1);

    const [x0, y0, z0, x1, y1, z1] = result.geo!.bbox!;
    expect(x1 - x0).toBeCloseTo(120, 3);
    expect(y1 - y0).toBeCloseTo(80, 3);
    expect(z1 - z0).toBeCloseTo(10, 3);
  });

  it("emitted code compiles and runs without errors", () => {
    const tree = fourHoleTree();
    const result = build(tree);
    expect(result.error).toBeUndefined();
    // The emitted code should contain union calls for the multi-component sketch.
    expect(result.code).toContain(".union(");
  });
});

// ---------------------------------------------------------------------------
// Two disjoint rectangular loops
// ---------------------------------------------------------------------------

describe("two disjoint rectangular loops", () => {
  it("builds a pocket from two rectangular loops in one sketch", () => {
    const tree: FeatureTree = {
      name: "two_loops",
      units: { length: "mm", toMillimeter: 1 },
      datums: { planes: {}, axes: {} },
      sketches: {
        s_base: basePadSketch(),
        s_twoLoops: twoLoopsSketch(),
      },
      features: [
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_base", distance: "10" } },
        {
          id: "f_pocket",
          name: "Two pockets",
          op: { op: "pocket", sketchId: "s_twoLoops", through: true },
        },
      ],
      parameters: [],
    };
    const result = build(tree);
    expect(result.error).toBeUndefined();
    expect(result.geo).toBeTruthy();
    expect(result.geo!.shapeValid).toBe(true);

    // Two 20x20 pockets through 10mm plate: 120*80*10 - 2*(20*20*10) = 96000 - 8000 = 88000
    const expected = 120 * 80 * 10 - 2 * 20 * 20 * 10;
    console.log("two loops volume:", result.geo!.volume, "expected:", expected);
    expect(result.geo!.volume).toBeCloseTo(expected, -1);
  });
});

// ---------------------------------------------------------------------------
// Mixed: one circle + one loop
// ---------------------------------------------------------------------------

describe("mixed circle + loop sketch", () => {
  it("builds a pocket from a circle and a rectangle in one sketch", () => {
    const tree: FeatureTree = {
      name: "mixed",
      units: { length: "mm", toMillimeter: 1 },
      datums: { planes: {}, axes: {} },
      sketches: {
        s_base: {
          id: "s_base",
          plane: { kind: "XY", origin: [0, 0, 0] },
          entities: [
            { tag: "e1", type: "line", start: [0, 0], end: [120, 0] },
            { tag: "e2", type: "line", start: [120, 0], end: [120, 80] },
            { tag: "e3", type: "line", start: [120, 80], end: [0, 80] },
            { tag: "e4", type: "line", start: [0, 80], end: [0, 0] },
          ],
          constraints: [
            { kind: "LENGTH", tags: ["e1"], value: 120 },
            { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
            { kind: "LENGTH", tags: ["e2"], value: 80 },
            { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
          ],
        },
        s_mixed: mixedSketch(),
      },
      features: [
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_base", distance: "10" } },
        {
          id: "f_pocket",
          name: "Mixed pocket",
          op: { op: "pocket", sketchId: "s_mixed", through: true },
        },
      ],
      parameters: [],
    };
    const result = build(tree);
    expect(result.error).toBeUndefined();
    expect(result.geo).toBeTruthy();
    expect(result.geo!.shapeValid).toBe(true);

    // Rectangle 40x30 + circle pi*10^2, through 10mm plate
    const expected = 120 * 80 * 10 - (40 * 30 + Math.PI * 10 * 10) * 10;
    console.log("mixed volume:", result.geo!.volume, "expected:", expected);
    expect(result.geo!.volume).toBeCloseTo(expected, -1);
  });
});

// ---------------------------------------------------------------------------
// Existing single-circle and single-loop cases still produce identical output
// ---------------------------------------------------------------------------

describe("backward compatibility", () => {
  it("single circle pocket still works end-to-end", () => {
    const tree: FeatureTree = {
      name: "single_circle",
      units: { length: "mm", toMillimeter: 1 },
      datums: { planes: {}, axes: {} },
      sketches: {
        s_base: basePadSketch(),
        s_bore: {
          id: "s_bore",
          plane: { kind: "XY", origin: [0, 0, 0] },
          entities: [{ tag: "c1", type: "circle", center: [60, 40], radius: 15 }],
          constraints: [{ kind: "RADIUS", tags: ["c1"], value: 15 }],
        },
      },
      features: [
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_base", distance: "10" } },
        {
          id: "f_bore",
          name: "Bore",
          op: { op: "pocket", sketchId: "s_bore", through: true },
        },
      ],
      parameters: [],
    };
    const result = build(tree);
    expect(result.error).toBeUndefined();
    expect(result.geo!.shapeValid).toBe(true);

    const expected = 120 * 80 * 10 - Math.PI * 15 * 15 * 10;
    expect(result.geo!.volume).toBeCloseTo(expected, 0);
  });

  it("single loop pocket still works end-to-end", () => {
    const tree: FeatureTree = {
      name: "single_loop",
      units: { length: "mm", toMillimeter: 1 },
      datums: { planes: {}, axes: {} },
      sketches: {
        s_base: basePadSketch(),
        s_slot: {
          id: "s_slot",
          plane: { kind: "XY", origin: [0, 0, 0] },
          entities: [
            { tag: "p1", type: "line", start: [50, 30], end: [70, 30] },
            { tag: "p2", type: "line", start: [70, 30], end: [70, 50] },
            { tag: "p3", type: "line", start: [70, 50], end: [50, 50] },
            { tag: "p4", type: "line", start: [50, 50], end: [50, 30] },
          ],
          constraints: [
            { kind: "LENGTH", tags: ["p1"], value: 20 },
            { kind: "ORIENTATION", tags: ["p1"], value: [1, 0] },
          ],
        },
      },
      features: [
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_base", distance: "10" } },
        {
          id: "f_slot",
          name: "Slot",
          op: { op: "pocket", sketchId: "s_slot", through: true },
        },
      ],
      parameters: [],
    };
    const result = build(tree);
    expect(result.error).toBeUndefined();
    expect(result.geo!.shapeValid).toBe(true);

    const expected = 120 * 80 * 10 - 20 * 20 * 10;
    expect(result.geo!.volume).toBeCloseTo(expected, 0);
  });

  it("single circle emitted code is unchanged", () => {
    const tree: FeatureTree = {
      name: "test",
      units: { length: "mm", toMillimeter: 1 },
      datums: { planes: {}, axes: {} },
      sketches: {
        s_bore: {
          id: "s_bore",
          plane: { kind: "XY", origin: [0, 0, 0] },
          entities: [{ tag: "c1", type: "circle", center: [50, 30], radius: 15 }],
          constraints: [],
        },
      },
      features: [
        { id: "f_cyl", name: "Cyl", op: { op: "pad", sketchId: "s_bore", distance: "20" } },
      ],
      parameters: [],
    };
    const built = runBuildFromTree(tree);
    // Single circle should NOT contain union calls.
    expect(built.code.source).not.toContain(".union(");
    // Single circle should use sketch.circle + finalize (no assemble).
    expect(built.code.source).toContain(".circle(");
    expect(built.code.source).toContain(".finalize()");
    expect(built.code.source).not.toContain(".assemble(");
  });
});

/**
 * Two disjoint loops in one sketch were previously reported as unhonoured —
 * "entities do not form a single closed chain" — and skipped, so a multi-profile
 * sketch raised a false alarm on every emission AND had its dimensions ignored.
 * The alarm would have reached the repair loop, which would then have tried to
 * fix a sketch that was correct.
 */
describe("reconciling a sketch with several closed profiles", () => {
  /** Two disjoint squares, both authored 10x10 while the dimensions say 40x40. */
  const twoLoops: SketchSpec = {
    id: "s_two",
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [
      { tag: "a1", type: "line", start: [0, 0], end: [10, 0] },
      { tag: "a2", type: "line", start: [10, 0], end: [10, 10] },
      { tag: "a3", type: "line", start: [10, 10], end: [0, 10] },
      { tag: "a4", type: "line", start: [0, 10], end: [0, 0] },
      { tag: "b1", type: "line", start: [100, 0], end: [110, 0] },
      { tag: "b2", type: "line", start: [110, 0], end: [110, 10] },
      { tag: "b3", type: "line", start: [110, 10], end: [100, 10] },
      { tag: "b4", type: "line", start: [100, 10], end: [100, 0] },
    ],
    constraints: [
      { kind: "LENGTH", tags: ["a1"], value: 40 },
      { kind: "LENGTH", tags: ["a2"], value: 40 },
      { kind: "LENGTH", tags: ["b1"], value: 40 },
      { kind: "LENGTH", tags: ["b2"], value: 40 },
    ],
  };

  it("sees the sketch as several closed profiles, not a broken one", () => {
    const components = findClosedComponents(twoLoops.entities);
    expect(components).not.toBeNull();
    expect(components!.length).toBe(2);
  });

  it("does not report it as unhonoured", () => {
    const report = reconcileSketch(twoLoops).report;
    expect(report.unhonoured).toEqual([]);
    expect(report.closureError).toBeLessThan(1e-9);
  });

  it("applies each component's dimensions to its coordinates", () => {
    const reconciled = reconcileSketch(twoLoops);
    const byTag = new Map(reconciled.entities.map((e) => [e.tag, e]));

    // a1 was authored 10 long and dimensioned 40; it must come out 40.
    const a1 = byTag.get("a1")!;
    expect(Math.hypot(a1.end![0] - a1.start![0], a1.end![1] - a1.start![1])).toBeCloseTo(40, 6);

    // And so must the second, disjoint loop — the whole point.
    const b1 = byTag.get("b1")!;
    expect(Math.hypot(b1.end![0] - b1.start![0], b1.end![1] - b1.start![1])).toBeCloseTo(40, 6);
  });

  it("keeps the entity set", () => {
    expect(reconcileSketch(twoLoops).report.structurePreserved).toBe(true);
  });

  it("still refuses a sketch whose pieces are not closed", () => {
    const open: SketchSpec = {
      id: "s_open",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [
        { tag: "a1", type: "line", start: [0, 0], end: [10, 0] },
        { tag: "a2", type: "line", start: [10, 0], end: [10, 10] },
        { tag: "b1", type: "line", start: [100, 0], end: [110, 0] },
      ],
      constraints: [],
    };
    const report = reconcileSketch(open).report;
    expect(report.unhonoured.length).toBe(1);
    expect(report.unhonoured[0].reason).toMatch(/single closed chain/);
  });
});
