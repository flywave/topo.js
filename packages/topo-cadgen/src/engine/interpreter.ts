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
import type { FeatureTreeLike, FeatureLike, KernelGlobal } from "./kernel.js";
import { resolveParams } from "./kernel.js";

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
  body: CQWp | undefined;
  tools: Map<string, any[]>;
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
      const ctx: OpContext = {
        tp: this.tp,
        params: resolved,
        sketches: tree.sketches as Record<string, SketchCtx>,
        body: keep(body),
        tools,
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

export function registerBuiltinOps(
  interp: TreeInterpreter,
  cq: { workplane: (plane?: string, origin?: number[]) => CQWp; vec: (x: number, y: number, z: number) => any },
): void {
  const sketchOf = (ctx: OpContext, id: string | undefined): SketchCtx => {
    const sk = id ? ctx.sketches[id] : undefined;
    if (!sk) throw new Error(`sketch ${id ?? "(none)"} missing`);
    return sk;
  };

  const profileWp = (ctx: OpContext, sk: SketchCtx): CQWp => {
    const wp = ctx.keep(cq.workplane(sk.plane?.kind ?? "XY", sk.plane?.origin));
    const lines = (sk.entities ?? []).filter((e) => e.type === "line" && !e.construction);
    const circles = (sk.entities ?? []).filter((e) => e.type === "circle" && !e.construction);
    if (circles.length > 0 && lines.length === 0) {
      const c = circles[0];
      const w2 = ctx.keep(wp.center(c.center[0], c.center[1]));
      ctx.keep(w2.circleCentered(c.radius));
      return w2;
    }
    if (lines.length > 0) {
      // Sketch coords are 2D in the plane's local frame → local gp_Pnt (z=0).
      const pts = lines
        .map((l) => l.start)
        .concat([lines[lines.length - 1].end])
        .map(([x, y]) => new ctx.tp.gp_Pnt_3(x, y, 0));
      ctx.keep(wp);
      wp.polyline(pts, false, false);
      ctx.keep(wp.close());
      return wp;
    }
    throw new Error("sketch has no drawable entities");
  };

  const extrudeSketch = (ctx: OpContext, sk: SketchCtx, distance: number): CQWp => {
    const prism = ctx.keep(profileWp(ctx, sk).extrudeSimple(distance));
    if (!prism || prism.vals().length === 0) throw new Error("extrusion produced no body");
    return ctx.keep(prism);
  };

  // toCompoundOf — Workplane/Shape/Compound → the Compound instance the
  // Embind Workplane.cut demands (each wrapper exposes a different path).
  const toCompoundOf = (obj: any): any => {
    if (obj.toCompound) return obj.toCompound();
    if (obj.castCompound) return obj.castCompound();
    const c = new ctx.tp.Compound();
    c.add(obj);
    return c;
  };

  const firstTool = (ctx: OpContext, id: string | undefined): any | undefined => {
    const list = id ? ctx.tools.get(id) : undefined;
    return list && list.length > 0 ? list[0] : undefined;
  };
  const recordTool = (ctx: OpContext, id: string, tool: any): void => {
    ctx.tools.set(id, [tool]);
  };

  interp.registerOp("pad", (ctx, op) => {
    const sk = sketchOf(ctx, op.sketchId);
    const d = ctx.evalParam(op.distance, 10);
    const prism = extrudeSketch(ctx, sk, d);
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

  interp.registerOp("fillet", (ctx, op) => {
    if (!ctx.body) ctx.fail("fillet before any body");
    const r = ctx.evalParam(op.radius, 1);
    const wp = ctx.keep(ctx.body.edges(op.selector ?? "|Z", "").fillet(r));
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
    const sk = sketchOf(ctx, op.sketchId);
    const d = op.distance !== undefined ? ctx.evalParam(op.distance, 10) : 50;
    const prism = extrudeSketch(ctx, sk, d);
    const toolShape = prism.vals()[0];
    if (!ctx.body) ctx.fail("boolean before any body");
    if (op.kind === "union") {
      ctx.body = ctx.keep(ctx.body.union(prism, true, false, 0));
    } else if (op.kind === "intersect") {
      ctx.body = ctx.body.intersect(toolShape.castCompound(), true, 0);
    } else {
      ctx.body = ctx.keep(ctx.body.cut(toolShape.castCompound(), true, 0));
    }
    if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`boolean ${op.kind} produced no body`);
    if (op.kind !== "union") recordTool(ctx, ctx.feature.id, toolShape);
  });

  interp.registerOp("pattern_linear", (ctx, op) => {
    const src = firstTool(ctx, op.ofFeature);
    if (!src) throw new Error(`pattern source "${op.ofFeature}" is not a material-removal feature`);
    const count = Math.max(1, op.count ?? 1);
    const dx = ctx.evalParam(op.dx, 0);
    const dy = ctx.evalParam(op.dy, 0);
    const dz = ctx.evalParam(op.dz, 0);
    if (!ctx.body) ctx.fail("pattern before any body");
    for (let i = 1; i < count; i++) {
      const inst = src.translated(ctx.toVec(dx * i, dy * i, dz * i));
      ctx.body = ctx.keep(ctx.body.cut(inst.castCompound(), true, 0));
      if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`pattern cut failed at instance ${i}`);
    }
  });

  interp.registerOp("pattern_polar", (ctx, op) => {
    const src = firstTool(ctx, op.ofFeature);
    if (!src) throw new Error(`polar pattern source "${op.ofFeature}" is not a removal feature`);
    const total = op.angle !== undefined ? ctx.evalParam(op.angle, 360) : 360;
    const count = Math.max(1, op.count ?? 1);
    const step = total / count;
    const axis = op.axis === "x" ? [1, 0, 0] : op.axis === "y" ? [0, 1, 0] : [0, 0, 1];
    if (!ctx.body) ctx.fail("pattern before any body");
    for (let i = 1; i < count; i++) {
      const toolWpR = ctx.keep(new ctx.tp.Workplane("XY", undefined, src));
      const inst = toolWpR.rotate(ctx.toPnt(0, 0, 0), ctx.toPnt(0, 0, 1), step * i);
      ctx.body = ctx.keep(ctx.body.cut(inst.castCompound(), true, 0));
      if (!ctx.body || ctx.body.vals().length === 0) ctx.fail(`polar cut failed at instance ${i}`);
    }
  });

  interp.registerOp("mirror", (ctx, op) => {
    const src = firstTool(ctx, op.ofFeature);
    if (!src) throw new Error(`mirror source "${op.ofFeature}" is not a material-removal feature`);
    const plane = op.plane?.kind ?? "YZ";
    const axisN = plane === "XZ" ? [0, 1, 0] : plane === "XY" ? [0, 0, 1] : [1, 0, 0];
    // Mirror at the Workplane level (shim surface — proven in iteration 4):
    // wrap the tool shape, mirror it, extract the reflected shape.
    const toolWpM = ctx.keep(new ctx.tp.Workplane(plane ?? "YZ", undefined, src));
    const reflected = toolWpM.mirror(plane, ctx.toPnt(0, 0, 0));
    if (!ctx.body) ctx.fail("mirror before any body");
    ctx.body = ctx.keep(ctx.body.cut(reflected.vals()[0].castCompound(), true, 0));
    if (!ctx.body || ctx.body.vals().length === 0) ctx.fail("mirror cut produced no body");
  });

  interp.registerOp("revolve", (ctx, op) => {
    const sk = sketchOf(ctx, op.sketchId);
    const angle = op.angle !== undefined ? ctx.evalParam(op.angle, 360) : 360;
    const prism = profileWp(ctx, sk).revolveSimple
      ? profileWp(ctx, sk).revolveSimple(angle)
      : profileWp(ctx, sk).revolve(angle, undefined, undefined, true, true);
    if (!prism || prism.vals().length === 0) ctx.fail("revolve produced no body");
    ctx.body = prism;
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
function splitLoops(lines: Array<Record<string, any>>): Array<Array<Record<string, any>>> {
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
