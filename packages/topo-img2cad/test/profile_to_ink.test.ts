/**
 * Measuring the traced profile against the drawing's ink.
 *
 * The outline gate measures the BUILT body and that is the verdict that counts,
 * but it arrives at the end of a four-minute run and cannot say which of thirty
 * traced segments is wrong — the mesh carries no tags, the profile does. This is
 * the same measurement one stage earlier, on the profile itself.
 *
 * These are about it being a MEASUREMENT rather than a verdict, and about it
 * naming its suspects: the numbers are what the tree stage can act on, and a
 * warning that named nothing would be no better than silence.
 */

import { describe, expect, it } from "vitest";
import { measureProfileToInk } from "../lib/validators/profile_to_ink.js";
import type { Profile2D, ProfileEntity } from "../lib/cad/model.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A frame with the part's outline drawn as ink, one pixel wide. */
function rectInk(width: number, height: number, inset = 0): Uint8Array {
  const mask = new Uint8Array(width * height);
  const x0 = inset;
  const y0 = inset;
  const x1 = width - 1 - inset;
  const y1 = height - 1 - inset;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x === x0 || x === x1 || y === y0 || y === y1) mask[y * width + x] = 1;
    }
  }
  return mask;
}

const FRAME = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

/** A square profile in profile units, centred as the ink's square is. */
function squareProfile(size: number, offset = 0): Profile2D {
  const a = 50 - size / 2 + offset;
  const b = 50 + size / 2 + offset;
  return {
    viewId: "v_top",
    entities: [
      { tag: "e1", type: "line", start: [a, a], end: [b, a] },
      { tag: "e2", type: "line", start: [b, a], end: [b, b] },
      { tag: "e3", type: "line", start: [b, b], end: [a, b] },
      { tag: "e4", type: "line", start: [a, b], end: [a, a] },
    ],
    loops: [{ tags: ["e1", "e2", "e3", "e4"], closed: true }],
    relations: [],
    dimensions: [],
  };
}

const opts = (ink: Uint8Array) => ({
  ink,
  inkWidth: 200,
  inkHeight: 200,
  inkBounds: FRAME,
});

// ---------------------------------------------------------------------------

describe("the profile against the drawing's ink", () => {
  it("scores a profile that is the drawing at nearly nothing", () => {
    // The profile is a 100-unit square inside a 100-unit frame, and the ink draws
    // the frame's border: the two coincide.
    const r = measureProfileToInk(squareProfile(100), opts(rectInk(200, 200)));

    expect(r.compared).toBe(true);
    expect(r.registration).toBe("absolute");
    expect(r.meanPx).toBeLessThan(2);
    expect(r.onInk).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it("names the entities that do not follow the ink", () => {
    // A profile whose right-hand edge is 20 units short: three edges land on the
    // drawing and one does not, and only a per-entity measurement can say which.
    const profile = squareProfile(100);
    profile.entities[1] = { tag: "e2", type: "line", start: [80, 0], end: [80, 100] };
    profile.entities[2] = { tag: "e3", type: "line", start: [80, 100], end: [0, 100] };

    const r = measureProfileToInk(profile, opts(rectInk(200, 200)));

    const worst = r.entities[0];
    expect(worst.tag).toBe("e2");
    expect(worst.meanPx).toBeGreaterThan(10);
    // The others are on the ink, so they are not named.
    const named = r.entities.filter((e) => e.meanFraction > 0.02).map((e) => e.tag);
    expect(named).toContain("e2");
    expect(named).not.toContain("e1");
  });

  it("reports a warning, never an error", () => {
    // A tree may legitimately depart from the profile it was handed — a model that
    // reads a dimension off the sheet is right even where the tracer disagreed.
    // Failing the run for the tracer's error would refuse a correct model, so the
    // verdict on the artifact stays with the gate that can see the artifact.
    const r = measureProfileToInk(squareProfile(30), opts(rectInk(200, 200)));

    expect(r.onInk).toBe(false);
    expect(r.issues.length).toBeGreaterThan(0);
    for (const i of r.issues) expect(i.severity).toBe("warning");
  });

  it("says so when the drawing carries no scale to check size against", () => {
    const r = measureProfileToInk(squareProfile(100), {
      ink: rectInk(200, 200),
      inkWidth: 200,
      inkHeight: 200,
    });

    expect(r.registration).toBe("normalized");
    expect(r.compared).toBe(true);
    expect(r.issues.every((i) => !/size and shape both checked/.test(i.message))).toBe(true);
  });

  it("has nothing to measure when the profile is empty", () => {
    const r = measureProfileToInk({ viewId: "v", entities: [], loops: [], relations: [], dimensions: [] }, opts(rectInk(200, 200)));

    expect(r.compared).toBe(false);
    expect(r.issues.map((i) => i.code)).toEqual(["PTI_NO_PROFILE"]);
  });

  it("ignores construction geometry", () => {
    // Centre lines and symmetry axes are not the profile, and measuring them would
    // name an entity that has no reason to be on the ink.
    const profile = squareProfile(100);
    (profile.entities as ProfileEntity[]).push({
      tag: "cl1",
      type: "line",
      start: [-40, -40],
      end: [140, 140],
      construction: true,
    });

    const r = measureProfileToInk(profile, opts(rectInk(200, 200)));
    expect(r.entities.map((e) => e.tag)).not.toContain("cl1");
  });
});
