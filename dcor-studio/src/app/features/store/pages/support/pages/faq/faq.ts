import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../../data/faq-data';
import { FaqCategory, FaqItem, OtherPolicyLink } from '../../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS
} from '../../support-config';
import { getOtherPolicies } from '../../data/other-policies.data';
import { ShowroomConsultationModalComponent } from '../../../../../../shared/components/showroom-consultation-modal/showroom-consultation-modal';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, ShowroomConsultationModalComponent],
  templateUrl: './faq.html',
  styleUrls: ['./faq.css']
})
export class FaqComponent implements OnInit {
  private titleService = inject(Title);

  isConsultationModalOpen = false;

  readonly hotline = HOTLINE;
  readonly email = EMAIL;
  readonly address = ADDRESS;
  readonly workingHours = WORKING_HOURS;

  readonly categories = FAQ_CATEGORIES;
  readonly allFaqs = FAQ_ITEMS;

  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('all');
  readonly expandedItems = signal<Record<string, boolean>>({});

  readonly otherPolicies = computed<OtherPolicyLink[]>(() => {
    return getOtherPolicies('/faq');
  });

  readonly categoryCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = { all: this.allFaqs.length };
    this.allFaqs.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  });

  readonly filteredFaqs = computed<FaqItem[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    return this.allFaqs.filter(item => {
      const matchCat = cat === 'all' || item.category === cat;
      if (!matchCat) return false;

      if (!query) return true;

      const qText = item.question.toLowerCase();
      const aText = item.answer.toLowerCase();
      const tagsText = item.tags.join(' ').toLowerCase();

      return qText.includes(query) || aText.includes(query) || tagsText.includes(query);
    });
  });

  readonly selectedCategoryName = computed<string>(() => {
    const cat = this.categories.find(c => c.id === this.selectedCategory());
    return cat ? cat.name : 'Tất cả câu hỏi';
  });

  readonly selectedCategoryDesc = computed<string>(() => {
    const descMap: Record<string, string> = {
      'all': 'Tổng hợp tất cả các câu hỏi và thắc mắc thường gặp nhất về mua sắm nội thất tại DCor.',
      'dat-hang': 'Thông tin về quy trình chọn món, thêm giỏ hàng, so sánh và đặt hàng nội thất.',
      'thanh-toan': 'Chính sách thanh toán COD, chuyển khoản, đặt cọc đơn hàng và bảo mật thanh toán.',
      'van-chuyen': 'Thời gian giao nhận, biểu phí vận chuyển trên toàn quốc và hỗ trợ lắp đặt tận nơi.',
      'doi-tra-bao-hanh': 'Quy định đổi trả hàng, điều kiện tiếp nhận và chế độ bảo hành sản phẩm chính hãng DCor.',
      'tai-khoan': 'Hướng dẫn tạo tài khoản, xác thực số điện thoại và theo dõi trạng thái đơn hàng.',
      'custom-tu-van': 'Trải nghiệm phối cảnh phòng 3D, may đo sofa theo yêu cầu và chia sẻ cùng cộng đồng.'
    };
    return descMap[this.selectedCategory()] || '';
  });

  ngOnInit(): void {
    this.titleService.setTitle('Câu hỏi thường gặp (FAQ) | DCor Furniture');
    // Mở mặc định 2 câu đầu tiên để người dùng dễ theo dõi
    if (this.allFaqs.length > 0) {
      this.expandedItems.set({
        [this.allFaqs[0].id]: true,
        [this.allFaqs[1].id]: true
      });
    }
  }

  setCategory(catId: string): void {
    this.selectedCategory.set(catId);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  isExpanded(id: string): boolean {
    return !!this.expandedItems()[id];
  }

  toggleFaq(id: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const current = this.expandedItems();
    this.expandedItems.set({
      ...current,
      [id]: !current[id]
    });
  }

  openConsultationModal(): void {
    this.isConsultationModalOpen = true;
  }

  closeConsultationModal(): void {
    this.isConsultationModalOpen = false;
  }

  highlightText(text: string, query: string): string {
    if (!query || !query.trim()) {
      return this.escapeHtml(text);
    }
    const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    const escaped = this.escapeHtml(text);
    return escaped.replace(regex, '<mark class="faq-highlight">$1</mark>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
