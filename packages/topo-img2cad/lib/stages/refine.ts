/**
 * Stage 5: REFINE — Self-correction loop
 *
 * When review fails, diagnose the issues and generate corrected code.
 * Runs in a loop until the code passes review or the correction budget
 * is exhausted.
 */

import type {
  LLMProvider,
  GeneratedCode,
  ReviewResult,
  ReviewIssue,
  RefinementResult,
  ParametricSpec,
} from "../types.js";
import {
  buildGeometricRefinePrompt,
  CODE_REVIEW_SYSTEM,
  GEOMETRIC_REFINE_SYSTEM,
} from "../prompts/code_review.js";
import { extractCode } from "../prompts/code_generation.js";

// ---------------------------------------------------------------------------
// Issue diagnosis (deterministic categorization)
// ---------------------------------------------------------------------------

export interface DiagnosedIssue {
  /** Original issue */
  issue: ReviewIssue;
  /** Category for targeted fix */
  category: "syntax" | "api" | "geometric" | "boolean" | "dimension" | "unknown";
  /** Priority (lower = more important) */
  priority: number;
}

/** Categorize and prioritize issues for targeted fixing. */
export function diagnoseIssues(issues: ReviewIssue[]): DiagnosedIssue[] {
  return issues
    .filter((i) => i.severity === "error" || i.severity === "warning")
    .map((issue) => {
      let category: DiagnosedIssue["category"] = "unknown";
      let priority = 10;

      if (issue.code?.startsWith("SYN_")) {
        category = "syntax";
        priority = issue.severity === "error" ? 1 : 2;
      } else if (issue.code?.startsWith("REV_EXECUTION")) {
        category = "api";
        priority = 3;
      } else if (issue.code?.startsWith("GEO_")) {
        if (issue.code.includes("VOLUME") || issue.code.includes("NULL")) {
          category = "geometric";
          priority = 4;
        } else if (issue.code.includes("BBOX")) {
          category = "dimension";
          priority = 5;
        } else {
          category = "geometric";
          priority = 6;
        }
      } else if (issue.message?.toLowerCase().includes("boolean") || issue.message?.toLowerCase().includes("cut")) {
        category = "boolean";
        priority = 7;
      } else if (issue.message?.toLowerCase().includes("dimension") || issue.message?.toLowerCase().includes("size")) {
        category = "dimension";
        priority = 8;
      }

      return { issue, category, priority };
    })
    .sort((a, b) => a.priority - b.priority);
}

// ---------------------------------------------------------------------------
// Code correction
// ---------------------------------------------------------------------------

/**
 * Attempt to fix code based on review issues.
 *
 * Strategy:
 * 1. For simple issues, apply deterministic fixes
 * 2. For complex issues, use AI to generate corrected code
 */
export async function refineCode(
  code: GeneratedCode,
  review: ReviewResult,
  spec: ParametricSpec,
  llm: LLMProvider,
  tp: any,
  CQWorkplane: any,
  pnt: any,
  vec: any,
  gpVec: any,
): Promise<RefinementResult> {
  const diagnosed = diagnoseIssues(review.issues);
  const changes: string[] = [];

  // Try deterministic fixes first
  let correctedSource = code.source;

  for (const d of diagnosed) {
    if (d.category === "syntax") {
      // Fix known syntax patterns
      if (d.issue.code === "SYN_NO_RENDER") {
        correctedSource = addRenderCall(correctedSource);
        changes.push("Added missing render() call");
      }
      if (d.issue.code === "SYN_EXTRUDE_BOTH_BUG") {
        correctedSource = fixExtrudeBoth(correctedSource);
        changes.push("Replaced extrude(both=true) with boxCentered()");
      }
    }
  }

  // If deterministic fixes didn't resolve, use AI
  if (changes.length === 0 || review.issues.some((i) => i.severity === "error")) {
    const aiResult = await aiRefineCode(correctedSource, review.issues, llm);
    correctedSource = aiResult;
    changes.push("AI-generated code correction");
  }

  return {
    correctedCode: correctedSource,
    changes,
    isFinalAttempt: false, // Caller decides based on correction count
  };
}

// ---------------------------------------------------------------------------
// Deterministic fix helpers
// ---------------------------------------------------------------------------

function addRenderCall(code: string): string {
  if (code.includes("render(")) return code;

  // Find the last assignment or expression
  const lines = code.split("\n");
  let insertIdx = lines.length - 1;

  // Find the closing } of the try block or function
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "}") {
      insertIdx = i;
      break;
    }
  }

  // Find the last variable name that looks like a shape
  let lastShapeVar = "body";
  for (let i = insertIdx - 1; i >= 0; i--) {
    const match = lines[i].match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (match) {
      lastShapeVar = match[1];
      break;
    }
  }

  lines.splice(insertIdx, 0, `    render(${lastShapeVar});`);
  return lines.join("\n");
}

function fixExtrudeBoth(code: string): string {
  // Replace extrude(both=true) patterns with boxCentered
  return code
    .replace(/(\w+)\s*=\s*\w+\.rectCentered\(([^)]+)\)\.extrudeSimple\(([^)]+),\s*(?:both\s*=\s*true|true)\)/g,
      "$1 = CQWorkplane.boxCentered($2, $3 * 2)")
    .replace(/\.extrudeSimple\(([^)]+),\s*both\s*=\s*true\)/g, ".extrudeSimple($1)");
}

// ---------------------------------------------------------------------------
// AI-powered refinement
// ---------------------------------------------------------------------------

async function aiRefineCode(
  code: string,
  issues: ReviewIssue[],
  llm: LLMProvider,
): Promise<string> {
  const errorIssues = issues.filter((i) => i.severity === "error");
  const prompt = buildGeometricRefinePrompt(code, errorIssues);
  const rawResponse = await llm.complete(prompt, GEOMETRIC_REFINE_SYSTEM);
  return extractCode(rawResponse);
}

// ---------------------------------------------------------------------------
// Refinement loop controller
// ---------------------------------------------------------------------------

export interface RefinementLoopResult {
  /** Final code after all refinement attempts */
  code: GeneratedCode;
  /** Whether refinement succeeded */
  succeeded: boolean;
  /** Total refinement attempts made */
  attempts: number;
  /** History of changes */
  history: Array<{ attempt: number; changes: string[]; issues: number }>;
}

/**
 * Run the refinement loop until the code passes review or budget is exhausted.
 */
export async function runRefinementLoop(
  initialCode: GeneratedCode,
  spec: ParametricSpec,
  tp: any,
  CQWorkplane: any,
  pnt: any,
  vec: any,
  gpVec: any,
  llm: LLMProvider,
  opts: {
    maxAttempts?: number;
    reviewFn: (code: GeneratedCode) => Promise<ReviewResult>;
  },
): Promise<RefinementLoopResult> {
  const maxAttempts = opts.maxAttempts ?? 3;
  let currentCode = initialCode;
  const history: RefinementLoopResult["history"] = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Review current code
    const review = await opts.reviewFn(currentCode);
    history.push({
      attempt,
      changes: [],
      issues: review.issues.length,
    });

    if (review.passed) {
      return {
        code: currentCode,
        succeeded: true,
        attempts: attempt,
        history,
      };
    }

    // Refine
    const result = await refineCode(currentCode, review, spec, llm, tp, CQWorkplane, pnt, vec, gpVec);

    currentCode = {
      ...currentCode,
      source: result.correctedCode,
    };
    history[history.length - 1].changes = result.changes;
  }

  return {
    code: currentCode,
    succeeded: false,
    attempts: maxAttempts,
    history,
  };
}
