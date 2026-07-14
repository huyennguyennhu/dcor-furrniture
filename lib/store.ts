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

export type AddCartItemInput = Omit<CartItem, 'id' | 'quantity'> & { quantity?: number, dbId?: string };

interface DCorState {
  cart: CartItem[];
  wishlist: string[];
  theme: 'dark' | 'light';
  isLoggedIn: boolean;
  isLoginModalOpen: boolean;
  
  // Actions
  setLoggedIn: (status: boolean) => void;
  setLoginModalOpen: (isOpen: boolean) => void;
  syncCartWithDB: (dbItems: any[]) => void;
  addToCart: (item: AddCartItemInput) => Promise<void>;
  updateQuantity: (index: number, quantity: number) => Promise<void>;
  updateCartItem: (index: number, input: AddCartItemInput) => Promise<void>;
  removeFromCart: (index: number) => Promise<void>;
  removeMultipleFromCart: (indices: number[]) => Promise<void>;
  clearCart: () => Promise<void>;
  
  toggleWishlist: (productId: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

// Hàm hỗ trợ đồng bộ API (âm thầm gọi ngầm)
const apiCall = async (method: string, url: string, data?: any) => {
  try {
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch (err) {
    console.error('API Error:', err);
  }
};

export const useStore = create<DCorState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      theme: 'dark',
      isLoggedIn: false,
      isLoginModalOpen: false,
      
      setLoggedIn: (status) => set({ isLoggedIn: status }),
      setLoginModalOpen: (isOpen) => set({ isLoginModalOpen: isOpen }),
      
      // Đồng bộ dữ liệu DB về Local state
      syncCartWithDB: (dbItems) => {
        // Map DB items to Local CartItems
        const mappedCart: CartItem[] = dbItems.map((item: any) => ({
          id: item.id, // dùng id thật của DB
          productId: item.productId,
          name: item.name,
          image: item.image || '',
          price: Number(item.price),
          quantity: item.quantity,
          variantTags: item.variantTags,
          leg: item.legId ? { id: item.legId } as any : undefined,
          upholstery: item.upholsteryId ? { id: item.upholsteryId } as any : undefined,
        }));
        set({ cart: mappedCart });
      },

      addToCart: async (input) => {
        const variantKey = input.variantTags && input.variantTags.length > 0 
          ? input.variantTags.map(t => `${t.label}:${t.value}`).join('|') 
          : 'default';
        const legId = input.leg?.id || 'noleg';
        const uphId = input.upholstery?.id || 'nouph';
        const tempId = `${input.productId}-${legId}-${uphId}-${variantKey}`;
        const qtyToAdd = input.quantity || 1;

        // Optimistic UI update
        const state = get();
        const existingIndex = state.cart.findIndex(item => 
          item.id === tempId || (item.productId === input.productId && item.variantTags === input.variantTags)
        );

        if (existingIndex >= 0) {
          const newCart = [...state.cart];
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newCart[existingIndex].quantity + qtyToAdd
          };
          set({ cart: newCart });
        } else {
          set({ cart: [...state.cart, { ...input, id: tempId, quantity: qtyToAdd }] });
        }

        // Call API
        if (state.isLoggedIn) {
          await apiCall('POST', '/api/cart', {
            productId: input.productId,
            name: input.name,
            image: input.image,
            price: input.price,
            quantity: qtyToAdd,
            variantKey,
            variantTags: input.variantTags,
            legId: input.leg?.id,
            upholsteryId: input.upholstery?.id
          });
        }
      },
        
      updateQuantity: async (index, quantity) => {
        const state = get();
        if (quantity < 1) return;
        const newCart = [...state.cart];
        const item = newCart[index];
        item.quantity = quantity;
        set({ cart: newCart });
        
        if (state.isLoggedIn && item.id) {
           await apiCall('PUT', '/api/cart', { id: item.id, quantity });
        }
      },

      updateCartItem: async (index, input) => {
        const state = get();
        const variantKey = input.variantTags && input.variantTags.length > 0 
          ? input.variantTags.map(t => `${t.label}:${t.value}`).join('|') 
          : 'default';
        const legId = input.leg?.id || 'noleg';
        const uphId = input.upholstery?.id || 'nouph';
        const newTempId = `${input.productId}-${legId}-${uphId}-${variantKey}`;
        const qtyToSet = input.quantity || state.cart[index]?.quantity || 1;
        const oldItem = state.cart[index];

        const existingIndex = state.cart.findIndex(item => item.id === newTempId && item.id !== oldItem.id);
        
        if (existingIndex >= 0) {
          const newCart = [...state.cart];
          newCart[existingIndex].quantity += qtyToSet;
          newCart.splice(index, 1);
          set({ cart: newCart });
        } else {
          const newCart = [...state.cart];
          newCart[index] = { ...input, id: oldItem.id || newTempId, quantity: qtyToSet };
          set({ cart: newCart });
        }

        if (state.isLoggedIn && oldItem.id) {
          await apiCall('PUT', '/api/cart', {
             id: oldItem.id, quantity: qtyToSet, variantKey, variantTags: input.variantTags, legId, upholsteryId: uphId, price: input.price, image: input.image
          });
        }
      },
        
      removeFromCart: async (index) => {
        const state = get();
        const item = state.cart[index];
        set({ cart: state.cart.filter((_, idx) => idx !== index) });
        
        if (state.isLoggedIn && item.id) {
          await apiCall('DELETE', `/api/cart?id=${item.id}`);
        }
      },

      removeMultipleFromCart: async (indices) => {
        const state = get();
        const itemsToRemove = state.cart.filter((_, idx) => indices.includes(idx));
        set({ cart: state.cart.filter((_, idx) => !indices.includes(idx)) });
        
        if (state.isLoggedIn) {
          for (const item of itemsToRemove) {
            if (item.id) await apiCall('DELETE', `/api/cart?id=${item.id}`);
          }
        }
      },
        
      clearCart: async () => {
        const state = get();
        set({ cart: [] });
        if (state.isLoggedIn) {
          await apiCall('DELETE', '/api/cart');
        }
      },
      
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
        if (typeof window !== 'undefined') {
          // Xử lý logic 10 phút (Khách vãng lai)
          const closedAtStr = localStorage.getItem('dcor-cart-closedAt');
          if (closedAtStr) {
            const closedAt = parseInt(closedAtStr, 10);
            const now = Date.now();
            if (now - closedAt > 10 * 60 * 1000) {
              // Quá 10 phút -> Xóa giỏ hàng
              state?.clearCart();
            }
            // Dọn dẹp cờ
            localStorage.removeItem('dcor-cart-closedAt');
          }
          
          if (state) {
            document.documentElement.setAttribute('data-theme', state.theme);
          }
        }
      },
    }
  )
);

// Gắn sự kiện beforeunload để ghi nhận thời điểm tắt tab
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('dcor-cart-closedAt', Date.now().toString());
  });
}
