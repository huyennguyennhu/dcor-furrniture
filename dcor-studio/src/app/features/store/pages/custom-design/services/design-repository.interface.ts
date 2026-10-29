import { InjectionToken, inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DesignRepository, PlannerDesign, PlannerBackground } from '../models/planner.model';
import { MyDesignApiService } from './my-design-api.service';

export const DESIGN_REPOSITORY = new InjectionToken<DesignRepository>('DESIGN_REPOSITORY');

/**
 * Kho lưu trữ thiết kế trực tiếp kết nối với Backend API PostgreSQL
 * Không sử dụng bất kỳ bộ nhớ cục bộ (LocalStorage/IndexedDB) nào.
 */
@Injectable()
export class HttpDesignRepository implements DesignRepository {
  private api = inject(MyDesignApiService);

  async saveDraft(design: PlannerDesign): Promise<string> {
    const bg = design.background;
    const dims = design.dimensions;
    const isUpload = bg.type === 'upload';

    if (design.id) {
      // Cập nhật bản nháp đã có
      await firstValueFrom(
        this.api.updateDesign(design.id, {
          title: design.title,
          roomLength: dims.length,
          roomWidth: dims.width,
          roomHeight: dims.height || null,
          layout: design.objects || [],
          coverImageUrl: design.thumbnailUrl || null
        })
      );
      return design.id;
    } else {
      // Tạo bản nháp mới
      const created = await firstValueFrom(
        this.api.createDraft({
          title: design.title || 'Thiết kế phòng khách',
          backgroundType: isUpload ? 'UPLOAD' : 'TEMPLATE',
          backgroundUrl: bg.imageUrl,
          templateId: bg.templateId || null,
          roomLength: dims.length,
          roomWidth: dims.width,
          roomHeight: dims.height || null,
          layout: design.objects || [],
          coverImageUrl: design.thumbnailUrl || null
        })
      );
      return created.id;
    }
  }

  async loadDraft(id: string): Promise<PlannerDesign | null> {
    try {
      const data = await firstValueFrom(this.api.getDesign(id));
      const background: PlannerBackground = {
        type: data.backgroundType === 'UPLOAD' ? 'upload' : 'template',
        name: data.title || 'Phòng thiết kế',
        imageUrl: data.backgroundUrl,
        naturalWidth: 1200,
        naturalHeight: 800,
        templateId: data.templateId || undefined
      };

      return {
        id: data.id,
        title: data.title,
        background,
        dimensions: {
          length: data.roomLength,
          width: data.roomWidth,
          height: data.roomHeight || 2.8
        },
        objects: data.layout || [],
        thumbnailUrl: data.coverImageUrl || undefined,
        zoom: 1,
        createdAt: data.createdAt,
        updatedAt: data.lastEditedAt || data.updatedAt
      };
    } catch {
      return null;
    }
  }

  async listDrafts(): Promise<PlannerDesign[]> {
    try {
      const list = await firstValueFrom(this.api.listDesigns('DRAFT'));
      return list.map(item => ({
        id: item.id,
        title: item.title,
        background: {
          type: item.backgroundType === 'UPLOAD' ? 'upload' : 'template',
          name: item.title,
          imageUrl: item.backgroundUrl,
          naturalWidth: 1200,
          naturalHeight: 800,
          templateId: item.templateId || undefined
        },
        dimensions: {
          length: item.roomLength,
          width: item.roomWidth,
          height: item.roomHeight || 2.8
        },
        objects: [],
        thumbnailUrl: item.coverImageUrl || undefined,
        createdAt: item.createdAt,
        updatedAt: item.lastEditedAt || item.updatedAt
      }));
    } catch {
      return [];
    }
  }

  async renameDraft(id: string, newTitle: string): Promise<boolean> {
    try {
      await firstValueFrom(this.api.renameDesign(id, newTitle));
      return true;
    } catch {
      return false;
    }
  }

  async deleteDraft(id: string): Promise<boolean> {
    try {
      await firstValueFrom(this.api.deleteDesign(id));
      return true;
    } catch {
      return false;
    }
  }
}
