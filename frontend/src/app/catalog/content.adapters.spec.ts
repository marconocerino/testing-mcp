import { createSurfaceHarness, SurfaceHarness, text } from './testing/surface-harness';

describe('E1-S3: content adapters', () => {
  let h: SurfaceHarness;
  beforeEach(() => (h = createSurfaceHarness()));

  describe('Stat', () => {
    const stat = { id: 'root', component: 'Stat', label: 'Total balance', value: { path: '/total' } };

    it('formats the bound figure and a signed change with a trend tone', async () => {
      const el = await h.render([{ ...stat, format: 'currency', change: { path: '/today' } }], { '/total': 48210.55, '/today': 412.3 });
      expect(el.querySelector('.ui-stat__label')?.textContent).toBe('Total balance');
      expect(el.querySelector('.ui-stat__value')?.textContent).toBe('$48,210.55');
      expect(el.querySelector('ui-badge')?.textContent?.trim()).toBe('+$412.30');
      expect(el.querySelector('ui-badge mat-chip')?.classList).toContain('ui-tone--success');
    });

    it('defaults to plain numbers, hides the change when absent and shows a dash for missing data', async () => {
      const el = await h.render([stat]);
      expect(el.querySelector('.ui-stat__value')?.textContent).toBe('—');
      expect(el.querySelector('ui-badge')).toBeNull();
      await h.updateData('/total', 1234.5);
      expect(el.querySelector('.ui-stat__value')?.textContent).toBe('1,234.5');
    });

    it('rejects a literal figure: values must come from the data model (rule 5)', () => {
      expect(() => h.process([{ ...stat, value: 48210.55 }])).toThrow(/value/);
      expect(() => h.process([{ id: 'root', component: 'Stat', value: { path: '/total' } }])).toThrow(/label/);
    });
  });

  describe('KeyValueList', () => {
    it('shows each label with its bound value in its format', async () => {
      const el = await h.render(
        [
          {
            id: 'root',
            component: 'KeyValueList',
            items: [
              { label: 'Estimated cost', value: { path: '/cost' }, format: 'currency' },
              { label: 'Side', value: { path: '/side' } },
            ],
          },
        ],
        { '/cost': 1284, '/side': 'Buy' },
      );
      const rows = [...el.querySelectorAll('.ui-key-value-list__row')].map((r) => [r.querySelector('dt')?.textContent, r.querySelector('dd')?.textContent]);
      expect(rows).toEqual([
        ['Estimated cost', '$1,284.00'],
        ['Side', 'Buy'],
      ]);
    });

    it('rejects literal values and more than 8 items', () => {
      expect(() => h.process([{ id: 'root', component: 'KeyValueList', items: [{ label: 'Fees', value: 1.5 }] }])).toThrow();
      const nine = Array.from({ length: 9 }, (_, i) => ({ label: `L${i}`, value: { path: `/v${i}` } }));
      expect(() => h.process([{ id: 'root', component: 'KeyValueList', items: nine }])).toThrow(/items/);
    });
  });

  describe('Table', () => {
    const columns = [
      { key: 'name', header: 'Account' },
      { key: 'balance', header: 'Balance', format: 'currency' },
      { key: 'status', header: 'Status', format: 'status' },
    ];
    const accounts = Array.from({ length: 12 }, (_, i) => ({ id: `ACC-${i + 1}`, name: `Account ${i + 1}`, balance: 1000 + i, status: i === 0 ? 'rejected' : 'filled' }));
    const table = { id: 'root', component: 'Table', rows: { path: '/accounts' }, columns };

    it('renders headers and formatted cells from bound rows, with status as a badge', async () => {
      const el = await h.render([table], { '/accounts': accounts.slice(0, 2) });
      expect([...el.querySelectorAll('th')].map((th) => th.textContent?.trim())).toEqual(['Account', 'Balance', 'Status']);
      const first = el.querySelectorAll('tr.mat-mdc-row')[0];
      expect([...first.querySelectorAll('td')].map((td) => td.textContent?.trim())).toEqual(['Account 1', '$1,000.00', 'rejected']);
      expect(first.querySelector('ui-badge mat-chip')?.classList).toContain('ui-tone--danger');
      expect(first.querySelectorAll('td')[1].classList).toContain('ui-table__end');
    });

    it('pages locally: 12 rows at pageSize 5 show 5 rows and a paginator', async () => {
      const el = await h.render([{ ...table, pageSize: 5 }], { '/accounts': accounts });
      expect(el.querySelectorAll('tr.mat-mdc-row')).toHaveLength(5);
      el.querySelector<HTMLButtonElement>('.mat-mdc-paginator-navigation-next')!.click();
      await h.stable();
      expect(el.querySelector('tr.mat-mdc-row td')?.textContent?.trim()).toBe('Account 6');
    });

    it('updates when the bound rows change', async () => {
      const el = await h.render([table], { '/accounts': accounts.slice(0, 1) });
      await h.updateData('/accounts', accounts.slice(0, 3));
      expect(el.querySelectorAll('tr.mat-mdc-row')).toHaveLength(3);
    });

    it('writes the picked row id to selection, then emits rowAction with it', async () => {
      const el = await h.render(
        [{ ...table, selection: { path: '/ui/selected' }, rowAction: { event: { name: 'openAccount', context: { accountId: { path: '/ui/selected' } } } } }],
        { '/accounts': accounts.slice(0, 3) },
      );
      const rows = el.querySelectorAll<HTMLElement>('tr.mat-mdc-row');
      expect(rows[1].getAttribute('tabindex')).toBe('0');
      rows[1].click();
      await h.stable();
      expect(h.readData('/ui/selected')).toBe('ACC-2');
      expect(h.actions).toEqual([expect.objectContaining({ name: 'openAccount', context: { accountId: 'ACC-2' } })]);

      rows[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      await h.stable();
      expect(h.actions[1].context).toEqual({ accountId: 'ACC-3' });
    });

    it('rows are not focusable or clickable without a rowAction', async () => {
      const el = await h.render([table], { '/accounts': accounts.slice(0, 2) });
      const row = el.querySelector<HTMLElement>('tr.mat-mdc-row')!;
      expect(row.hasAttribute('tabindex')).toBe(false);
      row.click();
      expect(h.actions).toEqual([]);
    });

    it('rejects literal rows (rule 5) and unknown column formats', () => {
      expect(() => h.process([{ ...table, rows: accounts }])).toThrow(/rows/);
      expect(() => h.process([{ ...table, columns: [{ key: 'x', header: 'X', format: 'html' }] }])).toThrow(/format/);
    });
  });

  describe('Badge', () => {
    it('shows the text with its tone, neutral by default', async () => {
      const el = await h.render([
        { id: 'root', component: 'Row', children: ['a', 'b'] },
        { id: 'a', component: 'Badge', text: 'Paper trading' },
        { id: 'b', component: 'Badge', text: { path: '/status' }, tone: 'warning' },
      ], { '/status': 'Pending' });
      const chips = el.querySelectorAll('mat-chip');
      expect(chips[0].textContent?.trim()).toBe('Paper trading');
      expect(chips[0].classList).toContain('ui-tone--neutral');
      expect(chips[1].textContent?.trim()).toBe('Pending');
      expect(chips[1].classList).toContain('ui-tone--warning');
    });
  });

  describe('Alert', () => {
    it('shows a message with its title; danger messages are announced as alerts', async () => {
      const el = await h.render([{ id: 'root', component: 'Alert', tone: 'danger', title: 'Order rejected', text: 'Insufficient funds.' }]);
      const box = el.querySelector('.ui-alert')!;
      expect(box.getAttribute('role')).toBe('alert');
      expect(box.textContent).toContain('Order rejected');
      expect(box.textContent).toContain('Insufficient funds.');
    });

    it('defaults to an info status message', async () => {
      const el = await h.render([{ id: 'root', component: 'Alert', text: 'Prices as of 10:42' }]);
      expect(el.querySelector('.ui-alert')?.getAttribute('role')).toBe('status');
      expect(el.querySelector('.ui-alert')?.classList).toContain('ui-tone--info');
    });

    it('shows a disclaimer from the central store, ignoring any spec text', async () => {
      const el = await h.render([{ id: 'root', component: 'Alert', disclaimerId: 'paper-trading', text: 'Guaranteed returns!' }]);
      const box = el.querySelector('.ui-alert')!;
      expect(box.getAttribute('role')).toBe('note');
      expect(box.textContent).toContain('Paper trading only');
      expect(box.textContent).not.toContain('Guaranteed');
    });

    it('rejects disclaimer ids that are not in the store', () => {
      expect(() => h.process([{ id: 'root', component: 'Alert', disclaimerId: 'made-up' }])).toThrow(/disclaimerId/);
    });
  });

  describe('EmptyState', () => {
    it('shows the title, text and one next-step button that emits the action', async () => {
      const el = await h.render([
        { id: 'root', component: 'EmptyState', title: 'No orders yet', text: 'Place your first paper trade.', actionLabel: 'New order', action: { event: { name: 'openOrderTicket' } } },
      ]);
      expect(el.querySelector('.ui-empty-state')?.textContent).toContain('No orders yet');
      const button = el.querySelector<HTMLButtonElement>('ui-empty-state button')!;
      expect(button.textContent?.trim()).toBe('New order');
      button.click();
      await h.stable();
      expect(h.actions).toEqual([expect.objectContaining({ name: 'openOrderTicket' })]);
    });

    it('shows no button without both a label and an action', async () => {
      const el = await h.render([{ id: 'root', component: 'EmptyState', title: 'No accounts', actionLabel: 'Add' }]);
      expect(el.querySelector('button')).toBeNull();
    });

    it('requires a title', () => {
      expect(() => h.process([{ id: 'root', component: 'EmptyState', text: 'x' }])).toThrow(/title/);
    });
  });

  it('a Card can hold a Column of mixed components (composition)', async () => {
    const el = await h.render(
      [
        { id: 'root', component: 'Card', child: 'col' },
        { id: 'col', component: 'Column', children: ['t', 's'] },
        text('t', 'Overview', 'heading'),
        { id: 's', component: 'Stat', label: 'Cash', value: { path: '/cash' }, format: 'currency' },
      ],
      { '/cash': 16306.35 },
    );
    expect(el.querySelector('mat-card h3')?.textContent?.trim()).toBe('Overview');
    expect(el.querySelector('mat-card .ui-stat__value')?.textContent).toBe('$16,306.35');
  });
});
