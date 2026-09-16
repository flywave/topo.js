/**
 * How well the traced profile follows the drawing's ink.
 *
 * The outline gate (`edge_distance.ts`) measures the BUILT solid against the
 * drawing, and that is the verdict that matters — but it arrives at the end of a
 * four-minute run, after a tree, a code emission and a kernel build, and when it
 * says "the shape is wrong" it cannot say which of the thirty-one traced segments
 * is wrong. The mesh carries no tags; the profile still does.
 *
 * So this measures the same thing one stage earlier, on the profile itself: for
 * every entity, the mean distance from its own tessellation to the nearest ink.
 * It needs no kernel, so it can run the moment the profile is read, and what it
 * produces is a list of named suspects — "arc a26 is 47px off, e27 is 25px off" —
 * which the tree-building prompt can act on and the repair loop can be told.
 *
 * The measurement is the same two-bar one the outline gate uses, and for the same
 * reasons: an absolute distance as a fraction of the frame, and the distance
 * divided by what an ARBITRARY placement of this profile scores. On a drawing
 * dense with annotation the absolute number is nearly free — measured, a wrong
 * model sat at 19.5px against a 28.5px floor — and only the second bar tells a
 * match from a coincidence.
 *
 * What it is NOT is a verdict on the run, and that distinction decides its
 * severity. Every check that gates measures the BUILT body; this measures the
 * tracing, one stage before a body exists. A tree may legitimately depart from the
 * profile it was handed — a model that reads "the legs of this cartoon are 6 wide"
 * off the sheet is right even where the tracer drew them 12 — and failing the run
 * for the tracer's error would refuse a correct model. So these are warnings: the
 * tree stage is told, the reader is told, and the artifact's verdict stays with
 * the gate that can see the artifact.
 */

import type { ReviewIssue } from "../types.js";
import { distanceTransform } from "../cad/project.js";
import { DEFAULT_SEARCH, placePoint, sampleDistance, searchPlacement, type Registration, type SearchOptions } from "../cad/chamfer.js";
import { profileToPoints, tessellateArc } from "../cad/sketch_codegen.js";
import type { Profile2D, ProfileEntity } from "../cad/model.js";

export interface ProfileToInkOptions {
  /** The drawing's ink at its own resolution, and the frame it covers in mm. */
  ink: Uint8Array;
  inkWidth: number;
  inkHeight: number;
  /**
   * Model-coordinate frame the ink covers.
   *
   * Absent when the drawing carries no scale evidence, in which case the profile
   * is fitted into the ink's own pixel box and only SHAPE is being checked. The
   * result says which happened rather than implying a size check it did not make.
   */
  inkBounds?: { minX: number; minY: number; maxX: number; maxY: number };
  /** Where to look for the profile, so a wrong frame does not read as a wrong shape. */
  search?: SearchOptions;
  /** Set false to measure at the frame as given. */
  register?: boolean;
  thresholds?: ProfileToInkThresholds;
}

export interface ProfileToInkThresholds {
  /** Maximum mean distance, as a fraction of the frame diagonal. */
  maxMeanFraction: number;
  /** Maximum mean distance, as a fraction of what an arbitrary placement scores. */
  maxMeanRatio: number;
  /** Distance within which a match is accepted however dense the drawing is. */
  matchFloorPx: number;
  /**
   * How far a single entity may sit before it is named individually.
   *
   * Judged in the same units as the whole-profile bar, so naming a suspect and
   * failing the profile mean the same thing.
   */
  entityMeanFraction: number;
}

export const DEFAULT_PROFILE_TO_INK_THRESHOLDS: ProfileToInkThresholds = {
  maxMeanFraction: 0.015,
  maxMeanRatio: 0.2,
  matchFloorPx: 1,
  entityMeanFraction: 0.02,
};

/** One entity's own distance from the ink. */
export interface EntityDistance {
  tag: string;
  type: string;
  /** Mean distance in frame pixels, and as a fraction of the frame diagonal. */
  meanPx: number;
  meanFraction: number;
  /** Sampled points, so a two-point entity cannot look precise. */
  samples: number;
  /** The entity's own length in model units, to say how much of the profile it is. */
  lengthUnits: number;
  /** What it is, for the reader: endpoints, or a centre and radius. */
  description: string;
}

export interface ProfileToInkResult {
  /** Which view it measured. */
  viewId?: string;
  compared: boolean;
  /**
   * What the comparison could actually see: "absolute" also checks size,
   * "normalized" only shape.
   */
  registration: "absolute" | "normalized";
  meanPx: number;
  p90Px: number;
  maxPx: number;
  meanFraction: number;
  /** Mean divided by what an arbitrary placement of this profile scores. */
  meanRatio: number;
  baselinePx: number;
  samples: number;
  frameDiagonalPx: number;
  /** Where the profile was found to sit, when a search ran. */
  placement?: Registration;
  /** Every entity, worst first. */
  entities: EntityDistance[];
  /**
   * Whether the profile sits on the ink, by both bars.
   *
   * A measurement, not a verdict — see the note at the top of this file. Named
   * `onInk` rather than `passed` so nothing reads it as one.
   */
  onInk: boolean;
  issues: ReviewIssue[];
}

/**
 * Run the profile, entity by entity, against the drawing's ink.
 */
export function measureProfileToInk(
  profile: Profile2D,
  opts: ProfileToInkOptions,
): ProfileToInkResult {
  const thresholds = opts.thresholds ?? DEFAULT_PROFILE_TO_INK_THRESHOLDS;
  const W = opts.inkWidth;
  const H = opts.inkHeight;
  const empty: ProfileToInkResult = {
    viewId: profile.viewId,
    compared: false,
    registration: opts.inkBounds ? "absolute" : "normalized",
    meanPx: 0,
    p90Px: 0,
    maxPx: 0,
    meanFraction: 0,
    meanRatio: 0,
    baselinePx: 0,
    samples: 0,
    frameDiagonalPx: Math.hypot(W, H),
    entities: [],
    onInk: false,
    issues: [],
  };

  const real = (profile.entities ?? []).filter((e) => !e.construction);
  if (real.length === 0) {
    return {
      ...empty,
      issues: [
        {
          severity: "warning",
          code: "PTI_NO_PROFILE",
          message: `View "${profile.viewId}": the profile has no entities to measure against the drawing`,
        },
      ],
    };
  }

  // The ink's frame is in model units; the profile is in the tracer's. One shared
  // raster holds both, exactly as the outline gate arranges it — and when the
  // drawing carries no scale there is no shared frame to hold, so the profile's
  // own box is fitted into the ink's uniformly and only shape is left to check.
  const frame = inkFrame({ opts, entities: real, width: W, height: H });
  const toPx = frame.toPx;

  const perEntity = real.map((e) => ({
    entity: e,
    points: entityPoints(e).map(toPx),
  }));
  const all = perEntity.flatMap((p) => p.points);
  if (all.length === 0) {
    return {
      ...empty,
      issues: [
        {
          severity: "warning",
          code: "PTI_NO_SAMPLES",
          message: `View "${profile.viewId}": none of the profile's entities could be sampled`,
        },
      ],
    };
  }

  const dt = distanceTransform(opts.ink, W, H);

  const search =
    opts.register === false ? undefined : { ...DEFAULT_SEARCH, ...(opts.search ?? {}) };
  const registration = search ? searchPlacement(all, dt, W, H, search) : undefined;
  const placed = perEntity.map((p) => ({
    entity: p.entity,
    points: registration ? p.points.map((q) => placePoint(q, registration)) : p.points,
  }));

  const distanceAt = (p: { x: number; y: number }) => sampleDistance(dt, W, H, p.x, p.y);

  // What an arbitrary placement of THIS profile scores: the drawn frame is the
  // sample, not the union of the two extents, so a profile larger than the
  // drawing cannot widen the frame and raise its own bar.
  const baseline = (() => {
    const stride = Math.max(1, Math.round(Math.sqrt((W * H) / 2000)));
    let sum = 0;
    let count = 0;
    for (let y = 0; y < H; y += stride) {
      for (let x = 0; x < W; x += stride) {
        sum += distanceAt({ x: x + 0.5, y: y + 0.5 });
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  })();

  const scored: EntityDistance[] = placed.map(({ entity, points }) => {
    const ds = points.map(distanceAt).sort((a, b) => a - b);
    const mean = ds.reduce((n, d) => n + d, 0) / ds.length;
    return {
      tag: entity.tag,
      type: entity.type,
      meanPx: mean,
      meanFraction: mean / Math.hypot(W, H),
      samples: ds.length,
      lengthUnits: entityLength(entity),
      description: describeEntity(entity),
    };
  });
  scored.sort((a, b) => b.meanPx - a.meanPx);

  const distances = placed.flatMap((p) => p.points.map(distanceAt)).sort((a, b) => a - b);
  const mean = distances.reduce((n, d) => n + d, 0) / distances.length;
  const p90 = distances[Math.min(distances.length - 1, Math.floor(distances.length * 0.9))];
  const max = distances[distances.length - 1];
  const diagonal = Math.hypot(W, H);
  const meanFraction = mean / diagonal;
  const meanRatio = baseline > 0 ? mean / baseline : 0;

  // The same two bars as the outline gate, and the same reason for each: the
  // absolute one is the only one that means anything on a sparse drawing, and the
  // chance one is the only one that means anything on a busy one.
  const chanceBar = Math.max(thresholds.maxMeanRatio * baseline, thresholds.matchFloorPx);
  const overAbsolute = meanFraction > thresholds.maxMeanFraction;
  const overChance = baseline > 0 && mean > chanceBar;

  const issues: ReviewIssue[] = [];
  const modeNote =
    opts.inkBounds === undefined
      ? " The drawing carries no scale, so the profile was fitted into the ink's box: shape is checked and size is not."
      : "";
  if (overAbsolute || overChance) {
    const suspects = scored.filter((e) => e.meanFraction > thresholds.entityMeanFraction).slice(0, 6);
    const named = suspects.length
      ? ` Worst entities: ${suspects.map((s) => `${s.tag} (${s.type}, ${s.meanPx.toFixed(0)}px, ${s.description})`).join("; ")}.`
      : "";
    const chance = overChance
      ? ` An arbitrary placement of this profile averages ${baseline.toFixed(1)}px from ink, so being ${mean.toFixed(1)}px from it is ${meanRatio.toFixed(2)} of chance.`
      : "";
    issues.push({
      severity: "warning",
      code: "PTI_PROFILE_OFF_INK",
      message: `View "${profile.viewId}": the traced profile sits ${mean.toFixed(1)}px from the drawing's ink on average (${(meanFraction * 100).toFixed(2)}% of the frame, worst ${max.toFixed(1)}px, ${distances.length} sample points).${chance}${named}${modeNote}`,
      suggestion:
        "Re-aim the named entities: their traced coordinates do not follow the ink they were read from. Fixing the worst few moves the mean most",
    });
  } else if (scored.length > 0 && scored[0].meanFraction > thresholds.entityMeanFraction) {
    // The profile as a whole lands on the drawing but a piece of it does not.
    const worst = scored[0];
    issues.push({
      severity: "warning",
      code: "PTI_ENTITY_OFF_INK",
      message: `View "${profile.viewId}": the profile follows the drawing on average (${(meanFraction * 100).toFixed(2)}% of the frame) but ${worst.tag} (${worst.type}) sits ${worst.meanPx.toFixed(1)}px from ink (${(worst.meanFraction * 100).toFixed(2)}%) — ${worst.description}`,
      suggestion: "One entity is out; re-aim it rather than reshaping the profile",
    });
  }

  return {
    viewId: profile.viewId,
    compared: true,
    registration: opts.inkBounds ? "absolute" : "normalized",
    meanPx: mean,
    p90Px: p90,
    maxPx: max,
    meanFraction,
    meanRatio,
    baselinePx: baseline,
    samples: distances.length,
    frameDiagonalPx: diagonal,
    placement: registration
      ? {
          scale: registration.scale,
          cx: registration.cx,
          cy: registration.cy,
          shiftXPx: registration.shiftXPx,
          shiftYPx: registration.shiftYPx,
          movedFraction: registration.movedFraction,
          searched: registration.searched,
        }
      : undefined,
    entities: scored,
    onInk: !overAbsolute && !overChance,
    issues,
  };
}

/**
 * The mapping between a profile's own units and the ink's pixels.
 *
 * Exposed because a caller that wants to move a profile onto the ink has to map its
 * points exactly as the measurement does — a mover that used a slightly different
 * mapping would be optimizing a different function than the one being reported.
 */
export interface InkFrame {
  toPx: (p: [number, number]) => { x: number; y: number };
  /** Units per pixel along each axis, for moving a point in the profile's units. */
  unitsPerPxX: number;
  unitsPerPxY: number;
  width: number;
  height: number;
  diagonal: number;
  /** True when the drawing carried a scale, so size is being checked. */
  absolute: boolean;
}

export function inkFrame(args: {
  opts: { inkBounds?: { minX: number; minY: number; maxX: number; maxY: number } };
  entities: ProfileEntity[];
  width: number;
  height: number;
}): InkFrame {
  const { opts, entities, width: W, height: H } = args;
  const source =
    opts.inkBounds ??
    (() => {
      const b = boundsOf(entities);
      if (!b) return { minX: 0, minY: 0, maxX: W, maxY: H };
      // A square box around the profile, so fitting it into the ink's box keeps
      // the profile's aspect — a non-uniform fit would make every profile agree.
      const side = Math.max(b.width, b.height) || 1;
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      return { minX: cx - side / 2, minY: cy - side / 2, maxX: cx + side / 2, maxY: cy + side / 2 };
    })();
  const spanX = source.maxX - source.minX || 1;
  const spanY = source.maxY - source.minY || 1;
  // The ink's own box, in the frame's units, is where the profile is fitted to.
  const targetX = opts.inkBounds ? spanX : (spanX * Math.min(W, H)) / Math.max(W, H);
  const targetY = opts.inkBounds ? spanY : targetX;

  return {
    toPx: (p) => ({
      x: ((p[0] - source.minX) / targetX) * (W - 1),
      // Raster row 0 is the frame's maxY, matching `rasterizeMesh`'s flipY.
      y: (1 - (p[1] - source.minY) / targetY) * (H - 1),
    }),
    unitsPerPxX: targetX / (W - 1),
    unitsPerPxY: targetY / (H - 1),
    width: W,
    height: H,
    diagonal: Math.hypot(W, H),
    absolute: opts.inkBounds !== undefined,
  };
}

/**
 * An entity's own sample points.
 *
 * Denser than the outline gate's grid, because these are the points a reader will
 * be shown by name: an arc sampled at four points can be 40px out and look exact.
 */
function entityPoints(e: ProfileEntity): Array<[number, number]> {
  if (e.type === "line") {
    if (!e.start || !e.end) return [];
    const n = 24;
    return Array.from({ length: n + 1 }, (_, i) => [
      e.start![0] + ((e.end![0] - e.start![0]) * i) / n,
      e.start![1] + ((e.end![1] - e.start![1]) * i) / n,
    ]);
  }
  if (e.type === "circle" || e.type === "arc") {
    return tessellateArc(e, 48).length > 0 ? tessellateArc(e, 48) : [];
  }
  if (!e.start || !e.end) return [];
  return [e.start, e.end];
}

/** The extent of a set of entities in their own units. */
function boundsOf(entities: ProfileEntity[]): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const visit = (x: number, y: number) => {
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
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function entityLength(e: ProfileEntity): number {
  if (e.type === "line" && e.start && e.end) {
    return Math.hypot(e.end[0] - e.start[0], e.end[1] - e.start[1]);
  }
  if (typeof e.radius === "number") return 2 * Math.PI * e.radius;
  return 0;
}

function describeEntity(e: ProfileEntity): string {
  if (e.type === "line" && e.start && e.end) {
    return `line (${e.start[0].toFixed(1)},${e.start[1].toFixed(1)})->(${e.end[0].toFixed(1)},${e.end[1].toFixed(1)})`;
  }
  if (e.center && typeof e.radius === "number") {
    return `${e.type} centre (${e.center[0].toFixed(1)},${e.center[1].toFixed(1)}) r=${e.radius.toFixed(1)}`;
  }
  return e.type;
}

/** The points of a profile in one flat list, for callers that only need coverage. */
export function profilePoints(profile: Profile2D): Array<[number, number]> {
  return profileToPoints((profile.entities ?? []).filter((e) => !e.construction)) ?? [];
}
