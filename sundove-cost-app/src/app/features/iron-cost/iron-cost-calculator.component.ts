import { Component, inject, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IronCostStore } from './iron-cost.store';
import { ProcessCardComponent, ProcessCardData } from '../../shared/components/process-card/process-card.component';
import { CurrencyTwPipe } from '../../shared/pipes/currency-tw.pipe';

@Component({
  selector: 'app-iron-cost-calculator',
  standalone: true,
  imports: [FormsModule, DecimalPipe, ProcessCardComponent, CurrencyTwPipe],
  templateUrl: './iron-cost-calculator.component.html',
  styleUrl: './iron-cost-calculator.component.scss',
})
export class IronCostCalculatorComponent implements OnInit {
  readonly store = inject(IronCostStore);

  ngOnInit(): void {
    if (!this.store.loaded()) {
      this.store.loadPriceTables();
    }
  }

  toProcessCard(p: any): ProcessCardData {
    return {
      processId: p.id,
      order: p.order,
      label: p.label,
      cost: p.cost,
      enabled: p.enabled,
      optional: p.optional,
      calcMethod: p.calcMethod,
      formulaDisplay: null,
    };
  }
}
