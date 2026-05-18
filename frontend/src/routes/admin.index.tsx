import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const token = useAuth((s) => s.token);
  const [statsData, setStatsData] = useState<any>({
    total_revenue: 0,
    orders_today: 0,
    total_products: 0,
    total_users: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/admin/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.ok) {
          const stats = await statsRes.json();
          setStatsData(stats);
        }
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setRecentOrders(orders.slice(0, 5));
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (token) fetchData();
  }, [token]);

  const stats = [
    { l: "Revenue (Delivered)", v: formatINR(statsData.total_revenue) },
    { l: "Orders today", v: statsData.orders_today.toString() },
    { l: "Active Products", v: statsData.total_products.toString() },
    { l: "Total Customers", v: statsData.total_users.toString() },
  ];

  if (loading) {
    return <div className="text-mid-gray animate-pulse font-display">Loading Dashboard stats...</div>;
  }

  return (
    <div>
      <h1 className="font-display text-4xl tracking-tight text-white">DASHBOARD</h1>
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.l} className="bg-off-black border border-dark-gray rounded-md p-5">
            <p className="text-xs text-light-gray uppercase tracking-widest">{s.l}</p>
            <p className="mt-2 font-display text-3xl text-lime">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 bg-off-black border border-dark-gray rounded-md p-6">
        <p className="font-display text-xl tracking-widest mb-4 text-white">RECENT ORDERS</p>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-mid-gray py-4">No recent orders found.</p>
        ) : (
          <table className="w-full text-sm text-white">
            <thead className="text-light-gray text-left text-xs uppercase tracking-widest">
              <tr>
                <th className="py-2">Order</th><th>Customer</th><th>Amount</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => {
                const customerName = o.address?.full_name || o.users?.name || "Guest";
                return (
                  <tr key={o.id} className="border-t border-dark-gray">
                    <td className="py-3 font-mono text-xs text-light-gray">{o.order_number}</td>
                    <td>{customerName}</td>
                    <td className="text-lime">{formatINR(parseFloat(o.total))}</td>
                    <td>
                      <span className="text-xs px-2 py-1 rounded-sm bg-charcoal capitalize">
                        {o.status}
                      </span>
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
