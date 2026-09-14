/**
 * LLM Provider interface and built-in adapters.
 *
 * The pipeline uses a uniform LLMProvider interface so the same stages work
 * with OpenAI, Anthropic, or any compatible API.
 */

import type { LLMProvider } from "./types.js";

// ---------------------------------------------------------------------------
// OpenAI adapter (GPT-4o / GPT-4o-mini)
// ---------------------------------------------------------------------------

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(opts?: { apiKey?: string; model?: string; baseUrl?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.model = opts?.model ?? "gpt-4o";
    this.baseUrl = opts?.baseUrl ?? "https://api.openai.com/v1";
    if (!this.apiKey) {
      throw new Error("OpenAI API key required. Set OPENAI_API_KEY or pass apiKey.");
    }
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    return this.chat([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${imageBase64}`, detail: "high" },
          },
        ],
      },
    ]);
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });
    return this.chat(messages);
  }

  private async chat(messages: ChatMessage[]): Promise<string> {
    const resp = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`OpenAI API error ${resp.status}: ${body}`);
    }
    const data = (await resp.json()) as ChatCompletion;
    return data.choices[0]?.message?.content ?? "";
  }
}

// ---------------------------------------------------------------------------
// Anthropic adapter (Claude)
// ---------------------------------------------------------------------------

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(opts?: { apiKey?: string; model?: string; baseUrl?: string }) {
    this.apiKey = opts?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    this.model = opts?.model ?? "claude-sonnet-4-20250514";
    this.baseUrl = opts?.baseUrl ?? "https://api.anthropic.com/v1";
    if (!this.apiKey) {
      throw new Error("Anthropic API key required. Set ANTHROPIC_API_KEY or pass apiKey.");
    }
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    return this.messages([
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: imageBase64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ]);
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
    return this.messages([{ role: "user", content }], systemPrompt);
  }

  private async messages(
    messages: AnthropicMessage[],
    system?: string,
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      messages,
    };
    if (system) {
      body.system = system;
    }
    const resp = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Anthropic API error ${resp.status}: ${text}`);
    }
    const data = (await resp.json()) as AnthropicResponse;
    const block = data.content?.[0];
    return block?.type === "text" ? block.text : "";
  }
}

// ---------------------------------------------------------------------------
// Mock provider for testing
// ---------------------------------------------------------------------------

export class MockProvider implements LLMProvider {
  readonly name = "mock";
  private responses: Map<string, string> = new Map();
  private queues: Map<string, string[]> = new Map();
  private calls: Array<{ method: string; args: unknown[] }> = [];

  /** Set the response returned by every call of this kind. */
  setResponse(key: string, value: string): void {
    this.responses.set(key, value);
  }

  /**
   * Queue a response, consumed in order before falling back to the fixed one.
   * Lets a test script a sequence of calls — a failing tree, then a repaired one.
   */
  queueResponse(key: string, value: string): void {
    const q = this.queues.get(key) ?? [];
    q.push(value);
    this.queues.set(key, q);
  }

  getCalls(): Array<{ method: string; args: unknown[] }> {
    return this.calls;
  }

  private next(key: string): string {
    const q = this.queues.get(key);
    if (q && q.length > 0) return q.shift()!;
    return this.responses.get(key) ?? "";
  }

  async analyzeImage(_imageBase64: string, prompt: string): Promise<string> {
    this.calls.push({ method: "analyzeImage", args: [prompt] });
    return this.next("analyzeImage");
  }

  async complete(prompt: string, _systemPrompt?: string): Promise<string> {
    this.calls.push({ method: "complete", args: [prompt] });
    return this.next("complete");
  }
}

// ---------------------------------------------------------------------------
// Internal types for API communication
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

interface ChatCompletion {
  choices: Array<{ message: { content: string } }>;
}

interface AnthropicContent {
  type: "text";
  text: string;
}

interface AnthropicMessage {
  role: "user";
  content: unknown[];
}

interface AnthropicResponse {
  content: AnthropicContent[];
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type LLMProviderType = "openai" | "anthropic" | "mock";

export function createLLMProvider(
  type: LLMProviderType,
  opts?: Record<string, unknown>,
): LLMProvider {
  switch (type) {
    case "openai":
      return new OpenAIProvider(opts as { apiKey?: string; model?: string; baseUrl?: string });
    case "anthropic":
      return new AnthropicProvider(opts as { apiKey?: string; model?: string; baseUrl?: string });
    case "mock":
      return new MockProvider();
    default:
      throw new Error(`Unknown LLM provider type: ${type}`);
  }
}
