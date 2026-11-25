import { Component, OnInit, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrdersService } from '../services/orders.service';
import { OrderV2, OrderProduct } from '../models/order.model';
import { 
  LucideAngularModule, 
  Search, Shield, ShieldCheck, ShieldAlert, ShieldX,
  Calendar, CalendarCheck, Clock, CheckCircle2, AlertCircle,
  ExternalLink, RotateCcw,
  ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Package, Layers, User, Phone, Tag, Check, Sparkles
} from 'lucide-angular';

export interface WarrantyItem {
  id: string; // Mã thẻ / sổ bảo hành (VD: WAR-2026-1008)
  orderNumber: string; // Mã đơn hàng gốc (VD: DCOR-ORD-1008)
  customerName: string;
  phone: string;
  address: string;
  productName: string;
  sku: string;
  serialNumber: string;
  variant: string;
  category: 'SOFA' | 'CHAIR' | 'TABLE' | 'BED' | 'STORAGE' | 'LIGHTING' | 'DECOR';
  categoryLabel: string;
  image: string;
  price: number;
  purchaseDate: string; // Ngày mua / bàn giao
  activationDate: string; // Ngày bắt đầu tính bảo hành
  warrantyMonths: number; // Thời hạn cam kết (tháng)
  expiryDate: string; // Ngày hết hạn
  daysRemaining: number; // >0: còn ngày, <=0: đã quá hạn
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  coverageNotes: string[];
  termsNote: string;
}

const mockWarrantyDatabase: WarrantyItem[] = [
  {
    id: 'WAR-2026-1008',
    orderNumber: 'DCOR-ORD-1008',
    customerName: 'Nguyễn Văn An',
    phone: '0909876543',
    address: '120 Nguyễn Thị Minh Khai, P.6, Q.3, TP.HCM',
    productName: 'Salamanca 3 seater lounge sofa',
    sku: 'sofa-salamanca-01',
    serialNumber: 'SN-SAL-2026-0041',
    variant: 'Vải Nỉ Nhung Màu Be (Beige) • 3 Chỗ',
    category: 'SOFA',
    categoryLabel: 'Sofa & Ghế',
    image: '/assets/img/furniture-placeholder.svg',
    price: 32500000,
    purchaseDate: '15/09/2026',
    activationDate: '16/09/2026',
    warrantyMonths: 36,
    expiryDate: '16/09/2029',
    daysRemaining: 1051,
    status: 'ACTIVE',
    coverageNotes: [
      'Khung xương chịu lực gỗ thông nhập khẩu (Bảo hành 60 tháng)',
      'Đệm mút D40 đàn hồi cao chống xẹp lún (Bảo hành 36 tháng)',
      'Đường chỉ may và phụ kiện chân thép tĩnh điện (Bảo hành 24 tháng)'
    ],
    termsNote: 'Bảo hành miễn phí toàn diện đối với các lỗi biến dạng kết cấu khung sườn, xẹp lún đệm mút vượt tiêu chuẩn kỹ thuật nhà sản xuất.'
  },
  {
    id: 'WAR-2026-1007',
    orderNumber: 'DCOR-ORD-1007',
    customerName: 'Trần Thị Mai',
    phone: '0903123456',
    address: '45 Lê Duẩn, P. Bến Nghé, Quận 1, TP.HCM',
    productName: 'Ghế xoay thư giãn Imola da Cognac',
    sku: 'imola-chair-cognac',
    serialNumber: 'SN-IML-2026-0812',
    variant: 'Da bò Ý Semi-Aniline Cognac • Chân thép Crom xoay 360°',
    category: 'CHAIR',
    categoryLabel: 'Ghế thư giãn',
    image: '/assets/img/furniture-placeholder.svg',
    price: 18900000,
    purchaseDate: '12/08/2026',
    activationDate: '13/08/2026',
    warrantyMonths: 24,
    expiryDate: '13/08/2028',
    daysRemaining: 652,
    status: 'ACTIVE',
    coverageNotes: [
      'Mâm xoay chịu lực và trục thủy lực (Bảo hành 36 tháng)',
      'Kết cấu khung sợi thủy tinh đúc khuôn (Bảo hành 24 tháng)',
      'Bề mặt da bò thật và chỉ may (Bảo hành 12 tháng)'
    ],
    termsNote: 'Bảo hành các lỗi kẹt mâm xoay, gãy cốt trục xoay, bong tróc nẹp viền không do tác động ngoại lực hay hóa chất ăn mòn.'
  },
  {
    id: 'WAR-2026-0994',
    orderNumber: 'DCOR-ORD-0994',
    customerName: 'Đặng Ngọc Trâm',
    phone: '0918234567',
    address: '88 Nguyễn Du, P. Bến Nghé, Quận 1, TP.HCM',
    productName: 'Đèn sàn Kizu đá cẩm thạch trắng tự nhiên',
    sku: 'kizu-lamp-white',
    serialNumber: 'SN-KZU-2026-0199',
    variant: 'Đá Marble Trắng Carrara • Chao Acrylic khuyếch tán sáng',
    category: 'LIGHTING',
    categoryLabel: 'Đèn & Trang trí',
    image: '/assets/img/furniture-placeholder.svg',
    price: 8500000,
    purchaseDate: '05/07/2026',
    activationDate: '06/07/2026',
    warrantyMonths: 12,
    expiryDate: '06/07/2027',
    daysRemaining: 249,
    status: 'ACTIVE',
    coverageNotes: [
      'Bộ nguồn Driver LED và công tắc cảm ứng dimmer (Bảo hành 12 tháng)',
      'Kết cấu đế đá tự nhiên nguyên khối (Bảo hành 24 tháng)'
    ],
    termsNote: 'Bảo hành lỗi chập chờn nguồn điện, hỏng mạch dimmer. Không bảo hành trường hợp rơi vỡ chao đèn hoặc ngấm nước.'
  },
  {
    id: 'WAR-2026-EX07',
    orderNumber: 'DCOR-ORD-2026-EX07',
    customerName: 'Hoàng Thị Thảo Trang',
    phone: '0976543210',
    address: 'Toà Landmark 81, P.22, Q. Bình Thạnh, TP.HCM',
    productName: 'Ghế bành Adelaide chân xoay kim loại đen',
    sku: 'adelaide-armchair-blk',
    serialNumber: 'SN-ADL-2026-0371',
    variant: 'Vải nỉ Bouclé Trắng kem • Chân xoay tĩnh điện đen mờ',
    category: 'CHAIR',
    categoryLabel: 'Sofa & Ghế',
    image: '/assets/img/furniture-placeholder.svg',
    price: 12500000,
    purchaseDate: '21/10/2026',
    activationDate: '22/10/2026',
    warrantyMonths: 24,
    expiryDate: '22/10/2028',
    daysRemaining: 722,
    status: 'ACTIVE',
    coverageNotes: [
      'Khung chịu lực và chân xoay (Bảo hành 24 tháng)',
      'Chất liệu vải bọc và đệm form (Bảo hành 12 tháng)'
    ],
    termsNote: 'Bảo hành miễn phí lỗi kẹt cơ cấu xoay, bong mối hàn tĩnh điện.'
  },
  {
    id: 'WAR-2025-0101',
    orderNumber: 'DCOR-ORD-101',
    customerName: 'Trần Văn Kiên',
    phone: '0912345678',
    address: '23 Trương Định, P. Võ Thị Sáu, Quận 3, TP.HCM',
    productName: 'Bàn ăn Gỗ Sồi nguyên khối Heritage',
    sku: 'table-oak-heritage',
    serialNumber: 'SN-TB-2025-0991',
    variant: 'Gỗ Sồi Bắc Mỹ tự nhiên • Kích thước 2m0 x 0.9m',
    category: 'TABLE',
    categoryLabel: 'Bàn ăn',
    image: '/assets/img/furniture-placeholder.svg',
    price: 24500000,
    purchaseDate: '20/01/2025',
    activationDate: '21/01/2025',
    warrantyMonths: 36,
    expiryDate: '21/01/2028',
    daysRemaining: 448,
    status: 'ACTIVE',
    coverageNotes: [
      'Kết cấu mặt bàn và chân chịu lực (Bảo hành 36 tháng)',
      'Lớp sơn phủ PU chống thấm (Bảo hành 24 tháng)'
    ],
    termsNote: 'Bảo hành lỗi co ngót, nứt toác tự nhiên của thớ gỗ trong điều kiện nhiệt độ phòng thông thường.'
  },
  {
    id: 'WAR-2025-0105',
    orderNumber: 'DCOR-ORD-105',
    customerName: 'Đỗ Thùy Linh',
    phone: '0905112233',
    address: '15 Mai Chí Thọ, P. An Phú, TP. Thủ Đức, TP.HCM',
    productName: 'Bàn trà mặt kính Noguchi Sculptural',
    sku: 'coffee-table-noguchi',
    serialNumber: 'SN-NG-2025-0552',
    variant: 'Kính cường lực 19mm • Chân gỗ óc chó tự nhiên',
    category: 'TABLE',
    categoryLabel: 'Bàn trà',
    image: '/assets/img/furniture-placeholder.svg',
    price: 14200000,
    purchaseDate: '18/06/2025',
    activationDate: '19/06/2025',
    warrantyMonths: 24,
    expiryDate: '19/06/2027',
    daysRemaining: 232,
    status: 'ACTIVE',
    coverageNotes: [
      'Chân đế gỗ tự nhiên uốn cong (Bảo hành 24 tháng)',
      'Chốt xoay trục liên kết kim loại (Bảo hành 24 tháng)'
    ],
    termsNote: 'Bảo hành chốt trục liên kết, bong khớp nối gỗ.'
  },
  {
    id: 'WAR-2024-0104',
    orderNumber: 'DCOR-ORD-104',
    customerName: 'Nguyễn Minh Tâm',
    phone: '0987112233',
    address: '72 Thảo Điền, P. Thảo Điền, TP. Thủ Đức, TP.HCM',
    productName: 'Kệ tivi gỗ óc chó cao cấp Lugano',
    sku: 'tv-unit-lugano-walnut',
    serialNumber: 'SN-LGN-2024-0412',
    variant: 'Veneer Óc chó tự nhiên • Ngăn kéo giảm chấn Blum',
    category: 'STORAGE',
    categoryLabel: 'Tủ & Kệ',
    image: '/assets/img/furniture-placeholder.svg',
    price: 16800000,
    purchaseDate: '15/11/2024',
    activationDate: '16/11/2024',
    warrantyMonths: 24,
    expiryDate: '16/11/2026',
    daysRemaining: 17,
    status: 'EXPIRING_SOON',
    coverageNotes: [
      'Ray trượt ngăn kéo giảm chấn Blum (Bảo hành 24 tháng)',
      'Khung thân gỗ veneer cao cấp (Bảo hành 24 tháng)'
    ],
    termsNote: 'Sản phẩm sắp hết hạn trong 17 ngày. Khách hàng vui lòng liên hệ sớm nếu có nhu cầu kiểm tra bảo dưỡng kỹ thuật.'
  },
  {
    id: 'WAR-2024-0103',
    orderNumber: 'DCOR-ORD-103',
    customerName: 'Vũ Hoàng Long',
    phone: '0944667788',
    address: '28 Tôn Đức Thắng, P. Bến Nghé, Quận 1, TP.HCM',
    productName: 'Bàn ăn mở rộng Milano mặt Ceramic',
    sku: 'table-milano-ext',
    serialNumber: 'SN-MLN-2024-0820',
    variant: 'Mặt Ceramic chống xước vân mây • Khung nhôm mở rộng',
    category: 'TABLE',
    categoryLabel: 'Bàn ăn',
    image: '/assets/img/furniture-placeholder.svg',
    price: 28900000,
    purchaseDate: '25/11/2024',
    activationDate: '26/11/2024',
    warrantyMonths: 24,
    expiryDate: '26/11/2026',
    daysRemaining: 27,
    status: 'EXPIRING_SOON',
    coverageNotes: [
      'Cơ chế ray trượt thông minh kéo mở rộng (Bảo hành 24 tháng)',
      'Mặt đá Ceramic chịu nhiệt (Bảo hành 24 tháng)'
    ],
    termsNote: 'Sắp hết hạn trong 27 ngày. Được hỗ trợ tra dầu bảo dưỡng ray trượt miễn phí trước khi hết hạn.'
  },
  {
    id: 'WAR-2024-0102',
    orderNumber: 'DCOR-ORD-102',
    customerName: 'Lê Thu Trang',
    phone: '0988776655',
    address: '104 Phổ Quang, P.2, Q. Tân Bình, TP.HCM',
    productName: 'Giường ngủ bọc vải thông minh Mezzo',
    sku: 'bed-smart-mezzo-18',
    serialNumber: 'SN-MZZ-2024-0102',
    variant: 'Bọc nỉ cao cấp Xám Đậm • Giát giường nâng thủy lực 1m8',
    category: 'BED',
    categoryLabel: 'Giường ngủ',
    image: '/assets/img/furniture-placeholder.svg',
    price: 26500000,
    purchaseDate: '10/09/2024',
    activationDate: '11/09/2024',
    warrantyMonths: 24,
    expiryDate: '11/09/2026',
    daysRemaining: -49,
    status: 'EXPIRED',
    coverageNotes: [
      'Piston thủy lực nâng hạ giát giường (Bảo hành 24 tháng)',
      'Khung sắt và nan gỗ giát giường (Bảo hành 24 tháng)'
    ],
    termsNote: 'Sản phẩm đã hết hạn bảo hành chính hãng từ ngày 11/09/2026. DCOR cung cấp gói dịch vụ sửa chữa bảo dưỡng tính phí ưu đãi cho khách hàng cũ.'
  },
  {
    id: 'WAR-2023-0100',
    orderNumber: 'DCOR-ORD-100',
    customerName: 'Phạm Hương',
    phone: '0933445566',
    address: '55 Nguyễn Hữu Cảnh, P.19, Q. Bình Thạnh, TP.HCM',
    productName: 'Tủ quần áo cánh kính 4 buồng Boston',
    sku: 'wardrobe-boston-glass',
    serialNumber: 'SN-BST-2023-0881',
    variant: 'Khung nhôm Anode Đen • Kính khói cường lực & Đèn LED',
    category: 'STORAGE',
    categoryLabel: 'Tủ & Kệ',
    image: '/assets/img/furniture-placeholder.svg',
    price: 38000000,
    purchaseDate: '05/03/2023',
    activationDate: '06/03/2023',
    warrantyMonths: 36,
    expiryDate: '06/03/2026',
    daysRemaining: -238,
    status: 'EXPIRED',
    coverageNotes: [
      'Hệ bản lề giảm chấn cánh kính và ray trượt (Bảo hành 36 tháng)',
      'Cảm biến và hệ thống đèn LED profile (Bảo hành 12 tháng)'
    ],
    termsNote: 'Đã hết hạn bảo hành từ ngày 06/03/2026. Hỗ trợ thay thế linh kiện chính hãng có tính phí theo bảng giá niêm yết.'
  },
  {
    id: 'WAR-2025-0106',
    orderNumber: 'DCOR-ORD-106',
    customerName: 'Hoàng Kim Ngân',
    phone: '0938445566',
    address: '66 Pasteur, P. Bến Nghé, Quận 1, TP.HCM',
    productName: 'Bàn làm việc thông minh Cupertino',
    sku: 'desk-cupertino-walnut',
    serialNumber: 'SN-CPT-2025-0219',
    variant: 'Gỗ Óc chó tự nhiên • Tích hợp sạc không dây & loa Bluetooth',
    category: 'TABLE',
    categoryLabel: 'Bàn làm việc',
    image: '/assets/img/furniture-placeholder.svg',
    price: 19500000,
    purchaseDate: '10/02/2025',
    activationDate: '11/02/2025',
    warrantyMonths: 24,
    expiryDate: '11/02/2027',
    daysRemaining: 104,
    status: 'ACTIVE',
    coverageNotes: [
      'Mạch điện tử âm bàn và loa không dây (Bảo hành 12 tháng)',
      'Kết cấu gỗ và hộc kéo trượt (Bảo hành 24 tháng)'
    ],
    termsNote: 'Bảo hành kết cấu cơ khí gỗ và các module sạc điện tử chính hãng.'
  },
  {
    id: 'WAR-2026-0108',
    orderNumber: 'DCOR-ORD-108',
    customerName: 'Đặng Thu Hà',
    phone: '0914998877',
    address: '18 Nam Kỳ Khởi Nghĩa, P. Nguyễn Thái Bình, Quận 1, TP.HCM',
    productName: 'Gương đứng toàn thân viền da cao cấp Adnet',
    sku: 'mirror-adnet-round',
    serialNumber: 'SN-ADN-2026-0033',
    variant: 'Dây quai da bò Ý khâu tay màu Nâu Đậm • Gương tráng bạc 5mm',
    category: 'DECOR',
    categoryLabel: 'Đèn & Trang trí',
    image: '/assets/img/furniture-placeholder.svg',
    price: 7800000,
    purchaseDate: '01/04/2026',
    activationDate: '02/04/2026',
    warrantyMonths: 24,
    expiryDate: '02/04/2028',
    daysRemaining: 520,
    status: 'ACTIVE',
    coverageNotes: [
      'Mặt gương tráng bạc chống ố mốc (Bảo hành 24 tháng)',
      'Dây đai da và móc chốt đồng thau (Bảo hành 24 tháng)'
    ],
    termsNote: 'Bảo hành lỗi ố mốc thủy ngân mặt gương, đứt mối chỉ quai da.'
  }
];

@Component({
  selector: 'app-orders-warranty',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-warranty.html',
  styleUrls: ['./orders-warranty.css']
})
export class OrdersWarrantyComponent implements OnInit {
  icons = { 
    Search, Shield, ShieldCheck, ShieldAlert, ShieldX,
    Calendar, CalendarCheck, Clock, CheckCircle2, AlertCircle,
    ExternalLink, RotateCcw,
    ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    X, Package, Layers, User, Phone, Tag, Check, Sparkles
  };

  database: WarrantyItem[] = mockWarrantyDatabase;
  activeStatusTab: 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'LONG_TERM' = 'ALL';

  // Search & Filter state
  searchQuery = '';
  selectedCategory = 'ALL';
  selectedPeriod = 'ALL';

  // Dropdown visibility
  showCategoryDropdown = false;
  showPeriodDropdown = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  categoryOptions = [
    { label: 'Tất cả phân loại', value: 'ALL' },
    { label: 'Sofa & Ghế', value: 'SOFA_CHAIR' },
    { label: 'Bàn ăn & Bàn trà', value: 'TABLE' },
    { label: 'Giường ngủ', value: 'BED' },
    { label: 'Tủ & Kệ', value: 'STORAGE' },
    { label: 'Đèn & Trang trí', value: 'LIGHTING_DECOR' }
  ];

  periodOptions = [
    { label: 'Tất cả thời hạn', value: 'ALL' },
    { label: '12 tháng (1 năm)', value: '12' },
    { label: '24 tháng (2 năm)', value: '24' },
    { label: '36 tháng (3 năm)', value: '36' },
    { label: '60 tháng (5 năm)', value: '60' }
  ];

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ordersService: OrdersService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.currentPage = 1;
      }
    });

    this.ordersService.orders$.subscribe(orders => {
      if (orders && orders.length > 0) {
        this.buildWarrantyDatabase(orders);
        this.cdr.markForCheck();
      }
    });
  }

  // Tự động phân tích và sinh danh sách bảo hành từ các đơn hàng thực tế đã giao/hoàn tất
  private buildWarrantyDatabase(orders: OrderV2[]): void {
    const realItems: WarrantyItem[] = [];

    orders.forEach(order => {
      if (order.status !== 'DELIVERED' && order.status !== 'COMPLETED') return;

      const products: OrderProduct[] = (order as any).products || order.items || [];
      const cleanNum = (order.orderNumber || 'ORD').replace(/[^a-zA-Z0-9]/g, '');

      products.forEach((product: OrderProduct, idx: number) => {
        const id = order.warrantyCode || (products.length > 1 ? `WAR-2026-${cleanNum.slice(-4)}-${idx + 1}` : `WAR-2026-${cleanNum.slice(-4)}`);
        const purchaseDate = this.extractDate(order.createdAt);
        const activationDate = this.extractDate(order.deliveredAt || order.delivery?.trackingHistory?.[0]?.time || order.createdAt);

        // Phân loại nhóm hàng & thời hạn bảo hành phù hợp đặc thù nội thất
        const lower = ((product.name || '') + ' ' + (product.sku || '') + ' ' + (product.variant || '')).toLowerCase();
        let category: 'SOFA' | 'CHAIR' | 'TABLE' | 'BED' | 'STORAGE' | 'LIGHTING' | 'DECOR' = 'SOFA';
        let categoryLabel = 'Sofa & Ghế';
        let warrantyMonths = 24;

        if (lower.includes('sofa') || lower.includes('salon') || lower.includes('lounge')) {
          category = 'SOFA';
          categoryLabel = 'Sofa & Ghế';
          warrantyMonths = 36;
        } else if (lower.includes('ghế') || lower.includes('chair') || lower.includes('armchair')) {
          category = 'CHAIR';
          categoryLabel = 'Ghế thư giãn';
          warrantyMonths = 24;
        } else if (lower.includes('bàn') || lower.includes('table') || lower.includes('desk')) {
          category = 'TABLE';
          categoryLabel = 'Bàn ăn & Bàn trà';
          warrantyMonths = 24;
        } else if (lower.includes('giường') || lower.includes('bed')) {
          category = 'BED';
          categoryLabel = 'Giường ngủ';
          warrantyMonths = 36;
        } else if (lower.includes('tủ') || lower.includes('kệ') || lower.includes('storage') || lower.includes('wardrobe')) {
          category = 'STORAGE';
          categoryLabel = 'Tủ & Kệ';
          warrantyMonths = 24;
        } else if (lower.includes('đèn') || lower.includes('lamp') || lower.includes('gương') || lower.includes('mirror') || lower.includes('decor')) {
          category = 'LIGHTING';
          categoryLabel = 'Đèn & Trang trí';
          warrantyMonths = 12;
        }

        // Tính ngày hết hạn & số ngày còn lại
        const actDate = this.parseDate(activationDate);
        const expDateObj = new Date(actDate);
        expDateObj.setMonth(expDateObj.getMonth() + warrantyMonths);
        const expiryDate = this.formatDate(expDateObj);

        const now = new Date();
        const diffTime = expDateObj.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
        if (daysRemaining <= 0) {
          status = 'EXPIRED';
        } else if (daysRemaining <= 30) {
          status = 'EXPIRING_SOON';
        }

        const coverageNotes = this.getCoverageNotes(category, warrantyMonths);
        const termsNote = `Bảo hành miễn phí toàn diện theo tiêu chuẩn xuất xưởng DCOR đối với các lỗi vật lý kết cấu, cong vênh nứt gãy và phụ kiện cơ khí trong thời hạn ${warrantyMonths} tháng kể từ ngày giao nhận hàng.`;

        const safeCustomerName = (order.customerName && !order.customerName.toLowerCase().includes('vãng lai'))
          ? order.customerName
          : 'Lê Minh Hoàng';

        realItems.push({
          id,
          orderNumber: order.orderNumber,
          customerName: safeCustomerName,
          phone: order.phone,
          address: order.address,
          productName: product.name,
          sku: product.sku,
          serialNumber: `SN-${cleanNum.slice(-4)}-${String(idx + 1).padStart(3, '0')}`,
          variant: product.variant || 'Tiêu chuẩn',
          category,
          categoryLabel,
          image: product.imageUrl || '/assets/img/furniture-placeholder.svg',
          price: product.price || 0,
          purchaseDate,
          activationDate,
          warrantyMonths,
          expiryDate,
          daysRemaining,
          status,
          coverageNotes,
          termsNote
        });
      });
    });

    // Hợp nhất dữ liệu thực tế lên đầu, giữ lại các bản ghi mẫu demo đặc sắc nếu không trùng
    const merged: WarrantyItem[] = [...realItems];
    mockWarrantyDatabase.forEach(m => {
      const exists = realItems.some(r => r.orderNumber === m.orderNumber || (r.customerName === m.customerName && r.productName === m.productName));
      if (!exists) {
        merged.push(m);
      }
    });

    this.database = merged;
  }

  private extractDate(dateStr?: string): string {
    if (!dateStr) return this.formatDate(new Date());
    const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (match) {
      const pad = (n: string | number) => Number(n) < 10 ? '0' + Number(n) : '' + Number(n);
      return `${pad(match[1])}/${pad(match[2])}/${match[3]}`;
    }
    return this.formatDate(new Date());
  }

  private parseDate(dStr: string): Date {
    try {
      const parts = dStr.split(/[\/\-]/);
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    } catch (_) {}
    return new Date();
  }

  private formatDate(d: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : '' + n;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  private getCoverageNotes(category: string, months: number): string[] {
    switch (category) {
      case 'SOFA':
        return [
          `Khung xương chịu lực gỗ thông nhập khẩu (Bảo hành 60 tháng)`,
          `Đệm mút đàn hồi cao chống xẹp lún (Bảo hành ${months} tháng)`,
          `Đường chỉ may và chân thép tĩnh điện (Bảo hành 24 tháng)`
        ];
      case 'CHAIR':
        return [
          `Mâm xoay chịu lực và trục cơ khí (Bảo hành ${months} tháng)`,
          `Kết cấu khung sườn chịu lực (Bảo hành 24 tháng)`,
          `Bề mặt bọc đệm và chỉ may (Bảo hành 12 tháng)`
        ];
      case 'TABLE':
        return [
          `Kết cấu mặt bàn và liên kết chân chịu lực (Bảo hành ${months} tháng)`,
          `Lớp sơn phủ PU / Ceramic chống thấm (Bảo hành 24 tháng)`
        ];
      case 'BED':
        return [
          `Khung nan giát giường & piston thủy lực (Bảo hành ${months} tháng)`,
          `Kết cấu khung đầu giường và viền bọc (Bảo hành 24 tháng)`
        ];
      case 'STORAGE':
        return [
          `Ray trượt ngăn kéo và bản lề giảm chấn Blum (Bảo hành ${months} tháng)`,
          `Kết cấu thùng và cánh tủ (Bảo hành 24 tháng)`
        ];
      case 'LIGHTING':
      case 'DECOR':
        return [
          `Bộ nguồn biến tần Driver LED và công tắc cảm ứng (Bảo hành ${months} tháng)`,
          `Khung thân vỏ chịu lực (Bảo hành 24 tháng)`
        ];
      default:
        return [
          `Khung kết cấu chịu tải xuất xưởng (Bảo hành ${months} tháng)`,
          `Phụ kiện liên kết và ốc vít cơ khí (Bảo hành 24 tháng)`
        ];
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.category-filter-wrapper')) {
      this.showCategoryDropdown = false;
    }
    if (!target.closest('.period-filter-wrapper')) {
      this.showPeriodDropdown = false;
    }
  }

  // --- STAT COUNTERS ---
  get totalCount(): number {
    return this.database.length;
  }

  get activeCount(): number {
    return this.database.filter(i => i.status === 'ACTIVE').length;
  }

  get expiringSoonCount(): number {
    return this.database.filter(i => i.status === 'EXPIRING_SOON').length;
  }

  get expiredCount(): number {
    return this.database.filter(i => i.status === 'EXPIRED').length;
  }

  get longTermCount(): number {
    return this.database.filter(i => i.warrantyMonths >= 36 && i.status !== 'EXPIRED').length;
  }

  // --- LABELS ---
  get selectedCategoryLabel(): string {
    const found = this.categoryOptions.find(o => o.value === this.selectedCategory);
    return found ? found.label : 'Tất cả phân loại';
  }

  get selectedPeriodLabel(): string {
    const found = this.periodOptions.find(o => o.value === this.selectedPeriod);
    return found ? found.label : 'Tất cả thời hạn';
  }

  // --- FILTER ACTIONS ---
  setStatusTab(tab: 'ALL' | 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'LONG_TERM') {
    this.activeStatusTab = tab;
    this.currentPage = 1;
  }

  selectCategory(val: string) {
    this.selectedCategory = val;
    this.showCategoryDropdown = false;
    this.currentPage = 1;
  }

  selectPeriod(val: string) {
    this.selectedPeriod = val;
    this.showPeriodDropdown = false;
    this.currentPage = 1;
  }

  hasActiveFilters(): boolean {
    return (
      (this.searchQuery || '').trim() !== '' ||
      this.activeStatusTab !== 'ALL' ||
      this.selectedCategory !== 'ALL' ||
      this.selectedPeriod !== 'ALL'
    );
  }

  resetFilters() {
    this.searchQuery = '';
    this.activeStatusTab = 'ALL';
    this.selectedCategory = 'ALL';
    this.selectedPeriod = 'ALL';
    this.showCategoryDropdown = false;
    this.showPeriodDropdown = false;
    this.currentPage = 1;
  }

  // --- FILTERED LIST ---
  get filteredItems(): WarrantyItem[] {
    const q = (this.searchQuery || '').trim().toLowerCase();

    return this.database.filter(item => {
      // Tab Status filter
      if (this.activeStatusTab === 'ACTIVE' && item.status !== 'ACTIVE') return false;
      if (this.activeStatusTab === 'EXPIRING_SOON' && item.status !== 'EXPIRING_SOON') return false;
      if (this.activeStatusTab === 'EXPIRED' && item.status !== 'EXPIRED') return false;
      if (this.activeStatusTab === 'LONG_TERM') {
        if (item.warrantyMonths < 36 || item.status === 'EXPIRED') return false;
      }

      // Search Query filter (matches ID, order, name, phone, SKU, serial, product name)
      if (q) {
        const matchId = (item.id || '').toLowerCase().includes(q);
        const matchOrder = (item.orderNumber || '').toLowerCase().includes(q);
        const matchCustomer = (item.customerName || '').toLowerCase().includes(q);
        const matchPhone = (item.phone || '').toLowerCase().includes(q);
        const matchProduct = (item.productName || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);

        if (!matchId && !matchOrder && !matchCustomer && !matchPhone && !matchProduct && !matchSku && !matchSerial) {
          return false;
        }
      }

      // Category filter
      if (this.selectedCategory !== 'ALL') {
        if (this.selectedCategory === 'SOFA_CHAIR' && item.category !== 'SOFA' && item.category !== 'CHAIR') return false;
        if (this.selectedCategory === 'TABLE' && item.category !== 'TABLE') return false;
        if (this.selectedCategory === 'BED' && item.category !== 'BED') return false;
        if (this.selectedCategory === 'STORAGE' && item.category !== 'STORAGE') return false;
        if (this.selectedCategory === 'LIGHTING_DECOR' && item.category !== 'LIGHTING' && item.category !== 'DECOR') return false;
      }

      // Period filter
      if (this.selectedPeriod !== 'ALL') {
        if (item.warrantyMonths.toString() !== this.selectedPeriod) return false;
      }

      return true;
    });
  }

  // --- PAGINATION ---
  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.pageSize) || 1;
  }

  get paginatedItems(): WarrantyItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages || p === this.currentPage) return;
    this.currentPage = p;
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStartIndex(): number {
    if (this.filteredItems.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredItems.length);
  }

  navigateToOrder(orderNumber: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/admin/orders', orderNumber]);
  }

  navigateToCustomer(item: WarrantyItem, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/admin/customers'], {
      queryParams: { q: item.phone || item.customerName }
    });
  }

  // --- FORMATTERS ---
  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  getRemainingBadgeLines(item: WarrantyItem): { main: string; sub?: string } {
    if (item.status === 'ACTIVE') {
      if (item.daysRemaining > 365) {
        const years = Math.floor(item.daysRemaining / 365);
        const months = Math.floor((item.daysRemaining % 365) / 30);
        return {
          main: `Còn ${years} năm ${months > 0 ? months + ' tháng' : ''}`.trim(),
          sub: `(${item.daysRemaining} ngày)`
        };
      } else if (item.daysRemaining > 30) {
        const months = Math.floor(item.daysRemaining / 30);
        return {
          main: `Còn ${months} tháng`,
          sub: `(${item.daysRemaining} ngày)`
        };
      } else {
        return {
          main: `Còn ${item.daysRemaining} ngày`
        };
      }
    } else if (item.status === 'EXPIRING_SOON') {
      return {
        main: `Chỉ còn ${item.daysRemaining} ngày`
      };
    } else {
      const overdue = Math.abs(item.daysRemaining);
      return {
        main: `Đã hết hạn`,
        sub: `(${overdue} ngày trước)`
      };
    }
  }

  getRemainingBadgeText(item: WarrantyItem): string {
    const lines = this.getRemainingBadgeLines(item);
    return lines.sub ? `${lines.main} ${lines.sub}` : lines.main;
  }
}
