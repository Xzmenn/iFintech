import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-3xl font-semibold">Halaman tidak ditemukan</h1>
      <p className="text-muted-foreground">
        Halaman yang Anda cari mungkin sudah dipindahkan.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke beranda</Link>
      </Button>
    </main>
  );
}
