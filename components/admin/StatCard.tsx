import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export default function StatCard({ title, value, icon, trend, description }: StatCardProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
        <div style={{ color: 'var(--text-muted)' }}>{icon}</div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
        {trend && (
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: trend.isPositive ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {description && (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</span>
      )}
    </div>
  );
}
