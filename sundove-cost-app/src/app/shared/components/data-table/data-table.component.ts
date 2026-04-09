import { Component, input, output, signal, computed } from '@angular/core';
import { EditableCellComponent } from '../editable-cell/editable-cell.component';

export interface DataTableColumn {
  key: string;
  label: string;
  editable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  precision?: number;
}

export interface CellChangeEvent {
  rowIndex: number;
  rowId: number;
  column: string;
  value: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [EditableCellComponent],
  template: `
    <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table class="data-table">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [style.width]="col.width ?? 'auto'" [style.text-align]="col.align ?? 'center'">
                {{ col.label }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track rowTrackBy(row); let i = $index) {
            <tr>
              @for (col of columns(); track col.key) {
                <td [style.text-align]="col.align ?? 'center'">
                  @if (col.editable) {
                    <app-editable-cell
                      [value]="row[col.key]"
                      [precision]="col.precision ?? 2"
                      (valueChange)="onCellChange(i, row, col.key, $event)"
                    />
                  } @else {
                    <span class="tabular-nums">{{ formatCell(row[col.key], col) }}</span>
                  }
                </td>
              }
            </tr>
          }
          @if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="text-center text-muted py-8">
                暫無資料
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  readonly columns = input.required<DataTableColumn[]>();
  readonly rows = input.required<Record<string, any>[]>();
  readonly idField = input('id');

  readonly cellChange = output<CellChangeEvent>();

  rowTrackBy(row: Record<string, any>): any {
    return row[this.idField()];
  }

  onCellChange(index: number, row: Record<string, any>, column: string, value: number): void {
    this.cellChange.emit({
      rowIndex: index,
      rowId: row[this.idField()],
      column,
      value,
    });
  }

  formatCell(value: any, col: DataTableColumn): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return value.toFixed(col.precision ?? 2);
    return String(value);
  }
}
