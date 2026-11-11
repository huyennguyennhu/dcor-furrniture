import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { 
  LucideAngularModule, 
  CircleUserRound, 
  MapPin, 
  Package, 
  RefreshCw, 
  ShieldCheck, 
  Heart, 
  CalendarDays, 
  Pencil, 
  Bell, 
  LogOut,
  Star,
  Layers
} from 'lucide-angular';
import { CustomerService, CustomerProfile } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './account-sidebar.html',
  styleUrls: ['./account-sidebar.css']
})
export class AccountSidebarComponent implements OnInit, OnDestroy {
  icons = {
    CircleUserRound,
    MapPin,
    Package,
    RefreshCw,
    ShieldCheck,
    Heart,
    CalendarDays,
    Pencil,
    Bell,
    LogOut,
    Star,
    Layers
  };

  profile: CustomerProfile | null = null;
  unreadNotificationCount = 0;
  isLoading = true;
  isLoggedIn = false;
  guestPhone = '';
  private sub = new Subscription();

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.guestPhone = this.authService.getGuestPhone() || '';

    if (this.isLoggedIn) {
      this.loadProfile();

      this.sub.add(
        this.customerService.unreadCount$.subscribe(count => {
          this.unreadNotificationCount = count;
        })
      );

      // Lắng nghe cập nhật avatar và hồ sơ tức thì từ authService
      this.sub.add(
        this.authService.user$.subscribe((user) => {
          this.isLoggedIn = !!user;
          if (user && this.profile) {
            this.profile.fullName = user.fullName || this.profile.fullName;
            this.profile.avatarUrl = user.avatarUrl ?? user.avatar ?? this.profile.avatarUrl;
            if (user.email) this.profile.email = user.email;
          }
        })
      );
    } else {
      this.isLoading = false;
    }

    // Lắng nghe thay đổi SĐT xác thực của khách vãng lai
    this.sub.add(
      this.authService.guestPhone$.subscribe((phone) => {
        this.guestPhone = phone || '';
      })
    );
  }

  loadProfile(): void {
    let cachedUser: any = null;
    try {
      const stored = localStorage.getItem('dcor_customer_user') || localStorage.getItem('dcor_customer') || localStorage.getItem('dcor_user');
      if (stored) {
        cachedUser = JSON.parse(stored);
      }
    } catch (e) {}
    if (!cachedUser) {
      cachedUser = this.authService.getCurrentUser();
    }

    if (cachedUser) {
      // Set initial state from cached user immediately to avoid flicker (0ms latency)
      this.profile = {
        id: cachedUser.id,
        fullName: cachedUser.fullName || cachedUser.name || 'Khách hàng',
        phone: (cachedUser.phone && !cachedUser.phone.startsWith('GOOG_')) ? cachedUser.phone : '',
        email: cachedUser.email || '',
        avatarUrl: cachedUser.avatarUrl || cachedUser.avatar || null,
        rewardPoints: cachedUser.rewardPoints || 0,
        totalSpent: cachedUser.totalSpent || 0,
        memberTier: cachedUser.memberTier || 'Đồng',
        memberBadge: cachedUser.memberBadge || 'BRONZE',
        nextTierThreshold: cachedUser.nextTierThreshold || 15000000,
        orderCount: cachedUser.orderCount || 0,
        addresses: cachedUser.addresses || [],
        createdAt: cachedUser.createdAt || ''
      };
      this.isLoading = false;
    }

    this.sub.add(
      this.customerService.getProfile().subscribe({
        next: (data) => {
          this.profile = data;
          this.isLoading = false;
          try {
            localStorage.setItem('dcor_customer_user', JSON.stringify(data));
          } catch (e) {}
        },
        error: () => {
          this.isLoading = false;
        }
      })
    );
  }

  get initials(): string {
    if (!this.profile?.fullName) return 'U';
    const words = this.profile.fullName.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 1).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  logout(): void {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?')) {
      this.authService.clearSession();
      localStorage.removeItem('dcor_customer_token');
      localStorage.removeItem('dcor_customer');
      localStorage.removeItem('dcor_customer_user');
      localStorage.removeItem('dcor_user');
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
