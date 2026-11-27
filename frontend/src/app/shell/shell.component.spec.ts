import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideA2Ui } from '@a2ui/angular';
import { provideCopilotChatConfiguration } from '@copilotkit/angular';
import { App } from '../app';
import { routes } from '../app.routes';
import { a2uiConfig } from '../catalog/catalog';
import { provideCatalogRenderer } from '../catalog/catalog-renderer.service';
import { AgentTransport, provideAgentTransport } from '../transport/agent-transport';
import { TRADING_AGENT_ID } from '../transport/copilotkit-transport';
import { MockTransport } from '../transport/mock-transport';
import { provideTestCopilotKit } from '../transport/testing/test-copilotkit';

async function renderApp(withAgent = true, url = '/') {
  TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter(routes),
      provideA2Ui(a2uiConfig()),
      provideCatalogRenderer(),
      provideAgentTransport(MockTransport),
      provideTestCopilotKit(withAgent),
      provideCopilotChatConfiguration({ agentId: TRADING_AGENT_ID }),
    ],
  });
  const fixture = TestBed.createComponent(App);
  await TestBed.inject(Router).navigateByUrl(url);
  await fixture.whenStable();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('E3-S1: app shell', () => {
  it('has header and main landmarks, and a skip link to main', async () => {
    const { el } = await renderApp();
    expect(el.querySelector('header')?.textContent).toContain('Trading');
    expect(el.querySelector('header')?.textContent).toContain('Mock data');
    expect(el.querySelector('nav[aria-label="Main"]')).toBeTruthy();
    expect(el.querySelector('main#main')).toBeTruthy();
    expect(el.querySelector<HTMLAnchorElement>('a[href="#main"]')?.textContent).toContain('Skip to main content');
  });

  it('renders the routed page inside the main region', async () => {
    const { el } = await renderApp();
    expect(el.querySelector('main app-screen-page')).toBeTruthy();
  });

  it('marks the current page in the navigation, and links to dev pages in dev builds', async () => {
    const { el } = await renderApp();
    const links = [...el.querySelectorAll<HTMLAnchorElement>('nav a')];
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Dashboard', 'Accounts', 'Orders', 'Build a view', 'Catalog gallery']);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[4].getAttribute('href')).toBe('/dev/catalog');
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

describe('E5-S5: assistant sidebar', () => {
  it("shows CopilotKit's sidebar chat on the Build a view tab once the trading agent is available", async () => {
    const { el } = await renderApp(true, '/build');
    expect(el.querySelector('copilot-sidebar')).toBeTruthy();
    expect(el.querySelector('copilot-sidebar copilot-chat')).toBeTruthy();
    expect(el.querySelector('.ui-app-layout__header button')).toBeNull(); // no separate assistant toggle in the app header
  });

  it('shows no chat until the runtime lists the agent', async () => {
    const { el } = await renderApp(false, '/build');
    expect(el.querySelector('copilot-sidebar')).toBeNull();
  });

  it('shows no chat on the default views', async () => {
    const { el } = await renderApp(true, '/dashboard');
    expect(el.querySelector('copilot-sidebar')).toBeNull();
  });
});

describe('E3-S3: transport banners', () => {
  it('shows connection problems on the Build a view tab only, not on the default views', async () => {
    const { fixture, el } = await renderApp(true, '/build');
    const transport = TestBed.inject(AgentTransport) as MockTransport;
    expect(el.querySelector('main .ui-alert')).toBeNull();

    transport.status.set('reconnecting');
    transport.error.set({ message: 'Connection to the assistant lost. Reconnecting…', retrying: true });
    await fixture.whenStable();
    expect(el.querySelector('main .ui-alert')!.getAttribute('role')).toBe('status');

    transport.status.set('error');
    transport.error.set({ message: "The assistant isn't available right now.", retrying: false });
    await fixture.whenStable();
    expect(el.querySelector('main .ui-alert')!.getAttribute('role')).toBe('alert');
    expect(el.querySelector('main .ui-alert')!.textContent).toContain("isn't available");

    await TestBed.inject(Router).navigateByUrl('/dashboard');
    await fixture.whenStable();
    expect(el.querySelector('main .ui-alert')).toBeNull();
  });
});
