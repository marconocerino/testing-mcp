import { TestBed } from '@angular/core/testing';
import { provideAgentTransport } from '../transport/agent-transport';
import { MOCK_TRANSPORT_OPTIONS, MockTransport } from '../transport/mock-transport';
import { AgentTransport } from '../transport/agent-transport';
import { AssistantPanelComponent, MAIN_SURFACE_ID } from './assistant-panel.component';

describe('E3-S2: assistant panel sends prompts through the transport', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AssistantPanelComponent],
      providers: [provideAgentTransport(MockTransport), { provide: MOCK_TRANSPORT_OPTIONS, useValue: { delayMs: 0 } }],
    });
  });

  it('sends a typed prompt for the main surface and shows it', async () => {
    const transport = TestBed.inject(AgentTransport);
    const send = vi.spyOn(transport, 'sendPrompt');
    const fixture = TestBed.createComponent(AssistantPanelComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const textarea = el.querySelector('textarea')!;
    textarea.value = 'Show my recent orders';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();

    expect(send).toHaveBeenCalledWith('Show my recent orders', { surfaceId: MAIN_SURFACE_ID });
    expect(el.textContent).toContain('You: Show my recent orders');
    expect(textarea.value).toBe('');
  });

  it('offers suggestions that send a prompt', async () => {
    const send = vi.spyOn(TestBed.inject(AgentTransport), 'sendPrompt');
    const fixture = TestBed.createComponent(AssistantPanelComponent);
    await fixture.whenStable();
    const suggestion = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) => b.textContent?.includes('Buy 10 shares'))!;
    suggestion.click();
    expect(send).toHaveBeenCalledWith('Buy 10 shares of ALPN', { surfaceId: MAIN_SURFACE_ID });
  });

  it('announces progress in a live region', async () => {
    const fixture = TestBed.createComponent(AssistantPanelComponent);
    await fixture.whenStable();
    (TestBed.inject(AgentTransport) as MockTransport).sendPrompt('accounts');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent).toContain('Asking the assistant');
  });
});
