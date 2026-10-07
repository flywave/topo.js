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
      const send = document.createElement("button");
      send.textContent = "发送";
      send.disabled = true;
      el.append(feed, input, send);

      const say = (kind: string, text: string) => {
        const line = document.createElement("div");
        line.className = `chat-line chat-${kind}`;
        line.textContent = text;
        feed.appendChild(line);
        feed.scrollTop = feed.scrollHeight;
      };

      const sendPrompt = async () => {
        const prompt = input.value.trim();
        if (!prompt) return;
        const { runId, sessionId, selection } = app.store.get();
        if (!runId) {
          say("warning", "尚未加载运行");
          return;
        }
        input.value = "";
        send.disabled = true;
        say("user", prompt);
        const selIDs = selection ? [selection] : [];
        try {
          const { status, data } = sessionId
            ? await app.transport.sessionMessage(sessionId, { prompt, selectedFeatureIDs: selIDs })
            : await app.transport.createSession({
                prompt, runId,
                tree: app.store.get().tree,
                selectedFeatureIDs: selIDs,
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
        }
      };

      send.onclick = () => void sendPrompt();
      app.store.subscribe((s) => {
        send.disabled = s.busy || !s.runId;
      });
    },
  };
}
