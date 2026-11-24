# Design mockups

Static HTML mockups of the main screens. Open any file in a browser. They use **mock data** and a **neutral stand-in look**, not the company component library.

| File | Screen | Related stories |
| --- | --- | --- |
| `01-dashboard-with-chat.html` | Default dashboard (hand-authored A2UI spec) with the assistant panel | E3-S1, E4-S2, E5-S5 |
| `02-generated-view.html` | View generated from a chat request, with "AI-generated layout" badge and Save view | E5-S5, E6-S1, E7-S3 |
| `03-order-ticket.html` | Locked OrderTicket at the Preview step, prepared by the assistant | E4-S4, E7-S1 |
| `04-copilot-mcp-app.html` | The MCP App widget inside a generic Copilot chat; orders confirmed back in the app | E8-S1, E8-S3 |

## Out of scope in these mockups

Predictions, holdings, quotes and today's movers were dropped (decision 2026-11-24). Where a mockup shows them (the Predictions nav item, Holdings and Today's movers on the dashboard, the predictions view in screen 2, the 30-day prediction in screen 3, Top holdings in screen 4), ignore those parts and follow the stories. Screen 2 is still the reference for a generated view's layout, badge and Save view.

## How to use them

- They show **layout, content and behaviour**, not code to copy. Build screens from `@app/ui` contract components and A2UI specs, never from these inline styles.
- Generated content (screen 2, the widget in screen 4) must come from the agent through A2UI, not be hard-coded.
- Numbers are invented. Real values come from the domain services via data bindings.
- The Copilot host chrome in screen 4 is generic, for illustration only.
