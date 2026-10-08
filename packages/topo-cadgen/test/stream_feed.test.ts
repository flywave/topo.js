// StreamFeed — the SSE→cards aggregation policy (迭代 37). The collapse and
// routing rules are the contract the panels render against; these tests pin
// them without a browser.
import { describe, expect, it } from "vitest";
import { StreamFeed } from "../src/core/stream.js";

describe("StreamFeed", () => {
  it("one card per stage; a re-entered stage continues its card", () => {
    const sf = new StreamFeed();
    sf.ingest("stage_begin", { stage: "C" });
    sf.ingest("reasoning", { stage: "C", code: "tree_patch", message: "替换 ex1 孔径 8→10" });
    sf.ingest("stage_begin", { stage: "C" }); // replay/duplicate must not fork a card
    expect(sf.cards).toHaveLength(1);
    expect(sf.cards[0].title).toBe("特征树生成");
    expect(sf.cards[0].lines).toHaveLength(1);
  });

  it("a clean stage_end collapses the card; warnings keep it open", () => {
    const sf = new StreamFeed();
    sf.ingest("stage_begin", { stage: "C" });
    sf.ingest("stage_end", { stage: "C" });
    expect(sf.cards[0].status).toBe("done");
    expect(sf.cards[0].open).toBe(false);

    const sf2 = new StreamFeed();
    sf2.ingest("stage_begin", { stage: "D" });
    sf2.ingest("warning", { stage: "D", message: "the edited tree did not pass the gates" });
    sf2.ingest("stage_end", { stage: "D" });
    expect(sf2.cards[0].status).toBe("warned");
    expect(sf2.cards[0].open).toBe(true);
  });

  it("reasoning routes into the active stage; with none active it becomes a note", () => {
    const sf = new StreamFeed();
    sf.ingest("reasoning", { code: "route", message: "按编辑处理" });
    expect(sf.cards).toHaveLength(1);
    expect(sf.cards[0].kind).toBe("note");
    sf.ingest("stage_begin", { stage: "C" });
    sf.ingest("reasoning", { stage: "C", message: "落在活动卡里" });
    expect(sf.cards).toHaveLength(2);
    expect(sf.cards[1].lines[0].text).toBe("落在活动卡里");
  });

  it("refinement rounds land in the active card as round lines", () => {
    const sf = new StreamFeed();
    sf.ingest("stage_begin", { stage: "D" });
    sf.ingest("refinement_round", { stage: "D", round: 1, message: "silhouette 收敛", data: { verdict: "accepted" } });
    expect(sf.cards[0].lines[0]).toMatchObject({ kind: "round", text: "第 1 轮 · accepted" });
  });

  it("done/halted set the terminal fields", () => {
    const sf = new StreamFeed();
    sf.ingest("halted", { message: "plateau: 连续两轮无改进" });
    sf.ingest("done", { verdict: "pass", data: { confidence: "high" } });
    expect(sf.halted).toBe("plateau: 连续两轮无改进");
    expect(sf.verdict).toBe("pass");
  });

  it("toggle flips the card open state and survives re-renders (state lives in the feed)", () => {
    const sf = new StreamFeed();
    sf.ingest("stage_begin", { stage: "A" });
    sf.ingest("stage_end", { stage: "A" });
    const id = sf.cards[0].id;
    sf.toggle(id);
    expect(sf.cards[0].open).toBe(true);
    sf.toggle(id);
    expect(sf.cards[0].open).toBe(false);
  });

  it("the session cancel warning flows through as a warn line", () => {
    const sf = new StreamFeed();
    sf.ingest("warning", { code: "cancelled", message: "the turn was cancelled by the user" });
    expect(sf.cards[0].lines[0]).toMatchObject({ kind: "warn", text: "the turn was cancelled by the user" });
    expect(sf.cards[0].status).toBe("active"); // notes have no warned status flip
  });
});
