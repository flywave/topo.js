/**
 * CAD-native pipeline.
 *
 *   image → views → constrained sketches → feature tree → code → measured review
 *          ↑                                                         │
 *          └───────────────── refine the tree ───────────────────────┘
 *
 * The refinement loop edits the FEATURE TREE, never the generated code. That is
 * the CAD way round: the tree is the design, the code is a rendering of it, and
 * patching the rendering would leave the design wrong.
 */

import type { GeneratedCode, LLMProvider, ReviewIssue, GeometryReport } from "./types.js";
import type { FeatureTree, Profile2D, ViewSet, ViewSpec } from "./cad/model.js";
import { runViewIntake } from "./stages/views.js";
import {
  runProfileExtraction,
  runFeatureTree,
  runBuildFromTree,
  coerceFeatureTree,
} from "./stages/features.js";
import { lintFeatureTree, checkAssociativity, type FeatureTreeLint } from "./validators/design_intent.js";
import {
  evaluateSketchSolves,
  type RawSolveStatus,
  type SketchSolveOutcome,
} from "./validators/sketch_solve.js";
import {
  reprojectShape,
  DEFAULT_THRESHOLDS,
  type ReferenceSilhouette,
  type ReprojectionReport,
  type ReprojectionThresholds,
} from "./validators/reprojection.js";
import { validateGeometry } from "./validators/geometric.js";
import { quickSyntaxCheck } from "./validators/code_syntax.js";
import { executeInSandbox } from "./stages/review.js";
import { checkViewConsistency, type Bounds2D } from "./cad/project.js";
import {
  FEATURE_TREE_REFINE_SYSTEM,
  buildFeatureTreeRefinePrompt,
  parseJsonResponse,
} from "./prompts/feature_tree.js";

// ---------------------------------------------------------------------------
// Config & result types
// ---------------------------------------------------------------------------

export interface CadPipelineConfig {
  llm: LLMProvider;
  /** Working directory for emitted artifacts. */
  workDir?: string;
  /**
   * Live WASM instance. When absent the pipeline still produces code, but
   * cannot execute it, so all measured gates are skipped rather than faked.
   */
  tp?: unknown;
  CQWorkplane?: unknown;
  /** Reference silhouettes keyed by view id, for the re-projection gate. */
  references?: Record<string, ReferenceSilhouette>;
  thresholds?: ReprojectionThresholds;
  /** How many times the feature tree may be repaired. */
  maxRefinements?: number;
  /** View kinds to extract profiles for. `photo`/`iso` are not orthographic. */
  profileViewKinds?: string[];
  verbose?: boolean;
}

export interface CadReviewOutcome {
  passed: boolean;
  issues: ReviewIssue[];
  geometry?: GeometryReport;
  solves?: SketchSolveOutcome;
  reprojection?: ReprojectionReport;
  /** Feature ids the emitter could not express. */
  skippedFeatures: Array<{ id: string; reason: string }>;
}

export interface CadRunResult {
  viewSet: ViewSet;
  profiles: Profile2D[];
  tree: FeatureTree;
  resolved: Record<string, number>;
  code: GeneratedCode;
  lint: FeatureTreeLint;
  review?: CadReviewOutcome;
  refinements: number;
  warnings: string[];
  errors: string[];
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

const ORTHOGRAPHIC_KINDS = new Set(["front", "top", "right", "left", "back", "bottom"]);

export class CadPipeline {
  private config: CadPipelineConfig;
  private warnings: string[] = [];

  constructor(config: CadPipelineConfig) {
    this.config = config;
  }

  private log(message: string): void {
    if (this.config.verbose) console.log(`[cad] ${message}`);
  }

  /**
   * Run the pipeline end to end.
   *
   * @param imagePath reference image
   * @param objectName what the part is, used to steer the feature tree
   */
  async run(imagePath: string, objectName?: string): Promise<CadRunResult> {
    this.warnings = [];
    const maxRefinements = this.config.maxRefinements ?? 3;

    // ---- A. view intake ------------------------------------------------
    this.log("stage A: view intake");
    const intake = await runViewIntake(imagePath, this.config.llm, {
      context: objectName,
    });
    this.warnings.push(...intake.warnings);
    let viewSet = intake.viewSet;

    // ---- B. profile extraction -----------------------------------------
    const wantedKinds = new Set(this.config.profileViewKinds ?? ORTHOGRAPHIC_KINDS);
    const profileViews = viewSet.views.filter((v) => wantedKinds.has(v.kind));

    const profiles: Profile2D[] = [];
    for (const view of profileViews) {
      this.log(`stage B: profile for ${view.id} (${view.kind})`);
      try {
        const result = await runProfileExtraction(view, viewSet, this.config.llm);
        profiles.push(result.profile);
        this.warnings.push(...result.warnings);
      } catch (e) {
        this.warnings.push(
          `view ${view.id}: profile extraction failed — ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    if (profiles.length === 0 && profileViews.length > 0) {
      this.warnings.push(
        "no view yielded a usable profile; the feature tree will be authored from the view description alone",
      );
    }

    // ---- C. feature tree ------------------------------------------------
    this.log("stage C: feature tree");
    const authored = await runFeatureTree(
      {
        objectName: objectName ?? "(unnamed)",
        views: viewSet,
        profiles,
        context: buildContext(viewSet),
      },
      this.config.llm,
    );

    let tree = authored.tree;
    let lint = authored.lint;
    this.warnings.push(...authored.warnings);

    // ---- D. build + measured review, with tree-level refinement --------
    let build = runBuildFromTree(tree);
    let review = this.config.tp ? this.review(tree, build.code, build.resolved) : undefined;
    let refinements = 0;

    while (
      refinements < maxRefinements &&
      !this.gatesPassing(lint, review) &&
      this.isWorthRefining(lint, review)
    ) {
      refinements++;
      this.log(`refinement ${refinements}: repairing the feature tree`);

      try {
        const repaired = await this.refineTree(
          tree,
          collectIssues(lint, review),
          { lint, review: review ? summarizeReview(review) : undefined },
        );
        const candidateTree = { ...repaired, provenance: tree.provenance };
        const candidateLint = lintFeatureTree(candidateTree);

        // Accept a repair only if it measurably reduces blocking errors. An
        // equal-priority repair is no progress; retrying would burn the budget
        // on no-ops.
        const before = countErrors(lint.issues) + countErrors(review?.issues);
        const after = countErrors(candidateLint.issues);
        if (after >= before) {
          this.warnings.push(
            after > before
              ? `refinement ${refinements} produced a worse tree (${after} blocking issues vs ${before}) — keeping the previous tree`
              : `refinement ${refinements} did not improve the tree (still ${after} blocking issues) — stopping rather than burning the remaining budget`,
          );
          break;
        }

        tree = candidateTree;
        lint = candidateLint;
        build = runBuildFromTree(tree);
        review = this.config.tp ? this.review(tree, build.code, build.resolved) : undefined;
      } catch (e) {
        this.warnings.push(
          `refinement ${refinements} failed: ${e instanceof Error ? e.message : String(e)}`,
        );
        break;
      }
    }

    const errors = [...build.errors];
    if (!lint.passed) {
      errors.push(...lint.issues.filter((i) => i.severity === "error").map((i) => `${i.code}: ${i.message}`));
    }

    this.log(`done: ${build.code.source.split("\n").length} lines, ${refinements} refinement(s)`);

    return {
      viewSet,
      profiles,
      tree,
      resolved: build.resolved,
      code: build.code,
      lint,
      review,
      refinements,
      warnings: dedupe(this.warnings),
      errors,
    };
  }

  // -----------------------------------------------------------------------
  // Review
  // -----------------------------------------------------------------------

  /** Run every measured gate that the available environment supports. */
  private review(
    tree: FeatureTree,
    code: GeneratedCode,
    resolved: Record<string, number>,
  ): CadReviewOutcome {
    const issues: ReviewIssue[] = [];
    const skippedFeatures: Array<{ id: string; reason: string }> = [];

    // L0 — the emitted code must at least parse.
    const syntax = quickSyntaxCheck(code.source);
    if (!syntax.valid) {
      issues.push({
        severity: "error",
        code: "CAD_SYNTAX",
        message: `Emitted code does not parse: ${syntax.error}`,
        suggestion: "This is an emitter defect — the tree was valid but the code was not",
      });
      return { passed: false, issues, skippedFeatures };
    }

    // L1 — execute, collecting sketch solve reports.
    const sandbox = executeInSandbox(
      code.source,
      this.config.tp,
      this.config.CQWorkplane,
      undefined,
      undefined,
      undefined,
    );

    let geometry: GeometryReport | undefined;
    let solves: SketchSolveOutcome | undefined;

    // L2 — solver residuals. A sketch that did not converge means the solved
    // geometry is not the intended geometry, even though a shape came out.
    const rawReports = extractSolveReports(sandbox.solveReports);
    if (Object.keys(rawReports).length > 0) {
      solves = evaluateSketchSolves(rawReports, {
        expectedSketches: Object.keys(tree.sketches),
      });
      issues.push(...solves.issues);
    } else if (Object.keys(tree.sketches).length > 0) {
      issues.push({
        severity: "warning",
        code: "SKT_NO_REPORTS",
        message: "No sketch solve reports were captured — solver convergence could not be verified",
      });
    }

    if (sandbox.error) {
      issues.push({
        severity: "error",
        code: "CAD_EXECUTION",
        message: `Building the tree failed: ${sandbox.error}`,
        suggestion: "A feature in the tree does not survive execution — check the failing operation in the feature order",
      });
    } else if (sandbox.shape != null) {
      const geo = validateGeometry(this.config.tp, sandbox.shape);
      geometry = geo.report;
      issues.push(...geo.issues);

      // L3 — re-projection against the reference silhouettes.
      const reprojection = this.reproject(tree, sandbox.shape);
      if (reprojection) {
        issues.push(...reprojection.issues);
        return {
          passed: !issues.some((i) => i.severity === "error"),
          issues,
          geometry,
          solves,
          reprojection,
          skippedFeatures,
        };
      }
    } else if (!sandbox.error) {
      issues.push({
        severity: "error",
        code: "CAD_NO_SHAPE",
        message: "The feature tree executed but produced no body",
        suggestion: "Check that the base feature's sketch closes and its extrude distance is positive",
      });
    }

    return {
      passed: !issues.some((i) => i.severity === "error"),
      issues,
      geometry,
      solves,
      skippedFeatures,
    };
  }

  private reproject(tree: FeatureTree, shape: unknown): ReprojectionReport | undefined {
    const refs = this.config.references;
    if (!refs || Object.keys(refs).length === 0) return undefined;

    const thresholds = this.config.thresholds ?? DEFAULT_THRESHOLDS;
    const issues: ReviewIssue[] = [];
    const results = [];
    const consistencyInputs: Array<{ id: string; kind: string; bounds: Bounds2D }> = [];

    for (const view of tree.provenance?.viewSet?.views ?? []) {
      const reference = refs[view.id];
      const report = reprojectShape(shape, {
        view: view.kind,
        reference,
        width: reference?.width ?? 512,
        height: reference?.height ?? 512,
        thresholds,
      });
      issues.push(...report.issues);
      results.push(...report.views);
      for (const r of report.views) {
        consistencyInputs.push({ id: view.id, kind: view.kind, bounds: r.modelBounds });
      }
    }

    // Cross-view consistency needs no reference at all: the front view's width
    // must equal the top view's, and so on.
    let consistency: ReprojectionReport["consistency"];
    if (consistencyInputs.length >= 2) {
      const cons = checkViewConsistency(consistencyInputs, thresholds.maxViewMismatch);
      consistency = cons;
      for (const violation of cons.violations) {
        issues.push({
          severity: "error",
          code: "RPR_VIEW_MISMATCH",
          message: `Orthographic views are inconsistent: ${violation}`,
          suggestion:
            "Adjacent views must agree on their shared dimension — a wrong dimension in one sketch is the usual cause",
        });
      }
    }

    return {
      compared: results.length > 0,
      views: results,
      consistency,
      issues,
      passed: !issues.some((i) => i.severity === "error"),
    };
  }

  // -----------------------------------------------------------------------
  // Refinement
  // -----------------------------------------------------------------------

  private gatesPassing(lint: FeatureTreeLint, review?: CadReviewOutcome): boolean {
    return lint.passed && (review?.passed ?? true);
  }

  /**
   * Only spend a refinement when there is something a tree edit could fix.
   *
   * An emitter defect or a missing WASM instance is not the tree's fault, and
   * asking the model to "fix" it would corrupt a working design.
   */
  private isWorthRefining(lint: FeatureTreeLint, review?: CadReviewOutcome): boolean {
    const issues = collectIssues(lint, review);
    const fixableByTreeEdit = new Set([
      "DIN_MISSING_SKETCH",
      "DIN_MISSING_PATTERN_SOURCE",
      "DIN_UNRESOLVED_PARAMETER",
      "DIN_NO_BASE_FEATURE",
      "DIN_DEGENERATE_AXIS",
      "DIN_LOFT_SECTIONS",
      "DIN_NO_SELECTOR",
      "DIN_NON_POSITIVE_DIMENSION",
      "DIN_INERT_PARAMETER",
      "RPR_LOW_IOU",
      "RPR_DEVIATION",
      "RPR_VIEW_MISMATCH",
      "RPR_EMPTY_MODEL",
      "SKT_HIGH_RESIDUAL",
      "SKT_NO_DOF",
      "SKT_SOLVER_FAILED",
      "CAD_EXECUTION",
      "CAD_NO_SHAPE",
    ]);
    return issues.some((i) => i.severity === "error" && fixableByTreeEdit.has(i.code ?? ""));
  }

  private async refineTree(
    tree: FeatureTree,
    issues: ReviewIssue[],
    measurements: unknown,
  ): Promise<FeatureTree> {
    const prompt = buildFeatureTreeRefinePrompt(tree, issues, measurements);
    const raw = await this.config.llm.complete(prompt, FEATURE_TREE_REFINE_SYSTEM);
    const parsed = parseJsonResponse(raw, "feature tree refinement");
    return coerceFeatureTree(parsed);
  }

  // -----------------------------------------------------------------------
  // Associativity
  // -----------------------------------------------------------------------

  /**
   * Verify that the parameters actually drive the model.
   *
   * Requires a live WASM instance because it rebuilds; returns null when there
   * is none, rather than reporting a pass it did not earn.
   */
  verifyAssociativity(tree: FeatureTree, resolved: Record<string, number>) {
    if (!this.config.tp) return null;
    return checkAssociativity(tree, resolved, (params) => {
      const build = runBuildFromTree(tree, params);
      const sandbox = executeInSandbox(
        build.code.source,
        this.config.tp,
        this.config.CQWorkplane,
        undefined,
        undefined,
        undefined,
      );
      if (sandbox.error || sandbox.shape == null) return null;
      const geo = validateGeometry(this.config.tp, sandbox.shape);
      if (!geo.report.shapeValid || !geo.report.bbox) return null;
      const [x0, y0, z0, x1, y1, z1] = geo.report.bbox;
      return {
        volume: geo.report.volume ?? 0,
        dx: x1 - x0,
        dy: y1 - y0,
        dz: z1 - z0,
        faces: geo.report.faceCount ?? 0,
      };
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildContext(viewSet: ViewSet): string {
  const parts: string[] = [`drawing kind: ${viewSet.drawingKind}`];
  if (viewSet.scale) {
    parts.push(
      `scale from ${viewSet.scale.kind}${viewSet.scale.label ? ` ("${viewSet.scale.label}")` : ""}`,
    );
  } else {
    parts.push("no scale evidence — dimensions are assumptions");
  }
  if (viewSet.undetermined.length > 0) {
    parts.push(`not visible: ${viewSet.undetermined.join("; ")}`);
  }
  return parts.join(". ");
}

function extractSolveReports(captured: unknown): Record<string, RawSolveStatus> {
  if (captured && typeof captured === "object") {
    return captured as Record<string, RawSolveStatus>;
  }
  return {};
}

function collectIssues(lint: FeatureTreeLint, review?: CadReviewOutcome): ReviewIssue[] {
  return [...lint.issues, ...(review?.issues ?? [])];
}

function countErrors(issues?: ReviewIssue[]): number {
  return (issues ?? []).filter((i) => i.severity === "error").length;
}

function summarizeReview(review: CadReviewOutcome): unknown {
  return {
    passed: review.passed,
    geometry: review.geometry,
    reprojection: review.reprojection
      ? {
          views: review.reprojection.views.map((v) => ({
            view: v.view,
            iou: Number(v.iou.toFixed(4)),
            recall: Number(v.recall.toFixed(4)),
            precision: Number(v.precision.toFixed(4)),
            deviationPx: Number(v.deviation.modelToReference.toFixed(2)),
          })),
        }
      : undefined,
    sketches: review.solves
      ? Object.fromEntries(
          Object.entries(review.solves.reports).map(([id, r]) => [
            id,
            { status: r.status, cost: r.cost, dof: r.dofCount },
          ]),
        )
      : undefined,
  };
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}
