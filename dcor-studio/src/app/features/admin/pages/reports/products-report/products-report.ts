import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Package, Star, Link as LinkIcon, Search, Tag, 
  Layers, Filter, Activity, Clock, Check, CheckSquare, Square, ExternalLink, 
  TrendingUp, TrendingDown, Eye, ShoppingCart, ShoppingBag, Box
} from 'lucide-angular';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ReportService, ProductsReportData } from '../../../../../core/services/report.service';

// Palette màu chuẩn DCOR Luxury mở rộng cho đa danh mục
const PIE_COLORS = [
  '#765337', // Nâu thương hiệu DCOR
  '#BC5F13', // Cam đất Terracotta
  '#2c3e50', // Xanh đen sang trọng Navy
  '#8c7d70', // Xám ấm Warm Grey
  '#d97706', // Hổ phách Amber
  '#4a6572', // Slate Blue
  '#b38867', // Nâu nhạt Cafe au lait
  '#6c5b7b', // Tím than Vintage
  '#355c7d', // Xanh cổ vịt Deep Teal
  '#c06c84', // Hồng đất Muted Rose
  '#546e7a', // Steel Blue
  '#a0522d'  // Sienna
];

const MATRIX_COLS = ['Bàn trà', 'Đèn', 'Thảm', 'Gối tựa', 'Tủ nhỏ', 'Ghế ăn'];
const MATRIX_ROWS: { name: string, values: Record<string, number> }[] = [
  { name: 'Sofa Indivi', values: { 'Bàn trà': 45, 'Đèn': 15, 'Thảm': 35, 'Gối tựa': 60, 'Tủ nhỏ': 5, 'Ghế ăn': 0 } },
  { name: 'Giường Osaka', values: { 'Bàn trà': 0, 'Đèn': 40, 'Thảm': 20, 'Gối tựa': 80, 'Tủ nhỏ': 55, 'Ghế ăn': 0 } },
  { name: 'Bàn ăn Milano', values: { 'Bàn trà': 0, 'Đèn': 25, 'Thảm': 15, 'Gối tựa': 0, 'Tủ nhỏ': 20, 'Ghế ăn': 75 } },
  { name: 'Tủ tivi Lugano', values: { 'Bàn trà': 30, 'Đèn': 10, 'Thảm': 10, 'Gối tựa': 0, 'Tủ nhỏ': 0, 'Ghế ăn': 0 } },
];

// Plugin đường gióng dọc đối chiếu khi hover trục X (Vertical Crosshair Guideline)
const verticalCrosshairPlugin = {
  id: 'verticalCrosshair',
  afterDraw: (chart: any) => {
    if (chart.tooltip?._active && chart.tooltip._active.length) {
      const activePoint = chart.tooltip._active[0];
      const ctx = chart.ctx;
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(118, 83, 55, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

@Component({
  selector: 'app-products-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './products-report.html',
  styleUrls: ['./products-report.css']
})
export class ProductsReportComponent implements OnInit {
  icons = { 
    Calendar, Download, ChevronDown, Package, Star, LinkIcon, Search, Tag, 
    Layers, Filter, Activity, Clock, Check, CheckSquare, Square, ExternalLink, 
    TrendingUp, TrendingDown, Eye, ShoppingCart, ShoppingBag, Box
  };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  isLoading = true;
  isInteractionsLoading = false;
  isCategoryLoading = false;

  // Filter State
  compare: boolean = false;
  timeRange = '7_days';
  startDate: string = '';
  endDate: string = '';
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

  categoryType = 'main'; // main, sub, room, style
  categoryBreakdown?: ProductsReportData['categoryBreakdown'];
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

  // --- Line Chart: Interactions (Có Crosshair Guideline) ---
  public interactionsChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public interactionsChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    elements: {
      line: { tension: 0.35 },
      point: { radius: 3, hitRadius: 10, hoverRadius: 6 }
    },
    scales: {
      x: { 
        grid: { display: false },
        ticks: { color: '#8c7d70', font: { size: 12 } }
      },
      y: { 
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { 
          color: '#8c7d70', 
          font: { size: 12 },
          callback: (val: any) => val >= 1000 ? `${val/1000}k` : val 
        }
      }
    },
    plugins: {
      legend: { 
        position: 'top', 
        align: 'end',
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } 
      },
      tooltip: {
        backgroundColor: 'rgba(50, 33, 22, 0.95)',
        titleColor: '#FCF8F3',
        bodyColor: '#FCF8F3',
        borderColor: '#765337',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true
      }
    }
  };
  public interactionsChartPlugins = [verticalCrosshairPlugin];

  // --- Pie Chart: Category (DCOR Luxury Palette) ---
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom', 
        labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } 
      },
      tooltip: {
        backgroundColor: 'rgba(50, 33, 22, 0.95)',
        titleColor: '#FCF8F3',
        bodyColor: '#FCF8F3',
        borderColor: '#765337',
        borderWidth: 1,
        callbacks: { 
          label: (ctx: any) => {
            const val = Number(ctx.raw) || 0;
            const dataset = ctx.chart.data.datasets[0];
            const total = (dataset?.data || []).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
            return ` ${ctx.label}: ${val} sản phẩm (${pct}%)`;
          }
        }
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
      x: { 
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { color: '#8c7d70', font: { size: 11 }, precision: 0 }
      },
      y: { 
        grid: { display: false }, 
        border: { display: false },
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
          label: (ctx: any) => ` Đã bán: ${ctx.raw} sản phẩm`
        }
      }
    }
  };

  // --- Bar Chart: Top Revenue ---
  public revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { 
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { 
          color: '#8c7d70', 
          font: { size: 11 },
          callback: (val: any) => `${val}M`
        }
      },
      y: { 
        grid: { display: false }, 
        border: { display: false },
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
          label: (ctx: any) => ` Doanh thu: ${ctx.raw} triệu ₫`
        }
      }
    }
  };

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-dropdown-wrapper')) {
      this.closeAllDropdowns();
    }
  }

  ngOnInit() {
    this.loadProductsData();
  }

  toggleCompare() {
    this.compare = !this.compare;
    this.loadProductsData();
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    const curr = (this as any)['show' + name.charAt(0).toUpperCase() + name.slice(1) + 'Dropdown'];
    this.closeAllDropdowns();
    if (name === 'time') this.showTimeDropdown = !curr;
    if (name === 'category') this.showCategoryDropdown = !curr;
    if (name === 'collection') this.showCollectionDropdown = !curr;
    if (name === 'brand') this.showBrandDropdown = !curr;
    if (name === 'status') this.showStatusDropdown = !curr;
    if (name === 'interval') this.showIntervalDropdown = !curr;
    if (name === 'topsales') this.showTopSalesDropdown = !curr;
  }

  closeAllDropdowns() {
    this.showTimeDropdown = false;
    this.showCategoryDropdown = false;
    this.showCollectionDropdown = false;
    this.showBrandDropdown = false;
    this.showStatusDropdown = false;
    this.showIntervalDropdown = false;
    this.showTopSalesDropdown = false;
  }

  setDropdownValue(type: string, value: any) {
    if (type === 'time') { this.timeRange = value; }
    if (type === 'category') { this.category = value; }
    if (type === 'collection') { this.collection = value; }
    if (type === 'brand') { this.brand = value; }
    if (type === 'status') { this.status = value; }
    if (type === 'interval') { 
      this.interval = value; 
      this.closeAllDropdowns();
      this.isInteractionsLoading = true;
      setTimeout(() => {
        this.renderInteractionsChart();
        this.isInteractionsLoading = false;
        this.cdr.markForCheck();
      }, 150);
      return;
    }
    if (type === 'topsales') { 
      this.topSalesCount = value; 
      this.closeAllDropdowns();
      this.renderChartsFromRaw(); 
      return;
    }
    this.closeAllDropdowns();
    this.loadProductsData();
  }

  setCategoryType(type: string) {
    if (this.categoryType === type) return;
    this.categoryType = type;
    this.isCategoryLoading = true;
    setTimeout(() => {
      this.renderCategoryChart();
      this.isCategoryLoading = false;
      this.cdr.markForCheck();
    }, 150);
  }

  getFilteredMatrixRows() {
    return this.matrixRows.filter(row => row.name.toLowerCase().includes(this.heatmapSearch.toLowerCase()));
  }

  loadProductsData() {
    this.isLoading = true;
    this.reportService.getProductsReport({
      timeRange: this.timeRange,
      startDate: this.timeRange === 'custom' ? this.startDate : undefined,
      endDate: this.timeRange === 'custom' ? this.endDate : undefined,
      category: this.category !== 'Tất cả danh mục' ? this.category : undefined,
      brand: this.brand !== 'Tất cả thương hiệu' ? this.brand : undefined,
      status: this.status !== 'Trạng thái kinh doanh' ? this.status : undefined,
      compare: this.compare
    }).subscribe({
      next: (data) => {
        if (data.categoryList && data.categoryList.length > 0) {
          this.categories = data.categoryList;
        }
        this.kpi = data.kpi;
        this.productPerformance = data.performanceList || [];
        this.rawCategoryProducts = data.categoryProducts || [];
        this.categoryBreakdown = data.categoryBreakdown;
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

  renderInteractionsChart() {
    let sampleLabels: string[] = [];
    let viewsData: number[] = [];
    let cartData: number[] = [];
    let buyData: number[] = [];

    if (this.interval === 'Giờ') {
      sampleLabels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      viewsData = [45, 12, 28, 120, 240, 195, 310, 265];
      cartData = [8, 2, 5, 24, 48, 38, 62, 53];
      buyData = [2, 0, 1, 6, 14, 9, 18, 12];
    } else if (this.interval === 'Tuần') {
      sampleLabels = ['Tuần 40', 'Tuần 41', 'Tuần 42', 'Tuần 43', 'Tuần 44'];
      viewsData = [3200, 3850, 4100, 4600, 5200];
      cartData = [480, 560, 620, 710, 830];
      buyData = [110, 135, 148, 182, 215];
    } else if (this.interval === 'Tháng') {
      sampleLabels = ['Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11'];
      viewsData = [14200, 15800, 17200, 19100, 21500, 23800];
      cartData = [2100, 2450, 2780, 3150, 3620, 4050];
      buyData = [520, 590, 680, 790, 910, 1020];
    } else {
      // Mặc định: Theo Ngày
      sampleLabels = ['28/10', '29/10', '30/10', '31/10', '01/11', '02/11', '03/11'];
      viewsData = [820, 940, 890, 1120, 1350, 1480, 1620];
      cartData = [125, 148, 136, 175, 210, 235, 260];
      buyData = [32, 38, 35, 46, 58, 64, 72];
    }

    this.interactionsChartData = {
      labels: sampleLabels,
      datasets: [
        {
          data: viewsData,
          label: 'Lượt xem sản phẩm',
          borderColor: '#8c7d70', // Xám ấm DCOR
          backgroundColor: '#8c7d70',
          borderWidth: 2.5,
          pointBackgroundColor: '#8c7d70',
        },
        {
          data: cartData,
          label: 'Thêm vào giỏ',
          borderColor: '#c06c34', // Cam đất ấm
          backgroundColor: '#c06c34',
          borderWidth: 2.5,
          pointBackgroundColor: '#c06c34',
        },
        {
          data: buyData,
          label: 'Lượt mua thành công',
          borderColor: '#765337', // Nâu thương hiệu
          backgroundColor: '#765337',
          borderWidth: 3,
          pointBackgroundColor: '#765337',
        }
      ]
    };
  }

  renderCategoryChart() {
    let pieList: { name: string; value: number }[] = [];
    if (this.categoryBreakdown) {
      if (this.categoryType === 'main' && this.categoryBreakdown.main?.length) {
        pieList = this.categoryBreakdown.main;
      } else if (this.categoryType === 'sub' && this.categoryBreakdown.sub?.length) {
        pieList = this.categoryBreakdown.sub;
      } else if (this.categoryType === 'room' && this.categoryBreakdown.room?.length) {
        pieList = this.categoryBreakdown.room;
      } else if (this.categoryType === 'style' && this.categoryBreakdown.style?.length) {
        pieList = this.categoryBreakdown.style;
      }
    }
    if (!pieList || pieList.length === 0) {
      pieList = this.rawCategoryProducts.length > 0 ? this.rawCategoryProducts : [
        { name: 'Sofas', value: 52 },
        { name: 'Storage', value: 41 },
        { name: 'Chairs', value: 32 },
        { name: 'Tables', value: 30 },
        { name: 'Accessories', value: 17 }
      ];
    }

    const bgColors = pieList.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]);

    this.pieChartData = {
      labels: pieList.map(d => d.name),
      datasets: [{
        data: pieList.map(d => d.value),
        backgroundColor: bgColors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  renderChartsFromRaw() {
    // 1. Interactions Multi-Line Chart (Palette DCOR sang trọng)
    this.renderInteractionsChart();

    // 2. Category Pie / Donut Chart (Palette DCOR Luxury - Dữ liệu thật từ DB)
    this.renderCategoryChart();

    // 3. Top Sales Bar Chart (Cam đất #c06c34)
    const topSales = this.rawTopSales.slice(0, this.topSalesCount);
    this.salesChartData = {
      labels: topSales.map(d => d.name),
      datasets: [{
        data: topSales.map(d => d.value),
        label: 'Số lượng đã bán',
        backgroundColor: '#c06c34',
        borderRadius: [0, 4, 4, 0],
        barPercentage: 0.6
      }]
    };

    // 4. Top Revenue Bar Chart (Nâu thương hiệu #765337)
    const topRev = this.rawRevenueByProduct.slice(0, this.topSalesCount);
    this.revenueChartData = {
      labels: topRev.map(d => d.name),
      datasets: [{
        data: topRev.map(d => d.value),
        label: 'Doanh thu (triệu ₫)',
        backgroundColor: '#765337',
        borderRadius: [0, 4, 4, 0],
        barPercentage: 0.6
      }]
    };
  }

  exportReport() {
    let csv = '\uFEFF';
    csv += 'BÁO CÁO HIỆU QUẢ SẢN PHẨM DCOR STUDIO\n';
    csv += `Thời gian: ${this.TIME_LABELS[this.timeRange]} (${new Date().toLocaleDateString('vi-VN')})\n`;
    csv += `Danh mục: ${this.category} | Bộ sưu tập: ${this.collection} | Thương hiệu: ${this.brand}\n\n`;

    csv += 'CHỈ SỐ KPIS SẢN PHẨM\n';
    csv += `Tổng sản phẩm,${this.kpi.totalProducts} SP\n`;
    csv += `Sản phẩm đang kinh doanh,${this.kpi.activeProducts} SP\n`;
    csv += `Sản phẩm bán chạy nhất,${this.kpi.bestSellerName} (${this.kpi.bestSellerCount} lượt bán)\n`;
    csv += `Cảnh báo gần hết hàng,${this.kpi.lowStockProducts} SKU\n`;
    csv += `Hết hàng,${this.kpi.outOfStockProducts} SKU\n\n`;

    csv += 'DANH SÁCH HIỆU QUẢ SẢN PHẨM CHI TIẾT\n';
    csv += 'Mã SP,Tên sản phẩm,Lượt bán,Doanh thu,Tồn kho,Đánh giá\n';

    this.productPerformance.forEach(p => {
      csv += `"${p.id}","${p.name}","${p.sales}","${p.revenue}","${p.stock}","${p.rating}"\n`;
    });

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_San_Pham_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
