/**
 * Profile topology — how a sketch's entities connect to each other.
 *
 * Kept apart from the emitter because two layers need the same answers and used
 * to import each other to get them: the emitter asks "what order do these edges
 * run in", and reconciliation asks "do these dimensions describe a closed shape".
 * That import cycle was real — `sketch_codegen` imports `reconcileSketch`, and
 * `reconcile` imported `chainEntities` back — and a bundler warns about it on
 * every build. Topology has no opinion about either layer, so it lives here.
 *
 * The other reason this matters: a sketch with several disjoint closed profiles
 * is a legitimate design (a bolt-hole pattern), not a broken one. Every caller
 * that walks a chain has to be able to tell those apart, and only this module
 * can.
 */

import type { ProfileEntity } from "./model.js";

/** Two points are the same place, within a tolerance. */
export function near(a: [number, number], b: [number, number], tol: number): boolean {
  return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
}

/**
 * Walk the entities into a single ordered chain.
 *
 * Returns null when they do not form ONE chain — which includes the case of
 * several closed chains, where there is no single answer to "what order".
 * Callers that must handle several profiles want `findClosedComponents`.
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
 * Decompose non-construction entities into connected components.
 *
 * Two entities share a component when an endpoint of one is within `tol` of an
 * endpoint of the other. Circles are always isolated — they have no endpoints to
 * share.
 */
export function findConnectedComponents(
  entities: ProfileEntity[],
  tol = 1e-3,
): ProfileEntity[][] {
  const real = entities.filter((e) => !e.construction);
  const circles = real.filter((e) => e.type === "circle");
  const chainable = real.filter((e) => e.type !== "circle");

  const adj = new Map<string, Set<string>>();
  for (const e of chainable) adj.set(e.tag, new Set());

  for (let i = 0; i < chainable.length; i++) {
    for (let j = i + 1; j < chainable.length; j++) {
      const a = chainable[i];
      const b = chainable[j];
      if (
        (a.start && b.start && near(a.start, b.start, tol)) ||
        (a.start && b.end && near(a.start, b.end, tol)) ||
        (a.end && b.start && near(a.end, b.start, tol)) ||
        (a.end && b.end && near(a.end, b.end, tol))
      ) {
        adj.get(a.tag)!.add(b.tag);
        adj.get(b.tag)!.add(a.tag);
      }
    }
  }

  const byTag = new Map<string, ProfileEntity>();
  for (const e of chainable) byTag.set(e.tag, e);

  const visited = new Set<string>();
  const components: ProfileEntity[][] = [];
  for (const e of chainable) {
    if (visited.has(e.tag)) continue;
    const component: ProfileEntity[] = [];
    const queue: ProfileEntity[] = [e];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (visited.has(cur.tag)) continue;
      visited.add(cur.tag);
      component.push(cur);
      for (const neighbor of adj.get(cur.tag) ?? []) {
        if (!visited.has(neighbor)) {
          const next = byTag.get(neighbor);
          if (next) queue.push(next);
        }
      }
    }
    components.push(component);
  }

  for (const c of circles) components.push([c]);

  return components;
}

/**
 * The components of a sketch that are each a closed profile.
 *
 * Returns null unless every non-construction entity belongs to exactly one
 * closed component — so a caller that gets a list back knows the sketch is a
 * multi-profile design rather than a broken one.
 */
export function findClosedComponents(
  entities: ProfileEntity[],
  tol = 1e-3,
): ProfileEntity[][] | null {
  const components = findConnectedComponents(entities, tol);
  if (components.length < 2) return null;

  for (const component of components) {
    if (component.length === 1 && component[0].type === "circle") {
      if (!component[0].center || component[0].radius === undefined) return null;
      continue;
    }
    const chain = chainEntities(component, tol);
    if (!chain) return null;
    // A chain that does not come back round is not a closed profile.
    const head = chain[0].forward ? chain[0].entity.start! : chain[0].entity.end!;
    const tail = chain[chain.length - 1].forward
      ? chain[chain.length - 1].entity.end!
      : chain[chain.length - 1].entity.start!;
    if (!near(head, tail, tol)) return null;
  }

  return components;
}
