import type Database from 'better-sqlite3';
import { migration001_initialSchema } from './001_initial_schema';
import { migration002_seedProcessRegistry } from './002_seed_process_registry';
import { migration003_seedPriceTables } from './003_seed_price_tables';

interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

const migrations: Migration[] = [
  migration001_initialSchema,
  migration002_seedProcessRegistry,
  migration003_seedPriceTables,
];

export function runMigrations(db: Database.Database): void {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT version FROM _migrations').all().map((r: any) => r.version)
  );

  const pending = migrations.filter(m => !applied.has(m.version));

  if (pending.length === 0) {
    console.log('Database is up to date.');
    return;
  }

  const runAll = db.transaction(() => {
    for (const migration of pending) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);
      migration.up(db);
      db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(
        migration.version,
        migration.name
      );
    }
  });

  runAll();
  console.log(`Applied ${pending.length} migration(s).`);
}
