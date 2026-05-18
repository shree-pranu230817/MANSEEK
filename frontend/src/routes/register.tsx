import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import hero from "@/assets/hero-3.jpg";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create Account — ManSeek" }] }),
  component: Register,
});

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuth((s) => s.login);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, line1, line2, city, state, pincode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      
      login(data.user, data.token);
      toast.success("Account created successfully!");
      router.navigate({ to: "/account" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] grid lg:grid-cols-2">
      <div className="grid place-items-center px-6 py-16 order-2 lg:order-1">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-4xl tracking-tight">CREATE ACCOUNT</h1>
          <p className="text-light-gray text-sm">Already have one? <Link to="/login" className="text-lime hover:underline">Sign in</Link></p>
          
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile Number" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          
          <p className="text-sm tracking-widest text-lime pt-4">DEFAULT ADDRESS (OPTIONAL)</p>
          <input value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Address Line 1" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          <input value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Address Line 2" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          <div className="grid grid-cols-2 gap-4">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
            <input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          </div>
          <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />

          <MSButton type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </MSButton>
        </form>
      </div>
      <div className="relative hidden lg:block order-1 lg:order-2">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-bl from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-10 right-10 max-w-sm text-right">
          <p className="font-accent italic text-lime text-xl">Join the movement</p>
          <p className="font-display text-5xl tracking-tight mt-2 leading-none">DROP 014 AWAITS.</p>
        </div>
      </div>
    </div>
  );
}
