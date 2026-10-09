// Composition root (P3 framework): build the core services, register the
// builtin ops, wire the closed loop — pick → attribution → edit prompt →
// linked session → SSE → refresh. Panels register through the same registry.
import * as THREE from "three";
import { loadKernel, installGlobals, resolveParams } from "./engine/kernel.js";
import { TreeInterpreter, registerBuiltinOps, planeAxes } from "./engine/interpreter.js";
import { Store } from "./core/store.js";
import { Commands } from "./core/commands.js";
import { Transport } from "./core/transport.js";
import { ArtifactService, ownedFaces } from "./core/artifacts.js";
import { SelectionService } from "./core/selection.js";
import { LocalEditService } from "./core/edits.js";
import { Viewer } from "./viewer/viewer.js";
import type { FeatureTreeLike } from "./engine/kernel.js";

// Panel — the features/ extension point: { id, mount(el) }, registered on
// the app; the host page places panels into its own layout. Panels never
// import each other; they meet through the store/selection/commands.
export interface Panel {
  id: string;
  title?: string;
  mount(el: HTMLElement): void;
}

export interface RunProperties {
  volume: number;
  surfaceArea: number;
  centreOfMass: number[];
  bbox: number[];
  ok: boolean;
  reason?: string;
}

export interface AssemblyInventory {
  id: string;
  name: string;
  parts: Array<{ name: string; volume: number; bbox: number[] }>;
}

/** One entry of the run's version chain (GET /runs/:id/versions). */
export interface VersionEntry {
  index: number;
  digest: string;
  changed?: Array<{ featureId: string; kind: string }>;
  verdict: string;
  at: string;
  current: boolean;
}

export interface EditorState {
  runId: string | null;
  tree: FeatureTreeLike | null;
  params: Record<string, number>;
  sessionId: string | null;
  selection: string | null;
  busy: boolean;
  /** The run's addressable face/edge index (undefined: unavailable). */
  topology?: { faces: Array<{ id: number; featureId?: string }>; edges: Array<{ id: number; ref: unknown; faces: number[]; points: number[][] }> };
  /** The current tree's physical properties (undefined: not fetched yet). */
  properties?: RunProperties;
  /** The loaded assembly view (undefined: the part view is showing). */
  assembly?: AssemblyInventory;
  /** The run's version chain, oldest first (undefined: not fetched yet). */
  versions?: VersionEntry[];
  /** A panel-visible notice (Zoo 的错误横幅经验): authoritative failures —
   * an edit the pipeline refused — surface on the feature tree, not just in
   * the log overlay. Cleared by the next successful load/apply. */
  notice?: { kind: "error" | "warn"; text: string };
}

export interface EditorOptions {
  base?: string;
  container: HTMLElement;
  onLog?: (kind: string, text: string) => void;
}

// EditorApp — assemble the framework. `kernel gated`: the first local build
// triggers the wasm load (~66MB, cached).
export class EditorApp {
  readonly store = new Store<EditorState>({
    runId: null, tree: null, params: {}, sessionId: null, selection: null, busy: false,
  });
  readonly commands = new Commands();
  readonly transport: Transport;
  readonly viewer: Viewer;
  readonly artifacts: ArtifactService;
  readonly selection = new SelectionService();
  readonly edits: LocalEditService;
  readonly log: (kind: string, text: string) => void;
  private panels = new Map<string, Panel>();
  private interpreter: TreeInterpreter | null = null;

  constructor(
    private opts: EditorOptions,
    log?: (kind: string, text: string) => void,
  ) {
    // Log routing: explicit ctor fn wins, then opts.onLog — a host that
    // passes onLog but not the ctor fn must still see the pipeline's voice.
    this.log = log ?? opts.onLog ?? (() => {});
    this.transport = new Transport(opts.base ?? "");
    this.viewer = new Viewer(opts.container);
    this.artifacts = new ArtifactService({
      interpret: (tree, params) => this.ensureInterpreter().then((i) => i.interpret(tree, params)),
    } as any);
    this.edits = new LocalEditService({
      interpret: (tree, params) => this.ensureInterpreter().then((i) => i.interpret(tree, params)),
      replay: (tree) => this.transport.replayTree(this.store.get().runId!, tree),
    });
    this.viewer.onFacePick((faceId) => void this.pick(faceId));
    this.viewer.onEdgePick((edgeId) => void this.pickEdge(edgeId));
    this.viewer.onVertexPick((vertexId) => this.pickVertex(vertexId));
    this.viewer.onVertexDragStart((vertexId) => this.tryBeginDrag(vertexId));
    this.registerBuiltinCommands();
    // e2e hook (?e2e=1): automation aiming only — a self-refreshing DOM
    // probe (#e2e-probe) carrying every vertex's world position and SCREEN
    // pixel, plus view presets via window.__cadgen. Gestures themselves
    // stay REAL pointer events (CUA/click), the probe is read-only data.
    if (new URLSearchParams(window.location.search).has("e2e")) {
      (window as any).__cadgen = {
        viewPreset: (p: string) => this.viewer.setViewPreset(p as any),
      };
      const probe = document.createElement("div");
      probe.id = "e2e-probe";
      probe.style.display = "none";
      document.body.appendChild(probe);
      const v2 = this.viewer as any;
      const refresh = () => {
        const out: any[] = [];
        for (let i = 0; i < v2.vertexCount(); i++) {
          out.push({ id: i, world: v2.getVertex(i), screen: v2.vertexScreen(i) });
        }
        probe.textContent = JSON.stringify({
          vertices: out,
          dbg: v2.debugState ? v2.debugState() : null,
        });
      };
      setInterval(refresh, 300);
      refresh();
    }
  }

  // ---------------------------------------------------------------------
  // drag loop (docs/drag-loop.md M2): a grabbed vertex that resolves to a
  // sketch entity endpoint becomes a drag handle; release posts the target
  // to the solver and replays through the standard chain.
  // ---------------------------------------------------------------------

  /** drag attribution — the grabbed topology vertex mapped to the owning
   * sketch entity's endpoint (local nearest-match: the tree's entity
   * coordinates projected through the plane frame; 0.5mm address window). */
  private resolveDragPoint(vertexId: number): { sketchId: string; tag: string; which: "start" | "end" | "center"; plane: { origin: [number, number, number]; ex: number[]; ey: number[]; n: number[] } } | null {
    const { tree, selection } = this.store.get();
    if (!tree) return null;
    const v = this.viewer.getVertex(vertexId);
    if (!v) return null;
    // the candidate sketches: the selected feature's sketch first, else any
    // sketch whose plane the vertex lies on
    const sel = this.selection.get();
    const ids = Object.keys(tree.sketches ?? {});
    const ordered = sel?.sketchId ? [sel.sketchId, ...ids.filter((i) => i !== sel.sketchId)] : ids;
    for (const id of ordered) {
      const sk = (tree.sketches as any)[id];
      if (!sk?.entities) continue;
      const axes = planeAxes(sk.plane);
      const o = sk.plane?.origin ?? [0, 0, 0];
      // the vertex must lie ON this sketch's plane (distance to plane)
      const rel = [v.position[0] - o[0], v.position[1] - o[1], v.position[2] - o[2]];
      const dist = Math.abs(rel[0] * axes.n[0] + rel[1] * axes.n[1] + rel[2] * axes.n[2]);
      if (dist > 0.5) continue;
      let best: { tag: string; which: "start" | "end" | "center"; d: number } | null = null;
      for (const e of sk.entities) {
        if (e.construction) continue;
        const ends: Array<[string, number[] | undefined]> = [
          ["center", e.center],
          ["start", e.start],
          ["end", e.end],
        ];
        for (const [which, p] of ends) {
          if (!p) continue;
          const w = [
            o[0] + p[0] * axes.ex[0] + p[1] * axes.ey[0],
            o[1] + p[0] * axes.ex[1] + p[1] * axes.ey[1],
            o[2] + p[0] * axes.ex[2] + p[1] * axes.ey[2],
          ];
          const d = Math.hypot(w[0] - v.position[0], w[1] - v.position[1], w[2] - v.position[2]);
          if (d < 0.5 && (!best || d < best.d)) best = { tag: e.tag, which: which as any, d };
        }
      }
      if (best) {
        return {
          sketchId: id, tag: best.tag, which: best.which,
          plane: { origin: o as [number, number, number], ex: axes.ex, ey: axes.ey, n: axes.n },
        };
      }
    }
    void selection;
    return null;
  }

  /** tryBeginDrag — the viewer's drag-gate: only a vertex this app can
   * address (sketch entity endpoint on a known plane) owns the gesture. */
  private tryBeginDrag(vertexId: number): boolean {
    const { runId, tree } = this.store.get();
    if (!runId || !tree) return false;
    const at = this.resolveDragPoint(vertexId);
    if (!at) return false;
    const v = this.viewer.getVertex(vertexId)!;
    const planeAxesFull = {
      origin: at.plane.origin, ex: at.plane.ex, ey: at.plane.ey, n: at.plane.n,
    };
    // M3 拖拽流预览: throttled server-side solves (preview=true — no tree
    // mutation, no version), the answered entities rendered as a bright
    // overlay on the sketch plane. The release fires the REAL drag.
    let lastPreviewAt = 0;
    let previewSeq = 0;
    this.viewer.beginVertexDrag(
      v.position,
      planeAxesFull,
      (u, v2) => {
        const now = Date.now();
        if (now - lastPreviewAt < 120) return; // ~8 fps of solved previews
        lastPreviewAt = now;
        const seq = ++previewSeq;
        void this.transport
          .dragSketch(runId, at.sketchId, { tag: at.tag, which: at.which, target: [u, v2], preview: true })
          .then(({ status, data }) => {
            if (seq !== previewSeq || status !== 200) return; // a newer frame won
            const ents = (data as any)?.sketch?.entities as Array<Record<string, any>> | undefined;
            if (ents) this.viewer.drawSketchPreview(planeAxesFull, ents);
          })
          .catch(() => { /* a failed preview frame is not a drag failure */ });
      },
      (u, v2) => {
        previewSeq++; // in-flight previews are dead once the release fires
        this.viewer.clearSketchPreview();
        void this.commitDrag(at.sketchId, { tag: at.tag, which: at.which, target: [u, v2] });
      },
    );
    this.log("done", `拖拽 ${at.tag}.${at.which} — 松手后由服务端求解落版`);
    return true;
  }

  /** commitDrag — release: the solved coordinates replay through the same
   * gate chain (PUT edits semantics); 422 lands as the standard notice. */
  private async commitDrag(sketchId: string, body: { tag: string; which?: string; target: [number, number] }): Promise<void> {
    const { runId } = this.store.get();
    if (!runId) return;
    this.store.set({ busy: true });
    try {
      const { status, data } = await this.transport.dragSketch(runId, sketchId, body);
      if (status !== 200) {
        const gaps = (data as any)?.gaps as string[] | undefined;
        const text = gaps?.length ? gaps.join("; ") : `HTTP ${status}`;
        this.log("warning", `拖拽被拒绝: ${text}`);
        await this.loadRun(runId);
        this.store.set({ notice: { kind: "error", text: `拖拽被拒绝: ${text}` } });
        return;
      }
      const drag = (data as any)?.drag as { affected?: string[] } | undefined;
      this.log("done", `拖拽落版 v${(data as any)?.version} — 影响域: ${(drag?.affected ?? []).join(", ")}`);
      // noReframe: the user is mid-conversation with the model; the camera
      // must not yank (M2's noReframe path)
      await this.loadRun(runId, { noReframe: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log("warning", `拖拽失败: ${msg}`);
      this.store.set({ notice: { kind: "error", text: `拖拽失败: ${msg}` } });
    } finally {
      this.store.set({ busy: false });
    }
  }

  // pickVertex — the vertex mode's local selection: no server semantics
  // exist for vertices, so the readout (coordinates) is the product. When
  // the vertex resolves to a sketch entity endpoint, it also joins the
  // 点选加约束 queue (M3): two resolved picks on one sketch arm the
  // constraint commands.
  private sketchPicks: Array<{ sketchId: string; tag: string; which: string; position: [number, number, number] }> = [];
  private pickVertex(vertexId: number): void {
    document.title = "pickVertex:" + vertexId; // DEBUG
    const v = this.viewer.getVertex(vertexId);
    if (!v) return;
    this.selection.set({ featureId: "", kind: "vertex", vertexId, position: v.position });
    this.viewer.highlightVertex(vertexId);
    this.viewer.highlight(new Set());
    this.viewer.highlightEdges(new Set());
    const at = this.resolveDragPoint(vertexId);
    if (at) {
      this.sketchPicks.push({ sketchId: at.sketchId, tag: at.tag, which: at.which, position: v.position });
      if (this.sketchPicks.length > 2) this.sketchPicks.shift();
      const { tree: t2 } = this.store.get();
      if (t2) this.viewer.setVertexFilter(this.sketchEndpointsOf(t2, at.sketchId));
      const [x, y, z] = v.position.map((n) => n.toFixed(2));
      this.log("done", `选中 ${at.tag}.${at.which} (${x}, ${y}, ${z}) — 再选一点后可用 sketch.fixPoint / sketch.coincident`);
      return;
    }
    const [x, y, z] = v.position.map((n) => n.toFixed(2));
    this.log("done", `选中顶点 #${vertexId} (${x}, ${y}, ${z})`);
  }

  /** commitSketchConstraint — apply the addSketchConstraint patch through
   * the standard chain (preview → replay → version). */
  private commitSketchConstraint(sketchId: string, constraint: Record<string, unknown>): void {
    const { tree } = this.store.get();
    if (!tree) return;
    void this.applyPatch({ kind: "addSketchConstraint", sketchId, constraint } as any);
  }

  // registerPanel — the features/ extension point (duplicate ids throw:
  // panels are part of the extension API, collisions are bugs).
  registerPanel(panel: Panel): void {
    if (this.panels.has(panel.id)) throw new Error(`panel ${panel.id} already registered`);
    this.panels.set(panel.id, panel);
  }

  panelIDs(): string[] {
    return [...this.panels.keys()];
  }

  mountPanel(id: string, el: HTMLElement): void {
    const panel = this.panels.get(id);
    if (!panel) throw new Error(`panel ${id} not registered`);
    panel.mount(el);
  }

  // applyTree — the structured-edit closed loop: local preview first (the
  // browser kernel is free), server replay only on a clean preview. On
  // success the server has already cut a version; reload from it so the
  // editor state IS the server state (no optimistic divergence).
  async applyTree(next: FeatureTreeLike): Promise<boolean> {
    const { runId, tree, params, busy } = this.store.get();
    if (!runId || !tree || busy) return false;
    this.store.set({ busy: true });
    try {
      const result = await this.edits.commit(tree, next, params);
      if (!result.ok) {
        this.log("warning", `编辑被拒绝: ${result.error}`);
        // The rejection is authoritative: resync from the server so the
        // panels never keep showing an edit the pipeline refused, then
        // surface the refusal where the tree lives (Zoo 的错误横幅 — set
        // after the resync: loadRun opens with a clean slate).
        await this.loadRun(runId);
        this.store.set({ notice: { kind: "error", text: `编辑被拒绝: ${result.error}` } });
        return false;
      }
      this.log("done", `已落版 ${result.version ? `v${result.version.index}` : ""} — 变更: ${result.changed.map((c) => `${c.featureId}(${c.kind})`).join(", ")}`);
      await this.loadRun(runId);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log("warning", `编辑失败: ${msg}`);
      this.store.set({ notice: { kind: "error", text: `编辑失败: ${msg}` } });
      return false;
    } finally {
      this.store.set({ busy: false });
    }
  }

  private registerBuiltinCommands(): void {
    // 点选加约束 (M3): two resolved sketch picks arm these. FIXED_POINT
    // pins the LAST pick at its current coordinates; COINCIDENT joins the
    // two picks (the vocabulary's reading: the first's exit meets the
    // second's entry).
    this.commands.register({
      id: "sketch.fixPoint", title: "固定选中点", keys: "ctrl+shift+f",
      run: () => {
        const last = this.sketchPicks[this.sketchPicks.length - 1];
        if (!last) {
          this.log("warning", "先选中一个草图端点 (顶点模式)");
          return;
        }
        this.sketchPicks = [];
        this.commitSketchConstraint(last.sketchId, {
          kind: "FIXED_POINT", tags: [last.tag], value: [last.position[0], last.position[1]],
        });
        this.log("done", `已固定 ${last.tag}.${last.which}`);
      },
    });
    this.commands.register({
      id: "sketch.coincident", title: "重合两选中点", keys: "ctrl+shift+c",
      run: () => {
        const [a, b] = this.sketchPicks;
        if (!a || !b || a.sketchId !== b.sketchId) {
          this.log("warning", "需要同一草图上的两个已解析端点");
          return;
        }
        this.sketchPicks = [];
        this.commitSketchConstraint(b.sketchId, { kind: "COINCIDENT", tags: [a.tag, b.tag] });
        this.log("done", `已重合 ${a.tag} ↔ ${b.tag}`);
      },
    });
    this.commands.register({ id: "edit.undo", title: "撤销", keys: "ctrl+z", run: () => void this.undoRedo("undo") });
    this.commands.register({ id: "edit.redo", title: "重做", keys: "ctrl+shift+z", run: () => void this.undoRedo("redo") });
  }

  private async undoRedo(kind: "undo" | "redo"): Promise<void> {
    const runId = this.store.get().runId;
    if (!runId) return;
    const { status, data } = kind === "undo"
      ? await this.transport.undo(runId)
      : await this.transport.redo(runId);
    if (status !== 200) {
      this.log("warning", `${kind} 被拒绝: ${JSON.stringify(data).slice(0, 200)}`);
      return;
    }
    await this.loadRun(runId);
  }

  private async ensureInterpreter(): Promise<TreeInterpreter> {
    if (!this.interpreter) {
      const tp = await loadKernel();
      installGlobals(tp);
      const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
      const cq = {
        workplane: (plane?: string, origin?: number[]) =>
          new CQWorkplane(tp, plane ?? "XY",
            origin ? new tp.Vector(origin[0], origin[1], origin[2]) : undefined) as any,
        vec: (x: number, y: number, z: number) => new tp.Vector(x, y, z),
      };
      this.interpreter = new TreeInterpreter(tp, cq);
      registerBuiltinOps(this.interpreter, cq);
      (this.artifacts as any).interpreter = this.interpreter;
    }
    return this.interpreter;
  }

  // ownedFacesOf — the feature→geometry lookup (the local artifact map;
  // null when the map is absent, e.g. the server-mesh fallback).
  private ownedFacesOf(featureId: string): Set<number> | null {
    const am = (this.artifacts as any).cache?.map;
    if (!am) return null;
    return ownedFaces(am, featureId);
  }

  // announceSelection — the ONE tail every selection path lands at (Zoo 的
  // Set selection 单入口经验): store + viewport paint stay consistent no
  // matter whether selection started from a face, an edge, or a tree row.
  // refreshVertexFilter — 拾取抢占修复: while a sketch-driven feature (or
  // one of its sketches' endpoints) is the selection context, the vertex
  // cloud shows ONLY that sketch's entity endpoints — the z-mirror topology
  // corners stop stealing the pick from the draggable points. Cleared with
  // the selection.
  private refreshVertexFilter(): void {
    // Two selection surfaces: the store's selection IS the featureId string
    // (tree-row path), the SelectionService carries the sketch-enriched form
    // (viewport pick path). Both resolve to the feature's sketchId.
    const { tree, selection: storeSelection } = this.store.get();
    const sel = this.selection.get();
    const featureId = sel?.featureId ?? storeSelection ?? undefined;
    let sketchId: string | undefined = (sel as any)?.sketchId;
    if (!sketchId && featureId && tree) {
      const f = (tree.features ?? []).find((f) => f.id === featureId);
      sketchId = (f?.op as any)?.sketchId;
    }
    if (!tree || !sketchId || !(tree.sketches as any)[sketchId]) {
      this.viewer.setVertexFilter(null);
      return;
    }
    this.viewer.setVertexFilter(this.sketchEndpointsOf(tree, sketchId));
  }

  /** sketchEndpointsOf — the sketch's entity anchor points in world
   * coordinates, deduped (the drag candidates). */
  private sketchEndpointsOf(tree: FeatureTreeLike, sketchId: string): Array<[number, number, number]> {
    const sk = (tree.sketches as any)[sketchId];
    if (!sk?.entities) return [];
    const axes = planeAxes(sk.plane);
    const o = sk.plane?.origin ?? [0, 0, 0];
    const to3D = (p: number[]): [number, number, number] => [
      o[0] + p[0] * axes.ex[0] + p[1] * axes.ey[0],
      o[1] + p[0] * axes.ex[1] + p[1] * axes.ey[1],
      o[2] + p[0] * axes.ex[2] + p[1] * axes.ey[2],
    ];
    const pts: Array<[number, number, number]> = [];
    const seen = new Set<string>();
    for (const e of sk.entities ?? []) {
      if (e.construction || e.type === "spline") continue;
      for (const p of [e.center, e.start, e.end]) {
        if (!p) continue;
        const w = to3D(p);
        const key = w.map((v) => v.toFixed(2)).join(",");
        if (!seen.has(key)) {
          seen.add(key);
          pts.push(w);
        }
      }
    }
    return pts;
  }

  announceSelection(featureId: string, opts: { faceId?: number; edgeId?: number } = {}): void {
    this.store.set({ selection: featureId || null });
    this.refreshVertexFilter();
    if (opts.edgeId !== undefined) {
      this.viewer.highlightEdges(new Set([opts.edgeId]));
      this.viewer.highlight(new Set());
      return;
    }
    const owned = this.ownedFacesOf(featureId);
    if (owned) this.viewer.highlight(owned, opts.faceId);
    else this.viewer.highlight(new Set(), opts.faceId);
    this.viewer.highlightEdges(new Set());
  }

  // clearSelection — deselect (the context chip's ✕): back to no selection,
  // plain base colors. Vertices included — the service holds those too.
  clearSelection(): void {
    this.selection.set(null);
    this.store.set({ selection: null });
    this.viewer.highlight(new Set());
    this.viewer.highlightEdges(new Set());
    this.viewer.highlightVertex(null);
  }

  // previewFeature — the tree-row hover's quiet tint (Zoo 的 hover 高亮):
  // paint the hovered feature's faces without touching the selection.
  previewFeature(featureId: string): void {
    const owned = this.ownedFacesOf(featureId);
    if (owned) this.viewer.highlight(owned);
  }

  // clearPreview — restore the viewport to the current selection's paint.
  clearPreview(): void {
    const { selection } = this.store.get();
    const sel = this.selection.get();
    if (sel?.kind === "edge") {
      this.announceSelection(selection ?? "", { edgeId: sel.edgeId });
      return;
    }
    this.announceSelection(selection ?? "", { faceId: sel?.faceId });
  }

  // pick — viewer → attribution → highlight → store.
  private async pick(faceId: number): Promise<void> {
    if (!this.store.get().runId) return;
    const { status, data } = await this.transport.select(this.store.get().runId!, { faceId });
    if (status !== 200) return;
    this.selection.set({
      featureId: data.featureId, sketchId: data.sketchId, faceId, sourceRange: data.sourceRange,
    });
    // Two-tier highlight: the clicked face loud, its owning feature's other
    // faces in the quiet attribution tint. The artifact map carries the
    // ownership; without it (server-mesh fallback) the picked face still
    // answers — before, that path stayed completely unhighlighted.
    this.announceSelection(data.featureId, { faceId });
  }

  // pickEdge — the edge half of selection: server resolves the ref (the
  // same EdgeRefResolution the fillet op uses) → featureId via adjacency.
  private async pickEdge(edgeId: number): Promise<void> {
    const { runId, topology } = this.store.get();
    if (!runId || !topology) return;
    const edge = topology.edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const { status, data } = await this.transport.selectEdge(runId, edge.ref);
    if (status !== 200) {
      this.log("warning", `edge ${edgeId} 解析失败`);
      return;
    }
    this.selection.set({
      featureId: data.featureId, kind: "edge",
      edgeId: data.edgeId ?? edgeId, edgeRef: edge.ref as any,
    });
    this.announceSelection(data.featureId, { edgeId: data.edgeId ?? edgeId });
    this.log("done", `选中 edge#${data.edgeId ?? edgeId} (${data.resolvedBy}) → ${data.featureId}`);
  }

  // loadRun — pull tree/mesh/artifacts/versions and display. A fresh load
  // opens with a clean slate: no stale rejection banner from the previous
  // state.
  async loadRun(runId: string, opts?: { noReframe?: boolean }): Promise<void> {
    this.store.set({ runId, notice: undefined });
    const { data: tree } = await this.transport.runTree(runId);
    this.store.set({ tree, params: resolveParams(tree) });
    // Local build first (instant, browser kernel); server mesh as fallback
    // when the local interpreter skips an op it does not cover yet.
    try {
      const interp = await this.ensureInterpreter();
      const result = await interp.interpret(tree, this.store.get().params);
      if (result.mesh) {
        this.viewer.setMesh(result.mesh, { noReframe: opts?.noReframe === true });
        this.artifacts.invalidate();
        await this.refreshArtifacts();
      } else {
        throw new Error(result.skipped.map((s) => s.reason).join("; ") || "local build empty");
      }
    } catch (e) {
      this.log("warning", `local build fell back to server mesh: ${e instanceof Error ? e.message : e}`);
      const { data: mesh, status } = await this.transport.runMesh(runId);
      if (status === 200) this.viewer.setMesh(mesh, { noReframe: opts?.noReframe === true });
    }
    // The topology overlay (edges render + picks address) — optional: a
    // failed or tool-less run simply has none.
    try {
      const { status, data } = await this.transport.runTopology(runId);
      document.title = `topo: status=${status} edges=${data?.edges?.length ?? "null"}`; // DEBUG
      if (status === 200 && data?.edges) {
        this.store.set({ topology: data });
        this.viewer.setEdges(data.edges);
        document.title = `topo: edges set, cloud=${!!(this.viewer as any).vertexCloud}`; // DEBUG
        this.refreshVertexFilter();
        document.title = `topo: filtered, cloud=${!!(this.viewer as any).vertexCloud}`; // DEBUG
      } else {
        this.store.set({ topology: undefined });
        this.viewer.setEdges(null);
      }
    } catch (e) {
      document.title = `topo THREW: ${e instanceof Error ? e.message : String(e)}`; // DEBUG
      this.store.set({ topology: undefined });
      this.viewer.setEdges(null);
    }
    await this.refreshVersions();
    await this.refreshProperties();
  }

  // refreshProperties — the digital-twin read: the mass properties follow
  // the current tree, so every load/apply/undo lands fresh numbers.
  async refreshProperties(): Promise<void> {
    const runId = this.store.get().runId;
    if (!runId) return;
    const { status, data } = await this.transport.runProperties(runId);
    if (status === 200 && data?.ok) {
      this.store.set({ properties: data });
    } else {
      this.store.set({ properties: undefined });
    }
  }

  // loadAssembly — switch the viewport to the assembly view: inventory into
  // the store (panels render it), the GLB into the viewer.
  async loadAssembly(id: string): Promise<void> {
    const { status, data } = await this.transport.assembly(id);
    if (status !== 200) {
      this.log("warning", `装配 ${id} 加载失败`);
      return;
    }
    const glb = await this.transport.assemblyGLB(id);
    await this.viewer.showAssemblyGLB(glb);
    this.store.set({ assembly: { id: data.assemblyId ?? id, name: data.name, parts: data.parts ?? [] } });
    this.log("done", `装配视图: ${data.name} (${(data.parts ?? []).length} 件)`);
  }

  // showPart — back from the assembly view.
  showPart(): void {
    this.viewer.showPart();
    this.store.set({ assembly: undefined });
  }

  async refreshArtifacts(): Promise<void> {
    const tree = this.store.get().tree;
    if (!tree) return;
    const interp = await this.ensureInterpreter();
    const params = this.store.get().params;
    const am = await this.artifacts.build(tree, params);
    // Hand the attribution to the UI (panels subscribe via store/features).
    this.log("done", `归属: ${am.features.map((f) => `${f.featureId}(${f.faceIds.length}面)`).join(", ")}`);
  }

  async refreshVersions(): Promise<void> {
    if (!this.store.get().runId) return;
    const { status, data } = await this.transport.runVersions(this.store.get().runId!);
    if (status === 200 && Array.isArray(data?.versions)) {
      this.store.set({ versions: data.versions });
    } else {
      this.store.set({ versions: undefined });
    }
  }

  // restoreVersion — the timeline jump: the server lands the old tree as a
  // NEW version on top (history never rewritten, one undo walks back); the
  // reload makes the jump indistinguishable from any other accepted edit.
  async restoreVersion(index: number): Promise<void> {
    const runId = this.store.get().runId;
    if (!runId || this.store.get().busy) return;
    this.store.set({ busy: true });
    try {
      const { status, data } = await this.transport.restoreVersion(runId, index);
      if (status !== 200) {
        const why = (data as any)?.gaps?.join("; ") || JSON.stringify(data).slice(0, 160);
        this.log("warning", `跳转 v${index} 被拒绝: ${why}`);
        this.store.set({ notice: { kind: "error", text: `跳转 v${index} 被拒绝: ${why}` } });
        return;
      }
      if ((data as any)?.unchanged) {
        this.log("done", `v${index} 即当前版本 — 无需跳转`);
        return;
      }
      this.log("done", `已跳转到 v${(data as any)?.index ?? index}（落为新版本）`);
      await this.loadRun(runId);
    } finally {
      this.store.set({ busy: false });
    }
  }

}
