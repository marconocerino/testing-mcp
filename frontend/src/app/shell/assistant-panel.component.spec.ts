import { TestBed } from '@angular/core/testing';
import { AgentTransport, provideAgentTransport } from '../transport/agent-transport';
import { TRADING_AGENT_ID } from '../transport/copilotkit-transport';
import { MockTransport } from '../transport/mock-transport';
import { provideTestCopilotKit } from '../transport/testing/test-copilotkit';
import { AssistantPanelComponent } from './assistant-panel.component';

describe('E5-S5: assistant panel', () => {
  function setup(withAgent: boolean) {
    TestBed.configureTestingModule({
      imports: [AssistantPanelComponent],
      providers: [provideAgentTransport(MockTransport), provideTestCopilotKit(withAgent)],
    });
  }

  it('shows the CopilotKit chat for the trading agent', async () => {
    setup(true);
    const fixture = TestBed.createComponent(AssistantPanelComponent);
    await fixture.whenStable();
    const chat = fixture.debugElement.query((d) => d.name === 'copilot-chat');
    expect(chat).toBeTruthy();
    expect(chat.componentInstance.agentId()).toBe(TRADING_AGENT_ID);
    expect((fixture.nativeElement as HTMLElement).querySelector('textarea')).toBeTruthy();
  });

  it('says it is connecting until the runtime lists the agent', async () => {
    setup(false);
    const fixture = TestBed.createComponent(AssistantPanelComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('copilot-chat')).toBeNull();
    expect(el.textContent).toContain('Connecting to the assistant');
  });

  it('shows transport errors instead', async () => {
    setup(false);
    const fixture = TestBed.createComponent(AssistantPanelComponent);
    (TestBed.inject(AgentTransport) as MockTransport).error.set({ message: "The assistant isn't available right now.", retrying: false });
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ui-alert')?.getAttribute('role')).toBe('alert');
    expect(el.textContent).toContain("isn't available");
    expect(el.textContent).not.toContain('Connecting');
  });
});
