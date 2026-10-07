import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Column {
  key: string;
  header: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.css']
})
export class DataTable {
  @Input() columns: Column[] = [];
  @Input() data: any[] = [];
  @Input() pageSize: number = 10;
  @Input() selectable: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() rowKey: string = 'id';

  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<Set<string>>();

  @ContentChild('actionsTemplate') actionsTemplate?: TemplateRef<any>;
  @ContentChild('expandableTemplate') expandableTemplate?: TemplateRef<any>;
  @ContentChild('customCellTemplate') customCellTemplate?: TemplateRef<any>;

  Math = Math;
  currentPage: number = 1;
  openDropdownRow: number | null = null;
  expandedRows = new Set<number>();
  selectedKeys = new Set<string>();

  constructor(private eRef: ElementRef) {}

  get totalItems(): number {
    return this.data.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get paginatedData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    let startPage = Math.max(1, this.currentPage - 1);
    let endPage = Math.min(this.totalPages, startPage + 2);
    if (endPage - startPage < 2 && this.totalPages >= 3) {
      startPage = Math.max(1, endPage - 2);
    }
    const p = [];
    for (let i = startPage; i <= endPage; i++) {
      p.push(i);
    }
    return p;
  }

  get showNavButtons(): boolean {
    return this.totalPages > 3;
  }

  setPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
      this.openDropdownRow = null;
    }
  }

  onRowClick(item: any) {
    this.rowClick.emit(item);
  }

  toggleExpand(index: number, event: Event) {
    event.stopPropagation();
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  toggleDropdown(index: number, event: Event) {
    event.stopPropagation();
    this.openDropdownRow = this.openDropdownRow === index ? null : index;
  }

  toggleAllSelection(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.paginatedData.forEach(item => this.selectedKeys.add(item[this.rowKey]));
    } else {
      this.paginatedData.forEach(item => this.selectedKeys.delete(item[this.rowKey]));
    }
    this.selectionChange.emit(new Set(this.selectedKeys));
  }

  toggleSelection(item: any, event: any) {
    event.stopPropagation();
    const key = item[this.rowKey];
    if (event.target.checked) {
      this.selectedKeys.add(key);
    } else {
      this.selectedKeys.delete(key);
    }
    this.selectionChange.emit(new Set(this.selectedKeys));
  }

  isAllSelected(): boolean {
    if (this.paginatedData.length === 0) return false;
    return this.paginatedData.every(item => this.selectedKeys.has(item[this.rowKey]));
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.openDropdownRow !== null) {
      // Basic click outside logic for dropdowns
      this.openDropdownRow = null;
    }
  }
}
