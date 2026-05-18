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
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
                const isExpanded = expandedOrderId === o.id;
                return (
                  <>
                    <tr
                      key={o.id}
                      onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                      className="border-t border-dark-gray hover:bg-charcoal/30 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-lime flex items-center gap-2">
                        <span>{isExpanded ? "▼" : "▶"}</span>
                        <span>{o.order_number}</span>
                      </td>
                      <td>{customerName}</td>
                      <td className="text-lime">{formatINR(parseFloat(o.total))}</td>
                      <td className="text-light-gray">{orderDate}</td>
                      <td onClick={(e) => e.stopPropagation()}>
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
                    
                    {isExpanded && (
                      <tr className="bg-charcoal/10 border-t border-dark-gray">
                        <td colSpan={5} className="p-6">
                          <div className="grid md:grid-cols-[1.5fr_1fr] gap-6 text-sm text-white">
                            {/* Items ordered */}
                            <div>
                              <p className="text-xs uppercase tracking-widest text-lime font-bold mb-3">Items Ordered</p>
                              <div className="space-y-3">
                                {o.items && o.items.map((item: any, idx: number) => (
                                  <div key={idx} className="flex gap-4 items-center bg-charcoal/30 p-3 rounded-sm border border-dark-gray/50">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-16 w-14 object-cover rounded bg-charcoal border border-dark-gray"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-display text-base leading-tight truncate text-white">
                                        {item.name}
                                      </p>
                                      <p className="text-xs text-light-gray uppercase tracking-widest mt-1">
                                        Size {item.size || "M"} · {item.color || "Black"} · Qty {item.quantity}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-display text-base text-lime">
                                        {formatINR((item.price || o.total / o.items.length) * item.quantity)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Shipping & Financial Breakdown */}
                            <div className="space-y-4 border-l border-dark-gray/50 pl-6">
                              <div>
                                <p className="text-xs uppercase tracking-widest text-lime font-bold mb-2">Shipping Information</p>
                                <div className="text-xs text-light-gray space-y-1 bg-charcoal/30 p-3 rounded-sm border border-dark-gray/50">
                                  <p className="text-white font-semibold">{o.address?.full_name}</p>
                                  {o.address?.phone && <p>Phone: {o.address.phone}</p>}
                                  <p>{o.address?.line1}</p>
                                  {o.address?.line2 && <p>{o.address.line2}</p>}
                                  <p>{o.address?.city}, {o.address?.state} - {o.address?.pincode}</p>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-xs uppercase tracking-widest text-lime font-bold mb-2">Financial Summary</p>
                                <div className="text-xs text-light-gray space-y-1 bg-charcoal/30 p-3 rounded-sm border border-dark-gray/50">
                                  <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span className="text-white font-mono">{formatINR(parseFloat(o.subtotal || o.total))}</span>
                                  </div>
                                  {parseFloat(o.discount) > 0 && (
                                    <div className="flex justify-between">
                                      <span>Discount:</span>
                                      <span className="text-danger font-mono">-{formatINR(parseFloat(o.discount))}</span>
                                    </div>
                                  )}
                                  {parseFloat(o.shipping_charge) > 0 && (
                                    <div className="flex justify-between">
                                      <span>Shipping Charge:</span>
                                      <span className="text-white font-mono">+{formatINR(parseFloat(o.shipping_charge))}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-dark-gray/50 pt-2 text-sm font-bold text-lime">
                                    <span>Grand Total:</span>
                                    <span>{formatINR(parseFloat(o.total))}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
