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
    this.loadOrders();
  }

  loadOrders() {
    const localPlaced: Order[] = [];
    try {
      const stored = localStorage.getItem('dcor_placed_orders');
      if (stored) {
        localPlaced.push(...JSON.parse(stored));
      }
    } catch (_) {}

    const defaultMock: Order[] = [
      { id: 'DC-123456', date: '2023-11-20', total: 45000000, status: 'Đang giao', items: 1 },
      { id: 'DC-987654', date: '2023-10-15', total: 12500000, status: 'Hoàn thành', items: 2 }
    ];

    const token = localStorage.getItem('dcor_customer_token');
    fetch('http://localhost:3000/api/store/orders/my-orders', {
      headers: {
        'Authorization': `Bearer ${token || ''}`
      }
    })
      .then(res => res.json())
      .then((apiOrders: Order[]) => {
        if (Array.isArray(apiOrders) && apiOrders.length > 0) {
          const apiIds = new Set(apiOrders.map(o => o.id));
          const uniqueLocal = localPlaced.filter(o => !apiIds.has(o.id));
          this.orders = [...apiOrders, ...uniqueLocal, ...defaultMock];
        } else {
          this.orders = [...localPlaced, ...defaultMock];
        }
      })
      .catch(() => {
        this.orders = [...localPlaced, ...defaultMock];
      });
  }

  formatCurrency(val: number) {
    return val.toLocaleString('vi-VN') + ' ₫';
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'Chờ đặt cọc': return '#D97706';
      case 'Chờ xác nhận': return '#3B82F6';
      case 'Đang giao': return '#F39C12';
      case 'Hoàn thành': return '#2ECC71';
      case 'Đã hủy': return '#E74C3C';
      default: return 'var(--text-secondary)';
    }
  }
}

