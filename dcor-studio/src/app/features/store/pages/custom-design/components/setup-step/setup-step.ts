import { Component, ChangeDetectorRef, signal, computed, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { Modal } from '../../../../../../shared/components/modal/modal';
import { RoomPlannerService } from '../../services/room-planner.service';
import { PlannerBackground, RoomTemplate, PlannerDesign, DesignRepository } from '../../models/planner.model';
import { DESIGN_REPOSITORY } from '../../services/design-repository.interface';
import { environment } from '../../../../../../../environments/environment';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><path d="M100 220 L160 140 L210 180 L280 120 L320 220 Z" fill="%23cbd5e1"/><circle cx="150" cy="110" r="22" fill="%23cbd5e1"/></svg>';

@Component({
  selector: 'app-setup-step',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, Modal],
  templateUrl: './setup-step.html',
  styleUrls: ['./setup-step.css']
})
export class SetupStepComponent implements OnInit {
  templates = signal<RoomTemplate[]>([]);
  isLoadingTemplates = signal<boolean>(true);
  templatesError = signal<string>('');

  // Nguồn ảnh đang chọn: 'template' | 'upload'
  activeSource = signal<'template' | 'upload'>('template');

  // Lựa chọn hiện tại
  selectedTemplate = signal<RoomTemplate | null>(null);
  uploadedImage = signal<PlannerBackground | null>(null);
  isCompressing = signal<boolean>(false);
  uploadError = signal<string>('');
  isDraggingFile = signal<boolean>(false);

  // Form kích thước phòng
  lengthMeters: number = 5.0;
  widthMeters: number = 4.0;
  heightMeters: number = 2.8;

  // --- THIẾT KẾ ĐÃ LƯU TRÊN MÁY NÀY (REQ 3) ---
  // Ghi chú kiến trúc: Hiện tại lưu và mở thiết kế từ IndexedDB cục bộ trên máy này
  // do backend chưa có bảng lưu thiết kế theo tài khoản khách hàng.
  // Sau này khi backend bổ sung API, chỉ cần chuyển sang gọi API từ HttpDesignRepository.
  savedDrafts = signal<PlannerDesign[]>([]);
  isLoadingDrafts = signal<boolean>(false);

  // Modal xác nhận xóa thiết kế
  isDeleteConfirmOpen = signal<boolean>(false);
  draftToDelete = signal<PlannerDesign | null>(null);

  // Modal đổi tên thiết kế
  isRenameModalOpen = signal<boolean>(false);
  draftToRename = signal<PlannerDesign | null>(null);
  renameInput = signal<string>('');

  readonly isDimensionsValid = computed(() => {
    return (
      this.lengthMeters >= 1 &&
      this.lengthMeters <= 30 &&
      this.widthMeters >= 1 &&
      this.widthMeters <= 30 &&
      (!this.heightMeters || (this.heightMeters >= 1 && this.heightMeters <= 30))
    );
  });

  constructor(
    public plannerService: RoomPlannerService,
    @Inject(DESIGN_REPOSITORY) private designRepo: DesignRepository,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchTemplates();
    this.loadSavedDrafts();

    // Khôi phục dữ liệu đã chọn trước đó nếu có
    const currentBg = this.plannerService.background();
    if (currentBg) {
      if (currentBg.type === 'upload') {
        this.activeSource.set('upload');
        this.uploadedImage.set(currentBg);
      } else {
        this.activeSource.set('template');
      }
    }

    const currentDims = this.plannerService.dimensions();
    if (currentDims) {
      this.lengthMeters = currentDims.length;
      this.widthMeters = currentDims.width;
      this.heightMeters = currentDims.height || 2.8;
    }
  }

  // ==========================================
  // TẢI BẢN MẪU KHÔNG GIAN TỪ API (REQ 1 & 5)
  // ==========================================
  async fetchTemplates(): Promise<void> {
    this.isLoadingTemplates.set(true);
    this.templatesError.set('');

    try {
      const res = await fetch(`${environment.apiUrl}/designs/templates?isActive=true`);
      if (!res.ok) {
        throw new Error(`Lỗi kết nối máy chủ (${res.status})`);
      }
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data.data || data.items || []);

      if (rawList.length === 0) {
        this.templates.set([]);
        this.templatesError.set('Chưa có bản mẫu không gian nào được kích hoạt.');
        this.isLoadingTemplates.set(false);
        this.cdr.markForCheck();
        return;
      }

      const mapped: RoomTemplate[] = rawList.map((t: any) => ({
        id: t.id,
        name: t.name || 'Bản mẫu phòng',
        roomType: t.roomType || 'Phòng mẫu',
        description: t.description || '',
        imageUrl: t.imageUrl || '',
        defaultDimensions: {
          length: Number(t.length) || 5.0,
          width: Number(t.width) || 4.0,
          height: Number(t.height) || 2.8
        }
      }));

      this.templates.set(mapped);

      // Tự động khôi phục lựa chọn hoặc chọn template đầu tiên nếu chưa chọn upload
      const currentBg = this.plannerService.background();
      if (currentBg?.type === 'template' && currentBg.templateId) {
        const found = mapped.find(m => m.id === currentBg.templateId);
        if (found) {
          this.selectedTemplate.set(found);
          this.activeSource.set('template');
        } else {
          this.selectTemplateCard(mapped[0]);
        }
      } else if (!this.selectedTemplate() && this.activeSource() !== 'upload') {
        this.selectTemplateCard(mapped[0]);
      }

      this.isLoadingTemplates.set(false);
      this.cdr.markForCheck();
    } catch (err: any) {
      this.templates.set([]);
      this.templatesError.set(err.message || 'Không thể tải danh sách bản mẫu từ máy chủ.');
      this.isLoadingTemplates.set(false);
      this.cdr.markForCheck();
    }
  }

  // --- Chọn bản mẫu phòng có sẵn ---
  selectTemplateCard(tmpl: RoomTemplate): void {
    this.selectedTemplate.set(tmpl);
    this.activeSource.set('template');
    this.lengthMeters = tmpl.defaultDimensions.length;
    this.widthMeters = tmpl.defaultDimensions.width;
    this.heightMeters = tmpl.defaultDimensions.height || 2.8;
  }

  // --- Xử lý click vào ô tải ảnh ---
  handleUploadCardClick(fileInput: HTMLInputElement): void {
    if (this.uploadedImage()) {
      this.activeSource.set('upload');
    } else {
      fileInput.click();
    }
  }

  // --- Nút Đổi ảnh trong ô tải ảnh ---
  triggerFileInput(event: Event, fileInput: HTMLInputElement): void {
    event.stopPropagation();
    fileInput.click();
  }

  // --- Xác nhận chọn nguồn ảnh để sang bước 2 ---
  confirmSource(): void {
    if (this.activeSource() === 'template') {
      const tmpl = this.selectedTemplate();
      if (tmpl) {
        const currentBg = this.plannerService.background();
        if (currentBg?.templateId === tmpl.id && currentBg.type === 'template') {
          this.plannerService.updateDimensions({
            length: Number(this.lengthMeters),
            width: Number(this.widthMeters),
            height: this.heightMeters ? Number(this.heightMeters) : undefined
          });
          this.plannerService.setupSubStep.set('dimensions');
        } else {
          this.plannerService.selectTemplate(tmpl);
        }
      }
    } else {
      const up = this.uploadedImage();
      if (up) {
        this.plannerService.setUploadedBackground(up);
      }
    }
  }

  // ==========================================
  // XỬ LÝ TẢI ẢNH MẶT BẰNG THẬT (REQ 1)
  // ==========================================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingFile.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingFile.set(false);
  }

  onFileDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingFile.set(false);
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      this.processFile(e.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    this.uploadError.set('');

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.uploadError.set('Định dạng tệp không được hỗ trợ. Vui lòng chỉ chọn ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.uploadError.set('Dung lượng ảnh vượt quá 10MB. Vui lòng chọn tệp có kích thước nhỏ hơn.');
      return;
    }

    this.isCompressing.set(true);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const originalW = img.naturalWidth || img.width;
      const originalH = img.naturalHeight || img.height;

      const maxEdge = 1600;
      let targetW = originalW;
      let targetH = originalH;

      if (Math.max(originalW, originalH) > maxEdge) {
        if (originalW > originalH) {
          targetW = maxEdge;
          targetH = Math.round((originalH * maxEdge) / originalW);
        } else {
          targetH = maxEdge;
          targetW = Math.round((originalW * maxEdge) / originalH);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        this.uploadError.set('Không thể xử lý hình ảnh trên trình duyệt của bạn.');
        this.isCompressing.set(false);
        this.cdr.markForCheck();
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const backgroundData: PlannerBackground = {
        type: 'upload',
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: compressedDataUrl,
        naturalWidth: targetW,
        naturalHeight: targetH,
        file
      };

      this.uploadedImage.set(backgroundData);
      this.activeSource.set('upload');
      this.selectedTemplate.set(null);
      this.isCompressing.set(false);
      this.cdr.markForCheck();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      this.uploadError.set('Không thể đọc file ảnh. Vui lòng thử lại với một ảnh khác.');
      this.isCompressing.set(false);
      this.cdr.markForCheck();
    };

    img.src = objectUrl;
  }

  // ==========================================
  // THIẾT KẾ ĐÃ LƯU TRÊN MÁY NÀY (REQ 3)
  // ==========================================
  async loadSavedDrafts(): Promise<void> {
    this.isLoadingDrafts.set(true);
    try {
      const list = await this.designRepo.listDrafts();
      this.savedDrafts.set(list);
    } catch {
      this.savedDrafts.set([]);
    } finally {
      this.isLoadingDrafts.set(false);
      this.cdr.markForCheck();
    }
  }

  openDraft(draft: PlannerDesign): void {
    // Khôi phục đầy đủ nền, kích thước, vật thể và zoom
    this.plannerService.loadDesign(draft);
  }

  promptRenameDraft(draft: PlannerDesign, event?: Event): void {
    if (event) event.stopPropagation();
    this.draftToRename.set(draft);
    this.renameInput.set(draft.title || '');
    this.isRenameModalOpen.set(true);
  }

  closeRenameModal(): void {
    this.isRenameModalOpen.set(false);
    this.draftToRename.set(null);
  }

  async confirmRenameDraft(): Promise<void> {
    const draft = this.draftToRename();
    const newTitle = this.renameInput().trim();
    if (!draft || !draft.id || !newTitle) return;

    if (this.designRepo.renameDraft) {
      await this.designRepo.renameDraft(draft.id, newTitle);
    } else {
      draft.title = newTitle;
      await this.designRepo.saveDraft(draft);
    }

    this.closeRenameModal();
    await this.loadSavedDrafts();
  }

  promptDeleteDraft(draft: PlannerDesign, event?: Event): void {
    if (event) event.stopPropagation();
    this.draftToDelete.set(draft);
    this.isDeleteConfirmOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteConfirmOpen.set(false);
    this.draftToDelete.set(null);
  }

  async confirmDeleteDraft(): Promise<void> {
    const draft = this.draftToDelete();
    if (!draft || !draft.id) return;

    await this.designRepo.deleteDraft(draft.id);
    this.closeDeleteModal();
    await this.loadSavedDrafts();
  }

  // --- Bước 2: Hoàn tất kích thước & vào phòng ---
  handleStartPlanner(): void {
    if (!this.isDimensionsValid()) return;

    this.plannerService.updateDimensions({
      length: Number(this.lengthMeters),
      width: Number(this.widthMeters),
      height: this.heightMeters ? Number(this.heightMeters) : undefined
    });

    this.plannerService.startPlanning();
  }

  get previewBg(): PlannerBackground | null {
    return this.plannerService.background();
  }

  get calculatedPxPerMeter(): number {
    const bg = this.previewBg;
    if (!bg || !this.lengthMeters || this.lengthMeters <= 0) return 0;
    return Math.round(bg.naturalWidth / this.lengthMeters);
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
  }
}
