'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Calendar as CalendarIcon, Download } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';
import { getInventoryHistory, InventoryTransaction } from '@/lib/data/inventoryHistory';

export default function InventoryHistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<InventoryTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewBy, setViewBy] = useState('variant');

  React.useEffect(() => {
    setData(getInventoryHistory());
  }, []);

  const columns = [
    { 
      key: 'id', 
      header: 'Mã biến động', 
      width: '1%',
      render: (item: any) => (
        <span style={{ fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>
          {item.id}
        </span>
      )
    },
    { 
      key: 'date', 
      header: 'Thời gian', 
      sortable: true, 
      width: '1%',
      render: (item: any) => {
        const parts = item.date.split(' ');
        if (parts.length >= 2) {
          return (
            <div>
              <div style={{ fontWeight: 500 }}>{parts[0]}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{parts.slice(1).join(' ')}</div>
            </div>
          );
        }
        return item.date;
      }
    },
    { 
      key: 'variant', 
      header: viewBy === 'variant' ? 'Biến thể' : 'Sản phẩm',
      render: (item: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.productName}</div>
          {viewBy === 'variant' && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.sku} - {item.variant}</div>}
        </div>
      )
    },
    { key: 'location', header: 'Kho/Showroom', width: '1%' },
    { 
      key: 'type', 
      header: 'Loại biến động',
      width: '1%',
      render: (item: any) => {
        let color = 'var(--text-primary)';
        let bg = 'var(--bg-secondary)';
        if (item.type.includes('Nhập') || item.type.includes('Điều chỉnh tăng') || item.type === 'Hoàn hàng') { color = 'rgb(34, 197, 94)'; bg = 'rgba(34, 197, 94, 0.1)'; }
        if (item.type.includes('Xuất') || item.type.includes('Điều chỉnh giảm')) { color = 'rgb(239, 68, 68)'; bg = 'rgba(239, 68, 68, 0.1)'; }
        if (item.type.includes('Chuyển')) { color = 'rgb(59, 130, 246)'; bg = 'rgba(59, 130, 246, 0.1)'; }
        return <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, color, background: bg, whiteSpace: 'nowrap' }}>{item.type}</span>;
      }
    },
    { 
      key: 'quantity', 
      header: 'Thay đổi',
      width: '1%',
      align: 'center' as const,
      render: (item: any) => {
        const isPositive = item.quantity.startsWith('+');
        return <span style={{ fontWeight: 700, fontSize: '15px', color: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>{item.quantity}</span>;
      }
    },
    { key: 'stockAfter', header: 'Tồn sau', width: '1%', align: 'center' as const },
    { key: 'reference', header: 'Tham chiếu', width: '1%', render: (item: any) => <span style={{ color: 'var(--text-secondary)' }}>{item.reference}</span> },
    { key: 'creator', header: 'Người thực hiện', width: '1%' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Lịch sử biến động kho</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Tra cứu lịch sử nhập, xuất, bán hàng và kiểm kê của toàn bộ hệ thống.</p>
        </div>
        <button className="admin-btn admin-btn-secondary">
          <Download size={16} /> Xuất Excel
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Tìm kiếm mã biến động / SKU / mã đơn hàng" style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        </div>
        
        <div style={{ width: '150px' }}>
          <CustomSelect 
            options={[
              { value: 'variant', label: 'Theo biến thể' },
              { value: 'product', label: 'Theo sản phẩm' }
            ]}
            value={viewBy}
            onChange={setViewBy}
          />
        </div>

        <div style={{ width: '180px' }}>
          <CustomSelect 
            options={[
              { value: '', label: 'Tất cả Kho/Showroom' },
              { value: 'Kho Tổng', label: 'Kho Tổng (TP.HCM)' },
              { value: 'Showroom Thủ Đức', label: 'Showroom Thủ Đức' }
            ]}
            value=""
            onChange={() => {}}
            placeholder="Kho/Showroom"
          />
        </div>

        <div style={{ width: '180px' }}>
          <CustomSelect 
            options={[
              { value: '', label: 'Mọi loại biến động' },
              { value: 'Nhập kho', label: 'Nhập kho' },
              { value: 'Xuất kho', label: 'Xuất kho' },
              { value: 'Điều chỉnh tăng', label: 'Điều chỉnh tăng' },
              { value: 'Điều chỉnh giảm', label: 'Điều chỉnh giảm' },
              { value: 'Chuyển kho', label: 'Chuyển kho' },
              { value: 'Hoàn hàng', label: 'Hoàn hàng' }
            ]}
            value=""
            onChange={() => {}}
            placeholder="Loại biến động"
          />
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
          <CalendarIcon size={14} /> Khoảng thời gian
        </button>
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns} 
        data={data} 
        selectable={false}
        onRowClick={(item: any) => router.push(`/admin/inventory/history/${item.id}`)}
      />
    </div>
  );
}
