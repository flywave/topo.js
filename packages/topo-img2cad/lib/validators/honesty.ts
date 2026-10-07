/**
 * Honest grading (roadmap T2.5).
 *
 * A run that never measured anything must not report "PASSED — 0 violations":
 * zero violations because nothing was checked is the oldest lie in validation.
 * Every run therefore carries
 *
 *   - a THREE-STATE verdict: pass (measured, nothing failed), fail (a measured
 *     or structural gate failed), unevaluated (the gates did not run — no
 *     kernel, no reference silhouettes, a blocked tree);
 *   - per-gate scope statements: what each gate proves and — just as loudly —
 *     what it does not;
 *   - the dimensions that could NOT be measured, listed, so "not measured" is
 *     visible instead of absent;
 *   - a confidence grade derived from evidence completeness: how many views a
 *     shape gate actually compared, and how many stated dimensions were
 *     verified within tolerance.
 *
 * The grade is about EVIDENCE, not about the outcome: a failed run whose
 * failure was caught by measurement has good evidence. What makes a grade low
 * is silence.
 */

export type Verdict = "pass" | "fail" | "unevaluated";

export interface GateScope {
  gate: string;
  /** Whether the gate executed at all this run. */
  ran: boolean;
  /** What a green result from this gate proves. */
  proves: string;
  /** What it does NOT prove — the silence the reader must not mistake for a check. */
  doesNotProve: string;
}

export interface ConfidenceGrade {
  level: "high" | "medium" | "low";
  reasons: string[];
}

export interface ConfidenceInputs {
  verdict: Verdict;
  /** Gates that produced a measurement this run (names as in gateScopes). */
  measuredGates: string[];
  /** Orthographic views the drawing offered. */
  orthoViews: number;
  /** Views whose shape gate actually compared (reprojection or ink distance). */
  comparedViews: number;
  /** Declared dimensions evaluated against the solid. */
  dimensionsChecked: number;
  /** Declared dimensions that could not be evaluated. */
  dimensionsUnevaluated: number;
}

export function gradeConfidence(inputs: ConfidenceInputs): ConfidenceGrade {
  const reasons: string[] = [];

  if (inputs.verdict === "unevaluated") {
    return {
      level: "low",
      reasons: ["nothing was measured (no kernel, no reference, or the tree was blocked)"],
    };
  }

  let level: ConfidenceGrade["level"] = "high";

  if (inputs.orthoViews > 0 && inputs.comparedViews === 0) {
    level = "low";
    reasons.push("no view's shape was compared against the drawing");
  } else if (inputs.comparedViews < inputs.orthoViews) {
    level = "medium";
    reasons.push(
      `shape coverage: ${inputs.comparedViews}/${inputs.orthoViews} views compared`,
    );
  }

  const dimsTotal = inputs.dimensionsChecked + inputs.dimensionsUnevaluated;
  if (dimsTotal === 0) {
    if (level === "high") {
      level = "medium";
      reasons.push("no stated dimensions were available to verify individually");
    }
  } else if (inputs.dimensionsUnevaluated > 0) {
    if (level === "high") level = "medium";
    reasons.push(
      `${inputs.dimensionsUnevaluated}/${dimsTotal} stated dimensions could not be measured on the solid`,
    );
  }

  if (inputs.verdict === "fail") {
    reasons.push("the run failed — the grade describes evidence completeness, not a pass");
  }

  if (reasons.length === 0) {
    reasons.push("all views compared and every stated dimension was verified within tolerance");
  }
  return { level, reasons };
}

/**
 * Per-gate scope statements. `ran` reflects this run; the one-liners are static
 * so they cannot drift into optimism — a gate's honest limits are a property of
 * the gate, not of the run.
 */
export function gateScopesFor(state: {
  hasShape: boolean;
  reprojectionCompared: boolean;
  edgeDistanceCompared: boolean;
  dimensionsChecked: number;
  solvesReported: boolean;
  qualityContractRan: boolean;
}): GateScope[] {
  return [
    {
      gate: "geometry",
      ran: state.hasShape,
      proves: "the built body is a valid solid (positive volume, finite bounds)",
      doesNotProve: "anything about matching the drawing",
    },
    {
      gate: "reprojection",
      ran: state.reprojectionCompared,
      proves: "the model's silhouette matches the drawing's closed region — size and shape together",
      doesNotProve: "interior features the silhouette cannot see (a hole the same outline can hide)",
    },
    {
      gate: "edgeDistance",
      ran: state.edgeDistanceCompared,
      proves: "the model's outline follows the drawing's ink, with or without a closed region",
      doesNotProve: "interior features; absolute size when the comparison ran normalized",
    },
    {
      gate: "dimensions",
      ran: state.dimensionsChecked > 0,
      proves: "each evaluated stated dimension is within tolerance somewhere on the solid",
      doesNotProve: "that the feature is at the drawing's position, or dimensions listed as unevaluated",
    },
    {
      gate: "sketchSolver",
      ran: state.solvesReported,
      proves: "the sketches' constraint sets converge",
      doesNotProve: "that the converged coordinates are the drawing's",
    },
    {
      gate: "qualityContract",
      ran: state.qualityContractRan,
      proves: "the tree is complete enough to deserve a build (views entered, dimensions answered)",
      doesNotProve: "geometric correctness — that is what the measured gates are for",
    },
  ];
}
