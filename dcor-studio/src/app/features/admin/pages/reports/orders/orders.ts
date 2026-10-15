import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Filter, Truck, CreditCard, Activity, Clock, Check 
} from 'lucide-angular';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ReportService, OrdersReportData } from '../../../../../core/services/report.service';

const PIE_COLORS = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'];

@Component({
  selector: 'app-orders-report',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {
  icons = { Calendar, Download, ChevronDown, Filter, Truck, CreditCard, Activity, Clock, Check };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  timeRange = '7_days';
  showTimeDropdown = false;
  
  status = 'Tất cả trạng thái';
  showStatusDropdown = false;
  statuses = ['Tất cả trạng thái', 'Hoàn thành', 'Đang xử lý', 'Chờ thanh toán', 'Đã hủy'];

  payment = 'Tất cả thanh toán';
  showPaymentDropdown = false;
  payments = ['Tất cả thanh toán', 'COD', 'VNPAY', 'BANK_TRANSFER'];

  shipping = 'Tất cả vận chuyển';
  showShippingDropdown = false;
  shippings = ['Tất cả vận chuyển', 'Giao tiêu chuẩn', 'Giao hỏa tốc', 'Nhận tại cửa hàng'];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  startDate: string = '';
  endDate: string = '';

  kpi = {
    totalOrders: 0,
    completedOrders: 0,
    completedRate: 0,
    processingOrders: 0,
    cancelledOrders: 0,
    cancelRate: 0,
    avgProcessingHours: 4.2
  };

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  topOrders: any[] = [];

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  // --- Line Chart: Orders over time ---
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
      y: { grid: { color: 'var(--border-color)', drawTicks: false }, border: { display: false } }
    },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        backgroundColor: 'var(--bg-secondary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1
      }
    }
  };

  // --- Pie Chart: Status ---
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: { label: (ctx: any) => ` ${ctx.raw} đơn` }
      }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- Bar Chart: Payment Methods ---
  public paymentChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public paymentChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: 'var(--border-color)', drawTicks: false }, border: { display: false } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // --- Bar Chart: Shipping Methods ---
  public shippingChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public shippingChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: 'var(--border-color)', drawTicks: false }, border: { display: false } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // --- Bar Chart: Location Data ---
  public locationChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public locationChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: { grid: { color: 'var(--border-color)', drawTicks: false }, border: { display: false } }
    },
    plugins: {
      legend: { display: false }
    }
  };

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showTimeDropdown = false;
      this.showStatusDropdown = false;
      this.showPaymentDropdown = false;
      this.showShippingDropdown = false;
      this.showIntervalDropdown = false;
    }
  }

  ngOnInit() {
    this.loadOrdersData();
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showTimeDropdown = name === 'time' ? !this.showTimeDropdown : false;
    this.showStatusDropdown = name === 'status' ? !this.showStatusDropdown : false;
    this.showPaymentDropdown = name === 'payment' ? !this.showPaymentDropdown : false;
    this.showShippingDropdown = name === 'shipping' ? !this.showShippingDropdown : false;
    this.showIntervalDropdown = name === 'interval' ? !this.showIntervalDropdown : false;
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; }
    if (type === 'status') { this.status = value; this.showStatusDropdown = false; }
    if (type === 'payment') { this.payment = value; this.showPaymentDropdown = false; }
    if (type === 'shipping') { this.shipping = value; this.showShippingDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
    this.loadOrdersData();
  }

  loadOrdersData() {
    this.isLoading = true;
    this.reportService.getOrdersReport({
      timeRange: this.timeRange,
      status: this.status !== 'Tất cả trạng thái' ? this.status : undefined,
      payment: this.payment !== 'Tất cả thanh toán' ? this.payment : undefined,
      shipping: this.shipping !== 'Tất cả vận chuyển' ? this.shipping : undefined,
      interval: this.interval,
      startDate: this.startDate,
      endDate: this.endDate
    }).subscribe({
      next: (data) => {
        this.kpi = data.kpi;
        this.topOrders = data.topOrders || [];

        // Line Chart: Đơn hàng theo thời gian
        this.lineChartData = {
          labels: data.chart.labels,
          datasets: [
            {
              data: data.chart.total,
              label: 'Tổng đơn',
              borderColor: '#3498db',
              backgroundColor: '#3498db',
              borderWidth: 3,
              pointBackgroundColor: '#3498db',
            },
            {
              data: data.chart.completed,
              label: 'Hoàn thành',
              borderColor: '#2ecc71',
              backgroundColor: '#2ecc71',
              borderWidth: 3,
              pointBackgroundColor: '#2ecc71',
            }
          ]
        };

        // Pie Chart: Trạng thái đơn hàng
        this.pieChartData = {
          labels: data.byStatus.map(d => d.name),
          datasets: [{
            data: data.byStatus.map(d => d.value),
            backgroundColor: PIE_COLORS.slice(0, data.byStatus.length),
            borderWidth: 0
          }]
        };

        // Payment Chart: Phương thức thanh toán
        this.paymentChartData = {
          labels: data.byPaymentMethod.map(d => d.name),
          datasets: [{
            data: data.byPaymentMethod.map(d => d.value),
            label: 'Đơn hàng',
            backgroundColor: '#34495e',
            borderRadius: [4, 4, 0, 0],
            barPercentage: 0.6
          }]
        };

        // Shipping Chart: Phương thức vận chuyển
        this.shippingChartData = {
          labels: data.byShippingMethod.map(d => d.name),
          datasets: [{
            data: data.byShippingMethod.map(d => d.value),
            label: 'Đơn hàng',
            backgroundColor: '#9b59b6',
            borderRadius: [4, 4, 0, 0],
            barPercentage: 0.6
          }]
        };
        
        // Location Chart: Đơn theo Tỉnh thành
        this.locationChartData = {
          labels: data.byLocation.map(d => d.name),
          datasets: [{
            data: data.byLocation.map(d => d.value),
            label: 'Đơn hàng',
            backgroundColor: '#e67e22',
            borderRadius: [4, 4, 0, 0],
            barPercentage: 0.6
          }]
        };

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi tải báo cáo đơn hàng thực tế:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
