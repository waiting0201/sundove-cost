import Database from 'better-sqlite3';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { runMigrations } from './migrations/migrator';
import { clearStatementCache } from '../services/calculation.service';

let db: Database.Database | null = null;

export function getDbPath(): string {
  if (process.platform === 'darwin') {
    return path.join(app.getPath('home'), 'sundove-cost', 'sundove-cost.db');
  }
  return path.join(app.getPath('userData'), 'sundove-cost.db');
}

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(): void {
  const dbPath = getDbPath();

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  // Performance: keep temp tables in memory, increase cache size
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = -8000');   // 8MB cache
  db.pragma('mmap_size = 67108864'); // 64MB memory-mapped I/O

  // Run migrations
  runMigrations(db);

  console.log(`Database initialized at: ${dbPath}`);
}

export function closeDatabase(): void {
  if (db) {
    try {
      // Release prepared statement references first
      clearStatementCache();
      // Flush WAL to main db file and release shared memory
      db.pragma('wal_checkpoint(TRUNCATE)');
      // Disable mmap to release file handles
      db.pragma('mmap_size = 0');
      db.close();
    } catch (_) {
      // ignore — just need to release locks
    }
    db = null;
  }
}
