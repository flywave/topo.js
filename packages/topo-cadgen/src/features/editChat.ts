// Edit-chat panel — the prompt half of the loop: the user describes an edit
// in natural language, optionally against the current selection; the session
// pipeline (LLM structured edit → full gate chain → repair loop) runs on the
// server and the panel narrates the SSE stream as STAGE CARDS (Zoo 的流式
// 经验: 事件聚合进少量可折叠卡片而非逐行刷屏 — 聚合/折叠策略在 StreamFeed).
// On done the app reloads the run: the server's version is the editor's
// state. A running turn can be cancelled (POST /sessions/:id/cancel).
import type { EditorApp } from "../app.js";
import { StreamFeed, type StreamCard } from "../core/stream.js";

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
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "■ 取消";
      cancelBtn.title = "取消正在运行的回合";
      cancelBtn.style.display = "none";
      const row = document.createElement("div");
      row.className = "chat-input-row";
      row.append(attach, mark, send, cancelBtn);
      // The selection-context chip row (Zoo: "We send selection context to
      // help"): what the next turn will carry, visible before sending.
      const ctxRow = document.createElement("div");
      ctxRow.className = "chat-ctx-row";
      ctxRow.style.display = "none";
      el.append(feed, ctxRow, input, row);

      const renderCtx = () => {
        const sel = app.selection.get();
        const { selection } = app.store.get();
        ctxRow.innerHTML = "";
        if (!sel) {
          ctxRow.style.display = "none";
          return;
        }
        ctxRow.style.display = "";
        const chip = document.createElement("span");
        chip.className = "chat-ctx-chip";
        if (sel.kind === "vertex") {
          chip.textContent = `🎯 顶点 #${sel.vertexId ?? "?"}（局部读数，不随消息发送）`;
          chip.classList.add("chat-ctx-local");
        } else if (sel.kind === "edge") {
          chip.textContent = `🎯 边 #${sel.edgeId ?? "?"} → ${selection}`;
        } else {
          chip.textContent = `🎯 面 #${sel.faceId ?? "?"} → ${selection}`;
        }
        const clear = document.createElement("button");
        clear.textContent = "✕";
        clear.title = "取消选中";
        clear.onclick = () => app.clearSelection();
        ctxRow.append(chip, clear);
      };

      // Auto-scroll etiquette (Zoo): programmatic follow ONLY while the user
      // hasn't scrolled away; scrolling back to the bottom re-arms it.
      let stick = true;
      feed.addEventListener("scroll", () => {
        stick = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 24;
      });
      const follow = () => {
        if (stick) feed.scrollTop = feed.scrollHeight;
      };

      const say = (kind: string, text: string) => {
        const line = document.createElement("div");
        line.className = `chat-line chat-${kind}`;
        line.textContent = text;
        feed.appendChild(line);
        follow();
      };

      // renderCards — the card list IS the StreamFeed; this only paints it.
      let panelNonce = 0;
      const renderCards = (sf: StreamFeed) => {
        document.getElementById(`cards-${panelNonce}`)?.remove();
        const cardsEl = document.createElement("div");
        cardsEl.id = `cards-${panelNonce}`;
        for (const card of sf.cards) {
          cardsEl.appendChild(renderCard(sf, card));
        }
        if (sf.halted) {
          const h = document.createElement("div");
          h.className = "chat-line chat-warning";
          h.textContent = `⏸ 需要人工介入: ${sf.halted}`;
          cardsEl.appendChild(h);
        }
        feed.appendChild(cardsEl);
        follow();
      };

      const renderCard = (sf: StreamFeed, card: StreamCard): HTMLElement => {
        const box = document.createElement("div");
        box.className = `stream-card stream-${card.status}`;
        const head = document.createElement("div");
        head.className = "stream-head";
        const icon = card.status === "active" ? "◐" : card.status === "warned" ? "▲" : "✓";
        head.textContent = `${icon} ${card.title}${card.lines.length ? ` (${card.lines.length})` : ""}`;
        head.onclick = () => {
          sf.toggle(card.id);
          renderCards(sf);
        };
        head.style.cursor = "pointer";
        box.appendChild(head);
        if (card.open) {
          for (const l of card.lines) {
            const ln = document.createElement("div");
            ln.className = `stream-line stream-${l.kind}`;
            ln.textContent = l.text;
            box.appendChild(ln);
          }
        }
        return box;
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
          panelNonce += 1;
          const sf = new StreamFeed();
          const es = app.transport.sessionEvents(sid, (type, payload) => {
            if (type === "done") {
              sf.ingest(type, payload);
              renderCards(sf);
              say(sf.verdict === "failed" ? "warning" : "done", `完成 verdict=${payload?.verdict ?? "?"}`);
              es.close();
              app.store.set({ busy: false });
              void app.loadRun(runId);
              send.disabled = false;
              return;
            }
            sf.ingest(type, payload);
            renderCards(sf);
          });
        } catch (e) {
          say("warning", e instanceof Error ? e.message : String(e));
          send.disabled = false;
        } finally {
          clearImage();
        }
      };

      send.onclick = () => void sendPrompt();
      // Cancel — the server unwinds the turn through ctx cancellation; the
      // stream then delivers the "cancelled" warning and settles.
      cancelBtn.onclick = () => {
        const sid = app.store.get().sessionId;
        if (!sid) return;
        void app.transport.cancelSession(sid);
        say("done", "已请求取消…");
      };
      app.store.subscribe((s) => {
        send.disabled = s.busy || !s.runId;
        cancelBtn.style.display = s.busy ? "" : "none";
      });
      app.selection.subscribe(() => renderCtx());
      renderCtx();
    },
  };
}
