/**
 * Things a model writes that the binding cannot express.
 *
 * Each of these produced a crash or an empty body in a live run, and each was
 * reported as something with no bearing on its cause — `undefined`, "volume 0",
 * "Cannot read properties of undefined (reading 'value')". The emitter now
 * refuses them by name. Refusing is not a limitation being hidden: a silently
 * wrong solid is far worse than a stated gap.
 */

import { describe, expect, it } from "vitest";
import { runBuildFromTree } from "../lib/stages/features.js";
import { mergeConstraintsVerbose } from "../lib/cad/sketch_codegen.js";
import { lintFeatureTree } from "../lib/validators/design_intent.js";
import type { FeatureTree, ProfileEntity } from "../lib/cad/model.js";

const SQUARE: ProfileEntity[] = [
  { tag: "e1", type: "line", start: [-25, -25], end: [25, -25] },
  { tag: "e2", type: "line", start: [25, -25], end: [25, 25] },
  { tag: "e3", type: "line", start: [25, 25], end: [-25, 25] },
  { tag: "e4", type: "line", start: [-25, 25], end: [-25, -25] },
];

function treeWith(features: FeatureTree["features"]): FeatureTree {
  return {
    name: "part",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_block: {
        id: "s_block",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: SQUARE,
        constraints: [
          { kind: "LENGTH", tags: ["e1"], value: 50 },
          { kind: "LENGTH", tags: ["e2"], value: 50 },
        ],
      },
    },
    features,
    parameters: [{ name: "t", expr: "10", unit: "mm" }],
  };
}

describe("a constraint kind the binding does not have", () => {
  it("is dropped rather than emitted as K.undefined", () => {
    // `tp.SketchConstraintKind` has no HORIZONTAL — it is the name every other
    // CAD system uses, so a model reaches for it. `K.HORIZONTAL` is undefined and
    // marshalling that fails with an error whose message is `undefined`.
    const merged = mergeConstraintsVerbose({
      id: "s",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: SQUARE,
      constraints: [
        { kind: "TANGENT" as never, tags: ["e1", "e3"] },
        { kind: "LENGTH", tags: ["e1"], value: 50 },
      ],
    });

    expect(merged.dropped.some((d) => /it has no TANGENT/.test(d.reason))).toBe(true);
    expect(merged.constraints.some((c) => c.kind === "LENGTH")).toBe(true);
    expect(merged.constraints.some((c) => (c.kind as string) === "TANGENT")).toBe(false);
  });

  it("never emits it into the code", () => {
    const tree = treeWith([
      { id: "f", name: "Pad", op: { op: "pad", sketchId: "s_block", distance: "t" } },
    ]);
    tree.sketches.s_block.constraints.push({ kind: "SYMMETRIC" as never, tags: ["e2", "e4"] });

    const built = runBuildFromTree(tree);
    expect(built.code.source).not.toContain("K.SYMMETRIC");
    expect(built.warnings.join(" ")).toMatch(/it has no SYMMETRIC/);
  });
});

describe("a fillet selector written as a description", () => {
  it("is refused by name rather than crashing in the marshaller", () => {
    const tree = treeWith([
      { id: "f", name: "Pad", op: { op: "pad", sketchId: "s_block", distance: "t" } },
      {
        id: "r",
        name: "Fillet",
        op: { op: "fillet", selector: "Edges of mounting block and protector intersection", radius: "2" },
      },
    ]);

    const built = runBuildFromTree(tree);
    expect(built.code.source).not.toContain(".fillet(");
    expect(built.warnings.join(" ")).toMatch(/is a description, not an edge selector/);
  });

  it("still accepts a real selector", () => {
    const tree = treeWith([
      { id: "f", name: "Pad", op: { op: "pad", sketchId: "s_block", distance: "t" } },
      { id: "r", name: "Fillet", op: { op: "fillet", selector: "#XY and not #Z", radius: "2" } },
    ]);

    const built = runBuildFromTree(tree);
    expect(built.warnings.join(" ")).not.toMatch(/is a description/);
  });
});

describe("a through pocket carrying the pad's own profile", () => {
  it("is reported before it silently removes the whole body", () => {
    const tree = treeWith([
      { id: "f", name: "Block", op: { op: "pad", sketchId: "s_block", distance: "t" } },
      { id: "h", name: "Pivot hole", op: { op: "pocket", sketchId: "s_block", through: true } },
    ]);

    const lint = lintFeatureTree(tree);
    const issue = lint.issues.find((i) => i.code === "DIN_REMOVES_WHOLE_BODY");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("error");
    expect(issue!.message).toMatch(/removes all of it/);
    expect(issue!.suggestion).toMatch(/needs its own sketch/);
  });

  it("leaves a pocket with its own sketch alone", () => {
    const tree = treeWith([
      { id: "f", name: "Block", op: { op: "pad", sketchId: "s_block", distance: "t" } },
      { id: "h", name: "Hole", op: { op: "pocket", sketchId: "s_hole", through: true } },
    ]);
    tree.sketches.s_hole = {
      id: "s_hole",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [{ tag: "c", type: "circle", center: [0, 0], radius: 5 }],
      constraints: [],
    };

    expect(lintFeatureTree(tree).issues.some((i) => i.code === "DIN_REMOVES_WHOLE_BODY")).toBe(false);
  });
});

describe("relations the binding has no kind for", () => {
  it("translates HORIZONTAL and VERTICAL into the direction it does have", () => {
    // Every CAD system spells these HORIZONTAL/VERTICAL; this binding does not.
    // "This line is horizontal" IS ORIENTATION [1, 0], which reconciliation
    // already applies to the coordinates — so the intent survives instead of
    // being dropped.
    const merged = mergeConstraintsVerbose({
      id: "s",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: SQUARE,
      constraints: [
        { kind: "HORIZONTAL" as never, tags: ["e1", "e3"] },
        { kind: "VERTICAL" as never, tags: ["e2", "e4"] },
      ],
    });

    const orientations = merged.constraints.filter((c) => c.kind === "ORIENTATION");
    expect(orientations.length).toBe(4);
    expect(orientations.filter((c) => JSON.stringify(c.value) === "[1,0]").length).toBe(2);
    expect(orientations.filter((c) => JSON.stringify(c.value) === "[0,1]").length).toBe(2);
    expect(merged.dropped.length).toBe(0);
  });

  it("does not apply a line relation to an arc", () => {
    const merged = mergeConstraintsVerbose({
      id: "s",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: [{ tag: "a1", type: "arc", center: [0, 0], radius: 5, start: [5, 0], end: [0, 5] }],
      constraints: [{ kind: "HORIZONTAL" as never, tags: ["a1"] }],
    });

    expect(merged.constraints.some((c) => c.kind === "ORIENTATION")).toBe(false);
    expect(merged.dropped[0].reason).toMatch(/applies to lines/);
  });

  it("still refuses what it cannot translate", () => {
    const merged = mergeConstraintsVerbose({
      id: "s",
      plane: { kind: "XY", origin: [0, 0, 0] },
      entities: SQUARE,
      constraints: [{ kind: "SYMMETRIC" as never, tags: ["e1", "e3"] }],
    });

    // The square still gets its four derived joins; what must not appear is the
    // relation the binding cannot name.
    expect(merged.constraints.some((c) => (c.kind as string) === "SYMMETRIC")).toBe(false);
    expect(merged.dropped.some((d) => /it has no SYMMETRIC/.test(d.reason))).toBe(true);
  });
});
