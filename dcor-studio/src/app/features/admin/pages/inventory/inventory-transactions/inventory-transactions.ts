import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-inventory-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-transactions.html'
})
export class InventoryTransactionsComponent {
  searchTerm = '';
  records = [
    { code: 'IMP-26018', type: 'Nhập kho', location: 'Kho Tổng TP.HCM', createdAt: '11/10/2026', creator: 'Nguyễn Minh An', status: 'Hoàn tất' },
    { code: 'EXP-26017', type: 'Xuất kho', location: 'Showroom Quận 1', createdAt: '10/10/2026', creator: 'Trần Gia Hân', status: 'Đang xử lý' },
    { code: 'TRF-26016', type: 'Chuyển kho', location: 'Kho Hà Nội', createdAt: '09/10/2026', creator: 'Lê Minh Khoa', status: 'Chờ duyệt' }
  ];

  get filteredRecords() {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => `${record.code} ${record.type} ${record.location} ${record.creator}`.toLocaleLowerCase().includes(term));
  }
}
