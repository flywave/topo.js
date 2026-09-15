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

  it("names the token budget when a thinking model runs out mid-thought", async () => {
    // Exactly what OpenCode Go's mimo-v2.5 returns with a small max_tokens.
    stubFetch({
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

    await expect(provider.complete("hi")).rejects.toThrow(/only reasoning and no answer/);
    await expect(provider.complete("hi")).rejects.toThrow(/raise maxTokens/);
  });

  it("accepts reasoning_content as a thinking channel too", async () => {
    stubFetch({
      choices: [{ finish_reason: "length", message: { content: "", reasoning_content: "thinking" } }],
    });
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1" });
    await expect(provider.complete("hi")).rejects.toThrow(/only reasoning and no answer/);
  });

  it("reports a plain truncation as a truncation", async () => {
    stubFetch({ choices: [{ finish_reason: "length", message: { content: "" } }] });
    const provider = new OpenAIProvider({ apiKey: "k", baseUrl: "https://gw/v1", maxTokens: 16 });
    await expect(provider.complete("hi")).rejects.toThrow(/hit its 16-token budget/);
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
