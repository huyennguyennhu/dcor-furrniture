import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Search, Filter, Calendar as CalendarIcon, Download 
} from 'lucide-angular';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-history.html',
  styleUrls: ['./inventory-history.css']
})
export class InventoryHistoryComponent implements OnInit {
  icons = { Search, Filter, CalendarIcon, Download };

  data: any[] = [];
  viewBy = 'variant';

  constructor(private router: Router) {}

  ngOnInit() {
    this.data = [
      {
        id: 'TX-001',
        date: '2024-03-15 14:30',
        sku: 'SF-OSA-3-BRW',
        productName: 'Sofa Da Bò Osaka (Băng 3)',
        variant: 'Nâu',
        location: 'Kho Tổng (TP.HCM)',
        type: 'Nhập kho',
        quantity: '+15',
        stockAfter: 45,
        reference: 'PO-2403-001',
        creator: 'Nguyễn Văn A'
      },
      {
        id: 'TX-002',
        date: '2024-03-15 10:15',
        sku: 'BA-IND-WAL',
        productName: 'Bàn ăn Indochine',
        variant: 'Gỗ óc chó',
        location: 'Showroom Quận 1',
        type: 'Xuất kho',
        quantity: '-2',
        stockAfter: 8,
        reference: 'ORD-10024',
        creator: 'Trần Thị B'
      },
      {
        id: 'TX-003',
        date: '2024-03-14 16:45',
        sku: 'TU-QAR-WHI',
        productName: 'Tủ Quần Áo 4 Cánh',
        variant: 'Trắng',
        location: 'Kho Tổng (TP.HCM)',
        type: 'Chuyển kho',
        quantity: '-5',
        stockAfter: 12,
        reference: 'TR-2403-01',
        creator: 'Lê Văn C'
      },
      {
        id: 'TX-004',
        date: '2024-03-14 09:20',
        sku: 'GE-EAM-BLK',
        productName: 'Ghế Eames',
        variant: 'Đen',
        location: 'Kho Hà Nội',
        type: 'Điều chỉnh tăng',
        quantity: '+1',
        stockAfter: 50,
        reference: 'ADT-2403-01',
        creator: 'Hệ thống'
      }
    ];
  }
}
