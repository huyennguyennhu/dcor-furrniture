import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  ArrowLeft, CheckCircle2, Truck, Package, User, MapPin, CreditCard, Box, FileText,
  Printer, XCircle, AlertCircle, X, Check
} from 'lucide-angular';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-detail.html',
  styleUrls: ['./order-detail.css']
})
export class OrderDetailComponent implements OnInit {
  icons = { 
    ArrowLeft, CheckCircle2, Truck, Package, User, MapPin, CreditCard, Box, FileText,
    Printer, XCircle, AlertCircle, X, Check
  };
  orderId = 'DCOR-ORD-001';
  isExportConfirmed = false;
  isOrderCancelled = false;

  // Toast notification state
  showToast = false;
  toastMessage = '';
  toastSubMessage = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any = null;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id') || 'DCOR-ORD-001';
    });
  }

  goBack() {
    this.router.navigate(['/admin/orders']);
  }

  formatVND(value: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  handlePrint() {
    window.print();
  }

  onConfirmExport() {
    if (this.isExportConfirmed) return;
    this.isExportConfirmed = true;
    this.triggerToast('Xác nhận xuất kho thành công!', 'Đã tạo lệnh xuất và chuyển trạng thái đơn hàng sang Đang vận chuyển.', 'success');
  }

  onCancelOrder() {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này sẽ cập nhật trạng thái đơn thành Đã hủy.')) {
      this.isOrderCancelled = true;
      this.triggerToast('Đã hủy đơn hàng', 'Đơn hàng #' + this.orderId + ' đã chuyển sang trạng thái Đã hủy.', 'error');
    }
  }

  triggerToast(message: string, subMessage: string = '', type: 'success' | 'error' | 'info' = 'success') {
    this.toastMessage = message;
    this.toastSubMessage = subMessage;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, 4500);
  }

  closeToast() {
    this.showToast = false;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }

  onViewCustomerDetail() {
    this.triggerToast('Module Khách hàng', 'Vui lòng đợi hoàn thành module Khách hàng nhé!', 'info');
    alert('Vui lòng đợi hoàn thành module Khách hàng nhé!');
  }
}

