import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-design-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './design-settings.html'
})
export class DesignSettingsComponent {
  settings = [
    { name: 'Bài viết cộng đồng', description: 'Cho phép khách hàng chia sẻ ý tưởng thiết kế.', enabled: true },
    { name: 'Kiểm duyệt trước khi đăng', description: 'Bài viết cần được quản trị viên duyệt trước khi hiển thị.', enabled: true },
    { name: 'Bình luận', description: 'Cho phép thành viên bình luận trên bài viết.', enabled: false }
  ];
}
