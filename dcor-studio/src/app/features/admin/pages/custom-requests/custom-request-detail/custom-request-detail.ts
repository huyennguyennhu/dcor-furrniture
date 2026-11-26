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
  Trash2, Paperclip, Printer, FilePlus, RefreshCw, FileCheck, Plus
} from 'lucide-angular';
import { 
  CustomRequestService, 
  CustomRequest, 
  CustomRequestStatus, 
  CustomAttributeItem,
  CUSTOM_STATUS_MAP, 
  StatusMeta 
} from '../../../../../core/services/custom-request.service';
import { AdminAuthService } from '../../../../../core/services/admin-auth.service';
import { ProductService } from '../../../../../core/services/product.service';
import { OrdersService } from '../../orders/services/orders.service';
import { OrderV2 } from '../../orders/models/order.model';

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
    Trash2, Paperclip, Printer, FilePlus, RefreshCw, FileCheck, Plus
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

  // Trạng thái mở/thu gọn Lịch sử Tác nghiệp & Dòng thời gian (Default là thu gọn theo yêu cầu)
  isTimelineExpanded: boolean = false;

  toggleTimelineCard(): void {
    this.isTimelineExpanded = !this.isTimelineExpanded;
  }

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
  isSurveySaved: boolean = false; // Bắt buộc KTS phải bấm 'Lưu kết quả đo đạc & thông số' trước khi được bấm Hoàn thiện khảo sát
  private savedTimer: any = null;

  // Thông số kỹ thuật đo đạc chốt bởi KTS ở Bước 2
  surveyLength: number = 0;
  surveyWidth: number = 0;
  surveyHeight: number = 0;
  surveyColorName: string = '';
  surveyColorHex: string = '#8B4513';
  surveyColorImage: string = '';
  surveyMaterial: string = '';
  surveyLegMaterial: string = '';

  // Danh mục gợi ý vật liệu cao cấp chuẩn DCor
  readonly materialSuggestions: string[] = [
    'Da bò Ý nguyên tấm (Full Grain)',
    'Da bò Ý cao cấp (Top Grain)',
    'Da bò Nubuck cao cấp nhập khẩu Florence Ý',
    'Da Microfiber sinh học kháng nước',
    'Vải nỉ dệt thô sợi Bỉ chống bám bụi',
    'Vải nỉ nhung tuyết cao cấp',
    'Gỗ óc chó Bắc Mỹ nguyên khối (Walnut)',
    'Gỗ sồi trắng Nga (White Oak)',
    'Đá cẩm thạch Calacatta / Thạch anh tự nhiên'
  ];

  // Danh mục gợi ý chân đế / khung
  readonly legMaterialSuggestions: string[] = [
    'Gỗ óc chó Bắc Mỹ nguyên khối (Walnut)',
    'Kim loại sơn tĩnh điện đen mờ chống xước',
    'Inox 304 mạ PVD vàng Champagne bóng gương',
    'Gỗ sồi tự nhiên tiện tròn phong cách Bắc Âu',
    'Khung chân ẩn giấu viền tạo hiệu ứng lơ lửng'
  ];

  // Swatch màu gợi ý nhanh cho KTS
  readonly colorPresets = [
    { name: 'Nâu Bò Cát Xước (Sand Brown)', hex: '#92400E' },
    { name: 'Nâu Cognac Ý', hex: '#8B4513' },
    { name: 'Nâu Espresso', hex: '#3B2819' },
    { name: 'Kem Sand Luxury', hex: '#E8DFC8' },
    { name: 'Xám Khói Modern', hex: '#71717A' },
    { name: 'Xanh Navy Thượng Lưu', hex: '#1E293B' },
    { name: 'Đen Noir Quyền Lực', hex: '#18181B' }
  ];

  selectColorPreset(preset: { name: string; hex: string }): void {
    this.surveyColorName = preset.name;
    this.surveyColorHex = preset.hex;
    this.onSurveyChange();
  }

  onSurveyChange(): void {
    this.isSurveySaved = false;
  }

  canCompleteSurvey(): boolean {
    return this.hasSurveyRecord() && this.isSurveySaved;
  }

  getCompleteSurveyTitle(): string {
    if (!this.hasSurveyRecord()) {
      return 'Vui lòng nhập thông số đo đạc thực tế hoặc ghi chú trước khi hoàn tất';
    }
    if (!this.isSurveySaved) {
      return 'Vui lòng nhấn "Lưu kết quả đo đạc & thông số" trước khi hoàn thiện khảo sát';
    }
    return 'Hoàn thiện khảo sát đo đạc & chuyển sang Bước 3: Báo giá & 3D';
  }

  onSurveyColorImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.surveyColorImage = e.target?.result as string;
        this.onSurveyChange();
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeSurveyColorImage(): void {
    this.surveyColorImage = '';
    this.onSurveyChange();
  }

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
        this.onSurveyChange();
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeSurveyFile(): void {
    this.surveyUploadedFile = null;
    this.onSurveyChange();
    if (this.request?.surveyAttachment) {
      delete this.request.surveyAttachment;
      this.customRequestService.updateSurveyRecord(this.request.id, {
        surveyNotes: this.surveyNoteText,
        surveyAttachment: undefined
      });
    }
    this.cdr.detectChanges();
  }

  /** Kiểm tra thuộc tính có phải do khách chọn "Khác" và nhập yêu cầu riêng hay không */
  isCustomOtherAttribute(attr: any): boolean {
    if (!attr) return false;
    if (attr.isOther === true) return true;
    if (attr.selectedOptionId === 'custom_other' || attr.selectedOptionId === 'other') return true;
    if (attr.selectedOptionName === 'Khác' || (typeof attr.selectedOptionName === 'string' && attr.selectedOptionName.startsWith('Khác'))) return true;
    if (attr.customNote && typeof attr.customNote === 'string' && attr.customNote.trim().length > 0) return true;
    return false;
  }

  /** Kiểm tra sản phẩm có thông số kích thước thật hay không (ẩn hoàn toàn phần đo đạc nếu không có kích thước) */
  hasProductDimensions(): boolean {
    if (!this.request) return false;
    if (this.request.hasDimensions === false) return false;
    if (this.request.hasDimensions === true) return true;

    // Kiểm tra thông qua kích thước gốc hoặc kích thước yêu cầu
    const orig = (this.request.originalDimensions || '').trim();
    const reqDim = (this.request.requestedDimensions || '').trim();
    const isValDim = (s: string) => {
      if (!s) return false;
      const lower = s.toLowerCase();
      if (lower === 'tiêu chuẩn gốc' || lower === '—' || lower === 'chưa xác định') return false;
      if (lower.startsWith('0 x 0') || lower.startsWith('0 • 0')) return false;
      return /\d+/.test(s);
    };

    if (isValDim(orig) || isValDim(reqDim)) return true;

    if (
      (this.request.length !== undefined && this.request.length > 0) ||
      (this.request.width !== undefined && this.request.width > 0) ||
      (this.request.height !== undefined && this.request.height > 0)
    ) {
      return true;
    }

    return false;
  }

  /** Kiểm tra sản phẩm có thuộc tính màu sắc thực tế không */
  hasColorAttribute(): boolean {
    if (!this.request) return false;
    if (this.request.customizedAttributes && this.request.customizedAttributes.length > 0) {
      return this.request.customizedAttributes.some(a => 
        (a.groupId && a.groupId.toLowerCase().includes('color')) ||
        (a.label && a.label.toLowerCase().includes('màu')) ||
        !!a.hexColor
      );
    }
    return !!(this.request.colorName && this.request.colorName.trim());
  }

  /** Lấy nhãn hiển thị thực tế của thuộc tính màu sắc */
  getColorAttributeLabel(): string {
    const attr = this.request?.customizedAttributes?.find(a => 
      (a.groupId && a.groupId.toLowerCase().includes('color')) ||
      (a.label && a.label.toLowerCase().includes('màu')) ||
      !!a.hexColor
    );
    return attr?.label || 'Màu sắc thực tế chốt';
  }

  /** Kiểm tra sản phẩm có thuộc tính chất liệu bề mặt không */
  hasMaterialAttribute(): boolean {
    if (!this.request) return false;
    if (this.request.customizedAttributes && this.request.customizedAttributes.length > 0) {
      return this.request.customizedAttributes.some(a => 
        (a.groupId && (a.groupId.toLowerCase().includes('material') || a.groupId.toLowerCase().includes('upholstery') || a.groupId.toLowerCase().includes('fabric') || a.groupId.toLowerCase().includes('tabletop'))) ||
        (a.label && (a.label.toLowerCase().includes('chất liệu') || a.label.toLowerCase().includes('vải') || a.label.toLowerCase().includes('da') || a.label.toLowerCase().includes('bọc') || a.label.toLowerCase().includes('mặt')))
      );
    }
    return !!(this.request.material && this.request.material.trim());
  }

  /** Lấy nhãn hiển thị thực tế của thuộc tính chất liệu bề mặt */
  getMaterialAttributeLabel(): string {
    const attr = this.request?.customizedAttributes?.find(a => 
      (a.groupId && (a.groupId.toLowerCase().includes('material') || a.groupId.toLowerCase().includes('upholstery') || a.groupId.toLowerCase().includes('fabric') || a.groupId.toLowerCase().includes('tabletop'))) ||
      (a.label && (a.label.toLowerCase().includes('chất liệu') || a.label.toLowerCase().includes('vải') || a.label.toLowerCase().includes('da') || a.label.toLowerCase().includes('bọc') || a.label.toLowerCase().includes('mặt')))
    );
    return attr?.label || 'Chất liệu bề mặt chốt';
  }

  /** Kiểm tra sản phẩm có thuộc tính chân đế / khung kết cấu không */
  hasLegAttribute(): boolean {
    if (!this.request) return false;
    if (this.request.customizedAttributes && this.request.customizedAttributes.length > 0) {
      return this.request.customizedAttributes.some(a => 
        (a.groupId && (a.groupId.toLowerCase().includes('leg') || a.groupId.toLowerCase().includes('frame') || a.groupId.toLowerCase().includes('base'))) ||
        (a.label && (a.label.toLowerCase().includes('chân') || a.label.toLowerCase().includes('khung') || a.label.toLowerCase().includes('đế')))
      );
    }
    return !!(this.request.legMaterial && this.request.legMaterial.trim());
  }

  /** Lấy nhãn hiển thị thực tế của thuộc tính chân/khung */
  getLegAttributeLabel(): string {
    const attr = this.request?.customizedAttributes?.find(a => 
      (a.groupId && (a.groupId.toLowerCase().includes('leg') || a.groupId.toLowerCase().includes('frame') || a.groupId.toLowerCase().includes('base'))) ||
      (a.label && (a.label.toLowerCase().includes('chân') || a.label.toLowerCase().includes('khung') || a.label.toLowerCase().includes('đế')))
    );
    return attr?.label || 'Chân đế / Khung kết cấu chốt';
  }

  /** Lấy các thuộc tính đặc thù khác của sản phẩm (nếu có) */
  getOtherCustomAttributes(): CustomAttributeItem[] {
    if (!this.request?.customizedAttributes) return [];
    return this.request.customizedAttributes.filter(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      const isColor = g.includes('color') || l.includes('màu') || !!a.hexColor;
      const isMat = g.includes('material') || g.includes('upholstery') || g.includes('fabric') || g.includes('tabletop') || l.includes('chất liệu') || l.includes('vải') || l.includes('da') || l.includes('bọc') || l.includes('mặt');
      const isLeg = g.includes('leg') || g.includes('frame') || g.includes('base') || l.includes('chân') || l.includes('khung') || l.includes('đế');
      const isSize = g.includes('size') || l.includes('kích thước');
      return !isColor && !isMat && !isLeg && !isSize;
    });
  }

  /** Lấy ghi chú yêu cầu riêng của khách hàng đối với chất liệu bọc (nếu có) */
  getMaterialCustomNote(): string {
    const attr = this.request?.customizedAttributes?.find(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      return (
        g.includes('material') || g.includes('upholstery') || g.includes('fabric') || g.includes('tabletop') ||
        l.includes('chất liệu') || l.includes('vải') || l.includes('da') || l.includes('bọc') || l.includes('mặt')
      );
    });
    return attr?.customNote?.trim() || '';
  }

  /** Lấy ghi chú yêu cầu riêng của khách hàng đối với màu sắc (nếu có) */
  getColorCustomNote(): string {
    const attr = this.request?.customizedAttributes?.find(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      return g.includes('color') || l.includes('màu') || !!a.hexColor;
    });
    return attr?.customNote?.trim() || '';
  }

  /** Lấy ghi chú yêu cầu riêng của khách hàng đối với chân đế / khung (nếu có) */
  getLegCustomNote(): string {
    const attr = this.request?.customizedAttributes?.find(a => {
      const g = (a.groupId || '').toLowerCase();
      const l = (a.label || '').toLowerCase();
      return (
        g.includes('leg') || g.includes('frame') || g.includes('base') ||
        l.includes('chân') || l.includes('khung') || l.includes('đế')
      );
    });
    return attr?.customNote?.trim() || '';
  }

  hasSurveyRecord(): boolean {
    const hasDimensions = this.hasProductDimensions() ? !!(this.surveyLength > 0 || this.surveyWidth > 0 || this.surveyHeight > 0) : false;
    const hasColor = this.hasColorAttribute() ? !!(this.surveyColorName && this.surveyColorName.trim()) : false;
    const hasMaterial = this.hasMaterialAttribute() ? !!(this.surveyMaterial && this.surveyMaterial.trim()) : false;
    const hasLeg = this.hasLegAttribute() ? !!(this.surveyLegMaterial && this.surveyLegMaterial.trim()) : false;
    const hasNote = !!(this.surveyNoteText && this.surveyNoteText.trim());
    const hasFile = !!this.surveyUploadedFile;
    return hasDimensions || hasColor || hasMaterial || hasLeg || hasNote || hasFile;
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

  saveSurveyRecord(): void {
    if (!this.request) return;

    this.request.surveyNotes = this.surveyNoteText;
    if (this.hasProductDimensions()) {
      if (this.surveyLength) this.request.length = Number(this.surveyLength);
      if (this.surveyWidth) this.request.width = Number(this.surveyWidth);
      if (this.surveyHeight) this.request.height = Number(this.surveyHeight);
    } else {
      delete this.request.length;
      delete this.request.width;
      delete this.request.height;
    }
    if (this.surveyColorName) this.request.colorName = this.surveyColorName;
    if (this.surveyColorHex) this.request.colorHex = this.surveyColorHex;
    this.request.colorImage = this.surveyColorImage || this.request.colorImage;
    if (this.surveyMaterial) this.request.material = this.surveyMaterial;
    if (this.hasLegAttribute() && this.surveyLegMaterial) {
      this.request.legMaterial = this.surveyLegMaterial;
    } else if (!this.hasLegAttribute()) {
      delete this.request.legMaterial;
    }

    // Đồng bộ ngược lại các giá trị chốt vào customizedAttributes của request
    if (this.request.customizedAttributes && this.request.customizedAttributes.length > 0) {
      this.request.customizedAttributes.forEach(attr => {
        const g = (attr.groupId || '').toLowerCase();
        const l = (attr.label || '').toLowerCase();
        if (g.includes('color') || l.includes('màu') || !!attr.hexColor) {
          if (this.surveyColorName) {
            attr.selectedOptionName = this.surveyColorName;
            attr.hexColor = this.surveyColorHex;
            attr.isChanged = true;
          }
        } else if (g.includes('material') || g.includes('upholstery') || g.includes('fabric') || g.includes('tabletop') || l.includes('chất liệu') || l.includes('vải') || l.includes('da') || l.includes('bọc') || l.includes('mặt')) {
          if (this.surveyMaterial) {
            attr.selectedOptionName = this.surveyMaterial;
            attr.isChanged = true;
          }
        } else if (g.includes('leg') || g.includes('frame') || g.includes('base') || l.includes('chân') || l.includes('khung') || l.includes('đế')) {
          if (this.surveyLegMaterial) {
            attr.selectedOptionName = this.surveyLegMaterial;
            attr.isChanged = true;
          }
        }
      });
    }

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
      surveyAttachment: this.request.surveyAttachment,
      length: this.request.length,
      width: this.request.width,
      height: this.request.height,
      colorName: this.request.colorName,
      colorHex: this.request.colorHex,
      colorImage: this.request.colorImage,
      material: this.request.material,
      legMaterial: this.request.legMaterial
    });

    this.isSurveySaved = true;
    this.isSavedSurveyRecord = true;
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => {
      this.isSavedSurveyRecord = false;
      this.cdr.detectChanges();
    }, 1800);

    this.triggerToast(
      'Đã lưu kết quả đo đạc & thông số kỹ thuật',
      'Thông số kích thước, màu sắc và vật liệu thực tế đã được cập nhật thành công vào hồ sơ đơn hàng.',
      'success'
    );
    this.cdr.detectChanges();
  }

  /** Hoàn thiện khảo sát đo đạc ở Bước 2 -> Lưu kết quả và chuyển thẳng sang Bước 3 (Báo giá & 3D), KHÔNG hiện popup */
  completeSurveyRecord(): void {
    if (!this.request) return;
    if (!this.canCompleteSurvey()) {
      if (!this.isSurveySaved) {
        this.triggerToast(
          'Chưa lưu kết quả khảo sát',
          'Vui lòng nhấn "Lưu kết quả đo đạc & thông số" trước khi hoàn thiện khảo sát.',
          'error'
        );
      } else {
        this.triggerToast(
          'Chưa có dữ liệu khảo sát',
          'Vui lòng nhập thông số kích thước, màu sắc hoặc ghi chú đo đạc trước khi hoàn tất.',
          'error'
        );
      }
      return;
    }

    // Tự động lưu thông số đo đạc & quy cách kỹ thuật chốt
    this.request.surveyNotes = this.surveyNoteText.trim();
    if (this.hasProductDimensions()) {
      if (this.surveyLength) this.request.length = Number(this.surveyLength);
      if (this.surveyWidth) this.request.width = Number(this.surveyWidth);
      if (this.surveyHeight) this.request.height = Number(this.surveyHeight);
    } else {
      delete this.request.length;
      delete this.request.width;
      delete this.request.height;
    }
    if (this.surveyColorName) this.request.colorName = this.surveyColorName;
    if (this.surveyColorHex) this.request.colorHex = this.surveyColorHex;
    this.request.colorImage = this.surveyColorImage || this.request.colorImage;
    if (this.surveyMaterial) this.request.material = this.surveyMaterial;
    if (this.hasLegAttribute() && this.surveyLegMaterial) {
      this.request.legMaterial = this.surveyLegMaterial;
    } else if (!this.hasLegAttribute()) {
      delete this.request.legMaterial;
    }

    // Đồng bộ ngược lại các giá trị chốt vào customizedAttributes của request
    if (this.request.customizedAttributes && this.request.customizedAttributes.length > 0) {
      this.request.customizedAttributes.forEach(attr => {
        const g = (attr.groupId || '').toLowerCase();
        const l = (attr.label || '').toLowerCase();
        if (g.includes('color') || l.includes('màu') || !!attr.hexColor) {
          if (this.surveyColorName) {
            attr.selectedOptionName = this.surveyColorName;
            attr.hexColor = this.surveyColorHex;
            attr.isChanged = true;
          }
        } else if (g.includes('material') || g.includes('upholstery') || g.includes('fabric') || g.includes('tabletop') || l.includes('chất liệu') || l.includes('vải') || l.includes('da') || l.includes('bọc') || l.includes('mặt')) {
          if (this.surveyMaterial) {
            attr.selectedOptionName = this.surveyMaterial;
            attr.isChanged = true;
          }
        } else if (g.includes('leg') || g.includes('frame') || g.includes('base') || l.includes('chân') || l.includes('khung') || l.includes('đế')) {
          if (this.surveyLegMaterial) {
            attr.selectedOptionName = this.surveyLegMaterial;
            attr.isChanged = true;
          }
        }
      });
    }

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
      surveyAttachment: this.request.surveyAttachment,
      length: this.request.length,
      width: this.request.width,
      height: this.request.height,
      colorName: this.request.colorName,
      colorHex: this.request.colorHex,
      colorImage: this.request.colorImage,
      material: this.request.material,
      legMaterial: this.request.legMaterial
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
    staffName: 'KTS. Lê Nam',
    surveyDate: '',
    surveyNotes: 'Đã khảo sát đo đạc hiện trạng thực tế, mặt bằng phẳng, hướng đón ánh sáng tốt, sẵn sàng lên bản vẽ 3D.'
  };

  // Step 3: Tác nghiệp Báo giá & Phối cảnh 3D
  quote3dInputMode: 'FILE' | 'URL' = 'FILE';
  quoteUploadedFiles: Array<{
    name: string;
    size: string;
    url: string;
    type?: string;
    isCover?: boolean;
  }> = [];

  get quoteUploadedFile(): { name: string; size: string; url: string; type?: string; isCover?: boolean } | null {
    if (!this.quoteUploadedFiles || this.quoteUploadedFiles.length === 0) return null;
    return this.quoteUploadedFiles.find(f => f.isCover) || this.quoteUploadedFiles[0];
  }

  set quoteUploadedFile(val: { name: string; size: string; url: string; type?: string; isCover?: boolean } | null) {
    if (!val) {
      this.quoteUploadedFiles = [];
    } else {
      this.quoteUploadedFiles = [{ ...val, isCover: true }];
    }
  }

  isSavedQuoteRecord: boolean = false;
  private savedQuoteTimer: any = null;

  isQuoteFileCreated: boolean = false;
  confirmedQuotePrice: number = 0;
  confirmedDepositAmount: number = 0;
  quoteCreatedAt: Date | null = null;

  quoteForm = {
    quotedPrice: 0,
    depositPercent: 30,
    depositAmount: 0,
    drawing3dUrl: '',
    notes: '',
    staffName: 'KTS. Lê Nam'
  };

  companyInfo = {
    brandName: 'DCOR',
    brandSub: 'LUXURY BESPOKE INTERIOR & LIVING',
    address: 'Showroom & Atelier: 669 QL1A, P. Linh Trung, TP. Thủ Đức, TP. HCM',
    hotline: '1900 8888',
    email: 'dcorfurniture406@gmail.com',
    website: 'www.dcor.vn'
  };

  setQuote3dMode(mode: 'FILE' | 'URL'): void {
    this.quote3dInputMode = mode;
  }

  onQuote3dFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      let loadedCount = 0;
      files.forEach((file) => {
        const sizeStr = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        const reader = new FileReader();
        reader.onload = (e) => {
          const isFirst = this.quoteUploadedFiles.length === 0;
          this.quoteUploadedFiles.push({
            name: file.name,
            size: sizeStr,
            url: e.target?.result as string,
            type: file.type,
            isCover: isFirst
          });
          loadedCount++;
          if (loadedCount === files.length) {
            this.cdr.detectChanges();
          }
        };
        reader.readAsDataURL(file);
      });
      input.value = '';
    }
  }

  removeQuote3dFile(index?: number): void {
    if (index !== undefined && index >= 0 && index < this.quoteUploadedFiles.length) {
      const removed = this.quoteUploadedFiles.splice(index, 1)[0];
      if (removed.isCover && this.quoteUploadedFiles.length > 0) {
        this.quoteUploadedFiles[0].isCover = true;
      }
    } else {
      this.quoteUploadedFiles = [];
    }
    this.cdr.detectChanges();
  }

  setQuoteCoverImage(index: number): void {
    if (index >= 0 && index < this.quoteUploadedFiles.length) {
      this.quoteUploadedFiles.forEach((f, i) => {
        f.isCover = i === index;
      });
      this.cdr.detectChanges();
    }
  }

  formatNumberWithDots(val: number | string | null | undefined): string {
    if (val === null || val === undefined || val === '' || val === 0) return '';
    const digits = String(val).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  onPriceBeforeInput(event: any): void {
    const data = event.data;
    if (data && !/^\d+$/.test(data)) {
      event.preventDefault();
    }
  }

  onPriceKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'Enter', 'Delete', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) {
      if (event.key === 'Backspace') {
        const target = event.target as HTMLInputElement;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        if (start !== null && start === end && start > 0 && target.value[start - 1] === '.') {
          event.preventDefault();
          const raw = target.value;
          const newRaw = raw.slice(0, start - 2) + raw.slice(start);
          const digits = newRaw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
          const formatted = this.formatNumberWithDots(digits);
          target.value = formatted;
          const newPos = Math.max(0, start - 2);
          target.setSelectionRange(newPos, newPos);
          this.quoteForm.quotedPrice = digits ? parseInt(digits, 10) : 0;
          this.updateQuoteDeposit();
        }
      }
      return;
    }
    // Chặn mọi ký tự không phải chữ số 0-9: chữ cái, dấu chấm, phẩy, âm, e/E...
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPricePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedText.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const target = event.target as HTMLInputElement;
    const formatted = this.formatNumberWithDots(digitsOnly);
    target.value = formatted;
    this.quoteForm.quotedPrice = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    this.updateQuoteDeposit();
  }

  onPriceInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const rawVal = target.value || '';
    const selectionStart = target.selectionStart || 0;
    const digitsBeforeCursor = rawVal.slice(0, selectionStart).replace(/\D/g, '').length;
    const digits = rawVal.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

    if (!digits) {
      target.value = '';
      this.quoteForm.quotedPrice = 0;
      this.updateQuoteDeposit();
      return;
    }

    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    target.value = formatted;

    // Giữ vị trí con trỏ thông minh khi tự động chèn dấu chấm
    let newCursorPos = 0;
    let countedDigits = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        countedDigits++;
      }
      if (countedDigits === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
    if (digitsBeforeCursor === 0) {
      newCursorPos = 0;
    }
    target.setSelectionRange(newCursorPos, newCursorPos);

    this.quoteForm.quotedPrice = parseInt(digits, 10);
    this.updateQuoteDeposit();
  }

  updateQuoteDeposit(): void {
    const price = Number(this.quoteForm.quotedPrice) || 0;
    this.quoteForm.depositAmount = Math.round(price * (this.quoteForm.depositPercent / 100));
  }

  hasAnyQuoteSpecs(): boolean {
    if (!this.request) return false;
    const hasDim = this.hasProductDimensions() && !!(this.request.length || this.request.width || this.request.height);
    const hasMat = this.hasMaterialAttribute() && !!this.request.material;
    const hasColor = this.hasColorAttribute() && !!this.request.colorName;
    const hasLeg = this.hasLegAttribute() && !!this.request.legMaterial;
    const hasOther = this.getOtherCustomAttributes().length > 0;
    const hasNotes = !!(this.quoteForm.notes && this.quoteForm.notes.trim().length > 0);
    const hasSurvey = !!(this.request.surveyNotes && this.request.surveyNotes.trim().length > 0);
    return hasDim || hasMat || hasColor || hasLeg || hasOther || hasNotes || hasSurvey;
  }

  formatLink(url: string | null | undefined): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*?:/.test(trimmed)) {
      return trimmed;
    }
    return 'https://' + trimmed;
  }

  isPriceOutdated(): boolean {
    if (!this.isQuoteFileCreated) return false;
    const currentPrice = Number(this.quoteForm.quotedPrice) || 0;
    return currentPrice !== this.confirmedQuotePrice;
  }

  createQuoteFile(): void {
    const price = Number(this.quoteForm.quotedPrice);
    if (!price || price <= 0) {
      this.triggerToast('Chưa nhập giá', 'Vui lòng nhập đơn giá dự toán hợp lệ trước khi tạo file báo giá.', 'error');
      return;
    }
    if (!this.quoteUploadedFile) {
      this.triggerToast('Thiếu ảnh phối cảnh 3D', 'Bắt buộc tải lên tệp hình ảnh phối cảnh 3D trước khi tạo file báo giá.', 'error');
      return;
    }

    this.isQuoteFileCreated = true;
    this.confirmedQuotePrice = price;
    this.confirmedDepositAmount = this.quoteForm.depositAmount || Math.round(price * 0.3);
    this.quoteCreatedAt = new Date();

    if (this.request) {
      this.request.quotedPrice = price;
      this.request.quotedDeposit = this.confirmedDepositAmount;
      this.request.quotedAt = this.quoteCreatedAt.toISOString();

      // Lưu vĩnh viễn dữ liệu báo giá vào hệ thống
      this.customRequestService.saveQuoteDraft(this.request.id, {
        quotedPrice: price,
        quotedDeposit: this.confirmedDepositAmount,
        notes: this.quoteForm.notes,
        drawing3dUrl: this.quoteUploadedFile?.url || this.quoteForm.drawing3dUrl,
        staffName: this.quoteForm.staffName
      });
    }

    this.triggerToast(
      'Tạo file Báo Giá thành công!',
      `Phiếu báo giá BG-${this.request?.code || ''} trị giá ${this.formatVND(price)} đã được tạo và lưu vào hồ sơ đơn hàng.`,
      'success'
    );
    this.cdr.detectChanges();
  }

  hasQuoteRecord(): boolean {
    if (!this.request) return false;
    return Number(this.quoteForm.quotedPrice) > 0 && !!this.quoteUploadedFile;
  }

  saveQuoteRecord(): void {
    if (!this.request) return;
    const price = Number(this.quoteForm.quotedPrice) || 0;
    const deposit = Number(this.quoteForm.depositAmount) || Math.round(price * 0.3);
    const drawingUrl = this.quoteUploadedFile?.url || this.quoteForm.drawing3dUrl || '';
    const drawingUrls = this.quoteUploadedFiles.map(f => f.url).filter(Boolean);

    this.customRequestService.saveQuoteDraft(this.request.id, {
      quotedPrice: price,
      quotedDeposit: deposit,
      notes: this.quoteForm.notes,
      drawing3dUrl: drawingUrl,
      drawing3dUrls: drawingUrls.length > 0 ? drawingUrls : (drawingUrl ? [drawingUrl] : []),
      staffName: this.quoteForm.staffName
    });

    this.isSavedQuoteRecord = true;
    if (this.savedQuoteTimer) clearTimeout(this.savedQuoteTimer);
    this.savedQuoteTimer = setTimeout(() => {
      this.isSavedQuoteRecord = false;
      this.cdr.detectChanges();
    }, 3000);
    this.triggerToast('Đã lưu kết quả dự toán', 'Thông số giá và ghi chú đã được lưu vĩnh viễn vào hồ sơ may đo.', 'success');
  }

  completeQuoteStep(): void {
    if (!this.request) return;
    if (!this.quoteForm.quotedPrice || Number(this.quoteForm.quotedPrice) <= 0) {
      this.triggerToast(
        'Chưa nhập đơn giá dự toán',
        'Vui lòng nhập đơn giá dự toán trước khi gửi báo giá cho khách.',
        'error'
      );
      return;
    }

    if (!this.quoteUploadedFile) {
      this.triggerToast(
        'Thiếu ảnh phối cảnh 3D',
        'Bắt buộc tải lên tệp hình ảnh phối cảnh 3D trước khi gửi báo giá cho khách.',
        'error'
      );
      return;
    }

    if (!this.isQuoteFileCreated || this.isPriceOutdated()) {
      this.createQuoteFile();
    }

    const drawingUrl = this.quoteUploadedFile?.url || this.quoteForm.drawing3dUrl || '';
    const drawingUrls = this.quoteUploadedFiles.map(f => f.url).filter(Boolean);
    this.customRequestService.sendQuote(this.request.id, {
      quotedPrice: Number(this.quoteForm.quotedPrice),
      quotedDeposit: Number(this.quoteForm.depositAmount) || Math.round(Number(this.quoteForm.quotedPrice) * 0.3),
      drawing3dUrl: drawingUrl,
      drawing3dUrls: drawingUrls.length > 0 ? drawingUrls : (drawingUrl ? [drawingUrl] : []),
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
      `Dự toán ${new Intl.NumberFormat('vi-VN').format(this.quoteForm.quotedPrice)} đ đã được gửi cho khách. Hồ sơ đang ở trạng thái: Đang đợi khách hàng duyệt báo giá & 3D.`,
      'success'
    );
  }

  adminApproveQuoteOnBehalf(): void {
    if (!this.request) return;
    const staff = this.adminAuthService.currentUser?.fullName 
      ? `KTS. ${this.adminAuthService.currentUser.fullName}` 
      : (this.request.assignedStaff || 'KTS DCor');
    this.customRequestService.approveQuote(this.request.id, `${this.request.customerName} (xác nhận qua ${staff})`);
    this.loadRequest();
    this.triggerToast(
      'Duyệt báo giá thành công',
      'Đã xác nhận khách hàng đồng ý báo giá & bản vẽ 3D. Hồ sơ đã chuyển sang bước Ký Hợp Đồng.',
      'success'
    );
  }

  isQuotePreviewModalOpen: boolean = false;

  openQuotePreviewModal(): void {
    if (!this.request) return;
    if (!this.quoteForm.quotedPrice || Number(this.quoteForm.quotedPrice) <= 0) {
      this.triggerToast(
        'Chưa nhập đơn giá dự toán',
        'Vui lòng nhập đơn giá dự toán trước khi xem trước.',
        'error'
      );
      return;
    }
    if (!this.isQuoteFileCreated || this.isPriceOutdated()) {
      this.createQuoteFile();
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

  // --- MODAL TẠO SẢN PHẨM / BIẾN THỂ MAY ĐO (BƯỚC 6) ---
  isVariantModalOpen: boolean = false;
  variantForm = {
    variantName: '',
    images: [] as string[],
    price: 0,
    stock: 1,
    status: 'private' as 'private' | 'public',
    sku: '',
    attributes: [] as { label: string; value: string; hexColor?: string; image?: string }[]
  };

  // --- MODAL THÔNG TIN ĐƠN HÀNG (BƯỚC 6 - LÊN ĐƠN HÀNG) ---
  isCreateOrderModalOpen: boolean = false;
  orderCreateForm = {
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    shippingAddress: '',
    productName: '',
    sku: '',
    variantSpecs: '',
    imageUrl: '',
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    depositPaid: 0,
    remainingAmount: 0,
    paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'COD' | 'VNPAY',
    deliveryNotes: ''
  };

  openCreateOrderModal(): void {
    if (!this.request) return;
    const qty = this.request.customVariant?.stock || 1;
    const price = this.request.customVariant?.price || this.request.quotedPrice || 35000000;
    const total = qty * price;
    const deposit = this.request.quotedDeposit || Math.round(total * 0.3);
    const remaining = Math.max(0, total - deposit);
    const specs = this.request.customVariant?.name || `${this.request.length || 0}x${this.request.width || 0}x${this.request.height || 0} cm | ${this.request.material || 'Da bò Ý'} | ${this.request.colorName || 'Màu chỉ định'}`;
    const img = (this.request.customVariant?.images && this.request.customVariant.images[0]) || this.request.productImage || '/assets/img/furniture-placeholder.svg';

    this.orderCreateForm = {
      recipientName: this.request.customerName || '',
      recipientPhone: this.request.customerPhone || '',
      recipientEmail: this.request.customerEmail || '',
      shippingAddress: this.request.customerAddress || 'Showroom DCOR Studio',
      productName: this.request.customVariant?.name || `[May đo] ${this.request.productName}`,
      sku: this.request.customVariant?.sku || `VAR-${this.request.code}`,
      variantSpecs: specs,
      imageUrl: img,
      quantity: qty,
      unitPrice: price,
      totalAmount: total,
      depositPaid: deposit,
      remainingAmount: remaining,
      paymentMethod: 'BANK_TRANSFER',
      deliveryNotes: this.request.notes || 'Hàng may đo cao cấp xưởng DCOR, kiểm tra đóng gói cẩn thận.'
    };
    this.isCreateOrderModalOpen = true;
  }

  closeCreateOrderModal(): void {
    this.isCreateOrderModalOpen = false;
  }

  recalculateOrderForm(): void {
    const qty = Math.max(1, Number(this.orderCreateForm.quantity) || 1);
    const price = Math.max(0, Number(this.orderCreateForm.unitPrice) || 0);
    this.orderCreateForm.totalAmount = qty * price;
    if (this.orderCreateForm.depositPaid > this.orderCreateForm.totalAmount) {
      this.orderCreateForm.depositPaid = this.orderCreateForm.totalAmount;
    }
    this.orderCreateForm.remainingAmount = Math.max(0, this.orderCreateForm.totalAmount - (this.orderCreateForm.depositPaid || 0));
  }

  confirmCreateOrderFromModal(): void {
    if (!this.request) return;
    if (!this.orderCreateForm.recipientName || !this.orderCreateForm.recipientName.trim()) {
      this.triggerToast('Thiếu thông tin người nhận', 'Vui lòng nhập họ tên người nhận hàng.', 'error');
      return;
    }
    if (!this.orderCreateForm.recipientPhone || !this.orderCreateForm.recipientPhone.trim()) {
      this.triggerToast('Thiếu số điện thoại', 'Vui lòng nhập số điện thoại người nhận.', 'error');
      return;
    }

    const currentStaff = this.adminAuthService.currentUser?.fullName 
      ? `KTS. ${this.adminAuthService.currentUser.fullName}` 
      : (this.request.assignedStaff || 'Quản đốc xưởng DCOR');

    // Tự động đảm bảo QC passed khi lên đơn hàng chính thức
    this.customRequestService.passQcInspection(
      this.request.id,
      { dimensionAccuracy: true, surfaceFinish: true, cushionStitching: true, packagingProtection: true },
      currentStaff,
      'Đạt chuẩn nghiệm thu 4 tiêu chí xuất xưởng.'
    );

    // CHÍNH THỨC TẠO ĐƠN HÀNG VỚI DỮ LIỆU ĐÃ CHỈNH SỬA TỪ POPUP
    const result = this.customRequestService.createOfficialOrderFromProduction(
      this.request.id,
      currentStaff,
      this.orderCreateForm
    );

    if (result) {
      this.closeCreateOrderModal();
      this.loadRequest();
      this.triggerToast(
        'Lên Đơn hàng thành công!',
        `Hệ thống đã chính thức tạo Đơn hàng #${result.generatedOrderNumber} trong tab Đơn hàng để điều phối giao hàng & thu 70% còn lại.`,
        'success',
        5000
      );
    }
  }

  openCreateVariantModal(): void {
    if (!this.request) return;

    // Tự động thu thập hình ảnh từ phối cảnh 3D và vật liệu đã upload
    const images: string[] = [];
    if (this.request.drawing3dUrls && this.request.drawing3dUrls.length > 0) {
      this.request.drawing3dUrls.forEach(u => {
        if (u && !images.includes(u)) images.push(u);
      });
    } else if (this.request.drawing3dUrl) {
      images.push(this.request.drawing3dUrl);
    }
    if (this.quoteUploadedFiles && this.quoteUploadedFiles.length > 0) {
      this.quoteUploadedFiles.forEach(f => {
        if (f.url && !images.includes(f.url)) images.push(f.url);
      });
    }
    if (this.request.colorImage && !images.includes(this.request.colorImage)) {
      images.push(this.request.colorImage);
    }
    if (this.surveyColorImage && !images.includes(this.surveyColorImage)) {
      images.push(this.surveyColorImage);
    }
    if (this.request.surveyAttachment?.previewUrl && !images.includes(this.request.surveyAttachment.previewUrl)) {
      images.push(this.request.surveyAttachment.previewUrl);
    }
    if (this.request.attachments && Array.isArray(this.request.attachments)) {
      this.request.attachments.forEach(att => {
        if (att.previewUrl && !images.includes(att.previewUrl)) images.push(att.previewUrl);
      });
    }
    if (this.request.referenceImages && Array.isArray(this.request.referenceImages)) {
      this.request.referenceImages.forEach(img => {
        if (img && !images.includes(img)) images.push(img);
      });
    }
    if (images.length === 0 && this.request.productImage) {
      images.push(this.request.productImage);
    }

    // Thu thập thuộc tính chốt ở bước Khảo sát - Đo thực tế & tư vấn
    // Bám sát nghiêm ngặt danh mục thuộc tính được cho phép của sản phẩm
    const attributes: { label: string; value: string; hexColor?: string; image?: string }[] = [];
    const matImg = this.surveyColorImage || this.request.colorImage || '/assets/img/about_material_core.jpg';

    // 1. Kích thước (nếu sản phẩm có cấu hình kích thước)
    const l = this.request.length || this.surveyLength;
    const w = this.request.width || this.surveyWidth;
    const h = this.request.height || this.surveyHeight;
    if (this.request.hasDimensions !== false && l && w && h) {
      attributes.push({ label: 'Kích thước', value: `${l} × ${w} × ${h} cm` });
    }

    // 2. Màu sắc (kèm màu hex swatch)
    const colorVal = this.request.colorName || this.surveyColorName;
    if (colorVal) {
      attributes.push({
        label: 'Màu sắc',
        value: colorVal,
        hexColor: this.request.colorHex || this.surveyColorHex
      });
    }

    // 3. Chất liệu (kèm ảnh mẫu tròn theo yêu cầu)
    const matVal = this.request.material || this.surveyMaterial;
    if (matVal && this.hasMaterialAttribute()) {
      attributes.push({ 
        label: 'Chất liệu', 
        value: matVal, 
        image: matImg 
      });
    }

    // 4. Khung / Chân
    const legVal = this.request.legMaterial || this.surveyLegMaterial;
    if (legVal && this.hasLegAttribute()) {
      attributes.push({ label: 'Khung / Chân', value: legVal });
    }

    // 5. Các thuộc tính tùy biến được định nghĩa sẵn của sản phẩm (tuyệt đối không tạo thuộc tính lạ khác)
    if (this.request.customizedAttributes && Array.isArray(this.request.customizedAttributes)) {
      this.request.customizedAttributes.forEach(attr => {
        const val = attr.selectedOptionName || attr.originalValue;
        if (val && !attributes.some(a => a.label.toLowerCase() === attr.label.toLowerCase())) {
          const isMat = (attr.groupId && (attr.groupId.toLowerCase().includes('material') || attr.groupId.toLowerCase().includes('upholstery') || attr.groupId.toLowerCase().includes('fabric'))) ||
                        (attr.label && (attr.label.toLowerCase().includes('chất liệu') || attr.label.toLowerCase().includes('vải') || attr.label.toLowerCase().includes('da')));
          attributes.push({ 
            label: attr.label, 
            value: val, 
            hexColor: attr.hexColor,
            image: isMat ? matImg : undefined 
          });
        }
      });
    }

    const orderQty = (this.request as any).quantity || 1;

    if (this.request.customVariant) {
      const savedAttrs = (this.request.customVariant.attributes || []).map((a: any) => {
        const isMat = a.label && (a.label.toLowerCase().includes('chất liệu') || a.label.toLowerCase().includes('vải') || a.label.toLowerCase().includes('da'));
        return {
          ...a,
          image: a.image || (isMat ? matImg : undefined)
        };
      });
      this.variantForm = {
        variantName: this.request.customVariant.name,
        images: this.request.customVariant.images?.length > 0 ? [...this.request.customVariant.images] : images,
        price: this.request.customVariant.price || this.request.quotedPrice || 0,
        stock: this.request.customVariant.stock || orderQty,
        status: 'private',
        sku: this.request.customVariant.sku || `VAR-${this.request.code}`,
        attributes: savedAttrs.length > 0 ? savedAttrs : attributes
      };
    } else {
      this.variantForm = {
        variantName: '',
        images: images,
        price: this.request.quotedPrice || 0,
        stock: orderQty,
        status: 'private',
        sku: `VAR-${this.request.code}`,
        attributes: attributes
      };
    }

    this.isVariantModalOpen = true;
  }

  closeVariantModal(): void {
    this.isVariantModalOpen = false;
  }

  removeVariantImage(index: number): void {
    if (index >= 0 && index < this.variantForm.images.length) {
      this.variantForm.images.splice(index, 1);
    }
  }

  onVariantImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            this.variantForm.images.push(e.target.result as string);
            this.cdr.detectChanges();
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  saveProductVariant(): void {
    if (!this.request) return;
    if (!this.variantForm.variantName || !this.variantForm.variantName.trim()) {
      this.triggerToast('Chưa nhập tên biến thể', 'Vui lòng đặt tên cho biến thể may đo trước khi lưu.', 'error');
      return;
    }

    const isEditMode = !!this.request.customVariant;
    const existingVariantId = (this.request.customVariant as any)?.variantId || 
      (this.request.customVariant?.id && !String(this.request.customVariant.id).startsWith('var_') ? this.request.customVariant.id : undefined);

    const variantData = {
      id: existingVariantId || this.request.customVariant?.id || `var_${Date.now()}`,
      variantId: existingVariantId,
      name: this.variantForm.variantName.trim(),
      sku: this.variantForm.sku,
      price: this.variantForm.price,
      stock: this.variantForm.stock,
      status: 'private' as const,
      isPrivate: true,
      images: [...this.variantForm.images],
      attributes: [...this.variantForm.attributes],
      createdAt: this.request.customVariant?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 1. Lưu tạm thời vào CustomRequestService (cache local)
    this.customRequestService.saveCustomVariant(this.request.id, variantData);
    this.request.customVariant = variantData;

    // 2. Gửi API lưu hoặc cập nhật trực tiếp vào danh sách Biến thể của Sản phẩm trong Database
    const targetProductId = this.request.productId || 'default';
    const payload = {
      variantId: existingVariantId,
      productId: this.request.productId,
      productName: this.request.productName,
      productSku: this.request.productSku,
      name: variantData.name,
      sku: variantData.sku,
      price: variantData.price,
      stock: variantData.stock,
      images: variantData.images,
      attributes: variantData.attributes,
      isPrivate: true,
      customRequestId: this.request.code
    };

    this.http.post<any>(`${environment.apiUrl}/admin/products/${targetProductId}/variants`, payload).subscribe({
      next: (res) => {
        console.log('[saveProductVariant] Đã đồng bộ biến thể vào sản phẩm DB:', res);
        const savedId = res.variant?.id || existingVariantId || variantData.id;
        const savedSku = res.variant?.sku || variantData.sku;
        const targetProdId = res.product?.id || this.request!.productId;

        const updatedData = {
          ...variantData,
          id: savedId,
          variantId: savedId,
          sku: savedSku,
          productId: targetProdId
        };

        this.request!.customVariant = updatedData;
        if (targetProdId && targetProdId !== this.request!.productId) {
          this.request!.productId = targetProdId;
        }
        this.customRequestService.saveCustomVariant(this.request!.id, updatedData);
        this.productService.clearCache();

        if (res.isUpdated || isEditMode) {
          this.triggerToast(
            'Cập nhật sản phẩm thành công',
            `Đã cập nhật thông tin biến thể "${updatedData.name}" của sản phẩm "${res.product?.name || this.request!.productName}".`,
            'success'
          );
        } else {
          this.triggerToast(
            'Tạo sản phẩm (Biến thể) thành công',
            `Đã tạo biến thể "${updatedData.name}" (Private) và thêm vào sản phẩm "${res.product?.name || this.request!.productName}" trong danh mục sản phẩm.`,
            'success'
          );
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('[saveProductVariant] Không thể đồng bộ qua API DB:', err);
        this.triggerToast(
          isEditMode ? 'Cập nhật biến thể thành công' : 'Lưu biến thể thành công',
          `Đã lưu biến thể "${variantData.name}" vào hồ sơ may đo #${this.request!.code}.`,
          'success'
        );
      }
    });

    this.isVariantModalOpen = false;
  }

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

  // 7 Chuỗi trạng thái chuẩn của quy trình may đo nội thất (đã rút gọn Hợp đồng thành 1 bước)
  readonly WORKFLOW_STEPS: { key: CustomRequestStatus; name: string; sub: string }[] = [
    { key: 'PENDING_REVIEW', name: 'Tiếp nhận', sub: 'Chờ KTS nhận việc' },
    { key: 'CONSULTING', name: 'Khảo sát', sub: 'Đo thực tế & tư vấn' },
    { key: 'QUOTED', name: 'Báo giá & 3D', sub: 'Phối cảnh 3D & giá' },
    { key: 'AWAITING_CONTRACT', name: 'Hợp đồng', sub: 'Chờ khách ký HĐ' },
    { key: 'AWAITING_PAYMENT', name: 'Cọc 30%', sub: 'Mã VietQR chờ duyệt' },
    { key: 'PROCESSING', name: 'Sản xuất', sub: 'Gia công xưởng' },
    { key: 'COMPLETED', name: 'Nghiệm thu', sub: 'Thu 70% & Bảo hành' }
  ];

  private subOrders?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customRequestService: CustomRequestService,
    private adminAuthService: AdminAuthService,
    private ordersService: OrdersService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private productService: ProductService
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

    this.subOrders = this.ordersService.orders$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.subOrders?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.savedTimer) clearTimeout(this.savedTimer);
  }

  loadRequest(): void {
    this.request = this.customRequestService.getRequestById(this.requestId);
    if (this.request) {
      this.isSurveySaved = false;
      if (this.request.assignedStaff) {
        this.request.assignedStaff = this.cleanStaffName(this.request.assignedStaff);
      }
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
    } else if (currentStatus === 'CONTRACT_SIGNED' || currentStatus === 'DEPOSIT_SUBMITTED') {
      this.activeViewingStep = 4; // Bước 5: Cọc 30%
    } else if (currentStatus === 'QC_PASSED') {
      this.activeViewingStep = 6; // Bước 7: Nghiệm thu & Bàn giao
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
    if (req.drawing3dUrl && !this.quoteUploadedFile) {
      this.quoteUploadedFile = {
        name: 'ban-ve-phoi-canh-3d.png',
        size: '2.5 MB',
        url: req.drawing3dUrl,
        type: 'image/png'
      };
    }

    if (price > 0) {
      this.isQuoteFileCreated = true;
      this.confirmedQuotePrice = price;
      this.confirmedDepositAmount = deposit;
      this.quoteCreatedAt = req.quotedAt ? new Date(req.quotedAt) : new Date();
    } else {
      this.isQuoteFileCreated = false;
      this.confirmedQuotePrice = 0;
      this.confirmedDepositAmount = 0;
      this.quoteCreatedAt = null;
    }
    this.contractForm.contractNumber = `HD-DCOR-2026/${req.code}`;
    this.deliveryForm.remainingAmount = price - deposit;
    this.deliveryForm.warrantyCode = req.warrantyCode || `BH-DCOR-${req.code.replace('CR-', '')}`;

    // Khởi tạo checklist kiểm định QC
    if (req.qcChecklist) {
      this.qcForm.dimensionAccuracy = !!req.qcChecklist.dimensionAccuracy;
      this.qcForm.surfaceFinish = !!req.qcChecklist.surfaceFinish;
      this.qcForm.cushionStitching = !!req.qcChecklist.cushionStitching;
      this.qcForm.packagingProtection = !!req.qcChecklist.packagingProtection;
    } else if (req.status === 'PROCESSING') {
      // Khi xưởng đang gia công chưa chốt bước: cho phép quản đốc/QC chủ động tick chọn từng tiêu chuẩn
      this.qcForm.dimensionAccuracy = false;
      this.qcForm.surfaceFinish = false;
      this.qcForm.cushionStitching = false;
      this.qcForm.packagingProtection = false;
    } else if (['QC_PASSED', 'COMPLETED'].includes(req.status)) {
      this.qcForm.dimensionAccuracy = true;
      this.qcForm.surfaceFinish = true;
      this.qcForm.cushionStitching = true;
      this.qcForm.packagingProtection = true;
    }

    // Khởi tạo ghi chú / file khảo sát đo đạc thực tế của KTS
    this.surveyNoteText = req.surveyNotes || '';
    this.surveyLength = req.length || 0;
    this.surveyWidth = req.width || 0;
    this.surveyHeight = req.height || 0;

    const colorAttr = req.customizedAttributes?.find(a => 
      (a.groupId && a.groupId.toLowerCase().includes('color')) ||
      (a.label && a.label.toLowerCase().includes('màu')) ||
      !!a.hexColor
    );
    this.surveyColorName = req.colorName || colorAttr?.selectedOptionName || '';
    this.surveyColorHex = req.colorHex || colorAttr?.hexColor || '#8B4513';
    this.surveyColorImage = req.colorImage || '';

    const matAttr = req.customizedAttributes?.find(a => 
      (a.groupId && (a.groupId.toLowerCase().includes('material') || a.groupId.toLowerCase().includes('upholstery') || a.groupId.toLowerCase().includes('fabric') || a.groupId.toLowerCase().includes('tabletop'))) ||
      (a.label && (a.label.toLowerCase().includes('chất liệu') || a.label.toLowerCase().includes('vải') || a.label.toLowerCase().includes('da') || a.label.toLowerCase().includes('bọc') || a.label.toLowerCase().includes('mặt')))
    );
    this.surveyMaterial = req.material || matAttr?.selectedOptionName || '';

    const legAttr = req.customizedAttributes?.find(a => 
      (a.groupId && (a.groupId.toLowerCase().includes('leg') || a.groupId.toLowerCase().includes('frame') || a.groupId.toLowerCase().includes('base'))) ||
      (a.label && (a.label.toLowerCase().includes('chân') || a.label.toLowerCase().includes('khung') || a.label.toLowerCase().includes('đế')))
    );
    this.surveyLegMaterial = req.legMaterial || legAttr?.selectedOptionName || '';
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
    if (status === 'CONTRACT_SIGNED' || status === 'DEPOSIT_SUBMITTED') return 4;
    if (status === 'QC_PASSED') return 6;
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
    if (modal === 'DELIVERY' && !this.isLinkedOrderDelivered()) {
      const order = this.getLinkedOrder();
      const statusLabel = this.getLinkedOrderStatusMeta().label;
      this.triggerToast(
        'Chưa thể quyết toán thu 70%',
        `Đơn hàng #${order?.orderNumber || this.request?.generatedOrderNumber || 'CUST'} hiện đang ở trạng thái "${statusLabel}". Vui lòng chờ bộ phận giao hàng xác nhận Đã giao (DELIVERED) trước khi thu tiền và kích hoạt bảo hành.`,
        'info',
        5000
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

  // Step 5: Xác nhận cọc 30% VietQR -> Bắn xưởng sản xuất (chưa lên đơn trong tab Đơn hàng)
  submitDepositPayment(): void {
    if (!this.request) return;
    this.customRequestService.confirmPaymentAndStartProduction(this.request.id, 'Kế Toán Trưởng DCOR');
    this.closeModal();
    this.loadRequest();
    this.triggerToast(
      'Xác nhận cọc 30% thành công!',
      `Đã phát Lệnh sản xuất xưởng #${this.request.workOrderCode}. Xưởng đã bắt đầu chế tác phôi theo bản vẽ.`,
      'success'
    );
  }

  // Step 6: Nghiệm thu QC 4 tiêu chí & Lên đơn hàng chính thức
  toggleQcItem(key: 'dimensionAccuracy' | 'surfaceFinish' | 'cushionStitching' | 'packagingProtection'): void {
    if (this.request?.status !== 'PROCESSING') return;
    this.qcForm[key] = !this.qcForm[key];
  }

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
    if (!this.request.customVariant) {
      this.triggerToast(
        'Chưa tạo sản phẩm biến thể',
        'Vui lòng nhấn "Tạo sản phẩm" để thiết lập biến thể may đo trước khi lên đơn hàng.',
        'error'
      );
      return;
    }
    this.customRequestService.passQcInspection(this.request.id, this.qcForm, this.qcForm.inspectorName, this.qcForm.notes);
    this.submitCreateOrderFromProduction();
  }

  // Bước 6: Xưởng sản xuất xong -> Nhấn "Lên đơn hàng" -> MỚI CHÍNH THỨC TẠO ĐƠN HÀNG TRONG TAB ĐƠN HÀNG!
  submitCreateOrderFromProduction(): void {
    if (!this.request) return;
    const currentStaff = this.adminAuthService.currentUser?.fullName 
      ? `KTS. ${this.adminAuthService.currentUser.fullName}` 
      : (this.request.assignedStaff || 'Quản đốc xưởng DCOR');

    const result = this.customRequestService.createOfficialOrderFromProduction(this.request.id, currentStaff);
    if (result) {
      if (this.activeModal === 'QC') {
        this.closeModal();
      }
      this.loadRequest();
      this.triggerToast(
        'Lên Đơn hàng thành công!',
        `Hệ thống đã chính thức tạo Đơn hàng #${result.generatedOrderNumber} trong tab Đơn hàng để điều phối giao hàng & thu 70% còn lại.`,
        'success',
        5000
      );
    }
  }

  // Trạng thái modal xem chi tiết biên lai cọc của khách
  isBillPreviewOpen: boolean = false;

  openBillPreview(): void {
    this.isBillPreviewOpen = true;
  }

  closeBillPreview(): void {
    this.isBillPreviewOpen = false;
  }

  // Trạng thái modal xem hợp đồng đã ký của khách
  isContractViewModalOpen: boolean = false;

  openContractViewModal(): void {
    this.isContractViewModalOpen = true;
  }

  closeContractViewModal(): void {
    this.isContractViewModalOpen = false;
  }

  isContractCardVisible(): boolean {
    if (!this.request) return false;
    return this.activeViewingStep >= 3 && this.getCurrentStepIndex() >= 3;
  }

  isDepositCardVisible(): boolean {
    if (!this.request) return false;
    return this.activeViewingStep >= 4 && this.getCurrentStepIndex() >= 4;
  }

  isProductionCardVisible(): boolean {
    if (!this.request) return false;
    return this.activeViewingStep >= 5 && this.getCurrentStepIndex() >= 5;
  }

  isDeliveryCardVisible(): boolean {
    if (!this.request) return false;
    return this.activeViewingStep >= 6 && this.getCurrentStepIndex() >= 6;
  }

  getLinkedOrder(): OrderV2 | undefined {
    if (!this.request) return undefined;
    if (this.request.generatedOrderNumber) {
      return this.ordersService.getOrderById(this.request.generatedOrderNumber);
    }
    if (this.request.code) {
      return this.ordersService.orders.find(o => 
        o.orderNumber?.includes(this.request!.code.replace('CR-', 'CUST-')) ||
        o.customRequestId === this.request!.code
      );
    }
    return undefined;
  }

  isLinkedOrderDelivered(): boolean {
    if (!this.request) return false;
    if (this.request.status === 'COMPLETED') return true;
    const order = this.getLinkedOrder();
    if (!order) return false;
    return order.status === 'DELIVERED' || order.status === 'COMPLETED';
  }

  getLinkedOrderStatusMeta(): { label: string; color: string; bgColor: string; borderColor: string } {
    const order = this.getLinkedOrder();
    if (!order) {
      return { 
        label: 'Chưa liên kết đơn', 
        color: '#6B7280', 
        bgColor: '#F3F4F6',
        borderColor: '#E5E7EB'
      };
    }
    switch (order.status) {
      case 'DELIVERED':
        return { label: 'Đã giao hàng (Chờ quyết toán)', color: '#059669', bgColor: '#D1FAE5', borderColor: '#A7F3D0' };
      case 'COMPLETED':
        return { label: 'Đã hoàn tất', color: '#10B981', bgColor: '#ECFDF5', borderColor: '#A7F3D0' };
      case 'SHIPPED':
        return { label: 'Đang giao hàng (Vận chuyển)', color: '#2563EB', bgColor: '#DBEAFE', borderColor: '#BFDBFE' };
      case 'READY_TO_SHIP':
        return { label: 'Sẵn sàng xuất kho', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FDE68A' };
      case 'PROCESSING':
        return { label: 'Đang chuẩn bị đóng gói', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FDE68A' };
      case 'CONFIRMED':
        return { label: 'Đã xác nhận đơn hàng', color: '#4F46E5', bgColor: '#EEF2FF', borderColor: '#C7D2FE' };
      case 'PENDING':
        return { label: 'Chờ xác nhận', color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#E5E7EB' };
      case 'CANCELLED':
        return { label: 'Đã hủy', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#FECACA' };
      default:
        return { label: String(order.status), color: '#4B5563', bgColor: '#F3F4F6', borderColor: '#E5E7EB' };
    }
  }

  // Step 7: Giao hàng, thu 70% & Kích hoạt bảo hành
  submitDeliveryWarranty(): void {
    if (!this.request) return;
    this.customRequestService.completeDeliveryAndWarranty(this.request.id, this.deliveryForm.staffName);
    
    // Cập nhật đơn hàng tương ứng sang COMPLETED & PAID trong OrdersService nếu cần
    if (this.request.generatedOrderNumber) {
      const order = this.ordersService.getOrderById(this.request.generatedOrderNumber);
      if (order && order.status !== 'COMPLETED') {
        this.ordersService.completeOrder(order.id, this.deliveryForm.staffName);
      }
    }

    this.closeModal();
    this.loadRequest();
    this.triggerToast(
      'Quyết toán 70% & Kích hoạt BH thành công',
      `Hồ sơ đã hoàn tất chu trình may đo & quyết toán 100%. Đã kích hoạt bảo hành chính hãng 5 năm #${this.request.warrantyCode}.`,
      'success',
      5000
    );
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

  cleanStaffName(name?: string): string {
    if (!name) return '';
    return name.replace(/\s*\([^)]*\)/g, '').trim();
  }

  formatVND(value?: number): string {
    if (value === undefined || value === null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  getExtractedBudgetRange(): string {
    if (!this.request) return '';
    if (this.request.budgetRange && this.request.budgetRange.trim()) {
      return this.request.budgetRange.trim();
    }
    if (this.request.estimatedBudget && String(this.request.estimatedBudget).trim()) {
      const raw = String(this.request.estimatedBudget).trim();
      const num = Number(raw.replace(/[^\d]/g, ''));
      if (!isNaN(num) && num > 0) {
        return this.formatVND(num);
      }
      return raw;
    }
    const notes = this.request.requirementDetails || this.request.notes || '';
    const match = notes.match(/Ngân sách dự kiến:\s*([^\n]+)/i);
    return match ? match[1].trim() : '';
  }

  getCleanedCustomerNotes(): string {
    if (!this.request) return '';
    const notes = this.request.requirementDetails || this.request.notes || '';
    return notes
      .split('\n')
      .filter((line: string) => !line.trim().toLowerCase().startsWith('ngân sách dự kiến:'))
      .join('\n')
      .trim();
  }

  copyToClipboard(text: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      this.triggerToast('Đã sao chép', `Đã sao chép "${text}" vào bộ nhớ tạm.`, 'info', 2000);
    }
  }
}
