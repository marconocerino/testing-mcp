import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ComponentHostComponent } from '@a2ui/angular';
import { ColumnApi, RowApi } from '@a2ui/web_core/v1_0';
import { UiStackComponent, type UiStackAlign, type UiStackJustify } from '@app/ui';
import { CatalogAdapter } from './adapter';

const TEMPLATE = `
  <ui-stack [direction]="direction" [justify]="justify()" [align]="align()">
    @for (child of children(); track child.basePath + '/' + child.id) {
      <a2ui-v09-component-host [componentKey]="child" [surfaceId]="surfaceId()" />
    }
  </ui-stack>
`;

/** The A2UI `Column` type: children stacked vertically, rendered by `ui-stack`. */
@Component({
  selector: 'app-catalog-column',
  imports: [UiStackComponent, ComponentHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: TEMPLATE,
})
export class ColumnAdapterComponent extends CatalogAdapter<typeof ColumnApi> {
  protected readonly direction = 'vertical' as const;
  protected readonly justify = this.prop<UiStackJustify>('justify', 'start');
  protected readonly align = this.prop<UiStackAlign>('align', 'stretch');
  protected readonly children = computed(() => this.props().children?.value() ?? []);
}

/** The A2UI `Row` type: children side by side, rendered by `ui-stack`. */
@Component({
  selector: 'app-catalog-row',
  imports: [UiStackComponent, ComponentHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: TEMPLATE,
})
export class RowAdapterComponent extends CatalogAdapter<typeof RowApi> {
  protected readonly direction = 'horizontal' as const;
  protected readonly justify = this.prop<UiStackJustify>('justify', 'start');
  protected readonly align = this.prop<UiStackAlign>('align', 'stretch');
  protected readonly children = computed(() => this.props().children?.value() ?? []);
}
