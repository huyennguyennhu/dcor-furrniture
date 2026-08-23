'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square } from 'lucide-react';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71'];

const REVENUE_DATA_MAP: Record<string, any[]> = {
  'today': [
    { name: '00:00', current: 1500, previous: 1200 },
    { name: '06:00', current: 2000, previous: 1800 },
    { name: '12:00', current: 4000, previous: 3500 },
    { name: '18:00', current: 3000, previous: 2800 },
  ],
  '7_days': [
    { name: '01/08', current: 4000, previous: 2400 },
    { name: '02/08', current: 3000, previous: 1398 },
    { name: '03/08', current: 2000, previous: 9800 },
    { name: '04/08', current: 2780, previous: 3908 },
    { name: '05/08', current: 1890, previous: 4800 },
    { name: '06/08', current: 2390, previous: 3800 },
    { name: '07/08', current: 3490, previous: 4300 },
  ],
  'month': [
    { name: 'Tuần 1', current: 15000, previous: 12000 },
    { name: 'Tuần 2', current: 20000, previous: 18000 },
    { name: 'Tuần 3', current: 18000, previous: 15000 },
    { name: 'Tuần 4', current: 25000, previous: 20000 },
  ]
};

const TIME_LABELS: Record<string, string> = {
  'today': 'Hôm nay',
  '7_days': '7 ngày qua',
  'month': 'Tháng này',
  'custom': 'Tùy chỉnh...'
};

const SHOWROOM_LABELS: Record<string, string> = {
  'all': 'Tất cả Showroom',
  'sr_1': 'Showroom Quận 1',
  'sr_3': 'Showroom Quận 3',
  'sr_7': 'Showroom Quận 7'
};

const ORDER_STATUS_DATA = [
  { name: 'Hoàn thành', value: 400 },
  { name: 'Đang xử lý', value: 300 },
  { name: 'Đã hủy', value: 50 },
  { name: 'Chờ xác nhận', value: 100 },
];

const CATEGORY_REVENUE_DATA = [
  { name: 'Sofa', value: 4000 },
  { name: 'Giường', value: 3000 },
  { name: 'Bàn ghế ăn', value: 2000 },
  { name: 'Tủ kệ', value: 2780 },
  { name: 'Đồ trang trí', value: 1890 },
];

const FUNNEL_DATA = [
  { value: 1000, name: 'Lượt truy cập', fill: '#8884d8' },
  { value: 800, name: 'Xem sản phẩm', fill: '#83a6ed' },
  { value: 400, name: 'Thêm vào giỏ', fill: '#8dd1e1' },
  { value: 200, name: 'Thanh toán', fill: '#82ca9d' },
  { value: 50, name: 'Thành công', fill: '#a4de6c' },
];

const TOP_PRODUCTS = [
  { id: 1, name: 'Sofa Indivi 2,5 chỗ', sku: 'SF-IND-01', sales: 124, revenue: '1,240,000,000 ₫', stock: 12 },
  { id: 2, name: 'Giường ngủ Osaka', sku: 'BD-OSK-02', sales: 85, revenue: '850,000,000 ₫', stock: 5 },
  { id: 3, name: 'Bàn ăn Milano', sku: 'TB-MIL-03', sales: 64, revenue: '480,000,000 ₫', stock: 0 },
  { id: 4, name: 'Ghế lười Ottawa', sku: 'CH-OTT-04', sales: 42, revenue: '210,000,000 ₫', stock: 24 },
  { id: 5, name: 'Tủ tivi Lugano', sku: 'CB-LUG-05', sales: 38, revenue: '342,000,000 ₫', stock: 8 },
];

const TOP_CUSTOMERS = [
  { id: 1, name: 'Nguyễn Văn A', phone: '0901234567', orders: 15, totalSpent: '450,000,000 ₫', rank: 'VIP' },
  { id: 2, name: 'Trần Thị B', phone: '0912345678', orders: 8, totalSpent: '320,000,000 ₫', rank: 'Gold' },
  { id: 3, name: 'Lê Văn C', phone: '0923456789', orders: 12, totalSpent: '280,000,000 ₫', rank: 'Gold' },
  { id: 4, name: 'Phạm Thị D', phone: '0934567890', orders: 5, totalSpent: '150,000,000 ₫', rank: 'Silver' },
  { id: 5, name: 'Hoàng Văn E', phone: '0945678901', orders: 3, totalSpent: '85,000,000 ₫', rank: 'Member' },
];

// Reusable Card Component
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

export default function AdminOverviewPage() {
  const [compare, setCompare] = useState(false);
  const [timeRange, setTimeRange] = useState('7_days');
  const [showroom, setShowroom] = useState('all');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showShowroomDropdown, setShowShowroomDropdown] = useState(false);
  const [interval, setInterval] = useState('Ngày');
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setShowTimeDropdown(name === 'time' ? !showTimeDropdown : false);
    setShowShowroomDropdown(name === 'showroom' ? !showShowroomDropdown : false);
    setShowIntervalDropdown(name === 'interval' ? !showIntervalDropdown : false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
        setShowShowroomDropdown(false);
        setShowIntervalDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header & Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Tổng quan hệ thống</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Báo cáo tổng hợp tình hình kinh doanh, đơn hàng và sản phẩm.</p>
        </div>
        
        {/* Toolbar */}
        <div ref={filterRef} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          
          <button onClick={() => setCompare(!compare)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-secondary)', border: `1px solid ${compare ? 'var(--accent)' : 'var(--border-color)'}`, borderRadius: '8px', cursor: 'pointer', color: compare ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 500, fontSize: '12px' }}>
            {compare ? <CheckSquare size={16} /> : <Square size={16} />} So sánh kỳ trước
          </button>
          
          <div style={{ position: 'relative' }}>
            <div onClick={() => toggleDropdown('showroom')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
              <MapPin size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{SHOWROOM_LABELS[showroom]}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
            <div style={{ opacity: showShowroomDropdown ? 1 : 0, visibility: showShowroomDropdown ? 'visible' : 'hidden', transform: showShowroomDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showShowroomDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
                {Object.entries(SHOWROOM_LABELS).map(([key, label]) => (
                  <div key={key} onClick={() => { setShowroom(key); setShowShowroomDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: showroom === key ? 'var(--bg-tertiary)' : 'transparent', color: showroom === key ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {label}
                  </div>
                ))}
              </div>
          </div>
          
          {timeRange === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <input type="date" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: 'var(--text-primary)' }} defaultValue="2026-08-01" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
              <input type="date" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: 'var(--text-primary)' }} defaultValue="2026-08-07" />
            </div>
          )}
          
          <div style={{ position: 'relative' }}>
            <div onClick={() => toggleDropdown('time')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{TIME_LABELS[timeRange]}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
            <div style={{ opacity: showTimeDropdown ? 1 : 0, visibility: showTimeDropdown ? 'visible' : 'hidden', transform: showTimeDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showTimeDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
                {Object.entries(TIME_LABELS).map(([key, label]) => (
                  <div key={key} onClick={() => { setTimeRange(key); setShowTimeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: timeRange === key ? 'var(--bg-tertiary)' : 'transparent', color: timeRange === key ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {label}
                  </div>
                ))}
              </div>
          </div>
          
          <button className="admin-btn admin-btn-primary">
            <Download size={16} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng doanh thu</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>1,248,500K</div>
          <div style={{ fontSize: '12px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> +15.4% so với kỳ trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng đơn hàng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>342 đơn</div>
          <div style={{ fontSize: '12px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> +5.2% so với kỳ trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Khách hàng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>1,402</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+120</span> khách mới
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Sản phẩm</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>842 SP</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#e74c3c', fontWeight: 600 }}>14</span> SP sắp hết hàng
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Lịch tư vấn</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>8 lịch</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>3</span> lịch sắp diễn ra
          </div>
        </Card>

      </div>

      {/* Main Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        <Card style={{ padding: '24px', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Doanh thu theo thời gian</h3>
            
            <div style={{ position: 'relative' }}>
              <div onClick={() => toggleDropdown('interval')} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                Theo {interval.toLowerCase()} <ChevronDown size={14} />
              </div>
              <div style={{ opacity: showIntervalDropdown ? 1 : 0, visibility: showIntervalDropdown ? 'visible' : 'hidden', transform: showIntervalDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showIntervalDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100px', overflow: 'hidden' }}>
                  {['Giờ', 'Ngày', 'Tuần', 'Tháng'].map(opt => (
                    <div key={opt} onClick={() => { setInterval(opt); setShowIntervalDropdown(false); }} style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: interval === opt ? 'var(--bg-tertiary)' : 'transparent', color: interval === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {opt}
                    </div>
                  ))}
                </div>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA_MAP[timeRange]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} tickFormatter={(val) => `${val/1000}M`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value.toLocaleString()} ₫`, 'Doanh thu']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line type="monotone" name="Kỳ này" dataKey="current" stroke="var(--accent)" strokeWidth={3} activeDot={{ r: 8 }} />
                {compare && <Line type="monotone" name="Kỳ trước" dataKey="previous" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Trạng thái đơn hàng</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ORDER_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ORDER_STATUS_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value} đơn`, 'Số lượng']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Main Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Doanh thu theo danh mục</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_REVENUE_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={100} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value.toLocaleString()} ₫`, 'Doanh thu']}
                />
                <Bar dataKey="value" name="Doanh thu" fill="#3498db" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Tỷ lệ chuyển đổi (Phễu)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value.toLocaleString()}`, 'Lượt']}
                />
                <Funnel
                  dataKey="value"
                  data={FUNNEL_DATA}
                  isAnimationActive
                >
                  <LabelList position="right" fill="var(--text-secondary)" stroke="none" dataKey="name" fontSize={12} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Tables Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
        
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Top sản phẩm bán chạy</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Xem tất cả</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Sản phẩm</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Đã bán</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Doanh thu</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {TOP_PRODUCTS.map((prod, idx) => (
                <tr key={prod.id} style={{ borderBottom: idx < TOP_PRODUCTS.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{prod.sku}</div>
                  </td>
                  <td style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>{prod.sales}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--text-primary)' }}>{prod.revenue}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: 600,
                      background: prod.stock > 10 ? 'rgba(46, 204, 113, 0.1)' : prod.stock > 0 ? 'rgba(241, 196, 15, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                      color: prod.stock > 10 ? '#2ecc71' : prod.stock > 0 ? '#f39c12' : '#e74c3c'
                    }}>
                      {prod.stock > 0 ? `${prod.stock} chiếc` : 'Hết hàng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Khách hàng chi tiêu cao</h3>
            <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Xem tất cả</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Khách hàng</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Chi tiêu</th>
              </tr>
            </thead>
            <tbody>
              {TOP_CUSTOMERS.map((cus, idx) => (
                <tr key={cus.id} style={{ borderBottom: idx < TOP_CUSTOMERS.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cus.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                      {cus.phone}
                      <span style={{ 
                        padding: '2px 6px', 
                        background: cus.rank === 'VIP' ? 'rgba(211, 84, 0, 0.1)' : cus.rank === 'Gold' ? 'rgba(241, 196, 15, 0.1)' : 'var(--bg-tertiary)',
                        color: cus.rank === 'VIP' ? '#d35400' : cus.rank === 'Gold' ? '#f39c12' : 'var(--text-muted)',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 700
                      }}>
                        {cus.rank}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cus.totalSpent}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cus.orders} đơn hàng</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

      </div>

    </div>
  );
}
