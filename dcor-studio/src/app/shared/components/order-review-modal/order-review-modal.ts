import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  ShieldCheck
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
    ShieldCheck
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

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.initForms();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] || (changes['isOpen'] && this.isOpen)) {
      this.initForms();
      this.errorMessage = '';
      this.isSubmitting = false;
    }
  }

  initForms(): void {
    if (!this.items || this.items.length === 0) {
      this.forms = [];
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
  }

  setRating(index: number, rating: number): void {
    if (this.forms[index]) {
      this.forms[index].rating = rating;
    }
  }

  setHoverRating(index: number, rating: number): void {
    if (this.forms[index]) {
      this.forms[index].hoverRating = rating;
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
   * Nén ảnh client-side qua Canvas: scale tối đa 1200px, nén webp/jpeg 0.8
   * Giảm dung lượng file từ 5-10MB xuống ~100-200KB giúp upload siêu tốc
   */
  private compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

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
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            quality
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  // Upload danh sách file với nén siêu tốc
  private async uploadFiles(files: File[], itemIndex: number): Promise<void> {
    const form = this.forms[itemIndex];
    if (!form) return;

    if (form.images.length + files.length > 5) {
      this.errorMessage = 'Mỗi sản phẩm chỉ được tải lên tối đa 5 hình ảnh.';
      return;
    }

    form.uploadingImages = true;
    this.errorMessage = '';

    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      form.uploadingImages = false;
      return;
    }

    let completedCount = 0;

    for (const file of validFiles) {
      try {
        // Nén ảnh client-side
        const compressedBlob = await this.compressImage(file);
        
        this.reviewService.uploadImage(compressedBlob).subscribe({
          next: (res: any) => {
            if (res?.url) {
              form.images.push(res.url);
            }
            completedCount++;
            if (completedCount === validFiles.length) {
              form.uploadingImages = false;
            }
          },
          error: (err: any) => {
            console.error('Lỗi tải ảnh lên:', err);
            completedCount++;
            if (completedCount === validFiles.length) {
              form.uploadingImages = false;
            }
            this.errorMessage = 'Không thể tải lên một số ảnh. Vui lòng thử lại.';
          }
        });
      } catch (e) {
        completedCount++;
        if (completedCount === validFiles.length) {
          form.uploadingImages = false;
        }
      }
    }
  }

  removeImage(itemIndex: number, imageIndex: number): void {
    const form = this.forms[itemIndex];
    if (form && form.images) {
      form.images.splice(imageIndex, 1);
    }
  }

  // ============================================
  // CAMERA LIVE CAPTURE STREAM
  // ============================================
  openCamera(itemIndex: number): void {
    this.activeCameraItemIndex = itemIndex;
    this.isCameraActive = true;
    this.errorMessage = '';

    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    .then(stream => {
      this.mediaStream = stream;
      setTimeout(() => {
        if (this.cameraVideo?.nativeElement) {
          this.cameraVideo.nativeElement.srcObject = stream;
          this.cameraVideo.nativeElement.play();
        }
      }, 100);
    })
    .catch(err => {
      console.warn('Không thể truy cập camera trực tiếp qua getUserMedia:', err);
      this.closeCamera();
      const fallbackInput = document.getElementById(`camera-fallback-${itemIndex}`) as HTMLInputElement;
      if (fallbackInput) {
        fallbackInput.click();
      } else {
        this.errorMessage = 'Không thể mở camera thiết bị. Vui lòng cấp quyền camera trong cài đặt trình duyệt hoặc chọn tải ảnh lên.';
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const targetForm = this.forms[this.activeCameraItemIndex];
      if (targetForm) {
        if (targetForm.images.length >= 5) {
          this.errorMessage = 'Mỗi sản phẩm chỉ được tải lên tối đa 5 hình ảnh.';
          this.closeCamera();
          return;
        }

        targetForm.uploadingImages = true;
        this.reviewService.uploadBase64Image(dataUrl).subscribe({
          next: (res: any) => {
            targetForm.uploadingImages = false;
            if (res?.url) {
              targetForm.images.push(res.url);
            }
          },
          error: (err: any) => {
            targetForm.uploadingImages = false;
            console.error('Lỗi upload ảnh chụp:', err);
            targetForm.images.push(dataUrl);
          }
        });
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
  }

  // ============================================
  // GỬI ĐÁNH GIÁ
  // ============================================
  submitReviews(): void {
    if (this.isSubmitting) return;

    const isUploading = this.forms.some(f => f.uploadingImages);
    if (isUploading) {
      this.errorMessage = 'Ảnh đang được tải lên máy chủ. Vui lòng đợi trong giây lát...';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

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
      }
    });
  }

  handleClose(): void {
    this.closeCamera();
    this.close.emit();
  }
}
