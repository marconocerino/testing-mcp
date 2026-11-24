import { By } from '@angular/platform-browser';
import { UiStackComponent } from '@app/ui';
import { createSurfaceHarness, SurfaceHarness, text } from './testing/surface-harness';

describe('E1-S3: layout and text adapters', () => {
  let h: SurfaceHarness;
  beforeEach(() => (h = createSurfaceHarness()));

  describe('Column', () => {
    it('renders its children in order, stacked vertically', async () => {
      const el = await h.render([{ id: 'root', component: 'Column', children: ['a', 'b'] }, text('a', 'First'), text('b', 'Second')]);
      const stack = el.querySelector('ui-stack')!;
      expect(stack.classList).not.toContain('ui-stack--horizontal');
      expect([...stack.querySelectorAll('app-catalog-text')].map((t) => t.textContent)).toEqual(['First', 'Second']);
    });

    it('maps justify and align to the stack', async () => {
      await h.render([{ id: 'root', component: 'Column', children: ['a'], justify: 'spaceBetween', align: 'center' }, text('a', 'x')]);
      const stack = h.fixture.debugElement.query(By.directive(UiStackComponent));
      expect(stack.componentInstance.justify()).toBe('spaceBetween');
      expect(stack.componentInstance.align()).toBe('center');
      expect((stack.nativeElement as HTMLElement).style.justifyContent).toBe('space-between');
    });

    it('rejects children that do not exist', () => {
      expect(() => h.process([{ id: 'root', component: 'Column', children: ['missing'] }])).toThrow();
    });
  });

  describe('Row', () => {
    it('lays children out horizontally and applies child weight as flex-grow', async () => {
      const el = await h.render([
        { id: 'root', component: 'Row', children: ['a', 'b'] },
        { ...text('a', 'Wide'), weight: 2 },
        text('b', 'Narrow'),
      ]);
      expect(el.querySelector('ui-stack')!.classList).toContain('ui-stack--horizontal');
      const [wide, narrow] = el.querySelectorAll<HTMLElement>('app-catalog-text');
      expect(wide.style.flex).toContain('2');
      expect(narrow.style.flex).toBe('');
    });
  });

  describe('Divider', () => {
    it('is horizontal by default and vertical on request', async () => {
      const el = await h.render([
        { id: 'root', component: 'Row', children: ['h', 'v'] },
        { id: 'h', component: 'Divider' },
        { id: 'v', component: 'Divider', axis: 'vertical' },
      ]);
      const [horizontal, vertical] = el.querySelectorAll('mat-divider');
      expect(horizontal.classList).not.toContain('mat-divider-vertical');
      expect(vertical.classList).toContain('mat-divider-vertical');
    });
  });

  describe('Text', () => {
    it('renders titles and headings as heading elements, body and caption as paragraphs', async () => {
      const el = await h.render([
        { id: 'root', component: 'Column', children: ['t', 'h', 'b', 'c'] },
        text('t', 'Dashboard', 'title'),
        text('h', 'Accounts', 'heading'),
        text('b', 'Body'),
        text('c', 'Small print', 'caption'),
      ]);
      expect(el.querySelector('h2')?.textContent?.trim()).toBe('Dashboard');
      expect(el.querySelector('h3')?.textContent?.trim()).toBe('Accounts');
      expect([...el.querySelectorAll('p')].map((p) => p.textContent?.trim())).toEqual(['Body', 'Small print']);
    });

    it('shows markdown and HTML as plain text, never as markup', async () => {
      const el = await h.render([text('root', '**bold** <b>tag</b>')]);
      expect(el.querySelector('b, strong')).toBeNull();
      expect(el.querySelector('app-catalog-text')?.textContent).toContain('**bold** <b>tag</b>');
    });

    it('requires text and rejects unknown variants', () => {
      expect(() => h.process([{ id: 'root', component: 'Text' }])).toThrow(/text/);
      expect(() => h.process([text('root', 'x', 'h1')])).toThrow(/variant/);
    });
  });
});
