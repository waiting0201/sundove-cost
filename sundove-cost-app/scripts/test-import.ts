/**
 * Test Excel import logic without Electron.
 * 1. Creates a test .xlsx file with sample SKU data
 * 2. Reads it back using the same xlsx library
 * 3. Validates the column mapping logic
 *
 * Run: npx tsx scripts/test-import.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const testDir = path.join(__dirname, '../test-data');
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

// ==========================================
// Step 1: Create a test Excel file
// ==========================================
const testData = [
  { SKU: 'PH0X60',   '線徑': 3, '外露長度': 60,  '內含長度': 60,  '材料': 'round', '鋼種': '8660', '手柄': '小柄', '六角環': 'N', '貫通頭': 'N' },
  { SKU: 'PH1X200',  '線徑': 5, '外露長度': 200, '內含長度': 200, '材料': 'round', '鋼種': '8660', '手柄': '小柄', '六角環': 'Y', '貫通頭': 'N' },
  { SKU: 'PH2X100',  '線徑': 6, '外露長度': 100, '內含長度': 100, '材料': 'round', '鋼種': '8660', '手柄': '中柄', '六角環': 'N', '貫通頭': 'N' },
  { SKU: 'SL-M4-080', '線徑': 4, '外露長度': 80,  '內含長度': 40,  '材料': 'round', '鋼種': '8660', '手柄': '小柄', '六角環': 'N', '貫通頭': 'N' },
  { SKU: 'HEX-5-150', '線徑': 5, '外露長度': 150, '內含長度': 80,  '材料': 'hex',   '鋼種': '8660', '手柄': '中柄', '六角環': 'N', '貫通頭': 'Y' },
];

const ws = XLSX.utils.json_to_sheet(testData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Products');
const testFile = path.join(testDir, 'test-import.xlsx');
XLSX.writeFile(wb, testFile);
console.log(`✅ 建立測試檔案: ${testFile}`);

// ==========================================
// Step 2: Read it back (simulating import)
// ==========================================
const workbook = XLSX.readFile(testFile);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

console.log(`\n📋 讀取到 ${rows.length} 列資料:`);
console.log(rows);

// ==========================================
// Step 3: Apply column mapping (same as export.ipc.ts)
// ==========================================
const columnMap: Record<string, string> = {
  'SKU': 'sku', 'sku': 'sku', 'SKU Code': 'sku', 'sku_code': 'sku',
  '線徑': 'wire_diameter', 'wire_diameter': 'wire_diameter',
  '外露長度': 'exposed_length', 'exposed_length': 'exposed_length', '外露長': 'exposed_length',
  '內含長度': 'internal_length', 'internal_length': 'internal_length', '內含長': 'internal_length',
  '材料形體': 'material_shape', 'material_shape': 'material_shape', '材料': 'material_shape',
  '鋼種': 'steel_type', 'steel_type': 'steel_type',
  '手柄大小': 'handle_size', 'handle_size': 'handle_size', '手柄': 'handle_size',
  '手柄型號': 'handle_model', 'handle_model': 'handle_model',
  '包裝方式': 'packaging_type', 'packaging_type': 'packaging_type',
  '裝量': 'carton_quantity', 'carton_quantity': 'carton_quantity',
  '六角環': 'has_hex_ring', 'has_hex_ring': 'has_hex_ring',
  '貫通頭': 'has_through_head', 'has_through_head': 'has_through_head',
  '備註': 'notes', 'notes': 'notes',
};

const boolVal = (v: any) => (v === 'Y' || v === 'y' || v === true || v === 1) ? 1 : 0;

console.log(`\n🔄 欄位映射結果:`);
let validCount = 0;

for (const row of rows) {
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const col = columnMap[key];
    if (col) mapped[col] = value;
  }

  if (!mapped.sku || !mapped.wire_diameter || !mapped.exposed_length || !mapped.internal_length) {
    console.log(`  ⚠️ 跳過（缺少必要欄位）:`, row);
    continue;
  }

  const product = {
    sku: mapped.sku,
    wire_diameter: Number(mapped.wire_diameter),
    exposed_length: Number(mapped.exposed_length),
    internal_length: Number(mapped.internal_length),
    material_shape: mapped.material_shape || 'round',
    steel_type: mapped.steel_type || '8660',
    handle_size: mapped.handle_size || null,
    handle_model: mapped.handle_model || null,
    packaging_type: mapped.packaging_type || 'bulk',
    carton_quantity: mapped.carton_quantity ? Number(mapped.carton_quantity) : null,
    has_hex_ring: boolVal(mapped.has_hex_ring),
    has_through_head: boolVal(mapped.has_through_head),
    notes: mapped.notes || null,
  };

  validCount++;
  console.log(`  ✅ ${product.sku}: ${product.wire_diameter}mm, 外露${product.exposed_length}, 內含${product.internal_length}, ${product.material_shape}, 六角環=${product.has_hex_ring}, 貫通頭=${product.has_through_head}`);
}

console.log(`\n===== 結果 =====`);
console.log(`總列數: ${rows.length}`);
console.log(`有效匯入: ${validCount}`);
console.log(`跳過: ${rows.length - validCount}`);
console.log(validCount === rows.length ? '✅ 全部通過' : '⚠️ 有跳過的列');
