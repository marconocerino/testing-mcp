import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { UiAlertComponent, UiButtonComponent, UiPromptInputComponent, UiStackComponent, UiTextComponent } from '@app/ui';
import { AgentTransport } from '../transport/agent-transport';

/** Surface the assistant's views go to (the workspace page shows it). */
export const MAIN_SURFACE_ID = 'main';

const STATUS_TEXT = {
  idle: '',
  connecting: 'Asking the assistant…',
  streaming: 'Building your view…',
  reconnecting: 'Connection lost, reconnecting…',
  error: '',
} as const;

/**
 * The assistant panel (MVP): a prompt box that sends requests through `AgentTransport` and a
 * status line. E5-S5 replaces it with the CopilotKit chat.
 */
@Component({
  selector: 'app-assistant-panel',
  imports: [UiStackComponent, UiTextComponent, UiButtonComponent, UiPromptInputComponent, UiAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-stack>
      <ui-text variant="heading">Assistant</ui-text>
      <ui-text variant="caption">Ask for a view of your accounts or orders. It can prepare orders, never place them.</ui-text>

      @if (history().length === 0) {
        <ui-stack>
          <ui-text variant="caption">Try</ui-text>
          @for (s of suggestions; track s) {
            <ui-button variant="borderless" (pressed)="ask(s)">{{ s }}</ui-button>
          }
        </ui-stack>
      }
      @for (prompt of history(); track $index) {
        <ui-text>You: {{ prompt }}</ui-text>
      }

      <div role="status" aria-live="polite">
        @if (statusText()) {
          <ui-text variant="caption">{{ statusText() }}</ui-text>
        }
      </div>
      @if (transport.error(); as error) {
        <ui-alert [tone]="error.retrying ? 'warning' : 'danger'">{{ error.message }}</ui-alert>
      }

      <ui-prompt-input label="Ask the assistant" hint="Enter to send, Shift+Enter for a new line" (submitted)="ask($event)" />
    </ui-stack>
  `,
})
export class AssistantPanelComponent {
  protected readonly transport = inject(AgentTransport);
  protected readonly history = signal<string[]>([]);
  protected readonly statusText = computed(() => STATUS_TEXT[this.transport.status()]);
  protected readonly suggestions = [
    'Show my accounts as a compact overview',
    'Show my recent orders',
    'What did I spend this month?',
    'Buy 10 shares of ALPN',
  ];

  protected ask(prompt: string): void {
    this.history.update((h) => [...h, prompt]);
    this.transport.sendPrompt(prompt, { surfaceId: MAIN_SURFACE_ID });
  }
}
