import { Injectable, inject, signal, computed } from '@angular/core';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { Product } from '../../core/models/calculation-result.model';

export interface ProductFilter {
  wireDiameter: number | null;
  handleSize: string | null;
  search: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private readonly ipc = inject(ElectronIpcService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly selectedIds = signal<Set<number>>(new Set());

  readonly filter = signal<ProductFilter>({
    wireDiameter: null,
    handleSize: null,
    search: '',
  });

  readonly sortField = signal<string>('sku');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly allColumns = signal<ColumnConfig[]>([
    { key: 'sku',             label: 'SKU Code',  visible: true,  width: '140px' },
    { key: 'wire_diameter',   label: '線徑',       visible: true,  width: '70px' },
    { key: 'exposed_length',  label: '外露長',     visible: true,  width: '80px' },
    { key: 'internal_length', label: '內含長',     visible: false, width: '80px' },
    { key: 'material_shape',  label: '材料',       visible: false, width: '70px' },
    { key: 'handle_size',     label: '手柄',       visible: true,  width: '70px' },
    { key: 'handle_model',    label: '手柄型號',   visible: false, width: '80px' },
    { key: 'has_hex_ring',    label: '六角環',     visible: false, width: '70px' },
    { key: 'has_through_head', label: '貫通頭',    visible: false, width: '70px' },
    { key: 'packaging_type',  label: '包裝',       visible: false, width: '70px' },
    { key: 'notes',           label: '備註',       visible: false, width: '120px' },
  ]);

  readonly visibleColumns = computed(() =>
    this.allColumns().filter(c => c.visible)
  );

  readonly filteredProducts = computed(() => {
    let list = this.products();
    const f = this.filter();

    if (f.wireDiameter !== null) {
      list = list.filter(p => p.wire_diameter === f.wireDiameter);
    }
    if (f.handleSize) {
      list = list.filter(p => p.handle_size === f.handleSize);
    }
    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter(p => p.sku.toLowerCase().includes(q));
    }

    // Sort
    const field = this.sortField();
    const dir = this.sortDir();
    list = [...list].sort((a, b) => {
      const va = (a as any)[field];
      const vb = (b as any)[field];
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const cmp = va < vb ? -1 : 1;
      return dir === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  readonly totalCount = computed(() => this.products().length);
  readonly filteredCount = computed(() => this.filteredProducts().length);

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    const data = await this.ipc.invoke<Product[]>('product:list');
    this.products.set(data);
    this.loading.set(false);
  }

  toggleSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  toggleColumn(key: string): void {
    this.allColumns.update(cols =>
      cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c)
    );
  }

  toggleSelect(id: number): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  selectAll(): void {
    this.selectedIds.set(new Set(this.filteredProducts().map(p => p.id)));
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  setFilter(partial: Partial<ProductFilter>): void {
    this.filter.update(f => ({ ...f, ...partial }));
  }

  clearFilters(): void {
    this.filter.set({ wireDiameter: null, handleSize: null, search: '' });
  }
}
