// Client-side artifact attribution (P3 iteration 4): per-prefix builds with
// the browser kernel — free where the server paid N+1 builds. The map answers
// "which feature owns this face", the selection bridge's geometry half.
import type { FeatureTreeLike } from "../engine/kernel.js";
import type { TreeInterpreter } from "../engine/interpreter.js";

export interface FaceOwner {
  faceId: number;
  featureId: string;
}

export interface ArtifactMap {
  faces: FaceOwner[];
  features: Array<{ featureId: string; faceIds: number[] }>;
}

/** ownedFaces — the feature→geometry half of the selection bridge, shared by
 * every panel that paints attribution (tree rows, hover preview, picks). */
export function ownedFaces(map: ArtifactMap | undefined, featureId: string): Set<number> {
  return new Set((map?.faces ?? []).filter((f) => f.featureId === featureId).map((f) => f.faceId));
}

export interface InterpPort {
  interpret(tree: FeatureTreeLike, params?: Record<string, number>): Promise<{
    mesh: { vertices: number[][]; triangles: number[][] } | null;
  }>;
}

export class ArtifactService {
  private cache: { digest: string; map: ArtifactMap } | null = null;

  /** interp — a port over the engine's interpret(); injected so the core
   * stays kernel-free (the editor wires the TreeInterpreter in). */
  constructor(private interp: InterpPort) {}

  invalidate(): void {
    this.cache = null;
  }

  async build(tree: FeatureTreeLike, params: Record<string, number>): Promise<ArtifactMap> {
    const digest = TreeDigestOf(tree);
    if (this.cache?.digest === digest) return this.cache.map;

    // Final signatures, then per-prefix signature sets (N+1 local builds —
    // free in the browser kernel).
    const final = await this.interp.interpret(tree, params);
    const finalSigs = signatures(final.mesh);

    const n = tree.features.length;
    const prefixSets: Set<string>[] = [new Set()];
    for (let k = 1; k <= n; k++) {
      const truncated: FeatureTreeLike = { ...tree, features: tree.features.slice(0, k) };
      const built = await this.interp.interpret(truncated, params);
      prefixSets.push(new Set(signatures(built.mesh)));
    }

    const faces: FaceOwner[] = [];
    const byFeature = new Map<string, number[]>();
    finalSigs.forEach((sig, faceId) => {
      let owner = tree.features[n - 1].id;
      for (let k = 1; k <= n; k++) {
        if (prefixSets[k].has(sig)) {
          owner = tree.features[k - 1].id;
          break;
        }
      }
      faces.push({ faceId, featureId: owner });
      const list = byFeature.get(owner) ?? [];
      list.push(faceId);
      byFeature.set(owner, list);
    });

    const map: ArtifactMap = {
      faces,
      features: tree.features.map((f) => ({
        featureId: f.id,
        faceIds: byFeature.get(f.id) ?? [],
      })),
    };
    this.cache = { digest, map };
    return map;
  }
}

function signatures(mesh: MeshDataLike | null): string[] {
  if (!mesh) return [];
  const out: string[] = [];
  for (const face of mesh.vertices) {
    if (face.length < 9) {
      out.push("");
      continue;
    }
    const min = [face[0], face[1], face[2]];
    const max = [face[0], face[1], face[2]];
    for (let i = 0; i + 2 < face.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        if (face[i + k] < min[k]) min[k] = face[i + k];
        if (face[i + k] > max[k]) max[k] = face[i + k];
      }
    }
    out.push([min[0], min[1], min[2], max[0], max[1], max[2]].map((v) => v.toFixed(6)).join(","));
  }
  return out;
}

interface MeshDataLike {
  vertices: number[][];
  triangles: number[][];
}

function TreeDigestOf(tree: FeatureTreeLike): string {
  const stripped: Record<string, unknown> = { ...tree };
  delete stripped.provenance;
  let h = 0x811c9dc5;
  const text = JSON.stringify(stripped, Object.keys(stripped).sort());
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}
