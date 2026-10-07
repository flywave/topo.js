/**
 * The quality contract (roadmap T2.2) — a fail-closed gate between tree
 * authoring and code emission.
 *
 * Everything downstream of this point is expensive: emitting, a kernel build,
 * re-projection, a refinement loop that spends model calls. A tree that is
 * missing an entire view, or that dropped half the dimensions the drawing
 * states, will burn all of it and come back "shape is wrong" — the one verdict
 * that cannot say what to fix. This gate refuses to emit ANY code for such a
 * tree and produces a machine-readable BLOCKED report that names each gap.
 *
 * The checks, and what makes them fair:
 *
 *   1. QC_DIMENSION_COVERAGE — the drawing's stated dimensions (the profiles'
 *      `dimensions`, read off the sheet) must be ANSWERED by the tree: a tree
 *      parameter of that name, or a sketch constraint of the same kind and
 *      value. The story this closes is measured: a constraint that cannot be
 *      applied gets DROPPED, the parameter then drives nothing, and every gate
 *      is silent about the hole. Coverage below `minCoverage` blocks.
 *   2. QC_VIEW_NO_ENTRY — a view that yielded a profile but none of whose
 *      entity tags appear anywhere in the tree: that view never entered the
 *      model. The part will look right from the views that did enter, which is
 *      exactly why the whole-part metrics cannot catch it.
 *   3. QC_INK_CALLOUT — stage B names entities that sit far off the drawing's
 *      ink so the tracer can re-aim them. A named entity whose tag is absent
 *      from the tree is a callout that went unanswered: block.
 *
 * What this gate deliberately does NOT do: it does not judge whether the
 * geometry is RIGHT — that is the measured gates' job after a build. It judges
 * whether the tree is COMPLETE enough to deserve a build.
 */

import type { ReviewIssue } from "../types.js";
import type { FeatureTree, Profile2D, ProfileDimension } from "../cad/model.js";
import type { ProfileToInkResult } from "./profile_to_ink.js";
import { evaluateExpression } from "../cad/expr.js";

export interface QualityContractInput {
  tree: FeatureTree;
  /** Stage-B ink measurements, worst entities first. */
  profileChecks?: ProfileToInkResult[];
  /** Parameters as resolved by the lint stage (for expression-valued constraints). */
  params?: Record<string, number>;
  /** Fraction of the drawing's stated dimensions the tree must answer. */
  minCoverage?: number;
  /** Mean px beyond which a profile entity counts as "named" by the ink check. */
  calloutPx?: number;
}

export interface QualityContractReport {
  ok: boolean;
  gaps: ReviewIssue[];
  /** Machine-readable BLOCKED report — the whole contract, as JSON. */
  report: string;
}

export const DEFAULT_MIN_COVERAGE = 0.5;
export const DEFAULT_CALLOUT_PX = 8;

export function checkQualityContract(input: QualityContractInput): QualityContractReport {
  const minCoverage = input.minCoverage ?? DEFAULT_MIN_COVERAGE;
  const calloutPx = input.calloutPx ?? DEFAULT_CALLOUT_PX;
  const gaps: ReviewIssue[] = [];

  const profiles = input.tree.provenance?.profiles ?? [];
  const tree = input.tree;

  // ---- 1. declared-dimension coverage ---------------------------------
  const declared = profiles.flatMap((p) => p.dimensions ?? []);
  if (declared.length > 0) {
    const unanswered = declared.filter((d) => !dimensionAnswered(tree, d, input.params ?? {}));
    const coverage = (declared.length - unanswered.length) / declared.length;
    if (coverage < minCoverage) {
      gaps.push({
        severity: "error",
        code: "QC_DIMENSION_COVERAGE",
        message:
          `the drawing states ${declared.length} dimension(s) but the tree answers only ${declared.length - unanswered.length} ` +
          `(${Math.round(coverage * 100)}% < ${Math.round(minCoverage * 100)}%): ` +
          unanswered.map((d) => `${d.name} (${d.kind} ${d.value}, entities ${d.tags.join("+")})`).join("; ") +
          " — an unanswered dimension drives nothing, and every downstream gate is blind to the hole it leaves",
        suggestion:
          "Add a sketch constraint or a parameter for each listed dimension so the stated size actually drives the model",
      });
    }
  }

  // ---- 2. every profiled view entered the tree -------------------------
  const treeTags = new Set(treeEntityTags(tree));
  for (const profile of profiles) {
    if (profile.entities.length === 0) continue;
    const entered = profile.entities.some((e) => treeTags.has(e.tag));
    if (!entered) {
      gaps.push({
        severity: "error",
        code: "QC_VIEW_NO_ENTRY",
        message:
          `view "${profile.viewId}" yielded a profile with ${profile.entities.length} entities but none of their tags appear in the tree — ` +
          `that view never entered the model, and the part will look correct from every view that did`,
        suggestion: `Add the features this view describes (its entity tags start with: ${profile.entities
          .slice(0, 5)
          .map((e) => e.tag)
          .join(", ")})`,
      });
    }
  }

  // ---- 3. ink callouts must be answered --------------------------------
  for (const check of input.profileChecks ?? []) {
    if (!check.compared) continue;
    const named = (check.entities ?? []).filter((e) => e.meanPx > calloutPx);
    for (const entity of named) {
      if (treeTags.has(entity.tag)) continue;
      gaps.push({
        severity: "error",
        code: "QC_INK_CALLOUT",
        message:
          `view "${check.viewId ?? "?"}": the ink check named entity "${entity.tag}" ${entity.meanPx.toFixed(1)}px off the drawing ` +
          `(${entity.description ?? ""}), and the tree does not contain that tag — the callout went unanswered`,
        suggestion: `Include entity "${entity.tag}" in its sketch (re-aimed at the ink), or state why it was dropped`,
      });
    }
  }

  const report = JSON.stringify(
    {
      blocked: !gapsOk(gaps),
      gaps: gaps.map((g) => ({ code: g.code, message: g.message })),
    },
    null,
    2,
  );

  return { ok: gaps.length === 0, gaps, report };
}

function gapsOk(gaps: ReviewIssue[]): boolean {
  return gaps.length === 0;
}

/** The entity tags the tree's sketches declare. */
function treeEntityTags(tree: FeatureTree): string[] {
  const tags: string[] = [];
  for (const spec of Object.values(tree.sketches ?? {})) {
    for (const e of (spec as any)?.entities ?? []) {
      if (e?.tag) tags.push(e.tag);
    }
  }
  return tags;
}

/**
 * Is the drawing's stated dimension answered by the tree?
 *
 * Answered = a tree parameter carries the dimension's name, OR a sketch
 * constraint of the same kind (distance↔length, radius/diameter) dimensions
 * entities of the same tags, OR a constraint resolves to the same value.
 */
function dimensionAnswered(
  tree: FeatureTree,
  d: ProfileDimension,
  params: Record<string, number>,
): boolean {
  for (const p of tree.parameters ?? []) {
    if (p.name === d.name) return true;
  }
  const wantedTags = new Set(d.tags);
  for (const spec of Object.values(tree.sketches ?? {})) {
    const sketch = spec as any;
    for (const c of sketch?.constraints ?? []) {
      if (c.kind !== "DISTANCE" && c.kind !== "LENGTH" && c.kind !== "RADIUS") continue;
      const tagOverlap = (c.tags as string[]).some((t) => wantedTags.has(t));
      const kindOk =
        (d.kind === "length" && (c.kind === "DISTANCE" || c.kind === "LENGTH")) ||
        (d.kind === "radius" && c.kind === "RADIUS") ||
        (d.kind === "diameter" && c.kind === "RADIUS");
      if (!kindOk) continue;
      // 同 tags 同值是最强证据; 不同 tags 但值相同也算应答 (尺寸可能落在
      // 另一条边上 —— 图纸标哪条边是表达问题, 不是驱动问题)。
      if (valueMatches(c.value, d.value, params)) return true;
      if (tagOverlap) return true;
    }
  }
  // A parameter resolving to the stated value also answers it — the dimension
  // may be expressed rather than constrained.
  const resolved = params[d.name];
  if (resolved !== undefined && Math.abs(resolved - d.value) <= 0.01 * Math.max(1, Math.abs(d.value))) {
    return true;
  }
  return false;
}

function valueMatches(expr: unknown, value: number, params: Record<string, number>): boolean {
  let v: number | undefined;
  if (typeof expr === "number") v = expr;
  else if (typeof expr === "string") {
    const direct = Number(expr);
    if (isFinite(direct)) v = direct;
    else {
      try {
        const r = evaluateExpression(expr, params);
        if (isFinite(r)) v = r;
      } catch {
        v = undefined;
      }
    }
  }
  return v !== undefined && Math.abs(v - value) <= 0.01 * Math.max(1, Math.abs(value));
}
