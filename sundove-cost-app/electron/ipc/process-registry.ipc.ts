import { ipcMain } from 'electron';
import { getDb } from '../database/connection';

export function registerProcessRegistryHandlers(): void {
  ipcMain.handle('process-registry:list', () => {
    const db = getDb();
    return db.prepare('SELECT * FROM process_registry ORDER BY "order"').all();
  });
}
