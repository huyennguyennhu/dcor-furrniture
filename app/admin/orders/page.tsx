'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Printer, Package, AlertCircle, CheckCircle2, FileText, Truck, CreditCard } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';

interface OrderProduct {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  products: OrderProduct[];
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  paymentMethod: string;
  showroom: string;
  createdAt: string;
  isGift: boolean;
  giftMessage?: string;
  hidePrice: boolean;
  isHighValue?: boolean;
}

const mockOrders: Order[] = [
  {
    id: 'DCOR-ORD-001',
    customerName: 'Nguyễn Văn Minh',
    phone: '0901234567',
    address: '239 Hoàng Diệu, Phường 8, Quận 4, Tp. Hồ Chí Minh',
    products: [
      { name: 'Sofa Indivi 2,5 chỗ (Chân gỗ sồi, vải nỉ Copenhagen nâu)', sku: 'SF-IND-01', quantity: 1, price: 51290000 }
    ],
    totalAmount: 51290000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Chuyển khoản',
    showroom: 'Showroom Quận 1',
    createdAt: '2026-06-14 10:30',
    isGift: false,
    hidePrice: false,
    isHighValue: false,
  },
  {
    id: 'DCOR-ORD-002',
    customerName: 'Lê Thu Trang',
    phone: '0912345678',
    address: 'Khu công nghệ cao, Quận 9, Tp. Hồ Chí Minh',
    products: [
      { name: 'Sofa Indivi 3 chỗ (Chân thép, da Napoli đen)', sku: 'SF-IND-02', quantity: 1, price: 80000000 },
      { name: 'Bàn trà Coda', sku: 'TB-CODA-01', quantity: 1, price: 10000000 }
    ],
    totalAmount: 90000000,
    status: 'PROCESSING',
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Tiền mặt',
    showroom: 'Showroom Thủ Đức',
    createdAt: '2026-06-13 15:45',
    isGift: true,
    giftMessage: 'Chúc mừng tân gia em gái! Chúc gia đình luôn hạnh phúc.',
    hidePrice: true,
    isHighValue: true,
  },
  {
    id: 'DCOR-ORD-003',
    customerName: 'Trần Đại Quang',
    phone: '0933445566',
    address: '12 Nguyễn Huệ, Quận 1, Tp. Hồ Chí Minh',
    products: [
      { name: 'Bàn ăn 6 ghế Gỗ Sồi', sku: 'TB-OAK-06', quantity: 1, price: 25000000 }
    ],
    totalAmount: 25000000,
    status: 'SHIPPING',
    paymentStatus: 'PAID',
    paymentMethod: 'Thẻ tín dụng',
    showroom: 'Kho Tổng',
    createdAt: '2026-06-12 09:00',
    isGift: false,
    hidePrice: false,
    isHighValue: false,
  },
  {
    id: 'DCOR-ORD-004',
    customerName: 'Phạm Thị Hương',
    phone: '0988776655',
    address: '45 Lê Lợi, Quận 1, Tp. Hồ Chí Minh',
    products: [
      { name: 'Giường ngủ thông minh 1m8', sku: 'BD-SMART-18', quantity: 1, price: 125000000 }
    ],
    totalAmount: 125000000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'Trả góp',
    showroom: 'Showroom Quận 1',
    createdAt: '2026-06-15 14:20',
    isGift: false,
    hidePrice: false,
    isHighValue: true,
  }
];

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  
  const [activePrintOrder, setActivePrintOrder] = useState<Order | null>(null);

  const statusFilters = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PENDING', label: 'Chờ xác nhận', count: orders.filter(o => o.status === 'PENDING').length },
    { id: 'PROCESSING', label: 'Đang xử lý', count: orders.filter(o => o.status === 'PROCESSING').length },
    { id: 'SHIPPING', label: 'Đang vận chuyển', count: orders.filter(o => o.status === 'SHIPPING').length },
    { id: 'DELIVERED', label: 'Hoàn tất' },
    { id: 'CANCELLED', label: 'Đã hủy' },
    { id: 'HIGH_VALUE', label: 'Đơn giá trị lớn', count: orders.filter(o => o.isHighValue).length }
  ];

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const handlePrint = (order: Order) => {
    setActivePrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Filter Data
  const filteredOrders = orders.filter(order => {
    if (activeStatus === 'ALL') return true;
    if (activeStatus === 'HIGH_VALUE') return order.isHighValue;
    return order.status === activeStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span style={{ padding: '4px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Chờ xác nhận</span>;
      case 'PROCESSING': return <span style={{ padding: '4px 8px', background: '#dbeafe', color: '#2563eb', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang xử lý</span>;
      case 'SHIPPING': return <span style={{ padding: '4px 8px', background: '#f3e8ff', color: '#9333ea', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đang vận chuyển</span>;
      case 'DELIVERED': return <span style={{ padding: '4px 8px', background: '#d1fae5', color: '#059669', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Hoàn tất</span>;
      case 'CANCELLED': return <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Đã hủy</span>;
      default: return null;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <span style={{ color: '#059669', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12}/> Đã thanh toán</span>;
      case 'UNPAID': return <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12}/> Chưa thanh toán</span>;
      case 'PARTIAL': return <span style={{ color: '#d97706', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12}/> Đã cọc</span>;
      default: return null;
    }
  };

  const columns = [
    { 
      key: 'id', 
      header: 'Mã đơn', 
      width: '1%',
      render: (item: any) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>{item.id}</span>
          {item.isHighValue && <div style={{ fontSize: '11px', color: '#d97706', marginTop: '4px', fontWeight: 600 }}>ĐƠN LỚN</div>}
        </div>
      )
    },
    { 
      key: 'customer', 
      header: 'Khách hàng',
      render: (item: any) => (
        <div>
          <div style={{ fontWeight: 600 }}>{item.customerName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.phone}</div>
        </div>
      )
    },
    { key: 'createdAt', header: 'Ngày đặt', width: '1%' },

    { 
      key: 'totalAmount', 
      header: 'Tổng tiền', 
      width: '1%',
      render: (item: any) => <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatVND(item.totalAmount)}</span>
    },
    { 
      key: 'paymentStatus', 
      header: 'Thanh toán', 
      width: '1%',
      render: (item: any) => (
        <div>
          {getPaymentBadge(item.paymentStatus)}
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{item.paymentMethod}</div>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'Trạng thái', 
      width: '1%',
      render: (item: any) => getStatusBadge(item.status)
    },
    { key: 'showroom', header: 'Showroom xử lý', width: '1%' },
    { 
      key: 'actions', 
      header: 'Thao tác', 
      width: '1%',
      align: 'center' as const,
      render: (item: any) => (
        <button 
          onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500 }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Printer size={14} /> In phiếu
        </button>
      )
    }
  ];

  return (
    <div>
      <div className="no-print">
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Danh sách đơn hàng</h2>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Tổng đơn hàng', value: orders.length, icon: <FileText size={20} color="var(--accent)" />, bg: 'var(--bg-primary)' },
                { label: 'Chờ xác nhận', value: orders.filter(o => o.status === 'PENDING').length, icon: <AlertCircle size={20} color="#d97706" />, bg: '#fffbeb' },
                { label: 'Đang vận chuyển', value: orders.filter(o => o.status === 'SHIPPING').length, icon: <Truck size={20} color="#2563eb" />, bg: '#eff6ff' },
                { label: 'Cần xác minh', value: orders.filter(o => o.isHighValue).length, icon: <CreditCard size={20} color="#dc2626" />, bg: '#fef2f2' },
              ].map((stat, idx) => (
                <div key={idx} style={{ background: stat.bg, padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{stat.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
                  </div>
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
                    fontSize: '13px',
                    fontWeight: activeStatus === filter.id ? 600 : 500,
                    background: activeStatus === filter.id ? 'var(--text-primary)' : 'var(--bg-primary)',
                    color: activeStatus === filter.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${activeStatus === filter.id ? 'var(--text-primary)' : 'var(--border-color)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
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
                <input type="text" placeholder="Tìm theo mã đơn, SĐT..." style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
              </div>
              <CustomSelect 
                options={[
                  { label: 'Tất cả Showroom', value: 'ALL' },
                  { label: 'Showroom Quận 1', value: 'Q1' },
                  { label: 'Showroom Thủ Đức', value: 'TD' },
                  { label: 'Kho Tổng', value: 'KT' }
                ]}
                value="ALL"
                onChange={() => {}}
                style={{ width: '180px' }}
              />
              <CustomSelect 
                options={[
                  { label: 'Tất cả trạng thái', value: 'ALL' },
                  { label: 'Đã thanh toán', value: 'PAID' },
                  { label: 'Đã cọc', value: 'PARTIAL' },
                  { label: 'Chưa thanh toán', value: 'UNPAID' }
                ]}
                value="ALL"
                onChange={() => {}}
                style={{ width: '180px' }}
              />
              <CustomSelect 
                options={[
                  { label: 'Tất cả phương thức', value: 'ALL' },
                  { label: 'Tiền mặt', value: 'CASH' },
                  { label: 'Chuyển khoản', value: 'BANK' },
                  { label: 'Thẻ tín dụng', value: 'CREDIT' },
                  { label: 'Trả góp', value: 'INSTALLMENT' }
                ]}
                value="ALL"
                onChange={() => {}}
                style={{ width: '180px' }}
              />
            </div>

            {/* Data Table */}
            <DataTable 
              columns={columns}
              data={filteredOrders}
              onRowClick={(item) => router.push(`/admin/orders/${item.id}`)}
            />
      </div>

      {activePrintOrder && (
        <div className="print-only" style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#000', backgroundColor: '#fff', position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 9999 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ fontSize: '28px', margin: 0, fontWeight: 'bold' }}>DCOR STUDIO SOFA</h1>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Đồ án: Lập trình Web nâng cao - Đại học UEL</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>PHIẾU GIAO LẮP SẢN PHẨM</h2>
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>Mã đơn: {activePrintOrder.id}</p>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>1. THÔNG TIN GIAO NHẬN</h3>
            <p style={{ margin: '6px 0' }}><strong>Khách hàng người nhận:</strong> {activePrintOrder.customerName}</p>
            <p style={{ margin: '6px 0' }}><strong>Số điện thoại:</strong> {activePrintOrder.phone}</p>
            <p style={{ margin: '6px 0' }}><strong>Địa chỉ giao hàng:</strong> {activePrintOrder.address}</p>
            {activePrintOrder.isGift && (
              <div style={{ margin: '15px 0', padding: '10px', border: '1px dashed #000', background: '#f9f9f9' }}>
                <strong>Lời nhắn quà tặng gửi kèm:</strong> <br />
                <em style={{ fontSize: '13px' }}>"{activePrintOrder.giftMessage}"</em>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '5px', marginBottom: '10px' }}>2. DANH SÁCH CHI TIẾT SẢN PHẨM</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>
                  <th style={{ padding: '8px 0' }}>Nội dung sản phẩm tùy biến</th>
                  <th style={{ padding: '8px 0', textAlign: 'center' }}>Số lượng</th>
                  <th style={{ padding: '8px 0', textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {activePrintOrder.products.map((prod, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '12px 0' }}>
                      {prod.name} <br />
                      <small style={{ color: '#666' }}>SKU: {prod.sku}</small>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'center' }}>{prod.quantity}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                      {activePrintOrder.hidePrice ? '*** (Đơn quà tặng)' : formatVND(prod.price * prod.quantity)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #ddd' }}>Tổng cộng:</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #ddd' }}>
                    {activePrintOrder.hidePrice ? '***' : formatVND(activePrintOrder.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 60px 0' }}><strong>Đại diện DCor Studio (Ký, ghi rõ họ tên)</strong></p>
              <p style={{ borderBottom: '1px solid #ddd', width: '150px', margin: '0 auto' }}></p>
            </div>
            <div style={{ width: '45%', textAlign: 'center' }}>
              <p style={{ margin: '0 0 60px 0' }}><strong>Khách hàng nhận bàn giao (Ký, ghi rõ họ tên)</strong></p>
              <p style={{ borderBottom: '1px solid #ddd', width: '150px', margin: '0 auto' }}></p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background-color: #fff !important;
            color: #000 !important;
            padding-top: 0 !important;
          }
          .no-print, header, footer {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
