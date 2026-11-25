import './no-telemetry.js';
import { HttpAgent } from '@ag-ui/client';
import { CopilotRuntime } from '@copilotkit/runtime/v2';
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express';
import express, { type Express } from 'express';

/** The agent id the app's chat and transport use. */
export const TRADING_AGENT_ID = 'trading';

/** Where the browser reaches the runtime (proxied by the dev server and nginx). */
export const BASE_PATH = '/api/copilotkit';

export interface RuntimeOptions {
  /** The agent service's AG-UI endpoint, for example http://agent-service:8090/agent. */
  agentUrl: string;
}

/**
 * The self-hosted CopilotKit runtime (E5-S4). It hosts one agent, `trading`, which is the agent
 * service reached over AG-UI. No CopilotKit cloud: no license key, no telemetry endpoint, no
 * outbound calls except to the agent service.
 */
export function createApp(options: RuntimeOptions): Express {
  const runtime = new CopilotRuntime({
    agents: { [TRADING_AGENT_ID]: new HttpAgent({ url: options.agentUrl }) },
  });

  const app = express();
  app.get('/health', (_req, res) => {
    res.json({ status: 'UP' });
  });
  // Same-origin only: the browser reaches this through the app's own host (dev proxy / nginx).
  app.use(createCopilotExpressHandler({ runtime, basePath: BASE_PATH, cors: false, activateChannels: false }));
  return app;
}
