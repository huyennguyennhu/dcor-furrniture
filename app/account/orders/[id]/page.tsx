'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function UserOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string || 'DC-874291';

  // Mock chi tiết đơn hàng
  const order = {
    id: orderId,
    createdAt: '14 Tháng 6, 2026',
    status: 'PENDING',
    statusVi: 'Chờ duyệt',
    receiverName: 'Khách hàng Demo',
    phone: '0901234567',
    address: '280 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh',
    paymentMethod: 'Thanh toán khi nhận hàng (COD)',
    subTotal: '78,230,000 ₫',
    shippingFee: 'Miễn phí',
    totalAmount: '78,230,000 ₫',
    items: [
      { id: 'SM42250020', name: 'Sofa Indivi Lazio 3 chỗ', qty: 1, price: '42,250,000 ₫', variant: 'Vải Lazio Xám đậm / Chân thép đen' },
      { id: '37006300', name: 'Bàn console Bordeaux', qty: 2, price: '17,990,000 ₫', variant: 'Gỗ sơn mài Xám nhạt' }
    ]
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div>
          <Link href="/account/orders" style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            ← Quay lại danh sách đơn hàng
          </Link>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Chi tiết đơn hàng {order.id}</h1>
        </div>
        <button 
          onClick={() => window.print()}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          ️ In hóa đơn
        </button>
      </div>

      {/* Dòng thời gian Timeline đơn hàng */}
      <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', textTransform: 'uppercase' }}>Trạng thái vận chuyển</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10px', left: '15px', bottom: '10px', width: '2px', background: 'var(--accent)' }}></div>
          
          <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--accent)', border: '3px solid var(--bg-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', color: '#fff' }}>✓</div>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>Đơn hàng đã được đặt thành công</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.createdAt} - Khách hàng đặt mua qua cổng COD.</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--border-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}></div>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'block' }}>Đang chờ nhân viên xác minh duyệt</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hệ thống đang kiểm kho và điều phối đơn vị giao hàng.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin giao nhận */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>Địa chỉ nhận hàng</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{order.receiverName}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>SĐT: {order.phone}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>Địa chỉ: {order.address}</p>
        </div>

        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>Thông tin thanh toán</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong>Hình thức:</strong> {order.paymentMethod}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}><strong>Tạm tính:</strong> {order.subTotal}</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}><strong>Phí giao hàng:</strong> {order.shippingFee}</p>
          <p style={{ fontSize: '15px', color: 'var(--accent)', marginTop: '8px', fontWeight: 700 }}><strong>Tổng tiền:</strong> {order.totalAmount}</p>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div>
        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase' }}>Sản phẩm đặt mua</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {order.items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block' }}>{item.name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Cấu hình: {item.variant}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Số lượng: <strong>x{item.qty}</strong></span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>
                {item.price}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yêu cầu đổi trả */}
      <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', textAlign: 'right' }}>
        <Link 
          href={`/account/returns?order=${order.id}`}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            border: '1px solid #E74C3C',
            color: '#E74C3C',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          Yêu cầu đổi trả / bảo hành
        </Link>
      </div>

    </div>
  );
}
