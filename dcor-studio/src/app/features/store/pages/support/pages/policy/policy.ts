import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { InfoPageComponent } from '../../components/info-page/info-page';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { POLICIES, PolicyDefinition } from '../../data/policy-data';
import { BreadcrumbItem } from '../../models/support.model';
import { HOTLINE } from '../../support-config';

@Component({
  selector: 'app-policy',
  standalone: true,
  imports: [CommonModule, RouterModule, InfoPageComponent, IconComponent],
  templateUrl: './policy.html',
  styleUrls: ['./policy.css']
})
export class PolicyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private titleService = inject(Title);
  private routeSub?: Subscription;

  readonly slug = signal<string>('');
  readonly hotline = HOTLINE;

  readonly currentPolicy = computed<PolicyDefinition | null>(() => {
    const s = this.slug();
    return POLICIES[s] || null;
  });

  readonly isNotFound = computed<boolean>(() => {
    return this.slug() !== '' && this.currentPolicy() === null;
  });

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const policy = this.currentPolicy();
    if (!policy) {
      return [
        { label: 'Chính sách', url: '/chinh-sach/bao-hanh' },
        { label: 'Không tìm thấy trang' }
      ];
    }
    return [
      { label: 'Chính sách', url: '/chinh-sach/bao-hanh' },
      { label: policy.title }
    ];
  });

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const s = params.get('slug') || '';
      this.slug.set(s);

      const policy = POLICIES[s];
      if (policy) {
        this.titleService.setTitle(`${policy.title} | DCor Furniture`);
      } else {
        this.titleService.setTitle('404 - Không tìm thấy chính sách | DCor Furniture');
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }
}
