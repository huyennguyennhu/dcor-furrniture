import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { environment } from '../../../../../../environments/environment';

export interface TaggedProductItem {
  x?: number;
  y?: number;
  productId?: string;
  name?: string;
  price?: number;
  imageUrl?: string;
}

export interface DesignCommentItem {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  status: 'VISIBLE' | 'HIDDEN';
  createdAt: string;
  postTitle?: string;
}

export interface DesignPostItem {
  id: string;
  title: string;
  authorName: string;
  authorEmail?: string | null;
  description?: string | null;
  imageUrl: string;
  taggedProducts?: TaggedProductItem[] | null;
  likesCount: number;
  status: 'PENDING' | 'PUBLISHED' | 'REJECTED';
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: DesignCommentItem[];
}

const PRESET_SAMPLE_POSTS: DesignPostItem[] = [
  {
    id: 'POST-001',
    title: 'Cải tạo phòng khách căn hộ 70m2 Vinhomes Grand Park',
    authorName: 'Hoàng Minh Khôi',
    authorEmail: 'khoi.hm@gmail.com',
    description: 'Phối cảnh phòng khách tone màu be ấm áp kết hợp bộ sofa góc DCor Nordic và bàn trà đá ceramic. Rất ưng ý với chất lượng hoàn thiện của DCor!',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80',
    taggedProducts: [
      { x: 42, y: 58, name: 'Sofa Góc Chữ L DCor Nordic', price: 18500000 },
      { x: 55, y: 72, name: 'Bàn Trà Mặt Đá Ceramic DCor Elegance', price: 6200000 }
    ],
    likesCount: 42,
    status: 'PUBLISHED',
    rejectionReason: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    comments: [
      {
        id: 'CMT-001',
        postId: 'POST-001',
        authorName: 'Vũ Đức Thịnh',
        content: 'Tone màu đẹp quá anh ơi, bộ sofa nỉ màu be này ngồi êm và dễ vệ sinh không ạ?',
        status: 'VISIBLE',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'CMT-002',
        postId: 'POST-001',
        authorName: 'DCor Consultant',
        content: 'Cảm ơn anh Khôi đã tin tưởng nội thất DCor. Chúc anh và gia đình có nhiều khoảnh khắc tuyệt vời trong không gian mới!',
        status: 'VISIBLE',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      }
    ]
  },
  {
    id: 'POST-002',
    title: 'Phòng ngủ tối giản phong cách Wabi-Sabi mộc mạc',
    authorName: 'Trần Phương Thảo',
    authorEmail: 'thao.tp@gmail.com',
    description: 'Góc nghỉ ngơi thảnh thơi sau ngày làm việc mệt mỏi. Giường bọc nệm êm ái cùng hệ ánh sáng vàng ấm 3000K.',
    imageUrl: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=800&auto=format&fit=crop&q=80',
    taggedProducts: [
      { x: 50, y: 65, name: 'Giường Ngủ Bọc Nệm DCor King Bed', price: 21000000 }
    ],
    likesCount: 18,
    status: 'PENDING',
    rejectionReason: null,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    comments: []
  },
  {
    id: 'POST-003',
    title: 'Không gian bàn ăn gỗ óc chó 6 ghế ấm cúng',
    authorName: 'Lê Văn Nam',
    authorEmail: 'nam.le@yahoo.com',
    description: 'Bài viết chia sẻ thiết kế phòng ăn kết hợp quầy bar nhỏ.',
    imageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&auto=format&fit=crop&q=80',
    taggedProducts: [
      { x: 48, y: 60, name: 'Bộ Bàn Ghế Ăn DCor Walnut 6 Ghế', price: 28000000 }
    ],
    likesCount: 9,
    status: 'PENDING',
    rejectionReason: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    comments: []
  }
];

export const PRESET_REJECTION_REASONS = [
  'Nội dung hoặc hình ảnh vi phạm bản quyền / không chính chủ',
  'Hình ảnh mờ, chất lượng thấp hoặc không thể hiện rõ không gian nội thất',
  'Gắn thẻ sản phẩm sai lệch hoặc không liên quan đến sản phẩm DCor',
  'Nội dung chứa thông tin quảng cáo rác (spam) hoặc từ ngữ không phù hợp',
  'Hình ảnh chứa thông tin nhạy cảm hoặc không đúng tiêu chuẩn cộng đồng'
];

@Component({
  selector: 'app-design-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './design-posts.html',
  styleUrls: ['./design-posts.css']
})
export class DesignPostsComponent implements OnInit {
  records: DesignPostItem[] = [];
  isLoading = false;

  // Active Tab: ALL | PENDING | PUBLISHED | REJECTED | COMMENTS
  activeTab: 'ALL' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'COMMENTS' = 'ALL';

  // Filters
  searchTerm = '';

  // Detail Modal
  selectedPost: DesignPostItem | null = null;
  isDetailModalOpen = false;

  // Rejection Modal
  postToReject: DesignPostItem | null = null;
  rejectionReason = '';
  selectedPresetReason = '';
  readonly PRESET_REASONS = PRESET_REJECTION_REASONS;

  // Confirmation Modals State
  postToApprove: DesignPostItem | null = null;
  commentToDelete: DesignCommentItem | null = null;
  postToDelete: DesignPostItem | null = null;

  // Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' = 'success';
  private toastTimer: any = null;

  private readonly API_BASE = environment.apiUrl ? `${environment.apiUrl}/designs` : 'http://localhost:3000/api/designs';

  private getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem('dcor_admin_token') || localStorage.getItem('dcor_admin_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  private loadCachedPosts(): void {
    try {
      const cached = localStorage.getItem('dcor_design_posts_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.records = parsed;
        }
      }
    } catch (e) {}
  }

  async loadPosts(): Promise<void> {
    this.isLoading = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    try {
      const res = await fetch(`${this.API_BASE}/posts`, {
        headers: this.getAuthHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.records = data.map(item => ({
            ...item,
            taggedProducts: Array.isArray(item.taggedProducts) ? item.taggedProducts : []
          }));
          localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
      } else if (res.status === 403) {
        const err = await res.json().catch(() => ({}));
        this.showToast(err.message || 'Bạn không có quyền xem danh sách thiết kế.', 'warning');
        this.records = [];
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }
      this.loadCachedPosts();
      if (this.records.length === 0) {
        this.records = [...PRESET_SAMPLE_POSTS];
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('API error fetching design posts, falling back to cached seed:', err);
      this.loadCachedPosts();
      if (this.records.length === 0) {
        this.records = [...PRESET_SAMPLE_POSTS];
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Stats Counters
  get pendingCount(): number {
    return this.records.filter(r => r.status === 'PENDING').length;
  }

  get publishedCount(): number {
    return this.records.filter(r => r.status === 'PUBLISHED').length;
  }

  get rejectedCount(): number {
    return this.records.filter(r => r.status === 'REJECTED').length;
  }

  get totalCount(): number {
    return this.records.length;
  }

  get totalCommentsCount(): number {
    return this.records.reduce((acc, p) => acc + (p.comments?.length || 0), 0);
  }

  // Filtered Records based on Active Tab & Search Term
  get filteredRecords(): DesignPostItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.records.filter(post => {
      // Status match
      if (this.activeTab !== 'ALL' && this.activeTab !== 'COMMENTS' && post.status !== this.activeTab) {
        return false;
      }
      // Search match
      if (!term) return true;
      const matchTitle = (post.title || '').toLowerCase().includes(term);
      const matchAuthor = (post.authorName || '').toLowerCase().includes(term);
      const matchEmail = (post.authorEmail || '').toLowerCase().includes(term);
      const matchDesc = (post.description || '').toLowerCase().includes(term);
      const matchProducts = (post.taggedProducts || []).some(tp => (tp.name || '').toLowerCase().includes(term));
      return matchTitle || matchAuthor || matchEmail || matchDesc || matchProducts;
    });
  }

  // Flattened Comments list for Comments Management Tab
  get allCommentsList(): DesignCommentItem[] {
    const list: DesignCommentItem[] = [];
    for (const post of this.records) {
      if (post.comments && post.comments.length > 0) {
        for (const c of post.comments) {
          list.push({
            ...c,
            postTitle: post.title
          });
        }
      }
    }
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter(c =>
      (c.authorName || '').toLowerCase().includes(term) ||
      (c.content || '').toLowerCase().includes(term) ||
      (c.postTitle || '').toLowerCase().includes(term)
    );
  }

  // Tab Switch
  switchTab(tab: 'ALL' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'COMMENTS'): void {
    this.activeTab = tab;
  }

  // =========================================================================
  // XÁC NHẬN PHÊ DUYỆT BÀI ĐĂNG (MODAL CONFIRMATION)
  // =========================================================================

  promptApprove(post: DesignPostItem): void {
    this.postToApprove = post;
  }

  cancelApprove(): void {
    this.postToApprove = null;
  }

  async confirmApprove(): Promise<void> {
    if (!this.postToApprove) return;
    const post = this.postToApprove;
    const postId = post.id;
    const postTitle = post.title;
    this.postToApprove = null;

    const oldStatus = post.status;
    const oldReason = post.rejectionReason;
    
    // Optimistic UI update (phản hồi 0ms trên giao diện)
    post.status = 'PUBLISHED';
    post.rejectionReason = null;
    this.records = [...this.records];
    localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
    if (this.selectedPost && this.selectedPost.id === postId) {
      this.selectedPost.status = 'PUBLISHED';
    }
    this.cdr.detectChanges();
    this.showToast(`Đã phê duyệt bài đăng "${postTitle}" lên cộng đồng!`, 'success');

    try {
      const res = await fetch(`${this.API_BASE}/posts/${postId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({ status: 'PUBLISHED' })
      });
      if (!res.ok) {
        // Revert nếu có lỗi
        post.status = oldStatus;
        post.rejectionReason = oldReason;
        this.records = [...this.records];
        localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
        this.cdr.detectChanges();
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Bạn không có quyền duyệt bài đăng thiết kế.';
        this.showToast(msg, 'warning');
      }
    } catch {
      post.status = oldStatus;
      post.rejectionReason = oldReason;
      this.records = [...this.records];
      localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
      this.cdr.detectChanges();
      this.showToast('Lỗi máy chủ khi duyệt bài đăng.', 'warning');
    }
  }

  // Open Rejection Modal
  openRejectModal(post: DesignPostItem): void {
    this.postToReject = post;
    this.rejectionReason = '';
    this.selectedPresetReason = this.PRESET_REASONS[0];
  }

  closeRejectModal(): void {
    this.postToReject = null;
    this.rejectionReason = '';
    this.selectedPresetReason = '';
  }

  selectPresetReason(reason: string): void {
    this.selectedPresetReason = reason;
  }

  async confirmReject(): Promise<void> {
    if (!this.postToReject) return;
    const finalReason = this.rejectionReason.trim() || this.selectedPresetReason || 'Nội dung không phù hợp với tiêu chuẩn cộng đồng DCor.';
    const postId = this.postToReject.id;
    const postTitle = this.postToReject.title;

    const post = this.postToReject;
    const oldStatus = post.status;
    const oldReason = post.rejectionReason;

    // Optimistic UI update
    post.status = 'REJECTED';
    post.rejectionReason = finalReason;
    this.records = [...this.records];
    localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
    if (this.selectedPost && this.selectedPost.id === postId) {
      this.selectedPost.status = 'REJECTED';
      this.selectedPost.rejectionReason = finalReason;
    }
    this.cdr.detectChanges();
    this.showToast(`Đã từ chối bài viết "${postTitle}"`, 'warning');
    this.closeRejectModal();

    try {
      const res = await fetch(`${this.API_BASE}/posts/${postId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: finalReason
        })
      });
      if (!res.ok) {
        post.status = oldStatus;
        post.rejectionReason = oldReason;
        this.records = [...this.records];
        localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
        this.cdr.detectChanges();
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Bạn không có quyền từ chối bài đăng thiết kế.';
        this.showToast(msg, 'warning');
      }
    } catch {
      post.status = oldStatus;
      post.rejectionReason = oldReason;
      this.records = [...this.records];
      localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
      this.cdr.detectChanges();
      this.showToast('Lỗi máy chủ khi từ chối bài đăng.', 'warning');
    }
  }

  // Restore post to PENDING
  async restoreToPending(post: DesignPostItem): Promise<void> {
    const oldStatus = post.status;
    post.status = 'PENDING';
    this.records = [...this.records];
    localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
    this.cdr.detectChanges();
    this.showToast(`Đã chuyển bài viết "${post.title}" về trạng thái chờ duyệt`, 'info');

    try {
      const res = await fetch(`${this.API_BASE}/posts/${post.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
        body: JSON.stringify({ status: 'PENDING' })
      });
      if (!res.ok) {
        post.status = oldStatus;
        this.records = [...this.records];
        localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
        this.cdr.detectChanges();
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Bạn không có quyền chuyển trạng thái bài đăng.';
        this.showToast(msg, 'warning');
      }
    } catch {
      post.status = oldStatus;
      this.records = [...this.records];
      localStorage.setItem('dcor_design_posts_cache', JSON.stringify(this.records));
      this.cdr.detectChanges();
      this.showToast('Lỗi máy chủ khi cập nhật trạng thái bài đăng.', 'warning');
    }
  }

  // Open Detail & Comments Modal
  openDetailModal(post: DesignPostItem): void {
    this.selectedPost = post;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.selectedPost = null;
    this.isDetailModalOpen = false;
  }

  // =========================================================================
  // XÁC NHẬN XÓA BÌNH LUẬN (MODAL CONFIRMATION)
  // =========================================================================

  promptDeleteComment(comment: DesignCommentItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.commentToDelete = comment;
  }

  cancelDeleteComment(): void {
    this.commentToDelete = null;
  }

  async confirmDeleteComment(): Promise<void> {
    if (!this.commentToDelete) return;
    const comment = this.commentToDelete;
    const commentId = comment.id;
    this.commentToDelete = null;

    try {
      const res = await fetch(`${this.API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        comment.status = 'HIDDEN';
        this.showToast('Đã xóa bình luận vi phạm khỏi hệ thống.', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Bạn không có quyền xóa bình luận.';
        this.showToast(msg, 'warning');
      }
    } catch {
      this.showToast('Lỗi máy chủ khi xóa bình luận.', 'warning');
    }
  }

  // =========================================================================
  // XÁC NHẬN XÓA BÀI VIẾT (MODAL CONFIRMATION)
  // =========================================================================

  promptDeletePost(post: DesignPostItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.postToDelete = post;
  }

  cancelDeletePost(): void {
    this.postToDelete = null;
  }

  async confirmDeletePost(): Promise<void> {
    if (!this.postToDelete) return;
    const post = this.postToDelete;
    const postId = post.id;
    const postTitle = post.title;
    this.postToDelete = null;

    try {
      const res = await fetch(`${this.API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        this.records = this.records.filter(r => r.id !== postId);
        if (this.selectedPost && this.selectedPost.id === postId) {
          this.closeDetailModal();
        }
        this.showToast(`Đã xóa bài viết "${postTitle}" vĩnh viễn.`, 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.message || 'Bạn không có quyền xóa bài đăng thiết kế.';
        this.showToast(msg, 'warning');
      }
    } catch {
      this.showToast('Lỗi máy chủ khi xóa bài đăng.', 'warning');
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '--';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  formatCurrency(value?: number): string {
    if (!value) return '0 ₫';
    return value.toLocaleString('vi-VN') + ' ₫';
  }

  showToast(message: string, type: 'success' | 'warning' | 'info' = 'success'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimer = setTimeout(() => {
      this.closeToast();
    }, 4000);
  }

  closeToast(): void {
    this.toastMessage = null;
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }
}
