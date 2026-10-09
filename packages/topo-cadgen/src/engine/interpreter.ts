// The tree interpreter (P3 framework): FeatureTree → kernel body via the CQ
// shim's Embind surface (lowercase methods) — the SAME kernel call paths the
// Go interpreter drives through go-topo. Op handlers live in a REGISTRY;
// coverage is ratcheted by test/interpreter_parity.test.ts against
// go-cadgen's corpus goldens. A missing/failing op SKIPS the feature with a
// reason — fail-soft-with-reasons, never a silent wrong body.
//
// Kernel binding notes (measured on the current wasm, 2026-10-07):
//   - Workplane ctor origin takes a Vector (gp_Pnt is rejected).
//   - extrude's taper must be undefined (0 triggers the inner-wire taper
//     error on profiles with holes).
//   - Workplane.cut rejects a Workplane tool ("Expected Compound") — tools
//     are passed as Shape → castCompound().
//   - pad's later-feature union works at Workplane level.
import { resolveEdgeRef } from "../../../topo-primitives/lib/topo/edge_ref.js";
import type { FeatureTreeLike, FeatureLike, KernelGlobal } from "./kernel.js";
import { resolveParams } from "./kernel.js";
import { evaluateExpression } from "./expr.js";

export interface SketchCtx {
  id: string;
  plane: { kind: string; origin?: number[] };
  entities: Array<Record<string, any>>;
  constraints: Array<Record<string, any>>;
}

export type CQWp = {
  polyline(points: any[], forConstruction?: boolean, includeCurrent?: boolean): CQWp;
  close(): CQWp;
  circle(r: number, forConstruction?: boolean): CQWp;
  center(x: number, y: number): CQWp;
  extrude(distance: number, combine?: boolean | undefined, clean?: boolean, both?: boolean, taper?: number): CQWp;
  extrudeSimple?(distance: number): CQWp;
  revolveSimple?(angleDeg: number): CQWp;
  revolveAboutAxis?(angleDeg: number, axisStart: { x: number; y: number; z: number }, axisEnd: { x: number; y: number; z: number }): CQWp;
  revolve?(angleDeg: number, p1?: any, p2?: any, makeSolid?: boolean, isFrenet?: boolean): CQWp;
  cut(other: any, clean?: boolean, tol?: number): CQWp;
  union(other: CQWp, clean?: boolean, glue?: boolean, tol?: number): CQWp;
  intersect(other: any, clean?: boolean, tol?: number): CQWp;
  fillet(radius: number): CQWp;
  chamfer(length: number, length2?: number): CQWp;
  edges(selector?: string, tag?: string): CQWp;
  faces(selector?: string, tag?: string): CQWp;
  shell(thickness: number, kind: string): CQWp;
  mirror(plane: string, basePnt?: any): CQWp;
  translate(vec: any): CQWp;
  rotate(axisStart: any, axisEnd: any, angleDeg: number): CQWp;
  vals(): any[];
};

export interface OpContext {
  tp: any;
  params: Record<string, number>;
  sketches: Record<string, SketchCtx>;
  /** featuresById — the whole feature history, for ofFeature lookups
   * (scaleIncrement's sketch-driven rebuild). Mirrors Go featureByID. */
  featuresById: Map<string, FeatureLike>;
  body: CQWp | undefined;
  tools: Map<string, any[]>;
  /** featureShapes — the material a body-creating feature added (its own
   * solid, before it merged into the body). The material-source half of
   * pattern / mirror / boolean: patterning a boss re-emits and unions it,
   * where a removal tool re-emits and cuts. Mirrors Go featureShapes. */
  featureShapes: Map<string, any>;
  /** Retain every intermediate kernel object for the build's lifetime —
   * unreferenced Embind wrappers get GC-collected and the C++ side dies
   * mid-build (nondeterministic zeros/volumes are this exact bug). */
  keep: (obj: any) => any;
  feature: FeatureLike;
  toVec: (x: number, y: number, z: number) => any;
  toPnt: (x: number, y: number, z: number) => any;
  toDir: (x: number, y: number, z: number) => any;
  evalParam: (expr: string | number | undefined, fallback: number) => number;
  fail: (msg: string) => never;
}

export type OpHandler = (ctx: OpContext, op: Record<string, any>) => void;

export interface InterpResult {
  mesh: { vertices: number[][]; triangles: number[][] } | null;
  volume: number;
  bbox: [number, number, number, number, number, number] | null;
  emitted: string[];
  skipped: Array<{ id: string; reason: string }>;
  warnings: string[];
}

export class TreeInterpreter {
  private ops = new Map<string, OpHandler>();

  constructor(private tp: KernelGlobal, private cq: { workplane: (plane?: string, origin?: number[]) => CQWp; vec: (x: number, y: number, z: number) => any }) {}

  registerOp(op: string, handler: OpHandler): void {
    if (this.ops.has(op)) throw new Error(`op ${op} already registered`);
    this.ops.set(op, handler);
  }

  registeredOps(): string[] {
    return [...this.ops.keys()].sort();
  }

  async interpret(tree: FeatureTreeLike, params?: Record<string, number>): Promise<InterpResult> {
    const resolved = params ?? resolveParams(tree);
    const result: InterpResult = { mesh: null, volume: 0, bbox: null, emitted: [], skipped: [], warnings: [] };
    let body: CQWp | undefined;
    const tools = new Map<string, any[]>();
    const featureShapes = new Map<string, any>();
    const featuresById = new Map<string, FeatureLike>();
    for (const f of tree.features) featuresById.set(f.id, f);
    const keepAlive: any[] = [];
    // Retain every intermediate kernel object for the build's lifetime —
    // unreferenced Embind wrappers get GC-collected and the C++ side dies
    // mid-build (nondeterministic zero volumes are this exact bug).
    const keep = (obj: any) => {
      keepAlive.push(obj);
      return obj;
    };

    for (const feature of tree.features) {
      const handler = this.ops.get(feature.op.op);
      if (!handler) {
        result.skipped.push({ id: feature.id, reason: `unknown op "${feature.op.op}"` });
        continue;
      }
      // 吸收①对齐: the parameter-driven switch. An expression that cannot be
      // evaluated SKIPS THE FEATURE WITH THE REASON (the Go interpreter's
      // honest skip), never a silent on.
      const enabledExpr = (feature as any).enabledExpr as string | undefined;
      if (enabledExpr !== undefined && enabledExpr !== "") {
        let active: boolean;
        try {
          active = evaluateExpression(enabledExpr, { params: resolved }) !== 0;
        } catch (e) {
          result.skipped.push({
            id: feature.id,
            reason: `enabledExpr "${enabledExpr}" cannot be evaluated: ${e instanceof Error ? e.message : String(e)}`,
          });
          continue;
        }
        if (!active) continue;
      } else if (feature.enabled === false) {
        continue;
      }
      const ctx: OpContext = {
        tp: this.tp,
        params: resolved,
        sketches: tree.sketches as Record<string, SketchCtx>,
        featuresById,
        body: keep(body),
        tools,
        featureShapes,
        keep,
        feature,
        toVec: (x, y, z) => new this.tp.gp_Vec_4(x, y, z),
        toPnt: (x, y, z) => new this.tp.gp_Pnt_3(x, y, z),
        toDir: (x, y, z) => new this.tp.gp_Dir_3(new this.tp.gp_XYZ(x, y, z)),
        evalParam: (expr, fallback) => {
          if (expr === undefined || expr === "") return fallback;
          if (typeof expr === "number") return expr;
          const direct = Number(expr);
          if (Number.isFinite(direct)) return direct;
          const v = resolved[expr];
          return v !== undefined ? v : fallback;
        },
        fail: (msg) => {
          throw new Error(msg);
        },
      };
      try {
        handler(ctx, feature.op);
      } catch (e) {
        result.skipped.push({
          id: feature.id,
          reason: `${feature.op.op}: ${e instanceof Error ? e.message : String(e)}`,
        });
        continue;
      }
      body = ctx.body;
      keep(body);
      result.emitted.push(feature.id);
    }

    if (body) {
      const mesh = meshOf(body);
      if (mesh) {
        const f = fingerprint(mesh);
        result.mesh = mesh;
        result.volume = f.volume;
        result.bbox = f.bbox;
      }
    }
    return result;
  }
}

/** degToRad — the wasm rotate consumes RADIANS (the same gp_Trsf::SetRotation
 * the Go side measured), while tree angles are degrees. */
export const degToRad = Math.PI / 180;

/** planeAxes — the sketch plane's world axes (u along x, v along y, extrude
 * along n). Named planes return their fixed frames; a custom plane is NOT
 * constructible on this wasm build (TopoPlane unexposed) — the sketch-level
 * check rejects it before axes matter. Mirrors Go cad.PlaneAxes. */
export function planeAxes(plane?: { kind?: string; normal?: number[]; xAxis?: number[] }): { ex: number[]; ey: number[]; n: number[] } {
  if (plane?.kind === "XZ") return { ex: [1, 0, 0], ey: [0, 0, 1], n: [0, -1, 0] };
  if (plane?.kind === "YZ") return { ex: [0, 1, 0], ey: [0, 0, 1], n: [1, 0, 0] };
  if (plane?.kind === "custom" && plane.normal) {
    const l = Math.hypot(...plane.normal) || 1;
    const n = plane.normal.map((v) => v / l);
    let x = plane.xAxis ?? (Math.abs(n[0]) >= 0.9 ? [0, 1, 0] : [1, 0, 0]);
    const d = x[0] * n[0] + x[1] * n[1] + x[2] * n[2];
    x = [x[0] - d * n[0], x[1] - d * n[1], x[2] - d * n[2]];
    const xl = Math.hypot(...x) || 1;
    x = x.map((v) => v / xl);
    const ey = [n[1] * x[2] - n[2] * x[1], n[2] * x[0] - n[0] * x[2], n[0] * x[1] - n[1] * x[0]];
    return { ex: x, ey, n };
  }
  return { ex: [1, 0, 0], ey: [0, 1, 0], n: [0, 0, 1] };
}

export function registerBuiltinOps(
  interp: TreeInterpreter,
  cq: { workplane: (plane?: string, origin?: number[]) => CQWp; vec: (x: number, y: number, z: number) => any },
): void {
  const sketchOf = (ctx: OpContext, id: string | undefined): SketchCtx => {
    const sk = id ? ctx.sketches[id] : undefined;
    if (!sk) throw new Error(`sketch ${id ?? "(none)"} missing`);
    return sk;
  };

  // profileWps — one workplane per profile component. A sketch may carry
  // several disjoint closed loops (twin pads, a pattern of holes), and
  // chaining all entities into a single polyline welds the components
  // together with spurious cross-links; each loop must be drawn and extruded
  // on its own, then unioned — the same profile-component rule the Go side
  // applies.
  const profileWps = (ctx: OpContext, sk: SketchCtx): CQWp[] => {
    // Custom planes are honest skips locally: the wasm build does not expose
    // TopoPlane, so the frame is not constructible — the server builds them
    // (第三轮 Go 侧已落地) and the editor falls back to the server mesh.
    if (sk.plane?.kind === "custom") {
      throw new Error("custom datum planes are not constructible in the local kernel (TopoPlane unexposed) — the server builds them");
    }
    const entities = normalizeEntities(sk);
    const lines = entities.filter((e) => e.type === "line" && !e.construction);
    const circles = entities.filter((e) => e.type === "circle" && !e.construction);
    const wps: CQWp[] = [];
    if (circles.length > 0) {
      for (const c of circles) {
        const wp = ctx.keep(cq.workplane(sk.plane?.kind ?? "XY", sk.plane?.origin));
        const w2 = ctx.keep(wp.center(c.center[0], c.center[1]));
        ctx.keep(w2.circleCentered(c.radius));
        wps.push(w2);
      }
      return wps;
    }
    for (const loop of splitLoops(lines)) {
      const wp = ctx.keep(cq.workplane(sk.plane?.kind ?? "XY", sk.plane?.origin));
      // Loop vertices in chain order, closed wrap-around — through the Sketch
      // API shim (sketchLoop); the workplane polyline+close path yields
      // corrupt prisms off-origin (see shim note).
      const verts = loop.map((l) => [l.start[0], l.start[1]] as [number, number]);
      wps.push(ctx.keep(wp.sketchLoop(verts)));
    }
    if (wps.length === 0) throw new Error("sketch has no drawable entities");
    return wps;
  };

  // profileWp — the single-component case (revolve's only well-defined one).
  const profileWp = (ctx: OpContext, sk: SketchCtx): CQWp => {
    const wps = profileWps(ctx, sk);
    if (wps.length !== 1) throw new Error(`profile must be a single loop, got ${wps.length}`);
    return wps[0];
  };

  // loopBounds — a loop's [minX, minY, maxX, maxY] from its chain vertices.
  const loopBounds = (loop: Array<Record<string, any>>): [number, number, number, number] => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const l of loop) {
      for (const p of [l.start, l.end]) {
        minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
        maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
      }
    }
    return [minX, minY, maxX, maxY];
  };
  const strictlyInside = (inner: [number, number, number, number], outer: [number, number, number, number]): boolean => {
    const eps = 1e-6;
    return outer[0] < inner[0] - eps && outer[1] < inner[1] - eps &&
      outer[2] > inner[2] + eps && outer[3] > inner[3] + eps;
  };

  const extrudeSketch = (ctx: OpContext, sk: SketchCtx, distance: number): CQWp => {
    // Custom planes are honest skips locally (TopoPlane unexposed — the
    // server builds them; the alignment3 pin depends on this wording).
    if (sk.plane?.kind === "custom") {
      throw new Error("custom datum planes are not constructible in the local kernel (TopoPlane unexposed) — the server builds them");
    }
    // 复盘 B 对齐 (multi-hole): a component STRICTLY inside another
    // component's bounds is a HOLE — extruded and cut, not unioned, whether
    // the components are line loops or circles (the washer). Partial
    // overlaps keep the historical union reading.
    const entities = normalizeEntities(sk);
    const circles = entities.filter((e) => e.type === "circle" && !e.construction);
    const lines = entities.filter((e) => e.type === "line" && !e.construction);
    const planeKind = sk.plane?.kind ?? "XY";
    const origin = sk.plane?.origin;

    type Bounds = [number, number, number, number];
    type Comp = { draw: () => CQWp; bounds: Bounds };
    const comps: Comp[] = [];
    for (const c of circles) {
      comps.push({
        bounds: [c.center[0] - c.radius, c.center[1] - c.radius, c.center[0] + c.radius, c.center[1] + c.radius],
        draw: () => {
          const wp = ctx.keep(cq.workplane(planeKind, origin));
          const w2 = ctx.keep(wp.center(c.center[0], c.center[1]));
          return ctx.keep(w2.circleCentered(c.radius));
        },
      });
    }
    if (circles.length === 0) {
      for (const loop of splitLoops(lines)) {
        comps.push({
          bounds: loopBounds(loop),
          draw: () => {
            const wp = ctx.keep(cq.workplane(planeKind, origin));
            const verts = loop.map((l) => [l.start[0], l.start[1]] as [number, number]);
            return ctx.keep(wp.sketchLoop(verts));
          },
        });
      }
    }
    const strictlyInside = (a: Bounds, b: Bounds): boolean => {
      const eps = 1e-6;
      return b[0] < a[0] - eps && b[1] < a[1] - eps && b[2] > a[2] + eps && b[3] > a[3] + eps;
    };
    const bodies = comps.filter((a) => !comps.some((b) => a !== b && strictlyInside(a.bounds, b.bounds)));
    const holes = comps.filter((a) => comps.some((b) => a !== b && strictlyInside(a.bounds, b.bounds)));

    let prism: CQWp | undefined;
    for (const b of bodies) {
      const part = ctx.keep(b.draw().extrudeSimple(distance));
      if (!part || part.vals().length === 0) throw new Error("extrusion produced no body");
      prism = prism ? ctx.keep(prism.union(part, true, false, 0)) : part;
    }
    for (const h of holes) {
      if (!prism || prism.vals().length === 0) break;
      const tool = ctx.keep(h.draw().extrudeSimple(distance * 4)).vals()[0];
      prism = ctx.keep(prism.cut(tool.castCompound(), true, 0));
    }
    if (!prism || prism.vals().length === 0) throw new Error("extrusion produced no body");
    return ctx.keep(prism);
  };
  extrudeHook = extrudeSketch;

  // toCompoundOf — Workplane/Shape/Compound → the Compound instance the
  // Embind Workplane.cut demands (each wrapper exposes a different path).
  const toCompoundOf = (obj: any): any => {
    if (obj.toCompound) return obj.toCompound();
    if (obj.castCompound) return obj.castCompound();
    const c = (interp as any).tp.Compound.makeCompound([obj]);
    return c;
  };

  const firstTool = (ctx: OpContext, id: string | undefined): any | undefined => {
    const list = id ? ctx.tools.get(id) : undefined;
    return list && list.length > 0 ? list[0] : undefined;
  };
  const recordTool = (ctx: OpContext, id: string, tool: any): void => {
    ctx.tools.set(id, [tool]);
  };
  // patternSourceKind — "cut" (a removal tool re-emitted and cut) or "union"
  // (a body-creating feature's material re-emitted and unioned). Mirrors the
  // Go interpreter's source resolution: patterns work on BOTH kinds.
  const patternSourceKind = (ctx: OpContext, id: string): "cut" | "union" | null => {
    if (ctx.tools.has(id) && (ctx.tools.get(id)?.length ?? 0) > 0) return "cut";
    if (ctx.featureShapes.has(id)) return "union";
    return null;
  };
  const patternSource = (ctx: OpContext, id: string): any | undefined =>
    firstTool(ctx, id) ?? ctx.featureShapes.get(id);

  interp.registerOp("pad", (ctx, op) => {
    const sk = sketchOf(ctx, op.sketchId);
    const d = ctx.evalParam(op.distance, 10);
    const prism = extrudeSketch(ctx, sk, d);
    ctx.featureShapes.set(ctx.feature.id, prism);
    ctx.body = ctx.body ? ctx.body.union(prism, true, false, 0) : prism;
    if (!ctx.body || ctx.body.vals().length === 0) ctx.fail("pad produced no body");
  });

  interp.registerOp("pocket", (ctx, op) => {
    const sk = sketchOf(ctx, op.sketchId);
    const depth = op.through ? 400 : ctx.evalParam(op.depth, 5);
    const prism = extrudeSketch(ctx, sk, depth);
    // The Embind Workplane.cut takes the tool as a Compound (castCompound):
    // a raw Workplane tool is rejected ("Expected Compound, got Workplane").
    const toolShape = prism.vals()[0];
    if (!ctx.body) ctx.fail("pocket before any body");
    ctx.body = ctx.keep(ctx.body.cut(toolShape.castCompound(), true, 0));
    if (!ctx.body || ctx.body.vals().length === 0) ctx.fail("cut produced no body");
    recordTool(ctx, ctx.feature.id, toolShape);
  });

  // 吸收对齐: the hole macro — every circle in the sketch is a hole at its
  // centre (bore = 2×radius), cut along the sketch normal. through/blind +
  // counterbored (two stacked bores) build locally; countersunk is an honest
  // local skip (the cone primitive the Go side drives is not exposed here).
  interp.registerOp("hole", (ctx, op) => {
    if (!ctx.body) ctx.fail("hole before any body");
    const sk = sketchOf(ctx, op.sketchId);
    const circles = (sk.entities ?? []).filter((e) => e.type === "circle" && !e.construction);
    if (circles.length === 0) throw new Error("the hole sketch has no circles — every circle is one hole");
    const holeType = op.holeType ?? "through";
    if (holeType === "countersunk") {
      ctx.fail("countersunk holes build server-side (the cone primitive is not exposed in the local kernel)");
    }
    const depth = holeType === "through" ? 400 : ctx.evalParam(op.depth, 5);
    const planeKind = sk.plane?.kind ?? "XY";
    for (const c of circles) {
      const boreR = c.radius;
      const bore = ctx.keep(cq.workplane(planeKind, sk.plane?.origin));
      const w1 = ctx.keep(bore.center(c.center[0], c.center[1]));
      ctx.keep(w1.circleCentered(boreR));
      let tool = ctx.keep(w1.extrudeSimple(depth));
      let toolShape = tool.vals()[0];
      if (holeType === "counterbored") {
        const cbD = ctx.evalParam(op.counterboreDiameter, boreR * 4);
        const cbDepth = ctx.evalParam(op.counterboreDepth, depth / 4);
        const cb = ctx.keep(cq.workplane(planeKind, sk.plane?.origin));
        const w2 = ctx.keep(cb.center(c.center[0], c.center[1]));
        ctx.keep(w2.circleCentered(cbD / 2));
        const cbTool = ctx.keep(w2.extrudeSimple(cbDepth));
        ctx.body = ctx.keep(ctx.body.cut(cbTool.vals()[0].castCompound(), true, 0));
      }
      ctx.body = ctx.keep(ctx.body.cut(toolShape.castCompound(), true, 0));
      if (!ctx.body || ctx.body.vals().length === 0) ctx.fail("hole cut produced no body");
    }
  });

  interp.registerOp("fillet", (ctx, op) => {
    if (!ctx.body) ctx.fail("fillet before any body");
    const r = ctx.evalParam(op.radius, 1);
    let wp: CQWp;
    if (op.edges?.length) {
      // Interactive addressing: stable edge references resolved against the
      // current body (edge_ref.ts — the same byFaces/byIndex contract the
      // server side runs). The workplane wraps the solid (find_solid) and
      // `add` puts exactly the named edges into its selection.
      let shape = ctx.body.vals()[0];
      if (shape && shape.Solids) {
        const solids = shape.Solids();
        if (solids && solids.length) shape = solids[0];
      }
      if (!shape) ctx.fail("fillet by reference: no body shape");
      // Kernel direct call — the SAME topo::fillet(solid, edges, r) the Go
      // interpreter drives (topo.Fillet). The workplane find_solid path
      // refused these very cases (measured), the direct call accepts them.
      const resolvedEdges: any[] = [];
      for (const ref of op.edges) {
        const res = resolveEdgeRef(shape, ref);
        if (!res.ok) ctx.fail(`fillet by reference: ${res.reason ?? "unresolved"}`);
        if (res.resolvedBy === "byIndex" && res.reason) {
          console.warn(`edge ${ref.index}: ${res.reason}`);
        }
        resolvedEdges.push(res.edge);
      }
      const out = (ctx.tp.ShapeOps ?? (ctx.tp as any).Shape).fillet(shape, resolvedEdges, r);
      wp = ctx.keep(new ctx.tp.Workplane("XY", undefined, out));
    } else {
      wp = ctx.keep(ctx.body.edges(op.selector ?? "|Z", "").fillet(r));
    }
    if (!wp || wp.vals().length === 0) ctx.fail("fillet produced no body");
    ctx.keep(wp.vals()[0]);
    ctx.body = wp;
  });

  interp.registerOp("chamfer", (ctx, op) => {
    if (!ctx.body) ctx.fail("chamfer before any body");
    const l = ctx.evalParam(op.length, 1);
    const wp = ctx.keep(ctx.body.edges(op.selector ?? "|Z", "").chamfer(l, 0));
    if (!wp || wp.vals().length === 0) ctx.fail("chamfer produced no body");
    ctx.keep(wp.vals()[0]);
    ctx.body = wp;
  });

  interp.registerOp("boolean", (ctx, op) => {
    // Body-vs-body: another body-creating feature's material as the tool.
    // Union against it is identity (bodies merge as they are created) — say
    // so instead of pretending to work. Mirrors Go toolFeature.
    let toolShape: any;
    let prism: CQWp | undefined;
    if (op.toolFeature) {
      const src = ctx.featureShapes.get(op.toolFeature);
      if (!src) ctx.fail(`boolean toolFeature "${op.toolFeature}" is not a body-creating feature`);
      if (op.kind === "union") ctx.fail(`boolean union with toolFeature "${op.toolFeature}" is a no-op — that material is already in the body`);
      toolShape = src;
    } else {
      const sk = sketchOf(ctx, op.sketchId);
      const d = op.distance !== undefined ? ctx.evalParam(op.distance, 10) : 50;
      prism = extrudeSketch(ctx, sk, d);
      toolShape = prism.vals()[0];
    }
    if (!ctx.body) ctx.fail("boolean before any body");
    if (op.kind === "union") {
      ctx.body = ctx.keep(ctx.body.union(prism!, true, false, 0));
    } else if (op.kind === "intersect") {
      ctx.body = ctx.body.intersect(toolShape.castCompound(), true, 0);
    } else {
      ctx.body = ctx.keep(ctx.body.cut(toolShape.castCompound(), true, 0));
    }
    if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`boolean ${op.kind} produced no body`);
    if (op.kind !== "union" && prism) recordTool(ctx, ctx.feature.id, toolShape);
  });

  interp.registerOp("pattern_linear", (ctx, op) => {
    const kind = patternSourceKind(ctx, op.ofFeature);
    const src = patternSource(ctx, op.ofFeature);
    if (!src) throw new Error(`pattern source "${op.ofFeature}" is neither a cut nor a body-creating feature`);
    // 复盘 A 对齐: countExpr — the parameter-driven instance count (rounded
    // to the nearest whole instance); overrides the literal count.
    let count = op.count ?? op.nx ?? 1;
    if (op.countExpr !== undefined && op.countExpr !== "") {
      const v = evaluateExpression(op.countExpr, { params: ctx.params });
      const n = Math.round(v);
      if (!Number.isFinite(n) || n < 1 || n > 512) {
        ctx.fail(`countExpr "${op.countExpr}" evaluates to ${v} — the instance count must land in 1..512`);
      }
      count = n;
    }
    const ny = Math.max(1, op.ny ?? 1);
    const dx = ctx.evalParam(op.dx, 0);
    const dy = ctx.evalParam(op.dy, 0);
    const dz = ctx.evalParam(op.dz, 0);
    const dx2 = ctx.evalParam(op.dx2, 0);
    const dy2 = ctx.evalParam(op.dy2, 0);
    const dz2 = ctx.evalParam(op.dz2, 0);
    // 吸收②对齐 (scaleIncrement): copies REBUILT from the source's sketch
    // at a per-instance scale of the index — the translate-copy path cannot
    // express a growing series. Sketch-driven sources only.
    if (op.scaleIncrement !== undefined && op.scaleIncrement !== "") {
      const srcFeature = ctx.featuresById.get(op.ofFeature);
      const srcSketchId = srcFeature?.op?.sketchId;
      if (!srcSketchId) {
        ctx.fail(`scaleIncrement needs a sketch-driven source (pad / pocket) — "${op.ofFeature}" has no sketch`);
      }
      const srcSk = ctx.sketches[srcSketchId];
      if (!srcSk) ctx.fail(`scaleIncrement source sketch "${srcSketchId}" missing`);
      const anchor = anchorOf(srcSk);
      if (!ctx.body) ctx.fail("pattern before any body");
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < count; i++) {
          if (i === 0 && j === 0) continue;
          const factor = evaluateExpression(op.scaleIncrement, {
            params: { ...ctx.params, i, j },
          });
          if (!Number.isFinite(factor) || factor <= 0) {
            ctx.fail(`scaleIncrement for instance (i=${i}, j=${j}) is ${factor} — must be finite and positive`);
          }
          const scaled: SketchCtx = {
            ...srcSk,
            entities: srcSk.entities.map((e) => scaleEntityAbout(e, factor, anchor)),
          };
          const inst = rebuildSource(ctx, scaled, srcFeature.op);
          const off = ctx.toVec(dx * i + dx2 * j, dy * i + dy2 * j, dz * i + dz2 * j);
          const moved = ctx.keep(inst.translated(off));
          const isCut = patternSourceKind(ctx, op.ofFeature) === "cut";
          if (isCut) {
            ctx.body = ctx.keep(ctx.body.cut(moved.vals()[0].castCompound(), true, 0));
          } else {
            ctx.body = ctx.keep(ctx.body.union(moved, true, false, 0));
          }
          if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`scaleIncrement ${isCut ? "cut" : "union"} failed at (${i},${j})`);
        }
      }
      return;
    }
    if (!ctx.body) ctx.fail("pattern before any body");
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < count; i++) {
        if (i === 0 && j === 0) continue; // the source is already in the body
        const inst = ctx.keep(src.translated(ctx.toVec(dx * i + dx2 * j, dy * i + dy2 * j, dz * i + dz2 * j)));
        if (kind === "cut") {
          ctx.body = ctx.keep(ctx.body.cut(inst.castCompound(), true, 0));
          if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`pattern cut failed at (${i},${j})`);
        } else {
          ctx.body = ctx.keep(ctx.body.union(inst.castCompound(), true, false, 0));
          if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`pattern union failed at (${i},${j})`);
        }
      }
    }
  });

  interp.registerOp("pattern_polar", (ctx, op) => {
    const kind = patternSourceKind(ctx, op.ofFeature);
    const src = patternSource(ctx, op.ofFeature);
    if (!src) throw new Error(`polar pattern source "${op.ofFeature}" is neither a cut nor a body-creating feature`);
    const total = op.angle !== undefined ? ctx.evalParam(op.angle, 360) : 360;
    let count = op.count ?? 1;
    if (op.countExpr !== undefined && op.countExpr !== "") {
      const v = evaluateExpression(op.countExpr, { params: ctx.params });
      const n = Math.round(v);
      if (!Number.isFinite(n) || n < 1 || n > 512) {
        ctx.fail(`countExpr "${op.countExpr}" evaluates to ${v} — the instance count must land in 1..512`);
      }
      count = n;
    }
    const step = total / count;
    // An explicit axis line (eccentric axes included) or the named global
    // axis through the origin.
    const p1 = op.axisLine?.start ?? [0, 0, 0];
    const p2 = op.axisLine?.end ?? (op.axis === "x" ? [1, 0, 0] : op.axis === "y" ? [0, 1, 0] : [0, 0, 1]);
    // 吸收②对齐 (polar scaleIncrement): rebuilt copies ROTATED into place.
    if (op.scaleIncrement !== undefined && op.scaleIncrement !== "") {
      const srcFeature = ctx.featuresById.get(op.ofFeature);
      const srcSketchId = srcFeature?.op?.sketchId;
      if (!srcSketchId) {
        ctx.fail(`scaleIncrement needs a sketch-driven source (pad) — "${op.ofFeature}" has no sketch`);
      }
      const srcSk = ctx.sketches[srcSketchId];
      if (!srcSk) ctx.fail(`scaleIncrement source sketch "${srcSketchId}" missing`);
      const anchor = anchorOf(srcSk);
      if (!ctx.body) ctx.fail("pattern before any body");
      for (let i = 1; i < count; i++) {
        const factor = evaluateExpression(op.scaleIncrement, { params: { ...ctx.params, i, j: 0 } });
        if (!Number.isFinite(factor) || factor <= 0) {
          ctx.fail(`scaleIncrement for instance i=${i} is ${factor} — must be finite and positive`);
        }
        const scaled: SketchCtx = {
          ...srcSk,
          entities: srcSk.entities.map((e) => scaleEntityAbout(e, factor, anchor)),
        };
        const inst = rebuildSource(ctx, scaled, srcFeature.op);
        const instShape = inst.vals()[0];
        const toolWpR = ctx.keep(new ctx.tp.Workplane("XY", undefined, instShape));
        const rotated = toolWpR.rotate(ctx.toPnt(p1[0], p1[1], p1[2]), ctx.toPnt(p2[0], p2[1], p2[2]), step * i * degToRad);
        const rotatedShape = typeof rotated.vals === "function" ? rotated.vals()[0] : rotated;
        if (kind === "cut") {
          ctx.body = ctx.keep(ctx.body.cut(toCompoundOf(rotatedShape), true, 0));
        } else {
          ctx.body = ctx.keep(ctx.body.union(toCompoundOf(rotatedShape), true, false, 0));
        }
        if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`polar scaled union failed at instance ${i}`);
      }
      return;
    }
    if (!ctx.body) ctx.fail("pattern before any body");
    for (let i = 1; i < count; i++) {
      const toolWpR = ctx.keep(new ctx.tp.Workplane("XY", undefined, src));
      // DEGREES → RADIANS: the wasm rotate hands the raw value to
      // gp_Trsf::SetRotation (the Go side measured the same bug).
      const rotated = toolWpR.rotate(ctx.toPnt(p1[0], p1[1], p1[2]), ctx.toPnt(p2[0], p2[1], p2[2]), step * i * degToRad);
      const inst = typeof rotated.vals === "function" ? rotated.vals()[0] : rotated;
      if (kind === "cut") {
        ctx.body = ctx.keep(ctx.body.cut(toCompoundOf(inst), true, 0));
        if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`polar cut failed at instance ${i}`);
      } else {
        ctx.body = ctx.keep(ctx.body.union(toCompoundOf(inst), true, false, 0));
        if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`polar union failed at instance ${i}`);
      }
    }
  });

  interp.registerOp("mirror", (ctx, op) => {
    const kind = patternSourceKind(ctx, op.ofFeature);
    const src = patternSource(ctx, op.ofFeature);
    if (!src) throw new Error(`mirror source "${op.ofFeature}" is neither a cut nor a body-creating feature`);
    const plane = op.plane?.kind ?? "YZ";
    if (plane === "custom") throw new Error("mirror about a custom plane is not available in the local kernel — the server builds it");
    // Mirror at the Workplane level (shim surface — proven in iteration 4):
    // wrap the tool shape, mirror it, extract the reflected shape.
    const toolWpM = ctx.keep(new ctx.tp.Workplane(plane ?? "YZ", undefined, src));
    const reflected = toolWpM.mirror(plane, ctx.toPnt(0, 0, 0));
    const reflShape = reflected.vals()[0];
    if (!ctx.body) ctx.fail("mirror before any body");
    if (kind === "cut") {
      ctx.body = ctx.keep(ctx.body.cut(reflShape.castCompound(), true, 0));
      if (!ctx.body || ctx.body.vals().length === 0) ctx.fail("mirror cut produced no body");
    } else {
      ctx.body = ctx.keep(ctx.body.union(reflShape.castCompound(), true, false, 0));
      if (!ctx.body || ctx.body.vals().length === 0) ctx.fail("mirror union produced no body");
    }
  });

  interp.registerOp("revolve", (ctx, op) => {
    const sk = sketchOf(ctx, op.sketchId);
    const angle = op.angle !== undefined ? ctx.evalParam(op.angle, 360) : 360;
    // The axis: a named global axis or an explicit world line (axisLine).
    // The kernel converts the axis points with the sketch plane's frame, so
    // a WORLD axis must be expressed plane-locally first — world coordinates
    // revolve about the wrong line (measured on the Go side, same kernel).
    let axisStart: [number, number, number] | undefined;
    let axisEnd: [number, number, number] | undefined;
    if (op.axisLine?.start && op.axisLine?.end) {
      axisStart = op.axisLine.start;
      axisEnd = op.axisLine.end;
    } else {
      const named = op.axis === "x" ? [1, 0, 0] : op.axis === "y" ? [0, 1, 0] : [0, 0, 1];
      axisStart = [0, 0, 0];
      axisEnd = named as [number, number, number];
    }
    const wp = profileWp(ctx, sk);
    let prism: CQWp;
    if (op.axisLine?.start && op.axisLine?.end) {
      // An explicit world axis line: expressed plane-locally (the kernel
      // converts with the plane's to_world — world points revolve about the
      // wrong line; the Go side measured this exact trap).
      const o = sk.plane?.origin ?? [0, 0, 0];
      const axes = planeAxes(sk.plane);
      const toLocal = (p: number[]): { x: number; y: number; z: number } => {
        const r = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
        return {
          x: r[0] * axes.ex[0] + r[1] * axes.ex[1] + r[2] * axes.ex[2],
          y: r[0] * axes.ey[0] + r[1] * axes.ey[1] + r[2] * axes.ey[2],
          z: r[0] * axes.n[0] + r[1] * axes.n[1] + r[2] * axes.n[2],
        };
      };
      const ls = toLocal(axisStart);
      const le = toLocal(axisEnd);
      prism = ctx.keep(wp.revolveAboutAxis(angle, ls, le));
    } else {
      // The named-axis default — the corpus-proven path.
      prism = wp.revolveSimple ? wp.revolveSimple(angle) : wp.revolve(angle, undefined, undefined, true, true);
    }
    if (!prism || prism.vals().length === 0) ctx.fail("revolve produced no body");
    ctx.featureShapes.set(ctx.feature.id, prism);
    ctx.body = prism;
  });

  // sweep / loft — named skips, not silent unknowns: the kernel's
  // MakePipeShell/ThruSections produce empty or wild surfaces for these
  // (the Go side probe-measured the same kernel behaviour and ships the
  // straight-tube loft + honest gates there). The editor falls back to the
  // server mesh, which builds them.
  interp.registerOp("sweep", (ctx, op) => {
    if (op.pathKind === "helix") {
      ctx.fail("helix sweep: the kernel's section loft cannot follow a rotating path — the server refuses it too");
    }
    ctx.fail("sweep: the local kernel's pipe surface is unreliable — the server builds sweeps and the editor falls back to its mesh");
  });

  interp.registerOp("loft", (ctx, op) => {
    void op;
    ctx.fail("loft: the local kernel's ThruSections cannot reconcile rotated sections — the server builds lofts and the editor falls back to its mesh");
  });

  // gear / thread (吸收③④): SYNTHETIC wire-prism ops — the involute
  // outline and the V-ridge are generated analytically and prism DIRECTLY
  // from wires on the Go side. The local editor defers them to the server
  // mesh with the same named-skip discipline as sweep/loft.
  interp.registerOp("gear", (ctx, op) => {
    void ctx;
    void op;
    ctx.fail("gear: the synthetic involute outline prisms server-side — the editor falls back to its mesh");
  });

  interp.registerOp("thread", (ctx, op) => {
    void ctx;
    void op;
    ctx.fail("thread: the helical V-ridge prisms server-side — the editor falls back to its mesh");
  });

  interp.registerOp("shell", (ctx, op) => {
    if (!ctx.body) ctx.fail("shell before any body");
    const t = ctx.evalParam(op.thickness, 1);
    let target: CQWp = ctx.body;
    if (op.openSelector) target = target.faces(op.openSelector, "");
    const wp = ctx.keep(target.shell(t, "arc"));
    if (!wp || wp.vals().length === 0) ctx.fail("shell produced no body");
    ctx.keep(wp.vals()[0]);
    ctx.body = wp;
  });
}

// normalizeEntities — the sketch's entities with ellipse entities replaced
// by their sampled closed polylines (吸收④对齐: 64 points land within a hair
// of π·a·b — the same normalization the Go side performs at build entry).
function normalizeEntities(sk: SketchCtx): Array<Record<string, any>> {
  const out: Array<Record<string, any>> = [];
  for (const e of sk.entities ?? []) {
    if (e.type === "ellipse") {
      if (!e.center || !e.radii || e.radii[0] <= 0 || e.radii[1] <= 0) {
        throw new Error(`ellipse ${e.tag ?? "?"} needs a centre and positive radii [major, minor]`);
      }
      const rot = ((e.angleDeg as number) ?? 0) * (Math.PI / 180);
      const cos = Math.cos(rot), sin = Math.sin(rot);
      const N = 64;
      const pts: Array<Record<string, any>> = [];
      for (let i = 0; i <= N; i++) {
        const t = (2 * Math.PI * i) / N;
        const x = e.radii[0] * Math.cos(t);
        const y = e.radii[1] * Math.sin(t);
        pts.push({
          tag: `${e.tag ?? "ell"}_${i}`,
          type: "line",
          start: [e.center[0] + x * cos - y * sin, e.center[1] + x * sin + y * cos],
          end: [],
        });
      }
      for (let i = 0; i < pts.length; i++) pts[i].end = pts[(i + 1) % pts.length].start;
      out.push(...pts);
      continue;
    }
    out.push(e);
  }
  return out;
}

// anchorOf — the point a scaled instance grows about (复盘②: a standalone
// circle grows about its own centre, a loop about the plane origin).
function anchorOf(sk: SketchCtx): [number, number] {
  const circles = (sk.entities ?? []).filter((e) => e.type === "circle" && !e.construction);
  if (circles.length === 1) return [circles[0].center[0], circles[0].center[1]];
  return [0, 0];
}

// scaleEntityAbout — scale one entity's coordinates about an anchor (the Go
// cad.ScaleSketchAbout's per-entity half).
function scaleEntityAbout(e: Record<string, any>, k: number, anchor: [number, number]): Record<string, any> {
  const p = (pt: number[] | undefined): number[] | undefined =>
    pt ? [anchor[0] + (pt[0] - anchor[0]) * k, anchor[1] + (pt[1] - anchor[1]) * k] : undefined;
  const out: Record<string, any> = { ...e };
  if (out.start) out.start = p(out.start);
  if (out.end) out.end = p(out.end);
  if (out.center) out.center = p(out.center);
  if (out.points) out.points = (out.points as number[][]).map((pt) => p(pt) as number[]);
  if (typeof out.radius === "number") out.radius = out.radius * Math.abs(k);
  return out;
}

// rebuildSource — re-extrude a sketch-driven pattern source at its scaled
// size, with the source feature's own parameters (pad distance / pocket
// depth-through). Mirrors Go scaledSourceBuild.
function rebuildSource(ctx: OpContext, sk: SketchCtx, srcOp: Record<string, any>): CQWp {
  const kind = srcOp.op;
  if (kind === "pad") {
    const d = ctx.evalParam(srcOp.distance, 10);
    return extrudeSketchPublic(ctx, sk, d);
  }
  if (kind === "pocket" || kind === "hole") {
    const depth = srcOp.through ? 400 : ctx.evalParam(srcOp.depth, 5);
    return extrudeSketchPublic(ctx, sk, depth);
  }
  throw new Error(`scaleIncrement rebuilds flat-sketch sources (pad / pocket / hole) only — source is a ${kind}`);
}

// extrudeSketchPublic — the registerBuiltinOps-scoped extrudeSketch, re-exported
// for rebuildSource via a module-level hook (the closure needs ctx's cq/keep).
let extrudeHook: ((ctx: OpContext, sk: SketchCtx, distance: number) => CQWp) | null = null;
function extrudeSketchPublic(ctx: OpContext, sk: SketchCtx, distance: number): CQWp {
  if (!extrudeHook) throw new Error("extrude hook not installed");
  return extrudeHook(ctx, sk, distance);
}

// meshOf — the built body's MeshData via the kernel's per-face mesh call,
// probing call shapes exactly like the prototype's getMeshData bridge.
function meshOf(wp: CQWp): { vertices: number[][]; triangles: number[][] } | null {
  for (const shp of wp.vals()) {
    for (const args of [[0.1, 0.1, 30, false], []] as unknown[][]) {
      try {
        const data = (shp as any).mesh(...args);
        if (
          data && Array.isArray(data.vertices) && Array.isArray(data.triangles) &&
          data.vertices.length > 0 && data.vertices.length === data.triangles.length
        ) {
          return data;
        }
      } catch {
        // try next call shape
      }
    }
  }
  return null;
}

function fingerprint(mesh: { vertices: number[][]; triangles: number[][] }): { volume: number; bbox: [number, number, number, number, number, number] } {
  let volume = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let f = 0; f < mesh.vertices.length; f++) {
    const face = mesh.vertices[f];
    const tris = mesh.triangles[f] || [];
    for (let t = 0; t + 2 < tris.length; t += 3) {
      const p = [0, 1, 2].map((k) => {
        const idx = tris[t + k] * 3;
        return [face[idx], face[idx + 1], face[idx + 2]];
      });
      volume +=
        (p[0][0] * (p[1][1] * p[2][2] - p[1][2] * p[2][1]) -
          p[0][1] * (p[1][0] * p[2][2] - p[1][2] * p[2][0]) +
          p[0][2] * (p[1][0] * p[2][1] - p[1][1] * p[2][0])) /
        6;
      for (const v of p) {
        for (let k = 0; k < 3; k++) {
          if (v[k] < min[k]) min[k] = v[k];
          if (v[k] > max[k]) max[k] = v[k];
        }
      }
    }
  }
  return { volume: Math.abs(volume), bbox: [min[0], min[1], min[2], max[0], max[1], max[2]] };
}

// splitLoops — chain lines into closed loops by endpoint proximity (the
// interpreter's profile-component rule; unordered entity lists are the norm).
export function splitLoops(lines: Array<Record<string, any>>): Array<Array<Record<string, any>>> {
  const remaining = [...lines];
  const loops: Array<Array<Record<string, any>>> = [];
  const key = (p: any) => `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
  while (remaining.length > 0) {
    const loop = [remaining.shift()!];
    let tail = loop[0].end;
    for (let guard = 0; guard < remaining.length; guard++) {
      const idx = remaining.findIndex(
        (l) => key(l.start) === key(tail) || key(l.end) === key(tail),
      );
      if (idx < 0) break;
      const next = remaining.splice(idx, 1)[0];
      if (key(next.start) !== key(tail)) {
        const s = next.start;
        next.start = next.end;
        next.end = s;
      }
      loop.push(next);
      tail = next.end;
      guard = -1; // restart scan (list shrank)
    }
    loops.push(loop);
  }
  return loops;
}
