import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule],
  template: '<div style="padding: 24px; text-align: center; color: #765337;">Đang chuyển hướng đến quản lý khuyến mãi...</div>'
})
export class PromotionsComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.navigate(['/admin/vouchers']);
  }
}

