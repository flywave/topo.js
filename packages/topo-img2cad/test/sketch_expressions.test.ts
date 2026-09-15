/**
 * A parametric sketch, from a model that writes one.
 *
 * These come from a real run: asked to design a mounting plate, the model wrote
 * edges running to `overallWidth`, a hole at `[holeOffsetX, holeOffsetY]` with
 * radius `[holeDiameter, 2]`, and patterns spelled `featureId` / `instances` /
 * `direction` / `distance`. That is the vocabulary of CAD and it is right; the
 * pipeline has to meet it rather than crash on it.
 */

import { describe, expect, it } from "vitest";
import { resolveSketchValues } from "../lib/cad/resolve_sketch.js";
import { coerceFeatureTree } from "../lib/stages/features.js";
import { parseJsonResponse } from "../lib/prompts/feature_tree.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import type { FeatureTree } from "../lib/cad/model.js";

const PARAMS = { overallWidth: 120, overallHeight: 80, holeDiameter: 12, holeOffsetX: 20 };

function treeWith(sketch: Record<string, unknown>): FeatureTree {
  return {
    name: "t",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: { s: sketch as never },
    features: [],
    parameters: [],
  };
}

describe("expressions inside sketch geometry", () => {
  it("evaluates a coordinate that names a parameter", () => {
    const { tree, issues } = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [0, 0], end: ["overallWidth", 0] },
          { tag: "e2", type: "line", start: ["overallWidth", 0], end: ["overallWidth", "overallHeight"] },
        ],
      }),
      PARAMS,
    );

    expect(issues).toEqual([]);
    expect(tree.sketches.s.entities[0].end).toEqual([120, 0]);
    expect(tree.sketches.s.entities[1].end).toEqual([120, 80]);
  });

  it("evaluates arithmetic the model wrote out", () => {
    const { tree } = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [{ tag: "c", type: "circle", center: ["overallWidth / 2", "overallHeight / 2"], radius: "holeDiameter / 2" }],
      }),
      PARAMS,
    );
    expect(tree.sketches.s.entities[0].center).toEqual([60, 40]);
    expect(tree.sketches.s.entities[0].radius).toBe(6);
  });

  it("evaluates a constraint value", () => {
    const { tree } = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [{ tag: "e1", type: "line", start: [0, 0], end: [1, 0] }],
        constraints: [
          { kind: "LENGTH", tags: ["e1"], value: "overallWidth" },
          { kind: "DISTANCE", tags: ["e1", "e1"], value: [0, 1, "holeDiameter"] },
        ],
      }),
      PARAMS,
    );
    expect(tree.sketches.s.constraints[0].value).toBe(120);
    expect(tree.sketches.s.constraints[1].value).toEqual([0, 1, 12]);
  });

  it("names the exact field when a value cannot be resolved", () => {
    const { issues } = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [0, 0], end: ["noSuchParam", 0] },
          { tag: "e2", type: "line", start: [0, 0], end: [1, 1] },
        ],
      }),
      PARAMS,
    );
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain("sketch s");
    expect(issues[0]).toContain("entity e1");
    expect(issues[0]).toContain("end");
    expect(issues[0]).toContain("noSuchParam");
  });

  it("explains a radius written as an array instead of a division", () => {
    const { issues } = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [{ tag: "c1", type: "circle", center: [0, 0], radius: ["holeDiameter", 2] as never }],
      }),
      PARAMS,
    );
    // Seen verbatim from a model: [holeDiameter, 2] meaning "half of it".
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain("holeDiameter / 2");
  });

  it("leaves the tree it was given alone", () => {
    const original = treeWith({
      id: "s",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [{ tag: "e1", type: "line", start: [0, 0], end: ["overallWidth", 0] }],
    });
    resolveSketchValues(original, PARAMS);
    expect(original.sketches.s.entities[0].end).toEqual(["overallWidth", 0]);
  });
});

/**
 * The failure these come from: a model sketched a front view on XZ and wrote its
 * points in world coordinates. Read as 2D, `[x, 0, z]` becomes `[x, 0]` — every
 * point on one line — so a 120x80 rectangle "did not close" and the run produced
 * no body at all.
 */
describe("a 3D point written for a 2D sketch frame", () => {
  const front = (entities: unknown[]) =>
    resolveSketchValues(
      treeWith({ id: "s", plane: { kind: "XZ", origin: [0, 0, 0] }, entities }),
      PARAMS,
    );

  it("reads the two axes the view's plane is measured in", () => {
    const { tree, issues } = front([
      { tag: "e1", type: "line", start: [-60, 0, -40], end: [60, 0, -40] },
      { tag: "e2", type: "line", start: [60, 0, -40], end: [60, 0, 40] },
    ]);
    expect(issues).toEqual([]);
    expect(tree.sketches.s.entities[0].start).toEqual([-60, -40]);
    expect(tree.sketches.s.entities[0].end).toEqual([60, -40]);
    expect(tree.sketches.s.entities[1].end).toEqual([60, 40]);
  });

  it("uses (y, z) for a YZ sketch and (x, y) for XY", () => {
    const yz = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "YZ", origin: [0, 0, 0] },
        entities: [{ tag: "l", type: "line", start: [0, 10, 20], end: [0, 30, 40] }],
      }),
      PARAMS,
    );
    expect(yz.tree.sketches.s.entities[0].start).toEqual([10, 20]);

    const xy = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [{ tag: "l", type: "line", start: [10, 20, 0], end: [30, 40, 0] }],
      }),
      PARAMS,
    );
    expect(xy.tree.sketches.s.entities[0].start).toEqual([10, 20]);
  });

  it("refuses a 3D point on a plane it cannot project", () => {
    const { issues } = resolveSketchValues(
      treeWith({
        id: "s",
        plane: { kind: "custom", origin: [0, 0, 0] },
        entities: [{ tag: "l", type: "line", start: [1, 2, 3], end: [4, 5, 6] }],
      }),
      PARAMS,
    );
    expect(issues.join(" ")).toMatch(/not a pair of coordinates/);
  });

  it("still rejects a point that is neither 2D nor 3D", () => {
    const { issues } = front([{ tag: "l", type: "line", start: [1, 2, 3, 4], end: [0, 0, 0] }]);
    expect(issues.join(" ")).toMatch(/not a pair of coordinates/);
  });
});

describe("the emitter refuses a bad value by name", () => {
  it("never reports 'toFixed is not a function'", () => {
    const tree = treeWith({
      id: "s",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [{ tag: "c1", type: "circle", center: [0, 0], radius: ["holeDiameter", 2] as never }],
    });
    tree.features = [{ id: "f", name: "Pad", op: { op: "pad", sketchId: "s", distance: "t" } }];
    tree.parameters = [{ name: "t", expr: "10", unit: "mm" }];

    const built = runBuildFromTree(tree);
    const text = [...built.errors, ...built.warnings].join("\n");
    expect(text).not.toMatch(/toFixed is not a function/);
    expect(text).toMatch(/holeDiameter \/ 2/);
  });
});

describe("pattern field names a model reaches for", () => {
  it("accepts featureId / instances / direction / distance", () => {
    const tree = coerceFeatureTree({
      name: "t",
      sketches: {},
      features: [
        {
          id: "f_hole",
          name: "Hole",
          op: { op: "pocket", sketchId: "s_hole", through: true },
        },
        {
          id: "f_pattern",
          name: "Hole pattern",
          op: {
            op: "pattern_linear",
            featureId: "f_hole",
            direction: [1, 0, 0],
            instances: 2,
            distance: "overallWidth - 2*holeOffsetX",
          },
        },
      ],
    });

    const op = tree.features[1].op as unknown as Record<string, unknown>;
    expect(op.ofFeature).toBe("f_hole");
    expect(op.count).toBe(2);
    // A unit direction times a spacing expression, one component at a time.
    expect(op.dx).toBe("overallWidth - 2*holeOffsetX");
    expect(op.dy).toBe("0");
    expect(op.dz).toBe("0");
  });

  it("resolves a numeric spacing into components", () => {
    const tree = coerceFeatureTree({
      name: "t",
      sketches: {},
      features: [
        { id: "a", name: "A", op: { op: "pad", sketchId: "s", distance: "1" } },
        {
          id: "b",
          name: "B",
          op: { op: "pattern_linear", featureId: "a", direction: [0, 1, 0], instances: 3, distance: 25 },
        },
      ],
    });
    const op = tree.features[1].op as unknown as Record<string, unknown>;
    expect(op.dx).toBe(0);
    expect(op.dy).toBe(25);
    expect(op.count).toBe(3);
  });

  it("leaves an already-correct op untouched", () => {
    const tree = coerceFeatureTree({
      name: "t",
      sketches: {},
      features: [
        { id: "a", name: "A", op: { op: "pad", sketchId: "s", distance: "1" } },
        { id: "b", name: "B", op: { op: "pattern_linear", ofFeature: "a", count: 4, dx: "10", dy: "0" } },
      ],
    });
    const op = tree.features[1].op as unknown as Record<string, unknown>;
    expect(op.ofFeature).toBe("a");
    expect(op.count).toBe(4);
    expect(op.dx).toBe("10");
  });
});

/**
 * Model responses that are JSON-ish rather than JSON.
 *
 * Each case here cost a live run or would have: the responder is asked for strict
 * JSON, mostly complies, and the failures are routine and dreary. Rejecting the
 * whole response over one costs a model call, and in the last case cost the run —
 * the pipeline threw out of `run()` and produced nothing at all, from a response
 * that was otherwise perfectly good.
 */
describe("reading a model's JSON", () => {
  const parse = (raw: string) => parseJsonResponse(raw, "test");

  it("unwraps a markdown fence", () => {
    expect(parse('```json\n{"a": 1}\n```')).toEqual({ a: 1 });
  });

  it("drops a line comment", () => {
    expect(parse('{ "a": 1, // the width\n "b": 2 }')).toEqual({ a: 1, b: 2 });
  });

  it("drops a trailing comma", () => {
    expect(parse('{ "a": 1, "b": [1, 2,], }')).toEqual({ a: 1, b: [1, 2] });
  });

  it("drops a member written without a key", () => {
    // Verbatim from a run that died here: a bare description sitting where
    // `"key": value` belongs. Nothing in the schema can consume it.
    const raw = `{
      "parameters": [
        { "name": "clampWidth", "expr": "100", "unit": "mm",
          "width of clamp body from drawing view v_front_b" },
        { "name": "verticalSideHeight", "expr": "40", "unit": "mm" }
      ]
    }`;
    expect(parse(raw)).toEqual({
      parameters: [
        { name: "clampWidth", expr: "100", unit: "mm" },
        { name: "verticalSideHeight", expr: "40", unit: "mm" },
      ],
    });
  });

  it("keeps bare strings that are array elements, where they are legal", () => {
    // The same shape is valid inside an array, and dropping those would throw
    // away real content.
    expect(parse('{ "notes": ["first", "second"] }')).toEqual({ notes: ["first", "second"] });
  });

  it("still refuses text that is not an object", () => {
    expect(() => parse("no json here")).toThrow(/No JSON object found/);
  });
});
