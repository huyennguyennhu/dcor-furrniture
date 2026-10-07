import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  ArrowLeft, CheckCircle2, Truck, Package, User, MapPin, CreditCard, Box, FileText 
} from 'lucide-angular';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './order-detail.html'
})
export class OrderDetailComponent implements OnInit {
  icons = { ArrowLeft, CheckCircle2, Truck, Package, User, MapPin, CreditCard, Box, FileText };
  orderId = 'DCOR-ORD-001';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.orderId = params.get('id') || 'DCOR-ORD-001';
    });
  }

  goBack() {
    this.router.navigate(['/admin/orders']);
  }

  formatVND(value: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}
