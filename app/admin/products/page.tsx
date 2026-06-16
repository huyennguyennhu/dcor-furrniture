'use client';

import React, { useState } from 'react';
import { BOCONCEPT_CATALOG, CatalogProduct } from '@/lib/data';

export default function AdminProducts() {
  const [products, setProducts] = useState<CatalogProduct[]>(BOCONCEPT_CATALOG);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const handleToggleStatus = (productId: string) => {
    alert(`Đã cập nhật trạng thái sản phẩm ${productId} thành công.`);
  };

  const handleEditPrice = (productId: string) => {
    const newPriceStr = prompt('Nhập mức giá sàn mới cho sản phẩm:');
    if (!newPriceStr) return;
    const newPrice = parseInt(newPriceStr);
    if (isNaN(newPrice)) {
      alert('Vui lòng nhập giá trị hợp lệ!');
      return;
    }
    setProducts(prev => prev.map(p => {
      if (p.productId === productId) {
        const updatedPrices = [{ ...p.prices[0], price: newPrice, formattedPrice: formatVND(newPrice) }];
        return { ...p, prices: updatedPrices };
      }
      return p;
    }));
    alert('Đã cập nhật giá sàn sản phẩm thành công.');
  };

  return (
    <div>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700 }}>️ Quản Lý Danh Mục Sản Phẩm</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Xem, cập nhật trạng thái và điều chỉnh giá sàn sản phẩm</p>
        </div>
        <button className="add-cart-btn" onClick={() => alert('Chức năng [Thêm sản phẩm mới] đang được phát triển.')} style={{ padding: '10px 20px', fontSize: '13px' }}>
          Thêm sản phẩm mới
        </button>
      </div>

      <div className="filters-container" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <th style={{ padding: '15px 20px' }}>Ảnh</th>
              <th style={{ padding: '15px 20px' }}>Mã sản phẩm</th>
              <th style={{ padding: '15px 20px' }}>Tên sản phẩm</th>
              <th style={{ padding: '15px 20px' }}>Danh mục</th>
              <th style={{ padding: '15px 20px' }}>Giá sàn từ</th>
              <th style={{ padding: '15px 20px', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const titleVi = p.shortDescription_vi || p.shortDescription;
              const formattedPrice = p.prices[0] ? p.prices[0].formattedPrice : 'Liên hệ';
              
              return (
                <tr key={p.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 20px' }}>
                    <img src={p.images[0]} alt={titleVi} style={{ width: '50px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  </td>
                  <td style={{ padding: '12px 20px', fontWeight: 600 }}>{p.productId}</td>
                  <td style={{ padding: '12px 20px' }}>{titleVi}</td>
                  <td style={{ padding: '12px 20px' }}>{p.category}</td>
                  <td style={{ padding: '12px 20px', color: 'var(--accent)', fontWeight: 600 }}>{formattedPrice}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="customize-btn" onClick={() => handleEditPrice(p.productId)} style={{ padding: '6px 12px', fontSize: '12px' }}>
                        ️ Sửa giá
                      </button>
                      <button className="customize-btn" onClick={() => handleToggleStatus(p.productId)} style={{ padding: '6px 12px', fontSize: '12px', color: '#52b788' }}>
                        ️ Ẩn/Hiện
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
