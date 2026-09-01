'use client';

import React, { useState } from 'react';
import { Tag, Search, Plus, Calendar, CheckCircle2, Clock, X, DollarSign, Percent, Truck, MoreHorizontal, Filter, AlertCircle, PauseCircle, Copy, Trash2, Edit, Square, CheckSquare } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';
import Link from 'next/link';

const InteractiveCheckbox = ({ initialChecked = false, label }: { initialChecked?: boolean, label: string }) => {
  const [checked, setChecked] = useState(initialChecked);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-primary)' }} onClick={() => setChecked(!checked)}>
      {checked ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} color="var(--text-muted)" />} 
      {label}
    </div>
  );
};

interface Voucher {
  id: string;
  code: string;
  name: string;
  type: 'PERCENT' | 'FIXED' | 'FREESHIP';
  value: number; 
  maxDiscount?: number; 
  minOrder: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED';
  createdAt: string;
}

const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 'VOU-001',
    code: 'DCORVIP10',
    name: 'Tri ân khách VIP tháng 9',
    type: 'PERCENT',
    value: 10,
    maxDiscount: 2000000,
    minOrder: 20000000,
    usageLimit: 100,
    usedCount: 85,
    startDate: '01/09/2026',
    endDate: '30/09/2026',
    targetAudience: 'Khách VIP',
    status: 'ACTIVE',
    createdAt: '25/08/2026'
  },
  {
    id: 'VOU-002',
    code: 'FREESHIP50K',
    name: 'Freeship đơn từ 5M',
    type: 'FREESHIP',
    value: 50000,
    minOrder: 5000000,
    usageLimit: 500,
    usedCount: 120,
    startDate: '01/09/2026',
    endDate: '31/12/2026',
    targetAudience: 'Tất cả khách hàng',
    status: 'ACTIVE',
    createdAt: '28/08/2026'
  },
  {
    id: 'VOU-003',
    code: 'SUMMER2M',
    name: 'Xả kho Sofa hè',
    type: 'FIXED',
    value: 2000000,
    minOrder: 50000000,
    usageLimit: 50,
    usedCount: 50,
    startDate: '01/06/2026',
    endDate: '31/08/2026',
    targetAudience: 'Tất cả khách hàng',
    status: 'EXPIRED',
    createdAt: '15/05/2026'
  },
  {
    id: 'VOU-004',
    code: 'NEWYEAR27',
    name: 'Lì xì năm mới 2027',
    type: 'PERCENT',
    value: 15,
    maxDiscount: 5000000,
    minOrder: 30000000,
    usageLimit: 200,
    usedCount: 0,
    startDate: '01/01/2027',
    endDate: '15/01/2027',
    targetAudience: 'Tất cả khách hàng',
    status: 'SCHEDULED',
    createdAt: '01/09/2026'
  }
];

export default function VouchersManagementPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [discountFilter, setDiscountFilter] = useState('ALL');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [discountType, setDiscountType] = useState('PERCENT'); // PERCENT, FIXED, FREESHIP
  const [activeAccordion, setActiveAccordion] = useState('BASIC');

  const [programName, setProgramName] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setProgramName(newName);
    if (!isCodeManuallyEdited) {
      // Auto generate code: remove accents, uppercase, remove non-alphanumeric
      const generated = newName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      setVoucherCode(generated);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVoucherCode(e.target.value.toUpperCase());
    setIsCodeManuallyEdited(true);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val) {
      e.target.value = new Intl.NumberFormat('vi-VN').format(Number(val));
    } else {
      e.target.value = '';
    }
  };

  const filteredVouchers = MOCK_VOUCHERS.filter(v => activeTab === 'ALL' || v.status === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span style={{ padding: '4px 8px', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang hoạt động</span>;
      case 'SCHEDULED': return <span style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Sắp diễn ra</span>;
      case 'EXPIRED': return <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã hết hạn</span>;
      case 'PAUSED': return <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Tạm dừng</span>;
      default: return null;
    }
  };

  const columns = [
    { 
      key: 'code', 
      header: 'Mã & Tên chương trình', 
      render: (item: Voucher) => (
        <div>
          <Link href={`/admin/promotions/vouchers/${item.id}`} style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px', letterSpacing: '0.5px', textDecoration: 'none' }}>{item.code}</Link>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.name}</div>
        </div>
      ) 
    },
    { 
      key: 'discountInfo', 
      header: 'Loại & Giá trị', 
      render: (item: Voucher) => (
        <div style={{ fontSize: '13px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {item.type === 'PERCENT' ? <Percent size={12}/> : item.type === 'FIXED' ? <DollarSign size={12}/> : <Truck size={12}/>}
            {item.type === 'PERCENT' ? `Giảm ${item.value}%` : item.type === 'FIXED' ? `Giảm ${formatVND(item.value)}` : `Freeship tối đa ${formatVND(item.value)}`}
          </div>
          {item.maxDiscount && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tối đa: {formatVND(item.maxDiscount)}</div>}
        </div>
      )
    },
    { 
      key: 'conditions', 
      header: 'Điều kiện áp dụng', 
      render: (item: Voucher) => (
        <div style={{ fontSize: '13px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Đơn tối thiểu:</span> <span style={{ fontWeight: 500 }}>{formatVND(item.minOrder)}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Đối tượng:</span> <span style={{ fontWeight: 500 }}>{item.targetAudience}</span></div>
        </div>
      )
    },
    { 
      key: 'usage', 
      header: 'Lượt sử dụng', 
      width: '150px',
      render: (item: Voucher) => {
        const percent = Math.min(100, Math.round((item.usedCount / item.usageLimit) * 100));
        return (
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.usedCount}</span>
              <span>/ {item.usageLimit}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: percent >= 100 ? '#ef4444' : 'var(--accent)', borderRadius: '3px' }}></div>
            </div>
          </div>
        );
      }
    },
    { 
      key: 'date', 
      header: 'Thời hạn', 
      width: '150px',
      render: (item: Voucher) => (
        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={12} /> {item.startDate}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12} /> {item.endDate}</div>
        </div>
      )
    },
    { key: 'status', header: 'Trạng thái', width: '1%', render: (item: Voucher) => getStatusBadge(item.status) },
    { 
      key: 'action', 
      header: '', 
      width: '1%', 
      render: (item: Voucher) => (
        <div style={{ position: 'relative' }} className="dropdown-container">
          <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <MoreHorizontal size={16} />
          </button>
          <div className="dropdown-menu" style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '4px', zIndex: 10, width: '160px', display: 'none' }}>
            <Link href={`/admin/promotions/vouchers/${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '4px' }} className="hover-bg"><Tag size={14}/> Xem chi tiết</Link>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><Edit size={14}/> Chỉnh sửa</button>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><PauseCircle size={14}/> Tạm dừng</button>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><Copy size={14}/> Sao chép mã</button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: '#ef4444', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><Trash2 size={14}/> Xóa</button>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            .dropdown-container:hover .dropdown-menu { display: block !important; }
            .hover-bg:hover { background: var(--bg-secondary); }
          `}} />
        </div>
      )
    }
  ];

  const renderAccordionHeader = (id: string, title: string) => (
    <div 
      onClick={() => setActiveAccordion(activeAccordion === id ? '' : id)}
      style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
    >
      <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
      <ChevronIcon isOpen={activeAccordion === id} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>Mã giảm giá</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Quản lý chi tiết các mã khuyến mãi, giới hạn sử dụng và đối tượng khách hàng.</div>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateDrawer(true)}>
          <Plus size={16} /> Tạo mã mới
        </button>
      </div>

      {/* 8 METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'Tổng mã giảm giá', value: '45', color: 'var(--text-primary)' },
          { title: 'Đang hoạt động', value: '12', color: '#059669' },
          { title: 'Sắp diễn ra', value: '3', color: '#2563eb' },
          { title: 'Đã tạm dừng', value: '2', color: '#d97706' },
          { title: 'Sắp hết hạn', value: '5', color: '#ef4444' },
          { title: 'Đã hết hạn', value: '23', color: 'var(--text-muted)' },
          { title: 'Tổng lượt sử dụng', value: '1,420', color: 'var(--text-primary)' },
          { title: 'Tổng giá trị đã giảm', value: '85.5M', color: 'var(--accent)' },
        ].map((m, i) => (
          <div key={i} style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{m.title}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* FILTER BAR NÂNG CAO */}
      <div style={{ background: 'var(--bg-primary)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Tìm kiếm theo mã, tên chương trình..." className="admin-input" style={{ width: '100%', paddingLeft: '36px' }} />
          </div>
          <CustomSelect 
            style={{ width: '160px' }} 
            value={activeTab} 
            onChange={(val) => setActiveTab(val)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'SCHEDULED', label: 'Sắp diễn ra' },
              { value: 'PAUSED', label: 'Tạm dừng' },
              { value: 'EXPIRED', label: 'Đã hết hạn' }
            ]}
          />

          <CustomSelect 
            style={{ width: '180px' }} 
            value={discountFilter} 
            onChange={(val) => setDiscountFilter(val)}
            options={[
              { value: 'ALL', label: 'Tất cả loại giảm giá' },
              { value: 'PERCENT', label: 'Giảm theo %' },
              { value: 'FIXED', label: 'Giảm số tiền cố định' },
              { value: 'FREESHIP', label: 'Miễn phí vận chuyển' }
            ]}
          />

          <CustomSelect 
            style={{ width: '180px' }} 
            value={audienceFilter} 
            onChange={(val) => setAudienceFilter(val)}
            options={[
              { value: 'ALL', label: 'Mọi đối tượng' },
              { value: 'VIP', label: 'Khách hàng VIP' },
              { value: 'NEW', label: 'Khách hàng mới' }
            ]}
          />

          <button className="admin-btn admin-btn-secondary"><Filter size={16} /> Lọc thêm</button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'visible' }}>
        <DataTable data={filteredVouchers} columns={columns} />
      </div>

      {/* CREATE MODAL NÂNG CAO */}
      {showCreateDrawer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}></div>
          <div style={{ position: 'relative', width: '800px', maxHeight: '90vh', background: 'var(--bg-primary)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Tạo mã giảm giá mới</h2>
              <button onClick={() => setShowCreateDrawer(false)} className="admin-close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              
              {/* Thông tin cơ bản */}
              {renderAccordionHeader('BASIC', '1. Thông tin cơ bản')}
              <div style={{ display: 'grid', gridTemplateRows: activeAccordion === 'BASIC' ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease-in-out' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tên chương trình <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" className="admin-input" placeholder="VD: Khuyến mãi mùa Hè 2026" style={{ width: '100%' }} value={programName} onChange={handleNameChange} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Mã giảm giá <span style={{ color: '#ef4444' }}>*</span></label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <input type="text" className="admin-input" placeholder="Nhập mã..." style={{ flex: 1, textTransform: 'uppercase' }} value={voucherCode} onChange={handleCodeChange} />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Mô tả (Dành cho nội bộ)</label>
                      <textarea className="admin-input" rows={3} style={{ width: '100%', resize: 'none' }} placeholder="Ghi chú thêm về mã giảm giá..."></textarea>
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => setActiveAccordion('DISCOUNT')}>Tiếp tục: Loại ưu đãi</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loại ưu đãi */}
              {renderAccordionHeader('DISCOUNT', '2. Thiết lập ưu đãi')}
              <div style={{ display: 'grid', gridTemplateRows: activeAccordion === 'DISCOUNT' ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease-in-out' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      {[
                        { id: 'PERCENT', label: 'Theo %', icon: <Percent size={18} /> },
                        { id: 'FIXED', label: 'Số tiền', icon: <DollarSign size={18} /> },
                        { id: 'FREESHIP', label: 'Freeship', icon: <Truck size={18} /> }
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
                      {discountType === 'PERCENT' && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Phần trăm giảm (%) <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="number" className="admin-input" placeholder="VD: 10" style={{ width: '100%' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Giảm tối đa (VNĐ)</label>
                            <input type="text" className="admin-input" placeholder="VD: 2.000.000" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                          </div>
                        </>
                      )}
                      {discountType === 'FIXED' && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Số tiền giảm (VNĐ) <span style={{ color: '#ef4444' }}>*</span></label>
                          <input type="text" className="admin-input" placeholder="VD: 500.000" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                        </div>
                      )}
                      {discountType === 'FREESHIP' && (
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Giá trị vận chuyển tối đa được miễn (VNĐ)</label>
                          <input type="text" className="admin-input" placeholder="VD: 50.000" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => setActiveAccordion('CONDITIONS')}>Tiếp tục: Điều kiện sử dụng</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Điều kiện sử dụng */}
              {renderAccordionHeader('CONDITIONS', '3. Điều kiện áp dụng')}
              <div style={{ display: 'grid', gridTemplateRows: activeAccordion === 'CONDITIONS' ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease-in-out' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Giá trị đơn hàng tối thiểu</label>
                        <input type="text" className="admin-input" placeholder="VD: 5.000.000" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Đơn hàng tối đa (Không bắt buộc)</label>
                        <input type="text" className="admin-input" placeholder="Để trống nếu không giới hạn" style={{ width: '100%' }} onChange={handleCurrencyChange} />
                      </div>
                    </div>

                    <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Sản phẩm áp dụng</label>
                      <select className="admin-input" style={{ width: '100%', marginBottom: '12px' }}>
                        <option>Toàn bộ sản phẩm</option>
                        <option>Theo danh mục</option>
                        <option>Theo Collection</option>
                        <option>Theo sản phẩm cụ thể</option>
                      </select>
                      
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', marginTop: '16px' }}>Sản phẩm loại trừ</label>
                      <select className="admin-input" style={{ width: '100%' }}>
                        <option>Không loại trừ</option>
                        <option>Sản phẩm đang sale / trong chiến dịch khác</option>
                        <option>Sản phẩm đặt riêng (Custom)</option>
                        <option>Sản phẩm thanh lý</option>
                      </select>
                    </div>

                    <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Quy tắc kết hợp</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <InteractiveCheckbox label="Không cho phép dùng chung với mã khác" />
                        <InteractiveCheckbox initialChecked={true} label="Cho phép áp dụng chung với giá Campaign đang chạy" />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => setActiveAccordion('LIMITS')}>Tiếp tục: Giới hạn & Đối tượng</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Giới hạn & Đối tượng */}
              {renderAccordionHeader('LIMITS', '4. Giới hạn & Đối tượng')}
              <div style={{ display: 'grid', gridTemplateRows: activeAccordion === 'LIMITS' ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease-in-out' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tổng lượt sử dụng (Toàn hệ thống)</label>
                        <input type="number" className="admin-input" placeholder="VD: 500" style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Lượt sử dụng / 1 Tài khoản</label>
                        <input type="number" className="admin-input" placeholder="VD: 1" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Đối tượng khách hàng</label>
                      <select className="admin-input" style={{ width: '100%' }}>
                        <option>Tất cả khách hàng</option>
                        <option>Khách hàng VIP</option>
                        <option>Khách hàng mới (Lần đầu mua)</option>
                        <option>Khách hàng đã mua hàng</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Kênh áp dụng</label>
                      <select className="admin-input" style={{ width: '100%' }}>
                        <option>Website (Online)</option>
                        <option>Showroom</option>
                        <option>Tất cả các kênh</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', background: 'var(--bg-secondary)' }}>
              <button className="admin-btn admin-btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateDrawer(false)}>Hủy bỏ</button>
              <button className="admin-btn admin-btn-primary" style={{ flex: 1 }}>Tạo Mã Giảm Giá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg 
      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: 'var(--text-muted)' }}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
}
