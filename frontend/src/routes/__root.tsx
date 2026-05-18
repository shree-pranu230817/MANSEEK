import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/ms/Header";
import { Footer } from "@/components/ms/Footer";
import { CartDrawer } from "@/components/ms/CartDrawer";
import { WishlistDrawer } from "@/components/ms/WishlistDrawer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="min-h-dvh grid place-items-center px-4 bg-black">
      <div className="text-center">
        <p className="font-display text-[12rem] leading-none text-lime">404</p>
        <h2 className="font-display text-3xl tracking-widest">LOST IN THE STREETS</h2>
        <p className="mt-2 text-light-gray text-sm max-w-sm">
          This drop never made it past the warehouse.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 px-8 items-center bg-lime text-black font-display tracking-widest rounded-pill"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh grid place-items-center px-4 bg-black">
      <div className="max-w-md text-center">
        <h1 className="font-display text-4xl tracking-widest">SOMETHING BROKE</h1>
        <p className="mt-2 text-sm text-light-gray">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 h-11 px-6 bg-lime text-black font-display tracking-widest rounded-pill"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ManSeek — Wear Your Story" },
      {
        name: "description",
        content:
          "Premium men's streetwear. Bold drops, raw urban energy, clean luxury. Built for the bold.",
      },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:title", content: "ManSeek — Wear Your Story" },
      { property: "og:description", content: "Premium men's streetwear from India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-black text-off-white">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {!isAdmin && <Header />}
      <main className={isAdmin ? "" : "pt-16"}>
        <Outlet />
      </main>
      {!isAdmin && <Footer />}
      <CartDrawer />
      <WishlistDrawer />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            color: "#f5f5f0",
          },
        }}
      />
    </QueryClientProvider>
  );
}
