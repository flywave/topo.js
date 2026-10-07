// Tree digest + change identification — the editor's mirror of go-cadgen's
// session/digest.go: the digest keys caches and version identity; the change
// list names what an edit touched (sketch-only edits attribute to the one
// consuming feature — a moved bore's sketch IS a moved bore).
//
// The digest is a 32-bit FNV-1a of the canonical (key-sorted, provenance-free)
// JSON — a CACHE key and local version marker, not a cryptographic identity:
// the server's version chain (sha256, session/digest.go) stays the authority.
// Collision odds at editor scale (a few versions per session) are negligible;
// the server re-verifies on every replay anyway.
import type { FeatureTreeLike, FeatureLike } from "../engine/kernel.js";

export function TreeDigest(tree: FeatureTreeLike): string {
  if (!tree) return "";
  const stripped: Record<string, unknown> = { ...tree };
  delete stripped.provenance;
  return fnv1a(stableStringify(stripped));
}

// stableStringify — recursive key sort: a replacer ARRAY would FILTER nested
// keys (JSON.stringify semantics), collapsing distinct trees to one digest.
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  const keys = Object.keys(v).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify((v as Record<string, unknown>)[k])).join(",") + "}";
}

export interface FeatureChange {
  featureId: string;
  kind: "modified" | "added" | "removed";
}

export function ChangedFeatures(before: FeatureTreeLike, after: FeatureTreeLike): FeatureChange[] {
  const changes: FeatureChange[] = [];
  const beforeByID = new Map<string, FeatureLike>();
  before.features.forEach((f) => beforeByID.set(f.id, f));
  const afterByID = new Map<string, FeatureLike>();
  after.features.forEach((f) => afterByID.set(f.id, f));

  for (const f of after.features) {
    const old = beforeByID.get(f.id);
    if (old) {
      if (jsonStable(old) !== jsonStable(f)) {
        changes.push({ featureId: f.id, kind: "modified" });
      }
      beforeByID.delete(f.id);
    } else {
      changes.push({ featureId: f.id, kind: "added" });
    }
  }
  for (const f of before.features) {
    if (beforeByID.has(f.id)) {
      changes.push({ featureId: f.id, kind: "removed" });
    }
  }
  if (changes.length === 0) {
    // Sketch-only edit: attribute to the single consuming feature.
    const changedSketches: string[] = [];
    for (const [id, sk] of Object.entries(after.sketches)) {
      const old = before.sketches[id];
      if (!old || jsonStable(old) !== jsonStable(sk)) changedSketches.push(id);
    }
    for (const skID of changedSketches) {
      const consumers = after.features.filter(
        (f) =>
          f.op.sketchId === skID ||
          f.op.pathSketchId === skID ||
          (Array.isArray(f.op.sketchIds) && f.op.sketchIds.includes(skID)),
      );
      if (consumers.length === 1) {
        changes.push({ featureId: consumers[0].id, kind: "modified" });
      } else {
        changes.push({ featureId: skID, kind: "modified" });
      }
    }
  }
  return changes;
}

function jsonStable(v: unknown): string {
  return stableStringify(v);
}

function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
