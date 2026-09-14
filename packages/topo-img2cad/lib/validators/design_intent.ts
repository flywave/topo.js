/**
 * Design-intent checks.
 *
 * Two things live here that no geometric check can supply:
 *
 *   1. Structural lint of the feature tree — dangling references, dead
 *      sketches, orphan parameters. Cheap, deterministic, catches spec bugs
 *      before any geometry is built.
 *
 *   2. Associativity verification — perturb a driving dimension and confirm the
 *      geometry actually moves. A "parametric" model whose parameters do not
 *      drive anything is the single most common way a CAD model looks
 *      parametric and is not.
 */

import type { ReviewIssue } from "../types.js";
import type { FeatureTree } from "../cad/model.js";
import { activeFeatures, referencedParameters } from "../cad/model.js";
import { resolveParameters, type ResolvedParameters } from "../cad/expr.js";

// ---------------------------------------------------------------------------
// Structural lint
// ---------------------------------------------------------------------------

export interface FeatureTreeLint {
  issues: ReviewIssue[];
  resolved: ResolvedParameters;
  passed: boolean;
}

export function lintFeatureTree(tree: FeatureTree): FeatureTreeLint {
  const issues: ReviewIssue[] = [];

  const features = activeFeatures(tree);
  const featureIds = new Set<string>();
  const sketchIds = new Set(Object.keys(tree.sketches));

  // --- feature identity ------------------------------------------------
  for (const f of tree.features) {
    if (featureIds.has(f.id)) {
      issues.push({
        severity: "error",
        code: "DIN_DUPLICATE_FEATURE",
        message: `Duplicate feature id "${f.id}"`,
        suggestion: "Feature ids must be unique — they are referenced by patterns and mirror",
      });
    }
    featureIds.add(f.id);
  }

  // --- base feature present --------------------------------------------
  const BASE_OPS = new Set(["pad", "revolve", "sweep", "loft"]);
  const baseIndex = features.findIndex((f) => BASE_OPS.has(f.op.op));
  if (baseIndex < 0) {
    issues.push({
      severity: "error",
      code: "DIN_NO_BASE_FEATURE",
      message: "The feature tree has no base feature (pad / revolve / sweep / loft)",
      suggestion:
        "A CAD feature history must create material before it can modify it — add a base pad or revolve",
    });
  } else if (baseIndex > 0) {
    issues.push({
      severity: "warning",
      code: "DIN_LATE_BASE_FEATURE",
      message: `${features
        .slice(0, baseIndex)
        .map((f) => f.id)
        .join(", ")} appear before the base feature, but features run in order`,
      suggestion: "Move material-modifying features after the base feature",
    });
  }

  // --- feature-level references ----------------------------------------
  for (const f of features) {
    const op = f.op;

    if ("sketchId" in op && !sketchIds.has(op.sketchId)) {
      issues.push({
        severity: "error",
        code: "DIN_MISSING_SKETCH",
        message: `Feature "${f.id}" references sketch "${op.sketchId}", which does not exist`,
        suggestion: `Known sketches: ${Array.from(sketchIds).join(", ") || "(none)"}`,
      });
    }
    if (op.op === "sweep" && !sketchIds.has(op.pathSketchId)) {
      issues.push({
        severity: "error",
        code: "DIN_MISSING_PATH_SKETCH",
        message: `Feature "${f.id}" references path sketch "${op.pathSketchId}", which does not exist`,
      });
    }
    if (op.op === "pattern_linear" || op.op === "pattern_polar") {
      if (!featureIds.has(op.ofFeature) && !features.some((x) => x.id === op.ofFeature)) {
        issues.push({
          severity: "error",
          code: "DIN_MISSING_PATTERN_SOURCE",
          message: `Feature "${f.id}" patterns "${op.ofFeature}", which is not a feature in this tree`,
        });
      }
      if (op.count < 2) {
        issues.push({
          severity: "warning",
          code: "DIN_DEGENERATE_PATTERN",
          message: `Feature "${f.id}": pattern count ${op.count} produces nothing beyond the source feature`,
        });
      }
    }
    if (op.op === "revolve") {
      const [sx, sy, sz] = op.axis.start;
      const [ex, ey, ez] = op.axis.end;
      if (Math.hypot(ex - sx, ey - sy, ez - sz) < 1e-6) {
        issues.push({
          severity: "error",
          code: "DIN_DEGENERATE_AXIS",
          message: `Feature "${f.id}": revolve axis has zero length`,
        });
      }
    }
    if (op.op === "loft" && op.sketchIds.length < 2) {
      issues.push({
        severity: "error",
        code: "DIN_LOFT_SECTIONS",
        message: `Feature "${f.id}": loft needs at least two sections, got ${op.sketchIds.length}`,
      });
    }
    if ((op.op === "fillet" || op.op === "chamfer") && !op.selector) {
      issues.push({
        severity: "error",
        code: "DIN_NO_SELECTOR",
        message: `Feature "${f.id}": ${op.op} has no edge selector, so it has no edges to act on`,
        suggestion: 'Give a CadQuery selector such as "|Z" or "#Z"',
      });
    }
  }

  // --- dead sketches ----------------------------------------------------
  const usedSketches = new Set<string>();
  for (const f of features) {
    const op = f.op;
    if ("sketchId" in op) usedSketches.add(op.sketchId);
    if (op.op === "sweep") usedSketches.add(op.pathSketchId);
    if (op.op === "loft") for (const s of op.sketchIds) usedSketches.add(s);
  }
  for (const id of sketchIds) {
    if (!usedSketches.has(id)) {
      issues.push({
        severity: "warning",
        code: "DIN_UNUSED_SKETCH",
        message: `Sketch "${id}" is built but no feature consumes it`,
        suggestion: "Either reference it from a feature or remove it",
      });
    }
  }

  // --- dimensions are positive -----------------------------------------
  for (const p of tree.parameters) {
    const numeric = Number(p.expr);
    if (isFinite(numeric) && numeric <= 0) {
      issues.push({
        severity: "error",
        code: "DIN_NON_POSITIVE_DIMENSION",
        message: `Parameter "${p.name}" is ${numeric}; lengths and radii must be positive`,
      });
    }
    if (p.min !== undefined || p.max !== undefined) {
      // Range checks need a resolved value, done below.
    }
  }

  // --- parameters resolve ----------------------------------------------
  const resolved = resolveParameters(tree.parameters);
  for (const err of resolved.errors) {
    issues.push({
      severity: "error",
      code: "DIN_UNRESOLVED_PARAMETER",
      message: `Parameter "${err.name}" (${err.expr}) cannot be resolved: ${err.message}`,
      suggestion: "Fix the expression or add the parameter it depends on",
    });
  }
  for (const p of tree.parameters) {
    const value = resolved.values[p.name];
    if (value === undefined) continue;
    if (p.min !== undefined && value < p.min) {
      issues.push({
        severity: "warning",
        code: "DIN_BELOW_MIN",
        message: `Parameter "${p.name}" resolved to ${value}, below its declared minimum ${p.min}`,
      });
    }
    if (p.max !== undefined && value > p.max) {
      issues.push({
        severity: "warning",
        code: "DIN_ABOVE_MAX",
        message: `Parameter "${p.name}" resolved to ${value}, above its declared maximum ${p.max}`,
      });
    }
  }

  // --- orphan parameters ------------------------------------------------
  const referenced = new Set(referencedParameters(tree));
  const drivenBy = new Set<string>();
  for (const f of features) {
    for (const name of f.drivenBy ?? []) drivenBy.add(name);
  }
  for (const p of tree.parameters) {
    // A parameter referenced by nothing is not driving anything.
    if (!referenced.has(p.name) && !drivenBy.has(p.name)) {
      issues.push({
        severity: "warning",
        code: "DIN_ORPHAN_PARAMETER",
        message: `Parameter "${p.name}" is neither referenced by another parameter nor declared in a feature's drivenBy — it does not drive the model`,
        suggestion:
          "Wire it into the feature it is meant to control, or remove it",
      });
    }
  }

  // --- design intent ----------------------------------------------------
  const intent = tree.designIntent;
  if (intent?.minWallThickness !== undefined) {
    for (const f of features) {
      if (f.op.op === "shell") {
        const t = resolved.values[f.op.thickness] ?? Number(f.op.thickness);
        if (isFinite(t) && t < intent.minWallThickness) {
          issues.push({
            severity: "warning",
            code: "DIN_THIN_WALL",
            message: `Feature "${f.id}": shell thickness ${t} is below the declared minimum wall thickness ${intent.minWallThickness}`,
          });
        }
      }
    }
  }

  return { issues, resolved, passed: !issues.some((i) => i.severity === "error") };
}

// ---------------------------------------------------------------------------
// Associativity verification
// ---------------------------------------------------------------------------

/** A measurement of the built model, used to detect that a change took effect. */
export type GeometryProbe = () => Record<string, number>;

export interface AssociativityCheck {
  parameter: string;
  original: number;
  perturbed: number;
  /** True when the probes differed — the parameter actually drives geometry. */
  droveGeometry: boolean;
  deltas: Record<string, number>;
}

export interface AssociativityReport {
  checks: AssociativityCheck[];
  issues: ReviewIssue[];
  passed: boolean;
}

/**
 * Verify that a parameter actually drives the model.
 *
 * Rebuilds the model with one parameter bumped by `relativeStep` and compares
 * geometry probes (volume, bbox extents, face count — whatever the caller can
 * measure). A parameter whose perturbation changes nothing is decorative.
 *
 * `rebuild` must build the model from a parameter set and return a probe. It is
 * injected because rebuilding needs a live WASM instance.
 */
export function checkAssociativity(
  tree: FeatureTree,
  baseParams: Record<string, number>,
  rebuild: (params: Record<string, number>) => Record<string, number> | null,
  opts: { relativeStep?: number; parameters?: string[]; tolerance?: number } = {},
): AssociativityReport {
  const step = opts.relativeStep ?? 0.1;
  const tolerance = opts.tolerance ?? 1e-9;
  const names = opts.parameters ?? tree.parameters.map((p) => p.name);

  const checks: AssociativityCheck[] = [];
  const issues: ReviewIssue[] = [];

  const baseProbe = rebuild(baseParams);
  if (!baseProbe) {
    return {
      checks: [],
      issues: [
        {
          severity: "error",
          code: "DIN_BASE_BUILD_FAILED",
          message: "Could not build the model with its base parameters, so associativity cannot be checked",
        },
      ],
      passed: false,
    };
  }

  for (const name of names) {
    const original = baseParams[name];
    if (typeof original !== "number" || !isFinite(original)) {
      issues.push({
        severity: "warning",
        code: "DIN_PARAM_NOT_RESOLVED",
        message: `Parameter "${name}" has no resolved value, so it cannot be perturbed`,
      });
      continue;
    }

    // A zero-valued parameter needs an absolute nudge.
    const delta = Math.abs(original) > tolerance ? original * step : step;
    const perturbedParams = { ...baseParams, [name]: original + delta };

    const perturbedProbe = rebuild(perturbedParams);
    if (!perturbedProbe) {
      issues.push({
        severity: "warning",
        code: "DIN_PERTURB_BUILD_FAILED",
        message: `Building with "${name}" changed to ${original + delta} failed — the parameter is outside the model's valid range`,
      });
      continue;
    }

    const deltas: Record<string, number> = {};
    let moved = false;
    for (const key of Object.keys(baseProbe)) {
      const a = baseProbe[key];
      const b = perturbedProbe[key];
      if (typeof a !== "number" || typeof b !== "number") continue;
      const d = Math.abs(b - a);
      deltas[key] = d;
      if (d > tolerance) moved = true;
    }

    checks.push({ parameter: name, original, perturbed: original + delta, droveGeometry: moved, deltas });

    if (!moved) {
      issues.push({
        severity: "warning",
        code: "DIN_INERT_PARAMETER",
        message: `Changing "${name}" from ${original} to ${original + delta} did not change the geometry — the parameter is not wired into any feature`,
        suggestion: "Reference it from the feature expression that should depend on it",
      });
    }
  }

  return {
    checks,
    issues,
    passed: !issues.some((i) => i.severity === "error"),
  };
}
