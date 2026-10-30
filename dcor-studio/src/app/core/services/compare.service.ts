import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export const COMPARE_STORAGE_KEY = 'dcor_compare_items';

export interface CompareToast {
  message: string;
  type: 'success' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class CompareService {
  private compareSubject = new BehaviorSubject<any[]>(this.getInitialCompareList());
  public compareList$: Observable<any[]> = this.compareSubject.asObservable();

  private modalSubject = new BehaviorSubject<boolean>(false);
  public isCompareModalOpen$: Observable<boolean> = this.modalSubject.asObservable();

  private confirmClearSubject = new BehaviorSubject<boolean>(false);
  public isConfirmClearOpen$: Observable<boolean> = this.confirmClearSubject.asObservable();

  private toastSubject = new Subject<CompareToast>();
  public toast$: Observable<CompareToast> = this.toastSubject.asObservable();

  constructor() {
    if (typeof window !== 'undefined') {
      const updateFromStorage = () => {
        const fresh = this.getInitialCompareList();
        this.compareSubject.next(fresh);
      };
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === COMPARE_STORAGE_KEY) {
          updateFromStorage();
        }
      });
      window.addEventListener('dcor_compare_updated', updateFromStorage);
    }
  }

  private getInitialCompareList(): any[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem(COMPARE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public get currentList(): any[] {
    return this.compareSubject.value;
  }

  public saveToStorage(list: any[]): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        console.error('Lỗi lưu danh sách so sánh:', err);
      }
    }
    this.compareSubject.next(list);

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new Event('dcor_compare_updated'));
      } catch {}
    }
  }

  public showToast(message: string, type: 'success' | 'warning' | 'info' = 'info'): void {
    this.toastSubject.next({ message, type });
  }

  public isInCompare(productId: string): boolean {
    if (!productId) return false;
    const strId = String(productId);
    return this.currentList.some(item => String(item.productId || item.id) === strId);
  }

  public isCompareDisabled(product: any): boolean {
    if (!product || this.currentList.length === 0) return false;
    const pid = String(product.productId || product.id || '');
    if (this.isInCompare(pid)) return false;
    return !this.isSameCategory(this.currentList[0], product);
  }

  public toggle(product: any): { success: boolean; added: boolean; message?: string } {
    if (!product) return { success: false, added: false };
    const pid = String(product.productId || product.id || '');
    const exists = this.isInCompare(pid);

    if (exists) {
      this.remove(pid);
      return { success: true, added: false, message: 'Đã xóa khỏi danh sách so sánh.' };
    }

    if (this.currentList.length >= 5) {
      const msg = 'Tối đa 5 sản phẩm để so sánh.';
      this.showToast(msg, 'warning');
      return { success: false, added: false, message: msg };
    }

    if (this.currentList.length > 0 && !this.isSameCategory(this.currentList[0], product)) {
      const rootName = this.getRootCategoryName(this.currentList[0]);
      const msg = `Chỉ có thể so sánh sản phẩm cùng danh mục chính (${rootName})`;
      this.showToast(msg, 'warning');
      return { success: false, added: false, message: msg };
    }

    const images = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (Array.isArray(product.cardImages) && product.cardImages.length > 0
        ? product.cardImages
        : (Array.isArray(product.galleryImages) && product.galleryImages.length > 0
          ? product.galleryImages
          : (product.image ? [product.image] : [])));

    const itemToSave = {
      ...product,
      id: pid,
      productId: pid,
      name: product.name || product.shortDescription || 'Sản phẩm',
      shortDescription: product.shortDescription || product.name || '',
      category: product.category || product.categoryObj || '',
      categoryId: product.categoryId || '',
      basePrice: product.basePrice ?? (product.prices?.[0]?.price ?? 0),
      images: images,
      image: images[0] || product.image || '',
      variants: product.variants || []
    };

    const nextList = [...this.currentList, itemToSave];
    this.saveToStorage(nextList);
    this.showToast(`Đã thêm vào so sánh (${nextList.length}/5 sản phẩm).`, 'success');
    return { success: true, added: true };
  }

  public remove(productId: string): void {
    if (!productId) return;
    const strId = String(productId);
    const nextList = this.currentList.filter(item => String(item.productId || item.id) !== strId);
    this.saveToStorage(nextList);
    if (nextList.length <= 1) {
      this.closeModal();
    }
    this.showToast('Đã xóa sản phẩm khỏi danh sách so sánh.', 'info');
  }

  public clear(): void {
    this.saveToStorage([]);
    this.closeModal();
    this.closeConfirmClear();
    this.showToast('Đã xóa toàn bộ sản phẩm đang so sánh.', 'info');
  }

  public openModal(): void {
    if (this.currentList.length < 2) {
      this.showToast('Vui lòng chọn tối thiểu 2 sản phẩm để so sánh!', 'info');
      return;
    }
    this.modalSubject.next(true);
  }

  public closeModal(): void {
    this.modalSubject.next(false);
  }

  public openConfirmClear(): void {
    if (this.currentList.length === 0) return;
    this.confirmClearSubject.next(true);
  }

  public closeConfirmClear(): void {
    this.confirmClearSubject.next(false);
  }

  public copyShareLink(): void {
    if (typeof window === 'undefined') return;
    const ids = this.currentList.map(p => p.productId || p.id).filter(Boolean);
    const shareUrl = `${window.location.origin}/explore?compare=${ids.join(',')}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Đã sao chép liên kết so sánh!', 'success');
      }).catch(() => {
        this.fallbackCopyText(shareUrl);
      });
    } else {
      this.fallbackCopyText(shareUrl);
    }
  }

  private fallbackCopyText(text: string) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showToast('Đã sao chép liên kết so sánh!', 'success');
    } catch {
      this.showToast('Không thể sao chép liên kết.', 'warning');
    }
  }

  public getProductMainCategoryKey(prod: any): string {
    if (!prod) return 'accessories';
    const catName = (prod.category?.name || prod.categoryName || (typeof prod.category === 'string' ? prod.category : '') || '').toLowerCase();
    const catSlug = (prod.category?.slug || '').toLowerCase();
    const parentName = (prod.category?.parent?.name || '').toLowerCase();
    const parentSlug = (prod.category?.parent?.slug || '').toLowerCase();
    const name = (prod.name || prod.shortDescription || '').toLowerCase();

    if (parentName.includes('sofa') || parentSlug.includes('sofa') || catName.includes('sofa') || catSlug.includes('sofa') || name.includes('sofa')) return 'sofas';
    if (parentName.includes('chair') || parentSlug.includes('chair') || catName.includes('chair') || catSlug.includes('chair') || name.includes('chair') || name.includes('ghế')) return 'chairs';
    if (parentName.includes('table') || parentSlug.includes('table') || catName.includes('table') || catSlug.includes('table') || name.includes('table') || name.includes('bàn')) return 'tables';
    if (parentName.includes('storage') || parentSlug.includes('storage') || catName.includes('storage') || catSlug.includes('storage') || parentName.includes('tủ') || catName.includes('tủ') || name.includes('tủ') || name.includes('kệ') || name.includes('cabinet') || name.includes('shelf')) return 'storage';
    if (parentName.includes('bed') || parentSlug.includes('bed') || catName.includes('bed') || catSlug.includes('bed') || name.includes('bed') || name.includes('giường')) return 'beds';
    if (parentName.includes('rug') || parentSlug.includes('rug') || catName.includes('rug') || catSlug.includes('rug') || name.includes('rug') || name.includes('thảm') || name.includes('carpet')) return 'rugs';
    if (parentName.includes('lamp') || parentSlug.includes('lamp') || catName.includes('lamp') || catSlug.includes('lamp') || name.includes('lamp') || name.includes('pendant') || name.includes('light') || name.includes('đèn')) return 'lamps';
    if (parentName.includes('outdoor') || parentSlug.includes('outdoor') || catName.includes('outdoor') || catSlug.includes('outdoor') || name.includes('outdoor')) return 'outdoor';
    return 'accessories';
  }

  public getRootCategoryName(prod: any): string {
    const key = this.getProductMainCategoryKey(prod);
    const map: Record<string, string> = {
      sofas: 'Sofas',
      chairs: 'Chairs',
      tables: 'Tables',
      storage: 'Storage',
      beds: 'Beds',
      rugs: 'Rugs',
      lamps: 'Lamps',
      outdoor: 'Outdoor',
      accessories: 'Phụ kiện'
    };
    return map[key] || 'Sản phẩm';
  }

  public isSameCategory(prodA: any, prodB: any): boolean {
    if (!prodA || !prodB) return false;
    const idA = prodA.productId || prodA.id;
    const idB = prodB.productId || prodB.id;
    if (idA && idB && String(idA) === String(idB)) return true;
    return this.getProductMainCategoryKey(prodA) === this.getProductMainCategoryKey(prodB);
  }
}
