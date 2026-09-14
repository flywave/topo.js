/**
 * Stage 3: BUILD — Code generation from parametric spec
 *
 * Generates topo.js / CQWorkplane TypeScript code from a parametric spec.
 * Uses AI for code generation with template guidance.
 */

import type { LLMProvider, ParametricSpec, GeneratedCode, CodeContext, ImageAnalysis } from "../types.js";
import { buildCodeGenerationPrompt, extractCode } from "../prompts/code_generation.js";
import { CODE_GENERATION_SYSTEM } from "../prompts/code_generation.js";
import { validateCodeSyntax, quickSyntaxCheck } from "../validators/code_syntax.js";
import { analyzeCoverage } from "../validators/primitive_coverage.js";
import { generateBoxCode } from "../templates/box_group.js";
import { generateCylinderCode } from "../templates/cylinder_group.js";
import { generateRevolveCode } from "../templates/revolve_group.js";
import { generateAssemblyCode } from "../templates/assembly_group.js";

// ---------------------------------------------------------------------------
// Template-based code generation (deterministic fallback)
// ---------------------------------------------------------------------------

/**
 * Try to generate code from templates (no AI needed).
 * Returns null if the spec is too complex for templates.
 */
export function tryTemplateCode(spec: ParametricSpec): GeneratedCode | null {
  const components = spec.components;
  if (components.length === 0) return null;

  // Single box component
  if (components.length === 1 && components[0].type === "box") {
    const p = components[0].params;
    const code = generateBoxCode({
      length: (p.length as number) ?? 10,
      width: (p.width as number) ?? 10,
      height: (p.height as number) ?? 10,
    });
    return {
      source: code,
      entryPoint: "createModel",
      imports: [],
      methodsUsed: ["boxCentered"],
    };
  }

  // Single cylinder/cone component
  if (components.length === 1 && (components[0].type === "cylinder" || components[0].type === "cone")) {
    const p = components[0].params;
    const code = generateCylinderCode({
      radius: (p.radius as number) ?? 5,
      height: (p.height as number) ?? 10,
      radiusTop: p.radiusTop as number | undefined,
    });
    return {
      source: code,
      entryPoint: "createModel",
      imports: [],
      methodsUsed: ["circleCentered", "extrudeSimple"],
    };
  }

  // Revolve component
  if (components.length === 1 && components[0].type === "revolve") {
    const p = components[0].params;
    const points = (p.profilePoints as unknown as Array<[number, number]>) ?? [[0, 0], [5, 0], [5, 10], [0, 10]];
    const code = generateRevolveCode({
      profilePoints: points,
      angle: p.angle as number | undefined,
    });
    return {
      source: code,
      entryPoint: "createModel",
      imports: [],
      methodsUsed: ["moveTo", "lineTo", "close", "revolveSimple"],
    };
  }

  // Multi-component → assembly
  if (components.length > 1 && components.every((c) => ["box", "cylinder", "sphere"].includes(c.type))) {
    const code = generateAssemblyCode(components.map((c) => ({
      name: c.name,
      type: c.type,
      params: c.params as Record<string, number>,
      location: c.location,
      color: c.color,
    })));
    return {
      source: code,
      entryPoint: "createModel",
      imports: [],
      methodsUsed: ["boxCentered", "circleCentered", "extrudeSimple"],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// AI-powered code generation
// ---------------------------------------------------------------------------

/**
 * Build the code generation context.
 */
export function buildCodeContext(
  spec: ParametricSpec,
  analysis?: ImageAnalysis,
  previousCode?: string,
  previousIssues?: Array<{ message: string; suggestion?: string }>,
): CodeContext {
  return {
    availableMethods: [
      "boxCentered", "circleCentered", "rectCentered", "polygonSimple",
      "extrudeSimple", "revolveSimple", "loftSimple", "sweep",
      "cut", "union", "intersect",
      "fillet", "chamfer", "shell", "holeThrough",
      "translate", "rotate", "mirror",
    ],
    availablePrimitives: [
      "box", "cylinder", "cone", "sphere", "torus", "wedge",
      "revolve", "extrude", "sweep", "loft", "pipe",
    ],
    examples: [],
    analysis,
    spec,
    previousIssues: previousIssues as CodeContext["previousIssues"],
    previousCode,
  };
}

/**
 * Generate code from a parametric spec.
 *
 * Steps:
 * 1. Try template-based generation (fast, no AI)
 * 2. If template fails, use AI generation
 * 3. Validate generated code
 */
export async function runBuild(
  spec: ParametricSpec,
  llm: LLMProvider,
  opts?: {
    analysis?: ImageAnalysis;
    previousCode?: string;
    previousIssues?: Array<{ message: string; suggestion?: string }>;
  },
): Promise<GeneratedCode> {
  // Step 1: Try template
  const templateResult = tryTemplateCode(spec);
  if (templateResult) {
    // Validate template code
    const syntaxResult = quickSyntaxCheck(templateResult.source);
    if (syntaxResult.valid) {
      return templateResult;
    }
    // Template code has syntax error — fall through to AI
  }

  // Step 2: AI generation
  const context = buildCodeContext(spec, opts?.analysis, opts?.previousCode, opts?.previousIssues);
  const prompt = buildCodeGenerationPrompt(spec as unknown as Record<string, unknown>, {
    examples: context.examples,
    previousCode: opts?.previousCode,
    previousIssues: opts?.previousIssues,
  });
  const rawResponse = await llm.complete(prompt, CODE_GENERATION_SYSTEM);

  // Step 3: Extract and validate code
  const source = extractCode(rawResponse);
  const syntaxIssues = validateCodeSyntax(source);
  const coverage = analyzeCoverage(source);

  return {
    source,
    entryPoint: "createModel",
    imports: [],
    methodsUsed: coverage.usedMethods,
    parametricBuilder: generateParametricBuilder(spec),
  };
}

// ---------------------------------------------------------------------------
// Parametric builder generation
// ---------------------------------------------------------------------------

/** Generate a parametric builder registration function. */
function generateParametricBuilder(spec: ParametricSpec): string | undefined {
  if (spec.parameters.length === 0) return undefined;

  const paramNames = spec.parameters.map((p) => p.name);
  const defaults = spec.parameters.map((p) => p.default);

  return `
// Parametric builder registration
function registerBuilder(tp) {
  const { registerParametricBuilder } = require("topo-primitives");
  registerParametricBuilder("${spec.name}", (params) => {
    const shape = createModel(
      tp,
      CQWorkplane,
      pnt,
      vec,
      gpVec,
      () => {},
      console
    );
    return { shape };
  });
}
`;
}
