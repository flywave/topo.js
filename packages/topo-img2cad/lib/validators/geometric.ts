/**
 * Geometric validation — deterministic checks on WASM shape output.
 *
 * These run WITHOUT AI and are the cheapest gate in the pipeline: they answer
 * "is this a real solid?" They deliberately do NOT answer "is this the right
 * solid?" — that is the re-projection gate's job, and conflating the two is how
 * a wrong-but-valid model passes review.
 *
 * Measurements go through BRepGProp rather than Shape.volume()/area(), because
 * a feature-tree body resolves to a Compound, which does not expose those.
 */

import type { GeometryReport, ReviewIssue } from "../types.js";

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

/** Unwrap an embind Shape to the TopoDS_Shape the geometry tools expect. */
function unwrap(shape: unknown): unknown {
  if (shape && typeof shape === "object") {
    const s = shape as Record<string, unknown>;
    if (typeof s.value === "function") {
      try {
        return (s.value as () => unknown)();
      } catch {
        return shape;
      }
    }
  }
  return shape;
}

function readBounds(shape: unknown): Bounds | null {
  const s = shape as { bbox?: () => unknown };
  if (typeof s.bbox !== "function") return null;

  const bb = s.bbox() as Record<string, unknown> | null;
  if (!bb) return null;

  if (typeof bb.IsVoid === "function" && (bb.IsVoid as () => boolean)()) {
    return null;
  }

  // The project's own BBox wrapper: xMin()/xMax()/... .
  if (typeof bb.xMin === "function" && typeof bb.xMax === "function") {
    const b = bb as {
      xMin(): number; xMax(): number;
      yMin(): number; yMax(): number;
      zMin(): number; zMax(): number;
    };
    return {
      min: [b.xMin(), b.yMin(), b.zMin()],
      max: [b.xMax(), b.yMax(), b.zMax()],
    };
  }

  // A raw Bnd_Box.
  if (typeof bb.CornerMin === "function" && typeof bb.CornerMax === "function") {
    const mn = (bb.CornerMin as () => { X(): number; Y(): number; Z(): number })();
    const mx = (bb.CornerMax as () => { X(): number; Y(): number; Z(): number })();
    return { min: [mn.X(), mn.Y(), mn.Z()], max: [mx.X(), mx.Y(), mx.Z()] };
  }

  // Extents only — the position is lost, which the caller should treat as a
  // weaker measurement rather than as a zero origin.
  if (typeof bb.xLength === "function") {
    const l = bb as { xLength(): number; yLength(): number; zLength(): number };
    return { min: [0, 0, 0], max: [l.xLength(), l.yLength(), l.zLength()] };
  }

  return null;
}

/** Mass property of a shape via BRepGProp, or undefined when unavailable. */
function measureCentreOfMass(
  tp: any,
  rawShape: unknown,
): [number, number, number] | undefined {
  if (!tp?.BRepGProp || !tp?.GProp_GProps_1) return undefined;
  let props: { Mass(): number; CentreOfMass(): { X(): number; Y(): number; Z(): number }; delete(): void } | undefined;
  try {
    props = new tp.GProp_GProps_1();
    tp.BRepGProp.VolumeProperties_1(rawShape, props, false, false, false);
    if (!isFinite(props!.Mass()) || props!.Mass() === 0) return undefined;
    const c = props!.CentreOfMass();
    const point: [number, number, number] = [c.X(), c.Y(), c.Z()];
    return point.every((v) => isFinite(v)) ? point : undefined;
  } catch {
    return undefined;
  } finally {
    try {
      props?.delete();
    } catch {
      // Nothing to release.
    }
  }
}

function measureMass(
  tp: any,
  rawShape: unknown,
  kind: "volume" | "area",
): number | undefined {
  if (!tp?.BRepGProp || !tp?.GProp_GProps_1) return undefined;
  let props: { Mass(): number; delete(): void } | undefined;
  try {
    props = new tp.GProp_GProps_1();
    if (kind === "volume") {
      // OnlyClosed=false so an open shell reports something rather than zero,
      // which the caller can then judge.
      tp.BRepGProp.VolumeProperties_1(rawShape, props, false, false, false);
    } else {
      tp.BRepGProp.SurfaceProperties_1(rawShape, props, false, false);
    }
    const mass = props!.Mass();
    return isFinite(mass) ? mass : undefined;
  } catch {
    return undefined;
  } finally {
    try {
      props?.delete();
    } catch {
      // Nothing to release.
    }
  }
}

// ---------------------------------------------------------------------------
// Shape validation
// ---------------------------------------------------------------------------

/**
 * Validate a Shape returned from sandbox execution.
 * Returns a GeometryReport and any issues found.
 */
export function validateGeometry(tp: any, shape: unknown): {
  report: GeometryReport;
  issues: ReviewIssue[];
} {
  const issues: ReviewIssue[] = [];
  const report: GeometryReport = { shapeValid: false };

  if (shape == null) {
    issues.push({
      severity: "error",
      code: "GEO_NULL_SHAPE",
      message: "Shape is null or undefined",
      suggestion: "Ensure the code returns a valid shape via render()",
    });
    return { report, issues };
  }

  try {
    if (typeof shape === "object" && "isNull" in shape) {
      if ((shape as { isNull: () => boolean }).isNull()) {
        issues.push({
          severity: "error",
          code: "GEO_NULL_SHAPE",
          message: "Shape.isNull() returned true",
          suggestion: "The geometry operation failed silently — check dimensions and boolean order",
        });
        return { report, issues };
      }
    }
    report.shapeValid = true;
  } catch (e) {
    issues.push({
      severity: "error",
      code: "GEO_SHAPE_CHECK_FAILED",
      message: `Failed to check shape validity: ${e instanceof Error ? e.message : String(e)}`,
    });
    return { report, issues };
  }

  // --- bounding box -----------------------------------------------------
  let bounds: Bounds | null = null;
  try {
    bounds = readBounds(shape);
  } catch (e) {
    issues.push({
      severity: "warning",
      code: "GEO_BBOX_FAILED",
      message: `Failed to compute bounding box: ${e instanceof Error ? e.message : String(e)}`,
    });
  }

  if (bounds) {
    report.bbox = [...bounds.min, ...bounds.max] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const vals = report.bbox;
    if (vals.some((v) => !isFinite(v))) {
      issues.push({
        severity: "error",
        code: "GEO_INFINITE_BBOX",
        message: `Bounding box contains non-finite values: [${vals.join(", ")}]`,
        suggestion: "A dimension is degenerate or infinite",
      });
    } else {
      const dx = bounds.max[0] - bounds.min[0];
      const dy = bounds.max[1] - bounds.min[1];
      const dz = bounds.max[2] - bounds.min[2];
      if (dx <= 0 || dy <= 0 || dz <= 0) {
        issues.push({
          severity: "warning",
          code: "GEO_ZERO_DIMENSION",
          message: `Bounding box has a zero dimension: ${dx.toFixed(3)} x ${dy.toFixed(3)} x ${dz.toFixed(3)}`,
          suggestion: "The shape may be degenerate (a face or a wire rather than a solid)",
        });
      }
    }
  }

  // --- mass properties --------------------------------------------------
  const raw = unwrap(shape);
  if (tp) {
    report.centerOfMass = measureCentreOfMass(tp, raw);

    const volume = measureMass(tp, raw, "volume");
    if (volume !== undefined) {
      report.volume = volume;
      if (volume <= 0) {
        issues.push({
          severity: "error",
          code: "GEO_ZERO_VOLUME",
          message: `Volume is ${volume} (must be > 0 for a solid)`,
          suggestion:
            "Check that the profile closed and the extrude distance is positive; a surface or wire has no volume",
        });
      }
    } else {
      // Fall back to a shape-level method when the kernel tool is unavailable.
      try {
        if (typeof (shape as { volume?: () => number }).volume === "function") {
          report.volume = (shape as { volume: () => number }).volume();
        }
      } catch {
        // No volume available for this shape type.
      }
    }

    const area = measureMass(tp, raw, "area");
    if (area !== undefined) {
      report.surfaceArea = area;
      if (area <= 0) {
        issues.push({
          severity: "warning",
          code: "GEO_ZERO_AREA",
          message: `Surface area is ${area} (expected > 0)`,
        });
      }
    }
  }

  // --- topology counts --------------------------------------------------
  try {
    const s = shape as Record<string, unknown>;
    if (typeof s.faces === "function") {
      const faces = (s.faces as () => unknown[])();
      if (Array.isArray(faces)) report.faceCount = faces.length;
    }
    if (typeof s.edges === "function") {
      const edges = (s.edges as () => unknown[])();
      if (Array.isArray(edges)) report.edgeCount = edges.length;
    }
    if (typeof s.vertices === "function") {
      const verts = (s.vertices as () => unknown[])();
      if (Array.isArray(verts)) report.vertexCount = verts.length;
    }
  } catch {
    // Topology iteration is optional.
  }

  return { report, issues };
}

/**
 * Quick check that the sandbox produced something usable, before the fuller
 * measurement pass.
 */
export function quickShapeCheck(shape: unknown): { valid: boolean; error?: string } {
  if (shape == null) return { valid: false, error: "Shape is null" };
  try {
    if (typeof shape === "object" && "isNull" in shape) {
      if ((shape as { isNull: () => boolean }).isNull()) {
        return { valid: false, error: "Shape.isNull() is true" };
      }
    }
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Shape check failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}
