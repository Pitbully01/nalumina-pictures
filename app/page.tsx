"use client";
import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

// === Types ===
type PublicGallery = { 
  title: string; 
  slug: string; 
  cover: string | null; 
  mosaic?: string[] 
};

export default function Home() {
  const { data: session } = useSession();
  const [items, setItems] = useState<PublicGallery[]>([]);
  const [loading, setLoading] = useState(true);

  // === Data Loading ===
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public-galleries");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // === Event Handlers ===
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget as HTMLFormElement;
    const email = (f.elements.namedItem("email") as HTMLInputElement).value;
    const password = (f.elements.namedItem("password") as HTMLInputElement).value;
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) alert("Login fehlgeschlagen");
  };

  const handleLogout = () => signOut({ redirect: false });

  return (
    <main className="p-6 space-y-8">
      {/* Header Section */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nalumina Pictures</h1>
        <div className="flex items-center gap-2 text-sm">
          {session?.user?.email ? (
            <>
              <span>Eingeloggt als <b>{session.user.email}</b></span>
              <button 
                onClick={handleLogout} 
                className="px-2 py-1 border rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <form className="flex gap-2 items-center" onSubmit={handleLogin}>
              <input 
                name="email" 
                className="border p-2 rounded" 
                placeholder="E-Mail" 
              />
              <input 
                name="password" 
                type="password" 
                className="border p-2 rounded" 
                placeholder="Passwort" 
              />
              <button 
                className="bg-black text-white px-3 py-2 rounded" 
                type="submit"
              >
                Login
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Public Galleries Section */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Öffentliche Galerien</h2>
          <a href="/galleries" className="text-sm underline">
            Meine Galerien →
          </a>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Lade …</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500 text-sm">Noch keine öffentlichen Galerien.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((g) => (
              <a key={g.slug} href={`/galleries/${g.slug}`} className="block group">
                <div className="w-full aspect-[4/3] bg-gray-100 rounded overflow-hidden">
                  {g.cover ? (
                    <img
                      src={g.cover}
                      alt={g.title}
                      className="w-full h-full object-cover group-hover:opacity-90 transition"
                    />
                  ) : g.mosaic && g.mosaic.length > 0 ? (
                    <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                      {g.mosaic.slice(0, 4).map((m, i) => (
                        <img 
                          key={i} 
                          src={m} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                      Kein Cover
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm font-medium">{g.title}</div>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
