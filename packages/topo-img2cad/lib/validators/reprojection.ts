/**
 * Re-projection gate — the CAD-native replacement for img2threejs's
 * screenshot-and-compare loop.
 *
 * Geometric validation (volume > 0, finite bbox) cannot tell a correct model
 * from a wrong one. This can: it projects the built solid back along the view
 * the drawing was made from, rasterizes the silhouette, and measures it against
 * the reference. The verdict is arithmetic, not a vision model's opinion.
 *
 * Two things it catches that nothing else in the pipeline does:
 *   - the model is a valid solid but the wrong shape
 *   - the model is right in one view and wrong in another (view consistency)
 */

import type { ReviewIssue } from "../types.js";
import { resampleMaskIntoFrame } from "../cad/image.js";
import {
  chamferDistance,
  checkViewConsistency,
  compareMasks,
  distanceTransform,
  projectMesh,
  rasterizeLoops,
  rasterizeMesh,
  translateProjected,
  unionBounds,
  viewBasis,
  type Bounds2D,
  type MeshLike,
  type ProjectedMesh,
  type ViewBasis,
} from "../cad/project.js";

// ---------------------------------------------------------------------------
// Reference silhouette
// ---------------------------------------------------------------------------

/**
 * The reference to compare against.
 *
 * Either a rasterized mask or polygon loops (outer boundary plus any holes,
 * which the even-odd fill handles). Coordinates are in the same normalized
 * frame the model is fitted to — see `fitToReference` in ReprojectionOptions.
 */
export type ReferenceSilhouette =
  | { kind: "mask"; width: number; height: number; mask: Uint8Array }
  | { kind: "loops"; width: number; height: number; loops: Array<Array<[number, number]>> };

export interface ReprojectionOptions {
  /** Raster size. Reference and model are compared at this resolution. */
  width: number;
  height: number;
  /**
   * Frame the two silhouettes are compared in.
   *
   * "reference" (default): the reference's own extent defines the frame, and
   * the model is placed in it by its own model coordinates. No registration is
   * needed because both sides are in model units, and size or position errors
   * surface as IoU loss.
   *
   * "normalized": the model's extent maps onto a 0..1 box and the reference is
   * read in 0..1 as well.
   *
   * Either way both are rasterized in ONE shared frame. Normalizing each to its
   * own bounding box independently would make every pair of silhouettes agree,
   * which is precisely the failure this gate exists to catch.
   */
  referenceFrame?: "reference" | "normalized";
  /**
   * Explicit frame, overriding the default.
   *
   * Required when the reference is a pre-rasterized mask: a mask cannot state
   * the model coordinates its pixels correspond to, so the correspondence has
   * to be supplied rather than assumed.
   */
  bounds?: Bounds2D;
  /**
   * Shift the model so its own minimum corner lands on the frame's minimum
   * corner before rasterizing.
   *
   * Required when the reference is a rasterized mask taken off an image: the
   * mask's pixel grid fixes the frame origin to the PART's min corner, while the
   * model's coordinates begin wherever the sketch was authored. Without this the
   * two grids are offset by an arbitrary translation and the comparison measures
   * the offset instead of the shape. Size and internal layout are still fully
   * compared — only the choice of origin is normalised away.
   */
  register?: boolean;
  /** Mesh quality handed to Shape.mesh(). */
  meshArgs?: [number, number, number, boolean];
}

export interface ViewReprojectionResult {
  view: string;
  iou: number;
  recall: number;
  precision: number;
  /** Mean silhouette deviation in pixels, both directions. */
  deviation: { modelToReference: number; referenceToModel: number; max: number };
  modelBounds: Bounds2D;
  referencePixels: number;
  modelPixels: number;
  /**
   * What the comparison could actually see: "absolute" also checks size,
   * "normalized" only shape.
   */
  registration?: RasterRegistration;
}

export interface ReprojectionReport {
  /** No reference supplied: the projection was computed but not compared. */
  compared: boolean;
  views: ViewReprojectionResult[];
  /** Cross-view dimensional consistency, when two or more views were given. */
  consistency?: ReturnType<typeof checkViewConsistency>;
  issues: ReviewIssue[];
  passed: boolean;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

export interface ReprojectionThresholds {
  /** Minimum acceptable IoU against the reference silhouette. */
  minIou: number;
  /** Maximum acceptable mean silhouette deviation, in pixels. */
  maxDeviationPx: number;
  /** Maximum acceptable cross-view dimensional disagreement (ratio). */
  maxViewMismatch: number;
}

export const DEFAULT_THRESHOLDS: ReprojectionThresholds = {
  minIou: 0.9,
  maxDeviationPx: 2.5,
  maxViewMismatch: 0.02,
};

// ---------------------------------------------------------------------------
// Mesh acquisition (WASM-dependent)
// ---------------------------------------------------------------------------

/**
 * Bridge a WASM shape to a triangulated mesh.
 *
 * Shape.mesh()'s parameters are declared optional but the Embind layer does not
 * reliably expose C++ defaults, so the call shape is probed rather than assumed.
 * The per-face format is verified before returning it, so a changed return shape
 * fails loudly here rather than silently projecting nothing.
 */
export function getMeshData(shape: unknown, args?: [number, number, number, boolean]): MeshLike | null {
  if (shape == null || typeof shape !== "object") return null;
  const s = shape as { mesh?: (...a: unknown[]) => MeshLike | null };

  const attempts: unknown[][] = args ? [args, []] : [[0.1, 0.1, 30, false], []];
  for (const callArgs of attempts) {
    try {
      const data = s.mesh!(...callArgs);
      if (isMeshLike(data)) return data;
    } catch {
      // Try the next call shape.
    }
  }
  return null;
}

/** Verify MeshData's per-face layout rather than trusting the type. */
function isMeshLike(data: unknown): data is MeshLike {
  if (!data || typeof data !== "object") return false;
  const d = data as { vertices?: unknown; triangles?: unknown };
  if (!Array.isArray(d.vertices) || !Array.isArray(d.triangles)) return false;
  if (d.vertices.length === 0 || d.vertices.length !== d.triangles.length) return false;
  const first = d.vertices[0];
  const firstIdx = d.triangles[0];
  return (
    Array.isArray(first) &&
    first.length >= 9 &&
    first.length % 3 === 0 &&
    Array.isArray(firstIdx) &&
    firstIdx.length >= 3 &&
    firstIdx.length % 3 === 0 &&
    typeof first[0] === "number" &&
    typeof firstIdx[0] === "number"
  );
}

// ---------------------------------------------------------------------------
// Pure comparison
// ---------------------------------------------------------------------------

/**
 * Rasterize the reference into a mask at the target resolution.
 *
 * `bounds` must be the frame the model was rasterized in, otherwise the two
 * mask coordinate systems disagree and the comparison is meaningless.
 */
export function referenceMask(ref: ReferenceSilhouette, bounds?: Bounds2D): Uint8Array {
  if (ref.kind === "mask") return ref.mask;
  return rasterizeLoops(ref.loops, {
    width: ref.width,
    height: ref.height,
    bounds: bounds ?? boundsOfLoops(ref.loops),
    flipY: true,
  });
}

function boundsOfLoops(loops: Array<Array<[number, number]>>): Bounds2D {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const loop of loops) {
    for (const [x, y] of loop) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return { minX, minY, maxX, maxY };
}

/**
 * Compare an already-projected mesh against a reference silhouette.
 *
 * Pure — no WASM — so it can be tested directly.
 */
export function compareProjection(
  projected: ProjectedMesh,
  reference: ReferenceSilhouette,
  opts: ReprojectionOptions & { view?: string },
): ViewReprojectionResult {
  const width = reference.width;
  const height = reference.height;
  const mode = opts.referenceFrame ?? "reference";

  // Each silhouette is rasterized using the bounds ITS coordinates live in, and
  // the two bounds must describe the same pixel frame.
  //
  //  - "reference": the reference's own extent defines the frame and the model
  //    is placed in it by its own model coordinates. Size and position errors
  //    show up as IoU loss, and no registration step is needed because both
  //    sides are in model units.
  //  - "normalized": the model's extent maps onto a 0..1 box, and the reference
  //    is read in 0..1 too.
  //
  // Rasterizing each to its own bounding box independently would make every
  // pair of silhouettes agree — the exact failure this gate exists to catch.
  let modelBounds: Bounds2D;
  let referenceBounds: Bounds2D;

  if (opts.bounds) {
    modelBounds = opts.bounds;
    referenceBounds = opts.bounds;
  } else if (mode === "normalized") {
    modelBounds = projected.bounds;
    referenceBounds = NORMALIZED_FRAME;
  } else {
    const frame =
      reference.kind === "loops" ? boundsOfLoops(reference.loops) : projected.bounds;
    modelBounds = frame;
    referenceBounds = frame;
  }

  const refMask = referenceMask(reference, referenceBounds);
  const registered = opts.register
    ? translateProjected(projected, modelBounds.minX - projected.bounds.minX, modelBounds.minY - projected.bounds.minY)
    : projected;
  const modelMask = rasterizeMesh(registered, {
    width,
    height,
    flipY: true,
    bounds: modelBounds,
  });

  const cmp = compareMasks(refMask, modelMask);
  const dev = chamferDistance(refMask, modelMask, width, height);

  return {
    view: opts.view ?? "unknown",
    iou: cmp.iou,
    recall: cmp.recall,
    precision: cmp.precision,
    deviation: {
      modelToReference: dev.modelToReference,
      referenceToModel: dev.referenceToModel,
      max: dev.maxDeviation,
    },
    modelBounds,
    referencePixels: cmp.referencePixels,
    modelPixels: cmp.modelPixels,
  };
}

/** The 0..1 box used by the "normalized" reference frame. */
const NORMALIZED_FRAME: Bounds2D = { minX: 0, minY: 0, maxX: 1, maxY: 1 };

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

export function evaluateReprojection(
  results: ViewReprojectionResult[],
  consistency: ReprojectionReport["consistency"],
  thresholds: ReprojectionThresholds = DEFAULT_THRESHOLDS,
): { issues: ReviewIssue[]; passed: boolean } {
  const issues: ReviewIssue[] = [];

  for (const r of results) {
    if (r.referencePixels === 0) {
      issues.push({
        severity: "error",
        code: "RPR_EMPTY_REFERENCE",
        message: `View "${r.view}": the reference silhouette is empty — the mask or loops are wrong, not the model`,
        suggestion: "Check that the reference silhouette was produced in the same normalized frame",
      });
      continue;
    }
    if (r.modelPixels === 0) {
      issues.push({
        severity: "error",
        code: "RPR_EMPTY_MODEL",
        message: `View "${r.view}": the projected model silhouette is empty`,
        suggestion: "The shape may be degenerate, or the view direction does not face it",
      });
      continue;
    }

    if (r.iou < thresholds.minIou) {
      const severity = r.iou < thresholds.minIou * 0.8 ? "error" : "warning";
      issues.push({
        severity,
        code: "RPR_LOW_IOU",
        message: `View "${r.view}": silhouette IoU ${r.iou.toFixed(3)} is below ${thresholds.minIou}`,
        suggestion:
          r.precision < r.recall
            ? "The model is thinner than the reference in this view — a feature is too small or missing"
            : "The model has material the reference does not — an extra feature or an oversized dimension",
      });
    }

    if (r.deviation.modelToReference > thresholds.maxDeviationPx) {
      issues.push({
        severity: "warning",
        code: "RPR_DEVIATION",
        message: `View "${r.view}": model silhouette sits ${r.deviation.modelToReference.toFixed(1)}px from the reference outline (worst ${r.deviation.max.toFixed(1)}px)`,
        suggestion: "A dimension or a feature position is off; the max deviation localizes where",
      });
    }
  }

  if (consistency && !consistency.ok) {
    for (const v of consistency.violations) {
      issues.push({
        severity: "error",
        code: "RPR_VIEW_MISMATCH",
        message: `Orthographic views are inconsistent: ${v}`,
        suggestion:
          "Adjacent views must agree on their shared dimension — a wrong dimension in one sketch is the usual cause",
      });
    }
  }

  const passed = !issues.some((i) => i.severity === "error");
  return { issues, passed };
}

// ---------------------------------------------------------------------------
// WASM entry point
// ---------------------------------------------------------------------------

export interface ReprojectShapeOptions extends ReprojectionOptions {
  /** View to project along; a standard orthographic name or a custom basis. */
  view: string | ViewBasis;
  /** Reference silhouette for this view, if one exists. */
  reference?: ReferenceSilhouette;
  thresholds?: ReprojectionThresholds;
}

/**
 * Project a built shape along a view and compare it to the reference.
 *
 * Returns a report with `compared: false` when no reference was supplied —
 * projection alone still feeds the cross-view consistency check.
 */
export function reprojectShape(
  shape: unknown,
  opts: ReprojectShapeOptions,
): ReprojectionReport {
  const issues: ReviewIssue[] = [];
  const views: ViewReprojectionResult[] = [];
  const boundsById = new Map<string, Bounds2D>();

  const kind = typeof opts.view === "string" ? opts.view : "custom";

  const mesh = getMeshData(shape, opts.meshArgs);
  if (!mesh) {
    return {
      compared: false,
      views: [],
      issues: [
        {
          severity: "error",
          code: "RPR_NO_MESH",
          message: `View "${kind}": could not triangulate the shape for projection`,
          suggestion: "Shape.mesh() failed or returned no triangles — check the shape is a solid",
        },
      ],
      passed: false,
    };
  }

  let basis: ViewBasis;
  try {
    basis = typeof opts.view === "string" ? viewBasis(opts.view) : opts.view;
  } catch (e) {
    return {
      compared: false,
      views: [],
      issues: [
        {
          severity: "error",
          code: "RPR_BAD_VIEW",
          message: e instanceof Error ? e.message : String(e),
        },
      ],
      passed: false,
    };
  }

  const projected = projectMesh(mesh, basis);
  boundsById.set(kind, projected.bounds);

  if (!opts.reference) {
    // Projection only: report the view extent so a caller can still check
    // cross-view consistency.
    return {
      compared: false,
      views: [],
      issues,
      passed: true,
    };
  }

  // A rasterized mask cannot state which model coordinates its pixels cover, so
  // without an explicit frame there is no correspondence to compare against.
  // Guessing one would silently produce a confident, meaningless number.
  if (opts.reference.kind === "mask" && !opts.bounds) {
    return {
      compared: false,
      views: [],
      issues: [
        {
          severity: "error",
          code: "RPR_MASK_WITHOUT_FRAME",
          message: `View "${kind}": a rasterized mask reference needs an explicit "bounds" frame`,
          suggestion:
            "Pass the bounds the mask was rasterized in, or supply the reference as loops in model coordinates instead",
        },
      ],
      passed: false,
    };
  }

  const result = compareProjection(projected, opts.reference, {
    ...opts,
    view: kind,
  });
  views.push(result);

  const { issues: gateIssues, passed } = evaluateReprojection(
    views,
    undefined,
    opts.thresholds,
  );
  issues.push(...gateIssues);

  return { compared: true, views, issues, passed };
}

/** How the image mask is placed relative to the model before comparison. */
export type RasterRegistration = "absolute" | "normalized";

export interface ReprojectAgainstRasterOptions extends ReprojectionOptions {
  /** View to project along; a standard orthographic name or a custom basis. */
  view: string | ViewBasis;
  /** Reference mask, rasterized in the model-coordinate frame `referenceBounds`. */
  mask: Uint8Array;
  maskWidth: number;
  maskHeight: number;
  /**
   * Model-coordinate frame the mask covers, derived from the drawing's scale.
   *
   * Omit it when the image carries no scale evidence; the mask is then fitted to
   * the model uniformly (see `RasterRegistration`) and only shape is compared.
   */
  referenceBounds?: Bounds2D;
  thresholds?: ReprojectionThresholds;
}

/**
 * Reproject a shape against a reference mask taken from an image.
 *
 * A mask fixes the frame origin to the part's own min corner, which is not where
 * the sketch author put the model's origin. So the two are placed in one frame
 * that contains both — the union of the mask's extent and the model's — and the
 * model is registered to the frame's min corner. The mask is resampled into that
 * same frame, because `referenceMask` returns a mask-kind reference verbatim.
 *
 * With no `referenceBounds` the mask is scaled UNIFORMLY to fit the model. That
 * drops the size check but keeps the shape one, including the aspect ratio and
 * the position of every hole — a non-uniform fit would absorb an aspect error
 * and make every pair of rectangles agree. The report says which of the two was
 * done, because a size error can only be caught by the absolute comparison.
 */
export function reprojectAgainstRaster(
  shape: unknown,
  opts: ReprojectAgainstRasterOptions,
): ReprojectionReport {
  const kind = typeof opts.view === "string" ? opts.view : "custom";

  const mesh = getMeshData(shape, opts.meshArgs);
  if (!mesh) {
    return {
      compared: false,
      views: [],
      issues: [
        {
          severity: "error",
          code: "RPR_NO_MESH",
          message: `View "${kind}": could not triangulate the shape for projection`,
          suggestion: "Shape.mesh() failed or returned no triangles — check the shape is a solid",
        },
      ],
      passed: false,
    };
  }

  let basis: ViewBasis;
  try {
    basis = typeof opts.view === "string" ? viewBasis(opts.view) : opts.view;
  } catch (e) {
    return {
      compared: false,
      views: [],
      issues: [
        { severity: "error", code: "RPR_BAD_VIEW", message: e instanceof Error ? e.message : String(e) },
      ],
      passed: false,
    };
  }

  const projected = projectMesh(mesh, basis);
  const modelAtOrigin = translateProjected(
    projected,
    -projected.bounds.minX,
    -projected.bounds.minY,
  );
  const modelBounds = {
    minX: 0,
    minY: 0,
    maxX: modelAtOrigin.bounds.maxX,
    maxY: modelAtOrigin.bounds.maxY,
  };

  const registration: RasterRegistration = opts.referenceBounds ? "absolute" : "normalized";
  const referenceBounds = opts.referenceBounds ?? fitUniformly(modelBounds, opts.maskWidth, opts.maskHeight);

  const frame = unionBounds(modelBounds, referenceBounds);

  const framedMask = resampleMaskIntoFrame(
    opts.mask,
    opts.maskWidth,
    opts.maskHeight,
    referenceBounds,
    frame,
    opts.width,
    opts.height,
  );

  const reference: ReferenceSilhouette = {
    kind: "mask",
    width: opts.width,
    height: opts.height,
    mask: framedMask,
  };

  const result = compareProjection(modelAtOrigin, reference, {
    width: opts.width,
    height: opts.height,
    referenceFrame: "reference",
    bounds: frame,
    view: kind,
  });
  result.registration = registration;

  const { issues: gateIssues, passed } = evaluateReprojection([result], undefined, opts.thresholds);

  return { compared: true, views: [result], issues: gateIssues, passed };
}

/**
 * Scale a mask uniformly so it fits inside the model's extent.
 *
 * Uniform, not per-axis: stretching each axis independently would let any two
 * silhouettes agree on their bounding box and hide a wrong aspect ratio, which
 * is one of the errors this gate exists to catch.
 */
function fitUniformly(
  modelBounds: Bounds2D,
  maskWidth: number,
  maskHeight: number,
): Bounds2D {
  const modelW = modelBounds.maxX - modelBounds.minX || 1;
  const modelH = modelBounds.maxY - modelBounds.minY || 1;
  const scale = Math.min(modelW / (maskWidth || 1), modelH / (maskHeight || 1));
  return {
    minX: modelBounds.minX,
    minY: modelBounds.minY,
    maxX: modelBounds.minX + maskWidth * scale,
    maxY: modelBounds.minY + maskHeight * scale,
  };
}

/**
 * Compare the silhouette of a shape against a reference given as a distance
 * field, to answer "how far is the model from the reference outline".
 *
 * Exposed for callers that already hold a distance transform (they are
 * expensive to build twice).
 */
export function deviationAgainstDistanceField(
  model: Uint8Array,
  referenceDistance: Float32Array,
  width: number,
  height: number,
): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < model.length; i++) {
    if (model[i]) {
      sum += referenceDistance[i];
      count++;
    }
  }
  return count === 0 ? Infinity : sum / count;
}

/** Build the distance field for a reference mask, for repeated comparisons. */
export function makeReferenceDistanceField(
  reference: Uint8Array,
  width: number,
  height: number,
): Float32Array {
  return distanceTransform(reference, width, height);
}
