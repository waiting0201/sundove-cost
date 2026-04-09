import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ProductsStore } from './products.store';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, ScrollingModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly ipc = inject(ElectronIpcService);
  private readonly toast = inject(ToastService);
  readonly store = inject(ProductsStore);
  readonly showColumnConfig = signal(false);
  readonly importing = signal(false);
  readonly diameterOptions = [3, 4, 5, 6, 8];
  readonly handleOptions = ['大大柄', '大柄', '中柄', '小柄', '精密柄', '陀螺'];

  ngOnInit(): void {
    this.store.loadProducts();
  }

  async importExcel(): Promise<void> {
    this.importing.set(true);
    const res = await this.ipc.invoke<any>('import:excel');
    this.importing.set(false);
    if (res.success) {
      this.toast.success(`已匯入 ${res.count} 筆 SKU`);
      this.store.loadProducts();
    } else if (res.reason !== 'cancelled') {
      this.toast.error(`匯入失敗: ${res.reason}`);
    }
  }

  async exportExcel(): Promise<void> {
    const res = await this.ipc.invoke<any>('export:excel');
    if (res.success) {
      this.toast.success(`已匯出 ${res.count} 筆`);
    }
  }

  formatCell(product: any, key: string): string {
    const v = product[key];
    if (v === null || v === undefined) return '—';
    if (key === 'has_hex_ring' || key === 'has_through_head') return v ? '✓' : '—';
    if (key === 'material_shape') {
      const map: Record<string, string> = { round: '圓鐵', hex: '六角', square: '四角' };
      return map[v] ?? v;
    }
    if (typeof v === 'number') return v.toString();
    return String(v);
  }

  sortIcon(key: string): string {
    if (this.store.sortField() !== key) return '↕';
    return this.store.sortDir() === 'asc' ? '↑' : '↓';
  }

  openProduct(id: number | string): void {
    this.router.navigate(['/products', id]);
  }
}
