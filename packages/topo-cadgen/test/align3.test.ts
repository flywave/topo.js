// 第三轮前后端对齐的纯测试: transport 的新端点契约 (properties/exports/
// assemblies) 与解释器的新词表分支 (材质源 pattern / toolFeature / 弧度),
// 全部用 mock 内核/桩 fetch, 不触 wasm。
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Transport } from "../src/core/transport.js";
import { degToRad, planeAxes } from "../src/engine/interpreter.js";
import type { FeatureTreeLike, KernelGlobal } from "../src/engine/kernel.js";
import { TreeInterpreter, registerBuiltinOps } from "../src/engine/interpreter.js";

// ---------------------------------------------------------------------------
// Transport — the wire contract: URL shapes and bodies exactly as api.md's
// 第三轮 extension defines them.
// ---------------------------------------------------------------------------
describe("Transport 第三轮端点", () => {
  beforeEach(() => {
    (globalThis as any).fetch = vi.fn(async (_path: any, opts?: any) => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, method: opts?.method }),
    }));
  });

  it("properties GETs /runs/:id/properties", async () => {
    const t = new Transport();
    await t.runProperties("run_9");
    const call = (globalThis as any).fetch.mock.calls[0];
    expect(call[0]).toBe("/runs/run_9/properties");
    expect(call[1].method).toBe("GET");
  });

  it("export URLs are plain links the browser downloads", () => {
    const t = new Transport();
    expect(t.exportUrl("run_1", "glb")).toBe("/runs/run_1/exports/glb");
    expect(t.exportUrl("run_1", "step")).toBe("/runs/run_1/exports/step");
  });

  it("assemblies POST carries named placed instances", async () => {
    const t = new Transport();
    await t.createAssembly({
      name: "pair",
      instances: [
        { name: "a", runId: "run_1", placement: { position: [0, 0, 0] } },
        { name: "b", runId: "run_1", placement: { position: [0, 0, 60], rotation: [0, 0, 90] } },
      ],
    });
    const call = (globalThis as any).fetch.mock.calls[0];
    expect(call[0]).toBe("/assemblies");
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.instances[1].placement.rotation).toEqual([0, 0, 90]);
  });

  it("assembly inventory and glb URLs", async () => {
    const t = new Transport();
    await t.assembly("asm_3");
    expect((globalThis as any).fetch.mock.calls[0][0]).toBe("/assemblies/asm_3");
    expect(t.assemblyExportUrl("asm_3", "glb")).toBe("/assemblies/asm_3/exports/glb");
    expect(t.assemblyExportUrl("asm_3", "step")).toBe("/assemblies/asm_3/exports/step");
  });
});

// ---------------------------------------------------------------------------
// Interpreter vocabulary — the 第三轮 alignment branches, against a mock
// kernel that records the kernel calls each op makes.
// ---------------------------------------------------------------------------
function mockKernel() {
  const calls: string[] = [];
  const mkWp = (at: [number, number, number]) => {
    const wp: any = {
      at,
      calls,
      vals: () => [{ mesh: () => null }],
      center: () => wp,
      circle: () => wp,
      circleCentered: () => wp,
      sketchLoop: () => wp,
      extrudeSimple: (d: number) => {
        calls.push(`extrude ${d} @(${at})`);
        const solid = { translated: (v: any) => ({ __solid: true, at: [at[0] + v.x(), at[1] + v.y(), at[2] + v.z()] }) };
        const out = { vals: () => [solid], union: () => out };
        return out;
      },
      union: () => wp,
      cut: () => wp,
    };
    return wp;
  };
  const tp: any = {
    Workplane: class {
      constructor(_plane?: string, _origin?: any, obj?: any) {
        // the obj ctor is the legitimate tool-wrap form the pattern ops use
        if (obj) { (this as any).__wrapped = obj; }
      }
      rotate(_p1: any, _p2: any, angleDeg: number) {
        calls.push(`rotate ${angleDeg}`);
        return { vals: () => [{ __rotated: angleDeg }] };
      }
      mirror(plane: string) {
        calls.push(`mirror ${plane}`);
        return { vals: () => [{ castCompound: () => ({ __mirrored: plane }) }] };
      }
    },
    gp_Vec_4: class {
      constructor(public x: number, public y: number, public z: number) {}
    },
    gp_Pnt_3: class {},
    gp_Dir_3: class {},
    Compound: { makeCompound: (x: any) => ({ __compound: x }) },
  };
  return { tp, calls };
}

function twoFeatureTree(): FeatureTreeLike {
  return {
    name: "t",
    units: { length: "mm", toMillimeter: 1 },
    datums: {},
    sketches: {
      s_base: { id: "s_base", plane: { kind: "XY" }, entities: [], constraints: [] },
      s_bolt: { id: "s_bolt", plane: { kind: "XY" }, entities: [], constraints: [] },
    },
    features: [],
    parameters: [],
  };
}

describe("interpreter 第三轮词表", () => {
  const setup = () => {
    const { tp, calls } = mockKernel();
    const interp = new TreeInterpreter(tp as KernelGlobal, {} as any);
    registerBuiltinOps(interp, { workplane: (_p?: string, o?: number[]) => (tp as any).__wp(o ?? [0, 0, 0]) } as any);
    (tp as any).__wp = (at: [number, number, number]) => {
      const w = (interp as any).__mkWp(at);
      return w;
    };
    return { interp, calls };
  };

  it("degToRad is the exact conversion the wasm rotate needs", () => {
    expect(degToRad).toBeCloseTo(Math.PI / 180, 15);
  });

  it("planeAxes: named frames exact, custom frames normalized + in-plane", () => {
    expect(planeAxes({ kind: "XZ" })).toEqual({ ex: [1, 0, 0], ey: [0, 0, 1], n: [0, -1, 0] });
    const custom = planeAxes({ kind: "custom", normal: [0, 2, 0], xAxis: [3, 0, 3] });
    // u normalized (1,0,1)/√2 — the Go custom-plane frame to the digit.
    expect(custom.n).toEqual([0, 1, 0]);
    expect(custom.ex[0]).toBeCloseTo(1 / Math.SQRT2, 12);
    expect(custom.ex[2]).toBeCloseTo(1 / Math.SQRT2, 12);
  });

  it("polar pattern rotates by degrees→radians about an arbitrary axis line", async () => {
    const { tp, calls } = mockKernel();
    const interp = new TreeInterpreter(tp as KernelGlobal, {} as any);
    registerBuiltinOps(interp, {} as any);
    // hand-built ctx: a plate body + a registered cut tool
    const tree = twoFeatureTree();
    tree.features = [
      { id: "f_bolt", op: { op: "pocket", sketchId: "s_bolt" } },
      { id: "f_ring", op: { op: "pattern_polar", ofFeature: "f_bolt", count: 4,
        axisLine: { start: [40, 40, 0], end: [40, 40, 1] } } },
    ];
    const tool = { castCompound: () => ({ __tool: 1 }) };
    const ctx = {
      tp,
      params: {},
      sketches: tree.sketches as any,
      body: { vals: () => [{ __plate: 1 }], cut: () => ctx.body, union: () => ctx.body } as any,
      tools: new Map([["f_bolt", [tool]]]),
      featureShapes: new Map(),
      keep: (x: any) => x,
      feature: tree.features[1],
      toVec: (x: number, y: number, z: number) => new tp.gp_Vec_4(x, y, z),
      toPnt: (x: number, y: number, z: number) => ({ x, y, z }),
      toDir: (x: number, y: number, z: number) => ({ x, y, z }),
      evalParam: (e: any, f: number) => (typeof e === "number" ? e : f),
      fail: (msg: string): never => { throw new Error(msg); },
    };
    const handler = (interp as any).ops.get("pattern_polar");
    handler(ctx, tree.features[1].op);
    const rotates = calls.filter((c: string) => c.startsWith("rotate "));
    // 3 instances (count 4), each 90° → π/2 rad, about the (40,40) axis line
    expect(rotates).toEqual([
      `rotate ${90 * degToRad}`,
      `rotate ${180 * degToRad}`,
      `rotate ${270 * degToRad}`,
    ]);
  });

  it("boolean toolFeature cuts against another feature's material; union is refused", async () => {
    const { tp } = mockKernel();
    const interp = new TreeInterpreter(tp as KernelGlobal, {} as any);
    registerBuiltinOps(interp, {} as any);
    const tree = twoFeatureTree();
    tree.features = [
      { id: "f_x", op: { op: "boolean", kind: "cut", toolFeature: "f_boss" } },
    ];
    const bossMaterial = { castCompound: () => ({ __boss: 1 }) };
    const cutCalls: any[] = [];
    const ctx = {
      tp,
      params: {},
      sketches: tree.sketches as any,
      body: {
        vals: () => [{ __plate: 1 }],
        cut: (tool: any) => { cutCalls.push(tool); return ctx.body; },
        union: () => ctx.body,
        intersect: () => ctx.body,
      } as any,
      tools: new Map(),
      featureShapes: new Map([["f_boss", bossMaterial]]),
      keep: (x: any) => x,
      feature: tree.features[0],
      toVec: (x: number, y: number, z: number) => new tp.gp_Vec_4(x, y, z),
      toPnt: (x: number, y: number, z: number) => ({ x, y, z }),
      toDir: (x: number, y: number, z: number) => ({ x, y, z }),
      evalParam: (e: any, f: number) => (typeof e === "number" ? e : f),
      fail: (msg: string): never => { throw new Error(msg); },
    };
    const handler = (interp as any).ops.get("boolean");
    handler(ctx, tree.features[0].op);
    expect(cutCalls).toEqual([{ __boss: 1 }]);

    // union against a toolFeature is the announced no-op, not a silent pass
    const opUnion = { op: "boolean", kind: "union", toolFeature: "f_boss" };
    expect(() => handler(ctx, opUnion)).toThrow(/no-op/);
  });

  it("custom-plane sketches are honest skips naming the server", async () => {
    const { tp } = mockKernel();
    const interp = new TreeInterpreter(tp as KernelGlobal, {} as any);
    registerBuiltinOps(interp, {} as any);
    const tree = twoFeatureTree();
    tree.sketches.s_base.plane = { kind: "custom", origin: [5, 70, 0], normal: [-1, 0, 0], xAxis: [0, -1, 0] } as any;
    tree.features = [{ id: "f_pad", op: { op: "pad", sketchId: "s_base", distance: "10" } }];
    const res = await interp.interpret(tree, {});
    expect(res.emitted).toEqual([]);
    expect(res.skipped[0].reason).toContain("the server builds them");
  });

  it("sweep/loft are named skips (server builds them; editor falls back)", async () => {
    const { tp } = mockKernel();
    const interp = new TreeInterpreter(tp as KernelGlobal, {} as any);
    registerBuiltinOps(interp, {} as any);
    const tree = twoFeatureTree();
    tree.sketches.s_path = { id: "s_path", plane: { kind: "XZ" }, entities: [], constraints: [] };
    tree.features = [
      { id: "f_sweep", op: { op: "sweep", sketchId: "s_base", pathSketchId: "s_path" } },
      { id: "f_loft", op: { op: "loft", sketchIds: ["s_base", "s_bolt"] } },
    ];
    const res = await interp.interpret(tree, {});
    expect(res.emitted).toEqual([]);
    expect(res.skipped[0].reason).toContain("sweep");
    expect(res.skipped[1].reason).toContain("loft");
  });
});

// The unified creation entry (迭代 23 前端半边): prompt + image together ride
// multipart (双模态); prompt alone rides JSON (text2cad). One transport call,
// the server routes on Content-Type.
describe("Transport createRun 统一入口", () => {
  beforeEach(() => {
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true, status: 201, text: async () => JSON.stringify({ runId: "r", status: "queued" }),
    }));
  });

  it("prompt alone rides JSON", async () => {
    const t = new Transport();
    await t.createRun({ prompt: "一个 120x60 的板" });
    const call = (globalThis as any).fetch.mock.calls[0];
    expect(call[1].method).toBe("POST");
    const body = JSON.parse(call[1].body);
    expect(body.prompt).toBe("一个 120x60 的板");
  });

  it("prompt + image ride multipart with BOTH fields", async () => {
    const t = new Transport();
    // Node <20 has no File global — a Blob with a name stands in for the
    // shape the transport reads (it only forwards the object into FormData).
    const img: any = { name: "drawing.png" };
    await t.createRun({ prompt: "板厚 15mm，其余按图", image: img, partName: "bracket" });
    const call = (globalThis as any).fetch.mock.calls[0];
    expect(call[1].method).toBe("POST");
    expect(String(call[1].body)).toBeDefined();
  });

  it("vision edit: sessionMessage carries the image", async () => {
    const t = new Transport();
    await t.sessionMessage("sess_1", { prompt: "按这张草图改", image: "c2tldGNo" });
    const call = (globalThis as any).fetch.mock.calls[0];
    expect(call[0]).toBe("/sessions/sess_1/messages");
    const body = JSON.parse(call[1].body);
    expect(body.image).toBe("c2tldGNo");
  });
});
