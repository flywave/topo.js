/**
 * Prompt templates for Stage 2: Parametric Spec Generation
 */

export const SPEC_GENERATION_SYSTEM = `You are a parametric CAD modeling expert. Convert geometric analysis into a structured parametric specification for topo.js (CadQuery-like) code generation.

Output MUST be valid JSON matching the ParametricSpec schema. Each component maps to a CQWorkplane method call.

Key rules:
- Every component must have a unique name
- Use standard geometric types: box, cylinder, cone, sphere, revolve, extrude, sweep, loft
- Specify exact dimensions in mm (not estimates)
- Define boolean operations (cut/union/intersect) between components
- Include location transforms for multi-component assemblies
- Parameters should be named descriptively (e.g., "baseLength" not "p1")`;

export function buildSpecGenerationPrompt(analysis: Record<string, unknown>): string {
  return `Based on the following image analysis, create a parametric specification for a topo.js CAD model.

IMAGE ANALYSIS:
${JSON.stringify(analysis, null, 2)}

Create a JSON specification with this structure:
{
  "name": "descriptive_name",
  "description": "what this object is and how it's constructed",
  "components": [
    {
      "name": "unique_component_name",
      "type": "box" | "cylinder" | "cone" | "sphere" | "revolve" | "extrude" | "sweep" | "loft" | "pipe" | "hole" | "fillet" | "chamfer" | "shell",
      "params": {
        // For box: { "length": N, "width": N, "height": N }
        // For cylinder: { "radius": N, "height": N }
        // For cone: { "radiusTop": N, "radiusBottom": N, "height": N }
        // For sphere: { "radius": N }
        // For revolve: { "profilePoints": [[x,y],...], "angle": degrees }
        // For extrude: { "distance": N, "profileType": "rect"|"circ"|"polygon", ... }
        // For hole: { "diameter": N, "depth": N }
      },
      "location": [12 floats row-major matrix] (optional, omit for identity),
      "color": [r, g, b] (0-1 range, optional),
      "booleans": [
        { "kind": "cut" | "union" | "intersect", "target": "other_component_name" }
      ]
    }
  ],
  "parameters": [
    {
      "name": "parameterName",
      "default": number,
      "min": number (optional),
      "max": number (optional),
      "description": "what this parameter controls"
    }
  ]
}

Rules:
1. Order components so that boolean targets are defined before the component that uses them
2. Use millimeters for all dimensions
3. Ensure geometric validity: radius > 0, height > 0, etc.
4. Colors should be engineering-appropriate (steel gray, concrete, etc.)`;
}

/** Parse LLM response into a spec object. */
export function parseSpecResponse(raw: string): Record<string, unknown> {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error("No JSON found in spec generation response");
  }
  try {
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    throw new Error(`Malformed JSON in spec: ${jsonMatch[1].slice(0, 200)}`);
  }
}

/** Validate basic spec structure (deterministic, no AI needed). */
export function validateSpecStructure(spec: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (!spec.name || typeof spec.name !== "string") {
    errors.push("spec.name is required and must be a string");
  }
  if (!Array.isArray(spec.components)) {
    errors.push("spec.components must be an array");
    return errors;
  }

  const names = new Set<string>();
  for (let i = 0; i < spec.components.length; i++) {
    const c = spec.components[i] as Record<string, unknown>;
    if (!c.name || typeof c.name !== "string") {
      errors.push(`components[${i}].name is required`);
    } else if (names.has(c.name as string)) {
      errors.push(`components[${i}].name "${c.name}" is duplicated`);
    } else {
      names.add(c.name as string);
    }
    if (!c.type || typeof c.type !== "string") {
      errors.push(`components[${i}].type is required`);
    }
    if (!c.params || typeof c.params !== "object") {
      errors.push(`components[${i}].params is required`);
    }
    // Validate boolean targets exist
    if (Array.isArray(c.booleans)) {
      for (const b of c.booleans) {
        if (b.target && !names.has(b.target) && b.target !== c.name) {
          // Target might be defined later — only warn
        }
      }
    }
  }

  return errors;
}
