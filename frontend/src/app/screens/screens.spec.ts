import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideA2Ui } from '@a2ui/angular';
import { provideCopilotChatConfiguration } from '@copilotkit/angular';
import { UiDateFieldComponent } from '@app/ui';
import { App } from '../app';
import { routes, SCREENS } from '../app.routes';
import { a2uiConfig } from '../catalog/catalog';
import { provideCatalogRenderer } from '../catalog/catalog-renderer.service';
import { mockDataModel, mockTransactions, MOCK_DATA_MODEL, SURFACE_DATA } from '../data/mock-data';
import { ActionRouter, provideActionHandlers } from '../surface/action-router';
import { SurfaceSessionService } from '../surface/surface-session.service';
import { AgentTransport, provideAgentTransport } from '../transport/agent-transport';
import { TRADING_AGENT_ID } from '../transport/copilotkit-transport';
import { MockTransport } from '../transport/mock-transport';
import { provideTestCopilotKit } from '../transport/testing/test-copilotkit';
import { provideScreenActions } from './screen-actions';
import { screenMessages } from './screen-spec';

const settle = () => new Promise((r) => setTimeout(r, 0));

async function renderAt(url: string, data: () => Record<string, unknown> = mockDataModel) {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter(routes),
      provideA2Ui(a2uiConfig()),
      provideCatalogRenderer(),
      provideAgentTransport(MockTransport),
      provideTestCopilotKit(),
      provideCopilotChatConfiguration({ agentId: TRADING_AGENT_ID }),
      provideActionHandlers({ showAccount: 'agent', openOrderTicket: 'agent', filterTransactions: 'agent' }),
      provideScreenActions(),
      { provide: SURFACE_DATA, useValue: data },
    ],
  });
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  await settle();
  await fixture.whenStable();
  const main = () => fixture.nativeElement.querySelector('main') as HTMLElement;
  return { fixture, main };
}

const rows = (el: Element, tableIndex = 0) => [...el.querySelectorAll('table')[tableIndex]!.querySelectorAll('tr.mat-mdc-row')];
const cells = (row: Element) => [...row.querySelectorAll('td')].map((td) => td.textContent?.trim());
const emptyData = () => ({ ...mockDataModel(), accounts: [], orders: [], recentOrders: [], transactions: [] });

describe('E4: default view specs', () => {
  it('each is a versioned JSON spec with a title and a description, on its own surface', () => {
    expect(SCREENS.map((s) => s.id)).toEqual(['dashboard', 'accounts', 'orders']);
    for (const spec of SCREENS) {
      expect(spec.version, spec.id).toBeGreaterThanOrEqual(1);
      expect(spec.title).toBeTruthy();
      expect(spec.description.length, spec.id).toBeGreaterThan(40);
    }
  });

  it('every spec passes validation, with data and with empty data (empty states applied)', () => {
    TestBed.configureTestingModule({
      providers: [provideA2Ui(a2uiConfig()), provideCatalogRenderer(), provideAgentTransport(MockTransport), provideScreenActions(), provideRouter([])],
    });
    const session = TestBed.inject(SurfaceSessionService);
    for (const data of [mockDataModel(), emptyData()]) {
      for (const spec of SCREENS) {
        session.load(screenMessages(spec, data));
        expect(session.state(spec.id)()?.status, `${spec.id}`).toBe('ready');
      }
    }
  });

  it('contains bindings, never figures (rule 5)', () => {
    const json = JSON.stringify(SCREENS);
    for (const account of MOCK_DATA_MODEL.accounts) expect(json).not.toContain(String(account.balance));
    expect(json).not.toContain(String(MOCK_DATA_MODEL.totals.balance));
  });
});

describe('E4-S2: Dashboard', () => {
  it('shows total balance, cash and invested, the accounts and the five most recent orders with status', async () => {
    const { main } = await renderAt('/dashboard');
    const stats = [...main().querySelectorAll('.ui-stat')].map((s) =>
      [...s.querySelectorAll('.ui-stat__label, .ui-stat__value, .ui-stat__change, .ui-stat__caption')].map((x) => x.textContent?.replace(/\s+/g, ' ').trim()).join(' | '),
    );
    expect(stats).toEqual([
      'Total balance | $48,210.55 | +$412.30 today',
      'Invested | $31,904.20 | In your Portfolio account',
      'Cash | $16,306.35 | Across 4 accounts',
    ]);
    expect(main().textContent).toContain('Data as of Nov 27, 10:42');
    expect(rows(main(), 0).map(cells)[0]).toEqual(['Everyday', 'Current', '$4,812.10']);
    expect(rows(main(), 0)).toHaveLength(4);
    expect(rows(main(), 1)).toHaveLength(5);
    expect(rows(main(), 1)[0]!.querySelector('ui-badge')?.textContent?.trim()).toBe('filled');
  });

  it('updates values from the data model without reloading the view', async () => {
    const { fixture, main } = await renderAt('/dashboard');
    TestBed.inject(SurfaceSessionService).load([{ version: 'v0.9', updateDataModel: { surfaceId: 'dashboard', path: '/totals/cash', value: 20000 } }]);
    await fixture.whenStable();
    expect(main().textContent).toContain('$20,000.00');
  });

  it('shows empty states with a next step when there are no accounts or orders', async () => {
    const { fixture, main } = await renderAt('/dashboard', emptyData);
    const empties = [...main().querySelectorAll('.ui-empty-state')];
    expect(empties.map((e) => e.querySelector('p')?.textContent)).toEqual(['No accounts yet', 'No orders yet']);
    empties[0]!.querySelector('button')!.click();
    await settle();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/accounts');
  });

  it('"View all" opens the matching tab', async () => {
    const { fixture, main } = await renderAt('/dashboard');
    const viewAll = [...main().querySelectorAll('button')].filter((b) => b.textContent?.trim() === 'View all');
    expect(viewAll).toHaveLength(2);
    viewAll[1]!.click(); // the Recent orders card's link
    await settle();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/orders');
  });
});

describe('E4-S3: Accounts and transactions', () => {
  const transactions = mockTransactions(MOCK_DATA_MODEL.accounts);

  it('lists all accounts with name, type, currency and balance, and starts on the first account', async () => {
    const { main } = await renderAt('/accounts');
    expect(rows(main(), 0).map(cells)).toEqual(MOCK_DATA_MODEL.accounts.map((a) => [a.name, a.type, a.currency, expect.stringMatching(/^\$/)]));
    expect(main().textContent).toContain('Everyday: transactions');
    expect(rows(main(), 1)).toHaveLength(10); // page 1 of 18
    expect(main().querySelector('mat-paginator')).toBeTruthy();
    const first = transactions.find((t) => t.accountId === 'ACC-1')!;
    expect(cells(rows(main(), 1)[0]!)[1]).toBe(first.description);
  });

  it('picking an account shows its transactions with date, description, amount and running balance', async () => {
    const { fixture, main } = await renderAt('/accounts');
    (rows(main(), 0)[1] as HTMLElement).click();
    await settle();
    await fixture.whenStable();
    expect(main().textContent).toContain('Savings: transactions');
    expect([...main().querySelectorAll('table')[1]!.querySelectorAll('th')].map((th) => th.textContent?.trim())).toEqual(['Date', 'Description', 'Amount', 'Running balance']);
    const savings = transactions.filter((t) => t.accountId === 'ACC-2');
    expect(cells(rows(main(), 1)[0]!)[1]).toBe(savings[0]!.description);
  });

  it('filters transactions by date range with the date fields', async () => {
    const { fixture, main } = await renderAt('/accounts');
    const [from] = fixture.debugElement.queryAll(By.directive(UiDateFieldComponent));
    from!.componentInstance.valueChange.emit('2026-11-20');
    await settle();
    await fixture.whenStable();
    const expected = transactions.filter((t) => t.accountId === 'ACC-1' && t.date >= '2026-11-20');
    expect(rows(main(), 1)).toHaveLength(Math.min(10, expected.length));
    expect(expected.length).toBeLessThan(18);
  });

  it('selection and filtering are allow-listed handlers, not agent calls', async () => {
    await renderAt('/accounts');
    const send = vi.spyOn(TestBed.inject(AgentTransport), 'sendAction');
    expect(TestBed.inject(ActionRouter).allowed).toEqual(expect.arrayContaining(['selectAccount', 'applyTransactionFilter', 'goTo']));
    expect(send).not.toHaveBeenCalled();
  });

  it('keeps the selection when switching tabs and back', async () => {
    const { fixture, main } = await renderAt('/accounts');
    (rows(main(), 0)[2] as HTMLElement).click();
    await settle();
    await TestBed.inject(Router).navigateByUrl('/orders');
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/accounts');
    await fixture.whenStable();
    expect(main().textContent).toContain('Trading cash: transactions');
  });
});

describe('E4: Orders', () => {
  it('lists every order with date, symbol, side, quantity, total and status', async () => {
    const { main } = await renderAt('/orders');
    expect(rows(main())).toHaveLength(MOCK_DATA_MODEL.orders.length);
    expect(cells(rows(main())[0]!)).toEqual(['Nov 24, 2026', 'ALPN', 'Buy', '10', '$1,285.50', 'filled']);
    expect(main().textContent).toContain('Paper trading');
  });

  it('shows an empty state when there are no orders', async () => {
    const { main } = await renderAt('/orders', emptyData);
    expect(main().querySelector('.ui-empty-state')?.textContent).toContain('No orders yet');
  });
});

describe('E4: navigation actions', () => {
  it('goTo opens only known tabs', async () => {
    const { fixture } = await renderAt('/orders');
    const router = TestBed.inject(ActionRouter);
    router.dispatch({ name: 'goTo', surfaceId: 'orders', sourceComponentId: 'x', context: { to: 'https://evil.example' } });
    await settle();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/orders');
    router.dispatch({ name: 'goTo', surfaceId: 'orders', sourceComponentId: 'x', context: { to: 'dashboard' } });
    await settle();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
