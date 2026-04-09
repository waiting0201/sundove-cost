import { ipcMain } from 'electron';
import { getDb } from '../database/connection';

export function registerGlobalParamsHandlers(): void {
  ipcMain.handle('global-params:get', () => {
    const db = getDb();
    return db.prepare('SELECT * FROM global_params ORDER BY key').all();
  });

  ipcMain.handle('global-params:update', (_event, payload: { key: string; value: number }) => {
    const db = getDb();
    const current = db.prepare('SELECT value FROM global_params WHERE key = ?').get(payload.key) as any;

    if (current) {
      // Log the change
      db.prepare(
        'INSERT INTO price_change_log (table_name, field_name, old_value, new_value) VALUES (?, ?, ?, ?)'
      ).run('global_params', payload.key, current.value, payload.value);
    }

    db.prepare("UPDATE global_params SET value = ?, updated_at = datetime('now') WHERE key = ?").run(
      payload.value,
      payload.key
    );

    return { success: true };
  });
}
