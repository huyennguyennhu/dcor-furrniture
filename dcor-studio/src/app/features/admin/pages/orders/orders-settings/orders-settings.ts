import { Component, OnInit, HostListener } from '@angular/core';
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
  Building2,
  SlidersHorizontal,
  Info,
  Clock,
  CreditCard,
  Bell,
  HelpCircle,
  Layers,
  Wrench,
  Package,
  ChevronDown
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
    Building2,
    SlidersHorizontal,
    Info,
    Clock,
    CreditCard,
    Bell,
    HelpCircle,
    Layers,
    Wrench,
    Package,
    ChevronDown
  };

  showTimeoutDropdown: boolean = false;
  readonly TIMEOUT_OPTIONS = [
    { value: 12, label: '12 Giờ' },
    { value: 24, label: '24 Giờ (1 Ngày - Mặc định)' },
    { value: 48, label: '48 Giờ (2 Ngày)' },
    { value: 72, label: '72 Giờ (3 Ngày)' }
  ];

  get selectedTimeoutLabel(): string {
    const val = Number(this.workflowSettings.unpaidTimeoutHours);
    const found = this.TIMEOUT_OPTIONS.find(opt => opt.value === val);
    return found ? found.label : (val ? `${val} Giờ` : '24 Giờ (1 Ngày - Mặc định)');
  }

  toggleTimeoutDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showTimeoutDropdown = !this.showTimeoutDropdown;
  }

  setTimeoutHours(hours: number): void {
    this.workflowSettings.unpaidTimeoutHours = hours;
    this.showTimeoutDropdown = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showTimeoutDropdown = false;
  }

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
    freeShippingMaxDistanceKm: 15,
    extraDistanceFeePerKm: 15000,
    baseShippingFee: 250000,
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

  // Snapshots & Dirty checking
  savedSnapshots: { [tab: number]: string } = {};
  showUnsavedModal: boolean = false;
  pendingTabSwitch: number | null = null;

  // Defaults for resetting
  readonly DEFAULT_WORKFLOW = {
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

  readonly DEFAULT_SHIPPING = {
    enableFreeShipping: true,
    freeShippingMinAmount: 15000000,
    freeShippingMaxDistanceKm: 15,
    extraDistanceFeePerKm: 15000,
    baseShippingFee: 250000,
    enableGhn: true,
    enableViettelPost: true,
    enableInternalFleet: true,
    stairCarryFeePerFloor: 150000,
    stairCarryStartFloor: 3,
    balconyCraneFee: 1500000,
    oldFurnitureDismantleFee: 300000,
    installationFeeDefault: 0
  };

  readonly DEFAULT_RETURNS = {
    exchangeMaxDays: 14,
    refundMaxDays: 7,
    unsealedRestockingFeePercent: 10,
    dcorPaysShippingIfDefective: true,
    defaultRefundMethod: 'BANK_TRANSFER'
  };

  readonly DEFAULT_RETURN_REASONS: ReturnReasonItem[] = [
    { id: 'RR-01', name: 'Lỗi kỹ thuật khung sườn / mối mọt', code: 'RT-DEFECT', feeBearer: 'DCOR', isActive: true, description: 'Lỗi do quy trình sản xuất hoặc kết cấu gỗ/kim loại' },
    { id: 'RR-02', name: 'Sai mã màu / kích thước / chất liệu', code: 'RT-WRONG-ITEM', feeBearer: 'DCOR', isActive: true, description: 'Giao nhầm mã màu hoặc sai quy cách so với hợp đồng' },
    { id: 'RR-03', name: 'Trầy xước / hư hỏng do vận chuyển', code: 'RT-DAMAGED', feeBearer: 'DCOR', isActive: true, description: 'Bị va đập, rách da nỉ trong quá trình giao hàng' },
    { id: 'RR-04', name: 'Khách đổi ý / không vừa không gian phòng', code: 'RT-CHANGE-MIND', feeBearer: 'CUSTOMER', isActive: true, description: 'Khách muốn đổi mẫu khác phù hợp với phòng khách hơn' },
    { id: 'RR-05', name: 'Sản phẩm không đúng kỳ vọng thực tế', code: 'RT-NOT-AS-DESC', feeBearer: 'CUSTOMER', isActive: true, description: 'Khách đổi ý sau khi xem sản phẩm thực tế tận nhà' }
  ];

  readonly DEFAULT_WARRANTY = {
    enableExpiringAlert: true,
    expiringAlertDays: 30,
    autoCreateMaintenanceTask: true
  };

  readonly DEFAULT_WARRANTY_TERMS: WarrantyTermItem[] = [
    { id: 'WT-01', componentName: 'Khung gỗ tự nhiên & Kim loại chịu lực', durationMonths: 60, coverageScope: 'Bảo hành kết cấu khung sườn, chống cong vênh mối mọt', isActive: true },
    { id: 'WT-02', componentName: 'Đệm mút D40 & Lò xo túi độc lập', durationMonths: 36, coverageScope: 'Bảo hành độ đàn hồi mút, lún sụt vượt mức tiêu chuẩn 15%', isActive: true },
    { id: 'WT-03', componentName: 'Da bò Ý tự nhiên & Da Microfiber', durationMonths: 24, coverageScope: 'Bảo hành bề mặt da, bong tróc nổ da tự nhiên', isActive: true },
    { id: 'WT-04', componentName: 'Vải nỉ nhung & Vải dệt cao cấp', durationMonths: 24, coverageScope: 'Bảo hành xù lông biến dạng sợi dệt, bung chỉ may', isActive: true },
    { id: 'WT-05', componentName: 'Phụ kiện cơ khí (Ray trượt, piston, bản lề)', durationMonths: 12, coverageScope: 'Bảo hành kẹt ray, gãy bản lề, hỏng piston nâng hạ', isActive: true }
  ];

  readonly DEFAULT_PRINT = {
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

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Load cached settings from localStorage if available
    const saved = localStorage.getItem('dcor_orders_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.workflow) this.workflowSettings = { ...this.DEFAULT_WORKFLOW, ...parsed.workflow };
        if (parsed.shipping) this.shippingSettings = { ...this.DEFAULT_SHIPPING, ...parsed.shipping };
        if (parsed.returns) this.returnsSettings = { ...this.DEFAULT_RETURNS, ...parsed.returns };
        if (parsed.returnReasons) this.returnReasons = parsed.returnReasons;
        if (parsed.warranty) this.warrantySettings = { ...this.DEFAULT_WARRANTY, ...parsed.warranty };
        if (parsed.warrantyTerms) this.warrantyTerms = parsed.warrantyTerms;
        if (parsed.print) this.printSettings = { ...this.DEFAULT_PRINT, ...parsed.print };
      } catch (e) {
        console.error('Error parsing saved order settings', e);
      }
    }
    this.captureAllSnapshots();
  }

  captureTabSnapshot(tab: number): void {
    this.savedSnapshots[tab] = this.getTabStateJson(tab);
  }

  captureAllSnapshots(): void {
    for (let i = 1; i <= 5; i++) {
      this.captureTabSnapshot(i);
    }
  }

  getTabStateJson(tab: number): string {
    switch (tab) {
      case 1:
        return JSON.stringify(this.workflowSettings);
      case 2:
        return JSON.stringify(this.shippingSettings);
      case 3:
        return JSON.stringify({ returns: this.returnsSettings, reasons: this.returnReasons });
      case 4:
        return JSON.stringify(this.warrantySettings);
      case 5:
        return JSON.stringify(this.printSettings);
      default:
        return '';
    }
  }

  isTabDirty(tab: number): boolean {
    if (!this.savedSnapshots[tab]) return false;
    return this.getTabStateJson(tab) !== this.savedSnapshots[tab];
  }

  get isCurrentTabDirty(): boolean {
    return this.isTabDirty(this.activeTab);
  }

  getTabName(tab: number): string {
    switch (tab) {
      case 1: return 'Quy trình & Trạng thái';
      case 2: return 'Vận chuyển & Giao lắp';
      case 3: return 'Chính sách Đổi trả';
      case 4: return 'Bảo hành & Hậu mãi';
      case 5: return 'Mẫu in & Thông báo';
      default: return `Tab ${tab}`;
    }
  }

  revertTab(tab: number): void {
    const saved = this.savedSnapshots[tab];
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      switch (tab) {
        case 1:
          this.workflowSettings = { ...data };
          break;
        case 2:
          this.shippingSettings = { ...data };
          break;
        case 3:
          this.returnsSettings = { ...data.returns };
          this.returnReasons = JSON.parse(JSON.stringify(data.reasons));
          break;
        case 4:
          this.warrantySettings = { ...data.warranty };
          this.warrantyTerms = JSON.parse(JSON.stringify(data.terms));
          break;
        case 5:
          this.printSettings = { ...data };
          break;
      }
    } catch (e) {
      console.error('Error reverting tab state', e);
    }
  }

  setTab(tabNumber: number): void {
    if (this.activeTab === tabNumber) return;

    if (this.isCurrentTabDirty) {
      this.pendingTabSwitch = tabNumber;
      this.showUnsavedModal = true;
      return;
    }

    this.activeTab = tabNumber;
  }

  saveAndSwitchTab(): void {
    this.saveCurrentTab();
    if (this.pendingTabSwitch !== null) {
      this.activeTab = this.pendingTabSwitch;
      this.pendingTabSwitch = null;
    }
    this.showUnsavedModal = false;
  }

  discardAndSwitchTab(): void {
    this.revertTab(this.activeTab);
    if (this.pendingTabSwitch !== null) {
      this.activeTab = this.pendingTabSwitch;
      this.pendingTabSwitch = null;
    }
    this.showUnsavedModal = false;
    this.triggerToast('Đã hủy các thay đổi chưa lưu', '', 'info', 2000);
  }

  cancelTabSwitch(): void {
    this.pendingTabSwitch = null;
    this.showUnsavedModal = false;
  }

  saveCurrentTab(): void {
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
      this.captureTabSnapshot(this.activeTab);
      const tabName = this.getTabName(this.activeTab);
      this.triggerToast(`Đã lưu cấu hình "${tabName}"!`, 'Dữ liệu mới đã được áp dụng.', 'success');
    }, 300);
  }

  saveAllSettings(): void {
    this.saveCurrentTab();
  }

  resetTabToDefault(): void {
    const tabName = this.getTabName(this.activeTab);
    if (confirm(`Bạn có chắc chắn muốn đặt lại các thông số trong tab "${tabName}" về mặc định?`)) {
      switch (this.activeTab) {
        case 1:
          this.workflowSettings = { ...this.DEFAULT_WORKFLOW };
          break;
        case 2:
          this.shippingSettings = { ...this.DEFAULT_SHIPPING };
          break;
        case 3:
          this.returnsSettings = { ...this.DEFAULT_RETURNS };
          this.returnReasons = JSON.parse(JSON.stringify(this.DEFAULT_RETURN_REASONS));
          break;
        case 4:
          this.warrantySettings = { ...this.DEFAULT_WARRANTY };
          this.warrantyTerms = JSON.parse(JSON.stringify(this.DEFAULT_WARRANTY_TERMS));
          break;
        case 5:
          this.printSettings = { ...this.DEFAULT_PRINT };
          break;
      }
      this.triggerToast(`Đã đặt lại tab "${tabName}" về mặc định!`, 'Nhấn "Lưu cài đặt" để áp dụng chính thức.', 'info');
    }
  }

  // --- CURRENCY & NUMBER INPUT HELPERS ---
  onlyAllowNumbers(event: KeyboardEvent, minVal: number = 0): void {
    // Chặn tuyệt đối dấu âm '-', dấu cộng '+', ký tự khoa học 'e', 'E', dấu phẩy/chấm
    if (['-', '+', 'e', 'E', '.', ','].includes(event.key)) {
      event.preventDefault();
      return;
    }

    // Các phím điều hướng và phím điều khiển hợp lệ
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', 'Enter', 'ArrowUp'];
    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Phím tắt tổ hợp hệ thống (Ctrl/Cmd + A, C, V, X)
    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
      return;
    }

    // Phím mũi tên xuống: chặn không cho giảm dưới mức tối thiểu (ngăn giảm về số âm)
    if (event.key === 'ArrowDown') {
      const input = event.target as HTMLInputElement;
      const currentVal = input.value !== '' ? Number(input.value) : minVal;
      if (isNaN(currentVal) || currentVal <= minVal) {
        event.preventDefault();
        input.value = String(minVal);
      }
      return;
    }

    // Chặn tất cả ký tự khác ngoài các chữ số 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  validateNumber(targetObj: any, key: string, minVal: number = 0, maxVal?: number, event?: Event): void {
    const input = event ? (event.target as HTMLInputElement) : null;
    const rawVal = input ? input.value : targetObj[key];

    if (rawVal === '' || rawVal === null || rawVal === undefined) {
      return;
    }

    let num = Number(rawVal);
    if (isNaN(num) || num < minVal) {
      num = minVal;
      if (input) input.value = String(minVal);
    } else if (maxVal !== undefined && num > maxVal) {
      num = maxVal;
      if (input) input.value = String(maxVal);
    }

    targetObj[key] = num;
  }

  validateNumberOnBlur(targetObj: any, key: string, minVal: number = 0, maxVal?: number, event?: Event): void {
    const input = event ? (event.target as HTMLInputElement) : null;
    const rawVal = input ? input.value : targetObj[key];

    if (rawVal === '' || rawVal === null || rawVal === undefined || isNaN(Number(rawVal))) {
      targetObj[key] = minVal;
      if (input) input.value = String(minVal);
      return;
    }

    let num = Number(rawVal);
    if (num < minVal) {
      num = minVal;
    } else if (maxVal !== undefined && num > maxVal) {
      num = maxVal;
    }

    targetObj[key] = num;
    if (input) input.value = String(num);
  }

  formatCurrencyDisplay(value: number | undefined | null): string {
    if (value === undefined || value === null || isNaN(value) || value <= 0) {
      return '';
    }
    return Math.max(0, value).toLocaleString('vi-VN');
  }

  onCurrencyInput(targetObj: any, key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    const num = raw ? Math.max(0, parseInt(raw, 10)) : 0;
    targetObj[key] = num;
    input.value = num > 0 ? num.toLocaleString('vi-VN') : '';
  }

  formatMoneyUnitText(value: number | undefined | null): string {
    if (!value || value <= 0) return '0 đồng';
    if (value >= 1e9) {
      const v = value / 1e9;
      const formatted = v % 1 === 0 ? v.toString() : v.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
      return `${formatted} tỷ đồng`;
    }
    if (value >= 1e6) {
      const v = value / 1e6;
      const formatted = v % 1 === 0 ? v.toString() : v.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
      return `${formatted} triệu đồng`;
    }
    if (value >= 1e3) {
      const v = value / 1e3;
      const formatted = v % 1 === 0 ? v.toString() : v.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
      return `${formatted} nghìn đồng`;
    }
    return `${value.toLocaleString('vi-VN')} đồng`;
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

  triggerToast(message: string, subMessage: string = '', type: 'success' | 'error' | 'info' = 'success', durationMs = 3000): void {
    this.pauseToastTimer();
    this.toastMessage = message;
    this.toastSubMessage = subMessage;
    this.toastType = type;
    this.showToast = true;
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, durationMs);
  }

  pauseToastTimer(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  resumeToastTimer(): void {
    if (!this.showToast) return;
    this.pauseToastTimer();
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, 3000);
  }

  closeToast(): void {
    this.showToast = false;
    this.pauseToastTimer();
  }

  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}
