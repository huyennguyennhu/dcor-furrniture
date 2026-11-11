import { Injectable, computed, signal } from '@angular/core';
import {
  PlannerBackground,
  PlannerDesign,
  PlannerObject,
  RoomDimensions,
  RoomTemplate
} from '../models/planner.model';

export interface SummaryProductItem {
  productId: string;
  variantId?: string;
  name: string;
  category: string;
  imageUrl: string;
  unitPrice: number;
  count: number;
  totalPrice: number;
  dimensionCm: { width: number; depth: number };
  isEstimatedDimension: boolean;
  selectedColor?: string;
  objectIds: string[];
}

@Injectable()
export class RoomPlannerService {
  // --- Flow state ---
  readonly currentStep = signal<'setup' | 'planner'>('setup');
  readonly setupSubStep = signal<'source' | 'dimensions'>('source');

  // --- Saved Draft state (Lưu trên máy này) ---
  readonly currentDraftId = signal<string | null>(null);
  readonly currentDraftTitle = signal<string>('');
  readonly lastSavedTime = signal<string | null>(null);

  // --- Room setup state ---
  readonly background = signal<PlannerBackground | null>(null);
  readonly dimensions = signal<RoomDimensions | null>(null);

  // --- Canvas Viewport state ---
  readonly zoom = signal<number>(1); // 0.25 to 4.0
  readonly pan = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  readonly showGrid = signal<boolean>(true);

  // --- Objects state ---
  readonly objects = signal<PlannerObject[]>([]);
  readonly selectedObjectId = signal<string | null>(null);

  // --- History (Undo/Redo) ---
  private history: PlannerObject[][] = [];
  private historyIndex = -1;
  private readonly MAX_HISTORY = 50;

  readonly canUndo = signal<boolean>(false);
  readonly canRedo = signal<boolean>(false);

  // --- Computed metrics ---
  // Tỉ lệ điểm ảnh trên mỗi mét thực tế: Chiều dài (cạnh ngang) = naturalWidth
  readonly pxPerMeter = computed(() => {
    const bg = this.background();
    const dims = this.dimensions();
    if (!bg || !dims || dims.length <= 0) return 100;
    return bg.naturalWidth / dims.length;
  });

  readonly roomPixelWidth = computed(() => {
    return this.background()?.naturalWidth || 1200;
  });

  readonly roomPixelHeight = computed(() => {
    return this.background()?.naturalHeight || 800;
  });

  readonly selectedObject = computed(() => {
    const id = this.selectedObjectId();
    if (!id) return null;
    return this.objects().find(o => o.id === id) || null;
  });

  readonly totalPrice = computed(() => {
    return this.objects().reduce((sum, obj) => sum + (obj.unitPrice || 0), 0);
  });

  readonly totalItemsCount = computed(() => {
    return this.objects().length;
  });

  // Gom nhóm sản phẩm hiển thị ở panel tóm tắt bên phải
  readonly summaryItems = computed<SummaryProductItem[]>(() => {
    const map = new Map<string, SummaryProductItem>();
    const objs = this.objects();

    for (const obj of objs) {
      const existing = map.get(obj.productId);
      if (existing) {
        existing.count++;
        existing.totalPrice += obj.unitPrice;
        existing.objectIds.push(obj.id);
        if (!existing.variantId && obj.variantId) {
          existing.variantId = obj.variantId;
        }
      } else {
        map.set(obj.productId, {
          productId: obj.productId,
          variantId: obj.variantId || obj.productId,
          name: obj.name,
          category: obj.category,
          imageUrl: obj.imageUrl,
          unitPrice: obj.unitPrice,
          count: 1,
          totalPrice: obj.unitPrice,
          dimensionCm: obj.dimensionCm,
          isEstimatedDimension: obj.isEstimatedDimension,
          selectedColor: obj.selectedColor,
          objectIds: [obj.id]
        });
      }
    }

    return Array.from(map.values());
  });

  constructor() {}

  // ==========================================
  // SETUP FLOW
  // ==========================================

  selectTemplate(template: RoomTemplate): void {
    // Tải ảnh để lấy kích thước naturalWidth và naturalHeight
    const img = new Image();
    img.src = template.imageUrl;
    img.onload = () => {
      this.background.set({
        type: 'template',
        name: template.name,
        imageUrl: template.imageUrl,
        naturalWidth: img.naturalWidth || 1200,
        naturalHeight: img.naturalHeight || 800,
        templateId: template.id
      });
      this.dimensions.set({ ...template.defaultDimensions });
      this.setupSubStep.set('dimensions');
    };
    img.onerror = () => {
      this.background.set({
        type: 'template',
        name: template.name,
        imageUrl: template.imageUrl,
        naturalWidth: 1200,
        naturalHeight: 800,
        templateId: template.id
      });
      this.dimensions.set({ ...template.defaultDimensions });
      this.setupSubStep.set('dimensions');
    };
  }

  setUploadedBackground(bg: PlannerBackground): void {
    this.background.set(bg);
    // Gợi ý kích thước mặc định 5m x 4m
    const currentDims = this.dimensions();
    if (!currentDims) {
      const aspect = bg.naturalWidth / (bg.naturalHeight || 1);
      const suggestedWidth = Math.max(1, Math.min(30, Math.round((5 / aspect) * 10) / 10));
      this.dimensions.set({
        length: 5,
        width: suggestedWidth || 4,
        height: 2.8
      });
    }
    this.setupSubStep.set('dimensions');
  }

  updateDimensions(dims: RoomDimensions): void {
    this.dimensions.set({ ...dims });
  }

  startPlanning(): void {
    const bg = this.background();
    const dims = this.dimensions();
    if (!bg || !dims) return;

    this.currentStep.set('planner');
    this.zoom.set(1);
    this.pan.set({ x: 0, y: 0 });
    this.resetHistory();
  }

  loadDesign(design: PlannerDesign): void {
    this.currentDraftId.set(design.id || null);
    this.currentDraftTitle.set(design.title || 'Thiết kế của tôi');
    if (design.updatedAt) {
      const d = new Date(design.updatedAt);
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      this.lastSavedTime.set(`Đã lưu lúc ${hours}:${mins}`);
    } else {
      this.lastSavedTime.set(null);
    }
    this.background.set(design.background);
    this.dimensions.set({ ...design.dimensions });
    this.objects.set(JSON.parse(JSON.stringify(design.objects || [])));
    this.selectedObjectId.set(null);
    this.zoom.set(design.zoom || 1);
    this.pan.set({ x: 0, y: 0 });
    this.currentStep.set('planner');
    this.resetHistory();
  }

  resetPlannerState(): void {
    this.objects.set([]);
    this.selectedObjectId.set(null);
    this.zoom.set(1);
    this.pan.set({ x: 0, y: 0 });
    this.currentDraftId.set(null);
    this.currentDraftTitle.set('');
    this.lastSavedTime.set(null);
    this.history = [];
    this.historyIndex = -1;
    this.updateUndoRedoSignals();
  }

  backToSetup(): void {
    this.confirmResetAndBackToSetup();
  }

  confirmResetAndBackToSetup(): void {
    this.resetPlannerState();
    this.currentStep.set('setup');
    this.setupSubStep.set('source');
  }

  backToSourceSelection(): void {
    this.setupSubStep.set('source');
  }

  // ==========================================
  // OBJECT MANAGEMENT
  // ==========================================

  /**
   * Trích xuất kích thước từ sản phẩm (cm)
   */
  private extractDimensions(product: any): { width: number; depth: number; isEstimated: boolean } {
    let width = 0;
    let depth = 0;

    // 1. Trích xuất từ attributes trong variant 0 (Madrid, Expose, Demand, etc.)
    const attrs = product.variants?.[0]?.optionValues?.attributes;
    if (attrs) {
      if (attrs.diameter) {
        const d = this.parseDimensionValue(attrs.diameter);
        if (d > 0) {
          width = d;
          depth = d;
        }
      }
      if ((!width || !depth) && attrs.width && attrs.depth) {
        width = this.parseDimensionValue(attrs.width);
        depth = this.parseDimensionValue(attrs.depth);
      } else if (!width && attrs.width) {
        width = this.parseDimensionValue(attrs.width);
      }
    }

    // 2. Trích xuất từ variant size (2m, 2m4)
    if (!width || !depth) {
      const sizeVal = product.variants?.[0]?.optionValues?.size;
      if (typeof sizeVal === 'string') {
        if (/2m4/i.test(sizeVal)) {
          width = 240;
          depth = 95;
        } else if (/2m/i.test(sizeVal)) {
          width = 200;
          depth = 90;
        } else if (/1m8/i.test(sizeVal)) {
          width = 180;
          depth = 85;
        } else if (/1m6/i.test(sizeVal)) {
          width = 160;
          depth = 80;
        }
      }
    }

    // 3. Trích xuất từ variant name (H51xØ46cm, H45xØ38cm, etc.)
    if (!width || !depth) {
      const vName = product.variants?.[0]?.name || '';
      const diamMatch = vName.match(/Ø(\d+)/);
      if (diamMatch) {
        const d = parseFloat(diamMatch[1]);
        if (d > 0) {
          width = d;
          depth = d;
        }
      }
    }

    // 4. Thử lấy từ configOptions.dimensions
    const configDims = product.configOptions?.dimensions;
    if ((!width || !depth) && configDims) {
      width = this.parseDimensionValue(configDims.width);
      depth = this.parseDimensionValue(configDims.depth);
    }

    // 5. Thử lấy từ variants[0].optionValues.dimensions
    if ((!width || !depth) && product.variants?.[0]?.optionValues?.dimensions) {
      const vDims = product.variants[0].optionValues.dimensions;
      width = this.parseDimensionValue(vDims.width);
      depth = this.parseDimensionValue(vDims.depth);
    }

    // 6. Thử lấy từ dimensions trực tiếp
    if ((!width || !depth) && product.dimensions) {
      width = this.parseDimensionValue(product.dimensions.width);
      depth = this.parseDimensionValue(product.dimensions.depth);
    }

    // 7. Fallback mặc định theo danh mục
    if (!width || !depth || width <= 0 || depth <= 0) {
      const catLower = (product.category?.parent?.name || product.category?.name || '').toLowerCase();
      if (catLower.includes('sofa')) {
        return { width: 220, depth: 95, isEstimated: true };
      }
      if (catLower.includes('table') || catLower.includes('bàn')) {
        return { width: 140, depth: 80, isEstimated: true };
      }
      if (catLower.includes('chair') || catLower.includes('ghế')) {
        return { width: 60, depth: 60, isEstimated: true };
      }
      if (catLower.includes('bed') || catLower.includes('giường')) {
        return { width: 180, depth: 200, isEstimated: true };
      }
      if (catLower.includes('rug') || catLower.includes('thảm')) {
        return { width: 200, depth: 140, isEstimated: true };
      }
      return { width: 100, depth: 60, isEstimated: true };
    }

    return { width, depth, isEstimated: false };
  }

  private parseDimensionValue(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const match = val.replace(',', '.').match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  }

  /**
   * Thêm sản phẩm vào canvas
   */
  addProductToCanvas(product: any, position?: { x: number; y: number }): PlannerObject {
    const ppm = this.pxPerMeter();
    const { width: widthCm, depth: depthCm, isEstimated } = this.extractDimensions(product);

    // Kích thước hiển thị trên canvas = cm / 100 * pxPerMeter
    const widthPx = Math.max(30, (widthCm / 100) * ppm);
    const heightPx = Math.max(20, (depthCm / 100) * ppm);

    const roomW = this.roomPixelWidth();
    const roomH = this.roomPixelHeight();

    // Vị trí thả: nếu không truyền vị trí thì đặt giữa phòng (hoặc lệch ngẫu nhiên nhẹ để không đè khít)
    let posX = position ? position.x - widthPx / 2 : roomW / 2 - widthPx / 2;
    let posY = position ? position.y - heightPx / 2 : roomH / 2 - heightPx / 2;

    if (!position) {
      const offset = (this.objects().length % 5) * 20;
      posX += offset;
      posY += offset;
    }

    // Giới hạn biên an toàn
    posX = Math.max(0, Math.min(roomW - widthPx, posX));
    posY = Math.max(0, Math.min(roomH - heightPx, posY));

    // Lấy giá thấp nhất
    let unitPrice = product.prices?.[0]?.price || product.basePrice || 0;
    if (product.lowestPrices?.[0]?.price) {
      unitPrice = product.lowestPrices[0].price;
    } else if (product.discountValue) {
      unitPrice = product.discountType === 'PERCENT'
        ? Math.round(unitPrice * (100 - product.discountValue) / 100)
        : Math.max(0, unitPrice - product.discountValue);
    }

    const maxZ = this.objects().reduce((max, o) => Math.max(max, o.zIndex), 0);

    const variantId =
      product.selectedVariantId ||
      product.variantId ||
      product.variants?.[0]?.id ||
      product.id;

    const newObj: PlannerObject = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      productId: product.productId || product.id || String(Date.now()),
      variantId,
      productSlug: product.slug,
      name: product.name || 'Sản phẩm nội thất',
      category: product.category || 'Nội thất',
      imageUrl: product.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
      unitPrice,
      x: Math.round(posX),
      y: Math.round(posY),
      width: Math.round(widthPx),
      height: Math.round(heightPx),
      rotation: 0,
      zIndex: maxZ + 1,
      isLocked: false,
      dimensionCm: { width: widthCm, depth: depthCm },
      isEstimatedDimension: isEstimated,
      selectedColor: 'Tiêu chuẩn'
    };

    const nextList = [...this.objects(), newObj];
    this.objects.set(nextList);
    this.selectedObjectId.set(newObj.id);
    this.recordHistory(nextList);

    return newObj;
  }

  selectObject(id: string | null): void {
    this.selectedObjectId.set(id);
  }

  updateObjectPosition(id: string, x: number, y: number, recordHistory = false): void {
    const list = this.objects();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1 || list[idx].isLocked) return;

    const obj = list[idx];
    const roomW = this.roomPixelWidth();
    const roomH = this.roomPixelHeight();

    // Ràng buộc biên: không cho kéo vật thể ra ngoài hoàn toàn vùng nền
    // Giữ lại ít nhất 20px hoặc 30% diện tích bên trong
    const minVisible = 30;
    const clampedX = Math.max(-obj.width + minVisible, Math.min(roomW - minVisible, x));
    const clampedY = Math.max(-obj.height + minVisible, Math.min(roomH - minVisible, y));

    const updated = { ...obj, x: Math.round(clampedX), y: Math.round(clampedY) };
    const nextList = [...list];
    nextList[idx] = updated;

    this.objects.set(nextList);
    if (recordHistory) {
      this.recordHistory(nextList);
    }
  }

  updateObjectRotation(id: string, rotation: number, recordHistory = false): void {
    const list = this.objects();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1 || list[idx].isLocked) return;

    let normalized = Math.round(rotation) % 360;
    if (normalized < 0) normalized += 360;

    const updated = { ...list[idx], rotation: normalized };
    const nextList = [...list];
    nextList[idx] = updated;

    this.objects.set(nextList);
    if (recordHistory) {
      this.recordHistory(nextList);
    }
  }

  rotate90(id: string): void {
    const obj = this.objects().find(o => o.id === id);
    if (!obj || obj.isLocked) return;
    this.updateObjectRotation(id, obj.rotation + 90, true);
  }

  updateObjectSize(id: string, width: number, height: number, recordHistory = false): void {
    const list = this.objects();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1 || list[idx].isLocked) return;

    // Giới hạn kích thước tối thiểu 25px
    const clampedW = Math.max(25, Math.round(width));
    const clampedH = Math.max(25, Math.round(height));

    const updated = { ...list[idx], width: clampedW, height: clampedH };
    const nextList = [...list];
    nextList[idx] = updated;

    this.objects.set(nextList);
    if (recordHistory) {
      this.recordHistory(nextList);
    }
  }

  updateObjectTransform(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    recordHistory = false
  ): void {
    const list = this.objects();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1 || list[idx].isLocked) return;

    const clampedW = Math.max(25, Math.round(width));
    const clampedH = Math.max(25, Math.round(height));

    const updated = {
      ...list[idx],
      x: Math.round(x),
      y: Math.round(y),
      width: clampedW,
      height: clampedH
    };
    const nextList = [...list];
    nextList[idx] = updated;

    this.objects.set(nextList);
    if (recordHistory) {
      this.recordHistory(nextList);
    }
  }

  duplicateObject(id: string): PlannerObject | null {
    const target = this.objects().find(o => o.id === id);
    if (!target) return null;

    const maxZ = this.objects().reduce((max, o) => Math.max(max, o.zIndex), 0);
    const roomW = this.roomPixelWidth();
    const roomH = this.roomPixelHeight();

    let newX = target.x + 30;
    let newY = target.y + 30;

    if (newX + target.width > roomW) newX = Math.max(10, target.x - 30);
    if (newY + target.height > roomH) newY = Math.max(10, target.y - 30);

    const cloned: PlannerObject = {
      ...target,
      id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: newX,
      y: newY,
      zIndex: maxZ + 1,
      isLocked: false
    };

    const nextList = [...this.objects(), cloned];
    this.objects.set(nextList);
    this.selectedObjectId.set(cloned.id);
    this.recordHistory(nextList);

    return cloned;
  }

  deleteObject(id: string): void {
    const target = this.objects().find(o => o.id === id);
    if (!target || target.isLocked) return;

    const nextList = this.objects().filter(o => o.id !== id);
    this.objects.set(nextList);
    if (this.selectedObjectId() === id) {
      this.selectedObjectId.set(null);
    }
    this.recordHistory(nextList);
  }

  deleteByProductId(productId: string): void {
    const nextList = this.objects().filter(o => o.productId !== productId || o.isLocked);
    this.objects.set(nextList);
    const sel = this.selectedObject();
    if (sel && sel.productId === productId && !sel.isLocked) {
      this.selectedObjectId.set(null);
    }
    this.recordHistory(nextList);
  }

  clearAll(): void {
    // Chỉ xóa các vật thể không bị khóa
    const remaining = this.objects().filter(o => o.isLocked);
    this.objects.set(remaining);
    this.selectedObjectId.set(null);
    this.recordHistory(remaining);
  }

  bringForward(id: string): void {
    const list = this.objects();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1) return;

    const currentZ = list[idx].zIndex;
    const higher = list.filter(o => o.zIndex > currentZ).sort((a, b) => a.zIndex - b.zIndex);
    if (higher.length === 0) return;

    const nextZ = higher[0].zIndex;
    const nextList = list.map(o => {
      if (o.id === id) return { ...o, zIndex: nextZ };
      if (o.id === higher[0].id) return { ...o, zIndex: currentZ };
      return o;
    });

    this.objects.set(nextList);
    this.recordHistory(nextList);
  }

  sendBackward(id: string): void {
    const list = this.objects();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1) return;

    const currentZ = list[idx].zIndex;
    const lower = list.filter(o => o.zIndex < currentZ).sort((a, b) => b.zIndex - a.zIndex);
    if (lower.length === 0) return;

    const prevZ = lower[0].zIndex;
    const nextList = list.map(o => {
      if (o.id === id) return { ...o, zIndex: prevZ };
      if (o.id === lower[0].id) return { ...o, zIndex: currentZ };
      return o;
    });

    this.objects.set(nextList);
    this.recordHistory(nextList);
  }

  toggleLock(id: string): void {
    const list = this.objects();
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1) return;

    const updated = { ...list[idx], isLocked: !list[idx].isLocked };
    const nextList = [...list];
    nextList[idx] = updated;

    this.objects.set(nextList);
    this.recordHistory(nextList);
  }

  // ==========================================
  // VIEWPORT CONTROLS
  // ==========================================

  setZoom(val: number): void {
    const clamped = Math.max(0.25, Math.min(4.0, Math.round(val * 100) / 100));
    this.zoom.set(clamped);
  }

  zoomIn(): void {
    this.setZoom(this.zoom() + 0.15);
  }

  zoomOut(): void {
    this.setZoom(this.zoom() - 0.15);
  }

  resetZoom(): void {
    this.zoom.set(1);
    this.pan.set({ x: 0, y: 0 });
  }

  setPan(pan: { x: number; y: number }): void {
    this.pan.set(pan);
  }

  clampPan(
    pan: { x: number; y: number },
    viewportW: number,
    viewportH: number
  ): { x: number; y: number } {
    if (!viewportW || !viewportH) return pan;
    const stageW = this.roomPixelWidth() * this.zoom();
    const stageH = this.roomPixelHeight() * this.zoom();
    const minVisible = 100;

    const minX = minVisible - stageW;
    const maxX = viewportW - minVisible;
    const minY = minVisible - stageH;
    const maxY = viewportH - minVisible;

    // Nếu sân khấu nhỏ hơn viewport, cho phép pan tự do trong giới hạn
    const clampedX = minX <= maxX ? Math.max(minX, Math.min(maxX, pan.x)) : pan.x;
    const clampedY = minY <= maxY ? Math.max(minY, Math.min(maxY, pan.y)) : pan.y;

    return {
      x: Math.round(clampedX),
      y: Math.round(clampedY)
    };
  }

  toggleGrid(): void {
    this.showGrid.set(!this.showGrid());
  }

  // ==========================================
  // HISTORY / UNDO / REDO
  // ==========================================

  private resetHistory(): void {
    this.history = [JSON.parse(JSON.stringify(this.objects()))];
    this.historyIndex = 0;
    this.updateUndoRedoSignals();
  }

  recordHistory(list?: PlannerObject[]): void {
    const state = list || this.objects();
    // Xóa nhánh redo sau index hiện tại
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Thêm bản sao deep copy
    this.history.push(JSON.parse(JSON.stringify(state)));

    // Giới hạn max 50 bước
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }

    this.updateUndoRedoSignals();
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const snapshot = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.objects.set(snapshot);

      // Nếu object được chọn không còn tồn tại thì bỏ chọn
      const selId = this.selectedObjectId();
      if (selId && !snapshot.some((o: PlannerObject) => o.id === selId)) {
        this.selectedObjectId.set(null);
      }

      this.updateUndoRedoSignals();
    }
  }

  redo(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const snapshot = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
      this.objects.set(snapshot);

      const selId = this.selectedObjectId();
      if (selId && !snapshot.some((o: PlannerObject) => o.id === selId)) {
        this.selectedObjectId.set(null);
      }

      this.updateUndoRedoSignals();
    }
  }

  private updateUndoRedoSignals(): void {
    this.canUndo.set(this.historyIndex > 0);
    this.canRedo.set(this.historyIndex < this.history.length - 1);
  }
}
