/**
 * CAD-native model — the feature-based construction model.
 *
 * This deliberately differs from a 3D-modeling "bag of primitives" model:
 *
 *   3D modeling (img2threejs-style)      CAD construction (this model)
 *   ---------------------------------    ---------------------------------
 *   primitives + transforms + booleans   sketches -> features -> body
 *   hardcoded placement matrices         driving dimensions + constraints
 *   flat unordered component list        ordered feature history (tree)
 *   size constants                       associative parameters w/ expressions
 *   no reference geometry                datum planes / axes / origin
 *   edit = change code                   edit = change param, rebuild
 *
 * The unit of work here is a FEATURE applied to the accumulating body, not a
 * shape placed in world space.
 */

// ---------------------------------------------------------------------------
// Units & scale
// ---------------------------------------------------------------------------

export type LengthUnit = "mm" | "cm" | "m" | "in" | "ft";

export interface UnitSystem {
  length: LengthUnit;
  /** Model units per millimeter (mm => 1). */
  toMillimeter: number;
}

/** Scale evidence found in the source image (a dimension callout, a known part). */
export interface ScaleReference {
  /** What supplied the scale: an engineering dimension, a known fastener, etc. */
  kind: "dimension_callout" | "known_feature" | "assumed";
  /** Text as read from the image, e.g. "Ø12" or "40". */
  label?: string;
  /** The real-world length this corresponds to, in millimeters. */
  realLength: number;
  /** The same length measured in the image (pixels). */
  imageLength: number;
  /** realLength / imageLength — mm per pixel. */
  mmPerPixel: number;
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

/** An orthographic standard view, or a perspective photo. */
export type ViewKind = "front" | "top" | "right" | "left" | "back" | "bottom" | "iso" | "photo";

/** How the drawing depicts the object. */
export type DrawingKind = "engineering_drawing" | "photo" | "sketch" | "mixed";

export interface ViewSpec {
  /** Stable id, e.g. "v_front". */
  id: string;
  kind: ViewKind;
  /** Which standard projection plane this view corresponds to, when known. */
  projectionPlane?: "XY" | "XZ" | "YZ" | "YX" | "ZX" | "ZY" | "front" | "right" | "top";
  /** Normalized region of the source image holding this view [x0,y0,x1,y1]. */
  region?: [number, number, number, number];
  /** Scale evidence local to this view (overrides the global one). */
  scale?: ScaleReference;
  /** True when the view is a section/cut view. */
  isSection?: boolean;
  /** Confidence that this view was classified correctly. */
  confidence: number;
}

export interface ViewSet {
  drawingKind: DrawingKind;
  views: ViewSpec[];
  /** Global scale evidence. */
  scale?: ScaleReference;
  units: UnitSystem;
  /** Aspects the supplied views cannot determine. */
  undetermined: string[];
}

// ---------------------------------------------------------------------------
// 2D profile geometry (extracted from a view)
// ---------------------------------------------------------------------------

export type ProfileEntityType = "line" | "arc" | "circle";

export interface ProfileEntity {
  /** Tag used to reference this entity in constraints. */
  tag: string;
  type: ProfileEntityType;
  /** Start point [x,y] in view coordinates (model mm). Omitted for circles. */
  start?: [number, number];
  /** End point [x,y]. Omitted for circles. */
  end?: [number, number];
  /** Arc/circle center. */
  center?: [number, number];
  /** Arc/circle radius. */
  radius?: number;
  /** Arc sweep direction. */
  clockwise?: boolean;
  /** Construction geometry (centre lines, symmetry axes) — not part of the profile. */
  construction?: boolean;
  /** How confidently this entity was read from the image. */
  confidence?: number;
}

export type ProfileRelationKind =
  | "parallel"
  | "perpendicular"
  | "tangent"
  | "concentric"
  | "collinear"
  | "equal_length"
  | "horizontal"
  | "vertical"
  | "symmetric_about";

/** A geometric relation inferred from the drawing — becomes a sketch constraint. */
export interface ProfileRelation {
  kind: ProfileRelationKind;
  /** Entity tags involved (one for horizontal/vertical). */
  tags: string[];
  /** For symmetric_about: the entity tag acting as the axis. */
  axisTag?: string;
}

export interface ProfileLoop {
  /** Entity tags forming one closed loop. */
  tags: string[];
  closed: boolean;
}

export interface Profile2D {
  /** Which view this profile came from. */
  viewId: string;
  /** Sketch origin in view coordinates. */
  origin?: [number, number];
  entities: ProfileEntity[];
  loops: ProfileLoop[];
  relations: ProfileRelation[];
  /** Explicit dimensions read from the drawing (driving dimensions). */
  dimensions: ProfileDimension[];
}

/** A dimension read from the drawing. */
export interface ProfileDimension {
  /** Parameter name this dimension becomes, e.g. "plateWidth". */
  name: string;
  kind: "length" | "radius" | "diameter" | "angle";
  /** Value in model units. */
  value: number;
  /** Entity tags being dimensioned. */
  tags: string[];
  /** Where it was read from, for audit. */
  source?: string;
}

// ---------------------------------------------------------------------------
// Constrained sketch (compiles to tp.Sketch)
// ---------------------------------------------------------------------------

/**
 * Constraint kinds, named for what a drafter means rather than what the binding
 * calls them.
 *
 * The mapping to `tp.SketchConstraintKind` is not one-to-one, because two of the
 * binding's names do not mean what they appear to. Probed against the kernel:
 *
 *   JOIN        → K.DISTANCE [t1, t2, 0]
 *                 "these two entities meet at a point". This is the constraint
 *                 that actually closes a profile, and it is what a drafter means
 *                 by coincidence between consecutive edges.
 *
 *   COINCIDENT  → K.COINCIDENT
 *                 The binding's own COINCIDENT makes two segments OVERLAP rather
 *                 than share an endpoint: applied to a rectangle's adjacent
 *                 edges it collapses the loop into a degenerate fan with zero
 *                 residual. Exposed for completeness, not for joining.
 *
 *   DISTANCE    → K.DISTANCE [t1, t2, d]
 *                 Distance d between the point at parameter t on entity 1 and
 *                 the point at parameter t on entity 2. t=0 is the start, t=1
 *                 the end.
 */
export type SketchConstraintKind =
  | "FIXED"
  | "FIXED_POINT"
  | "JOIN"
  | "DISTANCE"
  | "LENGTH"
  | "RADIUS"
  | "ANGLE"
  | "ORIENTATION"
  | "ARC_ANGLE"
  | "COINCIDENT";

/** Value marshalling follows the binding: number | [a,b] | [t1,t2,d]. */
export type SketchConstraintValue = number | [number, number] | [number | null, number | null, number];

export interface SketchConstraint {
  kind: SketchConstraintKind;
  /** One tag, or two for binary constraints. */
  tags: [string] | [string, string];
  /**
   * Constraint value.
   *
   * For JOIN the pair is [t1, t2] and the distance is implicitly zero; when
   * omitted it is derived from the profile's own adjacency.
   */
  value?: SketchConstraintValue;
  /** Human note, e.g. "overall width". */
  note?: string;
}

export interface SketchSpec {
  /** Stable id referenced by features, e.g. "s_base". */
  id: string;
  /** Datum plane the sketch lives on. */
  plane: DatumPlane;
  entities: ProfileEntity[];
  constraints: SketchConstraint[];
  /** Solve quality observed after the last solve (filled at review time). */
  solve?: SketchSolveReport;
}

export interface SketchSolveReport {
  status: number;
  cost: number;
  /** SUCCESS (4) is the only unambiguous pass; 1-3 are acceptable-with-caveats. */
  converged: boolean;
  dofCount: number;
  /** Untagged/underconstrained entities — design intent is not fully captured. */
  underconstrained: boolean;
  /** What the kernel said when it threw instead of returning a status. */
  note?: string;
}

// ---------------------------------------------------------------------------
// Datums
// ---------------------------------------------------------------------------

export interface DatumPlane {
  /** Standard named plane, or "custom". */
  kind: "XY" | "XZ" | "YZ" | "custom";
  /** Origin in model mm. */
  origin: [number, number, number];
  /** Normal + x-axis for custom planes. */
  normal?: [number, number, number];
  xAxis?: [number, number, number];
}

export interface DatumAxis {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

/**
 * A feature operation. Every feature acts on the body produced by the features
 * before it — there is no "target" back-reference. Order is the construction
 * order.
 */
export type FeatureOp =
  /** Extrude a sketch profile into material. */
  | { op: "pad"; sketchId: string; distance: string; symmetric?: boolean; taper?: string; both?: boolean }
  /** Remove material using a sketch profile down to a depth (or through). */
  | { op: "pocket"; sketchId: string; depth?: string; through?: boolean; taper?: string; both?: boolean }
  /** Revolve a sketch profile about an axis. */
  | { op: "revolve"; sketchId: string; angle: string; axis: DatumAxis }
  /** Sweep a sketch profile along a path sketch. */
  | { op: "sweep"; sketchId: string; pathSketchId: string; frenet?: boolean }
  /** Loft through several sketch profiles in order. */
  | { op: "loft"; sketchIds: string[]; ruled?: boolean }
  /** Round edges selected by a selector expression. */
  | { op: "fillet"; selector: string; radius: string }
  /** Break edges selected by a selector expression. */
  | { op: "chamfer"; selector: string; length: string }
  /** Hollow the body, optionally opening a face. */
  | { op: "shell"; thickness: string; openSelector?: string }
  /** Repeat a feature linearly or about an axis. */
  | { op: "pattern_linear"; ofFeature: string; count: number; dx: string; dy: string; dz?: string }
  | { op: "pattern_polar"; ofFeature: string; count: number; axis: DatumAxis; angle?: string }
  /** Mirror the body (or a named feature) about a datum plane. */
  | { op: "mirror"; plane: DatumPlane; ofFeature?: string }
  /** Combine with the body produced by another sketch's extrude. */
  | { op: "boolean"; kind: "cut" | "union" | "intersect"; sketchId: string; distance?: string };

export type FeatureKind = FeatureOp["op"];

export interface Feature {
  /** Stable id, e.g. "f_pad_base". */
  id: string;
  /** User-facing name, e.g. "Base plate". */
  name: string;
  op: FeatureOp;
  /** Parameters this feature is driven by (names in FeatureTree.parameters). */
  drivenBy?: string[];
  /** Free-text rationale, useful for the AI to keep design intent. */
  intent?: string;
  /** Set false if the model decided this feature is not needed. */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Parameters (associative dimensions)
// ---------------------------------------------------------------------------

/**
 * A named driving dimension. `expr` may reference other parameters, which is
 * what makes the model associative: change one and everything downstream
 * rebuilds.
 */
export interface CadParameter {
  name: string;
  /** Expression in terms of other parameter names, or a numeric literal. */
  expr: string;
  /** Evaluated value in model units (filled by the evaluator). */
  value?: number;
  unit?: LengthUnit | "deg";
  min?: number;
  max?: number;
  description?: string;
  /** Which feature first references it. */
  ownedBy?: string;
}

// ---------------------------------------------------------------------------
// The feature tree — the CAD document
// ---------------------------------------------------------------------------

/** Design-intent assertions the tree is expected to satisfy. */
export interface DesignIntent {
  /** Plane the part is symmetric about, if any. */
  symmetryPlane?: DatumPlane;
  /** Primary build direction. */
  primaryAxis?: "x" | "y" | "z";
  /** Minimum wall thickness to respect, in model units. */
  minWallThickness?: number;
  /** True when the part should be manufacturable (drives DFM checks). */
  manufacturable?: boolean;
  /** Notes on what the part is for. */
  notes?: string[];
}

export interface FeatureTree {
  name: string;
  /** What the part is, in one paragraph. */
  description?: string;
  units: UnitSystem;
  datums: {
    planes: Record<string, DatumPlane>;
    axes: Record<string, DatumAxis>;
  };
  /** Ordered — index is construction order. */
  features: Feature[];
  /** Sketches referenced by features. */
  sketches: Record<string, SketchSpec>;
  /** Associative parameters. */
  parameters: CadParameter[];
  designIntent?: DesignIntent;
  /** View/profile provenance, for audit. */
  provenance?: {
    viewSet?: ViewSet;
    profiles?: Profile2D[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const MILLIMETER: UnitSystem = { length: "mm", toMillimeter: 1 };

const UNIT_TO_MM: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

export function makeUnitSystem(length: LengthUnit): UnitSystem {
  return { length, toMillimeter: UNIT_TO_MM[length] };
}

/** Convert a value in the given unit to millimeters. */
export function toMillimeters(value: number, unit: LengthUnit): number {
  return value * UNIT_TO_MM[unit];
}

/** Features that actually take part in the build. */
export function activeFeatures(tree: FeatureTree): Feature[] {
  return tree.features.filter((f) => f.enabled !== false);
}

/** All parameter names referenced anywhere in the tree. */
export function referencedParameters(tree: FeatureTree): string[] {
  const names = new Set<string>();
  for (const p of tree.parameters) {
    for (const m of p.expr.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)) {
      if (m[0] !== p.name) names.add(m[0]);
    }
  }
  return Array.from(names);
}
