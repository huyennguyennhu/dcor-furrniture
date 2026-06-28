'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CatalogProduct } from '@/lib/data';
import { Save, Undo, Redo, Share2, Download, Search, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize, Trash2, Upload, LayoutTemplate, AlertTriangle, ShoppingCart, Info, Globe } from 'lucide-react';
import { useStore } from '@/lib/store';
import { usePlannerStore } from '@/lib/store/plannerStore';
import { flyToCart } from '@/lib/flyToCart';

const FALLBACK_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22400%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23cccccc%22%20stroke-width%3D%221%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20width%3D%2218%22%20height%3D%2218%22%20x%3D%223%22%20y%3D%223%22%20rx%3D%222%22%20ry%3D%222%22%2F%3E%3Ccircle%20cx%3D%229%22%20cy%3D%229%22%20r%3D%222%22%2F%3E%3Cpath%20d%3D%22m21%2015-3.086-3.086a2%202%200%200%200-2.828%200L6%2021%22%2F%3E%3C%2Fsvg%3E';

interface PlannerItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  formattedPrice: string;
  x: number;
  y: number;
  realWidth: number;
  realDepth: number;
  rotation: number;     // Z-axis (2D rotate)
  rotationX?: number;   // X-axis (tilt vertical)
  rotationY?: number;   // Y-axis (tilt horizontal)
}

function getMockDimensions(category: string, title: string) {
  const cat = category?.toLowerCase() || '';
  const t = title?.toLowerCase() || '';
  if (cat.includes('sofa') || t.includes('sofa')) return { width: 2.2, depth: 0.9 };
  if (cat.includes('giường') || t.includes('bed')) return { width: 1.8, depth: 2.0 };
  if (cat.includes('bàn') || t.includes('table') || t.includes('desk')) return { width: 1.2, depth: 0.8 };
  if (cat.includes('ghế') || t.includes('chair')) return { width: 0.6, depth: 0.6 };
  if (cat.includes('tủ') || t.includes('storage') || t.includes('cabinet')) return { width: 1.5, depth: 0.4 };
  return { width: 1.0, depth: 1.0 };
}

const ROOM_CATEGORIES = ['Tất cả', 'Phòng khách', 'Phòng ngủ', 'Phòng ăn', 'Văn phòng', 'Phòng tắm', 'Phòng trẻ'];

const EMPTY_ROOMS = [
  { id: 'l1', category: 'Phòng khách', photo: 'https://res.cloudinary.com/dsasf753c/image/upload/v1782629735/room_img/phong_khach.png', bg: '#f5f0eb' },
  { id: 'l2', category: 'Phòng khách', photo: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80', bg: '#ede5da' },
  { id: 'l3', category: 'Phòng khách', photo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', bg: '#e8e0d5' },
  { id: 'l4', category: 'Phòng khách', photo: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80', bg: '#f0ebe2' },
  { id: 'b1', category: 'Phòng ngủ', photo: 'https://res.cloudinary.com/dsasf753c/image/upload/v1782629737/room_img/phong_ngu.png', bg: '#edeaf5' },
  { id: 'b2', category: 'Phòng ngủ', photo: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80', bg: '#ddd6ee' },
  { id: 'b3', category: 'Phòng ngủ', photo: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', bg: '#e5e0f0' },
  { id: 'b4', category: 'Phòng ngủ', photo: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80', bg: '#ede8f5' },
  { id: 'd1', category: 'Phòng ăn', photo: 'https://res.cloudinary.com/dsasf753c/image/upload/v1782629732/room_img/phong_an.png', bg: '#f0ede8' },
  { id: 'd2', category: 'Phòng ăn', photo: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=800&q=80', bg: '#e5ddd2' },
  { id: 'd3', category: 'Phòng ăn', photo: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80', bg: '#ede7dc' },
  { id: 'o1', category: 'Văn phòng', photo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', bg: '#eaeeee' },
  { id: 'o2', category: 'Văn phòng', photo: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80', bg: '#d6dfdf' },
  { id: 'bt1', category: 'Phòng tắm', photo: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80', bg: '#e8f0ef' },
  { id: 'bt2', category: 'Phòng tắm', photo: 'https://images.unsplash.com/photo-1620626011761-996317702782?auto=format&fit=crop&w=800&q=80', bg: '#d2e0de' },
  { id: 'k1', category: 'Phòng trẻ', photo: 'https://images.unsplash.com/photo-1617104551722-3b2d51729a41?auto=format&fit=crop&w=800&q=80', bg: '#f5f0e8' },
  { id: 'k2', category: 'Phòng trẻ', photo: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4?auto=format&fit=crop&w=800&q=80', bg: '#ede5d8' },
];

const SIDEBAR_HERO = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80';
const CATEGORIES = ['Tất cả', 'Sofa', 'Bàn', 'Ghế', 'Tủ', 'Giường', 'Đèn', 'Trang trí'];

function RoomPlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomType = searchParams.get('room') || 'living';
  const addToCart = useStore(state => state.addToCart);

  // --- Fetch products from Supabase API ---
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Failed to load products for planner', err));
  }, []);

  const [selectedBg, setSelectedBg] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomSelected, setRoomSelected] = useState(false);
  const [placedItems, setPlacedItems] = useState<PlannerItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const customImageBase64 = usePlannerStore(state => state.customImageBase64);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSpaceLibraryModal, setShowSpaceLibraryModal] = useState(false);
  const [showExitPromptModal, setShowExitPromptModal] = useState(false);
  const [designName, setDesignName] = useState('');
  const [draftId, setDraftId] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle URL params and Load Drafts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomType = params.get('room');
    const loadDraftId = params.get('draft');
    
    if (loadDraftId) {
      setDraftId(loadDraftId);
      const stored = localStorage.getItem('dcor_drafts');
      if (stored) {
        const drafts = JSON.parse(stored);
        const draft = drafts.find((d: any) => d.id === loadDraftId);
        if (draft) {
          setSelectedBg(draft.backgroundImage);
          setPlacedItems(draft.canvasState || []);
          setDesignName(draft.name);
          setRoomSelected(true);
          return;
        }
      }
    } else {
      setDraftId(`draft-${Date.now()}`);
    }

    if (roomType === 'custom' && customImageBase64) {
      setSelectedBg(customImageBase64);
      setSelectedRoomId('custom');
      setIsCustomBg(true);
      setRoomSelected(true);
      setDimsConfirmed(false);
      setPlacedItems([]);
    } else if (roomType && roomType !== 'custom') {
      let targetRoomId = roomType;
      if (roomType === 'living') targetRoomId = 'l1';
      else if (roomType === 'bedroom') targetRoomId = 'b1';
      else if (roomType === 'dining') targetRoomId = 'd1';

      const found = EMPTY_ROOMS.find(r => r.id === targetRoomId);
      if (found) {
        handleSelectRoom(found);
      }
    }
  }, [roomType, customImageBase64]);

  // Before unload warning
  // Prevent body scroll when any modal is open
  useEffect(() => {
    if (showSpaceLibraryModal || showExitPromptModal || showSaveModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSpaceLibraryModal, showExitPromptModal, showSaveModal]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (placedItems.length > 0) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [placedItems]);

  // Auto-save draft
  useEffect(() => {
    if (!roomSelected || !draftId || placedItems.length === 0) return;

    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem('dcor_drafts') || '[]';
        let drafts = JSON.parse(stored);
        
        const newDraft = {
          id: draftId,
          name: designName || 'Bản nháp mới',
          backgroundImage: selectedBg,
          canvasState: placedItems,
          updatedAt: new Date().toISOString()
        };

        const existingIndex = drafts.findIndex((d: any) => d.id === draftId);
        if (existingIndex >= 0) {
          drafts[existingIndex] = newDraft;
        } else {
          drafts.unshift(newDraft);
        }

        // Sắp xếp bản nháp mới nhất lên đầu
        drafts.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
        // Chỉ giữ tối đa 8 bản nháp
        if (drafts.length > 8) {
          drafts = drafts.slice(0, 8);
        }
        
        localStorage.setItem('dcor_drafts', JSON.stringify(drafts));
      } catch (e) {
        console.error('Failed to autosave draft', e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [placedItems, selectedBg, designName, roomSelected, draftId]);

  // --- Change space modal ---
  const [showChangeSpaceModal, setShowChangeSpaceModal] = useState(false);

  // --- Toast / Login prompt ---
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'warn' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const isLoggedIn = false;

  const handleSelectRoom = (room: typeof EMPTY_ROOMS[0]) => {
    setSelectedBg(room.photo);
    setSelectedRoomId(room.id);
    setIsCustomBg(false);
    setRoomSelected(true);
    setDimsConfirmed(false);
    setShowSpaceLibraryModal(false);
    setPlacedItems([]);
  };

  const handleChangeSpace = () => {
    setShowSpaceLibraryModal(true);
  };

  const confirmExit = () => {
    router.push('/thiet-ke');
  };

  const handleBreadcrumbClick = () => {
    if (placedItems.length > 0) {
      setShowExitPromptModal(true);
    } else {
      router.push('/thiet-ke');
    }
  };

  const handleOpenSaveModal = () => {
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designName || 'Thiết kế mới',
          backgroundImage: selectedBg,
          canvasState: placedItems,
          isPublished: isPublished
        })
      });

      if (!response.ok) throw new Error('Lỗi khi lưu');
      
      showToast(isPublished ? 'Đã lưu và công khai thiết kế!' : 'Thiết kế đã được lưu riêng tư!', 'info');
      setShowSaveModal(false);
    } catch (err) {
      showToast('Có lỗi xảy ra khi lưu thiết kế.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Canvas items ---
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  // --- Catalog filter ---
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Variant Modal ---
  const [showVariantModal, setShowVariantModal] = useState<{title: string, options: string[]} | null>(null);

  // --- Room picker filter & pagination ---
  const [roomFilterCat, setRoomFilterCat] = useState('Tất cả');
  const [roomPage, setRoomPage] = useState(0);
  const ROOMS_PER_PAGE = 12;

  const [zoom, setZoom] = useState(100);

  // --- Room dimensions & Pending Selection ---
  const [roomWidth, setRoomWidth] = useState<number>(5);
  const [roomHeight, setRoomHeight] = useState<number>(3);
  const [roomDepth, setRoomDepth] = useState<number>(4);
  const [isCustomBg, setIsCustomBg] = useState(false);
  const [dimsConfirmed, setDimsConfirmed] = useState(true);

  const CANVAS_WIDTH_PX = 1200;
  const pixelsPerMeter = CANVAS_WIDTH_PX / (roomWidth || 1);

  // --- Drag state ---
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // --- Category scroll ---
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [catCanScrollLeft, setCatCanScrollLeft] = useState(false);
  const [catCanScrollRight, setCatCanScrollRight] = useState(true);

  const ITEMS_PER_PAGE = 6;
  const [catalogPage, setCatalogPage] = useState(0);

  const updateCatScroll = useCallback(() => {
    const el = catScrollRef.current;
    if (!el) return;
    setCatCanScrollLeft(el.scrollLeft > 4);
    setCatCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollCat = useCallback((dir: 'left' | 'right') => {
    const el = catScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 120 : -120, behavior: 'smooth' });
    setTimeout(updateCatScroll, 320);
  }, [updateCatScroll]);

  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    draggingId.current = itemId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const item = placedItems.find(i => i.id === itemId);
    if (!item) return;
    const scale = zoom / 100;
    dragOffset.current = {
      x: (e.clientX - rect.left) / scale - item.x,
      y: (e.clientY - rect.top) / scale - item.y,
    };
    setSelectedItemId(itemId);
  }, [placedItems, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingId.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    const newX = (e.clientX - rect.left) / scale - dragOffset.current.x;
    const newY = (e.clientY - rect.top) / scale - dragOffset.current.y;
    setPlacedItems(prev => prev.map(item =>
      item.id === draggingId.current ? { ...item, x: Math.max(50, Math.min(1150, newX)), y: Math.max(50, Math.min(750, newY)) } : item
    ));
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    draggingId.current = null;
  }, []);

  const catalogItems = products.filter(p => {
    if (!p.images || p.images.length === 0) return false;
    if (activeCategory !== 'Tất cả' && !p.category?.includes(activeCategory) && !p.shortDescription?.includes(activeCategory)) return false;
    if (searchQuery && !p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(catalogItems.length / ITEMS_PER_PAGE);
  const pagedItems = catalogItems.slice(catalogPage * ITEMS_PER_PAGE, (catalogPage + 1) * ITEMS_PER_PAGE);

  const handleAddProduct = (prod: CatalogProduct) => {
    let dim = prod.dimensions;
    if (!dim) {
      dim = getMockDimensions(prod.category || '', prod.shortDescription_vi || prod.shortDescription);
    }
    
    const newItem: PlannerItem = {
      id: `${prod.productId}-${Date.now()}`,
      productId: prod.productId,
      name: prod.shortDescription_vi || prod.shortDescription,
      image: prod.images?.[0] || '',
      price: prod.prices?.[0]?.price || 0,
      formattedPrice: prod.prices?.[0]?.formattedPrice || 'Liên hệ',
      x: CANVAS_WIDTH_PX / 2 - (dim.width * pixelsPerMeter) / 2,
      y: 400,
      realWidth: dim.width,
      realDepth: dim.depth,
      rotation: 0
    };
    setPlacedItems([...placedItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleUpdateItem = (id: string, updates: Partial<PlannerItem>) => {
    setPlacedItems(placedItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveItem = (id: string) => {
    setPlacedItems(placedItems.filter(item => item.id !== id));
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setIsRightSidebarOpen(false);
    }
  };

  const selectedItem = placedItems.find(i => i.id === selectedItemId);

  return (
    <div className="planner-app">
      {toast && (
        <div className={`planner-toast planner-toast--${toast.type}`}>
          {toast.type === 'warn' && <AlertTriangle size={16} />}
          <span>{toast.msg}</span>
          {toast.type === 'warn' && (
            <Link href="/login" className="planner-toast-link">Đăng nhập</Link>
          )}
          <button onClick={() => setToast(null)} className="planner-toast-close"><X size={14} /></button>
        </div>
      )}

      {/* Exit Prompt Modal */}
      {showExitPromptModal && (
        <div className="planner-modal-overlay">
          <div className="planner-modal">
            <div className="planner-modal-icon">⚠️</div>
            <h3>Chưa lưu thiết kế!</h3>
            <p>Bạn có chắc chắn muốn thoát? Mọi thay đổi chưa lưu sẽ bị mất.</p>
            <div className="planner-modal-actions">
              <button className="planner-modal-btn secondary" onClick={() => setShowExitPromptModal(false)}>Hủy</button>
              <button className="planner-modal-btn warning" onClick={confirmExit}>Thoát (Không lưu)</button>
              <button className="planner-modal-btn primary" onClick={() => { setShowExitPromptModal(false); handleOpenSaveModal(); }}>Lưu thiết kế</button>
            </div>
          </div>
        </div>
      )}

      {/* Space Library Modal (Change Space) */}
      {showSpaceLibraryModal && (
        <div className="planner-modal-overlay" onClick={() => setShowSpaceLibraryModal(false)}>
          <div className="planner-modal space-library-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>Đổi không gian</h3>
              <button 
                onClick={() => setShowSpaceLibraryModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px', display: 'flex' }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto' }}>
              <div className="room-types-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '24px' }}>
                <div 
                  className={`room-type-card upload-card ${isCustomBg ? 'active' : ''}`}
                  onClick={() => document.getElementById('bg-upload')?.click()}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div className="room-type-img-wrapper" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', border: '2px dashed #ccc', borderRadius: '12px' }}>
                    {customImageBase64 ? (
                      <img src={customImageBase64} alt="Custom bg" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#666' }}>
                        <Upload size={24} style={{ margin: '0 auto 8px auto' }} />
                        <span style={{ fontSize: '13px' }}>Tải ảnh lên<br/>(Max: 10MB)</span>
                      </div>
                    )}
                  </div>
                  <h4 style={{ marginTop: 'auto' }}>Ảnh của bạn</h4>
                </div>

                {EMPTY_ROOMS.map(room => (
                  <div 
                    key={room.id}
                    className={`room-type-card ${selectedRoomId === room.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      setIsCustomBg(false);
                      setShowSpaceLibraryModal(false);
                      setSelectedBg(room.photo);
                      setPlacedItems([]);
                    }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <div className="room-type-img-wrapper" style={{ width: '100%', borderRadius: '12px' }}>
                      <img src={room.photo} alt={room.category} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h4 style={{ marginTop: 'auto' }}>{room.category}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="planner-modal-overlay" onClick={() => !isSaving && setShowSaveModal(false)}>
          <div className="planner-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Lưu thiết kế của bạn</h3>
            
            <div className="dims-form-field" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', textAlign: 'left', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Tên thiết kế</label>
              <input 
                type="text" 
                value={designName}
                onChange={e => setDesignName(e.target.value)}
                placeholder="Ví dụ: Phòng khách hiện đại"
                disabled={isSaving}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Công khai thiết kế</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chia sẻ thiết kế này với cộng đồng D'Cor</span>
              </div>
              <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                <input 
                  type="checkbox" 
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  disabled={isSaving}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span className="slider round" style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isPublished ? 'var(--accent)' : '#ccc',
                  transition: '.4s', borderRadius: '24px'
                }}>
                  <span style={{
                    position: 'absolute', content: '""', height: '18px', width: '18px',
                    left: isPublished ? '22px' : '3px', bottom: '3px', backgroundColor: 'white',
                    transition: '.4s', borderRadius: '50%'
                  }}></span>
                </span>
              </label>
            </div>

            <div className="planner-modal-actions" style={{ marginTop: 0 }}>
              <button className="planner-modal-btn secondary" onClick={() => setShowSaveModal(false)} disabled={isSaving}>Hủy</button>
              <button className="planner-modal-btn primary" onClick={handleConfirmSave} disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu thiết kế'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="planner-toolbar">
        <div className="planner-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleBreadcrumbClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
            Thiết kế
          </button>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span className="planner-title" style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>Không gian mới</span>
        </div>

        {roomSelected && (
          <>
            <div className="planner-toolbar-center">
              <button className="toolbar-btn icon-only" data-tooltip="Hoàn tác"><Undo size={18} /></button>
              <button className="toolbar-btn icon-only" data-tooltip="Làm lại"><Redo size={18} /></button>
              <div className="toolbar-divider" style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
              <button className="toolbar-btn icon-only" data-tooltip="Đổi không gian" onClick={handleChangeSpace}><LayoutTemplate size={18} /></button>
              <button className="toolbar-btn icon-only" data-tooltip="Điều chỉnh kích thước" onClick={() => setDimsConfirmed(false)}><Maximize size={18} /></button>
            </div>
            <div className="planner-toolbar-right">
              <button className="toolbar-btn icon-only" data-tooltip="Tải xuống"><Download size={18} /></button>
              <button className="toolbar-btn icon-only" data-tooltip="Chia sẻ"><Share2 size={18} /></button>
              <button 
                className="toolbar-btn primary icon-only" 
                data-tooltip="Lưu" 
                onClick={handleOpenSaveModal}
              >
                <Save size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="planner-main" style={{ paddingRight: 0 }}>
        {roomSelected && (
          <div className="planner-sidebar left-sidebar">
            <div className="sidebar-header">
              <h3>Danh mục sản phẩm</h3>
              <div className="catalog-search">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm nội thất..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="catalog-categories-wrapper">
              <button
                className={`cat-scroll-btn left${catCanScrollLeft ? ' visible' : ''}`}
                onClick={() => scrollCat('left')}
                aria-label="Cuộn trái"
                tabIndex={catCanScrollLeft ? 0 : -1}
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
              </button>
              <div className="catalog-categories" ref={catScrollRef} onScroll={updateCatScroll}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => { setActiveCategory(cat); setCatalogPage(0); }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                className={`cat-scroll-btn right${catCanScrollRight ? ' visible' : ''}`}
                onClick={() => scrollCat('right')}
                aria-label="Cuộn phải"
                tabIndex={catCanScrollRight ? 0 : -1}
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>

            <div className="catalog-grid">
              {pagedItems.length === 0 ? (
                <div className="catalog-empty">Không tìm thấy sản phẩm.</div>
              ) : (
                pagedItems.map(prod => (
                  <div
                    key={prod.productId}
                    className="catalog-item-card"
                    onClick={() => handleAddProduct(prod)}
                    title={prod.shortDescription_vi || prod.shortDescription}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="catalog-item-img">
                      <img 
                        src={prod.images?.[0] || FALLBACK_IMAGE} 
                        alt={prod.shortDescription} 
                        loading="lazy" 
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                          e.currentTarget.onerror = null;
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="catalog-pagination">
                <button className="cat-page-btn" disabled={catalogPage === 0} onClick={() => setCatalogPage(p => p - 1)} aria-label="Trang trước">←</button>
                <span className="cat-page-info">{catalogPage + 1} / {totalPages}</span>
                <button className="cat-page-btn" disabled={catalogPage >= totalPages - 1} onClick={() => setCatalogPage(p => p + 1)} aria-label="Trang sau">→</button>
              </div>
            )}
          </div>
        )}

        {/* Center Canvas */}
        <div className="planner-canvas-area">
          {!roomSelected ? (
            <div className="room-setup-panel">
              <div className="room-setup-hero" style={{ backgroundImage: `url(${SIDEBAR_HERO})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat' }}>
                <div className="room-setup-hero-overlay" />
                <div className="room-setup-hero-content">
                  <h3 style={{ fontFamily: 'var(--font-title)' }}>Không gian của bạn</h3>
                  <p>Tải ảnh phòng của bạn lên để thiết kế trực tiếp trên không gian thực tế</p>
                  
                  <button 
                    className="room-upload-btn glass-btn"
                    onClick={() => document.getElementById('bg-upload')?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '14px', margin: '16px 0', transition: 'all 0.2s ease' }}
                  >
                    <Upload size={16} /> 
                    {customImageBase64 ? 'Đổi ảnh khác' : 'Tải không gian lên'}
                  </button>

                  <input 
                    id="bg-upload" 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          usePlannerStore.getState().setCustomImageBase64(base64);
                          setSelectedBg(base64);
                          setSelectedRoomId('custom');
                          setIsCustomBg(true);
                          setRoomSelected(true);
                          setDimsConfirmed(false);
                          setPlacedItems([]);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
                </div>
              </div>

              {/* DCor room library */}
              <div className="room-library-panel">
                <div className="room-library-header">
                  <p className="room-library-title">Không gian của D&apos;Cor</p>
                  <div className="room-filter-tabs">
                    {ROOM_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        className={`room-filter-tab ${roomFilterCat === cat ? 'active' : ''}`}
                        onClick={() => { setRoomFilterCat(cat); setRoomPage(0); }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {(() => {
                  const filtered = roomFilterCat === 'Tất cả'
                    ? EMPTY_ROOMS
                    : EMPTY_ROOMS.filter(r => r.category === roomFilterCat);
                  const totalRoomPages = Math.ceil(filtered.length / ROOMS_PER_PAGE);
                  const paged = filtered.slice(roomPage * ROOMS_PER_PAGE, (roomPage + 1) * ROOMS_PER_PAGE);
                  return (
                    <>
                      <div className="room-library-grid">
                        {paged.map(room => (
                          <button
                            key={room.id}
                            className={`room-library-card ${selectedRoomId === room.id ? 'active' : ''}`}
                            onClick={() => handleSelectRoom(room)}
                          >
                            <div className="room-library-img" style={{ backgroundImage: `url(${room.photo})` }} />
                          </button>
                        ))}
                      </div>
                      {totalRoomPages > 1 && (
                        <div className="room-lib-pagination">
                          <button disabled={roomPage === 0} onClick={() => setRoomPage(p => p - 1)} className="cat-page-btn">←</button>
                          <span>{roomPage + 1} / {totalRoomPages}</span>
                          <button disabled={roomPage >= totalRoomPages - 1} onClick={() => setRoomPage(p => p + 1)} className="cat-page-btn">→</button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div
              className="canvas-wrapper"
              ref={canvasRef}
              style={{ transform: `scale(${zoom / 100})`, backgroundColor: selectedBg.startsWith('#') ? selectedBg : 'transparent' }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => {
                setSelectedItemId(null);
                setShowVariantModal(null);
                setIsRightSidebarOpen(false);
              }}
            >
            <div className="canvas-bg" style={{ backgroundImage: selectedBg.startsWith('data:') || selectedBg.startsWith('http') ? `url(${selectedBg})` : undefined, backgroundColor: selectedBg.startsWith('#') ? selectedBg : undefined }}></div>
            
            {!dimsConfirmed && (
              <div className="room-dims-prompt" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(4px)' }}>
                <h2>Thiết lập kích thước</h2>
                <p>Nhập kích thước thực tế của không gian này để chúng tôi tính toán tỉ lệ cho nội thất hiển thị chính xác nhất.</p>
                <div className="dims-form-group">
                  <div className="dims-form-field">
                    <label>Chiều ngang (m)</label>
                    <input type="number" min="1" step="0.5" value={roomWidth} onChange={e => setRoomWidth(parseFloat(e.target.value) || 5)} />
                  </div>
                  <div className="dims-form-field">
                    <label>Chiều dọc/sâu (m)</label>
                    <input type="number" min="1" step="0.5" value={roomDepth} onChange={e => setRoomDepth(parseFloat(e.target.value) || 4)} />
                  </div>
                  <div className="dims-form-field">
                    <label>Chiều cao (m)</label>
                    <input type="number" min="1" step="0.5" value={roomHeight} onChange={e => setRoomHeight(parseFloat(e.target.value) || 3)} />
                  </div>
                </div>
                <div className="dims-form-actions">
                  <button className="planner-modal-btn primary" onClick={() => setDimsConfirmed(true)}>Lưu kích thước</button>
                </div>
              </div>
            )}

            {placedItems.length === 0 && dimsConfirmed && (
              <div className="canvas-empty-state">
                <h3>Không gian đang trống</h3>
                <p>Nhấn vào sản phẩm ở bảng trái để thêm vào phòng.</p>
                <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'inline-block', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  Kích thước: <strong>{roomWidth}m (Ngang)</strong> × <strong>{roomDepth}m (Dọc)</strong> × <strong>{roomHeight}m (Cao)</strong>
                </div>
              </div>
            )}

            {placedItems.map(item => {
                  const isSelected = item.id === selectedItemId;
                  return (
                    <div 
                      key={item.id}
                      className={`canvas-item ${isSelected ? 'selected' : ''}`}
                      onMouseDown={(e) => handleMouseDown(e, item.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedItemId(item.id); setIsRightSidebarOpen(true); }}
                      style={{
                        left: item.x,
                        top: item.y,
                        transform: `translate(-50%, -50%) rotateZ(${item.rotation}deg) rotateX(${item.rotationX || 0}deg) rotateY(${item.rotationY || 0}deg)`,
                        cursor: draggingId.current === item.id ? 'grabbing' : 'grab',
                        userSelect: 'none',
                      }}
                    >
                      <img src={item.image} alt={item.name} draggable={false} style={{ width: `${item.realWidth * pixelsPerMeter}px`, maxWidth: 'none', transition: 'width 0.3s ease' }} />
                      {isSelected && (
                        <div className="item-controls-overlay">
                          <button className="ctrl-btn delete" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}><X size={14}/></button>
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
          )}

          {/* Canvas Controls */}
          {roomSelected && (
          <div className="canvas-controls">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))}><ZoomOut size={18} /></button>
            <span>{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))}><ZoomIn size={18} /></button>
            <div className="divider"></div>
            <button onClick={() => setZoom(100)}><Maximize size={18} /></button>
          </div>
          )}
        </div>

        {/* Right Sidebar: Collapsed Handle */}
        {!isRightSidebarOpen && roomSelected && (
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '28px', background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-color)', zIndex: 10, display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => setIsRightSidebarOpen(true)}
              style={{ width: '100%', height: '56px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
              title="Mở chi tiết"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}

        {/* Right Sidebar: Open */}
        {isRightSidebarOpen && (() => {
          const fullProduct = selectedItem ? products.find(p => p.productId === selectedItem.productId) : null;
          return (
          <div className="planner-sidebar right-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setIsRightSidebarOpen(false)}
              title="Đóng chi tiết"
              style={{
                position: 'absolute',
                left: '-28px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '28px',
                height: '56px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '-4px 0 8px rgba(0,0,0,0.05)',
                zIndex: 10,
                color: 'var(--text-muted)'
              }}
            >
              <ChevronRight size={18} />
            </button>
            <div className="properties-panel" style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
              {selectedItem && fullProduct ? (
                <>
              <div className="panel-section">
                <h3>Chi tiết sản phẩm</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={selectedItem.image} alt={selectedItem.name} className="prop-image" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: 0, border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <div>
                    <h4 className="prop-title" style={{ margin: 0, fontSize: '15px' }}>{selectedItem.name}</h4>
                    <div className="prop-price" style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{selectedItem.formattedPrice}</div>
                  </div>
                </div>

                {/* Variant Groups */}
                {fullProduct && ((fullProduct.refinementColors_vi?.length ?? 0) > 0 || (fullProduct.refinementMaterials_vi?.length ?? 0) > 0) && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(fullProduct.refinementColors_vi?.length ?? 0) > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="cat-tab"
                          onClick={() => {
                            if (fullProduct.refinementColors_vi!.length > 1) {
                              setShowVariantModal(showVariantModal?.title === 'Màu sắc' ? null : { title: 'Màu sắc', options: fullProduct.refinementColors_vi! });
                            }
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px', cursor: fullProduct.refinementColors_vi!.length === 1 ? 'default' : 'pointer' }}
                        >
                          {fullProduct.refinementColors_vi!.length === 1 ? `Màu sắc: ${fullProduct.refinementColors_vi![0]}` : 'Chọn màu sắc ▾'}
                        </button>
                        {fullProduct.refinementColors_vi!.length > 1 && showVariantModal?.title === 'Màu sắc' && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '150px', maxHeight: '200px', overflowY: 'auto' }}>
                            {showVariantModal.options.map((opt, i) => (
                              <button key={i} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', borderBottom: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer' }} onClick={() => { showToast(`Đã chọn màu sắc: ${opt}`, 'info'); setShowVariantModal(null); }}>{opt}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {(fullProduct.refinementMaterials_vi?.length ?? 0) > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button 
                          className="cat-tab"
                          onClick={() => {
                            if (fullProduct.refinementMaterials_vi!.length > 1) {
                              setShowVariantModal(showVariantModal?.title === 'Chất liệu' ? null : { title: 'Chất liệu', options: fullProduct.refinementMaterials_vi! });
                            }
                          }}
                          style={{ padding: '6px 12px', fontSize: '12px', cursor: fullProduct.refinementMaterials_vi!.length === 1 ? 'default' : 'pointer' }}
                        >
                          {fullProduct.refinementMaterials_vi!.length === 1 ? `Chất liệu: ${fullProduct.refinementMaterials_vi![0]}` : 'Chọn chất liệu ▾'}
                        </button>
                        {fullProduct.refinementMaterials_vi!.length > 1 && showVariantModal?.title === 'Chất liệu' && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '150px', maxHeight: '200px', overflowY: 'auto' }}>
                            {showVariantModal.options.map((opt, i) => (
                              <button key={i} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', borderBottom: '1px solid var(--border-color)', fontSize: '13px', cursor: 'pointer' }} onClick={() => { showToast(`Đã chọn chất liệu: ${opt}`, 'info'); setShowVariantModal(null); }}>{opt}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="panel-section">
                <h3>Kích thước sản phẩm (m)</h3>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <div className="dims-form-field" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Ngang (Width)</label>
                    <input 
                      type="number" step="0.1" min="0.1"
                      value={selectedItem.realWidth}
                      readOnly
                      disabled
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div className="dims-form-field" style={{ flex: 1, marginBottom: 0 }}>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Dọc (Depth)</label>
                    <input 
                      type="number" step="0.1" min="0.1"
                      value={selectedItem.realDepth}
                      readOnly
                      disabled
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <h3>Tùy chỉnh góc độ (3D)</h3>
                
                <div className="slider-group" style={{ marginBottom: '16px' }}>
                  <label>
                    <span>Xoay mặt phẳng (Z)</span>
                    <span>{selectedItem.rotation}°</span>
                  </label>
                  <input 
                    type="range" min="-180" max="180" step="5"
                    className="rotation-slider"
                    value={selectedItem.rotation}
                    onChange={(e) => handleUpdateItem(selectedItem.id, { rotation: parseInt(e.target.value) })}
                    style={{
                      background: selectedItem.rotation > 0 
                        ? `linear-gradient(to right, var(--border-color) 50%, var(--accent) 50%, var(--accent) ${((selectedItem.rotation + 180) / 360) * 100}%, var(--border-color) ${((selectedItem.rotation + 180) / 360) * 100}%)`
                        : selectedItem.rotation < 0
                        ? `linear-gradient(to right, var(--border-color) ${((selectedItem.rotation + 180) / 360) * 100}%, rgba(188, 95, 19, 0.5) ${((selectedItem.rotation + 180) / 360) * 100}%, rgba(188, 95, 19, 0.5) 50%, var(--border-color) 50%)`
                        : `var(--border-color)`
                    }}
                  />
                </div>

                <div className="slider-group" style={{ marginBottom: '16px' }}>
                  <label>
                    <span>Xoay ngang (Y)</span>
                    <span>{selectedItem.rotationY || 0}°</span>
                  </label>
                  <input 
                    type="range" min="-180" max="180" step="5"
                    className="rotation-slider"
                    value={selectedItem.rotationY || 0}
                    onChange={(e) => handleUpdateItem(selectedItem.id, { rotationY: parseInt(e.target.value) })}
                    style={{
                      background: (selectedItem.rotationY || 0) > 0 
                        ? `linear-gradient(to right, var(--border-color) 50%, var(--accent) 50%, var(--accent) ${(((selectedItem.rotationY || 0) + 180) / 360) * 100}%, var(--border-color) ${(((selectedItem.rotationY || 0) + 180) / 360) * 100}%)`
                        : (selectedItem.rotationY || 0) < 0
                        ? `linear-gradient(to right, var(--border-color) ${(((selectedItem.rotationY || 0) + 180) / 360) * 100}%, rgba(188, 95, 19, 0.5) ${(((selectedItem.rotationY || 0) + 180) / 360) * 100}%, rgba(188, 95, 19, 0.5) 50%, var(--border-color) 50%)`
                        : `var(--border-color)`
                    }}
                  />
                </div>

                <div className="slider-group">
                  <label>
                    <span>Xoay dọc (X)</span>
                    <span>{selectedItem.rotationX || 0}°</span>
                  </label>
                  <input 
                    type="range" min="-180" max="180" step="5"
                    className="rotation-slider"
                    value={selectedItem.rotationX || 0}
                    onChange={(e) => handleUpdateItem(selectedItem.id, { rotationX: parseInt(e.target.value) })}
                    style={{
                      background: (selectedItem.rotationX || 0) > 0 
                        ? `linear-gradient(to right, var(--border-color) 50%, var(--accent) 50%, var(--accent) ${(((selectedItem.rotationX || 0) + 180) / 360) * 100}%, var(--border-color) ${(((selectedItem.rotationX || 0) + 180) / 360) * 100}%)`
                        : (selectedItem.rotationX || 0) < 0
                        ? `linear-gradient(to right, var(--border-color) ${(((selectedItem.rotationX || 0) + 180) / 360) * 100}%, rgba(188, 95, 19, 0.5) ${(((selectedItem.rotationX || 0) + 180) / 360) * 100}%, rgba(188, 95, 19, 0.5) 50%, var(--border-color) 50%)`
                        : `var(--border-color)`
                    }}
                  />
                </div>
              </div>

                </>
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Info size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>Chọn một sản phẩm để xem và tùy chỉnh chi tiết</p>
                </div>
              )}
            </div>

            {selectedItem && fullProduct && (
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px', background: 'var(--bg-primary)', zIndex: 10 }}>
              <button 
                className="planner-cart-btn"
                title="Thêm vào giỏ hàng"
                style={{ flex: 1, marginBottom: 0, padding: '12px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                onClick={(e) => {
                  addToCart({ productId: selectedItem.productId, name: selectedItem.name, price: selectedItem.price, image: selectedItem.image });
                  flyToCart(e, selectedItem.image);
                }}
              >
                <ShoppingCart size={20} />
              </button>
              <Link 
                href={`/kham-pha/${selectedItem.productId}`} 
                target="_blank" 
                className="planner-view-btn"
                title="Xem chi tiết sản phẩm"
                style={{ flex: 1, marginBottom: 0, padding: '12px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                <Info size={20} />
              </Link>
              <button 
                className="planner-delete-btn" 
                title="Xóa khỏi thiết kế"
                style={{ flex: 1, marginBottom: 0, padding: '12px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }} 
                onClick={() => handleRemoveItem(selectedItem.id)}
              >
                <Trash2 size={20} />
              </button>
            </div>
            )}
        </div>
        )})()}
      </div>
    </div>
  );
}

export default function RoomPlannerApp() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Đang tải công cụ thiết kế...</div>}>
      <RoomPlannerContent />
    </Suspense>
  );
}
