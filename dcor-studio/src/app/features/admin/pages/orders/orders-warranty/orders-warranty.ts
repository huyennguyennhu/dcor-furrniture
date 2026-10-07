import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, AlertCircle, CheckCircle2, Clock, Wrench, ArrowRightLeft, AlertOctagon 
} from 'lucide-angular';

interface WarrantyRequest {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  orderId: string;
  productName: string;
  variant: string;
  sku: string;
  reason: string;
  purchaseDate: string;
  warrantyExpiry: string;
  status: 'PENDING' | 'INSPECTING' | 'PROCESSING' | 'REPAIRING' | 'REPLACING' | 'COMPLETED' | 'REJECTED';
  assignee: string;
  isExpiringSoon: boolean;
}

const mockWarranties: WarrantyRequest[] = [
  {
    id: 'WAR-000125',
    createdAt: '01/09/2026 09:30',
    customerName: 'Nguyễn Như Huyền',
    phone: '0901234567',
    orderId: 'ORD-001025',
    productName: 'Sofa Luna (3 chỗ)',
    variant: 'Da thật màu Nâu',
    sku: 'SF-LUN-03',
    reason: 'Lỗi nệm mút',
    purchaseDate: '15/05/2026',
    warrantyExpiry: '15/05/2028',
    status: 'PENDING',
    assignee: 'Chưa phân công',
    isExpiringSoon: false,
  },
  {
    id: 'WAR-000126',
    createdAt: '30/08/2026 14:15',
    customerName: 'Trần Văn Kiên',
    phone: '0912345678',
    orderId: 'ORD-001012',
    productName: 'Bàn ăn Gỗ Sồi nguyên khối',
    variant: '1m6 - Tự nhiên',
    sku: 'TB-OAK-01',
    reason: 'Lỗi nứt vỡ/Cong vênh',
    purchaseDate: '20/01/2026',
    warrantyExpiry: '20/01/2028',
    status: 'INSPECTING',
    assignee: 'KTV Hoàng Sơn',
    isExpiringSoon: false,
  },
  {
    id: 'WAR-000127',
    createdAt: '28/08/2026 10:20',
    customerName: 'Lê Thu Trang',
    phone: '0988776655',
    orderId: 'ORD-000850',
    productName: 'Giường ngủ thông minh 1m8',
    variant: 'Xám đậm',
    sku: 'BD-SMART-18',
    reason: 'Lỗi phụ kiện/Bản lề',
    purchaseDate: '10/09/2024',
    warrantyExpiry: '10/09/2026',
    status: 'REPAIRING',
    assignee: 'KTV Minh Quân',
    isExpiringSoon: true,
  },
  {
    id: 'WAR-000128',
    createdAt: '25/08/2026 08:45',
    customerName: 'Phạm Hương',
    phone: '0933445566',
    orderId: 'ORD-000720',
    productName: 'Tủ quần áo cánh kính 4 buồng',
    variant: 'Trắng/Kính cường lực',
    sku: 'CB-GLS-04',
    reason: 'Lỗi bề mặt/Trầy xước',
    purchaseDate: '05/03/2025',
    warrantyExpiry: '05/03/2027',
    status: 'COMPLETED',
    assignee: 'KTV Hoàng Sơn',
    isExpiringSoon: false,
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
  icons = { Search, AlertCircle, CheckCircle2, Clock, Wrench, ArrowRightLeft, AlertOctagon };

  mockWarranties = mockWarranties;
  activeStatus = 'ALL';

  constructor(private router: Router) {}

  ngOnInit() {}

  get statusFilters() {
    return [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'PENDING', label: 'Chờ tiếp nhận', count: this.mockWarranties.filter(r => r.status === 'PENDING').length },
      { id: 'INSPECTING', label: 'Đang kiểm tra', count: this.mockWarranties.filter(r => r.status === 'INSPECTING').length },
      { id: 'PROCESSING', label: 'Chờ xử lý', count: this.mockWarranties.filter(r => r.status === 'PROCESSING').length },
      { id: 'REPAIRING', label: 'Đang sửa chữa', count: this.mockWarranties.filter(r => r.status === 'REPAIRING').length },
      { id: 'REPLACING', label: 'Đang thay thế', count: this.mockWarranties.filter(r => r.status === 'REPLACING').length },
      { id: 'COMPLETED', label: 'Hoàn tất' }
    ];
  }

  get filteredWarranties() {
    return this.mockWarranties.filter(req => {
      if (this.activeStatus === 'ALL') return true;
      return req.status === this.activeStatus;
    });
  }

  getPendingCount() {
    return this.mockWarranties.filter(r => r.status === 'PENDING').length;
  }

  getRepairingCount() {
    return this.mockWarranties.filter(r => r.status === 'REPAIRING').length;
  }

  getExpiringSoonCount() {
    return this.mockWarranties.filter(r => r.isExpiringSoon).length;
  }

  getCompletedCount() {
    return this.mockWarranties.filter(r => r.status === 'COMPLETED').length;
  }
}
