import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { RoomPlannerService } from '../../services/room-planner.service';
import { PlannerObject } from '../../models/planner.model';

type TransformMode = 'none' | 'pan' | 'drag-obj' | 'rotate-obj' | 'resize-obj';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="8" fill="%23f3f4f6"/><path d="M35 75 L55 52 L68 64 L85 45 L95 75 Z" fill="%23cbd5e1"/><circle cx="48" cy="42" r="7" fill="%23cbd5e1"/></svg>';

@Component({
  selector: 'app-planner-canvas',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './planner-canvas.html',
  styleUrls: ['./planner-canvas.css']
})
export class PlannerCanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('stage', { static: true }) stageRef!: ElementRef<HTMLDivElement>;

  readonly Math = Math;

  // Chế độ tương tác hiện tại
  currentMode: TransformMode = 'none';

  // Lưu trạng thái tạm thời khi thao tác Pointer Events
  private startPointer = { x: 0, y: 0 };
  private startPan = { x: 0, y: 0 };
  private activeTransformObjId: string | null = null;
  private startObjState: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    aspectRatio: number;
    oppCornerRoom: { x: number; y: number };
  } | null = null;
  private resizeHandleType: 'se' | 'sw' | 'ne' | 'nw' = 'se';
  private objCenterScreen = { x: 0, y: 0 };

  // Bound event handlers for clean removal
  private boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
  private boundWheel = (e: WheelEvent) => this.handleWheel(e);
  private boundPointerMove = (e: PointerEvent) => this.onGlobalPointerMove(e);
  private boundPointerUp = (e: PointerEvent) => this.onGlobalPointerUp(e);

  // Grid step: 1 mét thực tế
  readonly gridMeterSize = computed(() => {
    return Math.max(20, Math.round(this.plannerService.pxPerMeter()));
  });

  constructor(
    public plannerService: RoomPlannerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
  }

  ngAfterViewInit(): void {
    // Non-passive wheel listener để e.preventDefault() ngăn zoom trang của trình duyệt
    if (this.viewportRef?.nativeElement) {
      this.viewportRef.nativeElement.addEventListener('wheel', this.boundWheel, {
        passive: false
      });
    }

    // Tự động căn giữa và fit phòng vào khung nhìn khi mở canvas
    setTimeout(() => {
      this.fitStageToViewport();
    }, 50);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);

    if (this.viewportRef?.nativeElement) {
      this.viewportRef.nativeElement.removeEventListener('wheel', this.boundWheel);
    }
  }

  // ==========================================
  // FIT & CENTER STAGE
  // ==========================================
  fitStageToViewport(): void {
    if (!this.viewportRef?.nativeElement) return;

    const viewportW = this.viewportRef.nativeElement.clientWidth;
    const viewportH = this.viewportRef.nativeElement.clientHeight;
    const stageW = this.plannerService.roomPixelWidth();
    const stageH = this.plannerService.roomPixelHeight();

    if (viewportW <= 0 || viewportH <= 0 || stageW <= 0 || stageH <= 0) return;

    const padding = 36;
    const scaleX = (viewportW - padding * 2) / stageW;
    const scaleY = (viewportH - padding * 2) / stageH;
    const fitZoom = Math.max(0.25, Math.min(1.25, Math.min(scaleX, scaleY)));

    const panX = Math.round((viewportW - stageW * fitZoom) / 2);
    const panY = Math.round((viewportH - stageH * fitZoom) / 2);

    this.plannerService.setZoom(Math.round(fitZoom * 100) / 100);
    this.plannerService.setPan({ x: panX, y: panY });
    this.cdr.markForCheck();
  }

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================
  private isEditingInput(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (
      el &&
      (el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable ||
        el.closest('input, textarea, select, [contenteditable="true"]'))
    ) {
      return true;
    }

    const activeEl = document.activeElement as HTMLElement | null;
    if (
      activeEl &&
      (activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable)
    ) {
      return true;
    }

    return false;
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.isEditingInput(e.target)) return;

    // Undo: Ctrl + Z
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.plannerService.undo();
      return;
    }

    // Redo: Ctrl + Y hoặc Ctrl + Shift + Z
    if (
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault();
      this.plannerService.redo();
      return;
    }

    // Delete / Backspace: Xóa vật thể đang chọn
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selId = this.plannerService.selectedObjectId();
      if (selId) {
        e.preventDefault();
        this.plannerService.deleteObject(selId);
      }
      return;
    }

    // Duplicate: Ctrl + D
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      const selId = this.plannerService.selectedObjectId();
      if (selId) {
        e.preventDefault();
        this.plannerService.duplicateObject(selId);
      }
      return;
    }

    // Escape: Bỏ chọn
    if (e.key === 'Escape') {
      this.plannerService.selectObject(null);
    }
  }

  // ==========================================
  // WHEEL ZOOM (Ctrl + Cuộn chuột)
  // ==========================================
  private handleWheel(e: WheelEvent): void {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoomAtPoint(zoomFactor, e.clientX, e.clientY);
    }
  }

  private zoomAtPoint(factor: number, clientX: number, clientY: number): void {
    const currentZoom = this.plannerService.zoom();
    const newZoom = Math.max(0.25, Math.min(4.0, Math.round(currentZoom * factor * 100) / 100));
    if (newZoom === currentZoom) return;

    const viewportRect = this.viewportRef.nativeElement.getBoundingClientRect();
    const mouseX = clientX - viewportRect.left;
    const mouseY = clientY - viewportRect.top;

    const currentPan = this.plannerService.pan();
    const scaleDiff = newZoom / currentZoom;
    const newPanX = mouseX - (mouseX - currentPan.x) * scaleDiff;
    const newPanY = mouseY - (mouseY - currentPan.y) * scaleDiff;

    this.plannerService.setZoom(newZoom);

    const clampedPan = this.plannerService.clampPan(
      { x: Math.round(newPanX), y: Math.round(newPanY) },
      viewportRect.width,
      viewportRect.height
    );
    this.plannerService.setPan(clampedPan);
  }

  // ==========================================
  // DRAG & DROP SẢN PHẨM TỪ PANEL VÀO CANVAS
  // ==========================================
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    if (!e.dataTransfer) return;

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const product = JSON.parse(rawData);
      const roomPos = this.clientToRoomCoords(e.clientX, e.clientY);
      this.plannerService.addProductToCanvas(product, roomPos);
    } catch {
      // bỏ qua lỗi parse json
    }
  }

  private clientToRoomCoords(clientX: number, clientY: number): { x: number; y: number } {
    const stageEl = this.stageRef.nativeElement;
    const rect = stageEl.getBoundingClientRect();
    const zoom = this.plannerService.zoom();

    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;

    return { x: Math.round(x), y: Math.round(y) };
  }

  // ==========================================
  // POINTER EVENTS: PAN NỀN & BỎ CHỌN
  // ==========================================
  onBackgroundPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    this.plannerService.selectObject(null);

    this.currentMode = 'pan';
    this.startPointer = { x: e.clientX, y: e.clientY };
    this.startPan = { ...this.plannerService.pan() };
  }

  // ==========================================
  // POINTER EVENTS: KÉO VẬT THỂ (MOVE)
  // ==========================================
  onObjectPointerDown(e: PointerEvent, obj: PlannerObject): void {
    e.stopPropagation();
    if (e.button !== 0) return;

    this.plannerService.selectObject(obj.id);
    if (obj.isLocked) return;

    this.currentMode = 'drag-obj';
    this.activeTransformObjId = obj.id;
    this.startPointer = { x: e.clientX, y: e.clientY };
    this.startObjState = {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      rotation: obj.rotation,
      aspectRatio: obj.width / obj.height,
      oppCornerRoom: { x: 0, y: 0 }
    };
  }

  // ==========================================
  // POINTER EVENTS: XOAY VẬT THỂ (ROTATE)
  // ==========================================
  onRotateHandlePointerDown(e: PointerEvent, obj: PlannerObject): void {
    e.stopPropagation();
    if (e.button !== 0 || obj.isLocked) return;

    this.currentMode = 'rotate-obj';
    this.activeTransformObjId = obj.id;

    const stageRect = this.stageRef.nativeElement.getBoundingClientRect();
    const zoom = this.plannerService.zoom();

    const objCenterX = stageRect.left + (obj.x + obj.width / 2) * zoom;
    const objCenterY = stageRect.top + (obj.y + obj.height / 2) * zoom;
    this.objCenterScreen = { x: objCenterX, y: objCenterY };

    this.startObjState = {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      rotation: obj.rotation,
      aspectRatio: obj.width / obj.height,
      oppCornerRoom: { x: 0, y: 0 }
    };
  }

  // ==========================================
  // POINTER EVENTS: THAY ĐỔI KÍCH THƯỚC (RESIZE GIỮ TỈ LỆ)
  // ==========================================
  onResizeHandlePointerDown(
    e: PointerEvent,
    obj: PlannerObject,
    handle: 'se' | 'sw' | 'ne' | 'nw'
  ): void {
    e.stopPropagation();
    if (e.button !== 0 || obj.isLocked) return;

    this.currentMode = 'resize-obj';
    this.activeTransformObjId = obj.id;
    this.resizeHandleType = handle;
    this.startPointer = { x: e.clientX, y: e.clientY };

    const rad = (obj.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const c0x = obj.x + obj.width / 2;
    const c0y = obj.y + obj.height / 2;

    // Tọa độ góc đối diện cố định trong hệ tọa độ cục bộ (u, v)
    let oppU = 0;
    let oppV = 0;
    if (handle === 'se') {
      oppU = -obj.width / 2;
      oppV = -obj.height / 2;
    } else if (handle === 'nw') {
      oppU = obj.width / 2;
      oppV = obj.height / 2;
    } else if (handle === 'ne') {
      oppU = -obj.width / 2;
      oppV = obj.height / 2;
    } else if (handle === 'sw') {
      oppU = obj.width / 2;
      oppV = -obj.height / 2;
    }

    // Tọa độ góc đối diện cố định trong mặt bằng phòng
    const oppRoomX = c0x + oppU * cos - oppV * sin;
    const oppRoomY = c0y + oppU * sin + oppV * cos;

    this.startObjState = {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      rotation: obj.rotation,
      aspectRatio: obj.width / obj.height,
      oppCornerRoom: { x: oppRoomX, y: oppRoomY }
    };
  }

  // ==========================================
  // GLOBAL POINTER MOVE & UP (ĐẢM BẢO KHÔNG TRƯỢT/RỚT CON TRỎ)
  // ==========================================
  private onGlobalPointerMove(e: PointerEvent): void {
    if (this.currentMode === 'none') return;

    if (this.currentMode === 'pan') {
      const dx = e.clientX - this.startPointer.x;
      const dy = e.clientY - this.startPointer.y;
      const vp = this.viewportRef.nativeElement;
      const clamped = this.plannerService.clampPan(
        { x: this.startPan.x + dx, y: this.startPan.y + dy },
        vp.clientWidth,
        vp.clientHeight
      );
      this.plannerService.setPan(clamped);
      return;
    }

    if (!this.activeTransformObjId || !this.startObjState) return;
    const objId = this.activeTransformObjId;
    const obj = this.plannerService.objects().find(o => o.id === objId);
    if (!obj) return;

    const zoom = this.plannerService.zoom();

    if (this.currentMode === 'drag-obj') {
      const dx = (e.clientX - this.startPointer.x) / zoom;
      const dy = (e.clientY - this.startPointer.y) / zoom;
      const newX = this.startObjState.x + dx;
      const newY = this.startObjState.y + dy;
      this.plannerService.updateObjectPosition(objId, newX, newY, false);
      return;
    }

    if (this.currentMode === 'rotate-obj') {
      const dx = e.clientX - this.objCenterScreen.x;
      const dy = e.clientY - this.objCenterScreen.y;
      let angleRad = Math.atan2(dy, dx);
      let angleDeg = angleRad * (180 / Math.PI) + 90;
      if (e.shiftKey) {
        angleDeg = Math.round(angleDeg / 15) * 15;
      }
      this.plannerService.updateObjectRotation(objId, angleDeg, false);
      return;
    }

    if (this.currentMode === 'resize-obj') {
      // Chuyển đổi độ dịch chuột trên màn hình sang không gian xoay cục bộ của vật thể
      const dxRoom = (e.clientX - this.startPointer.x) / zoom;
      const dyRoom = (e.clientY - this.startPointer.y) / zoom;

      const rad = (this.startObjState.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      // Chiếu vector kéo chuột vào trục u (ngang) và v (dọc) của vật thể xoay
      const du = dxRoom * cos + dyRoom * sin;
      const dv = -dxRoom * sin + dyRoom * cos;
      const aspect = this.startObjState.aspectRatio;

      let deltaW = 0;
      if (this.resizeHandleType === 'se') {
        deltaW = (du + dv * aspect) / 2;
      } else if (this.resizeHandleType === 'nw') {
        deltaW = (-du - dv * aspect) / 2;
      } else if (this.resizeHandleType === 'ne') {
        deltaW = (du - dv * aspect) / 2;
      } else if (this.resizeHandleType === 'sw') {
        deltaW = (-du + dv * aspect) / 2;
      }

      const newWidth = Math.max(30, this.startObjState.width + deltaW);
      const newHeight = Math.max(20, newWidth / aspect);

      // Tính lại tâm mới để góc đối diện giữ nguyên vị trí trong phòng
      let newOppU = 0;
      let newOppV = 0;
      if (this.resizeHandleType === 'se') {
        newOppU = -newWidth / 2;
        newOppV = -newHeight / 2;
      } else if (this.resizeHandleType === 'nw') {
        newOppU = newWidth / 2;
        newOppV = newHeight / 2;
      } else if (this.resizeHandleType === 'ne') {
        newOppU = -newWidth / 2;
        newOppV = newHeight / 2;
      } else if (this.resizeHandleType === 'sw') {
        newOppU = newWidth / 2;
        newOppV = -newHeight / 2;
      }

      const opp = this.startObjState.oppCornerRoom;
      const newCenterX = opp.x - (newOppU * cos - newOppV * sin);
      const newCenterY = opp.y - (newOppU * sin + newOppV * cos);

      const newX = newCenterX - newWidth / 2;
      const newY = newCenterY - newHeight / 2;

      this.plannerService.updateObjectTransform(objId, newX, newY, newWidth, newHeight, false);
    }
  }

  private onGlobalPointerUp(e: PointerEvent): void {
    if (this.currentMode === 'none') return;

    if (this.currentMode === 'drag-obj' || this.currentMode === 'rotate-obj' || this.currentMode === 'resize-obj') {
      if (this.activeTransformObjId && this.startObjState) {
        const obj = this.plannerService.objects().find(o => o.id === this.activeTransformObjId);
        if (
          obj &&
          (obj.x !== this.startObjState.x ||
            obj.y !== this.startObjState.y ||
            obj.width !== this.startObjState.width ||
            obj.rotation !== this.startObjState.rotation)
        ) {
          this.plannerService.recordHistory();
        }
      }
    }

    this.currentMode = 'none';
    this.activeTransformObjId = null;
    this.startObjState = null;
  }

  // ==========================================
  // FLOATING QUICK ACTIONS (VẬT THỂ ĐANG CHỌN)
  // ==========================================
  rotateSelected90(): void {
    const sel = this.plannerService.selectedObject();
    if (sel && !sel.isLocked) this.plannerService.rotate90(sel.id);
  }

  bringSelectedForward(): void {
    const sel = this.plannerService.selectedObject();
    if (sel && !sel.isLocked) this.plannerService.bringForward(sel.id);
  }

  sendSelectedBackward(): void {
    const sel = this.plannerService.selectedObject();
    if (sel && !sel.isLocked) this.plannerService.sendBackward(sel.id);
  }

  toggleSelectedLock(): void {
    const sel = this.plannerService.selectedObject();
    if (sel) this.plannerService.toggleLock(sel.id);
  }

  duplicateSelected(): void {
    const sel = this.plannerService.selectedObject();
    if (sel && !sel.isLocked) this.plannerService.duplicateObject(sel.id);
  }

  deleteSelected(): void {
    const sel = this.plannerService.selectedObject();
    if (sel && !sel.isLocked) this.plannerService.deleteObject(sel.id);
  }

  onImgError(e: Event): void {
    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
  }
}
