import * as THREE from "three";
import { mesh, meshEdges } from "topo-js";
import { CQ } from "topo-primitives";
import type { TopoInstance } from "topo-wasm";

const { CQWorkplane, pnt, vec, gpVec } = CQ;

export interface RunResult {
  solidGeos: THREE.BufferGeometry[];
  edgeGeos: THREE.BufferGeometry[];
  elapsed: number;
  shapeCount: number;
  error: string | null;
  warnings: string[];
}

/**
 * Install globals required by embind `instanceof` checks
 * (mirrors ensureAssemblyGlobals in lib/railway/layout_utils.ts).
 */
export function installGlobals(tp: TopoInstance): void {
  const g = globalThis as Record<string, unknown>;
  for (const name of [
    "Workplane", "Assembly", "Location", "Shape", "Solid", "Face",
    "Compound", "Sketch", "gp_Vec", "gp_Pnt", "gp_Trsf",
    "TopLoc_Location", "gp_Pln",
  ] as const) {
    if (g[name] === undefined && (tp as Record<string, unknown>)[name] !== undefined) {
      g[name] = (tp as Record<string, unknown>)[name];
    }
  }
}

/**
 * Normalize a value returned by user code into a Shape (or array of Shapes).
 * Handles: CQWorkplane, tp.Workplane, tp.Assembly, Shape, arrays, null/undefined.
 */
function normalizeShape(value: unknown, tp: TopoInstance): unknown[] {
  if (value == null) return [];

  // CQWorkplane → .value()
  if (value instanceof CQWorkplane) {
    const sh = value.value();
    return sh ? [sh] : [];
  }

  // Array → flatten recursively
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) {
      out.push(...normalizeShape(item, tp));
    }
    return out;
  }

  // tp.Assembly → .toCompound()
  if (typeof value === "object" && value !== null && "toCompound" in value) {
    const comp = (value as { toCompound: () => unknown }).toCompound();
    return comp ? [comp] : [];
  }

  // tp.Workplane → .val()  (check duck-typing since we may not have instanceof)
  if (typeof value === "object" && value !== null && "val" in value && "faces" in value) {
    const sh = (value as { val: () => unknown }).val();
    return sh ? [sh] : [];
  }

  // Assume it's a Shape (duck-type: has .bbox or .mesh or .delete)
  if (typeof value === "object" && value !== null && ("bbox" in value || "mesh" in value)) {
    return [value];
  }

  return [];
}

/**
 * Dispose old resources from a previous run.
 *
 * NOTE on embind memory: WASM-side embind objects (Shape, etc.) are
 * reference-counted via JS wrappers. When the wrapper is GC'd the C++
 * side is NOT automatically freed — you must call `.delete()` on embind
 * objects. For BufferGeometry, three.js manages its own memory and
 * needs `.dispose()`.
 */
function disposePrevious(
  prevSolidGeos: THREE.BufferGeometry[],
  prevEdgeGeos: THREE.BufferGeometry[],
): void {
  for (const g of prevSolidGeos) g.dispose();
  for (const g of prevEdgeGeos) g.dispose();
}

/**
 * Execute user code in a sandbox and produce three.js geometries.
 */
export function runCode(
  code: string,
  tp: TopoInstance,
  prev: { solidGeos: THREE.BufferGeometry[]; edgeGeos: THREE.BufferGeometry[] },
): RunResult {
  disposePrevious(prev.solidGeos, prev.edgeGeos);

  const collected: unknown[] = [];
  const consoleLogs: string[] = [];
  const warnings: string[] = [];

  const sandboxConsole = {
    log: (...args: unknown[]) => consoleLogs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => warnings.push(args.map(String).join(" ")),
    error: (...args: unknown[]) => warnings.push(args.map(String).join(" ")),
  };

  const renderFn = (val: unknown) => {
    collected.push(val);
  };

  const start = performance.now();
  let error: string | null = null;

  try {
    // Use Function constructor for sandboxed evaluation
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "tp", "CQ", "CQWorkplane", "pnt", "vec", "gpVec", "render", "console",
      code,
    );
    const result = fn(tp, CQ, CQWorkplane, pnt, vec, gpVec, renderFn, sandboxConsole);

    // If user never called render(), use the return value
    if (collected.length === 0 && result !== undefined) {
      collected.push(result);
    }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    error = err.message + (err.stack ? "\n" + err.stack.split("\n").slice(0, 5).join("\n") : "");
  }

  // Normalize all collected values to Shape arrays
  const allShapes: unknown[] = [];
  for (const val of collected) {
    allShapes.push(...normalizeShape(val, tp));
  }

  // Mesh each shape → BufferGeometry
  const solidGeos: THREE.BufferGeometry[] = [];
  const edgeGeos: THREE.BufferGeometry[] = [];

  for (const sh of allShapes) {
    if (sh == null) continue;
    try {
      const sGeos = mesh(sh as never);
      solidGeos.push(...sGeos);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`mesh() failed for a shape: ${msg}`);
    }
    try {
      const eGeos = meshEdges(sh as never);
      edgeGeos.push(...eGeos);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`meshEdges() failed for a shape: ${msg}`);
    }
  }

  // Log any console output from the sandbox
  if (consoleLogs.length > 0) {
    console.log("[sandbox]", consoleLogs.join("\n"));
  }

  const elapsed = performance.now() - start;

  return {
    solidGeos,
    edgeGeos,
    elapsed,
    shapeCount: allShapes.length,
    error,
    warnings,
  };
}
