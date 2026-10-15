"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
        <p>Silakan muat ulang aplikasi.</p>
        <button className="rounded-md border px-4 py-2" onClick={reset}>
          Coba lagi
        </button>
      </body>
    </html>
  );
}
