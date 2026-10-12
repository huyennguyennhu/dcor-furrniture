import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-appointment-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-schedule.html'
})
export class AppointmentScheduleComponent {
  searchTerm = '';
  records = [
    { time: '09:00, 12/10/2026', customer: 'Nguyễn Hoàng Anh', topic: 'Tư vấn thiết kế phòng khách', channel: 'Showroom Quận 1', assignee: 'Lê Minh Khoa', status: 'Đã xác nhận' },
    { time: '10:30, 12/10/2026', customer: 'Trần Ngọc Mai', topic: 'Tư vấn chọn sofa', channel: 'Trực tuyến', assignee: 'Phạm Thu Hà', status: 'Chờ xác nhận' },
    { time: '14:00, 12/10/2026', customer: 'Lê Quốc Bảo', topic: 'Tư vấn thiết kế phòng ngủ', channel: 'Showroom Thủ Đức', assignee: 'Nguyễn Gia Linh', status: 'Đã xác nhận' }
  ];

  get filteredRecords() {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => `${record.customer} ${record.topic} ${record.assignee}`.toLocaleLowerCase().includes(term));
  }
}
