// Tree golden dump — GO-SIDE ACCEPTANCE TOOLING (additive; touches no lib/ code).
//
// The go-cadgen port reconciles the two implementations by building the SAME
// feature-tree fixtures through both pipelines and comparing the metrics. This
// file is the TS half: it runs the frozen TypeScript pipeline over the shared
// fixtures (testdata/corpus/trees/*.json in go-cadgen) and dumps volume +
// bounding-box extents to a JSON file.
//
// Gated behind environment variables so normal `pnpm test` runs stay silent
// (the go-topo `goldens_dump_test.go` convention):
//
//   TREE_GOLDEN_INPUT=/path/to/go-cadgen/testdata/corpus/trees \
//   GOLDEN_TREE_DUMP=/path/to/goldens.json \
//   pnpm --filter topo-img2cad test -- tree_goldens_dump
//
// Regenerate after any geometry change on either side; the Go test
// (interp/corpus_parity_test.go) pins the committed numbers.
import { beforeAll, describe, expect, it } from "vitest";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { FeatureTree } from "../lib/cad/model.js";
import { runBuildFromTree } from "../lib/stages/features.js";
import { executeInSandbox } from "../lib/stages/review.js";
import { validateGeometry } from "../lib/validators/geometric.js";
import { getMeshData } from "../lib/validators/reprojection.js";
import { getTopo, installGlobals } from "./helpers/topo.js";

let tp: any;

beforeAll(async () => {
  tp = await getTopo();
  installGlobals(tp);
}, 120_000);

/**
 * The pinned contract names a revolve axis "x" | "y" | "z" (the Go side's
 * schema); the TS emitter consumes drawn start/end points, and the kernel
 * converts them with the sketch plane's to_world_coords — so the named GLOBAL
 * axis is expressed in the sketch plane's LOCAL frame here, the same mapping
 * the Go interpreter performs (interp/interpreter.go revolveAxisLocal).
 */
function localAxisFor(planeKind: string, axis: string): { start: [number, number, number]; end: [number, number, number] } {
  const ex = planeKind === "YZ" ? [0, 1, 0] : [1, 0, 0];
  const ey = planeKind === "XY" ? [0, 1, 0] : [0, 0, 1];
  const n =
    planeKind === "XY" ? [0, 0, 1] : planeKind === "XZ" ? [0, -1, 0] : [1, 0, 0];
  const w = axis === "x" ? [1, 0, 0] : axis === "y" ? [0, 1, 0] : [0, 0, 1];
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return {
    start: [0, 0, 0],
    end: [dot(w, ex), dot(w, ey), dot(w, n)],
  };
}

describe("tree golden dump (Go-side acceptance tooling)", () => {
  it("dumps build metrics for the shared tree fixtures", async () => {
    const inputDir = process.env.TREE_GOLDEN_INPUT;
    const outPath = process.env.GOLDEN_TREE_DUMP;
    if (!inputDir || !outPath) {
      return; // silent no-op: this file only runs under the dump environment
    }

    const out: Record<string, { volume: number; bbox: number[] }> = {};
    const meshes: Record<string, { vertices: number[][] }> = {};
    const files = readdirSync(inputDir)
      .filter((f) => f.endsWith(".json") && f !== "goldens.json")
      .sort();
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const file = f.replace(/\.json$/, "");
      const tree = JSON.parse(
        readFileSync(join(inputDir, f), "utf-8"),
      ) as FeatureTree;

      // Named axis → drawn axis (see localAxisFor), so the TS emitter can
      // consume the pinned contract's revolve ops. pattern_polar's named axis
      // is WORLD on both sides (the Go interpreter rotates about the global
      // axis through the origin), so its conversion is the identity.
      for (const f of tree.features) {
        const op = f.op as any;
        if (typeof op.axis !== "string") continue;
        if (op.op === "revolve") {
          const sketch = tree.sketches[op.sketchId];
          op.axis = localAxisFor(sketch.plane.kind, op.axis);
        } else if (op.op === "pattern_polar") {
          const w = op.axis === "x" ? [1, 0, 0] : op.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          op.axis = { start: [0, 0, 0], end: w };
        }
      }

      let built;
      try {
        built = runBuildFromTree(tree);
      } catch (e) {
        throw new Error(`[${file}] runBuildFromTree threw: ${e}`);
      }
      expect(built.errors ?? []).toEqual([]);
      // The frozen emitter spells revolve axes as plain `{ x, y, z }` object
      // literals, which the Embind marshalling refuses ("Cannot pass
      // [object Object] as a gp_Pnt"; with a Vector it wants gp_Pnt) — no TS
      // test executes a revolve end-to-end, so this was never hit. Rewrite
      // the literals onto the kernel's gp_Pnt constructor, the same spelling
      // the emitter itself uses for pattern_polar's rotation axis. (The Go
      // interpreter passes real vectors and never needed this.)
      const source = built.code.source.replace(
        /\{ x: (-?[\d.]+), y: (-?[\d.]+), z: (-?[\d.]+) \}/g,
        "new tp.gp_Pnt_3($1, $2, $3)",
      );
      const sandbox = executeInSandbox(source, tp, undefined, undefined, undefined, undefined);
      if (sandbox.error !== undefined) {
        throw new Error(`[${file}] sandbox: ${sandbox.error}`);
      }
      const geo = validateGeometry(tp, sandbox.shape);
      expect(geo.report.volume).toBeGreaterThan(0);

      out[file] = {
        volume: Number(geo.report.volume.toFixed(6)),
        // [x0, y0, z0, x1, y1, z1]
        bbox: (geo.report.bbox ?? []).map((v: number) => Number(v.toFixed(6))),
      };

      // The mesh the Go side reconciles against (thirty-thirty 口径): the
      // same tessellation quality the interpreter hands its gates, flattened
      // to one vertex list. Rounded well below the diff tolerance — the
      // numbers only need to survive JSON.
      const mesh = getMeshData(sandbox.shape, [0.1, 0.1, 30, false]);
      expect(mesh).not.toBeNull();
      const vertices: number[][] = [];
      for (const face of mesh!.vertices) {
        for (let i = 0; i + 2 < face.length; i += 3) {
          vertices.push([
            Number(face[i].toFixed(4)),
            Number(face[i + 1].toFixed(4)),
            Number(face[i + 2].toFixed(4)),
          ]);
        }
      }
      expect(vertices.length).toBeGreaterThan(0);
      meshes[file] = { vertices };
    }

    writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf-8");
    const meshDir = join(dirname(outPath), "meshes");
    mkdirSync(meshDir, { recursive: true });
    for (const [name, mesh] of Object.entries(meshes)) {
      writeFileSync(join(meshDir, `${name}.json`), `${JSON.stringify(mesh)}\n`, "utf-8");
    }
  }, 600_000);
});
