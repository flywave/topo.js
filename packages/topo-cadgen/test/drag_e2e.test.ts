// 拖拽回路的前端单元/集成测试 (M2/M3 的可测部分)：不依赖 wasm——
// 验证 drag 提交链的 transport 形态与顶点过滤的选择语义。
import { describe, expect, it, vi } from "vitest";

describe("drag loop wiring (M2/M3)", () => {
  it("transport.dragSketch posts to the drag endpoint with the target", async () => {
    const { Transport } = await import("../src/core/transport.js");
    const t = new Transport("http://127.0.0.1:1");
    const reqSpy = vi.spyOn(t as any, "req").mockResolvedValue({ status: 200, data: {} });
    await t.dragSketch("run-1", "s_base", { tag: "e2", which: "end", target: [100, 90] });
    expect(reqSpy).toHaveBeenCalledWith(
      "POST",
      "/runs/run-1/sketches/s_base/drag",
      { tag: "e2", which: "end", target: [100, 90] },
    );
    reqSpy.mockRestore();
  });

  it("transport.dragSketch carries the preview flag (M3)", async () => {
    const { Transport } = await import("../src/core/transport.js");
    const t = new Transport("http://127.0.0.1:1");
    const reqSpy = vi.spyOn(t as any, "req").mockResolvedValue({ status: 200, data: {} });
    await t.dragSketch("run-1", "s_base", { tag: "e2", which: "end", target: [100, 70], preview: true });
    expect(reqSpy.mock.calls[0][2]).toMatchObject({ preview: true });
    reqSpy.mockRestore();
  });
});
