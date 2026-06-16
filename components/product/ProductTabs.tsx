'use client';

import React from 'react';
import { CatalogProduct } from '@/lib/data';

export default function ProductTabs({ product }: { product: CatalogProduct }) {
  const title = product.shortDescription_vi || product.shortDescription;

  return (
    <div className="product-details-section" style={{ marginTop: '60px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>Mô tả sản phẩm</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
        {/* Cột 1: Mô tả chung */}
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>Đẳng cấp không gian sống</h3>
          <p style={{ marginBottom: '16px' }}>{title} mang đến cảm giác thanh lịch và ấm cúng cho không gian sống của bạn. Mỗi chi tiết đều được chăm chút tỉ mỉ từ những người thợ thủ công lành nghề nhất.</p>
          <p>Sản phẩm không chỉ là một món đồ nội thất, mà còn là điểm nhấn thể hiện gu thẩm mỹ tinh tế của gia chủ.</p>
        </div>

        {/* Cột 2: Thông số & Chất liệu */}
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>Thông số & Chất liệu</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Danh mục:</span> <span style={{ color: 'var(--text-primary)' }}>{product.category}</span>
            </li>
            <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Mã sản phẩm:</span> <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{product.productId}</span>
            </li>
            {product.variantPrices && product.variantPrices.length > 0 && (
              <li style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Số phiên bản:</span> <span style={{ color: 'var(--text-primary)' }}>{product.variantPrices.length}</span>
              </li>
            )}
            <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Chất liệu cấu thành:</strong>
              {product.refinementMaterials_vi?.join(', ') || product.refinementMaterials?.join(', ') || 'Chất liệu cao cấp'}, mang lại độ bền cao và dễ dàng vệ sinh.
            </li>
            <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Màu sắc cơ bản:</strong>
              {product.refinementColors_vi?.join(', ') || product.refinementColors?.join(', ') || 'Đa dạng màu sắc'}.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
