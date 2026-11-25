import { type A2uiComponent, type A2uiMessage, viewMessages } from './a2ui.js';
import type { ChatMessage, ChatModel } from './llm.js';
import type { ValidationResult } from './validate.js';

export interface GenerateViewRequest {
  /** What the user asked for. */
  prompt: string;
  /** Earlier turns of the conversation, oldest first. */
  history?: ChatMessage[];
  /** Surface the view replaces. */
  surfaceId: string;
  /** The components currently on that surface, so follow-ups can change the view (E5-S5). */
  currentView?: A2uiComponent[];
}

export interface GenerateViewDeps {
  model: ChatModel;
  validate: (components: unknown) => ValidationResult;
  systemPrompt: string;
  catalogId: string;
  log: (event: string, data?: Record<string, unknown>) => void;
}

export interface GeneratedView {
  /** Short text for the chat. */
  reply: string;
  /** The components of the view (for follow-ups). */
  components: A2uiComponent[];
  /** A2UI messages that put the view on the surface. Always valid. */
  messages: A2uiMessage[];
  /** How the view was produced. */
  outcome: 'valid' | 'repaired' | 'fallback';
}

const FALLBACK_REPLY = "Sorry, I couldn't build that view. Try asking in a different way.";

/**
 * `generate_view` (E5-S1): asks the model for a view, validates it, and if it is invalid sends
 * the errors back once for repair (E5-S3). If the repair fails too, returns a safe fallback
 * view. Nothing invalid is ever returned.
 */
export async function generateView(request: GenerateViewRequest, deps: GenerateViewDeps, signal?: AbortSignal): Promise<GeneratedView> {
  const conversation: ChatMessage[] = [
    { role: 'system', content: deps.systemPrompt },
    ...(request.history ?? []),
    ...(request.currentView
      ? [
          {
            role: 'system' as const,
            content: `The view on screen now is:\n${JSON.stringify(request.currentView)}\nIf the user asks to change it, return the whole updated view; otherwise build a new one.`,
          },
        ]
      : []),
    { role: 'user', content: request.prompt },
  ];

  const started = Date.now();
  const first = await attempt(conversation, deps, signal);
  if (first.result.ok) {
    deps.log('view.generated', { outcome: 'valid', ms: Date.now() - started });
    return view(first.answer, 'valid', request.surfaceId, deps.catalogId);
  }

  deps.log('view.invalid', { attempt: 1, errors: first.result.errors });
  const repairStarted = Date.now();
  const second = await attempt(
    [
      ...conversation,
      { role: 'assistant', content: first.raw },
      {
        role: 'user',
        content: `That answer is not valid:\n- ${first.result.errors.slice(0, 20).join('\n- ')}\nReturn the corrected JSON object only.`,
      },
    ],
    deps,
    signal,
  );
  if (second.result.ok) {
    deps.log('view.generated', { outcome: 'repaired', ms: Date.now() - started, repairMs: Date.now() - repairStarted });
    return view(second.answer, 'repaired', request.surfaceId, deps.catalogId);
  }

  deps.log('view.fallback', { errors: second.result.errors, ms: Date.now() - started, repairMs: Date.now() - repairStarted });
  const fallback: A2uiComponent[] = [
    {
      id: 'root',
      component: 'EmptyState',
      title: "I couldn't build that view",
      text: 'Try asking for your accounts, recent orders or spending, or to prepare an order.',
    },
  ];
  return { reply: FALLBACK_REPLY, components: fallback, messages: viewMessages(request.surfaceId, deps.catalogId, fallback), outcome: 'fallback' };
}

interface Answer {
  reply: string;
  components: A2uiComponent[];
}

async function attempt(messages: ChatMessage[], deps: GenerateViewDeps, signal?: AbortSignal) {
  const raw = await deps.model.complete(messages, signal);
  const answer = parseAnswer(raw);
  const result: ValidationResult = answer
    ? deps.validate(answer.components)
    : { ok: false, errors: ['The answer must be one JSON object: {"reply": "...", "components": [...]}.'] };
  return { raw, answer: answer as Answer, result };
}

/** Reads the model's JSON, tolerating code fences or text around it. */
export function parseAnswer(raw: string): Answer | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<Answer>;
    if (!Array.isArray(parsed.components)) return null;
    return { reply: typeof parsed.reply === 'string' ? parsed.reply : '', components: parsed.components };
  } catch {
    return null;
  }
}

function view(answer: Answer, outcome: GeneratedView['outcome'], surfaceId: string, catalogId: string): GeneratedView {
  return { reply: answer.reply || 'Here is your view.', components: answer.components, messages: viewMessages(surfaceId, catalogId, answer.components), outcome };
}
