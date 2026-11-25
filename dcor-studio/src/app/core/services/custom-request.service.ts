import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type CustomRequestStatus =
  | 'PENDING_REVIEW'
  | 'CONSULTING'
  | 'QUOTED'
  | 'AWAITING_CONTRACT'
  | 'CONTRACT_SIGNED'
  | 'AWAITING_PAYMENT'
  | 'DEPOSIT_SUBMITTED'
  | 'PROCESSING'
  | 'QC_PASSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CustomRequestTimeline {
  status: CustomRequestStatus;
  title: string;
  description: string;
  timestamp: string;
  performedBy: string;
}

export interface CustomAttributeItem {
  groupId?: string;
  label: string;
  originalValue: string;
  selectedOptionName: string;
  hexColor?: string;
  isChanged?: boolean;
  isOther?: boolean;
  selectedOptionId?: string;
  customNote?: string;
}

export interface CustomAttachmentItem {
  id?: string;
  name: string;
  size: string;
  type?: string;
  previewUrl: string;
}

export interface CustomRequest {
  id: string;
  code: string;
  // Khách hàng
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerId?: string;
  isPhoneVerified?: boolean;

  // Sản phẩm gốc tùy chỉnh
  productId?: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  categoryName?: string;
  basePrice?: number;

  // Kích thước từ form yêu cầu
  hasDimensions?: boolean; // Sản phẩm gốc có kích thước may đo 3 chiều hay không
  originalDimensions?: string;
  requestedDimensions?: string;
  customDimensionNote?: string;
  length?: number;     // Chiều dài (cm)
  width?: number;      // Chiều rộng / sâu (cm)
  height?: number;     // Chiều cao (cm)

  // Danh sách thuộc tính tùy biến chi tiết từ form
  customizedAttributes?: CustomAttributeItem[];
  colorName?: string;  // Tên màu (ví dụ: Nâu Cognac Ý, Kem Sand Luxury...)
  colorHex?: string;   // Mã màu hiển thị
  colorImage?: string; // Ảnh mẫu màu / tấm da / mẫu vải thực tế do KTS chụp
  material?: string;   // Chất liệu bề mặt (Da bò Ý Full Grain, Da Microfiber, Gỗ óc chó...)
  legMaterial?: string;// Chất liệu chân/khung

  // Ghi chú & Nhu cầu đặc biệt từ form
  notes?: string;               // Ghi chú của khách
  requirementDetails?: string;  // Mô tả chi tiết nhu cầu / Ghi chú về không gian

  // Ngân sách dự kiến & Kế hoạch từ Khách hàng
  budgetRange?: string;          // Khoảng giá chấp nhận trả (VD: "22.000.000 đ - 26.000.000 đ")
  estimatedBudget?: string;      // Số tiền ngân sách dự kiến chính xác (VD: "25.000.000")
  preferredSurveyTime?: string;  // Lịch hẹn/thời gian tiện khảo sát (VD: "Thứ 7 tuần này (09:00 - 11:30)")
  expectedDeliveryDate?: string; // Thời gian mong muốn hoàn thiện (VD: "Trong 15 - 20 ngày")
  roomSpace?: string;            // Không gian bố trí (VD: "Phòng khách chung cư 85m²")

  // Tệp tư liệu & Mẫu thiết kế tham khảo từ form
  attachments?: CustomAttachmentItem[];
  referenceImages?: string[]; // Ảnh đính kèm/phòng khách

  // Trạng thái hệ thống (Enum)
  status: CustomRequestStatus;

  // Dữ liệu nghiệp vụ Admin
  assignedStaff?: string;
  adminNotes?: string;
  surveyNotes?: string;      // Ghi chú khảo sát đo đạc thực tế
  surveyAttachment?: CustomAttachmentItem; // Tệp ghi chú / hồ sơ đo đạc đính kèm của KTS
  surveyDate?: string;       // Ngày giờ khảo sát
  drawing3dUrl?: string;     // Link bản vẽ 3D
  drawing3dUrls?: string[];    // Danh sách ảnh bản vẽ / phối cảnh 3D
  quotedPrice?: number;      // Giá báo giá
  quotedDeposit?: number;    // Tiền đặt cọc cần thanh toán (30%)
  quotedAt?: string;
  estimatedProductionDays?: number; // Số ngày sản xuất dự kiến
  contractScanUrl?: string;  // Ảnh scan hợp đồng ký
  contractSignedAt?: string;
  depositProofImage?: string; // Ảnh biên lai / bill chuyển khoản cọc của khách hàng
  depositProofNote?: string;  // Ghi chú chuyển khoản của khách hàng
  cancelReason?: string;
  cancelledAt?: string;

  // Nghiệm thu QC & Bàn giao bảo hành
  qcPassedAt?: string;
  qcInspector?: string;
  qcChecklist?: {
    dimensionAccuracy: boolean;
    surfaceFinish: boolean;
    cushionStitching: boolean;
    packagingProtection: boolean;
  };
  warrantyCode?: string;
  warrantyMonths?: number;
  warrantyFrameYears?: number;
  warrantySurfaceYears?: number;
  warrantyPolicy?: string;
  deliveredAt?: string;
  finalPaymentReceived?: boolean;

  // Liên kết hệ thống
  generatedOrderNumber?: string;
  workOrderCode?: string;
  customVariant?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    status: 'private' | 'public';
    isPrivate: boolean;
    images: string[];
    attributes: { label: string; value: string; hexColor?: string }[];
    createdAt: string;
  };

  createdAt: string;
  updatedAt: string;
  timeline: CustomRequestTimeline[];
}

export interface StatusMeta {
  adminLabel: string;
  customerLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  stepIndex: number;
}

export const CUSTOM_STATUS_MAP: Record<CustomRequestStatus, StatusMeta> = {
  PENDING_REVIEW: {
    adminLabel: 'Tiếp nhận mới',
    customerLabel: 'Đã gửi yêu cầu',
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    description: 'Khách gửi form thành công từ web. Đơn nằm trong danh sách chờ KTS nhận việc.',
    stepIndex: 1
  },
  CONSULTING: {
    adminLabel: 'Đang khảo sát đo đạc',
    customerLabel: 'Đang xử lý & khảo sát',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description: 'KTS nhận việc, liên hệ đo đạc mặt bằng, chốt kích thước/vật liệu.',
    stepIndex: 2
  },
  QUOTED: {
    adminLabel: 'Đã gửi báo giá & bản vẽ',
    customerLabel: 'Đã nhận báo giá và bản vẽ',
    color: '#7c3aed',
    bgColor: '#f3e8ff',
    borderColor: '#ddd6fe',
    description: 'KTS hoàn thiện phối cảnh 3D + bóc tách dự toán giá & cọc 30%.',
    stepIndex: 3
  },
  AWAITING_CONTRACT: {
    adminLabel: 'Chờ ký hợp đồng',
    customerLabel: 'Chờ ký HĐ',
    color: '#ea580c',
    bgColor: '#ffedd5',
    borderColor: '#fed7aa',
    description: 'Khách duyệt phương án 3D & dự toán, hợp đồng may đo kinh tế đã gửi tới tài khoản khách hàng để ký điện tử.',
    stepIndex: 4
  },
  CONTRACT_SIGNED: {
    adminLabel: 'Chờ đặt cọc (Đã ký HĐ)',
    customerLabel: 'Chờ đặt cọc',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: '#bae6fd',
    description: 'Hợp đồng may đo đã được ký kết điện tử thành công. Đơn hàng chuyển sang bước Đặt cọc 30%.',
    stepIndex: 5
  },
  AWAITING_PAYMENT: {
    adminLabel: 'Chờ nhận cọc 30%',
    customerLabel: 'Chờ đặt cọc',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: '#bae6fd',
    description: 'Hệ thống đã phát hành mã VietQR cọc 30%. Chờ khách quét mã thanh toán & nộp bill.',
    stepIndex: 5
  },
  DEPOSIT_SUBMITTED: {
    adminLabel: 'Chờ đối soát bill cọc',
    customerLabel: 'Chờ đối soát cọc',
    color: '#8b5cf6',
    bgColor: '#f3e8ff',
    borderColor: '#ddd6fe',
    description: 'Khách hàng đã chuyển khoản cọc và gửi bill thanh toán. Đang chờ kế toán đối soát sao kê ngân hàng.',
    stepIndex: 5
  },
  PROCESSING: {
    adminLabel: 'Đang gia công xưởng',
    customerLabel: 'Đang sản xuất tại xưởng',
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    description: 'Đã nhận cọc 30%. Xưởng mộc đang gia công chế tác theo bản vẽ và lệnh sản xuất.',
    stepIndex: 6
  },
  QC_PASSED: {
    adminLabel: 'Đã lên đơn & Đạt chuẩn QC',
    customerLabel: 'Đã lên đơn & Sẵn sàng giao',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    description: 'Xưởng đã gia công xong và lên đơn hàng chính thức. Đã nghiệm thu QC đạt chuẩn 100%, sẵn sàng bàn giao.',
    stepIndex: 7
  },
  COMPLETED: {
    adminLabel: 'Hoàn tất sản xuất & Chuyển vận chuyển',
    customerLabel: 'Hoàn tất sản xuất chuyển cho Vận chuyển',
    color: '#15803d',
    bgColor: '#dcfce7',
    borderColor: '#86efac',
    description: 'Xưởng đã sản xuất nghiệm thu hoàn tất và bàn giao sang đơn vị vận chuyển giao tới nhà khách hàng.',
    stepIndex: 7
  },
  CANCELLED: {
    adminLabel: 'Đã hủy',
    customerLabel: 'Đã kết thúc',
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    description: 'Hồ sơ bị hủy do thay đổi thiết kế hoặc khách dừng kế hoạch.',
    stepIndex: 10
  }
};

@Injectable({
  providedIn: 'root'
})
export class CustomRequestService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private readonly STORAGE_KEY = 'dcor_admin_custom_requests_v6';
  private requestsSubject = new BehaviorSubject<CustomRequest[]>([]);
  public requests$: Observable<CustomRequest[]> = this.requestsSubject.asObservable();

  constructor() {
    this.initData();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === this.STORAGE_KEY && e.newValue) {
          try {
            const list = JSON.parse(e.newValue);
            if (Array.isArray(list)) {
              this.requestsSubject.next(list);
            }
          } catch (_) {}
        }
      });
      window.addEventListener('dcor_custom_requests_updated', (e: any) => {
        if (e.detail && Array.isArray(e.detail)) {
          this.requestsSubject.next(e.detail);
        }
      });
    }
  }

  private initData(): void {
    if (typeof window === 'undefined') {
      this.requestsSubject.next(this.getInitialSeedRequests());
      return;
    }

    try {
      ['dcor_admin_custom_requests', 'dcor_admin_custom_requests_v2', 'dcor_admin_custom_requests_v3', 'dcor_admin_custom_requests_v4', 'dcor_admin_custom_requests_v5'].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });

      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          const seeds = this.getInitialSeedRequests();
          let needsUpdate = false;
          const merged = parsed.map((item: any) => {
            const seed = seeds.find(s => s.code === item.code);
            if (seed) {
              return { 
                ...seed,
                ...item,
                status: seed.status,
                workOrderCode: seed.workOrderCode,
                generatedOrderNumber: seed.generatedOrderNumber,
                contractSignedAt: seed.contractSignedAt,
                contractScanUrl: seed.contractScanUrl,
                qcChecklist: seed.qcChecklist,
                customVariant: seed.customVariant,
                referenceImages: item.referenceImages?.length ? item.referenceImages : seed.referenceImages, 
                productImage: item.code === 'CR-0004' ? '' : (item.productImage || seed.productImage),
                budgetRange: item.budgetRange || seed.budgetRange,
                estimatedBudget: item.estimatedBudget || seed.estimatedBudget,
                preferredSurveyTime: item.preferredSurveyTime || seed.preferredSurveyTime,
                expectedDeliveryDate: item.expectedDeliveryDate || seed.expectedDeliveryDate,
                roomSpace: item.roomSpace || seed.roomSpace,
                hasDimensions: seed.hasDimensions !== undefined ? seed.hasDimensions : item.hasDimensions,
                originalDimensions: item.originalDimensions || seed.originalDimensions,
                requestedDimensions: item.requestedDimensions || seed.requestedDimensions,
                customDimensionNote: item.customDimensionNote || seed.customDimensionNote,
                customizedAttributes: seed.customizedAttributes !== undefined ? seed.customizedAttributes : item.customizedAttributes,
                attachments: item.attachments || seed.attachments,
                basePrice: item.basePrice || seed.basePrice,
                requirementDetails: item.requirementDetails || seed.requirementDetails,
                isPhoneVerified: item.isPhoneVerified !== undefined ? item.isPhoneVerified : seed.isPhoneVerified
              };
            }
            return item;
          });

          // Bổ sung các hạt giống mới nếu chưa có trong bộ nhớ lưu trữ
          seeds.forEach(seed => {
            if (!merged.some(m => m.code === seed.code || m.id === seed.id)) {
              merged.push(seed);
            }
          });

          // Đồng bộ tự động các đơn mới mà khách gửi qua website (dcor_custom_requests)
          try {
            const clientRequests = JSON.parse(localStorage.getItem('dcor_custom_requests') || '[]');
            if (Array.isArray(clientRequests) && clientRequests.length > 0) {
              clientRequests.forEach((cr: any) => {
                const code = cr.requestCode || cr.code;
                if (code && !merged.some((m: any) => m.code === code || m.id === cr.id)) {
                  merged.unshift(this.mapClientPayloadToRequest(cr));
                }
              });
            }
          } catch (_) {}

          // Tự động chuẩn hóa, loại bỏ hoàn toàn các link unsplash cũ trong localStorage để chạy offline mượt mà
          merged.forEach((item: any) => {
            if (item.productImage && item.productImage.includes('unsplash.com')) {
              item.productImage = '/assets/img/furniture-placeholder.svg';
            }
            if (item.drawing3dUrl && item.drawing3dUrl.includes('unsplash.com')) {
              item.drawing3dUrl = '/assets/img/about_blueprint.jpg';
            }
            if (item.contractScanUrl && item.contractScanUrl.includes('unsplash.com')) {
              item.contractScanUrl = '/assets/img/furniture-placeholder.svg';
            }
            if (item.referenceImages && Array.isArray(item.referenceImages)) {
              item.referenceImages = item.referenceImages.filter((img: string) => 
                img && !img.includes('furniture-placeholder.svg') && !img.includes('unsplash.com')
              );
            }
            if (item.attachments && Array.isArray(item.attachments)) {
              item.attachments = item.attachments.filter((att: any) => 
                att.previewUrl && !att.previewUrl.includes('furniture-placeholder.svg') && !att.previewUrl.includes('unsplash.com')
              );
            }
            if (item.status === 'PENDING_REVIEW') {
              if (item.drawing3dUrl && item.drawing3dUrl.includes('about_blueprint.jpg')) {
                delete item.drawing3dUrl;
              }
              if (item.attachments && Array.isArray(item.attachments)) {
                item.attachments = item.attachments.filter((att: any) => 
                  att.previewUrl && !att.previewUrl.includes('about_blueprint.jpg')
                );
              }
              if (item.referenceImages && Array.isArray(item.referenceImages)) {
                item.referenceImages = item.referenceImages.filter((img: string) => 
                  img && !img.includes('about_blueprint.jpg')
                );
              }
            }
          });

          this.saveToStorage(merged);
          this.requestsSubject.next(merged);
          this.fetchRequestsFromBackend();
          return;
        }
      }
    } catch (_) {}

    const seeds = this.getInitialSeedRequests();
    this.saveToStorage(seeds);
    this.requestsSubject.next(seeds);
    this.fetchRequestsFromBackend();
  }

  public get requestsValue(): CustomRequest[] {
    return this.requestsSubject.value;
  }

  public getRequests(): CustomRequest[] {
    return this.requestsSubject.value;
  }

  public getRequestById(id: string): CustomRequest | undefined {
    const req = this.requestsSubject.value.find(r => r.id === id || r.code === id);
    if (req && req.assignedStaff) {
      req.assignedStaff = req.assignedStaff.replace(/\s*\([^)]*\)/g, '').trim();
    }
    return req;
  }

  public getById(id: string): CustomRequest | undefined {
    return this.getRequestById(id);
  }

  private saveToStorage(list: CustomRequest[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('dcor_custom_requests_updated', { detail: list }));
      } catch (_) {}
    }
  }

  /**
   * Tải danh sách yêu cầu may đo từ máy chủ PostgreSQL Supabase qua REST API Backend
   */
  public fetchRequestsFromBackend(): void {
    if (!this.http) return;
    this.http.get<any>(`${this.apiUrl}/admin/custom-requests?limit=200`).subscribe({
      next: (res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          const backendList: CustomRequest[] = res.data;
          const currentLocal = this.requestsSubject.value;

          // Merge an toàn: Lấy bản mới nhất từ backend, bổ sung các đơn mới tạo ở client nếu backend chưa có
          const merged = [...backendList];
          for (const localItem of currentLocal) {
            if (!merged.some(b => b.id === localItem.id || b.code === localItem.code)) {
              merged.push(localItem);
              this.createRequestOnBackend(localItem);
            }
          }

          this.requestsSubject.next(merged);
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
              window.dispatchEvent(new CustomEvent('dcor_custom_requests_updated', { detail: merged }));
            } catch (_) {}
          }
        }
      },
      error: (err) => {
        console.warn('[CustomRequestService] Không thể kết nối API Backend Custom Requests, đang dùng bộ nhớ đệm:', err?.message);
      }
    });
  }

  /**
   * Đồng bộ một hồ sơ may đo lên máy chủ Backend để lưu trữ vĩnh viễn vào PostgreSQL Supabase
   */
  public syncRequestToBackend(item: CustomRequest, newTimelineEvent?: any): void {
    if (!this.http || !item || !item.id) return;
    this.http.put<any>(`${this.apiUrl}/admin/custom-requests/${item.id}`, {
      ...item,
      newTimelineEvent
    }).subscribe({
      next: () => {},
      error: (err) => {
        console.warn('[CustomRequestService] Lưu ý khi đồng bộ cập nhật lên Backend (đã lưu cache local):', err?.message);
      }
    });
  }

  /**
   * Đẩy yêu cầu may đo mới lên máy chủ Backend
   */
  public createRequestOnBackend(item: CustomRequest): void {
    if (!this.http || !item) return;
    this.http.post<any>(`${this.apiUrl}/store/custom-requests`, item).subscribe({
      next: (res) => {
        if (res?.data) {
          const current = this.requestsSubject.value;
          const idx = current.findIndex(r => r.id === item.id || r.code === item.code);
          if (idx !== -1) {
            current[idx] = { ...current[idx], ...res.data };
            this.requestsSubject.next([...current]);
            this.saveToStorage(current);
          }
        }
      },
      error: (err) => {
        console.warn('[CustomRequestService] Lưu ý khi tạo yêu cầu mới lên Backend (đã lưu cache local):', err?.message);
      }
    });
  }

  /**
   * Tạo yêu cầu custom mới từ phía Khách hàng
   */
  createRequest(data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    customerId?: string;
    productId?: string;
    productName: string;
    productSku?: string;
    productImage?: string;
    categoryName?: string;
    length?: number;
    width?: number;
    height?: number;
    colorName?: string;
    colorHex?: string;
    material?: string;
    legMaterial?: string;
    notes?: string;
    referenceImages?: string[];
    preferredSurveyTime?: string;
    roomSpace?: string;
    expectedDeliveryDate?: string;
    isPhoneVerified?: boolean;
  }): CustomRequest {
    const current = [...this.requestsSubject.value];
    const now = new Date().toISOString();
    const count = current.length + 1;
    const code = `CR-${String(count).padStart(4, '0')}`;
    const id = `cr-${Date.now()}`;

    const newRequest: CustomRequest = {
      id,
      code,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      customerId: data.customerId,
      productId: data.productId,
      productName: data.productName,
      productSku: data.productSku,
      productImage: data.productImage || '/assets/img/furniture-placeholder.svg',
      categoryName: data.categoryName || 'Sofa May Đo',
      length: data.length,
      width: data.width,
      height: data.height,
      colorName: data.colorName || 'Nâu Cognac Ý',
      colorHex: data.colorHex || '#8B4513',
      material: data.material || 'Da bò Ý Full Grain',
      legMaterial: data.legMaterial || 'Kim loại sơn tĩnh điện đen mờ',
      notes: data.notes,
      referenceImages: data.referenceImages || [],
      preferredSurveyTime: data.preferredSurveyTime,
      roomSpace: data.roomSpace,
      expectedDeliveryDate: data.expectedDeliveryDate,
      isPhoneVerified: data.isPhoneVerified ?? true,
      status: 'PENDING_REVIEW',
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'PENDING_REVIEW',
          title: 'Khách hàng gửi yêu cầu',
          description: `Khách gửi thông số may đo: Dài ${data.length || 0} x Rộng ${data.width || 0} x Cao ${data.height || 0} cm. Chất liệu: ${data.material || 'Da bò Ý'}.`,
          timestamp: now,
          performedBy: data.customerName
        }
      ]
    };

    current.unshift(newRequest);
    this.saveToStorage(current);
    this.requestsSubject.next(current);
    this.createRequestOnBackend(newRequest);
    return newRequest;
  }

  // --- THAO TÁC THEO TỪNG BƯỚC QUY TRÌNH ---

  /** Phân công Kiến trúc sư phụ trách hồ sơ (Role: Kiến trúc sư) */
  assignArchitect(id: string, staffName: string): CustomRequest | undefined {
    const target = this.getById(id);
    if (!target) return undefined;
    target.assignedStaff = (staffName || '').replace(/\s*\([^)]*\)/g, '').trim();
    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = { ...target };
      this.saveToStorage(current);
      this.requestsSubject.next(current);
      this.syncRequestToBackend(target);
    }
    return target;
  }

  /** Bước 1: KTS nhận việc, chuyển sang CONSULTING */
  startConsulting(id: string, staffName: string = 'KTS. Lê Nam', surveyNotes?: string): CustomRequest | undefined {
    return this.updateStatus(id, 'CONSULTING', {
      title: 'KTS tiếp nhận khảo sát & đo đạc',
      description: surveyNotes || 'KTS đã liên hệ khách hàng, chốt lịch đo đạc kích thước hiện trạng phòng khách và tư vấn loại vật liệu.',
      performedBy: staffName,
      assignedStaff: staffName
    });
  }

  /** Cập nhật biên bản đo đạc & thông số kỹ thuật khảo sát thực tế của KTS */
  updateSurveyRecord(
    id: string,
    data: {
      surveyNotes?: string;
      surveyAttachment?: CustomAttachmentItem;
      length?: number;
      width?: number;
      height?: number;
      colorName?: string;
      colorHex?: string;
      colorImage?: string;
      material?: string;
      legMaterial?: string;
    }
  ): CustomRequest | undefined {
    const target = this.getById(id);
    if (!target) return undefined;
    if (data.surveyNotes !== undefined) target.surveyNotes = data.surveyNotes;
    if (data.surveyAttachment !== undefined) target.surveyAttachment = data.surveyAttachment;
    if (data.length !== undefined) target.length = Number(data.length);
    if (data.width !== undefined) target.width = Number(data.width);
    if (data.height !== undefined) target.height = Number(data.height);
    if (data.colorName !== undefined) target.colorName = data.colorName;
    if (data.colorHex !== undefined) target.colorHex = data.colorHex;
    if (data.colorImage !== undefined) target.colorImage = data.colorImage;
    if (data.material !== undefined) target.material = data.material;
    if (data.legMaterial !== undefined) target.legMaterial = data.legMaterial;
    target.updatedAt = new Date().toISOString();

    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = { ...target };
      this.saveToStorage(current);
      this.requestsSubject.next(current);
      this.syncRequestToBackend(target);
    }
    return target;
  }

  /** Lưu dự toán báo giá (ghi nhận đơn giá, cọc và ghi chú của đơn custom, lưu vào storage) */
  saveQuoteDraft(
    id: string,
    data: {
      quotedPrice: number;
      quotedDeposit?: number;
      notes?: string;
      drawing3dUrl?: string;
      drawing3dUrls?: string[];
      staffName?: string;
    }
  ): CustomRequest | undefined {
    const target = this.getById(id);
    if (!target) return undefined;
    const price = Number(data.quotedPrice) || 0;
    const deposit = data.quotedDeposit !== undefined ? Number(data.quotedDeposit) : Math.round(price * 0.3);

    target.quotedPrice = price;
    target.quotedDeposit = deposit;
    target.quotedAt = new Date().toISOString();
    if (data.notes !== undefined) target.adminNotes = data.notes;
    if (data.drawing3dUrl) target.drawing3dUrl = data.drawing3dUrl;
    if (data.drawing3dUrls && data.drawing3dUrls.length > 0) target.drawing3dUrls = data.drawing3dUrls;
    if (data.staffName) target.assignedStaff = data.staffName.replace(/\s*\([^)]*\)/g, '').trim();
    target.updatedAt = new Date().toISOString();

    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = { ...target };
      this.saveToStorage(current);
      this.requestsSubject.next(current);
      this.syncRequestToBackend(target);
    }
    return target;
  }

  /** Bước 2: Hoàn thiện khảo sát đo đạc hiện trạng, chuyển sang QUOTED (Bước 3: Báo giá & 3D) */
  completeSurvey(id: string, staffName: string = 'KTS. Phụ trách'): CustomRequest | undefined {
    return this.updateStatus(id, 'QUOTED', {
      title: 'Hoàn thiện khảo sát & đo đạc hiện trạng',
      description: 'KTS đã hoàn thành công tác đo đạc kích thước thực tế và khảo sát mặt bằng. Hồ sơ chuyển sang Bước 3: Lập báo giá & 3D.',
      performedBy: staffName
    });
  }

  /** Bước 3: Lập dự toán báo giá + upload 3D, chuyển sang AWAITING_CONTRACT (Bước 4: Hợp đồng) */
  sendQuote(
    id: string,
    quoteData: {
      quotedPrice: number;
      quotedDeposit?: number;
      drawing3dUrl?: string;
      drawing3dUrls?: string[];
      notes?: string;
      staffName?: string;
    }
  ): CustomRequest | undefined {
    const deposit = quoteData.quotedDeposit || Math.round(quoteData.quotedPrice * 0.3);
    const target = this.getById(id);
    if (target && quoteData.drawing3dUrls && quoteData.drawing3dUrls.length > 0) {
      target.drawing3dUrls = quoteData.drawing3dUrls;
    }
    return this.updateStatus(id, 'AWAITING_CONTRACT', {
      title: 'Đã hoàn thiện báo giá dự toán & phát hành hợp đồng',
      description: `Báo giá chính thức: ${new Intl.NumberFormat('vi-VN').format(quoteData.quotedPrice)} đ (Cọc 30%: ${new Intl.NumberFormat('vi-VN').format(deposit)} đ). Đã chuyển sang trạng thái chờ khách hàng ký hợp đồng may đo.`,
      performedBy: quoteData.staffName || 'Ban Báo Giá DCor',
      assignedStaff: quoteData.staffName,
      quotedPrice: quoteData.quotedPrice,
      quotedDeposit: deposit,
      drawing3dUrl: quoteData.drawing3dUrl,
      adminNotes: quoteData.notes,
      quotedAt: new Date().toISOString()
    });
  }

  /** Bước 3: Phát hành hợp đồng may đo, chuyển sang AWAITING_CONTRACT */
  prepareContract(id: string, staffName: string = 'Phòng Hợp Đồng DCor'): CustomRequest | undefined {
    return this.updateStatus(id, 'AWAITING_CONTRACT', {
      title: 'Phát hành Hợp đồng may đo nội thất',
      description: 'Khách hàng đã duyệt báo giá & thiết kế 3D. Đã soạn thảo hợp đồng kinh tế may đo và gửi khách xem trước.',
      performedBy: staffName
    });
  }

  /** Bước 4: Xác nhận đã ký hợp đồng -> Tự động lưu bản HĐ và chuyển thẳng sang Cọc 30% (AWAITING_PAYMENT) */
  confirmContractSigned(id: string, contractScanUrl?: string, staffName: string = 'Khách hàng'): CustomRequest | undefined {
    return this.updateStatus(id, 'AWAITING_PAYMENT', {
      title: 'Hợp đồng may đo đã được ký kết & Phát hành mã cọc 30%',
      description: 'Hợp đồng may đo đã được xác nhận ký kết điện tử thành công và lưu trữ hồ sơ. Quy trình tự động chuyển sang bước Đặt cọc 30%.',
      performedBy: staffName,
      contractScanUrl: contractScanUrl || '/assets/img/furniture-placeholder.svg',
      contractSignedAt: new Date().toISOString()
    });
  }

  /** Bước 5: Phát hành mã VietQR cọc 30%, chuyển sang AWAITING_PAYMENT */
  requestPayment(id: string, staffName: string = 'Kế toán DCor'): CustomRequest | undefined {
    return this.updateStatus(id, 'AWAITING_PAYMENT', {
      title: 'Phát hành mã VietQR thanh toán cọc 30%',
      description: 'Hệ thống đã khởi tạo mã QR chuyển khoản đặt cọc 30% gửi cho khách.',
      performedBy: staffName
    });
  }

  /** Alias cho requestPayment */
  requestDeposit(id: string, staffName: string = 'Kế toán DCor'): CustomRequest | undefined {
    return this.requestPayment(id, staffName);
  }

  /** Bước 5b: Khách hàng xác nhận đã chuyển khoản cọc 30% kèm ảnh bill thanh toán */
  submitDepositConfirmation(id: string, notes?: string, billImage?: string): CustomRequest | undefined {
    const target = this.getById(id);
    if (target) {
      if (billImage) target.depositProofImage = billImage;
      if (notes) target.depositProofNote = notes;
    }
    return this.updateStatus(id, 'DEPOSIT_SUBMITTED', {
      title: 'Đã gửi xác nhận chuyển khoản cọc 30% & Biên lai thanh toán',
      description: 'Khách hàng đã chuyển khoản thành công và tải lên biên lai thanh toán. Kế toán đang đối soát sao kê.',
      performedBy: 'Khách hàng',
      adminNotes: notes || 'Khách hàng đã chuyển khoản cọc 30% qua VietQR, chờ đối soát'
    });
  }

  /** Bước 5: Kế toán xác nhận nhận cọc 30% -> Cấp mã Lệnh xưởng & BẮN XƯỞNG SẢN XUẤT (PROCESSING). Chưa sinh Đơn hàng chính thức */
  confirmPaymentAndStartProduction(
    id: string, 
    staffName: string = 'Kế toán DCOR'
  ): { updatedRequest: CustomRequest; workOrderCode: string; generatedOrderNumber?: string } | undefined {
    const target = this.getById(id);
    if (!target) return undefined;

    const workOrderCode = `WO-${target.code.replace('CR-', 'MK-')}`;

    const updated = this.updateStatus(id, 'PROCESSING', {
      title: 'Xác nhận cọc 30% thành công - Phát lệnh sản xuất xưởng',
      description: `Kế toán xác nhận nhận cọc 30% thành công. Phát lệnh sản xuất xưởng ${workOrderCode} để xưởng bắt đầu gia công chế tác theo bản vẽ 3D.`,
      performedBy: staffName
    });

    if (!updated) return undefined;

    // Gắn mã lệnh xưởng vào request
    updated.workOrderCode = workOrderCode;
    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = updated;
      this.saveToStorage(current);
      this.requestsSubject.next(current);
    }

    return { updatedRequest: updated, workOrderCode, generatedOrderNumber: updated.generatedOrderNumber || `DCOR-ORD-${target.code.replace('CR-', 'CUST-')}` };
  }

  /** Bước 6: Quản đốc xưởng / KTS Tạo sản phẩm (Tạo biến thể Private) cho yêu cầu custom */
  saveCustomVariant(id: string, variant: any): CustomRequest | undefined {
    const target = this.getById(id);
    if (!target) return undefined;

    target.customVariant = variant;
    target.updatedAt = new Date().toISOString();

    // Thêm vào timeline tác nghiệp
    target.timeline.unshift({
      status: target.status,
      title: 'Tạo sản phẩm biến thể may đo (Private)',
      description: `Đã tạo biến thể sản phẩm riêng cho khách hàng: "${variant.name}" (SKU: ${variant.sku || 'N/A'}, Giá: ${new Intl.NumberFormat('vi-VN').format(variant.price || 0)} đ, Tồn kho: ${variant.stock || 1}, Trạng thái: Private).`,
      timestamp: new Date().toISOString(),
      performedBy: 'Quản đốc xưởng DCOR'
    });

    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = target;
      this.saveToStorage(current);
      this.requestsSubject.next(current);
      this.syncRequestToBackend(target);
    }
    return target;
  }

  /** Bước 6: Xưởng sản xuất xong -> Nhấn "Lên đơn hàng" -> MỚI CHÍNH THỨC TẠO ĐƠN TRONG TAB ĐƠN HÀNG */
  createOfficialOrderFromProduction(
    id: string,
    staffName: string = 'Quản đốc xưởng DCOR'
  ): { updatedRequest: CustomRequest; generatedOrderNumber: string } | undefined {
    const target = this.getById(id);
    if (!target) return undefined;

    const generatedOrderNumber = `DCOR-ORD-${target.code.replace('CR-', 'CUST-')}`;

    const updated = this.updateStatus(id, 'QC_PASSED', {
      title: 'Hoàn tất sản xuất xưởng - Lên Đơn hàng chính thức',
      description: `Xưởng đã hoàn tất gia công sản xuất sản phẩm custom. Hệ thống chính thức tạo Đơn hàng #${generatedOrderNumber} trong tab Đơn hàng để bàn giao, nghiệm thu và thu 70% còn lại.`,
      performedBy: staffName
    });

    if (!updated) return undefined;

    updated.generatedOrderNumber = generatedOrderNumber;
    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = updated;
      this.saveToStorage(current);
      this.requestsSubject.next(current);
    }

    // 1. Tự động sinh Đơn hàng chính thức trong Orders store (dcor_replacement_orders_store)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const REPLACEMENT_ORDERS_KEY = 'dcor_replacement_orders_store';
        const existing = JSON.parse(localStorage.getItem(REPLACEMENT_ORDERS_KEY) || '[]');
        const customOrder: any = {
          id: generatedOrderNumber,
          orderNumber: generatedOrderNumber,
          customerName: updated.customerName,
          phone: updated.customerPhone,
          email: updated.customerEmail || 'khachhang@dcor.vn',
          shippingAddress: updated.customerAddress || 'Showroom DCOR Studio',
          createdAt: new Date().toISOString(),
          status: 'PROCESSING',
          paymentStatus: 'PARTIAL',
          totalAmount: updated.quotedPrice || 35000000,
          depositAmount: updated.quotedDeposit || Math.round((updated.quotedPrice || 35000000) * 0.3),
          source: 'CUSTOM_ORDER',
          workOrderCode: updated.workOrderCode || `WO-${updated.code.replace('CR-', 'MK-')}`,
          customRequestId: updated.code,
          note: `[Đơn May Đo Riêng - Hồ sơ ${updated.code}] Kích thước: ${updated.length}x${updated.width}x${updated.height} cm. Chất liệu: ${updated.material}. Màu sắc: ${updated.colorName}. Ghi chú: ${updated.notes || 'Không có'}`,
          products: [
            {
              id: updated.productId || 'prod-custom',
              name: updated.customVariant?.name || `[May đo] ${updated.productName}`,
              sku: updated.customVariant?.sku || `${updated.productSku || 'DCOR-CUSTOM'}-CUSTOM`,
              variant: updated.customVariant?.name || `${updated.length}x${updated.width}x${updated.height} cm | ${updated.material || 'Da bò Ý'} | ${updated.colorName || 'Màu đặt riêng'}`,
              imageUrl: (updated.customVariant?.images && updated.customVariant.images[0]) || updated.productImage || '/assets/img/furniture-placeholder.svg',
              price: updated.customVariant?.price || updated.quotedPrice || 35000000,
              quantity: updated.customVariant?.stock || 1,
              lineTotal: (updated.customVariant?.price || updated.quotedPrice || 35000000) * (updated.customVariant?.stock || 1),
              stockAvailable: updated.customVariant?.stock || 1,
              isPrivate: true
            }
          ]
        };

        const oIdx = existing.findIndex((o: any) => o.orderNumber === generatedOrderNumber || o.id === generatedOrderNumber);
        if (oIdx >= 0) existing[oIdx] = customOrder;
        else existing.unshift(customOrder);
        localStorage.setItem(REPLACEMENT_ORDERS_KEY, JSON.stringify(existing));

        // 2. Tự động sinh Lệnh xuất kho vật tư thi công
        const TX_STORAGE_KEY = 'dcor_inventory_transactions';
        const txList = JSON.parse(localStorage.getItem(TX_STORAGE_KEY) || '[]');
        const txCode = `PXK-VT-${updated.code.replace('CR-', '')}`;
        if (!txList.some((t: any) => t.code === txCode)) {
          txList.unshift({
            id: txCode,
            code: txCode,
            type: 'EXPORT',
            category: 'Vật tư thi công may đo',
            reason: `Xuất vật tư sản xuất đơn may đo ${updated.code} (${generatedOrderNumber})`,
            createdAt: new Date().toISOString(),
            status: 'COMPLETED',
            itemsCount: 3,
            creator: staffName,
            note: `Gỗ sồi nhập khẩu xẻ sấy, 28m da ${updated.material || 'bò Ý'}, khối mút D40`
          });
          localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(txList));
        }

        window.dispatchEvent(new CustomEvent('dcor_orders_updated'));
      } catch (e) {
        console.warn('Lỗi đồng bộ vào kho đơn hàng / localStorage:', e);
      }
    }

    return { updatedRequest: updated, generatedOrderNumber };
  }

  /** Nghiệm thu QC May đo 4 tiêu chí khắt khe -> Chuyển QC_PASSED */
  passQcInspection(
    id: string,
    checklist: {
      dimensionAccuracy: boolean;
      surfaceFinish: boolean;
      cushionStitching: boolean;
      packagingProtection: boolean;
    },
    inspectorName: string = 'KTS. Lê Nam (Trưởng bộ phận QC)',
    notes: string = 'Đạt 4/4 tiêu chí kỹ thuật may đo khắt khe.'
  ): CustomRequest | undefined {
    const target = this.getById(id);
    if (!target) return undefined;

    const updated = this.updateStatus(id, 'QC_PASSED', {
      title: 'Nghiệm thu QC May đo 4 tiêu chí khắt khe - ĐẠT CHUẨN',
      description: `Đã kiểm định: ${notes}. 100% tiêu chí đạt chuẩn xuất xưởng đóng kiện giao khách.`,
      performedBy: inspectorName
    });

    if (updated) {
      updated.qcPassedAt = new Date().toISOString();
      updated.qcInspector = inspectorName;
      updated.qcChecklist = checklist;
      const current = [...this.requestsSubject.value];
      const idx = current.findIndex(r => r.id === id);
      if (idx >= 0) {
        current[idx] = updated;
        this.saveToStorage(current);
        this.requestsSubject.next(current);
      }
    }
    return updated;
  }

  /** Giao hàng, thu 70% còn lại & Kích hoạt Bảo hành -> Chuyển COMPLETED */
  completeDeliveryAndWarranty(
    id: string,
    staffName: string = 'Điều phối viên DCOR Studio'
  ): { updatedRequest: CustomRequest; warrantyCode: string } | undefined {
    const target = this.getById(id);
    if (!target) return undefined;

    const warrantyCode = `BH-DCOR-${target.code.replace('CR-', '')}`;
    const updated = this.updateStatus(id, 'COMPLETED', {
      title: 'Giao hàng, thu 70% còn lại & Kích hoạt Bảo hành',
      description: `Bàn giao lắp đặt hoàn tất tại nhà khách, thu đủ 70% tiền còn lại. Kích hoạt bảo hành điện tử chính hãng số ${warrantyCode} (Thời hạn 5 năm khung sườn, 2 năm da).`,
      performedBy: staffName
    });

    if (!updated) return undefined;

    updated.warrantyCode = warrantyCode;
    updated.deliveredAt = new Date().toISOString();
    updated.finalPaymentReceived = true;

    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = updated;
      this.saveToStorage(current);
      this.requestsSubject.next(current);
    }

    // Tự động cập nhật Đơn hàng chính thức bên /admin/orders thành PAID & DELIVERED
    if (typeof window !== 'undefined' && window.localStorage && target.generatedOrderNumber) {
      try {
        const REPLACEMENT_ORDERS_KEY = 'dcor_replacement_orders_store';
        const existing = JSON.parse(localStorage.getItem(REPLACEMENT_ORDERS_KEY) || '[]');
        const oIdx = existing.findIndex((o: any) => o.orderNumber === target.generatedOrderNumber || o.id === target.generatedOrderNumber);
        if (oIdx >= 0) {
          existing[oIdx].status = 'DELIVERED';
          existing[oIdx].paymentStatus = 'PAID';
          existing[oIdx].warrantyCode = warrantyCode;
          localStorage.setItem(REPLACEMENT_ORDERS_KEY, JSON.stringify(existing));
          window.dispatchEvent(new CustomEvent('dcor_orders_updated'));
        }
      } catch (e) {
        console.warn('Lỗi cập nhật đơn hàng custom sau khi giao:', e);
      }
    }

    return { updatedRequest: updated, warrantyCode };
  }

  /** Hủy yêu cầu */
  cancelRequest(id: string, reason: string, staffName: string = 'Admin'): CustomRequest | undefined {
    return this.updateStatus(id, 'CANCELLED', {
      title: 'Yêu cầu custom đã hủy',
      description: `Lý do hủy: ${reason}`,
      performedBy: staffName,
      cancelReason: reason,
      cancelledAt: new Date().toISOString()
    });
  }

  /** Reset toàn bộ về dữ liệu mẫu chuẩn */
  resetToSeeds(): void {
    const seeds = this.getInitialSeedRequests();
    this.saveToStorage(seeds);
    this.requestsSubject.next(seeds);
  }

  public updateStatus(
    id: string, 
    newStatus: CustomRequestStatus, 
    meta: {
      title: string;
      description: string;
      performedBy: string;
      quotedPrice?: number;
      quotedDeposit?: number;
      drawing3dUrl?: string;
      adminNotes?: string;
      quotedAt?: string;
      contractScanUrl?: string;
      contractSignedAt?: string;
      assignedStaff?: string;
      cancelReason?: string;
      cancelledAt?: string;
    }
  ): CustomRequest | undefined {
    const current = [...this.requestsSubject.value];
    const index = current.findIndex(r => r.id === id);
    if (index === -1) return undefined;

    const now = new Date().toISOString();
    const item = { ...current[index] };

    item.status = newStatus;
    item.updatedAt = now;

    if (meta.quotedPrice !== undefined) item.quotedPrice = meta.quotedPrice;
    if (meta.quotedDeposit !== undefined) item.quotedDeposit = meta.quotedDeposit;
    if (meta.drawing3dUrl) item.drawing3dUrl = meta.drawing3dUrl;
    if (meta.adminNotes) item.adminNotes = meta.adminNotes;
    if (meta.quotedAt) item.quotedAt = meta.quotedAt;
    if (meta.contractScanUrl) item.contractScanUrl = meta.contractScanUrl;
    if (meta.contractSignedAt) item.contractSignedAt = meta.contractSignedAt;
    if (meta.assignedStaff) item.assignedStaff = meta.assignedStaff.replace(/\s*\([^)]*\)/g, '').trim();
    if (meta.cancelReason) item.cancelReason = meta.cancelReason;
    if (meta.cancelledAt) item.cancelledAt = meta.cancelledAt;

    item.timeline = [
      ...(Array.isArray(item.timeline) ? item.timeline : []),
      {
        status: newStatus,
        title: meta.title,
        description: meta.description,
        timestamp: now,
        performedBy: (meta.performedBy || '').replace(/\s*\([^)]*\)/g, '').trim()
      }
    ];

    current[index] = item;
    this.saveToStorage(current);
    this.requestsSubject.next(current);
    this.syncRequestToBackend(item, item.timeline[item.timeline.length - 1]);
    return item;
  }

  public mapClientPayloadToRequest(cr: any): CustomRequest {
    const cust = cr.customer || {};
    const customiz = cr.customizations || {};
    const specs = cr.specifications || {};
    const nowIso = cr.createdAt || new Date().toISOString();
    return {
      id: cr.id || `cr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: cr.requestCode || cr.code || `CR-${Date.now().toString().slice(-4)}`,
      customerName: cust.fullName || cr.customerName || 'Khách hàng DCOR',
      customerPhone: cust.phone || cr.customerPhone || '',
      customerEmail: cust.email || cr.customerEmail || '',
      customerAddress: cust.address || cr.customerAddress || '',
      isPhoneVerified: cust.isPhoneVerified !== undefined ? cust.isPhoneVerified : true,
      productId: cr.productId,
      productName: cr.productName || 'Sản phẩm Custom May Đo',
      productSku: cr.productSku || '',
      productImage: cr.productThumbnail || cr.productImage,
      categoryName: cr.categoryName || 'Sản phẩm May Đo',
      basePrice: cr.basePrice || 35000000,
      hasDimensions: customiz.hasDimensions !== undefined 
        ? customiz.hasDimensions 
        : (!!customiz.originalDimensions && customiz.originalDimensions !== 'Tiêu chuẩn gốc' && !customiz.originalDimensions.startsWith('0 x 0')),
      originalDimensions: customiz.hasDimensions === false ? '' : (customiz.originalDimensions || specs.originalDimensions || ''),
      requestedDimensions: customiz.hasDimensions === false ? '' : (customiz.requestedDimensions || specs.requestedDimensions || ''),
      customDimensionNote: customiz.customDimensionNote || '',
      length: customiz.hasDimensions === false ? undefined : cr.length,
      width: customiz.hasDimensions === false ? undefined : cr.width,
      height: customiz.hasDimensions === false ? undefined : cr.height,
      customizedAttributes: (customiz.attributes || []).map((a: any) => ({
        ...a,
        isOther: a.isOther !== undefined ? a.isOther : (a.selectedOptionId === 'custom_other' || a.selectedOptionName === 'Khác' || !!(a.customNote && a.customNote.trim()))
      })),
      colorName: cr.colorName || specs.selectedColor,
      colorHex: cr.colorHex,
      material: cr.material || specs.selectedMaterial,
      legMaterial: cr.legMaterial,
      notes: customiz.requirementDetails || specs.requirementDetails || cr.notes || '',
      requirementDetails: customiz.requirementDetails || specs.requirementDetails || cr.notes || '',
      budgetRange: customiz.budgetRange || specs.budgetRange || cr.budgetRange,
      estimatedBudget: customiz.estimatedBudget || specs.estimatedBudget || cr.estimatedBudget,
      preferredSurveyTime: cr.preferredSurveyTime || 'Cuối tuần / Liên hệ hẹn trước',
      expectedDeliveryDate: cr.expectedDeliveryDate || 'Trong vòng 20 ngày',
      roomSpace: cr.roomSpace || 'Không gian phòng khách',
      attachments: cr.attachments || [],
      referenceImages: cr.attachments?.length ? cr.attachments.map((a: any) => a.previewUrl).filter(Boolean) : (cr.referenceImages || []),
      status: 'PENDING_REVIEW',
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        {
          status: 'PENDING_REVIEW',
          title: 'Khách hàng gửi yêu cầu custom',
          description: `Khách gửi form tùy biến cho ${cr.productName || 'sản phẩm'} qua website.`,
          timestamp: nowIso,
          performedBy: cust.fullName || cr.customerName || 'Khách hàng'
        }
      ]
    };
  }

  private getInitialSeedRequests(): CustomRequest[] {
    const now = new Date();
    const dHoursAgo = (h: number) => new Date(now.getTime() - 3600000 * h).toISOString();
    const dDaysAgo = (d: number) => new Date(now.getTime() - 86400000 * d).toISOString();

    return [
      // 1. PENDING_REVIEW: Tiếp nhận mới (Mang đầy đủ 100% dữ liệu từ form yêu cầu custom của khách hàng)
      {
        id: 'cr-101',
        code: 'CR-0001',
        customerName: 'Hoàng Anh Tuấn',
        customerPhone: '0977889900',
        isPhoneVerified: true,
        customerEmail: 'anhtuan.hoang@gmail.com',
        customerAddress: 'Căn 2408 Tháp Aqua 1, Vinhomes Golden River, Q.1, TP.HCM',
        productId: 'prod-sofa-l',
        productName: 'Sofa Góc Chữ L Bọc Da Bò Mastrotto Ý',
        productSku: 'SF-CORNER-L',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Sofa May Đo',
        hasDimensions: true,
        basePrice: 42000000,
        originalDimensions: '280 x 175 x 85 cm',
        requestedDimensions: '290 x 175 x 85 cm',
        customDimensionNote: 'Kéo dài thêm 10cm phần văng chính để vừa vặn mảng tường phòng khách',
        length: 290,
        width: 175,
        height: 85,
        colorName: 'Xám Khói Mờ (Smoky Grey)',
        colorHex: '#64748B',
        material: 'Da bò Ý Mastrotto Full Grain 1.6mm',
        legMaterial: 'Chân Inox 304 xước mạ Titan xám nòng súng',
        customizedAttributes: [
          {
            groupId: 'attr-material',
            label: 'Chất liệu bọc & Đệm mút',
            originalValue: 'Da bò Ý Top Grain',
            selectedOptionId: 'custom_other',
            selectedOptionName: 'Khác (Theo yêu cầu riêng)',
            isOther: true,
            isChanged: true,
            customNote: 'Da bò tự nhiên nguyên tấm dày 1.6mm, xử lý chống bám bẩn & chống cào xước do nhà nuôi mèo'
          },
          {
            groupId: 'attr-color',
            label: 'Màu sắc chỉ định',
            originalValue: 'Nâu Cognac Ý (#8B4513)',
            selectedOptionId: 'color-smoky-grey',
            selectedOptionName: 'Xám Khói Mờ (Smoky Grey)',
            hexColor: '#64748B',
            isOther: false,
            isChanged: false,
            customNote: ''
          },
          {
            groupId: 'attr-legs',
            label: 'Khung xương & Chân đế',
            originalValue: 'Khung gỗ sồi chân tiện tròn',
            selectedOptionId: 'leg-titanium-grey',
            selectedOptionName: 'Chân Inox 304 xước mạ Titan xám nòng súng',
            isOther: false,
            isChanged: false,
            customNote: ''
          }
        ],
        notes: 'Góc chữ L xoay bên phải nhìn ra ban công, thêm đệm bông lông vũ lớp trên để tựa lưng thật êm. Cửa thang máy cao 2.4m rộng 1.1m (cần tháo lắp module khi chuyển lên tầng 24).',
        requirementDetails: 'Đặt tại phòng khách căn hộ chung cư lầu 24 Vinhomes Golden River. Thang máy tòa nhà cao 2.4m rộng 1.1m, góc chữ L xoay bên phải nhìn ra ban công sông Sài Gòn, thêm đệm bông lông vũ lớp trên để tựa lưng thật êm ái.',
        budgetRange: '22.000.000 đ - 26.000.000 đ',
        estimatedBudget: '25.000.000',
        preferredSurveyTime: 'Thứ 7 tuần này (09:00 - 11:30 sáng)',
        expectedDeliveryDate: 'Trước 25/11/2026 (khoảng 20 ngày)',
        roomSpace: 'Phòng khách căn hộ chung cư Vinhomes Golden River (85m²)',
        attachments: [],
        referenceImages: [],
        status: 'PENDING_REVIEW',
        createdAt: dHoursAgo(2),
        updatedAt: dHoursAgo(2),
        timeline: [
          {
            status: 'PENDING_REVIEW',
            title: 'Khách hàng gửi yêu cầu custom',
            description: 'Khách gửi form tùy biến kích thước Sofa chữ L qua website.',
            timestamp: dHoursAgo(2),
            performedBy: 'Hoàng Anh Tuấn'
          }
        ]
      },

      // 2. CONSULTING: KTS đang khảo sát đo đạc
      {
        id: 'cr-102',
        code: 'CR-0002',
        customerName: 'Nguyễn Văn Hùng',
        customerPhone: '0988776655',
        customerEmail: 'hung.nguyen@gmail.com',
        customerAddress: 'Phòng 1804 Tòa Park 9 Times City, Minh Khai, Hà Nội',
        productId: 'cc96ae87-5ef3-4318-a963-2941fa0583f7',
        productName: 'Sofa Da Bò Ý Carmo 3 Chỗ Phong Cách Bắc Âu',
        productSku: 'SF-CARMO-01',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Sofa May Đo',
        hasDimensions: true,
        length: 240,
        width: 95,
        height: 85,
        colorName: 'Nâu Cognac Da Bò Ý',
        colorHex: '#8B4513',
        material: 'Da bò Ý Full Grain tự nhiên',
        legMaterial: 'Chân Inox mạ vàng champagne PVD',
        notes: 'Gia đình muốn tăng chiều cao tựa lưng lên 5cm để đỡ gáy tốt hơn, đệm mút cao su êm ái vừa phải.',
        budgetRange: '35.000.000 đ - 40.000.000 đ',
        preferredSurveyTime: 'Chủ nhật (14:00 - 16:30 chiều)',
        expectedDeliveryDate: 'Trong vòng 30 ngày',
        roomSpace: 'Phòng khách chung cư Times City',
        referenceImages: [
          '/assets/img/furniture-placeholder.svg',
          '/assets/img/furniture-placeholder.svg'
        ],
        status: 'CONSULTING',
        assignedStaff: 'KTS. Lê Hoàng',
        createdAt: dDaysAgo(2),
        updatedAt: dHoursAgo(4),
        timeline: [
          {
            status: 'PENDING_REVIEW',
            title: 'Khách hàng gửi yêu cầu',
            description: 'Khách gửi yêu cầu tùy biến kích thước Sofa Carmo.',
            timestamp: dDaysAgo(2),
            performedBy: 'Nguyễn Văn Hùng'
          },
          {
            status: 'CONSULTING',
            title: 'KTS tiếp nhận khảo sát',
            description: 'KTS. Lê Hoàng đã gọi điện tư vấn và hẹn lịch khảo sát thực tế mặt bằng thang máy.',
            timestamp: dHoursAgo(4),
            performedBy: 'KTS. Lê Hoàng'
          }
        ]
      },

      // 3. QUOTED: Đã gửi báo giá & bản vẽ 3D
      {
        id: 'cr-103',
        code: 'CR-0003',
        customerName: 'Trần Thị Mai Phương',
        customerPhone: '0912345678',
        customerEmail: 'maiphuong.tran@yahoo.com',
        customerAddress: 'Biệt thự B2-08 Vinhomes Riverside, Long Biên, Hà Nội',
        productId: 'prod-table-1',
        productName: 'Bàn Trà Mặt Đá Cẩm Thạch Calacatta',
        productSku: 'BT-CALA-02',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Bàn Trà Custom',
        hasDimensions: true,
        length: 140,
        width: 80,
        height: 45,
        colorName: 'Mặt đá Calacatta Gold vân mây',
        colorHex: '#FDFBF7',
        material: 'Đá thạch anh nhân tạo Calacatta cao cấp',
        legMaterial: 'Khung kim loại mạ vàng Titan bóng',
        notes: 'Cần bo vát cong 4 góc cạnh bàn an toàn cho trẻ nhỏ.',
        budgetRange: '22.000.000 đ - 26.000.000 đ',
        preferredSurveyTime: 'Các buổi chiều trong tuần sau 15h',
        expectedDeliveryDate: 'Càng sớm càng tốt (15 ngày)',
        roomSpace: 'Phòng khách Biệt thự Vinhomes Riverside',
        referenceImages: [
          '/assets/img/furniture-placeholder.svg',
          '/assets/img/furniture-placeholder.svg'
        ],
        status: 'QUOTED',
        assignedStaff: 'KTS. Lê Nam',
        quotedPrice: 24500000,
        quotedDeposit: 7350000,
        drawing3dUrl: '/assets/img/about_blueprint.jpg',
        adminNotes: 'Đã gửi bản vẽ 3D chi tiết bo cạnh và bảng mẫu đá mẫu qua Zalo/Email cho chị Phương.',
        quotedAt: dDaysAgo(1),
        createdAt: dDaysAgo(4),
        updatedAt: dDaysAgo(1),
        timeline: [
          {
            status: 'PENDING_REVIEW',
            title: 'Khách gửi yêu cầu',
            description: 'Yêu cầu bàn trà đá Calacatta cỡ lớn.',
            timestamp: dDaysAgo(4),
            performedBy: 'Trần Thị Mai Phương'
          },
          {
            status: 'CONSULTING',
            title: 'Khảo sát kích thước',
            description: 'Chốt kích thước 140x80cm bo vát 4 cạnh.',
            timestamp: dDaysAgo(3),
            performedBy: 'KTS. Lê Nam'
          },
          {
            status: 'QUOTED',
            title: 'Đã gửi báo giá & bản vẽ 3D',
            description: 'Báo giá 24.500.000 đ (cọc 30%: 7.350.000 đ) đã gửi qua Email/SMS.',
            timestamp: dDaysAgo(1),
            performedBy: 'KTS. Lê Nam'
          }
        ]
      },

      // 4. AWAITING_CONTRACT: Chờ ký hợp đồng
      {
        id: 'cr-104',
        code: 'CR-0004',
        customerName: 'Đặng Quốc Bảo',
        customerPhone: '0903889911',
        customerEmail: 'baodang.arch@gmail.com',
        customerAddress: 'Penthouse P02 Landmark 81, Bình Thạnh, TP.HCM',
        productId: 'prod-bed-king',
        productName: 'Giường Ngủ Master Bọc Da Bò Nubuck Ý',
        productSku: 'BED-NUBUCK-01',
        productImage: '',
        categoryName: 'Giường & Tủ Áo',
        length: 220,
        width: 200,
        height: 110,
        colorName: 'Nâu Bò Cát Xước (Sand Brown)',
        colorHex: '#92400E',
        material: 'Da bò Nubuck cao cấp nhập khẩu Florence Ý',
        legMaterial: 'Gỗ óc chó Bắc Mỹ tự nhiên nguyên khối',
        notes: 'Đầu giường bọc quả trám thủ công, tap đầu giường tích hợp sạc không dây 2 bên.',
        status: 'AWAITING_CONTRACT',
        assignedStaff: 'KTS. Trần Minh',
        quotedPrice: 52000000,
        quotedDeposit: 15600000,
        drawing3dUrl: '/assets/img/about_blueprint.jpg',
        adminNotes: 'Anh Bảo đã duyệt phương án 3D, đang gửi hợp đồng giấy qua chuyển phát nhanh để ký.',
        quotedAt: dDaysAgo(2),
        createdAt: dDaysAgo(5),
        updatedAt: dDaysAgo(1),
        timeline: [
          {
            status: 'QUOTED',
            title: 'Gửi báo giá 52.000.000 đ',
            description: 'Khách duyệt phương án da Nubuck.',
            timestamp: dDaysAgo(2),
            performedBy: 'KTS. Trần Minh'
          },
          {
            status: 'AWAITING_CONTRACT',
            title: 'Phát hành Hợp đồng số HĐ-2026/DCOR-04',
            description: 'Hợp đồng may đo đã soạn thảo, chờ khách ký xác nhận.',
            timestamp: dDaysAgo(1),
            performedBy: 'Phòng Pháp Chế DCor'
          }
        ]
      },

      // 5. CR-0005: Đã ký hợp đồng -> Chờ đặt cọc 30% (AWAITING_PAYMENT)
      {
        id: 'cr-105',
        code: 'CR-0005',
        customerName: 'Lê Thùy Trang',
        customerPhone: '0938445566',
        customerEmail: 'thuytrang.le@vinamilk.com.vn',
        customerAddress: 'Villa 12 Khu Chateau Phú Mỹ Hưng, Q.7, TP.HCM',
        productId: 'prod-dining-table',
        productName: 'Bàn Ăn 8 Ghế Mặt Gỗ Óc Chó Ghép Tự Nhiên Live Edge',
        productSku: 'BA-WALNUT-08',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Bàn Ăn Custom',
        length: 260,
        width: 100,
        height: 76,
        colorName: 'Màu Óc Chó Tự Nhiên Sơn PU 5 Lớp',
        colorHex: '#451A03',
        material: 'Gỗ óc chó Bắc Mỹ tuyển chọn vân chun sụn',
        legMaterial: 'Chân sắt uốn nghệ thuật sơn tĩnh điện cát sần',
        notes: 'Giữ lại mép gỗ tự nhiên (live-edge) 2 bên thân bàn, phủ bảo vệ chống thấm nước sốt vang.',
        status: 'AWAITING_PAYMENT',
        assignedStaff: 'KTS. Lê Nam',
        quotedPrice: 48000000,
        quotedDeposit: 14400000,
        contractScanUrl: '/assets/img/furniture-placeholder.svg',
        contractSignedAt: dDaysAgo(1),
        adminNotes: 'Đã ký hợp đồng tại văn phòng DCOR Villa Q.7. Đang xuất mã VietQR cọc 30%.',
        createdAt: dDaysAgo(6),
        updatedAt: dHoursAgo(10),
        timeline: [
          {
            status: 'AWAITING_PAYMENT',
            title: 'Ký kết hợp đồng HĐ-2026/DCOR-05 & Chờ đặt cọc 30%',
            description: 'Chị Trang đã ký trực tiếp tại showroom DCOR. Hệ thống đã phát hành thông tin đặt cọc 30%.',
            timestamp: dDaysAgo(1),
            performedBy: 'KTS. Lê Nam'
          }
        ]
      },

      // 6. AWAITING_CONTRACT: Chờ ký hợp đồng may đo (Bước 4: Hợp đồng - Chờ khách ký HĐ)
      {
        id: 'cr-106',
        code: 'CR-0006',
        customerName: 'Vũ Đức Thịnh',
        customerPhone: '0966332211',
        customerEmail: 'thinh.vu@fpt.com',
        customerAddress: 'Shophouse B4 Nam An Khánh, Hoài Đức, Hà Nội',
        productId: 'prod-sofa-curved',
        productName: 'Sofa Cong Bo Tròn Nghệ Thuật Kèm Đôn Đôi',
        productSku: 'SF-CURVED-01',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Sofa May Đo',
        length: 320,
        width: 110,
        height: 80,
        colorName: 'Vải Nỉ Dệt Boucle Trắng Kem',
        colorHex: '#E5DEC9',
        material: 'Vải nỉ lông cừu Boucle chống bám bụi bẩn',
        legMaterial: 'Đế gỗ âm sàn tạo hiệu ứng bay floating',
        notes: 'Cần bo cong bán kính R2400mm theo vách tường kính cong của phòng khách.',
        referenceImages: [
          '/assets/img/furniture-placeholder.svg',
          '/assets/img/furniture-placeholder.svg'
        ],
        status: 'AWAITING_CONTRACT',
        assignedStaff: 'KTS. Lê Hoàng',
        quotedPrice: 38000000,
        quotedDeposit: 11400000,
        drawing3dUrl: '/assets/img/about_blueprint.jpg',
        adminNotes: 'Anh Thịnh đã duyệt bản vẽ 3D và báo giá 38.000.000 đ. Đang gửi hợp đồng may đo điện tử để anh Thịnh ký xác nhận.',
        createdAt: dDaysAgo(7),
        updatedAt: dHoursAgo(3),
        timeline: [
          {
            status: 'QUOTED',
            title: 'Chốt báo giá & thiết kế 3D',
            description: 'Đã gửi báo giá 38.000.000 đ (cọc 30%: 11.400.000 đ) và bản vẽ 3D.',
            timestamp: dDaysAgo(2),
            performedBy: 'KTS. Lê Hoàng'
          },
          {
            status: 'AWAITING_CONTRACT',
            title: 'Phát hành Hợp đồng may đo HD-DCOR-2026/CR-0006',
            description: 'Hợp đồng may đo đã soạn thảo, chờ khách ký xác nhận điện tử.',
            timestamp: dHoursAgo(3),
            performedBy: 'Phòng Pháp Chế DCor'
          }
        ]
      },

      // 6b. QC_PASSED: Nghiệm thu xưởng đạt 100%, đã tạo biến thể & lên đơn hàng -> Sẵn sàng bàn giao thu 70%
      {
        id: 'cr-110',
        code: 'CR-0010',
        customerName: 'Nguyễn Văn Hoàng',
        customerPhone: '0912334455',
        customerEmail: 'hoang.nguyen@vinfast.vn',
        customerAddress: 'Villa 12 Khu Đô Thị Sala, TP. Thủ Đức, TP.HCM',
        productId: 'prod-lounge-chair',
        productName: 'Ghế Thư Giãn Lounge Chair Da Bò Ý Chân Xoay PVD',
        productSku: 'DCOR-ARM-01',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Ghế Thư Giãn Custom',
        length: 95,
        width: 85,
        height: 105,
        colorName: 'Nâu Cognac Da Bò Ý',
        colorHex: '#8B4513',
        material: 'Da bò Ý Full Grain tự nhiên',
        legMaterial: 'Chân xoay hợp kim mạ PVD vàng Champagne',
        notes: 'Chân xoay 360 độ êm ái, bọc da nguyên tấm mặt ngồi và tựa lưng.',
        status: 'QC_PASSED',
        assignedStaff: 'KTS. Lê Hoàng',
        quotedPrice: 22000000,
        quotedDeposit: 6600000,
        drawing3dUrl: '/assets/img/about_blueprint.jpg',
        contractScanUrl: '/assets/img/furniture-placeholder.svg',
        contractSignedAt: dDaysAgo(3),
        generatedOrderNumber: 'DCOR-ORD-CUST-0010',
        workOrderCode: 'WO-MK-0010',
        qcPassedAt: dDaysAgo(1),
        qcInspector: 'KTS. Lê Hoàng (Trưởng bộ phận QC)',
        qcChecklist: {
          dimensionAccuracy: true,
          surfaceFinish: true,
          cushionStitching: true,
          packagingProtection: true
        },
        customVariant: {
          id: 'var-cr-110',
          name: 'Ghế Lounge Chair Da Ý - Nâu Cognac May Đo Sala',
          sku: 'DCOR-ARM-01-CUST-110',
          price: 22000000,
          stock: 1,
          status: 'private',
          isPrivate: true,
          images: ['/assets/img/furniture-placeholder.svg'],
          attributes: [
            { label: 'Kích thước', value: '95 x 85 x 105 cm' },
            { label: 'Chất liệu', value: 'Da bò Ý Full Grain tự nhiên' },
            { label: 'Chân đế', value: 'Chân xoay hợp kim mạ PVD vàng Champagne' }
          ],
          createdAt: dDaysAgo(1)
        },
        adminNotes: 'Đã hoàn thành sản xuất tại xưởng, kiểm tra QC 4/4 đạt chuẩn. Đã tạo biến thể riêng và sinh đơn hàng DCOR-ORD-CUST-0010.',
        createdAt: dDaysAgo(5),
        updatedAt: dHoursAgo(1),
        timeline: [
          {
            status: 'CONTRACT_SIGNED',
            title: 'Hợp đồng may đo đã ký',
            description: 'Khách ký HĐ điện tử thành công.',
            timestamp: dDaysAgo(3),
            performedBy: 'Nguyễn Văn Hoàng'
          },
          {
            status: 'AWAITING_PAYMENT',
            title: 'Thanh toán cọc 6.600.000 đ',
            description: 'Khách đã quét VietQR chuyển cọc 30%.',
            timestamp: dDaysAgo(2),
            performedBy: 'Hệ thống DCor'
          },
          {
            status: 'PROCESSING',
            title: 'Gia công sản xuất theo lệnh WO-MK-0010',
            description: 'Đã gia công hoàn tất khung ghế và bọc da bò Mastrotto tại xưởng.',
            timestamp: dDaysAgo(2),
            performedBy: 'Xưởng may đo DCOR'
          },
          {
            status: 'QC_PASSED',
            title: 'Kiểm định QC 4 tiêu chí ĐẠT & Sinh đơn hàng',
            description: 'QC 4/4 tiêu chuẩn đạt xuất sắc. Đã tạo biến thể riêng và sinh đơn hàng DCOR-ORD-CUST-0010.',
            timestamp: dDaysAgo(1),
            performedBy: 'KTS. Lê Hoàng'
          }
        ]
      },

      // 7. PROCESSING: Đang sản xuất tại xưởng (Chưa lên đơn hàng hệ thống)
      {
        id: 'cr-107',
        code: 'CR-0007',
        customerName: 'Phạm Minh Trí',
        customerPhone: '0989001122',
        customerEmail: 'tri.pham@sun-group.vn',
        customerAddress: 'Biệt thự Đảo Kim Cương, Thạnh Mỹ Lợi, TP. Thủ Đức',
        productId: 'prod-sofa-vip',
        productName: 'Bộ Sofa Hoàng Gia Bọc Da Bò Nappa Thượng Hạng',
        productSku: 'SF-NAPPA-VIP',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Sofa May Đo',
        length: 360,
        width: 120,
        height: 90,
        colorName: 'Xanh Rêu Đậm Royal Green',
        colorHex: '#14532D',
        material: 'Da bò Ý Nappa mộc tự nhiên không phủ màu hóa chất',
        legMaterial: 'Chân đồng thau đúc nguyên khối',
        notes: 'Xưởng cần đóng khung gỗ Teak chịu lực cao, đệm mút D50 đàn hồi nhanh.',
        status: 'PROCESSING',
        assignedStaff: 'KTS. Trần Minh',
        quotedPrice: 95000000,
        quotedDeposit: 28500000,
        drawing3dUrl: '/assets/img/about_blueprint.jpg',
        contractScanUrl: '/assets/img/furniture-placeholder.svg',
        contractSignedAt: dDaysAgo(5),
        workOrderCode: 'WO-MK-0007',
        qcChecklist: {
          dimensionAccuracy: false,
          surfaceFinish: false,
          cushionStitching: false,
          packagingProtection: false
        },
        adminNotes: 'Đã nhận cọc 28.500.000 đ vào tài khoản VietinBank. Đang trong giai đoạn gia công tại xưởng theo lệnh WO-MK-0007.',
        createdAt: dDaysAgo(10),
        updatedAt: dDaysAgo(3),
        timeline: [
          {
            status: 'AWAITING_PAYMENT',
            title: 'Chờ nhận cọc 28.500.000 đ',
            description: 'Khách nhận thông báo thanh toán qua VietQR.',
            timestamp: dDaysAgo(4),
            performedBy: 'Kế toán DCor'
          },
          {
            status: 'PROCESSING',
            title: 'Xác nhận cọc 30% - Bắn lệnh sản xuất xưởng',
            description: 'Kế toán đã duyệt cọc. Lệnh sản xuất WO-MK-0007 đã được chuyển tới xưởng may đo.',
            timestamp: dDaysAgo(3),
            performedBy: 'Quản đốc xưởng DCor'
          }
        ]
      },

      // 8. COMPLETED: Giao hàng, thu 70% còn lại & Kích hoạt bảo hành (Khép kín 100% sơ đồ)
      {
        id: 'cr-108',
        code: 'CR-0008',
        customerName: 'Hoàng Minh Châu',
        customerPhone: '0909123456',
        customerEmail: 'minhchau.hoang@gmail.com',
        customerAddress: 'Biệt thự B12 Khu Chateau, Phú Mỹ Hưng, Q.7, TP.HCM',
        productId: 'prod-sofa-corner-prestige',
        productName: 'Sofa Băng Cong May Đo Bọc Da Mastrotto Florence',
        productSku: 'SF-FLORENCE-CUSTOM',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Sofa May Đo',
        length: 340,
        width: 110,
        height: 85,
        colorName: 'Nâu Da Bò Mộc Mastrotto',
        colorHex: '#8B4513',
        material: 'Da Mastrotto Full Grain 1.6mm Ý',
        legMaterial: 'Chân gỗ tự nhiên sơn bóng mờ',
        status: 'COMPLETED',
        assignedStaff: 'KTS. Lê Nam',
        quotedPrice: 65000000,
        quotedDeposit: 19500000,
        drawing3dUrl: '/assets/img/about_blueprint.jpg',
        contractScanUrl: '/assets/img/furniture-placeholder.svg',
        contractSignedAt: dDaysAgo(15),
        generatedOrderNumber: 'DCOR-ORD-CUST-0008',
        workOrderCode: 'WO-MK-0008',
        qcPassedAt: dDaysAgo(2),
        qcInspector: 'KTS. Lê Nam (Trưởng bộ phận QC)',
        qcChecklist: {
          dimensionAccuracy: true,
          surfaceFinish: true,
          cushionStitching: true,
          packagingProtection: true
        },
        customVariant: {
          id: 'var-cr-108',
          name: 'Sofa Băng Cong May Đo Bọc Da Mastrotto Florence',
          sku: 'SF-FLORENCE-CUST-108',
          price: 65000000,
          stock: 1,
          status: 'private',
          isPrivate: true,
          images: ['/assets/img/furniture-placeholder.svg'],
          attributes: [
            { label: 'Kích thước', value: '340 x 110 x 85 cm' },
            { label: 'Chất liệu', value: 'Da Mastrotto Full Grain 1.6mm Ý' },
            { label: 'Chân đế', value: 'Chân gỗ tự nhiên sơn bóng mờ' }
          ],
          createdAt: dDaysAgo(3)
        },
        warrantyCode: 'BH-DCOR-0008',
        deliveredAt: dDaysAgo(1),
        finalPaymentReceived: true,
        adminNotes: 'Đã nghiệm thu QC 4 tiêu chí đạt tuyệt đối. Đã bàn giao lắp đặt tại villa của chị Châu, thu 45.500.000 đ (70%) và kích hoạt bảo hành điện tử chính hãng 5 năm BH-DCOR-0008.',
        createdAt: dDaysAgo(20),
        updatedAt: dDaysAgo(1),
        timeline: [
          {
            status: 'PROCESSING',
            title: 'Xác nhận cọc 30% - Đã sinh Đơn hàng & Lệnh sản xuất',
            description: 'Kế toán duyệt cọc 19.500.000 đ. Đã sinh đơn DCOR-ORD-CUST-0008 và lệnh xưởng WO-MK-0008.',
            timestamp: dDaysAgo(12),
            performedBy: 'Kế toán DCor'
          },
          {
            status: 'QC_PASSED',
            title: 'Nghiệm thu QC May đo 4 tiêu chí khắt khe - ĐẠT CHUẨN',
            description: 'Sai số < 3mm, bề mặt da Mastrotto hoàn hảo, đường may kép đều tăm tắp, màng PE bọc 3 lớp.',
            timestamp: dDaysAgo(2),
            performedBy: 'KTS. Lê Nam'
          },
          {
            status: 'COMPLETED',
            title: 'Giao hàng, thu 70% còn lại & Kích hoạt Bảo hành',
            description: 'Bàn giao hoàn tất tại nhà khách, thu 45.500.000 đ. Kích hoạt chứng thư bảo hành điện tử BH-DCOR-0008 (5 năm khung sườn).',
            timestamp: dDaysAgo(1),
            performedBy: 'Điều phối viên DCOR Studio'
          }
        ]
      },

      // 9. CANCELLED: Đã hủy
      {
        id: 'cr-109',
        code: 'CR-0009',
        customerName: 'Ngô Thảo Nguyên',
        customerPhone: '0945667788',
        customerEmail: 'thaonguyen.ngo@gmail.com',
        customerAddress: 'Khu Đô Thị Ecopark, Văn Giang, Hưng Yên',
        productId: 'prod-bookshelf',
        productName: 'Kệ Sách Kịch Trần Bọc Gỗ Óc Chó Uốn Cong',
        productSku: 'KS-WALNUT-CEIL',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Tủ Kệ May Đo',
        length: 420,
        width: 40,
        height: 290,
        colorName: 'Nâu Óc Chó Đậm',
        colorHex: '#451A03',
        material: 'Gỗ óc chó Plywood chống ẩm phủ Veneer tự nhiên',
        status: 'CANCELLED',
        assignedStaff: 'KTS. Lê Nam',
        cancelReason: 'Kích thước cao 2.9m không thể đưa vào thang máy chung cư và khách đổi phương án chuyển nhà.',
        cancelledAt: dDaysAgo(6),
        createdAt: dDaysAgo(14),
        updatedAt: dDaysAgo(6),
        timeline: [
          {
            status: 'CONSULTING',
            title: 'Khảo sát hiện trạng tòa nhà',
            description: 'KTS đo chiều cao cửa thang máy chung cư chỉ đạt 2.3m, không khả thi đưa tủ nguyên khối vào nhà.',
            timestamp: dDaysAgo(7),
            performedBy: 'KTS. Lê Nam'
          },
          {
            status: 'CANCELLED',
            title: 'Hủy hồ sơ may đo',
            description: 'Khách hàng đồng ý dừng triển khai theo tư vấn an toàn của KTS.',
            timestamp: dDaysAgo(6),
            performedBy: 'Admin'
          }
        ]
      },

      // 10. CR-0011: Đang khảo sát (CONSULTING) - Sản phẩm phụ kiện KHÔNG có kích thước may đo
      {
        id: 'cr-111',
        code: 'CR-0011',
        customerName: 'Bùi Thanh Hương',
        customerPhone: '0918776655',
        customerEmail: 'thanhhuong.bui@gmail.com',
        customerAddress: 'Căn 12A Tòa Landmark 3 Vinhomes Central Park, Bình Thạnh, TP.HCM',
        productId: '00c5f2a7-b233-41ef-a57c-011d2df92f58',
        productName: 'Đệm Ngồi & Tựa Lưng Ghế Thư Giãn Cancún',
        productSku: 'ACC-CUSHION-CANCUN',
        productImage: '/assets/img/furniture-placeholder.svg',
        categoryName: 'Phụ Kiện Cao Cấp',
        hasDimensions: false,
        basePrice: 5800000,
        originalDimensions: '',
        requestedDimensions: '',
        colorName: 'Xanh Mint Pastel',
        colorHex: '#A7F3D0',
        material: 'Vải nỉ chống thấm nước cao cấp Sunbrella',
        status: 'CONSULTING',
        assignedStaff: 'KTS. Lê Nam',
        notes: 'Khách muốn đặt may thêm 2 bộ đệm ngồi và tựa lưng rời màu xanh pastel chất vải chống bám bẩn.',
        createdAt: dDaysAgo(1),
        updatedAt: dHoursAgo(3),
        timeline: [
          {
            status: 'PENDING_REVIEW',
            title: 'Tiếp nhận yêu cầu may đệm Cancún',
            description: 'Khách gửi yêu cầu đặt may riêng đệm bọc vải ngoại thất.',
            timestamp: dDaysAgo(1),
            performedBy: 'Bùi Thanh Hương'
          },
          {
            status: 'CONSULTING',
            title: 'Phân công KTS khảo sát chất liệu',
            description: 'KTS. Lê Nam nhận liên hệ tư vấn chọn vải Sunbrella.',
            timestamp: dHoursAgo(3),
            performedBy: 'KTS. Lê Nam'
          }
        ]
      }
    ];
  }
}
