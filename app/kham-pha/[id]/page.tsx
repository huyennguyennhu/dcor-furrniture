'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CatalogProduct } from '@/lib/data';

import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductFeatures from '@/components/product/ProductFeatures';
import ProductUSP from '@/components/product/ProductUSP';
import ProductTabs from '@/components/product/ProductTabs';
import ProductCommunity from '@/components/product/ProductCommunity';
import RoomPlannerCTA from '@/components/product/RoomPlannerCTA';
import ProductReviews from '@/components/product/ProductReviews';
import RelatedProducts from '@/components/product/RelatedProducts';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayImages, setDisplayImages] = useState<string[]>([]);

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          setDisplayImages(data.images || []);
        } else {
          router.push('/');
        }
      } catch {
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
          <p>Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const title = product.shortDescription_vi || product.shortDescription;

  return (
    <div className="pdp-wrapper" style={{ padding: '24px 0 80px 0', background: 'var(--bg-primary)' }}>
      <div className="container">
        {/* 1. Breadcrumb */}
        <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '32px' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Trang chủ</Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <Link href="/kham-pha" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Khám phá</Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <Link href={`/kham-pha?category=${encodeURIComponent(product.category || 'Sản phẩm')}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{product.category || 'Sản phẩm'}</Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{title}</span>
        </div>

        {/* 2. Hero Section */}
        <div className="pdp-hero-grid" style={{ display: 'grid', gridTemplateColumns: '6fr 5fr', gap: '48px', marginBottom: '40px' }}>
          {/* Trái: Gallery */}
          <ProductGallery images={displayImages.length > 0 ? displayImages : (product.images || [])} name={title} product={product} />
          
          {/* Phải: Thông tin & Thuộc tính & CTA */}
          <div className="pdp-hero-info">
            <ProductInfo product={product} onImagesChange={setDisplayImages} />
          </div>
        </div>

        {/* 3. Kích thước & USP/Vận chuyển */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '48px', marginBottom: '40px' }}>
          {/* Cột Trái: Bảng Kích thước */}
          <div>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Kích thước & Trọng lượng
            </h3>
            {product.variants?.[0]?.dimensions ? (
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <tbody>
                    {Object.entries(product.variants[0].dimensions).map(([key, value], idx, arr) => {
                      const labelMap: Record<string, string> = {
                        depth: 'Chiều sâu', width: 'Chiều rộng', height: 'Chiều cao', weight: 'Trọng lượng',
                        legsHeight: 'Chiều cao chân', armrestHeight: 'Tay vịn', seatingHeight: 'Mặt ngồi'
                      };
                      const isLast = idx === arr.length - 1;
                      
                      let displayValue = String(value);
                      displayValue = displayValue.replace(/\/999999/g, '').replace(/999999/g, 'Đang cập nhật');

                      return (
                        <tr key={key} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px 24px', color: 'var(--text-secondary)', fontSize: '14px', width: '50%' }}>{labelMap[key] || key}</td>
                          <td style={{ padding: '10px 24px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, textAlign: 'right' }}>{displayValue}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Đang cập nhật...</p>
              </div>
            )}
          </div>

          {/* Cột Phải: USP & Vận chuyển xếp dọc */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ProductUSP />

            {/* Vận chuyển */}
            <div className="product-usp-section" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Vận chuyển & Lắp đặt
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Thời gian:</strong>
                  <span>Nội thành HCM: 1-3 ngày<br/>Toàn quốc: 3-7 ngày</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Phí dịch vụ:</strong>
                  <span>Miễn phí đơn &gt; 10 triệu<br/>Hỗ trợ lắp đặt toàn quốc</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Thông số chi tiết */}
        <ProductTabs product={product} />

        {/* Đặc điểm nổi bật */}
        <ProductFeatures product={product} />

        {/* 5. Không gian thực tế (Community) */}
        <ProductCommunity productId={product.productId} productName={title} />

        {/* 6. Tương thích Room Planner */}
        <RoomPlannerCTA productId={product.productId} />

        {/* 7. Đánh giá (Reviews) */}
        <ProductReviews productId={product.productId} />

        {/* 8. Sản phẩm liên quan */}
        <RelatedProducts currentProductId={product.productId} category={product.category} />
      </div>
    </div>
  );
}
