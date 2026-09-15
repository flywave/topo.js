/**
 * The sketch must state its connectivity exactly once, and in a form the binding
 * actually implements.
 *
 * From a live run: a model spelled the connectivity of a 120x80 plate's four edge
 * pairs `COINCIDENT`, which in this binding means "these segments overlap". The
 * emitter derived the joins itself and emitted both, so all four edge pairs
 * carried two contradictory statements — and the solver reported a residual of
 * 6986.67 where the same sketch with only the derived joins reports 0.
 *
 * The part still came out correct, because reconciliation places the geometry and
 * `solve()` does not write back. That is what made it worth a test rather than a
 * comment: the defect was invisible in the solid and showed up only as L3
 * refusing to certify a part that was in fact right.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { getTopo, installGlobals } from "./helpers/topo.js";
import { mergeConstraints, mergeConstraintsVerbose } from "../lib/cad/sketch_codegen.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { validateGeometry } from "../lib/validators/geometric.js";
import type { FeatureTree, ProfileEntity, SketchConstraint } from "../lib/cad/model.js";

let tp: any;

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
}, 120_000);

/** The four edges of a 120x80 rectangle, as a model authors them. */
const SQUARE: ProfileEntity[] = [
  { tag: "e1", type: "line", start: [-60, -40], end: [60, -40] },
  { tag: "e2", type: "line", start: [60, -40], end: [60, 40] },
  { tag: "e3", type: "line", start: [60, 40], end: [-60, 40] },
  { tag: "e4", type: "line", start: [-60, 40], end: [-60, -40] },
];

/** What a model writes when it means "these edges meet". */
const MODEL_COINCIDENT: SketchConstraint[] = [
  { kind: "COINCIDENT", tags: ["e1", "e2"] },
  { kind: "COINCIDENT", tags: ["e2", "e3"] },
  { kind: "COINCIDENT", tags: ["e3", "e4"] },
  { kind: "COINCIDENT", tags: ["e4", "e1"] },
];

const DIMENSIONS: SketchConstraint[] = [
  { kind: "LENGTH", tags: ["e1"], value: 120 },
  { kind: "LENGTH", tags: ["e2"], value: 80 },
];

function sketch(constraints: SketchConstraint[]) {
  return { id: "s", plane: { kind: "XY" as const, origin: [0, 0, 0] as [number, number, number] }, entities: SQUARE, constraints };
}

function plateTree(constraints: SketchConstraint[]): FeatureTree {
  return {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: { s: sketch(constraints) },
    features: [{ id: "f", name: "Pad", op: { op: "pad", sketchId: "s", distance: "t" } }],
    parameters: [{ name: "t", expr: "10", unit: "mm" }],
  };
}

// ---------------------------------------------------------------------------

describe("connectivity is stated once, in the implemented form", () => {
  it("drops a model COINCIDENT that the derived joins already cover", () => {
    const merged = mergeConstraintsVerbose(sketch([...DIMENSIONS, ...MODEL_COINCIDENT]));

    expect(merged.dropped.length).toBe(4);
    for (const d of merged.dropped) {
      expect(d.kind).toBe("COINCIDENT");
      expect(d.reason).toMatch(/derives this join/);
    }

    // Nothing that reaches the binding may be a COINCIDENT.
    expect(merged.constraints.some((c) => c.kind === "COINCIDENT")).toBe(false);
    // And every edge pair still has exactly one join.
    const joins = merged.constraints.filter((c) => c.kind === "JOIN");
    expect(joins.length).toBe(4);
  });

  it("drops an explicit JOIN for a pair the derivation covers, rather than stating it twice", () => {
    const merged = mergeConstraintsVerbose(
      sketch([...DIMENSIONS, { kind: "JOIN", tags: ["e1", "e2"], value: [1, 0] }]),
    );
    const forPair = merged.constraints.filter((c) => c.tags.join("|") === "e1|e2");
    expect(forPair.length).toBe(1);
    expect(merged.dropped.some((d) => d.kind === "JOIN")).toBe(true);
  });

  it("honours an explicit JOIN that names its own parameter pair for a pair the derivation cannot cover", () => {
    const merged = mergeConstraintsVerbose(
      sketch([...DIMENSIONS, { kind: "JOIN", tags: ["e1", "e3"], value: [1, 0] }]),
    );
    expect(merged.dropped.length).toBe(0);
    expect(merged.constraints.some((c) => c.kind === "JOIN" && c.tags.join("|") === "e1|e3")).toBe(true);
  });

  it("refuses a COINCIDENT it cannot translate, and says the binding means overlap", () => {
    const merged = mergeConstraintsVerbose(
      sketch([...DIMENSIONS, { kind: "COINCIDENT", tags: ["e1", "e3"] }]),
    );
    expect(merged.constraints.some((c) => c.kind === "COINCIDENT")).toBe(false);
    expect(merged.dropped[0].reason).toMatch(/overlap, not that their endpoints meet/);
  });

  it("leaves dimensions alone", () => {
    const merged = mergeConstraintsVerbose(sketch([...DIMENSIONS, ...MODEL_COINCIDENT]));
    expect(merged.constraints.filter((c) => c.kind === "LENGTH").length).toBe(2);
  });

  it("still returns a plain array from mergeConstraints", () => {
    expect(Array.isArray(mergeConstraints(sketch(DIMENSIONS)))).toBe(true);
  });
});

describe("the solver residual, against the real kernel", () => {
  /** Residual of the sketch the pipeline emits for this tree. */
  function residualFor(constraints: SketchConstraint[]): number {
    const built = runBuildFromTree(plateTree(constraints));
    const sandbox = executeInSandbox(built.code.source, tp, undefined, undefined, undefined, undefined);
    expect(sandbox.error).toBeUndefined();
    return (sandbox.solveReports as Record<string, { cost: number }>).s.cost;
  }

  /**
   * The sketch the emitter used to produce: the model's COINCIDENT *and* the
   * derived join for every edge pair. Replayed directly, because the emitter can
   * no longer produce it — which is the fix.
   */
  function residualOfOldEmission(): number {
    const K = tp.SketchConstraintKind;
    const v = (x: number, y: number, z: number) => new tp.Vector(x, y, z);
    const sk = new tp.Workplane("XY", v(0, 0, 0), undefined).sketch();
    for (const e of SQUARE) {
      sk.segmentBetweenPoints(v(e.start![0], e.start![1], 0), v(e.end![0], e.end![1], 0), e.tag, false);
    }
    sk.constrain("e1", K.LENGTH, 120);
    sk.constrain("e2", K.LENGTH, 80);
    for (const c of MODEL_COINCIDENT) sk.constrain(c.tags[0], c.tags[1], K.COINCIDENT);
    for (const c of MODEL_COINCIDENT) sk.constrain(c.tags[0], c.tags[1], K.DISTANCE, [1, 0, 0]);
    sk.solve();
    return sk.solve_status().cost;
  }

  it("records what the doubled connectivity cost, and that it is now gone", () => {
    // The failure this file exists for: 6986.67 of residual on a sketch whose
    // geometry was right.
    expect(residualOfOldEmission()).toBeGreaterThan(1000);

    // Same tree, through the pipeline: the model's COINCIDENT is not emitted.
    expect(residualFor([...DIMENSIONS, ...MODEL_COINCIDENT])).toBeLessThan(1e-6);
  }, 120_000);

  it("does not emit two constraints for one edge pair", () => {
    const built = runBuildFromTree(plateTree([...DIMENSIONS, ...MODEL_COINCIDENT]));
    const emitted = built.code.source;

    expect(emitted).not.toContain("K.COINCIDENT");
    expect((emitted.match(/K\.DISTANCE, \[1, 0, 0\]/g) ?? []).length).toBe(4);
    // And the drop is reported rather than silent.
    expect(built.warnings.join(" ")).toMatch(/dropped COINCIDENT/);
  }, 120_000);

  it("still builds the plate exactly", () => {
    const built = runBuildFromTree(plateTree([...DIMENSIONS, ...MODEL_COINCIDENT]));
    const sandbox = executeInSandbox(built.code.source, tp, undefined, undefined, undefined, undefined);
    const geo = validateGeometry(tp, sandbox.shape);
    const bbox = geo.report.bbox!;

    expect(geo.report.shapeValid).toBe(true);
    expect(bbox[3] - bbox[0]).toBeCloseTo(120, 3);
    expect(bbox[4] - bbox[1]).toBeCloseTo(80, 3);
    expect(bbox[5] - bbox[2]).toBeCloseTo(10, 3);
  }, 120_000);
});
