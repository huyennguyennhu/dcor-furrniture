import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Package, Star, Link as LinkIcon, Search, Tag, Layers, Filter, Activity, Clock, Check 
} from 'lucide-angular';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ReportService, ProductsReportData } from '../../../../../core/services/report.service';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

const MATRIX_COLS = ['Bàn trà', 'Đèn', 'Thảm', 'Gối tựa', 'Tủ nhỏ', 'Ghế ăn'];
const MATRIX_ROWS: { name: string, values: Record<string, number> }[] = [
  { name: 'Sofa Indivi', values: { 'Bàn trà': 45, 'Đèn': 15, 'Thảm': 35, 'Gối tựa': 60, 'Tủ nhỏ': 5, 'Ghế ăn': 0 } },
  { name: 'Giường Osaka', values: { 'Bàn trà': 0, 'Đèn': 40, 'Thảm': 20, 'Gối tựa': 80, 'Tủ nhỏ': 55, 'Ghế ăn': 0 } },
  { name: 'Bàn ăn Milano', values: { 'Bàn trà': 0, 'Đèn': 25, 'Thảm': 15, 'Gối tựa': 0, 'Tủ nhỏ': 20, 'Ghế ăn': 75 } },
  { name: 'Tủ tivi Lugano', values: { 'Bàn trà': 30, 'Đèn': 10, 'Thảm': 10, 'Gối tựa': 0, 'Tủ nhỏ': 0, 'Ghế ăn': 0 } },
];

@Component({
  selector: 'app-products-report',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './products-report.html',
  styleUrls: ['./products-report.css']
})
export class ProductsReportComponent implements OnInit {
  icons = { Calendar, Download, ChevronDown, Package, Star, LinkIcon, Search, Tag, Layers, Filter, Activity, Clock, Check };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  timeRange = '7_days';
  showTimeDropdown = false;
  
  category = 'Tất cả danh mục';
  showCategoryDropdown = false;
  categories = ['Tất cả danh mục', 'Sofas', 'Rugs', 'Chairs', 'Lamps', 'Tables'];

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

  kpi = {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    bestSellerName: 'Đang tải...',
    bestSellerCount: 0
  };

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  matrixCols = MATRIX_COLS;
  matrixRows = MATRIX_ROWS;
  productPerformance: any[] = [];

  rawCategoryProducts: { name: string; value: number }[] = [];
  rawTopSales: { name: string; value: number }[] = [];
  rawRevenueByProduct: { name: string; value: number }[] = [];

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
    this.loadProductsData();
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
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; }
    if (type === 'category') { this.category = value; this.showCategoryDropdown = false; }
    if (type === 'collection') { this.collection = value; this.showCollectionDropdown = false; }
    if (type === 'brand') { this.brand = value; this.showBrandDropdown = false; }
    if (type === 'status') { this.status = value; this.showStatusDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
    if (type === 'topsales') { 
      this.topSalesCount = value; 
      this.showTopSalesDropdown = false; 
      this.renderChartsFromRaw(); 
      return;
    }
    this.loadProductsData();
  }

  setCategoryType(type: string) {
    this.categoryType = type;
    this.renderChartsFromRaw();
  }

  getFilteredMatrixRows() {
    return this.matrixRows.filter(row => row.name.toLowerCase().includes(this.heatmapSearch.toLowerCase()));
  }

  loadProductsData() {
    this.isLoading = true;
    this.reportService.getProductsReport({
      timeRange: this.timeRange,
      category: this.category !== 'Tất cả danh mục' ? this.category : undefined,
      brand: this.brand !== 'Tất cả thương hiệu' ? this.brand : undefined,
      status: this.status !== 'Trạng thái kinh doanh' ? this.status : undefined
    }).subscribe({
      next: (data) => {
        this.kpi = data.kpi;
        this.productPerformance = data.performanceList || [];
        this.rawCategoryProducts = data.categoryProducts || [];
        this.rawTopSales = data.topSales || [];
        this.rawRevenueByProduct = data.revenueByProduct || [];

        this.renderChartsFromRaw();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi tải báo cáo sản phẩm thực tế:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderChartsFromRaw() {
    // Interactions Chart
    const sampleLabels = this.timeRange === 'today' ? ['00:00', '06:00', '12:00', '18:00']
      : this.timeRange === 'month' ? ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4']
      : ['08/10', '09/10', '10/10', '11/10', '12/10', '13/10', '14/10'];

    this.interactionsChartData = {
      labels: sampleLabels,
      datasets: [
        {
          data: sampleLabels.map((_, i) => (i + 1) * 320 + 500),
          label: 'Lượt xem',
          borderColor: '#9b59b6',
          backgroundColor: '#9b59b6',
          borderWidth: 3,
          pointBackgroundColor: '#9b59b6',
        },
        {
          data: sampleLabels.map((_, i) => (i + 1) * 45 + 50),
          label: 'Thêm vào giỏ',
          borderColor: '#3498db',
          backgroundColor: '#3498db',
          borderWidth: 3,
          pointBackgroundColor: '#3498db',
        },
        {
          data: sampleLabels.map((_, i) => (i + 1) * 8 + 5),
          label: 'Lượt mua',
          borderColor: '#2ecc71',
          backgroundColor: '#2ecc71',
          borderWidth: 3,
          pointBackgroundColor: '#2ecc71',
        }
      ]
    };

    // Category Pie Chart
    const pieList = this.rawCategoryProducts.length > 0 ? this.rawCategoryProducts : [
      { name: 'Sofas', value: 85 },
      { name: 'Chairs', value: 45 },
      { name: 'Rugs', value: 30 },
      { name: 'Lamps', value: 25 },
      { name: 'Tables', value: 20 }
    ];
    this.pieChartData = {
      labels: pieList.map(d => d.name),
      datasets: [{
        data: pieList.map(d => d.value),
        backgroundColor: PIE_COLORS.slice(0, pieList.length),
        borderWidth: 0
      }]
    };

    // Top Sales Bar Chart
    const topSales = this.rawTopSales.slice(0, this.topSalesCount);
    this.salesChartData = {
      labels: topSales.map(d => d.name),
      datasets: [{
        data: topSales.map(d => d.value),
        label: 'Số lượng đã bán',
        backgroundColor: '#e74c3c',
        borderRadius: [0, 4, 4, 0],
        barPercentage: 0.6
      }]
    };

    // Top Revenue Bar Chart
    const topRev = this.rawRevenueByProduct.slice(0, this.topSalesCount);
    this.revenueChartData = {
      labels: topRev.map(d => d.name),
      datasets: [{
        data: topRev.map(d => d.value),
        label: 'Doanh thu (triệu ₫)',
        backgroundColor: '#3498db',
        borderRadius: [0, 4, 4, 0],
        barPercentage: 0.6
      }]
    };
  }
}
