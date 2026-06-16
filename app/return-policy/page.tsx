import React from 'react';

export default function ReturnPolicyPage() {
  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Chính sách Đổi trả & Hoàn tiền</h1>
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
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Thời gian đổi trả</h3>
            <p>Khách hàng có quyền yêu cầu đổi hoặc trả sản phẩm trong vòng **30 ngày** kể từ ngày ký biên bản bàn giao nhận hàng thành công.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Điều kiện áp dụng đổi trả</h3>
            <ul>
              <li><strong>Trường hợp được đổi trả miễn phí:</strong> Sản phẩm phát sinh lỗi kỹ thuật do nhà sản xuất (lún nệm không đàn hồi, gãy khung chân, lệch màu sơn mài) hoặc bị nứt nẻ hư hại móp méo trong quá trình nhân viên vận chuyển.</li>
              <li><strong>Yêu cầu về sản phẩm:</strong> Sản phẩm đổi trả phải còn nguyên nhãn mác, không có dấu hiệu bị bẩn, cháy nổ, trầy xước do tác động ngoại lực của người dùng sau khi nhận hàng.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>3. Quy trình thực hiện</h3>
            <ol>
              <li>Khách hàng đăng nhập tài khoản cá nhân, vào mục **Yêu cầu đổi trả** trong phần quản trị Đơn hàng.</li>
              <li>Tạo yêu cầu đổi trả online: chọn đơn hàng, chọn sản phẩm, chọn lý do lỗi và chụp ảnh/quay video thực tế đính kèm gửi đi.</li>
              <li>Nhân viên CSKH kiểm tra thông tin và duyệt yêu cầu. Đội ngũ giao nhận của D'Cor sẽ hẹn lịch đến thu hồi sản phẩm lỗi và bàn giao sản phẩm thay thế mới hoàn toàn miễn phí tại nhà cho bạn.</li>
            </ol>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>4. Chính sách hoàn tiền</h3>
            <p>Trong trường hợp sản phẩm lỗi không còn hàng thay thế hoặc khách hàng có nhu cầu trả hàng hoàn tiền, chúng tôi sẽ hoàn trả 100% số tiền đã mua qua tài khoản ngân hàng của khách hàng trong vòng 3 - 5 ngày làm việc kể từ lúc thu hồi sản phẩm về kho thành công.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
