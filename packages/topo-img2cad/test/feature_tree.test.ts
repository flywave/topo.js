import { describe, expect, it } from "vitest";
import type { FeatureTree, SketchSpec } from "../lib/cad/model.js";
import { emitFeatureTreeCode } from "../lib/cad/feature_codegen.js";
import {
  classifyProfile,
  deriveJoinConstraints,
  emitProfileGeometry,
  mergeConstraints,
  validateRevolveProfile,
} from "../lib/cad/sketch_codegen.js";
import { lintFeatureTree } from "../lib/validators/design_intent.js";
import { evaluateSketchSolves } from "../lib/validators/sketch_solve.js";
import { runBuildFromTree } from "../lib/stages/features.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A closed 100x60 rectangle with the dimensions that drive it. */
function baseSketch(): SketchSpec {
  return {
    id: "s_base",
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [
      { tag: "e1", type: "line", start: [-50, -30], end: [50, -30] },
      { tag: "e2", type: "line", start: [50, -30], end: [50, 30] },
      { tag: "e3", type: "line", start: [50, 30], end: [-50, 30] },
      { tag: "e4", type: "line", start: [-50, 30], end: [-50, -30] },
    ],
    constraints: [
      { kind: "LENGTH", tags: ["e1"], value: 100, note: "overall width" },
      { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
      { kind: "DISTANCE", tags: ["e3", "e1"], value: [0.5, 0.5, 60] },
    ],
  };
}

function boreSketch(): SketchSpec {
  return {
    id: "s_bore",
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [{ tag: "c1", type: "circle", center: [0, 0], radius: 6 }],
    constraints: [{ kind: "RADIUS", tags: ["c1"], value: 6, note: "bore radius" }],
  };
}

function plateTree(over: Partial<FeatureTree> = {}): FeatureTree {
  return {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: { s_base: baseSketch(), s_bore: boreSketch() },
    features: [
      {
        id: "f_pad",
        name: "Base plate",
        op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
        drivenBy: ["plateThickness"],
      },
      {
        id: "f_bore",
        name: "Central bore",
        op: { op: "pocket", sketchId: "s_bore", through: true },
        drivenBy: ["boreDiameter"],
      },
      {
        id: "f_round",
        name: "Round top edges",
        op: { op: "fillet", selector: "|Z", radius: "edgeRadius" },
        drivenBy: ["edgeRadius"],
      },
    ],
    parameters: [
      { name: "plateThickness", expr: "10", unit: "mm", min: 2 },
      { name: "boreDiameter", expr: "plateThickness * 1.2", unit: "mm" },
      { name: "edgeRadius", expr: "2", unit: "mm" },
    ],
    designIntent: { primaryAxis: "z", minWallThickness: 2, manufacturable: true },
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Sketch emission
// ---------------------------------------------------------------------------

describe("sketch emission", () => {
  it("emits entities, constraints, solve, assemble and finalize in order", () => {
    const e = emitProfileGeometry(baseSketch(), baseSketch().entities, { wpVar: "wp_s_base" });
    const code = e.code.join("\n");

    expect(code).toContain('new tp.Workplane("XY", v(0, 0, 0), undefined).sketch()');
    expect(code).toContain('sk_s_base.segmentBetweenPoints(v(-50, -30, 0), v(50, -30, 0), "e1", false)');
    expect(code).toContain('.constrain("e1", K.LENGTH, 100)');
    expect(code).toContain('.constrain("e1", K.ORIENTATION, [1, 0])');
    expect(code).toContain('constrain("e3", "e1", K.DISTANCE, [0.5, 0.5, 60])');

    // Order is load-bearing: solve before assemble (so the face is built from
    // the solved edges), solve before the report, assemble before finalize.
    const solveAt = code.indexOf(".solve()");
    const assembleAt = code.indexOf(".assemble(tp.SketchMode.ADD, undefined)");
    const finalizeAt = code.indexOf(".finalize()");
    expect(solveAt).toBeGreaterThan(-1);
    expect(assembleAt).toBeGreaterThan(solveAt);
    expect(finalizeAt).toBeGreaterThan(assembleAt);
  });

  it("always calls assemble, without which extrude finds no wires", () => {
    const e = emitProfileGeometry(baseSketch(), baseSketch().entities, { wpVar: "wp" });
    expect(e.code.join("\n")).toContain("assemble(tp.SketchMode.ADD, undefined)");
  });

  it("emits arcs as three-point arcs, which is the form that survives wiring", () => {
    // arcByCenter throws once the edges are assembled; arcByThreePoints works.
    const e = emitProfileGeometry(
      baseSketch(),
      [
        { tag: "l1", type: "line", start: [0, 0], end: [100, 0] },
        { tag: "a1", type: "arc", center: [100, 20], radius: 20, start: [100, 0], end: [100, 40], clockwise: false },
        { tag: "l2", type: "line", start: [100, 40], end: [0, 40] },
        { tag: "a2", type: "arc", center: [0, 20], radius: 20, start: [0, 40], end: [0, 0], clockwise: false },
      ],
      { wpVar: "wp" },
    );
    const code = e.code.join("\n");
    expect(code).toContain("arcByThreePoints(");
    expect(code).not.toContain("arcByCenter(");
    // The midpoint of a1 (a 180 degree arc from angle -90 to +90) is at (120, 20).
    expect(code).toContain("v(120, 20, 0)");
  });

  it("derives endpoint joins from adjacency, because the binding needs them stated", () => {
    // The fixture authors dimensions and directions only. Joining the chain is
    // what turns four free segments into a closed loop.
    const joins = deriveJoinConstraints(baseSketch().entities);
    expect(joins.length).toBe(4);
    expect(mergeConstraints(baseSketch()).filter((c) => c.kind === "JOIN").length).toBe(4);

    const e = emitProfileGeometry(baseSketch(), baseSketch().entities, { wpVar: "wp" });
    const code = e.code.join("\n");
    // JOIN becomes the binding's zero-distance constraint, not COINCIDENT, which
    // would make the segments overlap and collapse the loop.
    expect(code).toContain("K.DISTANCE, [1, 0, 0]");
    expect(code).not.toContain("K.COINCIDENT");
  });

  it("captures solve reports when asked, and stays quiet when not", () => {
    const withReports = emitProfileGeometry(baseSketch(), baseSketch().entities, {
      wpVar: "wp",
      reportMapVar: "__solveReports",
    });
    expect(withReports.code.join("\n")).toContain('__solveReports["s_base"] = sk_s_base.solve_status();');

    const without = emitProfileGeometry(baseSketch(), baseSketch().entities, {
      wpVar: "wp",
      reportMapVar: null,
    });
    expect(without.code.join("\n")).not.toContain("solve_status");
  });

  it("uses the exact circle construction for a circle", () => {
    const sketch: SketchSpec = {
      ...baseSketch(),
      entities: [{ tag: "c1", type: "circle", center: [50, 30], radius: 15 }],
    };
    const e = emitProfileGeometry(sketch, sketch.entities, { wpVar: "wp_bore" });
    const code = e.code.join("\n");
    expect(e.kind).toBe("circle");
    expect(code).toContain('circle(15, tp.SketchMode.ADD, "s_base")');
    expect(code).not.toContain("assemble(");
    // A circle is built at the world origin, so its placement is the world centre.
    expect(e.placement).toEqual([50, 30, 0]);
  });
});

describe("profile classification", () => {
  it("classifies a rectangle as a loop and chains it", () => {
    const c = classifyProfile(baseSketch().entities);
    expect(c?.kind).toBe("loop");
    if (c?.kind !== "loop") throw new Error("expected a loop");
    expect(c.chain.length).toBe(4);
    expect(c.points).toEqual([[-50, -30], [50, -30], [50, 30], [-50, 30]]);
  });

  it("classifies a circle", () => {
    const c = classifyProfile([{ tag: "c1", type: "circle", center: [50, 30], radius: 15 }]);
    expect(c).toEqual({ kind: "circle", centre: [50, 30], radius: 15 });
  });

  it("accepts an arbitrary polygon — outlines are no longer restricted", () => {
    // The L-bracket that used to be refused now classifies as a loop.
    const c = classifyProfile([
      { tag: "e1", type: "line", start: [0, 0], end: [100, 0] },
      { tag: "e2", type: "line", start: [100, 0], end: [100, 20] },
      { tag: "e3", type: "line", start: [100, 20], end: [20, 20] },
      { tag: "e4", type: "line", start: [20, 20], end: [20, 60] },
      { tag: "e5", type: "line", start: [20, 60], end: [0, 60] },
      { tag: "e6", type: "line", start: [0, 60], end: [0, 0] },
    ]);
    expect(c?.kind).toBe("loop");
  });

  it("refuses a profile that does not close", () => {
    const open = baseSketch().entities.slice(0, 3);
    expect(classifyProfile(open)).toBeNull();
    expect(() =>
      emitProfileGeometry(
        { ...baseSketch(), entities: open },
        open,
        { wpVar: "wp" },
      ),
    ).toThrow(/no closed profile can be built/);
  });

  it("refuses a custom datum plane, which has no verified mapping", () => {
    const sketch: SketchSpec = {
      id: "s_custom",
      plane: { kind: "custom", origin: [0, 0, 0], normal: [0, 0, 1], xAxis: [1, 0, 0] },
      entities: [{ tag: "c1", type: "circle", center: [0, 0], radius: 5 }],
      constraints: [],
    };
    expect(() => emitProfileGeometry(sketch, sketch.entities, { wpVar: "wp" })).toThrow(
      /custom datum planes are not supported/,
    );
  });
});

describe("revolve profile validation", () => {
  it("accepts a profile offset to one side of the axis", () => {
    const problems = validateRevolveProfile(
      {
        id: "s",
        plane: { kind: "XZ", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [0, 0], end: [10, 0] },
          { tag: "e2", type: "line", start: [10, 0], end: [10, 20] },
          { tag: "e3", type: "line", start: [10, 20], end: [0, 20] },
          { tag: "e4", type: "line", start: [0, 20], end: [0, 0] },
        ],
        constraints: [],
      },
      { start: [0, 0, 0], end: [0, 20, 0] },
    );
    expect(problems).toEqual([]);
  });

  it("rejects a profile that straddles the axis, which go-topo silently empties", () => {
    const problems = validateRevolveProfile(
      {
        id: "s",
        plane: { kind: "XZ", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [-5, 0], end: [5, 0] },
          { tag: "e2", type: "line", start: [5, 0], end: [5, 10] },
        ],
        constraints: [],
      },
      { start: [0, 0, 0], end: [0, 10, 0] },
    );
    expect(problems.join(" ")).toMatch(/crosses the axis/);
  });

  it("rejects a degenerate axis", () => {
    const problems = validateRevolveProfile(baseSketch(), {
      start: [0, 0, 0],
      end: [0, 0, 0],
    });
    expect(problems.join(" ")).toMatch(/degenerate/);
  });
});

// ---------------------------------------------------------------------------
// Feature tree emission
// ---------------------------------------------------------------------------

describe("feature tree emission", () => {
  const resolved = { plateThickness: 10, boreDiameter: 12, edgeRadius: 2 };

  it("builds sketches first, then replays features in order", () => {
    const out = emitFeatureTreeCode(plateTree(), resolved);
    expect(out.errors).toEqual([]);

    const code = out.source;
    const padIdx = code.indexOf("f_pad");
    const boreIdx = code.indexOf("f_bore");
    const roundIdx = code.indexOf("f_round");
    expect(padIdx).toBeGreaterThan(-1);
    expect(padIdx).toBeLessThan(boreIdx);
    expect(boreIdx).toBeLessThan(roundIdx);

    // Sketches must all be built before the first feature consumes one.
    expect(code.indexOf("sk_s_base")).toBeLessThan(padIdx);
  });

  it("declares the body once and reassigns it thereafter", () => {
    const code = emitFeatureTreeCode(plateTree(), resolved).source;
    expect(code.match(/let body =/g)?.length).toBe(1);
    expect(code.match(/^ {2}body = /gm)?.length).toBeGreaterThanOrEqual(2);
  });

  it("resolves driving dimensions from parameters", () => {
    const code = emitFeatureTreeCode(plateTree(), resolved).source;
    expect(code).toContain("plateThickness: 10");
    expect(code).toContain("boreDiameter: 12");
    // The pad extrudes the parameter's value.
    expect(code).toMatch(/\.extrude\(10, true, true, false, undefined\)/);
  });

  it("never emits extrude with both=true, which is a known go-topo bug", () => {
    const code = emitFeatureTreeCode(plateTree(), resolved, {}).source;
    expect(code).not.toMatch(/\.extrude\([^)]*true, true\)/);
    expect(code).not.toContain("both=true");

    // A symmetric pad is expressed as extrude + translate instead.
    const sym = plateTree({
      features: [
        {
          id: "f_pad",
          name: "Symmetric pad",
          op: { op: "pad", sketchId: "s_base", distance: "plateThickness", symmetric: true },
        },
      ],
    });
    const symCode = emitFeatureTreeCode(sym, resolved);
    expect(symCode.source).toContain(".translate(gv(0, 0, -5))");
    expect(symCode.warnings.join(" ")).toMatch(/both=true/);
  });

  it("emits a through pocket as a generous cut and says so", () => {
    const out = emitFeatureTreeCode(plateTree(), resolved);
    expect(out.source).toMatch(/\.cut\(tool_f_bore, true, 0\)/);
    expect(out.warnings.join(" ")).toMatch(/through.*4x the largest dimension/s);
  });

  it("emits fillet against a selector", () => {
    const code = emitFeatureTreeCode(plateTree(), resolved).source;
    expect(code).toContain('.edges("|Z", "").fillet(2)');
  });

  it("skips a modification that appears before any material exists", () => {
    const bad = plateTree({
      features: [
        { id: "f_round", name: "Premature fillet", op: { op: "fillet", selector: "|Z", radius: "edgeRadius" } },
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_base", distance: "plateThickness" } },
      ],
    });
    const out = emitFeatureTreeCode(bad, resolved);
    expect(out.skippedFeatures.map((s) => s.id)).toContain("f_round");
    expect(out.skippedFeatures[0].reason).toMatch(/no base feature/);
    // The pad still builds.
    expect(out.source).toContain("let body =");
  });

  it("repeats a pattern source rather than inventing geometry", () => {
    const patterned = plateTree({
      features: [
        ...plateTree().features.slice(0, 2),
        {
          id: "f_array",
          name: "Bolt circle",
          op: { op: "pattern_linear", ofFeature: "f_bore", count: 4, dx: "30", dy: "0" },
        },
      ],
    });
    const out = emitFeatureTreeCode(patterned, resolved);
    expect(out.source).toContain("for (let i = 1; i < 4; i++)");
    expect(out.source).toContain("tool_f_bore.translate(");
  });

  it("skips a pattern whose source is not a material-removal feature", () => {
    const bad = plateTree({
      features: [
        plateTree().features[0],
        {
          id: "f_array",
          name: "Bad array",
          op: { op: "pattern_linear", ofFeature: "f_pad", count: 4, dx: "10", dy: "0" },
        },
      ],
    });
    const out = emitFeatureTreeCode(bad, resolved);
    expect(out.skippedFeatures[0].reason).toMatch(/not a material-removal feature/);
  });

  it("unwraps the body before rendering, so callers get a measurable shape", () => {
    const code = emitFeatureTreeCode(plateTree(), resolved).source;
    // A feature body is a Workplane; its val() is the shape a caller can measure.
    expect(code).toContain('const __result = body && typeof body.val === "function" ? body.val() : body;');
    expect(code).toContain('if (typeof render === "function") render(__result);');
    expect(code).toContain("return __result;");
  });

  it("applies the datum plane origin to the solid, not the sketch", () => {
    // The sketch path ignores the plane origin — the profile lands where its own
    // coordinates put it and starts at the plane's zero level. So the origin has
    // to be applied to the extruded solid.
    const offset = plateTree({
      sketches: {
        s_base: {
          id: "s_base",
          plane: { kind: "XY", origin: [50, 30, 7] },
          entities: [
            { tag: "e1", type: "line", start: [0, 0], end: [100, 0] },
            { tag: "e2", type: "line", start: [100, 0], end: [100, 60] },
            { tag: "e3", type: "line", start: [100, 60], end: [0, 60] },
            { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
          ],
          constraints: [{ kind: "LENGTH", tags: ["e1"], value: 100 }],
        },
      },
    });
    const code = emitFeatureTreeCode(offset, resolved).source;

    expect(code).toMatch(/\.extrude\(10, true, true, false, undefined\)\.translate\(gv\(50, 30, 7\)\)/);
    // Translating the sketch workplane instead would silently do nothing.
    expect(code).not.toMatch(/finalize\(\)\.translate/);
  });

  it("errors when nothing produces a body", () => {
    const empty = plateTree({ features: [] });
    const out = emitFeatureTreeCode(empty, {});
    expect(out.errors.join(" ")).toMatch(/no base feature produced a body/);
  });

  it("warns that sweep and loft are emitted on unverified bindings", () => {
    const swept = plateTree({
      features: [
        {
          id: "f_sweep",
          name: "Swept arm",
          op: { op: "sweep", sketchId: "s_bore", pathSketchId: "s_base" },
        },
      ],
    });
    const out = emitFeatureTreeCode(swept, resolved);
    expect(out.warnings.join(" ")).toMatch(/not covered by the CQ shim/);
  });
});

// ---------------------------------------------------------------------------
// Lint
// ---------------------------------------------------------------------------

describe("feature tree lint", () => {
  const codes = (t: FeatureTree) => lintFeatureTree(t).issues.map((i) => i.code);

  it("passes a coherent tree", () => {
    const lint = lintFeatureTree(plateTree());
    expect(lint.passed).toBe(true);
    expect(lint.resolved.values.plateThickness).toBe(10);
    expect(lint.resolved.values.boreDiameter).toBeCloseTo(12);
  });

  it("requires a base feature", () => {
    const t = plateTree({ features: [plateTree().features[2]] });
    expect(codes(t)).toContain("DIN_NO_BASE_FEATURE");
  });

  it("catches a feature referencing a sketch that does not exist", () => {
    const t = plateTree({
      features: [
        { id: "f_pad", name: "Base", op: { op: "pad", sketchId: "s_ghost", distance: "10" } },
      ],
    });
    expect(codes(t)).toContain("DIN_MISSING_SKETCH");
  });

  it("catches a degenerate revolve axis", () => {
    const t = plateTree({
      features: [
        {
          id: "f_rev",
          name: "Revolve",
          op: {
            op: "revolve",
            sketchId: "s_base",
            angle: "360",
            axis: { start: [0, 0, 0], end: [0, 0, 0] },
          },
        },
      ],
    });
    expect(codes(t)).toContain("DIN_DEGENERATE_AXIS");
  });

  it("catches a fillet with no selector", () => {
    const t = plateTree({
      features: [
        plateTree().features[0],
        { id: "f_r", name: "Round", op: { op: "fillet", selector: "", radius: "1" } },
      ],
    });
    expect(codes(t)).toContain("DIN_NO_SELECTOR");
  });

  it("catches an unresolvable parameter", () => {
    const t = plateTree({
      parameters: [{ name: "a", expr: "b * 2" }, { name: "b", expr: "a * 2" }],
    });
    expect(codes(t)).toContain("DIN_UNRESOLVED_PARAMETER");
  });

  it("flags a parameter that drives nothing", () => {
    const t = plateTree({
      parameters: [...plateTree().parameters, { name: "decorative", expr: "5" }],
    });
    const issues = lintFeatureTree(t).issues;
    expect(issues.some((i) => i.code === "DIN_ORPHAN_PARAMETER" && i.message.includes("decorative"))).toBe(true);
  });

  it("flags an arc whose endpoints are not on the circle it declares", () => {
    // Measured on a real traced outline: 12 of 15 arcs, endpoints 10-67% off
    // their own circle, while the endpoint chain closed to 0.0000. The tracer
    // produced a point chain and padded the bulges with plausible centres and
    // radii. Reconciliation repairs that on the way to code, but the repair is a
    // guess about geometry — the tracer has to be told, or it is never fixed.
    const t = plateTree({
      sketches: {
        ...plateTree().sketches,
        s_arcs: {
          id: "s_arcs",
          plane: { kind: "XY", origin: [0, 0, 0] },
          // r=10, but the start is 5 away from the centre.
          entities: [{ tag: "a1", type: "arc", center: [0, 0], radius: 10, start: [5, 0], end: [0, 10] }],
          constraints: [],
        },
      },
    });

    const issues = lintFeatureTree(t).issues;
    const arc = issues.find((i) => i.code === "DIN_ARC_INCONSISTENT");
    expect(arc).toBeDefined();
    expect(arc!.message).toMatch(/radius is 10/);
    expect(arc!.message).toMatch(/\|start-centre\| is 5\.00/);
    // A warning: the geometry is still built, and the repair loop acts on it.
    expect(arc!.severity).toBe("warning");
    expect(lintFeatureTree(t).passed).toBe(true);
  });

  it("says nothing about an arc whose endpoints are on its circle", () => {
    const t = plateTree({
      sketches: {
        ...plateTree().sketches,
        s_arcs: {
          id: "s_arcs",
          plane: { kind: "XY", origin: [0, 0, 0] },
          entities: [{ tag: "a1", type: "arc", center: [0, 0], radius: 10, start: [10, 0], end: [0, 10] }],
          constraints: [],
        },
      },
    });

    expect(codes(t)).not.toContain("DIN_ARC_INCONSISTENT");
  });

  it("flags a duplicate feature id", () => {
    const t = plateTree({
      features: [plateTree().features[0], { ...plateTree().features[0] }],
    });
    expect(codes(t)).toContain("DIN_DUPLICATE_FEATURE");
  });

  it("flags a sketch nothing consumes", () => {
    const t = plateTree({
      sketches: { ...plateTree().sketches, s_unused: boreSketch() },
    });
    const issues = lintFeatureTree(t).issues;
    expect(issues.some((i) => i.code === "DIN_UNUSED_SKETCH" && i.message.includes("s_unused"))).toBe(true);
  });

  it("flags a non-positive dimension", () => {
    const t = plateTree({
      parameters: [{ name: "plateThickness", expr: "0" }, ...plateTree().parameters.slice(1)],
    });
    expect(codes(t)).toContain("DIN_NON_POSITIVE_DIMENSION");
  });

  it("checks shell thickness against the declared minimum wall", () => {
    const t = plateTree({
      features: [
        plateTree().features[0],
        { id: "f_shell", name: "Hollow", op: { op: "shell", thickness: "0.5" } },
      ],
      parameters: [...plateTree().parameters, { name: "wall", expr: "0.5" }],
      designIntent: { minWallThickness: 2 },
    });
    expect(codes(t)).toContain("DIN_THIN_WALL");
  });
});

// ---------------------------------------------------------------------------
// Solver gate
// ---------------------------------------------------------------------------

describe("sketch solver gate", () => {
  it("accepts a converged solve", () => {
    const out = evaluateSketchSolves({
      s_base: { status: 4, cost: 1e-9, x: [[0, 0, 10, 0], [10, 0, 10, 5]] },
    });
    expect(out.passed).toBe(true);
    expect(out.reports.s_base.converged).toBe(true);
    expect(out.reports.s_base.dofCount).toBe(2);
  });

  it("fails a solve with a high residual even though geometry was produced", () => {
    const out = evaluateSketchSolves({
      s_base: { status: 2, cost: 25.0, x: [[0, 0, 10, 0]] },
    });
    expect(out.passed).toBe(false);
    expect(out.issues.some((i) => i.code === "SKT_HIGH_RESIDUAL")).toBe(true);
  });

  it("fails a solver status outside the success codes", () => {
    const out = evaluateSketchSolves({ s: { status: -1, cost: 0, x: [[0, 0, 0, 0]] } });
    expect(out.issues.some((i) => i.code === "SKT_SOLVER_FAILED")).toBe(true);
  });

  it("warns when the constraints reached no geometry", () => {
    const out = evaluateSketchSolves({ s: { status: 4, cost: 0, x: [] } });
    expect(out.issues.some((i) => i.code === "SKT_NO_DOF")).toBe(true);
  });

  it("reports a sketch that never produced a report", () => {
    const out = evaluateSketchSolves({}, { expectedSketches: ["s_missing"] });
    expect(out.issues.some((i) => i.code === "SKT_NO_REPORT")).toBe(true);
    expect(out.passed).toBe(false);
  });

  it("notes a caveated convergence without failing it", () => {
    const out = evaluateSketchSolves({ s: { status: 3, cost: 1e-9, x: [[0, 0, 1, 1]] } });
    expect(out.passed).toBe(true);
    expect(out.issues.some((i) => i.code === "SKT_SUBTOTAL" || i.code === "SKT_SUBOPTIMAL")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

describe("build from tree", () => {
  it("returns code and the resolved parameter set", () => {
    const result = runBuildFromTree(plateTree());
    expect(result.errors).toEqual([]);
    expect(result.resolved.plateThickness).toBe(10);
    expect(result.resolved.boreDiameter).toBeCloseTo(12);
    expect(result.code.entryPoint).toBe("createModel");
    expect(result.code.methodsUsed).toContain("sketch");
    expect(result.code.methodsUsed).toContain("cut");
  });

  it("rebuilds with perturbed parameters for associativity checks", () => {
    const a = runBuildFromTree(plateTree());
    const b = runBuildFromTree(plateTree(), { plateThickness: 25 });
    expect(a.code.source).toContain("plateThickness: 10");
    expect(b.code.source).toContain("plateThickness: 25");
    expect(b.code.source).toMatch(/\.extrude\(25,/);
  });
});
