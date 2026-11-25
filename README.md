# Generative UI Trading App

A trading app whose screens are generated as A2UI specs and rendered with approved components. See [CLAUDE.md](CLAUDE.md) for the architecture rules and [docs/](docs/) for stories, decisions and design mockups.

## Packages

Every backend component is its own microservice in its own folder, with its own container.

| Folder | What it is | Stack | Port |
| --- | --- | --- | --- |
| [frontend/](frontend/) | Angular app: shell, A2UI surface, catalog adapters, `@app/ui` contract | Angular 21, `@a2ui/angular` 0.14.0 | 4200 |
| [services/accounts-service/](services/accounts-service/) | Accounts, balances, transactions (mock) | Spring Boot 4.2, Java 21 | 8081 |
| [services/orders-service/](services/orders-service/) | Order preview, paper trading, list, cancel (mock) | Spring Boot 4.2, Java 21 | 8082 |
| [services/agent-service/](services/agent-service/) | Generates A2UI specs on the internal LLM (E5) | Placeholder, language undecided | |
| [services/mcp-server/](services/mcp-server/) | MCP App for Microsoft 365 Copilot (E8) | Placeholder, language undecided | |

All data is mock data until security and compliance sign off (CLAUDE.md rule 6).

## Commands

| | Frontend (`cd frontend`) | Each service (`cd services/<name>`) |
| --- | --- | --- |
| Install | `npm ci` | (Maven wrapper downloads on first run) |
| Lint | (none) | `./mvnw spotless:check` (fix: `./mvnw spotless:apply`) |
| Test | `npx ng test --watch=false` | `./mvnw test` |
| Build | `npx ng build` | `./mvnw package` |
| All checks | | `./mvnw verify` (tests + lint + build) |
| Run | `npx ng serve` | `./mvnw spring-boot:run` |

**Everything at once (local dev environment):** `docker compose up --build`. Frontend on http://localhost:4200, services on ports 8081 and 8082 (`/actuator/health`).

**Catalog gallery (dev only):** with `npx ng serve`, open http://localhost:4200/dev/catalog to see every catalog component rendered from the sample specs in `frontend/src/app/dev/catalog-gallery/samples/`. Production builds, including the compose image, leave the page out.

Requirements: Node `^22.12.0` (`frontend/.nvmrc`), JDK 21 (Amazon Corretto) for running services outside Docker, Docker for compose.

## Secrets

None in the repo. Services read secrets from environment variables, which come from the company secret manager in deployed environments. [.env.example](.env.example) lists the variable names; `.env` is git-ignored.

## Version matrix

Frontend versions, confirmed by E0-S1 on 2026-11-23. Use these exact versions until a decision in [docs/decisions.md](docs/decisions.md) changes them.

| Component | Version | Constraint that sets it |
| --- | --- | --- |
| `@a2ui/angular` | **0.14.0** | Mandated. Needs Angular `^21.2.5` |
| `@a2ui/web_core` | 0.14.0 | Peer of `@a2ui/markdown-it` 0.2.2. `@a2ui/angular` also installs its own 0.15.0 (see known issues) |
| `@a2ui/markdown-it` | 0.2.2 | Required peer of `@a2ui/angular` 0.14.0 |
| Angular (`core`, `common`, `compiler`, `forms`, `platform-browser`, `router`, `compiler-cli`) | **21.2.26** | `@a2ui/angular` 0.14.0 needs `^21.2.5`; latest 21.2 patch |
| Angular CLI / `@angular/build` | 21.2.31 | Latest 21.2 tooling |
| Angular CDK | 21.2.14 | Latest 21.2; CopilotKit 0.3.1 accepts `^20 \|\| ^21 \|\| ^22` |
| Internal component library | *Stand-in:* Angular Material 21.2.14 | Real library not available yet. Its Angular peer range must include 21.2 |
| `@copilotkit/angular` | **0.3.1** | Last release that supports Angular 21. 0.4.0+ (including 0.6.0) needs Angular 22 |
| Node.js | 22.13.1 (`.nvmrc`) | Angular 21 needs `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` |
| npm | 10.9.x | Works thanks to the Vite pin below |
| TypeScript | 5.9.x | From Angular 21 |
| Vitest / Vite | 4.1.12 / 7.3.8 | Vite pinned through `overrides` to the version Angular 21.2 uses |

### Known issues

1. **`@copilotkit/angular` 0.6.0 is not possible with `@a2ui/angular` 0.14.0.** A2UI 0.14.0 needs Angular 21 and CopilotKit 0.6.0 needs Angular 22, so npm refuses the combination. We use CopilotKit 0.3.1. Moving to CopilotKit ≥ 0.4 means moving A2UI to ≥ 0.15 and Angular to 22.
2. **Two `web_core` copies for A2UI.** `@a2ui/angular` 0.14.0 depends on `web_core` ^0.15.0, but `@a2ui/markdown-it` 0.2.2 only accepts ^0.14.0. The renderer runs on 0.15.0, and the markdown plugin and our imports use 0.14.0. CopilotKit adds a third copy (0.10.4), which we never use.
3. **Strict validation must be configured.** `web_core` 0.14 does not export `STRICT_VALIDATION`, and by default unknown component types are only logged, not rejected. We pass our own `STRICT_SPEC_VALIDATION` (rule 1). Undeclared props are always rejected because catalog schemas are `.strict()`.
4. **npm 10 crash without the Vite pin.** Vitest's peer range otherwise pulls Vite 8, and npm 10.9 crashes with `Cannot read properties of null (reading 'edgesOut')`. The `overrides` entry in `package.json` prevents this.
5. **Bundle size.** The initial bundle is 1.76 MB (352 kB gzipped), over Angular's default 1 MB budget. About 470 kB is CopilotKit (with `katex` and `highlight.js` from its chat markdown), loaded upfront only to prove it starts; about 490 kB is the Material stand-in for the catalog. The error budget is 2 MB. E5 should lazy-load the CopilotKit chat (the bundle is 1.29 MB without it).
6. **`npm audit`.** `zod` 3.x (high), `dompurify` 3.4.11 via `@a2ui/markdown-it` (moderate XSS plus lows), `katex` (low), and `glob`/`minimatch` (CLI tooling only, not shipped). Flagged to security (E0-S4). Don't render agent text as markdown until DOMPurify is current.
