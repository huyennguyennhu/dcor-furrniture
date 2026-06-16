import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LegStyle, Swatch } from './data';

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  leg?: LegStyle | null;
  upholstery?: Swatch | null;
  price: number;
}

interface DCorState {
  cart: CartItem[];
  wishlist: string[];
  theme: 'dark' | 'light';
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

export const useStore = create<DCorState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      theme: 'dark',
      
      addToCart: (item) =>
        set((state) => ({ cart: [...state.cart, item] })),
        
      removeFromCart: (index) =>
        set((state) => ({
          cart: state.cart.filter((_, idx) => idx !== index),
        })),
        
      clearCart: () => set({ cart: [] }),
      
      toggleWishlist: (productId) =>
        set((state) => {
          const exists = state.wishlist.includes(productId);
          return {
            wishlist: exists
              ? state.wishlist.filter((id) => id !== productId)
              : [...state.wishlist, productId],
          };
        }),
        
      setTheme: (theme) => set({ theme }),
      
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          if (typeof window !== 'undefined') {
            document.documentElement.setAttribute('data-theme', newTheme);
          }
          return { theme: newTheme };
        }),
    }),
    {
      name: 'dcor-storage',
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
