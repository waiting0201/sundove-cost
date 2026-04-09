import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-price-diff-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-0.5 text-xs font-medium tabular-nums" [class]="colorClass()">
      {{ prefix() }}{{ formattedValue() }}
    </span>
  `,
})
export class PriceDiffBadgeComponent {
  readonly value = input.required<number>();
  readonly format = input<'currency' | 'percent'>('currency');

  readonly prefix = computed(() => {
    const v = this.value();
    if (v > 0) return '▲ +';
    if (v < 0) return '▼ ';
    return '─ ';
  });

  readonly colorClass = computed(() => {
    const v = this.value();
    if (v > 0) return 'text-up';
    if (v < 0) return 'text-down';
    return 'text-muted';
  });

  readonly formattedValue = computed(() => {
    const v = this.value();
    if (v === 0) return '0';
    if (this.format() === 'percent') return `${v.toFixed(1)}%`;
    return `NT$${Math.abs(v).toFixed(2)}`;
  });
}
