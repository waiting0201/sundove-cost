import type Database from 'better-sqlite3';

export const migration003_seedPriceTables = {
  version: 3,
  name: 'seed_price_tables',
  up(db: Database.Database): void {

    // ============================================
    // Table A: Iron material prices
    // ============================================
    const insA = db.prepare(
      'INSERT INTO iron_material_prices (steel_type, shape, wire_diameter, base_price, markup) VALUES (?,?,?,?,?)'
    );
    const tableA = [
      ['8660', 'round', '3MM',      84.8,  1.1],
      ['8660', 'round', '4MM',      69.8,  1.1],
      ['8660', 'round', '4.5MM',    68.8,  1.1],
      ['8660', 'round', '5~5.5MM',  58.8,  1.1],
      ['8660', 'round', '6MM~',     57.8,  1.1],
      ['8660', 'hex',   '2MM',      84.8,  1.1],
      ['8660', 'hex',   '3MM',      84.8,  1.1],
    ];
    for (const r of tableA) insA.run(...r);

    // ============================================
    // Table B: Forming prices
    // ============================================
    const insB = db.prepare(
      'INSERT INTO forming_prices (diameter_range, length_min, length_max, base_price, markup) VALUES (?,?,?,?,?)'
    );
    const tableB = [
      ['PH 3.4MM', 0,   200, 0.9, 1.1],
      ['PH 3.4MM', 201, 250, 1.3, 1.1],
      ['PH 3.4MM', 251, 300, 1.5, 1.1],
      ['PH 3.4MM', 301, 350, 2.0, 1.1],
      ['PH 3.4MM', 351, 400, 3.0, 1.1],
      ['PH 5.6MM', 0,   100, 0.8, 1.1],
      ['PH 5.6MM', 101, 200, 0.9, 1.1],
    ];
    for (const r of tableB) insB.run(...r);

    // ============================================
    // Table C: Heat treatment prices
    // ============================================
    const insC = db.prepare(
      'INSERT INTO heat_treatment_prices (material, condition, base_price_per_kg, markup) VALUES (?,?,?,?)'
    );
    const tableC = [
      ['8660.S2', '3.8MM以下',      15,   1.2],
      ['8660.S2', '4MM以上',        10.2,  1.2],
      ['8660.S2', '總長500MM以上',   31.2,  1.2],
      ['6150',    '拔釘器300MM以下', 10.2,  1.2],
    ];
    for (const r of tableC) insC.run(...r);

    // ============================================
    // Table D: Sandblasting prices
    // ============================================
    const insD = db.prepare(
      'INSERT INTO sandblasting_prices (wire_diameter, length_min, length_max, base_price_per_kg, markup) VALUES (?,?,?,?,?)'
    );
    const tableD = [
      ['3MM', 0,   99999, 35,  1.05],
      ['4MM', 0,   465,   12,  1.05],
      ['4MM', 466, 580,   18,  1.05],
      ['5MM', 0,   465,   12,  1.05],
      ['5MM', 466, 580,   18,  1.05],
    ];
    for (const r of tableD) insD.run(...r);

    // ============================================
    // Table E: Electroplating prices
    // ============================================
    const insE = db.prepare(
      'INSERT INTO electroplating_prices (wire_diameter, length_min, length_max, base_price, markup) VALUES (?,?,?,?,?)'
    );
    const tableE = [
      ['3MM', 0,   99,  0.87, 1.05],
      ['3MM', 100, 159, 1.09, 1.05],
      ['3MM', 160, 210, 1.74, 1.05],
      ['3MM', 211, 365, 3.63, 1.05],
      ['4MM', 0,   99,  0.87, 1.05],
      ['4MM', 100, 149, 1.10, 1.05],
      ['4MM', 150, 200, 1.40, 1.05],
      ['4MM', 201, 240, 1.80, 1.05],
      ['4MM', 241, 300, 2.18, 1.05],
    ];
    for (const r of tableE) insE.run(...r);

    // ============================================
    // Table F: Blackening (染黑) prices
    // ============================================
    const insF = db.prepare(
      'INSERT INTO blackening_prices (wire_diameter, pricing_method, base_price, markup) VALUES (?,?,?,?)'
    );
    const tableF = [
      ['3MM',    'fixed_per_piece', 0.35,  1.05],
      ['4MM',    'weight_per_kg',   15,    1.05],
      ['5MM',    'weight_per_kg',   15,    1.05],
      ['6MM',    'weight_per_kg',   13.5,  1.05],
      ['6MM以上', 'weight_per_kg',   13.5,  1.05],
    ];
    for (const r of tableF) insF.run(...r);

    // ============================================
    // Table G: Rubber sleeve prices
    // ============================================
    const insG = db.prepare(
      'INSERT INTO sleeve_prices (wire_diameter, pellet_price, threading_fee, markup) VALUES (?,?,?,?)'
    );
    const tableG = [
      ['PH3MM',  0.09, 0.2, 1.1],
      ['PH4MM',  0.09, 0.2, 1.1],
      ['PH5MM',  0.18, 0.2, 1.1],
      ['PH6MM',  0.21, 0.2, 1.1],
      ['PH8MM',  0.23, 0.2, 1.1],
      ['PH10MM', 0.23, 0.2, 1.1],
    ];
    for (const r of tableG) insG.run(...r);

    // ============================================
    // Table H: Straightening prices
    // ============================================
    const insH = db.prepare(
      'INSERT INTO straightening_prices (wire_diameter, length_min, length_max, base_price, markup) VALUES (?,?,?,?,?)'
    );
    const tableH = [
      ['3.4.5MM', 0,   200, 0.18, 1.05],
      ['3.4.5MM', 201, 300, 0.24, 1.05],
      ['3.4.5MM', 301, 400, 0.30, 1.05],
      ['6MM',     0,   300, 0.18, 1.05],
      ['6MM',     301, 450, 0.30, 1.05],
    ];
    for (const r of tableH) insH.run(...r);

    // ============================================
    // Table I-1: Hex ring prices
    // ============================================
    const insI1 = db.prepare(
      'INSERT INTO hex_ring_prices (size, forging, lathe, heat_treatment, sandblasting, electroplating, welding, markup) VALUES (?,?,?,?,?,?,?,?)'
    );
    const tableI1 = [
      ['5MM', 3.0, 1.0, 0, 0, 0, 1.0, 1.05],
      ['6MM', 3.0, 1.0, 0, 0, 0, 1.0, 1.05],
      ['7MM', 3.2, 1.0, 0, 0, 0, 1.0, 1.05],
      ['8MM', 3.2, 1.0, 0, 0, 0, 1.0, 1.05],
    ];
    for (const r of tableI1) insI1.run(...r);

    // ============================================
    // Table I-2: Through head prices
    // ============================================
    const insI2 = db.prepare(
      'INSERT INTO through_head_prices (size, forging, processing, markup) VALUES (?,?,?,?)'
    );
    const tableI2 = [
      ['4MM', 3.72, 3.64, 1.05],
      ['5MM', 3.72, 3.64, 1.05],
      ['6MM', 5.00, 4.29, 1.05],
      ['7MM', 7.80, 5.33, 1.05],
      ['8MM', 7.80, 5.33, 1.05],
    ];
    for (const r of tableI2) insI2.run(...r);

    // ============================================
    // Table J: Handle prices
    // ============================================
    const insJ = db.prepare(
      'INSERT INTO handle_prices (model, handle_size, price) VALUES (?,?,?)'
    );
    // model, [大大柄, 大柄, 中柄, 小柄, 精密柄, 陀螺, 充接柄]
    const handleData: [string, (number|null)[]][] = [
      ['978', [null, 9.1, 7.1, 5.3, null, 5.0, null]],
      ['984', [null, 9.2, 7.0, 3.7, null, 4.0, null]],
      ['986', [null, 9.0, 7.0, 4.2, null, 5.5, null]],
      ['987', [null, 8.3, 5.9, 3.4, null, 4.7, null]],
      ['988', [null, 8.8, 6.2, 3.8, null, 4.2, null]],
      ['992', [null, 12.3, 10.3, 8.0, null, 6.5, null]],
      ['993', [null, 7.6, 5.7, 2.84, 2.5, 4.1, 6.5]],
      ['995', [null, 7.9, 6.7, 4.8, 3.5, 4.2, null]],
    ];
    const sizes = ['大大柄', '大柄', '中柄', '小柄', '精密柄', '陀螺', '充接柄'];
    for (const [model, prices] of handleData) {
      for (let i = 0; i < prices.length; i++) {
        if (prices[i] !== null) {
          insJ.run(model, sizes[i], prices[i]);
        }
      }
    }
    // K25 default handle prices
    const defaultHandles: [string, number][] = [
      ['大大柄', 10.88], ['大柄', 9.41], ['中柄', 8.09], ['小柄', 6.17], ['陀螺', 7.59],
    ];
    for (const [size, price] of defaultHandles) {
      insJ.run('K25_DEFAULT', size, price);
    }

    // ============================================
    // Table K-1: Packaging prices
    // ============================================
    const insK1 = db.prepare(
      'INSERT INTO packaging_prices (packaging_type, labor, tag_cost, sticker_cost, base_total, markup) VALUES (?,?,?,?,?,?)'
    );
    const tableK1 = [
      ['散裝',     0.8, 0,   0,   0.8, 1],
      ['普通吊牌', 0.5, 1.2, 0.4, 2.1, 1],
      ['防盜吊牌', 0.5, 1.2, 0.4, 2.1, 1],
      ['綁卡',     0.5, 1.2, 0.4, 2.1, 1],
    ];
    for (const r of tableK1) insK1.run(...r);

    // ============================================
    // Table K-2: Box prices (handle_size × quantity)
    // ============================================
    const insK2 = db.prepare(
      'INSERT INTO box_prices (handle_size, quantity, base_rate) VALUES (?,?,?)'
    );
    const boxData: [string, number, number][] = [
      ['陀螺', 38, 0.78],
      ['精密柄', 60, 0.35], ['精密柄', 80, 0.35], ['精密柄', 100, 0.37], ['精密柄', 150, 0.39], ['精密柄', 200, 0.42],
      ['小柄', 60, 0.70], ['小柄', 80, 0.70], ['小柄', 100, 0.73], ['小柄', 150, 0.77], ['小柄', 200, 0.81],
      ['小柄', 250, 0.89], ['小柄', 300, 0.92], ['小柄', 350, 1.00], ['小柄', 400, 1.12], ['小柄', 450, 1.18], ['小柄', 500, 1.24],
      ['中柄', 100, 0.84], ['中柄', 150, 0.90], ['中柄', 200, 0.97], ['中柄', 250, 1.04], ['中柄', 300, 1.10],
      ['中柄', 350, 1.16], ['中柄', 400, 1.22], ['中柄', 450, 1.28], ['中柄', 500, 1.34],
      ['大柄', 100, 1.08], ['大柄', 150, 1.14], ['大柄', 200, 1.20], ['大柄', 250, 1.28], ['大柄', 300, 1.34],
      ['大柄', 350, 1.40], ['大柄', 400, 1.46], ['大柄', 450, 1.52], ['大柄', 500, 1.58],
    ];
    for (const r of boxData) insK2.run(...r);

    // ============================================
    // Table K-3: Shipping prices (handle_size × length range)
    // ============================================
    const insK3 = db.prepare(
      'INSERT INTO shipping_prices (handle_size, length_min, length_max, base_rate) VALUES (?,?,?,?)'
    );
    const shipData: [string, number, number, number][] = [
      ['陀螺',   0,   100,   0.17],
      ['精密柄', 0,   100,   0.17], ['精密柄', 101, 200, 0.19], ['精密柄', 201, 400, 0.25], ['精密柄', 401, 99999, 0.37],
      ['小柄',   0,   100,   0.17], ['小柄',   101, 200, 0.19], ['小柄',   201, 400, 0.25], ['小柄',   401, 99999, 0.37],
      ['中柄',   101, 200,   0.19], ['中柄',   201, 400, 0.25], ['中柄',   401, 99999, 0.37],
      ['大柄',   101, 200,   0.25], ['大柄',   201, 400, 0.34], ['大柄',   401, 99999, 0.37],
    ];
    for (const r of shipData) insK3.run(...r);
  },
};
