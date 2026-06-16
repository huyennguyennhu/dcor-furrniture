'use client';

import React, { useState } from 'react';

interface TrackingResult {
  orderId: string;
  receiverName: string;
  phone: string;
  address: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED';
  deliveryDate: string;
  shippingPartner: string;
  items: { name: string; qty: number }[];
}

export default function TrackOrderPage() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    
    // Mock dữ liệu tra cứu thành công
    if (orderIdInput.trim().toUpperCase().startsWith('DC-')) {
      setResult({
        orderId: orderIdInput.trim().toUpperCase(),
        receiverName: 'Nguyễn * * A',
        phone: '090 * * * * 567',
        address: '280 An Dương Vương, Phường 4, Quận 5, TP. Hồ Chí Minh',
        status: 'SHIPPED',
        deliveryDate: '18 Tháng 6, 2026',
        shippingPartner: 'D\'Cor Express (Vận chuyển nội bộ)',
        items: [
          { name: 'Sofa Indivi Lazio 3 chỗ', qty: 1 },
          { name: 'Bàn console Bordeaux', qty: 2 }
        ]
      });
    } else {
      setResult(null);
    }
  };

  const getStatusStepClass = (step: number, currentStatus: string) => {
    const statusOrder = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex >= step) {
      return {
        bg: 'var(--accent)',
        text: 'var(--text-primary)',
        border: '1px solid var(--accent)'
      };
    }
    return {
      bg: 'var(--bg-primary)',
      text: 'var(--text-muted)',
      border: '1px solid var(--border-color)'
    };
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Tra cứu trực tuyến</span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Theo dõi đơn hàng</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>Theo dõi hành trình vận chuyển và trạng thái xử lý đơn hàng của bạn.</p>
        </div>

        {/* Khung tìm kiếm */}
        <form onSubmit={handleSearch} style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '35px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Mã đơn hàng *</label>
            <input 
              type="text" 
              required
              placeholder="Ví dụ: DC-654321" 
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>Số điện thoại hoặc Email đặt hàng *</label>
            <input 
              type="text" 
              required
              placeholder="Số điện thoại hoặc email..." 
              value={contactInput}
              onChange={(e) => setContactInput(e.target.value)}
              style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>

          <button 
            type="submit"
            style={{
              height: '44px',
              padding: '0 24px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Tìm kiếm
          </button>
        </form>

        {/* Kết quả */}
        {searched && (
          result ? (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
              
              {/* Header kết quả */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mã đơn hàng</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{result.orderId}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ngày giao hàng dự kiến</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{result.deliveryDate}</h3>
                </div>
              </div>

              {/* Timeline trạng thái */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', position: 'relative', padding: '0 10px' }}>
                {/* Đường line nối */}
                <div style={{ position: 'absolute', top: '20px', left: '40px', right: '40px', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>

                {/* Step 1: Chờ xác nhận */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, position: 'relative', width: '80px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getStatusStepClass(0, result.status).bg, border: getStatusStepClass(0, result.status).border, color: getStatusStepClass(0, result.status).text, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>1</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chờ duyệt</span>
                </div>

                {/* Step 2: Đã xác nhận */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, position: 'relative', width: '80px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getStatusStepClass(1, result.status).bg, border: getStatusStepClass(1, result.status).border, color: getStatusStepClass(1, result.status).text, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>2</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Xác nhận</span>
                </div>

                {/* Step 3: Đang giao */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, position: 'relative', width: '80px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getStatusStepClass(2, result.status).bg, border: getStatusStepClass(2, result.status).border, color: getStatusStepClass(2, result.status).text, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>3</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Đang giao</span>
                </div>

                {/* Step 4: Đã nhận */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, position: 'relative', width: '80px', textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getStatusStepClass(3, result.status).bg, border: getStatusStepClass(3, result.status).border, color: getStatusStepClass(3, result.status).text, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>4</div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Đã nhận</span>
                </div>
              </div>

              {/* Thông tin chi tiết */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>Thông tin vận chuyển</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}><strong>Người nhận:</strong> {result.receiverName}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}><strong>SĐT:</strong> {result.phone}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}><strong>Đối tác giao hàng:</strong> {result.shippingPartner}</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}><strong>Địa chỉ:</strong> {result.address}</p>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', textTransform: 'uppercase' }}>Sản phẩm</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span>{item.name}</span>
                        <strong>x{item.qty}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', color: '#E74C3C' }}>
              ️ Không tìm thấy thông tin đơn hàng tương ứng. Vui lòng kiểm tra lại Mã đơn hàng (bắt đầu bằng DC-) và thông tin SĐT/Email.
            </div>
          )
        )}

      </div>
    </div>
  );
}
