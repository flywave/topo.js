/**
 * Pipeline orchestrator — runs the full img2cad pipeline end-to-end.
 *
 * Coordinates the 5 stages (intake → spec → build → review → refine)
 * with state management and error handling.
 */

import type {
  PipelineConfig,
  PipelineState,
  ImageAnalysis,
  ParametricSpec,
  GeneratedCode,
  ReviewResult,
} from "./types.js";
import {
  initState,
  loadState,
  saveState,
  advanceStage,
  setStage,
  markStep,
  storeAnalysis,
  storeSpec,
  storeCode,
  storeReview,
  incrementCorrection,
} from "./state.js";
import { runIntake } from "./stages/intake.js";
import { runSpec } from "./stages/spec.js";
import { runBuild } from "./stages/build.js";
import { runReview } from "./stages/review.js";
import { runRefinementLoop } from "./stages/refine.js";

// ---------------------------------------------------------------------------
// Pipeline events
// ---------------------------------------------------------------------------

export interface PipelineEvent {
  type: "stage_start" | "stage_complete" | "stage_error" | "progress" | "complete" | "failed";
  stage: string;
  message: string;
  data?: unknown;
  timestamp: string;
}

export type PipelineListener = (event: PipelineEvent) => void;

// ---------------------------------------------------------------------------
// Pipeline runner
// ---------------------------------------------------------------------------

export class Pipeline {
  private config: PipelineConfig;
  private state: PipelineState;
  private listeners: PipelineListener[] = [];

  constructor(config: PipelineConfig) {
    this.config = config;
    // Initialize or load state
    try {
      this.state = loadState(config.workDir);
    } catch {
      this.state = initState(config.workDir, "", "generic");
    }
  }

  /** Subscribe to pipeline events. */
  on(listener: PipelineListener): void {
    this.listeners.push(listener);
  }

  private emit(event: Omit<PipelineEvent, "timestamp">): void {
    const fullEvent: PipelineEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    for (const listener of this.listeners) {
      try {
        listener(fullEvent);
      } catch {
        // Listener errors don't stop the pipeline
      }
    }
    if (this.config.verbose) {
      console.log(`[${event.type}] ${event.stage}: ${event.message}`);
    }
  }

  /** Get current state (read-only). */
  getState(): Readonly<PipelineState> {
    return this.state;
  }

  // -----------------------------------------------------------------------
  // Full pipeline execution
  // -----------------------------------------------------------------------

  /**
   * Run the full pipeline from intake to completion.
   *
   * @param imagePath - Path to the reference image
   * @returns The final pipeline state with all outputs
   */
  async run(imagePath: string): Promise<PipelineState> {
    this.state = initState(this.config.workDir, imagePath, "generic");
    saveState(this.config.workDir, this.state);

    try {
      // Stage 1: INTAKE
      await this.runIntakeStage(imagePath);

      // Stage 2: SPEC
      await this.runSpecStage();

      // Stage 3: BUILD
      await this.runBuildStage();

      // Stage 4: REVIEW
      await this.runReviewStage();

      // Stage 5: REFINE (if needed)
      if (!this.state.review?.passed) {
        await this.runRefineStage();
      }

      // Mark complete
      setStage(this.state, "complete");
      saveState(this.config.workDir, this.state);
      this.emit({ type: "complete", stage: "complete", message: "Pipeline completed successfully" });
    } catch (e) {
      setStage(this.state, "failed");
      saveState(this.config.workDir, this.state);
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ type: "failed", stage: this.state.stage, message: msg });
    }

    return this.state;
  }

  // -----------------------------------------------------------------------
  // Individual stages (can be called independently for partial runs)
  // -----------------------------------------------------------------------

  async runIntakeStage(imagePath: string): Promise<ImageAnalysis> {
    this.emit({ type: "stage_start", stage: "intake", message: "Analyzing image..." });
    setStage(this.state, "intake");
    saveState(this.config.workDir, this.state);

    try {
      const analysis = await runIntake(imagePath, this.config.llm, {
        profile: this.state.profile,
      });
      storeAnalysis(this.state, analysis);
      markStep(this.state, "intake.analyze");
      advanceStage(this.state);
      saveState(this.config.workDir, this.state);

      this.emit({
        type: "stage_complete",
        stage: "intake",
        message: `Analysis complete: ${analysis.detectedPrimitives.length} primitives detected`,
        data: analysis,
      });
      return analysis;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ type: "stage_error", stage: "intake", message: msg });
      throw e;
    }
  }

  async runSpecStage(): Promise<ParametricSpec> {
    this.emit({ type: "stage_start", stage: "spec", message: "Generating parametric spec..." });
    setStage(this.state, "spec");
    saveState(this.config.workDir, this.state);

    try {
      const analysis = this.state.analysis;
      if (!analysis) {
        throw new Error("No analysis available. Run intake stage first.");
      }

      const { spec } = await runSpec(analysis, this.config.llm);
      storeSpec(this.state, spec);
      markStep(this.state, "spec.generate");
      advanceStage(this.state);
      saveState(this.config.workDir, this.state);

      this.emit({
        type: "stage_complete",
        stage: "spec",
        message: `Spec generated: ${spec.components.length} components`,
        data: spec,
      });
      return spec;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ type: "stage_error", stage: "spec", message: msg });
      throw e;
    }
  }

  async runBuildStage(): Promise<GeneratedCode> {
    this.emit({ type: "stage_start", stage: "build", message: "Generating code..." });
    setStage(this.state, "build");
    saveState(this.config.workDir, this.state);

    try {
      const spec = this.state.spec;
      if (!spec) {
        throw new Error("No spec available. Run spec stage first.");
      }

      const code = await runBuild(spec, this.config.llm, {
        analysis: this.state.analysis,
      });
      storeCode(this.state, code);
      markStep(this.state, "build.generate");
      advanceStage(this.state);
      saveState(this.config.workDir, this.state);

      this.emit({
        type: "stage_complete",
        stage: "build",
        message: `Code generated: ${code.source.length} chars, ${code.methodsUsed.length} methods used`,
        data: code,
      });
      return code;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ type: "stage_error", stage: "build", message: msg });
      throw e;
    }
  }

  async runReviewStage(): Promise<ReviewResult> {
    this.emit({ type: "stage_start", stage: "review", message: "Reviewing code..." });
    setStage(this.state, "review");
    saveState(this.config.workDir, this.state);

    try {
      const code = this.state.code;
      if (!code) {
        throw new Error("No code available. Run build stage first.");
      }

      // For full review with WASM, we need tp instance
      // In CLI mode, this is done externally
      // Here we do a lightweight review without WASM
      const { validateCodeSyntax, quickSyntaxCheck } = await import("./validators/code_syntax.js");
      const { checkPrimitiveCoverage } = await import("./validators/primitive_coverage.js");

      const syntaxResult = quickSyntaxCheck(code.source);
      const syntaxIssues = validateCodeSyntax(code.source);

      const review: ReviewResult = {
        passed: syntaxResult.valid && !syntaxIssues.some((i) => i.severity === "error"),
        geometry: { shapeValid: false },
        executionTime: 0,
        issues: syntaxIssues,
        sandboxOutput: { logs: [], warnings: [] },
      };

      if (!syntaxResult.valid) {
        review.issues.unshift({
          severity: "error",
          code: "REV_SYNTAX_ERROR",
          message: `Syntax error: ${syntaxResult.error}`,
        });
      }

      storeReview(this.state, review);
      markStep(this.state, "review.validate");
      advanceStage(this.state);
      saveState(this.config.workDir, this.state);

      this.emit({
        type: "stage_complete",
        stage: "review",
        message: review.passed ? "Review passed" : `Review failed: ${review.issues.length} issues`,
        data: review,
      });
      return review;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ type: "stage_error", stage: "review", message: msg });
      throw e;
    }
  }

  async runRefineStage(): Promise<void> {
    this.emit({ type: "stage_start", stage: "refine", message: "Refining code..." });
    setStage(this.state, "refine");
    saveState(this.config.workDir, this.state);

    const spec = this.state.spec;
    const code = this.state.code;
    if (!spec || !code) {
      throw new Error("Missing spec or code for refinement");
    }

    // Note: Full refinement loop requires WASM tp instance
    // This is a placeholder for the refinement logic
    const remaining = this.config.maxTotalCorrections - this.state.correctionCount;
    if (remaining <= 0) {
      this.emit({
        type: "stage_error",
        stage: "refine",
        message: "Correction budget exhausted",
      });
      return;
    }

    // Use AI to refine the code
    const { refineCode } = await import("./stages/refine.js");
    const { buildGeometricRefinePrompt } = await import("./prompts/code_review.js");
    const { GEOMETRIC_REFINE_SYSTEM } = await import("./prompts/code_review.js");
    const { extractCode } = await import("./prompts/code_generation.js");

    const issues = this.state.review?.issues ?? [];
    const prompt = buildGeometricRefinePrompt(code.source, issues);
    const rawResponse = await this.config.llm.complete(prompt, GEOMETRIC_REFINE_SYSTEM);
    const correctedSource = extractCode(rawResponse);

    // Update code
    const correctedCode: GeneratedCode = {
      ...code,
      source: correctedSource,
    };
    storeCode(this.state, correctedCode);
    incrementCorrection(this.state);
    saveState(this.config.workDir, this.state);

    this.emit({
      type: "stage_complete",
      stage: "refine",
      message: "Code refined",
      data: correctedCode,
    });
  }

  // -----------------------------------------------------------------------
  // Resume from saved state
  // -----------------------------------------------------------------------

  /**
   * Resume the pipeline from the last saved state.
   * Useful for continuing after interruption.
   */
  async resume(): Promise<PipelineState> {
    this.state = loadState(this.config.workDir);

    switch (this.state.stage) {
      case "intake":
        if (this.state.referenceImage) {
          await this.runIntakeStage(this.state.referenceImage);
        }
        break;
      case "spec":
        await this.runSpecStage();
        break;
      case "build":
        await this.runBuildStage();
        break;
      case "review":
        await this.runReviewStage();
        break;
      case "refine":
        await this.runRefineStage();
        break;
      default:
        break;
    }

    return this.state;
  }
}
