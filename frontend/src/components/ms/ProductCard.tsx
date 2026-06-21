import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/mock-data";
import { formatINR } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const [hover, setHover] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const addItem = useCart((s) => s.addItem);
  const toggleWishlist = useWishlist((s) => s.toggleItem);
  const isWishlisted = useWishlist((s) => s.hasItem(product.id));
  const soldOut = product.stock === 0 || product.badge === "SOLD OUT";

  // Dynamic badge from tags, sale price, or stock status
  const badge = soldOut
    ? "SOLD OUT"
    : product.tags?.includes("New Drop") || product.tags?.includes("NEW")
      ? "NEW"
      : product.badge
        ? product.badge
        : (product.oldPrice && product.oldPrice > product.price) || product.sale_price
          ? "SALE"
          : product.tags?.includes("Limited Edition")
            ? "LIMITED"
            : product.tags?.includes("Best Seller")
              ? "BEST SELLER"
              : null;

  const quickAdd = () => {
    const s = size || product.sizes[Math.floor(product.sizes.length / 2)];
    if (!s) {
      toast.error("No sizes available");
      return;
    }
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: product.price,
      size: s,
      color: product.colors[0].name,
      quantity: 1,
    });
    toast.success(`Added ${product.name} (${s}) to cart`);
  };

  return (
    <motion.div
      className="group relative flex flex-col"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ y: -4 }}
    >
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-[3/4] overflow-hidden bg-charcoal rounded-md"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
            hover && product.images[1] ? "opacity-0" : "opacity-100",
          )}
        />
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
              hover ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        <div className="absolute inset-0 bg-gradient-card pointer-events-none" />

        {badge && (
          <span
            className={cn(
              "absolute top-3 left-3 px-2.5 py-1 font-display text-[10px] sm:text-xs tracking-widest rounded-sm font-bold uppercase",
              badge === "NEW" && "bg-lime text-black",
              badge === "SALE" && "bg-white text-black",
              badge === "SOLD OUT" && "bg-danger text-white",
              badge === "LIMITED" && "bg-orange-500 text-white",
              badge === "BEST SELLER" && "bg-amber-400 text-black",
            )}
          >
            {badge}
          </span>
        )}

        <button
          aria-label="Wishlist"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: product.images[0],
              price: product.price,
              categoryLabel: product.categoryLabel,
            });
            if (isWishlisted) {
              toast.success(`Removed ${product.name} from wishlist`);
            } else {
              toast.success(`Added ${product.name} to wishlist!`);
            }
          }}
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-black/40 backdrop-blur text-white hover:text-lime transition"
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-lime text-lime")} />
        </button>

        {!soldOut && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={hover ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="absolute inset-x-3 bottom-3 flex flex-col gap-2"
            onClick={(e) => e.preventDefault()}
          >
            <div className="flex gap-1.5 flex-wrap">
              {product.sizes.slice(0, 5).map((sz) => (
                <button
                  key={sz}
                  onClick={(e) => {
                    e.preventDefault();
                    setSize(sz);
                  }}
                  className={cn(
                    "h-7 min-w-7 px-2 text-xs font-medium rounded-sm transition",
                    size === sz
                      ? "bg-lime text-black"
                      : "bg-black/60 text-white hover:bg-white hover:text-black",
                  )}
                >
                  {sz}
                </button>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                quickAdd();
              }}
              className="flex items-center justify-center gap-1.5 h-10 bg-lime text-black font-display tracking-wider text-sm rounded-sm hover:bg-lime-dark"
            >
              <Plus className="h-4 w-4" /> Quick Add
            </button>
          </motion.div>
        )}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-light-gray uppercase tracking-widest">
            {product.categoryLabel}
          </p>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="font-display text-xl text-white hover:text-lime transition"
          >
            {product.name}
          </Link>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="font-display text-xl text-lime leading-tight">{formatINR(product.price)}</p>
          {product.oldPrice && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-mid-gray line-through leading-none">
                {formatINR(product.oldPrice)}
              </span>
              <span className="text-[10px] font-bold text-lime bg-lime/10 px-1 py-0.5 rounded leading-none">
                {Math.round((1 - product.price / product.oldPrice) * 100)}% OFF
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
