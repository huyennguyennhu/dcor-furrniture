import { Component, ChangeDetectorRef, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { RoomPlannerService } from '../../services/room-planner.service';
import { ROOM_TEMPLATES } from '../../data/room-templates.data';
import { PlannerBackground, RoomDimensions, RoomTemplate } from '../../models/planner.model';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-setup-step',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './setup-step.html',
  styleUrls: ['./setup-step.css']
})
export class SetupStepComponent implements OnInit {
  templates: RoomTemplate[] = [];

  // Tab chọn nguồn ảnh: 'template' | 'upload'
  activeTab = signal<'template' | 'upload'>('template');

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
    private cdr: ChangeDetectorRef
  ) {
    // Đồng bộ kích thước mặc định từ template ban đầu
    const initialDims = this.plannerService.dimensions();
    if (initialDims) {
      this.lengthMeters = initialDims.length;
      this.widthMeters = initialDims.width;
      this.heightMeters = initialDims.height || 2.8;
    }
  }

  ngOnInit(): void {
    this.loadDatabaseTemplates();
  }

  loadDatabaseTemplates(): void {
    // 1. Tải tức thì từ Local Cache nếu có để trang mở ngay trong 0ms
    try {
      const cached = localStorage.getItem('dcor_room_templates_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.templates = parsed.map((t: any) => ({
            id: t.id,
            name: t.name,
            roomType: t.roomType,
            description: t.description || '',
            imageUrl: t.imageUrl,
            defaultDimensions: {
              length: Number(t.length) || 5.0,
              width: Number(t.width) || 4.0,
              height: Number(t.height) || 2.8
            }
          }));
          if (this.templates.length > 0 && !this.selectedTemplate()) {
            this.selectTemplateCard(this.templates[0]);
          }
          this.cdr.detectChanges();
        }
      }
    } catch (e) {}

    // 2. Tải bản cập nhật mới nhất từ máy chủ
    fetch(`${environment.apiUrl}/designs/templates?isActive=true`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          this.templates = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            roomType: t.roomType,
            description: t.description || '',
            imageUrl: t.imageUrl,
            defaultDimensions: {
              length: Number(t.length) || 5.0,
              width: Number(t.width) || 4.0,
              height: Number(t.height) || 2.8
            }
          }));
          localStorage.setItem('dcor_room_templates_cache', JSON.stringify(data));
          if (this.templates.length > 0 && !this.selectedTemplate()) {
            this.selectTemplateCard(this.templates[0]);
          }
          this.cdr.detectChanges();
        }
      })
      .catch(err => {
        console.warn('Không thể tải bản mẫu từ máy chủ, sử dụng dữ liệu mặc định:', err);
        if (this.templates.length === 0) {
          this.templates = [...ROOM_TEMPLATES];
          if (this.templates.length > 0) {
            this.selectTemplateCard(this.templates[0]);
          }
          this.cdr.detectChanges();
        }
      });
  }

  // --- Chuyển tab bản mẫu / tải ảnh ---
  setTab(tab: 'template' | 'upload'): void {
    this.activeTab.set(tab);
    this.uploadError.set('');
  }

  // --- Chọn bản mẫu phòng có sẵn ---
  selectTemplateCard(tmpl: RoomTemplate): void {
    this.selectedTemplate.set(tmpl);
    this.lengthMeters = tmpl.defaultDimensions.length;
    this.widthMeters = tmpl.defaultDimensions.width;
    this.heightMeters = tmpl.defaultDimensions.height || 2.8;
  }

  // --- Xác nhận chọn nguồn ảnh để sang bước 2 ---
  confirmSource(): void {
    if (this.activeTab() === 'template') {
      const tmpl = this.selectedTemplate();
      if (tmpl) {
        this.plannerService.selectTemplate(tmpl);
      }
    } else {
      const up = this.uploadedImage();
      if (up) {
        this.plannerService.setUploadedBackground(up);
      }
    }
  }

  // --- Xử lý tải ảnh thật ---
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

    // Kiểm tra định dạng (chỉ nhận JPG, PNG, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.uploadError.set('Định dạng tệp không được hỗ trợ. Vui lòng chỉ chọn ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    // Kiểm tra dung lượng tối đa 10MB
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

      // Nén xuống cạnh dài tối đa 1600px bằng canvas (JPEG 0.85)
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

      // Vẽ ảnh lên canvas với chất lượng tốt
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
}
