import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MSButton } from "@/components/ms/Button";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/marquee")({
  component: AdminMarquee,
});

function AdminMarquee() {
  const token = useAuth((s) => s.token);
  const [tags, setTags] = useState<any[]>([]);
  const [newTagText, setNewTagText] = useState("");
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  async function loadTags() {
    try {
      setLoading(true);
      setDbError(null);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/marquee`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load marquee tags");
      }
      setTags(data);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('relation "marquee_tags" does not exist') || err.message.includes('42P01')) {
        setDbError(
          "The database table 'marquee_tags' does not exist in Supabase yet. Please run the SQL migration script from database-schema.sql inside your Supabase SQL editor to create the table."
        );
      } else {
        setDbError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadTags();
    }
  }, [token]);

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagText.trim();
    if (!clean) return;

    try {
      toast.loading("Adding tag...", { id: "add-tag" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/marquee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add tag");

      toast.success("Marquee tag added successfully!", { id: "add-tag" });
      setNewTagText("");
      loadTags();
    } catch (err: any) {
      toast.error(err.message, { id: "add-tag" });
    }
  };

  const handleDeleteTag = async (id: string) => {
    try {
      toast.loading("Deleting tag...", { id: "delete-tag" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/marquee/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete tag");

      toast.success("Marquee tag deleted successfully!", { id: "delete-tag" });
      loadTags();
    } catch (err: any) {
      toast.error(err.message, { id: "delete-tag" });
    }
  };

  if (loading) {
    return <div className="text-mid-gray animate-pulse font-display">Loading marquee tags...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-white uppercase">MARQUEE TEXTS</h1>
        <p className="text-sm text-mid-gray mt-1">
          Manage the ticker messages displayed on the home page marquee bar.
        </p>
      </div>

      {dbError && (
        <div className="bg-danger/10 border border-danger/30 rounded-md p-5 text-danger space-y-3">
          <p className="font-bold text-sm">Database Setup Required</p>
          <p className="text-xs leading-relaxed opacity-90">{dbError}</p>
          <pre className="bg-black/50 p-3 rounded text-xs font-mono overflow-x-auto text-light-gray max-w-full">
{`CREATE TABLE marquee_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO marquee_tags (text) VALUES
  ('NEW ARRIVALS'),
  ('FREE SHIPPING ABOVE ₹999'),
  ('EXCLUSIVE DROPS'),
  ('BUILT IN INDIA');

ALTER TABLE marquee_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marquee_tags_public_read" ON marquee_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "marquee_tags_admin_write" ON marquee_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
          </pre>
          <MSButton size="sm" variant="outline" onClick={loadTags}>
            Retry Connection
          </MSButton>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Current list */}
        <div className="bg-off-black border border-dark-gray rounded-md overflow-hidden">
          <div className="p-4 bg-charcoal border-b border-dark-gray">
            <h2 className="font-display text-xs uppercase tracking-widest text-light-gray">
              ACTIVE TICKER ITEMS
            </h2>
          </div>
          {tags.length === 0 ? (
            <p className="text-sm text-mid-gray p-8 text-center">No marquee tags found.</p>
          ) : (
            <ul className="divide-y divide-dark-gray">
              {tags.map((t, index) => (
                <li key={t.id} className="flex items-center justify-between p-4 hover:bg-charcoal/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-mid-gray">#{index + 1}</span>
                    <span className="font-display text-sm tracking-wider font-bold text-white bg-lime/10 border border-lime/30 px-3 py-1 rounded-sm">
                      {t.text}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTag(t.id)}
                    className="text-mid-gray hover:text-danger p-2 transition-colors"
                    title="Delete tag"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add tag form */}
        <div className="bg-off-black border border-dark-gray rounded-md p-6 space-y-4">
          <div>
            <h3 className="font-display text-sm uppercase tracking-widest text-white">ADD ITEM</h3>
            <p className="text-xs text-mid-gray mt-1">Add a new message to the marquee ticker.</p>
          </div>

          <form onSubmit={handleAddTag} className="space-y-4">
            <div>
              <label className="text-xs text-light-gray uppercase tracking-widest block mb-1">
                Ticker Text
              </label>
              <input
                type="text"
                required
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                placeholder="e.g. SUMMER DROPS LIVE"
                className="w-full h-10 px-3 bg-charcoal border border-dark-gray rounded-sm text-white focus:border-lime focus:outline-none text-sm font-display tracking-wider"
              />
            </div>

            <MSButton type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </MSButton>
          </form>
        </div>
      </div>
    </div>
  );
}
