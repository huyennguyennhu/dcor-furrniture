'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Package, Clock, Filter, Search, Plus, ArrowRightLeft, RefreshCcw } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';
import TransactionModal from '@/components/admin/TransactionModal';

// Mock data interfaces
interface VariantStock {
  id: string;
  name: string;
  physical: number;
  reserved: number;
  available: number;
}

interface StockHistory {
  id: string;
  date: string;
  type: 'IMPORT' | 'EXPORT' | 'TRANSFER';
  variantName: string;
  quantity: number;
  reason: string;
  user: string;
}

export default function InventoryProductDetail() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const variantParam = searchParams?.get('variant');
  
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<VariantStock[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'variants' | 'history'>(tabParam === 'history' ? 'history' : 'variants');
  const [historyFilterVariant, setHistoryFilterVariant] = useState<string>(variantParam || 'Tất cả');
  const [isLoading, setIsLoading] = useState(true);

  // States cho Transaction Modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'import' | 'export';
    initialProductId: string;
    initialVariantId: string;
    isProductFixed: boolean;
    isVariantFixed: boolean;
  }>({
    isOpen: false,
    type: 'import',
    initialProductId: '',
    initialVariantId: '',
    isProductFixed: false,
    isVariantFixed: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch basic product info
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setAllProducts(data);
        
        const p = data.find((item: any) => item.id === productId);
        
        if (p) {
          setProduct(p);
        } else {
          // Fallback if product not found in current page
          setProduct({
            id: productId,
            name: 'Sản phẩm đang tải...',
            slug: productId,
            images: []
          });
        }

        // Mock Variants Data
        const mockVariants: VariantStock[] = [
          { id: 'v1', name: 'Màu Trắng, Gỗ sồi', physical: 12, reserved: 2, available: 10 },
          { id: 'v2', name: 'Màu Đen, Khung thép', physical: 5, reserved: 0, available: 5 },
          { id: 'v3', name: 'Màu Xám, Bọc da', physical: 0, reserved: 0, available: 0 },
          { id: 'v4', name: 'Màu Xanh, Khung thép', physical: 8, reserved: 4, available: 4 },
        ];
        setVariants(mockVariants);

        // Mock History Data
        const mockHistory: StockHistory[] = [
          { id: 'h1', date: '2026-08-20 14:30', type: 'IMPORT', variantName: 'Màu Trắng, Gỗ sồi', quantity: 15, reason: 'Nhập hàng đợt 1 tháng 8', user: 'Admin' },
          { id: 'h2', date: '2026-08-22 09:15', type: 'EXPORT', variantName: 'Màu Trắng, Gỗ sồi', quantity: 3, reason: 'Xuất bán khách lẻ', user: 'Staff_HCM' },
          { id: 'h3', date: '2026-08-23 11:00', type: 'TRANSFER', variantName: 'Màu Đen, Khung thép', quantity: 2, reason: 'Chuyển sang Kho HN', user: 'Admin' },
          { id: 'h4', date: '2026-08-24 16:45', type: 'EXPORT', variantName: 'Màu Xanh, Khung thép', quantity: 4, reason: 'Giữ chỗ đơn hàng #1024', user: 'System' },
        ];
        setHistory(mockHistory);
        
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [productId]);

  const totalPhysical = variants.reduce((acc, v) => acc + v.physical, 0);
  const totalReserved = variants.reduce((acc, v) => acc + v.reserved, 0);
  const totalAvailable = variants.reduce((acc, v) => acc + v.available, 0);

  const getHistoryTypeBadge = (type: string) => {
    switch (type) {
      case 'IMPORT': return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}><Plus size={14} /> Nhập kho</span>;
      case 'EXPORT': return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626', background: '#fee2e2', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}><ArrowRightLeft size={14} /> Xuất kho</span>;
      case 'TRANSFER': return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c', background: '#ffedd5', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}><RefreshCcw size={14} /> Chuyển kho</span>;
      default: return null;
    }
  };

  if (isLoading || !product) {
    return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* HEADER & BREADCRUMB */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => router.push('/admin/inventory')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content' }}
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Quay lại danh sách Tồn kho</span>
          </button>
          
          <div style={{ width: '300px' }}>
            <CustomSelect
              options={allProducts.map(p => ({ value: p.id, label: p.name }))}
              value={productId}
              onChange={(newId) => router.push(`/admin/inventory/product/${newId}`)}
              placeholder="Chuyển nhanh sản phẩm khác..."
              searchable
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {(product.images && product.images.length > 0) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Package size={32} color="var(--text-muted)" />
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                {product.name}
              </h1>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
                <span>Mã SKU: <strong style={{ color: 'var(--text-primary)' }}>{product.slug?.toUpperCase().substring(0, 8)}</strong></span>
                <span>•</span>
                <span>Danh mục: <strong style={{ color: 'var(--text-primary)' }}>{product.category || 'N/A'}</strong></span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="admin-btn admin-btn-secondary" onClick={() => setModalConfig({ isOpen: true, type: 'export', initialProductId: product.id, initialVariantId: '', isProductFixed: true, isVariantFixed: false })}>
              <ArrowRightLeft size={16} /> Chuyển kho / Xuất
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => setModalConfig({ isOpen: true, type: 'import', initialProductId: product.id, initialVariantId: '', isProductFixed: true, isVariantFixed: false })}>
              <Plus size={16} /> Nhập kho
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Tổng Tồn thực tế</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{totalPhysical}</span>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Đang giữ chỗ</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{totalReserved}</span>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Có thể bán</span>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{totalAvailable}</span>
        </div>
      </div>

      {/* TABS CONTENT */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('variants')}
            style={{ 
              padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              borderBottom: activeTab === 'variants' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'variants' ? 'var(--accent)' : 'var(--text-muted)'
            }}
          >
            <Package size={18} /> Chi tiết từng biến thể
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              padding: '16px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
              borderBottom: activeTab === 'history' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'history' ? 'var(--accent)' : 'var(--text-muted)'
            }}
          >
            <Clock size={18} /> Lịch sử biến động
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div style={{ padding: '20px' }}>
          
          {activeTab === 'variants' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '300px' }}>
                  <input type="text" placeholder="Tìm biến thể..." className="admin-input" style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                  <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>
              
              <DataTable
                columns={[
                  { key: 'name', header: 'Biến thể (Màu sắc / Chất liệu)' },
                  { key: 'physical', header: 'Tồn thực tế', align: 'center', render: (item) => <span style={{ fontWeight: 600 }}>{item.physical}</span> },
                  { key: 'reserved', header: 'Đang giữ chỗ', align: 'center', render: (item) => <span style={{ fontWeight: 600, color: '#f59e0b' }}>{item.reserved}</span> },
                  { key: 'available', header: 'Có thể bán', align: 'center', render: (item) => <span style={{ fontWeight: 600, color: '#10b981' }}>{item.available}</span> },
                ]}
                data={variants}
                pageSize={10}
                actions={(item) => (
                  <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                    <div 
                      onClick={() => setModalConfig({ isOpen: true, type: 'import', initialProductId: product.id, initialVariantId: item.name, isProductFixed: true, isVariantFixed: false })}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} /> Nhập kho
                    </div>
                    <div 
                      onClick={() => setModalConfig({ isOpen: true, type: 'export', initialProductId: product.id, initialVariantId: item.name, isProductFixed: true, isVariantFixed: false })}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <ArrowRightLeft size={14} /> Xuất kho
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Lọc theo biến thể:</span>
                  <div style={{ width: '250px' }}>
                    <CustomSelect 
                      options={[
                        { value: 'Tất cả', label: 'Tất cả biến thể' },
                        ...Array.from(new Set([...variants.map(v => v.name), ...(variantParam ? [variantParam] : [])])).map(name => ({ value: name, label: name }))
                      ]}
                      value={historyFilterVariant}
                      onChange={setHistoryFilterVariant}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="admin-btn admin-btn-secondary" style={{ padding: '8px 16px' }}>
                    <Filter size={16} /> Lọc thời gian
                  </button>
                </div>
              </div>

              <DataTable
                columns={[
                  { key: 'date', header: 'Thời gian', width: '15%' },
                  { key: 'type', header: 'Loại', width: '15%', render: (item) => getHistoryTypeBadge(item.type) },
                  { key: 'variantName', header: 'Biến thể', width: '25%' },
                  { key: 'quantity', header: 'Số lượng', align: 'center', width: '10%', render: (item) => (
                      <span style={{ fontWeight: 600, color: item.type === 'IMPORT' ? '#166534' : (item.type === 'EXPORT' ? '#991b1b' : '#3730a3') }}>
                        {item.type === 'IMPORT' ? '+' : (item.type === 'EXPORT' ? '-' : '')}{item.quantity}
                      </span>
                  )},
                  { key: 'reason', header: 'Lý do / Ghi chú' },
                  { key: 'user', header: 'Người thực hiện', width: '15%' },
                ]}
                data={historyFilterVariant === 'Tất cả' ? history : history.filter(h => h.variantName === historyFilterVariant)}
                pageSize={10}
              />
            </div>
          )}

        </div>
      </div>

      <TransactionModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        products={allProducts}
        initialProductId={modalConfig.initialProductId}
        initialVariantId={modalConfig.initialVariantId}
        isProductFixed={modalConfig.isProductFixed}
        isVariantFixed={modalConfig.isVariantFixed}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onSubmit={(data) => {
          console.log('Submitted transaction:', data);
          alert('Tính năng đang phát triển: Đã ghi nhận logic!');
          setModalConfig({ ...modalConfig, isOpen: false });
        }}
      />
    </div>
  );
}
