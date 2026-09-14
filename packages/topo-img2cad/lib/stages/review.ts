/**
 * Stage 4: REVIEW — Geometric validation and sandbox execution
 *
 * Executes the generated code in a sandbox, validates geometric output,
 * and produces a detailed review report.
 */

import type {
  LLMProvider,
  GeneratedCode,
  ReviewResult,
  ReviewIssue,
  GeometryReport,
  SandboxOutput,
} from "../types.js";
import { validateGeometry } from "../validators/geometric.js";
import { validateCodeSyntax, quickSyntaxCheck } from "../validators/code_syntax.js";
import { checkPrimitiveCoverage } from "../validators/primitive_coverage.js";
import { buildCodeReviewPrompt, parseReviewResponse } from "../prompts/code_review.js";
import { CODE_REVIEW_SYSTEM } from "../prompts/code_review.js";

// ---------------------------------------------------------------------------
// Sandbox execution
// ---------------------------------------------------------------------------

export interface SandboxResult {
  /** The shape returned by the code */
  shape: unknown;
  /** Console logs */
  logs: string[];
  /** Warnings */
  warnings: string[];
  /** Error if execution failed */
  error?: string;
  /** Stack trace */
  stack?: string;
  /** Execution time in ms */
  elapsed: number;
  /** Whatever `createModel` wrote into its `__solveReports` argument. */
  solveReports: Record<string, unknown>;
}

/**
 * Make a generated artifact runnable.
 *
 * Emitted artifacts are reusable functions (`function createModel(...)`); the
 * sandbox evaluates a script, so the entry point has to be invoked. Detecting
 * the declaration keeps both conventions working — a script that calls
 * `render()` itself, and a function that needs calling.
 */
export function prepareScript(code: string, entryPoint = "createModel"): string {
  const declared = new RegExp(`function\\s+${entryPoint}\\s*\\(`).test(code);
  if (!declared) return code;
  // Already invoked? Leave it alone.
  const invoked = new RegExp(`^\\s*${entryPoint}\\s*\\(`, "m").test(code);
  if (invoked) return code;
  return `${code}\n${entryPoint}(tp, CQWorkplane, pnt, vec, gpVec, render, console, __solveReports);`;
}

/**
 * Execute generated code in a sandboxed environment.
 *
 * This function creates a safe execution context similar to topo-editor's runner.
 * It requires a WASM tp instance and CQWorkplane to be available.
 */
export function executeInSandbox(
  code: string,
  tp: any,
  CQWorkplane: any,
  pnt: any,
  vec: any,
  gpVec: any,
): SandboxResult {
  const logs: string[] = [];
  const warnings: string[] = [];
  let shape: unknown = null;
  let error: string | undefined;
  let stack: string | undefined;

  const sandboxConsole = {
    log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
    warn: (...args: unknown[]) => warnings.push(args.map(String).join(" ")),
    error: (...args: unknown[]) => warnings.push(args.map(String).join(" ")),
  };

  const collected: unknown[] = [];
  const renderFn = (val: unknown) => {
    collected.push(val);
  };

  const solveReports: Record<string, unknown> = {};
  const start = performance.now();

  try {
    // Use Function constructor for sandboxed evaluation
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      "tp", "CQWorkplane", "pnt", "vec", "gpVec", "render", "console", "__solveReports",
      prepareScript(code),
    );
    const result = fn(tp, CQWorkplane, pnt, vec, gpVec, renderFn, sandboxConsole, solveReports);

    // Prefer an explicit render() call; fall back to the entry point's return.
    if (collected.length > 0) {
      shape = collected[collected.length - 1];
    } else if (result != null) {
      shape = result;
    }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    error = err.message;
    stack = err.stack;
  }

  const elapsed = performance.now() - start;

  return { shape, logs, warnings, error, stack, elapsed, solveReports };
}

// ---------------------------------------------------------------------------
// Multi-level validation
// ---------------------------------------------------------------------------

/** L0: Syntax validation */
function validateSyntax(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  const syntaxResult = quickSyntaxCheck(code);
  if (!syntaxResult.valid) {
    issues.push({
      severity: "error",
      code: "REV_SYNTAX_ERROR",
      message: `Syntax error: ${syntaxResult.error}`,
      suggestion: "Fix the TypeScript syntax errors",
    });
  }

  issues.push(...validateCodeSyntax(code));
  return issues;
}

/** L1: Execution validation */
function validateExecution(result: SandboxResult): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  if (result.error) {
    issues.push({
      severity: "error",
      code: "REV_EXECUTION_ERROR",
      message: `Execution error: ${result.error}`,
      suggestion: "Fix the runtime error in the generated code",
    });
  }

  if (result.shape == null && !result.error) {
    issues.push({
      severity: "error",
      code: "REV_NO_SHAPE",
      message: "Code executed but produced no shape",
      suggestion: "Ensure the code calls render() with a valid shape",
    });
  }

  return issues;
}

/** L2: Geometric validation */
function validateGeo(tp: any, shape: unknown): {
  report: GeometryReport;
  issues: ReviewIssue[];
} {
  return validateGeometry(tp, shape);
}

// ---------------------------------------------------------------------------
// Main review pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full review pipeline on generated code.
 *
 * Levels:
 * - L0: TypeScript syntax + API correctness
 * - L1: Sandbox execution
 * - L2: Geometric properties (volume, bbox, etc.)
 * - L3: AI code review (optional)
 */
export async function runReview(
  code: GeneratedCode,
  tp: any,
  CQWorkplane: any,
  pnt: any,
  vec: any,
  gpVec: any,
  llm?: LLMProvider,
  opts?: {
    expectedTypes?: string[];
    runAiReview?: boolean;
  },
): Promise<ReviewResult> {
  const allIssues: ReviewIssue[] = [];
  let geometry: GeometryReport = { shapeValid: false };
  let sandboxOutput: SandboxOutput = { logs: [], warnings: [] };
  let executionTime = 0;

  // L0: Syntax
  const syntaxIssues = validateSyntax(code.source);
  allIssues.push(...syntaxIssues);

  // If critical syntax errors, skip execution
  const hasCriticalSyntax = syntaxIssues.some((i) => i.severity === "error");
  if (!hasCriticalSyntax) {
    // L1: Execution
    const execResult = executeInSandbox(code.source, tp, CQWorkplane, pnt, vec, gpVec);
    executionTime = execResult.elapsed;
    sandboxOutput = {
      logs: execResult.logs,
      warnings: execResult.warnings,
      error: execResult.error,
      stack: execResult.stack,
    };
    allIssues.push(...validateExecution(execResult));

    // L2: Geometry
    if (execResult.shape != null) {
      const geoResult = validateGeo(tp, execResult.shape);
      geometry = geoResult.report;
      allIssues.push(...geoResult.issues);
    }

    // Primitive coverage
    if (opts?.expectedTypes) {
      allIssues.push(...checkPrimitiveCoverage(code.source, opts.expectedTypes));
    }
  }

  // L3: AI review (optional)
  if (opts?.runAiReview && llm) {
    try {
      const prompt = buildCodeReviewPrompt(code.source, geometry as unknown as Record<string, unknown>);
      const rawResponse = await llm.complete(prompt, CODE_REVIEW_SYSTEM);
      const aiReview = parseReviewResponse(rawResponse);
      if (aiReview.issues && Array.isArray(aiReview.issues)) {
        for (const issue of aiReview.issues) {
          allIssues.push(issue as ReviewIssue);
        }
      }
    } catch {
      // AI review is best-effort
    }
  }

  // Determine pass/fail
  const hasErrors = allIssues.some((i) => i.severity === "error");
  const passed = !hasErrors && geometry.shapeValid;

  return {
    passed,
    geometry,
    executionTime,
    issues: allIssues,
    sandboxOutput,
  };
}
