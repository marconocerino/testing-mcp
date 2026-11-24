import { TestBed } from '@angular/core/testing';
import { A2uiRendererService, provideA2Ui } from '@a2ui/angular';
import { provideCopilotKit } from '@copilotkit/angular';
import { App } from './app';
import { a2uiConfig } from './catalog/catalog';
import { SURFACE_ID } from './spec/account-card.a2ui';

describe('E0-S1: library component renders from a hand-written A2UI spec', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideA2Ui(a2uiConfig()), A2uiRendererService, provideCopilotKit({})],
    }).compileComponents();
  });

  it('renders the spec Card through the @app/ui card with bound mock data', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const card = el.querySelector('ui-card[data-testid="library-card"] mat-card');
    expect(card).toBeTruthy();
    expect(card?.classList).toContain('mat-mdc-card');
    expect(card?.textContent).toContain('Mock Brokerage Account');
  });

  it('rejects a spec that uses a component outside the catalog', () => {
    TestBed.createComponent(App);
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
    TestBed.createComponent(App);
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
