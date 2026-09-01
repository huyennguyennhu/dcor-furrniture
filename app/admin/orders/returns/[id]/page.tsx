'use client';

import React, { useState, use } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Package, DollarSign, Image as ImageIcon, Check, X, Truck, Square, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import CustomSelect from '@/components/admin/CustomSelect';

// Mock format currency
const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

export default function ReturnDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const returnId = id.toUpperCase();
  
  // 4 is the final step in 0-indexed 5-step array
  const [selectedStep, setSelectedStep] = useState<number>(4);
  const currentWorkflowStep = 4; 

  const renderStepContent = () => {
    switch (selectedStep) {
      case 0: return <Step1_Approve />;
      case 1: return <Step2_WaitReturn />;
      case 2: return <Step3_InventoryReceived />;
      case 3: return <Step4_RefundOrExchange />;
      case 4: return <Step5_Completed returnId={returnId} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/orders/returns" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', textDecoration: 'none', background: 'var(--bg-primary)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Yêu cầu: {returnId}</h1>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', gap: '24px' }}>
              <span>Ngày yêu cầu: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>01/09/2026 09:30</span></span>
              <span>Người xử lý: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Admin/KTV Hoàng Sơn</span></span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="admin-btn admin-btn-secondary">In biên bản</button>
          <button className="admin-btn admin-btn-primary">Liên hệ khách hàng</button>
        </div>
      </div>

      {/* TIMELINE PROGRESS */}
      <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Tiến trình xử lý yêu cầu đổi trả</h3>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mẹo: Nhấn vào từng bước để xem nội dung xử lý tại bước đó.</div>
        </div>
        
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          {/* PROGRESS LINE */}
          <div style={{ position: 'absolute', top: '16px', left: '45px', right: '45px', height: '2px', background: 'var(--border-color)', zIndex: 1 }}></div>
          <div style={{ position: 'absolute', top: '16px', left: '45px', width: `calc((100% - 90px) * ${currentWorkflowStep / 4})`, height: '2px', background: '#059669', zIndex: 1, transition: 'width 0.3s' }}></div>

          {/* STEPS */}
          {[
            { label: 'Duyệt yêu cầu', status: 'done', date: '01/09/2026 11:20', icon: <AlertCircle size={16}/> },
            { label: 'Đợi hoàn trả hàng', status: 'done', date: '02/09/2026 08:30', icon: <Truck size={16}/> },
            { label: 'Đã nhận hàng', status: 'done', date: '03/09/2026 10:00', icon: <Package size={16}/> },
            { label: 'Hoàn tiền', status: 'done', date: '03/09/2026 14:25', icon: <DollarSign size={16}/> },
            { label: 'Hoàn tất', status: 'done', date: '03/09/2026 14:30', icon: <CheckCircle2 size={16}/> }
          ].map((step, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedStep(idx)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '90px', cursor: 'pointer', opacity: idx > currentWorkflowStep ? 0.5 : 1 }}
            >
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px',
                background: step.status === 'done' ? '#059669' : step.status === 'active' ? '#2563eb' : 'var(--bg-secondary)',
                color: step.status === 'pending' ? 'var(--text-muted)' : 'white',
                border: selectedStep === idx ? '4px solid rgba(5, 150, 105, 0.3)' : 'none',
                boxShadow: selectedStep === idx ? '0 0 0 8px rgba(5, 150, 105, 0.15)' : 'none',
                transition: 'all 0.2s'
              }}>
                {step.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: selectedStep === idx ? 700 : 500, color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)', textAlign: 'center', marginBottom: '4px', whiteSpace: 'nowrap' }}>{step.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{step.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* DYNAMIC WORKSPACE PANEL */}
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {renderStepContent()}
      </div>

    </div>
  );
}

// ----------------------
// WORKSPACE COMPONENTS
// ----------------------

const PanelContainer = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    {children}
  </div>
);

const SectionCard = ({ title, children, highlighted }: { title: string, children: React.ReactNode, highlighted?: boolean }) => (
  <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: highlighted ? '2px solid var(--text-primary)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{title}</h3>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
);

// BƯỚC 1: DUYỆT YÊU CẦU
// BƯỚC 1: DUYỆT YÊU CẦU
const Step1_Approve = () => {
  // --- STATE: Hệ thống tự động ---
  const [sysChecks, setSysChecks] = useState([
    { id: 'c1', label: 'Đơn hàng tồn tại (ORD-001025)', valid: true },
    { id: 'c2', label: 'Yêu cầu gửi từ đúng tài khoản khách mua', valid: true },
    { id: 'c3', label: 'Sản phẩm có nằm trong đơn hàng', valid: true },
    { id: 'c4', label: 'Số lượng yêu cầu hợp lệ', valid: true },
    { id: 'c5', label: 'Đơn hàng đã được giao thành công', valid: true },
    { id: 'c6', label: 'Không có yêu cầu trùng lặp', valid: true },
    { id: 'c7', label: 'Yêu cầu nằm trong thời hạn (Quá hạn 1 ngày)', valid: false }, // Mock lỗi
    { id: 'c8', label: 'Sản phẩm thuộc nhóm áp dụng chính sách', valid: true },
  ]);
  const [sysOverrides, setSysOverrides] = useState<Record<string, string>>({});
  const [editingOverride, setEditingOverride] = useState<string | null>(null);
  const [tempOverrideNote, setTempOverrideNote] = useState("");

  const handleSaveOverride = (id: string) => {
    if (!tempOverrideNote.trim()) return;
    setSysOverrides({ ...sysOverrides, [id]: tempOverrideNote });
    setSysChecks(sysChecks.map(c => c.id === id ? { ...c, valid: true } : c));
    setEditingOverride(null);
    setTempOverrideNote("");
  };

  const isAllSysValid = sysChecks.every(c => c.valid);

  // --- STATE: Admin xác nhận ---
  const [isAdminLocked, setIsAdminLocked] = useState(false);
  const [adminReason, setAdminReason] = useState<'fit' | 'not_fit' | null>(null);
  const [adminReasonNote, setAdminReasonNote] = useState('');

  const [evidenceChecks, setEvidenceChecks] = useState({
    e1: false, e2: false, e3: false, e4: false, e5: false
  });
  const isEvidenceAllChecked = Object.values(evidenceChecks).every(v => v);

  const [matchChecks, setMatchChecks] = useState({
    m1: false, m2: false, m3: false, m4: false, m5: false
  });
  const isMatchAllChecked = Object.values(matchChecks).every(v => v);

  const [cause, setCause] = useState<string>('');
  const [causeNote, setCauseNote] = useState('');

  const isAllAdminValid = 
    adminReason === 'fit' && 
    isEvidenceAllChecked && 
    isMatchAllChecked && 
    cause !== '' && 
    (cause !== 'Lỗi do khách hàng' || causeNote.trim() !== '') &&
    (cause !== 'Lỗi do D\'cor' || causeNote.trim() !== '');

  const canApprove = isAllSysValid && isAllAdminValid;

  const renderCheckbox = (checked: boolean, onChange: (checked: boolean) => void, label: string) => {
    if (!isAdminLocked) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px' }} onClick={() => onChange(!checked)}>
          {checked ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} color="var(--text-muted)" />}
          <span>{label}</span>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: checked ? '#059669' : '#ef4444' }}>
        {checked ? <CheckCircle2 size={18} /> : <X size={18} />} {label}
      </div>
    );
  };

  return (
    <PanelContainer>
      <SectionCard title="Thông tin khách hàng gửi">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mã yêu cầu:</span><span style={{ fontWeight: 600 }}>RET-000125</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Loại yêu cầu:</span><span style={{ fontWeight: 600, color: 'var(--accent)' }}>Trả sản phẩm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Đơn hàng liên quan:</span>
                <Link href="/admin/orders/ORD-001025" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#ORD-001025</Link>
              </div>
              
              <div style={{ flex: 1 }}></div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginTop: 'auto', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--border-color)', borderRadius: '6px' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sofa Luna</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Phân loại: Chân gỗ sồi</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatVND(12900000)}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Số lượng: 1</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>Lý do chính: Sản phẩm bị lỗi</div>
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                "Phần chân ghế bị trầy xước rất nặng và có dấu hiệu nứt gãy khi vừa tháo bao bì. Mình yêu cầu trả hàng."
              </div>
              <div style={{ fontWeight: 600, marginBottom: '12px' }}>Bằng chứng đính kèm (3):</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ width: '60px', height: '60px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <ImageIcon size={20} color="var(--text-muted)" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* I. HỆ THỐNG TỰ ĐỘNG */}
          <SectionCard title="I. Hệ thống tự động kiểm tra">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sysChecks.map(check => (
                <div key={check.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: check.valid ? '#059669' : '#ef4444', fontWeight: 500 }}>
                      {check.valid ? <CheckCircle2 size={18} /> : <X size={18} />} {check.label}
                    </div>
                    {!check.valid && editingOverride !== check.id && (
                      <button onClick={() => setEditingOverride(check.id)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>Điều chỉnh</button>
                    )}
                  </div>
                  {sysOverrides[check.id] && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '30px', fontStyle: 'italic' }}>
                      ↳ Lý do điều chỉnh: {sysOverrides[check.id]}
                    </div>
                  )}
                  {editingOverride === check.id && (
                    <div style={{ marginLeft: '30px', marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="admin-input" 
                        placeholder="Nhập lý do điều chỉnh (Bắt buộc)..." 
                        value={tempOverrideNote}
                        onChange={e => setTempOverrideNote(e.target.value)}
                        style={{ flex: 1, padding: '8px' }}
                      />
                      <button className="admin-btn admin-btn-primary" onClick={() => handleSaveOverride(check.id)} disabled={!tempOverrideNote.trim()}>Lưu</button>
                      <button className="admin-btn admin-btn-secondary" onClick={() => { setEditingOverride(null); setTempOverrideNote(""); }}>Hủy</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* II. ADMIN XÁC NHẬN */}
          <SectionCard title="II. Admin kiểm tra & Xác nhận">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Lý do */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>1. Lý do đổi/trả có phù hợp chính sách?</div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="radio" name="reason" style={{ accentColor: 'var(--accent)' }} checked={adminReason === 'fit'} onChange={() => setAdminReason('fit')} /> Có, phù hợp
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input type="radio" name="reason" style={{ accentColor: 'var(--accent)' }} checked={adminReason === 'not_fit'} onChange={() => setAdminReason('not_fit')} /> Không phù hợp
                  </label>
                </div>
                {adminReason === 'not_fit' && (
                  <textarea 
                    className="admin-input" 
                    placeholder="Nhập lý do không phù hợp (Bắt buộc)..." 
                    value={adminReasonNote}
                    onChange={e => setAdminReasonNote(e.target.value)}
                    style={{ marginTop: '12px', minHeight: '60px', resize: 'none' }} 
                  />
                )}
              </div>

              {/* Bằng chứng */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>2. Bằng chứng khách hàng cung cấp</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                  {[
                    { id: 'e1', label: 'Hình ảnh/video rõ ràng' },
                    { id: 'e2', label: 'Có thể xác định được sản phẩm' },
                    { id: 'e3', label: 'Thể hiện rõ vấn đề khách phản ánh' },
                    { id: 'e4', label: 'Bằng chứng phù hợp với lý do đổi/trả' },
                    { id: 'e5', label: 'Không có dấu hiệu cho thấy lỗi do khách sử dụng' },
                  ].map(item => (
                    <div key={item.id}>
                      {renderCheckbox(evidenceChecks[item.id as keyof typeof evidenceChecks], (c) => setEvidenceChecks({...evidenceChecks, [item.id]: c}), item.label)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Đối chiếu SP */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>3. Đối chiếu sản phẩm qua bằng chứng</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                  {[
                    { id: 'm1', label: 'Đúng mẫu sản phẩm' },
                    { id: 'm2', label: 'Đúng màu/phiên bản' },
                    { id: 'm3', label: 'Đúng kích thước/biến thể đã đặt' },
                    { id: 'm4', label: 'Sản phẩm trong ảnh khớp với sản phẩm trong đơn hàng' },
                    { id: 'm5', label: 'Số lượng trong yêu cầu khớp với sản phẩm được phản ánh' },
                  ].map(item => (
                    <div key={item.id}>
                      {renderCheckbox(matchChecks[item.id as keyof typeof matchChecks], (c) => setMatchChecks({...matchChecks, [item.id]: c}), item.label)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nguyên nhân */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>4. Đánh giá nguyên nhân</div>
                <CustomSelect
                  value={cause}
                  onChange={(val: string) => setCause(val)}
                  disabled={isAdminLocked}
                  placeholder="-- Chọn nguyên nhân --"
                  dropUp
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Lỗi sản xuất', value: 'Lỗi sản xuất' },
                    { label: 'Hư hỏng trong quá trình vận chuyển', value: 'Hư hỏng trong quá trình vận chuyển' },
                    { label: 'Giao sai sản phẩm', value: 'Giao sai sản phẩm' },
                    { label: 'Sai màu/kích thước/phiên bản', value: 'Sai màu/kích thước/phiên bản' },
                    { label: 'Thiếu phụ kiện', value: 'Thiếu phụ kiện' },
                    { label: 'Không đúng mô tả', value: 'Không đúng mô tả' },
                    { label: 'Lỗi do khách hàng', value: 'Lỗi do khách hàng' },
                    { label: 'Lỗi do D\'cor (Yêu cầu bằng chứng/ghi chú nội bộ)', value: 'Lỗi do D\'cor' },
                    { label: 'Chưa đủ thông tin để xác định (Yêu cầu bổ sung thông tin)', value: 'Chưa đủ thông tin để xác định' },
                  ]}
                />
                {(cause === 'Lỗi do khách hàng' || cause === "Lỗi do D'cor") && (
                  <textarea 
                    className="admin-input" 
                    placeholder={cause === 'Lỗi do khách hàng' ? "Nhập chi tiết lỗi do khách hàng (Bắt buộc)..." : "Nhập chi tiết lỗi do bộ phận nào (Kho, CSKH, Đóng gói) và mã nhân viên (Bắt buộc)..."} 
                    value={causeNote}
                    onChange={e => setCauseNote(e.target.value)}
                    readOnly={isAdminLocked}
                    style={{ marginTop: '12px', minHeight: '60px', resize: 'none' }} 
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className={`admin-btn ${isAdminLocked ? 'admin-btn-secondary' : 'admin-btn-primary'}`} onClick={() => setIsAdminLocked(!isAdminLocked)}>
                  {isAdminLocked ? 'Sửa đánh giá' : 'Lưu đánh giá'}
                </button>
              </div>

            </div>
          </SectionCard>
        </div>

        {/* CỘT PHẢI: TỔNG KẾT & QUYẾT ĐỊNH */}
        <div style={{ position: 'sticky', top: '24px', height: 'max-content' }}>
          <SectionCard title="Kết luận trước khi duyệt">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>HỆ THỐNG TỰ ĐỘNG</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isAllSysValid ? '#059669' : '#ef4444', fontSize: '14px', marginBottom: '16px' }}>
                  {isAllSysValid ? <CheckCircle2 size={16} /> : <X size={16} />} 
                  {isAllSysValid ? 'Toàn bộ hợp lệ' : 'Phát hiện điều kiện không đạt'}
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>ADMIN XÁC NHẬN</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: adminReason === 'fit' ? '#059669' : adminReason === 'not_fit' ? '#ef4444' : 'var(--text-muted)', fontSize: '13px' }}>
                    {adminReason === 'fit' ? <CheckCircle2 size={14} /> : adminReason === 'not_fit' ? <X size={14} /> : <div style={{width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor'}}></div>} Lý do phù hợp
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isEvidenceAllChecked ? '#059669' : 'var(--text-muted)', fontSize: '13px' }}>
                    {isEvidenceAllChecked ? <CheckCircle2 size={14} /> : <div style={{width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor'}}></div>} Bằng chứng hợp lệ
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMatchAllChecked ? '#059669' : 'var(--text-muted)', fontSize: '13px' }}>
                    {isMatchAllChecked ? <CheckCircle2 size={14} /> : <div style={{width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor'}}></div>} Đối chiếu sản phẩm khớp
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: cause !== '' && (cause !== 'Lỗi do khách hàng' || causeNote.trim() !== '') && (cause !== 'Lỗi do D\'cor' || causeNote.trim() !== '') ? '#059669' : 'var(--text-muted)', fontSize: '13px' }}>
                    {cause !== '' && (cause !== 'Lỗi do khách hàng' || causeNote.trim() !== '') && (cause !== 'Lỗi do D\'cor' || causeNote.trim() !== '') ? <CheckCircle2 size={14} /> : <div style={{width: 14, height: 14, borderRadius: '50%', border: '1px solid currentColor'}}></div>} Đánh giá nguyên nhân
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border-color)', marginTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Gợi ý xử lý:</span>
                <span style={{ 
fontWeight: 700, 
                  fontSize: '14px',
                  color: canApprove ? '#059669' : adminReason === 'not_fit' || (cause === 'Lỗi do khách hàng' && causeNote.trim() !== '') || (cause === 'Lỗi do D\'cor' && causeNote.trim() !== '') ? '#ef4444' : '#d97706' 
                }}>
                  {canApprove ? 'Duyệt yêu cầu' : adminReason === 'not_fit' || (cause === 'Lỗi do khách hàng' && causeNote.trim() !== '') || (cause === 'Lỗi do D\'cor' && causeNote.trim() !== '') ? 'Từ chối yêu cầu' : 'Chưa hoàn tất kiểm tra'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <button className={`admin-btn ${canApprove ? 'admin-btn-primary' : 'admin-btn-secondary'}`} disabled={!canApprove} style={{ width: '100%' }}>
                  Duyệt yêu cầu
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="admin-btn admin-btn-danger" style={{ flex: 1 }}>
                    Từ chối
                  </button>
                  <button className="admin-btn admin-btn-secondary" style={{ flex: 1 }}>
                    Yêu cầu bổ sung thông tin
                  </button>
                </div>
              </div>

            </div>
          </SectionCard>
        </div>
      </div>
    </PanelContainer>
  );
};

// BƯỚC 2: ĐỢI HOÀN TRẢ HÀNG
// BƯỚC 2: ĐỢI HOÀN TRẢ HÀNG
const Step2_WaitReturn = () => {
  const [returnStatus, setReturnStatus] = useState<string>('Chưa gửi');
  const [carrier, setCarrier] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [sentDate, setSentDate] = useState('');
  const [eta, setEta] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [showReminderForm, setShowReminderForm] = useState(false);

  const returnAddress = {
    name: "Kho D'cor Studio – HCM",
    address: "123 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP. HCM",
    phone: "028 3456 7890",
    note: "Ghi rõ MÃ YÊU CẦU RET-000125 lên thùng hàng khi gửi."
  };

  const statusSteps = ['Chưa gửi', 'Đã gửi', 'Đang vận chuyển', 'Đã giao đến kho'];
  const currentStatusIdx = statusSteps.indexOf(returnStatus);
  const canConfirmReceived = trackingCode.trim() !== '' && returnStatus === 'Đang vận chuyển';

  const handleCarrierChange = (val: string) => {
    setCarrier(val);
    if (val && val !== 'other') {
      // Tự động tạo mã vận đơn
      const prefix = val.substring(0, 4).toUpperCase();
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      setTrackingCode(`${prefix}-${randomCode}`);
      
      // Tự động set ngày gửi là hôm nay
      const today = new Date().toISOString().split('T')[0];
      setSentDate(today);

      // Tự động set ngày nhận (3 ngày sau)
      const etaDate = new Date();
      etaDate.setDate(etaDate.getDate() + 3);
      setEta(etaDate.toISOString().split('T')[0]);
    }
  };

  return (
    <PanelContainer>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Thông tin yêu cầu */}
        <SectionCard title="Thông tin yêu cầu">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mã yêu cầu đổi trả:</span>
              <span style={{ fontWeight: 600 }}>RET-000125</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mã đơn hàng:</span>
              <Link href="/admin/orders/DCOR-ORD-001" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>DCOR-ORD-001</Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ngày duyệt yêu cầu:</span>
              <span>01/09/2026 14:30</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Loại yêu cầu:</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Đổi hàng</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Lý do đổi trả:</span>
              <span>Sản phẩm bị lỗi kỹ thuật</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hạn chót hoàn trả:</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>08/09/2026</span>
            </div>
          </div>
        </SectionCard>

        {/* Lịch sử xử lý */}
        <SectionCard title="Lịch sử xử lý">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', marginTop: '6px' }} />
              <div>
                <div style={{ fontWeight: 500 }}>Admin đã duyệt yêu cầu đổi trả</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>01/09/2026 14:30</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-color)', marginTop: '6px' }} />
              <div>
                <div style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Chờ tạo vận đơn...</div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Sản phẩm cần hoàn trả */}
      <SectionCard title="Sản phẩm cần hoàn trả">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>Sản phẩm</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>Phân loại</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Đã mua</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Yêu cầu</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Đã nhận</th>
                <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Còn chờ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={20} color="var(--text-muted)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>Sofa Indivi 2,5 chỗ</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>SKU: SF-IND-01</div>
                  </div>
                </td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>Chân gỗ sồi, vải nỉ Copenhagen nâu</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>2</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>1</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#059669' }}>0</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#d97706' }}>1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Trạng thái hoàn trả */}
      <SectionCard title="Trạng thái giao nhận">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          {statusSteps.map((step, idx) => (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: idx <= currentStatusIdx ? '#059669' : 'var(--bg-secondary)',
                  color: idx <= currentStatusIdx ? 'white' : 'var(--text-muted)',
                  border: idx === currentStatusIdx ? '3px solid #d1fae5' : 'none',
                  fontSize: '13px', fontWeight: 700
                }}>
                  {idx < currentStatusIdx ? <Check size={16} /> : idx + 1}
                </div>
                <span style={{ fontSize: '12px', fontWeight: idx === currentStatusIdx ? 700 : 400, color: idx <= currentStatusIdx ? 'var(--text-primary)' : 'var(--text-muted)', textAlign: 'center', maxWidth: '100px' }}>{step}</span>
              </div>
              {idx < statusSteps.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: idx < currentStatusIdx ? '#059669' : 'var(--border-color)', margin: '0 8px', marginBottom: '20px' }} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>CẬP NHẬT THỦ CÔNG (Chưa tích hợp vận chuyển)</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {statusSteps.map(step => (
              <button key={step} onClick={() => setReturnStatus(step)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  background: returnStatus === step ? 'var(--accent)' : 'var(--bg-primary)',
                  color: returnStatus === step ? 'white' : 'var(--text-secondary)',
                  border: returnStatus === step ? '1px solid var(--accent)' : '1px solid var(--border-color)'
                }}>
                {step}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Thông tin vận chuyển & Địa chỉ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        <SectionCard title="Thông tin vận đơn">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Đơn vị vận chuyển</label>
              <CustomSelect value={carrier} onChange={handleCarrierChange} placeholder="-- Chọn đơn vị --"
                options={[
                  { label: 'GHTK', value: 'GHTK' }, { label: 'GHN', value: 'GHN' },
                  { label: 'ViettelPost', value: 'ViettelPost' }, { label: 'VNPost', value: 'VNPost' },
                  { label: 'J&T Express', value: 'JT' }, { label: 'Ninja Van', value: 'NinjaVan' },
                  { label: 'Khác', value: 'other' },
                ]} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Mã vận đơn <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input type="text" className="admin-input" placeholder="VD: VNPO-9912345" value={trackingCode} onChange={e => setTrackingCode(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Ngày khách gửi hàng</label>
                <input type="date" className="admin-input" value={sentDate} onChange={e => setSentDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Ngày dự kiến nhận</label>
                <input type="date" className="admin-input" value={eta} onChange={e => setEta(e.target.value)} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Địa chỉ nhận hàng hoàn trả">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '16px', fontSize: '14px', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>{returnAddress.name}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{returnAddress.address}</div>
              <div style={{ color: 'var(--text-secondary)' }}>SĐT: {returnAddress.phone}</div>
              <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', borderRadius: '6px', fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
                ⚠ {returnAddress.note}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Thao tác */}
      <SectionCard title="Thao tác">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {showReminderForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Nội dung nhắc khách hàng</label>
              <textarea className="admin-input" placeholder="Nhập nội dung nhắc nhở..." value={reminderNote} onChange={e => setReminderNote(e.target.value)} style={{ minHeight: '80px', resize: 'none' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="admin-btn admin-btn-primary" disabled={!reminderNote.trim()}>Gửi nhắc nhở</button>
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowReminderForm(false)}>Hủy</button>
              </div>
            </div>
          ) : (
            <button className="admin-btn admin-btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => setShowReminderForm(true)}>
              Nhắc khách hàng gửi hàng
            </button>
          )}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button className={`admin-btn ${canConfirmReceived ? 'admin-btn-primary' : 'admin-btn-secondary'}`} disabled={!canConfirmReceived} style={{ width: '100%' }}>
              Xác nhận đã nhận hàng → Chuyển sang bước tiếp theo
            </button>
            {!canConfirmReceived && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'center' }}>
                Yêu cầu: Nhập mã vận đơn + trạng thái "Đang vận chuyển"
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </PanelContainer>
  );
};

// BƯỚC 3: ĐÃ NHẬN HÀNG (KHO)
const Step3_InventoryReceived = () => {
  const [actualQty, setActualQty] = useState(1);
  const requestedQty = 1;

  // Checklists
  const [qtyCheck, setQtyCheck] = useState({ enough: false, matchReq: false, noExtra: false });
  const [productCheck, setProductCheck] = useState({ sku: false, model: false, color: false, size: false, variant: false, qty: false });
  const [overallCheck, setOverallCheck] = useState({ intact: false, noNewDamage: false, noRepair: false, noMod: false, matchDesc: false });
  const [reasonCheck, setReasonCheck] = useState({ location: false, severity: false, noUserDamage: false, causeMatch: false });
  const [categoryCheck, setCategoryCheck] = useState({ wood1: false, wood2: false, wood3: false, wood4: false, wood5: false });

  // Accessories
  const [accessories, setAccessories] = useState({
    legs: 'Đủ', screws: 'Đủ', manual: 'Đủ'
  });

  const [actualCondition, setActualCondition] = useState('');
  const [damageDesc, setDamageDesc] = useState('');
  const [inspectionResult, setInspectionResult] = useState<string>(''); // 'pass' or 'fail'
  const [failReason, setFailReason] = useState('');

  const renderCheckbox = (checked: boolean, onChange: (val: boolean) => void, label: string) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
      <div onClick={() => onChange(!checked)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
        {checked ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} color="var(--text-muted)" />}
      </div>
      <span style={{ lineHeight: 1.4 }}>{label}</span>
    </label>
  );

  return (
    <PanelContainer>
      {/* Thông tin tiếp nhận */}
      <SectionCard title="Thông tin tiếp nhận">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '13px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mã yêu cầu đổi trả:</span>
              <span style={{ fontWeight: 600 }}>RET-000125</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mã đơn hàng:</span>
              <Link href="/admin/orders/DCOR-ORD-001" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>DCOR-ORD-001</Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ngày nhận hàng:</span>
              <span>08/09/2026 09:15</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Người tiếp nhận:</span>
              <span>Nguyễn Văn A (Thủ kho)</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Kho/Showroom tiếp nhận:</span>
              <span>Kho D'cor Studio – HCM</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Đơn vị vận chuyển:</span>
              <span>VNPost</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Mã vận đơn:</span>
              <span style={{ fontWeight: 600 }}>VNPO-9912345</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Bằng chứng giao nhận:</span>
              <button style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ImageIcon size={14} /> Xem ảnh
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Đối chiếu số lượng & Kiểm tra sản phẩm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SectionCard title="Đối chiếu số lượng">
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Yêu cầu</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{requestedQty}</div>
              </div>
              <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Thực nhận</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>
                  <input type="number" min={0} value={actualQty} onChange={e => setActualQty(Number(e.target.value))} style={{ width: '40px', background: 'transparent', border: 'none', textAlign: 'center', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)', outline: 'none', borderBottom: '1px solid var(--border-color)' }} />
                </div>
              </div>
              <div style={{ flex: 1, background: requestedQty > actualQty ? '#fee2e2' : 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: requestedQty > actualQty ? '#ef4444' : 'var(--text-secondary)', marginBottom: '4px' }}>Còn thiếu</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: requestedQty > actualQty ? '#ef4444' : 'var(--text-primary)' }}>{Math.max(0, requestedQty - actualQty)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {renderCheckbox(qtyCheck.enough, val => setQtyCheck({...qtyCheck, enough: val}), 'Đã nhận đủ số lượng sản phẩm khách yêu cầu hoàn trả')}
              {renderCheckbox(qtyCheck.matchReq, val => setQtyCheck({...qtyCheck, matchReq: val}), 'Số lượng thực tế khớp với số lượng trên yêu cầu đổi trả')}
              {renderCheckbox(qtyCheck.noExtra, val => setQtyCheck({...qtyCheck, noExtra: val}), 'Không có sản phẩm thừa/nhầm sản phẩm')}
            </div>
          </SectionCard>

          <SectionCard title="Kiểm tra đúng sản phẩm">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {renderCheckbox(productCheck.sku, val => setProductCheck({...productCheck, sku: val}), 'Đúng mã sản phẩm/SKU')}
              {renderCheckbox(productCheck.model, val => setProductCheck({...productCheck, model: val}), 'Đúng mẫu sản phẩm')}
              {renderCheckbox(productCheck.color, val => setProductCheck({...productCheck, color: val}), 'Đúng màu sắc')}
              {renderCheckbox(productCheck.size, val => setProductCheck({...productCheck, size: val}), 'Đúng kích thước')}
              {renderCheckbox(productCheck.variant, val => setProductCheck({...productCheck, variant: val}), 'Đúng phiên bản/cấu hình')}
              {renderCheckbox(productCheck.qty, val => setProductCheck({...productCheck, qty: val}), 'Đúng số lượng')}
            </div>
          </SectionCard>
        </div>

        {/* Kiểm tra tình trạng sản phẩm */}
        <SectionCard title="Kiểm tra tình trạng sản phẩm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>Tình trạng tổng thể</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {renderCheckbox(overallCheck.intact, val => setOverallCheck({...overallCheck, intact: val}), 'Sản phẩm còn nguyên vẹn')}
                {renderCheckbox(overallCheck.noNewDamage, val => setOverallCheck({...overallCheck, noNewDamage: val}), 'Không có hư hỏng phát sinh thêm')}
                {renderCheckbox(overallCheck.noRepair, val => setOverallCheck({...overallCheck, noRepair: val}), 'Không có dấu hiệu tự ý sửa chữa')}
                {renderCheckbox(overallCheck.noMod, val => setOverallCheck({...overallCheck, noMod: val}), 'Không có dấu hiệu thay đổi cấu tạo sản phẩm')}
                {renderCheckbox(overallCheck.matchDesc, val => setOverallCheck({...overallCheck, matchDesc: val}), 'Sản phẩm phù hợp với tình trạng được khách mô tả trong yêu cầu')}
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>Đối chiếu với lý do: "Sản phẩm bị lỗi kỹ thuật"</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {renderCheckbox(reasonCheck.location, val => setReasonCheck({...reasonCheck, location: val}), 'Có đúng vị trí bị lỗi như khách mô tả')}
                {renderCheckbox(reasonCheck.severity, val => setReasonCheck({...reasonCheck, severity: val}), 'Mức độ hư hỏng phù hợp với hình ảnh/bằng chứng ban đầu')}
                {renderCheckbox(reasonCheck.noUserDamage, val => setReasonCheck({...reasonCheck, noUserDamage: val}), 'Không phát sinh thêm hư hỏng do quá trình khách sử dụng')}
                {renderCheckbox(reasonCheck.causeMatch, val => setReasonCheck({...reasonCheck, causeMatch: val}), 'Nguyên nhân được xác định phù hợp với yêu cầu ban đầu')}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>Kiểm tra chi tiết (Nội thất gỗ / Sofa)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {renderCheckbox(categoryCheck.wood1, val => setCategoryCheck({...categoryCheck, wood1: val}), 'Không nứt/gãy, rách/thủng')}
                {renderCheckbox(categoryCheck.wood2, val => setCategoryCheck({...categoryCheck, wood2: val}), 'Không cong/vênh/biến dạng bất thường')}
                {renderCheckbox(categoryCheck.wood3, val => setCategoryCheck({...categoryCheck, wood3: val}), 'Không bong/tróc bề mặt, vết bẩn bất thường')}
                {renderCheckbox(categoryCheck.wood4, val => setCategoryCheck({...categoryCheck, wood4: val}), 'Khung sản phẩm và các mối nối còn nguyên vẹn')}
                {renderCheckbox(categoryCheck.wood5, val => setCategoryCheck({...categoryCheck, wood5: val}), 'Chất liệu/vải/da đúng với sản phẩm ban đầu')}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Kiểm tra phụ kiện */}
        <SectionCard title="Kiểm tra phụ kiện">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'legs', label: 'Chân sản phẩm' },
              { id: 'screws', label: 'Ốc vít/bộ lắp đặt' },
              { id: 'manual', label: 'Tài liệu/hướng dẫn' }
            ].map(acc => (
              <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{acc.label}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['Đủ', 'Thiếu', 'Hư hỏng'].map(status => (
                    <button key={status} 
                      onClick={() => setAccessories({...accessories, [acc.id]: status})}
                      style={{ 
                        padding: '4px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', border: '1px solid var(--border-color)',
                        background: (accessories as any)[acc.id] === status ? (status === 'Đủ' ? '#059669' : status === 'Thiếu' ? '#d97706' : '#ef4444') : 'var(--bg-primary)',
                        color: (accessories as any)[acc.id] === status ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Ghi nhận thực tế */}
        <SectionCard title="Ghi nhận tình trạng thực tế">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tình trạng thực tế (Bắt buộc) <span style={{ color: '#ef4444' }}>*</span></label>
              <textarea className="admin-input" placeholder="Mô tả ngắn gọn tình trạng thực tế..." value={actualCondition} onChange={e => setActualCondition(e.target.value)} style={{ minHeight: '60px', resize: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Mô tả hư hỏng/phát sinh (Nếu có)</label>
              <textarea className="admin-input" placeholder="Chi tiết các vết xước, lỗi..." value={damageDesc} onChange={e => setDamageDesc(e.target.value)} style={{ minHeight: '60px', resize: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Hình ảnh/Video bằng chứng</label>
              <button style={{ width: '100%', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={24} />
                <span style={{ fontSize: '13px' }}>Click để tải lên hình ảnh/video</span>
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Kết quả kiểm tra */}
      <SectionCard title="Kết quả kiểm tra & Xử lý tiếp theo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setInspectionResult('pass')}
              style={{ flex: 1, padding: '16px', borderRadius: '8px', border: inspectionResult === 'pass' ? '2px solid #059669' : '1px solid var(--border-color)', background: inspectionResult === 'pass' ? '#d1fae5' : 'var(--bg-primary)', color: inspectionResult === 'pass' ? '#059669' : 'var(--text-primary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Đạt yêu cầu</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Đủ điều kiện Hoàn tiền/Đổi hàng</div>
            </button>
            <button 
              onClick={() => setInspectionResult('fail')}
              style={{ flex: 1, padding: '16px', borderRadius: '8px', border: inspectionResult === 'fail' ? '2px solid #ef4444' : '1px solid var(--border-color)', background: inspectionResult === 'fail' ? '#fee2e2' : 'var(--bg-primary)', color: inspectionResult === 'fail' ? '#ef4444' : 'var(--text-primary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              <div style={{ fontSize: '16px', fontWeight: 700 }}>Không đạt yêu cầu</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>Phát sinh vấn đề cần xử lý</div>
            </button>
          </div>

          {inspectionResult === 'fail' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Lý do không đạt & Đề xuất phương án <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea className="admin-input" placeholder="VD: Khách làm rách vải sofa, đề xuất từ chối hoàn trả..." value={failReason} onChange={e => setFailReason(e.target.value)} style={{ minHeight: '80px', resize: 'none' }} />
              </div>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            {inspectionResult === 'pass' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Yêu cầu này là "Đổi hàng". Chuyển sang bước kế toán và xuất kho đổi hàng.</div>
                <button className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '12px', fontSize: '14px' }}>
                  Xác nhận đổi sản phẩm
                </button>
              </div>
            )}
            
            {inspectionResult === 'fail' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="admin-btn admin-btn-danger" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
                  Từ chối hoàn trả
                </button>
                <button className="admin-btn admin-btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '14px' }}>
                  Yêu cầu xử lý bổ sung
                </button>
              </div>
            )}

            {!inspectionResult && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '16px' }}>
                Vui lòng chọn Kết quả kiểm tra để xem các thao tác tiếp theo.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

    </PanelContainer>
  );
};

// BƯỚC 4: HOÀN TIỀN
const Step4_RefundOrExchange = () => (
  <PanelContainer>
    <SectionCard title="Xử lý Hoàn tiền (Kế toán)">
      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
        Ghi chú: Vui lòng đối chiếu mã tham chiếu và số tiền trước khi thực hiện thao tác hoàn tiền trên cổng thanh toán.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Số tiền duyệt hoàn trả</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatVND(12900000)}</div>
          </div>
          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Phương thức hoàn tiền</label>
            <select className="admin-select" disabled>
              <option>Trả về thẻ tín dụng ban đầu</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Mã tham chiếu thanh toán gốc</label>
            <input type="text" className="admin-input" readOnly value="ORD-001025-PAY" />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 'auto' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Mã giao dịch hoàn (Txn ID)</label>
              <input type="text" className="admin-input" readOnly value="TXN-9981223" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Ghi chú hoàn tiền</label>
              <textarea className="admin-input" readOnly value="Đã hoàn thành công qua cổng thanh toán." style={{ resize: 'none', minHeight: '80px', lineHeight: 1.5 }} />
            </div>
          </div>
          <div style={{ padding: '14px', background: '#d1fae5', color: '#059669', borderRadius: '8px', fontWeight: 600, textAlign: 'center', fontSize: '15px', border: '1px solid #a7f3d0', marginBottom: '16px' }}>
            Đã hoàn tất thanh toán
          </div>
          <button className="admin-btn admin-btn-primary" disabled style={{ width: '100%' }}>
            Xác nhận Hoàn tất
          </button>
        </div>
      </div>
    </SectionCard>
  </PanelContainer>
);

// BƯỚC 5: HOÀN TẤT
const Step5_Completed = ({ returnId }: { returnId: string }) => (
  <PanelContainer>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '700px', background: 'var(--bg-primary)', padding: '48px', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle2 size={40} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>Yêu cầu {returnId} đã hoàn tất</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '40px', lineHeight: 1.6 }}>
          Quy trình xử lý trả hàng và hoàn tiền đã kết thúc thành công vào lúc 14:30, ngày 03/09/2026. Khách hàng đã được gửi Email thông báo tự động từ hệ thống.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Đơn hàng gốc</div>
            <Link href="/admin/orders/ORD-001025" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>#ORD-001025</Link>
          </div>
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tổng tiền hoàn</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#059669' }}>{formatVND(12900000)}</div>
          </div>
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Mã GD Hoàn tiền</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>TXN-9981223</div>
          </div>
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Mã Phiếu thu hồi (Kho)</div>
            <Link href="/admin/inventory/history" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>INV-000892</Link>
          </div>
        </div>
      </div>
    </div>
  </PanelContainer>
);
