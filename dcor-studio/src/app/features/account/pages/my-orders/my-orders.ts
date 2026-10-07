import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  items: number;
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];

  ngOnInit() {
    // Mock Data
    this.orders = [
      { id: 'DC-123456', date: '2023-11-20', total: 45000000, status: 'Đang giao', items: 1 },
      { id: 'DC-987654', date: '2023-10-15', total: 12500000, status: 'Hoàn thành', items: 2 }
    ];
  }

  formatCurrency(val: number) {
    return val.toLocaleString('vi-VN') + ' ₫';
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'Đang giao': return '#F39C12';
      case 'Hoàn thành': return '#2ECC71';
      case 'Đã hủy': return '#E74C3C';
      default: return 'var(--text-secondary)';
    }
  }
}

