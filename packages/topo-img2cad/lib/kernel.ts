/**
 * Loading the geometry kernel.
 *
 * The workplane bindings dispatch their arguments with `instanceof`, which needs
 * the embind classes reachable as globals. Without that registration the calls
 * silently route down legacy paths or throw, and the failure looks like a
 * broken model rather than a missing global. So loading the kernel and
 * installing the globals are one step, not two things a caller has to know about.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

/** Embind classes the bindings look up by name on `globalThis`. */
export const KERNEL_GLOBALS = [
  "Workplane",
  "Assembly",
  "Location",
  "Shape",
  "Solid",
  "Face",
  "Compound",
  "Sketch",
  "gp_Vec",
  "gp_Pnt",
  "gp_Trsf",
  "TopLoc_Location",
  "gp_Pln",
] as const;

export interface Kernel {
  tp: unknown;
  /** The CQ shim, when it could be loaded. The feature-tree emitter does not need it. */
  CQWorkplane?: unknown;
}

export interface LoadKernelOptions {
  /** Directory holding `topo.full.js` / `topo.full.wasm`. */
  srcDir?: string;
  /** Pre-read wasm bytes, to avoid a second read. */
  wasmBinary?: Uint8Array;
  /** Register the embind classes on globalThis. Default true. */
  installGlobals?: boolean;
  loadCQ?: boolean;
  /**
   * Where the kernel's own output goes.
   *
   * STEP export prints a transfer report from C++ to stdout, and a CLI whose
   * stdout is machine-readable cannot have that mixed into it. Routing it here
   * lets the caller send it to stderr. Omit to leave Emscripten's default
   * (`console.log` / `console.error`).
   */
  onKernelOutput?: (stream: "out" | "err", text: string) => void;
  /** Emscripten settings passed through, e.g. `print` / `printErr`. */
  module?: Record<string, unknown>;
}

/**
 * Instantiate the kernel from the `topo-wasm` workspace package.
 *
 * Resolved through `topo-wasm`'s own manifest rather than a relative path, so
 * this keeps working whether the package runs from source or from `dist/`.
 */
export async function loadKernel(opts: LoadKernelOptions = {}): Promise<Kernel> {
  const srcDir = opts.srcDir ?? resolveWasmSrcDir();

  const mod = await import(pathToFileURL(join(srcDir, "topo.full.js")).href);
  const initTopo = (mod.default ?? mod) as (settings: Record<string, unknown>) => Promise<unknown>;
  const wasmBinary = opts.wasmBinary ?? new Uint8Array(readFileSync(join(srcDir, "topo.full.wasm")));

  const settings: Record<string, unknown> = { wasmBinary, ...opts.module };
  if (opts.onKernelOutput) {
    const sink = opts.onKernelOutput;
    settings.print = (text: unknown) => sink("out", String(text));
    settings.printErr = (text: unknown) => sink("err", String(text));
  }

  const tp = await initTopo(settings);

  if (opts.installGlobals !== false) {
    installKernelGlobals(tp);
  }

  const kernel: Kernel = { tp };
  if (opts.loadCQ !== false) {
    kernel.CQWorkplane = await tryLoadCQWorkplane();
  }
  return kernel;
}

/** Register the embind classes the bindings resolve by name. */
export function installKernelGlobals(tp: unknown): string[] {
  const g = globalThis as Record<string, unknown>;
  const installed: string[] = [];
  const source = tp as Record<string, unknown>;
  for (const name of KERNEL_GLOBALS) {
    if (source?.[name] !== undefined) {
      g[name] = source[name];
      installed.push(name);
    }
  }
  return installed;
}

function resolveWasmSrcDir(): string {
  const require = createRequire(import.meta.url);
  try {
    // topo-wasm's main is src/index.js, so its directory is the src directory.
    return dirname(require.resolve("topo-wasm"));
  } catch (e) {
    throw new Error(
      `could not locate the topo-wasm package (${e instanceof Error ? e.message : String(e)}); pass srcDir explicitly`,
    );
  }
}

/**
 * The CQ shim, best-effort.
 *
 * It is only needed by code that calls the CadQuery-style surface; the
 * feature-tree emitter drives `tp.Workplane` directly. A missing shim therefore
 * degrades one code path rather than failing the run, so it is not an error.
 */
async function tryLoadCQWorkplane(): Promise<unknown> {
  const require = createRequire(import.meta.url);
  try {
    const pkgJson = require.resolve("topo-primitives/package.json");
    const dist = join(dirname(pkgJson), "dist", "es", "index.js");
    const mod = (await import(pathToFileURL(dist).href)) as { CQ?: { CQWorkplane?: unknown } };
    return mod.CQ?.CQWorkplane;
  } catch {
    return undefined;
  }
}
