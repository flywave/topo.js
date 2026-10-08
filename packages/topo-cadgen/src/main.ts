// Editor host entry: compose the app, register the builtin panels, wire the
// header controls. Run id comes from ?run= or the input box; the kernel URL
// is pinned to the copy shipped inside dist/ (build:editor copies it next to
// index.html). document.baseURI honors however the host mounted the page.
(globalThis as any).TOPO_KERNEL_URL = new URL("topo.full.js", document.baseURI).href;
import { EditorApp } from "./app.js";
import { registerBuiltinPanels } from "./features/index.js";

// One boot per page: a duplicated module evaluation would create two apps,
// and a click on one instance's button reads the OTHER instance's input
// (observed live) — silent no-op.
if ((window as any).__cadgenEditorBooted) {
  throw new Error("cadgen editor already booted on this page");
}
(window as any).__cadgenEditorBooted = true;

const viewport = document.getElementById("viewport")!;
const panelsHost = document.getElementById("panels")!;
const logEl = document.getElementById("log")!;
const statusEl = document.getElementById("status")!;

const app = new EditorApp({
  container: viewport,
  base: "",
  onLog: (kind, text) => {
    const line = document.createElement("div");
    line.className = kind;
    line.textContent = `[${kind}] ${text}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  },
});
registerBuiltinPanels(app);
(window as any).cadgenApp = app;

for (const id of app.panelIDs()) {
  const box = document.createElement("section");
  box.className = "panel";
  const title = document.createElement("h3");
  box.appendChild(title);
  const body = document.createElement("div");
  box.appendChild(body);
  panelsHost.appendChild(box);
  app.mountPanel(id, body);
  // Panels set their own section titles via .panel-section-title; derive the
  // header from the registered id.
  title.textContent = id === "creation" ? "创建（图 + 文）"
    : id === "params" ? "参数与特征"
    : id === "editChat" ? "编辑对话"
    : id === "featureTree" ? "特征树"
    : id === "properties" ? "物理属性"
    : id === "exports" ? "导出"
    : id === "assembly" ? "装配"
    : id;
}

const load = async () => {
  const runId = (document.getElementById("runId") as HTMLInputElement).value.trim()
    || new URLSearchParams(location.search).get("run") || "";
  if (!runId) return;
  statusEl.textContent = `加载 ${runId} …`;
  try {
    await app.loadRun(runId);
    statusEl.textContent = `run ${runId}`;
  } catch (e) {
    const err = e as Error;
    statusEl.textContent = `加载失败: ${err?.message ?? e}`;
    console.error("loadRun failed:", err?.stack ?? e);
    const logLine = document.createElement("div");
    logLine.textContent = err?.stack ?? String(e);
    logEl.appendChild(logLine);
  }
};

(document.getElementById("load") as HTMLButtonElement).onclick = () => void load();
(document.getElementById("undo") as HTMLButtonElement).onclick = () => void app.commands.execute("edit.undo");
(document.getElementById("redo") as HTMLButtonElement).onclick = () => void app.commands.execute("edit.redo");
app.commands.bindKeys(window);

const urlRun = new URLSearchParams(location.search).get("run");
if (urlRun) (document.getElementById("runId") as HTMLInputElement).value = urlRun;
void load().then(() => {
  // ?edge=N — deep-link an edge selection after the run loads (deterministic
  // for tests and shareable reviews).
  const edge = new URLSearchParams(location.search).get("edge");
  if (edge !== null && app.store.get().topology) {
    (app as any).pickEdge(Number(edge));
  }
});
