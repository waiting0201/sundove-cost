import { registerPriceTableHandlers } from './price-table.ipc';
import { registerGlobalParamsHandlers } from './global-params.ipc';
import { registerProductHandlers } from './product.ipc';
import { registerProcessRegistryHandlers } from './process-registry.ipc';
import { registerExportHandlers } from './export.ipc';
import { registerCascadeHandlers } from './cascade.ipc';

// All registered IPC channels — used by forceQuit to removeHandler
export const IPC_CHANNELS = [
  'global-params:get',
  'global-params:update',
  'price-table:list-all',
  'price-table:list',
  'price-table:update',
  'price-table:insert',
  'price-table:delete',
  'price-table:schema',
  'process-registry:list',
  'db:path',
  'import:excel',
  'export:excel',
  'db:backup',
  'db:restore',
  'product:list',
  'product:get',
  'product:create',
  'product:update',
  'product:delete',
  'change-log:recent',
  'cascade:preview',
  'cascade:apply',
] as const;

export function registerAllIpcHandlers(): void {
  registerPriceTableHandlers();
  registerGlobalParamsHandlers();
  registerProductHandlers();
  registerProcessRegistryHandlers();
  registerExportHandlers();
  registerCascadeHandlers();
}
