import { computed, Directive, Signal } from '@angular/core';
import { CatalogComponent } from '@a2ui/angular';
import type { ComponentApi } from '@a2ui/web_core/v0_9';

type LooseProp = { value: () => unknown; onUpdate: (value: unknown) => void } | undefined;

/**
 * Base class for every catalog adapter (E1-S2). An adapter maps one A2UI component type to
 * one `@app/ui` element. It only:
 *
 * 1. reads props with {@link prop}, which follow data bindings reactively;
 * 2. renders children by id with `<a2ui-v09-component-host>` inside the `ui-*` element;
 * 3. reports user interactions with {@link dispatch} (and {@link write} for input values).
 *
 * Adapters never call services, the agent or the router: an action goes to the renderer's
 * action handler, which routes it to an allow-listed handler (E4). See docs/adapters.md.
 */
@Directive({
  host: { '[style.flex]': 'weight()' },
})
export abstract class CatalogAdapter<Api extends ComponentApi> extends CatalogComponent<Api> {
  /** `weight` from the spec, applied as flex-grow inside a Row or Column. */
  protected readonly weight = computed(() => {
    const w = this.loose('weight')?.value();
    return typeof w === 'number' ? String(w) : null;
  });

  /**
   * A prop's current value, or `fallback` when the spec leaves it out. If the spec binds the
   * prop to a data-model path, the signal updates whenever that path changes.
   */
  protected prop<T>(name: string, fallback: T): Signal<T> {
    return computed(() => (this.loose(name)?.value() ?? fallback) as T);
  }

  /**
   * Writes a new value for a prop the user changed (a Select or DateField value). It lands in
   * the data model only when the spec bound the prop to a path; a literal value is left as is.
   */
  protected write(name: string, value: unknown): void {
    this.loose(name)?.onUpdate(value);
  }

  /**
   * Emits the A2UI action held in the `name` prop (usually `action`), with its context
   * resolved from the data model at this moment. Does nothing when the spec sets no action.
   */
  protected dispatch(name = 'action'): void {
    const action = this.loose(name)?.value();
    if (typeof action === 'function') {
      void action();
    }
  }

  private loose(name: string): LooseProp {
    return (this.props() as Record<string, LooseProp>)[name];
  }
}
