/**
 * The outline-distance gate.
 *
 * Mask IoU is the strongest shape check there is, and it needs a reference
 * silhouette — one closed region that is the part. Densely annotated drawings do
 * not have one, so on exactly the drawings where tracing is hardest the shape
 * check goes silent. This gate measures the same thing without a region: how far
 * the model's projected OUTLINE sits from the drawing's ink.
 *
 * These tests are about it being able to say two different things: "this matches"
 * and "this does not", on the same drawing. A gate that only ever passes is the
 * silence it was written to replace.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_EDGE_THRESHOLDS,
  DEFAULT_SEARCH,
  maskOutline,
  measureEdgeDistance,
} from "../lib/validators/edge_distance.js";
import type { MeshLike } from "../lib/cad/project.js";
import type { Bounds2D } from "../lib/cad/project.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A shape-shaped wrapper, since the gate takes an OCCT shape and calls mesh(). */
function asShape(mesh: MeshLike): { mesh: () => MeshLike } {
  return { mesh: () => mesh };
}

/** An axis-aligned box, centred on the origin, wrapped as a shape. */
function box(w: number, d: number, h: number): { mesh: () => MeshLike } {
  const hx = w / 2;
  const hy = d / 2;
  const hz = h / 2;
  const corner = (sx: number, sy: number, sz: number): number[] => [sx * hx, sy * hy, sz * hz];
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
  return asShape({
    vertices: faces.map((f) => f.positions),
    triangles: faces.map((f) => f.indices),
  });
}

/** A rectangular ink outline, `thickness` px wide, inset from the mask border. */
function rectInk(
  width: number,
  height: number,
  inset = 0,
  thickness = 2,
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const x0 = inset;
  const y0 = inset;
  const x1 = width - 1 - inset;
  const y1 = height - 1 - inset;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const onEdge = x < x0 + thickness || x > x1 - thickness || y < y0 + thickness || y > y1 - thickness;
      if (onEdge) mask[y * width + x] = 1;
    }
  }
  return mask;
}

/** A centred square blob of ink — the "the drawing is a blob" case. */
function blobInk(width: number, height: number, radius: number): Uint8Array {
  const mask = new Uint8Array(width * height);
  const cx = width / 2;
  const cy = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.hypot(x - cx, y - cy) <= radius) mask[y * width + x] = 1;
    }
  }
  return mask;
}

/** Ink everywhere, at a regular pitch — what a fully dimensioned sheet looks like. */
function gridInk(width: number, height: number, step: number): Uint8Array {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // The far edge is a line too, so the pitch is symmetric and a model that
      // spans the frame is not left hanging off the last one.
      const onLine = x % step === 0 || y % step === 0 || x === width - 1 || y === height - 1;
      if (onLine) mask[y * width + x] = 1;
    }
  }
  return mask;
}

const FRAME: Bounds2D = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

// ---------------------------------------------------------------------------

describe("maskOutline", () => {
  it("returns the boundary of a filled block and not its interior", () => {
    const w = 7;
    const h = 7;
    const mask = new Uint8Array(w * h);
    for (let y = 1; y <= 5; y++) for (let x = 1; x <= 5; x++) mask[y * w + x] = 1;

    const outline = maskOutline(mask, w, h);
    // A 5x5 solid: the 9 pixels that are not on the boundary are not outline.
    expect(outline.length).toBe(16);
    expect(outline).not.toContain(3 * w + 3);
    expect(outline).toContain(1 * w + 1);
  });

  it("is empty for an empty mask", () => {
    expect(maskOutline(new Uint8Array(16), 4, 4).length).toBe(0);
  });
});

describe("outline distance against a drawing", () => {
  it("passes a model whose outline is the drawing's outline", () => {
    // A 100mm box on a 100mm frame, drawn as a 200x200 outline at the same frame.
    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(result.compared).toBe(true);
    expect(result.outlinePixels).toBeGreaterThan(100);
    expect(result.issues).toEqual([]);
    expect(result.passed).toBe(true);
    expect(result.meanFraction).toBeLessThan(DEFAULT_EDGE_THRESHOLDS.maxMeanFraction);
  });

  it("fails a model twice the size of the drawing, and says how far off it is", () => {
    // Same drawing, a model that is 200mm across: most of its outline lands in
    // empty paper. This is the failure the mask gate cannot report when the
    // drawing has no extractable silhouette.
    const result = measureEdgeDistance(box(200, 200, 100), {
      view: "front",
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(result.compared).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.meanFraction).toBeGreaterThan(DEFAULT_EDGE_THRESHOLDS.maxMeanFraction);
    expect(result.issues.map((i) => i.code)).toContain("EDG_OUTLINE_MISMATCH");
    expect(result.meanPx).toBeGreaterThan(0);
  });

  it("fails a model that is a small shape inside a much larger drawing", () => {
    const result = measureEdgeDistance(box(20, 20, 20), {
      view: "front",
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(result.passed).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("EDG_OUTLINE_MISMATCH");
  });

  it("is lenient about annotation, but not about a missing part", () => {
    // Ink is the outline PLUS a dimension line running across the part. The line
    // sits on the part's interior, so it must not move the measure.
    const w = 200;
    const ink = rectInk(w, w);
    for (let x = 0; x < w; x++) ink[(w / 2) * w + x] = 1;

    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink,
      inkWidth: w,
      inkHeight: w,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(result.passed).toBe(true);
    expect(result.meanFraction).toBeLessThan(DEFAULT_EDGE_THRESHOLDS.maxMeanFraction);
  });

  it("reports no ink rather than passing a comparison it could not make", () => {
    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink: new Uint8Array(200 * 200),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(result.compared).toBe(false);
    expect(result.issues.map((i) => i.code)).toEqual(["EDG_NO_INK"]);
    // A warning, not an error: an empty reference frame is a pipeline problem,
    // not evidence the geometry is wrong.
    expect(result.issues[0].severity).toBe("warning");
  });

  it("fits the ink to the model when the drawing carries no frame", () => {
    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
      width: 512,
      height: 512,
    });

    expect(result.compared).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("reports a view it cannot project along instead of throwing", () => {
    const result = measureEdgeDistance(box(10, 10, 10), {
      view: "not-a-view",
      ink: rectInk(64, 64),
      inkWidth: 64,
      inkHeight: 64,
      width: 128,
      height: 128,
    });

    expect(result.compared).toBe(false);
    expect(result.issues.map((i) => i.code)).toEqual(["EDG_BAD_VIEW"]);
  });

  it("treats a blob as a mismatch: the model's corners are nowhere near it", () => {
    // The live failure shape — a disc traced where the drawing had a part with
    // corners. The blob covers the middle, so the model's corners measure far.
    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink: blobInk(200, 200, 90),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(result.passed).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("EDG_OUTLINE_MISMATCH");
    expect(result.meanFraction).toBeGreaterThan(0.01);
  });
});

describe("searching for a placement before judging the shape", () => {
  it("does not fail a correct part because the drawing's scale estimate was off", () => {
    // The frame says 100mm across; the model is 120mm. The frame's scale is a
    // vision model's estimate of how many pixels a stated length spans, measured
    // 14% off on a real drawing — so a 20% error here must not read as a wrong
    // part, or the gate would fail exactly the models it exists to protect.
    const strict = measureEdgeDistance(box(120, 120, 120), {
      view: "front",
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });
    expect(strict.passed).toBe(false);

    const searched = measureEdgeDistance(box(120, 120, 120), {
      view: "front",
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
      search: {},
    });

    expect(searched.passed).toBe(true);
    expect(searched.meanFraction).toBeLessThan(0.001);
    expect(searched.registration).toBeDefined();
    // It found the placement by shrinking the model's frame by the error.
    expect(searched.registration!.scale).toBeLessThan(0.9);
    expect(searched.registration!.searched).toBeGreaterThan(100);
  });

  it("still fails a wrong shape, however it is placed", () => {
    // A box cannot be moved or rescaled onto a small disc. This is the property
    // that makes the search safe: it is a weaker question, not a blank cheque.
    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink: blobInk(200, 200, 20),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
      search: {},
    });

    expect(result.passed).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain("EDG_OUTLINE_MISMATCH");
  });

  it("reports how far the search had to move the model", () => {
    // The frame is placed 5mm off. The unsearched gate measures that as a miss;
    // the searched one finds the drawing and says the frame, not the part, was wrong.
    const shifted: Bounds2D = { minX: 5, minY: 5, maxX: 105, maxY: 105 };
    const opts = {
      view: "front",
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: shifted,
      width: 512,
      height: 512,
    };

    expect(measureEdgeDistance(box(100, 100, 100), opts).passed).toBe(false);

    const result = measureEdgeDistance(box(100, 100, 100), { ...opts, search: {} });

    expect(result.passed).toBe(true);
    // The frame says the drawing starts 5mm up and to the right of where it
    // actually is; the search moves the model onto it, and the raster's y axis
    // runs downwards, so the two shifts have opposite signs.
    expect(result.registration!.shiftXPx).toBeGreaterThan(0);
    expect(result.registration!.shiftYPx).toBeLessThan(0);
    expect(result.registration!.movedFraction).toBeGreaterThan(0.02);
  });
});

describe("a drawing too busy for closeness to mean anything", () => {
  // A fully dimensioned sheet: the part's outline with strokes at a regular pitch
  // across the whole of it. Anything placed on it is within a few pixels of
  // SOMETHING, so the absolute distance stops discriminating — measured on a real
  // annotated drawing, a wrong model scored 19.5px against a 28.5px floor and was
  // reported PASSED.
  const dense = () => gridInk(200, 200, 20);

  it("passes a model that is the drawing, and fails one that is not", () => {
    const correct = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink: dense(),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });
    expect(correct.passed).toBe(true);
    expect(correct.meanRatio).toBeLessThan(DEFAULT_EDGE_THRESHOLDS.maxMeanRatio);

    // 1mm in on every side: the outline still lands within the pitch of the grid,
    // so it is close to ink everywhere — and it is still not the drawing.
    const wrong = measureEdgeDistance(box(98, 98, 98), {
      view: "front",
      ink: dense(),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(wrong.meanFraction).toBeLessThan(DEFAULT_EDGE_THRESHOLDS.maxMeanFraction);
    expect(wrong.meanRatio).toBeGreaterThan(DEFAULT_EDGE_THRESHOLDS.maxMeanRatio);
    expect(wrong.passed).toBe(false);
    expect(wrong.issues[0].code).toBe("EDG_OUTLINE_MISMATCH");
    expect(wrong.issues[0].message).toMatch(/of chance/);
  });

  it("names the floor rather than reporting a distance nobody can judge", () => {
    const result = measureEdgeDistance(box(98, 98, 98), {
      view: "front",
      ink: dense(),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
    });

    expect(result.baselinePx).toBeGreaterThan(0);
    expect(result.baselinePx).toBeLessThan(result.frameDiagonalPx);
    expect(result.meanRatio).toBeCloseTo(result.meanPx / result.baselinePx, 6);
  });

  it("accepts a match a fraction of a pixel off, however dense the sheet is", () => {
    // The chance bar has a floor, because a correct model's outline is a pixel
    // away from the drawn one by rasterization alone. Without the floor a dense
    // enough sheet would fail every model, correct ones included.
    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink: dense(),
      inkWidth: 200,
      inkHeight: 200,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
      search: {},
    });

    expect(result.passed).toBe(true);
  });

  it("does not let a search reach ink the model has no business being on", () => {
    // The search window is bounded on purpose. Searching the whole sheet would
    // find SOMETHING dense to sit on every time: measured on a real annotated
    // drawing it moved a two-disc model 94% of the frame onto a corner and scored
    // it 3.9px, which passed a model nothing should pass.
    // A square and a disc cannot be aligned however they are moved.
    const w = 200;
    const ink = new Uint8Array(w * w);
    for (let y = 0; y < w; y++) {
      for (let x = 0; x < w; x++) {
        if (Math.hypot(x - 40, y - 40) <= 45) ink[y * w + x] = 1;
      }
    }

    const result = measureEdgeDistance(box(100, 100, 100), {
      view: "front",
      ink,
      inkWidth: w,
      inkHeight: w,
      referenceBounds: FRAME,
      width: 512,
      height: 512,
      search: {},
    });

    // The window is per axis, so each shift is bounded by the fraction itself.
    const size = 512;
    expect(Math.abs(result.registration!.shiftXPx) / size).toBeLessThanOrEqual(
      DEFAULT_SEARCH.maxShiftFraction + 1e-9,
    );
    expect(Math.abs(result.registration!.shiftYPx) / size).toBeLessThanOrEqual(
      DEFAULT_SEARCH.maxShiftFraction + 1e-9,
    );
    expect(result.passed).toBe(false);
  });
});
