import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
// Trigger Angular dev server re-bundle
import { IconComponent } from '../../../../shared/components/icon/icon';
import { 
  BlogService, 
  BlogArticle, 
  BlogCategory, 
  MarketingBanner, 
  SimpleProduct 
} from '../../../../core/services/blog.service';

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './content.html',
  styleUrls: ['./content.css']
})
export class ContentComponent implements OnInit, OnDestroy {
  // Navigation Tabs
  currentTab: 'articles' | 'categories' | 'banners' = 'articles';

  // Subscriptions
  private subs = new Subscription();

  // Data Collections
  articles: BlogArticle[] = [];
  categories: BlogCategory[] = [];
  banners: MarketingBanner[] = [];
  availableProducts: SimpleProduct[] = [];

  // Filter & Search
  searchQuery = '';
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';
  sortBy = 'newest';

  // Selection for Bulk Actions
  selectedArticleIds = new Set<string>();

  // Pagination
  currentPage = 1;
  pageSize = 7;

  // Article Editor Modal & WYSIWYG
  @ViewChild('editorContent') editorContentRef?: ElementRef<HTMLDivElement>;
  isEditorOpen = false;
  editorMode: 'create' | 'edit' = 'create';
  editorActiveTab: 'write' | 'code' | 'preview' = 'write';
  selectedFontSize = '';

  // Cover Image Source Mode
  coverSourceMode: 'upload' | 'url' = 'upload';

  // Insert Media Modals
  isInsertImageModalOpen = false;
  imageInsertForm = { mode: 'upload' as 'upload' | 'url', url: '', caption: '', previewUrl: '' };

  isInsertVideoModalOpen = false;
  videoInsertForm = { mode: 'embed' as 'embed' | 'upload', urlOrCode: '', videoFileUrl: '' };

  isInsertLinkModalOpen = false;
  linkInsertForm = { url: 'https://', text: '' };

  // Article Form State
  articleForm: {
    id?: string;
    title: string;
    slug: string;
    coverImage: string;
    categoryId: string;
    categoryName: string;
    author: string;
    authorAvatar: string;
    status: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
    scheduledAt: string;
    publishedAt?: string;
    excerpt: string;
    content: string;
    tags: string[];
    newTagInput: string;
    seoTitle: string;
    seoDescription: string;
    relatedProductIds: string[];
  } = this.getEmptyArticleForm();

  // Delete Confirmation Modal State
  isDeleteConfirmOpen = false;
  articleToDelete: BlogArticle | null = null;

  // Related Products Search State
  productSearchQuery = '';
  showProductSearchResults = false;

  // Quick Article Preview Modal
  isPreviewOpen = false;
  previewArticle: BlogArticle | null = null;

  // Category Modal State
  isCategoryModalOpen = false;
  categoryForm: {
    id?: string;
    name: string;
    slug: string;
    description: string;
    status: 'ACTIVE' | 'HIDDEN';
    sortOrder: number;
  } = { name: '', slug: '', description: '', status: 'ACTIVE', sortOrder: 1 };

  // Banner Modal State
  isBannerModalOpen = false;
  bannerForm: {
    id?: string;
    title: string;
    position: 'HOME_HERO' | 'BLOG_SIDEBAR' | 'COLLECTION_BANNER';
    imageUrl: string;
    linkUrl: string;
    status: 'ACTIVE' | 'INACTIVE';
    startDate?: string;
    endDate?: string;
  } = { title: '', position: 'HOME_HERO', imageUrl: '', linkUrl: '', status: 'ACTIVE' };

  // Toast Notification
  toastMessage = '';
  toastType: 'success' | 'info' | 'error' = 'success';
  private toastTimeout: any;

  // Preset cover images for quick selection
  presetCovers = [
    '/assets/img/furniture-placeholder.svg',
    '/assets/img/furniture-placeholder.svg',
    '/assets/img/furniture-placeholder.svg',
    '/assets/img/furniture-placeholder.svg',
    '/assets/img/furniture-placeholder.svg'
  ];

  constructor(public blogService: BlogService) {}

  ngOnInit(): void {
    // 1. Subscribe to articles
    this.subs.add(
      this.blogService.articles$.subscribe(items => {
        this.articles = items;
      })
    );

    // 2. Subscribe to categories
    this.subs.add(
      this.blogService.categories$.subscribe(items => {
        this.categories = items;
      })
    );

    // 3. Subscribe to banners
    this.subs.add(
      this.blogService.banners$.subscribe(items => {
        this.banners = items;
      })
    );

    // 4. Subscribe to products
    this.subs.add(
      this.blogService.products$.subscribe(prods => {
        if (prods && prods.length > 0) {
          this.availableProducts = prods;
        }
      })
    );

    // Initial load
    this.availableProducts = this.blogService.getProducts();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  async loadProducts(): Promise<void> {
    this.availableProducts = await this.blogService.fetchAvailableProducts();
  }

  // ==========================================
  // STATS GETTERS
  // ==========================================

  get totalArticles(): number {
    return this.articles.length;
  }

  get publishedCount(): number {
    return this.articles.filter(a => a.status === 'PUBLISHED').length;
  }

  get draftCount(): number {
    return this.articles.filter(a => a.status === 'DRAFT').length;
  }

  get hiddenCount(): number {
    return this.articles.filter(a => a.status === 'HIDDEN').length;
  }

  get totalViews(): number {
    return this.articles.reduce((acc, cur) => acc + (cur.views || 0), 0);
  }

  // ==========================================
  // ARTICLES FILTER & PAGINATION
  // ==========================================

  get filteredArticles(): BlogArticle[] {
    let result = [...this.articles];

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.author.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (this.selectedCategory !== 'ALL') {
      result = result.filter(a => a.categoryId === this.selectedCategory);
    }

    // Status filter
    if (this.selectedStatus !== 'ALL') {
      result = result.filter(a => a.status === this.selectedStatus);
    }

    // Sorting
    if (this.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (this.sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (this.sortBy === 'views') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (this.sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }

  get paginatedArticles(): BlogArticle[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredArticles.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredArticles.length / this.pageSize) || 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = 'ALL';
    this.selectedStatus = 'ALL';
    this.sortBy = 'newest';
    this.currentPage = 1;
  }

  // ==========================================
  // ARTICLE ACTIONS (FR8-A-01)
  // ==========================================

  openNewArticleModal(): void {
    this.editorMode = 'create';
    this.articleForm = this.getEmptyArticleForm();
    if (this.categories.length > 0) {
      this.articleForm.categoryId = this.categories[0].id;
      this.articleForm.categoryName = this.categories[0].name;
    }
    this.coverSourceMode = 'upload';
    this.editorActiveTab = 'write';
    this.isEditorOpen = true;
    setTimeout(() => this.syncToEditor(), 60);
  }

  openEditArticleModal(art: BlogArticle): void {
    this.editorMode = 'edit';
    this.articleForm = {
      id: art.id,
      title: art.title,
      slug: art.slug,
      coverImage: art.coverImage,
      categoryId: art.categoryId,
      categoryName: art.categoryName,
      author: art.author,
      authorAvatar: art.authorAvatar || '',
      status: art.status,
      scheduledAt: art.scheduledAt ? art.scheduledAt.slice(0, 16) : '',
      publishedAt: art.publishedAt,
      excerpt: art.excerpt,
      content: art.content,
      tags: [...(art.tags || [])],
      newTagInput: '',
      seoTitle: art.seoTitle || art.title,
      seoDescription: art.seoDescription || art.excerpt,
      relatedProductIds: [...(art.relatedProductIds || [])]
    };
    this.coverSourceMode = this.articleForm.coverImage.startsWith('data:') ? 'upload' : 'url';
    this.editorActiveTab = 'write';
    this.isEditorOpen = true;
    setTimeout(() => this.syncToEditor(), 60);
  }

  saveArticle(): void {
    if (this.editorActiveTab === 'write') {
      this.syncFromEditor();
    }

    if (!this.articleForm.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết!');
      return;
    }

    // Match category name
    const foundCat = this.categories.find(c => c.id === this.articleForm.categoryId);
    const catName = foundCat ? foundCat.name : this.articleForm.categoryName;

    // Build payload
    const payload: Partial<BlogArticle> = {
      id: this.articleForm.id,
      title: this.articleForm.title.trim(),
      slug: this.articleForm.slug.trim() || this.blogService.generateSlug(this.articleForm.title),
      coverImage: this.articleForm.coverImage.trim() || this.presetCovers[0],
      categoryId: this.articleForm.categoryId,
      categoryName: catName,
      author: this.articleForm.author.trim() || 'DCor Studio',
      authorAvatar: this.articleForm.authorAvatar.trim() || '/assets/favicon/logo.png',
      status: this.articleForm.status,
      publishedAt: this.articleForm.status === 'PUBLISHED' ? (this.articleForm.publishedAt || new Date().toISOString()) : undefined,
      excerpt: this.articleForm.excerpt.trim(),
      content: this.articleForm.content.trim(),
      tags: this.articleForm.tags,
      seoTitle: this.articleForm.seoTitle.trim() || this.articleForm.title.trim(),
      seoDescription: this.articleForm.seoDescription.trim() || this.articleForm.excerpt.trim(),
      relatedProductIds: this.articleForm.relatedProductIds
    };

    this.blogService.saveArticle(payload);
    this.isEditorOpen = false;

    let msg = 'Đã cập nhật bài viết thành công!';
    if (this.articleForm.status === 'DRAFT') {
      msg = 'Đã lưu bài viết ở trạng thái Bản nháp!';
    } else if (this.editorMode === 'create' && this.articleForm.status === 'PUBLISHED') {
      msg = 'Đã đăng bài viết thành công!';
    }
    this.showToast(msg, 'success');
  }

  saveArticleAsDraft(): void {
    this.articleForm.status = 'DRAFT';
    this.saveArticle();
  }

  publishOrUpdateArticle(): void {
    if (this.articleForm.status === 'DRAFT') {
      this.articleForm.status = 'PUBLISHED';
    }
    if (this.articleForm.status === 'PUBLISHED' && !this.articleForm.publishedAt) {
      this.articleForm.publishedAt = new Date().toISOString();
    }
    this.saveArticle();
  }

  requestDeleteCurrentArticle(): void {
    if (!this.articleForm.id) return;
    this.articleToDelete = this.articles.find(a => a.id === this.articleForm.id) || null;
    this.isDeleteConfirmOpen = true;
  }

  confirmDeleteArticle(art: BlogArticle): void {
    this.articleToDelete = art;
    this.isDeleteConfirmOpen = true;
  }

  executeDeleteArticle(): void {
    const id = this.articleToDelete?.id || this.articleForm.id;
    if (id) {
      this.blogService.deleteArticle(id);
      this.selectedArticleIds.delete(id);
      this.showToast('Đã xóa bài viết thành công!', 'info');
    }
    this.isDeleteConfirmOpen = false;
    this.isEditorOpen = false;
    this.articleToDelete = null;
  }

  deleteArticle(art: BlogArticle): void {
    this.confirmDeleteArticle(art);
  }

  toggleArticleVisibility(art: BlogArticle): void {
    const updated = this.blogService.toggleArticleStatus(art.id);
    if (updated) {
      const msg = updated.status === 'PUBLISHED' ? 'Đã chuyển bài viết sang trạng thái HIỆN!' : 'Đã ẨN bài viết khỏi website!';
      this.showToast(msg, 'success');
    }
  }

  // ==========================================
  // BULK ACTIONS
  // ==========================================

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.paginatedArticles.forEach(a => this.selectedArticleIds.add(a.id));
    } else {
      this.selectedArticleIds.clear();
    }
  }

  toggleSelectArticle(id: string): void {
    if (this.selectedArticleIds.has(id)) {
      this.selectedArticleIds.delete(id);
    } else {
      this.selectedArticleIds.add(id);
    }
  }

  isArticleSelected(id: string): boolean {
    return this.selectedArticleIds.has(id);
  }

  isAllCurrentPageSelected(): boolean {
    return this.paginatedArticles.length > 0 && this.paginatedArticles.every(a => this.selectedArticleIds.has(a.id));
  }

  bulkSetStatus(status: 'PUBLISHED' | 'HIDDEN'): void {
    const ids = Array.from(this.selectedArticleIds);
    if (ids.length === 0) return;

    this.blogService.bulkUpdateStatus(ids, status);
    this.selectedArticleIds.clear();
    this.showToast(`Đã chuyển trạng thái ${ids.length} bài viết thành ${status === 'PUBLISHED' ? 'HIỆN' : 'ẨN'}!`, 'success');
  }

  bulkDelete(): void {
    const ids = Array.from(this.selectedArticleIds);
    if (ids.length === 0) return;

    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn ${ids.length} bài viết đã chọn?`)) {
      this.blogService.bulkDelete(ids);
      this.selectedArticleIds.clear();
      this.showToast(`Đã xóa thành công ${ids.length} bài viết!`, 'info');
    }
  }

  // ==========================================
  // EDITOR HELPERS: SLUG & RICH TEXT
  // ==========================================

  onTitleChange(): void {
    if (this.editorMode === 'create' || !this.articleForm.slug) {
      this.articleForm.slug = this.blogService.generateSlug(this.articleForm.title);
    }
    if (!this.articleForm.seoTitle) {
      this.articleForm.seoTitle = this.articleForm.title;
    }
  }

  regenerateSlug(): void {
    if (this.articleForm.title) {
      this.articleForm.slug = this.blogService.generateSlug(this.articleForm.title);
    }
  }

  setCoverImage(url: string): void {
    this.articleForm.coverImage = url;
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.articleForm.coverImage = e.target.result;
        this.showToast('Đã tải ảnh bìa thành công!', 'info');
      };
      reader.readAsDataURL(file);
    }
  }

  clearCoverImage(): void {
    this.articleForm.coverImage = '';
  }

  // ==========================================
  // WYSIWYG EDITOR LOGIC & SYNC
  // ==========================================

  setEditorActiveTab(tab: 'write' | 'code' | 'preview'): void {
    if (this.editorActiveTab === 'write' && tab !== 'write') {
      this.syncFromEditor();
    }
    this.editorActiveTab = tab;
    if (tab === 'write') {
      setTimeout(() => this.syncToEditor(), 40);
    }
  }

  syncToEditor(): void {
    if (this.editorContentRef?.nativeElement) {
      this.editorContentRef.nativeElement.innerHTML = this.articleForm.content || '<p><br></p>';
    }
  }

  syncFromEditor(): void {
    if (this.editorContentRef?.nativeElement) {
      this.articleForm.content = this.editorContentRef.nativeElement.innerHTML;
    }
  }

  onEditorInput(): void {
    if (this.editorContentRef?.nativeElement) {
      this.articleForm.content = this.editorContentRef.nativeElement.innerHTML;
    }
  }

  ensureEditorFocused(): void {
    if (this.editorContentRef?.nativeElement) {
      this.editorContentRef.nativeElement.focus();
    }
  }

  formatDoc(cmd: string, val: string | undefined = undefined): void {
    this.ensureEditorFocused();
    document.execCommand(cmd, false, val);
    this.onEditorInput();
  }

  formatBlock(tag: string): void {
    this.ensureEditorFocused();
    document.execCommand('formatBlock', false, `<${tag}>`);
    this.onEditorInput();
  }

  applyFontSize(size: string): void {
    if (!size) return;
    this.ensureEditorFocused();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } else {
      document.execCommand('fontSize', false, '7');
      const fontEls = this.editorContentRef?.nativeElement.getElementsByTagName('font');
      if (fontEls) {
        for (let i = 0; i < fontEls.length; i++) {
          const font = fontEls[i];
          if (font.getAttribute('size') === '7') {
            font.removeAttribute('size');
            font.style.fontSize = size;
          }
        }
      }
    }
    this.onEditorInput();
    this.selectedFontSize = '';
  }

  insertHtmlAtCursor(html: string): void {
    this.ensureEditorFocused();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node: Node | null;
      let lastNode: Node | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        const newRange = range.cloneRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else if (this.editorContentRef?.nativeElement) {
      this.editorContentRef.nativeElement.innerHTML += html;
    }
    this.onEditorInput();
  }

  // ==========================================
  // MEDIA INSERTION MODALS (ẢNH, VIDEO, LINK)
  // ==========================================

  openInsertImageModal(): void {
    this.imageInsertForm = { mode: 'upload', url: '', caption: '', previewUrl: '' };
    this.isInsertImageModalOpen = true;
  }

  closeInsertImageModal(): void {
    this.isInsertImageModalOpen = false;
  }

  onArticleImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageInsertForm.url = e.target.result;
        this.imageInsertForm.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  confirmInsertImage(): void {
    const imgUrl = this.imageInsertForm.url.trim();
    if (!imgUrl) {
      alert('Vui lòng chọn ảnh từ máy hoặc nhập đường dẫn ảnh URL!');
      return;
    }
    const cap = this.imageInsertForm.caption.trim();
    const html = `
      <figure class="article-embed-figure" style="margin: 20px 0; text-align: center;">
        <img src="${imgUrl}" alt="${cap}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,0.08);" />
        ${cap ? `<figcaption style="text-align: center; font-size: 13px; color: #71717a; margin-top: 8px; font-style: italic;">${cap}</figcaption>` : ''}
      </figure>
      <p><br></p>
    `;
    this.insertHtmlAtCursor(html);
    this.closeInsertImageModal();
  }

  openInsertVideoModal(): void {
    this.videoInsertForm = { mode: 'embed', urlOrCode: '', videoFileUrl: '' };
    this.isInsertVideoModalOpen = true;
  }

  closeInsertVideoModal(): void {
    this.isInsertVideoModalOpen = false;
  }

  onArticleVideoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.videoInsertForm.videoFileUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  confirmInsertVideo(): void {
    if (this.videoInsertForm.mode === 'embed') {
      const raw = this.videoInsertForm.urlOrCode.trim();
      if (!raw) {
        alert('Vui lòng nhập đường link Video YouTube hoặc mã nhúng Iframe!');
        return;
      }
      let iframeHtml = raw;
      const ytMatch = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        iframeHtml = `<iframe width="100%" height="380" src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>`;
      } else if (!raw.includes('<iframe')) {
        iframeHtml = `<iframe width="100%" height="380" src="${raw}" frameborder="0" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"></iframe>`;
      }
      const html = `
        <div class="article-embed-video" style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; margin: 20px 0; border-radius: 8px; overflow: hidden; background: #000; box-shadow: 0 4px 14px rgba(0,0,0,0.12);">
          ${iframeHtml}
        </div>
        <p><br></p>
      `;
      this.insertHtmlAtCursor(html);
    } else {
      const vUrl = this.videoInsertForm.videoFileUrl;
      if (!vUrl) {
        alert('Vui lòng chọn tệp video từ máy tính!');
        return;
      }
      const html = `
        <div style="margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.1); background: #000;">
          <video controls src="${vUrl}" style="width: 100%; max-height: 480px; display: block; border-radius: 8px;"></video>
        </div>
        <p><br></p>
      `;
      this.insertHtmlAtCursor(html);
    }
    this.closeInsertVideoModal();
  }

  openInsertLinkModal(): void {
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString().trim() : '';
    this.linkInsertForm = { url: 'https://', text: selectedText };
    this.isInsertLinkModalOpen = true;
  }

  closeInsertLinkModal(): void {
    this.isInsertLinkModalOpen = false;
  }

  confirmInsertLink(): void {
    const url = this.linkInsertForm.url.trim();
    if (!url || url === 'https://') {
      alert('Vui lòng nhập địa chỉ liên kết URL hợp lệ!');
      return;
    }
    const text = this.linkInsertForm.text.trim() || url;
    const html = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #BC5F13; text-decoration: underline; font-weight: 500;">${text}</a>`;
    this.insertHtmlAtCursor(html);
    this.closeInsertLinkModal();
  }

  // ==========================================
  // HASHTAGS HANDLING
  // ==========================================

  addTagFromInput(): void {
    const raw = this.articleForm.newTagInput.trim().replace(/^#/, '');
    if (raw && !this.articleForm.tags.includes(raw)) {
      this.articleForm.tags.push(raw);
    }
    this.articleForm.newTagInput = '';
  }

  removeTag(index: number): void {
    this.articleForm.tags.splice(index, 1);
  }

  // ==========================================
  // RELATED PRODUCTS (FR8-A-02) - TÌM THEO TÊN / SKU
  // ==========================================

  get productSearchResults(): SimpleProduct[] {
    const q = (this.productSearchQuery || '').toLowerCase().trim();
    if (!q) {
      // Return unselected available products (up to 8) for immediate selection
      return this.availableProducts
        .filter(p => !this.articleForm.relatedProductIds.includes(p.id))
        .slice(0, 8);
    }
    return this.availableProducts.filter(p => {
      if (this.articleForm.relatedProductIds.includes(p.id)) return false;
      const matchName = p.name ? p.name.toLowerCase().includes(q) : false;
      const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
      const matchCat = p.categoryName ? p.categoryName.toLowerCase().includes(q) : false;
      return matchName || matchSku || matchCat;
    });
  }

  addRelatedProduct(p: SimpleProduct): void {
    if (!this.articleForm.relatedProductIds.includes(p.id)) {
      this.articleForm.relatedProductIds.push(p.id);
      this.showToast(`Đã gán "${p.name}" vào bài viết`, 'success');
    }
    this.productSearchQuery = '';
    this.showProductSearchResults = false;
  }

  removeRelatedProduct(productId: string): void {
    this.articleForm.relatedProductIds = this.articleForm.relatedProductIds.filter(id => id !== productId);
  }

  moveProductUp(index: number): void {
    if (index > 0) {
      const arr = this.articleForm.relatedProductIds;
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
    }
  }

  moveProductDown(index: number): void {
    const arr = this.articleForm.relatedProductIds;
    if (index < arr.length - 1) {
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
    }
  }

  getAssociatedProducts(ids: string[]): SimpleProduct[] {
    const list = this.availableProducts.length > 0 ? this.availableProducts : this.blogService.getProducts();
    if (!ids || ids.length === 0) return [];
    const matched = ids
      .map(id => list.find(p => p.id === id))
      .filter((p): p is SimpleProduct => !!p);
    return matched.length > 0 ? matched : list.slice(0, 3);
  }

  // ==========================================
  // QUICK PREVIEW MODAL
  // ==========================================

  openPreview(art: BlogArticle): void {
    this.previewArticle = art;
    this.isPreviewOpen = true;
  }

  closePreview(): void {
    this.isPreviewOpen = false;
    this.previewArticle = null;
  }

  // ==========================================
  // CATEGORIES MANAGEMENT (THÊM / SỬA / ẨN / XÓA)
  // ==========================================

  openCategoryModal(cat?: BlogCategory): void {
    if (cat) {
      this.categoryForm = {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        status: cat.status,
        sortOrder: cat.sortOrder
      };
    } else {
      this.categoryForm = {
        name: '',
        slug: '',
        description: '',
        status: 'ACTIVE',
        sortOrder: this.categories.length + 1
      };
    }
    this.isCategoryModalOpen = true;
  }

  onCategoryNameChange(): void {
    if (!this.categoryForm.id || !this.categoryForm.slug) {
      this.categoryForm.slug = this.blogService.generateSlug(this.categoryForm.name);
    }
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) {
      alert('Vui lòng nhập tên chuyên mục!');
      return;
    }

    this.blogService.saveCategory({
      id: this.categoryForm.id,
      name: this.categoryForm.name.trim(),
      slug: this.categoryForm.slug.trim() || this.blogService.generateSlug(this.categoryForm.name),
      description: this.categoryForm.description.trim(),
      status: this.categoryForm.status,
      sortOrder: Number(this.categoryForm.sortOrder) || 1
    });

    this.isCategoryModalOpen = false;
    this.showToast(this.categoryForm.id ? 'Đã cập nhật chuyên mục!' : 'Đã thêm chuyên mục mới!', 'success');
  }

  toggleCategoryStatus(cat: BlogCategory): void {
    this.blogService.toggleCategoryStatus(cat.id);
    this.showToast(`Đã đổi trạng thái chuyên mục "${cat.name}"!`, 'success');
  }

  deleteCategory(cat: BlogCategory): void {
    if (cat.articleCount > 0) {
      alert(`Không thể xóa chuyên mục "${cat.name}" vì đang có ${cat.articleCount} bài viết trực thuộc. Hãy chuyển bài viết sang chuyên mục khác trước!`);
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa chuyên mục "${cat.name}"?`)) {
      this.blogService.deleteCategory(cat.id);
      this.showToast('Đã xóa chuyên mục thành công!', 'info');
    }
  }

  // ==========================================
  // MARKETING BANNERS MANAGEMENT
  // ==========================================

  openBannerModal(b?: MarketingBanner): void {
    if (b) {
      this.bannerForm = {
        id: b.id,
        title: b.title,
        position: b.position,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        status: b.status,
        startDate: b.startDate,
        endDate: b.endDate
      };
    } else {
      this.bannerForm = {
        title: '',
        position: 'HOME_HERO',
        imageUrl: '/assets/img/furniture-placeholder.svg',
        linkUrl: '/explore',
        status: 'ACTIVE'
      };
    }
    this.isBannerModalOpen = true;
  }

  saveBanner(): void {
    if (!this.bannerForm.title.trim() || !this.bannerForm.imageUrl.trim()) {
      alert('Vui lòng nhập tiêu đề và URL hình ảnh banner!');
      return;
    }

    this.blogService.saveBanner({
      id: this.bannerForm.id,
      title: this.bannerForm.title.trim(),
      position: this.bannerForm.position,
      imageUrl: this.bannerForm.imageUrl.trim(),
      linkUrl: this.bannerForm.linkUrl.trim() || '/explore',
      status: this.bannerForm.status,
      startDate: this.bannerForm.startDate,
      endDate: this.bannerForm.endDate
    });

    this.isBannerModalOpen = false;
    this.showToast(this.bannerForm.id ? 'Đã cập nhật banner!' : 'Đã thêm banner mới!', 'success');
  }

  toggleBannerStatus(b: MarketingBanner): void {
    this.blogService.toggleBannerStatus(b.id);
    this.showToast(`Đã cập nhật trạng thái banner "${b.title}"!`, 'success');
  }

  deleteBanner(b: MarketingBanner): void {
    if (confirm(`Bạn có chắc chắn muốn xóa banner "${b.title}"?`)) {
      this.blogService.deleteBanner(b.id);
      this.showToast('Đã xóa banner thành công!', 'info');
    }
  }

  // ==========================================
  // HELPERS & TOAST
  // ==========================================

  showToast(msg: string, type: 'success' | 'info' | 'error' = 'success'): void {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
    }, 3500);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
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

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  private getEmptyArticleForm() {
    return {
      title: '',
      slug: '',
      coverImage: '/assets/img/furniture-placeholder.svg',
      categoryId: '',
      categoryName: '',
      author: 'Ban biên tập DCor',
      authorAvatar: '/assets/favicon/logo.png',
      status: 'DRAFT' as const,
      scheduledAt: '',
      excerpt: '',
      content: '',
      tags: ['NoiThatLuxury', 'DCor2026'],
      newTagInput: '',
      seoTitle: '',
      seoDescription: '',
      relatedProductIds: [] as string[]
    };
  }
}
