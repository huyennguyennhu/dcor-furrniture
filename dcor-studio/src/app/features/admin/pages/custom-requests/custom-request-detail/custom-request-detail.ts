import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { 
  LucideAngularModule, 
  ArrowLeft, CheckCircle2, XCircle, Clock, Truck, Package, AlertTriangle, 
  ShieldCheck, DollarSign, CornerDownLeft, FileText, Check, X, Building2, 
  CreditCard, AlertCircle, RotateCcw, MapPin, ChevronDown, ExternalLink, 
  Eye, Ruler, Layers, Palette, QrCode, ClipboardCheck, Sparkles, User, UserCheck,
  Mail, Phone, Download, Upload, Copy, Pencil, Image as ImageIcon,
  Trash2, Paperclip, Printer
} from 'lucide-angular';
import { 
  CustomRequestService, 
  CustomRequest, 
  CustomRequestStatus, 
  CUSTOM_STATUS_MAP, 
  StatusMeta 
} from '../../../../../core/services/custom-request.service';
import { AdminAuthService } from '../../../../../core/services/admin-auth.service';

export interface ArchitectStaff {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

@Component({
  selector: 'app-admin-custom-request-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './custom-request-detail.html',
  styleUrls: ['./custom-request-detail.css']
})
export class AdminCustomRequestDetailComponent implements OnInit, OnDestroy {
  readonly icons = {
    ArrowLeft, CheckCircle2, XCircle, Clock, Truck, Package, AlertTriangle,
    ShieldCheck, DollarSign, CornerDownLeft, FileText, Check, X, Building2,
    CreditCard, AlertCircle, RotateCcw, MapPin, ChevronDown, ExternalLink,
    Eye, Ruler, Layers, Palette, QrCode, ClipboardCheck, Sparkles, User, UserCheck,
    Mail, Phone, Download, Upload, Copy, Pencil, Image: ImageIcon,
    Trash2, Paperclip, Printer
  };

  /** Danh sách Kiến trúc sư nạp trực tiếp từ Supabase Database */
  architectsList: ArchitectStaff[] = [];

  loadArchitects(): void {
    console.log('[loadArchitects] Starting...');
    // Ưu tiên nạp cache từ Supabase đã lưu trước đó để render tức thì
    this.loadArchitectsFromCache();

    // Đồng bộ trực tiếp từ Supabase API backend (/api/admin/staff)
    console.log('[loadArchitects] Requesting GET', `${environment.apiUrl}/admin/staff`);
    this.http.get<any[]>(`${environment.apiUrl}/admin/staff`).subscribe({
      next: (data) => {
        console.log('[loadArchitects] Received data:', data?.length);
        if (Array.isArray(data) && data.length > 0) {
          const filtered = data.filter((s: any) => {
            const roleStr = (s.role || '').toLowerCase();
            const rolesArr = Array.isArray(s.roles) ? s.roles.map((r: any) => String(r).toLowerCase()) : [];
            return roleStr.includes('kiến trúc sư') || roleStr.includes('kts') ||
                   rolesArr.some((r: string) => r.includes('kiến trúc sư') || r.includes('kts'));
          });
          console.log('[loadArchitects] Filtered architects from Supabase:', filtered.map(f => f.name));
          if (filtered.length > 0) {
            this.architectsList = filtered.map((s: any) => {
              const rawName = s.name || s.fullName || 'Kiến trúc sư';
              return {
                id: s.id,
                name: rawName.startsWith('KTS.') ? rawName : `KTS. ${rawName}`,
                role: 'Kiến trúc sư',
                phone: s.phone,
                email: s.email
              };
            });
            try {
              localStorage.setItem('dcor_staff_accounts_list', JSON.stringify(data));
            } catch (e) {}
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        console.warn('Lỗi tải danh sách nhân sự từ server:', err);
      }
    });
  }

  private loadArchitectsFromCache(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('dcor_staff_accounts_list');
        if (raw) {
          const parsed = JSON.parse(raw);
          const filtered = parsed.filter((s: any) => {
            const roleStr = (s.role || '').toLowerCase();
            const rolesArr = Array.isArray(s.roles) ? s.roles.map((r: any) => String(r).toLowerCase()) : [];
            return roleStr.includes('kiến trúc sư') || roleStr.includes('kts') ||
                   rolesArr.some((r: string) => r.includes('kiến trúc sư') || r.includes('kts'));
          });
          if (filtered.length > 0) {
            this.architectsList = filtered.map((s: any) => {
              const rawName = s.name || s.fullName || 'Kiến trúc sư';
              return {
                id: s.id,
                name: rawName.startsWith('KTS.') ? rawName : `KTS. ${rawName}`,
                role: 'Kiến trúc sư',
                phone: s.phone,
                email: s.email
              };
            });
          }
        }
      }
    } catch (e) {}
  }

  /** Trạng thái mở/đóng dropdown Kiến trúc sư */
  isArchitectDropdownOpen: boolean = false;

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isArchitectDropdownOpen = false;
  }

  toggleArchitectDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isArchitectDropdownOpen = !this.isArchitectDropdownOpen;
  }

  selectArchitect(staffName: string, event: MouseEvent): void {
    event.stopPropagation();
    this.isArchitectDropdownOpen = false;
    this.onAssignArchitect(staffName);
  }

  /** Phân công trực tiếp KTS từ dropdown */
  onAssignArchitect(staffName: string): void {
    if (!this.request || !staffName) return;
    this.request.assignedStaff = staffName;
    this.surveyForm.staffName = staffName;
    this.customRequestService.assignArchitect(this.request.id, staffName);
    this.triggerToast(
      'Phân công Kiến trúc sư thành công',
      `Đã phân công ${staffName} (Role: Kiến trúc sư) phụ trách hồ sơ #${this.request.code}.`,
      'success'
    );
  }

  request?: CustomRequest;
  requestId: string = '';
  private sub?: Subscription;

  // Stepper viewing state (0 to 7)
  activeViewingStep: number = 0;

  // Trạng thái mở/thu gọn thẻ Phiếu Yêu Cầu Custom (mở ở bước 1, thu gọn từ bước 2 trở đi)
  isCustomCardExpanded: boolean = true;

  toggleCustomCard(): void {
    if (!this.isCardCollapsible()) return;
    this.isCustomCardExpanded = !this.isCustomCardExpanded;
  }

  /** Chỉ có hiệu ứng đóng mở từ bước 2 trở đi; Bước 1 luôn mở không đóng */
  isCardCollapsible(): boolean {
    if (this.activeViewingStep === 0) return false;
    return this.getCurrentStepIndex() >= 1;
  }

  // Trạng thái mở/thu gọn thẻ Tác Nghiệp Khảo Sát & Đo Đạc (mở ở bước 2, thu gọn từ bước 3 trở đi)
  isSurveyCardExpanded: boolean = true;

  toggleSurveyCard(): void {
    if (!this.isSurveyCardCollapsible()) return;
    this.isSurveyCardExpanded = !this.isSurveyCardExpanded;
  }

  /** Chỉ có hiệu ứng đóng mở từ bước 3 trở đi; Bước 2, 1 luôn mở không đóng */
  isSurveyCardCollapsible(): boolean {
    if (this.activeViewingStep <= 1) return false;
    return this.getCurrentStepIndex() >= 2;
  }

  /** Kiểm tra có đang xem đúng bước hiện tại hay đang xem lại lịch sử bước cũ */
  isViewingCurrentStep(): boolean {
    return this.activeViewingStep === this.getCurrentStepIndex();
  }

  /** Quay về xem bước tác nghiệp hiện tại */
  returnToCurrentStep(): void {
    this.activeViewingStep = this.getCurrentStepIndex();
    this.isCustomCardExpanded = (this.activeViewingStep === 0);
    this.isSurveyCardExpanded = (this.activeViewingStep <= 1);
  }

  // Khảo sát đo đạc: Lựa chọn nhập ghi chú hoặc upload file của KTS
  surveyInputMode: 'NOTE' | 'FILE' = 'NOTE';
  surveyNoteText: string = '';
  surveyUploadedFile: {
    name: string;
    size: string;
    url: string;
    type?: string;
  } | null = null;
  isSavedSurveyRecord: boolean = false;
  private savedTimer: any = null;

  setSurveyInputMode(mode: 'NOTE' | 'FILE'): void {
    this.surveyInputMode = mode;
  }

  onSurveyFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.surveyUploadedFile = {
          name: file.name,
          size: sizeStr,
          url: e.target?.result as string,
          type: file.type
        };
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeSurveyFile(): void {
    this.surveyUploadedFile = null;
    if (this.request?.surveyAttachment) {
      delete this.request.surveyAttachment;
      this.customRequestService.updateSurveyRecord(this.request.id, {
        surveyNotes: this.surveyNoteText,
        surveyAttachment: undefined
      });
    }
    this.cdr.detectChanges();
  }

  hasSurveyRecord(): boolean {
    const hasNote = !!(this.surveyNoteText && this.surveyNoteText.trim());
    const hasFile = !!this.surveyUploadedFile;
    return hasNote || hasFile;
  }

  /** Khối Tác nghiệp Khảo sát & Đo đạc chỉ hiển thị từ Bước 2 trở đi */
  isSurveyCardVisible(): boolean {
    if (!this.request) return false;
    return this.activeViewingStep >= 1 && this.getCurrentStepIndex() >= 1;
  }

  /** Khối Dự toán Báo giá & 3D chỉ hiển thị từ Bước 3 trở đi */
  isQuoteCardVisible(): boolean {
    if (!this.request) return false;
    return this.activeViewingStep >= 2 && this.getCurrentStepIndex() >= 2;
  }

  /** Khối Tiến độ Sản xuất & QC chỉ hiển thị từ Bước 7 trở đi */
  isProductionCardVisible(): boolean {
    if (!this.request) return false;
    return ['PROCESSING', 'QC_PASSED', 'COMPLETED'].includes(this.request.status) && this.activeViewingStep >= 6;
  }

  saveSurveyRecord(): void {
    if (!this.request) return;

    this.request.surveyNotes = this.surveyNoteText;
    if (this.surveyUploadedFile) {
      this.request.surveyAttachment = {
        name: this.surveyUploadedFile.name,
        size: this.surveyUploadedFile.size,
        previewUrl: this.surveyUploadedFile.url,
        type: this.surveyUploadedFile.type
      };
    } else {
      delete this.request.surveyAttachment;
    }

    this.customRequestService.updateSurveyRecord(this.request.id, {
      surveyNotes: this.surveyNoteText,
      surveyAttachment: this.request.surveyAttachment
    });

    this.isSavedSurveyRecord = true;
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => {
      this.isSavedSurveyRecord = false;
      this.cdr.detectChanges();
    }, 1800);

    this.triggerToast(
      'Đã lưu biên bản đo đạc',
      'Biên bản kết quả đo đạc & khảo sát của KTS đã được lưu thành công.',
      'success'
    );
    this.cdr.detectChanges();
  }

  /** Hoàn thiện khảo sát đo đạc ở Bước 2 -> Lưu kết quả và chuyển thẳng sang Bước 3 (Báo giá & 3D), KHÔNG hiện popup */
  completeSurveyRecord(): void {
    if (!this.request) return;
    if (!this.hasSurveyRecord()) {
      this.triggerToast(
        'Chưa có dữ liệu khảo sát',
        'Vui lòng nhập ghi chú đo đạc thực tế hoặc tải lên tệp khảo sát trước khi hoàn tất.',
        'error'
      );
      return;
    }

    // Tự động lưu thông số đo đạc / file nếu có
    this.request.surveyNotes = this.surveyNoteText.trim();
    if (this.surveyUploadedFile) {
      this.request.surveyAttachment = {
        name: this.surveyUploadedFile.name,
        size: this.surveyUploadedFile.size,
        previewUrl: this.surveyUploadedFile.url,
        type: this.surveyUploadedFile.type
      };
    }
    this.customRequestService.updateSurveyRecord(this.request.id, {
      surveyNotes: this.surveyNoteText.trim(),
      surveyAttachment: this.request.surveyAttachment
    });

    // Chuyển sang Bước 3: QUOTED (Báo giá & 3D)
    const currentStaff = this.adminAuthService.currentUser?.fullName 
      ? (this.adminAuthService.currentUser.role === 'Kiến trúc sư' 
          ? `KTS. ${this.adminAuthService.currentUser.fullName}` 
          : this.adminAuthService.currentUser.fullName)
      : (this.request.assignedStaff?.replace(/\s*\(DCor Studio\)/gi, '').trim() || 'KTS. Lê Hoàng');

    this.customRequestService.completeSurvey(this.request.id, currentStaff);
    this.loadRequest();
    this.triggerToast(
      'Hoàn tất khảo sát đo đạc',
      'Đã hoàn thành đo đạc thực tế hiện trạng. Hồ sơ đã chuyển sang Bước 3: Lập báo giá & 3D.',
      'success'
    );
  }

  // Toast notification state
  showToast = false;
  toastTitle = '';
  toastMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any = null;

  // Action Modals State
  activeModal: 'NONE' | 'SURVEY' | 'QUOTE' | 'CONTRACT' | 'VIETQR' | 'QC' | 'DELIVERY' | 'CANCEL' = 'NONE';

  // Forms data for modals
  surveyForm = {
    staffName: 'KTS. Lê Nam (DCor Studio)',
    surveyDate: '',
    surveyNotes: 'Đã khảo sát đo đạc hiện trạng thực tế, mặt bằng phẳng, hướng đón ánh sáng tốt, sẵn sàng lên bản vẽ 3D.'
  };

  // Step 3: Tác nghiệp Báo giá & Phối cảnh 3D
  quote3dInputMode: 'FILE' | 'URL' = 'FILE';
  quoteUploadedFile: {
    name: string;
    size: string;
    url: string;
    type?: string;
  } | null = null;
  isSavedQuoteRecord: boolean = false;
  private savedQuoteTimer: any = null;

  quoteForm = {
    quotedPrice: 0,
    depositPercent: 30,
    depositAmount: 0,
    drawing3dUrl: '',
    notes: '',
    staffName: 'KTS. Lê Nam (DCor Studio)'
  };

  setQuote3dMode(mode: 'FILE' | 'URL'): void {
    this.quote3dInputMode = mode;
  }

  onQuote3dFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.quoteUploadedFile = {
          name: file.name,
          size: sizeStr,
          url: e.target?.result as string,
          type: file.type
        };
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeQuote3dFile(): void {
    this.quoteUploadedFile = null;
  }

  updateQuoteDeposit(): void {
    const price = Number(this.quoteForm.quotedPrice) || 0;
    this.quoteForm.depositAmount = Math.round(price * (this.quoteForm.depositPercent / 100));
  }

  hasQuoteRecord(): boolean {
    if (!this.request) return false;
    const price = Number(this.quoteForm.quotedPrice);
    const hasPrice = !isNaN(price) && price > 0;
    const has3d = !!this.quoteUploadedFile || (!!this.quoteForm.drawing3dUrl && this.quoteForm.drawing3dUrl.trim().length > 0);
    return hasPrice && has3d;
  }

  saveQuoteRecord(): void {
    if (!this.request) return;
    this.isSavedQuoteRecord = true;
    if (this.savedQuoteTimer) clearTimeout(this.savedQuoteTimer);
    this.savedQuoteTimer = setTimeout(() => {
      this.isSavedQuoteRecord = false;
      this.cdr.detectChanges();
    }, 3000);
    this.triggerToast('Đã lưu kết quả dự toán', 'Thông số giá và tệp 3D đã được ghi nhận vào hồ sơ may đo.', 'success');
  }

  completeQuoteStep(): void {
    if (!this.request) return;
    if (!this.hasQuoteRecord()) {
      this.triggerToast(
        'Chưa đủ dữ liệu phát hành',
        'Vui lòng hoàn thành đơn giá dự toán và tệp phối cảnh 3D trước khi gửi khách.',
        'error'
      );
      return;
    }

    const drawingUrl = this.quoteUploadedFile?.url || this.quoteForm.drawing3dUrl;
    this.customRequestService.sendQuote(this.request.id, {
      quotedPrice: Number(this.quoteForm.quotedPrice),
      quotedDeposit: Number(this.quoteForm.depositAmount),
      drawing3dUrl: drawingUrl,
      notes: this.quoteForm.notes,
      staffName: this.quoteForm.staffName
    });

    if (this.activeModal === 'QUOTE') {
      this.closeModal();
    }
    this.isQuotePreviewModalOpen = false;
    this.loadRequest();
    this.triggerToast(
      'Phát hành báo giá thành công',
      `Dự toán ${new Intl.NumberFormat('vi-VN').format(this.quoteForm.quotedPrice)} đ & phối cảnh 3D đã được gửi cho khách. Hồ sơ đã chuyển sang Bước 4: Hợp đồng.`,
      'success'
    );
  }

  isQuotePreviewModalOpen: boolean = false;

  openQuotePreviewModal(): void {
    if (!this.request) return;
    if (!this.hasQuoteRecord()) {
      this.triggerToast(
        'Chưa đủ dữ liệu báo giá',
        'Vui lòng nhập đơn giá dự toán và tệp phối cảnh 3D trước khi xem trước.',
        'error'
      );
      return;
    }
    this.isQuotePreviewModalOpen = true;
  }

  closeQuotePreviewModal(): void {
    this.isQuotePreviewModalOpen = false;
  }

  confirmAndSendQuote(): void {
    this.completeQuoteStep();
  }

  printQuoteDocument(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  getTodayFormatted(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  contractForm = {
    staffName: 'Phòng Hợp Đồng DCor Studio',
    contractNumber: 'HD-DCOR-2026/CR',
    scanUrl: 'assets/contracts/sample-contract-signed.pdf',
    notes: 'Hợp đồng may đo đã được hai bên ký duyệt và lưu trữ bản scan chính thức.'
  };

  qcForm = {
    dimensionAccuracy: true,
    surfaceFinish: true,
    cushionStitching: true,
    packagingProtection: true,
    inspectorName: 'Trần Văn Kiểm (Trưởng Ban QC DCor)',
    notes: 'Kích thước đúng 100% bản vẽ đo đạc. Đường chỉ may đôi sắc nét, độ đàn hồi mút D40 đạt chuẩn xuất xưởng.'
  };

  deliveryForm = {
    staffName: 'Nguyễn Văn Giao (Điều Phối Viên DCor)',
    remainingAmount: 17150000,
    warrantyCode: 'BH-DCOR-2026',
    customerSignedHandover: true,
    notes: 'Bàn giao lắp đặt hoàn tất tại phòng khách của khách hàng. Thu đủ số tiền 70% còn lại.'
  };

  cancelForm = {
    reason: '',
    customReason: ''
  };

  showCancelDropdown: boolean = false;

  readonly cancelPresetReasons = [
    'Khách hàng thay đổi kế hoạch thiết kế nội thất',
    'Không thống nhất được đơn giá dự toán',
    'Kích thước thực tế không phù hợp không gian nhà',
    'Khách hàng chuyển sang đặt mẫu có sẵn trên Store',
    'Lý do khác'
  ];

  // 8 Chuỗi trạng thái chuẩn của quy trình may đo nội thất
  readonly WORKFLOW_STEPS: { key: CustomRequestStatus; name: string; sub: string }[] = [
    { key: 'PENDING_REVIEW', name: 'Tiếp nhận', sub: 'Chờ KTS nhận việc' },
    { key: 'CONSULTING', name: 'Khảo sát', sub: 'Đo thực tế & tư vấn' },
    { key: 'QUOTED', name: 'Báo giá & 3D', sub: 'Phối cảnh 3D & giá' },
    { key: 'AWAITING_CONTRACT', name: 'Hợp đồng', sub: 'Chờ ký hợp đồng' },
    { key: 'CONTRACT_SIGNED', name: 'Đã ký HĐ', sub: 'Lưu bản scan HĐ' },
    { key: 'AWAITING_PAYMENT', name: 'Cọc 30%', sub: 'Mã VietQR chờ duyệt' },
    { key: 'PROCESSING', name: 'Sản xuất', sub: 'Gia công xưởng' },
    { key: 'COMPLETED', name: 'Nghiệm thu', sub: 'Thu 70% & Bảo hành' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customRequestService: CustomRequestService,
    private adminAuthService: AdminAuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadArchitects();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.requestId = id;
        this.loadRequest();
      }
    });

    this.sub = this.customRequestService.requests$.subscribe(() => {
      if (this.requestId) {
        this.loadRequest();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.savedTimer) clearTimeout(this.savedTimer);
  }

  loadRequest(): void {
    this.request = this.customRequestService.getRequestById(this.requestId);
    if (this.request) {
      this.syncStepIndex();
      this.syncFormDefaults();
      // Từ bước 2 trở đi (status != PENDING_REVIEW), mặc định thu gọn khối Phiếu Yêu Cầu Custom; bước 1 luôn mở
      this.isCustomCardExpanded = (this.activeViewingStep === 0);
      // Từ bước 3 trở đi, mặc định thu gọn khối Khảo Sát & Đo Đạc; bước 2, 1 luôn mở
      this.isSurveyCardExpanded = (this.activeViewingStep <= 1);
    }
  }

  syncStepIndex(): void {
    if (!this.request) return;
    const currentStatus = this.request.status;
    if (currentStatus === 'CANCELLED') {
      this.activeViewingStep = 1;
      return;
    }
    const idx = this.WORKFLOW_STEPS.findIndex(s => s.key === currentStatus);
    if (idx !== -1) {
      this.activeViewingStep = idx;
    } else if (currentStatus === 'QC_PASSED') {
      this.activeViewingStep = 7;
    }
  }

  syncFormDefaults(): void {
    if (!this.request) return;
    const req = this.request;
    const price = req.quotedPrice || 0;
    const deposit = req.quotedDeposit || (price ? Math.round(price * 0.3) : 0);

    this.quoteForm.quotedPrice = price;
    this.quoteForm.depositAmount = deposit;
    this.quoteForm.drawing3dUrl = req.drawing3dUrl || '';
    if (req.drawing3dUrl) {
      this.quote3dInputMode = 'URL';
    }
    this.contractForm.contractNumber = `HD-DCOR-2026/${req.code}`;
    this.deliveryForm.remainingAmount = price - deposit;
    this.deliveryForm.warrantyCode = req.warrantyCode || `BH-DCOR-${req.code.replace('CR-', '')}`;

    // Khởi tạo ghi chú / file khảo sát đo đạc thực tế của KTS
    this.surveyNoteText = req.surveyNotes || '';
    if (req.surveyAttachment) {
      this.surveyUploadedFile = {
        name: req.surveyAttachment.name,
        size: req.surveyAttachment.size,
        url: req.surveyAttachment.previewUrl,
        type: req.surveyAttachment.type
      };
      if (!this.surveyNoteText && this.surveyUploadedFile) {
        this.surveyInputMode = 'FILE';
      }
    } else {
      this.surveyUploadedFile = null;
    }
  }

  getStatusMeta(status: CustomRequestStatus): StatusMeta {
    return CUSTOM_STATUS_MAP[status] || {
      adminLabel: status,
      customerLabel: status,
      color: '#4B5563',
      bgColor: '#F3F4F6',
      borderColor: '#E5E7EB',
      description: '',
      stepIndex: 1
    };
  }

  // --- STEPPER STATE HELPERS ---
  getCurrentStepIndex(): number {
    if (!this.request) return 0;
    const status = this.request.status;
    if (status === 'CANCELLED') return -1;
    if (status === 'QC_PASSED') return 7;
    const found = this.WORKFLOW_STEPS.findIndex(s => s.key === status);
    return found !== -1 ? found : 0;
  }

  isStepDone(stepIndex: number): boolean {
    const current = this.getCurrentStepIndex();
    return current > stepIndex;
  }

  isStepActive(stepIndex: number): boolean {
    const current = this.getCurrentStepIndex();
    return current === stepIndex;
  }

  isStepViewing(stepIndex: number): boolean {
    return this.activeViewingStep === stepIndex;
  }

  isLineDone(stepIndex: number): boolean {
    const current = this.getCurrentStepIndex();
    return current > stepIndex;
  }

  onStepClick(stepIndex: number): void {
    if (stepIndex > this.getCurrentStepIndex()) {
      return; // Không cho nhảy đến bước tương lai chưa kích hoạt
    }
    this.activeViewingStep = stepIndex;
    if (stepIndex === 0) {
      // Khi trở về Bước 1: luôn mở khối Phiếu Yêu Cầu Custom, không đóng
      this.isCustomCardExpanded = true;
      this.isSurveyCardExpanded = true;
    } else if (stepIndex === 1) {
      // Khi ở Bước 2: thu gọn khối Phiếu Yêu Cầu, luôn mở khối Khảo Sát
      this.isCustomCardExpanded = false;
      this.isSurveyCardExpanded = true;
    } else {
      // Từ bước 3 trở đi: thu gọn cả Phiếu Yêu Cầu và Khảo Sát
      this.isCustomCardExpanded = false;
      this.isSurveyCardExpanded = false;
    }
  }

  getStepTooltip(stepIndex: number): string {
    const step = this.WORKFLOW_STEPS[stepIndex];
    return `Bước ${stepIndex + 1}: ${step.name} - ${step.sub}`;
  }

  // --- NAVIGATION ---
  goBack(): void {
    this.router.navigate(['/admin/custom-requests']);
  }

  goToCustomer(): void {
    if (this.request?.customerId) {
      this.router.navigate(['/admin/customers', this.request.customerId]);
    } else if (this.request?.customerPhone || this.request?.customerName) {
      this.router.navigate(['/admin/customers'], {
        queryParams: { q: this.request.customerPhone || this.request.customerName }
      });
    }
  }

  goToOrder(orderNumber?: string): void {
    const num = orderNumber || this.request?.generatedOrderNumber;
    if (num) {
      this.router.navigate(['/admin/orders', num]);
    }
  }

  goToWarranty(code?: string): void {
    const warCode = code || this.request?.warrantyCode;
    if (warCode) {
      this.router.navigate(['/admin/orders/warranty'], {
        queryParams: { search: warCode }
      });
    }
  }

  // --- TOAST NOTIFICATION ---
  triggerToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'success', durationMs = 3500) {
    this.pauseToastTimer();
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, durationMs);
  }

  closeToast() {
    this.showToast = false;
    this.pauseToastTimer();
  }

  pauseToastTimer() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  resumeToastTimer() {
    if (this.showToast && !this.toastTimer) {
      this.toastTimer = setTimeout(() => {
        this.closeToast();
      }, 2500);
    }
  }

  // --- ACTION MODALS CONTROLLERS ---
  openModal(modal: 'SURVEY' | 'QUOTE' | 'CONTRACT' | 'VIETQR' | 'QC' | 'DELIVERY' | 'CANCEL'): void {
    if (modal === 'SURVEY' && (!this.request?.assignedStaff || !this.request.assignedStaff.trim())) {
      this.triggerToast(
        'Chưa phân công Kiến trúc sư',
        'Vui lòng chọn Kiến trúc sư phụ trách trước khi tiếp nhận yêu cầu.',
        'error'
      );
      return;
    }
    this.activeModal = modal;
    if (modal === 'CANCEL') {
      this.cancelForm = { reason: '', customReason: '' };
      this.showCancelDropdown = false;
    }
  }

  closeModal(): void {
    this.activeModal = 'NONE';
    this.showCancelDropdown = false;
  }

  get selectedCancelReasonLabel(): string {
    return this.cancelForm.reason || 'Chọn lý do hủy';
  }

  toggleCancelDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showCancelDropdown = !this.showCancelDropdown;
  }

  selectCancelReason(reason: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.cancelForm.reason = reason;
    this.showCancelDropdown = false;
  }

  get canConfirmCancel(): boolean {
    const hasReason = !!this.cancelForm.reason && this.cancelForm.reason.trim().length > 0;
    const hasDetailNote = !!this.cancelForm.customReason && this.cancelForm.customReason.trim().length > 0;
    return hasReason && hasDetailNote;
  }

  // Step 1: Tiếp nhận yêu cầu & chuyển thẳng sang Bước 2 (Khảo sát đo đạc)
  proceedToConsulting(): void {
    if (!this.request) return;
    if (!this.request.assignedStaff || !this.request.assignedStaff.trim()) {
      this.triggerToast(
        'Chưa phân công Kiến trúc sư',
        'Vui lòng chọn Kiến trúc sư phụ trách trước khi tiếp nhận yêu cầu.',
        'error'
      );
      return;
    }

    const staff = this.request.assignedStaff;
    this.customRequestService.startConsulting(
      this.request.id,
      staff,
      `Kiến trúc sư ${staff} đã tiếp nhận hồ sơ #${this.request.code} và lên lịch khảo sát đo đạc hiện trạng thực tế.`
    );
    this.loadRequest();
    this.triggerToast(
      'Tiếp nhận thành công',
      `Hồ sơ #${this.request.code} đã được chuyển sang Bước 2: Khảo sát đo đạc (${staff}).`,
      'success'
    );
  }

  // Step 1: Khảo sát đo đạc
  submitSurvey(): void {
    if (!this.request) return;
    this.customRequestService.startConsulting(
      this.request.id,
      this.surveyForm.staffName,
      this.surveyForm.surveyNotes
    );
    this.closeModal();
    this.loadRequest();
    this.triggerToast('Tiếp nhận thành công', `Hồ sơ ${this.request.code} đã được KTS tiếp nhận và lên lịch khảo sát.`, 'success');
  }

  // Step 3 & 4: Hợp đồng may đo
  submitContract(): void {
    if (!this.request) return;
    if (this.request.status === 'QUOTED') {
      this.customRequestService.prepareContract(this.request.id, this.contractForm.staffName);
      this.triggerToast('Phát hành hợp đồng', `Hợp đồng may đo ${this.contractForm.contractNumber} đã được soạn thảo và gửi cho khách ký duyệt.`, 'info');
    } else {
      this.customRequestService.confirmContractSigned(this.request.id, this.contractForm.scanUrl, this.contractForm.staffName);
      this.triggerToast('Ký duyệt hợp đồng', `Hồ sơ hợp đồng đã ký và lưu trữ bản scan thành công. Chuyển sang thu cọc 30%.`, 'success');
    }
    this.closeModal();
    this.loadRequest();
  }

  // Step 5: Xác nhận cọc 30% VietQR -> Bắn xưởng sản xuất
  submitDepositPayment(): void {
    if (!this.request) return;
    this.customRequestService.confirmPaymentAndStartProduction(this.request.id, 'Kế Toán Trưởng DCOR');
    this.closeModal();
    this.loadRequest();
    this.triggerToast(
      'Xác nhận cọc 30% thành công!',
      `Hệ thống đã tự động sinh Đơn hàng chính thức #${this.request.generatedOrderNumber} và phát Lệnh xưởng #${this.request.workOrderCode}.`,
      'success'
    );
  }

  // Step 6: Nghiệm thu QC 4 tiêu chí
  allQcChecked(): boolean {
    return (
      this.qcForm.dimensionAccuracy &&
      this.qcForm.surfaceFinish &&
      this.qcForm.cushionStitching &&
      this.qcForm.packagingProtection
    );
  }

  submitQc(): void {
    if (!this.request) return;
    this.customRequestService.passQcInspection(this.request.id, this.qcForm, this.qcForm.inspectorName, this.qcForm.notes);
    this.closeModal();
    this.loadRequest();
    this.triggerToast('Nghiệm thu QC đạt chuẩn!', `Sản phẩm may đo đạt 4/4 tiêu chí khắt khe, đủ điều kiện đóng gói xuất xưởng.`, 'success');
  }

  // Step 7: Giao hàng, thu 70% & Kích hoạt bảo hành
  submitDeliveryWarranty(): void {
    if (!this.request) return;
    this.customRequestService.completeDeliveryAndWarranty(this.request.id, this.deliveryForm.staffName);
    this.closeModal();
    this.loadRequest();
    this.triggerToast('Hoàn tất may đo & Kích hoạt BH', `Hồ sơ đã hoàn tất chu trình. Đã kích hoạt bảo hành chính hãng 5 năm #${this.request.warrantyCode}.`, 'success');
  }

  // Hủy hồ sơ
  submitCancel(): void {
    if (!this.request || !this.canConfirmCancel) {
      if (!this.cancelForm.reason) {
        this.triggerToast('Chưa chọn lý do!', 'Vui lòng chọn lý do hủy trước khi xác nhận.', 'error');
      } else if (!this.cancelForm.customReason || !this.cancelForm.customReason.trim()) {
        this.triggerToast('Thiếu thông tin!', 'Vui lòng nhập nội dung chi tiết lý do hủy.', 'error');
      }
      return;
    }
    const fullReason = `${this.cancelForm.reason}${this.cancelForm.customReason ? ' - ' + this.cancelForm.customReason.trim() : ''}`;
    this.customRequestService.cancelRequest(this.request.id, fullReason, 'Admin Quản Trị');
    this.closeModal();
    this.loadRequest();
    this.triggerToast('Đã hủy hồ sơ', `Hồ sơ ${this.request.code} đã chuyển sang trạng thái Hủy.`, 'error');
  }

  // Helpers
  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  /** Lấy tên hiển thị chuẩn xác của người thực hiện từng sự kiện trong Timeline */
  getActorDisplay(item: any): string {
    if (!item) return '';
    let actor = (item.performedBy || '').trim();

    // 1. Nếu là sự kiện Khách hàng gửi yêu cầu ban đầu (hoặc tên người thực hiện trùng tên khách hàng)
    if (
      item.status === 'PENDING_REVIEW' || 
      item.title?.toLowerCase().includes('khách hàng') ||
      (this.request && actor && actor.toLowerCase() === this.request.customerName?.toLowerCase())
    ) {
      const custName = this.request?.customerName || actor;
      return `Khách hàng (${custName})`;
    }

    // 2. Chuẩn hóa tên: loại bỏ hậu tố thừa "(DCor Studio)" nếu có
    actor = actor.replace(/\s*\(DCor Studio\)/gi, '').trim();

    return actor || 'Ban Quản Trị DCOR';
  }

  formatVND(value?: number): string {
    if (value === undefined || value === null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  copyToClipboard(text: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      this.triggerToast('Đã sao chép', `Đã sao chép "${text}" vào bộ nhớ tạm.`, 'info', 2000);
    }
  }
}
