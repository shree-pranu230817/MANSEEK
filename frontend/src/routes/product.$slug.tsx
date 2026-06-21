import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Minus, Plus, ChevronDown, Truck, Ruler, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { MSButton } from "@/components/ms/Button";
import { ProductCard } from "@/components/ms/ProductCard";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/products/${params.slug}`);
    if (!res.ok) throw notFound();
    const data = await res.json();
    
    const prod = {
      ...data,
      price: data.sale_price || data.base_price,
      oldPrice: data.sale_price ? data.base_price : null,
      rating: data.average_rating || 5,
      reviews: data.review_count || 0,
      category: data.categories?.slug || data.category_id,
    };

    const relatedRes = await fetch(`${import.meta.env.VITE_API_URL}/products?category=${prod.category}&limit=5`);
    const relatedData = relatedRes.ok ? await relatedRes.json() : { products: [] };
    const related = relatedData.products
      .filter((p: any) => p.id !== prod.id)
      .slice(0, 4)
      .map((p: any) => ({
        ...p,
        price: p.sale_price || p.base_price,
        oldPrice: p.sale_price ? p.base_price : null,
        rating: p.average_rating || 5,
        reviews: p.review_count || 0,
        category: p.categories?.slug || p.category_id,
      }));

    return { product: prod, related };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — ManSeek` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — ManSeek` },
          { property: "og:description", content: loaderData.product.description },
          { property: "og:image", content: loaderData.product.images[0] },
        ]
      : [],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { product, related } = Route.useLoaderData();
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(product.colors[0].name);
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);
  const soldOut = product.stock === 0 || product.badge === "SOLD OUT";

  const onAdd = (buyNow = false) => {
    if (soldOut) return;
    if (!size) {
      toast.error("Pick a size");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: product.price,
      size,
      color,
      quantity: qty,
    });
    if (buyNow) {
      router.navigate({ to: "/checkout" });
    } else {
      toast.success("Added to cart");
      openCart();
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 lg:px-8 py-10">
      <nav className="text-xs text-light-gray tracking-widest mb-6">
        <Link to="/" className="hover:text-lime">HOME</Link> /{" "}
        <Link to="/shop" className="hover:text-lime">SHOP</Link> /{" "}
        <span className="text-white">{product.name.toUpperCase()}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Gallery */}
        <div>
          <motion.div
            key={activeImg}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="aspect-[3/4] bg-charcoal rounded-md overflow-hidden"
          >
            <img
              src={product.images[activeImg]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {product.images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={cn(
                  "aspect-square bg-charcoal rounded-sm overflow-hidden transition",
                  activeImg === i ? "ring-2 ring-lime" : "opacity-60 hover:opacity-100",
                )}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs text-light-gray uppercase tracking-[0.3em]">ManSeek</p>
          <h1 className="mt-2 font-display text-5xl lg:text-6xl tracking-tight leading-none">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex text-lime">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.round(product.rating) ? "fill-current" : "",
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-light-gray">
              {product.rating} ({product.reviews})
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-4xl text-lime">
              {formatINR(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-mid-gray line-through">
                {formatINR(product.oldPrice)}
              </span>
            )}
            {product.oldPrice && (
              <span className="text-success text-sm font-medium">
                {Math.round((1 - product.price / product.oldPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Size */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display tracking-widest text-sm">SIZE</p>
              <button
                onClick={() => setShowSizeGuide(true)}
                className="text-xs text-light-gray hover:text-lime inline-flex items-center gap-1 transition-colors"
              >
                <Ruler className="h-3 w-3" /> Size guide
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s: string) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "h-11 min-w-11 px-3 rounded-sm border text-sm font-medium transition",
                    size === s
                      ? "bg-lime text-black border-lime"
                      : "border-dark-gray text-light-gray hover:border-white hover:text-white",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mt-6">
            <p className="font-display tracking-widest text-sm mb-3">
              COLOR · <span className="text-light-gray font-sans normal-case">{color}</span>
            </p>
            <div className="flex gap-2">
              {product.colors.map((c: { name: string; hex: string }) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={cn(
                    "h-10 w-10 rounded-full border-2 transition",
                    color === c.name ? "border-lime" : "border-dark-gray hover:border-white",
                  )}
                  style={{ background: c.hex }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          {/* Qty */}
          <div className="mt-6 flex items-center gap-4">
            <p className="font-display tracking-widest text-sm">QTY</p>
            <div className="flex items-center border border-dark-gray rounded-sm">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-11 w-11 grid place-items-center hover:text-lime">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="h-11 w-11 grid place-items-center hover:text-lime">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 grid gap-3">
            <MSButton size="lg" onClick={() => onAdd(false)} disabled={soldOut}>
              {soldOut ? "Sold Out" : "Add to Cart"}
            </MSButton>
            <MSButton variant="outline" size="lg" onClick={() => onAdd(true)} disabled={soldOut}>
              Buy Now
            </MSButton>
          </div>

          {/* Accordions */}
          <div className="mt-10 space-y-1 border-t border-dark-gray">
            {[
              { t: "Description", c: product.description, icon: null },
              {
                t: "Shipping",
                c: "Free shipping on orders above ₹999. Standard delivery 3–6 days. Express 1–2 days.",
                icon: <Truck className="h-4 w-4" />,
              },
            ].map((a) => (
              <Accordion key={a.t} title={a.t} icon={a.icon}>
                {a.c}
              </Accordion>
            ))}
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal open={showSizeGuide} onClose={() => setShowSizeGuide(false)} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-4xl lg:text-5xl tracking-tight mb-8">
            YOU MIGHT ALSO LIKE
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((p:any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Accordion({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-dark-gray">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-display tracking-widest text-sm flex items-center gap-2">
          {icon} {title}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="pb-4 text-sm text-light-gray leading-relaxed">{children}</div>}
    </div>
  );
}

function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"chart" | "measure">("chart");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-off-black border border-dark-gray rounded-md overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-dark-gray">
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] text-lime uppercase">ManSeek</p>
                <h2 className="font-display text-xl tracking-tight text-white mt-0.5">SIZE GUIDE</h2>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 grid place-items-center rounded-sm border border-dark-gray text-light-gray hover:text-white hover:border-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-dark-gray">
              {(["chart", "measure"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors",
                    tab === t
                      ? "text-lime border-b-2 border-lime bg-lime/5"
                      : "text-mid-gray hover:text-light-gray",
                  )}
                >
                  {t === "chart" ? "📐 Size Chart" : "📏 How to Measure"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[70vh]">
              <AnimatePresence mode="wait">
                {tab === "chart" ? (
                  <motion.div
                    key="chart"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18 }}
                    className="p-4"
                  >
                    <p className="text-[10px] text-mid-gray uppercase tracking-widest mb-3">All measurements in inches</p>
                    <img
                      src="/size chart.png"
                      alt="ManSeek Size Chart — Chest, Length, Shoulder measurements for XXS to XXXL"
                      className="w-full rounded-sm border border-dark-gray/50"
                      draggable={false}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="measure"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                    className="p-4"
                  >
                    <p className="text-[10px] text-mid-gray uppercase tracking-widest mb-3">How to take your measurements</p>
                    <img
                      src="/Measurement.png"
                      alt="How to measure — Shoulder, Chest, and Length diagram"
                      className="w-full rounded-sm border border-dark-gray/50"
                      draggable={false}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer note */}
            <div className="px-6 py-4 border-t border-dark-gray bg-charcoal/30">
              <p className="text-[11px] text-mid-gray leading-relaxed">
                <span className="text-lime font-bold">!</span>  Measurements in the size chart are based on <span className="text-white">body measurements</span>, not the garment. If you're between sizes, we recommend sizing up.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
