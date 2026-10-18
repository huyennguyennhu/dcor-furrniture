import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, Tag, Layers, Clock, Check 
} from 'lucide-angular';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ReportService, RevenueReportData } from '../../../../../core/services/report.service';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6', '#e67e22'];

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './revenue.html',
  styleUrls: ['./revenue.css']
})
export class RevenueComponent implements OnInit {
  icons = { Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, Tag, Layers, Clock, Check };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  compare = false;
  timeRange = '7_days';
  showTimeDropdown = false;
  
  category = 'Tất cả danh mục';
  showCategoryDropdown = false;
  categories = ['Tất cả danh mục', 'Sofas', 'Rugs', 'Chairs', 'Lamps', 'Tables'];

  brand = 'Tất cả thương hiệu';
  showBrandDropdown = false;
  brands = ['Tất cả thương hiệu', 'Dcor In-house', 'BoConcept', 'Calligaris', 'Natuzzi'];

  collection = 'Tất cả bộ sưu tập';
  showCollectionDropdown = false;
  collections = ['Tất cả bộ sưu tập', 'Spring 2026', 'Summer Vibe', 'Minimalist', 'Classic Wooden'];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  startDate: string = '';
  endDate: string = '';

  kpi = {
    totalRevenue: 0,
    netRevenue: 0,
    dailyAverage: 0,
    aov: 0,
    growthRate: 0,
    prevTotalRevenue: 0
  };

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  // --- Line Chart: Revenue ---
  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hitRadius: 10, hoverRadius: 6 }
    },
    scales: {
      x: { grid: { display: false } },
      y: { 
        grid: { color: 'var(--border-color)', drawTicks: false }, 
        border: { display: false },
        ticks: { callback: (val: any) => `${val/1000}M` }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: 'var(--bg-secondary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    }
  };

  // --- Pie Chart: Category ---
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: { label: (ctx: any) => ` ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- Bar Chart: Category Revenue ---
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { 
        grid: { color: 'var(--border-color)', drawTicks: false }, 
        border: { display: false },
        ticks: { callback: (val: any) => `${val/1000}M` }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `Doanh thu: ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    }
  };

  // --- Horizontal Bar Chart: Top Products ---
  public topProductsData: ChartData<'bar'> = { labels: [], datasets: [] };
  public topProductsOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { 
        grid: { color: 'var(--border-color)', drawTicks: false }, 
        border: { display: false },
        ticks: { callback: (val: any) => `${val/1000}M` }
      },
      y: { grid: { display: false }, border: { display: false } }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `Doanh thu: ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    }
  };

  // --- Bar Chart: Showroom ---
  public showroomChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public showroomChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { 
        grid: { color: 'var(--border-color)', drawTicks: false }, 
        border: { display: false },
        ticks: { callback: (val: any) => `${val/1000}M` }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `Doanh thu: ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    }
  };

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showTimeDropdown = false;
      this.showCategoryDropdown = false;
      this.showBrandDropdown = false;
      this.showCollectionDropdown = false;
      this.showIntervalDropdown = false;
    }
  }

  ngOnInit() {
    this.loadReportData();
  }

  toggleCompare() {
    this.compare = !this.compare;
    this.loadReportData();
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showTimeDropdown = name === 'time' ? !this.showTimeDropdown : false;
    this.showCategoryDropdown = name === 'category' ? !this.showCategoryDropdown : false;
    this.showBrandDropdown = name === 'brand' ? !this.showBrandDropdown : false;
    this.showCollectionDropdown = name === 'collection' ? !this.showCollectionDropdown : false;
    this.showIntervalDropdown = name === 'interval' ? !this.showIntervalDropdown : false;
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; }
    if (type === 'category') { this.category = value; this.showCategoryDropdown = false; }
    if (type === 'brand') { this.brand = value; this.showBrandDropdown = false; }
    if (type === 'collection') { this.collection = value; this.showCollectionDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
    this.loadReportData();
  }

  formatCurrency(val: number): string {
    if (!val) return '0 ₫';
    if (val >= 1000000000) {
      return (val / 1000000000).toFixed(2) + ' tỷ ₫';
    }
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + ' tr ₫';
    }
    return val.toLocaleString() + ' ₫';
  }

  loadReportData() {
    this.isLoading = true;
    this.reportService.getRevenueReport({
      timeRange: this.timeRange,
      category: this.category !== 'Tất cả danh mục' ? this.category : undefined,
      brand: this.brand !== 'Tất cả thương hiệu' ? this.brand : undefined,
      collection: this.collection !== 'Tất cả bộ sưu tập' ? this.collection : undefined,
      interval: this.interval,
      startDate: this.startDate,
      endDate: this.endDate
    }).subscribe({
      next: (data) => {
        this.kpi = data.kpi;
        if (data.categoriesFilter?.length) {
          this.categories = data.categoriesFilter;
        }

        // Line Chart: Doanh thu theo thời gian
        this.lineChartData = {
          labels: data.chart.labels,
          datasets: [
            {
              data: data.chart.current,
              label: 'Kỳ này',
              borderColor: '#bc5f13',
              backgroundColor: '#bc5f13',
              borderWidth: 3,
              pointBackgroundColor: '#bc5f13',
            }
          ]
        };

        if (this.compare) {
          this.lineChartData.datasets.push({
            data: data.chart.previous,
            label: 'Kỳ trước',
            borderColor: '#9ca3af',
            backgroundColor: '#9ca3af',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#9ca3af',
          });
        }

        // Pie Chart: Cơ cấu danh mục
        this.pieChartData = {
          labels: data.byCategory.map(d => d.name),
          datasets: [{
            data: data.byCategory.map(d => d.value),
            backgroundColor: PIE_COLORS.slice(0, data.byCategory.length),
            borderWidth: 0
          }]
        };

        // Bar Chart: Doanh thu theo danh mục
        this.barChartData = {
          labels: data.byCategory.map(d => d.name),
          datasets: [{
            data: data.byCategory.map(d => d.value),
            label: 'Doanh thu',
            backgroundColor: '#3498db',
            borderRadius: 4,
            barPercentage: 0.6
          }]
        };

        // Horizontal Bar Chart: Top sản phẩm doanh thu
        this.topProductsData = {
          labels: data.topProducts.map(d => d.name),
          datasets: [{
            data: data.topProducts.map(d => d.value),
            label: 'Doanh thu',
            backgroundColor: '#e74c3c',
            borderRadius: 4,
            barPercentage: 0.6
          }]
        };

        // Bar Chart: Doanh thu theo chi nhánh / showroom
        this.showroomChartData = {
          labels: data.byShowroom.map(d => d.name),
          datasets: [{
            data: data.byShowroom.map(d => d.value),
            label: 'Doanh thu',
            backgroundColor: '#2ecc71',
            borderRadius: 4,
            barPercentage: 0.6
          }]
        };

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu doanh thu thực tế:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
