import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { A2uiRendererService, provideA2Ui } from '@a2ui/angular';
import { provideCopilotKit } from '@copilotkit/angular';
import { routes } from './app.routes';
import { DEV_ROUTES } from './dev/dev.routes';
import { a2uiConfig } from './catalog/catalog';
import { provideCatalogRenderer } from './catalog/catalog-renderer.service';
import { ACCOUNT_CARD_SPEC, MOCK_DATA, SURFACE_ID } from './spec/account-card.a2ui';
import { SURFACE_DATA } from './data/mock-data';
import { SurfaceHostComponent } from './surface/surface-host.component';
import { SurfaceSessionService } from './surface/surface-session.service';
import { A2uiMessage, provideAgentTransport } from './transport/agent-transport';
import { MockTransport } from './transport/mock-transport';

@Component({ imports: [SurfaceHostComponent], template: `<app-surface-host surfaceId="${SURFACE_ID}" />` })
class CardHost {}

describe('E0-S1: library component renders from a hand-written A2UI spec', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CardHost],
      providers: [
        provideA2Ui(a2uiConfig()),
        provideCatalogRenderer(),
        provideCopilotKit({}),
        provideAgentTransport(MockTransport),
        // This spec brings its own data (MOCK_DATA below).
        { provide: SURFACE_DATA, useValue: () => ({}) },
      ],
    });
  });

  it('renders the spec Card through the @app/ui card with bound mock data', async () => {
    TestBed.inject(SurfaceSessionService).load([...ACCOUNT_CARD_SPEC, ...MOCK_DATA] as unknown as A2uiMessage[]);
    const fixture = TestBed.createComponent(CardHost);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('ui-card[data-testid="library-card"] mat-card');
    expect(card).toBeTruthy();
    expect(card?.classList).toContain('mat-mdc-card');
    expect(card?.textContent).toContain('Mock Brokerage Account');
  });

  it('rejects a spec that uses a component outside the catalog', () => {
    const renderer = TestBed.inject(A2uiRendererService);
    renderer.processMessages([ACCOUNT_CARD_SPEC[0]] as never);
    expect(() =>
      renderer.processMessages([
        {
          version: 'v0.9',
          updateComponents: { surfaceId: SURFACE_ID, components: [
            { id: 'root', component: 'Card', child: 'x' },
            { id: 'x', component: 'Iframe', src: 'https://example.com' },
          ] },
        },
      ] as never),
    ).toThrow(/Iframe/);
  });

  it('rejects props the catalog schema does not declare', () => {
    const renderer = TestBed.inject(A2uiRendererService);
    renderer.processMessages([ACCOUNT_CARD_SPEC[0]] as never);
    expect(() =>
      renderer.processMessages([
        {
          version: 'v0.9',
          updateComponents: { surfaceId: SURFACE_ID, components: [{ id: 'account-name', component: 'Text', text: 'hi', html: '<b>x</b>' }] },
        },
      ] as never),
    ).toThrow(/Unrecognized key/);
  });
});

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideA2Ui(a2uiConfig()), provideCatalogRenderer(), provideAgentTransport(MockTransport)],
    });
  });

  it('shows the workspace at /, with a welcome until the assistant builds a view', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('app-surface-host')?.textContent).toContain('No view yet');
  });

  it('serves the catalog gallery at /dev/catalog in dev mode', async () => {
    const harness = await RouterTestingHarness.create('/dev/catalog');
    expect(TestBed.inject(Router).url).toBe('/dev/catalog');
    expect(harness.routeNativeElement?.querySelectorAll('section[data-component]').length).toBe(15);
  });

  it('the gallery is only in the dev routes, so production builds leave it out', () => {
    expect(DEV_ROUTES.map((r) => r.path)).toEqual(['dev/catalog']);
    expect(routes.some((r) => r.path === 'dev/catalog')).toBe(true);
  });
});
