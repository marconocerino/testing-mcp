import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideA2Ui } from '@a2ui/angular';
import { a2uiConfig, CATALOG_ID } from '../catalog/catalog';
import { provideCatalogRenderer } from '../catalog/catalog-renderer.service';
import { SURFACE_DATA } from '../data/mock-data';
import { A2uiMessage, AgentTransport, provideAgentTransport } from '../transport/agent-transport';
import { MOCK_TRANSPORT_OPTIONS, MockTransport } from '../transport/mock-transport';
import { ActionRouter, provideActionHandlers } from './action-router';
import { SurfaceHostComponent } from './surface-host.component';
import { SurfaceSessionService } from './surface-session.service';

@Component({
  imports: [SurfaceHostComponent],
  template: `
    <app-surface-host surfaceId="main" label="the main view"><p class="empty">Nothing yet</p></app-surface-host>
    <app-surface-host surfaceId="side" label="the side widget" />
  `,
})
class TwoHosts {}

const create = (surfaceId: string): A2uiMessage => ({ version: 'v0.9', createSurface: { surfaceId, catalogId: CATALOG_ID } });
const components = (surfaceId: string, ...c: object[]): A2uiMessage => ({ version: 'v0.9', updateComponents: { surfaceId, components: c } });
const data = (surfaceId: string, path: string, value: unknown): A2uiMessage => ({ version: 'v0.9', updateDataModel: { surfaceId, path, value } });
const text = (id: string, t: unknown) => ({ id, component: 'Text', text: t });

describe('E3-S4: surface host and action router', () => {
  let session: SurfaceSessionService;
  let errors: ReturnType<typeof vi.spyOn>;
  let warnings: ReturnType<typeof vi.spyOn>;
  const handled: string[] = [];

  beforeEach(() => {
    handled.length = 0;
    errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    warnings = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.configureTestingModule({
      imports: [TwoHosts],
      providers: [
        provideA2Ui(a2uiConfig()),
        provideCatalogRenderer(),
        provideAgentTransport(MockTransport),
        { provide: MOCK_TRANSPORT_OPTIONS, useValue: { delayMs: 0 } },
        { provide: SURFACE_DATA, useValue: () => ({ account: { name: 'Everyday' }, ui: {} }) },
        provideActionHandlers({ viewAll: (a) => void handled.push(`viewAll:${JSON.stringify(a.context)}`), askAgent: 'agent' }),
      ],
    });
    session = TestBed.inject(SurfaceSessionService);
  });

  afterEach(() => {
    errors.mockRestore();
    warnings.mockRestore();
  });

  async function render() {
    const fixture = TestBed.createComponent(TwoHosts);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const host = (id: 'main' | 'side') => el.querySelectorAll('app-surface-host')[id === 'main' ? 0 : 1] as HTMLElement;
    return { fixture, host };
  }

  describe('validation before rendering', () => {
    it('shows the projected empty state when there is no surface', async () => {
      const { host } = await render();
      expect(host('main').querySelector('.empty')?.textContent).toBe('Nothing yet');
    });

    it('renders a valid spec, with data from the app data model', async () => {
      const { fixture, host } = await render();
      session.load([create('main'), components('main', text('root', { path: '/account/name' }))]);
      await fixture.whenStable();
      expect(host('main').querySelector('a2ui-v09-surface')?.textContent).toContain('Everyday');
    });

    it('shows a fallback card for an invalid spec, renders none of it, and logs the error', async () => {
      const { fixture, host } = await render();
      session.load([create('main'), components('main', { id: 'root', component: 'Card', child: 'f' }, { id: 'f', component: 'Iframe', src: 'x' })]);
      await fixture.whenStable();
      expect(host('main').querySelector('a2ui-v09-surface')).toBeNull();
      expect(host('main').querySelector('.ui-alert')?.textContent).toContain("This view couldn't be shown");
      expect(host('main').querySelector('details')?.textContent).toContain("Unknown component type 'Iframe'");
      expect(errors).toHaveBeenCalledWith(expect.stringContaining('main: spec rejected'));
    });

    it('drops the rest of a failed view, and recovers on the next createSurface', async () => {
      const { fixture, host } = await render();
      session.load([create('main'), components('main', { id: 'root', component: 'Badge', text: 'x', tone: 'purple' })]);
      session.load([components('main', text('root', 'late update'))]);
      await fixture.whenStable();
      expect(host('main').textContent).not.toContain('late update');

      session.load([create('main'), components('main', text('root', 'Recovered'))]);
      await fixture.whenStable();
      expect(host('main').querySelector('a2ui-v09-surface')?.textContent).toContain('Recovered');
    });

    it('refuses figures sent by the agent, accepting only UI state (rule 5)', async () => {
      const transport = TestBed.inject(AgentTransport) as MockTransport;
      const { fixture, host } = await render();
      session.load([create('main'), components('main', { id: 'root', component: 'Column', children: ['a', 'b'] }, text('a', { path: '/account/name' }), text('b', { path: '/ui/note' }))]);
      (transport as unknown as { subject: { next(m: A2uiMessage): void } }).subject.next(data('main', '/account/name', 'Hacked balance'));
      (transport as unknown as { subject: { next(m: A2uiMessage): void } }).subject.next(data('main', '/ui/note', 'UI state is fine'));
      await fixture.whenStable();
      expect(host('main').textContent).toContain('Everyday');
      expect(host('main').textContent).not.toContain('Hacked');
      expect(host('main').textContent).toContain('UI state is fine');
      expect(warnings).toHaveBeenCalledWith(expect.stringContaining("Refused agent data for '/account/name'"));
    });
  });

  describe('loading skeleton', () => {
    it('shows while the surface is building, then the surface once its root arrives', async () => {
      const { fixture, host } = await render();
      session.load([create('main')]);
      await fixture.whenStable();
      const skeleton = host('main').querySelector('ui-skeleton')!;
      expect(skeleton.getAttribute('role')).toBe('status');
      expect(skeleton.getAttribute('aria-label')).toBe('Building the main view');
      expect(host('main').querySelector('a2ui-v09-surface')).toBeNull();

      session.load([components('main', text('root', 'Done'))]);
      await fixture.whenStable();
      expect(host('main').querySelector('ui-skeleton')).toBeNull();
      expect(host('main').textContent).toContain('Done');
    });
  });

  describe('multiple surfaces', () => {
    it('render at once with independent state', async () => {
      const { fixture, host } = await render();
      session.load([create('main'), components('main', text('root', { path: '/ui/title' })), data('main', '/ui/title', 'Main view')]);
      session.load([create('side'), components('side', text('root', { path: '/ui/title' })), data('side', '/ui/title', 'Side widget')]);
      await fixture.whenStable();
      expect(host('main').textContent).toContain('Main view');
      expect(host('side').textContent).toContain('Side widget');

      session.load([data('side', '/ui/title', 'Side changed')]);
      session.load([create('main'), components('main', { id: 'root', component: 'Nope' })]);
      await fixture.whenStable();
      expect(host('side').textContent).toContain('Side changed');
      expect(host('main').querySelector('.ui-alert')).toBeTruthy();
      expect(host('side').querySelector('.ui-alert')).toBeNull();
    });

    it('renders a stream from the transport, progressively', async () => {
      const transport = TestBed.inject(AgentTransport);
      const { fixture, host } = await render();
      transport.sendPrompt('recent orders', { surfaceId: 'side' });
      await new Promise((r) => setTimeout(r, 20));
      await fixture.whenStable();
      expect(host('side').querySelector('table')).toBeTruthy();
      expect(host('main').querySelector('.empty')).toBeTruthy();
    });
  });

  describe('action router', () => {
    const button = (name: string) => [
      create('main'),
      components(
        'main',
        { id: 'root', component: 'Button', child: 'l', action: { event: { name, context: { section: 'orders' } } } },
        text('l', 'Go'),
      ),
    ];

    it('runs the handler of an allow-listed action', async () => {
      const { fixture, host } = await render();
      session.load(button('viewAll'));
      await fixture.whenStable();
      host('main').querySelector('button')!.click();
      await fixture.whenStable();
      expect(handled).toEqual(['viewAll:{"section":"orders"}']);
    });

    it('forwards actions registered as "agent" to the transport', async () => {
      const send = vi.spyOn(TestBed.inject(AgentTransport), 'sendAction');
      const { fixture, host } = await render();
      session.load(button('askAgent'));
      await fixture.whenStable();
      host('main').querySelector('button')!.click();
      await fixture.whenStable();
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ name: 'askAgent', surfaceId: 'main', context: { section: 'orders' } }));
    });

    it('ignores and logs actions that are not on the allow-list', async () => {
      const { fixture, host } = await render();
      session.load(button('deleteEverything'));
      await fixture.whenStable();
      host('main').querySelector('button')!.click();
      await fixture.whenStable();
      expect(handled).toEqual([]);
      expect(warnings).toHaveBeenCalledWith(expect.stringContaining("Ignored 'deleteEverything'"));
    });

    it('refuses actions that move money, even when a spec asks for them (rule 4)', () => {
      const router = TestBed.inject(ActionRouter);
      expect(router.dispatch({ name: 'placeOrder', surfaceId: 'main', sourceComponentId: 'b', context: {} })).toBe(false);
      expect(warnings).toHaveBeenCalledWith(expect.stringContaining("Refused 'placeOrder'"));
    });
  });
});

describe('E3-S4: blocked actions cannot be registered', () => {
  it('throws when an app tries to allow an action that moves money', () => {
    TestBed.configureTestingModule({
      providers: [provideAgentTransport(MockTransport), provideActionHandlers({ cancelOrder: () => undefined })],
    });
    expect(() => TestBed.inject(ActionRouter)).toThrow(/moves money/);
  });
});
