"use client";
import { useEffect, useState } from "react";

// === Types ===
type Gallery = { 
  id: string; 
  title: string; 
  slug: string; 
  isPublic: boolean; 
  parentId: string | null 
};

export default function MyGalleriesPage() {
  // === Gallery State ===
  const [items, setItems] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);

  // === Form State ===
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [parentSlug, setParentSlug] = useState<string>("");

  // === Data Functions ===
  async function load() {
    setLoading(true);
    const res = await fetch("/api/galleries");
    const data = await res.json();
    setItems(data);
    setLoading(false);
  }

  async function create() {
    if (!title.trim()) return alert("Titel fehlt");
    const body: any = { title: title.trim(), isPublic };
    if (slug.trim()) body.slug = slug.trim();
    if (parentSlug) body.parentSlug = parentSlug;
    
    const res = await fetch("/api/galleries", {
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) { 
      alert("Fehler beim Anlegen"); 
      return; 
    }
    
    // Reset form
    setTitle(""); 
    setSlug(""); 
    setIsPublic(false); 
    setParentSlug("");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Galerie inkl. Bilder wirklich löschen?")) return;
    await fetch(`/api/galleries/${id}`, { method: "DELETE" });
    load();
  }

  // === Effects ===
  useEffect(() => { 
    load(); 
  }, []);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Meine Galerien</h1>

      {/* Create New Gallery Form */}
      <div className="border rounded p-4 space-y-3">
        <div className="font-semibold">Neue Galerie</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Titel (Pflicht)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Slug (optional, sonst aus Titel)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <select
            className="border p-2 rounded"
            value={parentSlug}
            onChange={(e) => setParentSlug(e.target.value)}
          >
            <option value="">— ohne Parent —</option>
            {items.map(g => (
              <option key={g.id} value={g.slug}>
                {g.title} ({g.slug})
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={isPublic} 
              onChange={(e) => setIsPublic(e.target.checked)} 
            />
            Öffentlich
          </label>
        </div>
        <button 
          onClick={create} 
          className="bg-black text-white px-3 py-2 rounded"
        >
          Anlegen
        </button>
      </div>

      {/* Gallery List */}
      <div className="space-y-2">
        <div className="font-semibold">Bestehende Galerien</div>
        {loading ? (
          <div className="text-sm text-gray-500">Lade …</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">Keine Galerien vorhanden.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(g => (
              <div key={g.id} className="border rounded p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{g.title}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    g.isPublic 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {g.isPublic ? "Öffentlich" : "Privat"}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Slug: {g.slug}</div>
                {g.parentId && (
                  <div className="text-xs text-gray-600">Hat Parent</div>
                )}
                <div className="flex gap-2 pt-1">
                  <a 
                    href={`/galleries/${g.slug}`} 
                    className="px-2 py-1 border rounded text-sm"
                  >
                    Öffnen
                  </a>
                  <a 
                    href={`/galleries/${g.slug}/settings`} 
                    className="px-2 py-1 border rounded text-sm"
                  >
                    Einstellungen
                  </a>
                  <button 
                    onClick={() => remove(g.id)} 
                    className="px-2 py-1 bg-red-600 text-white rounded text-sm"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
