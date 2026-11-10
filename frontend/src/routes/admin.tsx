import { createFileRoute, Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  LogOut,
  Type,
  FolderTree,
  Sliders,
  Boxes,
  Ticket,
  Users,
  Settings
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — ManSeek" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const router = useRouter();
  const location = useLocation();
  const isLogin = location.pathname === "/admin/login";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLogin && user?.role !== "admin") {
      router.navigate({ to: "/admin/login" });
    }
  }, [mounted, user, isLogin, router]);

  if (!mounted) {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center font-display text-mid-gray animate-pulse">
        Initializing Admin...
      </div>
    );
  }

  if (isLogin) return <Outlet />;
  if (user?.role !== "admin") return null;

  const items = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/categories", label: "Categories", icon: FolderTree },
    { to: "/admin/attributes", label: "Attributes & Sizes", icon: Sliders },
    { to: "/admin/inventory", label: "Inventory", icon: Boxes },
    { to: "/admin/orders", label: "Orders & Returns", icon: ShoppingBag },
    { to: "/admin/coupons", label: "Coupons", icon: Ticket },
    { to: "/admin/customers", label: "Customers", icon: Users },
    { to: "/admin/settings", label: "Store Settings", icon: Settings },
    { to: "/admin/marquee", label: "Marquee Texts", icon: Type },
  ] as const;

  return (
    <div className="min-h-dvh grid grid-cols-[240px_1fr]">
      <aside className="border-r border-dark-gray bg-off-black p-5 flex flex-col justify-between">
        <div>
          <Link to="/" className="font-display text-xl tracking-[0.2em] block mb-6 text-white hover:text-lime transition-colors">
            MANSEEK
          </Link>
          <nav className="space-y-1">
            {items.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                activeOptions={{ exact: i.to === "/admin" }}
                className="flex items-center gap-3 px-3 h-9 rounded-sm text-xs font-medium text-light-gray hover:bg-charcoal hover:text-white transition-all"
                activeProps={{ className: "bg-charcoal text-lime font-bold border-l-2 border-lime" }}
              >
                <i.icon className="h-4 w-4" /> {i.label}
              </Link>
            ))}
          </nav>
        </div>

        <button
          onClick={() => {
            logout();
            router.navigate({ to: "/admin/login" });
          }}
          className="mt-6 flex items-center gap-3 px-3 h-10 rounded-sm text-xs text-light-gray hover:text-danger hover:bg-charcoal/40 transition-all w-full"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>
      <main className="p-8 bg-black overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
