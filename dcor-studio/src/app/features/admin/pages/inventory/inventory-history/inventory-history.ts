import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Search, Filter, Calendar as CalendarIcon, Download, Loader2,
  Building2, Layers, ChevronDown, Check, X, RotateCcw
} from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';

export interface HistoryItem {
  id: string;
  txCode: string;
  date: string;
  sku: string;
  productName: string;
  variant: string;
  location: string;
  type: string;
  rawType: string;
  quantity: string;
  stockBefore: number;
  stockAfter: number;
  reference: string;
  creator: string;
  notes: string;
}

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-history.html',
  styleUrls: ['./inventory-history.css']
})
export class InventoryHistoryComponent implements OnInit {
  icons = { 
    Search, Filter, CalendarIcon, Download, Loader2,
    Building2, Layers, ChevronDown, Check, X, RotateCcw
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  data: HistoryItem[] = [];
  rawHistory: HistoryItem[] = [];
  warehouses: any[] = [];
  
  viewBy: 'variant' | 'product' = 'variant';
  searchQuery = '';
  selectedWarehouse = '';
  selectedType = '';
  isLoading = true;

  showViewByDropdown = false;
  showWarehouseDropdown = false;
  showTypeDropdown = false;

  typeOptions: string[] = [
    'Mọi loại biến động',
    'Nhập kho',
    'Xuất kho',
    'Điều chỉnh tăng',
    'Điều chỉnh giảm',
    'Chuyển kho đến',
    'Chuyển kho đi',
    'Hoàn hàng',
    'Xuất hủy'
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-wrapper')) {
      this.showViewByDropdown = false;
      this.showWarehouseDropdown = false;
      this.showTypeDropdown = false;
      this.cdr.markForCheck();
    }
  }

  toggleViewByDropdown(event: Event) {
    event.stopPropagation();
    this.showViewByDropdown = !this.showViewByDropdown;
    this.showWarehouseDropdown = false;
    this.showTypeDropdown = false;
  }

  toggleWarehouseDropdown(event: Event) {
    event.stopPropagation();
    this.showWarehouseDropdown = !this.showWarehouseDropdown;
    this.showViewByDropdown = false;
    this.showTypeDropdown = false;
  }

  toggleTypeDropdown(event: Event) {
    event.stopPropagation();
    this.showTypeDropdown = !this.showTypeDropdown;
    this.showViewByDropdown = false;
    this.showWarehouseDropdown = false;
  }

  onSelectViewBy(val: 'variant' | 'product') {
    this.viewBy = val;
    this.showViewByDropdown = false;
    this.cdr.markForCheck();
  }

  onSelectWarehouse(wName: string) {
    this.selectedWarehouse = wName;
    this.showWarehouseDropdown = false;
    this.filterData();
    this.cdr.markForCheck();
  }

  onSelectType(t: string) {
    this.selectedType = t === 'Mọi loại biến động' ? '' : t;
    this.showTypeDropdown = false;
    this.filterData();
    this.cdr.markForCheck();
  }

  hasActiveFilters(): boolean {
    return !!this.selectedWarehouse || !!this.selectedType || !!this.searchQuery.trim() || this.viewBy !== 'variant';
  }

  resetFilters() {
    this.selectedWarehouse = '';
    this.selectedType = '';
    this.searchQuery = '';
    this.viewBy = 'variant';
    this.showViewByDropdown = false;
    this.showWarehouseDropdown = false;
    this.showTypeDropdown = false;
    this.filterData();
    this.cdr.markForCheck();
  }

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchWarehouses();
    this.fetchHistory();
  }

  fetchWarehouses() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (res) => {
        this.warehouses = res || [];
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching warehouses:', err)
    });
  }

  fetchHistory() {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/history`).subscribe({
      next: (res) => {
        const raw = res || [];
        this.rawHistory = raw.map((tx: any) => {
          const typeStr = this.formatType(tx.type);
          const dateStr = this.formatDate(tx.createdAt);
          const qtyStr = tx.quantityChange > 0 ? `+${tx.quantityChange}` : `${tx.quantityChange}`;

          return {
            id: tx.txCode || tx.id,
            txCode: tx.txCode || tx.id,
            date: dateStr,
            sku: tx.variant?.sku || 'SKU-N/A',
            productName: tx.variant?.product?.name || tx.variant?.name || 'Sản phẩm',
            variant: tx.variant?.name || 'Tiêu chuẩn',
            location: tx.warehouse?.name || tx.location || 'Kho Tổng (TP.HCM)',
            type: typeStr,
            rawType: tx.type,
            quantity: qtyStr,
            stockBefore: tx.stockBefore ?? 0,
            stockAfter: tx.stockAfter ?? 0,
            reference: tx.referenceCode || '-',
            creator: tx.actor?.fullName || '-',
            notes: tx.notes || ''
          };
        });

        this.filterData();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching stock history:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filterData() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    this.data = this.rawHistory.filter(item => {
      const matchQuery = !q ||
        item.id.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q);

      const matchWarehouse = !this.selectedWarehouse ||
        item.location.toLowerCase().includes(this.selectedWarehouse.toLowerCase());

      const matchType = !this.selectedType ||
        item.type.toLowerCase().includes(this.selectedType.toLowerCase());

      return matchQuery && matchWarehouse && matchType;
    });
  }

  formatType(type: string): string {
    switch (type) {
      case 'IMPORT_RECEIPT': return 'Nhập kho';
      case 'SALES_DISPATCH': return 'Xuất kho';
      case 'TRANSFER_IN': return 'Chuyển kho đến';
      case 'TRANSFER_OUT': return 'Chuyển kho đi';
      case 'AUDIT_INCREASE': return 'Điều chỉnh tăng';
      case 'AUDIT_DECREASE': return 'Điều chỉnh giảm';
      case 'RETURN_RECEIPT': return 'Hoàn hàng';
      case 'DISPOSAL_DISPATCH': return 'Xuất hủy';
      default: return type || 'Biến động khác';
    }
  }

  formatDate(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  exportExcel() {
    if (this.data.length === 0) {
      alert('Không có dữ liệu để xuất Excel');
      return;
    }

    const headers = ['Mã biến động', 'Thời gian', 'Mã SKU', 'Tên sản phẩm', 'Biến thể', 'Kho/Showroom', 'Loại biến động', 'Thay đổi', 'Tồn sau', 'Chứng từ', 'Người thực hiện'];
    const rows = this.data.map(item => [
      `"${item.id}"`,
      `"${item.date}"`,
      `"${item.sku}"`,
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.variant.replace(/"/g, '""')}"`,
      `"${item.location.replace(/"/g, '""')}"`,
      `"${item.type}"`,
      `"${item.quantity}"`,
      item.stockAfter,
      `"${item.reference}"`,
      `"${item.creator}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bien_Dong_Kho_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
