import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, 
  Truck, Check, Clock, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, AlertCircle, 
  Package, ArrowRight, UserCheck, ShieldAlert, ExternalLink, Percent, Layers
} from 'lucide-angular';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ReportService, OrdersReportData } from '../../../../../core/services/report.service';

@Component({
  selector: 'app-orders-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {
  icons = { 
    Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, 
    Truck, Check, Clock, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, AlertCircle, 
    Package, ArrowRight, UserCheck, ShieldAlert, ExternalLink, Percent, Layers 
  };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isChartLoading = false;
  compare = false;

  timeRange = '7_days';
  showTimeDropdown = false;
  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  showroom = 'all';
  showShowroomDropdown = false;
  SHOWROOM_LABELS: Record<string, string> = {
    'all': 'Tất cả Showroom & Kênh',
    'online': 'Online Web Store',
    'sr_q1': 'Showroom Quận 1',
    'sr_thu_duc': 'Showroom Thủ Đức'
  };
  showroomKeys = Object.keys(this.SHOWROOM_LABELS);

  status = 'Tất cả trạng thái';
  showStatusDropdown = false;
  statuses = [
    'Tất cả trạng thái',
    'Chờ xác nhận',
    'Đã xác nhận',
    'Đang đóng gói/QC',
    'Đang giao hàng',
    'Hoàn thành',
    'Đã hủy',
    'Đổi trả / Bảo hành'
  ];

  carrier = 'Tất cả đơn vị';
  showCarrierDropdown = false;
  carriers = [
    'Tất cả đơn vị',
    'Đội xe Showroom (DCOR Express)',
    'Viettel Post',
    'Giao Hàng Nhanh'
  ];

  orderType = 'Tất cả loại đơn';
  showOrderTypeDropdown = false;
  orderTypes = [
    'Tất cả loại đơn',
    'Đơn tiêu chuẩn',
    'Đơn may đo Custom',
    'Đơn giá trị cao'
  ];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];
  intervalMap: Record<string, string> = {
    'Giờ': 'hour',
    'Ngày': 'day',
    'Tuần': 'week',
    'Tháng': 'month'
  };

  startDate: string = '';
  endDate: string = '';

  kpi: any = {
    totalOrders: 0,
    ordersGrowth: 0,
    otifRate: 0,
    avgLeadTimeHours: 0,
    cancelledOrders: 0,
    cancelRate: 0,
    returnsAndWarranty: 0
  };

  lifecycle: any[] = [];
  cancellationReasons: any[] = [];
  carrierPerformance: any[] = [];
  ordersList: any[] = [];

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

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

  public groupedBarChartPlugins: Plugin[] = [this.verticalCrosshairPlugin];

  // --- 1. Grouped Bar Chart: Đơn mới phát sinh vs Đơn hoàn tất ---
  public groupedBarChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public groupedBarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#8c7d70', font: { size: 12 }, autoSkip: true, maxTicksLimit: 12 }
      },
      y: { 
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { 
          color: '#8c7d70',
          font: { size: 12 },
          precision: 0,
          callback: (val: any) => `${val} đơn`
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
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw} đơn`
        }
      }
    }
  };

  // --- 2. Doughnut Chart: Nguyên nhân hủy đơn ---
  public cancelChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public cancelChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(50, 33, 22, 0.95)',
        titleColor: '#FCF8F3',
        bodyColor: '#FCF8F3',
        borderColor: '#765337',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.raw} đơn`
        }
      }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- 3. Horizontal Bar Chart: Hiệu suất Đơn vị vận chuyển ---
  public carrierChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public carrierChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { 
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false }, 
        ticks: { color: '#8c7d70', font: { size: 12 }, precision: 0 } 
      },
      y: { 
        grid: { display: false }, 
        ticks: { color: '#4a3b32', font: { size: 12, weight: 500 } } 
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(50, 33, 22, 0.95)',
        titleColor: '#FCF8F3',
        bodyColor: '#FCF8F3',
        borderColor: '#765337',
        borderWidth: 1,
        callbacks: {
          label: (ctx: any) => ` Số đơn: ${ctx.raw} đơn`
        }
      }
    }
  };

  ngOnInit() {
    this.loadOrdersData();
  }

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-wrapper')) {
      this.closeAllDropdowns();
    }
  }

  closeAllDropdowns() {
    this.showTimeDropdown = false;
    this.showShowroomDropdown = false;
    this.showStatusDropdown = false;
    this.showCarrierDropdown = false;
    this.showOrderTypeDropdown = false;
    this.showIntervalDropdown = false;
  }

  toggleDropdown(type: 'time' | 'showroom' | 'status' | 'carrier' | 'orderType' | 'interval', event?: MouseEvent) {
    if (event) event.stopPropagation();
    
    if (type === 'time') {
      const current = this.showTimeDropdown;
      this.closeAllDropdowns();
      this.showTimeDropdown = !current;
    } else if (type === 'showroom') {
      const current = this.showShowroomDropdown;
      this.closeAllDropdowns();
      this.showShowroomDropdown = !current;
    } else if (type === 'status') {
      const current = this.showStatusDropdown;
      this.closeAllDropdowns();
      this.showStatusDropdown = !current;
    } else if (type === 'carrier') {
      const current = this.showCarrierDropdown;
      this.closeAllDropdowns();
      this.showCarrierDropdown = !current;
    } else if (type === 'orderType') {
      const current = this.showOrderTypeDropdown;
      this.closeAllDropdowns();
      this.showOrderTypeDropdown = !current;
    } else if (type === 'interval') {
      const current = this.showIntervalDropdown;
      this.closeAllDropdowns();
      this.showIntervalDropdown = !current;
    }
  }

  setDropdownValue(type: 'time' | 'showroom' | 'status' | 'carrier' | 'orderType' | 'interval', value: string) {
    if (type === 'time') {
      this.timeRange = value;
      this.showTimeDropdown = false;
      if (value !== 'custom') {
        this.loadOrdersData();
      }
    } else if (type === 'showroom') {
      this.showroom = value;
      this.showShowroomDropdown = false;
      this.loadOrdersData();
    } else if (type === 'status') {
      this.status = value;
      this.showStatusDropdown = false;
      this.loadOrdersData();
    } else if (type === 'carrier') {
      this.carrier = value;
      this.showCarrierDropdown = false;
      this.loadOrdersData();
    } else if (type === 'orderType') {
      this.orderType = value;
      this.showOrderTypeDropdown = false;
      this.loadOrdersData();
    } else if (type === 'interval') {
      this.interval = value;
      this.showIntervalDropdown = false;
      this.loadOrdersData(true);
    }
    this.cdr.detectChanges();
  }

  toggleCompare() {
    this.compare = !this.compare;
    this.loadOrdersData(true);
  }

  loadOrdersData(isChartOnly: boolean = false) {
    if (isChartOnly) {
      this.isChartLoading = true;
    } else {
      this.isLoading = true;
    }

    const params: any = {
      timeRange: this.timeRange,
      showroom: this.showroom,
      status: this.status !== 'Tất cả trạng thái' ? this.status : undefined,
      carrier: this.carrier !== 'Tất cả đơn vị' ? this.carrier : undefined,
      orderType: this.orderType !== 'Tất cả loại đơn' ? this.orderType : undefined,
      interval: this.intervalMap[this.interval] || 'day'
    };

    if (this.timeRange === 'custom') {
      if (this.startDate) params.startDate = this.startDate;
      if (this.endDate) params.endDate = this.endDate;
    }

    this.reportService.getOrdersReport(params).subscribe({
      next: (data) => {
        // 1. Grouped Bar Chart: Đơn mới phát sinh vs Đơn hoàn tất
        const datasets: any[] = [
          {
            label: 'Đơn mới tạo',
            data: data.chart.created,
            backgroundColor: '#765337',
            borderRadius: 6
          },
          {
            label: 'Đơn hoàn tất',
            data: data.chart.completed,
            backgroundColor: '#2ecc71',
            borderRadius: 6
          }
        ];

        if (this.compare) {
          datasets.push({
            label: 'Kỳ trước',
            data: data.chart.prevCreated,
            backgroundColor: 'rgba(189, 195, 199, 0.7)',
            borderRadius: 6
          });
        }

        this.groupedBarChartData = {
          labels: data.chart.labels,
          datasets
        };

        if (!isChartOnly) {
          this.kpi = data.kpi;
          this.lifecycle = data.lifecycle || [];
          this.cancellationReasons = data.cancellationReasons || [];
          this.carrierPerformance = data.carrierPerformance || [];
          this.ordersList = data.ordersList || [];

          // 2. Doughnut Chart: Nguyên nhân hủy
          if (data.cancellationReasons && data.cancellationReasons.length > 0) {
            this.cancelChartData = {
              labels: data.cancellationReasons.map(r => r.reason),
              datasets: [{
                data: data.cancellationReasons.map(r => r.count),
                backgroundColor: data.cancellationReasons.map(r => r.color || '#e74c3c'),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            };
          }

          // 3. Horizontal Bar Chart: Vận chuyển
          if (data.carrierPerformance && data.carrierPerformance.length > 0) {
            this.carrierChartData = {
              labels: data.carrierPerformance.map(c => c.name),
              datasets: [{
                data: data.carrierPerformance.map(c => c.orders),
                backgroundColor: data.carrierPerformance.map(c => c.color || '#765337'),
                borderRadius: 6
              }]
            };
          }
        }

        this.isLoading = false;
        this.isChartLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi nạp báo cáo đơn hàng:', err);
        this.isLoading = false;
        this.isChartLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatCurrency(val: number | string | null | undefined): string {
    const num = Number(val);
    if (!val || isNaN(num)) return '0 ₫';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} tỷ ₫`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} tr ₫`;
    return `${num.toLocaleString()} ₫`;
  }

  getOrderManagementQueryParams(): any {
    const statusMap: Record<string, string> = {
      'Chờ xử lý': 'PENDING',
      'Đã xác nhận': 'CONFIRMED',
      'Đang gia công': 'PROCESSING',
      'Sẵn sàng giao': 'READY_TO_SHIP',
      'Đang giao hàng': 'SHIPPED',
      'Hoàn tất': 'COMPLETED',
      'Đã hủy': 'CANCELLED'
    };
    const params: any = { sortBy: 'date-desc' };
    if (this.status && statusMap[this.status]) {
      params.tab = statusMap[this.status];
    }
    if (this.showroom && this.showroom !== 'Tất cả chi nhánh') {
      params.showroom = this.showroom;
    }
    return params;
  }

  exportReport() {
    let csv = '\uFEFF';
    csv += 'BÁO CÁO ĐƠN HÀNG DCOR STUDIO\n';
    csv += `Thời gian: ${this.TIME_LABELS[this.timeRange]} (${new Date().toLocaleDateString('vi-VN')})\n`;
    csv += `Showroom: ${this.SHOWROOM_LABELS[this.showroom]}\n\n`;

    csv += 'CHỈ SỐ KPIS VẬN HÀNH\n';
    csv += `Tổng đơn tiếp nhận,${this.kpi.totalOrders} đơn\n`;
    csv += `Tăng trưởng đơn hàng,${this.kpi.ordersGrowth}%\n`;
    csv += `Tỷ lệ hoàn tất OTIF,${this.kpi.otifRate}%\n`;
    csv += `Thời gian xử lý trung bình,${this.kpi.avgLeadTimeHours} giờ\n`;
    csv += `Tỷ lệ hủy đơn,${this.kpi.cancelRate}%\n`;
    csv += `Đơn đổi trả / Giao lại,${this.kpi.returnsAndWarranty} ca\n\n`;

    csv += 'DANH SÁCH ĐƠN HÀNG VẬN HÀNH GẦN ĐÂY\n';
    csv += 'Mã đơn,Ngày tạo,Khách hàng,Số điện thoại,Kênh/Showroom,Đơn vị vận chuyển,Trạng thái,Doanh thu\n';

    this.ordersList.forEach(o => {
      csv += `"${o.orderCode}","${o.createdAt}","${o.customerName}","${o.phone}","${o.showroom}","${o.shippingProvider}","${o.statusText}","${o.totalAmount}"\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Don_Hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  getTabForLifecycle(name: string): string {
    const map: Record<string, string> = {
      'Chờ xác nhận': 'PENDING',
      'Đã duyệt': 'CONFIRMED',
      'Đang gia công': 'PROCESSING',
      'Xuất kho': 'READY_TO_SHIP',
      'Đang giao': 'SHIPPED',
      'Hoàn tất': 'COMPLETED'
    };
    return map[name] || 'ALL';
  }

}
