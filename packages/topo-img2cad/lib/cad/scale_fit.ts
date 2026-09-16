/**
 * Fit a traced model's SIZE to the dimensions the drawing states.
 *
 * The tracer reads a drawing and returns coordinates in units of its own
 * choosing: the profile prompt states the drawing's millimetres-per-pixel, but
 * nothing checks that the answer respects it. Measured on a real annotated
 * drawing: the profile came back 210 x 186 units for a part the sheet dimensions
 * as 150 tall, so the model was 25% oversized — and because the dimension could
 * not be applied, the constraint that stated it was DROPPED rather than used,
 * leaving the parameter driving nothing.
 *
 * This closes that gap on the one measurement that is reliable. A dimension read
 * off the sheet is text, and text survives; the tracer's coordinates are a
 * separate reading of the same sheet and are the one that drifts. So the shape is
 * kept as traced and only its size is corrected — uniformly, because a
 * non-uniform fit would be asserting proportions neither reading supports.
 *
 * The scale is decided ONCE for the whole tree, not per sketch, and that is not a
 * detail. A part is authored as one consistent set of coordinates spread across
 * several sketches — an outline and the pockets that sit in it. Scaling one
 * sketch and not the others moves the features relative to the part they belong
 * to: measured, scaling the outline alone left the pockets outside it and the
 * kernel's cut crashed outright (`NCollection_Sequence::ChangeValue`). The size of
 * a part is one number, so one number is what gets applied.
 *
 * Only a dimension that SPANS a profile is evidence about its scale. A hole
 * diameter or a wall thickness does not, and treating one as if it did would
 * rescale the whole part to match a feature — which is why the candidate set is
 * narrow rather than "every dimension".
 */

import type { ProfileEntity, SketchConstraint, SketchSpec } from "./model.js";
import { evaluateExpression } from "./expr.js";
import { reconcileSketch } from "./reconcile.js";

/** A dimension that measures a profile's own extent in one axis. */
interface Candidate {
  sketchId: string;
  tags: [string, string];
  value: number;
  drawn: number;
  ratio: number;
}

export interface TreeScaleFit {
  /** 1 when nothing was applied. */
  scale: number;
  notes: string[];
}

/** How far a span may sit from the profile's own extent and still be "overall". */
const SPAN_TOLERANCE = 0.15;

/**
 * How far the requested value may sit from the span it measures.
 *
 * This is the size error being corrected, so it cannot be tight; it exists to
 * reject a dimension that is plainly measuring something else. A plate 60 units
 * high whose two long edges are dimensioned 120 apart has a ratio of 2 — a
 * different quantity, not a mis-scaled one — and rescaling the part to 2x would
 * be worse than doing nothing.
 */
const MAX_RATIO = 1.5;

/** Beyond this, two dimensions disagree about the SHAPE and no one scale fits. */
const MAX_DISAGREEMENT = 1.25;

/**
 * The uniform scale the stated dimensions imply, or 1.
 *
 * `sketches` are measured in the geometry reconciliation produces, because that
 * is where a chain has been placed by its own dimensions and only there does a
 * dimension between two entities span the profile the way an overall dimension
 * does. The authored coordinates can have the same two entities far apart in a
 * way that says nothing about the part's size.
 */
export function fitTreeScale(
  sketches: SketchSpec[],
  params?: Record<string, number>,
): TreeScaleFit {
  const candidates: Candidate[] = [];
  for (const sketch of sketches) {
    const reconciled = reconcileSketch(sketch);
    candidates.push(...measureCandidates(sketch.id, reconciled.entities, sketch.constraints, params));
  }

  if (candidates.length === 0) return { scale: 1, notes: [] };

  const ratios = candidates.map((c) => c.ratio).sort((x, y) => x - y);
  const spread = ratios[ratios.length - 1] / ratios[0];
  const render = candidates
    .map((c) => `${c.sketchId} ${c.tags.join("+")} asks ${c.value} over a span of ${c.drawn.toFixed(2)}`)
    .join("; ");

  if (spread > MAX_DISAGREEMENT) {
    return {
      scale: 1,
      notes: [
        `the stated dimensions disagree about the part's proportions, so no single scale fits and the traced size was kept: ${render} (implied scale ${ratios.map((r) => r.toFixed(3)).join(", ")})`,
      ],
    };
  }

  const scale = ratios[Math.floor(ratios.length / 2)];
  const note =
    `the traced profile was fitted to the drawing's own dimensions: ${render}; ` +
    `scaled the whole model by ${scale.toFixed(4)}` +
    (candidates.length > 1
      ? ` — ${candidates.length} dimensions agree to within ${((spread - 1) * 100).toFixed(1)}%, and that spread is the residual size error`
      : "");

  return { scale, notes: [note] };
}

/** The dimensions that measure a profile's own extent, with the scale each implies. */
function measureCandidates(
  sketchId: string,
  entities: ProfileEntity[],
  constraints: SketchConstraint[],
  params?: Record<string, number>,
): Candidate[] {
  const bounds = profileBounds(entities);
  if (!bounds) return [];
  const { width, height } = bounds;

  const found: Candidate[] = [];
  for (const c of constraints) {
    if (c.kind !== "DISTANCE" || c.tags.length !== 2) continue;
    const requested = typeof c.value === "number" ? c.value : resolveNumber(c.value, params);
    if (requested === undefined || !isFinite(requested) || requested <= 0) continue;
    const a = entities.find((e) => e.tag === c.tags[0]);
    const b = entities.find((e) => e.tag === c.tags[1]);
    if (!a || !b) continue;
    const span = spanBetween(a, b);
    if (!span) continue;

    const spansWidth = width > 0 && Math.abs(span - width) <= SPAN_TOLERANCE * width;
    const spansHeight = height > 0 && Math.abs(span - height) <= SPAN_TOLERANCE * height;
    if (!spansWidth && !spansHeight) continue;

    const ratio = requested / span;
    if (ratio > MAX_RATIO || ratio < 1 / MAX_RATIO) continue;
    if (Math.abs(ratio - 1) <= 0.02) continue;

    found.push({ sketchId, tags: c.tags, value: requested, drawn: span, ratio });
  }
  return found;
}

/** Read an expression that names parameters as the number it resolves to. */
function resolveNumber(expr: unknown, params?: Record<string, number>): number | undefined {
  if (typeof expr !== "string" || !params) return undefined;
  const direct = Number(expr);
  if (isFinite(direct)) return direct;
  try {
    const value = evaluateExpression(expr, params);
    return isFinite(value) ? value : undefined;
  } catch {
    // An expression that does not resolve is not evidence about the scale; the
    // pipeline reports unresolved parameters separately.
    return undefined;
  }
}

/** Scale every entity of a sketch about the sketch's own bounding-box corner. */
export function scaleSketch(sketch: SketchSpec, k: number): SketchSpec {
  if (!(Math.abs(k - 1) > 1e-9)) return sketch;
  const bounds = profileBounds(sketch.entities);
  if (!bounds) return sketch;
  return {
    ...sketch,
    entities: sketch.entities.map((e) => scaleEntity(e, k, bounds.minX, bounds.minY)),
  };
}

/** The profile's extent, and the corner to scale about. */
function profileBounds(
  entities: ProfileEntity[],
): { width: number; height: number; minX: number; minY: number } | null {
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
      // An arc's own start/end lie on the circle, so the centre plus the radius
      // bounds it; the endpoints alone would miss the bulge.
      visit(e.center[0] - e.radius, e.center[1] - e.radius);
      visit(e.center[0] + e.radius, e.center[1] + e.radius);
      continue;
    }
    if (e.start) visit(e.start[0], e.start[1]);
    if (e.end) visit(e.end[0], e.end[1]);
  }

  if (!isFinite(minX) || !isFinite(minY)) return null;
  return { width: maxX - minX, height: maxY - minY, minX, minY };
}

/** The shortest distance between two entities' endpoint pairs. */
function spanBetween(a: ProfileEntity, b: ProfileEntity): number | null {
  const pa = [a.start, a.end].filter((p): p is [number, number] => Array.isArray(p));
  const pb = [b.start, b.end].filter((p): p is [number, number] => Array.isArray(p));
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

/** Scale an entity's coordinates and radii about a point. */
function scaleEntity(e: ProfileEntity, k: number, ox: number, oy: number): ProfileEntity {
  const p = (pt: [number, number] | undefined): [number, number] | undefined =>
    Array.isArray(pt) ? [ox + (pt[0] - ox) * k, oy + (pt[1] - oy) * k] : pt;

  const out: ProfileEntity = { ...e };
  const start = p(e.start);
  const end = p(e.end);
  const center = p(e.center);
  if (start) out.start = start;
  if (end) out.end = end;
  if (center) out.center = center;
  if (typeof e.radius === "number") out.radius = e.radius * Math.abs(k);
  return out;
}
