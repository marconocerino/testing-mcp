import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '@app/ui';
import { CatalogAdapter } from './adapter';
import { formatValue, statusTone, type ValueFormat } from './format';
import { TableApi } from './schemas';

interface Column {
  key: string;
  header: string;
  format?: ValueFormat | 'status';
  align?: 'start' | 'end';
}

/**
 * The A2UI `Table` type. Rows always come from the data model; cells are formatted per column.
 * Picking a row writes its `rowKey` value to `selection`, then emits `rowAction`.
 */
@Component({
  selector: 'app-catalog-table',
  imports: [UiTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-table
      [columns]="columns()"
      [rows]="cells()"
      [pageSize]="pageSize()"
      [selectable]="selectable()"
      (rowSelected)="pick($event)"
    />
  `,
})
export class TableAdapterComponent extends CatalogAdapter<typeof TableApi> {
  private readonly rawColumns = this.prop<Column[]>('columns', []);
  private readonly currency = this.prop<string>('currency', 'USD');
  private readonly rowKey = this.prop<string>('rowKey', 'id');
  private readonly rows = computed(() => {
    const rows = this.prop<unknown>('rows', [])();
    return (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
  });

  protected readonly pageSize = this.prop<number>('pageSize', 10);
  protected readonly selectable = computed(() => this.props()['rowAction' as never] !== undefined);
  protected readonly columns = computed<UiTableColumn[]>(() =>
    this.rawColumns().map(({ key, header, align, format }) => ({
      key,
      header,
      align: align ?? (format && format !== 'text' && format !== 'status' && format !== 'date' ? 'end' : 'start'),
    })),
  );
  protected readonly cells = computed<UiTableRow[]>(() =>
    this.rows().map((row) =>
      Object.fromEntries(
        this.rawColumns().map(({ key, format = 'text' }) => [
          key,
          format === 'status'
            ? { text: formatValue(row[key], 'text'), tone: statusTone(row[key]) }
            : { text: formatValue(row[key], format, this.currency()) },
        ]),
      ),
    ),
  );

  protected pick(index: number): void {
    const row = this.rows()[index];
    if (!row) return;
    this.write('selection', String(row[this.rowKey()] ?? ''));
    this.dispatch('rowAction');
  }
}
