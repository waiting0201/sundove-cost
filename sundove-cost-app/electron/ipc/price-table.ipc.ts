import { ipcMain } from 'electron';
import { getDb } from '../database/connection';

const TABLE_MAP: Record<string, string> = {
  'iron-material': 'iron_material_prices',
  'forming': 'forming_prices',
  'heat-treatment': 'heat_treatment_prices',
  'sandblasting': 'sandblasting_prices',
  'electroplating': 'electroplating_prices',
  'blackening': 'blackening_prices',
  'sleeve': 'sleeve_prices',
  'straightening': 'straightening_prices',
  'hex-ring': 'hex_ring_prices',
  'through-head': 'through_head_prices',
  'handle': 'handle_prices',
  'packaging': 'packaging_prices',
  'box': 'box_prices',
  'shipping': 'shipping_prices',
};

function resolveTableName(tableId: string): string {
  const name = TABLE_MAP[tableId];
  if (!name) throw new Error(`Unknown table: ${tableId}`);
  return name;
}

export function registerPriceTableHandlers(): void {
  ipcMain.handle('price-table:list-all', () => {
    const db = getDb();
    const result: Record<string, number> = {};
    for (const [id, tableName] of Object.entries(TABLE_MAP)) {
      const row = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;
      result[id] = row.count;
    }
    return result;
  });

  ipcMain.handle('price-table:list', (_event, payload: { tableId: string }) => {
    const tableName = resolveTableName(payload.tableId);
    const db = getDb();
    return db.prepare(`SELECT * FROM ${tableName}`).all();
  });

  ipcMain.handle('price-table:get-row', (_event, payload: { tableId: string; rowId: number }) => {
    const tableName = resolveTableName(payload.tableId);
    const db = getDb();
    return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(payload.rowId);
  });

  ipcMain.handle('price-table:update', (_event, payload: { tableId: string; rowId: number; data: Record<string, unknown> }) => {
    const tableName = resolveTableName(payload.tableId);
    const db = getDb();

    // Get current values for change log
    const current = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(payload.rowId) as any;

    // Build dynamic UPDATE
    const fields = Object.keys(payload.data);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => payload.data[f]);

    db.prepare(`UPDATE ${tableName} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(
      ...values,
      payload.rowId
    );

    // Log changes
    for (const field of fields) {
      if (current && current[field] !== payload.data[field]) {
        db.prepare(
          'INSERT INTO price_change_log (table_name, record_id, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?)'
        ).run(tableName, payload.rowId, field, current[field], payload.data[field]);
      }
    }

    return { success: true };
  });

  ipcMain.handle('price-table:insert', (_event, payload: { tableId: string; data: Record<string, unknown> }) => {
    const tableName = resolveTableName(payload.tableId);
    const db = getDb();

    const fields = Object.keys(payload.data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(f => payload.data[f]);

    const result = db.prepare(`INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`).run(...values);

    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('price-table:delete', (_event, payload: { tableId: string; rowId: number }) => {
    const tableName = resolveTableName(payload.tableId);
    const db = getDb();
    db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(payload.rowId);
    return { success: true };
  });

  ipcMain.handle('price-table:schema', (_event, payload: { tableId: string }) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM table_schema_registry WHERE table_id = ?').get(payload.tableId) as any;
    return row ? JSON.parse(row.schema_json) : null;
  });
}
