import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { IronCostStore } from '../iron-cost/iron-cost.store';
import { PricingStore } from '../pricing/pricing.store';
import { ProcessCardComponent, ProcessCardData } from '../../shared/components/process-card/process-card.component';
import { CurrencyTwPipe, CurrencyUsdPipe } from '../../shared/pipes/currency-tw.pipe';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [FormsModule, ProcessCardComponent, CurrencyTwPipe, CurrencyUsdPipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ipc = inject(ElectronIpcService);
  private readonly toast = inject(ToastService);
  readonly ironStore = inject(IronCostStore);
  readonly pricingStore = inject(PricingStore);

  readonly product = signal<any>(null);
  readonly editing = signal(false);
  readonly isNew = signal(false);

  // Editable form model
  readonly form = signal<any>({
    sku: '', wire_diameter: 3, exposed_length: 60, internal_length: 60,
    material_shape: 'round', steel_type: '8660', handle_size: '小柄',
    handle_model: 'K25_DEFAULT', packaging_type: 'bulk', carton_quantity: 60,
    has_hex_ring: false, has_through_head: false, has_tp_drill: false, has_stamp: false,
    notes: '',
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === 'new') {
      this.isNew.set(true);
      this.editing.set(true);
    } else {
      this.loadProduct(Number(idParam));
    }
  }

  async loadProduct(id: number): Promise<void> {
    if (!this.ironStore.loaded()) await this.ironStore.loadPriceTables();
    if (!this.pricingStore.loaded()) await this.pricingStore.loadPriceTables();

    const p = await this.ipc.invoke<any>('product:get', { id });
    if (!p) return;

    this.product.set(p);
    this.form.set({ ...p });
    this.applyToStores(p);
  }

  startEdit(): void {
    this.form.set({ ...this.product() });
    this.editing.set(true);
  }

  cancelEdit(): void {
    if (this.isNew()) {
      this.goBack();
    } else {
      this.editing.set(false);
      this.form.set({ ...this.product() });
    }
  }

  async save(): Promise<void> {
    const data = this.form();

    if (this.isNew()) {
      const res = await this.ipc.invoke<any>('product:create', { data });
      if (res.success) {
        this.toast.success(`已新增 SKU: ${data.sku}`);
        this.router.navigate(['/products', res.id]);
      }
    } else {
      const id = this.product().id;
      await this.ipc.invoke('product:update', { id, data });
      this.product.set({ ...data, id });
      this.editing.set(false);
      this.applyToStores(data);
      this.toast.success('已儲存');
    }
  }

  async deleteProduct(): Promise<void> {
    const id = this.product().id;
    await this.ipc.invoke('product:delete', { id });
    this.toast.success('已刪除');
    this.goBack();
  }

  updateForm(field: string, value: any): void {
    this.form.update(f => ({ ...f, [field]: value }));
    // Live update stores for real-time cost preview
    const data = this.form();
    this.applyToStores(data);
  }

  private applyToStores(p: any): void {
    this.ironStore.wireDiameter.set(p.wire_diameter);
    this.ironStore.exposedLength.set(p.exposed_length);
    this.ironStore.internalLength.set(p.internal_length);
    this.ironStore.materialShape.set(p.material_shape || 'round');
    this.ironStore.steelType.set(p.steel_type || '8660');
    this.ironStore.hasHexRing.set(!!p.has_hex_ring);
    this.ironStore.hasThroughHead.set(!!p.has_through_head);
    this.ironStore.hasTpDrill.set(!!p.has_tp_drill);
    this.ironStore.hasStamp.set(!!p.has_stamp);
    if (p.handle_size) this.pricingStore.handleSize.set(p.handle_size);
    if (p.handle_model) this.pricingStore.handleModel.set(p.handle_model);
  }

  toProcessCard(p: any): ProcessCardData {
    return { processId: p.id, order: p.order, label: p.label, cost: p.cost, enabled: p.enabled, optional: p.optional, calcMethod: p.calcMethod, formulaDisplay: null };
  }

  shapeLabel(s: string): string {
    return s === 'round' ? '圓鐵' : s === 'hex' ? '六角' : s === 'square' ? '四角' : s;
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
