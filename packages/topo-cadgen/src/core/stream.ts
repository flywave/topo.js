// StreamFeed — the SSE event stream → renderable cards. The aggregation
// layer between the wire and the panels (Zoo 的防 DOM 爆炸经验: 事件聚合成
// 少量卡片, 折叠策略在这里定, 渲染层只照单画). Pure data — no DOM — so the
// collapse/routing policy is unit-testable without a browser.
//
// Cards: one per pipeline stage (A 图纸解读 / B 轮廓提取 / C 特征树 /
// D 构建评审 / F 落盘…), reasoning/warning/rounds land as lines inside the
// active stage; a reasoning with no active stage becomes a standalone note.
// A finished stage with warnings stays open; a clean one collapses.

export interface StreamLine {
  kind: "info" | "warn" | "round";
  text: string;
}

export interface StreamCard {
  id: string;
  kind: "stage" | "note";
  /** The pipeline stage letter ("" for notes). */
  stage: string;
  title: string;
  status: "active" | "done" | "warned";
  lines: StreamLine[];
  open: boolean;
}

export const STAGE_TITLES: Record<string, string> = {
  T: "图纸预处理",
  A: "图纸解读",
  B: "轮廓提取",
  C: "特征树生成",
  D: "构建与评审",
  F: "产物落盘",
};

export class StreamFeed {
  cards: StreamCard[] = [];
  verdict: string | null = null;
  halted = "";
  private seq = 0;

  ingest(type: string, payload: any = {}): void {
    const stage = String(payload?.stage ?? "");
    const raw = payload?.message;
    const msg = typeof raw === "string" && raw ? raw : "";
    switch (type) {
      case "stage_begin": {
        if (this.activeStage(stage)) return; // a re-entered stage continues its card
        this.cards.push({
          id: `c${this.seq++}`, kind: "stage", stage,
          title: STAGE_TITLES[stage] ?? (stage ? `阶段 ${stage}` : "处理中"),
          status: "active", lines: [], open: true,
        });
        break;
      }
      case "stage_end": {
        const card = this.activeStage(stage);
        if (!card) break;
        const warned = card.lines.some((l) => l.kind === "warn");
        card.status = warned ? "warned" : "done";
        // 完成且干净 → 折叠留痕; 有警告 → 保持展开让用户看到.
        card.open = warned;
        break;
      }
      case "reasoning": {
        const text = msg || (payload?.code ? `[${payload.code}]` : "");
        if (!text) break;
        this.line({ kind: "info", text });
        break;
      }
      case "refinement_round": {
        const n = typeof payload?.round === "number" ? payload.round : 0;
        const verdict = typeof payload?.data?.verdict === "string" ? payload.data.verdict : "";
        const head = n ? `第 ${n} 轮` : "修环";
        this.line({ kind: "round", text: verdict ? `${head} · ${verdict}` : head + (msg ? ` · ${msg}` : "") });
        break;
      }
      case "warning": {
        this.line({ kind: "warn", text: msg || "警告" });
        break;
      }
      case "halted": {
        this.halted = msg;
        this.line({ kind: "warn", text: `停机: ${msg}` });
        break;
      }
      case "done": {
        this.verdict = typeof payload?.verdict === "string" ? payload.verdict : null;
        break;
      }
      default:
        break;
    }
  }

  /** toggle — the user's expand/collapse; state lives here so re-renders keep it. */
  toggle(id: string): void {
    const card = this.cards.find((c) => c.id === id);
    if (card) card.open = !card.open;
  }

  /** The newest card, for one-line progress readouts. */
  latest(): StreamCard | null {
    return this.cards.length ? this.cards[this.cards.length - 1] : null;
  }

  private line(l: StreamLine): void {
    const card = this.activeStageAny() ?? this.noteCard();
    card.lines.push(l);
    if (l.kind === "warn") card.status = card.kind === "stage" ? "warned" : card.status;
  }

  private activeStage(stage: string): StreamCard | undefined {
    return this.cards.find((c) => c.kind === "stage" && c.stage === stage && c.status === "active");
  }

  private activeStageAny(): StreamCard | undefined {
    return this.cards.find((c) => c.kind === "stage" && c.status === "active");
  }

  private noteCard(): StreamCard {
    const last = this.latest();
    if (last && last.kind === "note" && last.status === "active") return last;
    const card: StreamCard = {
      id: `c${this.seq++}`, kind: "note", stage: "", title: "思考",
      status: "active", lines: [], open: true,
    };
    this.cards.push(card);
    return card;
  }
}
