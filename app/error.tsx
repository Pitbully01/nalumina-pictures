// === Global Error Boundary ===
"use client";

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-red-600">500</h1>
          <h2 className="text-2xl font-semibold text-gray-700">Etwas ist schiefgelaufen</h2>
          <p className="text-gray-600 max-w-md">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">
                Fehlerdetails (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={reset}
            className="inline-block px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition mr-3"
          >
            Erneut versuchen
          </button>
          
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
