import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { 
  LucideAngularModule, 
  Calendar, Download, ChevronDown, Users, Award, MapPin 
} from 'lucide-angular';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

const NEW_CUSTOMERS_DATA: Record<string, any[]> = {
  'today': [
    { name: '00:00', value: 2 }, { name: '06:00', value: 5 },
    { name: '12:00', value: 12 }, { name: '18:00', value: 8 },
  ],
  '7_days': [
    { name: '01/08', value: 24 }, { name: '02/08', value: 18 },
    { name: '03/08', value: 35 }, { name: '04/08', value: 42 },
    { name: '05/08', value: 38 }, { name: '06/08', value: 50 },
    { name: '07/08', value: 45 },
  ],
  'month': [
    { name: 'Tuần 1', value: 120 }, { name: 'Tuần 2', value: 150 },
    { name: 'Tuần 3', value: 180 }, { name: 'Tuần 4', value: 210 },
  ]
};

const MEMBERSHIP_DATA = [
  { name: 'Thành viên', value: 1200 },
  { name: 'Bạc', value: 450 },
  { name: 'Vàng', value: 280 },
  { name: 'Kim cương', value: 85 },
];

const LOCATION_DATA = [
  { name: 'TP.HCM', value: 1250 },
  { name: 'Hà Nội', value: 850 },
  { name: 'Đà Nẵng', value: 320 },
  { name: 'Đồng Nai', value: 210 },
  { name: 'Bình Dương', value: 180 },
];

const TOP_SPENDERS = [
  { id: '#KH001', name: 'Nguyễn Văn A', tier: 'Kim cương', orders: 12, spent: '245,000,000 ₫' },
  { id: '#KH084', name: 'Trần Thị B', tier: 'Vàng', orders: 8, spent: '132,500,000 ₫' },
  { id: '#KH105', name: 'Lê Văn C', tier: 'Vàng', orders: 6, spent: '98,000,000 ₫' },
  { id: '#KH042', name: 'Phạm Thị D', tier: 'Kim cương', orders: 15, spent: '85,000,000 ₫' },
  { id: '#KH199', name: 'Hoàng Văn E', tier: 'Bạc', orders: 4, spent: '62,500,000 ₫' },
];

const TOP_ORDER_FREQ = [
  { id: '#KH042', name: 'Phạm Thị D', tier: 'Kim cương', orders: 15, spent: '85,000,000 ₫' },
  { id: '#KH001', name: 'Nguyễn Văn A', tier: 'Kim cương', orders: 12, spent: '245,000,000 ₫' },
  { id: '#KH302', name: 'Vũ Thị F', tier: 'Bạc', orders: 9, spent: '42,000,000 ₫' },
  { id: '#KH084', name: 'Trần Thị B', tier: 'Vàng', orders: 8, spent: '132,500,000 ₫' },
  { id: '#KH211', name: 'Đặng Văn G', tier: 'Thành viên', orders: 7, spent: '28,500,000 ₫' },
];

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

  timeRange = '7_days';
  showTimeDropdown = false;
  
  tier = 'Tất cả hạng thành viên';
  showTierDropdown = false;
  tiers = ['Tất cả hạng thành viên', 'Thành viên', 'Bạc', 'Vàng', 'Kim cương'];

  location = 'Tất cả khu vực';
  showLocationDropdown = false;
  locations = ['Tất cả khu vực', 'Miền Bắc', 'Miền Trung', 'Miền Nam'];

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

  topSpenders = TOP_SPENDERS;
  topOrderFreq = TOP_ORDER_FREQ;

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
    this.updateCharts();
  }

  toggleDropdown(name: string, event: Event) {
    event.stopPropagation();
    this.showTimeDropdown = name === 'time' ? !this.showTimeDropdown : false;
    this.showTierDropdown = name === 'tier' ? !this.showTierDropdown : false;
    this.showLocationDropdown = name === 'location' ? !this.showLocationDropdown : false;
    this.showIntervalDropdown = name === 'interval' ? !this.showIntervalDropdown : false;
  }

  setDropdownValue(type: string, value: string) {
    if (type === 'time') { this.timeRange = value; this.showTimeDropdown = false; this.updateCharts(); }
    if (type === 'tier') { this.tier = value; this.showTierDropdown = false; }
    if (type === 'location') { this.location = value; this.showLocationDropdown = false; }
    if (type === 'interval') { this.interval = value; this.showIntervalDropdown = false; }
  }

  updateCharts() {
    const customerData = NEW_CUSTOMERS_DATA[this.timeRange] || NEW_CUSTOMERS_DATA['7_days'];
    
    // Line Chart
    this.lineChartData = {
      labels: customerData.map(d => d.name),
      datasets: [
        {
          data: customerData.map(d => d.value),
          label: 'KH mới',
          borderColor: '#3498db',
          backgroundColor: '#3498db',
          borderWidth: 3,
          pointBackgroundColor: '#3498db',
        }
      ]
    };

    // Pie Chart
    this.pieChartData = {
      labels: MEMBERSHIP_DATA.map(d => d.name),
      datasets: [{
        data: MEMBERSHIP_DATA.map(d => d.value),
        backgroundColor: PIE_COLORS,
        borderWidth: 0
      }]
    };

    // Location Chart
    this.locationChartData = {
      labels: LOCATION_DATA.map(d => d.name),
      datasets: [{
        data: LOCATION_DATA.map(d => d.value),
        label: 'Khách hàng',
        backgroundColor: '#9b59b6',
        borderRadius: [4, 4, 0, 0],
        barPercentage: 0.6
      }]
    };
  }
}
