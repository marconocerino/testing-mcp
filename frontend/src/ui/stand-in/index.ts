/**
 * `@app/ui`, the UI component contract (CLAUDE.md rule 1).
 *
 * This is the stand-in implementation, backed by Angular Material. The real
 * build points the `@app/ui` path alias at a wrapper over the internal company
 * library that exports the same names, selectors and inputs.
 *
 * Only files under src/ui/ may import @angular/material or @angular/cdk.
 */
export { UiButtonComponent, type UiButtonVariant } from './ui-button.component';
export { UiCardComponent } from './ui-card.component';
