import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  X, Plus, Minus, Trash2, Filter, Search, ChevronUp, ChevronDown, 
  Lock, Calendar, User, FileText, CheckCircle2, AlertCircle, Save,
  CheckSquare, Square, Package, Percent, Play, Printer, Ban, Pencil, RotateCcw, Clock,
  Loader2, ArrowLeftRight
} from 'lucide-angular';
import { environment } from '../../../../../environments/environment';

export interface ActionLogItem {
  id?: string;
  timestamp: string;
  operator: string;
  actionType: 'CREATE' | 'STATUS_CHANGE' | 'SAVE_PROGRESS' | 'CANCEL' | 'UPDATE';
  actionLabel?: string;
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
  details?: string;
}

export interface LineItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: string;
  price: string;
  unit: string;
  lotNumber?: string;
  expiryDate?: string;
  isProductFixed: boolean;
  isVariantFixed: boolean;
  productNameDisplay?: string;
  variantNameDisplay?: string;
  skuDisplay?: string;
}

@Component({
  selector: 'app-transaction-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  styles: [`
    .custom-dropdown-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #8d674b rgba(118, 83, 55, 0.08);
    }
    .custom-dropdown-scrollbar::-webkit-scrollbar {
      width: 7px;
    }
    .custom-dropdown-scrollbar::-webkit-scrollbar-track {
      background: rgba(118, 83, 55, 0.08);
      border-radius: 6px;
      margin: 4px 0;
    }
    .custom-dropdown-scrollbar::-webkit-scrollbar-thumb {
      background: #8d674b;
      border-radius: 6px;
      cursor: pointer;
    }
    .custom-dropdown-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #5a3d26;
    }
    .dropdown-option-item {
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 3px;
      background: transparent;
      transition: background 0.12s ease;
    }
    .dropdown-option-item:hover {
      background: var(--bg-secondary) !important;
    }
    .dropdown-option-item.selected {
      background: rgba(194, 154, 107, 0.15) !important;
    }
    .dropdown-menu-item {
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      background: transparent;
      transition: background 0.12s ease;
    }
    .dropdown-menu-item:hover {
      background: var(--bg-secondary) !important;
    }
    .dropdown-menu-item.selected {
      background: rgba(194, 154, 107, 0.15) !important;
      color: var(--accent) !important;
    }
    .filter-dropdown-wrapper {
      position: relative;
      flex-shrink: 0;
    }
    .filter-trigger-btn {
      width: 100%;
      height: 38px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
      padding: 0 7px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-primary);
      color: var(--text-primary);
      cursor: pointer;
      font-size: 12.5px;
      transition: all 0.15s ease;
      user-select: none;
      white-space: nowrap;
    }
    .filter-trigger-btn:hover {
      border-color: var(--accent);
      background: var(--bg-secondary);
    }
    .filter-trigger-btn.active {
      border-color: var(--accent);
      color: var(--accent);
      background: rgba(245, 128, 37, 0.05);
      font-weight: 500;
    }
    .trigger-label {
      display: flex;
      align-items: center;
      gap: 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
      flex: 1;
    }
    .trigger-icon {
      flex-shrink: 0;
      color: var(--text-secondary);
    }
    .filter-trigger-btn.active .trigger-icon {
      color: var(--accent);
    }
    .truncate-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: inline-block;
      min-width: 0;
      font-size: 12.5px;
    }
    .filter-menu-dropdown {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      min-width: 85px;
      width: max-content;
      max-width: 140px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
      z-index: 1050;
      padding: 4px;
      max-height: 200px;
      overflow-y: auto;
      animation: fadeInDown 0.15s ease;
    }
    .filter-menu-item {
      padding: 7px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12.5px;
      color: var(--text-primary);
      text-align: center;
      transition: background 0.15s ease;
      user-select: none;
    }
    .filter-menu-item:hover {
      background: var(--bg-secondary);
    }
    .filter-menu-item.selected {
      color: var(--accent);
      font-weight: 600;
      background: rgba(245, 128, 37, 0.08);
    }
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translate(-50%, -6px);
      }
      to {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    }
    .tax-dropdown-menu {
      position: absolute;
      left: 0 !important;
      right: auto !important;
      transform: none !important;
      min-width: 104px;
      width: 104px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
      z-index: 1050;
      padding: 4px;
      max-height: 200px;
      overflow-y: auto;
      animation: fadeInSimple 0.12s ease-out !important;
    }
    @keyframes fadeInSimple {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes toastSlideDown {
      0% {
        opacity: 0;
        transform: translate(-50%, -24px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
      }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes toastProgress {
      from { width: 100%; }
      to { width: 0%; }
    }
    /* Confirm Discard Modal */
    .confirm-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3100;
      padding: 16px;
      backdrop-filter: blur(2px);
      animation: fadeInSimple 0.15s ease-out;
    }
    .confirm-modal-card {
      background: var(--bg-primary);
      border-radius: 12px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color);
      overflow: hidden;
      animation: modalScaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalScaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .confirm-modal-header {
      padding: 20px 20px 16px 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }
    .confirm-modal-icon-wrapper.warning {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .confirm-close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-muted);
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .confirm-close-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    .confirm-modal-footer {
      padding: 14px 20px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `],
  template: `
    <div *ngIf="isOpen" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(2px);">
      
      <!-- Floating Toast Cảnh Báo Tồn Kho Khả Dụng = 0 (Phiếu Xuất) -->
      <div *ngIf="showToast" 
        style="position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 99999; min-width: 380px; max-width: 620px; width: max-content; background: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 45px -8px rgba(0,0,0,0.25), 0 0 0 1px rgba(239, 68, 68, 0.25); border-left: 5px solid #ef4444; padding: 14px 18px 12px; animation: toastSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; display: flex; flex-direction: column; gap: 10px; pointer-events: auto;">
        
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ef4444;">
            <lucide-angular [img]="icons.AlertCircle" size="22"></lucide-angular>
          </div>
          
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <span style="font-size: 13.5px; font-weight: 700; color: #ef4444; display: flex; align-items: center; gap: 8px;">
                {{ toastMessage }}
                <span style="font-size: 11px; font-weight: 600; padding: 1.5px 7px; border-radius: 4px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); white-space: nowrap;">
                  Tồn khả dụng = 0
                </span>
              </span>
              <button 
                type="button" 
                (click)="closeToast()" 
                style="background: transparent; border: none; cursor: pointer; color: var(--text-muted, #9ca3af); padding: 2px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: color 0.15s;"
                onmouseover="this.style.color='var(--text-primary, #1f2937)'"
                onmouseout="this.style.color='var(--text-muted, #9ca3af)'"
                title="Đóng thông báo"
              >
                <lucide-angular [img]="icons.X" size="16"></lucide-angular>
              </button>
            </div>
            <p style="margin: 0; font-size: 12.5px; color: var(--text-secondary, #4b5563); line-height: 1.45; word-break: break-word;">
              {{ toastSubMessage }}
            </p>
          </div>
        </div>

        <!-- Countdown Progress Bar -->
        <div style="width: 100%; height: 3px; background: rgba(239, 68, 68, 0.15); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; background: #ef4444; border-radius: 2px; animation: toastProgress 5s linear forwards;"></div>
        </div>
      </div>

      <div style="background: var(--bg-primary); border-radius: 14px; width: 1260px; max-width: 96vw; height: 88vh; min-height: 580px; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,0.2); border: 1px solid var(--border-color); overflow: hidden; position: relative;">
        
        <!-- Header -->
        <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); z-index: 20; position: relative;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div [ngStyle]="{'background': type === 'export' ? '#fef2f2' : '#f0fdf4', 'color': type === 'export' ? '#ef4444' : '#10b981'}" style="width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <lucide-angular [img]="icons.FileText" size="20"></lucide-angular>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <h2 style="font-size: 16px; font-weight: 700; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                <ng-container *ngIf="!isViewMode">
                  {{ type === 'import' ? 'Tạo phiếu Nhập kho' : 'Tạo phiếu Xuất kho' }}
                </ng-container>
                <ng-container *ngIf="isViewMode">
                  <span>{{ type === 'import' ? 'Phiếu nhập kho' : 'Phiếu xuất kho' }}</span>
                  <span style="font-family: monospace; color: var(--accent); font-size: 16px;">{{ viewOrderData?.auditCode || viewOrderData?.id }}</span>
                </ng-container>
              </h2>
              <ng-container *ngIf="isViewMode">
                <span style="color: var(--text-muted); font-size: 14px; font-weight: 400; margin: 0 2px;">-</span>
                <span [ngStyle]="{'background': getViewStatusBg(), 'color': getViewStatusColor()}" style="font-size: 11.5px; font-weight: 600; padding: 2px 10px; border-radius: 20px; letter-spacing: 0.3px;">{{ getViewStatusLabel() }}</span>
                <span style="font-size: 12px; color: var(--text-muted);">{{ formatDisplayDate(viewOrderData?.date || viewOrderData?.createdAt) }}</span>
                <span *ngIf="viewOrderData?.linkedTransferCode" style="font-size: 11.5px; font-weight: 500; padding: 2px 8px; border-radius: 6px; background: rgba(14, 165, 233, 0.08); color: #0284c7; border: 1px solid rgba(14, 165, 233, 0.25); display: inline-flex; align-items: center; gap: 4px;" [title]="'Phiếu liên kết đối ứng: ' + viewOrderData?.linkedTransferCode">
                  <lucide-angular [img]="icons.ArrowLeftRight" size="12"></lucide-angular>
                  <span>Liên kết: {{ viewOrderData?.linkedTransferCode }}</span>
                </span>
              </ng-container>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <!-- Nút [Sửa] trên header khi là bản nháp và chưa bấm sửa -->
            <button *ngIf="isViewMode && isDraft && !isEditingDraft" type="button" (click)="startEditDraft()"
              [disabled]="isAnyActionProcessing"
              [style.opacity]="isAnyActionProcessing ? '0.5' : '1'"
              [style.cursor]="isAnyActionProcessing ? 'not-allowed' : 'pointer'"
              style="display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 13px; font-weight: 600; transition: all 0.15s; cursor: pointer;"
              onmouseover="if(!this.disabled) this.style.background='var(--bg-secondary)';"
              onmouseout="if(!this.disabled) this.style.background='var(--bg-primary)';"
              title="Chỉnh sửa thông tin phiếu nháp"
            >
              <lucide-angular [img]="icons.Pencil" size="14"></lucide-angular>
              Sửa
            </button>

            <button type="button" (click)="requestClose()" [disabled]="isAnyActionProcessing" [style.opacity]="isAnyActionProcessing ? '0.4' : '1'" [style.cursor]="isAnyActionProcessing ? 'not-allowed' : 'pointer'" class="admin-close-btn" style="background: transparent; border: none; color: var(--text-muted); padding: 6px; border-radius: 6px;" title="Đóng">
              <lucide-angular [img]="icons.X" size="20"></lucide-angular>
            </button>
          </div>
        </div>
        
        <!-- Body: scrollable container with clean padding -->
        <div class="modal-body-scroll" style="flex: 1; min-height: 0; padding: 20px 24px; overflow-y: auto; overflow-x: auto; display: flex; flex-direction: column; gap: 20px;">
          
          <!-- View-mode Lifecycle Banners -->
          <!-- Banner Tạm giữ hàng / Hàng đang về (Đã ẩn theo yêu cầu)
          <div *ngIf="isViewMode && isPlanned" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; background: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.25); color: #6d28d9; font-size: 13px;">
            <lucide-angular [img]="icons.AlertCircle" size="18" style="flex-shrink: 0; color: #7c3aed;"></lucide-angular>
            <div *ngIf="type === 'export'">
              <strong>Cơ chế Tạm giữ hàng (Reserved):</strong> Hệ thống đang tạm giữ số lượng sản phẩm cho phiếu xuất này. Tồn kho thực tế trên sổ sách chưa bị trừ cho đến khi bấm [Xác nhận Xuất kho]. Danh sách hàng hóa đã được khóa cố định.
            </div>
            <div *ngIf="type === 'import'">
              <strong>Cơ chế Hàng đang về (On-Order / Incoming Stock):</strong> Hệ thống ghi nhận số lượng hàng này đang trên đường về kho / chờ kiểm đếm. Tồn kho thực tế (Physical Stock) chưa cộng, nhưng hệ thống biết trước để lên kế hoạch xếp kệ. Danh sách hàng hóa đã được khóa cố định.
            </div>
          </div>
          -->

          <!-- Banner thông báo hoàn tất (Đã ẩn theo yêu cầu)
          <div *ngIf="isViewMode && isCompletedStock" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 8px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); color: #047857; font-size: 13px;">
            <lucide-angular [img]="icons.CheckCircle2" size="18" style="flex-shrink: 0; color: #10b981;"></lucide-angular>
            <div *ngIf="type === 'export'">
              <strong>Đã xuất kho thành công:</strong> Hàng hóa đã bàn giao, tồn kho thực tế của chi nhánh đã được trừ chính thức và chứng từ đã khóa vĩnh viễn (Read-only).
            </div>
            <div *ngIf="type === 'import'">
              <strong>Đã nhập kho thành công:</strong> Hàng hóa đã kiểm đếm đủ, tồn kho thực tế của kho nhận đã được cộng chính thức và chứng từ đã khóa vĩnh viễn (Read-only).
            </div>
          </div>
          -->

          <div *ngIf="isViewMode && isCancelled" style="display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 8px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); color: #b91c1c; font-size: 13px;">
            <lucide-angular [img]="icons.Ban" size="18" style="flex-shrink: 0; color: #ef4444; margin-top: 1px;"></lucide-angular>
            <div>
              <strong>Phiếu đã bị hủy:</strong> {{ getCancelReasonText() ? ('Lý do: ' + getCancelReasonText()) : 'Phiếu đã hủy và không còn hiệu lực trên hệ thống.' }}
            </div>
          </div>

          <!-- Banner trạng thái Nháp (Đã ẩn theo yêu cầu)
          <div *ngIf="isViewMode && isDraft && !isEditingDraft" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-radius: 8px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); color: #b45309; font-size: 13px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <lucide-angular [img]="icons.AlertCircle" size="16" style="flex-shrink: 0; color: #d97706;"></lucide-angular>
              <span>Phiếu đang ở trạng thái <strong>Nháp</strong>. Hàng hóa {{ type === 'import' ? 'chưa được cộng vào' : 'chưa bị trừ khỏi' }} kho. Bấm <strong>[Sửa]</strong> để thay đổi nội dung phiếu.</span>
            </div>
            <button type="button" (click)="startEditDraft()" style="padding: 5px 12px; border-radius: 6px; border: 1px solid #d97706; background: #fff; color: #b45309; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <lucide-angular [img]="icons.Pencil" size="13"></lucide-angular>
              Chỉnh sửa phiếu
            </button>
          </div>
          -->

          <!-- General Info Section -->
          <div [style.pointer-events]="isFormDisabled ? 'none' : 'auto'" [style.opacity]="isFormDisabled ? '0.95' : '1'" style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- FORM BỐ TRÍ DÀNH RIÊNG CHO PHIẾU XUẤT KHO -->
            <ng-container *ngIf="type === 'export'">
              <!-- Hàng 1: Mã phiếu xuất * | Người lập phiếu (hệ thống tự điền, khóa) -->
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; position: relative; z-index: 1;">
                <!-- 1. Mã phiếu xuất -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Mã phiếu xuất <span style="color: #ef4444;">*</span>
                  </label>
                  <div style="position: relative; width: 100%; min-width: 0;">
                    <input 
                      type="text" 
                      [value]="orderCode" 
                      readonly 
                      style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px 0 36px; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; font-size: 13px; color: #4f5966; cursor: not-allowed;"
                    />
                    <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; display: flex; align-items: center;">
                      <lucide-angular [img]="icons.Lock" size="14"></lucide-angular>
                    </div>
                  </div>
                </div>

                <!-- 2. Người lập phiếu (tự điền, khóa không cho chỉnh sửa) -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    <lucide-angular [img]="icons.User" size="14"></lucide-angular> Người lập phiếu
                  </label>
                  <div style="position: relative; width: 100%; min-width: 0;">
                    <input 
                      type="text" 
                      [value]="creatorName" 
                      readonly 
                      style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px 0 36px; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; font-size: 13px; color: #4f5966; cursor: not-allowed;"
                    />
                    <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; display: flex; align-items: center;">
                      <lucide-angular [img]="icons.Lock" size="14"></lucide-angular>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Hàng 2: Chi nhánh / Kho xuất * | Lý do xuất kho * | Chuyển đến -->
              <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; position: relative; z-index: 15;">
                <!-- 1. Chi nhánh / Kho xuất * -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Chi nhánh / Kho xuất <span style="color: #ef4444;">*</span>
                  </label>
                  <div class="location-filter-wrapper" style="position: relative; width: 100%; min-width: 0;">
                    <button 
                      type="button"
                      (click)="toggleLocationDropdown($event)"
                      [disabled]="isFormDisabled"
                      [title]="getLocationLabel()"
                      style="width: 100%; min-width: 0; height: 38px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border-radius: 8px; font-size: 13px; text-align: left;"
                      [ngStyle]="{
                        'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                        'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                        'cursor': isFormDisabled ? 'not-allowed' : 'pointer',
                        'opacity': isFormDisabled ? '0.85' : '1'
                      }"
                      [style.color]="isFormDisabled ? 'var(--text-muted)' : (transactionLocation ? 'var(--text-primary)' : 'var(--text-muted)')"
                    >
                      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                        <lucide-angular [img]="icons.Filter" size="14" style="flex-shrink: 0;"></lucide-angular>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                          {{ getLocationLabel() }}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;" [ngStyle]="{'transform': showLocationDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div *ngIf="showLocationDropdown" class="custom-dropdown-scrollbar" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 1050; padding: 4px 6px 4px 4px; max-height: 220px; overflow-y: auto;">
                      <div *ngFor="let w of activeWarehouses"
                        class="dropdown-menu-item"
                        [class.selected]="transactionLocation === w.id"
                        (click)="selectLocation(w.id, $event)"
                        [title]="w.name"
                        [style.color]="transactionLocation === w.id ? 'var(--accent)' : 'var(--text-primary)'"
                      >
                        {{ w.name }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. Lý do xuất kho * -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Lý do xuất kho <span style="color: #ef4444;">*</span>
                  </label>
                  <div style="position: relative; width: 100%; min-width: 0;">
                    <button 
                      type="button"
                      (click)="toggleReasonDropdown($event)"
                      [disabled]="isFormDisabled"
                      [title]="transactionReason || 'Chọn lý do xuất'"
                      style="width: 100%; min-width: 0; height: 38px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border-radius: 8px; font-size: 13px; text-align: left;"
                      [ngStyle]="{
                        'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                        'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                        'cursor': isFormDisabled ? 'not-allowed' : 'pointer',
                        'opacity': isFormDisabled ? '0.85' : '1'
                      }"
                      [style.color]="isFormDisabled ? 'var(--text-muted)' : (transactionReason ? 'var(--text-primary)' : 'var(--text-muted)')"
                    >
                      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                          {{ transactionReason || 'Chọn lý do xuất' }}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;" [ngStyle]="{'transform': showReasonDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div *ngIf="showReasonDropdown" class="custom-dropdown-scrollbar" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 1050; padding: 4px 6px 4px 4px; max-height: 260px; overflow-y: auto;">
                      <div *ngFor="let r of currentReasonOptions"
                        class="dropdown-menu-item"
                        [class.selected]="transactionReason === r"
                        (click)="selectReason(r, $event)"
                        [style.color]="transactionReason === r ? 'var(--accent)' : 'var(--text-primary)'"
                        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
                      >
                        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; flex: 1; min-width: 0;">
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ r }}</span>
                        </div>
                        <span style="font-size: 11px; font-family: monospace; color: var(--text-muted); flex-shrink: 0;">
                          [{{ getPrefixForReasonText(r) }}]
                        </span>
                      </div>

                      <!-- Nút thêm lý do xuất mới dưới cùng -->
                      <div *ngIf="type === 'export'"
                        class="dropdown-menu-item"
                        (click)="openAddReasonModal($event)"
                        style="color: var(--accent); border-top: 1px dashed var(--border-color); display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12.5px; font-weight: 500;"
                      >
                        <lucide-angular [img]="icons.Plus" size="14"></lucide-angular>
                        <span>Thêm lý do xuất</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3. Chuyển đến: Tinh chỉnh linh hoạt theo từng lý do xuất kho -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <!-- 1. Chuyển kho -> Kho đích * -->
                  <ng-container *ngIf="transactionReason.includes('Chuyển kho')">
                    <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                      Chuyển đến <span style="color: #ef4444;">*</span>
                    </label>
                    <div style="position: relative; width: 100%; min-width: 0;">
                      <button 
                        type="button"
                        (click)="toggleDestDropdown($event)"
                        [disabled]="isFormDisabled"
                        [title]="getDestLabel()"
                        style="width: 100%; min-width: 0; height: 38px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border-radius: 8px; font-size: 13px; text-align: left;"
                        [ngStyle]="{
                          'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                          'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                          'cursor': isFormDisabled ? 'not-allowed' : 'pointer',
                          'opacity': isFormDisabled ? '0.85' : '1'
                        }"
                        [style.color]="isFormDisabled ? 'var(--text-muted)' : (transactionDestination ? 'var(--text-primary)' : 'var(--text-muted)')"
                      >
                        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                            {{ getDestLabel() }}
                          </span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;" [ngStyle]="{'transform': showDestDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>
                      <div *ngIf="showDestDropdown" class="custom-dropdown-scrollbar" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 1050; padding: 4px 6px 4px 4px; max-height: 220px; overflow-y: auto;">
                        <ng-container *ngFor="let w of activeWarehouses">
                          <div *ngIf="w.id !== transactionLocation"
                            class="dropdown-menu-item"
                            [class.selected]="transactionDestination === w.id"
                            (click)="selectDest(w.id, $event)"
                            [title]="w.name"
                            [style.color]="transactionDestination === w.id ? 'var(--accent)' : 'var(--text-primary)'"
                          >
                            {{ w.name }}
                          </div>
                        </ng-container>
                      </div>
                    </div>
                  </ng-container>

                  <!-- 2. Đã chọn lý do và lý do KHÔNG yêu cầu đối tác (Hủy hàng hỏng...) -> Khóa trường lại -->
                  <ng-container *ngIf="transactionReason && !transactionReason.includes('Chuyển kho') && !isReasonRequiringPartner(transactionReason)">
                    <label style="font-size: 13px; font-weight: 400; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                      Chuyển đến
                    </label>
                    <div style="position: relative; width: 100%; min-width: 0;">
                      <input 
                        type="text" 
                        value="" 
                        readonly 
                        disabled
                        placeholder="Không áp dụng" 
                        style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px 0 36px; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; font-size: 13px; color: #4f5966; cursor: not-allowed;" 
                      />
                      <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; display: flex; align-items: center;">
                        <lucide-angular [img]="icons.Lock" size="14"></lucide-angular>
                      </div>
                    </div>
                  </ng-container>

                  <!-- 3. Chưa chọn lý do HOẶC lý do có yêu cầu đối tác -> Đánh dấu * và KHÔNG KHÓA KHUNG -->
                  <ng-container *ngIf="!transactionReason.includes('Chuyển kho') && (!transactionReason || isReasonRequiringPartner(transactionReason))">
                    <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                      Chuyển đến <span style="color: #ef4444;">*</span>
                    </label>
                    <div style="position: relative; width: 100%; min-width: 0;">
                      <input 
                        type="text" 
                        [(ngModel)]="recipientName" 
                        [disabled]="isFormDisabled"
                        [readonly]="isFormDisabled"
                        [attr.list]="getPartnerLabelForReason(transactionReason).toLowerCase().includes('cung') ? 'supplierListSuggestionsExport' : null"
                        [placeholder]="transactionReason ? ('Nhập thông tin chuyển đến (' + getPartnerLabelForReason(transactionReason).toLowerCase() + ')...') : 'Nhập thông tin chuyển đến (Khách hàng, Đối tác)...'" 
                        style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px; border-radius: 8px; font-size: 13px; outline: none;" 
                        [ngStyle]="{
                          'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                          'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                          'color': isFormDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                          'cursor': isFormDisabled ? 'not-allowed' : 'text'
                        }"
                      />
                      <datalist id="supplierListSuggestionsExport">
                        <option *ngFor="let s of supplierOptions" [value]="s"></option>
                      </datalist>
                    </div>
                  </ng-container>
                </div>
              </div>

              <!-- Hàng 3: Chứng từ gốc | Ghi chú -->
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; position: relative; z-index: 1;">
                <!-- 1. Chứng từ gốc -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Chứng từ gốc
                  </label>
                  <input 
                    type="text" 
                    [(ngModel)]="referenceCode" 
                    [disabled]="isFormDisabled"
                    [readonly]="isFormDisabled"
                    placeholder="Nhập số hóa đơn / Mã SO / Chứng từ gốc (nếu có)..." 
                    style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px; border-radius: 8px; font-size: 13px; outline: none;" 
                    [ngStyle]="{
                      'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                      'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                      'color': isFormDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                      'cursor': isFormDisabled ? 'not-allowed' : 'text'
                    }"
                  />
                </div>

                <!-- 2. Ghi chú -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">Ghi chú</label>
                  <input 
                    type="text" 
                    [(ngModel)]="transactionNote" 
                    [disabled]="isFormDisabled"
                    [readonly]="isFormDisabled"
                    placeholder="Nhập thông tin ghi chú kèm theo phiếu (nếu có)..." 
                    style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px; border-radius: 8px; font-size: 13px; outline: none;" 
                    [ngStyle]="{
                      'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                      'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                      'color': isFormDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                      'cursor': isFormDisabled ? 'not-allowed' : 'text'
                    }"
                  />
                </div>
              </div>
            </ng-container>

            <!-- FORM BỐ TRÍ DÀNH RIÊNG CHO PHIẾU NHẬP KHO -->
            <ng-container *ngIf="type === 'import'">
              <!-- Hàng 1: Mã phiếu nhập * | Người lập phiếu (hệ thống tự điền, khóa) -->
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; position: relative; z-index: 1;">
                <!-- 1. Mã phiếu nhập -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Mã phiếu nhập <span style="color: #ef4444;">*</span>
                  </label>
                  <div style="position: relative; width: 100%; min-width: 0;">
                    <input 
                      type="text" 
                      [value]="orderCode" 
                      readonly 
                      style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px 0 36px; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; font-size: 13px; color: #4f5966; cursor: not-allowed;"
                    />
                    <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; display: flex; align-items: center;">
                      <lucide-angular [img]="icons.Lock" size="14"></lucide-angular>
                    </div>
                  </div>
                </div>

                <!-- 2. Người lập phiếu (hệ thống tự điền, khóa không cho chỉnh sửa) -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    <lucide-angular [img]="icons.User" size="14"></lucide-angular> Người lập phiếu
                  </label>
                  <div style="position: relative; width: 100%; min-width: 0;">
                    <input 
                      type="text" 
                      [value]="creatorName" 
                      readonly 
                      style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px 0 36px; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; font-size: 13px; color: #4f5966; cursor: not-allowed;"
                    />
                    <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; display: flex; align-items: center;">
                      <lucide-angular [img]="icons.Lock" size="14"></lucide-angular>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Hàng 2: Kho đích nhập về * | Lý do nhập kho * | Nhận từ -->
              <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; position: relative; z-index: 15;">
                <!-- 1. Kho đích nhập về * -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Kho đích nhập về <span style="color: #ef4444;">*</span>
                  </label>
                  <div class="location-filter-wrapper" style="position: relative; width: 100%; min-width: 0;">
                    <button 
                      type="button"
                      (click)="toggleLocationDropdown($event)"
                      [disabled]="isFormDisabled"
                      [title]="getLocationLabel()"
                      style="width: 100%; min-width: 0; height: 38px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border-radius: 8px; font-size: 13px; text-align: left;"
                      [ngStyle]="{
                        'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                        'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                        'cursor': isFormDisabled ? 'not-allowed' : 'pointer',
                        'opacity': isFormDisabled ? '0.85' : '1'
                      }"
                      [style.color]="isFormDisabled ? 'var(--text-muted)' : (transactionLocation ? 'var(--text-primary)' : 'var(--text-muted)')"
                    >
                      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                        <lucide-angular [img]="icons.Filter" size="14" style="flex-shrink: 0;"></lucide-angular>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                          {{ getLocationLabel() }}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;" [ngStyle]="{'transform': showLocationDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div *ngIf="showLocationDropdown" class="custom-dropdown-scrollbar" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 1050; padding: 4px 6px 4px 4px; max-height: 220px; overflow-y: auto;">
                      <div *ngFor="let w of activeWarehouses"
                        (click)="selectLocation(w.id, $event)"
                        style="padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; background: transparent; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                        [title]="w.name"
                        [ngStyle]="{'color': transactionLocation === w.id ? 'var(--accent)' : 'var(--text-primary)', 'font-weight': '400'}"
                        onmouseover="this.style.background='var(--bg-secondary)'"
                        onmouseout="this.style.background='transparent'"
                      >
                        {{ w.name }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. Lý do nhập kho * -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Lý do nhập kho <span style="color: #ef4444;">*</span>
                  </label>
                  <div style="position: relative; width: 100%; min-width: 0;">
                    <button 
                      type="button"
                      (click)="toggleReasonDropdown($event)"
                      [disabled]="isFormDisabled"
                      [title]="transactionReason || 'Chọn lý do nhập'"
                      style="width: 100%; min-width: 0; height: 38px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border-radius: 8px; font-size: 13px; text-align: left;"
                      [ngStyle]="{
                        'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                        'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                        'cursor': isFormDisabled ? 'not-allowed' : 'pointer',
                        'opacity': isFormDisabled ? '0.85' : '1'
                      }"
                      [style.color]="isFormDisabled ? 'var(--text-muted)' : (transactionReason ? 'var(--text-primary)' : 'var(--text-muted)')"
                    >
                      <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                          {{ transactionReason || 'Chọn lý do nhập' }}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;" [ngStyle]="{'transform': showReasonDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <div *ngIf="showReasonDropdown" class="custom-dropdown-scrollbar" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 1050; padding: 4px 6px 4px 4px; max-height: 260px; overflow-y: auto;">
                      <div *ngFor="let r of currentReasonOptions"
                        class="dropdown-menu-item"
                        [class.selected]="transactionReason === r"
                        (click)="selectReason(r, $event)"
                        [style.color]="transactionReason === r ? 'var(--accent)' : 'var(--text-primary)'"
                        style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"
                      >
                        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; flex: 1; min-width: 0;">
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ r }}</span>
                        </div>
                        <span style="font-size: 11px; font-family: monospace; color: var(--text-muted); flex-shrink: 0;">
                          [{{ getPrefixForReasonText(r) }}]
                        </span>
                      </div>

                      <!-- Nút thêm lý do nhập mới dưới cùng -->
                      <div 
                        class="dropdown-menu-item"
                        (click)="openAddReasonModal($event)"
                        style="color: var(--accent); border-top: 1px dashed var(--border-color); display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12.5px; font-weight: 500;"
                      >
                        <lucide-angular [img]="icons.Plus" size="14"></lucide-angular>
                        <span>Thêm lý do nhập</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3. Nhận từ: Tinh chỉnh linh hoạt theo từng lý do nhập kho -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <!-- Trường hợp 1: Nhập chuyển kho -> Chọn Kho xuất * -->
                  <ng-container *ngIf="isImportTransfer()">
                    <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                      Nhận từ <span style="color: #ef4444;">*</span>
                    </label>
                    <div style="position: relative; width: 100%; min-width: 0;">
                      <button 
                        type="button"
                        (click)="toggleDestDropdown($event)"
                        [disabled]="isFormDisabled"
                        [title]="getDestLabel()"
                        style="width: 100%; min-width: 0; height: 38px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border-radius: 8px; font-size: 13px; text-align: left;"
                        [ngStyle]="{
                          'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                          'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                          'cursor': isFormDisabled ? 'not-allowed' : 'pointer',
                          'opacity': isFormDisabled ? '0.85' : '1'
                        }"
                        [style.color]="isFormDisabled ? 'var(--text-muted)' : (transactionDestination ? 'var(--text-primary)' : 'var(--text-muted)')"
                      >
                        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; flex: 1; min-width: 0;">
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;">
                            {{ getDestLabel() }}
                          </span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;" [ngStyle]="{'transform': showDestDropdown ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s'}"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>
                      <div *ngIf="showDestDropdown" class="custom-dropdown-scrollbar" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); z-index: 1050; padding: 4px 6px 4px 4px; max-height: 220px; overflow-y: auto;">
                        <ng-container *ngFor="let w of activeWarehouses">
                          <div *ngIf="w.id !== transactionLocation"
                            class="dropdown-menu-item"
                            [class.selected]="transactionDestination === w.id"
                            (click)="selectDest(w.id, $event)"
                            [title]="w.name"
                            [style.color]="transactionDestination === w.id ? 'var(--accent)' : 'var(--text-primary)'"
                          >
                            {{ w.name }}
                          </div>
                        </ng-container>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Trường hợp 2: Đã chọn lý do và lý do KHÔNG yêu cầu đối tác (Dư sau kiểm kê...) -> Khóa trường lại -->
                  <ng-container *ngIf="transactionReason && !isImportTransfer() && !isReasonRequiringPartner(transactionReason)">
                    <label style="font-size: 13px; font-weight: 400; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                      Nhận từ
                    </label>
                    <div style="position: relative; width: 100%; min-width: 0;">
                      <input 
                        type="text" 
                        value="" 
                        readonly 
                        disabled
                        placeholder="Không áp dụng" 
                        style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px 0 36px; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; font-size: 13px; color: #4f5966; cursor: not-allowed;" 
                      />
                      <div style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; display: flex; align-items: center;">
                        <lucide-angular [img]="icons.Lock" size="14"></lucide-angular>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Trường hợp 3: Chưa chọn lý do HOẶC lý do có yêu cầu đối tác -> Đánh dấu * và KHÔNG KHÓA KHUNG -->
                  <ng-container *ngIf="!isImportTransfer() && (!transactionReason || isReasonRequiringPartner(transactionReason))">
                    <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                      Nhận từ <span style="color: #ef4444;">*</span>
                    </label>
                    <div style="position: relative; width: 100%; min-width: 0;">
                      <input 
                        type="text" 
                        [(ngModel)]="recipientName" 
                        [disabled]="isFormDisabled"
                        [readonly]="isFormDisabled"
                        [attr.list]="getPartnerLabelForReason(transactionReason).toLowerCase().includes('khách') ? null : 'supplierListSuggestions'"
                        [placeholder]="transactionReason ? ('Nhập thông tin nhận từ (' + getPartnerLabelForReason(transactionReason).toLowerCase() + ')...') : 'Nhập thông tin nhận từ (Nhà cung ứng, Đối tác)...'" 
                        style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px; border-radius: 8px; font-size: 13px; outline: none;" 
                        [ngStyle]="{
                          'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                          'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                          'color': isFormDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                          'cursor': isFormDisabled ? 'not-allowed' : 'text'
                        }"
                      />
                      <datalist id="supplierListSuggestions">
                        <option *ngFor="let s of supplierOptions" [value]="s"></option>
                      </datalist>
                    </div>
                  </ng-container>
                </div>
              </div>

              <!-- Hàng 3: Chứng từ gốc | Ghi chú -->
              <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; position: relative; z-index: 1;">
                <!-- 1. Chứng từ gốc -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                    Chứng từ gốc
                  </label>
                  <input 
                    type="text" 
                    [(ngModel)]="referenceCode" 
                    [disabled]="isFormDisabled"
                    [readonly]="isFormDisabled"
                    placeholder="Nhập số hóa đơn VAT / Mã PO (nếu có)..." 
                    style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px; border-radius: 8px; font-size: 13px; outline: none;" 
                    [ngStyle]="{
                      'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                      'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                      'color': isFormDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                      'cursor': isFormDisabled ? 'not-allowed' : 'text'
                    }"
                  />
                </div>

                <!-- 2. Ghi chú -->
                <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
                  <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">Ghi chú</label>
                  <input 
                    type="text" 
                    [(ngModel)]="transactionNote" 
                    [disabled]="isFormDisabled"
                    [readonly]="isFormDisabled"
                    placeholder="Nhập thông tin ghi chú kèm theo phiếu (nếu có)..." 
                    style="width: 100%; height: 38px; box-sizing: border-box; padding: 0 12px; border-radius: 8px; font-size: 13px; outline: none;" 
                    [ngStyle]="{
                      'background': isFormDisabled ? '#f1f1f1' : 'var(--bg-primary)',
                      'border': isFormDisabled ? '2px solid #c8c8c8' : '1px solid var(--border-color)',
                      'color': isFormDisabled ? 'var(--text-muted)' : 'var(--text-primary)',
                      'cursor': isFormDisabled ? 'not-allowed' : 'text'
                    }"
                  />
                </div>
              </div>
            </ng-container>

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
            
            <!-- Khối Bảng Sản phẩm: Thiết lập overflow: visible để dropdown Sản phẩm & Biến thể không bị cắt/khuất -->
            <div [style.pointer-events]="isFormDisabled ? 'none' : 'auto'" style="width: 100%; overflow: visible; position: relative;">
              <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; overflow: visible;">
                
                <!-- Table Headers -->
                <div [ngStyle]="{'display': 'grid', 'grid-template-columns': getGridColumns(), 'gap': '10px', 'padding': '10px 14px', 'background': 'var(--bg-secondary)', 'border-radius': '8px', 'border': '1px solid var(--border-color)'}">
                  <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: left; text-transform: uppercase;">Sản phẩm</div>
                  <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: left; text-transform: uppercase;">Biến thể</div>
                  <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: center; white-space: nowrap; text-transform: uppercase;">Tồn kho</div>
                  <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: center; white-space: nowrap; text-transform: uppercase;">Số lượng</div>
                  <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: right; text-transform: uppercase; white-space: nowrap;">{{ type === 'import' ? 'Đơn giá nhập (₫)' : 'Đơn giá xuất (₫)' }}</div>
                  <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); text-align: right; text-transform: uppercase; white-space: nowrap;">Thành tiền (₫)</div>
                  <div></div>
                </div>

            <!-- Rows: Có z-index phân tầng để dropdown không bị các dòng bên dưới đè -->
            <div [style.gap]="isFormDisabled ? '0px' : '10px'" style="display: flex; flex-direction: column; overflow: visible;">
              <div *ngFor="let item of lineItems; let i = index; let last = last" 
                   [style.pointer-events]="isFormDisabled ? 'none' : 'auto'"
                   [ngStyle]="{
                     'display': 'grid', 
                     'grid-template-columns': getGridColumns(), 
                     'gap': '10px', 
                     'align-items': 'start', 
                     'padding': isFormDisabled ? '12px 14px' : '10px 14px', 
                     'border-radius': isFormDisabled ? '0' : '8px', 
                     'background': isFormDisabled ? 'transparent' : 'var(--bg-primary)', 
                     'border': isFormDisabled ? 'none' : (isQuantityExceeded(item) ? '1px solid #f87171' : '1px solid var(--border-color)'),
                     'border-bottom': (isFormDisabled && lineItems.length > 1 && !last) ? '1px solid var(--border-color)' : (isFormDisabled ? 'none' : (isQuantityExceeded(item) ? '1px solid #f87171' : '1px solid var(--border-color)')),
                     'position': 'relative',
                     'z-index': (openProductDropdownId === item.id || openVariantDropdownId === item.id) ? 100 : 1
                   }">
                
                <!-- 1. Sản phẩm: Khóa khi chưa chọn kho -->
                <div style="position: relative;">
                  <div *ngIf="item.isProductFixed || isFormDisabled" style="min-height: 38px; display: flex; align-items: center; color: var(--text-primary); font-size: 13px; font-weight: 500; white-space: normal; word-break: break-word; line-height: 1.4;">
                    {{ getProductLabel(item.productId, item) }}
                  </div>
                  <div *ngIf="!item.isProductFixed && !isFormDisabled" 
                       (click)="!transactionLocation && focusLocationDropdown($event)"
                       style="position: relative; width: 100%;">
                    <button 
                        type="button"
                        (click)="toggleProductDropdown(item.id, $event)"
                        [disabled]="!transactionLocation || isFormDisabled"
                        style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 13px; text-align: left; transition: all 0.2s;"
                        [ngStyle]="{
                          'background': (!transactionLocation || isFormDisabled) ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                          'cursor': (!transactionLocation || isFormDisabled) ? 'not-allowed' : 'pointer',
                          'opacity': (!transactionLocation) ? '0.7' : '1',
                          'color': !transactionLocation ? 'var(--text-muted)' : (item.productId ? 'var(--text-primary)' : 'var(--text-muted)'),
                          'border': !transactionLocation ? '1px dashed var(--border-color)' : '1px solid var(--border-color)'
                        }"
                        [attr.title]="!transactionLocation ? 'Vui lòng chọn chi nhánh / kho trước khi chọn sản phẩm' : ''"
                    >
                      <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;">
                        <lucide-angular *ngIf="!transactionLocation" [img]="icons.Lock" size="13" style="color: var(--text-muted); flex-shrink: 0;"></lucide-angular>
                        <span style="white-space: normal; word-break: break-word; line-height: 1.35; text-align: left;">
                          {{ !transactionLocation ? 'Chọn sản phẩm' : getProductLabel(item.productId, item) }}
                        </span>
                      </div>
                      <lucide-angular [img]="icons.ChevronDown" size="14" style="flex-shrink: 0;" [ngStyle]="{'transform': openProductDropdownId === item.id ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s', 'opacity': !transactionLocation ? '0.35' : '1'}"></lucide-angular>
                    </button>
                    
                    <!-- Product Popup with Search: Tự động Dropup/Dropdown theo vị trí -->
                    <div *ngIf="openProductDropdownId === item.id && transactionLocation" 
                      [ngStyle]="{
                        'position': 'absolute',
                        'left': '0',
                        'min-width': '340px',
                        'width': '100%',
                        'background': 'var(--bg-primary)',
                        'border': '1px solid var(--border-color)',
                        'border-radius': '10px',
                        'box-shadow': '0 16px 36px rgba(0,0,0,0.22)',
                        'z-index': '1200',
                        'padding': '8px',
                        'display': 'flex',
                        'flex-direction': 'column',
                        'gap': '8px',
                        'bottom': dropdownPositions['prod_' + item.id] === 'up' ? 'calc(100% + 6px)' : 'auto',
                        'top': dropdownPositions['prod_' + item.id] === 'up' ? 'auto' : 'calc(100% + 6px)'
                      }"
                    >
                      <!-- Search Input Box -->
                      <div style="display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px;" (click)="$event.stopPropagation()">
                        <lucide-angular [img]="icons.Search" size="14" color="var(--text-muted)"></lucide-angular>
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm theo tên sản phẩm..." 
                          [(ngModel)]="productSearchTerm" 
                          (click)="$event.stopPropagation()"
                          style="width: 100%; border: none; background: transparent; outline: none; font-size: 12px; color: var(--text-primary);" 
                        />
                        <button *ngIf="productSearchTerm" (click)="productSearchTerm = ''; $event.stopPropagation()" style="background: none; border: none; cursor: pointer; padding: 0; color: var(--text-muted);">
                          <lucide-angular [img]="icons.X" size="12"></lucide-angular>
                        </button>
                      </div>

                      <!-- Product Options List -->
                      <div class="custom-dropdown-scrollbar" style="max-height: 220px; overflow-y: scroll; display: flex; flex-direction: column; gap: 2px; padding-right: 4px;">
                        <div *ngFor="let p of getFilteredProducts()"
                          class="dropdown-option-item"
                          [class.selected]="item.productId === p.id"
                          (mousedown)="selectProduct(item, p.id, $event)"
                          (click)="selectProduct(item, p.id, $event)"
                        >
                          <div style="font-size: 13px; font-weight: 500; white-space: normal; word-break: break-word; line-height: 1.35;" [style.color]="item.productId === p.id ? 'var(--accent)' : 'var(--text-primary)'">
                            {{ p.name || p.productName }}
                          </div>
                          <div *ngIf="p.variants?.length" style="font-size: 11px; color: var(--text-muted);">
                            {{ p.variants.length }} biến thể
                          </div>
                        </div>
                        <div *ngIf="getFilteredProducts().length === 0" style="padding: 16px; text-align: center; font-size: 12px; color: var(--text-muted);">
                          Không tìm thấy sản phẩm phù hợp
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 2. Biến thể: Bố trí giống form Kiểm kê -->
                <div style="position: relative; display: flex; flex-direction: column; gap: 4px;">
                  <div *ngIf="item.isVariantFixed || isFormDisabled" style="min-height: 38px; display: flex; flex-direction: column; justify-content: center; gap: 3px; color: var(--text-primary); font-size: 13px;">
                    <div *ngIf="getVariantSku(item)" style="font-family: monospace; font-weight: 700; font-size: 11px; color: var(--accent, #765337); line-height: 1.2;">{{ getVariantSku(item) }}</div>
                    <div style="font-size: 12px; color: var(--text-primary); font-weight: 500; white-space: normal; word-break: break-word; line-height: 1.35;">{{ getVariantDisplay(item) }}</div>
                  </div>
                  <div *ngIf="!item.isVariantFixed && !isFormDisabled" 
                       (click)="!transactionLocation && focusLocationDropdown($event)"
                       style="position: relative; width: 100%;">
                    <button 
                      type="button"
                      (click)="toggleVariantDropdown(item, $event)"
                      [disabled]="!transactionLocation || !item.productId || isFormDisabled"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; border-radius: 8px; font-size: 13px; text-align: left; transition: all 0.2s;"
                      [ngStyle]="{
                        'background': (!transactionLocation || !item.productId || isFormDisabled) ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                        'cursor': (!transactionLocation || !item.productId || isFormDisabled) ? 'not-allowed' : 'pointer',
                        'opacity': (!transactionLocation || !item.productId) ? '0.7' : '1',
                        'border': (!transactionLocation || !item.productId) ? '1px dashed var(--border-color)' : '1px solid var(--border-color)'
                      }"
                      [attr.title]="!transactionLocation ? 'Vui lòng chọn chi nhánh / kho trước' : (!item.productId ? 'Vui lòng chọn sản phẩm trước' : 'Chọn biến thể')"
                    >
                      <div *ngIf="item.variantId && transactionLocation" style="display: flex; flex-direction: column; gap: 2px; text-align: left; min-width: 0; flex: 1;">
                        <span *ngIf="item.skuDisplay || getVariantSku(item)" style="font-family: monospace; font-weight: 700; font-size: 11px; color: var(--accent, #765337); line-height: 1.2;">{{ item.skuDisplay || getVariantSku(item) }}</span>
                        <span style="font-size: 12px; color: var(--text-primary); font-weight: 500; white-space: normal; word-break: break-word; line-height: 1.35;">{{ item.variantNameDisplay || getVariantDisplay(item) }}</span>
                      </div>
                      <span *ngIf="!item.variantId || !transactionLocation" style="color: var(--text-muted); white-space: normal; word-break: break-word; line-height: 1.35; flex: 1; min-width: 0; font-size: 12px;">
                        {{ !transactionLocation ? 'Chọn biến thể' : (item.productId ? 'Chọn biến thể...' : 'Chọn sản phẩm trước') }}
                      </span>
                      <lucide-angular [img]="icons.ChevronDown" size="14" style="flex-shrink: 0;" [ngStyle]="{'transform': openVariantDropdownId === item.id ? 'rotate(180deg)' : 'none', 'transition': 'transform 0.2s', 'opacity': (!transactionLocation || !item.productId) ? '0.35' : '1'}"></lucide-angular>
                    </button>

                    <!-- Variant Popup Menu with Search Box: Bố trí Option giống form Kiểm kê -->
                    <div *ngIf="openVariantDropdownId === item.id && transactionLocation && item.productId"
                      (click)="$event.stopPropagation()"
                      [ngStyle]="{
                        'position': 'absolute',
                        'left': '0',
                        'min-width': '280px',
                        'width': '100%',
                        'background': 'var(--bg-primary)',
                        'border': '1px solid var(--border-color)',
                        'border-radius': '10px',
                        'box-shadow': '0 16px 36px rgba(0,0,0,0.22)',
                        'z-index': '1200',
                        'padding': '8px',
                        'display': 'flex',
                        'flex-direction': 'column',
                        'gap': '8px',
                        'bottom': dropdownPositions['var_' + item.id] === 'up' ? 'calc(100% + 6px)' : 'auto',
                        'top': dropdownPositions['var_' + item.id] === 'up' ? 'auto' : 'calc(100% + 6px)'
                      }"
                    >
                      <!-- Search Input Box for Variants -->
                      <div style="display: flex; align-items: center; gap: 8px; padding: 7px 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px;" (click)="$event.stopPropagation()">
                        <lucide-angular [img]="icons.Search" size="14" color="var(--text-muted)"></lucide-angular>
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm biến thể theo tên, SKU..." 
                          [(ngModel)]="variantSearchTerm" 
                          (click)="$event.stopPropagation()"
                          style="width: 100%; border: none; background: transparent; outline: none; font-size: 12px; color: var(--text-primary);" 
                        />
                        <button *ngIf="variantSearchTerm" (click)="variantSearchTerm = ''; $event.stopPropagation()" style="background: none; border: none; cursor: pointer; padding: 0; color: var(--text-muted);">
                          <lucide-angular [img]="icons.X" size="12"></lucide-angular>
                        </button>
                      </div>

                      <!-- Variant Options List -->
                      <div class="custom-dropdown-scrollbar" style="max-height: 200px; overflow-y: scroll; display: flex; flex-direction: column; gap: 3px; padding-right: 4px;">
                        <div *ngFor="let v of getFilteredVariants(item.productId); trackBy: trackByVariantId"
                          class="dropdown-option-item"
                          [class.selected]="item.variantId == v.id"
                          (mousedown)="selectVariant(item, v, $event)"
                          (click)="selectVariant(item, v, $event)"
                        >
                          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                            <span style="font-family: monospace; font-weight: 700; font-size: 11.5px; color: var(--accent, #765337); flex-shrink: 0;">{{ v.sku || 'SKU-AUTO' }}</span>
                            <span style="font-size: 11.5px; color: var(--text-muted); flex-shrink: 0; white-space: nowrap;">
                              Tồn: <strong style="color: var(--text-primary); font-weight: 600;">{{ getVariantStockInfo(item.productId, v.id).available }}</strong>
                            </span>
                          </div>
                          <span style="font-size: 12px; color: var(--text-primary); font-weight: 500; white-space: normal; word-break: break-word; line-height: 1.35;">{{ v.name }}</span>
                        </div>
                        <div *ngIf="getFilteredVariants(item.productId).length === 0" style="padding: 14px; text-align: center; font-size: 12px; color: var(--text-muted);">
                          {{ getVariantsForProduct(item.productId).length === 0 ? 'Sản phẩm chưa có biến thể' : 'Không tìm thấy biến thể phù hợp' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3. Cột Tồn kho: Hiển thị sau khi chọn biến thể -->
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 38px;">
                  <span *ngIf="!item.productId || !item.variantId" style="color: var(--text-muted); font-size: 13px; font-weight: 500;">
                    --
                  </span>
                  <span *ngIf="item.productId && item.variantId && !transactionLocation" style="color: #f59e0b; font-size: 10.5px; font-weight: 500; text-align: center; line-height: 1.1;">
                    Chưa chọn kho
                  </span>
                  <ng-container *ngIf="item.productId && item.variantId && transactionLocation">
                    <span 
                      style="font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; min-width: 36px;"
                      [ngStyle]="{
                        'color': getVariantStock(item) > 5 ? '#059669' : (getVariantStock(item) > 0 ? '#d97706' : '#dc2626'),
                        'background': getVariantStock(item) > 5 ? '#ecfdf5' : (getVariantStock(item) > 0 ? '#fffbeb' : '#fef2f2'),
                        'border': getVariantStock(item) > 5 ? '1px solid #a7f3d0' : (getVariantStock(item) > 0 ? '1px solid #fde68a' : '1px solid #fecaca')
                      }"
                      [title]="'Tồn khả dụng: ' + getVariantStock(item) + ' ' + (item.unit || 'Chiếc')"
                    >
                      {{ getVariantStock(item) }}
                    </span>
                    <span *ngIf="getVariantStockInfo(item.productId, item.variantId).reserved > 0" 
                          style="font-size: 9.5px; color: var(--text-muted); white-space: nowrap; margin-top: 1px;"
                          [title]="'Thực tế: ' + getVariantStockInfo(item.productId, item.variantId).physical + ' | Tạm giữ: ' + getVariantStockInfo(item.productId, item.variantId).reserved">
                      (Giữ: {{ getVariantStockInfo(item.productId, item.variantId).reserved }})
                    </span>
                  </ng-container>
                </div>


                <!-- 5. Số lượng (kèm Validation cảnh báo vượt tồn) -->
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                  <div *ngIf="isFormDisabled" style="width: 76px; height: 38px; box-sizing: border-box; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: var(--text-primary); cursor: not-allowed;" title="Số lượng (Đã khóa)">
                    {{ item.quantity || 0 }}
                  </div>
                  <div *ngIf="!isFormDisabled" style="display: flex; align-items: stretch; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; height: 38px; width: 76px; background: var(--bg-primary); transition: all 0.15s ease;"
                       [ngStyle]="{
                         'opacity': (!transactionLocation || !item.productId || !item.variantId) ? '0.5' : '1',
                         'border-color': isQuantityExceeded(item) ? '#ef4444' : 'var(--border-color)',
                         'background': isQuantityExceeded(item) ? '#fef2f2' : ((!transactionLocation || !item.productId || !item.variantId) ? 'var(--bg-secondary)' : 'var(--bg-primary)')
                       }">
                    <!-- Input Nhập số lượng -->
                    <input 
                      type="text" 
                      inputmode="numeric"
                      pattern="[0-9]*"
                      [disabled]="!transactionLocation || !item.productId || !item.variantId"
                      [value]="item.quantity" 
                      (keydown)="onQuantityKeydown($event)"
                      (input)="onQuantityInput(item, $event)" 
                      placeholder="0" 
                      style="flex: 1; min-width: 0; width: 100%; height: 100%; border: none; outline: none; background: transparent; text-align: center; font-size: 13px; font-weight: 700; color: var(--text-primary); padding: 0 2px;" 
                      [ngStyle]="{
                        'cursor': (!transactionLocation || !item.productId || !item.variantId) ? 'not-allowed' : 'text',
                        'color': isQuantityExceeded(item) ? '#dc2626' : 'var(--text-primary)'
                      }"
                    />

                    <!-- Cụm mũi tên tăng/giảm bên phải -->
                    <div style="display: flex; flex-direction: column; width: 20px; border-left: 1px solid var(--border-color); flex-shrink: 0;">
                      <button 
                        type="button"
                        (click)="increaseQuantity(item)"
                        [disabled]="!transactionLocation || !item.productId || !item.variantId"
                        style="flex: 1; display: flex; align-items: center; justify-content: center; background: transparent; border: none; border-bottom: 1px solid var(--border-color); padding: 0; transition: all 0.12s ease;"
                        [style.cursor]="(!transactionLocation || !item.productId || !item.variantId) ? 'not-allowed' : 'pointer'"
                        title="Tăng"
                      >
                        <lucide-angular [img]="icons.ChevronUp" size="10"></lucide-angular>
                      </button>

                      <button 
                        type="button"
                        (click)="decreaseQuantity(item)"
                        [disabled]="!transactionLocation || !item.productId || !item.variantId || getQuantity(item) <= 0"
                        style="flex: 1; display: flex; align-items: center; justify-content: center; background: transparent; border: none; padding: 0; transition: all 0.12s ease;"
                        [style.cursor]="(!transactionLocation || !item.productId || !item.variantId || getQuantity(item) <= 0) ? 'not-allowed' : 'pointer'"
                        title="Giảm"
                      >
                        <lucide-angular [img]="icons.ChevronDown" size="10"></lucide-angular>
                      </button>
                    </div>
                  </div>

                  <!-- Cảnh báo lỗi vượt quá tồn kho -->
                  <div *ngIf="!isFormDisabled && isQuantityExceeded(item)" style="color: #ef4444; font-size: 10px; font-weight: 600; text-align: center; line-height: 1.2;">
                    ⚠️ Quá tồn (Max {{ getVariantStock(item) }})
                  </div>
                </div>

                <!-- 6. Đơn giá xuất / nhập -->
                <div>
                  <div *ngIf="isFormDisabled" style="width: 100%; height: 38px; box-sizing: border-box; border-radius: 8px; border: 2px solid #c8c8c8; background: #f1f1f1; display: flex; align-items: center; justify-content: flex-end; padding: 0 10px; font-size: 13px; font-weight: 500; color: var(--text-primary); cursor: not-allowed;" title="Đơn giá (Đã khóa)">
                    {{ item.price ? (item.price + ' ₫') : '0 ₫' }}
                  </div>
                  <input *ngIf="!isFormDisabled"
                    type="text" 
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="0" 
                    [disabled]="!transactionLocation || !item.productId || !item.variantId"
                    [value]="item.price" 
                    (keydown)="onNumberKeydown($event)"
                    (input)="onPriceInput(item, $event)" 
                    style="height: 38px; width: 100%; box-sizing: border-box; font-size: 13px; text-align: right; padding: 0 8px; border-radius: 8px; border: 1px solid var(--border-color); outline: none; transition: all 0.15s ease;" 
                    [ngStyle]="{
                      'background': (!transactionLocation || !item.productId || !item.variantId) ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      'color': (!transactionLocation || !item.productId || !item.variantId) ? 'var(--text-muted)' : 'var(--text-primary)',
                      'cursor': (!transactionLocation || !item.productId || !item.variantId) ? 'not-allowed' : 'text',
                      'opacity': (!transactionLocation || !item.productId || !item.variantId) ? '0.6' : '1'
                    }"
                    [title]="!transactionLocation ? 'Vui lòng chọn chi nhánh / kho trước' : ((!item.productId || !item.variantId) ? 'Vui lòng chọn sản phẩm và biến thể trước khi chỉnh sửa đơn giá' : '')"
                  />
                </div>

                <!-- 7. Thành tiền = Số lượng × Đơn giá -->
                <div style="display: flex; align-items: center; justify-content: flex-end; height: 38px; font-size: 13px; font-weight: 700; color: #059669; padding-right: 4px; white-space: nowrap;" [title]="getFormattedLineSubtotal(item)">
                  {{ getFormattedLineSubtotal(item) }}
                </div>

                <!-- 8. Delete Row -->
                <div style="display: flex; justify-content: center; align-items: center; height: 38px;">
                  <button 
                    *ngIf="!isFormDisabled"
                    type="button"
                    (click)="handleRemoveLineItem(item.id)"
                    style="background: none; border: none; cursor: pointer; color: #ef4444; padding: 4px; display: flex; align-items: center; justify-content: center; border-radius: 4px;"
                    title="Xóa dòng"
                  >
                    <lucide-angular [img]="icons.Trash2" size="18"></lucide-angular>
                  </button>
                </div>
              </div>
            </div>

              </div>
            </div>

            <!-- Add item button: Khóa kèm hướng dẫn khi chưa chọn kho -->
            <div *ngIf="!isFormDisabled" (click)="!transactionLocation && focusLocationDropdown($event)" style="margin-top: 4px; display: inline-block;">
              <button 
                type="button"
                (click)="handleAddLineItem()"
                [disabled]="!canAddNewLine()"
                [ngStyle]="{
                  'display': 'inline-flex', 'align-items': 'center', 'gap': '6px',
                  'background': 'none', 
                  'border': !transactionLocation ? '1px dashed var(--border-color)' : '1px dashed var(--accent)', 
                  'color': !transactionLocation ? 'var(--text-muted)' : 'var(--accent)',
                  'padding': '8px 16px', 'border-radius': '6px', 'font-size': '13px', 'font-weight': 600,
                  'cursor': canAddNewLine() ? 'pointer' : 'not-allowed',
                  'opacity': canAddNewLine() ? 1 : 0.5
                }"
                [attr.title]="!transactionLocation ? 'Vui lòng chọn chi nhánh / kho trước khi thêm sản phẩm' : (!canAddNewLine() ? 'Vui lòng hoàn thành thông tin dòng sản phẩm hiện tại trước' : '')"
              >
                {{ !transactionLocation ? 'Thêm sản phẩm' : 'Thêm sản phẩm' }}
              </button>
            </div>

            <!-- Bảng tổng kết tài chính phiếu nhập/xuất (Financial Summary) -->
            <div [style.pointer-events]="isFormDisabled ? 'none' : 'auto'" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; margin-top: 6px;">
              
              <!-- Cột trái: Tóm tắt thông số -->
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <lucide-angular [img]="icons.FileText" size="14"></lucide-angular>
                  {{ type === 'import' ? 'Tóm tắt quy mô phiếu nhập' : 'Tóm tắt quy mô phiếu xuất' }}
                </div>
                <div style="font-size: 12.5px; color: var(--text-muted); display: flex; flex-direction: column; gap: 5px;">
                  <div>• Tổng số lượng: <strong style="color: var(--text-primary);">{{ getTotalQuantity() }}</strong> đơn vị sản phẩm</div>
                  <div>• Số chủng loại: <strong style="color: var(--text-primary);">{{ lineItems.length }}</strong> mặt hàng</div>
                  <div *ngIf="referenceCode">• Chứng từ kèm theo: <strong style="color: var(--accent); font-family: monospace;">{{ referenceCode }}</strong></div>
                  <div *ngIf="recipientName && isReasonRequiringPartner(transactionReason)">• {{ getPartnerLabelForReason(transactionReason) }}: <strong style="color: var(--text-primary);">{{ recipientName }}</strong></div>
                  <div *ngIf="transactionReason.includes('Chuyển kho') && transactionDestination">• {{ type === 'import' ? 'Kho xuất' : 'Kho đích' }}: <strong style="color: var(--text-primary);">{{ getDestLabel() }}</strong></div>
                </div>
              </div>

              <!-- Cột phải: Tính toán chiết khấu, VAT, Vận chuyển, Tổng thanh toán -->
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
                <!-- Tiền hàng -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="color: var(--text-secondary);">Tổng tiền hàng:</span>
                  <span style="font-weight: 600; color: var(--text-primary); font-size: 13.5px;">{{ formatCurrency(getTotalSubtotal()) }}</span>
                </div>

                <!-- Chiết khấu -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                  <span style="color: var(--text-secondary);">Chiết khấu (₫):</span>
                  <ng-container *ngIf="!isFormDisabled">
                    <input 
                      type="text" 
                      inputmode="numeric"
                      pattern="[0-9]*"
                      [value]="discountAmount" 
                      (keydown)="onNumberKeydown($event)"
                      (input)="onCurrencyInput('discount', $event)" 
                      placeholder="0" 
                      style="width: 190px; height: 28px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 12.5px; text-align: right; outline: none; background: var(--bg-primary); color: var(--text-primary);" 
                    />
                  </ng-container>
                  <ng-container *ngIf="isFormDisabled">
                    <div style="width: 190px; height: 28px; box-sizing: border-box; border-radius: 6px; border: 2px solid #c8c8c8; background: #f1f1f1; display: flex; align-items: center; justify-content: flex-end; padding: 0 8px; font-size: 12.5px; font-weight: 600; color: var(--text-primary); cursor: not-allowed;" title="Chiết khấu (Đã khóa)">
                      {{ getDiscountValue() > 0 ? ('-' + formatCurrency(getDiscountValue())) : '0 ₫' }}
                    </div>
                  </ng-container>
                </div>

                <!-- Thuế VAT -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                  <span style="color: var(--text-secondary);">Thuế VAT:</span>
                  <ng-container *ngIf="!isFormDisabled">
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 190px; gap: 6px;">
                      <div class="filter-dropdown-wrapper location-filter-wrapper" style="position: relative; width: 78px; flex-shrink: 0;">
                        <button 
                          type="button" 
                          class="filter-trigger-btn"
                          style="width: 100%; height: 28px; padding: 0 6px; font-size: 12px; border-radius: 6px; gap: 4px;"
                          [class.active]="taxRate > 0"
                          [title]="'Thuế VAT: ' + taxRate + '%'"
                          (click)="toggleTaxDropdown($event)"
                        >
                          <div class="trigger-label" style="gap: 4px;">
                            <lucide-angular [img]="icons.Percent" size="12" class="trigger-icon"></lucide-angular>
                            <span class="truncate-label" style="font-size: 12px; font-weight: 500;">{{ taxRate }}%</span>
                          </div>
                          <lucide-angular 
                            [img]="icons.ChevronDown" 
                            size="12" 
                            [style.transform]="showTaxDropdown ? 'rotate(180deg)' : 'none'" 
                            style="transition: transform 0.2s; flex-shrink: 0;"
                          ></lucide-angular>
                        </button>

                        <div *ngIf="showTaxDropdown" 
                          class="tax-dropdown-menu custom-dropdown-scrollbar"
                          [ngStyle]="{
                            'bottom': dropdownPositions['tax'] === 'up' ? 'calc(100% + 4px)' : 'auto',
                            'top': dropdownPositions['tax'] === 'up' ? 'auto' : 'calc(100% + 4px)'
                          }"
                        >
                          <div *ngFor="let rate of taxRateOptions"
                            (click)="selectTaxRate(rate, $event)"
                            class="filter-menu-item"
                            style="padding: 5px 8px; font-size: 12px; display: flex; align-items: center; justify-content: space-between;"
                            [class.selected]="taxRate === rate"
                          >
                            <span>{{ rate }}%</span>
                            <lucide-angular *ngIf="taxRate === rate" [img]="icons.CheckCircle2" size="12" style="color: var(--accent); flex-shrink: 0;"></lucide-angular>
                          </div>

                          <!-- Ô nhập & Nút + thêm mức thuế VAT mới (chỉ nhận số nguyên, tự động gắn %) -->
                          <div style="border-top: 1px dashed var(--border-color); padding: 5px 2px 2px 2px; margin-top: 3px;" (click)="$event.stopPropagation()">
                            <div style="display: flex; align-items: center; gap: 4px;">
                              <div style="position: relative; display: flex; align-items: center; flex: 1;">
                                <input 
                                  type="text" 
                                  inputmode="numeric"
                                  pattern="[0-9]*"
                                  [value]="customTaxInput"
                                  (keydown)="onCustomTaxKeydown($event)"
                                  (input)="onCustomTaxInput($event)"
                                  placeholder="0" 
                                  maxlength="3" 
                                  title="Nhập số nguyên (0-100)"
                                  style="width: 100%; height: 26px; padding: 0 16px 0 6px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 11.5px; background: var(--bg-primary); color: var(--text-primary); text-align: right; outline: none; box-sizing: border-box;"
                                />
                                <span style="position: absolute; right: 4px; font-size: 11px; color: var(--text-muted); pointer-events: none; font-weight: 600;">%</span>
                              </div>
                              <button 
                                type="button"
                                (click)="confirmAddCustomTax($event)"
                                title="Thêm mức thuế (%)"
                                style="width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: var(--accent, #765337); color: #ffffff; border: none; border-radius: 4px; cursor: pointer; flex-shrink: 0; transition: opacity 0.15s;"
                                onmouseover="this.style.opacity='0.85'"
                                onmouseout="this.style.opacity='1'"
                              >
                                <lucide-angular [img]="icons.Plus" size="13"></lucide-angular>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span style="font-weight: 500; text-align: right; color: var(--text-primary); font-size: 12.5px; flex: 1; white-space: nowrap;">+{{ formatCurrency(getTaxValue()) }}</span>
                    </div>
                  </ng-container>
                  <ng-container *ngIf="isFormDisabled">
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 190px; gap: 6px;">
                      <div style="width: 78px; height: 28px; box-sizing: border-box; border-radius: 6px; border: 2px solid #c8c8c8; background: #f1f1f1; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 12px; font-weight: 600; color: var(--text-primary); cursor: not-allowed; flex-shrink: 0;" title="Thuế VAT (Đã khóa)">
                        <lucide-angular [img]="icons.Percent" size="12" style="color: #64748b;"></lucide-angular>
                        <span>{{ taxRate }}%</span>
                      </div>
                      <span style="font-weight: 600; text-align: right; color: var(--text-primary); font-size: 12.5px; flex: 1; white-space: nowrap;">
                        {{ taxRate > 0 ? ('+' + formatCurrency(getTaxValue())) : '0 ₫' }}
                      </span>
                    </div>
                  </ng-container>
                </div>

                <!-- Chi phí vận chuyển -->
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                  <span style="color: var(--text-secondary);">Phí vận chuyển (₫):</span>
                  <ng-container *ngIf="!isFormDisabled">
                    <input 
                      type="text" 
                      inputmode="numeric"
                      pattern="[0-9]*"
                      [value]="shippingFee" 
                      (keydown)="onNumberKeydown($event)"
                      (input)="onCurrencyInput('shipping', $event)" 
                      placeholder="0" 
                      style="width: 190px; height: 28px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 12.5px; text-align: right; outline: none; background: var(--bg-primary); color: var(--text-primary);" 
                    />
                  </ng-container>
                  <ng-container *ngIf="isFormDisabled">
                    <div style="width: 190px; height: 28px; box-sizing: border-box; border-radius: 6px; border: 2px solid #c8c8c8; background: #f1f1f1; display: flex; align-items: center; justify-content: flex-end; padding: 0 8px; font-size: 12.5px; font-weight: 600; color: var(--text-primary); cursor: not-allowed;" title="Phí vận chuyển (Đã khóa)">
                      {{ getShippingValue() > 0 ? ('+' + formatCurrency(getShippingValue())) : '0 ₫' }}
                    </div>
                  </ng-container>
                </div>

                <!-- Đường kẻ phân cách -->
                <div style="height: 1px; background: var(--border-color); margin: 3px 0;"></div>

                <!-- Tổng giá trị nhập kho / Thanh toán -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 13.5px; font-weight: 700; color: var(--text-primary);">{{ type === 'import' ? 'Tổng thanh toán:' : 'Tổng giá trị xuất kho:' }}</span>
                  <span style="font-size: 17px; font-weight: 800; color: #059669;">{{ formatCurrency(getFinalTotal()) }}</span>
                </div>
              </div>

            </div>

            <!-- ── BẢNG LỊCH SỬ THAO TÁC TRÊN PHIẾU (Chỉ hiện khi mở xem / sau khi đã lưu nháp hoặc tạo phiếu) ── -->
            <div *ngIf="isViewMode || actionLogs.length > 0" class="order-history-section" style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <lucide-angular [img]="icons.Clock" size="16" style="color: #765337;"></lucide-angular>
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0;">
                    Lịch sử thao tác trên phiếu
                  </h4>
                  <span style="font-size: 11.5px; background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 1px 8px; border-radius: 10px; font-weight: 600;">
                    {{ actionLogs.length }} thao tác
                  </span>
                </div>
              </div>

              <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: var(--bg-primary);">
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                  <thead>
                    <tr style="background: var(--bg-secondary, #FAF7F2); border-bottom: 1px solid var(--border-color);">
                      <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: var(--text-secondary); width: 190px;">Thời gian</th>
                      <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: var(--text-secondary); width: 220px;">Người thao tác</th>
                      <th style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: var(--text-secondary);">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let log of actionLogs; let last = last" 
                        style="border-bottom: 1px solid var(--border-color); transition: background 0.15s ease;"
                        [style.border-bottom]="last ? 'none' : '1px solid var(--border-color)'"
                        onmouseover="this.style.background='var(--bg-secondary)'"
                        onmouseout="this.style.background='transparent'">
                      <!-- 1. Thời gian -->
                      <td style="padding: 12px 16px; color: var(--text-primary); font-family: monospace; font-size: 12.5px; white-space: nowrap;">
                        {{ formatDisplayDate(log.timestamp) }}
                      </td>

                      <!-- 2. Người thao tác -->
                      <td style="padding: 12px 16px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 26px; height: 26px; border-radius: 50%; background: #EAE1D7; color: #765337; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; text-transform: uppercase; flex-shrink: 0;">
                            {{ getInitials(log.operator) }}
                          </div>
                          <span style="font-weight: 500; color: var(--text-primary); line-height: 1.3;">
                            {{ log.operator }}
                          </span>
                        </div>
                      </td>

                      <!-- 3. Hành động -->
                      <td style="padding: 12px 16px;">
                        <!-- Chuyển trạng thái: A -> B -->
                        <div *ngIf="log.actionType === 'STATUS_CHANGE'" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                          <span style="color: var(--text-primary); font-size: 13px;">Cập nhật trạng thái:</span>
                          <span [ngStyle]="getStatusBadgeStyle(log.fromStatus)" style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600;">
                            {{ getStatusLabel(log.fromStatus) }}
                          </span>
                          <span style="color: var(--text-muted); font-size: 12px; font-weight: 600;">→</span>
                          <span [ngStyle]="getStatusBadgeStyle(log.toStatus)" style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600;">
                            {{ getStatusLabel(log.toStatus) }}
                          </span>
                        </div>

                        <!-- Hủy phiếu (ghi trên 2 dòng) -->
                        <div *ngIf="log.actionType === 'CANCEL'" style="display: flex; flex-direction: column; gap: 3px;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 700; color: #ef4444; font-size: 13px;">Hủy phiếu</span>
                            <span *ngIf="log.fromStatus" [ngStyle]="getStatusBadgeStyle(log.fromStatus)" style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                              {{ getStatusLabel(log.fromStatus) }}
                            </span>
                            <span *ngIf="log.fromStatus" style="color: var(--text-muted); font-size: 11px;">→</span>
                            <span [ngStyle]="getStatusBadgeStyle('CANCELLED')" style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                              Đã hủy
                            </span>
                          </div>
                          <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.4;">
                            Lý do: <span style="color: var(--text-primary); font-style: italic;">{{ log.reason || 'Không có lý do cụ thể' }}</span>
                          </div>
                        </div>

                        <!-- Khởi tạo phiếu ban đầu -->
                        <div *ngIf="log.actionType === 'CREATE'" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                          <span style="color: var(--text-primary); font-size: 13px;">{{ log.actionLabel || (type === 'import' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho') }}</span>
                          <span *ngIf="log.toStatus" [ngStyle]="getStatusBadgeStyle(log.toStatus)" style="display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 6px; font-size: 11.5px; font-weight: 600;">
                            {{ getStatusLabel(log.toStatus) }}
                          </span>
                        </div>

                        <!-- Cập nhật / Hành động khác -->
                        <div *ngIf="log.actionType === 'UPDATE' || (!['STATUS_CHANGE', 'CANCEL', 'CREATE'].includes(log.actionType))" style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: var(--text-primary); font-size: 13px;">{{ log.actionLabel || 'Cập nhật thông tin phiếu' }}</span>
                          <span *ngIf="log.details" style="font-size: 12px; color: var(--text-muted);">({{ log.details }})</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>


        <!-- Footer: create mode vs view mode -->
        <div style="padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); z-index: 20; position: relative;">

          <!-- Left summary (only in create mode) -->
          <div *ngIf="!isViewMode" style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">
            <span>Mã phiếu: <strong style="font-family: monospace; color: var(--text-primary);">{{ orderCode }}</strong></span>
            <span>•</span>
            <span>Tổng SP: <strong style="color: var(--text-primary);">{{ getTotalQuantity() }}</strong></span>
            <span>•</span>
            <span>Tổng tiền: <strong style="color: #059669; font-size: 13px;">{{ formatCurrency(getFinalTotal()) }}</strong></span>
          </div>
          <!-- Left spacer in view mode -->
          <div *ngIf="isViewMode"></div>

          <!-- CREATE MODE: Hủy + Lưu nháp + Tạo phiếu -->
          <div *ngIf="!isViewMode" style="display: flex; align-items: center; gap: 10px;">
            <!-- Nút 1: HỦY -->
            <button type="button" (click)="requestClose()" [disabled]="isAnyActionProcessing"
              [style.opacity]="isAnyActionProcessing ? '0.5' : '1'"
              [style.cursor]="isAnyActionProcessing ? 'not-allowed' : 'pointer'"
              style="padding: 9px 18px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 13px; font-weight: 500; transition: all 0.15s ease;"
              onmouseover="if(!this.disabled) this.style.background='var(--bg-secondary)'"
              onmouseout="if(!this.disabled) this.style.background='var(--bg-primary)'"
            >
              Hủy
            </button>

            <!-- Nút 2: LƯU NHÁP -->
            <button type="button" (click)="handleSaveDraft()" [disabled]="!canSaveDraft() || isAnyActionProcessing"
              [ngStyle]="{
                'display': 'flex', 'align-items': 'center', 'gap': '6px',
                'padding': '9px 18px', 'border-radius': '8px',
                'border': '1px solid ' + ((!canSaveDraft() || isAnyActionProcessing) ? 'var(--border-color)' : '#d97706'),
                'background': (!canSaveDraft() || isAnyActionProcessing) ? 'var(--bg-secondary)' : '#fffbeb',
                'color': (!canSaveDraft() || isAnyActionProcessing) ? 'var(--text-muted)' : '#b45309',
                'font-size': '13px', 'font-weight': '600',
                'cursor': (!canSaveDraft() || isAnyActionProcessing) ? 'not-allowed' : 'pointer',
                'opacity': (!canSaveDraft() || isAnyActionProcessing) ? '0.45' : '1',
                'transition': 'all 0.15s ease'
              }"
              onmouseover="if(!this.disabled) { this.style.background='#fef3c7'; }"
              onmouseout="if(!this.disabled) { this.style.background='#fffbeb'; }"
              [title]="!canSaveDraft() ? 'Vui lòng hoàn thiện các trường dữ liệu bắt buộc trước khi lưu nháp' : (isAnyActionProcessing ? 'Đang xử lý...' : 'Lưu lại dạng bản nháp để duyệt sau, chưa thay đổi số lượng tồn kho')"
            >
              <lucide-angular *ngIf="!isSubmittingDraft" [img]="icons.Save" size="15"></lucide-angular>
              <lucide-angular *ngIf="isSubmittingDraft" [img]="icons.Loader2" size="15" style="animation: spin 0.8s linear infinite;"></lucide-angular>
              <span>{{ isSubmittingDraft ? 'Đang lưu nháp...' : 'Lưu nháp' }}</span>
            </button>

            <!-- Nút 3: TẠO PHIẾU XUẤT / NHẬP (PLANNED) -->
            <button type="button" (click)="handleSubmitConfirmed()" [disabled]="!canSubmitOrder() || isAnyActionProcessing"
              [ngStyle]="{
                'display': 'flex', 'align-items': 'center', 'gap': '6px',
                'padding': '9px 24px', 'border-radius': '8px', 'border': 'none',
                'background': (!canSubmitOrder() || isAnyActionProcessing) ? 'var(--border-color)' : '#765337',
                'color': (!canSubmitOrder() || isAnyActionProcessing) ? 'var(--text-muted)' : '#ffffff',
                'font-size': '13px', 'font-weight': '600',
                'cursor': (!canSubmitOrder() || isAnyActionProcessing) ? 'not-allowed' : 'pointer',
                'opacity': (!canSubmitOrder() || isAnyActionProcessing) ? '0.55' : '1',
                'box-shadow': (!canSubmitOrder() || isAnyActionProcessing) ? 'none' : '0 2px 8px rgba(118, 83, 55, 0.28)',
                'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }"
              onmouseover="if(!this.disabled) { this.style.background='#5a3d26'; this.style.boxShadow='0 4px 14px rgba(90, 61, 38, 0.4)'; this.style.transform='translateY(-1px)'; }"
              onmouseout="if(!this.disabled) { this.style.background='#765337'; this.style.boxShadow='0 2px 8px rgba(118, 83, 55, 0.28)'; this.style.transform='translateY(0)'; }"
              [title]="isAnyActionProcessing ? 'Hệ thống đang xử lý...' : getSubmitButtonTitle()"
            >
              <lucide-angular *ngIf="!isSubmittingOrder" [img]="icons.CheckCircle2" size="15"></lucide-angular>
              <lucide-angular *ngIf="isSubmittingOrder" [img]="icons.Loader2" size="15" style="animation: spin 0.8s linear infinite;"></lucide-angular>
              <span>{{ isSubmittingOrder ? 'Đang xử lý...' : (type === 'import' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho') }}</span>
            </button>
          </div>

          <!-- VIEW MODE: action buttons based on status -->
          <div *ngIf="isViewMode" style="display: flex; gap: 10px; align-items: center;">

            <!-- DRAFT: If not editing: [Xóa phiếu] [Lên kế hoạch nhập/xuất] (Nút [Sửa] đã đưa lên Header) -->
            <ng-container *ngIf="isDraft && !isEditingDraft">
              <button type="button" (click)="openDeleteOrderModal()"
                [disabled]="isAnyActionProcessing"
                [style.opacity]="isAnyActionProcessing ? '0.5' : '1'"
                [style.cursor]="isAnyActionProcessing ? 'not-allowed' : 'pointer'"
                style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;border:1px solid #ef4444;background:transparent;color:#ef4444;font-size:13px;font-weight:600;transition:all 0.15s;"
                onmouseover="if(!this.disabled) { this.style.background='#ef4444'; this.style.color='#fff'; }"
                onmouseout="if(!this.disabled) { this.style.background='transparent'; this.style.color='#ef4444'; }"
              >
                <lucide-angular [img]="icons.Trash2" size="15"></lucide-angular>
                Xóa phiếu
              </button>
              <button type="button" (click)="handlePlanOrder()"
                [disabled]="!canPlanOrder()"
                [style.opacity]="!canPlanOrder() ? '0.45' : '1'"
                [style.cursor]="!canPlanOrder() ? 'not-allowed' : 'pointer'"
                [style.background]="!canPlanOrder() ? '#9ca3af' : '#765337'"
                [style.box-shadow]="!canPlanOrder() ? 'none' : '0 2px 8px rgba(118,83,55,0.28)'"
                style="display:flex;align-items:center;gap:6px;padding:9px 24px;border-radius:8px;border:none;color:#fff;font-size:13px;font-weight:600;transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);"
                onmouseover="if(!this.disabled) { this.style.background='#5a3d26'; this.style.boxShadow='0 4px 14px rgba(90, 61, 38, 0.4)'; this.style.transform='translateY(-1px)'; }"
                onmouseout="if(!this.disabled) { this.style.background=canPlanOrder() ? '#765337' : '#9ca3af'; this.style.boxShadow=canPlanOrder() ? '0 2px 8px rgba(118, 83, 55, 0.28)' : 'none'; this.style.transform='translateY(0)'; }"
                [title]="getPlanOrderBtnTitle()"
              >
                <lucide-angular *ngIf="!isPlanningOrder" [img]="icons.CheckCircle2" size="15"></lucide-angular>
                <lucide-angular *ngIf="isPlanningOrder" [img]="icons.Loader2" size="15" style="animation: spin 0.8s linear infinite;"></lucide-angular>
                <span>{{ isPlanningOrder ? 'Đang tạo phiếu...' : (type === 'import' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho') }}</span>
              </button>
            </ng-container>

            <!-- DRAFT: If editing: [Hủy bỏ] [Lưu thay đổi] -->
            <ng-container *ngIf="isDraft && isEditingDraft">
              <button type="button" (click)="cancelEditDraft()"
                [disabled]="isAnyActionProcessing"
                [style.opacity]="isAnyActionProcessing ? '0.5' : '1'"
                [style.cursor]="isAnyActionProcessing ? 'not-allowed' : 'pointer'"
                style="padding:9px 16px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-primary);color:var(--text-primary);font-size:13px;font-weight:500;"
              >
                Hủy bỏ
              </button>
              <button type="button" (click)="saveEditDraft()"
                [disabled]="isAnyActionProcessing"
                [style.opacity]="isAnyActionProcessing ? '0.6' : '1'"
                [style.cursor]="isAnyActionProcessing ? 'not-allowed' : 'pointer'"
                style="display:flex;align-items:center;gap:6px;padding:9px 22px;border-radius:8px;border:none;background:#765337;color:#fff;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(118,83,55,0.28);"
              >
                <lucide-angular *ngIf="!isSavingDraftEdit" [img]="icons.Save" size="14"></lucide-angular>
                <lucide-angular *ngIf="isSavingDraftEdit" [img]="icons.Loader2" size="14" style="animation: spin 0.8s linear infinite;"></lucide-angular>
                <span>{{ isSavingDraftEdit ? 'Đang lưu thay đổi...' : 'Lưu thay đổi' }}</span>
              </button>
            </ng-container>

            <!-- PLANNED: [Hủy phiếu] [Xác nhận Xuất kho / Nhập kho] -->
            <ng-container *ngIf="isPlanned">
              <button type="button" (click)="openCancelOrderModal()"
                [disabled]="isAnyActionProcessing"
                [style.opacity]="isAnyActionProcessing ? '0.5' : '1'"
                [style.cursor]="isAnyActionProcessing ? 'not-allowed' : 'pointer'"
                style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;border:1px solid #9ca3af;background:transparent;color:var(--text-secondary);font-size:13px;font-weight:600;transition:all 0.15s;"
                onmouseover="if(!this.disabled) { this.style.borderColor='#ef4444'; this.style.color='#ef4444'; }"
                onmouseout="if(!this.disabled) { this.style.borderColor='#9ca3af'; this.style.color='var(--text-secondary)'; }"
              >
                <lucide-angular [img]="icons.Ban" size="15"></lucide-angular>
                Hủy phiếu
              </button>
              <button type="button" (click)="handleConfirmExecution()"
                [disabled]="!canConfirmExecution()"
                [style.opacity]="!canConfirmExecution() ? '0.45' : '1'"
                [style.cursor]="!canConfirmExecution() ? 'not-allowed' : 'pointer'"
                [style.background]="!canConfirmExecution() ? '#9ca3af' : (type === 'import' ? '#059669' : '#ef4444')"
                [style.box-shadow]="!canConfirmExecution() ? 'none' : (type === 'import' ? '0 2px 8px rgba(5,150,105,0.25)' : '0 2px 8px rgba(239,68,68,0.25)')"
                style="display:flex;align-items:center;gap:6px;padding:9px 22px;border-radius:8px;border:none;color:#fff;font-size:13px;font-weight:600;transition:all 0.2s;"
                onmouseover="if(!this.disabled) { this.style.opacity='0.9'; this.style.transform='translateY(-1px)'; }"
                onmouseout="if(!this.disabled) { this.style.opacity=canConfirmExecution() ? '1' : '0.45'; this.style.transform='translateY(0)'; }"
                [title]="getConfirmActionBtnTitle()"
              >
                <lucide-angular *ngIf="!isExecutingOrder" [img]="icons.CheckCircle2" size="15"></lucide-angular>
                <lucide-angular *ngIf="isExecutingOrder" [img]="icons.Loader2" size="15" style="animation: spin 0.8s linear infinite;"></lucide-angular>
                <span>{{ getConfirmActionBtnLabel() }}</span>
              </button>
            </ng-container>

            <!-- COMPLETED (read-only): [In phiếu] [Tải PDF] -->
            <ng-container *ngIf="isCompletedStock">
              <button type="button" onclick="window.print()"
                style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-primary);color:var(--text-primary);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.15s;"
              >
                <lucide-angular [img]="icons.Printer" size="15"></lucide-angular>
                {{ type === 'import' ? 'In phiếu nhập' : 'In phiếu xuất' }}
              </button>
              <button type="button" onclick="alert('Đang xuất PDF...')"
                style="display:flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;border:none;background:#765337;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;"
              >
                Tải PDF
              </button>
            </ng-container>

            <!-- CANCELLED: read-only note -->
            <ng-container *ngIf="isCancelled">
              <span style="font-size:13px;color:var(--text-muted);font-style:italic;">Phiếu đã bị hủy — chỉ xem</span>
            </ng-container>
          </div>
        </div>
      </div>
    </div>


    <!-- POPUP THÊM LÝ DO XUẤT MỚI -->
    <div *ngIf="showAddReasonModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 2500; backdrop-filter: blur(3px);" (click)="closeAddReasonModal()">
      <div (click)="$event.stopPropagation()" style="background: var(--bg-primary); border-radius: 12px; width: 440px; max-width: 90vw; border: 1px solid var(--border-color); box-shadow: 0 20px 45px rgba(0,0,0,0.28); overflow: hidden; display: flex; flex-direction: column;">
        
        <!-- Header Popup -->
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; border-radius: 6px; background: rgba(194, 154, 107, 0.15); color: var(--accent); display: flex; align-items: center; justify-content: center;">
              <lucide-angular [img]="icons.Plus" size="16"></lucide-angular>
            </div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--text-primary);">
              {{ type === 'import' ? 'Thêm lý do nhập kho' : 'Thêm lý do xuất kho' }}
            </h3>
          </div>
          <button type="button" (click)="closeAddReasonModal()" style="background: transparent; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 4px; display: flex;" title="Đóng">
            <lucide-angular [img]="icons.X" size="18"></lucide-angular>
          </button>
        </div>

        <!-- Body Popup -->
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <!-- Field 1: Lý do (kèm giới hạn từ) -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-size: 13px; font-weight: 400; color: var(--text-primary);">
                {{ type === 'import' ? 'Lý do nhập kho' : 'Lý do xuất kho' }} <span style="color: #ef4444;">*</span>
              </label>
              <span style="font-size: 11.5px; font-weight: 400;" [style.color]="getWordCount(newReasonText) > 10 ? '#ef4444' : 'var(--text-muted)'">
                {{ getWordCount(newReasonText) }} / 10 từ
              </span>
            </div>
            <input 
              type="text" 
              [(ngModel)]="newReasonText"
              maxlength="70"
              [placeholder]="type === 'import' ? 'VD: Nhập hàng mẫu từ triển lãm, Nhập hàng bảo hành...' : 'VD: Xuất quà tặng tri ân, Xuất mẫu cho kiến trúc sư...'" 
              style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 13px; color: var(--text-primary); outline: none; transition: border-color 0.15s;"
              [style.border-color]="getWordCount(newReasonText) > 10 ? '#ef4444' : 'var(--border-color)'"
              (keydown.enter)="confirmAddReason()"
            />
            <div *ngIf="getWordCount(newReasonText) > 10" style="font-size: 11.5px; color: #ef4444; font-weight: 500;">
              {{ type === 'import' ? 'Lý do nhập không được vượt quá 10 từ. Vui lòng rút gọn nội dung.' : 'Lý do xuất không được vượt quá 10 từ. Vui lòng rút gọn nội dung.' }}
            </div>
          </div>

          <!-- Field 2: Checkbox Có yêu cầu thông tin đối tác / nhà cung cấp không -->
          <div 
            (click)="toggleNewReasonRequiresSupplier()"
            style="padding: 12px 14px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.15s ease;"
            [style.border-color]="newReasonRequiresSupplier ? 'var(--accent)' : 'var(--border-color)'"
          >
            <div style="display: flex; align-items: flex-start; gap: 10px; user-select: none;">
              <div 
                style="display: flex; align-items: center; justify-content: center; margin-top: 2px; flex-shrink: 0;"
                [style.color]="newReasonRequiresSupplier ? 'var(--accent)' : 'var(--text-muted)'"
              >
                <lucide-angular *ngIf="newReasonRequiresSupplier" [img]="icons.CheckSquare" size="16"></lucide-angular>
                <lucide-angular *ngIf="!newReasonRequiresSupplier" [img]="icons.Square" size="16"></lucide-angular>
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Yêu cầu đối tác</span>
                <span style="font-size: 11.5px; color: var(--text-muted); line-height: 1.35;">
                  {{ type === 'import' ? 'Bật nếu đơn nhập cần ghi nhận cho đối tác' : 'Bật nếu đơn xuất cần ghi nhận cho đối tác' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Khung cấu hình tên gọi của trường đối tác (Mở ra khi đã tick yêu cầu nhà cung cấp / đối tác) -->
          <div 
            *ngIf="newReasonRequiresSupplier"
            (click)="$event.stopPropagation()"
            style="display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; background: rgba(245, 128, 37, 0.04); border: 1px dashed var(--accent); border-radius: 8px;"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <label style="font-size: 12.5px; font-weight: 600; color: var(--text-primary);">
                Tên gọi của trường đối tác <span style="color: #ef4444;">*</span>
              </label>
              <span style="font-size: 11px; color: var(--text-muted);">Hiển thị trên form</span>
            </div>

            <!-- Ô nhập tên gọi của trường đối tác (Điền sẵn Khách hàng khi xuất kho, Nhà cung ứng khi nhập kho) -->
            <input 
              type="text" 
              [(ngModel)]="newReasonPartnerLabel"
              [placeholder]="type === 'import' ? 'VD: Nhà cung ứng, Đối tác dự án, Nhà máy...' : 'VD: Khách hàng, Đối tác dự án...'"
              maxlength="40"
              style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 12.5px; color: var(--text-primary); outline: none;"
            />
          </div>
        </div>

        <!-- Footer Popup -->
        <div style="padding: 14px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg-secondary);">
          <button 
            type="button"
            (click)="closeAddReasonModal()"
            style="padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer;"
          >
            Hủy
          </button>
          <button 
            type="button"
            (click)="confirmAddReason()"
            [disabled]="!newReasonText.trim() || getWordCount(newReasonText) > 10"
            [ngStyle]="{
              'opacity': (!newReasonText.trim() || getWordCount(newReasonText) > 10) ? '0.5' : '1',
              'cursor': (!newReasonText.trim() || getWordCount(newReasonText) > 10) ? 'not-allowed' : 'pointer'
            }"
            style="padding: 8px 20px; border-radius: 6px; border: none; background: #765337; color: #ffffff; font-size: 13px; font-weight: 600; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 6px rgba(118, 83, 55, 0.25);"
            onmouseover="if(!this.disabled) { this.style.background='#5a3d26'; this.style.boxShadow='0 4px 12px rgba(90, 61, 38, 0.35)'; this.style.transform='translateY(-1px)'; }"
            onmouseout="if(!this.disabled) { this.style.background='#765337'; this.style.boxShadow='0 2px 6px rgba(118, 83, 55, 0.25)'; this.style.transform='translateY(0)'; }"
          >
            Thêm lý do
          </button>
        </div>

      </div>
    </div>

    <!-- Modal Popup Xác nhận Hủy bỏ Nhập/Xuất kho -->
    <div *ngIf="showDiscardConfirmModal" class="confirm-modal-backdrop" (click)="cancelDiscard()">
      <div class="confirm-modal-card" (click)="$event.stopPropagation()">
        <div class="confirm-modal-header">
          <div class="confirm-modal-icon-wrapper warning">
            <lucide-angular [img]="icons.AlertCircle" size="22"></lucide-angular>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0;">
              Xác nhận hủy bỏ
            </h3>
            <p style="font-size: 13.5px; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              Bạn có chắc chắn muốn hủy bỏ? Các dữ liệu đã nhập chưa lưu sẽ bị mất.
            </p>
          </div>
          <button type="button" (click)="cancelDiscard()" class="confirm-close-btn" title="Đóng">
            <lucide-angular [img]="icons.X" size="18"></lucide-angular>
          </button>
        </div>

        <div class="confirm-modal-footer">
          <button 
            type="button" 
            (click)="cancelDiscard()" 
            class="admin-btn admin-btn-secondary"
            style="padding: 8px 18px; font-size: 13px; border-radius: 8px;"
          >
            Tiếp tục tạo phiếu
          </button>
          <button 
            type="button" 
            (click)="confirmDiscard()" 
            style="background: #ef4444; color: #ffffff; border: none; padding: 8px 18px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; cursor: pointer; transition: background 0.15s ease;"
            onmouseover="this.style.background='#dc2626'"
            onmouseout="this.style.background='#ef4444'"
          >
            <lucide-angular [img]="icons.X" size="14"></lucide-angular>
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>

    <!-- POPUP HỦY PHIẾU (yêu cầu nhập lý do) -->
    <div *ngIf="showCancelOrderModal" class="confirm-modal-backdrop" (click)="closeCancelOrderModal()">
      <div class="confirm-modal-card" (click)="$event.stopPropagation()">
        <div class="confirm-modal-header">
          <div class="confirm-modal-icon-wrapper warning">
            <lucide-angular [img]="icons.AlertCircle" size="22"></lucide-angular>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0;">Hủy phiếu {{ type === 'import' ? 'nhập kho' : 'xuất kho' }}</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;">Vui lòng nhập lý do hủy phiếu. Hành động này không thể hoàn tác.</p>
          </div>
          <button type="button" (click)="closeCancelOrderModal()" class="confirm-close-btn" title="Đóng">
            <lucide-angular [img]="icons.X" size="18"></lucide-angular>
          </button>
        </div>
        <div style="padding: 16px 20px;">
          <label style="font-size: 13px; font-weight: 500; color: var(--text-primary); display: block; margin-bottom: 6px;">
            Lý do hủy <span style="color: #ef4444;">*</span>
          </label>
          <textarea
            [(ngModel)]="cancelOrderReasonInput"
            [placeholder]="'Nhập lý do hủy phiếu ' + (type === 'import' ? 'nhập kho' : 'xuất kho') + '...'"
            rows="3"
            style="width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-primary); font-size: 13px; color: var(--text-primary); outline: none; resize: vertical; font-family: inherit;"
            [style.border-color]="cancelOrderReasonInput.trim() ? 'var(--border-color)' : '#f59e0b'"
          ></textarea>
        </div>
        <div class="confirm-modal-footer">
          <button type="button" (click)="closeCancelOrderModal()" 
            [disabled]="isCancellingOrder"
            [style.opacity]="isCancellingOrder ? '0.5' : '1'"
            [style.cursor]="isCancellingOrder ? 'not-allowed' : 'pointer'"
            class="admin-btn admin-btn-secondary" style="padding: 8px 18px; font-size: 13px; border-radius: 8px;">
            Quay lại
          </button>
          <button type="button" (click)="confirmCancelOrder()"
            [disabled]="!cancelOrderReasonInput.trim() || isCancellingOrder"
            style="background: #ef4444; color: #ffffff; border: none; padding: 8px 20px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; transition: background 0.15s ease;"
            [style.opacity]="(!cancelOrderReasonInput.trim() || isCancellingOrder) ? '0.5' : '1'"
            [style.cursor]="(!cancelOrderReasonInput.trim() || isCancellingOrder) ? 'not-allowed' : 'pointer'"
            onmouseover="if(!this.disabled) this.style.background='#dc2626'"
            onmouseout="if(!this.disabled) this.style.background='#ef4444'"
          >
            <lucide-angular *ngIf="!isCancellingOrder" [img]="icons.Ban" size="14"></lucide-angular>
            <lucide-angular *ngIf="isCancellingOrder" [img]="icons.Loader2" size="14" style="animation: spin 0.8s linear infinite;"></lucide-angular>
            <span>{{ isCancellingOrder ? 'Đang hủy phiếu...' : 'Xác nhận hủy phiếu' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- POPUP XÓA PHIẾU (xác nhận) -->
    <div *ngIf="showDeleteOrderModal" class="confirm-modal-backdrop" (click)="!isDeletingOrder && closeDeleteOrderModal()">
      <div class="confirm-modal-card" (click)="$event.stopPropagation()">
        <div class="confirm-modal-header">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: rgba(239, 68, 68, 0.12); color: #ef4444; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <lucide-angular [img]="icons.Trash2" size="22"></lucide-angular>
          </div>
          <div style="flex: 1;">
            <h3 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0;">Xóa phiếu {{ type === 'import' ? 'nhập kho' : 'xuất kho' }}</h3>
            <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;">Bạn có chắc chắn muốn xóa phiếu nháp này? Hành động này không thể hoàn tác.</p>
          </div>
          <button type="button" (click)="!isDeletingOrder && closeDeleteOrderModal()" [disabled]="isDeletingOrder" class="confirm-close-btn" title="Đóng"
            [style.opacity]="isDeletingOrder ? '0.4' : '1'"
            [style.cursor]="isDeletingOrder ? 'not-allowed' : 'pointer'"
          >
            <lucide-angular [img]="icons.X" size="18"></lucide-angular>
          </button>
        </div>
        <div class="confirm-modal-footer">
          <button type="button" (click)="!isDeletingOrder && closeDeleteOrderModal()" 
            [disabled]="isDeletingOrder"
            [style.opacity]="isDeletingOrder ? '0.5' : '1'"
            [style.cursor]="isDeletingOrder ? 'not-allowed' : 'pointer'"
            class="admin-btn admin-btn-secondary" style="padding: 8px 18px; font-size: 13px; border-radius: 8px;">
            Hủy bỏ
          </button>
          <button type="button" (click)="confirmDeleteOrder()"
            [disabled]="isDeletingOrder"
            style="background: #ef4444; color: #ffffff; border: none; padding: 8px 20px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; transition: background 0.15s ease;"
            [style.opacity]="isDeletingOrder ? '0.5' : '1'"
            [style.cursor]="isDeletingOrder ? 'not-allowed' : 'pointer'"
            onmouseover="if(!this.disabled) this.style.background='#dc2626'"
            onmouseout="if(!this.disabled) this.style.background='#ef4444'"
          >
            <lucide-angular *ngIf="!isDeletingOrder" [img]="icons.Trash2" size="14"></lucide-angular>
            <lucide-angular *ngIf="isDeletingOrder" [img]="icons.Loader2" size="14" style="animation: spin 0.8s linear infinite;"></lucide-angular>
            <span>{{ isDeletingOrder ? 'Đang xóa...' : 'Xóa' }}</span>
          </button>
        </div>
      </div>
    </div>
  `

})
export class TransactionModalComponent implements OnInit, OnChanges {
  icons = { 
    X, Plus, Minus, Trash2, Filter, Search, ChevronUp, ChevronDown, 
    Lock, Calendar, User, FileText, CheckCircle2, AlertCircle, Save,
    CheckSquare, Square, Package, Percent, Play, Printer, Ban, Pencil, RotateCcw, Clock,
    Loader2, ArrowLeftRight
  };
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // Trạng thái khóa nút khi đang submit form
  isSubmitting = false;
  isSubmittingDraft = false;
  isSubmittingOrder = false;

  // Trạng thái khóa nút khi thực hiện hành động trên phiếu ở chế độ xem
  isPlanningOrder = false;
  isExecutingOrder = false;
  isSavingDraftEdit = false;

  get isAnyActionProcessing(): boolean {
    return this.isSubmitting ||
           this.isSubmittingDraft ||
           this.isSubmittingOrder ||
           this.isPlanningOrder ||
           this.isExecutingOrder ||
           this.isSavingDraftEdit ||
           this.isCancellingOrder ||
           this.isDeletingOrder;
  }

  @Input() isOpen = false;
  @Input() type: 'import' | 'export' = 'export';
  @Input() products: any[] = [];
  @Input() initialLocationId = '';
  @Input() initialProductId = '';
  @Input() initialVariantId = '';
  @Input() isProductFixed = false;
  @Input() isVariantFixed = false;
  /** When set, modal opens in VIEW mode for an existing order */
  @Input() viewOrderData: any = null;

  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<any>();
  @Output() onStatusChange = new EventEmitter<{ orderId: string; newStatus: string; reason?: string; actionLogs?: ActionLogItem[] }>();
  @Output() onDeleteOrder = new EventEmitter<string>();
  @Output() onUpdateOrder = new EventEmitter<any>();

  // ── View-mode state ──
  /** True when showing an existing order (not creating) */
  get isViewMode(): boolean { return !!this.viewOrderData; }
  get viewStatus(): string {
    const raw = String(this.viewOrderData?.rawStatus || this.viewOrderData?.status || '').toUpperCase().trim();
    if (raw === 'BẢN NHÁP' || raw === 'NHÁP' || raw === 'PENDING') return 'DRAFT';
    if (raw === 'LÊN KẾ HOẠCH' || raw === 'CHỜ NHẬP KHO' || raw === 'CHỜ XUẤT KHO' || raw === 'PROCESSING') return 'PLANNED';
    if (raw === 'ĐÃ XUẤT KHO') return 'EXPORTED';
    if (raw === 'ĐÃ NHẬP KHO') return 'IMPORTED';
    if (raw === 'ĐÃ HỦY') return 'CANCELLED';
    return raw;
  }
  /** Canonical statuses: DRAFT | PLANNED | EXPORTED | IMPORTED | COMPLETED | CANCELLED */
  get isDraft(): boolean        { return this.viewStatus === 'DRAFT'; }
  get isPlanned(): boolean      { return this.viewStatus === 'PLANNED'; }
  get isExported(): boolean     { return this.type === 'export' && (this.viewStatus === 'EXPORTED' || this.viewStatus === 'COMPLETED'); }
  get isImported(): boolean     { return this.type === 'import' && (this.viewStatus === 'IMPORTED' || this.viewStatus === 'COMPLETED'); }
  get isCompletedStock(): boolean { return this.isExported || this.isImported; }
  get isCancelled(): boolean    { return this.viewStatus === 'CANCELLED'; }
  get isReadOnlyOrder(): boolean { return this.isCompletedStock || this.isCancelled; }

  get isTransferImport(): boolean {
    if (this.type !== 'import') return false;
    const r = (this.viewOrderData?.reason || this.transactionReason || '').toLowerCase();
    const id = (this.viewOrderData?.id || this.orderCode || '').toLowerCase();
    const ref = (this.viewOrderData?.referenceCode || '').toLowerCase();
    return r.includes('chuyển kho') || id.includes('ck') || ref.includes('ck') || !!this.viewOrderData?.linkedTransferCode;
  }

  getConfirmActionBtnLabel(): string {
    if (this.isExecutingOrder) {
      return this.type === 'import' ? 'Đang nhập kho...' : 'Đang xuất kho...';
    }
    return this.type === 'import' ? 'Xác nhận Nhập kho' : 'Xác nhận Xuất kho';
  }

  // Draft editing state
  isEditingDraft = false;
  backupOrderData: any = null;

  get isFormDisabled(): boolean {
    if (!this.isViewMode) return false;
    if (this.isDraft && this.isEditingDraft) return false;
    return true;
  }

  // Cancel-order popup state
  showCancelOrderModal = false;
  cancelOrderReasonInput = '';
  isCancellingOrder = false;

  // Delete-order popup state
  showDeleteOrderModal = false;
  isDeletingOrder = false;

  actionLogs: ActionLogItem[] = [];

  getInitials(name: string): string {
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  formatDisplayDate(timestamp?: string): string {
    if (!timestamp) return '—';
    try {
      let d: Date;
      const match = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (match && !timestamp.endsWith('Z')) {
        const [, yyyy, mm, dd, hh, min] = match;
        d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
      } else {
        const viMatch = String(timestamp).match(/(\d{1,2}):(\d{2}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        const viMatch2 = String(timestamp).match(/(\d{1,2})\/(\d{1,2})\/(\d{4}).*?(\d{1,2}):(\d{2})/);
        if (viMatch) {
          const [, h, m, day, mon, yr] = viMatch;
          d = new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(m));
        } else if (viMatch2) {
          const [, day, mon, yr, h, m] = viMatch2;
          d = new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(m));
        } else {
          d = new Date(timestamp);
        }
      }
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, '0');
        return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
      }
    } catch {}
    return timestamp;
  }

  getFormattedTransactionDate(): string {
    if (!this.transactionDate) return '';
    try {
      let d: Date;
      const match = this.transactionDate.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if (match) {
        const [, yyyy, mm, dd, hh, min] = match;
        d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
      } else {
        d = new Date(this.transactionDate);
      }
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const hoursStr = String(hours).padStart(2, '0');
        return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
      }
    } catch {}
    return this.transactionDate;
  }

  openDatePicker(picker: HTMLInputElement) {
    if (this.isFormDisabled) return;
    if (picker && typeof (picker as any).showPicker === 'function') {
      try {
        (picker as any).showPicker();
      } catch {
        picker.focus();
      }
    }
  }

  getStatusLabel(status?: string): string {
    if (!status) return '';
    switch (status) {
      case 'DRAFT': return 'Nháp';
      case 'PLANNED': return this.type === 'import' ? 'Lên kế hoạch nhập' : 'Lên kế hoạch xuất';
      case 'EXPORTED': return 'Đã xuất kho';
      case 'IMPORTED': return 'Đã nhập kho';
      case 'COMPLETED': return this.type === 'import' ? 'Đã nhập kho' : 'Đã xuất kho';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  getStatusBadgeStyle(status?: string): Record<string, string> {
    if (!status) return {};
    switch (status) {
      case 'DRAFT':
        return {
          'background': 'rgba(245, 158, 11, 0.12)',
          'color': '#d97706',
          'border': '1px solid rgba(245, 158, 11, 0.3)'
        };
      case 'PLANNED':
        return {
          'background': 'rgba(124, 58, 237, 0.12)',
          'color': '#7c3aed',
          'border': '1px solid rgba(124, 58, 237, 0.3)'
        };
      case 'EXPORTED':
      case 'IMPORTED':
      case 'COMPLETED':
        return {
          'background': 'rgba(16, 185, 129, 0.12)',
          'color': '#059669',
          'border': '1px solid rgba(16, 185, 129, 0.3)'
        };
      case 'CANCELLED':
        return {
          'background': 'rgba(239, 68, 68, 0.12)',
          'color': '#ef4444',
          'border': '1px solid rgba(239, 68, 68, 0.3)'
        };
      default:
        return {
          'background': 'var(--bg-secondary)',
          'color': 'var(--text-muted)',
          'border': '1px solid var(--border-color)'
        };
    }
  }

  extractLogsFromNotes(notes: string | null | undefined): ActionLogItem[] | null {
    if (!notes) return null;
    const match = notes.match(/\[ACTION_LOGS:(\[[\s\S]*?\])\]/) || notes.match(/\[ACTION_LOGS:([\s\S]*?)\]\]/) || notes.match(/\[ACTION_LOGS:([\s\S]*?)\]/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    // Bracket counting fallback
    const startIdx = notes.indexOf('[ACTION_LOGS:[');
    if (startIdx !== -1) {
      const jsonStart = startIdx + '[ACTION_LOGS:'.length;
      let depth = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < notes.length; i++) {
        if (notes[i] === '[') depth++;
        else if (notes[i] === ']') {
          depth--;
          if (depth === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }
      if (jsonEnd !== -1) {
        try {
          const parsed = JSON.parse(notes.slice(jsonStart, jsonEnd));
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {}
      }
    }
    return null;
  }

  cleanNotesForDisplay(notes: string | null | undefined): string {
    if (!notes) return '';
    return notes
      .replace(/\[ACTION_LOGS:\[[\s\S]*?\]\]/g, '')
      .replace(/\[ACTION_LOGS:[\s\S]*?\]\]/g, '')
      .replace(/\[ACTION_LOGS:[\s\S]*?\]/g, '')
      .replace(/\[STATUS:[^\]]+\]/g, '')
      .replace(/\[ORIGIN:[^\]]+\]/g, '')
      .replace(/\[Người lập:[^\]]+\]/g, '')
      .replace(/\[Người nhận:[^\]]+\]/g, '')
      .replace(/\[Lý do hủy:[^\]]+\]/g, '')
      .trim();
  }

  generateOrderBaselineLogs(v: any): ActionLogItem[] {
    const logs: ActionLogItem[] = [];
    const operator = v.creatorName || v.creator || this.creatorName || 'Admin Quản Trị';
    const createdAt = v.createdAt || v.date || new Date().toISOString();
    const rawStatus = v.rawStatus || v.status || 'DRAFT';
    const rawNotes = v.rawNotes || v.notes || '';

    const wasDraft = rawStatus === 'DRAFT' || 
                     rawNotes.includes('[ORIGIN:DRAFT]') || 
                     rawNotes.includes('[STATUS:DRAFT]') ||
                     rawNotes.includes('Tạo bản nháp') ||
                     rawNotes.includes('bản nháp');

    if (wasDraft) {
      logs.push({
        timestamp: createdAt,
        operator,
        actionType: 'CREATE',
        toStatus: 'DRAFT',
        actionLabel: 'Tạo bản nháp'
      });

      if (rawStatus !== 'DRAFT') {
        logs.push({
          timestamp: v.plannedAt || createdAt,
          operator,
          actionType: 'STATUS_CHANGE',
          fromStatus: 'DRAFT',
          toStatus: 'PLANNED'
        });
      }
    } else {
      logs.push({
        timestamp: createdAt,
        operator,
        actionType: 'CREATE',
        toStatus: 'PLANNED',
        actionLabel: this.type === 'import' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho'
      });
    }

    if (rawStatus === 'EXPORTED' || rawStatus === 'IMPORTED' || rawStatus === 'COMPLETED') {
      const completedStatus = this.type === 'import' ? 'IMPORTED' : 'EXPORTED';
      logs.push({
        timestamp: v.completedAt || v.updatedAt || createdAt,
        operator,
        actionType: 'STATUS_CHANGE',
        fromStatus: 'PLANNED',
        toStatus: completedStatus
      });
    }

    if (rawStatus === 'CANCELLED') {
      const reasonMatch = (rawNotes || '').match(/\[Lý do hủy:\s*([^\]]+)\]/);
      logs.push({
        timestamp: v.updatedAt || createdAt,
        operator,
        actionType: 'CANCEL',
        fromStatus: wasDraft && rawStatus === 'DRAFT' ? 'DRAFT' : 'PLANNED',
        toStatus: 'CANCELLED',
        reason: reasonMatch ? reasonMatch[1] : (this.cleanNotesForDisplay(rawNotes) || 'Hủy theo yêu cầu')
      });
    }

    return logs;
  }

  getViewStatusLabel(): string {
    switch (this.viewStatus) {
      case 'DRAFT':     case 'PENDING':    return 'Bản nháp';
      case 'PLANNED':   case 'PROCESSING': return this.type === 'import' ? 'Chờ nhập kho' : 'Lên kế hoạch xuất';
      case 'EXPORTED':  return 'Đã xuất kho';
      case 'IMPORTED':  return 'Đã nhập kho';
      case 'COMPLETED': return this.type === 'import' ? 'Đã nhập kho' : 'Đã xuất kho';
      case 'CANCELLED': return 'Đã hủy';
      default:          return this.viewStatus || 'Đang xử lý';
    }
  }

  getViewStatusColor(): string {
    switch (this.viewStatus) {
      case 'DRAFT':     case 'PENDING':    return '#d97706';
      case 'PLANNED':   case 'PROCESSING': return '#7c3aed';
      case 'EXPORTED':  case 'IMPORTED': case 'COMPLETED': return '#059669';
      case 'CANCELLED': return '#ef4444';
      default:          return 'var(--text-muted)';
    }
  }

  getViewStatusBg(): string {
    switch (this.viewStatus) {
      case 'DRAFT':     case 'PENDING':    return 'rgba(245, 158, 11, 0.12)';
      case 'PLANNED':   case 'PROCESSING': return 'rgba(124, 58, 237, 0.12)';
      case 'EXPORTED':  case 'IMPORTED': case 'COMPLETED': return 'rgba(16, 185, 129, 0.12)';
      case 'CANCELLED': return 'rgba(239, 68, 68, 0.12)';
      default:          return 'var(--bg-secondary)';
    }
  }

  getCancelReasonText(): string {
    const n = this.viewOrderData?.notes || this.transactionNote || '';
    const m = n.match(/\[Lý do hủy:\s*([^\]]+)\]/i);
    return m ? m[1] : '';
  }

  // ── View-mode actions ──
  openDeleteOrderModal() {
    if (this.isAnyActionProcessing) return;
    this.showDeleteOrderModal = true;
  }
  closeDeleteOrderModal() {
    if (this.isDeletingOrder) return;
    this.showDeleteOrderModal = false;
  }
  confirmDeleteOrder() {
    if (this.isDeletingOrder) return;
    if (!this.viewOrderData?.rawId && !this.viewOrderData?.id) return;
    this.isDeletingOrder = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      if (this.isDeletingOrder) {
        this.isDeletingOrder = false;
        this.cdr.markForCheck();
      }
    }, 12000);

    const orderId = this.viewOrderData.rawId || this.viewOrderData.id;
    this.onDeleteOrder.emit(orderId);
  }

  startEditDraft() {
    if (this.isAnyActionProcessing) return;
    this.backupOrderData = {
      location: this.transactionLocation,
      reason: this.transactionReason,
      destination: this.transactionDestination,
      recipient: this.recipientName,
      notes: this.transactionNote,
      referenceCode: this.referenceCode,
      date: this.transactionDate,
      discountAmount: this.discountAmount,
      taxRate: this.taxRate,
      shippingFee: this.shippingFee,
      items: JSON.parse(JSON.stringify(this.lineItems))
    };
    this.isEditingDraft = true;
  }

  cancelEditDraft() {
    if (this.backupOrderData) {
      this.transactionLocation = this.backupOrderData.location;
      this.transactionReason = this.backupOrderData.reason;
      this.transactionDestination = this.backupOrderData.destination;
      this.recipientName = this.backupOrderData.recipient;
      this.transactionNote = this.backupOrderData.notes;
      this.referenceCode = this.backupOrderData.referenceCode;
      this.transactionDate = this.backupOrderData.date;
      this.discountAmount = this.backupOrderData.discountAmount;
      this.taxRate = this.backupOrderData.taxRate;
      this.shippingFee = this.backupOrderData.shippingFee;
      this.lineItems = JSON.parse(JSON.stringify(this.backupOrderData.items));
    }
    this.isEditingDraft = false;
  }

  saveEditDraft() {
    if (this.isAnyActionProcessing) return;
    if (!this.viewOrderData?.rawId && !this.viewOrderData?.id) return;
    this.isSavingDraftEdit = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      if (this.isSavingDraftEdit) {
        this.isSavingDraftEdit = false;
        this.cdr.markForCheck();
      }
    }, 12000);

    const orderId = this.viewOrderData.rawId || this.viewOrderData.id;
    const cleanNote = this.cleanNotesForDisplay(this.transactionNote);
    const logsPayload = `[ACTION_LOGS:${JSON.stringify(this.actionLogs)}]`;
    const finalNotes = cleanNote ? `${cleanNote}\n${logsPayload}` : logsPayload;
    const isImport = this.type === 'import';

    const payload = {
      orderId,
      orderData: {
        sourceLocation: isImport ? (this.recipientName || 'Nhà cung cấp') : this.getLocationLabel(),
        destinationLocation: isImport ? this.getLocationLabel() : (this.transactionDestination || this.recipientName),
        sourceWarehouseId: isImport ? null : this.transactionLocation,
        destWarehouseId: isImport ? this.transactionLocation : this.transactionDestination,
        reason: this.transactionReason,
        notes: finalNotes,
        referenceCode: this.referenceCode,
        taxRate: this.taxRate,
        discount: this.getDiscountValue(),
        shippingFee: this.getShippingValue(),
        items: this.lineItems.map(it => ({
          variantId: it.variantId,
          quantity: parseInt(it.quantity, 10) || 1,
          price: it.price ? parseInt(it.price.replace(/\D/g, ''), 10) : 0,
          unit: it.unit || 'Chiếc',
          lotNumber: it.lotNumber,
          expiryDate: it.expiryDate
        }))
      }
    };
    this.onUpdateOrder.emit(payload);
    this.isEditingDraft = false;
  }

  handlePlanOrder() {
    if (!this.canPlanOrder()) {
      if (this.type === 'export' && this.hasExceededStock()) {
        this.triggerToast('Không thể tạo phiếu xuất!', 'Có sản phẩm vượt quá tồn kho khả dụng. Vui lòng kiểm tra lại.', 'error');
      }
      return;
    }
    if (this.isAnyActionProcessing) return;
    if (!this.viewOrderData?.rawId && !this.viewOrderData?.id) return;
    this.isPlanningOrder = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      if (this.isPlanningOrder) {
        this.isPlanningOrder = false;
        this.cdr.markForCheck();
      }
    }, 12000);

    const orderId = this.viewOrderData.rawId || this.viewOrderData.id;
    this.actionLogs.push({
      timestamp: new Date().toISOString(),
      operator: this.creatorName || 'Admin Quản Trị',
      actionType: 'STATUS_CHANGE',
      fromStatus: 'DRAFT',
      toStatus: 'PLANNED'
    });
    if (this.viewOrderData) {
      this.viewOrderData.status = 'PLANNED';
      this.viewOrderData.rawStatus = 'PLANNED';
    }
    this.isEditingDraft = false;
    this.cdr.markForCheck();
    this.onStatusChange.emit({ orderId, newStatus: 'PLANNED', actionLogs: this.actionLogs });
  }

  handleConfirmExecution() {
    if (!this.canConfirmExecution()) {
      if (this.type === 'export' && this.hasExceededStock()) {
        this.triggerToast('Không thể xuất kho!', 'Có sản phẩm vượt quá tồn kho thực tế. Vui lòng kiểm tra lại.', 'error');
      }
      return;
    }
    if (this.isAnyActionProcessing) return;
    if (!this.viewOrderData?.rawId && !this.viewOrderData?.id) return;
    this.isExecutingOrder = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      if (this.isExecutingOrder) {
        this.isExecutingOrder = false;
        this.cdr.markForCheck();
      }
    }, 12000);

    const orderId = this.viewOrderData.rawId || this.viewOrderData.id;
    const newStatus = this.type === 'import' ? 'IMPORTED' : 'EXPORTED';
    const fromStatus = (this.viewStatus === 'DRAFT') ? 'DRAFT' : 'PLANNED';
    this.actionLogs.push({
      timestamp: new Date().toISOString(),
      operator: this.creatorName || 'Admin Quản Trị',
      actionType: 'STATUS_CHANGE',
      fromStatus,
      toStatus: newStatus
    });
    if (this.viewOrderData) {
      this.viewOrderData.status = newStatus;
      this.viewOrderData.rawStatus = newStatus;
    }
    this.isEditingDraft = false;
    this.cdr.markForCheck();
    this.onStatusChange.emit({ orderId, newStatus, actionLogs: this.actionLogs });
  }

  handleExportOrder() {
    this.handleConfirmExecution();
  }

  openCancelOrderModal() {
    if (this.isAnyActionProcessing) return;
    this.cancelOrderReasonInput = '';
    this.showCancelOrderModal = true;
  }
  closeCancelOrderModal() {
    if (this.isCancellingOrder) return;
    this.showCancelOrderModal = false;
    this.cancelOrderReasonInput = '';
  }
  confirmCancelOrder() {
    if (this.isCancellingOrder) return;
    if (!this.cancelOrderReasonInput.trim()) return;
    if (!this.viewOrderData?.rawId && !this.viewOrderData?.id) return;
    this.isCancellingOrder = true;
    this.cdr.markForCheck();

    setTimeout(() => {
      if (this.isCancellingOrder) {
        this.isCancellingOrder = false;
        this.cdr.markForCheck();
      }
    }, 12000);

    const orderId = this.viewOrderData.rawId || this.viewOrderData.id;
    const reason = this.cancelOrderReasonInput.trim();
    this.actionLogs.push({
      timestamp: new Date().toISOString(),
      operator: this.creatorName || 'Admin Quản Trị',
      actionType: 'CANCEL',
      fromStatus: this.viewStatus || 'PLANNED',
      toStatus: 'CANCELLED',
      reason
    });
    this.onStatusChange.emit({ orderId, newStatus: 'CANCELLED', reason, actionLogs: this.actionLogs });
  }

  populateFromViewOrder() {
    if (!this.viewOrderData) return;
    this.isEditingDraft = false;
    const v = this.viewOrderData;
    this.orderCode = v.orderCode || v.auditCode || v.id || this.orderCode;
    this.creatorName = v.creatorName || v.creator || 'Admin Quản Trị';
    if (v.createdAt || v.date) {
      try {
        const rawDate = v.createdAt || v.date;
        let d: Date;
        if (rawDate instanceof Date) {
          d = rawDate;
        } else {
          const str = String(rawDate).trim();
          const viMatch = str.match(/(\d{1,2}):(\d{2}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          const viMatch2 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}).*?(\d{1,2}):(\d{2})/);
          if (viMatch) {
            const [, h, m, day, mon, yr] = viMatch;
            d = new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(m));
          } else if (viMatch2) {
            const [, day, mon, yr, h, m] = viMatch2;
            d = new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(m));
          } else {
            d = new Date(str);
          }
        }
        if (!isNaN(d.getTime())) {
          this.transactionDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        }
      } catch {}
    }
    const noteSource = v.rawNotes || v.notes;
    const existingLogs = (Array.isArray(v.actionLogs) && v.actionLogs.length > 0)
      ? v.actionLogs
      : this.extractLogsFromNotes(noteSource);

    if (existingLogs && existingLogs.length > 0) {
      this.actionLogs = [...existingLogs];
      const rawStatus = v.rawStatus || v.status || 'DRAFT';
      const lastLog = this.actionLogs[this.actionLogs.length - 1];
      const hasCompleted = this.actionLogs.some(l => l.toStatus === 'EXPORTED' || l.toStatus === 'IMPORTED' || l.toStatus === 'COMPLETED');
      const hasPlanned = this.actionLogs.some(l => l.toStatus === 'PLANNED');

      if ((rawStatus === 'PLANNED' || rawStatus === 'PROCESSING') && !hasPlanned) {
        this.actionLogs.push({
          timestamp: v.updatedAt || new Date().toISOString(),
          operator: this.creatorName || 'Admin Quản Trị',
          actionType: 'STATUS_CHANGE',
          fromStatus: lastLog?.toStatus || 'DRAFT',
          toStatus: 'PLANNED'
        });
      } else if ((rawStatus === 'EXPORTED' || rawStatus === 'IMPORTED' || rawStatus === 'COMPLETED') && !hasCompleted) {
        if (!hasPlanned && lastLog?.toStatus === 'DRAFT') {
          this.actionLogs.push({
            timestamp: v.updatedAt || new Date().toISOString(),
            operator: this.creatorName || 'Admin Quản Trị',
            actionType: 'STATUS_CHANGE',
            fromStatus: 'DRAFT',
            toStatus: 'PLANNED'
          });
        }
        const completedStatus = this.type === 'import' ? 'IMPORTED' : 'EXPORTED';
        this.actionLogs.push({
          timestamp: v.completedAt || v.updatedAt || new Date().toISOString(),
          operator: this.creatorName || 'Admin Quản Trị',
          actionType: 'STATUS_CHANGE',
          fromStatus: 'PLANNED',
          toStatus: completedStatus
        });
      }
    } else {
      this.actionLogs = this.generateOrderBaselineLogs(v);
    }
    this.transactionNote = this.cleanNotesForDisplay(v.notes);
    this.referenceCode = v.referenceCode || '';
    this.transactionReason = v.reason || '';
    if (this.transactionReason) {
      if (this.type === 'import') {
        if (!this.importReasonOptions.includes(this.transactionReason)) {
          this.importReasonOptions.push(this.transactionReason);
          this.saveCustomReasons();
        }
      } else {
        if (!this.exportReasonOptions.includes(this.transactionReason)) {
          this.exportReasonOptions.push(this.transactionReason);
          this.saveCustomReasons();
        }
      }
    }
    if (v.taxRate !== undefined && v.taxRate !== null) {
      this.taxRate = Number(v.taxRate);
    }
    if (v.discount) {
      this.discountAmount = String(v.discount);
    }
    if (v.shippingFee) {
      this.shippingFee = String(v.shippingFee);
    }

    if (this.type === 'import') {
      this.recipientName = v.recipientName || v.sourceLocation || '';
      this.transactionDestination = v.sourceWarehouseId || '';
      const targetWhStr = v.destinationLocation || v.destWarehouse?.name;
      const targetWhId = v.destWarehouseId || v.sourceWarehouseId;
      if (targetWhId) {
        this.transactionLocation = targetWhId;
      } else if (targetWhStr) {
        const matchWh = this.activeWarehouses.find(w => 
          w.name === targetWhStr || 
          targetWhStr.includes(w.name) || 
          (w.code && targetWhStr.includes(w.code))
        );
        if (matchWh) {
          this.transactionLocation = matchWh.id;
        }
      }
    } else {
      let rec = v.recipientName || v.destinationLocation || '';
      if (rec.startsWith('Khách hàng: ')) rec = rec.replace('Khách hàng: ', '');
      this.recipientName = rec;
      this.transactionDestination = v.destWarehouseId || '';
      const targetWhStr = v.sourceLocation || v.sourceWarehouse?.name;
      const targetWhId = v.sourceWarehouseId;
      if (targetWhId) {
        this.transactionLocation = targetWhId;
      } else if (targetWhStr) {
        const matchWh = this.activeWarehouses.find(w => 
          w.name === targetWhStr || 
          targetWhStr.includes(w.name) || 
          (w.code && targetWhStr.includes(w.code))
        );
        if (matchWh) {
          this.transactionLocation = matchWh.id;
        }
      }
    }

    if (Array.isArray(v.items) && v.items.length > 0) {
      this.lineItems = v.items.map((it: any, idx: number) => {
        let matchedProdId = it.productId || '';
        let matchedVarId = it.variantId || '';
        let matchedUnit = it.unit || 'Chiếc';
        let priceStr = new Intl.NumberFormat('vi-VN').format(it.unitPrice || it.price || 0);

        if (this.availableProducts.length > 0) {
          for (const p of this.availableProducts) {
            const fv = (p.variants || []).find((vx: any) => vx.id === matchedVarId || vx.sku === it.sku || vx.name === it.variant || vx.name === it.variantName);
            if (fv) {
              matchedProdId = p.id;
              matchedVarId = fv.id;
              if (!it.unitPrice && !it.price) {
                priceStr = new Intl.NumberFormat('vi-VN').format(fv.price || 0);
              }
              break;
            }
          }
        }

        return {
          id: (Date.now() + idx).toString(),
          productId: matchedProdId,
          variantId: matchedVarId,
          quantity: String(it.quantity || 1),
          price: priceStr,
          unit: matchedUnit,
          lotNumber: it.lotNumber || '',
          expiryDate: it.expiryDate || '',
          isProductFixed: false,
          isVariantFixed: false,
          productNameDisplay: it.productName,
          variantNameDisplay: it.variant || it.variantName,
          skuDisplay: it.sku
        };
      });
    }
  }

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

  // Quản lý cảnh báo Toast & Xác nhận hủy
  toastMessage = '';
  toastSubMessage = '';
  toastType: 'warning' | 'error' | 'info' = 'warning';
  showToast = false;
  toastTimer: any = null;
  showDiscardConfirmModal = false;

  triggerToast(message: string, subMessage = '', type: 'warning' | 'error' | 'info' = 'warning', durationMs = 5000) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastSubMessage = subMessage;
    this.toastType = type;
    this.showToast = true;
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
    }, durationMs);
  }

  closeToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.showToast = false;
  }

  // Quản lý thông tin chứng từ
  orderCode = '';
  orderSequence = '';
  referenceCode = '';
  transactionDate = '';
  creatorName = 'Admin Quản Trị';
  recipientName = '';
  transactionLocation = '';
  transactionReason = '';
  transactionDestination = '';
  transactionNote = '';
  lineItems: LineItem[] = [];

  // Quản lý tài chính & chi phí cho phiếu nhập
  discountAmount = '';
  taxRate = 0;
  showTaxDropdown = false;
  taxRateOptions: number[] = [0, 8, 10];
  customTaxInput = '';
  shippingFee = '';

  supplierOptions = [
    'BoConcept Vietnam (Nội thất cao cấp)',
    'Công ty CP Gỗ An Cường',
    'Hafele Việt Nam (Phụ kiện & Thiết bị)',
    'Kian Furniture International',
    'Nhà máy Chế biến Gỗ Hố Nai',
    'Tập đoàn Vicostone (Đá thạch anh)',
    'Nội thất Hòa Phát / The One'
  ];

  showLocationDropdown = false;
  showReasonDropdown = false;
  showDestDropdown = false;

  openProductDropdownId: string | null = null;
  openVariantDropdownId: string | null = null;
  openUnitDropdownId: string | null = null;
  productSearchTerm = '';
  variantSearchTerm = '';

  // Vị trí auto dropup/dropdown
  dropdownPositions: { [key: string]: 'up' | 'down' } = { tax: 'down' };

  readonly STORAGE_KEY_IMPORT_REASONS = 'dcor_inventory_reasons_import';
  readonly STORAGE_KEY_EXPORT_REASONS = 'dcor_inventory_reasons_export';
  readonly STORAGE_KEY_REQUIRING_SUPPLIER = 'dcor_inventory_reasons_requiring_supplier';
  readonly STORAGE_KEY_NOT_REQUIRING_SUPPLIER = 'dcor_inventory_reasons_not_requiring_supplier';
  readonly STORAGE_KEY_PARTNER_LABELS = 'dcor_inventory_reasons_partner_labels';

  exportReasonOptions: string[] = [
    'Bán hàng',
    'Chuyển kho',
    'Trả nhà cung cấp',
    'Hủy hàng hỏng',
    'Trưng bày mẫu'
  ];

  importReasonOptions: string[] = [
    'Mua hàng từ Nhà cung cấp',
    'Chuyển kho nội bộ (từ kho khác sang)',
    'Hàng trả lại từ khách hàng (Trả hàng/Đổi trả)',
    'Dư sau kiểm kê / Khác'
  ];

  showAddReasonModal = false;
  newReasonText = '';
  newReasonRequiresSupplier = false;
  newReasonPartnerLabel = 'Nhà cung ứng';

  reasonsRequiringSupplier: Set<string> = new Set([
    'Mua hàng từ Nhà cung cấp',
    'Hàng trả lại từ khách hàng (Trả hàng/Đổi trả)',
    'Bán hàng',
    'Trả nhà cung cấp',
    'Trưng bày mẫu'
  ]);

  reasonsNotRequiringSupplier: Set<string> = new Set([
    'Hủy hàng hỏng',
    'Dư sau kiểm kê / Khác'
  ]);

  reasonPartnerLabelMap: { [reason: string]: string } = {
    'Mua hàng từ Nhà cung cấp': 'Nhà cung cấp',
    'Hàng trả lại từ khách hàng (Trả hàng/Đổi trả)': 'Khách hàng',
    'Bán hàng': 'Khách hàng',
    'Trả nhà cung cấp': 'Nhà cung cấp',
    'Trưng bày mẫu': 'Nơi trưng bày'
  };

  loadStoredReasons() {
    try {
      const storedImport = localStorage.getItem(this.STORAGE_KEY_IMPORT_REASONS);
      if (storedImport) {
        const parsed = JSON.parse(storedImport);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: string) => {
            if (r && typeof r === 'string' && !this.importReasonOptions.includes(r.trim())) {
              this.importReasonOptions.push(r.trim());
            }
          });
        }
      }

      const storedExport = localStorage.getItem(this.STORAGE_KEY_EXPORT_REASONS);
      if (storedExport) {
        const parsed = JSON.parse(storedExport);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: string) => {
            if (r && typeof r === 'string' && !this.exportReasonOptions.includes(r.trim())) {
              this.exportReasonOptions.push(r.trim());
            }
          });
        }
      }

      const storedSupplierReq = localStorage.getItem(this.STORAGE_KEY_REQUIRING_SUPPLIER);
      if (storedSupplierReq) {
        const parsed = JSON.parse(storedSupplierReq);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: string) => {
            if (r && typeof r === 'string') this.reasonsRequiringSupplier.add(r.trim());
          });
        }
      }

      const storedNotSupplierReq = localStorage.getItem(this.STORAGE_KEY_NOT_REQUIRING_SUPPLIER);
      if (storedNotSupplierReq) {
        const parsed = JSON.parse(storedNotSupplierReq);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: string) => {
            if (r && typeof r === 'string') this.reasonsNotRequiringSupplier.add(r.trim());
          });
        }
      }

      const storedLabels = localStorage.getItem(this.STORAGE_KEY_PARTNER_LABELS);
      if (storedLabels) {
        const parsed = JSON.parse(storedLabels);
        if (parsed && typeof parsed === 'object') {
          this.reasonPartnerLabelMap = { ...this.reasonPartnerLabelMap, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not load custom reasons from localStorage:', e);
    }
  }

  saveCustomReasons() {
    try {
      localStorage.setItem(this.STORAGE_KEY_IMPORT_REASONS, JSON.stringify(this.importReasonOptions));
      localStorage.setItem(this.STORAGE_KEY_EXPORT_REASONS, JSON.stringify(this.exportReasonOptions));
      localStorage.setItem(this.STORAGE_KEY_REQUIRING_SUPPLIER, JSON.stringify(Array.from(this.reasonsRequiringSupplier)));
      localStorage.setItem(this.STORAGE_KEY_NOT_REQUIRING_SUPPLIER, JSON.stringify(Array.from(this.reasonsNotRequiringSupplier)));
      localStorage.setItem(this.STORAGE_KEY_PARTNER_LABELS, JSON.stringify(this.reasonPartnerLabelMap));
    } catch (e) {
      console.warn('Could not save custom reasons to localStorage:', e);
    }
  }

  isReasonRequiringPartner(reason: string): boolean {
    if (!reason) return false;
    const r = reason.trim().toLowerCase();
    if (r.includes('chuyển kho')) return false;
    if (this.isReasonDisposal(reason) || (this.type === 'import' && this.isImportAuditSurplus())) return false;
    if (this.reasonsNotRequiringSupplier.has(reason)) return false;
    if (this.reasonsRequiringSupplier.has(reason)) return true;

    if (this.type === 'export') {
      return r.includes('bán') || r.includes('trả') || r.includes('trưng bày') || r.includes('mẫu') || r.includes('ncc') || r.includes('nhà cung cấp');
    } else {
      return r.includes('nhà cung cấp') || r.includes('ncc') || r.includes('mua') || r.includes('khách') || r.includes('trả lại') || r.includes('đổi trả');
    }
  }

  isReasonRequiringSupplier(reason: string): boolean {
    return this.isReasonRequiringPartner(reason);
  }

  getPartnerLabelForReason(reason: string): string {
    if (!reason) return this.type === 'import' ? 'Nhà cung cấp' : 'Khách hàng';
    if (this.reasonPartnerLabelMap[reason]) return this.reasonPartnerLabelMap[reason];
    const r = reason.toLowerCase();
    if (this.type === 'export') {
      if (r.includes('bán')) return 'Khách hàng';
      if (r.includes('trả') || r.includes('ncc') || r.includes('nhà cung cấp')) return 'Nhà cung cấp';
      if (r.includes('trưng bày') || r.includes('mẫu')) return 'Nơi trưng bày';
      return 'Khách hàng';
    } else {
      if (r.includes('khách') || r.includes('trả lại') || r.includes('đổi trả')) return 'Khách hàng';
      if (r.includes('nhà cung cấp') || r.includes('ncc') || r.includes('mua')) return 'Nhà cung cấp';
      return 'Nhà cung cấp';
    }
  }

  isReasonDisposal(reason: string): boolean {
    if (!reason) return false;
    const r = reason.toLowerCase();
    return r.includes('hủy') || r.includes('huy') || r.includes('hỏng') || r.includes('hong') || r.includes('tiêu hủy');
  }

  isImportTransfer(): boolean {
    return (this.transactionReason || '').toLowerCase().includes('chuyển kho');
  }

  isImportCustomerReturn(): boolean {
    const r = (this.transactionReason || '').toLowerCase();
    return r.includes('khách') || r.includes('trả hàng') || r.includes('trả lại') || r.includes('đổi trả');
  }

  isImportAuditSurplus(): boolean {
    const r = (this.transactionReason || '').toLowerCase();
    return r.includes('kiểm kê') || r.includes('dư');
  }

  getWordCount(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  toggleNewReasonRequiresSupplier() {
    this.newReasonRequiresSupplier = !this.newReasonRequiresSupplier;
    if (this.newReasonRequiresSupplier && (!this.newReasonPartnerLabel || !this.newReasonPartnerLabel.trim())) {
      this.newReasonPartnerLabel = this.type === 'import' ? 'Nhà cung ứng' : 'Khách hàng';
    }
  }

  openAddReasonModal(event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.showReasonDropdown = false;
    this.newReasonText = '';
    this.newReasonRequiresSupplier = false;
    this.newReasonPartnerLabel = this.type === 'import' ? 'Nhà cung ứng' : 'Khách hàng';
    this.showAddReasonModal = true;
  }

  closeAddReasonModal() {
    this.showAddReasonModal = false;
    this.newReasonText = '';
    this.newReasonRequiresSupplier = false;
    this.newReasonPartnerLabel = this.type === 'import' ? 'Nhà cung ứng' : 'Khách hàng';
  }

  confirmAddReason() {
    if (this.isFormDisabled) return;
    const trimmed = this.newReasonText.trim();
    if (!trimmed) {
      return window.alert(this.type === 'import' ? 'Vui lòng nhập lý do nhập kho.' : 'Vui lòng nhập lý do xuất kho.');
    }
    const words = this.getWordCount(trimmed);
    if (words > 10) {
      return window.alert(`Lý do ${this.type === 'import' ? 'nhập' : 'xuất'} không được vượt quá 10 từ (hiện tại: ${words} từ). Vui lòng rút gọn lại.`);
    }

    const partnerLabel = (this.newReasonPartnerLabel || (this.type === 'import' ? 'Nhà cung ứng' : 'Khách hàng')).trim();

    if (this.type === 'import') {
      if (!this.importReasonOptions.includes(trimmed)) {
        this.importReasonOptions.push(trimmed);
      }
    } else {
      if (!this.exportReasonOptions.includes(trimmed)) {
        this.exportReasonOptions.push(trimmed);
      }
    }

    if (this.newReasonRequiresSupplier) {
      this.reasonsRequiringSupplier.add(trimmed);
      this.reasonsNotRequiringSupplier.delete(trimmed);
      this.reasonPartnerLabelMap[trimmed] = partnerLabel;
    } else {
      this.reasonsRequiringSupplier.delete(trimmed);
      this.reasonsNotRequiringSupplier.add(trimmed);
      delete this.reasonPartnerLabelMap[trimmed];
    }

    // Lưu LocalStorage
    this.saveCustomReasons();

    // Lưu xuống CSDL Backend qua endpoint /api/admin/inventory/reasons
    this.http.post(`${environment.apiUrl}/admin/inventory/reasons`, {
      type: this.type,
      reason: trimmed,
      requiresPartner: this.newReasonRequiresSupplier,
      partnerLabel: this.newReasonRequiresSupplier ? partnerLabel : null
    }).subscribe({
      next: () => {},
      error: (err) => console.warn('Could not save custom reason to backend:', err)
    });

    this.transactionReason = trimmed;
    if (this.newReasonRequiresSupplier && this.transactionDestination) {
      this.transactionDestination = '';
    }
    if (!this.isReasonRequiringPartner(trimmed)) {
      this.recipientName = '';
    }
    if (this.isReasonDisposal(trimmed)) {
      this.recipientName = '';
      this.transactionDestination = '';
    }
    this.generateOrderCode();
    this.closeAddReasonModal();
    this.cdr.markForCheck();
  }

  get currentReasonOptions(): string[] {
    return this.type === 'export' ? this.exportReasonOptions : this.importReasonOptions;
  }

  ngOnInit() {
    this.loadStoredReasons();
    this.loadBackendData();
  }

  loadBackendData() {
    this.loadStoredReasons();

    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/warehouses`).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.warehouses = data;
          if (this.isViewMode) {
            this.populateFromViewOrder();
          }
        }
      },
      error: (err) => console.warn('Could not fetch warehouses:', err)
    });

    // Tải danh mục thuế VAT cấu hình từ Tab 5 Cài đặt tồn kho
    this.http.get<any>(`${environment.apiUrl}/admin/inventory/settings/tax-rates`).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.taxRates)) {
          const activeRates = res.taxRates.filter((t: any) => t.isActive).map((t: any) => Number(t.rate));
          if (activeRates.length > 0) {
            this.taxRateOptions = Array.from(new Set([0, ...activeRates])).sort((a, b) => a - b);
          }
          if (!this.isViewMode && (this.taxRate === 0 || this.taxRate === undefined)) {
            const defaultTax = res.taxRates.find((t: any) => t.isDefault && t.isActive);
            if (defaultTax) {
              this.taxRate = Number(defaultTax.rate);
            }
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.warn('Could not fetch tax rates from settings:', err)
    });

    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/products-options`).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.fetchedProducts = data;
          if (this.isViewMode) {
            this.populateFromViewOrder();
          }
        }
      },
      error: (err) => console.warn('Could not fetch products options:', err)
    });

    // Tải và hợp nhất tất cả lý do đã từng được lưu trong cơ sở dữ liệu
    this.http.get<{ 
      importReasons?: string[]; 
      exportReasons?: string[];
      customReasons?: Array<{ type: string; reason: string; requiresPartner: boolean; partnerLabel: string | null }>;
    }>(`${environment.apiUrl}/admin/inventory/reasons`).subscribe({
      next: (res) => {
        if (res) {
          let hasChanges = false;
          if (Array.isArray(res.importReasons)) {
            res.importReasons.forEach(r => {
              if (r && typeof r === 'string' && !this.importReasonOptions.includes(r.trim())) {
                this.importReasonOptions.push(r.trim());
                hasChanges = true;
              }
            });
          }
          if (Array.isArray(res.exportReasons)) {
            res.exportReasons.forEach(r => {
              if (r && typeof r === 'string' && !this.exportReasonOptions.includes(r.trim())) {
                this.exportReasonOptions.push(r.trim());
                hasChanges = true;
              }
            });
          }
          if (Array.isArray(res.customReasons)) {
            res.customReasons.forEach(cr => {
              if (!cr || !cr.reason) return;
              const reasonName = cr.reason.trim();
              if (cr.requiresPartner) {
                this.reasonsRequiringSupplier.add(reasonName);
                this.reasonsNotRequiringSupplier.delete(reasonName);
                if (cr.partnerLabel) {
                  this.reasonPartnerLabelMap[reasonName] = cr.partnerLabel;
                }
              } else {
                this.reasonsRequiringSupplier.delete(reasonName);
                this.reasonsNotRequiringSupplier.add(reasonName);
                delete this.reasonPartnerLabelMap[reasonName];
              }
            });
            hasChanges = true;
          }
          if (hasChanges) {
            this.saveCustomReasons();
          }
          if (this.isViewMode && this.viewOrderData?.reason) {
            this.transactionReason = this.viewOrderData.reason;
          }
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.warn('Could not fetch backend inventory reasons:', err)
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.loadStoredReasons();
        this.resetState();
        this.isEditingDraft = false;
        this.isPlanningOrder = false;
        this.isExecutingOrder = false;
        this.isSavingDraftEdit = false;
        // Reset view-mode popup states
        this.showCancelOrderModal = false;
        this.showDeleteOrderModal = false;
        this.cancelOrderReasonInput = '';
        this.isDeletingOrder = false;
        this.isCancellingOrder = false;
        if (this.warehouses.length === 0 || this.fetchedProducts.length === 0) {
          this.loadBackendData();
        }
        if (this.isViewMode) {
          this.populateFromViewOrder();
        }
      } else {
        this.showCancelOrderModal = false;
        this.showDeleteOrderModal = false;
        this.cancelOrderReasonInput = '';
        this.isDeletingOrder = false;
        this.isCancellingOrder = false;
        this.showDiscardConfirmModal = false;
      }
    }
  }

  resetState() {
    this.isSubmitting = false;
    this.isSubmittingDraft = false;
    this.isSubmittingOrder = false;
    this.isPlanningOrder = false;
    this.isExecutingOrder = false;
    this.isSavingDraftEdit = false;
    this.isCancellingOrder = false;
    this.isDeletingOrder = false;

    // Ngày giờ mặc định hiện tại
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    this.transactionDate = localIso;

    // Số thứ tự 4 số ngẫu nhiên hoặc tự tăng
    this.orderSequence = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
    this.referenceCode = '';
    this.discountAmount = '';
    this.taxRate = 0;
    this.showTaxDropdown = false;
    this.customTaxInput = '';
    this.shippingFee = '';
    this.actionLogs = [];

    // Người lập phiếu: hệ thống tự điền vào từ phiên đăng nhập
    try {
      const userStr = localStorage.getItem('dcor_admin_user') || localStorage.getItem('dcor_user') || localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_customer');
      if (userStr) {
        const u = JSON.parse(userStr);
        this.creatorName = u.fullName || u.name || u.username || u.email || 'Admin Quản Trị';
      } else {
        this.creatorName = 'Admin Quản Trị';
      }
    } catch {
      this.creatorName = 'Admin Quản Trị';
    }
    this.recipientName = '';
    this.transactionLocation = this.initialLocationId || '';
    this.transactionReason = '';
    this.transactionDestination = '';
    this.transactionNote = '';
    this.showLocationDropdown = false;
    this.showReasonDropdown = false;
    this.showDestDropdown = false;
    this.showTaxDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
    this.openUnitDropdownId = null;
    this.productSearchTerm = '';
    this.dropdownPositions = { tax: 'down' };
    this.showDiscardConfirmModal = false;

    // Khởi tạo mã phiếu ban đầu
    this.generateOrderCode();

    // Dòng sản phẩm ban đầu: khởi tạo từ input nếu có
    const initialProd = this.initialProductId || '';
    const initialVar = this.initialVariantId || '';
    const initialUnit = (initialProd && initialVar) ? this.inferUnit(this.getProductName(initialProd)) : '';

    this.lineItems = [{
      id: Date.now().toString(),
      productId: initialProd,
      variantId: initialVar,
      quantity: '',
      price: '',
      unit: initialUnit,
      lotNumber: '',
      expiryDate: '',
      isProductFixed: this.isProductFixed,
      isVariantFixed: this.isVariantFixed,
    }];

    // Nếu có initialProductId nhưng chưa có variantId, chọn variant đầu tiên
    if (initialProd && !initialVar) {
      const vars = this.getVariantsForProduct(initialProd);
      if (vars.length > 0) {
        this.lineItems[0].variantId = vars[0].id;
        this.lineItems[0].unit = this.inferUnit(this.getProductName(initialProd));
        this.lineItems[0].price = new Intl.NumberFormat('vi-VN').format(vars[0].price || 0);
      }
    } else if (initialProd && initialVar) {
      const vars = this.getVariantsForProduct(initialProd);
      const v = vars.find((x: any) => x.id === initialVar);
      if (v) {
        this.lineItems[0].price = new Intl.NumberFormat('vi-VN').format(v.price || 0);
      }
    }

    this.closeToast();
    if (this.type === 'export' && this.lineItems[0]?.productId && this.lineItems[0]?.variantId) {
      this.checkVariantStockAndToast(this.lineItems[0].productId, this.lineItems[0].variantId);
    }
  }

  // --- LOGIC TÍNH TOÁN AUTO DROPUP / DROPDOWN ---
  checkDropdownPosition(element: HTMLElement, key: string) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    
    // Chỉ xổ lên trên nếu không gian bên dưới quá hẹp (< 240px) và không gian bên trên rộng hơn bên dưới
    if (spaceBelow < 240 && rect.top > spaceBelow) {
      this.dropdownPositions[key] = 'up';
    } else {
      this.dropdownPositions[key] = 'down';
    }
  }

  // --- LOGIC SINH MÃ PHIẾU XUẤT / NHẬP ---
  getPrefixForReasonText(reason: string): string {
    const r = (reason || '').toLowerCase().trim();
    if (this.type === 'import') {
      if (!r) return 'PNK';
      if (r.includes('chuyển kho')) return 'PNK-CK';
      if (r.includes('trả lại') || r.includes('đổi trả') || r.includes('thu hồi')) return 'PNK-TH';
      if (r.includes('kiểm kê') || r.includes('dư')) return 'PNK-KK';
      if (r.includes('nhà cung cấp') || r.includes('ncc') || r.includes('mua')) return 'PNK-NCC';
      return 'PNK';
    }
    if (!r) return 'PXK';
    if (r.includes('bán')) return 'PXK-BH';
    if (r.includes('chuyển kho')) return 'PXK-CK';
    if (r.includes('trả') || r.includes('ncc') || r.includes('nhà cung cấp') || this.isReasonRequiringSupplier(reason)) return 'PXK-NCC';
    if (r.includes('hủy') || r.includes('hỏng') || r.includes('thất thoát')) return 'PXK-HUY';
    if (r.includes('trưng bày') || r.includes('mẫu') || r.includes('nội bộ')) return 'PXK-TB';
    return 'PXK';
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
    if (this.isFormDisabled) return;
    this.generateOrderCode();
  }

  inferUnit(productName: string): string {
    const name = (productName || '').toLowerCase();
    if (name.includes('sofa') || name.includes('bàn ăn') || name.includes('bộ')) return 'Bộ';
    if (name.includes('ghế') || name.includes('bàn') || name.includes('tủ') || name.includes('kệ') || name.includes('đèn') || name.includes('giường')) return 'Chiếc';
    return 'Cái';
  }

  // --- TỒN KHO & VALIDATION ---
  getVariantStockInfo(productId: string, variantId: string): { available: number; physical: number; reserved: number } {
    if (!productId || !variantId) return { available: 0, physical: 0, reserved: 0 };
    const p = this.availableProducts.find((x: any) => String(x.id) === String(productId));
    if (!p || !p.variants) return { available: 0, physical: 0, reserved: 0 };
    const v = p.variants.find((x: any) => String(x.id) === String(variantId));
    if (!v) return { available: 0, physical: 0, reserved: 0 };

    if (this.transactionLocation) {
      if (v.warehouseStocks && Array.isArray(v.warehouseStocks) && v.warehouseStocks.length > 0) {
        const ws = v.warehouseStocks.find((w: any) => 
          String(w.warehouseId) === String(this.transactionLocation) || 
          w.warehouse?.name === this.transactionLocation ||
          w.warehouse?.code === this.transactionLocation
        );
        if (ws) {
          const physical = ws.physicalStock ?? 0;
          const reserved = ws.reservedStock ?? 0;
          const available = Math.max(0, physical - reserved);
          return { available, physical, reserved };
        }
      }
      // Fallback nếu chưa có phân bổ kho riêng
      const fallbackTotal = v.stock || 0;
      const fallbackStock = Math.max(0, Math.floor(fallbackTotal / 4));
      return { available: fallbackStock, physical: fallbackStock, reserved: 0 };
    }
    const total = v.stock || 0;
    return { available: total, physical: total, reserved: 0 };
  }

  getEffectiveStockForItem(item: LineItem): number {
    const stockInfo = this.getVariantStockInfo(item.productId, item.variantId);
    if (this.isPlanned) {
      // Đối với phiếu đã Lên kế hoạch (PLANNED):
      // Số lượng của chính phiếu này đã nằm trong reservedStock.
      // Do đó lượng hàng thực tế còn trên kệ đáp ứng cho phiếu này = min(physicalStock, availableStock + itemQty)
      const itemQty = parseInt(item.quantity, 10) || 0;
      return Math.min(stockInfo.physical, stockInfo.available + itemQty);
    }
    // Đối với phiếu Mới hoặc DRAFT: chưa giữ chỗ, lượng hàng có thể dùng là tồn khả dụng (available)
    return stockInfo.available;
  }

  getVariantStock(item: LineItem): number {
    return this.getEffectiveStockForItem(item);
  }

  checkVariantStockAndToast(productId: string, variantId: string) {
    // Comment toast cảnh báo sản phẩm đã hết tồn kho theo yêu cầu
    /*
    if (this.type !== 'export' || !productId || !variantId) return;

    const stockInfo = this.getVariantStockInfo(productId, variantId);
    if (stockInfo.available <= 0) {
      const prodName = this.getProductName(productId);
      const varName = this.getVariantName(productId, variantId);
      
      const wh = this.activeWarehouses.find((w: any) => w.id === this.transactionLocation || w.name === this.transactionLocation);
      const whName = wh ? wh.name : this.transactionLocation;

      const title = `Cảnh báo: Sản phẩm đã hết tồn kho!`;
      const desc = whName 
        ? `Biến thể "${varName}" (${prodName}) hiện có số lượng tồn khả dụng = 0 tại kho "${whName}". Vui lòng kiểm tra lại trước khi xuất kho!`
        : `Biến thể "${varName}" (${prodName}) hiện có số lượng tồn khả dụng = 0. Vui lòng kiểm tra lại trước khi xuất kho!`;

      this.triggerToast(title, desc, 'warning', 5000);
    }
    */
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

  // --- TÍNH TOÁN TÀI CHÍNH & TIỀN TỆ ---
  getRawNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    const clean = String(val).replace(/[^0-9]/g, '');
    return parseInt(clean, 10) || 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  }

  getLineSubtotal(item: LineItem): number {
    const qty = parseInt(item.quantity, 10) || 0;
    const price = this.getRawNumber(item.price);
    return qty * price;
  }

  getFormattedLineSubtotal(item: LineItem): string {
    return this.formatCurrency(this.getLineSubtotal(item));
  }

  getTotalSubtotal(): number {
    return this.lineItems.reduce((sum, item) => sum + this.getLineSubtotal(item), 0);
  }

  getDiscountValue(): number {
    return this.getRawNumber(this.discountAmount);
  }

  getShippingValue(): number {
    return this.getRawNumber(this.shippingFee);
  }

  getTaxValue(): number {
    const taxable = Math.max(0, this.getTotalSubtotal() - this.getDiscountValue());
    return Math.round(taxable * (this.taxRate / 100));
  }

  getFinalTotal(): number {
    return Math.max(0, this.getTotalSubtotal() - this.getDiscountValue() + this.getTaxValue() + this.getShippingValue());
  }

  onPriceInput(item: LineItem, event: any) {
    if (this.isFormDisabled) return;
    if (!item.productId || !item.variantId) return;
    const inputEl = event.target as HTMLInputElement;
    const rawValue = inputEl ? inputEl.value : event;
    const clean = String(rawValue || '').replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    item.price = clean ? new Intl.NumberFormat('vi-VN').format(num) : '';
    if (inputEl) {
      inputEl.value = item.price;
    }
  }

  onCurrencyInput(field: 'discount' | 'shipping', event: any) {
    if (this.isFormDisabled) return;
    const inputEl = event.target as HTMLInputElement;
    const rawValue = inputEl ? inputEl.value : event;
    const clean = String(rawValue || '').replace(/[^0-9]/g, '');
    const formatted = clean ? new Intl.NumberFormat('vi-VN').format(parseInt(clean, 10)) : '';
    if (field === 'discount') {
      this.discountAmount = formatted;
      if (inputEl) inputEl.value = formatted;
    } else {
      this.shippingFee = formatted;
      if (inputEl) inputEl.value = formatted;
    }
  }

  // --- DROPDOWN LABELS ---
  getLocationLabel(): string {
    if (!this.transactionLocation) return this.type === 'import' ? 'Chọn kho đích nhập về' : 'Chọn chi nhánh / kho xuất';
    const w = this.activeWarehouses.find((x: any) => x.id === this.transactionLocation || x.name === this.transactionLocation);
    return w ? w.name : this.transactionLocation;
  }

  getDestLabel(): string {
    if (!this.transactionDestination) return this.type === 'import' ? 'Chọn kho nguồn' : 'Chọn kho đích';
    const w = this.activeWarehouses.find((x: any) => x.id === this.transactionDestination || x.name === this.transactionDestination);
    return w ? w.name : this.transactionDestination;
  }

  getExportRecipientLabel(): string {
    const r = (this.transactionReason || '').toLowerCase();
    if (r.includes('chuyển kho')) return 'Kho đích';
    if (this.isReasonDisposal(this.transactionReason)) return 'Đơn vị nhận hàng';
    if (this.isReasonRequiringSupplier(this.transactionReason)) return 'Nhà cung cấp';
    if (r.includes('bán') || r.includes('ban')) return 'Khách hàng';
    if (r.includes('trưng bày') || r.includes('trung bay') || r.includes('mẫu')) return 'Nơi trưng bày';
    return 'Đơn vị nhận hàng';
  }

  focusLocationDropdown(event?: Event) {
    if (this.isFormDisabled) return;
    if (event) event.stopPropagation();
    this.closeAllDropdowns();
    this.showLocationDropdown = true;
    const targetEl = document.querySelector('.location-filter-wrapper button') as HTMLElement;
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.focus();
    }
    this.triggerToast(
      'Vui lòng chọn kho trước!',
      this.type === 'import' ? 'Hãy chọn Kho đích nhập về để mở khóa danh sách sản phẩm.' : 'Hãy chọn Chi nhánh / Kho xuất để mở khóa danh sách sản phẩm.',
      'info',
      4000
    );
  }

  toggleLocationDropdown(event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.showLocationDropdown = !this.showLocationDropdown;
    this.showReasonDropdown = false;
    this.showDestDropdown = false;
    this.showTaxDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
  }

  selectLocation(id: string, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.transactionLocation = id;
    this.showLocationDropdown = false;
    if (this.transactionDestination === id) {
      this.transactionDestination = '';
    }
    if (this.type === 'export') {
      for (const item of this.lineItems) {
        if (item.productId && item.variantId) {
          const s = this.getVariantStock(item);
          if (s <= 0) {
            this.checkVariantStockAndToast(item.productId, item.variantId);
            break;
          }
        }
      }
    }
  }

  toggleReasonDropdown(event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.showReasonDropdown = !this.showReasonDropdown;
    this.showLocationDropdown = false;
    this.showDestDropdown = false;
    this.showTaxDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
  }

  selectReason(reason: string, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.transactionReason = reason;
    this.showReasonDropdown = false;
    if (!reason.includes('Chuyển kho')) {
      this.transactionDestination = '';
    }
    if (!this.isReasonRequiringPartner(reason) || this.isReasonDisposal(reason) || (this.type === 'import' && this.isImportAuditSurplus())) {
      this.recipientName = '';
      if (!reason.includes('Chuyển kho')) {
        this.transactionDestination = '';
      }
    }
    this.generateOrderCode();
  }

  toggleDestDropdown(event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.showDestDropdown = !this.showDestDropdown;
    this.showLocationDropdown = false;
    this.showReasonDropdown = false;
    this.showTaxDropdown = false;
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
  }

  selectDest(id: string, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.transactionDestination = id;
    this.showDestDropdown = false;
  }

  getProductLabel(productId: string, item?: LineItem): string {
    if (!productId) return item?.productNameDisplay || 'Chọn sản phẩm...';
    const p = this.availableProducts.find((x: any) => String(x.id) === String(productId));
    if (p) return p.name || p.productName;
    return item?.productNameDisplay || 'N/A';
  }

  getVariantDisplay(item: LineItem): string {
    if (!item.productId || !item.variantId) return item.variantNameDisplay || 'Chọn biến thể';
    const vars = this.getVariantsForProduct(item.productId);
    const v = vars.find((x: any) => String(x.id) === String(item.variantId));
    if (v) return v.name;
    return item.variantNameDisplay || item.variantId;
  }

  getVariantSku(item: LineItem): string {
    if (!item.productId || !item.variantId) return item.skuDisplay || '';
    const vars = this.getVariantsForProduct(item.productId);
    const v = vars.find((x: any) => String(x.id) === String(item.variantId));
    return v?.sku || item.skuDisplay || '';
  }

  getProductDisplaySku(p: any): string {
    if (!p) return 'N/A';
    if (p.sku && !p.sku.startsWith('DEFAULT-')) return p.sku;
    if (p.variants && p.variants.length > 0) {
      const vSku = p.variants[0].sku;
      if (vSku && !vSku.startsWith('DEFAULT-')) {
        return p.variants.length > 1 ? `${vSku} (+${p.variants.length - 1})` : vSku;
      }
    }
    return p.sku || p.variants?.[0]?.sku || `SKU-${(p.id || '').slice(0, 8).toUpperCase()}`;
  }

  getFilteredProducts(): any[] {
    if (!this.productSearchTerm.trim()) {
      return this.availableProducts;
    }
    const term = this.productSearchTerm.toLowerCase();
    return this.availableProducts.filter((p: any) => 
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.productName && p.productName.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (this.getProductDisplaySku(p).toLowerCase().includes(term)) ||
      (p.variants && p.variants.some((v: any) => v.sku && v.sku.toLowerCase().includes(term)))
    );
  }

  getFilteredVariants(productId: string): any[] {
    const vars = this.getVariantsForProduct(productId);
    if (!this.variantSearchTerm || !this.variantSearchTerm.trim()) {
      return vars;
    }
    const term = this.variantSearchTerm.toLowerCase().trim();
    return vars.filter((v: any) => 
      (v.name && v.name.toLowerCase().includes(term)) ||
      (v.sku && v.sku.toLowerCase().includes(term))
    );
  }

  toggleProductDropdown(itemId: string, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    if (!this.transactionLocation) {
      this.focusLocationDropdown(event);
      return;
    }
    if (this.openProductDropdownId === itemId) {
      this.openProductDropdownId = null;
    } else {
      this.closeAllDropdowns();
      this.openProductDropdownId = itemId;
      this.productSearchTerm = '';
      const target = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
      this.checkDropdownPosition(target, 'prod_' + itemId);
    }
  }

  selectProduct(item: LineItem, productId: string, event?: Event) {
    if (this.isFormDisabled) return;
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const pId = String(productId);
    item.productId = pId;
    const p = this.availableProducts.find((x: any) => String(x.id) === pId);
    if (p) {
      item.productNameDisplay = p.name || p.productName;
    }
    this.updateLineItem(item.id, 'productId', pId);
    this.openProductDropdownId = null;
    this.productSearchTerm = '';
    this.cdr.detectChanges();
  }

  toggleVariantDropdown(item: LineItem, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    if (!this.transactionLocation) {
      this.focusLocationDropdown(event);
      return;
    }
    if (!item.productId) return; // Chặn tuyệt đối khi chưa chọn sản phẩm
    if (this.openVariantDropdownId === item.id) {
      this.openVariantDropdownId = null;
      this.variantSearchTerm = '';
    } else {
      this.closeAllDropdowns();
      this.openVariantDropdownId = item.id;
      this.variantSearchTerm = '';
      const target = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
      this.checkDropdownPosition(target, 'var_' + item.id);
    }
  }

  selectVariant(item: LineItem, v: any, event?: Event) {
    if (this.isFormDisabled) return;
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const variantId = String(typeof v === 'string' ? v : (v?.id ?? ''));
    const vars = this.getVariantsForProduct(item.productId);
    const variantObj = (typeof v === 'object' && v !== null)
      ? v
      : vars.find((x: any) => String(x.id) === variantId);

    // Cập nhật trực tiếp lên dòng sản phẩm để template hiển thị ngay lập tức
    item.variantId = variantId;
    if (variantObj) {
      item.variantNameDisplay = variantObj.name;
      item.skuDisplay = variantObj.sku;
      if (variantObj.price !== undefined && variantObj.price !== null) {
        item.price = new Intl.NumberFormat('vi-VN').format(Number(variantObj.price) || 0);
      }
    }
    if (!item.unit) {
      item.unit = this.inferUnit(this.getProductName(item.productId));
    }

    // Đồng thời gọi updateLineItem để đồng bộ logic chung
    this.updateLineItem(item.id, 'variantId', variantId);

    // Đóng dropdown biến thể & xóa từ khóa tìm kiếm
    this.openVariantDropdownId = null;
    this.variantSearchTerm = '';

    // Kiểm tra cảnh báo tồn kho nếu cần
    this.checkVariantStockAndToast(item.productId, variantId);

    // Cập nhật giao diện tức thì
    this.cdr.detectChanges();
  }

  toggleUnitDropdown(item: LineItem, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    if (!item.productId || !item.variantId) return;
    if (this.openUnitDropdownId === item.id) {
      this.openUnitDropdownId = null;
    } else {
      this.closeAllDropdowns();
      this.openUnitDropdownId = item.id;
      const target = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
      this.checkDropdownPosition(target, 'unit_' + item.id);
    }
  }

  selectUnit(item: LineItem, unit: string, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.updateLineItem(item.id, 'unit', unit);
    this.openUnitDropdownId = null;
  }

  defaultUnitOptions: string[] = ['Chiếc', 'Bộ', 'Cái', 'Thùng', 'Hộp', 'Mét'];

  getUnitOptions(currentUnit?: string): string[] {
    const list = [...this.defaultUnitOptions];
    if (currentUnit && currentUnit !== '-' && !list.includes(currentUnit)) {
      list.unshift(currentUnit);
    }
    return list;
  }

  toggleTaxDropdown(event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    if (this.showTaxDropdown) {
      this.showTaxDropdown = false;
      this.customTaxInput = '';
    } else {
      this.closeAllDropdowns();
      this.customTaxInput = '';
      const target = (event.currentTarget as HTMLElement) || (event.target as HTMLElement);
      this.checkDropdownPosition(target, 'tax');
      this.showTaxDropdown = true;
    }
  }

  selectTaxRate(rate: number, event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    this.taxRate = rate;
    this.customTaxInput = '';
    this.showTaxDropdown = false;
  }

  onCustomTaxKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.confirmAddCustomTax(event);
      return;
    }
    if (event.key === 'Escape') {
      this.showTaxDropdown = false;
      return;
    }
    // Cho phép các phím chức năng và điều hướng
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) {
      return;
    }
    // Chỉ cho phép nhập số nguyên 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onCustomTaxInput(event: any) {
    const inputEl = event.target as HTMLInputElement;
    const raw = inputEl ? inputEl.value : event;
    let clean = String(raw || '').replace(/[^0-9]/g, '');
    if (clean) {
      const num = parseInt(clean, 10);
      if (num > 100) {
        clean = '100';
      }
    }
    this.customTaxInput = clean;
    if (inputEl) {
      inputEl.value = clean;
    }
  }

  confirmAddCustomTax(event: Event) {
    if (this.isFormDisabled) return;
    event.stopPropagation();
    const clean = String(this.customTaxInput || '').trim();
    if (!clean) return;
    const rate = parseInt(clean, 10);
    if (isNaN(rate) || rate < 0 || rate > 100) return;

    if (!this.taxRateOptions.includes(rate)) {
      this.taxRateOptions.push(rate);
      this.taxRateOptions.sort((a, b) => a - b);
    }
    this.taxRate = rate;
    this.customTaxInput = '';
    this.showTaxDropdown = false;
  }

  @HostListener('document:click')
  closeAllDropdowns() {
    this.showLocationDropdown = false;
    this.showReasonDropdown = false;
    this.showDestDropdown = false;
    this.showTaxDropdown = false;
    this.customTaxInput = '';
    this.openProductDropdownId = null;
    this.openVariantDropdownId = null;
    this.openUnitDropdownId = null;
    this.productSearchTerm = '';
    this.variantSearchTerm = '';
  }

  hasProductData(): boolean {
    if (this.lineItems.length > 1) {
      return true;
    }
    return this.lineItems.some(it => 
      !!it.productId || 
      !!it.variantId || 
      (!!it.quantity && String(it.quantity).trim() !== '' && Number(it.quantity) > 0)
    );
  }

  requestClose() {
    if (this.isAnyActionProcessing) return;
    this.isEditingDraft = false;
    this.backupOrderData = null;
    this.showDiscardConfirmModal = false;
    this.onClose.emit();
  }

  cancelDiscard() {
    this.showDiscardConfirmModal = false;
  }

  confirmDiscard() {
    if (this.isAnyActionProcessing) return;
    this.isEditingDraft = false;
    this.backupOrderData = null;
    this.isSubmitting = false;
    this.isSubmittingDraft = false;
    this.isSubmittingOrder = false;
    this.isPlanningOrder = false;
    this.isExecutingOrder = false;
    this.isSavingDraftEdit = false;
    this.isCancellingOrder = false;
    this.isDeletingOrder = false;
    this.showDiscardConfirmModal = false;
    this.onClose.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.showDiscardConfirmModal) {
        this.cancelDiscard();
        event.stopPropagation();
        return;
      }
      if (this.showAddReasonModal) {
        this.closeAddReasonModal();
        event.stopPropagation();
        return;
      }
      if (this.isOpen) {
        const hasOpenDropdown = this.showLocationDropdown || this.showReasonDropdown || this.showDestDropdown || this.showTaxDropdown || !!this.openProductDropdownId || !!this.openVariantDropdownId || !!this.openUnitDropdownId;
        if (hasOpenDropdown) {
          this.closeAllDropdowns();
          event.stopPropagation();
          return;
        }
        this.requestClose();
      }
    }
  }

  getGridColumns() {
    return 'minmax(240px, 1.6fr) minmax(200px, 1.4fr) 85px 95px 140px 145px 36px';
  }

  getQuantity(item: LineItem): number {
    return parseInt(item.quantity, 10) || 0;
  }

  increaseQuantity(item: LineItem) {
    if (this.isFormDisabled) return;
    if (!item.productId || !item.variantId) return;
    const current = this.getQuantity(item);
    const maxStock = this.getVariantStock(item);
    if (this.type === 'export' && current >= maxStock) {
      return;
    }
    this.updateLineItem(item.id, 'quantity', String(current + 1));
  }

  decreaseQuantity(item: LineItem) {
    if (this.isFormDisabled) return;
    if (!item.productId || !item.variantId) return;
    const current = this.getQuantity(item);
    if (current > 0) {
      this.updateLineItem(item.id, 'quantity', String(current - 1));
    }
  }

  onNumberKeydown(event: KeyboardEvent) {
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

  onQuantityKeydown(event: KeyboardEvent) {
    this.onNumberKeydown(event);
  }

  onQuantityInput(item: LineItem, event: any) {
    if (this.isFormDisabled) return;
    const rawValue = event.target ? event.target.value : event;
    const cleanValue = String(rawValue || '').replace(/[^0-9]/g, '');
    this.updateLineItem(item.id, 'quantity', cleanValue);
  }

  getProductName(id: string) {
    const p = this.availableProducts.find((x: any) => String(x.id) === String(id));
    return p ? (p.name || p.productName) : 'N/A';
  }

  getVariantName(productId: string, variantId: string): string {
    const vars = this.getVariantsForProduct(productId);
    const v = vars.find((x: any) => String(x.id) === String(variantId));
    return v ? v.name : (variantId || 'N/A');
  }

  getVariantsForProduct(productId: string): any[] {
    if (!productId) return [];
    const p = this.availableProducts.find((x: any) => String(x.id) === String(productId));
    if (!p) return [];

    if (!p._normalizedVariants) {
      if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
        p._normalizedVariants = p.variants.map((v: any) => ({
          id: String(v.id),
          name: v.name || v.color || v.material || 'Bản tiêu chuẩn',
          sku: v.sku || '',
          price: v.price || p?.price || 0,
          warehouseStocks: v.warehouseStocks || []
        }));
      } else {
        p._normalizedVariants = [
          { id: 'v_default', name: 'Tiêu chuẩn', sku: p?.sku || 'SKU-STD', price: p?.price || 0, warehouseStocks: [] }
        ];
      }
    }
    return p._normalizedVariants;
  }

  trackByVariantId(index: number, v: any): string {
    return v?.id || String(index);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  handleAddLineItem() {
    if (this.isFormDisabled) return;
    if (!this.transactionLocation) {
      this.focusLocationDropdown();
      return;
    }
    if (!this.canAddNewLine()) return;
    this.lineItems.push({
      id: Date.now().toString() + Math.random(),
      productId: '',
      variantId: '',
      quantity: '',
      price: '',
      unit: '',
      lotNumber: '',
      expiryDate: '',
      isProductFixed: false,
      isVariantFixed: false,
    });
  }

  handleRemoveLineItem(id: string) {
    if (this.isFormDisabled) return;
    if (this.lineItems.length <= 1) {
      this.lineItems = [{
        id: Date.now().toString() + Math.random(),
        productId: '',
        variantId: '',
        quantity: '',
        price: '',
        unit: '',
        lotNumber: '',
        expiryDate: '',
        isProductFixed: false,
        isVariantFixed: false,
      }];
      this.closeAllDropdowns();
      this.cdr.markForCheck();
      return;
    }
    this.lineItems = this.lineItems.filter((item: any) => String(item.id) !== String(id));
    this.closeAllDropdowns();
    this.cdr.markForCheck();
  }

  updateLineItem(id: string, field: keyof LineItem, value: any) {
    if (this.isFormDisabled) return;
    const item = this.lineItems.find((x: any) => String(x.id) === String(id));
    if (!item) return;

    if (field === 'productId') {
      const pId = String(value);
      item.productId = pId;
      const prod = this.availableProducts.find((p: any) => String(p.id) === pId);
      if (prod) {
        item.productNameDisplay = prod.name || prod.productName;
      }
      const variants = this.getVariantsForProduct(pId);
      if (variants.length === 1) {
        item.variantId = String(variants[0].id);
        item.variantNameDisplay = variants[0].name;
        item.skuDisplay = variants[0].sku;
        item.unit = this.inferUnit(this.getProductName(pId));
        item.price = new Intl.NumberFormat('vi-VN').format(Number(variants[0].price) || 0);
        this.checkVariantStockAndToast(pId, variants[0].id);
      } else {
        item.variantId = '';
        item.variantNameDisplay = '';
        item.skuDisplay = '';
        item.unit = '';
        item.price = '';
      }
    } else if (field === 'variantId') {
      const vId = String(value);
      item.variantId = vId;
      if (!item.unit) {
        item.unit = this.inferUnit(this.getProductName(item.productId));
      }
      const variants = this.getVariantsForProduct(item.productId);
      const v = variants.find((x: any) => String(x.id) === vId);
      if (v) {
        item.variantNameDisplay = v.name;
        item.skuDisplay = v.sku;
        item.price = new Intl.NumberFormat('vi-VN').format(Number(v.price) || 0);
      }
      this.checkVariantStockAndToast(item.productId, vId);
    } else if (field === 'price') {
      let rawValue = String(value || '').replace(/[^0-9]/g, '');
      const num = parseInt(rawValue, 10);
      item.price = rawValue ? new Intl.NumberFormat('vi-VN').format(num) : '';
    } else if (field === 'quantity') {
      item.quantity = String(value || '').replace(/[^0-9]/g, '');
    } else {
      (item as any)[field] = value;
    }
  }

  canAddNewLine() {
    return !!this.transactionLocation && this.lineItems.every((item: any) => item.productId && item.variantId);
  }

  buildFormData(status: 'PENDING' | 'COMPLETED' | 'PLANNED' | 'DRAFT', action: 'draft' | 'confirm') {
    const selectedWarehouse = this.activeWarehouses.find((w: any) => w.id === this.transactionLocation || w.name === this.transactionLocation);
    const transferWarehouse = this.activeWarehouses.find((w: any) => w.id === this.transactionDestination || w.name === this.transactionDestination);

    const isImport = this.type === 'import';
    const isTransfer = this.transactionReason.includes('Chuyển kho');

    const sourceWarehouseId = isImport
      ? (isTransfer ? (transferWarehouse?.id || null) : null)
      : (selectedWarehouse?.id || null);

    const destWarehouseId = isImport
      ? (selectedWarehouse?.id || null)
      : (isTransfer ? (transferWarehouse?.id || null) : null);

    const isPartnerReq = this.isReasonRequiringPartner(this.transactionReason);
    const recipientNameVal = (isTransfer || !isPartnerReq)
      ? (this.isReasonDisposal(this.transactionReason) ? 'Tiêu hủy nội bộ' : 'Không áp dụng')
      : this.recipientName;

    const sourceLocationName = isImport
      ? (isTransfer ? (transferWarehouse?.name || 'Kho chuyển') : (!isPartnerReq ? 'Không áp dụng' : (this.recipientName || 'Nhà cung cấp / Đối tác')))
      : (selectedWarehouse?.name || this.transactionLocation);

    const destinationLocationName = isImport
      ? (selectedWarehouse?.name || this.transactionLocation)
      : (isTransfer 
          ? (transferWarehouse?.name || 'Kho nhận') 
          : (this.isReasonDisposal(this.transactionReason) 
              ? 'Tiêu hủy nội bộ' 
              : (!isPartnerReq ? 'Không áp dụng' : (this.recipientName || 'Khách hàng / Đối tác'))));

    const subtotal = this.getTotalSubtotal();
    const discount = this.getDiscountValue();
    const tax = this.getTaxValue();
    const shipping = this.getShippingValue();
    const finalTotal = this.getFinalTotal();

    return {
      action,
      status,
      type: this.type,
      orderCode: this.orderCode,
      referenceCode: this.referenceCode || this.orderCode,
      createdAt: this.transactionDate ? new Date(this.transactionDate).toISOString() : new Date().toISOString(),
      creatorName: this.creatorName,
      recipientName: recipientNameVal,
      location: isImport ? destinationLocationName : sourceLocationName,
      sourceLocation: sourceLocationName,
      destination: destinationLocationName,
      destinationLocation: destinationLocationName,
      sourceWarehouseId,
      destWarehouseId,
      reason: this.transactionReason,
      note: (() => {
        const cleanNote = this.cleanNotesForDisplay(this.transactionNote);
        const logsPayload = `[ACTION_LOGS:${JSON.stringify(this.actionLogs)}]`;
        return cleanNote ? `${cleanNote}\n${logsPayload}` : logsPayload;
      })(),
      financials: {
        subtotal,
        discount,
        taxRate: this.taxRate,
        tax,
        shipping,
        totalAmount: finalTotal
      },
      totalAmount: finalTotal,
      items: this.lineItems.map((item: any) => {
        const prod = this.availableProducts.find((p: any) => p.id === item.productId);
        const variants = this.getVariantsForProduct(item.productId);
        const variant = variants.find((v: any) => v.id === item.variantId);
        const priceNum = this.getRawNumber(item.price);
        const qtyNum = parseInt(item.quantity, 10) || 0;
        return {
          productId: item.productId,
          productName: prod ? (prod.name || prod.productName) : 'Sản phẩm',
          variantId: item.variantId,
          variantName: variant ? variant.name : 'Tiêu chuẩn',
          sku: variant?.sku || prod?.sku || 'SKU-AUTO',
          quantity: item.quantity,
          price: item.price,
          unit: item.unit || 'Chiếc',
          lotNumber: item.lotNumber || null,
          expiryDate: item.expiryDate || null,
          subtotal: priceNum * qtyNum
        };
      })
    };
  }

  // --- KIỂM TRA HỢP LỆ CÁC TRƯỜNG DỮ LIỆU BẮT BUỘC ---
  isFormValid(isDraft: boolean = false): boolean {
    // 1. Ngày xuất / nhập kho
    if (!this.transactionDate || !this.transactionDate.trim()) {
      return false;
    }

    // 2. Chi nhánh / Kho xuất (hoặc Kho đích nhập về)
    if (!this.transactionLocation) {
      return false;
    }

    // 3. Lý do xuất / nhập kho
    if (!this.transactionReason || !this.transactionReason.trim()) {
      return false;
    }

    // 4. Đối tác / Đơn vị nhận / Kho điều chuyển
    if (this.type === 'export') {
      if (this.transactionReason.includes('Chuyển kho')) {
        if (!this.transactionDestination) {
          return false;
        }
      } else if (this.isReasonRequiringPartner(this.transactionReason)) {
        if (!this.recipientName || !this.recipientName.trim()) {
          return false;
        }
      }
    } else {
      if (this.isImportTransfer()) {
        if (!this.transactionDestination) {
          return false;
        }
      } else if (this.isReasonRequiringPartner(this.transactionReason)) {
        if (!this.recipientName || !this.recipientName.trim()) {
          return false;
        }
      }
    }

    // 5. Danh sách sản phẩm (Line items)
    if (!this.lineItems || this.lineItems.length === 0) {
      return false;
    }

    for (const item of this.lineItems) {
      if (!item.productId || !item.variantId) {
        return false;
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return false;
      }
    }

    // 6. Kiểm tra tồn kho đối với phiếu Xuất chính thức
    if (!isDraft && this.type === 'export' && this.hasExceededStock()) {
      return false;
    }

    return true;
  }

  canSaveDraft(): boolean {
    return this.isFormValid(true);
  }

  canSubmitOrder(): boolean {
    return this.isFormValid(false);
  }

  canConfirmExecution(): boolean {
    if (this.isAnyActionProcessing) return false;
    if (this.type === 'export' && this.hasExceededStock()) return false;
    return true;
  }

  getConfirmActionBtnTitle(): string {
    if (this.type === 'export' && this.hasExceededStock()) {
      return 'Không thể xác nhận xuất kho do có sản phẩm vượt quá tồn kho thực tế!';
    }
    return this.getConfirmActionBtnLabel();
  }

  canPlanOrder(): boolean {
    if (this.isAnyActionProcessing) return false;
    if (this.type === 'export' && this.hasExceededStock()) return false;
    return true;
  }

  getPlanOrderBtnTitle(): string {
    if (this.type === 'export' && this.hasExceededStock()) {
      return 'Không thể tạo phiếu xuất do có sản phẩm vượt quá tồn kho khả dụng!';
    }
    return this.type === 'import' ? 'Chuyển từ bản nháp sang tạo phiếu nhập kho' : 'Chuyển từ bản nháp sang tạo phiếu xuất kho';
  }

  getSubmitButtonTitle(): string {
    if (!this.canSaveDraft()) {
      return 'Vui lòng hoàn thiện các trường dữ liệu bắt buộc trước khi tạo phiếu';
    }
    if (this.type === 'export' && this.hasExceededStock()) {
      return 'Không thể tạo phiếu xuất do có sản phẩm vượt quá tồn kho khả dụng';
    }
    return this.type === 'import' 
      ? 'Phát hành phiếu nhập chính thức và cộng tồn kho' 
      : 'Phát hành phiếu xuất chính thức và trừ trực tiếp tồn kho';
  }

  // --- NÚT 2: LƯU NHÁP (Draft) ---
  handleSaveDraft() {
    if (!this.canSaveDraft() || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.isSubmittingDraft = true;
    this.cdr.markForCheck();

    // Tự động mở khóa sau 12s phòng trường hợp lỗi mạng
    setTimeout(() => {
      if (this.isSubmitting) {
        this.isSubmitting = false;
        this.isSubmittingDraft = false;
        this.cdr.markForCheck();
      }
    }, 12000);

    if (!this.actionLogs.length) {
      this.actionLogs.push({
        timestamp: new Date().toISOString(),
        operator: this.creatorName || 'Admin Quản Trị',
        actionType: 'CREATE',
        actionLabel: 'Tạo bản nháp',
        toStatus: 'DRAFT'
      });
    }
    const data = this.buildFormData('PENDING', 'draft');
    this.onSubmit.emit(data);
  }

  // --- NÚT 3: TẠO PHIẾU (Hoàn thành / Xác nhận ghi nhận kho) ---
  handleSubmitConfirmed() {
    if (!this.canSubmitOrder() || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.isSubmittingOrder = true;
    this.cdr.markForCheck();

    // Tự động mở khóa sau 12s phòng trường hợp lỗi mạng
    setTimeout(() => {
      if (this.isSubmitting) {
        this.isSubmitting = false;
        this.isSubmittingOrder = false;
        this.cdr.markForCheck();
      }
    }, 12000);

    if (!this.actionLogs.length) {
      this.actionLogs.push({
        timestamp: new Date().toISOString(),
        operator: this.creatorName || 'Admin Quản Trị',
        actionType: 'CREATE',
        actionLabel: this.type === 'import' ? 'Tạo phiếu nhập kho' : 'Tạo phiếu xuất kho',
        toStatus: 'PLANNED'
      });
    }
    const data = this.buildFormData('PLANNED', 'confirm');
    this.onSubmit.emit(data);
  }
}
