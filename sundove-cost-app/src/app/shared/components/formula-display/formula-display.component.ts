import { Component, input } from '@angular/core';

@Component({
  selector: 'app-formula-display',
  standalone: true,
  template: `
    <div class="formula-container">
      <span class="font-mono text-xs leading-relaxed whitespace-pre-wrap">{{ formula() }}</span>
    </div>
  `,
  styles: [`
    .formula-container {
      padding: 0.75rem;
      background: #F9FAFB;
      border-radius: 0.375rem;
      border: 1px solid #E5E7EB;
      color: #6C3483;
    }
  `],
})
export class FormulaDisplayComponent {
  readonly formula = input.required<string>();
}
