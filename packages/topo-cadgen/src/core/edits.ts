// LocalEditService — the editor half of the closed loop, as a testable core
// service: patch → local preview (browser kernel) → server replay (the
// verification authority) → version. Nothing here touches the DOM; the
// features/ panels call it, the app wires the ports.
//
// Discipline (DESIGN §4): the local build is a PREVIEW; only the server's
// replay verdict turns an edit into a version. A failed replay leaves the
// local preview up and reports why — the user sees their intent and the
// objection at the same time.
import { TreeDigest, ChangedFeatures } from "./digest.js";
import type { Patch } from "./patch.js";
import type { FeatureTreeLike } from "../engine/kernel.js";

export interface BuildOutcome {
  mesh: { vertices: number[][]; triangles: number[][] } | null;
  volume?: number;
  skipped: Array<{ id: string; reason: string }>;
}

export interface EditPorts {
  /** Local build (browser kernel via the engine's interpret). */
  interpret(tree: FeatureTreeLike, params: Record<string, number>): Promise<BuildOutcome>;
  /** Server replay: PUT /runs/:id/tree (api.md). Returns the replay report. */
  replay(tree: FeatureTreeLike): Promise<{ status: number; data: any }>;
}

export interface PreviewResult {
  ok: boolean;
  volume?: number;
  error?: string;
}

export interface CommitResult {
  ok: boolean;
  changed: Array<{ featureId: string; kind: string }>;
  version?: { index: number; verdict?: string; sha?: string };
  error?: string;
}

export class LocalEditService {
  constructor(private ports: EditPorts) {}

  // preview — build the patched tree locally; ok only when every feature
  // emitted (a partial build is not a preview, it is a lie).
  async preview(tree: FeatureTreeLike, params: Record<string, number>): Promise<PreviewResult> {
    try {
      const r = await this.ports.interpret(tree, params);
      if (!r.mesh || r.skipped.length > 0) {
        const why = r.skipped.map((s) => `${s.id}: ${s.reason}`).join("; ") || "local build empty";
        return { ok: false, error: why };
      }
      return { ok: true, volume: r.volume };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // commit — name what changed, hand the tree to the server, surface the
  // version it produced. `before` is the tree the edit started from (the
  // change list drives attribution refresh and the log line).
  async commit(before: FeatureTreeLike, after: FeatureTreeLike, params: Record<string, number>, _patches?: Patch[]): Promise<CommitResult> {
    const changed = ChangedFeatures(before, after);
    if (changed.length === 0) {
      return { ok: false, changed, error: "no-op edit: tree unchanged" };
    }
    const pre = await this.preview(after, params);
    if (!pre.ok) return { ok: false, changed, error: `local preview failed: ${pre.error}` };

    const { status, data } = await this.ports.replay(after);
    if (status !== 200) {
      return { ok: false, changed, error: `server rejected the replay (${status}): ${JSON.stringify(data).slice(0, 300)}` };
    }
    const version = data?.version ?? data?.run?.version;
    return {
      ok: true,
      changed,
      version: version ? { index: version.index, verdict: version.verdict, sha: version.sha ?? version.digest } : undefined,
    };
  }

  // digest — exposed for panels (version identity display).
  digest(tree: FeatureTreeLike): string {
    return TreeDigest(tree);
  }
}
