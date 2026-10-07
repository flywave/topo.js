// Params panel — the structured-edit surface: the tree's parameters and the
// selected feature's op fields, edited in place. Every commit goes through
// app.applyTree (local Sketch-path preview → server replay → version), so
// what the panel offers is exactly what the pipeline can verify.
import type { EditorApp } from "../app.js";
import { applyPatch, featureById } from "../core/patch.js";
import type { Patch } from "../core/patch.js";

export function createParamsPanel(app: EditorApp) {
  // wireCommit — the one commit path for every numeric field: debounced on
  // typing, immediate on Enter/blur. change-on-blur alone is unreliable
  // under headless drivers (iteration 10's lesson, applied to all fields).
  const wireCommit = (input: HTMLInputElement, initial: string, commit: () => void): void => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      if (timer) { clearTimeout(timer); timer = null; }
      if (app.store.get().busy) return;
      if (input.value === initial) return;
      commit();
    };
    input.addEventListener("input", () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, 800);
    });
    input.addEventListener("blur", run);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") run();
    });
  };
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
            // Commit on typing pause (debounced preview), Enter, or blur —
            // whichever lands first; headless drivers and fast typists both
            // get one predictable commit path.
            let timer: ReturnType<typeof setTimeout> | null = null;
            const tryCommit = () => {
              if (timer) { clearTimeout(timer); timer = null; }
              // The detach-blur of a store-driven re-render fires a second
              // tryCommit while the first commit is in flight — busy means
              // the edit is already being applied.
              if (app.store.get().busy) return;
              if (input.value === p.expr) return;
              app.log("done", `参数编辑提交: ${p.name} = ${input.value}`);
              void commit({ kind: "setParameter", name: p.name, expr: input.value });
            };
            input.addEventListener("input", () => {
              if (timer) clearTimeout(timer);
              timer = setTimeout(tryCommit, 800);
            });
            input.addEventListener("blur", tryCommit);
            input.addEventListener("keydown", (ev) => {
              if (ev.key === "Enter") tryCommit();
            });
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

            // The feature's profile sketch: numeric entity fields (circle
            // center/radius, line endpoints) — a moved sketch entity IS the
            // feature, per the digest's attribution rule.
            const sketchId = String(feat.op.sketchId ?? "");
            const sk = sketchId ? tree.sketches[sketchId] : undefined;
            if (sk) {
              const shead = document.createElement("div");
              shead.textContent = `草图 ${sketchId}`;
              shead.className = "panel-section-title";
              table.appendChild(shead);
              for (const e of sk.entities) {
                for (const field of ["center", "start", "end", "radius"]) {
                  const v = (e as Record<string, any>)[field];
                  if (v === undefined) continue;
                  if (Array.isArray(v)) {
                    v.forEach((coord, axis) => {
                      if (typeof coord !== "number") return;
                      const row = document.createElement("div");
                      row.className = "panel-row";
                      const label = document.createElement("label");
                      label.textContent = `${e.tag}.${field}[${axis}]=`;
                      const input = document.createElement("input");
                      input.value = String(coord);
                      input.disabled = busy;
                      wireCommit(input, String(coord), () => {
                        const parsed = Number(input.value);
                        if (!Number.isFinite(parsed)) return;
                        const next = [...v];
                        next[axis] = parsed;
                        void commit({ kind: "setSketchEntity", sketchId, tag: String(e.tag), field, value: next });
                      });
                      row.append(label, input);
                      table.appendChild(row);
                    });
                  } else if (typeof v === "number") {
                    const row = document.createElement("div");
                    row.className = "panel-row";
                    const label = document.createElement("label");
                    label.textContent = `${e.tag}.${field}=`;
                    const input = document.createElement("input");
                    input.value = String(v);
                    input.disabled = busy;
                    wireCommit(input, String(v), () => {
                      const parsed = Number(input.value);
                      if (!Number.isFinite(parsed)) return;
                      void commit({ kind: "setSketchEntity", sketchId, tag: String(e.tag), field, value: parsed });
                    });
                    row.append(label, input);
                    table.appendChild(row);
                  }
                }
              }
              // Constraint values: the dimension-driven edit surface — the
              // solver re-places geometry on replay, so "LENGTH e1 = 140"
              // is a valid plate-lengthening move while nudging one
              // endpoint is not.
              (sk.constraints ?? []).forEach((c, ci) => {
                const rec = c as Record<string, any>;
                if (typeof rec.value !== "number") return;
                const row = document.createElement("div");
                row.className = "panel-row";
                const label = document.createElement("label");
                label.textContent = `${rec.kind} ${rec.tags?.join("+") ?? ""}=`;
                const input = document.createElement("input");
                input.value = String(rec.value);
                input.disabled = busy;
                wireCommit(input, String(rec.value), () => {
                  const parsed = Number(input.value);
                  if (!Number.isFinite(parsed)) return;
                  void commit({ kind: "setSketchConstraint", sketchId, index: ci, value: parsed });
                });
                row.append(label, input);
                table.appendChild(row);
              });
            }
          }
        } else {
          const hint = document.createElement("div");
          hint.textContent = "（点选面后可编辑对应特征）";
          table.appendChild(hint);
        }

        // Edge selection → the fillet/chamfer authoring surface: a radius
        // input and two verbs, each committing an add-feature patch keyed by
        // the edge's stable reference.
        const sel = app.store.get().selection;
        const selObj = app.selection.get();
        if (sel && selObj?.kind === "edge" && selObj.edgeRef) {
          const head = document.createElement("div");
          head.textContent = `边 #${selObj.edgeId}（归属 ${sel}）`;
          head.className = "panel-section-title";
          table.appendChild(head);

          const row = document.createElement("div");
          row.className = "panel-row";
          const label = document.createElement("label");
          label.textContent = "半径=";
          const input = document.createElement("input");
          input.value = "2";
          input.disabled = busy;
          const mkOp = (op: "fillet" | "chamfer"): Patch => ({
            kind: "addFeature",
            feature: {
              id: `f_${op}_${selObj.edgeId}`,
              name: op === "fillet" ? "圆角" : "倒角",
              op: { op, edges: [selObj.edgeRef], ...(op === "fillet" ? { radius: input.value || "2" } : { length: input.value || "2" }) },
            } as any,
          });
          const round = document.createElement("button");
          round.textContent = "圆角";
          round.disabled = busy;
          round.onclick = () => void commit(mkOp("fillet"));
          const chamfer = document.createElement("button");
          chamfer.textContent = "倒角";
          chamfer.disabled = busy;
          chamfer.onclick = () => void commit(mkOp("chamfer"));
          row.append(label, input, round, chamfer);
          table.appendChild(row);
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
