import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  fullName = 'Nguyễn Văn A';
  phone = '0912345678';
  email = 'nguyenvana@gmail.com';
  address = '123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM';

  successMessage = '';

  ngOnInit() {
    // Tải thông tin người dùng từ LocalStorage hoặc Service
  }

  saveProfile() {
    this.successMessage = 'Cập nhật thông tin thành công!';
    setTimeout(() => this.successMessage = '', 3000);
  }
}

