import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { formatINR } from "@/lib/format";
import { MSButton } from "@/components/ms/Button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — ManSeek" }] }),
  component: Checkout,
});

const addressSchema = z.object({
  fullName: z.string().min(2, "Required"),
  phone: z.string().min(10, "10 digits"),
  email: z.string().email(),
  line1: z.string().min(3, "Required"),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6).max(6),
});
type AddressForm = z.infer<typeof addressSchema>;

const steps = ["Address", "Review", "Payment"] as const;

function Checkout() {
  const [step, setStep] = useState(0);
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clearCart);
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const router = useRouter();
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  const form = useForm<AddressForm>({ 
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      line1: user?.addresses?.[0]?.line1 || "",
      line2: user?.addresses?.[0]?.line2 || "",
      city: user?.addresses?.[0]?.city || "",
      state: user?.addresses?.[0]?.state || "",
      pincode: user?.addresses?.[0]?.pincode || "",
    }
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-3xl">YOUR BAG IS EMPTY</p>
        <Link to="/shop"><MSButton className="mt-6">Shop Now</MSButton></Link>
      </div>
    );
  }

  const onPay = async () => {
    if (!token) {
      toast.error("Please login to complete payment");
      return;
    }
    
    try {
      toast.loading("Connecting to Razorpay...", { id: "pay" });
      
      const payload = {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, size: i.size, color: i.color })),
        shippingAddress: form.getValues(),
        couponCode: null
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/orders/create-razorpay-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Ensure you add this to frontend .env
        amount: data.amount,
        currency: data.currency,
        name: "ManSeek",
        description: "Order Payment",
        order_id: data.id,
        handler: async function (response: any) {
          toast.loading("Verifying payment...", { id: "pay" });
          const verifyRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({
              orderId: data.receipt,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
          
          toast.success("Payment successful!", { id: "pay" });
          clear();
          router.navigate({ to: "/order-success/$orderId", params: { orderId: verifyData.order.id } });
        },
        prefill: {
          name: form.getValues().fullName,
          email: form.getValues().email,
          contact: form.getValues().phone,
        },
        theme: {
          color: "#e8ff47" // lime
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error(`Payment failed: ${response.error.description}`, { id: "pay" });
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message, { id: "pay" });
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 lg:px-8 py-12">
      <h1 className="font-display text-5xl tracking-tight mb-8">CHECKOUT</h1>
      <div className="flex items-center gap-4 mb-10">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-4">
            <div className={cn("h-9 w-9 rounded-full grid place-items-center font-display text-sm", i <= step ? "bg-lime text-black" : "bg-charcoal text-light-gray")}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("font-display tracking-widest text-sm", i <= step ? "text-white" : "text-mid-gray")}>{s}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-dark-gray" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="bg-off-black border border-dark-gray rounded-md p-6 lg:p-8">
          {step === 0 && (
            <form onSubmit={form.handleSubmit(() => setStep(1))} className="space-y-4">
              <p className="font-display text-2xl tracking-widest mb-4">SHIPPING ADDRESS</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" error={form.formState.errors.fullName?.message} {...form.register("fullName")} />
                <Field label="Phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
              </div>
              <Field label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
              <Field label="Address Line 1" error={form.formState.errors.line1?.message} {...form.register("line1")} />
              <Field label="Address Line 2 (optional)" {...form.register("line2")} />
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="City" error={form.formState.errors.city?.message} {...form.register("city")} />
                <Field label="State" error={form.formState.errors.state?.message} {...form.register("state")} />
                <Field label="Pincode" error={form.formState.errors.pincode?.message} {...form.register("pincode")} />
              </div>
              <MSButton type="submit" className="w-full" size="lg">Continue</MSButton>
            </form>
          )}
          {step === 1 && (
            <div>
              <p className="font-display text-2xl tracking-widest mb-4">REVIEW</p>
              <div className="space-y-3 mb-6">
                {items.map((i) => (
                  <div key={i.productId + i.size} className="flex gap-3 items-center">
                    <img src={i.image} className="h-16 w-14 object-cover rounded-sm" alt="" />
                    <div className="flex-1">
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-light-gray">Size {i.size} · Qty {i.quantity}</p>
                    </div>
                    <p className="text-lime font-display text-lg">{formatINR(i.price * i.quantity)}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-light-gray mb-6">Delivery in 3–6 business days.</p>
              <div className="flex gap-3">
                <MSButton variant="outline" onClick={() => setStep(0)}>Back</MSButton>
                <MSButton className="flex-1" onClick={() => setStep(2)}>Continue to Payment</MSButton>
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <p className="font-display text-2xl tracking-widest mb-4">PAYMENT</p>
              <div className="p-6 bg-charcoal rounded-md border border-dark-gray mb-6">
                <p className="text-sm text-light-gray">Secure payments via</p>
                <p className="font-display text-3xl text-lime mt-1">RAZORPAY</p>
                <p className="text-xs text-mid-gray mt-3">UPI · Cards · Net Banking · Wallets</p>
              </div>
              <div className="flex gap-3">
                <MSButton variant="outline" onClick={() => setStep(1)}>Back</MSButton>
                <MSButton className="flex-1" size="lg" onClick={onPay}>Pay {formatINR(total)}</MSButton>
              </div>
            </div>
          )}
        </div>

        <aside className="bg-off-black border border-dark-gray rounded-md p-6 h-fit">
          <p className="font-display text-xl tracking-widest mb-4">ORDER SUMMARY</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-light-gray">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-light-gray">Shipping</span><span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
            <div className="h-px bg-dark-gray my-2" />
            <div className="flex justify-between items-baseline"><span className="text-light-gray uppercase tracking-widest text-xs">Total</span><span className="font-display text-3xl text-lime">{formatINR(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const Field = ({ label, error, ...props }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-light-gray">{label}</span>
    <input {...props} className="mt-1 w-full h-11 px-4 bg-charcoal border border-dark-gray rounded-sm text-sm focus:border-lime focus:outline-none" />
    {error && <span className="text-xs text-danger mt-1 block">{error}</span>}
  </label>
);
