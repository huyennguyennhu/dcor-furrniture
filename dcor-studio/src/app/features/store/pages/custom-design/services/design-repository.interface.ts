import { InjectionToken } from '@angular/core';
import { DesignRepository, PlannerDesign } from '../models/planner.model';

export const DESIGN_REPOSITORY = new InjectionToken<DesignRepository>('DESIGN_REPOSITORY');

export class LocalStorageDesignRepository implements DesignRepository {
  private readonly STORAGE_KEY = 'dcor_room_planner_drafts';

  async saveDraft(design: PlannerDesign): Promise<string> {
    const drafts = await this.listDrafts();
    const id = design.id || `draft_${Date.now()}`;
    const updatedDesign: PlannerDesign = {
      ...design,
      id,
      updatedAt: new Date().toISOString(),
      createdAt: design.createdAt || new Date().toISOString()
    };

    const existingIdx = drafts.findIndex(d => d.id === id);
    if (existingIdx >= 0) {
      drafts[existingIdx] = updatedDesign;
    } else {
      drafts.unshift(updatedDesign);
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // Quota exceeded fallback
    }

    return id;
  }

  async loadDraft(id: string): Promise<PlannerDesign | null> {
    const drafts = await this.listDrafts();
    return drafts.find(d => d.id === id) || null;
  }

  async listDrafts(): Promise<PlannerDesign[]> {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as PlannerDesign[];
    } catch {
      return [];
    }
  }

  async deleteDraft(id: string): Promise<boolean> {
    const drafts = await this.listDrafts();
    const filtered = drafts.filter(d => d.id !== id);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }
}
