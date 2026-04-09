import { Injectable, inject, signal, computed } from '@angular/core';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { IronCostStore } from '../iron-cost/iron-cost.store';

@Injectable({ providedIn: 'root' })
export class PricingStore {
  private readonly ipc = inject(ElectronIpcService);
  private readonly ironCostStore = inject(IronCostStore);

  // ==========================================
  // Source signals
  // ==========================================
  readonly pricingMode = signal<'bulk' | 'tag'>('bulk');
  readonly handleModel = signal('K25_DEFAULT');
  readonly handleSize = signal('小柄');
  readonly packagingType = signal('散裝');
  readonly cartonQuantity = signal(60);

  // Iron cost: can come from IronCostStore or manual override
  readonly ironCostOverride = signal<number | null>(null);
  readonly useOverride = signal(false);

  // ==========================================
  // Price table data (loaded from DB)
  // ==========================================
  readonly handlePrices = signal<any[]>([]);
  readonly packagingPrices = signal<any[]>([]);
  readonly boxPrices = signal<any[]>([]);
  readonly shippingPrices = signal<any[]>([]);

  // Global params
  readonly taxRate = signal(1.061);
  readonly profitBulk = signal(1.5);
  readonly profitTag = signal(1.5);
  readonly printingFee = signal(1.0);
  readonly bulkPackaging = signal(0.8);
  readonly tagSticker = signal(0.8);
  readonly boxMarkup = signal(1.08);
  readonly shippingMarkup = signal(3.0);
  readonly exchangeRate = signal(29.5);
  readonly priceMarkup = signal(1.0);

  readonly loaded = signal(false);

  // ==========================================
  // Derived: Iron cost source
  // ==========================================
  readonly ironCost = computed(() =>
    this.useOverride() && this.ironCostOverride() !== null
      ? this.ironCostOverride()!
      : this.ironCostStore.totalIronCost()
  );

  // ==========================================
  // Handle price lookup
  // ==========================================
  readonly handlePrice = computed(() => {
    const row = this.handlePrices().find(
      r => r.model === this.handleModel() && r.handle_size === this.handleSize()
    );
    return row?.price ?? 0;
  });

  // ==========================================
  // Step 1: Handle cost = iron + handle + printing
  // ==========================================
  readonly handleCost = computed(() =>
    this.ironCost() + this.handlePrice() + this.printingFee()
  );

  // ==========================================
  // Packaging cost
  // ==========================================
  readonly packagingCost = computed(() => {
    if (this.pricingMode() === 'bulk') {
      return this.bulkPackaging();
    }
    // Tag mode: sticker(0.8) + tag packaging(2.1) + packaging(0.8)
    const pkgRow = this.packagingPrices().find(r => r.packaging_type === '普通吊牌');
    const tagPkg = pkgRow?.calculated_price ?? 2.1;
    return this.tagSticker() + tagPkg + this.bulkPackaging();
  });

  // ==========================================
  // Box (carton) cost
  // ==========================================
  readonly boxCost = computed(() => {
    const row = this.boxPrices().find(
      r => r.handle_size === this.handleSize() && r.quantity === this.cartonQuantity()
    );
    const baseRate = row?.base_rate ?? 0;
    return baseRate * this.boxMarkup();
  });

  // ==========================================
  // Shipping cost
  // ==========================================
  readonly shippingCost = computed(() => {
    const totalLen = this.ironCostStore.totalLength();
    const row = this.shippingPrices().find(
      r => r.handle_size === this.handleSize() &&
        totalLen >= (r.length_min ?? 0) &&
        totalLen <= (r.length_max ?? 99999)
    );
    const baseRate = row?.base_rate ?? 0;
    return baseRate * this.shippingMarkup();
  });

  // ==========================================
  // Step 2: Total cost
  // ==========================================
  readonly totalCost = computed(() =>
    this.handleCost() + this.packagingCost() + this.boxCost() + this.shippingCost()
  );

  // ==========================================
  // Step 3: Adjusted cost (× price markup)
  // ==========================================
  readonly adjustedCost = computed(() =>
    this.totalCost() * this.priceMarkup()
  );

  // ==========================================
  // Step 4: After tax
  // ==========================================
  readonly afterTax = computed(() =>
    this.adjustedCost() * this.taxRate()
  );

  // ==========================================
  // Step 5: Selling price (× profit rate)
  // ==========================================
  readonly profitRate = computed(() =>
    this.pricingMode() === 'bulk' ? this.profitBulk() : this.profitTag()
  );

  readonly sellingPrice = computed(() =>
    this.afterTax() * this.profitRate()
  );

  // ==========================================
  // Step 6: Profit
  // ==========================================
  readonly profit = computed(() =>
    this.sellingPrice() - this.afterTax()
  );

  // ==========================================
  // Step 7: USD price
  // ==========================================
  readonly usdPrice = computed(() =>
    this.sellingPrice() / this.exchangeRate()
  );

  // ==========================================
  // Pricing breakdown for display
  // ==========================================
  readonly pricingBreakdown = computed(() => [
    { label: '鐵件價格',     value: this.ironCost() },
    { label: `+ 手柄(${this.handleSize()})`, value: this.handlePrice() },
    { label: '+ 印刷費',     value: this.printingFee() },
    { label: '= 手柄成本',   value: this.handleCost(), isSub: true },
    { label: '+ 包裝費',     value: this.packagingCost() },
    { label: '+ 紙箱費',     value: this.boxCost() },
    { label: '+ 運費',       value: this.shippingCost() },
    { label: '= 總成本',     value: this.totalCost(), isSub: true },
    { label: `× 漲幅 ${this.priceMarkup()}`, value: this.adjustedCost() },
    { label: `× 稅率 ${this.taxRate()}`,     value: this.afterTax() },
    { label: `× 利潤 ${this.profitRate()}`,  value: this.sellingPrice(), isTotal: true },
    { label: '利潤',         value: this.profit() },
    { label: '美金價',       value: this.usdPrice(), isUsd: true },
  ]);

  // ==========================================
  // Load price tables
  // ==========================================
  async loadPriceTables(): Promise<void> {
    const [handle, packaging, box, shipping, globalParams] = await Promise.all([
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'handle' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'packaging' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'box' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'shipping' }),
      this.ipc.invoke<any[]>('global-params:get'),
    ]);

    this.handlePrices.set(handle);
    this.packagingPrices.set(packaging);
    this.boxPrices.set(box);
    this.shippingPrices.set(shipping);

    const paramMap = new Map(globalParams.map((p: any) => [p.key, p.value]));
    if (paramMap.has('tax_rate')) this.taxRate.set(paramMap.get('tax_rate')!);
    if (paramMap.has('profit_bulk')) this.profitBulk.set(paramMap.get('profit_bulk')!);
    if (paramMap.has('profit_tag')) this.profitTag.set(paramMap.get('profit_tag')!);
    if (paramMap.has('printing_fee')) this.printingFee.set(paramMap.get('printing_fee')!);
    if (paramMap.has('bulk_packaging')) this.bulkPackaging.set(paramMap.get('bulk_packaging')!);
    if (paramMap.has('tag_sticker')) this.tagSticker.set(paramMap.get('tag_sticker')!);
    if (paramMap.has('box_markup')) this.boxMarkup.set(paramMap.get('box_markup')!);
    if (paramMap.has('shipping_markup')) this.shippingMarkup.set(paramMap.get('shipping_markup')!);
    if (paramMap.has('exchange_rate')) this.exchangeRate.set(paramMap.get('exchange_rate')!);
    if (paramMap.has('price_markup')) this.priceMarkup.set(paramMap.get('price_markup')!);

    this.loaded.set(true);
  }
}
