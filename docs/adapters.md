# Writing a catalog adapter (E1-S2)

An adapter makes one A2UI component type renderable. It turns the props in a spec into inputs on one `@app/ui` element, and nothing else. Every v1 type in [catalog-v1.md](catalog-v1.md) gets one.

```
spec  { "component": "Button", "variant": "primary", "child": "l", "action": {…} }
  → catalog.ts                type name → adapter
  → button.adapter.ts         props → <ui-button>, click → A2UI action
  → @app/ui  ui-button        <ui-button> → library component (Material today, ftmkit later)
```

The reference adapters are [card.adapter.ts](../frontend/src/app/catalog/card.adapter.ts) (children) and [button.adapter.ts](../frontend/src/app/catalog/button.adapter.ts) (props and actions). Copy the closer one.

## Steps

1. **Wrapper.** Add `ui-<name>.component.ts` to `frontend/src/ui/stand-in/` and export it from its `index.ts`. Use the library component from the "Library selectors" table in [catalog-v1.md](catalog-v1.md). The wrapper owns all library details (selectors, appearance names, theming). Its inputs and outputs are the `@app/ui` contract, so the ftmkit version later must have the same ones.
2. **Adapter.** Add `<name>.adapter.ts` to `frontend/src/app/catalog/`:
   - extend `CatalogAdapter<typeof XxxApi>` ([adapter.ts](../frontend/src/app/catalog/adapter.ts));
   - import UI only from `@app/ui` (rule 1);
   - selector `app-catalog-<name>`, `ChangeDetectionStrategy.OnPush`.
3. **Register** it in [catalog.ts](../frontend/src/app/catalog/catalog.ts): `{ ...XxxApi, component: XxxAdapterComponent }`. The type name comes from the API object, so it must be on the v1 list.
4. **Test** it in `frontend/src/app/catalog/adapters.spec.ts` (or a file next to it): required props, optional props and their defaults, a data-bound prop that changes, children if it has any, and each action.
5. **Gallery sample.** Add `frontend/src/app/dev/catalog-gallery/samples/<name>.json` with a `default`, an `edge` and an `invalid` sample, and import it in `samples.ts`. The gallery test fails until every catalog type has one. Check it at `/dev/catalog` under `npx ng serve`.

## The three things an adapter does

**Props.** `this.prop<T>('name', fallback)` returns a signal with the prop's value, or `fallback` when the spec leaves it out. If the spec binds the prop to the data model (`{ "path": "/account/name" }`), the signal follows that path, so the component updates when the data changes and the spec is never resent.

```ts
protected readonly variant = this.prop<UiButtonVariant>('variant', 'default');
```

**Children.** Child ids come from `this.props().child?.value()` (one child) or `children` (a list). Render each with the A2UI host inside the `ui-*` element, where the library expects content:

```html
<ui-card>
  @if (child(); as c) {
    <a2ui-v09-component-host [componentKey]="c" [surfaceId]="surfaceId()" />
  }
</ui-card>
```

**Input values.** For inputs, call `this.write('value', newValue)` before dispatching. It writes to the data-model path the spec bound the prop to (a literal value is left alone), so the action's context sees the new value.

**Actions.** When the user does something, call `this.dispatch('action')`. It emits the spec's action with its context resolved from the data model at that moment, for example `{ name: "openOrderTicket", context: { accountId: "ACC-1" } }`. The renderer passes it to the `actionHandler` in the A2UI config, which routes it to an allow-listed handler (E4).

```html
<ui-button [variant]="variant()" (pressed)="dispatch()">…</ui-button>
```

## Rules

- **No service calls.** Adapters never inject `HttpClient`, the router, the agent transport or domain services. Everything leaves through an action.
- **No library imports.** Only `@app/ui`. Library details belong in the wrapper.
- **No HTML from specs.** Text is rendered as text (`{{ }}`), never with `innerHTML` or markdown.
- **No custom styling** of library components in adapters. Styling lives in the wrapper and the library theme.
- **No trading.** No action an adapter emits can place, modify or cancel an order (rule 4). Orders only go through `OrderTicket`'s confirm step.

## Writing a schema (our own types)

Our types' schemas live in [schemas.ts](../frontend/src/app/catalog/schemas.ts). A2UI decides which props to resolve from the schema, so:

- Bindable props use the `Dynamic*` schemas with a `REF:#/$defs/<Def>|<description>` description (the `dynString`, `bound` and `action` helpers). A prop typed as a bare `DataBindingSchema` is **not** resolved and can't be written.
- Values that are financial data (figures, rows) use `bound(...)`, which rejects literals (rule 5).
- Every object is `.strict()`. Keep lists bounded (`.min()`, `.max()`) and prefer enums over free strings.
- Formatting is a `format` prop handled by [format.ts](../frontend/src/app/catalog/format.ts), never done by the spec.

## Testing

Use the harness in [testing/surface-harness.ts](../frontend/src/app/catalog/testing/surface-harness.ts): it renders components through the real catalog with strict validation and records every action. Each adapter's tests cover its required props (missing or invalid ones are rejected), optional props and defaults, a bound value that changes, and each action. To trigger an input, emit the `@app/ui` wrapper's output (for example `valueChange`) rather than driving Material's overlay.

## Notes from building the reference adapters

- A2UI's `Button` schema **requires** `action`. A spec with a button and no action is rejected when it is processed, so every button reports through an action.
- Actions reach the adapter as ready-to-call functions with their context already bound; `dispatch()` just calls them. Don't resolve paths yourself.
