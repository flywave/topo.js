// Composition root (P3 framework): build the core services, register the
// builtin ops, wire the closed loop — pick → attribution → edit prompt →
// linked session → SSE → refresh. Panels register through the same registry.
import * as THREE from "three";
import { loadKernel, installGlobals, resolveParams } from "./engine/kernel.js";
import { TreeInterpreter, registerBuiltinOps } from "./engine/interpreter.js";
import type { FeatureTreeLike } from "./engine/kernel.js";
import { Store } from "./core/store.js";
import { Commands } from "./core/commands.js";
import { Transport } from "./core/transport.js";
import { ArtifactService } from "./core/artifacts.js";
import { SelectionService } from "./core/selection.js";
import { Viewer } from "./viewer/viewer.js";

export interface EditorState {
  runId: string | null;
  tree: FeatureTreeLike | null;
  params: Record<string, number>;
  sessionId: string | null;
  selection: string | null;
  busy: boolean;
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
  private interpreter: TreeInterpreter | null = null;

  constructor(
    private opts: EditorOptions,
    public readonly log: (kind: string, text: string) => void = () => {},
  ) {
    this.transport = new Transport(opts.base ?? "");
    this.viewer = new Viewer(opts.container);
    this.artifacts = new ArtifactService({
      interpret: (tree, params) => this.ensureInterpreter().then((i) => i.interpret(tree, params)),
    } as any);
    this.viewer.onFacePick((faceId) => void this.pick(faceId));
  }

  private async ensureInterpreter(): Promise<TreeInterpreter> {
    if (!this.interpreter) {
      const tp = await loadKernel();
      installGlobals(tp);
      const { CQWorkplane } = await import("../../topo-primitives/lib/cq/index.js");
      const cq = {
        workplane: (plane?: string, origin?: number[]) =>
          origin
            ? (new CQWorkplane(tp, plane, new tp.gp_Pnt_3(origin[0], origin[1], origin[2])) as any)
            : (new CQWorkplane(tp, plane) as any),
        vec: (x: number, y: number, z: number) => new tp.Vector(x, y, z),
      };
      this.interpreter = new TreeInterpreter(tp, cq);
      registerBuiltinOps(this.interpreter, cq);
      (this.artifacts as any).interpreter = this.interpreter;
    }
    return this.interpreter;
  }

  // pick — viewer → attribution → highlight → store.
  private async pick(faceId: number): Promise<void> {
    if (!this.store.get().runId) return;
    const { status, data } = await this.transport.select(this.store.get().runId!, { faceId });
    if (status !== 200) return;
    this.selection.set({
      featureId: data.featureId, sketchId: data.sketchId, faceId, sourceRange: data.sourceRange,
    });
    this.store.set({ selection: data.featureId });
    const feat = (this.store.get().tree?.features ?? []).find((f) => f.id === data.featureId);
    void feat;
    // Highlight the owned faces from the local artifact map when present.
    const am = (this.artifacts as any).cache?.map;
    if (am) {
      const owned = new Set<number>(am.faces.filter((f: any) => f.featureId === data.featureId).map((f: any) => f.faceId));
      this.viewer.highlight(owned);
    }
  }

  // loadRun — pull tree/mesh/artifacts/versions and display.
  async loadRun(runId: string): Promise<void> {
    this.store.set({ runId });
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
    await this.refreshVersions();
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
    const { data } = await this.transport.runVersions(this.store.get().runId);
    this.store.set({}); // panels read versions through transport; hook point
  }

}
