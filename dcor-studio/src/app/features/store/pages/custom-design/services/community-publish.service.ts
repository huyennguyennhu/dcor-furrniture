import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, TimeoutError, from, of, switchMap, throwError, timeout, finalize, tap, catchError } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../core/services/auth.service';
import { RoomPlannerService } from './room-planner.service';
import { PlannerBackground, PlannerObject, RoomDimensions } from '../models/planner.model';

export interface TaggedProductItem {
  x: number; // 0 - 100, 1 chữ số thập phân
  y: number; // 0 - 100, 1 chữ số thập phân
  productId: string;
  name: string;
  price: number; // số nguyên VND
}

export interface DesignPostPayload {
  title: string;
  authorName: string;
  description?: string;
  imageUrl: string;
  taggedProducts: TaggedProductItem[];
}

export interface TempDesignSessionState {
  background: PlannerBackground;
  dimensions: RoomDimensions;
  objects: PlannerObject[];
  savedAt: number;
}

const SESSION_STORAGE_KEY = 'dcor_custom_design_session_temp';
const UPLOAD_TIMEOUT_MS = 60000; // 60 giây cho upload ảnh
const PUBLISH_TIMEOUT_MS = 20000; // 20 giây cho tạo bài đăng

@Injectable()
export class CommunityPublishService {
  readonly isExporting = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly lastPublishedFingerprint = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private plannerService: RoomPlannerService
  ) {}

  /**
   * Tính toán fingerprint bố cục hiện tại để chống gửi bài trùng lặp
   */
  getLayoutFingerprint(): string {
    const bg = this.plannerService.background();
    const dims = this.plannerService.dimensions();
    const objs = this.plannerService.objects();

    if (!bg || objs.length === 0) return '';

    const sortedObjTokens = objs
      .map(o => `${o.productId}:${Math.round(o.x)}:${Math.round(o.y)}:${Math.round(o.width)}:${Math.round(o.height)}:${Math.round(o.rotation || 0)}`)
      .sort()
      .join(';');

    return `${bg.imageUrl || bg.name}|${dims?.length || 0}x${dims?.width || 0}|${sortedObjTokens}`;
  }

  /**
   * Kiểm tra xem bố cục hiện tại đã bị gửi trùng trong cùng phiên chưa
   */
  hasLayoutChangedSincePublish(): boolean {
    const lastFp = this.lastPublishedFingerprint();
    if (!lastFp) return true;
    return this.getLayoutFingerprint() !== lastFp;
  }

  /**
   * Đánh dấu bố cục vừa đăng thành công
   */
  markLayoutAsPublished(): void {
    this.lastPublishedFingerprint.set(this.getLayoutFingerprint());
  }

  /**
   * Danh sách gắn thẻ tối đa 15 sản phẩm từ các vật thể trong phòng
   */
  getTaggedProducts(): TaggedProductItem[] {
    const bg = this.plannerService.background();
    const objs = this.plannerService.objects();
    if (!bg || objs.length === 0) return [];

    const roomW = bg.naturalWidth || 1200;
    const roomH = bg.naturalHeight || 800;

    return objs.slice(0, 15).map(obj => {
      // Tâm vật thể
      const centerX = obj.x + (obj.width / 2);
      const centerY = obj.y + (obj.height / 2);

      // Tính phần trăm so với ảnh nền
      const rawX = (centerX / roomW) * 100;
      const rawY = (centerY / roomH) * 100;

      // Kẹp trong [0, 100] và làm tròn 1 chữ số thập phân
      const clampedX = Math.max(0, Math.min(100, rawX));
      const clampedY = Math.max(0, Math.min(100, rawY));
      const x = Math.round(clampedX * 10) / 10;
      const y = Math.round(clampedY * 10) / 10;

      return {
        x,
        y,
        productId: obj.productId,
        name: obj.name,
        price: Math.round(obj.unitPrice || 0)
      };
    });
  }

  /**
   * Ghép ảnh nền + vật thể lên Canvas (hỗ trợ điều chỉnh maxEdge, xử lý tainted canvas)
   */
  async renderDesignCanvas(maxEdge = 1600, forceFallbackBoxes = false): Promise<{
    canvas: HTMLCanvasElement;
    isTainted: boolean;
    warning?: string;
  }> {
    const bg = this.plannerService.background();
    if (!bg) {
      throw new Error('Chưa chọn không gian phòng để xuất ảnh.');
    }

    const naturalW = bg.naturalWidth || 1200;
    const naturalH = bg.naturalHeight || 800;
    const longest = Math.max(naturalW, naturalH);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const canvasW = Math.round(naturalW * scale);
    const canvasH = Math.round(naturalH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Không thể khởi tạo môi trường vẽ 2D.');
    }

    // Nền trắng mặc định
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Tải ảnh nền phòng
    let bgImg: HTMLImageElement | null = null;
    let bgLoadFailed = false;
    if (bg.imageUrl) {
      try {
        bgImg = await this.loadImage(bg.imageUrl, bg.imageUrl.startsWith('data:') ? undefined : 'anonymous');
      } catch {
        bgLoadFailed = true;
      }
    }

    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, canvasW, canvasH);
    } else {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = '#6b7280';
      ctx.font = `600 ${Math.round(20 * scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bg.name || 'Không gian thiết kế DCor', canvasW / 2, canvasH / 2);
    }

    // Sắp xếp các vật thể theo thứ tự lớp zIndex tăng dần
    const objects = [...this.plannerService.objects()].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    let hasFallbackBox = forceFallbackBoxes;

    // Tải trước ảnh sản phẩm (có xử lý crossOrigin='anonymous')
    for (const obj of objects) {
      let objImg: HTMLImageElement | null = null;

      if (!forceFallbackBoxes && obj.imageUrl) {
        try {
          objImg = await this.loadImage(obj.imageUrl, 'anonymous');
        } catch {
          hasFallbackBox = true;
          objImg = null;
        }
      }

      // Tọa độ tâm vật thể đã scale
      const cx = (obj.x + obj.width / 2) * scale;
      const cy = (obj.y + obj.height / 2) * scale;
      const w = obj.width * scale;
      const h = obj.height * scale;
      const rotRad = ((obj.rotation || 0) * Math.PI) / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotRad);

      if (objImg) {
        ctx.drawImage(objImg, -w / 2, -h / 2, w, h);
      } else {
        // Fallback: vẽ khung chữ nhật đại diện có tên sản phẩm
        hasFallbackBox = true;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#765337';
        ctx.lineWidth = Math.max(1, Math.round(2 * scale));
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(-w / 2, -h / 2, w, h, 6 * scale);
        } else {
          ctx.rect(-w / 2, -h / 2, w, h);
        }
        ctx.fill();
        ctx.stroke();

        // Nhãn tên sản phẩm
        ctx.fillStyle = '#765337';
        const fontSize = Math.max(9, Math.min(18, Math.round(12 * scale)));
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxChars = Math.max(8, Math.floor(w / (fontSize * 0.55)));
        const text = obj.name.length > maxChars ? obj.name.slice(0, maxChars - 1) + '…' : obj.name;
        ctx.fillText(text, 0, 0);
      }

      ctx.restore();
    }

    // Kiểm tra xem canvas có bị chặn bản quyền (tainted) hay không bằng cách gọi thử toDataURL()
    let isTainted = false;
    try {
      canvas.toDataURL('image/jpeg', 0.5);
    } catch {
      isTainted = true;
    }

    // Nếu bị tainted mà chưa ở chế độ fallback thì render lại toàn bộ bằng fallback khung
    if (isTainted && !forceFallbackBoxes) {
      return this.renderDesignCanvas(maxEdge, true);
    }

    const warning = (hasFallbackBox || isTainted || bgLoadFailed)
      ? 'Một số ảnh sản phẩm không hỗ trợ chia sẻ ngoài đã được hiển thị bằng khung thay thế.'
      : undefined;

    return { canvas, isTainted: hasFallbackBox || isTainted, warning };
  }

  /**
   * Tạo Blob từ Canvas với định dạng yêu cầu (chất lượng cao cho xuất file PNG)
   */
  async generateBlob(format: 'image/png' | 'image/jpeg', quality = 0.85): Promise<{
    blob: Blob;
    isTainted: boolean;
    warning?: string;
  }> {
    const { canvas, isTainted, warning } = await this.renderDesignCanvas(1600);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, isTainted, warning });
          } else {
            reject(new Error('Không thể tạo file ảnh từ bản vẽ.'));
          }
        },
        format,
        quality
      );
    });
  }

  /**
   * Nén ảnh tự động trước khi tải lên Cộng đồng:
   * 1. Ghép canvas với cạnh dài tối đa 1280px, xuất JPEG bằng toBlob
   * 2. Nếu > 800KB thì giảm chất lượng lần lượt: 0.8 -> 0.7 -> 0.6 -> 0.5
   * 3. Nếu vẫn > 800KB thì giảm cạnh dài xuống 1024 -> 800 (cùng các mức chất lượng trên)
   * 4. Dừng ngay khi dung lượng <= 800KB
   */
  async generateCompressedBlobForPublish(): Promise<{
    blob: Blob;
    isTainted: boolean;
    warning?: string;
    sizeBytes: number;
    sizeKb: number;
    finalQuality: number;
    finalMaxEdge: number;
  }> {
    const TARGET_MAX_BYTES = 800 * 1024; // 800KB
    const edgeSteps = [1280, 1024, 800];
    const qualitySteps = [0.8, 0.7, 0.6, 0.5];

    let lastBlob: Blob | null = null;
    let lastTainted = false;
    let lastWarning: string | undefined = undefined;
    let lastQuality = 0.5;
    let lastEdge = 800;

    for (const maxEdge of edgeSteps) {
      const { canvas, isTainted, warning } = await this.renderDesignCanvas(maxEdge);
      lastTainted = isTainted;
      lastWarning = warning;
      lastEdge = maxEdge;

      for (const q of qualitySteps) {
        lastQuality = q;
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', q);
        });

        if (blob) {
          lastBlob = blob;
          if (blob.size <= TARGET_MAX_BYTES) {
            const sizeKb = Math.round(blob.size / 1024);
            return {
              blob,
              isTainted,
              warning,
              sizeBytes: blob.size,
              sizeKb,
              finalQuality: q,
              finalMaxEdge: maxEdge
            };
          }
        }
      }
    }

    if (!lastBlob) {
      throw new Error('Không thể tạo file ảnh từ bản vẽ.');
    }

    const sizeKb = Math.round(lastBlob.size / 1024);
    return {
      blob: lastBlob,
      isTainted: lastTainted,
      warning: lastWarning,
      sizeBytes: lastBlob.size,
      sizeKb,
      finalQuality: lastQuality,
      finalMaxEdge: lastEdge
    };
  }

  /**
   * Tải ảnh thiết kế về máy (dcor-thiet-ke-YYYYMMDD.png)
   */
  /**
   * Tạo ảnh bìa thiết kế nén chuẩn (cạnh dài 640px, JPEG <= 150KB) tải qua /upload/image
   */
  async generateCoverBlob(maxEdge = 640, maxSizeBytes = 150 * 1024): Promise<Blob> {
    const { canvas } = await this.renderDesignCanvas(maxEdge);
    let quality = 0.8;
    let blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality));

    while (blob && blob.size > maxSizeBytes && quality > 0.25) {
      quality -= 0.1;
      blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality));
    }

    if (!blob) {
      throw new Error('Không thể tạo ảnh bìa thiết kế.');
    }
    return blob;
  }

  async exportAndDownloadPng(): Promise<{ isTainted: boolean; warning?: string }> {
    this.isExporting.set(true);
    try {
      const { blob, isTainted, warning } = await this.generateBlob('image/png');
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const fileName = `dcor-thiet-ke-${yyyy}${mm}${dd}.png`;

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.setAttribute('aria-label', `Tải về ảnh ${fileName}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      return { isTainted, warning };
    } finally {
      this.isExporting.set(false);
    }
  }

  /**
   * Lưu trạng thái tạm thời của phiên thiết kế vào sessionStorage trước khi chuyển trang đăng nhập
   */
  async saveTempSessionState(): Promise<void> {
    if (typeof window === 'undefined') return;

    const bg = this.plannerService.background();
    const dims = this.plannerService.dimensions();
    const objs = this.plannerService.objects();

    if (!bg || !dims) return;

    let compressedImageUrl = bg.imageUrl;

    // Nếu ảnh nền do người dùng upload, nén thành JPEG dataURL để không vượt giới hạn sessionStorage
    if (bg.type === 'upload' && bg.imageUrl) {
      try {
        compressedImageUrl = await this.compressImageToDataUrl(bg.imageUrl, 1200, 0.75);
      } catch {
        compressedImageUrl = bg.imageUrl;
      }
    }

    const stateToSave: TempDesignSessionState = {
      background: {
        ...bg,
        imageUrl: compressedImageUrl,
        file: undefined // File không serialize được qua JSON
      },
      dimensions: { ...dims },
      objects: JSON.parse(JSON.stringify(objs)),
      savedAt: Date.now()
    };

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Bỏ qua nếu sessionStorage bị đầy hoặc chặn
    }
  }

  /**
   * Khôi phục trạng thái tạm thời từ sessionStorage sau khi đăng nhập thành công và xóa khóa
   */
  restoreTempSessionStateIfAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return false;

    try {
      const data: TempDesignSessionState = JSON.parse(raw);
      if (data && data.background && data.dimensions && Array.isArray(data.objects)) {
        this.plannerService.background.set(data.background);
        this.plannerService.dimensions.set(data.dimensions);
        this.plannerService.objects.set(data.objects);
        this.plannerService.currentStep.set('planner');
        this.plannerService.recordHistory(data.objects);
        return true;
      }
    } catch {
      return false;
    } finally {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    return false;
  }

  /**
   * Chuyển hướng tới trang đăng nhập có lưu returnUrl và lưu phiên tạm
   */
  async redirectToLoginWithSavedState(): Promise<void> {
    await this.saveTempSessionState();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/custom-design' }
    });
  }

  /**
   * Tải ảnh lên máy chủ Cloudinary qua multipart/form-data
   */
  /**
   * Tải ảnh lên máy chủ qua multipart/form-data (timeout 60 giây)
   */
  uploadImage(imageBlob: Blob): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', imageBlob, 'dcor-design.jpg');

    return this.http
      .post<{ url: string }>(`${environment.apiUrl}/upload/image`, formData)
      .pipe(timeout(UPLOAD_TIMEOUT_MS));
  }

  /**
   * Gửi tạo bài đăng thiết kế mới (timeout 20 giây)
   */
  createDesignPost(payload: DesignPostPayload): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/designs/posts`, payload)
      .pipe(timeout(PUBLISH_TIMEOUT_MS));
  }

  /**
   * Toàn bộ quy trình gửi bài: Tải ảnh (60s) -> Lấy URL -> Tạo bài đăng (20s)
   */
  publishDesign(title: string, description: string, imageBlob: Blob): Observable<any> {
    if (this.isSubmitting()) {
      return throwError(() => new Error('Yêu cầu đang được xử lý, vui lòng không nhấn liên tục.'));
    }

    const currentUser = this.authService.getCurrentUser();
    const authorName = currentUser?.fullName?.trim() || 'Khách hàng DCor';
    const taggedProducts = this.getTaggedProducts();

    this.isSubmitting.set(true);

    return this.uploadImage(imageBlob).pipe(
      catchError((uploadErr) => {
        (uploadErr as any).stage = 'upload';
        return throwError(() => uploadErr);
      }),
      switchMap((uploadRes) => {
        if (!uploadRes || !uploadRes.url) {
          throw new Error('Không nhận được liên kết ảnh sau khi tải lên.');
        }

        const payload: DesignPostPayload = {
          title: title.trim(),
          authorName,
          description: description.trim() || undefined,
          imageUrl: uploadRes.url,
          taggedProducts
        };

        return this.createDesignPost(payload).pipe(
          catchError((postErr) => {
            (postErr as any).stage = 'post';
            return throwError(() => postErr);
          })
        );
      }),
      tap((postRes) => {
        this.markLayoutAsPublished();
      }),
      finalize(() => {
        this.isSubmitting.set(false);
      })
    );
  }

  /**
   * Chuyển đổi mã trạng thái HTTP sang thông báo tiếng Việt chi tiết (xử lý riêng 413, 0, 5xx và server message)
   */
  formatHttpError(err: any): string {
    if (!err) {
      return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    }

    const serverMsg = err.error?.message || err.error?.error || '';

    // Timeout (RxJS TimeoutError)
    if (err instanceof TimeoutError || err.name === 'TimeoutError') {
      if ((err as any)?.stage === 'upload') {
        return 'Quá thời gian tải ảnh lên máy chủ (60 giây). Vui lòng kiểm tra lại kết nối mạng.';
      }
      return 'Quá thời gian gửi bài đăng (20 giây). Vui lòng kiểm tra lại kết nối mạng.';
    }

    // 413: Tệp quá lớn
    if (err.status === 413) {
      return serverMsg 
        ? `Tệp ảnh tải lên quá lớn (Lỗi 413): ${serverMsg}` 
        : 'Tệp ảnh vượt quá dung lượng cho phép của máy chủ (Lỗi 413: Payload Too Large). Vui lòng thử lại.';
    }

    // Status 0: Không kết nối được tới server
    if (err.status === 0) {
      return 'Không thể kết nối đến máy chủ (Mã lỗi 0). Vui lòng kiểm tra lại đường truyền mạng hoặc máy chủ.';
    }

    // 5xx: Lỗi server (500, 502, 503, 504...)
    if (typeof err.status === 'number' && err.status >= 500 && err.status < 600) {
      return serverMsg
        ? `Lỗi máy chủ (${err.status}): ${serverMsg}`
        : `Hệ thống máy chủ đang gặp sự cố (Mã lỗi ${err.status}). Vui lòng thử lại sau.`;
    }

    // 400: Dữ liệu không hợp lệ
    if (err.status === 400) {
      return serverMsg || 'Thông tin gửi bài không hợp lệ. Vui lòng kiểm tra lại tiêu đề.';
    }

    // 401 / 403: Hết hạn đăng nhập
    if (err.status === 401 || err.status === 403) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại tài khoản.';
    }

    // 429: Gửi quá nhiều
    if (err.status === 429) {
      return 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ giây lát rồi thử lại.';
    }

    if (serverMsg) {
      return serverMsg;
    }

    return err.message || 'Đã có lỗi xảy ra trong quá trình gửi bài.';
  }

  /**
   * Nén ảnh bất kỳ thành DataURL phục vụ lưu sessionStorage
   */
  private compressImageToDataUrl(url: string, maxDim: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const longest = Math.max(img.naturalWidth, img.naturalHeight);
        const scale = longest > maxDim ? maxDim / longest : 1;
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(url);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(url);
      img.src = url;
    });
  }

  /**
   * Helper tải ảnh bằng Promise
   */
  private loadImage(url: string, crossOrigin?: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }
}
