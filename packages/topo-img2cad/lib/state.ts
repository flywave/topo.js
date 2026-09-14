/**
 * Pipeline state management — mirrors img2threejs forge/state.py
 *
 * Each reconstruction task gets a `.topo-img2cad/state.json` file that tracks
 * stage progress, completed steps, evidence paths, and correction counts.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import type {
  PipelineState,
  PipelineStage,
  StepResult,
  ImageAnalysis,
  ParametricSpec,
  GeneratedCode,
  ReviewResult,
} from "./types.js";

const DEFAULT_MAX_CORRECTIONS_PER_STAGE = 3;
const DEFAULT_MAX_TOTAL_CORRECTIONS = 6;

// ---------------------------------------------------------------------------
// State file I/O
// ---------------------------------------------------------------------------

const STATE_FILENAME = "state.json";

function statePath(workDir: string): string {
  return join(workDir, ".topo-img2cad", STATE_FILENAME);
}

/** Initialize a new pipeline state file. */
export function initState(
  workDir: string,
  referenceImage: string,
  profile: string = "generic",
): PipelineState {
  const now = new Date().toISOString();
  const state: PipelineState = {
    stage: "idle",
    referenceImage,
    profile,
    completedSteps: {},
    correctionCount: 0,
    maxCorrectionsPerStage: DEFAULT_MAX_CORRECTIONS_PER_STAGE,
    maxTotalCorrections: DEFAULT_MAX_TOTAL_CORRECTIONS,
    createdAt: now,
    updatedAt: now,
  };
  saveState(workDir, state);
  return state;
}

/** Load state from disk. Throws if file does not exist. */
export function loadState(workDir: string): PipelineState {
  const p = statePath(workDir);
  if (!existsSync(p)) {
    throw new Error(`No state file found at ${p}. Run init first.`);
  }
  const raw = readFileSync(p, "utf-8");
  return JSON.parse(raw) as PipelineState;
}

/** Save state to disk. Creates directories as needed. */
export function saveState(workDir: string, state: PipelineState): void {
  state.updatedAt = new Date().toISOString();
  const p = statePath(workDir);
  const dir = dirname(p);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(p, JSON.stringify(state, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Stage transitions
// ---------------------------------------------------------------------------

const STAGE_ORDER: PipelineStage[] = [
  "idle",
  "intake",
  "spec",
  "build",
  "review",
  "refine",
  "complete",
];

/** Advance to the next stage. Returns the new state. */
export function advanceStage(state: PipelineState): PipelineState {
  const idx = STAGE_ORDER.indexOf(state.stage);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) {
    throw new Error(`Cannot advance from stage "${state.stage}"`);
  }
  state.stage = STAGE_ORDER[idx + 1];
  return state;
}

/** Set the pipeline to a specific stage. */
export function setStage(state: PipelineState, stage: PipelineStage): PipelineState {
  state.stage = stage;
  return state;
}

// ---------------------------------------------------------------------------
// Step tracking
// ---------------------------------------------------------------------------

/** Mark a step as completed with optional evidence path. */
export function markStep(
  state: PipelineState,
  stepId: string,
  evidence?: string,
): PipelineState {
  state.completedSteps[stepId] = {
    stepId,
    status: "completed",
    evidence,
  };
  return state;
}

/** Mark a step as skipped with a reason. */
export function skipStep(
  state: PipelineState,
  stepId: string,
  reason: string,
): PipelineState {
  state.completedSteps[stepId] = {
    stepId,
    status: "skipped",
    skippedReason: reason,
  };
  return state;
}

/** Mark a step as failed. */
export function failStep(
  state: PipelineState,
  stepId: string,
  error: string,
): PipelineState {
  state.completedSteps[stepId] = {
    stepId,
    status: "failed",
    error,
  };
  return state;
}

/** Check if a step has been completed. */
export function isStepCompleted(state: PipelineState, stepId: string): boolean {
  return state.completedSteps[stepId]?.status === "completed";
}

// ---------------------------------------------------------------------------
// Correction loop management
// ---------------------------------------------------------------------------

/** Increment the correction counter. Returns true if still within budget. */
export function incrementCorrection(state: PipelineState): boolean {
  state.correctionCount++;
  return state.correctionCount < state.maxTotalCorrections;
}

/** Get remaining correction budget. */
export function remainingCorrections(state: PipelineState): number {
  return Math.max(0, state.maxTotalCorrections - state.correctionCount);
}

// ---------------------------------------------------------------------------
// Output storage
// ---------------------------------------------------------------------------

/** Store analysis result in state. */
export function storeAnalysis(state: PipelineState, analysis: ImageAnalysis): PipelineState {
  state.analysis = analysis;
  return state;
}

/** Store parametric spec in state. */
export function storeSpec(state: PipelineState, spec: ParametricSpec): PipelineState {
  state.spec = spec;
  return state;
}

/** Store generated code in state. */
export function storeCode(state: PipelineState, code: GeneratedCode): PipelineState {
  state.code = code;
  return state;
}

/** Store review result in state. */
export function storeReview(state: PipelineState, review: ReviewResult): PipelineState {
  state.review = review;
  return state;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/** Get all step IDs for a given stage prefix. */
export function getStageSteps(state: PipelineState, stagePrefix: string): StepResult[] {
  return Object.values(state.completedSteps).filter((s) =>
    s.stepId.startsWith(stagePrefix),
  );
}

/** Check if all mandatory steps for a stage are completed. */
export function isStageComplete(
  state: PipelineState,
  stagePrefix: string,
  mandatorySteps: string[],
): boolean {
  return mandatorySteps.every((stepId) =>
    state.completedSteps[stepId]?.status === "completed" ||
    state.completedSteps[stepId]?.status === "skipped",
  );
}

/** Generate a human-readable status summary. */
export function statusSummary(state: PipelineState): string {
  const lines: string[] = [
    `Stage: ${state.stage}`,
    `Corrections: ${state.correctionCount}/${state.maxTotalCorrections}`,
    `Steps completed: ${Object.keys(state.completedSteps).length}`,
  ];
  if (state.referenceImage) {
    lines.push(`Reference: ${state.referenceImage}`);
  }
  return lines.join("\n");
}
