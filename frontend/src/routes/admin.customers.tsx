import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, ShoppingCart, Mail, Phone, Calendar, Search } from "lucide-react";
import { useAuth } from "@/store/auth";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const token = useAuth((s) => s.token);
  const [customers, setCustomers] = useState<any[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"customers" | "abandoned">("customers");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [custRes, cartRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/abandoned-carts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (custRes.ok) setCustomers(await custRes.json());
      if (cartRes.ok) setAbandonedCarts(await cartRes.json());
    } catch (err: any) {
      toast.error("Failed to load customer data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-dark-gray/40 gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-white">CUSTOMERS & AUDIENCE</h1>
          <p className="text-sm text-light-gray mt-1">
            Registered customer profiles, shipping address records, and abandoned cart recovery opportunities.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("customers")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              tab === "customers" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            CUSTOMERS ({customers.length})
          </button>
          <button
            onClick={() => setTab("abandoned")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              tab === "abandoned" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            ABANDONED CARTS ({abandonedCarts.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-display text-light-gray animate-pulse">
          Loading customer records...
        </div>
      ) : tab === "customers" ? (
        <div className="mt-6 space-y-4">
          <div className="relative max-w-xs w-full">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-light-gray" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-off-black border border-dark-gray rounded pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-lime"
            />
          </div>

          <div className="bg-off-black border border-dark-gray rounded-md overflow-hidden">
            <table className="w-full text-sm text-white">
              <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
                <tr>
                  <th className="p-4">Customer</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Saved Addresses</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-gray/30">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-charcoal/30">
                    <td className="p-4">
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-light-gray">{c.email}</p>
                    </td>
                    <td className="text-xs text-light-gray font-mono">
                      {c.phone || "No phone"}
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${c.role === "admin" ? "bg-lime text-black" : "bg-charcoal text-white"}`}>
                        {c.role || "customer"}
                      </span>
                    </td>
                    <td className="text-xs text-light-gray">
                      {c.addresses && c.addresses.length > 0 ? (
                        <span>{c.addresses.length} address(es)</span>
                      ) : (
                        <span className="text-mid-gray italic">None</span>
                      )}
                    </td>
                    <td className="text-xs text-light-gray font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          {abandonedCarts.length === 0 ? (
            <div className="bg-off-black border border-dark-gray rounded-md p-12 text-center">
              <ShoppingCart className="h-10 w-10 text-lime mx-auto mb-3" />
              <p className="font-display text-xl text-white">NO ABANDONED CARTS RECORDED</p>
              <p className="text-xs text-light-gray mt-1">Customers who leave items without checkout will be displayed here.</p>
            </div>
          ) : (
            <div className="bg-off-black border border-dark-gray rounded-md overflow-hidden">
              <table className="w-full text-sm text-white">
                <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
                  <tr>
                    <th className="p-4">Customer Email</th>
                    <th>Subtotal</th>
                    <th>Items</th>
                    <th>Last Active</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-gray/30">
                  {abandonedCarts.map((cart) => (
                    <tr key={cart.id} className="hover:bg-charcoal/30">
                      <td className="p-4 font-mono text-xs text-white">{cart.email || "Guest"}</td>
                      <td className="text-lime font-bold">{formatINR(cart.subtotal)}</td>
                      <td className="text-xs text-light-gray">
                        {Array.isArray(cart.items) ? `${cart.items.length} items` : "Cart items"}
                      </td>
                      <td className="text-xs text-light-gray font-mono">
                        {new Date(cart.last_active).toLocaleString()}
                      </td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${cart.recovered ? "bg-lime text-black" : "bg-danger text-white"}`}>
                          {cart.recovered ? "RECOVERED" : "UNRECOVERED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

