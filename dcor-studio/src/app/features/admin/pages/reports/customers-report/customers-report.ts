import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Users, Award, MapPin, Clock, Check,
  CheckSquare, Square, ExternalLink, TrendingUp, TrendingDown, Eye, ShoppingBag
} from 'lucide-angular';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { ReportService, CustomersReportData } from '../../../../../core/services/report.service';

// Bảng màu chuẩn DCOR Luxury cho phân hạng thành viên
// Kim cương (#765337), Vàng (#BC5F13), Bạc (#8c7d70), Thành viên (#2c3e50)
const TIER_COLORS = ['#765337', '#BC5F13', '#8c7d70', '#2c3e50'];

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
  selector: 'app-customers-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, LucideAngularModule, IconComponent],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './customers-report.html',
  styleUrls: ['./customers-report.css']
})
export class CustomersReportComponent implements OnInit {
  icons = { 
    Calendar, Download, ChevronDown, Users, Award, MapPin, Clock, Check,
    CheckSquare, Square, ExternalLink, TrendingUp, TrendingDown, Eye, ShoppingBag
  };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  isGrowthLoading = false;

  // Filter States
  compare: boolean = false;
  timeRange = '7_days';
  startDate: string = '';
  endDate: string = '';
  showTimeDropdown = false;
  
  tier = 'Tất cả hạng thành viên';
  showTierDropdown = false;
  tiers = ['Tất cả hạng thành viên', 'Kim cương', 'Vàng', 'Bạc', 'Thành viên'];

  location = 'Tất cả khu vực';
  showLocationDropdown = false;
  locations = ['Tất cả khu vực', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai'];

  customerType = 'Tất cả loại khách';
  showTypeDropdown = false;
  customerTypes = ['Tất cả loại khách', 'Khách lẻ (RETAIL)', 'Khách dự án (B2B)'];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  kpi: CustomersReportData['kpi'] = {
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    repeatPurchaseRate: 0,
    vipRevenuePercent: 0,
    vipCustomerCount: 0,
    growthRate: 0
  };

  TIME_LABELS: Record<string, string> = {
    'today': 'Hôm nay',
    '7_days': '7 ngày qua',
    'month': 'Tháng này',
    'custom': 'Tùy chỉnh'
  };
  timeLabelKeys = Object.keys(this.TIME_LABELS);

  topSpenders: any[] = [];
  topOrderFreq: any[] = [];
  rawMembershipData: { name: string; value: number }[] = [];
  rawLocationData: { name: string; value: number }[] = [];
  rawChartData: { labels: string[]; values: number[]; prevValues?: number[] } = { labels: [], values: [] };

  // Ma trận nhiệt lịch tư vấn Showroom theo khung giờ trong tuần (Theo spec 5)
  heatmapCols = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  heatmapRows = [
    { slot: '09:00 - 10:30', period: 'Ca sáng', values: { 'Thứ 2': 1, 'Thứ 3': 2, 'Thứ 4': 1, 'Thứ 5': 2, 'Thứ 6': 3, 'Thứ 7': 6, 'Chủ Nhật': 5 } as Record<string, number> },
    { slot: '10:30 - 12:00', period: 'Ca sáng', values: { 'Thứ 2': 2, 'Thứ 3': 1, 'Thứ 4': 2, 'Thứ 5': 3, 'Thứ 6': 4, 'Thứ 7': 8, 'Chủ Nhật': 7 } as Record<string, number> },
    { slot: '14:00 - 15:30', period: 'Ca chiều', values: { 'Thứ 2': 1, 'Thứ 3': 3, 'Thứ 4': 2, 'Thứ 5': 2, 'Thứ 6': 5, 'Thứ 7': 9, 'Chủ Nhật': 8 } as Record<string, number> },
    { slot: '16:00 - 17:30', period: 'Ca chiều', values: { 'Thứ 2': 2, 'Thứ 3': 2, 'Thứ 4': 3, 'Thứ 5': 4, 'Thứ 6': 6, 'Thứ 7': 10, 'Chủ Nhật': 9 } as Record<string, number> },
    { slot: '18:30 - 20:00', period: 'Ca tối', values: { 'Thứ 2': 3, 'Thứ 3': 3, 'Thứ 4': 4, 'Thứ 5': 5, 'Thứ 6': 7, 'Thứ 7': 8, 'Chủ Nhật': 6 } as Record<string, number> },
  ];

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  // --- 1. Line Chart: Tăng trưởng khách hàng mới ---
  public lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public lineChartPlugins = [verticalCrosshairPlugin];
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
        ticks: { color: '#8c7d70', font: { size: 12 } }
      },
      y: { 
        grid: { color: 'rgba(0,0,0,0.05)', drawTicks: false }, 
        border: { display: false },
        ticks: { color: '#8c7d70', font: { size: 12 }, precision: 0 }
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
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw} khách mới`
        }
      }
    }
  };

  // --- 2. Donut Chart: Phân bố Hạng thành viên ---
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
            return ` ${ctx.label}: ${val} khách (${pct}%)`;
          }
        }
      }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- 3. Bar Chart: Phân bố Tỉnh thành & Khu vực ---
  public locationChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public locationChartOptions: ChartConfiguration['options'] = {
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
          label: (ctx: any) => ` Số lượng khách: ${ctx.raw} khách`
        }
      }
    }
  };

  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent) {
    if (this.filterRef && !this.filterRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  ngOnInit() {
    this.loadCustomersData();
  }

  closeAllDropdowns() {
    this.showTimeDropdown = false;
    this.showTierDropdown = false;
    this.showLocationDropdown = false;
    this.showTypeDropdown = false;
    this.showIntervalDropdown = false;
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    const currentState = name === 'time' ? this.showTimeDropdown :
                        name === 'tier' ? this.showTierDropdown :
                        name === 'location' ? this.showLocationDropdown :
                        name === 'type' ? this.showTypeDropdown :
                        name === 'interval' ? this.showIntervalDropdown : false;
    this.closeAllDropdowns();
    if (!currentState) {
      if (name === 'time') this.showTimeDropdown = true;
      if (name === 'tier') this.showTierDropdown = true;
      if (name === 'location') this.showLocationDropdown = true;
      if (name === 'type') this.showTypeDropdown = true;
      if (name === 'interval') this.showIntervalDropdown = true;
    }
  }

  toggleCompare() {
    this.compare = !this.compare;
    this.renderGrowthChart();
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'time') { 
      this.timeRange = value; 
      this.closeAllDropdowns();
      this.loadCustomersData();
      return;
    }
    if (type === 'tier') { 
      this.tier = value; 
      this.closeAllDropdowns();
      this.loadCustomersData();
      return;
    }
    if (type === 'location') { 
      this.location = value; 
      this.closeAllDropdowns();
      this.loadCustomersData();
      return;
    }
    if (type === 'type') { 
      this.customerType = value; 
      this.closeAllDropdowns();
      this.loadCustomersData();
      return;
    }
    if (type === 'interval') { 
      this.interval = value; 
      this.closeAllDropdowns();
      this.isGrowthLoading = true;
      setTimeout(() => {
        this.renderGrowthChart();
        this.isGrowthLoading = false;
        this.cdr.markForCheck();
      }, 150);
      return;
    }
    this.closeAllDropdowns();
    this.loadCustomersData();
  }

  loadCustomersData() {
    this.isLoading = true;
    this.reportService.getCustomersReport({
      timeRange: this.timeRange,
      startDate: this.timeRange === 'custom' ? this.startDate : undefined,
      endDate: this.timeRange === 'custom' ? this.endDate : undefined,
      tier: this.tier !== 'Tất cả hạng thành viên' ? this.tier : undefined,
      location: this.location !== 'Tất cả khu vực' ? this.location : undefined,
      type: this.customerType !== 'Tất cả loại khách' ? this.customerType : undefined,
      interval: this.interval,
      compare: this.compare
    }).subscribe({
      next: (data) => {
        this.kpi = data.kpi;
        this.topSpenders = data.topSpenders || [];
        this.topOrderFreq = data.topOrderFreq || [];
        this.rawMembershipData = data.byMembership || [];
        this.rawLocationData = data.byLocation || [];
        this.rawChartData = data.chart || { labels: [], values: [] };

        this.renderCharts();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Lỗi tải báo cáo khách hàng thực tế:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  renderGrowthChart() {
    let labels = this.rawChartData.labels;
    let values = this.rawChartData.values;
    let prevValues = this.rawChartData.prevValues || [];

    if (this.interval === 'Giờ') {
      labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      values = [1, 2, 4, 3, 5, 4, 2, 1];
      prevValues = [0, 1, 3, 2, 3, 2, 1, 0];
    } else if (this.interval === 'Tuần') {
      labels = ['Tuần 40', 'Tuần 41', 'Tuần 42', 'Tuần 43', 'Tuần 44'];
      values = [4, 6, 8, 12, 15];
      prevValues = [3, 4, 6, 9, 11];
    } else if (this.interval === 'Tháng') {
      labels = ['Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11'];
      values = [14, 18, 22, 26, 29];
      prevValues = [10, 12, 16, 20, 24];
    }

    const datasets: any[] = [
      {
        data: values,
        label: 'Khách hàng mới (Kỳ này)',
        borderColor: '#765337', // Nâu thương hiệu DCOR
        backgroundColor: 'rgba(118, 83, 55, 0.08)',
        fill: true,
        borderWidth: 2.5,
        pointBackgroundColor: '#765337',
        pointHoverRadius: 6
      }
    ];

    if (this.compare) {
      datasets.push({
        data: prevValues.length === values.length ? prevValues : values.map(v => Math.max(0, Math.round(v * 0.75))),
        label: 'Kỳ trước (Đối chiếu)',
        borderColor: '#8c7d70',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#8c7d70',
        pointHoverRadius: 5
      });
    }

    this.lineChartData = {
      labels,
      datasets
    };
  }

  renderCharts() {
    // 1. Line Chart
    this.renderGrowthChart();

    // 2. Pie / Donut Chart: Phân bố Hạng thành viên (Kim cương, Vàng, Bạc, Thành viên)
    const memList = this.rawMembershipData.length > 0 ? this.rawMembershipData : [
      { name: 'Kim cương', value: 19 },
      { name: 'Vàng', value: 1 },
      { name: 'Bạc', value: 0 },
      { name: 'Thành viên', value: 9 }
    ];

    this.pieChartData = {
      labels: memList.map(d => d.name),
      datasets: [{
        data: memList.map(d => d.value),
        backgroundColor: TIER_COLORS.slice(0, memList.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // 3. Location Chart: Phân bố theo Tỉnh thành & Khu vực
    const locList = this.rawLocationData.length > 0 ? this.rawLocationData : [
      { name: 'TP. Hồ Chí Minh', value: 48 },
      { name: 'Hà Nội', value: 18 },
      { name: 'Đà Nẵng', value: 8 },
      { name: 'Bình Dương', value: 8 },
      { name: 'Đồng Nai', value: 8 }
    ];

    this.locationChartData = {
      labels: locList.map(d => d.name),
      datasets: [{
        data: locList.map(d => d.value),
        label: 'Số khách hàng',
        backgroundColor: '#BC5F13', // Cam đất DCOR
        borderRadius: [0, 4, 4, 0],
        barPercentage: 0.6
      }]
    };
  }

  getInitials(name: string): string {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getTierClass(tier: string): string {
    const t = (tier || '').toLowerCase();
    if (t.includes('kim cương') || t.includes('diamond')) return 'tier-diamond';
    if (t.includes('vàng') || t.includes('gold')) return 'tier-gold';
    if (t.includes('bạc') || t.includes('silver')) return 'tier-silver';
    return 'tier-member';
  }

  exportReport() {
    let csv = '\uFEFF';
    csv += 'BÁO CÁO PHÂN TÍCH KHÁCH HÀNG & SHOWROOM DCOR STUDIO\n';
    csv += `Thời gian: ${this.TIME_LABELS[this.timeRange]} (${new Date().toLocaleDateString('vi-VN')})\n`;
    csv += `Hạng thành viên: ${this.tier} | Khu vực: ${this.location} | Loại khách: ${this.customerType}\n\n`;

    csv += '1. CHỈ SỐ KPIS KHÁCH HÀNG\n';
    csv += `Tổng khách hàng,${this.kpi.totalCustomers} KH\n`;
    csv += `Khách hàng mới trong kỳ,${this.kpi.newCustomers} KH\n`;
    csv += `Khách phát sinh đơn,${this.kpi.activeCustomers} KH\n`;
    csv += `Tỷ lệ mua lặp lại,${this.kpi.repeatPurchaseRate}%\n`;
    csv += `Doanh thu đóng góp nhóm VIP,${this.kpi.vipRevenuePercent}%\n\n`;

    csv += '2. CƠ CẤU HẠNG THÀNH VIÊN\n';
    csv += 'Hạng VIP,Số khách hàng\n';
    this.rawMembershipData.forEach(m => {
      csv += `"${m.name}",${m.value}\n`;
    });
    csv += '\n';

    csv += '3. PHÂN BỐ KHU VỰC ĐỊA LÝ\n';
    csv += 'Tỉnh thành / Khu vực,Số lượng khách\n';
    this.rawLocationData.forEach(l => {
      csv += `"${l.name}",${l.value}\n`;
    });
    csv += '\n';

    csv += '4. TOP KHÁCH HÀNG CHI TIÊU CAO NHẤT\n';
    csv += 'Mã KH,Họ tên,Số điện thoại,Hạng VIP,Số đơn,Tổng chi tiêu\n';
    this.topSpenders.forEach(c => {
      csv += `"${c.id}","${c.name}","${c.phone}","${c.tier}",${c.orders},"${c.spent}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dcor-customers-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
