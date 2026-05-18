import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User, Heart, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useUI } from "@/store/ui";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/shop", label: "Shop" },
  { to: "/custom", label: "Custom" },
  { to: "/track-order", label: "Track" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const totalItems = useCart((s) => s.totalItems());
  const openCart = useUI((s) => s.openCart);
  const openWishlist = useUI((s) => s.openWishlist);
  const wishlistItems = useWishlist((s) => s.items.length);
  const user = useAuth((s) => s.user);
  const location = useLocation();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-dark-gray"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 font-display text-2xl tracking-[0.2em] text-white hover:text-lime transition"
        >
          <img src="/logo.png" alt="ManSeek Logo" className="h-8" />
          MANSEEK
        </Link>

        <nav className="hidden md:flex items-center gap-10 font-display tracking-widest text-sm">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-light-gray hover:text-lime transition-colors"
              activeProps={{ className: "text-lime" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            aria-label="Search"
            className="hidden md:grid h-10 w-10 place-items-center text-white hover:text-lime transition"
          >
            <Search className="h-5 w-5" />
          </button>
          {user ? (
            <>
              <button
                aria-label="Wishlist"
                onClick={openWishlist}
                className="relative hidden md:grid h-10 w-10 place-items-center text-white hover:text-lime transition"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems > 0 && (
                  <span className="absolute top-1 right-0 min-w-4 h-4 px-1 grid place-items-center rounded-full bg-lime text-black text-[9px] font-bold">
                    {wishlistItems}
                  </span>
                )}
              </button>
              <button
                aria-label="Account"
                onClick={() => router.navigate({ to: "/account" })}
                className="grid h-10 w-10 place-items-center text-white hover:text-lime transition"
              >
                <User className="h-5 w-5" />
              </button>
              <button
                aria-label="Cart"
                onClick={openCart}
                className="relative grid h-10 w-10 place-items-center text-white hover:text-lime transition"
              >
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-0 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-lime text-black text-[10px] font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </>
          ) : (
            <Link to="/login">
              <button className="px-5 py-2 rounded-pill bg-lime text-black font-display tracking-widest text-xs hover:bg-lime/80 transition ml-2">
                LOGIN
              </button>
            </Link>
          )}
          <button
            aria-label="Menu"
            onClick={() => setMobileOpen(true)}
            className="md:hidden grid h-10 w-10 place-items-center text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between border-b border-dark-gray">
            <span className="flex items-center gap-3 font-display text-2xl tracking-[0.2em]">
              <img src="/logo.png" alt="ManSeek Logo" className="h-8" />
              MANSEEK
            </span>
            <button onClick={() => setMobileOpen(false)} className="text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 flex flex-col items-center justify-center gap-8 font-display text-4xl tracking-widest">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="hover:text-lime"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to={user ? "/account" : "/login"}
              className="hover:text-lime"
              onClick={() => setMobileOpen(false)}
            >
              {user ? "Account" : "Login"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
