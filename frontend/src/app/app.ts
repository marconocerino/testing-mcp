import { Component, inject } from '@angular/core';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular';
import { ACCOUNT_CARD_SPEC, MOCK_DATA, SURFACE_ID } from './spec/account-card.a2ui';

@Component({
  selector: 'app-root',
  imports: [SurfaceComponent],
  styleUrl: './app.scss',
  template: `
    <h1>Trading app</h1>
    <a2ui-v09-surface [surfaceId]="surfaceId" />
  `,
})
export class App {
  protected readonly surfaceId = SURFACE_ID;

  constructor() {
    const renderer = inject(A2uiRendererService);
    renderer.processMessages([...ACCOUNT_CARD_SPEC, ...MOCK_DATA]);
  }
}
