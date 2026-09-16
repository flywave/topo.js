/**
 * Sketch solver gate.
 *
 * A sketch that fails to solve still produces geometry — the solver leaves the
 * input coordinates alone and reports a high residual. Downstream that reads as
 * "the model built fine" while the part is silently the wrong size, which is
 * exactly the failure mode a geometric check cannot see. So the solver's own
 * report is treated as a first-class gate.
 */

import type { ReviewIssue } from "../types.js";
import type { SketchSolveReport } from "../cad/model.js";

// ---------------------------------------------------------------------------
// Raw solve_status() shape
// ---------------------------------------------------------------------------

/** What `Sketch.solve_status()` returns, loosely typed because it is a Record. */
export interface RawSolveStatus {
  /** Set when the kernel threw instead of returning a status. */
  note?: unknown;
  status?: unknown;
  cost?: unknown;
  x?: unknown;
}

/**
 * NLopt result codes, as surfaced by the binding.
 *
 * 1-3 are "converged, with a caveat" (suboptimal, roundoff-limited, hit the
 * iteration cap); 4 is a clean success. Anything outside 1-4 is a failure.
 */
export const SUCCESS_CODES: ReadonlySet<number> = new Set([1, 2, 3, 4]);
export const CLEAN_SUCCESS_CODE = 4;

/** Residual below which the constraints are considered satisfied. */
export const DEFAULT_COST_TOLERANCE = 1e-6;

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export function normalizeSolveStatus(raw: RawSolveStatus): SketchSolveReport {
  const status = typeof raw.status === "number" ? raw.status : Number(raw.status);
  const cost = typeof raw.cost === "number" ? raw.cost : Number(raw.cost);
  const dof = Array.isArray(raw.x) ? raw.x.length : 0;

  return {
    status: isFinite(status) ? status : -1,
    cost: isFinite(cost) ? cost : Infinity,
    note: typeof raw.note === "string" ? raw.note : undefined,
    converged: SUCCESS_CODES.has(status) && isFinite(cost) && cost <= 1e-3,
    dofCount: dof,
    // A sketch with no constrained entities has nothing to solve, so a zero DOF
    // count is reported rather than treated as trivially fine.
    underconstrained: dof === 0,
  };
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

export interface SketchSolveOptions {
  costTolerance?: number;
  /** Sketches expected to have appeared in the solve reports. */
  expectedSketches?: string[];
}

export interface SketchSolveOutcome {
  reports: Record<string, SketchSolveReport>;
  issues: ReviewIssue[];
  passed: boolean;
}

/**
 * Evaluate the solve reports collected during code execution.
 *
 * `rawReports` is the `__solveReports` map the emitted code fills in — sketch id
 * to the value of `solve_status()`.
 */
export function evaluateSketchSolves(
  rawReports: Record<string, RawSolveStatus>,
  opts: SketchSolveOptions = {},
): SketchSolveOutcome {
  const tolerance = opts.costTolerance ?? DEFAULT_COST_TOLERANCE;
  const reports: Record<string, SketchSolveReport> = {};
  const issues: ReviewIssue[] = [];

  for (const [id, raw] of Object.entries(rawReports)) {
    const report = normalizeSolveStatus(raw);
    reports[id] = report;

    if (!SUCCESS_CODES.has(report.status)) {
      const threw = typeof report.note === "string" && report.note !== "";
      issues.push({
        severity: "error",
        code: "SKT_SOLVER_FAILED",
        message: threw
          ? `Sketch "${id}": the kernel's solver threw instead of returning a status — ${report.note}`
          : `Sketch "${id}": solver returned status ${report.status} (not a success code)`,
        suggestion: threw
          ? "The solver is only a cross-check — the geometry comes from the reconciled coordinates and is unaffected — but the constraints could not be verified. Fewer or simpler constraints usually get it to converge"
          : "The constraints are contradictory or the initial geometry is too far from a solution; relax or remove a conflicting constraint",
      });
      continue;
    }

    if (report.cost > tolerance) {
      issues.push({
        severity: "error",
        code: "SKT_HIGH_RESIDUAL",
        message: `Sketch "${id}": residual ${report.cost.toExponential(2)} exceeds tolerance ${tolerance.toExponential(2)} — constraints are not satisfied, so the solved geometry is not the intended geometry`,
        suggestion:
          "Usually over-constraining: two dimensions disagree with each other, or an inferred relation contradicts a dimension",
      });
    } else if (report.status !== CLEAN_SUCCESS_CODE) {
      issues.push({
        severity: "info",
        code: "SKT_SUBOPTIMAL",
        message: `Sketch "${id}": solved via status ${report.status} (converged with a caveat) at residual ${report.cost.toExponential(2)}`,
      });
    }

    if (report.underconstrained) {
      issues.push({
        severity: "warning",
        code: "SKT_NO_DOF",
        message: `Sketch "${id}": the solver reported no degrees of freedom, so nothing was solved — the constraints did not reach the geometry`,
        suggestion:
          "Check that geometry tags referenced by constraints match the tags used at creation",
      });
    }
  }

  if (opts.expectedSketches) {
    for (const id of opts.expectedSketches) {
      if (!(id in reports)) {
        issues.push({
          severity: "error",
          code: "SKT_NO_REPORT",
          message: `Sketch "${id}" produced no solve report — it was never built or solve() never ran`,
        });
      }
    }
  }

  return {
    reports,
    issues,
    passed: !issues.some((i) => i.severity === "error"),
  };
}
