import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CopilotChat, CopilotKit } from '@copilotkit/angular';
import { UiAlertComponent, UiStackComponent, UiTextComponent } from '@app/ui';
import { AgentTransport } from '../transport/agent-transport';
import { TRADING_AGENT_ID } from '../transport/copilotkit-transport';

/** Surface the assistant's views go to (the workspace page shows it). */
export const MAIN_SURFACE_ID = 'main';

/**
 * The assistant panel (E5-S5): CopilotKit's chat, talking to the trading agent through the
 * self-hosted runtime. The views the agent builds arrive through `AgentTransport` and render in
 * the workspace; the chat shows the conversation. The chat is CopilotKit's own component, an
 * explicit exception to "UI only through @app/ui" (decision 2026-11-25); it is themed from the
 * library theme's tokens.
 */
@Component({
  selector: 'app-assistant-panel',
  imports: [CopilotChat, UiStackComponent, UiTextComponent, UiAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-stack>
      <ui-text variant="heading">Assistant</ui-text>
      <ui-text variant="caption">Ask for a view of your accounts, orders or spending. It can prepare orders, never place them.</ui-text>
      @if (transport.error(); as error) {
        <ui-alert [tone]="error.retrying ? 'warning' : 'danger'">{{ error.message }}</ui-alert>
      }
      @if (agentReady()) {
        <copilot-chat [agentId]="agentId" />
      } @else if (!transport.error()) {
        <ui-text variant="caption">Connecting to the assistant…</ui-text>
      }
    </ui-stack>
  `,
})
export class AssistantPanelComponent {
  protected readonly transport = inject(AgentTransport);
  protected readonly agentId = TRADING_AGENT_ID;
  private readonly copilotKit = inject(CopilotKit);
  /** The chat needs the agent, which the runtime lists once connected. */
  protected readonly agentReady = computed(() => !!this.copilotKit.agents()[TRADING_AGENT_ID]);
}
