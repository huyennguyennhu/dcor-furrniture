import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Check, Clock 
} from 'lucide-angular';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { ReportService, OverviewReportData } from '../../../../core/services/report.service';

const PIE_COLORS = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  // Lucide Icons
  icons = { Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Check, Clock };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  compare = false;
  timeRange = '7_days';
  showroom = 'all';
  showTimeDropdown = false;
  showShowroomDropdown = false;
  interval = 'Ngày';
  showIntervalDropdown = false;

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh...'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  SHOWROOM_LABELS: Record<string, string> = {
    'all': 'Tất cả Showroom',
    'sr_1': 'Showroom Quận 1',
    'sr_3': 'Showroom Quận 3',
    'sr_7': 'Showroom Quận 7'
  };
  showroomKeys = Object.keys(this.SHOWROOM_LABELS);

  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  kpi = {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    totalCustomers: 0,
    newCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalAppointments: 8,
    upcomingAppointments: 3
  };

  topProducts: any[] = [];
  topCustomers: any[] = [];
  funnelData: any[] = [];

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

  // --- Pie Chart: Order Status ---
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- Bar Chart: Category Revenue ---
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { grid: { color: 'var(--border-color)', drawTicks: false }, border: { display: false } },
      y: { grid: { display: false }, border: { display: false } }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    }
  };

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showTimeDropdown = false;
      this.showShowroomDropdown = false;
      this.showIntervalDropdown = false;
    }
  }

  ngOnInit() {
    this.loadOverviewData();
  }

  toggleCompare() {
    this.compare = !this.compare;
    this.loadOverviewData();
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showTimeDropdown = name === 'time' ? !this.showTimeDropdown : false;
    this.showShowroomDropdown = name === 'showroom' ? !this.showShowroomDropdown : false;
    this.showIntervalDropdown = name === 'interval' ? !this.showIntervalDropdown : false;
  }

  setTimeRange(key: string) {
    this.timeRange = key;
    this.showTimeDropdown = false;
    this.loadOverviewData();
  }

  setShowroom(key: string) {
    this.showroom = key;
    this.showShowroomDropdown = false;
    this.loadOverviewData();
  }

  setIntervalOpt(opt: string) {
    this.interval = opt;
    this.showIntervalDropdown = false;
  }

  formatCurrencyShort(val: number): string {
    if (!val) return '0 ₫';
    if (val >= 1000000000) {
      return (val / 1000000000).toFixed(2) + ' tỷ ₫';
    }
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + ' tr ₫';
    }
    return val.toLocaleString() + ' ₫';
  }

  loadOverviewData() {
    this.isLoading = true;
    this.reportService.getOverviewReport({
      timeRange: this.timeRange,
      showroom: this.showroom !== 'all' ? this.showroom : undefined
    }).subscribe({
      next: (data) => {
        this.kpi = data.kpi;
        this.topProducts = data.topProducts || [];
        this.topCustomers = data.topCustomers || [];
        this.funnelData = data.funnelData || [];

        // Line Chart: Doanh thu theo thời gian
        this.lineChartData = {
          labels: data.revenueChart.labels,
          datasets: [
            {
              data: data.revenueChart.current,
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
            data: data.revenueChart.previous,
            label: 'Kỳ trước',
            borderColor: '#9ca3af',
            backgroundColor: '#9ca3af',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#9ca3af',
          });
        }

        // Pie Chart: Trạng thái đơn hàng
        this.pieChartData = {
          labels: data.orderStatusData.map(d => d.name),
          datasets: [{
            data: data.orderStatusData.map(d => d.value),
            backgroundColor: PIE_COLORS,
            borderWidth: 0
          }]
        };

        // Bar Chart: Doanh thu theo danh mục
        this.barChartData = {
          labels: data.categoryRevenueData.map(d => d.name),
          datasets: [{
            data: data.categoryRevenueData.map(d => d.value),
            label: 'Doanh thu',
            backgroundColor: '#3498db',
            borderRadius: 4,
            barPercentage: 0.6
          }]
        };

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu báo cáo tổng quan từ Supabase:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getMaxFunnelValue() {
    if (!this.funnelData || this.funnelData.length === 0) return 1000;
    return Math.max(...this.funnelData.map(d => d.value));
  }
}
