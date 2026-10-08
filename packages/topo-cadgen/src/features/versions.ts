// Versions panel — the timeline (Zoo 的 HistoryView 经验: 每一次被接受的
// 变更都是一条可回看、可跳转的历史; AI/编辑对话的修改天然落版本链, 跳转
// 即"单个 undo 事件"——restore 以新版本落顶, 一步撤销可回)。Data rides
// app.store().versions, refreshed by every load/apply/undo/redo.
import type { EditorApp, Panel } from "../app.js";

export function createVersionsPanel(app: EditorApp): Panel {
  const el = document.createElement("div");

  const render = () => {
    const { versions, busy } = app.store.get();
    el.innerHTML = "";
    if (!versions || versions.length === 0) {
      el.textContent = "（尚无版本历史）";
      return;
    }
    // Newest first: the timeline reads top-down from "now".
    for (const v of [...versions].reverse()) {
      const row = document.createElement("div");
      row.className = "panel-row ver-row" + (v.current ? " ver-current" : "");
      const label = document.createElement("span");
      const changed = v.changed?.length ? ` · ${v.changed.map((c) => c.featureId).join(",")}` : "";
      const time = v.at ? new Date(v.at).toLocaleTimeString() : "";
      label.textContent = `v${v.index} ${v.verdict}${changed} ${time}${v.current ? " · 当前" : ""}`;
      const jump = document.createElement("button");
      jump.textContent = "跳转";
      jump.title = `恢复到 v${v.index}（以新版本落顶，可撤销）`;
      jump.disabled = busy || v.current;
      jump.onclick = () => void app.restoreVersion(v.index);
      row.append(label, jump);
      el.appendChild(row);
    }
    const hint = document.createElement("div");
    hint.className = "ver-hint";
    hint.textContent = "跳转 = 以该版本内容落一个新版本（历史不改写，撤销可回）";
    el.appendChild(hint);
  };

  app.store.subscribe(render);
  render();
  return {
    id: "versions",
    title: "版本历史",
    mount(host: HTMLElement) {
      host.appendChild(el);
    },
  };
}
