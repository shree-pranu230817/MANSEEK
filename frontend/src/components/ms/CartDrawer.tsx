import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { formatINR } from "@/lib/format";
import { MSButton } from "./Button";

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const close = useUI((s) => s.closeCart);
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const update = useCart((s) => s.updateQuantity);
  const remove = useCart((s) => s.removeItem);

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
            className="fixed top-0 right-0 z-50 h-dvh w-full sm:w-[440px] bg-off-black border-l border-dark-gray flex flex-col"
          >
            <div className="h-16 px-5 flex items-center justify-between border-b border-dark-gray">
              <p className="font-display text-xl tracking-widest">YOUR BAG ({items.length})</p>
              <button onClick={close} aria-label="Close" className="text-white hover:text-lime">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 grid place-items-center text-center px-8">
                <div>
                  <p className="font-display text-3xl">YOUR BAG IS EMPTY</p>
                  <p className="text-light-gray mt-2 text-sm">
                    Start building your wardrobe.
                  </p>
                  <MSButton onClick={close} className="mt-6">
                    Shop Now
                  </MSButton>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId + item.size}
                    className="flex gap-4 pb-4 border-b border-dark-gray"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-20 object-cover rounded-sm bg-charcoal"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg leading-tight truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-light-gray uppercase tracking-widest mt-1">
                        Size {item.size} · {item.color}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-dark-gray rounded-sm">
                          <button
                            onClick={() =>
                              update(item.productId, item.size, item.quantity - 1)
                            }
                            className="h-8 w-8 grid place-items-center hover:text-lime"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() =>
                              update(item.productId, item.size, item.quantity + 1)
                            }
                            className="h-8 w-8 grid place-items-center hover:text-lime"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="font-display text-lg text-lime">
                          {formatINR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(item.productId, item.size)}
                      className="text-mid-gray hover:text-danger h-6"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="border-t border-dark-gray p-5 space-y-3">
                <input
                  placeholder="Promo code"
                  className="w-full h-11 px-4 bg-charcoal border border-dark-gray rounded-sm text-sm focus:border-lime focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-light-gray text-sm uppercase tracking-widest">
                    Subtotal
                  </span>
                  <span className="font-display text-2xl text-lime">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-mid-gray">
                  Shipping & taxes calculated at checkout.
                </p>
                <Link to="/checkout" onClick={close} className="block">
                  <MSButton className="w-full" size="lg">
                    Checkout
                  </MSButton>
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
