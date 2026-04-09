import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyTw', standalone: true })
export class CurrencyTwPipe implements PipeTransform {
  transform(value: number | null | undefined, precision = 2, prefix = 'NT$'): string {
    if (value === null || value === undefined) return '—';
    return `${prefix}${value.toFixed(precision)}`;
  }
}

@Pipe({ name: 'currencyUsd', standalone: true })
export class CurrencyUsdPipe implements PipeTransform {
  transform(value: number | null | undefined, precision = 3): string {
    if (value === null || value === undefined) return '—';
    return `$${value.toFixed(precision)}`;
  }
}
