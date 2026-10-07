import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, Filter, Printer, Package, AlertCircle, CheckCircle2, FileText, Truck, CreditCard 
} from 'lucide-angular';

interface OrderProduct {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  products: OrderProduct[];
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentMethod: string;
  showroom: string;
  createdAt: string;
  isGift: boolean;
  giftMessage?: string;
  hidePrice: boolean;
  isHighValue?: boolean;
}

const mockOrders: Order[] = [
  {
    id: 'DCOR-ORD-001',
    customerName: 'Nguyễn Văn Minh',
    phone: '0901234567',
    address: '239 Hoàng Diệu, Phường 8, Quận 4, Tp. Hồ Chí Minh',
    products: [
      { name: 'Sofa Indivi 2,5 chỗ (Chân gỗ sồi, vải nỉ Copenhagen nâu)', sku: 'SF-IND-01', quantity: 1, price: 51290000 }
    ],
    totalAmount: 51290000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Chuyển khoản',
    showroom: 'Showroom Quận 1',
    createdAt: '2026-06-14 10:30',
    isGift: false,
    hidePrice: false,
    isHighValue: false,
  },
  {
    id: 'DCOR-ORD-002',
    customerName: 'Lê Thu Trang',
    phone: '0912345678',
    address: 'Khu công nghệ cao, Quận 9, Tp. Hồ Chí Minh',
    products: [
      { name: 'Sofa Indivi 3 chỗ (Chân thép, da Napoli đen)', sku: 'SF-IND-02', quantity: 1, price: 80000000 },
      { name: 'Bàn trà Coda', sku: 'TB-CODA-01', quantity: 1, price: 10000000 }
    ],
    totalAmount: 90000000,
    status: 'PROCESSING',
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Tiền mặt',
    showroom: 'Showroom Thủ Đức',
    createdAt: '2026-06-13 15:45',
    isGift: true,
    giftMessage: 'Chúc mừng tân gia em gái! Chúc gia đình luôn hạnh phúc.',
    hidePrice: true,
    isHighValue: true,
  },
  {
    id: 'DCOR-ORD-003',
    customerName: 'Trần Đại Quang',
    phone: '0933445566',
    address: '12 Nguyễn Huệ, Quận 1, Tp. Hồ Chí Minh',
    products: [
      { name: 'Bàn ăn 6 ghế Gỗ Sồi', sku: 'TB-OAK-06', quantity: 1, price: 25000000 }
    ],
    totalAmount: 25000000,
    status: 'SHIPPING',
    paymentStatus: 'PAID',
    paymentMethod: 'Thẻ tín dụng',
    showroom: 'Kho Tổng',
    createdAt: '2026-06-12 09:00',
    isGift: false,
    hidePrice: false,
    isHighValue: false,
  },
  {
    id: 'DCOR-ORD-004',
    customerName: 'Phạm Thị Hương',
    phone: '0988776655',
    address: '45 Lê Lợi, Quận 1, Tp. Hồ Chí Minh',
    products: [
      { name: 'Giường ngủ thông minh 1m8', sku: 'BD-SMART-18', quantity: 1, price: 125000000 }
    ],
    totalAmount: 125000000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Trả góp',
    showroom: 'Showroom Quận 1',
    createdAt: '2026-06-15 14:20',
    isGift: false,
    hidePrice: false,
    isHighValue: true,
  }
];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {
  icons = { Search, Filter, Printer, Package, AlertCircle, CheckCircle2, FileText, Truck, CreditCard };
  
  orders = mockOrders;
  activeStatus = 'ALL';
  activePrintOrder: Order | null = null;

  constructor(private router: Router) {}

  ngOnInit() {}

  get statusFilters() {
    return [
      { id: 'ALL', label: 'Tất cả' },
      { id: 'PENDING', label: 'Chờ xác nhận', count: this.orders.filter(o => o.status === 'PENDING').length },
      { id: 'PROCESSING', label: 'Đang xử lý', count: this.orders.filter(o => o.status === 'PROCESSING').length },
      { id: 'SHIPPING', label: 'Đang vận chuyển', count: this.orders.filter(o => o.status === 'SHIPPING').length },
      { id: 'DELIVERED', label: 'Hoàn tất' },
      { id: 'CANCELLED', label: 'Đã hủy' },
      { id: 'HIGH_VALUE', label: 'Đơn giá trị lớn', count: this.orders.filter(o => o.isHighValue).length }
    ];
  }

  get filteredOrders() {
    return this.orders.filter(order => {
      if (this.activeStatus === 'ALL') return true;
      if (this.activeStatus === 'HIGH_VALUE') return order.isHighValue;
      return order.status === this.activeStatus;
    });
  }

  formatVND(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  handlePrint(order: Order) {
    this.activePrintOrder = order;
    setTimeout(() => {
      window.print();
    }, 300);
  }

  getPendingCount() {
    return this.orders.filter(o => o.status === 'PENDING').length;
  }

  getShippingCount() {
    return this.orders.filter(o => o.status === 'SHIPPING').length;
  }

  getHighValueCount() {
    return this.orders.filter(o => o.isHighValue).length;
  }
}
