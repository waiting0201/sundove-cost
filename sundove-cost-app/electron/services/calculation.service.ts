import { getDb } from '../database/connection';

interface CostBreakdown {
  iron_raw: number;
  forming: number;
  heat_treatment: number;
  sandblasting: number;
  electroplating: number;
  blackening: number;
  sleeve: number;
  straightening: number;
  hex_ring: number;
  through_head: number;
  total: number;
}

interface PricingResult {
  bulk_price: number;
  tag_price: number;
  bulk_usd: number;
  tag_usd: number;
}

// Cached prepared statements (created once, reused)
let stmtCache: Record<string, any> | null = null;

export function clearStatementCache(): void {
  stmtCache = null;
}

function getStatements() {
  if (stmtCache) return stmtCache;
  const db = getDb();
  stmtCache = {
    ironMaterial: db.prepare('SELECT * FROM iron_material_prices'),
    forming: db.prepare('SELECT * FROM forming_prices'),
    heatTreatment: db.prepare('SELECT * FROM heat_treatment_prices'),
    sandblasting: db.prepare('SELECT * FROM sandblasting_prices'),
    electroplating: db.prepare('SELECT * FROM electroplating_prices'),
    blackening: db.prepare('SELECT * FROM blackening_prices'),
    sleeve: db.prepare('SELECT * FROM sleeve_prices'),
    straightening: db.prepare('SELECT * FROM straightening_prices'),
    hexRing: db.prepare('SELECT * FROM hex_ring_prices'),
    throughHead: db.prepare('SELECT * FROM through_head_prices'),
    globalParams: db.prepare('SELECT * FROM global_params'),
    allProducts: db.prepare('SELECT * FROM products ORDER BY sku'),
  };
  return stmtCache;
}

// Load all price tables into memory for batch calculation
function loadPriceTables() {
  const stmts = getStatements();
  return {
    ironMaterial: stmts.ironMaterial.all() as any[],
    forming: stmts.forming.all() as any[],
    heatTreatment: stmts.heatTreatment.all() as any[],
    sandblasting: stmts.sandblasting.all() as any[],
    electroplating: stmts.electroplating.all() as any[],
    blackening: stmts.blackening.all() as any[],
    sleeve: stmts.sleeve.all() as any[],
    straightening: stmts.straightening.all() as any[],
    hexRing: stmts.hexRing.all() as any[],
    throughHead: stmts.throughHead.all() as any[],
    globalParams: new Map(
      (stmts.globalParams.all() as any[]).map(p => [p.key, p.value])
    ),
  };
}

function findRange(rows: any[], key: string, keyVal: string, length: number) {
  return rows.find(r => r[key] === keyVal && length >= (r.length_min ?? 0) && length <= (r.length_max ?? 99999));
}

function matchWireDiameterKey(wd: number) {
  if (wd <= 3) return '3MM';
  if (wd <= 4) return '4MM';
  if (wd <= 4.5) return '4.5MM';
  if (wd <= 5.5) return '5~5.5MM';
  return '6MM~';
}

export function calculateIronCost(product: any, tables: ReturnType<typeof loadPriceTables>): CostBreakdown {
  const wd = product.wire_diameter;
  const totalLen = product.exposed_length + product.internal_length;
  const shape = product.material_shape || 'round';
  const density = tables.globalParams.get(
    shape === 'round' ? 'density_round' : shape === 'hex' ? 'density_hex' : 'density_square'
  ) ?? 0.00617;
  const weight = wd * wd * totalLen * density;

  // 1. Iron raw material
  const diaKey = matchWireDiameterKey(wd);
  const ironRow = tables.ironMaterial.find(r => r.steel_type === (product.steel_type || '8660') && r.shape === (shape === 'round' ? 'round' : 'hex') && r.wire_diameter === diaKey);
  let ironUnitPrice = ironRow ? ironRow.calculated_price : 0;
  if (wd <= 3 && shape === 'round') ironUnitPrice = 102.08;
  const iron_raw = weight / 1000 * ironUnitPrice;

  // 2. Forming
  const fRange = wd <= 4 ? 'PH 3.4MM' : 'PH 5.6MM';
  const fRow = findRange(tables.forming, 'diameter_range', fRange, totalLen);
  let forming = fRow ? fRow.calculated_price : 0;
  if (product.has_tp_drill) forming += 1;
  if (product.has_stamp) forming += 0.2;

  // 3. Heat treatment
  const htCond = totalLen >= 500 ? '總長500MM以上' : wd <= 3.8 ? '3.8MM以下' : '4MM以上';
  const htMat = (product.steel_type || '8660').includes('6150') ? '6150' : '8660.S2';
  const htRow = tables.heatTreatment.find(r => r.material === htMat && r.condition === htCond);
  const heat_treatment = htRow ? weight * htRow.calculated_price / 1000 : 0;

  // 4. Sandblasting
  const sdKey = wd <= 3 ? '3MM' : wd <= 4 ? '4MM' : '5MM';
  const sdRow = findRange(tables.sandblasting, 'wire_diameter', sdKey, totalLen);
  const sandblasting = sdRow ? weight * sdRow.calculated_price / 1000 : 0;

  // 5. Electroplating (uses exposed length)
  const epKey = wd <= 3 ? '3MM' : '4MM';
  const epRow = findRange(tables.electroplating, 'wire_diameter', epKey, product.exposed_length);
  const electroplating = epRow ? epRow.calculated_price : 0;

  // 6. Blackening
  const bkKey = wd <= 3 ? '3MM' : wd <= 4 ? '4MM' : wd <= 5 ? '5MM' : '6MM';
  const bkRow = tables.blackening.find(r => r.wire_diameter === bkKey);
  const blackening = bkRow
    ? (bkRow.pricing_method === 'fixed_per_piece' ? bkRow.calculated_price : weight * bkRow.calculated_price / 1000)
    : 0;

  // 7. Sleeve
  const slKey = wd <= 3 ? 'PH3MM' : wd <= 4 ? 'PH4MM' : wd <= 5 ? 'PH5MM' : wd <= 6 ? 'PH6MM' : wd <= 8 ? 'PH8MM' : 'PH10MM';
  const slRow = tables.sleeve.find(r => r.wire_diameter === slKey);
  const sleeve = slRow ? slRow.calculated_price : 0;

  // 8. Straightening
  let straightening = 0;
  if (!(wd <= 3 && totalLen < 130)) {
    const stKey = wd <= 5.5 ? '3.4.5MM' : '6MM';
    const stRow = findRange(tables.straightening, 'wire_diameter', stKey, totalLen);
    if (stRow) straightening = (totalLen / 25) * stRow.calculated_price;
  }

  // 9. Hex ring
  const hex_ring = product.has_hex_ring
    ? (tables.hexRing.find(r => r.size === `${Math.round(wd)}MM`)?.calculated_price ?? 0)
    : 0;

  // 10. Through head
  const through_head = product.has_through_head
    ? (tables.throughHead.find(r => r.size === `${Math.round(wd)}MM`)?.calculated_price ?? 0)
    : 0;

  const total = iron_raw + forming + heat_treatment + sandblasting + electroplating + blackening + sleeve + straightening + hex_ring + through_head;

  return { iron_raw, forming, heat_treatment, sandblasting, electroplating, blackening, sleeve, straightening, hex_ring, through_head, total };
}

export function calculateAllProducts(): { sku: string; ironCost: number; bulkPrice: number; tagPrice: number }[] {
  const stmts = getStatements();
  const products = stmts.allProducts.all() as any[];
  const tables = loadPriceTables();

  return products.map(p => {
    const cost = calculateIronCost(p, tables);
    return { sku: p.sku, ironCost: cost.total, bulkPrice: 0, tagPrice: 0 };
  });
}

export interface CascadePreviewItem {
  sku: string;
  oldIronCost: number;
  newIronCost: number;
  diff: number;
  diffPercent: number;
}

export function previewCascade(tableId: string, rowId: number, field: string, newValue: number): {
  items: CascadePreviewItem[];
  affectedCount: number;
  avgDiff: number;
} {
  const db = getDb();
  const stmts = getStatements();
  const products = stmts.allProducts.all() as any[];

  // Calculate with current values
  const tablesBefore = loadPriceTables();
  const before = products.map(p => ({ sku: p.sku, cost: calculateIronCost(p, tablesBefore).total }));

  // Temporarily update the value inside a SAVEPOINT (auto-rollback, no disk write)
  const TABLE_MAP: Record<string, string> = {
    'iron-material': 'iron_material_prices', 'forming': 'forming_prices',
    'heat-treatment': 'heat_treatment_prices', 'sandblasting': 'sandblasting_prices',
    'electroplating': 'electroplating_prices', 'blackening': 'blackening_prices',
    'sleeve': 'sleeve_prices', 'straightening': 'straightening_prices',
    'hex-ring': 'hex_ring_prices', 'through-head': 'through_head_prices',
  };
  const tableName = TABLE_MAP[tableId];
  if (!tableName) return { items: [], affectedCount: 0, avgDiff: 0 };

  // Use SAVEPOINT so the temp change never hits disk
  db.exec('SAVEPOINT cascade_preview');
  db.prepare(`UPDATE ${tableName} SET ${field} = ? WHERE id = ?`).run(newValue, rowId);
  const tablesAfter = loadPriceTables();
  const after = products.map(p => ({ sku: p.sku, cost: calculateIronCost(p, tablesAfter).total }));
  db.exec('ROLLBACK TO cascade_preview');
  db.exec('RELEASE cascade_preview');

  const items: CascadePreviewItem[] = [];
  for (let i = 0; i < products.length; i++) {
    const diff = after[i].cost - before[i].cost;
    if (Math.abs(diff) > 0.0001) {
      items.push({
        sku: before[i].sku,
        oldIronCost: before[i].cost,
        newIronCost: after[i].cost,
        diff,
        diffPercent: before[i].cost > 0 ? (diff / before[i].cost) * 100 : 0,
      });
    }
  }

  const avgDiff = items.length > 0 ? items.reduce((s, i) => s + i.diffPercent, 0) / items.length : 0;

  return { items, affectedCount: items.length, avgDiff };
}
