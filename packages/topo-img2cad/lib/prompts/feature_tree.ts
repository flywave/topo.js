/**
 * Prompts for the CAD-native stages: view intake, profile extraction, and
 * feature-tree authoring.
 *
 * These deliberately do NOT ask for "a list of primitives with positions". They
 * ask for what a drafter would write down: which views there are, what the
 * outline is, what is true about it, and in what order the part is built.
 */

// ---------------------------------------------------------------------------
// Stage A: view intake
// ---------------------------------------------------------------------------

export const VIEW_INTAKE_SYSTEM = `You are a drafter reading a technical image. Your job is to work out HOW the object is depicted before describing the object itself.

Decide first whether this is an engineering drawing (orthographic views, dimension lines, section hatching), a photograph, a sketch, or a mix. That decision changes everything downstream: a drawing gives you views and dimensions, a photograph gives you one perspective and no reliable scale.

Report what the image genre actually supports. Do not invent orthographic views for a photograph, and do not invent dimensions for a drawing that has none.

Output strictly valid JSON.`;

export function buildViewIntakePrompt(opts?: { profile?: string; context?: string }): string {
  return `Classify how this object is depicted and identify the views present.

${opts?.profile ? `Domain: ${opts.profile}.` : ""}
${opts?.context ? `Context: ${opts.context}` : ""}

Return JSON:
{
  "drawingKind": "engineering_drawing" | "photo" | "sketch" | "mixed",
  "views": [
    {
      "id": "v_front",
      "kind": "front" | "top" | "right" | "left" | "back" | "bottom" | "iso" | "photo",
      "projectionPlane": "XY" | "XZ" | "YZ" | "front" | "top" | "right",
      "region": [x0, y0, x1, y1],
      "isSection": false,
      "confidence": 0.0-1.0
    }
  ],
  "scale": {
    "kind": "dimension_callout" | "known_feature" | "assumed",
    "label": "e.g. the text of the dimension you read",
    "realLength": number (mm),
    "imageLength": number (pixels),
    "mmPerPixel": number
  },
  "units": { "length": "mm" },
  "undetermined": ["things this image physically cannot tell you"]
}

Rules:
- "region" is the normalized [x0,y0,x1,y1] box of the whole image holding that view.
- Only claim a standard orthographic view if the drawing actually contains it.
- A single photograph gets exactly one view with kind "photo" — no more.
- If there are no dimensions and no known-size reference, use kind "assumed" for scale and say so in "undetermined".
- List every hidden aspect honestly in "undetermined": depth behind a front view, internal cavities, thread pitches, tolerances.`;
}

// ---------------------------------------------------------------------------
// Stage B: profile extraction
// ---------------------------------------------------------------------------

export const PROFILE_EXTRACTION_SYSTEM = `You are extracting a 2D outline from an engineering view so it can be rebuilt as a constrained sketch.

Report geometry in model millimetres using the supplied scale. Report the GEOMETRIC RELATIONS the view implies (parallel, perpendicular, tangent, concentric, horizontal, vertical) as well as the explicit dimensions — the relations are what let a solver place geometry correctly rather than merely drawing lines at coordinates you guessed.

Prefer a small number of well-constrained entities over many sloppy ones. A rectangle is four lines and four relations, not forty segments.

Output strictly valid JSON.`;

export function buildProfileExtractionPrompt(
  view: { id: string; kind: string },
  scaleInfo: { mmPerPixel?: number; note?: string },
): string {
  return `Extract the closed profile geometry from the "${view.kind}" view (id "${view.id}").

Scale: ${
    scaleInfo.mmPerPixel
      ? `${scaleInfo.mmPerPixel} mm per pixel.`
      : "no reliable scale — use a sensible engineering size and state your assumption."
  }
${scaleInfo.note ? `Note: ${scaleInfo.note}` : ""}

Return JSON:
{
  "viewId": "${view.id}",
  "origin": [0, 0],
  "entities": [
    { "tag": "e1", "type": "line", "start": [x, y], "end": [x, y] },
    { "tag": "a1", "type": "arc", "center": [x, y], "radius": r, "start": [x, y], "end": [x, y], "clockwise": false },
    { "tag": "c1", "type": "circle", "center": [x, y], "radius": r },
    { "tag": "cl1", "type": "line", "start": [x, y], "end": [x, y], "construction": true }
  ],
  "loops": [ { "tags": ["e1","e2","e3","e4"], "closed": true } ],
  "relations": [
    { "kind": "horizontal", "tags": ["e1"] },
    { "kind": "parallel", "tags": ["e1","e3"] },
    { "kind": "perpendicular", "tags": ["e2","e4"] },
    { "kind": "tangent", "tags": ["a1","e1"] },
    { "kind": "concentric", "tags": ["c1","c2"] }
  ],
  "dimensions": [
    { "name": "overallWidth", "kind": "length", "value": 120, "tags": ["e1"], "source": "the 120 dimension on the top edge" }
  ]
}

Rules:
- Entities must form CLOSED loops — the profile will be extruded, and an open profile cannot be.
- Distinguish the profile from construction geometry (centre lines, symmetry axes): mark those "construction": true. They guide constraints but are not part of the outline.
- Only emit a relation you are confident about. A wrong relation moves geometry; a missing one is harmless.
- Give every dimension a descriptive camelCase name; it becomes a driving parameter.
- Coordinates are in the view's own 2D frame, not world XYZ.`;
}

// ---------------------------------------------------------------------------
// Stage C: feature tree
// ---------------------------------------------------------------------------

export const FEATURE_TREE_SYSTEM = `You are a CAD engineer writing a feature tree — the ordered history a person would model this part in.

The order is the construction order. Each feature acts on the material the previous features produced. There is no "target" back-reference; a pocket cuts whatever body exists at that point in the list.

Two rules matter more than anything else:

1. SKETCH BEFORE SOLID. Material is created by extruding, revolving or sweeping a constrained sketch — not by placing a box at coordinates. A sketch carries the dimensions and relations; the feature consumes it.

2. DIMENSIONS ARE EXPRESSIONS. Parameters drive features, and parameters may reference other parameters (holeDiameter = plateThickness * 0.6). A parameter that drives nothing is a defect.

Sketch constraint kinds available: FIXED, FIXED_POINT, COINCIDENT, ANGLE, LENGTH, DISTANCE, RADIUS, ORIENTATION, ARC_ANGLE.
Constraint values: a number, [a, b], or [t1, t2, distance].

Feature operations available: pad, pocket, revolve, sweep, loft, fillet, chamfer, shell, pattern_linear, pattern_polar, mirror, boolean.

Output strictly valid JSON.`;

export function buildFeatureTreePrompt(input: {
  objectName: string;
  description?: string;
  views: unknown;
  profiles?: unknown[];
  units?: string;
  context?: string;
}): string {
  return `Author the feature tree for "${input.objectName}".
${input.description ? `\nWhat it is: ${input.description}` : ""}

VIEWS:
${JSON.stringify(input.views, null, 2)}
${input.profiles?.length ? `\nEXTRACTED PROFILES:\n${JSON.stringify(input.profiles, null, 2)}` : ""}

Units: ${input.units ?? "mm"}.
${input.context ? `Context: ${input.context}` : ""}

Return JSON:
{
  "name": "part_name",
  "description": "one paragraph: what the part is and how it is built",
  "units": { "length": "mm" },
  "datums": {
    "planes": {
      "basePlane": { "kind": "XY", "origin": [0, 0, 0] },
      "topPlane": { "kind": "XY", "origin": [0, 0, 20] }
    },
    "axes": {
      "mainAxis": { "start": [0, 0, 0], "end": [0, 0, 1] }
    }
  },
  "sketches": {
    "s_base": {
      "id": "s_base",
      "plane": { "kind": "XY", "origin": [0, 0, 0] },
      "entities": [
        { "tag": "e1", "type": "line", "start": [-60, -40], "end": [60, -40] }
      ],
      "constraints": [
        { "kind": "LENGTH", "tags": ["e1"], "value": 120, "note": "overall width" },
        { "kind": "ORIENTATION", "tags": ["e1"], "value": [1, 0] },
        { "kind": "COINCIDENT", "tags": ["e1", "e2"] }
      ]
    }
  },
  "features": [
    {
      "id": "f_base",
      "name": "Base plate",
      "op": { "op": "pad", "sketchId": "s_base", "distance": "plateThickness" },
      "drivenBy": ["plateThickness"],
      "intent": "the mounting plate the rest is built on"
    },
    {
      "id": "f_bore",
      "name": "Central bore",
      "op": { "op": "pocket", "sketchId": "s_bore", "through": true },
      "drivenBy": ["boreDiameter"],
      "intent": "clearance for the shaft"
    },
    {
      "id": "f_round",
      "name": "Break outer edges",
      "op": { "op": "fillet", "selector": "|Z", "radius": "edgeRadius" },
      "drivenBy": ["edgeRadius"]
    }
  ],
  "parameters": [
    { "name": "plateThickness", "expr": "10", "unit": "mm", "min": 2, "description": "plate thickness" },
    { "name": "boreDiameter", "expr": "plateThickness * 0.8", "unit": "mm", "description": "derived from the plate thickness" },
    { "name": "edgeRadius", "expr": "2", "unit": "mm" }
  ],
  "designIntent": {
    "symmetryPlane": { "kind": "XZ", "origin": [0, 0, 0] },
    "primaryAxis": "z",
    "minWallThickness": 2,
    "manufacturable": true,
    "notes": ["which features exist for function vs. finish"]
  }
}

Rules, in order of importance:

1. The FIRST feature must be a base feature (pad / revolve / sweep / loft). Later features modify it.
2. Every feature that removes or modifies material must come after material exists.
3. Every sketch referenced by a feature must be defined in "sketches", and its entities must form a closed loop.
4. Every constraint tag must match an entity tag in the same sketch.
5. Parameters are expressions over other parameters or numeric literals. Use expressions to encode design intent, not repetition.
6. Set "drivenBy" on each feature to the parameters that drive it.
7. Dimensions come from the drawing. Where you had to guess, pick an engineering-plausible value and say so in designIntent.notes.
8. Prefer honouring symmetry (mirror a feature) over repeating it by hand.
9. Edge selectors are CadQuery selector strings: "|Z" edges parallel to Z, "#Z" edges perpendicular to Z, ">Z" the highest, "+Z" the lowest.
10. Keep the tree as short as it can be while staying honest about the part. Do not pad it out with features the drawing does not show.`;
}

// ---------------------------------------------------------------------------
// Refinement
// ---------------------------------------------------------------------------

export const FEATURE_TREE_REFINE_SYSTEM = `You are repairing a CAD feature tree based on measured failures.

Edit the tree, not the generated code. Failures come back as measurements — a silhouette IoU, a sketch solver residual, a dimension that does not move geometry — so translate each into the specific parameter, constraint, or feature that causes it.

Change as little as possible. Do not restructure a working tree to fix one dimension. Output strictly valid JSON in the same shape as the input.`;

export function buildFeatureTreeRefinePrompt(
  tree: unknown,
  issues: Array<{ code?: string; message: string; suggestion?: string }>,
  measurements?: unknown,
): string {
  return `Repair this feature tree.

CURRENT TREE:
${JSON.stringify(tree, null, 2)}

FAILURES (measured, not judged):
${issues.map((i) => `- [${i.code ?? "?"}] ${i.message}${i.suggestion ? `\n    -> ${i.suggestion}` : ""}`).join("\n")}
${measurements ? `\nMEASUREMENTS:\n${JSON.stringify(measurements, null, 2)}` : ""}

Guidance:
- RPR_LOW_IOU with precision < recall: the model is missing material in that view — a feature is absent or a dimension is small.
- RPR_LOW_IOU with recall < precision: the model has extra material — an unwanted feature or an oversized dimension.
- RPR_VIEW_MISMATCH: two views disagree, so a dimension in one sketch is wrong. Fix the one that contradicts the others.
- SKT_HIGH_RESIDUAL: constraints contradict. Either a dimension disagrees with an inferred relation, or the sketch is over-constrained. Remove or correct the conflicting entry.
- SKT_NO_DOF: constraint tags do not match entity tags.
- DIN_INERT_PARAMETER: a parameter is declared but no feature expression uses it. Wire it in.
- DIN_MISSING_SKETCH / DIN_MISSING_PATTERN_SOURCE: fix the reference.

Return the corrected tree as JSON only.`;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseJsonResponse(raw: string, what: string): Record<string, unknown> {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const braced = candidate.match(/(\{[\s\S]*\})/);
  if (!braced) {
    throw new Error(`No JSON object found in ${what} response`);
  }
  try {
    return JSON.parse(braced[1].trim()) as Record<string, unknown>;
  } catch (e) {
    throw new Error(
      `Malformed JSON in ${what} response: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}
