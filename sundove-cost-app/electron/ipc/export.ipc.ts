import { ipcMain, dialog, BrowserWindow } from 'electron';
import { getDb, getDbPath } from '../database/connection';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export function registerExportHandlers(): void {

  // ==========================================
  // Database path
  // ==========================================
  ipcMain.handle('db:path', () => {
    return getDbPath();
  });

  // ==========================================
  // Excel Import: read xlsx → insert products
  // ==========================================
  ipcMain.handle('import:excel', async (_event, payload?: { filePath?: string }) => {
    let filePath = payload?.filePath;

    if (!filePath) {
      const win = BrowserWindow.getFocusedWindow();
      const result = await dialog.showOpenDialog(win!, {
        title: '匯入 Excel 檔案',
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
        properties: ['openFile'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, reason: 'cancelled' };
      }
      filePath = result.filePaths[0];
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return { success: false, reason: 'empty', count: 0 };
    }

    const db = getDb();

    // Map common column names to our schema
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

    const insert = db.prepare(`
      INSERT OR IGNORE INTO products (sku, wire_diameter, exposed_length, internal_length, material_shape, steel_type, handle_size, handle_model, packaging_type, carton_quantity, has_hex_ring, has_through_head, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    const importAll = db.transaction(() => {
      for (const row of rows) {
        const mapped: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          const col = columnMap[key];
          if (col) mapped[col] = value;
        }

        if (!mapped.sku || !mapped.wire_diameter || !mapped.exposed_length || !mapped.internal_length) {
          continue;
        }

        // Normalize boolean fields
        const boolVal = (v: any) => (v === 'Y' || v === 'y' || v === true || v === 1) ? 1 : 0;

        insert.run(
          mapped.sku,
          Number(mapped.wire_diameter),
          Number(mapped.exposed_length),
          Number(mapped.internal_length),
          mapped.material_shape || 'round',
          mapped.steel_type || '8660',
          mapped.handle_size || null,
          mapped.handle_model || null,
          mapped.packaging_type || 'bulk',
          mapped.carton_quantity ? Number(mapped.carton_quantity) : null,
          boolVal(mapped.has_hex_ring),
          boolVal(mapped.has_through_head),
          mapped.notes || null,
        );
        imported++;
      }
    });

    importAll();
    return { success: true, count: imported, total: rows.length };
  });

  // ==========================================
  // Excel Export: products → xlsx
  // ==========================================
  ipcMain.handle('export:excel', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win!, {
      title: '匯出 SKU 資料',
      defaultPath: `sundove-products-${new Date().toISOString().slice(0, 10)}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, reason: 'cancelled' };
    }

    const db = getDb();
    const products = db.prepare('SELECT * FROM products ORDER BY sku').all();

    const ws = XLSX.utils.json_to_sheet(products);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, result.filePath);

    return { success: true, filePath: result.filePath, count: products.length };
  });

  // ==========================================
  // Database Backup
  // ==========================================
  ipcMain.handle('db:backup', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win!, {
      title: '備份資料庫',
      defaultPath: `sundove-cost-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, reason: 'cancelled' };
    }

    const srcPath = getDbPath();
    fs.copyFileSync(srcPath, result.filePath);
    return { success: true, filePath: result.filePath };
  });

  // ==========================================
  // Database Restore
  // ==========================================
  ipcMain.handle('db:restore', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      title: '還原資料庫',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, reason: 'cancelled' };
    }

    const srcPath = result.filePaths[0];
    const destPath = getDbPath();

    // Create backup before restore
    const backupPath = destPath + '.bak';
    if (fs.existsSync(destPath)) {
      fs.copyFileSync(destPath, backupPath);
    }

    fs.copyFileSync(srcPath, destPath);
    return { success: true, message: '資料庫已還原，請重新啟動應用程式' };
  });
}
