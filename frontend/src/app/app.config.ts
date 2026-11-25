import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideA2Ui } from '@a2ui/angular';
import { provideRouter } from '@angular/router';
import { provideCopilotKit } from '@copilotkit/angular';
import { routes } from './app.routes';
import { a2uiConfig } from './catalog/catalog';
import { provideCatalogRenderer } from './catalog/catalog-renderer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideA2Ui(a2uiConfig()),
    provideCatalogRenderer(),
    // Only proves CopilotKit bootstraps alongside A2UI on the same Angular version.
    // No runtimeUrl: the self-hosted runtime arrives in a later story.
    provideCopilotKit({}),
  ],
};
