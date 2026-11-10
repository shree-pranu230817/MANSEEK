import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Ticket, Trash2, Check, X } from "lucide-react";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const token = useAuth((s) => s.token);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCoupons(await res.json());
    } catch (err: any) {
      toast.error("Failed to load coupons: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadCoupons();
  }, [token]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return;

    try {
      toast.loading("Creating coupon...", { id: "cpn" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          type,
          value: Number(value),
          min_order_value: Number(minOrderValue) || 0,
          max_uses: maxUses ? Number(maxUses) : null,
          expires_at: expiresAt || null,
          is_active: isActive,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");

      toast.success("Coupon created successfully!", { id: "cpn" });
      setShowModal(false);
      setCode("");
      setValue("");
      setMinOrderValue("");
      setMaxUses("");
      setExpiresAt("");
      loadCoupons();
    } catch (err: any) {
      toast.error(err.message, { id: "cpn" });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/coupons/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Coupon deleted");
        loadCoupons();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-dark-gray/40 gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-white">COUPONS & PROMOTIONS</h1>
          <p className="text-sm text-light-gray mt-1">
            Create percentage discounts, flat cashbacks, minimum order value thresholds, and usage limits.
          </p>
        </div>
        <MSButton onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Coupon
        </MSButton>
      </div>

      {loading ? (
        <div className="py-20 text-center font-display text-light-gray animate-pulse">
          Loading promotions...
        </div>
      ) : coupons.length === 0 ? (
        <div className="mt-8 bg-off-black border border-dark-gray rounded-md p-12 text-center">
          <Ticket className="h-10 w-10 text-lime mx-auto mb-3" />
          <p className="font-display text-xl text-white">NO ACTIVE PROMOTIONS</p>
          <p className="text-xs text-light-gray mt-1">Create discount codes to drive sales campaigns.</p>
        </div>
      ) : (
        <div className="mt-8 bg-off-black border border-dark-gray rounded-md overflow-hidden">
          <table className="w-full text-sm text-white">
            <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
              <tr>
                <th className="p-4">Coupon Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Redemptions</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="p-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-gray/30">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-charcoal/30">
                  <td className="p-4 font-mono font-bold text-lime flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-light-gray" /> {c.code}
                  </td>
                  <td className="font-semibold text-white">
                    {c.type === "percentage" ? `${c.value}% OFF` : `Flat ${formatINR(c.value)} OFF`}
                  </td>
                  <td className="font-mono text-xs text-light-gray">
                    {c.min_order_value ? formatINR(c.min_order_value) : "No minimum"}
                  </td>
                  <td className="font-mono text-xs text-light-gray">
                    {c.used_count || 0} {c.max_uses ? `/ ${c.max_uses}` : "uses"}
                  </td>
                  <td className="text-xs text-light-gray">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                  </td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.is_active ? "bg-lime/20 text-lime" : "bg-charcoal text-mid-gray"}`}>
                      {c.is_active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="p-1 hover:text-danger text-light-gray transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-off-black border border-dark-gray rounded-md max-w-md w-full p-6 animate-in fade-in">
            <h2 className="font-display text-2xl text-white mb-4">CREATE DISCOUNT COUPON</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STREET20, MANSEEK500"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase text-light-gray block mb-1">Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-lime"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-light-gray block mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    placeholder={type === "percentage" ? "15" : "500"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lime"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase text-light-gray block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lime"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase text-light-gray block mb-1">Max Uses</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lime"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-lime"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <MSButton variant="ghost" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </MSButton>
                <MSButton type="submit">Publish Coupon</MSButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

