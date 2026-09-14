// WASM 加载共享 helper: 模块级单例, 每个测试文件初始化一次
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const wasmDir = join(here, "..", "..", "..", "topo-wasm", "src");

let instancePromise: Promise<any> | undefined;

export function getTopo(): Promise<any> {
    if (!instancePromise) {
        instancePromise = (async () => {
            const { default: initTopo } = await import(
                /* @vite-ignore */ join(wasmDir, "topo.full.js")
            );
            const wasmBinary = readFileSync(join(wasmDir, "topo.full.wasm"));
            return initTopo({ wasmBinary });
        })();
    }
    return instancePromise;
}

/**
 * Register embind classes on globalThis.
 *
 * The workplane bindings dispatch parameters with `instanceof`, which needs the
 * class to be reachable as a global. Registration is unconditional: vitest gives
 * each test file its own module registry, so a `=== undefined` guard would leave
 * a *different* WASM instance's class in place and every instanceof would fail.
 */
export function installGlobals(tp: any): void {
    const g = globalThis as Record<string, unknown>;
    for (const name of [
        "Workplane", "Assembly", "Location", "Shape", "Solid", "Face",
        "Compound", "Sketch", "gp_Vec", "gp_Pnt", "gp_Trsf",
        "TopLoc_Location", "gp_Pln",
    ]) {
        if (tp[name] !== undefined) g[name] = tp[name];
    }
}
