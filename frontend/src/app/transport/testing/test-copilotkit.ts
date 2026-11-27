import { Provider } from '@angular/core';
import { HttpAgent } from '@ag-ui/client';
import { provideCopilotKit } from '@copilotkit/angular';
import { TRADING_AGENT_ID } from '../copilotkit-transport';

/**
 * CopilotKit for tests: no runtime, and a local `trading` agent whose URL is never called
 * unless a test runs it.
 */
export function provideTestCopilotKit(withAgent = true): Provider {
  return provideCopilotKit(withAgent ? { agents: { [TRADING_AGENT_ID]: new HttpAgent({ url: 'http://agent.test.invalid' }) } } : {});
}
