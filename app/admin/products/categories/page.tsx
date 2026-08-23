'use client';

import React, { useState } from 'react';
import AdminPageTabs from '@/components/admin/AdminPageTabs';
import DataTable, { Column } from '@/components/admin/DataTable';
import FilterBar from '@/components/admin/FilterBar';
import Modal from '@/components/admin/Modal';
import { Trash2, Plus } from 'lucide-react';

const TABS = [
  { id: 'main', label: 'Danh mục chính', count: 8 },
  { id: 'room', label: 'Phòng', count: 5 },
  { id: 'collection', label: 'Collection', count: 12 },
  { id: 'style', label: 'Phong cách', count: 6 },
  { id: 'material', label: 'Chất liệu', count: 15 }
];

interface Category {
  id: string;
  name: string;
  slug: string;
  productsCount: number;
  status: 'Hiển thị' | 'Đã ẩn';
  order: number;
}

const SAMPLE_CATEGORIES: Record<string, Category[]> = {
  main: [
    { id: 'CAT-01', name: 'Sofa & Ghế bành', slug: 'sofa-ghe-banh', productsCount: 124, status: 'Hiển thị', order: 1 },
    { id: 'CAT-02', name: 'Bàn trà & Bàn góc', slug: 'ban-tra-ban-goc', productsCount: 86, status: 'Hiển thị', order: 2 },
    { id: 'CAT-03', name: 'Giường ngủ', slug: 'giuong-ngu', productsCount: 52, status: 'Đã ẩn', order: 3 },
  ],
  room: [
    { id: 'RM-01', name: 'Phòng khách', slug: 'phong-khach', productsCount: 150, status: 'Hiển thị', order: 1 },
    { id: 'RM-02', name: 'Phòng ăn', slug: 'phong-an', productsCount: 85, status: 'Hiển thị', order: 2 },
    { id: 'RM-03', name: 'Phòng ngủ', slug: 'phong-ngu', productsCount: 120, status: 'Hiển thị', order: 3 },
    { id: 'RM-04', name: 'Phòng làm việc', slug: 'phong-lam-viec', productsCount: 45, status: 'Hiển thị', order: 4 },
    { id: 'RM-05', name: 'Ngoài trời', slug: 'ngoai-troi', productsCount: 30, status: 'Đã ẩn', order: 5 },
  ],
  collection: [
    { id: 'COL-01', name: 'Bộ sưu tập Bergamo', slug: 'bergamo', productsCount: 12, status: 'Hiển thị', order: 1 },
    { id: 'COL-02', name: 'Bộ sưu tập Como', slug: 'como', productsCount: 8, status: 'Hiển thị', order: 2 },
    { id: 'COL-03', name: 'Bộ sưu tập Lugano', slug: 'lugano', productsCount: 15, status: 'Hiển thị', order: 3 },
    { id: 'COL-04', name: 'Bộ sưu tập Osaka', slug: 'osaka', productsCount: 10, status: 'Hiển thị', order: 4 },
    { id: 'COL-05', name: 'Bộ sưu tập Carmo', slug: 'carmo', productsCount: 6, status: 'Đã ẩn', order: 5 },
    { id: 'COL-06', name: 'Bộ sưu tập Indivi', slug: 'indivi', productsCount: 22, status: 'Hiển thị', order: 6 },
    { id: 'COL-07', name: 'Bộ sưu tập Cenova', slug: 'cenova', productsCount: 9, status: 'Hiển thị', order: 7 },
    { id: 'COL-08', name: 'Bộ sưu tập Carlton', slug: 'carlton', productsCount: 11, status: 'Hiển thị', order: 8 },
    { id: 'COL-09', name: 'Bộ sưu tập Cupertino', slug: 'cupertino', productsCount: 7, status: 'Hiển thị', order: 9 },
    { id: 'COL-10', name: 'Bộ sưu tập Ottawa', slug: 'ottawa', productsCount: 14, status: 'Hiển thị', order: 10 },
    { id: 'COL-11', name: 'Bộ sưu tập Adelaide', slug: 'adelaide', productsCount: 5, status: 'Hiển thị', order: 11 },
    { id: 'COL-12', name: 'Bộ sưu tập Hampton', slug: 'hampton', productsCount: 4, status: 'Đã ẩn', order: 12 },
  ],
  style: [
    { id: 'ST-01', name: 'Phong cách Hiện đại', slug: 'hien-dai', productsCount: 200, status: 'Hiển thị', order: 1 },
    { id: 'ST-02', name: 'Phong cách Tối giản', slug: 'toi-gian', productsCount: 150, status: 'Hiển thị', order: 2 },
    { id: 'ST-03', name: 'Phong cách Bắc Âu (Scandinavian)', slug: 'bac-au', productsCount: 180, status: 'Hiển thị', order: 3 },
    { id: 'ST-04', name: 'Phong cách Cổ điển', slug: 'co-dien', productsCount: 50, status: 'Đã ẩn', order: 4 },
    { id: 'ST-05', name: 'Phong cách Công nghiệp (Industrial)', slug: 'cong-nghiep', productsCount: 70, status: 'Hiển thị', order: 5 },
    { id: 'ST-06', name: 'Phong cách Đương đại', slug: 'duong-dai', productsCount: 90, status: 'Hiển thị', order: 6 },
  ],
  material: [
    { id: 'MAT-01', name: 'Gỗ sồi (Oak)', slug: 'go-soi', productsCount: 120, status: 'Hiển thị', order: 1 },
    { id: 'MAT-02', name: 'Gỗ óc chó (Walnut)', slug: 'go-oc-cho', productsCount: 85, status: 'Hiển thị', order: 2 },
    { id: 'MAT-03', name: 'Da bò thật (Aniline leather)', slug: 'da-bo', productsCount: 45, status: 'Hiển thị', order: 3 },
    { id: 'MAT-04', name: 'Vải nỉ (Felt)', slug: 'vai-ni', productsCount: 160, status: 'Hiển thị', order: 4 },
    { id: 'MAT-05', name: 'Vải nhung (Velvet)', slug: 'vai-nhung', productsCount: 90, status: 'Hiển thị', order: 5 },
    { id: 'MAT-06', name: 'Kim loại sơn tĩnh điện', slug: 'kim-loai', productsCount: 210, status: 'Hiển thị', order: 6 },
    { id: 'MAT-07', name: 'Kính cường lực', slug: 'kinh', productsCount: 65, status: 'Hiển thị', order: 7 },
    { id: 'MAT-08', name: 'Đá cẩm thạch (Marble)', slug: 'da-cam-thach', productsCount: 30, status: 'Hiển thị', order: 8 },
    { id: 'MAT-09', name: 'Đá Ceramic', slug: 'da-ceramic', productsCount: 40, status: 'Hiển thị', order: 9 },
    { id: 'MAT-10', name: 'Nhựa ABS cao cấp', slug: 'nhua-abs', productsCount: 55, status: 'Hiển thị', order: 10 },
    { id: 'MAT-11', name: 'Vải bọc ngoài trời', slug: 'vai-ngoai-troi', productsCount: 25, status: 'Đã ẩn', order: 11 },
    { id: 'MAT-12', name: 'Sơn mài (Lacquer)', slug: 'son-mai', productsCount: 75, status: 'Hiển thị', order: 12 },
    { id: 'MAT-13', name: 'Gỗ trắc (Rosewood)', slug: 'go-trac', productsCount: 15, status: 'Đã ẩn', order: 13 },
    { id: 'MAT-14', name: 'Da nhân tạo (PU)', slug: 'da-pu', productsCount: 110, status: 'Hiển thị', order: 14 },
    { id: 'MAT-15', name: 'Mây tre đan', slug: 'may-tre', productsCount: 20, status: 'Hiển thị', order: 15 },
  ]
};

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState('main');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // States cho modal Thêm Loại
  const [newTypeName, setNewTypeName] = useState('');
  const [typeNameError, setTypeNameError] = useState('');
  const [newTypeId, setNewTypeId] = useState('');
  const [isTypeIdEdited, setIsTypeIdEdited] = useState(false);
  const [typeIdError, setTypeIdError] = useState('');

  // States cho modal Thêm Danh Mục
  const [newCatName, setNewCatName] = useState('');
  const [catNameError, setCatNameError] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [isCatSlugEdited, setIsCatSlugEdited] = useState(false);
  const [catSlugError, setCatSlugError] = useState('');
  const [newCatType, setNewCatType] = useState(activeTab);
  const [newCatStatus, setNewCatStatus] = useState('Hiển thị');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [newCatOrder, setNewCatOrder] = useState(1);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const typeDropdownRef = React.useRef<HTMLDivElement>(null);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateSlug = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  React.useEffect(() => {
    setSelectedKeys(new Set());
  }, [activeTab]);

  React.useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const currentData = activeTab === 'main' ? categories : (SAMPLE_CATEGORIES[activeTab] || []);
  const filtered = currentData.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const validateTypeName = (name: string) => {
    if (name && TABS.some(tab => tab.label.toLowerCase() === name.toLowerCase())) {
      setTypeNameError('Tên loại này đã tồn tại!');
      return false;
    }
    setTypeNameError('');
    return true;
  };

  const validateCatName = (name: string) => {
    if (name && currentData.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setCatNameError('Tên danh mục này đã tồn tại!');
      return false;
    }
    setCatNameError('');
    return true;
  };

  const handleTypeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTypeName(val);
    const isValid = validateTypeName(val);
    
    if (!isTypeIdEdited) {
      if (isValid) {
        const slug = generateSlug(val);
        setNewTypeId(slug);
        validateTypeId(slug);
      } else {
        setNewTypeId('');
        setTypeIdError('');
      }
    }
  };

  const handleTypeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTypeId(val);
    setIsTypeIdEdited(true);
    validateTypeId(val);
  };

  const validateTypeId = (id: string) => {
    if (id && TABS.some(tab => tab.id.toLowerCase() === id.toLowerCase())) {
      setTypeIdError('Mã ID này đã tồn tại!');
      return false;
    }
    setTypeIdError('');
    return true;
  };

  const handleCatNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewCatName(val);
    const isValid = validateCatName(val);
    
    if (!isCatSlugEdited) {
      if (isValid) {
        const slug = generateSlug(val);
        setNewCatSlug(slug);
        validateCatSlug(slug);
      } else {
        setNewCatSlug('');
        setCatSlugError('');
      }
    }
  };

  const handleCatSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewCatSlug(val);
    setIsCatSlugEdited(true);
    validateCatSlug(val);
  };

  const validateCatSlug = (slug: string) => {
    if (slug && currentData.some(c => c.slug.toLowerCase() === slug.toLowerCase())) {
      setCatSlugError('Đường dẫn này đã tồn tại trong loại danh mục hiện tại!');
      return false;
    }
    setCatSlugError('');
    return true;
  };

  // Reset form khi đóng modal
  const resetTypeForm = () => {
    setNewTypeName('');
    setTypeNameError('');
    setNewTypeId('');
    setIsTypeIdEdited(false);
    setTypeIdError('');
  };

  const resetCatForm = () => {
    setNewCatName('');
    setCatNameError('');
    setNewCatSlug('');
    setIsCatSlugEdited(false);
    setCatSlugError('');
    setNewCatType(activeTab);
    setNewCatStatus('Hiển thị');
    setShowTypeDropdown(false);
    setShowStatusDropdown(false);
    setNewCatOrder(1);
    setShowOrderDetails(false);
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Tên danh mục',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/{item.slug}</div>
        </div>
      )
    },
    {
      key: 'productsCount',
      header: 'Số lượng sản phẩm',
      render: (item) => <span>{item.productsCount} SP</span>
    },
    {
      key: 'order',
      header: 'Thứ tự hiển thị',
      render: (item) => <span>{item.order}</span>
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => (
        <span style={{
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          background: item.status === 'Hiển thị' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
          color: item.status === 'Hiển thị' ? '#10b981' : '#64748b'
        }}>
          {item.status}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Quản lý Danh mục</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Thiết lập các thuộc tính phân loại sản phẩm để hỗ trợ tìm kiếm và lọc dữ liệu.</p>
        </div>
        <button 
          onClick={() => setIsAddTypeOpen(true)}
          className="admin-btn admin-btn-primary"
        >
          <Plus size={16} />
          Thêm loại
        </button>
      </div>

      <AdminPageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <FilterBar 
        searchPlaceholder="Tìm kiếm danh mục..."
        searchValue={search}
        onSearchChange={setSearch}
        customActions={
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {selectedKeys.size > 0 && (
              <button 
                onClick={() => {
                  if(confirm(`Bạn có chắc muốn xóa ${selectedKeys.size} danh mục?`)) {
                    setSelectedKeys(new Set());
                  }
                }}
                className="admin-btn admin-btn-danger"
              >
                <Trash2 size={16} />
                Xóa danh mục ({selectedKeys.size})
              </button>
            )}
            <button 
              onClick={() => setIsAddCategoryOpen(true)}
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              Thêm danh mục
            </button>
          </div>
        }
      />

      <DataTable 
        columns={columns}
        data={filtered}
        isLoading={loading}
        selectable={true}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        rowKey={(item) => item.id}
        actions={(item) => (
          <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: '160px', display: 'flex', flexDirection: 'column' }}>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Chỉnh sửa</button>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              {item.status === 'Hiển thị' ? 'Ẩn danh mục' : 'Hiển thị danh mục'}
            </button>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', color: 'var(--text-primary)' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} onClick={() => alert('Chuyển hướng đến danh sách sản phẩm thuộc danh mục này!')}>Xem sản phẩm</button>
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }}></div>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '4px', color: '#ef4444' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Xóa</button>
          </div>
        )}
      />

      {/* Modal Thêm Loại Danh Mục */}
      <Modal 
        isOpen={isAddTypeOpen} 
        onClose={() => { setIsAddTypeOpen(false); resetTypeForm(); }} 
        title="Thêm loại danh mục mới"
        footer={
          <>
            <button onClick={() => { setIsAddTypeOpen(false); resetTypeForm(); }} className="admin-btn admin-btn-secondary">Hủy</button>
            <button className="admin-btn admin-btn-primary" disabled={!!typeIdError || !!typeNameError || !newTypeName || !newTypeId}>Lưu loại danh mục</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tên loại <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              placeholder="VD: Không gian, Màu sắc..." 
              value={newTypeName}
              onChange={handleTypeNameChange}
              className="admin-input" 
              style={ typeNameError ? { borderColor: 'red' } : {} }
            />
            {typeNameError && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{typeNameError}</div>}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Mã (ID) <span style={{color: 'red'}}>*</span></label>
            <input 
              type="text" 
              placeholder="VD: space, color..." 
              value={newTypeId}
              onChange={handleTypeIdChange}
              className="admin-input"
              style={ typeIdError ? { borderColor: 'red' } : {} }
            />
            {typeIdError && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{typeIdError}</div>}
          </div>
        </div>
      </Modal>

      {/* Modal Thêm Danh Mục */}
      <Modal 
        isOpen={isAddCategoryOpen} 
        onClose={() => { setIsAddCategoryOpen(false); resetCatForm(); }} 
        title="Thêm danh mục mới"
        width="600px"
        footer={
          <>
            <button onClick={() => { setIsAddCategoryOpen(false); resetCatForm(); }} className="admin-btn admin-btn-secondary">Hủy</button>
            <button className="admin-btn admin-btn-primary" disabled={!!catSlugError || !!catNameError || !newCatName || !newCatSlug}>Thêm danh mục</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Thuộc loại <span style={{color: 'red'}}>*</span></label>
            <div style={{ position: 'relative' }} ref={typeDropdownRef}>
              <div 
                onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowStatusDropdown(false); }}
                className="admin-input"
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: showTypeDropdown ? 'var(--accent)' : 'var(--border-color)' }}
              >
                <span>{TABS.find(t => t.id === newCatType)?.label || 'Chọn loại'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showTypeDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              {showTypeDropdown && (
                <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, padding: '4px' }}>
                  {TABS.map(tab => (
                    <div 
                      key={tab.id} 
                      onClick={() => { setNewCatType(tab.id); setShowTypeDropdown(false); }}
                      style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: newCatType === tab.id ? 'var(--accent)' : 'var(--text-primary)', fontWeight: newCatType === tab.id ? 600 : 400, background: 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {tab.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tên danh mục <span style={{color: 'red'}}>*</span></label>
              <input 
                type="text" 
                placeholder="Nhập tên..." 
                value={newCatName}
                onChange={handleCatNameChange}
                className="admin-input" 
                style={ catNameError ? { borderColor: 'red' } : {} }
              />
              {catNameError && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{catNameError}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Đường dẫn (Slug)</label>
              <input 
                type="text" 
                placeholder="Tự động tạo..." 
                value={newCatSlug}
                onChange={handleCatSlugChange}
                className="admin-input"
                style={ catSlugError ? { borderColor: 'red' } : {} }
              />
              {catSlugError && <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{catSlugError}</div>}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Ảnh minh họa</label>
            <div 
              onClick={() => document.getElementById('cat-image-upload')?.click()}
              style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <Plus size={20} />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click hoặc kéo thả ảnh vào đây</span>
              <input type="file" id="cat-image-upload" accept="image/*" style={{ display: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Thứ tự hiển thị</label>
              <input 
                type="number" 
                value={newCatOrder}
                onChange={(e) => setNewCatOrder(parseInt(e.target.value) || 1)}
                className="admin-input" 
              />
              <button 
                type="button" 
                onClick={() => setShowOrderDetails(!showOrderDetails)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', marginTop: '8px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                {showOrderDetails ? 'Ẩn chi tiết' : 'Xem chi tiết thứ tự hiện tại'}
              </button>
              {showOrderDetails && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                   <div style={{ marginBottom: '8px', fontWeight: 600 }}>Thứ tự hiện tại ({TABS.find(t => t.id === newCatType)?.label}):</div>
                   <div style={{ maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                     {SAMPLE_CATEGORIES[newCatType as keyof typeof SAMPLE_CATEGORIES]?.sort((a,b) => (a.order || 0) - (b.order || 0)).map(c => (
                       <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                         <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                         <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.order}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Trạng thái</label>
              <div style={{ position: 'relative' }} ref={statusDropdownRef}>
                <div 
                  onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowTypeDropdown(false); }}
                  className="admin-input"
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: showStatusDropdown ? 'var(--accent)' : 'var(--border-color)' }}
                >
                  <span>{newCatStatus}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showStatusDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                {showStatusDropdown && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, padding: '4px' }}>
                    {['Hiển thị', 'Đã ẩn'].map(status => (
                      <div 
                        key={status} 
                        onClick={() => { setNewCatStatus(status); setShowStatusDropdown(false); }}
                        style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: newCatStatus === status ? 'var(--accent)' : 'var(--text-primary)', fontWeight: newCatStatus === status ? 600 : 400, background: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
