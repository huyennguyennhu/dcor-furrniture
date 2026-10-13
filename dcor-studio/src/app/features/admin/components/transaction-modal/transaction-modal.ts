import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, X, Plus, Trash2, Filter, Search } from 'lucide-angular';
import { environment } from '../../../../../environments/environment';

interface LineItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: string;
  price: string;
  isProductFixed: boolean;
  isVariantFixed: boolean;
}

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div *ngIf="isOpen" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div style="background: var(--bg-primary); border-radius: 12px; width: 900px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="padding: 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--text-primary);">
            {{ type === 'import' ? 'Tạo phiếu Nhập kho' : 'Tạo phiếu Xuất kho' }}
          </h2>
          <button (click)="onClose.emit()" class="admin-close-btn">
            <lucide-angular [img]="icons.X" size="20"></lucide-angular>
          </button>
        </div>
        
        <!-- Body -->
        <div style="padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 24px;">
          
          <!-- General Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <label style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Chi nhánh / Kho <span style="color: #ef4444;">*</span></label>
              <div class="location-filter-wrapper" style="position: relative; width: 100%;">
                <button 
                  type="button"
                  (click)="toggleLocationDropdown($event)"
                  style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
                  [style.color]="transactionLocation ? 'var(--text-primary)' : 'var(--text-muted)'"
                >
                  <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <lucide-angular [img]="icons.Filter" size="14"></lucide-angular>
                    {{ getLocationLabel() }}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [ngStyle]="{'transform': showLocationDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div *ngIf="showLocationDropdown" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); z-index: 1050; padding: 4px; max-height: 220px; overflow-y: auto;">
                  <div *ngFor="let w of activeWarehouses"
                    (click)="selectLocation(w.id, $event)"
                    style="padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; background: transparent;"
                    [ngStyle]="{'color': transactionLocation === w.id ? 'var(--accent)' : 'var(--text-primary)', 'font-weight': transactionLocation === w.id ? 600 : 400}"
                    onmouseover="this.style.background='var(--bg-secondary)'"
                    onmouseout="this.style.background='transparent'"
                  >
                    {{ w.name }} ({{ w.code }})
                  </div>
                </div>
              </div>
            </div>

            <ng-container *ngIf="type === 'export'; else importNote">
              <div [ngStyle]="{'display': 'grid', 'grid-template-columns': transactionReason.includes('Chuyển kho') ? '1fr 1fr' : '1fr', 'gap': '16px'}">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Lý do xuất <span style="color: #ef4444;">*</span></label>
                  <div style="position: relative; width: 100%;">
                    <button 
                      type="button"
                      (click)="toggleReasonDropdown($event)"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
                      [style.color]="transactionReason ? 'var(--text-primary)' : 'var(--text-muted)'"
                    >
                      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ transactionReason || 'Chọn lý do' }}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [ngStyle]="{'transform': showReasonDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div *ngIf="showReasonDropdown" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); z-index: 1050; padding: 4px;">
                      <div *ngFor="let r of reasonOptions"
                        (click)="selectReason(r, $event)"
                        style="padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; background: transparent;"
                        [ngStyle]="{'color': transactionReason === r ? 'var(--accent)' : 'var(--text-primary)', 'font-weight': transactionReason === r ? 600 : 400}"
                        onmouseover="this.style.background='var(--bg-secondary)'"
                        onmouseout="this.style.background='transparent'"
                      >
                        {{ r }}
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="transactionReason.includes('Chuyển kho')" style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Chuyển đến <span style="color: #ef4444;">*</span></label>
                  <div style="position: relative; width: 100%;">
                    <button 
                      type="button"
                      (click)="toggleDestDropdown($event)"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
                      [style.color]="transactionDestination ? 'var(--text-primary)' : 'var(--text-muted)'"
                    >
                      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ getDestLabel() }}
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [ngStyle]="{'transform': showDestDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div *ngIf="showDestDropdown" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); z-index: 1050; padding: 4px; max-height: 220px; overflow-y: auto;">
                      <ng-container *ngFor="let w of activeWarehouses">
                        <div *ngIf="w.id !== transactionLocation"
                          (click)="selectDest(w.id, $event)"
                          style="padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; background: transparent;"
                          [ngStyle]="{'color': transactionDestination === w.id ? 'var(--accent)' : 'var(--text-primary)', 'font-weight': transactionDestination === w.id ? 600 : 400}"
                          onmouseover="this.style.background='var(--bg-secondary)'"
                          onmouseout="this.style.background='transparent'"
                        >
                          {{ w.name }} ({{ w.code }})
                        </div>
                      </ng-container>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>
            <ng-template #importNote>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Ghi chú</label>
                <input type="text" class="admin-input" placeholder="Nhập ghi chú cho giao dịch này..." [(ngModel)]="transactionNote" />
              </div>
            </ng-template>

            <div *ngIf="type === 'export'" style="display: flex; flex-direction: column; gap: 8px; grid-column: 1 / -1;">
              <label style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Ghi chú</label>
              <input type="text" class="admin-input" placeholder="Nhập ghi chú cho giao dịch này..." [(ngModel)]="transactionNote" />
            </div>
          </div>

          <hr style="border: none; border-top: 1px dashed var(--border-color); margin: 0;" />

          <!-- Line Items Table -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <h3 style="font-size: 16px; font-weight: 600; margin: 0; color: var(--text-primary);">
              Danh sách sản phẩm <span style="color: #ef4444;">*</span>
            </h3>
            
            <!-- Headers -->
            <div [ngStyle]="{'display': 'grid', 'grid-template-columns': getGridColumns(), 'gap': '12px', 'padding-bottom': '8px', 'border-bottom': '1px solid var(--border-color)'}">
              <div style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Sản phẩm</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Biến thể</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Số lượng</div>
              <div *ngIf="type === 'import'" style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Đơn giá (₫)</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-muted); text-align: center;">Xóa</div>
            </div>

            <!-- Rows -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div *ngFor="let item of lineItems; let i = index" [ngStyle]="{'display': 'grid', 'grid-template-columns': getGridColumns(), 'gap': '12px', 'align-items': 'start'}">
                
                <!-- Product -->
                <div style="position: relative;">
                  <div *ngIf="item.isProductFixed" style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ getProductLabel(item.productId) }}
                  </div>
                  <div *ngIf="!item.isProductFixed" style="position: relative; width: 100%;">
                    <button 
                      type="button"
                      (click)="toggleProductDropdown(item.id, $event)"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
                      [style.color]="item.productId ? 'var(--text-primary)' : 'var(--text-muted)'"
                    >
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ getProductLabel(item.productId) }}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [ngStyle]="{'transform': openProductDropdownId === item.id ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s', 'flex-shrink': '0'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    
                    <!-- Product Popup with Search -->
                    <div *ngIf="openProductDropdownId === item.id" 
                      style="position: absolute; top: calc(100% + 4px); left: 0; min-width: 320px; width: 100%; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 1100; padding: 6px; display: flex; flex-direction: column; gap: 6px;"
                    >
                      <!-- Search Input Box -->
                      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px;" (click)="$event.stopPropagation()">
                        <lucide-angular [img]="icons.Search" size="14" color="var(--text-muted)"></lucide-angular>
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm theo tên SP hoặc SKU..." 
                          [(ngModel)]="productSearchTerm" 
                          (click)="$event.stopPropagation()"
                          style="width: 100%; border: none; background: transparent; outline: none; font-size: 12px; color: var(--text-primary);" 
                        />
                        <button *ngIf="productSearchTerm" (click)="productSearchTerm = ''; $event.stopPropagation()" style="background: none; border: none; cursor: pointer; padding: 0; color: var(--text-muted);">
                          <lucide-angular [img]="icons.X" size="12"></lucide-angular>
                        </button>
                      </div>

                      <!-- Product Options List -->
                      <div style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;">
                        <div *ngFor="let p of getFilteredProducts()"
                          (click)="selectProduct(item, p.id, $event)"
                          style="padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; flex-direction: column; gap: 2px;"
                          [ngStyle]="{'background': item.productId === p.id ? 'var(--bg-secondary)' : 'transparent', 'color': item.productId === p.id ? 'var(--accent)' : 'var(--text-primary)'}"
                          onmouseover="this.style.background='var(--bg-secondary)'"
                          onmouseout="this.style.background=item.productId === p.id ? 'var(--bg-secondary)' : 'transparent'"
                        >
                          <div style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {{ p.name || p.productName }}
                          </div>
                          <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px;">
                            <span>SKU: {{ p.sku || 'N/A' }}</span>
                            <span *ngIf="p.variants?.length">• {{ p.variants.length }} biến thể</span>
                          </div>
                        </div>
                        <div *ngIf="getFilteredProducts().length === 0" style="padding: 16px; text-align: center; font-size: 12px; color: var(--text-muted);">
                          Không tìm thấy sản phẩm phù hợp
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Variant -->
                <div style="position: relative;">
                  <div *ngIf="item.isVariantFixed" style="padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ getVariantName(item.productId, item.variantId) }}
                  </div>
                  <div *ngIf="!item.isVariantFixed" style="position: relative; width: 100%;">
                    <button 
                      type="button"
                      (click)="toggleVariantDropdown(item, $event)"
                      [disabled]="!item.productId"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; text-align: left; transition: all 0.2s;"
                      [ngStyle]="{
                        'background': !item.productId ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                        'cursor': !item.productId ? 'not-allowed' : 'pointer',
                        'opacity': !item.productId ? '0.6' : '1',
                        'color': item.variantId ? 'var(--text-primary)' : 'var(--text-muted)'
                      }"
                    >
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        {{ getVariantDisplay(item) }}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [ngStyle]="{'transform': openVariantDropdownId === item.id ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s', 'flex-shrink': '0'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>

                    <!-- Variant Popup Menu -->
                    <div *ngIf="openVariantDropdownId === item.id && item.productId"
                      style="position: absolute; top: calc(100% + 4px); left: 0; min-width: 260px; width: 100%; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 1100; padding: 4px; max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;"
                    >
                      <div *ngFor="let v of getVariantsForProduct(item.productId)"
                        (click)="selectVariant(item, v.id, $event)"
                        style="padding: 8px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; display: flex; justify-content: space-between; align-items: center; gap: 8px;"
                        [ngStyle]="{'background': item.variantId === v.id ? 'var(--bg-secondary)' : 'transparent', 'color': item.variantId === v.id ? 'var(--accent)' : 'var(--text-primary)'}"
                        onmouseover="this.style.background='var(--bg-secondary)'"
                        onmouseout="this.style.background=item.variantId === v.id ? 'var(--bg-secondary)' : 'transparent'"
                      >
                        <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden;">
                          <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ v.name }}</span>
                          <span *ngIf="v.sku" style="font-size: 11px; color: var(--text-muted);">{{ v.sku }}</span>
                        </div>
                        <span *ngIf="v.price" style="font-size: 12px; font-weight: 600; color: var(--accent); white-space: nowrap;">
                          {{ formatPrice(v.price) }}
                        </span>
                      </div>
                      <div *ngIf="getVariantsForProduct(item.productId).length === 0" style="padding: 12px; text-align: center; font-size: 12px; color: var(--text-muted);">
                        Không có biến thể
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Quantity -->
                <div>
                  <input type="text" class="admin-input" placeholder="0" [ngModel]="item.quantity" (ngModelChange)="updateLineItem(item.id, 'quantity', $event)" />
                </div>

                <!-- Price -->
                <div *ngIf="type === 'import'">
                  <input type="text" class="admin-input" placeholder="0" [ngModel]="item.price" (ngModelChange)="updateLineItem(item.id, 'price', $event)" />
                </div>

                <!-- Delete -->
                <div style="display: flex; justify-content: center; padding-top: 8px;">
                  <button 
                    (click)="handleRemoveLineItem(item.id)"
                    [disabled]="lineItems.length === 1"
                    [ngStyle]="{
                      'background': 'none', 'border': 'none', 'cursor': lineItems.length === 1 ? 'not-allowed' : 'pointer',
                      'color': lineItems.length === 1 ? 'var(--border-color)' : '#ef4444',
                      'padding': '4px'
                    }"
                  >
                    <lucide-angular [img]="icons.Trash2" size="18"></lucide-angular>
                  </button>
                </div>
              </div>
            </div>

            <!-- Add item button -->
            <div style="margin-top: 8px;">
              <button 
                (click)="handleAddLineItem()"
                [disabled]="!canAddNewLine()"
                [ngStyle]="{
                  'display': 'flex', 'align-items': 'center', 'gap': '6px',
                  'background': 'none', 'border': '1px dashed var(--accent)', 'color': 'var(--accent)',
                  'padding': '8px 16px', 'border-radius': '6px', 'font-size': '13px', 'font-weight': 600,
                  'cursor': canAddNewLine() ? 'pointer' : 'not-allowed',
                  'opacity': canAddNewLine() ? 1 : 0.5
                }"
              >
                <lucide-angular [img]="icons.Plus" size="16"></lucide-angular> Thêm sản phẩm
              </button>
            </div>
            
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; background: var(--bg-secondary); border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
          <button (click)="onClose.emit()" class="admin-btn admin-btn-secondary">Hủy</button>
          <button (click)="handleSubmit()" class="admin-btn admin-btn-primary">
            {{ type === 'import' ? 'Tạo phiếu nhập' : 'Tạo phiếu xuất' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TransactionModalComponent implements OnInit, OnChanges {
  icons = { X, Plus, Trash2, Filter, Search };
  private http = inject(HttpClient);

  @Input() isOpen = false;
  @Input() type: 'import' | 'export' = 'import';
  @Input() products: any[] = [];
  @Input() initialProductId = '';
  @Input() initialVariantId = '';
  @Input() isProductFixed = false;
  @Input() isVariantFixed = false;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  warehouses: any[] = [];
  fetchedProducts: any[] = [];
  fallbackWarehouses = [
    { id: 'KHO_TONG_HCM', name: 'Kho Tổng (TP.HCM)', code: 'KHO_TONG_HCM' },
    { id: 'KHO_HN', name: 'Kho Hà Nội', code: 'KHO_HN' },
    { id: 'SR_Q1', name: 'Showroom Quận 1', code: 'SR_Q1' },
    { id: 'SR_THU_DUC', name: 'Showroom Thủ Đức', code: 'SR_THU_DUC' }
  ];

  get activeWarehouses() {
    return this.warehouses.length > 0 ? this.warehouses : this.fallbackWarehouses;
  }

  get availableProducts() {
    if (this.fetchedProducts.length > 0) return this.fetchedProducts;
    if (this.products && this.products.length > 0) return this.products;
    return [];
  }

  transactionLocation = '';
  transactionReason = '';
  transactionDestination = '';
  transactionNote = '';
  lineItems: LineItem[] = [];

  showLocationDropdown = false;
  showReasonDropdown = false;
  showDestDropdown = false;

  openProductDropdownId: string | null = null;
  openVariantDropdownId: string | null = null;
  productSearchTerm = '';

  reasonOptions = [
    'Chuyển kho (Luân chuyển)',
    'Xuất bán lẻ / Dự án',
    'Hư hỏng, thất thoát',
    'Trưng bày mẫu',
    'Khác'
  ];

  ngOnInit() {
    this.loadBackendData();
  }

  loadBackendData() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.warehouses = data;
        }
      },
      error: (err) => console.warn('Could not fetch warehouses:', err)
    });

    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/products-options`).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.fetchedProducts = data;
        }
      },
      error: (err) => console.warn('Could not fetch products options:', err)
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.resetState();
      if (this.warehouses.length === 0 || this.fetchedProducts.length === 0) {
        this.loadBackendData();
      }
    }
  }

  resetState() {
    this.lineItems = [{
      id: Date.now().toString(),
      productId: this.initialProductId,
      variantId: this.initialVariantId,
      quantity: '',
      price: '',
      isProductFixed: this.isProductFixed,
      isVariantFixed: this.isVariantFixed,
    }];
    this.transactionLocation = '';
    this.transactionReason = '';
    this.transactionDestination = '';
    this.transactionNote = '';
    this.showLocationDropdown = false;
    this.showReasonDropdown = false;
    this.showDestDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
    this.productSearchTerm = '';
  }

  getLocationLabel(): string {
    if (!this.transactionLocation) return 'Chọn chi nhánh';
    const w = this.activeWarehouses.find((x: any) => x.id === this.transactionLocation);
    return w ? `${w.name} (${w.code})` : this.transactionLocation;
  }

  getDestLabel(): string {
    if (!this.transactionDestination) return 'Chọn kho nhận';
    const w = this.activeWarehouses.find((x: any) => x.id === this.transactionDestination);
    return w ? `${w.name} (${w.code})` : this.transactionDestination;
  }

  toggleLocationDropdown(event: Event) {
    event.stopPropagation();
    this.showLocationDropdown = !this.showLocationDropdown;
    this.showReasonDropdown = false;
    this.showDestDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
  }

  selectLocation(id: string, event: Event) {
    event.stopPropagation();
    this.transactionLocation = id;
    this.showLocationDropdown = false;
    if (this.transactionDestination === id) {
      this.transactionDestination = '';
    }
  }

  toggleReasonDropdown(event: Event) {
    event.stopPropagation();
    this.showReasonDropdown = !this.showReasonDropdown;
    this.showLocationDropdown = false;
    this.showDestDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
  }

  selectReason(reason: string, event: Event) {
    event.stopPropagation();
    this.transactionReason = reason;
    this.showReasonDropdown = false;
    if (!reason.includes('Chuyển kho')) {
      this.transactionDestination = '';
    }
  }

  toggleDestDropdown(event: Event) {
    event.stopPropagation();
    this.showDestDropdown = !this.showDestDropdown;
    this.showLocationDropdown = false;
    this.showReasonDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
  }

  selectDest(id: string, event: Event) {
    event.stopPropagation();
    this.transactionDestination = id;
    this.showDestDropdown = false;
  }

  getProductLabel(productId: string): string {
    if (!productId) return 'Chọn sản phẩm...';
    const p = this.availableProducts.find((x: any) => x.id === productId);
    return p ? (p.name || p.productName) : 'N/A';
  }

  getVariantDisplay(item: LineItem): string {
    if (!item.productId) return 'Chọn biến thể...';
    if (!item.variantId) return 'Chọn biến thể...';
    const vars = this.getVariantsForProduct(item.productId);
    const v = vars.find((x: any) => x.id === item.variantId);
    return v ? `${v.name} ${v.price ? '(' + this.formatPrice(v.price) + ')' : ''}` : item.variantId;
  }

  getFilteredProducts(): any[] {
    if (!this.productSearchTerm.trim()) {
      return this.availableProducts;
    }
    const term = this.productSearchTerm.toLowerCase();
    return this.availableProducts.filter((p: any) => 
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.productName && p.productName.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  }

  toggleProductDropdown(itemId: string, event: Event) {
    event.stopPropagation();
    if (this.openProductDropdownId === itemId) {
      this.openProductDropdownId = null;
    } else {
      this.closeAllDropdowns();
      this.openProductDropdownId = itemId;
      this.productSearchTerm = '';
    }
  }

  selectProduct(item: LineItem, productId: string, event: Event) {
    event.stopPropagation();
    this.updateLineItem(item.id, 'productId', productId);
    this.openProductDropdownId = null;
    this.productSearchTerm = '';
  }

  toggleVariantDropdown(item: LineItem, event: Event) {
    event.stopPropagation();
    if (!item.productId) return;
    if (this.openVariantDropdownId === item.id) {
      this.openVariantDropdownId = null;
    } else {
      this.closeAllDropdowns();
      this.openVariantDropdownId = item.id;
    }
  }

  selectVariant(item: LineItem, variantId: string, event: Event) {
    event.stopPropagation();
    this.updateLineItem(item.id, 'variantId', variantId);
    this.openVariantDropdownId = null;
  }

  @HostListener('document:click')
  closeAllDropdowns() {
    this.showLocationDropdown = false;
    this.showReasonDropdown = false;
    this.showDestDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
  }

  getGridColumns() {
    return this.type === 'import' ? '2.5fr 2fr 1fr 1.5fr 40px' : '2.5fr 2fr 1fr 40px';
  }

  getProductName(id: string) {
    const p = this.availableProducts.find((x: any) => x.id === id);
    return p ? (p.name || p.productName) : 'N/A';
  }

  getVariantName(productId: string, variantId: string) {
    const vars = this.getVariantsForProduct(productId);
    const v = vars.find((x: any) => x.id === variantId);
    return v ? v.name : (variantId || 'N/A');
  }

  getVariantsForProduct(productId: string) {
    if (!productId) return [];
    const p = this.availableProducts.find((x: any) => x.id === productId);
    if (p && p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.map((v: any) => ({
        id: v.id,
        name: v.name || v.color || v.material || 'Bản tiêu chuẩn',
        sku: v.sku || '',
        price: v.price || 0
      }));
    }
    return [
      { id: 'v_default', name: 'Tiêu chuẩn', sku: p?.sku || 'SKU-STD', price: p?.price || 0 }
    ];
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  handleAddLineItem() {
    this.lineItems.push({
      id: Date.now().toString() + Math.random(),
      productId: '',
      variantId: '',
      quantity: '',
      price: '',
      isProductFixed: false,
      isVariantFixed: false,
    });
  }

  handleRemoveLineItem(id: string) {
    if (this.lineItems.length === 1) return;
    this.lineItems = this.lineItems.filter((item: any) => item.id !== id);
  }

  updateLineItem(id: string, field: keyof LineItem, value: any) {
    const item = this.lineItems.find((x: any) => x.id === id);
    if (!item) return;

    if (field === 'productId') {
      item.productId = value;
      const variants = this.getVariantsForProduct(value);
      if (variants.length === 1) {
        item.variantId = variants[0].id;
        if (variants[0].price) {
          item.price = new Intl.NumberFormat('vi-VN').format(variants[0].price);
        }
      } else {
        item.variantId = '';
        item.price = '';
      }
    } else if (field === 'variantId') {
      item.variantId = value;
      const variants = this.getVariantsForProduct(item.productId);
      const v = variants.find((x: any) => x.id === value);
      if (v && v.price) {
        item.price = new Intl.NumberFormat('vi-VN').format(v.price);
      }
    } else if (field === 'price') {
      let rawValue = value.replace(/[^0-9]/g, '');
      const num = parseInt(rawValue, 10);
      item.price = rawValue ? new Intl.NumberFormat('vi-VN').format(num) : '';
    } else if (field === 'quantity') {
      item.quantity = value.replace(/[^0-9]/g, '');
    } else {
      (item as any)[field] = value;
    }
  }

  canAddNewLine() {
    return this.lineItems.every((item: any) => item.productId && item.variantId);
  }

  handleSubmit() {
    if (!this.transactionLocation) return window.alert('Vui lòng chọn chi nhánh/kho');
    if (this.type === 'export' && !this.transactionReason) return window.alert('Vui lòng chọn lý do xuất');
    
    const invalidItems = this.lineItems.filter((item: any) => !item.productId || !item.variantId || !item.quantity);
    if (invalidItems.length > 0) {
      return window.alert('Vui lòng điền đầy đủ thông tin Sản phẩm, Biến thể và Số lượng cho tất cả các dòng.');
    }

    const sourceWarehouse = this.activeWarehouses.find((w: any) => w.id === this.transactionLocation);
    const destWarehouse = this.activeWarehouses.find((w: any) => w.id === this.transactionDestination);

    const data = {
      type: this.type,
      location: sourceWarehouse ? sourceWarehouse.name : this.transactionLocation,
      sourceWarehouseId: sourceWarehouse ? sourceWarehouse.id : null,
      reason: this.transactionReason,
      destination: destWarehouse ? destWarehouse.name : (this.transactionDestination || 'Khách hàng / Đối tác'),
      destWarehouseId: destWarehouse ? destWarehouse.id : null,
      note: this.transactionNote,
      items: this.lineItems.map((item: any) => {
        const prod = this.availableProducts.find((p: any) => p.id === item.productId);
        const variants = this.getVariantsForProduct(item.productId);
        const variant = variants.find((v: any) => v.id === item.variantId);
        return {
          productId: item.productId,
          productName: prod ? (prod.name || prod.productName) : 'Sản phẩm',
          variantId: item.variantId,
          variantName: variant ? variant.name : 'Tiêu chuẩn',
          sku: variant?.sku || prod?.sku || 'SKU-AUTO',
          quantity: item.quantity,
          price: item.price,
        };
      })
    };
    
    this.onSubmit.emit(data);
  }
}
