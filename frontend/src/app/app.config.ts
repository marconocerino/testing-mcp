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
import { CopilotKitTransport } from './transport/copilotkit-transport';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideA2Ui(a2uiConfig()),
    provideCatalogRenderer(),
    // The agent connection, through the CopilotKit runtime (E5-S4). For demos and work without
    // the backend, use MockTransport (recorded views) instead.
    provideAgentTransport(CopilotKitTransport),
    // Start rendering agent messages as soon as the app boots, before the first prompt.
    provideEnvironmentInitializer(() => inject(SurfaceSessionService)),
    // Allow-list of actions generated views may trigger (E3-S4). 'agent' forwards to the agent.
    provideActionHandlers({ showAccount: 'agent', openOrderTicket: 'agent', filterTransactions: 'agent' }),
    // The self-hosted CopilotKit runtime (services/copilot-runtime), proxied same-origin.
    provideCopilotKit({ runtimeUrl: '/api/copilotkit' }),
  ],
};
