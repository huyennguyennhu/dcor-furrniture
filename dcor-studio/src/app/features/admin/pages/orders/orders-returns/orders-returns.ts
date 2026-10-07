import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, RotateCcw, AlertCircle, CheckCircle2, Clock, XCircle, Package 
} from 'lucide-angular';

interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  type: 'REFUND' | 'EXCHANGE' | 'RETURN';
  reason: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'RETURNING' | 'RECEIVED' | 'REFUNDING' | 'COMPLETED' | 'REJECTED';
  assignee: string;
  createdAt: string;
}

const mockReturns: ReturnRequest[] = [
  {
    id: 'RET-000125',
    orderId: 'ORD-001025',
    customerName: 'Nguyễn Như Huyền',
    productName: 'Sofa Luna',
    type: 'RETURN',
    reason: 'Sản phẩm lỗi/hư hỏng',
    status: 'REVIEWING',
    assignee: 'Admin Tran',
    createdAt: '01/09/2026 09:30',
  },
  {
    id: 'RET-000126',
    orderId: 'ORD-001026',
    customerName: 'Trần Văn Kiên',
    productName: 'Bàn trà Coda',
    type: 'EXCHANGE',
    reason: 'Sai sản phẩm',
    status: 'PENDING',
    assignee: 'Chưa phân công',
    createdAt: '01/09/2026 10:15',
  },
  {
    id: 'RET-000127',
    orderId: 'ORD-001022',
    customerName: 'Lê Thu Trang',
    productName: 'Giường ngủ thông minh',
    type: 'REFUND',
    reason: 'Không đúng mô tả',
    status: 'APPROVED',
    assignee: 'Admin Tran',
    createdAt: '30/08/2026 14:20',
  },
  {
    id: 'RET-000128',
    orderId: 'ORD-001015',
    customerName: 'Phạm Hương',
    productName: 'Ghế ăn Gỗ Sồi (x4)',
    type: 'RETURN',
    reason: 'Khách không còn nhu cầu',
    status: 'REJECTED',
    assignee: 'Manager',
    createdAt: '29/08/2026 08:45',
  }
];

@Component({
  selector: 'app-orders-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders-returns.html',
  styleUrls: ['./orders-returns.css']
})
export class OrdersReturnsComponent implements OnInit {
  icons = { Search, RotateCcw, AlertCircle, CheckCircle2, Clock, XCircle, Package };

  mockReturns = mockReturns;
  activeStatus = 'ALL';

  constructor(private router: Router) {}

  ngOnInit() {}

  get statusFilters() {
    return [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'PENDING', label: 'Chờ xử lý', count: this.mockReturns.filter(r => r.status === 'PENDING').length },
      { id: 'REVIEWING', label: 'Đang xem xét', count: this.mockReturns.filter(r => r.status === 'REVIEWING').length },
      { id: 'APPROVED', label: 'Đã duyệt' },
      { id: 'COMPLETED', label: 'Đã hoàn tất' },
      { id: 'REJECTED', label: 'Đã từ chối' }
    ];
  }

  get filteredReturns() {
    return this.mockReturns.filter(req => {
      if (this.activeStatus === 'ALL') return true;
      return req.status === this.activeStatus;
    });
  }

  getTypeBadgeText(type: string) {
    switch(type) {
      case 'RETURN': return 'Trả sản phẩm';
      case 'EXCHANGE': return 'Đổi sản phẩm';
      case 'REFUND': return 'Hoàn tiền';
      default: return type;
    }
  }

  getPendingCount() {
    return this.mockReturns.filter(r => r.status === 'PENDING').length;
  }

  getProcessingCount() {
    return this.mockReturns.filter(r => ['REVIEWING', 'RETURNING', 'RECEIVED', 'REFUNDING'].includes(r.status)).length;
  }

  getApprovedCount() {
    return this.mockReturns.filter(r => r.status === 'APPROVED').length;
  }

  getCompletedCount() {
    return this.mockReturns.filter(r => r.status === 'COMPLETED').length;
  }

  getRejectedCount() {
    return this.mockReturns.filter(r => r.status === 'REJECTED').length;
  }
}
