// creation 面板 — the UNIFIED creation entry (迭代 23 融合的前端半边): one
// card where the user types a prompt, optionally attaches a drawing, and
// hits one button. The mode adapts to what is present:
//   文字 + 图纸 → 双模态 img2cad (multipart; the words condition the stages,
//                 their stated sizes gate the build)
//   仅图纸     → img2cad
//   仅文字     → text2cad
// On done the run loads through the same loadRun as ?run= — the editor state
// IS the server state. Progress rides the run's SSE stream (迭代 37: stage
// readout instead of a mute wait), and a running run can be cancelled.
import type { EditorApp, Panel } from "../app.js";
import { StreamFeed } from "../core/stream.js";

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

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:6px";
  const create = document.createElement("button");
  create.className = "panel-action";
  create.style.flex = "1";
  const cancel = document.createElement("button");
  cancel.textContent = "■ 取消";
  cancel.title = "取消这次运行";
  cancel.style.display = "none";
  btnRow.append(create, cancel);
  const status = document.createElement("div");
  status.style.cssText = "font-size:12px;color:var(--dim,#9a9a9a);margin-top:4px";

  let image: File | null = null;
  let activeRunId = "";

  const modeLabel = (): { label: string; cls: string } => {
    if (prompt.value.trim() && image) return { label: "图文生成（文字条件化 + 声明尺寸门禁）", cls: "creation-mode dual" };
    if (image) return { label: "图生 CAD", cls: "creation-mode" };
    return { label: "文生 CAD", cls: "creation-mode" };
  };
  // renderMode — the idle hint. Never called while a run owns the line.
  const renderMode = () => {
    const m = modeLabel();
    status.textContent = m.label;
    status.className = m.cls;
    create.textContent = "创建";
  };
  const setStatus = (text: string) => {
    status.textContent = text;
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

  const setRunning = (running: boolean) => {
    create.disabled = running;
    prompt.disabled = running;
    attach.disabled = running;
    cancel.style.display = running ? "" : "none";
  };

  const submit = async () => {
    const text = prompt.value.trim();
    if (!text && !image) {
      app.log("warning", "输入描述或附上图纸");
      return;
    }
    const m = modeLabel();
    setRunning(true);
    setStatus(`${m.label} · 提交中 …`);
    let es: EventSource | null = null;
    let watchdog: ReturnType<typeof setInterval> | null = null;
    const cleanup = () => {
      es?.close();
      if (watchdog) clearInterval(watchdog);
      watchdog = null;
      setRunning(false);
    };
    try {
      const { status: code, data } = await app.transport.createRun({
        prompt: text, image: image ?? undefined, partName: "part",
      });
      if (code !== 200 && code !== 201) {
        throw new Error(typeof data?.error === "string" ? data.error : `create ${code}`);
      }
      activeRunId = data.runId as string;
      app.log("done", `运行 ${activeRunId} 已受理 (${m.label})`);
      setStatus(`运行 ${activeRunId} 中…`);
      // Live stage stream (迭代 37): the pipeline's own events as a stage
      // readout — 图纸解读 ✓ · 轮廓提取… · 修环 1 轮 — instead of a mute
      // wait. Terminal states confirm through runStatus (the failed shape
      // carries the error text there, not on the wire event).
      const prog = new StreamFeed();
      const renderProg = () => {
        const parts: string[] = [];
        let rounds = 0;
        for (const c of prog.cards) {
          if (c.kind !== "stage") continue;
          parts.push(`${c.title}${c.status === "active" ? "…" : c.status === "warned" ? " ▲" : " ✓"}`);
          rounds += c.lines.filter((l) => l.kind === "round").length;
        }
        if (rounds) parts.push(`修环 ${rounds} 轮`);
        setStatus(parts.length ? parts.join(" · ") : `运行 ${activeRunId} 中…`);
      };
      const settle = async (failed?: string) => {
        cleanup();
        if (failed) {
          setStatus(`失败: ${failed}`);
          app.log("warning", `创建失败: ${failed}`);
          renderMode();
          return;
        }
        (app as any).lastCreatedRunId = activeRunId;
        const setRun = (document.getElementById("runId") as HTMLInputElement);
        if (setRun) setRun.value = activeRunId;
        await app.loadRun(activeRunId);
        setStatus(`run ${activeRunId} 完成 — 已加载`);
      };
      es = app.transport.runEvents(activeRunId, (type, payload) => {
        prog.ingest(type, payload);
        renderProg();
        if (type === "warning" && payload?.message) app.log("warning", `[${activeRunId}] ${payload.message}`);
        if (type === "done") {
          void (async () => {
            const { data: st } = await app.transport.runStatus(activeRunId);
            await settle(st?.status === "failed" ? (st.error || "运行失败") : undefined);
          })();
        }
      });
      // The watchdog (5s): terminal-state safety net for paths the stream
      // may not narrate (a cancel landing between events, a dead stream).
      watchdog = setInterval(() => {
        void (async () => {
          const { status: sc, data: st } = await app.transport.runStatus(activeRunId);
          if (sc !== 200 && sc !== 502) return; // transient — the SSE stays the narrator
          if (st.status === "cancelled") {
            // A cancelled run has no tree to load — reset the card, that's all.
            cleanup();
            setStatus("已取消");
            renderMode();
          } else if (st.status === "failed") await settle(st.error || "运行失败").catch(() => renderMode());
          else if (st.status === "done") await settle().catch(() => renderMode());
        })();
      }, 5000);
    } catch (e) {
      cleanup();
      setStatus(`失败: ${e instanceof Error ? e.message : e}`);
      app.log("warning", `创建失败: ${e instanceof Error ? e.message : e}`);
      renderMode();
    }
  };
  create.onclick = () => void submit();
  cancel.onclick = () => {
    if (!activeRunId) return;
    void app.transport.cancelRun(activeRunId);
    setStatus("取消中 …");
  };

  return {
    id: "creation",
    title: "创建",
    mount(host: HTMLElement) {
      el.append(prompt, row, btnRow, status);
      host.appendChild(el);
      renderMode();
    },
  };
}
