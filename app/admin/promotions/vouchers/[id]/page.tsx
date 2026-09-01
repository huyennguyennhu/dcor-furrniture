'use client';

import React from 'react';
import { ArrowLeft, Clock, Calendar, Edit, PauseCircle, Copy, BarChart2, CheckCircle2, History, Info, Users, Tag, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  
  // Mock data for display
  const voucher = {
    id: resolvedParams.id,
    code: 'DCORVIP10',
    name: 'Tri ân khách VIP tháng 9',
    type: 'Giảm theo %',
    value: '10%',
    maxDiscount: '2.000.000 ₫',
    status: 'ACTIVE',
    startDate: '01/09/2026 00:00',
    endDate: '30/09/2026 23:59',
    
    // Conditions
    minOrder: '20.000.000 ₫',
    maxOrder: 'Không giới hạn',
    targetProducts: 'Toàn bộ sản phẩm',
    excludedProducts: 'Sản phẩm đang sale',
    targetAudience: 'Khách hàng VIP',
    channels: 'Website',
    usageLimit: '100 lượt',
    perUserLimit: '1 lượt / 1 tài khoản',
    combineRules: 'Cho phép dùng chung với Campaign đang chạy',

    // Effectiveness
    usedCount: 85,
    orderCount: 82,
    totalDiscount: '145.000.000 ₫',
    revenue: '1.850.000.000 ₫',
    aov: '22.560.000 ₫',

    // History
    creator: 'admin@dcor.vn',
    createdAt: '25/08/2026 14:30',
    lastModifier: 'marketing@dcor.vn',
    lastModifiedAt: '01/09/2026 09:15',
  };

  const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <Link href="/admin/promotions/vouchers" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', marginTop: '4px' }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {voucher.code}
            </span>
            <span style={{ padding: '4px 10px', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang hoạt động</span>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>{voucher.name}</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Hiệu lực: {voucher.startDate} - {voucher.endDate}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="admin-btn admin-btn-secondary">
            <PauseCircle size={16} /> Tạm dừng
          </button>
          <button className="admin-btn admin-btn-primary">
            <Edit size={16} /> Chỉnh sửa mã
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* HIỆU QUẢ SỬ DỤNG (EFFECTIVENESS) */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Hiệu quả sử dụng</h3>
            </div>
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng lượt sử dụng</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{voucher.usedCount} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>/ {voucher.usageLimit}</span></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Số đơn hàng thành công</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{voucher.orderCount}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Giá trị đơn hàng TB</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{voucher.aov}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 1' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng giá trị đã giảm</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{voucher.totalDiscount}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Doanh thu mang lại</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>{voucher.revenue}</span>
              </div>
            </div>
          </div>

          {/* CHI TIẾT ƯU ĐÃI & ĐIỀU KIỆN */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--accent)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Thông tin ưu đãi & Điều kiện</h3>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Loại ưu đãi</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{voucher.type}</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Mức giảm</span>
                <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>{voucher.value} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '13px' }}>(Tối đa {voucher.maxDiscount})</span></span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Sản phẩm áp dụng</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{voucher.targetProducts}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Sản phẩm loại trừ</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{voucher.excludedProducts}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Yêu cầu đơn tối thiểu</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{voucher.minOrder}</span>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Đối tượng khách hàng</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{voucher.targetAudience}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Giới hạn 1 khách hàng</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{voucher.perUserLimit}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Quy tắc kết hợp</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#059669" /> {voucher.combineRules}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* LỊCH SỬ THAY ĐỔI */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} color="var(--text-secondary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Lịch sử & Hoạt động</h3>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <Edit size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Chỉnh sửa bởi <span style={{ fontWeight: 600 }}>{voucher.lastModifier}</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{voucher.lastModifiedAt}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>Cập nhật giới hạn lượt dùng từ 50 lên 100.</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Khởi tạo bởi <span style={{ fontWeight: 600 }}>{voucher.creator}</span></div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{voucher.createdAt}</div>
                </div>
              </div>

            </div>
          </div>

          <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '20px', display: 'flex', gap: '12px' }}>
            <AlertCircle size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Mã giảm giá này đã vượt qua 80% ngân sách và lượt sử dụng dự kiến. Hệ thống sẽ tự động tạm dừng khi đạt 100% giới hạn.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
