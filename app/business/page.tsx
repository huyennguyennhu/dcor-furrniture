'use client';

import React, { useState } from 'react';

export default function BusinessPage() {
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [phone, setPhone] = useState('');
  const [projectType, setProjectType] = useState('Cafe');
  const [budget, setBudget] = useState('Dưới 100 triệu');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Yêu cầu báo giá B2B của bạn đã được gửi thành công! Chuyên viên dự án B2B của D\'Cor sẽ liên hệ lại qua SĐT trong vòng 4 giờ làm việc.');
    setCompanyName('');
    setTaxCode('');
    setPhone('');
    setDescription('');
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Giải pháp doanh nghiệp B2B</span>
          <h1 style={{ fontSize: '38px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Dịch vụ Nội thất Dự án & Số lượng lớn</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '6px', maxWidth: '600px', margin: '6px auto 0' }}>Báo giá đặc quyền cho quán cafe, nhà hàng, khách sạn và văn phòng với chính sách chiết khấu volume và VAT đầy đủ.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '50px', alignItems: 'stretch' }}>
          
          {/* Cột trái: Giới thiệu ưu đãi B2B */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Đặc quyền đối tác dự án</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ fontSize: '20px', color: 'var(--accent)', fontWeight: 'bold' }}>✓</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#fff' }}>Chiết khấu đặc biệt theo sản lượng</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Mức chiết khấu hấp dẫn trực tiếp vào đơn giá khi đặt mua số lượng lớn hoặc theo bộ combo.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ fontSize: '20px', color: 'var(--accent)', fontWeight: 'bold' }}>✓</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#fff' }}>Giao hàng nhiều địa chỉ & Lắp đặt tận nơi</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Hỗ trợ giao hàng đến nhiều chi nhánh dự án khác nhau và đội ngũ kỹ thuật lắp đặt trọn gói.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ fontSize: '20px', color: 'var(--accent)', fontWeight: 'bold' }}>✓</div>
                <div>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#fff' }}>Xuất hóa đơn VAT & Thủ tục nhanh gọn</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cung cấp đầy đủ chứng từ VAT, hợp đồng kinh tế và cam kết tiến độ bàn giao dự án nghiêm ngặt.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Form B2B */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '30px', boxShadow: 'var(--card-shadow)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Yêu cầu tư vấn & Nhận báo giá</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tên doanh nghiệp / Công ty *</label>
                <input 
                  type="text" 
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Công ty Cổ phần A" 
                  style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Mã số thuế (Hoặc số CCCD) *</label>
                  <input 
                    type="text" 
                    required
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    placeholder="Mã số thuế công ty..." 
                    style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Số điện thoại liên hệ *</label>
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="SĐT người đại diện..." 
                    style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Loại hình dự án</label>
                  <select 
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="Cafe">Quán Cafe / Trà sữa</option>
                    <option value="Restaurant">Nhà hàng / Quán ăn</option>
                    <option value="Office">Văn phòng làm việc</option>
                    <option value="Hotel">Khách sạn / Homestay</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ngân sách dự kiến</label>
                  <select 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    style={{ width: '100%', height: '44px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="Dưới 100 triệu">Dưới 100 triệu</option>
                    <option value="100 - 300 triệu">100 - 300 triệu</option>
                    <option value="Trên 300 triệu">Trên 300 triệu</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Nhu cầu chi tiết sản phẩm</label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Cần đặt 10 chiếc sofa Indivi kèm 30 ghế ngồi quán cafe..." 
                  style={{ width: '100%', height: '100px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  padding: '14px 28px',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(var(--accent-rgb), 0.2)',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Gửi yêu cầu báo giá B2B
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
