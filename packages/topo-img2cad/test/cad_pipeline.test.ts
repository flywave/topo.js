import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { CadPipeline } from "../lib/cad_pipeline.js";
import { MockProvider } from "../lib/llm.js";

// ---------------------------------------------------------------------------
// Image fixture
// ---------------------------------------------------------------------------

/** A valid 1x1 PNG. The pipeline only reads and base64-encodes it. */
const PNG_1X1 = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

const IMAGE_PATH = join(tmpdir(), "topo-img2cad-test-fixture.png");

beforeAll(() => {
  writeFileSync(IMAGE_PATH, PNG_1X1);
});

afterAll(() => {
  try {
    unlinkSync(IMAGE_PATH);
  } catch {
    // Already gone; nothing to clean up.
  }
});

// ---------------------------------------------------------------------------
// Canned LLM responses
// ---------------------------------------------------------------------------

const VIEW_INTAKE_ENGINEERING_DRAWING = JSON.stringify({
  drawingKind: "engineering_drawing",
  views: [
    { id: "v_front", kind: "front", projectionPlane: "XZ", region: [0, 0, 0.5, 1], confidence: 0.95 },
    { id: "v_top", kind: "top", projectionPlane: "XY", region: [0.5, 0, 1, 0.5], confidence: 0.9 },
  ],
  scale: { kind: "dimension_callout", label: "120", realLength: 120, imageLength: 240 },
  units: { length: "mm" },
  undetermined: [],
});

const VIEW_INTAKE_PHOTO = JSON.stringify({
  drawingKind: "photo",
  views: [{ id: "v_photo", kind: "photo", confidence: 0.8 }],
  units: { length: "mm" },
  undetermined: ["depth"],
});

const PROFILE_FRONT = JSON.stringify({
  viewId: "v_front",
  entities: [
    { tag: "e1", type: "line", start: [-60, -40], end: [60, -40] },
    { tag: "e2", type: "line", start: [60, -40], end: [60, 40] },
    { tag: "e3", type: "line", start: [60, 40], end: [-60, 40] },
    { tag: "e4", type: "line", start: [-60, 40], end: [-60, -40] },
  ],
  loops: [{ tags: ["e1", "e2", "e3", "e4"], closed: true }],
  relations: [
    { kind: "horizontal", tags: ["e1"] },
    { kind: "parallel", tags: ["e1", "e3"] },
  ],
  dimensions: [{ name: "plateWidth", kind: "length", value: 120, tags: ["e1"] }],
});

/** A tree whose only defect is a dangling sketch reference. */
const TREE_MISSING_SKETCH = JSON.stringify({
  name: "plate",
  units: { length: "mm" },
  datums: { planes: {}, axes: {} },
  sketches: {
    s_base: {
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [
        { tag: "e1", type: "line", start: [-60, -40], end: [60, -40] },
        { tag: "e2", type: "line", start: [60, -40], end: [60, 40] },
        { tag: "e3", type: "line", start: [60, 40], end: [-60, 40] },
        { tag: "e4", type: "line", start: [-60, 40], end: [-60, -40] },
      ],
      constraints: [{ kind: "LENGTH", tags: ["e1"], value: 120 }],
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
      op: { op: "pocket", sketchId: "s_nonexistent", through: true },
    },
  ],
  parameters: [{ name: "plateThickness", expr: "12", unit: "mm", min: 2 }],
  designIntent: { primaryAxis: "z", minWallThickness: 2 },
});

/** The repaired tree: the dangling reference is gone. */
const TREE_REPAIRED = JSON.stringify({
  name: "plate",
  units: { length: "mm" },
  datums: { planes: {}, axes: {} },
  sketches: {
    s_base: {
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [
        { tag: "e1", type: "line", start: [-60, -40], end: [60, -40] },
        { tag: "e2", type: "line", start: [60, -40], end: [60, 40] },
        { tag: "e3", type: "line", start: [60, 40], end: [-60, 40] },
        { tag: "e4", type: "line", start: [-60, 40], end: [-60, -40] },
      ],
      constraints: [{ kind: "LENGTH", tags: ["e1"], value: 120 }],
    },
    s_bore: {
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [{ tag: "c1", type: "circle", center: [0, 0], radius: 8 }],
      constraints: [{ kind: "RADIUS", tags: ["c1"], value: 8 }],
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
  parameters: [{ name: "plateThickness", expr: "12", unit: "mm", min: 2 }],
  designIntent: { primaryAxis: "z", minWallThickness: 2 },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CAD pipeline end to end", () => {
  it("runs views → profiles → tree → code with no WASM instance", async () => {
    const llm = new MockProvider();
    llm.setResponse("analyzeImage", VIEW_INTAKE_ENGINEERING_DRAWING);
    // Profile extraction for both orthographic views, then nothing else queued.
    llm.queueResponse("complete", PROFILE_FRONT);
    llm.queueResponse("complete", PROFILE_FRONT);
    llm.queueResponse("complete", TREE_REPAIRED);

    const pipeline = new CadPipeline({ llm, maxRefinements: 0 });
    const result = await pipeline.run(IMAGE_PATH, "Mounting plate");

    expect(result.viewSet.drawingKind).toBe("engineering_drawing");
    expect(result.viewSet.views.length).toBe(2);
    expect(result.viewSet.scale?.mmPerPixel).toBeCloseTo(0.5);
    expect(result.profiles.length).toBe(2);

    expect(result.errors).toEqual([]);
    expect(result.lint.passed).toBe(true);
    expect(result.resolved.plateThickness).toBe(12);

    // The emitted code is a feature history built from resolved profile points.
    // Constraints live in the feature tree, not the artifact: the binding cannot
    // build a solid from a constrained sketch (see sketch_codegen.ts), so the
    // solver runs in a separate pass and its output is baked in as coordinates.
    const code = result.code.source;
    expect(code).toContain("function createModel");
    expect(code).toContain(".sketch()");
    expect(code).toContain(".segmentBetweenPoints(");
    expect(code).toContain(".constrain(");
    expect(code).toContain(".solve()");
    expect(code).toContain(".assemble(tp.SketchMode.ADD, undefined)");
    expect(code).toContain(".finalize()");
    expect(code).toContain(".extrude(12, true, true, false, undefined)");
    expect(code).toContain(".cut(tool_f_bore, true, 0)");
    // Not a single primitive was placed at coordinates.
    expect(code).not.toMatch(/boxCentered|rectCentered|circleCentered/);

    // No tp instance means no measured gates, and that is reported rather than
    // silently reported as a pass.
    expect(result.review).toBeUndefined();
  });

  it("refines the tree when a feature references a missing sketch", async () => {
    const llm = new MockProvider();
    llm.setResponse("analyzeImage", JSON.stringify({
      drawingKind: "photo",
      views: [{ id: "v_photo", kind: "photo", confidence: 0.7 }],
      units: { length: "mm" },
      undetermined: [],
    }));
    // First tree is broken, the repair is good.
    llm.queueResponse("complete", TREE_MISSING_SKETCH);
    llm.queueResponse("complete", TREE_REPAIRED);

    const pipeline = new CadPipeline({ llm, maxRefinements: 3 });
    const result = await pipeline.run(IMAGE_PATH, "Mounting plate");

    expect(result.refinements).toBe(1);
    expect(result.lint.passed).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.code.source).toContain("s_bore");

    // A photo yields one view and no orthographic profile extraction.
    expect(result.profiles.length).toBe(0);
    expect(result.warnings.join(" ")).toMatch(/scale evidence/);
  });

  it("stops refining when the repair makes things worse", async () => {
    const llm = new MockProvider();
    llm.setResponse("analyzeImage", VIEW_INTAKE_PHOTO_ONE_VIEW);
    llm.queueResponse("complete", TREE_MISSING_SKETCH);
    // A "repair" that is equally broken must not be accepted as progress.
    llm.queueResponse("complete", TREE_MISSING_SKETCH);

    const pipeline = new CadPipeline({ llm, maxRefinements: 3 });
    const result = await pipeline.run(IMAGE_PATH, "Plate");

    expect(result.refinements).toBe(1);
    expect(result.warnings.join(" ")).toMatch(/worse tree|did not improve/);
    expect(result.lint.passed).toBe(false);
  });

  it("reports a photo's single view honestly", async () => {
    const llm = new MockProvider();
    llm.setResponse("analyzeImage", VIEW_INTAKE_PHOTO);
    llm.setResponse("complete", TREE_REPAIRED);

    const pipeline = new CadPipeline({ llm });
    const result = await pipeline.run(IMAGE_PATH, "Bracket");

    expect(result.viewSet.views.length).toBe(1);
    expect(result.viewSet.views[0].kind).toBe("photo");
    // No scale evidence → dimensions are relative, and that is surfaced.
    expect(result.warnings.join(" ")).toMatch(/No scale evidence/);
    expect(result.viewSet.undetermined.join(" ")).toMatch(/depth/);
  });

  it("surfaces a scale that disagrees with its own lengths", async () => {
    const llm = new MockProvider();
    llm.setResponse("analyzeImage", JSON.stringify({
      drawingKind: "engineering_drawing",
      views: [{ id: "v_front", kind: "front", confidence: 0.9 }],
      scale: { kind: "dimension_callout", realLength: 120, imageLength: 240, mmPerPixel: 0.9 },
      units: { length: "mm" },
      undetermined: [],
    }));
    llm.setResponse("complete", TREE_REPAIRED);

    const pipeline = new CadPipeline({ llm });
    const result = await pipeline.run(IMAGE_PATH, "Plate");

    expect(result.warnings.join(" ")).toMatch(/disagrees with realLength\/imageLength/);
    expect(result.viewSet.scale?.mmPerPixel).toBeCloseTo(0.5);
  });
});

const VIEW_INTAKE_PHOTO_ONE_VIEW = JSON.stringify({
  drawingKind: "photo",
  views: [{ id: "v_photo", kind: "photo", confidence: 0.7 }],
  units: { length: "mm" },
  undetermined: [],
});
