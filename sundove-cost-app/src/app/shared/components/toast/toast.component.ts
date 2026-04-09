import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg transition-all duration-300"
          [class]="toastClass(toast.type)"
          (click)="toastService.dismiss(toast.id)"
        >
          <span>{{ icon(toast.type) }}</span>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  toastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-600 text-white';
      case 'error': return 'bg-red-600 text-white';
      default: return 'bg-gray-800 text-white';
    }
  }

  icon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      default: return 'ℹ';
    }
  }
}
