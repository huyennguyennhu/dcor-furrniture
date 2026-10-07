import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus, Trash2 } from 'lucide-angular';

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
              <select class="admin-select" [(ngModel)]="transactionLocation">
                <option value="">Chọn chi nhánh</option>
                <option value="Kho Tổng">Kho Tổng (TP.HCM)</option>
                <option value="Kho HN">Kho Hà Nội</option>
                <option value="Q1">Showroom Quận 1</option>
              </select>
            </div>

            <ng-container *ngIf="type === 'export'; else importNote">
              <div [ngStyle]="{'display': 'grid', 'grid-template-columns': transactionReason === 'Chuyển kho' ? '1fr 1fr' : '1fr', 'gap': '16px'}">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Lý do xuất <span style="color: #ef4444;">*</span></label>
                  <select class="admin-select" [(ngModel)]="transactionReason">
                    <option value="">Chọn lý do</option>
                    <option value="Chuyển kho">Chuyển kho</option>
                    <option value="Hư hỏng">Hư hỏng, thất thoát</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div *ngIf="transactionReason === 'Chuyển kho'" style="display: flex; flex-direction: column; gap: 8px;">
                  <label style="font-size: 14px; font-weight: 600; color: var(--text-primary);">Chuyển đến <span style="color: #ef4444;">*</span></label>
                  <select class="admin-select" [(ngModel)]="transactionDestination">
                    <option value="">Chọn kho nhận</option>
                    <option value="Kho Tổng" *ngIf="transactionLocation !== 'Kho Tổng'">Kho Tổng (TP.HCM)</option>
                    <option value="Kho HN" *ngIf="transactionLocation !== 'Kho HN'">Kho Hà Nội</option>
                    <option value="Q1" *ngIf="transactionLocation !== 'Q1'">Showroom Quận 1</option>
                  </select>
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
                <div>
                  <div *ngIf="item.isProductFixed" style="padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ getProductName(item.productId) }}
                  </div>
                  <select *ngIf="!item.isProductFixed" class="admin-select" [ngModel]="item.productId" (ngModelChange)="updateLineItem(item.id, 'productId', $event)">
                    <option value="">Chọn SP...</option>
                    <option *ngFor="let p of products" [value]="p.id">{{ p.name || p.productName }}</option>
                  </select>
                </div>

                <!-- Variant -->
                <div>
                  <div *ngIf="item.isVariantFixed" style="padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ item.variantId || 'N/A' }}
                  </div>
                  <select *ngIf="!item.isVariantFixed" class="admin-select" [ngModel]="item.variantId" (ngModelChange)="updateLineItem(item.id, 'variantId', $event)" [disabled]="!item.productId">
                    <option value="">Chọn biến thể...</option>
                    <option *ngFor="let v of getVariantsForProduct(item.productId)" [value]="v.name">{{ v.name }}</option>
                  </select>
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
export class TransactionModalComponent implements OnChanges {
  icons = { X, Plus, Trash2 };

  @Input() isOpen = false;
  @Input() type: 'import' | 'export' = 'import';
  @Input() products: any[] = [];
  @Input() initialProductId = '';
  @Input() initialVariantId = '';
  @Input() isProductFixed = false;
  @Input() isVariantFixed = false;
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();

  transactionLocation = '';
  transactionReason = '';
  transactionDestination = '';
  transactionNote = '';
  lineItems: LineItem[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.resetState();
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
  }

  getGridColumns() {
    return this.type === 'import' ? '2.5fr 2fr 1fr 1.5fr 40px' : '2.5fr 2fr 1fr 40px';
  }

  getProductName(id: string) {
    const p = this.products.find(x => x.id === id);
    return p ? (p.name || p.productName) : 'N/A';
  }

  getVariantsForProduct(productId: string) {
    if (!productId) return [];
    return [
      { id: 'v1', name: 'Màu Trắng, Gỗ sồi' },
      { id: 'v2', name: 'Màu Đen, Khung thép' },
      { id: 'v3', name: 'Màu Xám, Bọc da' },
      { id: 'v4', name: 'Màu Xanh, Khung thép' },
    ];
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
    this.lineItems = this.lineItems.filter(item => item.id !== id);
  }

  updateLineItem(id: string, field: keyof LineItem, value: any) {
    const item = this.lineItems.find(x => x.id === id);
    if (!item) return;

    if (field === 'productId') {
      item.productId = value;
      item.variantId = '';
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
    return this.lineItems.every(item => item.productId && item.variantId);
  }

  handleSubmit() {
    if (!this.transactionLocation) return window.alert('Vui lòng chọn chi nhánh/kho');
    if (this.type === 'export' && !this.transactionReason) return window.alert('Vui lòng chọn lý do xuất');
    
    const invalidItems = this.lineItems.filter(item => !item.productId || !item.variantId || !item.quantity);
    if (invalidItems.length > 0) {
      return window.alert('Vui lòng điền đầy đủ thông tin Sản phẩm, Biến thể và Số lượng cho tất cả các dòng.');
    }

    const data = {
      type: this.type,
      location: this.transactionLocation,
      reason: this.transactionReason,
      destination: this.transactionDestination,
      note: this.transactionNote,
      items: this.lineItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }))
    };
    
    this.onSubmit.emit(data);
  }
}
