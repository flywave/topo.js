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

function num(v: number): string {
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
// Chain walking
// ---------------------------------------------------------------------------

function near(a: [number, number], b: [number, number], tol: number): boolean {
  return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
}

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
export function chainEntities(
  entities: ProfileEntity[],
  tol = 1e-3,
): Array<{ entity: ProfileEntity; forward: boolean }> | null {
  const real = entities.filter((e) => !e.construction);
  const chainable = real.filter((e) => e.type !== "circle");
  if (chainable.length === 0) return null;

  const used = new Set<string>();
  const chain: Array<{ entity: ProfileEntity; forward: boolean }> = [];
  const first = chainable[0];
  chain.push({ entity: first, forward: true });
  used.add(first.tag);
  let tail = first.end!;
  const head = first.start!;

  while (true) {
    if (near(tail, head, tol)) break;
    let next: ProfileEntity | undefined;
    let forward = true;
    for (const e of chainable) {
      if (used.has(e.tag)) continue;
      if (near(e.start!, tail, tol)) {
        next = e;
        forward = true;
        break;
      }
      if (near(e.end!, tail, tol)) {
        next = e;
        forward = false;
        break;
      }
    }
    if (!next) return null;
    used.add(next.tag);
    chain.push({ entity: next, forward });
    tail = forward ? next.end! : next.start!;
  }

  if (used.size !== chainable.length) return null;
  return chain;
}

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
export function mergeConstraints(sketch: SketchSpec): SketchConstraint[] {
  const explicit = new Set(
    sketch.constraints.filter((c) => c.kind === "JOIN").map((c) => [...c.tags].sort().join("|")),
  );
  const derived = deriveJoinConstraints(sketch.entities).filter(
    (c) => !explicit.has([...c.tags].sort().join("|")),
  );
  return [...sketch.constraints, ...derived];
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

export type ClassifiedProfile = CircleProfile | LoopProfile;

/**
 * Classify a profile into the construction it needs.
 *
 * Returns null when the entities do not form a single closed loop, which the
 * profile validator should already have caught. Note that this no longer
 * restricts the outline — arbitrary polygons and line/arc loops both build.
 */
export function classifyProfile(entities: ProfileEntity[]): ClassifiedProfile | null {
  const real = entities.filter((e) => !e.construction);
  if (real.length === 0) return null;

  if (real.length === 1 && real[0].type === "circle") {
    const c = real[0];
    if (!c.center || !c.radius) return null;
    return { kind: "circle", centre: [c.center[0], c.center[1]], radius: c.radius };
  }

  const chain = chainEntities(entities);
  if (!chain) return null;
  const points = profileToPoints(entities);
  if (!points) return null;

  return { kind: "loop", chain, points };
}

// ---------------------------------------------------------------------------
// Emission
// ---------------------------------------------------------------------------

export interface EmittedProfile {
  /** Variable the resulting Workplane is bound to (ready to extrude). */
  wpVar: string;
  /** Which construction was used. */
  kind: ClassifiedProfile["kind"];
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
  const classified = classifyProfile(reconciled.entities);
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

  const skVar = `sk_${sanitize(sketch.id)}`;
  const code: string[] = [];
  const plane = `new tp.Workplane(${JSON.stringify(sketch.plane.kind)}, v(0, 0, 0), undefined)`;

  code.push(`${I}const ${skVar} = ${plane}.sketch();`);

  if (classified.kind === "circle") {
    code.push(
      `${I}${skVar}.circle(${num(classified.radius)}, tp.SketchMode.ADD, ${JSON.stringify(sketch.id)});`,
    );
    code.push(`${I}const ${opts.wpVar} = ${skVar}.finalize();`);
    return {
      wpVar: opts.wpVar,
      kind: "circle",
      code,
      placement: planeTo3D(sketch.plane, classified.centre[0], classified.centre[1]),
      reconciliation: reconciled.report,
    };
  }

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
  for (const c of mergeConstraints({ ...sketch, entities: reconciled.entities })) {
    code.push(`${I}${emitConstraint(skVar, c)}`);
  }

  // --- solve, report, assemble -----------------------------------------
  code.push(`${I}${skVar}.solve();`);
  if (opts.reportMapVar !== null) {
    const map = opts.reportMapVar ?? "__solveReports";
    code.push(`${I}${map}[${JSON.stringify(sketch.id)}] = ${skVar}.solve_status();`);
  }
  // Without assemble the sketch holds loose edges and extrude finds no wires.
  code.push(`${I}${skVar}.assemble(tp.SketchMode.ADD, undefined);`);
  code.push(`${I}const ${opts.wpVar} = ${skVar}.finalize();`);

  // The profile's own coordinates are relative to the plane origin, so the
  // placement is the plane origin expressed in world coordinates.
  return {
    wpVar: opts.wpVar,
    kind: "loop",
    code,
    placement: planeTo3D(sketch.plane, 0, 0),
    reconciliation: reconciled.report,
  };
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
    problems.push(
      "revolve profile crosses the axis — go-topo silently produces an empty shape for this; offset the profile to one side",
    );
  }
  if (!onAxis && !hasPositive && !hasNegative) {
    problems.push("revolve profile does not touch the axis — the revolve would not close");
  }
  return problems;
}
