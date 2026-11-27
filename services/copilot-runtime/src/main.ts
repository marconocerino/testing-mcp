import './no-telemetry.js';
import { BASE_PATH, createApp } from './app.js';

const port = Number(process.env['PORT'] ?? 4000);
const agentUrl = process.env['AGENT_URL'] ?? 'http://localhost:8090/agent';

createApp({ agentUrl }).listen(port, () => {
  console.log(JSON.stringify({ time: new Date().toISOString(), event: 'runtime.started', port, basePath: BASE_PATH, agentUrl }));
});
