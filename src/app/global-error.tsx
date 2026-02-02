"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="nl">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Er ging iets mis
          </h1>
          <p className="text-gray-600 mb-6">
            Er is een onverwachte fout opgetreden. Probeer de pagina opnieuw te
            laden.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </body>
    </html>
  );
}
