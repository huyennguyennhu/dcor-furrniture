import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-staff-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-accounts.html'
})
export class StaffAccountsComponent {
  searchTerm = '';
  records = [
    { name: 'Nguyễn Minh An', email: 'an.nguyen@dcor.vn', role: 'Quản trị viên', team: 'Vận hành', status: 'Đang hoạt động' },
    { name: 'Trần Gia Hân', email: 'han.tran@dcor.vn', role: 'Tư vấn bán hàng', team: 'Kinh doanh', status: 'Đang hoạt động' },
    { name: 'Lê Minh Khoa', email: 'khoa.le@dcor.vn', role: 'Quản lý kho', team: 'Kho vận', status: 'Tạm khóa' }
  ];

  get filteredRecords() {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => `${record.name} ${record.email} ${record.role} ${record.team}`.toLocaleLowerCase().includes(term));
  }
}
