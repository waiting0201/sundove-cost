import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { PriceDiffBadgeComponent } from '../../shared/components/price-diff-badge/price-diff-badge.component';
import { CurrencyTwPipe } from '../../shared/pipes/currency-tw.pipe';

interface CascadeItem {
  sku: string;
  oldIronCost: number;
  newIronCost: number;
  diff: number;
  diffPercent: number;
}

interface PreviewResult {
  items: CascadeItem[];
  affectedCount: number;
  avgDiff: number;
}

interface TableOption {
  id: string;
  label: string;
  editableFields: { key: string; label: string }[];
}

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [FormsModule, PriceDiffBadgeComponent, CurrencyTwPipe],
  template: `
    <div class="p-6">
      <h1 class="text-xl font-bold text-brand mb-6">調價影響比較</h1>

      <!-- Step 1: Select table -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h2 class="text-sm font-semibold text-gray-500 uppercase mb-3">模擬調價</h2>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs text-muted mb-1">1. 選擇價格表</label>
            <select class="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
              [ngModel]="tableId()" (ngModelChange)="onTableChange($event)">
              @for (t of tableOptions; track t.id) {
                <option [value]="t.id">{{ t.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs text-muted mb-1">2. 選擇要調整的欄位</label>
            <select class="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
              [ngModel]="field()" (ngModelChange)="field.set($event)">
              @for (f of currentFields(); track f.key) {
                <option [value]="f.key">{{ f.label }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Step 2: Select row from loaded data -->
        @if (tableRows().length > 0) {
          <div class="mb-4">
            <label class="block text-xs text-muted mb-1">3. 選擇要修改的資料行</label>
            <div class="max-h-48 overflow-y-auto border border-gray-200 rounded">
              <table class="w-full text-xs">
                <thead class="sticky top-0">
                  <tr class="bg-gray-100">
                    <th class="px-2 py-1 text-left">選擇</th>
                    <th class="px-2 py-1 text-left">ID</th>
                    @for (col of rowDisplayCols(); track col) {
                      <th class="px-2 py-1 text-left">{{ col }}</th>
                    }
                    <th class="px-2 py-1 text-right">{{ fieldLabel() }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of tableRows(); track row.id) {
                    <tr class="border-t border-gray-100 cursor-pointer hover:bg-blue-50"
                      [class.bg-brand-light]="selectedRowId() === row.id"
                      (click)="selectRow(row)">
                      <td class="px-2 py-1">
                        <input type="radio" [checked]="selectedRowId() === row.id" class="text-brand" />
                      </td>
                      <td class="px-2 py-1 font-mono">{{ row.id }}</td>
                      @for (col of rowDisplayCols(); track col) {
                        <td class="px-2 py-1">{{ row[col] }}</td>
                      }
                      <td class="px-2 py-1 text-right font-mono tabular-nums">{{ row[field()] }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Step 3: Enter new value -->
        @if (selectedRowId()) {
          <div class="flex items-end gap-3">
            <div class="flex-1">
              <label class="block text-xs text-muted mb-1">
                4. 輸入新值（目前值: <span class="font-mono">{{ currentValue() }}</span>）
              </label>
              <input type="number" step="any"
                class="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
                [ngModel]="newValue()" (ngModelChange)="newValue.set($event)" />
            </div>
            <button (click)="runPreview()"
              class="px-4 py-1.5 bg-brand text-white text-sm rounded hover:bg-brand-dark transition-colors"
              [disabled]="loading()">
              {{ loading() ? '計算中...' : '預覽影響' }}
            </button>
          </div>
        }
      </div>

      @if (result(); as r) {
        <!-- Summary cards -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="text-2xl font-bold tabular-nums">{{ r.affectedCount }}</div>
            <div class="text-xs text-muted mt-1">受影響 SKUs</div>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="text-2xl font-bold tabular-nums" [class.text-up]="r.avgDiff > 0" [class.text-down]="r.avgDiff < 0">
              {{ r.avgDiff > 0 ? '+' : '' }}{{ r.avgDiff.toFixed(1) }}%
            </div>
            <div class="text-xs text-muted mt-1">平均漲跌幅</div>
          </div>
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="text-2xl font-bold tabular-nums">{{ r.items.length }}</div>
            <div class="text-xs text-muted mt-1">有變動的項目</div>
          </div>
        </div>

        <!-- Comparison table -->
        @if (r.items.length > 0) {
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th class="px-4 py-2 text-left">SKU</th>
                  <th class="px-4 py-2 text-right">舊鐵件成本</th>
                  <th class="px-4 py-2 text-right">新鐵件成本</th>
                  <th class="px-4 py-2 text-right">差額</th>
                  <th class="px-4 py-2 text-right">漲跌 %</th>
                </tr>
              </thead>
              <tbody>
                @for (item of r.items; track item.sku) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-2 font-medium">{{ item.sku }}</td>
                    <td class="px-4 py-2 text-right font-mono tabular-nums">{{ item.oldIronCost | currencyTw:4 }}</td>
                    <td class="px-4 py-2 text-right font-mono tabular-nums" [class.text-up]="item.diff > 0" [class.text-down]="item.diff < 0">
                      {{ item.newIronCost | currencyTw:4 }}
                    </td>
                    <td class="px-4 py-2 text-right">
                      <app-price-diff-badge [value]="item.diff" />
                    </td>
                    <td class="px-4 py-2 text-right">
                      <app-price-diff-badge [value]="item.diffPercent" format="percent" />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="text-center text-muted py-8 bg-white rounded-lg border border-gray-200">
            此修改不影響任何 SKU
          </div>
        }
      }

      @if (!result() && !loading() && !selectedRowId()) {
        <div class="text-center text-muted py-12 bg-white rounded-lg border border-gray-200">
          選擇價格表 → 選擇資料行 → 輸入新值 → 點擊「預覽影響」
        </div>
      }
    </div>
  `,
})
export class ComparisonComponent {
  private readonly ipc = inject(ElectronIpcService);

  readonly tableId = signal('iron-material');
  readonly field = signal('base_price');
  readonly selectedRowId = signal<number | null>(null);
  readonly currentValue = signal<number>(0);
  readonly newValue = signal<number>(0);
  readonly loading = signal(false);
  readonly result = signal<PreviewResult | null>(null);
  readonly tableRows = signal<any[]>([]);

  readonly tableOptions: TableOption[] = [
    { id: 'iron-material', label: 'A 鐵材原料', editableFields: [{ key: 'base_price', label: '基礎單價' }, { key: 'markup', label: '漲幅' }] },
    { id: 'forming', label: 'B 成形', editableFields: [{ key: 'base_price', label: '基礎單價' }, { key: 'markup', label: '漲幅' }] },
    { id: 'heat-treatment', label: 'C 熱處理', editableFields: [{ key: 'base_price_per_kg', label: '基礎單價/kg' }, { key: 'markup', label: '漲幅' }] },
    { id: 'sandblasting', label: 'D 噴砂', editableFields: [{ key: 'base_price_per_kg', label: '基礎單價/kg' }, { key: 'markup', label: '漲幅' }] },
    { id: 'electroplating', label: 'E 電鍍', editableFields: [{ key: 'base_price', label: '基礎單價' }, { key: 'markup', label: '漲幅' }] },
    { id: 'blackening', label: 'F 染黑', editableFields: [{ key: 'base_price', label: '基礎單價' }, { key: 'markup', label: '漲幅' }] },
    { id: 'sleeve', label: 'G 膠套', editableFields: [{ key: 'pellet_price', label: '顆粒價' }, { key: 'threading_fee', label: '穿工費' }, { key: 'markup', label: '漲幅' }] },
    { id: 'straightening', label: 'H 整直', editableFields: [{ key: 'base_price', label: '基礎單價' }, { key: 'markup', label: '漲幅' }] },
    { id: 'hex-ring', label: 'I-1 六角環', editableFields: [{ key: 'forging', label: '鍛品' }, { key: 'lathe', label: '車修' }, { key: 'welding', label: '焊工' }, { key: 'markup', label: '漲幅' }] },
    { id: 'through-head', label: 'I-2 貫通頭', editableFields: [{ key: 'forging', label: '鍛品' }, { key: 'processing', label: '加工' }, { key: 'markup', label: '漲幅' }] },
  ];

  // Display columns per table (first few identifying columns)
  private readonly displayColsMap: Record<string, string[]> = {
    'iron-material': ['steel_type', 'shape', 'wire_diameter'],
    'forming': ['diameter_range', 'length_min', 'length_max'],
    'heat-treatment': ['material', 'condition'],
    'sandblasting': ['wire_diameter', 'length_min', 'length_max'],
    'electroplating': ['wire_diameter', 'length_min', 'length_max'],
    'blackening': ['wire_diameter', 'pricing_method'],
    'sleeve': ['wire_diameter'],
    'straightening': ['wire_diameter', 'length_min', 'length_max'],
    'hex-ring': ['size'],
    'through-head': ['size'],
  };

  readonly currentFields = signal<{ key: string; label: string }[]>([]);
  readonly rowDisplayCols = signal<string[]>([]);

  readonly fieldLabel = signal('');

  constructor() {
    this.onTableChange(this.tableId());

    effect(() => {
      const f = this.field();
      const fields = this.currentFields();
      this.fieldLabel.set(fields.find(x => x.key === f)?.label ?? f);
    });
  }

  async onTableChange(id: string): Promise<void> {
    this.tableId.set(id);
    this.selectedRowId.set(null);
    this.result.set(null);

    const opt = this.tableOptions.find(t => t.id === id);
    this.currentFields.set(opt?.editableFields ?? []);
    if (opt?.editableFields.length) {
      this.field.set(opt.editableFields[0].key);
    }
    this.rowDisplayCols.set(this.displayColsMap[id] ?? []);

    const rows = await this.ipc.invoke<any[]>('price-table:list', { tableId: id });
    this.tableRows.set(rows);
  }

  selectRow(row: any): void {
    this.selectedRowId.set(row.id);
    this.currentValue.set(row[this.field()]);
    this.newValue.set(row[this.field()]);
    this.result.set(null);
  }

  async runPreview(): Promise<void> {
    this.loading.set(true);
    this.result.set(null);
    const res = await this.ipc.invoke<PreviewResult>('cascade:preview', {
      tableId: this.tableId(),
      rowId: this.selectedRowId(),
      field: this.field(),
      newValue: this.newValue(),
    });
    this.result.set(res);
    this.loading.set(false);
  }
}
