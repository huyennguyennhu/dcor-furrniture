'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProductCommunity({ productId, productName }: { productId: string, productName: string }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/products/${productId}/community`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [productId]);

  if (loading || posts.length === 0) return null; // Hide completely if empty or loading

  // Extract all images from the posts
  const communityImages: { img: string, user: string }[] = [];
  posts.forEach(post => {
    if (post.images) {
      try {
        const imgs = Array.isArray(post.images) ? post.images : JSON.parse(post.images as string);
        imgs.forEach((img: string) => {
          communityImages.push({ img, user: post.user?.fullName || 'Người dùng DCor' });
        });
      } catch {}
    }
  });

  if (communityImages.length === 0) return null;

  return (
    <div className="product-community-section" style={{ marginTop: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Không gian thực tế</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{posts.length} khách hàng đã sử dụng {productName} trong không gian thực tế.</p>
        </div>
        <Link href="/community" style={{ color: 'var(--text-primary)', textDecoration: 'underline', fontWeight: 500 }}>
          Xem toàn bộ
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {communityImages.slice(0, 4).map((item, idx) => (
          <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/5', position: 'relative', cursor: 'pointer' }} className="community-card">
            <img src={item.img} alt="Community" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} className="hover-scale" />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                  {item.user.charAt(0)}
                </div>
                <span style={{ fontSize: '12px' }}>{item.user}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
