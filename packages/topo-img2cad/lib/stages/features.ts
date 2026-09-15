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
import { resolveSketchValues } from "../cad/resolve_sketch.js";
import { cropRaster, loadRaster, regionToPixelBox } from "../cad/image.js";
import { encodePngGray } from "../cad/image_encode.js";
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

/**
 * Read the loops of one view off the drawing.
 *
 * With `opts.imagePath` the model is shown that view's crop as well as the
 * description of it. Without it, the model works from its own prose summary of
 * the image, which is a paraphrase measured against the drawing rather than the
 * drawing itself — so the image path is preferred wherever a vision provider is
 * available.
 */
export async function runProfileExtraction(
  view: ViewSpec,
  viewSet: ViewSet,
  llm: LLMProvider,
  opts?: { imagePath?: string },
): Promise<ProfileExtractionResult> {
  const scaleInfo = viewSet.scale
    ? { mmPerPixel: viewSet.scale.mmPerPixel, note: `${viewSet.scale.kind} scale` }
    : { note: "no scale evidence available" };

  const prompt = buildProfileExtractionPrompt(view, scaleInfo);
  const answer = await completeWithView(llm, view, prompt, opts?.imagePath);
  const parsed = parseJsonResponse(answer.raw, "profile extraction");

  const warnings: string[] = [];
  if (answer.warning) warnings.push(answer.warning);
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

/**
 * Ask the model about one view, showing it that view's pixels when it can.
 *
 * The crop matters: a model shown a whole multi-view sheet and asked for "the
 * front view" mixes drawing conventions together, and the loops it returns are
 * then wrong in a way no later stage can detect. The providers' `analyzeImage`
 * has no system-prompt channel, so the system text is folded into the prompt.
 */
async function completeWithView(
  llm: LLMProvider,
  view: ViewSpec,
  prompt: string,
  imagePath?: string,
): Promise<{ raw: string; warning?: string }> {
  if (!imagePath) {
    return { raw: await llm.complete(prompt, PROFILE_EXTRACTION_SYSTEM) };
  }

  try {
    const raster = loadRaster(imagePath);
    const cropped = view.region
      ? cropRaster(raster, regionToPixelBox(view.region, raster.width, raster.height))
      : raster;
    const base64 = Buffer.from(encodePngGray(cropped)).toString("base64");
    return { raw: await llm.analyzeImage(base64, `${PROFILE_EXTRACTION_SYSTEM}\n\n${prompt}`) };
  } catch (e) {
    // A drawing we cannot decode is not a reason to lose the view: the text path
    // is weaker, not useless. But it IS weaker, and the difference is invisible
    // in the output, so it is reported rather than swallowed.
    const reason = e instanceof Error ? e.message : String(e);
    const raw = await llm.complete(prompt, PROFILE_EXTRACTION_SYSTEM);
    return {
      raw,
      warning: `View ${view.id}: the drawing could not be shown to the model (${reason}), so this profile was read from the view description instead of the pixels`,
    };
  }
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
/**
 * Rename the pattern fields a model reaches for to the ones the emitter knows.
 *
 * Asked for a pattern, models write `featureId` / `instances` / `direction` /
 * `distance` — the vocabulary of every CAD API — while the emitter wants
 * `ofFeature` / `count` / `dx` / `dy` / `dz`. Without this, four perfectly sound
 * features come back as "patterns undefined, which is not a feature in this tree".
 */
function normalizePatternOp(op: Record<string, unknown>): Record<string, unknown> {
  if (op.op !== "pattern_linear" && op.op !== "pattern_polar") return op;

  const next = { ...op };
  if (next.ofFeature === undefined) {
    next.ofFeature = next.featureId ?? next.source ?? next.of;
  }
  if (next.count === undefined) {
    next.count = next.instances ?? next.number;
  }

  if (next.op === "pattern_linear") {
    const direction = Array.isArray(next.direction) ? (next.direction as number[]) : undefined;
    const distance = next.distance;
    const step = typeof distance === "number" ? distance : undefined;

    // A direction plus a spacing is the same instruction as three components.
    if (next.dx === undefined && direction && direction.length >= 3) {
      const [ix, iy, iz] = direction;
      if (step !== undefined) {
        next.dx = ix * step;
        next.dy = iy * step;
        next.dz = iz * step;
      } else if (typeof distance === "string") {
        // Keep the spacing as the expression the model wrote; the emitter
        // multiplies literal components by it only when they are numbers.
        next.dx = ix === 0 ? "0" : ix === 1 ? distance : `${ix} * (${distance})`;
        next.dy = iy === 0 ? "0" : iy === 1 ? distance : `${iy} * (${distance})`;
        next.dz = iz === 0 ? "0" : iz === 1 ? distance : `${iz} * (${distance})`;
      }
    }
  }
  return next;
}

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
    features: Array.isArray(parsed.features)
      ? (parsed.features as FeatureTree["features"]).map((f) => ({
          ...f,
          op: normalizePatternOp(f.op as unknown as Record<string, unknown>) as FeatureTree["features"][number]["op"],
        }))
      : [],
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
  /**
   * Sketches the emitted code solves and reports on. Excludes circles, which are
   * exact by construction, so a convergence check must expect these and no more.
   */
  solvedSketches: string[];
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

  // A parametric sketch holds expressions; the emitter holds numbers. Doing the
  // substitution here keeps emission total, so a model that authors a properly
  // associative sketch gets an associative model rather than a parse failure.
  const sketches = resolveSketchValues(tree, values);
  const emission = emitFeatureTreeCode(sketches.tree, values);

  const warnings = [...emission.warnings, ...sketches.issues];
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

  return {
    code,
    resolved: values,
    solvedSketches: emission.solvedSketches,
    warnings,
    errors,
  };
}
