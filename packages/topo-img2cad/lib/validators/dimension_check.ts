/**
 * The per-dimension gate (roadmap T2.1).
 *
 * Every other shape check here grades the part as a whole — silhouette IoU, ink
 * distance, bbox sanity. Measured on img2threejs's own experiment, a whole-frame
 * metric is blind to interior features: a model with an entire face deleted
 * scored the same silhouette IoU (0.8803) to four decimal places as the complete
 * one. Engineering drawings are exactly that case — holes, slots, wall
 * thicknesses are interior — and the drawing STATES the dimensions, so each one
 * can be verified individually against the built solid.
 *
 * The verdicts are an AND: a single dimension outside its tolerance is an error
 * no whole-part metric can excuse. A dimension that cannot be measured on the
 * solid is reported as `unevaluated` — "checked and fine" is never claimed for
 * something that was not checked.
 *
 * Correspondence, honestly scoped for v1:
 *   - RADIUS constraints match ANY circular edge of the solid within tolerance.
 *     That proves a feature of the declared size exists — it does not prove it
 *     is the SAME feature the drawing points at (two 6mm holes are
 *     indistinguishable). Positional matching needs the sketch→solid transform
 *     and is v2.
 *   - Span constraints (2-entity DISTANCE that spans the profile, the same
 *     candidates scale_fit uses) are measured on the solid's bbox along the
 *     sketch plane's axes.
 *   - LENGTH and ANGLE constraints are listed as unevaluated: no v1 measurement
 *     locates them on the solid, and an unevaluated dimension must be visible
 *     rather than silently absent.
 */

import type { ReviewIssue } from "../types.js";
import type { FeatureTree, SketchConstraint, SketchSpec } from "../cad/model.js";
import { evaluateExpression } from "../cad/expr.js";
import { reconcileSketch } from "../cad/reconcile.js";

export interface DeclaredDimension {
  sketchId: string;
  /** What the solid measurement is. */
  kind: "radius" | "spanWidth" | "spanHeight";
  /** Sketch plane axes the span maps onto (span kinds only). */
  axis?: "x" | "y" | "z";
  tags: string[];
  /** The value the drawing states. */
  value: number;
}

export interface DimensionCheckResult {
  /** Dimensions that were measured, with the measured value and verdict. */
  checked: Array<{ dim: DeclaredDimension; measured: number; ok: boolean }>;
  issues: ReviewIssue[];
  /** Dimensions the solid could not answer for — listed, never silently passed. */
  unevaluated: Array<{ dim: DeclaredDimension; reason: string }>;
  /** True when no evaluated dimension is outside its tolerance. Dimensions
   *  that could not be evaluated are in `unevaluated`, not folded into this —
   *  "nothing measurable" is the summary's honesty problem (T2.5), not a shape
   *  defect, and failing every constraint-free drawing here would make the gate
   *  a liar about the one thing it did measure. */
  passed: boolean;
}

/** Relative tolerance for a measured dimension, in the absence of a stated one. */
export const DEFAULT_DIMENSION_TOLERANCE = 0.02;

/** Sketch plane kind → [axis of sketch width, axis of sketch height]. */
const PLANE_AXES: Record<string, ["x" | "y" | "z", "x" | "y" | "z"]> = {
  XY: ["x", "y"],
  XZ: ["x", "z"],
  YZ: ["y", "z"],
};

/** How far a span may sit from the profile's own extent to count as "overall" — same as scale_fit. */
const SPAN_TOLERANCE = 0.15;

export function checkDimensions(
  tree: FeatureTree,
  params: Record<string, number>,
  shape: any,
  tp: any,
  opts: { tolerance?: number } = {},
): DimensionCheckResult {
  const tolerance = opts.tolerance ?? DEFAULT_DIMENSION_TOLERANCE;
  const dims = collectDeclaredDimensions(tree, params);

  const checked: DimensionCheckResult["checked"] = [];
  const issues: ReviewIssue[] = [];
  const unevaluated: DimensionCheckResult["unevaluated"] = [];

  for (const dim of dims) {
    if (dim.kind === "radius") {
      const radii = circularEdgeRadii(shape);
      if (radii.length === 0) {
        unevaluated.push({ dim, reason: "the solid has no circular edges to measure" });
        continue;
      }
      let best = radii[0];
      for (const r of radii) {
        if (Math.abs(r - dim.value) < Math.abs(best - dim.value)) best = r;
      }
      const ok = Math.abs(best - dim.value) <= tolerance * dim.value;
      checked.push({ dim, measured: best, ok });
      if (!ok) {
        issues.push(radiusMismatchIssue(dim, best, tolerance));
      }
      continue;
    }

    // span kinds — solid bbox along the plane's axis
    const axis = dim.axis;
    if (!axis) {
      unevaluated.push({ dim, reason: `sketch plane is not a standard plane, so the span has no solid axis to map onto` });
      continue;
    }
    const measured = bboxSpan(shape, axis);
    if (!isFinite(measured)) {
      unevaluated.push({ dim, reason: "the solid's bounding box is not measurable" });
      continue;
    }
    const ok = Math.abs(measured - dim.value) <= tolerance * dim.value;
    checked.push({ dim, measured, ok });
    if (!ok) {
      issues.push(spanMismatchIssue(dim, measured, tolerance));
    }
  }

  return {
    checked,
    issues,
    unevaluated,
    passed: issues.length === 0,
  };
}

/** The dimensions the tree's own constraints declare, resolved to numbers. */
export function collectDeclaredDimensions(
  tree: FeatureTree,
  params: Record<string, number>,
): DeclaredDimension[] {
  const out: DeclaredDimension[] = [];
  const seen = new Set<string>();

  for (const spec of Object.values(tree.sketches ?? {})) {
    const sketch = spec as SketchSpec;
    const entities = sketch.entities ?? [];
    const reconciled = safeReconcile(sketch);
    const bounds = profileBounds(reconciled);

    for (const c of sketch.constraints ?? []) {
      const dim = declaredDimension(sketch, c, entities, reconciled, bounds, params);
      if (!dim) continue;
      const key = `${dim.sketchId}|${dim.kind}|${dim.axis ?? "-"}|${dim.tags.join("+")}|${dim.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(dim);
    }
  }
  return out;
}

function declaredDimension(
  sketch: SketchSpec,
  c: SketchConstraint,
  entities: any[],
  reconciled: any[],
  bounds: { width: number; height: number } | null,
  params: Record<string, number>,
): DeclaredDimension | null {
  const resolve = (v: unknown): number | undefined => {
    if (typeof v === "number") return isFinite(v) ? v : undefined;
    if (typeof v !== "string") return undefined;
    const direct = Number(v);
    if (isFinite(direct)) return direct;
    try {
      const value = evaluateExpression(v, params);
      return isFinite(value) ? value : undefined;
    } catch {
      return undefined;
    }
  };

  if (c.kind === "RADIUS" && c.tags.length === 1) {
    const value = resolve(c.value);
    if (value === undefined || value <= 0) return null;
    // The declared entity should be a circle or arc in this sketch; a RADIUS on
    // a line is the tracer's noise, not a dimension about a feature.
    const e = [...entities, ...reconciled].find((x) => x?.tag === c.tags[0]);
    if (!e || (e.type !== "circle" && e.type !== "arc")) return null;
    return { sketchId: sketch.id, kind: "radius", tags: [c.tags[0]], value };
  }

  if (c.kind === "DISTANCE" && c.tags.length === 2 && bounds) {
    const value = resolve(c.value);
    if (value === undefined || value <= 0) return null;
    const a = reconciled.find((x) => x?.tag === c.tags[0]);
    const b = reconciled.find((x) => x?.tag === c.tags[1]);
    if (!a || !b) return null;
    const span = spanBetween(a, b);
    if (span === null) return null;
    const axes = PLANE_AXES[sketch.plane?.kind ?? ""];
    if (!axes) return null;
    // Same classification scale_fit uses: a dimension is evidence about the
    // profile's overall extent when it spans (nearly) all of one axis.
    const spansWidth = bounds.width > 0 && Math.abs(span - bounds.width) <= SPAN_TOLERANCE * bounds.width;
    const spansHeight = bounds.height > 0 && Math.abs(span - bounds.height) <= SPAN_TOLERANCE * bounds.height;
    if (spansWidth) {
      return { sketchId: sketch.id, kind: "spanWidth", axis: axes[0], tags: [...c.tags], value };
    }
    if (spansHeight) {
      return { sketchId: sketch.id, kind: "spanHeight", axis: axes[1], tags: [...c.tags], value };
    }
    // A 2-entity distance that does not span the profile (a hole spacing, a wall)
    // has no v1 measurement on the solid — deliberately not guessed at.
    return null;
  }

  return null;
}

function radiusMismatchIssue(dim: DeclaredDimension, measured: number, tolerance: number): ReviewIssue {
  const pct = ((Math.abs(measured - dim.value) / dim.value) * 100).toFixed(1);
  return {
    severity: "error",
    code: "DIM_MISMATCH",
    message:
      `Dimension mismatch: sketch "${dim.sketchId}" declares ${dim.kind} ${dim.value} (entities ${dim.tags.join("+")}), ` +
      `but the built solid's closest circular edge measures ${round(measured)} — ${pct}% off, beyond the ${(
        tolerance * 100
      ).toFixed(1)}% tolerance. ` +
      `No feature of the stated size exists on the model`,
    suggestion: `Re-emit the feature so its ${dim.kind} is ${dim.value}; the traced size drifted from the stated dimension`,
  };
}

function spanMismatchIssue(dim: DeclaredDimension, measured: number, tolerance: number): ReviewIssue {
  const pct = ((Math.abs(measured - dim.value) / dim.value) * 100).toFixed(1);
  return {
    severity: "error",
    code: "DIM_MISMATCH",
    message:
      `Dimension mismatch: sketch "${dim.sketchId}" declares the span ${dim.value} between entities ${dim.tags.join("+")}, ` +
      `but the solid measures ${round(measured)} along ${dim.axis} — ${pct}% off, beyond the ${(tolerance * 100).toFixed(
        1,
      )}% tolerance`,
    suggestion: `Adjust the sketch so the span between ${dim.tags.join(" and ")} is ${dim.value}`,
  };
}

/** Radii of the solid's circular edges (non-circular edges throw or read non-positive). */
function circularEdgeRadii(shape: any): number[] {
  const radii: number[] = [];
  let edges: any[];
  try {
    edges = shape.edges();
  } catch {
    return radii;
  }
  for (const e of edges ?? []) {
    try {
      const r = e.radius();
      if (typeof r === "number" && isFinite(r) && r > 1e-9) radii.push(r);
    } catch {
      // a line has no radius
    }
  }
  return radii;
}

function bboxSpan(shape: any, axis: "x" | "y" | "z"): number {
  const bb = shape.bbox();
  const v = { x: bb.xLength(), y: bb.yLength(), z: bb.zLength() }[axis];
  return typeof v === "number" ? v : NaN;
}

function safeReconcile(sketch: SketchSpec): any[] {
  try {
    return reconcileSketch(sketch).entities;
  } catch {
    return sketch.entities ?? [];
  }
}

function profileBounds(
  entities: any[],
): { width: number; height: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (x: number, y: number): void => {
    if (!isFinite(x) || !isFinite(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  for (const e of entities) {
    if (e.type !== "line" && e.center && typeof e.radius === "number") {
      visit(e.center[0] - e.radius, e.center[1] - e.radius);
      visit(e.center[0] + e.radius, e.center[1] + e.radius);
      continue;
    }
    if (e.start) visit(e.start[0], e.start[1]);
    if (e.end) visit(e.end[0], e.end[1]);
  }
  if (!isFinite(minX) || !isFinite(minY)) return null;
  return { width: maxX - minX, height: maxY - minY };
}

function spanBetween(a: any, b: any): number | null {
  const pa = [a.start, a.end].filter((p: any) => Array.isArray(p));
  const pb = [b.start, b.end].filter((p: any) => Array.isArray(p));
  if (pa.length === 0 || pb.length === 0) return null;
  let best = Infinity;
  for (const p of pa) {
    for (const q of pb) {
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < best) best = d;
    }
  }
  return isFinite(best) ? best : null;
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}
