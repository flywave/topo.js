/**
 * Stages B and C: PROFILE EXTRACTION and FEATURE TREE authoring, plus the
 * build step that replays the tree as code.
 *
 * This is where the CAD flow diverges from model building: the AI is asked for
 * sketches, constraints and a construction order — not for primitives at
 * coordinates — and the deterministic layers (lint, resolver, emitter) reject
 * a tree that does not hold together before a single shape is built.
 */

import type { LLMProvider, GeneratedCode } from "../types.js";
import type { FeatureTree, Profile2D, ViewSet, ViewSpec } from "../cad/model.js";
import { emitFeatureTreeCode } from "../cad/feature_codegen.js";
import { resolveParameters } from "../cad/expr.js";
import { lintFeatureTree, type FeatureTreeLint } from "../validators/design_intent.js";
import {
  FEATURE_TREE_SYSTEM,
  PROFILE_EXTRACTION_SYSTEM,
  buildFeatureTreePrompt,
  buildProfileExtractionPrompt,
  parseJsonResponse,
} from "../prompts/feature_tree.js";

// ---------------------------------------------------------------------------
// Profile extraction
// ---------------------------------------------------------------------------

export interface ProfileExtractionResult {
  profile: Profile2D;
  warnings: string[];
}

export async function runProfileExtraction(
  view: ViewSpec,
  viewSet: ViewSet,
  llm: LLMProvider,
): Promise<ProfileExtractionResult> {
  const scaleInfo = viewSet.scale
    ? { mmPerPixel: viewSet.scale.mmPerPixel, note: `${viewSet.scale.kind} scale` }
    : { note: "no scale evidence available" };

  const prompt = buildProfileExtractionPrompt(view, scaleInfo);
  const raw = await llm.complete(prompt, PROFILE_EXTRACTION_SYSTEM);
  const parsed = parseJsonResponse(raw, "profile extraction");

  const warnings: string[] = [];
  const entities = Array.isArray(parsed.entities)
    ? (parsed.entities as Profile2D["entities"])
    : [];
  if (entities.length === 0) {
    warnings.push(`View ${view.id}: no profile entities were extracted`);
  }

  const profile: Profile2D = {
    viewId: view.id,
    origin: Array.isArray(parsed.origin) ? (parsed.origin as [number, number]) : undefined,
    entities,
    loops: Array.isArray(parsed.loops) ? (parsed.loops as Profile2D["loops"]) : [],
    relations: Array.isArray(parsed.relations) ? (parsed.relations as Profile2D["relations"]) : [],
    dimensions: Array.isArray(parsed.dimensions) ? (parsed.dimensions as Profile2D["dimensions"]) : [],
  };

  if (profile.loops.length === 0 && entities.length > 0) {
    warnings.push(
      `View ${view.id}: no loops were declared — closure will be inferred from endpoint adjacency`,
    );
  }

  return { profile, warnings };
}

// ---------------------------------------------------------------------------
// Feature tree authoring
// ---------------------------------------------------------------------------

export interface FeatureTreeResult {
  tree: FeatureTree;
  lint: FeatureTreeLint;
  warnings: string[];
}

export async function runFeatureTree(
  input: {
    objectName: string;
    description?: string;
    views: ViewSet;
    profiles?: Profile2D[];
    context?: string;
  },
  llm: LLMProvider,
): Promise<FeatureTreeResult> {
  const prompt = buildFeatureTreePrompt({
    objectName: input.objectName,
    description: input.description,
    views: input.views,
    profiles: input.profiles,
    units: input.views.units.length,
    context: input.context,
  });

  const raw = await llm.complete(prompt, FEATURE_TREE_SYSTEM);
  const parsed = parseJsonResponse(raw, "feature tree");

  const tree = coerceFeatureTree(parsed);
  tree.provenance = { viewSet: input.views, profiles: input.profiles };

  // Deterministic gates run before anything is built. A tree that fails these
  // is a spec defect, not a geometry problem, and rebuilding cannot fix it.
  const lint = lintFeatureTree(tree);

  return { tree, lint, warnings: [] };
}

/** Normalize an AI-produced tree into the typed model. */
export function coerceFeatureTree(parsed: Record<string, unknown>): FeatureTree {
  const params = Array.isArray(parsed.parameters)
    ? (parsed.parameters as FeatureTree["parameters"])
    : [];

  const rawSketches = parsed.sketches && typeof parsed.sketches === "object"
    ? (parsed.sketches as Record<string, unknown>)
    : {};
  const sketches: FeatureTree["sketches"] = {};
  for (const [id, value] of Object.entries(rawSketches)) {
    const s = value as FeatureTree["sketches"][string];
    sketches[id] = { ...s, id: s.id ?? id };
  }

  const datums = parsed.datums && typeof parsed.datums === "object"
    ? (parsed.datums as FeatureTree["datums"])
    : { planes: {}, axes: {} };

  return {
    name: String(parsed.name ?? "unnamed_part"),
    description: typeof parsed.description === "string" ? parsed.description : undefined,
    units:
      parsed.units && typeof parsed.units === "object"
        ? (parsed.units as FeatureTree["units"])
        : { length: "mm", toMillimeter: 1 },
    datums: {
      planes: datums.planes ?? {},
      axes: datums.axes ?? {},
    },
    features: Array.isArray(parsed.features) ? (parsed.features as FeatureTree["features"]) : [],
    sketches,
    parameters: params,
    designIntent: parsed.designIntent as FeatureTree["designIntent"],
  };
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export interface BuildFromTreeResult {
  code: GeneratedCode;
  resolved: Record<string, number>;
  warnings: string[];
  errors: string[];
}

/**
 * Replay a feature tree as executable topo.js code.
 *
 * Emission is deterministic and local — it cannot fix a broken tree, so the
 * caller is expected to have run `lintFeatureTree` first. Anything the emitter
 * cannot express faithfully comes back as a warning or an error rather than an
 * approximation.
 *
 * `paramOverride` replaces individually resolved values, which is how the
 * associativity check rebuilds with a perturbed dimension.
 *
 * Constraint solving happens inside the emitted code, not here: the sketch is
 * emitted with its constraints and a `solve()` call, so the solver runs wherever
 * the code runs and the solve reports come back from that execution.
 */
export function runBuildFromTree(
  tree: FeatureTree,
  paramOverride?: Record<string, number>,
): BuildFromTreeResult {
  const resolved = resolveParameters(tree.parameters);
  const values = paramOverride ? { ...resolved.values, ...paramOverride } : resolved.values;
  const emission = emitFeatureTreeCode(tree, values);

  const warnings = [...emission.warnings];
  const errors = [...emission.errors];

  for (const skipped of emission.skippedFeatures) {
    warnings.push(`Feature "${skipped.id}" was not emitted: ${skipped.reason}`);
  }

  const code: GeneratedCode = {
    source: emission.source,
    entryPoint: "createModel",
    imports: [],
    methodsUsed: emission.methodsUsed,
  };

  return { code, resolved: values, warnings, errors };
}
