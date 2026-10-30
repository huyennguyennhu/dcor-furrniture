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
  | 'CANCELLED';

export interface CustomRequestTimeline {
  status: CustomRequestStatus;
  title: string;
  description: string;
  timestamp: string;
  performedBy: string;
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

  // Sản phẩm gốc tùy chỉnh
  productId?: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  categoryName?: string;

  // Thông số kỹ thuật may đo
  length?: number;     // Chiều dài (cm)
  width?: number;      // Chiều rộng / sâu (cm)
  height?: number;     // Chiều cao (cm)
  colorName?: string;  // Tên màu (ví dụ: Nâu Cognac Ý, Kem Sand Luxury...)
  colorHex?: string;   // Mã màu hiển thị
  material?: string;   // Chất liệu bề mặt (Da bò Ý Full Grain, Da Microfiber, Gỗ óc chó...)
  legMaterial?: string;// Chất liệu chân/khung
  notes?: string;      // Ghi chú của khách
  referenceImages?: string[]; // Ảnh đính kèm/phòng khách

  // Trạng thái hệ thống (Enum)
  status: CustomRequestStatus;

  // Dữ liệu nghiệp vụ Admin
  assignedStaff?: string;
  adminNotes?: string;
  drawing3dUrl?: string;     // Link bản vẽ 3D
  quotedPrice?: number;      // Giá báo giá
  quotedDeposit?: number;    // Tiền đặt cọc cần thanh toán
  quotedAt?: string;
  contractScanUrl?: string;  // Ảnh scan hợp đồng ký
  contractSignedAt?: string;
  cancelReason?: string;
  cancelledAt?: string;

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
    adminLabel: 'Tiếp nhận yêu cầu mới',
    customerLabel: 'Đã gửi yêu cầu',
    color: '#d97706',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    description: 'Khách gửi form thành công từ web. Đơn nằm trong danh sách chờ admin xử lý.',
    stepIndex: 1
  },
  CONSULTING: {
    adminLabel: 'Đang liên hệ & khảo sát',
    customerLabel: 'Đang xử lý yêu cầu',
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    description: 'Admin bấm nhận việc, gọi điện chốt kích thước/vật liệu, chỉnh sửa trực tiếp form thông tin.',
    stepIndex: 2
  },
  QUOTED: {
    adminLabel: 'Đã gửi báo giá & bản vẽ',
    customerLabel: 'Đã gửi báo giá qua Email/SMS',
    color: '#7c3aed',
    bgColor: '#f3e8ff',
    borderColor: '#ddd6fe',
    description: 'Admin upload bản vẽ + nhập giá/draft -> Bấm "Gửi báo giá" -> Hệ thống tự động bắn Email/SMS cho khách.',
    stepIndex: 3
  },
  AWAITING_CONTRACT: {
    adminLabel: 'Chờ ký hợp đồng',
    customerLabel: 'Chờ ký hợp đồng',
    color: '#ea580c',
    bgColor: '#ffedd5',
    borderColor: '#fed7aa',
    description: 'Khách đồng ý báo giá qua email/điện thoại -> Admin chuyển trạng thái, chuẩn bị hợp đồng giấy mang đi ký hoặc gửi ký offline.',
    stepIndex: 4
  },
  CONTRACT_SIGNED: {
    adminLabel: 'Đã ký hợp đồng',
    customerLabel: 'Đã ký hợp đồng - Chờ thanh toán',
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#a7f3d0',
    description: 'Admin gặp khách ký xong -> Vào web bấm "Đã ký hợp đồng" (có thể upload ảnh hợp đồng lưu kho).',
    stepIndex: 5
  },
  AWAITING_PAYMENT: {
    adminLabel: 'Chờ thanh toán (Cọc / Toàn phần)',
    customerLabel: 'Chờ thanh toán',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: '#bae6fd',
    description: 'Hệ thống tự động sinh ra đơn hàng chính thức từ yêu cầu custom đã ký. Admin chờ kế toán báo tiền vào hoặc khách chuyển khoản.',
    stepIndex: 6
  },
  PROCESSING: {
    adminLabel: 'Đang sản xuất / Đóng gói',
    customerLabel: 'Đang sản xuất & chuẩn bị hàng',
    color: '#16a34a',
    bgColor: '#dcfce7',
    borderColor: '#bbf7d0',
    description: 'Admin xác nhận đã nhận cọc/tiền -> Bắt đầu đưa xưởng đóng khung, gia công, đóng gói (vào luồng giao nhận bình thường).',
    stepIndex: 7
  },
  CANCELLED: {
    adminLabel: 'Đã hủy yêu cầu',
    customerLabel: 'Đã hủy',
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fecaca',
    description: 'Bất kỳ lúc nào khách báo hủy qua điện thoại/email -> Admin chọn lý do hủy và cập nhật.',
    stepIndex: 0
  }
};

const STORAGE_KEY = 'dcor_custom_requests';

@Injectable({
  providedIn: 'root'
})
export class CustomRequestService {
  private requestsSubject = new BehaviorSubject<CustomRequest[]>([]);
  public requests$ = this.requestsSubject.asObservable();

  constructor() {
    this.initData();
  }

  private initData(): void {
    let requests: CustomRequest[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        requests = JSON.parse(stored);
      }
    } catch (_) {}

    if (!requests || requests.length === 0) {
      requests = this.getInitialSeedRequests();
      this.saveToStorage(requests);
    }

    this.requestsSubject.next(requests);
  }

  private saveToStorage(items: CustomRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (_) {}
  }

  getRequests(): CustomRequest[] {
    return this.requestsSubject.value;
  }

  getRequestById(id: string): CustomRequest | undefined {
    return this.requestsSubject.value.find(r => r.id === id);
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
      status: 'PENDING_REVIEW', // Đã gửi yêu cầu
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          status: 'PENDING_REVIEW',
          title: 'Khách hàng gửi yêu cầu',
          description: `Khách hàng ${data.customerName} đã tạo yêu cầu may đo mẫu "${data.productName}" qua website.`,
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

  /**
   * Admin bấm nhận việc: Chuyển PENDING_REVIEW -> CONSULTING
   */
  startConsulting(id: string, staffName: string = 'KTS. DCor Studio'): CustomRequest | undefined {
    return this.updateStatus(id, 'CONSULTING', {
      title: 'Tiếp nhận khảo sát & tư vấn',
      description: `${staffName} đã tiếp nhận yêu cầu, đang liên hệ chốt vật liệu và kích thước thực tế.`,
      performedBy: staffName,
      assignedStaff: staffName
    });
  }

  /**
   * Admin gửi bản vẽ 3D & báo giá: Chuyển -> QUOTED
   */
  sendQuote(id: string, quoteData: {
    quotedPrice: number;
    quotedDeposit: number;
    drawing3dUrl?: string;
    notes?: string;
    staffName?: string;
  }): CustomRequest | undefined {
    const staff = quoteData.staffName || 'Ban Báo Giá DCor';
    return this.updateStatus(id, 'QUOTED', {
      title: 'Đã gửi báo giá & bản vẽ 3D',
      description: `Báo giá ${quoteData.quotedPrice.toLocaleString('vi-VN')} đ (cọc ${quoteData.quotedDeposit.toLocaleString('vi-VN')} đ) và bản vẽ 3D đã được gửi qua Email/SMS tới khách hàng.`,
      performedBy: staff,
      quotedPrice: quoteData.quotedPrice,
      quotedDeposit: quoteData.quotedDeposit,
      drawing3dUrl: quoteData.drawing3dUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
      adminNotes: quoteData.notes,
      quotedAt: new Date().toISOString()
    });
  }

  /**
   * Khách đồng ý báo giá: Chuyển -> AWAITING_CONTRACT
   */
  prepareContract(id: string, staffName: string = 'Bộ phận Hợp đồng'): CustomRequest | undefined {
    return this.updateStatus(id, 'AWAITING_CONTRACT', {
      title: 'Khách duyệt báo giá - Chuẩn bị ký hợp đồng',
      description: 'Khách hàng đã đồng ý báo giá. Admin chuẩn bị hợp đồng dịch vụ đóng may đo offline/giao tận nơi.',
      performedBy: staffName
    });
  }

  /**
   * Đã ký hợp đồng: Chuyển -> CONTRACT_SIGNED
   */
  confirmContractSigned(id: string, contractScanUrl?: string, staffName: string = 'KTS. DCor'): CustomRequest | undefined {
    return this.updateStatus(id, 'CONTRACT_SIGNED', {
      title: 'Hợp đồng may đo đã được ký kết',
      description: 'Hai bên đã ký hợp đồng sản xuất. Đã lưu trữ bản sao hợp đồng.',
      performedBy: staffName,
      contractScanUrl: contractScanUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
      contractSignedAt: new Date().toISOString()
    });
  }

  /**
   * Chuyển sang chờ thanh toán cọc: Chuyển -> AWAITING_PAYMENT
   */
  requestPayment(id: string, staffName: string = 'Kế toán DCor'): CustomRequest | undefined {
    return this.updateStatus(id, 'AWAITING_PAYMENT', {
      title: 'Tạo mã đơn hàng - Chờ thanh toán cọc',
      description: 'Đã sinh đơn hàng chính thức từ hợp đồng custom. Chờ khách chuyển khoản tiền đặt cọc.',
      performedBy: staffName
    });
  }

  /**
   * Xác nhận cọc -> Đưa xưởng sản xuất: Chuyển -> PROCESSING
   */
  confirmPaymentAndStartProduction(id: string, staffName: string = 'Quản đốc xưởng DCor'): CustomRequest | undefined {
    return this.updateStatus(id, 'PROCESSING', {
      title: 'Xác nhận cọc - Đang sản xuất & gia công',
      description: 'Kế toán xác nhận nhận tiền cọc. Đã chuyển lệnh sản xuất xuống xưởng đóng khung, bọc da và may thủ công.',
      performedBy: staffName
    });
  }

  /**
   * Hủy yêu cầu: Chuyển -> CANCELLED
   */
  cancelRequest(id: string, reason: string, staffName: string = 'Admin'): CustomRequest | undefined {
    return this.updateStatus(id, 'CANCELLED', {
      title: 'Yêu cầu may đo đã hủy',
      description: `Lý do hủy: ${reason}`,
      performedBy: staffName,
      cancelReason: reason,
      cancelledAt: new Date().toISOString()
    });
  }

  /**
   * Cập nhật trạng thái tổng quát
   */
  private updateStatus(
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

    // Merge meta fields
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
        performedBy: meta.performedBy
      }
    ];

    current[index] = item;
    this.saveToStorage(current);
    this.requestsSubject.next(current);
    return item;
  }

  private getInitialSeedRequests(): CustomRequest[] {
    const now = new Date();
    const d1 = new Date(now.getTime() - 86400000 * 2).toISOString();
    const d2 = new Date(now.getTime() - 86400000 * 5).toISOString();

    return [
      {
        id: 'cr-1',
        code: 'CR-0001',
        customerName: 'Nguyễn Văn Hùng',
        customerPhone: '0988776655',
        customerEmail: 'hung.nguyen@gmail.com',
        customerAddress: 'Phòng 1804 Tòa Park 9 Times City, Minh Khai, Hà Nội',
        productId: 'cc96ae87-5ef3-4318-a963-2941fa0583f7',
        productName: 'Sofa Da Bò Ý Carmo 3 Chỗ Phong Cách Bắc Âu',
        productSku: 'SF-CARMO-01',
        productImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        categoryName: 'Sofa May Đo',
        length: 240,
        width: 95,
        height: 85,
        colorName: 'Nâu Cognac Da Bò Ý',
        colorHex: '#8B4513',
        material: 'Da bò Ý Full Grain tự nhiên',
        legMaterial: 'Chân Inox mạ vàng champagne PVD',
        notes: 'Gia đình muốn tăng chiều cao tựa lưng lên 5cm để đỡ gáy tốt hơn, đệm mút cao su êm ái vừa phải.',
        status: 'CONSULTING',
        assignedStaff: 'KTS. Lê Hoàng (DCor Studio)',
        createdAt: d2,
        updatedAt: d1,
        timeline: [
          {
            status: 'PENDING_REVIEW',
            title: 'Khách hàng gửi yêu cầu',
            description: 'Khách gửi yêu cầu tùy biến kích thước Sofa Carmo.',
            timestamp: d2,
            performedBy: 'Nguyễn Văn Hùng'
          },
          {
            status: 'CONSULTING',
            title: 'KTS tiếp nhận khảo sát',
            description: 'KTS. Lê Hoàng đã gọi điện tư vấn kích thước và hẹn khảo sát đo đạc mặt bằng.',
            timestamp: d1,
            performedBy: 'KTS. Lê Hoàng'
          }
        ]
      },
      {
        id: 'cr-2',
        code: 'CR-0002',
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
        status: 'QUOTED',
        assignedStaff: 'Ban Báo Giá DCor',
        quotedPrice: 24500000,
        quotedDeposit: 10000000,
        drawing3dUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
        adminNotes: 'Đã gửi bản vẽ 3D chi tiết bo cạnh và bảng mẫu đá mẫu qua Zalo/Email cho chị Phương.',
        quotedAt: d1,
        createdAt: d2,
        updatedAt: d1,
        timeline: [
          {
            status: 'PENDING_REVIEW',
            title: 'Khách gửi yêu cầu',
            description: 'Yêu cầu bàn trà đá Calacatta cỡ lớn.',
            timestamp: d2,
            performedBy: 'Trần Thị Mai Phương'
          },
          {
            status: 'CONSULTING',
            title: 'Khảo sát kích thước',
            description: 'Chốt kích thước 140x80cm bo vát 4 cạnh.',
            timestamp: d2,
            performedBy: 'KTS. DCor'
          },
          {
            status: 'QUOTED',
            title: 'Đã gửi báo giá & bản vẽ 3D',
            description: 'Báo giá 24.500.000 đ (cọc 10.000.000 đ) đã gửi qua Email/SMS.',
            timestamp: d1,
            performedBy: 'Ban Báo Giá DCor'
          }
        ]
      }
    ];
  }
}
