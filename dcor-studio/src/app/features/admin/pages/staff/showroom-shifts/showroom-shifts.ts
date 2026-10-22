import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { IconComponent } from '../../../../../shared/components/icon/icon';
import { AdminAuthService, Branch } from '../../../../../core/services/admin-auth.service';

export type ShiftTimeId = 'morning' | 'afternoon' | 'evening';
export type ShiftAttendanceStatus = 'COMPLETED' | 'PENDING' | 'MISSED'; // Xanh lá, Vàng, Đỏ

export interface ShiftItem {
  id: ShiftTimeId;
  name: string;
  timeRange: string;
  status: ShiftAttendanceStatus;
  statusText: string;
  checkInTime?: string;
}

export interface DayShiftData {
  date: Date;
  dateStr: string;
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  dayLabel: string;
  dayShort: string;
  isToday: boolean;
  isPast: boolean;
  shifts: ShiftItem[];
  isDayOff: boolean;
}

export interface StaffWeeklyShift {
  id: string;
  staffId: string;
  staffName: string;
  email: string;
  phone: string;
  role: string;
  branchId: string;
  branchName: string;
  avatarUrl?: string;
  shifts: {
    mon: ShiftTimeId[];
    tue: ShiftTimeId[];
    wed: ShiftTimeId[];
    thu: ShiftTimeId[];
    fri: ShiftTimeId[];
    sat: ShiftTimeId[];
    sun: ShiftTimeId[];
  };
  note?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-showroom-shifts',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './showroom-shifts.html',
  styleUrls: ['./showroom-shifts.css']
})
export class ShowroomShiftsComponent implements OnInit, OnDestroy {
  // Chế độ xem: Theo tuần ('week') hoặc Cả tháng ('month')
  viewMode: 'week' | 'month' = 'week';

  // Điều hướng tuần
  currentWeekOffset = 0; // 0 = tuần này, -1 = tuần trước, +1 = tuần sau
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();

  // Dữ liệu ca trực lấy từ hệ thống (đồng bộ với StaffAccountsComponent)
  allWeeklyShifts: StaffWeeklyShift[] = [];
  branchesList: Branch[] = [];

  // Lọc đối với tài khoản quản lý (được cấp quyền xem nhân sự khác)
  selectedBranchFilter = 'ALL';
  selectedStaffId = '';

  private sub = new Subscription();

  constructor(public adminAuthService: AdminAuthService) {}

  ngOnInit(): void {
    this.branchesList = this.adminAuthService.branches;
    this.loadShiftsFromStorage();

    // Khởi tạo người được chọn
    this.initSelectedStaff();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get canManageStaff(): boolean {
    return this.adminAuthService.hasPermission('staff', 'view');
  }

  private loadShiftsFromStorage(): void {
    try {
      const saved = localStorage.getItem('dcor_staff_weekly_shifts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.allWeeklyShifts = parsed;
          return;
        }
      }
    } catch (e) {}

    // Dữ liệu mẫu nếu chưa có
    this.allWeeklyShifts = [
      {
        id: 'shift-1',
        staffId: 'staff-2',
        staffName: 'Lê Minh Trí',
        email: 'tri.le@dcor.vn',
        phone: '0903 456 789',
        role: 'Sales, CSKH',
        branchId: 'SR_Q1',
        branchName: 'Showroom Q1',
        shifts: {
          mon: ['morning', 'afternoon'],
          tue: ['morning', 'afternoon'],
          wed: ['morning', 'afternoon'],
          thu: ['morning', 'afternoon'],
          fri: ['morning', 'afternoon'],
          sat: ['morning'],
          sun: []
        },
        note: 'Trưởng ca tư vấn - Showroom Q1'
      },
      {
        id: 'shift-2',
        staffId: 'staff-3',
        staffName: 'Nguyễn Thị Hồng',
        email: 'hong.nguyen@dcor.vn',
        phone: '0904 567 890',
        role: 'Sales',
        branchId: 'SR_THU_DUC',
        branchName: 'Showroom Thủ Đức',
        shifts: {
          mon: ['afternoon', 'evening'],
          tue: ['afternoon', 'evening'],
          wed: [],
          thu: ['afternoon', 'evening'],
          fri: ['afternoon', 'evening'],
          sat: ['afternoon', 'evening'],
          sun: ['morning', 'afternoon']
        },
        note: 'Chuyên viên tư vấn nội thất phòng khách'
      },
      {
        id: 'shift-3',
        staffId: 'staff-4',
        staffName: 'Phạm Hoàng Nam',
        email: 'nam.pham@dcor.vn',
        phone: '0908 123 456',
        role: 'Sales, CSKH',
        branchId: 'SR_HN_CAU_GIAY',
        branchName: 'Showroom Cầu Giấy HN',
        shifts: {
          mon: ['morning', 'afternoon'],
          tue: ['morning', 'afternoon'],
          wed: ['morning', 'afternoon'],
          thu: ['morning', 'afternoon'],
          fri: ['morning', 'afternoon'],
          sat: ['morning', 'afternoon'],
          sun: []
        },
        note: 'Showroom Cầu Giấy Hà Nội'
      }
    ];
  }

  private initSelectedStaff(): void {
    const user = this.adminAuthService.currentUser;
    if (!user) return;

    const userEmail = (user.email || '').trim().toLowerCase();
    const userName = (user.fullName || '').trim().toLowerCase();

    // Tìm ca trực của người đang đăng nhập
    const found = this.allWeeklyShifts.find(s => 
      (s.email && s.email.toLowerCase() === userEmail) ||
      (s.staffName && s.staffName.toLowerCase() === userName) ||
      s.staffId === String(user.id)
    );

    if (found) {
      this.selectedStaffId = found.staffId;
      this.selectedBranchFilter = found.branchId;
    } else if (this.allWeeklyShifts.length > 0) {
      this.selectedStaffId = this.allWeeklyShifts[0].staffId;
      this.selectedBranchFilter = this.allWeeklyShifts[0].branchId;
    }
  }

  // Danh sách nhân sự để Quản lý lựa chọn (nếu có quyền nhân sự)
  get availableStaffList(): StaffWeeklyShift[] {
    if (!this.canManageStaff) {
      return this.currentStaffShift ? [this.currentStaffShift] : [];
    }
    if (this.selectedBranchFilter === 'ALL') {
      return this.allWeeklyShifts;
    }
    return this.allWeeklyShifts.filter(s => s.branchId === this.selectedBranchFilter);
  }

  // Nhân sự hiện đang được xem ca
  get currentStaffShift(): StaffWeeklyShift | undefined {
    // Nếu là nhân sự thường (không có quyền xem người khác), BẮT BUỘC chỉ xem ca của chính mình
    if (!this.canManageStaff) {
      const user = this.adminAuthService.currentUser;
      if (user) {
        const userEmail = (user.email || '').trim().toLowerCase();
        const userName = (user.fullName || '').trim().toLowerCase();
        const me = this.allWeeklyShifts.find(s => 
          (s.email && s.email.toLowerCase() === userEmail) ||
          (s.staffName && s.staffName.toLowerCase() === userName) ||
          s.staffId === String(user.id)
        );
        if (me) return me;
      }
      return this.allWeeklyShifts[0];
    }

    // Nếu là Admin / Quản lý nhân sự, lấy theo người được chọn trong dropdown
    return this.allWeeklyShifts.find(s => s.staffId === this.selectedStaffId) || this.allWeeklyShifts[0];
  }

  // Nhãn tuần hiện tại
  get currentWeekLabel(): string {
    const now = new Date();
    now.setDate(now.getDate() + this.currentWeekOffset * 7);

    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.setDate(diffToMon));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const f = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    const prefix = this.currentWeekOffset === 0 ? 'Tuần này' : (this.currentWeekOffset > 0 ? `+${this.currentWeekOffset} tuần` : `${this.currentWeekOffset} tuần`);
    return `${prefix} (${f(mon)} - ${f(sun)}/${sun.getFullYear()})`;
  }

  changeWeek(delta: number): void {
    this.currentWeekOffset += delta;
  }

  resetCurrentWeek(): void {
    this.currentWeekOffset = 0;
  }

  // Chuyển tháng
  get currentMonthLabel(): string {
    return `Tháng ${this.currentMonth + 1} / ${this.currentYear}`;
  }

  changeMonth(delta: number): void {
    let m = this.currentMonth + delta;
    let y = this.currentYear;
    if (m > 11) {
      m = 0;
      y++;
    } else if (m < 0) {
      m = 11;
      y--;
    }
    this.currentMonth = m;
    this.currentYear = y;
  }

  resetCurrentMonth(): void {
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
  }

  // =========================================================================
  // DỮ LIỆU CA LÀM VIỆC & MÀU SẮC CHẤM CÔNG (XANH LÁ, VÀNG, ĐỎ)
  // =========================================================================

  /**
   * Tính toán 7 ngày trong tuần được chọn kèm trạng thái:
   * 🟢 Xanh lá: Làm rồi (hợp lệ)
   * 🟡 Vàng: Chưa làm (ca sắp tới)
   * 🔴 Đỏ: Thiếu công (ca trong quá khứ bị lỡ)
   */
  get weeklyDaysData(): DayShiftData[] {
    const shift = this.currentStaffShift;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    // Tính Thứ 2 của tuần được chọn
    const targetBase = new Date();
    targetBase.setDate(targetBase.getDate() + this.currentWeekOffset * 7);
    const dayOfWeek = targetBase.getDay();
    const diffToMon = targetBase.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(targetBase.setDate(diffToMon));

    const dayKeys: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayLabels = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    const dayShorts = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return dayKeys.map((key, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);

      const dStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const isToday = dStr === todayStr;
      
      const compareD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const compareNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const isPast = compareD.getTime() < compareNow.getTime();

      const rawShifts: ShiftTimeId[] = shift?.shifts[key] || [];
      const shiftItems: ShiftItem[] = rawShifts.map((sId, sIdx) => {
        let name = 'Ca Sáng';
        let timeRange = '08:30 - 12:30';
        if (sId === 'afternoon') {
          name = 'Ca Chiều';
          timeRange = '13:30 - 17:30';
        } else if (sId === 'evening') {
          name = 'Ca Tối';
          timeRange = '18:00 - 21:00';
        }

        // Đánh giá trạng thái màu sắc theo quy tắc:
        // - Ngày trong quá khứ: Nếu là ngày T2-T4 thì giả lập đã làm (xanh), nếu lỡ thì thiếu công (đỏ)
        // - Ngày hôm nay hoặc tương lai: Chưa làm (vàng)
        let status: ShiftAttendanceStatus = 'PENDING'; // Vàng
        let statusText = 'Chưa làm (Sắp tới)';
        let checkInTime: string | undefined = undefined;

        if (isPast) {
          // Ngày trong quá khứ
          const isMissed = (index === 3 && sIdx === 1); // ví dụ Thứ 5 ca chiều bị thiếu công
          if (isMissed) {
            status = 'MISSED'; // 🔴 Đỏ
            statusText = 'Thiếu công (Không có Check-in)';
          } else {
            status = 'COMPLETED'; // 🟢 Xanh lá
            statusText = 'Đã làm (Chấm công hợp lệ)';
            checkInTime = `08:${22 + (index % 6)}`;
          }
        } else if (isToday) {
          // Ngày hôm nay: Nếu là ca sáng thì đã check-in (xanh), ca chiều/tối thì chưa làm (vàng)
          if (sId === 'morning') {
            status = 'COMPLETED';
            statusText = 'Đã làm (Đúng giờ 08:26)';
            checkInTime = '08:26';
          } else {
            status = 'PENDING';
            statusText = 'Chưa làm (Hôm nay)';
          }
        } else {
          // Ngày tương lai
          status = 'PENDING';
          statusText = 'Chưa làm (Chờ vào ca)';
        }

        return {
          id: sId,
          name,
          timeRange,
          status,
          statusText,
          checkInTime
        };
      });

      return {
        date: d,
        dateStr: `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
        dayKey: key,
        dayLabel: dayLabels[index],
        dayShort: dayShorts[index],
        isToday,
        isPast,
        shifts: shiftItems,
        isDayOff: shiftItems.length === 0
      };
    });
  }

  // Thống kê ca trong tuần
  get totalWeekShiftsCount(): number {
    return this.weeklyDaysData.reduce((acc, cur) => acc + cur.shifts.length, 0);
  }

  get completedWeekShiftsCount(): number {
    let count = 0;
    this.weeklyDaysData.forEach(d => {
      d.shifts.forEach(s => {
        if (s.status === 'COMPLETED') count++;
      });
    });
    return count;
  }

  get pendingWeekShiftsCount(): number {
    let count = 0;
    this.weeklyDaysData.forEach(d => {
      d.shifts.forEach(s => {
        if (s.status === 'PENDING') count++;
      });
    });
    return count;
  }

  get missedWeekShiftsCount(): number {
    let count = 0;
    this.weeklyDaysData.forEach(d => {
      d.shifts.forEach(s => {
        if (s.status === 'MISSED') count++;
      });
    });
    return count;
  }

  // =========================================================================
  // DỮ LIỆU CẢ THÁNG (MONTHLY CALENDAR)
  // =========================================================================

  get monthlyDaysData(): Array<{
    dayNumber: number;
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    shiftsCount: number;
    completedCount: number;
    pendingCount: number;
    missedCount: number;
    dayOff: boolean;
  }> {
    const shift = this.currentStaffShift;
    const now = new Date();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay(); // 0 = Sun
    
    // Đổi chủ nhật từ 0 thành 7 để Thứ 2 là ngày bắt đầu
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const result = [];
    const dayKeysMap: ('sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')[] = [
      'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
    ];

    // Padding ô trống đầu tháng
    for (let p = 0; p < adjustedFirstDay; p++) {
      result.push({
        dayNumber: 0,
        date: new Date(this.currentYear, this.currentMonth, 0),
        isCurrentMonth: false,
        isToday: false,
        shiftsCount: 0,
        completedCount: 0,
        pendingCount: 0,
        missedCount: 0,
        dayOff: true
      });
    }

    // Các ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(this.currentYear, this.currentMonth, day);
      const isToday = d.toDateString() === now.toDateString();
      const isPast = d.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      const dayKey = dayKeysMap[d.getDay()] as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
      const scheduledShifts: ShiftTimeId[] = shift?.shifts[dayKey] || [];
      const count = scheduledShifts.length;

      let completed = 0;
      let pending = 0;
      let missed = 0;

      if (count > 0) {
        if (isPast) {
          // Giả lập: ngày 12 có 1 ca thiếu công
          if (day === 12) {
            missed = 1;
            completed = count - 1;
          } else {
            completed = count;
          }
        } else if (isToday) {
          completed = 1;
          pending = count - 1;
        } else {
          pending = count;
        }
      }

      result.push({
        dayNumber: day,
        date: d,
        isCurrentMonth: true,
        isToday,
        shiftsCount: count,
        completedCount: completed,
        pendingCount: pending,
        missedCount: missed,
        dayOff: count === 0
      });
    }

    return result;
  }

  get totalMonthShiftsCount(): number {
    return this.monthlyDaysData.filter(d => d.isCurrentMonth).reduce((acc, cur) => acc + cur.shiftsCount, 0);
  }

  get completedMonthShiftsCount(): number {
    return this.monthlyDaysData.filter(d => d.isCurrentMonth).reduce((acc, cur) => acc + cur.completedCount, 0);
  }

  get pendingMonthShiftsCount(): number {
    return this.monthlyDaysData.filter(d => d.isCurrentMonth).reduce((acc, cur) => acc + cur.pendingCount, 0);
  }

  get missedMonthShiftsCount(): number {
    return this.monthlyDaysData.filter(d => d.isCurrentMonth).reduce((acc, cur) => acc + cur.missedCount, 0);
  }

  get monthCompletionRate(): string {
    const total = this.totalMonthShiftsCount;
    if (total === 0) return '100%';
    const done = this.completedMonthShiftsCount;
    return `${Math.round((done / total) * 100)}%`;
  }

  getShowroomBadge(branchId: string): string {
    if (branchId === 'ALL') return '🏢 Toàn hệ thống';
    if (branchId === 'SR_Q1') return '🏢 Showroom Q1 (120 Hai Bà Trưng, TP.HCM)';
    if (branchId === 'SR_THU_DUC') return '🏢 Showroom Thủ Đức (45 Võ Văn Ngân, TP.HCM)';
    if (branchId === 'SR_HN_CAU_GIAY') return '🏢 Showroom Cầu Giấy (68 Cầu Giấy, Hà Nội)';
    if (branchId === 'SR_DN_HAI_CHAU') return '🏢 Showroom Đà Nẵng (150 Nguyễn Văn Linh, ĐN)';
    return `🏢 ${this.adminAuthService.getBranchName(branchId)}`;
  }

  getInitials(name?: string): string {
    if (!name) return 'DC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
