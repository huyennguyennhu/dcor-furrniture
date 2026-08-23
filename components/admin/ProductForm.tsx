'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Trash2, X, ArrowLeft, Save, Edit2, Eye, Image as ImageIcon, Upload, Package } from 'lucide-react';
import Modal from './Modal';
import AdminPageTabs from '@/components/admin/AdminPageTabs';

const CustomSelect = ({ options, value, onChange, placeholder, disabled, zIndex = 50, required = false }: any) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div 
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        className="admin-input"
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: isOpen ? 'var(--accent)' : 'var(--border-color)', opacity: disabled ? 0.7 : 1, background: disabled ? 'var(--bg-primary)' : 'white' }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: disabled ? 0.5 : 1 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      {isOpen && !disabled && (
        <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex, padding: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {!required && (
            <div 
              onClick={() => { onChange(''); setIsOpen(false); }}
              style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: value === '' ? 'var(--accent)' : 'var(--text-primary)', fontWeight: value === '' ? 600 : 400, background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Không
            </div>
          )}
          {options.map((opt: any) => (
            <div 
              key={opt.value} 
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{ padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', color: value === opt.value ? 'var(--accent)' : 'var(--text-primary)', fontWeight: value === opt.value ? 600 : 400, background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TABS = [
  { id: 'general', label: 'Thông tin chung' },
  { id: 'classification', label: 'Phân loại' },
  { id: 'variants', label: 'Biến thể & Hình ảnh' },
  { id: 'promotion', label: 'Khuyến mãi' }
];

export default function ProductForm({ isEdit = false, initialData = {} }: { isEdit?: boolean, initialData?: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [viewMode, setViewMode] = useState(isEdit);
  const [isModified, setIsModified] = useState(false);
  
  const [configOptions, setConfigOptions] = useState<any[]>(initialData.configOptions || []);
  const [variants, setVariants] = useState<any[]>(initialData.variants || []);
  const [expandedVariantIdx, setExpandedVariantIdx] = useState<number | null>(null);
  const [mainSku, setMainSku] = useState(initialData.product_id || '');
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  
  // Classification States
  const [catCategory, setCatCategory] = useState(initialData.category || '');
  const [catRoom, setCatRoom] = useState(initialData.room || '');
  const [catCollection, setCatCollection] = useState(initialData.collection || '');
  const [catStyle, setCatStyle] = useState(initialData.style || '');
  const [catMaterial, setCatMaterial] = useState(initialData.material || '');
  const [catColor, setCatColor] = useState(initialData.color || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setDbCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);



  const [specs, setSpecs] = useState<{name: string, value: string}[]>(
    initialData.attributes && initialData.attributes.length > 0 
      ? initialData.attributes 
      : [
          { name: 'Kích thước (D×R×C)', value: '' },
          { name: 'Trọng lượng', value: '' },
          { name: 'Chất liệu', value: '' },
          { name: 'Bảo hành', value: '' }
        ]
  );

  const handleAddSpec = () => {
    setSpecs([...specs, { name: '', value: '' }]);
    setIsModified(true);
  };
  
  const handleRemoveSpec = (index: number) => {
    const newSpecs = [...specs];
    newSpecs.splice(index, 1);
    setSpecs(newSpecs);
    setIsModified(true);
  };
  
  const handleSpecChange = (index: number, field: 'name' | 'value', val: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = val;
    setSpecs(newSpecs);
    setIsModified(true);
  };

  const handleAddConfigOption = () => {
    setConfigOptions([...configOptions, { groupId: 'opt_' + Date.now().toString(), groupName: '', options: [] }]);
    setIsModified(true);
  };
  
  const handleRemoveConfigOption = (idx: number) => {
    const newOptions = [...configOptions];
    newOptions.splice(idx, 1);
    setConfigOptions(newOptions);
    generateVariants(newOptions);
    setIsModified(true);
  };

  const handleChangeConfigName = (idx: number, name: string) => {
    const newOptions = [...configOptions];
    newOptions[idx].groupName = name;
    setConfigOptions(newOptions);
    setIsModified(true);
  };

  const handleAddConfigValue = (optIdx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (!val) return;
      
      const newOptions = [...configOptions];
      const optValues = newOptions[optIdx].options || [];
      if (!optValues.find((v: any) => v.name === val)) {
        newOptions[optIdx].options = [...optValues, { id: 'val_' + Date.now().toString(), name: val, image: null, hexColor: null, groupName: null }];
        setConfigOptions(newOptions);
        generateVariants(newOptions);
        setIsModified(true);
      }
      e.currentTarget.value = '';
    }
  };
  
  const handleRemoveConfigValue = (optIdx: number, valIdx: number) => {
    const newOptions = [...configOptions];
    newOptions[optIdx].options.splice(valIdx, 1);
    setConfigOptions(newOptions);
    generateVariants(newOptions);
    setIsModified(true);
  };

  const generateVariants = (opts: any[]) => {
    const validOpts = opts.filter(o => (o.options || []).length > 0 && (o.groupName || '').trim() !== '');
    if (validOpts.length === 0) {
      setVariants([]);
      return;
    }

    const cartesian = (...a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())));
    const arrays = validOpts.map(o => o.options || []);
    let combinations = arrays.length > 1 ? cartesian(...arrays) : arrays[0].map((v: any) => [v]);
    
    const newVariants = combinations.map((combo: any) => {
      const isArray = Array.isArray(combo);
      const nameFromOpts = isArray ? combo.map((c: any) => c.name).join(' - ') : combo.name;
      const suffix = isArray ? combo.map((c: any) => c.id.substring(0, 4)).join('-') : combo.id.substring(0, 4);
      
      const selections: any = {};
      if (isArray) {
        combo.forEach((c: any, i: number) => selections[validOpts[i].groupId] = c.id);
      } else {
        selections[validOpts[0].groupId] = combo.id;
      }
      
      const autoSku = mainSku ? `${mainSku}-${suffix.toUpperCase()}` : '';

      const existing = variants.find((v: any) => JSON.stringify(v.selections) === JSON.stringify(selections));
      return existing ? existing : {
        name: initialData.name || '',
        selections: selections,
        price: initialData.price || 0,
        stock: 0,
        variantId: autoSku,
        images: [],
        details: initialData.variants?.[0]?.details || {},
        dimensions: initialData.variants?.[0]?.dimensions || {},
        model3D: initialData.variants?.[0]?.model3D || {}
      };
    });
    
    setVariants(newVariants);
  };

  const getVariantDisplayName = (v: any) => {
    const names: string[] = [];
    configOptions.forEach(opt => {
      if (v.selections && v.selections[opt.groupId]) {
        const selectedOpt = (opt.options || []).find((o: any) => o.id === v.selections[opt.groupId]);
        if (selectedOpt) names.push(selectedOpt.name);
      }
    });
    return names.length > 0 ? names.join(' - ') : 'Mặc định';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin/products');
  };

  return (
    <form onSubmit={handleSave} onChange={() => setIsModified(true)} style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          type="button"
          onClick={() => router.push('/admin/products')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        {!isEdit && (
          <button 
            type="submit"
            className="admin-btn admin-btn-primary"
          >
            <Save size={18} /> Lưu sản phẩm mới
          </button>
        )}
      </div>


      {isEdit ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {initialData.images && initialData.images.length > 0 ? (
                <img src={initialData.images[0]} alt={initialData.name} style={{ maxWidth: 'calc(100% - 10px)', maxHeight: 'calc(100% - 10px)', objectFit: 'contain' }} />
              ) : (
                <ImageIcon size={32} color="var(--text-muted)" />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{initialData.name || 'Đang tải...'}</h1>
                <span style={{ padding: '2px 8px', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '11px', fontWeight: 600 }}>
                  {initialData.status || 'Đang bán'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>SKU: <strong style={{ color: 'var(--text-primary)' }}>{initialData.product_id || 'N/A'}</strong></span>
                <span>•</span>
                <span>Danh mục: <strong style={{ color: 'var(--text-primary)' }}>{initialData.category || 'N/A'}</strong></span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => setViewMode(!viewMode)}
              className="admin-btn admin-btn-secondary"
            >
              {viewMode ? <Edit2 size={16} /> : <Eye size={16} />}
              {viewMode ? 'Chỉnh sửa' : 'Xem'}
            </button>
            {!viewMode && (
              <button 
                type="submit"
                disabled={!isModified}
                className="admin-btn admin-btn-primary"
                style={{ opacity: isModified ? 1 : 0.5, cursor: isModified ? 'pointer' : 'not-allowed' }}
              >
                <Save size={16} /> Cập nhật sản phẩm
              </button>
            )}
            <button type="button" className="admin-btn admin-btn-danger">
              <Trash2 size={16} /> Xóa sản phẩm
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Thêm sản phẩm mới
          </h1>
        </div>
      )}

      <AdminPageTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', padding: '32px', border: '1px solid var(--border-color)' }}>
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Tên sản phẩm <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="Nhập tên sản phẩm..." defaultValue={initialData.name} disabled={viewMode} required className="admin-input" style={{ opacity: viewMode ? 0.7 : 1, background: viewMode ? 'var(--bg-primary)' : 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>SKU <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="Nhập mã SKU..." value={mainSku} onChange={(e) => { setMainSku(e.target.value); setIsModified(true); }} disabled={viewMode} required className="admin-input" style={{ opacity: viewMode ? 0.7 : 1, background: viewMode ? 'var(--bg-primary)' : 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Giá vốn (₫)</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="0" defaultValue={initialData.costPrice ? new Intl.NumberFormat('vi-VN').format(initialData.costPrice) : '0'} disabled={true} className="admin-input" style={{ paddingLeft: '40px', opacity: 0.7, cursor: 'not-allowed', background: 'var(--bg-secondary)' }} />
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₫</span>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Thông số kỹ thuật</label>
                {!viewMode && (
                  <button type="button" onClick={handleAddSpec} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <Plus size={14} /> Thêm thông số
                  </button>
                )}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {specs.map((spec, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="text" placeholder="Tên thông số" value={spec.name} onChange={(e) => handleSpecChange(idx, 'name', e.target.value)} disabled={viewMode} className="admin-input" style={{ width: '40%', opacity: viewMode ? 0.7 : 1, background: viewMode ? 'var(--bg-primary)' : 'white' }} />
                    <input type="text" placeholder="Giá trị" value={spec.value} onChange={(e) => handleSpecChange(idx, 'value', e.target.value)} disabled={viewMode} className="admin-input" style={{ width: '60%', opacity: viewMode ? 0.7 : 1, background: viewMode ? 'var(--bg-primary)' : 'white' }} />
                    {!viewMode && (
                      <button type="button" onClick={() => handleRemoveSpec(idx)} className="admin-btn admin-btn-danger" style={{ padding: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Mô tả ngắn</label>
              <textarea placeholder="Viết một đoạn mô tả ngắn về sản phẩm..." defaultValue={initialData.shortDescription} disabled={viewMode} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', minHeight: '80px', opacity: viewMode ? 0.7 : 1, background: viewMode ? 'var(--bg-primary)' : 'white', color: 'var(--text-primary)', fontSize: '14px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Mô tả chi tiết</label>
              <textarea placeholder="Sử dụng trình soạn thảo văn bản ở đây..." defaultValue={initialData.description} disabled={viewMode} style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', minHeight: '200px', opacity: viewMode ? 0.7 : 1, background: viewMode ? 'var(--bg-primary)' : 'white', color: 'var(--text-primary)', fontSize: '14px' }} />
            </div>
          </div>
        )}

        {activeTab === 'classification' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Danh mục chính <span style={{ color: '#ef4444' }}>*</span></label>
                <CustomSelect 
                  options={dbCategories.map((cat: any) => ({ value: cat.slug, label: cat.name }))}
                  value={catCategory}
                  onChange={setCatCategory}
                  placeholder="Chọn danh mục"
                  disabled={viewMode}
                  zIndex={56}
                  required={true}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Phòng</label>
                <CustomSelect 
                  options={[
                    { value: 'phong-khach', label: 'Phòng khách' },
                    { value: 'phong-ngu', label: 'Phòng ngủ' },
                    { value: 'phong-an', label: 'Phòng ăn' },
                    { value: 'ngoai-troi', label: 'Ngoài trời' }
                  ]}
                  value={catRoom}
                  onChange={setCatRoom}
                  placeholder="Không"
                  disabled={viewMode}
                  zIndex={55}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Bộ sưu tập (Collection)</label>
                <CustomSelect 
                  options={[
                    { value: 'osaka', label: 'Osaka Collection' },
                    { value: 'indochine', label: 'Indochine Heritage' },
                    { value: 'scandi', label: 'Scandi Minimalist' }
                  ]}
                  value={catCollection}
                  onChange={setCatCollection}
                  placeholder="Không"
                  disabled={viewMode}
                  zIndex={54}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Phong cách</label>
                <CustomSelect 
                  options={[
                    { value: 'hien-dai', label: 'Hiện đại' },
                    { value: 'co-dien', label: 'Cổ điển' },
                    { value: 'toi-gian', label: 'Tối giản' }
                  ]}
                  value={catStyle}
                  onChange={setCatStyle}
                  placeholder="Không"
                  disabled={viewMode}
                  zIndex={53}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chất liệu chính</label>
                <CustomSelect 
                  options={[
                    { value: 'go-soi', label: 'Gỗ sồi' },
                    { value: 'go-oc-cho', label: 'Gỗ óc chó' },
                    { value: 'da-bo', label: 'Da bò thật' },
                    { value: 'vai-linen', label: 'Vải Linen' }
                  ]}
                  value={catMaterial}
                  onChange={setCatMaterial}
                  placeholder="Không"
                  disabled={viewMode}
                  zIndex={52}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Màu sắc cơ bản</label>
                <CustomSelect 
                  options={[
                    { value: 'trang', label: 'Trắng' },
                    { value: 'den', label: 'Đen' },
                    { value: 'xam', label: 'Xám' },
                    { value: 'nau', label: 'Nâu gỗ' }
                  ]}
                  value={catColor}
                  onChange={setCatColor}
                  placeholder="Không"
                  disabled={viewMode}
                  zIndex={51}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>1. Loại biến thể</label>
                {!viewMode && (
                  <button type="button" onClick={handleAddConfigOption} className="admin-btn admin-btn-secondary">
                    <Plus size={16} /> Thêm loại biến thể
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {configOptions.length === 0 && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Chưa có loại biến thể nào. Sản phẩm sẽ không có tùy chọn phân loại.</div>}
                {configOptions.map((opt, optIdx) => (
                  <div key={optIdx} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '200px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tên loại (VD: Màu sắc)</label>
                        <input type="text" placeholder="Nhập tên..." value={opt.groupName || ''} onChange={(e) => handleChangeConfigName(optIdx, e.target.value)} disabled={viewMode} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', background: viewMode ? 'var(--bg-primary)' : 'white', fontSize: '13px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Các giá trị (Gõ chữ và ấn Enter)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minHeight: '40px', padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: viewMode ? 'var(--bg-primary)' : 'white' }}>
                          {(opt.options || []).map((val: any, valIdx: number) => (
                            <span key={valIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--bg-secondary)', borderRadius: '100px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                              {val.name}
                              {!viewMode && (
                                <X size={12} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleRemoveConfigValue(optIdx, valIdx)} />
                              )}
                            </span>
                          ))}
                          {!viewMode && (
                            <input type="text" placeholder="Thêm giá trị..." onKeyDown={(e) => handleAddConfigValue(optIdx, e)} style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: '100px', fontSize: '13px' }} />
                          )}
                        </div>
                      </div>
                      {!viewMode && (
                        <button type="button" onClick={() => handleRemoveConfigOption(optIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: '30px', padding: '8px' }}>
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>2. Tổ hợp biến thể & Hình ảnh</label>
              </div>
              
              {variants.length > 0 ? (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>Ảnh</th>
                        <th>Tên biến thể</th>
                        <th style={{ width: '200px' }}>Mã SKU</th>
                        <th style={{ width: '160px' }}>Giá bán (₫)</th>
                        <th style={{ width: '120px' }}>Tồn kho</th>
                        {!viewMode && <th style={{ width: '50px' }}></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v: any, idx: number) => (
                        <React.Fragment key={idx}>
                          <tr style={{ borderBottom: (idx === variants.length - 1 && expandedVariantIdx !== idx) ? 'none' : '1px solid var(--border-color)', background: expandedVariantIdx === idx ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div 
                                style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', cursor: 'pointer', position: 'relative' }} 
                                onClick={() => setExpandedVariantIdx(expandedVariantIdx === idx ? null : idx)}
                                title="Nhấn để xem/quản lý nhiều ảnh"
                              >
                                {v.images && v.images.length > 0 ? (
                                   <>
                                     {/* eslint-disable-next-line @next/next/no-img-element */}
                                     <img src={v.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px', boxSizing: 'border-box' }} />
                                     {v.images.length > 1 && (
                                       <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', padding: '1px 4px', borderTopLeftRadius: '4px' }}>+{v.images.length - 1}</div>
                                     )}
                                   </>
                                ) : (
                                   <ImageIcon size={16} color="var(--text-muted)" />
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.5' }}>
                              {getVariantDisplayName(v)}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <input type="text" value={v.variantId || ''} onChange={(e) => { const nv = [...variants]; nv[idx].variantId = e.target.value; setVariants(nv); setIsModified(true); }} disabled={viewMode} placeholder="Nhập SKU..." className="admin-input" style={{ opacity: viewMode ? 0.7 : 1, background: viewMode ? 'transparent' : 'white' }} />
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <input type="text" value={new Intl.NumberFormat('vi-VN').format(v.price || 0)} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); const nv = [...variants]; nv[idx].price = raw ? Number(raw) : 0; setVariants(nv); setIsModified(true); }} disabled={viewMode} className="admin-input" style={{ opacity: viewMode ? 0.7 : 1, background: viewMode ? 'transparent' : 'white' }} />
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <input type="number" value={v.stock || 0} onChange={(e) => { const nv = [...variants]; nv[idx].stock = Number(e.target.value); setVariants(nv); setIsModified(true); }} disabled={viewMode} className="admin-input" style={{ opacity: viewMode ? 0.7 : 1, background: viewMode ? 'transparent' : 'white' }} />
                            </td>
                            {!viewMode && (
                              <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                <button type="button" onClick={() => { const nv = [...variants]; nv.splice(idx, 1); setVariants(nv); setIsModified(true); }} className="admin-btn admin-btn-danger" style={{ padding: '8px' }}>
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            )}
                          </tr>
                          
                          {/* Dòng hiển thị nhiều ảnh */}
                          {expandedVariantIdx === idx && (
                            <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: idx === variants.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                              <td colSpan={viewMode ? 5 : 6} style={{ padding: '16px', borderTop: '1px dashed var(--border-color)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Bộ sưu tập ảnh cho: {getVariantDisplayName(v)}</label>
                                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {(v.images || []).map((imgUrl: string, iIdx: number) => (
                                      <div key={iIdx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', background: 'white' }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '5px', boxSizing: 'border-box' }} />
                                        {!viewMode && (
                                          <button type="button" style={{ position: 'absolute', top: '4px', right: '4px', background: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#ef4444' }} onClick={() => { const nv = [...variants]; nv[idx].images.splice(iIdx, 1); setVariants(nv); setIsModified(true); }}>
                                            <X size={12} />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    
                                    {!viewMode && (
                                      <div 
                                        style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white', gap: '4px' }}
                                        onClick={() => alert('Gọi API Upload ở đây, sau đó đẩy URL mới vào v.images')}
                                      >
                                        <Upload size={16} color="var(--text-muted)" />
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thêm ảnh</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px 24px', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Package size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)' }}>Chưa có biến thể nào</span>
                  <span style={{ fontSize: '13px', marginTop: '4px' }}>Vui lòng thêm loại biến thể để tự động sinh danh sách, hoặc bỏ qua nếu sản phẩm chỉ có 1 lựa chọn mặc định.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'promotion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chương trình khuyến mãi áp dụng</label>
              <select disabled={viewMode} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', opacity: viewMode ? 0.7 : 1, width: '100%', maxWidth: '400px' }}>
                <option value="">Không có khuyến mãi</option>
                <option value="flash-sale">Flash Sale Mùa Hè (-20%)</option>
                <option value="combo">Mua 2 giảm 10%</option>
              </select>
            </div>
            
            {initialData.discountValue ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
                  %
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Đang áp dụng giảm giá trực tiếp</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Giảm {initialData.discountType === 'PERCENTAGE' ? `${initialData.discountValue}%` : `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(initialData.discountValue)}`} so với giá gốc.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Sản phẩm đang được bán với giá gốc, chưa áp dụng bất kỳ chương trình giảm giá nào.
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
