import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2 
} from 'lucide-angular';

const mockProducts = [
  { sku: 'SF-OSA-3-BRW', name: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu', stock: 25 },
  { sku: 'BA-IND-WAL', name: 'Bàn ăn Indochine', variant: 'Gỗ óc chó', stock: 3 },
  { sku: 'TU-QAR-WHI', name: 'Tủ Quần Áo 4 Cánh', variant: 'Trắng', stock: 12 },
  { sku: 'GE-EAM-BLK', name: 'Ghế Eames', variant: 'Đen', stock: 50 },
];

@Component({
  selector: 'app-inventory-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './inventory-audit.html',
  styleUrls: ['./inventory-audit.css']
})
export class InventoryAuditComponent implements OnInit {
  icons = { ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2 };

  data: any[] = [];
  selectedIds = new Set<string>();
  
  showModal: boolean | any = false;
  modalLocation = 'Kho Tổng (TP.HCM)';
  activeActionMenu: string | null = null;

  auditItems = [
    { id: '1', sku: '', productName: '', variant: '', systemStock: '' as number | '', actualStock: '' as number | '' }
  ];

  mockProducts = mockProducts;

  constructor(private router: Router) {}

  ngOnInit() {
    this.data = [
      {
        id: 'ADT-2408-001',
        date: '2024-08-20',
        location: 'Kho Tổng (TP.HCM)',
        creator: 'Trần Văn A',
        totalItems: 2,
        discrepancyItems: 1,
        status: 'Hoàn tất'
      },
      {
        id: 'ADT-2408-002',
        date: '2024-08-22',
        location: 'Showroom Quận 1',
        creator: 'Nguyễn Thị B',
        totalItems: 45,
        discrepancyItems: 0,
        status: 'Hoàn tất'
      },
      {
        id: 'ADT-2408-003',
        date: '2024-08-23',
        location: 'Kho Hà Nội',
        creator: 'Lê Văn C',
        totalItems: 80,
        discrepancyItems: 0,
        status: 'Đang kiểm'
      }
    ];
  }

  get canAddNewLine() {
    return this.auditItems.every(item => item.sku !== '' && item.actualStock !== '');
  }

  openModal(item?: any) {
    if (!item) {
      this.showModal = true;
      this.auditItems = [{ id: Date.now().toString(), sku: '', productName: '', variant: '', systemStock: '', actualStock: '' }];
    } else {
      this.showModal = item;
    }
  }

  closeModal() {
    this.showModal = false;
  }

  handleAddRow() {
    if (this.canAddNewLine) {
      this.auditItems.push({ id: Date.now().toString() + Math.random(), sku: '', productName: '', variant: '', systemStock: '', actualStock: '' });
    }
  }

  handleRemoveRow(id: string) {
    if (this.auditItems.length > 1) {
      this.auditItems = this.auditItems.filter(item => item.id !== id);
    }
  }

  handleUpdateRow(id: string, field: keyof typeof this.auditItems[0], value: any) {
    this.auditItems = this.auditItems.map(item => {
      if (item.id === id) {
        if (field === 'sku') {
          const product = this.mockProducts.find(p => p.sku === value);
          if (product) {
            return { ...item, sku: product.sku, productName: product.name, variant: product.variant, systemStock: product.stock };
          }
        }
        if (field === 'productName') {
          const variantsOfProduct = this.mockProducts.filter(p => p.name === value);
          if (variantsOfProduct.length === 1) {
            const p = variantsOfProduct[0];
            return { ...item, sku: p.sku, productName: p.name, variant: p.variant, systemStock: p.stock };
          }
          return { ...item, productName: value, sku: '', variant: '', systemStock: '' };
        }
        if (field === 'variant') {
          const product = this.mockProducts.find(p => p.sku === value);
          if (product) {
            return { ...item, sku: product.sku, productName: product.name, variant: product.variant, systemStock: product.stock };
          }
        }
        if (field === 'actualStock') {
          let rawValue = value.replace(/[^0-9]/g, '');
          return { ...item, actualStock: rawValue };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
  }

  toggleSelection(id: string, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggleSelectAll(event: Event) {
    event.stopPropagation();
    if (this.selectedIds.size === this.data.length && this.data.length > 0) {
      this.selectedIds.clear();
    } else {
      this.data.forEach(p => this.selectedIds.add(p.id));
    }
  }

  isAllSelected() {
    return this.data.length > 0 && this.selectedIds.size === this.data.length;
  }

  getUniqueProductNames() {
    return Array.from(new Set(this.mockProducts.map(p => p.name)));
  }

  getVariantsForProduct(productName: string) {
    return this.mockProducts.filter(p => !productName || p.name === productName);
  }

  alert(message: string) {
    window.alert(message);
  }
}
