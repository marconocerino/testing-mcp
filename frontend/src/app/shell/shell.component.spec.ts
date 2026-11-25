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

async function renderApp(withAgent = true) {
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
  await TestBed.inject(Router).navigateByUrl('/');
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
    expect(el.querySelector('main app-workspace-page')).toBeTruthy();
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

describe('E5-S5: assistant sidebar', () => {
  it("shows CopilotKit's sidebar chat once the trading agent is available", async () => {
    const { el } = await renderApp(true);
    expect(el.querySelector('copilot-sidebar')).toBeTruthy();
    expect(el.querySelector('copilot-sidebar copilot-chat')).toBeTruthy();
    expect(el.querySelector('ui-app-layout header button')).toBeNull(); // no separate assistant toggle in the app header
  });

  it('shows no chat until the runtime lists the agent', async () => {
    const { el } = await renderApp(false);
    expect(el.querySelector('copilot-sidebar')).toBeNull();
  });
});

describe('E3-S3: transport banners', () => {
  it('shows a non-blocking banner while reconnecting, and an error when the transport gives up', async () => {
    const { fixture, el } = await renderApp();
    expect(el.querySelector('main .ui-alert')).toBeNull();
    const transport = TestBed.inject(AgentTransport) as MockTransport;

    transport.status.set('reconnecting');
    transport.error.set({ message: 'Connection to the assistant lost. Reconnecting…', retrying: true });
    await fixture.whenStable();
    expect(el.querySelector('main .ui-alert')!.getAttribute('role')).toBe('status');
    expect(el.querySelector('main .ui-alert')!.textContent).toContain('Reconnecting');

    transport.status.set('error');
    transport.error.set({ message: "The assistant isn't available right now.", retrying: false });
    await fixture.whenStable();
    expect(el.querySelector('main .ui-alert')!.getAttribute('role')).toBe('alert');
    expect(el.querySelector('main .ui-alert')!.textContent).toContain("isn't available");

    transport.status.set('idle');
    await fixture.whenStable();
    expect(el.querySelector('main .ui-alert')).toBeNull();
  });
});
