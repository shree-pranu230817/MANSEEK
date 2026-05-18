import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: AdminProducts });

function AdminProducts() {
  const token = useAuth((s) => s.token);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Custom Color states
  const [colorName, setColorName] = useState("Black");
  const [colorHex, setColorHex] = useState("#000000");

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  async function loadData() {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/products`),
        fetch(`${import.meta.env.VITE_API_URL}/categories`),
      ]);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProductsList(prodData.products);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0) setCategoryId(catData[0].id);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const toggleSize = async (product: any, size: string) => {
    const currentSizes = product.sizes || [];
    let newSizes: string[];
    
    if (currentSizes.includes(size)) {
      newSizes = currentSizes.filter((s: string) => s !== size);
    } else {
      newSizes = [...currentSizes, size];
    }

    try {
      toast.loading(`Updating ${product.name} sizes...`, { id: "update-sizes" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sizes: JSON.stringify(newSizes) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update sizes");
      }

      toast.success(`${product.name} sizes updated successfully!`, { id: "update-sizes" });
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "update-sizes" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    try {
      toast.loading("Creating product and uploading image...", { id: "add-product" });
      
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("description", description);
      formData.append("category_id", categoryId);
      formData.append("base_price", price);
      formData.append("stock", stock);
      formData.append("sizes", JSON.stringify(["S", "M", "L", "XL"]));
      formData.append("colors", JSON.stringify([{ name: colorName, hex: colorHex }]));
      
      if (imageFile) {
        formData.append("images", imageFile);
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/products`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      toast.success("Product created successfully with image uploaded to Supabase!", { id: "add-product" });
      setShowModal(false);
      
      // Reset form
      setName("");
      setSlug("");
      setDescription("");
      setPrice("");
      setStock("");
      setColorName("Black");
      setColorHex("#000000");
      setImageFile(null);

      // Reload
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "add-product" });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      toast.loading(`Deleting ${productToDelete.name}...`, { id: "delete-product" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/products/${productToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete product");
      }

      toast.success(`${productToDelete.name} deleted successfully!`, { id: "delete-product" });
      setProductToDelete(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "delete-product" });
    }
  };

  if (loading) {
    return <div className="text-mid-gray animate-pulse font-display">Loading products...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl tracking-tight text-white">PRODUCTS</h1>
        <MSButton size="sm" onClick={() => setShowModal(true)}>
          + Add Product
        </MSButton>
      </div>

      <div className="mt-8 bg-off-black border border-dark-gray rounded-md overflow-hidden">
        {productsList.length === 0 ? (
          <p className="text-sm text-mid-gray p-8 text-center">No products found.</p>
        ) : (
          <table className="w-full text-sm text-white">
            <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
              <tr>
                <th className="p-4">Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Sizes Stock</th>
                <th>Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsList.map((p) => {
                // Find category label
                const cat = categories.find((c) => c.id === p.category_id);
                return (
                  <tr key={p.id} className="border-t border-dark-gray hover:bg-charcoal/20 transition-all">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={p.images?.[0] || "/images/prod-1.jpg"}
                        alt=""
                        className="h-12 w-10 object-cover rounded-sm"
                      />
                      <span>{p.name}</span>
                    </td>
                    <td className="capitalize">{cat?.name || "Streetwear"}</td>
                    <td className="text-lime">{formatINR(parseFloat(p.base_price))}</td>
                    <td>{p.stock}</td>
                    <td>
                      <div className="flex gap-1.5">
                        {["S", "M", "L", "XL"].map((size) => {
                          const hasSize = p.sizes?.includes(size);
                          return (
                            <button
                              key={size}
                              onClick={() => toggleSize(p, size)}
                              title={hasSize ? `Mark ${size} Completed (Sold Out)` : `Mark ${size} Available (In Stock)`}
                              className={`h-6 w-6 text-[10px] font-bold rounded-sm border transition-all ${
                                hasSize
                                  ? "bg-lime/20 border-lime text-lime hover:bg-lime/30"
                                  : "bg-charcoal/50 border-dark-gray text-mid-gray line-through opacity-40 hover:opacity-80"
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`text-xs px-2 py-1 rounded-sm ${
                          p.stock > 0
                            ? "bg-success/20 text-success"
                            : "bg-danger/20 text-danger"
                        }`}
                      >
                        {p.stock > 0 ? "Live" : "Sold Out"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setProductToDelete(p)}
                        className="text-xs uppercase tracking-widest text-danger hover:underline hover:text-red-400 font-bold font-display"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* GORGEOUS MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-off-black border border-dark-gray rounded-md p-8 space-y-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-light-gray hover:text-white font-bold"
            >
              ✕
            </button>
            <div>
              <p className="font-display tracking-[0.3em] text-xs text-lime">MANSEEK</p>
              <h2 className="font-display text-2xl tracking-tight mt-1 text-white">ADD NEW PRODUCT</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Void Oversized Tee"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="void-oversized-tee"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Heavyweight 280 GSM cotton..."
                  className="w-full p-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="500"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-2 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Color Name
                  </label>
                  <input
                    type="text"
                    required
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="Void Black"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Color Hex Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="h-10 w-12 bg-charcoal border border-dark-gray rounded-sm cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      required
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      placeholder="#000000"
                      className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                  Product Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm pt-1.5"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <MSButton
                  type="button"
                  variant="outline"
                  className="w-1/2"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </MSButton>
                <MSButton type="submit" className="w-1/2">
                  Create Product
                </MSButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP MODAL FOR DELETION */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-off-black border border-danger/30 rounded-md p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setProductToDelete(null)}
              className="absolute top-4 right-4 text-light-gray hover:text-white font-bold"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <p className="font-display tracking-[0.3em] text-xs text-danger">WARNING</p>
              <h2 className="font-display text-2xl tracking-tight text-white uppercase">DELETE PRODUCT?</h2>
              <p className="text-sm text-light-gray">
                Are you sure you want to delete <span className="text-white font-bold">{productToDelete.name}</span>?
              </p>
              <p className="text-xs text-mid-gray bg-charcoal/30 p-3 border border-dark-gray/30 rounded-sm">
                This action is a soft-delete: it keeps historical orders intact in your database but removes the product from the customer storefront catalog immediately.
              </p>
            </div>
            <div className="flex gap-4 pt-2">
              <MSButton
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </MSButton>
              <button
                onClick={handleDeleteProduct}
                className="w-1/2 h-11 bg-danger/20 hover:bg-danger text-danger hover:text-white border border-danger/40 rounded-sm font-display tracking-widest text-xs uppercase transition-all duration-200"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
