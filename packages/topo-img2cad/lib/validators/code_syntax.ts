/**
 * Code syntax validation — deterministic checks on generated TypeScript code.
 *
 * These validators run WITHOUT AI — they check code structure and syntax.
 */

import type { ReviewIssue } from "../types.js";

// ---------------------------------------------------------------------------
// CQWorkplane API surface (known methods)
// ---------------------------------------------------------------------------

const KNOWN_CQWORKPLANE_METHODS = new Set([
  // Geometry creation
  "boxCentered", "circleCentered", "rectCentered", "polygonSimple",
  // 2D sketching
  "moveTo", "lineTo", "line", "hline", "vline", "hlineTo", "vlineTo",
  "polyline", "threePointArc", "sagittaArc", "circle", "ellipse",
  "polygon", "rect", "close", "rarray",
  // 3D operations
  "extrudeSimple", "revolveSimple", "loftSimple", "sweep",
  "twistExtrude", "revolve",
  // Boolean
  "cut", "union", "add", "intersect",
  // Modification
  "fillet", "chamfer", "shell", "holeThrough", "cboreHole", "cskHole", "hole",
  "cutThruAll", "offset2D",
  // Transform
  "translate", "rotate", "mirror", "mirrorX", "mirrorY", "transformed",
  // Selectors
  "faces", "edges", "vertices", "solids", "shells", "compounds", "wires",
  // Assembly
  "sketch", "section", "split",
  // Special
  "val", "value", "center",
]);

// Known helper functions
const KNOWN_HELPERS = new Set(["pnt", "vec", "gpVec"]);

// Known global objects
const KNOWN_GLOBALS = new Set(["tp", "CQ", "CQWorkplane", "render", "console"]);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate generated code for syntax and API correctness.
 * Returns issues found (empty array = no issues).
 */
export function validateCodeSyntax(code: string): ReviewIssue[] {
  const issues: ReviewIssue[] = [];

  // Check for function signature
  if (!code.includes("function createModel")) {
    issues.push({
      severity: "error",
      code: "SYN_NO_ENTRY_POINT",
      message: "Missing 'function createModel' entry point",
      suggestion: "The code must define a function named 'createModel'",
    });
  }

  // Check for render() call
  if (!code.includes("render(")) {
    issues.push({
      severity: "warning",
      code: "SYN_NO_RENDER",
      message: "No render() call found",
      suggestion: "Add a render() call at the end to output the shape",
    });
  }

  // Check for try/catch
  if (!code.includes("try") || !code.includes("catch")) {
    issues.push({
      severity: "info",
      code: "SYN_NO_ERROR_HANDLING",
      message: "No try/catch error handling",
      suggestion: "Wrap geometry operations in try/catch for robustness",
    });
  }

  // Check for common mistakes
  if (code.includes("extrude(both=true)") || code.includes("extrude(true)")) {
    issues.push({
      severity: "error",
      code: "SYN_EXTRUDE_BOTH_BUG",
      message: "extrude(both=true) has a known bug in go-topo C++ core",
      suggestion: "Use boxCentered() instead of rect+extrude(both=true)",
    });
  }

  // Check for unknown method calls on CQWorkplane
  const methodCalls = code.match(/\.([a-zA-Z]+)\s*\(/g) ?? [];
  for (const call of methodCalls) {
    const methodName = call.slice(1, -1);
    if (
      !KNOWN_CQWORKPLANE_METHODS.has(methodName) &&
      !["delete", "toObject", "toJson", "isNull", "bbox", "volume", "area",
        "mesh", "faces", "edges", "vertices", "solids", "children", "name",
        "location", "color", "hasColor", "toCompound", "toTrsf",
        "setLocation", "setTypeOfColor"].includes(methodName)
    ) {
      // Only flag if it looks like a CQWorkplane method (first letter lowercase)
      if (methodName[0] === methodName[0].toLowerCase() && methodName.length > 2) {
        issues.push({
          severity: "info",
          code: "SYN_UNKNOWN_METHOD",
          message: `Unknown method '.${methodName}()' — may not exist on CQWorkplane`,
          suggestion: `Check if '${methodName}' is a valid CQWorkplane method`,
        });
      }
    }
  }

  // Check for unused imports
  const importMatches = code.match(/import\s+\{([^}]+)\}/g) ?? [];
  for (const imp of importMatches) {
    const names = imp.match(/\{([^}]+)\}/)?.[1]?.split(",").map((s) => s.trim()) ?? [];
    for (const name of names) {
      if (name && !code.includes(name) || (code.match(new RegExp(`\\b${name}\\b`, "g")) ?? []).length <= 1) {
        issues.push({
          severity: "info",
          code: "SYN_UNUSED_IMPORT",
          message: `Import '${name}' may be unused`,
        });
      }
    }
  }

  // Check for potential NaN in dimensions
  const numberLiterals = code.match(/:\s*(\d+\.?\d*)/g) ?? [];
  for (const lit of numberLiterals) {
    const num = parseFloat(lit.slice(1));
    if (!isFinite(num)) {
      issues.push({
        severity: "warning",
        code: "SYN_NON_Finite_NUMBER",
        message: `Non-finite number literal found: ${lit.trim()}`,
      });
    }
  }

  return issues;
}

/**
 * Quick syntax check — just verify the code is parseable.
 */
export function quickSyntaxCheck(code: string): { valid: boolean; error?: string } {
  try {
    // Use Function constructor to check syntax without executing
    new Function("tp", "CQ", "CQWorkplane", "pnt", "vec", "gpVec", "render", "console", code);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
