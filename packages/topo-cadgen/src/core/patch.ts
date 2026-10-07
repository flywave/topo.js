// TreePatch — the editor's structured edits, as pure tree→tree functions.
// Every edit is a new tree object (the previous one stays intact for undo
// comparison and digest diffing); the server replays the whole tree, so a
// patch is just "the smallest tree change that expresses the user's intent".
import type { FeatureTreeLike, FeatureLike } from "../engine/kernel.js";

export type Patch =
  | { kind: "setParameter"; name: string; expr: string }
  | { kind: "setOpField"; featureId: string; field: string; value: unknown }
  | { kind: "removeFeature"; featureId: string }
  | { kind: "setSketchEntity"; sketchId: string; tag: string; field: string; value: unknown }
  | { kind: "setSketchConstraint"; sketchId: string; index: number; value: number };

export function applyPatch(tree: FeatureTreeLike, patch: Patch): FeatureTreeLike {
  switch (patch.kind) {
    case "setParameter": {
      const parameters = tree.parameters.map((p) =>
        p.name === patch.name ? { ...p, expr: patch.expr } : p,
      );
      return { ...tree, parameters };
    }
    case "setOpField": {
      const features = tree.features.map((f) =>
        f.id === patch.featureId ? ({ ...f, op: { ...f.op, [patch.field]: patch.value } } as FeatureLike) : f,
      );
      return { ...tree, features };
    }
    case "removeFeature": {
      return { ...tree, features: tree.features.filter((f) => f.id !== patch.featureId) };
    }
    case "setSketchEntity": {
      // A moved sketch entity IS the feature that consumes it (the digest's
      // attribution rule); numeric coordinates stay numbers so the kernel
      // sees exactly what the tree corpus declares.
      const sketches = { ...tree.sketches };
      const sk = sketches[patch.sketchId];
      if (!sk) throw new Error(`sketch ${patch.sketchId} missing`);
      const entities = sk.entities.map((e) =>
        e.tag === patch.tag ? { ...e, [patch.field]: patch.value } : e,
      );
      sketches[patch.sketchId] = { ...sk, entities };
      return { ...tree, sketches };
    }
    case "setSketchConstraint": {
      // The dimension-driven edit: change the constraint's value and the
      // solver re-places the geometry on replay — the honest way to make a
      // plate longer, as opposed to nudging one endpoint off the chain.
      const sketches = { ...tree.sketches };
      const sk = sketches[patch.sketchId];
      if (!sk) throw new Error(`sketch ${patch.sketchId} missing`);
      const constraints = (sk.constraints ?? []).map((c, i) =>
        i === patch.index ? { ...c, value: patch.value } : c,
      );
      sketches[patch.sketchId] = { ...sk, constraints };
      return { ...tree, sketches };
    }
  }
}

// findParameter — resolve a parameter name against the tree, or null.
export function findParameter(tree: FeatureTreeLike, name: string): { name: string; expr: string; unit?: string } | null {
  return tree.parameters.find((p) => p.name === name) ?? null;
}

// featureById — the panel's lookup helper.
export function featureById(tree: FeatureTreeLike, id: string): FeatureLike | null {
  return tree.features.find((f) => f.id === id) ?? null;
}
