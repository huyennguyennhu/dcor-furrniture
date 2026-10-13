import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vouchers.html'
})
export class VouchersComponent {
  searchTerm = '';
  records = [
    { code: 'WELCOME10', discount: '10%', condition: 'Đơn đầu tiên từ 2.000.000₫', expiry: '31/12/2026', status: 'Đang hoạt động' },
    { code: 'DCOR500', discount: '500.000₫', condition: 'Đơn hàng từ 8.000.000₫', expiry: '30/11/2026', status: 'Đang hoạt động' },
    { code: 'FREESHIP', discount: 'Miễn phí vận chuyển', condition: 'Đơn hàng từ 5.000.000₫', expiry: '30/09/2026', status: 'Đã kết thúc' }
  ];

  get filteredRecords() {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => `${record.code} ${record.condition}`.toLocaleLowerCase().includes(term));
  }
}
