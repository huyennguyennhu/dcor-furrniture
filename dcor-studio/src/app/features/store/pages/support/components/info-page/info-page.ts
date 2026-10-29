import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { IconComponent } from '../../../../../../shared/components/icon/icon';
import { BreadcrumbItem, ContentSection, OtherPolicyLink, TocItem } from '../../models/support.model';
import {
  HOTLINE,
  EMAIL,
  ADDRESS,
  WORKING_HOURS
} from '../../support-config';
import { getOtherPolicies } from '../../data/other-policies.data';

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './info-page.html',
  styleUrls: ['./info-page.css']
})
export class InfoPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() badge = 'Thông tin DCor';
  @Input() lastUpdated = '15/10/2026';
  @Input() currentHref = '';
  @Input({ required: true }) sections: ContentSection[] = [];
  @Input() breadcrumbs: BreadcrumbItem[] = [];

  readonly hotline = HOTLINE;
  readonly email = EMAIL;
  readonly address = ADDRESS;
  readonly workingHours = WORKING_HOURS;

  readonly activeSectionId = signal<string>('');
  readonly isMobileTocOpen = signal<boolean>(false);

  private platformId = inject(PLATFORM_ID);
  private titleService = inject(Title);
  private observer?: IntersectionObserver;

  readonly tocItems = computed<TocItem[]>(() => {
    return this.sections.map(s => ({
      id: s.id,
      title: s.title,
      level: s.level || 2
    }));
  });

  readonly otherPolicies = computed<OtherPolicyLink[]>(() => {
    return getOtherPolicies(this.currentHref);
  });

  ngOnInit(): void {
    if (this.title) {
      this.titleService.setTitle(`${this.title} | DCor Furniture`);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Set initial active section
    if (this.sections.length > 0 && !this.activeSectionId()) {
      this.activeSectionId.set(this.sections[0].id);
    }

    setTimeout(() => {
      this.initIntersectionObserver();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  toggleMobileToc(): void {
    this.isMobileTocOpen.update(v => !v);
  }

  scrollToSection(id: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (!isPlatformBrowser(this.platformId)) return;

    const element = document.getElementById(id);
    if (!element) return;

    const header = document.querySelector('header.store-site-header');
    const headerHeight = header ? (header as HTMLElement).offsetHeight : 72;
    const extraOffset = 24;
    const targetY = element.getBoundingClientRect().top + window.scrollY - headerHeight - extraOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth'
    });

    this.activeSectionId.set(id);
    this.isMobileTocOpen.set(false);
  }

  private initIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '-90px 0px -60% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    };

    this.observer = new IntersectionObserver((entries) => {
      const intersectingEntries = entries.filter(e => e.isIntersecting);
      if (intersectingEntries.length > 0) {
        // Sort by bounding top to pick the top-most visible section
        intersectingEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const topEntry = intersectingEntries[0];
        if (topEntry?.target?.id) {
          this.activeSectionId.set(topEntry.target.id);
        }
      }
    }, options);

    this.sections.forEach(section => {
      const el = document.getElementById(section.id);
      if (el) {
        this.observer?.observe(el);
      }
    });
  }
}
