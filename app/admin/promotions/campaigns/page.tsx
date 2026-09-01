'use client';

import React, { useState } from 'react';
import { Tag, Search, Plus, Calendar, Clock, CheckCircle2, PauseCircle, Copy, Trash2, Edit, StopCircle, Filter, Percent, DollarSign, MoreHorizontal } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  type: string;
  target: string;
  discountType: 'PERCENT' | 'FIXED' | 'SPECIAL_PRICE';
  discountValue: number;
  startDate: string;
  endDate: string;
  productCount: number;
  orderCount: number;
  revenue: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED';
  creator: string;
}

const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'CAM-001',
    name: 'Mùa thu Bắc Âu',
    type: 'Holiday Sale',
    target: 'Collection Sofa',
    discountType: 'PERCENT',
    discountValue: 20,
    startDate: '01/09/2026',
    endDate: '30/09/2026',
    productCount: 45,
    orderCount: 152,
    revenue: 1250000000,
    status: 'ACTIVE',
    creator: 'admin'
  },
  {
    id: 'CAM-002',
    name: 'Tri ân khách hàng VIP',
    type: 'Member',
    target: 'Toàn bộ cửa hàng',
    discountType: 'PERCENT',
    discountValue: 10,
    startDate: '15/09/2026',
    endDate: '31/12/2026',
    productCount: 350,
    orderCount: 42,
    revenue: 450000000,
    status: 'ACTIVE',
    creator: 'marketing'
  },
  {
    id: 'CAM-003',
    name: 'Flash Sale Black Friday',
    type: 'Flash Sale',
    target: 'Danh mục Giường',
    discountType: 'SPECIAL_PRICE',
    discountValue: 0, // variable per product
    startDate: '27/11/2026',
    endDate: '29/11/2026',
    productCount: 30,
    orderCount: 0,
    revenue: 0,
    status: 'SCHEDULED',
    creator: 'admin'
  },
  {
    id: 'CAM-004',
    name: 'Dọn kho đón hè',
    type: 'Clearance',
    target: 'Sản phẩm thanh lý',
    discountType: 'FIXED',
    discountValue: 2000000,
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    productCount: 80,
    orderCount: 205,
    revenue: 3500000000,
    status: 'EXPIRED',
    creator: 'admin'
  }
];

export default function CampaignsManagementPage() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredCampaigns = MOCK_CAMPAIGNS.filter(c => activeTab === 'ALL' || c.status === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span style={{ padding: '4px 8px', background: '#ecfdf5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang diễn ra</span>;
      case 'SCHEDULED': return <span style={{ padding: '4px 8px', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Sắp diễn ra</span>;
      case 'EXPIRED': return <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã kết thúc</span>;
      case 'PAUSED': return <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Tạm dừng</span>;
      default: return null;
    }
  };

  const columns = [
    { 
      key: 'name', 
      header: 'Tên chiến dịch', 
      render: (item: Campaign) => (
        <div>
          <Link href={`/admin/promotions/campaigns/${item.id}`} style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px', textDecoration: 'none' }}>{item.name}</Link>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.type}</div>
        </div>
      ) 
    },
    { 
      key: 'target', 
      header: 'Phạm vi áp dụng', 
      render: (item: Campaign) => (
        <div style={{ fontSize: '13px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.target}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.productCount} sản phẩm</div>
        </div>
      )
    },
    { 
      key: 'discount', 
      header: 'Hình thức ưu đãi', 
      render: (item: Campaign) => (
        <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 500 }}>
          {item.discountType === 'PERCENT' ? <Percent size={14}/> : <DollarSign size={14}/>}
          {item.discountType === 'PERCENT' ? `Giảm ${item.discountValue}%` : item.discountType === 'FIXED' ? `Giảm ${formatVND(item.discountValue)}` : `Giá đặc biệt`}
        </div>
      )
    },
    { 
      key: 'date', 
      header: 'Thời gian', 
      width: '150px',
      render: (item: Campaign) => (
        <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={12} /> {item.startDate}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12} /> {item.endDate}</div>
        </div>
      )
    },
    { 
      key: 'performance', 
      header: 'Hiệu quả', 
      render: (item: Campaign) => (
        <div style={{ fontSize: '13px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Đơn hàng:</span> <span style={{ fontWeight: 600 }}>{item.orderCount}</span></div>
          <div><span style={{ color: 'var(--text-muted)' }}>Doanh thu:</span> <span style={{ fontWeight: 600, color: '#059669' }}>{formatVND(item.revenue)}</span></div>
        </div>
      )
    },
    { key: 'status', header: 'Trạng thái', width: '1%', render: (item: Campaign) => getStatusBadge(item.status) },
    { 
      key: 'action', 
      header: '', 
      width: '1%', 
      render: (item: Campaign) => (
        <div style={{ position: 'relative' }} className="dropdown-container">
          <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <MoreHorizontal size={16} />
          </button>
          <div className="dropdown-menu" style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '4px', zIndex: 10, width: '180px', display: 'none' }}>
            <Link href={`/admin/promotions/campaigns/${item.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none', borderRadius: '4px' }} className="hover-bg"><Tag size={14}/> Xem chi tiết</Link>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><Edit size={14}/> Chỉnh sửa</button>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><PauseCircle size={14}/> Tạm dừng</button>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><Copy size={14}/> Sao chép chiến dịch</button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
            <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '13px', color: '#ef4444', border: 'none', background: 'transparent', textAlign: 'left', borderRadius: '4px', cursor: 'pointer' }} className="hover-bg"><StopCircle size={14}/> Kết thúc sớm</button>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            .dropdown-container:hover .dropdown-menu { display: block !important; }
            .hover-bg:hover { background: var(--bg-secondary); }
          `}} />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>Chiến dịch khuyến mãi</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Quản lý các đợt giảm giá hàng loạt tự động áp dụng cho sản phẩm hoặc danh mục.</div>
        </div>
        <Link href="/admin/promotions/campaigns/create" className="admin-btn admin-btn-primary" style={{ textDecoration: 'none' }}>
          <Plus size={16} /> Tạo chiến dịch mới
        </Link>
      </div>

      {/* 8 METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { title: 'Tổng chiến dịch', value: '18', color: 'var(--text-primary)' },
          { title: 'Đang diễn ra', value: '4', color: '#059669' },
          { title: 'Sắp diễn ra', value: '2', color: '#2563eb' },
          { title: 'Đã kết thúc', value: '11', color: 'var(--text-muted)' },
          { title: 'Tạm dừng', value: '1', color: '#d97706' },
          { title: 'Tổng doanh thu', value: '14.5B', color: 'var(--accent)' },
          { title: 'Tổng đơn hàng', value: '2,840', color: 'var(--text-primary)' },
          { title: 'Tổng giá trị ưu đãi', value: '850M', color: '#ef4444' },
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
            <input type="text" placeholder="Tìm kiếm chiến dịch..." className="admin-input" style={{ width: '100%', paddingLeft: '36px' }} />
          </div>
          
          <CustomSelect 
            style={{ width: '160px' }} 
            value={activeTab} 
            onChange={(val) => setActiveTab(val)}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang diễn ra' },
              { value: 'SCHEDULED', label: 'Sắp diễn ra' },
              { value: 'PAUSED', label: 'Tạm dừng' },
              { value: 'EXPIRED', label: 'Đã kết thúc' }
            ]}
          />

          <CustomSelect 
            style={{ width: '180px' }} 
            value={typeFilter} 
            onChange={(val) => setTypeFilter(val)}
            options={[
              { value: 'ALL', label: 'Tất cả loại chiến dịch' },
              { value: 'HOLIDAY', label: 'Holiday Sale' },
              { value: 'FLASH', label: 'Flash Sale' },
              { value: 'CLEARANCE', label: 'Xả hàng' }
            ]}
          />

          <button className="admin-btn admin-btn-secondary"><Filter size={16} /> Lọc thêm</button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'visible' }}>
        <DataTable data={filteredCampaigns} columns={columns} />
      </div>

    </div>
  );
}
