import { IconComponent } from '../../../../../shared/components/icon/icon';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2, Loader2 
} from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';

export interface AuditItemRow {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variant: string;
  systemStock: number | '';
  actualStock: number | '';
  reason?: string;
}

@Component({
  selector: 'app-inventory-audit',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-audit.html',
  styleUrls: ['./inventory-audit.css']
})
export class InventoryAuditComponent implements OnInit {
  icons = { ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2, Loader2 };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  data: any[] = [];
  rawAudits: any[] = [];
  warehouses: any[] = [];
  products: any[] = [];
  allVariants: { id: string; sku: string; name: string; productName: string; stock: number }[] = [];

  isLoading = true;
  isSubmitting = false;
  selectedIds = new Set<string>();
  
  // Filters
  searchQuery = '';
  selectedWarehouseFilter = '';
  selectedStatusFilter = '';

  // Modal
  showModal: boolean | any = false;
  modalWarehouseId = '';
  modalLocation = 'Kho Tổng (TP.HCM)';
  modalNotes = '';
  activeActionMenu: string | null = null;

  auditItems: AuditItemRow[] = [
    { id: '1', variantId: '', sku: '', productName: '', variant: '', systemStock: '' as number | '', actualStock: '' as number | '', reason: '' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchWarehouses();
    this.fetchProducts();
    this.fetchAudits();
  }

  fetchWarehouses() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (res) => {
        this.warehouses = res || [];
        if (this.warehouses.length > 0 && !this.modalWarehouseId) {
          this.modalWarehouseId = this.warehouses[0].id;
          this.modalLocation = this.warehouses[0].name;
        }
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching warehouses:', err)
    });
  }

  fetchProducts() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/products-options`).subscribe({
      next: (res) => {
        this.products = res || [];
        const flatList: { id: string; sku: string; name: string; productName: string; stock: number }[] = [];
        this.products.forEach(p => {
          (p.variants || []).forEach((v: any) => {
            flatList.push({
              id: v.id,
              sku: v.sku || 'SKU-N/A',
              name: v.name || 'Tiêu chuẩn',
              productName: p.name,
              stock: v.stock || 0
            });
          });
        });
        this.allVariants = flatList;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error fetching products with options:', err)
    });
  }

  fetchAudits() {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/audits`).subscribe({
      next: (res) => {
        const raw = res || [];
        this.rawAudits = raw.map((a: any) => {
          let statusText = 'Chờ kiểm';
          if (a.status === 'COMPLETED') statusText = 'Hoàn tất';
          else if (a.status === 'IN_PROGRESS') statusText = 'Đang kiểm';
          else if (a.status === 'CANCELLED') statusText = 'Đã hủy';

          return {
            id: a.auditCode || a.id,
            rawId: a.id,
            date: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : '',
            location: a.warehouse?.name || a.location || 'Kho Tổng (TP.HCM)',
            creator: a.creator?.fullName || '-',
            totalItems: a.totalItemsCount || (a.items ? a.items.length : 0),
            discrepancyItems: a.discrepancyCount || 0,
            status: statusText,
            rawStatus: a.status,
            notes: a.notes,
            items: a.items || []
          };
        });
        this.filterData();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching stock audits:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filterData() {
    const q = (this.searchQuery || '').trim().toLowerCase();
    this.data = this.rawAudits.filter(item => {
      const matchQuery = !q || 
        item.id.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.creator.toLowerCase().includes(q);
      
      const matchWarehouse = !this.selectedWarehouseFilter || 
        item.location.toLowerCase().includes(this.selectedWarehouseFilter.toLowerCase());

      const matchStatus = !this.selectedStatusFilter || 
        item.status === this.selectedStatusFilter;

      return matchQuery && matchWarehouse && matchStatus;
    });
  }

  onWarehouseChange(whId: string) {
    this.modalWarehouseId = whId;
    const found = this.warehouses.find(w => w.id === whId);
    if (found) {
      this.modalLocation = found.name;
    }
  }

  get canAddNewLine() {
    return this.auditItems.every(item => item.sku !== '' && item.actualStock !== '');
  }

  openModal(item?: any) {
    if (!item) {
      this.showModal = true;
      if (this.warehouses.length > 0) {
        this.modalWarehouseId = this.warehouses[0].id;
        this.modalLocation = this.warehouses[0].name;
      }
      this.modalNotes = '';
      this.auditItems = [{ id: Date.now().toString(), variantId: '', sku: '', productName: '', variant: '', systemStock: '', actualStock: '', reason: '' }];
    } else {
      this.showModal = item;
    }
  }

  closeModal() {
    this.showModal = false;
  }

  handleAddRow() {
    if (this.canAddNewLine) {
      this.auditItems.push({ 
        id: Date.now().toString() + Math.random(), 
        variantId: '',
        sku: '', 
        productName: '', 
        variant: '', 
        systemStock: '', 
        actualStock: '',
        reason: '' 
      });
    }
  }

  handleRemoveRow(id: string) {
    if (this.auditItems.length > 1) {
      this.auditItems = this.auditItems.filter(item => item.id !== id);
    }
  }

  handleUpdateRow(id: string, field: keyof AuditItemRow, value: any) {
    this.auditItems = this.auditItems.map(item => {
      if (item.id === id) {
        if (field === 'sku') {
          const found = this.allVariants.find(p => p.sku === value);
          if (found) {
            return { 
              ...item, 
              variantId: found.id,
              sku: found.sku, 
              productName: found.productName, 
              variant: found.name, 
              systemStock: found.stock 
            };
          }
        }
        if (field === 'productName') {
          const variantsOfProduct = this.allVariants.filter(p => p.productName === value);
          if (variantsOfProduct.length === 1) {
            const p = variantsOfProduct[0];
            return { 
              ...item, 
              variantId: p.id,
              sku: p.sku, 
              productName: p.productName, 
              variant: p.name, 
              systemStock: p.stock 
            };
          }
          return { ...item, productName: value, sku: '', variantId: '', variant: '', systemStock: '' };
        }
        if (field === 'variant') {
          const found = this.allVariants.find(p => p.sku === value || p.id === value);
          if (found) {
            return { 
              ...item, 
              variantId: found.id,
              sku: found.sku, 
              productName: found.productName, 
              variant: found.name, 
              systemStock: found.stock 
            };
          }
        }
        if (field === 'actualStock') {
          let rawValue = String(value).replace(/[^0-9]/g, '');
          return { ...item, actualStock: rawValue ? parseInt(rawValue, 10) : '' };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
  }

  handleSubmitAudit() {
    const validItems = this.auditItems.filter(it => it.variantId && it.actualStock !== '');
    if (validItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm và nhập số lượng tồn thực tế!');
      return;
    }

    this.isSubmitting = true;
    const payload = {
      warehouseId: this.modalWarehouseId || null,
      location: this.modalLocation,
      notes: this.modalNotes || null,
      status: 'COMPLETED',
      items: validItems.map(it => ({
        variantId: it.variantId,
        systemStock: Number(it.systemStock) || 0,
        actualStock: Number(it.actualStock) || 0,
        reason: it.reason || ''
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/admin/inventory/audits`, payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        alert(`Tạo phiếu kiểm kê ${res.auditCode} và cân bằng tồn kho thành công!`);
        this.closeModal();
        this.fetchAudits();
      },
      error: (err) => {
        console.error('Error creating audit:', err);
        this.isSubmitting = false;
        alert('Có lỗi xảy ra khi lưu phiếu kiểm kê. Vui lòng thử lại!');
      }
    });
  }

  toggleSelection(id: string, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.selectedIds.size === this.data.length && this.data.length > 0) {
      this.selectedIds.clear();
    } else {
      this.data.forEach(p => this.selectedIds.add(p.id));
    }
  }

  isAllSelected() {
    return this.data.length > 0 && this.selectedIds.size === this.data.length;
  }

  getUniqueProductNames() {
    return Array.from(new Set(this.allVariants.map(p => p.productName)));
  }

  getVariantsForProduct(productName: string) {
    return this.allVariants.filter(p => !productName || p.productName === productName);
  }

  alert(message: string) {
    window.alert(message);
  }
}
