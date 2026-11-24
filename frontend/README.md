# frontend

The Angular app. Renders A2UI surfaces through our catalog. Every UI component comes from `@app/ui` (CLAUDE.md rule 1).

- `src/ui/stand-in/`: the `@app/ui` contract, implemented with Angular Material as a stand-in for the internal library. It is the only place allowed to import `@angular/material` or `@angular/cdk` (no linter checks this, so watch for it in review). The `@app/ui` path alias is in `tsconfig.json`.
- `src/app/catalog/`: the A2UI catalog. One adapter per A2UI type (`card.adapter.ts`, `text.adapter.ts`), plus strict spec validation.
- `src/app/spec/`: the hand-written spec from E0-S1 and its mock data.

Commands are in the [root README](../README.md#commands). `docker build .` produces an nginx image serving the production build.
