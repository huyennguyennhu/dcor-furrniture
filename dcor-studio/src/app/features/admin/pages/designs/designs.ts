import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-designs-redirect',
  standalone: true,
  template: '<div style="padding: 40px; text-align: center; color: #765337;">Đang chuyển hướng đến Quản lý Không gian...</div>'
})
export class DesignsComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.router.navigate(['/admin/designs/settings'], { replaceUrl: true });
  }
}
