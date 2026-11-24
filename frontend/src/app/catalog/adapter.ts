import { computed, Signal } from '@angular/core';
import { CatalogComponent } from '@a2ui/angular';
import type { ComponentApi } from '@a2ui/web_core/v0_9';

/**
 * Base class for every catalog adapter (E1-S2). An adapter maps one A2UI component type to
 * one `@app/ui` element. It only:
 *
 * 1. reads props with {@link prop}, which follow data bindings reactively;
 * 2. renders children by id with `<a2ui-v09-component-host>` inside the `ui-*` element;
 * 3. reports user interactions with {@link dispatch}, which emits the spec's A2UI action.
 *
 * Adapters never call services, the agent or the router: an action goes to the renderer's
 * action handler, which routes it to an allow-listed handler (E4). See docs/adapters.md.
 */
export abstract class CatalogAdapter<Api extends ComponentApi> extends CatalogComponent<Api> {
  /**
   * A prop's current value, or `fallback` when the spec leaves it out. If the spec binds the
   * prop to a data-model path, the signal updates whenever that path changes.
   */
  protected prop<T>(name: string, fallback: T): Signal<T> {
    return computed(() => (this.untypedProps()[name]?.value() ?? fallback) as T);
  }

  /**
   * Emits the A2UI action held in the `name` prop (usually `action`), with its context
   * resolved from the data model. Does nothing when the spec sets no action.
   */
  protected dispatch(name = 'action'): void {
    const action = this.untypedProps()[name]?.value();
    if (typeof action === 'function') {
      void action();
    }
  }

  private untypedProps(): Record<string, { value: () => unknown } | undefined> {
    return this.props() as Record<string, { value: () => unknown } | undefined>;
  }
}
