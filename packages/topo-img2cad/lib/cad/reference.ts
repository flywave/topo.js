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
   * True when the frame's scale could not be checked against the drawing.
   *
   * The real length comes from text on the drawing ("120") and is reliable; the
   * pixel length is a vision model's estimate of how many pixels that spans, and
   * is the least dependable number the pipeline produces — measured at 14% off
   * on a real drawing. The silhouette lets us check it: the mask IS the part, so
   * its own extent in pixels is what that dimension refers to. When the model's
   * estimate agrees with that measurement (or is corrected to it) the scale is
   * verified and a size mismatch means the dimensions really are wrong. Only
   * when the dimension plainly does not span the silhouette — a bore diameter in
   * a much wider plate — is the scale left unchecked, and only then is a size
   * mismatch as likely to be a misread scale as a wrong dimension.
   */
  scaleUnverified: boolean;
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
 * A view without a `region` can only be read as the whole image, and that is
 * right only when the sheet holds one view. On a multi-view sheet it would blend
 * every view into a single silhouette and the gate would then report a confident,
 * meaningless IoU — so those views get no reference at all and the run says so.
 * "Cannot check this" is a worse answer than a passing one and a much better
 * answer than a wrong one.
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

  // The whole image is the view only when there is just one of them.
  const wholeImageIsTheView = orthographic.length === 1;

  for (const view of orthographic) {
    if (!view.region && !wholeImageIsTheView) {
      notes.push(
        `view ${view.id}: the drawing holds ${orthographic.length} views and this one has no region, so its extent on the sheet is unknown — no reference silhouette was built for it, and the re-projection gate is skipped rather than comparing against a crop that would blend every view together`,
      );
      continue;
    }

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

  const scale = realignScale(viewSet, maskWidth, maskHeight, notes);
  const mmPerPixel = scale.mmPerPixel;
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
      scaleUnverified: referenceBounds !== undefined && !scale.verified,
      silhouetteMode: silhouette.mode,
      notes,
    },
    notes,
  };
}

/**
 * The millimetres per pixel to place the mask's frame with.
 *
 * `ViewSet.scale` carries two numbers of very different quality: `realLength`,
 * which is text on the drawing ("120"), and `imageLength`, which is a vision
 * model's estimate of how many pixels that spans. Measured against a real
 * drawing the estimate was 14% high — 684 px for a 600 px edge — and that 14%
 * alone turned a geometrically perfect part into a 0.61 IoU and a failed run.
 *
 * The pixel figure is also the one number here we do not have to ask for: the
 * silhouette IS the part, so its own extent in pixels is the measurement the
 * dimension refers to. Combining the stated length with our own measurement
 * leaves the model's estimate doing only what it is good at — saying which axis
 * the dimension lies on.
 *
 * The correction is refused when the dimension plainly does not span the
 * silhouette (a bore diameter, say, in a plate several times wider), because
 * then the silhouette is not the extent that dimension measures.
 */
function realignScale(
  viewSet: ViewSet,
  maskWidth: number,
  maskHeight: number,
  notes: string[],
): { mmPerPixel: number | undefined; verified: boolean } {
  const scale = viewSet.scale;
  const declared = scale?.mmPerPixel;
  const keep = { mmPerPixel: declared, verified: false };
  if (!scale || !declared || !isFinite(declared) || declared <= 0) return keep;

  // An assumed scale is a guess, so there is nothing to realign it against.
  if (scale.kind === "assumed") return keep;
  if (!isFinite(scale.realLength) || scale.realLength <= 0) return keep;
  if (!isFinite(scale.imageLength) || scale.imageLength <= 0) return keep;

  // A dimension that measures a FEATURE cannot be realigned to the silhouette,
  // because the silhouette is not the extent it measures: a Ø40 hole in a 120mm
  // plate has no relation to the plate's own width. The label says which this is,
  // and that is a far better discriminator than any ratio — measured across live
  // runs, the model's pixel estimate for a genuine overall dimension has been off
  // by up to 46%, which overlaps almost entirely with where a bore diameter would
  // land. Prefixes are how drawings mark feature dimensions.
  const label = (scale.label ?? "").trim();
  if (/^(?:ø|⌀|φ|r|dia\b|radius|thk\b|t\s*=)/i.test(label)) {
    notes.push(
      `the stated dimension "${label}" measures a feature rather than the part, so it cannot place the silhouette's scale — the scale was left as the model read it`,
    );
    return keep;
  }

  const nearer = (value: number, target: number) => Math.abs(Math.log(value / target));
  const useWidth = nearer(maskWidth, scale.imageLength) <= nearer(maskHeight, scale.imageLength);
  const extent = useWidth ? maskWidth : maskHeight;

  // With a feature dimension excluded, this still has to be plausible: an overall
  // dimension should be within a factor of a few of the silhouette it spans. The
  // band is wide because the estimate is poor — being strict here means falling
  // back to the very number the correction exists to replace.
  const plausibility = extent / scale.imageLength;
  if (!isFinite(plausibility) || plausibility < 0.4 || plausibility > 2.5) {
    notes.push(
      `the stated dimension "${label || scale.realLength}" spans about ${scale.imageLength}px, which does not match this silhouette's ${extent}px ${useWidth ? "width" : "height"} — it measures something local, so the scale was left as the model read it`,
    );
    return keep;
  }

  const measured = scale.realLength / extent;
  if (!isFinite(measured) || measured <= 0) return keep;

  const drift = Math.abs(measured - declared) / declared;
  // The model's own estimate agrees with what we measured, so it is confirmed
  // rather than merely trusted.
  if (drift <= 0.02) return { mmPerPixel: declared, verified: true };

  notes.push(
    `scale realigned: the drawing's "${scale.label ?? scale.realLength}" was read as spanning ${scale.imageLength}px, but this silhouette's ${useWidth ? "width" : "height"} is ${extent}px — placing the mask at ${measured.toFixed(4)} mm/px rather than ${declared.toFixed(4)}`,
  );
  return { mmPerPixel: measured, verified: true };
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
