import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-staff-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-permissions.html'
})
export class StaffPermissionsComponent {
  selectedRole = 'Quản trị viên';
  permissions = [
    { name: 'Xem dashboard và báo cáo', enabled: true },
    { name: 'Quản lý đơn hàng', enabled: true },
    { name: 'Quản lý sản phẩm và tồn kho', enabled: true },
    { name: 'Quản lý nhân sự và phân quyền', enabled: false }
  ];
}
