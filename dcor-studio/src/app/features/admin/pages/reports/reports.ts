import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Check, Clock,
  AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Users, ShoppingBag, 
  DollarSign, CheckCircle2, Truck, ExternalLink, ArrowUpRight
} from 'lucide-angular';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { ReportService, OverviewReportData } from '../../../../core/services/report.service';

const STATUS_COLORS = ['#2ecc71', '#3498db', '#f39c12', '#e74c3c'];

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
  icons = { 
    Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Check, Clock,
    AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Users, ShoppingBag, 
    DollarSign, CheckCircle2, Truck, ExternalLink, ArrowUpRight
  };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isChartLoading = false;
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
    'all': 'Tất cả Showroom & Kênh',
    'online': 'Online Web Store',
    'sr_q1': 'Showroom Quận 1',
    'sr_thu_duc': 'Showroom Thủ Đức'
  };
  showroomKeys = Object.keys(this.SHOWROOM_LABELS);

  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  kpi: any = {
    netRevenue: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    totalOrders: 0,
    ordersGrowth: 0,
    fulfillmentRate: 0,
    aov: 0,
    pendingDepositOrders: 0,
    criticalLowStockSKUs: 0,
    todayAppointments: 0,
    totalCustomers: 0,
    newCustomers: 0,
    totalProducts: 0
  };

  topProducts: any[] = [];
  topCustomers: any[] = [];
  funnelData: any[] = [];
  rawOrderStatusData: any[] = [];

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

  public lineChartPlugins: Plugin[] = [this.verticalCrosshairPlugin];

  // --- Line Chart: Revenue Dual-Line ---
  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: 3.5, hitRadius: 10, hoverRadius: 6 }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { 
          color: '#8c7d70', 
          font: { size: 12 },
          autoSkip: true,
          maxTicksLimit: 12,
          maxRotation: 0
        }
      },
      y: { 
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
      }
    },
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { usePointStyle: true, boxWidth: 8, color: '#4a3b32', font: { size: 12, weight: 500 } } 
      },
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
          label: (ctx: any) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} ₫` 
        }
      }
    }
  };

  // --- Doughnut Chart: Order Status ---
  public pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { usePointStyle: true, boxWidth: 8, color: '#4a3b32', font: { size: 12 } } 
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} đơn`
        }
      }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- Bar Chart: Showroom & Channel Performance ---
  public showroomBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  public showroomBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#8c7d70', font: { size: 12, weight: 500 } }
      },
      y: { 
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawTicks: false }, 
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
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: { 
          label: (ctx: any) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString()} ₫` 
        }
      }
    }
  };

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Chỉ đóng dropdown khi người dùng bấm ra ngoài các container dropdown
    if (!target || !target.closest('.filter-dropdown-wrapper')) {
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
    
    // Tự động gợi ý chu kỳ hiển thị phù hợp với khoảng thời gian
    if (key === 'today') {
      this.interval = 'Giờ';
    } else if (key === 'month') {
      this.interval = 'Tuần';
    } else {
      this.interval = 'Ngày';
    }

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
    // Chỉ nạp lại dữ liệu cho riêng biểu đồ doanh thu (không load lại toàn trang)
    this.loadOverviewData(true);
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

  exportReport() {
    // Xuất báo cáo CSV nhanh cho quản trị viên
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Chỉ số,Giá trị\n"
      + `Doanh thu thuần,${this.kpi.netRevenue || this.kpi.totalRevenue}\n`
      + `Tổng đơn hàng,${this.kpi.totalOrders}\n`
      + `Tỷ lệ hoàn tất,${this.kpi.fulfillmentRate}%\n`
      + `Giá trị đơn trung bình,${this.kpi.aov}\n`
      + `Đơn cọc chờ duyệt,${this.kpi.pendingDepositOrders}\n`
      + `SKU nguy cấp tồn kho,${this.kpi.criticalLowStockSKUs}\n`
      + `Lịch hẹn hôm nay,${this.kpi.todayAppointments}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DCOR_Overview_Report_${this.timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loadOverviewData(isChartOnly = false) {
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

    this.reportService.getOverviewReport({
      timeRange: this.timeRange,
      showroom: this.showroom !== 'all' ? this.showroom : undefined,
      interval: intervalMap[this.interval] || 'day'
    }).subscribe({
      next: (data) => {
        // Cập nhật biểu đồ doanh thu theo chu kỳ mới
        this.lineChartData = {
          labels: data.revenueChart.labels,
          datasets: [
            {
              data: data.revenueChart.current,
              label: 'Kỳ này',
              borderColor: '#765337',
              backgroundColor: 'rgba(118, 83, 55, 0.12)',
              fill: true,
              borderWidth: 3,
              pointBackgroundColor: '#765337',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointHoverRadius: 6
            }
          ]
        };

        if (this.compare) {
          this.lineChartData.datasets.push({
            data: data.revenueChart.previous,
            label: 'Kỳ trước',
            borderColor: '#9ca3af',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointBackgroundColor: '#9ca3af',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 5
          });
        }

        // Nếu tải toàn trang, cập nhật toàn bộ KPI và các biểu đồ/bảng khác
        if (!isChartOnly) {
          this.kpi = data.kpi;
          this.topProducts = data.topProducts || [];
          this.topCustomers = data.topCustomers || [];
          this.funnelData = data.funnelData || [];
          this.rawOrderStatusData = data.orderStatusData || [];

          // Doughnut Chart: Trạng thái đơn hàng
          this.pieChartData = {
            labels: data.orderStatusData.map(d => d.name),
            datasets: [{
              data: data.orderStatusData.map(d => d.value),
              backgroundColor: data.orderStatusData.map((d, i) => d.color || STATUS_COLORS[i % STATUS_COLORS.length]),
              borderWidth: 2,
              borderColor: '#fff'
            }]
          };

          // Bar Chart: Showroom & Kênh
          if (data.showroomSalesData && data.showroomSalesData.length > 0) {
            this.showroomBarData = {
              labels: data.showroomSalesData.map(s => s.name),
              datasets: [
                {
                  data: data.showroomSalesData.map(s => s.revenue),
                  label: 'Doanh thu thuần',
                  backgroundColor: '#765337',
                  borderRadius: 6,
                  barPercentage: 0.55
                }
              ]
            };
          } else if (data.categoryRevenueData && data.categoryRevenueData.length > 0) {
            this.showroomBarData = {
              labels: data.categoryRevenueData.map(d => d.name),
              datasets: [{
                data: data.categoryRevenueData.map(d => d.value),
                label: 'Doanh thu',
                backgroundColor: '#765337',
                borderRadius: 6,
                barPercentage: 0.55
              }]
            };
          }
        }

        this.isLoading = false;
        this.isChartLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi tải dữ liệu báo cáo tổng quan:', err);
        this.isLoading = false;
        this.isChartLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getMaxFunnelValue(): number {
    if (!this.funnelData || this.funnelData.length === 0) return 1000;
    return Math.max(...this.funnelData.map(d => d.count || d.value || 0));
  }

  getOrderStatusPercentage(statusName: string): string {
    if (!this.rawOrderStatusData || this.rawOrderStatusData.length === 0) return '0%';
    const total = this.rawOrderStatusData.reduce((sum, item) => sum + (item.value || 0), 0);
    if (total === 0) return '0%';
    const target = this.rawOrderStatusData.find(item => item.name === statusName);
    if (!target) return '0%';
    return Math.round((target.value / total) * 100) + '%';
  }
  getTabForStatus(statusName: string): string {
    const map: Record<string, string> = {
      'Chờ xác nhận': 'PENDING',
      'Đã xác nhận': 'CONFIRMED',
      'Đang xử lý': 'PROCESSING',
      'Đang chuẩn bị': 'PROCESSING',
      'Sẵn sàng xuất': 'READY_TO_SHIP',
      'Đang giao': 'SHIPPED',
      'Đã giao': 'DELIVERED',
      'Hoàn tất': 'COMPLETED',
      'Đã hủy': 'CANCELLED'
    };
    return map[statusName] || 'ALL';
  }

}
