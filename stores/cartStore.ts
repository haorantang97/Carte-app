import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = {
  dishId: string;
  dishName: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
};

type CartState = {
  cartByGroup: Record<string, CartItem[]>;
  add: (groupId: string, item: CartItem) => void;
  setQuantity: (groupId: string, dishId: string, quantity: number) => void;
  remove: (groupId: string, dishId: string) => void;
  clearGroup: (groupId: string) => void;
  clearAll: () => void;
  getItems: (groupId: string) => CartItem[];
  getCount: (groupId: string) => number;
  getTotal: (groupId: string) => number;
};

/**
 * 修复:原版购物车是全局 Context,跨菜单污染。
 * 这里按 menu_group_id 隔离 — 切换菜单时彼此独立,结账后只清空该组。
 */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartByGroup: {},
      add: (groupId, item) =>
        set((s) => {
          const list = s.cartByGroup[groupId] ?? [];
          const idx = list.findIndex((i) => i.dishId === item.dishId);
          const next =
            idx >= 0
              ? list.map((i, k) =>
                  k === idx ? { ...i, quantity: i.quantity + item.quantity } : i,
                )
              : [...list, item];
          return { cartByGroup: { ...s.cartByGroup, [groupId]: next } };
        }),
      setQuantity: (groupId, dishId, quantity) =>
        set((s) => {
          const list = s.cartByGroup[groupId] ?? [];
          const next =
            quantity <= 0
              ? list.filter((i) => i.dishId !== dishId)
              : list.map((i) => (i.dishId === dishId ? { ...i, quantity } : i));
          return { cartByGroup: { ...s.cartByGroup, [groupId]: next } };
        }),
      remove: (groupId, dishId) =>
        set((s) => ({
          cartByGroup: {
            ...s.cartByGroup,
            [groupId]: (s.cartByGroup[groupId] ?? []).filter((i) => i.dishId !== dishId),
          },
        })),
      clearGroup: (groupId) =>
        set((s) => {
          const next = { ...s.cartByGroup };
          delete next[groupId];
          return { cartByGroup: next };
        }),
      clearAll: () => set({ cartByGroup: {} }),
      getItems: (groupId) => get().cartByGroup[groupId] ?? [],
      getCount: (groupId) =>
        (get().cartByGroup[groupId] ?? []).reduce((n, i) => n + i.quantity, 0),
      getTotal: (groupId) =>
        (get().cartByGroup[groupId] ?? []).reduce((n, i) => n + i.quantity * i.price, 0),
    }),
    {
      name: 'CARTE_CART_STORAGE',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
