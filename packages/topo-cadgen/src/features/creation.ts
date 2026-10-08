// creation 面板 — the UNIFIED creation entry (迭代 23 融合的前端半边): one
// card where the user types a prompt, optionally attaches a drawing, and
// hits one button. The mode adapts to what is present:
//   文字 + 图纸 → 双模态 img2cad (multipart; the words condition the stages,
//                 their stated sizes gate the build)
//   仅图纸     → img2cad
//   仅文字     → text2cad
// On done the run loads through the same loadRun as ?run= — the editor state
// IS the server state.
import type { EditorApp, Panel } from "../app.js";

export function createCreationPanel(app: EditorApp): Panel {
  const el = document.createElement("div");

  const prompt = document.createElement("textarea");
  prompt.placeholder = "描述零件，例如：一个 120x60mm、厚 10mm 的板，中间一个 Ø8 通孔";
  prompt.style.minHeight = "56px";

  const row = document.createElement("div");
  row.className = "creation-row";
  const attach = document.createElement("button");
  attach.textContent = "📎 附图纸";
  const file = document.createElement("input");
  file.type = "file";
  file.accept = "image/png,image/jpeg";
  file.style.display = "none";
  const preview = document.createElement("img");
  preview.className = "creation-preview";
  preview.style.display = "none";
  const clearImg = document.createElement("button");
  clearImg.textContent = "✕";
  clearImg.title = "移除图纸";
  clearImg.style.display = "none";
  row.append(attach, preview, clearImg);

  const create = document.createElement("button");
  create.className = "panel-action";
  create.style.width = "100%";
  const status = document.createElement("div");
  status.style.cssText = "font-size:12px;color:var(--dim,#9a9a9a);margin-top:4px";

  let image: File | null = null;

  const modeLabel = (): { label: string; cls: string } => {
    if (prompt.value.trim() && image) return { label: "图文生成（文字条件化 + 声明尺寸门禁）", cls: "creation-mode dual" };
    if (image) return { label: "图生 CAD", cls: "creation-mode" };
    return { label: "文生 CAD", cls: "creation-mode" };
  };
  const renderMode = () => {
    const m = modeLabel();
    status.textContent = m.label;
    status.className = m.cls;
    create.textContent = "创建";
  };

  const setImage = (f: File | null) => {
    image = f;
    if (f) {
      preview.src = URL.createObjectURL(f);
      preview.style.display = "block";
      clearImg.style.display = "block";
      attach.textContent = "更换图纸";
    } else {
      preview.style.display = "none";
      clearImg.style.display = "none";
      attach.textContent = "📎 附图纸";
    }
    renderMode();
  };

  attach.onclick = () => file.click();
  file.onchange = () => setImage(file.files?.[0] ?? null);
  clearImg.onclick = () => {
    file.value = "";
    setImage(null);
  };
  prompt.oninput = renderMode;

  const submit = async () => {
    const text = prompt.value.trim();
    if (!text && !image) {
      app.log("warning", "输入描述或附上图纸");
      return;
    }
    create.disabled = true;
    const m = modeLabel();
    status.textContent = `${m.label} · 运行中 …`;
    try {
      const { status: code, data } = await app.transport.createRun({
        prompt: text, image: image ?? undefined, partName: "part",
      });
      if (code !== 200 && code !== 201) {
        throw new Error(typeof data?.error === "string" ? data.error : `create ${code}`);
      }
      const runId = data.runId as string;
      app.log("done", `运行 ${runId} 已受理 (${m.label})`);
      status.textContent = `运行 ${runId} 中（真实 LLM，约 2-6 分钟）…`;
      for (let i = 0; i < 200; i++) {
        const { status: sc, data: st } = await app.transport.runStatus(runId);
        if (sc !== 200 && sc !== 502) throw new Error(`run status ${sc}`);
        if (st.status === "failed") throw new Error(st.error || "运行失败");
        if (st.status === "done") break;
        await new Promise((r) => setTimeout(r, 3000));
      }
      (app as any).lastCreatedRunId = runId;
      const setRun = (document.getElementById("runId") as HTMLInputElement);
      if (setRun) setRun.value = runId;
      await app.loadRun(runId);
      status.textContent = `run ${runId} 完成 — 已加载`;
    } catch (e) {
      status.textContent = `失败: ${e instanceof Error ? e.message : e}`;
      app.log("warning", `创建失败: ${e instanceof Error ? e.message : e}`);
    } finally {
      create.disabled = false;
      renderMode();
    }
  };
  create.onclick = () => void submit();

  return {
    id: "creation",
    title: "创建",
    mount(host: HTMLElement) {
      el.append(prompt, row, create, status);
      host.appendChild(el);
      renderMode();
    },
  };
}
