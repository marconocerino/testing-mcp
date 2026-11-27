import { resolve } from 'node:path';
import { loadCatalog } from './catalog.js';
import type { ChatMessage, ChatModel } from './llm.js';

/** The real catalog export from the frontend, so tests check against what the app renders. */
export const catalog = loadCatalog(resolve(import.meta.dirname, '../../../frontend/src/app/catalog/generated'));

/** A model that answers with the given texts in order, and records what it was sent. */
export function scriptedModel(...answers: (string | Error)[]): ChatModel & { calls: ChatMessage[][] } {
  const calls: ChatMessage[][] = [];
  return {
    calls,
    async complete(messages) {
      calls.push(messages);
      const next = answers.shift();
      if (next === undefined) throw new Error('scriptedModel: no more answers');
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

export const VALID_VIEW = {
  reply: 'Your recent orders.',
  components: [
    { id: 'root', component: 'Column', children: ['title', 'orders'] },
    { id: 'title', component: 'Text', text: 'Recent orders', variant: 'title' },
    { id: 'orders', component: 'Table', rows: { path: '/orders' }, columns: [{ key: 'symbol', header: 'Symbol' }, { key: 'status', header: 'Status', format: 'status' }] },
  ],
};
