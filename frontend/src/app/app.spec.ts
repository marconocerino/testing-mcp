import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { A2uiRendererService, provideA2Ui } from '@a2ui/angular';
import { provideCopilotKit } from '@copilotkit/angular';
import { App } from './app';
import { routes } from './app.routes';
import { DEV_ROUTES } from './dev/dev.routes';
import { a2uiConfig } from './catalog/catalog';
import { provideCatalogRenderer } from './catalog/catalog-renderer.service';
import { HomePage } from './home/home.page';
import { SURFACE_ID } from './spec/account-card.a2ui';

describe('E0-S1: library component renders from a hand-written A2UI spec', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, HomePage],
      providers: [provideRouter(routes), provideA2Ui(a2uiConfig()), provideCatalogRenderer(), provideCopilotKit({})],
    }).compileComponents();
  });

  it('renders the spec Card through the @app/ui card with bound mock data', async () => {
    const fixture = TestBed.createComponent(HomePage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const card = el.querySelector('ui-card[data-testid="library-card"] mat-card');
    expect(card).toBeTruthy();
    expect(card?.classList).toContain('mat-mdc-card');
    expect(card?.textContent).toContain('Mock Brokerage Account');
  });

  it('rejects a spec that uses a component outside the catalog', () => {
    TestBed.createComponent(HomePage);
    const renderer = TestBed.inject(A2uiRendererService);
    expect(() =>
      renderer.processMessages([
        {
          version: 'v0.9',
          updateComponents: { surfaceId: SURFACE_ID, components: [
            { id: 'root', component: 'Card', child: 'x' },
            { id: 'x', component: 'Iframe', src: 'https://example.com' },
          ] },
        },
      ]),
    ).toThrow(/Iframe/);
  });

  it('rejects props the catalog schema does not declare', () => {
    TestBed.createComponent(HomePage);
    const renderer = TestBed.inject(A2uiRendererService);
    expect(() =>
      renderer.processMessages([
        {
          version: 'v0.9',
          updateComponents: { surfaceId: SURFACE_ID, components: [{ id: 'account-name', component: 'Text', text: 'hi', html: '<b>x</b>' }] },
        },
      ]),
    ).toThrow(/Unrecognized key/);
  });
});

describe('E1-S5: routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideA2Ui(a2uiConfig()), provideCatalogRenderer()],
    });
  });

  it('the shell shows the home page at /', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('mat-card')?.textContent).toContain('Mock Brokerage Account');
  });

  it('serves the catalog gallery at /dev/catalog in dev mode', async () => {
    const harness = await RouterTestingHarness.create('/dev/catalog');
    expect(TestBed.inject(Router).url).toBe('/dev/catalog');
    expect(harness.routeNativeElement?.querySelectorAll('section[data-component]').length).toBe(15);
  });

  it('the gallery is only in the dev routes, so production builds leave it out', () => {
    expect(DEV_ROUTES.map((r) => r.path)).toEqual(['dev/catalog']);
    // Tests and `ng serve` use dev.routes.ts; production builds replace it with an empty list.
    expect(routes.some((r) => r.path === 'dev/catalog')).toBe(true);
  });
});
