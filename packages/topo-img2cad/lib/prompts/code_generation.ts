/**
 * Prompt templates for Stage 3: Code Generation
 *
 * Generates topo.js / CQWorkplane TypeScript code from a parametric spec.
 */

export const CODE_GENERATION_SYSTEM = `You are a topo.js / CadQuery code generation expert. Generate TypeScript code that uses the CQWorkplane API to build parametric 3D CAD models.

Available CQWorkplane methods:
- Geometry creation: boxCentered(l,w,h), circleCentered(r), rectCentered(x,y), polygonSimple(n,d)
- 2D sketching: moveTo(x,y), lineTo(x,y), line(dx,dy), hline(d), vline(d), polyline([...pts]), threePointArc(p1,p2), circle(r), polygon(n,d), rect(x,y), close()
- 3D operations: extrudeSimple(distance), revolveSimple(angleDeg), loftSimple(), sweep(path)
- Boolean: cut(other), union(other), add(other), intersect(other)
- Modification: fillet(r), chamfer(l), shell(thickness, kind), holeThrough(d), cboreHole(...)
- Transform: translate(gpVec), rotate(p1,p2,angle), mirror(plane)
- Selectors: faces(sel), edges(sel), vertices(sel), solids(sel)
- Assembly: Assembly.create(shape, loc, name, color), assembly.constrain(...)

Available helpers: pnt(tp,x,y,z), vec(tp,x,y,z), gpVec(tp,x,y,z)

Code rules:
- Function signature: \`function createModel(tp: any, CQWorkplane: any, pnt: any, vec: any, gpVec: any)\`
- Call \`render(shape)\` at the end to output the result
- Use numeric constants for all dimensions (mm)
- Chain CQWorkplane methods fluently
- For multi-component models, create each component and combine with boolean ops
- Register parametric builder if the spec has parameters
- Wrap in a try/catch for error handling`;

export function buildCodeGenerationPrompt(
  spec: Record<string, unknown>,
  context?: {
    examples?: string[];
    previousCode?: string;
    previousIssues?: Array<{ message: string; suggestion?: string }>;
  },
): string {
  let prompt = `Generate topo.js TypeScript code for this parametric specification:

SPECIFICATION:
${JSON.stringify(spec, null, 2)}

Write a complete function that:
1. Creates each component using CQWorkplane methods
2. Applies boolean operations as specified
3. Calls render() with the final shape
4. Handles errors gracefully`;

  if (context?.examples?.length) {
    prompt += `\n\nREFERENCE EXAMPLES:\n${context.examples.join("\n\n")}`;
  }

  if (context?.previousCode) {
    prompt += `\n\nPREVIOUS CODE ATTEMPT:\n${context.previousCode}`;
    if (context.previousIssues?.length) {
      prompt += `\n\nISSUES TO FIX:\n${context.previousIssues.map((i) => `- ${i.message}${i.suggestion ? ` (suggestion: ${i.suggestion})` : ""}`).join("\n")}`;
    }
  }

  prompt += `\n\nReturn ONLY the TypeScript code, no explanation. The code must be valid and executable.`;

  return prompt;
}

/** Extract code from LLM response, stripping markdown fences. */
export function extractCode(raw: string): string {
  // Remove markdown code fences
  const codeMatch = raw.match(/```(?:typescript|ts|javascript|js)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1].trim();
  }
  // If no fences, try to find the function
  const funcMatch = raw.match(/(function\s+createModel[\s\S]*)/);
  if (funcMatch) {
    return funcMatch[1].trim();
  }
  // Return raw (might be bare code)
  return raw.trim();
}
