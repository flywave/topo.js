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

// Toasts (Zoo 的 toast 经验): 关键事件短暂横陈视口上方, 不抢占交互, 点击
// 即散。日志浮层仍是全量流水 — toast 只是「现在就得看见」的那一小撮。
const toastHost = document.createElement("div");
toastHost.id = "toasts";
viewport.appendChild(toastHost);
const toast = (kind: string, text: string) => {
  while (toastHost.children.length >= 3) toastHost.firstChild?.remove();
  const t = document.createElement("div");
  t.className = `toast toast-${kind}`;
  t.textContent = text;
  t.title = "点击关闭";
  t.onclick = () => t.remove();
  toastHost.appendChild(t);
  setTimeout(() => t.remove(), 5000);
};

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

// Lifecycle display rule (同屏困扰修复): 创建面板只在**无运行**时显示,
// 运行面板 (特征树/参数/编辑对话/属性/导出/装配) 只在**有运行**时显示 —
// 两种输入语义不同时可见, 不再互相干扰。
const runPanels = new Set(["featureTree", "params", "editChat", "properties", "exports", "assembly", "versions"]);
const panelSections: Record<string, HTMLElement> = {};

for (const id of app.panelIDs()) {
  const box = document.createElement("section");
  box.className = "panel";
  const title = document.createElement("h3");
  box.appendChild(title);
  const body = document.createElement("div");
  box.appendChild(body);
  panelsHost.appendChild(box);
  panelSections[id] = box;
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
    : id === "versions" ? "版本历史"
    : id;
}

const applyPanelVisibility = (hasRun: boolean) => {
  for (const [id, section] of Object.entries(panelSections)) {
    const isRunPanel = runPanels.has(id);
    section.style.display = isRunPanel === hasRun ? "" : "none";
  }
};
app.store.subscribe((s) => applyPanelVisibility(Boolean(s.runId)));
applyPanelVisibility(Boolean(app.store.get().runId));

// A notice is the app-level "the user must see this" channel (a refused
// edit, a refused jump): echo it as a toast the moment it appears.
let lastNotice: string | undefined;
app.store.subscribe((s) => {
  const text = s.notice?.text;
  if (text && text !== lastNotice) toast(s.notice!.kind, text);
  lastNotice = text;
});

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
    toast("error", `加载失败: ${err?.message ?? e}`);
    const logLine = document.createElement("div");
    logLine.textContent = err?.stack ?? String(e);
    logEl.appendChild(logLine);
  }
};

// 新建 — 回到创建模式 (运行仍在服务端, runId 输入 + 加载 可随时回来)
const newBtn = document.createElement("button");
newBtn.textContent = "新建";
newBtn.title = "回到创建模式，开始一个新的图/文运行";
newBtn.onclick = () => {
  (document.getElementById("runId") as HTMLInputElement).value = "";
  app.store.set({ runId: null, sessionId: null, selection: null, properties: undefined, assembly: undefined });
  app.showPart();
  statusEl.textContent = "新建：输入描述或附上图纸";
};
(document.getElementById("undo") as HTMLButtonElement).before(newBtn);

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
