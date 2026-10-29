import { Component, ChangeDetectorRef, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { Modal } from '../../../../shared/components/modal/modal';
import { AuthService } from '../../../../core/services/auth.service';
import {
  MyDesignApiService,
  UserDesignApi,
  LikedPostApi
} from '../../../store/pages/custom-design/services/my-design-api.service';

@Component({
  selector: 'app-my-designs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IconComponent, Modal],
  templateUrl: './my-designs.html',
  styleUrls: ['./my-designs.css']
})
export class MyDesignsComponent implements OnInit, OnDestroy {
  // Tab hiện tại: DRAFT | SAVED | LIKED
  activeTab = signal<'SAVED' | 'DRAFT' | 'LIKED'>('SAVED');

  // Danh sách dữ liệu cho từng tab
  drafts = signal<UserDesignApi[]>([]);
  saved = signal<UserDesignApi[]>([]);
  liked = signal<LikedPostApi[]>([]);

  // Trạng thái tải & lỗi
  isLoading = signal<boolean>(true);
  isActionLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Modal Xóa thiết kế
  isDeleteModalOpen = signal<boolean>(false);
  itemToDelete = signal<UserDesignApi | null>(null);

  // Modal Đổi tên thiết kế
  isRenameModalOpen = signal<boolean>(false);
  itemToRename = signal<UserDesignApi | null>(null);
  renameInput = signal<string>('');
  renameError = signal<string | null>(null);

  // Toast thông báo
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'error' | 'info'>('info');
  private toastTimer: any = null;

  constructor(
    private api: MyDesignApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/account/designs' }
      });
      return;
    }

    this.loadAllData();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  loadAllData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      drafts: this.api.listDesigns('DRAFT'),
      saved: this.api.listDesigns('SAVED'),
      liked: this.api.listLikedPosts()
    }).subscribe({
      next: ({ drafts, saved, liked }) => {
        this.drafts.set(drafts || []);
        this.saved.set(saved || []);
        this.liked.set(liked || []);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage.set(this.api.formatError(err, 'Không thể tải danh sách thiết kế. Vui lòng thử lại.'));
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  switchTab(tab: 'SAVED' | 'DRAFT' | 'LIKED'): void {
    this.activeTab.set(tab);
  }

  openDesign(design: UserDesignApi): void {
    this.router.navigate(['/custom-design'], {
      queryParams: { designId: design.id }
    });
  }

  // --- ĐỔI TÊN THIẾT KẾ ---
  promptRename(design: UserDesignApi, event?: Event): void {
    if (event) event.stopPropagation();
    this.itemToRename.set(design);
    this.renameInput.set(design.title);
    this.renameError.set(null);
    this.isRenameModalOpen.set(true);
  }

  closeRenameModal(): void {
    this.isRenameModalOpen.set(false);
    this.itemToRename.set(null);
    this.renameError.set(null);
  }

  confirmRename(): void {
    const item = this.itemToRename();
    const newTitle = this.renameInput().trim();

    if (!item) return;

    if (!newTitle) {
      this.renameError.set('Tiêu đề thiết kế không được để trống.');
      return;
    }

    if (newTitle.length > 100) {
      this.renameError.set('Tiêu đề không được vượt quá 100 ký tự.');
      return;
    }

    this.isActionLoading.set(true);
    this.api.renameDesign(item.id, newTitle).subscribe({
      next: (updated) => {
        // Cập nhật danh sách trong signal
        if (item.status === 'SAVED') {
          this.saved.update((list) => list.map((d) => (d.id === item.id ? { ...d, title: updated.title } : d)));
        } else {
          this.drafts.update((list) => list.map((d) => (d.id === item.id ? { ...d, title: updated.title } : d)));
        }

        this.closeRenameModal();
        this.showToast('Đổi tên thiết kế thành công.', 'success');
        this.isActionLoading.set(false);
      },
      error: (err) => {
        this.renameError.set(this.api.formatError(err, 'Không thể đổi tên thiết kế.'));
        this.isActionLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // --- XÓA THIẾT KẾ ---
  promptDelete(design: UserDesignApi, event?: Event): void {
    if (event) event.stopPropagation();
    this.itemToDelete.set(design);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDelete.set(null);
  }

  confirmDelete(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.isActionLoading.set(true);
    this.api.deleteDesign(item.id).subscribe({
      next: () => {
        if (item.status === 'SAVED') {
          this.saved.update((list) => list.filter((d) => d.id !== item.id));
        } else {
          this.drafts.update((list) => list.filter((d) => d.id !== item.id));
        }

        this.closeDeleteModal();
        this.showToast('Đã xóa thiết kế thành công.', 'success');
        this.isActionLoading.set(false);
      },
      error: (err) => {
        this.showToast(this.api.formatError(err, 'Không thể xóa thiết kế.'), 'error');
        this.isActionLoading.set(false);
        this.closeDeleteModal();
      }
    });
  }

  // --- BỎ THÍCH BÀI CỘNG ĐỒNG ---
  unlikePost(post: LikedPostApi, event?: Event): void {
    if (event) event.stopPropagation();

    this.api.toggleLikePost(post.id).subscribe({
      next: (res) => {
        if (!res.liked) {
          this.liked.update((list) => list.filter((p) => p.id !== post.id));
          this.showToast(`Đã bỏ thích bài viết "${post.title}".`, 'info');
        }
      },
      error: (err) => {
        this.showToast(this.api.formatError(err, 'Không thể cập nhật lượt thích.'), 'error');
      }
    });
  }

  openCommunityPost(post: LikedPostApi): void {
    this.router.navigate(['/community'], {
      queryParams: { post: post.id }
    });
  }

  // --- TIỆN ÍCH HIỂN THỊ ---
  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${mins} · ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }

  isDaysWarning(days?: number): boolean {
    return days !== undefined && days <= 2;
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  closeToast(): void {
    this.toastMessage.set(null);
  }
}

