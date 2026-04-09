import { Component, input, output, signal, ElementRef, viewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editable-cell',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (editing()) {
      <input
        #inputEl
        type="number"
        [ngModel]="editValue()"
        (ngModelChange)="editValue.set($event)"
        (keydown.enter)="confirm()"
        (keydown.escape)="cancel()"
        (keydown.tab)="confirm(); $event.preventDefault(); tabNext.emit()"
        (blur)="confirm()"
        class="cell-input"
        step="any"
      />
    } @else {
      <span
        class="cell-display"
        [class.value-updated]="justUpdated()"
        (dblclick)="startEdit()"
        (keydown.f2)="startEdit()"
        tabindex="0"
      >
        {{ formatValue(value()) }}
      </span>
    }
  `,
  styles: [`
    :host { display: block; }
    .cell-display {
      display: block;
      padding: 0.5rem 0.75rem;
      cursor: pointer;
      text-align: center;
      font-size: 0.875rem;
      font-variant-numeric: tabular-nums;
      border-radius: 0.25rem;
      transition: background-color 0.15s;
      &:hover { background-color: #EFF6FF; outline: 1px solid rgba(27,79,138,0.3); outline-offset: -1px; }
      &:focus { outline: 2px solid #1B4F8A; outline-offset: -2px; }
    }
    .cell-input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      text-align: center;
      font-size: 0.875rem;
      border: 2px solid #1B4F8A;
      outline: none;
      background: white;
      font-variant-numeric: tabular-nums;
    }
  `],
})
export class EditableCellComponent {
  readonly value = input.required<number | null>();
  readonly precision = input(2);
  readonly valueChange = output<number>();
  readonly tabNext = output<void>();

  readonly editing = signal(false);
  readonly editValue = signal<number | null>(null);
  readonly justUpdated = signal(false);

  private inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  constructor() {
    effect(() => {
      const el = this.inputEl();
      if (el) {
        el.nativeElement.focus();
        el.nativeElement.select();
      }
    });
  }

  startEdit(): void {
    this.editValue.set(this.value());
    this.editing.set(true);
  }

  confirm(): void {
    if (!this.editing()) return;
    this.editing.set(false);
    const newVal = this.editValue();
    if (newVal !== null && newVal !== this.value()) {
      this.valueChange.emit(newVal);
      this.flashUpdate();
    }
  }

  cancel(): void {
    this.editing.set(false);
  }

  formatValue(v: number | null): string {
    if (v === null || v === undefined) return '—';
    return v.toFixed(this.precision());
  }

  private flashUpdate(): void {
    this.justUpdated.set(true);
    setTimeout(() => this.justUpdated.set(false), 1000);
  }
}
