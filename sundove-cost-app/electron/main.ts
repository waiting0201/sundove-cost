import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { initDatabase, closeDatabase } from './database/connection';
import { registerAllIpcHandlers, IPC_CHANNELS } from './ipc';

let mainWindow: BrowserWindow | null = null;
let dbReady = false;
let isQuitting = false;

// Catch any uncaught error at the process level so the app never silently hangs
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  dialog.showErrorBox('未預期的錯誤', err.stack ?? err.message);
});

function forceQuit(): void {
  if (isQuitting) return;
  isQuitting = true;

  // 1. Remove all IPC handlers so nothing holds a reference
  for (const ch of IPC_CHANNELS) {
    try { ipcMain.removeHandler(ch); } catch (_) { /* ignore */ }
  }

  // 2. Close database and release all file locks
  closeDatabase();

  // 3. Destroy window if still around
  if (mainWindow) {
    mainWindow.destroy();
    mainWindow = null;
  }

  // 4. Release single instance lock
  app.releaseSingleInstanceLock();

  // 5. Force exit — app.exit() skips before-quit/will-quit and exits immediately
  app.exit(0);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    title: 'Sundove Cost',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Show window when content is ready (avoids white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Fallback: force show after 3s in case ready-to-show never fires
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.warn('ready-to-show did not fire within 3s, forcing show');
      mainWindow.show();
    }
  }, 3000);

  // Log load failures
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load: ${validatedURL} (${errorCode}: ${errorDescription})`);
    if (mainWindow && !mainWindow.isVisible()) mainWindow.show();
    dialog.showErrorBox(
      '載入失敗',
      `應用程式無法載入頁面。\n錯誤碼: ${errorCode}\n${errorDescription}\n路徑: ${validatedURL}`
    );
  });

  const isDev = process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    // Resolve production index.html — try multiple possible paths
    const candidates = [
      path.join(__dirname, '../dist/sundove-cost-app/browser/index.html'),
      path.join(app.getAppPath(), 'dist/sundove-cost-app/browser/index.html'),
    ];

    let indexPath: string | null = null;
    for (const p of candidates) {
      console.log('Checking path:', p, 'exists:', fs.existsSync(p));
      if (fs.existsSync(p)) {
        indexPath = p;
        break;
      }
    }

    if (indexPath) {
      console.log('Loading production index:', indexPath);
      mainWindow.loadFile(indexPath);
    } else {
      console.error('index.html not found in any candidate path');
      mainWindow.show();
      dialog.showErrorBox(
        '找不到應用程式檔案',
        `無法找到 index.html。\n\n搜尋路徑:\n${candidates.join('\n')}\n\n__dirname: ${__dirname}\nappPath: ${app.getAppPath()}`
      );
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on('before-quit', () => forceQuit());
app.on('window-all-closed', () => forceQuit());

app.whenReady().then(() => {
  createWindow();

  try {
    initDatabase();
    dbReady = true;
  } catch (err) {
    console.error('Database init failed:', err);
    dialog.showErrorBox(
      '資料庫初始化失敗',
      `無法開啟資料庫，請確認檔案權限。\n\n${err instanceof Error ? err.message : String(err)}`
    );
  }

  registerAllIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
