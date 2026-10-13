import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaigns.html'
})
export class CampaignsComponent {
  searchTerm = '';
  records = [
    { name: 'Mùa thu ấm áp', channel: 'Toàn hệ thống', period: '01/10/2026 - 31/10/2026', usage: '128', status: 'Đang diễn ra' },
    { name: 'Ngày hội phòng khách', channel: 'Online', period: '15/10/2026 - 25/10/2026', usage: '42', status: 'Sắp diễn ra' },
    { name: 'Ưu đãi khai trương', channel: 'Showroom', period: '01/09/2026 - 15/09/2026', usage: '216', status: 'Đã kết thúc' }
  ];

  get filteredRecords() {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => `${record.name} ${record.channel}`.toLocaleLowerCase().includes(term));
  }
}
