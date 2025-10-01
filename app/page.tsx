"use client";
import { useEffect, useState } from "react";

type Gallery = { id: string; title: string };
type Image = { id: string; url: string };

export default function Home() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [active, setActive] = useState<Gallery | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [msg, setMsg] = useState("");
  const [title, setTitle] = useState("");

  async function load() {
    const res = await fetch("/api/galleries");
    const data = await res.json();
    setGalleries(data);
    if (!active && data[0]) setActive(data[0]);
  }

  async function loadImages(galleryId: string) {
    const res = await fetch(`/api/galleries/${galleryId}/images`);
    const imgs = await res.json();
    // für jedes Bild das signed GET-Url holen
    const withUrls = await Promise.all(
      imgs.map(async (img: any) => {
        const r = await fetch(`/api/images/${img.id}`);
        return await r.json();
      })
    );
    setImages(withUrls);
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
    load();
  }

  async function upload(file: File) {
    if (!active) return alert("Erst Galerie wählen/anlegen");
    const r1 = await fetch("/api/uploads/s3-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        galleryId: active.id,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      }),
    });
    const { url, key } = await r1.json();
    await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type }});
    await fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ galleryId: active.id, key }),
    });
    setMsg(`Upload OK → ${key}`);
    loadImages(active.id);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (active) loadImages(active.id); }, [active]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Nalumina Pictures</h1>

      <div className="flex gap-2">
        <input className="border p-2 rounded" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Galerie-Titel" />
        <button onClick={create} className="bg-black text-white px-3 py-2 rounded">Anlegen</button>
      </div>

      <div className="flex items-center gap-3">
        <label>Aktive Galerie:</label>
        <select className="border p-2 rounded" value={active?.id || ""} onChange={(e) => setActive(galleries.find(g => g.id === e.target.value) || null)}>
          <option value="" disabled>— wählen —</option>
          {galleries.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
        <input type="file" onChange={(e)=> e.target.files && upload(e.target.files[0])} />
      </div>

      <p className="text-sm text-gray-600">{msg}</p>

      <div className="grid grid-cols-3 gap-4">
        {images.map(img => (
          <img key={img.id} src={img.url} alt="preview" className="w-full object-cover rounded shadow" />
        ))}
      </div>
    </main>
  );
}
