/**
 * Feature tree → topo.js code.
 *
 * Unlike a "place primitives and combine them" generator, this replays an
 * ordered feature history against a single accumulating body. That is what
 * makes the output editable the way CAD is editable: the emitted code reads
 * top-to-bottom as base pad, then pockets, then holes, then edges — the same
 * order a person would model it, and the same order the feature tree lists it.
 */

import type { CadParameter, DatumPlane, Feature, FeatureKind, FeatureTree, ProfileEntity, SketchSpec } from "./model.js";
import { activeFeatures } from "./model.js";
import { emitProfileGeometry, planeNormal, validateRevolveProfile } from "./sketch_codegen.js";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface EmittedModel {
  source: string;
  warnings: string[];
  errors: string[];
  /** CQWorkplane / Workplane methods the generated code calls. */
  methodsUsed: string[];
  /** Feature ids that made it into the output, in order. */
  emittedFeatures: string[];
  /**
   * Sketches whose emitted code runs the kernel solver and records a status.
   *
   * Circles are excluded: they are exact by construction and have nothing to
   * solve, so a caller checking convergence must not expect a report for them.
   */
  solvedSketches: string[];
  /** Features that were dropped, with the reason. */
  skippedFeatures: Array<{ id: string; reason: string }>;
}

export interface EmitModelOptions {
  /** Indent unit; defaults to two spaces. */
  indent?: string;
  /** Emit `return body` at the end. */
  returnBody?: boolean;
}

// ---------------------------------------------------------------------------
// Emission helpers
// ---------------------------------------------------------------------------

const NO_TAPER = "undefined";

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

/** A cut that must pass clean through the part regardless of its size. */
function throughDistance(params: Record<string, number>): number {
  const values = Object.values(params).filter((v) => isFinite(v) && v > 0);
  const largest = values.length > 0 ? Math.max(...values) : 50;
  return Math.max(largest * 4, 50);
}

function axisLiteral(axis: { start: [number, number, number]; end: [number, number, number] }): string {
  return `{ x: ${num(axis.start[0])}, y: ${num(axis.start[1])}, z: ${num(axis.start[2])} }, { x: ${num(axis.end[0])}, y: ${num(axis.end[1])}, z: ${num(axis.end[2])} }`;
}

function planeNameOf(plane: DatumPlane): string | null {
  return plane.kind === "custom" ? null : plane.kind;
}

/** Extrude a finalized sketch's Workplane into a tool shape. */
function extrudeExpr(
  wpVar: string,
  distance: number,
  opts: {
    both?: boolean;
    taper?: number;
    symmetric?: boolean;
    plane?: DatumPlane;
    placement?: [number, number, number];
  },
): string {
  // `both=true` is a known go-topo core bug that yields an empty shape, so a
  // symmetric pad is produced by extruding then moving the body back.
  let expr = `${wpVar}.extrude(${num(distance)}, true, true, false, ${
    opts.taper !== undefined ? num(opts.taper) : NO_TAPER
  })`;
  if (opts.symmetric && opts.plane) {
    const n = planeNormal(opts.plane);
    expr += `.translate(gv(${num((-n[0] * distance) / 2)}, ${num((-n[1] * distance) / 2)}, ${num((-n[2] * distance) / 2)}))`;
  }
  // Placement goes on the solid, not the sketch: translating a sketch workplane
  // before extrude has no effect (verified against the kernel).
  if (opts.placement) {
    const [tx, ty, tz] = opts.placement;
    expr += `.translate(gv(${num(tx)}, ${num(ty)}, ${num(tz)}))`;
  }
  return expr;
}

// ---------------------------------------------------------------------------
// Main emission
// ---------------------------------------------------------------------------

export function emitFeatureTreeCode(
  tree: FeatureTree,
  params: Record<string, number>,
  opts: EmitModelOptions = {},
): EmittedModel {
  const I = opts.indent ?? "  ";
  const warnings: string[] = [];
  const errors: string[] = [];
  const methodsUsed = new Set<string>();
  const emittedFeatures: string[] = [];
  const solvedSketches: string[] = [];
  const skippedFeatures: Array<{ id: string; reason: string }> = [];

  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  push("function createModel(tp, CQWorkplane, pnt, vec, gpVec, render, console, __solveReports) {");
  push(`${I}const K = tp.SketchConstraintKind;`);
  push(`${I}const v = (x, y, z) => new tp.Vector(x, y, z);`);
  // Self-contained: `gpVec` is a factory in some harnesses and the class in
  // others, so the emitted code builds its own vector rather than depending on
  // how the caller defined the injected name.
  push(`${I}const gv = (x, y, z) => new tp.gp_Vec_4(x, y, z);`);
  push("");

  // ---- parameters -------------------------------------------------------
  push(`${I}// ---- driving dimensions (resolved) ----`);
  const paramEntries = Object.entries(params);
  if (paramEntries.length === 0) {
    push(`${I}const P = {};`);
  } else {
    push(`${I}const P = {`);
    for (const [name, value] of paramEntries) {
      const def = tree.parameters.find((p: CadParameter) => p.name === name);
      const note = def?.expr && def.expr !== String(value) ? ` // ${def.expr}` : "";
      push(`${I}${I}${safeKey(name)}: ${num(value)},${note}`);
    }
    push(`${I}};`);
  }
  push("");
  push(`${I}// Solve reports land in the caller-supplied object so a harness can read`);
  push(`${I}// residuals back after the build without parsing stdout.`);
  push(`${I}__solveReports = __solveReports || {};`);
  push("");

  // ---- sketches ---------------------------------------------------------
  // Each sketch carries its own constraints and a solve() call, so the solver
  // runs wherever this code runs. `assemble()` inside the emission is what turns
  // the loose edges into a face that extrude can consume.
  const sketchByRef = new Map<string, string>(); // sketchId -> wpVar
  const sketchKindByRef = new Map<string, string>(); // sketchId -> emitted kind
  const placementBySketch = new Map<string, [number, number, number]>();
  push(`${I}// ---- sketches ----`);
  for (const [id, spec] of Object.entries(tree.sketches)) {
    const sketch = normalizeSketch(id, spec);
    try {
      const emitted = emitProfileGeometry(sketch, sketch.entities, {
        indent: I,
        wpVar: `wp_${sanitizeId(id)}`,
      });
      for (const line of emitted.code) push(line);
      warnings.push(...emitted.warnings);
      if (emitted.solved) solvedSketches.push(id);
      sketchByRef.set(id, emitted.wpVar);
      sketchKindByRef.set(id, emitted.kind);
      placementBySketch.set(id, emitted.placement);

      const rec = emitted.reconciliation;
      if (rec.unhonoured.length > 0) {
        for (const u of rec.unhonoured) {
          warnings.push(`sketch ${id}: constraint ${u.constraint} was not applied — ${u.reason}`);
        }
      }
      if (!rec.structurePreserved) {
        warnings.push(`sketch ${id}: reconciliation changed the entity set, which should not happen`);
      }
      if (rec.closureError > 1e-6 && Number.isFinite(rec.closureError)) {
        warnings.push(
          `sketch ${id}: the dimensions do not describe a closed loop — the last edge misses the first by ${rec.closureError.toFixed(4)}`,
        );
      }
      methodsUsed.add("sketch");
      methodsUsed.add(emitted.kind === "circle" ? "circle" : "segmentBetweenPoints");
      methodsUsed.add("assemble");
      methodsUsed.add("finalize");
    } catch (e) {
      errors.push(`sketch ${id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  push("");

  // ---- features ---------------------------------------------------------
  push(`${I}// ---- feature history ----`);
  const ctx: EmitCtx = {
    I,
    tree,
    params,
    sketchByRef,
    sketchKindByRef,
    placementBySketch,
    toolVarByFeature: new Map<string, string[]>(),
    methodsUsed,
    bodyDeclared: false,
  };

  for (const feature of activeFeatures(tree)) {
    // The id is kept in the comment so emitted code can be traced back to the
    // feature that produced it.
    push(`${I}// feature: ${feature.id} — ${feature.name || "(unnamed)"} [${feature.op.op}]`);

    try {
      const emitted = emitFeature(feature, ctx);

      if (emitted.skip) {
        skippedFeatures.push({ id: feature.id, reason: emitted.skip });
        push(`${I}// skipped: ${emitted.skip}`);
        push("");
        continue;
      }

      // Feature bodies are written unindented at their own nesting depth, so the
      // block indent is applied here.
      for (const line of emitted.code) push(`${I}${line}`);
      emittedFeatures.push(feature.id);
      warnings.push(...emitted.warnings);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push(`feature ${feature.id}: ${message}`);
      skippedFeatures.push({ id: feature.id, reason: message });
    }
    push("");
  }

  const bodyDeclared = ctx.bodyDeclared;

  if (!bodyDeclared) {
    errors.push(
      "no base feature produced a body — the feature tree needs a pad, revolve, sweep or loft before any modification",
    );
  }

  // A feature body ends as a Workplane; the shape behind it is what callers can
  // actually measure. Guard the unwrap so an already-resolved shape still works.
  push(`${I}const __result = body && typeof body.val === "function" ? body.val() : body;`);
  push(`${I}if (typeof render === "function") render(__result);`);
  if (opts.returnBody !== false) {
    push(`${I}return __result;`);
  }
  push("}");

  return {
    source: lines.join("\n"),
    warnings: dedupe(warnings),
    errors,
    methodsUsed: Array.from(methodsUsed),
    emittedFeatures,
    solvedSketches,
    skippedFeatures,
  };
}

function normalizeSketch(id: string, spec: SketchSpec | undefined): SketchSpec {
  if (!spec) throw new Error(`sketch "${id}" is missing`);
  return { ...spec, id: spec.id ?? id };
}

function safeKey(name: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

// ---------------------------------------------------------------------------
// Per-feature emission
// ---------------------------------------------------------------------------

interface EmitCtx {
  I: string;
  tree: FeatureTree;
  params: Record<string, number>;
  sketchByRef: Map<string, string>;
  /** Sketch id → the construction it was emitted as ("circle" | "loop" | "multi"). */
  sketchKindByRef: Map<string, string>;
  /** Sketch id → world offset that must be applied after its extrude. */
  placementBySketch: Map<string, [number, number, number]>;
  /**
   * Tools a feature contributes, one entry per cut it needs.
   *
   * A list because a mirrored feature removes everything its source removed PLUS
   * the reflection — mirror in X and then in Z is four holes — and `mirror` keeps
   * the original, so the accumulation is the kernel's rather than ours.
   */
  toolVarByFeature: Map<string, string[]>;
  methodsUsed: Set<string>;
  /** False until a feature has declared the body — the first one uses `let`. */
  bodyDeclared: boolean;
}

/**
 * LHS for a body assignment. The first body-producing feature declares it; every
 * later one reassigns the same variable.
 */
function bodyLhs(ctx: EmitCtx): string {
  if (ctx.bodyDeclared) return "body";
  ctx.bodyDeclared = true;
  return "let body";
}

interface FeatureEmission {
  code: string[];
  warnings: string[];
  skip?: string;
}

function evalParam(expr: string | undefined, ctx: EmitCtx, fallback: number): number {
  if (expr === undefined) return fallback;
  const direct = Number(expr);
  if (isFinite(direct)) return direct;
  // Named parameters were already resolved into ctx.params.
  const referenced = ctx.params[expr];
  if (typeof referenced === "number") return referenced;
  return fallback;
}

function placementOf(sketchId: string | undefined, ctx: EmitCtx): [number, number, number] | undefined {
  if (!sketchId) return undefined;
  return ctx.placementBySketch.get(sketchId);
}

/**
 * Refuse an op a multi-profile sketch cannot carry.
 *
 * A sketch with several disjoint profiles is emitted as separate sketches joined
 * by a union, so the variable holds a small object exposing `extrude` and `val`
 * rather than a Workplane. Only extrusion-style ops can use it; asking it to
 * revolve or sweep would emit code that throws "not a function" at run time,
 * which is a worse failure than saying so now.
 */
function multiOpReason(
  ctx: EmitCtx,
  sketchId: string | undefined,
  featureId: string,
  op: string,
): string | null {
  if (!sketchId || ctx.sketchKindByRef.get(sketchId) !== "multi") return null;
  return `feature "${featureId}": "${op}" cannot use sketch "${sketchId}", which holds several disjoint profiles — those are built as a union of separate extrusions, and only extrusion ops can consume that`;
}


/**
 * The datum plane the named feature's sketch lies on, following mirrors back to
 * whatever actually carries a sketch.
 */
function mirroredFeaturePlane(ctx: EmitCtx, featureId: string, depth = 0): string | null {
  if (depth > 8) return null;
  const feature = ctx.tree.features.find((f) => f.id === featureId);
  if (!feature) return null;

  const op = feature.op as { op: string; sketchId?: string; ofFeature?: string };
  if (op.sketchId) {
    return ctx.tree.sketches[op.sketchId]?.plane?.kind ?? null;
  }
  if (op.ofFeature) return mirroredFeaturePlane(ctx, op.ofFeature, depth + 1);
  return null;
}

/** The tool a feature contributes first, for ops that repeat one source. */
function firstTool(ctx: EmitCtx, featureId: string | undefined): string | undefined {
  return featureId ? ctx.toolVarByFeature.get(featureId)?.[0] : undefined;
}

function requireSketchWp(sketchId: string | undefined, ctx: EmitCtx, featureId: string): string {
  if (!sketchId) throw new Error(`feature "${featureId}" has no sketchId`);
  const wp = ctx.sketchByRef.get(sketchId);
  if (!wp) throw new Error(`feature "${featureId}" references unknown sketch "${sketchId}"`);
  return wp;
}

function emitFeature(feature: Feature, ctx: EmitCtx): FeatureEmission {
  const { I, params } = ctx;
  const code: string[] = [];
  const warnings: string[] = [];
  const op = feature.op;

  if (NEEDS_EXISTING_BODY.has(op.op) && !ctx.bodyDeclared) {
    return {
      code,
      warnings,
      skip: `${op.op} modifies the body, but no base feature (pad / revolve / sweep / loft) has produced one yet`,
    };
  }

  switch (op.op) {
    case "pad": {
      const wp = requireSketchWp(op.sketchId, ctx, feature.id);
      const d = evalParam(op.distance, ctx, 10);
      const taper = op.taper !== undefined ? evalParam(op.taper, ctx, 0) : undefined;
      const sketch = ctx.tree.sketches[op.sketchId];
      const expr = extrudeExpr(wp, d, {
        taper,
        symmetric: op.symmetric,
        plane: sketch?.plane,
        placement: placementOf(op.sketchId, ctx),
      });
      ctx.methodsUsed.add("extrude");
      if (op.symmetric) ctx.methodsUsed.add("translate");
      if (op.symmetric) {
        warnings.push(
          `feature ${feature.id}: symmetric pad emitted as extrude + translate because extrude(both=true) is a known go-topo bug`,
        );
      }
      code.push(`${bodyLhs(ctx)} = ${expr};`);
      return { code, warnings };
    }

    case "pocket": {
      const wp = requireSketchWp(op.sketchId, ctx, feature.id);
      const depth = op.through ? throughDistance(params) : evalParam(op.depth, ctx, 5);
      const taper = op.taper !== undefined ? evalParam(op.taper, ctx, 0) : undefined;
      const toolVar = `tool_${sanitizeId(feature.id)}`;
      code.push(
        `const ${toolVar} = ${extrudeExpr(wp, depth, { taper, placement: placementOf(op.sketchId, ctx) })};`,
      );
      code.push(`body = body.cut(${toolVar}, true, 0);`);
      ctx.toolVarByFeature.set(feature.id, [toolVar]);
      ctx.methodsUsed.add("extrude");
      ctx.methodsUsed.add("cut");
      if (op.through) {
        warnings.push(
          `feature ${feature.id}: "through" pocket emitted as a ${depth.toFixed(1)} unit cut (4x the largest dimension)`,
        );
      }
      return { code, warnings };
    }

    case "revolve": {
      const reason = multiOpReason(ctx, op.sketchId, feature.id, "revolve");
      if (reason) return { code, warnings, skip: reason };
      const wp = requireSketchWp(op.sketchId, ctx, feature.id);
      const sketch = ctx.tree.sketches[op.sketchId];
      if (sketch) {
        const problems = validateRevolveProfile(sketch, op.axis);
        for (const p of problems) {
          warnings.push(`feature ${feature.id}: ${p}`);
        }
        if (problems.some((p) => p.includes("crosses the axis"))) {
          return {
            code,
            warnings,
            skip: "revolve profile crosses the axis — go-topo would return an empty shape",
          };
        }
      }
      const angle = evalParam(op.angle, ctx, 360);
      ctx.methodsUsed.add("revolve");
      const placement = placementOf(op.sketchId, ctx);
      const placed = placement
        ? `${wp}.revolve(${num(angle)}, ${axisLiteral(op.axis)}, true, true).translate(gv(${num(placement[0])}, ${num(placement[1])}, ${num(placement[2])}))`
        : `${wp}.revolve(${num(angle)}, ${axisLiteral(op.axis)}, true, true)`;
      code.push(`${bodyLhs(ctx)} = ${placed};`);
      return { code, warnings };
    }

    case "sweep": {
      const reason = multiOpReason(ctx, op.sketchId, feature.id, "sweep");
      if (reason) return { code, warnings, skip: reason };
      const wp = requireSketchWp(op.sketchId, ctx, feature.id);
      const pathWp = requireSketchWp(op.pathSketchId, ctx, feature.id);
      const frenet = op.frenet !== false;
      ctx.methodsUsed.add("sweep");
      warnings.push(
        `feature ${feature.id}: sweep is emitted against the raw Workplane.sweep(path, multisection, transition, frenet, rotate, parallel) binding, which is not covered by the CQ shim — verify the argument order against your build`,
      );
      code.push(
        `${bodyLhs(ctx)} = ${wp}.sweep(${pathWp}, false, tp.TransitionMode.ROUND, ${frenet}, false, false);`,
      );
      return { code, warnings };
    }

    case "loft": {
      for (const id of op.sketchIds) {
        const reason = multiOpReason(ctx, id, feature.id, "loft");
        if (reason) return { code, warnings, skip: reason };
      }
      const wps = op.sketchIds.map((id) => requireSketchWp(id, ctx, feature.id));
      if (wps.length < 2) {
        return { code, warnings, skip: "loft needs at least two section sketches" };
      }
      ctx.methodsUsed.add("loft");
      warnings.push(
        `feature ${feature.id}: loft of ${wps.length} sections emitted as a single chain — the sections must already be on the same Workplane stack, which this emitter cannot verify`,
      );
      // Chain the sections onto one workplane so loft() sees them in order.
      code.push(`let loftStack = ${wps[0]};`);
      for (let i = 1; i < wps.length; i++) {
        code.push(`loftStack = loftStack.union(${wps[i]}, false, false, 0);`);
      }
      code.push(`${bodyLhs(ctx)} = loftStack.loft(${op.ruled ? "true" : "false"}, true, true);`);
      return { code, warnings };
    }

    case "fillet": {
      if (!op.selector) {
        return { code, warnings, skip: "fillet has no edge selector" };
      }
      const r = evalParam(op.radius, ctx, 1);
      ctx.methodsUsed.add("edges");
      ctx.methodsUsed.add("fillet");
      code.push(`body = body.edges(${JSON.stringify(op.selector)}, "").fillet(${num(r)});`);
      return { code, warnings };
    }

    case "chamfer": {
      if (!op.selector) {
        return { code, warnings, skip: "chamfer has no edge selector" };
      }
      const l = evalParam(op.length, ctx, 1);
      ctx.methodsUsed.add("edges");
      ctx.methodsUsed.add("chamfer");
      code.push(`body = body.edges(${JSON.stringify(op.selector)}, "").chamfer(${num(l)});`);
      return { code, warnings };
    }

    case "shell": {
      const t = evalParam(op.thickness, ctx, 1);
      ctx.methodsUsed.add("shell");
      const target = op.openSelector
        ? `body.faces(${JSON.stringify(op.openSelector)}, "")`
        : "body";
      warnings.push(
        `feature ${feature.id}: shell kind is fixed to "arc" (GeomAbs_Arc) — pass any other kind and go-topo throws "Unknown join type"`,
      );
      code.push(`body = ${target}.shell(${num(t)}, "arc");`);
      return { code, warnings };
    }

    case "pattern_linear": {
      const src = firstTool(ctx, op.ofFeature);
      if (!src) {
        return {
          code,
          warnings,
          skip: `linear pattern source "${op.ofFeature}" is not a material-removal feature (pocket / cut) — pattern re-emits the source tool, so it must produce one`,
        };
      }
      const dx = evalParam(op.dx, ctx, 0);
      const dy = evalParam(op.dy, ctx, 0);
      const dz = op.dz !== undefined ? evalParam(op.dz, ctx, 0) : 0;
      ctx.methodsUsed.add("cut");
      ctx.methodsUsed.add("translate");
      code.push(`for (let i = 1; i < ${op.count}; i++) {`);
      code.push(
        `${I}const inst = ${src}.translate(gv(${num(dx)} * i, ${num(dy)} * i, ${num(dz)} * i));`,
      );
      code.push(`${I}body = body.cut(inst, true, 0);`);
      code.push(`}`);
      return { code, warnings };
    }

    case "pattern_polar": {
      const src = firstTool(ctx, op.ofFeature);
      if (!src) {
        return {
          code,
          warnings,
          skip: `polar pattern source "${op.ofFeature}" is not a material-removal feature (pocket / cut)`,
        };
      }
      const total = op.angle !== undefined ? evalParam(op.angle, ctx, 360) : 360;
      const step = total / op.count;
      ctx.methodsUsed.add("rotate");
      ctx.methodsUsed.add("cut");
      code.push(`{`);
      code.push(
        `${I}const p1 = new tp.gp_Pnt_3(${num(op.axis.start[0])}, ${num(op.axis.start[1])}, ${num(op.axis.start[2])});`,
      );
      code.push(
        `${I}const p2 = new tp.gp_Pnt_3(${num(op.axis.end[0])}, ${num(op.axis.end[1])}, ${num(op.axis.end[2])});`,
      );
      code.push(`${I}for (let i = 1; i < ${op.count}; i++) {`);
      code.push(`${I}${I}const inst = ${src}.rotate(p1, p2, ${num(step)} * i);`);
      code.push(`${I}${I}body = body.cut(inst, true, 0);`);
      code.push(`${I}}`);
      code.push(`}`);
      return { code, warnings };
    }

    case "mirror": {
      const planeName = planeNameOf(op.plane);
      if (!planeName) {
        return {
          code,
          warnings,
          skip: "mirror about a custom datum plane is not supported by the workplane mirror binding (named planes only)",
        };
      }

      // A named source means "mirror THIS FEATURE", not "mirror the part".
      // Ignoring it silently duplicates material: a live run asked to mirror a
      // mount hole about YZ and then XZ, the emitter mirrored the whole BODY both
      // times, and the plate came out 20mm thick instead of 10 with twice the
      // volume. L4 passed it, because a silhouette taken along the sketch normal
      // is blind to thickness and there was only one view to disagree with.
      if (op.ofFeature !== undefined) {
        const src = firstTool(ctx, op.ofFeature);
        if (!src) {
          return {
            code,
            warnings,
            skip: `mirror source "${op.ofFeature}" is not a material-removal feature (pocket / cut) — mirror re-emits the source tool, so it must produce one`,
          };
        }

        // A feature drawn IN the mirror plane is symmetric about it, so the
        // reflection coincides with the original and the kernel's fuse of the two
        // fails outright ("null function or function signature mismatch",
        // measured). It is also a no-op by definition, so the only question is
        // whether to say so or to crash. Models reach for this plane often — a
        // live run mirrored a hole about XZ to move it across the plate's height,
        // when an XZ-sketch plate is mirrored across its height by XY.
        const sourcePlane = mirroredFeaturePlane(ctx, op.ofFeature);
        if (sourcePlane && sourcePlane === planeName) {
          return {
            code,
            warnings,
            skip: `mirror about ${planeName}, but the mirrored feature is sketched on ${sourcePlane} too — a feature lying in a plane is unchanged by reflecting it through that plane. To move it across the part, mirror about one of the OTHER planes`,
          };
        }

        // `mirror(plane, base, copy=true)` returns the tool UNION its reflection,
        // so mirroring a mirror composes without any extra work: mirror in X then
        // in Z is four holes. An earlier version refused to chain — a bisect had
        // shown `mirror` failing after a `union`, and that was wrongly generalised
        // to any reflection — which silently dropped half of a four-hole pattern.
        const reflected = `tool_${sanitizeId(feature.id)}`;
        ctx.methodsUsed.add("mirror");
        ctx.methodsUsed.add("cut");
        code.push(
          `const ${reflected} = ${src}.mirror(${JSON.stringify(planeName)}, undefined, true);`,
        );
        code.push(`body = body.cut(${reflected}, true, 0);`);
        ctx.toolVarByFeature.set(feature.id, [reflected]);
        return { code, warnings };
      }

      ctx.methodsUsed.add("mirror");
      code.push(`body = body.mirror(${JSON.stringify(planeName)}, undefined, true);`);
      return { code, warnings };
    }

    case "boolean": {
      const wp = requireSketchWp(op.sketchId, ctx, feature.id);
      const d = op.distance !== undefined ? evalParam(op.distance, ctx, 10) : throughDistance(params);
      const toolVar = `tool_${sanitizeId(feature.id)}`;
      code.push(
        `const ${toolVar} = ${extrudeExpr(wp, d, { placement: placementOf(op.sketchId, ctx) })};`,
      );
      ctx.methodsUsed.add("extrude");
      ctx.methodsUsed.add(op.kind);
      code.push(`body = body.${op.kind}(${toolVar}, true, false, 0);`);
      if (op.kind !== "union") {
        ctx.toolVarByFeature.set(feature.id, [toolVar]);
      }
      return { code, warnings };
    }
  }
}

function sanitizeId(id: string): string {
  return id.replace(/[^A-Za-z0-9_]/g, "_");
}

/** Ops that operate on material that a previous feature must have created. */
/** The axis a named mirror plane reflects along. */
/** The plane that reflects along an axis. */


const NEEDS_EXISTING_BODY: ReadonlySet<FeatureKind> = new Set([
  "pocket",
  "fillet",
  "chamfer",
  "shell",
  "pattern_linear",
  "pattern_polar",
  "mirror",
  "boolean",
]);
