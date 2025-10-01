"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Gallery = { id: string; title: string };
type ImageItem = { id: string; url: string };
type UploadItem = {
  name: string; size: number; loaded: number; progress: number;
  startedAt?: number; done: boolean; error?: string;
};

export default function Home() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [active, setActive] = useState<Gallery | null>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [msg, setMsg] = useState("");
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // -------- Daten laden ----------
  async function loadGalleries() {
    const res = await fetch("/api/galleries");
    const data = await res.json();
    setGalleries(data);
    if (!active && data[0]) setActive(data[0]);
  }

  async function loadPage(reset = false) {
  if (!active || loading) return;
  setLoading(true);
  const nextPage = reset ? 1 : page;

  try {
    const res = await fetch(`/api/galleries/${active.id}/images?page=${nextPage}&limit=24`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items: ImageItem[] = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
      ? data
      : [];

    // Nur Bilder mit gültiger URL übernehmen
    const valid = items.filter((it) => it && typeof it.url === "string" && it.url.length > 0);

    // Wenn die Seite leer ist → hatMore = false, nichts anhängen
    if (valid.length === 0) {
      if (reset) setImages([]); // beim Reset leeren
      setHasMore(false);
      return;
    }

    setImages((prev) => (reset ? valid : [...prev, ...valid]));
    setHasMore(Boolean(data?.hasMore ?? (valid.length > 0)));
    setPage(nextPage + 1);
  } catch (e) {
    console.error("loadPage error:", e);
    if (reset) setImages([]);
    setHasMore(false);
  } finally {
    setLoading(false);
  }
}

  useEffect(() => { loadGalleries(); }, []);
  useEffect(() => { if (active) { setImages([]); setPage(1); setHasMore(true); loadPage(true); } }, [active]);

  // Infinite Scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) loadPage();
    }, { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef, hasMore, loading, active, page]); // deps

  // -------- Galerie anlegen ----------
  async function create() {
    const res = await fetch("/api/galleries", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const g = await res.json();
    setTitle(""); setActive(g); loadGalleries();
  }

  // -------- Upload mit Fortschritt ----------
  function putWithProgress(url: string, file: File, onProgress: (loaded: number, total: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded, e.total); };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });
  }

  async function uploadMany(files: FileList) {
    if (!active) return alert("Erst Galerie wählen/anlegen");
    const arr = Array.from(files);
    setUploads(arr.map((f) => ({ name: f.name, size: f.size, loaded: 0, progress: 0, done: false })));

    const chunks = (xs: File[], n = 3) => xs.reduce((a, _, i) => (i % n ? a : [...a, xs.slice(i, i + n)]), [] as File[][]);

    let processed = 0;
    for (const group of chunks(arr, 3)) {
      await Promise.all(group.map(async (file) => {
        const idx = arr.findIndex((f) => f === file);
        try {
          const r1 = await fetch("/api/uploads/s3-url", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ galleryId: active.id, filename: file.name, contentType: file.type || "application/octet-stream" }),
          });
          const { url, key } = await r1.json();

          setUploads((u) => { const c = [...u]; c[idx] = { ...c[idx], startedAt: Date.now() }; return c; });

          await putWithProgress(url, file, (loaded, total) => {
            const pct = Math.round((loaded / (total || file.size || 1)) * 100);
            setUploads((u) => { const c = [...u]; c[idx] = { ...c[idx], loaded, progress: pct }; return c; });
          });

          const created = await fetch("/api/images", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ galleryId: active.id, key }),
          }).then((r) => r.json());

          await fetch(`/api/images/${created.id}/process`, { method: "POST" });

          // Nur das neue Bild abrufen und VORNE einfügen (kein Komplett-Reload)
          const withUrl = await fetch(`/api/images/${created.id}`).then((r) => r.json());
          setImages((prev) => [withUrl, ...prev]);

          setUploads((u) => { const c = [...u]; c[idx] = { ...c[idx], done: true, loaded: c[idx].size, progress: 100 }; return c; });
        } catch (e: any) {
          setUploads((u) => { const c = [...u]; c[idx] = { ...c[idx], error: e?.message || "Fehler", done: true }; return c; });
        } finally {
          processed++;
        }
      }));
    }
    setMsg(`Upload fertig: ${processed}/${arr.length}`);
  }

  // -------- Löschen (optimistisch) ----------
  async function deleteImage(id: string) {
    const old = images;
    setImages((prev) => prev.filter((i) => i.id !== id));
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (!res.ok) setImages(old); // rollback bei Fehler
  }

  async function deleteGallery(id: string) {
    if (!confirm("Galerie und alle Bilder wirklich löschen?")) return;
    await fetch(`/api/galleries/${id}`, { method: "DELETE" });
    setActive(null); setImages([]); setPage(1); setHasMore(true);
    loadGalleries();
  }

  // -------- Zusammenfassung Uploads ----------
  const finished = useMemo(() => uploads.filter((u) => u.done && !u.error).length, [uploads]);
  const failed = useMemo(() => uploads.filter((u) => !!u.error).length, [uploads]);
  const remaining = useMemo(() => uploads.filter((u) => !u.done && !u.error), [uploads]);
  const aggSpeed = useMemo(() => {
    const now = Date.now();
    const totalBytesPerSec = remaining.reduce((sum, u) => {
      if (!u.startedAt) return sum;
      const dt = (now - u.startedAt) / 1000;
      return dt > 0 ? sum + u.loaded / dt : sum;
    }, 0);
    const mbps = totalBytesPerSec / (1024 * 1024);
    return `${mbps.toFixed(mbps >= 10 ? 0 : 1)} MB/s`;
  }, [remaining]);

  const allDone = uploads.length > 0 && uploads.every((u) => u.done);

  // -------- UI ----------
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Nalumina Pictures</h1>

      <div className="flex gap-2 items-center">
        <input className="border p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Galerie-Titel" />
        <button onClick={create} className="bg-black text-white px-3 py-2 rounded">Anlegen</button>
        {active && <button onClick={() => deleteGallery(active.id)} className="bg-red-600 text-white px-3 py-2 rounded">Galerie löschen</button>}
      </div>

      <div className="flex items-center gap-3">
        <label>Aktive Galerie:</label>
        <select className="border p-2 rounded" value={active?.id || ""} onChange={(e) => setActive(galleries.find((g) => g.id === e.target.value) || null)}>
          <option value="" disabled>— wählen —</option>
          {galleries.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
        {active && <input type="file" multiple onChange={(e)=> e.target.files && uploadMany(e.target.files)} />}
      </div>

      <p className="text-sm text-gray-600">{msg}</p>

      <div className="grid grid-cols-3 gap-4">
  {(images ?? []).filter(i => i && i.url).map((img) => (
    <div key={img.id} className="relative group">
      <img src={img.url} alt="preview" className="w-full aspect-square object-cover rounded shadow" />
      <button onClick={() => deleteImage(img.id)} className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-80 hover:opacity-100">🗑️</button>
    </div>
  ))}
</div>


      {/* Infinite-scroll Sentinel */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-gray-500">
        {loading ? "Lade ..." : hasMore ? "Scrollen für mehr" : images.length ? "Ende" : ""}
      </div>

      {/* Upload-Toast */}
      {uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white border shadow-xl rounded p-3 space-y-3">
          <div className="font-semibold">Uploads</div>
          <div className="text-sm space-y-1">
            <div>Fertig: <span className="font-semibold">{finished}</span></div>
            <div>Fehlgeschlagen: <span className="font-semibold">{failed}</span></div>
            <div>Verbleibend: <span className="font-semibold">{remaining.length}</span>{remaining.length > 0 && <span> — Geschwindigkeit: <span className="font-semibold">{aggSpeed}</span></span>}</div>
          </div>
          <div className="max-h-64 overflow-auto space-y-2">
            {uploads.map((u, i) => (
              <div key={i}>
                <div className="text-xs truncate">{u.name}</div>
                <div className="h-2 bg-gray-200 rounded">
                  <div className={`h-2 rounded ${u.error ? "bg-red-500" : u.done ? "bg-green-600" : "bg-blue-600"}`} style={{ width: `${u.progress || (u.done ? 100 : 0)}%` }} />
                </div>
                {u.error && <div className="text-xs text-red-600">Fehler: {u.error}</div>}
              </div>
            ))}
          </div>
          {allDone && <button className="text-sm underline" onClick={() => setUploads([])}>Schließen</button>}
        </div>
      )}
    </main>
  );
}
