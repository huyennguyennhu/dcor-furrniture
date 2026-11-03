import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Search, Filter, Calendar as CalendarIcon, Download, Loader2,
  Building2, Layers, ChevronDown, Check, X, RotateCcw, ChevronRight
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
  orderType: string;
  orderTypeLabel: string;
  orderTypeColor: string;
  orderTypeBg: string;
  orderTypeBorder: string;
  type: string;
  rawType: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  statusBorder: string;
  quantity: string;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  stockImpactType: 'Thực tế' | 'Khả dụng';
  reference: string;
  stockOrderCode?: string;
  stockAuditCode?: string;
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
    Building2, Layers, ChevronDown, Check, X, RotateCcw, ChevronRight
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
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  showViewByDropdown = false;
  showWarehouseDropdown = false;
  showTypeDropdown = false;

  typeOptions: string[] = [
    'Mọi loại đơn',
    'Xuất kho',
    'Nhập kho',
    'Kiểm kê'
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
    this.selectedType = (t === 'Mọi loại đơn' || t === 'Mọi loại biến động') ? '' : t;
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
          const qtyChange = Number(tx.quantityChange) || 0;
          const qtyStr = qtyChange > 0 ? `+${qtyChange}` : `${qtyChange}`;

          let creator = tx.creator || tx.actor?.fullName || tx.actor?.name || tx.creatorName || '';
          if (!creator && tx.stockOrder) {
            creator = tx.stockOrder.creator?.fullName || '';
          }
          if (!creator && tx.warehouse?.managerName) {
            creator = tx.warehouse.managerName;
          }
          if (!creator || creator === '-') {
            creator = 'Admin Quản Trị';
          }

          // 1. Phân loại đơn (Loại đơn XuấtNhập)
          let orderType = tx.orderType || 'EXPORT';
          let orderTypeLabel = tx.orderTypeLabel || '';
          if (!orderTypeLabel) {
            if (tx.stockOrder?.type === 'IMPORT' || tx.type === 'IMPORT_RECEIPT' || tx.type === 'RETURN_RECEIPT') {
              orderType = 'IMPORT';
              orderTypeLabel = 'Nhập kho';
            } else if (tx.stockOrder?.type === 'TRANSFER' || tx.type.includes('TRANSFER')) {
              orderType = 'TRANSFER';
              orderTypeLabel = 'Chuyển kho';
            } else if (tx.stockAudit || tx.type.includes('AUDIT') || (tx.referenceCode || '').startsWith('ADT') || (tx.referenceCode || '').startsWith('PKK')) {
              orderType = 'AUDIT';
              orderTypeLabel = 'Kiểm kê';
            } else {
              orderType = 'EXPORT';
              orderTypeLabel = 'Xuất kho';
            }
          }

          // Styling badge loại đơn
          let orderTypeColor = '#d97706';
          let orderTypeBg = 'rgba(245, 158, 11, 0.1)';
          let orderTypeBorder = '1px solid rgba(245, 158, 11, 0.25)';

          if (orderTypeLabel === 'Nhập kho') {
            orderTypeColor = '#059669';
            orderTypeBg = 'rgba(16, 185, 129, 0.1)';
            orderTypeBorder = '1px solid rgba(16, 185, 129, 0.25)';
          } else if (orderTypeLabel === 'Xuất kho') {
            orderTypeColor = '#ef4444';
            orderTypeBg = 'rgba(239, 68, 68, 0.08)';
            orderTypeBorder = '1px solid rgba(239, 68, 68, 0.22)';
          } else if (orderTypeLabel === 'Kiểm kê') {
            orderTypeColor = '#7c3aed';
            orderTypeBg = 'rgba(124, 58, 237, 0.08)';
            orderTypeBorder = '1px solid rgba(124, 58, 237, 0.22)';
          } else if (orderTypeLabel === 'Chuyển kho') {
            orderTypeColor = '#2563eb';
            orderTypeBg = 'rgba(37, 99, 235, 0.08)';
            orderTypeBorder = '1px solid rgba(37, 99, 235, 0.22)';
          }

          // 2. Trạng thái (chỉ lấy những trạng thái thay đổi tồn kho khả dụng/thực tế)
          let status = tx.status || 'COMPLETED';
          let statusLabel = tx.statusLabel || '';
          let stockImpactType: 'Thực tế' | 'Khả dụng' = tx.stockImpactType || 'Thực tế';

          if (!statusLabel) {
            if (tx.stockOrder) {
              const rawS = String(tx.stockOrder.status || '').toUpperCase();
              if (rawS === 'PROCESSING' || rawS === 'PLANNED') {
                status = 'PLANNED';
                statusLabel = 'Lên kế hoạch';
                stockImpactType = 'Khả dụng';
              } else if (rawS === 'COMPLETED') {
                status = 'COMPLETED';
                statusLabel = orderTypeLabel === 'Nhập kho' ? 'Đã nhập kho' : (orderTypeLabel === 'Chuyển kho' ? 'Đã điều chuyển' : 'Đã xuất kho');
                stockImpactType = 'Thực tế';
              } else {
                status = rawS;
                statusLabel = orderTypeLabel === 'Nhập kho' ? 'Đã nhập kho' : 'Đã xuất kho';
                stockImpactType = 'Thực tế';
              }
            } else if (tx.stockAudit) {
              const rawA = String(tx.stockAudit.status || '').toUpperCase();
              if (rawA === 'COMPLETED') {
                status = 'COMPLETED';
                statusLabel = 'Đã cân bằng';
                stockImpactType = 'Thực tế';
              } else {
                status = rawA;
                statusLabel = 'Đang kiểm kê';
                stockImpactType = 'Thực tế';
              }
            } else {
              if (tx.type === 'IMPORT_RECEIPT') {
                statusLabel = 'Đã nhập kho';
                stockImpactType = 'Thực tế';
              } else if (tx.type === 'SALES_DISPATCH' || tx.type === 'DISPOSAL_DISPATCH') {
                statusLabel = 'Đã xuất kho';
                stockImpactType = 'Thực tế';
              } else if (tx.type.includes('AUDIT')) {
                statusLabel = 'Đã cân bằng';
                stockImpactType = 'Thực tế';
              } else {
                statusLabel = 'Hoàn tất';
                stockImpactType = 'Thực tế';
              }
            }
          }

          // Styling badge trạng thái
          let statusColor = '#059669';
          let statusBg = 'rgba(16, 185, 129, 0.1)';
          let statusBorder = '1px solid rgba(16, 185, 129, 0.25)';

          if (statusLabel === 'Đã xuất kho') {
            statusColor = '#dc2626';
            statusBg = 'rgba(239, 68, 68, 0.08)';
            statusBorder = '1px solid rgba(239, 68, 68, 0.22)';
          } else if (statusLabel === 'Đã cân bằng') {
            statusColor = '#7c3aed';
            statusBg = 'rgba(124, 58, 237, 0.08)';
            statusBorder = '1px solid rgba(124, 58, 237, 0.22)';
          } else if (statusLabel === 'Lên kế hoạch') {
            statusColor = '#d97706';
            statusBg = 'rgba(245, 158, 11, 0.08)';
            statusBorder = '1px solid rgba(245, 158, 11, 0.22)';
          } else if (statusLabel === 'Đã điều chuyển') {
            statusColor = '#2563eb';
            statusBg = 'rgba(37, 99, 235, 0.08)';
            statusBorder = '1px solid rgba(37, 99, 235, 0.22)';
          }

          return {
            id: tx.txCode || tx.id,
            txCode: tx.txCode || tx.id,
            date: dateStr,
            sku: tx.variant?.sku || 'SKU-N/A',
            productName: tx.variant?.product?.name || tx.variant?.name || 'Sản phẩm',
            variant: tx.variant?.name || 'Tiêu chuẩn',
            location: tx.warehouse?.name || tx.location || 'Kho Tổng (TP.HCM)',
            orderType,
            orderTypeLabel,
            orderTypeColor,
            orderTypeBg,
            orderTypeBorder,
            status,
            statusLabel,
            statusColor,
            statusBg,
            statusBorder,
            type: typeStr,
            rawType: tx.type,
            quantity: qtyStr,
            quantityChange: qtyChange,
            stockBefore: tx.stockBefore ?? 0,
            stockAfter: tx.stockAfter ?? 0,
            stockImpactType,
            reference: tx.referenceCode || tx.stockOrder?.referenceCode || tx.stockOrder?.orderCode || tx.stockAudit?.auditCode || '-',
            stockOrderCode: tx.stockOrder?.orderCode || '',
            stockAuditCode: tx.stockAudit?.auditCode || '',
            creator: creator,
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
        item.location.toLowerCase().includes(q) ||
        item.orderTypeLabel.toLowerCase().includes(q) ||
        item.statusLabel.toLowerCase().includes(q) ||
        item.creator.toLowerCase().includes(q);

      const matchWarehouse = !this.selectedWarehouse ||
        item.location.toLowerCase().includes(this.selectedWarehouse.toLowerCase());

      const matchType = !this.selectedType ||
        item.orderTypeLabel.toLowerCase() === this.selectedType.toLowerCase() ||
        item.type.toLowerCase().includes(this.selectedType.toLowerCase());

      return matchQuery && matchWarehouse && matchType;
    });
    this.applyLocalSort();
  }

  toggleColumnSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.filterData();
    this.cdr.markForCheck();
  }

  applyLocalSort(): void {
    if (!this.sortColumn || !this.data || this.data.length === 0) return;
    this.data.sort((a, b) => {
      let diff = 0;
      if (this.sortColumn === 'code') {
        diff = (a.id || '').localeCompare(b.id || '', 'vi');
      } else if (this.sortColumn === 'date') {
        diff = (a.date || '').localeCompare(b.date || '', 'vi');
      } else if (this.sortColumn === 'product') {
        const nameA = this.viewBy === 'variant' ? `${a.productName} - ${a.variant}` : a.productName;
        const nameB = this.viewBy === 'variant' ? `${b.productName} - ${b.variant}` : b.productName;
        diff = nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
      } else if (this.sortColumn === 'location') {
        diff = (a.location || '').localeCompare(b.location || '', 'vi');
      } else if (this.sortColumn === 'orderType') {
        diff = (a.orderTypeLabel || '').localeCompare(b.orderTypeLabel || '', 'vi');
      } else if (this.sortColumn === 'status') {
        diff = (a.statusLabel || a.status || '').localeCompare(b.statusLabel || b.status || '', 'vi');
      } else if (this.sortColumn === 'quantity') {
        diff = (a.quantityChange || 0) - (b.quantityChange || 0);
      } else if (this.sortColumn === 'reference') {
        diff = (a.reference || '').localeCompare(b.reference || '', 'vi');
      } else if (this.sortColumn === 'creator') {
        diff = (a.creator || '').localeCompare(b.creator || '', 'vi');
      }
      return this.sortDirection === 'asc' ? diff : -diff;
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

    const headers = ['Mã biến động', 'Thời gian', 'Mã SKU', 'Tên sản phẩm', 'Biến thể', 'Kho', 'Loại đơn', 'Trạng thái', 'Tồn trước', 'Thay đổi', 'Tồn sau', 'Tác động tồn kho', 'Tham chiếu', 'Người thực hiện'];
    const rows = this.data.map(item => [
      `"${item.id}"`,
      `"${item.date}"`,
      `"${item.sku}"`,
      `"${item.productName.replace(/"/g, '""')}"`,
      `"${item.variant.replace(/"/g, '""')}"`,
      `"${item.location.replace(/"/g, '""')}"`,
      `"${item.orderTypeLabel}"`,
      `"${item.statusLabel}"`,
      item.stockBefore,
      `"${item.quantity}"`,
      item.stockAfter,
      `"${item.stockImpactType}"`,
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

  getInitials(name: string): string {
    if (!name || name === '-') return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  navigateToDocument(item: HistoryItem, event: Event) {
    event.stopPropagation();

    // 1. Xác định mã chứng từ chính xác để điền vào ô tìm kiếm
    let docCode = '';
    if (item.reference && item.reference !== '-') {
      docCode = item.reference;
    } else if (item.stockOrderCode) {
      docCode = item.stockOrderCode;
    } else if (item.stockAuditCode) {
      docCode = item.stockAuditCode;
    }

    // 2. Nếu là đơn Kiểm kê: đi sang trang Kiểm kê kho (/admin/inventory/audit)
    if (
      item.orderType === 'AUDIT' || 
      item.orderTypeLabel === 'Kiểm kê' || 
      (docCode && (docCode.startsWith('ADT') || docCode.startsWith('PKK')))
    ) {
      this.router.navigate(['/admin/inventory/audit'], {
        queryParams: docCode ? { search: docCode } : {}
      });
      return;
    }

    // 3. Nếu là đơn Xuất kho hoặc Nhập kho: đi sang trang Lệnh xuất - nhập kho (/admin/inventory/transactions)
    this.router.navigate(['/admin/inventory/transactions'], {
      queryParams: docCode ? { search: docCode } : {}
    });
  }
}
