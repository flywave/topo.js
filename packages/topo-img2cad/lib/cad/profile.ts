/**
 * 2D profile utilities — turning what was read off a view into something a
 * constrained sketch can be built from.
 */

import type {
  Profile2D,
  ProfileEntity,
  ProfileRelation,
  ProfileRelationKind,
} from "./model.js";

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const EPS = 1e-6;

function samePoint(a: [number, number], b: [number, number], tol = 1e-3): boolean {
  return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
}

function angleOf(e: ProfileEntity): number | null {
  if (e.type !== "line" || !e.start || !e.end) return null;
  return Math.atan2(e.end[1] - e.start[1], e.end[0] - e.start[0]);
}

function lengthOf(e: ProfileEntity): number | null {
  if (e.type === "circle") return e.radius ? 2 * Math.PI * e.radius : null;
  if (e.type === "arc" && e.radius) return Math.PI * e.radius; // rough
  if (!e.start || !e.end) return null;
  return Math.hypot(e.end[0] - e.start[0], e.end[1] - e.start[1]);
}

function normalizeAngle(a: number): number {
  let x = a % Math.PI;
  if (x < 0) x += Math.PI;
  return x;
}

// ---------------------------------------------------------------------------
// Closure check
// ---------------------------------------------------------------------------

export interface ClosureReport {
  closed: boolean;
  /** Number of loops that close. */
  closedLoops: number;
  /** Tags whose endpoints do not meet a neighbour. */
  openEnds: string[];
  /** Number of separate loops discovered. */
  loopCount: number;
  loops: string[][];
}

/**
 * Walk the profile's entities and report whether they form closed loops.
 *
 * A profile that does not close cannot be extruded, so this runs before any
 * code is emitted — an open profile is a failed spec, not a bad sketch.
 */
export function checkClosure(entities: ProfileEntity[], tol = 1e-3): ClosureReport {
  const openEnds: string[] = [];
  const closedLoops: string[][] = [];
  const loops: string[][] = [];

  // Circles are closed by construction.
  const closedByNature = entities.filter((e) => e.type === "circle").map((e) => e.tag);
  for (const tag of closedByNature) {
    closedLoops.push([tag]);
    loops.push([tag]);
  }

  // Chain lines and arcs by endpoint adjacency.
  const chainable = entities.filter((e) => e.type !== "circle" && e.start && e.end);
  const used = new Set<string>();

  for (const seed of chainable) {
    if (used.has(seed.tag)) continue;
    const chain: string[] = [seed.tag];
    used.add(seed.tag);
    let tail = seed.end!;
    const head = seed.start!;

    // Walk forward
    let extended = true;
    while (extended) {
      extended = false;
      for (const e of chainable) {
        if (used.has(e.tag)) continue;
        if (samePoint(e.start!, tail, tol)) {
          chain.push(e.tag);
          used.add(e.tag);
          tail = e.end!;
          extended = true;
          break;
        }
        if (samePoint(e.end!, tail, tol)) {
          chain.push(e.tag);
          used.add(e.tag);
          tail = e.start!;
          extended = true;
          break;
        }
      }
    }

    if (samePoint(tail, head, tol)) {
      closedLoops.push(chain);
      loops.push(chain);
    } else {
      // Not a loop — report the two dangling ends.
      openEnds.push(chain[0]);
      openEnds.push(chain[chain.length - 1]);
      loops.push(chain);
    }
  }

  return {
    closed: openEnds.length === 0 && loops.length > 0,
    closedLoops: closedLoops.length,
    openEnds,
    loopCount: loops.length,
    loops,
  };
}

// ---------------------------------------------------------------------------
// Relation inference
// ---------------------------------------------------------------------------

/**
 * Infer geometric relations the drawing implies, so the sketch is constrained
 * rather than merely dimensioned. Only relations that are very likely correct
 * are emitted — a wrong relation is worse than a missing one, because the
 * solver will move geometry to satisfy it.
 */
export function inferRelations(entities: ProfileEntity[], angleTolDeg = 1.5): ProfileRelation[] {
  const relations: ProfileRelation[] = [];
  const tol = (angleTolDeg * Math.PI) / 180;
  const lines = entities.filter((e) => e.type === "line");

  // Horizontal / vertical
  for (const e of lines) {
    const a = angleOf(e);
    if (a === null) continue;
    const na = normalizeAngle(a);
    if (na < tol || Math.abs(na - Math.PI) < tol) {
      relations.push({ kind: "horizontal", tags: [e.tag] });
    } else if (Math.abs(na - Math.PI / 2) < tol) {
      relations.push({ kind: "vertical", tags: [e.tag] });
    }
  }

  // Parallel / perpendicular
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const a = angleOf(lines[i]);
      const b = angleOf(lines[j]);
      if (a === null || b === null) continue;
      const diff = normalizeAngle(a - b);
      if (diff < tol || Math.abs(diff - Math.PI) < tol) {
        relations.push({ kind: "parallel", tags: [lines[i].tag, lines[j].tag] });
      } else if (Math.abs(diff - Math.PI / 2) < tol) {
        relations.push({ kind: "perpendicular", tags: [lines[i].tag, lines[j].tag] });
      }
    }
  }

  // Concentric arcs/circles
  const curves = entities.filter((e) => (e.type === "arc" || e.type === "circle") && e.center);
  for (let i = 0; i < curves.length; i++) {
    for (let j = i + 1; j < curves.length; j++) {
      const c1 = curves[i].center!;
      const c2 = curves[j].center!;
      if (Math.hypot(c1[0] - c2[0], c1[1] - c2[1]) < 1e-3) {
        relations.push({ kind: "concentric", tags: [curves[i].tag, curves[j].tag] });
      }
    }
  }

  // Tangent: an arc touching a line at an endpoint
  for (const arc of entities.filter((e) => e.type === "arc" && e.center && e.radius)) {
    for (const line of lines) {
      const touches =
        (arc.start && (samePoint(arc.start, line.start!, 1e-3) || samePoint(arc.start, line.end!, 1e-3))) ||
        (arc.end && (samePoint(arc.end, line.start!, 1e-3) || samePoint(arc.end, line.end!, 1e-3)));
      if (!touches) continue;
      // Distance from arc centre to the infinite line ≈ radius ⇒ tangent.
      const d = pointLineDistance(arc.center!, line.start!, line.end!);
      if (Math.abs(d - arc.radius!) < 1e-3 * Math.max(1, arc.radius!)) {
        relations.push({ kind: "tangent", tags: [arc.tag, line.tag] });
      }
    }
  }

  // Equal length among parallel same-orientation lines
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const li = lengthOf(lines[i]);
      const lj = lengthOf(lines[j]);
      if (li && lj && Math.abs(li - lj) < 1e-3 * Math.max(li, lj)) {
        const rel = relations.find(
          (r) =>
            r.kind === "parallel" &&
            r.tags.includes(lines[i].tag) &&
            r.tags.includes(lines[j].tag),
        );
        if (rel) {
          relations.push({ kind: "equal_length", tags: [lines[i].tag, lines[j].tag] });
        }
      }
    }
  }

  return relations;
}

function pointLineDistance(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len < EPS) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

// ---------------------------------------------------------------------------
// Relation → constraint mapping
// ---------------------------------------------------------------------------

/** Relations that have no direct solver constraint are surfaced, not dropped. */
export const UNSUPPORTED_RELATIONS: ReadonlySet<ProfileRelationKind> = new Set([
  "tangent",
  "collinear",
  "equal_length",
  "symmetric_about",
]);

// ---------------------------------------------------------------------------
// Profile validation
// ---------------------------------------------------------------------------

export interface ProfileReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  closure: ClosureReport;
  relationCount: number;
  unsupportedRelationCount: number;
  dimensionsIncomplete: boolean;
}

/**
 * Validate a profile before it becomes a sketch.
 *
 * Checks the things that make a sketch unusable: open loops, degenerate
 * entities, dimensions referencing tags that do not exist.
 */
export function validateProfile(profile: Profile2D): ProfileReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const tags = new Set(profile.entities.map((e) => e.tag));
  if (tags.size !== profile.entities.length) {
    errors.push("Duplicate entity tags in profile");
  }

  for (const e of profile.entities) {
    if (e.type === "circle" || e.type === "arc") {
      if (!e.radius || e.radius <= 0) {
        errors.push(`Entity "${e.tag}" has non-positive radius`);
      }
      if (!e.center) {
        errors.push(`Entity "${e.tag}" is missing a center`);
      }
    }
    if (e.type === "line" && (!e.start || !e.end)) {
      errors.push(`Line "${e.tag}" is missing an endpoint`);
    }
    if (e.type === "line" && e.start && e.end && samePoint(e.start, e.end)) {
      errors.push(`Line "${e.tag}" is degenerate (zero length)`);
    }
  }

  for (const d of profile.dimensions) {
    for (const t of d.tags) {
      if (!tags.has(t)) {
        errors.push(`Dimension "${d.name}" references unknown tag "${t}"`);
      }
    }
  }

  const closure = checkClosure(profile.entities.filter((e) => !e.construction));
  if (!closure.closed && profile.entities.some((e) => !e.construction)) {
    errors.push(
      `Profile does not close (${closure.openEnds.length} dangling ends: ${closure.openEnds.join(", ")})`,
    );
  }

  const unsupported = profile.relations.filter((r) => UNSUPPORTED_RELATIONS.has(r.kind));
  if (unsupported.length > 0) {
    warnings.push(
      `${unsupported.length} inferred relation(s) have no solver constraint and will be approximated by dimensions: ${unsupported
        .map((r) => r.kind)
        .join(", ")}`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    closure,
    relationCount: profile.relations.length,
    unsupportedRelationCount: unsupported.length,
    dimensionsIncomplete: profile.dimensions.length === 0,
  };
}
