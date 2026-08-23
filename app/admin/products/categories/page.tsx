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
  const [newTypeId, setNewTypeId] = useState('');
  const [isTypeIdEdited, setIsTypeIdEdited] = useState(false);
  const [typeIdError, setTypeIdError] = useState('');

  // States cho modal Thêm Danh Mục
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [isCatSlugEdited, setIsCatSlugEdited] = useState(false);
  const [catSlugError, setCatSlugError] = useState('');

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

  const handleTypeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTypeName(val);
    if (!isTypeIdEdited) {
      const slug = generateSlug(val);
      setNewTypeId(slug);
      validateTypeId(slug);
    }
  };

  const handleTypeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTypeId(val);
    setIsTypeIdEdited(true);
    validateTypeId(val);
  };

  const validateTypeId = (id: string) => {
    if (TABS.some(tab => tab.id === id)) {
      setTypeIdError('Mã ID này đã tồn tại!');
    } else {
      setTypeIdError('');
    }
  };

  const handleCatNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewCatName(val);
    if (!isCatSlugEdited) {
      const slug = generateSlug(val);
      setNewCatSlug(slug);
      validateCatSlug(slug);
    }
  };

  const handleCatSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewCatSlug(val);
    setIsCatSlugEdited(true);
    validateCatSlug(val);
  };

  const validateCatSlug = (slug: string) => {
    if (currentData.some(c => c.slug === slug)) {
      setCatSlugError('Đường dẫn này đã tồn tại trong loại danh mục hiện tại!');
    } else {
      setCatSlugError('');
    }
  };

  // Reset form khi đóng modal
  const resetTypeForm = () => {
    setNewTypeName('');
    setNewTypeId('');
    setIsTypeIdEdited(false);
    setTypeIdError('');
  };

  const resetCatForm = () => {
    setNewCatName('');
    setNewCatSlug('');
    setIsCatSlugEdited(false);
    setCatSlugError('');
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
          <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', position: 'absolute', right: 0, top: '30px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', minWidth: '120px', display: 'flex', flexDirection: 'column' }}>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '4px' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Chỉnh sửa</button>
            <button style={{ padding: '8px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '4px', color: '#ef4444' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>Xóa</button>
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
            <button className="admin-btn admin-btn-primary" disabled={!!typeIdError || !newTypeName || !newTypeId}>Lưu loại danh mục</button>
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
            />
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
            <button className="admin-btn admin-btn-primary" disabled={!!catSlugError || !newCatName || !newCatSlug}>Thêm danh mục</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Thuộc loại <span style={{color: 'red'}}>*</span></label>
            <select defaultValue={activeTab} className="admin-select">
              {TABS.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
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
              />
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
            <div style={{ border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click hoặc kéo thả ảnh vào đây</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Thứ tự hiển thị</label>
              <input type="number" defaultValue={1} className="admin-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Trạng thái</label>
              <select className="admin-select">
                <option value="Hiển thị">Hiển thị</option>
                <option value="Đã ẩn">Đã ẩn</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
}
