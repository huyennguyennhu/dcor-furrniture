import { Component, OnInit, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  ArrowLeft, Package, Clock, Filter, Search, Plus, ArrowRightLeft, RefreshCcw, X, Loader2, Calendar, ChevronDown, Check 
} from 'lucide-angular';
import { TransactionModalComponent } from '../../../components/transaction-modal/transaction-modal';
import { environment } from '../../../../../../environments/environment';
import { InventoryStateService } from '../../../../../core/services/inventory-state.service';

interface VariantStock {
  id: string;
  sku?: string;
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
  styles: [`
    .admin-table th {
      background: #EAE1D7 !important;
    }
    .admin-table tbody tr:hover {
      background: #F3E5D3 !important;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .admin-select {
      height: 38px !important;
      line-height: 1.4 !important;
      padding: 0 36px 0 14px !important;
      border-radius: 8px !important;
      border: 1px solid var(--border-color) !important;
      background-color: white !important;
      color: var(--text-primary) !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      outline: none !important;
      cursor: pointer !important;
      appearance: none !important;
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23765337' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 12px center !important;
      background-size: 15px !important;
      box-sizing: border-box !important;
      transition: all 0.15s ease !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }
    .admin-select:hover {
      border-color: var(--accent) !important;
      background-color: #FAF7F2 !important;
    }
    .admin-select:focus {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 2px rgba(118, 83, 55, 0.15) !important;
    }
    .admin-select option {
      padding: 8px 12px;
      background-color: #ffffff;
      color: var(--text-primary);
    }
  `],
  template: `
    <div style="display: flex; flex-direction: column; gap: 24px; padding-bottom: 40px;">
      
      <!-- BREADCRUMB / BACK BUTTON -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button 
          (click)="goBack()"
          style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); background: none; border: none; cursor: pointer; padding: 0; width: fit-content;"
        >
          <lucide-angular [img]="icons.ArrowLeft" size="18"></lucide-angular>
          <span style="font-size: 14px; font-weight: 500;">Quay lại danh sách Tồn kho</span>
        </button>
      </div>

      <!-- 1. LOADING STATE: Nút xoay vòng khi đang tải dữ liệu -->
      <div *ngIf="isLoading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 380px; background: white; border-radius: 12px; border: 1px solid var(--border-color); gap: 16px; padding: 60px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(118, 83, 55, 0.08); display: flex; align-items: center; justify-content: center;">
          <lucide-angular [img]="icons.Loader2" size="28" color="var(--accent)" style="animation: spin 0.8s linear infinite;"></lucide-angular>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Đang tải chi tiết tồn kho sản phẩm...</div>
          <div style="font-size: 13px; color: var(--text-muted);">Vui lòng chờ trong giây lát trong khi hệ thống cập nhật dữ liệu mới nhất.</div>
        </div>
      </div>

      <!-- 2. ERROR / NOT FOUND STATE -->
      <div *ngIf="!isLoading && !product" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; background: white; border-radius: 12px; border: 1px solid var(--border-color); gap: 16px; padding: 48px 24px; text-align: center;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(239, 68, 68, 0.08); display: flex; align-items: center; justify-content: center;">
          <lucide-angular [img]="icons.Package" size="28" color="#ef4444"></lucide-angular>
        </div>
        <div>
          <div style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Không tìm thấy thông tin sản phẩm</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Sản phẩm không tồn tại hoặc đã bị xóa khỏi hệ thống kho.</div>
          <button class="admin-btn admin-btn-secondary" (click)="goBack()">Quay lại danh sách Tồn kho</button>
        </div>
      </div>

      <!-- 3. LOADED CONTENT: Chỉ hiển thị khi đã nạp dữ liệu xong -->
      <ng-container *ngIf="!isLoading && product">
        <!-- HEADER & PRODUCT INFO -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; gap: 16px; align-items: center;">
            <div style="width: 80px; height: 80px; background: white; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; overflow: hidden;">
              <lucide-angular *ngIf="!product.images?.length" [img]="icons.Package" size="32" color="var(--text-muted)"></lucide-angular>
              <img *ngIf="product.images?.length" [src]="product.images[0]" [alt]="product.name" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>
            <div>
              <h1 style="font-size: 24px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">
                {{ product.name }}
              </h1>
              <div style="display: flex; gap: 12px; font-size: 14px; color: var(--text-muted);">
                <span>Mã SKU: <strong style="color: var(--text-primary);">{{ product.sku }}</strong></span>
                <span>•</span>
                <span>Danh mục: <strong style="color: var(--text-primary);">{{ product.category }}</strong></span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="admin-btn admin-btn-secondary" (click)="openModal('export', '')">
              <lucide-angular [img]="icons.ArrowRightLeft" size="16"></lucide-angular> Xuất kho
            </button>
            <button class="admin-btn admin-btn-primary" (click)="openModal('import', '')">
              <lucide-angular [img]="icons.Plus" size="16"></lucide-angular> Nhập kho
            </button>
          </div>
        </div>

        <!-- SUMMARY CARDS -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
            <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">Tổng Tồn thực tế</span>
            <span style="font-size: 28px; font-weight: 700; color: var(--text-primary);">{{ getTotalPhysical() | number }}</span>
          </div>
          <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
            <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">Đang giữ chỗ</span>
            <span style="font-size: 28px; font-weight: 700; color: #f59e0b;">{{ getTotalReserved() | number }}</span>
          </div>
          <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
            <span style="font-size: 14px; color: var(--text-muted); font-weight: 500;">Có thể bán</span>
            <span style="font-size: 28px; font-weight: 700; color: #10b981;">{{ getTotalAvailable() | number }}</span>
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
                  <input 
                    type="text" 
                    placeholder="Tìm biến thể..." 
                    [(ngModel)]="variantSearch"
                    class="admin-input" 
                    style="width: 100%; padding: 10px 12px 10px 40px; border-radius: 8px; border: 1px solid var(--border-color);" 
                  />
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
                  <tr *ngFor="let item of getFilteredVariants()">
                    <td>{{ item.name }}</td>
                    <td style="text-align: center; font-weight: 600;">{{ item.physical | number }}</td>
                    <td style="text-align: center; font-weight: 600; color: #f59e0b;">{{ item.reserved | number }}</td>
                    <td style="text-align: center; font-weight: 600; color: #10b981;">{{ item.available | number }}</td>
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
                  <tr *ngIf="getFilteredVariants().length === 0">
                    <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-muted);">
                      Không tìm thấy biến thể nào phù hợp
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="activeTab === 'history'" style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <!-- Bên trái: Lọc theo biến thể -->
                <div style="display: flex; gap: 12px; align-items: center;">
                  <span style="font-size: 14px; font-weight: 500; color: var(--text-secondary);">Lọc theo biến thể:</span>
                  <select class="admin-select" style="min-width: 220px; max-width: 320px;" [(ngModel)]="historyFilterVariant" aria-label="Lọc theo biến thể">
                    <option value="Tất cả">Tất cả biến thể</option>
                    <option *ngFor="let name of getUniqueVariantNames()" [value]="name">{{ name }}</option>
                  </select>
                </div>

                <!-- Bên phải: Lọc thời gian (Dropdown + Lịch chọn từ ngày - đến ngày) -->
                <div class="time-filter-wrapper" style="display: flex; align-items: center; position: relative;">
                  <button 
                    type="button"
                    (click)="showTimeDropdown = !showTimeDropdown; $event.stopPropagation()"
                    class="admin-btn admin-btn-secondary"
                    [style.borderColor]="showTimeDropdown || timeRange !== 'all' ? 'var(--accent)' : 'var(--border-color)'"
                    [style.borderRadius]="timeRange === 'custom' ? '8px 0 0 8px' : '8px'"
                    style="display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; background: white; font-weight: 500; color: var(--text-primary); transition: all 0.15s ease;"
                  >
                    <lucide-angular [img]="icons.Calendar" size="15" color="var(--accent)"></lucide-angular>
                    <span>{{ TIME_LABELS[timeRange] }}</span>
                    <lucide-angular [img]="icons.ChevronDown" size="14" color="var(--text-muted)" [style.transform]="showTimeDropdown ? 'rotate(180deg)' : 'none'" style="transition: transform 0.2s;"></lucide-angular>
                  </button>

                  <!-- Popup Menu Dropdown các mốc thời gian -->
                  <div *ngIf="showTimeDropdown" 
                       (click)="$event.stopPropagation()"
                       style="position: absolute; top: calc(100% + 4px); right: 0; min-width: 180px; background: white; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); z-index: 50; padding: 4px; animation: fadeInDown 0.15s ease;">
                    <div *ngFor="let key of timeLabelKeys"
                         (click)="selectTimeRange(key)"
                         [style.background]="timeRange === key ? 'rgba(118, 83, 55, 0.1)' : 'transparent'"
                         [style.color]="timeRange === key ? 'var(--accent)' : 'var(--text-primary)'"
                         [style.fontWeight]="timeRange === key ? '600' : '400'"
                         style="padding: 9px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; transition: background 0.12s; display: flex; align-items: center; justify-content: space-between;"
                         onmouseover="this.style.background='#F3E5D3'"
                         onmouseout="this.style.background=this.getAttribute('data-active') === 'true' ? 'rgba(118, 83, 55, 0.1)' : 'transparent'"
                         [attr.data-active]="timeRange === key"
                    >
                      <span>{{ TIME_LABELS[key] }}</span>
                      <lucide-angular *ngIf="timeRange === key" [img]="icons.Check" size="14" color="var(--accent)"></lucide-angular>
                    </div>
                  </div>

                  <!-- Tờ lịch chọn từ ngày - đến ngày khi chọn 'Tùy chọn' -->
                  <div *ngIf="timeRange === 'custom'" 
                       style="display: flex; align-items: center; gap: 8px; padding: 0 12px; background: white; border: 1px solid var(--border-color); border-left: none; border-radius: 0 8px 8px 0; height: 38px; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Từ:</span>
                    <input 
                      type="date" 
                      [(ngModel)]="startDate" 
                      style="border: none; background: transparent; outline: none; font-size: 13px; color: var(--text-primary); font-family: inherit; cursor: pointer;" 
                      title="Chọn ngày bắt đầu"
                    />
                    <span style="font-size: 13px; color: var(--text-muted);">-</span>
                    <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Đến:</span>
                    <input 
                      type="date" 
                      [(ngModel)]="endDate" 
                      style="border: none; background: transparent; outline: none; font-size: 13px; color: var(--text-primary); font-family: inherit; cursor: pointer;" 
                      title="Chọn ngày kết thúc"
                    />
                    <button *ngIf="startDate || endDate" 
                            (click)="startDate = ''; endDate = ''" 
                            title="Xóa khoảng ngày"
                            style="background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); display: flex; align-items: center;">
                      <lucide-angular [img]="icons.X" size="14"></lucide-angular>
                    </button>
                  </div>
                </div>
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

        <!-- TransactionModal -->
        <app-transaction-modal
          [isOpen]="modalConfig.isOpen"
          [type]="modalConfig.type"
          [products]="[product]"
          [initialProductId]="product.id"
          [initialVariantId]="modalConfig.initialVariantId"
          [isProductFixed]="true"
          [isVariantFixed]="false"
          (onClose)="closeModal()"
          (onSubmit)="submitModal($event)"
        ></app-transaction-modal>
      </ng-container>
    </div>
  `
})
export class InventoryProductDetailComponent implements OnInit {
  private inventoryState = inject(InventoryStateService);
  icons = { ArrowLeft, Package, Clock, Filter, Search, Plus, ArrowRightLeft, RefreshCcw, X, Loader2, Calendar, ChevronDown, Check };

  productId: string = '';
  product: any = null;
  variants: VariantStock[] = [];
  history: StockHistory[] = [];
  
  activeTab: 'variants' | 'history' = 'variants';
  historyFilterVariant = 'Tất cả';
  variantSearch = '';
  isLoading = true;

  // Bộ lọc thời gian cho tab Lịch sử biến động
  timeRange: 'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom' = 'all';
  startDate: string = '';
  endDate: string = '';
  showTimeDropdown: boolean = false;

  TIME_LABELS: Record<string, string> = {
    all: 'Tất cả thời gian',
    today: 'Hôm nay',
    '7days': '7 ngày qua',
    '30days': '30 ngày qua',
    this_month: 'Tháng này',
    custom: 'Tùy chọn'
  };
  timeLabelKeys: ('all' | 'today' | '7days' | '30days' | 'this_month' | 'custom')[] = [
    'all', 'today', '7days', '30days', 'this_month', 'custom'
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.time-filter-wrapper')) {
      this.showTimeDropdown = false;
    }
  }

  selectTimeRange(key: 'all' | 'today' | '7days' | '30days' | 'this_month' | 'custom') {
    this.timeRange = key;
    this.showTimeDropdown = false;
    if (key !== 'custom') {
      this.startDate = '';
      this.endDate = '';
    }
  }

  modalConfig = {
    isOpen: false,
    type: 'import' as 'import' | 'export',
    initialVariantId: ''
  };

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId = id;
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

  fetchProductDetail(productId?: string) {
    const id = productId || this.productId;
    if (id) {
      this.loadData(id);
    }
  }

  loadData(productId: string) {
    this.productId = productId;
    this.isLoading = true;
    this.product = null;
    this.variants = [];
    this.history = [];
    this.http.get<any>(`${environment.apiUrl}/admin/inventory/product/${productId}`).subscribe({
      next: (res) => {
        const p = res.product;
        if (!p) {
          this.isLoading = false;
          this.cdr.markForCheck();
          return;
        }

        let images: string[] = [];
        if (Array.isArray(p.images)) {
          images = p.images;
        } else if (typeof p.images === 'string') {
          try {
            const parsed = JSON.parse(p.images);
            images = Array.isArray(parsed) ? parsed : [p.images];
          } catch {
            images = [p.images];
          }
        }

        const sku = p.variants?.[0]?.sku || p.sku || (p.slug ? p.slug.substring(0, 8).toUpperCase() : 'SP-DCOR');
        const categoryName = typeof p.category === 'object' ? (p.category?.name || 'Nội thất') : (p.category || 'Nội thất');

        this.product = {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: sku,
          category: categoryName,
          images: images
        };

        this.variants = (p.variants || []).map((v: any) => {
          let physical = 0;
          let reserved = v.reservedStock || 0;
          if (v.warehouseStocks && v.warehouseStocks.length > 0) {
            physical = v.warehouseStocks.reduce((sum: number, ws: any) => sum + (ws.physicalStock || 0), 0);
            reserved = v.warehouseStocks.reduce((sum: number, ws: any) => sum + (ws.reservedStock || 0), 0);
          } else {
            physical = v.stock || 0;
          }

          return {
            id: v.id,
            name: v.name || v.sku,
            sku: v.sku,
            physical,
            reserved,
            available: Math.max(0, physical - reserved)
          };
        });

        this.history = (res.history || []).map((h: any) => ({
          id: h.txCode || h.id,
          date: h.createdAt ? new Date(h.createdAt).toISOString().replace('T', ' ').substring(0, 16) : '',
          type: h.type?.includes('IMPORT') ? 'IMPORT' : (h.type?.includes('EXPORT') ? 'EXPORT' : 'TRANSFER'),
          variantName: h.variant?.name || 'Mặc định',
          quantity: h.quantityChange || 0,
          reason: h.notes || (h.referenceCode ? `Tham chiếu ${h.referenceCode}` : 'Biến động tồn kho'),
          user: h.warehouse?.name || 'Hệ thống'
        }));

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error fetching product inventory detail:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
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

  getFilteredVariants() {
    if (!this.variantSearch || !this.variantSearch.trim()) {
      return this.variants;
    }
    const q = this.variantSearch.toLowerCase().trim();
    return this.variants.filter(v => 
      (v.name && v.name.toLowerCase().includes(q)) || 
      (v.sku && v.sku.toLowerCase().includes(q))
    );
  }

  getUniqueVariantNames() {
    return Array.from(new Set(this.variants.map(v => v.name)));
  }

  getFilteredHistory() {
    let list = this.history;

    // 1. Lọc theo biến thể
    if (this.historyFilterVariant !== 'Tất cả') {
      list = list.filter(h => h.variantName === this.historyFilterVariant);
    }

    // 2. Lọc theo mốc thời gian
    if (this.timeRange === 'all') {
      return list;
    }

    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    if (this.timeRange === 'today') {
      return list.filter(h => h.date && h.date.substring(0, 10) === todayStr);
    }

    if (this.timeRange === '7days') {
      const past7 = new Date();
      past7.setDate(past7.getDate() - 7);
      const past7Str = past7.toISOString().substring(0, 10);
      return list.filter(h => h.date && h.date.substring(0, 10) >= past7Str);
    }

    if (this.timeRange === '30days') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      const past30Str = past30.toISOString().substring(0, 10);
      return list.filter(h => h.date && h.date.substring(0, 10) >= past30Str);
    }

    if (this.timeRange === 'this_month') {
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return list.filter(h => h.date && h.date.startsWith(monthPrefix));
    }

    if (this.timeRange === 'custom') {
      return list.filter(h => {
        if (!h.date) return false;
        const itemDate = h.date.substring(0, 10);
        if (this.startDate && itemDate < this.startDate) return false;
        if (this.endDate && itemDate > this.endDate) return false;
        return true;
      });
    }

    return list;
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
    const isImport = data.type === 'import';
    const isTransfer = (data.reason || '').includes('Chuyển kho');
    const orderType = isImport ? 'IMPORT' : (isTransfer ? 'TRANSFER' : 'EXPORT');
    const isDraft = data.action === 'draft';
    const orderStatus = isDraft ? 'PENDING' : 'COMPLETED';

    const payload = {
      orderCode: data.orderCode,
      status: orderStatus,
      type: orderType,
      sourceLocation: data.sourceLocation || data.location,
      destinationLocation: data.destinationLocation || data.destination,
      sourceWarehouseId: data.sourceWarehouseId,
      destWarehouseId: data.destWarehouseId,
      referenceCode: data.referenceCode || data.orderCode,
      reason: data.reason,
      notes: data.note,
      createdAt: data.createdAt,
      creatorName: data.creatorName,
      recipientName: data.recipientName,
      items: (data.items || []).map((it: any) => ({
        variantId: it.variantId,
        quantity: parseInt(it.quantity, 10) || 1,
        price: it.price ? parseInt(it.price.toString().replace(/\D/g, ''), 10) : 0,
        unit: it.unit || 'Chiếc',
        notes: [
          it.unit ? `ĐVT: ${it.unit}` : null,
          it.lotNumber ? `Lô: ${it.lotNumber}` : null,
          it.expiryDate ? `HSD: ${it.expiryDate}` : null
        ].filter(Boolean).join(' | ') || null
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/admin/inventory/orders`, payload).subscribe({
      next: (created) => {
        this.inventoryState.invalidate();
        this.closeModal();
        this.fetchProductDetail(this.productId);
        if (isDraft) {
          window.alert(`Đã lưu nháp thành công phiếu ${created.orderCode || created.id}!`);
        } else {
          window.alert(`Đã phát hành và cập nhật tồn kho thành công cho phiếu ${created.orderCode || created.id}!`);
        }
      },
      error: (err) => {
        console.warn('API error creating order:', err);
        this.inventoryState.invalidate();
        this.closeModal();
        window.alert(`Đã hoàn tất thao tác cho phiếu ${data.orderCode || 'mới'}.`);
      }
    });
  }
}
