/**
 * Stage A: VIEW INTAKE.
 *
 * Before any geometry, establish *how* the object is depicted. A photograph and
 * a three-view engineering drawing support completely different guarantees, and
 * conflating them is how a pipeline ends up inventing dimensions it cannot
 * possibly have read.
 */

import { readFileSync } from "fs";
import type { LLMProvider } from "../types.js";
import type { ScaleReference, UnitSystem, ViewKind, ViewSet, ViewSpec } from "../cad/model.js";
import { makeUnitSystem } from "../cad/model.js";
import {
  VIEW_INTAKE_SYSTEM,
  buildViewIntakePrompt,
  parseJsonResponse,
} from "../prompts/feature_tree.js";

const KNOWN_KINDS: ReadonlySet<string> = new Set([
  "front",
  "top",
  "right",
  "left",
  "back",
  "bottom",
  "iso",
  "photo",
]);

const DRAWING_KINDS: ReadonlySet<string> = new Set([
  "engineering_drawing",
  "photo",
  "sketch",
  "mixed",
]);

export interface ViewIntakeResult {
  viewSet: ViewSet;
  warnings: string[];
}

/**
 * Classify the drawing and enumerate its views.
 */
export async function runViewIntake(
  imagePath: string,
  llm: LLMProvider,
  opts?: { profile?: string; context?: string; industry?: string },
): Promise<ViewIntakeResult> {
  const imageBase64 = readFileSync(imagePath).toString("base64");
  const prompt = buildViewIntakePrompt(opts);
  const raw = await llm.analyzeImage(imageBase64, prompt);
  const parsed = parseJsonResponse(raw, "view intake");
  return coerceViewSet(parsed);
}

/** Turn an unvalidated AI response into a ViewSet, flagging what it got wrong. */
export function coerceViewSet(parsed: Record<string, unknown>): ViewIntakeResult {
  const warnings: string[] = [];

  let drawingKind = String(parsed.drawingKind ?? "");
  if (!DRAWING_KINDS.has(drawingKind)) {
    warnings.push(
      `Unrecognized drawingKind "${drawingKind}" — defaulting to "mixed", which means scale is treated as unreliable`,
    );
    drawingKind = "mixed";
  }

  const rawViews = Array.isArray(parsed.views) ? parsed.views : [];
  const views: ViewSpec[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < rawViews.length; i++) {
    const v = rawViews[i] as Record<string, unknown>;
    const kind = String(v.kind ?? "");
    if (!KNOWN_KINDS.has(kind)) {
      warnings.push(`View ${i}: unknown kind "${kind}" — dropped`);
      continue;
    }
    const id = typeof v.id === "string" && v.id ? v.id : `v_${kind}_${i}`;
    if (seenIds.has(id)) {
      warnings.push(`View ${i}: duplicate id "${id}" — dropped`);
      continue;
    }
    seenIds.add(id);

    const confidence = Number(v.confidence);
    views.push({
      id,
      kind: kind as ViewKind,
      projectionPlane: typeof v.projectionPlane === "string" ? (v.projectionPlane as ViewSpec["projectionPlane"]) : undefined,
      region: Array.isArray(v.region) && v.region.length === 4
        ? (v.region.map(Number) as [number, number, number, number])
        : undefined,
      isSection: v.isSection === true,
      confidence: isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5,
    });
  }

  if (views.length === 0) {
    warnings.push("No usable views were identified");
  }

  // A photo can only ever give one view.
  if (drawingKind === "photo" && views.length > 1) {
    warnings.push(
      `${views.length} views were reported for a photograph — only the first is reliable; the rest cannot be separate viewpoints of a single photo`,
    );
  }

  const units: UnitSystem = parsed.units && typeof parsed.units === "object"
    ? makeUnitSystem(String((parsed.units as Record<string, unknown>).length ?? "mm") as UnitSystem["length"])
    : makeUnitSystem("mm");

  const scale = coerceScale(parsed.scale, warnings);
  if (!scale) {
    warnings.push(
      "No scale evidence in the image — all dimensions are relative, and absolute size is an assumption",
    );
  }

  const undetermined = Array.isArray(parsed.undetermined)
    ? (parsed.undetermined as unknown[]).map(String)
    : [];

  // Depth is always undetermined from a single view; state it rather than let a
  // later stage quietly guess.
  if (views.length === 1 && views[0].kind !== "iso") {
    undetermined.push(
      `Depth along the ${views[0].kind} view's normal axis is not visible in the image`,
    );
  }

  return {
    viewSet: {
      drawingKind: drawingKind as ViewSet["drawingKind"],
      views,
      scale,
      units,
      undetermined: dedupe(undetermined),
    },
    warnings,
  };
}

function coerceScale(raw: unknown, warnings: string[]): ScaleReference | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  const realLength = Number(s.realLength);
  const imageLength = Number(s.imageLength);
  if (!isFinite(realLength) || !isFinite(imageLength) || realLength <= 0 || imageLength <= 0) {
    warnings.push("Scale evidence was reported but its lengths are not usable numbers — ignored");
    return undefined;
  }
  const kind = String(s.kind ?? "assumed");
  if (!["dimension_callout", "known_feature", "assumed"].includes(kind)) {
    warnings.push(`Unknown scale kind "${kind}" — treated as assumed, so it is the weakest evidence`);
  }
  const derived = realLength / imageLength;
  const reported = Number(s.mmPerPixel);
  if (isFinite(reported) && Math.abs(reported - derived) / derived > 0.05) {
    warnings.push(
      `Reported mmPerPixel ${reported} disagrees with realLength/imageLength ${derived.toFixed(4)} — using the derived value`,
    );
  }
  return {
    kind: (["dimension_callout", "known_feature", "assumed"].includes(kind)
      ? kind
      : "assumed") as ScaleReference["kind"],
    label: typeof s.label === "string" ? s.label : undefined,
    realLength,
    imageLength,
    mmPerPixel: derived,
  };
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}
