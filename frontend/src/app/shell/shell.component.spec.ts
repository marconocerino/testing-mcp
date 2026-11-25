import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideA2Ui } from '@a2ui/angular';
import { App } from '../app';
import { routes } from '../app.routes';
import { a2uiConfig } from '../catalog/catalog';
import { provideCatalogRenderer } from '../catalog/catalog-renderer.service';
import { AgentTransport, provideAgentTransport } from '../transport/agent-transport';
import { MockTransport } from '../transport/mock-transport';
import { provideTestCopilotKit } from '../transport/testing/test-copilotkit';

describe('E3-S1: app shell', () => {
  async function renderApp() {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideA2Ui(a2uiConfig()), provideCatalogRenderer(), provideAgentTransport(MockTransport), provideTestCopilotKit()],
    });
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('has header, main and assistant landmarks, and a skip link to main', async () => {
    const { el } = await renderApp();
    expect(el.querySelector('header')?.textContent).toContain('Trading');
    expect(el.querySelector('header')?.textContent).toContain('Mock data');
    expect(el.querySelector('nav[aria-label="Main"]')).toBeTruthy();
    expect(el.querySelector('main#main')).toBeTruthy();
    expect(el.querySelector('aside[aria-label="Assistant"]')).toBeTruthy();
    expect(el.querySelector<HTMLAnchorElement>('a[href="#main"]')?.textContent).toContain('Skip to main content');
  });

  it('renders the routed page inside the main region', async () => {
    const { el } = await renderApp();
    expect(el.querySelector('main router-outlet + *')).toBeTruthy();
  });

  it('collapses and reopens the assistant panel, announcing its state', async () => {
    const { fixture, el } = await renderApp();
    const toggle = () => el.querySelector<HTMLButtonElement>('header button[aria-controls="assistant-panel"]')!;
    const panel = () => el.querySelector<HTMLElement>('aside#assistant-panel')!;

    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(panel().hidden).toBe(false);

    toggle().click();
    await fixture.whenStable();
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(panel().hidden).toBe(true);
    expect(toggle().textContent).toContain('Assistant');

    toggle().click();
    await fixture.whenStable();
    expect(panel().hidden).toBe(false);
  });

  it('marks the current page in the navigation, and links to dev pages in dev builds', async () => {
    const { el } = await renderApp();
    const links = [...el.querySelectorAll<HTMLAnchorElement>('nav a')];
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Workspace', 'Catalog gallery']);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].getAttribute('href')).toBe('/dev/catalog');
  });

  it('keeps the shell in place while navigating', async () => {
    const { fixture, el } = await renderApp();
    const header = el.querySelector('header');
    await TestBed.inject(Router).navigateByUrl('/dev/catalog');
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/dev/catalog');
    expect(el.querySelector('header')).toBe(header);
    expect(el.querySelector('main')?.textContent).toContain('Catalog gallery');
  });
});

describe('E3-S3: reconnect banner', () => {
  it('shows a non-blocking banner while the transport reconnects', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideA2Ui(a2uiConfig()), provideCatalogRenderer(), provideAgentTransport(MockTransport), provideTestCopilotKit()],
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('main .ui-alert')).toBeNull();

    const transport = TestBed.inject(AgentTransport) as MockTransport;
    transport.status.set('reconnecting');
    transport.error.set({ message: 'Connection to the assistant lost. Reconnecting…', retrying: true });
    await fixture.whenStable();
    const banner = el.querySelector('main .ui-alert')!;
    expect(banner.getAttribute('role')).toBe('status');
    expect(banner.textContent).toContain('Reconnecting');

    transport.status.set('idle');
    await fixture.whenStable();
    expect(el.querySelector('main .ui-alert')).toBeNull();
  });
});
