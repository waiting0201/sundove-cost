import { ipcMain, BrowserWindow } from 'electron';
import { previewCascade } from '../services/calculation.service';
import { getDb } from '../database/connection';

export function registerCascadeHandlers(): void {
  ipcMain.handle('cascade:preview', (_event, payload: { tableId: string; rowId: number; field: string; newValue: number }) => {
    return previewCascade(payload.tableId, payload.rowId, payload.field, payload.newValue);
  });

  ipcMain.handle('cascade:apply', (_event, payload: { tableId: string; rowId: number; field: string; newValue: number }) => {
    const TABLE_MAP: Record<string, string> = {
      'iron-material': 'iron_material_prices', 'forming': 'forming_prices',
      'heat-treatment': 'heat_treatment_prices', 'sandblasting': 'sandblasting_prices',
      'electroplating': 'electroplating_prices', 'blackening': 'blackening_prices',
      'sleeve': 'sleeve_prices', 'straightening': 'straightening_prices',
      'hex-ring': 'hex_ring_prices', 'through-head': 'through_head_prices',
    };
    const tableName = TABLE_MAP[payload.tableId];
    if (!tableName) return { success: false };

    const db = getDb();
    const current = db.prepare(`SELECT ${payload.field} FROM ${tableName} WHERE id = ?`).get(payload.rowId) as any;

    // Log the change
    db.prepare('INSERT INTO price_change_log (table_name, record_id, field_name, old_value, new_value) VALUES (?,?,?,?,?)')
      .run(tableName, payload.rowId, payload.field, current?.[payload.field], payload.newValue);

    // Apply the change
    db.prepare(`UPDATE ${tableName} SET ${payload.field} = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(payload.newValue, payload.rowId);

    return { success: true };
  });
}
