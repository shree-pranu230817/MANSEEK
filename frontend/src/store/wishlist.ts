import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  categoryLabel?: string;
};

type WishlistState = {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  hasItem: (productId: string) => boolean;
  clearWishlist: () => void;
};

// Background sync helper with backend
const syncBackendWishlist = async (action: "add" | "remove", productId: string) => {
  try {
    const raw = localStorage.getItem("manseek-auth");
    if (!raw) return;
    const authData = JSON.parse(raw);
    const token = authData?.state?.token;
    if (!token) return;

    const url = action === "add"
      ? `${import.meta.env.VITE_API_URL}/wishlist`
      : `${import.meta.env.VITE_API_URL}/wishlist/${productId}`;

    await fetch(url, {
      method: action === "add" ? "POST" : "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: action === "add" ? JSON.stringify({ productId }) : undefined
    });
  } catch (_) {
    // Non-blocking fallback
  }
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        syncBackendWishlist("add", item.productId);
        set((state) => {
          if (state.items.some((i) => i.productId === item.productId)) return state;
          return { items: [...state.items, item] };
        });
      },
      removeItem: (productId) => {
        syncBackendWishlist("remove", productId);
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },
      toggleItem: (item) => {
        const exists = get().items.some((i) => i.productId === item.productId);
        if (exists) {
          syncBackendWishlist("remove", item.productId);
          set((state) => ({ items: state.items.filter((i) => i.productId !== item.productId) }));
        } else {
          syncBackendWishlist("add", item.productId);
          set((state) => ({ items: [...state.items, item] }));
        }
      },
      hasItem: (productId) => get().items.some((i) => i.productId === productId),
      clearWishlist: () => set({ items: [] }),
    }),
    { name: "manseek-wishlist" },
  ),
);
