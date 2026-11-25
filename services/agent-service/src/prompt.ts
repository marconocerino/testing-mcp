import type { Catalog } from './catalog.js';
import { ALLOWED_ACTIONS } from './validate.js';

/** Changes whenever the prompt text changes; logged with every generated view (E5-S2). */
export const PROMPT_VERSION = '2026-11-25.1';

/**
 * What the views can bind to: the shape of the app's data model (frontend mock-data.ts until
 * E4-S1), never its values. The model never sees balances or transactions.
 */
export const DATA_PATHS = `
- /user/name: text
- /totals/balance, /totals/cash, /totals/invested, /totals/todayChange: numbers in USD (use format "currency")
- /accounts: list of { id, name, type, balance (USD), currency }
- /orders: list of { id, placed (date), symbol, side ("Buy"/"Sell"), quantity, total (USD), status }
- /spending: { month (text), total, rent, groceries, transport, eatingOut, other } (USD)
- /ui/...: free for UI state, for example the row the user picked (Table "selection": {"path": "/ui/account"})
`.trim();

const ACTION_HELP: Record<(typeof ALLOWED_ACTIONS)[number], string> = {
  showAccount: 'open one account; context { "accountId": {"path": "/ui/account"} } with a Table selection',
  openOrderTicket: 'start a new order (a "New order" button)',
  filterTransactions: 'filter a list after a Select or DateField changes',
};

const EXAMPLE = {
  reply: 'Here are your accounts with your total balance and cash on top.',
  components: [
    { id: 'root', component: 'Column', children: ['title', 'tiles', 'table'] },
    { id: 'title', component: 'Text', text: 'Your accounts', variant: 'title' },
    { id: 'tiles', component: 'Row', children: ['balance', 'cash'] },
    { id: 'balance', component: 'Stat', label: 'Total balance', value: { path: '/totals/balance' }, change: { path: '/totals/todayChange' }, format: 'currency', weight: 1 },
    { id: 'cash', component: 'Stat', label: 'Cash', value: { path: '/totals/cash' }, format: 'currency', weight: 1 },
    {
      id: 'table',
      component: 'Table',
      rows: { path: '/accounts' },
      columns: [
        { key: 'name', header: 'Account' },
        { key: 'type', header: 'Type' },
        { key: 'balance', header: 'Balance', format: 'currency' },
      ],
    },
  ],
};

/**
 * The catalog description, made shorter for the prompt: the `weight` prop is explained once
 * instead of on every component. Groq's free tier allows 8,000 tokens a minute, so every
 * token in the system prompt counts.
 */
export function compactCatalogDescription(description: string): string {
  const lines = description.split('\n').filter((line) => !line.startsWith('- `weight`'));
  return lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n\nEvery component also accepts `weight` (number): its relative width inside a Row or Column, like CSS flex-grow. Only for direct children of a Row or Column.\n';
}

/** The system prompt, assembled from the catalog export (E1-S4), not copied by hand (E5-S2). */
export function buildSystemPrompt(catalog: Catalog): string {
  return `You design screens for a trading app (paper trading, mock data). You answer every request with ONE JSON object and nothing else:

{"reply": "<one or two plain sentences for the user about the view>", "components": [<flat list of components>]}

How to build the view:
- Use only the components and props in the catalog below. One component has the id "root"; every other component appears exactly once as a child of another.
- Bind every figure to the data model with {"path": "..."}. Never write numbers, balances, prices, dates or names of accounts into the view.
- Keep it focused: what the user asked for, a title, at most about 20 components.
- If the user wants to buy or sell, add an OrderTicket with the instrument, side, quantity and order type they named. You can never place an order; the user confirms it on the ticket.
- If a request is not about accounts, orders, spending or trading, answer with an EmptyState saying what you can show.
- Do not give investment advice or recommend buying or selling.

Data you can bind to:
${DATA_PATHS}

Actions you may put on a Button, Table rowAction, Select, DateField or EmptyState (no others):
${ALLOWED_ACTIONS.map((a) => `- ${a}: ${ACTION_HELP[a]}`).join('\n')}

Example answer for "show my accounts":
${JSON.stringify(EXAMPLE)}

${compactCatalogDescription(catalog.modelDescription)}`;
}
