/**
 * Reference silhouettes and the artifacts written alongside them.
 *
 * The re-projection gate is only as good as what it measures against, so these
 * tests are about the reference being the PART: the bore has to read as a hole,
 * the scale has to reach model coordinates, and a drawing that cannot be used
 * has to say so rather than produce a confident number from nothing.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  buildViewReferences,
  buildViewReferencesFromImage,
} from "../lib/cad/reference.js";
import { decodeRaster, loadRaster, type Raster } from "../lib/cad/image.js";
import { encodePngGray } from "../lib/cad/image_encode.js";
import { saveArtifacts, loadTree, ARTIFACT_DIR } from "../lib/artifacts.js";
import type { FeatureTree, ViewSet } from "../lib/cad/model.js";

const WORK = join(tmpdir(), "topo-img2cad-reference");

beforeAll(() => {
  mkdirSync(WORK, { recursive: true });
});

afterAll(() => {
  try {
    rmSync(WORK, { recursive: true, force: true });
  } catch {
    // Nothing to clean up.
  }
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A line drawing: thin ink outline, white field. */
function lineArt(
  width: number,
  height: number,
  draw: (set: (x: number, y: number) => void) => void,
): Raster {
  const gray = new Uint8Array(width * height).fill(255);
  const opaque = new Uint8Array(width * height).fill(1);
  draw((x, y) => {
    if (x >= 0 && y >= 0 && x < width && y < height) gray[y * width + x] = 0;
  });
  return { width, height, gray, opaque };
}

function rectOutline(r: Raster, x0: number, y0: number, x1: number, y1: number): (x: number, y: number) => void {
  return (x, y) => {
    const onEdge =
      (y === y0 || y === y1) && x >= x0 && x <= x1 ||
      (x === x0 || x === x1) && y >= y0 && y <= y1;
    if (onEdge) r.gray[y * r.width + x] = 0;
  };
}

function circleOutline(r: Raster, cx: number, cy: number, radius: number): (x: number, y: number) => void {
  return (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    if (Math.abs(d - radius) < 0.6) r.gray[y * r.width + x] = 0;
  };
}

/** A 100x60 plate at 2px/mm with a 30mm central bore. */
function plateDrawing(): Raster {
  const r = lineArt(240, 160, () => {});
  const rect = rectOutline(r, 20, 20, 219, 139);
  const bore = circleOutline(r, 120, 80, 30);
  for (let y = 0; y < r.height; y++) {
    for (let x = 0; x < r.width; x++) {
      rect(x, y);
      bore(x, y);
    }
  }
  return r;
}

function viewSet(overrides: Partial<ViewSet> = {}): ViewSet {
  return {
    drawingKind: "engineering_drawing",
    views: [{ id: "v_top", kind: "top", region: [0, 0, 1, 1], confidence: 0.9 }],
    units: { length: "mm", toMillimeter: 1 },
    undetermined: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

describe("reference silhouettes from a drawing", () => {
  it("reads a line drawing as a filled part with its bore as a hole", () => {
    const drawing = plateDrawing();
    const built = buildViewReferences(viewSet(), { raster: drawing, width: 512, height: 512 });

    expect(built.references.length).toBe(1);
    const ref = built.references[0];

    // Thin ink on white is line art, so the part is the enclosed bright region,
    // not the ink itself.
    expect(ref.silhouetteMode).toBe("region");

    const at = (x: number, y: number): number => ref.mask[y * ref.maskWidth + x];
    const centreX = Math.floor(ref.maskWidth / 2);
    const centreY = Math.floor(ref.maskHeight / 2);

    // The bore is a hole: the middle is not material, the ring around it is.
    expect(at(centreX, centreY)).toBe(0);
    expect(at(centreX - 45, centreY)).toBe(1);

    // The outline's own extent is the plate's, 100 x 60 mm at 2px/mm.
    expect(ref.maskWidth).toBeGreaterThan(180);
    expect(ref.maskHeight).toBeGreaterThan(110);

    // Material fraction: a 100x60 plate minus a 30mm bore is about 88%.
    const filled = ref.mask.reduce((n, v) => n + (v ? 1 : 0), 0);
    const fraction = filled / (ref.maskWidth * ref.maskHeight);
    expect(fraction).toBeGreaterThan(0.8);
    expect(fraction).toBeLessThan(0.95);
  });

  it("places the mask in model coordinates when the drawing carries scale", () => {
    const built = buildViewReferences(
      viewSet({ scale: { kind: "dimension_callout", realLength: 100, imageLength: 200, mmPerPixel: 0.5 } }),
      { raster: plateDrawing(), width: 512, height: 512 },
    );

    const ref = built.references[0];
    expect(ref.referenceBounds).toBeDefined();
    // 0.5 mm/px over the mask's own extent, so a 200px plate spans 100mm.
    expect(ref.referenceBounds!.minX).toBe(0);
    expect(ref.referenceBounds!.minY).toBe(0);
    expect(ref.referenceBounds!.maxX).toBeCloseTo(ref.maskWidth * 0.5, 6);
    expect(ref.referenceBounds!.maxY).toBeCloseTo(ref.maskHeight * 0.5, 6);
  });

  it("places the mask from the stated length, not the model's pixel estimate", () => {
    // The live failure: a 120mm edge 600px wide, reported as 684px. That put the
    // mask's frame 14% too wide and failed a geometrically perfect part.
    const built = buildViewReferences(
      viewSet({
        scale: {
          kind: "dimension_callout",
          label: "120",
          realLength: 120,
          imageLength: 226, // the model's estimate, ~14% high
          mmPerPixel: 120 / 226,
        },
      }),
      { raster: plateDrawing(), width: 512, height: 512 },
    );

    const ref = built.references[0];
    // The silhouette is ~198px wide and the drawing says that edge is 120mm, so
    // ~0.606 mm/px — not the 0.531 the model's estimate implies.
    const expected = 120 / ref.maskWidth;
    expect(ref.referenceBounds!.maxX).toBeCloseTo(ref.maskWidth * expected, 6);
    expect(ref.referenceBounds!.maxX).toBeCloseTo(120, 1);

    expect(ref.notes.join(" ")).toMatch(/scale realigned/);
    expect(ref.scaleUnverified).toBe(false);
  });

  it("leaves a scale alone when the model read it correctly", () => {
    const accurate = plateDrawing();
    const built = buildViewReferences(
      viewSet({
        scale: {
          kind: "dimension_callout",
          label: "120",
          realLength: 120,
          imageLength: 200, // what the silhouette actually measures
          mmPerPixel: 120 / 200,
        },
      }),
      { raster: accurate, width: 512, height: 512 },
    );

    expect(built.references[0].notes.join(" ")).not.toMatch(/scale realigned/);
    // The model read it right, and that was confirmed against the silhouette, so
    // a size mismatch would be a real dimension error.
    expect(built.references[0].scaleUnverified).toBe(false);
  });

  it("refuses a feature dimension, however the label spells it", () => {
    // A bore diameter measures a feature; the silhouette is not its extent, so
    // realigning to it would invent a scale. The label says so, and that beats
    // any ratio test — a genuinely mis-estimated overall dimension lands in the
    // same numeric range (see the next case).
    const built = buildViewReferences(
      viewSet({
        scale: {
          kind: "dimension_callout",
          label: "Ø40",
          realLength: 40,
          imageLength: 60,
          mmPerPixel: 40 / 60,
        },
      }),
      { raster: plateDrawing(), width: 512, height: 512 },
    );

    const ref = built.references[0];
    expect(ref.notes.join(" ")).toMatch(/measures a feature rather than the part/);
    expect(ref.notes.join(" ")).not.toMatch(/scale realigned/);
    // The model's own scale is kept, and still flagged as an estimate.
    expect(ref.referenceBounds!.maxX).toBeCloseTo(ref.maskWidth * (40 / 60), 6);
    expect(ref.scaleUnverified).toBe(true);
  });

  it("leaves an assumed scale alone, since there is nothing to realign to", () => {
    const built = buildViewReferences(
      viewSet({
        scale: { kind: "assumed", realLength: 120, imageLength: 684, mmPerPixel: 120 / 684 },
      }),
      { raster: plateDrawing(), width: 512, height: 512 },
    );

    expect(built.references[0].notes.join(" ")).not.toMatch(/scale realigned/);
  });

  it("corrects an overall dimension the model measured badly", () => {
    // From a live run: the model called the 120mm edge 870px when it is 597. That
    // is 46% out — well beyond any tight band — and leaving it meant comparing a
    // 120mm part against an 82mm frame: IoU 0.38 on a part whose geometry was
    // right. A bare numeric label is an overall dimension, so it is corrected.
    // The drawing the run actually used: a 120x80 plate drawn 600x400px, whose
    // silhouette comes out 597 wide.
    const raster = lineArt(700, 500, () => {});
    const outline = rectOutline(raster, 40, 40, 636, 436);
    for (let y = 0; y < raster.height; y++) {
      for (let x = 0; x < raster.width; x++) outline(x, y);
    }

    const built = buildViewReferences(
      viewSet({
        scale: {
          kind: "dimension_callout",
          label: "120",
          realLength: 120,
          imageLength: 870,
          mmPerPixel: 120 / 870,
        },
      }),
      { raster, width: 512, height: 512 },
    );

    const ref = built.references[0];
    expect(ref.maskWidth).toBeGreaterThanOrEqual(595);
    expect(ref.notes.join(" ")).toMatch(/scale realigned/);
    expect(ref.referenceBounds!.maxX).toBeCloseTo(120, 0);
    expect(ref.scaleUnverified).toBe(false);
  });

  it("would have rescued the run that motivated it", () => {
    // The measured numbers, verbatim: a 120x80 plate drawn 600x400px, whose
    // silhouette came out 597x397, with the model reporting the 120mm edge as
    // spanning 684px. Against that frame the built part scored IoU 0.613 and the
    // run failed — with a solid whose volume matched the analytic value to six
    // significant figures.
    const raster = lineArt(700, 500, () => {});
    const outline = rectOutline(raster, 40, 40, 636, 436);
    for (let y = 0; y < raster.height; y++) {
      for (let x = 0; x < raster.width; x++) outline(x, y);
    }

    const built = buildViewReferences(
      viewSet({
        scale: {
          kind: "dimension_callout",
          label: "120",
          realLength: 120,
          imageLength: 684, // the model's estimate
          mmPerPixel: 120 / 684,
        },
      }),
      { raster, width: 512, height: 512 },
    );

    const ref = built.references[0];
    expect(ref.maskWidth).toBeGreaterThanOrEqual(595);
    expect(ref.maskWidth).toBeLessThanOrEqual(598);
    // The 120mm edge is now 120mm wide in the frame the mask is placed in, which
    // is what makes the size comparison mean anything.
    expect(ref.referenceBounds!.maxX).toBeCloseTo(120, 0);
    expect(ref.scaleUnverified).toBe(false);
    expect(ref.notes.join(" ")).toMatch(/scale realigned/);
  });

  it("still builds a reference without scale, and says size will not be checked", () => {
    const built = buildViewReferences(viewSet(), { raster: plateDrawing(), width: 512, height: 512 });

    const ref = built.references[0];
    expect(ref.referenceBounds).toBeUndefined();
    expect(built.notes.join(" ")).toMatch(/fitted to the model/);
  });

  it("reads a solid part against a plain field with the ink rule", () => {
    // A filled shape is mostly material, so the ink fraction is high.
    const raster: Raster = {
      width: 120,
      height: 120,
      gray: new Uint8Array(120 * 120).fill(255),
      opaque: new Uint8Array(120 * 120).fill(1),
    };
    for (let y = 20; y < 100; y++) {
      for (let x = 20; x < 100; x++) raster.gray[y * 120 + x] = 40;
    }
    // A stray speck outside the part must not drag the bounding box out.
    raster.gray[5 * 120 + 5] = 40;

    const built = buildViewReferences(viewSet(), { raster, width: 256, height: 256 });
    const ref = built.references[0];

    expect(ref.silhouetteMode).toBe("ink");
    expect(ref.maskWidth).toBeGreaterThan(75);
    expect(ref.maskWidth).toBeLessThan(85);
  });

  it("says so when the drawing cannot be used at all", () => {
    const built = buildViewReferences(
      viewSet({ views: [{ id: "v_photo", kind: "photo", confidence: 0.9 }] }),
      { raster: plateDrawing(), width: 512, height: 512 },
    );

    expect(built.references).toEqual([]);
    expect(built.notes.join(" ")).toMatch(/no orthographic view/);
  });

  it("builds no reference for a regionless view on a multi-view sheet", () => {
    // Reading the whole sheet as one view would blend every view into a single
    // silhouette and report a confident, meaningless IoU. Skipping it is the
    // honest answer.
    const built = buildViewReferences(
      viewSet({
        views: [
          { id: "v_front", kind: "front", confidence: 0.9 },
          { id: "v_top", kind: "top", region: [0.5, 0, 1, 1], confidence: 0.9 },
        ],
      }),
      { raster: plateDrawing(), width: 512, height: 512 },
    );

    expect(built.references.length).toBe(1);
    expect(built.references[0].viewId).toBe("v_top");
    expect(built.notes.join(" ")).toMatch(/blend every view together/);
  });

  it("still reads a single-view sheet as the whole image", () => {
    // One view: the sheet IS the view, so a missing region costs nothing.
    const built = buildViewReferences(viewSet(), { raster: plateDrawing(), width: 512, height: 512 });
    expect(built.references.length).toBe(1);
    expect(built.notes.join(" ")).not.toMatch(/blend every view/);
  });

  it("crops to the view's own region", () => {
    const drawing = plateDrawing();
    const whole = buildViewReferences(viewSet(), { raster: drawing, width: 512, height: 512 });
    const half = buildViewReferences(
      viewSet({ views: [{ id: "v_top", kind: "top", region: [0, 0, 0.5, 1], confidence: 0.9 }] }),
      { raster: drawing, width: 512, height: 512 },
    );

    // The left half of the drawing holds only the plate's left edge, so the
    // silhouette there is a full-height sliver, not the whole plate.
    expect(half.references.length).toBe(1);
    expect(half.references[0].maskWidth).toBeLessThan(whole.references[0].maskWidth);
  });

  it("reports an undecodable drawing instead of throwing", () => {
    const path = join(WORK, "not-an-image.png");
    writeFileSync(path, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]));

    const built = buildViewReferencesFromImage(path, viewSet(), { width: 512, height: 512 });

    expect(built.references).toEqual([]);
    expect(built.notes.join(" ")).toMatch(/could not read the drawing as a raster/);
    expect(built.notes.join(" ")).toMatch(/JPEG/);
  });

  it("reads a written drawing back pixel for pixel", () => {
    const drawing = plateDrawing();
    const path = join(WORK, "roundtrip.png");
    writeFileSync(path, encodePngGray(drawing));

    const loaded = loadRaster(path);
    expect(loaded.width).toBe(drawing.width);
    expect(loaded.height).toBe(drawing.height);

    const decoded = decodeRaster(new Uint8Array(readFileSync(path)));
    expect(decoded.format).toBe("png");
    expect(Array.from(decoded.raster.gray.slice(0, 64))).toEqual(
      Array.from(drawing.gray.slice(0, 64)),
    );
  });

  it("carries the drawing's ink alongside the mask, with a margin", () => {
    // The mask is the part's INTERIOR; its outline strokes lie just outside it.
    // Cutting the ink to the mask's own box would throw away the very line the
    // outline gate measures against.
    const built = buildViewReferences(viewSet(), { raster: plateDrawing(), width: 512, height: 512 });
    const ref = built.references[0];

    expect(ref.inkWidth).toBe(ref.maskWidth + 8);
    expect(ref.inkHeight).toBe(ref.maskHeight + 8);
    expect(ref.ink.length).toBe(ref.inkWidth * ref.inkHeight);

    // The plate's outline is ink; so the crop is not blank.
    expect(ref.ink.reduce((n, v) => n + (v ? 1 : 0), 0)).toBeGreaterThan(50);

    // The mask's interior is material, not ink — ink is everything drawn.
    const centreX = Math.floor(ref.maskWidth / 2);
    const centreY = Math.floor(ref.maskHeight / 2);
    expect(ref.ink[(centreY + 4) * ref.inkWidth + centreX + 4]).toBe(0);
  });

  it("keeps the ink frame aligned with the mask it was cut from", () => {
    const built = buildViewReferences(
      viewSet({ scale: { kind: "dimension_callout", realLength: 100, imageLength: 200, mmPerPixel: 0.5 } }),
      { raster: plateDrawing(), width: 512, height: 512 },
    );
    const ref = built.references[0];
    const mpp = 0.5;
    const margin = 4 * mpp;

    // Mask pixel (4,4) is ink pixel (0,0), so the ink's frame starts one margin
    // before the mask's in model coordinates.
    expect(ref.inkBounds).toBeDefined();
    expect(ref.inkBounds!.minX).toBeCloseTo(ref.referenceBounds!.minX - margin, 6);
    expect(ref.inkBounds!.minY).toBeCloseTo(ref.referenceBounds!.minY - margin, 6);
    expect(ref.inkBounds!.maxX).toBeCloseTo(ref.referenceBounds!.maxX + margin, 6);
    expect(ref.inkBounds!.maxY).toBeCloseTo(ref.referenceBounds!.maxY + margin, 6);
  });

  it("reads a part that touches the edge of its panel without wrapping the ink", () => {
    // The crop is expanded by a margin, so it runs off the source. Reading past
    // the end must give background, not pixels from the far side of the image.
    const r = lineArt(120, 120, () => {});
    const rect = rectOutline(r, 0, 0, 119, 119);
    for (let y = 0; y < r.height; y++) for (let x = 0; x < r.width; x++) rect(x, y);

    const built = buildViewReferences(viewSet(), { raster: r, width: 512, height: 512 });
    expect(built.references.length).toBe(1);
    const ref = built.references[0];

    expect(ref.inkWidth).toBe(ref.maskWidth + 8);
    // The border of the expanded crop is outside the drawing — entirely blank.
    for (let x = 0; x < ref.inkWidth; x++) {
      expect(ref.ink[x]).toBe(0);
      expect(ref.ink[(ref.inkHeight - 1) * ref.inkWidth + x]).toBe(0);
    }
  });

  it("refuses the mask but keeps the ink on a drawing of many parts", () => {
    // An assembly: nine small boxes, no single region that is the part. The mask
    // gate has nothing to measure here, and used to take the outline gate with
    // it — which is the one shape check that does not need a closed region.
    const r = lineArt(200, 200, () => {});
    for (let i = 0; i < 9; i++) {
      const cx = 40 + (i % 3) * 60;
      const cy = 40 + Math.floor(i / 3) * 60;
      const box = rectOutline(r, cx - 20, cy - 20, cx + 20, cy + 20);
      for (let y = cy - 22; y <= cy + 22; y++) for (let x = cx - 22; x <= cx + 22; x++) box(x, y);
    }

    const built = buildViewReferences(viewSet(), { raster: r, width: 512, height: 512 });
    expect(built.references.length).toBe(1);
    const ref = built.references[0];

    expect(ref.maskUsable).toBe(false);
    expect(ref.maskWidth).toBe(0);
    expect(built.notes.join(" ")).toMatch(/no single part silhouette/);

    // The ink is the view's whole region, so the gate still has something to
    // measure an outline against.
    expect(ref.inkWidth).toBe(r.width);
    expect(ref.inkHeight).toBe(r.height);
    expect(ref.ink.reduce((n, v) => n + (v ? 1 : 0), 0)).toBeGreaterThan(200);
  });

  it("places the whole-region ink from the stated scale when there is no mask", () => {
    const r = lineArt(200, 200, () => {});
    for (let i = 0; i < 4; i++) {
      const cx = 60 + (i % 2) * 80;
      const cy = 60 + Math.floor(i / 2) * 80;
      const box = rectOutline(r, cx - 25, cy - 25, cx + 25, cy + 25);
      for (let y = cy - 27; y <= cy + 27; y++) for (let x = cx - 27; x <= cx + 27; x++) box(x, y);
    }

    const built = buildViewReferences(
      viewSet({ scale: { kind: "dimension_callout", realLength: 100, imageLength: 200, mmPerPixel: 0.5 } }),
      { raster: r, width: 512, height: 512 },
    );
    const ref = built.references[0];

    expect(ref.maskUsable).toBe(false);
    // 200px of drawing at 0.5 mm/px is a 100mm frame, and the ink IS that frame.
    expect(ref.inkBounds!.minX).toBeCloseTo(0, 6);
    expect(ref.inkBounds!.minY).toBeCloseTo(0, 6);
    expect(ref.inkBounds!.maxX).toBeCloseTo(100, 6);
    expect(ref.inkBounds!.maxY).toBeCloseTo(100, 6);
    expect(ref.referenceBounds).toBeUndefined();
    expect(built.notes.join(" ")).toMatch(/no silhouette to check that estimate against/);
  });
});

// ---------------------------------------------------------------------------

const TREE: FeatureTree = {
  name: "plate",
  units: { length: "mm", toMillimeter: 1 },
  datums: { planes: {}, axes: {} },
  sketches: {
    s_base: {
      id: "s_base",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [{ tag: "e1", type: "line", start: [0, 0], end: [100, 0] }],
      constraints: [],
    },
  },
  features: [
    { id: "f_pad", name: "Pad", op: { op: "pad", sketchId: "s_base", distance: "t" } },
  ],
  parameters: [{ name: "t", expr: "10", unit: "mm" }],
};

describe("artifacts", () => {
  it("writes the tree, the code and the reference it was judged against", () => {
    const dir = join(WORK, "artifacts");
    const ref = buildViewReferences(viewSet(), {
      raster: plateDrawing(),
      width: 512,
      height: 512,
    }).references[0];

    const paths = saveArtifacts({
      workDir: dir,
      tree: TREE,
      code: { source: "function createModel() {}\n", entryPoint: "createModel", imports: [], methodsUsed: [] },
      review: {
        passed: true,
        issues: [],
        skippedFeatures: [],
        geometry: { shapeValid: true, volume: 123 },
      },
      references: [ref],
    });

    expect(paths.dir).toBe(join(dir, ARTIFACT_DIR));
    expect(loadTree(paths.tree).name).toBe("plate");
    expect(readFileSync(paths.code, "utf-8")).toContain("createModel");
    expect(JSON.parse(readFileSync(paths.review!, "utf-8")).geometry.volume).toBe(123);

    // The silhouette is on disk as a PNG that still decodes to the same mask.
    // Set pixels are written dark, so they come back as low luminance.
    expect(paths.reference.length).toBe(1);
    const decoded = loadRaster(paths.reference[0]);
    expect(decoded.width).toBe(ref.maskWidth);
    expect(decoded.height).toBe(ref.maskHeight);

    const asMask = Array.from(decoded.gray).map((g) => (g > 127 ? 0 : 1));
    expect(asMask).toEqual(Array.from(ref.mask));
  });

  it("rejects a file that is not a feature tree", () => {
    const path = join(WORK, "bad.json");
    writeFileSync(path, JSON.stringify({ hello: "world" }));
    expect(() => loadTree(path)).toThrow(/not a feature tree/);
  });
});
