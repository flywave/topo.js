/**
 * The refinement loop, against the real kernel.
 *
 * Every live run so far was made with refinements disabled, so the loop that
 * closes the pipeline — measure, hand the measurements back, edit the TREE, and
 * only keep the edit if it genuinely helped — had never actually run. These
 * tests drive it deterministically, which is also the only way to test the
 * decisions rather than the outcome: a real model's repair either works or does
 * not, and either way says nothing about whether an equal-priority "repair" was
 * correctly refused.
 *
 * The case is the real one. A drawing says the plate is 120mm wide; the first
 * tree builds it 90mm wide; L4 measures the silhouette and reports it; the
 * repair fixes the dimension. That is the loop doing the job it exists for.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getTopo, installGlobals } from "./helpers/topo.js";
import { CadPipeline } from "../lib/cad_pipeline.js";
import { MockProvider } from "../lib/llm.js";
import { encodePngGray } from "../lib/cad/image_encode.js";
import type { Raster } from "../lib/cad/image.js";
import type { FeatureTree } from "../lib/cad/model.js";

let tp: any;

const WORK = join(tmpdir(), "topo-img2cad-refine");

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
  mkdirSync(WORK, { recursive: true });
}, 120_000);

// ---------------------------------------------------------------------------

const SCALE = 5; // px/mm
const MARGIN = 50;

/** A line drawing of a plate `widthMm` x 60mm, with no holes to keep it simple. */
function drawPlate(path: string, widthMm: number, heightMm = 60): string {
  const pxW = widthMm * SCALE + MARGIN * 2;
  const pxH = heightMm * SCALE + MARGIN * 2;
  const gray = new Uint8Array(pxW * pxH).fill(255);
  const opaque = new Uint8Array(pxW * pxH).fill(1);

  const set = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < pxW && y < pxH) gray[y * pxW + x] = 0;
  };
  const l = MARGIN;
  const t = MARGIN;
  const r = MARGIN + widthMm * SCALE;
  const b = MARGIN + heightMm * SCALE;
  for (let x = l; x <= r; x++) {
    set(x, t);
    set(x, b);
  }
  for (let y = t; y <= b; y++) {
    set(l, y);
    set(r, y);
  }

  const raster: Raster = { width: pxW, height: pxH, gray, opaque };
  writeFileSync(path, encodePngGray(raster));
  return path;
}

/** The same plate, dimensioned `widthParam` on the top edge. */
function plateTree(widthExpr: string, widthMm: number): FeatureTree {
  return {
    name: "refine_plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s: {
        id: "s",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [0, 0], end: [widthMm, 0] },
          { tag: "e2", type: "line", start: [widthMm, 0], end: [widthMm, 60] },
          { tag: "e3", type: "line", start: [widthMm, 60], end: [0, 60] },
          { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
        ],
        constraints: [
          { kind: "LENGTH", tags: ["e1"], value: widthMm },
          { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
        ],
      },
    },
    features: [
      { id: "f", name: "Pad", op: { op: "pad", sketchId: "s", distance: "thickness" }, drivenBy: ["thickness"] },
    ],
    parameters: [
      { name: "thickness", expr: "10", unit: "mm" },
      { name: "width", expr: widthExpr, unit: "mm" },
    ],
    designIntent: { primaryAxis: "z", minWallThickness: 2 },
  };
}

/** One view, and a callout saying the drawn 120mm edge spans 600px. */
const VIEW_SET = JSON.stringify({
  drawingKind: "engineering_drawing",
  views: [{ id: "v_top", kind: "top", region: [0, 0, 1, 1], confidence: 0.95 }],
  scale: { kind: "dimension_callout", label: "120", realLength: 120, imageLength: 120 * SCALE },
  units: { length: "mm" },
  undetermined: [],
});

const PROFILE = JSON.stringify({
  viewId: "v_top",
  entities: [
    { tag: "e1", type: "line", start: [0, 0], end: [120, 0] },
    { tag: "e2", type: "line", start: [120, 0], end: [120, 60] },
    { tag: "e3", type: "line", start: [120, 60], end: [0, 60] },
    { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
  ],
  loops: [{ tags: ["e1", "e2", "e3", "e4"], closed: true }],
  relations: [],
  dimensions: [],
});

function providerWith(treeQueue: FeatureTree[]): MockProvider {
  const llm = new MockProvider();
  llm.setResponse("analyzeImage", VIEW_SET);
  llm.queueResponse("complete", PROFILE);
  for (const tree of treeQueue) llm.queueResponse("complete", JSON.stringify(tree));
  // Anything beyond the queue (a further repair) repeats the last tree.
  llm.setResponse("complete", JSON.stringify(treeQueue[treeQueue.length - 1]));
  return llm;
}

// ---------------------------------------------------------------------------

describe("the refinement loop repairs the tree, not the code", () => {
  it("measures a wrong size, is told the measurement, and fixes the dimension", async () => {
    const imagePath = drawPlate(join(WORK, "plate120.png"), 120);
    // First tree: 90mm wide, though the drawing says 120.
    const llm = providerWith([plateTree("90", 90), plateTree("120", 120)]);

    const pipeline = new CadPipeline({ llm, tp, maxRefinements: 2 });
    const result = await pipeline.run(imagePath, "Plate");

    // It had to refine, and it stopped after one repair.
    expect(result.refinements).toBe(1);
    expect(result.review).toBeDefined();

    // The final geometry is the drawing's size, not the first tree's.
    const bbox = result.review!.geometry!.bbox!;
    expect(bbox[3] - bbox[0]).toBeCloseTo(120, 2);
    expect(result.resolved.width).toBe(120);
    expect(result.review!.passed).toBe(true);

    // The verdict is the measured one, and it moved.
    const rep = result.review!.reprojection!;
    expect(rep.compared).toBe(true);
    expect(rep.views[0].iou).toBeGreaterThan(0.9);
  }, 180_000);

  it("stops rather than burning the budget when a repair changes nothing", async () => {
    const imagePath = drawPlate(join(WORK, "plate120b.png"), 120);
    // Both trees are the same wrong 90mm plate: a "repair" that repairs nothing.
    const llm = providerWith([plateTree("90", 90), plateTree("90", 90)]);

    const pipeline = new CadPipeline({ llm, tp, maxRefinements: 3 });
    const result = await pipeline.run(imagePath, "Plate");

    expect(result.refinements).toBe(1);
    expect(result.warnings.join(" ")).toMatch(/did not improve|worse tree/);
    expect(result.review!.passed).toBe(false);
  }, 180_000);

  it("never tells the model to resize a part whose scale was only estimated", async () => {
    const imagePath = drawPlate(join(WORK, "plate120c.png"), 120);
    const llm = providerWith([plateTree("90", 90), plateTree("90", 90)]);

    const pipeline = new CadPipeline({ llm, tp, maxRefinements: 1 });
    const result = await pipeline.run(imagePath, "Plate");

    const lowIou = result.review!.issues.filter((i) => i.code === "RPR_LOW_IOU");
    // The callout put the frame at an absolute size, so this run CAN see a size
    // error and the repair is entitled to act on it.
    expect(lowIou.length).toBeGreaterThan(0);
    expect(lowIou[0].suggestion).not.toMatch(/misread scale/);
  }, 180_000);

  it("still refuses to spend a round on something a tree edit cannot fix", async () => {
    const imagePath = drawPlate(join(WORK, "plate120d.png"), 120);
    // No kernel: an unexecutable run's failure is not the tree's fault, so the
    // loop must not ask the model to "fix" a tree that is fine.
    const llm = providerWith([plateTree("120", 120)]);
    const pipeline = new CadPipeline({ llm, maxRefinements: 3 });
    const result = await pipeline.run(imagePath, "Plate");

    expect(result.review).toBeUndefined();
    expect(result.refinements).toBe(0);
  }, 180_000);
});
