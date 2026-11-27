import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CopilotKit, CopilotSidebar } from '@copilotkit/angular';
import { TRADING_AGENT_ID } from '../transport/copilotkit-transport';

/** Surface the assistant's views go to (the Build a view tab shows it). */
export const MAIN_SURFACE_ID = 'main';

/**
 * The assistant (E5-S5): CopilotKit's sidebar chat, docked on the right with its own open and
 * close control. It talks to the `trading` agent (set app-wide with
 * `provideCopilotChatConfiguration`). The views the agent builds arrive through `AgentTransport`
 * and render in the workspace. CopilotKit's own component is an explicit exception to
 * "UI only through @app/ui" (decision 2026-11-25); it is themed from the library theme's tokens.
 */
@Component({
  selector: 'app-assistant-sidebar',
  imports: [CopilotSidebar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (agentReady()) {
      <copilot-sidebar title="Assistant" mode="docked" position="right" />
    }
  `,
})
export class AssistantSidebarComponent {
  private readonly copilotKit = inject(CopilotKit);
  /** The chat needs the agent, which the runtime lists once connected. */
  protected readonly agentReady = computed(() => !!this.copilotKit.agents()[TRADING_AGENT_ID]);
}
