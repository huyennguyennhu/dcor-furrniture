import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoPageComponent } from '../../components/info-page/info-page';
import { SHOPPING_GUIDE_SECTIONS } from '../../data/guide-data';
import { BreadcrumbItem } from '../../models/support.model';

@Component({
  selector: 'app-shopping-guide',
  standalone: true,
  imports: [CommonModule, InfoPageComponent],
  template: `
    <app-info-page
      [title]="pageTitle"
      [subtitle]="pageSubtitle"
      [badge]="pageBadge"
      [currentHref]="currentHref"
      [breadcrumbs]="breadcrumbs"
      [sections]="sections"
    ></app-info-page>
  `
})
export class ShoppingGuideComponent {
  readonly pageTitle = 'Hướng dẫn mua hàng & Đặt thiết kế DCor';
  readonly pageSubtitle = 'Cẩm nang chi tiết từ bước tìm kiếm, lựa chọn biến thể, thanh toán an toàn, xác thực OTP cho đến quy trình đặt hàng Custom độc bản.';
  readonly pageBadge = 'Hướng dẫn mua sắm';
  readonly currentHref = '/huong-dan-mua-hang';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Hỗ trợ khách hàng', url: '/faq' },
    { label: 'Hướng dẫn mua hàng' }
  ];

  readonly sections = SHOPPING_GUIDE_SECTIONS;
}

