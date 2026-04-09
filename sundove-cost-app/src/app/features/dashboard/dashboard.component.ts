import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStore } from './dashboard.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  readonly store = inject(DashboardStore);

  ngOnInit(): void {
    this.store.load();
  }

  formatTableName(name: string): string {
    const map: Record<string, string> = {
      iron_material_prices: '表A 鐵材原料',
      forming_prices: '表B 成形',
      heat_treatment_prices: '表C 熱處理',
      sandblasting_prices: '表D 噴砂',
      electroplating_prices: '表E 電鍍',
      blackening_prices: '表F 染黑',
      sleeve_prices: '表G 膠套',
      straightening_prices: '表H 整直',
      hex_ring_prices: '表I-1 六角環',
      through_head_prices: '表I-2 貫通頭',
      handle_prices: '表J 手柄',
      packaging_prices: '表K-1 包裝',
      box_prices: '表K-2 紙箱',
      shipping_prices: '表K-3 運費',
      global_params: '表L 全域參數',
    };
    return map[name] ?? name;
  }
}
