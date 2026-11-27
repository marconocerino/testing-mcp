import OpenAI from 'openai';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** The model provider is overloaded or the account's rate limit is used up (HTTP 429). */
export class ModelBusyError extends Error {}

/** The language model, behind an interface so tests use a fake. */
export interface ChatModel {
  /** Returns the model's answer as text (expected to be a JSON object). */
  complete(messages: ChatMessage[], signal?: AbortSignal): Promise<string>;
}

/** Any OpenAI-compatible endpoint; configured for Groq (decision 2026-11-25). */
export function openAiCompatibleModel(config: { baseUrl: string; model: string; apiKey: string }): ChatModel {
  const client = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey, maxRetries: 1, timeout: 60_000 });
  return {
    async complete(messages, signal) {
      const response = await client.chat.completions.create(
        {
          model: config.model,
          messages,
          temperature: 0.2,
          response_format: { type: 'json_object' },
          // gpt-oss reasons before answering; low effort keeps latency and token use down.
          reasoning_effort: 'low',
          max_completion_tokens: 3000,
        },
        { signal },
      );
      return response.choices[0]?.message?.content ?? '';
    },
  };
}

/** Wraps a model so a rate-limit response becomes {@link ModelBusyError}. */
export function withBusyDetection(model: ChatModel): ChatModel {
  return {
    async complete(messages, signal) {
      try {
        return await model.complete(messages, signal);
      } catch (e) {
        if ((e as { status?: unknown }).status === 429) throw new ModelBusyError('rate limited');
        throw e;
      }
    },
  };
}
