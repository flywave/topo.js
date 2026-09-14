/**
 * Prompt templates for Stage 4: Code Review & Stage 5: Refinement
 */

export const CODE_REVIEW_SYSTEM = `You are a topo.js code reviewer. Analyze generated CAD code for correctness, completeness, and best practices.

Check for:
1. All CQWorkplane methods are called with correct arguments
2. Boolean operations reference existing components
3. Dimensions are physically reasonable (no negative radii, etc.)
4. Code handles edge cases (empty shapes, failed operations)
5. The code follows topo.js conventions

Output JSON with:
{
  "passed": boolean,
  "issues": [
    { "severity": "error"|"warning"|"info", "code": "ERR_XXX", "message": "...", "suggestion": "..." }
  ]
}`;

export function buildCodeReviewPrompt(code: string, geometry?: Record<string, unknown>): string {
  let prompt = `Review this topo.js CAD code for correctness:

\`\`\`typescript
${code}
\`\`\``;

  if (geometry) {
    prompt += `\n\nGeometry validation results:\n${JSON.stringify(geometry, null, 2)}`;
  }

  prompt += `\n\nReturn a JSON object with "passed" (boolean) and "issues" (array of {severity, code, message, suggestion}).`;
  return prompt;
}

export const GEOMETRIC_REFINE_SYSTEM = `You are a CAD code repair expert. Fix issues in topo.js code based on geometry validation errors.

Rules:
- Fix the minimal set of changes needed
- Preserve the overall structure and approach
- If a geometric operation fails, try an alternative approach
- Common fixes: adjust dimensions, change boolean order, use different primitive types
- Never remove components — fix or replace them
- Ensure all render() calls produce valid shapes`;

export function buildGeometricRefinePrompt(
  code: string,
  issues: Array<{ message: string; suggestion?: string; code?: string }>,
  geometry?: Record<string, unknown>,
): string {
  return `Fix the issues in this topo.js CAD code:

\`\`\`typescript
${code}
\`\`\`

Issues found:
${issues.map((i) => `- [${i.code ?? "UNKNOWN"}] ${i.message}${i.suggestion ? `\n  Suggestion: ${i.suggestion}` : ""}`).join("\n")}

${geometry ? `\nGeometry state:\n${JSON.stringify(geometry, null, 2)}` : ""}

Return the corrected TypeScript code. Only output the code, no explanation.`;
}

export function parseReviewResponse(raw: string): { passed: boolean; issues: unknown[] } {
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) ?? raw.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    return { passed: true, issues: [] };
  }
  try {
    const parsed = JSON.parse(jsonMatch[1].trim());
    return {
      passed: Boolean(parsed.passed),
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
    };
  } catch {
    return { passed: true, issues: [] };
  }
}
