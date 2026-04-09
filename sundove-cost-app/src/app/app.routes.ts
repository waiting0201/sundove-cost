import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'iron-cost',
    loadComponent: () =>
      import('./features/iron-cost/iron-cost-calculator.component').then(m => m.IronCostCalculatorComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing-calculator.component').then(m => m.PricingCalculatorComponent),
  },
  {
    path: 'price-tables',
    loadComponent: () =>
      import('./features/price-tables/price-table-list.component').then(m => m.PriceTableListComponent),
  },
  {
    path: 'price-tables/:id',
    loadComponent: () =>
      import('./features/price-tables/price-table-editor.component').then(m => m.PriceTableEditorComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/product-list.component').then(m => m.ProductListComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/products/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'comparison',
    loadComponent: () =>
      import('./features/comparison/comparison.component').then(m => m.ComparisonComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
];
