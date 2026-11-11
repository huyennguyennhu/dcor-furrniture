import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  LucideAngularModule, 
  ArrowLeft, User, Phone, Mail, MapPin, ShoppingBag, CreditCard, Award, CheckCircle2, AlertCircle, ShieldAlert 
} from 'lucide-angular';
import { environment } from '../../../../../../environments/environment';

export interface CustomerAddress {
  id: string;
  receiverName: string;
  phone: string;
  detail: string;
  ward?: string;
  district?: string;
  province: string;
  isDefault: boolean;
}

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  itemsCount: number;
}

export interface CustomerDetail {
  id: string;
  name: string;
  fullName: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  type: string;
  membership: string;
  memberBadge: string;
  companyName?: string;
  taxCode?: string;
  rewardPoints: number;
  totalSpent: number;
  status: 'Hoạt động' | 'Khóa';
  createdAt: string;
  ordersCount: number;
  addresses: CustomerAddress[];
  orders: CustomerOrderSummary[];
}

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './customer-detail.html'
})
export class CustomerDetailComponent implements OnInit {
  icons = { ArrowLeft, User, Phone, Mail, MapPin, ShoppingBag, CreditCard, Award, CheckCircle2, AlertCircle, ShieldAlert };
  
  customerId = '';
  customer: CustomerDetail | null = null;
  isLoading = false;
  showStatusModal = false;
  isUpdatingStatus = false;

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.customerId = params.get('id') || '';
      if (this.customerId) {
        this.loadCustomerDetail();
      }
    });
  }

  loadCustomerDetail() {
    this.isLoading = true;
    this.http.get<CustomerDetail>(`${environment.apiUrl}/admin/customers/${this.customerId}`).subscribe({
      next: (data) => {
        this.customer = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi tải chi tiết khách hàng:', err);
        this.isLoading = false;
      }
    });
  }

  toggleStatus() {
    if (!this.customer) return;
    this.showStatusModal = true;
  }

  confirmToggleStatus() {
    if (!this.customer || this.isUpdatingStatus) return;
    const newStatus = this.customer.status === 'Khóa' ? 'Hoạt động' : 'Khóa';
    this.isUpdatingStatus = true;
    this.http.put(`${environment.apiUrl}/admin/customers/${this.customerId}/status`, { status: newStatus }).subscribe({
      next: () => {
        this.isUpdatingStatus = false;
        this.showStatusModal = false;
        this.loadCustomerDetail();
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        console.error('Không thể cập nhật trạng thái:', err);
        alert(err.error?.message || 'Không thể cập nhật trạng thái.');
      }
    });
  }

  closeStatusModal() {
    if (this.isUpdatingStatus) return;
    this.showStatusModal = false;
  }

  goBack() {
    this.router.navigate(['/admin/customers']);
  }

  formatVND(value: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  }

  formatAddress(addr: CustomerAddress): string {
    return [addr.detail, addr.ward, addr.district, addr.province].filter(p => !!p).join(', ');
  }
}
