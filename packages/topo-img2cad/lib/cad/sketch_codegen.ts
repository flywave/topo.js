/**
 * Sketch emission — turning a constrained sketch into code that actually builds.
 *
 * This module is shaped by what the WASM binding provably does. Every claim
 * below was measured against the real kernel (`test/wasm_e2e.test.ts`), and the
 * measurements changed the design twice.
 *
 * THE WORKING PATH — a sketch built from segments, assembled, finalized and
 * extruded produces a valid solid of arbitrary outline:
 *
 *   sketch.segmentBetweenPoints(...)        lines
 *   sketch.arcByThreePoints(...)            arcs
 *   sketch.constrain(...)                   dimensions, directions, joins
 *   sketch.solve()                          solver cross-check (see below)
 *   sketch.assemble(ADD, tag)               wire the edges into a face  ← REQUIRED
 *   sketch.finalize().extrude(d)            the solid
 *
 * `assemble()` is the load-bearing call. Without it the sketch holds loose
 * edges, `get_faces()` finds nothing, and `extrude` throws "No pending wires
 * present" — which is what made segment-built sketches look unusable.
 *
 * WHERE THE COORDINATES COME FROM: `solve()` is a calculator, not an editor. It
 * finds a solution and reports it in `solve_status().x`, but it does NOT write
 * that solution back to the edges, so the solid is built from whatever
 * coordinates were emitted. Measured: a sketch authored 80x50 with LENGTH 100
 * and LENGTH 60 solves to cost 0 with solved vectors 100 and 60 long, and then
 * builds an 80x50 solid. The coordinates are therefore produced by
 * `reconcileSketch` at emission time (see reconcile.ts), and the emitted
 * `solve()` plus its residual act as an independent cross-check on that
 * arithmetic.
 *
 * WHAT DOES NOT WORK, and why (all measured):
 *
 *   Workplane.polyline(pts).close() -> extrude
 *       INVALID. vol 2x, 10 faces, isValid()=false. Root cause is upstream:
 *       `face::make_from_wires` (go-topo src/face.cc:1161-1162) constructs
 *       `BRepBuilderAPI_MakeFace(wire)` and then calls `Add(wire)` with the same
 *       wire, registering it as both outer and inner. OCCT returns a compound of
 *       two coincident faces, so the extrude makes two overlapping prisms.
 *       Workplane.rect() -> extrude fails the same way.
 *
 *   Sketch.polygon(points) with the first point NOT repeated
 *       INVALID (vol 0, 5 faces). `sketch::polygon` calls
 *       `wire::make_polygon(vertices, /*close=* /false)`, so close is hardcoded
 *       off and the caller must repeat the first point. A closed point list
 *       works; an open one makes a degenerate face.
 *
 *   Sketch.close() after segments
 *       throws an untranslated C++ exception.
 *
 *   arcByCenter(center, r, a1, sweep)
 *       throws once the edges are wired. arcByThreePoints works.
 *
 *   Sketch.edge(Wire)
 *       the binding wants an Edge and rejects a Wire.
 *
 * PLACEMENT: the sketch path ignores the datum plane's origin entirely — every
 * named plane behaves the same, and a profile always lands where its own
 * coordinates say, starting at the plane's zero level. So profiles are emitted
 * at the origin and the placement is applied to the resulting solid.
 */

import type {
  DatumPlane,
  ProfileEntity,
  SketchConstraint,
  SketchConstraintKind,
  SketchConstraintValue,
  SketchSpec,
} from "./model.js";
import { reconcileSketch, type ReconcileReport } from "./reconcile.js";
import { chainEntities, findConnectedComponents, near } from "./chain.js";

// ---------------------------------------------------------------------------
// Plane mapping
// ---------------------------------------------------------------------------

export function planeNormal(plane: DatumPlane): [number, number, number] {
  switch (plane.kind) {
    case "XY":
      return [0, 0, 1];
    case "XZ":
      return [0, -1, 0];
    case "YZ":
      return [1, 0, 0];
    case "custom":
      return plane.normal ?? [0, 0, 1];
  }
}

/**
 * Map profile coordinates (u, v) onto 3D world coordinates for a datum plane.
 *
 * The mapping is the plane's own axes, and the plane's origin is included. Note
 * that the named planes agree with this: on XZ the profile's v becomes world Z
 * and the extrusion runs along -Y; on YZ, u becomes world Y and the extrusion
 * runs along +X.
 */
export function planeTo3D(plane: DatumPlane, u: number, v: number): [number, number, number] {
  const [ox, oy, oz] = plane.origin;
  switch (plane.kind) {
    case "XY":
      return [ox + u, oy + v, oz];
    case "XZ":
      return [ox + u, oy, oz + v];
    case "YZ":
      return [ox, oy + u, oz + v];
    case "custom": {
      const n = plane.normal ?? [0, 0, 1];
      const x = plane.xAxis ?? perpendicular(n);
      const y = cross(n, x);
      return [
        ox + u * x[0] + v * y[0],
        oy + u * x[1] + v * y[1],
        oz + u * x[2] + v * y[2],
      ];
    }
  }
}

function cross(a: number[], b: number[]): [number, number, number] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function perpendicular(n: number[]): [number, number, number] {
  const axis = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  const p = cross(n, axis);
  const len = Math.hypot(...p) || 1;
  return [p[0] / len, p[1] / len, p[2] / len];
}

/**
 * Format a number for emission, refusing anything that is not one.
 *
 * The tree is authored by a model, so a coordinate or dimension can arrive as a
 * string, an array, or undefined. Calling `.toFixed` on that used to throw
 * "v.toFixed is not a function" from inside the emitter, which names neither the
 * value nor the field — the caller only learns that some sketch failed. This
 * names the value instead.
 */
function num(v: number): string {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(
      `expected a finite number to emit, got ${v === undefined ? "undefined" : JSON.stringify(v)}`,
    );
  }
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6)));
}

function sanitize(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, "_");
}

// ---------------------------------------------------------------------------
// Arc geometry
// ---------------------------------------------------------------------------

/** Signed sweep from start to end, honouring the clockwise flag. */
export function arcSweep(e: ProfileEntity): { start: number; sweep: number } {
  if (!e.center) throw new Error(`Entity "${e.tag}" has no center`);
  if (e.type === "circle") return { start: 0, sweep: 2 * Math.PI };

  const a1 = Math.atan2(e.start![1] - e.center[1], e.start![0] - e.center[0]);
  const a2 = Math.atan2(e.end![1] - e.center[1], e.end![0] - e.center[0]);
  let sweep = a2 - a1;
  if (e.clockwise) {
    while (sweep > 0) sweep -= 2 * Math.PI;
    if (sweep === 0) sweep = -2 * Math.PI;
  } else {
    while (sweep < 0) sweep += 2 * Math.PI;
    if (sweep === 0) sweep = 2 * Math.PI;
  }
  return { start: a1, sweep };
}

/**
 * Three points on an arc: its start, its midpoint, its end.
 *
 * `arcByThreePoints` is the construction that survives being wired into a face;
 * `arcByCenter` throws at that point.
 */
export function arcThreePoints(e: ProfileEntity): { p1: [number, number]; p2: [number, number]; p3: [number, number] } {
  const { start, sweep } = arcSweep(e);
  const [cx, cy] = e.center!;
  const r = e.radius!;
  const mid = start + sweep / 2;
  return {
    p1: [cx + r * Math.cos(start), cy + r * Math.sin(start)],
    p2: [cx + r * Math.cos(mid), cy + r * Math.sin(mid)],
    p3: [cx + r * Math.cos(start + sweep), cy + r * Math.sin(start + sweep)],
  };
}

/** Sample an arc into points; used for point-loop reconstruction and holes. */
export function tessellateArc(e: ProfileEntity, segments = 16): Array<[number, number]> {
  if (!e.center || !e.radius) return [];
  const [cx, cy] = e.center;
  const r = e.radius;

  if (e.type === "circle") {
    return Array.from({ length: segments }, (_, i) => {
      const a = (2 * Math.PI * i) / segments;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
    });
  }

  const { start, sweep } = arcSweep(e);
  const n = Math.max(2, Math.ceil((Math.abs(sweep) / (2 * Math.PI)) * segments));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = start + (sweep * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
}

// ---------------------------------------------------------------------------
// Chain walking (moved to ./chain.js so reconciliation can use it without an
// import cycle; re-exported here because this module is the public surface)
// ---------------------------------------------------------------------------

export { chainEntities, findConnectedComponents };

function reverseEntity(e: ProfileEntity): ProfileEntity {
  return { ...e, start: e.end, end: e.start, clockwise: e.clockwise === undefined ? undefined : !e.clockwise };
}

/**
 * Walk the profile's entities into one ordered, oriented chain.
 *
 * `forward: false` means the chain traverses that entity from its authored end
 * back to its authored start, which the JOIN derivation needs: the solver's
 * parameter t is relative to the authored direction.
 */

/**
 * The point loop the chain describes, arcs tessellated.
 *
 * Used by the profile validator and for closure reporting; the emitter prefers
 * exact arcs.
 */
export function profileToPoints(
  entities: ProfileEntity[],
  tol = 1e-3,
): Array<[number, number]> | null {
  const real = entities.filter((e) => !e.construction);
  if (real.length === 0) return null;
  if (real.length === 1 && real[0].type === "circle") return tessellateArc(real[0]);

  const chain = chainEntities(entities, tol);
  if (!chain) return null;

  const points: Array<[number, number]> = [];
  for (const { entity, forward } of chain) {
    const oriented = forward ? entity : reverseEntity(entity);
    const pts = oriented.type === "line" ? [oriented.start!, oriented.end!] : tessellateArc(oriented);
    for (const pt of pts) {
      const last = points[points.length - 1];
      if (last && near(last, pt, 1e-9)) continue;
      points.push(pt);
    }
  }
  while (points.length > 1 && near(points[points.length - 1], points[0], 1e-9)) {
    points.pop();
  }
  return points.length >= 3 ? points : null;
}

// ---------------------------------------------------------------------------
// Constraint mapping
// ---------------------------------------------------------------------------

/**
 * Map a model constraint onto the binding's constraint kind.
 *
 * JOIN is the interesting case: it is a zero-distance constraint between two
 * entity parameters, NOT the binding's COINCIDENT, which makes segments overlap
 * instead of meet (and which collapses a rectangle into a degenerate fan at zero
 * residual).
 */
function bindingKind(c: SketchConstraint): {
  kind: SketchConstraintKind;
  value: SketchConstraintValue | undefined;
} {
  if (c.kind === "JOIN") {
    const pair = Array.isArray(c.value) && c.value.length >= 2 ? c.value : [1, 0];
    return { kind: "DISTANCE", value: [pair[0] as number, pair[1] as number, 0] };
  }
  return { kind: c.kind, value: c.value };
}

function valueLiteral(v: SketchConstraintValue | undefined): string {
  if (v === undefined) return "";
  if (typeof v === "number") return `, ${v}`;
  if (v.length === 2) return `, [${v[0]}, ${v[1]}]`;
  const [t1, t2, d] = v;
  return `, [${t1 === null ? "null" : t1}, ${t2 === null ? "null" : t2}, ${d}]`;
}

function emitConstraint(skVar: string, c: SketchConstraint): string {
  const { kind, value } = bindingKind(c);
  const valueStr = valueLiteral(value);
  const note = c.note ? ` // ${c.note}` : "";
  if (c.tags.length === 2) {
    return `${skVar}.constrain(${JSON.stringify(c.tags[0])}, ${JSON.stringify(c.tags[1])}, K.${kind}${valueStr});${note}`;
  }
  return `${skVar}.constrain(${JSON.stringify(c.tags[0])}, K.${kind}${valueStr});${note}`;
}

/**
 * Derive the endpoint-joining constraints the profile needs.
 *
 * A chain of segments is not a loop until its ends are joined, and the binding
 * wants that stated explicitly as a zero-distance constraint between entity
 * parameters. Deriving it from adjacency rather than asking for it means
 * connectivity can never be omitted — and an unjoined profile does not merely
 * come out under-constrained, it solves to a degenerate fan.
 */
export function deriveJoinConstraints(entities: ProfileEntity[]): SketchConstraint[] {
  const chain = chainEntities(entities);
  if (!chain || chain.length < 2) return [];

  const out: SketchConstraint[] = [];
  for (let i = 0; i < chain.length; i++) {
    const a = chain[i];
    const b = chain[(i + 1) % chain.length];
    out.push({
      kind: "JOIN",
      tags: [a.entity.tag, b.entity.tag],
      value: [a.forward ? 1 : 0, b.forward ? 0 : 1, 0],
      note: "derived: consecutive profile edges meet",
    });
  }
  return out;
}

/** The sketch's own constraints plus the derived joins, de-duplicated. */
/**
 * Constraint kinds the binding actually implements.
 *
 * `tp.SketchConstraintKind` has exactly these; anything else is `undefined`, and
 * passing `undefined` where an enum is expected fails inside Embind's marshaller
 * with an error whose message is itself `undefined` — which is how a live run
 * ended with no body at all and the report "Cannot read properties of undefined
 * (reading 'value')". A model asked for a horizontality constraint will reach for
 * `HORIZONTAL`, which is the name every other CAD system uses.
 */
const EMITTABLE_CONSTRAINT_KINDS: ReadonlySet<string> = new Set([
  "FIXED",
  "FIXED_POINT",
  "COINCIDENT",
  "ANGLE",
  "LENGTH",
  "DISTANCE",
  "RADIUS",
  "ORIENTATION",
  "ARC_ANGLE",
  // The project's own spelling for an endpoint join, mapped to DISTANCE below.
  "JOIN",
]);

/**
 * Relations the binding has no kind for, but that mean something it can express.
 *
 * `HORIZONTAL` and `VERTICAL` are the names every CAD system uses and the binding
 * has neither — a live run wrote 17 such constraints across one sketch and every
 * one was dropped. They are not lost causes: "this line is horizontal" IS
 * `ORIENTATION [1, 0]`, which the binding has and which reconciliation already
 * applies to the geometry. Translating them turns a dropped intent into a
 * constraint the emitter enforces.
 *
 * The rest — PARALLEL, PERPENDICULAR, TANGENT, SYMMETRIC — are inter-entity and
 * have no confident mapping, so they are still refused rather than guessed at.
 */
const TRANSLATED_RELATIONS: Record<string, "x" | "y"> = {
  HORIZONTAL: "x",
  VERTICAL: "y",
};

/**
 * The axis-aligned direction to pin a line to, in the sign it is already drawn.
 *
 * `ORIENTATION [1, 0]` is a SIGNED direction, while "horizontal" means parallel to
 * the axis — either way. Asserting `[1, 0]` on an edge drawn right-to-left states
 * the opposite of what is there: a live profile had three such edges in a closed
 * chain, the solver had to flip them, the joins broke, and it wandered to
 * coordinates like 13380 while reporting a residual of 4.9. Taking the sign from
 * the authored geometry keeps the intent ("this line is axis-aligned") and leaves
 * the coordinates satisfying it, so the solver has nothing to move.
 */
function signedAxis(
  entity: ProfileEntity | undefined,
  axis: "x" | "y",
): [number, number] | null {
  if (!entity || entity.type !== "line" || !entity.start || !entity.end) return null;
  const dx = entity.end[0] - entity.start[0];
  const dy = entity.end[1] - entity.start[1];
  if (axis === "x") return dx >= 0 ? [1, 0] : [-1, 0];
  return dy >= 0 ? [0, 1] : [0, -1];
}

export interface DroppedConstraint {
  kind: SketchConstraintKind;
  tags: string[];
  reason: string;
}

export interface MergeConstraintsResult {
  constraints: SketchConstraint[];
  dropped: DroppedConstraint[];
}

/**
 * Merge the model's constraints with the joins derived from the profile.
 *
 * Connectivity must be stated exactly once, and in the form the binding actually
 * implements. `JOIN` is "the endpoints of these two entities meet"; the binding's
 * `COINCIDENT` is "these two segments overlap", which for a rectangle's adjacent
 * edges is a contradiction of the derived join rather than a repetition of it.
 *
 * Getting this wrong is not a cosmetic matter: a model that spelled connectivity
 * `COINCIDENT` had both constraints emitted for all four edge pairs of a plate,
 * and the sketch solver reported a residual of 6986.67 where the same sketch with
 * only the derived joins reports 0 (measured). The geometry still came out right,
 * because reconciliation places it and `solve()` does not write back — so the
 * failure surfaced only as L3 refusing to certify a correct part.
 */
export function mergeConstraintsVerbose(sketch: SketchSpec): MergeConstraintsResult {
  const derived = deriveJoinConstraints(sketch.entities);
  const derivedPairs = new Set(derived.map((c) => pairKey(c.tags)));

  const constraints: SketchConstraint[] = [];
  const dropped: DroppedConstraint[] = [];

  for (const c of sketch.constraints) {
    const translation = TRANSLATED_RELATIONS[c.kind];
    if (translation) {
      // Only lines have a direction to fix.
      const lines = c.tags.filter(
        (tag) => sketch.entities.find((e) => e.tag === tag)?.type === "line",
      );
      if (lines.length === 0) {
        dropped.push({
          kind: c.kind,
          tags: c.tags,
          reason: `${c.kind} applies to lines and none of these tags is one`,
        });
        continue;
      }
      let signed = 0;
      for (const tag of lines) {
        const value = signedAxis(
          sketch.entities.find((e) => e.tag === tag),
          translation,
        );
        if (!value) continue;
        constraints.push({
          kind: "ORIENTATION",
          tags: [tag],
          value,
          note: `${c.kind} expressed as the axis direction it is drawn in`,
        });
        signed++;
      }
      if (signed === 0) {
        dropped.push({
          kind: c.kind,
          tags: c.tags,
          reason: `${c.kind} could not be read off any of these lines`,
        });
      }
      continue;
    }

    if (!EMITTABLE_CONSTRAINT_KINDS.has(c.kind)) {
      dropped.push({
        kind: c.kind,
        tags: c.tags,
        reason: `the binding implements ${[...EMITTABLE_CONSTRAINT_KINDS].filter((k) => k !== "JOIN").join(", ")} — it has no ${c.kind}, and emitting K.${c.kind} is undefined`,
      });
      continue;
    }

    const statesConnectivity = c.kind === "JOIN" || c.kind === "COINCIDENT";
    if (!statesConnectivity || c.tags.length !== 2) {
      constraints.push(c);
      continue;
    }

    if (derivedPairs.has(pairKey(c.tags))) {
      dropped.push({
        kind: c.kind,
        tags: c.tags,
        reason: "the emitter already derives this join from the profile's adjacency",
      });
      continue;
    }

    // An explicit JOIN that names its own parameter pair is a complete
    // statement, so it is honoured as written.
    if (c.kind === "JOIN" && Array.isArray(c.value) && c.value.length >= 2) {
      constraints.push(c);
      continue;
    }

    // Anything else would be emitted with the binding's "these overlap" meaning,
    // which is not what the model meant and not something a profile wants.
    dropped.push({
      kind: c.kind,
      tags: c.tags,
      reason:
        c.kind === "COINCIDENT"
          ? "COINCIDENT in this binding means the two segments overlap, not that their endpoints meet; the profile's adjacency did not make this pair consecutive, so there was no join to derive"
          : "the join names no parameter pair for its endpoints and the adjacency did not supply one",
    });
  }

  return { constraints: [...constraints, ...derived], dropped };
}

export function mergeConstraints(sketch: SketchSpec): SketchConstraint[] {
  return mergeConstraintsVerbose(sketch).constraints;
}

function pairKey(tags: string[]): string {
  return [...tags].sort().join("|");
}

// ---------------------------------------------------------------------------
// Profile classification
// ---------------------------------------------------------------------------

export interface CircleProfile {
  kind: "circle";
  centre: [number, number];
  radius: number;
}

export interface LoopProfile {
  kind: "loop";
  /** The ordered, oriented chain. */
  chain: Array<{ entity: ProfileEntity; forward: boolean }>;
  /** Tessellated point loop, for reporting and area checks. */
  points: Array<[number, number]>;
}

/**
 * A sketch holding several disjoint closed profiles.
 *
 * Kept non-recursive on purpose: a component is a circle or a loop, never
 * another multi, so the nesting is impossible rather than merely unused.
 */
export interface MultiComponentProfile {
  kind: "multi";
  /** Disjoint components in deterministic order (sorted by first entity tag). */
  components: Array<CircleProfile | LoopProfile>;
}

export type ClassifiedProfile = CircleProfile | LoopProfile | MultiComponentProfile;

/**
 * Decompose non-construction entities into connected components.
 *
 * Two entities share a component when one of their endpoints is within `tol`
 * of an endpoint of the other. Circles are always isolated — they have no
 * endpoints to share.
 */
/**
 * Classify a profile into the construction it needs.
 *
 * Returns null when the entities do not form a single closed loop, which the
 * profile validator should already have caught. Note that this no longer
 * restricts the outline — arbitrary polygons and line/arc loops both build.
 *
 * When the sketch contains N >= 2 disjoint components (e.g. several circles or
 * a mix of circles and loops), returns a `MultiComponentProfile` that lists
 * each component separately.
 */
export function classifyProfile(entities: ProfileEntity[]): ClassifiedProfile | null {
  const real = entities.filter((e) => !e.construction);
  if (real.length === 0) return null;

  // Single circle — the fast path, unchanged.
  if (real.length === 1 && real[0].type === "circle") {
    const c = real[0];
    if (!c.center || !c.radius) return null;
    return { kind: "circle", centre: [c.center[0], c.center[1]], radius: c.radius };
  }

  // Multiple components — decompose and classify each one.
  const components = findConnectedComponents(entities);
  if (components.length === 0) return null;
  if (components.length >= 2) {
    const classified: Array<CircleProfile | LoopProfile> = [];
    for (const comp of components) {
      if (comp.length === 1 && comp[0].type === "circle") {
        const c = comp[0];
        if (!c.center || !c.radius) return null;
        classified.push({ kind: "circle", centre: [c.center[0], c.center[1]], radius: c.radius });
      } else {
        const compChain = chainEntities(comp);
        if (!compChain) return null;
        const compPoints = profileToPoints(comp);
        if (!compPoints) return null;
        classified.push({ kind: "loop", chain: compChain, points: compPoints });
      }
    }
    // Sort components by first entity tag for deterministic output.
    classified.sort((a, b) => {
      const tagA = a.kind === "circle" ? a.centre.join(",") : a.chain[0].entity.tag;
      const tagB = b.kind === "circle" ? b.centre.join(",") : b.chain[0].entity.tag;
      if (a.kind === "circle" && b.kind !== "circle") return -1;
      if (a.kind !== "circle" && b.kind === "circle") return 1;
      return tagA.localeCompare(tagB);
    });
    return { kind: "multi", components: classified };
  }

  // Single loop — the fast path, unchanged.
  const chain = chainEntities(entities);
  if (chain) {
    const points = profileToPoints(entities);
    if (points) return { kind: "loop", chain, points };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Emission
// ---------------------------------------------------------------------------

export interface EmittedProfile {
  /** Variable the resulting Workplane is bound to (ready to extrude). */
  wpVar: string;
  /** Which construction was used. */
  kind: ClassifiedProfile["kind"];
  /**
   * Whether the emitted code runs the kernel solver and records a report.
   *
   * A circle is exact by construction: it has no per-edge tags to constrain and
   * `sketch.circle` places it directly, so there is neither a solve() call nor a
   * status to read. Callers that check solver convergence must expect reports
   * only from sketches this is true for, or they will report a circle as a
   * sketch that failed to solve.
   */
  solved: boolean;
  /** Constraints that were left out, and why. Surfaced by the caller. */
  warnings: string[];
  /** Code building the placed sketch. */
  code: string[];
  /**
   * World-space offset to apply AFTER the extrude.
   *
   * The sketch ignores the datum plane's origin, so placement goes on the solid.
   */
  placement: [number, number, number];
  /** What applying the dimensions to the coordinates did. */
  reconciliation: ReconcileReport;
}

export interface EmitGeometryOptions {
  indent?: string;
  /** Variable the resulting Workplane is bound to. */
  wpVar: string;
  /** Map solve reports land in; omit to skip report capture. */
  reportMapVar?: string | null;
}

/**
 * Emit a closed profile as a constrained sketch.
 *
 * A circle uses `sketch.circle`, which is exact and verified. Everything else
 * goes through segments and three-point arcs, which is the only construction that
 * carries per-edge tags and therefore the only one that can be constrained.
 *
 * A multi-component sketch (several disjoint circles, or a mix of circles and
 * loops) is emitted as separate sketches — one per component — each extruded
 * individually and unioned into a compound.  This is necessary because the
 * kernel's `sk.circle()` places at sketch-local (0,0) with no center parameter,
 * so multiple circles in one sketch all overlap.  `assemble()` also crashes
 * when called after `sk.circle()`, making single-sketch multi-circle impossible.
 */
export function emitProfileGeometry(
  sketch: SketchSpec,
  entities: ProfileEntity[],
  opts: EmitGeometryOptions,
): EmittedProfile {
  const I = opts.indent ?? "  ";

  // Dimensions are applied to the coordinates here, because the binding's
  // runtime solver computes a solution without writing it back (see
  // reconcile.ts). The emitted code then carries the solved geometry AND the
  // constraints, so the kernel's own solver re-checks the arithmetic at runtime.
  const reconciled = reconcileSketch({ ...sketch, entities });
  // Detect multi-component on ORIGINAL entities (reconciled drops disconnected
  // pieces), but build the final profile on reconciled entities so segments
  // carry the dimensioned coordinates.
  const multiCheck = classifyProfile(entities);
  const isMulti = multiCheck?.kind === "multi";
  const classified = isMulti ? multiCheck : classifyProfile(reconciled.entities);
  if (!classified) {
    const err = reconciled.report.closureError;
    const detail = Number.isFinite(err)
      ? `after applying the dimensions the loop misses its start by ${err.toFixed(4)} — the constraints do not describe a closed shape`
      : "the profile entities do not form a single closed chain";
    const unhonoured = reconciled.report.unhonoured
      .map((u) => `${u.constraint} (${u.reason})`)
      .join("; ");
    throw new Error(
      `sketch "${sketch.id}": no closed profile can be built — ${detail}` +
        (unhonoured ? `. Unapplied constraints: ${unhonoured}` : ""),
    );
  }
  if (sketch.plane.kind === "custom") {
    throw new Error(
      `sketch "${sketch.id}": custom datum planes are not supported — the sketch path places the profile by its own coordinates, and only named planes (XY / XZ / YZ) have a verified mapping`,
    );
  }

  // --- single circle (unchanged fast path) -----------------------------
  if (classified.kind === "circle") {
    const skVar = `sk_${sanitize(sketch.id)}`;
    const code: string[] = [];
    const plane = `new tp.Workplane(${JSON.stringify(sketch.plane.kind)}, v(0, 0, 0), undefined)`;
    code.push(`${I}const ${skVar} = ${plane}.sketch();`);
    code.push(
      `${I}${skVar}.circle(${num(classified.radius)}, tp.SketchMode.ADD, ${JSON.stringify(sketch.id)});`,
    );
    code.push(`${I}const ${opts.wpVar} = ${skVar}.finalize();`);
    return {
      wpVar: opts.wpVar,
      kind: "circle",
      solved: false,
      warnings: [],
      code,
      placement: planeTo3D(sketch.plane, classified.centre[0], classified.centre[1]),
      reconciliation: reconciled.report,
    };
  }

  // --- single loop (unchanged fast path) -------------------------------
  if (classified.kind === "loop") {
    const skVar = `sk_${sanitize(sketch.id)}`;
    const code: string[] = [];
    const plane = `new tp.Workplane(${JSON.stringify(sketch.plane.kind)}, v(0, 0, 0), undefined)`;
    code.push(`${I}const ${skVar} = ${plane}.sketch();`);

    // --- entities ---------------------------------------------------------
    for (const { entity, forward } of classified.chain) {
      const e = forward ? entity : reverseEntity(entity);
      const tag = JSON.stringify(e.tag);
      const construction = e.construction ? "true" : "false";
      if (e.type === "line") {
        code.push(
          `${I}${skVar}.segmentBetweenPoints(v(${num(e.start![0])}, ${num(e.start![1])}, 0), v(${num(e.end![0])}, ${num(e.end![1])}, 0), ${tag}, ${construction});`,
        );
      } else {
        const { p1, p2, p3 } = arcThreePoints(e);
        code.push(
          `${I}${skVar}.arcByThreePoints(v(${num(p1[0])}, ${num(p1[1])}, 0), v(${num(p2[0])}, ${num(p2[1])}, 0), v(${num(p3[0])}, ${num(p3[1])}, 0), ${tag}, ${construction});`,
        );
      }
    }

    // --- constraints ------------------------------------------------------
    const merged = mergeConstraintsVerbose({ ...sketch, entities: reconciled.entities });
    for (const c of merged.constraints) {
      code.push(`${I}${emitConstraint(skVar, c)}`);
    }

    // --- solve, report, assemble -----------------------------------------
    // The solver is a CROSS-CHECK: reconciliation already placed the geometry and
    // `solve()` does not write back, so a solve that throws says nothing about the
    // body. It is also the one call here that can throw — the kernel's NLopt
    // backend fails outright on some constraint sets ("Sketch.solve: nlopt
    // failure", measured), and letting that escape lost the whole model. It is
    // recorded instead, and L3 reports it as the failed verification it is.
    const map = opts.reportMapVar ?? "__solveReports";
    const reportLine =
      opts.reportMapVar === null
        ? ""
        : `${I}${map}[${JSON.stringify(sketch.id)}] = ${skVar}.solve_status();`;
    code.push(`${I}try {`);
    code.push(`${I}${I}${skVar}.solve();`);
    if (reportLine) code.push(`${I}${I}${reportLine.trim()}`);
    code.push(`${I}} catch (e) {`);
    if (reportLine) {
      code.push(
        `${I}${I}${map}[${JSON.stringify(sketch.id)}] = { status: -1, cost: Infinity, note: String((e && e.message) || e) };`,
      );
    }
    code.push(`${I}}`);
    // Without assemble the sketch holds loose edges and extrude finds no wires.
    code.push(`${I}${skVar}.assemble(tp.SketchMode.ADD, undefined);`);
    code.push(`${I}const ${opts.wpVar} = ${skVar}.finalize();`);

    // The profile's own coordinates are relative to the plane origin, so the
    // placement is the plane origin expressed in world coordinates.
    return {
      wpVar: opts.wpVar,
      kind: "loop",
      solved: true,
      warnings: constraintWarnings(sketch.id, merged.dropped),
      code,
      placement: planeTo3D(sketch.plane, 0, 0),
      reconciliation: reconciled.report,
    };
  }

  // --- multi-component: separate sketches per component -----------------
  // The kernel's sk.circle() places at sketch-local (0,0) with no center
  // parameter, and assemble() crashes after sk.circle().  So each component
  // gets its own sketch, finalised to a workplane, and the wrapper's
  // extrude() method extrudes each workplane on demand and unions the results.
  const code: string[] = [];
  const droppedAll: DroppedConstraint[] = [];
  const wpVars: string[] = []; // workplane variables (one per component)
  const placementExprs: string[] = []; // placement translate expressions
  let hasLoop = false;

  for (let i = 0; i < classified.components.length; i++) {
    const comp = classified.components[i];
    const compWpVar = `${opts.wpVar}_wp${i}`;
    const compSkVar = `sk_${sanitize(sketch.id)}_c${i}`;

    if (comp.kind === "circle") {
      const plane = `new tp.Workplane(${JSON.stringify(sketch.plane.kind)}, v(0, 0, 0), undefined)`;
      code.push(`${I}const ${compSkVar} = ${plane}.sketch();`);
      // Tag must be a valid JS string literal.
      const tag = JSON.stringify(`${sketch.id}_c${i}`);
      code.push(
        `${I}${compSkVar}.circle(${num(comp.radius)}, tp.SketchMode.ADD, ${tag});`,
      );
      code.push(`${I}const ${compWpVar} = ${compSkVar}.finalize();`);
      wpVars.push(compWpVar);
      // Each circle is at sketch-local (0,0); translate to its center after extrude.
      const [cx, cy] = comp.centre;
      const placement = planeTo3D(sketch.plane, cx, cy);
      placementExprs.push(`.translate(gv(${num(placement[0])}, ${num(placement[1])}, ${num(placement[2])}))`);
    } else {
      hasLoop = true;
      const plane = `new tp.Workplane(${JSON.stringify(sketch.plane.kind)}, v(0, 0, 0), undefined)`;
      code.push(`${I}const ${compSkVar} = ${plane}.sketch();`);

      // Re-chain from reconciled entities so segments carry dimensioned coords.
      const compEntityTags = new Set(comp.chain.map((c) => c.entity.tag));
      const reconciledComp = reconciled.entities.filter((e) => compEntityTags.has(e.tag));
      const compChain = chainEntities(reconciledComp) ?? comp.chain;

      for (const { entity, forward } of compChain) {
        const e = forward ? entity : reverseEntity(entity);
        const tag = JSON.stringify(e.tag);
        const construction = e.construction ? "true" : "false";
        if (e.type === "line") {
          code.push(
            `${I}${compSkVar}.segmentBetweenPoints(v(${num(e.start![0])}, ${num(e.start![1])}, 0), v(${num(e.end![0])}, ${num(e.end![1])}, 0), ${tag}, ${construction});`,
          );
        } else {
          const { p1, p2, p3 } = arcThreePoints(e);
          code.push(
            `${I}${compSkVar}.arcByThreePoints(v(${num(p1[0])}, ${num(p1[1])}, 0), v(${num(p2[0])}, ${num(p2[1])}, 0), v(${num(p3[0])}, ${num(p3[1])}, 0), ${tag}, ${construction});`,
          );
        }
      }

      // Constraints for this component's entities only.
      const compConstraints = reconciledComp.length > 0
        ? sketch.constraints.filter((c) => c.tags.every((t) => compEntityTags.has(t)))
        : [];
      const compSketch = { ...sketch, entities: reconciledComp, constraints: compConstraints };
      const compMerged = mergeConstraintsVerbose(compSketch);
      droppedAll.push(...compMerged.dropped);
      for (const c of compMerged.constraints) {
        code.push(`${I}${emitConstraint(compSkVar, c)}`);
      }

      code.push(`${I}try { ${compSkVar}.solve(); } catch { /* cross-check only */ }`);
      code.push(`${I}${compSkVar}.assemble(tp.SketchMode.ADD, undefined);`);
      code.push(`${I}const ${compWpVar} = ${compSkVar}.finalize();`);
      wpVars.push(compWpVar);
      // Loop components are already at their correct positions in the sketch.
      placementExprs.push("");
    }
  }

  // The wrapper's extrude() extrudes each workplane to the requested depth,
  // translates each to its placement, and unions the results.  This matches
  // what feature_codegen.ts expects: wp.extrude(dist, ...).translate(...).
  const extrudeBody = wpVars
    .map((wp, i) => `${wp}.extrude(dist, b1, b2, b3, taper)${placementExprs[i]}`)
    .join(".union(");
  const unionSuffix = wpVars.length > 1
    ? ")" .repeat(wpVars.length - 1)
    : "";
  code.push(
    `${I}const ${opts.wpVar} = { extrude: function(dist, b1, b2, b3, taper) { return ${extrudeBody}${unionSuffix}; }, val: function() { return this.extrude(1, true, true, false, undefined); } };`,
  );

  // Placement is zero — each component is already translated to its position.
  return {
    wpVar: opts.wpVar,
    kind: "multi",
    solved: hasLoop,
    warnings: constraintWarnings(sketch.id, droppedAll),
    code,
    placement: planeTo3D(sketch.plane, 0, 0),
    reconciliation: reconciled.report,
  };
}

function constraintWarnings(sketchId: string, dropped: DroppedConstraint[]): string[] {
  return dropped.map(
    (d) => `sketch ${sketchId}: dropped ${d.kind} on ${d.tags.join("+")} — ${d.reason}`,
  );
}

// ---------------------------------------------------------------------------
// Revolve validation
// ---------------------------------------------------------------------------

/**
 * A revolve profile may not cross the axis.
 *
 * go-topo silently returns an empty compound when it does, so this is checked
 * before emission rather than discovered as a null shape later.
 */
export function validateRevolveProfile(
  sketch: SketchSpec,
  axis: { start: [number, number, number]; end: [number, number, number] },
): string[] {
  const problems: string[] = [];
  const [x0, y0] = [axis.start[0], axis.start[1]];
  const [x1, y1] = [axis.end[0], axis.end[1]];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) {
    problems.push("revolve axis is degenerate (zero length)");
    return problems;
  }
  const side = (pt: [number, number]) => ((pt[0] - x0) * dy - (pt[1] - y0) * dx) / len;

  const sides = sketch.entities
    .filter((e) => !e.construction)
    .flatMap((e) => {
      const pts: Array<[number, number]> = [];
      if (e.start) pts.push(e.start);
      if (e.end) pts.push(e.end);
      if (e.center) pts.push(e.center);
      return pts.map(side);
    });

  if (sides.length === 0) return problems;

  const hasPositive = sides.some((s) => s > 1e-6);
  const hasNegative = sides.some((s) => s < -1e-6);
  const onAxis = sides.some((s) => Math.abs(s) <= 1e-6);

  if (hasPositive && hasNegative) {
    // Two very different mistakes look the same from "it crosses the axis": a
    // profile merely offset across the line, and the FULL symmetric outline of the
    // part, which is what a drawing of a whole assembly gives you. The second is
    // what a model reaching for revolve actually produces, and saying so is the
    // difference between "move it" and "you have twice the profile".
    const positives = sides.filter((v) => v > 1e-6);
    const negatives = sides.filter((v) => v < -1e-6);
    const reach = (values: number[]) =>
      Math.max(...values.map(Math.abs));
    const balanced =
      positives.length === negatives.length &&
      Math.abs(reach(positives) - reach(negatives)) <= Math.max(1e-6, reach(positives) * 0.02);

    problems.push(
      balanced
        ? `revolve profile is the part's FULL symmetric outline (it reaches ${reach(positives).toFixed(1)} either side of the axis, ${positives.length} points each way) — a revolve takes the half on ONE side, so this describes the part twice and go-topo returns an empty shape for it`
        : `revolve profile crosses the axis — go-topo silently produces an empty shape for this; offset the profile to one side`,
    );
    problems.push(
      "drawings of a whole part give the full outline, so extrude it (pad) instead of revolving it; revolve only fits a half-section drawn from the axis outward",
    );
  }
  if (!onAxis && !hasPositive && !hasNegative) {
    problems.push("revolve profile does not touch the axis — the revolve would not close");
  }
  return problems;
}
