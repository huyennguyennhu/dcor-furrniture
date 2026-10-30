import { Injectable } from '@angular/core';
import { CategoryItem, INITIAL_CATEGORIES } from '../../features/admin/pages/product-categories/product-categories';

export type { CategoryItem };

export function matchProductRoom(prod: any, roomSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !roomSlug) return false;
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const catSlug = (prod.categoryObj?.slug || '').toLowerCase();
  const parentSlug = (prod.categoryObj?.parent?.slug || '').toLowerCase();
  const name = (prod.name || '').toLowerCase();

  if (roomSlug === 'phong-khach') {
    return parentSlug.includes('sofa') || parentSlug.includes('table') || parentSlug.includes('storage') || 
           parentSlug.includes('rug') || parentSlug.includes('lamp') || name.includes('sofa') || 
           name.includes('coffee') || name.includes('tv') || catSlug.includes('living');
  }
  if (roomSlug === 'phong-an') {
    return catSlug.includes('dining') || catSlug.includes('bar') || name.includes('dining') || 
           name.includes('bar') || parentSlug.includes('chair');
  }
  if (roomSlug === 'phong-ngu') {
    return parentSlug.includes('bed') || catSlug.includes('bed') || catSlug.includes('night-stand') || 
           catSlug.includes('throw') || name.includes('bed') || name.includes('nightstand');
  }
  if (roomSlug === 'phong-lam-viec') {
    return catSlug.includes('desk') || catSlug.includes('office') || name.includes('desk') || name.includes('office');
  }
  if (roomSlug === 'ngoai-troi' || roomSlug === 'ngoai-troi-ban-cong') {
    return parentSlug.includes('outdoor') || catSlug.includes('outdoor') || name.includes('outdoor');
  }
  if (cat?.name) {
    const term = cat.name.toLowerCase();
    return name.includes(term) || (prod.description || '').toLowerCase().includes(term);
  }
  return false;
}

export function matchProductCollection(prod: any, collectionSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !collectionSlug) return false;
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const key = collectionSlug.replace('bo-suu-tap-', '').toLowerCase();
  const name = (prod.name || '').toLowerCase();
  const slug = (prod.slug || '').toLowerCase();
  return name.includes(key) || slug.includes(key);
}

export function matchProductStyle(prod: any, styleSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !styleSlug) return false;
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const text = `${prod.name || ''} ${prod.description || ''} ${prod.category || ''}`.toLowerCase();
  const s = styleSlug.toLowerCase();

  if (s.includes('scandinavian') || s.includes('bac-au')) {
    return text.includes('oak') || text.includes('wool') || text.includes('boucl') || text.includes('fabric') || text.includes('light');
  }
  if (s.includes('modern') || s.includes('hien-dai')) {
    return text.includes('leather') || text.includes('marble') || text.includes('lacquered') || text.includes('steel') || text.includes('dark');
  }
  if (s.includes('minimal') || s.includes('toi-gian')) {
    return text.includes('metal') || text.includes('glass') || text.includes('acrylic') || text.includes('aluminium') || text.includes('gọn');
  }
  if (s.includes('japandi')) {
    return text.includes('oak') || text.includes('wood') || text.includes('ceramic') || text.includes('linen') || text.includes('natural');
  }
  if (s.includes('wabi')) {
    return text.includes('concrete') || text.includes('ceramic') || text.includes('rough') || text.includes('cotton') || text.includes('organic');
  }
  if (s.includes('industrial')) {
    return text.includes('metal') || text.includes('concrete') || text.includes('steel') || text.includes('aluminium');
  }
  if (cat?.name) {
    return text.includes(cat.name.toLowerCase());
  }
  return false;
}

export function matchProductMaterial(prod: any, materialSlug: string, cat?: CategoryItem): boolean {
  if (!prod || !materialSlug) return false;
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.productId);
    if (isLinked) return true;
  }
  const text = `${prod.name || ''} ${prod.description || ''} ${(prod.refinementMaterials || []).join(' ')}`.toLowerCase();
  const m = materialSlug.toLowerCase();

  if (m.includes('leather') || m.includes('da-bo')) {
    return text.includes('leather') || text.includes('da bò') || text.includes('da thật') || text.includes('aniline') || text.includes('nappa');
  }
  if (m.includes('fabric') || m.includes('vai-ni')) {
    return text.includes('fabric') || text.includes('vải') || text.includes('nỉ') || text.includes('boucl') || text.includes('velvet') || text.includes('linen');
  }
  if (m.includes('oak') || m.includes('go-soi')) {
    return text.includes('oak') || text.includes('sồi') || text.includes('gỗ sồi');
  }
  if (m.includes('walnut') || m.includes('go-oc-cho')) {
    return text.includes('walnut') || text.includes('óc chó') || text.includes('gỗ óc chó');
  }
  if (m.includes('ceramic') || m.includes('gom-ceramic')) {
    return text.includes('ceramic') || text.includes('gốm') || text.includes('đá') || text.includes('marble');
  }
  if (cat?.name) {
    return text.includes(cat.name.toLowerCase());
  }
  return false;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryClassificationService {
  private readonly STORAGE_KEY = 'dcor_admin_categories';

  getAdminCategories(): CategoryItem[] {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.warn('Lỗi đọc dcor_admin_categories từ localStorage:', e);
        }
      }
    }
    return INITIAL_CATEGORIES.filter(c => c.type !== 'main');
  }

  saveAdminCategories(categories: CategoryItem[]): void {
    if (typeof localStorage !== 'undefined') {
      const nonMain = categories.filter(c => c.type !== 'main');
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(nonMain));
    }
  }

  getActiveCategoriesByType(type: 'room' | 'collection' | 'style' | 'material'): CategoryItem[] {
    return this.getAdminCategories().filter(c => c.type === type && c.status === 'Hiển thị');
  }

  getRooms(): CategoryItem[] {
    return this.getActiveCategoriesByType('room');
  }

  getCollections(): CategoryItem[] {
    return this.getActiveCategoriesByType('collection');
  }

  getStyles(): CategoryItem[] {
    return this.getActiveCategoriesByType('style');
  }

  getMaterials(): CategoryItem[] {
    return this.getActiveCategoriesByType('material');
  }
}
