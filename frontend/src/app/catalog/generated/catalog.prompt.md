# UI component catalog urn:trading-app:catalog:v1 (schema 1.0.0, A2UI v0.9)

## Rules

- Start every surface with createSurface and catalogId "urn:trading-app:catalog:v1". Specs for another catalog id are rejected.
- Use only the components listed below, with only the props listed. Anything else is rejected.
- Components are a flat list. Exactly one has the id "root"; every other component is referenced as a child exactly once, by id.
- Never write balances, prices, quantities held or transactions into a spec. Bind them to the data model with {"path": "/..."}. Props marked "binding only" reject literal values.
- Text is plain text: no HTML, markdown, links or images.
- You design views; you never place, change or cancel orders. OrderTicket only takes pre-fill values.
- Every component also takes `id` (string, required) and `component` (its type name, required).

## Layout

### Column

Use Column to stack components vertically; it is the usual root of a view.

- `children` (list of component ids, required): Defines the children. Use an array of strings for a fixed set of children, or a template object to generate children from a data list. Children cannot be defined inline, they must be referred to by ID.
- `justify` (one of "start" | "center" | "end" | "spaceBetween" | "spaceAround" | "spaceEvenly" | "stretch", optional, default "start"): Defines the arrangement of children along the main axis (vertically). Use 'spaceBetween' to push items to the edges (e.g. header at top, footer at bottom), or 'start'/'end'/'center' to pack them together.
- `align` (one of "center" | "end" | "start" | "stretch", optional, default "stretch"): Defines the alignment of children along the cross axis (horizontally). This is similar to the CSS 'align-items' property.
- `weight` (number, optional): The relative weight of this component within a Row or Column. This is similar to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct descendant of a Row or Column.

### Row

Use Row to place 2-4 components side by side, such as stat tiles or buttons.

- `children` (list of component ids, required): Defines the children. Use an array of strings for a fixed set of children, or a template object to generate children from a data list. Children cannot be defined inline, they must be referred to by ID.
- `justify` (one of "center" | "end" | "spaceAround" | "spaceBetween" | "spaceEvenly" | "start" | "stretch", optional, default "start"): Defines the arrangement of children along the main axis (horizontally). Use 'spaceBetween' to push items to the edges, or 'start'/'end'/'center' to pack them together.
- `align` (one of "start" | "center" | "end" | "stretch", optional, default "stretch"): Defines the alignment of children along the cross axis (vertically). This is similar to the CSS 'align-items' property, but uses camelCase values (e.g., 'start').
- `weight` (number, optional): The relative weight of this component within a Row or Column. This is similar to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct descendant of a Row or Column.

### Card

Use Card to group one section of a view under a single surface; put a Column inside for several children.

- `child` (component id, required): The ID of the single child component to be rendered inside the card. To display multiple elements, you MUST wrap them in a layout component (like Column or Row) and pass that container's ID here. Do NOT pass multiple IDs or a non-existent ID.
- `weight` (number, optional): The relative weight of this component within a Row or Column. This is similar to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct descendant of a Row or Column.

### Divider

Use Divider to separate groups inside a Card.

- `axis` (one of "horizontal" | "vertical", optional, default "horizontal"): The orientation of the divider.
- `weight` (number, optional): The relative weight of this component within a Row or Column. This is similar to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct descendant of a Row or Column.

## Content

### Text

Use Text for headings, labels and short plain-text sentences; never for numbers that come from data, use Stat or KeyValueList.

- `text` (text, or a binding {"path": "/..."}, required): The text to show. Plain text only: no markdown or HTML.
- `variant` (one of "title" | "heading" | "body" | "caption", optional, default "body"): 'title' for the page or view title, 'heading' for a section heading, 'caption' for small print.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

### Stat

Use Stat for one headline figure with a label and optional change, such as total balance or cash.

- `label` (text, or a binding {"path": "/..."}, required): What the figure is, such as "Total balance".
- `value` (binding only: {"path": "/..."}, required): The figure, bound to a number in the data model.
- `format` (one of "number" | "currency" | "percent", optional, default "number"): How to display value and change.
- `currency` (text, or a binding {"path": "/..."}, optional): ISO 4217 currency code for `currency` values. Defaults to USD.
- `change` (binding only: {"path": "/..."}, optional): Optional change since the previous period, bound to a number, shown in the same format as value.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

### KeyValueList

Use KeyValueList for 2-8 labelled values, such as an order summary or spending by category.

- `items` (list of objects, 1 to 8 items, required): The labelled values, 1 to 8.
  - `label` (text, or a binding {"path": "/..."}, required): The label, such as "Fees".
  - `value` (binding only: {"path": "/..."}, required): The value, bound to the data model.
  - `format` (one of "text" | "number" | "currency" | "percent" | "date", optional, default "text"): How to display the value.
- `currency` (text, or a binding {"path": "/..."}, optional): ISO 4217 currency code for `currency` values. Defaults to USD.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

### Table

Use Table for lists of 5+ comparable items with the same fields, such as accounts, transactions or orders.

- `rows` (binding only: {"path": "/..."}, required): The rows: bind to a list of objects in the data model.
- `columns` (list of objects, 1 to 8 items, required): The columns, 1 to 8.
  - `key` (string, required): Field of each row object to show in this column.
  - `header` (string, required): Column header.
  - `format` (one of "text" | "number" | "currency" | "percent" | "date" | "status", optional, default "text"): How to display the cells. 'status' shows a coloured badge.
  - `align` (one of "start" | "end", optional, default "start"): Use 'end' for numbers.
- `currency` (text, or a binding {"path": "/..."}, optional): ISO 4217 currency code for `currency` values. Defaults to USD.
- `pageSize` (integer 5 to 50, optional, default 10): Rows per page.
- `rowKey` (string, optional, default "id"): Row field that identifies a row.
- `selection` (text, or a binding {"path": "/..."}, optional): Where to write the rowKey of the row the user picks. Bind it to a data-model path.
- `rowAction` (action {"event": {"name": "...", "context": {...}}}, optional): Emitted when the user picks a row, after selection is written.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

### Badge

Use Badge for a short status label, such as an order status or "Paper trading".

- `text` (text, or a binding {"path": "/..."}, required): The short label, such as an order status.
- `tone` (one of "neutral" | "info" | "success" | "warning" | "danger", optional, default "neutral"): Colour meaning of the badge.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

### Alert

Use Alert for a message the user must notice: a warning, an error or a required disclaimer.

- `tone` (one of "info" | "warning" | "danger", optional, default "info"): How serious the message is.
- `title` (text, or a binding {"path": "/..."}, optional): Optional short title.
- `text` (text, or a binding {"path": "/..."}, optional): The message. Leave out when using disclaimerId.
- `disclaimerId` (one of "paper-trading" | "ai-generated", optional): Show an approved disclaimer from the central store instead of text. Never write disclaimer text yourself.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

### EmptyState

Use EmptyState when a section has no data yet, with a short explanation and one next step.

- `title` (text, or a binding {"path": "/..."}, required): What is empty, such as "No orders yet".
- `text` (text, or a binding {"path": "/..."}, optional): One sentence on what the user can do.
- `actionLabel` (text, or a binding {"path": "/..."}, optional): Label of the one next-step button. Needs action.
- `action` (action {"event": {"name": "...", "context": {...}}}, optional): The next step, emitted when the button is pressed.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

## Inputs

### Button

Use Button for an action the user starts, such as "View all" or "New order"; it never places a trade.

- `child` (component id, required): The ID of the child component. Use a 'Text' component for a labeled button. Only use an 'Icon' if the requirements explicitly ask for an icon-only button.
- `variant` (one of "default" | "primary" | "borderless", optional, default "default"): A hint for the button style. If omitted, a default button style is used. 'primary' indicates this is the main call-to-action button. 'borderless' means the button has no visual border or background, making its child content appear like a clickable link.
- `action` (action {"event": {"name": "...", "context": {...}}}, required): What happens when the button is pressed. A button never places, changes or cancels an order.
- `weight` (number, optional): The relative weight of this component within a Row or Column. This is similar to the CSS 'flex-grow' property. Note: this may ONLY be set when the component is a direct descendant of a Row or Column.

### Select

Use Select to pick one value from a short fixed list, such as an account or transaction type.

- `label` (text, or a binding {"path": "/..."}, required): Field label.
- `options` (list of objects, 1 to 50 items, required): The choices, 1 to 50.
  - `value` (string, required): Value written to the bound path when this option is picked.
  - `label` (text, or a binding {"path": "/..."}, required): Option text.
- `value` (text, or a binding {"path": "/..."}, required): The selected value. Bind it to a data-model path so the choice is written there.
- `action` (action {"event": {"name": "...", "context": {...}}}, optional): Optional, emitted after the value changes (for example to filter a list).
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

### DateField

Use DateField to pick a date, for example the start or end of a transaction filter.

- `label` (text, or a binding {"path": "/..."}, required): Field label.
- `value` (text, or a binding {"path": "/..."}, required): The date as YYYY-MM-DD. Bind it to a data-model path so the choice is written there.
- `min` (date string YYYY-MM-DD, optional): Earliest allowed date, YYYY-MM-DD.
- `max` (date string YYYY-MM-DD, optional): Latest allowed date, YYYY-MM-DD.
- `action` (action {"event": {"name": "...", "context": {...}}}, optional): Optional, emitted after the date changes.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.

## Trading

### OrderTicket

Use OrderTicket to start an order; you may pre-fill instrument, side, quantity and type, nothing else.

- `instrument` (string matching ^[A-Z][A-Z0-9.]{0,9}$, optional): Instrument symbol to pre-fill, such as "ALPN".
- `side` (one of "buy" | "sell", optional): Side to pre-fill.
- `quantity` (integer >0 to 1000000, optional): Quantity to pre-fill.
- `orderType` (one of "market" | "limit", optional): Order type to pre-fill.
- `weight` (number, optional): Relative weight inside a Row or Column, like CSS 'flex-grow'. Only for direct children of a Row or Column.
