import { By } from '@angular/platform-browser';
import { UiDateFieldComponent, UiSelectComponent } from '@app/ui';
import { createSurfaceHarness, SurfaceHarness } from './testing/surface-harness';

describe('E1-S3: input adapters', () => {
  let h: SurfaceHarness;
  beforeEach(() => (h = createSurfaceHarness()));

  describe('Select', () => {
    const select = {
      id: 'root',
      component: 'Select',
      label: 'Account',
      options: [
        { value: 'ACC-1', label: 'Everyday' },
        { value: 'ACC-2', label: 'Savings' },
      ],
      value: { path: '/filter/account' },
    };

    it('shows the label, wired to the field for screen readers, and the bound value', async () => {
      const el = await h.render([select], { '/filter/account': 'ACC-2' });
      const label = el.querySelector('mat-label')!;
      expect(label.textContent).toBe('Account');
      const field = el.querySelector('mat-select')!;
      expect(field.getAttribute('aria-labelledby')).toContain(label.closest('label')!.id);
      expect(field.textContent).toContain('Savings');
    });

    it('writes the choice to the bound path, then emits the action with it', async () => {
      await h.render([{ ...select, action: { event: { name: 'filterTransactions', context: { account: { path: '/filter/account' } } } } }], {
        '/filter/account': 'ACC-1',
      });
      h.fixture.debugElement.query(By.directive(UiSelectComponent)).componentInstance.valueChange.emit('ACC-2');
      await h.stable();
      expect(h.readData('/filter/account')).toBe('ACC-2');
      expect(h.actions).toEqual([expect.objectContaining({ name: 'filterTransactions', context: { account: 'ACC-2' } })]);
    });

    it('writes without an action when none is set', async () => {
      await h.render([select], { '/filter/account': 'ACC-1' });
      h.fixture.debugElement.query(By.directive(UiSelectComponent)).componentInstance.valueChange.emit('ACC-2');
      await h.stable();
      expect(h.readData('/filter/account')).toBe('ACC-2');
      expect(h.actions).toEqual([]);
    });

    it('requires label, options and value', () => {
      expect(() => h.process([{ ...select, options: [] }])).toThrow(/options/);
      const { value: _value, ...noValue } = select;
      expect(() => h.process([noValue])).toThrow(/value/);
    });
  });

  describe('DateField', () => {
    const dateField = { id: 'root', component: 'DateField', label: 'From', value: { path: '/filter/from' } };

    it('shows the label and the bound ISO date', async () => {
      const el = await h.render([{ ...dateField, min: '2026-01-01', max: '2026-12-31' }], { '/filter/from': '2026-11-02' });
      expect(el.querySelector('mat-label')?.textContent).toBe('From');
      const input = el.querySelector<HTMLInputElement>('input')!;
      expect(input.value).toBe('11/2/2026');
      expect(input.labels?.[0]?.textContent).toContain('From');
    });

    it('writes the picked date as YYYY-MM-DD, then emits the action', async () => {
      await h.render([{ ...dateField, action: { event: { name: 'filterTransactions', context: { from: { path: '/filter/from' } } } } }]);
      h.fixture.debugElement.query(By.directive(UiDateFieldComponent)).componentInstance.valueChange.emit('2026-03-05');
      await h.stable();
      expect(h.readData('/filter/from')).toBe('2026-03-05');
      expect(h.actions[0].context).toEqual({ from: '2026-03-05' });
    });

    it('the wrapper converts the picked date to an ISO date', async () => {
      await h.render([dateField]);
      const wrapper = h.fixture.debugElement.query(By.directive(UiDateFieldComponent)).componentInstance;
      const emitted: string[] = [];
      wrapper.valueChange.subscribe((v: string) => emitted.push(v));
      (wrapper as unknown as { onDate(d: Date): void }).onDate(new Date(2026, 0, 5));
      expect(emitted).toEqual(['2026-01-05']);
    });

    it('rejects min and max that are not dates', () => {
      expect(() => h.process([{ ...dateField, min: 'yesterday' }])).toThrow(/min/);
    });
  });
});
