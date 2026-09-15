/**
 * Writing the finished body out.
 *
 * These run against the real kernel, because the whole export path is a kernel
 * behaviour: the writer puts bytes in Emscripten's in-memory filesystem, and
 * asking it to write to a host path produces no file at all while still
 * returning success. So the tests check the FILES, not the return values.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, rmSync, statSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getTopo, installGlobals } from "./helpers/topo.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { exportShape, sanitizeBasename, formatOfPath, formatExtension } from "../lib/export.js";
import type { FeatureTree } from "../lib/cad/model.js";

let tp: any;

const WORK = join(tmpdir(), "topo-img2cad-export");

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
// Fixtures
// ---------------------------------------------------------------------------

/** A 100 x 60 x 10 plate with a 30mm through bore. */
function plateTree(): FeatureTree {
  return {
    name: "plate",
    units: { length: "mm", toMillimeter: 1 },
    datums: { planes: {}, axes: {} },
    sketches: {
      s_base: {
        id: "s_base",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [
          { tag: "e1", type: "line", start: [0, 0], end: [100, 0] },
          { tag: "e2", type: "line", start: [100, 0], end: [100, 60] },
          { tag: "e3", type: "line", start: [100, 60], end: [0, 60] },
          { tag: "e4", type: "line", start: [0, 60], end: [0, 0] },
        ],
        constraints: [
          { kind: "LENGTH", tags: ["e1"], value: 100 },
          { kind: "ORIENTATION", tags: ["e1"], value: [1, 0] },
          { kind: "LENGTH", tags: ["e2"], value: 60 },
          { kind: "ORIENTATION", tags: ["e2"], value: [0, 1] },
          { kind: "LENGTH", tags: ["e3"], value: 100 },
          { kind: "ORIENTATION", tags: ["e3"], value: [-1, 0] },
          { kind: "LENGTH", tags: ["e4"], value: 60 },
          { kind: "ORIENTATION", tags: ["e4"], value: [0, -1] },
        ],
      },
      s_bore: {
        id: "s_bore",
        plane: { kind: "XY", origin: [0, 0, 0] },
        entities: [{ tag: "c1", type: "circle", center: [50, 30], radius: 15 }],
        constraints: [{ kind: "RADIUS", tags: ["c1"], value: 15 }],
      },
    },
    features: [
      { id: "f_pad", name: "Pad", op: { op: "pad", sketchId: "s_base", distance: "t" }, drivenBy: ["t"] },
      { id: "f_bore", name: "Bore", op: { op: "pocket", sketchId: "s_bore", through: true } },
    ],
    parameters: [{ name: "t", expr: "10", unit: "mm" }],
  };
}

function buildShape(tree: FeatureTree = plateTree()): any {
  const built = runBuildFromTree(tree);
  const sandbox = executeInSandbox(built.code.source, tp, undefined, undefined, undefined, undefined);
  if (sandbox.error || sandbox.shape == null) {
    throw new Error(`fixture did not build: ${sandbox.error ?? "no shape"}`);
  }
  return sandbox.shape;
}

function triangleCount(stl: Uint8Array): number {
  return new DataView(stl.buffer, stl.byteOffset, stl.byteLength).getUint32(80, true);
}

// ---------------------------------------------------------------------------

describe("exporting the built body", () => {
  it("writes a STEP and a binary STL that the filesystem can actually see", () => {
    const outDir = join(WORK, "both");
    const result = exportShape(tp, buildShape(), { outDir, basename: "plate" });

    expect(result.failures).toEqual([]);
    expect(result.files.map((f) => f.format).sort()).toEqual(["step", "stl"]);

    const step = readFileSync(join(outDir, "plate.step"));
    const stl = readFileSync(join(outDir, "plate.stl"));

    // The kernel returns true even when it wrote into its own filesystem only,
    // so the real proof is that the host has the bytes.
    expect(step.length).toBeGreaterThan(1000);
    expect(stl.length).toBeGreaterThan(84);

    expect(step.toString("utf8").startsWith("ISO-10303-21;")).toBe(true);
    expect(step.toString("utf8")).toContain("MANIFOLD_SOLID_BREP");
    expect(step.toString("utf8").trimEnd().endsWith("END-ISO-10303-21;")).toBe(true);

    // Binary, not ASCII: the first byte of the 80-byte header is not "s" of "solid".
    expect(step[0]).not.toBe(0x73);

    const triangles = triangleCount(stl);
    expect(triangles).toBeGreaterThan(0);
    expect(stl.length).toBe(84 + triangles * 50);
    expect(result.files.find((f) => f.format === "stl")!.detail.triangles).toBe(triangles);
    expect(result.files.find((f) => f.format === "step")!.detail.entities).toBeGreaterThan(50);
  }, 120_000);

  it("honours the STL deflection", () => {
    const coarse = exportShape(tp, buildShape(), {
      outDir: join(WORK, "coarse"),
      basename: "plate",
      formats: ["stl"],
      stlDeflection: 1.0,
    });
    const fine = exportShape(tp, buildShape(), {
      outDir: join(WORK, "fine"),
      basename: "plate",
      formats: ["stl"],
      stlDeflection: 0.01,
    });

    const coarseTris = coarse.files[0].detail.triangles;
    const fineTris = fine.files[0].detail.triangles;

    // A finer chord tolerance must actually mesh the round bore more finely, or
    // the parameter is decorative.
    expect(fineTris).toBeGreaterThan(coarseTris);
    expect(coarse.files[0].bytes).toBeLessThan(fine.files[0].bytes);
  }, 120_000);

  it("writes only what was asked for", () => {
    const outDir = join(WORK, "step-only");
    const result = exportShape(tp, buildShape(), {
      outDir,
      basename: "plate",
      formats: ["step"],
    });

    expect(result.files.map((f) => f.format)).toEqual(["step"]);
    expect(() => statSync(join(outDir, "plate.stl"))).toThrow();
  }, 120_000);

  it("refuses to hand over a body it cannot export", () => {
    const result = exportShape(tp, null, { outDir: join(WORK, "none"), basename: "plate" });
    expect(result.files).toEqual([]);
    expect(result.failures).toEqual([]);
    expect(result.notes.join(" ")).toMatch(/no body to export/);
  }, 120_000);

  /**
   * The STL is the deliverable a slicer or a viewer gets, and an open or
   * inside-out mesh is the classic way it arrives broken. Enclosed signed volume
   * catches both at once: the divergence theorem only gives the true volume for a
   * closed mesh whose triangles all wind outward.
   */
  it("writes an STL that is closed and wound outward", () => {
    const outDir = join(WORK, "watertight");
    const result = exportShape(tp, buildShape(), { outDir, basename: "plate", formats: ["stl"] });
    expect(result.failures).toEqual([]);

    const stl = new Uint8Array(readFileSync(join(outDir, "plate.stl")));
    const triangles = triangleCount(stl);
    const view = new DataView(stl.buffer, stl.byteOffset, stl.byteLength);

    let volume = 0;
    for (let i = 0; i < triangles; i++) {
      const base = 84 + i * 50 + 12; // skip the per-facet normal
      const p: number[][] = [];
      for (let v = 0; v < 3; v++) {
        const o = base + v * 12;
        p.push([view.getFloat32(o, true), view.getFloat32(o + 4, true), view.getFloat32(o + 8, true)]);
      }
      volume += (
        p[0][0] * (p[1][1] * p[2][2] - p[1][2] * p[2][1]) -
        p[0][1] * (p[1][0] * p[2][2] - p[1][2] * p[2][0]) +
        p[0][2] * (p[1][0] * p[2][1] - p[1][1] * p[2][0])
      ) / 6;
    }

    // The plate is 100x60x10 with a 30mm bore: 52931.417.
    expect(volume).toBeGreaterThan(0);
    expect(volume).toBeCloseTo(52931.417, -2);
    // A chord tolerance of 0.1mm on a 15mm radius cannot move the volume by 1%.
    expect(Math.abs(volume - 52931.417) / 52931.417).toBeLessThan(0.01);
  }, 120_000);

  /**
   * There is no STEP importer in the binding surface, so the file cannot be read
   * back. It can still be checked against the geometry it claims to describe: a
   * STEP carries every vertex as a CARTESIAN_POINT, so the outline of those points
   * must be the part's own bounding box. That catches a STEP of the wrong solid,
   * which a header check would not.
   */
  it("writes a STEP whose own coordinates describe this part", () => {
    const outDir = join(WORK, "step-geometry");
    const result = exportShape(tp, buildShape(), { outDir, basename: "plate", formats: ["step"] });
    expect(result.failures).toEqual([]);

    const text = readFileSync(join(outDir, "plate.step"), "utf8");
    const points = [...text.matchAll(/CARTESIAN_POINT\s*\(\s*'[^']*'\s*,\s*\(\s*([-0-9.E+]+)\s*,\s*([-0-9.E+]+)\s*,\s*([-0-9.E+]+)\s*\)/g)];
    expect(points.length).toBeGreaterThan(8);

    const xs = points.map((m) => Number(m[1]));
    const ys = points.map((m) => Number(m[2]));
    const zs = points.map((m) => Number(m[3]));
    const extent = (v: number[]) => Math.max(...v) - Math.min(...v);

    expect(extent(xs)).toBeCloseTo(100, 2);
    expect(extent(ys)).toBeCloseTo(60, 2);
    expect(extent(zs)).toBeCloseTo(10, 2);
    expect(Math.min(...zs)).toBeCloseTo(0, 2);
    expect(Math.max(...zs)).toBeCloseTo(10, 2);
  }, 120_000);

  it("reports a missing kernel filesystem instead of writing nothing quietly", () => {
    const result = exportShape({}, buildShape(), { outDir: join(WORK, "nofs"), basename: "plate" });
    expect(result.files).toEqual([]);
    expect(result.notes.join(" ")).toMatch(/no filesystem/);
  }, 120_000);
});

describe("file names", () => {
  it("keeps a model-authored name inside the output directory", () => {
    // The name comes from the feature tree, which a model wrote.
    expect(sanitizeBasename("../../etc/passwd")).toBe("etc_passwd");
    expect(sanitizeBasename("/absolute/path")).toBe("absolute_path");
    expect(sanitizeBasename("Mounting Plate v2")).toBe("Mounting_Plate_v2");
    expect(sanitizeBasename("...")).toBe("model");
    expect(sanitizeBasename("")).toBe("model");
    expect(sanitizeBasename("a".repeat(200)).length).toBe(80);
  });

  it("maps extensions to formats", () => {
    expect(formatOfPath("a/b.step")).toBe("step");
    expect(formatOfPath("a/b.STP")).toBe("step");
    expect(formatOfPath("a/b.stl")).toBe("stl");
    expect(formatOfPath("a/b.stl2")).toBe(null);
    expect(formatOfPath("a/b.brep")).toBe(null);
    expect(formatExtension("step")).toBe(".step");
    expect(formatExtension("stl")).toBe(".stl");
  });
});
