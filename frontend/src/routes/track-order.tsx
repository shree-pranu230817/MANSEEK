import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Package, Truck, MapPin, Home } from "lucide-react";
import { MSButton } from "@/components/ms/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/track-order")({
  head: () => ({ meta: [{ title: "Track Order — ManSeek" }] }),
  component: Track,
});

const stages = [
  { label: "Placed", icon: Check },
  { label: "Confirmed", icon: Package },
  { label: "Shipped", icon: Truck },
  { label: "Out for Delivery", icon: MapPin },
  { label: "Delivered", icon: Home },
];

function Track() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);

  const getStatusStep = (status: string) => {
    switch (status) {
      case "pending":
        return 0; // Placed
      case "confirmed":
      case "processing":
        return 1; // Confirmed
      case "shipped":
        return 2; // Shipped
      case "out_for_delivery":
        return 3; // Out for Delivery
      case "delivered":
        return 4; // Delivered
      default:
        return 0;
    }
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOrderData(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/orders/track?orderNumber=${orderId.trim()}&email=${email.trim()}`
      );
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Order not found or unauthorized.");
      }

      setOrderData(data);
      toast.success("Order tracked successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to find order.");
    } finally {
      setLoading(false);
    }
  };

  const activeStep = orderData ? getStatusStep(orderData.status) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-8 py-12 text-white">
      <h1 className="font-display text-5xl lg:text-6xl tracking-tight mb-8">TRACK YOUR ORDER</h1>
      <form onSubmit={handleTrack} className="bg-off-black border border-dark-gray rounded-md p-6 space-y-4">
        <input
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          required
          placeholder="Order ID (e.g. MNS-123456)"
          className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Email address"
          className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none"
        />
        <MSButton type="submit" className="w-full pt-1.5" size="lg" disabled={loading}>
          {loading ? "Tracking..." : "Track"}
        </MSButton>
      </form>

      {orderData && (
        <div className="mt-10 bg-off-black border border-dark-gray rounded-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="font-display text-2xl tracking-widest uppercase">
                ORDER {orderId.toUpperCase()}
              </p>
              <p className="text-light-gray text-sm mt-1 capitalize">
                Status: <span className="text-lime font-bold">{orderData.status}</span>
              </p>
            </div>
            {orderData.estimated_delivery && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-light-gray">Est. Delivery</p>
                <p className="font-bold text-white text-sm mt-0.5">{orderData.estimated_delivery}</p>
              </div>
            )}
          </div>

          {orderData.status === "cancelled" || orderData.status === "refunded" ? (
            <div className="bg-danger/20 border border-danger/40 text-danger rounded-md p-4 text-center text-sm font-semibold uppercase tracking-wider">
              This order has been {orderData.status}.
            </div>
          ) : (
            <div className="flex items-center justify-between relative mt-8">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-dark-gray" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-lime transition-all"
                style={{ width: `${(activeStep / (stages.length - 1)) * 100}%` }}
              />
              {stages.map((s, i) => (
                <div key={s.label} className="relative flex flex-col items-center gap-2 z-10 flex-1">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full grid place-items-center transition border",
                      i <= activeStep
                        ? "bg-lime text-black border-lime"
                        : "bg-charcoal text-mid-gray border-dark-gray"
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-display tracking-widest text-center",
                      i <= activeStep ? "text-white font-bold" : "text-mid-gray"
                    )}
                  >
                    {s.label.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {orderData.tracking_number && (
            <p className="mt-8 text-xs text-light-gray text-center border-t border-dark-gray pt-4">
              Courier Tracking Code: <span className="font-mono text-white text-sm font-bold bg-charcoal px-2 py-0.5 rounded-sm">{orderData.tracking_number}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
