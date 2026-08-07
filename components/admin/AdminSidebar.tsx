'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Archive, 
  ShoppingCart, 
  Tag, 
  CalendarCheck, 
  FileText, 
  MessageSquare, 
  Image as ImageIcon, 
  Settings,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

const MENU_ITEMS = [
  {
    title: 'Báo cáo & Thống kê',
    icon: <LayoutDashboard size={20} />,
    href: '/admin/reports',
    subItems: [
      { title: 'Tổng quan', href: '/admin/reports/overview' },
      { title: 'Báo cáo doanh thu', href: '/admin/reports/revenue' },
      { title: 'Báo cáo đơn hàng', href: '/admin/reports/orders' },
      { title: 'Báo cáo sản phẩm', href: '/admin/reports/products' },
      { title: 'Báo cáo khách hàng', href: '/admin/reports/customers' },
    ]
  },
  {
    title: 'Quản lý khách hàng',
    icon: <Users size={20} />,
    href: '/admin/customers'
  },
  {
    title: 'Quản lý sản phẩm',
    icon: <Package size={20} />,
    href: '/admin/products',
    subItems: [
      { title: 'Danh sách sản phẩm', href: '/admin/products' },
      { title: 'Danh mục', href: '/admin/products/categories' },
    ]
  },
  {
    title: 'Quản lý tồn kho',
    icon: <Archive size={20} />,
    href: '/admin/inventory'
  },
  {
    title: 'Quản lý đơn hàng',
    icon: <ShoppingCart size={20} />,
    href: '/admin/orders',
    subItems: [
      { title: 'Danh sách đơn hàng', href: '/admin/orders' },
      { title: 'Yêu cầu đổi trả', href: '/admin/orders/returns' },
      { title: 'Bảo hành', href: '/admin/orders/warranty' },
    ]
  },
  {
    title: 'Quản lý khuyến mãi',
    icon: <Tag size={20} />,
    href: '/admin/promotions'
  },
  {
    title: 'Lịch tư vấn',
    icon: <CalendarCheck size={20} />,
    href: '/admin/appointments'
  },
  {
    title: 'Quản lý nội dung',
    icon: <FileText size={20} />,
    href: '/admin/content'
  },
  {
    title: 'Hội thoại Chatbox',
    icon: <MessageSquare size={20} />,
    href: '/admin/chat'
  },
  {
    title: 'Quản lý thiết kế',
    icon: <ImageIcon size={20} />,
    href: '/admin/designs'
  },
  {
    title: 'Cài đặt hệ thống',
    icon: <Settings size={20} />,
    href: '/admin/settings',
    subItems: [
      { title: 'Thông tin chung', href: '/admin/settings/general' },
      { title: 'Vận chuyển & Thanh toán', href: '/admin/settings/logistics' },
      { title: 'Tài khoản & Phân quyền', href: '/admin/settings/users' },
    ]
  }
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<{ href: string, top: number } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Initialize active openMenu based on pathname
  useEffect(() => {
    const activeItem = MENU_ITEMS.find(item => 
      item.href === pathname || 
      item.subItems?.some(sub => pathname === sub.href)
    );
    if (activeItem) {
      setOpenMenu(activeItem.href);
    }
  }, [pathname]);

  const toggleMenu = (href: string) => {
    if (isCollapsed) setIsCollapsed(false); // Auto expand if opening a menu while collapsed
    setOpenMenu(prev => prev === href ? null : href);
  };

  const isParentActive = (item: any) => {
    if (item.subItems) return item.subItems.some((sub: any) => pathname === sub.href);
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, href: string) => {
    if (!isCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredMenu({ href, top: rect.top });
  };

  const handleMouseLeave = () => {
    if (!isCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 300); // 300ms delay to allow moving mouse to dropdown
  };

  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleDropdownMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
    }, 300);
  };

  return (
    <aside style={{ 
      width: isCollapsed ? '80px' : '260px',
      flexShrink: 0,
      transition: 'width 0.3s ease',
      background: 'var(--bg-secondary)', 
      borderRight: '1px solid var(--border-color)', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      position: 'relative',
      zIndex: 20
    }}>
      
      {/* Toggle Button */}
      <button 
        onClick={() => {
          setIsCollapsed(!isCollapsed);
          setHoveredMenu(null); // Close dropdown if any
        }}
        style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '-14px', 
          width: '28px', 
          height: '28px', 
          borderRadius: '50%', 
          background: 'var(--bg-primary)', 
          border: '1px solid var(--border-color)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer', 
          zIndex: 30, 
          color: 'var(--text-secondary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px 12px' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MENU_ITEMS.map((item, idx) => {
            const active = isParentActive(item);
            const isOpen = openMenu === item.href && !isCollapsed;

            const parentStyle: React.CSSProperties = {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              padding: isCollapsed ? '12px' : '12px 16px',
              borderRadius: '12px',
              background: active ? 'rgba(188, 95, 19, 0.1)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: active ? 600 : 500,
              transition: 'all 0.2s',
              position: 'relative'
            };

            return (
              <div 
                key={idx} 
                style={{ position: 'relative' }}
                onMouseEnter={(e) => handleMouseEnter(e, item.href)}
                onMouseLeave={handleMouseLeave}
              >
                {item.subItems ? (
                  <button onClick={() => toggleMenu(item.href)} style={parentStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.icon}
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    {!isCollapsed && (
                      isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    )}
                  </button>
                ) : (
                  <Link href={item.href} style={{ ...parentStyle, textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.icon}
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                  </Link>
                )}

                {/* Sub items - Accordion for Expanded State */}
                {!isCollapsed && item.subItems && (
                  <div style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.3s ease'
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '44px', marginTop: '4px', gap: '2px' }}>
                        {item.subItems.map((sub, sIdx) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link 
                              key={sIdx} 
                              href={sub.href}
                              className={`admin-sub-item ${isSubActive ? 'active' : ''}`}
                            >
                              <span className="dot"></span>
                              {sub.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {/* Hover Dropdown for Collapsed State - Rendered inside the item container so hover works */}
                {isCollapsed && hoveredMenu?.href === item.href && (
                  <div 
                    onMouseEnter={handleDropdownMouseEnter}
                    onMouseLeave={handleDropdownMouseLeave}
                    style={{
                      position: 'fixed',
                      left: '80px',
                      top: `${hoveredMenu.top}px`,
                      paddingLeft: '10px', /* Minimal gap since we use timeout */
                      zIndex: 9999
                    }}
                  >
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      width: '220px',
                      boxShadow: 'var(--card-shadow)',
                      padding: '8px',
                    }}>
                {item.subItems ? (
                  <>
                    <div style={{ padding: '8px 12px', fontSize: '14px', fontWeight: 600, color: 'var(--accent)', borderBottom: '1px solid var(--border-color)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.icon} {item.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {item.subItems.map((sub, sIdx) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link 
                            key={sIdx}
                            href={sub.href}
                            className={`admin-sub-item ${isSubActive ? 'active' : ''}`}
                          >
                            <span className="dot"></span>
                            {sub.title}
                          </Link>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <Link 
                    href={item.href}
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '8px 12px', 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      borderRadius: '8px'
                    }}
                  >
                    {item.icon} {item.title}
                  </Link>
                )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
