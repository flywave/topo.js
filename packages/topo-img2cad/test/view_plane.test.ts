/**
 * The plane a view's profile belongs on.
 *
 * A profile is read in its view's own 2D frame, so the sketch built from it has to
 * sit on the plane that frame is measured in. Get this wrong and the model is
 * correct in every measurement and still the wrong part — a front view's 120x80
 * outline becomes a 120x10 sliver when it is extruded off the XY plane, and the
 * only thing that notices is the silhouette gate at the very end.
 */

import { describe, expect, it } from "vitest";
import { sketchPlaneForView, viewBasis, planeTo3D } from "../lib/index.js";
import {
  buildFeatureTreePrompt,
  buildProfileExtractionPrompt,
  buildViewIntakePrompt,
} from "../lib/prompts/feature_tree.js";

describe("view to sketch plane", () => {
  it("maps each orthographic view to the plane its frame is measured in", () => {
    expect(sketchPlaneForView("front")).toBe("XZ");
    expect(sketchPlaneForView("back")).toBe("XZ");
    expect(sketchPlaneForView("top")).toBe("XY");
    expect(sketchPlaneForView("bottom")).toBe("XY");
    expect(sketchPlaneForView("right")).toBe("YZ");
    expect(sketchPlaneForView("left")).toBe("YZ");
    expect(sketchPlaneForView("iso")).toBeNull();
    expect(sketchPlaneForView("photo")).toBeNull();
  });

  it("agrees with the projection basis rather than asserting it", () => {
    // The claim is that screen-y of a front view is world Z, which is what makes
    // XZ the right plane. Check it against the basis the projection actually uses
    // instead of trusting the table.
    const cases: Array<[string, "XY" | "XZ" | "YZ"]> = [
      ["front", "XZ"],
      ["top", "XY"],
      ["right", "YZ"],
      ["left", "YZ"],
      ["back", "XZ"],
      ["bottom", "XY"],
    ];

    for (const [kind, plane] of cases) {
      const basis = viewBasis(kind);
      // Screen axes in model space.
      const xAxis = basis.xAxis;
      const yAxis = basis.yAxis;

      // The plane a point lands on, from its 2D frame coordinates.
      const alongU = planeTo3D({ kind: plane, origin: [0, 0, 0] }, 1, 0);
      const alongV = planeTo3D({ kind: plane, origin: [0, 0, 0] }, 0, 1);

      expect(sketchPlaneForView(kind)).toBe(plane);
      // The sketch's u axis must be parallel to the view's screen-x, and its v
      // axis parallel to screen-y (up to sign, which mirrors the drawing).
      expect(isParallel(alongU, xAxis)).toBe(true);
      expect(isParallel(alongV, yAxis)).toBe(true);
    }
  });

  it("tells the model which plane to use, for the views it actually has", () => {
    const prompt = buildFeatureTreePrompt({
      objectName: "Mounting plate",
      views: {
        drawingKind: "engineering_drawing",
        views: [{ id: "v_front", kind: "front" }, { id: "v_top", kind: "top" }],
        units: { length: "mm", toMillimeter: 1 },
        undetermined: [],
      },
    });

    expect(prompt).toContain("SKETCH PLANE");
    expect(prompt).toContain("v_front (front view) \u2192 sketch on the XZ plane");
    expect(prompt).toContain("v_top (top view) \u2192 sketch on the XY plane");
    // The example tree alone anchors a model on XY; this is the counterweight.
    expect(prompt).toContain("Do not default to XY.");
  });

  it("prefers the plane the drawing recorded over the view's label", () => {
    // A live run's exact shape: the model called it a front view but recorded
    // projectionPlane XY and built on XY. Guidance derived from the label would
    // tell it to move to XZ, contradicting what it read — and what L4 projects.
    const prompt = buildFeatureTreePrompt({
      objectName: "Mounting plate",
      views: {
        drawingKind: "engineering_drawing",
        views: [{ id: "v_front", kind: "front", projectionPlane: "XY" }],
        units: { length: "mm", toMillimeter: 1 },
        undetermined: [],
      },
    });

    expect(prompt).toContain("v_front (front view) \u2192 sketch on the XY plane");
    expect(prompt).not.toContain("sketch on the XZ plane");
  });

  it("adds no plane guidance when there is no orthographic view", () => {
    const prompt = buildFeatureTreePrompt({
      objectName: "Bracket",
      views: { drawingKind: "photo", views: [{ id: "v_photo", kind: "photo" }], undetermined: [] },
    });
    expect(prompt).not.toContain("SKETCH PLANE");
  });
});

function isParallel(a: number[], b: number[]): boolean {
  const cross = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return cross.every((c) => Math.abs(c) < 1e-9);
}

/**
 * The industry hint steers vocabulary and construction order. It must never be
 * read as evidence — a hint that can supply sizes is a hint that invents them,
 * which is the failure the whole pipeline is built to avoid.
 */
describe("industry context", () => {
  const HINT = "铁路接触网整体吊弦: 承力索 / 卡子 / 心形护体 / 压管 / 吊弦绞线 / 接触线";

  it("reaches all three prompts, fenced off from the drawing", () => {
    const views = {
      drawingKind: "engineering_drawing",
      views: [{ id: "v_front", kind: "front", projectionPlane: "XY" }],
      units: { length: "mm", toMillimeter: 1 },
      undetermined: [],
    };

    const intake = buildViewIntakePrompt({ objectName: "dropper", industry: HINT });
    const profile = buildProfileExtractionPrompt({ id: "v_front", kind: "front" }, {}, HINT);
    const tree = buildFeatureTreePrompt({ objectName: "dropper", views, industry: HINT });

    for (const prompt of [intake, profile, tree]) {
      expect(prompt).toContain("INDUSTRY CONTEXT");
      expect(prompt).toContain("心形护体");
      // The fence: the hint is not allowed to supply dimensions.
      expect(prompt).toMatch(/NOT evidence/);
      expect(prompt).toMatch(/still has to come from the drawing/);
    }
  });

  it("adds nothing when there is no hint", () => {
    const prompt = buildFeatureTreePrompt({ objectName: "plate", views: { views: [] } });
    expect(prompt).not.toContain("INDUSTRY CONTEXT");
  });
});
