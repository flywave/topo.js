import { describe, expect, it } from "vitest";
import type { ProfileEntity, SketchSpec } from "../lib/cad/model.js";
import { reconcileSketch } from "../lib/cad/reconcile.js";

function sketch(entities: ProfileEntity[], constraints: SketchSpec["constraints"] = []): SketchSpec {
  return { id: "s", plane: { kind: "XY", origin: [0, 0, 0] }, entities, constraints };
}

function rect(w: number, h: number): ProfileEntity[] {
  return [
    { tag: "e1", type: "line", start: [0, 0], end: [w, 0] },
    { tag: "e2", type: "line", start: [w, 0], end: [w, h] },
    { tag: "e3", type: "line", start: [w, h], end: [0, h] },
    { tag: "e4", type: "line", start: [0, h], end: [0, 0] },
  ];
}

const close = (e: ProfileEntity) => `${e.start?.[0]},${e.start?.[1]}`;

describe("sketch reconciliation", () => {
  it("leaves an already-consistent sketch alone", () => {
    const r = reconcileSketch(sketch(rect(100, 60)));
    expect(r.report.closureError).toBeCloseTo(0, 9);
    expect(r.report.structurePreserved).toBe(true);
    // Coordinates are unchanged.
    expect(r.entities.map((e) => e.end)).toEqual(rect(100, 60).map((e) => e.end));
  });

  it("applies a LENGTH dimension to an under-sized edge", () => {
    // Authored 80 wide, dimensioned 100.
    const r = reconcileSketch(
      sketch(rect(80, 50), [{ kind: "LENGTH", tags: ["e1"], value: 100 }]),
    );
    const e1 = r.entities.find((e) => e.tag === "e1")!;
    expect(Math.hypot(e1.end![0] - e1.start![0], e1.end![1] - e1.start![1])).toBeCloseTo(100, 9);
    expect(r.report.applied.some((a) => a.includes("LENGTH(e1"))).toBe(true);
  });

  it("applies ORIENTATION, rotating the edge about its start", () => {
    const r = reconcileSketch(
      sketch(rect(80, 50), [{ kind: "ORIENTATION", tags: ["e1"], value: [0, 1] }]),
    );
    const e1 = r.entities.find((e) => e.tag === "e1")!;
    expect(e1.start).toEqual([0, 0]);
    expect(e1.end![0]).toBeCloseTo(0, 9);
    expect(e1.end![1]).toBeCloseTo(80, 9);
  });

  it("makes the dimensions drive the whole outline", () => {
    // Authored 80x50, dimensioned 100x60 on every edge.
    const r = reconcileSketch(
      sketch(rect(80, 50), [
        { kind: "LENGTH", tags: ["e1"], value: 100 },
        { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
        { kind: "LENGTH", tags: ["e2"], value: 60 },
        { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
        { kind: "LENGTH", tags: ["e3"], value: 100 },
        { kind: "ORIENTATION", tags: ["e3"], value: [-1, 0] },
        { kind: "LENGTH", tags: ["e4"], value: 60 },
        { kind: "ORIENTATION", tags: ["e4"], value: [0, -1] },
      ]),
    );

    const ends = r.entities.map((e) => e.end);
    expect(ends[0]).toEqual([100, 0]);
    expect(ends[1]).toEqual([100, 60]);
    expect(ends[2]).toEqual([0, 60]);
    expect(ends[3]).toEqual([0, 0]);
    expect(r.report.closureError).toBeCloseTo(0, 9);
  });

  it("snaps the last undimensioned line so the loop closes", () => {
    // Only the first two edges are dimensioned, so the loop cannot close from
    // the dimensions alone; the closing edge has to give.
    const r = reconcileSketch(
      sketch(rect(80, 50), [
        { kind: "LENGTH", tags: ["e1"], value: 100 },
        { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
        { kind: "LENGTH", tags: ["e2"], value: 60 },
        { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
      ]),
    );
    expect(r.report.closureError).toBeCloseTo(0, 9);
    // A geometry repair, not a dimension being honoured — reported separately so
    // a reader sees the walk guessing.
    expect(r.report.repaired.some((a) => a.includes("closing snap"))).toBe(true);
  });

  it("does not snap an edge that was dimensioned", () => {
    const r = reconcileSketch(
      sketch(rect(80, 50), [
        { kind: "LENGTH", tags: ["e1"], value: 100 },
        { kind: "LENGTH", tags: ["e2"], value: 60 },
        { kind: "LENGTH", tags: ["e3"], value: 80 },
        { kind: "LENGTH", tags: ["e4"], value: 50 },
      ]),
    );
    // Every edge is pinned, so nothing may be bent to close the loop, and the
    // honest answer is a reported gap.
    expect(r.report.applied.some((a) => a.includes("closing snap"))).toBe(false);
    expect(r.report.closureError).toBeGreaterThan(1e-6);
  });

  it("applies RADIUS to an arc and re-anchors it", () => {
    const r = reconcileSketch(
      sketch(
        [
          { tag: "l1", type: "line", start: [0, 0], end: [100, 0] },
          { tag: "a1", type: "arc", center: [100, 10], radius: 10, start: [100, 0], end: [100, 20], clockwise: false },
          { tag: "l2", type: "line", start: [100, 20], end: [0, 20] },
          { tag: "l3", type: "line", start: [0, 20], end: [0, 0] },
        ],
        [{ kind: "RADIUS", tags: ["a1"], value: 25 }],
      ),
    );
    const a1 = r.entities.find((e) => e.tag === "a1")!;
    expect(a1.radius).toBe(25);
    // Its entry point still meets the previous edge's exit.
    expect(a1.start).toEqual([100, 0]);
  });

  it("reports a contradictory pair of LENGTH dimensions", () => {
    const r = reconcileSketch(
      sketch(rect(100, 60), [
        { kind: "LENGTH", tags: ["e1"], value: 100 },
        { kind: "LENGTH", tags: ["e1"], value: 120 },
      ]),
    );
    expect(r.report.unhonoured.some((u) => u.reason.includes("conflicts"))).toBe(true);
  });

  it("reports a constraint it has no constructive reading for", () => {
    const r = reconcileSketch(
      sketch(rect(100, 60), [{ kind: "FIXED_POINT", tags: ["e1"], value: [1, 2] }]),
    );
    expect(r.report.unhonoured.some((u) => u.constraint.includes("FIXED_POINT"))).toBe(true);
  });

  it("honours an explicit anchor", () => {
    const r = reconcileSketch(sketch(rect(100, 60)), { anchor: [10, 20] });
    expect(r.entities.find((e) => e.tag === "e1")!.start).toEqual([10, 20]);
    // The loop closes back onto the anchor.
    expect(r.entities.find((e) => e.tag === "e4")!.end).toEqual([10, 20]);
    expect(r.report.closureError).toBeCloseTo(0, 9);
  });

  it("keeps every tag, in chain order", () => {
    const r = reconcileSketch(sketch(rect(100, 60)));
    expect(r.entities.map((e) => e.tag)).toEqual(["e1", "e2", "e3", "e4"]);
  });

  it("reports rather than guesses when the entities do not chain", () => {
    const r = reconcileSketch(
      sketch([
        { tag: "e1", type: "line", start: [0, 0], end: [10, 0] },
        { tag: "e2", type: "line", start: [50, 50], end: [60, 60] },
      ]),
    );
    expect(Number.isFinite(r.report.closureError)).toBe(false);
    expect(r.report.unhonoured.length).toBeGreaterThan(0);
  });

  it("produces a closed loop even when it has to traverse an edge backwards", () => {
    // e2 is authored in the opposite direction to the chain.
    const r = reconcileSketch(
      sketch([
        { tag: "e1", type: "line", start: [0, 0], end: [100, 0] },
        { tag: "e2", type: "line", start: [0, 60], end: [100, 60] },
        { tag: "e3", type: "line", start: [100, 60], end: [100, 0] },
        { tag: "e4", type: "line", start: [0, 0], end: [0, 60] },
      ]),
    );
    expect(r.report.structurePreserved).toBe(true);
    expect(close(r.entities[0])).toBe("0,0");
  });
});

// ---------------------------------------------------------------------------

describe("reconciliation reproduces the traced geometry", () => {
  /**
   * A rectangle walked counter-clockwise, dimensioned as if each edge points the
   * positive way along its axis — which is how a model writes "horizontal" and
   * "vertical" for a loop it drew the other way round.
   */
  function ccwRect(w: number, h: number): SketchSpec {
    return sketch(
      [
        { tag: "e1", type: "line", start: [0, 0], end: [0, h] },
        { tag: "e2", type: "line", start: [0, h], end: [w, h] },
        { tag: "e3", type: "line", start: [w, h], end: [w, 0] },
        { tag: "e4", type: "line", start: [w, 0], end: [0, 0] },
      ],
      [
        { kind: "ORIENTATION", tags: ["e1"], value: [0, 1] },
        { kind: "ORIENTATION", tags: ["e2"], value: [1, 0] },
        { kind: "ORIENTATION", tags: ["e3"], value: [0, 1] },
        { kind: "ORIENTATION", tags: ["e4"], value: [1, 0] },
      ],
    );
  }

  it("keeps the traced shape when a declared direction names the opposite way", () => {
    // A direction is an AXIS, not a sense: e1 runs down for this loop, and its
    // declared [0,1] must not turn it around. Taking it as a sense flipped six
    // edges of a real traced outline and inflated the loop by 69% — 210 x 253 for
    // a trace 125 x 150 — with every dimension and every gate agreeing it was fine.
    const result = reconcileSketch(ccwRect(40, 30));

    expect(result.report.closureError).toBeLessThan(1e-6);
    const xs = result.entities.flatMap((e) => [e.start![0], e.end![0]]);
    const ys = result.entities.flatMap((e) => [e.start![1], e.end![1]]);
    // The shape is the traced one, up to where the walk anchored it.
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(40, 6);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(30, 6);
  });

  it("leaves every entity the same shape it was given", () => {
    // Rigidity is the property that makes the emitted geometry the traced one.
    const result = reconcileSketch(ccwRect(40, 30));
    const authored = ccwRect(40, 30).entities;
    for (const e of result.entities) {
      const a = authored.find((x) => x.tag === e.tag)!;
      expect(Math.hypot(e.end![0] - e.start![0], e.end![1] - e.start![1])).toBeCloseTo(
        Math.hypot(a.end![0] - a.start![0], a.end![1] - a.start![1]),
        6,
      );
    }
  });

  it("makes an arc pass through the endpoints it was given", () => {
    // A traced arc arrives as a centre, a radius and two endpoints that need not
    // agree — 12 of 15 on a real outline had their endpoints 10-67% off their own
    // circle. The endpoints are the data that chains, so they are what is kept.
    const result = reconcileSketch(
      sketch([{ tag: "a1", type: "arc", center: [0, 0], radius: 10, start: [10, 0], end: [0, 6] }]),
    );

    const arc = result.entities[0];
    const { center, radius } = arc;
    expect(Math.hypot(arc.start![0] - center![0], arc.start![1] - center![1])).toBeCloseTo(radius!, 6);
    expect(Math.hypot(arc.end![0] - center![0], arc.end![1] - center![1])).toBeCloseTo(radius!, 6);
    // ...and the radius it was given is the one it keeps, so the parameter that
    // drives it still drives something.
    expect(radius).toBe(10);
    expect(result.report.repaired.join(" ")).toMatch(/arc a1/);
  });
});
