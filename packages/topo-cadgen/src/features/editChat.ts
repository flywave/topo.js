// Edit-chat panel — the prompt half of the loop: the user describes an edit
// in natural language, optionally against the current selection; the session
// pipeline (LLM structured edit → full gate chain → repair loop) runs on the
// server and the panel just narrates the SSE stream. On done the app reloads
// the run: the server's version is the editor's state.
import type { EditorApp } from "../app.js";

export function createEditChatPanel(app: EditorApp) {
  return {
    id: "editChat",
    title: "编辑对话",
    mount(el: HTMLElement) {
      el.innerHTML = "";
      const feed = document.createElement("div");
      feed.className = "chat-feed";
      const input = document.createElement("textarea");
      input.placeholder = "描述编辑，例如：把孔移到板中心 / 加一个 φ8 的边孔";
      // The image attach (迭代 23): a turn with an image rides the VISION
      // channel — "按这张草图改" is a first-class edit.
      const attach = document.createElement("button");
      attach.textContent = "📎 附图";
      attach.title = "附草图/截图 — 该回合走视觉通道";
      const file = document.createElement("input");
      file.type = "file";
      file.accept = "image/png,image/jpeg";
      file.style.display = "none";
      let imageB64 = "";
      let imageName = "";
      const mark = document.createElement("span");
      mark.className = "chat-image-mark";
      mark.style.display = "none";
      const clearImage = () => {
        imageB64 = "";
        imageName = "";
        mark.style.display = "none";
        attach.textContent = "📎 附图";
      };
      attach.onclick = () => file.click();
      file.onchange = () => {
        const f = file.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result);
          imageB64 = raw.includes("base64,") ? raw.slice(raw.indexOf("base64,") + 7) : raw;
          imageName = f.name;
          mark.textContent = `🖼 ${f.name} ✕`;
          mark.style.display = "inline";
          attach.textContent = "更换图";
        };
        reader.readAsDataURL(f);
      };
      mark.onclick = clearImage;
      const send = document.createElement("button");
      send.textContent = "发送";
      send.disabled = true;
      el.append(feed, input, el.ownerDocument!.createElement("div") /* spacer row appended below */, send);
      const row = el.lastChild as HTMLElement;
      row.className = "chat-input-row";
      row.style.cssText = "display:flex;gap:6px;align-items:center";
      row.append(attach, mark);

      const say = (kind: string, text: string) => {
        const line = document.createElement("div");
        line.className = `chat-line chat-${kind}`;
        line.textContent = text;
        feed.appendChild(line);
        feed.scrollTop = feed.scrollHeight;
      };

      const sendPrompt = async () => {
        const prompt = input.value.trim();
        if (!prompt && !imageB64) return;
        const { runId, sessionId, selection } = app.store.get();
        if (!runId) {
          say("warning", "尚未加载运行");
          return;
        }
        const shown = prompt + (imageB64 ? " 🖼" : "");
        input.value = "";
        send.disabled = true;
        say("user", shown);
        const selIDs = selection ? [selection] : [];
        try {
          const image = imageB64 || undefined;
          const { status, data } = sessionId
            ? await app.transport.sessionMessage(sessionId, { prompt, selectedFeatureIDs: selIDs, image })
            : await app.transport.createSession({
                prompt, runId,
                tree: app.store.get().tree,
                selectedFeatureIDs: selIDs,
                image,
              });
          if (status !== 200 && status !== 201) {
            say("warning", `会话创建失败 (${status}): ${JSON.stringify(data).slice(0, 200)}`);
            send.disabled = false;
            return;
          }
          const sid = data.id ?? data.sessionId;
          app.store.set({ sessionId: sid, busy: true });
          const es = app.transport.sessionEvents(sid, (type, payload) => {
            if (type === "reasoning") say("reasoning", payload?.message ?? JSON.stringify(payload).slice(0, 200));
            else if (type === "warning") say("warning", payload?.message ?? "");
            else if (type === "halted") say("warning", `修环停机: ${payload?.message ?? ""}`);
            else if (type === "done") {
              say("done", `完成 verdict=${payload?.verdict ?? "?"}`);
              es.close();
              app.store.set({ busy: false });
              void app.loadRun(runId);
              send.disabled = false;
            }
          });
        } catch (e) {
          say("warning", e instanceof Error ? e.message : String(e));
          send.disabled = false;
        } finally {
          clearImage();
        }
      };

      send.onclick = () => void sendPrompt();
      app.store.subscribe((s) => {
        send.disabled = s.busy || !s.runId;
      });
    },
  };
}
