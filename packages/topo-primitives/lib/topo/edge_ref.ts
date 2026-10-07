/**
 * StableEdgeRef (roadmap T1.6): 稳定拓扑边引用。
 *
 * 语义取自 modeling-api 的 EdgeSpecifier: 一条边由"定义它的相邻面集合"命名,
 * 而非易失的迭代序索引 — 参数化重建 (改参数后重新 build) 后仍可解析。
 * 每个引用同时带 fallback 索引, 在相邻面匹配失败时退化 (并明说退化了)。
 *
 * 面的命名用其 bbox (v1 边界: 同参数重建下面 bbox 稳定; **参数变化会移动
 * 邻接面**, byFaces 自然失配 → 契约是不静默, 退化到 byIndex 并带 reason。
 * 按选择器语义 (">Z" 这类) 命名面以跨越参数变化, 是 v2 方向, 见
 * docs/cadgen-roadmap.md)。
 *
 * 依赖: getEdgeFaces 邻接查询 (T1.2) 经全局 ShapeOps 类访问 — 使用前先加载
 * 内核并注册全局类 (ensureAssemblyGlobals / 手动 globalThis.ShapeOps = tp.ShapeOps)。
 */

export interface FaceBox {
    min: [number, number, number];
    max: [number, number, number];
}

export interface EdgeRef {
    /** 定义该边的相邻面的 bbox 集合 (顺序无关) */
    byFaces?: FaceBox[];
    /** 兜底: 去重后的 edges() 迭代序索引 */
    index: number;
}

export interface EdgeRefResolution {
    ok: boolean;
    edge?: any;
    /** 'byFaces' = 按相邻面命中; 'byIndex' = 退化到索引 (byFaces 没匹配上) */
    resolvedBy?: "byFaces" | "byIndex";
    /** ok=false 时的原因 */
    reason?: string;
}

/** 去重 edges() (extract_entities 不去重: 共享边按面出现次数重复产出) */
export function stableEdges(shape: any): any[] {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const e of shape.edges()) {
        const key = edgeBBoxKey(e);
        if (!seen.has(key)) {
            seen.add(key);
            out.push(e);
        }
    }
    return out;
}

function edgeBBoxKey(e: any): string {
    const bb = e.bbox();
    return [bb.xMin(), bb.yMin(), bb.zMin(), bb.xMax(), bb.yMax(), bb.zMax()]
        .map((d: number) => d.toPrecision(12))
        .join(",");
}

function faceBox(face: any): FaceBox {
    const bb = face.bbox();
    return {
        min: [bb.xMin(), bb.yMin(), bb.zMin()],
        max: [bb.xMax(), bb.yMax(), bb.zMax()],
    };
}

function boxMatches(a: FaceBox, b: FaceBox, tolerance: number): boolean {
    for (let i = 0; i < 3; i++) {
        if (Math.abs(a.min[i] - b.min[i]) > tolerance) return false;
        if (Math.abs(a.max[i] - b.max[i]) > tolerance) return false;
    }
    return true;
}

/** 对 shape 的一条边捕获稳定引用 (index 为 stableEdges 里的序号) */
export function captureEdgeRef(shape: any, edge: any, index: number): EdgeRef {
    const ref: EdgeRef = { index };
    try {
        const adjacent: any[] = globalShapeOps().getEdgeFaces(shape, edge);
        if (adjacent.length > 0) {
            ref.byFaces = adjacent.map(faceBox);
        }
    } catch {
        // 邻接查询失败时只留索引, 不让捕获本身失败
    }
    return ref;
}

/** 解析稳定引用。byFaces 命中优先; 失败退回 index 并在 resolvedBy 里明说。 */
export function resolveEdgeRef(
    shape: any,
    ref: EdgeRef,
    opts: { tolerance?: number } = {},
): EdgeRefResolution {
    const tolerance = opts.tolerance ?? 1e-6;
    const edges = stableEdges(shape);

    if (ref.byFaces && ref.byFaces.length > 0) {
        for (const e of edges) {
            const adjacent: any[] = globalShapeOps().getEdgeFaces(shape, e);
            if (adjacent.length !== ref.byFaces.length) continue;
            const faceBoxes = adjacent.map(faceBox);
            // 集合级匹配: 每个 ref 面都能在邻接面里找到唯一对应
            const used = new Set<number>();
            let allMatch = true;
            for (const want of ref.byFaces) {
                let hit = -1;
                for (let i = 0; i < faceBoxes.length; i++) {
                    if (!used.has(i) && boxMatches(want, faceBoxes[i], tolerance)) {
                        hit = i;
                        break;
                    }
                }
                if (hit < 0) {
                    allMatch = false;
                    break;
                }
                used.add(hit);
            }
            if (allMatch) {
                return { ok: true, edge: e, resolvedBy: "byFaces" };
            }
        }
    }

    if (Number.isInteger(ref.index) && ref.index >= 0 && ref.index < edges.length) {
        return {
            ok: true,
            edge: edges[ref.index],
            resolvedBy: "byIndex",
            reason: ref.byFaces
                ? "byFaces 未命中 (几何变了?), 已退化到迭代序索引 — 结果可能与原引用不是同一条边"
                : undefined,
        };
    }

    return {
        ok: false,
        reason: ref.byFaces
            ? "byFaces 与索引都未命中: 形状拓扑与捕获时不符"
            : `索引 ${ref.index} 超界 (共 ${edges.length} 条边)`,
    };
}

// ShapeOps 经 embind 全局类访问; 走间接引用以便单测在注册前后都能 import 本模块
function globalShapeOps(): any {
    const g = globalThis as any;
    if (!g.ShapeOps) {
        throw new Error(
            "ShapeOps 全局类未注册 — 先经 ensureAssemblyGlobals/加载内核注册全局类",
        );
    }
    return g.ShapeOps;
}
