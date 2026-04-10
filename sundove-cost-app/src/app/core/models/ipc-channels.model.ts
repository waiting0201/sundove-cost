export type IpcChannel =
  // Price tables
  | 'price-table:list-all'
  | 'price-table:list'
  | 'price-table:update'
  | 'price-table:insert'
  | 'price-table:delete'
  | 'price-table:get-row'
  | 'price-table:schema'
  // Global params
  | 'global-params:get'
  | 'global-params:update'
  // Products
  | 'product:list'
  | 'product:get'
  | 'product:create'
  | 'product:update'
  | 'product:delete'
  // Process registry
  | 'process-registry:list'
  // Cascade
  | 'cascade:preview'
  | 'cascade:apply'
  | 'cascade:progress'
  // Import/Export
  | 'import:excel'
  | 'export:excel'
  // Database
  | 'db:path'
  | 'db:backup'
  | 'db:restore'
  // Change log
  | 'change-log:recent';
