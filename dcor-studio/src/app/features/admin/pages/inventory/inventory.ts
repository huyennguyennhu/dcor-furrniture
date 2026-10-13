import { IconComponent } from '../../../../shared/components/icon/icon';
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Package, Plus, Search, Filter, ArrowRightLeft, ArrowUpRight, ArrowDownRight, MoreHorizontal, Image as ImageIcon, X 
} from 'lucide-angular';
import { TransactionModalComponent } from '../../components/transaction-modal/transaction-modal';

interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  image: string;
  location: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  threshold: number;
  status: string;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, RouterModule, LucideAngularModule, TransactionModalComponent],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
  icons = { Package, Plus, Search, Filter, ArrowRightLeft, ArrowUpRight, ArrowDownRight, MoreHorizontal, ImageIcon, X };

  data: InventoryItem[] = [];
  isLoading = true;
  selectedIds = new Set<string>();
  
  locationFilter = 'Tất cả chi nhánh';
  showLocationDropdown = false;
  locationOptions = ['Tất cả chi nhánh', 'Kho Tổng (TP.HCM)', 'Showroom Quận 1', 'Kho Hà Nội'];

  // Modal
  modalConfig = {
    isOpen: false,
    type: 'import' as 'import' | 'export',
    initialProductId: '',
    initialVariantId: '',
    isProductFixed: false,
    isVariantFixed: false
  };

  openVariantDropdown: string | null = null;
  expandedRows = new Set<string>();
  activeActionMenu: string | null = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.fetchProducts();
  }

  fetchProducts() {
    this.isLoading = true;
    // Mock dữ liệu
    const mockData = Array.from({length: 10}).map((_, index) => {
      const physicalStock = (index % 5 + 1) * 15;
      const reservedStock = index % 3 === 0 ? 5 : 0;
      const availableStock = physicalStock - reservedStock;
      const threshold = 20;
      
      let status = 'Tốt';
      if (availableStock <= 0) status = 'Hết hàng';
      else if (availableStock <= threshold) status = 'Sắp hết';

      return {
        id: `PROD-${index}`,
        sku: `SKU-${index}`,
        productName: `Sản phẩm mẫu ${index + 1}`,
        category: 'Nội thất',
        image: '',
        location: index % 2 === 0 ? 'Kho Tổng (TP.HCM)' : 'Showroom Quận 1',
        physicalStock,
        reservedStock,
        availableStock,
        threshold,
        status
      };
    });
    this.data = mockData;
    this.isLoading = false;
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.location-filter-wrapper')) {
      this.showLocationDropdown = false;
    }
    if (!target.closest('.variant-dropdown-wrapper')) {
      this.openVariantDropdown = null;
    }
    if (!target.closest('.action-menu-container')) {
      this.activeActionMenu = null;
    }
  }

  toggleExpand(id: string, event: Event) {
    event.stopPropagation();
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }

  getVariants(item: InventoryItem) {
    return ['Màu Trắng, Gỗ sồi', 'Màu Đen, Khung thép', 'Màu Xám, Bọc da'].map((vName, idx) => {
      const physical = Math.max(0, Math.floor((item.physicalStock || 15) / 3) + (idx === 0 ? (item.physicalStock || 15) % 3 : 0));
      const reserved = Math.max(0, Math.floor((item.reservedStock || 0) / 3));
      return { name: vName, physical, reserved, available: physical - reserved };
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

  openModal(type: 'import' | 'export', productId: string = '', variantId: string = '', isProductFixed: boolean = false, isVariantFixed: boolean = false) {
    this.modalConfig = {
      isOpen: true,
      type,
      initialProductId: productId,
      initialVariantId: variantId,
      isProductFixed,
      isVariantFixed
    };
    this.activeActionMenu = null;
    this.openVariantDropdown = null;
  }

  closeModal() {
    this.modalConfig.isOpen = false;
  }

  handleModalSubmit(data: any) {
    console.log('Submitted transaction:', data);
    this.alert('Giao dịch đã được lưu thành công!');
    this.closeModal();
  }

  alert(message: string) {
    window.alert(message);
  }

  goToDetail(id: string) {
    this.router.navigate(['/admin/inventory/product', id]);
  }
}
