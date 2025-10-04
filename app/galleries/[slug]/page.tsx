"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// === Types ===
type ImageItem = { id: string; url: string };
type ApiResult = { gallery: { id: string; title: string; slug: string; isPublic?: boolean; showIndexOverlay?: boolean }, items: ImageItem[], hasMore: boolean };

export default function GalleryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  
  // === Gallery State ===
  const [galleryId, setGalleryId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // === Viewer State ===
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number>(-1);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // === Zoom/Pan State ===
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [baseW, setBaseW] = useState(0);
  const [baseH, setBaseH] = useState(0);
  const dragStart = useRef<{x:number;y:number;tx:number;ty:number}|null>(null);
  const containerRef = useRef<HTMLDivElement|null>(null);
  const imgRef = useRef<HTMLImageElement|null>(null);

  // === Upload State ===
  const [uploads, setUploads] = useState<{
    name: String;
    size: number;
    loaded: number;
    progress: number;
    done: boolean;
    error?: string
  }[]>([]);
  const dropRef = useRef<HTMLDivElement|null>(null);
  // === Helper Functions ===
  function measureBaseSize() {
    const el = imgRef.current; 
    if (!el) return;
    const r = el.getBoundingClientRect(); 
    setBaseW(r.width); 
    setBaseH(r.height);
  }

  function clampZoom(z: number) { 
    return Math.min(6, Math.max(1, z)); 
  }

  function clampPan(nx: number, ny: number) {
    const c = containerRef.current; 
    if (!c || !baseW || !baseH) return { x: nx, y: ny };
    const cw = c.clientWidth, ch = c.clientHeight; 
    const sw = baseW * scale, sh = baseH * scale;
    const maxX = Math.max(0, (sw - cw) / 2), maxY = Math.max(0, (sh - ch) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, nx)), y: Math.max(-maxY, Math.min(maxY, ny)) };
  }

  function putWithProgress(url: string, file: File, onProgress: (l: number, t: number) => void) {
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

  // === Zoom Controls ===
  function onWheelZoom(e: React.WheelEvent) {
    e.preventDefault(); 
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2, cy = e.clientY - rect.top - rect.height / 2;
    const target = clampZoom(scale + (e.deltaY > 0 ? -0.2 : 0.2));
    if (target === 1) { setScale(1); setTx(0); setTy(0); return; }
    const k = target / scale - 1; 
    const nx = tx - cx * k, ny = ty - cy * k; 
    const clamped = clampPan(nx, ny);
    setTx(clamped.x); setTy(clamped.y); setScale(target);
  }

  function startDrag(e: React.MouseEvent) { 
    e.preventDefault(); 
    setDragging(true); 
    dragStart.current = { x: e.clientX, y: e.clientY, tx, ty }; 
  }

  function onDrag(e: React.MouseEvent) { 
    if (!dragging || !dragStart.current) return; 
    const dx = e.clientX - dragStart.current.x, dy = e.clientY - dragStart.current.y; 
    const cl = clampPan(dragStart.current.tx + dx, dragStart.current.ty + dy); 
    setTx(cl.x); setTy(cl.y); 
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
    const t = clampZoom(scale + 0.25); 
    if (t === 1) return fitToScreen(); 
    setScale(t); 
    const cl = clampPan(tx, ty); 
    setTx(cl.x); setTy(cl.y); 
  }

  function zoomOut() { 
    const t = clampZoom(scale - 0.25); 
    if (t === 1) return fitToScreen(); 
    setScale(t); 
    const cl = clampPan(tx, ty); 
    setTx(cl.x); setTy(cl.y); 
  }

  // === Viewer Functions ===
  async function openViewerAt(idx: number) {
    setViewerIndex(idx); 
    setViewerOpen(true); 
    setViewerLoading(true);
    try {
      const id = images[idx]?.id; 
      if (!id) return;
      const r = await fetch(`/api/images/${id}`); 
      const d = await r.json();
      setViewerUrl(d.fullUrl || d.url);
    } finally { 
      setViewerLoading(false); 
    }
  }

  function closeViewer() { 
    setViewerOpen(false); 
    setViewerUrl(null); 
    setViewerIndex(-1); 
  }

  async function nextImage() { 
    if (viewerIndex < 0) return; 
    const n = (viewerIndex + 1) % images.length; 
    await openViewerAt(n); 
  }

  async function prevImage() { 
    if (viewerIndex < 0) return; 
    const p = (viewerIndex - 1 + images.length) % images.length; 
    await openViewerAt(p); 
  }

  // === Gallery Functions ===
  async function togglePublic(next: boolean) {
    if (!slug) return;
    const r = await fetch(`/api/galleries/by-slug/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: next }),
    });
    if (r.ok) setIsPublic(next);
    else alert("Konnte Sichtbarkeit nicht speichern");
  }

  async function load(reset = false) {
    if (loading) return;
    setLoading(true);
    const p = reset ? 1 : page;
    
    try {
      const res = await fetch(`/api/galleries/by-slug/${slug}?page=${p}&limit=24`);
      
      // Handle 404 - check for redirects
      if (res.status === 404) {
        const redirectRes = await fetch(`/api/galleries/redirect/${slug}`);
        if (redirectRes.ok) {
          const { newSlug } = await redirectRes.json();
          router.replace(`/galleries/${newSlug}`);
          return;
        }
        // No redirect found, gallery really doesn't exist
        throw new Error("Gallery not found");
      }
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data: ApiResult = await res.json();
      if (reset) {
        setImages(data.items);
        setTitle(data.gallery.title);
        setIsPublic(Boolean(data.gallery?.isPublic));
        setShowNumbers(Boolean(data.gallery?.showIndexOverlay));
        setGalleryId(data.gallery.id);
      } else {
        setImages((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.hasMore);
      setPage(p + 1);
    } catch (error) {
      console.error("Error loading gallery:", error);
      // Could show an error message to user here
    } finally {
      setLoading(false);
    }
  }

  async function uploadMany(files: FileList) {
    if (!galleryId) return alert("Galerie nicht geladen");
    const arr = Array.from(files);
    setUploads(arr.map(f => ({ name: f.name, size: f.size, loaded: 0, progress: 0, done: false })));

    await Promise.all(arr.map(async (file, idx) => {
      try {
        const r1 = await fetch("/api/uploads/s3-url", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ galleryId, filename: file.name, contentType: file.type || "application/octet-stream" }),
        });
        const { url, key } = await r1.json();

        await putWithProgress(url, file, (loaded, total) => {
          const pct = Math.round((loaded / (total || file.size || 1)) * 100);
          setUploads(u => { const c = [...u]; c[idx] = { ...c[idx], loaded, progress: pct }; return c; });
        });

        const created = await fetch("/api/images", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ galleryId, key }),
        }).then(r => r.json());

        await fetch(`/api/images/${created.id}/process`, { method: "POST" });
        const withUrl = await fetch(`/api/images/${created.id}`).then(r => r.json());
        setImages(prev => [withUrl, ...prev]);

        setUploads(u => { const c = [...u]; c[idx] = { ...c[idx], done: true, loaded: c[idx].size, progress: 100 }; return c; });
      } catch (e: any) {
        setUploads(u => { const c = [...u]; c[idx] = { ...c[idx], done: true, error: e?.message || "Fehler" }; return c; });
      }
    }));
  }

  // === Effects ===
  useEffect(() => { 
    setImages([]); 
    setPage(1); 
    setHasMore(true); 
    load(true); 
  }, [slug]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) load(false);
    }, { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, page, slug]);

  useEffect(() => { 
    if (viewerOpen) { 
      const prev = document.body.style.overflow; 
      document.body.style.overflow = "hidden"; 
      return () => { document.body.style.overflow = prev }; 
    }
  }, [viewerOpen]);

  useEffect(() => { 
    setScale(1); 
    setTx(0); 
    setTy(0); 
  }, [viewerUrl, viewerIndex]);

  useEffect(() => {
    const el = dropRef.current; 
    if (!el) return;
    const onPrevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      const files = e.dataTransfer?.files; 
      if (files && files.length) uploadMany(files);
    };
    el.addEventListener("dragenter", onPrevent);
    el.addEventListener("dragover", onPrevent);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragenter", onPrevent);
      el.removeEventListener("dragover", onPrevent);
      el.removeEventListener("drop", onDrop);
    };
  }, [galleryId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (!viewerOpen) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") { e.preventDefault(); nextImage(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prevImage(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, viewerIndex, images]);

  return (
    <main className="p-6 space-y-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{title || slug}</h1>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            multiple 
            onChange={(e) => e.target.files && uploadMany(e.target.files)} 
          />

          <div
            ref={dropRef}
            className="border-dashed border-2 rounded px-3 py-2 text-sm text-gray-600"
            title="Dateien hierher ziehen"
          >
            Dateien hier ablegen
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => togglePublic(e.target.checked)}
            />
            Öffentlich
          </label>

          <a 
            href={`/galleries/${slug}/settings`}
            className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 transition text-sm"
          >
            Einstellungen
          </a>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <div key={img.id} className="relative group">
            <img
              src={img.url}
              alt=""
              className="w-full aspect-square object-cover rounded shadow cursor-zoom-in"
              onClick={() => openViewerAt(idx)}
            />
            {showNumbers && (
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                {idx + 1}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center text-xs text-gray-500">
        {loading ? "Lade ..." : hasMore ? "Scrollen für mehr" : images.length ? "Ende" : ""}
      </div>

      {/* Image Viewer Modal */}
      {viewerOpen && (
        <div
          onClick={closeViewer}
          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <div
            ref={containerRef}
            className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={onWheelZoom}
            onMouseDown={startDrag}
            onMouseMove={onDrag}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            style={{ cursor: dragging ? "grabbing" : (scale > 1 ? "grab" : "default") }}
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
                onDoubleClick={(e) => { 
                  e.stopPropagation(); 
                  setScale(s => (s >= 1.5 ? 1 : 2)); 
                  setTx(0); 
                  setTy(0); 
                }}
                onLoad={() => setTimeout(measureBaseSize, 0)}
              />
            )}

            {/* Viewer Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); zoomOut(); }} 
                className="px-3 py-1 text-sm bg-white/90 rounded"
              >
                −
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); fitToScreen(); }} 
                className="px-3 py-1 text-sm bg-white/90 rounded"
              >
                100%
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); zoomIn(); }} 
                className="px-3 py-1 text-sm bg-white/90 rounded"
              >
                +
              </button>
              <button 
                onClick={closeViewer} 
                className="px-3 py-1 text-sm bg-white/90 rounded"
              >
                Schließen (Esc)
              </button>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black px-3 py-2 rounded"
            >
              ←
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black px-3 py-2 rounded"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Upload Progress Panel */}
      {uploads.length > 0 && (
        <div className="fixed bottom-4 right-4 w-80 bg-white border shadow-xl rounded p-3 space-y-3">
          <div className="font-semibold">Uploads</div>
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
          <button className="text-sm underline" onClick={() => setUploads([])}>
            Schließen
          </button>
        </div>
      )}
    </main>
  );
}
