// properties 面板 — the run's physical properties (第三轮服务端能力): the
// digital-twin read that makes a parameter edit's consequence immediately
// visible. Subscribes to the store; every load/apply/undo lands fresh
// numbers with no panel-level fetching.
import type { EditorApp, Panel } from "../app.js";

export function createPropertiesPanel(app: EditorApp): Panel {
  const el = document.createElement("div");
  const render = () => {
    const props = app.store.get().properties;
    if (!props) {
      el.innerHTML = `<div style="color:var(--dim);font-size:12px">加载运行后显示体积/质心等质量属性</div>`;
      return;
    }
    const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toFixed(0) : v.toFixed(2));
    el.innerHTML = `
      <div>体积 <b>${fmt(props.volume)}</b> mm³</div>
      <div>表面积 <b>${fmt(props.surfaceArea)}</b> mm²</div>
      <div>质心 <b>(${props.centreOfMass.map((v) => v.toFixed(1)).join(", ")})</b></div>
      <div style="color:var(--dim);font-size:12px;margin-top:4px">
        bbox [${props.bbox.map((v) => v.toFixed(1)).join(", ")}]
      </div>`;
  };
  return {
    id: "properties",
    title: "物理属性",
    mount(host: HTMLElement) {
      host.appendChild(el);
      render();
      app.store.select("properties", () => render());
      app.store.select("runId", () => render());
    },
  };
}

// exports 面板 — the deliverable downloads, always the CURRENT tree (the
// server rebuilds on digest change). Plain links: the browser handles the
// binary.
export function createExportsPanel(app: EditorApp): Panel {
  const el = document.createElement("div");
  const render = () => {
    const runId = app.store.get().runId;
    if (!runId) {
      el.innerHTML = `<div style="color:var(--dim);font-size:12px">加载运行后可下载交付物</div>`;
      return;
    }
    const url = (f: string) => app.transport.exportUrl(runId, f as any);
    el.innerHTML = `
      <div class="export-row">
        <a class="export-link" href="${url("step")}" download>STEP</a>
        <a class="export-link" href="${url("stl")}" download>STL</a>
        <a class="export-link" href="${url("glb")}" download>glTF</a>
      </div>
      <div style="color:var(--dim);font-size:12px;margin-top:4px">导出跟随当前树（编辑后自动重建）</div>`;
  };
  return {
    id: "exports",
    title: "导出",
    mount(host: HTMLElement) {
      host.appendChild(el);
      render();
      app.store.select("runId", () => render());
    },
  };
}
