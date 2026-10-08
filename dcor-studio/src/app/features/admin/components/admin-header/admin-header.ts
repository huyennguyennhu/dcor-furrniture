import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.css']
})
export class AdminHeader {
  constructor(private router: Router) {}

  handleLogout(): void {
    localStorage.removeItem('dcor_user');
    this.router.navigate(['/login']);
  }
}
