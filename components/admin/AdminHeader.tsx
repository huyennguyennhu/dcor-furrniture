'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('dcor_user');
    router.push('/login');
  };

  return (
    <header style={{ 
      height: '80px', 
      flexShrink: 0,
      background: 'var(--bg-primary)', 
      borderBottom: '1px solid var(--border-color)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Left: Logo */}
      <div style={{ width: '250px' }}>
        <Link href="/admin/reports/overview" style={{ textDecoration: 'none' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
            D<span style={{color: 'var(--accent)'}}>&apos;</span>Cor <span style={{fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)'}}>Admin</span>
          </h2>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 16px', borderRadius: '24px', width: '400px', maxWidth: '100%' }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm chức năng..." 
            style={{ border: 'none', background: 'none', outline: 'none', fontSize: '14px', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '250px', justifyContent: 'flex-end' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: 'var(--text-secondary)' }}>
          <Bell size={20} />
          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--accent)', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</span>
        </button>

        <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
            <img src="https://ui-avatars.com/api/?name=Admin&background=111111&color=fff" alt="Admin Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Admin User</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Super Admin</span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Đăng xuất"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
