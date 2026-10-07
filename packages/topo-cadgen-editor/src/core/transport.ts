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

  createImageRun(image: File, partName: string) {
    const form = new FormData();
    form.append("image", image);
    form.append("partName", partName);
    return this.req("POST", "/runs", form, true);
  }

  createTextRun(prompt: string) {
    return this.req("POST", "/runs", { prompt });
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

  runVersions(runId: string) {
    return this.req("GET", `/runs/${runId}/versions`);
  }

  select(runId: string, body: Record<string, unknown>) {
    return this.req("POST", `/runs/${runId}/select`, body);
  }

  replayTree(runId: string, tree: unknown) {
    return this.req("PUT", `/runs/${runId}/tree`, tree);
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

  createSession(body: { prompt: string; runId?: string; tree?: unknown; selectedFeatureIDs?: string[]; sourceRanges?: unknown[] }) {
    return this.req("POST", "/sessions", body);
  }

  sessionMessage(sessionId: string, body: { prompt: string; selectedFeatureIDs?: string[]; sourceRanges?: unknown[] }) {
    return this.req("POST", `/sessions/${sessionId}/messages`, body);
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
