import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Filter, Truck, CreditCard, Activity 
} from 'lucide-angular';

const PIE_COLORS = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'];

const ORDERS_DATA_MAP: Record<string, any[]> = {
  'today': [
    { name: '00:00', total: 10, completed: 8 },
    { name: '06:00', total: 25, completed: 20 },
    { name: '12:00', total: 45, completed: 35 },
    { name: '18:00', total: 30, completed: 25 },
  ],
  '7_days': [
    { name: '01/08', total: 40, completed: 35 },
    { name: '02/08', total: 30, completed: 28 },
    { name: '03/08', total: 55, completed: 50 },
    { name: '04/08', total: 42, completed: 38 },
    { name: '05/08', total: 48, completed: 45 },
    { name: '06/08', total: 60, completed: 55 },
    { name: '07/08', total: 67, completed: 62 },
  ],
  'month': [
    { name: 'Tuần 1', total: 200, completed: 180 },
    { name: 'Tuần 2', total: 250, completed: 230 },
    { name: 'Tuần 3', total: 220, completed: 200 },
    { name: 'Tuần 4', total: 300, completed: 280 },
  ]
};

const ORDER_STATUS = [
  { name: 'Hoàn thành', value: 680 },
  { name: 'Đang xử lý', value: 120 },
  { name: 'Chờ thanh toán', value: 80 },
  { name: 'Đã hủy', value: 45 },
];

const PAYMENT_METHODS = [
  { name: 'COD', value: 450 },
  { name: 'Chuyển khoản', value: 320 },
  { name: 'Thẻ tín dụng', value: 120 },
  { name: 'Ví điện tử', value: 35 },
];

const SHIPPING_METHODS = [
  { name: 'Giao hàng tiêu chuẩn', value: 600 },
  { name: 'Giao hàng hỏa tốc', value: 250 },
  { name: 'Nhận tại cửa hàng', value: 75 },
];

const LOCATION_DATA = [
  { name: 'TP.HCM', value: 450 },
  { name: 'Hà Nội', value: 320 },
  { name: 'Đà Nẵng', value: 120 },
  { name: 'Đồng Nai', value: 85 },
  { name: 'Bình Dương', value: 65 },
];

const TOP_ORDERS = [
  { id: '#ORD-0012', customer: 'Nguyễn Văn A', items: 3, total: '45,000,000 ₫', status: 'Hoàn thành', date: '07/08/2026' },
  { id: '#ORD-0084', customer: 'Trần Thị B', items: 5, total: '32,500,000 ₫', status: 'Đang xử lý', date: '07/08/2026' },
  { id: '#ORD-0105', customer: 'Lê Văn C', items: 2, total: '28,000,000 ₫', status: 'Hoàn thành', date: '06/08/2026' },
  { id: '#ORD-0042', customer: 'Phạm Thị D', items: 1, total: '15,000,000 ₫', status: 'Đã hủy', date: '05/08/2026' },
  { id: '#ORD-0199', customer: 'Hoàng Văn E', items: 4, total: '12,500,000 ₫', status: 'Hoàn thành', date: '05/08/2026' },
];

@Component({
  selector: 'app-orders-report',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrdersComponent implements OnInit {
  icons = { Calendar, Download, ChevronDown, Filter, Truck, CreditCard, Activity };

  timeRange = '7_days';
  showTimeDropdown = false;
  
  status = 'Tất cả trạng thái';
  showStatusDropdown = false;
  statuses = ['Tất cả trạng thái', 'Hoàn thành', 'Đang xử lý', 'Chờ thanh toán', 'Đã hủy'];

  payment = 'Tất cả thanh toán';
  showPaymentDropdown = false;
  payments = ['Tất cả thanh toán', 'COD', 'Chuyển khoản', 'Thẻ tín dụng', 'Ví điện tử'];

  shipping = 'Tất cả vận chuyển';
  showShippingDropdown = false;
  shippings = ['Tất cả vận chuyển', 'Giao tiêu chuẩn', 'Giao hỏa tốc', 'Nhận tại cửa hàng'];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  topOrders = TOP_ORDERS;

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
    this.updateCharts();
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
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; this.updateCharts(); }
    if (type === 'status') { this.status = value; this.showStatusDropdown = false; }
    if (type === 'payment') { this.payment = value; this.showPaymentDropdown = false; }
    if (type === 'shipping') { this.shipping = value; this.showShippingDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
  }

  updateCharts() {
    const ordersData = ORDERS_DATA_MAP[this.timeRange] || ORDERS_DATA_MAP['7_days'];
    
    // Line Chart
    this.lineChartData = {
      labels: ordersData.map(d => d.name),
      datasets: [
        {
          data: ordersData.map(d => d.total),
          label: 'Tổng đơn',
          borderColor: '#3498db',
          backgroundColor: '#3498db',
          borderWidth: 3,
          pointBackgroundColor: '#3498db',
        },
        {
          data: ordersData.map(d => d.completed),
          label: 'Hoàn thành',
          borderColor: '#2ecc71',
          backgroundColor: '#2ecc71',
          borderWidth: 3,
          pointBackgroundColor: '#2ecc71',
        }
      ]
    };

    // Pie Chart
    this.pieChartData = {
      labels: ORDER_STATUS.map(d => d.name),
      datasets: [{
        data: ORDER_STATUS.map(d => d.value),
        backgroundColor: PIE_COLORS,
        borderWidth: 0
      }]
    };

    // Payment Chart
    this.paymentChartData = {
      labels: PAYMENT_METHODS.map(d => d.name),
      datasets: [{
        data: PAYMENT_METHODS.map(d => d.value),
        label: 'Đơn hàng',
        backgroundColor: '#34495e',
        borderRadius: [4, 4, 0, 0],
        barPercentage: 0.6
      }]
    };

    // Shipping Chart
    this.shippingChartData = {
      labels: SHIPPING_METHODS.map(d => d.name),
      datasets: [{
        data: SHIPPING_METHODS.map(d => d.value),
        label: 'Đơn hàng',
        backgroundColor: '#9b59b6',
        borderRadius: [4, 4, 0, 0],
        barPercentage: 0.6
      }]
    };
    
    // Location Chart
    this.locationChartData = {
      labels: LOCATION_DATA.map(d => d.name),
      datasets: [{
        data: LOCATION_DATA.map(d => d.value),
        label: 'Đơn hàng',
        backgroundColor: '#e67e22',
        borderRadius: [4, 4, 0, 0],
        barPercentage: 0.6
      }]
    };
  }
}
