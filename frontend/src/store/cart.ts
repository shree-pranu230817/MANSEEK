import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  variantId?: string;
  sku?: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, size: string | undefined, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const itemSize = item.size || "ONESIZE";
          const idx = state.items.findIndex(
            (i) => i.productId === item.productId && (i.size || "ONESIZE") === itemSize && i.variantId === item.variantId,
          );
          if (idx >= 0) {
            const next = [...state.items];
            next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
            return { items: next };
          }
          return { items: [...state.items, { ...item, size: itemSize }] };
        }),
      removeItem: (productId, size) =>
        set((s) => ({
          items: s.items.filter((i) => !(i.productId === productId && (i.size || "ONESIZE") === (size || "ONESIZE"))),
        })),
      updateQuantity: (productId, size, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId && (i.size || "ONESIZE") === (size || "ONESIZE")
                ? { ...i, quantity: Math.max(1, qty) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((a, i) => a + i.quantity, 0),
      subtotal: () => get().items.reduce((a, i) => a + i.quantity * i.price, 0),
    }),
    { name: "manseek-cart" },
  ),
);
