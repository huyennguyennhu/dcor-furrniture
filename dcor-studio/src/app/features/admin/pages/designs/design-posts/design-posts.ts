import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-design-posts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './design-posts.html'
})
export class DesignPostsComponent {
  searchTerm = '';
  records = [
    { title: 'Góc đọc sách tối giản', author: 'Nguyễn Hà My', submittedAt: '11/10/2026', reactions: 28, status: 'Chờ duyệt' },
    { title: 'Phòng khách phong cách Japandi', author: 'Trần Khánh Vy', submittedAt: '10/10/2026', reactions: 64, status: 'Đã đăng' },
    { title: 'Ý tưởng tận dụng không gian nhỏ', author: 'Lê Minh Quân', submittedAt: '09/10/2026', reactions: 17, status: 'Chờ duyệt' }
  ];

  get filteredRecords() {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(record => `${record.title} ${record.author}`.toLocaleLowerCase().includes(term));
  }
}
