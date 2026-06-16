'use client';

import React, { useState } from 'react';

interface ReturnRequest {
  id: string;
  orderId: string;
  productName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  statusVi: string;
  createdAt: string;
}

const INITIAL_REQUESTS: ReturnRequest[] = [
  {
    id: 'ret-1',
    orderId: 'DC-192834',
    productName: 'Hệ thống Como màu xám',
    reason: 'Sản phẩm bị trầy xước nhẹ ở góc tủ phía dưới bên trái khi vận chuyển.',
    status: 'APPROVED',
    statusVi: 'Đã chấp nhận',
    createdAt: '12 Tháng 5, 2026'
  }
];

export default function ReturnsPage() {
  const [requests, setRequests] = useState<ReturnRequest[]>(INITIAL_REQUESTS);
  const [showForm, setShowForm] = useState(false);

  const [orderId, setOrderId] = useState('DC-874291');
  const [productName, setProductName] = useState('Bàn console Bordeaux');
  const [reason, setReason] = useState('Lỗi sản xuất');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    const newReq: ReturnRequest = {
      id: `ret-${Date.now()}`,
      orderId,
      productName,
      reason: `${reason}: ${description}`,
      status: 'PENDING',
      statusVi: 'Đang xử lý',
      createdAt: 'Hôm nay'
    };

    setRequests([newReq, ...requests]);
    setDescription('');
    setShowForm(false);
    alert('Yêu cầu đổi trả của bạn đã được gửi đi! Nhân viên CSKH sẽ liên hệ với bạn trong vòng 24 giờ làm việc.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'var(--accent)';
      case 'APPROVED': return '#2ECC71';
      case 'REJECTED': return '#E74C3C';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Yêu cầu đổi trả / bảo hành</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Gửi yêu cầu hỗ trợ đổi hàng, trả hàng hoặc bảo hành kỹ thuật trực tuyến.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            + Gửi yêu cầu mới
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Tạo yêu cầu đổi trả mới</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mã đơn hàng liên quan *</label>
              <input 
                type="text" 
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Sản phẩm cần đổi trả *</label>
              <select 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="Bàn console Bordeaux">Bàn console Bordeaux</option>
                <option value="Sofa Indivi Lazio 3 chỗ">Sofa Indivi Lazio 3 chỗ</option>
                <option value="Hệ thống Como">Hệ thống Como</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Lý do đổi trả *</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', height: '40px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
            >
              <option value="Lỗi sản xuất">Lỗi sản xuất / kỹ thuật</option>
              <option value="Hư hỏng do vận chuyển">Hư hỏng do vận chuyển (trầy xước, móp méo)</option>
              <option value="Không giống mô tả">Không giống hình ảnh / mô tả trên web</option>
              <option value="Giao nhầm hàng">Giao nhầm sản phẩm / nhầm cấu hình</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mô tả chi tiết tình trạng *</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng mô tả kỹ lỗi hoặc tình trạng sản phẩm để chúng tôi có phương án xử lý nhanh nhất..."
              style={{ width: '100%', height: '80px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="submit"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Gửi yêu cầu
            </button>
            <button 
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      )}

      {/* Danh sách yêu cầu */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {requests.map(req => (
          <div key={req.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '15px', color: '#fff', display: 'block' }}>{req.productName}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Đơn hàng: <strong>{req.orderId}</strong> | Yêu cầu lúc: {req.createdAt}</span>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '4px',
                background: getStatusColor(req.status) + '22',
                color: getStatusColor(req.status),
                textTransform: 'uppercase'
              }}>
                {req.statusVi}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}><strong>Chi tiết:</strong> {req.reason}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
