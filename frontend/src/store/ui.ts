import { create } from "zustand";

type UIState = {
  cartOpen: boolean;
  wishlistOpen: boolean;
  navOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openWishlist: () => void;
  closeWishlist: () => void;
  toggleWishlist: () => void;
  setNav: (v: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  wishlistOpen: false,
  navOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  openWishlist: () => set({ wishlistOpen: true }),
  closeWishlist: () => set({ wishlistOpen: false }),
  toggleWishlist: () => set((s) => ({ wishlistOpen: !s.wishlistOpen })),
  setNav: (navOpen) => set({ navOpen }),
}));
