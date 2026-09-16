/**
 * Fitting a traced profile's size to the dimensions the drawing states.
 *
 * The tracer returns coordinates in units of its own choosing. Measured on a real
 * annotated drawing: the profile came back 210 x 186 units for a part the sheet
 * dimensions as 150 tall, and the dimension that said so was DROPPED rather than
 * applied — so the parameter drove nothing and the model was 25% oversized with
 * every gate silent about why.
 *
 * These are about the fit being narrow. It must fire on the dimension that spans
 * the part and ignore the ones that do not, because treating a hole diameter as
 * evidence about the part's size would rescale the whole model to match a feature.
 */

import { describe, expect, it } from "vitest";
import { fitTreeScale, scaleSketch } from "../lib/cad/scale_fit.js";
import type { SketchSpec } from "../lib/cad/model.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A rectangle drawn `width` x `height`, with two dimensions on it.
 *
 * The two edges named by `overallHeight` are the top and bottom, 187.957 apart in
 * the real run; here they are `height`. The real numbers are used where they fit
 * so the case stays recognisable.
 */
function plateSketch(opts: {
  id?: string;
  width: number;
  height: number;
  widthDim?: number;
  heightDim?: number;
}): SketchSpec {
  const { id = "s", width, height } = opts;
  return {
    id,
    plane: { kind: "XY", origin: [0, 0, 0] },
    entities: [
      { tag: "e1", type: "line", start: [0, height], end: [width, height] },
      { tag: "e2", type: "line", start: [width, height], end: [width, 0] },
      { tag: "e3", type: "line", start: [width, 0], end: [0, 0] },
      { tag: "e4", type: "line", start: [0, 0], end: [0, height] },
    ],
    constraints: [
      ...(opts.heightDim !== undefined
        ? [{ kind: "DISTANCE" as const, tags: ["e1", "e3"] as [string, string], value: opts.heightDim }]
        : []),
      ...(opts.widthDim !== undefined
        ? [{ kind: "DISTANCE" as const, tags: ["e2", "e4"] as [string, string], value: opts.widthDim }]
        : []),
    ],
  };
}

// ---------------------------------------------------------------------------

describe("fitting the traced size to the drawing's dimensions", () => {
  it("scales the traced profile to the dimension that spans it", () => {
    // The real case: traced 210 x 187.957, the sheet dimensions the overall
    // height as 150.
    const fit = fitTreeScale([plateSketch({ width: 210, height: 187.957, heightDim: 150 })]);

    expect(fit.scale).toBeCloseTo(150 / 187.957, 6);
    expect(fit.notes.join(" ")).toMatch(/scaled the whole model by 0.798/);
    expect(fit.notes.join(" ")).toMatch(/e1\+e3 asks 150/);
  });

  it("leaves a profile alone when the dimension already agrees", () => {
    const fit = fitTreeScale([plateSketch({ width: 100, height: 60, heightDim: 60 })]);

    expect(fit.scale).toBe(1);
    expect(fit.notes).toEqual([]);
  });

  it("ignores a dimension that measures a feature rather than the part", () => {
    // A Ø12 hole in a 120-wide plate: the span between the hole's "edges" is not
    // the part's extent, and rescaling the part to 12 would be a catastrophe.
    const sketch = plateSketch({ width: 120, height: 60 });
    sketch.entities.push({ tag: "c1", type: "circle", center: [60, 30], radius: 6 });
    sketch.constraints.push({ kind: "DISTANCE", tags: ["c1", "e4"], value: 12 });

    const fit = fitTreeScale([sketch]);
    expect(fit.scale).toBe(1);
  });

  it("refuses a pair whose requested value is a different quantity", () => {
    // Two edges 60 apart dimensioned 120: a ratio of 2 is a different measurement,
    // not a mis-scaled one. Rescaling the part to 2x would be worse than nothing.
    const fit = fitTreeScale([plateSketch({ width: 120, height: 60, heightDim: 120 })]);
    expect(fit.scale).toBe(1);
  });

  it("refuses when the stated dimensions disagree about the shape", () => {
    // Height implies 0.95, width implies 0.72 — both are plausible size errors,
    // and they describe different shapes, so no single scale fits either.
    const fit = fitTreeScale([
      plateSketch({ width: 200, height: 187.957, heightDim: 178.5, widthDim: 144 }),
    ]);

    expect(fit.scale).toBe(1);
    expect(fit.notes.join(" ")).toMatch(/disagree about the part's proportions/);
    expect(fit.notes.join(" ")).toMatch(/traced size was kept/);
  });

  it("reads a dimension written as an expression over the parameters", () => {
    // The live case: the constraint names `overallHeight`, not 150.
    const sketch = plateSketch({ width: 210, height: 187.957 });
    sketch.constraints.push({ kind: "DISTANCE", tags: ["e1", "e3"], value: "overallHeight" });

    const fit = fitTreeScale([sketch], { overallHeight: 150 });
    expect(fit.scale).toBeCloseTo(150 / 187.957, 6);
  });

  it("takes one scale from every sketch, not one per sketch", () => {
    // A part is one set of coordinates across several sketches: an outline and the
    // pockets in it. Scaling only the outline was measured to leave the pockets
    // outside the body and crash the kernel's cut outright.
    const outline = plateSketch({ id: "s_outline", width: 210, height: 187.957, heightDim: 150 });
    const pocket = plateSketch({ id: "s_pocket", width: 40, height: 30 });

    const fit = fitTreeScale([outline, pocket]);

    expect(fit.scale).toBeCloseTo(150 / 187.957, 6);
    expect(fit.notes.join(" ")).toMatch(/s_outline/);
    // The pocket has no overall dimension of its own, so it contributes none.
    expect(fit.notes.join(" ")).not.toMatch(/s_pocket/);
  });

  it("has nothing to say about a sketch with no dimensions at all", () => {
    const fit = fitTreeScale([plateSketch({ width: 100, height: 60 })]);
    expect(fit.scale).toBe(1);
  });
});

describe("scaling a sketch", () => {
  it("scales coordinates and radii about the sketch's own corner", () => {
    const sketch = plateSketch({ width: 100, height: 60 });
    const scaled = scaleSketch(sketch, 0.5);

    const e1 = scaled.entities[0];
    expect(e1.start).toEqual([0, 30]);
    expect(e1.end).toEqual([50, 30]);
    // The corner is the anchor, so the sketch stays in positive coordinates.
    expect(scaled.entities[2].end).toEqual([0, 0]);

    const withCircle: SketchSpec = {
      ...sketch,
      entities: [{ tag: "c1", type: "circle", center: [10, 20], radius: 4 }],
    };
    // The circle is the whole sketch, so its own corner is the anchor: the centre
    // moves out by one radius and the radius doubles.
    const scaledCircle = scaleSketch(withCircle, 2).entities[0];
    expect(scaledCircle.radius).toBe(8);
    expect(scaledCircle.center).toEqual([14, 24]);
  });

  it("is the identity at a scale of 1", () => {
    const sketch = plateSketch({ width: 100, height: 60 });
    expect(scaleSketch(sketch, 1)).toBe(sketch);
  });
});
