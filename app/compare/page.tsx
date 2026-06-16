'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CompareProduct {
  id: string;
  name: string;
  image: string;
  price: string;
  rating: number;
  dimensions: string;
  material: string;
  color: string;
  warranty: string;
  availability: string;
}

const SAMPLE_PRODUCTS: CompareProduct[] = [
  {
    id: 'SM42250020',
    name: "Sofa Indivi 3 chỗ",
    image: "https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/sofas/SM42250020_boconcept-indivi-upholstery-2.png",
    price: "42,250,000 ₫",
    rating: 4.8,
    dimensions: "H80 x W220 x D90 cm",
    material: "Vải bọc Lazio / Chân thép đen",
    color: "Xám đậm (Grey)",
    warranty: "2 năm",
    availability: "Còn hàng"
  },
  {
    id: '37006300',
    name: "Bàn console Bordeaux",
    image: "https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/tables/37006300_368118_PNG-Web2072dpi.png",
    price: "17,990,000 ₫",
    rating: 4.5,
    dimensions: "H74 x W120 x D32 cm",
    material: "Gỗ công nghiệp sơn mài",
    color: "Xám nhạt (Light Grey)",
    warranty: "1 năm",
    availability: "Còn hàng"
  },
  {
    id: '3400C011',
    name: "Hệ thống tường Como",
    image: "https://ckkvyltbeinzqogjsfli.supabase.co/storage/v1/object/public/dcor/storage/3400C011_36026_PNG-Web2072dpi.png",
    price: "119,900,000 ₫",
    rating: 4.9,
    dimensions: "H200 x W300 x D40 cm",
    material: "Gỗ sơn mài cao cấp / Khung kim loại",
    color: "Đen tuyền (Black / Charcoal)",
    warranty: "3 năm",
    availability: "Liên hệ đặt hàng"
  }
];

export default function ComparePage() {
  const [products, setProducts] = useState<CompareProduct[]>(SAMPLE_PRODUCTS);

  const handleRemove = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh', backgroundColor: 'var(--bg-primary)' }}>
      <div className="container">
        <div style={{ marginBottom: '40px' }}>
          <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Hỗ trợ quyết định</span>
          <h1 style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>So sánh sản phẩm</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '15px' }}>Xem xét và đối chiếu các thông số chi tiết để chọn ra thiết kế hoàn hảo nhất cho không gian của bạn.</p>
        </div>

        {products.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px', 
            background: 'var(--bg-secondary)', 
            borderRadius: '16px',
            border: '1px dashed var(--border-color)'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '20px' }}>Không có sản phẩm nào trong danh sách so sánh.</p>
            <Link href="/" className="cta-btn" style={{ textTransform: 'none' }}>
              Quay lại Bộ sưu tập
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ width: '25%', padding: '24px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>
                    Thuộc tính
                  </th>
                  {products.map(prod => (
                    <th key={prod.id} style={{ width: `${75 / products.length}%`, padding: '24px', verticalAlign: 'top', position: 'relative' }}>
                      <button 
                        onClick={() => handleRemove(prod.id)}
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          color: 'var(--text-muted)',
                          fontSize: '18px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                        title="Xóa khỏi danh sách"
                      >
                        ×
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                        <div style={{ width: '120px', height: '120px', background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <img src={prod.image} alt={prod.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{prod.name}</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>SKU: {prod.id}</span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{prod.price}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Đánh giá</td>
                  {products.map(p => (
                    <td key={p.id} style={{ padding: '16px 24px', fontSize: '14px' }}>
                      <span style={{ color: '#F1C40F', marginRight: '4px' }}></span>
                      <span>{p.rating} / 5.0</span>
                    </td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Kích thước</td>
                  {products.map(p => (
                    <td key={p.id} style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{p.dimensions}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Chất liệu</td>
                  {products.map(p => (
                    <td key={p.id} style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{p.material}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Màu sắc</td>
                  {products.map(p => (
                    <td key={p.id} style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{p.color}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Bảo hành</td>
                  {products.map(p => (
                    <td key={p.id} style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{p.warranty}</td>
                  ))}
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>Trạng thái kho</td>
                  {products.map(p => (
                    <td key={p.id} style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500, color: p.availability.includes('Còn') ? '#2ECC71' : 'var(--accent)' }}>{p.availability}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '24px' }}></td>
                  {products.map(p => (
                    <td key={p.id} style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link href={`/kham-pha/${p.id}`} className="customize-btn" style={{ justifyContent: 'center', padding: '12px 18px', width: '100%' }}>
                          Tùy biến ngay
                        </Link>
                        <Link href={`/room-planner?product=${p.id}`} style={{
                          padding: '12px 18px',
                          borderRadius: '20px',
                          border: '1px solid var(--accent)',
                          color: 'var(--accent)',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          display: 'block'
                        }}>
                          Thử trong phòng
                        </Link>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
