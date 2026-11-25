import { randomUUID } from 'node:crypto';
import { type BaseEvent, EventType, type Message, RunAgentInputSchema } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import express, { type Express } from 'express';
import { type GenerateViewDeps, generateView } from './generate-view.js';
import { type ChatMessage, ModelBusyError } from './llm.js';

/** Name of the AG-UI custom event that carries one A2UI message to the app. */
export const A2UI_EVENT = 'a2ui.message';

export type Logger = (event: string, data?: Record<string, unknown>) => void;

/**
 * The agent's HTTP surface. Internal only (E5-S1): the CopilotKit runtime calls `POST /agent`
 * with an AG-UI `RunAgentInput` and gets an AG-UI event stream back:
 * RUN_STARTED, one CUSTOM `a2ui.message` event per A2UI message, the reply as a text message,
 * then RUN_FINISHED (or RUN_ERROR). The run id is the trace id in every log line.
 */
export function createServer(deps: Omit<GenerateViewDeps, 'log'>, log: Logger): Express {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'UP' });
  });

  app.post('/agent', async (req, res) => {
    const parsed = RunAgentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Expected an AG-UI RunAgentInput.' });
      return;
    }
    const input = parsed.data;
    const traceId = input.runId;
    const trace: Logger = (event, data) => log(event, { traceId, threadId: input.threadId, ...data });

    const encoder = new EventEncoder({ accept: req.headers.accept });
    res.status(200).set({ 'Content-Type': encoder.getContentType(), 'Cache-Control': 'no-cache', 'X-Trace-Id': traceId });
    res.flushHeaders();
    const send = (event: BaseEvent) => res.write(encoder.encode(event as never));
    const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 15_000);
    const abort = new AbortController();
    res.on('close', () => abort.abort());

    send({ type: EventType.RUN_STARTED, threadId: input.threadId, runId: input.runId } as BaseEvent);
    try {
      const request = toRequest(input.messages, input.forwardedProps);
      if (!request) throw new UserFacingError('Send a message to get a view.');
      trace('run.started', { prompt: request.prompt.slice(0, 200), surfaceId: request.surfaceId });

      const result = await generateView(request, { ...deps, log: trace }, abort.signal);
      for (const message of result.messages) {
        send({ type: EventType.CUSTOM, name: A2UI_EVENT, value: message } as BaseEvent);
      }
      const messageId = randomUUID();
      send({ type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' } as BaseEvent);
      send({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: result.reply } as BaseEvent);
      send({ type: EventType.TEXT_MESSAGE_END, messageId } as BaseEvent);
      send({ type: EventType.RUN_FINISHED, threadId: input.threadId, runId: input.runId } as BaseEvent);
      trace('run.finished', { outcome: result.outcome });
    } catch (e) {
      if (abort.signal.aborted) {
        trace('run.cancelled');
      } else {
        trace('run.failed', { error: e instanceof Error ? e.message : String(e) });
        const message =
          e instanceof UserFacingError
            ? e.message
            : e instanceof ModelBusyError
              ? 'The assistant is busy right now. Try again in a few seconds.'
              : 'The assistant ran into a problem with that request.';
        send({ type: EventType.RUN_ERROR, message } as BaseEvent);
      }
    } finally {
      clearInterval(keepAlive);
      res.end();
    }
  });

  return app;
}

class UserFacingError extends Error {}

/**
 * The request for `generate_view`: the last user message is the prompt, earlier text turns are
 * history. A user action from a generated view arrives in `forwardedProps.action` (E5-S6).
 */
export function toRequest(messages: Message[], forwardedProps: unknown) {
  const props = (forwardedProps ?? {}) as { surfaceId?: unknown; action?: { name?: unknown; context?: unknown } };
  const surfaceId = typeof props.surfaceId === 'string' ? props.surfaceId : 'main';
  const turns = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: textOf(m) }))
    .filter((m) => m.content);

  if (props.action && typeof props.action.name === 'string') {
    const prompt = `The user pressed "${props.action.name}" with ${JSON.stringify(props.action.context ?? {})}. Show the view for that.`;
    return { prompt, history: turns.slice(-8), surfaceId };
  }
  const lastUser = turns.map((t) => t.role).lastIndexOf('user');
  if (lastUser < 0) return null;
  return { prompt: turns[lastUser]!.content, history: turns.slice(Math.max(0, lastUser - 8), lastUser) as ChatMessage[], surfaceId };
}

function textOf(message: Message): string {
  const content = (message as { content?: unknown }).content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (part && typeof part === 'object' && 'text' in part ? String((part as { text: unknown }).text) : ''))
      .join('');
  }
  return '';
}
