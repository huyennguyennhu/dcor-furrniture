'use client';

import React, { useState } from 'react';
import { ArrowLeft, Search, Plus, Save, Trash2, Calendar, Settings, Clock, Tag, BarChart2, History, Info, Edit, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import DataTable from '@/components/admin/DataTable';

interface CampaignProduct {
  id: string;
  sku: string;
  name: string;
  originalPrice: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  finalPrice: number;
  stock: number;
  status: string;
}

const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const MOCK_PRODUCTS: CampaignProduct[] = [
  { id: '1', sku: 'SF-LUN-03', name: 'Sofa Luna (3 chỗ)', originalPrice: 15000000, discountType: 'PERCENT', discountValue: 20, finalPrice: 12000000, stock: 15, status: 'Đang bán' },
  { id: '2', sku: 'TB-OAK-01', name: 'Bàn ăn Gỗ Sồi nguyên khối', originalPrice: 12500000, discountType: 'PERCENT', discountValue: 10, finalPrice: 11250000, stock: 8, status: 'Đang bán' },
  { id: '3', sku: 'BD-SMART-18', name: 'Giường ngủ thông minh 1m8', originalPrice: 18000000, discountType: 'FIXED', discountValue: 3000000, finalPrice: 15000000, stock: 5, status: 'Hết hàng' },
  { id: '4', sku: 'CB-GLS-04', name: 'Tủ quần áo cánh kính 4 buồng', originalPrice: 22000000, discountType: 'PERCENT', discountValue: 15, finalPrice: 18700000, stock: 3, status: 'Đang bán' },
];

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [products, setProducts] = useState<CampaignProduct[]>(MOCK_PRODUCTS);
  const [activeTab, setActiveTab] = useState('PRODUCTS'); // PRODUCTS, OVERVIEW

  const handleDiscountChange = (id: string, type: 'PERCENT' | 'FIXED', value: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const finalPrice = type === 'PERCENT' ? p.originalPrice * (1 - value / 100) : p.originalPrice - value;
        return { ...p, discountType: type, discountValue: value, finalPrice: Math.max(0, finalPrice) };
      }
      return p;
    }));
  };

  const columns = [
    { 
      key: 'product', 
      header: 'Sản phẩm', 
      render: (item: CampaignProduct) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SKU: {item.sku}</div>
        </div>
      ) 
    },
    { 
      key: 'originalPrice', 
      header: 'Giá gốc', 
      render: (item: CampaignProduct) => <div style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatVND(item.originalPrice)}</div>
    },
    { 
      key: 'discountConfig', 
      header: 'Cấu hình giảm', 
      width: '200px',
      render: (item: CampaignProduct) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={item.discountType} 
            onChange={(e) => handleDiscountChange(item.id, e.target.value as any, item.discountValue)}
            className="admin-input"
            style={{ width: '80px', padding: '6px', fontSize: '12px', height: '32px' }}
          >
            <option value="PERCENT">%</option>
            <option value="FIXED">VNĐ</option>
          </select>
          <input 
            type="number" 
            value={item.discountValue}
            onChange={(e) => handleDiscountChange(item.id, item.discountType, Number(e.target.value))}
            className="admin-input"
            style={{ width: '90px', padding: '6px', fontSize: '12px', height: '32px' }}
          />
        </div>
      )
    },
    { 
      key: 'finalPrice', 
      header: 'Giá sau giảm', 
      render: (item: CampaignProduct) => <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatVND(item.finalPrice)}</div>
    },
    { 
      key: 'stock', 
      header: 'Tồn kho & Trạng thái', 
      render: (item: CampaignProduct) => (
        <div style={{ textAlign: 'left', fontSize: '13px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.stock}</div>
          <div style={{ color: item.status === 'Hết hàng' ? '#ef4444' : '#059669', fontSize: '12px' }}>{item.status}</div>
        </div>
      )
    },
    { 
      key: 'action', 
      header: '', 
      width: '1%', 
      render: (item: CampaignProduct) => (
        <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <Trash2 size={16} />
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <Link href="/admin/promotions/campaigns" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', marginTop: '4px' }}>
          <ArrowLeft size={18} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: '1px solid var(--border-color)' }}>
              Mã: {resolvedParams.id}
            </span>
            <span style={{ padding: '4px 10px', background: '#ecfdf5', color: '#059669', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>Đang diễn ra</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>Mùa thu Bắc Âu - Giảm đến 30%</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> 01/09/2026 - 30/09/2026</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Tag size={14} /> Tự động giảm giá theo danh mục</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/admin/promotions/campaigns/create`} className="admin-btn admin-btn-secondary" style={{ textDecoration: 'none' }}>
            <Settings size={16} /> Chỉnh sửa cấu hình
          </Link>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('PRODUCTS')}
          style={{ padding: '12px 0', fontSize: '14px', fontWeight: 600, color: activeTab === 'PRODUCTS' ? 'var(--accent)' : 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: activeTab === 'PRODUCTS' ? '2px solid var(--accent)' : '2px solid transparent' }}
        >
          Sản phẩm tham gia ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('OVERVIEW')}
          style={{ padding: '12px 0', fontSize: '14px', fontWeight: 600, color: activeTab === 'OVERVIEW' ? 'var(--accent)' : 'var(--text-secondary)', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: activeTab === 'OVERVIEW' ? '2px solid var(--accent)' : '2px solid transparent' }}
        >
          Hiệu quả & Lịch sử
        </button>
      </div>

      {/* TAB CONTENT: PRODUCTS */}
      {activeTab === 'PRODUCTS' && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Danh sách sản phẩm trong chiến dịch</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Tìm sản phẩm..." style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontSize: '13px', width: '250px', outline: 'none' }} />
              </div>
              <button className="admin-btn admin-btn-secondary" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                <Plus size={16} /> Thêm sản phẩm
              </button>
              <button className="admin-btn admin-btn-primary">
                <Save size={16} /> Lưu giá
              </button>
            </div>
          </div>
          
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <DataTable data={products} columns={columns} />
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* HIỆU QUẢ */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Hiệu quả chiến dịch</h3>
              </div>
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng số đơn hàng</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>152</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sản phẩm bán ra</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>348</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Giá trị đơn hàng TB</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>18.5M</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 1' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tổng giá trị ưu đãi đã cấp</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>85.000.000 ₫</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Doanh thu mang lại</span>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>1.250.000.000 ₫</span>
                </div>
              </div>
            </div>

            {/* ĐIỀU KIỆN */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Cấu hình & Điều kiện áp dụng</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Hình thức ưu đãi</span>
                  <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600 }}>Giảm theo % (Cấu hình riêng theo SP)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Phạm vi áp dụng</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Collection Sofa, Collection Giường ngủ</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Loại trừ</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Sản phẩm Custom (Đặt riêng)</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Giá trị đơn tối thiểu</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Không yêu cầu</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Ngân sách khuyến mãi</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Tối đa 150.000.000 ₫</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px', alignItems: 'start' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>Luật kết hợp</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#059669" /> Được phép áp dụng chung với Mã giảm giá
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* LỊCH SỬ */}
            <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--text-secondary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Lịch sử & Hoạt động</h3>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <Edit size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Chỉnh sửa bởi <span style={{ fontWeight: 600 }}>marketing@dcor.vn</span></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>02/09/2026 14:00</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>Thêm 5 sản phẩm mới vào danh sách giảm giá.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Khởi tạo bởi <span style={{ fontWeight: 600 }}>admin@dcor.vn</span></div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>25/08/2026 10:30</div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
