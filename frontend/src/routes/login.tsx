import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import hero from "@/assets/hero-1.jpg";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — ManSeek" }] }),
  component: Login,
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuth((s) => s.login);
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      login(data.user, data.token);
      toast.success("Welcome back");
      router.navigate({ to: "/account" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] grid lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-10 left-10 max-w-sm">
          <p className="font-accent italic text-lime text-xl">Welcome back</p>
          <p className="font-display text-5xl tracking-tight mt-2 leading-none">WEAR YOUR STORY.</p>
        </div>
      </div>
      <div className="grid place-items-center px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-4xl tracking-tight">SIGN IN</h1>
          <p className="text-light-gray text-sm">No account? <Link to="/register" className="text-lime hover:underline">Create one</Link></p>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
          <MSButton type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </MSButton>
          <button type="button" disabled className="w-full h-12 rounded-pill border border-dark-gray text-mid-gray text-sm">Continue with Google (soon)</button>
        </form>
      </div>
    </div>
  );
}
