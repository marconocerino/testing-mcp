import { InjectionToken } from '@angular/core';

/**
 * The data model every surface starts with (MVP), generated or hand-authored. Specs only bind to these paths
 * (rule 5); the agent never sends the figures. E4-S1 replaces this with data loaded from the
 * domain services (E2). All mock (rule 6).
 */
export const MOCK_DATA_MODEL = {
  user: { name: 'Jordan Doe' },
  totals: { balance: 48210.55, cash: 16306.35, invested: 31904.2, todayChange: 412.3 },
  accounts: [
    { id: 'ACC-1', name: 'Everyday', type: 'Current', balance: 4812.1, currency: 'USD' },
    { id: 'ACC-2', name: 'Savings', type: 'Savings', balance: 9650.0, currency: 'USD' },
    { id: 'ACC-3', name: 'Trading cash', type: 'Brokerage', balance: 1844.25, currency: 'USD' },
    { id: 'ACC-4', name: 'Portfolio', type: 'Investments', balance: 31904.2, currency: 'USD' },
  ],
  orders: [
    { id: 'ORD-1', placed: '2026-11-24', symbol: 'ALPN', side: 'Buy', quantity: 10, total: 1285.5, status: 'filled' },
    { id: 'ORD-2', placed: '2026-11-24', symbol: 'VELO', side: 'Sell', quantity: 5, total: 270.75, status: 'pending' },
    { id: 'ORD-3', placed: '2026-11-23', symbol: 'NRTH', side: 'Buy', quantity: 20, total: 636.0, status: 'rejected' },
    { id: 'ORD-4', placed: '2026-11-22', symbol: 'MERI', side: 'Buy', quantity: 3, total: 142.95, status: 'cancelled' },
    { id: 'ORD-5', placed: '2026-11-21', symbol: 'CRSL', side: 'Sell', quantity: 8, total: 576.16, status: 'partially filled' },
    { id: 'ORD-6', placed: '2026-11-20', symbol: 'ALPN', side: 'Buy', quantity: 2, total: 256.8, status: 'filled' },
    { id: 'ORD-7', placed: '2026-11-19', symbol: 'VELO', side: 'Buy', quantity: 12, total: 649.8, status: 'filled' },
  ],
  spending: { month: 'November', total: 2318.4, rent: 1150.0, groceries: 486.2, transport: 264.8, eatingOut: 231.4, other: 186.0 },
  ui: {},
};

/** A transaction on an account, newest first, with the balance after it. */
export interface MockTransaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  runningBalance: number;
}

const DESCRIPTIONS = ['Salary', 'Groceries', 'Rent', 'Coffee shop', 'Transfer in', 'Electricity bill', 'Restaurant', 'Train ticket', 'Online shop', 'Interest', 'Phone bill', 'Pharmacy'];

/**
 * Deterministic mock transactions: 18 per account in November 2026, newest first, with the
 * running balance worked back from the account's current balance.
 */
export function mockTransactions(accounts: { id: string; balance: number }[]): MockTransaction[] {
  const out: MockTransaction[] = [];
  accounts.forEach((account, a) => {
    let balance = account.balance;
    for (let i = 0; i < 18; i++) {
      const day = 24 - Math.floor(i * 1.3);
      const description = DESCRIPTIONS[(i * 5 + a * 3) % DESCRIPTIONS.length]!;
      const incoming = description === 'Salary' || description === 'Interest' || description === 'Transfer in';
      const amount = Math.round(((((i + 3) * (a + 7) * 37) % 9000) / 100 + 5) * (incoming ? 4 : 1) * (incoming ? 1 : -1) * 100) / 100;
      out.push({ id: `${account.id}-T${i + 1}`, accountId: account.id, date: `2026-11-${String(day).padStart(2, '0')}`, description, amount, runningBalance: Math.round(balance * 100) / 100 });
      balance -= amount;
    }
  });
  return out;
}

/** The full mock data model, with derived lists the default views bind to. */
export function mockDataModel(): Record<string, unknown> {
  const model = structuredClone(MOCK_DATA_MODEL);
  return {
    ...model,
    recentOrders: model.orders.slice(0, 5),
    transactions: mockTransactions(model.accounts),
    // Short texts the views show next to figures; data, so they live here, not in specs.
    summary: {
      asOf: 'Data as of Nov 27, 10:42',
      cashCaption: `Across ${model.accounts.length} accounts`,
      investedCaption: 'In your Portfolio account',
    },
  };
}

/** Initial data for a new surface. Tests provide their own. */
export const SURFACE_DATA = new InjectionToken<() => Record<string, unknown>>('SurfaceData', {
  factory: () => mockDataModel,
});
