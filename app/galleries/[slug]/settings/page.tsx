"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function GallerySettingsPage() {
  const { slug: currentSlug } = useParams<{ slug: string }>();
  
  // === State ===
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showIndexOverlay, setShowIndexOverlay] = useState(false);
  const [saving, setSaving] = useState(false);

  // === Data Functions ===
  async function load() {
    setLoading(true);
    const r = await fetch(`/api/galleries/by-slug/${currentSlug}`);
    const d = await r.json();
    setTitle(d.gallery?.title ?? currentSlug);
    setSlug(d.gallery?.slug ?? currentSlug);
    setIsPublic(Boolean(d.gallery?.isPublic));
    setShowIndexOverlay(Boolean(d.gallery?.showIndexOverlay));
    setLoading(false);
  }

  async function save(partial: Partial<{ title: string; isPublic: boolean; showIndexOverlay: boolean; coverKey: string | null }>) {
    setSaving(true);
    const r = await fetch(`/api/galleries/by-slug/${currentSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!r.ok) {
      alert("Speichern fehlgeschlagen");
    } else if (partial.title) {
      // If title was updated, check for slug changes and handle redirect
      const updated = await r.json();
      if (updated.gallery?.slug && updated.gallery.slug !== currentSlug) {
        // Gallery slug changed, redirect to new URL
        window.location.href = `/galleries/${updated.gallery.slug}/settings`;
        return;
      }
      // Update local state with new data
      setSlug(updated.gallery?.slug ?? slug);
    }
    setSaving(false);
  }

  // === Cover Functions ===
  async function uploadCover(galleryId: string, file: File) {
    // 1) Presigned URL holen (wir legen die Datei unter g/<galleryId>/cover-<timestamp> ab)
    const r1 = await fetch("/api/uploads/s3-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        galleryId,
        filename: `cover-${Date.now()}-${file.name}`,
        contentType: file.type || "application/octet-stream",
      }),
    });
    const { url, key } = await r1.json();

    // 2) Hochladen
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });

    // 3) coverKey speichern
    const r2 = await fetch(`/api/galleries/by-slug/${currentSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverKey: key }),
    });
    if (!r2.ok) throw new Error("Cover speichern fehlgeschlagen");
  }

  async function setAutoCover() {
    // coverKey entfernen ⇒ API nimmt automatisch Mosaik/erstes Bild
    const r = await fetch(`/api/galleries/by-slug/${currentSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverKey: null }),
    });
    if (!r.ok) alert("Konnte Cover nicht zurücksetzen");
  }

  // === Effects ===
  useEffect(() => { 
    load(); 
  }, [currentSlug]);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Einstellungen: {title}</h1>
        <a 
          href={`/galleries/${currentSlug}`}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition"
        >
          ← Zurück zur Galerie
        </a>
      </div>

      {loading ? (
        <div className="text-gray-500">Lade …</div>
      ) : (
        <div className="space-y-4">
          {/* Gallery Information */}
          <div className="border rounded p-4 space-y-3">
            <div className="font-semibold">Galerie-Information</div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Galerie-Titel"
                  />
                  <button
                    onClick={async () => await save({ title })}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {saving ? "..." : "Speichern"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL-Slug</label>
                <div className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  /galleries/{slug}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Der Slug wird automatisch aus dem Titel generiert. Bei Änderungen wird eine Weiterleitung eingerichtet.
                </div>
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="border rounded p-4 space-y-3">
            <div className="font-semibold">Sichtbarkeit</div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={async (e) => { 
                  setIsPublic(e.target.checked); 
                  await save({ isPublic: e.target.checked }); 
                }}
              />
              Öffentlich
            </label>
          </div>

          {/* Display Settings */}
          <div className="border rounded p-4 space-y-3">
            <div className="font-semibold">Anzeige</div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showIndexOverlay}
                onChange={async (e) => { 
                  setShowIndexOverlay(e.target.checked); 
                  await save({ showIndexOverlay: e.target.checked }); 
                }}
              />
              Bildnummern wie Lightroom einblenden
            </label>
          </div>

          {/* Cover Settings */}
          <div className="border rounded p-4 space-y-3">
            <div className="font-semibold">Cover</div>
            <div className="text-sm text-gray-600">
              Entweder <b>automatisch</b> (aus den ersten Bildern/Mosaik) oder <b>manuell hochladen</b>.
            </div>
            <div className="flex gap-3 items-center">
              <button
                className="px-3 py-2 border rounded hover:bg-gray-50 transition"
                onClick={async () => { 
                  await setAutoCover(); 
                  alert("Cover auf automatisch gesetzt"); 
                }}
              >
                Automatisch verwenden
              </button>
              <label className="px-3 py-2 border rounded cursor-pointer hover:bg-gray-50 transition">
                Manuell hochladen
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // Hole die Gallery-ID aus dem GET (wir haben sie in d.gallery.id)
                    const r = await fetch(`/api/galleries/by-slug/${currentSlug}`);
                    const d = await r.json();
                    const gid = d?.gallery?.id as string | undefined;
                    if (!gid) return alert("Galerie nicht gefunden");
                    try {
                      await uploadCover(gid, file);
                      alert("Cover gespeichert");
                    } catch (err: any) {
                      alert(err?.message ?? "Fehler beim Cover-Upload");
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}