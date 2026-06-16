'use client';

import React, { useState } from 'react';

interface Proposal {
  id: string;
  customerName: string;
  phone: string;
  productName: string;
  basePrice: number;
  proposedPrice: number;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  counterPrice?: number;
}

export default function AdminPriceProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([
    {
      id: 'PROP-001',
      customerName: 'Nguyễn Văn Minh',
      phone: '0901234567',
      productName: 'Sofa Indivi 2,5 chỗ (Chân gỗ sồi, vải nỉ Copenhagen nâu)',
      basePrice: 51290000,
      proposedPrice: 47000000,
      reason: 'Mua combo kèm 2 ghế ăn Charlotte và bàn trà sồi',
      status: 'PENDING'
    },
    {
      id: 'PROP-002',
      customerName: 'Trần Thị Mỹ B2B',
      phone: '0934567890',
      productName: 'Sofa Indivi 3 chỗ (Chân thép, da Napoli đen)',
      basePrice: 90000000,
      proposedPrice: 80000000,
      reason: 'Đại diện quán cafe D\'Or, muốn VAT và vận chuyển riêng',
      status: 'PENDING'
    },
    {
      id: 'PROP-003',
      customerName: 'Lê Hoàng Hải',
      phone: '0987654321',
      productName: 'Sofa Indivi 2,5 chỗ (Chân thép, vải Arezzo beige)',
      basePrice: 69390000,
      proposedPrice: 50000000,
      reason: 'Kinh phí eo hẹp mong muốn hỗ trợ sinh viên',
      status: 'PENDING'
    }
  ]);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const handleAccept = (id: string) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        alert(`Duyệt thành công! Đã sinh mã giảm giá tự động: DCOR-PROP-${id}. Khách hàng sẽ nhận thông báo SMS.`);
        return { ...p, status: 'ACCEPTED' };
      }
      return p;
    }));
  };

  const handleReject = (id: string) => {
    const reason = prompt('Nhập lý do từ chối gửi cho khách hàng:');
    if (reason === null) return;
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        alert(`Đã từ chối đề xuất. Lý do: "${reason}". Đã gửi thông báo tới khách hàng.`);
        return { ...p, status: 'REJECTED' };
      }
      return p;
    }));
  };

  const handleCounter = (id: string) => {
    const priceStr = prompt('Nhập mức giá đề nghị lại (Counter-Offer):');
    if (!priceStr) return;
    const price = parseInt(priceStr);
    if (isNaN(price)) {
      alert('Vui lòng nhập số tiền hợp lệ!');
      return;
    }
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        alert(`Đã gửi counter-offer mức giá ${formatVND(price)} tới khách hàng.`);
        return { ...p, status: 'COUNTERED', counterPrice: price };
      }
      return p;
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700 }}>️ Duyệt Đề Xuất Giá (Price Negotiation)</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Xem xét các yêu cầu trả giá từ khách hàng hoặc đối tác B2B</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {proposals.map((prop) => (
          <div key={prop.id} className="filters-container" style={{ margin: 0, padding: '25px', flexDirection: 'column', alignItems: 'stretch', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{prop.id}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '4px',
                background: 
                  prop.status === 'PENDING' ? '#f77f00' :
                  prop.status === 'ACCEPTED' ? '#52b788' :
                  prop.status === 'COUNTERED' ? '#3a86c8' : '#d62828',
                color: '#fff'
              }}>
                {prop.status === 'PENDING' && 'ĐANG CHỜ DUYỆT'}
                {prop.status === 'ACCEPTED' && 'ĐÃ DUYỆT'}
                {prop.status === 'COUNTERED' && `COUNTERED: ${formatVND(prop.counterPrice || 0)}`}
                {prop.status === 'REJECTED' && 'TỪ CHỐI'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
              <div>
                <p><strong>Khách hàng:</strong> {prop.customerName} ({prop.phone})</p>
                <p style={{ marginTop: '8px' }}>️ <strong>Sản phẩm cấu hình:</strong> {prop.productName}</p>
                <p style={{ marginTop: '8px' }}><strong>Lý do khách hàng:</strong> <em style={{ color: 'var(--text-muted)' }}>"{prop.reason}"</em></p>
              </div>
              <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                <p>Giá sàn hệ thống: <span style={{ textDecoration: 'line-through' }}>{formatVND(prop.basePrice)}</span></p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', marginTop: '8px' }}>Giá đề xuất: {formatVND(prop.proposedPrice)}</p>
                <p style={{ fontSize: '11px', color: '#52b788', marginTop: '4px' }}>Mức giảm yêu cầu: -{formatVND(prop.basePrice - prop.proposedPrice)} (-{Math.round(((prop.basePrice - prop.proposedPrice) / prop.basePrice) * 100)}%)</p>
              </div>
            </div>

            {prop.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <button className="add-cart-btn" onClick={() => handleAccept(prop.id)} style={{ padding: '8px 20px', fontSize: '13px', background: '#52b788' }}>
                  Duyệt Đề Xuất
                </button>
                <button className="customize-btn" onClick={() => handleCounter(prop.id)} style={{ padding: '8px 20px', fontSize: '13px', color: '#3a86c8' }}>
                  Đề nghị giá khác
                </button>
                <button className="customize-btn" onClick={() => handleReject(prop.id)} style={{ padding: '8px 20px', fontSize: '13px', color: '#d62828' }}>
                  Từ chối
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
