import { Injectable, inject, signal } from '@angular/core';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';

export interface ChangeLogEntry {
  id: number;
  table_name: string;
  record_id: number | null;
  field_name: string | null;
  old_value: number | null;
  new_value: number | null;
  changed_at: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly ipc = inject(ElectronIpcService);

  readonly productCount = signal(0);
  readonly tableCounts = signal<Record<string, number>>({});
  readonly recentChanges = signal<ChangeLogEntry[]>([]);
  readonly exchangeRate = signal(29.5);
  readonly loading = signal(true);

  async load(): Promise<void> {
    this.loading.set(true);
    const [products, tableCounts, changes, params] = await Promise.all([
      this.ipc.invoke<any[]>('product:list'),
      this.ipc.invoke<Record<string, number>>('price-table:list-all'),
      this.ipc.invoke<ChangeLogEntry[]>('change-log:recent', { limit: 20 }),
      this.ipc.invoke<any[]>('global-params:get'),
    ]);

    this.productCount.set(products.length);
    this.tableCounts.set(tableCounts);
    this.recentChanges.set(changes);

    const rate = params.find((p: any) => p.key === 'exchange_rate');
    if (rate) this.exchangeRate.set(rate.value);

    this.loading.set(false);
  }

  get totalTableRows(): number {
    return Object.values(this.tableCounts()).reduce((sum, n) => sum + n, 0);
  }
}
