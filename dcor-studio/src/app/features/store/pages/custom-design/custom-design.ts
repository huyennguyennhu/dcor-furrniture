import { Component, ChangeDetectorRef, ElementRef, signal, OnInit, OnDestroy, effect, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { Modal } from '../../../../shared/components/modal/modal';
import { AuthService } from '../../../../core/services/auth.service';
import { RoomPlannerService } from './services/room-planner.service';
import { DESIGN_REPOSITORY, HttpDesignRepository } from './services/design-repository.interface';
import { DesignRepository, PlannerDesign } from './models/planner.model';
import { CommunityPublishService, TaggedProductItem } from './services/community-publish.service';
import { MyDesignApiService, UserDesignApi } from './services/my-design-api.service';
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
    { provide: DESIGN_REPOSITORY, useClass: HttpDesignRepository }
  ],
  templateUrl: './custom-design.html',
  styleUrls: ['./custom-design.css']
})
export class CustomDesignComponent implements OnInit, OnDestroy {
  // Trạng thái drawer trên thiết bị di động / máy tính bảng (<=1024px)
  mobileDrawer = signal<'none' | 'products' | 'summary'>('none');

  // Trạng thái mở modal xác nhận đổi phòng
  isConfirmChangeRoomOpen = signal<boolean>(false);

  // --- LƯU THIẾT KẾ VÀ TỰ LƯU NHÁP TRÊN MÁY CHỦ ---
  isSaveModalOpen = signal<boolean>(false);
  saveModalTitleInput = signal<string>('');
  isSavingDraft = signal<boolean>(false);
  autoSaveError = signal<string | null>(null);
  private autosaveTimer: any = null;

  // Menu "..." gom nút trên màn hình <= 768px
  isMoreMenuOpen = signal<boolean>(false);

  // --- TRẠNG THÁI ĐĂNG BÀI & XUẤT ẢNH ---
  isLoginPromptOpen = signal<boolean>(false);
  isPublishModalOpen = signal<boolean>(false);
  isGeneratingPreview = signal<boolean>(false);
  previewImageUrl = signal<string>('');
  compressedImageSizeText = signal<string>('');
  private previewBlobUrl: string | null = null;
  private currentPreviewBlob: Blob | null = null;

  // Form đăng bài
  postTitle = signal<string>('');
  postTitleTouched = signal<boolean>(false);
  postDescription = signal<string>('');
  isAgreed = signal<boolean>(false);
  taggedProducts = signal<TaggedProductItem[]>([]);

  // Thông báo lỗi, cảnh báo và thành công
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
    public myDesignApi: MyDesignApiService,
    @Inject(DESIGN_REPOSITORY) private designRepo: DesignRepository,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private elementRef: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {
    // Tự động lưu sau 2 giây không thao tác trên máy chủ (chỉ khi đã đăng nhập)
    effect(() => {
      // Đăng ký phụ thuộc để kích hoạt effect khi nội thất hoặc kích thước thay đổi
      const objs = this.plannerService.objects();
      const dims = this.plannerService.dimensions();
      const bg = this.plannerService.background();
      const zoom = this.plannerService.zoom();
      const step = this.plannerService.currentStep();

      if (step === 'planner' && bg && dims && objs.length > 0) {
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

    // Đọc queryParam designId để khôi phục thiết kế từ máy chủ nếu được chỉ định
    this.route.queryParams.subscribe((params) => {
      const designId = params['designId'];
      if (designId) {
        this.loadDesignFromApi(designId);
      }
    });

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
  // KHÔI PHỤC THIẾT KẾ TỪ API KHI MỞ LINK /custom-design?designId=
  // ==========================================
  private async loadDesignFromApi(designId: string): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/custom-design?designId=${designId}` }
      });
      return;
    }

    try {
      const full = await firstValueFrom(this.myDesignApi.getDesign(designId));
      const fullDesign: PlannerDesign = {
        id: full.id,
        title: full.title,
        background: {
          type: full.backgroundType === 'UPLOAD' ? 'upload' : 'template',
          name: full.title,
          imageUrl: full.backgroundUrl,
          naturalWidth: 1200,
          naturalHeight: 800,
          templateId: full.templateId || undefined
        },
        dimensions: {
          length: full.roomLength,
          width: full.roomWidth,
          height: full.roomHeight || 2.8
        },
        objects: full.layout || [],
        thumbnailUrl: full.coverImageUrl || undefined,
        zoom: 1
      };

      // Đọc kích thước điểm ảnh thật của hình nền
      const img = new Image();
      img.onload = () => {
        fullDesign.background.naturalWidth = img.naturalWidth || 1200;
        fullDesign.background.naturalHeight = img.naturalHeight || 800;
        this.plannerService.loadDesign(fullDesign);
        this.plannerService.currentDraftId.set(full.id);
        this.plannerService.currentDraftTitle.set(full.title);
        this.plannerService.lastSavedTime.set(full.status === 'SAVED' ? 'Đã lưu' : 'Đã lưu nháp');
        this.showToast(`Đã mở thiết kế "${full.title}".`, 'success');
        this.cdr.markForCheck();
      };
      img.onerror = () => {
        this.plannerService.loadDesign(fullDesign);
        this.plannerService.currentDraftId.set(full.id);
        this.plannerService.currentDraftTitle.set(full.title);
        this.plannerService.lastSavedTime.set(full.status === 'SAVED' ? 'Đã lưu' : 'Đã lưu nháp');
        this.showToast(`Đã mở thiết kế "${full.title}".`, 'success');
        this.cdr.markForCheck();
      };
      img.src = full.backgroundUrl;
    } catch (err: any) {
      this.showToast(this.myDesignApi.formatError(err, 'Không thể tải thiết kế từ máy chủ.'), 'error');
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
  // MENU "..." GOM NÚT DƯỚI 768PX
  // ==========================================
  toggleMoreMenu(): void {
    this.isMoreMenuOpen.set(!this.isMoreMenuOpen());
  }

  closeMoreMenu(): void {
    this.isMoreMenuOpen.set(false);
  }

  // ==========================================
  // TỰ ĐỘNG LƯU BẢN NHÁP (DEBOUNCE 2 GIÂY TRÊN MÁY CHỦ)
  // ==========================================
  private triggerDebouncedAutosave(): void {
    if (this.autosaveTimer) {
      clearTimeout(this.autosaveTimer);
    }
    this.autosaveTimer = setTimeout(() => {
      this.performAutosave();
    }, 2000);
  }

  async performAutosave(): Promise<void> {
    // Chưa đăng nhập thì lưu tạm trong bộ nhớ của service, không gửi lên server
    if (!this.authService.isAuthenticated()) {
      return;
    }

    if (this.plannerService.currentStep() !== 'planner') {
      return;
    }

    const bg = this.plannerService.background();
    const dims = this.plannerService.dimensions();
    const objs = this.plannerService.objects();

    if (!bg || !dims || objs.length === 0) {
      return;
    }

    const draftId = this.plannerService.currentDraftId();
    this.isSavingDraft.set(true);

    try {
      if (!draftId) {
        // Thiết kế mới: Tự động tạo bản nháp DRAFT trên máy chủ sau thao tác đầu tiên
        const defaultTitle =
          this.plannerService.currentDraftTitle() ||
          (bg.name ? `Thiết kế ${bg.name}` : 'Thiết kế phòng khách');

        const created = await firstValueFrom(
          this.myDesignApi.createDraft({
            title: defaultTitle,
            backgroundType: bg.type === 'upload' ? 'UPLOAD' : 'TEMPLATE',
            backgroundUrl: bg.imageUrl,
            templateId: bg.templateId || null,
            roomLength: dims.length,
            roomWidth: dims.width,
            roomHeight: dims.height || 2.8,
            layout: objs
          })
        );

        this.plannerService.currentDraftId.set(created.id);
        this.plannerService.currentDraftTitle.set(created.title);
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        this.plannerService.lastSavedTime.set(`Đã lưu nháp lúc ${hh}:${mm}`);
        this.autoSaveError.set(null);
      } else {
        // Bản nháp đã có trên máy chủ: Tự lưu cập nhật layout và kích thước
        await firstValueFrom(
          this.myDesignApi.updateDesign(draftId, {
            roomLength: dims.length,
            roomWidth: dims.width,
            roomHeight: dims.height || 2.8,
            layout: objs
          })
        );

        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        this.plannerService.lastSavedTime.set(`Đã lưu nháp lúc ${hh}:${mm}`);
        this.autoSaveError.set(null);
      }
    } catch (err: any) {
      this.autoSaveError.set('Lỗi lưu nháp');
    } finally {
      this.isSavingDraft.set(false);
      this.cdr.markForCheck();
    }
  }

  retryAutoSave(): void {
    this.autoSaveError.set(null);
    this.performAutosave();
  }

  // ==========================================
  // NÚT "LƯU THIẾT KẾ": HỘP THOẠI NHẬP TÊN -> PATCH SAVE (DRAFT -> SAVED)
  // ==========================================
  handleSaveDesignClick(): void {
    this.closeMoreMenu();

    if (this.plannerService.objects().length === 0) {
      this.showToast('Vui lòng thêm ít nhất một món nội thất vào phòng trước khi lưu.', 'info');
      return;
    }

    // Chưa đăng nhập thì mở luồng nhắc đăng nhập
    if (!this.authService.isAuthenticated()) {
      this.isLoginPromptOpen.set(true);
      return;
    }

    // Mở hộp thoại nhập tên thiết kế
    const defaultName =
      this.plannerService.currentDraftTitle() ||
      (this.plannerService.background()?.name
        ? `Thiết kế ${this.plannerService.background()?.name}`
        : 'Thiết kế phòng khách hoàn thiện');
    this.saveModalTitleInput.set(defaultName);
    this.isSaveModalOpen.set(true);
  }

  closeSaveModal(): void {
    this.isSaveModalOpen.set(false);
  }

  async confirmSaveDesign(): Promise<void> {
    const title = this.saveModalTitleInput().trim();
    if (!title) return;

    const bg = this.plannerService.background();
    const dims = this.plannerService.dimensions();
    const objs = this.plannerService.objects();
    if (!bg || !dims || objs.length === 0) return;

    this.isSavingDraft.set(true);
    try {
      // 1. Tạo ảnh bìa nén (cạnh dài 640px, JPEG <= 150KB)
      const coverBlob = await this.publishService.generateCoverBlob(640, 150 * 1024);

      // 2. Tải ảnh bìa qua API /upload/image
      const uploadRes = await firstValueFrom(this.myDesignApi.uploadImage(coverBlob, 'cover.jpg'));
      const coverUrl = uploadRes.url;

      let draftId = this.plannerService.currentDraftId();

      // Nếu chưa có draftId trên máy chủ, tạo bản nháp trước
      if (!draftId) {
        const created = await firstValueFrom(
          this.myDesignApi.createDraft({
            title,
            backgroundType: bg.type === 'upload' ? 'UPLOAD' : 'TEMPLATE',
            backgroundUrl: bg.imageUrl,
            templateId: bg.templateId || null,
            roomLength: dims.length,
            roomWidth: dims.width,
            roomHeight: dims.height || 2.8,
            layout: objs,
            coverImageUrl: coverUrl
          })
        );
        draftId = created.id;
        this.plannerService.currentDraftId.set(created.id);
      }

      // 3. Gọi PATCH /:id/save để chuyển sang SAVED vĩnh viễn
      await firstValueFrom(this.myDesignApi.saveDesign(draftId, title, coverUrl));

      this.plannerService.currentDraftTitle.set(title);
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      this.plannerService.lastSavedTime.set(`Đã lưu lúc ${hh}:${mm}`);
      this.autoSaveError.set(null);

      this.isSaveModalOpen.set(false);
      this.showToast('Đã lưu thiết kế thành công vào tài khoản của bạn.', 'success');
    } catch (err: any) {
      this.showToast(this.myDesignApi.formatError(err, 'Lưu thiết kế không thành công.'), 'error');
    } finally {
      this.isSavingDraft.set(false);
      this.cdr.markForCheck();
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

    if (!this.publishService.hasLayoutChangedSincePublish() && this.publishService.lastPublishedFingerprint() !== null) {
      this.showToast('Thiết kế này đã được đăng. Vui lòng thay đổi bố cục để đăng phiên bản mới.', 'info');
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

    if (!this.postTitle().trim()) {
      const roomName = this.plannerService.background()?.name || 'Phòng khách';
      this.postTitle.set(this.plannerService.currentDraftTitle() || `Thiết kế ${roomName} ấm cúng`);
    }

    this.taggedProducts.set(this.publishService.getTaggedProducts());
    this.isPublishModalOpen.set(true);
    this.isGeneratingPreview.set(true);

    if (this.previewBlobUrl) {
      URL.revokeObjectURL(this.previewBlobUrl);
      this.previewBlobUrl = null;
    }

    try {
      const { blob, warning, sizeKb } = await this.publishService.generateCompressedBlobForPublish();
      this.currentPreviewBlob = blob;
      this.compressedImageSizeText.set(`ảnh ${sizeKb}KB`);
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
    this.compressedImageSizeText.set('');
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
        this.publishedPostStatus.set(postRes?.status || 'PENDING');
        this.isPublishSuccess.set(true);

        // Sau khi đăng lên Cộng đồng thành công, gọi PATCH link-post để liên kết thiết kế
        const draftId = this.plannerService.currentDraftId();
        if (draftId && postRes?.id) {
          this.myDesignApi.linkPost(draftId, postRes.id).subscribe({
            next: () => {},
            error: () => {}
          });
        }
      },
      error: (err: any) => {
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
