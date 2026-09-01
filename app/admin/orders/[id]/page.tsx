'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Truck, Package, User, MapPin, CreditCard, Box, FileText } from 'lucide-react';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Unwrap params
  const { id } = use(params);
  
  // MOCK DATA for Demo
  const orderId = id || 'DCOR-ORD-001';
  
  // Format currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.back()}
            style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)' }}
          >
            <ArrowLeft size={18} color="var(--text-primary)" />
          </button>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
              Đơn hàng #{orderId}
              <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>Đang xử lý</span>
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Đặt lúc: 01/09/2026 - 09:24
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
            In hóa đơn
          </button>
          <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
            Xác nhận xuất kho
          </button>
        </div>
      </div>

      {/* GRID LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TIMELINE */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Tiến trình đơn hàng</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {/* Progress Line */}
              <div style={{ position: 'absolute', top: '16px', left: '40px', right: '40px', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
              <div style={{ position: 'absolute', top: '16px', left: '40px', width: '50%', height: '2px', background: '#059669', zIndex: 1 }}></div>

              {[
                { label: 'Đặt hàng', date: '01/09 - 09:24', status: 'done', icon: <FileText size={16}/> },
                { label: 'Xác nhận', date: '01/09 - 10:00', status: 'done', icon: <CheckCircle2 size={16}/> },
                { label: 'Đang xử lý', date: '01/09 - 14:30', status: 'active', icon: <Package size={16}/> },
                { label: 'Đang giao', date: '', status: 'pending', icon: <Truck size={16}/> },
                { label: 'Hoàn thành', date: '', status: 'pending', icon: <CheckCircle2 size={16}/> }
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '80px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
                    background: step.status === 'done' ? '#059669' : step.status === 'active' ? '#2563eb' : 'var(--bg-secondary)',
                    color: step.status === 'pending' ? 'var(--text-muted)' : 'white',
                    border: step.status === 'pending' ? '1px solid var(--border-color)' : 'none'
                  }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: step.status === 'active' ? 700 : 500, color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)', textAlign: 'center' }}>{step.label}</div>
                  {step.date && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{step.date}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* SẢN PHẨM */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Danh sách sản phẩm</h3>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '12px', fontWeight: 500 }}>Sản phẩm</th>
                  <th style={{ textAlign: 'right', paddingBottom: '12px', fontWeight: 500 }}>Đơn giá</th>
                  <th style={{ textAlign: 'center', paddingBottom: '12px', fontWeight: 500 }}>Số lượng</th>
                  <th style={{ textAlign: 'right', paddingBottom: '12px', fontWeight: 500 }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-secondary)', borderRadius: '8px' }}></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Sofa Indivi 3 chỗ</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã: SF-IND-02 | Da Napoli đen</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', fontWeight: 500 }}>{formatVND(80000000)}</td>
                  <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>1</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{formatVND(80000000)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', background: 'var(--bg-secondary)', borderRadius: '8px' }}></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>Bàn trà Coda</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã: TB-CODA-01</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', fontWeight: 500 }}>{formatVND(10000000)}</td>
                  <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '14px', fontWeight: 500 }}>1</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>{formatVND(10000000)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <div style={{ width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tạm tính</span>
                  <span style={{ fontWeight: 500 }}>{formatVND(90000000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Phí vận chuyển</span>
                  <span style={{ fontWeight: 500 }}>{formatVND(500000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Giảm giá</span>
                  <span style={{ fontWeight: 500, color: '#059669' }}>-{formatVND(500000)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '16px' }}>
                  <span style={{ fontWeight: 600 }}>Tổng thanh toán</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatVND(90000000)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LỊCH SỬ XỬ LÝ (AUDIT TRAIL) */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Lịch sử xử lý đơn</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { time: '14:30 - 01/09/2026', user: 'Hệ thống', action: 'Ghi nhận thanh toán thành công (Mã GD: TXN-99812)' },
                { time: '10:00 - 01/09/2026', user: 'Admin Tran', action: 'Chuyển trạng thái sang Đang xử lý' },
                { time: '09:45 - 01/09/2026', user: 'Admin Tran', action: 'Xác nhận đơn hàng' },
                { time: '09:24 - 01/09/2026', user: 'Lê Thu Trang (Khách hàng)', action: 'Tạo đơn hàng mới' }
              ].map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '130px', fontSize: '14px', color: 'var(--text-muted)' }}>{log.time}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{log.action}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Bởi: {log.user}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* KHÁCH HÀNG */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Khách hàng
              </h3>
            </div>
            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>Lê Thu Trang</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>Email: le.thu.trang@gmail.com</div>
              <div>SĐT: 0912345678</div>
            </div>
            <button style={{ marginTop: '16px', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              Xem hồ sơ khách hàng
            </button>
          </div>

          {/* GIAO HÀNG */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <MapPin size={18} /> Giao hàng
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Lê Thu Trang</div>
                <div>0912345678</div>
              </div>
              <div style={{ lineHeight: '1.5' }}>
                Khu công nghệ cao, Phường Tân Phú, Quận 9, Tp. Hồ Chí Minh
              </div>
              <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ marginBottom: '4px' }}><strong>Đơn vị:</strong> Giao Hàng Nhanh (GHN)</div>
                <div style={{ marginBottom: '4px' }}><strong>Dự kiến:</strong> 03/09/2026</div>
                <div style={{ color: '#2563eb', fontWeight: 500, cursor: 'pointer' }}>Xem chi tiết vận đơn</div>
              </div>
            </div>
          </div>

          {/* THANH TOÁN */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CreditCard size={18} /> Thanh toán
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div>
                <span style={{ padding: '2px 8px', background: '#d1fae5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã thanh toán</span>
              </div>
              <div><strong>Phương thức:</strong> Chuyển khoản qua VNPAY</div>
              <div><strong>Mã GD:</strong> VNP1234567890</div>
              <div><strong>Thời gian:</strong> 01/09/2026 09:25</div>
            </div>
          </div>

          {/* KHO XỬ LÝ */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Box size={18} /> Kho xử lý
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent)' }}>Showroom Thủ Đức</div>
              
              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Sofa Indivi 3 chỗ</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Tồn trước:</span> <span>5</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', marginBottom: '4px' }}>
                  <span>Xuất kho:</span> <span>-1</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--border-color)', paddingTop: '4px', marginTop: '4px' }}>
                  <span>Tồn sau:</span> <span>4</span>
                </div>
              </div>

              <div style={{ color: '#2563eb', fontWeight: 500, cursor: 'pointer', marginTop: '4px' }}>
                Xem biến động kho
              </div>
            </div>
          </div>

          {/* GHI CHÚ */}
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Ghi chú</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Của khách hàng</div>
              <div style={{ fontSize: '13px', background: '#fef3c7', padding: '12px', borderRadius: '8px', color: '#92400e', fontStyle: 'italic' }}>
                "Giao hàng buổi sáng giúp mình, gọi trước 30p nhé!"
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Nội bộ (Chỉ Admin)</div>
              <textarea 
                placeholder="Nhập ghi chú nội bộ..." 
                defaultValue="Khách hàng VIP, cần kiểm tra kỹ đóng gói."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', minHeight: '80px', outline: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }}
              />
              <button style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-primary)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Lưu ghi chú</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
