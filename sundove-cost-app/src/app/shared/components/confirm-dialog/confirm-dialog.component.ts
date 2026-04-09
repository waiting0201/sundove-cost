import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-40 bg-black/30" (click)="cancel.emit()"></div>
      <!-- Dialog -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <h3 class="text-base font-semibold text-gray-900 mb-2">{{ title() }}</h3>
          <p class="text-sm text-gray-600 mb-6">{{ message() }}</p>
          <div class="flex justify-end gap-3">
            <button
              (click)="cancel.emit()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              (click)="confirm.emit()"
              class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
              [class]="confirmBtnClass()"
            >
              {{ confirmLabel() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('確認');
  readonly message = input('確定要執行此操作嗎？');
  readonly confirmLabel = input('確認');
  readonly danger = input(false);

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  confirmBtnClass(): string {
    return this.danger() ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark';
  }
}
