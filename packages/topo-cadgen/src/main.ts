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
  title.textContent = id === "params" ? "参数与特征"
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

// ---- run creation (text prompt / image upload) — the front half of both
// real-LLM flows; the run then loads through the same loadRun as ?run= ----
const createStatus = (text: string) => { statusEl.textContent = text; };
const waitRun = async (runId: string) => {
  for (let i = 0; i < 120; i++) {
    const { status, data } = await app.transport.runStatus(runId);
    if (status !== 200) throw new Error(`run status ${status}`);
    if (data.status === "done" || data.status === "failed") return data;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("run timed out");
};

const textInput = document.createElement("input");
textInput.type = "text";
textInput.placeholder = "文字创建：如 一个 120x60mm、厚 10mm 的板";
const textBtn = document.createElement("button");
textBtn.id = "textCreate";
textBtn.textContent = "文字创建";
textBtn.onclick = async () => {
  const prompt = textInput.value.trim();
  if (!prompt) return;
  textBtn.disabled = true;
  createStatus("创建文本运行 …");
  try {
    const { status, data } = await app.transport.createTextRun(prompt);
    if (status !== 200 && status !== 201) throw new Error(`create ${status}`);
    createStatus(`运行 ${data.runId} 中（真实 LLM，约 1-3 分钟）…`);
    const done = await waitRun(data.runId);
    (document.getElementById("runId") as HTMLInputElement).value = data.runId;
    await app.loadRun(data.runId);
    createStatus(`run ${data.runId} — ${done.status}/${done.verdict ?? "?"}`);
  } catch (e) {
    createStatus(`创建失败: ${e instanceof Error ? e.message : e}`);
  } finally { textBtn.disabled = false; }
};

const imgInput = document.createElement("input");
imgInput.type = "file";
imgInput.accept = "image/png,image/jpeg";
imgInput.style.display = "none";
const imgBtn = document.createElement("button");
imgBtn.textContent = "图纸创建";
imgBtn.onclick = () => imgInput.click();
imgInput.onchange = async () => {
  const file = imgInput.files?.[0];
  if (!file) return;
  imgBtn.disabled = true;
  createStatus("上传图纸 …");
  try {
    const { status, data } = await app.transport.createImageRun(file, "part");
    if (status !== 200 && status !== 201) throw new Error(`create ${status}`);
    createStatus(`运行 ${data.runId} 中（视觉模型读图，约 2-5 分钟）…`);
    const done = await waitRun(data.runId);
    (document.getElementById("runId") as HTMLInputElement).value = data.runId;
    await app.loadRun(data.runId);
    createStatus(`run ${data.runId} — ${done.status}/${done.verdict ?? "?"}`);
  } catch (e) {
    createStatus(`创建失败: ${e instanceof Error ? e.message : e}`);
  } finally { imgBtn.disabled = false; imgInput.value = ""; }
};

const header = document.querySelector("header")!;
header.append(textInput, textBtn, imgBtn, imgInput);

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
