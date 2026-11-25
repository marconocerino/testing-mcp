import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssistantPanelComponent } from './shell/assistant-panel.component';
import { ShellComponent } from './shell/shell.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellComponent, AssistantPanelComponent],
  styleUrl: './app.scss',
  template: `
    <app-shell>
      <router-outlet />
      <app-assistant-panel appAssistant />
    </app-shell>
  `,
})
export class App {}
