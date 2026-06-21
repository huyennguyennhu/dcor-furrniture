import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LegStyle, Swatch } from './data';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  leg?: LegStyle | null;
  upholstery?: Swatch | null;
  variantTags?: { label: string; value: string }[];
  price: number;
  originalPrice?: number;
  quantity: number;
}

export type AddCartItemInput = Omit<CartItem, 'id' | 'quantity'> & { quantity?: number };

interface DCorState {
  cart: CartItem[];
  wishlist: string[];
  theme: 'dark' | 'light';
  addToCart: (item: AddCartItemInput) => void;
  updateQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  removeMultipleFromCart: (indices: number[]) => void;
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
      
      addToCart: (input) =>
        set((state) => {
          const legId = input.leg?.id || 'noleg';
          const uphId = input.upholstery?.id || 'nouph';
          const id = `${input.productId}-${legId}-${uphId}`;
          const qtyToAdd = input.quantity || 1;

          const existingIndex = state.cart.findIndex(item => item.id === id);
          if (existingIndex >= 0) {
            const newCart = [...state.cart];
            newCart[existingIndex].quantity += qtyToAdd;
            return { cart: newCart };
          }
          return { cart: [...state.cart, { ...input, id, quantity: qtyToAdd }] };
        }),
        
      updateQuantity: (index, quantity) =>
        set((state) => {
          if (quantity < 1) return state; // handled by trash can
          const newCart = [...state.cart];
          newCart[index].quantity = quantity;
          return { cart: newCart };
        }),
        
      removeFromCart: (index) =>
        set((state) => ({
          cart: state.cart.filter((_, idx) => idx !== index),
        })),

      removeMultipleFromCart: (indices) =>
        set((state) => ({
          cart: state.cart.filter((_, idx) => !indices.includes(idx)),
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
