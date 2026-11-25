import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountSidebarComponent } from '../account-sidebar/account-sidebar';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AccountSidebarComponent],
  templateUrl: './account-layout.html',
  styleUrls: ['./account-layout.css']
})
export class AccountLayoutComponent {}
