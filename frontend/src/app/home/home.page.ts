import { Component, inject } from '@angular/core';
import { A2uiRendererService, SurfaceComponent } from '@a2ui/angular';
import { ACCOUNT_CARD_SPEC, MOCK_DATA, SURFACE_ID } from '../spec/account-card.a2ui';

/** Start page: the hand-written account card spec from E0-S1. */
@Component({
  selector: 'app-home-page',
  imports: [SurfaceComponent],
  template: `<a2ui-v09-surface [surfaceId]="surfaceId" />`,
})
export class HomePage {
  protected readonly surfaceId = SURFACE_ID;

  constructor() {
    const renderer = inject(A2uiRendererService);
    if (!renderer.surfaceGroup.getSurface(SURFACE_ID)) {
      renderer.processMessages([...ACCOUNT_CARD_SPEC, ...MOCK_DATA]);
    }
  }
}
