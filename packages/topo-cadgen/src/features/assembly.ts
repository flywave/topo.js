// assembly 面板 — the digital-twin scene level (第三轮服务端能力): assemble
// placed instances of runs, inspect the inventory, and flip the viewport
// between the part view and the assembly GLB. Phase4: N instances (the old
// hard-coded two grew into an editable list — add/remove rows, per-instance
// position and rotation).
import type { EditorApp, Panel } from "../app.js";

interface InstanceRow {
  dx: string;
  dy: string;
  dz: string;
  rx: string;
  ry: string;
  rz: string;
}

export function createAssemblyPanel(app: EditorApp): Panel {
  const el = document.createElement("div");
  let lastAssemblyId: string | null = null;
  // The staging list: the first row sits at the origin, extra rows start one
  // part-width to +X. Values commit at 创建装配, not per keystroke — an
  // assembly is one server object.
  let rows: InstanceRow[] = [{ dx: "0", dy: "0", dz: "0", rx: "0", ry: "0", rz: "0" }];

  const render = () => {
    const { runId, assembly } = app.store.get();
    if (assembly) {
      const rows = assembly.parts
        .map(
          (p) =>
            `<tr><td>${p.name}</td><td style="text-align:right">${p.volume.toFixed(0)}</td></tr>`,
        )
        .join("");
      el.innerHTML = `
        <div>装配 <b>${assembly.name}</b> · ${assembly.parts.length} 件</div>
        <table style="width:100%;font-size:12px;margin-top:4px"><tbody>${rows}</tbody></table>
        <div class="assembly-actions">
          <button id="asmStep">装配 STEP</button>
          <button id="asmGlb">装配 glTF</button>
          <button id="asmBack">返回零件</button>
        </div>`;
      (el.querySelector("#asmStep") as HTMLButtonElement).onclick = () =>
        window.open(app.transport.assemblyExportUrl(assembly.id, "step"), "_blank");
      (el.querySelector("#asmGlb") as HTMLButtonElement).onclick = () =>
        window.open(app.transport.assemblyExportUrl(assembly.id, "glb"), "_blank");
      (el.querySelector("#asmBack") as HTMLButtonElement).onclick = () => app.showPart();
      return;
    }
    if (!runId) {
      el.innerHTML = `<div style="color:var(--dim);font-size:12px">加载运行后可将其作为实例装配</div>`;
      return;
    }
    const rowsHtml = rows
      .map(
        (r, i) => `
      <tr data-row="${i}">
        <td style="color:var(--dim)">${i === 0 ? "原点" : `#${i + 1}`}</td>
        ${(["dx", "dy", "dz", "rx", "ry", "rz"] as const)
          .map(
            (k) =>
              `<td><input data-key="${k}" type="text" value="${r[k]}" style="width:44px" title="${k}"></td>`,
          )
          .join("")}
        <td>${i > 0 ? `<button data-del="${i}" title="移除该实例" style="padding:0 6px">−</button>` : ""}</td>
      </tr>`,
      )
      .join("");
    el.innerHTML = `
      <div style="font-size:12px;color:var(--dim)">把当前运行作为实例装入装配（N 件，逐件位置/转角）</div>
      <table style="font-size:11px;margin:6px 0;border-collapse:collapse"><tbody>${rowsHtml}</tbody></table>
      <div class="assembly-actions">
        <button id="asmAdd">+ 实例</button>
        <button id="asmCreate" class="panel-action">创建装配（${rows.length} 件）</button>
      </div>
      <div style="color:var(--dim);font-size:11px;margin-top:4px">第一件在原点；位置 mm，转角 °(XYZ)</div>`;
    (el.querySelector("#asmCreate") as HTMLButtonElement).onclick = () => void create();
    (el.querySelector("#asmAdd") as HTMLButtonElement).onclick = () => {
      const n = rows.length;
      rows.push({ dx: String(n * 140), dy: "0", dz: "0", rx: "0", ry: "0", rz: "0" });
      render();
    };
    el.querySelectorAll("button[data-del]").forEach((b) => {
      (b as HTMLButtonElement).onclick = () => {
        const i = Number((b as HTMLElement).dataset.del);
        rows = rows.filter((_, k) => k !== i);
        render();
      };
    });
  };

  const create = async () => {
    const { runId, busy } = app.store.get();
    if (!runId || busy) return;
    const num = (id: string, def = 0) => {
      const v = Number((el.querySelector("#" + id) as HTMLInputElement)?.value ?? "");
      return Number.isFinite(v) ? v : def;
    };
    // read the staged rows back from the DOM (the render inputs are the
    // source of truth at click time)
    el.querySelectorAll("tr[data-row]").forEach((tr) => {
      const i = Number((tr as HTMLElement).dataset.row);
      if (!rows[i]) return;
      tr.querySelectorAll("input[data-key]").forEach((inp) => {
        const key = (inp as HTMLInputElement).dataset.key as keyof InstanceRow;
        rows[i][key] = (inp as HTMLInputElement).value;
      });
    });
    const btn = el.querySelector("#asmCreate") as HTMLButtonElement;
    btn.disabled = true;
    try {
      const name = `asm_${runId}`;
      const instances = rows.map((r, i) => ({
        name: `${name}_${i}`,
        runId,
        placement: {
          position: [num2(r.dx), num2(r.dy), num2(r.dz)],
          rotation: [num2(r.rx), num2(r.ry), num2(r.rz)],
        },
      }));
      const { status, data } = await app.transport.createAssembly({
        name,
        instances,
      });
      if (status !== 200 && status !== 201) {
        throw new Error(typeof data?.error === "string" ? data.error : `create ${status}`);
      }
      lastAssemblyId = data.assemblyId;
      app.log("done", `装配 ${data.assemblyId} 已创建 (${data.parts} 件)`);
      await app.loadAssembly(data.assemblyId);
    } catch (e) {
      app.log("warning", `装配失败: ${e instanceof Error ? e.message : e}`);
    } finally {
      btn.disabled = false;
      render();
    }
  };

  const num2 = (v: string): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    id: "assembly",
    title: "装配",
    mount(host: HTMLElement) {
      host.appendChild(el);
      render();
      app.store.select("assembly", () => render());
      app.store.select("runId", () => render());
      void lastAssemblyId;
    },
  };
}
