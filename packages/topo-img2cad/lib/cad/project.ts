/**
 * Orthographic projection + rasterization.
 *
 * This is the CAD analogue of img2threejs's "screenshot the model and compare
 * it to the reference". The difference is that here the comparison is
 * deterministic: the BREP solid is projected along a known view direction, the
 * silhouette is rasterized, and it is compared numerically against the
 * reference silhouette. No vision model is involved in the verdict.
 *
 * It answers a question geometric checks cannot: "does this model actually look
 * like the thing in the drawing, from the view the drawing was made from?"
 */

// ---------------------------------------------------------------------------
// View basis
// ---------------------------------------------------------------------------

export interface ViewBasis {
  /** View direction (camera into the scene), unit length. */
  dir: [number, number, number];
  /** Screen-right axis, unit length, orthogonal to dir. */
  xAxis: [number, number, number];
  /** Screen-up axis = cross(dir, xAxis). */
  yAxis: [number, number, number];
}

/** Standard orthographic bases, matching topo-js's ProjectionCamera. */
const BASES: Record<string, { dir: [number, number, number]; xAxis: [number, number, number] }> = {
  front: { dir: [0, -1, 0], xAxis: [1, 0, 0] },
  back: { dir: [0, 1, 0], xAxis: [-1, 0, 0] },
  right: { dir: [-1, 0, 0], xAxis: [0, -1, 0] },
  left: { dir: [1, 0, 0], xAxis: [0, 1, 0] },
  top: { dir: [0, 0, -1], xAxis: [1, 0, 0] },
  bottom: { dir: [0, 0, 1], xAxis: [1, 0, 0] },
  XY: { dir: [0, 0, 1], xAxis: [1, 0, 0] },
  XZ: { dir: [0, -1, 0], xAxis: [1, 0, 0] },
  YZ: { dir: [1, 0, 0], xAxis: [0, 1, 0] },
  YX: { dir: [0, 0, -1], xAxis: [0, 1, 0] },
  ZX: { dir: [0, 1, 0], xAxis: [0, 0, 1] },
  ZY: { dir: [-1, 0, 0], xAxis: [0, 0, 1] },
};

export function viewBasis(kind: string): ViewBasis {
  const b = BASES[kind];
  if (!b) {
    throw new Error(
      `Unknown view "${kind}". Known: ${Object.keys(BASES).join(", ")}`,
    );
  }
  const yAxis = cross(b.dir, b.xAxis);
  return { dir: b.dir, xAxis: b.xAxis, yAxis };
}

/** Whether `viewBasis` knows this name. */
export function isKnownView(kind: string): boolean {
  return Object.prototype.hasOwnProperty.call(BASES, kind);
}

/**
 * The sketch plane a view's profile belongs on.
 *
 * A profile is read in its view's own 2D frame, so the sketch that consumes it has
 * to sit on the plane that frame is measured in — a front view's (x, z) is the XZ
 * plane. Modelling a front view's profile on XY instead produces a solid that is
 * correct in every measurement and still the wrong part, which is precisely what
 * the re-projection gate then reports as a silhouette mismatch.
 */
export function sketchPlaneForView(kind: string): "XY" | "XZ" | "YZ" | null {
  switch (kind) {
    // screen (x, z)
    case "front":
    case "back":
      return "XZ";
    // screen (x, y)
    case "top":
    case "bottom":
      return "XY";
    // screen (y, z)
    case "right":
    case "left":
      return "YZ";
    default:
      return null;
  }
}

/** Basis for a photo/iso view given an explicit camera direction. */
export function customBasis(
  dir: [number, number, number],
  xAxis: [number, number, number],
): ViewBasis {
  return { dir, xAxis, yAxis: cross(dir, xAxis) };
}

function cross(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// ---------------------------------------------------------------------------
// Mesh → projected triangles
// ---------------------------------------------------------------------------

/**
 * `Shape.mesh()`'s MeshData, as the binding actually returns it.
 *
 * Both arrays are PER FACE and indexed by face id, not one flat vertex buffer:
 * `vertices[faceId]` is that face's flattened positions (`[x,y,z, x,y,z, ...]`)
 * and `triangles[faceId]` is that face's local index list (`[a,b,c, a,b,c, ...]`).
 * topo-threejs consumes it exactly this way (`data.vertices[faceId]`,
 * `setIndex(data.triangles[faceId])`).
 */
export interface MeshLike {
  /** Per face: flattened positions `[x,y,z, ...]`. */
  vertices: number[][];
  /** Per face: local indices into that face's positions, in triples. */
  triangles: number[][];
}

export interface Bounds2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ProjectedMesh {
  /** Triangles in view coordinates, each [[x,y],[x,y],[x,y]]. */
  triangles: Array<Array<[number, number]>>;
  bounds: Bounds2D;
}

/** Project mesh faces onto the view plane, flattening each face to triangles. */
export function projectMesh(mesh: MeshLike, basis: ViewBasis): ProjectedMesh {
  const triangles: Array<Array<[number, number]>> = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let faceId = 0; faceId < mesh.vertices.length; faceId++) {
    const positions = mesh.vertices[faceId];
    const indices = mesh.triangles[faceId];
    if (!Array.isArray(positions) || !Array.isArray(indices)) continue;

    const pts: Array<[number, number]> = [];
    for (let i = 0; i + 2 < positions.length; i += 3) {
      const v: [number, number, number] = [positions[i], positions[i + 1], positions[i + 2]];
      const u = dot(v, basis.xAxis);
      const w = dot(v, basis.yAxis);
      pts.push([u, w]);
      if (u < minX) minX = u;
      if (u > maxX) maxX = u;
      if (w < minY) minY = w;
      if (w > maxY) maxY = w;
    }

    for (let i = 0; i + 2 < indices.length; i += 3) {
      const a = pts[indices[i]];
      const b = pts[indices[i + 1]];
      const c = pts[indices[i + 2]];
      if (a && b && c) triangles.push([a, b, c]);
    }
  }

  if (!isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 0;
    maxY = 0;
  }

  return { triangles, bounds: { minX, minY, maxX, maxY } };
}

/**
 * The smallest frame containing both inputs.
 *
 * Two silhouettes are only comparable inside one shared frame. Taking the union
 * rather than one side's extent keeps neither from clipping: a model larger than
 * the reference overflows visibly into the frame instead of being cut off, so
 * the IoU penalty reflects the real size error.
 */
export function unionBounds(a: Bounds2D, b: Bounds2D): Bounds2D {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

/**
 * Shift a projected mesh within its view plane.
 *
 * Needed to register a model against a reference whose frame origin is
 * arbitrary — an image-derived mask knows the part's own min corner, not where
 * the sketch author happened to place the origin.
 */
export function translateProjected(projected: ProjectedMesh, dx: number, dy: number): ProjectedMesh {
  if (dx === 0 && dy === 0) return projected;
  return {
    triangles: projected.triangles.map((tri) => tri.map(([x, y]): [number, number] => [x + dx, y + dy])),
    bounds: {
      minX: projected.bounds.minX + dx,
      minY: projected.bounds.minY + dy,
      maxX: projected.bounds.maxX + dx,
      maxY: projected.bounds.maxY + dy,
    },
  };
}

// ---------------------------------------------------------------------------
// Rasterization
// ---------------------------------------------------------------------------

export interface RasterOptions {
  width: number;
  height: number;
  /** Map model +y to pixel-down (default true, matching image row order). */
  flipY?: boolean;
  /** Explicit bounds; defaults to the data's own bounds. */
  bounds?: Bounds2D;
}

interface Pt {
  x: number;
  y: number;
}

function makeTransform(
  bounds: Bounds2D,
  width: number,
  height: number,
  flipY: boolean,
): (p: [number, number]) => Pt {
  const dx = bounds.maxX - bounds.minX || 1;
  const dy = bounds.maxY - bounds.minY || 1;
  return (p: [number, number]) => {
    const u = (p[0] - bounds.minX) / dx;
    const v = (p[1] - bounds.minY) / dy;
    return {
      x: u * (width - 1),
      y: flipY ? (1 - v) * (height - 1) : v * (height - 1),
    };
  };
}

/**
 * Fill a polygon set into a mask using scanline even-odd.
 *
 * Even-odd across all supplied loops is what makes nested loops read as holes,
 * which is how an engineering view with a bore actually looks.
 */
function fillLoops(
  loops: Pt[][],
  width: number,
  height: number,
  mask: Uint8Array,
): void {
  const edges: Array<[Pt, Pt]> = [];
  for (const loop of loops) {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      if (a.y !== b.y) edges.push([a, b]);
    }
  }
  if (edges.length === 0) return;

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const e of edges) {
    if (e[0].y < yMin) yMin = e[0].y;
    if (e[0].y > yMax) yMax = e[0].y;
    if (e[1].y < yMin) yMin = e[1].y;
    if (e[1].y > yMax) yMax = e[1].y;
  }
  const y0 = Math.max(0, Math.ceil(yMin));
  const y1 = Math.min(height - 1, Math.floor(yMax));

  const xs: number[] = [];
  for (let y = y0; y <= y1; y++) {
    const yc = y + 0.5;
    xs.length = 0;
    for (const [a, b] of edges) {
      if ((a.y <= yc && b.y > yc) || (b.y <= yc && a.y > yc)) {
        xs.push(a.x + ((yc - a.y) / (b.y - a.y)) * (b.x - a.x));
      }
    }
    if (xs.length < 2) continue;
    xs.sort((p, q) => p - q);
    const rowBase = y * width;
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const start = Math.max(0, Math.ceil(xs[i] - 0.5));
      const end = Math.min(width - 1, Math.floor(xs[i + 1] - 0.5));
      for (let x = start; x <= end; x++) mask[rowBase + x] = 1;
    }
  }
}

/**
 * Rasterize a projected mesh as a filled silhouette.
 *
 * Triangles are filled independently and OR'd: the silhouette of a solid is the
 * union of its projected faces, and union-by-OR is exact for that.
 */
export function rasterizeMesh(projected: ProjectedMesh, opts: RasterOptions): Uint8Array {
  const { width, height, flipY = true } = opts;
  const bounds = opts.bounds ?? projected.bounds;
  const mask = new Uint8Array(width * height);
  const tf = makeTransform(bounds, width, height, flipY);

  for (const tri of projected.triangles) {
    const pts = tri.map(tf);
    // Skip slivers narrower than a pixel — they cannot affect the silhouette.
    const area = Math.abs(
      (pts[1].x - pts[0].x) * (pts[2].y - pts[0].y) -
        (pts[2].x - pts[0].x) * (pts[1].y - pts[0].y),
    ) / 2;
    if (area < 0.25) continue;
    fillLoops([pts], width, height, mask);
  }

  return mask;
}

/** Rasterize polygon loops (a reference outline) with holes via even-odd. */
export function rasterizeLoops(
  loops: Array<Array<[number, number]>>,
  opts: RasterOptions & { bounds: Bounds2D },
): Uint8Array {
  const { width, height, flipY = true } = opts;
  const mask = new Uint8Array(width * height);
  const tf = makeTransform(opts.bounds, width, height, flipY);
  fillLoops(
    loops.map((loop) => loop.map(tf)),
    width,
    height,
    mask,
  );
  return mask;
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

export interface MaskComparison {
  /** Intersection over union, 0..1. */
  iou: number;
  /** Fraction of the reference silhouette the model covers (recall). */
  recall: number;
  /** Fraction of the model silhouette inside the reference (precision). */
  precision: number;
  referencePixels: number;
  modelPixels: number;
  intersectionPixels: number;
}

export function compareMasks(reference: Uint8Array, model: Uint8Array): MaskComparison {
  if (reference.length !== model.length) {
    throw new Error("Mask size mismatch");
  }
  let inter = 0;
  let refCount = 0;
  let modelCount = 0;
  for (let i = 0; i < reference.length; i++) {
    const r = reference[i];
    const m = model[i];
    if (r) refCount++;
    if (m) modelCount++;
    if (r && m) inter++;
  }
  const union = refCount + modelCount - inter;
  return {
    iou: union === 0 ? 1 : inter / union,
    recall: refCount === 0 ? 1 : inter / refCount,
    precision: modelCount === 0 ? 0 : inter / modelCount,
    referencePixels: refCount,
    modelPixels: modelCount,
    intersectionPixels: inter,
  };
}

/**
 * Two-pass chamfer distance transform.
 *
 * Gives, per pixel, the approximate euclidean distance to the nearest set
 * pixel. Used to turn a silhouette mismatch into a distance in pixels, which is
 * far more actionable than an IoU alone ("the bore is 8px too far left").
 */
export function distanceTransform(
  mask: Uint8Array,
  width: number,
  height: number,
): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(width * height);
  for (let i = 0; i < mask.length; i++) d[i] = mask[i] ? 0 : INF;

  const w1 = 1;
  const w2 = Math.SQRT2;

  // Forward
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (d[i] === 0) continue;
      let best = d[i];
      if (y > 0) {
        best = Math.min(best, d[i - width] + w1);
        if (x > 0) best = Math.min(best, d[i - width - 1] + w2);
        if (x < width - 1) best = Math.min(best, d[i - width + 1] + w2);
      }
      if (x > 0) best = Math.min(best, d[i - 1] + w1);
      d[i] = best;
    }
  }
  // Backward
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x;
      if (d[i] === 0) continue;
      let best = d[i];
      if (y < height - 1) {
        best = Math.min(best, d[i + width] + w1);
        if (x > 0) best = Math.min(best, d[i + width - 1] + w2);
        if (x < width - 1) best = Math.min(best, d[i + width + 1] + w2);
      }
      if (x < width - 1) best = Math.min(best, d[i + 1] + w1);
      d[i] = best;
    }
  }
  return d;
}

export interface ChamferResult {
  /** Mean distance from model silhouette to the reference, in pixels. */
  modelToReference: number;
  /** Mean distance from reference silhouette to the model, in pixels. */
  referenceToModel: number;
  /** Worst single-pixel deviation, in pixels. */
  maxDeviation: number;
}

/** Directed silhouette deviation in pixels, both ways. */
export function chamferDistance(
  reference: Uint8Array,
  model: Uint8Array,
  width: number,
  height: number,
): ChamferResult {
  const dtRef = distanceTransform(reference, width, height);
  const dtModel = distanceTransform(model, width, height);

  let modelSum = 0;
  let modelCount = 0;
  let refSum = 0;
  let refCount = 0;
  let maxDeviation = 0;

  for (let i = 0; i < model.length; i++) {
    if (model[i]) {
      const d = dtRef[i];
      modelSum += d;
      modelCount++;
      if (d > maxDeviation) maxDeviation = d;
    }
    if (reference[i]) {
      refSum += dtModel[i];
      refCount++;
    }
  }

  return {
    modelToReference: modelCount === 0 ? Infinity : modelSum / modelCount,
    referenceToModel: refCount === 0 ? Infinity : refSum / refCount,
    maxDeviation,
  };
}

/**
 * Check that several orthographic views of the same body are dimensionally
 * consistent with each other.
 *
 * This needs no reference image at all: in a correct model, the front view's
 * width must equal the top view's width, the front view's height must equal the
 * side view's height, and the top view's depth must equal the side view's
 * depth. It catches a whole class of "the model is fine but it is not the part
 * in the drawing" errors for free.
 */
export interface ViewConsistency {
  ok: boolean
  pairs: Array<{ a: string; b: string; axis: string; delta: number; tolerance: number }>;
  violations: string[];
}

export function checkViewConsistency(
  views: Array<{ id: string; kind: string; bounds: Bounds2D }>,
  toleranceRatio = 0.02,
): ViewConsistency {
  const pairs: ViewConsistency["pairs"] = [];
  const violations: string[] = [];

  const dims = (b: Bounds2D) => ({ w: b.maxX - b.minX, h: b.maxY - b.minY });
  const byKind = new Map(views.map((v) => [v.kind, v]));

  /**
   * Compare the extent a shared axis projects to in each view. The screen axes
   * are not the same across views: the depth (Y) extent is vertical in the top
   * view but horizontal in the side view.
   */
  const check = (
    aKind: string,
    bKind: string,
    axisA: "w" | "h",
    axisB: "w" | "h",
    axisName: string,
  ) => {
    const a = byKind.get(aKind);
    const b = byKind.get(bKind);
    if (!a || !b) return;
    const da = dims(a.bounds)[axisA];
    const db = dims(b.bounds)[axisB];
    const scale = Math.max(Math.abs(da), Math.abs(db), 1e-9);
    const delta = Math.abs(da - db) / scale;
    pairs.push({ a: aKind, b: bKind, axis: axisName, delta, tolerance: toleranceRatio });
    if (delta > toleranceRatio) {
      violations.push(
        `${aKind} and ${bKind} disagree on ${axisName}: ${da.toFixed(3)} vs ${db.toFixed(3)} (${(delta * 100).toFixed(1)}% off)`,
      );
    }
  };

  // front/top share width (X); front/right share height (Z); top/right share
  // depth (Y) — vertical in the top view, horizontal in the side view.
  check("front", "top", "w", "w", "width (X)");
  check("front", "right", "h", "h", "height (Z)");
  check("top", "right", "h", "w", "depth (Y)");

  return { ok: violations.length === 0, pairs, violations };
}
