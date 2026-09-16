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
  rasterizeMeshEdges,
  translateProjected,
  unionBounds,
  viewBasis,
  type Bounds2D,
  type ViewBasis,
} from "../cad/project.js";
import { getMeshData } from "./reprojection.js";
import {
  DEFAULT_SEARCH,
  placePoint,
  sampleDistance,
  searchPlacement,
  type Registration,
  type SearchOptions,
} from "../cad/chamfer.js";

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

export type { Registration, SearchOptions } from "../cad/chamfer.js";
export { DEFAULT_SEARCH } from "../cad/chamfer.js";

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
   * True when the outline came from the mesh's edges rather than its fill.
   *
   * The kernel sometimes tessellates a solid's side walls and none of its planar
   * faces; the filled raster is then empty while the rims of those walls are still
   * exactly the silhouette boundary. Recorded because the measure is then the
   * boundary alone, without the holes the fill would have carried.
   */
  outlineFromEdges: boolean;
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
  /**
   * Where the outline is furthest from the ink.
   *
   * A mean says a model is wrong; this says WHICH PART of it, which is the only
   * form of the measurement a repair can act on. `ux`/`uy` are the centroid of
   * the worst points as fractions of the model's own projected extent, so (0, 0)
   * is its lower-left corner and (1, 1) its upper-right.
   */
  worst?: { share: number; meanPx: number; ux: number; uy: number };
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
    outlineFromEdges: false,
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
  let outline = maskOutline(modelMask, opts.width, opts.height);
  // When the fill is empty but the projection has extent, the kernel left the
  // planar faces out of the tessellation and what remains of the mesh is its side
  // walls — whose rims are the silhouette boundary. Taking those edges keeps the
  // shape measurable instead of reporting a defect of the kernel as one of the
  // model's. The fill is preferred whenever it exists, because it also carries the
  // holes.
  let outlineFromEdges = false;
  if (outline.length === 0) {
    const edgeMask = rasterizeMeshEdges(modelAtOrigin, {
      width: opts.width,
      height: opts.height,
      flipY: true,
      bounds: frame,
    });
    const edges = maskOutline(edgeMask, opts.width, opts.height);
    if (edges.length > 0) {
      outline = edges;
      outlineFromEdges = true;
    }
  }
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

  if (outline.length === 0) {
    // As in the mask gate: no projected extent is about the model, extent with an
    // empty raster is about the kernel's tessellation, which is not evidence that
    // the shape is wrong. Measured on a real run: a pig-shaped plate whose planar
    // faces the kernel would not triangulate — every one of its 2422 triangles was
    // a side wall — was reported as an error and failed a run whose solid was
    // valid, whose solver had converged, and whose STEP was written.
    const flat = modelBounds.maxX - modelBounds.minX <= 0 || modelBounds.maxY - modelBounds.minY <= 0;
    return {
      ...empty,
      compared: false,
      passed: !flat,
      issues: [
        flat
          ? {
              severity: "error",
              code: "EDG_EMPTY_MODEL",
              message: `View "${kind}": the projected model has no outline to measure`,
              suggestion: "The shape may be degenerate, or the view direction does not face it",
            }
          : {
              severity: "warning",
              code: "EDG_UNTRIANGULATED",
              message: `View "${kind}": the shape projects to ${(modelBounds.maxX - modelBounds.minX).toFixed(1)} x ${(modelBounds.maxY - modelBounds.minY).toFixed(1)} units but nothing was rasterized from it — the kernel's tessellation came back with no closed area, the same thing that makes an exported STL non-watertight. The outline was not measured here, because there was no outline to measure`,
              suggestion:
                "The model itself is untouched by this; the export's watertight report sees the same defect from the other side",
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
    ? searchPlacement(points, dt, opts.width, opts.height, search)
    : undefined;
  const placed = registration ? points.map((p) => placePoint(p, registration)) : points;

  const distanceAt = (x: number, y: number) => sampleDistance(dt, opts.width, opts.height, x, y);

  // What an arbitrary placement would score on this drawing. A sparse line
  // drawing puts even a wrong outline far from any ink; a drawing that is dense
  // with annotation puts almost anything within a few pixels of something, and
  // there the absolute distance stops meaning "this matches" — it only means
  // "there is a lot of ink here". Measuring the model against that floor is what
  // keeps the gate from passing a bad model on a busy sheet.
  //
  // Sampled over the DRAWING's own box, not the comparison frame. The latter is
  // the union of the two extents, which gives the model a say in its own bar: a
  // model that overhangs the drawing widens the frame, and a wider frame changes
  // both how much empty space enters the sample and how many pixels a millimetre
  // is worth. The floor is a property of the drawing.
  const baseline = (() => {
    const sx = frame.maxX - frame.minX || 1;
    const sy = frame.maxY - frame.minY || 1;
    const toPx = (v: number, min: number, span: number, size: number) =>
      Math.max(0, Math.min(size - 1, ((v - min) / span) * (size - 1)));
    // Raster row 0 is the frame's maxY, so the drawing's box flips on the way in.
    const x0 = Math.round(toPx(referenceBounds.minX, frame.minX, sx, opts.width));
    const x1 = Math.round(toPx(referenceBounds.maxX, frame.minX, sx, opts.width));
    const y0 = opts.height - 1 - Math.round(toPx(referenceBounds.maxY, frame.minY, sy, opts.height));
    const y1 = opts.height - 1 - Math.round(toPx(referenceBounds.minY, frame.minY, sy, opts.height));

    const stride = Math.max(
      1,
      Math.round(Math.sqrt(((x1 - x0 + 1) * (y1 - y0 + 1)) / 2000)),
    );
    let sum = 0;
    let count = 0;
    for (let y = y0; y <= y1; y += stride) {
      for (let x = x0; x <= x1; x += stride) {
        sum += distanceAt(x + 0.5, y + 0.5);
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  })();

  const distances = placed.map((p) => distanceAt(p.x, p.y));
  const order = placed
    .map((p, i) => ({ ...p, d: distances[i] }))
    .sort((a, b) => a.d - b.d);
  const sorted = order.map((o) => o.d);
  const mean = sorted.reduce((n, d) => n + d, 0) / sorted.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  const max = sorted[sorted.length - 1];

  // Where the worst tenth of the outline is, as a fraction of the model's own
  // projected extent. This is the part of the measurement a repair can act on:
  // "one edge is 40px out" is a model-level fact, "the lower-left corner region
  // is 40px out" is a tree-level one.
  const tail = order.slice(Math.floor(order.length * 0.9));
  let worst: EdgeDistanceResult["worst"];
  if (tail.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of placed) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    const cx = tail.reduce((n, p) => n + p.x, 0) / tail.length;
    const cy = tail.reduce((n, p) => n + p.y, 0) / tail.length;
    worst = {
      share: Number((tail.length / order.length).toFixed(4)),
      meanPx: tail.reduce((n, p) => n + p.d, 0) / tail.length,
      ux: (cx - minX) / spanX,
      // Reported bottom-up, matching the drawing's own y: raster rows run down.
      uy: 1 - (cy - minY) / spanY,
    };
  }

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
  const where = worst
    ? ` The worst tenth of the outline is at (${worst.ux.toFixed(2)}, ${worst.uy.toFixed(2)}) of the model's own extent — 0,0 being its lower-left — averaging ${worst.meanPx.toFixed(1)}px from ink there.`
    : "";
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
      message: `View "${kind}": the model's outline sits ${mean.toFixed(1)}px from the drawing's ink on average (${(meanFraction * 100).toFixed(2)}% of the frame, worst ${max.toFixed(1)}px) — the shape is not the shape on the drawing.${where}${chance}${placement}`,
      suggestion:
        "Look at which part of the outline is furthest: a whole side being off means a missing or misplaced feature, a small region means one segment or dimension is wrong",
    });
  } else if (p90Fraction > thresholds.maxP90Fraction) {
    issues.push({
      severity: "warning",
      code: "EDG_LOCAL_MISMATCH",
      message: `View "${kind}": the model's outline mostly follows the drawing but its 90th percentile is ${p90.toFixed(1)}px (${(p90Fraction * 100).toFixed(2)}% of the frame) — part of the outline does not.${where}`,
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
    outlineFromEdges,
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
    worst,
    issues,
    passed: !issues.some((i) => i.severity === "error"),
  };
}

