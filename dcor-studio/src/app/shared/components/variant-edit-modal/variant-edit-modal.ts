import { IconComponent } from '../icon/icon';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-variant-edit-modal',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './variant-edit-modal.html',
  styleUrls: ['./variant-edit-modal.css']
})
export class VariantEditModalComponent {
  @Input() item: any = null;
  @Input() isOpen = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ legId?: string, upholsteryId?: string }>();

  // Mock data cho các tùy chọn
  // Thực tế có thể call API lấy theo productId
  availableLegs = [
    { id: 'leg-1', name: 'Gỗ sồi tự nhiên' },
    { id: 'leg-2', name: 'Gỗ óc chó' },
    { id: 'leg-3', name: 'Gỗ sồi sơn đen' }
  ];

  availableUpholsteries = [
    { id: 'fab-1', name: 'Vải Frisco màu xám nhạt', img: '/assets/img/furniture-placeholder.svg' },
    { id: 'fab-2', name: 'Vải nỉ nhung xanh navy', img: '/assets/img/furniture-placeholder.svg' },
    { id: 'fab-3', name: 'Da bò thật nâu hạt dẻ', img: '/assets/img/furniture-placeholder.svg' }
  ];

  selectedLegId: string | null = null;
  selectedUpholsteryId: string | null = null;

  ngOnChanges() {
    if (this.isOpen && this.item) {
      // Khởi tạo giá trị ban đầu dựa vào item đang chọn
      this.selectedLegId = this.item.leg?.id || this.availableLegs[0].id;
      this.selectedUpholsteryId = this.item.upholstery?.id || this.availableUpholsteries[0].id;
    }
  }

  selectLeg(id: string) {
    this.selectedLegId = id;
  }

  selectUpholstery(id: string) {
    this.selectedUpholsteryId = id;
  }

  handleSave() {
    this.save.emit({
      legId: this.selectedLegId || undefined,
      upholsteryId: this.selectedUpholsteryId || undefined
    });
    this.closeModal();
  }

  closeModal() {
    this.isOpen = false;
    this.close.emit();
  }
}
