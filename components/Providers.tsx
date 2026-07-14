'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';

function CartSync() {
  const { data: session, status } = useSession();
  const setLoggedIn = useStore(state => state.setLoggedIn);
  const syncCartWithDB = useStore(state => state.syncCartWithDB);
  const cart = useStore(state => state.cart);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && !hasSynced.current) {
      setLoggedIn(true);
      hasSynced.current = true; // Chỉ đồng bộ 1 lần khi login thành công
      
      // Fetch cart từ Database
      fetch('/api/cart')
        .then(res => res.json())
        .then(dbCart => {
           if (Array.isArray(dbCart)) {
              // Nếu khách vãng lai đang có hàng trong Local, gộp lên DB
              if (cart.length > 0) {
                 fetch('/api/cart', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(cart) // Gửi mảng các item local
                 }).then(() => {
                    // Lấy lại danh sách hoàn chỉnh sau khi gộp
                    fetch('/api/cart').then(res => res.json()).then(finalCart => {
                       syncCartWithDB(finalCart);
                    });
                 });
              } else {
                 syncCartWithDB(dbCart); // Nếu local trống, đổ nguyên giỏ DB vào
              }
           }
        })
        .catch(err => console.error('Lỗi lấy giỏ hàng từ DB:', err));
    } else if (status === 'unauthenticated') {
      setLoggedIn(false);
      hasSynced.current = false;
    }
  }, [status, setLoggedIn, syncCartWithDB]); 
  // Không đưa cart vào dependency để tránh re-render liên tục

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartSync />
      {children}
    </SessionProvider>
  );
}
