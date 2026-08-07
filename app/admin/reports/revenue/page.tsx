'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, MapPin, Download, RefreshCw, ChevronDown, CheckSquare, Square, Filter, Tag, Layers } from 'lucide-react';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

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

const CATEGORY_REVENUE = [
  { name: 'Sofa', value: 45000 },
  { name: 'Giường', value: 32000 },
  { name: 'Bàn ghế ăn', value: 28000 },
  { name: 'Tủ kệ', value: 15000 },
  { name: 'Đồ trang trí', value: 8000 },
];

const SHOWROOM_REVENUE = [
  { name: 'Quận 1', value: 35000 },
  { name: 'Quận 3', value: 28000 },
  { name: 'Quận 7', value: 45000 },
  { name: 'Gò Vấp', value: 20000 },
];

const TOP_REVENUE_PRODUCTS = [
  { name: 'Sofa Indivi', value: 15000 },
  { name: 'Giường Osaka', value: 12000 },
  { name: 'Bàn ăn Milano', value: 9500 },
  { name: 'Ghế lười Ottawa', value: 8000 },
  { name: 'Tủ tivi Lugano', value: 6500 },
];

const TIME_LABELS: Record<string, string> = {
  'today': 'Hôm nay',
  '7_days': '7 ngày qua',
  'month': 'Tháng này',
  'custom': 'Tùy chỉnh'
};

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

export default function AdminRevenueReportPage() {
  const [compare, setCompare] = useState(false);
  const [timeRange, setTimeRange] = useState('7_days');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  const [category, setCategory] = useState('Tất cả danh mục');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [brand, setBrand] = useState('Tất cả thương hiệu');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const [collection, setCollection] = useState('Tất cả bộ sưu tập');
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);

  const [interval, setInterval] = useState('Ngày');
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setShowTimeDropdown(name === 'time' ? !showTimeDropdown : false);
    setShowCategoryDropdown(name === 'category' ? !showCategoryDropdown : false);
    setShowBrandDropdown(name === 'brand' ? !showBrandDropdown : false);
    setShowCollectionDropdown(name === 'collection' ? !showCollectionDropdown : false);
    setShowIntervalDropdown(name === 'interval' ? !showIntervalDropdown : false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
        setShowCategoryDropdown(false);
        setShowBrandDropdown(false);
        setShowCollectionDropdown(false);
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Báo cáo doanh thu</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Phân tích hiệu quả tài chính và doanh số theo thời gian.</p>
        </div>
        
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '12px' }}>
          <Download size={16} /> Xuất báo cáo
        </button>
      </div>
        
      {/* Filter Bar */}
      <div ref={filterRef} style={{ display: 'flex', gap: '16px', flexWrap: 'nowrap', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--card-shadow)' }}>
        
        <button onClick={() => setCompare(!compare)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: `1px solid ${compare ? 'var(--accent)' : 'var(--border-color)'}`, borderRadius: '8px', cursor: 'pointer', color: compare ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>
          {compare ? <CheckSquare size={16} /> : <Square size={16} />} So sánh kỳ trước
        </button>
        
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
          <div onClick={() => toggleDropdown('category')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{category}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showCategoryDropdown ? 1 : 0, visibility: showCategoryDropdown ? 'visible' : 'hidden', transform: showCategoryDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showCategoryDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả danh mục', 'Sofa', 'Giường', 'Bàn ghế ăn', 'Tủ kệ', 'Đồ trang trí'].map((opt) => (
                <div key={opt} onClick={() => { setCategory(opt); setShowCategoryDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: category === opt ? 'var(--bg-tertiary)' : 'transparent', color: category === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('brand')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{brand}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showBrandDropdown ? 1 : 0, visibility: showBrandDropdown ? 'visible' : 'hidden', transform: showBrandDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showBrandDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả thương hiệu', 'Dcor In-house', 'BoConcept', 'Calligaris', 'Natuzzi'].map((opt) => (
                <div key={opt} onClick={() => { setBrand(opt); setShowBrandDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: brand === opt ? 'var(--bg-tertiary)' : 'transparent', color: brand === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('collection')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{collection}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showCollectionDropdown ? 1 : 0, visibility: showCollectionDropdown ? 'visible' : 'hidden', transform: showCollectionDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showCollectionDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả bộ sưu tập', 'Spring 2026', 'Summer Vibe', 'Minimalist', 'Classic Wooden'].map((opt) => (
                <div key={opt} onClick={() => { setCollection(opt); setShowCollectionDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: collection === opt ? 'var(--bg-tertiary)' : 'transparent', color: collection === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
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
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Doanh thu thuần</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>1,120,000K</div>
          <div style={{ fontSize: '12px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> +12.1% so với kỳ trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Trung bình/ngày</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>41,616K</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Dựa trên 30 ngày
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Giá trị ĐH TB (AOV)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>3,650K</div>
          <div style={{ fontSize: '12px', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={12} /> +2.5% so với kỳ trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tăng trưởng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>15.4%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Vượt mục tiêu 5.4%
          </div>
        </Card>
      </div>

      {/* Main Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
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

      </div>

      {/* Main Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Cơ cấu theo danh mục</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_REVENUE}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORY_REVENUE.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${(value/1000).toLocaleString()}M ₫`, 'Doanh thu']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Doanh thu theo danh mục</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_REVENUE} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} tickFormatter={(val) => `${val/1000}M`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${(value*1000).toLocaleString()} ₫`, 'Doanh thu']}
                />
                <Bar dataKey="value" name="Doanh thu" fill="#3498db" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Main Charts Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Top 10 sản phẩm (Doanh thu)</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_REVENUE_PRODUCTS} margin={{ top: 20, right: 30, left: 30, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `${val/1000}M`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={100} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${(value*1000).toLocaleString()} ₫`, 'Doanh thu']}
                />
                <Bar dataKey="value" name="Doanh thu" fill="#e74c3c" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Doanh thu theo Showroom</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SHOWROOM_REVENUE} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} tickFormatter={(val) => `${val/1000}M`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${(value*1000).toLocaleString()} ₫`, 'Doanh thu']}
                />
                <Bar dataKey="value" name="Doanh thu" fill="#2ecc71" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

    </div>
  );
}
