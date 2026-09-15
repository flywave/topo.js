/**
 * Resolving parameters inside sketch geometry.
 *
 * A model asked to design a *parametric* part writes parametric sketches — an
 * edge that runs to `overallWidth`, a hole whose radius is `holeDiameter / 2` —
 * and it is right to. But the sketch types hold numbers, so those values used to
 * reach the emitter as strings, where they failed in the worst possible way: the
 * chain check compares points with `near()`, so `["overallWidth", 0]` never met
 * `[0, 0]` and the profile "did not close"; and the number formatter called
 * `.toFixed` on an array and threw.
 *
 * So the substitution happens here, once, before emission: every coordinate and
 * dimension is evaluated against the resolved parameters, and emission is left
 * strictly numeric. What cannot be resolved is reported against the exact
 * sketch, entity and field that holds it, because "the profile does not close"
 * gives a designer nothing to act on.
 */

import type {
  CadParameter,
  FeatureTree,
  ProfileEntity,
  SketchConstraint,
  SketchConstraintValue,
  SketchSpec,
} from "./model.js";
import { evaluateExpression } from "./expr.js";

export interface ResolvedSketchValues {
  tree: FeatureTree;
  /** One line per value that could not be resolved, naming where it lives. */
  issues: string[];
}

type Scalar = number | string;

/**
 * Evaluate every expression inside every sketch.
 *
 * Returns a new tree; the input is left alone so a caller can report the tree the
 * model authored rather than the one that was repaired.
 */
export function resolveSketchValues(
  tree: FeatureTree,
  params: Record<string, number>,
): ResolvedSketchValues {
  const issues: string[] = [];
  const sketches: Record<string, SketchSpec> = {};

  for (const [id, sketch] of Object.entries(tree.sketches)) {
    const where = (extra: string) => `sketch ${id}: ${extra}`;

    const entities = (sketch.entities ?? []).map((entity, i) => {
      const label = entity.tag ? `entity ${entity.tag}` : `entity #${i}`;
      const next: ProfileEntity = { ...entity };

      for (const field of ["start", "end", "center"] as const) {
        const point = entity[field] as unknown;
        if (!point) continue;
        if (!Array.isArray(point)) {
          issues.push(where(`${label} ${field} is not a pair of coordinates`));
          continue;
        }

        // A model sketching on XZ or YZ often writes the point in world
        // coordinates, `[x, 0, z]`, rather than in the view's 2D frame. Read as
        // 2D that collapses to `[x, 0]` — every point on one line — and the
        // profile then "does not close". The plane is known, so the projection
        // back onto it is well defined.
        const planar: unknown[] =
          point.length === 3 ? projectOntoPlane(point, sketch.plane?.kind) ?? point : point;
        if (!planar || planar.length !== 2) {
          issues.push(
            where(`${label} ${field} is not a pair of coordinates (${describe(point)})`),
          );
          continue;
        }

        const [a, b] = planar.map((v) => coerceScalar(v, params));
        if (typeof a === "number" && typeof b === "number") {
          next[field] = [a, b];
        } else {
          issues.push(
            where(`${label} ${field} uses a value that did not resolve to a number (${describe(point)})`),
          );
        }
      }

      if (entity.radius !== undefined) {
        const r = coerceScalar(entity.radius, params);
        if (typeof r === "number") {
          next.radius = r;
        } else if (Array.isArray(entity.radius)) {
          // Seen in practice: a radius written as [holeDiameter, 2], i.e. the
          // model expressing "half the diameter" as a division it never wrote.
          issues.push(
            where(
              `${label} radius is given as ${describe(entity.radius)}; a radius must be one number or expression — write "holeDiameter / 2" instead`,
            ),
          );
        } else {
          issues.push(
            where(`${label} radius did not resolve to a number (${describe(entity.radius)})`),
          );
        }
      }

      if (next.type === "line" && (!next.start || !next.end)) {
        issues.push(where(`${label} is a line without both endpoints`));
      }
      if ((next.type === "arc" || next.type === "circle") && next.radius === undefined) {
        issues.push(where(`${label} is a ${next.type} without a radius`));
      }
      return next;
    });

    const constraints = (sketch.constraints ?? []).map((constraint, i) => {
      const label = constraint.tags?.length ? `constraint on ${constraint.tags.join("+")}` : `constraint #${i}`;
      const value = coerceValue(constraint.value, params);
      if (value === UNRESOLVED) {
        issues.push(
          where(
            `${label} (${constraint.kind}) has a value that did not resolve to a number (${describe(constraint.value)})`,
          ),
        );
        return constraint;
      }
      return { ...constraint, value };
    });

    sketches[id] = { ...sketch, entities, constraints };
  }

  return { tree: { ...tree, sketches }, issues };
}

/** A value that could not be evaluated, as a distinct marker so it is never confused with a number. */
const UNRESOLVED = Symbol("unresolved");

/**
 * A number, or an expression string evaluated against the parameters.
 *
 * A string that names no parameter is still evaluated — it may be arithmetic the
 * model wrote out, like "120 / 2".
 */
function coerceScalar(value: unknown, params: Record<string, number>): number | string {
  if (typeof value === "number") return Number.isFinite(value) ? value : "not a finite number";
  if (typeof value !== "string") return "not a number or expression";
  const trimmed = value.trim();
  if (trimmed === "") return "empty expression";
  try {
    const resolved = evaluateExpression(trimmed, params);
    return Number.isFinite(resolved) ? resolved : `"${trimmed}" evaluated to a non-finite number`;
  } catch (e) {
    return `"${trimmed}" could not be evaluated (${e instanceof Error ? e.message : String(e)})`;
  }
}

/** The same, for a constraint value in any of its three shapes. */
function coerceValue(
  value: SketchConstraintValue | undefined,
  params: Record<string, number>,
): SketchConstraintValue | typeof UNRESOLVED | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const scalar = coerceScalar(value, params);
    return typeof scalar === "number" ? scalar : UNRESOLVED;
  }
  if (!Array.isArray(value)) return UNRESOLVED;

  const out: Array<number | null> = [];
  for (const element of value) {
    if (element === null) {
      out.push(null);
      continue;
    }
    const scalar = coerceScalar(element, params);
    if (typeof scalar !== "number") return UNRESOLVED;
    out.push(scalar);
  }
  if (out.length === 2) return [out[0] as number, out[1] as number];
  return [out[0], out[1], out[2] as number];
}

function describe(value: unknown): string {
  if (value === undefined) return "nothing";
  return JSON.stringify(value);
}

/**
 * Read a 3D point in the view's own 2D frame.
 *
 * The view frames are fixed by the projection bases: an XZ sketch measures (x, z),
 * a YZ sketch (y, z), an XY sketch (x, y). Anything else is refused rather than
 * guessed at.
 */
function projectOntoPlane(point: unknown[], plane: string | undefined): unknown[] | null {
  switch (plane) {
    case "XY":
      return [point[0], point[1]];
    case "XZ":
      return [point[0], point[2]];
    case "YZ":
      return [point[1], point[2]];
    default:
      return null;
  }
}

/** Parameters a sketch's geometry refers to, for reporting what drives what. */
export function parametersUsedBySketches(tree: FeatureTree): string[] {
  const used = new Set<string>();
  const names = new Set(tree.parameters.map((p: CadParameter) => p.name));
  const consider = (value: unknown): void => {
    if (typeof value === "string") {
      for (const name of names) {
        if (new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(value)) used.add(name);
      }
      return;
    }
    if (Array.isArray(value)) value.forEach(consider);
  };

  for (const sketch of Object.values(tree.sketches)) {
    for (const e of sketch.entities ?? []) {
      consider(e.start);
      consider(e.end);
      consider(e.center);
      consider(e.radius);
    }
    for (const c of sketch.constraints ?? []) consider(c.value);
  }
  return Array.from(used);
}
