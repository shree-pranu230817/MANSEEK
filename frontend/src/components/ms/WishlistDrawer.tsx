import { AnimatePresence, motion } from "framer-motion";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useWishlist } from "@/store/wishlist";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { formatINR } from "@/lib/format";
import { MSButton } from "./Button";
import { toast } from "sonner";

export function WishlistDrawer() {
  const open = useUI((s) => s.wishlistOpen);
  const close = useUI((s) => s.closeWishlist);
  const items = useWishlist((s) => s.items);
  const remove = useWishlist((s) => s.removeItem);
  const addToCart = useCart((s) => s.addItem);
  const openCart = useUI((s) => s.openCart);

  const handleMoveToCart = (item: any) => {
    addToCart({
      productId: item.productId,
      slug: item.slug,
      name: item.name,
      image: item.image,
      price: item.price,
      size: "M", // Default to M
      color: "Black", // Default to Black
      quantity: 1,
    });
    remove(item.productId);
    toast.success(`Moved ${item.name} to your bag!`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 z-50 h-dvh w-full sm:w-[440px] bg-off-black border-l border-dark-gray flex flex-col text-white"
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-dark-gray">
              <p className="font-display text-xl tracking-widest">WISHLIST ({items.length})</p>
              <button onClick={close} aria-label="Close" className="text-white hover:text-lime">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 grid place-items-center text-center px-8">
                <div>
                  <p className="font-display text-3xl">YOUR WISHLIST IS EMPTY</p>
                  <p className="text-light-gray mt-2 text-sm">
                    Save items you want to keep an eye on.
                  </p>
                  <MSButton onClick={close} className="mt-6">
                    Discover Drops
                  </MSButton>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 pb-4 border-b border-dark-gray"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-20 object-cover rounded-sm bg-charcoal"
                    />
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <p className="font-display text-lg leading-tight truncate">
                          {item.name}
                        </p>
                        <p className="font-display text-lime mt-1">
                          {formatINR(item.price)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <MSButton
                          size="sm"
                          onClick={() => handleMoveToCart(item)}
                          className="flex items-center gap-1.5 h-8 text-[11px] font-display tracking-wider"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Move to Bag
                        </MSButton>
                        <button
                          onClick={() => remove(item.productId)}
                          className="h-8 w-8 rounded-sm border border-dark-gray hover:border-danger hover:text-danger grid place-items-center transition"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
