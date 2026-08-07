'use client';

import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface AdminPageTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function AdminPageTabs({ tabs, activeTab, onTabChange }: AdminPageTabsProps) {
  return (
    <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', overflowX: 'auto' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            type="button"
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '12px 0',
              cursor: 'pointer',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                background: isActive ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                border: isActive ? 'none' : '1px solid var(--border-color)'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
