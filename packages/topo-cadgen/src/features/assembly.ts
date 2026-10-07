// assembly 面板 — the digital-twin scene level (第三轮服务端能力): assemble
// placed instances of runs, inspect the inventory, and flip the viewport
// between the part view and the assembly GLB.
import type { EditorApp, Panel } from "../app.js";

export function createAssemblyPanel(app: EditorApp): Panel {
  const el = document.createElement("div");
  let lastAssemblyId: string | null = null;

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
    el.innerHTML = `
      <div style="font-size:12px;color:var(--dim)">把当前运行作为实例装入装配（第二实例可给偏移）</div>
      <div style="display:flex;gap:4px;margin:6px 0">
        <input id="asmDx" type="text" placeholder="dx" style="width:52px">
        <input id="asmDy" type="text" placeholder="dy" style="width:52px">
        <input id="asmDz" type="text" placeholder="dz" style="width:52px">
        <input id="asmRot" type="text" placeholder="rotZ°" style="width:56px">
      </div>
      <div class="assembly-actions">
        <button id="asmCreate" class="panel-action">装入装配</button>
      </div>
      <div style="color:var(--dim);font-size:11px;margin-top:4px">第一件在原点；第二件按偏移/转角放置</div>`;
    (el.querySelector("#asmCreate") as HTMLButtonElement).onclick = () => void create();
  };

  const create = async () => {
    const { runId, busy } = app.store.get();
    if (!runId || busy) return;
    const num = (id: string, def = 0) => {
      const v = Number((el.querySelector("#" + id) as HTMLInputElement)?.value ?? "");
      return Number.isFinite(v) ? v : def;
    };
    const dx = num("asmDx"), dy = num("asmDy"), dz = num("asmDz"), rotZ = num("asmRot");
    const btn = el.querySelector("#asmCreate") as HTMLButtonElement;
    btn.disabled = true;
    try {
      const name = `asm_${runId}`;
      const { status, data } = await app.transport.createAssembly({
        name,
        instances: [
          { name: `${name}_a`, runId, placement: { position: [0, 0, 0] } },
          { name: `${name}_b`, runId, placement: { position: [dx, dy, dz], rotation: [0, 0, rotZ] } },
        ],
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
