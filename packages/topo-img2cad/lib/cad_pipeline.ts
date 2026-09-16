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
  type BuildFromTreeResult,
} from "./stages/features.js";
import { lintFeatureTree, checkAssociativity, type FeatureTreeLint, type AssociativityReport } from "./validators/design_intent.js";
import {
  evaluateSketchSolves,
  type RawSolveStatus,
  type SketchSolveOutcome,
} from "./validators/sketch_solve.js";
import {
  reprojectShape,
  reprojectAgainstRaster,
  getMeshData,
  DEFAULT_THRESHOLDS,
  type ReferenceSilhouette,
  type ReprojectionReport,
  type ReprojectionThresholds,
} from "./validators/reprojection.js";
import { validateGeometry } from "./validators/geometric.js";
import { quickSyntaxCheck } from "./validators/code_syntax.js";
import { executeInSandbox } from "./stages/review.js";
import { checkViewConsistency, isKnownView, type Bounds2D } from "./cad/project.js";
import {
  buildViewReferencesFromImage,
  ORTHOGRAPHIC_VIEW_KINDS,
  type ViewReference,
} from "./cad/reference.js";
import type { SilhouetteMode } from "./cad/image.js";
import { saveArtifacts, type ArtifactPaths } from "./artifacts.js";
import { exportShape, type ExportFormat, type ExportResult } from "./export.js";
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
  /**
   * Reference silhouettes keyed by view id, for the re-projection gate.
   *
   * Usually unnecessary: when a `tp` instance is present the pipeline reads the
   * reference off the drawing itself. Supply these only to override that, e.g.
   * when the image format cannot be decoded.
   */
  references?: Record<string, ReferenceSilhouette>;
  /** Silhouette extraction mode for the image-derived reference. */
  silhouetteMode?: SilhouetteMode;
  /** Raster resolution the re-projection comparison runs at. Default 512. */
  rasterSize?: number;
  /**
   * Rebuild with each parameter perturbed to confirm the model is associative.
   * Costs one extra build per parameter; on by default because a parameter that
   * drives nothing is the defect the whole CAD-shaped pipeline exists to avoid.
   */
  checkAssociativity?: boolean;
  thresholds?: ReprojectionThresholds;
  /** How many times the feature tree may be repaired. */
  maxRefinements?: number;
  /**
   * Domain vocabulary and typical construction for this industry, e.g. railway
   * overhead line equipment. Fed to every stage.
   *
   * It steers NAMING and CONSTRUCTION ORDER, and the prompt says explicitly that
   * it is not evidence — dimensions must still come from the drawing. A hint that
   * is allowed to supply sizes is a hint that invents them.
   */
  industry?: string;
  /** View kinds to extract profiles for. `photo`/`iso` are not orthographic. */
  profileViewKinds?: string[];
  /**
   * Send the (cropped) image to the model for profile extraction as well as for
   * view intake.
   *
   * Off by default so the library behaves deterministically against a scripted
   * provider; the CLI turns it on, because reading the loops off the drawing
   * rather than out of a prose description is the difference between measuring
   * the drawing and measuring a paraphrase of it.
   */
  visionProfiles?: boolean;
  /**
   * Formats to write the finished body out as, into `workDir`.
   *
   * Defaults to both; set to `[]` to produce code and measurements only. Nothing
   * is written when the tree produced no body.
   */
  exportFormats?: ExportFormat[];
  /** STL chord tolerance in model units. Default 0.1. */
  stlDeflection?: number;
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
  /** Proof that the parameters actually drive the geometry, when it was run. */
  associativity?: AssociativityReport | null;
  /** Files written, when a workDir was configured. */
  artifacts?: ArtifactPaths;
  /** STEP / STL written from the built body. */
  exports?: ExportResult;
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
  /** References read off the drawing, one per orthographic view. */
  private imageReferences: ViewReference[] = [];
  /** Body the last review executed, kept so it can be exported without a rebuild. */
  private reviewedShape: unknown = null;

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
    this.imageReferences = [];
    this.reviewedShape = null;
    const maxRefinements = this.config.maxRefinements ?? 3;

    // ---- A. view intake ------------------------------------------------
    this.log("stage A: view intake");
    const intake = await runViewIntake(imagePath, this.config.llm, {
      context: objectName,
      industry: this.config.industry,
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
        const result = await runProfileExtraction(view, viewSet, this.config.llm, {
          imagePath: this.config.visionProfiles ? imagePath : undefined,
          industry: this.config.industry,
        });
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
        industry: this.config.industry,
      },
      this.config.llm,
    );

    let tree = authored.tree;
    let lint = authored.lint;
    this.warnings.push(...authored.warnings);

    // ---- D. build + measured review, with tree-level refinement --------
    // The reference is read off the drawing once, before any refinement: the
    // drawing does not change when the tree does, and re-deriving it per round
    // would only risk measuring against a different silhouette each time.
    if (this.config.tp && !this.config.references) {
      const built = buildViewReferencesFromImage(imagePath, viewSet, {
        silhouetteMode: this.config.silhouetteMode,
        width: this.config.rasterSize ?? 512,
        height: this.config.rasterSize ?? 512,
      });
      this.imageReferences = built.references;
      this.warnings.push(...built.notes);
      this.log(`reference silhouettes: ${built.references.length} view(s)`);
    }

    let build = runBuildFromTree(tree);
    let review = this.config.tp ? this.review(tree, build) : undefined;
    let refinements = 0;

    // "Is there something a tree edit could fix" is the whole question. Asking
    // separately whether the gates passed used to disable the loop for exactly
    // the cases worth repairing: a silhouette that matches at IoU 0.75 is graded
    // a warning, so the gates "pass" and no repair is ever attempted.
    while (refinements < maxRefinements && this.isWorthRefining(lint, review)) {
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
        const candidateBuild = runBuildFromTree(candidateTree);

        // The candidate has to be MEASURED before it can be judged, and measuring
        // overwrites the body the run would export if the candidate is rejected.
        const shapeBefore = this.reviewedShape;
        const candidateReview = this.config.tp ? this.review(candidateTree, candidateBuild) : undefined;

        const verdict = acceptRepair(
          { lint, review },
          { lint: candidateLint, review: candidateReview },
        );
        if (!verdict.ok) {
          this.reviewedShape = shapeBefore;
          this.warnings.push(`refinement ${refinements} ${verdict.reason}`);
          break;
        }

        tree = candidateTree;
        lint = candidateLint;
        build = candidateBuild;
        review = candidateReview;
      } catch (e) {
        this.warnings.push(
          `refinement ${refinements} failed: ${e instanceof Error ? e.message : String(e)}`,
        );
        break;
      }
    }

    // Emitter warnings — unhonoured constraints, sketches that did not close, and
    // values that would not resolve — are the explanation for most failures, so
    // they have to reach the caller rather than stopping at the build step.
    this.warnings.push(...build.warnings);

    const errors = [...build.errors];
    if (!lint.passed) {
      errors.push(...lint.issues.filter((i) => i.severity === "error").map((i) => `${i.code}: ${i.message}`));
    }

    this.log(`done: ${build.code.source.split("\n").length} lines, ${refinements} refinement(s)`);

    // ---- E. associativity ------------------------------------------------
    // A model that builds but whose parameters drive nothing is not parametric,
    // and no geometric gate can see that. Proving it costs one rebuild per
    // parameter, so it runs last, when the tree is the one being returned — and
    // only on a tree that already builds, because on a broken one every
    // parameter would be reported inert and bury the real failure.
    let associativity: AssociativityReport | null = null;
    const wantAssociativity = this.config.tp && (this.config.checkAssociativity ?? true);
    if (wantAssociativity && lint.passed && review?.passed) {
      this.log("gate L6: associativity");
      try {
        associativity = this.verifyAssociativity(tree, build.resolved);
        if (associativity) {
          review = review ?? { passed: true, issues: [], skippedFeatures: [] };
          review.issues.push(...associativity.issues);
          review.passed = !review.issues.some((i) => i.severity === "error");
        }
      } catch (e) {
        this.warnings.push(
          `associativity check failed to run: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    let artifacts: ArtifactPaths | undefined;
    if (this.config.workDir) {
      try {
        artifacts = saveArtifacts({
          workDir: this.config.workDir,
          tree,
          code: build.code,
          review,
          references: this.imageReferences,
        });
      } catch (e) {
        this.warnings.push(
          `could not write artifacts to ${this.config.workDir}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    // ---- F. deliverables ------------------------------------------------
    let exports: ExportResult | undefined;
    const formats = this.config.exportFormats ?? ["step", "stl"];
    if (this.config.tp && this.config.workDir && formats.length > 0) {
      if (this.reviewedShape == null) {
        this.warnings.push(
          "no body was built, so no STEP or STL was written",
        );
      } else {
        this.log(`exporting: ${formats.join(", ")}`);
        exports = exportShape(this.config.tp, this.reviewedShape, {
          outDir: this.config.workDir,
          basename: tree.name,
          formats,
          stlDeflection: this.config.stlDeflection,
        });
        this.warnings.push(...exports.notes);
        for (const failure of exports.failures) {
          this.warnings.push(`export ${failure.format.toUpperCase()} failed: ${failure.reason}`);
        }
      }
    }

    return {
      viewSet,
      profiles,
      tree,
      resolved: build.resolved,
      code: build.code,
      lint,
      review,
      associativity,
      artifacts,
      exports,
      refinements,
      warnings: dedupe(this.warnings),
      errors,
    };
  }

  // -----------------------------------------------------------------------
  // Review
  // -----------------------------------------------------------------------

  /** Run every measured gate that the available environment supports. */
  private review(tree: FeatureTree, build: BuildFromTreeResult): CadReviewOutcome {
    const code = build.code;
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
      // Only sketches the emitter actually solved can report. A circle is exact
      // by construction and emits no solve(), so expecting a report for one
      // would report a correct sketch as a failure.
      solves = evaluateSketchSolves(rawReports, {
        expectedSketches: build.solvedSketches,
      });
      issues.push(...solves.issues);
    } else if (build.solvedSketches.length > 0) {
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
      this.reviewedShape = sandbox.shape;
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
    const imageRefs = this.imageReferences;
    if (imageRefs.length === 0 && (!refs || Object.keys(refs).length === 0)) return undefined;

    const thresholds = this.config.thresholds ?? DEFAULT_THRESHOLDS;
    const rasterSize = this.config.rasterSize ?? 512;
    const issues: ReviewIssue[] = [];
    const results = [];
    const consistencyInputs: Array<{ id: string; kind: string; bounds: Bounds2D }> = [];

    // Only orthographic views can be projected along — a photo has no view
    // direction, and asking for one would invent a verdict rather than measure.
    for (const view of tree.provenance?.viewSet?.views ?? []) {
      if (!ORTHOGRAPHIC_VIEW_KINDS.has(view.kind)) continue;

      const imageRef = imageRefs.find((r) => r.viewId === view.id);
      const along = projectionKeyFor(view);
      const report = imageRef
        ? reprojectAgainstRaster(shape, {
            view: along,
            mask: imageRef.mask,
            maskWidth: imageRef.maskWidth,
            maskHeight: imageRef.maskHeight,
            referenceBounds: imageRef.referenceBounds,
            width: Math.max(rasterSize, imageRef.maskWidth),
            height: Math.max(rasterSize, imageRef.maskHeight),
            thresholds,
          })
        : this.reprojectAgainstSupplied(shape, along, refs?.[view.id], rasterSize, thresholds);

      if (!report) continue;
      for (const issue of report.issues) {
        // A size mismatch against a model-placed frame is not evidence that the
        // dimensions are wrong, and the repair loop must not be told that it is.
        if (issue.code === "RPR_LOW_IOU" && imageRef?.scaleUnverified) {
          issue.suggestion =
            "This comparison is placed using the model's own pixel estimate of the drawing's scale, so a size mismatch may be a misread scale rather than a wrong dimension — check the scale evidence before resizing the part";
        }
        issues.push(issue);
      }
      results.push(...report.views);
      for (const r of report.views) {
        // Paired on the axis actually projected, so a mislabelled view does not
        // also raise a spurious cross-view inconsistency.
        consistencyInputs.push({ id: view.id, kind: along, bounds: r.modelBounds });
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

  /** A caller-supplied reference in model coordinates, if there is one. */
  private reprojectAgainstSupplied(
    shape: unknown,
    along: string,
    reference: ReferenceSilhouette | undefined,
    rasterSize: number,
    thresholds: ReprojectionThresholds,
  ): ReprojectionReport | undefined {
    if (!reference) return undefined;
    return reprojectShape(shape, {
      view: along,
      reference,
      width: reference.width || rasterSize,
      height: reference.height || rasterSize,
      thresholds,
    });
  }

  // -----------------------------------------------------------------------
  // Refinement
  // -----------------------------------------------------------------------

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
    return issues.some((i) => {
      const code = i.code ?? "";
      if (!fixableByTreeEdit.has(code)) return false;
      // Measured verdicts are worth acting on whether or not they rose to
      // "error". A silhouette that matches at IoU 0.75 is a part a quarter too
      // small, and grading that a warning while refusing to repair it means the
      // loop never engages for the very error the measurement exists to catch.
      if (MEASURED_CODES.has(code)) return true;
      return i.severity === "error";
    });
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
      const com = geo.report.centerOfMass ?? [0, 0, 0];
      return {
        volume: geo.report.volume ?? 0,
        dx: x1 - x0,
        dy: y1 - y0,
        dz: z1 - z0,
        faces: geo.report.faceCount ?? 0,
        comX: com[0],
        comY: com[1],
        comZ: com[2],
        moment: vertexMoment(sandbox.shape) ?? 0,
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

/**
 * The axis to project a view along.
 *
 * `kind` is a drafting label — "front", "top" — and `projectionPlane` is the
 * geometric fact about which plane the drawing measured. A model that calls a
 * sheet's front view "front" while recording that it is the XY plane, and builds
 * its geometry on XY, is only mislabelling it. Projecting along the label then
 * looks at the part's 10mm edge rather than its 120x80 face, and reports a
 * silhouette mismatch of 0.15 for a part that is exactly right — measured, on a
 * live run. The plane is unambiguous, so it wins when both are present.
 */
function projectionKeyFor(view: ViewSpec): string {
  const plane = (view as { projectionPlane?: string }).projectionPlane;
  if (typeof plane === "string" && isKnownView(plane)) return plane;
  return view.kind;
}

/**
 * A cheap fingerprint of where the body's material actually is.
 *
 * Volume, bounding box, face count and even the centre of mass are blind to a
 * feature that moves *within* the part — relocating a bolt hole removes exactly
 * as much material as before, and a symmetric pair of holes moving outward
 * leaves the centroid where it was. Measured: a run's corner-hole offsets were
 * reported as driving nothing, and every one of those four measures was
 * genuinely unchanged.
 *
 * Summing the squared distance of every tessellated vertex from the origin is
 * order-independent, needs no extra kernel calls beyond a mesh, and moves the
 * instant any face moves.
 */
function vertexMoment(shape: unknown): number | undefined {
  const mesh = getMeshData(shape);
  if (!mesh) return undefined;
  let sum = 0;
  for (const positions of mesh.vertices) {
    if (!Array.isArray(positions)) continue;
    for (let i = 0; i + 2 < positions.length; i += 3) {
      sum += positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2;
    }
  }
  return Number.isFinite(sum) ? sum : undefined;
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

/** Verdicts that came from measuring the built body, rather than from the tree's shape. */
const MEASURED_CODES: ReadonlySet<string> = new Set([
  "RPR_LOW_IOU",
  "RPR_DEVIATION",
  "RPR_VIEW_MISMATCH",
  "RPR_EMPTY_MODEL",
  "SKT_HIGH_RESIDUAL",
  "SKT_NO_DOF",
  "SKT_SOLVER_FAILED",
]);

/**
 * How well a candidate matched the drawing, higher being better.
 *
 * Returns null when nothing was measured, so "no measurement" can never be
 * mistaken for "measured and fine".
 */
function silhouetteScore(review?: CadReviewOutcome): number | null {
  const views = review?.reprojection?.views;
  if (!views || views.length === 0) return null;
  const meanIou = views.reduce((sum, v) => sum + v.iou, 0) / views.length;
  const dev = views.reduce(
    (sum, v) => sum + (isFinite(v.deviation.modelToReference) ? v.deviation.modelToReference : 0),
    0,
  ) / views.length;
  return meanIou;
}

/**
 * Decide whether a repair earned its round.
 *
 * Fewer blocking errors always wins. Failing that, a repair may still win by
 * converging: the loop exists to improve a MEASUREMENT, and a measurement often
 * improves without changing how many warnings it produces — a plate a quarter too
 * small refines to exactly right while the issue count stays at one. Judging on
 * the count alone would reject that repair and stop with the wrong part.
 */
function acceptRepair(
  before: { lint: FeatureTreeLint; review?: CadReviewOutcome },
  after: { lint: FeatureTreeLint; review?: CadReviewOutcome },
): { ok: boolean; reason: string } {
  const beforeErrors = countErrors(before.lint.issues) + countErrors(before.review?.issues);
  const afterErrors = countErrors(after.lint.issues) + countErrors(after.review?.issues);

  if (afterErrors < beforeErrors) {
    return { ok: true, reason: `reduced blocking issues ${beforeErrors} -> ${afterErrors}` };
  }
  if (afterErrors > beforeErrors) {
    return {
      ok: false,
      reason: `produced a worse tree (${afterErrors} blocking issues vs ${beforeErrors}) — keeping the previous tree`,
    };
  }

  const wasScore = silhouetteScore(before.review);
  const nowScore = silhouetteScore(after.review);
  if (wasScore !== null && nowScore !== null && nowScore > wasScore + 1e-4) {
    return {
      ok: true,
      reason: `improved the silhouette IoU ${wasScore.toFixed(4)} -> ${nowScore.toFixed(4)}`,
    };
  }

  return {
    ok: false,
    reason:
      nowScore !== null && wasScore !== null && nowScore < wasScore - 1e-4
        ? `made the silhouette worse (IoU ${wasScore.toFixed(4)} -> ${nowScore.toFixed(4)}) — keeping the previous tree`
        : `did not improve the tree (still ${afterErrors} blocking issues) — stopping rather than burning the remaining budget`,
  };
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
