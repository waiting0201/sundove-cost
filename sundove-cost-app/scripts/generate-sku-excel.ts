/**
 * Parse reference Excel files and generate a clean SKU import file.
 * Run: npx tsx scripts/generate-sku-excel.ts
 */

import * as XLSX from 'xlsx';
import * as path from 'path';

const refDir = path.join(__dirname, '../../reference');
const outFile = path.join(refDir, 'sundove-sku-import.xlsx');

// ==========================================
// Read 俊來鐵材 sheet for SKU specs
// ==========================================
const ironWb = XLSX.readFile(path.join(refDir, '鐵材成本計算.xlsx'));
const ironSheet = ironWb.Sheets['俊來鐵材'];
const ironRows: any[][] = XLSX.utils.sheet_to_json(ironSheet, { header: 1 });

// Read 總成本 sheet for hex ring / through head flags
const costSheet = ironWb.Sheets['總成本'];
const costRows: any[][] = XLSX.utils.sheet_to_json(costSheet, { header: 1 });

// Build hex ring / through head map from 總成本
// Header: [尺寸, 鐵材, 成形, 熱處理, 噴砂, 電鍍, 染黑, 膠套, 整直, null, 鐵材成本, null, null, 六角環, +六角環成本]
const hexMap = new Map<string, { hasHex: boolean; hasThrough: boolean }>();
for (let i = 2; i < costRows.length; i++) {
  const row = costRows[i];
  if (!row || !row[0]) continue;
  const sku = String(row[0]).trim();
  const hexFlag = row[13]; // 六角環 column
  const throughFlag = row[14]; // +六角環成本 column (sometimes has through head info)

  hexMap.set(sku, {
    hasHex: hexFlag === 'Y' || hexFlag === 'y' || (typeof hexFlag === 'number' && hexFlag > 0),
    hasThrough: false, // Will check separately
  });
}

// ==========================================
// Parse SKU specs from 俊來鐵材
// ==========================================
// Data starts at row 5 (0-indexed), header at row 4:
// [尺寸, 線徑, 外露長度, 內含長度, 總長, 鐵材比重, 重量, 單價(公斤), 價格]

interface SkuRecord {
  SKU: string;
  線徑: number;
  外露長度: number;
  內含長度: number;
  材料: string;
  鋼種: string;
  六角環: string;
  貫通頭: string;
}

const skus: SkuRecord[] = [];
const seen = new Set<string>();

for (let i = 5; i < ironRows.length; i++) {
  const row = ironRows[i];
  if (!row || !row[0]) continue;

  const sku = String(row[0]).trim();
  if (!sku || seen.has(sku)) continue;

  const wireDia = Number(row[1]);
  const exposedLen = Number(row[2]);
  const internalLen = Number(row[3]);
  const density = Number(row[5]);

  if (!wireDia || !exposedLen || isNaN(internalLen)) continue;

  // Determine material shape from density
  let material = 'round';
  if (Math.abs(density - 0.00680) < 0.0001) material = 'hex';
  else if (Math.abs(density - 0.00785) < 0.0001) material = 'square';

  // Determine steel type from SKU prefix
  let steelType = '8660';
  // S2 steel products typically have specific prefixes or the density column hints

  // Hex ring / through head from 總成本
  const flags = hexMap.get(sku);
  const hasHex = flags?.hasHex ? 'Y' : 'N';

  // Determine handle size from wire diameter (rough mapping)
  // This is approximate - actual mapping depends on the product

  seen.add(sku);
  skus.push({
    SKU: sku,
    線徑: wireDia,
    外露長度: exposedLen,
    內含長度: internalLen,
    材料: material,
    鋼種: steelType,
    六角環: hasHex,
    貫通頭: 'N',
  });
}

console.log(`解析到 ${skus.length} 筆 SKU`);

// Show distribution
const diaCount = new Map<number, number>();
const matCount = new Map<string, number>();
for (const s of skus) {
  diaCount.set(s.線徑, (diaCount.get(s.線徑) ?? 0) + 1);
  matCount.set(s.材料, (matCount.get(s.材料) ?? 0) + 1);
}
console.log('\n線徑分佈:');
for (const [d, c] of [...diaCount.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${d}mm: ${c} 筆`);
}
console.log('\n材料分佈:');
for (const [m, c] of matCount.entries()) {
  console.log(`  ${m}: ${c} 筆`);
}

// Show some samples
console.log('\n前 10 筆:');
for (const s of skus.slice(0, 10)) {
  console.log(`  ${s.SKU}: ${s.線徑}mm, 外露${s.外露長度}, 內含${s.內含長度}, ${s.材料}, 六角環=${s.六角環}`);
}

// ==========================================
// Write output Excel
// ==========================================
const ws = XLSX.utils.json_to_sheet(skus);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'SKU');
XLSX.writeFile(wb, outFile);

console.log(`\n✅ 已產出: ${outFile}`);
console.log(`   共 ${skus.length} 筆 SKU，可直接用 SKU 管理頁的「匯入」功能匯入`);
