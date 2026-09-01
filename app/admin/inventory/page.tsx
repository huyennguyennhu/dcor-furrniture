'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Plus, Search, Filter, ArrowRightLeft, ArrowUpRight, ArrowDownRight, MoreHorizontal, Image as ImageIcon, X } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import CustomSelect from '@/components/admin/CustomSelect';
import TransactionModal from '@/components/admin/TransactionModal';
import { addInventoryTransaction } from '@/lib/data/inventoryHistory';

export default function InventoryPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // States cho Dropdown Location
  const [locationFilter, setLocationFilter] = useState('Tất cả chi nhánh');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationOptions = ['Tất cả chi nhánh', 'Kho Tổng (TP.HCM)', 'Showroom Quận 1', 'Kho Hà Nội'];

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

  // State for nested table dropdowns
  const [openVariantDropdown, setOpenVariantDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Check if click was inside a dropdown button or menu
      const target = e.target as HTMLElement;
      if (!target.closest('.variant-dropdown-wrapper')) {
        setOpenVariantDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error('Failed to fetch');
        const products = await res.json();
        
        // Mock inventory data based on real products
        const inventoryData = products.map((p: any, index: number) => {
          const physicalStock = (index % 5 + 1) * 15;
          const reservedStock = index % 3 === 0 ? 5 : 0;
          const availableStock = physicalStock - reservedStock;
          const threshold = 20;
          
          let status = 'Tốt';
          if (availableStock <= 0) status = 'Hết hàng';
          else if (availableStock <= threshold) status = 'Sắp hết';

          return {
            id: p.id,
            sku: p.slug?.toUpperCase().substring(0, 8) || 'N/A',
            productName: p.name || 'Sản phẩm không tên',
            category: p.category || 'N/A',
            image: (p.images && p.images.length > 0) ? p.images[0] : '',
            location: index % 2 === 0 ? 'Kho Tổng (TP.HCM)' : 'Showroom Quận 1',
            physicalStock,
            reservedStock,
            availableStock,
            threshold,
            status
          };
        });
        
        setData(inventoryData);
      } catch (err) {
        console.error('Error fetching products for inventory:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const columns = [
    {
      key: 'product',
      header: 'Sản phẩm',
      render: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            {item.image ? (
              <img src={item.image} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <ImageIcon size={16} color="var(--text-muted)" />
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.productName}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.category}</span>
          </div>
        </div>
      )
    },
    { key: 'physicalStock', header: 'Tồn thực tế', sortable: true, align: 'center' },
    { key: 'reservedStock', header: 'Đang giữ chỗ', sortable: true, align: 'center' },
    { key: 'availableStock', header: 'Có thể bán', sortable: true, align: 'center', render: (item: any) => <span style={{ fontWeight: 600 }}>{item.availableStock}</span> },
    { key: 'threshold', header: 'Cảnh báo', align: 'center' },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item: any) => {
        const val = item.status;
        let bg = 'rgba(34, 197, 94, 0.1)';
        let color = 'rgb(34, 197, 94)';
        if (val === 'Sắp hết') {
          bg = 'rgba(234, 179, 8, 0.1)';
          color = 'rgb(234, 179, 8)';
        } else if (val === 'Hết hàng') {
          bg = 'rgba(239, 68, 68, 0.1)';
          color = 'rgb(239, 68, 68)';
        }
        return (
          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, background: bg, color: color }}>
            {val}
          </span>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Quản lý tồn kho</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Theo dõi và quản lý số lượng sản phẩm trên toàn hệ thống.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="admin-btn admin-btn-secondary" onClick={() => setModalConfig({ isOpen: true, type: 'export', initialProductId: '', initialVariantId: '', isProductFixed: false, isVariantFixed: false })}>
            <ArrowRightLeft size={16} /> Xuất kho
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => setModalConfig({ isOpen: true, type: 'import', initialProductId: '', initialVariantId: '', isProductFixed: false, isVariantFixed: false })}>
            <Plus size={16} /> Nhập kho
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Tổng Tồn kho', value: '12,450', sub: 'Toàn bộ hệ thống', icon: <Package size={20} color="var(--accent)" />, bg: 'var(--bg-primary)' },
          { label: 'Còn hàng', value: '1,200', sub: 'Mã SKU', icon: <Package size={20} color="rgb(34, 197, 94)" />, bg: 'rgba(34, 197, 94, 0.05)' },
          { label: 'Sắp hết', value: '45', sub: 'Cần nhập thêm', icon: <Package size={20} color="rgb(234, 179, 8)" />, bg: 'rgba(234, 179, 8, 0.05)' },
          { label: 'Hết hàng', value: '12', sub: 'Mã SKU', icon: <Package size={20} color="rgb(239, 68, 68)" />, bg: 'rgba(239, 68, 68, 0.05)' },
        ].map((stat, idx) => (
          <div key={idx} style={{ background: stat.bg, padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" placeholder="Tìm theo mã SKU, tên sản phẩm..." style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            onMouseDown={() => setShowLocationDropdown(!showLocationDropdown)}
            onBlur={() => setShowLocationDropdown(false)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', minWidth: '160px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Filter size={14} /> {locationFilter}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showLocationDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          
          {showLocationDropdown && (
            <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, padding: '4px' }}>
              {locationOptions.map(opt => (
                <div 
                  key={opt}
                  onMouseDown={() => { setLocationFilter(opt); setShowLocationDropdown(false); }}
                  style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: locationFilter === opt ? 'var(--accent)' : 'var(--text-primary)', fontWeight: locationFilter === opt ? 600 : 400 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {opt}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data}
        onSelectionChange={setSelectedIds}
        selectedIds={selectedIds}
        expandableContent={(item) => {
          // Mock data cho biến thể
          const variants = ['Màu Trắng, Gỗ sồi', 'Màu Đen, Khung thép', 'Màu Xám, Bọc da'].map((vName, idx) => {
            // Lấy tạm số tồn của sản phẩm chia đều
            const physical = Math.max(0, Math.floor((item.physicalStock || 15) / 3) + (idx === 0 ? (item.physicalStock || 15) % 3 : 0));
            const reserved = Math.max(0, Math.floor((item.reservedStock || 0) / 3));
            return { name: vName, physical, reserved, available: physical - reserved };
          });
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Chi tiết biến thể - {item.productName}</h4>
                <button 
                  onClick={() => router.push(`/admin/inventory/product/${item.id}`)}
                  style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  Xem chi tiết
                </button>
              </div>
              
              <table className="admin-table" style={{ background: 'white', borderRadius: '8px' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'var(--bg-primary)', padding: '12px' }}>Biến thể</th>
                    <th style={{ textAlign: 'center', background: 'var(--bg-primary)', padding: '12px' }}>Tồn thực tế</th>
                    <th style={{ textAlign: 'center', background: 'var(--bg-primary)', padding: '12px' }}>Đang giữ chỗ</th>
                    <th style={{ textAlign: 'center', background: 'var(--bg-primary)', padding: '12px' }}>Có thể bán</th>
                    <th style={{ textAlign: 'center', background: 'var(--bg-primary)', padding: '12px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => (
                    <tr key={idx} style={{ borderBottom: idx === variants.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <td style={{ fontSize: '13px', padding: '12px', color: 'var(--text-primary)' }}>{v.name}</td>
                      <td style={{ fontSize: '13px', textAlign: 'center', padding: '12px', color: 'var(--text-primary)' }}>{v.physical}</td>
                      <td style={{ fontSize: '13px', textAlign: 'center', padding: '12px', color: '#f59e0b' }}>{v.reserved}</td>
                      <td style={{ fontSize: '13px', textAlign: 'center', padding: '12px', fontWeight: 600, color: '#10b981' }}>{v.available}</td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        <div className="variant-dropdown-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenVariantDropdown(openVariantDropdown === `${item.id}-${idx}` ? null : `${item.id}-${idx}`);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openVariantDropdown === `${item.id}-${idx}` && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: '2px',
                                background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column'
                              }}
                            >
                              <div 
                                onClick={() => { setModalConfig({ isOpen: true, type: 'import', initialProductId: item.id, initialVariantId: v.name, isProductFixed: true, isVariantFixed: false }); setOpenVariantDropdown(null); }}
                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <Plus size={14} /> Nhập kho
                              </div>
                              <div 
                                onClick={() => { setModalConfig({ isOpen: true, type: 'export', initialProductId: item.id, initialVariantId: v.name, isProductFixed: true, isVariantFixed: false }); setOpenVariantDropdown(null); }}
                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <ArrowRightLeft size={14} /> Xuất kho
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
        actions={(item) => (
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div 
              onClick={() => setModalConfig({ isOpen: true, type: 'import', initialProductId: item.id, initialVariantId: '', isProductFixed: true, isVariantFixed: false })}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={14} /> Nhập kho
            </div>
            <div 
              onClick={() => setModalConfig({ isOpen: true, type: 'export', initialProductId: item.id, initialVariantId: '', isProductFixed: true, isVariantFixed: false })}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowRightLeft size={14} /> Xuất kho
            </div>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
            <div 
              onClick={() => alert('Tính năng đang phát triển')}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', whiteSpace: 'nowrap', borderRadius: '4px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Filter size={14} /> Chỉnh sửa cảnh báo
            </div>
          </div>
        )}
      />

      <TransactionModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        products={data}
        initialProductId={modalConfig.initialProductId}
        initialVariantId={modalConfig.initialVariantId}
        isProductFixed={modalConfig.isProductFixed}
        isVariantFixed={modalConfig.isVariantFixed}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onSubmit={(data) => {
          console.log('Submitted transaction:', data);
          
          // Tạo một giao dịch mới dựa trên dữ liệu form
          const newTx = addInventoryTransaction({
            productName: data.productName || 'Sản phẩm mới',
            sku: data.sku || 'SKU-NEW',
            variant: data.variant || 'Mặc định',
            type: modalConfig.type === 'import' ? 'Nhập kho' : 'Xuất kho',
            quantity: modalConfig.type === 'import' ? `+${data.quantity}` : `-${data.quantity}`,
            beforeStock: 0, // Mock value, in real app this comes from DB
            stockAfter: modalConfig.type === 'import' ? Number(data.quantity) : 0, 
            location: data.location || 'Showroom Thủ Đức',
            reason: data.note || 'Không có ghi chú'
          });

          setModalConfig({ ...modalConfig, isOpen: false });
          
          // Chuyển hướng sang trang lịch sử để xem ngay
          if (newTx) {
            router.push('/admin/inventory/history');
          }
        }}
      />
    </div>
  );
}
