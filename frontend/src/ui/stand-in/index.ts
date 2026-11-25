/**
 * `@app/ui`, the UI component contract (CLAUDE.md rule 1).
 *
 * This is the stand-in implementation, backed by Angular Material. The real
 * build points the `@app/ui` path alias at a wrapper over the internal company
 * library that exports the same names, selectors and inputs.
 *
 * Only files under src/ui/ may import @angular/material or @angular/cdk.
 */
export { UiAlertComponent, type UiAlertTone } from './ui-alert.component';
export { UiAppLayoutComponent } from './ui-app-layout.component';
export { UiBadgeComponent, type UiTone } from './ui-badge.component';
export { UiButtonComponent, type UiButtonVariant } from './ui-button.component';
export { UiCardComponent } from './ui-card.component';
export { UiDateFieldComponent } from './ui-date-field.component';
export { UiDividerComponent } from './ui-divider.component';
export { UiEmptyStateComponent } from './ui-empty-state.component';
export { UiNavLinkComponent } from './ui-nav-link.component';
export { UiKeyValueListComponent, type UiKeyValueItem } from './ui-key-value-list.component';
export { UiPromptInputComponent } from './ui-prompt-input.component';
export { UiSelectComponent, type UiSelectOption } from './ui-select.component';
export { UiSkeletonComponent } from './ui-skeleton.component';
export { UiStackComponent, type UiStackAlign, type UiStackDirection, type UiStackJustify } from './ui-stack.component';
export { UiStatComponent } from './ui-stat.component';
export { UiTableComponent, type UiTableCell, type UiTableColumn, type UiTableRow } from './ui-table.component';
export { UiTextComponent, type UiTextVariant } from './ui-text.component';
