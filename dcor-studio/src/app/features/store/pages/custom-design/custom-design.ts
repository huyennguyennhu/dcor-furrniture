import { Component, ChangeDetectorRef, ElementRef, signal, OnInit, OnDestroy, effect, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { Modal } from '../../../../shared/components/modal/modal';
import { AuthService } from '../../../../core/services/auth.service';
import { RoomPlannerService } from './services/room-planner.service';
import { DESIGN_REPOSITORY, IndexedDbDesignRepository } from './services/design-repository.interface';
import { DesignRepository, PlannerDesign } from './models/planner.model';
import { CommunityPublishService, TaggedProductItem } from './services/community-publish.service';
import { SetupStepComponent } from './components/setup-step/setup-step';
import { PlannerCanvasComponent } from './components/planner-canvas/planner-canvas';
import { ProductPanelComponent } from './components/product-panel/product-panel';
import { SummaryPanelComponent } from './components/summary-panel/summary-panel';

@Component({
  selector: 'app-custom-design',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    IconComponent,
    Modal,
    SetupStepComponent,
    PlannerCanvasComponent,
    ProductPanelComponent,
    SummaryPanelComponent
  ],
  providers: [
    RoomPlannerService,
    CommunityPublishService,
    { provide: DESIGN_REPOSITORY, useClass: IndexedDbDesignRepository }
  ],
  templateUrl: './custom-design.html',
  styleUrls: ['./custom-design.css']
})
export class CustomDesignComponent implements OnInit, OnDestroy {
  // Trạng thái drawer trên thiết bị di động / máy tính bảng (<=1024px)
  mobileDrawer = signal<'none' | 'products' | 'summary'>('none');

  // Trạng thái mở modal xác nhận đổi phòng
  isConfirmChangeRoomOpen = signal<boolean>(false);

  // --- LƯU THIẾT KẾ CỤC BỘ TRÊN TRÌNH DUYỆT (REQ 3) ---
  isSaveModalOpen = signal<boolean>(false);
  saveModalTitleInput = signal<string>('');
  isSavingDraft = signal<boolean>(false);
  private autosaveTimer: any = null;

  // Menu "..." gom nút trên màn hình <= 768px (REQ 3)
  isMoreMenuOpen = signal<boolean>(false);

  // --- TRẠNG THÁI ĐĂNG BÀI & XUẤT ẢNH ---
  isLoginPromptOpen = signal<boolean>(false);
  isPublishModalOpen = signal<boolean>(false);
  isGeneratingPreview = signal<boolean>(false);
  previewImageUrl = signal<string>('');
  private previewBlobUrl: string | null = null;
  private currentPreviewBlob: Blob | null = null;

  // Form đăng bài
  postTitle = signal<string>('');
  postTitleTouched = signal<boolean>(false);
  postDescription = signal<string>('');
  isAgreed = signal<boolean>(false);
  taggedProducts = signal<TaggedProductItem[]>([]);

  // Thông báo lỗi, cảnh báo và thành công (dựa theo status API - REQ 4)
  publishErrorMessage = signal<string | null>(null);
  publishWarningMessage = signal<string | null>(null);
  isPublishSuccess = signal<boolean>(false);
  publishedPostStatus = signal<'PUBLISHED' | 'PENDING' | null>(null);

  // Toast thông báo ngắn
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'info' | 'error'>('info');
  private toastTimer: any = null;

  constructor(
    public plannerService: RoomPlannerService,
    public publishService: CommunityPublishService,
    @Inject(DESIGN_REPOSITORY) private designRepo: DesignRepository,
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {
    // Tự động lưu sau 2 giây không thao tác khi thiết kế đã được lưu lần đầu
    effect(() => {
      const draftId = this.plannerService.currentDraftId();
      // Đăng ký phụ thuộc để kích hoạt effect khi nội thất hoặc kích thước thay đổi
      const objs = this.plannerService.objects();
      const dims = this.plannerService.dimensions();
      const bg = this.plannerService.background();
      const zoom = this.plannerService.zoom();
      const step = this.plannerService.currentStep();

      if (draftId && step === 'planner') {
        this.triggerDebouncedAutosave();
      }
    });
  }

  private onWindowResize = () => this.updateHeaderOffset();

  ngOnInit(): void {
    this.updateHeaderOffset();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.onWindowResize);
    }

    // Khôi phục trạng thái tạm thời của phiên thiết kế nếu vừa chuyển từ trang đăng nhập về
    const restored = this.publishService.restoreTempSessionStateIfAvailable();
    if (restored) {
      this.showToast('Đã khôi phục thiết kế tạm thời của bạn.', 'success');
      if (this.authService.isAuthenticated()) {
        setTimeout(() => this.openPublishModal(), 200);
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onWindowResize);
    }
    this.elementRef.nativeElement.style.removeProperty('--header-actual-bottom');

    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }

    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
  }

  private updateHeaderOffset(): void {
    if (typeof document === 'undefined') return;
    const header = document.querySelector('header.store-site-header') as HTMLElement | null;
    if (header) {
      const bottom = Math.round(header.getBoundingClientRect().bottom);
      if (bottom > 0) {
        this.elementRef.nativeElement.style.setProperty('--header-actual-bottom', `${bottom}px`);
      }
    }
  }

  // ==========================================
  // XỬ LÝ ĐỔI PHÒNG
  // ==========================================

  handleChangeRoomClick(): void {
    if (this.plannerService.objects().length > 0) {
      this.isConfirmChangeRoomOpen.set(true);
    } else {
      this.plannerService.confirmResetAndBackToSetup();
    }
  }

  confirmChangeRoom(): void {
    this.isConfirmChangeRoomOpen.set(false);
    this.plannerService.confirmResetAndBackToSetup();
  }

  cancelChangeRoom(): void {
    this.isConfirmChangeRoomOpen.set(false);
  }

  // ==========================================
  // DRAWER MOBILE CONTROLS
  // ==========================================

  toggleMobileDrawer(drawer: 'products' | 'summary'): void {
    if (this.mobileDrawer() === drawer) {
      this.mobileDrawer.set('none');
    } else {
      this.mobileDrawer.set(drawer);
    }
  }

  closeMobileDrawer(): void {
    this.mobileDrawer.set('none');
  }

  // ==========================================
  // MENU "..." GOM NÚT DƯỚI 768PX (REQ 3)
  // ==========================================

  toggleMoreMenu(): void {
    this.isMoreMenuOpen.set(!this.isMoreMenuOpen());
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen.set(false);
  }

  // ==========================================
  // LƯU THIẾT KẾ CỤC BỘ TRÊN TRÌNH DUYỆT (REQ 3)
  // ==========================================

  handleSaveDesignClick(): void {
    this.closeMoreMenu();
    if (this.plannerService.objects().length === 0) {
      this.showToast('Vui lòng thêm ít nhất một món nội thất vào phòng trước khi lưu.', 'info');
      return;
    }

    // Nếu đã có draftId (đã lưu lần đầu hoặc mở từ bản lưu), lưu ngay lập tức
    if (this.plannerService.currentDraftId()) {
      this.performDirectSave();
    } else {
      // Lần đầu lưu: Mở hộp thoại nhập tên thiết kế
      const defaultName = this.plannerService.background()?.name 
        ? `Thiết kế ${this.plannerService.background()?.name}` 
        : 'Thiết kế không gian phòng khách';
      this.saveModalTitleInput.set(defaultName);
      this.isSaveModalOpen.set(true);
    }
  }

  closeSaveModal(): void {
    this.isSaveModalOpen.set(false);
  }

  async confirmSaveDesign(): Promise<void> {
    const title = this.saveModalTitleInput().trim();
    if (!title) return;

    const bg = this.plannerService.background();
    const dims = this.plannerService.dimensions();
    if (!bg || !dims) return;

    this.isSavingDraft.set(true);
    try {
      const thumb = await this.generateSmallThumbnailDataUrl();
      const newDesign: PlannerDesign = {
        title,
        background: bg,
        dimensions: dims,
        objects: this.plannerService.objects(),
        zoom: this.plannerService.zoom(),
        thumbnailUrl: thumb || undefined
      };

      const savedId = await this.designRepo.saveDraft(newDesign);
      this.plannerService.currentDraftId.set(savedId);
      this.plannerService.currentDraftTitle.set(title);

      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      this.plannerService.lastSavedTime.set(`Đã lưu lúc ${hh}:${mm}`);

      this.isSaveModalOpen.set(false);
      this.showToast(`Đã lưu thiết kế trên máy này lúc ${hh}:${mm}.`, 'success');
    } catch {
      this.showToast('Không thể lưu thiết kế vào trình duyệt. Vui lòng thử lại.', 'error');
    } finally {
      this.isSavingDraft.set(false);
      this.cdr.markForCheck();
    }
  }

  private async performDirectSave(): Promise<void> {
    const draftId = this.plannerService.currentDraftId();
    if (!draftId) return;

    const bg = this.plannerService.background();
    const dims = this.plannerService.dimensions();
    if (!bg || !dims) return;

    this.isSavingDraft.set(true);
    try {
      const thumb = await this.generateSmallThumbnailDataUrl();
      const updatedDesign: PlannerDesign = {
        id: draftId,
        title: this.plannerService.currentDraftTitle() || 'Thiết kế của tôi',
        background: bg,
        dimensions: dims,
        objects: this.plannerService.objects(),
        zoom: this.plannerService.zoom(),
        thumbnailUrl: thumb || undefined
      };

      await this.designRepo.saveDraft(updatedDesign);
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      this.plannerService.lastSavedTime.set(`Đã lưu lúc ${hh}:${mm}`);

      this.showToast(`Đã lưu thiết kế trên máy này lúc ${hh}:${mm}.`, 'success');
    } catch {
      this.showToast('Lưu thiết kế không thành công.', 'error');
    } finally {
      this.isSavingDraft.set(false);
      this.cdr.markForCheck();
    }
  }

  private triggerDebouncedAutosave(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
    this.autosaveTimer = setTimeout(() => {
      this.performAutosave();
    }, 2000);
  }

  private async performAutosave(): Promise<void> {
    const draftId = this.plannerService.currentDraftId();
    if (!draftId || this.plannerService.currentStep() !== 'planner') return;

    const bg = this.plannerService.background();
    const dims = this.plannerService.dimensions();
    if (!bg || !dims) return;

    try {
      const thumb = await this.generateSmallThumbnailDataUrl();
      const updatedDesign: PlannerDesign = {
        id: draftId,
        title: this.plannerService.currentDraftTitle() || 'Thiết kế của tôi',
        background: bg,
        dimensions: dims,
        objects: this.plannerService.objects(),
        zoom: this.plannerService.zoom(),
        thumbnailUrl: thumb || undefined
      };

      await this.designRepo.saveDraft(updatedDesign);
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      this.plannerService.lastSavedTime.set(`Đã lưu lúc ${hh}:${mm}`);
      this.cdr.markForCheck();
    } catch {
      // Tự động lưu ngầm không làm gián đoạn trải nghiệm người dùng
    }
  }

  private async generateSmallThumbnailDataUrl(): Promise<string> {
    try {
      const { blob } = await this.publishService.generateBlob('image/jpeg', 0.6);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch {
      return this.plannerService.background()?.imageUrl || '';
    }
  }

  // ==========================================
  // XUẤT ẢNH PNG
  // ==========================================

  async handleExportPngClick(): Promise<void> {
    this.closeMoreMenu();
    if (this.plannerService.objects().length === 0 || this.publishService.isExporting()) {
      return;
    }

    try {
      const { warning } = await this.publishService.exportAndDownloadPng();
      if (warning) {
        this.showToast(warning, 'info');
      } else {
        this.showToast('Đã tải ảnh thiết kế PNG thành công.', 'success');
      }
    } catch (err: any) {
      this.showToast(err?.message || 'Không thể xuất ảnh thiết kế.', 'error');
    }
  }

  // ==========================================
  // QUY TRÌNH ĐĂNG BÀI LÊN CỘNG ĐỒNG
  // ==========================================

  handlePublishClick(): void {
    this.closeMoreMenu();
    if (this.plannerService.objects().length === 0) {
      return;
    }

    // Kiểm tra xem bố cục đã đăng chưa thay đổi
    if (!this.publishService.hasLayoutChangedSincePublish() && this.publishService.lastPublishedFingerprint() !== null) {
      this.showToast('Thiết kế này đã được đăng. Vui lòng thay đổi bố cục hoặc thêm nội thất để đăng phiên bản mới.', 'info');
      return;
    }

    // Kiểm tra trạng thái đăng nhập
    if (!this.authService.isAuthenticated()) {
      this.isLoginPromptOpen.set(true);
      return;
    }

    this.openPublishModal();
  }

  async openPublishModal(): Promise<void> {
    this.isPublishSuccess.set(false);
    this.publishedPostStatus.set(null);
    this.publishErrorMessage.set(null);
    this.publishWarningMessage.set(null);
    this.postTitleTouched.set(false);

    // Mặc định tên phòng hoặc tiêu đề gợi ý nếu chưa nhập
    if (!this.postTitle().trim()) {
      const roomName = this.plannerService.background()?.name || 'Phòng khách';
      this.postTitle.set(this.plannerService.currentDraftTitle() || `Thiết kế ${roomName} ấm cúng`);
    }

    // Lấy danh sách gắn thẻ
    this.taggedProducts.set(this.publishService.getTaggedProducts());

    this.isPublishModalOpen.set(true);
    this.isGeneratingPreview.set(true);

    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }

    try {
      const { blob, warning } = await this.publishService.generateBlob('image/jpeg', 0.85);
      this.currentPreviewBlob = blob;
      this.previewBlobUrl = URL.createObjectURL(blob);
      this.previewImageUrl.set(this.previewBlobUrl);

      if (warning) {
        this.publishWarningMessage.set(warning);
      }
    } catch (err: any) {
      this.publishErrorMessage.set(err?.message || 'Không thể tạo ảnh xem trước bài đăng.');
    } finally {
      this.isGeneratingPreview.set(false);
    }
  }

  closePublishModal(): void {
    this.isPublishModalOpen.set(false);
    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }
    this.currentPreviewBlob = null;
  }

  confirmNavigateToLogin(): void {
    this.isLoginPromptOpen.set(false);
    this.publishService.redirectToLoginWithSavedState();
  }

  cancelLoginPrompt(): void {
    this.isLoginPromptOpen.set(false);
  }

  submitPublishPost(): void {
    this.postTitleTouched.set(true);

    const title = this.postTitle().trim();
    if (!title || title.length > 100) {
      return;
    }

    if (this.postDescription().length > 500) {
      return;
    }

    if (!this.isAgreed()) {
      this.publishErrorMessage.set('Vui lòng chọn đồng ý với tiêu chuẩn chia sẻ cộng đồng trước khi gửi.');
      return;
    }

    if (!this.currentPreviewBlob) {
      this.publishErrorMessage.set('Chưa sẵn sàng file ảnh bài đăng. Vui lòng thử lại.');
      return;
    }

    this.publishErrorMessage.set(null);

    this.publishService.publishDesign(title, this.postDescription(), this.currentPreviewBlob).subscribe({
      next: (postRes) => {
        // Dựa vào status API: 'PUBLISHED' vs 'PENDING' (REQ 4)
        this.publishedPostStatus.set(postRes?.status || 'PENDING');
        this.isPublishSuccess.set(true);
      },
      error: (err: any) => {
        // Giữ nguyên nội dung form (postTitle, postDescription, isAgreed) và thông báo lỗi tiếng Việt
        this.publishErrorMessage.set(this.publishService.formatHttpError(err));
      }
    });
  }

  goToCommunity(): void {
    this.closePublishModal();
    this.router.navigate(['/community']);
  }

  showToast(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }

  closeToast(): void {
    this.toastMessage.set(null);
  }
}
