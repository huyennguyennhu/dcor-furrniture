'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Users, UserPlus, Star, Activity, Tag, Clock, Download, ChevronDown, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: 'Cá nhân' | 'B2B';
  membership: 'Vàng' | 'Bạc' | 'Đồng' | 'B2B Partner';
  ordersCount: number;
  totalSpent: number;
  points: number;
  status: 'Hoạt động' | 'Khóa';
  createdAt: string;
  lastPurchaseAt: string;
  labels: string[];
}

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'DC-KH-101', name: 'Nguyễn Văn A', phone: '0901234567', email: 'vana@gmail.com', type: 'Cá nhân', membership: 'Vàng', ordersCount: 5, totalSpent: 185490000, points: 1850, status: 'Hoạt động', createdAt: '2023-01-15', lastPurchaseAt: '2026-08-01', labels: ['VIP'] },
  { id: 'DC-KH-102', name: 'Công ty Kiến trúc X', phone: '0987654321', email: 'contact@xdesign.vn', type: 'B2B', membership: 'B2B Partner', ordersCount: 12, totalSpent: 1420000000, points: 14200, status: 'Hoạt động', createdAt: '2023-03-22', lastPurchaseAt: '2026-07-28', labels: ['Khách sỉ', 'VIP'] },
  { id: 'DC-KH-103', name: 'Lê Hoàng Yến', phone: '0911223344', email: 'hoangyen@gmail.com', type: 'Cá nhân', membership: 'Bạc', ordersCount: 2, totalSpent: 48600000, points: 486, status: 'Khóa', createdAt: '2023-06-10', lastPurchaseAt: '2023-07-05', labels: ['Khiếu nại'] },
  { id: 'DC-KH-104', name: 'Trần Văn B', phone: '0933445566', email: 'tranvanb@gmail.com', type: 'Cá nhân', membership: 'Đồng', ordersCount: 1, totalSpent: 5200000, points: 52, status: 'Hoạt động', createdAt: '2026-07-15', lastPurchaseAt: '2026-07-16', labels: [] },
  { id: 'DC-KH-105', name: 'Phạm Thị C', phone: '0977889900', email: 'phamthic@gmail.com', type: 'Cá nhân', membership: 'Vàng', ordersCount: 8, totalSpent: 210000000, points: 2100, status: 'Hoạt động', createdAt: '2024-11-20', lastPurchaseAt: '2026-08-02', labels: ['VIP'] },
];

const SORT_LABELS: Record<string, string> = {
  'newest': 'Mới đăng ký nhất',
  'recent_purchase': 'Mới mua gần đây',
  'spent': 'Theo chi tiêu',
  'a_z': 'Theo bảng chữ cái'
};

const Card = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ 
    background: 'var(--bg-secondary)', 
    border: '1px solid var(--border-color)', 
    borderRadius: '12px', 
    boxShadow: 'var(--card-shadow)',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers] = useState<Customer[]>(SAMPLE_CUSTOMERS);
  const [search, setSearch] = useState('');
  
  // Custom Filter States
  const [activeSort, setActiveSort] = useState('newest');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [membershipFilter, setMembershipFilter] = useState('Tất cả hạng thành viên');
  const [showMembershipDropdown, setShowMembershipDropdown] = useState(false);

  const [spendingFilter, setSpendingFilter] = useState('Tổng chi tiêu');
  const [showSpendingDropdown, setShowSpendingDropdown] = useState(false);

  const [labelFilter, setLabelFilter] = useState('Nhãn nội bộ');
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setShowSortDropdown(name === 'sort' ? !showSortDropdown : false);
    setShowStatusDropdown(name === 'status' ? !showStatusDropdown : false);
    setShowMembershipDropdown(name === 'membership' ? !showMembershipDropdown : false);
    setShowSpendingDropdown(name === 'spending' ? !showSpendingDropdown : false);
    setShowLabelDropdown(name === 'label' ? !showLabelDropdown : false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
        setShowStatusDropdown(false);
        setShowMembershipDropdown(false);
        setShowSpendingDropdown(false);
        setShowLabelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Lọc dữ liệu
  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        c.phone.includes(search) || 
                        c.email.toLowerCase().includes(search.toLowerCase()) || 
                        c.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'Tất cả trạng thái' || c.status === statusFilter;
    const matchMembership = membershipFilter === 'Tất cả hạng thành viên' || c.membership === membershipFilter;
    const matchLabel = labelFilter === 'Nhãn nội bộ' || c.labels.includes(labelFilter);
    
    let matchSpending = true;
    if (spendingFilter === '< 10 Triệu') matchSpending = c.totalSpent < 10000000;
    if (spendingFilter === '10 - 50 Triệu') matchSpending = c.totalSpent >= 10000000 && c.totalSpent <= 50000000;
    if (spendingFilter === '> 50 Triệu') matchSpending = c.totalSpent > 50000000;

    return matchSearch && matchStatus && matchMembership && matchLabel && matchSpending;
  });

  // 2. Sắp xếp dữ liệu
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    let result = 0;
    if (activeSort === 'newest') result = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (activeSort === 'recent_purchase') result = new Date(b.lastPurchaseAt).getTime() - new Date(a.lastPurchaseAt).getTime();
    if (activeSort === 'spent') result = b.totalSpent - a.totalSpent;
    if (activeSort === 'a_z') result = a.name.localeCompare(b.name);
    
    return sortDirection === 'asc' ? -result : result;
  });

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Khách hàng',
      render: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {item.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.id}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Liên hệ',
      width: '1%',
      render: (item) => (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.phone}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.email}</div>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Ngày đăng ký',
      width: '1%',
      render: (item) => (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.createdAt}</div>
      )
    },
    {
      key: 'membership',
      header: 'Hạng',
      width: '1%',
      render: (item) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: item.membership === 'Vàng' ? '#F59E0B' : item.membership === 'Bạc' ? '#9CA3AF' : item.membership === 'Đồng' ? '#D97706' : '#3B82F6' }}>
            <Star size={14} fill="currentColor" />
            {item.membership}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.points.toLocaleString()} điểm</div>
        </div>
      )
    },
    {
      key: 'ordersAndSpent',
      header: 'Chi tiêu',
      width: '1%',
      render: (item) => (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{(item.totalSpent / 1000000).toLocaleString('vi-VN')}M ₫</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.ordersCount} đơn hàng</div>
        </div>
      )
    },
    {
      key: 'lastPurchase',
      header: 'Mua gần đây',
      width: '1%',
      render: (item) => (
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {item.lastPurchaseAt}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '1%',
      render: (item) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: '24px',
          background: item.status === 'Hoạt động' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: item.status === 'Hoạt động' ? '#10b981' : '#ef4444',
          whiteSpace: 'nowrap'
        }}>
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Quản lý khách hàng</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Danh sách tài khoản, hạng thành viên và lịch sử chi tiêu của khách hàng.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 16px', minWidth: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Tìm tên, SĐT, Email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: 'var(--text-primary)' }}
            />
          </div>

          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '13px', height: '36px' }}>
            <Download size={16} /> Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng khách hàng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>1,245</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+12%</span> so với tháng trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Khách hàng mới</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>128</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+5%</span> so với tháng trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Khách B2B</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>45</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Toàn hệ thống
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Khách hàng VIP</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>150</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+2%</span> so với tháng trước
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div ref={filterRef} style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}>
        
        {/* Sort Filter */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
          <div style={{ position: 'relative' }}>
            <div onClick={() => toggleDropdown('sort')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', height: '36px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
              <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{SORT_LABELS[activeSort]}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
          <div style={{ opacity: showSortDropdown ? 1 : 0, visibility: showSortDropdown ? 'visible' : 'hidden', transform: showSortDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showSortDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
            {Object.entries(SORT_LABELS).map(([key, label]) => (
              <div key={key} onClick={() => { setActiveSort(key); setShowSortDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: activeSort === key ? 'var(--bg-tertiary)' : 'transparent', color: activeSort === key ? 'var(--accent)' : 'var(--text-primary)' }}>
                {label}
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Status Filter */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('status')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{statusFilter}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showStatusDropdown ? 1 : 0, visibility: showStatusDropdown ? 'visible' : 'hidden', transform: showStatusDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showStatusDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
            {['Tất cả trạng thái', 'Hoạt động', 'Khóa'].map((opt) => (
              <div key={opt} onClick={() => { setStatusFilter(opt); setShowStatusDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: statusFilter === opt ? 'var(--bg-tertiary)' : 'transparent', color: statusFilter === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* Membership Filter */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('membership')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{membershipFilter}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showMembershipDropdown ? 1 : 0, visibility: showMembershipDropdown ? 'visible' : 'hidden', transform: showMembershipDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showMembershipDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
            {['Tất cả hạng thành viên', 'Vàng', 'Bạc', 'Đồng', 'B2B Partner'].map((opt) => (
              <div key={opt} onClick={() => { setMembershipFilter(opt); setShowMembershipDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: membershipFilter === opt ? 'var(--bg-tertiary)' : 'transparent', color: membershipFilter === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* Spending Filter */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('spending')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{spendingFilter}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showSpendingDropdown ? 1 : 0, visibility: showSpendingDropdown ? 'visible' : 'hidden', transform: showSpendingDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showSpendingDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
            {['Tổng chi tiêu', '< 10 Triệu', '10 - 50 Triệu', '> 50 Triệu'].map((opt) => (
              <div key={opt} onClick={() => { setSpendingFilter(opt); setShowSpendingDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: spendingFilter === opt ? 'var(--bg-tertiary)' : 'transparent', color: spendingFilter === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* Label Filter */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('label')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{labelFilter}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showLabelDropdown ? 1 : 0, visibility: showLabelDropdown ? 'visible' : 'hidden', transform: showLabelDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showLabelDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
            {['Nhãn nội bộ', 'VIP', 'Khiếu nại', 'Khách sỉ'].map((opt) => (
              <div key={opt} onClick={() => { setLabelFilter(opt); setShowLabelDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: labelFilter === opt ? 'var(--bg-tertiary)' : 'transparent', color: labelFilter === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                {opt}
              </div>
            ))}
          </div>
        </div>

      </div>

      <DataTable 
        columns={columns} 
        data={sortedAndFiltered} 
        onRowClick={(item) => router.push(`/admin/customers/${item.id}`)}
        actions={(item) => (
          <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', position: 'absolute', right: 0, top: '30px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: '160px', display: 'flex', flexDirection: 'column' }}>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => router.push(`/admin/customers/${item.id}`)}>Xem chi tiết</button>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); alert('Tính năng gắn nhãn đang phát triển!'); }}>Gắn/Gỡ nhãn</button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '4px', color: '#ef4444' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); }}>{item.status === 'Hoạt động' ? 'Khóa tài khoản' : 'Mở khóa'}</button>
          </div>
        )}
      />
    </div>
  );
}
