import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PricingStore } from './pricing.store';
import { IronCostStore } from '../iron-cost/iron-cost.store';
import { CurrencyTwPipe, CurrencyUsdPipe } from '../../shared/pipes/currency-tw.pipe';

@Component({
  selector: 'app-pricing-calculator',
  standalone: true,
  imports: [FormsModule, CurrencyTwPipe, CurrencyUsdPipe],
  templateUrl: './pricing-calculator.component.html',
  styleUrl: './pricing-calculator.component.scss',
})
export class PricingCalculatorComponent implements OnInit {
  readonly store = inject(PricingStore);
  readonly ironStore = inject(IronCostStore);

  handleSizes = ['大大柄', '大柄', '中柄', '小柄', '精密柄', '陀螺'];

  ngOnInit(): void {
    if (!this.ironStore.loaded()) {
      this.ironStore.loadPriceTables();
    }
    if (!this.store.loaded()) {
      this.store.loadPriceTables();
    }
  }
}
