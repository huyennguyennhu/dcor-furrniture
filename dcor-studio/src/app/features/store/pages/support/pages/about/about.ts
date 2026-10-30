import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoPageComponent } from '../../components/info-page/info-page';
import { ABOUT_SECTIONS } from '../../data/about-data';
import { BreadcrumbItem } from '../../models/support.model';

@Component({
  selector: 'app-about',
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
export class AboutComponent {
  readonly pageTitle = 'Về DCor Furniture - Design Your Core';
  readonly pageSubtitle = 'Hành trình kiến tạo không gian sống đậm chất nghệ thuật, kết hợp kỹ nghệ mộc mộng truyền thống tinh xảo và phong cách thiết kế tối giản hiện đại.';
  readonly pageBadge = 'Câu chuyện thương hiệu';
  readonly currentHref = '/about';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Về DCor' }
  ];

  readonly sections = ABOUT_SECTIONS;
}

