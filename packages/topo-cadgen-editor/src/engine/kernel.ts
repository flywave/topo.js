// Kernel host (P3 framework): load the topo.js WASM kernel once, lazily, and
// hand the editor a stable build API — buildTree(tree, params) →
// { mesh, bbox, volume, faces } plus the op registry the interpreter
// dispatches through. This is the ONLY module that touches the raw kernel
// global; everything else sees MeshData and numbers.

import { readFileSync } from "node:fs";

export interface MeshData {
  vertices: number[][];
  triangles: number[][];
}

export interface BuildResult {
  mesh: MeshData | null;
  bbox: [number, number, number, number, number, number] | null;
  volume: number;
  faces: number;
  warnings: string[];
  skipped: Array<{ id: string; reason: string }>;
}

export interface FeatureTreeLike {
  name: string;
  units: { length: string; toMillimeter: number };
  datums: Record<string, unknown>;
  sketches: Record<string, SketchLike>;
  features: FeatureLike[];
  parameters: Array<{ name: string; expr: string; unit?: string }>;
  designIntent?: unknown;
  provenance?: unknown;
}

export interface SketchLike {
  id: string;
  plane: { kind: string; origin?: number[] };
  entities: Array<Record<string, any>>;
  constraints: Array<Record<string, any>>;
}

export interface FeatureLike {
  id: string;
  name?: string;
  op: Record<string, any>;
  drivenBy?: string[];
}

export type KernelGlobal = any;

let kernelPromise: Promise<KernelGlobal> | null = null;

// loadKernel — singleton lazy loader. The wasm lives in the workspace's
// topo-wasm package source (same helper pattern the kernel test suite uses).
export async function loadKernel(): Promise<KernelGlobal> {
  if (!kernelPromise) {
    kernelPromise = (async () => {
      const isNode = typeof process !== "undefined" && process.versions?.node;
      if (isNode) {
        // Node (tests): the archived helper's exact pattern — absolute POSIX
        // path import + node Buffer for wasmBinary. A file:// URL import or
        // a bare ArrayBuffer both end in "BufferSource is empty".
        const { join, dirname } = await import("node:path");
        const { fileURLToPath } = await import("node:url");
        const here = dirname(fileURLToPath(import.meta.url)); // …/src/engine
        const wasmDir = join(here, "..", "..", "..", "topo-wasm", "src");
        const { default: initTopo } = await import(
          /* @vite-ignore */ join(wasmDir, "topo.full.js")
        );
        const wasmBinary = readFileSync(join(wasmDir, "topo.full.wasm"));
        const tp = await initTopo({ wasmBinary });
        return tp as KernelGlobal;
      }
      // Browser: import the kernel URL and point locateFile at the sibling
      // wasm (served next to it).
      const loaderURL = new URL("../../../topo-wasm/src/topo.full.js", import.meta.url).href;
      const wasmURL = new URL("../../../topo-wasm/src/topo.full.wasm", import.meta.url).href;
      const mod: any = await import(/* @vite-ignore */ loaderURL);
      return mod.default({ locateFile: () => wasmURL });
    })();
  }
  return kernelPromise;
}

export function installGlobals(tp: KernelGlobal): void {
  const g = globalThis as any;
  if (!g.tp) g.tp = tp;
}

// resolveParams — evaluate each parameter expression against the others
// (the Go side's ResolveParameters semantic: params may reference params).
export function resolveParams(tree: FeatureTreeLike): Record<string, number> {
  const out: Record<string, number> = {};
  // Iterate to a fixed point so parameter→parameter references resolve in
  // any order (bounded rounds; leftovers stay unresolved and fail loudly at
  // use).
  for (let round = 0; round < tree.parameters.length + 1; round++) {
    let progressed = false;
    for (const p of tree.parameters) {
      if (out[p.name] !== undefined) continue;
      const direct = Number(p.expr);
      if (Number.isFinite(direct)) {
        out[p.name] = direct;
        progressed = true;
        continue;
      }
      // Evaluate with current knowledge; unknown identifiers throw — caught
      // and retried next round.
      try {
        const value = evalWith(p.expr, out);
        out[p.name] = value;
        progressed = true;
      } catch {
        // retry next round
      }
    }
    if (Object.keys(out).length === tree.parameters.length || !progressed) break;
  }
  return out;
}

function evalWith(expr: string, params: Record<string, number>): number {
  const tokens = tokenizeForEval(expr);
  return evalTokens(tokens, params);
}

// Minimal tokenizer/evaluator mirroring src/engine/expr.ts (kept local so the
// resolver has no DOM-adjacent imports).
function tokenizeForEval(expr: string): string[] {
  return expr.match(/[0-9.]+|[A-Za-z_][A-Za-z0-9_]*|[+\-*/%()]/g) ?? [];
}

function evalTokens(tokens: string[], params: Record<string, number>): number {
  let pos = 0;
  const peek = () => tokens[pos];
  const parseAdd = (): number => {
    let left = parseMul();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[pos++];
      const right = parseMul();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };
  const parseMul = (): number => {
    let left = parseUnary();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = tokens[pos++];
      const right = parseUnary();
      left = op === "*" ? left * right : op === "/" ? left / right : left % right;
    }
    return left;
  };
  const parseUnary = (): number => {
    if (peek() === "-") {
      pos++;
      return -parseUnary();
    }
    return parsePrimary();
  };
  const parsePrimary = (): number => {
    const t = tokens[pos++];
    if (t === undefined) throw new Error("unexpected end");
    if (/^[0-9.]+$/.test(t)) return Number(t);
    if (/^[A-Za-z_]/.test(t)) {
      const v = params[t];
      if (v === undefined) throw new Error(`unknown parameter "${t}"`);
      return v;
    }
    if (t === "(") {
      const v = parseAdd();
      pos++; // )
      return v;
    }
    throw new Error(`unexpected token ${t}`);
  };
  const value = parseAdd();
  if (pos < tokens.length) throw new Error(`trailing tokens at ${pos}`);
  return value;
}
