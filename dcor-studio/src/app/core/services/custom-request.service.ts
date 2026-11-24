import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type CustomRequestStatus =
  | 'PENDING_REVIEW'
  | 'CONSULTING'
  | 'QUOTED'
  | 'AWAITING_CONTRACT'
  | 'CONTRACT_SIGNED'
  | 'AWAITING_PAYMENT'
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
  quotedPrice?: number;      // Giá báo giá
  quotedDeposit?: number;    // Tiền đặt cọc cần thanh toán (30%)
  quotedAt?: string;
  contractScanUrl?: string;  // Ảnh scan hợp đồng ký
  contractSignedAt?: string;
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
  deliveredAt?: string;
  finalPaymentReceived?: boolean;

  // Liên kết hệ thống
  generatedOrderNumber?: string;
  workOrderCode?: string;

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
    adminLabel: 'Đã báo giá & bản vẽ 3D',
    customerLabel: 'Đã gửi báo giá 3D',
    color: '#7c3aed',
    bgColor: '#f3e8ff',
    borderColor: '#ddd6fe',
    description: 'KTS hoàn thiện phối cảnh 3D + bóc tách dự toán giá & cọc 30%.',
    stepIndex: 3
  },
  AWAITING_CONTRACT: {
    adminLabel: 'Chờ ký hợp đồng',
    customerLabel: 'Chờ ký hợp đồng',
    color: '#ea580c',
    bgColor: '#ffedd5',
    borderColor: '#fed7aa',
    description: 'Khách duyệt phương án 3D & dự toán, chuyển sang bước ký kết hợp đồng kinh tế.',
    stepIndex: 4
  },
  CONTRACT_SIGNED: {
    adminLabel: 'Đã ký hợp đồng',
    customerLabel: 'Đã ký HĐ - Chờ cọc',
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#a7f3d0',
    description: 'Hợp đồng may đo đã có chữ ký 2 bên và lưu kho bản scan.',
    stepIndex: 5
  },
  AWAITING_PAYMENT: {
    adminLabel: 'Chờ nhận cọc 30%',
    customerLabel: 'Chờ thanh toán cọc',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: '#bae6fd',
    description: 'Hệ thống đã phát hành mã VietQR cọc 30%. Chờ kế toán xác nhận nhận tiền.',
    stepIndex: 6
  },
  PROCESSING: {
    adminLabel: 'Đang sản xuất tại xưởng',
    customerLabel: 'Đang sản xuất tại xưởng',
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    description: 'Đã nhận cọc 30%. Đã sinh Đơn hàng chính thức và phát Lệnh sản xuất xuống xưởng.',
    stepIndex: 7
  },
  QC_PASSED: {
    adminLabel: 'Đã nghiệm thu QC 4 tiêu chí',
    customerLabel: 'Hoàn thiện & Đạt chuẩn QC',
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    description: 'Đã nghiệm thu QC may đo 4 tiêu chí khắt khe: Kích thước sai số < 5mm, bề mặt da láng mịn, mút & chỉ kép, bọc góc đóng gói.',
    stepIndex: 8
  },
  COMPLETED: {
    adminLabel: 'Đã giao hàng & Kích hoạt BH',
    customerLabel: 'Hoàn tất bàn giao & Bảo hành',
    color: '#15803d',
    bgColor: '#dcfce7',
    borderColor: '#86efac',
    description: 'Bàn giao lắp đặt tại nhà, thu đủ 70% còn lại và kích hoạt chứng thư bảo hành điện tử chính hãng 5 năm.',
    stepIndex: 9
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
  private readonly STORAGE_KEY = 'dcor_admin_custom_requests';
  private requestsSubject = new BehaviorSubject<CustomRequest[]>([]);
  public requests$: Observable<CustomRequest[]> = this.requestsSubject.asObservable();

  constructor() {
    this.initData();
  }

  private initData(): void {
    if (typeof window === 'undefined') {
      this.requestsSubject.next(this.getInitialSeedRequests());
      return;
    }

    try {
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
                referenceImages: item.referenceImages?.length ? item.referenceImages : seed.referenceImages, 
                productImage: item.productImage || seed.productImage,
                budgetRange: item.budgetRange || seed.budgetRange,
                estimatedBudget: item.estimatedBudget || seed.estimatedBudget,
                preferredSurveyTime: item.preferredSurveyTime || seed.preferredSurveyTime,
                expectedDeliveryDate: item.expectedDeliveryDate || seed.expectedDeliveryDate,
                roomSpace: item.roomSpace || seed.roomSpace,
                originalDimensions: item.originalDimensions || seed.originalDimensions,
                requestedDimensions: item.requestedDimensions || seed.requestedDimensions,
                customDimensionNote: item.customDimensionNote || seed.customDimensionNote,
                customizedAttributes: item.customizedAttributes || seed.customizedAttributes,
                attachments: item.attachments || seed.attachments,
                basePrice: item.basePrice || seed.basePrice,
                requirementDetails: item.requirementDetails || seed.requirementDetails,
                isPhoneVerified: item.isPhoneVerified !== undefined ? item.isPhoneVerified : seed.isPhoneVerified
              };
            }
            return item;
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

          this.saveToStorage(merged);
          this.requestsSubject.next(merged);
          return;
        }
      }
    } catch (_) {}

    const seeds = this.getInitialSeedRequests();
    this.saveToStorage(seeds);
    this.requestsSubject.next(seeds);
  }

  public get requestsValue(): CustomRequest[] {
    return this.requestsSubject.value;
  }

  public getRequests(): CustomRequest[] {
    return this.requestsSubject.value;
  }

  public getRequestById(id: string): CustomRequest | undefined {
    return this.requestsSubject.value.find(r => r.id === id || r.code === id);
  }

  public getById(id: string): CustomRequest | undefined {
    return this.getRequestById(id);
  }

  private saveToStorage(list: CustomRequest[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      } catch (_) {}
    }
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
      productImage: data.productImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
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
    return newRequest;
  }

  // --- THAO TÁC THEO TỪNG BƯỚC QUY TRÌNH ---

  /** Phân công Kiến trúc sư phụ trách hồ sơ (Role: Kiến trúc sư) */
  assignArchitect(id: string, staffName: string): CustomRequest | undefined {
    const target = this.getById(id);
    if (!target) return undefined;
    target.assignedStaff = staffName;
    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = { ...target };
      this.saveToStorage(current);
      this.requestsSubject.next(current);
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

  /** Cập nhật biên bản đo đạc & ghi chú/file khảo sát thực tế của KTS */
  updateSurveyRecord(
    id: string,
    data: {
      surveyNotes?: string;
      surveyAttachment?: CustomAttachmentItem;
    }
  ): CustomRequest | undefined {
    const target = this.getById(id);
    if (!target) return undefined;
    target.surveyNotes = data.surveyNotes;
    target.surveyAttachment = data.surveyAttachment;
    target.updatedAt = new Date().toISOString();

    const current = [...this.requestsSubject.value];
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = { ...target };
      this.saveToStorage(current);
      this.requestsSubject.next(current);
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
      notes?: string;
      staffName?: string;
    }
  ): CustomRequest | undefined {
    const deposit = quoteData.quotedDeposit || Math.round(quoteData.quotedPrice * 0.3);
    const target = this.requestsSubject.value.find(r => r.id === id);
    const nextStatus: CustomRequestStatus = target?.status === 'QUOTED' ? 'AWAITING_CONTRACT' : 'QUOTED';
    return this.updateStatus(id, nextStatus, {
      title: 'Đã hoàn thiện báo giá dự toán & bản vẽ 3D',
      description: `Báo giá chính thức: ${new Intl.NumberFormat('vi-VN').format(quoteData.quotedPrice)} đ (Cọc 30%: ${new Intl.NumberFormat('vi-VN').format(deposit)} đ). Đã phát hành bản vẽ 3D phối cảnh.`,
      performedBy: quoteData.staffName || 'Ban Báo Giá DCor',
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

  /** Bước 3b: Xác nhận đã ký hợp đồng, chuyển sang CONTRACT_SIGNED */
  confirmContractSigned(id: string, contractScanUrl?: string, staffName: string = 'KTS. DCor'): CustomRequest | undefined {
    return this.updateStatus(id, 'CONTRACT_SIGNED', {
      title: 'Hợp đồng may đo đã được ký kết',
      description: 'Hai bên đã ký kết hợp đồng may đo sản xuất. Đã lưu trữ bản scan hợp đồng có chữ ký vào hệ thống.',
      performedBy: staffName,
      contractScanUrl: contractScanUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      contractSignedAt: new Date().toISOString()
    });
  }

  /** Bước 4: Phát hành mã VietQR cọc 30%, chuyển sang AWAITING_PAYMENT */
  requestPayment(id: string, staffName: string = 'Kế toán DCor'): CustomRequest | undefined {
    return this.updateStatus(id, 'AWAITING_PAYMENT', {
      title: 'Phát hành mã VietQR thanh toán cọc 30%',
      description: 'Hệ thống đã khởi tạo mã QR chuyển khoản đặt cọc 30% gửi qua SMS/Zalo cho khách.',
      performedBy: staffName
    });
  }

  /** Bước 5: Kế toán xác nhận nhận cọc 30% -> TỰ ĐỘNG SINH ĐƠN HÀNG & BẮN XƯỞNG -> Chuyển PROCESSING */
  confirmPaymentAndStartProduction(
    id: string, 
    staffName: string = 'Quản đốc xưởng DCor'
  ): { updatedRequest: CustomRequest; generatedOrderNumber: string; workOrderCode: string } | undefined {
    const target = this.getById(id);
    if (!target) return undefined;

    const generatedOrderNumber = `DCOR-ORD-${target.code.replace('CR-', 'CUST-')}`;
    const workOrderCode = `WO-${target.code.replace('CR-', 'MK-')}`;

    const updated = this.updateStatus(id, 'PROCESSING', {
      title: 'Xác nhận cọc 30% - Sinh Đơn hàng & Bắn xưởng sản xuất',
      description: `Kế toán xác nhận nhận cọc thành công. Hệ thống tự động sinh Đơn hàng chính thức ${generatedOrderNumber} và phát lệnh sản xuất xưởng ${workOrderCode}.`,
      performedBy: staffName
    });

    if (!updated) return undefined;

    // Gắn mã liên kết vào request
    updated.generatedOrderNumber = generatedOrderNumber;
    updated.workOrderCode = workOrderCode;
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
          workOrderCode: workOrderCode,
          customRequestId: updated.code,
          note: `[Đơn May Đo Riêng - Hồ sơ ${updated.code}] Kích thước: ${updated.length}x${updated.width}x${updated.height} cm. Chất liệu: ${updated.material}. Màu sắc: ${updated.colorName}. Ghi chú: ${updated.notes || 'Không có'}`,
          products: [
            {
              id: updated.productId || 'prod-custom',
              name: `[May đo] ${updated.productName}`,
              sku: `${updated.productSku || 'DCOR-CUSTOM'}-CUSTOM`,
              variant: `${updated.length}x${updated.width}x${updated.height} cm | ${updated.material || 'Da bò Ý'} | ${updated.colorName || 'Màu đặt riêng'}`,
              imageUrl: updated.productImage || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
              price: updated.quotedPrice || 35000000,
              quantity: 1,
              lineTotal: updated.quotedPrice || 35000000,
              stockAvailable: 1
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
        console.warn('Lỗi ghi localStorage đơn hàng custom:', e);
      }
    }

    return { updatedRequest: updated, generatedOrderNumber, workOrderCode };
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
    if (meta.assignedStaff) item.assignedStaff = meta.assignedStaff;
    if (meta.cancelReason) item.cancelReason = meta.cancelReason;
    if (meta.cancelledAt) item.cancelledAt = meta.cancelledAt;

    item.timeline = [
      ...item.timeline,
      {
        status: newStatus,
        title: meta.title,
        description: meta.description,
        timestamp: now,
        performedBy: (meta.performedBy || '').replace(/\s*\(DCor Studio\)/gi, '').trim()
      }
    ];

    current[index] = item;
    this.saveToStorage(current);
    this.requestsSubject.next(current);
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
      originalDimensions: customiz.originalDimensions || specs.originalDimensions || 'Tiêu chuẩn gốc',
      requestedDimensions: customiz.requestedDimensions || specs.requestedDimensions || '',
      customDimensionNote: customiz.customDimensionNote || '',
      length: cr.length,
      width: cr.width,
      height: cr.height,
      customizedAttributes: customiz.attributes || [],
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
        productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        categoryName: 'Sofa May Đo',
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
            selectedOptionName: 'Da bò Ý Mastrotto Full Grain 1.6mm',
            isChanged: true,
            customNote: 'Da bò tự nhiên nguyên tấm dày 1.6mm, xử lý chống bám bẩn & chống cào xước do nhà nuôi mèo'
          },
          {
            groupId: 'attr-color',
            label: 'Màu sắc chỉ định',
            originalValue: 'Nâu Cognac Ý (#8B4513)',
            selectedOptionName: 'Xám Khói Mờ (Smoky Grey)',
            hexColor: '#64748B',
            isChanged: true,
            customNote: 'Gam màu xám khói trung tính sang trọng, hài hòa tone gạch ốp tường'
          },
          {
            groupId: 'attr-legs',
            label: 'Khung xương & Chân đế',
            originalValue: 'Khung gỗ sồi chân tiện tròn',
            selectedOptionName: 'Chân Inox 304 xước mạ Titan xám nòng súng',
            isChanged: true,
            customNote: 'Chân cao 12cm để robot hút bụi tự động dễ dàng vệ sinh gầm ghế'
          }
        ],
        notes: 'Góc chữ L xoay bên phải nhìn ra ban công, thêm đệm bông lông vũ lớp trên để tựa lưng thật êm. Cửa thang máy cao 2.4m rộng 1.1m (cần tháo lắp module khi chuyển lên tầng 24).',
        requirementDetails: 'Đặt tại phòng khách căn hộ chung cư lầu 24 Vinhomes Golden River. Thang máy tòa nhà cao 2.4m rộng 1.1m, góc chữ L xoay bên phải nhìn ra ban công sông Sài Gòn, thêm đệm bông lông vũ lớp trên để tựa lưng thật êm ái.',
        budgetRange: '22.000.000 đ - 26.000.000 đ',
        estimatedBudget: '25.000.000',
        preferredSurveyTime: 'Thứ 7 tuần này (09:00 - 11:30 sáng)',
        expectedDeliveryDate: 'Trước 25/11/2026 (khoảng 20 ngày)',
        roomSpace: 'Phòng khách căn hộ chung cư Vinhomes Golden River (85m²)',
        attachments: [
          {
            id: 'att-1',
            name: 'hien-trang-phong-khach-can-ho.jpg',
            size: '2.4 MB',
            type: 'image/jpeg',
            previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'att-2',
            name: 'phoi-canh-goc-sofa-mong-muon.jpg',
            size: '1.8 MB',
            type: 'image/jpeg',
            previewUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
          },
          {
            id: 'att-3',
            name: 'ban-ve-so-bo-kich-thuoc-tuong.png',
            size: '850 KB',
            type: 'image/png',
            previewUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80'
          }
        ],
        referenceImages: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80'
        ],
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
        productImage: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
        categoryName: 'Sofa May Đo',
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
          'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=80'
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
        productImage: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
        categoryName: 'Bàn Trà Custom',
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
          'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'QUOTED',
        assignedStaff: 'KTS. Lê Nam',
        quotedPrice: 24500000,
        quotedDeposit: 7350000,
        drawing3dUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
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
        productImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
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
        drawing3dUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef8?auto=format&fit=crop&w=1200&q=80',
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

      // 5. CONTRACT_SIGNED: Đã ký hợp đồng
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
        productImage: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=600&q=80',
        categoryName: 'Bàn Ăn Custom',
        length: 260,
        width: 100,
        height: 76,
        colorName: 'Màu Óc Chó Tự Nhiên Sơn PU 5 Lớp',
        colorHex: '#451A03',
        material: 'Gỗ óc chó Bắc Mỹ tuyển chọn vân chun sụn',
        legMaterial: 'Chân sắt uốn nghệ thuật sơn tĩnh điện cát sần',
        notes: 'Giữ lại mép gỗ tự nhiên (live-edge) 2 bên thân bàn, phủ bảo vệ chống thấm nước sốt vang.',
        status: 'CONTRACT_SIGNED',
        assignedStaff: 'KTS. Lê Nam',
        quotedPrice: 48000000,
        quotedDeposit: 14400000,
        contractScanUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
        contractSignedAt: dDaysAgo(1),
        adminNotes: 'Đã ký hợp đồng tại văn phòng DCOR Villa Q.7. Đang xuất mã VietQR cọc 30%.',
        createdAt: dDaysAgo(6),
        updatedAt: dHoursAgo(10),
        timeline: [
          {
            status: 'CONTRACT_SIGNED',
            title: 'Ký kết hợp đồng HĐ-2026/DCOR-05',
            description: 'Chị Trang đã ký trực tiếp tại showroom DCOR.',
            timestamp: dDaysAgo(1),
            performedBy: 'KTS. Lê Nam'
          }
        ]
      },

      // 6. AWAITING_PAYMENT: Chờ thanh toán cọc 30%
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
        productImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
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
          'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
        ],
        status: 'AWAITING_PAYMENT',
        assignedStaff: 'KTS. Lê Hoàng',
        quotedPrice: 38000000,
        quotedDeposit: 11400000,
        drawing3dUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        contractScanUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
        contractSignedAt: dDaysAgo(2),
        adminNotes: 'Đã bắn mã VietQR cọc 11.400.000 đ vào Zalo của anh Thịnh, chờ kế toán kiểm tra giao dịch vào tài khoản.',
        createdAt: dDaysAgo(7),
        updatedAt: dHoursAgo(3),
        timeline: [
          {
            status: 'CONTRACT_SIGNED',
            title: 'Hợp đồng may đo đã ký',
            description: 'Khách ký HĐ điện tử qua SMS OTP.',
            timestamp: dDaysAgo(2),
            performedBy: 'Vũ Đức Thịnh'
          },
          {
            status: 'AWAITING_PAYMENT',
            title: 'Phát hành mã VietQR cọc 11.400.000 đ',
            description: 'Chờ kế toán đối soát giao dịch chuyển khoản ngân hàng.',
            timestamp: dHoursAgo(3),
            performedBy: 'Kế toán DCor'
          }
        ]
      },

      // 7. PROCESSING: Đang sản xuất tại xưởng (Đã sinh đơn hàng chính thức)
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
        productImage: 'https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=600&q=80',
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
        drawing3dUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        contractScanUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
        contractSignedAt: dDaysAgo(5),
        generatedOrderNumber: 'DCOR-ORD-CUST-0007',
        workOrderCode: 'WO-MK-0007',
        adminNotes: 'Đã nhận cọc 28.500.000 đ vào tài khoản VietinBank. Đã bắn đơn sang phân hệ Đơn hàng DCOR-ORD-CUST-0007 và xuất kho gỗ teak, 42m da Nappa.',
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
            title: 'Xác nhận cọc 30% - Đã sinh Đơn hàng & Bắn xưởng',
            description: 'Kế toán đã duyệt cọc. Tự động sinh đơn DCOR-ORD-CUST-0007 và lệnh sản xuất WO-MK-0007.',
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
        productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
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
        drawing3dUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        contractScanUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
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
        productImage: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=600&q=80',
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
      }
    ];
  }
}
