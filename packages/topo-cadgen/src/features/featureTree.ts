// Feature-tree panel — the structural twin of the viewport: every feature
// listed, click to select (highlight its owned faces) without hunting for a
// face on screen. Selection here flows the INVERSE way from a face pick:
// featureId first, geometry from the local artifact map — no server call.
import type { EditorApp } from "../app.js";
import type { ArtifactMap } from "../core/artifacts.js";

export function createFeatureTreePanel(app: EditorApp) {
  return {
    id: "featureTree",
    title: "特征树",
    mount(el: HTMLElement) {
      const list = document.createElement("div");
      el.appendChild(list);

      const ownedFaces = (map: ArtifactMap | undefined, featureId: string): Set<number> =>
        new Set((map?.faces ?? []).filter((f) => f.featureId === featureId).map((f) => f.faceId));

      const render = () => {
        const { tree, selection } = app.store.get();
        list.innerHTML = "";
        if (!tree) {
          list.textContent = "（未加载运行）";
          return;
        }
        for (const f of tree.features) {
          const row = document.createElement("div");
          row.className = "panel-row";
          row.style.cursor = "pointer";
          const selected = selection === f.id;
          if (selected) row.style.color = "#4f9cf9";
          const label = document.createElement("span");
          label.textContent = `${f.op.op}  ${f.name ? f.name + " " : ""}(${f.id})`;
          row.appendChild(label);
          row.onclick = () => {
            app.selection.set({ featureId: f.id });
            app.store.set({ selection: f.id });
            const am = (app.artifacts as any).cache?.map;
            app.viewer.highlight(ownedFaces(am, f.id));
            render();
          };
          list.appendChild(row);
        }
      };

      app.store.subscribe(render);
      render();
    },
  };
}
