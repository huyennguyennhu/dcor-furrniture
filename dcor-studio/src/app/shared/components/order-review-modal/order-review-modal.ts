import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { 
  LucideAngularModule, 
  Star, 
  Camera, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Plus
} from 'lucide-angular';
import { ReviewService, ProductReviewInput } from '../../../core/services/review.service';

export interface ReviewModalItem {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantDescription?: string;
  price?: number;
  quantity?: number;
}

export interface ProductReviewFormState {
  orderItemId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantDescription?: string;
  rating: number;
  hoverRating: number;
  comment: string;
  images: string[];
  uploadingImages: boolean;
}

@Component({
  selector: 'app-order-review-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './order-review-modal.html',
  styleUrls: ['./order-review-modal.css']
})
export class OrderReviewModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() orderNumber = '';
  @Input() items: ReviewModalItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('cameraCanvas') cameraCanvas?: ElementRef<HTMLCanvasElement>;

  icons = {
    Star,
    Camera,
    Upload,
    X,
    Check,
    AlertCircle,
    Loader2,
    ImageIcon,
    Trash2,
    RefreshCw,
    ShieldCheck,
    Plus
  };

  forms: ProductReviewFormState[] = [];
  isAnonymous = false;
  isSubmitting = false;
  errorMessage = '';
  successToast = '';

  // Camera Live Stream state
  isCameraActive = false;
  activeCameraItemIndex: number | null = null;
  private mediaStream: MediaStream | null = null;

  ratingLabels: { [key: number]: string } = {
    1: 'Rất không hài lòng',
    2: 'Chưa hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất tuyệt vời'
  };

  constructor(
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || (changes['isOpen'] && this.isOpen)) {
      this.initForms();
      this.errorMessage = '';
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  initForms(): void {
    if (!this.items || this.items.length === 0) {
      this.forms = [];
      this.cdr.markForCheck();
      return;
    }

    this.forms = this.items.map(item => ({
      orderItemId: item.orderItemId,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      variantDescription: item.variantDescription,
      rating: 5, // Mặc định 5 sao
      hoverRating: 0,
      comment: '',
      images: [],
      uploadingImages: false
    }));
    this.cdr.markForCheck();
  }

  setRating(index: number, rating: number): void {
    if (this.forms[index]) {
      this.forms[index].rating = rating;
      this.cdr.markForCheck();
    }
  }

  setHoverRating(index: number, rating: number): void {
    if (this.forms[index]) {
      this.forms[index].hoverRating = rating;
      this.cdr.markForCheck();
    }
  }

  getRatingText(rating: number): string {
    return this.ratingLabels[rating] || 'Tuyệt vời';
  }

  // Tải ảnh qua File Input
  onFilesSelected(event: Event, itemIndex: number): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files: File[] = Array.from(input.files);
    this.uploadFiles(files, itemIndex);
    input.value = ''; // Reset input để cho phép chọn lại cùng file
  }

  
  /**
   * Kích hoạt chụp ảnh từ camera:
   * Nếu trên di động hoặc fallback thì trigger input native capture=environment
   * Nếu trên desktop hoặc hỗ trợ getUserMedia thì mở modal stream camera
   */
  triggerCamera(itemIndex: number, cameraInput?: HTMLInputElement): void {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && cameraInput) {
      cameraInput.click();
    } else {
      this.openCamera(itemIndex, cameraInput);
    }
  }

  /**
   * Nén ảnh client-side qua Canvas siêu tốc bằng URL.createObjectURL:
   * Giới hạn kích thước tối đa 1200px, JPEG chất lượng 0.8.
   * Nếu file ban đầu đã nhỏ (<= 150KB), hoàn tất ngay lập tức (0ms).
   */
  private compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      if (file.size <= 150 * 1024) {
        resolve(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    });
  }

  // Upload danh sách file với nén siêu tốc song song và markForCheck() tức thời
  private async uploadFiles(files: File[], itemIndex: number): Promise<void> {
    const form = this.forms[itemIndex];
    if (!form) return;

    if (form.images.length + files.length > 5) {
      this.errorMessage = 'Mỗi sản phẩm chỉ được tải lên tối đa 5 hình ảnh.';
      this.cdr.markForCheck();
      return;
    }

    form.uploadingImages = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      form.uploadingImages = false;
      this.cdr.markForCheck();
      return;
    }

    try {
      // 1. Nén tất cả ảnh song song bằng Canvas
      const compressedBlobs = await Promise.all(
        validFiles.map(file => this.compressImage(file))
      );

      // 2. Upload đồng thời các ảnh lên Cloudinary
      const uploadPromises = compressedBlobs.map(blob =>
        firstValueFrom(this.reviewService.uploadImage(blob)).catch(err => {
          console.error('Lỗi tải ảnh lên Cloudinary:', err);
          return null;
        })
      );

      const results = await Promise.all(uploadPromises);

      for (const res of results) {
        if (res && res.url) {
          form.images.push(res.url);
        }
      }

      const failedCount = results.filter(r => !r || !r.url).length;
      if (failedCount > 0) {
        this.errorMessage = `Đã tải ${results.length - failedCount}/${results.length} ảnh. Một số ảnh tải lên thất bại.`;
      }
    } catch (err) {
      console.error('Lỗi quá trình nén và tải ảnh:', err);
      this.errorMessage = 'Có lỗi xảy ra khi nén và tải ảnh. Vui lòng thử lại.';
    } finally {
      form.uploadingImages = false;
      this.cdr.markForCheck();
    }
  }

  removeImage(itemIndex: number, imageIndex: number): void {
    const form = this.forms[itemIndex];
    if (form && form.images) {
      form.images.splice(imageIndex, 1);
      this.cdr.markForCheck();
    }
  }

  // ============================================
  // CAMERA LIVE CAPTURE STREAM
  // ============================================
  openCamera(itemIndex: number, fallbackInput?: HTMLInputElement): void {
    this.activeCameraItemIndex = itemIndex;
    this.isCameraActive = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    if (!navigator.mediaDevices?.getUserMedia) {
      this.closeCamera();
      if (fallbackInput) {
        fallbackInput.click();
      } else {
        this.errorMessage = 'Thiết bị không hỗ trợ camera trực tiếp. Vui lòng chọn tải ảnh lên.';
        this.cdr.markForCheck();
      }
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    .then(stream => {
      this.mediaStream = stream;
      this.cdr.markForCheck();
      setTimeout(() => {
        if (this.cameraVideo?.nativeElement) {
          this.cameraVideo.nativeElement.srcObject = stream;
          this.cameraVideo.nativeElement.play().catch(e => console.warn(e));
        }
      }, 100);
    })
    .catch(err => {
      console.warn('Không thể truy cập camera trực tiếp qua getUserMedia:', err);
      this.closeCamera();
      if (fallbackInput) {
        fallbackInput.click();
      } else {
        this.errorMessage = 'Không thể mở camera thiết bị. Vui lòng cấp quyền trong cài đặt trình duyệt hoặc chọn tải ảnh lên.';
        this.cdr.markForCheck();
      }
    });
  }

  capturePhoto(): void {
    if (this.activeCameraItemIndex === null || !this.cameraVideo?.nativeElement || !this.cameraCanvas?.nativeElement) {
      return;
    }

    const video = this.cameraVideo.nativeElement;
    const canvas = this.cameraCanvas.nativeElement;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const targetForm = this.forms[this.activeCameraItemIndex];
      if (targetForm) {
        if (targetForm.images.length >= 5) {
          this.errorMessage = 'Mỗi sản phẩm chỉ được tải lên tối đa 5 hình ảnh.';
          this.closeCamera();
          this.cdr.markForCheck();
          return;
        }

        targetForm.uploadingImages = true;
        this.cdr.markForCheck();
        this.closeCamera();

        canvas.toBlob((blob) => {
          if (!blob) {
            targetForm.uploadingImages = false;
            this.cdr.markForCheck();
            return;
          }

          this.reviewService.uploadImage(blob).subscribe({
            next: (res: any) => {
              targetForm.uploadingImages = false;
              if (res?.url) {
                targetForm.images.push(res.url);
              }
              this.cdr.markForCheck();
            },
            error: (err: any) => {
              targetForm.uploadingImages = false;
              console.error('Lỗi upload ảnh chụp:', err);
              this.errorMessage = 'Không thể tải ảnh chụp lên. Vui lòng thử lại.';
              this.cdr.markForCheck();
            }
          });
        }, 'image/jpeg', 0.82);
        return;
      }
    }

    this.closeCamera();
  }

  closeCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive = false;
    this.activeCameraItemIndex = null;
    this.cdr.markForCheck();
  }

  // ============================================
  // GỬI ĐÁNH GIÁ
  // ============================================
  submitReviews(): void {
    if (this.isSubmitting) return;

    const isUploading = this.forms.some(f => f.uploadingImages);
    if (isUploading) {
      this.errorMessage = 'Ảnh đang được tải lên máy chủ. Vui lòng đợi trong giây lát...';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const payloadReviews: ProductReviewInput[] = this.forms.map(f => ({
      orderItemId: f.orderItemId,
      productId: f.productId,
      productName: f.productName,
      productImage: f.productImage,
      variantDescription: f.variantDescription,
      rating: f.rating || 5,
      comment: f.comment.trim() || 'Sản phẩm rất đẹp, đúng như mô tả!',
      images: f.images || []
    }));

    this.reviewService.submitOrderReviews(this.orderNumber, payloadReviews, this.isAnonymous).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.successToast = res.message || 'Cảm ơn bạn đã gửi đánh giá cho sản phẩm!';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successToast = '';
          this.submitted.emit();
          this.handleClose();
        }, 1200);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Lỗi khi gửi đánh giá:', err);
        this.errorMessage = err?.error?.message || 'Có lỗi xảy ra khi lưu đánh giá. Vui lòng thử lại sau.';
        this.cdr.markForCheck();
      }
    });
  }

  handleClose(): void {
    this.closeCamera();
    this.close.emit();
  }
}
