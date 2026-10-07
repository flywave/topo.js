// Editor host entry: compose the app, register the builtin panels, wire the
// header controls. Run id comes from ?run= or the input box; the kernel URL
// is pinned to the copy shipped inside dist/ (build:editor copies it next to
// index.html). document.baseURI honors however the host mounted the page.
(globalThis as any).TOPO_KERNEL_URL = new URL("topo.full.js", document.baseURI).href;
import { EditorApp } from "./app.js";
import { registerBuiltinPanels } from "./features/index.js";

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
  title.textContent = id === "params" ? "参数与特征"
    : id === "editChat" ? "编辑对话"
    : id === "featureTree" ? "特征树"
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
void load();
