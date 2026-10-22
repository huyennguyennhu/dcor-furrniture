import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { environment } from '../../../../../../environments/environment';

export interface RoomTemplateItem {
  id: string;
  name: string;
  roomType: string;
  description?: string;
  imageUrl: string;
  length: number;
  width: number;
  height: number;
  suggestedProducts?: string[] | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const PRESET_SAMPLE_TEMPLATES: RoomTemplateItem[] = [
  {
    id: 'TMPL-LIVING-01',
    name: 'Phòng khách Bắc Âu Nordic Minimalist',
    roomType: 'Phòng khách',
    description: 'Không gian mở 25m2 đón sáng tự nhiên, tone màu be xám và gỗ sồi ấm áp.',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80',
    length: 5.5,
    width: 4.5,
    height: 2.8,
    suggestedProducts: ['Sofa DCor Nordic', 'Bàn trà Ceramic Elegance', 'Ghế thư giãn Lounge'],
    isActive: true
  },
  {
    id: 'TMPL-BEDROOM-02',
    name: 'Phòng ngủ Master Japandi Yên Bình',
    roomType: 'Phòng ngủ',
    description: 'Thiết kế tối giản phong cách Nhật Bản kết hợp Scandinavian, diện tích 20m2.',
    imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80',
    length: 5.0,
    width: 4.0,
    height: 2.8,
    suggestedProducts: ['Giường nệm King Bed', 'Đèn thả Glow Brass'],
    isActive: true
  },
  {
    id: 'TMPL-DINING-03',
    name: 'Không gian Bếp & Bàn ăn Sang trọng',
    roomType: 'Phòng ăn',
    description: 'Phòng ăn ấm cúng cho gia đình 6-8 người với gỗ óc chó cao cấp và đèn thả đồng xước.',
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80',
    length: 4.5,
    width: 3.8,
    height: 2.8,
    suggestedProducts: ['Bàn ghế ăn Walnut 6 ghế', 'Đèn thả Glow Brass'],
    isActive: true
  }
];

export const PRESET_IMAGES = [
  { label: 'Phòng khách Bắc Âu', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80' },
  { label: 'Phòng ngủ Master', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80' },
  { label: 'Phòng ăn & Bếp', url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&auto=format&fit=crop&q=80' },
  { label: 'Phòng làm việc Studio', url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80' }
];

@Component({
  selector: 'app-design-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './design-settings.html',
  styleUrls: ['./design-settings.css']
})
export class DesignSettingsComponent implements OnInit {
  records: RoomTemplateItem[] = [];
  isLoading = false;

  // Filters
  searchTerm = '';
  selectedRoomType = 'ALL';
  selectedStatus = 'ALL';

  readonly ROOM_TYPES = ['Phòng khách', 'Phòng ngủ', 'Phòng ăn', 'Phòng làm việc'];
  readonly PRESET_IMAGES = PRESET_IMAGES;

  // Modal State
  isModalOpen = false;
  isEditing = false;
  editingId: string | null = null;

  // Image Upload State
  isUploadingImage = false;
  uploadError = '';
  isDraggingImage = false;
  showUrlInput = false;

  // Form Data
  formData = this.getEmptyForm();

  // Preview Modal State
  templateToPreview: RoomTemplateItem | null = null;

  // Toggle Confirm State (Modal xác nhận Ẩn/Hiện)
  templateToToggle: RoomTemplateItem | null = null;

  // Delete Confirm State
  templateToDelete: RoomTemplateItem | null = null;

  // Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimer: any = null;

  ngOnInit(): void {
    this.loadCachedTemplates();
    this.loadTemplates();
  }

  private loadCachedTemplates(): void {
    try {
      const cached = localStorage.getItem('dcor_room_templates_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.records = parsed;
          this.isLoading = false;
        }
      }
    } catch (e) {}
  }

  loadTemplates(): void {
    if (this.records.length === 0) {
      this.isLoading = true;
    }
    fetch(`${environment.apiUrl}/designs/templates`)
      .then(res => res.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          this.records = data.map(t => ({
            id: t.id,
            name: t.name,
            roomType: t.roomType,
            description: t.description || '',
            imageUrl: t.imageUrl,
            length: Number(t.length) || 5.0,
            width: Number(t.width) || 4.0,
            height: Number(t.height) || 2.8,
            suggestedProducts: Array.isArray(t.suggestedProducts) ? t.suggestedProducts : (t.suggestedProducts ? [String(t.suggestedProducts)] : []),
            isActive: t.isActive !== false,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
          }));
          localStorage.setItem('dcor_room_templates_cache', JSON.stringify(this.records));
        } else if (this.records.length === 0) {
          this.records = [...PRESET_SAMPLE_TEMPLATES];
        }
      })
      .catch(err => {
        console.warn('Lỗi kết nối API designs/templates:', err);
        if (this.records.length === 0) {
          this.records = [...PRESET_SAMPLE_TEMPLATES];
        }
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  getEmptyForm() {
    return {
      name: '',
      roomType: 'Phòng khách',
      description: '',
      imageUrl: '',
      length: 5.0,
      width: 4.0,
      height: 2.8,
      suggestedProductsText: 'Sofa DCor Nordic, Bàn trà Ceramic Elegance',
      isActive: true
    };
  }

  get filteredRecords(): RoomTemplateItem[] {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return this.records.filter(item => {
      const matchSearch =
        !term ||
        item.name.toLocaleLowerCase().includes(term) ||
        item.roomType.toLocaleLowerCase().includes(term) ||
        (item.description && item.description.toLocaleLowerCase().includes(term));

      const matchType = this.selectedRoomType === 'ALL' || item.roomType === this.selectedRoomType;
      const matchStatus =
        this.selectedStatus === 'ALL' ||
        (this.selectedStatus === 'ACTIVE' && item.isActive) ||
        (this.selectedStatus === 'INACTIVE' && !item.isActive);

      return matchSearch && matchType && matchStatus;
    });
  }

  // Statistics
  get totalCount(): number {
    return this.records.length;
  }

  get activeCount(): number {
    return this.records.filter(r => r.isActive).length;
  }

  get inactiveCount(): number {
    return this.records.filter(r => !r.isActive).length;
  }

  get distinctRoomTypesCount(): number {
    return new Set(this.records.map(r => r.roomType)).size;
  }

  // =========================================================================
  // XỬ LÝ UPLOAD ẢNH MẶT BẰNG (TƯƠNG TỰ CLIENT & QUẢN LÝ SẢN PHẨM)
  // =========================================================================

  toggleUrlInput(): void {
    this.showUrlInput = !this.showUrlInput;
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleImageFile(input.files[0]);
    }
  }

  onImageDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingImage = true;
  }

  onImageDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingImage = false;
  }

  onImageDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingImage = false;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      this.handleImageFile(e.dataTransfer.files[0]);
    }
  }

  private handleImageFile(file: File): void {
    this.uploadError = '';
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.uploadError = 'Định dạng tệp không được hỗ trợ. Vui lòng chỉ chọn ảnh JPG, PNG hoặc WEBP.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.uploadError = 'Dung lượng ảnh vượt quá 10MB. Vui lòng chọn tệp nhỏ hơn.';
      return;
    }

    this.isUploadingImage = true;

    // 1. Tạo preview tức thì bằng FileReader
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      this.formData.imageUrl = base64; // Hiển thị ngay lên giao diện

      // 2. Tải ảnh lên API máy chủ Cloudinary nén WebP
      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        const res = await fetch(`${environment.apiUrl}/upload/image`, {
          method: 'POST',
          body: uploadData
        });
        if (res.ok) {
          const result = await res.json();
          if (result?.url) {
            this.formData.imageUrl = result.url;
          }
        }
      } catch (err) {
        console.warn('API upload ảnh máy chủ lỗi, giữ nguyên bản nén hiển thị:', err);
      } finally {
        this.isUploadingImage = false;
      }
    };
    reader.readAsDataURL(file);
  }

  removeUploadedImage(): void {
    this.formData.imageUrl = '';
    this.uploadError = '';
  }

  selectPresetImage(url: string): void {
    this.formData.imageUrl = url;
    this.uploadError = '';
  }

  // =========================================================================
  // XEM TRƯỚC BẢN MẪU KHÔNG GIAN (PREVIEW MODAL)
  // =========================================================================

  openPreviewModal(item: RoomTemplateItem): void {
    this.templateToPreview = item;
  }

  closePreviewModal(): void {
    this.templateToPreview = null;
  }

  // =========================================================================
  // THÊM & SỬA BẢN MẪU
  // =========================================================================

  openCreateModal(): void {
    this.isEditing = false;
    this.editingId = null;
    this.formData = this.getEmptyForm();
    this.uploadError = '';
    this.showUrlInput = false;
    this.isModalOpen = true;
  }

  openEditModal(item: RoomTemplateItem): void {
    this.isEditing = true;
    this.editingId = item.id;
    this.formData = {
      name: item.name,
      roomType: item.roomType,
      description: item.description || '',
      imageUrl: item.imageUrl,
      length: item.length,
      width: item.width,
      height: item.height || 2.8,
      suggestedProductsText: Array.isArray(item.suggestedProducts) ? item.suggestedProducts.join(', ') : '',
      isActive: item.isActive
    };
    this.uploadError = '';
    this.showUrlInput = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.editingId = null;
  }

  saveTemplate(): void {
    const name = this.formData.name.trim();
    if (!name) {
      this.showToast('Vui lòng nhập tên bản mẫu không gian!', 'warning');
      return;
    }

    if (!this.formData.imageUrl.trim()) {
      this.showToast('Vui lòng tải lên hoặc chọn hình ảnh mặt bằng phòng!', 'warning');
      return;
    }

    if (this.formData.length <= 0 || this.formData.width <= 0) {
      this.showToast('Chiều dài và chiều rộng phòng phải lớn hơn 0 mét!', 'warning');
      return;
    }

    const suggested = this.formData.suggestedProductsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      name,
      roomType: this.formData.roomType,
      description: this.formData.description.trim() || null,
      imageUrl: this.formData.imageUrl.trim(),
      length: Number(this.formData.length),
      width: Number(this.formData.width),
      height: Number(this.formData.height) || 2.8,
      suggestedProducts: suggested,
      isActive: this.formData.isActive
    };

    if (this.isEditing && this.editingId) {
      fetch(`${environment.apiUrl}/designs/templates/${this.editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(() => {
          this.loadTemplates();
          this.showToast(`Đã cập nhật bản mẫu "${name}" thành công!`, 'success');
        })
        .catch(err => {
          console.error('Lỗi cập nhật template:', err);
          this.showToast('Lỗi cập nhật bản mẫu.', 'warning');
        });
    } else {
      fetch(`${environment.apiUrl}/designs/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => res.json())
        .then(() => {
          this.loadTemplates();
          this.showToast(`Đã thêm bản mẫu "${name}" vào CSDL PostgreSQL!`, 'success');
        })
        .catch(err => {
          console.error('Lỗi tạo template:', err);
          this.showToast('Lỗi tạo mới bản mẫu.', 'warning');
        });
    }

    this.closeModal();
  }

  // =========================================================================
  // XÁC NHẬN ẨN / KÍCH HOẠT (POPUP BẢO VỆ CHỐNG BẤM NHẦM)
  // =========================================================================

  promptToggleActive(item: RoomTemplateItem): void {
    this.templateToToggle = item;
  }

  cancelToggleActive(): void {
    this.templateToToggle = null;
  }

  confirmToggleActive(): void {
    if (!this.templateToToggle) return;
    const item = this.templateToToggle;
    const nextStatus = !item.isActive;
    item.isActive = nextStatus;
    this.templateToToggle = null;

    fetch(`${environment.apiUrl}/designs/templates/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: nextStatus })
    })
      .then(() => {
        this.showToast(nextStatus ? `Đã kích hoạt bản mẫu "${item.name}"` : `Đã tạm ẩn bản mẫu "${item.name}"`, nextStatus ? 'success' : 'warning');
      })
      .catch(() => {});
  }

  // =========================================================================
  // XÁC NHẬN XÓA BẢN MẪU
  // =========================================================================

  promptDelete(item: RoomTemplateItem): void {
    this.templateToDelete = item;
  }

  cancelDelete(): void {
    this.templateToDelete = null;
  }

  confirmDelete(): void {
    if (!this.templateToDelete) return;
    const name = this.templateToDelete.name;
    const delId = this.templateToDelete.id;
    this.records = this.records.filter(r => r.id !== delId);
    this.templateToDelete = null;

    fetch(`${environment.apiUrl}/designs/templates/${delId}`, {
      method: 'DELETE'
    })
      .then(() => {
        this.showToast(`Đã xóa bản mẫu "${name}" khỏi cơ sở dữ liệu!`, 'success');
      })
      .catch(() => {
        this.showToast(`Đã xóa bản mẫu "${name}".`, 'info');
      });
  }

  showToast(msg: string, type: 'success' | 'warning' | 'info' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  closeToast(): void {
    this.toastMessage = null;
  }
}
