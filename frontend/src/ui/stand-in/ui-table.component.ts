import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { UiBadgeComponent, type UiTone } from './ui-badge.component';

export interface UiTableColumn {
  key: string;
  header: string;
  align?: 'start' | 'end';
}

/** One cell, already formatted. A `tone` renders the cell as a badge. */
export interface UiTableCell {
  text: string;
  tone?: UiTone;
}

export type UiTableRow = Record<string, UiTableCell>;

/**
 * Stand-in for the internal library's Table with Pagination. Paging is local. When `selectable`,
 * rows can be picked by click or Enter, and `rowSelected` emits the row's index in `rows`.
 */
@Component({
  selector: 'ui-table',
  imports: [MatTableModule, MatPaginator, UiBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table mat-table [dataSource]="pageRows()" [trackBy]="trackRow" class="ui-table">
      @for (col of columns(); track col.key) {
        <ng-container [matColumnDef]="col.key">
          <th mat-header-cell *matHeaderCellDef [class.ui-table__end]="col.align === 'end'">{{ col.header }}</th>
          <td mat-cell *matCellDef="let row" [class.ui-table__end]="col.align === 'end'">
            @if (row.cells[col.key]?.tone; as tone) {
              <ui-badge [tone]="tone">{{ row.cells[col.key].text }}</ui-badge>
            } @else {
              {{ row.cells[col.key]?.text }}
            }
          </td>
        </ng-container>
      }
      <tr mat-header-row *matHeaderRowDef="columnKeys()"></tr>
      <tr
        mat-row
        *matRowDef="let row; columns: columnKeys()"
        [class.ui-table__row--selectable]="selectable()"
        [attr.tabindex]="selectable() ? 0 : null"
        (click)="select(row.index)"
        (keydown.enter)="select(row.index)"
      ></tr>
    </table>
    @if (rows().length > pageSize()) {
      <mat-paginator
        [length]="rows().length"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [hidePageSize]="true"
        (page)="onPage($event)"
      />
    }
  `,
})
export class UiTableComponent {
  readonly columns = input.required<readonly UiTableColumn[]>();
  readonly rows = input.required<readonly UiTableRow[]>();
  readonly pageSize = input(10);
  readonly selectable = input(false);
  readonly rowSelected = output<number>();

  protected readonly pageIndex = signal(0);
  protected readonly columnKeys = computed(() => this.columns().map((c) => c.key));
  protected readonly pageRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows()
      .slice(start, start + this.pageSize())
      .map((cells, i) => ({ cells, index: start + i }));
  });

  constructor() {
    // Back to the first page when the data shrinks below the current page.
    effect(() => {
      if (this.pageIndex() * this.pageSize() >= this.rows().length) this.pageIndex.set(0);
    });
  }

  /** Keeps row elements (and keyboard focus) in place when the data is rebuilt. */
  protected readonly trackRow = (_: number, row: { index: number }) => row.index;

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  protected select(index: number): void {
    if (this.selectable()) this.rowSelected.emit(index);
  }
}
