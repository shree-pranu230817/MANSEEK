import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { MSButton } from "@/components/ms/Button";

export const Route = createFileRoute("/order-success/$orderId")({
  head: () => ({ meta: [{ title: "Order Confirmed — ManSeek" }] }),
  component: Success,
});

function Success() {
  const { orderId } = Route.useParams();
  const eta = new Date(Date.now() + 5 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <div className="text-center max-w-md">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="mx-auto h-24 w-24 rounded-full bg-lime text-black grid place-items-center">
          <Check className="h-12 w-12" strokeWidth={3} />
        </motion.div>
        <h1 className="mt-8 font-display text-5xl tracking-tight">ORDER CONFIRMED</h1>
        <p className="mt-3 text-light-gray">Your order <span className="text-lime font-mono">{orderId}</span> is in. We'll ship it soon.</p>
        <p className="mt-2 text-sm text-mid-gray">Estimated delivery: <span className="text-white">{eta}</span></p>
        <div className="mt-10 flex gap-3 justify-center">
          <Link to="/track-order"><MSButton variant="outline">Track Order</MSButton></Link>
          <Link to="/shop"><MSButton>Continue Shopping</MSButton></Link>
        </div>
      </div>
    </div>
  );
}
