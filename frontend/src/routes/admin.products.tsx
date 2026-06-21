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
  const [stockEditProduct, setStockEditProduct] = useState<any | null>(null);
  const [editSizeStock, setEditSizeStock] = useState<Record<string, number>>({});
  const [stockNote, setStockNote] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [highPrice, setHighPrice] = useState("");
  const [lowPrice, setLowPrice] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Per-size stock: { S: 10, M: 5, L: 0, XL: 3 }
  const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
  const [sizeStock, setSizeStock] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0 });
  const [newSizeLabel, setNewSizeLabel] = useState("");

  // Tags feature state and handlers
  const PRESET_TAGS = ["New Drop", "Trending", "Best Seller", "Limited Edition", "Oversized", "Heavyweight"];
  const [tags, setTags] = useState<string[]>([]);
  const [newTagLabel, setNewTagLabel] = useState("");

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags((prev) => [...prev, clean]);
    }
    setNewTagLabel("");
  };

  // Edit tags state and handlers
  const [tagsEditProduct, setTagsEditProduct] = useState<any | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editNewTagLabel, setEditNewTagLabel] = useState("");

  const openTagsEdit = (product: any) => {
    setEditTags(product.tags || []);
    setEditNewTagLabel("");
    setTagsEditProduct(product);
  };

  const toggleEditTag = (tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addEditCustomTag = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    if (!editTags.includes(clean)) {
      setEditTags((prev) => [...prev, clean]);
    }
    setEditNewTagLabel("");
  };

  const handleSaveTags = async () => {
    if (!tagsEditProduct) return;
    try {
      toast.loading("Updating tags...", { id: "edit-tags" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/products/${tagsEditProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tags: editTags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tags");
      toast.success(`Tags updated for ${tagsEditProduct.name}!`, { id: "edit-tags" });
      setTagsEditProduct(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "edit-tags" });
    }
  };

  const setSizeQty = (size: string, qty: number) => {
    setSizeStock((prev) => ({ ...prev, [size]: Math.max(0, qty) }));
  };

  const addSize = (size: string) => {
    const label = size.trim().toUpperCase();
    if (!label) return;
    setSizeStock((prev) => ({ ...prev, [label]: prev[label] ?? 0 }));
    setNewSizeLabel("");
  };

  const removeSize = (size: string) => {
    setSizeStock((prev) => {
      const copy = { ...prev };
      delete copy[size];
      return copy;
    });
  };

  const totalSizeStock = Object.values(sizeStock).reduce((a, b) => a + b, 0);

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

  const openStockEdit = (product: any) => {
    const current: Record<string, number> =
      product.size_stock && Object.keys(product.size_stock).length > 0
        ? { ...product.size_stock }
        : Object.fromEntries((product.sizes || []).map((s: string) => [s, product.stock || 0]));
    setEditSizeStock(current);
    setStockNote("");
    setStockEditProduct(product);
  };

  const handleSaveStock = async () => {
    if (!stockEditProduct) return;
    try {
      toast.loading("Updating stock...", { id: "edit-stock" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/products/${stockEditProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ size_stock: editSizeStock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stock");
      toast.success(`Stock updated for ${stockEditProduct.name}!`, { id: "edit-stock" });
      setStockEditProduct(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "edit-stock" });
    }
  };

  const handleImageFilesChange = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    setImageFiles((prev) => {
      const combined = [...prev, ...arr];
      return combined.slice(0, 5); // max 5 images
    });
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (imageFiles.length === 0) {
      toast.error("Please add at least one product image");
      return;
    }
    if (Object.keys(sizeStock).length === 0) {
      toast.error("Add at least one size");
      return;
    }

    try {
      toast.loading(`Creating product and uploading ${imageFiles.length} image(s)...`, { id: "add-product" });
      
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("description", description);
      formData.append("category_id", categoryId);
      formData.append("base_price", highPrice);
      formData.append("sale_price", lowPrice);
      formData.append("size_stock", JSON.stringify(sizeStock));
      formData.append("colors", JSON.stringify([{ name: colorName, hex: colorHex }]));
      formData.append("tags", JSON.stringify(tags));
      
      for (const file of imageFiles) {
        formData.append("images", file);
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

      toast.success(`Product created with ${imageFiles.length} image(s) uploaded!`, { id: "add-product" });
      setShowModal(false);
      
      // Reset form
      setName("");
      setSlug("");
      setDescription("");
      setHighPrice("");
      setLowPrice("");
      setSizeStock({ S: 0, M: 0, L: 0, XL: 0 });
      setTags([]);
      setColorName("Black");
      setColorHex("#000000");
      setImageFiles([]);

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
                    <td>
                      <div className="flex flex-col">
                        <span className="text-lime font-bold">{formatINR(parseFloat(p.sale_price || p.base_price))}</span>
                        {p.sale_price && (
                          <span className="text-xs text-mid-gray line-through">{formatINR(parseFloat(p.base_price))}</span>
                        )}
                      </div>
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(p.size_stock || {}).length > 0
                          ? Object.entries(p.size_stock as Record<string,number>).map(([size, qty]) => (
                            <button
                              key={size}
                              onClick={() => toggleSize(p, size)}
                              title={`${size}: ${qty} units — click to toggle`}
                              className={`flex flex-col items-center px-1.5 py-0.5 rounded-sm border text-[9px] font-bold transition-all ${
                                Number(qty) > 0
                                  ? "bg-lime/20 border-lime text-lime hover:bg-lime/30"
                                  : "bg-charcoal/50 border-dark-gray text-mid-gray opacity-40 hover:opacity-80"
                              }`}
                            >
                              <span>{size}</span>
                              <span className="font-mono">{qty}</span>
                            </button>
                          ))
                          : (p.sizes || []).map((size: string) => (
                            <button
                              key={size}
                              onClick={() => toggleSize(p, size)}
                              className="h-6 w-6 text-[10px] font-bold rounded-sm border bg-lime/20 border-lime text-lime hover:bg-lime/30 transition-all"
                            >
                              {size}
                            </button>
                          ))
                        }
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
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openStockEdit(p)}
                          className="text-xs uppercase tracking-widest text-lime hover:underline font-bold font-display"
                        >
                          Edit Stock
                        </button>
                        <button
                          onClick={() => openTagsEdit(p)}
                          className="text-xs uppercase tracking-widest text-lime hover:underline font-bold font-display"
                        >
                          Edit Tags
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          className="text-xs uppercase tracking-widest text-danger hover:underline hover:text-red-400 font-bold font-display"
                        >
                          Delete
                        </button>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 py-8">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    High Price (MRP ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={highPrice}
                    onChange={(e) => setHighPrice(e.target.value)}
                    placeholder="2000"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                    Low Price (Selling Price ₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={lowPrice}
                    onChange={(e) => setLowPrice(e.target.value)}
                    placeholder="800"
                    className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm"
                  />
                </div>
              </div>

              {highPrice && lowPrice && (
                <div className="text-xs text-lime font-bold tracking-wider bg-lime/10 px-3 py-1.5 rounded-sm border border-lime/30 w-fit">
                  Calculated Discount: {Math.round((1 - parseFloat(lowPrice) / parseFloat(highPrice)) * 100)}% OFF
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
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

              {/* ── Per-size stock builder ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-light-gray uppercase tracking-widest">
                    Sizes &amp; Stock
                  </label>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-sm bg-charcoal border border-dark-gray text-mid-gray">
                    Total: <span className="text-lime">{totalSizeStock}</span> units
                  </span>
                </div>

                {/* Preset size chips to quickly add */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRESET_SIZES.map((s) => {
                    const active = s in sizeStock;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => active ? removeSize(s) : addSize(s)}
                        className={`h-7 px-2.5 text-xs font-bold rounded-sm border transition-all ${
                          active
                            ? "bg-lime/20 border-lime text-lime"
                            : "bg-charcoal border-dark-gray text-mid-gray hover:border-white hover:text-white"
                        }`}
                      >
                        {active ? "✓ " : "+ "}{s}
                      </button>
                    );
                  })}
                </div>

                {/* Size rows with qty controls */}
                {Object.keys(sizeStock).length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {Object.entries(sizeStock).map(([size, qty]) => (
                      <div key={size} className="flex items-center gap-2 bg-charcoal/50 border border-dark-gray rounded-sm px-3 py-2">
                        <span className="font-display text-sm text-white w-8">{size}</span>
                        <div className="flex items-center border border-dark-gray rounded-sm ml-auto">
                          <button
                            type="button"
                            onClick={() => setSizeQty(size, qty - 1)}
                            className="h-7 w-7 grid place-items-center text-light-gray hover:text-lime text-lg leading-none"
                          >−</button>
                          <input
                            type="number"
                            min={0}
                            value={qty}
                            onChange={(e) => setSizeQty(size, parseInt(e.target.value) || 0)}
                            className="w-14 text-center bg-transparent text-white text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setSizeQty(size, qty + 1)}
                            className="h-7 w-7 grid place-items-center text-light-gray hover:text-lime text-lg leading-none"
                          >+</button>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ml-2 w-16 text-right ${qty > 0 ? "text-lime" : "text-danger"}`}>
                          {qty > 0 ? "In Stock" : "Sold Out"}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSize(size)}
                          className="ml-1 text-mid-gray hover:text-danger text-xs"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-mid-gray mb-3">Select at least one size above.</p>
                )}

                {/* Add custom size */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSizeLabel}
                    onChange={(e) => setNewSizeLabel(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(newSizeLabel); }}}
                    placeholder="Custom size (e.g. 2XL, 3XL…)"
                    className="flex-1 h-9 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addSize(newSizeLabel)}
                    className="h-9 px-3 bg-charcoal border border-dark-gray hover:border-lime text-xs text-light-gray hover:text-lime rounded-sm transition-colors"
                  >Add</button>
                </div>
              </div>

              {/* Tags Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-light-gray uppercase tracking-widest font-bold">
                    Tags
                  </label>
                  <span className="text-[10px] text-mid-gray">
                    Select presets or add custom tags
                  </span>
                </div>

                {/* Preset tags chips */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_TAGS.map((tag) => {
                    const active = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`h-7 px-2.5 text-xs font-bold rounded-sm border transition-all ${
                          active
                            ? "bg-lime/20 border-lime text-lime font-bold"
                            : "bg-charcoal border-dark-gray text-mid-gray hover:border-white hover:text-white"
                        }`}
                      >
                        {active ? "✓ " : "+ "}{tag}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Custom Tags (if any) */}
                {tags.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags
                      .filter((t) => !PRESET_TAGS.includes(t))
                      .map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-bold rounded-sm border bg-lime/10 border-lime/30 text-lime"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className="text-mid-gray hover:text-danger ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                {/* Custom tag input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTag(newTagLabel);
                      }
                    }}
                    placeholder="Custom tag (e.g. Winter Wear, Graphic…)"
                    className="flex-1 h-9 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addCustomTag(newTagLabel)}
                    className="h-9 px-3 bg-charcoal border border-dark-gray hover:border-lime text-xs text-light-gray hover:text-lime rounded-sm transition-colors font-bold"
                  >
                    Add Tag
                  </button>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-light-gray uppercase tracking-widest">
                    Product Images
                  </label>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                    imageFiles.length >= 5 ? "bg-lime/20 text-lime border border-lime/40" : "bg-charcoal text-mid-gray border border-dark-gray"
                  }`}>
                    {imageFiles.length} / 5
                  </span>
                </div>

                {/* Thumbnails */}
                {imageFiles.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {imageFiles.map((file, idx) => {
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`preview-${idx}`}
                            className="h-14 w-full object-cover rounded-sm border border-dark-gray group-hover:border-lime/50 transition-colors"
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold uppercase tracking-widest bg-lime/90 text-black py-0.5 rounded-b-sm">
                              Primary
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImageFile(idx)}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-danger text-white rounded-full text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* File input — hidden when 5 reached */}
                {imageFiles.length < 5 ? (
                  <label className="flex items-center justify-center gap-2 h-10 w-full bg-charcoal border border-dashed border-dark-gray hover:border-lime/60 rounded-sm cursor-pointer transition-colors group">
                    <span className="text-xs text-mid-gray group-hover:text-lime transition-colors">
                      {imageFiles.length === 0 ? "📎 Click to add images (up to 5)" : "＋ Add more images"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageFilesChange(e.target.files)}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-center h-10 w-full bg-lime/5 border border-lime/30 rounded-sm">
                    <span className="text-xs text-lime font-bold tracking-wider">✓ Maximum 5 images reached</span>
                  </div>
                )}
                <p className="text-[10px] text-mid-gray mt-1">First image is used as the cover. Drag the files in preferred order before uploading.</p>
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

      {/* STOCK EDIT MODAL */}
      {stockEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-off-black border border-dark-gray rounded-md p-8 space-y-5 relative shadow-2xl">
            <button
              onClick={() => setStockEditProduct(null)}
              className="absolute top-4 right-4 text-light-gray hover:text-white font-bold"
            >
              ✕
            </button>
            <div>
              <p className="font-display tracking-[0.3em] text-xs text-lime">MANSEEK ADMIN</p>
              <h2 className="font-display text-xl tracking-tight mt-1 text-white">EDIT STOCK</h2>
              <p className="text-xs text-mid-gray mt-1 truncate">{stockEditProduct.name}</p>
            </div>

            {/* Offline sale banner */}
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-sm px-3 py-2.5">
              <span className="text-amber-400 text-sm mt-0.5">⚠</span>
              <p className="text-[11px] text-amber-300 leading-relaxed">
                Use this to manually adjust stock after an <span className="font-bold">offline sale</span> or inventory correction. Online orders update automatically.
              </p>
            </div>

            {/* Per-size qty controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-light-gray uppercase tracking-widest">Size Quantities</p>
                <span className="text-xs font-mono text-mid-gray">
                  Total: <span className="text-lime font-bold">{Object.values(editSizeStock).reduce((a, b) => a + Number(b), 0)}</span>
                </span>
              </div>
              {Object.entries(editSizeStock).map(([size, qty]) => (
                <div key={size} className="flex items-center gap-3 bg-charcoal/50 border border-dark-gray rounded-sm px-3 py-2">
                  <span className="font-display text-sm text-white w-8">{size}</span>
                  <div className="flex items-center border border-dark-gray rounded-sm ml-auto">
                    <button
                      type="button"
                      onClick={() => setEditSizeStock(prev => ({ ...prev, [size]: Math.max(0, Number(prev[size]) - 1) }))}
                      className="h-8 w-8 grid place-items-center text-light-gray hover:text-lime text-xl leading-none"
                    >−</button>
                    <input
                      type="number"
                      min={0}
                      value={qty}
                      onChange={(e) => setEditSizeStock(prev => ({ ...prev, [size]: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-14 text-center bg-transparent text-white text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditSizeStock(prev => ({ ...prev, [size]: Number(prev[size]) + 1 }))}
                      className="h-8 w-8 grid place-items-center text-light-gray hover:text-lime text-xl leading-none"
                    >+</button>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest w-16 text-right ${
                    Number(qty) > 0 ? "text-lime" : "text-danger"
                  }`}>
                    {Number(qty) > 0 ? "In Stock" : "Sold Out"}
                  </span>
                </div>
              ))}
            </div>

            {/* Optional note */}
            <div>
              <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">Note (optional)</label>
              <input
                type="text"
                value={stockNote}
                onChange={(e) => setStockNote(e.target.value)}
                placeholder="e.g. 2 sold offline at Koramangala pop-up"
                className="w-full h-9 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-xs"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <MSButton
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={() => setStockEditProduct(null)}
              >
                Cancel
              </MSButton>
              <MSButton className="w-1/2" onClick={handleSaveStock}>
                Save Stock
              </MSButton>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TAGS MODAL */}
      {tagsEditProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-off-black border border-dark-gray rounded-md p-8 space-y-5 relative shadow-2xl">
            <button
              onClick={() => setTagsEditProduct(null)}
              className="absolute top-4 right-4 text-light-gray hover:text-white font-bold"
            >
              ✕
            </button>
            <div>
              <p className="font-display tracking-[0.3em] text-xs text-lime">MANSEEK ADMIN</p>
              <h2 className="font-display text-xl tracking-tight mt-1 text-white">EDIT TAGS</h2>
              <p className="text-xs text-mid-gray mt-1 truncate">{tagsEditProduct.name}</p>
            </div>

            <div className="space-y-4">
              {/* Preset tags selection */}
              <div>
                <p className="text-xs text-light-gray uppercase tracking-widest mb-2 font-bold">Preset Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TAGS.map((tag) => {
                    const active = editTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleEditTag(tag)}
                        className={`h-7 px-2.5 text-xs font-bold rounded-sm border transition-all ${
                          active
                            ? "bg-lime/20 border-lime text-lime font-bold"
                            : "bg-charcoal border-dark-gray text-mid-gray hover:border-white hover:text-white"
                        }`}
                      >
                        {active ? "✓ " : "+ "}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected custom tags */}
              {editTags.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
                <div>
                  <p className="text-xs text-light-gray uppercase tracking-widest mb-2 font-bold">Custom Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {editTags
                      .filter((t) => !PRESET_TAGS.includes(t))
                      .map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-bold rounded-sm border bg-lime/10 border-lime/30 text-lime"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => toggleEditTag(tag)}
                            className="text-mid-gray hover:text-danger ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Add custom tag input */}
              <div className="space-y-1">
                <label className="text-xs text-light-gray uppercase tracking-widest block font-bold">Add Custom Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editNewTagLabel}
                    onChange={(e) => setEditNewTagLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEditCustomTag(editNewTagLabel);
                      }
                    }}
                    placeholder="Custom tag (e.g. Winter Wear, Graphic…)"
                    className="flex-1 h-9 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => addEditCustomTag(editNewTagLabel)}
                    className="h-9 px-3 bg-charcoal border border-dark-gray hover:border-lime text-xs text-light-gray hover:text-lime rounded-sm transition-colors font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <MSButton
                type="button"
                variant="outline"
                className="w-1/2"
                onClick={() => setTagsEditProduct(null)}
              >
                Cancel
              </MSButton>
              <MSButton className="w-1/2" onClick={handleSaveTags}>
                Save Tags
              </MSButton>
            </div>
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
