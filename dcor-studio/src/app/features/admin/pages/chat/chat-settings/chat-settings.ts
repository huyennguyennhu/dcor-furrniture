import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { IconComponent } from '../../../../../shared/components/icon/icon';
import { StatCard } from '../../../../../shared/components/stat-card/stat-card';
import { AdminAuthService } from '../../../../../core/services/admin-auth.service';

import { WorkingHoursSetting } from '../models/chat-admin.model';
import { ChatAdminService } from '../services/chat-admin.service';

const DAYS_OF_WEEK = [
  { day: 1, label: 'Thứ 2' },
  { day: 2, label: 'Thứ 3' },
  { day: 3, label: 'Thứ 4' },
  { day: 4, label: 'Thứ 5' },
  { day: 5, label: 'Thứ 6' },
  { day: 6, label: 'Thứ 7' },
  { day: 0, label: 'Chủ nhật' },
];

@Component({
  selector: 'app-chat-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, StatCard],
  templateUrl: './chat-settings.html',
  styleUrls: ['./chat-settings.css'],
})
export class ChatSettingsComponent implements OnInit {
  public adminAuth = inject(AdminAuthService);
  public chatAdminService = inject(ChatAdminService);

  public hasPermission = computed(() => {
    return this.adminAuth.hasPermission('chat', 'view');
  });

  public daysOfWeek = DAYS_OF_WEEK;

  // Giờ làm việc
  public settingsWorkingHours = signal<WorkingHoursSetting>({
    start: '08:00',
    end: '21:30',
    days: [0, 1, 2, 3, 4, 5, 6],
  });

  // Thông điệp tự động (Kèm các khóa mới trả về từ backend)
  public settingsGreetingGuest = signal<string>('Xin chào bạn! Mình là Trợ lý AI của DCor. Bạn đang quan tâm đến mẫu sofa, bàn ghế hay cần giải pháp nội thất nào hôm nay?');
  public settingsGreetingAuth = signal<string>('Chào {{name}}! DCor có thể hỗ trợ gì cho không gian sống của bạn hôm nay?');
  public settingsLoginPrompt = signal<string>('Để chuyên viên DCor có thể đồng hành, lưu lại bản phối và hỗ trợ tư vấn chi tiết nhất, bạn vui lòng đăng nhập tài khoản nhé!');
  public settingsOfflineMessage = signal<string>('Hiện tại đội ngũ CSKH đang ngoài giờ trực ({{hours}}). Bạn có thể để lại nội dung cần hỗ trợ, DCor sẽ ưu tiên liên hệ phản hồi vào đầu giờ sáng mai nhé!');
  public settingsHandoffMessage = signal<string>('DCor đã tiếp nhận yêu cầu và đang kết nối bạn với chuyên viên tư vấn. Bạn vui lòng giữ kết nối trong ít phút nhé!');
  public settingsFallbackMessages = signal<string[]>([
    'DCor chưa hiểu rõ câu hỏi của bạn. Bạn vui lòng diễn đạt cụ thể hơn hoặc chọn một trong các gợi ý bên dưới nhé!',
    'Xin lỗi bạn, câu hỏi này nằm ngoài hiểu biết hiện tại của bot. Bạn thử mô tả lại hoặc bấm nút Gặp nhân viên để được hỗ trợ trực tiếp.',
    'DCor chưa tìm được thông tin phù hợp với yêu cầu này. Bạn có thể chọn chủ đề cần giải đáp bên dưới để mình hỗ trợ ngay nhé!',
  ]);
  public newFallbackInput = signal<string>('');
  public settingsHotline = signal<string>('1900 1234');
  public settingsAddress = signal<string>('669 QL1A, TP. Hồ Chí Minh');

  public isSavingSettings = signal<boolean>(false);
  public settingsFeedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  ngOnInit(): void {
    this.loadSettings();
  }

  public loadSettings(): void {
    this.chatAdminService.getSettings().subscribe({
      next: (res) => {
        const s = res.settings || {};
        if (s['workingHours']) this.settingsWorkingHours.set(s['workingHours']);
        if (s['greetingGuest']) this.settingsGreetingGuest.set(s['greetingGuest']);
        if (s['greetingAuth']) this.settingsGreetingAuth.set(s['greetingAuth']);
        if (s['loginPromptMessage'] || s['loginPrompt']) {
          this.settingsLoginPrompt.set(s['loginPromptMessage'] || s['loginPrompt']);
        }
        if (s['offlineMessage']) this.settingsOfflineMessage.set(s['offlineMessage']);
        if (s['handoffMessage']) this.settingsHandoffMessage.set(s['handoffMessage']);
        if (Array.isArray(s['fallbackMessages']) && s['fallbackMessages'].length >= 3) {
          this.settingsFallbackMessages.set(s['fallbackMessages']);
        }
        if (s['hotline']) this.settingsHotline.set(s['hotline']);
        if (s['address']) this.settingsAddress.set(s['address']);
      },
      error: () => {},
    });
  }

  public toggleWorkingDay(day: number): void {
    this.settingsWorkingHours.update((wh) => {
      const days = [...wh.days];
      const idx = days.indexOf(day);
      if (idx > -1) {
        if (days.length <= 1) {
          alert('Phải chọn ít nhất 1 ngày hoạt động trong tuần.');
          return wh;
        }
        days.splice(idx, 1);
      } else {
        days.push(day);
      }
      return { ...wh, days: days.sort() };
    });
  }

  public isDaySelected(day: number): boolean {
    return this.settingsWorkingHours().days.includes(day);
  }

  public updateWorkStart(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.settingsWorkingHours.update((wh) => ({ ...wh, start: val }));
  }

  public updateWorkEnd(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.settingsWorkingHours.update((wh) => ({ ...wh, end: val }));
  }

  public addFallbackMessage(): void {
    const val = this.newFallbackInput().trim();
    if (!val) return;
    if (val.length > 500) {
      alert('Mỗi câu thoại dự phòng không được vượt quá 500 ký tự.');
      return;
    }
    this.settingsFallbackMessages.update((list) => [...list, val]);
    this.newFallbackInput.set('');
  }

  public removeFallbackMessage(index: number): void {
    if (this.settingsFallbackMessages().length <= 3) {
      alert('Danh sách câu thoại dự phòng phải có ít nhất 3 biến thể.');
      return;
    }
    this.settingsFallbackMessages.update((list) => list.filter((_, i) => i !== index));
  }

  public updateFallbackItem(index: number, text: string): void {
    this.settingsFallbackMessages.update((list) =>
      list.map((item, i) => (i === index ? text : item))
    );
  }

  public saveSettings(): void {
    const wh = this.settingsWorkingHours();
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(wh.start) || !timeRegex.test(wh.end)) {
      this.settingsFeedback.set({
        type: 'error',
        message: 'Giờ làm việc phải theo định dạng HH:mm (ví dụ 08:00, 21:30).',
      });
      return;
    }

    const fallbacks = this.settingsFallbackMessages().map((f) => f.trim()).filter(Boolean);
    if (fallbacks.length < 3) {
      this.settingsFeedback.set({
        type: 'error',
        message: 'Danh sách tin nhắn dự phòng Fallback phải có ít nhất 3 biến thể.',
      });
      return;
    }

    this.isSavingSettings.set(true);
    this.settingsFeedback.set(null);

    const payload = {
      workingHours: wh,
      greetingGuest: this.settingsGreetingGuest().trim(),
      greetingAuth: this.settingsGreetingAuth().trim(),
      loginPromptMessage: this.settingsLoginPrompt().trim(),
      offlineMessage: this.settingsOfflineMessage().trim(),
      handoffMessage: this.settingsHandoffMessage().trim(),
      fallbackMessages: fallbacks,
      hotline: this.settingsHotline().trim(),
      address: this.settingsAddress().trim(),
    };

    this.chatAdminService.updateSettings(payload).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        this.settingsFeedback.set({
          type: 'success',
          message: 'Cập nhật cấu hình Chat & Bot thành công!',
        });
        setTimeout(() => this.settingsFeedback.set(null), 4000);
      },
      error: (err) => {
        this.isSavingSettings.set(false);
        this.settingsFeedback.set({
          type: 'error',
          message: err?.error?.message || 'Không thể cập nhật cấu hình.',
        });
      },
    });
  }
}

