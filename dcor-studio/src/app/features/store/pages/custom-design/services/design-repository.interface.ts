import { InjectionToken } from '@angular/core';
import { DesignRepository, PlannerDesign } from '../models/planner.model';

export const DESIGN_REPOSITORY = new InjectionToken<DesignRepository>('DESIGN_REPOSITORY');

/**
 * Ghi chú kiến trúc: Hiện tại lưu thiết kế trên IndexedDB cục bộ của trình duyệt này
 * do backend chưa có bảng lưu thiết kế theo tài khoản khách hàng.
 * Sau này khi backend bổ sung bảng và API lưu theo tài khoản, chỉ cần thay thế implementation
 * của DESIGN_REPOSITORY sang HttpDesignRepository mà không làm vỡ các component.
 */
export class IndexedDbDesignRepository implements DesignRepository {
  private readonly DB_NAME = 'dcor_room_planner_db';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'drafts';
  private readonly FALLBACK_STORAGE_KEY = 'dcor_room_planner_drafts';

  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB không được hỗ trợ trong môi trường này.'));
        return;
      }

      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  async saveDraft(design: PlannerDesign): Promise<string> {
    const id = design.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const updatedDesign: PlannerDesign = {
      ...design,
      id,
      createdAt: design.createdAt || now,
      updatedAt: now
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.put(updatedDesign);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return id;
    } catch {
      // Fallback lưu LocalStorage nếu IndexedDB bị hạn chế
      return this.fallbackSave(updatedDesign);
    }
  }

  async loadDraft(id: string): Promise<PlannerDesign | null> {
    try {
      const db = await this.getDB();
      return new Promise<PlannerDesign | null>((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallbackLoad(id);
    }
  }

  async listDrafts(): Promise<PlannerDesign[]> {
    try {
      const db = await this.getDB();
      return new Promise<PlannerDesign[]>((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result || []) as PlannerDesign[];
          list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.fallbackList();
    }
  }

  async renameDraft(id: string, newTitle: string): Promise<boolean> {
    const draft = await this.loadDraft(id);
    if (!draft) return false;
    draft.title = newTitle.trim();
    draft.updatedAt = new Date().toISOString();
    await this.saveDraft(draft);
    return true;
  }

  async deleteDraft(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return true;
    } catch {
      return this.fallbackDelete(id);
    }
  }

  // --- LOCALSTORAGE FALLBACKS ---
  private fallbackSave(design: PlannerDesign): string {
    const list = this.fallbackList();
    const idx = list.findIndex(d => d.id === design.id);
    if (idx >= 0) {
      list[idx] = design;
    } else {
      list.unshift(design);
    }
    try {
      localStorage.setItem(this.FALLBACK_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignored
    }
    return design.id!;
  }

  private fallbackLoad(id: string): PlannerDesign | null {
    const list = this.fallbackList();
    return list.find(d => d.id === id) || null;
  }

  private fallbackList(): PlannerDesign[] {
    try {
      const raw = localStorage.getItem(this.FALLBACK_STORAGE_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw) as PlannerDesign[];
      return list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    } catch {
      return [];
    }
  }

  private fallbackDelete(id: string): boolean {
    const list = this.fallbackList().filter(d => d.id !== id);
    try {
      localStorage.setItem(this.FALLBACK_STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }
}
