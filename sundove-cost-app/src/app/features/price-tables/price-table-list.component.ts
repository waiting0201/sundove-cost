import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';

interface TableInfo {
  id: string;
  label: string;
  group: string;
  rowCount: number;
}

@Component({
  selector: 'app-price-table-list',
  standalone: true,
  templateUrl: './price-table-list.component.html',
})
export class PriceTableListComponent implements OnInit {
  private readonly ipc = inject(ElectronIpcService);
  private readonly router = inject(Router);

  readonly tables = signal<TableInfo[]>([]);
  readonly loading = signal(true);

  private readonly tableDefinitions: Omit<TableInfo, 'rowCount'>[] = [
    { id: 'iron-material',  label: 'A 鐵材原料單價', group: '工序費用表' },
    { id: 'forming',        label: 'B 成形單價',     group: '工序費用表' },
    { id: 'heat-treatment', label: 'C 熱處理單價',   group: '工序費用表' },
    { id: 'sandblasting',   label: 'D 噴砂單價',     group: '工序費用表' },
    { id: 'electroplating', label: 'E 電鍍單價',     group: '工序費用表' },
    { id: 'blackening',     label: 'F 染黑單價',     group: '工序費用表' },
    { id: 'sleeve',         label: 'G 膠套單價',     group: '工序費用表' },
    { id: 'straightening',  label: 'H 整直單價',     group: '工序費用表' },
    { id: 'hex-ring',       label: 'I-1 六角環',     group: '選配件' },
    { id: 'through-head',   label: 'I-2 貫通頭',     group: '選配件' },
    { id: 'handle',         label: 'J 手柄價格',     group: '包材定價' },
    { id: 'packaging',      label: 'K-1 包裝費用',   group: '包材定價' },
    { id: 'box',            label: 'K-2 紙箱費用',   group: '包材定價' },
    { id: 'shipping',       label: 'K-3 運費',       group: '包材定價' },
  ];

  readonly groups = ['工序費用表', '選配件', '包材定價'];

  ngOnInit(): void {
    this.loadCounts();
  }

  async loadCounts(): Promise<void> {
    this.loading.set(true);
    const counts = await this.ipc.invoke<Record<string, number>>('price-table:list-all');
    this.tables.set(
      this.tableDefinitions.map(t => ({ ...t, rowCount: counts[t.id] ?? 0 }))
    );
    this.loading.set(false);
  }

  tablesInGroup(group: string): TableInfo[] {
    return this.tables().filter(t => t.group === group);
  }

  openTable(tableId: string): void {
    this.router.navigate(['/price-tables', tableId]);
  }
}
