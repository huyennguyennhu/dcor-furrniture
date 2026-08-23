'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Package, Tag, AlertCircle, TrendingUp, Search, Download, Plus, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  variants: number;
  price: number;
  stock: number;
  status: 'Đang bán' | 'Sắp hết' | 'Hết hàng' | 'Đã ẩn';
  image: string;
}

// No SAMPLE_PRODUCTS needed here

const SORT_LABELS: Record<string, string> = {
  'newest': 'Mới cập nhật',
  'price': 'Theo giá bán',
  'stock': 'Theo tồn kho',
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

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const mapped: Product[] = data.map((p: any) => ({
          id: p.id,
          sku: p.id,
          name: p.shortDescription_vi || p.shortDescription || p.productId,
          category: p.category || 'Khác',
          variants: p.variantsCount || 0,
          price: p.prices && p.prices[0] ? p.prices[0].price : 0,
          stock: Math.floor(Math.random() * 100), // Vẫn dùng dummy stock tạm nếu data không có
          status: 'Đang bán',
          image: p.images && p.images.length > 0 ? p.images[0] : ''
        }));
        setProducts(mapped);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products', err);
        setIsLoading(false);
      });
  }, []);
  
  // Custom Filter States
  const [activeSort, setActiveSort] = useState('newest');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('Tất cả danh mục');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (name: string) => {
    setShowSortDropdown(name === 'sort' ? !showSortDropdown : false);
    setShowCategoryDropdown(name === 'category' ? !showCategoryDropdown : false);
    setShowStatusDropdown(name === 'status' ? !showStatusDropdown : false);
    setShowBulkActions(name === 'bulk' ? !showBulkActions : false);
  };

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
        setShowCategoryDropdown(false);
        setShowStatusDropdown(false);
        setShowBulkActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Lọc dữ liệu
  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                        p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'Tất cả danh mục' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'Tất cả trạng thái' || p.status === statusFilter;
    
    return matchSearch && matchCategory && matchStatus;
  });

  // 2. Sắp xếp dữ liệu
  const sortedAndFiltered = [...filtered].sort((a, b) => {
    let result = 0;
    // Tạm dùng ID để xếp mới nhất nếu không có Ngày tạo
    if (activeSort === 'newest') result = b.id.localeCompare(a.id);
    if (activeSort === 'price') result = b.price - a.price;
    if (activeSort === 'stock') result = b.stock - a.stock;
    if (activeSort === 'a_z') result = a.name.localeCompare(b.name);
    
    return sortDirection === 'asc' ? -result : result;
  });

  const columns: Column<Product>[] = [
    {
      key: 'image',
      header: 'Hình ảnh',
      width: '1%',
      render: (item) => (
        <div style={{ width: '48px', height: '48px', padding: '5px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {item.image && <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />}
        </div>
      )
    },
    {
      key: 'product',
      header: 'Sản phẩm',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>
        </div>
      )
    },
    {
      key: 'variants',
      header: 'Biến thể',
      width: '1%',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.variants} loại</span>
      )
    },
    { 
      key: 'category', 
      header: 'Danh mục',
      width: '1%',
      render: (item) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.category}</span>
      )
    },
    { 
      key: 'price', 
      header: 'Giá từ',
      width: '1%',
      render: (item) => <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.price.toLocaleString('vi-VN')} ₫</span>
    },
    { 
      key: 'stock', 
      header: 'Tồn kho',
      width: '1%',
      render: (item) => (
        <span style={{ fontSize: '13px', color: item.stock === 0 ? '#ef4444' : item.stock < 10 ? '#f59e0b' : 'var(--text-primary)', fontWeight: item.stock < 10 ? 600 : 400 }}>
          {item.stock}
        </span>
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
          background: item.status === 'Đang bán' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'Hết hàng' ? 'rgba(239, 68, 68, 0.1)' : item.status === 'Sắp hết' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          color: item.status === 'Đang bán' ? '#10b981' : item.status === 'Hết hàng' ? '#ef4444' : item.status === 'Sắp hết' ? '#f59e0b' : '#64748b',
          whiteSpace: 'nowrap'
        }}>
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Quản lý sản phẩm</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Danh sách sản phẩm, giá bán và tình trạng tồn kho.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="admin-search-wrapper" style={{ width: '280px', padding: '10px 16px' }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm, mã SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <button className="admin-btn admin-btn-secondary">
            <Download size={16} /> Xuất
          </button>
          <button onClick={() => router.push('/admin/products/new')} className="admin-btn admin-btn-primary">
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Package size={20} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Tổng sản phẩm</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{products.length}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} /> +12 sản phẩm mới
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Tag size={20} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Đang bán</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{products.filter(p => p.status === 'Đang bán').length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Hiển thị trên website</div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <AlertCircle size={20} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Gần hết hàng</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{products.filter(p => p.stock > 0 && p.stock < 10).length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Tồn kho dưới 10</div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertCircle size={20} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Hết hàng</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{products.filter(p => p.stock === 0).length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Tồn kho bằng 0</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div ref={filterRef} className="admin-filter-bar" style={{ marginBottom: '24px' }}>
        
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
                <div key={key} onClick={() => { setActiveSort(key); setShowSortDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: activeSort === key ? 'var(--bg-tertiary)' : 'transparent', color: activeSort === key ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('category')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{categoryFilter}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showCategoryDropdown ? 1 : 0, visibility: showCategoryDropdown ? 'visible' : 'hidden', transform: showCategoryDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showCategoryDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
            {['Tất cả danh mục', 'Nội thất', 'Đèn', 'Phụ kiện'].map((opt) => (
              <div key={opt} onClick={() => { setCategoryFilter(opt); setShowCategoryDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: categoryFilter === opt ? 'var(--bg-tertiary)' : 'transparent', color: categoryFilter === opt ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div onClick={() => toggleDropdown('status')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{statusFilter}</span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>
          <div style={{ opacity: showStatusDropdown ? 1 : 0, visibility: showStatusDropdown ? 'visible' : 'hidden', transform: showStatusDropdown ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showStatusDropdown ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
            {['Tất cả trạng thái', 'Đang bán', 'Sắp hết', 'Hết hàng', 'Đã ẩn'].map((opt) => (
              <div key={opt} onClick={() => { setStatusFilter(opt); setShowStatusDropdown(false); }} style={{ padding: '10px 16px', fontSize: '12px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', background: statusFilter === opt ? 'var(--bg-tertiary)' : 'transparent', color: statusFilter === opt ? 'var(--accent)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {opt}
              </div>
            ))}
          </div>
        </div>

        {/* Bulk Actions - Only visible when items are selected */}
        {selectedProducts.size > 0 && (
          <div style={{ position: 'relative' }}>
            <div onClick={() => toggleDropdown('bulk')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '8px', cursor: 'pointer', color: 'white' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Thao tác ({selectedProducts.size})</span>
              <ChevronDown size={14} color="white" />
            </div>
            <div style={{ opacity: showBulkActions ? 1 : 0, visibility: showBulkActions ? 'visible' : 'hidden', transform: showBulkActions ? 'translateY(0)' : 'translateY(-10px)', transition: 'all 0.2s ease', pointerEvents: showBulkActions ? 'auto' : 'none', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--card-shadow)', zIndex: 10, width: '100%', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Ẩn {selectedProducts.size} SP</div>
              <div style={{ padding: '10px 16px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Hiện {selectedProducts.size} SP</div>
              <div style={{ padding: '10px 16px', fontSize: '13px', cursor: 'pointer', color: '#ef4444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Xóa {selectedProducts.size} SP</div>
            </div>
          </div>
        )}
        
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={sortedAndFiltered} 
          pageSize={10}
          selectable={true}
          selectedKeys={selectedProducts}
          onSelectionChange={setSelectedProducts}
          rowKey={(item) => item.id}
          onRowClick={(item) => router.push(`/admin/products/${item.id}`)}
        />
      )}

    </div>
  );
}
