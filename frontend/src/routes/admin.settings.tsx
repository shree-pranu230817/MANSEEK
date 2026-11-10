import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Settings, Shield, Save, CheckCircle } from "lucide-react";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const token = useAuth((s) => s.token);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"settings" | "audit">("settings");

  // Config settings states
  const [newBadgeDays, setNewBadgeDays] = useState(30);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [setRes, logRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (setRes.ok) {
        const settings = await setRes.json();
        settings.forEach((s: any) => {
          if (s.key === "new_product_duration_days") setNewBadgeDays(Number(s.value));
          if (s.key === "low_stock_threshold_default") setLowStockThreshold(Number(s.value));
          if (s.key === "free_shipping_threshold") setFreeShippingThreshold(Number(s.value));
        });
      }

      if (logRes.ok) {
        setAuditLogs(await logRes.json());
      }
    } catch (err: any) {
      toast.error("Error loading settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleSaveSetting = async (key: string, value: any, label: string) => {
    try {
      toast.loading(`Updating ${label}...`, { id: "set" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success(`${label} updated successfully!`, { id: "set" });
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "set" });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-dark-gray/40 gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-white">STORE CONFIGURATION</h1>
          <p className="text-sm text-light-gray mt-1">
            Dynamic system rules, automatic badge lifecycles, and security audit log trails.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              activeTab === "settings" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            SYSTEM RULES
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              activeTab === "audit" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            AUDIT TRAIL ({auditLogs.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-display text-light-gray animate-pulse">
          Loading settings...
        </div>
      ) : activeTab === "settings" ? (
        <div className="mt-8 max-w-2xl space-y-6">
          {/* Automatic NEW Product Period */}
          <div className="bg-off-black border border-dark-gray rounded-md p-6">
            <h3 className="font-display text-lg text-white mb-1">AUTOMATIC "NEW" BADGE DURATION</h3>
            <p className="text-xs text-light-gray mb-4">
              Newly published products automatically display the storefront "NEW" badge. Once this duration elapses from the product's publish date, the badge disappears automatically without redeployment.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                max={365}
                value={newBadgeDays}
                onChange={(e) => setNewBadgeDays(Number(e.target.value))}
                className="w-32 bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lime"
              />
              <span className="text-sm text-light-gray">days from publish date</span>
              <MSButton
                size="sm"
                onClick={() =>
                  handleSaveSetting("new_product_duration_days", newBadgeDays, "NEW Badge Duration")
                }
              >
                Save
              </MSButton>
            </div>
          </div>

          {/* Low Stock Warning Threshold */}
          <div className="bg-off-black border border-dark-gray rounded-md p-6">
            <h3 className="font-display text-lg text-white mb-1">DEFAULT LOW-STOCK ALERT THRESHOLD</h3>
            <p className="text-xs text-light-gray mb-4">
              Products or variants with inventory at or below this value will trigger dashboard warnings.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={0}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-32 bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lime"
              />
              <span className="text-sm text-light-gray">units remaining</span>
              <MSButton
                size="sm"
                onClick={() =>
                  handleSaveSetting("low_stock_threshold_default", lowStockThreshold, "Low Stock Threshold")
                }
              >
                Save
              </MSButton>
            </div>
          </div>

          {/* Free Shipping Limit */}
          <div className="bg-off-black border border-dark-gray rounded-md p-6">
            <h3 className="font-display text-lg text-white mb-1">FREE SHIPPING MINIMUM ORDER</h3>
            <p className="text-xs text-light-gray mb-4">
              Subtotal threshold above which the customer receives free shipping across India.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={0}
                step={50}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-32 bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-lime"
              />
              <span className="text-sm text-light-gray">₹ INR</span>
              <MSButton
                size="sm"
                onClick={() =>
                  handleSaveSetting("free_shipping_threshold", freeShippingThreshold, "Free Shipping Threshold")
                }
              >
                Save
              </MSButton>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-off-black border border-dark-gray rounded-md overflow-hidden">
          <table className="w-full text-sm text-white">
            <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
              <tr>
                <th className="p-4">Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-gray/30">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-charcoal/30">
                  <td className="p-4 text-xs font-mono text-light-gray">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="text-xs text-lime font-mono">{log.user_email}</td>
                  <td className="font-bold text-xs uppercase tracking-wider">{log.action}</td>
                  <td className="text-xs text-light-gray capitalize">{log.entity_type}</td>
                  <td className="text-xs text-light-gray font-mono truncate max-w-xs">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

