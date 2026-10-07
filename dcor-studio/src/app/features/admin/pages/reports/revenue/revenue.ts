import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, Tag, Layers 
} from 'lucide-angular';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

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

const CATEGORY_REVENUE = [
  { name: 'Sofa', value: 45000 },
  { name: 'Giường', value: 32000 },
  { name: 'Bàn ghế ăn', value: 28000 },
  { name: 'Tủ kệ', value: 15000 },
  { name: 'Đồ trang trí', value: 8000 },
];

const SHOWROOM_REVENUE = [
  { name: 'Quận 1', value: 35000 },
  { name: 'Quận 3', value: 28000 },
  { name: 'Quận 7', value: 45000 },
  { name: 'Gò Vấp', value: 20000 },
];

const TOP_REVENUE_PRODUCTS = [
  { name: 'Sofa Indivi', value: 15000 },
  { name: 'Giường Osaka', value: 12000 },
  { name: 'Bàn ăn Milano', value: 9500 },
  { name: 'Ghế lười Ottawa', value: 8000 },
  { name: 'Tủ tivi Lugano', value: 6500 },
];

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './revenue.html',
  styleUrls: ['./revenue.css']
})
export class RevenueComponent implements OnInit {
  icons = { Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, Tag, Layers };

  compare = false;
  timeRange = '7_days';
  showTimeDropdown = false;
  
  category = 'Tất cả danh mục';
  showCategoryDropdown = false;
  categories = ['Tất cả danh mục', 'Sofa', 'Giường', 'Bàn ghế ăn', 'Tủ kệ', 'Đồ trang trí'];

  brand = 'Tất cả thương hiệu';
  showBrandDropdown = false;
  brands = ['Tất cả thương hiệu', 'Dcor In-house', 'BoConcept', 'Calligaris', 'Natuzzi'];

  collection = 'Tất cả bộ sưu tập';
  showCollectionDropdown = false;
  collections = ['Tất cả bộ sưu tập', 'Spring 2026', 'Summer Vibe', 'Minimalist', 'Classic Wooden'];

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
    this.updateCharts();
  }

  toggleCompare() {
    this.compare = !this.compare;
    this.updateCharts();
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
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; this.updateCharts(); }
    if (type === 'category') { this.category = value; this.showCategoryDropdown = false; }
    if (type === 'brand') { this.brand = value; this.showBrandDropdown = false; }
    if (type === 'collection') { this.collection = value; this.showCollectionDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
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
          borderColor: '#bc5f13',
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
      labels: CATEGORY_REVENUE.map(d => d.name),
      datasets: [{
        data: CATEGORY_REVENUE.map(d => d.value),
        backgroundColor: PIE_COLORS,
        borderWidth: 0
      }]
    };

    // Bar Chart
    this.barChartData = {
      labels: CATEGORY_REVENUE.map(d => d.name),
      datasets: [{
        data: CATEGORY_REVENUE.map(d => d.value),
        label: 'Doanh thu',
        backgroundColor: '#3498db',
        borderRadius: 4,
        barPercentage: 0.6
      }]
    };

    // Top Products
    this.topProductsData = {
      labels: TOP_REVENUE_PRODUCTS.map(d => d.name),
      datasets: [{
        data: TOP_REVENUE_PRODUCTS.map(d => d.value),
        label: 'Doanh thu',
        backgroundColor: '#e74c3c',
        borderRadius: 4,
        barPercentage: 0.6
      }]
    };

    // Showroom Revenue
    this.showroomChartData = {
      labels: SHOWROOM_REVENUE.map(d => d.name),
      datasets: [{
        data: SHOWROOM_REVENUE.map(d => d.value),
        label: 'Doanh thu',
        backgroundColor: '#2ecc71',
        borderRadius: 4,
        barPercentage: 0.6
      }]
    };
  }
}
