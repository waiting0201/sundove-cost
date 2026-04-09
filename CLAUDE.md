# Sundove Cost — 螺絲起子成本計算系統

## Project Overview

桌面應用（Electron），用於螺絲起子製造業的成本計算與定價管理。取代現有 Excel 手動查表流程。
- 410+ 鐵材 SKU、500+ 定價 SKU
- 1-3 人內部使用
- 產出 Windows EXE 安裝檔

## Tech Stack

- **Frontend**: Angular 21 (standalone components, Signals)
- **Desktop**: Electron (main process + renderer)
- **Database**: better-sqlite3 (local SQLite)
- **Styling**: Tailwind CSS 4 + SCSS
- **Packaging**: electron-builder + NSIS installer

### Forbidden Dependencies

- **NO** PrimeNG
- **NO** Angular Material
- **NO** AG Grid
- **NO** NgRx / NGXS（用 signal store 取代）
- **NO** NgModules（全部用 standalone components）

### Allowed Lightweight Dependencies

- Angular CDK (`ScrollingModule`, `DragDropModule`, `DialogModule`)
- Tailwind CSS 4 + `@tailwindcss/forms` plugin
- Noto Sans TC (Google Fonts)
- JetBrains Mono (公式顯示)

## Architecture

```
Electron Main Process (Node.js)
  ├── better-sqlite3 (local .db at AppData/Roaming/sundove-cost/)
  ├── IPC Handlers (ipcMain.handle)
  ├── Repositories (data access per table)
  └── Calculation Service (batch recalculation)

Electron Renderer Process (Angular 21)
  ├── ElectronIpcService (typed IPC wrapper via contextBridge)
  ├── Signal Stores (per feature, computed cascade)
  └── Tailwind + SCSS UI
```

### IPC Communication

- Renderer → Main: `window.electronAPI.invoke(channel, payload)`
- Main → Renderer: `ipcRenderer.on(channel, callback)` (push events)
- All channels defined in `src/app/core/models/ipc-channels.model.ts`
- Context isolation enabled, nodeIntegration disabled

### State Management: Signal Stores

每個 feature 有自己的 signal store（不用 NgRx）：

```typescript
// 用 signal() + computed() 建立連鎖計算
readonly weight = computed(() => this.wireDiameter() ** 2 * this.totalLength() * this.density());
readonly ironMaterialCost = computed(() => this.weight() / 1000 * lookupPrice(...));
readonly totalIronCost = computed(() => /* 10 道工序加總 */);
```

- 單一 SKU 即時計算 → 前端 `computed()` chain（sub-ms）
- 批次重算（改價格表）→ IPC 到 main process
- SKU 計算結果**不存資料庫**，永遠即時算

## Flexibility Design（最高優先原則）

### Process Registry（工序不硬編碼）

工序定義存在資料庫 `process_registry` 表，UI 根據 registry 動態渲染：

```typescript
{ id: "iron_raw", order: 1, label: "鐵原料", calcMethod: "weight_based",
  enabled: true, optional: false, priceTable: "TABLE_A" }
```

- 新增工序 = INSERT 一筆 → UI 自動多一張工序卡片
- 停用工序 = `enabled: false` → 卡片灰色顯示
- 重排工序 = 改 `order` 欄位

### Dynamic Table Schema（價格表欄位動態）

每張價格表的欄位結構由 schema 定義，新增欄/列不需改 UI：

```typescript
{ rowDimension: { label: "線徑", values: [4, 5, 6, 8] },
  colDimension: { label: "長度範圍", values: ["≤75", "76-125", ...] },
  valueType: "currency_NTD" }
```

### Pricing Mode Registry（定價模式可擴充）

目前有散裝/吊牌，未來可新增 OEM 等模式，只需加一筆 registry 資料。

## Styling Rules

### Tailwind CSS 4 + SCSS

所有 UI 元件自建，用 Tailwind utility classes + SCSS mixin：

```scss
// tailwind.config — custom design tokens
colors: {
  brand:  { DEFAULT: '#1B4F8A', light: '#E8F0FA', dark: '#0F3260' },
  up:     '#D97706',   // 漲價（橙）
  down:   '#2D9D5C',   // 降價（綠）
  danger: '#DC2626',
  muted:  '#6B7280',
}
fontFamily: {
  sans: ['Noto Sans TC', 'system-ui'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### SCSS Mixin（可重用樣式）

定義在 `src/app/shared/styles/`：

- `_tables.scss` — 價格表格樣式（header bg-brand, striped rows, editable hover ring）
- `_cards.scss` — 工序卡片（rounded-lg, border, expanded/disabled 狀態）
- `_forms.scss` — 表單輸入樣式

```scss
@mixin price-table {
  @apply w-full text-sm border-collapse;
  th { @apply bg-brand text-white px-3 py-2 text-center font-medium; }
  td { @apply px-3 py-2 border-b border-gray-200 text-center; }
  tr:nth-child(even) td { @apply bg-gray-50; }
  td.editable:hover { @apply bg-blue-50 cursor-pointer ring-1 ring-brand/30; }
}

@mixin process-card {
  @apply bg-white rounded-lg border border-gray-200 shadow-sm;
  &.expanded { @apply ring-1 ring-brand/20; }
  &.disabled { @apply opacity-50 bg-gray-50; }
  .card-header { @apply flex justify-between items-center px-4 py-3 cursor-pointer; }
  .card-body { @apply px-4 pb-4 border-t border-gray-100; }
}
```

### Color Semantics

| 用途 | Light | Dark |
|------|-------|------|
| 頁面背景 | `bg-gray-50` | `bg-gray-950` |
| 卡片背景 | `bg-white` | `bg-gray-900` |
| 品牌色 | `bg-brand` (#1B4F8A) | `text-blue-400` |
| 選中列 | `bg-brand-light` (#E8F0FA) | `bg-blue-950` |
| 上漲 | `text-up` (#D97706) | same |
| 下跌 | `text-down` (#2D9D5C) | same |
| 主文字 | `text-gray-900` | `text-gray-100` |
| 次文字 | `text-gray-500` | `text-gray-400` |

### Typography

| 用途 | Class |
|------|-------|
| 頁面標題 H1 | `text-xl font-bold` |
| 區塊標題 H2 | `text-base font-semibold` |
| 卡片標題 H3 | `text-sm font-semibold` |
| 內文 | `text-sm` |
| 輔助說明 | `text-xs text-muted` |
| 金額數字 | `font-mono tabular-nums tracking-tight` |
| 公式 | `font-mono text-sm` |

### Spacing (8px grid)

`p-1`=4px `p-2`=8px `p-3`=12px `p-4`=16px `p-6`=24px `p-8`=32px

### Self-Built Components（取代第三方元件庫）

| 元件 | 路徑 | 技術 |
|------|------|------|
| 資料表格 | `shared/components/data-table/` | Tailwind table + SCSS mixin |
| 虛擬捲動 | — | Angular CDK `cdk-virtual-scroll-viewport` |
| 行內編輯 | `shared/components/editable-cell/` | click-to-edit + focus ring |
| 欄位拖曳排序 | — | Angular CDK `DragDropModule` |
| 工序卡片 | `shared/components/process-card/` | SCSS mixin + accordion |
| 公式展示 | `shared/components/formula-display/` | `font-mono` highlight |
| 漲跌標籤 | `shared/components/price-diff-badge/` | `text-up` / `text-down` |
| Dialog | `shared/components/confirm-dialog/` | Angular CDK `DialogModule` |
| Toast 通知 | `shared/components/toast/` | signal-based + fixed positioning |
| 表單控制 | 原生 `<input>` `<select>` | `@tailwindcss/forms` plugin |

## UI Interaction Patterns

### Inline Editing（價格表）

- 雙擊格子 → 進入編輯模式
- Tab → 下一格 / Shift+Tab → 上一格
- Enter → 確認並向下 / Esc → 取消
- F2 → 進入編輯（Excel 慣例）
- Ctrl+Z → 復原 / Ctrl+S → 儲存
- 離開格子時顯示受影響 SKU 數
- 未儲存變更 → 儲存按鈕變橙色

### Real-time Calculation

- 輸入變動 → 300ms debounce → 重算 → yellow flash 動畫提示更新
- 所有數字變化用短暫背景閃爍標示

### Progressive Disclosure（漸進揭露）

- 工序卡片預設折疊：只顯示工序名 + 金額
- 點擊展開：顯示完整計算公式和查表邏輯
- 「展開全部 / 折疊全部」快捷按鈕

## Page Layout Specifications

### Shell: Sidebar + Topbar + Status Bar

- Sidebar: 72px collapsed / 220px expanded
- Topbar: breadcrumb + SKU 快速搜尋 + 設定
- Status Bar: 最後計算時間 / SKU 數 / 匯率 / 同步狀態
- 最小解析度: 1280×800，設計基準: 1920×1080

### Calculator Page（核心頁面 — 三欄佈局）

- **左欄 (300px 固定)**: 產品規格輸入（線徑、長度、材料、把手、選配工序）+ 快速預覽
- **中欄 (flex-grow)**: 工序成本明細（config-driven 卡片列表，可展開/折疊）
- **右欄 (320px 固定)**: 最終定價（散裝/吊牌切換，步驟化顯示至最終售價+USD）

### Price Table Editor（兩欄佈局）

- **左欄 (200px)**: 12 張表的導航樹
- **右欄**: 行內編輯表格 + cell detail panel（選中格子的影響資訊和修改歷史）

### SKU List

- 篩選列: 線徑 chip 篩選 + 長度下拉 + 把手下拉 + 搜尋
- CDK virtual scroll（412+ 列）
- 欄位設定浮層（勾選顯示/拖曳排序）
- 底部: 批次操作列 + 分頁

### Comparison View（影響比較）

- 頂部: 4 張摘要卡片（受影響數、平均漲幅、最大漲幅、變更表格數）
- 篩選列: 按變更的價格表篩選
- 表格: 舊值 vs 新值並列，色標標示漲跌

## Project Structure

```
sundove-cost-app/
├── electron/
│   ├── main.ts                        # 視窗+IPC+DB 初始化
│   ├── preload.ts                     # contextBridge
│   ├── ipc/                           # IPC handlers
│   ├── database/
│   │   ├── connection.ts              # better-sqlite3 singleton
│   │   ├── migrations/                # 版本化 schema
│   │   ├── repositories/              # 每張表一個 repo
│   │   └── seed/                      # 初始 JSON 資料
│   └── services/
│       ├── calculation.service.ts     # 核心計算引擎
│       └── cascade-recalc.service.ts  # 批次重算
│
├── src/app/
│   ├── app.component.ts               # Root standalone
│   ├── app.routes.ts                  # Lazy loading
│   ├── app.config.ts
│   ├── core/
│   │   ├── services/
│   │   │   └── electron-ipc.service.ts
│   │   └── models/
│   │       ├── ipc-channels.model.ts
│   │       ├── process-registry.model.ts
│   │       └── calculation-result.model.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── data-table/
│   │   │   ├── editable-cell/
│   │   │   ├── formula-display/
│   │   │   ├── process-card/
│   │   │   ├── price-diff-badge/
│   │   │   ├── toast/
│   │   │   └── confirm-dialog/
│   │   ├── styles/
│   │   │   ├── _tables.scss
│   │   │   ├── _cards.scss
│   │   │   └── _forms.scss
│   │   └── pipes/
│   │       └── currency-tw.pipe.ts
│   └── features/                      # All lazy-loaded
│       ├── dashboard/
│       ├── iron-cost/                 # Module A: 10 processes
│       ├── pricing/                   # Module B: bulk/tag
│       ├── price-tables/              # 12 table editors
│       ├── products/                  # SKU management
│       ├── comparison/                # Before/after
│       └── settings/                  # Backup/import/export
│
├── reference/                         # 原始參考資料
│   ├── 螺絲起子成本計算邏輯分析報告.pdf
│   ├── 成本分析數據.docx
│   ├── 鐵材成本計算.xlsx
│   └── 2022 K25.xlsx
│
├── electron-builder.yml               # NSIS installer config
├── tailwind.config.ts
└── package.json
```

## Routes

| Route | Feature | Lazy |
|-------|---------|------|
| `/` | Dashboard | Yes |
| `/iron-cost` | 鐵材成本計算機 | Yes |
| `/pricing` | 最終定價計算 | Yes |
| `/price-tables` | 價格表管理列表 | Yes |
| `/price-tables/:id` | 單張表編輯 | Yes |
| `/products` | SKU 列表 | Yes |
| `/products/:id` | SKU 明細 | Yes |
| `/comparison` | 影響比較 | Yes |
| `/settings` | 備份/匯入匯出 | Yes |

## Calculation Logic Reference

完整計算邏輯見 `reference/螺絲起子成本計算邏輯分析報告.pdf`

### Verification Examples（from PDF report section 6）

| 範例 | 規格 | 鐵材總成本 | 散裝售價 |
|------|------|-----------|---------|
| PH0X60 | 3mm 小柄 | 3.6351 | 20.874 |
| PH1X200 | 5mm 小柄+六角環 | 16.177 | — |
| PH2X100 JIS | 6mm 中柄 | — | 30.361 |

## EXE Packaging

```yaml
# electron-builder.yml
appId: com.sundove.cost-calculator
productName: 日鴿成本計算系統
win:
  target: nsis
  arch: [x64]
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  installerLanguages: ["zh_TW"]
asar: true
asarUnpack:
  - "native_modules/**/*"   # better-sqlite3 native addon
```

Database location: `app.getPath('userData')/sundove-cost.db`
(Windows: `C:\Users\<user>\AppData\Roaming\sundove-cost\`)
