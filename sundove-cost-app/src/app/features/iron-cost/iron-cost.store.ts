import { Injectable, inject, signal, computed, resource } from '@angular/core';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import {
  calcIronRawMaterial, calcForming, calcHeatTreatment,
  calcSandblasting, calcElectroplating, calcBlackening,
  calcSleeve, calcStraightening, calcHexRing, calcThroughHead,
} from './services/iron-cost-lookup';

@Injectable({ providedIn: 'root' })
export class IronCostStore {
  private readonly ipc = inject(ElectronIpcService);

  // ==========================================
  // Source signals (user inputs)
  // ==========================================
  readonly wireDiameter = signal(3);
  readonly exposedLength = signal(60);
  readonly internalLength = signal(60);
  readonly materialShape = signal<'round' | 'hex' | 'square'>('round');
  readonly steelType = signal('8660');
  readonly hasHexRing = signal(false);
  readonly hasThroughHead = signal(false);
  readonly hasTpDrill = signal(false);
  readonly hasStamp = signal(false);

  // ==========================================
  // Price table data (loaded from DB)
  // ==========================================
  readonly ironMaterialPrices = signal<any[]>([]);
  readonly formingPrices = signal<any[]>([]);
  readonly heatTreatmentPrices = signal<any[]>([]);
  readonly sandblastingPrices = signal<any[]>([]);
  readonly electroplatingPrices = signal<any[]>([]);
  readonly blackeningPrices = signal<any[]>([]);
  readonly sleevePrices = signal<any[]>([]);
  readonly straighteningPrices = signal<any[]>([]);
  readonly hexRingPrices = signal<any[]>([]);
  readonly throughHeadPrices = signal<any[]>([]);

  // Global params
  readonly densityRound = signal(0.00617);
  readonly densityHex = signal(0.00680);
  readonly densitySquare = signal(0.00785);

  // Loading state
  readonly loaded = signal(false);

  // ==========================================
  // Derived computed signals
  // ==========================================
  readonly totalLength = computed(() => this.exposedLength() + this.internalLength());

  readonly density = computed(() => {
    switch (this.materialShape()) {
      case 'round': return this.densityRound();
      case 'hex': return this.densityHex();
      case 'square': return this.densitySquare();
    }
  });

  readonly weight = computed(() =>
    this.wireDiameter() * this.wireDiameter() * this.totalLength() * this.density()
  );

  // ==========================================
  // Process 1: Iron raw material
  // ==========================================
  readonly ironRawResult = computed(() =>
    calcIronRawMaterial(
      this.wireDiameter(), this.totalLength(), this.materialShape(),
      this.densityRound(), this.densityHex(), this.densitySquare(),
      this.ironMaterialPrices()
    )
  );
  readonly ironRawCost = computed(() => this.ironRawResult().cost);

  // ==========================================
  // Process 2: Forming
  // ==========================================
  readonly formingResult = computed(() =>
    calcForming(this.wireDiameter(), this.totalLength(), this.formingPrices(), this.hasTpDrill(), this.hasStamp())
  );
  readonly formingCost = computed(() => this.formingResult().cost);

  // ==========================================
  // Process 3: Heat treatment
  // ==========================================
  readonly heatTreatmentResult = computed(() =>
    calcHeatTreatment(this.weight(), this.wireDiameter(), this.totalLength(), this.steelType(), this.heatTreatmentPrices())
  );
  readonly heatTreatmentCost = computed(() => this.heatTreatmentResult().cost);

  // ==========================================
  // Process 4: Sandblasting
  // ==========================================
  readonly sandblastingResult = computed(() =>
    calcSandblasting(this.weight(), this.wireDiameter(), this.totalLength(), this.sandblastingPrices())
  );
  readonly sandblastingCost = computed(() => this.sandblastingResult().cost);

  // ==========================================
  // Process 5: Electroplating
  // ==========================================
  readonly electroplatingResult = computed(() =>
    calcElectroplating(this.wireDiameter(), this.exposedLength(), this.electroplatingPrices())
  );
  readonly electroplatingCost = computed(() => this.electroplatingResult().cost);

  // ==========================================
  // Process 6: Blackening
  // ==========================================
  readonly blackeningResult = computed(() =>
    calcBlackening(this.weight(), this.wireDiameter(), this.blackeningPrices())
  );
  readonly blackeningCost = computed(() => this.blackeningResult().cost);

  // ==========================================
  // Process 7: Sleeve
  // ==========================================
  readonly sleeveCost = computed(() =>
    calcSleeve(this.wireDiameter(), this.sleevePrices()).cost
  );

  // ==========================================
  // Process 8: Straightening
  // ==========================================
  readonly straighteningResult = computed(() =>
    calcStraightening(this.wireDiameter(), this.totalLength(), this.straighteningPrices())
  );
  readonly straighteningCost = computed(() => this.straighteningResult().cost);

  // ==========================================
  // Process 9: Hex ring (optional)
  // ==========================================
  readonly hexRingCost = computed(() =>
    this.hasHexRing() ? calcHexRing(this.wireDiameter(), this.hexRingPrices()).cost : 0
  );

  // ==========================================
  // Process 10: Through head (optional)
  // ==========================================
  readonly throughHeadCost = computed(() =>
    this.hasThroughHead() ? calcThroughHead(this.wireDiameter(), this.throughHeadPrices()).cost : 0
  );

  // ==========================================
  // TOTAL iron cost
  // ==========================================
  readonly totalIronCost = computed(() =>
    this.ironRawCost() +
    this.formingCost() +
    this.heatTreatmentCost() +
    this.sandblastingCost() +
    this.electroplatingCost() +
    this.blackeningCost() +
    this.sleeveCost() +
    this.straighteningCost() +
    this.hexRingCost() +
    this.throughHeadCost()
  );

  // ==========================================
  // Process breakdown for display
  // ==========================================
  readonly processBreakdown = computed(() => [
    { id: 'iron_raw',       order: 1,  label: '鐵材原料', cost: this.ironRawCost(),       enabled: true,  optional: false, calcMethod: 'weight_based' },
    { id: 'forming',        order: 2,  label: '成形',     cost: this.formingCost(),        enabled: true,  optional: false, calcMethod: 'lookup' },
    { id: 'heat_treatment', order: 3,  label: '熱處理',   cost: this.heatTreatmentCost(),  enabled: true,  optional: false, calcMethod: 'weight_based' },
    { id: 'sandblasting',   order: 4,  label: '噴砂',     cost: this.sandblastingCost(),   enabled: true,  optional: false, calcMethod: 'weight_based' },
    { id: 'electroplating', order: 5,  label: '電鍍',     cost: this.electroplatingCost(), enabled: true,  optional: false, calcMethod: 'lookup' },
    { id: 'blackening',     order: 6,  label: '染黑',     cost: this.blackeningCost(),     enabled: true,  optional: false, calcMethod: 'mixed' },
    { id: 'sleeve',         order: 7,  label: '膠套',     cost: this.sleeveCost(),         enabled: true,  optional: false, calcMethod: 'fixed_per_piece' },
    { id: 'straightening',  order: 8,  label: '整直',     cost: this.straighteningCost(),  enabled: true,  optional: false, calcMethod: 'lookup' },
    { id: 'hex_ring',       order: 9,  label: '六角環',   cost: this.hexRingCost(),        enabled: this.hasHexRing(), optional: true, calcMethod: 'multi_component' },
    { id: 'through_head',   order: 10, label: '貫通頭',   cost: this.throughHeadCost(),     enabled: this.hasThroughHead(), optional: true, calcMethod: 'multi_component' },
  ]);

  // ==========================================
  // Load all price tables from DB via IPC
  // ==========================================
  async loadPriceTables(): Promise<void> {
    const [
      ironMaterial, forming, heatTreatment, sandblasting,
      electroplating, blackening, sleeve, straightening,
      hexRing, throughHead, globalParams,
    ] = await Promise.all([
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'iron-material' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'forming' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'heat-treatment' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'sandblasting' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'electroplating' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'blackening' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'sleeve' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'straightening' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'hex-ring' }),
      this.ipc.invoke<any[]>('price-table:list', { tableId: 'through-head' }),
      this.ipc.invoke<any[]>('global-params:get'),
    ]);

    this.ironMaterialPrices.set(ironMaterial);
    this.formingPrices.set(forming);
    this.heatTreatmentPrices.set(heatTreatment);
    this.sandblastingPrices.set(sandblasting);
    this.electroplatingPrices.set(electroplating);
    this.blackeningPrices.set(blackening);
    this.sleevePrices.set(sleeve);
    this.straighteningPrices.set(straightening);
    this.hexRingPrices.set(hexRing);
    this.throughHeadPrices.set(throughHead);

    // Set global density params
    const paramMap = new Map(globalParams.map((p: any) => [p.key, p.value]));
    if (paramMap.has('density_round')) this.densityRound.set(paramMap.get('density_round')!);
    if (paramMap.has('density_hex')) this.densityHex.set(paramMap.get('density_hex')!);
    if (paramMap.has('density_square')) this.densitySquare.set(paramMap.get('density_square')!);

    this.loaded.set(true);
  }
}
