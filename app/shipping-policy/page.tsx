import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Chính sách Vận chuyển & Lắp đặt</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Cập nhật lần cuối: 14 Tháng 6, 2026</p>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '35px',
          boxShadow: 'var(--card-shadow)',
          lineHeight: '1.8',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Phạm vi áp dụng</h3>
            <p>DCor Studio hỗ trợ giao hàng và lắp đặt nội thất trọn gói trên phạm vi toàn quốc (63 tỉnh thành).</p>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Biểu phí vận chuyển</h3>
            <ul>
              <li><strong>Đơn hàng trên 50.000.000 ₫:</strong> Miễn phí vận chuyển và lắp đặt hoàn toàn tại khu vực nội thành TP. Hồ Chí Minh và Hà Nội.</li>
              <li><strong>Đơn hàng dưới 50.000.000 ₫:</strong> Áp dụng mức phí đồng giá 250.000 ₫ cho các đơn hàng cồng kềnh khu vực nội thành. Các khu vực ngoại thành và ngoại tỉnh sẽ tính phí vận chuyển theo báo giá thực tế của đơn vị vận chuyển đối tác.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>3. Thời gian giao hàng dự kiến</h3>
            <ul>
              <li><strong>Khu vực nội thành:</strong> Giao hàng nhanh từ 2 - 3 ngày làm việc kể từ thời điểm duyệt xác nhận đơn hàng.</li>
              <li><strong>Khu vực ngoại tỉnh:</strong> Từ 5 - 7 ngày làm việc tùy thuộc vào địa giới hành chính nhận quà.</li>
              <li>Đối với các sản phẩm đặt riêng tùy chỉnh theo màu da hoặc vải bọc đặc thù, thời gian bàn giao sẽ dao động từ 15 - 20 ngày (nhân viên CSKH sẽ thông báo cụ thể khi duyệt đơn).</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>4. Quy định lắp đặt và đồng kiểm</h3>
            <p>Khi nhận hàng, khách hàng có quyền mở kiểm tra đồng kiểm cùng nhân viên giao hàng về số lượng, tình trạng trầy xước bề mặt da/gỗ. Đội ngũ kỹ thuật của DCor sẽ chịu trách nhiệm bưng bê lắp ráp hoàn thiện tại phòng chỉ định của khách hàng.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
