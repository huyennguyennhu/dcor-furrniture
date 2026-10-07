import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AdminPageTab {
  id: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-admin-page-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-page-tabs.html',
  styleUrls: ['./admin-page-tabs.css']
})
export class AdminPageTabs {
  @Input() tabs: AdminPageTab[] = [];
  @Input() activeTab: string = '';
  @Output() tabChange = new EventEmitter<string>();

  onTabClick(tabId: string) {
    this.tabChange.emit(tabId);
  }
}
