'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Search, Filter, CheckCircle2, FileText, X, Trash2 } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';

const mockProducts = [
  { sku: 'SF-OSA-3-BRW', name: 'Sofa Da Bò Osaka (Băng 3)', variant: 'Nâu', stock: 25 },
  { sku: 'BA-IND-WAL', name: 'Bàn ăn Indochine', variant: 'Gỗ óc chó', stock: 3 },
  { sku: 'TU-QAR-WHI', name: 'Tủ Quần Áo 4 Cánh', variant: 'Trắng', stock: 12 },
  { sku: 'GE-EAM-BLK', name: 'Ghế Eames', variant: 'Đen', stock: 50 },
];

const mockAudits = [
  {
    id: 'ADT-2408-001',
    date: '2024-08-20',
    location: 'Kho Tổng (TP.HCM)',
    creator: 'Trần Văn A',
    totalItems: 2,
    discrepancyItems: 1,
    status: 'Hoàn tất'
  },
  {
    id: 'ADT-2408-002',
    date: '2024-08-22',
    location: 'Showroom Quận 1',
    creator: 'Nguyễn Thị B',
    totalItems: 45,
    discrepancyItems: 0,
    status: 'Hoàn tất'
  },
  {
    id: 'ADT-2408-003',
    date: '2024-08-23',
    location: 'Kho Hà Nội',
    creator: 'Lê Văn C',
    totalItems: 80,
    discrepancyItems: 0,
    status: 'Đang kiểm'
  }
];

interface AuditItem {
  id: string;
  sku: string;
  productName: string;
  variant: string;
  systemStock: number | '';
  actualStock: number | '';
}

export default function InventoryAuditPage() {
  const [data, setData] = useState(mockAudits);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState<boolean | any>(false);
  const [modalLocation, setModalLocation] = useState('Kho Tổng (TP.HCM)');

  const [auditItems, setAuditItems] = useState<AuditItem[]>([
    { id: '1', sku: '', productName: '', variant: '', systemStock: '', actualStock: '' }
  ]);

  // Reset khi mở modal tạo mới
  useEffect(() => {
    if (showModal === true) {
      setAuditItems([{ id: Date.now().toString(), sku: '', productName: '', variant: '', systemStock: '', actualStock: '' }]);
    }
  }, [showModal]);

  const canAddNewLine = auditItems.every(item => item.sku !== '' && item.actualStock !== '');

  const handleAddRow = () => {
    if (canAddNewLine) {
      setAuditItems([...auditItems, { id: Date.now().toString() + Math.random(), sku: '', productName: '', variant: '', systemStock: '', actualStock: '' }]);
    }
  };

  const handleRemoveRow = (id: string) => {
    if (auditItems.length > 1) {
      setAuditItems(auditItems.filter(item => item.id !== id));
    }
  };

  const handleUpdateRow = (id: string, field: keyof AuditItem, value: any) => {
    setAuditItems(auditItems.map(item => {
      if (item.id === id) {
        if (field === 'sku') {
          const product = mockProducts.find(p => p.sku === value);
          if (product) {
            return { ...item, sku: product.sku, productName: product.name, variant: product.variant, systemStock: product.stock };
          }
        }
        if (field === 'productName') {
          const variantsOfProduct = mockProducts.filter(p => p.name === value);
          if (variantsOfProduct.length === 1) {
            // Nếu sản phẩm chỉ có 1 biến thể, tự động chọn luôn biến thể và điền toàn bộ
            const p = variantsOfProduct[0];
            return { ...item, sku: p.sku, productName: p.name, variant: p.variant, systemStock: p.stock };
          }
          // Nếu có nhiều biến thể, chỉ lưu Tên SP và chờ user chọn Biến thể
          return { ...item, productName: value, sku: '', variant: '', systemStock: '' };
        }
        if (field === 'variant') {
          const product = mockProducts.find(p => p.sku === value);
          if (product) {
            return { ...item, sku: product.sku, productName: product.name, variant: product.variant, systemStock: product.stock };
          }
        }
        if (field === 'actualStock') {
          let rawValue = value.replace(/[^0-9]/g, '');
          return { ...item, actualStock: rawValue };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const columns = [
    { key: 'id', header: 'Mã kiểm kê', sortable: true, render: (item: any) => <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.id}</span> },
    { key: 'date', header: 'Ngày tạo', sortable: true },
    { key: 'location', header: 'Chi nhánh / Kho', sortable: true },
    { key: 'creator', header: 'Người thực hiện' },
    { key: 'totalItems', header: 'Số lượng SP kiểm', sortable: true },
    { 
      key: 'discrepancyItems', 
      header: 'Sai lệch', 
      render: (item: any) => (
        <span style={{ fontWeight: 600, color: item.discrepancyItems > 0 ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)' }}>
          {item.discrepancyItems > 0 ? `${item.discrepancyItems} SP lệch` : 'Khớp 100%'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item: any) => (
        <span style={{ 
          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, 
          background: item.status === 'Hoạt động' || item.status === 'Hoàn tất' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)', 
          color: item.status === 'Hoạt động' || item.status === 'Hoàn tất' ? 'rgb(34, 197, 94)' : 'rgb(234, 179, 8)' 
        }}>
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Kiểm kê kho</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Theo dõi lịch sử và tạo phiếu đối chiếu tồn kho hệ thống với thực tế.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="admin-btn admin-btn-primary">
          <Plus size={16} /> Tạo phiếu kiểm kê
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Tìm theo mã phiếu kiểm kê..." style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        </div>
        
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px' }}>
          <Filter size={14} /> Tất cả chi nhánh
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px' }}>
          <CheckCircle2 size={14} /> Trạng thái
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        onRowClick={(item) => setShowModal(item)}
        onSelectionChange={setSelectedIds}
        selectedIds={selectedIds}
        actions={(item) => (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div 
              onClick={() => alert('Tính năng đang phát triển')}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <FileText size={14} /> In phiếu kiểm
            </div>
          </div>
        )}
      />

    {/* Create / View Audit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', width: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {showModal === true ? 'Tạo Phiếu Kiểm Kê Mới' : `Chi tiết Phiếu Kiểm Kê ${showModal.id}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="admin-close-btn" aria-label="Đóng" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chi nhánh / Kho kiểm kê</label>
                {showModal !== true ? (
                  <input 
                    type="text" 
                    value={showModal.location} 
                    disabled 
                    className="admin-input" 
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', outline: 'none', color: 'var(--text-primary)' }} 
                  />
                ) : (
                  <CustomSelect 
                    options={[
                      { value: 'Kho Tổng (TP.HCM)', label: 'Kho Tổng (TP.HCM)' },
                      { value: 'Kho Hà Nội', label: 'Kho Hà Nội' },
                      { value: 'Showroom Quận 1', label: 'Showroom Quận 1' }
                    ]}
                    value={modalLocation}
                    onChange={setModalLocation}
                    placeholder="Chọn chi nhánh..."
                  />
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Người phụ trách kiểm</label>
                <input 
                  type="text" 
                  defaultValue={showModal !== true ? showModal.creator : "Admin (Hiện tại)"} 
                  disabled 
                  className="admin-input" 
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', outline: 'none', color: 'var(--text-primary)' }} 
                />
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Danh sách sản phẩm kiểm kê</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Chọn sản phẩm/biến thể và nhập số lượng tồn thực tế đếm được.</p>
                </div>
                {showModal === true && (
                  <button 
                    onClick={handleAddRow}
                    disabled={!canAddNewLine}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '6px', 
                      background: 'none', border: '1px dashed var(--accent)', color: 'var(--accent)', 
                      padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, 
                      cursor: canAddNewLine ? 'pointer' : 'not-allowed',
                      opacity: canAddNewLine ? 1 : 0.5
                    }}
                  >
                    <Plus size={16} /> Thêm sản phẩm
                  </button>
                )}
              </div>
              
              <table className="admin-table" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', width: '100%' }}>
                <thead>
                  <tr style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    <th style={{ width: '180px', padding: '12px 16px', fontWeight: 600 }}>Mã SKU</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tên sản phẩm</th>
                    <th style={{ width: '180px', padding: '12px 16px', fontWeight: 600 }}>Biến thể</th>
                    <th style={{ width: '80px', padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Tồn HT</th>
                    <th style={{ width: '100px', padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Tồn đếm</th>
                    <th style={{ width: '100px', padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Chênh lệch</th>
                    {showModal === true && <th style={{ width: '50px' }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {showModal !== true ? (
                    <>
                      <tr style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>SF-OSA-3-BRW</td>
                        <td style={{ padding: '12px 16px' }}>Sofa Da Bò Osaka (Băng 3)</td>
                        <td style={{ padding: '12px 16px' }}>Nâu</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>25</td>
                        <td style={{ padding: '12px 16px' }}><input type="text" defaultValue={25} disabled={showModal.status === 'Hoàn tất'} className="admin-input" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center', fontSize: '13px', background: 'var(--bg-primary)' }} /></td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgb(34, 197, 94)', fontWeight: 600 }}>Khớp</td>
                      </tr>
                      <tr style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>BA-IND-WAL</td>
                        <td style={{ padding: '12px 16px' }}>Bàn ăn Indochine</td>
                        <td style={{ padding: '12px 16px' }}>Gỗ óc chó</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>3</td>
                        <td style={{ padding: '12px 16px' }}><input type="text" defaultValue={2} disabled={showModal.status === 'Hoàn tất'} className="admin-input" style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ef4444', textAlign: 'center', fontSize: '13px', color: '#ef4444', fontWeight: 600, background: 'var(--bg-primary)' }} /></td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgb(239, 68, 68)', fontWeight: 600 }}>-1 (Thiếu)</td>
                      </tr>
                    </>
                  ) : (
                    auditItems.map((item) => {
                      const systemStock = Number(item.systemStock) || 0;
                      const actualStock = item.actualStock !== '' ? Number(item.actualStock) : null;
                      const diff = actualStock !== null ? actualStock - systemStock : null;

                      let rowStyle = {};
                      let diffDisplay = <span style={{ color: 'var(--text-muted)' }}>-</span>;

                      if (item.sku !== '' && actualStock !== null) {
                        if (diff === 0) {
                          rowStyle = { backgroundColor: 'rgba(34, 197, 94, 0.05)' };
                          diffDisplay = <span style={{ color: 'rgb(34, 197, 94)', fontWeight: 600 }}>Khớp</span>;
                        } else if (diff > 0) {
                          rowStyle = { backgroundColor: 'rgba(59, 130, 246, 0.05)' };
                          diffDisplay = <span style={{ color: 'rgb(59, 130, 246)', fontWeight: 600 }}>+{diff} (Dư)</span>;
                        } else {
                          rowStyle = { backgroundColor: 'rgba(239, 68, 68, 0.05)' };
                          diffDisplay = <span style={{ color: 'rgb(239, 68, 68)', fontWeight: 600 }}>{diff} (Thiếu)</span>;
                        }
                      }

                      return (
                      <tr key={item.id} style={rowStyle}>
                        <td style={{ padding: '8px 16px' }}>
                          <CustomSelect 
                            options={mockProducts.map(p => ({ value: p.sku, label: p.sku }))}
                            value={item.sku}
                            onChange={(val) => handleUpdateRow(item.id, 'sku', val)}
                            placeholder="Tìm SKU..."
                            searchable={true}
                          />
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <CustomSelect 
                            options={Array.from(new Set(mockProducts.map(p => p.name))).map(name => ({ value: name, label: name }))}
                            value={item.productName}
                            onChange={(val) => handleUpdateRow(item.id, 'productName', val)}
                            placeholder="Chọn tên SP..."
                            searchable={true}
                          />
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <CustomSelect 
                            options={mockProducts
                              .filter(p => !item.productName || p.name === item.productName)
                              .map(p => ({ value: p.sku, label: p.variant }))
                            }
                            value={item.sku}
                            onChange={(val) => handleUpdateRow(item.id, 'variant', val)}
                            placeholder={item.productName ? "Chọn biến thể..." : "Vui lòng chọn SP trước"}
                            searchable={true}
                            disabled={!item.productName}
                          />
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {item.systemStock !== '' ? item.systemStock : '-'}
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <input 
                            type="text" 
                            placeholder="0" 
                            value={item.actualStock}
                            onChange={(e) => handleUpdateRow(item.id, 'actualStock', e.target.value)}
                            className="admin-input" 
                            style={{ 
                              width: '100%', padding: '8px', borderRadius: '6px', textAlign: 'center', fontSize: '13px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)',
                              border: item.sku !== '' && actualStock !== null && diff !== null && diff !== 0 
                                ? (diff > 0 ? '1px solid rgb(59, 130, 246)' : '1px solid rgb(239, 68, 68)') 
                                : '1px solid var(--border-color)' 
                            }} 
                            disabled={!item.sku}
                          />
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          {diffDisplay}
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleRemoveRow(item.id)}
                            disabled={auditItems.length === 1}
                            style={{ 
                              background: 'none', border: 'none', cursor: auditItems.length === 1 ? 'not-allowed' : 'pointer', 
                              color: auditItems.length === 1 ? 'var(--border-color)' : '#ef4444', 
                              padding: '4px' 
                            }}
                            title={auditItems.length === 1 ? "Không thể xóa dòng duy nhất" : "Xóa dòng này"}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
              {showModal !== true && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'rgb(239, 68, 68)', fontWeight: 500 }}>
                  Có 1 sản phẩm bị lệch số lượng. Vui lòng ghi chú nguyên nhân trước khi chốt kiểm kê.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Ghi chú đợt kiểm kê</label>
              <textarea 
                rows={3} 
                placeholder="Ví dụ: Bàn ăn Indochine bị vỡ 1 mặt kính trong quá trình vận chuyển..." 
                className="admin-input" 
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                defaultValue={showModal !== true && showModal.status === 'Hoàn tất' ? 'Phát hiện lệch 1 bàn do hư hỏng' : ''}
                disabled={showModal !== true && showModal.status === 'Hoàn tất'}
              />
            </div>

            {(showModal === true || showModal.status !== 'Hoàn tất') && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => { alert('Đã chốt sổ và cập nhật tồn kho!'); setShowModal(false); }} className="admin-btn admin-btn-primary">Hoàn tất kiểm kê & Chốt sổ</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
