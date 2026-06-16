'use client';

import React, { useState, Suspense } from 'react';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/shop/CartDrawer';
import Modals from '@/components/layout/Modals';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <html lang="vi" data-theme="light" suppressHydrationWarning>
      <body>
        <Header onOpenCart={() => setCartOpen(true)} />

        {children}

        <Footer />

        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

        <Suspense fallback={null}>
          <Modals />
        </Suspense>
      </body>
    </html>
  );
}
