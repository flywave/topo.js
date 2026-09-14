/**
 * Primitive coverage analysis — checks which CQWorkplane methods are used
 * and whether the code covers the expected geometric operations.
 */

import type { ReviewIssue } from "../types.js";

// ---------------------------------------------------------------------------
// CQWorkplane method categories
// ---------------------------------------------------------------------------

const METHOD_CATEGORIES: Record<string, string[]> = {
  "2d_sketching": [
    "moveTo", "lineTo", "line", "hline", "vline", "polyline",
    "threePointArc", "sagittaArc", "circle", "ellipse", "polygon", "rect", "close",
  ],
  "3d_primitives": [
    "boxCentered", "circleCentered", "rectCentered", "polygonSimple",
  ],
  "extrusion": ["extrudeSimple", "loftSimple", "sweep", "twistExtrude"],
  "revolution": ["revolveSimple", "revolve"],
  "boolean": ["cut", "union", "add", "intersect"],
  "modification": ["fillet", "chamfer", "shell", "holeThrough", "cboreHole", "cskHole", "hole", "cutThruAll"],
  "transform": ["translate", "rotate", "mirror", "transformed"],
  "selector": ["faces", "edges", "vertices", "solids"],
};

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export interface CoverageReport {
  /** Methods used in the code */
  usedMethods: string[];
  /** Categories touched */
  usedCategories: string[];
  /** Methods not used but potentially useful */
  suggestions: string[];
}

/**
 * Analyze which CQWorkplane methods are used in the code.
 */
export function analyzeCoverage(code: string): CoverageReport {
  const usedMethods: string[] = [];
  const usedCategories: Set<string> = new Set();

  for (const [category, methods] of Object.entries(METHOD_CATEGORIES)) {
    for (const method of methods) {
      // Check for method calls: .methodName( or .methodName)
      const pattern = new RegExp(`\\.${method}\\s*[\\(]`, "g");
      if (pattern.test(code)) {
        usedMethods.push(method);
        usedCategories.add(category);
      }
    }
  }

  return {
    usedMethods,
    usedCategories: Array.from(usedCategories),
    suggestions: [],
  };
}

/**
 * Check if the code uses appropriate methods for the detected primitives.
 * Returns issues if critical methods are missing.
 */
export function checkPrimitiveCoverage(
  code: string,
  expectedTypes: string[],
): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const coverage = analyzeCoverage(code);

  // Map expected types to required method categories
  const requiredCategories = new Set<string>();
  for (const type of expectedTypes) {
    switch (type) {
      case "box":
        requiredCategories.add("3d_primitives");
        break;
      case "cylinder":
      case "cone":
        requiredCategories.add("3d_primitives");
        break;
      case "revolve":
        requiredCategories.add("2d_sketching");
        requiredCategories.add("revolution");
        break;
      case "extrude":
        requiredCategories.add("2d_sketching");
        requiredCategories.add("extrusion");
        break;
      case "sweep":
        requiredCategories.add("2d_sketching");
        requiredCategories.add("extrusion");
        break;
      case "loft":
        requiredCategories.add("2d_sketching");
        requiredCategories.add("extrusion");
        break;
      case "hole":
      case "fillet":
      case "chamfer":
      case "shell":
        requiredCategories.add("modification");
        break;
      case "boolean_cut":
      case "boolean_union":
      case "boolean_intersect":
        requiredCategories.add("boolean");
        break;
      case "assembly":
        // Assembly is checked differently
        break;
    }
  }

  for (const cat of requiredCategories) {
    if (!coverage.usedCategories.includes(cat)) {
      issues.push({
        severity: "warning",
        code: "COV_MISSING_CATEGORY",
        message: `Expected method category '${cat}' not found in code`,
        suggestion: `Add ${cat} operations as specified in the parametric spec`,
      });
    }
  }

  return issues;
}
