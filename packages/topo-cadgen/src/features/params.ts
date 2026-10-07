// Params panel — the structured-edit surface: the tree's parameters and the
// selected feature's op fields, edited in place. Every commit goes through
// app.applyTree (local Sketch-path preview → server replay → version), so
// what the panel offers is exactly what the pipeline can verify.
import type { EditorApp } from "../app.js";
import { applyPatch, featureById } from "../core/patch.js";
import type { Patch } from "../core/patch.js";

export function createParamsPanel(app: EditorApp) {
  return {
    id: "params",
    title: "参数与特征",
    mount(el: HTMLElement) {
      el.innerHTML = "";
      const table = document.createElement("div");
      el.appendChild(table);

      const render = () => {
        const { tree, selection, busy } = app.store.get();
        table.innerHTML = "";
        if (!tree) {
          table.textContent = "（未加载运行）";
          return;
        }

        // Parameters: name = expr (editable number/text input per row).
        if (tree.parameters.length > 0) {
          const head = document.createElement("div");
          head.textContent = "参数";
          head.className = "panel-section-title";
          table.appendChild(head);
          for (const p of tree.parameters) {
            const row = document.createElement("div");
            row.className = "panel-row";
            const label = document.createElement("label");
            label.textContent = `${p.name} ${p.unit ?? ""}=`;
            const input = document.createElement("input");
            input.value = p.expr;
            input.disabled = busy;
            input.onchange = () => {
              if (input.value === p.expr) return;
              void commit({ kind: "setParameter", name: p.name, expr: input.value });
            };
            row.append(label, input);
            table.appendChild(row);
          }
        }

        // Selected feature: its op fields, editable.
        if (selection) {
          const feat = featureById(tree, selection);
          if (feat) {
            const head = document.createElement("div");
            head.textContent = `特征 ${feat.id} (${String(feat.op.op)})`;
            head.className = "panel-section-title";
            table.appendChild(head);
            for (const [field, value] of Object.entries(feat.op)) {
              if (field === "op" || typeof value === "object") continue;
              const row = document.createElement("div");
              row.className = "panel-row";
              const label = document.createElement("label");
              label.textContent = `${field}=`;
              const input = document.createElement("input");
              input.value = String(value);
              input.disabled = busy;
              input.onchange = () => {
                if (input.value === String(value)) return;
                const parsed = Number(input.value);
                void commit({
                  kind: "setOpField", featureId: feat.id, field,
                  value: Number.isFinite(parsed) && input.value.trim() !== "" ? parsed : input.value,
                });
              };
              row.append(label, input);
              table.appendChild(row);
            }
            const remove = document.createElement("button");
            remove.textContent = "删除特征";
            remove.disabled = busy;
            remove.onclick = () => void commit({ kind: "removeFeature", featureId: feat.id });
            table.appendChild(remove);
          }
        } else {
          const hint = document.createElement("div");
          hint.textContent = "（点选面后可编辑对应特征）";
          table.appendChild(hint);
        }
      };

      const commit = async (patch: Patch) => {
        const tree = app.store.get().tree;
        if (!tree) return;
        const next = applyPatch(tree, patch);
        await app.applyTree(next);
        render();
      };

      app.store.subscribe(render);
      render();
    },
  };
}
