'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, MapPin, ShoppingBag, Heart, Image as ImageIcon, MessageSquare, Edit2, Key } from 'lucide-react';
import AdminPageTabs from '@/components/admin/AdminPageTabs';
import DataTable, { Column } from '@/components/admin/DataTable';

const TABS = [
  { id: 'general', label: 'Thông tin cá nhân' },
  { id: 'addresses', label: 'Sổ địa chỉ', count: 2 },
  { id: 'orders', label: 'Lịch sử mua hàng', count: 5 },
  { id: 'favorites', label: 'Sản phẩm yêu thích', count: 12 },
  { id: 'designs', label: 'Thiết kế đã lưu', count: 3 },
  { id: 'interactions', label: 'Lịch sử tương tác' }
];

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [activeTab, setActiveTab] = useState('general');

  // Dummy data
  const customer = {
    id: id,
    name: 'Nguyễn Văn A',
    email: 'vana@gmail.com',
    phone: '0901234567',
    type: 'Cá nhân',
    membership: 'Vàng',
    totalSpent: '185,490,000 ₫',
    status: 'Hoạt động',
    createdAt: '15/01/2023',
    internalNote: 'Khách VIP, thường mua nội thất gỗ sồi.'
  };

  const addressColumns: Column<any>[] = [
    { key: 'name', header: 'Người nhận' },
    { key: 'phone', header: 'Số điện thoại' },
    { 
      key: 'address', 
      header: 'Địa chỉ',
      render: (item) => (
        <div>
          <div>{item.street}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.ward}, {item.district}, {item.city}</div>
        </div>
      )
    },
    { 
      key: 'isDefault', 
      header: 'Mặc định',
      render: (item) => item.isDefault ? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Mặc định</span> : null
    }
  ];

  const orderColumns: Column<any>[] = [
    { key: 'id', header: 'Mã đơn' },
    { key: 'date', header: 'Ngày đặt' },
    { key: 'total', header: 'Tổng tiền', render: (item) => <span style={{ fontWeight: 600 }}>{item.total}</span> },
    { 
      key: 'status', 
      header: 'Trạng thái',
      render: (item) => (
        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div style={{ paddingBottom: '40px' }}>
      <button 
        onClick={() => router.push('/admin/customers')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', fontSize: '14px' }}
      >
        <ArrowLeft size={16} /> Quay lại danh sách
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '32px', fontWeight: 600, border: '2px solid var(--border-color)' }}>
            {customer.name.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{customer.name}</h1>
              <span style={{ padding: '4px 8px', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>{customer.status}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <span>Mã KH: <strong>{customer.id}</strong></span>
              <span>•</span>
              <span>Đăng ký: {customer.createdAt}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Key size={16} /> Đổi mật khẩu
          </button>
          <button style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <Edit2 size={16} /> Cập nhật
          </button>
        </div>
      </div>

      <AdminPageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          {activeTab === 'general' && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Thông tin liên hệ</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</div>
                  <div style={{ fontWeight: 500 }}>{customer.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Số điện thoại</div>
                  <div style={{ fontWeight: 500 }}>{customer.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phân loại</div>
                  <div style={{ fontWeight: 500 }}>{customer.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Hạng thành viên</div>
                  <div style={{ fontWeight: 500, color: '#F59E0B' }}>{customer.membership}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Ghi chú nội bộ</h3>
              <textarea 
                defaultValue={customer.internalNote}
                style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px' }}
                placeholder="Thêm ghi chú về khách hàng này..."
              />
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>+ Thêm địa chỉ mới</button>
              </div>
              <DataTable 
                columns={addressColumns} 
                data={[
                  { id: 1, name: 'Nguyễn Văn A', phone: '0901234567', street: '123 Đường 3/2', ward: 'Phường 12', district: 'Quận 10', city: 'TP. Hồ Chí Minh', isDefault: true },
                  { id: 2, name: 'Nguyễn Văn A (Cty)', phone: '0901234567', street: '456 Lê Lợi', ward: 'Phường Bến Nghé', district: 'Quận 1', city: 'TP. Hồ Chí Minh', isDefault: false }
                ]} 
                actions={() => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>Sửa</button>
                    <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Xóa</button>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <DataTable 
              columns={orderColumns}
              data={[
                { id: 'ORD-2023-001', date: '15/08/2023 14:30', total: '24,500,000 ₫', status: 'Hoàn tất' },
                { id: 'ORD-2023-045', date: '22/09/2023 09:15', total: '160,990,000 ₫', status: 'Hoàn tất' }
              ]}
              onRowClick={(item) => router.push(`/admin/orders/${item.id}`)}
            />
          )}

          {/* Other tabs can be similarly implemented */}
          {['favorites', 'designs', 'interactions'].includes(activeTab) && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
              Chức năng đang được phát triển...
            </div>
          )}
        </div>

        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Tổng quan tài khoản</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tổng chi tiêu</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '15px' }}>{customer.totalSpent}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tổng đơn hàng</span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>5 đơn</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Tổng sản phẩm đã mua</span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>12 sản phẩm</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Đơn hủy/trả</span>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>0 đơn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
