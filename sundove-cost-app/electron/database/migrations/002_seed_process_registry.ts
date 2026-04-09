import type Database from 'better-sqlite3';

export const migration002_seedProcessRegistry = {
  version: 2,
  name: 'seed_process_registry',
  up(db: Database.Database): void {
    const insert = db.prepare(`
      INSERT INTO process_registry (id, "order", label, calc_method, enabled, optional, price_table, formula_display, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const processes = [
      ['iron_raw',       1,  '鐵材原料',   'weight_based',     1, 0, 'iron_material_prices',   'd² × L × ρ × price/kg',                  '重量(g) = 線徑² × 總長 × 比重 → 重量/1000 × 單價/kg'],
      ['forming',        2,  '成形',       'lookup',           1, 0, 'forming_prices',          '查表(線徑+長度) × 漲幅',                   '依線徑+總長區間查表，固定單價/支'],
      ['heat_treatment', 3,  '熱處理',     'weight_based',     1, 0, 'heat_treatment_prices',   '重量 × price/kg',                         '重量 × 每公斤單價（預抓10mm廢料）'],
      ['sandblasting',   4,  '噴砂',       'weight_based',     1, 0, 'sandblasting_prices',     '重量 × price/kg',                         '重量 × 每公斤單價'],
      ['electroplating', 5,  '電鍍',       'lookup',           1, 0, 'electroplating_prices',   '查表(線徑+長度)',                           '依線徑+總長區間查表（固定/支）'],
      ['blackening',     6,  '染黑',       'mixed',            1, 0, 'blackening_prices',       '3mm固定/支; 4mm+重量計',                   '3mm固定單價/支；4mm以上重量×每公斤單價'],
      ['sleeve',         7,  '膠套',       'fixed_per_piece',  1, 0, 'sleeve_prices',           '(顆粒價+穿工) × 漲幅',                    '(膠套顆粒價+穿工費) × 漲幅'],
      ['straightening',  8,  '整直',       'lookup',           1, 0, 'straightening_prices',    '總長/25 × 區間單價',                       '總長/25mm × 區間單價（3mm≥130mm才需要）'],
      ['hex_ring',       9,  '六角環',     'multi_component',  1, 1, 'hex_ring_prices',         '(鍛品+車修+熱處理+噴砂+電鍍+焊工) × 漲幅', '多項子成本加總 × 1.05（可選）'],
      ['through_head',   10, '貫通頭',     'multi_component',  1, 1, 'through_head_prices',     '(鍛品+加工) × 漲幅',                       '(鍛品+加工) × 漲幅（可選）'],
    ];

    for (const p of processes) {
      insert.run(...p);
    }

    // Seed global parameters
    const insertParam = db.prepare(`
      INSERT INTO global_params (key, value, label, module, affects)
      VALUES (?, ?, ?, ?, ?)
    `);

    const params = [
      ['density_round',    0.00617, '圓鐵比重',       'A', '所有圓鐵產品重量'],
      ['density_hex',      0.00680, '六角比重',       'A', '所有六角產品重量'],
      ['density_square',   0.00785, '四角比重',       'A', '所有四角產品重量'],
      ['tax_rate',         1.061,   '稅率',           'B', '所有產品售價'],
      ['profit_bulk',      1.5,     '散裝利潤倍率',   'B', '散裝售價'],
      ['profit_tag',       1.5,     '吊牌利潤倍率',   'B', '吊牌售價'],
      ['printing_fee',     1.0,     '印刷費(元/支)',   'B', '所有產品'],
      ['bulk_packaging',   0.8,     '散裝包裝費',     'B', '散裝產品'],
      ['tag_sticker',      0.8,     '吊牌貼紙費',     'B', '吊牌產品'],
      ['box_markup',       1.08,    '紙箱漲幅',       'B', '所有紙箱費'],
      ['shipping_markup',  3.0,     '運費漲幅',       'B', '所有運費'],
      ['exchange_rate',    29.5,    '匯率(NTD/USD)',   'B', '所有美金價'],
      ['price_markup',     1.0,     '預抓漲幅',       'B', '所有產品售價'],
    ];

    for (const p of params) {
      insertParam.run(...p);
    }
  },
};
