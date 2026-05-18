import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { MSButton } from "@/components/ms/Button";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account — ManSeek" }] }),
  component: Account,
});

function Account() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.token);
  const loginState = useAuth((s) => s.login);
  const logout = useAuth((s) => s.logout);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "addresses" | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile Edit states
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");

  // Address Form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    if (!user) router.navigate({ to: "/login" });
  }, [user, router]);

  useEffect(() => {
    if (activeTab === "orders" && token) {
      setLoadingOrders(true);
      fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setOrders(data);
          setLoadingOrders(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingOrders(false);
        });
    }
  }, [activeTab, token]);

  if (!user) return null;

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const updatedUser = { ...user, name: editName, phone: editPhone };
    loginState(updatedUser, token);
    toast.success("Profile details updated successfully!");
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const newAddress = {
      id: Math.random().toString(),
      full_name: user.name,
      phone: user.phone || "9999999999",
      line1,
      line2,
      city,
      state: stateName,
      pincode,
      is_default: (user.addresses || []).length === 0,
    };
    const updatedAddresses = [...(user.addresses || []), newAddress];
    const updatedUser = { ...user, addresses: updatedAddresses };
    loginState(updatedUser, token);
    toast.success("New address added successfully!");
    setShowAddressForm(false);
    setLine1("");
    setLine2("");
    setCity("");
    setStateName("");
    setPincode("");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 lg:px-8 py-12 text-white">
      {activeTab && (
        <button
          onClick={() => setActiveTab(null)}
          className="text-xs text-lime uppercase tracking-widest hover:underline mb-6 block"
        >
          ← Back to Dashboard
        </button>
      )}

      {!activeTab ? (
        <>
          <h1 className="font-display text-5xl lg:text-6xl tracking-tight">
            HELLO, {user.name.split(" ")[0].toUpperCase()}
          </h1>
          <p className="text-light-gray mt-2">{user.email}</p>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              {
                id: "orders",
                t: "My Orders",
                d: "Track and manage your purchases",
              },
              { id: "profile", t: "Profile", d: "Update name, phone, email" },
              {
                id: "addresses",
                t: "Addresses",
                d: "Manage saved shipping addresses",
              },
            ].map((card) => (
              <div
                key={card.id}
                onClick={() => setActiveTab(card.id as any)}
                className="bg-off-black border border-dark-gray rounded-md p-6 hover:border-lime transition cursor-pointer"
              >
                <p className="font-display text-2xl tracking-widest text-white">
                  {card.t}
                </p>
                <p className="text-sm text-light-gray mt-2">{card.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-3">
            <Link to="/shop">
              <MSButton variant="outline">Continue Shopping</MSButton>
            </Link>
            <MSButton variant="dark" onClick={logout}>
              Logout
            </MSButton>
          </div>
        </>
      ) : activeTab === "orders" ? (
        <div>
          <h2 className="font-display text-4xl tracking-tight mb-2">MY ORDERS</h2>
          <p className="text-sm text-light-gray mb-8">View order receipts and tracking codes</p>

          {loadingOrders ? (
            <div className="text-mid-gray animate-pulse font-display">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-off-black border border-dark-gray rounded-md p-8 text-center">
              <p className="text-sm text-light-gray mb-4">You have not placed any orders yet.</p>
              <Link to="/shop">
                <MSButton size="sm">Explore Drops</MSButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="bg-off-black border border-dark-gray rounded-md p-6 space-y-4"
                >
                  <div className="flex justify-between items-start border-b border-dark-gray pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-light-gray">
                        Order Number
                      </p>
                      <p className="font-mono text-sm font-bold text-white mt-0.5">
                        {o.order_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-light-gray">Total</p>
                      <p className="font-display text-lg text-lime mt-0.5">
                        {formatINR(parseFloat(o.total))}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-white pt-2">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-light-gray mb-1">
                        Shipping Address
                      </p>
                      <p>{o.address?.full_name}</p>
                      <p className="text-xs text-light-gray">{o.address?.line1}, {o.address?.city}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-light-gray mb-1">
                        Status / Details
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-charcoal capitalize">
                          {o.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-sm bg-charcoal capitalize">
                          Payment: {o.payment_status}
                        </span>
                      </div>
                      {o.tracking_number && (
                        <p className="mt-2 text-xs text-light-gray">
                          Tracking: <span className="font-mono text-white">{o.tracking_number}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "profile" ? (
        <div className="max-w-md bg-off-black border border-dark-gray rounded-md p-8">
          <div>
            <p className="font-display tracking-[0.3em] text-xs text-lime">MANSEEK</p>
            <h2 className="font-display text-3xl tracking-tight mt-1 mb-6">EDIT PROFILE</h2>
          </div>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-11 px-4 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                Email Address (Permanent)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full h-11 px-4 bg-charcoal/50 border border-dark-gray rounded-sm text-mid-gray cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Enter phone number"
                className="w-full h-11 px-4 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none"
              />
            </div>

            <MSButton type="submit" className="w-full pt-2">
              Save Profile Details
            </MSButton>
          </form>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-4xl tracking-tight">SHIPPING ADDRESSES</h2>
            <MSButton size="sm" onClick={() => setShowAddressForm(true)}>
              + Add Address
            </MSButton>
          </div>

          {showAddressForm && (
            <form
              onSubmit={handleAddAddress}
              className="bg-off-black border border-dark-gray rounded-md p-6 mb-6 space-y-4 max-w-lg"
            >
              <p className="font-display text-lg tracking-widest text-lime">NEW SHIPPING ADDRESS</p>

              <div>
                <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                  Line 1
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Street address, P.O. box, company name"
                  className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                  Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Apartment, suite, unit, building, floor"
                  className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Mumbai"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="400001"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <MSButton
                  type="button"
                  variant="outline"
                  className="w-1/2"
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </MSButton>
                <MSButton type="submit" className="w-1/2">
                  Save Address
                </MSButton>
              </div>
            </form>
          )}

          {(!user.addresses || user.addresses.length === 0) ? (
            <p className="text-sm text-mid-gray py-4">No saved addresses found. Add one above.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {user.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-off-black border border-dark-gray rounded-md p-6 relative hover:border-lime transition"
                >
                  <p className="font-display text-lg tracking-widest text-white mb-2 uppercase">
                    {addr.is_default ? "Default Address" : "Shipping Address"}
                  </p>
                  <p className="text-sm text-white">{addr.full_name}</p>
                  <p className="text-sm text-light-gray mt-1">
                    {addr.line1}, {addr.line2 && addr.line2 + ","} {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-sm text-light-gray mt-1">Phone: {addr.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
