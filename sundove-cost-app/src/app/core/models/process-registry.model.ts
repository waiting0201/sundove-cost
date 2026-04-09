export interface ProcessDefinition {
  id: string;
  order: number;
  label: string;
  calc_method: 'weight_based' | 'lookup' | 'fixed_per_piece' | 'mixed' | 'multi_component';
  enabled: boolean;
  optional: boolean;
  price_table: string | null;
  formula_display: string | null;
  description: string | null;
}
