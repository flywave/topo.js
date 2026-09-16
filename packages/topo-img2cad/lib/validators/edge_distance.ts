/**
 * The gate that can see a wrong silhouette when the drawing cannot give one.
 *
 * Mask IoU is the strongest shape check there is, and it needs a reference
 * silhouette: one closed region that is the part. Densely annotated drawings do
 * not have one — a fully dimensioned single part measured 143 enclosed regions
 * with the largest holding 19% of the area — so on exactly the drawings where
 * tracing is hardest, the gate goes silent.
 *
 * This measures the same thing without needing a region. It takes the OUTLINE of
 * the model's re-projection and asks how far it is from the nearest ink in the
 * drawing. Annotation does not break it: a dimension line near the part makes the
 * measure slightly lenient, where a missing region makes it impossible.
 *
 * What it catches, measured: a run that reported PASSED had half its outline more
 * than 30 pixels from anything in the drawing — 56.6px mean on a part 800px wide.
 * That is a shape error no other gate could see, because nothing else was looking.
 */

import type { ReviewIssue } from "../types.js";
import { resampleMaskIntoFrame } from "../cad/image.js";
import {
  distanceTransform,
  projectMesh,
  rasterizeMesh,
  translateProjected,
  unionBounds,
  viewBasis,
  type Bounds2D,
  type ViewBasis,
} from "../cad/project.js";
import { getMeshData } from "./reprojection.js";

export interface EdgeDistanceThresholds {
  /**
   * Maximum mean outline distance, as a fraction of the frame's diagonal.
   *
   * Relative rather than absolute so it means the same on a 5mm part and a
   * 1500mm one.
   */
  maxMeanFraction: number;
  /** Maximum 90th-percentile distance, same units. */
  maxP90Fraction: number;
  /**
   * Maximum mean distance as a fraction of what an arbitrary placement scores.
   *
   * The absolute bar above asks "is the outline on the drawing". On a sheet dense
   * with annotation it is close to free: measured on a fully dimensioned drawing
   * a wrong model scored 19.5px against a 28.5px floor, so being within a few
   * pixels of SOMETHING said nothing. This bar asks the question that survives
   * density — "is the outline much closer to the ink than a placement that knew
   * nothing would be". Measured: a correct part sits at 0.01-0.13, a traced disc
   * where the drawing had a part at 0.36-0.69.
   */
  maxMeanRatio: number;
  /**
   * Distance within which a match is accepted whatever the drawing's density.
   *
   * A correct model's outline is not exactly on the drawing's: both are one pixel
   * wide, so they can land a pixel apart, and on a densely annotated sheet that
   * pixel is a large share of the chance bar. One pixel is that floor — measured
   * on a correct model it was 0.7px against a 1.0px bar. It is deliberately as
   * small as it can be: every pixel of floor is a placement any model can aim
   * for, so raising it buys leniency for wrong models before it saves right ones.
   */
  matchFloorPx: number;
}

export const DEFAULT_EDGE_THRESHOLDS: EdgeDistanceThresholds = {
  maxMeanFraction: 0.015,
  maxP90Fraction: 0.035,
  maxMeanRatio: 0.2,
  matchFloorPx: 1,
};

export interface EdgeDistanceOptions {
  view: string | ViewBasis;
  /**
   * The drawing's ink — outline AND annotation — in the model-coordinate frame
   * `referenceBounds` if one is given, otherwise in the model's own frame.
   */
  ink: Uint8Array;
  inkWidth: number;
  inkHeight: number;
  /** Frame the ink was cut in. Omitted means "fit the ink to the model". */
  referenceBounds?: Bounds2D;
  width: number;
  height: number;
  thresholds?: EdgeDistanceThresholds;
  meshArgs?: [number, number, number, boolean];
  /**
   * Search for a placement before measuring, instead of taking the frame as given.
   *
   * The frame's scale is a vision model's estimate of how many pixels a stated
   * length spans, and it has been measured 14% off on a real drawing. Where a
   * silhouette exists that estimate gets checked against the part's own extent —
   * but a drawing with no extractable silhouette has nothing to check it against,
   * and a 14% scale error would put a geometrically perfect part 14% away from
   * the ink and fail it. So the gate looks for the best placement within a window
   * around the stated one, and reports whether the model can be placed to match
   * at all. That is the weaker question, and it is the true one.
   */
  search?: SearchOptions;
}

export interface SearchOptions {
  /** Largest translation to try, as a fraction of the frame's shorter side. */
  maxShiftFraction?: number;
  /** Scale factors to try on either side of the frame's, e.g. 1.2 = 0.83x..1.2x. */
  scaleRange?: number;
}

export const DEFAULT_SEARCH: Required<SearchOptions> = {
  // A quarter of the frame. The model's coordinates come from the profile read
  // off THIS drawing, so its placement is known to within the sheet's margin —
  // but only to within that margin, and the margin is not recorded anywhere.
  // Past it the search stops checking the model's shape and starts choosing the
  // drawing's location for it: measured, a free translation over the whole sheet
  // moved a two-disc model 94% of the frame onto a dense corner and scored it
  // 3.9px, passing something nothing should pass.
  maxShiftFraction: 0.25,
  // Narrow, because size IS shape: 20% of slack is what the drawing's own
  // pixel-per-millimetre estimate has been measured wrong by.
  scaleRange: 1.2,
};

/** Where the gate found the model, relative to the frame it was given. */
export interface Registration {
  scale: number;
  shiftXPx: number;
  shiftYPx: number;
  /**
   * How far the search had to move the model, as a fraction of the frame's
   * shorter side. A large value means the frame was wrong, not the part.
   */
  movedFraction: number;
  searched: number;
}

export interface EdgeDistanceResult {
  compared: boolean;
  meanPx: number;
  medianPx: number;
  p90Px: number;
  maxPx: number;
  /** The same distances as a fraction of the frame's diagonal. */
  meanFraction: number;
  p90Fraction: number;
  outlinePixels: number;
  frameDiagonalPx: number;
  /**
   * What an arbitrary placement scores on this drawing, in the same pixels.
   *
   * The floor the drawing imposes: a sheet dense with annotation puts almost any
   * outline within a few pixels of something, and there the absolute distance
   * cannot tell a match from a coincidence.
   */
  baselinePx: number;
  /** `meanPx / baselinePx` — 1 means the placement is no better than arbitrary. */
  meanRatio: number;
  /** Present when a placement search ran. */
  registration?: Registration;
  issues: ReviewIssue[];
  passed: boolean;
}

/** Scale a mask uniformly so it fits inside the model's extent. */
function fitUniformly(modelBounds: Bounds2D, width: number, height: number): Bounds2D {
  const modelW = modelBounds.maxX - modelBounds.minX || 1;
  const modelH = modelBounds.maxY - modelBounds.minY || 1;
  const scale = Math.min(modelW / (width || 1), modelH / (height || 1));
  return {
    minX: modelBounds.minX,
    minY: modelBounds.minY,
    maxX: modelBounds.minX + width * scale,
    maxY: modelBounds.minY + height * scale,
  };
}

/** Pixels of a mask that have at least one unset 4-neighbour. */
export function maskOutline(mask: Uint8Array, width: number, height: number): number[] {
  const outline: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!mask[i]) continue;
      const edge =
        x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
        !mask[i - 1] || !mask[i + 1] || !mask[i - width] || !mask[i + width];
      if (edge) outline.push(i);
    }
  }
  return outline;
}

/**
 * How far the model's projected outline sits from the drawing's ink.
 *
 * The two are placed in one shared frame exactly as the mask gate does it, so a
 * model drawn at the right size but in the wrong place is not excused and a model
 * at the right shape but the wrong size is not either.
 */
export function measureEdgeDistance(
  shape: unknown,
  opts: EdgeDistanceOptions,
): EdgeDistanceResult {
  const thresholds = opts.thresholds ?? DEFAULT_EDGE_THRESHOLDS;
  const kind = typeof opts.view === "string" ? opts.view : "custom";
  const empty: EdgeDistanceResult = {
    compared: false,
    meanPx: 0,
    medianPx: 0,
    p90Px: 0,
    maxPx: 0,
    meanFraction: 0,
    p90Fraction: 0,
    outlinePixels: 0,
    frameDiagonalPx: 0,
    baselinePx: 0,
    meanRatio: 0,
    issues: [],
    passed: true,
  };

  const mesh = getMeshData(shape, opts.meshArgs);
  if (!mesh) {
    return {
      ...empty,
      passed: false,
      issues: [
        {
          severity: "error",
          code: "EDG_NO_MESH",
          message: `View "${kind}": could not triangulate the shape to compare its outline`,
          suggestion: "Shape.mesh() failed — check the shape is a solid",
        },
      ],
    };
  }

  let basis: ViewBasis;
  try {
    basis = typeof opts.view === "string" ? viewBasis(opts.view) : opts.view;
  } catch (e) {
    return {
      ...empty,
      passed: false,
      issues: [
        { severity: "error", code: "EDG_BAD_VIEW", message: e instanceof Error ? e.message : String(e) },
      ],
    };
  }

  const projected = projectMesh(mesh, basis);
  const modelAtOrigin = translateProjected(
    projected,
    -projected.bounds.minX,
    -projected.bounds.minY,
  );
  const modelBounds: Bounds2D = {
    minX: 0,
    minY: 0,
    maxX: modelAtOrigin.bounds.maxX,
    maxY: modelAtOrigin.bounds.maxY,
  };
  const referenceBounds = opts.referenceBounds ?? fitUniformly(modelBounds, opts.inkWidth, opts.inkHeight);
  const frame = unionBounds(modelBounds, referenceBounds);

  const modelMask = rasterizeMesh(modelAtOrigin, {
    width: opts.width,
    height: opts.height,
    flipY: true,
    bounds: frame,
  });
  let inkMask: Uint8Array;
  try {
    inkMask = resampleMaskIntoFrame(
      opts.ink,
      opts.inkWidth,
      opts.inkHeight,
      referenceBounds,
      frame,
      opts.width,
      opts.height,
    );
  } catch (e) {
    return {
      ...empty,
      passed: false,
      issues: [
        {
          severity: "error",
          code: "EDG_INK_UNUSABLE",
          message: `View "${kind}": the drawing's ink could not be placed in the comparison frame (${e instanceof Error ? e.message : String(e)})`,
        },
      ],
    };
  }

  const inkPixels = inkMask.reduce((n, v) => n + (v ? 1 : 0), 0);
  if (inkPixels === 0) {
    return {
      ...empty,
      issues: [
        {
          severity: "warning",
          code: "EDG_NO_INK",
          message: `View "${kind}": the drawing has no ink in the comparison frame, so its outline cannot be measured against`,
        },
      ],
    };
  }

  const outline = maskOutline(modelMask, opts.width, opts.height);
  if (outline.length === 0) {
    return {
      ...empty,
      passed: false,
      issues: [
        {
          severity: "error",
          code: "EDG_EMPTY_MODEL",
          message: `View "${kind}": the projected model has no outline to measure`,
          suggestion: "The shape may be degenerate, or the view direction does not face it",
        },
      ],
    };
  }

  const dt = distanceTransform(inkMask, opts.width, opts.height);
  const points = outline.map((i) => ({
    x: (i % opts.width) + 0.5,
    y: Math.floor(i / opts.width) + 0.5,
  }));

  const search = opts.search ? { ...DEFAULT_SEARCH, ...opts.search } : undefined;
  const registration = search
    ? registerToInk(points, dt, opts.width, opts.height, search)
    : undefined;
  const placed = registration
    ? points.map((p) => ({
        x: registration.cx + (p.x - registration.cx) * registration.scale + registration.shiftXPx,
        y: registration.cy + (p.y - registration.cy) * registration.scale + registration.shiftYPx,
      }))
    : points;

  const distanceAt = (x: number, y: number) => sampleDistance(dt, opts.width, opts.height, x, y);

  // What an arbitrary placement would score on this drawing. A sparse line
  // drawing puts even a wrong outline far from any ink; a drawing that is dense
  // with annotation puts almost anything within a few pixels of something, and
  // there the absolute distance stops meaning "this matches" — it only means
  // "there is a lot of ink here". Measuring the model against that floor is what
  // keeps the gate from passing a bad model on a busy sheet.
  let baselineSum = 0;
  let baselineCount = 0;
  {
    const stride = Math.max(1, Math.round(Math.sqrt((opts.width * opts.height) / 2000)));
    for (let y = 0; y < opts.height; y += stride) {
      for (let x = 0; x < opts.width; x += stride) {
        baselineSum += distanceAt(x + 0.5, y + 0.5);
        baselineCount++;
      }
    }
  }
  const baseline = baselineCount > 0 ? baselineSum / baselineCount : 0;

  const distances = placed.map((p) => distanceAt(p.x, p.y));
  distances.sort((a, b) => a - b);
  const mean = distances.reduce((n, d) => n + d, 0) / distances.length;
  const median = distances[Math.floor(distances.length / 2)];
  const p90 = distances[Math.min(distances.length - 1, Math.floor(distances.length * 0.9))];
  const max = distances[distances.length - 1];

  // The diagonal, not the width: a part that is long and thin is judged against
  // its own scale rather than its aspect.
  const diagonal = Math.hypot(opts.width, opts.height);
  const meanFraction = mean / diagonal;
  const p90Fraction = p90 / diagonal;
  const meanRatio = baseline > 0 ? mean / baseline : 0;

  // The chance bar is floored: a correct outline is still a pixel away from the
  // drawn one, and on a densely annotated sheet that pixel is a large share of
  // what chance scores. The floor is a claim about rasterization, not shape.
  const chanceBar = Math.max(thresholds.maxMeanRatio * baseline, thresholds.matchFloorPx);

  const overAbsolute = meanFraction > thresholds.maxMeanFraction;
  const overChance = baseline > 0 && mean > chanceBar;

  const issues: ReviewIssue[] = [];
  if (overAbsolute || overChance) {
    const placement = registration
      ? ` The best placement a search over position and scale found still leaves ${(registration.movedFraction * 100).toFixed(0)}% of the frame between the model and the drawing.`
      : "";
    const chance = overChance
      ? ` An arbitrary placement on this drawing averages ${baseline.toFixed(1)}px from ink, so being ${mean.toFixed(1)}px from it is ${meanRatio.toFixed(2)} of chance — the drawing is dense enough with annotation that this closeness is not evidence of a match.`
      : "";
    issues.push({
      severity: "error",
      code: "EDG_OUTLINE_MISMATCH",
      message: `View "${kind}": the model's outline sits ${mean.toFixed(1)}px from the drawing's ink on average (${(meanFraction * 100).toFixed(2)}% of the frame, worst ${max.toFixed(1)}px) — the shape is not the shape on the drawing.${chance}${placement}`,
      suggestion:
        "Look at which part of the outline is furthest: a whole side being off means a missing or misplaced feature, a small region means one segment or dimension is wrong",
    });
  } else if (p90Fraction > thresholds.maxP90Fraction) {
    issues.push({
      severity: "warning",
      code: "EDG_LOCAL_MISMATCH",
      message: `View "${kind}": the model's outline mostly follows the drawing but its 90th percentile is ${p90.toFixed(1)}px (${(p90Fraction * 100).toFixed(2)}% of the frame) — part of the outline does not`,
      suggestion: "A local disagreement is usually one segment in the wrong place rather than a missing feature",
    });
  }

  return {
    compared: true,
    meanPx: mean,
    medianPx: median,
    p90Px: p90,
    maxPx: max,
    meanFraction,
    p90Fraction,
    outlinePixels: points.length,
    frameDiagonalPx: diagonal,
    baselinePx: baseline,
    meanRatio,
    registration: registration
      ? {
          scale: registration.scale,
          shiftXPx: registration.shiftXPx,
          shiftYPx: registration.shiftYPx,
          movedFraction: registration.movedFraction,
          searched: registration.searched,
        }
      : undefined,
    issues,
    passed: !issues.some((i) => i.severity === "error"),
  };
}

/** Nearest-ink distance at a sub-pixel point, bilinearly interpolated. */
function sampleDistance(
  dt: Float64Array | Float32Array | number[],
  width: number,
  height: number,
  x: number,
  y: number,
): number {
  if (x < 0 || y < 0 || x > width - 1 || y > height - 1) {
    // Outside the frame there is no ink and no distance; the corner is the
    // nearest thing the frame can say, and it is already far.
    const cx = Math.min(width - 1, Math.max(0, x));
    const cy = Math.min(height - 1, Math.max(0, y));
    return Math.hypot(x - cx, y - cy) + dt[Math.round(cy) * width + Math.round(cx)];
  }
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  const a = dt[y0 * width + x0];
  const b = dt[y0 * width + x1];
  const c = dt[y1 * width + x0];
  const d = dt[y1 * width + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

interface RegistrationInternal {
  scale: number;
  cx: number;
  cy: number;
  shiftXPx: number;
  shiftYPx: number;
  movedFraction: number;
  searched: number;
}

/**
 * Coarse-to-fine search for the placement that puts the outline on the ink.
 *
 * Scale is searched in log steps about the outline's own centroid, which leaves
 * the shape in place and grows it; translation is searched in frame pixels. The
 * distance field is computed once, so every candidate is a cheap table lookup.
 *
 * Translation is searched over the whole frame where the caller asks for it, and
 * that is not a loophole: nothing in a CAD model says where on the sheet the part
 * sits, so position is not evidence about shape either way. Size is, which is why
 * the scale window stays narrow.
 */
function registerToInk(
  points: Array<{ x: number; y: number }>,
  dt: Float64Array | Float32Array | number[],
  width: number,
  height: number,
  search: Required<SearchOptions>,
): RegistrationInternal {
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= points.length;
  cy /= points.length;

  const shortSide = Math.min(width, height);
  const maxShift = search.maxShiftFraction * shortSide;
  const minScale = 1 / search.scaleRange;
  const maxScale = search.scaleRange;

  const score = (scale: number, dx: number, dy: number): number => {
    let total = 0;
    for (const p of points) {
      total += sampleDistance(
        dt,
        width,
        height,
        cx + (p.x - cx) * scale + dx,
        cy + (p.y - cy) * scale + dy,
      );
    }
    return total / points.length;
  };

  const tested = { n: 0 };
  let best = { scale: 1, dx: 0, dy: 0, mean: score(1, 0, 0) };
  tested.n++;

  const clamp = (v: number) => Math.max(-maxShift, Math.min(maxShift, v));

  // Coarse: a grid over the window, at a handful of scales.
  const coarseScaleSteps = 7;
  const coarseShiftSteps = 21;
  const shiftStep = (maxShift * 2) / (coarseShiftSteps - 1);
  for (let si = 0; si < coarseScaleSteps; si++) {
    const t = si / (coarseScaleSteps - 1);
    const scale = minScale * Math.pow(maxScale / minScale, t);
    for (let xi = 0; xi < coarseShiftSteps; xi++) {
      for (let yi = 0; yi < coarseShiftSteps; yi++) {
        const dx = clamp(-maxShift + xi * shiftStep);
        const dy = clamp(-maxShift + yi * shiftStep);
        if (si === 0 && xi === 0 && yi === 0) continue;
        const mean = score(scale, dx, dy);
        tested.n++;
        if (mean < best.mean) best = { scale, dx, dy, mean };
      }
    }
  }

  // Fine: from the winner, halve the step until it is sub-pixel. A grid alone
  // leaves the best placement up to half a step from the truth, and that residue
  // is spent against the threshold — a correct part would eat into its own
  // budget for being found a few pixels off.
  const fineScaleSteps = 13;
  for (let si = 0; si < fineScaleSteps; si++) {
    const t = si / (fineScaleSteps - 1);
    const scale = minScale * Math.pow(maxScale / minScale, t);
    // Start each scale from where the grid pointed, so the walk is short.
    let dx = clamp(best.dx);
    let dy = clamp(best.dy);
    let here = score(scale, dx, dy);
    tested.n++;
    let step = shiftStep;
    while (step >= 0.5) {
      let moved = false;
      let bx = dx;
      let by = dy;
      for (let xi = -1; xi <= 1; xi++) {
        for (let yi = -1; yi <= 1; yi++) {
          if (xi === 0 && yi === 0) continue;
          const nx = clamp(dx + xi * step);
          const ny = clamp(dy + yi * step);
          if (nx === dx && ny === dy) continue;
          const mean = score(scale, nx, ny);
          tested.n++;
          if (mean < here) {
            here = mean;
            bx = nx;
            by = ny;
            moved = true;
          }
        }
      }
      if (!moved) step /= 2;
      dx = bx;
      dy = by;
    }
    if (here < best.mean) best = { scale, dx, dy, mean: here };
  }

  return {
    scale: best.scale,
    cx,
    cy,
    shiftXPx: best.dx,
    shiftYPx: best.dy,
    movedFraction: Math.hypot(best.dx, best.dy) / shortSide,
    searched: tested.n,
  };
}
