# A2UI catalog v1: component list (E1-S1)

**Status:** Draft for sign-off (2026-11-24). Catalog id `urn:trading-app:catalog:v1`.

This is the complete set of component types a spec may use in v1. Anything not listed here is rejected by strict validation (CLAUDE.md rule 1). The machine-readable copy of the type names is [`frontend/src/app/catalog/catalog-v1.ts`](../frontend/src/app/catalog/catalog-v1.ts); a test fails if the catalog registers a type that is not on this list.

## How the list was chosen

From the screens that remain in scope after market data and predictions were dropped (decision 2026-11-24):

- **Dashboard** (E4-S2, mockup 01): total balance and cash tiles, accounts summary, recent orders with status, "New order" button.
- **Accounts and transactions** (E4-S3): accounts table, paginated transactions table, date-range filter, account selection.
- **Order ticket** (E4-S4, mockup 03): locked three-step flow.
- **Generated views** (E5-S5, mockup 02): accounts table, spending breakdown, follow-ups.
- **MCP App widget** (E8, mockup 04): spending breakdown, prepared-order summary, link back to the app.
- **Empty states** (E4-S2, E4-S6).

Rules applied:

- 15 types, inside the 10-15 limit, so the model has a small catalog to choose from.
- Where A2UI's basic catalog already defines a type with the props we need, we reuse its schema and name: `Column`, `Row`, `Card`, `Divider`, `Button`. Models have seen these names, and the schemas are already strict. A2UI's `Text` and `DateTimeInput` are not reused: `Text` in A2UI 0.14 allows markdown and has no heading variant, and `DateTimeInput` carries time options we don't need.
- Trading-specific types (`Stat`, `KeyValueList`, `Table`, `OrderTicket`) are our own schemas, written in E1-S4.
- Formatting (currency, percent, date) is a `format` prop on the component, not A2UI functions, so specs stay data-free (rule 5) and validation stays simple.
- No component takes raw HTML, markdown, URLs or images (see the `npm audit` decision: agent text is rendered as plain text).

## The list

`ui-*` is our `@app/ui` contract selector; the adapter only ever renders that. The **internal library** column is what the ftmkit implementation of `@app/ui` wraps. Only `FttButton` and `FttNumericInput` are known so far; the rest are **TBD** until the ftmkit typings are reviewed with the design owner.

| # | A2UI type | Model-facing description | Schema | `@app/ui` selector | Internal library (ftmkit) | Used by |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `Column` | Use Column to stack components vertically; it is the usual root of a view. | A2UI basic | `ui-stack` (vertical) | TBD (layout primitive or CSS flex in the wrapper) | All screens |
| 2 | `Row` | Use Row to place 2-4 components side by side, such as stat tiles or buttons. | A2UI basic | `ui-stack` (horizontal) | TBD | Dashboard tiles, button bars |
| 3 | `Card` | Use Card to group one section of a view under a single surface; put a Column inside for several children. | A2UI basic | `ui-card` | TBD (card) | All screens |
| 4 | `Text` | Use Text for headings, labels and short plain-text sentences; never for numbers that come from data, use Stat or KeyValueList. | Own (`variant`: `title`, `heading`, `body`, `caption`) | `ui-text` | TBD (typography) | All screens |
| 5 | `Divider` | Use Divider to separate groups inside a Card. | A2UI basic | `ui-divider` | TBD (divider) | Order summary, cards |
| 6 | `Stat` | Use Stat for one headline figure with a label and optional change, such as total balance or cash. | Own | `ui-stat` | TBD (metric/KPI tile, else composed in wrapper) | Dashboard tiles |
| 7 | `KeyValueList` | Use KeyValueList for 2-8 labelled values, such as an order summary or spending by category. | Own | `ui-key-value-list` | TBD (description list) | Spending breakdown, prepared order, order preview |
| 8 | `Table` | Use Table for lists of 5+ comparable items with the same fields, such as accounts, transactions or orders. | Own | `ui-table` | TBD (data table) | Accounts, transactions, orders, generated views |
| 9 | `Badge` | Use Badge for a short status label, such as an order status or "Paper trading". | Own | `ui-badge` | TBD (badge/chip/tag) | Order status, table cells |
| 10 | `Alert` | Use Alert for a message the user must notice: a warning, an error or a required disclaimer. | Own | `ui-alert` | TBD (inline alert/banner) | Order warnings, disclaimers, errors |
| 11 | `EmptyState` | Use EmptyState when a section has no data yet, with a short explanation and one next step. | Own | `ui-empty-state` | TBD (empty state) | Dashboard, accounts (E4-S2 AC) |
| 12 | `Button` | Use Button for an action the user starts, such as "View all" or "New order"; it never places a trade. | A2UI basic | `ui-button` | `FttButton` | All screens |
| 13 | `Select` | Use Select to pick one value from a short fixed list, such as an account or transaction type. | Own | `ui-select` | TBD (select/dropdown) | Transaction filters |
| 14 | `DateField` | Use DateField to pick a date, for example the start or end of a transaction filter. | Own | `ui-date-field` | TBD (date picker) | Transaction date-range filter (E4-S3) |
| 15 | `OrderTicket` | Use OrderTicket to start an order; you may pre-fill instrument, side, quantity and type, nothing else. | Own (locked) | composed from `ui-*` inputs | `FttNumericInput` (quantity) plus TBD | Order ticket (E4-S4), trading requests (E5-S5) |

### Props at a glance

Full schemas with descriptions, enums and defaults are E1-S4. This is the agreed shape to build against.

| A2UI type | Props |
| --- | --- |
| `Column`, `Row` | `children`, `justify`, `align` (A2UI basic) |
| `Card` | `child` (A2UI basic) |
| `Text` | `text` (string or binding), `variant` |
| `Divider` | `axis` (A2UI basic) |
| `Stat` | `label`, `value` (binding), `format` (`currency`, `number`, `percent`), `change` (binding, optional), `currency` (binding, optional) |
| `KeyValueList` | `items`: list of `{ label, value (binding), format }`, max 8 |
| `Table` | `rows` (binding to a list), `columns`: list of `{ key, header, format (text, currency, number, percent, date, status), align }`, `pageSize` (optional), `rowAction` (optional action) |
| `Badge` | `text` (string or binding), `tone` (`neutral`, `info`, `success`, `warning`, `danger`) |
| `Alert` | `tone` (`info`, `warning`, `danger`), `title` (optional), `text`, or `disclaimerId` (text loaded from the central store, E7-S3) |
| `EmptyState` | `title`, `text`, `action` (optional, one action) |
| `Button` | `child`, `variant`, `action` (A2UI basic; actions go only to allow-listed handlers) |
| `Select` | `label`, `options` (list of `{ value, label }`), `value` (binding) |
| `DateField` | `label`, `value` (binding, ISO date), `min`, `max` |
| `OrderTicket` | `instrument`, `side` (`buy`, `sell`), `quantity`, `orderType` (`market`, `limit`): all optional pre-fill values. No children, no actions |

## Components that need a special adapter approach

| A2UI type | Why it is not a plain prop mapping | Adapter approach |
| --- | --- | --- |
| `Card`, `Column`, `Row` | Render other components (content projection). | Adapter renders `<a2ui-v09-component-host>` for each child id inside the `ui-*` wrapper's `<ng-content>`, as the existing Card adapter does (E1-S2 reference). |
| `Button` | Child component plus a click callback. | Child via component host. The click dispatches the A2UI `action` through the renderer; the adapter never calls a service (E1-S2 AC). |
| `Table` | Data tables usually take cell templates and sort/page callbacks. | No templates from specs. The adapter builds the table from the `columns` config and formats each cell by `format` (`status` renders a Badge inside the wrapper). Paging is local to the adapter; row clicks dispatch `rowAction` with the row id as payload. |
| `KeyValueList`, `Stat` | The library may have no direct equivalent. | If ftmkit lacks one, the `@app/ui` wrapper composes it from library typography and layout; specs don't change. |
| `Select`, `DateField` | Two-way value binding and change callbacks. | Adapter writes the new value back to the bound data-model path; filtering is done by an allow-listed handler reacting to that path (E4-S3). |
| `Alert` with `disclaimerId` | Text must come from compliance, not the spec (E7-S3). | Adapter looks up the id in the central disclaimer store; unknown ids fail validation. Specs cannot supply disclaimer text. |
| `OrderTicket` | Must be locked (E4-S4, rule 4): the agent may pre-fill but not change structure or actions. | One composite catalog type. Its internal steps (enter, preview, confirm) are a fixed Angular component built from `@app/ui` inputs, not a spec tree. Preview and place go through the orders service with the verifier pre-action check (rule 7); no spec action can reach them. |

## Considered and left out of v1

| Type | Why left out |
| --- | --- |
| `Chart` | Its use cases (price history, predictions) were dropped. Spending breakdowns fit `KeyValueList`. Revisit when a screen needs a trend. |
| `Tabs`, `Modal` | No v1 screen needs them; navigation is the shell's job (E3). |
| `List` | `Table` and `KeyValueList` cover every list in the mockups with stricter shapes. |
| `TextField` | Free-text entry is only needed inside `OrderTicket`, which uses its own fixed inputs. Chat input is the CopilotKit panel, not the catalog. |
| `NumberField` | Same: quantity entry lives inside `OrderTicket`. Can be promoted later (wraps `FttNumericInput`). |
| `CheckBox`, `ChoicePicker`, `Slider` | No v1 screen needs them. |
| `Image`, `Icon`, `Video`, `AudioPlayer` | Not needed, and URLs from agent output are an injection risk. |
| `Stepper` | Only the order ticket has steps, and those live inside `OrderTicket`. |
| "AI-generated layout" badge, Save view, Discard | Shell chrome around a generated surface (E5-S5, E6-S1, E7-S3), not something a spec may place or omit. |

## Open before sign-off

- [ ] Fill in the **Internal library** column from the ftmkit typings (needs the package or its docs).
- [ ] Design owner confirms ftmkit has (or will wrap) a data table, badge, alert, empty state, select and date picker.
- [ ] Compliance confirms disclaimers come from a central store referenced by id (`Alert.disclaimerId`, E7-S3).

## Sign-off

| Role | Name | Date |
| --- | --- | --- |
| Tech lead | | |
| Library design owner | | |
