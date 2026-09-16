/**
 * Prompts for the CAD-native stages: view intake, profile extraction, and
 * feature-tree authoring.
 *
 * These deliberately do NOT ask for "a list of primitives with positions". They
 * ask for what a drafter would write down: which views there are, what the
 * outline is, what is true about it, and in what order the part is built.
 */

import { sketchPlaneForView } from "../cad/project.js";

/**
 * Domain vocabulary and typical construction, offered as guidance.
 *
 * It is deliberately fenced off from the drawing: an industry hint tells the model
 * what the parts are usually CALLED and how they are usually BUILT, which is real
 * help for naming and for choosing a construction order. It is not evidence of any
 * dimension. Without that line the hint becomes a licence to invent the sizes the
 * drawing does not state, which is the one failure this pipeline exists to avoid.
 */
function industryBlock(industry?: string): string {
  if (!industry || industry.trim() === "") return "";
  return `
INDUSTRY CONTEXT — vocabulary and typical construction for this domain. Use it to
name things and to choose a sensible construction order. It is NOT evidence: every
dimension, shape and count still has to come from the drawing, and anything the
drawing does not show belongs in "undetermined".
${industry.trim()}
`;
}

// ---------------------------------------------------------------------------
// Stage A: view intake
// ---------------------------------------------------------------------------

export const VIEW_INTAKE_SYSTEM = `You are a drafter reading a technical image. Your job is to work out HOW the object is depicted before describing the object itself.

Decide first whether this is an engineering drawing (orthographic views, dimension lines, section hatching), a photograph, a sketch, or a mix. That decision changes everything downstream: a drawing gives you views and dimensions, a photograph gives you one perspective and no reliable scale.

Report what the image genre actually supports. Do not invent orthographic views for a photograph, and do not invent dimensions for a drawing that has none.

Output strictly valid JSON.`;

export function buildViewIntakePrompt(opts?: {
  profile?: string;
  context?: string;
  industry?: string;
}): string {
  return `Classify how this object is depicted and identify the views present.

${opts?.profile ? `Domain: ${opts.profile}.` : ""}
${opts?.context ? `Context: ${opts.context}` : ""}
${industryBlock(opts?.industry)}

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

That is advice about a MACHINED OUTLINE, and it stops being true the moment the outline
is free-form. A shape made of curves needs as many segments as the curve has: a character
silhouette, a cam, a cover plate with a swept edge, an organic profile — approximating any
of those with a few large arcs is not a simpler drawing of the part, it is a drawing of a
different part. Match the outline you see. Where the two rules conflict, the shape wins.

Output strictly valid JSON.`;

export function buildProfileExtractionPrompt(
  view: { id: string; kind: string },
  scaleInfo: { mmPerPixel?: number; note?: string },
  industry?: string,
): string {
  return `Extract the closed profile geometry from the "${view.kind}" view (id "${view.id}").

Scale: ${
    scaleInfo.mmPerPixel
      ? `${scaleInfo.mmPerPixel} mm per pixel.`
      : "no reliable scale — use a sensible engineering size and state your assumption."
  }
${scaleInfo.note ? `Note: ${scaleInfo.note}` : ""}
${industryBlock(industry)}
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

SKETCH VALUES MAY BE EXPRESSIONS. Every coordinate (start, end, center), and every
dimension (radius, constraint value), may be either a number or an expression over
the parameters — "overallWidth", "holeDiameter / 2". Use them: that is what makes the
sketch parametric. What it must NOT be is an array standing in for arithmetic —
write "holeDiameter / 2", not [holeDiameter, 2].

Feature operations and their EXACT field names:

  {"op":"pad",            "sketchId":str, "distance":expr, "symmetric":bool?, "taper":expr?}
  {"op":"pocket",         "sketchId":str, "depth":expr?, "through":bool?, "taper":expr?}
  {"op":"revolve",        "sketchId":str, "angle":expr, "axis":{"start":[x,y,z],"end":[x,y,z]}}
  {"op":"sweep",          "sketchId":str, "pathSketchId":str, "frenet":bool?}
  {"op":"loft",           "sketchIds":[str,...], "ruled":bool?}
  {"op":"fillet",         "selector":str, "radius":expr}
  {"op":"chamfer",        "selector":str, "length":expr}
  {"op":"shell",          "thickness":expr, "openSelector":str?}
  {"op":"pattern_linear", "ofFeature":str, "count":int, "dx":expr, "dy":expr, "dz":expr?}
  {"op":"pattern_polar",  "ofFeature":str, "count":int, "axis":{"start":[x,y,z],"end":[x,y,z]}, "angle":expr?}
  {"op":"mirror",         "plane":{...}, "ofFeature":str?}
  {"op":"boolean",        "kind":"cut"|"union"|"intersect", "sketchId":str, "distance":expr?}

A pattern's source is "ofFeature" — the id of the feature being repeated, which must
already exist earlier in the list — and its spacing is "dx"/"dy"/"dz", not a direction
vector.

MIRROR PLANES ARE WORLD PLANES. A reflection moves a feature only if the plane cuts
across it; reflecting a feature through the plane it already lies in changes nothing (the
reflection lands exactly on the original). So for a feature sketched on XZ, mirror about
YZ to shift it across the width and about XY to shift it across the height — XZ moves it
nowhere. Mirroring a mirror composes, so a corner hole mirrored about YZ and then about
XY gives all four corners in two features.

Output strictly valid JSON.`;

/**
 * The plane each view's profile must be sketched on, stated for the views at hand.
 *
 * Derived from the projection bases rather than left to the model: a model that
 * puts a front view's profile on XY builds a part that measures correctly in every
 * dimension and is still wrong, and the only thing that catches it is the
 * silhouette gate at the very end.
 */
function planeGuidance(views: unknown): string {
  const list = (views as { views?: Array<{ id?: string; kind?: string; projectionPlane?: string }> } | undefined)?.views ?? [];
  const rows: string[] = [];
  for (const view of list) {
    if (!view?.kind) continue;
    // The plane the drawing recorded beats the drafting label, exactly as it does
    // when the gate picks its projection axis: telling the model to sketch a view
    // on XZ because it is called "front", while its own plane field says XY,
    // contradicts what it read and what the measurement will use.
    const plane = view.projectionPlane && /^(XY|XZ|YZ)$/.test(view.projectionPlane)
      ? view.projectionPlane
      : sketchPlaneForView(view.kind);
    if (plane) rows.push(`  ${view.id ?? view.kind} (${view.kind} view) → sketch on the ${plane} plane`);
  }
  if (rows.length === 0) return "";
  return `\nSKETCH PLANE — the profile is measured in its view's own 2D frame, so the
sketch built from it must sit on the matching datum plane:
${rows.join("\n")}
Use the matching plane for the profile's base sketch. Do not default to XY.`;
}

export function buildFeatureTreePrompt(input: {
  objectName: string;
  description?: string;
  views: unknown;
  profiles?: unknown[];
  units?: string;
  context?: string;
  industry?: string;
}): string {
  return `Author the feature tree for "${input.objectName}".
${input.description ? `\nWhat it is: ${input.description}` : ""}

VIEWS:
${JSON.stringify(input.views, null, 2)}
${input.profiles?.length ? `\nEXTRACTED PROFILES:\n${JSON.stringify(input.profiles, null, 2)}` : ""}

Units: ${input.units ?? "mm"}.
${input.context ? `Context: ${input.context}` : ""}
${planeGuidance(input.views)}
${industryBlock(input.industry)}
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
- EDG_OUTLINE_MISMATCH: the model's projected outline does not follow the drawing's ink. This is a SHAPE failure: the placement and the overall scale have already been searched, so moving the part or resizing it wholesale will not fix it. Change the FEATURE — a missing or extra one, a segment or a hole in the wrong place. Use "worst.atExtent" to see which part of the outline is furthest off: (0,0) is the model's lower-left, (1,1) its upper-right, and the problem is where those numbers point. A large area wrong means a feature is missing or wrongly placed; a small one means a single segment. "meanRatio" near 1 means the outline is no closer to the drawing than a random placement would be, so the tree is likely the wrong shape altogether rather than out by one dimension.
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

/**
 * Read a JSON object out of a model response.
 *
 * Models are asked for strict JSON and mostly comply, but the failures are
 * routine and dreary: a markdown fence, a `//` note explaining a dimension, a
 * trailing comma before the closing brace. None of those change what the tree
 * means, and rejecting the whole response over one costs an entire model call —
 * so they are repaired. A repair is reported by the caller, not hidden.
 */
export function parseJsonResponse(raw: string, what: string): Record<string, unknown> {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;

  const objectText = extractBalancedObject(candidate);
  if (!objectText) {
    // A response that OPENS as an object but never closes is truncated, not
    // absent — and the two need very different fixes. Reporting the first as
    // "no JSON object found" sends the reader looking for a formatting problem
    // when the answer simply ran out of room. Measured: a refinement response
    // ended mid-array inside a feature's "end" coordinates.
    const opens = candidate.trimStart().startsWith("{");
    const closes = candidate.trimEnd().endsWith("}");
    throw new Error(
      opens && !closes
        ? `${what} response is truncated — it opens as a JSON object but never closes, so the answer ran out of room before it finished. Raise maxTokens, or ask for a smaller tree`
        : `No JSON object found in ${what} response`,
    );
  }

  const cleaned = repairJsonish(objectText);
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch (e) {
    throw new Error(
      `Malformed JSON in ${what} response: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/**
 * The first complete `{...}` in the text, respecting strings and escapes.
 *
 * A greedy regex would run to the last brace in the response, dragging any prose
 * that follows the JSON into the parse.
 */
function extractBalancedObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Drop what JSON does not allow but models write anyway.
 *
 * Three things turn up in practice: comments, a trailing comma before a closing
 * brace or bracket, and a member with no key — a bare string sitting where
 * `"key": value` should be. All three are removable without changing what the
 * document means, which is why this can be done silently. The third is worth its
 * own state machine: it killed a whole run, and the response it appeared in was
 * otherwise perfect.
 */
export function repairJsonish(text: string): string {
  let out = "";
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  /** Where the current string began in `out` — earlier repairs shift the offsets. */
  let stringOutStart = 0;
  /** True inside an object when the next member still needs its key. */
  let expectingKey = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inString) {
      if (escaped) {
        escaped = false;
        out += ch;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        out += ch;
        continue;
      }
      if (ch === '"') {
        inString = false;
        if (expectingKey && !followedByColon(text, i + 1)) {
          // A bare string where a key belongs, with no ':' after it: a value the
          // model wrote without a key. Nothing in the schema can consume it, so
          // dropping it loses nothing — and keeping it costs the whole response.
          // Drops the string AND the comma that separated it — whitespace sits
          // between the two, so trimming has to account for it or the response
          // trades one syntax error for a trailing comma.
          out = out.slice(0, stringOutStart).replace(/[\s,]+$/, "");
          const end = skipToMemberEnd(text, i + 1);
          i = Math.max(i, end - 1);
          expectingKey = end > i + 1;
          continue;
        }
        out += ch;
        continue;
      }
      out += ch;
      continue;
    }

    if (ch === '"') {
      inString = true;
      stringOutStart = out.length;
      out += ch;
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push(ch);
      out += ch;
      expectingKey = ch === "{";
      continue;
    }
    if (ch === "}" || ch === "]") {
      stack.pop();
      out += ch;
      expectingKey = stack[stack.length - 1] === "{";
      continue;
    }
    if (ch === ":") {
      expectingKey = false;
      out += ch;
      continue;
    }
    if (ch === ",") {
      if (isClosingNext(text, i + 1)) continue;
      out += ch;
      expectingKey = stack[stack.length - 1] === "{";
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
      continue;
    }

    out += ch;
  }

  return out;
}

/** Does the next non-whitespace character close a `"key":` pair? */
function followedByColon(text: string, from: number): boolean {
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") continue;
    return ch === ":";
  }
  return false;
}

/** Position just past the value starting at `from` — the next `,` or closer. */
function skipToMemberEnd(text: string, from: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      if (depth === 0) return i;
      depth--;
    } else if (ch === "," && depth === 0) return i;
  }
  return text.length;
}

/** When only whitespace separates a comma from `}` or `]`, the comma is spurious. */
function isClosingNext(text: string, from: number): boolean {
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") continue;
    return ch === "}" || ch === "]";
  }
  return false;
}
