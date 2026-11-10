import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Star, Minus, Plus, ChevronDown, Truck, Ruler, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";
import { MSButton } from "@/components/ms/Button";
import { ProductCard } from "@/components/ms/ProductCard";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
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
  const [color, setColor] = useState(Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0].name : "Standard");
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);
  const soldOut = product.stock === 0 || product.badge === "SOLD OUT";

  // Reviews state & handler
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const token = useAuth((s) => s.token);

  useEffect(() => {
    if (product.id) {
      fetch(`${import.meta.env.VITE_API_URL}/reviews?productId=${product.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setReviewsList(data);
        })
        .catch(() => {});
    }
  }, [product.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please log in to submit a review");
      return;
    }
    try {
      toast.loading("Submitting review...", { id: "rev" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle,
          body: reviewBody,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Review submitted! Thank you.", { id: "rev" });
      setShowReviewForm(false);
      setReviewTitle("");
      setReviewBody("");
      const updated = await (await fetch(`${import.meta.env.VITE_API_URL}/reviews?productId=${product.id}`)).json();
      if (Array.isArray(updated)) setReviewsList(updated);
    } catch (err: any) {
      toast.error(err.message, { id: "rev" });
    }
  };

  const onAdd = (buyNow = false) => {
    if (soldOut) return;
    const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
    if (hasSizes && !size) {
      toast.error("Pick a size");
      return;
    }
    const chosenSize = size || (hasSizes ? product.sizes[0] : "ONESIZE");
    const chosenColor = color || (Array.isArray(product.colors) && product.colors.length > 0 ? product.colors[0].name : "Standard");
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0] || "",
      price: product.price,
      size: chosenSize,
      color: chosenColor,
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

          {/* Size (Optional) */}
          {Array.isArray(product.sizes) && product.sizes.length > 0 && (
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
                {product.sizes.map((s: string) => {
                  const sizeQty: number = product.size_stock?.[s] ?? 1;
                  const isOutOfStock = sizeQty === 0;
                  return (
                    <button
                      key={s}
                      onClick={() => !isOutOfStock && setSize(s)}
                      disabled={isOutOfStock}
                      title={isOutOfStock ? `${s} — Sold Out` : `${s} — ${sizeQty} left`}
                      className={cn(
                        "relative h-11 min-w-11 px-3 rounded-sm border text-sm font-medium transition group",
                        isOutOfStock
                          ? "border-dark-gray text-mid-gray opacity-40 cursor-not-allowed line-through"
                          : size === s
                          ? "bg-lime text-black border-lime"
                          : "border-dark-gray text-light-gray hover:border-white hover:text-white",
                      )}
                    >
                      {s}
                      {!isOutOfStock && sizeQty <= 5 && (
                        <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-danger text-white rounded-full h-3.5 w-3.5 flex items-center justify-center">
                          {sizeQty}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color (Optional) */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
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
          )}

          {/* Dynamic Attributes / Specs */}
          {product.attributes_data && Object.keys(product.attributes_data).length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs border-y border-dark-gray/40 py-4">
              {Object.entries(product.attributes_data).map(([key, val]: [string, any]) => (
                <div key={key} className="flex justify-between py-1 border-b border-dark-gray/20">
                  <span className="text-light-gray uppercase font-display tracking-wider">{key}:</span>
                  <span className="text-white font-medium capitalize">{String(val)}</span>
                </div>
              ))}
            </div>
          )}

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

      {/* Customer Reviews Section */}
      <section className="mt-20 pt-12 border-t border-dark-gray/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl lg:text-4xl tracking-tight text-white">
              CUSTOMER REVIEWS
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex text-lime">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("h-4 w-4", i < Math.round(product.rating || 5) ? "fill-current" : "")} />
                ))}
              </div>
              <span className="text-sm font-semibold text-white">{product.rating || 5}.0</span>
              <span className="text-xs text-light-gray">({reviewsList.length || product.reviews || 0} reviews)</span>
            </div>
          </div>
          <MSButton variant="outline" size="sm" onClick={() => setShowReviewForm(!showReviewForm)}>
            {showReviewForm ? "Cancel" : "Write a Review"}
          </MSButton>
        </div>

        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mb-10 bg-off-black border border-dark-gray rounded-md p-6 max-w-xl space-y-4">
            <h3 className="font-display text-lg text-white">SHARE YOUR EXPERIENCE</h3>
            <div>
              <label className="text-xs uppercase text-light-gray block mb-1">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setReviewRating(r)}
                    className={cn("p-1", r <= reviewRating ? "text-lime" : "text-mid-gray")}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase text-light-gray block mb-1">Review Title</label>
              <input
                type="text"
                required
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Heavyweight quality, crazy fit!"
                className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-lime"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-light-gray block mb-1">Review Body</label>
              <textarea
                required
                rows={3}
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="How was the GSM, sizing, and comfort on street?"
                className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-lime"
              />
            </div>
            <MSButton type="submit" size="sm">Submit Review</MSButton>
          </form>
        )}

        {reviewsList.length === 0 ? (
          <p className="text-xs text-mid-gray py-4">No reviews yet. Be the first to review this drop!</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviewsList.map((rev) => (
              <div key={rev.id} className="bg-off-black border border-dark-gray/60 rounded-md p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex text-lime">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5", i < rev.rating ? "fill-current" : "text-dark-gray")} />
                    ))}
                  </div>
                  {rev.is_verified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-lime/10 text-lime border border-lime/30">
                      VERIFIED BUYER
                    </span>
                  )}
                </div>
                <p className="font-semibold text-white text-sm">{rev.title || "Customer Review"}</p>
                <p className="text-xs text-light-gray leading-relaxed">{rev.body}</p>
                <p className="text-[10px] text-mid-gray pt-2 border-t border-dark-gray/30">
                  {rev.users?.name || "Customer"} · {new Date(rev.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

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
