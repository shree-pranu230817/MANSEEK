import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Check } from "lucide-react";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const token = useAuth((s) => s.token);
  const [categories, setCategories] = useState<any[]>([]);
  const [sizeGroups, setSizeGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [parentId, setParentId] = useState("");
  const [assignedSizeGroupId, setAssignedSizeGroupId] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isFeaturedHome, setIsFeaturedHome] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [catRes, sgRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/size-groups`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      if (sgRes.ok) {
        const sgData = await sgRes.json();
        setSizeGroups(sgData);
      }
    } catch (err: any) {
      toast.error("Failed to load categories: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setSortOrder(categories.length + 1);
    setParentId("");
    setAssignedSizeGroupId("");
    setIsVisible(true);
    setIsFeaturedHome(true);
    setImageFile(null);
    setExistingImageUrl("");
    setShowModal(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || "");
    setSlug(cat.slug || "");
    setDescription(cat.description || "");
    setSortOrder(cat.sort_order || 0);
    setParentId(cat.parent_id || "");
    setAssignedSizeGroupId(cat.assigned_size_group_id || "");
    setIsVisible(cat.is_visible !== false);
    setIsFeaturedHome(cat.is_featured_home !== false);
    setImageFile(null);
    setExistingImageUrl(cat.image_url || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const url = editingCategory
        ? `${import.meta.env.VITE_API_URL}/admin/categories/${editingCategory.id}`
        : `${import.meta.env.VITE_API_URL}/admin/categories`;

      const method = editingCategory ? "PUT" : "POST";
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      formData.append("description", description);
      formData.append("sort_order", String(sortOrder));
      formData.append("is_visible", String(isVisible));
      formData.append("is_featured_home", String(isFeaturedHome));
      if (parentId) formData.append("parent_id", parentId);
      if (assignedSizeGroupId) formData.append("assigned_size_group_id", assignedSizeGroupId);
      if (imageFile) formData.append("image", imageFile);
      else if (existingImageUrl) formData.append("image_url", existingImageUrl);

      toast.loading(editingCategory ? "Updating category..." : "Creating category...", { id: "cat-save" });
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Operation failed");

      toast.success(editingCategory ? "Category updated!" : "Category created!", { id: "cat-save" });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "cat-save" });
    }
  };

  const handleToggleVisible = async (cat: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_visible: !cat.is_visible }),
      });
      if (res.ok) {
        toast.success(`Category ${!cat.is_visible ? "visible" : "hidden"}`);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleFeaturedHome = async (cat: any) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_featured_home: !cat.is_featured_home }),
      });
      if (res.ok) {
        toast.success(`Homepage display updated`);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-dark-gray/40 gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-white">CATEGORY MANAGEMENT</h1>
          <p className="text-sm text-light-gray mt-1">
            Configure dynamic categories (Pants, Shirts, Accessories, etc.), assign size groups, and control homepage display.
          </p>
        </div>
        <MSButton onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </MSButton>
      </div>

      {loading ? (
        <div className="py-20 text-center font-display text-light-gray animate-pulse">
          Loading categories...
        </div>
      ) : (
        <div className="mt-8 bg-off-black border border-dark-gray rounded-md overflow-hidden">
          <table className="w-full text-sm text-white">
            <thead className="text-light-gray text-left text-xs uppercase tracking-widest bg-charcoal">
              <tr>
                <th className="p-4">Sort</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Assigned Sizing</th>
                <th>Storefront</th>
                <th>Home Featured</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-gray/30">
              {categories.map((c) => {
                const sizeGroup = sizeGroups.find((sg) => sg.id === c.assigned_size_group_id);
                return (
                  <tr key={c.id} className="hover:bg-charcoal/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-lime">{c.sort_order}</td>
                    <td className="font-semibold text-white flex items-center gap-3 py-3">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="h-10 w-10 object-cover rounded bg-charcoal border border-dark-gray" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-charcoal border border-dark-gray flex items-center justify-center text-xs text-mid-gray">
                          No img
                        </div>
                      )}
                      <div>
                        <p>{c.name}</p>
                        {c.description && <p className="text-xs text-light-gray font-normal truncate max-w-xs">{c.description}</p>}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-light-gray">{c.slug}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs bg-charcoal text-lime font-mono">
                        {c.product_count || 0}
                      </span>
                    </td>
                    <td className="text-xs text-light-gray">
                      {sizeGroup ? (
                        <span className="text-lime">{sizeGroup.name}</span>
                      ) : (
                        <span className="text-mid-gray italic">Default / None</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleVisible(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                          c.is_visible !== false
                            ? "bg-lime/10 text-lime border border-lime/30"
                            : "bg-danger/10 text-danger border border-danger/30"
                        }`}
                      >
                        {c.is_visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {c.is_visible !== false ? "Visible" : "Hidden"}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleFeaturedHome(c)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                          c.is_featured_home !== false
                            ? "bg-amber-400/10 text-amber-400 border border-amber-400/30"
                            : "bg-charcoal text-mid-gray"
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        {c.is_featured_home !== false ? "Featured" : "No"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 hover:text-lime hover:bg-charcoal rounded text-light-gray transition-colors"
                        title="Edit category"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-off-black border border-dark-gray rounded-md max-w-lg w-full p-6 animate-in fade-in duration-150">
            <h2 className="font-display text-2xl text-white mb-4">
              {editingCategory ? `EDIT CATEGORY: ${editingCategory.name}` : "ADD NEW CATEGORY"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-light-gray block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  placeholder="e.g. Pants, Shirts, Accessories, Footwear"
                  className="w-full bg-charcoal border border-dark-gray rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-light-gray block mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-charcoal border border-dark-gray rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-lime font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-light-gray block mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full bg-charcoal border border-dark-gray rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-lime font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-light-gray block mb-1">Assigned Sizing Group</label>
                <select
                  value={assignedSizeGroupId}
                  onChange={(e) => setAssignedSizeGroupId(e.target.value)}
                  className="w-full bg-charcoal border border-dark-gray rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-lime"
                >
                  <option value="">None / Custom</option>
                  {sizeGroups.map((sg) => (
                    <option key={sg.id} value={sg.id}>
                      {sg.name} ({sg.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-light-gray block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-charcoal border border-dark-gray rounded-sm px-3 py-2 text-sm text-white focus:outline-none focus:border-lime"
                  placeholder="Streetwear collection description..."
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-light-gray block mb-1">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-light-gray file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-charcoal file:text-white hover:file:bg-charcoal/80"
                />
                {existingImageUrl && !imageFile && (
                  <p className="text-[10px] text-lime mt-1 truncate">Current: {existingImageUrl}</p>
                )}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs text-light-gray cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="accent-lime"
                  />
                  Visible in Shop
                </label>
                <label className="flex items-center gap-2 text-xs text-light-gray cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeaturedHome}
                    onChange={(e) => setIsFeaturedHome(e.target.checked)}
                    className="accent-lime"
                  />
                  Feature on Homepage ("Shop by Vibe")
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-dark-gray/40">
                <MSButton variant="ghost" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </MSButton>
                <MSButton type="submit">
                  {editingCategory ? "Save Changes" : "Create Category"}
                </MSButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

