'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, ChevronDown, Package, Star, Link as LinkIcon, Search } from 'lucide-react';

const PIE_COLORS = ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6'];

const INTERACTIONS_DATA_MAP: Record<string, any[]> = {
  'today': [
    { name: '00:00', views: 120, cart: 15, purchase: 2 }, { name: '06:00', views: 350, cart: 45, purchase: 8 },
    { name: '12:00', views: 800, cart: 120, purchase: 25 }, { name: '18:00', views: 1200, cart: 210, purchase: 45 },
  ],
  '7_days': [
    { name: '01/08', views: 4500, cart: 620, purchase: 115 }, { name: '02/08', views: 5200, cart: 750, purchase: 132 },
    { name: '03/08', views: 4800, cart: 680, purchase: 124 }, { name: '04/08', views: 6100, cart: 890, purchase: 168 },
    { name: '05/08', views: 5900, cart: 810, purchase: 154 }, { name: '06/08', views: 7200, cart: 1050, purchase: 195 },
    { name: '07/08', views: 8500, cart: 1240, purchase: 245 },
  ],
  'month': [
    { name: 'Tuần 1', views: 28000, cart: 4200, purchase: 850 }, { name: 'Tuần 2', views: 35000, cart: 5400, purchase: 1100 },
    { name: 'Tuần 3', views: 32000, cart: 4800, purchase: 980 }, { name: 'Tuần 4', views: 45000, cart: 7200, purchase: 1450 },
  ]
};

const CATEGORY_PRODUCTS_MAP: Record<string, any[]> = {
  main: [
    { name: 'Sofa', value: 120 }, { name: 'Giường', value: 85 }, { name: 'Bàn ghế ăn', value: 150 }, { name: 'Tủ kệ', value: 95 }, { name: 'Đồ trang trí', value: 240 }
  ],
  room: [
    { name: 'Phòng khách', value: 310 }, { name: 'Phòng ngủ', value: 180 }, { name: 'Phòng ăn', value: 150 }, { name: 'Làm việc', value: 50 }
  ],
  style: [
    { name: 'Hiện đại', value: 250 }, { name: 'Bắc Âu', value: 220 }, { name: 'Tối giản', value: 120 }, { name: 'Cổ điển', value: 100 }
  ]
};

const TOP_SALES_PRODUCTS = [
  { name: 'Sofa Indivi', value: 124 },
  { name: 'Giường Osaka', value: 85 },
  { name: 'Bàn ăn Milano', value: 64 },
  { name: 'Ghế lười Ottawa', value: 42 },
  { name: 'Tủ tivi Lugano', value: 38 },
  { name: 'Thảm cỏ', value: 30 },
  { name: 'Đèn bàn', value: 28 },
  { name: 'Tủ quần áo', value: 25 },
  { name: 'Bàn làm việc', value: 20 },
  { name: 'Kệ sách', value: 15 },
  { name: 'Ghế xoay', value: 12 },
  { name: 'Đồng hồ', value: 10 },
  { name: 'Bàn phấn', value: 8 },
  { name: 'Tủ giày', value: 7 },
  { name: 'Sofa góc', value: 5 },
  { name: 'Ghế đẩu', value: 4 },
  { name: 'Rèm cửa', value: 3 },
  { name: 'Tủ góc', value: 2 },
  { name: 'Ghế bành', value: 2 },
  { name: 'Thảm lớn', value: 1 },
];

const REVENUE_BY_PRODUCT = [
  { name: 'Sofa Indivi', value: 1240 },
  { name: 'Giường Osaka', value: 850 },
  { name: 'Bàn ăn Milano', value: 480 },
  { name: 'Tủ tivi Lugano', value: 342 },
  { name: 'Ghế lười Ottawa', value: 210 },
  { name: 'Tủ quần áo', value: 180 },
  { name: 'Bàn làm việc', value: 150 },
  { name: 'Kệ sách', value: 120 },
  { name: 'Sofa góc', value: 110 },
  { name: 'Bàn phấn', value: 90 },
  { name: 'Tủ giày', value: 85 },
  { name: 'Ghế xoay', value: 70 },
  { name: 'Đồng hồ', value: 65 },
  { name: 'Thảm cỏ', value: 60 },
  { name: 'Đèn bàn', value: 50 },
  { name: 'Ghế đẩu', value: 40 },
  { name: 'Rèm cửa', value: 35 },
  { name: 'Tủ góc', value: 30 },
  { name: 'Ghế bành', value: 25 },
  { name: 'Thảm lớn', value: 20 },
];

const MATRIX_COLS = ['Bàn trà', 'Đèn', 'Thảm', 'Gối tựa', 'Tủ nhỏ', 'Ghế ăn'];
const MATRIX_ROWS = [
  { name: 'Sofa Indivi', values: { 'Bàn trà': 45, 'Đèn': 15, 'Thảm': 35, 'Gối tựa': 60, 'Tủ nhỏ': 5, 'Ghế ăn': 0 } },
  { name: 'Giường Osaka', values: { 'Bàn trà': 0, 'Đèn': 40, 'Thảm': 20, 'Gối tựa': 80, 'Tủ nhỏ': 55, 'Ghế ăn': 0 } },
  { name: 'Bàn ăn Milano', values: { 'Bàn trà': 0, 'Đèn': 25, 'Thảm': 15, 'Gối tựa': 0, 'Tủ nhỏ': 20, 'Ghế ăn': 75 } },
  { name: 'Tủ tivi Lugano', values: { 'Bàn trà': 30, 'Đèn': 10, 'Thảm': 10, 'Gối tựa': 0, 'Tủ nhỏ': 0, 'Ghế ăn': 0 } },
];

const PRODUCT_PERFORMANCE = [
  { id: '#SP-001', name: 'Sofa Indivi 2,5 chỗ', sales: 124, revenue: '1,240M ₫', stock: 12, rating: 4.8 },
  { id: '#SP-002', name: 'Giường ngủ Osaka', sales: 85, revenue: '850M ₫', stock: 5, rating: 4.9 },
  { id: '#SP-003', name: 'Bàn ăn Milano', sales: 64, revenue: '480M ₫', stock: 0, rating: 4.5 },
  { id: '#SP-004', name: 'Ghế lười Ottawa', sales: 42, revenue: '210M ₫', stock: 24, rating: 4.7 },
  { id: '#SP-005', name: 'Tủ tivi Lugano', sales: 38, revenue: '342M ₫', stock: 8, rating: 4.6 },
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

export default function AdminProductsReportPage() {
  const [timeRange, setTimeRange] = useState('7_days');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  const [category, setCategory] = useState('Tất cả danh mục');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [collection, setCollection] = useState('Tất cả bộ sưu tập');
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);

  const [brand, setBrand] = useState('Tất cả thương hiệu');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const [status, setStatus] = useState('Trạng thái kinh doanh');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [interval, setInterval] = useState('Ngày');
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

  const [topSalesCount, setTopSalesCount] = useState(10);
  const [showTopSalesDropdown, setShowTopSalesDropdown] = useState(false);

  const [categoryType, setCategoryType] = useState('main'); // main, room, style
  const [heatmapSearch, setHeatmapSearch] = useState('');

  const filterRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setShowTimeDropdown(name === 'time' ? !showTimeDropdown : false);
    setShowCategoryDropdown(name === 'category' ? !showCategoryDropdown : false);
    setShowCollectionDropdown(name === 'collection' ? !showCollectionDropdown : false);
    setShowBrandDropdown(name === 'brand' ? !showBrandDropdown : false);
    setShowStatusDropdown(name === 'status' ? !showStatusDropdown : false);
    setShowIntervalDropdown(name === 'interval' ? !showIntervalDropdown : false);
    setShowTopSalesDropdown(name === 'topsales' ? !showTopSalesDropdown : false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
        setShowCategoryDropdown(false);
        setShowCollectionDropdown(false);
        setShowBrandDropdown(false);
        setShowStatusDropdown(false);
        setShowIntervalDropdown(false);
        setShowTopSalesDropdown(false);
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Báo cáo sản phẩm</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Theo dõi hiệu quả kinh doanh và trạng thái tồn kho của sản phẩm.</p>
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
          <div onClick={() => toggleDropdown('category')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{category}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showCategoryDropdown ? 1 : 0, visibility: showCategoryDropdown ? 'visible' : 'hidden', transform: showCategoryDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showCategoryDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả danh mục', 'Sofa', 'Giường', 'Bàn ghế ăn'].map((opt) => (
                <div key={opt} onClick={() => { setCategory(opt); setShowCategoryDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: category === opt ? 'var(--bg-tertiary)' : 'transparent', color: category === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
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
              {['Tất cả bộ sưu tập', 'Mùa thu 2026', 'Indivi', 'Osaka'].map((opt) => (
                <div key={opt} onClick={() => { setCollection(opt); setShowCollectionDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: collection === opt ? 'var(--bg-tertiary)' : 'transparent', color: collection === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
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
              {['Tất cả thương hiệu', 'BoConcept', 'Calligaris', 'Ashley'].map((opt) => (
                <div key={opt} onClick={() => { setBrand(opt); setShowBrandDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: brand === opt ? 'var(--bg-tertiary)' : 'transparent', color: brand === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('status')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{status}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showStatusDropdown ? 1 : 0, visibility: showStatusDropdown ? 'visible' : 'hidden', transform: showStatusDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showStatusDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Trạng thái kinh doanh', 'Đang bán', 'Ngừng kinh doanh', 'Hết hàng'].map((opt) => (
                <div key={opt} onClick={() => { setStatus(opt); setShowStatusDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: status === opt ? 'var(--bg-tertiary)' : 'transparent', color: status === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng sản phẩm</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>690</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Toàn hệ thống
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Đang bán</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>580</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+15</span> SP mới tuần này
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Gần hết hàng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>24</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#f1c40f', fontWeight: 600 }}>&lt; 5</span> tồn kho (Ngưỡng cảnh báo)
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Hết hàng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>12</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#e74c3c', fontWeight: 600 }}>0</span> tồn kho
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>SP Bán chạy nhất</div>
          <div style={{ fontSize: '16px', fontWeight: 700, margin: '14px 0', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sofa Indivi</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            124 lượt bán
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Giá bán TB</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>3,650K</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Toàn bộ danh mục
          </div>
        </Card>
      </div>

      {/* Main Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card style={{ padding: '24px', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Tương tác sản phẩm theo thời gian</h3>
            
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
              <LineChart data={INTERACTIONS_DATA_MAP[timeRange]} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    `${value.toLocaleString()}`, 
                    name === 'views' ? 'Lượt xem' : name === 'cart' ? 'Thêm vào giỏ' : 'Lượt mua'
                  ]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} 
                  formatter={(value) => {
                    if (value === 'views') return 'Lượt xem';
                    if (value === 'cart') return 'Thêm vào giỏ';
                    if (value === 'purchase') return 'Lượt mua';
                    return value;
                  }}
                />
                <Line type="monotone" name="views" dataKey="views" stroke="#9b59b6" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" name="cart" dataKey="cart" stroke="#3498db" strokeWidth={3} />
                <Line type="monotone" name="purchase" dataKey="purchase" stroke="#2ecc71" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card style={{ padding: '24px', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Top sản phẩm theo Số lượng & Doanh thu</h3>
            <div style={{ position: 'relative' }}>
              <div onClick={() => toggleDropdown('topsales')} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                Top {topSalesCount} <ChevronDown size={14} />
              </div>
              <div style={{ opacity: showTopSalesDropdown ? 1 : 0, visibility: showTopSalesDropdown ? 'visible' : 'hidden', transform: showTopSalesDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showTopSalesDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '80px', overflow: 'hidden' }}>
                {[5, 10, 15, 20].map(opt => (
                  <div key={opt} onClick={() => { setTopSalesCount(opt); setShowTopSalesDropdown(false); }} style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: topSalesCount === opt ? 'var(--bg-tertiary)' : 'transparent', color: topSalesCount === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                    Top {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
            {/* Sales Chart */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>Số lượng bán</h4>
              <div style={{ width: '100%', height: `${Math.max(300, topSalesCount * 40 + 50)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TOP_SALES_PRODUCTS.slice(0, topSalesCount)} margin={{ top: 0, right: 30, left: 30, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={100} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px' }}
                      labelStyle={{ fontSize: '12px' }}
                      formatter={(value: any) => [`${value} SP`, 'Đã bán']}
                    />
                    <Bar dataKey="value" name="Số lượng" fill="#e74c3c" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Revenue Chart */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>Doanh thu (Triệu ₫)</h4>
              <div style={{ width: '100%', height: `${Math.max(300, topSalesCount * 40 + 50)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REVENUE_BY_PRODUCT.slice(0, topSalesCount)} margin={{ top: 0, right: 30, left: 30, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={100} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px' }}
                      labelStyle={{ fontSize: '12px' }}
                      formatter={(value: any) => [`${value}M ₫`, 'Doanh thu']}
                    />
                    <Bar dataKey="value" name="Doanh thu" fill="#3498db" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Charts Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Cơ cấu theo danh mục (SL)</h3>
            <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px' }}>
              <button onClick={() => setCategoryType('main')} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: categoryType === 'main' ? 'var(--bg-secondary)' : 'transparent', color: categoryType === 'main' ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: '6px', boxShadow: categoryType === 'main' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Danh mục chính</button>
              <button onClick={() => setCategoryType('room')} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: categoryType === 'room' ? 'var(--bg-secondary)' : 'transparent', color: categoryType === 'room' ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: '6px', boxShadow: categoryType === 'room' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Phòng</button>
              <button onClick={() => setCategoryType('style')} style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: 'none', background: categoryType === 'style' ? 'var(--bg-secondary)' : 'transparent', color: categoryType === 'style' ? 'var(--text-primary)' : 'var(--text-muted)', borderRadius: '6px', boxShadow: categoryType === 'style' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Phong cách</button>
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_PRODUCTS_MAP[categoryType]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORY_PRODUCTS_MAP[categoryType].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => [`${value} SP`, 'Số lượng']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      {/* Main Charts Row 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Sản phẩm thường mua chung (Heatmap)</h3>
            <div style={{ position: 'relative', width: '250px' }}>
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm chính..." 
                value={heatmapSearch}
                onChange={(e) => setHeatmapSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', maxHeight: '400px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'center' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-secondary)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th style={{ position: 'sticky', left: 0, zIndex: 11, background: 'var(--bg-secondary)', padding: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', minWidth: '180px' }}>Sản phẩm chính</th>
                  {MATRIX_COLS.map(col => (
                    <th key={col} style={{ padding: '12px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '2px solid var(--border-color)', minWidth: '100px' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.filter(row => row.name.toLowerCase().includes(heatmapSearch.toLowerCase())).map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg-primary)', padding: '12px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left', borderRight: '1px solid var(--border-color)' }}>{row.name}</td>
                    {MATRIX_COLS.map((col, cIdx) => {
                      const val = (row.values as any)[col] || 0;
                      // Calculate opacity based on value (0 to 100 max, mostly up to 80)
                      const opacity = val > 0 ? 0.1 + (val / 100) * 0.9 : 0;
                      return (
                        <td key={cIdx} style={{ padding: '4px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '40px',
                            background: val > 0 ? `rgba(52, 152, 219, ${opacity})` : 'transparent',
                            borderRadius: '6px',
                            color: val > 50 ? '#fff' : (val > 0 ? 'var(--text-primary)' : 'var(--text-muted)'),
                            fontWeight: val > 0 ? 600 : 400,
                            fontSize: '13px'
                          }}>
                            {val > 0 ? `${val}%` : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {MATRIX_ROWS.filter(row => row.name.toLowerCase().includes(heatmapSearch.toLowerCase())).length === 0 && (
                  <tr>
                    <td colSpan={MATRIX_COLS.length + 1} style={{ padding: '32px', color: 'var(--text-muted)' }}>
                      Không tìm thấy sản phẩm nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Main Charts Row 5 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Hiệu quả sản phẩm</h3>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Mã SP</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Tên sản phẩm</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Lượt bán</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Doanh thu</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Tồn kho</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCT_PERFORMANCE.map((prod, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>{prod.id}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={16} color="var(--accent)" />
                        {prod.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{prod.sales}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{prod.revenue}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 500,
                        backgroundColor: prod.stock > 10 ? 'rgba(46, 204, 113, 0.1)' : 
                                         prod.stock > 0 ? 'rgba(241, 196, 15, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                        color: prod.stock > 10 ? '#2ecc71' : 
                               prod.stock > 0 ? '#f39c12' : '#e74c3c',
                      }}>
                        {prod.stock > 0 ? `${prod.stock} (Sẵn sàng)` : 'Hết hàng'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} color="#f1c40f" fill="#f1c40f" />
                        {prod.rating}
                      </div>
                    </td>
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
