/**
 * Prompt templates for Stage 1: Image Analysis (Intake)
 */

export const INTAKE_ANALYSIS_SYSTEM = `You are a CAD geometry expert. Analyze reference images to extract engineering-precise geometric information for parametric 3D model construction.

Output MUST be valid JSON matching the ImageAnalysis schema. Use engineering terminology (mm, degrees, radii). Be precise about geometric primitives: box, cylinder, cone, sphere, torus, wedge, revolve, extrude, sweep, loft, pipe.

Key rules:
- Identify every distinct geometric primitive visible
- Estimate dimensions in millimeters based on known reference cues
- Classify complexity: simple (1-3 primitives), moderate (4-8), complex (9-15), ultra-complex (15+)
- Flag what the single view cannot reveal (hidden faces, internal cavities)
- Confidence below 0.5 means the image is unsuitable for CAD reconstruction`;

export function buildIntakeAnalysisPrompt(opts?: {
  profile?: string;
  context?: string;
}): string {
  const profileHint = opts?.profile
    ? `\nDomain profile: ${opts.profile} — focus on relevant geometric features.`
    : "";

  const contextHint = opts?.context
    ? `\nAdditional context: ${opts.context}`
    : "";

  return `Analyze this reference image for parametric CAD reconstruction.${profileHint}${contextHint}

Extract and return a JSON object with these fields:
{
  "suitable": boolean,
  "unsuitableReason": string (if not suitable),
  "complexity": "simple" | "moderate" | "complex" | "ultra-complex",
  "confidence": number (0-1),
  "detectedPrimitives": [
    {
      "type": "box" | "cylinder" | "cone" | "sphere" | "torus" | "wedge" | "revolve" | "extrude" | "sweep" | "loft" | "pipe" | "hole" | "fillet" | "chamfer" | "shell",
      "confidence": number (0-1),
      "position": { "x": number (0-1 normalized), "y": number (0-1 normalized) },
      "dimensions": { ... estimated dimensions in mm },
      "relationships": [{ "kind": "attached_to" | "cuts_into" | "sits_on" | "aligned_with" | "concentric_with", "targetIndex": number }]
    }
  ],
  "estimatedDimensions": [length, width, height] in mm,
  "materials": [{ "region": string, "finish": "matte" | "glossy" | "metallic" | "transparent" | "textured", "color": [r, g, b] (0-255) }],
  "componentCount": number,
  "identityFeatures": [string],
  "hiddenAspects": [string]
}

Focus on:
1. What geometric primitives compose this object?
2. What are their relative positions and boolean relationships?
3. What dimensions can be estimated from the image?
4. What aspects are hidden from this view?`;
}

/** Parse LLM response into ImageAnalysis, with fallback for malformed JSON. */
export function parseIntakeResponse(raw: string): Record<string, unknown> {
  // Try to extract JSON from markdown code blocks or raw text
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error("No JSON found in intake analysis response");
  }
  try {
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error(`Malformed JSON in intake analysis: ${jsonMatch[1].slice(0, 200)}`);
  }
}
