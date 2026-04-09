import { ipcMain } from 'electron';
import { getDb } from '../database/connection';

export function registerProductHandlers(): void {
  ipcMain.handle('product:list', (_event, payload?: { filters?: Record<string, unknown> }) => {
    const db = getDb();
    let sql = 'SELECT * FROM products';
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (payload?.filters) {
      const { wire_diameter, handle_size, search } = payload.filters as any;
      if (wire_diameter) {
        conditions.push('wire_diameter = ?');
        params.push(wire_diameter);
      }
      if (handle_size) {
        conditions.push('handle_size = ?');
        params.push(handle_size);
      }
      if (search) {
        conditions.push('sku LIKE ?');
        params.push(`%${search}%`);
      }
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY sku';

    return db.prepare(sql).all(...params);
  });

  ipcMain.handle('product:get', (_event, payload: { id: number }) => {
    const db = getDb();
    return db.prepare('SELECT * FROM products WHERE id = ?').get(payload.id);
  });

  ipcMain.handle('product:create', (_event, payload: { data: Record<string, unknown> }) => {
    const db = getDb();
    const fields = Object.keys(payload.data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(f => payload.data[f]);

    const result = db.prepare(
      `INSERT INTO products (${fields.join(', ')}) VALUES (${placeholders})`
    ).run(...values);

    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('product:update', (_event, payload: { id: number; data: Record<string, unknown> }) => {
    const db = getDb();
    const fields = Object.keys(payload.data);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => payload.data[f]);

    db.prepare(`UPDATE products SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(
      ...values,
      payload.id
    );

    return { success: true };
  });

  ipcMain.handle('product:delete', (_event, payload: { id: number }) => {
    const db = getDb();
    db.prepare('DELETE FROM products WHERE id = ?').run(payload.id);
    return { success: true };
  });

  ipcMain.handle('change-log:recent', (_event, payload?: { limit?: number }) => {
    const db = getDb();
    const limit = payload?.limit ?? 50;
    return db.prepare(
      'SELECT * FROM price_change_log ORDER BY changed_at DESC LIMIT ?'
    ).all(limit);
  });
}
