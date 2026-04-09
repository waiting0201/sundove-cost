import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { DataTableComponent, DataTableColumn, CellChangeEvent } from '../../shared/components/data-table/data-table.component';
import { ToastService } from '../../shared/components/toast/toast.service';

const TABLE_COLUMNS: Record<string, DataTableColumn[]> = {
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

@Component({
  selector: 'app-price-table-editor',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center gap-3 mb-4">
        <button (click)="goBack()" class="text-sm text-muted hover:text-brand transition-colors">← 返回</button>
        <h1 class="text-xl font-bold text-brand">{{ tableLabel() }}</h1>
        <span class="text-xs text-muted">{{ rows().length }} 筆</span>
      </div>

      @if (loading()) {
        <div class="text-center text-muted py-12">載入中...</div>
      } @else {
        <app-data-table
          [columns]="columns()"
          [rows]="rows()"
          (cellChange)="onCellChange($event)"
        />
      }
    </div>
  `,
})
export class PriceTableEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ipc = inject(ElectronIpcService);
  private readonly toast = inject(ToastService);

  readonly tableId = signal('');
  readonly rows = signal<any[]>([]);
  readonly loading = signal(true);

  readonly columns = computed(() => TABLE_COLUMNS[this.tableId()] ?? []);
  readonly tableLabel = computed(() => TABLE_LABELS[this.tableId()] ?? this.tableId());

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

  async onCellChange(event: CellChangeEvent): Promise<void> {
    await this.ipc.invoke('price-table:update', {
      tableId: this.tableId(),
      rowId: event.rowId,
      data: { [event.column]: event.value },
    });
    // Update locally instead of reloading entire table
    this.rows.update(rows =>
      rows.map(r => r.id === event.rowId ? { ...r, [event.column]: event.value } : r)
    );
    this.toast.success(`已更新 ${this.tableLabel()}`);
  }

  goBack(): void {
    this.router.navigate(['/price-tables']);
  }
}
