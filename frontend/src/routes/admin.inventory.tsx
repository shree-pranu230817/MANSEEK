import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUpDown, History, Plus, Minus, Search } from "lucide-react";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventory,
});

function AdminInventory() {
  const token = useAuth((s) => s.token);
  const [inventory, setInventory] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"stock" | "history">("stock");

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState("manual_adjustment");
  const [note, setNote] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, movRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/inventory`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/inventory/movements`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData.inventory || []);
        setLowStockAlerts(invData.lowStockAlerts || []);
      }
      if (movRes.ok) {
        setMovements(await movRes.json());
      }
    } catch (err: any) {
      toast.error("Failed to load inventory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      toast.loading("Recording stock adjustment...", { id: "adj" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/inventory/adjust`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          delta: Number(delta),
          reason,
          note,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");

      toast.success("Stock adjustment saved!", { id: "adj" });
      setShowAdjustModal(false);
      setSelectedProduct(null);
      setDelta(1);
      setNote("");
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "adj" });
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-dark-gray/40 gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-white">INVENTORY & STOCK</h1>
          <p className="text-sm text-light-gray mt-1">
            Real-time catalog stock levels, automated low-stock warnings, and audit movement logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              activeTab === "stock" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            STOCK LEVELS
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              activeTab === "history" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            AUDIT TRAIL ({movements.length})
          </button>
        </div>
      </div>

      {/* Low Stock Banner */}
      {lowStockAlerts.length > 0 && activeTab === "stock" && (
        <div className="mt-6 p-4 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">
                {lowStockAlerts.length} item(s) currently low or out of stock!
              </p>
              <p className="text-xs text-light-gray">
                {lowStockAlerts.map((i) => i.name).slice(0, 3).join(", ")}
                {lowStockAlerts.length > 3 ? " and more..." : ""}
              </p>
            </div>
          </div>
          <span className="text-xs bg-amber-400 text-black font-bold px-2.5 py-1 rounded">
            ACTION REQUIRED
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center font-display text-light-gray animate-pulse">
          Loading inventory status...
        </div>
      ) : activeTab === "stock" ? (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative max-w-xs w-full">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-light-gray" />
              <input
                type="text"
                placeholder="Search products or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-off-black border border-dark-gray rounded pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime"
              />
            </div>
          </div>

          <div className="bg-off-black border border-dark-gray rounded-md overflow-hidden">
            <table className="w-full text-sm text-white">
              <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
                <tr>
                  <th className="p-4">Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Total Stock</th>
                  <th>Per-Size Breakdown</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th className="p-4 text-right">Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-gray/30">
                {filteredInventory.map((item) => {
                  const isOutOfStock = (item.stock || 0) === 0;
                  const isLow = !isOutOfStock && (item.stock || 0) <= (item.low_stock_threshold || 5);
                  return (
                    <tr key={item.id} className="hover:bg-charcoal/30 transition-colors">
                      <td className="p-4 font-semibold text-white">{item.name}</td>
                      <td className="text-xs text-light-gray">{item.categories?.name || "General"}</td>
                      <td className="font-mono text-xs text-lime">{item.sku || "N/A"}</td>
                      <td className="font-mono font-bold text-base">
                        <span className={isOutOfStock ? "text-danger" : isLow ? "text-amber-400" : "text-lime"}>
                          {item.stock || 0}
                        </span>
                      </td>
                      <td className="text-xs text-light-gray">
                        {item.size_stock ? (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(item.size_stock).map(([s, qty]: [string, any]) => (
                              <span key={s} className="px-1.5 py-0.5 rounded bg-charcoal text-[10px] font-mono">
                                {s}:{qty}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "Standard"
                        )}
                      </td>
                      <td className="font-mono text-xs text-light-gray">{item.low_stock_threshold || 5}</td>
                      <td>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            isOutOfStock
                              ? "bg-danger text-white"
                              : isLow
                              ? "bg-amber-400 text-black"
                              : "bg-lime/20 text-lime"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <MSButton
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(item);
                            setShowAdjustModal(true);
                          }}
                        >
                          <ArrowUpDown className="h-3 w-3 mr-1" /> Adjust
                        </MSButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-off-black border border-dark-gray rounded-md overflow-hidden">
          <table className="w-full text-sm text-white">
            <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
              <tr>
                <th className="p-4">Timestamp</th>
                <th>Product</th>
                <th>Change</th>
                <th>Stock After</th>
                <th>Reason</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-gray/30">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-charcoal/30">
                  <td className="p-4 text-xs font-mono text-light-gray">
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td className="text-white font-medium">{m.products?.name || "Product"}</td>
                  <td className={`font-mono font-bold ${m.delta > 0 ? "text-lime" : "text-danger"}`}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </td>
                  <td className="font-mono text-white">{m.stock_after}</td>
                  <td className="capitalize text-xs text-light-gray">{m.reason?.replace(/_/g, " ")}</td>
                  <td className="text-xs text-mid-gray italic">{m.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-off-black border border-dark-gray rounded-md max-w-md w-full p-6 animate-in fade-in">
            <h2 className="font-display text-2xl text-white mb-2">ADJUST STOCK</h2>
            <p className="text-xs text-light-gray mb-4 font-mono">
              Product: <span className="text-white font-semibold">{selectedProduct.name}</span> (Current: {selectedProduct.stock || 0})
            </p>
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Adjustment Delta (+/-) *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDelta((prev) => (prev > 0 ? -prev : prev))}
                    className={`px-3 py-1 text-xs rounded font-bold ${delta < 0 ? "bg-danger text-white" : "bg-charcoal text-light-gray"}`}
                  >
                    Decrease (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelta((prev) => Math.abs(prev))}
                    className={`px-3 py-1 text-xs rounded font-bold ${delta > 0 ? "bg-lime text-black" : "bg-charcoal text-light-gray"}`}
                  >
                    Increase (+)
                  </button>
                  <input
                    type="number"
                    required
                    value={Math.abs(delta)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDelta(delta < 0 ? -val : val);
                    }}
                    className="flex-1 bg-charcoal border border-dark-gray rounded px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-lime"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-lime capitalize"
                >
                  <option value="manual_adjustment">Manual Adjustment</option>
                  <option value="return_restock">Return Restock</option>
                  <option value="damage">Damaged Inventory</option>
                  <option value="initial">Restock / Shipment Arrival</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. PO #10842, warehouse recount"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-lime"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <MSButton variant="ghost" type="button" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </MSButton>
                <MSButton type="submit">Confirm Adjustment</MSButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

