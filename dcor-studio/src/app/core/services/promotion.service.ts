import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Promotion {
  id?: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  scope?: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  categoryScopeName?: string;
  productIds?: string[];
  productNames?: string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  isFreeShip?: boolean;
}

export interface AppliedPromotion {
  code: string;
  name?: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  scope?: 'ALL' | 'CATEGORY' | 'SPECIFIC_PRODUCTS';
  categoryScopeName?: string;
  productIds?: string[];
  calculatedDiscount: number;
  isFreeShip?: boolean;
}

export interface ActiveProductDiscount {
  campaignId: string;
  campaignName: string;
  discountPercent: number;
  discountValue: number;
  discountType: 'PERCENT' | 'FIXED' | 'AMOUNT';
  salePrice: number;
  originalPrice: number;
  badgeText: string;
}

/**
 * Định dạng nhãn giảm giá thống nhất toàn cửa hàng:
 * - Giảm theo số tiền cố định (FIXED / AMOUNT / FIXED_AMOUNT): -500k, -1.000k (hoặc -500đ nếu < 1.000đ)
 * - Giảm theo phần trăm (PERCENT / PERCENTAGE): -30%
 */
export function formatDiscountBadgeText(
  discountType?: string | null,
  discountValue?: number | null
): string {
  const val = Number(discountValue || 0);
  if (!val || val <= 0) return '';
  const type = String(discountType || 'PERCENT').toUpperCase();
  if (type === 'FIXED' || type === 'AMOUNT' || type === 'FIXED_AMOUNT') {
    if (val >= 1000) {
      const kVal = Math.round(val / 1000);
      return `-${new Intl.NumberFormat('vi-VN').format(kVal)}k`;
    }
    return `-${new Intl.NumberFormat('vi-VN').format(Math.round(val))}đ`;
  }
  return `-${Math.round(val)}%`;
}

export const FALLBACK_CAMPAIGNS: any[] = [
  {
    id: 'CAMP-001',
    name: 'Đại Tiệc Mùa Hè',
    description: 'Giảm 30% toàn bộ bộ sưu tập Sofa & Bàn trà cao cấp',
    channel: 'TOÀN HỆ THỐNG',
    showroomTargets: [],
    discountType: 'PERCENT',
    discountValue: 30,
    startDateTime: '2026-10-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 8,
    totalRevenue: 345000000,
    items: [
      {
        productId: '0ac754a3-6ae2-4d1f-8443-f26a2abd67b6',
        productName: 'Modena sofa with resting unit',
        variantName: 'Vải Nỉ Be Xám Cao Cấp',
        originalPrice: 42900000,
        salePrice: 30030000,
        discountPercent: 30
      },
      {
        productId: 'dc89e306-17aa-4384-9482-56d299cda075',
        productName: 'Indivi sofa with chaise longue left',
        variantName: 'Vải Nỉ Xám Chuẩn Đan Mạch',
        originalPrice: 38900000,
        salePrice: 27230000,
        discountPercent: 30
      },
      {
        productId: '5925064e-e082-433c-bbc3-666330ac4e44',
        productName: 'Santiago extendable dining table',
        variantName: 'Mặt Gỗ Sồi Dark Oak Tự Nhiên',
        originalPrice: 32500000,
        salePrice: 22750000,
        discountPercent: 30
      },
      {
        productId: '9134eb25-b351-4bfe-af5f-29e103536a47',
        productName: 'Expose side table',
        variantName: 'Kim Loại Matt Black Sơn Tĩnh Điện',
        originalPrice: 12500000,
        salePrice: 8750000,
        discountPercent: 30
      },
      {
        productId: 'd1faee79-dfef-48b6-8efa-8d9d85224a16',
        productName: 'Madrid coffee table',
        variantName: 'Mặt Bàn Ceramic Cao Cấp',
        originalPrice: 21290000,
        salePrice: 14903000,
        discountPercent: 30
      },
      {
        productId: '3dd3ea15-db17-448a-8ba0-2d46cc96c6a9',
        productName: 'Bolzano 3-seater',
        variantName: 'Vải Nỉ Sang Trọng',
        originalPrice: 36000000,
        salePrice: 25200000,
        discountPercent: 30
      },
      {
        productId: 'cfcd7eef-bcf4-4265-bbcd-e3bf26ae3b4c',
        productName: 'Carmo corner sofa',
        variantName: 'Module Góc Chữ L Hiện Đại',
        originalPrice: 49000000,
        salePrice: 34300000,
        discountPercent: 30
      },
      {
        productId: 'da5d42bf-9ed4-4f7c-a6ce-095241145aae',
        productName: 'Expose coffee table',
        variantName: 'Bàn Trà Kính & Gỗ',
        originalPrice: 15500000,
        salePrice: 10850000,
        discountPercent: 30
      }
    ]
  },
  {
    id: 'CAMP-002',
    name: 'Khai Trương Showroom',
    description: 'Ưu đãi 20% bàn ghế ăn & phòng khách',
    channel: 'TẠI SHOWROOM',
    showroomTargets: [
      'Showroom Q1 TP.HCM (Hai Bà Trưng)',
      'Showroom Thủ Đức TP.HCM (Võ Văn Ngân)'
    ],
    discountType: 'PERCENT',
    discountValue: 20,
    startDateTime: '2026-10-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 4,
    totalRevenue: 512000000,
    items: [
      {
        productId: 'a280e186-e170-4ad1-acc6-967426bb2b7e',
        productName: 'Hamilton dining chair',
        variantName: 'Chân Kim Loại Đen Mờ',
        originalPrice: 8500000,
        salePrice: 6800000,
        discountPercent: 20
      },
      {
        productId: 'e436fd65-b60b-4f7a-abdc-2dd384bec890',
        productName: 'Princeton dining chair',
        variantName: 'Nệm Êm Vải Cao Cấp',
        originalPrice: 9200000,
        salePrice: 7360000,
        discountPercent: 20
      },
      {
        productId: 'a7b41332-c263-4f0d-b708-530f75d19517',
        productName: 'Imola armchair with swivel function',
        variantName: 'Chân Xoay Da Bò Ý Thượng Hạng',
        originalPrice: 25000000,
        salePrice: 20000000,
        discountPercent: 20
      },
      {
        productId: '3b0023d3-815e-487a-b3e1-4493c78a9cd3',
        productName: 'Adelaide barstool',
        variantName: 'Ghế Quầy Bar Bắc Âu',
        originalPrice: 7800000,
        salePrice: 6240000,
        discountPercent: 20
      }
    ]
  },
  {
    id: 'CAMP-003',
    name: 'Tri Ân Khách Hàng Online',
    description: 'Giảm 15% giường ngủ & tủ kệ cao cấp',
    channel: 'ONLINE',
    showroomTargets: [],
    discountType: 'PERCENT',
    discountValue: 15,
    startDateTime: '2026-11-01',
    endDateTime: '2026-12-31',
    status: 'Ongoing',
    productsCount: 2,
    totalRevenue: 0,
    items: [
      {
        productId: 'f2d1fc04-8036-4e62-862e-7a302109cdc7',
        productName: 'Taylor sleeper W160xL200cm',
        variantName: 'Giường Sofa Đa Năng 1m6 x 2m',
        originalPrice: 31000000,
        salePrice: 26350000,
        discountPercent: 15
      },
      {
        productId: 'a6167ea5-8422-4caa-84cc-032b6b24ac97',
        productName: 'Calgary storage with drawer',
        variantName: 'Tủ Kệ Trang Trí Gỗ Tự Nhiên',
        originalPrice: 44990000,
        salePrice: 38241500,
        discountPercent: 15
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly STORAGE_KEY = 'dcor_applied_promotion';
  private readonly STORAGE_FREESHIP_KEY = 'dcor_applied_freeship';
  private readonly CAMPAIGNS_STORAGE_KEY = 'dcor_admin_campaigns_data_v3';

  // Bộ nhớ đệm O(1) lưu kết quả tính giảm giá cho từng sản phẩm (tránh tính lại hàng nghìn lần)
  private discountCache = new Map<string, ActiveProductDiscount | null>();
  private isFetchingCampaigns = false;

  // Danh sách chiến dịch giảm giá (Campaigns) đang diễn ra
  private activeCampaignsSubject = new BehaviorSubject<any[]>([]);
  public activeCampaigns$ = this.activeCampaignsSubject.asObservable();

  // Danh sách chương trình khuyến mãi thực tế từ hệ thống (kết nối database Admin)
  private promotionsSubject = new BehaviorSubject<Promotion[]>([]);
  public promotions$ = this.promotionsSubject.asObservable();

  // 1. Mã giảm giá sản phẩm / đơn hàng đang áp dụng
  private appliedPromotionSubject = new BehaviorSubject<AppliedPromotion | null>(null);
  public appliedPromotion$ = this.appliedPromotionSubject.asObservable();

  // 2. Mã miễn phí vận chuyển (Freeship) đang áp dụng (áp dụng đồng thời cùng mã sản phẩm!)
  private appliedFreeshipSubject = new BehaviorSubject<AppliedPromotion | null>(null);
  public appliedFreeship$ = this.appliedFreeshipSubject.asObservable();

  constructor() {
    this.restoreAppliedPromotion();
    this.loadPromotions();
    this.initCampaignsListener();
    this.loadActiveCampaigns();
  }

  private initCampaignsListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('dcor_campaigns_updated', () => this.loadActiveCampaigns());
      window.addEventListener('dcor_vouchers_updated', () => this.loadPromotions().subscribe());
      window.addEventListener('storage', (e) => {
        if (e.key === this.CAMPAIGNS_STORAGE_KEY) this.loadActiveCampaigns();
        if (e.key === 'dcor_admin_vouchers_data_v1') this.loadPromotions().subscribe();
      });
    }
  }

  private hasLoadedCampaignsFromApi = false;

  loadActiveCampaigns(): void {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filterActive = (list: any[]) => {
      return (list || []).filter((c: any) => {
        const isStatusActive = c.status === 'Ongoing' || c.status === 'Active' || c.status === 'Đang diễn ra' || c.status === 'Đang hoạt động';
        const startDay = c.startDateTime ? String(c.startDateTime).slice(0, 10) : '';
        const endDay = c.endDateTime ? String(c.endDateTime).slice(0, 10) : '';
        const isNotExpired = !endDay || endDay >= today;
        const isStarted = !startDay || startDay <= today;
        return isStatusActive && isNotExpired && isStarted;
      });
    };

    // Hiển thị tức thì dữ liệu cache trong localStorage nếu có (trong lúc đợi API thật trả về)
    if (!this.hasLoadedCampaignsFromApi && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.CAMPAIGNS_STORAGE_KEY);
        if (raw) {
          const localActive = filterActive(JSON.parse(raw));
          this.discountCache.clear();
          this.activeCampaignsSubject.next(localActive);
        }
      } catch {}
    }

    // Luôn lấy nguồn dữ liệu chuẩn từ PostgreSQL qua API /store/campaigns (KHÔNG tự hồi sinh FALLBACK hay bắn POST ngược)
    if (!this.isFetchingCampaigns) {
      this.isFetchingCampaigns = true;
      fetch(`${environment.apiUrl}/store/campaigns`, { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          this.isFetchingCampaigns = false;
          this.hasLoadedCampaignsFromApi = true;
          const remoteActive = Array.isArray(data) ? filterActive(data) : [];
          this.discountCache.clear();
          this.activeCampaignsSubject.next(remoteActive);
        })
        .catch(() => {
          this.isFetchingCampaigns = false;
          // Chỉ fallback nếu hoàn toàn mất kết nối và chưa từng tải từ API
          if (!this.hasLoadedCampaignsFromApi && this.activeCampaignsSubject.getValue().length === 0) {
            this.discountCache.clear();
            this.activeCampaignsSubject.next(filterActive(FALLBACK_CAMPAIGNS));
          }
        });
    }
  }

  getActiveCampaigns(): any[] {
    const list = this.activeCampaignsSubject.getValue();
    if (!this.hasLoadedCampaignsFromApi && (!list || list.length === 0)) {
      this.loadActiveCampaigns();
      return this.activeCampaignsSubject.getValue();
    }
    return list || [];
  }

  private normalizeStr(str: string): string {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getDiscountForProduct(p: any): ActiveProductDiscount | null {
    if (!p) return null;

    const prodId = String(p.productId || p.id || '').trim().toLowerCase();
    const prodSlug = String(p.slug || '').trim().toLowerCase();
    const basePrice = Number(p.basePrice !== undefined ? p.basePrice : (p.prices?.[0]?.price || p.price || 0));
    const cacheKey = `${prodId || prodSlug || p.name || ''}_${basePrice}`;

    if (this.discountCache.has(cacheKey)) {
      return this.discountCache.get(cacheKey)!;
    }

    const campaigns = this.getActiveCampaigns();
    if (!campaigns || campaigns.length === 0) {
      this.discountCache.set(cacheKey, null);
      return null;
    }

    const prodName = this.normalizeStr(p.displayName || p.shortDescription_vi || p.shortDescription || p.name || '');

    for (const camp of campaigns) {
      if (!camp.items || !Array.isArray(camp.items)) continue;

      for (const it of camp.items) {
        const itId = String(it.productId || '').trim().toLowerCase();
        const itName = this.normalizeStr(it.productName || '');

        let isMatch = false;

        // 1. So khớp ID chính xác
        if (itId && prodId && (itId === prodId || itId === prodSlug)) {
          isMatch = true;
        }

        // 2. So khớp ID biến thể nếu product có variants
        if (!isMatch && itId && Array.isArray(p.variants)) {
          isMatch = p.variants.some((v: any) => String(v.id || '').toLowerCase() === itId);
        }

        // 3. So khớp tên sản phẩm
        if (!isMatch && itName && prodName) {
          if (itName === prodName || prodName.includes(itName) || itName.includes(prodName)) {
            isMatch = true;
          }
        }

        if (isMatch) {
          const isFixed = camp.discountType === 'FIXED' || camp.discountType === 'AMOUNT' || camp.discountType === 'FIXED_AMOUNT';
          const origPrice = Number(it.originalPrice) || basePrice;
          let salePrice = Number(it.salePrice);
          let discountValue = 0;
          let discountPercent = 0;

          if (isFixed) {
            const campFixedVal = Number(camp.discountValue || 0);
            if (!salePrice || salePrice >= origPrice) {
              salePrice = Math.max(0, origPrice - campFixedVal);
            }
            discountValue = origPrice > salePrice ? (origPrice - salePrice) : campFixedVal;
            discountPercent = origPrice > 0 ? Math.round((discountValue / origPrice) * 100) : 0;
          } else {
            discountPercent = Number(it.discountPercent) || Number(camp.discountValue) || 0;
            discountValue = discountPercent;
            if (!salePrice || salePrice >= origPrice) {
              salePrice = Math.round(origPrice * (100 - discountPercent) / 100);
            }
          }

          const normalizedType: 'PERCENT' | 'AMOUNT' = isFixed ? 'AMOUNT' : 'PERCENT';
          const badgeText = formatDiscountBadgeText(normalizedType, discountValue) || 'SALE';

          const result: ActiveProductDiscount = {
            campaignId: camp.id,
            campaignName: camp.name,
            discountPercent,
            discountValue,
            discountType: normalizedType,
            salePrice,
            originalPrice: origPrice,
            badgeText
          };

          this.discountCache.set(cacheKey, result);
          return result;
        }
      }
    }

    this.discountCache.set(cacheKey, null);
    return null;
  }

  // Khôi phục mã đã áp dụng từ session nếu có
  private restoreAppliedPromotion() {
    try {
      if (typeof window !== 'undefined') {
        // Khôi phục mã sản phẩm
        const savedPromo = sessionStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem('dcor_applied_voucher');
        if (savedPromo) {
          this.appliedPromotionSubject.next(JSON.parse(savedPromo));
        }

        // Khôi phục mã freeship
        const savedFreeship = sessionStorage.getItem(this.STORAGE_FREESHIP_KEY);
        if (savedFreeship) {
          this.appliedFreeshipSubject.next(JSON.parse(savedFreeship));
        }
      }
    } catch (e) {
      console.warn('Không thể đọc mã ưu đãi từ session:', e);
    }
  }

  // Kết nối đến API chương trình khuyến mãi thực tế của hệ thống (database PostgreSQL Admin)
  loadPromotions(): Observable<Promotion[]> {
    return new Observable<Promotion[]>(observer => {
      fetch(`${environment.apiUrl}/store/promotions`, { cache: 'no-store' })
        .then(res => {
          if (!res.ok) return [];
          return res.json();
        })
        .then(data => {
          const list: Promotion[] = Array.isArray(data) ? data : (data?.promotions || []);
          this.promotionsSubject.next(list);
          this.syncAppliedWithActiveList(list);
          observer.next(list);
          observer.complete();
        })
        .catch(() => {
          this.promotionsSubject.next([]);
          observer.next([]);
          observer.complete();
        });
    });
  }

  // Đồng bộ các mã đang lưu trong session với danh sách mới nhất từ DB (gỡ mã nếu Admin đã tắt/xóa/hết hạn)
  private syncAppliedWithActiveList(activeList: Promotion[]) {
    const activeMap = new Map<string, Promotion>();
    for (const p of activeList) {
      if (p?.code) activeMap.set(p.code.toUpperCase(), p);
    }

    const currentPromo = this.appliedPromotionSubject.getValue();
    if (currentPromo) {
      const fresh = activeMap.get(currentPromo.code.toUpperCase());
      if (!fresh) {
        this.removeAppliedPromotion();
      } else {
        this.saveAppliedPromotion({
          ...currentPromo,
          name: fresh.name,
          discountType: fresh.discountType,
          discountValue: fresh.discountValue,
          minOrderValue: fresh.minOrderValue,
          maxDiscountAmount: fresh.maxDiscountAmount
        });
      }
    }

    const currentFreeship = this.appliedFreeshipSubject.getValue();
    if (currentFreeship) {
      const freshFs = activeMap.get(currentFreeship.code.toUpperCase());
      if (!freshFs) {
        this.removeAppliedFreeship();
      } else {
        this.saveAppliedFreeship({
          ...currentFreeship,
          name: freshFs.name,
          discountType: freshFs.discountType,
          discountValue: freshFs.discountValue,
          minOrderValue: freshFs.minOrderValue,
          maxDiscountAmount: freshFs.maxDiscountAmount,
          calculatedDiscount: freshFs.discountValue
        });
      }
    }
  }

  // Lấy các khuyến mãi thực tế phù hợp với giá trị đơn hàng
  getEligiblePromotions(orderTotal: number): Promotion[] {
    const list = this.promotionsSubject.getValue();
    if (!list || list.length === 0) return [];
    return list.filter(p => {
      if (p.isActive === false) return false;
      if (p.minOrderValue && orderTotal < p.minOrderValue) return false;
      return true;
    });
  }

  // Áp dụng mã ưu đãi — luôn xác thực trực tiếp với PostgreSQL qua API để đồng bộ realtime với Admin
  applyPromotion(code: string, orderTotal: number, items?: any[]): Observable<{ success: boolean; message: string; applied?: AppliedPromotion }> {
    const cleanCode = (code || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) {
      return of({ success: false, message: 'Vui lòng nhập mã ưu đãi.' });
    }

    const normalizedItems = Array.isArray(items)
      ? items.map(it => ({
          productId: it.productId || it.id || '',
          productName: it.productName || it.name || '',
          price: Number(it.price || 0),
          quantity: Number(it.quantity || 1),
          categoryName: it.categoryName || it.category || ''
        }))
      : undefined;

    return new Observable(observer => {
      const verifyUrl = `${environment.apiUrl}/vouchers/verify`;
      const fallbackUrl = `${environment.apiUrl}/store/promotions/verify`;

      let customerId: string | undefined;
      let phone: string | undefined;
      try {
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('dcor_customer_user');
          if (userStr) {
            const u = JSON.parse(userStr);
            customerId = u?.id;
            phone = u?.phone;
          }
        }
      } catch {}

      const tryVerify = (url: string, tryFallback: boolean) => {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode, orderTotal, customerId, phone, items: normalizedItems })
        })
          .then(async res => {
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              if (tryFallback) {
                return tryVerify(fallbackUrl, false);
              }
              throw new Error(`Mã ưu đãi "${cleanCode}" không hợp lệ hoặc máy chủ chưa sẵn sàng.`);
            }

            const data = await res.json();
            if (!res.ok || (data && data.valid === false)) {
              throw new Error(data?.message || `Mã ưu đãi "${cleanCode}" không hợp lệ hoặc chưa đủ điều kiện.`);
            }

            const v = data.voucher || data;
            const maxCap = data.maxDiscountAmount ?? v.maxDiscountCap ?? v.maxDiscountAmount ?? undefined;
            const isFreeship = Boolean(data.isFreeShip ?? v.isFreeShip ?? cleanCode.startsWith('FREESHIP'));

            let discount = data.discountAmount ?? data.calculatedDiscount;
            if (discount === undefined || discount === null) {
              if (v.discountType === 'PERCENT') {
                discount = Math.round((orderTotal * v.discountValue) / 100);
                if (maxCap) discount = Math.min(discount, maxCap);
              } else {
                discount = v.discountValue || 0;
              }
            }

            const applied: AppliedPromotion = {
              code: v.code || cleanCode,
              name: data.name || v.name || v.code || cleanCode,
              discountType: v.discountType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
              discountValue: v.discountValue || 0,
              minOrderValue: v.minOrderValue || 0,
              maxDiscountAmount: maxCap,
              scope: data.scope || v.scope || 'ALL',
              categoryScopeName: data.categoryScopeName || v.categoryScopeName,
              productIds: data.productIds || v.productIds || [],
              calculatedDiscount: isFreeship ? discount : Math.min(discount, orderTotal),
              isFreeShip: isFreeship
            };

            if (isFreeship) {
              this.saveAppliedFreeship(applied);
            } else {
              this.saveAppliedPromotion(applied);
            }
            observer.next({ success: true, message: data.message || `Áp dụng thành công mã "${applied.code}"`, applied });
            observer.complete();
          })
          .catch(err => {
            const msg = String(err?.message || '');
            const isBusinessRejection =
              msg.includes('không tồn tại') ||
              msg.includes('không hợp lệ') ||
              msg.includes('tạm dừng') ||
              msg.includes('hết hạn') ||
              msg.includes('tối thiểu') ||
              msg.includes('hết lượt') ||
              msg.includes('danh mục') ||
              msg.includes('sản phẩm');
            if (tryFallback && !isBusinessRejection) {
              tryVerify(fallbackUrl, false);
              return;
            }
            observer.next({
              success: false,
              message: err.message || `Mã ưu đãi "${cleanCode}" không tồn tại hoặc hệ thống chưa kích hoạt mã này.`
            });
            observer.complete();
          });
      };

      tryVerify(verifyUrl, true);
    });
  }

  // Lưu mã sản phẩm
  saveAppliedPromotion(applied: AppliedPromotion) {
    this.appliedPromotionSubject.next(applied);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(applied));
        sessionStorage.setItem('dcor_applied_voucher', JSON.stringify(applied));
      }
    } catch (e) {}
  }

  // Xóa mã sản phẩm
  removeAppliedPromotion() {
    this.appliedPromotionSubject.next(null);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem('dcor_applied_voucher');
      }
    } catch (e) {}
  }

  // Lưu mã freeship
  saveAppliedFreeship(applied: AppliedPromotion) {
    this.appliedFreeshipSubject.next(applied);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.STORAGE_FREESHIP_KEY, JSON.stringify(applied));
      }
    } catch (e) {}
  }

  // Xóa mã freeship
  removeAppliedFreeship() {
    this.appliedFreeshipSubject.next(null);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.STORAGE_FREESHIP_KEY);
      }
    } catch (e) {}
  }

  // Tính số tiền giảm giá của 1 voucher dựa trên giá trị đơn hàng (và phạm vi sản phẩm nếu có)
  calculateDiscount(promo: Promotion, orderTotal: number, items?: any[]): number {
    if (promo.isActive === false) return 0;
    if (promo.minOrderValue && orderTotal < promo.minOrderValue) return 0;

    let eligibleTotal = orderTotal;
    if (promo.scope === 'SPECIFIC_PRODUCTS' && Array.isArray(promo.productIds) && promo.productIds.length > 0) {
      if (!Array.isArray(items) || items.length === 0) return 0;
      const idSet = new Set(promo.productIds.map(x => String(x).trim()));
      const matched = items.filter(it => idSet.has(String(it.productId || it.id || '').trim()));
      if (matched.length === 0) return 0;
      const matchedSub = matched.reduce((s, it) => s + Number(it.price || 0) * Math.max(1, Number(it.quantity || 1)), 0);
      eligibleTotal = matchedSub > 0 ? matchedSub : orderTotal;
    } else if (promo.scope === 'CATEGORY' && promo.categoryScopeName) {
      // Không tự áp bừa voucher giới hạn danh mục khi chưa có dữ liệu danh mục từng item
      if (!Array.isArray(items) || items.length === 0) return 0;
      const targetCat = promo.categoryScopeName.trim().toLowerCase();
      const matched = items.filter(it => String(it.categoryName || it.category || '').trim().toLowerCase() === targetCat);
      if (matched.length === 0) return 0;
      const matchedSub = matched.reduce((s, it) => s + Number(it.price || 0) * Math.max(1, Number(it.quantity || 1)), 0);
      eligibleTotal = matchedSub > 0 ? matchedSub : orderTotal;
    }

    let discount = 0;
    if (promo.discountType === 'PERCENT') {
      discount = Math.round((eligibleTotal * promo.discountValue) / 100);
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount);
      }
    } else {
      discount = Math.min(promo.discountValue || 0, promo.isFreeShip ? (promo.discountValue || 0) : eligibleTotal);
    }
    return discount;
  }

  // Tự động tìm và áp dụng mã khuyến mãi có mức giảm cao nhất cho cả 2 loại (sản phẩm & Freeship)
  autoApplyBestPromotions(
    orderTotal: number, 
    force: boolean = false, 
    skipProduct: boolean = false, 
    skipFreeship: boolean = false,
    items?: any[]
  ) {
    if (orderTotal <= 0) {
      this.removeAppliedPromotion();
      this.removeAppliedFreeship();
      return;
    }
    const all = this.promotionsSubject.getValue();
    if (!all || all.length === 0) return;

    // 1. Tự động áp mã giảm giá sản phẩm tốt nhất
    if (!skipProduct) {
      const currentPromo = this.appliedPromotionSubject.getValue();
      const productPromos = all.filter(p => !p.isFreeShip && !p.code.toUpperCase().startsWith('FREESHIP'));
      
      let bestPromo: Promotion | null = null;
      let maxDiscount = 0;
      for (const p of productPromos) {
        const discount = this.calculateDiscount(p, orderTotal, items);
        if (discount > maxDiscount) {
          maxDiscount = discount;
          bestPromo = p;
        }
      }

      // Áp dụng nếu chưa có mã, hoặc mã hiện tại bị hết điều kiện, hoặc tìm được mã có mức giảm cao hơn mã đang chọn (nếu force)
      if (bestPromo && maxDiscount > 0) {
        const currentDiscount = currentPromo ? (currentPromo.calculatedDiscount || 0) : 0;
        const currentValid = currentPromo && (!currentPromo.minOrderValue || orderTotal >= currentPromo.minOrderValue);

        if (!currentValid || force || (!currentPromo && maxDiscount > 0) || (maxDiscount > currentDiscount)) {
          const applied: AppliedPromotion = {
            code: bestPromo.code,
            name: bestPromo.name,
            discountType: bestPromo.discountType,
            discountValue: bestPromo.discountValue,
            minOrderValue: bestPromo.minOrderValue,
            maxDiscountAmount: bestPromo.maxDiscountAmount,
            calculatedDiscount: Math.min(maxDiscount, orderTotal),
            isFreeShip: false
          };
          this.saveAppliedPromotion(applied);
        }
      } else {
        // Không còn mã sản phẩm nào đủ điều kiện với orderTotal mới -> gỡ mã
        if (currentPromo && (currentPromo.minOrderValue && orderTotal < currentPromo.minOrderValue)) {
          this.removeAppliedPromotion();
        }
      }
    }

    // 2. Tự động áp mã Freeship tốt nhất (chỉ khi đơn hàng dưới 50tr vì từ 50tr đã mặc định miễn phí ship)
    if (orderTotal >= 50000000) {
      this.removeAppliedFreeship();
    } else if (!skipFreeship) {
      const currentFreeship = this.appliedFreeshipSubject.getValue();
      const freeshipPromos = all.filter(p => !!p.isFreeShip || p.code.toUpperCase().startsWith('FREESHIP'));

      let bestFreeship: Promotion | null = null;
      let maxFreeshipDiscount = 0;
      for (const p of freeshipPromos) {
        const discount = this.calculateDiscount(p, orderTotal);
        if (discount > maxFreeshipDiscount) {
          maxFreeshipDiscount = discount;
          bestFreeship = p;
        }
      }

      if (bestFreeship && maxFreeshipDiscount > 0) {
        const currentFreeshipDiscount = currentFreeship ? (currentFreeship.calculatedDiscount || 0) : 0;
        const currentValid = currentFreeship && (!currentFreeship.minOrderValue || orderTotal >= currentFreeship.minOrderValue);

        if (!currentValid || force || (!currentFreeship && maxFreeshipDiscount > 0) || (maxFreeshipDiscount > currentFreeshipDiscount)) {
          const appliedFreeship: AppliedPromotion = {
            code: bestFreeship.code,
            name: bestFreeship.name,
            discountType: bestFreeship.discountType,
            discountValue: bestFreeship.discountValue,
            minOrderValue: bestFreeship.minOrderValue,
            calculatedDiscount: maxFreeshipDiscount,
            isFreeShip: true
          };
          this.saveAppliedFreeship(appliedFreeship);
        }
      } else {
        // Không còn mã freeship nào đủ điều kiện -> gỡ mã
        if (currentFreeship && (currentFreeship.minOrderValue && orderTotal < currentFreeship.minOrderValue)) {
          this.removeAppliedFreeship();
        }
      }
    }
  }

  // Tính toán lại giá trị giảm giá khi tổng tiền đơn hàng thay đổi
  recalculate(orderTotal: number) {
    if (orderTotal <= 0) {
      this.removeAppliedPromotion();
      this.removeAppliedFreeship();
      return;
    }

    // 1. Tính lại voucher sản phẩm
    const currentPromo = this.appliedPromotionSubject.getValue();
    if (currentPromo) {
      if (currentPromo.minOrderValue && orderTotal < currentPromo.minOrderValue) {
        this.removeAppliedPromotion();
      } else {
        let discount = 0;
        if (currentPromo.discountType === 'PERCENT') {
          discount = Math.round((orderTotal * currentPromo.discountValue) / 100);
          if ((currentPromo as any).maxDiscountAmount) {
            discount = Math.min(discount, (currentPromo as any).maxDiscountAmount);
          }
        } else {
          discount = currentPromo.discountValue;
        }
        const updated: AppliedPromotion = {
          ...currentPromo,
          calculatedDiscount: Math.min(discount, orderTotal)
        };
        this.saveAppliedPromotion(updated);
      }
    }

    // 2. Tính lại voucher freeship
    const currentFreeship = this.appliedFreeshipSubject.getValue();
    if (currentFreeship) {
      if (orderTotal >= 50000000 || (currentFreeship.minOrderValue && orderTotal < currentFreeship.minOrderValue)) {
        this.removeAppliedFreeship();
      } else {
        let discount = 0;
        if (currentFreeship.discountType === 'PERCENT') {
          discount = Math.round((orderTotal * currentFreeship.discountValue) / 100);
        } else {
          discount = currentFreeship.discountValue;
        }
        const updatedFreeship: AppliedPromotion = {
          ...currentFreeship,
          calculatedDiscount: discount
        };
        this.saveAppliedFreeship(updatedFreeship);
      }
    }
  }

  getAppliedPromotion(): AppliedPromotion | null {
    return this.appliedPromotionSubject.getValue();
  }

  getAppliedFreeship(): AppliedPromotion | null {
    return this.appliedFreeshipSubject.getValue();
  }
}
