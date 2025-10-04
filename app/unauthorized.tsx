"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';

// === Unauthorized Access Component ===
export default function Unauthorized() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-yellow-600">403</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Zugriff verweigert</h2>
          <p className="text-gray-600 max-w-md">
            {session ? 
              "Du hast keine Berechtigung, auf diese Seite zuzugreifen." :
              "Bitte melde dich an, um auf diese Seite zuzugreifen."
            }
          </p>
        </div>
        
        <div className="space-y-3">
          {!session ? (
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
            >
              Zur Anmeldung
            </Link>
          ) : (
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition"
            >
              Zur Startseite
            </Link>
          )}
          
          <div className="text-sm text-gray-500">
            <Link href="/galleries" className="underline hover:text-gray-700">
              Öffentliche Galerien
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
