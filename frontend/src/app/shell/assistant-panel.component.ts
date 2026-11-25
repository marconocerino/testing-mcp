import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiStackComponent, UiTextComponent } from '@app/ui';

/** The assistant panel's content. Placeholder until the transport (E3-S2) and chat (E5-S5). */
@Component({
  selector: 'app-assistant-panel',
  imports: [UiStackComponent, UiTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-stack>
      <ui-text variant="heading">Assistant</ui-text>
      <ui-text variant="caption">Ask for a view of your accounts or orders. It can prepare orders, never place them.</ui-text>
    </ui-stack>
  `,
})
export class AssistantPanelComponent {}
