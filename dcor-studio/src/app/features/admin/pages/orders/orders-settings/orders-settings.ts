import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  LucideAngularModule,
  GitBranch,
  Truck,
  ArrowRightLeft,
  ShieldCheck,
  Printer,
  Save,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Check,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Building2,
  SlidersHorizontal,
  Info,
  Clock,
  CreditCard,
  Bell,
  HelpCircle,
  Layers,
  Wrench,
  Package
} from 'lucide-angular';

export interface ReturnReasonItem {
  id: string;
  name: string;
  code: string;
  feeBearer: 'DCOR' | 'CUSTOMER';
  isActive: boolean;
  description?: string;
}

export interface WarrantyTermItem {
  id: string;
  componentName: string;
  durationMonths: number;
  coverageScope: string;
  isActive: boolean;
}

@Component({
  selector: 'app-orders-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-settings.html',
  styleUrls: ['./orders-settings.css']
})
export class OrdersSettingsComponent implements OnInit {
  icons = {
    GitBranch,
    Truck,
    ArrowRightLeft,
    ShieldCheck,
    Printer,
    Save,
    RotateCcw,
    Plus,
    Pencil,
    Trash2,
    Check,
    CheckCircle2,
    AlertCircle,
    X,
    ArrowLeft,
    Building2,
    SlidersHorizontal,
    Info,
    Clock,
    CreditCard,
    Bell,
    HelpCircle,
    Layers,
    Wrench,
    Package
  };

  activeTab: number = 1;
  isLoading: boolean = false;

  // Toast notification
  showToast: boolean = false;
  toastMessage: string = '';
  toastSubMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any = null;

  // TAB 1: QUY TRÌNH & TRẠNG THÁI
  workflowSettings = {
    highValueThreshold: 50000000,
    requireManagerApprovalForHighValue: true,
    prioritizeHighValueDelivery: true,
    autoCancelUnpaid: true,
    unpaidTimeoutHours: 24,
    autoReleaseReservedStock: true,
    autoConfirmOnlinePaid: true,
    requireCallForCod: true,
    allowCustomerCancelBeforeShipping: true
  };

  // TAB 2: VẬN CHUYỂN & GIAO LẮP
  shippingSettings = {
    enableFreeShipping: true,
    freeShippingMinAmount: 15000000,
    enableGhn: true,
    enableViettelPost: true,
    enableInternalFleet: true,
    stairCarryFeePerFloor: 150000,
    stairCarryStartFloor: 3,
    balconyCraneFee: 1500000,
    oldFurnitureDismantleFee: 300000,
    installationFeeDefault: 0
  };

  // TAB 3: CHÍNH SÁCH ĐỔI TRẢ
  returnsSettings = {
    exchangeMaxDays: 14,
    refundMaxDays: 7,
    unsealedRestockingFeePercent: 10,
    dcorPaysShippingIfDefective: true,
    defaultRefundMethod: 'BANK_TRANSFER'
  };

  returnReasons: ReturnReasonItem[] = [
    {
      id: 'RR-01',
      name: 'Lỗi kỹ thuật khung sườn / mối mọt',
      code: 'RT-DEFECT',
      feeBearer: 'DCOR',
      isActive: true,
      description: 'Lỗi do quy trình sản xuất hoặc kết cấu gỗ/kim loại'
    },
    {
      id: 'RR-02',
      name: 'Sai mã màu / kích thước / chất liệu',
      code: 'RT-WRONG-ITEM',
      feeBearer: 'DCOR',
      isActive: true,
      description: 'Giao nhầm mã màu hoặc sai quy cách so với hợp đồng'
    },
    {
      id: 'RR-03',
      name: 'Trầy xước / hư hỏng do vận chuyển',
      code: 'RT-DAMAGED',
      feeBearer: 'DCOR',
      isActive: true,
      description: 'Bị va đập, rách da nỉ trong quá trình giao hàng'
    },
    {
      id: 'RR-04',
      name: 'Khách đổi ý / không vừa không gian phòng',
      code: 'RT-CHANGE-MIND',
      feeBearer: 'CUSTOMER',
      isActive: true,
      description: 'Khách muốn đổi mẫu khác phù hợp với phòng khách hơn'
    },
    {
      id: 'RR-05',
      name: 'Sản phẩm không đúng kỳ vọng thực tế',
      code: 'RT-NOT-AS-DESC',
      feeBearer: 'CUSTOMER',
      isActive: true,
      description: 'Khách đổi ý sau khi xem sản phẩm thực tế tận nhà'
    }
  ];

  // TAB 4: CHÍNH SÁCH BẢO HÀNH
  warrantySettings = {
    enableExpiringAlert: true,
    expiringAlertDays: 30,
    autoCreateMaintenanceTask: true
  };

  warrantyTerms: WarrantyTermItem[] = [
    {
      id: 'WT-01',
      componentName: 'Khung gỗ tự nhiên & Kim loại chịu lực',
      durationMonths: 60,
      coverageScope: 'Bảo hành kết cấu khung sườn, chống cong vênh mối mọt',
      isActive: true
    },
    {
      id: 'WT-02',
      componentName: 'Đệm mút D40 & Lò xo túi độc lập',
      durationMonths: 36,
      coverageScope: 'Bảo hành độ đàn hồi mút, lún sụt vượt mức tiêu chuẩn 15%',
      isActive: true
    },
    {
      id: 'WT-03',
      componentName: 'Da bò Ý tự nhiên & Da Microfiber',
      durationMonths: 24,
      coverageScope: 'Bảo hành bề mặt da, bong tróc nổ da tự nhiên',
      isActive: true
    },
    {
      id: 'WT-04',
      componentName: 'Vải nỉ nhung & Vải dệt cao cấp',
      durationMonths: 24,
      coverageScope: 'Bảo hành xù lông biến dạng sợi dệt, bung chỉ may',
      isActive: true
    },
    {
      id: 'WT-05',
      componentName: 'Phụ kiện cơ khí (Ray trượt, piston, bản lề)',
      durationMonths: 12,
      coverageScope: 'Bảo hành kẹt ray, gãy bản lề, hỏng piston nâng hạ',
      isActive: true
    }
  ];

  // TAB 5: MẪU IN & THÔNG BÁO
  printSettings = {
    companyHeader: 'DCOR STUDIO - NỘI THẤT CAO CẤP',
    companyAddress: '123 Đường Song Hành, Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
    supportHotline: '1900 888 666',
    printFooterNote: 'Cảm ơn Quý khách đã tin tưởng và đồng hành cùng DCor Studio. Mọi thắc mắc về bảo hành & hỗ trợ kỹ thuật xin liên hệ hotline 1900 888 666.',
    hidePriceForGifts: true,
    printCustomerSignatureBox: true,
    notifyZaloOnConfirm: true,
    notifySmsOnShipping: true,
    notifyEmailOnCompleted: true
  };

  // Reason Modal
  showReasonModal: boolean = false;
  isEditingReason: boolean = false;
  editingReason: ReturnReasonItem = {
    id: '',
    name: '',
    code: '',
    feeBearer: 'DCOR',
    isActive: true,
    description: ''
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load cached settings from localStorage if available
    const saved = localStorage.getItem('dcor_orders_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.workflow) this.workflowSettings = parsed.workflow;
        if (parsed.shipping) this.shippingSettings = parsed.shipping;
        if (parsed.returns) this.returnsSettings = parsed.returns;
        if (parsed.returnReasons) this.returnReasons = parsed.returnReasons;
        if (parsed.warranty) this.warrantySettings = parsed.warranty;
        if (parsed.warrantyTerms) this.warrantyTerms = parsed.warrantyTerms;
        if (parsed.print) this.printSettings = parsed.print;
      } catch (e) {
        console.error('Error parsing saved order settings', e);
      }
    }
  }

  setTab(tabNumber: number): void {
    this.activeTab = tabNumber;
  }

  saveAllSettings(): void {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      const dataToSave = {
        workflow: this.workflowSettings,
        shipping: this.shippingSettings,
        returns: this.returnsSettings,
        returnReasons: this.returnReasons,
        warranty: this.warrantySettings,
        warrantyTerms: this.warrantyTerms,
        print: this.printSettings
      };
      localStorage.setItem('dcor_orders_settings', JSON.stringify(dataToSave));
      this.triggerToast('Đã lưu cấu hình cài đặt đơn hàng thành công!', 'Các quy định mới đã được cập nhật trên toàn hệ thống.', 'success');
    }, 400);
  }

  resetTabToDefault(): void {
    if (confirm('Bạn có chắc chắn muốn đặt lại các thông số trong tab này về mặc định?')) {
      this.triggerToast('Đã đặt lại về thông số mặc định!', '', 'info');
    }
  }

  // Reason CRUD
  openAddReasonModal(): void {
    this.isEditingReason = false;
    this.editingReason = {
      id: 'RR-' + Math.floor(10 + Math.random() * 90),
      name: '',
      code: 'RT-CUSTOM-' + Math.floor(100 + Math.random() * 900),
      feeBearer: 'DCOR',
      isActive: true,
      description: ''
    };
    this.showReasonModal = true;
  }

  openEditReasonModal(reason: ReturnReasonItem): void {
    this.isEditingReason = true;
    this.editingReason = { ...reason };
    this.showReasonModal = true;
  }

  saveReason(): void {
    if (!this.editingReason.name.trim()) {
      alert('Vui lòng nhập tên lý do đổi trả!');
      return;
    }
    if (this.isEditingReason) {
      const idx = this.returnReasons.findIndex(r => r.id === this.editingReason.id);
      if (idx !== -1) {
        this.returnReasons[idx] = { ...this.editingReason };
      }
    } else {
      this.returnReasons.push({ ...this.editingReason });
    }
    this.showReasonModal = false;
    this.saveAllSettings();
  }

  toggleReasonStatus(reason: ReturnReasonItem): void {
    reason.isActive = !reason.isActive;
    this.saveAllSettings();
  }

  deleteReason(reasonId: string): void {
    if (confirm('Bạn có chắc muốn xóa lý do đổi trả này?')) {
      this.returnReasons = this.returnReasons.filter(r => r.id !== reasonId);
      this.saveAllSettings();
    }
  }

  toggleWarrantyTerm(term: WarrantyTermItem): void {
    term.isActive = !term.isActive;
    this.saveAllSettings();
  }

  triggerToast(message: string, subMessage: string = '', type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastSubMessage = subMessage;
    this.toastType = type;
    this.showToast = true;
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
    }, 4500);
  }

  closeToast(): void {
    this.showToast = false;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}
