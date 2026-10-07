import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hover-image-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hover-image-slider.html',
  styleUrls: ['./hover-image-slider.css']
})
export class HoverImageSlider implements OnDestroy {
  @Input() images: string[] = [];
  @Input() altText: string = '';
  @Input() onSale: boolean = false;
  @Input() isBestSeller: boolean = false;
  @Input() isNew: boolean = false;
  @Input() discountType?: string;
  @Input() discountValue?: number;

  currentIndex: number = 0;
  isHovered: boolean = false;
  private intervalId: any;

  get validImages(): string[] {
    return this.images && this.images.length > 0 ? this.images : [''];
  }

  onMouseEnter() {
    this.isHovered = true;
    if (this.validImages.length > 1) {
      this.intervalId = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.validImages.length;
      }, 1200);
    }
  }

  onMouseLeave() {
    this.isHovered = false;
    this.currentIndex = 0;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  get formattedDiscount(): string {
    if (!this.discountType || !this.discountValue) return 'Sale';
    if (this.discountType === 'PERCENTAGE') {
      return `Giảm ${this.discountValue}%`;
    } else {
      return `Giảm ${new Intl.NumberFormat('vi-VN').format(this.discountValue)}đ`;
    }
  }
}
