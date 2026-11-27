import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from './shell/shell.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellComponent],
  styleUrl: './app.scss',
  template: `
    <app-shell>
      <router-outlet />
    </app-shell>
  `,
})
export class App {}
