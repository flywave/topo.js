import { describe, expect, it } from "vitest";
import {
  checkClosure,
  inferRelations,
  validateProfile,
} from "../lib/cad/profile.js";
import type { Profile2D, ProfileEntity } from "../lib/cad/model.js";

function rect(tags = ["e1", "e2", "e3", "e4"]): ProfileEntity[] {
  return [
    { tag: tags[0], type: "line", start: [0, 0], end: [10, 0] },
    { tag: tags[1], type: "line", start: [10, 0], end: [10, 5] },
    { tag: tags[2], type: "line", start: [10, 5], end: [0, 5] },
    { tag: tags[3], type: "line", start: [0, 5], end: [0, 0] },
  ];
}

describe("profile closure", () => {
  it("accepts a closed rectangle", () => {
    const r = checkClosure(rect());
    expect(r.closed).toBe(true);
    expect(r.closedLoops).toBe(1);
    expect(r.openEnds).toEqual([]);
  });

  it("reports dangling ends on an open profile", () => {
    const open = rect().slice(0, 3);
    const r = checkClosure(open);
    expect(r.closed).toBe(false);
    expect(r.openEnds.length).toBe(2);
  });

  it("treats a circle as closed by construction", () => {
    const r = checkClosure([{ tag: "c1", type: "circle", center: [0, 0], radius: 5 }]);
    expect(r.closed).toBe(true);
    expect(r.loops).toEqual([["c1"]]);
  });

  it("chains entities given in shuffled order", () => {
    const shuffled = [rect()[2], rect()[0], rect()[3], rect()[1]];
    const r = checkClosure(shuffled);
    expect(r.closed).toBe(true);
  });
});

describe("relation inference", () => {
  it("finds horizontals and verticals", () => {
    const rels = inferRelations(rect());
    const kinds = rels.map((r) => r.kind);
    expect(kinds.filter((k) => k === "horizontal").length).toBe(2);
    expect(kinds.filter((k) => k === "vertical").length).toBe(2);
  });

  it("finds parallelism and perpendicularity", () => {
    const rels = inferRelations(rect());
    expect(rels.some((r) => r.kind === "parallel")).toBe(true);
    expect(rels.some((r) => r.kind === "perpendicular")).toBe(true);
  });

  it("finds concentric arcs", () => {
    const rels = inferRelations([
      { tag: "a1", type: "arc", center: [0, 0], radius: 5, start: [5, 0], end: [0, 5] },
      { tag: "a2", type: "arc", center: [0, 0], radius: 8, start: [8, 0], end: [0, 8] },
    ]);
    expect(rels.some((r) => r.kind === "concentric")).toBe(true);
  });

  it("notices a line tangent to an arc", () => {
    // Line y = 5 is tangent to a circle of radius 5 at origin.
    const rels = inferRelations([
      { tag: "a1", type: "arc", center: [0, 0], radius: 5, start: [5, 0], end: [0, 5] },
      { tag: "e1", type: "line", start: [0, 5], end: [10, 5] },
    ]);
    expect(rels.some((r) => r.kind === "tangent")).toBe(true);
  });

  it("does not invent relations between skew lines", () => {
    const rels = inferRelations([
      { tag: "e1", type: "line", start: [0, 0], end: [10, 0] },
      { tag: "e2", type: "line", start: [0, 5], end: [7, 12] },
    ]);
    expect(rels.some((r) => r.kind === "parallel" || r.kind === "perpendicular")).toBe(false);
  });
});

describe("profile validation", () => {
  const base = (over: Partial<Profile2D> = {}): Profile2D => ({
    viewId: "v_front",
    entities: rect(),
    loops: [],
    relations: [],
    dimensions: [],
    ...over,
  });

  it("passes a closed dimensioned profile", () => {
    const p = base({
      dimensions: [{ name: "width", kind: "length", value: 10, tags: ["e1"] }],
    });
    const r = validateProfile(p);
    expect(r.ok).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it("flags an open profile — it could not be extruded", () => {
    const r = validateProfile(base({ entities: rect().slice(0, 3) }));
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/does not close/);
  });

  it("flags a degenerate line", () => {
    const r = validateProfile(
      base({
        entities: [
          { tag: "e1", type: "line", start: [3, 3], end: [3, 3] },
        ],
      }),
    );
    expect(r.errors.join(" ")).toMatch(/degenerate/);
  });

  it("flags a non-positive radius", () => {
    const r = validateProfile(
      base({ entities: [{ tag: "c1", type: "circle", center: [0, 0], radius: 0 }] }),
    );
    expect(r.errors.join(" ")).toMatch(/non-positive radius/);
  });

  it("flags a dimension referencing an unknown tag", () => {
    const r = validateProfile(
      base({ dimensions: [{ name: "d", kind: "length", value: 5, tags: ["nope"] }] }),
    );
    expect(r.errors.join(" ")).toMatch(/unknown tag/);
  });

  it("warns that uninferable relations degrade to dimensions", () => {
    const r = validateProfile(
      base({
        entities: [
          ...rect(),
          { tag: "a1", type: "arc", center: [5, 0], radius: 2, start: [7, 0], end: [5, 2], construction: true },
        ],
        relations: [{ kind: "equal_length", tags: ["e1", "e3"] }],
      }),
    );
    expect(r.unsupportedRelationCount).toBe(1);
    expect(r.warnings.join(" ")).toMatch(/no solver constraint/);
  });
});
