import { describe, expect, it } from "vitest";
import {
  chamferDistance,
  compareMasks,
  checkViewConsistency,
  distanceTransform,
  projectMesh,
  rasterizeLoops,
  rasterizeMesh,
  viewBasis,
  type MeshLike,
} from "../lib/cad/project.js";
import {
  compareProjection,
  evaluateReprojection,
  referenceMask,
  reprojectShape,
} from "../lib/validators/reprojection.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A box as MeshData, in the PER-FACE layout Shape.mesh() actually returns:
 * `vertices[faceId]` is that face's flattened positions and `triangles[faceId]`
 * its local indices. Treating it as one flat vertex buffer silently yields a
 * mesh whose triangles index the wrong vertices.
 */
function box(w = 10, d = 10, h = 10, center: [number, number, number] = [0, 0, 0]): MeshLike {
  const [cx, cy, cz] = center;
  const p = (x: number, y: number, z: number): number[] => [cx + x, cy + y, cz + z];
  const hx = w / 2;
  const hy = d / 2;
  const hz = h / 2;
  const corner = (sx: number, sy: number, sz: number) => p(sx * hx, sy * hy, sz * hz);

  const face = (a: number[], b: number[], c: number[], d2: number[]) => ({
    positions: [...a, ...b, ...c, ...d2],
    indices: [3, 0, 1, 3, 1, 2],
  });

  const faces = [
    face(corner(-1, -1, -1), corner(1, -1, -1), corner(1, 1, -1), corner(-1, 1, -1)),
    face(corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)),
    face(corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)),
    face(corner(-1, 1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(-1, 1, 1)),
    face(corner(-1, -1, -1), corner(-1, 1, -1), corner(-1, 1, 1), corner(-1, -1, 1)),
    face(corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)),
  ];

  return {
    vertices: faces.map((f) => f.positions),
    triangles: faces.map((f) => f.indices),
  };
}

/** A cube: the square case of `box`. */
function cube(size = 10, center: [number, number, number] = [0, 0, 0]): MeshLike {
  return box(size, size, size, center);
}

/** A square loop in model coordinates. */
function squareLoop(min: number, max: number): Array<[number, number]> {
  return [
    [min, min],
    [max, min],
    [max, max],
    [min, max],
  ];
}

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

describe("view basis", () => {
  it("produces orthonormal axes for every standard view", () => {
    for (const kind of ["front", "top", "right", "left", "back", "bottom", "XY", "XZ", "YZ"]) {
      const b = viewBasis(kind);
      const len = (a: number[]) => Math.hypot(...a);
      expect(len(b.dir)).toBeCloseTo(1, 9);
      expect(len(b.xAxis)).toBeCloseTo(1, 9);
      expect(len(b.yAxis)).toBeCloseTo(1, 9);
      const dot = (a: number[], c: number[]) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
      expect(dot(b.dir, b.xAxis)).toBeCloseTo(0, 9);
      expect(dot(b.dir, b.yAxis)).toBeCloseTo(0, 9);
      expect(dot(b.xAxis, b.yAxis)).toBeCloseTo(0, 9);
    }
  });

  it("rejects an unknown view instead of guessing", () => {
    expect(() => viewBasis("sideways")).toThrow(/Unknown view/);
  });

  it("puts +Z up in the front view", () => {
    const b = viewBasis("front");
    expect(b.yAxis[2]).toBeCloseTo(1, 9);
  });
});

describe("mesh projection", () => {
  it("projects a cube to a square silhouette of the right size", () => {
    const p = projectMesh(cube(10), viewBasis("front"));
    expect(p.bounds.maxX - p.bounds.minX).toBeCloseTo(10);
    expect(p.bounds.maxY - p.bounds.minY).toBeCloseTo(10);
    expect(p.triangles.length).toBe(12);
  });

  it("gives a cube the same extent in every orthographic view", () => {
    const c = cube(10);
    for (const kind of ["front", "top", "right"]) {
      const p = projectMesh(c, viewBasis(kind));
      expect(p.bounds.maxX - p.bounds.minX).toBeCloseTo(10);
      expect(p.bounds.maxY - p.bounds.minY).toBeCloseTo(10);
    }
  });

  it("preserves aspect ratio for a non-cube body", () => {
    const b = box(40, 10, 10);
    const p = projectMesh(b, viewBasis("front"));
    expect(p.bounds.maxX - p.bounds.minX).toBeCloseTo(40);
    expect(p.bounds.maxY - p.bounds.minY).toBeCloseTo(10);
  });
});

// ---------------------------------------------------------------------------
// Rasterization
// ---------------------------------------------------------------------------

describe("rasterization", () => {
  it("fills a projected cube to roughly the expected pixel count", () => {
    const p = projectMesh(cube(10), viewBasis("front"));
    const mask = rasterizeMesh(p, { width: 100, height: 100 });
    const filled = mask.reduce((a, b) => a + b, 0);
    // A square fitted into 100x100 should cover a large majority of it.
    expect(filled).toBeGreaterThan(8000);
    expect(filled).toBeLessThanOrEqual(10000);
  });

  it("fills polygon loops", () => {
    const mask = rasterizeLoops([squareLoop(0, 10)], {
      width: 50,
      height: 50,
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    });
    const filled = mask.reduce((a, b) => a + b, 0);
    expect(filled).toBeGreaterThan(2000);
    expect(filled).toBeLessThanOrEqual(2500);
  });

  it("treats a nested loop as a hole (even-odd)", () => {
    const outer = squareLoop(0, 10);
    const hole = squareLoop(4, 6);
    const mask = rasterizeLoops([outer, hole], {
      width: 100,
      height: 100,
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    });
    const withHole = mask.reduce((a, b) => a + b, 0);
    const solid = rasterizeLoops([outer], {
      width: 100,
      height: 100,
      bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    }).reduce((a, b) => a + b, 0);
    expect(withHole).toBeLessThan(solid);
    // The 2x2 hole out of a 10x10 square is 4% of the area.
    expect((solid - withHole) / solid).toBeCloseTo(0.04, 1);
  });

  it("is empty for a degenerate mesh", () => {
    const mask = rasterizeMesh(
      { triangles: [], bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } },
      { width: 32, height: 32 },
    );
    expect(mask.reduce((a, b) => a + b, 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

describe("mask comparison", () => {
  it("reports perfect agreement for identical masks", () => {
    const m = new Uint8Array(100).fill(0);
    m[10] = 1;
    m[11] = 1;
    const c = compareMasks(m, m);
    expect(c.iou).toBe(1);
    expect(c.recall).toBe(1);
    expect(c.precision).toBe(1);
  });

  it("reports zero overlap for disjoint masks", () => {
    const a = new Uint8Array(100);
    const b = new Uint8Array(100);
    a[1] = 1;
    b[50] = 1;
    const c = compareMasks(a, b);
    expect(c.iou).toBe(0);
    expect(c.recall).toBe(0);
  });

  it("distinguishes missing material from extra material", () => {
    const ref = new Uint8Array(100);
    const model = new Uint8Array(100);
    for (let i = 0; i < 10; i++) ref[i] = 1;
    for (let i = 0; i < 5; i++) model[i] = 1; // model covers half the reference

    const c = compareMasks(ref, model);
    expect(c.recall).toBeCloseTo(0.5); // only half the reference is covered
    expect(c.precision).toBeCloseTo(1); // everything the model has is inside
    expect(c.recall).toBeLessThan(c.precision);
  });
});

describe("distance transform and chamfer", () => {
  it("is zero on set pixels", () => {
    const m = new Uint8Array(25);
    m[12] = 1;
    const dt = distanceTransform(m, 5, 5);
    expect(dt[12]).toBe(0);
    expect(dt[7]).toBeCloseTo(1); // one row up
    expect(dt[0]).toBeGreaterThan(2);
  });

  it("measures a known silhouette offset", () => {
    const w = 32;
    const h = 32;
    const a = new Uint8Array(w * h);
    const b = new Uint8Array(w * h);
    // Two vertical bars 3px apart.
    for (let y = 0; y < h; y++) {
      a[y * w + 10] = 1;
      b[y * w + 13] = 1;
    }
    const c = chamferDistance(a, b, w, h);
    expect(c.modelToReference).toBeCloseTo(3, 1);
    expect(c.referenceToModel).toBeCloseTo(3, 1);
    expect(c.maxDeviation).toBeCloseTo(3, 1);
  });
});

// ---------------------------------------------------------------------------
// The gate
// ---------------------------------------------------------------------------

describe("re-projection gate", () => {
  const W = 128;
  const H = 128;

  it("passes when the model matches the reference silhouette", () => {
    const projected = projectMesh(cube(10), viewBasis("front"));
    const reference = {
      kind: "loops" as const,
      width: W,
      height: H,
      loops: [squareLoop(-5, 5)],
    };

    const result = compareProjection(projected, reference, { view: "front" });
    expect(result.iou).toBeGreaterThan(0.9);

    const gate = evaluateReprojection([result], undefined);
    expect(gate.passed).toBe(true);
  });

  it("fails when the model is the wrong shape, despite being a valid solid", () => {
    // Reference is a wide rectangle; the model is a cube. Both are legitimate
    // solids with positive volume — only re-projection catches the mismatch.
    const projected = projectMesh(cube(10), viewBasis("front"));
    const reference = {
      kind: "loops" as const,
      width: W,
      height: H,
      loops: [[[-20, -5], [20, -5], [20, 5], [-20, 5]] as Array<[number, number]>],
    };

    const result = compareProjection(projected, reference, { view: "front" });
    expect(result.iou).toBeLessThan(0.5);

    const gate = evaluateReprojection([result], undefined);
    expect(gate.passed).toBe(false);
    expect(gate.issues.some((i) => i.code === "RPR_LOW_IOU")).toBe(true);
  });

  it("explains a thin model as missing material and a fat one as excess", () => {
    const small = compareProjection(
      projectMesh(cube(4), viewBasis("front")),
      { kind: "loops", width: W, height: H, loops: [squareLoop(-5, 5)] },
      { view: "front" },
    );
    // Model smaller than reference → recall limited.
    expect(small.recall).toBeLessThan(small.precision + 1e-9);

    const big = compareProjection(
      projectMesh(cube(20), viewBasis("front")),
      { kind: "loops", width: W, height: H, loops: [squareLoop(-5, 5)] },
      { view: "front" },
    );
    // Model larger than reference → precision limited.
    expect(big.precision).toBeLessThan(big.recall + 1e-9);
  });

  it("rejects an empty reference rather than blaming the model", () => {
    const result = compareProjection(
      projectMesh(cube(10), viewBasis("front")),
      { kind: "mask", width: W, height: H, mask: new Uint8Array(W * H) },
      { view: "front", bounds: { minX: -5, minY: -5, maxX: 5, maxY: 5 } },
    );
    const gate = evaluateReprojection([result], undefined);
    expect(gate.passed).toBe(false);
    expect(gate.issues[0].code).toBe("RPR_EMPTY_REFERENCE");
  });

  it("refuses to compare a mask reference with no frame", () => {
    // A minimal stand-in for a WASM shape: reprojectShape only needs .mesh().
    const shape = { mesh: () => cube(10) };
    const report = reprojectShape(shape, {
      view: "front",
      width: W,
      height: H,
      reference: { kind: "mask", width: W, height: H, mask: new Uint8Array(W * H).fill(1) },
    });
    expect(report.compared).toBe(false);
    expect(report.issues[0].code).toBe("RPR_MASK_WITHOUT_FRAME");
  });

  it("compares a mask reference when the frame is supplied", () => {
    const shape = { mesh: () => cube(10) };
    const mask = new Uint8Array(W * H);
    // Fill the full raster so the cube (fitted to its own bounds) matches it.
    mask.fill(1);
    const report = reprojectShape(shape, {
      view: "front",
      width: W,
      height: H,
      bounds: { minX: -5, minY: -5, maxX: 5, maxY: 5 },
      reference: { kind: "mask", width: W, height: H, mask },
    });
    expect(report.compared).toBe(true);
    expect(report.views[0].iou).toBeGreaterThan(0.9);
  });

  it("rasterizes a mask reference unchanged", () => {
    const mask = new Uint8Array(W * H);
    mask[5] = 1;
    expect(referenceMask({ kind: "mask", width: W, height: H, mask })).toBe(mask);
  });
});

describe("cross-view consistency", () => {
  it("accepts views that agree on their shared dimensions", () => {
    const r = checkViewConsistency([
      { id: "v_front", kind: "front", bounds: { minX: 0, minY: 0, maxX: 40, maxY: 20 } },
      { id: "v_top", kind: "top", bounds: { minX: 0, minY: 0, maxX: 40, maxY: 15 } },
      { id: "v_right", kind: "right", bounds: { minX: 0, minY: 0, maxX: 15, maxY: 20 } },
    ]);
    expect(r.ok).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it("catches the front and top views disagreeing on width", () => {
    const r = checkViewConsistency([
      { id: "v_front", kind: "front", bounds: { minX: 0, minY: 0, maxX: 40, maxY: 20 } },
      { id: "v_top", kind: "top", bounds: { minX: 0, minY: 0, maxX: 32, maxY: 15 } },
    ]);
    expect(r.ok).toBe(false);
    expect(r.violations.join(" ")).toMatch(/width/);
  });

  it("needs two views to say anything", () => {
    const r = checkViewConsistency([
      { id: "v_front", kind: "front", bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 } },
    ]);
    expect(r.ok).toBe(true);
    expect(r.pairs).toEqual([]);
  });
});
