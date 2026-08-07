'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error('Không tìm thấy sản phẩm');
        }
        const data = await res.json();
        
        // Trích xuất Thông số kỹ thuật từ variant đầu tiên nếu có
        let attributes: {name: string, value: string}[] = [];
        if (data.variants && data.variants.length > 0) {
          const v = data.variants[0];
          if (v.dimensions) {
            const dims = [];
            if (v.dimensions.depth) dims.push(`Sâu ${v.dimensions.depth}`);
            if (v.dimensions.width) dims.push(`Rộng ${v.dimensions.width}`);
            if (v.dimensions.height) dims.push(`Cao ${v.dimensions.height}`);
            if (dims.length > 0) attributes.push({ name: 'Kích thước', value: dims.join(' - ') });
            if (v.dimensions.weight) attributes.push({ name: 'Trọng lượng', value: v.dimensions.weight });
            if (v.dimensions.weightLoad) attributes.push({ name: 'Trọng tải', value: v.dimensions.weightLoad });
          }
          if (v.details) {
            if (v.details.finish) attributes.push({ name: 'Bề mặt hoàn thiện', value: v.details.finish });
            if (v.details.designedBy) attributes.push({ name: 'Nhà thiết kế', value: v.details.designedBy });
            if (v.details.upholsteryComposition) attributes.push({ name: 'Chất liệu bọc', value: v.details.upholsteryComposition });
            if (v.details.productSpecification) attributes.push({ name: 'Thông số khác', value: v.details.productSpecification });
          }
        }

        // Map data từ API sang format của form
        setProductData({
          name: data.shortDescription_vi || data.shortDescription,
          product_id: data.id,
          price: data.prices?.[0]?.price || 0,
          comparePrice: data.prices?.[0]?.price ? data.prices[0].price * 1.2 : 0, // Dummy
          weight: 0,
          dimensions: '',
          warranty: '',
          costPrice: 0,
          shortDescription: data.shortDescription_vi || data.shortDescription,
          description: data.description?.join('\\n') || '',
          images: data.images || [],
          category: data.category,
          status: data.isBestSeller ? 'Bán chạy' : (data.isNew ? 'Mới' : 'Đang bán'),
          variants: data.variants || [],
          configOptions: data.configOptions || [],
          discountValue: data.discountValue || null,
          discountType: data.discountType || null,
          attributes: attributes
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải dữ liệu sản phẩm...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</div>
        <button onClick={() => router.push('/admin/products')} style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div>
      <ProductForm isEdit={true} initialData={productData} />
    </div>
  );
}
