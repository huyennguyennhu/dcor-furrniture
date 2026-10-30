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
  calculatedDiscount: number;
  isFreeShip?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly STORAGE_KEY = 'dcor_applied_promotion';
  private readonly STORAGE_FREESHIP_KEY = 'dcor_applied_freeship';

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

  // Kết nối đến API chương trình khuyến mãi thực tế của hệ thống (database Admin)
  loadPromotions(): Observable<Promotion[]> {
    return new Observable<Promotion[]>(observer => {
      fetch(`${environment.apiUrl}/store/promotions`)
        .then(res => {
          if (!res.ok) return [];
          return res.json();
        })
        .then(data => {
          const list: Promotion[] = Array.isArray(data) ? data : (data?.promotions || []);
          this.promotionsSubject.next(list);
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

  // Áp dụng mã ưu đãi (hỗ trợ phân loại mã sản phẩm vs mã freeship để dùng đồng thời)
  applyPromotion(code: string, orderTotal: number): Observable<{ success: boolean; message: string; applied?: AppliedPromotion }> {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return of({ success: false, message: 'Vui lòng nhập mã ưu đãi.' });
    }

    // 1. Kiểm tra trong danh sách chương trình khuyến mãi đã nạp từ hệ thống
    const existing = this.promotionsSubject.getValue().find(p => p.code.toUpperCase() === cleanCode);
    if (existing) {
      if (existing.minOrderValue && orderTotal < existing.minOrderValue) {
        return of({
          success: false,
          message: `Mã "${cleanCode}" chỉ áp dụng cho đơn từ ${existing.minOrderValue.toLocaleString('vi-VN')} ₫.`
        });
      }

      let discount = 0;
      if (existing.discountType === 'PERCENT') {
        discount = Math.round((orderTotal * existing.discountValue) / 100);
        if (existing.maxDiscountAmount) {
          discount = Math.min(discount, existing.maxDiscountAmount);
        }
      } else {
        discount = existing.discountValue;
      }

      const isFreeship = !!existing.isFreeShip || cleanCode.startsWith('FREESHIP');

      const applied: AppliedPromotion = {
        code: existing.code,
        name: existing.name,
        discountType: existing.discountType,
        discountValue: existing.discountValue,
        minOrderValue: existing.minOrderValue,
        calculatedDiscount: isFreeship ? discount : Math.min(discount, orderTotal),
        isFreeShip: isFreeship
      };

      if (isFreeship) {
        this.saveAppliedFreeship(applied);
      } else {
        this.saveAppliedPromotion(applied);
      }
      return of({ success: true, message: `Áp dụng thành công mã "${applied.code}"`, applied });
    }

    // 2. Kết nối tới API xác thực mã ưu đãi của server (khi người dùng tự nhập mã voucher)
    return new Observable(observer => {
      const verifyUrl = `${environment.apiUrl}/vouchers/verify`;
      const fallbackUrl = `${environment.apiUrl}/store/promotions/verify`;

      const tryVerify = (url: string, tryFallback: boolean) => {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: cleanCode, orderTotal })
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
            let discount = data.discountAmount;
            if (discount === undefined || discount === null) {
              if (v.discountType === 'PERCENT') {
                discount = Math.round((orderTotal * v.discountValue) / 100);
                const cap = v.maxDiscountCap || v.maxDiscountAmount;
                if (cap) discount = Math.min(discount, cap);
              } else {
                discount = v.discountValue || 0;
              }
            }

            const isFreeship = !!v.isFreeShip || cleanCode.startsWith('FREESHIP');
            const applied: AppliedPromotion = {
              code: v.code || cleanCode,
              name: v.name || v.code || cleanCode,
              discountType: v.discountType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
              discountValue: v.discountValue || 0,
              minOrderValue: v.minOrderValue || 0,
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
            if (tryFallback && !err.message?.includes('không hợp lệ')) {
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

  // Tính số tiền giảm giá của 1 voucher dựa trên giá trị đơn hàng
  calculateDiscount(promo: Promotion, orderTotal: number): number {
    if (promo.isActive === false) return 0;
    if (promo.minOrderValue && orderTotal < promo.minOrderValue) return 0;
    let discount = 0;
    if (promo.discountType === 'PERCENT') {
      discount = Math.round((orderTotal * promo.discountValue) / 100);
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount);
      }
    } else {
      discount = promo.discountValue || 0;
    }
    return discount;
  }

  // Tự động tìm và áp dụng mã khuyến mãi có mức giảm cao nhất cho cả 2 loại (sản phẩm & Freeship)
  autoApplyBestPromotions(
    orderTotal: number, 
    force: boolean = false, 
    skipProduct: boolean = false, 
    skipFreeship: boolean = false
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
        const discount = this.calculateDiscount(p, orderTotal);
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
