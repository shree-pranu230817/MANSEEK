import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCart } from "./cart";

export type Address = {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "admin";
  addresses?: Address[];
};

type AuthState = {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthed: () => boolean;
  isAdmin: () => boolean;
};

const getInitialAuth = () => {
  try {
    const val = localStorage.getItem("manseek-auth");
    if (val) {
      const parsed = JSON.parse(val);
      return {
        user: parsed.state?.user || null,
        token: parsed.state?.token || null,
      };
    }
  } catch (e) {
    console.error("Error reading initial auth state:", e);
  }
  return { user: null, token: null };
};

const initialAuth = getInitialAuth();

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: initialAuth.user,
      token: initialAuth.token,
      login: (user, token) => {
        localStorage.setItem("manseek-token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("manseek-token");
        useCart.getState().clearCart();
        set({ user: null, token: null });
      },
      isAuthed: () => !!get().token,
      isAdmin: () => get().user?.role === "admin",
    }),
    { name: "manseek-auth" },
  ),
);
