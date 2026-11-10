import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Sliders, Ruler, Check } from "lucide-react";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/attributes")({
  component: AdminAttributes,
});

function AdminAttributes() {
  const token = useAuth((s) => s.token);
  const [tab, setTab] = useState<"size_groups" | "attributes">("size_groups");
  const [sizeGroups, setSizeGroups] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Size Group Modal
  const [showSGModal, setShowSGModal] = useState(false);
  const [sgName, setSgName] = useState("");
  const [sgCode, setSgCode] = useState("");
  const [sgDescription, setSgDescription] = useState("");

  // Add Size Form
  const [selectedSG, setSelectedSG] = useState<any | null>(null);
  const [newSizeName, setNewSizeName] = useState("");
  const [newSizeCode, setNewSizeCode] = useState("");

  // Attribute Modal
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [attrName, setAttrName] = useState("");
  const [attrCode, setAttrCode] = useState("");
  const [attrType, setAttrType] = useState("select");

  // Add Option Form
  const [selectedAttr, setSelectedAttr] = useState<any | null>(null);
  const [newOptLabel, setNewOptLabel] = useState("");
  const [newOptValue, setNewOptValue] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [sgRes, attrRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/size-groups`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/attributes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (sgRes.ok) setSizeGroups(await sgRes.json());
      if (attrRes.ok) setAttributes(await attrRes.json());
    } catch (err: any) {
      toast.error("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleCreateSizeGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sgName.trim() || !sgCode.trim()) return;

    try {
      toast.loading("Creating size group...", { id: "sg" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/size-groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: sgName, code: sgCode, description: sgDescription }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");

      toast.success("Size group created!", { id: "sg" });
      setShowSGModal(false);
      setSgName("");
      setSgCode("");
      setSgDescription("");
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "sg" });
    }
  };

  const handleAddSize = async (groupId: string) => {
    if (!newSizeCode.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/sizes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          size_group_id: groupId,
          name: newSizeName || newSizeCode,
          code: newSizeCode,
          sort_order: 10,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Size added!");
      setNewSizeName("");
      setNewSizeCode("");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteSize = async (sizeId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/sizes/${sizeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Size removed");
        loadData();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName.trim() || !attrCode.trim()) return;

    try {
      toast.loading("Creating attribute...", { id: "attr" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/attributes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: attrName, code: attrCode, type: attrType }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");

      toast.success("Attribute created!", { id: "attr" });
      setShowAttrModal(false);
      setAttrName("");
      setAttrCode("");
      loadData();
    } catch (err: any) {
      toast.error(err.message, { id: "attr" });
    }
  };

  const handleAddOption = async (attrId: string) => {
    if (!newOptLabel.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/attributes/options`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attribute_id: attrId,
          label: newOptLabel,
          value: newOptValue || newOptLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Option added!");
      setNewOptLabel("");
      setNewOptValue("");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteOption = async (optId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/attributes/options/${optId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Option removed");
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
          <h1 className="font-display text-4xl tracking-tight text-white">ATTRIBUTES & SIZING</h1>
          <p className="text-sm text-light-gray mt-1">
            Define dynamic size groups (Tops, Waist Pants, Footwear) and specifications (Fit, Fabric, Collar).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("size_groups")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              tab === "size_groups" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            SIZE GROUPS
          </button>
          <button
            onClick={() => setTab("attributes")}
            className={`px-4 py-2 rounded-sm text-xs font-display tracking-widest transition-all ${
              tab === "attributes" ? "bg-lime text-black font-bold" : "bg-off-black text-light-gray hover:text-white"
            }`}
          >
            ATTRIBUTES
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-display text-light-gray animate-pulse">
          Loading configurations...
        </div>
      ) : tab === "size_groups" ? (
        <div className="mt-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-xl text-white">CONFIGURED SIZE GROUPS</h2>
            <MSButton onClick={() => setShowSGModal(true)} size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New Size Group
            </MSButton>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {sizeGroups.map((sg) => (
              <div key={sg.id} className="bg-off-black border border-dark-gray rounded-md p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-lg text-white">{sg.name}</h3>
                      <p className="font-mono text-xs text-lime">{sg.code}</p>
                    </div>
                    <span className="text-xs bg-charcoal text-light-gray px-2 py-0.5 rounded">
                      {sg.sizes?.length || 0} sizes
                    </span>
                  </div>
                  {sg.description && <p className="text-xs text-light-gray mt-2">{sg.description}</p>}

                  {/* Size chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sg.sizes?.map((s: any) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-charcoal border border-dark-gray text-xs font-mono text-white group"
                      >
                        <span>{s.code}</span>
                        <button
                          onClick={() => handleDeleteSize(s.id)}
                          className="text-mid-gray hover:text-danger"
                          title="Remove size"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Add size */}
                <div className="mt-6 pt-4 border-t border-dark-gray/30 flex gap-2">
                  <input
                    type="text"
                    placeholder="Code (e.g. 34 or XXL)"
                    value={selectedSG?.id === sg.id ? newSizeCode : ""}
                    onFocus={() => setSelectedSG(sg)}
                    onChange={(e) => setNewSizeCode(e.target.value.toUpperCase())}
                    className="bg-charcoal border border-dark-gray rounded px-2.5 py-1 text-xs text-white flex-1 focus:outline-none focus:border-lime font-mono"
                  />
                  <MSButton size="sm" onClick={() => handleAddSize(sg.id)}>
                    Add
                  </MSButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-xl text-white">CONFIGURED ATTRIBUTES & OPTIONS</h2>
            <MSButton onClick={() => setShowAttrModal(true)} size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New Attribute
            </MSButton>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {attributes.map((attr) => (
              <div key={attr.id} className="bg-off-black border border-dark-gray rounded-md p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-lg text-white">{attr.name}</h3>
                      <p className="font-mono text-xs text-lime">{attr.code}</p>
                    </div>
                    <span className="text-xs bg-charcoal text-light-gray px-2 py-0.5 rounded capitalize">
                      {attr.type}
                    </span>
                  </div>

                  {/* Options chips */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {attr.attribute_options?.map((opt: any) => (
                      <span
                        key={opt.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-charcoal border border-dark-gray text-xs text-white"
                      >
                        <span>{opt.label}</span>
                        <button
                          onClick={() => handleDeleteOption(opt.id)}
                          className="text-mid-gray hover:text-danger"
                          title="Remove option"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Add Option */}
                <div className="mt-6 pt-4 border-t border-dark-gray/30 flex gap-2">
                  <input
                    type="text"
                    placeholder="Option (e.g. Oversized, 280 GSM)"
                    value={selectedAttr?.id === attr.id ? newOptLabel : ""}
                    onFocus={() => setSelectedAttr(attr)}
                    onChange={(e) => setNewOptLabel(e.target.value)}
                    className="bg-charcoal border border-dark-gray rounded px-2.5 py-1 text-xs text-white flex-1 focus:outline-none focus:border-lime"
                  />
                  <MSButton size="sm" onClick={() => handleAddOption(attr.id)}>
                    Add
                  </MSButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: New Size Group */}
      {showSGModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-off-black border border-dark-gray rounded-md max-w-md w-full p-6 animate-in fade-in">
            <h2 className="font-display text-2xl text-white mb-4">NEW SIZE GROUP</h2>
            <form onSubmit={handleCreateSizeGroup} className="space-y-4">
              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Footwear (UK), Kids Apparel"
                  value={sgName}
                  onChange={(e) => {
                    setSgName(e.target.value);
                    setSgCode(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
                  }}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-lime"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Group Code *</label>
                <input
                  type="text"
                  required
                  value={sgCode}
                  onChange={(e) => setSgCode(e.target.value)}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-lime font-mono"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={sgDescription}
                  onChange={(e) => setSgDescription(e.target.value)}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-lime"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <MSButton variant="ghost" type="button" onClick={() => setShowSGModal(false)}>Cancel</MSButton>
                <MSButton type="submit">Create Size Group</MSButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Attribute */}
      {showAttrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-off-black border border-dark-gray rounded-md max-w-md w-full p-6 animate-in fade-in">
            <h2 className="font-display text-2xl text-white mb-4">NEW ATTRIBUTE</h2>
            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Attribute Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Material, Sleeve Style, Fit"
                  value={attrName}
                  onChange={(e) => {
                    setAttrName(e.target.value);
                    setAttrCode(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
                  }}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-lime"
                />
              </div>
              <div>
                <label className="text-xs uppercase text-light-gray block mb-1">Attribute Code *</label>
                <input
                  type="text"
                  required
                  value={attrCode}
                  onChange={(e) => setAttrCode(e.target.value)}
                  className="w-full bg-charcoal border border-dark-gray rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-lime font-mono"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <MSButton variant="ghost" type="button" onClick={() => setShowAttrModal(false)}>Cancel</MSButton>
                <MSButton type="submit">Create Attribute</MSButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

