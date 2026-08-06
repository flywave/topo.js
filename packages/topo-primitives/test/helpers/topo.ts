// WASM 加载共享 helper: 模块级单例, 每个测试文件初始化一次
// 加载方式与冒烟脚本一致: ES6 import topo.full.js + readFileSync wasm + { wasmBinary }
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

// 通用 shape 校验: 非 null / 非 isNull / bbox 三轴尺寸有限
export function checkShape(shape: any): { ok: boolean; dims: number[]; reason?: string } {
    if (shape == null) return { ok: false, dims: [], reason: "返回 null/undefined" };
    if (shape.isNull()) return { ok: false, dims: [], reason: "shape.isNull() == true" };
    const bb = shape.bbox();
    const dims = [bb.xLength(), bb.yLength(), bb.zLength()];
    if (dims.some((d) => !Number.isFinite(d)) || Math.max(...dims) <= 0) {
        return { ok: false, dims, reason: `bbox 异常 ${dims.join(" x ")}` };
    }
    return { ok: true, dims };
}
