/**
 * Stage 2: SPEC — Parametric specification generation
 *
 * Converts image analysis into a structured parametric specification
 * that can be used to generate topo.js code.
 */

import type { LLMProvider, ImageAnalysis, ParametricSpec } from "../types.js";
import {
  buildSpecGenerationPrompt,
  parseSpecResponse,
  validateSpecStructure,
} from "../prompts/spec_generation.js";
import { SPEC_GENERATION_SYSTEM } from "../prompts/spec_generation.js";

// ---------------------------------------------------------------------------
// Pre-spec assessment (deterministic)
// ---------------------------------------------------------------------------

export interface PreSpecAssessment {
  /** Estimated number of components */
  componentCount: number;
  /** Primary geometric type */
  primaryType: string;
  /** Whether assembly is needed */
  needsAssembly: boolean;
  /** Suggested code template */
  suggestedTemplate: string;
}

/** Assess the analysis to guide spec generation. */
export function preSpecAssessment(analysis: ImageAnalysis): PreSpecAssessment {
  const primitives = analysis.detectedPrimitives;
  const types = primitives.map((p) => p.type);

  // Determine primary type
  const typeCounts = new Map<string, number>();
  for (const t of types) {
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  let primaryType = "box";
  let maxCount = 0;
  for (const [t, c] of typeCounts) {
    if (c > maxCount) {
      maxCount = c;
      primaryType = t;
    }
  }

  // Determine if assembly is needed
  const needsAssembly = analysis.componentCount > 1 ||
    types.some((t) => t === "assembly") ||
    primitives.some((p) =>
      p.relationships?.some((r) => r.kind === "sits_on" || r.kind === "aligned_with"),
    );

  // Suggest template
  let suggestedTemplate: string;
  if (types.includes("revolve")) {
    suggestedTemplate = "revolve_group";
  } else if (types.includes("sweep") || types.includes("pipe")) {
    suggestedTemplate = "sweep_group";
  } else if (needsAssembly) {
    suggestedTemplate = "assembly_group";
  } else if (types.includes("cylinder") || types.includes("cone")) {
    suggestedTemplate = "cylinder_group";
  } else {
    suggestedTemplate = "box_group";
  }

  return {
    componentCount: analysis.componentCount || primitives.length,
    primaryType,
    needsAssembly,
    suggestedTemplate,
  };
}

// ---------------------------------------------------------------------------
// Spec generation
// ---------------------------------------------------------------------------

/**
 * Generate a parametric spec from image analysis.
 *
 * Steps:
 * 1. Pre-spec assessment (deterministic)
 * 2. AI spec generation
 * 3. Parse and validate
 */
export async function runSpec(
  analysis: ImageAnalysis,
  llm: LLMProvider,
  opts?: { context?: string },
): Promise<{ spec: ParametricSpec; assessment: PreSpecAssessment }> {
  // Step 1: Pre-spec assessment
  const assessment = preSpecAssessment(analysis);

  // Step 2: AI spec generation
  const prompt = buildSpecGenerationPrompt(analysis as unknown as Record<string, unknown>);
  const rawResponse = await llm.complete(prompt, SPEC_GENERATION_SYSTEM);

  // Step 3: Parse
  const parsed = parseSpecResponse(rawResponse);

  // Validate structure
  const errors = validateSpecStructure(parsed);
  if (errors.length > 0) {
    // Try to recover — log errors but continue with partial spec
    console.warn("Spec validation warnings:", errors);
  }

  // Coerce into ParametricSpec
  const spec: ParametricSpec = {
    name: (parsed.name as string) ?? "unnamed_model",
    sourceImage: undefined,
    description: (parsed.description as string) ?? "",
    components: Array.isArray(parsed.components)
      ? (parsed.components as ParametricSpec["components"])
      : [],
    parameters: Array.isArray(parsed.parameters)
      ? (parsed.parameters as ParametricSpec["parameters"])
      : [],
  };

  return { spec, assessment };
}

/**
 * Refine a spec based on review feedback.
 */
export async function refineSpec(
  spec: ParametricSpec,
  issues: Array<{ message: string; suggestion?: string }>,
  llm: LLMProvider,
): Promise<ParametricSpec> {
  const prompt = `Refine this parametric specification based on the following issues:

SPEC:
${JSON.stringify(spec, null, 2)}

ISSUES:
${issues.map((i) => `- ${i.message}${i.suggestion ? ` (suggestion: ${i.suggestion})` : ""}`).join("\n")}

Return the corrected JSON specification. Only output the JSON.`;

  const rawResponse = await llm.complete(prompt, SPEC_GENERATION_SYSTEM);
  const parsed = parseSpecResponse(rawResponse);

  return {
    ...spec,
    ...parsed,
    name: (parsed.name as string) ?? spec.name,
    components: Array.isArray(parsed.components)
      ? (parsed.components as ParametricSpec["components"])
      : spec.components,
  } as ParametricSpec;
}
