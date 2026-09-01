'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import CustomSelect from '@/components/admin/CustomSelect';

interface TransactionModalProps {
  isOpen: boolean;
  type: 'import' | 'export';
  products: any[];
  initialProductId?: string;
  initialVariantId?: string;
  isProductFixed?: boolean;
  isVariantFixed?: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

interface LineItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: string;
  price: string;
  isProductFixed: boolean;
  isVariantFixed: boolean;
}

// Mock variants based on productId for demonstration
const mockGetVariants = (productId: string) => {
  if (!productId) return [];
  return [
    { id: 'v1', name: 'Màu Trắng, Gỗ sồi' },
    { id: 'v2', name: 'Màu Đen, Khung thép' },
    { id: 'v3', name: 'Màu Xám, Bọc da' },
    { id: 'v4', name: 'Màu Xanh, Khung thép' },
  ];
};

export default function TransactionModal({
  isOpen,
  type,
  products,
  initialProductId = '',
  initialVariantId = '',
  isProductFixed = false,
  isVariantFixed = false,
  onClose,
  onSubmit
}: TransactionModalProps) {
  
  const [transactionLocation, setTransactionLocation] = useState('');
  const [transactionReason, setTransactionReason] = useState('');
  const [transactionDestination, setTransactionDestination] = useState('');
  const [transactionNote, setTransactionNote] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setLineItems([{
        id: Date.now().toString(),
        productId: initialProductId,
        variantId: initialVariantId,
        quantity: '',
        price: '',
        isProductFixed: isProductFixed,
        isVariantFixed: isVariantFixed,
      }]);
      setTransactionLocation('');
      setTransactionReason('');
      setTransactionDestination('');
      setTransactionNote('');
    }
  }, [isOpen, initialProductId, initialVariantId, isProductFixed, isVariantFixed]);

  if (!isOpen) return null;

  const handleAddLineItem = () => {
    setLineItems([...lineItems, {
      id: Date.now().toString() + Math.random(),
      productId: '',
      variantId: '',
      quantity: '',
      price: '',
      isProductFixed: false,
      isVariantFixed: false,
    }]);
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) return; // Prevent removing the last item
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        if (field === 'productId') {
          return { ...item, productId: value, variantId: '' }; // Reset variant when product changes
        }
        if (field === 'price') {
          let rawValue = value.replace(/[^0-9]/g, '');
          const num = parseInt(rawValue, 10);
          const formatted = rawValue ? new Intl.NumberFormat('vi-VN').format(num) : '';
          return { ...item, price: formatted };
        }
        if (field === 'quantity') {
          // Prevent negative numbers and dots
          let rawValue = value.replace(/[^0-9]/g, '');
          // Optional: You can enforce a minimum of 1 if you want to automatically correct 0.
          // For now, let's just strip out any negative signs.
          return { ...item, quantity: rawValue };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!transactionLocation) return alert('Vui lòng chọn chi nhánh/kho');
    if (type === 'export' && !transactionReason) return alert('Vui lòng chọn lý do xuất');
    
    const invalidItems = lineItems.filter(item => !item.productId || !item.variantId || !item.quantity);
    if (invalidItems.length > 0) {
      return alert('Vui lòng điền đầy đủ thông tin Sản phẩm, Biến thể và Số lượng cho tất cả các dòng.');
    }

    if (onSubmit) {
      onSubmit({
        type,
        location: transactionLocation,
        reason: transactionReason,
        destination: transactionDestination,
        note: transactionNote,
        items: lineItems.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        }))
      });
    } else {
      alert('Tính năng đang phát triển');
      onClose();
    }
  };

  const gridColumns = type === 'import' ? '2.5fr 2fr 1fr 1.5fr 40px' : '2.5fr 2fr 1fr 40px';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', width: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {type === 'import' ? 'Tạo phiếu Nhập kho' : 'Tạo phiếu Xuất kho'}
          </h2>
          <button onClick={onClose} className="admin-close-btn" aria-label="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* General Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chi nhánh / Kho <span style={{ color: '#ef4444' }}>*</span></label>
              <CustomSelect
                options={[
                  { value: 'Kho Tổng', label: 'Kho Tổng (TP.HCM)' },
                  { value: 'Kho HN', label: 'Kho Hà Nội' },
                  { value: 'Q1', label: 'Showroom Quận 1' }
                ]}
                value={transactionLocation}
                onChange={setTransactionLocation}
                placeholder="Chọn chi nhánh"
              />
            </div>

            {type === 'export' ? (
              <div style={{ display: 'grid', gridTemplateColumns: transactionReason === 'Chuyển kho' ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Lý do xuất <span style={{ color: '#ef4444' }}>*</span></label>
                  <CustomSelect
                    options={[
                      { value: 'Chuyển kho', label: 'Chuyển kho' },
                      { value: 'Hư hỏng', label: 'Hư hỏng, thất thoát' },
                      { value: 'Khác', label: 'Khác' }
                    ]}
                    value={transactionReason}
                    onChange={setTransactionReason}
                    placeholder="Chọn lý do"
                  />
                </div>
                {transactionReason === 'Chuyển kho' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chuyển đến <span style={{ color: '#ef4444' }}>*</span></label>
                    <CustomSelect
                      options={[
                        { value: 'Kho Tổng', label: 'Kho Tổng (TP.HCM)' },
                        { value: 'Kho HN', label: 'Kho Hà Nội' },
                        { value: 'Q1', label: 'Showroom Quận 1' }
                      ].filter(opt => opt.value !== transactionLocation)}
                      value={transactionDestination}
                      onChange={setTransactionDestination}
                      placeholder="Chọn kho nhận"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Ghi chú</label>
                <input 
                  type="text"
                  placeholder="Nhập ghi chú cho giao dịch này..." 
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  className="admin-input" 
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
                />
              </div>
            )}
            
            {type === 'export' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Ghi chú</label>
                <input 
                  type="text"
                  placeholder="Nhập ghi chú cho giao dịch này..." 
                  value={transactionNote}
                  onChange={(e) => setTransactionNote(e.target.value)}
                  className="admin-input" 
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }} 
                />
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: 0 }} />

          {/* Line Items Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Danh sách sản phẩm <span style={{ color: '#ef4444' }}>*</span>
            </h3>
            
            {/* Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Sản phẩm</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Biến thể</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Số lượng</div>
              {type === 'import' && <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Đơn giá (₫)</div>}
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Xóa</div>
            </div>

            {/* Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lineItems.map((item, index) => {
                const variants = mockGetVariants(item.productId);
                
                return (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: '12px', alignItems: 'start' }}>
                    
                    {/* Product Selection */}
                    <div>
                      {item.isProductFixed ? (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {products.find(p => p.id === item.productId)?.name || products.find(p => p.id === item.productId)?.productName || 'N/A'}
                        </div>
                      ) : (
                        <CustomSelect 
                          options={products.map(p => ({ value: p.id, label: p.name || p.productName }))}
                          value={item.productId}
                          onChange={(val) => updateLineItem(item.id, 'productId', val)}
                          placeholder="Chọn SP..."
                          searchable
                        />
                      )}
                    </div>

                    {/* Variant Selection */}
                    <div>
                      {item.isVariantFixed ? (
                        <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {variants.find(v => v.name === item.variantId)?.name || item.variantId || 'N/A'}
                        </div>
                      ) : (
                        <CustomSelect 
                          options={variants.map(v => ({ value: v.name, label: v.name }))}
                          value={item.variantId}
                          onChange={(val) => updateLineItem(item.id, 'variantId', val)}
                          placeholder="Chọn biến thể..."
                          disabled={!item.productId}
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <input 
                        type="text" 
                        placeholder="0" 
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                        className="admin-input" 
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', width: '100%' }} 
                      />
                    </div>

                    {/* Price (Import Only) */}
                    {type === 'import' && (
                      <div>
                        <input 
                          type="text" 
                          placeholder="0" 
                          value={item.price}
                          onChange={(e) => updateLineItem(item.id, 'price', e.target.value)}
                          className="admin-input" 
                          style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', width: '100%' }} 
                        />
                      </div>
                    )}

                    {/* Delete Action */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                      <button 
                        onClick={() => handleRemoveLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        style={{ 
                          background: 'none', border: 'none', cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer', 
                          color: lineItems.length === 1 ? 'var(--border-color)' : '#ef4444', 
                          padding: '4px' 
                        }}
                        title={lineItems.length === 1 ? "Không thể xóa dòng duy nhất" : "Xóa dòng này"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Add item button */}
            <div style={{ marginTop: '8px' }}>
              {(() => {
                const canAddNewLine = lineItems.every(item => item.productId && item.variantId);
                return (
                  <button 
                    onClick={handleAddLineItem}
                    disabled={!canAddNewLine}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', 
                      background: 'none', border: '1px dashed var(--accent)', color: 'var(--accent)', 
                      padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, 
                      cursor: canAddNewLine ? 'pointer' : 'not-allowed',
                      opacity: canAddNewLine ? 1 : 0.5
                    }}
                    title={!canAddNewLine ? "Vui lòng chọn Sản phẩm và Biến thể cho các dòng hiện tại trước khi thêm mới" : ""}
                  >
                    <Plus size={16} /> Thêm sản phẩm
                  </button>
                );
              })()}
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-secondary)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <button onClick={onClose} className="admin-btn admin-btn-secondary">Hủy</button>
          <button onClick={handleSubmit} className="admin-btn admin-btn-primary">
            {type === 'import' ? 'Tạo phiếu nhập' : 'Tạo phiếu xuất'}
          </button>
        </div>
      </div>
    </div>
  );
}
