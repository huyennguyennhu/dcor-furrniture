import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-appointment-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-requests.html'
})
export class AppointmentRequestsComponent {
  searchTerm = '';
  records = [
    { code: 'ADV-00128', customer: 'Vũ Thanh Tâm', phone: '0901 234 567', topic: 'Tư vấn thiết kế căn hộ', receivedAt: '11/10/2026', status: 'Mới' },
    { code: 'ADV-00127', customer: 'Đặng Mỹ Linh', phone: '0912 345 678', topic: 'Tư vấn sản phẩm phòng ngủ', receivedAt: '10/10/2026', status: 'Đang xử lý' },
    { code: 'ADV-00126', customer: 'Phan Minh Đức', phone: '0988 776 655', topic: 'Tư vấn thiết kế phòng ăn', receivedAt: '09/10/2026', status: 'Đã liên hệ' }
  ];

  get filteredRecords() {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => `${record.code} ${record.customer} ${record.phone} ${record.topic}`.toLocaleLowerCase().includes(term));
  }
}
