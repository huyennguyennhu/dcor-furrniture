import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Search, 
  Filter, 
  FileText, 
  PhoneCall, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Package, 
  Pencil, 
  Clock, 
  Ruler, 
  Layers, 
  Palette, 
  X, 
  Upload, 
  AlertCircle 
} from 'lucide-angular';
import { 
  CustomRequestService, 
  CustomRequest, 
  CustomRequestStatus, 
  CUSTOM_STATUS_MAP, 
  StatusMeta 
} from '../../../../core/services/custom-request.service';

@Component({
  selector: 'app-admin-custom-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './custom-requests.html',
  styleUrl: './custom-requests.css',
})
export class AdminCustomRequestsComponent implements OnInit {
  readonly icons = {
    Search,
    Filter,
    FileText,
    PhoneCall,
    Eye,
    CheckCircle2,
    XCircle,
    DollarSign,
    Package,
    Pencil,
    Clock,
    Ruler,
    Layers,
    Palette,
    X,
    Upload,
    AlertCircle
  };

  requests: CustomRequest[] = [];
  selectedTab: 'ALL' | CustomRequestStatus = 'ALL';
  searchQuery: string = '';

  // Active Modals
  activeModal: 'NONE' | 'QUOTE' | 'CONTRACT' | 'CANCEL' | 'DETAIL' = 'NONE';
  activeRequest: CustomRequest | null = null;

  // Form states for Quote
  quoteForm = {
    price: 35000000,
    deposit: 10000000,
    drawing3dUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
    notes: '',
    staffName: 'KTS. Lê Nam (DCor Studio)'
  };

  // Form state for Contract
  contractForm = {
    scanUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    staffName: 'Ban Hợp Đồng DCor'
  };

  // Form state for Cancel
  cancelForm = {
    reason: 'Khách hàng thay đổi ý định / kế hoạch kinh phí',
    staffName: 'Admin'
  };

  readonly cancelPresetReasons = [
    'Khách hàng thay đổi kế hoạch kinh phí',
    'Kích thước thực tế không vừa thang máy / cửa vào',
    'Khách đổi sang mẫu nội thất sẵn có tại showroom',
    'Không liên hệ được khách hàng qua điện thoại/email',
    'Khách hủy yêu cầu theo nguyện vọng cá nhân'
  ];

  constructor(public customRequestService: CustomRequestService) {}

  ngOnInit(): void {
    this.customRequestService.requests$.subscribe(items => {
      this.requests = items;
    });
  }

  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  toggleColumnSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredRequests(): CustomRequest[] {
    const list = this.requests.filter(req => {
      // Tab filter
      if (this.selectedTab !== 'ALL' && req.status !== this.selectedTab) {
        return false;
      }
      // Search filter
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const matchCode = req.code.toLowerCase().includes(query);
        const matchProduct = req.productName.toLowerCase().includes(query);
        const matchCustomer = req.customerName.toLowerCase().includes(query);
        const matchPhone = req.customerPhone.includes(query);
        const matchColor = req.colorName?.toLowerCase().includes(query);
        return matchCode || matchProduct || matchCustomer || matchPhone || matchColor;
      }
      return true;
    });

    if (!this.sortColumn) return list;
    return list.sort((a, b) => {
      let diff = 0;
      if (this.sortColumn === 'code') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        diff = timeA !== timeB ? timeA - timeB : a.code.localeCompare(b.code, 'vi');
      } else if (this.sortColumn === 'customer') {
        diff = a.customerName.localeCompare(b.customerName, 'vi');
      } else if (this.sortColumn === 'product') {
        diff = a.productName.localeCompare(b.productName, 'vi');
      } else if (this.sortColumn === 'material') {
        const matA = (a.material || '') + ' ' + (a.colorName || '');
        const matB = (b.material || '') + ' ' + (b.colorName || '');
        diff = matA.localeCompare(matB, 'vi');
      } else if (this.sortColumn === 'price') {
        const pA = a.quotedPrice || 0;
        const pB = b.quotedPrice || 0;
        diff = pA - pB;
      } else if (this.sortColumn === 'status') {
        diff = a.status.localeCompare(b.status, 'vi');
      }
      return this.sortDirection === 'asc' ? diff : -diff;
    });
  }

  getStatusMeta(status: CustomRequestStatus): StatusMeta {
    return CUSTOM_STATUS_MAP[status];
  }

  getTabCount(tab: 'ALL' | CustomRequestStatus): number {
    if (tab === 'ALL') return this.requests.length;
    return this.requests.filter(r => r.status === tab).length;
  }

  // KPI Calculations
  get pendingCount(): number {
    return this.requests.filter(r => r.status === 'PENDING_REVIEW').length;
  }

  get consultingCount(): number {
    return this.requests.filter(r => r.status === 'CONSULTING' || r.status === 'QUOTED').length;
  }

  get contractPaymentCount(): number {
    return this.requests.filter(r => 
      r.status === 'AWAITING_CONTRACT' || 
      r.status === 'CONTRACT_SIGNED' || 
      r.status === 'AWAITING_PAYMENT'
    ).length;
  }

  get processingCount(): number {
    return this.requests.filter(r => r.status === 'PROCESSING').length;
  }

  // Actions
  onStartConsulting(req: CustomRequest): void {
    this.customRequestService.startConsulting(req.id, 'KTS. Lê Nam (DCor Studio)');
  }

  openQuoteModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.quoteForm.price = req.quotedPrice || 32000000;
    this.quoteForm.deposit = req.quotedDeposit || 10000000;
    this.quoteForm.drawing3dUrl = req.drawing3dUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80';
    this.quoteForm.notes = req.adminNotes || '';
    this.activeModal = 'QUOTE';
  }

  submitQuote(): void {
    if (!this.activeRequest) return;
    this.customRequestService.sendQuote(this.activeRequest.id, {
      quotedPrice: this.quoteForm.price,
      quotedDeposit: this.quoteForm.deposit,
      drawing3dUrl: this.quoteForm.drawing3dUrl,
      notes: this.quoteForm.notes,
      staffName: this.quoteForm.staffName
    });
    this.closeModal();
  }

  onPrepareContract(req: CustomRequest): void {
    this.customRequestService.prepareContract(req.id, 'Phòng Pháp Chế & Hợp Đồng DCor');
  }

  openContractModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.contractForm.scanUrl = req.contractScanUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80';
    this.activeModal = 'CONTRACT';
  }

  submitContractSigned(): void {
    if (!this.activeRequest) return;
    this.customRequestService.confirmContractSigned(
      this.activeRequest.id, 
      this.contractForm.scanUrl, 
      this.contractForm.staffName
    );
    this.closeModal();
  }

  onRequestPayment(req: CustomRequest): void {
    this.customRequestService.requestPayment(req.id, 'Kế toán Trưởng DCor');
  }

  onConfirmPaymentAndProduce(req: CustomRequest): void {
    if (confirm(`Xác nhận đã nhận cọc và chuyển đơn ${req.code} xuống xưởng sản xuất?`)) {
      this.customRequestService.confirmPaymentAndStartProduction(req.id, 'Quản đốc xưởng may đo DCor');
    }
  }

  openCancelModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.cancelForm.reason = this.cancelPresetReasons[0];
    this.activeModal = 'CANCEL';
  }

  submitCancel(): void {
    if (!this.activeRequest) return;
    this.customRequestService.cancelRequest(
      this.activeRequest.id, 
      this.cancelForm.reason, 
      this.cancelForm.staffName
    );
    this.closeModal();
  }

  openDetailModal(req: CustomRequest): void {
    this.activeRequest = req;
    this.activeModal = 'DETAIL';
  }

  closeModal(): void {
    this.activeModal = 'NONE';
    this.activeRequest = null;
  }
}
