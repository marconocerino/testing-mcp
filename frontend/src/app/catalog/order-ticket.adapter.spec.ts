import { createSurfaceHarness, SurfaceHarness } from './testing/surface-harness';

describe('E1-S3: OrderTicket adapter (locked, pre-fill only)', () => {
  let h: SurfaceHarness;
  beforeEach(() => (h = createSurfaceHarness()));

  it('shows the pre-filled values', async () => {
    const el = await h.render([{ id: 'root', component: 'OrderTicket', instrument: 'ALPN', side: 'buy', quantity: 10, orderType: 'market' }]);
    const rows = [...el.querySelectorAll('.ui-key-value-list__row')].map((r) => r.querySelector('dd')?.textContent);
    expect(rows).toEqual(['ALPN', 'Buy', '10', 'Market']);
  });

  it('renders with nothing pre-filled', async () => {
    const el = await h.render([{ id: 'root', component: 'OrderTicket' }]);
    expect([...el.querySelectorAll('dd')].map((d) => d.textContent)).toEqual(['—', '—', '—', '—']);
  });

  it('has no control that can place an order and emits no actions', async () => {
    const el = await h.render([{ id: 'root', component: 'OrderTicket', instrument: 'ALPN' }]);
    expect(el.querySelector('button')).toBeNull();
    expect(h.actions).toEqual([]);
  });

  it('rejects anything beyond pre-fill values: actions, children and bad values', () => {
    const base = { id: 'root', component: 'OrderTicket' };
    expect(() => h.process([{ ...base, action: { event: { name: 'placeOrder' } } }])).toThrow(/action/);
    expect(() => h.process([{ ...base, child: 'x' }])).toThrow(/child/);
    expect(() => h.process([{ ...base, quantity: -5 }])).toThrow(/quantity/);
    expect(() => h.process([{ ...base, instrument: '<script>' }])).toThrow(/instrument/);
    expect(() => h.process([{ ...base, side: 'short' }])).toThrow(/side/);
  });
});
