/**
 * Sketch reconciliation — making dimensions actually drive the geometry.
 *
 * The binding's `Sketch.solve()` is a calculator, not an editor: it finds a
 * solution and reports it in `solve_status().x`, but it does not write that
 * solution back to the sketch's edges. Measured: a sketch authored 80x50 with
 * `LENGTH 100` and `LENGTH 60` constraints solves to cost 0 with solved vectors
 * 100 and 60 long, and `assemble()` + `extrude()` then builds the authored
 * 80x50 solid. So a model that relies on the runtime solver has dimensions that
 * look meaningful and change nothing.
 *
 * This module applies the dimensions constructively instead, at emission time,
 * in TypeScript where the result is deterministic and testable:
 *
 *   1. Each entity's own dimensions fix its length/radius/sweep and direction.
 *   2. The chain is then walked, translating each entity so its entry point
 *      meets the previous entity's exit point — which is what closes the loop.
 *   3. Whatever could not be honoured is reported rather than silently dropped.
 *
 * Because emission is parameter-driven, this is also what makes the model
 * associative: change a driving dimension and the emitted coordinates change
 * with it. The runtime `solve()` is still emitted, and its residual then acts as
 * an independent cross-check on this arithmetic.
 */

import type { ProfileEntity, SketchConstraint, SketchSpec } from "./model.js";
import { chainEntities, findClosedComponents } from "./chain.js";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ReconcileReport {
  /** Constraints that were applied to the coordinates. */
  applied: string[];
  /**
   * Geometry the walk had to CHANGE to keep the loop usable, and why.
   *
   * Separate from `applied`, which records dimensions being honoured and is
   * routine: this is the walk guessing — moving an arc's centre, snapping a
   * closing edge — and a guess about geometry is exactly what a reader and the
   * repair loop need to see. These sat in `applied` and were reported nowhere.
   */
  repaired: string[];
  /** Constraints that could not be applied, with the reason. */
  unhonoured: Array<{ constraint: string; reason: string }>;
  /**
   * Distance between the loop's last exit and its first entry after
   * reconciliation. Zero means the dims describe a genuinely closed loop.
   */
  closureError: number;
  /** True when the reconciled entity count and tags match the input. */
  structurePreserved: boolean;
}

export interface ReconcileResult {
  entities: ProfileEntity[];
  report: ReconcileReport;
}

// ---------------------------------------------------------------------------
// Geometry primitives
// ---------------------------------------------------------------------------

type Vec = [number, number];

function sub(a: Vec, b: Vec): Vec {
  return [a[0] - b[0], a[1] - b[1]];
}
function add(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1]];
}
function scale(a: Vec, k: number): Vec {
  return [a[0] * k, a[1] * k];
}
function len(a: Vec): number {
  return Math.hypot(a[0], a[1]);
}
function unit(a: Vec): Vec {
  const l = len(a);
  return l < 1e-12 ? [1, 0] : [a[0] / l, a[1] / l];
}
function rot(a: Vec, angle: number): Vec {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [a[0] * c - a[1] * s, a[0] * s + a[1] * c];
}
function translateEntity(e: ProfileEntity, d: Vec): ProfileEntity {
  return {
    ...e,
    start: e.start ? add(e.start, d) : undefined,
    end: e.end ? add(e.end, d) : undefined,
    center: e.center ? add(e.center, d) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Dimension extraction
// ---------------------------------------------------------------------------

interface EntityDims {
  length?: number;
  direction?: Vec;
  radius?: number;
  sweepDeg?: number;
}

function dimsFor(tag: string, constraints: SketchConstraint[]): {
  dims: EntityDims;
  applied: string[];
  unhonoured: Array<{ constraint: string; reason: string }>;
} {
  const dims: EntityDims = {};
  const applied: string[] = [];
  const unhonoured: Array<{ constraint: string; reason: string }> = [];

  for (const c of constraints) {
    // A dimension that names several entities dimensions each of them. Models
    // write `LENGTH [e1, e3] = 120` for a rectangle's two long edges, and the
    // reading is unambiguous for the per-entity kinds below. Skipping anything
    // with more than one tag dropped those dimensions SILENTLY — applied listed
    // only the constraints that survived, unhonoured was empty — so a parameter
    // that reached the sketch only through such a dimension drove no geometry,
    // and the associativity gate then reported the parameter itself as
    // decorative. That is what a live run's four "inert parameters" were.
    if (!c.tags.includes(tag)) continue;

    // Relational kinds say something about a PAIR, not about each of them, so a
    // multi-tag one must not be read per-entity.
    const perEntity = c.tags.length === 1 || PER_ENTITY_KINDS.has(c.kind);
    if (perEntity) {
      const dimension = applyDimension(c, tag);
      if (dimension.kind === "applied") {
        const existing = dims[dimension.field];
        if (
          typeof existing === "number" &&
          typeof dimension.value === "number" &&
          Math.abs(existing - dimension.value) > 1e-9
        ) {
          unhonoured.push({
            constraint: dimension.label,
            reason: `conflicts with an earlier ${c.kind} of ${existing}`,
          });
        } else {
          dims[dimension.field] = dimension.value as never;
          applied.push(dimension.label);
        }
      } else if (dimension.kind === "noted") {
        applied.push(dimension.label);
      } else if (dimension.kind === "unhonoured") {
        unhonoured.push({ constraint: dimension.label, reason: dimension.reason });
      }
    }

    // Constraints that are genuinely inter-entity are left to the chain walk and
    // the runtime solver, exactly as before.
  }

  return { dims, applied, unhonoured };
}

/** Kinds whose meaning is "this entity has this size", so several tags each get it. */
const PER_ENTITY_KINDS: ReadonlySet<SketchConstraint["kind"]> = new Set([
  "LENGTH",
  "RADIUS",
  "ARC_ANGLE",
  "ORIENTATION",
]);

type DimensionOutcome =
  | { kind: "applied"; field: keyof EntityDims; value: number | Vec; label: string }
  /** Read, but it shapes nothing here — FIXED anchors the walk rather than a field. */
  | { kind: "noted"; label: string }
  | { kind: "unhonoured"; label: string; reason: string }
  | { kind: "ignored" };

/** Read one per-entity dimension off a constraint. */
function applyDimension(c: SketchConstraint, tag: string): DimensionOutcome {
  const label = `${c.kind}(${tag}${c.value !== undefined ? `, ${JSON.stringify(c.value)}` : ""})`;

  switch (c.kind) {
    case "LENGTH":
      if (typeof c.value !== "number") {
        return { kind: "unhonoured", label, reason: "LENGTH needs a numeric value" };
      }
      return { kind: "applied", field: "length", value: c.value, label };

    case "ORIENTATION":
      if (!Array.isArray(c.value) || c.value.length !== 2) {
        return { kind: "unhonoured", label, reason: "ORIENTATION needs [dx, dy]" };
      }
      return {
        kind: "applied",
        field: "direction",
        value: unit([c.value[0], c.value[1]]),
        label,
      };

    case "RADIUS":
      if (typeof c.value !== "number") {
        return { kind: "unhonoured", label, reason: "RADIUS needs a numeric value" };
      }
      return { kind: "applied", field: "radius", value: c.value, label };

    case "ARC_ANGLE":
      if (typeof c.value !== "number") {
        return { kind: "unhonoured", label, reason: "ARC_ANGLE needs a numeric value" };
      }
      return { kind: "applied", field: "sweepDeg", value: c.value, label };

    case "FIXED":
      // Anchoring is handled by the chain walk starting at the authored entry.
      return { kind: "noted", label };

    case "JOIN":
    case "DISTANCE":
    case "COINCIDENT":
      // Inter-entity; handled by the chain walk or the runtime solver.
      return { kind: "ignored" };

    default:
      return {
        kind: "unhonoured",
        label,
        reason: `${c.kind} has no constructive interpretation in this module`,
      };
  }
}
// ---------------------------------------------------------------------------
// Entity anchoring
// ---------------------------------------------------------------------------

/** The point the chain enters this entity at. */
export function entryPoint(e: ProfileEntity): Vec | null {
  if (e.type === "circle") return e.center ?? null;
  return e.start ?? null;
}

/** The point the chain leaves this entity at. */
export function exitPoint(e: ProfileEntity): Vec | null {
  if (e.type === "circle") return e.center ?? null;
  return e.end ?? null;
}

/**
 * Rebuild one entity with its dimensions applied, anchored at `entry`.
 *
 * The entity keeps its authored orientation unless a direction is dimensioned,
 * and its authored radius/sweep unless dimensioned. An arc is reconstructed from
 * the anchored entry point so its shape survives being moved into the chain.
 */
function anchorEntity(
  e: ProfileEntity,
  entry: Vec,
  dims: EntityDims,
): ProfileEntity {
  if (e.type === "line") {
    const authoredDir = unit(sub(e.end!, e.start!));
    // A declared direction is an AXIS, not a sense: "horizontal" says the edge runs
    // along x, not which way along it, and the same vector names both traversals.
    // Taking it as a sense flips every edge the trace walks the other way, and the
    // chain then carries the flip: measured on a real traced outline, six edges
    // were emitted backwards — one authored at (-19.5, 0) came out at (+19.5, 0) —
    // which put 272 units of error into a loop whose own extent is 125 x 150, and
    // the last edge absorbed the remainder. The outline was emitted 69% too big
    // with every dimension and every gate agreeing it was fine.
    let dir = dims.direction ?? authoredDir;
    if (dims.direction && dir[0] * authoredDir[0] + dir[1] * authoredDir[1] < 0) {
      dir = [-dir[0], -dir[1]];
    }
    const length = dims.length ?? len(sub(e.end!, e.start!));
    return { ...e, start: entry, end: add(entry, scale(dir, length)) };
  }

  if (e.type === "circle") {
    return { ...e, center: entry, radius: dims.radius ?? e.radius };
  }

  // Arc: keep the authored shape, re-anchor it so its start lands on `entry`.
  const radius = dims.radius ?? e.radius!;
  const authoredStartAngle = Math.atan2(e.start![1] - e.center![1], e.start![0] - e.center![0]);
  const authoredEndAngle = Math.atan2(e.end![1] - e.center![1], e.end![0] - e.center![0]);
  let sweep = authoredEndAngle - authoredStartAngle;
  if (e.clockwise) {
    while (sweep > 0) sweep -= 2 * Math.PI;
    if (sweep === 0) sweep = -2 * Math.PI;
  } else {
    while (sweep < 0) sweep += 2 * Math.PI;
    if (sweep === 0) sweep = 2 * Math.PI;
  }
  if (dims.sweepDeg !== undefined) {
    const magnitude = (dims.sweepDeg * Math.PI) / 180;
    sweep = sweep < 0 ? -Math.abs(magnitude) : Math.abs(magnitude);
  }

  // Entry sits on the circle at the start angle; place the centre so it does.
  const startAngle = authoredStartAngle;
  const center: Vec = [
    entry[0] - radius * Math.cos(startAngle),
    entry[1] - radius * Math.sin(startAngle),
  ];
  return {
    ...e,
    center,
    radius,
    start: entry,
    end: [
      center[0] + radius * Math.cos(startAngle + sweep),
      center[1] + radius * Math.sin(startAngle + sweep),
    ],
  };
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

export interface ReconcileOptions {
  /**
   * Where the loop is anchored. Defaults to the first entity's authored entry
   * point, which keeps an authored placement unless a dimension says otherwise.
   */
  anchor?: Vec;
}

/**
 * Apply a sketch's dimensions to its coordinates.
 *
 * Entities are placed by walking the chain in order: each one is rebuilt from
 * its own dimensions and translated so its entry meets the previous exit. That
 * makes the last entity's exit land on the first entry exactly when the
 * dimensions describe a closed loop — and the residual is reported when they do
 * not.
 *
 * A sketch may equally hold SEVERAL closed profiles — a bolt-hole pattern is one
 * sketch and one feature — so a failure to form a single chain is only a defect
 * when the pieces are not each closed in their own right. Reconciliation used to
 * report the multi-profile case as unhonoured and skip it entirely, which both
 * raised a false alarm on every such sketch and meant dimensions inside it were
 * never applied to the coordinates.
 */
export function reconcileSketch(
  sketch: SketchSpec,
  opts: ReconcileOptions = {},
): ReconcileResult {
  // Arcs the tracer gave inconsistent data for are made consistent BEFORE the
  // chain is walked, because the walk rebuilds every arc from its radius. See
  // `consistentArcs`.
  const repair = consistentArcs(sketch.entities);
  const source = { ...sketch, entities: repair.entities };
  const withRepairs = (result: ReconcileResult): ReconcileResult => ({
    ...result,
    report: { ...result.report, repaired: [...repair.notes, ...result.report.repaired] },
  });

  const chain = chainEntities(source.entities);
  if (chain) return withRepairs(reconcileChain(source, chain, opts.anchor));

  const components = findClosedComponents(source.entities);
  if (!components) {
    return {
      entities: source.entities,
      report: {
        applied: [],
        repaired: repair.notes,
        unhonoured: [{ constraint: "(sketch)", reason: "entities do not form a single closed chain" }],
        closureError: Infinity,
        structurePreserved: true,
      },
    };
  }

  const entities: ProfileEntity[] = [];
  const applied: string[] = [];
  const repaired: string[] = [...repair.notes];
  const unhonoured: ReconcileReport["unhonoured"] = [];
  let worstClosure = 0;

  for (const component of components) {
    // A circle is exact as authored and has no chain to walk.
    if (component.length === 1 && component[0].type === "circle") {
      entities.push(component[0]);
      continue;
    }
    const inner = chainEntities(component);
    if (!inner) continue;

    const done = reconcileChain({ ...sketch, entities: component }, inner);
    entities.push(...done.entities);
    applied.push(...done.report.applied);
    repaired.push(...done.report.repaired);
    unhonoured.push(...done.report.unhonoured);
    worstClosure = Math.max(worstClosure, done.report.closureError);
  }

  const originalTags = sketch.entities.map((e) => e.tag).sort().join("|");
  return {
    entities,
    report: {
      applied,
      repaired,
      unhonoured,
      closureError: worstClosure,
      // Components are regrouped rather than reordered within themselves, so the
      // entity SET is what has to survive.
      structurePreserved: entities.map((e) => e.tag).sort().join("|") === originalTags,
    },
  };
}

/**
 * Make the tracer's arcs pass through the endpoints the tracer gave them.
 *
 * A traced arc arrives as three numbers that need not agree: a centre, a radius,
 * and two endpoints. Measured on a real traced outline, the ENDPOINTS were exact —
 * the gap from each entity's end to the next one's start was 0.0000 all the way
 * round the loop — while 12 of 15 arcs had their endpoints 10-67% off their own
 * declared circle. The model produced a point chain and padded each bulge with a
 * plausible-looking centre and radius.
 *
 * Reconciliation rebuilds every arc from its radius, so an inconsistent one has its
 * endpoint thrown away and its chord rewritten to whatever that radius implies.
 * The errors then accumulate around the loop. Measured on that outline: the
 * emitted geometry was 210 x 253 for a trace whose endpoints span 125 x 150 — the
 * loop had grown 69% taller than it was drawn — and the growth was read as a
 * scale error in the trace for two rounds of work.
 *
 * Nothing has to be sacrificed. With the endpoints fixed, the centre is free to
 * slide along the chord's perpendicular bisector, and there is exactly one point
 * on it at distance `r` from both ends — the declared centre is used only to pick
 * which side. Every one of the real outline's 15 arcs had such a point. When the
 * stated radius is too small for the chord, no circle of that radius exists and
 * the arc is widened to a semicircle, which is reported rather than hidden.
 *
 * This fixed 51 of the 103 units of excess height: 253 down to 202, against a trace
 * 150 tall. The rest was a second, independent mechanism — the sense of a declared
 * direction, see `anchorEntity` — and only with both fixed is the emitted outline
 * the traced one, at 125 x 150.
 */
function consistentArcs(entities: ProfileEntity[]): { entities: ProfileEntity[]; notes: string[] } {
  const notes: string[] = [];
  let changed = false;

  const out = entities.map((e) => {
    if (e.type !== "arc" || !e.center || typeof e.radius !== "number" || !e.start || !e.end) return e;
    const [sx, sy] = e.start;
    const [tx, ty] = e.end;
    const chord = Math.hypot(tx - sx, ty - sy);
    if (!(chord > 1e-9) || !(e.radius > 1e-9)) return e;

    const ds = Math.hypot(sx - e.center[0], sy - e.center[1]);
    const de = Math.hypot(tx - e.center[0], ty - e.center[1]);
    const worst = Math.max(Math.abs(ds - e.radius), Math.abs(de - e.radius)) / e.radius;
    if (worst <= 1e-3) return e;

    const half = chord / 2;
    const radius = Math.max(e.radius, half);
    const offset = Math.sqrt(Math.max(0, radius * radius - half * half));
    const mx = (sx + tx) / 2;
    const my = (sy + ty) / 2;
    // Unit normal to the chord; the declared centre says which side to sit on.
    const nx = -(ty - sy) / chord;
    const ny = (tx - sx) / chord;
    const side = (e.center[0] - mx) * nx + (e.center[1] - my) * ny >= 0 ? 1 : -1;
    const center: [number, number] = [mx + nx * offset * side, my + ny * offset * side];

    // Which of the two arcs between these endpoints? The centre's side settles
    // where the circle is, but each pair of points on a circle is joined by a
    // minor arc and a major one, and the sweep is signed by `clockwise` — so the
    // same endpoints come out as 92° or as 268°. Measured: three consecutive arcs
    // at the top of the real outline were being emitted as 268°, 270° and 292°
    // for chords subtending 92°, 90° and 68°, which balloons the loop exactly
    // there. With the declared centre already discarded as unreliable, its implied
    // sweep is not evidence either, so the minor arc is taken — it is the one that
    // adds no bulge, and an arc that genuinely sweeps past half a turn would have
    // had endpoints that agree with its radius, and so would never reach here.
    const ccw = (() => {
      const a1 = Math.atan2(sy - center[1], sx - center[0]);
      const a2 = Math.atan2(ty - center[1], tx - center[0]);
      let d = a2 - a1;
      while (d < 0) d += 2 * Math.PI;
      return d;
    })();
    const clockwise = ccw > Math.PI;
    const sweepNote = clockwise === e.clockwise ? "" : "; it was also being drawn the long way round, so its direction was flipped";

    changed = true;
    notes.push(
      `arc ${e.tag}: its endpoints were ${((worst) * 100).toFixed(0)}% off the circle it declared ` +
        `(r=${e.radius}, |start-centre|=${ds.toFixed(2)}, |end-centre|=${de.toFixed(2)}) — the endpoints are kept ` +
        `and the centre moved onto their bisector, which is the one place a circle of radius ` +
        `${radius.toFixed(2)} passes through both` +
        (radius > e.radius ? " (the stated radius was smaller than the chord needs, so the arc was widened to a semicircle)" : "") +
        sweepNote,
    );
    return { ...e, center, radius, clockwise };
  });

  return { entities: changed ? out : entities, notes };
}

function reconcileChain(
  sketch: SketchSpec,
  chain: NonNullable<ReturnType<typeof chainEntities>>,
  anchor?: Vec,
): ReconcileResult {
  const applied: string[] = [];
  const repaired: string[] = [];
  const unhonoured: ReconcileReport["unhonoured"] = [];

  // Dimensions keyed by tag, honouring the chain's traversal direction: the
  // solver's parameter t is relative to the authored direction, so an entity
  // traversed backwards has its start/end notionally swapped.
  const byTag = new Map<string, ReturnType<typeof dimsFor>>();
  for (const { entity } of chain) {
    byTag.set(entity.tag, dimsFor(entity.tag, sketch.constraints));
  }

  const out: ProfileEntity[] = [];
  let cursor: Vec = anchor ?? entryPoint(chain[0].entity)!;

  for (let i = 0; i < chain.length; i++) {
    const { entity, forward } = chain[i];
    const oriented = forward ? entity : { ...entity, start: entity.end, end: entity.start };
    const dims = byTag.get(entity.tag)!.dims;

    const placed = anchorEntity(oriented, cursor, dims);

    // Keep the tag and the authored direction: the emitted code builds the whole
    // loop from these coordinates, so orientation only matters for the walk.
    out.push({ ...placed, tag: entity.tag, clockwise: oriented.clockwise });

    applied.push(...byTag.get(entity.tag)!.applied);
    unhonoured.push(...byTag.get(entity.tag)!.unhonoured);

    const exit = exitPoint(placed);
    if (!exit) break;
    cursor = exit;
  }

  // Closing snap. Placing every entity from its own dimensions only lands back
  // on the start when the dimensions happen to describe a closed loop; a drafter
  // leaves one edge undimensioned precisely so it can close the loop. Do the
  // same: if the loop misses and the last entity is an undimensioned line, let it
  // run to the first entry instead of leaving a gap.
  const firstEntry = entryPoint(out[0]) ?? [0, 0];
  let lastExit = exitPoint(out[out.length - 1]) ?? [0, 0];
  let closureError = len(sub(lastExit, firstEntry));

  const last = out[out.length - 1];
  const lastDims = byTag.get(last.tag)?.dims ?? {};
  if (
    closureError > 1e-9 &&
    last.type === "line" &&
    lastDims.length === undefined &&
    lastDims.direction === undefined
  ) {
    const before = closureError;
    const snapped: ProfileEntity = { ...last, end: firstEntry };
    out[out.length - 1] = snapped;
    lastExit = exitPoint(snapped) ?? lastExit;
    closureError = len(sub(lastExit, firstEntry));
    if (closureError < before) {
      repaired.push(
        `closing snap on ${last.tag} (undimensioned, so it closes the loop: ${before.toFixed(4)} -> ${closureError.toFixed(4)})`,
      );
    } else {
      out[out.length - 1] = last;
      closureError = before;
    }
  }

  // Closing the loop for anything else. A profile that misses by a fraction of a
  // percent is a drawing rounding away, not a contradiction — and a drafter closes
  // it. The snap above only reaches an undimensioned LINE; a live drawing closed
  // to 0.455mm on a 160mm profile through an arc that carried a radius, and the
  // whole model was refused over that. A short closing edge is added instead, and
  // reported, because the alternative is refusing a part that is right to three
  // digits.
  let structurePreserved =
    out.length === chain.length && out.every((e, i) => e.tag === chain[i].entity.tag);
  const extent = profileExtent(out);
  const tolerable = Math.max(1e-6, extent * 0.01);
  if (closureError > 1e-9 && closureError <= tolerable && out.length > 0) {
    const from = exitPoint(out[out.length - 1]);
    const to = entryPoint(out[0]);
    const gap = from && to ? Math.hypot(from[0] - to[0], from[1] - to[1]) : 0;
    if (from && to && gap > 1e-9) {
      out.push({ tag: "__closing", type: "line", start: from, end: to });
      repaired.push(
        `closing edge added over ${closureError.toFixed(4)} (${((closureError / (extent || 1)) * 100).toFixed(2)}% of the profile, which is drawing rounding rather than a contradiction)`,
      );
      closureError = 0;
      structurePreserved = false;
    }
  }

  return {
    entities: out,
    report: {
      applied,
      repaired,
      unhonoured,
      closureError,
      structurePreserved,
    },
  };
}

/** The profile's diagonal, for judging whether a gap is small. */
function profileExtent(entities: ProfileEntity[]): number {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const e of entities) {
    for (const p of [e.start, e.end, e.center]) {
      if (Array.isArray(p)) {
        xs.push(p[0]);
        ys.push(p[1]);
      }
    }
  }
  if (xs.length === 0) return 0;
  return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}
