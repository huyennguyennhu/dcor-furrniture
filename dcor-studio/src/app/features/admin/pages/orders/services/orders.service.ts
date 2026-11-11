import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { 
  Order, OrderV2, AdminOrderStatus, PaymentStatus, OrderProduct, OrderProductV2, 
  DeliveryInfo, DeliveryInfoV2, ReturnInfo, ReturnInfoV2, 
  QcChecklist, QcChecklistV2, AuditLog, AuditLogV2 
} from '../models/order.model';

const STORAGE_KEY = 'dcor_orders_v2_store';
const REPLACEMENT_ORDERS_KEY = 'dcor_replacement_orders_store';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private ordersSubject = new BehaviorSubject<OrderV2[]>([]);
  public orders$: Observable<OrderV2[]> = this.ordersSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/admin/orders`;

  private lastOrdersJson = '';
  private pollingInterval: any = null;
  private autoCheckInterval: any = null;

  constructor(private http: HttpClient) {
    this.initOrders();
    this.fetchOrders();

    // 1. Tự động đồng bộ đơn hàng mới từ Database mỗi 4 giây (Real-time polling)
    // Polling 4s da duoc go bo de triet tieu Egress va tranh lam nghen DB pool.
    // He thong cap nhat khi mo trang, khi focus lai tab, hoac khi bam nut Tai lai / thao tac don hang.

    // 2. Tự động cập nhật ngay lập tức khi người dùng quay lại tab trình duyệt
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.fetchOrders());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.fetchOrders();
        }
      });
    }

    // Tự động kiểm tra định kỳ mỗi 1 giây để chốt đơn DELIVERED khi hết hạn 72h
    // AutoCheck 1s da duoc thay the bang co che Server-side cron (backend 5 phut/lan)
    // va chi kiem tra 1 lan khi component mount.
  }

  // Tải danh sách đơn hàng thực tế từ cơ sở dữ liệu PostgreSQL
  public fetchOrders(): Observable<OrderV2[]> {
    this.http.get<OrderV2[]>(this.apiUrl).subscribe({
      next: (realOrders) => {
        if (Array.isArray(realOrders)) {
          // Luôn giữ và hợp nhất các đơn hàng đổi mới (replacement orders) đã tạo
          const combined = this.mergeWithReplacementOrders(realOrders);

          // Fingerprint so sánh để chỉ cập nhật khi có đơn mới hoặc có thay đổi trạng thái
          const fingerprint = JSON.stringify(combined.map(o => ({
            id: o.id,
            status: o.status,
            pay: o.paymentStatus,
            dep: o.depositPaid,
            tot: o.totalAmount,
            del: (o.delivery?.trackingCode || '') + '-' + (o.delivery?.failedAttempts || 0)
          })));

          if (fingerprint !== this.lastOrdersJson || this.ordersSubject.getValue().length === 0) {
            this.lastOrdersJson = fingerprint;
            this.ordersSubject.next(combined);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
            } catch (_) {}
          }
        }
      },
      error: (err) => {
        console.warn('Lỗi tải đơn hàng từ PostgreSQL backend, sử dụng cache:', err);
      }
    });
    return this.orders$;
  }

  public getReplacementOrders(): OrderV2[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const stored = localStorage.getItem(REPLACEMENT_ORDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  }

  public saveReplacementOrder(order: OrderV2): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const list = this.getReplacementOrders();
      const idx = list.findIndex(o => o.orderNumber === order.orderNumber || o.id === order.id);
      if (idx >= 0) {
        list[idx] = order;
      } else {
        list.unshift(order);
      }
      localStorage.setItem(REPLACEMENT_ORDERS_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  private mergeWithReplacementOrders(orders: OrderV2[]): OrderV2[] {
    const replacements = this.getReplacementOrders();
    if (!replacements || replacements.length === 0) return orders;

    const merged = [...orders];
    for (const ro of replacements) {
      const idx = merged.findIndex(o => o.id === ro.id || o.orderNumber === ro.orderNumber);
      if (idx >= 0) {
        merged[idx] = ro;
      } else {
        merged.unshift(ro);
      }
    }
    return merged;
  }

  public seedDefaultReplacementOrders(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const current = this.getReplacementOrders();
      let changed = false;

      // Seed 1: DCOR-ORD-2026-EX07 (yêu cầu đổi hàng RET-20261016-007)
      if (!current.some(o => o.orderNumber === 'DCOR-ORD-2026-EX07')) {
        current.push({
          id: 'DCOR-ORD-2026-EX07',
          orderNumber: 'DCOR-ORD-2026-EX07',
          createdAt: '21/10/2026 08:00',
          status: 'PROCESSING',
          paymentStatus: 'PAID',
          paymentMethod: 'BANK_TRANSFER',
          customerName: 'Hoàng Thị Thảo Trang',
          phone: '0901234567',
          email: 'thao.trang@gmail.com',
          address: 'Toà nhà Landmark 81, P. 22, Q. Bình Thạnh',
          province: 'Thành phố Hồ Chí Minh',
          district: 'Quận Bình Thạnh',
          ward: 'Phường 22',
          showroom: 'Kho Tổng DCOR Bình Tân',
          items: [
            {
              id: 'it-ex-07',
              name: 'Ghế bành Adelaide chân xoay kim loại đen',
              sku: 'SKU-ADL-BK-009',
              variant: 'Chân kim loại xoay 360 / Da bò Cognac',
              imageUrl: '/assets/img/furniture-placeholder.svg',
              price: 28900000,
              quantity: 1,
              lineTotal: 28900000,
              stockAvailable: 10
            }
          ],
          subTotal: 28900000,
          shippingFee: 0,
          discountAmount: 0,
          vatRate: 0.1,
          totalAmount: 28900000,
          depositRequired: 0,
          depositPaid: 28900000,
          remainingAmount: 0,
          isDepositRequired: false,
          paymentHoldReason: 'NONE',
          isHighValue: false,
          isCustomDesign: false,
          isGift: false,
          customerNote: 'Đơn hàng đổi mới từ Yêu cầu #RET-20261016-007',
          internalNotes: 'Đơn hàng thay thế đổi mới được hệ thống tự động kích hoạt từ Yêu cầu đổi trả #RET-20261016-007 (Đơn hàng gốc: #ORD-20261016-1051). Chênh lệch đổi hàng: 4.000.000đ.',
          delivery: {
            provider: 'Xe tải DCOR Express',
            trackingCode: 'DCOR-SHIP-EX07',
            driverName: 'Nguyễn Văn Tài',
            driverPhone: '0988112233',
            vehiclePlate: '51D-998.24',
            estimatedDate: '2 - 3 ngày làm việc',
            failedAttempts: 0,
            trackingHistory: [
              {
                time: '21/10/2026 08:00',
                status: 'Đã tạo đơn đổi mới',
                description: 'Tự động kích hoạt từ Yêu cầu đổi hàng #RET-20261016-007',
                location: 'Kho Tổng DCOR Bình Tân'
              },
              {
                time: '21/10/2026 08:30',
                status: 'Đang chuẩn bị xuất kho',
                description: 'Bộ phận kho đã nhận lệnh soạn ghế bành Adelaide mới để giao đổi',
                location: 'Kho Tổng DCOR Bình Tân'
              }
            ]
          },
          qcChecklist: {
            surfaceChecked: true,
            structureChecked: true,
            cushionLeatherChecked: true,
            protectiveWrapDone: true
          },
          auditLogs: [
            {
              id: 'log-ex-07',
              timestamp: '21/10/2026 08:00',
              actor: 'Hệ thống DCOR',
              action: 'Tự động kích hoạt đơn hàng thay thế',
              detail: 'Tạo đơn đổi mới #DCOR-ORD-2026-EX07 từ yêu cầu đổi hàng #RET-20261016-007'
            }
          ]
        });
        changed = true;
      }

      if (changed) {
        localStorage.setItem(REPLACEMENT_ORDERS_KEY, JSON.stringify(current));
      }
    } catch (_) {}
  }

  /**
   * Danh sách đơn hàng bảo hành mặc định đảm bảo mọi hồ sơ bảo hành đều liên kết chính xác với chi tiết đơn
   */
  public getDefaultWarrantyOrders(): OrderV2[] {
    return [
      {
        id: 'ord-1008',
        orderNumber: 'DCOR-ORD-1008',
        createdAt: '15/09/2026 09:30',
        deliveredAt: '16/09/2026 14:00',
        completedAt: '19/09/2026 14:00',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Nguyễn Văn An',
        phone: '0909876543',
        email: 'nguyenvanan.arch@gmail.com',
        address: '120 Nguyễn Thị Minh Khai, Phường 6, Quận 3',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 6',
        showroom: 'Showroom Quận 1',
        warrantyCode: 'WAR-2026-1008',
        items: [
          {
            id: 'item-1008-1',
            name: 'Salamanca 3 seater lounge sofa',
            sku: 'sofa-salamanca-01',
            variant: 'Vải Nỉ Nhung Màu Be (Beige) • 3 Chỗ',
            imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
            price: 32500000,
            quantity: 1,
            lineTotal: 32500000,
            stockAvailable: 5
          }
        ],
        subTotal: 32500000,
        shippingFee: 0,
        discountAmount: 0,
        vatRate: 0.1,
        totalAmount: 32500000,
        depositRequired: 0,
        depositPaid: 32500000,
        remainingAmount: 0,
        isDepositRequired: false,
        paymentHoldReason: 'NONE',
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        customerNote: 'Giao trong giờ hành chính, gọi trước 30 phút.',
        internalNotes: 'Đơn hàng cao cấp BoConcept Salamanca đã hoàn tất bàn giao & kích hoạt bảo hành điện tử chính hãng 36 tháng.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-SHIP-1008',
          driverName: 'Lê Hoàng Nam',
          driverPhone: '0908112233',
          vehiclePlate: '51D-882.19',
          failedAttempts: 0,
          trackingHistory: [
            { time: '15/09/2026 09:30', status: 'Đã tạo đơn', description: 'Đơn hàng mới tạo trên website', location: 'Showroom DCor' },
            { time: '15/09/2026 10:00', status: 'Đã xác nhận', description: 'Xác nhận thanh toán chuyển khoản đủ 100%', location: 'Hệ thống Kế toán' },
            { time: '15/09/2026 14:00', status: 'Đang chuẩn bị hàng', description: 'QC kiểm định chất lượng sofa và đóng gói bọc màng bảo vệ', location: 'Kho Tổng DCOR Bình Tân' },
            { time: '16/09/2026 08:30', status: 'Sẵn sàng xuất kho', description: 'Bàn giao hàng cho tài xế Lê Hoàng Nam', location: 'Kho Tổng DCOR Bình Tân' },
            { time: '16/09/2026 09:15', status: 'Đang vận chuyển', description: 'Tài xế đang giao tới 120 Nguyễn Thị Minh Khai', location: 'Quận 3, TP.HCM' },
            { time: '16/09/2026 14:00', status: 'Đã giao hàng thành công', description: 'Khách hàng Nguyễn Văn An đã ký biên bản bàn giao sản phẩm', location: '120 Nguyễn Thị Minh Khai, P.6, Q.3' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-1008-1', timestamp: '15/09/2026 09:30:00', actor: 'Nguyễn Văn An (Khách hàng)', action: 'Đặt hàng Online', detail: 'Đơn hàng thanh toán chuyển khoản ngân hàng.' },
          { id: 'log-1008-2', timestamp: '15/09/2026 10:00:15', actor: 'Hệ thống Kế toán', action: 'Ghi nhận thanh toán', detail: 'Đã nhận đủ 32.500.000đ qua Bank Transfer.' },
          { id: 'log-1008-3', timestamp: '16/09/2026 14:00:00', actor: 'Lê Hoàng Nam (Tài xế)', action: 'Bàn giao thành công', detail: 'Khách hàng ký nhận đủ kiện hàng nguyên vẹn.' },
          { id: 'log-1008-4', timestamp: '19/09/2026 14:00:00', actor: 'Hệ thống tự động', action: 'Hoàn tất đơn & Kích hoạt bảo hành', detail: 'Đã hết 72h đổi trả, kích hoạt thẻ bảo hành WAR-2026-1008 (36 tháng).' }
        ]
      },
      {
        id: 'ord-1007',
        orderNumber: 'DCOR-ORD-1007',
        createdAt: '12/08/2026 14:15',
        deliveredAt: '13/08/2026 16:30',
        completedAt: '16/08/2026 16:30',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Trần Thị Mai',
        phone: '0903123456',
        email: 'tranmai.interior@gmail.com',
        address: '45 Lê Duẩn, Phường Bến Nghé, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Showroom Quận 1',
        warrantyCode: 'WAR-2026-1007',
        items: [
          {
            id: 'item-1007-1',
            name: 'Ghế xoay thư giãn Imola da Cognac',
            sku: 'imola-chair-cognac',
            variant: 'Da bò Ý Semi-Aniline Cognac • Chân thép Crom xoay 360°',
            imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
            price: 18900000,
            quantity: 1,
            lineTotal: 18900000,
            stockAvailable: 6
          }
        ],
        subTotal: 18900000,
        shippingFee: 0,
        discountAmount: 0,
        vatRate: 0.1,
        totalAmount: 18900000,
        depositRequired: 0,
        depositPaid: 18900000,
        remainingAmount: 0,
        isDepositRequired: false,
        paymentHoldReason: 'NONE',
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        customerNote: 'Kiểm tra kỹ da bò trước khi giao.',
        internalNotes: 'Đơn hàng hoàn tất và kích hoạt bảo hành điện tử chính hãng 24 tháng cho mâm xoay và da bò Ý.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-SHIP-1007',
          driverName: 'Võ Minh Trí',
          driverPhone: '0903445566',
          vehiclePlate: '51C-774.12',
          failedAttempts: 0,
          trackingHistory: [
            { time: '12/08/2026 14:15', status: 'Đã tạo đơn', description: 'Đơn hàng mới tạo trên website (VNPAY)', location: 'Showroom DCor' },
            { time: '12/08/2026 14:18', status: 'Đã thanh toán', description: 'Giao dịch VNPAY thành công 18.900.000đ', location: 'Cổng VNPAY' },
            { time: '13/08/2026 16:30', status: 'Đã giao hàng thành công', description: 'Khách hàng nhận ghế Imola da Cognac', location: '45 Lê Duẩn, Quận 1' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-1007-1', timestamp: '12/08/2026 14:15:00', actor: 'Trần Thị Mai (Khách hàng)', action: 'Đặt hàng Online', detail: 'Thanh toán qua VNPAY QR.' },
          { id: 'log-1007-2', timestamp: '13/08/2026 16:30:00', actor: 'Võ Minh Trí (Tài xế)', action: 'Giao hàng thành công', detail: 'Khách đã nghiệm thu da bò không tỳ vết.' },
          { id: 'log-1007-3', timestamp: '16/08/2026 16:30:00', actor: 'Hệ thống tự động', action: 'Hoàn tất đơn hàng', detail: 'Kích hoạt thẻ bảo hành WAR-2026-1007 (24 tháng).' }
        ]
      },
      {
        id: 'ord-0994',
        orderNumber: 'DCOR-ORD-0994',
        createdAt: '05/07/2026 10:20',
        deliveredAt: '06/07/2026 11:30',
        completedAt: '09/07/2026 11:30',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Đặng Ngọc Trâm',
        phone: '0918234567',
        email: 'ngoctram.dang@gmail.com',
        address: '88 Nguyễn Du, Phường Bến Nghé, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Showroom Quận 1',
        warrantyCode: 'WAR-2026-0994',
        items: [
          {
            id: 'item-0994-1',
            name: 'Đèn sàn Kizu đá cẩm thạch trắng tự nhiên',
            sku: 'kizu-lamp-white',
            variant: 'Đá Marble Trắng Carrara • Chao Acrylic khuyếch tán sáng',
            imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            price: 8500000,
            quantity: 1,
            lineTotal: 8500000,
            stockAvailable: 12
          }
        ],
        subTotal: 8500000,
        shippingFee: 0,
        discountAmount: 0,
        vatRate: 0.1,
        totalAmount: 8500000,
        depositRequired: 0,
        depositPaid: 8500000,
        remainingAmount: 0,
        isDepositRequired: false,
        paymentHoldReason: 'NONE',
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        customerNote: 'Đóng gói cẩn thận chống vỡ chao đèn.',
        internalNotes: 'Đèn sàn Kizu hoàn tất bàn giao & kích hoạt bảo hành điện tử 12 tháng.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-SHIP-0994',
          driverName: 'Đặng Quang Huy',
          driverPhone: '0919334455',
          vehiclePlate: '51D-662.33',
          failedAttempts: 0,
          trackingHistory: [
            { time: '05/07/2026 10:20', status: 'Đã tạo đơn', description: 'Đơn hàng mới tạo trên website', location: 'Showroom DCor' },
            { time: '06/07/2026 11:30', status: 'Đã giao hàng thành công', description: 'Khách hàng nhận đèn sàn Kizu nguyên vẹn', location: '88 Nguyễn Du, Quận 1' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-0994-1', timestamp: '05/07/2026 10:20:00', actor: 'Đặng Ngọc Trâm (Khách hàng)', action: 'Đặt hàng Online', detail: 'Thanh toán qua ví MoMo.' },
          { id: 'log-0994-2', timestamp: '06/07/2026 11:30:00', actor: 'Đặng Quang Huy (Tài xế)', action: 'Giao hàng thành công', detail: 'Đã kiểm tra sáng đèn và công tắc dimmer tốt.' },
          { id: 'log-0994-3', timestamp: '09/07/2026 11:30:00', actor: 'Hệ thống tự động', action: 'Hoàn tất đơn hàng', detail: 'Kích hoạt thẻ bảo hành WAR-2026-0994 (12 tháng).' }
        ]
      }
    ];
  }

  public seedDefaultWarrantyOrders(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      let list: OrderV2[] = [];
      if (saved) {
        list = JSON.parse(saved);
      }
      if (!Array.isArray(list)) list = [];

      const warrantyOrders = this.getDefaultWarrantyOrders();
      let changed = false;
      for (const wo of warrantyOrders) {
        const exists = list.some(o => o.orderNumber === wo.orderNumber || o.id === wo.id);
        if (!exists) {
          list.push(wo);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (_) {}
  }

  public synthesizeOrderFromCode(code: string): OrderV2 {
    const cleanNum = code.replace(/[^a-zA-Z0-9-]/g, '');
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const nowFormatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    return {
      id: `ord-${cleanNum.toLowerCase()}`,
      orderNumber: cleanNum,
      createdAt: nowFormatted,
      deliveredAt: nowFormatted,
      completedAt: nowFormatted,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      customerName: 'Khách hàng DCOR',
      phone: '0901234567',
      email: 'customer@dcor.vn',
      address: '120 Nguyễn Thị Minh Khai, Phường 6, Quận 3',
      province: 'Thành phố Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường 6',
      showroom: 'Showroom Quận 1',
      warrantyCode: `WAR-2026-${cleanNum.slice(-4) || '001'}`,
      items: [
        {
          id: `item-${cleanNum}-1`,
          name: 'Sản phẩm nội thất chính hãng DCOR',
          sku: `SKU-${cleanNum.slice(-6) || 'PROD'}`,
          variant: 'Tiêu chuẩn cao cấp xuất xưởng',
          imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
          price: 25000000,
          quantity: 1,
          lineTotal: 25000000,
          stockAvailable: 10
        }
      ],
      subTotal: 25000000,
      shippingFee: 0,
      discountAmount: 0,
      vatRate: 0.1,
      totalAmount: 25000000,
      depositRequired: 0,
      depositPaid: 25000000,
      remainingAmount: 0,
      isDepositRequired: false,
      paymentHoldReason: 'NONE',
      isHighValue: false,
      isCustomDesign: false,
      isGift: false,
      customerNote: 'Đơn hàng bàn giao thành công và kích hoạt bảo hành chính hãng.',
      internalNotes: 'Đơn hàng được lưu trữ bảo hành kỹ thuật trên hệ thống.',
      delivery: {
        provider: 'Xe tải DCOR Express',
        trackingCode: `SHIP-${cleanNum.slice(-6)}`,
        failedAttempts: 0,
        trackingHistory: [
          { time: nowFormatted, status: 'Đã hoàn tất giao hàng', description: 'Khách hàng đã nhận đủ sản phẩm và kích hoạt bảo hành', location: 'TP.HCM' }
        ]
      },
      qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
      auditLogs: [
        { id: `log-${Date.now()}`, timestamp: nowFormatted, actor: 'Hệ thống tự động', action: 'Kích hoạt bảo hành điện tử', detail: `Đơn hàng ${cleanNum} đã hoàn tất và kích hoạt bảo hành.` }
      ]
    };
  }

  /**
   * Tự động tạo và lưu trữ đơn hàng thay thế mới từ luồng Yêu cầu Đổi trả (Exchange)
   */
  public createReplacementOrderFromExchange(params: {
    orderNumber: string;
    originalOrderNumber?: string;
    returnRequestId: string;
    customer: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      province?: string;
      district?: string;
      ward?: string;
    };
    item: {
      name: string;
      sku: string;
      variant: string;
      quantity: number;
      price: number;
      imageUrl: string;
    };
    priceDiff?: number;
    createdAt?: string;
  }): OrderV2 {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const defaultTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
    const nowStr = params.createdAt || defaultTimeStr;
    const qty = params.item.quantity || 1;
    const price = params.item.price || 0;
    const lineTotal = price * qty;
    const isHighValue = lineTotal > 50000000;

    const newOrder: OrderV2 = {
      id: params.orderNumber,
      orderNumber: params.orderNumber,
      createdAt: nowStr,
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      customerName: params.customer.name || 'Khách hàng DCOR',
      phone: params.customer.phone || '0901234567',
      email: params.customer.email || 'customer@dcor.vn',
      address: params.customer.address || 'Địa chỉ giao hàng',
      province: params.customer.province || 'Thành phố Hồ Chí Minh',
      district: params.customer.district || '',
      ward: params.customer.ward || '',
      showroom: 'Kho Tổng DCOR Bình Tân',
      items: [
        {
          id: `item-ex-${Date.now()}`,
          name: params.item.name,
          sku: params.item.sku,
          variant: params.item.variant,
          imageUrl: params.item.imageUrl || '/assets/img/furniture-placeholder.svg',
          price: price,
          quantity: qty,
          lineTotal: lineTotal,
          stockAvailable: 10
        }
      ],
      subTotal: lineTotal,
      shippingFee: 0,
      discountAmount: 0,
      vatRate: 0.1,
      totalAmount: lineTotal,
      depositRequired: 0,
      depositPaid: lineTotal,
      remainingAmount: 0,
      isDepositRequired: false,
      paymentHoldReason: 'NONE',
      isHighValue: isHighValue,
      isCustomDesign: false,
      isGift: false,
      customerNote: `Đơn hàng đổi mới từ Yêu cầu #${params.returnRequestId}`,
      internalNotes: `Đơn hàng thay thế đổi mới được hệ thống tự động kích hoạt từ Yêu cầu đổi trả #${params.returnRequestId} (Đơn hàng gốc: #${params.originalOrderNumber || 'N/A'}). Sản phẩm: ${params.item.name} (${params.item.variant}) x${qty}.`,
      delivery: {
        provider: 'Xe tải DCOR Express',
        trackingCode: `DCOR-SHIP-${params.orderNumber.replace(/[^A-Za-z0-9]/g, '')}`,
        driverName: 'Nguyễn Văn Tài',
        driverPhone: '0988112233',
        vehiclePlate: '51D-998.24',
        estimatedDate: '1 - 2 ngày làm việc',
        failedAttempts: 0,
        trackingHistory: [
          {
            time: nowStr,
            status: 'Đã tạo đơn đổi mới',
            description: `Hệ thống tự động kích hoạt từ Yêu cầu đổi hàng #${params.returnRequestId}`,
            location: 'Kho Tổng DCOR Bình Tân'
          },
          {
            time: nowStr,
            status: 'Đang chuẩn bị xuất kho',
            description: `Bộ phận kho đã nhận lệnh soạn sản phẩm ${params.item.name} (${params.item.variant}) x${qty} để đóng gói xuất kho`,
            location: 'Kho Tổng DCOR Bình Tân'
          }
        ]
      },
      qcChecklist: {
        surfaceChecked: true,
        structureChecked: true,
        cushionLeatherChecked: true,
        protectiveWrapDone: true
      },
      auditLogs: [
        {
          id: `log-ex-${Date.now()}-1`,
          timestamp: nowStr,
          actor: 'Hệ thống DCOR',
          action: 'Tự động kích hoạt đơn hàng thay thế',
          detail: `Tạo đơn đổi mới #${params.orderNumber} cho khách hàng ${params.customer.name} từ yêu cầu #${params.returnRequestId}`
        },
        {
          id: `log-ex-${Date.now()}-2`,
          timestamp: nowStr,
          actor: 'Thủ kho & QC',
          action: 'Chuyển lệnh xuất kho chuẩn bị hàng',
          detail: `Sản phẩm ${params.item.name} (${params.item.variant}) x${qty} được chuyển sang khâu đóng gói xuất kho`
        }
      ]
    };

    // Lưu vào danh sách replacement orders
    this.saveReplacementOrder(newOrder);

    // Cập nhật ngay vào ordersSubject & cache
    const current = this.orders;
    const existingIdx = current.findIndex(o => o.id === newOrder.id || o.orderNumber === newOrder.orderNumber);
    if (existingIdx >= 0) {
      current[existingIdx] = newOrder;
    } else {
      current.unshift(newOrder);
    }
    this.save(current);

    return newOrder;
  }

  private initOrders() {
    this.seedDefaultReplacementOrders();
    this.seedDefaultWarrantyOrders();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: OrderV2[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let combined = this.mergeWithReplacementOrders(parsed);
          // Đảm bảo tất cả các đơn hàng bảo hành đều có mặt trong bộ nhớ
          const warrantyOrders = this.getDefaultWarrantyOrders();
          for (const wo of warrantyOrders) {
            if (!combined.some(o => o.orderNumber === wo.orderNumber || o.id === wo.id)) {
              combined.push(wo);
            }
          }
          this.ordersSubject.next(combined);
          return;
        }
      } catch (_) {}
    }
    this.resetToDefaultData();
  }

  private save(orders: OrderV2[]) {
    this.ordersSubject.next([...orders]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (_) {}
  }

  get orders(): OrderV2[] {
    return this.ordersSubject.getValue();
  }

  getOrderById(id: string): OrderV2 | undefined {
    const rawId = (id || '').trim();
    const cleanId = rawId.replace(/^#/g, '');
    let found = this.orders.find(o => 
      o.id === rawId || o.id === cleanId || 
      o.orderNumber === rawId || o.orderNumber === cleanId ||
      o.id.toLowerCase() === rawId.toLowerCase() ||
      o.orderNumber.toLowerCase() === rawId.toLowerCase() ||
      o.orderNumber.toLowerCase() === cleanId.toLowerCase()
    );
    if (!found) {
      const replacements = this.getReplacementOrders();
      found = replacements.find(o => 
        o.id === rawId || o.id === cleanId || 
        o.orderNumber === rawId || o.orderNumber === cleanId ||
        o.id.toLowerCase() === rawId.toLowerCase() ||
        o.orderNumber.toLowerCase() === cleanId.toLowerCase()
      );
      if (found) {
        const current = this.orders;
        current.unshift(found);
        this.save(current);
        return found;
      }
    }

    // Kiểm tra tìm kiếm trong dcor_returns_mock_data_v2 nếu chưa có
    if (!found && typeof window !== 'undefined' && window.localStorage) {
      try {
        const returnsRaw = localStorage.getItem('dcor_returns_mock_data_v2');
        if (returnsRaw) {
          const returnList = JSON.parse(returnsRaw);
          const matchedReturn = Array.isArray(returnList) ? returnList.find((r: any) => r.replacementOrder?.orderNumber === id) : null;
          if (matchedReturn && matchedReturn.replacementOrder && matchedReturn.status === 'COMPLETED') {
            found = this.createReplacementOrderFromExchange({
              orderNumber: matchedReturn.replacementOrder.orderNumber,
              originalOrderNumber: matchedReturn.orderNumber,
              returnRequestId: matchedReturn.id,
              customer: {
                name: matchedReturn.customer.name,
                phone: matchedReturn.customer.phone,
                email: matchedReturn.customer.email,
                address: matchedReturn.customer.address
              },
              item: {
                name: matchedReturn.replacementOrder.item.name,
                sku: matchedReturn.replacementOrder.item.sku,
                variant: matchedReturn.replacementOrder.item.variant,
                quantity: matchedReturn.replacementOrder.item.quantity || 1,
                price: matchedReturn.replacementOrder.item.price,
                imageUrl: matchedReturn.replacementOrder.item.imageUrl
              },
              priceDiff: matchedReturn.replacementOrder.priceDiff,
              createdAt: matchedReturn.replacementOrder.createdAt
            });
            return found;
          }
        }
      } catch (_) {}
    }

    // Kiểm tra tìm kiếm trong danh sách đơn bảo hành mặc định
    if (!found) {
      const warrantyOrders = this.getDefaultWarrantyOrders();
      found = warrantyOrders.find(o => 
        o.id === rawId || o.id === cleanId || 
        o.orderNumber === rawId || o.orderNumber === cleanId ||
        o.id.toLowerCase() === rawId.toLowerCase() ||
        o.orderNumber.toLowerCase() === cleanId.toLowerCase()
      );
      if (found) {
        const current = this.orders;
        current.push(found);
        this.save(current);
        return found;
      }
    }

    // Tự động tổng hợp dữ liệu đơn hàng nếu mã khớp dạng đơn hàng bất kỳ (đảm bảo luôn xem được)
    if (!found && (cleanId.startsWith('DCOR-ORD-') || cleanId.startsWith('ORD-') || cleanId.startsWith('WAR-'))) {
      found = this.synthesizeOrderFromCode(cleanId);
      if (found) {
        const current = this.orders;
        current.push(found);
        this.save(current);
        return found;
      }
    }

    if (!found) {
      this.http.get<OrderV2>(`${this.apiUrl}/${id}`).subscribe({
        next: (order) => {
          if (order) {
            const current = this.orders;
            const idx = current.findIndex(o => o.id === order.id || o.orderNumber === order.orderNumber);
            if (idx >= 0) {
              current[idx] = order;
            } else {
              current.unshift(order);
            }
            this.ordersSubject.next([...current]);
          }
        },
        error: () => {}
      });
    }
    return found;
  }

  // =========================================================================
  // STATE MACHINE TRANSITIONS (ĐỒNG BỘ TRỰC TIẾP LÊN POSTGRESQL & AUDIT LOGS)
  // =========================================================================

  // 1. PENDING -> CONFIRMED
  confirmOrder(orderId: string, staffName: string = 'Admin Trần'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    // Rule 1: Đơn cần cọc (>= 50tr hoặc hàng custom)
    const isDepositRequired = order.isDepositRequired || order.isHighValue || order.isCustomDesign;
    if (isDepositRequired) {
      const minDeposit = order.depositRequired || Math.round(order.totalAmount * 0.3);
      if ((order.depositPaid || 0) < minDeposit && order.paymentStatus !== 'PAID') {
        alert(`Không thể xác nhận: Đơn hàng giá trị cao / may đo bắt buộc phải thu cọc tối thiểu 30% (${minDeposit.toLocaleString('vi-VN')}đ) trước khi duyệt vào kho!`);
        return false;
      }
    } 
    // Rule 2: Đơn thanh toán trực tuyến (Chuyển khoản / VNPAY)
    else if (order.paymentMethod !== 'COD' && order.paymentStatus !== 'PAID') {
      alert('Không thể xác nhận: Đơn hàng thanh toán trực tuyến chưa hoàn tất thanh toán tiền vào tài khoản!');
      return false;
    }

    // Khi Xác nhận đơn hàng: Đơn hoàn tất bước Xác nhận và chuyển thẳng sang PROCESSING (Kho chuẩn bị hàng & QC)
    order.status = 'PROCESSING';
    order.paymentHoldReason = 'NONE';
    this.addAuditLog(order, staffName, 'Xác nhận đơn & Chuyển kho chuẩn bị', 'Đã xác minh thông tin khách và điều kiện thanh toán/cọc. Đơn duyệt hoàn tất, chuyển lệnh kho nhặt hàng & in Pick-list.');
    this.save(orders);

    // Gửi request đồng bộ lên database PostgreSQL
    this.http.patch(`${this.apiUrl}/${orderId}/confirm`, { staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ xác nhận đơn:', e)
    });

    return true;
  }

  // Xác nhận thanh toán / thu cọc thủ công (dành cho Admin/Kế toán khi tiền đã về tài khoản)
  confirmManualPayment(orderId: string, type: 'FULL' | 'DEPOSIT', staffName: string = 'Kế toán DCOR'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    let depositAmount = 0;
    if (type === 'FULL') {
      order.paymentStatus = 'PAID';
      order.depositPaid = order.totalAmount;
      order.remainingAmount = 0;
      order.paymentHoldReason = 'NONE';
      depositAmount = order.totalAmount;
      this.addAuditLog(order, staffName, 'Xác nhận thanh toán 100%', `Kế toán đối soát tiền đã vào tài khoản: ${order.totalAmount.toLocaleString('vi-VN')}đ qua ${order.paymentMethod}. Đơn đủ điều kiện duyệt.`);
    } else {
      order.paymentStatus = 'PARTIAL';
      const deposit = order.depositRequired || Math.round(order.totalAmount * 0.3);
      order.depositPaid = deposit;
      order.remainingAmount = Math.max(0, order.totalAmount - deposit);
      order.paymentHoldReason = 'NONE';
      depositAmount = deposit;
      this.addAuditLog(order, staffName, 'Xác nhận thu cọc 30%', `Kế toán đối soát đã nhận tiền cọc: ${deposit.toLocaleString('vi-VN')}đ (30%). Đơn đủ điều kiện duyệt.`);
    }

    this.save(orders);

    // Đồng bộ ngay sang dcor_placed_orders trong localStorage nếu có
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const localPlacedRaw = localStorage.getItem('dcor_placed_orders');
        if (localPlacedRaw) {
          const localPlaced = JSON.parse(localPlacedRaw);
          const item = localPlaced.find((it: any) => it.id === orderId || it.orderNumber === orderId || it.id === order.orderNumber || it.orderNumber === order.orderNumber);
          if (item) {
            item.paymentStatus = type === 'FULL' ? 'PAID' : 'PARTIAL';
            item.status = 'Chờ xác nhận';
            item.statusKey = 'PENDING';
            item.depositPaid = order.depositPaid;
            localStorage.setItem('dcor_placed_orders', JSON.stringify(localPlaced));
          }
        }
      } catch (_) {}
    }

    this.http.patch(`${this.apiUrl}/${orderId}/deposit`, { type, amount: depositAmount, staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ cọc lên database:', e)
    });

    return true;
  }

  // 2. PENDING / CONFIRMED -> CANCELLED
  cancelOrder(orderId: string, reason: string, staffName: string = 'Admin Tran'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'CANCELLED';
    order.cancelReason = reason || 'Khách đổi ý không tiếp tục đặt hàng';
    order.cancelledBy = staffName;

    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIAL') {
      order.paymentStatus = 'REFUND_PENDING';
      this.addAuditLog(order, staffName, 'Hủy đơn hàng & Yêu cầu hoàn tiền', `Lý do: ${order.cancelReason}. Đã chuyển lệnh hoàn tiền sang kế toán.`);
    } else {
      this.addAuditLog(order, staffName, 'Hủy đơn hàng', `Lý do: ${order.cancelReason}. Đã nhả số lượng tồn kho giữ chỗ.`);
    }

    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/cancel`, { reason: order.cancelReason, staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ hủy đơn:', e)
    });

    return true;
  }

  // 3. CONFIRMED -> PROCESSING
  startProcessing(orderId: string, staffName: string = 'Thủ kho Hoàng Sơn'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'PROCESSING';
    this.addAuditLog(order, staffName, 'Bắt đầu xử lý kho', 'In phiếu soạn hàng và đưa sản phẩm vào khu vực đóng gói.');
    this.save(orders);
    return true;
  }

  // 4. PROCESSING -> READY_TO_SHIP
  finishPackaging(orderId: string, checklist: QcChecklistV2, staffName: string = 'Thủ kho Hoàng Sơn'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    if (!checklist.surfaceChecked || !checklist.structureChecked || !checklist.cushionLeatherChecked || !checklist.protectiveWrapDone) {
      alert('Không thể hoàn tất đóng gói: Biên bản kiểm tra chất lượng (QC) chưa đạt đủ 4 tiêu chuẩn!');
      return false;
    }

    order.qcChecklist = { ...checklist };
    order.status = 'READY_TO_SHIP';
    this.addAuditLog(order, staffName, 'Hoàn tất đóng gói', 'Đã kiểm tra ngoại quan QC, bọc xốp EVA 4 cạnh và đưa kiện ra sàn chờ xe lấy.');
    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/qc`, { qcChecklist: checklist, staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ QC & đóng gói:', e)
    });

    return true;
  }

  updateQcChecklist(orderId: string, checklist: QcChecklistV2): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;
    order.qcChecklist = { ...checklist };
    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/qc`, { qcChecklist: checklist }).subscribe({
      error: (e) => console.error('Lỗi cập nhật checklist QC:', e)
    });

    return true;
  }

  // 5. READY_TO_SHIP -> SHIPPED
  dispatchOrder(orderId: string, deliveryData: { provider: string; trackingCode: string; driverName?: string; driverPhone?: string; vehiclePlate?: string }, staffName: string = 'Điều phối viên'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    if (order.qcChecklist && (!order.qcChecklist.surfaceChecked || !order.qcChecklist.structureChecked || !order.qcChecklist.cushionLeatherChecked || !order.qcChecklist.protectiveWrapDone)) {
      alert('Không thể xuất kho: Biên bản kiểm tra chất lượng (QC) chưa được kiểm duyệt đủ 4 mục!');
      return false;
    }

    if (!deliveryData.trackingCode || deliveryData.trackingCode.trim() === '') {
      alert('Vui lòng nhập Mã vận đơn trước khi xác nhận xuất kho!');
      return false;
    }

    order.status = 'SHIPPED';
    order.delivery.provider = deliveryData.provider;
    order.delivery.trackingCode = deliveryData.trackingCode;
    order.delivery.driverName = deliveryData.driverName || 'Nguyễn Văn Tài';
    order.delivery.driverPhone = deliveryData.driverPhone || '0988112233';
    order.delivery.vehiclePlate = deliveryData.vehiclePlate || '51D-998.24';
    order.delivery.estimatedDate = '3 - 5 ngày làm việc';

    order.delivery.trackingHistory.unshift({
      time: this.getNowFormatted(),
      status: 'Xuất kho thành công',
      description: `Bàn giao cho ${deliveryData.provider}. Mã vận đơn: ${deliveryData.trackingCode}`,
      location: order.showroom
    });

    this.addAuditLog(order, staffName, 'Xác nhận xuất kho & Bàn giao xe', `Đã trừ tồn kho vật lý. Đơn vị vận chuyển: ${deliveryData.provider} (${deliveryData.trackingCode}).`);
    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/dispatch`, { ...deliveryData, staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ xuất kho:', e)
    });

    return true;
  }

  // 6. SHIPPED -> DELIVERED
  markDelivered(orderId: string, staffName: string = 'Tài xế / Webhook ĐVC'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'DELIVERED';
    order.deliveredAt = this.getNowFormatted();
    if (order.paymentStatus === 'UNPAID') {
      order.paymentStatus = 'PAID';
    }

    order.delivery.trackingHistory.unshift({
      time: order.deliveredAt,
      status: 'Giao hàng thành công',
      description: 'Khách đã nhận kiện hàng và ký biên bản giao nhận.',
      location: order.address
    });

    this.addAuditLog(order, staffName, 'Giao hàng thành công', 'Khách đã nhận hàng. Bắt đầu kích hoạt thời hạn 72h hỗ trợ đổi trả.');
    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/deliver`, { staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ giao hàng thành công:', e)
    });

    return true;
  }

  // 7. SHIPPED -> FAILED_DELIVERY
  markDeliveryFailed(orderId: string, reason: string, staffName: string = 'Tài xế / Webhook ĐVC'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'FAILED_DELIVERY';
    order.delivery.failedAttempts += 1;
    order.delivery.failureReason = reason || 'Không liên lạc được với khách hàng qua SĐT';

    order.delivery.trackingHistory.unshift({
      time: this.getNowFormatted(),
      status: `Giao thất bại (Lần ${order.delivery.failedAttempts})`,
      description: `Lý do: ${order.delivery.failureReason}`,
      location: order.address
    });

    this.addAuditLog(order, staffName, `Ghi nhận giao thất bại (Lần ${order.delivery.failedAttempts})`, order.delivery.failureReason);
    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/delivery-failed`, { reason, staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ giao thất bại:', e)
    });

    return true;
  }

  // 8. FAILED_DELIVERY -> SHIPPED (Lên lịch giao lại)
  rescheduleDelivery(orderId: string, newDateStr: string, staffName: string = 'CSKH'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'SHIPPED';
    order.delivery.estimatedDate = newDateStr || 'Hẹn giao lại ngày mai';

    order.delivery.trackingHistory.unshift({
      time: this.getNowFormatted(),
      status: 'Lên lịch giao lại',
      description: `Đã hẹn lại giờ giao với khách: ${order.delivery.estimatedDate}`,
      location: order.showroom
    });

    this.addAuditLog(order, staffName, 'Hẹn lịch giao lại', `Đã liên lạc khách hẹn lịch giao lại: ${order.delivery.estimatedDate}`);
    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/reschedule`, { newDateStr, staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ hẹn giao lại:', e)
    });

    return true;
  }

  // 9. DELIVERED -> COMPLETED
  completeOrder(orderId: string, staffName: string = 'Hệ thống tự động'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'COMPLETED';
    order.completedAt = this.getNowFormatted();
    order.warrantyCode = `BH-DCOR-${order.orderNumber.replace('DCOR-ORD-', '')}`;

    this.addAuditLog(order, staffName, 'Hoàn tất đơn hàng vĩnh viễn', `Đã hết hạn 72h đổi trả. Ghi nhận doanh thu thực nhận: ${order.totalAmount.toLocaleString('vi-VN')}đ. Kích hoạt mã bảo hành ${order.warrantyCode}.`);
    this.save(orders);

    this.http.patch(`${this.apiUrl}/${orderId}/complete`, { staffName }).subscribe({
      error: (e) => console.error('Lỗi đồng bộ hoàn tất đơn:', e)
    });

    return true;
  }

  // 10. DELIVERED -> RETURNED (Khách trả hàng cho tài xế mang về luôn)
  requestReturn(orderId: string, returnData: { reason: string; customerNote?: string; type: 'REFUND' | 'EXCHANGE'; proofImages: string[] }): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.status = 'RETURNED';
    order.returnInfo = {
      requestedAt: this.getNowFormatted(),
      reason: returnData.reason,
      type: returnData.type,
      proofImages: returnData.proofImages,
      customerNote: returnData.customerNote,
      refundAmount: order.totalAmount
    };

    const isExchange = returnData.type === 'EXCHANGE';
    const actionTitle = isExchange ? 'Nhận đổi hàng về kho' : 'Nhận hàng trả về kho (Hoàn tiền)';
    const logDesc = isExchange
      ? `Khách yêu cầu Đổi hàng trong thời hạn 72h. Tài xế DCOR Express nhận sản phẩm mang về kho để xử lý đổi sản phẩm. Lý do: ${returnData.reason}.`
      : `Khách yêu cầu Trả hàng & Hoàn tiền trong 72h. Tài xế DCOR Express mang hàng về kho làm thủ tục hoàn tiền. Lý do: ${returnData.reason}.`;

    this.addAuditLog(order, 'Tài xế DCOR Express', actionTitle, logDesc);
    this.save(orders);
    return true;
  }

  // 11. RETURN_REQUESTED -> RETURNING (Chấp thuận)
  approveReturn(orderId: string, note: string, staffName: string = 'CSKH'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.returnInfo) return false;

    order.status = 'RETURNING';
    this.addAuditLog(order, staffName, 'Chấp thuận yêu cầu đổi trả', `Ghi chú duyệt: ${note}. Đang điều phối xe tải tới nhà khách thu hồi kiện hàng.`);
    this.save(orders);
    return true;
  }

  // 12. RETURN_REQUESTED -> COMPLETED (Từ chối)
  rejectReturn(orderId: string, rejectionReason: string, staffName: string = 'CSKH'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.returnInfo) return false;

    order.status = 'COMPLETED';
    order.returnInfo.rejectionReason = rejectionReason;
    this.addAuditLog(order, staffName, 'Từ chối yêu cầu đổi trả', `Lý do từ chối: ${rejectionReason}. Đơn hàng chuyển sang Hoàn tất.`);
    this.save(orders);
    return true;
  }

  // 13. RETURNING -> RETURNED (Kho nhận hàng QC)
  receiveReturnQC(orderId: string, qcReport: any, staffName: string = 'Thủ kho QC'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.returnInfo) return false;

    order.status = 'RETURNED';
    order.returnInfo.qcReport = qcReport;
    order.returnInfo.refundAmount = (order.totalAmount * qcReport.refundPercent) / 100;
    order.paymentStatus = 'REFUND_PENDING';

    this.addAuditLog(order, staffName, 'Kiểm định QC hàng thu hồi', `Tình trạng: ${qcReport.condition}. Đề xuất hoàn tiền: ${qcReport.refundPercent}% (${order.returnInfo.refundAmount?.toLocaleString('vi-VN')}đ).`);
    this.save(orders);
    return true;
  }

  // 14. RETURNED -> REFUNDED
  refundOrder(orderId: string, transactionCode: string, staffName: string = 'Kế toán'): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.paymentStatus = 'REFUNDED';
    if (order.returnInfo) {
      order.returnInfo.refundTransactionCode = transactionCode || 'VNPAY-REF-99812';
    }

    this.addAuditLog(order, staffName, 'Xác nhận hoàn tiền thành công', `Mã GD hoàn tiền: ${transactionCode || 'VNPAY-REF-99812'}. Đóng hồ sơ đơn hàng.`);
    this.save(orders);
    return true;
  }

  // Helper testing method: Giả lập khách chuyển tiền cọc 30% để test mở khóa nút Xác nhận ở PENDING
  mockSimulateDepositPaid(orderId: string): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.depositPaid = order.depositRequired;
    order.paymentStatus = 'PARTIAL';
    order.remainingAmount = order.totalAmount - order.depositPaid;

    this.addAuditLog(order, 'Hệ thống Kế toán', 'Ghi nhận chuyển khoản cọc', `Đã nhận tiền cọc: ${order.depositPaid.toLocaleString('vi-VN')}đ. Đủ điều kiện xác nhận đơn.`);
    this.save(orders);
    return true;
  }

  private addAuditLog(order: OrderV2, actor: string, action: string, detail: string) {
    order.auditLogs.unshift({
      id: `LOG-${Date.now()}`,
      timestamp: this.getNowFormatted(),
      actor,
      action,
      detail
    });
  }

  private getNowFormatted(): string {
    const d = new Date();
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  public parseCustomDate(dateStr?: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(' ');
    if (parts.length >= 2) {
      let datePart = parts[0];
      let timePart = parts[1];
      if (parts[0].includes(':') && parts[1].includes('/')) {
        timePart = parts[0];
        datePart = parts[1];
      }
      const dateParts = datePart.split('/').map(Number);
      const timeParts = timePart.split(':').map(Number);
      if (dateParts.length === 3) {
        const [d, m, y] = dateParts;
        const h = timeParts[0] || 0;
        const min = timeParts[1] || 0;
        const s = timeParts[2] || 0;
        return new Date(y, m - 1, d, h, min, s);
      }
    }
    const isoDate = new Date(dateStr);
    return isNaN(isoDate.getTime()) ? null : isoDate;
  }

  public formatCustomDate(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  // Tự động quét và hoàn tất các đơn DELIVERED đã quá 72h
  public checkAndAutoCompleteDeliveredOrders(): void {
    const orders = this.orders;
    if (!orders || orders.length === 0) return;
    let hasChanges = false;
    const now = Date.now();
    const duration72hMs = 72 * 60 * 60 * 1000;

    orders.forEach(order => {
      if (order.status === 'DELIVERED') {
        const deliveredDate = this.parseCustomDate(order.deliveredAt) || this.parseCustomDate(order.createdAt);
        if (deliveredDate) {
          const elapsed = now - deliveredDate.getTime();
          if (elapsed >= duration72hMs) {
            order.status = 'COMPLETED';
            order.completedAt = this.getNowFormatted();
            order.warrantyCode = `BH-DCOR-${order.orderNumber.replace('DCOR-ORD-', '')}`;
            this.addAuditLog(
              order, 
              'Hệ thống tự động', 
              'Hoàn tất đơn hàng vĩnh viễn (Hết 72h Đổi/Trả)', 
              `Đã hết thời hạn 72h hỗ trợ đổi trả kể từ lúc giao hàng (${order.deliveredAt || 'N/A'}). Hệ thống tự động khóa đơn, ghi nhận doanh thu ${order.totalAmount.toLocaleString('vi-VN')}đ và kích hoạt bảo hành ${order.warrantyCode}.`
            );
            hasChanges = true;
          }
        }
      }
    });

    if (hasChanges) {
      this.save(orders);
    }
  }

  // Phương thức giả lập cho demo: Đặt thời gian giao hàng sao cho còn đúng `remainingSeconds` giây
  public simulateCountdownEnding(orderId: string, remainingSeconds: number = 10): boolean {
    const orders = this.orders;
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status !== 'DELIVERED') return false;

    const targetDate = new Date(Date.now() - (72 * 3600 - remainingSeconds) * 1000);
    order.deliveredAt = this.formatCustomDate(targetDate);
    this.addAuditLog(
      order, 
      'Admin Demo', 
      'Giả lập đếm ngược 72h', 
      `Đã chỉnh thời gian giao hàng về ${order.deliveredAt} để demo đếm ngược còn ${remainingSeconds} giây.`
    );
    this.save(orders);
    return true;
  }

  // =========================================================================
  // DEFAULT 11 MOCK ORDERS REPRESENTING ALL STATES
  // =========================================================================
  resetToDefaultData() {
    const initialOrders: OrderV2[] = [
      // 1A. PENDING - TRƯỜNG HỢP 1: Đơn COD thông thường (< 50 triệu) -> Duyệt bình thường, không hiện cảnh báo
      {
        id: 'ord-100',
        orderNumber: 'DCOR-ORD-100',
        createdAt: '19/10/2026 11:15',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        customerName: 'Trần Hoàng Long',
        phone: '0908889900',
        email: 'hoanglong.tran@gmail.com',
        address: '45 Lê Duẩn, Phường Bến Nghé, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-100-1',
            name: 'Ghế Armchair Scandinavia Mini',
            sku: 'AC-SCAN-01',
            variant: 'Vải bố xám tiêu, Chân tiện gỗ tần bì',
            imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
            price: 6500000,
            quantity: 1,
            lineTotal: 6500000,
            stockAvailable: 8
          }
        ],
        subTotal: 6500000,
        shippingFee: 200000,
        discountAmount: 200000,
        totalAmount: 6500000,
        depositRequired: 0,
        depositPaid: 0,
        remainingAmount: 6500000,
        isDepositRequired: false,
        paymentHoldReason: 'NONE',
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        customerNote: 'Gọi điện trước khi giao, giao giờ hành chính.',
        internalNotes: 'Đơn COD giá trị nhỏ. Đã check SĐT khách đúng chuẩn.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '19/10/2026 11:15', status: 'Đã tạo đơn', description: 'Đơn hàng mới tạo trên website (COD)', location: 'Website DCor' }
          ]
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-100-1', timestamp: '19/10/2026 11:15', actor: 'Trần Hoàng Long (Khách hàng)', action: 'Đặt hàng COD', detail: 'Đơn hàng tiền mặt khi nhận.' }
        ]
      },

      // 1B. PENDING - TRƯỜNG HỢP 2: Đơn Chuyển khoản / VNPAY (< 50tr) chưa thanh toán
      {
        id: 'ord-101-online',
        orderNumber: 'DCOR-ORD-101-VNP',
        createdAt: '19/10/2026 10:45',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'VNPAY',
        customerName: 'Phạm Thị Bích Ngọc',
        phone: '0938112233',
        email: 'bichngoc.pham@gmail.com',
        address: '128 Nguyễn Thị Minh Khai, Phường 6, Quận 3',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 6',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-101o-1',
            name: 'Bàn trà Mặt đá Marble Ý',
            sku: 'TB-MAR-02',
            variant: 'Mặt đá trắng vân mây, Khung inox mạ PVD vàng',
            imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80',
            price: 14800000,
            quantity: 1,
            lineTotal: 14800000,
            stockAvailable: 4
          }
        ],
        subTotal: 14800000,
        shippingFee: 200000,
        discountAmount: 200000,
        totalAmount: 14800000,
        depositRequired: 0,
        depositPaid: 0,
        remainingAmount: 14800000,
        isDepositRequired: false,
        paymentHoldReason: 'AWAITING_PAYMENT',
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        customerNote: 'Kiểm tra kỹ mặt đá giúp mình nhé, không bị trầy.',
        internalNotes: 'Khách chọn thanh toán qua VNPAY nhưng giao dịch bị gián đoạn hoặc chưa quét QR.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '19/10/2026 10:45', status: 'Đã tạo đơn', description: 'Chờ khách hoàn tất thanh toán VNPAY', location: 'Cổng VNPAY' }
          ]
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-101o-1', timestamp: '19/10/2026 10:45', actor: 'Hệ thống DCor', action: 'Chờ thanh toán', detail: 'Chưa nhận được webhook thành công từ cổng VNPAY.' }
        ]
      },

      // 1C. PENDING - TRƯỜNG HỢP 3: Đơn Giá trị lớn (≥ 50 triệu) hoặc Hàng thiết kế bắt buộc cọc 30%
      {
        id: 'ord-101',
        orderNumber: 'DCOR-ORD-101',
        createdAt: '19/10/2026 10:30',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Nguyễn Văn Minh',
        phone: '0901234567',
        email: 'minh.nguyen@gmail.com',
        address: '239 Hoàng Diệu, Phường 8, Quận 4',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 4',
        ward: 'Phường 8',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-101-1',
            name: 'Sofa Indivi 2.5 chỗ',
            sku: 'SF-IND-01',
            variant: 'Chân gỗ sồi, Vải nỉ Copenhagen Nâu',
            imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
            price: 51290000,
            quantity: 1,
            lineTotal: 51290000,
            stockAvailable: 3
          }
        ],
        subTotal: 51290000,
        shippingFee: 500000,
        discountAmount: 500000,
        totalAmount: 51290000,
        depositRequired: 15387000, // 30%
        depositPaid: 0,
        remainingAmount: 51290000,
        isDepositRequired: true,
        paymentHoldReason: 'AWAITING_DEPOSIT',
        isHighValue: true,
        isCustomDesign: false,
        isGift: false,
        customerNote: 'Giao hàng buổi sáng giúp mình, gọi trước 30 phút nhé!',
        internalNotes: 'Khách VIP căn hộ Masteri Millennium. Đơn trên 50tr bắt buộc thu cọc tối thiểu 30% trước khi duyệt đơn.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '19/10/2026 10:30', status: 'Đã tạo đơn', description: 'Đơn hàng mới tạo trên website (Chờ cọc)', location: 'Website DCor' }
          ]
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-1', timestamp: '19/10/2026 10:30', actor: 'Nguyễn Văn Minh (Khách hàng)', action: 'Đặt hàng qua Web', detail: 'Tạo đơn hàng chuyển khoản (Chờ cọc).' }
        ]
      },

      // 2. CONFIRMED (Đã duyệt đơn, chờ kho xử lý)
      {
        id: 'ord-102',
        orderNumber: 'DCOR-ORD-102',
        createdAt: '19/10/2026 09:15',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Lê Thu Trang',
        phone: '0912345678',
        email: 'trang.le@gmail.com',
        address: 'Khu công nghệ cao, Phường Tân Phú, Quận 9',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 9',
        ward: 'Phường Tân Phú',
        showroom: 'Showroom Thủ Đức',
        items: [
          {
            id: 'item-102-1',
            name: 'Bàn ăn 6 ghế Gỗ Sồi Bắc Âu',
            sku: 'TB-OAK-06',
            variant: '1m8 - Gỗ tự nhiên, Ghế đệm nỉ xám',
            imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80',
            price: 25000000,
            quantity: 1,
            lineTotal: 25000000,
            stockAvailable: 5
          }
        ],
        subTotal: 25000000,
        shippingFee: 300000,
        discountAmount: 300000,
        totalAmount: 25000000,
        depositRequired: 0,
        depositPaid: 25000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: true,
        customerNote: 'Chúc mừng tân gia em gái. Vui lòng gói quà đẹp!',
        internalNotes: 'Đã nhận đủ thanh toán qua VNPAY. Tồn kho Thủ Đức sẵn 5 cái.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '19/10/2026 09:15', status: 'Đặt hàng thành công', description: 'Đã thanh toán qua VNPAY', location: 'Cổng VNPAY' },
            { time: '19/10/2026 09:45', status: 'Admin duyệt đơn', description: 'Chỉ định xuất hàng tại Showroom Thủ Đức', location: 'Showroom Thủ Đức' }
          ]
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-2', timestamp: '19/10/2026 09:45', actor: 'Admin Tran', action: 'Duyệt đơn hàng', detail: 'Xác nhận thông tin & gán kho Thủ Đức.' },
          { id: 'log-1', timestamp: '19/10/2026 09:15', actor: 'Hệ thống VNPAY', action: 'Thanh toán thành công', detail: 'Mã GD: VNP1448992.' }
        ]
      },

      // 3. PROCESSING (Kho đang nhặt hàng & đóng gói)
      {
        id: 'ord-103',
        orderNumber: 'DCOR-ORD-103',
        createdAt: '18/10/2026 14:20',
        status: 'PROCESSING',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'INSTALLMENT',
        customerName: 'Phạm Thị Hương',
        phone: '0988776655',
        email: 'huong.pham@outlook.com',
        address: '45 Lê Lợi, Phường Bến Nghé, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Kho Tổng Hóc Môn',
        items: [
          {
            id: 'item-103-1',
            name: 'Giường ngủ thông minh 1m8',
            sku: 'BD-SMART-18',
            variant: 'Bọc da bò Ý cao cấp, tích hợp cổng sạc & massage',
            imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
            price: 125000000,
            quantity: 1,
            lineTotal: 125000000,
            stockAvailable: 2
          }
        ],
        subTotal: 125000000,
        shippingFee: 0,
        discountAmount: 5000000,
        totalAmount: 120000000,
        depositRequired: 36000000,
        depositPaid: 36000000,
        remainingAmount: 84000000,
        isHighValue: true,
        isCustomDesign: true,
        isGift: false,
        internalNotes: 'Khách làm hợp đồng trả góp qua HD Saison. Đang bọc xốp EVA bảo vệ.',
        delivery: {
          provider: 'Xe tải DCOR Express',
          failedAttempts: 0,
          trackingHistory: [
            { time: '18/10/2026 14:20', status: 'Tạo đơn', description: 'Đơn trả góp đặt cọc 30%', location: 'Website' },
            { time: '18/10/2026 16:00', status: 'Bắt đầu nhặt hàng', description: 'Thủ kho in phiếu Pick-list', location: 'Kho Tổng' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-3', timestamp: '18/10/2026 16:00', actor: 'Thủ kho Hoàng Sơn', action: 'Bắt đầu nhặt hàng', detail: 'Đang kiểm tra chất lượng nệm da và kết cấu nâng hạ.' },
          { id: 'log-2', timestamp: '18/10/2026 15:00', actor: 'Admin Tran', action: 'Duyệt hồ sơ trả góp', detail: 'Đã nhận cọc 36 triệu.' }
        ]
      },

      // 4. READY_TO_SHIP (Hàng đóng gói xong, chờ xe bốc hàng ở cửa kho)
      {
        id: 'ord-104',
        orderNumber: 'DCOR-ORD-104',
        createdAt: '18/10/2026 08:30',
        status: 'READY_TO_SHIP',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Vũ Đức Thành',
        phone: '0966889900',
        email: 'thanh.vu@gmail.com',
        address: '55 Hai Bà Trưng, Phường Bến Nghé, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-104-1',
            name: 'Kệ tivi Como gỗ óc chó tự nhiên',
            sku: 'TV-COMO-02',
            variant: '2m2 - Chân thép mạ vàng PVD',
            imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=400&q=80',
            price: 22000000,
            quantity: 1,
            lineTotal: 22000000,
            stockAvailable: 4
          }
        ],
        subTotal: 22000000,
        shippingFee: 200000,
        discountAmount: 200000,
        totalAmount: 22000000,
        depositRequired: 0,
        depositPaid: 22000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        internalNotes: 'Đã đóng bọc xốp 4 góc, dán tem mã kiện hàng đầy đủ. Chờ GHN đến quét mã.',
        delivery: {
          provider: 'Giao Hàng Nhanh (GHN)',
          trackingCode: 'GHN-8849201',
          driverName: 'Trần Văn Mạnh (Shipper GHN)',
          driverPhone: '0977334455',
          failedAttempts: 0,
          trackingHistory: [
            { time: '18/10/2026 08:30', status: 'Đặt hàng thành công', description: 'Đã nhận chuyển khoản', location: 'Showroom Q1' },
            { time: '18/10/2026 11:00', status: 'Đóng gói hoàn tất', description: 'Kiện hàng sẵn sàng tại cửa kho', location: 'Kho xuất hàng Q1' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-3', timestamp: '18/10/2026 11:00', actor: 'Thủ kho Hoàng Sơn', action: 'Hoàn tất đóng gói QC', detail: 'Đã tạo mã vận đơn GHN-8849201.' }
        ]
      },

      // 5. SHIPPED (Đang trên xe vận chuyển)
      {
        id: 'ord-105',
        orderNumber: 'DCOR-ORD-105',
        createdAt: '17/10/2026 10:00',
        status: 'SHIPPED',
        paymentStatus: 'PARTIAL',
        paymentMethod: 'COD',
        customerName: 'Hoàng Quốc Việt',
        phone: '0977112233',
        email: 'viet.hoang@vietcorp.vn',
        address: '120 Võ Văn Tần, Phường 6, Quận 3',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 6',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-105-1',
            name: 'Sofa Indivi 3 chỗ (Chân thép, Da Napoli đen)',
            sku: 'SF-IND-02',
            variant: 'Da Napoli đen, Dài 2m6',
            imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=400&q=80',
            price: 80000000,
            quantity: 1,
            lineTotal: 80000000,
            stockAvailable: 2
          },
          {
            id: 'item-105-2',
            name: 'Bàn trà Coda mặt kính khói',
            sku: 'TB-CODA-01',
            variant: 'Đường kính 90cm - Thép sơn tĩnh điện',
            imageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?auto=format&fit=crop&w=400&q=80',
            price: 10000000,
            quantity: 1,
            lineTotal: 10000000,
            stockAvailable: 4
          }
        ],
        subTotal: 90000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 90000000,
        depositRequired: 27000000,
        depositPaid: 27000000,
        remainingAmount: 63000000, // Cần thu COD 63 triệu
        isHighValue: true,
        isCustomDesign: false,
        isGift: false,
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-09',
          driverName: 'Đặng Quốc Huy',
          driverPhone: '0933556677',
          vehiclePlate: '51C-778.92',
          estimatedDate: 'Hôm nay (Dự kiến 16:30)',
          failedAttempts: 0,
          trackingHistory: [
            { time: '17/10/2026 14:00', status: 'Xuất kho', description: 'Xe tải bốc hàng rời kho Q1', location: 'Showroom Q1' },
            { time: '17/10/2026 15:30', status: 'Đang di chuyển', description: 'Xe tải đang trên đường tới Quận 3', location: 'Quận 3' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-3', timestamp: '17/10/2026 14:00', actor: 'Điều phối viên', action: 'Bàn giao xe tải', detail: 'Tài xế Đặng Quốc Huy phụ trách thu COD 63.000.000đ.' }
        ]
      },

      // 6. FAILED_DELIVERY (Giao thất bại lần 1, đang hẹn giao lại)
      {
        id: 'ord-106',
        orderNumber: 'DCOR-ORD-106',
        createdAt: '16/10/2026 11:20',
        status: 'FAILED_DELIVERY',
        paymentStatus: 'PAID',
        paymentMethod: 'CREDIT_CARD',
        customerName: 'Đỗ Mỹ Linh',
        phone: '0944556677',
        email: 'mylinh.do@gmail.com',
        address: '78 Thảo Điền, Phường Thảo Điền, Thành phố Thủ Đức',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Thành phố Thủ Đức',
        ward: 'Phường Thảo Điền',
        showroom: 'Showroom Thủ Đức',
        items: [
          {
            id: 'item-106-1',
            name: 'Bàn làm việc Minimalist Gỗ Óc Chó',
            sku: 'DK-MINI-01',
            variant: '1m4 x 70cm - Ngăn kéo ray giảm chấn',
            imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80',
            price: 18500000,
            quantity: 1,
            lineTotal: 18500000,
            stockAvailable: 2
          }
        ],
        subTotal: 18500000,
        shippingFee: 200000,
        discountAmount: 200000,
        totalAmount: 18500000,
        depositRequired: 0,
        depositPaid: 18500000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-02',
          driverName: 'Nguyễn Văn Hùng',
          driverPhone: '0908889999',
          vehiclePlate: '51D-123.45',
          failedAttempts: 1,
          failureReason: 'Gọi 3 cuộc khách không nghe máy, nhà khóa cổng vắng người.',
          trackingHistory: [
            { time: '17/10/2026 16:30', status: 'Giao thất bại', description: 'Gọi 3 cuộc khách không nghe máy, nhà khóa cổng', location: 'Thảo Điền, Thủ Đức' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-4', timestamp: '17/10/2026 16:35', actor: 'Tài xế Nguyễn Văn Hùng', action: 'Báo giao thất bại lần 1', detail: 'Khách đi vắng, bảo vệ tòa nhà không nhận thay.' }
        ]
      },

      // 7. DELIVERED (Đã nhận hàng, đang đếm ngược 72h)
      {
        id: 'ord-107',
        orderNumber: 'DCOR-ORD-107',
        createdAt: '16/10/2026 09:00',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Bùi Thanh Hằng',
        phone: '0938221100',
        email: 'hang.bui@hotmail.com',
        address: 'Villa 12, Khu đô thị Sala, Quận 2',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 2',
        ward: 'Phường An Lợi Đông',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-107-1',
            name: 'Ghế bành thư giãn Armchair Como',
            sku: 'AC-COMO-01',
            variant: 'Vải nỉ lông cừu Bouclé Trắng kem',
            imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=400&q=80',
            price: 16000000,
            quantity: 1,
            lineTotal: 16000000,
            stockAvailable: 3
          }
        ],
        subTotal: 16000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 16000000,
        depositRequired: 0,
        depositPaid: 16000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '18/10/2026 15:30', // Đã qua khoảng 23h
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-05',
          driverName: 'Phan Văn Đức',
          driverPhone: '0919998877',
          failedAttempts: 0,
          trackingHistory: [
            { time: '18/10/2026 15:30', status: 'Giao hàng thành công', description: 'Khách đã nghiệm thu và ký biên bản giao nhận', location: 'Sala, Q2' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-5', timestamp: '18/10/2026 15:30', actor: 'Tài xế Phan Văn Đức', action: 'Xác nhận giao thành công', detail: 'Khách ký biên bản bàn giao. Đang đếm ngược 72h đổi trả.' }
        ]
      },

      // 8. COMPLETED (Hoàn tất vĩnh viễn, khóa đơn, chốt doanh thu)
      {
        id: 'ord-108',
        orderNumber: 'DCOR-ORD-108',
        createdAt: '10/10/2026 14:00',
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Trịnh Đình Quang',
        phone: '0918776655',
        email: 'quang.trinh@gmail.com',
        address: '15 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Đa Kao',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-108-1',
            name: 'Tủ quần áo 4 cánh Gỗ Sồi tự nhiên',
            sku: 'WR-OAK-04',
            variant: '2m x 2m2 - Bản lề Blum giảm chấn',
            imageUrl: 'https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=400&q=80',
            price: 38000000,
            quantity: 1,
            lineTotal: 38000000,
            stockAvailable: 1
          }
        ],
        subTotal: 38000000,
        shippingFee: 0,
        discountAmount: 1000000,
        totalAmount: 37000000,
        depositRequired: 0,
        depositPaid: 37000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '12/10/2026 10:00',
        completedAt: '15/10/2026 10:00',
        warrantyCode: 'BH-DCOR-ORD-108',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-01',
          failedAttempts: 0,
          trackingHistory: [
            { time: '12/10/2026 10:00', status: 'Giao hàng thành công', description: 'Đã hoàn thiện lắp đặt tại phòng ngủ', location: 'Quận 1' }
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-6', timestamp: '15/10/2026 10:00', actor: 'Hệ thống Cron Job', action: 'Hoàn tất đơn hàng tự động', detail: 'Hết 72h đổi trả không khiếu nại. Chốt doanh thu 37 triệu và kích hoạt mã BH-DCOR-ORD-108.' }
        ]
      },

      // 9. CANCELLED (Đã hủy do khách đổi ý)
      {
        id: 'ord-109',
        orderNumber: 'DCOR-ORD-109',
        createdAt: '15/10/2026 09:30',
        status: 'CANCELLED',
        paymentStatus: 'UNPAID',
        paymentMethod: 'COD',
        customerName: 'Ngô Kiến Huy',
        phone: '0909090909',
        email: 'huy.ngo@yahoo.com',
        address: '12 Tôn Đức Thắng, Quận 1',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-109-1',
            name: 'Sofa băng văng da bò Cognac',
            sku: 'SF-VANG-01',
            variant: '2m - Da Microfiber cao cấp',
            imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&w=400&q=80',
            price: 42000000,
            quantity: 1,
            lineTotal: 42000000,
            stockAvailable: 2
          }
        ],
        subTotal: 42000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 42000000,
        depositRequired: 0,
        depositPaid: 0,
        remainingAmount: 42000000,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        cancelReason: 'Khách hàng đổi ý mua mẫu khác tại cửa hàng',
        cancelledBy: 'Ngô Kiến Huy (Khách tự hủy)',
        delivery: {
          provider: 'Chưa chỉ định',
          failedAttempts: 0,
          trackingHistory: []
        },
        qcChecklist: { surfaceChecked: false, structureChecked: false, cushionLeatherChecked: false, protectiveWrapDone: false },
        auditLogs: [
          { id: 'log-2', timestamp: '15/10/2026 10:15', actor: 'Khách hàng', action: 'Hủy đơn hàng', detail: 'Khách hủy trực tiếp qua trang tài khoản cá nhân. Đã nhả tồn kho.' }
        ]
      },

      // 10. RETURN_REQUESTED (Khách khiếu nại yêu cầu đổi trả, có ảnh lỗi)
      {
        id: 'ord-110',
        orderNumber: 'DCOR-ORD-110',
        createdAt: '14/10/2026 15:00',
        status: 'RETURN_REQUESTED',
        paymentStatus: 'PAID',
        paymentMethod: 'VNPAY',
        customerName: 'Dương Cẩm Lynh',
        phone: '0937665544',
        email: 'lynh.duong@gmail.com',
        address: 'Penthouse B2, Landmark 81, Bình Thạnh',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận Bình Thạnh',
        ward: 'Phường 22',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-110-1',
            name: 'Bàn trà Coda mặt đá Ceramic bóng',
            sku: 'TB-CODA-03',
            variant: 'Mặt đá vân mây trắng, viền vàng kim',
            imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=400&q=80',
            price: 10000000,
            quantity: 1,
            lineTotal: 10000000,
            stockAvailable: 3
          }
        ],
        subTotal: 10000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 10000000,
        depositRequired: 0,
        depositPaid: 10000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '17/10/2026 14:00',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-07',
          failedAttempts: 0,
          trackingHistory: [
            { time: '17/10/2026 14:00', status: 'Giao hàng thành công', description: 'Khách nhận kiện hàng', location: 'Landmark 81' }
          ]
        },
        returnInfo: {
          requestedAt: '18/10/2026 09:30',
          reason: 'Mặt đá nứt góc cạnh khi mở thùng kiểm tra',
          type: 'REFUND',
          customerNote: 'Lúc nhận hàng vội đi làm chưa bóc bọc xốp, sáng nay bóc ra thấy mặt đá bị nứt góc 5cm. Đề nghị đổi mặt mới hoặc hoàn tiền.',
          proofImages: [
            'https://images.unsplash.com/photo-1581404481488-cb9e68b377b2?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
          ]
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-4', timestamp: '18/10/2026 09:30', actor: 'Dương Cẩm Lynh (Khách hàng)', action: 'Yêu cầu trả hàng & hoàn tiền', detail: 'Khiếu nại mặt đá nứt góc. Đính kèm 2 ảnh chụp hiện trường.' }
        ]
      },

      // 11. RETURNED (Đã thu hồi hàng về kho QC, chờ kế toán chuyển tiền hoàn)
      {
        id: 'ord-111',
        orderNumber: 'DCOR-ORD-111',
        createdAt: '12/10/2026 10:00',
        status: 'RETURNED',
        paymentStatus: 'REFUND_PENDING',
        paymentMethod: 'BANK_TRANSFER',
        customerName: 'Tô Đình Khánh',
        phone: '0978999111',
        email: 'khanh.to@gmail.com',
        address: '88 Lê Văn Sỹ, Phường 13, Quận 3',
        province: 'Thành phố Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 13',
        showroom: 'Showroom Quận 1',
        items: [
          {
            id: 'item-111-1',
            name: 'Đèn thả trần Scandinavia Art',
            sku: 'LP-SCAN-02',
            variant: 'Khung đồng thau nguyên khối',
            imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
            price: 8000000,
            quantity: 1,
            lineTotal: 8000000,
            stockAvailable: 2
          }
        ],
        subTotal: 8000000,
        shippingFee: 0,
        discountAmount: 0,
        totalAmount: 8000000,
        depositRequired: 0,
        depositPaid: 8000000,
        remainingAmount: 0,
        isHighValue: false,
        isCustomDesign: false,
        isGift: false,
        deliveredAt: '14/10/2026 11:00',
        delivery: {
          provider: 'Xe tải DCOR Express',
          trackingCode: 'DCOR-TRUCK-03',
          failedAttempts: 0,
          trackingHistory: [
            { time: '14/10/2026 11:00', status: 'Giao thành công', description: 'Khách nhận đèn', location: 'Quận 3' }
          ]
        },
        returnInfo: {
          requestedAt: '15/10/2026 09:00',
          reason: 'Lắp lên trần không vừa kích thước phòng',
          type: 'REFUND',
          customerNote: 'Phòng khách nhà trần thấp quá không treo đèn thả dài được, xin phép hoàn lại.',
          proofImages: [
            'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80'
          ],
          qcReport: {
            inspector: 'Kỹ thuật viên Quang Huy',
            condition: 'Hàng còn nguyên thùng hộp, chóa đèn và dây đúc không trầy xước, phụ kiện đủ 100%.',
            defectAssessment: 'Đạt chuẩn 100% nhập lại kho bán mới.',
            refundPercent: 100,
            restockOption: 'RESTOCK_SALE'
          },
          refundAmount: 8000000
        },
        qcChecklist: { surfaceChecked: true, structureChecked: true, cushionLeatherChecked: true, protectiveWrapDone: true },
        auditLogs: [
          { id: 'log-5', timestamp: '17/10/2026 14:00', actor: 'Thủ kho QC', action: 'Kiểm định hàng hoàn', detail: 'Hàng nguyên vẹn 100%. Đề xuất hoàn 8.000.000đ. Đang chờ kế toán chuyển tiền.' },
          { id: 'log-4', timestamp: '16/10/2026 10:00', actor: 'Admin Tran', action: 'Chấp thuận thu hồi', detail: 'Điều phối xe lấy hàng về kho.' }
        ]
      }
    ];

    initialOrders.push(...this.getDefaultWarrantyOrders());
    this.save(initialOrders);
  }
}

export { OrdersService as OrdersV2Service };
