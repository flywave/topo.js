/**
 * Placing one set of points on another, by nearest-distance.
 *
 * Both shape checks in this package work the same way: they take an outline, ask
 * how far each of its points is from the drawing's ink, and look for the best
 * placement before judging the distance. The outline comes from different places
 * — the built solid's re-projection in `validators/edge_distance.ts`, the traced
 * profile in `validators/profile_to_ink.ts` — but the arithmetic is identical, and
 * keeping one copy is what keeps the two verdicts comparable.
 */

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

/** Where a placement was found, relative to the frame it was given. */
export interface Registration {
  scale: number;
  /**
   * The point the scale is applied about, in frame pixels.
   *
   * Carried so the placement is something a caller can APPLY, not merely read:
   * the relaxation moves a profile's vertices in the space the measurement placed
   * it in, and it has to reproduce that placement exactly or it would be
   * optimizing a different function than the one being reported.
   */
  cx: number;
  cy: number;
  shiftXPx: number;
  shiftYPx: number;
  /**
   * How far the search had to move the model, as a fraction of the frame's
   * shorter side. A large value means the frame was wrong, not the part.
   */
  movedFraction: number;
  searched: number;
}

export interface PlacementSearch {
  scale: number;
  /** Centre the scale is applied about, in frame pixels. */
  cx: number;
  cy: number;
  shiftXPx: number;
  shiftYPx: number;
  movedFraction: number;
  searched: number;
}

export type DistanceField = Float64Array | Float32Array | number[];

export type Point = { x: number; y: number };

/** Nearest-ink distance at a sub-pixel point, bilinearly interpolated. */
export function sampleDistance(
  dt: DistanceField,
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
export function searchPlacement(
  points: Point[],
  dt: DistanceField,
  width: number,
  height: number,
  search: Required<SearchOptions>,
): PlacementSearch {
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

/** Apply a placement to a point, in frame pixels. */
export function placePoint(p: Point, at: PlacementSearch): Point {
  return {
    x: at.cx + (p.x - at.cx) * at.scale + at.shiftXPx,
    y: at.cy + (p.y - at.cy) * at.scale + at.shiftYPx,
  };
}
