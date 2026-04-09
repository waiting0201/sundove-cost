import { Component, input, signal, computed } from '@angular/core';

export interface ProcessCardData {
  processId: string;
  order: number;
  label: string;
  cost: number;
  enabled: boolean;
  optional: boolean;
  calcMethod: string;
  formulaDisplay: string | null;
  steps?: { label: string; value: string | number }[];
}

@Component({
  selector: 'app-process-card',
  standalone: true,
  template: `
    <div
      class="process-card"
      [class.expanded]="expanded()"
      [class.disabled]="!data().enabled"
      [class.optional-inactive]="data().optional && !data().enabled"
    >
      <!-- Header: always visible -->
      <div class="card-header" (click)="toggle()">
        <div class="card-title">
          <span class="card-order">{{ padOrder(data().order) }}</span>
          <span class="card-label">{{ data().label }}</span>
          @if (data().optional) {
            <span class="card-badge" [class.enabled]="data().enabled" [class.disabled]="!data().enabled">
              {{ data().enabled ? '啟用' : '停用' }}
            </span>
          }
        </div>
        <div class="flex items-center gap-2">
          <span class="card-cost" [class.text-muted]="!data().enabled">
            {{ data().enabled ? formatCost(data().cost) : '(NT$0)' }}
          </span>
          <span class="text-xs text-muted">{{ expanded() ? '▼' : '▶' }}</span>
        </div>
      </div>

      <!-- Body: collapsible -->
      @if (expanded()) {
        <div class="card-body">
          <div class="text-xs text-muted mb-2">
            計算方式: {{ calcMethodLabel() }}
          </div>

          @if (data().formulaDisplay) {
            <div class="card-formula">
              {{ data().formulaDisplay }}
            </div>
          }

          @if (data().steps && data().steps!.length > 0) {
            <div class="mt-3 space-y-1">
              @for (step of data().steps!; track step.label) {
                <div class="flex justify-between text-xs">
                  <span class="text-gray-600">{{ step.label }}</span>
                  <span class="font-mono tabular-nums">{{ step.value }}</span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './process-card.component.scss',
})
export class ProcessCardComponent {
  readonly data = input.required<ProcessCardData>();
  readonly expanded = signal(false);

  readonly calcMethodLabel = computed(() => {
    const map: Record<string, string> = {
      weight_based: '重量法',
      lookup: '查表法',
      fixed_per_piece: '固定/支',
      mixed: '混合計價',
      multi_component: '多組件加總',
    };
    return map[this.data().calcMethod] ?? this.data().calcMethod;
  });

  toggle(): void {
    this.expanded.update(v => !v);
  }

  padOrder(n: number): string {
    return n.toString().padStart(2, '0');
  }

  formatCost(v: number): string {
    return `NT$${v.toFixed(4)}`;
  }
}
