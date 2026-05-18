import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { MSButton } from "@/components/ms/Button";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useAuth((s) => s.login);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading("Authenticating...", { id: "admin-login" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Login failed");
      
      if (data.user.role !== "admin") {
        throw new Error("Access denied. Admins only.");
      }
      
      login(data.user, data.token);
      toast.success("Welcome, Admin", { id: "admin-login" });
      router.navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message, { id: "admin-login" });
    }
  };

  return (
    <div className="min-h-dvh grid place-items-center px-4 bg-black">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-off-black border border-dark-gray rounded-md p-8 space-y-4">
        <div>
          <p className="font-display tracking-[0.3em] text-xs text-lime">MANSEEK</p>
          <h1 className="font-display text-3xl tracking-tight mt-1">ADMIN LOGIN</h1>
        </div>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full h-12 px-4 bg-charcoal border border-dark-gray rounded-sm focus:border-lime focus:outline-none" />
        <MSButton type="submit" className="w-full" size="lg">Sign In</MSButton>
      </form>
    </div>
  );
}
