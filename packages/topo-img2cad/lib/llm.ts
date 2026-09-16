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

export interface OpenAIProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  /**
   * Completion budget, shared with any reasoning tokens the model emits.
   *
   * A "thinking" model spends this on its reasoning first, so a budget that is
   * comfortable for a plain model can leave nothing for the answer — see the
   * null-content error below.
   */
  maxTokens?: number;
  /**
   * Extra request headers, for gateways that need their own routing fields.
   *
   * OpenCode Go, for one, requires a stable `x-opencode-session` per
   * conversation or it rejects the request outright.
   */
  headers?: Record<string, string>;
  /**
   * Per-request timeout in seconds.
   *
   * Node's fetch gives up on response headers after 300s, and a reasoning model
   * working on a 16k-character prompt with an image routinely needs longer — the
   * failure is a bare `fetch failed`, which says nothing about why. Raising this
   * is the fix; the default leaves headroom above the runtime's.
   */
  timeoutSeconds?: number;
  /** Called with retry notices, so a doubled budget is not silent. */
  onLog?: (message: string) => void;
}

const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TIMEOUT_SECONDS = 900;

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private maxTokens: number;
  private headers: Record<string, string>;
  private timeoutSeconds: number;
  private log?: (message: string) => void;

  constructor(opts?: OpenAIProviderOptions) {
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.model = opts?.model ?? "gpt-4o";
    this.baseUrl = opts?.baseUrl ?? "https://api.openai.com/v1";
    this.maxTokens = opts?.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.headers = opts?.headers ?? {};
    this.timeoutSeconds = opts?.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS;
    this.log = opts?.onLog;
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
    // A reasoning model can spend the whole budget on its thinking and return no
    // answer at all. That is not a bad request — it is a budget that was read as
    // a duration rather than a shape — and the fix is a bigger one, so the call is
    // worth retrying once rather than ending a four-minute run at its last stage.
    let budget = this.maxTokens;
    for (let attempt = 0; ; attempt++) {
      const { content, retryable } = await this.chatOnce(messages, budget);
      if (content !== null) return content;
      if (!retryable || attempt >= 1) {
        throw new Error(
          `${this.model} spent its entire ${budget}-token budget on reasoning and produced no answer, twice. ` +
            `Its thinking shares the budget with the answer — raise maxTokens well above what the answer needs, ` +
            `or use a model that does not think.`,
        );
      }
      budget *= 2;
      this.log?.(`${this.model} ran out of budget while thinking; retrying with ${budget} tokens`);
    }
  }

  private async chatOnce(
    messages: ChatMessage[],
    maxTokens: number,
  ): Promise<{ content: string | null; retryable: boolean }> {
    const resp = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        // Gateways ask clients to identify themselves rather than arrive as a
        // generic runtime; it also makes this pipeline visible in their logs.
        "User-Agent": `topo-img2cad/0.1.0`,
        ...this.headers,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(this.timeoutSeconds * 1000),
    }).catch((e: unknown) => {
      // A bare "fetch failed" from an abort hides the one thing worth knowing.
      const cause = (e as { cause?: { message?: string } })?.cause?.message;
      const detail = cause ? ` (${cause})` : "";
      throw new Error(
        `request to ${this.baseUrl} failed after up to ${this.timeoutSeconds}s${detail}. ` +
          `A reasoning model can need longer than Node's default 300s header timeout — raise timeoutSeconds.`,
      );
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`OpenAI API error ${resp.status}: ${body}`);
    }
    const data = (await resp.json()) as ChatCompletion;
    return extractContent(data, this.model, maxTokens);
  }
}

/**
 * Pull the answer out of a completion.
 *
 * A reasoning model returns its thinking in `reasoning_content` / `reasoning`
 * and the answer in `content`. When the budget runs out mid-thought, `content`
 * arrives null and the response looks like an empty success — which would
 * surface several stages later as "No JSON object found in view intake
 * response", blaming the model's output format for what is really a token
 * limit.
 *
 * `retryable` distinguishes that from an answer that was genuinely empty: the
 * first is worth asking again with a bigger budget, the second is not.
 */
function extractContent(
  data: ChatCompletion,
  model: string,
  maxTokens: number,
): { content: string | null; retryable: boolean } {
  const message = data.choices?.[0]?.message;
  const content = message?.content;
  if (typeof content === "string" && content.trim().length > 0) {
    return { content, retryable: false };
  }

  const reasoning = message?.reasoning_content ?? message?.reasoning;
  const finish = data.choices?.[0]?.finish_reason;
  if (typeof reasoning === "string" && reasoning.trim().length > 0) {
    return { content: null, retryable: true };
  }
  if (finish === "length") {
    return { content: null, retryable: true };
  }
  return { content: "", retryable: false };
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
  choices: Array<{
    finish_reason?: string;
    message: {
      content: string | null;
      /** Some OpenAI-compatible reasoning models put their thinking here. */
      reasoning?: string;
      reasoning_content?: string;
    };
  }>;
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
      // Also the path for any OpenAI-compatible gateway, including OpenCode Go
      // — pass its `x-opencode-session` through `headers`.
      return new OpenAIProvider(opts as OpenAIProviderOptions);
    case "anthropic":
      return new AnthropicProvider(opts as { apiKey?: string; model?: string; baseUrl?: string });
    case "mock":
      return new MockProvider();
    default:
      throw new Error(`Unknown LLM provider type: ${type}`);
  }
}
