import { create } from "zustand";

type UIState = {
  cartOpen: boolean;
  navOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setNav: (v: boolean) => void;
};

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  navOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
  setNav: (navOpen) => set({ navOpen }),
}));
