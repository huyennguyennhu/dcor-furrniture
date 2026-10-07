import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square 
} from 'lucide-angular';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71'];

const REVENUE_DATA_MAP: Record<string, any[]> = {
  'today': [
    { name: '00:00', current: 1500, previous: 1200 },
    { name: '06:00', current: 2000, previous: 1800 },
    { name: '12:00', current: 4000, previous: 3500 },
    { name: '18:00', current: 3000, previous: 2800 },
  ],
  '7_days': [
    { name: '01/08', current: 4000, previous: 2400 },
    { name: '02/08', current: 3000, previous: 1398 },
    { name: '03/08', current: 2000, previous: 9800 },
    { name: '04/08', current: 2780, previous: 3908 },
    { name: '05/08', current: 1890, previous: 4800 },
    { name: '06/08', current: 2390, previous: 3800 },
    { name: '07/08', current: 3490, previous: 4300 },
  ],
  'month': [
    { name: 'Tuần 1', current: 15000, previous: 12000 },
    { name: 'Tuần 2', current: 20000, previous: 18000 },
    { name: 'Tuần 3', current: 18000, previous: 15000 },
    { name: 'Tuần 4', current: 25000, previous: 20000 },
  ]
};

const ORDER_STATUS_DATA = [
  { name: 'Hoàn thành', value: 400 },
  { name: 'Đang xử lý', value: 300 },
  { name: 'Đã hủy', value: 50 },
  { name: 'Chờ xác nhận', value: 100 },
];

const CATEGORY_REVENUE_DATA = [
  { name: 'Sofa', value: 4000 },
  { name: 'Giường', value: 3000 },
  { name: 'Bàn ghế ăn', value: 2000 },
  { name: 'Tủ kệ', value: 2780 },
  { name: 'Đồ trang trí', value: 1890 },
];

const FUNNEL_DATA = [
  { value: 1000, name: 'Lượt truy cập', fill: '#8884d8' },
  { value: 800, name: 'Xem sản phẩm', fill: '#83a6ed' },
  { value: 400, name: 'Thêm vào giỏ', fill: '#8dd1e1' },
  { value: 200, name: 'Thanh toán', fill: '#82ca9d' },
  { value: 50, name: 'Thành công', fill: '#a4de6c' },
];

const TOP_PRODUCTS = [
  { id: 1, name: 'Sofa Indivi 2,5 chỗ', sku: 'SF-IND-01', sales: 124, revenue: '1,240,000,000 ₫', stock: 12 },
  { id: 2, name: 'Giường ngủ Osaka', sku: 'BD-OSK-02', sales: 85, revenue: '850,000,000 ₫', stock: 5 },
  { id: 3, name: 'Bàn ăn Milano', sku: 'TB-MIL-03', sales: 64, revenue: '480,000,000 ₫', stock: 0 },
  { id: 4, name: 'Ghế lười Ottawa', sku: 'CH-OTT-04', sales: 42, revenue: '210,000,000 ₫', stock: 24 },
  { id: 5, name: 'Tủ tivi Lugano', sku: 'CB-LUG-05', sales: 38, revenue: '342,000,000 ₫', stock: 8 },
];

const TOP_CUSTOMERS = [
  { id: 1, name: 'Nguyễn Văn A', phone: '0901234567', orders: 15, totalSpent: '450,000,000 ₫', rank: 'VIP' },
  { id: 2, name: 'Trần Thị B', phone: '0912345678', orders: 8, totalSpent: '320,000,000 ₫', rank: 'Gold' },
  { id: 3, name: 'Lê Văn C', phone: '0923456789', orders: 12, totalSpent: '280,000,000 ₫', rank: 'Gold' },
  { id: 4, name: 'Phạm Thị D', phone: '0934567890', orders: 5, totalSpent: '150,000,000 ₫', rank: 'Silver' },
  { id: 5, name: 'Hoàng Văn E', phone: '0945678901', orders: 3, totalSpent: '85,000,000 ₫', rank: 'Member' },
];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  // Lucide Icons
  icons = { Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square };

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

  topProducts = TOP_PRODUCTS;
  topCustomers = TOP_CUSTOMERS;
  funnelData = FUNNEL_DATA;

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
    this.updateCharts();
  }

  toggleCompare() {
    this.compare = !this.compare;
    this.updateCharts();
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
    this.updateCharts();
  }

  setShowroom(key: string) {
    this.showroom = key;
    this.showShowroomDropdown = false;
  }

  setIntervalOpt(opt: string) {
    this.interval = opt;
    this.showIntervalDropdown = false;
  }

  updateCharts() {
    const revenueData = REVENUE_DATA_MAP[this.timeRange] || REVENUE_DATA_MAP['7_days'];
    
    // Line Chart
    this.lineChartData = {
      labels: revenueData.map(d => d.name),
      datasets: [
        {
          data: revenueData.map(d => d.current),
          label: 'Kỳ này',
          borderColor: '#bc5f13', // var(--accent)
          backgroundColor: '#bc5f13',
          borderWidth: 3,
          pointBackgroundColor: '#bc5f13',
        }
      ]
    };

    if (this.compare) {
      this.lineChartData.datasets.push({
        data: revenueData.map(d => d.previous),
        label: 'Kỳ trước',
        borderColor: '#9ca3af',
        backgroundColor: '#9ca3af',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#9ca3af',
      });
    }

    // Pie Chart
    this.pieChartData = {
      labels: ORDER_STATUS_DATA.map(d => d.name),
      datasets: [{
        data: ORDER_STATUS_DATA.map(d => d.value),
        backgroundColor: PIE_COLORS,
        borderWidth: 0
      }]
    };

    // Bar Chart
    this.barChartData = {
      labels: CATEGORY_REVENUE_DATA.map(d => d.name),
      datasets: [{
        data: CATEGORY_REVENUE_DATA.map(d => d.value),
        label: 'Doanh thu',
        backgroundColor: '#3498db',
        borderRadius: 4,
        barPercentage: 0.6
      }]
    };
  }

  getMaxFunnelValue() {
    return Math.max(...this.funnelData.map(d => d.value));
  }
}
