/**
 * Mock data for browser-only development (no Electron).
 * Mirrors the seed data from migrations so the UI can be previewed.
 */

const globalParams = [
  { key: 'density_round',   value: 0.00617, label: '圓鐵比重',     module: 'A', affects: '所有圓鐵產品重量' },
  { key: 'density_hex',     value: 0.00680, label: '六角比重',     module: 'A', affects: '所有六角產品重量' },
  { key: 'density_square',  value: 0.00785, label: '四角比重',     module: 'A', affects: '所有四角產品重量' },
  { key: 'tax_rate',        value: 1.061,   label: '稅率',         module: 'B', affects: '所有產品售價' },
  { key: 'profit_bulk',     value: 1.5,     label: '散裝利潤倍率', module: 'B', affects: '散裝售價' },
  { key: 'profit_tag',      value: 1.5,     label: '吊牌利潤倍率', module: 'B', affects: '吊牌售價' },
  { key: 'printing_fee',    value: 1.0,     label: '印刷費(元/支)', module: 'B', affects: '所有產品' },
  { key: 'bulk_packaging',  value: 0.8,     label: '散裝包裝費',   module: 'B', affects: '散裝產品' },
  { key: 'tag_sticker',     value: 0.8,     label: '吊牌貼紙費',   module: 'B', affects: '吊牌產品' },
  { key: 'box_markup',      value: 1.08,    label: '紙箱漲幅',     module: 'B', affects: '所有紙箱費' },
  { key: 'shipping_markup', value: 3.0,     label: '運費漲幅',     module: 'B', affects: '所有運費' },
  { key: 'exchange_rate',   value: 29.5,    label: '匯率(NTD/USD)', module: 'B', affects: '所有美金價' },
  { key: 'price_markup',    value: 1.0,     label: '預抓漲幅',     module: 'B', affects: '所有產品售價' },
];

const processRegistry = [
  { id: 'iron_raw',       order: 1,  label: '鐵材原料', calc_method: 'weight_based',    enabled: 1, optional: 0, price_table: 'iron_material_prices',  formula_display: 'd² × L × ρ × price/kg' },
  { id: 'forming',        order: 2,  label: '成形',     calc_method: 'lookup',          enabled: 1, optional: 0, price_table: 'forming_prices',         formula_display: '查表(線徑+長度) × 漲幅' },
  { id: 'heat_treatment', order: 3,  label: '熱處理',   calc_method: 'weight_based',    enabled: 1, optional: 0, price_table: 'heat_treatment_prices',  formula_display: '重量 × price/kg' },
  { id: 'sandblasting',   order: 4,  label: '噴砂',     calc_method: 'weight_based',    enabled: 1, optional: 0, price_table: 'sandblasting_prices',    formula_display: '重量 × price/kg' },
  { id: 'electroplating', order: 5,  label: '電鍍',     calc_method: 'lookup',          enabled: 1, optional: 0, price_table: 'electroplating_prices',  formula_display: '查表(線徑+長度)' },
  { id: 'blackening',     order: 6,  label: '染黑',     calc_method: 'mixed',           enabled: 1, optional: 0, price_table: 'blackening_prices',      formula_display: '3mm固定/支; 4mm+重量計' },
  { id: 'sleeve',         order: 7,  label: '膠套',     calc_method: 'fixed_per_piece', enabled: 1, optional: 0, price_table: 'sleeve_prices',          formula_display: '(顆粒價+穿工) × 漲幅' },
  { id: 'straightening',  order: 8,  label: '整直',     calc_method: 'lookup',          enabled: 1, optional: 0, price_table: 'straightening_prices',   formula_display: '總長/25 × 區間單價' },
  { id: 'hex_ring',       order: 9,  label: '六角環',   calc_method: 'multi_component', enabled: 1, optional: 1, price_table: 'hex_ring_prices',        formula_display: '(鍛品+車修+熱處理+噴砂+電鍍+焊工) × 漲幅' },
  { id: 'through_head',   order: 10, label: '貫通頭',   calc_method: 'multi_component', enabled: 1, optional: 1, price_table: 'through_head_prices',    formula_display: '(鍛品+加工) × 漲幅' },
];

const ironMaterialPrices = [
  { id: 1, steel_type: '8660', shape: 'round', wire_diameter: '3MM',     base_price: 84.8, markup: 1.1, calculated_price: 93.28 },
  { id: 2, steel_type: '8660', shape: 'round', wire_diameter: '4MM',     base_price: 69.8, markup: 1.1, calculated_price: 76.78 },
  { id: 3, steel_type: '8660', shape: 'round', wire_diameter: '4.5MM',   base_price: 68.8, markup: 1.1, calculated_price: 75.68 },
  { id: 4, steel_type: '8660', shape: 'round', wire_diameter: '5~5.5MM', base_price: 58.8, markup: 1.1, calculated_price: 64.68 },
  { id: 5, steel_type: '8660', shape: 'round', wire_diameter: '6MM~',    base_price: 57.8, markup: 1.1, calculated_price: 63.58 },
  { id: 6, steel_type: '8660', shape: 'hex',   wire_diameter: '2MM',     base_price: 84.8, markup: 1.1, calculated_price: 93.28 },
  { id: 7, steel_type: '8660', shape: 'hex',   wire_diameter: '3MM',     base_price: 84.8, markup: 1.1, calculated_price: 93.28 },
];

const formingPrices = [
  { id: 1, diameter_range: 'PH 3.4MM', length_min: 0,   length_max: 200, base_price: 0.9, markup: 1.1, calculated_price: 0.99 },
  { id: 2, diameter_range: 'PH 3.4MM', length_min: 201, length_max: 250, base_price: 1.3, markup: 1.1, calculated_price: 1.43 },
  { id: 3, diameter_range: 'PH 3.4MM', length_min: 251, length_max: 300, base_price: 1.5, markup: 1.1, calculated_price: 1.65 },
  { id: 4, diameter_range: 'PH 3.4MM', length_min: 301, length_max: 350, base_price: 2.0, markup: 1.1, calculated_price: 2.20 },
  { id: 5, diameter_range: 'PH 3.4MM', length_min: 351, length_max: 400, base_price: 3.0, markup: 1.1, calculated_price: 3.30 },
  { id: 6, diameter_range: 'PH 5.6MM', length_min: 0,   length_max: 100, base_price: 0.8, markup: 1.1, calculated_price: 0.88 },
  { id: 7, diameter_range: 'PH 5.6MM', length_min: 101, length_max: 200, base_price: 0.9, markup: 1.1, calculated_price: 0.99 },
];

const heatTreatmentPrices = [
  { id: 1, material: '8660.S2', condition: '3.8MM以下',      base_price_per_kg: 15,   markup: 1.2, calculated_price: 18 },
  { id: 2, material: '8660.S2', condition: '4MM以上',        base_price_per_kg: 10.2, markup: 1.2, calculated_price: 12.24 },
  { id: 3, material: '8660.S2', condition: '總長500MM以上',   base_price_per_kg: 31.2, markup: 1.2, calculated_price: 37.44 },
  { id: 4, material: '6150',    condition: '拔釘器300MM以下', base_price_per_kg: 10.2, markup: 1.2, calculated_price: 12.24 },
];

const sandblastingPrices = [
  { id: 1, wire_diameter: '3MM', length_min: 0, length_max: 99999, base_price_per_kg: 35, markup: 1.05, calculated_price: 36.75 },
  { id: 2, wire_diameter: '4MM', length_min: 0, length_max: 465,   base_price_per_kg: 12, markup: 1.05, calculated_price: 12.60 },
  { id: 3, wire_diameter: '4MM', length_min: 466, length_max: 580, base_price_per_kg: 18, markup: 1.05, calculated_price: 18.90 },
  { id: 4, wire_diameter: '5MM', length_min: 0, length_max: 465,   base_price_per_kg: 12, markup: 1.05, calculated_price: 12.60 },
  { id: 5, wire_diameter: '5MM', length_min: 466, length_max: 580, base_price_per_kg: 18, markup: 1.05, calculated_price: 18.90 },
];

const electroplatingPrices = [
  { id: 1, wire_diameter: '3MM', length_min: 0,   length_max: 99,  base_price: 0.87, markup: 1.05, calculated_price: 0.9135 },
  { id: 2, wire_diameter: '3MM', length_min: 100, length_max: 159, base_price: 1.09, markup: 1.05, calculated_price: 1.1445 },
  { id: 3, wire_diameter: '3MM', length_min: 160, length_max: 210, base_price: 1.74, markup: 1.05, calculated_price: 1.827 },
  { id: 4, wire_diameter: '3MM', length_min: 211, length_max: 365, base_price: 3.63, markup: 1.05, calculated_price: 3.8115 },
  { id: 5, wire_diameter: '4MM', length_min: 0,   length_max: 99,  base_price: 0.87, markup: 1.05, calculated_price: 0.9135 },
  { id: 6, wire_diameter: '4MM', length_min: 100, length_max: 149, base_price: 1.10, markup: 1.05, calculated_price: 1.155 },
  { id: 7, wire_diameter: '4MM', length_min: 150, length_max: 200, base_price: 1.40, markup: 1.05, calculated_price: 1.47 },
  { id: 8, wire_diameter: '4MM', length_min: 201, length_max: 240, base_price: 1.80, markup: 1.05, calculated_price: 1.89 },
  { id: 9, wire_diameter: '4MM', length_min: 241, length_max: 300, base_price: 2.18, markup: 1.05, calculated_price: 2.289 },
];

const blackeningPrices = [
  { id: 1, wire_diameter: '3MM',     pricing_method: 'fixed_per_piece', base_price: 0.35, markup: 1.05, calculated_price: 0.3675 },
  { id: 2, wire_diameter: '4MM',     pricing_method: 'weight_per_kg',   base_price: 15,   markup: 1.05, calculated_price: 15.75 },
  { id: 3, wire_diameter: '5MM',     pricing_method: 'weight_per_kg',   base_price: 15,   markup: 1.05, calculated_price: 15.75 },
  { id: 4, wire_diameter: '6MM',     pricing_method: 'weight_per_kg',   base_price: 13.5, markup: 1.05, calculated_price: 14.175 },
  { id: 5, wire_diameter: '6MM以上', pricing_method: 'weight_per_kg',   base_price: 13.5, markup: 1.05, calculated_price: 14.175 },
];

const sleevePrices = [
  { id: 1, wire_diameter: 'PH3MM',  pellet_price: 0.09, threading_fee: 0.2, markup: 1.1, calculated_price: 0.319 },
  { id: 2, wire_diameter: 'PH4MM',  pellet_price: 0.09, threading_fee: 0.2, markup: 1.1, calculated_price: 0.319 },
  { id: 3, wire_diameter: 'PH5MM',  pellet_price: 0.18, threading_fee: 0.2, markup: 1.1, calculated_price: 0.418 },
  { id: 4, wire_diameter: 'PH6MM',  pellet_price: 0.21, threading_fee: 0.2, markup: 1.1, calculated_price: 0.451 },
  { id: 5, wire_diameter: 'PH8MM',  pellet_price: 0.23, threading_fee: 0.2, markup: 1.1, calculated_price: 0.473 },
  { id: 6, wire_diameter: 'PH10MM', pellet_price: 0.23, threading_fee: 0.2, markup: 1.1, calculated_price: 0.473 },
];

const straighteningPrices = [
  { id: 1, wire_diameter: '3.4.5MM', length_min: 0,   length_max: 200, base_price: 0.18, markup: 1.05, calculated_price: 0.189 },
  { id: 2, wire_diameter: '3.4.5MM', length_min: 201, length_max: 300, base_price: 0.24, markup: 1.05, calculated_price: 0.252 },
  { id: 3, wire_diameter: '3.4.5MM', length_min: 301, length_max: 400, base_price: 0.30, markup: 1.05, calculated_price: 0.315 },
  { id: 4, wire_diameter: '6MM',     length_min: 0,   length_max: 300, base_price: 0.18, markup: 1.05, calculated_price: 0.189 },
  { id: 5, wire_diameter: '6MM',     length_min: 301, length_max: 450, base_price: 0.30, markup: 1.05, calculated_price: 0.315 },
];

const hexRingPrices = [
  { id: 1, size: '5MM', forging: 3.0, lathe: 1.0, heat_treatment: 0, sandblasting: 0, electroplating: 0, welding: 1.0, markup: 1.05, calculated_price: 5.25 },
  { id: 2, size: '6MM', forging: 3.0, lathe: 1.0, heat_treatment: 0, sandblasting: 0, electroplating: 0, welding: 1.0, markup: 1.05, calculated_price: 5.25 },
  { id: 3, size: '7MM', forging: 3.2, lathe: 1.0, heat_treatment: 0, sandblasting: 0, electroplating: 0, welding: 1.0, markup: 1.05, calculated_price: 5.46 },
  { id: 4, size: '8MM', forging: 3.2, lathe: 1.0, heat_treatment: 0, sandblasting: 0, electroplating: 0, welding: 1.0, markup: 1.05, calculated_price: 5.46 },
];

const throughHeadPrices = [
  { id: 1, size: '4MM', forging: 3.72, processing: 3.64, markup: 1.05, calculated_price: 7.728 },
  { id: 2, size: '5MM', forging: 3.72, processing: 3.64, markup: 1.05, calculated_price: 7.728 },
  { id: 3, size: '6MM', forging: 5.00, processing: 4.29, markup: 1.05, calculated_price: 9.755 },
  { id: 4, size: '7MM', forging: 7.80, processing: 5.33, markup: 1.05, calculated_price: 13.787 },
  { id: 5, size: '8MM', forging: 7.80, processing: 5.33, markup: 1.05, calculated_price: 13.787 },
];

const handlePrices = [
  { id: 1, model: 'K25_DEFAULT', handle_size: '大大柄', price: 10.88 },
  { id: 2, model: 'K25_DEFAULT', handle_size: '大柄',   price: 9.41 },
  { id: 3, model: 'K25_DEFAULT', handle_size: '中柄',   price: 8.09 },
  { id: 4, model: 'K25_DEFAULT', handle_size: '小柄',   price: 6.17 },
  { id: 5, model: 'K25_DEFAULT', handle_size: '陀螺',   price: 7.59 },
  { id: 6, model: '993', handle_size: '大柄', price: 7.6 },
  { id: 7, model: '993', handle_size: '中柄', price: 5.7 },
  { id: 8, model: '993', handle_size: '小柄', price: 2.84 },
  { id: 9, model: '993', handle_size: '精密柄', price: 2.5 },
  { id: 10, model: '993', handle_size: '陀螺', price: 4.1 },
];

const packagingPrices = [
  { id: 1, packaging_type: '散裝',     labor: 0.8, tag_cost: 0, sticker_cost: 0, base_total: 0.8, markup: 1, calculated_price: 0.8 },
  { id: 2, packaging_type: '普通吊牌', labor: 0.5, tag_cost: 1.2, sticker_cost: 0.4, base_total: 2.1, markup: 1, calculated_price: 2.1 },
];

const boxPrices = [
  { id: 1, handle_size: '小柄', quantity: 60, base_rate: 0.70 },
  { id: 2, handle_size: '小柄', quantity: 80, base_rate: 0.70 },
  { id: 3, handle_size: '小柄', quantity: 100, base_rate: 0.73 },
  { id: 4, handle_size: '中柄', quantity: 100, base_rate: 0.84 },
  { id: 5, handle_size: '大柄', quantity: 100, base_rate: 1.08 },
];

const shippingPrices = [
  { id: 1, handle_size: '小柄', length_min: 0, length_max: 100, base_rate: 0.17 },
  { id: 2, handle_size: '小柄', length_min: 101, length_max: 200, base_rate: 0.19 },
  { id: 3, handle_size: '小柄', length_min: 201, length_max: 400, base_rate: 0.25 },
  { id: 4, handle_size: '中柄', length_min: 101, length_max: 200, base_rate: 0.19 },
  { id: 5, handle_size: '中柄', length_min: 201, length_max: 400, base_rate: 0.25 },
  { id: 6, handle_size: '大柄', length_min: 201, length_max: 400, base_rate: 0.34 },
];

const TABLE_DATA: Record<string, any[]> = {
  'iron-material': ironMaterialPrices,
  'forming': formingPrices,
  'heat-treatment': heatTreatmentPrices,
  'sandblasting': sandblastingPrices,
  'electroplating': electroplatingPrices,
  'blackening': blackeningPrices,
  'sleeve': sleevePrices,
  'straightening': straighteningPrices,
  'hex-ring': hexRingPrices,
  'through-head': throughHeadPrices,
  'handle': handlePrices,
  'packaging': packagingPrices,
  'box': boxPrices,
  'shipping': shippingPrices,
};

export const MOCK_DATA: Record<string, any> = {
  'global-params:get': globalParams,
  'process-registry:list': processRegistry,
  'product:list': () => [],
  'product:get': () => null,
  'product:create': () => ({ success: true, id: 1 }),
  'product:update': () => ({ success: true }),
  'product:delete': () => ({ success: true }),
  'change-log:recent': () => [],
  'global-params:update': () => ({ success: true }),
  'price-table:list-all': () => {
    const result: Record<string, number> = {};
    for (const [id, data] of Object.entries(TABLE_DATA)) {
      result[id] = data.length;
    }
    return result;
  },
  'price-table:list': (payload: any) => TABLE_DATA[payload?.tableId] ?? [],
  'price-table:update': () => ({ success: true }),
  'price-table:insert': () => ({ success: true, id: 999 }),
  'price-table:delete': () => ({ success: true }),
  'price-table:schema': () => null,
  'cascade:preview': () => ({ items: [], affectedCount: 0, avgDiff: 0 }),
  'cascade:apply': () => ({ success: true }),
  'import:excel': () => ({ success: false, reason: 'browser-mode' }),
  'export:excel': () => ({ success: false, reason: 'browser-mode' }),
  'db:path': () => '（瀏覽器模式，無資料庫）',
  'db:backup': () => ({ success: false, reason: 'browser-mode' }),
  'db:restore': () => ({ success: false, reason: 'browser-mode' }),
};
