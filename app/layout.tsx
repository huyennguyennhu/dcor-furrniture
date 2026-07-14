'use client';

import React, { useState, Suspense } from 'react';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/shop/CartDrawer';
import Modals from '@/components/layout/Modals';
import ScrollToTop from '@/components/layout/ScrollToTop';
import Providers from '@/components/Providers';
import LoginModal from '@/components/auth/LoginModal';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <html lang="vi" data-theme="light" suppressHydrationWarning>
      <body>
        <Providers>
          <Header onOpenCart={() => setCartOpen(true)} />

          {children}

          <Footer />

          <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

          <Suspense fallback={null}>
            <Modals />
            <LoginModal />
          </Suspense>

          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
