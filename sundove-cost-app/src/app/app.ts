import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: { path: string; label: string }[];
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  sidebarExpanded = signal(true);

  navItems: NavItem[] = [
    { path: '/', label: '總覽儀表板', icon: '🏠' },
    {
      path: '/iron-cost',
      label: '成本計算',
      icon: '🔧',
      children: [
        { path: '/iron-cost', label: '鐵件成本' },
        { path: '/pricing', label: '最終定價' },
      ],
    },
    { path: '/products', label: 'SKU 管理', icon: '📋' },
    { path: '/price-tables', label: '價格表管理', icon: '📊' },
    { path: '/comparison', label: '影響比較', icon: '⚖️' },
    { path: '/settings', label: '設定', icon: '⚙️' },
  ];

  toggleSidebar(): void {
    this.sidebarExpanded.update(v => !v);
  }
}
