import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';
import { ToastService } from '../../shared/components/toast/toast.service';

interface ParamRow {
  key: string;
  value: number;
  label: string | null;
  module: string | null;
  affects: string | null;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-xl font-bold text-brand mb-6">設定</h1>

      <!-- Global params -->
      <div class="mb-8">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">表 L：全域可調參數</h2>
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-brand text-white text-xs uppercase tracking-wide">
                <th class="px-4 py-2 text-left font-medium">參數名稱</th>
                <th class="px-4 py-2 text-center font-medium w-32">目前值</th>
                <th class="px-4 py-2 text-left font-medium">說明</th>
                <th class="px-4 py-2 text-left font-medium">影響範圍</th>
                <th class="px-4 py-2 text-center font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (param of params(); track param.key) {
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-4 py-2 font-medium">{{ param.label ?? param.key }}</td>
                  <td class="px-4 py-2 text-center">
                    @if (editingKey() === param.key) {
                      <input type="number" step="any"
                        class="w-full px-2 py-1 text-center text-sm border-2 border-brand rounded outline-none"
                        [(ngModel)]="editValue"
                        (keydown.enter)="saveParam(param)"
                        (keydown.escape)="cancelEdit()" />
                    } @else {
                      <span class="font-mono tabular-nums cursor-pointer hover:text-brand"
                        (dblclick)="startEdit(param)">
                        {{ param.value }}
                      </span>
                    }
                  </td>
                  <td class="px-4 py-2 text-xs text-muted">{{ param.module ? '模組 ' + param.module : '' }}</td>
                  <td class="px-4 py-2 text-xs text-muted">{{ param.affects ?? '' }}</td>
                  <td class="px-4 py-2 text-center whitespace-nowrap">
                    @if (editingKey() === param.key) {
                      <button (click)="saveParam(param)" class="text-xs text-brand hover:underline mr-1">儲存</button>
                      <button (click)="cancelEdit()" class="text-xs text-muted hover:underline">取消</button>
                    } @else {
                      <button (click)="startEdit(param)" class="text-xs text-muted hover:text-brand">編輯</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Database backup/restore -->
      <div>
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">資料庫管理</h2>
        <div class="bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex gap-3 mb-3">
            <button (click)="backupDb()"
              class="px-4 py-2 bg-white text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              💾 備份資料庫
            </button>
            <button (click)="restoreDb()"
              class="px-4 py-2 bg-white text-red-600 text-sm border border-red-300 rounded-md hover:bg-red-50 transition-colors">
              🔄 還原資料庫
            </button>
          </div>
          <p class="text-xs text-muted">資料庫位置：{{ dbPath() }}</p>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly ipc = inject(ElectronIpcService);
  private readonly toast = inject(ToastService);

  readonly params = signal<ParamRow[]>([]);
  readonly dbPath = signal('（載入中...）');

  // Editing state — separate from params so keystrokes don't rebuild the array
  readonly editingKey = signal<string | null>(null);
  editValue = 0;

  ngOnInit(): void {
    this.loadParams();
    this.loadDbPath();
  }

  async loadDbPath(): Promise<void> {
    const path = await this.ipc.invoke<string>('db:path');
    this.dbPath.set(path || '（瀏覽器模式，無資料庫）');
  }

  async loadParams(): Promise<void> {
    const data = await this.ipc.invoke<any[]>('global-params:get');
    this.params.set(data.map((p: any) => ({
      key: p.key,
      value: p.value,
      label: p.label,
      module: p.module,
      affects: p.affects,
    })));
  }

  startEdit(param: ParamRow): void {
    this.editValue = param.value;
    this.editingKey.set(param.key);
  }

  cancelEdit(): void {
    this.editingKey.set(null);
  }

  async saveParam(param: ParamRow): Promise<void> {
    const newValue = Number(this.editValue);
    if (isNaN(newValue)) {
      this.toast.error('請輸入有效數字');
      return;
    }
    if (newValue === param.value) {
      this.editingKey.set(null);
      this.toast.success('值未變更');
      return;
    }
    try {
      await this.ipc.invoke('global-params:update', {
        key: param.key,
        value: newValue,
      });
      this.params.update(list =>
        list.map(p => p.key === param.key ? { ...p, value: newValue } : p)
      );
      this.editingKey.set(null);
      this.toast.success(`已更新 ${param.label ?? param.key}: ${newValue}`);
    } catch (err) {
      this.toast.error(`儲存失敗: ${err}`);
    }
  }

  async backupDb(): Promise<void> {
    const res = await this.ipc.invoke<any>('db:backup');
    if (res.success) {
      this.toast.success(`已備份到 ${res.filePath}`);
    }
  }

  async restoreDb(): Promise<void> {
    const res = await this.ipc.invoke<any>('db:restore');
    if (res.success) {
      this.toast.success(res.message);
    }
  }
}
