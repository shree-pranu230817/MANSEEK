import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const token = useAuth((s) => s.token);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Order status updated successfully!");
        fetchOrders();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return <div className="text-mid-gray animate-pulse font-display">Loading orders...</div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-tight text-white">ORDERS</h1>
      <div className="mt-8 bg-off-black border border-dark-gray rounded-md overflow-hidden">
        {orders.length === 0 ? (
          <p className="text-sm text-mid-gray p-8 text-center">No orders placed yet.</p>
        ) : (
          <table className="w-full text-sm text-white">
            <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
              <tr>
                <th className="p-4">Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const customerName = o.address?.full_name || o.users?.name || "Guest";
                const orderDate = new Date(o.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <tr key={o.id} className="border-t border-dark-gray">
                    <td className="p-4 font-mono text-xs text-light-gray">{o.order_number}</td>
                    <td>{customerName}</td>
                    <td className="text-lime">{formatINR(parseFloat(o.total))}</td>
                    <td className="text-light-gray">{orderDate}</td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className="bg-charcoal border border-dark-gray rounded-sm px-2 py-1 text-xs focus:outline-none focus:border-lime capitalize"
                      >
                        {[
                          "pending",
                          "confirmed",
                          "processing",
                          "shipped",
                          "out_for_delivery",
                          "delivered",
                          "cancelled",
                          "refunded",
                        ].map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
