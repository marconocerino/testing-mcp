# Generative UI Trading App

See [CLAUDE.md](CLAUDE.md) for the architecture rules and [docs/](docs/) for epics, stories and decisions. The whole project lives in this one folder: the Angular workspace is at the root.

## Run

Needs Node `^22.12.0` (`.nvmrc` pins 22.13.1).

```sh
npm install                 # clean: no --force / --legacy-peer-deps
npx ng serve                # http://localhost:4200
npx ng test --watch=false
npx ng build
```

## Layout

- `src/app/catalog/`: the A2UI catalog. Each A2UI type maps to a library component (Angular Material stands in for the internal library). Strict validation is configured here.
- `src/app/spec/`: the hand-written A2UI spec from E0-S1 (layout plus data bindings) and its mock data
- `docs/`: stories, decisions, verifier notes

## Version matrix

Confirmed by E0-S1 on 2026-11-23. Use these exact versions until a decision in [docs/decisions.md](docs/decisions.md) changes them.

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
5. **Bundle size.** The initial bundle is 1.20 MB (252 kB gzipped), over Angular's default 1 MB budget. The biggest parts are A2UI (about 466 kB including `web_core`) and `katex` (261 kB, from CopilotKit's chat markdown). The error budget is raised to 1.5 MB. The real app should lazy-load the CopilotKit chat.
6. **`npm audit`.** `zod` 3.x (high), `dompurify` 3.4.11 via `@a2ui/markdown-it` (moderate XSS plus lows), `katex` (low), and `glob`/`minimatch` (CLI tooling only, not shipped). Flagged to security (E0-S4). Don't render agent text as markdown until DOMPurify is current.
