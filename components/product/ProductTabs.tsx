'use client';

import React from 'react';

export default function ProductTabs({ product }: { product: any }) {
  const title = product.shortDescription_vi || product.shortDescription;
  const descriptions = product.description_vi && product.description_vi.length > 0
    ? product.description_vi
    : product.description && product.description.length > 0 
      ? product.description 
      : [`${title} mang đến cảm giác thanh lịch và ấm cúng cho không gian sống của bạn. Mỗi chi tiết đều được chăm chút tỉ mỉ từ những người thợ thủ công lành nghề nhất.`];

  const details = product.variants?.[0]?.details;

  // Features have been extracted to ProductFeatures.tsx

  // Process Specs
  const specs: { key: string; value: string }[] = [];
  if (details?.productSpecification) {
    const rawSpecs = details.productSpecification.split('|');
    rawSpecs.forEach((spec: string) => {
      const parts = spec.split(':');
      if (parts.length >= 2) {
        let val = parts.slice(1).join(':').trim();
        val = val.replace(/\s*(Bên trong:|Bên ngoài:|Mặt trên:|Phía trên:|Phía dưới:|Bên dưới:|Mặt lưng:)\s*/g, '\n• $1 ');
        specs.push({ key: parts[0].trim(), value: val.trim() });
      }
    });
  }

  // Process Functions
  const functions = details?.importantFunctions ? details.importantFunctions.split('|').map((f: string) => f.trim()) : [];

  return (
    <div className="product-details-section" style={{ marginTop: '40px', marginBottom: '80px' }}>
      <h2 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '32px', textAlign: 'center', letterSpacing: '-0.5px' }}>Thông tin sản phẩm</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px' }}>
        
        {/* Cột Trái: Tổng quan thiết kế & Thông tin cơ bản */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* Tổng quan thiết kế */}
          <div>
            <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '24px' }}>Tổng quan thiết kế</h3>
            <div style={{ marginBottom: '32px' }}>
              {descriptions.map((desc: string, idx: number) => (
                <p key={idx} style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
              ))}
            </div>


          </div>

          {/* Thông tin cơ bản */}
          <div>
            <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '24px' }}>Thông tin cơ bản</h3>
            <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
              <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Danh mục:</span> <span style={{ color: 'var(--text-primary)' }}>{product.category}</span>
              </li>
              <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Mã sản phẩm:</span> <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{product.id}</span>
              </li>
              {details?.designedBy && (
                <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Nhà thiết kế:</span> <span style={{ color: 'var(--text-primary)' }}>{details.designedBy}</span>
                </li>
              )}
              {details?.finish && (
                <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Hoàn thiện:</span> <span style={{ color: 'var(--text-primary)' }}>{details.finish}</span>
                </li>
              )}
              {details?.upholsteryComposition && (
                <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bề mặt bọc:</span> <span style={{ color: 'var(--text-primary)' }}>{details.upholsteryComposition}</span>
                </li>
              )}
            </ul>
          </div>

        </div>

        {/* Cột Phải: Quy cách cấu tạo */}
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '24px' }}>Quy cách cấu tạo</h3>
          <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)' }}>
            {specs.map((spec, idx) => (
              <li key={idx} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>{spec.key}:</strong>
                <span style={{ fontSize: '14px', whiteSpace: 'pre-line', lineHeight: '1.8' }}>{spec.value}</span>
              </li>
            ))}
            {functions.length > 0 && (
              <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '12px' }}>Chức năng bổ sung:</strong>
                <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  {functions.map((func: string, idx: number) => (
                    <li key={idx} style={{ listStyleType: 'disc' }}>{func}</li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
}
