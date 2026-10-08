// Feature-tree panel — the structural twin of the viewport (Zoo 的经验:
// 树不是手工 UI 状态, 是执行产物的投影; 选中/高亮在树与 3D 之间双向流动).
// → tree row click selects the feature and paints its owned faces;
// → a face/edge pick scrolls the tree to the owning row (Zoo 的选中滚动到
//   代码行的对应物 — 树行即"代码");
// → row hover previews the feature's faces quietly, without selecting;
// → authoritative failures (a refused edit) surface as a banner on top.
import type { EditorApp } from "../app.js";
import { ownedFaces } from "../core/artifacts.js";

const OP_LABELS: Record<string, string> = {
  pad: "拉伸", pocket: "挖槽", revolve: "旋转", sweep: "扫掠", fillet: "圆角",
  chamfer: "倒角", shell: "抽壳", hole: "孔", mirror: "镜像", pattern: "阵列",
};

export function createFeatureTreePanel(app: EditorApp) {
  return {
    id: "featureTree",
    title: "特征树",
    mount(el: HTMLElement) {
      el.innerHTML = "";
      const banner = document.createElement("div");
      banner.className = "ft-banner";
      banner.style.display = "none";
      const list = document.createElement("div");
      el.append(banner, list);

      const render = () => {
        const { tree, selection, notice, busy } = app.store.get();
        // The banner: the latest authoritative failure, dismissible.
        banner.innerHTML = "";
        banner.style.display = notice ? "" : "none";
        if (notice) {
          const text = document.createElement("span");
          text.textContent = notice.text;
          const dismiss = document.createElement("button");
          dismiss.textContent = "✕";
          dismiss.title = "关闭提示";
          dismiss.onclick = () => app.store.set({ notice: undefined });
          banner.append(text, dismiss);
          banner.className = `ft-banner ft-${notice.kind}`;
        }

        list.innerHTML = "";
        if (!tree) {
          list.textContent = "（未加载运行）";
          return;
        }
        const am = (app.artifacts as any).cache?.map;
        for (const f of tree.features) {
          const row = document.createElement("div");
          row.className = "panel-row ft-row";
          row.dataset.featureId = f.id;
          row.style.cursor = "pointer";
          const selected = selection === f.id;
          if (selected) row.classList.add("ft-selected");
          if (busy) row.style.opacity = ".6";
          const badge = document.createElement("span");
          badge.className = "ft-op-badge";
          badge.textContent = OP_LABELS[String(f.op.op)] ?? String(f.op.op);
          const label = document.createElement("span");
          const faceCount = ownedFaces(am, f.id).size;
          label.textContent = `${f.name ? f.name + " " : ""}(${f.id})${faceCount ? ` · ${faceCount}面` : ""}`;
          row.append(badge, label);
          row.onclick = () => {
            app.selection.set({ featureId: f.id });
            app.announceSelection(f.id);
            render();
          };
          // Hover preview: quiet tint of the feature's faces; leaving
          // restores the current selection's paint. Pure viewport-side —
          // no server call, no selection change.
          row.onmouseenter = () => app.previewFeature(f.id);
          row.onmouseleave = () => app.clearPreview();
          list.appendChild(row);
        }
        // 3D → tree: the selected feature's row scrolls into view (the
        // inverse leg of the face pick; Zoo scrolls the editor to the code).
        const selectedRow = list.querySelector(".ft-selected");
        selectedRow?.scrollIntoView({ block: "nearest" });
      };

      app.store.subscribe(render);
      render();
    },
  };
}
