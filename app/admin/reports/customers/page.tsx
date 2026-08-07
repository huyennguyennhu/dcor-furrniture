'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, ChevronDown, Users, Award, MapPin } from 'lucide-react';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

const NEW_CUSTOMERS_DATA: Record<string, any[]> = {
  'today': [
    { name: '00:00', value: 2 }, { name: '06:00', value: 5 },
    { name: '12:00', value: 12 }, { name: '18:00', value: 8 },
  ],
  '7_days': [
    { name: '01/08', value: 24 }, { name: '02/08', value: 18 },
    { name: '03/08', value: 35 }, { name: '04/08', value: 42 },
    { name: '05/08', value: 38 }, { name: '06/08', value: 50 },
    { name: '07/08', value: 45 },
  ],
  'month': [
    { name: 'Tuần 1', value: 120 }, { name: 'Tuần 2', value: 150 },
    { name: 'Tuần 3', value: 180 }, { name: 'Tuần 4', value: 210 },
  ]
};

const MEMBERSHIP_DATA = [
  { name: 'Thành viên', value: 1200 },
  { name: 'Bạc', value: 450 },
  { name: 'Vàng', value: 280 },
  { name: 'Kim cương', value: 85 },
];

const LOCATION_DATA = [
  { name: 'TP.HCM', value: 1250 },
  { name: 'Hà Nội', value: 850 },
  { name: 'Đà Nẵng', value: 320 },
  { name: 'Đồng Nai', value: 210 },
  { name: 'Bình Dương', value: 180 },
];

const TOP_SPENDERS = [
  { id: '#KH001', name: 'Nguyễn Văn A', tier: 'Kim cương', orders: 12, spent: '245,000,000 ₫' },
  { id: '#KH084', name: 'Trần Thị B', tier: 'Vàng', orders: 8, spent: '132,500,000 ₫' },
  { id: '#KH105', name: 'Lê Văn C', tier: 'Vàng', orders: 6, spent: '98,000,000 ₫' },
  { id: '#KH042', name: 'Phạm Thị D', tier: 'Kim cương', orders: 15, spent: '85,000,000 ₫' },
  { id: '#KH199', name: 'Hoàng Văn E', tier: 'Bạc', orders: 4, spent: '62,500,000 ₫' },
];

const TOP_ORDER_FREQ = [
  { id: '#KH042', name: 'Phạm Thị D', tier: 'Kim cương', orders: 15, spent: '85,000,000 ₫' },
  { id: '#KH001', name: 'Nguyễn Văn A', tier: 'Kim cương', orders: 12, spent: '245,000,000 ₫' },
  { id: '#KH302', name: 'Vũ Thị F', tier: 'Bạc', orders: 9, spent: '42,000,000 ₫' },
  { id: '#KH084', name: 'Trần Thị B', tier: 'Vàng', orders: 8, spent: '132,500,000 ₫' },
  { id: '#KH211', name: 'Đặng Văn G', tier: 'Thành viên', orders: 7, spent: '28,500,000 ₫' },
];

const TIME_LABELS: Record<string, string> = {
  'today': 'Hôm nay',
  '7_days': '7 ngày qua',
  'month': 'Tháng này',
  'custom': 'Tùy chỉnh'
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

export default function AdminCustomersReportPage() {
  const [timeRange, setTimeRange] = useState('7_days');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  const [tier, setTier] = useState('Tất cả hạng thành viên');
  const [showTierDropdown, setShowTierDropdown] = useState(false);

  const [location, setLocation] = useState('Tất cả khu vực');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [interval, setInterval] = useState('Ngày');
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setShowTimeDropdown(name === 'time' ? !showTimeDropdown : false);
    setShowTierDropdown(name === 'tier' ? !showTierDropdown : false);
    setShowLocationDropdown(name === 'location' ? !showLocationDropdown : false);
    setShowIntervalDropdown(name === 'interval' ? !showIntervalDropdown : false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
        setShowTierDropdown(false);
        setShowLocationDropdown(false);
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
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Báo cáo khách hàng</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Theo dõi hành vi, phân khúc và giá trị của khách hàng.</p>
        </div>
        
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '12px' }}>
          <Download size={16} /> Xuất báo cáo
        </button>
      </div>
        
      {/* Filter Bar */}
      <div ref={filterRef} style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}>
        
        <div style={{ display: 'flex' }}>
          <div style={{ position: 'relative' }}>
            <div onClick={() => toggleDropdown('time')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: timeRange === 'custom' ? '8px 0 0 8px' : '8px', borderRight: timeRange === 'custom' ? 'none' : '1px solid var(--border-color)', cursor: 'pointer' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{TIME_LABELS[timeRange]}</span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
            <div style={{ opacity: showTimeDropdown ? 1 : 0, visibility: showTimeDropdown ? 'visible' : 'hidden', transform: showTimeDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showTimeDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
                {Object.entries(TIME_LABELS).map(([key, label]) => (
                  <div key={key} onClick={() => { setTimeRange(key); setShowTimeDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: timeRange === key ? 'var(--bg-tertiary)' : 'transparent', color: timeRange === key ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {label}
                  </div>
                ))}
              </div>
          </div>
          
          {timeRange === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '0 8px 8px 0' }}>
              <input type="date" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: 'var(--text-primary)' }} defaultValue="2026-08-01" />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
              <input type="date" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', color: 'var(--text-primary)' }} defaultValue="2026-08-07" />
            </div>
          )}
        </div>
        
        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('tier')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{tier}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showTierDropdown ? 1 : 0, visibility: showTierDropdown ? 'visible' : 'hidden', transform: showTierDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showTierDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả hạng thành viên', 'Thành viên', 'Bạc', 'Vàng', 'Kim cương'].map((opt) => (
                <div key={opt} onClick={() => { setTier(opt); setShowTierDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: tier === opt ? 'var(--bg-tertiary)' : 'transparent', color: tier === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('location')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{location}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showLocationDropdown ? 1 : 0, visibility: showLocationDropdown ? 'visible' : 'hidden', transform: showLocationDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showLocationDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả khu vực', 'Miền Bắc', 'Miền Trung', 'Miền Nam'].map((opt) => (
                <div key={opt} onClick={() => { setLocation(opt); setShowLocationDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: location === opt ? 'var(--bg-tertiary)' : 'transparent', color: location === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>

      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng khách hàng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>2,450</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+120</span> so với tháng trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Khách hàng mới</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>345</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Trong kỳ báo cáo
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Khách quay lại</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>856</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#3498db', fontWeight: 600 }}>Mua từ 2 lần</span>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Khách hàng VIP</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>365</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Hạng Vàng & Kim cương
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Chi tiêu TB</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>12,500K</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Trên mỗi khách hàng
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tỷ lệ quay lại</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>35.8%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+2.4%</span> so với tháng trước
          </div>
        </Card>
      </div>

      {/* Main Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card style={{ padding: '24px', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Khách hàng mới theo thời gian</h3>
            
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
              <LineChart data={NEW_CUSTOMERS_DATA[timeRange]} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value}`, 'Khách hàng mới']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line type="monotone" name="KH mới" dataKey="value" stroke="#3498db" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Phân bố hạng thành viên</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MEMBERSHIP_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {MEMBERSHIP_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value} KH`, 'Số lượng']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Phân bố khu vực</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LOCATION_DATA} margin={{ top: 20, right: 0, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value}`, 'Khách hàng']}
                />
                <Bar dataKey="value" name="Khách hàng" fill="#9b59b6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Top khách hàng chi tiêu</h3>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Khách hàng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Hạng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Số ĐH</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>Tổng chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                {TOP_SPENDERS.map((cust, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={14} color="var(--accent)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{cust.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cust.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: cust.tier === 'Kim cương' ? 'rgba(155, 89, 182, 0.1)' : 
                                         cust.tier === 'Vàng' ? 'rgba(241, 196, 15, 0.1)' : 'rgba(149, 165, 166, 0.1)',
                        color: cust.tier === 'Kim cương' ? '#9b59b6' : 
                               cust.tier === 'Vàng' ? '#f39c12' : '#7f8c8d',
                      }}>
                        {cust.tier}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{cust.orders}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{cust.spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Top khách hàng mua nhiều đơn</h3>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Khách hàng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Hạng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Số ĐH</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500, textAlign: 'right' }}>Tổng chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                {TOP_ORDER_FREQ.map((cust, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Users size={14} color="var(--accent)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{cust.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cust.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                        backgroundColor: cust.tier === 'Kim cương' ? 'rgba(155, 89, 182, 0.1)' : 
                                         cust.tier === 'Vàng' ? 'rgba(241, 196, 15, 0.1)' : 'rgba(149, 165, 166, 0.1)',
                        color: cust.tier === 'Kim cương' ? '#9b59b6' : 
                               cust.tier === 'Vàng' ? '#f39c12' : '#7f8c8d',
                      }}>
                        {cust.tier}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{cust.orders}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{cust.spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
