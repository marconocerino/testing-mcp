import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer } from '@angular/core';
import { provideA2Ui } from '@a2ui/angular';
import { provideRouter } from '@angular/router';
import { provideCopilotKit } from '@copilotkit/angular';
import { routes } from './app.routes';
import { a2uiConfig } from './catalog/catalog';
import { provideCatalogRenderer } from './catalog/catalog-renderer.service';
import { provideActionHandlers } from './surface/action-router';
import { SurfaceSessionService } from './surface/surface-session.service';
import { provideAgentTransport } from './transport/agent-transport';
import { MockTransport } from './transport/mock-transport';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideA2Ui(a2uiConfig()),
    provideCatalogRenderer(),
    // The agent connection. MockTransport replays recorded views; swap for HttpTransport (E3-S3).
    provideAgentTransport(MockTransport),
    // Start rendering agent messages as soon as the app boots, before the first prompt.
    provideEnvironmentInitializer(() => inject(SurfaceSessionService)),
    // Allow-list of actions generated views may trigger (E3-S4). 'agent' forwards to the agent.
    provideActionHandlers({ showAccount: 'agent', openOrderTicket: 'agent', filterTransactions: 'agent' }),
    // Only proves CopilotKit bootstraps alongside A2UI on the same Angular version.
    // No runtimeUrl: the self-hosted runtime arrives in a later story.
    provideCopilotKit({}),
  ],
};
