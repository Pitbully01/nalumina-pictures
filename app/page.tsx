"use client";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

// ===== TYPE DEFINITIONS =====
type Gallery = { id: string; title: string };
type ImageItem = { id: string; url: string };
type UploadItem = {
  name: string;
  size: number;
  loaded: number;
  progress: number;
  startedAt?: number;
  done: boolean;
  error?: string;
};

export default function Home() {
  // ===== SESSION STATE =====
  const { data: session } = useSession();

  // ===== GALLERY STATE =====
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [active, setActive] = useState<Gallery | null>(null);
  const [title, setTitle] = useState("");

  // ===== IMAGES STATE =====
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // ===== UPLOAD STATE =====
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [msg, setMsg] = useState("");

  // ===== VIEWER STATE =====
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(-1);

  // ===== ZOOM/PAN STATE =====
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [baseW, setBaseW] = useState(0);
  const [baseH, setBaseH] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{x:number;y:number;tx:number;ty:number} | null>(null);

  // ===== REFS =====
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement|null>(null);
  const imgRef = useRef<HTMLImageElement|null>(null);

  // ===== GALLERY FUNCTIONS =====
  async function loadGalleries() {
    const res = await fetch("/api/galleries");
    const data = await res.json();
    setGalleries(data);
    if (!active && data[0]) setActive(data[0]);
  }

  async function create() {
    const res = await fetch("/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const g = await res.json();
    setTitle("");
    setActive(g);
    loadGalleries();
  }

  async function deleteGallery(id: string) {
    if (!confirm("Galerie und alle Bilder wirklich löschen?")) return;
    await fetch(`/api/galleries/${id}`, { method: "DELETE" });
    setActive(null);
    setImages([]);
    setPage(1);
    setHasMore(true);
    loadGalleries();
  }

  // ===== IMAGE FUNCTIONS =====
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

      const valid = items.filter((it) => it && typeof it.url === "string" && it.url.length > 0);

      if (valid.length === 0) {
        if (reset) setImages([]);
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

  async function deleteImage(id: string) {
    const old = images;
    setImages((prev) => prev.filter((i) => i.id !== id));
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (!res.ok) setImages(old); // rollback bei Fehler
  }

  // ===== VIEWER FUNCTIONS =====
  async function loadFullUrlByIndex(idx:number) {
    const item = images[idx];
    if(!item) return;
    setViewerLoading(true);
    try{
      const res = await fetch(`/api/images/${item.id}`);
      const data = await res.json();
      setViewerUrl(data.fullUrl || data.url);
    } finally {
      setViewerLoading(false);
    }
  }

  async function openViewerByIndex(idx: number) {
    setViewerIndex(idx);
    setViewerOpen(true);
    await loadFullUrlByIndex(idx);
  }

  async function openViewer(id: String) {
    const idx = images.findIndex(i => i.id === id);
    if (idx >= 0) await openViewerByIndex(idx);
  }

  async function nextImage() {
    if(viewerIndex < 0) return;
    const next = (viewerIndex +1) % images.length;
    setViewerIndex(next);
    await loadFullUrlByIndex(next);
  }

  async function prevImage() {
    if(viewerIndex < 0) return;
    const prev = (viewerIndex -1 + images.length) % images.length;
    setViewerIndex(prev);
    await loadFullUrlByIndex(prev);
  }

  async function closeViewer() {
    setViewerOpen(false);
    setViewerUrl(null);
    setViewerIndex(-1);
  }

  // ===== ZOOM/PAN FUNCTIONS =====
  function measureBaseSize() {
    const el = imgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBaseW(r.width);
    setBaseH(r.height);
  }

  function clampZoom(z:number) {
    return Math.min(6, Math.max(1, z)); // min = 1 (fit)
  }

  function clampPan(nx:number, ny:number) {
    const c = containerRef.current;
    if (!c || !baseW || !baseH) return { x: nx, y: ny };
    const cw = c.clientWidth;
    const ch = c.clientHeight;

    const scaledW = baseW * scale;
    const scaledH = baseH * scale;

    // wenn Bild kleiner als Container → zentrieren erzwingen
    const maxX = Math.max(0, (scaledW - cw) / 2);
    const maxY = Math.max(0, (scaledH - ch) / 2);

    return { x: Math.max(-maxX, Math.min(maxX, nx)), y: Math.max(-maxY, Math.min(maxY, ny)) };
  }

  function onWheelZoom(e: React.WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top  - rect.height / 2;
    const delta = e.deltaY > 0 ? -0.2 : 0.2;

    const targetScale = clampZoom(scale + delta);

    if (targetScale === 1) {
      // Fit → immer zentrieren
      setScale(1);
      setTx(0);
      setTy(0);
      return;
    }

    // Zoomen zum Mauspunkt
    const k = targetScale / scale - 1;
    const nx = tx - cx * k;
    const ny = ty - cy * k;
    const clamped = clampPan(nx, ny);

    setTx(clamped.x);
    setTy(clamped.y);
    setScale(targetScale);
  }

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx, ty };
  }

  function onDrag(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const nxt = dragStart.current.tx + dx;
    const nyt = dragStart.current.ty + dy;
    const clamped = clampPan(nxt, nyt);
    setTx(clamped.x);
    setTy(clamped.y);
  }

  function endDrag() {
    setDragging(false);
    dragStart.current = null;
  }

  function fitToScreen() {
    setScale(1);
    setTx(0);
    setTy(0);
  }

  function zoomIn() {
    const target = clampZoom(scale + 0.25);
    if (target === 1) return fitToScreen();
    setScale(target);
    const clamped = clampPan(tx, ty);
    setTx(clamped.x);
    setTy(clamped.y);
  }

  function zoomOut() {
    const target = clampZoom(scale - 0.25);
    if (target === 1) return fitToScreen();
    setScale(target);
    const clamped = clampPan(tx, ty);
    setTx(clamped.x);
    setTy(clamped.y);
  }


  // ===== UPLOAD HELPER FUNCTIONS =====
  function putWithProgress(url: string, file: File, onProgress: (loaded: number, total: number) => void) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total);
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });
  }

  // ===== UPLOAD FUNCTIONS =====
  async function uploadMany(files: FileList) {
    if (!active) return alert("Erst Galerie wählen/anlegen");
    const arr = Array.from(files);
    setUploads(arr.map((f) => ({
      name: f.name,
      size: f.size,
      loaded: 0,
      progress: 0,
      done: false
    })));

    const chunks = (xs: File[], n = 3) => xs.reduce((a, _, i) => (i % n ? a : [...a, xs.slice(i, i + n)]), [] as File[][]);

    let processed = 0;
    for (const group of chunks(arr, 3)) {
      await Promise.all(group.map(async (file) => {
        const idx = arr.findIndex((f) => f === file);
        try {
          const r1 = await fetch("/api/uploads/s3-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              galleryId: active.id,
              filename: file.name,
              contentType: file.type || "application/octet-stream"
            }),
          });
          const { url, key } = await r1.json();

          setUploads((u) => {
            const c = [...u];
            c[idx] = { ...c[idx], startedAt: Date.now() };
            return c;
          });

          await putWithProgress(url, file, (loaded, total) => {
            const pct = Math.round((loaded / (total || file.size || 1)) * 100);
            setUploads((u) => {
              const c = [...u];
              c[idx] = { ...c[idx], loaded, progress: pct };
              return c;
            });
          });

          const created = await fetch("/api/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ galleryId: active.id, key }),
          }).then((r) => r.json());

          await fetch(`/api/images/${created.id}/process`, { method: "POST" });

          const withUrl = await fetch(`/api/images/${created.id}`).then((r) => r.json());
          setImages((prev) => [withUrl, ...prev]);

          setUploads((u) => {
            const c = [...u];
            c[idx] = { ...c[idx], done: true, loaded: c[idx].size, progress: 100 };
            return c;
          });
        } catch (e: any) {
          setUploads((u) => {
            const c = [...u];
            c[idx] = { ...c[idx], error: e?.message || "Fehler", done: true };
            return c;
          });
        } finally {
          processed++;
        }
      }));
    }
    setMsg(`Upload fertig: ${processed}/${arr.length}`);
  }

  // ===== COMPUTED VALUES =====
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

  // ===== EFFECTS =====
  useEffect(() => {
    loadGalleries();
  }, []);

  useEffect(() => {
    if (active) {
      setImages([]);
      setPage(1);
      setHasMore(true);
      loadPage(true);
    }
  }, [active]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) loadPage();
    }, { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [sentinelRef, hasMore, loading, active, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!viewerOpen) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") { e.preventDefault(); nextImage(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); prevImage(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, viewerIndex, images]);

  useEffect(() => {
    if (!viewerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [viewerOpen]);

  useEffect(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, [viewerUrl, viewerIndex]);

  useEffect(() => {
    const t = setTimeout(measureBaseSize, 0);
    return () => clearTimeout(t);
  }, [viewerUrl]);

  // ===== RENDER =====
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Nalumina Pictures</h1>
      
      {/* Login Form */}
      <div className="flex items-center gap-2">
        <form className="flex gap-2 items-center" onSubmit={async e => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const email = (form.elements.namedItem("email") as HTMLInputElement).value;
          const password = (form.elements.namedItem("password") as HTMLInputElement).value;
          const res = await signIn("credentials", { email, password, redirect: false });
          if (res?.error) alert("Login fehlgeschlagen");
        }}>
          <input name="email" className="border p-2 rounded" placeholder="E-Mail" />
          <input name="password" type="password" className="border p-2 rounded" placeholder="Passwort" />
          <button className="bg-black text-white px-3 py-2 rounded" type="submit">Login</button>
        </form>
        <button onClick={() => signOut({ redirect: false })} className="px-3 py-2 rounded border">Logout</button>
      </div>

      {/* Session Status */}
      <div className="flex items-center gap-2 text-sm">
        {session?.user?.email ? (
          <>
            <span>Eingeloggt als <b>{session.user.email}</b></span>
            <button onClick={() => signOut({ redirect: false })} className="px-2 py-1 border rounded">Logout</button>
          </>
        ) : (
          <span>Nicht eingeloggt</span>
        )}
      </div>

      {/* Gallery Management */}
      <div className="flex gap-2 items-center">
        <input 
          className="border p-2 rounded" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Galerie-Titel" 
        />
        <button onClick={create} className="bg-black text-white px-3 py-2 rounded">Anlegen</button>
        {active && (
          <button onClick={() => deleteGallery(active.id)} className="bg-red-600 text-white px-3 py-2 rounded">
            Galerie löschen
          </button>
        )}
      </div>

      {/* Gallery Selection and File Upload */}
      <div className="flex items-center gap-3">
        <label>Aktive Galerie:</label>
        <select 
          className="border p-2 rounded" 
          value={active?.id || ""} 
          onChange={(e) => setActive(galleries.find((g) => g.id === e.target.value) || null)}
        >
          <option value="" disabled>— wählen —</option>
          {galleries.map((g) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
        {active && (
          <input 
            type="file" 
            multiple 
            onChange={(e) => e.target.files && uploadMany(e.target.files)} 
          />
        )}
      </div>

      {/* Status Message */}
      <p className="text-sm text-gray-600">{msg}</p>

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-4">
        {(images ?? []).filter(i => i && i.url).map((img) => (
          <div key={img.id} className="relative group">
            <img
              src={img.url}
              alt="preview"
              className="w-full aspect-square object-cover rounded shadow cursor-zoom-in"
              onClick={() => openViewer(img.id)}
            />
            <button
              onClick={() => deleteImage(img.id)}
              className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-80 hover:opacity-100"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-gray-500">
        {loading ? "Lade ..." : hasMore ? "Scrollen für mehr" : images.length ? "Ende" : ""}
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white border shadow-xl rounded p-3 space-y-3">
          <div className="font-semibold">Uploads</div>
          <div className="text-sm space-y-1">
            <div>Fertig: <span className="font-semibold">{finished}</span></div>
            <div>Fehlgeschlagen: <span className="font-semibold">{failed}</span></div>
            <div>
              Verbleibend: <span className="font-semibold">{remaining.length}</span>
              {remaining.length > 0 && (
                <span> — Geschwindigkeit: <span className="font-semibold">{aggSpeed}</span></span>
              )}
            </div>
          </div>
          <div className="max-h-64 overflow-auto space-y-2">
            {uploads.map((u, i) => (
              <div key={i}>
                <div className="text-xs truncate">{u.name}</div>
                <div className="h-2 bg-gray-200 rounded">
                  <div 
                    className={`h-2 rounded ${u.error ? "bg-red-500" : u.done ? "bg-green-600" : "bg-blue-600"}`} 
                    style={{ width: `${u.progress || (u.done ? 100 : 0)}%` }} 
                  />
                </div>
                {u.error && <div className="text-xs text-red-600">Fehler: {u.error}</div>}
              </div>
            ))}
          </div>
          {allDone && (
            <button className="text-sm underline" onClick={() => setUploads([])}>
              Schließen
            </button>
          )}
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewerOpen && (
        <div
          onClick={closeViewer}
          onWheel={(e)=>{ e.preventDefault(); e.stopPropagation(); }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <div
            ref={containerRef}
            className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e)=>e.stopPropagation()}
            onWheel={onWheelZoom}
            onMouseDown={startDrag}
            onMouseMove={onDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            style={{ cursor: dragging ? "grabbing" : (scale>1 ? "grab" : "default") }}
          >
            {viewerLoading ? (
              <div className="text-white">Lade …</div>
            ) : (
              <img
                ref={imgRef}
                src={viewerUrl ?? ""}
                alt="full"
                draggable={false}
                className="max-w-none select-none"
                style={{
                  transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                  transformOrigin: "center center",
                  willChange: "transform",
                  ...(scale <= 1 ? { maxHeight: "95vh", maxWidth: "95vw" } : {}),
                }}
                onDoubleClick={(e)=>{ e.stopPropagation(); setScale(s=> (s>=1.5 ? 1 : 2)); setTx(0); setTy(0); }}
                onLoad={() => setTimeout(measureBaseSize, 0)}
              />
            )}

            {/* Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <button onClick={(e)=>{ e.stopPropagation(); zoomOut(); }} className="px-3 py-1 text-sm bg-white/90 rounded">−</button>
              <button onClick={(e)=>{ e.stopPropagation(); fitToScreen(); }} className="px-3 py-1 text-sm bg-white/90 rounded">100%</button>
              <button onClick={(e)=>{ e.stopPropagation(); zoomIn(); }} className="px-3 py-1 text-sm bg-white/90 rounded">+</button>
              <button onClick={closeViewer} className="px-3 py-1 text-sm bg-white/90 rounded">Schließen (Esc)</button>
            </div>

            {/* Prev/Next */}
            <button
              onClick={(e)=>{ e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black px-3 py-2 rounded"
            >←</button>
            <button
              onClick={(e)=>{ e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black px-3 py-2 rounded"
            >→</button>
          </div>
        </div>
      )}
    </main>
  );
}
