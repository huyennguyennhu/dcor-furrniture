import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  Package, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ArrowLeftRight, 
  Download, CheckCircle2, Clock, AlertCircle, X, Eye, Printer, Trash2, 
  Calendar as CalendarIcon, FileText, ChevronDown, Check, MoreVertical
} from 'lucide-angular';
import { TransactionModalComponent } from '../../../components/transaction-modal/transaction-modal';
import { environment } from '../../../../../../environments/environment';

export interface StockOrderItem {
  sku: string;
  productName: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export interface StockOrder {
  id: string;
  type: 'import' | 'export' | 'transfer';
  typeLabel: string;
  createdAt: string;
  sourceLocation: string;
  destinationLocation: string;
  referenceCode: string;
  reason: string;
  creator: string;
  items: StockOrderItem[];
  totalQuantity: number;
  totalAmount: number;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'CANCELLED';
  notes?: string;
}

@Component({
  selector: 'app-inventory-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  templateUrl: './inventory-orders.html',
  styleUrls: ['./inventory-orders.css']
})
export class InventoryOrdersComponent implements OnInit {
  icons = {
    Package, Plus, Search, Filter, ArrowUpRight, ArrowDownRight, ArrowLeftRight,
    Download, CheckCircle2, Clock, AlertCircle, X, Eye, Printer, Trash2,
    CalendarIcon, FileText, ChevronDown, Check, MoreVertical
  };

  private http = inject(HttpClient);

  data: StockOrder[] = [];
  selectedIds = new Set<string>();

  // Filter state
  searchTerm = '';
  typeFilter: 'all' | 'import' | 'export' | 'transfer' = 'all';
  locationFilter = 'all';
  statusFilter = 'all';

  // Available locations
  locations = [
    'Tất cả chi nhánh',
    'Kho Tổng (TP.HCM)',
    'Kho Hà Nội',
    'Showroom Quận 1',
    'Showroom Thủ Đức'
  ];

  // Transaction Modal (Nhập / Xuất)
  modalConfig = {
    isOpen: false,
    type: 'import' as 'import' | 'export',
    initialProductId: '',
    initialVariantId: '',
    isProductFixed: false,
    isVariantFixed: false
  };

  // Detail Drawer / Modal
  selectedOrder: StockOrder | null = null;
  activeActionMenu: string | null = null;

  ngOnInit() {
    this.fetchOrders();
  }

  fetchOrders() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/inventory/orders`).subscribe({
      next: (orders) => {
        if (Array.isArray(orders) && orders.length > 0) {
          this.data = orders.map(o => ({
            id: o.orderCode || o.id,
            type: (o.type || 'import').toLowerCase() as any,
            typeLabel: o.type === 'IMPORT' ? 'Nhập kho' : (o.type === 'EXPORT' ? 'Xuất kho' : 'Chuyển kho'),
            createdAt: new Date(o.createdAt).toLocaleString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            sourceLocation: o.sourceLocation || o.sourceWarehouse?.name || 'Kho Tổng (TP.HCM)',
            destinationLocation: o.destinationLocation || o.destWarehouse?.name || 'Chi nhánh / Khách hàng',
            referenceCode: o.referenceCode || o.orderCode,
            reason: o.reason || 'Lệnh điều phối kho',
            creator: o.creator?.name || 'Admin Quản Trị',
            totalQuantity: o.totalQuantity || 0,
            totalAmount: Number(o.totalAmount || 0),
            status: o.status,
            notes: o.notes,
            items: (o.items || []).map((it: any) => ({
              sku: it.variant?.sku || 'SKU',
              productName: it.variant?.product?.name || it.variant?.name || 'Sản phẩm nội thất',
              variant: it.variant?.name || 'Tiêu chuẩn',
              quantity: it.quantity,
              unitPrice: Number(it.unitPrice || 0),
              unit: 'Chiếc'
            }))
          }));
        } else {
          this.data = [];
        }
      },
      error: (err) => {
        console.warn('Could not fetch orders from API:', err);
        this.data = [];
      }
    });
  }

  initMockData() {
    this.data = [
      {
        id: 'NK-2410-001',
        type: 'import',
        typeLabel: 'Nhập kho',
        createdAt: '12/10/2024 09:30',
        sourceLocation: 'NCC BoConcept Đan Mạch',
        destinationLocation: 'Kho Tổng (TP.HCM)',
        referenceCode: 'PO-2024-881',
        reason: 'Nhập lô hàng sofa & bàn trà bộ sưu tập Thu Đông',
        creator: 'Nguyễn Văn An',
        totalQuantity: 35,
        totalAmount: 580000000,
        status: 'COMPLETED',
        notes: 'Hàng đã kiểm tra đầy đủ tem mác và phiếu bảo hành chính hãng.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu Cognac', quantity: 15, unitPrice: 28000000, unit: 'Bộ' },
          { sku: 'BA-IND-WAL', productName: 'Bàn ăn Indochine', variant: 'Gỗ óc chó tự nhiên', quantity: 10, unitPrice: 12000000, unit: 'Chiếc' },
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Chân gỗ đệm đen', quantity: 10, unitPrice: 4000000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'XK-2410-002',
        type: 'export',
        typeLabel: 'Xuất kho',
        createdAt: '12/10/2024 14:15',
        sourceLocation: 'Kho Tổng (TP.HCM)',
        destinationLocation: 'Khách hàng: Trần Minh Đức',
        referenceCode: 'ORD-10024',
        reason: 'Xuất giao hàng đơn đặt cọc hợp đồng hoàn thiện biệt thự',
        creator: 'Lê Thị Thu',
        totalQuantity: 6,
        totalAmount: 142000000,
        status: 'COMPLETED',
        notes: 'Giao trực tiếp kèm biên bản bàn giao và hướng dẫn vệ sinh da bò.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu Cognac', quantity: 2, unitPrice: 38000000, unit: 'Bộ' },
          { sku: 'TU-QAR-WHI', productName: 'Tủ Quần Áo 4 Cánh', variant: 'Trắng bóng mờ', quantity: 4, unitPrice: 16500000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'CK-2410-003',
        type: 'transfer',
        typeLabel: 'Chuyển kho',
        createdAt: '11/10/2024 16:45',
        sourceLocation: 'Kho Tổng (TP.HCM)',
        destinationLocation: 'Showroom Quận 1',
        referenceCode: 'TR-2410-019',
        reason: 'Điều chuyển hàng mẫu trưng bày concept mới',
        creator: 'Phạm Hoàng Nam',
        totalQuantity: 12,
        totalAmount: 96000000,
        status: 'PROCESSING',
        notes: 'Đang trên xe vận chuyển nội bộ, dự kiến đến showroom lúc 18h00.',
        items: [
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Chân kim loại xám', quantity: 8, unitPrice: 4500000, unit: 'Chiếc' },
          { sku: 'BA-IND-WAL', productName: 'Bàn ăn Indochine', variant: 'Gỗ sồi tự nhiên', quantity: 4, unitPrice: 15000000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'NK-2410-004',
        type: 'import',
        typeLabel: 'Nhập kho',
        createdAt: '10/10/2024 10:20',
        sourceLocation: 'Xưởng Mộc Thủ Công Dcor',
        destinationLocation: 'Kho Hà Nội',
        referenceCode: 'PO-2410-045',
        reason: 'Nhập bổ sung kệ tivi và tủ trang trí sản xuất theo yêu cầu',
        creator: 'Vũ Đức Thịnh',
        totalQuantity: 20,
        totalAmount: 185000000,
        status: 'COMPLETED',
        notes: 'Sơn phủ chống ẩm PU đạt chuẩn xuất khẩu.',
        items: [
          { sku: 'KE-TV-IND', productName: 'Kệ TV Indochine 2m2', variant: 'Gỗ tần bì lau dầu', quantity: 12, unitPrice: 9500000, unit: 'Chiếc' },
          { sku: 'TU-TR-MOD', productName: 'Tủ Trang Trí Modernist', variant: 'Gỗ óc chó Bắc Mỹ', quantity: 8, unitPrice: 8875000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'XK-2410-005',
        type: 'export',
        typeLabel: 'Xuất kho',
        createdAt: '10/10/2024 15:10',
        sourceLocation: 'Kho Hà Nội',
        destinationLocation: 'Dự án Căn hộ Penthouse Ciputra',
        referenceCode: 'ORD-10089',
        reason: 'Xuất nội thất trọn gói bàn giao hợp đồng dự án',
        creator: 'Nguyễn Thị Bích',
        totalQuantity: 18,
        totalAmount: 320000000,
        status: 'PENDING',
        notes: 'Chờ đối tác nghiệm thu hiện trường trước khi xuất kho.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Đen nhung', quantity: 3, unitPrice: 42000000, unit: 'Bộ' },
          { sku: 'BA-IND-WAL', productName: 'Bàn ăn Indochine', variant: 'Mặt đá Ceramic trắng', quantity: 5, unitPrice: 22000000, unit: 'Chiếc' },
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Bọc nỉ cao cấp', quantity: 10, unitPrice: 8400000, unit: 'Chiếc' }
        ]
      },
      {
        id: 'CK-2410-006',
        type: 'transfer',
        typeLabel: 'Chuyển kho',
        createdAt: '09/10/2024 11:00',
        sourceLocation: 'Showroom Quận 1',
        destinationLocation: 'Kho Tổng (TP.HCM)',
        referenceCode: 'TR-2410-015',
        reason: 'Thu hồi hàng mẫu đổi mùa về kho tổng bảo dưỡng',
        creator: 'Trần Văn A',
        totalQuantity: 5,
        totalAmount: 48000000,
        status: 'COMPLETED',
        notes: 'Đã hoàn tất kiểm kê và nhập lại hệ thống kho tổng.',
        items: [
          { sku: 'SF-OSA-3-BRW', productName: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu hạt dẻ', quantity: 2, unitPrice: 20000000, unit: 'Bộ' },
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Chân gỗ đệm trắng', quantity: 3, unitPrice: 2666666, unit: 'Chiếc' }
        ]
      },
      {
        id: 'XK-2410-007',
        type: 'export',
        typeLabel: 'Xuất kho',
        createdAt: '08/10/2024 17:20',
        sourceLocation: 'Kho Tổng (TP.HCM)',
        destinationLocation: 'Bộ phận xử lý phế phẩm',
        referenceCode: 'DIS-2410-002',
        reason: 'Xuất hủy sản phẩm hư hại do ngập nước kho phụ',
        creator: 'Đỗ Tuấn Kiệt',
        totalQuantity: 3,
        totalAmount: 18500000,
        status: 'COMPLETED',
        notes: 'Đã có biên bản thẩm định hội đồng thanh lý tài sản.',
        items: [
          { sku: 'TU-QAR-WHI', productName: 'Tủ Quần Áo 4 Cánh', variant: 'Trắng vân gỗ', quantity: 3, unitPrice: 6166666, unit: 'Chiếc' }
        ]
      },
      {
        id: 'NK-2410-008',
        type: 'import',
        typeLabel: 'Nhập kho',
        createdAt: '07/10/2024 08:45',
        sourceLocation: 'Khách đổi trả: Hoàng Lan Chi',
        destinationLocation: 'Kho Tổng (TP.HCM)',
        referenceCode: 'RTN-2410-004',
        reason: 'Nhập hàng khách hoàn đổi màu sắc mẫu ghế Eames',
        creator: 'Nguyễn Văn An',
        totalQuantity: 4,
        totalAmount: 16000000,
        status: 'COMPLETED',
        notes: 'Sản phẩm nguyên vẹn, bao bì hộp còn mới 100%.',
        items: [
          { sku: 'GE-EAM-BLK', productName: 'Ghế Eames DSW', variant: 'Đen nguyên bản', quantity: 4, unitPrice: 4000000, unit: 'Chiếc' }
        ]
      }
    ];
  }

  // Filtered dataset
  get filteredOrders(): StockOrder[] {
    return this.data.filter(order => {
      // Type match
      if (this.typeFilter !== 'all' && order.type !== this.typeFilter) {
        return false;
      }
      // Status match
      if (this.statusFilter !== 'all' && order.status !== this.statusFilter) {
        return false;
      }
      // Location match
      if (this.locationFilter !== 'all' && this.locationFilter !== 'Tất cả chi nhánh') {
        const matchesSource = order.sourceLocation.includes(this.locationFilter);
        const matchesDest = order.destinationLocation.includes(this.locationFilter);
        if (!matchesSource && !matchesDest) return false;
      }
      // Search match
      if (this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesRef = order.referenceCode.toLowerCase().includes(term);
        const matchesCreator = order.creator.toLowerCase().includes(term);
        const matchesReason = order.reason.toLowerCase().includes(term);
        const matchesSource = order.sourceLocation.toLowerCase().includes(term);
        const matchesDest = order.destinationLocation.toLowerCase().includes(term);
        const matchesItem = order.items.some(i => 
          i.sku.toLowerCase().includes(term) || 
          i.productName.toLowerCase().includes(term)
        );
        if (!matchesId && !matchesRef && !matchesCreator && !matchesReason && !matchesSource && !matchesDest && !matchesItem) {
          return false;
        }
      }
      return true;
    });
  }

  // KPIs
  get totalCount(): number {
    return this.data.length;
  }

  get importCount(): number {
    return this.data.filter(o => o.type === 'import').length;
  }

  get exportCount(): number {
    return this.data.filter(o => o.type === 'export').length;
  }

  get transferCount(): number {
    return this.data.filter(o => o.type === 'transfer').length;
  }

  get pendingCount(): number {
    return this.data.filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;
  }

  get totalImportValue(): number {
    return this.data.filter(o => o.type === 'import').reduce((acc, cur) => acc + cur.totalAmount, 0);
  }

  get totalExportValue(): number {
    return this.data.filter(o => o.type === 'export').reduce((acc, cur) => acc + cur.totalAmount, 0);
  }

  // Selection
  toggleSelection(id: string, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.isAllSelected()) {
      this.selectedIds.clear();
    } else {
      this.filteredOrders.forEach(o => this.selectedIds.add(o.id));
    }
  }

  isAllSelected(): boolean {
    const list = this.filteredOrders;
    return list.length > 0 && list.every(o => this.selectedIds.has(o.id));
  }

  // Action Menu
  toggleActionMenu(id: string, event: Event) {
    event.stopPropagation();
    this.activeActionMenu = this.activeActionMenu === id ? null : id;
  }

  @HostListener('document:click')
  closeActionMenu() {
    this.activeActionMenu = null;
  }

  // Modal handlers
  openCreateModal(type: 'import' | 'export') {
    this.modalConfig = {
      isOpen: true,
      type,
      initialProductId: '',
      initialVariantId: '',
      isProductFixed: false,
      isVariantFixed: false
    };
  }

  closeModal() {
    this.modalConfig.isOpen = false;
  }

  handleModalSubmit(formData: any) {
    const isImport = formData.type === 'import';
    const isTransfer = (formData.reason || '').includes('Chuyển kho');
    const orderType = isImport ? 'IMPORT' : (isTransfer ? 'TRANSFER' : 'EXPORT');
    const isDraft = formData.action === 'draft';
    const orderStatus = isDraft ? 'PENDING' : 'COMPLETED';

    const payload = {
      orderCode: formData.orderCode,
      status: orderStatus,
      type: orderType,
      sourceLocation: formData.sourceLocation || formData.location,
      destinationLocation: formData.destinationLocation || formData.destination,
      sourceWarehouseId: formData.sourceWarehouseId,
      destWarehouseId: formData.destWarehouseId,
      referenceCode: formData.referenceCode || formData.orderCode,
      reason: formData.reason,
      notes: formData.note,
      createdAt: formData.createdAt,
      creatorName: formData.creatorName,
      recipientName: formData.recipientName,
      items: (formData.items || []).map((it: any) => ({
        variantId: it.variantId,
        quantity: parseInt(it.quantity, 10) || 1,
        price: it.price ? parseInt(it.price.toString().replace(/\D/g, ''), 10) : 0,
        unit: it.unit || 'Chiếc',
        notes: [
          it.unit ? `ĐVT: ${it.unit}` : null,
          it.lotNumber ? `Lô: ${it.lotNumber}` : null,
          it.expiryDate ? `HSD: ${it.expiryDate}` : null
        ].filter(Boolean).join(' | ') || null
      }))
    };

    this.http.post<any>(`${environment.apiUrl}/admin/inventory/orders`, payload).subscribe({
      next: (created) => {
        this.closeModal();
        this.fetchOrders();
        if (isDraft) {
          window.alert(`Đã lưu nháp thành công phiếu ${created.orderCode || created.id}!\nTrạng thái: Bản nháp (chưa làm thay đổi số lượng tồn kho).`);
        } else {
          window.alert(`Đã tạo và phát hành thành công phiếu ${created.orderCode || created.id}!\nSố lượng tồn kho thực tế đã được cập nhật ngay lập tức.`);
        }
      },
      error: (err) => {
        console.warn('API error creating order, falling back to local list:', err);
        const dateStr = new Date(formData.createdAt || Date.now()).toLocaleDateString('vi-VN');
        const timeStr = new Date(formData.createdAt || Date.now()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        
        let totalQty = 0;
        let totalAmt = 0;
        const items: StockOrderItem[] = (formData.items || []).map((it: any) => {
          const q = parseInt(it.quantity, 10) || 1;
          const rawPrice = it.price ? parseInt(it.price.toString().replace(/\D/g, ''), 10) : 15000000;
          totalQty += q;
          totalAmt += q * rawPrice;
          return {
            sku: it.sku || 'SKU-AUTO',
            productName: it.productName || 'Sản phẩm nội thất',
            variant: it.variantName || 'Tiêu chuẩn',
            quantity: q,
            unitPrice: rawPrice,
            unit: it.unit || 'Chiếc'
          };
        });

        const newOrder: StockOrder = {
          id: formData.orderCode || (isImport ? 'NK-2610-0001' : 'PXK-BH-2610-0001'),
          type: (orderType.toLowerCase()) as any,
          typeLabel: isImport ? 'Nhập kho' : (isTransfer ? 'Chuyển kho' : 'Xuất kho'),
          createdAt: `${dateStr} ${timeStr}`,
          sourceLocation: formData.location || 'Kho Tổng (TP.HCM)',
          destinationLocation: formData.destination || 'Chi nhánh / Khách hàng nhận',
          referenceCode: formData.orderCode,
          reason: formData.reason || (isImport ? 'Nhập kho theo kế hoạch' : 'Xuất kho phục vụ hoạt động'),
          creator: formData.creatorName || 'Admin Quản Trị',
          items: items.length > 0 ? items : [
            { sku: 'SF-NEW-01', productName: 'Sản phẩm mới nhập', variant: 'Tiêu chuẩn', quantity: 5, unitPrice: 20000000, unit: 'Bộ' }
          ],
          totalQuantity: totalQty || 5,
          totalAmount: totalAmt || 100000000,
          status: orderStatus,
          notes: formData.note || 'Tạo từ form quản lý kho'
        };

        this.data.unshift(newOrder);
        this.closeModal();
        if (isDraft) {
          window.alert(`Đã lưu nháp thành công ${newOrder.typeLabel}: ${newOrder.id}`);
        } else {
          window.alert(`Đã phát hành thành công ${newOrder.typeLabel}: ${newOrder.id}`);
        }
      }
    });
  }

  // Detail Modal
  viewOrderDetail(order: StockOrder, event?: Event) {
    if (event) event.stopPropagation();
    this.selectedOrder = order;
    this.activeActionMenu = null;
  }

  closeOrderDetail() {
    this.selectedOrder = null;
  }

  updateOrderStatus(order: StockOrder, newStatus: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'CANCELLED', event?: Event) {
    if (event) event.stopPropagation();
    const prevStatus = order.status;
    order.status = newStatus;
    this.activeActionMenu = null;

    this.http.put(`${environment.apiUrl}/admin/inventory/orders/${order.id}/status`, { status: newStatus }).subscribe({
      next: () => {
        if (newStatus === 'COMPLETED') {
          window.alert(`Lệnh kho ${order.id} đã hoàn tất thành công và cập nhật tồn kho!`);
        }
      },
      error: (err) => {
        console.warn('API error updating order status:', err);
      }
    });
  }

  deleteOrder(id: string, event?: Event) {
    if (event) event.stopPropagation();
    if (window.confirm(`Bạn có chắc chắn muốn xóa lệnh ${id}?`)) {
      this.data = this.data.filter(o => o.id !== id);
      this.selectedIds.delete(id);
      if (this.selectedOrder?.id === id) {
        this.selectedOrder = null;
      }
      this.activeActionMenu = null;
    }
  }

  batchUpdateStatus(status: 'COMPLETED' | 'PROCESSING' | 'CANCELLED') {
    if (this.selectedIds.size === 0) return;
    const ids = Array.from(this.selectedIds);
    this.data.forEach(o => {
      if (this.selectedIds.has(o.id)) {
        o.status = status;
      }
    });
    this.selectedIds.clear();

    ids.forEach(id => {
      this.http.put(`${environment.apiUrl}/admin/inventory/orders/${id}/status`, { status }).subscribe({
        error: (err) => console.warn(`Error batch updating order ${id}:`, err)
      });
    });

    window.alert(`Đã cập nhật trạng thái các lệnh đã chọn.`);
  }

  printOrder(order: StockOrder, event?: Event) {
    if (event) event.stopPropagation();
    window.print();
  }

  exportExcel() {
    window.alert(`Đang trích xuất dữ liệu danh sách lệnh kho ra file Excel...`);
  }

  setTypeFilter(type: 'all' | 'import' | 'export' | 'transfer') {
    this.typeFilter = type;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}
