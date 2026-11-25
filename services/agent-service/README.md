# agent-service

Generates A2UI views from user requests (E5-S1). Node 22 + TypeScript. Its one entry point, `generate_view`, is served as an AG-UI agent at `POST /agent`; the CopilotKit runtime (web, E5-S4) and later the MCP server (Copilot, E8) both call it (CLAUDE.md rule 2). **Internal only**: no CORS, no published port in compose. The browser never calls it directly.

## What it does

1. Builds the system prompt from the catalog export (`frontend/src/app/catalog/generated/`), the bindable data paths (shape only, never values) and the allowed actions (`src/prompt.ts`).
2. Asks the LLM (Groq, OpenAI-compatible) for `{ "reply", "components" }`.
3. Validates the components against the catalog's JSON Schemas plus structure and action rules (`src/validate.ts`). If invalid, sends the errors back once for repair; if still invalid, returns a safe fallback view. Nothing invalid leaves the service.
4. Streams AG-UI events: `RUN_STARTED`, one `CUSTOM` event named `a2ui.message` per A2UI message, the reply as a text message, `RUN_FINISHED` (or `RUN_ERROR` with a readable message).

Every log line is JSON and carries the run id as `traceId`, plus `promptVersion`.

## Configuration (environment only)

| Variable | Default | |
| --- | --- | --- |
| `LLM_API_KEY` | (required) | Groq API key. Never commit it. |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Any OpenAI-compatible endpoint |
| `LLM_MODEL` | `openai/gpt-oss-120b` | |
| `PORT` | `8090` | |
| `CATALOG_DIR` | `../../frontend/src/app/catalog/generated` | `/app/catalog` in the container |

Locally, put `LLM_API_KEY=...` in `services/agent-service/.env` (git-ignored); `npm run dev` loads it.

## Commands

| | |
| --- | --- |
| Install | `npm ci` |
| Run (watch) | `npm run dev` |
| Test | `npm test` |
| Type check | `npm run typecheck` |
| Build | `npm run build`, then `npm start` |

## Limits

Groq's free tier allows 8,000 tokens per minute for `openai/gpt-oss-120b`. One request uses about 3,300 prompt tokens plus the answer, so expect about two requests a minute; beyond that users see "The assistant is busy right now". A paid tier or a smaller model raises the limit.
