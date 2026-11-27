import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssistantSidebarComponent } from './shell/assistant-sidebar.component';
import { ShellComponent } from './shell/shell.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellComponent, AssistantSidebarComponent],
  styleUrl: './app.scss',
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
    <app-assistant-sidebar />
  `,
})
export class App {}
