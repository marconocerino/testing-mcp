import type { A2uiMessage } from '../agent-transport';
import accountsOverview from './accounts-overview.json';
import fallback from './fallback.json';
import invalidSpec from './invalid-spec.json';
import prepareOrder from './prepare-order.json';
import recentOrders from './recent-orders.json';
import spending from './spending.json';

/**
 * Recorded agent responses that {@link MockTransport} replays (E3-S2). Each file is what an agent
 * would stream for a prompt: a list of A2UI messages for the surface `main`, sent one by one so
 * the view builds up. Messages contain layout and bindings only; data comes from the app's data
 * model (rule 5). The one with id `fallback` answers prompts no other recording matches.
 */
export interface MockRecording {
  id: string;
  title: string;
  /** Words that select this recording, matched case-insensitively anywhere in the prompt. */
  keywords: string[];
  /** Action names this recording also answers (for example a "New order" button). */
  actions?: string[];
  messages: A2uiMessage[];
}

export const MOCK_RECORDINGS: readonly MockRecording[] = [
  accountsOverview,
  recentOrders,
  spending,
  prepareOrder,
  invalidSpec,
  fallback,
] as MockRecording[];
