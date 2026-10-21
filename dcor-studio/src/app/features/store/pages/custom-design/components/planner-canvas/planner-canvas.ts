import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { RoomPlannerService } from '../../services/room-planner.service';
import { PlannerObject } from '../../models/planner.model';

type TransformMode = 'none' | 'pan' | 'drag-obj' | 'rotate-obj' | 'resize-obj';

@Component({
  selector: 'app-planner-canvas',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './planner-canvas.html',
  styleUrls: ['./planner-canvas.css']
})
export class PlannerCanvasComponent {
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
  } | null = null;
  private resizeHandleType: 'se' | 'sw' | 'ne' | 'nw' = 'se';
  private objCenterScreen = { x: 0, y: 0 };

  // Grid step: 1 mét thực tế
  readonly gridMeterSize = computed(() => {
    return Math.max(20, Math.round(this.plannerService.pxPerMeter()));
  });

  constructor(
    public plannerService: RoomPlannerService,
    private cdr: ChangeDetectorRef
  ) {}

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================
  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    // Không bắt sự kiện khi đang gõ vào input / textarea
    const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (targetTag === 'input' || targetTag === 'textarea') return;

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
  // WHEEL ZOOM (Ctrl + Cuộn chuột hoặc cuộn)
  // ==========================================
  onWheel(e: WheelEvent): void {
    // Nếu nhấn Ctrl hoặc muốn cuộn mượt để phóng to thu nhỏ
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
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

    // Điều chỉnh pan để điểm dưới con trỏ chuột đứng yên
    const scaleDiff = newZoom / currentZoom;
    const newPanX = mouseX - (mouseX - currentPan.x) * scaleDiff;
    const newPanY = mouseY - (mouseY - currentPan.y) * scaleDiff;

    this.plannerService.setZoom(newZoom);
    this.plannerService.setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
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
      // Chuyển đổi tọa độ màn hình sang tọa độ nền phòng
      const roomPos = this.clientToRoomCoords(e.clientX, e.clientY);
      this.plannerService.addProductToCanvas(product, roomPos);
    } catch {
      // bỏ qua lỗi parse json
    }
  }

  // Chuyển đổi tọa độ client sang tọa độ pixel thực của phòng
  private clientToRoomCoords(clientX: number, clientY: number): { x: number; y: number } {
    const stageEl = this.stageRef.nativeElement;
    const rect = stageEl.getBoundingClientRect();
    const zoom = this.plannerService.zoom();

    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;

    return { x: Math.round(x), y: Math.round(y) };
  }

  // ==========================================
  // POINTER EVENTS CHO NỀN (PAN) & BỎ CHỌN
  // ==========================================
  onBackgroundPointerDown(e: PointerEvent): void {
    // Chỉ xử lý nút chuột chính (left click)
    if (e.button !== 0) return;

    // Bỏ chọn vật thể khi bấm vào vùng trống
    this.plannerService.selectObject(null);

    this.currentMode = 'pan';
    this.startPointer = { x: e.clientX, y: e.clientY };
    this.startPan = { ...this.plannerService.pan() };

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  }

  onBackgroundPointerMove(e: PointerEvent): void {
    if (this.currentMode !== 'pan') return;

    const dx = e.clientX - this.startPointer.x;
    const dy = e.clientY - this.startPointer.y;

    this.plannerService.setPan({
      x: Math.round(this.startPan.x + dx),
      y: Math.round(this.startPan.y + dy)
    });
  }

  onBackgroundPointerUp(e: PointerEvent): void {
    if (this.currentMode === 'pan') {
      this.currentMode = 'none';
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // an toàn
      }
    }
  }

  // ==========================================
  // POINTER EVENTS: KÉO VẬT THỂ (MOVE)
  // ==========================================
  onObjectPointerDown(e: PointerEvent, obj: PlannerObject): void {
    e.stopPropagation();
    if (e.button !== 0) return;

    // Chọn vật thể
    this.plannerService.selectObject(obj.id);

    // Nếu vật thể bị khóa thì không cho kéo
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
      aspectRatio: obj.width / obj.height
    };

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  }

  onObjectPointerMove(e: PointerEvent, obj: PlannerObject): void {
    if (this.currentMode !== 'drag-obj' || this.activeTransformObjId !== obj.id || !this.startObjState) return;

    const zoom = this.plannerService.zoom();
    const dx = (e.clientX - this.startPointer.x) / zoom;
    const dy = (e.clientY - this.startPointer.y) / zoom;

    const newX = this.startObjState.x + dx;
    const newY = this.startObjState.y + dy;

    this.plannerService.updateObjectPosition(obj.id, newX, newY, false);
  }

  onObjectPointerUp(e: PointerEvent, obj: PlannerObject): void {
    if (this.currentMode === 'drag-obj' && this.activeTransformObjId === obj.id) {
      // Ghi lại lịch sử sau khi buông chuột
      if (this.startObjState && (obj.x !== this.startObjState.x || obj.y !== this.startObjState.y)) {
        this.plannerService.recordHistory();
      }
      this.currentMode = 'none';
      this.activeTransformObjId = null;
      this.startObjState = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // an toàn
      }
    }
  }

  // ==========================================
  // POINTER EVENTS: XOAY VẬT THỂ (ROTATE)
  // ==========================================
  onRotateHandlePointerDown(e: PointerEvent, obj: PlannerObject): void {
    e.stopPropagation();
    if (e.button !== 0 || obj.isLocked) return;

    this.currentMode = 'rotate-obj';
    this.activeTransformObjId = obj.id;

    // Tìm tâm của vật thể trên màn hình
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
      aspectRatio: obj.width / obj.height
    };

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  }

  onRotateHandlePointerMove(e: PointerEvent, obj: PlannerObject): void {
    if (this.currentMode !== 'rotate-obj' || this.activeTransformObjId !== obj.id) return;

    const dx = e.clientX - this.objCenterScreen.x;
    const dy = e.clientY - this.objCenterScreen.y;

    // Tính góc xoay (độ)
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI) + 90; // +90 vì tay cầm ở hướng 12h

    // Giữ phím Shift để bước nhảy 15 độ
    if (e.shiftKey) {
      angleDeg = Math.round(angleDeg / 15) * 15;
    }

    this.plannerService.updateObjectRotation(obj.id, angleDeg, false);
  }

  onRotateHandlePointerUp(e: PointerEvent, obj: PlannerObject): void {
    if (this.currentMode === 'rotate-obj' && this.activeTransformObjId === obj.id) {
      if (this.startObjState && obj.rotation !== this.startObjState.rotation) {
        this.plannerService.recordHistory();
      }
      this.currentMode = 'none';
      this.activeTransformObjId = null;
      this.startObjState = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // an toàn
      }
    }
  }

  // ==========================================
  // POINTER EVENTS: THAY ĐỔI KÍCH THƯỚC GIỮ TỈ LỆ (RESIZE)
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
    this.startObjState = {
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      rotation: obj.rotation,
      aspectRatio: obj.width / obj.height
    };

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  }

  onResizeHandlePointerMove(e: PointerEvent, obj: PlannerObject): void {
    if (
      this.currentMode !== 'resize-obj' ||
      this.activeTransformObjId !== obj.id ||
      !this.startObjState
    ) {
      return;
    }

    const zoom = this.plannerService.zoom();
    const dx = (e.clientX - this.startPointer.x) / zoom;
    const dy = (e.clientY - this.startPointer.y) / zoom;
    const aspect = this.startObjState.aspectRatio;

    let newWidth = this.startObjState.width;
    let newHeight = this.startObjState.height;

    // Giữ tỉ lệ chiều rộng / chiều cao (aspect ratio)
    if (this.resizeHandleType === 'se') {
      const delta = Math.max(dx, dy * aspect);
      newWidth = Math.max(30, this.startObjState.width + delta);
      newHeight = Math.max(20, newWidth / aspect);
    } else if (this.resizeHandleType === 'sw') {
      const delta = Math.max(-dx, dy * aspect);
      newWidth = Math.max(30, this.startObjState.width + delta);
      newHeight = Math.max(20, newWidth / aspect);
    } else if (this.resizeHandleType === 'ne') {
      const delta = Math.max(dx, -dy * aspect);
      newWidth = Math.max(30, this.startObjState.width + delta);
      newHeight = Math.max(20, newWidth / aspect);
    } else if (this.resizeHandleType === 'nw') {
      const delta = Math.max(-dx, -dy * aspect);
      newWidth = Math.max(30, this.startObjState.width + delta);
      newHeight = Math.max(20, newWidth / aspect);
    }

    this.plannerService.updateObjectSize(obj.id, newWidth, newHeight, false);
  }

  onResizeHandlePointerUp(e: PointerEvent, obj: PlannerObject): void {
    if (this.currentMode === 'resize-obj' && this.activeTransformObjId === obj.id) {
      if (this.startObjState && (obj.width !== this.startObjState.width || obj.height !== this.startObjState.height)) {
        this.plannerService.recordHistory();
      }
      this.currentMode = 'none';
      this.activeTransformObjId = null;
      this.startObjState = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // an toàn
      }
    }
  }

  // ==========================================
  // FLOATING QUICK ACTIONS (VẬT THỂ ĐANG CHỌN)
  // ==========================================
  rotateSelected90(): void {
    const sel = this.plannerService.selectedObject();
    if (sel) this.plannerService.rotate90(sel.id);
  }

  bringSelectedForward(): void {
    const sel = this.plannerService.selectedObject();
    if (sel) this.plannerService.bringForward(sel.id);
  }

  sendSelectedBackward(): void {
    const sel = this.plannerService.selectedObject();
    if (sel) this.plannerService.sendBackward(sel.id);
  }

  toggleSelectedLock(): void {
    const sel = this.plannerService.selectedObject();
    if (sel) this.plannerService.toggleLock(sel.id);
  }

  duplicateSelected(): void {
    const sel = this.plannerService.selectedObject();
    if (sel) this.plannerService.duplicateObject(sel.id);
  }

  deleteSelected(): void {
    const sel = this.plannerService.selectedObject();
    if (sel) this.plannerService.deleteObject(sel.id);
  }
}
