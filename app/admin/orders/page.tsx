'use client';

import React, { useState } from 'react';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  itemsSummary: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  isGift: boolean;
  giftMessage?: string;
  hidePrice: boolean;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'DCOR-ORD-001',
      customerName: 'Nguyễn Văn Minh',
      phone: '0901234567',
      address: '239 Hoàng Diệu, Phường 8, Quận 4, Tp. Hồ Chí Minh',
      itemsSummary: 'Sofa Indivi 2,5 chỗ (Chân gỗ sồi, vải nỉ Copenhagen nâu) x 1',
      totalAmount: 51290000,
      status: 'PENDING',
      createdAt: '2026-06-14 10:30',
      isGift: false,
      hidePrice: false
    },
    {
      id: 'DCOR-ORD-002',
      customerName: 'Lê Thu Trang',
      phone: '0912345678',
      address: 'Khu công nghệ cao, Quận 9, Tp. Hồ Chí Minh',
      itemsSummary: 'Sofa Indivi 3 chỗ (Chân thép, da Napoli đen) x 1',
      totalAmount: 90000000,
      status: 'CONFIRMED',
      createdAt: '2026-06-13 15:45',
      isGift: true,
      giftMessage: 'Chúc mừng tân gia em gái! Chúc gia đình luôn hạnh phúc.',
      hidePrice: true
    }
  ]);

  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const handleUpdateStatus = (id: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        return { ...o, status: newStatus };
      }
      return o;
    }));
    alert(`Đơn hàng ${id} đã được chuyển sang trạng thái: ${newStatus}`);
  };

  const handlePrint = (order: Order) => {
    setActivePrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div>
      <div style={{ marginBottom: '30px' }} className="no-print">
        <h2 style={{ fontSize: '28px', fontWeight: 700 }}>Quản Lý Đơn Hàng</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cập nhật trạng thái xử lý đơn hàng và in hóa đơn giao lắp</p>
      </div>

      <div className="filters-container no-print" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <th style={{ padding: '15px 20px' }}>Mã đơn</th>
              <th style={{ padding: '15px 20px' }}>Khách hàng</th>
              <th style={{ padding: '15px 20px' }}>Chi tiết sản phẩm</th>
              <th style={{ padding: '15px 20px' }}>Tổng thanh toán</th>
              <th style={{ padding: '15px 20px' }}>Trạng thái</th>
              <th style={{ padding: '15px 20px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '15px 20px', fontWeight: 600 }}>{o.id}</td>
                <td style={{ padding: '15px 20px' }}>
                  <strong>{o.customerName}</strong><br />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{o.phone}</span>
                </td>
                <td style={{ padding: '15px 20px', maxWidth: '300px' }}>
                  {o.itemsSummary}
                  {o.isGift && <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '4px' }}>Đơn quà tặng (Ẩn giá trị đơn)</div>}
                </td>
                <td style={{ padding: '15px 20px', fontWeight: 600, color: 'var(--accent)' }}>{formatVND(o.totalAmount)}</td>
                <td style={{ padding: '15px 20px' }}>
                  <select 
                    value={o.status}
                    onChange={(e) => handleUpdateStatus(o.id, e.target.value as Order['status'])}
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 10px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã xác nhận</option>
                    <option value="SHIPPED">Đang giao hàng</option>
                    <option value="DELIVERED">Đã giao hàng</option>
                    <option value="CANCELLED">Đã hủy đơn</option>
                  </select>
                </td>
                <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                  <button className="customize-btn" onClick={() => handlePrint(o)} style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', margin: '0 auto' }}>
                    ️ In phiếu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activePrintOrder && (
        <div className="print-only" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 9999 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 'bold' }}>DCOR STUDIO SOFA</h1>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Đồ án: Lập trình Web nâng cao - Đại học UEL</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>PHIẾU GIAO LẮP SẢN PHẨM</h2>
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Mã đơn: {activePrintOrder.id}</p>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>1. THÔNG TIN GIAO NHẬN</h3>
            <p style={{ margin: '6px 0' }}><strong>Khách hàng người nhận:</strong> {activePrintOrder.customerName}</p>
            <p style={{ margin: '6px 0' }}><strong>Số điện thoại:</strong> {activePrintOrder.phone}</p>
            <p style={{ margin: '6px 0' }}><strong>Địa chỉ giao hàng:</strong> {activePrintOrder.address}</p>
            {activePrintOrder.isGift && (
              <div style={{ margin: '15px 0', padding: '10px', border: '1px dashed #000', background: '#f9f9f9' }}>
                <strong>Lời nhắn quà tặng gửi kèm:</strong> <br />
                <em style={{ fontSize: '13px' }}>"{activePrintOrder.giftMessage}"</em>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>2. DANH SÁCH CHI TIẾT SẢN PHẨM</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px 0' }}>Nội dung sản phẩm tùy biến</th>
                  <th style={{ padding: '8px 0', textAlign: 'center' }}>Số lượng</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 0' }}>
                    {activePrintOrder.itemsSummary.split(' x ')[0]}
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'center' }}>1</td>
                  <td style={{ padding: '12px 0', textAlign: 'right' }}>
                    {activePrintOrder.hidePrice ? '*** (Đơn quà tặng)' : formatVND(activePrintOrder.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 60px 0' }}><strong>Đại diện DCor Studio (Ký, ghi rõ họ tên)</strong></p>
              <p style={{ borderBottom: '1px solid #ddd', width: '150px', margin: '0 auto' }}></p>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 60px 0' }}><strong>Khách hàng nhận bàn giao (Ký, ghi rõ họ tên)</strong></p>
              <p style={{ borderBottom: '1px solid #ddd', width: '150px', margin: '0 auto' }}></p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
            padding-top: 0 !important;
          }
          .no-print, header, footer {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
