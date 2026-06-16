'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Modals() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const modalParam = searchParams.get('modal');
    setActiveModal(modalParam);
  }, [searchParams]);

  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('modal');
    const newQuery = params.toString();
    router.push(newQuery ? `?${newQuery}` : '/');
  };

  if (!activeModal) return null;

  return (
    <div className="sitemap-modal-overlay active" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="sitemap-modal" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="sitemap-modal-header">
          <h3>
            {activeModal === 'blog-modal' && 'Blogs & Ý tưởng Thiết kế'}
            {activeModal === 'about-modal' && 'Về chúng tôi — D\'Cor Studio'}
            {activeModal === 'policy-modal' && 'Chính sách mua hàng & Giao nhận'}
            {activeModal === 'faq-modal' && 'Câu hỏi thường gặp (FAQ)'}
            {activeModal === 'contact-modal' && 'Liên hệ & Báo giá B2B'}
          </h3>
          <button className="sitemap-modal-close" onClick={closeModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        
        <div className="sitemap-modal-body">
          {activeModal === 'blog-modal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <article style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                <h4 style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 600 }}>5 Xu hướng thiết kế Sofa Bắc Âu (Scandinavian) cho năm 2026</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Ngày đăng: 12/06/2026</p>
                <p style={{ marginTop: '10px' }}>Lối sống tối giản ngày càng lên ngôi, kéo theo sự ưa chuộng các mẫu sofa chân cao thanh thoát, sử dụng vải dệt thô màu kem hoặc beige...</p>
              </article>
              <article style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>
                <h4 style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 600 }}>Cách lựa chọn chất liệu bọc Sofa: Vải dệt nỉ hay Da thật?</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Ngày đăng: 05/06/2026</p>
                <p style={{ marginTop: '10px' }}>Nếu gia đình có trẻ nhỏ và nuôi thú cưng, chất liệu vải dệt sợi tổng hợp đan khít (như boucle) sẽ là cứu cánh hoàn hảo so với chất liệu da dễ bị cào xước...</p>
              </article>
            </div>
          )}

          {activeModal === 'about-modal' && (
            <div>
              <p><strong>D'Cor Studio</strong> là thương hiệu nội thất phong cách Đan Mạch cao cấp, được thành lập làm đồ án môn học <em>Lập trình Web nâng cao</em> tại <strong>Trường Đại học Kinh tế - Luật (UEL)</strong>.</p>
              <p style={{ marginTop: '15px' }}>Chúng tôi kế thừa và phát triển giải pháp cấu hình tùy biến sofa 2D trực quan từ hãng thiết kế BoConcept Đan Mạch. Toàn bộ hình ảnh sản phẩm và swatch chất liệu được lưu trữ an toàn trên Supabase Storage và tối ưu truyền tải qua CDN tốc độ cao.</p>
              <p style={{ marginTop: '15px' }}><strong>Giảng viên hướng dẫn:</strong> Khoa Hệ thống Thông tin - UEL.</p>
            </div>
          )}

          {activeModal === 'policy-modal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <h4 style={{ color: 'var(--accent)', fontWeight: 600 }}>1. Chính sách đổi trả hàng</h4>
                <p>Khách hàng có quyền yêu cầu đổi mới sản phẩm hoặc hoàn tiền trong vòng 30 ngày kể từ ngày nghiệm thu bàn giao nếu phát hiện lỗi kỹ thuật từ nhà sản xuất (như xẹp lún mousse, nứt gãy khung gỗ).</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--accent)', fontWeight: 600 }}>2. Chính sách vận chuyển & Lắp đặt</h4>
                <p>Miễn phí vận chuyển và lắp đặt hoàn thiện tại nhà cho mọi đơn hàng khu vực nội thành Tp. Hồ Chí Minh. Đối với các tỉnh lân cận, chi phí được tính toán tự động dựa trên quãng đường thực tế.</p>
              </div>
              <div>
                <h4 style={{ color: 'var(--accent)', fontWeight: 600 }}>3. Bảo hành sản phẩm</h4>
                <p>Khung sườn sofa gỗ thông sấy nhập khẩu được bảo hành chính hãng 5 năm. Bề mặt bọc vải/da được bảo hành 2 năm kể từ ngày bàn giao.</p>
              </div>
            </div>
          )}

          {activeModal === 'faq-modal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--accent)' }}>Q: Sofa tùy biến mất bao lâu để sản xuất và bàn giao?</p>
                <p>A: Thông thường, các sản phẩm sofa tùy biến theo yêu cầu riêng (chọn loại chân và chất liệu bọc vải tự thiết kế) sẽ mất từ 10 - 15 ngày làm việc để hoàn thiện sản xuất và giao lắp.</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--accent)' }}>Q: Tôi có thể thay đổi thiết kế sau khi đã đặt hàng không?</p>
                <p>A: Bạn có thể thay đổi tùy biến chất liệu hoặc kích thước chân sofa trong vòng 24 giờ kể từ khi đặt đơn hàng thành công, trước khi đơn hàng chuyển sang trạng thái "Đang sản xuất".</p>
              </div>
            </div>
          )}

          {activeModal === 'contact-modal' && (
            <form onSubmit={(e) => { e.preventDefault(); alert("️ Cảm ơn bạn! Yêu cầu liên hệ / báo giá B2B của bạn đã được tiếp nhận thành công."); closeModal(); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Họ và tên</label>
                <input type="text" required className="search-input" style={{ width: '100%', borderRadius: '8px', padding: '0 15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Số điện thoại / Email</label>
                <input type="text" required className="search-input" style={{ width: '100%', borderRadius: '8px', padding: '0 15px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>Nội dung yêu cầu</label>
                <textarea required className="search-input" style={{ width: '100%', height: '100px', borderRadius: '8px', padding: '10px 15px', resize: 'none' }}></textarea>
              </div>
              <button type="submit" className="checkout-btn" style={{ marginTop: '10px' }}>Gửi yêu cầu liên hệ</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
