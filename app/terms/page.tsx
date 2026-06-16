import React from 'react';

export default function TermsPage() {
  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>Điều khoản Sử dụng Dịch vụ</h1>
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
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>1. Chấp nhận các điều khoản</h3>
            <p>Bằng việc truy cập, duyệt sản phẩm hoặc thực hiện mua hàng tại D'Cor Studio, bạn mặc định đồng ý tuân thủ toàn bộ các điều khoản sử dụng và quy định bảo mật được nêu tại đây.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>2. Tài khoản người dùng</h3>
            <p>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập cá nhân (đăng nhập thông qua mã OTP số điện thoại) và đảm bảo các thông tin cung cấp khi thanh toán là hoàn toàn chính xác.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>3. Sở hữu trí tuệ</h3>
            <p>Toàn bộ thiết kế đồ họa, hình ảnh sản phẩm 3D, mã nguồn và nội dung bài viết đăng tải trên trang web thuộc quyền sở hữu trí tuệ của D'Cor Studio. Mọi hành vi sao chép thương mại khi chưa có sự đồng ý bằng văn bản đều bị nghiêm cấm.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>4. Trách nhiệm pháp lý</h3>
            <p>Chúng tôi cam kết cung cấp thông tin giá bán chính xác và minh bạch. Trong trường hợp xảy ra lỗi hiển thị giá cực kỳ vô lý do lỗi kỹ thuật hệ thống, D'Cor Studio bảo lưu quyền liên hệ khách hàng để hủy đơn hoặc thương lượng lại giao dịch.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
