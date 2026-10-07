import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Package, Star, Link as LinkIcon, Search 
} from 'lucide-angular';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

const INTERACTIONS_DATA_MAP: Record<string, any[]> = {
  'today': [
    { name: '00:00', views: 120, cart: 15, purchase: 2 }, { name: '06:00', views: 350, cart: 45, purchase: 8 },
    { name: '12:00', views: 800, cart: 120, purchase: 25 }, { name: '18:00', views: 1200, cart: 210, purchase: 45 },
  ],
  '7_days': [
    { name: '01/08', views: 4500, cart: 620, purchase: 115 }, { name: '02/08', views: 5200, cart: 750, purchase: 132 },
    { name: '03/08', views: 4800, cart: 680, purchase: 124 }, { name: '04/08', views: 6100, cart: 890, purchase: 168 },
    { name: '05/08', views: 5900, cart: 810, purchase: 154 }, { name: '06/08', views: 7200, cart: 1050, purchase: 195 },
    { name: '07/08', views: 8500, cart: 1240, purchase: 245 },
  ],
  'month': [
    { name: 'Tuần 1', views: 28000, cart: 4200, purchase: 850 }, { name: 'Tuần 2', views: 35000, cart: 5400, purchase: 1100 },
    { name: 'Tuần 3', views: 32000, cart: 4800, purchase: 980 }, { name: 'Tuần 4', views: 45000, cart: 7200, purchase: 1450 },
  ]
};

const CATEGORY_PRODUCTS_MAP: Record<string, any[]> = {
  main: [
    { name: 'Sofa', value: 120 }, { name: 'Giường', value: 85 }, { name: 'Bàn ghế ăn', value: 150 }, { name: 'Tủ kệ', value: 95 }, { name: 'Đồ trang trí', value: 240 }
  ],
  room: [
    { name: 'Phòng khách', value: 310 }, { name: 'Phòng ngủ', value: 180 }, { name: 'Phòng ăn', value: 150 }, { name: 'Làm việc', value: 50 }
  ],
  style: [
    { name: 'Hiện đại', value: 250 }, { name: 'Bắc Âu', value: 220 }, { name: 'Tối giản', value: 120 }, { name: 'Cổ điển', value: 100 }
  ]
};

const TOP_SALES_PRODUCTS = [
  { name: 'Sofa Indivi', value: 124 },
  { name: 'Giường Osaka', value: 85 },
  { name: 'Bàn ăn Milano', value: 64 },
  { name: 'Ghế lười Ottawa', value: 42 },
  { name: 'Tủ tivi Lugano', value: 38 },
  { name: 'Thảm cỏ', value: 30 },
  { name: 'Đèn bàn', value: 28 },
  { name: 'Tủ quần áo', value: 25 },
  { name: 'Bàn làm việc', value: 20 },
  { name: 'Kệ sách', value: 15 },
  { name: 'Ghế xoay', value: 12 },
  { name: 'Đồng hồ', value: 10 },
  { name: 'Bàn phấn', value: 8 },
  { name: 'Tủ giày', value: 7 },
  { name: 'Sofa góc', value: 5 },
  { name: 'Ghế đẩu', value: 4 },
  { name: 'Rèm cửa', value: 3 },
  { name: 'Tủ góc', value: 2 },
  { name: 'Ghế bành', value: 2 },
  { name: 'Thảm lớn', value: 1 },
];

const REVENUE_BY_PRODUCT = [
  { name: 'Sofa Indivi', value: 1240 },
  { name: 'Giường Osaka', value: 850 },
  { name: 'Bàn ăn Milano', value: 480 },
  { name: 'Tủ tivi Lugano', value: 342 },
  { name: 'Ghế lười Ottawa', value: 210 },
  { name: 'Tủ quần áo', value: 180 },
  { name: 'Bàn làm việc', value: 150 },
  { name: 'Kệ sách', value: 120 },
  { name: 'Sofa góc', value: 110 },
  { name: 'Bàn phấn', value: 90 },
  { name: 'Tủ giày', value: 85 },
  { name: 'Ghế xoay', value: 70 },
  { name: 'Đồng hồ', value: 65 },
  { name: 'Thảm cỏ', value: 60 },
  { name: 'Đèn bàn', value: 50 },
  { name: 'Ghế đẩu', value: 40 },
  { name: 'Rèm cửa', value: 35 },
  { name: 'Tủ góc', value: 30 },
  { name: 'Ghế bành', value: 25 },
  { name: 'Thảm lớn', value: 20 },
];

const MATRIX_COLS = ['Bàn trà', 'Đèn', 'Thảm', 'Gối tựa', 'Tủ nhỏ', 'Ghế ăn'];
const MATRIX_ROWS: { name: string, values: Record<string, number> }[] = [
  { name: 'Sofa Indivi', values: { 'Bàn trà': 45, 'Đèn': 15, 'Thảm': 35, 'Gối tựa': 60, 'Tủ nhỏ': 5, 'Ghế ăn': 0 } },
  { name: 'Giường Osaka', values: { 'Bàn trà': 0, 'Đèn': 40, 'Thảm': 20, 'Gối tựa': 80, 'Tủ nhỏ': 55, 'Ghế ăn': 0 } },
  { name: 'Bàn ăn Milano', values: { 'Bàn trà': 0, 'Đèn': 25, 'Thảm': 15, 'Gối tựa': 0, 'Tủ nhỏ': 20, 'Ghế ăn': 75 } },
  { name: 'Tủ tivi Lugano', values: { 'Bàn trà': 30, 'Đèn': 10, 'Thảm': 10, 'Gối tựa': 0, 'Tủ nhỏ': 0, 'Ghế ăn': 0 } },
];

const PRODUCT_PERFORMANCE = [
  { id: '#SP-001', name: 'Sofa Indivi 2,5 chỗ', sales: 124, revenue: '1,240M ₫', stock: 12, rating: 4.8 },
  { id: '#SP-002', name: 'Giường ngủ Osaka', sales: 85, revenue: '850M ₫', stock: 5, rating: 4.9 },
  { id: '#SP-003', name: 'Bàn ăn Milano', sales: 64, revenue: '480M ₫', stock: 0, rating: 4.5 },
  { id: '#SP-004', name: 'Ghế lười Ottawa', sales: 42, revenue: '210M ₫', stock: 24, rating: 4.7 },
  { id: '#SP-005', name: 'Tủ tivi Lugano', sales: 38, revenue: '342M ₫', stock: 8, rating: 4.6 },
];

@Component({
  selector: 'app-products-report',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './products-report.html',
  styleUrls: ['./products-report.css']
})
export class ProductsReportComponent implements OnInit {
  icons = { Calendar, Download, ChevronDown, Package, Star, LinkIcon, Search };

  timeRange = '7_days';
  showTimeDropdown = false;
  
  category = 'Tất cả danh mục';
  showCategoryDropdown = false;
  categories = ['Tất cả danh mục', 'Sofa', 'Giường', 'Bàn ghế ăn'];

  collection = 'Tất cả bộ sưu tập';
  showCollectionDropdown = false;
  collections = ['Tất cả bộ sưu tập', 'Mùa thu 2026', 'Indivi', 'Osaka'];

  brand = 'Tất cả thương hiệu';
  showBrandDropdown = false;
  brands = ['Tất cả thương hiệu', 'BoConcept', 'Calligaris', 'Ashley'];

  status = 'Trạng thái kinh doanh';
  showStatusDropdown = false;
  statuses = ['Trạng thái kinh doanh', 'Đang bán', 'Ngừng kinh doanh', 'Hết hàng'];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  topSalesCount = 10;
  showTopSalesDropdown = false;
  topSalesOpts = [5, 10, 15, 20];

  categoryType = 'main'; // main, room, style
  heatmapSearch = '';

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  matrixCols = MATRIX_COLS;
  matrixRows = MATRIX_ROWS;
  productPerformance = PRODUCT_PERFORMANCE;

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  // --- Line Chart: Interactions ---
  public interactionsChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public interactionsChartOptions: ChartConfiguration['options'] = {
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
        ticks: { callback: (val: any) => val >= 1000 ? `${val/1000}k` : val }
      }
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

  // --- Pie Chart: Category ---
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: { label: (ctx: any) => ` ${ctx.raw} SP` }
      }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- Bar Chart: Top Sales ---
  public salesChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public salesChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { grid: { color: 'var(--border-color)', drawTicks: false }, border: { display: false } },
      y: { grid: { display: false }, border: { display: false } }
    },
    plugins: { legend: { display: false } }
  };

  // --- Bar Chart: Top Revenue ---
  public revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { grid: { color: 'var(--border-color)', drawTicks: false }, border: { display: false } },
      y: { grid: { display: false }, border: { display: false } }
    },
    plugins: { legend: { display: false } }
  };

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.showTimeDropdown = false;
      this.showCategoryDropdown = false;
      this.showCollectionDropdown = false;
      this.showBrandDropdown = false;
      this.showStatusDropdown = false;
      this.showIntervalDropdown = false;
      this.showTopSalesDropdown = false;
    }
  }

  ngOnInit() {
    this.updateCharts();
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showTimeDropdown = name === 'time' ? !this.showTimeDropdown : false;
    this.showCategoryDropdown = name === 'category' ? !this.showCategoryDropdown : false;
    this.showCollectionDropdown = name === 'collection' ? !this.showCollectionDropdown : false;
    this.showBrandDropdown = name === 'brand' ? !this.showBrandDropdown : false;
    this.showStatusDropdown = name === 'status' ? !this.showStatusDropdown : false;
    this.showIntervalDropdown = name === 'interval' ? !this.showIntervalDropdown : false;
    this.showTopSalesDropdown = name === 'topsales' ? !this.showTopSalesDropdown : false;
  }

  setDropdownValue(type: string, value: any) {
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; this.updateCharts(); }
    if (type === 'category') { this.category = value; this.showCategoryDropdown = false; }
    if (type === 'collection') { this.collection = value; this.showCollectionDropdown = false; }
    if (type === 'brand') { this.brand = value; this.showBrandDropdown = false; }
    if (type === 'status') { this.status = value; this.showStatusDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
    if (type === 'topsales') { this.topSalesCount = value; this.showTopSalesDropdown = false; this.updateCharts(); }
  }

  setCategoryType(type: string) {
    this.categoryType = type;
    this.updateCharts();
  }

  getFilteredMatrixRows() {
    return this.matrixRows.filter(row => row.name.toLowerCase().includes(this.heatmapSearch.toLowerCase()));
  }

  updateCharts() {
    const interData = INTERACTIONS_DATA_MAP[this.timeRange] || INTERACTIONS_DATA_MAP['7_days'];
    
    // Interactions Chart
    this.interactionsChartData = {
      labels: interData.map(d => d.name),
      datasets: [
        {
          data: interData.map(d => d.views),
          label: 'Lượt xem',
          borderColor: '#9b59b6',
          backgroundColor: '#9b59b6',
          borderWidth: 3,
          pointBackgroundColor: '#9b59b6',
        },
        {
          data: interData.map(d => d.cart),
          label: 'Thêm vào giỏ',
          borderColor: '#3498db',
          backgroundColor: '#3498db',
          borderWidth: 3,
          pointBackgroundColor: '#3498db',
        },
        {
          data: interData.map(d => d.purchase),
          label: 'Lượt mua',
          borderColor: '#2ecc71',
          backgroundColor: '#2ecc71',
          borderWidth: 3,
          pointBackgroundColor: '#2ecc71',
        }
      ]
    };

    // Pie Chart
    const pieDataList = CATEGORY_PRODUCTS_MAP[this.categoryType] || CATEGORY_PRODUCTS_MAP['main'];
    this.pieChartData = {
      labels: pieDataList.map(d => d.name),
      datasets: [{
        data: pieDataList.map(d => d.value),
        backgroundColor: PIE_COLORS,
        borderWidth: 0
      }]
    };

    // Top Sales Bar Chart
    const topSales = TOP_SALES_PRODUCTS.slice(0, this.topSalesCount);
    this.salesChartData = {
      labels: topSales.map(d => d.name),
      datasets: [{
        data: topSales.map(d => d.value),
        label: 'Số lượng',
        backgroundColor: '#e74c3c',
        borderRadius: [0, 4, 4, 0],
        barPercentage: 0.6
      }]
    };

    // Top Revenue Bar Chart
    const topRev = REVENUE_BY_PRODUCT.slice(0, this.topSalesCount);
    this.revenueChartData = {
      labels: topRev.map(d => d.name),
      datasets: [{
        data: topRev.map(d => d.value),
        label: 'Doanh thu',
        backgroundColor: '#3498db',
        borderRadius: [0, 4, 4, 0],
        barPercentage: 0.6
      }]
    };
  }
}
