// Transport — the go-cadgen api.md client. The single module that knows the
// wire contract; every feature talks to resources through it.
export class Transport {
  constructor(private base = "") {}

  private async req(method: string, path: string, body?: unknown, isForm = false): Promise<{ status: number; data: any }> {
    const opts: RequestInit = { method };
    if (body !== undefined) {
      if (isForm) opts.body = body as FormData;
      else {
        opts.body = JSON.stringify(body);
        opts.headers = { "Content-Type": "application/json" };
      }
    }
    const resp = await fetch(this.base + path, opts);
    const text = await resp.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return { status: resp.status, data };
  }

  // createRun — the UNIFIED creation entry (迭代 23 双模态): a prompt with
  // an image rides multipart (双模态 img2cad — the words condition the
  // stages and their stated sizes gate the build); a prompt alone rides
  // JSON (text2cad). The server routes on Content-Type.
  createRun(opts: { prompt: string; image?: File; partName?: string }) {
    if (opts.image) {
      const form = new FormData();
      form.append("image", opts.image);
      form.append("partName", opts.partName ?? "part");
      if (opts.prompt) form.append("prompt", opts.prompt);
      return this.req("POST", "/runs", form, true);
    }
    return this.req("POST", "/runs", { prompt: opts.prompt });
  }

  createImageRun(image: File, partName: string) {
    return this.createRun({ prompt: "", image, partName });
  }

  createTextRun(prompt: string) {
    return this.createRun({ prompt });
  }

  runStatus(runId: string) {
    return this.req("GET", `/runs/${runId}`);
  }

  runTree(runId: string) {
    return this.req("GET", `/runs/${runId}/tree`);
  }

  runMesh(runId: string) {
    return this.req("GET", `/runs/${runId}/mesh`);
  }

  runArtifacts(runId: string) {
    return this.req("GET", `/runs/${runId}/artifacts`);
  }

  runTopology(runId: string) {
    return this.req("GET", `/runs/${runId}/topology`);
  }

  selectEdge(runId: string, edgeRef: unknown) {
    return this.req("POST", `/runs/${runId}/select`, { edgeRef });
  }

  runVersions(runId: string) {
    return this.req("GET", `/runs/${runId}/versions`);
  }

  select(runId: string, body: Record<string, unknown>) {
    return this.req("POST", `/runs/${runId}/select`, body);
  }

  replayTree(runId: string, tree: unknown) {
    return this.req("PUT", `/runs/${runId}/tree`, tree);
  }

  // runEdits — the patch wire form: name only what changes (the same
  // six-op vocabulary the prompt-to-edit path carries). The server applies
  // the patch and replays through the same gates; identical 200/422
  // semantics as a whole-tree PUT.
  runEdits(runId: string, patch: { edits: unknown[] }) {
    return this.req("PUT", `/runs/${runId}/edits`, patch);
  }

  undo(runId: string) {
    return this.req("POST", `/runs/${runId}/undo`);
  }

  redo(runId: string) {
    return this.req("POST", `/runs/${runId}/redo`);
  }

  feedback(runId: string, feedback: "accepted" | "rejected") {
    return this.req("POST", `/runs/${runId}/feedback`, { feedback });
  }

  createSession(body: { prompt: string; runId?: string; tree?: unknown; selectedFeatureIDs?: string[]; sourceRanges?: unknown[]; image?: string }) {
    return this.req("POST", "/sessions", body);
  }

  sessionMessage(sessionId: string, body: { prompt: string; selectedFeatureIDs?: string[]; sourceRanges?: unknown[]; image?: string }) {
    return this.req("POST", `/sessions/${sessionId}/messages`, body);
  }

  // ---- 第三轮服务端能力: 物理属性 / 导出 / 装配实例层 ----

  runProperties(runId: string) {
    return this.req("GET", `/runs/${runId}/properties`);
  }

  /** 导出下载 URL —— <a href download> 直链 (浏览器自行处理二进制)。 */
  exportUrl(runId: string, format: "step" | "stl" | "glb"): string {
    return `${this.base}/runs/${runId}/exports/${format}`;
  }

  createAssembly(body: {
    name: string;
    instances: Array<{
      name: string;
      runId?: string;
      recipe?: string;
      params?: Record<string, unknown>;
      placement?: { position: number[]; rotation?: number[] };
    }>;
  }) {
    return this.req("POST", "/assemblies", body);
  }

  assembly(id: string) {
    return this.req("GET", `/assemblies/${id}`);
  }

  assemblyExportUrl(id: string, format: "step" | "glb"): string {
    return `${this.base}/assemblies/${id}/exports/${format}`;
  }

  /** 装配 glTF 二进制 —— 视口 GLTFLoader 消费。 */
  async assemblyGLB(id: string): Promise<ArrayBuffer> {
    const resp = await fetch(this.assemblyExportUrl(id, "glb"));
    if (!resp.ok) throw new Error(`assembly glb ${resp.status}`);
    return resp.arrayBuffer();
  }

  // sessionEvents — an EventSource the caller closes when done arrives.
  sessionEvents(sessionId: string, onEvent: (type: string, data: any) => void): EventSource {
    const es = new EventSource(`${this.base}/sessions/${sessionId}/events`);
    const types = ["reasoning", "warning", "halted", "done", "refinement_round", "stage_begin", "stage_end"];
    types.forEach((t) =>
      es.addEventListener(t, (ev) => {
        try {
          onEvent(t, JSON.parse((ev as MessageEvent).data));
        } catch {
          onEvent(t, { raw: (ev as MessageEvent).data });
        }
      }),
    );
    return es;
  }
}
