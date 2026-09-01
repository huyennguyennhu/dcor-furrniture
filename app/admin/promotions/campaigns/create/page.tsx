'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, Image as ImageIcon, Percent, DollarSign, Tag, CheckCircle2, Square, CheckSquare, Plus, Trash2 } from 'lucide-react';
import CustomSelect from '@/components/admin/CustomSelect';
import Link from 'next/link';

const InteractiveCheckbox = ({ initialChecked = false, label, sku }: { initialChecked?: boolean, label: string, sku?: string }) => {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setChecked(!checked)}>
      {checked ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} color="var(--text-muted)" />} 
      {label} {sku && <span style={{ color: 'var(--text-muted)' }}>({sku})</span>}
    </div>
  );
};

export default function CreateCampaignPage() {
  const [discountType, setDiscountType] = useState('PERCENT'); 
  const [targetType, setTargetType] = useState('ALL');
  const [categoryRows, setCategoryRows] = useState([{ id: 1, type: 'FURNITURE', category: 'SOFA' }]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val) {
      e.target.value = new Intl.NumberFormat('vi-VN').format(Number(val));
    } else {
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin/promotions/campaigns" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0' }}>Tạo chiến dịch mới</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Cấu hình giảm giá tự động hàng loạt cho sản phẩm.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="admin-btn admin-btn-secondary">Lưu nháp</button>
          <button className="admin-btn admin-btn-primary">
            <Save size={16} /> Bắt đầu chiến dịch
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* LEFT COLUMN: MAIN CONFIG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Thông tin cơ bản */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>1. Thông tin cơ bản</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tên chiến dịch <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="text" className="admin-input" placeholder="VD: Black Friday - Giảm đến 50% Toàn Bộ Giường" style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Mô tả ngắn</label>
              <textarea className="admin-input" rows={3} style={{ width: '100%', resize: 'none' }} placeholder="Nhập mô tả chiến dịch để dễ dàng quản lý..."></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Thời gian bắt đầu <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="datetime-local" className="admin-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Thời gian kết thúc</label>
                <input type="datetime-local" className="admin-input" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Hình ảnh / Banner chiến dịch</label>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                <ImageIcon size={32} color="var(--text-muted)" />
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Kéo thả hoặc nhấn để tải ảnh lên</div>
              </div>
            </div>
          </div>

          {/* Phạm vi sản phẩm */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>2. Phạm vi sản phẩm</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Áp dụng cho <span style={{ color: '#ef4444' }}>*</span></label>
              <CustomSelect 
                style={{ width: '100%' }}
                value={targetType}
                onChange={(val) => setTargetType(val)}
                options={[
                  { value: 'ALL', label: 'Toàn bộ sản phẩm' },
                  { value: 'CATEGORY', label: 'Theo Danh mục (Category)' },
                  { value: 'COLLECTION', label: 'Theo Bộ sưu tập (Collection)' },
                  { value: 'CUSTOM', label: 'Chọn sản phẩm thủ công' }
                ]}
              />
            </div>

            {targetType === 'CATEGORY' && (
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: '16px', alignItems: 'end' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Chọn loại danh mục</label>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Chọn Danh mục</label>
                  <div></div>
                </div>

                {categoryRows.map((row, index) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 32px', gap: '16px', alignItems: 'center' }}>
                    <CustomSelect 
                      style={{ width: '100%' }}
                      value={row.type}
                      placeholder="-- Chọn Loại Danh mục --"
                      onChange={(val) => {
                        const newRows = [...categoryRows];
                        newRows[index].type = val;
                        // reset child category when parent changes
                        newRows[index].category = '';
                        setCategoryRows(newRows);
                      }}
                      options={[
                        { value: 'FURNITURE', label: 'Nội thất (Furniture)' },
                        { value: 'DECOR', label: 'Trang trí (Decor)' },
                        { value: 'LIGHTING', label: 'Đèn & Chiếu sáng' }
                      ]}
                    />
                    
                    <CustomSelect 
                      style={{ width: '100%' }}
                      value={row.category}
                      placeholder={row.type ? "-- Chọn Danh mục --" : "Vui lòng chọn Loại danh mục trước"}
                      disabled={!row.type}
                      onChange={(val) => {
                        const newRows = [...categoryRows];
                        newRows[index].category = val;
                        setCategoryRows(newRows);
                      }}
                      options={
                        row.type === 'FURNITURE' ? [
                          { value: 'SOFA', label: 'Sofa & Ghế bành' },
                          { value: 'TABLE', label: 'Bàn trà & Bàn góc' },
                          { value: 'BED', label: 'Giường ngủ' }
                        ] : row.type === 'DECOR' ? [
                          { value: 'MIRROR', label: 'Gương trang trí' },
                          { value: 'RUG', label: 'Thảm trải sàn' }
                        ] : row.type === 'LIGHTING' ? [
                          { value: 'PENDANT', label: 'Đèn thả trần' },
                          { value: 'FLOOR', label: 'Đèn cây' }
                        ] : []
                      }
                    />

                    <button 
                      onClick={() => setCategoryRows(categoryRows.filter((_, i) => i !== index))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={() => setCategoryRows([...categoryRows, { id: Date.now(), type: '', category: '' }])}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0, width: 'fit-content', marginTop: '8px' }}
                >
                  <Plus size={16} /> Chọn thêm danh mục
                </button>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <CheckCircle2 size={12} color="#059669" /> Đã thêm {categoryRows.filter(r => r.category).length} danh mục (Khoảng 120 sản phẩm).
                </div>
              </div>
            )}

            {targetType === 'COLLECTION' && (
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Chọn Bộ Sưu Tập (Có thể chọn nhiều)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                  <InteractiveCheckbox initialChecked={true} label="Living Room Collection 2026" />
                  <InteractiveCheckbox initialChecked={true} label="Bắc Âu Minimalist" />
                  <InteractiveCheckbox label="Mùa Thu Ấm Áp 2026" />
                  <InteractiveCheckbox label="Bộ sưu tập Đèn chùm Cổ điển" />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} color="#059669" /> Đã chọn 2 bộ sưu tập (Tổng cộng 45 sản phẩm).
                </div>
              </div>
            )}

            {targetType === 'CUSTOM' && (
              <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Tìm & Chọn Sản Phẩm Khuyến Mãi</label>
                  <input type="text" className="admin-input" placeholder="Nhập tên hoặc SKU sản phẩm..." style={{ width: '100%', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px' }}>
                    <InteractiveCheckbox initialChecked={true} label="Sofa Góc Chữ L Gỗ Sồi" sku="SKU: SF-L-01" />
                    <InteractiveCheckbox initialChecked={true} label="Bàn Trà Kính Tròn Khung Sắt" sku="SKU: BT-K-02" />
                    <InteractiveCheckbox label="Ghế Đọc Sách Thư Giãn" sku="SKU: CH-R-05" />
                    <InteractiveCheckbox label="Tủ Bếp Gỗ Óc Chó" sku="SKU: TB-W-10" />
                    <InteractiveCheckbox label="Giường Ngủ King Size Bọc Da" sku="SKU: BD-K-22" />
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} color="#059669" /> Đã chọn thủ công 2 sản phẩm.
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Loại trừ (Không bắt buộc)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <InteractiveCheckbox label="Không áp dụng cho sản phẩm đang nằm trong Khuyến mãi khác" />
                <InteractiveCheckbox label="Loại trừ sản phẩm đặt riêng (Custom Order)" />
              </div>
            </div>
          </div>

          {/* Hình thức ưu đãi */}
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>3. Cấu hình ưu đãi</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              {[
                { id: 'PERCENT', label: 'Giảm theo %', icon: <Percent size={18} /> },
                { id: 'FIXED', label: 'Giảm số tiền', icon: <DollarSign size={18} /> },
                { id: 'SPECIAL', label: 'Giá bán đặc biệt', icon: <Tag size={18} /> }
              ].map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setDiscountType(t.id)}
                  style={{ 
                    border: discountType === t.id ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                    background: discountType === t.id ? 'rgba(188, 95, 19, 0.05)' : 'var(--bg-secondary)',
                    padding: '16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' 
                  }}
                >
                  <div style={{ color: discountType === t.id ? 'var(--accent)' : 'var(--text-muted)' }}>{t.icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: discountType === t.id ? 'var(--accent)' : 'var(--text-secondary)' }}>{t.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {discountType === 'PERCENT' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Phần trăm giảm (%) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="number" className="admin-input" placeholder="VD: 20" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Mức giảm tối đa (VNĐ)</label>
                    <input type="text" className="admin-input" placeholder="Không giới hạn" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                  </div>
                </>
              )}
              {discountType === 'FIXED' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Số tiền giảm (VNĐ) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" className="admin-input" placeholder="VD: 500.000" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                </div>
              )}
              {discountType === 'SPECIAL' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Đồng giá (VNĐ) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" className="admin-input" placeholder="VD: 9.999.000" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Toàn bộ sản phẩm được áp dụng sẽ chuyển về mức giá đặc biệt này.</div>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: LIMITS & SETTINGS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>4. Giới hạn chiến dịch</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Ngân sách khuyến mãi tối đa</label>
              <input type="text" className="admin-input" placeholder="VD: 50.000.000 (Để trống nếu không giới hạn)" style={{ width: '100%' }} onChange={handleCurrencyChange} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Số lượt áp dụng tối đa (Toàn hệ thống)</label>
              <input type="number" className="admin-input" placeholder="VD: 1000" style={{ width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Giới hạn mỗi khách hàng</label>
              <CustomSelect 
                style={{ width: '100%' }}
                value="NONE"
                onChange={() => {}}
                options={[
                  { value: 'NONE', label: 'Không giới hạn' },
                  { value: '1', label: '1 lần' },
                  { value: '2', label: '2 lần' }
                ]}
              />
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>5. Điều kiện áp dụng</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Giá trị đơn hàng tối thiểu</label>
              <input type="text" className="admin-input" placeholder="VD: 10.000.000" style={{ width: '100%' }} onChange={handleCurrencyChange} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Quy tắc kết hợp khuyến mãi</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <InteractiveCheckbox initialChecked={true} label="Cho phép khách hàng áp dụng chung với Mã giảm giá (Vouchers)" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Cơ chế ưu tiên</label>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                Nếu 1 sản phẩm thuộc nhiều chiến dịch, hệ thống sẽ ưu tiên chiến dịch có mức giảm cao nhất.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
