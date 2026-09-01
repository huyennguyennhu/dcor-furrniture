'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle, CheckCircle2, Clock, Wrench, ArrowRightLeft, AlertOctagon } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';

interface WarrantyRequest {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  orderId: string;
  productName: string;
  variant: string;
  sku: string;
  reason: string; // Đây là lỗi chung khách hàng chọn từ dropdown, không phải mô tả chi tiết
  purchaseDate: string;
  warrantyExpiry: string;
  status: 'PENDING' | 'INSPECTING' | 'PROCESSING' | 'REPAIRING' | 'REPLACING' | 'COMPLETED' | 'REJECTED';
  assignee: string;
  isExpiringSoon: boolean;
}

const mockWarranties: WarrantyRequest[] = [
  {
    id: 'WAR-000125',
    createdAt: '01/09/2026 09:30',
    customerName: 'Nguyễn Như Huyền',
    phone: '0901234567',
    orderId: 'ORD-001025',
    productName: 'Sofa Luna (3 chỗ)',
    variant: 'Da thật màu Nâu',
    sku: 'SF-LUN-03',
    reason: 'Lỗi nệm mút',
    purchaseDate: '15/05/2026',
    warrantyExpiry: '15/05/2028',
    status: 'PENDING',
    assignee: 'Chưa phân công',
    isExpiringSoon: false,
  },
  {
    id: 'WAR-000126',
    createdAt: '30/08/2026 14:15',
    customerName: 'Trần Văn Kiên',
    phone: '0912345678',
    orderId: 'ORD-001012',
    productName: 'Bàn ăn Gỗ Sồi nguyên khối',
    variant: '1m6 - Tự nhiên',
    sku: 'TB-OAK-01',
    reason: 'Lỗi nứt vỡ/Cong vênh',
    purchaseDate: '20/01/2026',
    warrantyExpiry: '20/01/2028',
    status: 'INSPECTING',
    assignee: 'KTV Hoàng Sơn',
    isExpiringSoon: false,
  },
  {
    id: 'WAR-000127',
    createdAt: '28/08/2026 10:20',
    customerName: 'Lê Thu Trang',
    phone: '0988776655',
    orderId: 'ORD-000850',
    productName: 'Giường ngủ thông minh 1m8',
    variant: 'Xám đậm',
    sku: 'BD-SMART-18',
    reason: 'Lỗi phụ kiện/Bản lề',
    purchaseDate: '10/09/2024',
    warrantyExpiry: '10/09/2026',
    status: 'REPAIRING',
    assignee: 'KTV Minh Quân',
    isExpiringSoon: true, // Sắp hết hạn
  },
  {
    id: 'WAR-000128',
    createdAt: '25/08/2026 08:45',
    customerName: 'Phạm Hương',
    phone: '0933445566',
    orderId: 'ORD-000720',
    productName: 'Tủ quần áo cánh kính 4 buồng',
    variant: 'Trắng/Kính cường lực',
    sku: 'CB-GLS-04',
    reason: 'Lỗi bề mặt/Trầy xước',
    purchaseDate: '05/03/2025',
    warrantyExpiry: '05/03/2027',
    status: 'COMPLETED',
    assignee: 'KTV Hoàng Sơn',
    isExpiringSoon: false,
  }
];

export default function OrderWarrantyPage() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  const statusFilters = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ tiếp nhận', count: mockWarranties.filter(r => r.status === 'PENDING').length },
    { id: 'INSPECTING', label: 'Đang kiểm tra', count: mockWarranties.filter(r => r.status === 'INSPECTING').length },
    { id: 'PROCESSING', label: 'Chờ xử lý', count: mockWarranties.filter(r => r.status === 'PROCESSING').length },
    { id: 'REPAIRING', label: 'Đang sửa chữa', count: mockWarranties.filter(r => r.status === 'REPAIRING').length },
    { id: 'REPLACING', label: 'Đang thay thế', count: mockWarranties.filter(r => r.status === 'REPLACING').length },
    { id: 'COMPLETED', label: 'Hoàn tất' }
  ];

  const filteredWarranties = mockWarranties.filter(req => {
    if (activeStatus === 'ALL') return true;
    return req.status === activeStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Chờ tiếp nhận</span>;
      case 'INSPECTING': return <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang kiểm tra</span>;
      case 'PROCESSING': return <span style={{ padding: '4px 8px', background: '#ffedd5', color: '#ea580c', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Chờ xử lý</span>;
      case 'REPAIRING': return <span style={{ padding: '4px 8px', background: '#f3e8ff', color: '#9333ea', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang sửa chữa</span>;
      case 'REPLACING': return <span style={{ padding: '4px 8px', background: '#e0f2fe', color: '#0284c7', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang thay thế</span>;
      case 'COMPLETED': return <span style={{ padding: '4px 8px', background: '#d1fae5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Hoàn tất</span>;
      case 'REJECTED': return <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Từ chối</span>;
      default: return null;
    }
  };

  const columns = [
    { 
      key: 'id', 
      header: 'Mã yêu cầu', 
      width: '1%', 
      render: (item: any) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.id}</span>
          {item.isExpiringSoon && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertOctagon size={10}/> SẮP HẾT HẠN</div>}
        </div>
      ) 
    },
    { 
      key: 'createdAt', 
      header: 'Ngày YC', 
      width: '1%', 
      render: (item: any) => {
        const parts = item.createdAt.split(' ');
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{parts[0]}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{parts[1] || ''}</div>
          </div>
        );
      }
    },
    { 
      key: 'customerName', 
      header: 'Khách hàng',
      width: '1%',
      render: (item: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.customerName}</div>
        </div>
      )
    },
    { 
      key: 'productInfo', 
      header: 'Sản phẩm', 
      render: (item: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{item.productName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.variant}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px' }}>
            Lỗi: {item.reason}
          </div>
        </div>
      )
    },
    { 
      key: 'dates', 
      header: 'Bảo hành', 
      width: '1%', 
      render: (item: any) => (
        <div style={{ fontSize: '12px', minWidth: '130px' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Mua:</span> {item.purchaseDate}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Hạn:</span> <span style={{ fontWeight: 500, color: item.isExpiringSoon ? '#ef4444' : 'var(--text-primary)' }}>{item.warrantyExpiry}</span></div>
        </div>
      )
    },
    { key: 'status', header: 'Trạng thái', width: '1%', render: (item: any) => getStatusBadge(item.status) },
    { 
      key: 'assignee', 
      header: 'Người xử lý', 
      width: '1%',
      render: (item: any) => (
        <span style={{ 
          color: item.assignee === 'Chưa phân công' ? '#dc2626' : 'var(--text-primary)',
          fontWeight: item.assignee === 'Chưa phân công' ? 600 : 500
        }}>
          {item.assignee}
        </span>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Yêu cầu Bảo hành</h2>
      
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Tổng yêu cầu', value: mockWarranties.length, icon: <AlertCircle size={20} color="var(--accent)" />, bg: 'var(--bg-primary)' },
          { label: 'Chờ tiếp nhận', value: mockWarranties.filter(r => r.status === 'PENDING').length, icon: <Clock size={20} color="#d97706" />, bg: '#fffbeb' },
          { label: 'Đang sửa chữa', value: mockWarranties.filter(r => r.status === 'REPAIRING').length, icon: <Wrench size={20} color="#9333ea" />, bg: '#faf5ff' },
          { label: 'Sắp hết hạn xử lý', value: mockWarranties.filter(r => r.isExpiringSoon).length, icon: <AlertOctagon size={20} color="#dc2626" />, bg: '#fef2f2' },
          { label: 'Đã hoàn tất', value: mockWarranties.filter(r => r.status === 'COMPLETED').length, icon: <CheckCircle2 size={20} color="#059669" />, bg: '#ecfdf5' },
        ].map((stat, idx) => (
          <div key={idx} style={{ background: stat.bg, padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {stat.icon} {stat.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Status Filters (Pills) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {statusFilters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveStatus(filter.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: activeStatus === filter.id ? 'none' : '1px solid var(--border-color)',
              background: activeStatus === filter.id ? 'var(--accent)' : 'transparent',
              color: activeStatus === filter.id ? '#fff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span style={{ 
                background: activeStatus === filter.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                color: activeStatus === filter.id ? '#fff' : 'inherit',
                padding: '2px 6px', 
                borderRadius: '10px', 
                fontSize: '11px' 
              }}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Tìm mã bảo hành, mã đơn, khách hàng hoặc SKU..." style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        </div>
        <CustomSelect 
          options={[
            { label: 'Tất cả thời gian', value: '' },
            { label: 'Hôm nay', value: 'today' },
            { label: '7 ngày qua', value: '7days' },
            { label: 'Tháng này', value: 'this_month' },
            { label: 'Tùy chỉnh...', value: 'custom' }
          ]}
          value=""
          onChange={() => {}}
          style={{ width: '160px' }}
        />
        <CustomSelect 
          options={[
            { label: 'Phân loại', value: 'ALL' },
            { label: 'Sofa', value: 'SOFA' },
            { label: 'Bàn ghế', value: 'TABLE' },
            { label: 'Giường', value: 'BED' }
          ]}
          value="ALL"
          onChange={() => {}}
          style={{ width: '160px' }}
        />
        <CustomSelect 
          options={[
            { label: 'Kho/Showroom phụ trách', value: 'ALL' },
            { label: 'Showroom Quận 1', value: 'Q1' },
            { label: 'Kho Tổng', value: 'KHO' }
          ]}
          value="ALL"
          onChange={() => {}}
          style={{ width: '220px' }}
        />
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns}
        data={filteredWarranties}
        onRowClick={(item) => router.push(`/admin/orders/warranty/${item.id}`)}
      />
    </div>
  );
}
