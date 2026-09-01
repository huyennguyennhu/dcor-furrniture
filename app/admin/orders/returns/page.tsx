'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RotateCcw, AlertCircle, CheckCircle2, Clock, XCircle, Package } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';

interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  type: 'REFUND' | 'EXCHANGE' | 'RETURN';
  reason: string;
  status: 'PENDING' | 'REVIEWING' | 'APPROVED' | 'RETURNING' | 'RECEIVED' | 'REFUNDING' | 'COMPLETED' | 'REJECTED';
  assignee: string;
  createdAt: string;
}

const mockReturns: ReturnRequest[] = [
  {
    id: 'RET-000125',
    orderId: 'ORD-001025',
    customerName: 'Nguyễn Như Huyền',
    productName: 'Sofa Luna',
    type: 'RETURN',
    reason: 'Sản phẩm lỗi/hư hỏng',
    status: 'REVIEWING',
    assignee: 'Admin Tran',
    createdAt: '01/09/2026 09:30',
  },
  {
    id: 'RET-000126',
    orderId: 'ORD-001026',
    customerName: 'Trần Văn Kiên',
    productName: 'Bàn trà Coda',
    type: 'EXCHANGE',
    reason: 'Sai sản phẩm',
    status: 'PENDING',
    assignee: 'Chưa phân công',
    createdAt: '01/09/2026 10:15',
  },
  {
    id: 'RET-000127',
    orderId: 'ORD-001022',
    customerName: 'Lê Thu Trang',
    productName: 'Giường ngủ thông minh',
    type: 'REFUND',
    reason: 'Không đúng mô tả',
    status: 'APPROVED',
    assignee: 'Admin Tran',
    createdAt: '30/08/2026 14:20',
  },
  {
    id: 'RET-000128',
    orderId: 'ORD-001015',
    customerName: 'Phạm Hương',
    productName: 'Ghế ăn Gỗ Sồi (x4)',
    type: 'RETURN',
    reason: 'Khách không còn nhu cầu',
    status: 'REJECTED',
    assignee: 'Manager',
    createdAt: '29/08/2026 08:45',
  }
];

export default function OrderReturnsPage() {
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  const statusFilters = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xử lý', count: mockReturns.filter(r => r.status === 'PENDING').length },
    { id: 'REVIEWING', label: 'Đang xem xét', count: mockReturns.filter(r => r.status === 'REVIEWING').length },
    { id: 'APPROVED', label: 'Đã duyệt' },
    { id: 'COMPLETED', label: 'Đã hoàn tất' },
    { id: 'REJECTED', label: 'Đã từ chối' }
  ];

  const filteredReturns = mockReturns.filter(req => {
    if (activeStatus === 'ALL') return true;
    return req.status === activeStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Chờ xử lý</span>;
      case 'REVIEWING': return <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang xem xét</span>;
      case 'APPROVED': return <span style={{ padding: '4px 8px', background: '#f3e8ff', color: '#9333ea', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã duyệt</span>;
      case 'RETURNING': return <span style={{ padding: '4px 8px', background: '#ffedd5', color: '#ea580c', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang thu hồi</span>;
      case 'RECEIVED': return <span style={{ padding: '4px 8px', background: '#e0f2fe', color: '#0284c7', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã nhận hàng</span>;
      case 'REFUNDING': return <span style={{ padding: '4px 8px', background: '#fce7f3', color: '#db2777', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang xử lý hoàn tiền</span>;
      case 'COMPLETED': return <span style={{ padding: '4px 8px', background: '#d1fae5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Hoàn tất</span>;
      case 'REJECTED': return <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã từ chối</span>;
      default: return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'RETURN': return 'Trả sản phẩm';
      case 'EXCHANGE': return 'Đổi sản phẩm';
      case 'REFUND': return 'Hoàn tiền';
      default: return type;
    }
  };

  const columns = [
    { key: 'id', header: 'Mã yêu cầu', width: '1%', render: (item: any) => <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.id}</span> },
    { 
      key: 'createdAt', 
      header: 'Ngày YC', 
      width: '1%', 
      render: (item: any) => {
        const parts = item.createdAt.split(' ');
        if (parts.length === 2) {
          return (
            <div>
              <div style={{ fontWeight: 500 }}>{parts[0]}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{parts[1]}</div>
            </div>
          );
        }
        return item.createdAt;
      }
    },
    { key: 'orderId', header: 'Đơn hàng', width: '1%' },
    { key: 'customerName', header: 'Khách hàng', width: '1%' },
    { key: 'productName', header: 'Sản phẩm', width: '15%', render: (item: any) => <span style={{ fontWeight: 500 }}>{item.productName}</span> },
    { key: 'type', header: 'Loại YC', width: '1%', render: (item: any) => getTypeBadge(item.type) },
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
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Yêu cầu Đổi trả</h2>
      
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Tổng yêu cầu', value: mockReturns.length, icon: <RotateCcw size={20} color="var(--accent)" />, bg: 'var(--bg-primary)' },
          { label: 'Chờ xử lý', value: mockReturns.filter(r => r.status === 'PENDING').length, icon: <Clock size={20} color="#d97706" />, bg: '#fffbeb' },
          { label: 'Đang xử lý', value: mockReturns.filter(r => ['REVIEWING', 'RETURNING', 'RECEIVED', 'REFUNDING'].includes(r.status)).length, icon: <Package size={20} color="#2563eb" />, bg: '#eff6ff' },
          { label: 'Đã duyệt', value: mockReturns.filter(r => r.status === 'APPROVED').length, icon: <CheckCircle2 size={20} color="#9333ea" />, bg: '#faf5ff' },
          { label: 'Đã hoàn tất', value: mockReturns.filter(r => r.status === 'COMPLETED').length, icon: <CheckCircle2 size={20} color="#059669" />, bg: '#ecfdf5' },
          { label: 'Đã từ chối', value: mockReturns.filter(r => r.status === 'REJECTED').length, icon: <XCircle size={20} color="#dc2626" />, bg: '#fef2f2' },
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
          <input type="text" placeholder="Tìm mã yêu cầu, đơn hàng, khách hàng hoặc sản phẩm..." style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        </div>
        <CustomSelect 
          options={[
            { label: 'Loại yêu cầu', value: 'ALL' },
            { label: 'Đổi sản phẩm', value: 'EXCHANGE' },
            { label: 'Trả sản phẩm', value: 'RETURN' },
            { label: 'Hoàn tiền', value: 'REFUND' }
          ]}
          value="ALL"
          onChange={() => {}}
          style={{ width: '160px' }}
        />
        <CustomSelect 
          options={[
            { label: 'Lý do đổi trả', value: 'ALL' },
            { label: 'Sản phẩm lỗi/hư hỏng', value: 'DEFECTIVE' },
            { label: 'Sai sản phẩm', value: 'WRONG_ITEM' },
            { label: 'Không đúng mô tả', value: 'NOT_AS_DESCRIBED' },
            { label: 'Khách không còn nhu cầu', value: 'NO_LONGER_NEEDED' }
          ]}
          value="ALL"
          onChange={() => {}}
          style={{ width: '180px' }}
        />
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns}
        data={filteredReturns}
        onRowClick={(item) => router.push(`/admin/orders/returns/${item.id}`)}
      />
    </div>
  );
}
