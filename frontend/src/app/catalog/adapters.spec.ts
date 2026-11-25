import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { A2uiRendererService, provideA2Ui, SurfaceComponent } from '@a2ui/angular';
import { UiButtonComponent } from '@app/ui';
import { a2uiConfig, CATALOG_ID } from './catalog';
import { provideCatalogRenderer } from './catalog-renderer.service';

const SURFACE = 'adapter-test';

@Component({ imports: [SurfaceComponent], template: `<a2ui-v09-surface surfaceId="${SURFACE}" />` })
class SurfaceHost {}

interface DispatchedAction {
  name: string;
  sourceComponentId: string;
  context: Record<string, unknown>;
}

describe('E1-S2: component adapter pattern', () => {
  let actions: DispatchedAction[];
  let renderer: A2uiRendererService;
  let fixture: ComponentFixture<SurfaceHost>;

  beforeEach(() => {
    actions = [];
    TestBed.configureTestingModule({
      imports: [SurfaceHost],
      providers: [
        provideA2Ui({ ...a2uiConfig(), actionHandler: (a) => void actions.push(a as DispatchedAction) }),
        provideCatalogRenderer(),
      ],
    });
    renderer = TestBed.inject(A2uiRendererService);
  });

  /** Renders a surface whose root is `components[0]`, with the given data model values. */
  async function render(components: object[], data: Record<string, unknown> = {}) {
    renderer.processMessages([
      { version: 'v0.9', createSurface: { surfaceId: SURFACE, catalogId: CATALOG_ID } },
      { version: 'v0.9', updateComponents: { surfaceId: SURFACE, components } },
      ...Object.entries(data).map(([path, value]) => setData(path, value)),
    ] as never);
    fixture = TestBed.createComponent(SurfaceHost);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  function setData(path: string, value: unknown) {
    return { version: 'v0.9', updateDataModel: { surfaceId: SURFACE, path, value } };
  }

  async function updateData(path: string, value: unknown) {
    renderer.processMessages([setData(path, value)] as never);
    await fixture.whenStable();
  }

  const label = (id: string, text: unknown) => ({ id, component: 'Text', text });
  const viewAll = { event: { name: 'viewAll' } };

  describe('children (Card, the reference adapter)', () => {
    it('renders the child inside the library card content', async () => {
      const el = await render([{ id: 'root', component: 'Card', child: 'title' }, label('title', 'Accounts')]);
      expect(el.querySelector('ui-card mat-card mat-card-content app-catalog-text')?.textContent).toBe('Accounts');
    });

    it('renders a Button label inside the library button', async () => {
      const el = await render([{ id: 'root', component: 'Button', child: 'l', action: viewAll }, label('l', 'View all')]);
      expect(el.querySelector('ui-button button .mdc-button__label app-catalog-text')?.textContent).toBe('View all');
    });
  });

  describe('prop mapping', () => {
    const variantOf = (fx: ComponentFixture<unknown>) =>
      fx.debugElement.query(By.directive(UiButtonComponent)).componentInstance.variant();

    it('passes the spec variant to the @app/ui button', async () => {
      const el = await render([{ id: 'root', component: 'Button', child: 'l', variant: 'primary', action: viewAll }, label('l', 'New order')]);
      expect(variantOf(fixture)).toBe('primary');
      expect(el.querySelector('button')?.classList).toContain('mat-mdc-unelevated-button');
    });

    it('uses the default when the spec leaves a prop out', async () => {
      const el = await render([{ id: 'root', component: 'Button', child: 'l', action: viewAll }, label('l', 'View all')]);
      expect(variantOf(fixture)).toBe('default');
      expect(el.querySelector('button')?.classList).toContain('mat-mdc-outlined-button');
    });
  });

  describe('data binding', () => {
    it('shows the bound value and updates it when the data changes, without resending components', async () => {
      const el = await render(
        [{ id: 'root', component: 'Card', child: 'name' }, label('name', { path: '/account/name' })],
        { '/account/name': 'Everyday' },
      );
      expect(el.querySelector('app-catalog-text')?.textContent).toBe('Everyday');

      await updateData('/account/name', 'Savings');
      expect(el.querySelector('app-catalog-text')?.textContent).toBe('Savings');
    });
  });

  describe('action dispatch', () => {
    const orderButton = [
      {
        id: 'root',
        component: 'Button',
        child: 'l',
        action: { event: { name: 'openOrderTicket', context: { accountId: { path: '/account/id' }, side: 'buy' } } },
      },
      label('l', 'New order'),
    ];

    it('emits the action name and its payload resolved from the data model', async () => {
      const el = await render(orderButton, { '/account/id': 'ACC-1' });
      el.querySelector('button')!.click();
      await fixture.whenStable();

      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatchObject({
        name: 'openOrderTicket',
        sourceComponentId: 'root',
        context: { accountId: 'ACC-1', side: 'buy' },
      });
    });

    it('resolves the payload at click time, so it carries the latest data', async () => {
      const el = await render(orderButton, { '/account/id': 'ACC-1' });
      await updateData('/account/id', 'ACC-2');
      el.querySelector('button')!.click();
      await fixture.whenStable();

      expect(actions[0].context).toEqual({ accountId: 'ACC-2', side: 'buy' });
    });

    it('rejects a Button without an action, so every button reports through an action', async () => {
      await expect(render([{ id: 'root', component: 'Button', child: 'l' }, label('l', 'View all')])).rejects.toThrow(/action/);
      expect(actions).toEqual([]);
    });
  });
});
