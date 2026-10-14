import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  X, Plus, Minus, Trash2, Filter, Search, ChevronUp, ChevronDown, 
  Lock, Calendar, User, FileText, CheckCircle2, AlertCircle, Save
} from 'lucide-angular';
import { environment } from '../../../../../environments/environment';

export interface LineItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: string;
  price: string;
  unit: string;
  isProductFixed: boolean;
  isVariantFixed: boolean;
}

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div *ngIf="isOpen" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px);">
      <div style="background: var(--bg-primary); border-radius: 14px; width: 980px; max-width: 95vw; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.2); border: 1px solid var(--border-color); overflow: hidden;">
        
        <!-- Header -->
        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div [ngStyle]="{'background': type === 'export' ? '#fef2f2' : '#f0fdf4', 'color': type === 'export' ? '#ef4444' : '#10b981'}" style="width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <lucide-angular [img]="icons.FileText" size="20"></lucide-angular>
            </div>
            <div>
              <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                {{ type === 'import' ? 'Tạo phiếu Nhập kho' : 'Tạo phiếu Xuất kho' }}
                <span style="font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-muted);">
                  {{ type === 'export' ? 'Xuất kho nội bộ / Bán hàng' : 'Nhập hàng từ NCC' }}
                </span>
              </h2>
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                Điền đầy đủ các thông tin bắt buộc có dấu (*) để hệ thống tự động hạch toán
              </div>
            </div>
          </div>
          <button (click)="onClose.emit()" class="admin-close-btn" style="background: transparent; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; border-radius: 6px;" title="Đóng">
            <lucide-angular [img]="icons.X" size="20"></lucide-angular>
          </button>
        </div>
        
        <!-- Body -->
        <div style="padding: 22px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
          
          <!-- General Info Card -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 16px;">
            
            <!-- Row 1: Mã phiếu & Ngày giờ xuất -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Mã phiếu (Khóa lại, tự sinh) -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between;">
                  <span>{{ type === 'import' ? 'Mã phiếu nhập' : 'Mã phiếu xuất' }} <span style="color: #ef4444;">*</span></span>
                  <span style="font-size: 11px; font-weight: 500; color: #10b981; background: #ecfdf5; padding: 1px 6px; border-radius: 4px; display: flex; align-items: center; gap: 3px;">
                    <lucide-angular [img]="icons.Lock" size="10"></lucide-angular> Tự động sinh
                  </span>
                </label>
                <div style="position: relative; width: 100%;">
                  <input 
                    type="text" 
                    [value]="orderCode" 
                    readonly 
                    style="width: 100%; box-sizing: border-box; padding: 9px 12px 9px 36px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); font-family: monospace; font-size: 13px; font-weight: 700; color: var(--accent); cursor: not-allowed; letter-spacing: 0.5px;"
                  />
                  <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: flex; align-items: center;">
                    <lucide-angular [img]="icons.Lock" size="14"></lucide-angular>
                  </div>
                </div>
              </div>

              <!-- Ngày giờ xuất / nhập -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>{{ type === 'import' ? 'Ngày nhập kho' : 'Ngày xuất kho' }} <span style="color: #ef4444;">*</span></span>
                  <span style="font-size: 11px; color: var(--text-muted); font-weight: 400;">(Mặc định hiện tại, có thể hạch toán lùi)</span>
                </label>
                <div style="position: relative; width: 100%;">
                  <input 
                    type="datetime-local" 
                    [(ngModel)]="transactionDate" 
                    (change)="onDateChange()"
                    style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 13px; color: var(--text-primary); outline: none;"
                  />
                </div>
              </div>
            </div>

            <!-- Row 2: Chi nhánh / Kho & Lý do -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Chi nhánh / Kho xuất -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
                  {{ type === 'import' ? 'Kho đích nhập về' : 'Chi nhánh / Kho xuất' }} <span style="color: #ef4444;">*</span>
                </label>
                <div class="location-filter-wrapper" style="position: relative; width: 100%;">
                  <button 
                    type="button"
                    (click)="toggleLocationDropdown($event)"
                    style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
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

              <!-- Lý do xuất (hoặc nguồn nhập) -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
                  {{ type === 'import' ? 'Nguồn gốc / Lý do nhập' : 'Lý do xuất kho' }} <span style="color: #ef4444;">*</span>
                </label>
                <div style="position: relative; width: 100%;">
                  <button 
                    type="button"
                    (click)="toggleReasonDropdown($event)"
                    style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
                    [style.color]="transactionReason ? 'var(--text-primary)' : 'var(--text-muted)'"
                  >
                    <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ transactionReason || (type === 'import' ? 'Chọn lý do nhập' : 'Chọn lý do xuất') }}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [ngStyle]="{'transform': showReasonDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </button>
                  <div *ngIf="showReasonDropdown" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); z-index: 1050; padding: 4px;">
                    <div *ngFor="let r of currentReasonOptions"
                      (click)="selectReason(r, $event)"
                      style="padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; background: transparent; display: flex; align-items: center; justify-content: space-between;"
                      [ngStyle]="{'color': transactionReason === r ? 'var(--accent)' : 'var(--text-primary)', 'font-weight': transactionReason === r ? 600 : 400}"
                      onmouseover="this.style.background='var(--bg-secondary)'"
                      onmouseout="this.style.background='transparent'"
                    >
                      <span>{{ r }}</span>
                      <span *ngIf="type === 'export'" style="font-size: 11px; font-family: monospace; color: var(--text-muted);">
                        [{{ getPrefixForReasonText(r) }}]
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 3: Người tạo & Người nhận (Nếu có) & Kho đích nếu chuyển kho -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Người tạo phiếu -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <lucide-angular [img]="icons.User" size="14"></lucide-angular> Người lập phiếu
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="creatorName" 
                  placeholder="Tên nhân viên lập phiếu..." 
                  style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 13px; color: var(--text-primary); outline: none;" 
                />
              </div>

              <!-- Người nhận / Đơn vị nhận (hoặc Kho đích nếu Chuyển kho) -->
              <div *ngIf="!transactionReason.includes('Chuyển kho')" style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary);">
                  {{ type === 'import' ? 'Nhà cung cấp / Đơn vị giao' : 'Người nhận / Đơn vị nhận hàng' }}
                </label>
                <input 
                  type="text" 
                  [(ngModel)]="recipientName" 
                  [placeholder]="type === 'import' ? 'VD: Xưởng BoConcept, NCC Gỗ...' : 'VD: Khách hàng Trần Anh Tuấn, Cty Kiến Trúc Alpha...'" 
                  style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 13px; color: var(--text-primary); outline: none;" 
                />
              </div>

              <!-- Kho nhận nếu Chuyển kho -->
              <div *ngIf="transactionReason.includes('Chuyển kho')" style="display: flex; flex-direction: column; gap: 6px;">
                <label style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Chuyển đến Kho <span style="color: #ef4444;">*</span></label>
                <div style="position: relative; width: 100%;">
                  <button 
                    type="button"
                    (click)="toggleDestDropdown($event)"
                    style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
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

            <!-- Row 4: Ghi chú chứng từ -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Ghi chú / Diễn giải chứng từ</label>
              <input 
                type="text" 
                [(ngModel)]="transactionNote" 
                placeholder="Nhập thông tin ghi chú kèm theo phiếu (nếu có)..." 
                style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 13px; color: var(--text-primary); outline: none;" 
              />
            </div>

          </div>

          <!-- Line Items Table Section -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="font-size: 15px; font-weight: 700; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                Danh sách sản phẩm <span style="color: #ef4444;">*</span>
                <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">({{ lineItems.length }} dòng)</span>
              </h3>
              <div *ngIf="type === 'export' && hasExceededStock()" style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: #ef4444; font-weight: 600; background: #fef2f2; padding: 4px 10px; border-radius: 6px; border: 1px solid #fecaca;">
                <lucide-angular [img]="icons.AlertCircle" size="14"></lucide-angular>
                Có sản phẩm xuất vượt tồn kho thực tế!
              </div>
            </div>
            
            <!-- Table Headers -->
            <div [ngStyle]="{'display': 'grid', 'grid-template-columns': getGridColumns(), 'gap': '12px', 'padding': '10px 14px', 'background': 'var(--bg-secondary)', 'border-radius': '8px', 'border': '1px solid var(--border-color)'}">
              <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Sản phẩm</div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Biến thể & Tồn kho</div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-align: center; text-transform: uppercase;">ĐVT</div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-align: center; text-transform: uppercase;">Số lượng</div>
              <div *ngIf="type === 'import'" style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Đơn giá nhập (₫)</div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-align: center; text-transform: uppercase;">Xóa</div>
            </div>

            <!-- Rows -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div *ngFor="let item of lineItems; let i = index" 
                   [ngStyle]="{'display': 'grid', 'grid-template-columns': getGridColumns(), 'gap': '12px', 'align-items': 'start', 'padding': '8px 12px', 'border-radius': '8px', 'background': 'var(--bg-primary)', 'border': isQuantityExceeded(item) ? '1px solid #f87171' : '1px solid var(--border-color)'}">
                
                <!-- 1. Sản phẩm -->
                <div style="position: relative;">
                  <div *ngIf="item.isProductFixed" style="padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ getProductLabel(item.productId) }}
                  </div>
                  <div *ngIf="!item.isProductFixed" style="position: relative; width: 100%;">
                    <button 
                      type="button"
                      (click)="toggleProductDropdown(item.id, $event)"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); cursor: pointer; font-size: 13px; text-align: left;"
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

                <!-- 2. Biến thể & Tồn kho hiện tại -->
                <div style="position: relative; display: flex; flex-direction: column; gap: 4px;">
                  <div *ngIf="item.isVariantFixed" style="padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ getVariantName(item.productId, item.variantId) }}
                  </div>
                  <div *ngIf="!item.isVariantFixed" style="position: relative; width: 100%;">
                    <button 
                      type="button"
                      (click)="toggleVariantDropdown(item, $event)"
                      [disabled]="!item.productId"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--border-color); font-size: 13px; text-align: left; transition: all 0.2s;"
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

                  <!-- Thông tin Tồn kho hiện tại tại Kho đã chọn -->
                  <div *ngIf="item.variantId" style="font-size: 11px; display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                    <span style="color: var(--text-muted);">Tồn kho:</span>
                    <span *ngIf="!transactionLocation" style="color: #f59e0b; font-weight: 500;">
                      (Chọn kho để xem)
                    </span>
                    <span *ngIf="transactionLocation" 
                          [style.color]="getVariantStock(item) > 5 ? '#10b981' : (getVariantStock(item) > 0 ? '#f59e0b' : '#ef4444')"
                          style="font-weight: 700; background: var(--bg-secondary); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border-color);">
                      {{ getVariantStock(item) }} {{ item.unit || 'Chiếc' }}
                    </span>
                  </div>
                </div>

                <!-- 3. Đơn vị tính (ĐVT) -->
                <div style="display: flex; justify-content: center;">
                  <select 
                    [(ngModel)]="item.unit" 
                    style="height: 38px; width: 75px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 12px; font-weight: 500; text-align: center; outline: none; cursor: pointer;"
                  >
                    <option value="Chiếc">Chiếc</option>
                    <option value="Bộ">Bộ</option>
                    <option value="Cái">Cái</option>
                    <option value="Thùng">Thùng</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Mét">Mét</option>
                  </select>
                </div>

                <!-- 4. Số lượng (kèm Validation cảnh báo vượt tồn) -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  <div style="display: flex; align-items: stretch; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; height: 38px; width: 105px; background: var(--bg-primary); transition: all 0.15s ease;"
                       [ngStyle]="{
                         'opacity': (!item.productId || !item.variantId) ? '0.5' : '1',
                         'border-color': isQuantityExceeded(item) ? '#ef4444' : 'var(--border-color)',
                         'background': isQuantityExceeded(item) ? '#fef2f2' : ((!item.productId || !item.variantId) ? 'var(--bg-secondary)' : 'var(--bg-primary)')
                       }">
                    <!-- Input Nhập số lượng -->
                    <input 
                      type="text" 
                      inputmode="numeric"
                      pattern="[0-9]*"
                      [disabled]="!item.productId || !item.variantId"
                      [value]="item.quantity" 
                      (keydown)="onQuantityKeydown($event)"
                      (input)="onQuantityInput(item, $event)"
                      placeholder="0"
                      style="flex: 1; min-width: 0; width: 100%; height: 100%; border: none; outline: none; background: transparent; text-align: center; font-size: 13px; font-weight: 700; color: var(--text-primary); padding: 0 4px;"
                      [ngStyle]="{
                        'cursor': (!item.productId || !item.variantId) ? 'not-allowed' : 'text',
                        'color': isQuantityExceeded(item) ? '#dc2626' : 'var(--text-primary)'
                      }"
                    />

                    <!-- Cụm mũi tên tăng/giảm bên phải -->
                    <div style="display: flex; flex-direction: column; width: 24px; border-left: 1px solid var(--border-color); flex-shrink: 0;">
                      <button 
                        type="button"
                        (click)="increaseQuantity(item)"
                        [disabled]="!item.productId || !item.variantId"
                        style="flex: 1; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-bottom: 1px solid var(--border-color); padding: 0; transition: all 0.12s ease; cursor: pointer;"
                        title="Tăng"
                      >
                        <lucide-angular [img]="icons.ChevronUp" size="12"></lucide-angular>
                      </button>

                      <button 
                        type="button"
                        (click)="decreaseQuantity(item)"
                        [disabled]="!item.productId || !item.variantId || getQuantity(item) <= 0"
                        style="flex: 1; display: flex; align-items: center; justify-content: center; background: transparent; border: none; padding: 0; transition: all 0.12s ease; cursor: pointer;"
                        title="Giảm"
                      >
                        <lucide-angular [img]="icons.ChevronDown" size="12"></lucide-angular>
                      </button>
                    </div>
                  </div>

                  <!-- Cảnh báo lỗi vượt quá tồn kho -->
                  <div *ngIf="isQuantityExceeded(item)" style="color: #ef4444; font-size: 10px; font-weight: 600; text-align: center; line-height: 1.2;">
                    ⚠️ Quá tồn (Max {{ getVariantStock(item) }})
                  </div>
                </div>

                <!-- 5. Giá nhập (chỉ hiện khi import) -->
                <div *ngIf="type === 'import'">
                  <input type="text" class="admin-input" placeholder="0" [ngModel]="item.price" (ngModelChange)="updateLineItem(item.id, 'price', $event)" style="height: 38px; width: 100%; box-sizing: border-box; font-size: 13px; text-align: right; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);" />
                </div>

                <!-- 6. Delete Row -->
                <div style="display: flex; justify-content: center; padding-top: 8px;">
                  <button 
                    (click)="handleRemoveLineItem(item.id)"
                    [disabled]="lineItems.length === 1"
                    [ngStyle]="{
                      'background': 'none', 'border': 'none', 'cursor': lineItems.length === 1 ? 'not-allowed' : 'pointer',
                      'color': lineItems.length === 1 ? 'var(--border-color)' : '#ef4444',
                      'padding': '4px'
                    }"
                    title="Xóa dòng"
                  >
                    <lucide-angular [img]="icons.Trash2" size="18"></lucide-angular>
                  </button>
                </div>
              </div>
            </div>

            <!-- Add item button -->
            <div style="margin-top: 4px;">
              <button 
                type="button"
                (click)="handleAddLineItem()"
                [disabled]="!canAddNewLine()"
                [ngStyle]="{
                  'display': 'inline-flex', 'align-items': 'center', 'gap': '6px',
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

        <!-- Footer với 3 nút chức năng -->
        <div style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
          <!-- Left info: Tóm tắt trạng thái -->
          <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
            <span>Mã phiếu: <strong style="font-family: monospace; color: var(--text-primary);">{{ orderCode }}</strong></span>
            <span>•</span>
            <span>Tổng SP: <strong style="color: var(--text-primary);">{{ getTotalQuantity() }}</strong></span>
          </div>

          <!-- 3 Nút hành động cốt lõi -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <!-- Nút 1: HỦY (Hủy bỏ) -->
            <button 
              type="button"
              (click)="onClose.emit()" 
              style="padding: 9px 18px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease;"
              onmouseover="this.style.background='var(--bg-secondary)'"
              onmouseout="this.style.background='var(--bg-primary)'"
            >
              Hủy
            </button>

            <!-- Nút 2: LƯU NHÁP (Draft) -->
            <button 
              type="button"
              (click)="handleSaveDraft()" 
              style="display: flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 8px; border: 1px solid #d97706; background: #fffbeb; color: #b45309; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease;"
              onmouseover="this.style.background='#fef3c7'"
              onmouseout="this.style.background='#fffbeb'"
              title="Lưu lại dạng bản nháp để duyệt sau, chưa trừ số lượng tồn kho"
            >
              <lucide-angular [img]="icons.Save" size="15"></lucide-angular>
              Lưu nháp
            </button>

            <!-- Nút 3: TẠO PHIẾU XUẤT (Hoàn thành / Xác nhận trừ kho) -->
            <button 
              type="button"
              (click)="handleSubmitConfirmed()" 
              [disabled]="type === 'export' && hasExceededStock()"
              [ngStyle]="{
                'opacity': (type === 'export' && hasExceededStock()) ? '0.5' : '1',
                'cursor': (type === 'export' && hasExceededStock()) ? 'not-allowed' : 'pointer'
              }"
              style="display: flex; align-items: center; gap: 6px; padding: 9px 22px; border-radius: 8px; border: none; background: #18181b; color: #ffffff; font-size: 13px; font-weight: 600; transition: all 0.15s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"
              onmouseover="if(!this.disabled) this.style.background='#27272a'"
              onmouseout="this.style.background='#18181b'"
              title="Phát hành phiếu chính thức và cập nhật trừ trực tiếp tồn kho"
            >
              <lucide-angular [img]="icons.CheckCircle2" size="15"></lucide-angular>
              {{ type === 'import' ? 'Tạo phiếu nhập' : 'Tạo phiếu xuất' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransactionModalComponent implements OnInit, OnChanges {
  icons = { 
    X, Plus, Minus, Trash2, Filter, Search, ChevronUp, ChevronDown, 
    Lock, Calendar, User, FileText, CheckCircle2, AlertCircle, Save 
  };
  private http = inject(HttpClient);

  @Input() isOpen = false;
  @Input() type: 'import' | 'export' = 'export';
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
    { id: '24114aab-767b-4877-b256-dc775fa88f66', name: 'Kho Tổng (TP.HCM)', code: 'KHO_TONG_HCM' },
    { id: '047e4fc0-036d-4392-9962-6f0313231cf1', name: 'Kho Hà Nội', code: 'KHO_HN' },
    { id: 'c3f1bec8-1e98-4808-9a97-4ed15d407a90', name: 'Showroom Quận 1', code: 'SR_Q1' },
    { id: 'eec08fe7-3c73-4e29-b124-4001e51eaed7', name: 'Showroom Thủ Đức', code: 'SR_THU_DUC' }
  ];

  get activeWarehouses() {
    return this.warehouses.length > 0 ? this.warehouses : this.fallbackWarehouses;
  }

  get availableProducts() {
    if (this.fetchedProducts.length > 0) return this.fetchedProducts;
    if (this.products && this.products.length > 0) return this.products;
    return [];
  }

  // Quản lý thông tin chứng từ
  orderCode = '';
  orderSequence = '';
  transactionDate = '';
  creatorName = 'Admin Quản Trị';
  recipientName = '';
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

  exportReasonOptions = [
    'Xuất bán lẻ / Dự án',
    'Chuyển kho (Luân chuyển)',
    'Xuất trả nhà cung cấp',
    'Hư hỏng, thất thoát (Xuất hủy)',
    'Trưng bày mẫu / Dùng nội bộ',
    'Khác'
  ];

  importReasonOptions = [
    'Nhập từ Nhà cung cấp',
    'Nhập chuyển kho đến',
    'Nhập thu hồi / Đổi trả khách hàng',
    'Nhập cân bằng kiểm kê',
    'Khác'
  ];

  get currentReasonOptions(): string[] {
    return this.type === 'export' ? this.exportReasonOptions : this.importReasonOptions;
  }

  ngOnInit() {
    this.loadBackendData();
  }

  loadBackendData() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
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
    // Ngày giờ mặc định hiện tại
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    this.transactionDate = localIso;

    // Số thứ tự 4 số ngẫu nhiên hoặc tự tăng
    this.orderSequence = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');

    this.creatorName = 'Admin Quản Trị';
    this.recipientName = '';
    this.transactionLocation = this.activeWarehouses[0]?.id || '';
    this.transactionReason = this.type === 'export' ? 'Xuất bán lẻ / Dự án' : 'Nhập từ Nhà cung cấp';
    this.transactionDestination = '';
    this.transactionNote = '';
    this.showLocationDropdown = false;
    this.showReasonDropdown = false;
    this.showDestDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
    this.productSearchTerm = '';

    // Khởi tạo mã phiếu
    this.generateOrderCode();

    // Dòng sản phẩm ban đầu
    const initialUnit = this.inferUnit(this.getProductName(this.initialProductId));
    this.lineItems = [{
      id: Date.now().toString(),
      productId: this.initialProductId,
      variantId: this.initialVariantId,
      quantity: '',
      price: '',
      unit: initialUnit,
      isProductFixed: this.isProductFixed,
      isVariantFixed: this.isVariantFixed,
    }];

    // Nếu đã có initialProductId, chọn variant đầu tiên nếu chưa có
    if (this.initialProductId && !this.initialVariantId) {
      const vars = this.getVariantsForProduct(this.initialProductId);
      if (vars.length > 0) {
        this.lineItems[0].variantId = vars[0].id;
      }
    }
  }

  // --- LOGIC SINH MÃ PHIẾU XUẤT / NHẬP ---
  getPrefixForReasonText(reason: string): string {
    if (this.type === 'import') {
      return 'PNK-NCC';
    }
    const r = (reason || '').toLowerCase();
    if (r.includes('bán') || r.includes('dự án') || r.includes('khách')) return 'PXK-BH';
    if (r.includes('chuyển kho') || r.includes('luân chuyển')) return 'PXK-CK';
    if (r.includes('trả') || r.includes('ncc') || r.includes('nhà cung cấp')) return 'PXK-NCC';
    if (r.includes('hủy') || r.includes('hư hỏng') || r.includes('thất thoát')) return 'PXK-HUY';
    if (r.includes('nội bộ') || r.includes('trưng bày') || r.includes('mẫu')) return 'PXK-NB';
    return 'PXK-KHAC';
  }

  generateOrderCode() {
    const prefix = this.getPrefixForReasonText(this.transactionReason);
    let dateObj = new Date();
    if (this.transactionDate) {
      const parsed = new Date(this.transactionDate);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
    const yy = dateObj.getFullYear().toString().slice(-2);
    const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const yymm = `${yy}${mm}`;
    
    if (!this.orderSequence) {
      this.orderSequence = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
    }

    this.orderCode = `${prefix}-${yymm}-${this.orderSequence}`;
  }

  onDateChange() {
    this.generateOrderCode();
  }

  inferUnit(productName: string): string {
    const name = (productName || '').toLowerCase();
    if (name.includes('sofa') || name.includes('bàn ăn') || name.includes('bộ')) return 'Bộ';
    if (name.includes('ghế') || name.includes('bàn') || name.includes('tủ') || name.includes('kệ') || name.includes('đèn') || name.includes('giường')) return 'Chiếc';
    return 'Cái';
  }

  // --- TỒN KHO & VALIDATION ---
  getVariantStock(item: LineItem): number {
    if (!item.productId || !item.variantId) return 0;
    const p = this.availableProducts.find((x: any) => x.id === item.productId);
    if (!p || !p.variants) return 0;
    const v = p.variants.find((x: any) => x.id === item.variantId);
    if (!v) return 0;

    if (this.transactionLocation) {
      if (v.warehouseStocks && Array.isArray(v.warehouseStocks) && v.warehouseStocks.length > 0) {
        const ws = v.warehouseStocks.find((w: any) => 
          w.warehouseId === this.transactionLocation || 
          w.warehouse?.name === this.transactionLocation ||
          w.warehouse?.code === this.transactionLocation
        );
        if (ws) {
          return Math.max(0, ws.physicalStock - (ws.reservedStock || 0));
        }
      }
      // Fallback nếu chưa có phân bổ kho riêng
      return Math.max(0, Math.floor((v.stock || 0) / 4));
    }
    return v.stock || 0;
  }

  isQuantityExceeded(item: LineItem): boolean {
    if (this.type !== 'export') return false;
    if (!item.productId || !item.variantId) return false;
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0) return false;
    const stock = this.getVariantStock(item);
    return qty > stock;
  }

  hasExceededStock(): boolean {
    if (this.type !== 'export') return false;
    return this.lineItems.some(it => this.isQuantityExceeded(it));
  }

  getTotalQuantity(): number {
    return this.lineItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0);
  }

  // --- DROPDOWN LABELS ---
  getLocationLabel(): string {
    if (!this.transactionLocation) return 'Chọn chi nhánh / kho';
    const w = this.activeWarehouses.find((x: any) => x.id === this.transactionLocation || x.name === this.transactionLocation);
    return w ? `${w.name} (${w.code})` : this.transactionLocation;
  }

  getDestLabel(): string {
    if (!this.transactionDestination) return 'Chọn kho nhận';
    const w = this.activeWarehouses.find((x: any) => x.id === this.transactionDestination || x.name === this.transactionDestination);
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
    this.generateOrderCode();
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
    return this.type === 'import' ? '1.8fr 1.6fr 80px 105px 130px 40px' : '1.8fr 1.6fr 80px 105px 40px';
  }

  getQuantity(item: LineItem): number {
    return parseInt(item.quantity, 10) || 0;
  }

  increaseQuantity(item: LineItem) {
    if (!item.productId || !item.variantId) return;
    const current = this.getQuantity(item);
    const maxStock = this.getVariantStock(item);
    if (this.type === 'export' && current >= maxStock) {
      return; // Không tăng vượt quá tồn kho
    }
    this.updateLineItem(item.id, 'quantity', String(current + 1));
  }

  decreaseQuantity(item: LineItem) {
    if (!item.productId || !item.variantId) return;
    const current = this.getQuantity(item);
    if (current > 0) {
      this.updateLineItem(item.id, 'quantity', String(current - 1));
    }
  }

  onQuantityKeydown(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (allowedKeys.includes(event.key)) {
      return;
    }
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onQuantityInput(item: LineItem, event: any) {
    const rawValue = event.target ? event.target.value : event;
    const cleanValue = String(rawValue || '').replace(/[^0-9]/g, '');
    this.updateLineItem(item.id, 'quantity', cleanValue);
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
        price: v.price || 0,
        warehouseStocks: v.warehouseStocks || []
      }));
    }
    return [
      { id: 'v_default', name: 'Tiêu chuẩn', sku: p?.sku || 'SKU-STD', price: p?.price || 0, warehouseStocks: [] }
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
      unit: 'Chiếc',
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
      item.unit = this.inferUnit(this.getProductName(value));
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

  buildFormData(status: 'PENDING' | 'COMPLETED', action: 'draft' | 'confirm') {
    const sourceWarehouse = this.activeWarehouses.find((w: any) => w.id === this.transactionLocation || w.name === this.transactionLocation);
    const destWarehouse = this.activeWarehouses.find((w: any) => w.id === this.transactionDestination || w.name === this.transactionDestination);

    return {
      action,
      status,
      type: this.type,
      orderCode: this.orderCode,
      createdAt: this.transactionDate ? new Date(this.transactionDate).toISOString() : new Date().toISOString(),
      creatorName: this.creatorName,
      recipientName: this.recipientName,
      location: sourceWarehouse ? sourceWarehouse.name : this.transactionLocation,
      sourceWarehouseId: sourceWarehouse ? sourceWarehouse.id : null,
      reason: this.transactionReason,
      destination: destWarehouse ? destWarehouse.name : (this.recipientName || 'Khách hàng / Đối tác'),
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
          unit: item.unit || 'Chiếc'
        };
      })
    };
  }

  // --- NÚT 2: LƯU NHÁP (Draft) ---
  handleSaveDraft() {
    if (!this.transactionLocation) return window.alert('Vui lòng chọn chi nhánh/kho trước khi lưu nháp.');
    if (this.type === 'export' && !this.transactionReason) return window.alert('Vui lòng chọn lý do xuất.');

    const validItems = this.lineItems.filter(it => it.productId && it.variantId);
    if (validItems.length === 0) {
      return window.alert('Vui lòng chọn ít nhất một sản phẩm và biến thể để lưu nháp.');
    }

    const data = this.buildFormData('PENDING', 'draft');
    this.onSubmit.emit(data);
  }

  // --- NÚT 3: TẠO PHIẾU XUẤT (Hoàn thành / Xác nhận trừ kho) ---
  handleSubmitConfirmed() {
    if (!this.transactionLocation) return window.alert('Vui lòng chọn chi nhánh/kho.');
    if (this.type === 'export' && !this.transactionReason) return window.alert('Vui lòng chọn lý do xuất.');

    if (this.transactionReason.includes('Chuyển kho') && !this.transactionDestination) {
      return window.alert('Vui lòng chọn kho nhận cho lệnh chuyển kho.');
    }

    const invalidItems = this.lineItems.filter((item: any) => !item.productId || !item.variantId || !item.quantity || parseInt(item.quantity, 10) <= 0);
    if (invalidItems.length > 0) {
      return window.alert('Vui lòng điền đầy đủ thông tin Sản phẩm, Biến thể và Số lượng (lớn hơn 0) cho tất cả các dòng.');
    }

    // Chặn nếu có sản phẩm vượt quá tồn kho thực tế
    if (this.type === 'export' && this.hasExceededStock()) {
      return window.alert('Không thể tạo phiếu xuất! Có sản phẩm có số lượng xuất vượt quá tồn kho khả dụng của chi nhánh đã chọn. Vui lòng kiểm tra và điều chỉnh lại số lượng.');
    }

    const data = this.buildFormData('COMPLETED', 'confirm');
    this.onSubmit.emit(data);
  }
}
