"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <p className="max-w-md text-muted-foreground">
        Maaf, halaman ini mengalami kendala. Silakan coba lagi.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </main>
  );
}
