/**
 * Reference silhouettes, taken from the drawing itself.
 *
 * The re-projection gate can only measure a model against something, and if that
 * something is derived from the same profile the model was built from, the
 * measurement is self-referential: it proves the emitter ran, not that the model
 * looks like the drawing. So the reference is read off the IMAGE — the part's own
 * pixels, cropped to the view, thresholded, and registered to model coordinates
 * through the drawing's scale.
 *
 * Without scale evidence the mask cannot be given an absolute size. It is still
 * used, fitted uniformly to the model, which keeps every shape and hole-position
 * check and drops only the size check. Which of the two happened is reported,
 * because "the model is 20% too big" is exactly the error the absolute
 * comparison exists to catch and the normalized one cannot see.
 */

import type { ViewKind, ViewSet, ViewSpec } from "./model.js";
import type { Bounds2D } from "./project.js";
import {
  cropRaster,
  cropSilhouetteToBBox,
  extractSilhouette,
  loadRaster,
  regionToPixelBox,
  type Raster,
  type SilhouetteMode,
} from "./image.js";

/** The orthographic views a silhouette can be projected along. */
export const ORTHOGRAPHIC_VIEW_KINDS: ReadonlySet<string> = new Set([
  "front",
  "top",
  "right",
  "left",
  "back",
  "bottom",
]);

export interface ViewReference {
  viewId: string;
  viewKind: ViewKind;
  /** The part's silhouette, cropped to its own bounding box. */
  mask: Uint8Array;
  maskWidth: number;
  maskHeight: number;
  /**
   * Model-coordinate frame the mask covers, when the drawing carried scale
   * evidence. Absent means the mask will be fitted to the model instead.
   */
  referenceBounds?: Bounds2D;
  /**
   * True when that frame was placed using the model's own pixel estimate.
   *
   * The real length comes from text on the drawing ("120"), which is reliable;
   * the pixel length is a vision model's estimate of how many pixels that spans,
   * which is the least dependable number the pipeline produces — measured at 14%
   * off on a real drawing. A size mismatch against such a reference is at least
   * as likely to be a misread scale as a wrong dimension, and saying so is what
   * stops a repair loop from resizing a correct part to match it.
   */
  scaleFromModelEstimate: boolean;
  /** Which mode actually discriminated part from paper. */
  silhouetteMode: "ink" | "region";
  notes: string[];
}

export interface ReferenceBuildResult {
  references: ViewReference[];
  /** Why a view produced no reference, or how one was degraded. */
  notes: string[];
}

export interface ReferenceBuildOptions {
  /** Rasterized drawing. Omit to skip image references entirely. */
  raster?: Raster;
  /** Silhouette extraction mode; defaults to the module's auto rule. */
  silhouetteMode?: SilhouetteMode;
  /** Raster resolution the comparison runs at. */
  width: number;
  height: number;
}

/**
 * Build a reference silhouette for every orthographic view.
 *
 * A view without a `region` is taken to be the whole image, which is only right
 * for a single-view drawing — a multi-view sheet would blend the views into one
 * silhouette. That case is reported rather than left implicit.
 */
export function buildViewReferences(
  viewSet: ViewSet,
  opts: ReferenceBuildOptions,
): ReferenceBuildResult {
  const references: ViewReference[] = [];
  const notes: string[] = [];

  if (!opts.raster) {
    notes.push(
      "no raster reference: the re-projection gate can only check cross-view consistency, not the drawing itself",
    );
    return { references, notes };
  }

  const orthographic = viewSet.views.filter((v) => ORTHOGRAPHIC_VIEW_KINDS.has(v.kind));
  if (orthographic.length === 0) {
    notes.push("no orthographic view in the drawing — there is nothing to re-project along");
    return { references, notes };
  }

  const regionless = orthographic.filter((v) => !v.region);
  if (orthographic.length > 1 && regionless.length > 0) {
    notes.push(
      `${regionless.length} of ${orthographic.length} orthographic views have no region; the whole image is used for those, which mixes views on a multi-view sheet`,
    );
  }

  for (const view of orthographic) {
    const built = buildViewReference(view, viewSet, opts);
    if (built.reference) {
      references.push(built.reference);
    }
    notes.push(...built.notes);
  }

  return { references, notes };
}

/** Load the drawing and build a reference for every orthographic view. */
export function buildViewReferencesFromImage(
  imagePath: string,
  viewSet: ViewSet,
  opts: Omit<ReferenceBuildOptions, "raster">,
): ReferenceBuildResult {
  let raster: Raster;
  try {
    raster = loadRaster(imagePath);
  } catch (e) {
    return {
      references: [],
      notes: [
        `could not read the drawing as a raster (${e instanceof Error ? e.message : String(e)}); the re-projection gate will not compare against it`,
      ],
    };
  }
  return buildViewReferences(viewSet, { ...opts, raster });
}

function buildViewReference(
  view: ViewSpec,
  viewSet: ViewSet,
  opts: ReferenceBuildOptions,
): { reference?: ViewReference; notes: string[] } {
  const notes: string[] = [];
  const raster = opts.raster!;

  let cropped: Raster;
  try {
    cropped = view.region ? cropRaster(raster, regionBox(view.region, raster)) : raster;
  } catch (e) {
    return { notes: [`view ${view.id}: region is not usable — ${e instanceof Error ? e.message : String(e)}`] };
  }

  const silhouette = extractSilhouette(cropped, { mode: opts.silhouetteMode ?? "auto" });
  if (silhouette.bbox.x1 < silhouette.bbox.x0 || silhouette.bbox.y1 < silhouette.bbox.y0) {
    return {
      notes: [
        `view ${view.id}: no part silhouette was found in the image (${silhouette.notes.join("; ") || "the mask is empty"})`,
      ],
    };
  }

  const local = cropSilhouetteToBBox(silhouette);
  const mask = local.mask;
  const maskWidth = local.width;
  const maskHeight = local.height;

  const coverage = local.mask.reduce((n, v) => n + (v ? 1 : 0), 0) / (maskWidth * maskHeight);
  if (coverage > 0.98) {
    notes.push(
      `view ${view.id}: the silhouette fills its bounding box entirely, which is what a solid rectangle looks like — check the image background is distinguishable from the part`,
    );
  }
  notes.push(...silhouette.notes);

  const mmPerPixel = viewSet.scale?.mmPerPixel;
  let referenceBounds: Bounds2D | undefined;
  if (mmPerPixel && isFinite(mmPerPixel) && mmPerPixel > 0) {
    referenceBounds = {
      minX: 0,
      minY: 0,
      maxX: maskWidth * mmPerPixel,
      maxY: maskHeight * mmPerPixel,
    };
    notes.push(
      `view ${view.id}: the mask covers ${referenceBounds.maxX.toFixed(1)} x ${referenceBounds.maxY.toFixed(1)} mm, placed from the model's own pixel estimate (${mmPerPixel.toFixed(4)} mm/px) — the drawing states the real length but not how many pixels it spans, and that estimate is the softest number in this run`,
    );
  } else {
    notes.push(
      `view ${view.id}: no scale evidence, so the reference is fitted to the model — shape is checked, size is not`,
    );
  }

  return {
    reference: {
      viewId: view.id,
      viewKind: view.kind,
      mask,
      maskWidth,
      maskHeight,
      referenceBounds,
      scaleFromModelEstimate: referenceBounds !== undefined,
      silhouetteMode: silhouette.mode,
      notes,
    },
    notes,
  };
}

/**
 * The view's region as a pixel box, refusing one that contains no pixels.
 *
 * `cropRaster` clamps, so an empty box would silently become a one-pixel crop and
 * the silhouette would be taken from a corner of the drawing.
 */
function regionBox(region: [number, number, number, number], raster: Raster) {
  const box = regionToPixelBox(region, raster.width, raster.height);
  if (box.x1 < box.x0 || box.y1 < box.y0) {
    throw new Error("normalized region collapses to an empty pixel box");
  }
  return box;
}
