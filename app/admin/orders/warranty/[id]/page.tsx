'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, User, MapPin, CheckSquare, Search, Wrench, Square, X
} from 'lucide-react';
import CustomSelect from '@/components/admin/CustomSelect';

const mockWarrantyDetail = {
  id: 'WAR-000125',
  createdAt: '01/09/2026 09:30',
  assignee: 'Chưa phân công',
  status: 'PENDING',
  customer: {
    name: 'Nguyễn Như Huyền',
    phone: '0901234567',
    email: 'huyen.nn@example.com',
    address: '239 Hoàng Diệu, Phường 8, Quận 4, Tp. Hồ Chí Minh',
    history: '1 đổi trả (Hoàn tất), 0 bảo hành'
  },
  product: {
    name: 'Sofa Luna (3 chỗ)',
    sku: 'SF-LUN-03',
    variant: 'Da thật màu Nâu',
    purchaseDate: '15/05/2026',
    orderId: 'ORD-001025',
    deliveryDate: '20/05/2026',
    warrantyExpiry: '15/05/2028',
    isExpired: false
  },
  issue: {
    type: 'Lỗi nệm mút',
    reason: 'Đệm ngồi bị xẹp sau 3 tháng sử dụng',
    description: 'Phần nệm ngồi bên trái xẹp lún hẳn xuống, không có độ đàn hồi như ban đầu.',
    discoveredAt: 'Cách đây 1 tuần',
    frequency: 'Thường xuyên',
    note: 'Nhà có trẻ nhỏ thường xuyên ngồi vị trí này.'
  }
};

const SectionCard = ({ title, children, action }: { title: string, children: React.ReactNode, action?: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: 0 }}>{title}</h3>
      {action}
    </div>
    <div style={{ padding: '20px', flex: 1 }}>
      {children}
    </div>
  </div>
);

// BƯỚC 1: TIẾP NHẬN BẢO HÀNH
const Step1_Receive = ({ data }: { data: typeof mockWarrantyDetail }) => {
  const [isAdminLocked, setIsAdminLocked] = useState(false);
  const [adminChecks, setAdminChecks] = useState({
    c1: false, c2: false, c3: false, c4: false
  });

  const renderCheckbox = (checked: boolean, onChange: (checked: boolean) => void, label: string) => {
    if (!isAdminLocked) {
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', fontSize: '14px' }} onClick={() => onChange(!checked)}>
          <div style={{ marginTop: '2px' }}>
            {checked ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} color="var(--text-muted)" />}
          </div>
          <span style={{ lineHeight: 1.5 }}>{label}</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: checked ? '#059669' : '#ef4444' }}>
        <div style={{ marginTop: '2px' }}>
          {checked ? <CheckCircle2 size={16} /> : <X size={16} />} 
        </div>
        <span style={{ lineHeight: 1.5 }}>{label}</span>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Row 1: Khách hàng & Sản phẩm */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <SectionCard title="Khách hàng">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} color="var(--text-muted)"/> {data.customer.name}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-secondary)' }}>
              <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{data.customer.address}</span>
            </div>
            <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-muted)' }}>Lịch sử giao dịch:</div>
              <div style={{ fontWeight: 500, marginTop: '4px' }}>{data.customer.history}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Sản phẩm & Bảo hành">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--accent)' }}>{data.product.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>SKU:</span>
              <span style={{ fontWeight: 500 }}>{data.product.sku}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Đơn hàng:</span>
              <Link href={`/admin/orders/${data.product.orderId}`} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>{data.product.orderId}</Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ngày mua:</span>
              <span>{data.product.purchaseDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hạn bảo hành:</span>
              <span style={{ fontWeight: 600, color: data.product.isExpired ? '#ef4444' : '#059669' }}>
                {data.product.warrantyExpiry}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Row 2: Lý do & Tình trạng */}
      <SectionCard title="Lý do & Tình trạng">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Loại lỗi:</div>
            <div style={{ fontWeight: 600, color: '#ea580c' }}>{data.issue.type}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Mô tả:</div>
            <div style={{ lineHeight: 1.5 }}>{data.issue.description}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <div style={{ width: '60px', height: '60px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ảnh 1</div>
            <div style={{ width: '60px', height: '60px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Ảnh 2</div>
          </div>
        </div>
      </SectionCard>

      {/* Row 3: Kiểm tra hệ thống & Xác nhận lỗi */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <SectionCard title="Kiểm tra hệ thống (Tự động)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Đơn hàng tồn tại', valid: true },
              { label: 'Sản phẩm thuộc đơn hàng', valid: true },
              { label: 'Đúng khách hàng mua', valid: true },
              { label: 'Sản phẩm còn trong thời hạn bảo hành', valid: true }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', color: item.valid ? '#059669' : '#ef4444' }}>
                <div style={{ marginTop: '2px' }}>
                  {item.valid ? <CheckCircle2 size={16} /> : <X size={16} />}
                </div>
                <span style={{ lineHeight: 1.5 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        
        <SectionCard 
          title="Xác nhận lỗi (Admin/Kỹ thuật)"
          action={
            <button 
              onClick={() => setIsAdminLocked(!isAdminLocked)} 
              className={`admin-btn ${isAdminLocked ? 'admin-btn-secondary' : 'admin-btn-primary'}`} 
              style={{ padding: '4px 12px', fontSize: '12px' }}
            >
              {isAdminLocked ? 'Sửa đánh giá' : 'Khóa & Lưu'}
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { id: 'c1', label: 'Nội dung lỗi phù hợp với thông tin khách cung cấp' },
              { id: 'c2', label: 'Hình ảnh/video đủ rõ để đánh giá sơ bộ' },
              { id: 'c3', label: 'Lỗi có dấu hiệu phù hợp với phạm vi bảo hành' },
              { id: 'c4', label: 'Không có dấu hiệu rõ ràng do lỗi người dùng sai cách' }
            ].map(item => (
              <div key={item.id}>
                {renderCheckbox(adminChecks[item.id as keyof typeof adminChecks], (val) => setAdminChecks({ ...adminChecks, [item.id]: val }), item.label)}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Row 4: Ghi chú */}
      <SectionCard title="Ghi chú">
        <textarea className="admin-input" rows={3} placeholder="Thêm ghi chú nội bộ (nếu có)..." style={{ resize: 'none' }}></textarea>
      </SectionCard>

      {/* Row 5: Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="admin-btn" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>Từ chối bảo hành</button>
        <button className={`admin-btn ${isAdminLocked ? 'admin-btn-primary' : 'admin-btn-secondary'}`} disabled={!isAdminLocked}>Tiếp nhận bảo hành</button>
      </div>

    </div>
  );
};

// BƯỚC 2: KIỂM TRA THỰC TẾ
const Step2_Inspect = () => {
  const [inspectionResult, setInspectionResult] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionCard title="Tình trạng tiếp nhận">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tình trạng bề mặt (Da/Vải/Gỗ)</label>
            <textarea className="admin-input" rows={2} placeholder="Ví dụ: Rách nhẹ góc trái, xước mặt bàn..." defaultValue="Bề mặt da nhăn nhẹ, mút xẹp rõ ở vị trí ngồi giữa."></textarea>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tình trạng kết cấu/khung</label>
            <textarea className="admin-input" rows={2} placeholder="Ví dụ: Lỏng ốc, gãy thanh chống..." defaultValue="Khung gỗ còn chắc chắn, không có dấu hiệu nứt gãy."></textarea>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tình trạng phụ kiện/cơ cấu</label>
            <textarea className="admin-input" rows={2} placeholder="Ví dụ: Piston hỏng, mất ốc..." defaultValue="Lò xo đàn hồi bình thường, dây thun chưa đứt."></textarea>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Đánh giá lỗi & Chứng từ">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Mức độ lỗi</label>
            <CustomSelect 
              options={[
                { label: 'Nhẹ - Khắc phục nhanh', value: 'LOW' },
                { label: 'Trung bình - Cần thay linh kiện', value: 'MEDIUM' },
                { label: 'Nghiêm trọng - Cần thay mới bộ phận', value: 'HIGH' }
              ]}
              value="MEDIUM"
              onChange={() => {}}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Nguyên nhân dự kiến</label>
            <textarea className="admin-input" rows={2} defaultValue="Mút Foam kém chất lượng từ lô hàng tháng 4, hoặc do sử dụng quá tải tại vị trí hẹp."></textarea>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Biên bản & Hình ảnh (KTV cung cấp)</label>
            <div style={{ padding: '24px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>+ Tải lên Biên bản kiểm tra (.pdf, .jpg)</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button 
            className="admin-btn"
            style={{ 
              flex: 1, 
              background: (inspectionResult === 'MORE_INFO' || hoveredBtn === 'MORE_INFO') ? '#d97706' : '#fffbeb', 
              border: '1px solid #d97706', 
              color: (inspectionResult === 'MORE_INFO' || hoveredBtn === 'MORE_INFO') ? 'white' : '#d97706',
              transition: 'all 0.2s'
            }}
            onClick={() => setInspectionResult('MORE_INFO')}
            onMouseEnter={() => setHoveredBtn('MORE_INFO')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Cần kiểm tra thêm
          </button>
          <button 
            className="admin-btn"
            style={{ 
              flex: 1, 
              background: (inspectionResult === 'REJECT' || hoveredBtn === 'REJECT') ? '#ef4444' : '#fef2f2', 
              border: '1px solid #ef4444', 
              color: (inspectionResult === 'REJECT' || hoveredBtn === 'REJECT') ? 'white' : '#ef4444',
              transition: 'all 0.2s'
            }}
            onClick={() => setInspectionResult('REJECT')}
            onMouseEnter={() => setHoveredBtn('REJECT')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            KHÔNG thuộc phạm vi bảo hành
          </button>
          <button 
            className="admin-btn"
            style={{ 
              flex: 1, 
              background: (inspectionResult === 'WARRANTY' || hoveredBtn === 'WARRANTY') ? '#059669' : '#ecfdf5', 
              border: '1px solid #059669', 
              color: (inspectionResult === 'WARRANTY' || hoveredBtn === 'WARRANTY') ? 'white' : '#059669',
              transition: 'all 0.2s'
            }}
            onClick={() => setInspectionResult('WARRANTY')}
            onMouseEnter={() => setHoveredBtn('WARRANTY')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Thuộc phạm vi bảo hành
          </button>
        </div>

        {inspectionResult === 'WARRANTY' && (
          <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', border: '1px solid #10b981', color: '#065f46', fontSize: '14px', fontWeight: 500 }}>
            Lỗi phát sinh do chất lượng cấu kiện. Chuyển sang bước Xử lý để lên phương án sửa chữa.
            <div style={{ marginTop: '16px' }}>
              <button className="admin-btn admin-btn-primary">Chuyển sang Bước Xử lý</button>
            </div>
          </div>
        )}

        {inspectionResult === 'REJECT' && (
          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #ef4444' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#991b1b', marginBottom: '8px' }}>Lý do từ chối (Trình lên Quản lý)</label>
            <textarea className="admin-input" rows={3} placeholder="Mô tả lý do từ chối (Ví dụ: khách hàng sử dụng sai cách, tự ý tháo lắp...)" style={{ borderColor: '#fca5a5' }}></textarea>
            <div style={{ marginTop: '16px' }}>
              <button className="admin-btn" style={{ background: '#ef4444', color: 'white', border: 'none' }}>Xác nhận Từ chối Bảo hành</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// BƯỚC 3: PHƯƠNG ÁN XỬ LÝ
const Step3_Process = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionCard title="Chi tiết phương án xử lý">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Phương án giải quyết</label>
              <CustomSelect 
                options={[
                  { label: 'Sửa chữa / Khắc phục lỗi', value: 'REPAIR' },
                  { label: 'Thay thế linh kiện nhỏ', value: 'REPLACE_PART' },
                  { label: 'Thay thế toàn bộ bộ phận', value: 'REPLACE_MODULE' },
                  { label: 'Đổi sản phẩm mới', value: 'EXCHANGE' }
                ]}
                value="REPAIR"
                onChange={() => {}}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Nội dung xử lý chi tiết</label>
              <textarea className="admin-input" rows={3} defaultValue="Gia cố lại khung đỡ bên dưới và thay lớp đệm mút Foam mới cho vị trí ngồi bị xẹp."></textarea>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Kỹ thuật viên phụ trách sửa chữa</label>
              <CustomSelect 
                options={[
                  { label: 'KTV Minh Quân', value: 'QUAN' },
                  { label: 'KTV Tuấn Kiệt', value: 'KIET' },
                ]}
                value="QUAN"
                onChange={() => {}}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Thời gian bắt đầu</label>
                <input type="date" className="admin-input" defaultValue="2026-09-02" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Dự kiến hoàn thành</label>
                <input type="date" className="admin-input" defaultValue="2026-09-04" />
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Quản lý Vật tư / Linh kiện (Tùy chọn)">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '12px', fontWeight: 600 }}>Tên vật tư / Mã SKU</th>
              <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Số lượng</th>
              <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Chi phí dự kiến (VND)</th>
              <th style={{ padding: '12px', fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px' }}>Đệm mút Foam D40 (Tấm 50x50)</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>1</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>350,000</td>
              <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444', cursor: 'pointer' }}>Xóa</td>
            </tr>
            <tr>
              <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>
                + Thêm vật tư sử dụng
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="admin-btn admin-btn-secondary">Lưu nháp</button>
          <button className="admin-btn admin-btn-primary">Bắt đầu sửa chữa</button>
        </div>
      </SectionCard>
    </div>
  );
};

// BƯỚC 4: HOÀN TẤT
const Step4_Complete = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionCard title="Cập nhật Kết quả Bảo hành">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tình trạng sau xử lý</label>
            <textarea className="admin-input" rows={2} defaultValue="Đã phục hồi độ đàn hồi của nệm ngồi. Sản phẩm vệ sinh sạch sẽ, sẵn sàng bàn giao."></textarea>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Hình ảnh sau xử lý</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', cursor: 'pointer' }}>+ Ảnh 1</div>
              <div style={{ width: '80px', height: '80px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-color)', cursor: 'pointer' }}>+ Ảnh 2</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
             <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Người xác nhận</label>
                <input type="text" className="admin-input" defaultValue="Manager Trần" readOnly style={{ background: 'var(--bg-secondary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Ngày hoàn thành thực tế</label>
                <input type="date" className="admin-input" defaultValue="2026-09-04" />
              </div>
          </div>
        </div>
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
           <button className="admin-btn admin-btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>Xác nhận hoàn tất bảo hành</button>
        </div>
      </SectionCard>

      <SectionCard title="Timeline (Theo dõi tiến độ)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-color)', marginTop: '6px' }} />
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Chờ xác nhận hoàn tất</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', marginTop: '6px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>Đã bắt đầu sửa chữa</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>02/09/2026 08:30 - KTV Minh Quân</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', marginTop: '6px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>Xác nhận lỗi thuộc bảo hành</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>01/09/2026 15:45 - KTV Hoàng Sơn</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', marginTop: '6px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>Tiếp nhận bảo hành</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>01/09/2026 10:00 - Admin CSKH</div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default function WarrantyDetailPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const data = mockWarrantyDetail;

  const currentWorkflowStep = 3; // For timeline progress representation (0-indexed logic like returns)

  const steps = [
    { id: 1, title: 'Tiếp nhận', date: '01/09/2026 10:00', icon: <CheckSquare size={16} /> },
    { id: 2, title: 'Kiểm tra', date: '01/09/2026 15:45', icon: <Search size={16} /> },
    { id: 3, title: 'Xử lý', date: '02/09/2026 08:30', icon: <Wrench size={16} /> },
    { id: 4, title: 'Hoàn tất', date: '', icon: <CheckCircle2 size={16} /> }
  ];

  const renderStepContent = () => {
    switch (activeStep) {
      case 1: return <Step1_Receive data={data} />;
      case 2: return <Step2_Inspect />;
      case 3: return <Step3_Process />;
      case 4: return <Step4_Complete />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.push('/admin/orders/warranty')}
            style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', cursor: 'pointer' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{data.id}</h1>
            <span style={{ padding: '6px 12px', background: '#fef3c7', color: '#d97706', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
              Chờ tiếp nhận
            </span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', gap: '24px' }}>
            <span>Ngày yêu cầu: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{data.createdAt}</span></span>
            <span>Người tiếp nhận: <span style={{ fontWeight: 500, color: data.assignee === 'Chưa phân công' ? '#ef4444' : 'var(--text-primary)' }}>{data.assignee}</span></span>
          </div>
          </div>
        </div>
      </div>

      {/* TIMELINE PROGRESS */}
      <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Tiến trình xử lý yêu cầu bảo hành</h3>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mẹo: Nhấn vào từng bước để xem nội dung xử lý tại bước đó.</div>
        </div>
        
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          {/* PROGRESS LINE */}
          <div style={{ position: 'absolute', top: '16px', left: '45px', right: '45px', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: '16px', left: '45px', width: `calc((100% - 90px) * ${(activeStep - 1) / (steps.length - 1)})`, height: '2px', background: '#059669', zIndex: 1, transition: 'width 0.3s' }}></div>

          {/* STEPS */}
          {steps.map((step, idx) => {
            const stepIndex = idx + 1;
            const isDone = activeStep > stepIndex;
            const isActive = activeStep === stepIndex;
            const isPending = activeStep < stepIndex;

            return (
              <div 
                key={step.id} 
                onClick={() => setActiveStep(step.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '90px', cursor: 'pointer', opacity: isPending ? 0.5 : 1 }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
                  background: isDone ? '#059669' : isActive ? '#2563eb' : 'var(--bg-secondary)',
                  color: isPending ? 'var(--text-muted)' : 'white',
                  border: isActive ? '4px solid rgba(37, 99, 235, 0.3)' : 'none',
                  boxShadow: isActive ? '0 0 0 8px rgba(37, 99, 235, 0.15)' : 'none',
                  transition: 'all 0.2s'
                }}>
                  {step.icon}
                </div>
                <div style={{ fontSize: '12px', fontWeight: isActive ? 700 : 500, color: isPending ? 'var(--text-muted)' : 'var(--text-primary)', textAlign: 'center', marginBottom: '4px', whiteSpace: 'nowrap' }}>{step.title}</div>
                {step.date && <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{step.date}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC WORKSPACE PANEL */}
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {renderStepContent()}
      </div>
      
    </div>
  );
}
