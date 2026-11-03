import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, 
  Tag, Layers, Clock, Check, DollarSign, TrendingUp, TrendingDown, CreditCard, 
  Wallet, Percent, Building, Receipt, ArrowUpRight, PieChart, BarChart3, ExternalLink
} from 'lucide-angular';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ReportService, RevenueReportData } from '../../../../../core/services/report.service';

const PAYMENT_COLORS = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6'];

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './revenue.html',
  styleUrls: ['./revenue.css']
})
export class RevenueComponent implements OnInit {
  icons = { 
    Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, 
    Tag, Layers, Clock, Check, DollarSign, TrendingUp, TrendingDown, CreditCard, 
    Wallet, Percent, Building, Receipt, ArrowUpRight, PieChart, BarChart3, ExternalLink
  };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isChartLoading = false;
  compare = false;

  timeRange = '7_days';
  showTimeDropdown = false;
  
  showroom = 'all';
  showShowroomDropdown = false;

  category = 'Tất cả danh mục';
  showCategoryDropdown = false;
  categories = ['Tất cả danh mục', 'Sofas', 'Rugs', 'Chairs', 'Lamps', 'Tables'];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  startDate: string = '';
  endDate: string = '';

  kpi: any = {
    grossSales: 0,
    discountAmount: 0,
    discountRate: 0,
    netRevenue: 0,
    aov: 0,
    pendingReceivables: 0,
    dailyAverage: 0,
    growthRate: 0,
    totalOrders: 0
  };

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  SHOWROOM_LABELS: Record<string, string> = {
    'all': 'Tất cả Showroom & Kênh',
    'online': 'Online Web Store',
    'sr_q1': 'Showroom Quận 1',
    'sr_thu_duc': 'Showroom Thủ Đức'
  };
  showroomKeys = Object.keys(this.SHOWROOM_LABELS);

  paymentBreakdown: any[] = [];
  topOrders: any[] = [];

  // Plugin vẽ đường đối chiếu cột dọc (Vertical Crosshair Guideline)
  public verticalCrosshairPlugin: Plugin = {
    id: 'verticalCrosshair',
    afterDatasetsDraw: (chart: any) => {
      if (chart.tooltip?.opacity > 0 && chart.tooltip?.getActiveElements?.()?.length) {
        const activePoint = chart.tooltip.getActiveElements()[0];
        const { ctx, chartArea } = chart;
        if (!activePoint?.element || !chartArea) return;
        const x = activePoint.element.x;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(118, 83, 55, 0.45)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  public comboChartPlugins: Plugin[] = [this.verticalCrosshairPlugin];

  // --- 1. Combo Chart: Doanh thu thuần & Tỷ lệ Chiết khấu ---
  public comboChartData: ChartData<'bar' | 'line'> = { labels: [], datasets: [] };
  public comboChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    elements: {
      line: { tension: 0.35, borderWidth: 2.5 },
      point: { radius: 3.5, hitRadius: 10, hoverRadius: 6 }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#8c7d70', font: { size: 12 }, autoSkip: true, maxTicksLimit: 12 }
      },
      y: { 
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { 
          color: '#8c7d70',
          font: { size: 12 },
          callback: (val: any) => {
            const num = Number(val);
            if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' tỷ';
            if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
            return num.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#e67e22',
          font: { size: 11 },
          callback: (val: any) => `${val}%`
        }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#4a3b32', font: { size: 12 } } },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(50, 33, 22, 0.95)',
        titleColor: '#FCF8F3',
        bodyColor: '#FCF8F3',
        borderColor: '#765337',
        borderWidth: 1,
        padding: 10,
        callbacks: { 
          label: (ctx: any) => {
            if (ctx.dataset.yAxisID === 'y1') {
              return ` ${ctx.dataset.label}: ${ctx.raw}%`;
            }
            return ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} ₫`;
          }
        }
      }
    }
  };

  // --- 2. Doughnut Chart: Cơ cấu Phương thức thanh toán ---
  public paymentChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public paymentChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#4a3b32', font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${Number(ctx.raw).toLocaleString()} ₫`
        }
      }
    },
    cutout: '68%',
    radius: '90%'
  } as any;

  // --- 3. Horizontal Bar Chart: Doanh thu theo Danh mục ---
  public categoryChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public categoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { 
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { 
          color: '#8c7d70',
          callback: (val: any) => {
            const num = Number(val);
            if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' tỷ';
            if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
            return num.toLocaleString();
          }
        }
      },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: '#4a3b32', font: { weight: 500 } } }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx: any) => ` Doanh thu: ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    }
  };

  // --- 4. Bar Chart: Doanh thu theo Tỉnh thành & Khu vực ---
  public regionalChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public regionalChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8c7d70', font: { size: 12 } } },
      y: { 
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { 
          color: '#8c7d70',
          callback: (val: any) => {
            const num = Number(val);
            if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' tỷ';
            if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
            return num.toLocaleString();
          }
        }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx: any) => ` Doanh thu: ${Number(ctx.raw).toLocaleString()} ₫` }
      }
    }
  };

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target || !target.closest('.filter-dropdown-wrapper')) {
      this.showTimeDropdown = false;
      this.showShowroomDropdown = false;
      this.showCategoryDropdown = false;
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
    this.showShowroomDropdown = name === 'showroom' ? !this.showShowroomDropdown : false;
    this.showCategoryDropdown = name === 'category' ? !this.showCategoryDropdown : false;
    this.showIntervalDropdown = name === 'interval' ? !this.showIntervalDropdown : false;
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'time') {
      this.timeRange = value;
      this.showTimeDropdown = false;
      if (value === 'today') this.interval = 'Giờ';
      else if (value === 'month') this.interval = 'Tuần';
      else this.interval = 'Ngày';
      this.loadReportData();
    } else if (type === 'showroom') {
      this.showroom = value;
      this.showShowroomDropdown = false;
      this.loadReportData();
    } else if (type === 'category') {
      this.category = value;
      this.showCategoryDropdown = false;
      this.loadReportData();
    } else if (type === 'interval') {
      this.interval = value;
      this.showIntervalDropdown = false;
      // Chỉ nạp lại biểu đồ cục bộ
      this.loadReportData(true);
    }
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

  exportReport() {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Chỉ số,Giá trị\n"
      + `Doanh thu gộp,${this.kpi.grossSales}\n`
      + `Chiết khấu voucher,${this.kpi.discountAmount}\n`
      + `Doanh thu thuần,${this.kpi.netRevenue}\n`
      + `Giá trị đơn TB,${this.kpi.aov}\n`
      + `Công nợ / Chờ thu,${this.kpi.pendingReceivables}\n`
      + `Tăng trưởng so với kỳ trước,${this.kpi.growthRate}%\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DCOR_Revenue_Report_${this.timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loadReportData(isChartOnly = false) {
    if (isChartOnly) {
      this.isChartLoading = true;
    } else {
      this.isLoading = true;
    }

    const intervalMap: Record<string, string> = {
      'Giờ': 'hour',
      'Ngày': 'day',
      'Tuần': 'week',
      'Tháng': 'month'
    };

    this.reportService.getRevenueReport({
      timeRange: this.timeRange,
      showroom: this.showroom !== 'all' ? this.showroom : undefined,
      category: this.category !== 'Tất cả danh mục' ? this.category : undefined,
      interval: intervalMap[this.interval] || 'day',
      startDate: this.startDate,
      endDate: this.endDate
    }).subscribe({
      next: (data) => {
        // Cập nhật biểu đồ doanh thu Combo Chart
        const revData = data.chart.revenue || data.chart.current || [];
        const discountRates = data.chart.discountRate || revData.map(() => 1.8);
        const prevRev = data.chart.previousRevenue || data.chart.previous || [];

        const datasets: any[] = [
          {
            type: 'bar',
            label: 'Doanh thu thuần',
            data: revData,
            backgroundColor: '#765337',
            borderRadius: 6,
            yAxisID: 'y',
            order: 2
          },
          {
            type: 'line',
            label: 'Tỷ lệ chiết khấu (%)',
            data: discountRates,
            borderColor: '#e67e22',
            backgroundColor: '#e67e22',
            pointBackgroundColor: '#e67e22',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            yAxisID: 'y1',
            order: 1
          }
        ];

        if (this.compare) {
          datasets.push({
            type: 'bar',
            label: 'Kỳ trước',
            data: prevRev,
            backgroundColor: 'rgba(189, 195, 199, 0.7)',
            borderRadius: 6,
            yAxisID: 'y',
            order: 3
          });
        }

        this.comboChartData = {
          labels: data.chart.labels,
          datasets
        };

        // Nếu tải toàn diện trang
        if (!isChartOnly) {
          this.kpi = data.kpi;
          this.paymentBreakdown = data.paymentBreakdown || [];
          this.topOrders = data.topOrders || [];

          if (data.categoriesFilter?.length) {
            this.categories = data.categoriesFilter;
          }

          // 2. Doughnut Chart: Cơ cấu Thanh toán
          if (data.paymentBreakdown && data.paymentBreakdown.length > 0) {
            this.paymentChartData = {
              labels: data.paymentBreakdown.map(p => p.name),
              datasets: [{
                data: data.paymentBreakdown.map(p => p.amount),
                backgroundColor: data.paymentBreakdown.map(p => p.color || '#3498db'),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            };
          }

          // 3. Bar Chart: Danh mục cấp 1
          this.categoryChartData = {
            labels: data.byCategory.map(c => c.name),
            datasets: [{
              data: data.byCategory.map(c => c.value),
              backgroundColor: '#765337',
              borderRadius: 6,
              barPercentage: 0.6
            }]
          };

          // 4. Bar Chart: Tỉnh thành / Khu vực
          const regional = data.regionalSales || data.byShowroom || [];
          this.regionalChartData = {
            labels: regional.map(r => r.name),
            datasets: [{
              data: regional.map(r => r.value),
              backgroundColor: '#3498db',
              borderRadius: 6,
              barPercentage: 0.55
            }]
          };
        }

        this.isLoading = false;
        this.isChartLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu báo cáo doanh thu:', err);
        this.isLoading = false;
        this.isChartLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  getOrderQueryParams(): any {
    const q: any = { sortBy: 'total-desc' };
    if (this.showroom && this.showroom !== 'Tất cả chi nhánh') {
      q.showroom = this.showroom;
    }
    return q;
  }

}
