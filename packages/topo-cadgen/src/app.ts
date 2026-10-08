// Composition root (P3 framework): build the core services, register the
// builtin ops, wire the closed loop — pick → attribution → edit prompt →
// linked session → SSE → refresh. Panels register through the same registry.
import * as THREE from "three";
import { loadKernel, installGlobals, resolveParams } from "./engine/kernel.js";
import { TreeInterpreter, registerBuiltinOps } from "./engine/interpreter.js";
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
    this.registerBuiltinCommands();
  }

  // pickVertex — the vertex mode's local selection: no server semantics
  // exist for vertices, so the readout (coordinates) is the product.
  private pickVertex(vertexId: number): void {
    const v = this.viewer.getVertex(vertexId);
    if (!v) return;
    this.selection.set({ featureId: "", kind: "vertex", vertexId, position: v.position });
    this.viewer.highlightVertex(vertexId);
    this.viewer.highlight(new Set());
    this.viewer.highlightEdges(new Set());
    const [x, y, z] = v.position.map((n) => n.toFixed(2));
    this.log("done", `选中顶点 #${vertexId} (${x}, ${y}, ${z})`);
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
  announceSelection(featureId: string, opts: { faceId?: number; edgeId?: number } = {}): void {
    this.store.set({ selection: featureId || null });
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
  async loadRun(runId: string): Promise<void> {
    this.store.set({ runId, notice: undefined });
    const { data: tree } = await this.transport.runTree(runId);
    this.store.set({ tree, params: resolveParams(tree) });
    // Local build first (instant, browser kernel); server mesh as fallback
    // when the local interpreter skips an op it does not cover yet.
    try {
      const interp = await this.ensureInterpreter();
      const result = await interp.interpret(tree, this.store.get().params);
      if (result.mesh) {
        this.viewer.setMesh(result.mesh);
        this.artifacts.invalidate();
        await this.refreshArtifacts();
      } else {
        throw new Error(result.skipped.map((s) => s.reason).join("; ") || "local build empty");
      }
    } catch (e) {
      this.log("warning", `local build fell back to server mesh: ${e instanceof Error ? e.message : e}`);
      const { data: mesh, status } = await this.transport.runMesh(runId);
      if (status === 200) this.viewer.setMesh(mesh);
    }
    // The topology overlay (edges render + picks address) — optional: a
    // failed or tool-less run simply has none.
    try {
      const { status, data } = await this.transport.runTopology(runId);
      if (status === 200 && data?.edges) {
        this.store.set({ topology: data });
        this.viewer.setEdges(data.edges);
      } else {
        this.store.set({ topology: undefined });
        this.viewer.setEdges(null);
      }
    } catch {
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
