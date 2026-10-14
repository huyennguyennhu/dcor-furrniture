import { Component, OnInit, HostListener, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Users, Award, MapPin 
} from 'lucide-angular';
import { ReportService, CustomersReportData } from '../../../../../core/services/report.service';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

@Component({
  selector: 'app-customers-report',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, LucideAngularModule],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './customers-report.html',
  styleUrls: ['./customers-report.css']
})
export class CustomersReportComponent implements OnInit {
  icons = { Calendar, Download, ChevronDown, Users, Award, MapPin };

  private reportService = inject(ReportService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  timeRange = '7_days';
  showTimeDropdown = false;
  
  tier = 'Tất cả hạng thành viên';
  showTierDropdown = false;
  tiers = ['Tất cả hạng thành viên', 'Thành viên', 'Bạc', 'Vàng', 'Kim cương'];

  location = 'Tất cả khu vực';
  showLocationDropdown = false;
  locations = ['Tất cả khu vực', 'TP.HCM', 'Hà Nội', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai'];

  interval = 'Ngày';
  showIntervalDropdown = false;
  intervals = ['Giờ', 'Ngày', 'Tuần', 'Tháng'];

  kpi = {
    totalCustomers: 0,
    newCustomers: 0,
    activeCustomers: 0,
    repeatPurchaseRate: 64.5
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

  @ViewChild('filterRef', { static: false }) filterRef!: ElementRef;

  // --- Line Chart: New Customers ---
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

  // --- Pie Chart: Membership ---
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: {
        callbacks: { label: (ctx: any) => ` ${ctx.raw} KH` }
      }
    },
    cutout: '70%',
    radius: '90%'
  } as any;

  // --- Bar Chart: Location ---
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
      this.showTierDropdown = false;
      this.showLocationDropdown = false;
      this.showIntervalDropdown = false;
    }
  }

  ngOnInit() {
    this.loadCustomersData();
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showTimeDropdown = name === 'time' ? !this.showTimeDropdown : false;
    this.showTierDropdown = name === 'tier' ? !this.showTierDropdown : false;
    this.showLocationDropdown = name === 'location' ? !this.showLocationDropdown : false;
    this.showIntervalDropdown = name === 'interval' ? !this.showIntervalDropdown : false;
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; }
    if (type === 'tier') { this.tier = value; this.showTierDropdown = false; }
    if (type === 'location') { this.location = value; this.showLocationDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
    this.loadCustomersData();
  }

  loadCustomersData() {
    this.isLoading = true;
    this.reportService.getCustomersReport({
      timeRange: this.timeRange,
      tier: this.tier !== 'Tất cả hạng thành viên' ? this.tier : undefined,
      location: this.location !== 'Tất cả khu vực' ? this.location : undefined,
      interval: this.interval
    }).subscribe({
      next: (data) => {
        this.kpi = data.kpi;
        this.topSpenders = data.topSpenders || [];
        this.topOrderFreq = data.topOrderFreq || [];

        // Line Chart: Khách hàng mới
        this.lineChartData = {
          labels: data.chart.labels,
          datasets: [
            {
              data: data.chart.values,
              label: 'KH mới',
              borderColor: '#3498db',
              backgroundColor: '#3498db',
              borderWidth: 3,
              pointBackgroundColor: '#3498db',
            }
          ]
        };

        // Pie Chart: Hạng thành viên
        this.pieChartData = {
          labels: data.byMembership.map(d => d.name),
          datasets: [{
            data: data.byMembership.map(d => d.value),
            backgroundColor: PIE_COLORS.slice(0, data.byMembership.length),
            borderWidth: 0
          }]
        };

        // Location Chart: Phân bố theo Tỉnh thành
        this.locationChartData = {
          labels: data.byLocation.map(d => d.name),
          datasets: [{
            data: data.byLocation.map(d => d.value),
            label: 'Khách hàng',
            backgroundColor: '#9b59b6',
            borderRadius: [4, 4, 0, 0],
            barPercentage: 0.6
          }]
        };

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
}
