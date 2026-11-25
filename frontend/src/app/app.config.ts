import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { A2uiRendererService, provideA2Ui } from '@a2ui/angular';
import { provideRouter } from '@angular/router';
import { provideCopilotKit } from '@copilotkit/angular';
import { routes } from './app.routes';
import { a2uiConfig } from './catalog/catalog';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideA2Ui(a2uiConfig()),
    A2uiRendererService,
    // Only proves CopilotKit bootstraps alongside A2UI on the same Angular version.
    // No runtimeUrl: the self-hosted runtime arrives in a later story.
    provideCopilotKit({}),
  ],
};
