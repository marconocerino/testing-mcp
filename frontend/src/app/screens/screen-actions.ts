import { inject, Injector, Provider } from '@angular/core';
import { Router } from '@angular/router';
import { A2uiRendererService } from '@a2ui/angular';
import type { MockTransaction } from '../data/mock-data';
import { type ActionHandler, provideActionHandlerFactory } from '../surface/action-router';
import { SurfaceSessionService } from '../surface/surface-session.service';
import type { AgentAction } from '../transport/agent-transport';

/** Tabs a `goTo` action may open; anything else is ignored. */
export const NAVIGABLE_SCREENS = ['dashboard', 'accounts', 'orders', 'build'] as const;

/**
 * Client handlers for the default views (E4-S3): navigation between tabs, picking an account and
 * filtering its transactions. All allow-listed; none calls the agent or a service, and none
 * moves money. They read the surface's data model and write derived UI state under `/ui`.
 */
export function provideScreenActions(): Provider {
  return provideActionHandlerFactory(() => {
    const router = inject(Router);
    const renderer = inject(A2uiRendererService);
    // Looked up when an action runs: the session itself depends on the action router.
    const injector = inject(Injector);

    const read = (surfaceId: string, path: string) => renderer.surfaceGroup.getSurface(surfaceId)?.dataModel.get(path);
    const write = (surfaceId: string, values: Record<string, unknown>) =>
      injector.get(SurfaceSessionService).load(Object.entries(values).map(([path, value]) => ({ version: 'v0.9', updateDataModel: { surfaceId, path, value } })));

    /** Shows the picked account's transactions, within the date filter if one is set. */
    const showTransactions: ActionHandler = ({ surfaceId }: AgentAction) => {
      const accounts = (read(surfaceId, '/accounts') as { id: string; name: string }[] | undefined) ?? [];
      const picked = String(read(surfaceId, '/ui/accountId') ?? '');
      const account = accounts.find((a) => a.id === picked) ?? accounts[0];
      if (!account) return;
      const from = read(surfaceId, '/ui/filter/from') as string | undefined;
      const to = read(surfaceId, '/ui/filter/to') as string | undefined;
      const all = (read(surfaceId, '/transactions') as MockTransaction[] | undefined) ?? [];
      const transactions = all.filter((t) => t.accountId === account.id && (!from || t.date >= from) && (!to || t.date <= to));
      write(surfaceId, {
        '/ui/accountId': account.id,
        '/ui/transactionsTitle': `${account.name}: transactions`,
        '/ui/transactions': transactions,
      });
    };

    return {
      goTo: ({ context }: AgentAction) => {
        const to = context['to'];
        if ((NAVIGABLE_SCREENS as readonly unknown[]).includes(to)) void router.navigate(['/', to as string]);
      },
      selectAccount: showTransactions,
      applyTransactionFilter: showTransactions,
    };
  });
}
