import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface TableColumn {
  key: string;
  label: string;
  editable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  precision?: number;
}

const TABLE_COLUMNS: Record<string, TableColumn[]> = {
  'iron-material': [
    { key: 'steel_type', label: '鋼種' },
    { key: 'shape', label: '形體' },
    { key: 'wire_diameter', label: '線徑' },
    { key: 'base_price', label: '2022單價', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價', precision: 2 },
  ],
  'forming': [
    { key: 'diameter_range', label: '線徑範圍' },
    { key: 'length_min', label: '長度下限', precision: 0 },
    { key: 'length_max', label: '長度上限', precision: 0 },
    { key: 'base_price', label: '2022單價', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'heat-treatment': [
    { key: 'material', label: '材質' },
    { key: 'condition', label: '線徑/尺寸' },
    { key: 'base_price_per_kg', label: '2022單價', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'sandblasting': [
    { key: 'wire_diameter', label: '線徑' },
    { key: 'length_min', label: '長度下限', precision: 0 },
    { key: 'length_max', label: '長度上限', precision: 0 },
    { key: 'base_price_per_kg', label: '2022單價', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'electroplating': [
    { key: 'wire_diameter', label: '線徑' },
    { key: 'length_min', label: '長度下限', precision: 0 },
    { key: 'length_max', label: '長度上限', precision: 0 },
    { key: 'base_price', label: '2022單價', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'blackening': [
    { key: 'wire_diameter', label: '線徑' },
    { key: 'pricing_method', label: '計價方式' },
    { key: 'base_price', label: '2022基礎', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'sleeve': [
    { key: 'wire_diameter', label: '線徑' },
    { key: 'pellet_price', label: '顆粒價', editable: true },
    { key: 'threading_fee', label: '穿工費', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'straightening': [
    { key: 'wire_diameter', label: '線徑' },
    { key: 'length_min', label: '長度下限', precision: 0 },
    { key: 'length_max', label: '長度上限', precision: 0 },
    { key: 'base_price', label: '2022單價', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'hex-ring': [
    { key: 'size', label: '尺寸' },
    { key: 'forging', label: '鍛品', editable: true },
    { key: 'lathe', label: '車修', editable: true },
    { key: 'heat_treatment', label: '熱處理', editable: true },
    { key: 'sandblasting', label: '噴砂', editable: true },
    { key: 'electroplating', label: '電鍍', editable: true },
    { key: 'welding', label: '焊工', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '漲幅後' },
  ],
  'through-head': [
    { key: 'size', label: '尺寸' },
    { key: 'forging', label: '鍛品', editable: true },
    { key: 'processing', label: '加工', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '計算單價' },
  ],
  'handle': [
    { key: 'model', label: '型號' },
    { key: 'handle_size', label: '手柄大小' },
    { key: 'price', label: '單價', editable: true },
  ],
  'packaging': [
    { key: 'packaging_type', label: '包裝方式' },
    { key: 'labor', label: '手工', editable: true },
    { key: 'tag_cost', label: '吊牌', editable: true },
    { key: 'sticker_cost', label: '貼工', editable: true },
    { key: 'base_total', label: '2022費用', editable: true },
    { key: 'markup', label: '漲幅', editable: true },
    { key: 'calculated_price', label: '總費用' },
  ],
  'box': [
    { key: 'handle_size', label: '手柄大小' },
    { key: 'quantity', label: '裝量', precision: 0 },
    { key: 'base_rate', label: '基礎費率', editable: true },
  ],
  'shipping': [
    { key: 'handle_size', label: '手柄大小' },
    { key: 'length_min', label: '長度下限', precision: 0 },
    { key: 'length_max', label: '長度上限', precision: 0 },
    { key: 'base_rate', label: '基礎費率', editable: true },
  ],
};

const TABLE_LABELS: Record<string, string> = {
  'iron-material': 'A 鐵材原料單價',
  'forming': 'B 成形單價',
  'heat-treatment': 'C 熱處理單價',
  'sandblasting': 'D 噴砂單價',
  'electroplating': 'E 電鍍單價',
  'blackening': 'F 染黑單價',
  'sleeve': 'G 膠套單價',
  'straightening': 'H 整直單價',
  'hex-ring': 'I-1 六角環',
  'through-head': 'I-2 貫通頭',
  'handle': 'J 手柄價格',
  'packaging': 'K-1 包裝費用',
  'box': 'K-2 紙箱費用',
  'shipping': 'K-3 運費',
};

/** Columns that are auto-computed by SQLite (GENERATED ALWAYS) — skip in new row inputs */
const GENERATED_COLUMNS = new Set(['calculated_price']);

@Component({
  selector: 'app-price-table-editor',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <button (click)="goBack()" class="text-sm text-muted hover:text-brand transition-colors">&larr; 返回</button>
        <h1 class="text-xl font-bold text-brand">{{ tableLabel() }}</h1>
        <span class="text-xs text-muted">{{ rows().length }} 筆</span>
        <div class="flex-1"></div>
        <button (click)="startAdd()"
          [disabled]="addingNew()"
          class="px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50">
          + 新增
        </button>
      </div>

      @if (loading()) {
        <div class="text-center text-muted py-12">載入中...</div>
      } @else {
        <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-brand text-white text-xs uppercase tracking-wide">
                @for (col of columns(); track col.key) {
                  <th class="px-3 py-2 text-center font-medium">{{ col.label }}</th>
                }
                <th class="px-3 py-2 text-center font-medium w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id; let i = $index) {
                <tr class="border-b border-gray-100"
                    [class.bg-blue-50]="editingRowId() === row.id"
                    [class.hover:bg-gray-50]="editingRowId() !== row.id"
                    (keydown.enter)="editingRowId() === row.id && saveRow(row)"
                    (keydown.escape)="editingRowId() === row.id && cancelEdit()">
                  @for (col of columns(); track col.key) {
                    <td class="px-3 py-2 text-center">
                      @if (editingRowId() === row.id && col.editable) {
                        <input type="number" step="any"
                          class="w-24 px-2 py-1 text-center text-sm border-2 border-brand rounded outline-none font-mono tabular-nums"
                          [ngModel]="editRowData()[col.key]"
                          (ngModelChange)="updateEditField(col.key, $event)" />
                      } @else {
                        <span class="font-mono tabular-nums">{{ formatCell(row[col.key], col) }}</span>
                      }
                    </td>
                  }
                  <td class="px-3 py-2 text-center whitespace-nowrap">
                    @if (editingRowId() === row.id) {
                      <button (click)="saveRow(row)" class="text-xs text-brand hover:underline mr-1">儲存</button>
                      <button (click)="cancelEdit()" class="text-xs text-muted hover:underline">取消</button>
                    } @else {
                      <button (click)="startEdit(row)" class="text-xs text-muted hover:text-brand mr-1">編輯</button>
                      <button (click)="confirmDelete(row)" class="text-xs text-red-500 hover:underline">刪除</button>
                    }
                  </td>
                </tr>
              }

              <!-- New row -->
              @if (addingNew()) {
                <tr class="border-b border-gray-100 bg-green-50"
                    (keydown.enter)="saveNewRow()"
                    (keydown.escape)="cancelAdd()">
                  @for (col of columns(); track col.key) {
                    <td class="px-3 py-2 text-center">
                      @if (isGeneratedColumn(col.key)) {
                        <span class="text-xs text-muted">自動計算</span>
                      } @else {
                        <input [type]="col.editable ? 'number' : 'text'" step="any"
                          class="w-24 px-2 py-1 text-center text-sm border-2 border-green-500 rounded outline-none font-mono tabular-nums"
                          [ngModel]="newRowData()[col.key]"
                          (ngModelChange)="updateNewField(col.key, $event)"
                          [placeholder]="col.label" />
                      }
                    </td>
                  }
                  <td class="px-3 py-2 text-center whitespace-nowrap">
                    <button (click)="saveNewRow()" class="text-xs text-brand hover:underline mr-1">儲存</button>
                    <button (click)="cancelAdd()" class="text-xs text-muted hover:underline">取消</button>
                  </td>
                </tr>
              }

              @if (rows().length === 0 && !addingNew()) {
                <tr>
                  <td [attr.colspan]="columns().length + 1" class="text-center text-muted py-8">暫無資料</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <app-confirm-dialog
      [open]="deleteConfirmRowId() !== null"
      title="確認刪除"
      message="確定要刪除此筆資料嗎？此操作無法復原。"
      confirmLabel="刪除"
      [danger]="true"
      (confirm)="executeDelete()"
      (cancel)="deleteConfirmRowId.set(null)"
    />
  `,
  styles: [`
    tr:nth-child(even):not(.bg-blue-50):not(.bg-green-50) td {
      background-color: #f9fafb;
    }
  `],
})
export class PriceTableEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ipc = inject(ElectronIpcService);
  private readonly toast = inject(ToastService);

  readonly tableId = signal('');
  readonly rows = signal<any[]>([]);
  readonly loading = signal(true);

  // Edit state
  readonly editingRowId = signal<number | null>(null);
  readonly editRowData = signal<Record<string, any>>({});

  // Add state
  readonly addingNew = signal(false);
  readonly newRowData = signal<Record<string, any>>({});

  // Delete state
  readonly deleteConfirmRowId = signal<number | null>(null);

  readonly columns = computed(() => TABLE_COLUMNS[this.tableId()] ?? []);
  readonly tableLabel = computed(() => TABLE_LABELS[this.tableId()] ?? this.tableId());
  readonly editableColumns = computed(() => this.columns().filter(col => col.editable));
  /** Columns that accept user input when adding a new row (excludes generated columns) */
  readonly insertableColumns = computed(() => this.columns().filter(col => !GENERATED_COLUMNS.has(col.key)));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.tableId.set(id);
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    const data = await this.ipc.invoke<any[]>('price-table:list', { tableId: this.tableId() });
    this.rows.set(data);
    this.loading.set(false);
  }

  // --- Edit ---

  startEdit(row: any): void {
    this.addingNew.set(false);
    const editData: Record<string, any> = {};
    for (const col of this.editableColumns()) {
      editData[col.key] = row[col.key];
    }
    this.editRowData.set(editData);
    this.editingRowId.set(row.id);
  }

  cancelEdit(): void {
    this.editingRowId.set(null);
  }

  updateEditField(key: string, value: any): void {
    this.editRowData.update(data => ({ ...data, [key]: Number(value) }));
  }

  async saveRow(originalRow: any): Promise<void> {
    const editData = this.editRowData();
    const changedFields: Record<string, unknown> = {};

    for (const col of this.editableColumns()) {
      const newVal = Number(editData[col.key]);
      if (isNaN(newVal)) {
        this.toast.error(`${col.label} 請輸入有效數字`);
        return;
      }
      if (newVal !== originalRow[col.key]) {
        changedFields[col.key] = newVal;
      }
    }

    if (Object.keys(changedFields).length === 0) {
      this.editingRowId.set(null);
      this.toast.success('值未變更');
      return;
    }

    try {
      await this.ipc.invoke('price-table:update', {
        tableId: this.tableId(),
        rowId: originalRow.id,
        data: changedFields,
      });

      const freshRow = await this.ipc.invoke<any>('price-table:get-row', {
        tableId: this.tableId(),
        rowId: originalRow.id,
      });

      this.rows.update(rows =>
        rows.map(r => r.id === originalRow.id ? freshRow : r)
      );

      this.editingRowId.set(null);
      this.toast.success(`已更新 ${this.tableLabel()}`);
    } catch (err) {
      this.toast.error(`儲存失敗: ${err}`);
    }
  }

  // --- Add ---

  startAdd(): void {
    this.editingRowId.set(null);
    const data: Record<string, any> = {};
    for (const col of this.insertableColumns()) {
      data[col.key] = col.editable ? 0 : '';
    }
    this.newRowData.set(data);
    this.addingNew.set(true);
  }

  cancelAdd(): void {
    this.addingNew.set(false);
  }

  updateNewField(key: string, value: any): void {
    const col = this.columns().find(c => c.key === key);
    const parsed = col?.editable ? Number(value) : value;
    this.newRowData.update(data => ({ ...data, [key]: parsed }));
  }

  async saveNewRow(): Promise<void> {
    const data = this.newRowData();
    const insertData: Record<string, unknown> = {};

    for (const col of this.insertableColumns()) {
      const val = data[col.key];
      if (col.editable) {
        const num = Number(val);
        if (isNaN(num)) {
          this.toast.error(`${col.label} 請輸入有效數字`);
          return;
        }
        insertData[col.key] = num;
      } else {
        if (!val && val !== 0) {
          this.toast.error(`${col.label} 不可為空`);
          return;
        }
        insertData[col.key] = val;
      }
    }

    try {
      const res = await this.ipc.invoke<{ success: boolean; id: number }>('price-table:insert', {
        tableId: this.tableId(),
        data: insertData,
      });

      const freshRow = await this.ipc.invoke<any>('price-table:get-row', {
        tableId: this.tableId(),
        rowId: res.id,
      });

      this.rows.update(rows => [...rows, freshRow]);
      this.addingNew.set(false);
      this.toast.success(`已新增 ${this.tableLabel()}`);
    } catch (err) {
      this.toast.error(`新增失敗: ${err}`);
    }
  }

  // --- Delete ---

  confirmDelete(row: any): void {
    this.deleteConfirmRowId.set(row.id);
  }

  async executeDelete(): Promise<void> {
    const rowId = this.deleteConfirmRowId();
    if (rowId === null) return;

    try {
      await this.ipc.invoke('price-table:delete', {
        tableId: this.tableId(),
        rowId,
      });

      this.rows.update(rows => rows.filter(r => r.id !== rowId));
      this.deleteConfirmRowId.set(null);
      this.toast.success(`已刪除`);
    } catch (err) {
      this.toast.error(`刪除失敗: ${err}`);
      this.deleteConfirmRowId.set(null);
    }
  }

  // --- Helpers ---

  isGeneratedColumn(key: string): boolean {
    return GENERATED_COLUMNS.has(key);
  }

  formatCell(value: any, col: TableColumn): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') return value.toFixed(col.precision ?? 2);
    return String(value);
  }

  goBack(): void {
    this.router.navigate(['/price-tables']);
  }
}
