# Generative UI Trading App

A trading app (accounts, orders, predictions) whose screens are **generated as A2UI specs** and rendered with our **internal Angular component library**. It runs as a web app first, and later inside Microsoft 365 Copilot as an **MCP App**.

## Where things are

- `docs/architecture.md`: architecture and diagrams (exported from the architecture doc)
- `docs/stories/E0.md` … `E8.md`: epics and stories with acceptance criteria
- `docs/verifier.md`: how the internal verifier SDK works and how we use it
- `docs/decisions.md`: decisions made during the project (add to it, never rewrite history)
- `docs/design/`: static HTML mockups of the main screens; see `docs/design/README.md` for which story each one belongs to

## Designs

- Before building a screen, open the matching mockup in `docs/design/` and follow its layout, content and behaviour.
- The mockups use mock data and a stand-in look. Do not copy their inline styles or markup: build with `@app/ui` components and A2UI specs.
- Anything the agent generates in a mockup (generated views, the Copilot widget) must come from A2UI at runtime, never be hard-coded.
- If a mockup and a story's acceptance criteria disagree, the acceptance criteria win; note the difference in `docs/decisions.md`.

## Architecture rules (never break these)

1. **Components only through `@app/ui`.** Everything rendered goes through the A2UI catalog, and catalog adapters, screens and the shell import UI components only from `@app/ui` (our wrapper contract). `@app/ui` points to a stand-in library during development and to the internal company library in the real build. Never import the stand-in or company library directly. Specs that use anything outside the catalog are rejected.
2. **One agent service, two entry points.** The UI-generating agent runs on the internal LLM platform. The CopilotKit runtime (web) and the MCP server (Copilot) both call the same `generate_view`.
3. **Transport behind an interface.** Angular code talks to the agent only through `AgentTransport`. No `HttpClient`, `fetch`, `EventSource` or `postMessage` for agent traffic anywhere else.
4. **The AI designs views; it never places trades.** No agent or MCP tool can place, modify or cancel an order. Orders go only through the locked OrderTicket confirm step with server-side validation.
5. **Layout and data are separate.** Specs contain data bindings, never balances, prices or transactions. Saved layouts store structure only.
6. **Mock data until approved.** No real bank or market data in any environment until security and compliance sign off.
7. **Verifier.** Important actions are recorded with the internal verifier SDK. Risky actions (prepare, place, cancel, anything that moves money) get a pre-action check first and stop on deny or timeout. Blocks hold digests, never raw financial data. See `docs/verifier.md`.

## Tech stack

- Angular (version: see the version matrix in `docs/decisions.md`, set by story E0-S1)
- Internal component library: `<@company/package-name>` (types and README are in `node_modules/<@company/package-name>`; read them before writing adapters)
- `@a2ui/angular`, `@a2ui/web_core`
- `@copilotkit/angular`, `@copilotkit/runtime` (self-hosted only, no CopilotKit cloud)
- Internal LLM platform: `<endpoint name>`, configured through environment variables only
- MCP: official MCP SDK + MCP Apps extension (`@modelcontextprotocol/ext-apps`)
- Backend: one microservice per folder under `services/`, each in its own container. Domain services (accounts, orders) are mock Spring Boot 4.2 services on Java 21, running on Amazon Corretto 21.0.10. Frontend in `frontend/` is Angular only.

## Commands

Frontend (run in `frontend/`):
- Install: `npm ci`
- Build: `npx ng build`
- Test: `npx ng test --watch=false`
- Lint: none (no frontend linter)

Each Spring Boot service (run in `services/<name>/`):
- Build: `./mvnw package`
- Test: `./mvnw test`
- Lint: `./mvnw spotless:check` (fix with `./mvnw spotless:apply`)
- All checks: `./mvnw verify`

Everything locally: `docker compose up --build` from the repo root.

## How to work on a story

1. Read the story in `docs/stories/` and check its dependencies in `docs/architecture.md`.
2. Plan first. List the files you will change and the test for each acceptance criterion.
3. Write or update tests for every acceptance criterion, then implement.
4. Run lint and tests. Do not mark a story done with failing tests.
5. Record any decision (version choices, conventions, open questions answered) in `docs/decisions.md`.

## Conventions

- Never commit secrets. Credentials come from the company secret manager via environment variables.
- Keep the A2UI catalog schema as the single source of truth for validation, the agent prompt and MCP tool definitions.
- Story IDs (for example `E1-S2`) go in branch names and commit messages.
