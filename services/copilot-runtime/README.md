# copilot-runtime

The self-hosted CopilotKit runtime (E5-S4): the only agent endpoint the browser talks to. Node 22 + TypeScript, `@copilotkit/runtime` 1.66.0 (the release that matches `@copilotkit/angular` 0.3.1).

It hosts one agent, `trading`: the agent service (`services/agent-service`), reached over AG-UI at `AGENT_URL`. Runs, chat messages and the agent's A2UI events pass through unchanged; the Angular app renders the A2UI itself.

- Served at `/api/copilotkit` (`/info`, `/agent/trading/run`, …). The browser reaches it same-origin: the Angular dev server proxies it (`frontend/proxy.conf.json`), nginx in the frontend container proxies it in compose.
- No CORS: cross-origin requests are not answered.
- **No CopilotKit cloud and no telemetry**: `src/no-telemetry.ts` (loaded first) and the Dockerfile set `COPILOTKIT_TELEMETRY_DISABLED=true`; a test checks `/info` reports it.
- Authentication is deferred with SSO (decision 2026-11-25).

| Variable | Default |
| --- | --- |
| `PORT` | `4000` |
| `AGENT_URL` | `http://localhost:8090/agent` (`http://agent-service:8090/agent` in the container) |

| | |
| --- | --- |
| Install | `npm ci` |
| Run (watch) | `npm run dev` |
| Test | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build`, then `npm start` |
