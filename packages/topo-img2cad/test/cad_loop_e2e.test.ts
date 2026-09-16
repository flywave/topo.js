/**
 * The loop, closed, against a real drawing and the real kernel.
 *
 * `wasm_e2e.test.ts` proves the emitted code builds solids and that re-projection
 * works when a reference is handed to it. This file proves the part that was
 * missing: that the reference comes from the IMAGE, that the model is measured
 * against it without a human assembling anything, and that a drawing of the wrong
 * part fails.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getTopo, installGlobals } from "./helpers/topo.js";
import { CadPipeline } from "../lib/cad_pipeline.js";
import { DEFAULT_EDGE_THRESHOLDS } from "../lib/validators/edge_distance.js";
import { MockProvider } from "../lib/llm.js";
import { encodePngGray } from "../lib/cad/image_encode.js";
import { decodeRaster, type Raster } from "../lib/cad/image.js";
import type { FeatureTree } from "../lib/cad/model.js";

let tp: any;

const WORK = join(tmpdir(), "topo-img2cad-loop");

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
  mkdirSync(WORK, { recursive: true });
}, 120_000);

afterAll(() => {
  try {
    rmSync(WORK, { recursive: true, force: true });
  } catch {
    // Nothing to clean up.
  }
});

// ---------------------------------------------------------------------------
// Drawing generation
// ---------------------------------------------------------------------------

const SCALE = 2; // pixels per millimetre
const MARGIN = 40;

interface Drawing {
  path: string;
  width: number;
  height: number;
  /** Model-space width of the drawn outline, in millimetres. */
  modelWidth: number;
  modelHeight: number;
}

/**
 * A line drawing of a rectangular plate with a central bore.
 *
 * Drawn as the "top" view of an XY sketch extruded along +Z, so screen x is the
 * model's x and the outline's height is the model's y. Thin ink on white, which
 * is what the region-mode silhouette extraction is for.
 */
function drawPlate(opts: {
  name: string;
  width: number;
  height: number;
  boreDiameter?: number;
  thickness?: number;
}): Drawing {
  const pxW = Math.round(opts.width * SCALE) + MARGIN * 2;
  const pxH = Math.round(opts.height * SCALE) + MARGIN * 2;
  const gray = new Uint8Array(pxW * pxH).fill(255);
  const opaque = new Uint8Array(pxW * pxH).fill(1);

  drawPlateInto(gray, pxW, pxH, opts.width, opts.height, opts.boreDiameter);

  const raster: Raster = { width: pxW, height: pxH, gray, opaque };
  const path = join(WORK, `${opts.name}.png`);
  writeFileSync(path, encodePngGray(raster));

  return { path, width: pxW, height: pxH, modelWidth: opts.width, modelHeight: opts.height };
}

/** The plate's outline plus its bore, drawn in black into an existing field. */
function drawPlateInto(
  gray: Uint8Array,
  pxW: number,
  pxH: number,
  width: number,
  height: number,
  boreDiameter?: number,
): void {
  const set = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= pxW || y >= pxH) return;
    gray[y * pxW + x] = 0;
  };
  const hLine = (x0: number, x1: number, y: number): void => {
    for (let x = x0; x <= x1; x++) set(x, y);
  };
  const vLine = (x: number, y0: number, y1: number): void => {
    for (let y = y0; y <= y1; y++) set(x, y);
  };

  const left = MARGIN;
  const top = MARGIN;
  const right = MARGIN + Math.round(width * SCALE);
  const bottom = MARGIN + Math.round(height * SCALE);

  hLine(left, right, top);
  hLine(left, right, bottom);
  vLine(left, top, bottom);
  vLine(right, top, bottom);

  if (boreDiameter) {
    const r = (boreDiameter / 2) * SCALE;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    for (let a = 0; a < 360; a += 0.5) {
      const rad = (a * Math.PI) / 180;
      set(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)));
    }
  }
}

/**
 * The same plate, on a fully dimensioned sheet.
 *
 * A drawing with its dimensions on it has no single enclosed region that is the
 * part — the annotation chops the paper into fragments — so the silhouette gate
 * has nothing to measure. That is the live case this exists for: a drawing of ONE
 * part, densely annotated, that used to be refused outright.
 */
function drawAnnotatedPlate(opts: { name: string; width: number; height: number; pitch?: number }): Drawing {
  const pitch = opts.pitch ?? 32;
  const pxW = Math.round(opts.width * SCALE) + MARGIN * 2;
  const pxH = Math.round(opts.height * SCALE) + MARGIN * 2;
  const gray = new Uint8Array(pxW * pxH).fill(255);
  const opaque = new Uint8Array(pxW * pxH).fill(1);

  // The dimension layer: extension lines at a regular pitch over the whole sheet.
  for (let y = 0; y < pxH; y++) {
    for (let x = 0; x < pxW; x++) {
      if ((x + 3) % pitch === 0 || (y + 3) % pitch === 0) gray[y * pxW + x] = 90;
    }
  }

  // The part's own outline, drawn over the top of it in solid black.
  drawPlateInto(gray, pxW, pxH, opts.width, opts.height, 30);

  const raster: Raster = { width: pxW, height: pxH, gray, opaque };
  const path = join(WORK, `${opts.name}.png`);
  writeFileSync(path, encodePngGray(raster));

  return { path, width: pxW, height: pxH, modelWidth: opts.width, modelHeight: opts.height };
}

/**
 * A drawing of a DIFFERENT part: the same plate drawn twice as wide.
 *
 * The scale callout stays at the original, so the physical size the model must
 * reproduce is unchanged — the drawing simply disagrees with it.
 */
function drawStretchedPlate(name: string, drawnWidthMm: number): Drawing {
  return drawPlate({ name, width: drawnWidthMm, height: drawnWidthMm * 0.6 });
}

// ---------------------------------------------------------------------------
// Canned model responses
// ---------------------------------------------------------------------------

/** One top view; the callout says 200px spans 100mm, so 0.5 mm/px. */
function viewSetFor(drawing: Drawing): string {
  return JSON.stringify({
    drawingKind: "engineering_drawing",
    views: [{ id: "v_top", kind: "top", region: [0, 0, 1, 1], confidence: 0.95 }],
    scale: {
      kind: "dimension_callout",
      label: `${drawing.modelWidth}`,
      realLength: drawing.modelWidth,
      imageLength: drawing.modelWidth * SCALE,
    },
    units: { length: "mm" },
    undetermined: [],
  });
}

const PROFILE_TOP = JSON.stringify({
  viewId: "v_top",
  entities: [
    { tag: "e1", type: "line", start: [0, 0], end: [100, 0] },
    { tag: "e2", type: "line", start: [100, 0], end: [100, 60] },
    { tag: "e3", type: "line", start: [100, 60], end: [0, 60] },
    { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
    { tag: "c1", type: "circle", center: [50, 30], radius: 15 },
  ],
  loops: [{ tags: ["e1", "e2", "e3", "e4"], closed: true }],
  relations: [],
  dimensions: [{ name: "plateWidth", kind: "length", value: 100, tags: ["e1"] }],
});

/** 100 x 60 x 10 plate with a 30mm through bore — what the drawing shows. */
function plateTree(dims: { width?: number; height?: number; bore?: number } = {}): FeatureTree {
  const width = dims.width ?? 100;
  const height = dims.height ?? 60;
  const bore = dims.bore ?? 30;
  const hole = { x: width / 2, y: height / 2 };
  return {
    name: "mounting_plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_base: {
        id: "s_base",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [0, 0], end: [width, 0] },
          { tag: "e2", type: "line", start: [width, 0], end: [width, height] },
          { tag: "e3", type: "line", start: [width, height], end: [0, height] },
          { tag: "e4", type: "line", start: [0, height], end: [0, 0] },
        ],
        constraints: [
          { kind: "LENGTH", tags: ["e1"], value: width },
          { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
          { kind: "LENGTH", tags: ["e2"], value: height },
          { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
          { kind: "LENGTH", tags: ["e3"], value: width },
          { kind: "ORIENTATION", tags: ["e3"], value: [-1, 0] },
          { kind: "LENGTH", tags: ["e4"], value: height },
          { kind: "ORIENTATION", tags: ["e4"], value: [0, -1] },
        ],
      },
      s_bore: {
        id: "s_bore",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [{ tag: "c1", type: "circle", center: [hole.x, hole.y], radius: bore / 2 }],
        constraints: [{ kind: "RADIUS", tags: ["c1"], value: bore / 2 }],
      },
    },
    features: [
      {
        id: "f_pad",
        name: "Base plate",
        op: { op: "pad", sketchId: "s_base", distance: "plateThickness" },
        drivenBy: ["plateThickness"],
      },
      {
        id: "f_bore",
        name: "Bore",
        op: { op: "pocket", sketchId: "s_bore", through: true },
        drivenBy: ["plateThickness"],
      },
    ],
    parameters: [{ name: "plateThickness", expr: "10", unit: "mm", min: 2 }],
    designIntent: { primaryAxis: "z", minWallThickness: 2 },
  };
}

function scriptedLLM(treeResponse: string): MockProvider {
  const llm = new MockProvider();
  llm.queueResponse("complete", PROFILE_TOP);
  llm.queueResponse("complete", treeResponse);
  llm.queueResponse("complete", treeResponse);
  llm.queueResponse("complete", treeResponse);
  return llm;
}

// ---------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------

describe("the closed loop: image → tree → code → measured verdict", () => {
  it("measures the model against the silhouette read off the drawing", async () => {
    const drawing = drawPlate({ name: "plate_ok", width: 100, height: 60, boreDiameter: 30 });
    const llm = scriptedLLM(JSON.stringify(plateTree()));
    llm.setResponse("analyzeImage", viewSetFor(drawing));

    const pipeline = new CadPipeline({
      llm,
      tp,
      workDir: join(WORK, "out_ok"),
      maxRefinements: 0,
    });
    const result = await pipeline.run(drawing.path, "Mounting plate");

    expect(result.errors).toEqual([]);
    expect(result.lint.passed).toBe(true);

    // The reference came from the image, not from the caller.
    expect(result.review).toBeDefined();
    const rep = result.review!.reprojection;
    expect(rep).toBeDefined();
    expect(rep!.compared).toBe(true);
    expect(rep!.views.length).toBe(1);

    const top = rep!.views[0];
    expect(top.view).toBe("top");
    // The scale callout was usable, so size is checked and not normalised away.
    expect(top.registration).toBe("absolute");

    // The bore must read as a hole in the reference, or the comparison would be
    // between a plate and a plate and would pass for the wrong reason.
    expect(top.referencePixels).toBeGreaterThan(0);

    // A correct model must actually pass: a gate that always fails is no gate.
    expect(rep!.passed).toBe(true);
    expect(top.iou).toBeGreaterThan(0.9);
    expect(result.review!.passed).toBe(true);

    // L2 and L6 ran too.
    expect(result.review!.geometry?.shapeValid).toBe(true);
    expect(result.review!.geometry!.volume!).toBeCloseTo(
      100 * 60 * 10 - Math.PI * 15 * 15 * 10,
      0,
    );
    expect(result.associativity).not.toBeNull();
    expect(result.associativity!.passed).toBe(true);
    expect(result.associativity!.checks[0].droveGeometry).toBe(true);

    // And the artifacts are on disk, including the silhouette it was judged on.
    expect(result.artifacts?.tree).toContain("tree.json");
    expect(result.artifacts?.reference.length).toBe(1);

    // So is the deliverable: both formats, named after the part.
    const outDir = join(WORK, "out_ok");
    expect(result.exports?.failures).toEqual([]);
    expect(result.exports?.files.map((f) => f.format).sort()).toEqual(["step", "stl"]);
    expect(statSync(join(outDir, "mounting_plate.step")).size).toBeGreaterThan(1000);
    const stl = new Uint8Array(readFileSync(join(outDir, "mounting_plate.stl")));
    const triangles = new DataView(stl.buffer, stl.byteOffset, stl.byteLength).getUint32(80, true);
    expect(triangles).toBeGreaterThan(0);
    expect(stl.length).toBe(84 + triangles * 50);
  }, 180_000);

  it("projects along the plane the drawing records, not the view's label", async () => {
    // A live run's exact shape: the model called the sheet's view "front" while
    // recording that it is the XY plane, and built its sketches on XY. Projecting
    // along the label looks at the part's 10mm edge instead of its 120x80 face
    // and scored IoU 0.154 — on a part whose volume was right to six figures.
    // plateTree() is the 100x60 fixture, so the drawing has to be the same part.
    // ...and it has to show the same Ø30 bore the fixture builds.
    const drawing = drawPlate({ name: "plate_labelled_front", width: 100, height: 60, boreDiameter: 30 });
    const llm = scriptedLLM(JSON.stringify(plateTree()));
    llm.setResponse("analyzeImage", JSON.stringify({
      drawingKind: "engineering_drawing",
      views: [{ id: "v_front", kind: "front", projectionPlane: "XY", region: [0, 0, 1, 1], confidence: 0.95 }],
      scale: { kind: "dimension_callout", label: "100", realLength: 100, imageLength: 100 * SCALE },
      units: { length: "mm" },
      undetermined: [],
    }));

    const pipeline = new CadPipeline({ llm, tp, maxRefinements: 0 });
    const result = await pipeline.run(drawing.path, "Mounting plate");

    const rep = result.review!.reprojection;
    expect(rep).toBeDefined();
    expect(rep!.compared).toBe(true);
    // Compared along XY, which is the face the drawing shows.
    expect(rep!.views[0].view).toBe("XY");
    expect(rep!.views[0].iou).toBeGreaterThan(0.9);
    expect(rep!.passed).toBe(true);
  }, 180_000);

  it("fails a model whose size disagrees with the drawing", async () => {
    // The drawing is 200mm wide where the model will be 100mm: the callout still
    // says 100mm spans the drawn width, so the model is half the size it should be.
    const drawing = drawStretchedPlate("plate_wide", 200);
    const llm = scriptedLLM(JSON.stringify(plateTree()));
    llm.setResponse("analyzeImage", viewSetFor(drawing));

    const pipeline = new CadPipeline({
      llm,
      tp,
      workDir: join(WORK, "out_wide"),
      maxRefinements: 0,
    });
    const result = await pipeline.run(drawing.path, "Mounting plate");

    const rep = result.review!.reprojection!;
    const top = rep.views[0];
    expect(top.registration).toBe("absolute");
    expect(top.iou).toBeLessThan(0.9);
    expect(rep.issues.some((i) => i.code === "RPR_LOW_IOU")).toBe(true);
    expect(result.review!.passed).toBe(false);
  }, 180_000);

  it("still compares shape when the drawing carries no scale", async () => {
    const drawing = drawPlate({ name: "plate_noscale", width: 100, height: 60, boreDiameter: 30 });
    const llm = scriptedLLM(JSON.stringify(plateTree()));
    // Same view, but the callout is gone.
    llm.setResponse("analyzeImage", JSON.stringify({
      drawingKind: "engineering_drawing",
      views: [{ id: "v_top", kind: "top", region: [0, 0, 1, 1], confidence: 0.9 }],
      units: { length: "mm" },
      undetermined: [],
    }));

    const pipeline = new CadPipeline({ llm, tp, maxRefinements: 0 });
    const result = await pipeline.run(drawing.path, "Mounting plate");

    const top = result.review!.reprojection!.views[0];
    // No scale: the mask is fitted to the model, so size is not being checked and
    // the report says so rather than implying it was.
    expect(top.registration).toBe("normalized");
    expect(top.iou).toBeGreaterThan(0.9);
    expect(result.warnings.join(" ")).toMatch(/fitted to the model/);
  }, 180_000);

  it("grades shape on an annotated drawing, where no silhouette can be read", async () => {
    // The live failure this exists for: a drawing of ONE part, fully dimensioned.
    // Annotation chops the paper into fragments, so there is no single enclosed
    // region that is the part — the silhouette gate has nothing to measure, and
    // the outline gate used to be refused along with it. A run against a drawing
    // like this reported PASSED with half its outline more than thirty pixels
    // from anything the drawing had drawn.
    const drawing = drawAnnotatedPlate({ name: "plate_annotated", width: 100, height: 60 });

    const good = new CadPipeline({
      llm: (() => {
        const llm = scriptedLLM(JSON.stringify(plateTree()));
        llm.setResponse("analyzeImage", viewSetFor(drawing));
        return llm;
      })(),
      tp,
      maxRefinements: 0,
    });
    const goodRun = await good.run(drawing.path, "Mounting plate");

    // The drawing is one part, densely annotated, and it says so rather than
    // claiming it could not read the sheet at all.
    expect(goodRun.warnings.join(" ")).toMatch(/no single part silhouette/);
    const edges = goodRun.review!.edgeDistance;
    expect(edges).toBeDefined();
    expect(edges!.length).toBe(1);
    expect(edges![0].compared).toBe(true);
    // The placement is searched, because there is no silhouette to check the
    // drawing's own scale estimate against.
    expect(edges![0].registration).toBeDefined();
    expect(edges![0].meanFraction).toBeLessThan(0.015);
    // It clears the chance bar, which is what a dense sheet demands.
    expect(edges![0].meanPx).toBeLessThan(
      Math.max(
        DEFAULT_EDGE_THRESHOLDS.maxMeanRatio * edges![0].baselinePx,
        DEFAULT_EDGE_THRESHOLDS.matchFloorPx,
      ),
    );
    expect(goodRun.review!.passed).toBe(true);

    // The mask gate sat this one out, and said so rather than reporting a
    // comparison it never made.
    expect(goodRun.review!.reprojection!.views.length).toBe(0);

    // Now the part the drawing does NOT show: the same plate at half size.
    const bad = new CadPipeline({
      llm: (() => {
        const llm = scriptedLLM(JSON.stringify(plateTree({ width: 50, height: 30, bore: 16 })));
        llm.setResponse("analyzeImage", viewSetFor(drawing));
        return llm;
      })(),
      tp,
      maxRefinements: 0,
    });
    const badRun = await bad.run(drawing.path, "Mounting plate");

    expect(badRun.review!.passed).toBe(false);
    expect(badRun.review!.issues.some((i) => i.code === "EDG_OUTLINE_MISMATCH")).toBe(true);
    expect(badRun.review!.edgeDistance![0].meanRatio).toBeGreaterThan(
      DEFAULT_EDGE_THRESHOLDS.maxMeanRatio,
    );
  }, 300_000);

  it("closes the loop on an annotated drawing, where its only measurement is the outline gate", async () => {
    // The mask gate has nothing to compare against here, so the repair loop's
    // decision — keep this edit or not — rests entirely on the outline distance.
    // Without it in the score the loop would have no measurement to converge on
    // and would fall back to counting issues, which is the same silence in a
    // different place.
    const drawing = drawAnnotatedPlate({ name: "plate_annotated_loop", width: 100, height: 60 });

    const llm = new MockProvider();
    llm.setResponse("analyzeImage", viewSetFor(drawing));
    llm.queueResponse("complete", PROFILE_TOP);
    llm.queueResponse("complete", JSON.stringify(plateTree({ width: 50, height: 30, bore: 16 })));
    llm.queueResponse("complete", JSON.stringify(plateTree({ width: 70, height: 42, bore: 21 })));
    llm.queueResponse("complete", JSON.stringify(plateTree()));
    llm.setResponse("complete", JSON.stringify(plateTree()));

    const pipeline = new CadPipeline({ llm, tp, maxRefinements: 3 });
    const result = await pipeline.run(drawing.path, "Mounting plate");

    expect(result.review!.reprojection!.views.length).toBe(0);
    // TWO rounds, and that is the assertion that matters. The first repair
    // (50mm -> 70mm) leaves the same one blocking issue behind, so it can only
    // have been kept on the measurement — the outline distance. Had the score
    // been null for a drawing with no mask, that round would have been refused
    // and the run would have stopped with the wrong part, one repair short.
    expect(result.refinements).toBe(2);
    expect(result.review!.passed).toBe(true);

    const bbox = result.review!.geometry!.bbox!;
    expect(bbox[3] - bbox[0]).toBeCloseTo(100, 1);

    // The model was handed the measurement, not just a verdict: where the
    // outline was worst is what makes the repair actionable.
    const refinePrompt = llm
      .getCalls()
      .filter((c) => c.method === "complete")
      .map((c) => String(c.args[0]))
      .find((p) => p.includes("Repair this feature tree"));
    expect(refinePrompt).toBeDefined();
    expect(refinePrompt).toMatch(/"outline"/);
    expect(refinePrompt).toMatch(/"chancePx"/);
    expect(refinePrompt).toMatch(/"atExtent"/);
    expect(refinePrompt).toMatch(/EDG_OUTLINE_MISMATCH/);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// Reading the loops off the drawing rather than out of a description
// ---------------------------------------------------------------------------

describe("profile extraction with vision", () => {
  it("shows the model the view's own crop, not the whole sheet", async () => {
    const drawing = drawPlate({ name: "plate_vision", width: 100, height: 60 });

    // A provider that keeps the image bytes the pipeline sent.
    const llm = scriptedLLM(JSON.stringify(plateTree()));
    const images: string[] = [];
    const originalAnalyze = llm.analyzeImage.bind(llm);
    llm.analyzeImage = async (imageBase64: string, prompt: string) => {
      images.push(imageBase64);
      return originalAnalyze(imageBase64, prompt);
    };
    // A view that covers only the left half of the drawing.
    llm.setResponse("analyzeImage", JSON.stringify({
      drawingKind: "engineering_drawing",
      views: [{ id: "v_top", kind: "top", region: [0, 0, 0.5, 1], confidence: 0.9 }],
      units: { length: "mm" },
      undetermined: [],
    }));

    const pipeline = new CadPipeline({ llm, visionProfiles: true, maxRefinements: 0 });
    await pipeline.run(drawing.path, "Mounting plate");

    // One call for view intake, one for the profile.
    expect(images.length).toBe(2);

    const crop = decodeRaster(new Uint8Array(Buffer.from(images[1], "base64")));
    expect(crop.format).toBe("png");
    expect(crop.raster.width).toBe(Math.round(drawing.width / 2));
    expect(crop.raster.height).toBe(drawing.height);
  }, 180_000);

  it("falls back to text when the drawing cannot be decoded, and says why", async () => {
    const path = join(WORK, "sketch.jpg");
    writeFileSync(path, Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]));

    const llm = scriptedLLM(JSON.stringify(plateTree()));
    llm.setResponse("analyzeImage", viewSetFor({ path, width: 1, height: 1, modelWidth: 100, modelHeight: 60 }));

    const pipeline = new CadPipeline({ llm, visionProfiles: true, maxRefinements: 0 });
    const result = await pipeline.run(path, "Mounting plate");

    // The run still produces a tree, and says the profile came from text.
    expect(result.tree.name).toBe("mounting_plate");
    expect(result.warnings.join(" ")).toMatch(/could not be shown to the model/);
    expect(result.warnings.join(" ")).toMatch(/JPEG/);
  }, 180_000);
});
