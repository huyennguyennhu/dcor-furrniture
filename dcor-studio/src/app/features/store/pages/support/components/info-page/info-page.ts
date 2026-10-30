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
import { ShowroomConsultationModalComponent } from '../../../../../../shared/components/showroom-consultation-modal/showroom-consultation-modal';
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
  imports: [CommonModule, RouterModule, IconComponent, ShowroomConsultationModalComponent],
  templateUrl: './info-page.html',
  styleUrls: ['./info-page.css']
})
export class InfoPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() badge = 'Thông tin DCor';
  @Input() lastUpdated = '';
  @Input() showPolicyMeta = false;
  @Input() currentHref = '';
  @Input({ required: true }) sections: ContentSection[] = [];
  @Input() breadcrumbs: BreadcrumbItem[] = [];

  readonly hotline = HOTLINE;
  readonly email = EMAIL;
  readonly address = ADDRESS;
  readonly workingHours = WORKING_HOURS;

  readonly activeSectionId = signal<string>('');
  readonly isMobileTocOpen = signal<boolean>(false);

  // About page detection
  get isAboutPage(): boolean {
    return Boolean(
      this.currentHref === '/about' ||
      this.badge === 'Câu chuyện thương hiệu' ||
      (this.breadcrumbs && this.breadcrumbs.length > 0 && this.breadcrumbs[0].label === 'Về DCor') ||
      (this.title && this.title.includes('Về DCor'))
    );
  }

  // Showroom modal state
  isConsultationModalOpen = false;

  openConsultationModal(): void {
    this.isConsultationModalOpen = true;
  }

  closeConsultationModal(): void {
    this.isConsultationModalOpen = false;
  }

  scrollToStory(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 4 Key Metrics Signals
  readonly metricHomes = signal<number>(0);
  readonly metricRenderings = signal<number>(0);
  readonly metricMaterials = signal<number>(0);
  readonly metricSatisfaction = signal<number>(0);
  readonly formattedHomes = computed(() => this.metricHomes().toLocaleString('en-US'));
  readonly formattedRenderings = computed(() => this.metricRenderings().toLocaleString('en-US'));
  readonly metricSatisfactionOffset = computed(() => {
    const circumference = 175.93; // 2 * PI * 28
    return Math.max(0, circumference - (this.metricSatisfaction() / 100) * circumference);
  });
  readonly isMetricsAnimated = signal<boolean>(false);

  animateMetrics(): void {
    if (this.isMetricsAnimated()) return;
    this.isMetricsAnimated.set(true);

    const duration = 1800;
    const start = performance.now();

    const step = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      this.metricHomes.set(Math.floor(easeOut * 1500));
      this.metricRenderings.set(Math.floor(easeOut * 10000));
      this.metricMaterials.set(Math.floor(easeOut * 120));
      this.metricSatisfaction.set(Math.floor(easeOut * 98));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.metricHomes.set(1500);
        this.metricRenderings.set(10000);
        this.metricMaterials.set(120);
        this.metricSatisfaction.set(98);
      }
    };

    requestAnimationFrame(step);
  }

  private initMetricsObserver(): void {
    if (!isPlatformBrowser(this.platformId) || typeof IntersectionObserver === 'undefined') {
      this.animateMetrics();
      return;
    }

    const metricsEl = document.getElementById('key-metrics');
    if (!metricsEl) {
      this.animateMetrics();
      return;
    }

    const metricsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.isMetricsAnimated()) {
          this.animateMetrics();
          metricsObserver.disconnect();
        }
      });
    }, { threshold: 0.1 });

    metricsObserver.observe(metricsEl);

    // Safe fallback to guarantee cards reveal even if observer is bypassed
    setTimeout(() => {
      if (!this.isMetricsAnimated()) {
        this.animateMetrics();
      }
    }, 3500);
  }

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
      if (this.isAboutPage) {
        this.initMetricsObserver();
      }
    }, 200);
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
