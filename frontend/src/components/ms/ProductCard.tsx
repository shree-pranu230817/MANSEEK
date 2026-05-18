import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/mock-data";
import { formatINR } from "@/lib/format";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const [hover, setHover] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const addItem = useCart((s) => s.addItem);
  const soldOut = product.badge === "SOLD OUT";

  const quickAdd = () => {
    const s = size || product.sizes[Math.floor(product.sizes.length / 2)];
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

        {product.badge && (
          <span
            className={cn(
              "absolute top-3 left-3 px-2.5 py-1 font-display text-xs tracking-widest rounded-sm",
              product.badge === "NEW" && "bg-lime text-black",
              product.badge === "SALE" && "bg-white text-black",
              product.badge === "SOLD OUT" && "bg-danger text-white",
            )}
          >
            {product.badge}
          </span>
        )}

        <button
          aria-label="Wishlist"
          onClick={(e) => {
            e.preventDefault();
            toast("Saved to wishlist");
          }}
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-black/40 backdrop-blur text-white hover:text-lime transition"
        >
          <Heart className="h-4 w-4" />
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
        <div className="text-right">
          <p className="font-display text-xl text-lime">{formatINR(product.price)}</p>
          {product.oldPrice && (
            <p className="text-xs text-mid-gray line-through">
              {formatINR(product.oldPrice)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
