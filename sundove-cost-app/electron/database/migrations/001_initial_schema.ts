import type Database from 'better-sqlite3';

export const migration001_initialSchema = {
  version: 1,
  name: 'initial_schema',
  up(db: Database.Database): void {
    db.exec(`
      -- ============================================
      -- Process Registry (flexibility core)
      -- ============================================
      CREATE TABLE process_registry (
        id TEXT PRIMARY KEY,
        "order" INTEGER NOT NULL,
        label TEXT NOT NULL,
        calc_method TEXT NOT NULL,       -- 'weight_based', 'lookup', 'fixed_per_piece', 'mixed', 'multi_component'
        enabled INTEGER NOT NULL DEFAULT 1,
        optional INTEGER NOT NULL DEFAULT 0,
        price_table TEXT,
        formula_display TEXT,
        description TEXT
      );

      -- ============================================
      -- Table Schema Registry (dynamic table structure)
      -- ============================================
      CREATE TABLE table_schema_registry (
        table_id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        schema_json TEXT NOT NULL        -- JSON: { rowDimension, colDimension, valueType, ... }
      );

      -- ============================================
      -- Table A: Iron material prices
      -- ============================================
      CREATE TABLE iron_material_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        steel_type TEXT NOT NULL,
        shape TEXT NOT NULL,
        wire_diameter TEXT NOT NULL,
        base_price REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.1,
        calculated_price REAL GENERATED ALWAYS AS (base_price * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table B: Forming prices
      -- ============================================
      CREATE TABLE forming_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        diameter_range TEXT NOT NULL,
        length_min REAL,
        length_max REAL,
        base_price REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.1,
        calculated_price REAL GENERATED ALWAYS AS (base_price * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table C: Heat treatment prices
      -- ============================================
      CREATE TABLE heat_treatment_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material TEXT NOT NULL,
        condition TEXT NOT NULL,
        base_price_per_kg REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.2,
        calculated_price REAL GENERATED ALWAYS AS (base_price_per_kg * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table D: Sandblasting prices
      -- ============================================
      CREATE TABLE sandblasting_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wire_diameter TEXT NOT NULL,
        length_min REAL,
        length_max REAL,
        base_price_per_kg REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.05,
        calculated_price REAL GENERATED ALWAYS AS (base_price_per_kg * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table E: Electroplating prices
      -- ============================================
      CREATE TABLE electroplating_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wire_diameter TEXT NOT NULL,
        length_min REAL,
        length_max REAL,
        base_price REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.05,
        calculated_price REAL GENERATED ALWAYS AS (base_price * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table F: Black coating (染黑) prices
      -- ============================================
      CREATE TABLE blackening_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wire_diameter TEXT NOT NULL,
        pricing_method TEXT NOT NULL,   -- 'fixed_per_piece' or 'weight_per_kg'
        base_price REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.05,
        calculated_price REAL GENERATED ALWAYS AS (base_price * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table G: Rubber sleeve prices
      -- ============================================
      CREATE TABLE sleeve_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wire_diameter TEXT NOT NULL,
        pellet_price REAL NOT NULL,
        threading_fee REAL NOT NULL DEFAULT 0.2,
        markup REAL NOT NULL DEFAULT 1.1,
        calculated_price REAL GENERATED ALWAYS AS ((pellet_price + threading_fee) * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table H: Straightening prices
      -- ============================================
      CREATE TABLE straightening_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wire_diameter TEXT NOT NULL,
        length_min REAL,
        length_max REAL,
        base_price REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.05,
        calculated_price REAL GENERATED ALWAYS AS (base_price * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table I-1: Hex ring prices
      -- ============================================
      CREATE TABLE hex_ring_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        size TEXT NOT NULL,
        forging REAL NOT NULL DEFAULT 0,
        lathe REAL NOT NULL DEFAULT 0,
        heat_treatment REAL NOT NULL DEFAULT 0,
        sandblasting REAL NOT NULL DEFAULT 0,
        electroplating REAL NOT NULL DEFAULT 0,
        welding REAL NOT NULL DEFAULT 0,
        markup REAL NOT NULL DEFAULT 1.05,
        calculated_price REAL GENERATED ALWAYS AS (
          (forging + lathe + heat_treatment + sandblasting + electroplating + welding) * markup
        ) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table I-2: Through head prices
      -- ============================================
      CREATE TABLE through_head_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        size TEXT NOT NULL,
        forging REAL NOT NULL,
        processing REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.05,
        calculated_price REAL GENERATED ALWAYS AS ((forging + processing) * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table J: Handle prices
      -- ============================================
      CREATE TABLE handle_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model TEXT NOT NULL,
        handle_size TEXT NOT NULL,
        price REAL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table K-1: Packaging prices
      -- ============================================
      CREATE TABLE packaging_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packaging_type TEXT NOT NULL,
        labor REAL NOT NULL DEFAULT 0,
        tag_cost REAL NOT NULL DEFAULT 0,
        sticker_cost REAL NOT NULL DEFAULT 0,
        base_total REAL NOT NULL,
        markup REAL NOT NULL DEFAULT 1.0,
        calculated_price REAL GENERATED ALWAYS AS (base_total * markup) STORED,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table K-2: Box (carton) prices
      -- ============================================
      CREATE TABLE box_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        handle_size TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        base_rate REAL NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table K-3: Shipping prices
      -- ============================================
      CREATE TABLE shipping_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        handle_size TEXT NOT NULL,
        length_min REAL,
        length_max REAL,
        base_rate REAL NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Table L: Global parameters
      -- ============================================
      CREATE TABLE global_params (
        key TEXT PRIMARY KEY,
        value REAL NOT NULL,
        label TEXT,
        module TEXT,
        affects TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Products (SKU specs only, no stored results)
      -- ============================================
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        wire_diameter REAL NOT NULL,
        exposed_length REAL NOT NULL,
        internal_length REAL NOT NULL,
        material_shape TEXT NOT NULL DEFAULT 'round',
        steel_type TEXT NOT NULL DEFAULT '8660',
        handle_size TEXT,
        handle_model TEXT,
        packaging_type TEXT DEFAULT 'bulk',
        carton_quantity INTEGER,
        has_hex_ring INTEGER NOT NULL DEFAULT 0,
        has_through_head INTEGER NOT NULL DEFAULT 0,
        has_tp_drill INTEGER NOT NULL DEFAULT 0,
        has_stamp INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );

      -- ============================================
      -- Price change log (audit trail)
      -- ============================================
      CREATE TABLE price_change_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER,
        field_name TEXT,
        old_value REAL,
        new_value REAL,
        changed_at TEXT DEFAULT (datetime('now'))
      );

      -- Index for common queries
      CREATE INDEX idx_products_sku ON products(sku);
      CREATE INDEX idx_products_wire_diameter ON products(wire_diameter);
      CREATE INDEX idx_products_handle_size ON products(handle_size);
      CREATE INDEX idx_price_change_log_table ON price_change_log(table_name, changed_at);
    `);
  },
};
