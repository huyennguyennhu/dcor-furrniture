'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, ChevronDown, Filter, Truck, CreditCard, Activity } from 'lucide-react';

const PIE_COLORS = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c'];
const BAR_COLORS = ['#34495e', '#9b59b6'];

const ORDERS_DATA_MAP: Record<string, any[]> = {
  'today': [
    { name: '00:00', total: 10, completed: 8 },
    { name: '06:00', total: 25, completed: 20 },
    { name: '12:00', total: 45, completed: 35 },
    { name: '18:00', total: 30, completed: 25 },
  ],
  '7_days': [
    { name: '01/08', total: 40, completed: 35 },
    { name: '02/08', total: 30, completed: 28 },
    { name: '03/08', total: 55, completed: 50 },
    { name: '04/08', total: 42, completed: 38 },
    { name: '05/08', total: 48, completed: 45 },
    { name: '06/08', total: 60, completed: 55 },
    { name: '07/08', total: 67, completed: 62 },
  ],
  'month': [
    { name: 'Tuần 1', total: 200, completed: 180 },
    { name: 'Tuần 2', total: 250, completed: 230 },
    { name: 'Tuần 3', total: 220, completed: 200 },
    { name: 'Tuần 4', total: 300, completed: 280 },
  ]
};

const ORDER_STATUS = [
  { name: 'Hoàn thành', value: 680 },
  { name: 'Đang xử lý', value: 120 },
  { name: 'Chờ thanh toán', value: 80 },
  { name: 'Đã hủy', value: 45 },
];

const PAYMENT_METHODS = [
  { name: 'COD', value: 450 },
  { name: 'Chuyển khoản', value: 320 },
  { name: 'Thẻ tín dụng', value: 120 },
  { name: 'Ví điện tử', value: 35 },
];

const SHIPPING_METHODS = [
  { name: 'Giao hàng tiêu chuẩn', value: 600 },
  { name: 'Giao hàng hỏa tốc', value: 250 },
  { name: 'Nhận tại cửa hàng', value: 75 },
];

const LOCATION_DATA = [
  { name: 'TP.HCM', value: 450 },
  { name: 'Hà Nội', value: 320 },
  { name: 'Đà Nẵng', value: 120 },
  { name: 'Đồng Nai', value: 85 },
  { name: 'Bình Dương', value: 65 },
];

const TOP_ORDERS = [
  { id: '#ORD-0012', customer: 'Nguyễn Văn A', items: 3, total: '45,000,000 ₫', status: 'Hoàn thành', date: '07/08/2026' },
  { id: '#ORD-0084', customer: 'Trần Thị B', items: 5, total: '32,500,000 ₫', status: 'Đang xử lý', date: '07/08/2026' },
  { id: '#ORD-0105', customer: 'Lê Văn C', items: 2, total: '28,000,000 ₫', status: 'Hoàn thành', date: '06/08/2026' },
  { id: '#ORD-0042', customer: 'Phạm Thị D', items: 1, total: '15,000,000 ₫', status: 'Đã hủy', date: '05/08/2026' },
  { id: '#ORD-0199', customer: 'Hoàng Văn E', items: 4, total: '12,500,000 ₫', status: 'Hoàn thành', date: '05/08/2026' },
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

export default function AdminOrdersReportPage() {
  const [timeRange, setTimeRange] = useState('7_days');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  const [status, setStatus] = useState('Tất cả trạng thái');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [payment, setPayment] = useState('Tất cả thanh toán');
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);

  const [shipping, setShipping] = useState('Tất cả vận chuyển');
  const [showShippingDropdown, setShowShippingDropdown] = useState(false);

  const [interval, setInterval] = useState('Ngày');
  const [showIntervalDropdown, setShowIntervalDropdown] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setShowTimeDropdown(name === 'time' ? !showTimeDropdown : false);
    setShowStatusDropdown(name === 'status' ? !showStatusDropdown : false);
    setShowPaymentDropdown(name === 'payment' ? !showPaymentDropdown : false);
    setShowShippingDropdown(name === 'shipping' ? !showShippingDropdown : false);
    setShowIntervalDropdown(name === 'interval' ? !showIntervalDropdown : false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
        setShowStatusDropdown(false);
        setShowPaymentDropdown(false);
        setShowShippingDropdown(false);
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Báo cáo đơn hàng</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Theo dõi tình trạng đơn hàng và hiệu suất giao nhận.</p>
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
          <div onClick={() => toggleDropdown('status')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{status}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showStatusDropdown ? 1 : 0, visibility: showStatusDropdown ? 'visible' : 'hidden', transform: showStatusDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showStatusDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả trạng thái', 'Hoàn thành', 'Đang xử lý', 'Chờ thanh toán', 'Đã hủy'].map((opt) => (
                <div key={opt} onClick={() => { setStatus(opt); setShowStatusDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: status === opt ? 'var(--bg-tertiary)' : 'transparent', color: status === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('payment')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{payment}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showPaymentDropdown ? 1 : 0, visibility: showPaymentDropdown ? 'visible' : 'hidden', transform: showPaymentDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showPaymentDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả thanh toán', 'COD', 'Chuyển khoản', 'Thẻ tín dụng', 'Ví điện tử'].map((opt) => (
                <div key={opt} onClick={() => { setPayment(opt); setShowPaymentDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: payment === opt ? 'var(--bg-tertiary)' : 'transparent', color: payment === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('shipping')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{shipping}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showShippingDropdown ? 1 : 0, visibility: showShippingDropdown ? 'visible' : 'hidden', transform: showShippingDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showShippingDropdown ? 'auto' : 'none',  position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              {['Tất cả vận chuyển', 'Giao tiêu chuẩn', 'Giao hỏa tốc', 'Nhận tại cửa hàng'].map((opt) => (
                <div key={opt} onClick={() => { setShipping(opt); setShowShippingDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: shipping === opt ? 'var(--bg-tertiary)' : 'transparent', color: shipping === opt ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {opt}
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tổng đơn hàng</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>925</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#2ecc71', fontWeight: 600 }}>+12.5%</span> vs tháng trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Hoàn thành</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>680</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            73.5% tổng đơn
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Đang xử lý</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>120</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Cần đóng gói
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Đã hủy</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>45</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Hủy bởi khách hàng
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tỷ lệ hủy</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>4.8%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#e74c3c', fontWeight: 600 }}>+0.5%</span> vs tháng trước
          </div>
        </Card>
        
        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>TG Xử lý TB</div>
          <div style={{ fontSize: '24px', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>4.2 giờ</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Từ lúc đặt đến lúc giao
          </div>
        </Card>
      </div>

      {/* Main Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        <Card style={{ padding: '24px', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Đơn hàng theo thời gian</h3>
            
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
              <LineChart data={ORDERS_DATA_MAP[timeRange]} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                <Line type="monotone" name="Tổng đơn" dataKey="total" stroke="#3498db" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" name="Hoàn thành" dataKey="completed" stroke="#2ecc71" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Trạng thái đơn hàng</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ORDER_STATUS}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ORDER_STATUS.map((entry, index) => (
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

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Phương thức thanh toán</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PAYMENT_METHODS} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Đơn hàng" fill="#34495e" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Main Charts Row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Đơn vị vận chuyển</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SHIPPING_METHODS} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Đơn hàng" fill="#9b59b6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Tỉnh thành giao hàng</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LOCATION_DATA} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="value" name="Đơn hàng" fill="#e67e22" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Main Charts Row 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--text-primary)' }}>Top đơn hàng giá trị cao</h3>
          <div style={{ flex: 1, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Mã ĐH</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Khách hàng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Số SP</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Tổng tiền</th>
                  <th style={{ padding: '12px 16px', fontWeight: 500 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {TOP_ORDERS.map((order, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--accent)', fontWeight: 500 }}>{order.id}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      <div>{order.customer}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.date}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{order.items}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{order.total}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 500,
                        backgroundColor: order.status === 'Hoàn thành' ? 'rgba(46, 204, 113, 0.1)' : 
                                         order.status === 'Đang xử lý' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                        color: order.status === 'Hoàn thành' ? '#2ecc71' : 
                               order.status === 'Đang xử lý' ? '#3498db' : '#e74c3c',
                      }}>
                        {order.status}
                      </span>
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
