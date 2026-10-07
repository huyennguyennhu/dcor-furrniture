import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractModalComponent } from '../../../../shared/components/contract-modal/contract-modal';
import { OtpModalComponent } from '../../../../shared/components/otp-modal/otp-modal';

@Component({
  selector: 'app-custom-requests',
  standalone: true,
  imports: [CommonModule, ContractModalComponent, OtpModalComponent],
  templateUrl: './custom-requests.html',
  styleUrls: ['./custom-requests.css']
})
export class CustomRequestsComponent {
  // Mock Data
  requests = [
    {
      id: 'REQ-101',
      title: 'Thiết kế Sofa góc chữ L phong cách Bắc Âu',
      date: '2026-10-01',
      status: 'contract_signing', // draft, 3d_drawing, contract_signing, deposit_pending, processing, completed
      customerName: 'Nguyễn Huyền',
      customerPhone: '0912345678'
    },
    {
      id: 'REQ-102',
      title: 'Thiết kế trọn bộ Bàn ăn mặt đá Ceramic',
      date: '2026-09-25',
      status: 'drawing_3d',
      customerName: 'Nguyễn Huyền',
      customerPhone: '0912345678'
    }
  ];

  selectedRequest: any = null;
  
  isContractModalOpen = false;
  isOtpModalOpen = false;

  getStatusText(status: string) {
    switch(status) {
      case 'draft': return 'Chờ duyệt yêu cầu';
      case 'drawing_3d': return 'Đang lên bản vẽ 3D';
      case 'contract_signing': return 'Chờ Ký Hợp đồng';
      case 'deposit_pending': return 'Chờ Đặt cọc';
      case 'processing': return 'Đang sản xuất';
      case 'completed': return 'Đã hoàn thành';
      default: return 'Không xác định';
    }
  }

  openContract(req: any) {
    this.selectedRequest = req;
    this.isContractModalOpen = true;
  }

  handleContractSigned() {
    this.isContractModalOpen = false;
    // Chuyển qua bước OTP
    setTimeout(() => {
      this.isOtpModalOpen = true;
    }, 300);
  }

  handleOtpVerified(otp: string) {
    // Sau khi OTP xác nhận thành công -> chuyển sang chờ đặt cọc
    if (this.selectedRequest) {
      this.selectedRequest.status = 'deposit_pending';
    }
    // Dùng setTimeout thay vì alert để UX đẹp hơn, nhưng alert cũng ok để mock
  }

  payDeposit(req: any) {
    req.status = 'processing';
  }
}
