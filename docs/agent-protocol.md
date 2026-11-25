# Agent wire protocol (E3-S3)

How the Angular app's `HttpTransport` (`frontend/src/app/transport/http-transport.ts`) talks to the agent. The agent service (E5-S1) implements the server side. When the CopilotKit runtime arrives (E5-S4), the transport adapts to it behind the same `AgentTransport` interface; nothing else in the app changes.

## Request

`POST {endpoint}/runs` (the endpoint defaults to `/api/agent`)

Headers: `Content-Type: application/json`, `Accept: text/event-stream`, and `Last-Event-ID: <n>` when resuming.

```json
{
  "runId": "8d3c…",             // chosen by the client; the same id on every retry of a run
  "prompt": "Show my accounts", // for a request typed by the user, or…
  "action": { "name": "showAccount", "surfaceId": "main", "sourceComponentId": "accT", "context": { "accountId": "ACC-1" } },
  "context": { "surfaceId": "main" },
  "lastEventId": 2              // only when resuming: the last event id the client received
}
```

## Response

`200` with `Content-Type: text/event-stream`. Events:

| Event | `id` | `data` | Meaning |
| --- | --- | --- | --- |
| `a2ui` | Increasing integer per run | One A2UI v0.9 message (JSON) | Render this. Send messages as soon as they are ready, so the view builds up. |
| `done` | | `{}` | The run is complete. |
| `error` | | `{ "retryable": boolean }` | The run failed. Put details in server logs, not here: the client shows a generic message. |

Comment lines (`: keep-alive`) are ignored and can keep idle connections open.

## Resuming

If the stream breaks before `done`, the client retries the same `runId` with `lastEventId` (and the `Last-Event-ID` header), after an exponential backoff: 0.5 s, 1 s, 2 s… up to 15 s, ±25 % jitter, 6 retries. The server should continue after that id. Replaying events the client already has is safe: it skips ids it has seen.

## Status codes

| Status | Client behaviour |
| --- | --- |
| 408, 429, 5xx, network failure, stream ends without `done` | Retry with backoff, show a "reconnecting" banner |
| 401, 403 | Stop: "You're not allowed to use the assistant." |
| 404 | Stop: "The assistant isn't available right now." |
| Other 4xx | Stop: "The assistant couldn't process that request." |

## Rules the server must follow

- Messages contain layout and data bindings only. No balances, prices or transactions (rule 5); the app fills the data model itself.
- Every component must pass the catalog schema (`frontend/src/app/catalog/generated/catalog.json`). The client validates again before rendering.
- A new prompt from the same client cancels the previous run (the client aborts the request).
