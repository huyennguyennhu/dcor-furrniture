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
}

export interface AppliedPromotion {
  code: string;
  name?: string;
  discountType: 'PERCENT' | 'AMOUNT';
  discountValue: number;
  minOrderValue?: number;
  calculatedDiscount: number;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private readonly STORAGE_KEY = 'dcor_applied_promotion';

  // Danh sách chương trình khuyến mãi thực tế từ hệ thống
  // Không tự sinh code AI; khởi tạo rỗng, nạp từ API thực tế hoặc người dùng nhập liệu
  private promotionsSubject = new BehaviorSubject<Promotion[]>([]);
  public promotions$ = this.promotionsSubject.asObservable();

  // Khuyến mãi đang được áp dụng hiện tại (đồng bộ giữa giỏ hàng, đặt hàng & thanh toán và trang khuyến mãi)
  private appliedPromotionSubject = new BehaviorSubject<AppliedPromotion | null>(null);
  public appliedPromotion$ = this.appliedPromotionSubject.asObservable();

  constructor() {
    this.restoreAppliedPromotion();
    this.loadPromotions();
  }

  // Khôi phục mã đã áp dụng từ session nếu có
  private restoreAppliedPromotion() {
    try {
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem('dcor_applied_voucher');
        if (saved) {
          const promo = JSON.parse(saved);
          this.appliedPromotionSubject.next(promo);
        }
      }
    } catch (e) {
      console.warn('Không thể đọc mã ưu đãi từ session:', e);
    }
  }

  // Kết nối đến API chương trình khuyến mãi thực tế của hệ thống
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
          // Khi hệ thống chưa có dữ liệu chương trình khuyến mãi, để rỗng, không tự sinh dữ liệu giả
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

  // Áp dụng mã ưu đãi (kiểm tra với dữ liệu hệ thống hoặc API)
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

      const applied: AppliedPromotion = {
        code: existing.code,
        name: existing.name,
        discountType: existing.discountType,
        discountValue: existing.discountValue,
        minOrderValue: existing.minOrderValue,
        calculatedDiscount: Math.min(discount, orderTotal)
      };

      this.saveAppliedPromotion(applied);
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

            const applied: AppliedPromotion = {
              code: v.code || cleanCode,
              name: v.name || v.code || cleanCode,
              discountType: v.discountType === 'PERCENT' ? 'PERCENT' : 'AMOUNT',
              discountValue: v.discountValue || 0,
              minOrderValue: v.minOrderValue || 0,
              calculatedDiscount: Math.min(discount, orderTotal)
            };

            this.saveAppliedPromotion(applied);
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

  // Tính lại số tiền giảm khi giỏ hàng hoặc tổng đơn thay đổi
  recalculate(orderTotal: number): AppliedPromotion | null {
    const current = this.appliedPromotionSubject.getValue();
    if (!current) return null;

    if (current.minOrderValue && orderTotal < current.minOrderValue) {
      this.removeAppliedPromotion();
      return null;
    }

    let discount = 0;
    if (current.discountType === 'PERCENT') {
      discount = Math.round((orderTotal * current.discountValue) / 100);
    } else {
      discount = current.discountValue;
    }

    const updated: AppliedPromotion = {
      ...current,
      calculatedDiscount: Math.min(discount, orderTotal)
    };

    this.saveAppliedPromotion(updated);
    return updated;
  }

  saveAppliedPromotion(applied: AppliedPromotion) {
    this.appliedPromotionSubject.next(applied);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(applied));
        sessionStorage.setItem('dcor_applied_voucher', JSON.stringify(applied));
      }
    } catch (e) {}
  }

  removeAppliedPromotion() {
    this.appliedPromotionSubject.next(null);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(this.STORAGE_KEY);
        sessionStorage.removeItem('dcor_applied_voucher');
      }
    } catch (e) {}
  }

  getAppliedPromotion(): AppliedPromotion | null {
    return this.appliedPromotionSubject.getValue();
  }
}
