'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Box, CheckCircle2, Clock, MapPin, User, FileText, ArrowRight } from 'lucide-react';
import { getInventoryHistory } from '@/lib/data/inventoryHistory';

export default function InventoryTransactionDetail() {
  const router = useRouter();
  const params = useParams();
  const txId = params?.id as string;
  
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const history = getInventoryHistory();
    const found = history.find(t => t.id === txId);
    setData(found || history[0]);
  }, [txId]);

  if (!data) return <div style={{ padding: '24px' }}>Đang tải dữ liệu...</div>;

  const isPositive = data.quantity.startsWith('+');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* HEADER & BREADCRUMB */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button 
          onClick={() => router.push('/admin/inventory/history')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 'fit-content' }}
        >
          <ArrowLeft size={18} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Quay lại Lịch sử biến động kho</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Chi tiết biến động {data.id}
          </h1>
          <span style={{ 
            padding: '4px 10px', 
            borderRadius: '6px', 
            fontSize: '13px', 
            fontWeight: 600, 
            background: data.status === 'Đã hoàn tất' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            color: data.status === 'Đã hoàn tất' ? 'rgb(21, 128, 61)' : 'rgb(161, 98, 7)'
          }}>
            {data.status === 'Đã hoàn tất' && <CheckCircle2 size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />}
            {data.status}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Khối 1: Thông tin biến động */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--accent)" /> Thông tin chung
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Loại biến động</span>
              <span style={{ fontWeight: 600 }}>{data.type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Thời gian</span>
              <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {data.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{data.type === 'Chuyển kho' ? 'Kho nguồn' : 'Kho / Showroom'}</span>
              <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> {data.location}</span>
            </div>
            {data.type === 'Chuyển kho' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kho đích</span>
                <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)' }}><MapPin size={14} /> {data.destLocation}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Người thực hiện</span>
              <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {data.creator}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tham chiếu</span>
              <span style={{ fontWeight: 600, color: 'var(--accent)', cursor: 'pointer' }}>{data.reference}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Khối 2: Sản phẩm */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={18} color="var(--accent)" /> Sản phẩm
            </h2>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box size={24} color="var(--text-muted)" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{data.productName}</h3>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Biến thể: <strong>{data.variant}</strong></p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>SKU: {data.sku}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tồn trước</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{data.beforeStock}</div>
              </div>
              <ArrowRight size={20} color="var(--text-muted)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Thay đổi</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)' }}>
                  {data.quantity}
                </div>
              </div>
              <ArrowRight size={20} color="var(--text-muted)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tồn sau</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>{data.stockAfter}</div>
              </div>
            </div>
          </div>

          {/* Khối 3: Lý do biến động */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Lý do / Ghi chú</h2>
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {data.reason}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
