/**
 * CRUD integration test for all IPC handlers.
 * Runs against a temporary in-memory SQLite database.
 *
 * Usage: npx tsx test-crud.ts
 */
import Database from 'better-sqlite3';
import { migration001_initialSchema } from './electron/database/migrations/001_initial_schema';
import { migration002_seedProcessRegistry } from './electron/database/migrations/002_seed_process_registry';

// ── helpers ──────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.error(`  ❌ ${msg}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, msg: string): void {
  const eq = typeof actual === 'number' && typeof expected === 'number'
    ? Math.abs(actual - expected) < 1e-9
    : actual === expected;
  assert(eq, `${msg}  (actual=${actual}, expected=${expected})`);
}

function section(title: string): void {
  console.log(`\n── ${title} ──`);
}

// ── setup in-memory db ───────────────────────────────

const db = new Database(':memory:');
db.pragma('foreign_keys = ON');
migration001_initialSchema.up(db);
migration002_seedProcessRegistry.up(db);

// =====================================================
// 1. global_params CRUD
// =====================================================
section('global_params — Read');
{
  const rows = db.prepare('SELECT * FROM global_params ORDER BY key').all() as any[];
  assert(rows.length === 13, `Seeded 13 params (got ${rows.length})`);
  const density = rows.find((r: any) => r.key === 'density_round');
  assertEqual(density?.value, 0.00617, 'density_round = 0.00617');
}

section('global_params — Update');
{
  // Simulate IPC: global-params:update
  const key = 'density_round';
  const newValue = 0.007;
  const current = db.prepare('SELECT value FROM global_params WHERE key = ?').get(key) as any;
  db.prepare(
    'INSERT INTO price_change_log (table_name, field_name, old_value, new_value) VALUES (?, ?, ?, ?)'
  ).run('global_params', key, current.value, newValue);
  db.prepare("UPDATE global_params SET value = ?, updated_at = datetime('now') WHERE key = ?").run(newValue, key);

  const updated = db.prepare('SELECT value FROM global_params WHERE key = ?').get(key) as any;
  assertEqual(updated.value, 0.007, 'density_round updated to 0.007');

  const log = db.prepare(
    'SELECT * FROM price_change_log WHERE table_name = ? AND field_name = ?'
  ).get('global_params', key) as any;
  assertEqual(log.old_value, 0.00617, 'Change log old_value correct');
  assertEqual(log.new_value, 0.007, 'Change log new_value correct');
}

section('global_params — Update non-existent key');
{
  const result = db.prepare('UPDATE global_params SET value = ? WHERE key = ?').run(999, 'nonexistent_key');
  assertEqual(result.changes, 0, 'No rows affected for missing key');
}

// =====================================================
// 2. products CRUD
// =====================================================
section('products — Create');
let productId: number;
{
  const data = {
    sku: 'PH0X60-TEST',
    wire_diameter: 3,
    exposed_length: 60,
    internal_length: 25,
    material_shape: 'round',
    steel_type: '8660',
    handle_size: 'small',
    handle_model: 'A1',
    packaging_type: 'bulk',
    has_hex_ring: 0,
    has_through_head: 0,
    has_tp_drill: 0,
    has_stamp: 0,
  };
  const fields = Object.keys(data);
  const placeholders = fields.map(() => '?').join(', ');
  const values = fields.map(f => (data as any)[f]);
  const result = db.prepare(
    `INSERT INTO products (${fields.join(', ')}) VALUES (${placeholders})`
  ).run(...values);

  productId = Number(result.lastInsertRowid);
  assert(productId > 0, `Product created with id=${productId}`);
}

section('products — Read');
{
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
  assertEqual(product.sku, 'PH0X60-TEST', 'SKU matches');
  assertEqual(product.wire_diameter, 3, 'wire_diameter = 3');
  assertEqual(product.exposed_length, 60, 'exposed_length = 60');
}

section('products — Read with filters');
{
  // Add a second product
  db.prepare(
    `INSERT INTO products (sku, wire_diameter, exposed_length, internal_length) VALUES (?, ?, ?, ?)`
  ).run('PH2X100-TEST', 6, 100, 30);

  const all = db.prepare('SELECT * FROM products ORDER BY sku').all();
  assertEqual(all.length, 2, '2 products total');

  // Filter by wire_diameter
  const filtered = db.prepare('SELECT * FROM products WHERE wire_diameter = ? ORDER BY sku').all(3);
  assertEqual(filtered.length, 1, 'Filter wire_diameter=3 → 1 result');

  // Filter by search
  const searched = db.prepare('SELECT * FROM products WHERE sku LIKE ? ORDER BY sku').all('%PH2%');
  assertEqual(searched.length, 1, 'Search "PH2" → 1 result');
}

section('products — Update');
{
  db.prepare("UPDATE products SET wire_diameter = ?, updated_at = datetime('now') WHERE id = ?").run(5, productId);
  const updated = db.prepare('SELECT wire_diameter FROM products WHERE id = ?').get(productId) as any;
  assertEqual(updated.wire_diameter, 5, 'wire_diameter updated to 5');
}

section('products — Delete');
{
  db.prepare('DELETE FROM products WHERE id = ?').run(productId);
  const deleted = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  assertEqual(deleted, undefined, 'Product deleted');

  // Ensure other product remains
  const remaining = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
  assertEqual(remaining.count, 1, '1 product remains');
}

// =====================================================
// 3. price_table CRUD (using iron_material_prices)
// =====================================================
section('price_table (iron_material_prices) — Insert');
let priceRowId: number;
{
  const result = db.prepare(
    `INSERT INTO iron_material_prices (steel_type, shape, wire_diameter, base_price, markup) VALUES (?, ?, ?, ?, ?)`
  ).run('8660', 'round', '3', 45.0, 1.1);
  priceRowId = Number(result.lastInsertRowid);
  assert(priceRowId > 0, `Price row created with id=${priceRowId}`);

  const row = db.prepare('SELECT * FROM iron_material_prices WHERE id = ?').get(priceRowId) as any;
  assertEqual(row.base_price, 45.0, 'base_price = 45.0');
  assertEqual(row.calculated_price, 49.5, 'calculated_price = 45.0 * 1.1 = 49.5 (GENERATED)');
}

section('price_table — Update with change log');
{
  const current = db.prepare('SELECT * FROM iron_material_prices WHERE id = ?').get(priceRowId) as any;
  const newPrice = 50.0;

  db.prepare("UPDATE iron_material_prices SET base_price = ?, updated_at = datetime('now') WHERE id = ?").run(
    newPrice,
    priceRowId
  );

  // Log change
  db.prepare(
    'INSERT INTO price_change_log (table_name, record_id, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)'
  ).run('iron_material_prices', priceRowId, 'base_price', current.base_price, newPrice);

  const updated = db.prepare('SELECT * FROM iron_material_prices WHERE id = ?').get(priceRowId) as any;
  assertEqual(updated.base_price, 50.0, 'base_price updated to 50.0');
  assertEqual(updated.calculated_price, 55.0, 'calculated_price auto-recalculated to 55.0');

  const log = db.prepare(
    'SELECT * FROM price_change_log WHERE table_name = ? AND record_id = ?'
  ).get('iron_material_prices', priceRowId) as any;
  assertEqual(log.old_value, 45.0, 'Change log old_value = 45.0');
  assertEqual(log.new_value, 50.0, 'Change log new_value = 50.0');
}

section('price_table — Delete');
{
  db.prepare('DELETE FROM iron_material_prices WHERE id = ?').run(priceRowId);
  const deleted = db.prepare('SELECT * FROM iron_material_prices WHERE id = ?').get(priceRowId);
  assertEqual(deleted, undefined, 'Price row deleted');
}

// =====================================================
// 4. price_table CRUD (multi-component: hex_ring_prices)
// =====================================================
section('price_table (hex_ring_prices) — Insert & GENERATED column');
{
  const result = db.prepare(
    `INSERT INTO hex_ring_prices (size, forging, lathe, heat_treatment, sandblasting, electroplating, welding, markup)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run('M5', 2.0, 1.5, 0.8, 0.3, 0.5, 1.0, 1.05);
  const row = db.prepare('SELECT * FROM hex_ring_prices WHERE id = ?').get(Number(result.lastInsertRowid)) as any;
  const expectedTotal = (2.0 + 1.5 + 0.8 + 0.3 + 0.5 + 1.0) * 1.05;
  assertEqual(row.calculated_price, expectedTotal, `calculated_price = ${expectedTotal} (sum * 1.05)`);
}

// =====================================================
// 5. process_registry — Read
// =====================================================
section('process_registry — Read');
{
  const rows = db.prepare('SELECT * FROM process_registry ORDER BY "order"').all() as any[];
  assertEqual(rows.length, 10, '10 process definitions seeded');
  assertEqual(rows[0].id, 'iron_raw', 'First process = iron_raw');
  assertEqual(rows[9].id, 'through_head', 'Last process = through_head');
}

// =====================================================
// 6. change_log — Read recent
// =====================================================
section('change_log — Read recent');
{
  const logs = db.prepare('SELECT * FROM price_change_log ORDER BY changed_at DESC LIMIT 50').all() as any[];
  assert(logs.length >= 2, `At least 2 change log entries (got ${logs.length})`);
}

// =====================================================
// 7. Edge cases
// =====================================================
section('Edge cases');
{
  // Duplicate SKU
  db.prepare(
    `INSERT INTO products (sku, wire_diameter, exposed_length, internal_length) VALUES (?, ?, ?, ?)`
  ).run('UNIQUE-SKU', 4, 80, 25);

  let dupeError = false;
  try {
    db.prepare(
      `INSERT INTO products (sku, wire_diameter, exposed_length, internal_length) VALUES (?, ?, ?, ?)`
    ).run('UNIQUE-SKU', 5, 90, 30);
  } catch {
    dupeError = true;
  }
  assert(dupeError, 'Duplicate SKU raises UNIQUE constraint error');

  // NULL on NOT NULL field
  let nullError = false;
  try {
    db.prepare('INSERT INTO products (sku, wire_diameter, exposed_length, internal_length) VALUES (?, ?, ?, ?)').run(
      null, 4, 80, 25
    );
  } catch {
    nullError = true;
  }
  assert(nullError, 'NULL sku raises NOT NULL constraint error');
}

// ── summary ──────────────────────────────────────────

db.close();

console.log(`\n${'═'.repeat(40)}`);
console.log(`  Total: ${passed + failed}  |  ✅ ${passed}  |  ❌ ${failed}`);
console.log('═'.repeat(40));

process.exit(failed > 0 ? 1 : 0);
