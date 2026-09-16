/**
 * The provider's job is to turn an HTTP response into text the pipeline can
 * parse — and to fail loudly when it cannot.
 *
 * The case worth testing is a reasoning model: it returns its thinking and its
 * answer in separate fields, and when the token budget runs out mid-thought the
 * answer arrives null. That reads as an empty success, so without a specific
 * error it surfaces several stages later as "No JSON object found", blaming the
 * model's output format for what is really a token limit.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIProvider, createLLMProvider } from "../lib/llm.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function stubFetch(body: unknown, status = 200): { calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  }) as unknown as typeof fetch;
  return { calls };
}

function completion(message: Record<string, unknown>): unknown {
  return { choices: [{ finish_reason: "stop", message }] };
}

describe("OpenAI provider against a compatible gateway", () => {
  it("returns the answer when there is one", async () => {
    stubFetch(completion({ content: "hello" }));
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1", model: "m" });
    await expect(provider.complete("hi")).resolves.toBe("hello");
  });

  it("retries a thinking model that ran out mid-thought, with twice the budget", async () => {
    // Exactly what OpenCode Go's mimo-v2.5 returns with a small max_tokens: the
    // thinking ate the budget and the answer is absent. That is a budget that was
    // read as a duration rather than a shape, so asking again with a bigger one is
    // worth it — a real 4-minute run died at its last stage over this and lost
    // everything the first three stages had produced.
    let call = 0;
    const bodies: Array<Record<string, unknown>> = [];
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      call++;
      const body =
        call === 1
          ? {
              choices: [{
                finish_reason: "length",
                message: { role: "assistant", content: null, reasoning: "Let me think about this..." },
              }],
            }
          : completion({ content: '{"ok":true}' });
      return {
        ok: true,
        status: 200,
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    }) as unknown as typeof fetch;

    const notices: string[] = [];
    const provider = new OpenAIProvider({
      apiKey: "k",
      baseUrl: "https://gw/v1",
      model: "mimo-v2.5",
      maxTokens: 32,
      onLog: (m) => notices.push(m),
    });

    await expect(provider.complete("hi")).resolves.toBe('{"ok":true}');
    expect(bodies.length).toBe(2);
    expect(bodies[0].max_tokens).toBe(32);
    expect(bodies[1].max_tokens).toBe(64);
    // The wait is longer, so it is not silent.
    expect(notices.join(" ")).toMatch(/retrying with 64 tokens/);
  });

  it("gives up after one retry, and says what the budget was", async () => {
    const { calls } = stubFetch({
      choices: [{
        finish_reason: "length",
        message: { role: "assistant", content: null, reasoning: "Let me think about this..." },
      }],
    });

    const provider = new OpenAIProvider({
      apiKey: "k",
      baseUrl: "https://gw/v1",
      model: "mimo-v2.5",
      maxTokens: 32,
    });

    await expect(provider.complete("hi")).rejects.toThrow(/entire 64-token budget on reasoning/);
    await expect(provider.complete("hi")).rejects.toThrow(/raise maxTokens/);
    expect(calls.length).toBe(4);
  });

  it("accepts reasoning_content as a thinking channel too", async () => {
    stubFetch({
      choices: [{ finish_reason: "length", message: { content: "", reasoning_content: "thinking" } }],
    });
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1", maxTokens: 16 });
    await expect(provider.complete("hi")).rejects.toThrow(/spent its entire 32-token budget/);
  });

  it("reports a plain truncation as a truncation", async () => {
    stubFetch({ choices: [{ finish_reason: "length", message: { content: "" } }] });
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1", maxTokens: 16 });
    await expect(provider.complete("hi")).rejects.toThrow(/entire 32-token budget/);
  });

  it("does not retry an answer that was simply empty", async () => {
    // "No answer" and "an empty answer" need different things from the caller:
    // one wants a bigger budget, the other wants the prompt fixed. Retrying the
    // second would spend a call to learn nothing.
    const { calls } = stubFetch({ choices: [{ finish_reason: "stop", message: { content: "  " } }] });
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1", maxTokens: 16 });

    await expect(provider.complete("hi")).resolves.toBe("");
    expect(calls.length).toBe(1);
  });

  it("sends the extra headers a gateway needs, and identifies itself", async () => {
    const { calls } = stubFetch(completion({ content: "ok" }));
    const provider = new OpenAIProvider({
      apiKey: "secret",
      baseUrl: "https://opencode.ai/zen/go/v1",
      model: "mimo-v2.5",
      headers: { "x-opencode-session": "session-1" },
    });

    await provider.complete("hi");

    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe("https://opencode.ai/zen/go/v1/chat/completions");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers["x-opencode-session"]).toBe("session-1");
    expect(headers.Authorization).toBe("Bearer secret");
    // Gateways ask clients not to arrive as a generic runtime.
    expect(headers["User-Agent"]).toContain("topo-img2cad");
  });

  it("passes the configured token budget through", async () => {
    const { calls } = stubFetch(completion({ content: "ok" }));
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1", maxTokens: 32768 });
    await provider.complete("hi");
    expect(JSON.parse(String(calls[0].init.body)).max_tokens).toBe(32768);
  });

  it("surfaces a gateway error with its body", async () => {
    stubFetch({ error: { message: "MissingSessionID" } }, 400);
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1" });
    await expect(provider.complete("hi")).rejects.toThrow(/400.*MissingSessionID/s);
  });

  it("is reachable through the factory with gateway options", () => {
    const provider = createLLMProvider("openai", {
      apiKey: "k",
      baseUrl: "https://opencode.ai/zen/go/v1",
      model: "mimo-v2.5",
      maxTokens: 8192,
      headers: { "x-opencode-session": "s" },
    });
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });
});
