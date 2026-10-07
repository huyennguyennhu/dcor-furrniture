import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  ArrowLeft, Package, Clock, Filter, Search, Plus, ArrowRightLeft, RefreshCcw, X 
} from 'lucide-angular';
import { TransactionModalComponent } from '../../../components/transaction-modal/transaction-modal';

interface VariantStock {
  id: string;
  name: string;
  physical: number;
  reserved: number;
  available: number;
}

interface StockHistory {
  id: string;
  date: string;
  type: 'IMPORT' | 'EXPORT' | 'TRANSFER';
  variantName: string;
  quantity: number;
  reason: string;
  user: string;
}

@Component({
  selector: 'app-inventory-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px;">
      
      <!-- HEADER & BREADCRUMB -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <button 
            (click)="goBack()"
            style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 0; width: fit-content;"
          >
            <lucide-angular [img]="icons.ArrowLeft" size="18"></lucide-angular>
            <span style="font-size: 14px; font-weight: 500;">Quay lại danh sách Tồn kho</span>
          </button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; gap: 16px; align-items: center;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden;">
              <lucide-angular *ngIf="!product?.images?.length" [img]="icons.Package" size="32" color="var(--text-muted)"></lucide-angular>
              <img *ngIf="product?.images?.length" [src]="product.images[0]" [alt]="product.name" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
            <div>
              <h1 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">
                {{ product?.name }}
              </h1>
              <div style="display: flex; gap: 12px; font-size: 14px; color: var(--text-muted);">
                <span>Mã SKU: <strong style="color: var(--text-primary);">{{ product?.slug?.substring(0, 8) | uppercase }}</strong></span>
                <span>•</span>
                <span>Danh mục: <strong style="color: var(--text-primary);">{{ product?.category || 'N/A' }}</strong></span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="admin-btn admin-btn-secondary" (click)="openModal('export', '')">
              <lucide-angular [img]="icons.ArrowRightLeft" size="16"></lucide-angular> Chuyển kho / Xuất
            </button>
            <button class="admin-btn admin-btn-primary" (click)="openModal('import', '')">
              <lucide-angular [img]="icons.Plus" size="16"></lucide-angular> Nhập kho
            </button>
          </div>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
          <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">Tổng Tồn thực tế</span>
          <span style="font-size: 28px; font-weight: 700; color: var(--text-primary);">{{ getTotalPhysical() }}</span>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
          <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">Đang giữ chỗ</span>
          <span style="font-size: 28px; font-weight: 700; color: #f59e0b;">{{ getTotalReserved() }}</span>
        </div>
        <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
          <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">Có thể bán</span>
          <span style="font-size: 28px; font-weight: 700; color: #10b981;">{{ getTotalAvailable() }}</span>
        </div>
      </div>

      <!-- TABS CONTENT -->
      <div style="background: white; border-radius: 12px; border: 1px solid var(--border-color); overflow: hidden;">
        <!-- TABS -->
        <div style="display: flex; border-bottom: 1px solid var(--border-color);">
          <button 
            (click)="activeTab = 'variants'"
            [ngStyle]="{
              'padding': '16px 24px', 'border': 'none', 'background': 'none', 'cursor': 'pointer',
              'font-size': '15px', 'font-weight': 600, 'display': 'flex', 'align-items': 'center', 'gap': '8px',
              'border-bottom': activeTab === 'variants' ? '2px solid var(--accent)' : '2px solid transparent',
              'color': activeTab === 'variants' ? 'var(--accent)' : 'var(--text-muted)'
            }"
          >
            <lucide-angular [img]="icons.Package" size="18"></lucide-angular> Chi tiết từng biến thể
          </button>
          <button 
            (click)="activeTab = 'history'"
            [ngStyle]="{
              'padding': '16px 24px', 'border': 'none', 'background': 'none', 'cursor': 'pointer',
              'font-size': '15px', 'font-weight': 600, 'display': 'flex', 'align-items': 'center', 'gap': '8px',
              'border-bottom': activeTab === 'history' ? '2px solid var(--accent)' : '2px solid transparent',
              'color': activeTab === 'history' ? 'var(--accent)' : 'var(--text-muted)'
            }"
          >
            <lucide-angular [img]="icons.Clock" size="18"></lucide-angular> Lịch sử biến động
          </button>
        </div>

        <!-- TAB CONTENTS -->
        <div style="padding: 20px;">
          
          <div *ngIf="activeTab === 'variants'" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="position: relative; width: 300px;">
                <input type="text" placeholder="Tìm biến thể..." class="admin-input" style="width: 100%; padding: 10px 12px 10px 40px; border-radius: 8px; border: 1px solid var(--border-color);" />
                <lucide-angular [img]="icons.Search" size="18" color="var(--text-muted)" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%);"></lucide-angular>
              </div>
            </div>
            
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Biến thể (Màu sắc / Chất liệu)</th>
                  <th style="text-align: center;">Tồn thực tế</th>
                  <th style="text-align: center;">Đang giữ chỗ</th>
                  <th style="text-align: center;">Có thể bán</th>
                  <th style="text-align: center;">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of variants">
                  <td>{{ item.name }}</td>
                  <td style="text-align: center; font-weight: 600;">{{ item.physical }}</td>
                  <td style="text-align: center; font-weight: 600; color: #f59e0b;">{{ item.reserved }}</td>
                  <td style="text-align: center; font-weight: 600; color: #10b981;">{{ item.available }}</td>
                  <td style="text-align: center;">
                    <div style="display: inline-flex; gap: 8px;">
                      <button (click)="openModal('import', item.name)" class="admin-btn admin-btn-secondary" style="padding: 4px 8px; font-size: 12px;">
                        <lucide-angular [img]="icons.Plus" size="14"></lucide-angular> Nhập
                      </button>
                      <button (click)="openModal('export', item.name)" class="admin-btn admin-btn-secondary" style="padding: 4px 8px; font-size: 12px;">
                        <lucide-angular [img]="icons.ArrowRightLeft" size="14"></lucide-angular> Xuất
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="activeTab === 'history'" style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; gap: 12px; align-items: center;">
                <span style="font-size: 14px; font-weight: 500; color: var(--text-secondary);">Lọc theo biến thể:</span>
                <select class="admin-select" style="width: 200px;" [(ngModel)]="historyFilterVariant">
                  <option value="Tất cả">Tất cả biến thể</option>
                  <option *ngFor="let name of getUniqueVariantNames()" [value]="name">{{ name }}</option>
                </select>
              </div>
              <button class="admin-btn admin-btn-secondary" style="padding: 8px 16px;">
                <lucide-angular [img]="icons.Filter" size="16"></lucide-angular> Lọc thời gian
              </button>
            </div>

            <table class="admin-table">
              <thead>
                <tr>
                  <th style="width: 15%;">Thời gian</th>
                  <th style="width: 15%;">Loại</th>
                  <th style="width: 25%;">Biến thể</th>
                  <th style="text-align: center; width: 10%;">Số lượng</th>
                  <th>Lý do / Ghi chú</th>
                  <th style="width: 15%;">Người thực hiện</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of getFilteredHistory()">
                  <td>{{ item.date }}</td>
                  <td>
                    <span *ngIf="item.type === 'IMPORT'" style="display: inline-flex; align-items: center; gap: 4px; color: #16a34a; background: #dcfce7; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                      <lucide-angular [img]="icons.Plus" size="14"></lucide-angular> Nhập kho
                    </span>
                    <span *ngIf="item.type === 'EXPORT'" style="display: inline-flex; align-items: center; gap: 4px; color: #dc2626; background: #fee2e2; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                      <lucide-angular [img]="icons.ArrowRightLeft" size="14"></lucide-angular> Xuất kho
                    </span>
                    <span *ngIf="item.type === 'TRANSFER'" style="display: inline-flex; align-items: center; gap: 4px; color: #ea580c; background: #ffedd5; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                      <lucide-angular [img]="icons.RefreshCcw" size="14"></lucide-angular> Chuyển kho
                    </span>
                  </td>
                  <td>{{ item.variantName }}</td>
                  <td style="text-align: center;">
                    <span [ngStyle]="{
                      'font-weight': 600,
                      'color': item.type === 'IMPORT' ? '#166534' : (item.type === 'EXPORT' ? '#991b1b' : '#3730a3')
                    }">
                      {{ item.type === 'IMPORT' ? '+' : (item.type === 'EXPORT' ? '-' : '') }}{{ item.quantity }}
                    </span>
                  </td>
                  <td>{{ item.reason }}</td>
                  <td>{{ item.user }}</td>
                </tr>
                <tr *ngIf="getFilteredHistory().length === 0">
                  <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">Không có lịch sử biến động nào</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- Modal Mocking for TransactionModal -->
      <app-transaction-modal
        [isOpen]="modalConfig.isOpen"
        [type]="modalConfig.type"
        [products]="[product]"
        [initialProductId]="product?.id"
        [initialVariantId]="modalConfig.initialVariantId"
        [isProductFixed]="true"
        [isVariantFixed]="false"
        (onClose)="closeModal()"
        (onSubmit)="submitModal($event)"
      ></app-transaction-modal>
    </div>
  `
})
export class InventoryProductDetailComponent implements OnInit {
  icons = { ArrowLeft, Package, Clock, Filter, Search, Plus, ArrowRightLeft, RefreshCcw, X };

  product: any = null;
  variants: VariantStock[] = [];
  history: StockHistory[] = [];
  
  activeTab: 'variants' | 'history' = 'variants';
  historyFilterVariant = 'Tất cả';
  isLoading = true;

  modalConfig = {
    isOpen: false,
    type: 'import' as 'import' | 'export',
    initialVariantId: ''
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadData(id);
      }
    });
    
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab === 'history') {
        this.activeTab = 'history';
      }
      const variant = params.get('variant');
      if (variant) {
        this.historyFilterVariant = variant;
      }
    });
  }

  loadData(productId: string) {
    // Mock data
    this.product = {
      id: productId,
      name: 'Sản phẩm ' + productId,
      slug: productId,
      category: 'Nội thất',
      images: []
    };

    this.variants = [
      { id: 'v1', name: 'Màu Trắng, Gỗ sồi', physical: 12, reserved: 2, available: 10 },
      { id: 'v2', name: 'Màu Đen, Khung thép', physical: 5, reserved: 0, available: 5 },
      { id: 'v3', name: 'Màu Xám, Bọc da', physical: 0, reserved: 0, available: 0 },
      { id: 'v4', name: 'Màu Xanh, Khung thép', physical: 8, reserved: 4, available: 4 },
    ];

    this.history = [
      { id: 'h1', date: '2026-08-20 14:30', type: 'IMPORT', variantName: 'Màu Trắng, Gỗ sồi', quantity: 15, reason: 'Nhập hàng đợt 1 tháng 8', user: 'Admin' },
      { id: 'h2', date: '2026-08-22 09:15', type: 'EXPORT', variantName: 'Màu Trắng, Gỗ sồi', quantity: 3, reason: 'Xuất bán khách lẻ', user: 'Staff_HCM' },
      { id: 'h3', date: '2026-08-23 11:00', type: 'TRANSFER', variantName: 'Màu Đen, Khung thép', quantity: 2, reason: 'Chuyển sang Kho HN', user: 'Admin' },
      { id: 'h4', date: '2026-08-24 16:45', type: 'EXPORT', variantName: 'Màu Xanh, Khung thép', quantity: 4, reason: 'Giữ chỗ đơn hàng #1024', user: 'System' },
    ];
    
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/admin/inventory']);
  }

  getTotalPhysical() {
    return this.variants.reduce((sum, v) => sum + v.physical, 0);
  }

  getTotalReserved() {
    return this.variants.reduce((sum, v) => sum + v.reserved, 0);
  }

  getTotalAvailable() {
    return this.variants.reduce((sum, v) => sum + v.available, 0);
  }

  getUniqueVariantNames() {
    return Array.from(new Set(this.variants.map(v => v.name)));
  }

  getFilteredHistory() {
    if (this.historyFilterVariant === 'Tất cả') {
      return this.history;
    }
    return this.history.filter(h => h.variantName === this.historyFilterVariant);
  }

  openModal(type: 'import' | 'export', variantId: string) {
    this.modalConfig = {
      isOpen: true,
      type,
      initialVariantId: variantId
    };
  }

  closeModal() {
    this.modalConfig.isOpen = false;
  }

  submitModal(data: any) {
    console.log('Transaction Data:', data);
    window.alert('Giao dịch đã được lưu thành công!');
    this.closeModal();
  }
}
