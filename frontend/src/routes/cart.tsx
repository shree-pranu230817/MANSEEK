import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";
import { MSButton } from "@/components/ms/Button";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Bag — ManSeek" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const update = useCart((s) => s.updateQuantity);
  const remove = useCart((s) => s.removeItem);
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;

  return (
    <div className="mx-auto max-w-[1200px] px-4 lg:px-8 py-12">
      <h1 className="font-display text-5xl lg:text-7xl tracking-tight mb-8">YOUR BAG</h1>
      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-light-gray">Your bag is empty.</p>
          <Link to="/shop"><MSButton className="mt-6">Shop Now</MSButton></Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-10">
          <div className="space-y-4">
            {items.map((i) => (
              <div key={i.productId + i.size} className="flex gap-4 p-4 bg-off-black border border-dark-gray rounded-md">
                <img src={i.image} alt={i.name} className="h-28 w-24 object-cover rounded-sm" />
                <div className="flex-1">
                  <p className="font-display text-2xl">{i.name}</p>
                  <p className="text-xs text-light-gray tracking-widest uppercase mt-1">Size {i.size} · {i.color}</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center border border-dark-gray rounded-sm">
                      <button onClick={() => update(i.productId, i.size, i.quantity - 1)} className="h-9 w-9 grid place-items-center hover:text-lime"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-8 text-center text-sm">{i.quantity}</span>
                      <button onClick={() => update(i.productId, i.size, i.quantity + 1)} className="h-9 w-9 grid place-items-center hover:text-lime"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => remove(i.productId, i.size)} className="text-mid-gray hover:text-danger inline-flex items-center gap-1 text-xs"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                  </div>
                </div>
                <p className="font-display text-2xl text-lime">{formatINR(i.price * i.quantity)}</p>
              </div>
            ))}
          </div>
          <aside className="bg-off-black border border-dark-gray rounded-md p-6 h-fit">
            <p className="font-display text-2xl tracking-widest mb-6">SUMMARY</p>
            <div className="space-y-3 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row label="Shipping" value={shipping === 0 ? "FREE" : formatINR(shipping)} />
              <div className="h-px bg-dark-gray my-3" />
              <Row label="Total" value={formatINR(subtotal + shipping)} big />
            </div>
            <Link to="/checkout" className="block mt-6"><MSButton className="w-full" size="lg">Checkout</MSButton></Link>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-light-gray uppercase tracking-widest text-xs">{label}</span>
      <span className={big ? "font-display text-3xl text-lime" : ""}>{value}</span>
    </div>
  );
}
