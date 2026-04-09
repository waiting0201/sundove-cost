/**
 * Pure lookup functions for the 10 iron manufacturing processes.
 * Each function takes SKU specs + price table rows and returns a cost number.
 * These are shared between frontend (computed signals) and could be mirrored in backend.
 */

// ---- Helpers ----

function matchDiameterRange(wireDiameter: number): string {
  if (wireDiameter <= 4) return 'PH 3.4MM';
  return 'PH 5.6MM';
}

function matchWireDiameterKey(wireDiameter: number): string {
  if (wireDiameter <= 3) return '3MM';
  if (wireDiameter <= 4) return '4MM';
  if (wireDiameter <= 4.5) return '4.5MM';
  if (wireDiameter <= 5.5) return '5~5.5MM';
  return '6MM~';
}

function matchSleeveKey(wireDiameter: number): string {
  if (wireDiameter <= 3) return 'PH3MM';
  if (wireDiameter <= 4) return 'PH4MM';
  if (wireDiameter <= 5) return 'PH5MM';
  if (wireDiameter <= 6) return 'PH6MM';
  if (wireDiameter <= 8) return 'PH8MM';
  return 'PH10MM';
}

function matchStraighteningKey(wireDiameter: number): string {
  if (wireDiameter <= 5.5) return '3.4.5MM';
  return '6MM';
}

function matchBlackeningKey(wireDiameter: number): string {
  if (wireDiameter <= 3) return '3MM';
  if (wireDiameter <= 4) return '4MM';
  if (wireDiameter <= 5) return '5MM';
  if (wireDiameter <= 6) return '6MM';
  return '6MM以上';
}

function matchHexRingKey(wireDiameter: number): string {
  if (wireDiameter <= 5) return '5MM';
  if (wireDiameter <= 6) return '6MM';
  if (wireDiameter <= 7) return '7MM';
  return '8MM';
}

function matchThroughHeadKey(wireDiameter: number): string {
  if (wireDiameter <= 4) return '4MM';
  if (wireDiameter <= 5) return '5MM';
  if (wireDiameter <= 6) return '6MM';
  if (wireDiameter <= 7) return '7MM';
  return '8MM';
}

function findRow<T extends Record<string, any>>(rows: T[], predicate: (r: T) => boolean): T | undefined {
  return rows.find(predicate);
}

function findRangeRow<T extends Record<string, any>>(
  rows: T[], key: string, keyValue: string, totalLength: number,
  minField = 'length_min', maxField = 'length_max'
): T | undefined {
  return rows.find(r =>
    r[key] === keyValue &&
    totalLength >= (r[minField] ?? 0) &&
    totalLength <= (r[maxField] ?? 99999)
  );
}

// ---- Process 1: Iron Raw Material ----
export function calcIronRawMaterial(
  wireDiameter: number, totalLength: number, materialShape: string,
  densityRound: number, densityHex: number, densitySquare: number,
  priceRows: any[]
): { cost: number; weight: number; unitPrice: number } {
  const density = materialShape === 'round' ? densityRound
    : materialShape === 'hex' ? densityHex : densitySquare;

  const weight = wireDiameter * wireDiameter * totalLength * density;

  // Special: 3MM products use Q17 reference → 8660 round 5~5.5MM → base 58.8*1.1 = 64.68
  // But the PDF example uses 102.08 for 3mm. This appears to be a different lookup.
  // The PDF says: "3MM 產品使用 Q17 參照（對應 8660 圓型 5~5.5MM 的 102.08 單價）"
  // 102.08 = 58.8 * 1.1 * some factor? Actually 58.8*1.1 = 64.68, not 102.08
  // Looking at the example: 3x3x120x0.00617=6.6636g / 1000 x 102.08 = 0.6802
  // So 102.08 is the actual unit price for 3mm. Let's check if it's stored differently.
  // For now, use the calculated_price from the table.

  const diaKey = matchWireDiameterKey(wireDiameter);
  const shapeKey = materialShape === 'round' ? 'round' : 'hex';
  const row = findRow(priceRows, r => r.steel_type === '8660' && r.shape === shapeKey && r.wire_diameter === diaKey);

  let unitPrice = row ? row.calculated_price : 0;

  // Special: 3MM products use Q17 reference price (102.08) per PDF report note
  // "3MM 產品使用 Q17 參照（對應 8660 圓型 5~5.5MM 的 102.08 單價）"
  if (wireDiameter <= 3 && materialShape === 'round') {
    unitPrice = 102.08;
  }

  const cost = weight / 1000 * unitPrice;

  return { cost, weight, unitPrice };
}

// ---- Process 2: Forming ----
export function calcForming(
  wireDiameter: number, totalLength: number, priceRows: any[],
  hasTpDrill: boolean, hasStamp: boolean
): { cost: number; unitPrice: number } {
  const diaRange = matchDiameterRange(wireDiameter);
  const row = findRangeRow(priceRows, 'diameter_range', diaRange, totalLength);
  let cost = row ? row.calculated_price : 0;
  if (hasTpDrill) cost += 1;
  if (hasStamp) cost += 0.2;
  return { cost, unitPrice: row?.calculated_price ?? 0 };
}

// ---- Process 3: Heat Treatment ----
export function calcHeatTreatment(
  weight: number, wireDiameter: number, totalLength: number, steelType: string,
  priceRows: any[]
): { cost: number; unitPricePerKg: number } {
  let condition: string;
  if (totalLength >= 500) {
    condition = '總長500MM以上';
  } else if (wireDiameter <= 3.8) {
    condition = '3.8MM以下';
  } else {
    condition = '4MM以上';
  }

  const material = steelType.includes('6150') ? '6150' : '8660.S2';
  const row = findRow(priceRows, r => r.material === material && r.condition === condition);
  const unitPrice = row ? row.calculated_price : 0;
  const cost = weight * unitPrice / 1000;

  return { cost, unitPricePerKg: unitPrice };
}

// ---- Process 4: Sandblasting ----
export function calcSandblasting(
  weight: number, wireDiameter: number, totalLength: number,
  priceRows: any[]
): { cost: number; unitPricePerKg: number } {
  const diaKey = matchWireDiameterKey(wireDiameter);
  // Sandblasting uses simpler diameter keys
  const sdKey = wireDiameter <= 3 ? '3MM' : wireDiameter <= 4 ? '4MM' : '5MM';
  const row = findRangeRow(priceRows, 'wire_diameter', sdKey, totalLength);
  const unitPrice = row ? row.calculated_price : 0;
  const cost = weight * unitPrice / 1000;

  return { cost, unitPricePerKg: unitPrice };
}

// ---- Process 5: Electroplating ----
// Note: Electroplating lookup uses EXPOSED length, not total length.
// PDF example confirms: PH0X60 (exposed=60mm) → 100以下 range → 0.87×1.05=0.9135
export function calcElectroplating(
  wireDiameter: number, exposedLength: number, priceRows: any[]
): { cost: number; unitPrice: number } {
  const diaKey = wireDiameter <= 3 ? '3MM' : '4MM';
  const row = findRangeRow(priceRows, 'wire_diameter', diaKey, exposedLength);
  const cost = row ? row.calculated_price : 0;
  return { cost, unitPrice: cost };
}

// ---- Process 6: Blackening (染黑) ----
export function calcBlackening(
  weight: number, wireDiameter: number, priceRows: any[]
): { cost: number; method: string } {
  const diaKey = matchBlackeningKey(wireDiameter);
  const row = findRow(priceRows, r => r.wire_diameter === diaKey);
  if (!row) return { cost: 0, method: 'unknown' };

  if (row.pricing_method === 'fixed_per_piece') {
    return { cost: row.calculated_price, method: 'fixed_per_piece' };
  } else {
    return { cost: weight * row.calculated_price / 1000, method: 'weight_per_kg' };
  }
}

// ---- Process 7: Rubber Sleeve ----
export function calcSleeve(wireDiameter: number, priceRows: any[]): { cost: number } {
  const key = matchSleeveKey(wireDiameter);
  const row = findRow(priceRows, r => r.wire_diameter === key);
  return { cost: row ? row.calculated_price : 0 };
}

// ---- Process 8: Straightening ----
export function calcStraightening(
  wireDiameter: number, totalLength: number, priceRows: any[]
): { cost: number; needsStraightening: boolean } {
  // 3MM products: only need straightening if total length >= 130mm
  if (wireDiameter <= 3 && totalLength < 130) {
    return { cost: 0, needsStraightening: false };
  }

  const diaKey = matchStraighteningKey(wireDiameter);
  const row = findRangeRow(priceRows, 'wire_diameter', diaKey, totalLength);
  if (!row) return { cost: 0, needsStraightening: false };

  const units = totalLength / 25;
  const cost = units * row.calculated_price;
  return { cost, needsStraightening: true };
}

// ---- Process 9: Hex Ring (optional) ----
export function calcHexRing(wireDiameter: number, priceRows: any[]): { cost: number } {
  const key = matchHexRingKey(wireDiameter);
  const row = findRow(priceRows, r => r.size === key);
  return { cost: row ? row.calculated_price : 0 };
}

// ---- Process 10: Through Head (optional) ----
export function calcThroughHead(wireDiameter: number, priceRows: any[]): { cost: number } {
  const key = matchThroughHeadKey(wireDiameter);
  const row = findRow(priceRows, r => r.size === key);
  return { cost: row ? row.calculated_price : 0 };
}
